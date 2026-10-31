"""
Flask companion web app.
Runs at http://localhost:7001
"""

import asyncio
import json
import re
import threading
import time as _time
import uuid
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import (
    Flask, render_template, request, redirect, url_for,
    flash, session, jsonify, g
)
from werkzeug.utils import secure_filename

from config import FLASK_SECRET, ADDON_PUBLIC_URL, CATALOG_PAGE_SIZE, LIBRARY_PAGE_SIZE, STREMIO_SERVER_URL
from db.schema import init_db, get_connection
import db.queries as Q
from companion.csv_import import parse_imdb_csv, parse_letterboxd_csv
from companion.url_import import scrape_list_url
from companion.paste_import import parse_paste_text, _extract_candidates

app = Flask(__name__)
app.secret_key = FLASK_SECRET
# Allow very large paste imports (default Werkzeug cap is 500 KB — way too small)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024   # 200 MB total request
try:
    # Werkzeug ≥ 2.3 only; guard so older envs don't crash on startup
    app.request_class.max_form_memory_size = 100 * 1024 * 1024
except AttributeError:
    pass

# ── Background import tracking ────────────────────────────────────────────────
# Maps session_id -> "processing" | "done" | "error:<message>"
# Kept in memory only; sessions are also persisted to DB for the preview page.
_import_status: dict = {}
_import_status_lock = threading.Lock()

# ── Library enrichment cache (in-memory + persistent disk) ───────────────────
_LIB_CACHE:  dict = {}   # pid -> {"items": list, "count": int, "ts": float}
_LIB_STATUS: dict = {}   # pid -> {"status": str, "progress": int, "done": int, "total": int, "msg": str}
_LIB_LOCK = threading.Lock()
_LIB_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _lib_cache_path(pid: str) -> str:
    return os.path.join(_LIB_ROOT, "data", f"lib_cache_{pid}.json")

def _lib_invalidate(pid: str) -> None:
    """Wipe in-memory and disk cache for a profile so next load rebuilds."""
    _LIB_CACHE.pop(pid, None)
    _LIB_STATUS.pop(pid, None)
    try:
        os.remove(_lib_cache_path(pid))
    except FileNotFoundError:
        pass


def _lib_cache_add_items(pid: str, imdb_ids: list, conn) -> None:
    """Prepend new items to the cache without a full rebuild.
    Fetches TMDB metadata only for the new IDs, then merges into existing cache.
    Falls back to invalidate if something goes wrong."""
    if not imdb_ids:
        return
    try:
        # Ensure cache is in memory (load from disk if needed)
        if pid not in _LIB_CACHE:
            items = _lib_load_disk(pid)
            if items:
                with _LIB_LOCK:
                    _LIB_CACHE[pid] = {"items": items, "count": len(items), "ts": _time.time()}
            else:
                return  # No cache yet — next library open will trigger normal build

        from addon.tmdb import get_metadata_batch
        meta_map = _run_async(get_metadata_batch(conn, imdb_ids))
        new_items = [
            meta_map.get(iid, {"imdb_id": iid, "title": iid, "poster": "", "year": None})
            for iid in imdb_ids
        ]
        with _LIB_LOCK:
            current   = _LIB_CACHE.get(pid, {})
            existing  = current.get("items", [])
            exist_ids = {it["imdb_id"] for it in existing}
            # Only prepend truly new items (dedup)
            to_add    = [it for it in new_items if it["imdb_id"] not in exist_ids]
            merged    = to_add + existing
            _LIB_CACHE[pid] = {"items": merged, "count": len(merged), "ts": _time.time()}
        _lib_save_disk(pid, merged, len(merged))
    except Exception:
        _lib_invalidate(pid)   # safety fallback


def _lib_cache_remove_items(pid: str, imdb_ids: list) -> None:
    """Remove items from the cache without a full rebuild."""
    if not imdb_ids:
        return
    try:
        if pid not in _LIB_CACHE:
            items = _lib_load_disk(pid)
            if items:
                with _LIB_LOCK:
                    _LIB_CACHE[pid] = {"items": items, "count": len(items), "ts": _time.time()}
            else:
                return

        remove_set = set(imdb_ids)
        with _LIB_LOCK:
            current  = _LIB_CACHE.get(pid, {})
            filtered = [it for it in current.get("items", [])
                        if it.get("imdb_id") not in remove_set]
            _LIB_CACHE[pid] = {"items": filtered, "count": len(filtered), "ts": _time.time()}
        _lib_save_disk(pid, filtered, len(filtered))
    except Exception:
        _lib_invalidate(pid)   # safety fallback

def _lib_is_valid(pid: str) -> bool:
    """In-memory cache is valid if it exists; _lib_invalidate() handles staleness."""
    return pid in _LIB_CACHE

def _lib_load_disk(pid: str):
    """Load from disk if the file exists. No time expiry — cache is explicitly
    invalidated by _lib_invalidate() whenever the watchlist changes."""
    try:
        path = _lib_cache_path(pid)
        if not os.path.exists(path):
            return None
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d.get("items"), list) and d["items"]:
            return d["items"]
    except Exception:
        pass
    return None

def _lib_save_disk(pid: str, items: list, count: int) -> None:
    path = _lib_cache_path(pid)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"count": count, "items": items, "ts": _time.time()}, f,
                  separators=(",", ":"))

def _lib_build_bg(pid: str, wl_count: int, app_ctx) -> None:
    """Background thread: enrich all watchlist items and write to cache."""
    with app_ctx:
        from db.schema import get_connection
        from addon.tmdb import get_metadata_batch
        conn = get_connection()
        try:
            _LIB_STATUS[pid] = {"status": "building", "progress": 1,
                                 "done": 0, "total": wl_count, "msg": "Loading watchlist IDs…"}
            all_ids = Q.get_watchlist(conn, pid, skip=0, limit=500000)
            total   = len(all_ids)
            _LIB_STATUS[pid].update({"total": total, "msg": f"Enriching {total:,} titles…"})

            chunk_size = 500
            out = {}
            for i in range(0, total, chunk_size):
                chunk    = all_ids[i : i + chunk_size]
                meta_map = _run_async(get_metadata_batch(conn, chunk))
                out.update(meta_map)
                done = min(i + chunk_size, total)
                _LIB_STATUS[pid] = {
                    "status":   "building",
                    "progress": int(done / total * 95) if total else 95,
                    "done":     done,
                    "total":    total,
                    "msg":      f"Processed {done:,} / {total:,}…",
                }

            # Re-query DB at the end to catch any items added WHILE this build
            # was running (they would be in the DB but not in all_ids)
            final_ids = Q.get_watchlist(conn, pid, skip=0, limit=500000)
            added_mid_build = [iid for iid in final_ids if iid not in set(all_ids)]
            if added_mid_build:
                extra = _run_async(get_metadata_batch(conn, added_mid_build))
                out.update(extra)

            items = [
                out.get(iid, {"imdb_id": iid, "title": iid, "poster": "", "year": None})
                for iid in final_ids
            ]
            _lib_save_disk(pid, items, len(items))
            _LIB_CACHE[pid] = {"items": items, "count": len(items), "ts": _time.time()}
            _LIB_STATUS[pid] = {"status": "done", "progress": 100,
                                 "done": len(items), "total": len(items), "msg": "Ready!"}
        except Exception as e:
            _LIB_STATUS[pid] = {"status": "error", "progress": 0,
                                 "done": 0, "total": 0, "msg": str(e)}
        finally:
            conn.close()


def _lib_sync_bg(pid: str, app_ctx) -> None:
    """Background thread: find items in DB but missing from cache and add them.
    Much faster than a full rebuild — only fetches metadata for the delta."""
    with app_ctx:
        from db.schema import get_connection
        from addon.tmdb import get_metadata_batch
        conn = get_connection()
        try:
            _LIB_STATUS[pid] = {"status": "building", "progress": 1,
                                 "done": 0, "total": 0, "msg": "Syncing cache with database…"}

            db_ids  = Q.get_watchlist(conn, pid, skip=0, limit=500000)
            db_set  = set(db_ids)

            # Load current cache
            cached  = _LIB_CACHE.get(pid, {}).get("items") or _lib_load_disk(pid) or []
            cache_set = {it["imdb_id"] for it in cached}

            missing  = [iid for iid in db_ids if iid not in cache_set]
            stale    = [it for it in cached if it["imdb_id"] in db_set]  # drop removed items

            _LIB_STATUS[pid].update({"total": len(missing),
                                     "msg": f"Fetching metadata for {len(missing):,} missing titles…"})

            if missing:
                meta_map = _run_async(get_metadata_batch(conn, missing))
                new_items = [
                    meta_map.get(iid, {"imdb_id": iid, "title": iid, "poster": "", "year": None})
                    for iid in missing
                ]
                # Prepend missing items (they're the most recent additions)
                merged = new_items + stale
            else:
                merged = stale

            # Re-order to match DB order (newest first)
            order = {iid: i for i, iid in enumerate(db_ids)}
            merged.sort(key=lambda it: order.get(it["imdb_id"], 999999))

            _lib_save_disk(pid, merged, len(merged))
            _LIB_CACHE[pid] = {"items": merged, "count": len(merged), "ts": _time.time()}
            _LIB_STATUS[pid] = {"status": "done", "progress": 100,
                                 "done": len(merged), "total": len(merged), "msg": "Ready!"}
        except Exception as e:
            _LIB_STATUS[pid] = {"status": "error", "progress": 0,
                                 "done": 0, "total": 0, "msg": str(e)}
        finally:
            conn.close()



@app.after_request
def add_cors(response):
    """Allow browser extension (and local dev) to call our JSON API endpoints."""
    origin = request.headers.get("Origin", "")
    # Allow extension origins (moz-extension://, chrome-extension://) and localhost
    if (origin.startswith("moz-extension://") or
            origin.startswith("chrome-extension://") or
            "localhost" in origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.route("/api/<path:p>", methods=["OPTIONS"])
def options_handler(p):
    """Handle preflight CORS requests from the extension."""
    return "", 204


# ── DB connection per request ─────────────────────────────────────────────────

def get_db():
    if "db" not in g:
        g.db = get_connection()
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


_db_initialised = False

@app.before_request
def ensure_db():
    global _db_initialised
    if not _db_initialised:
        init_db()
        # Purge stale import sessions on first request
        conn = get_connection()
        try:
            Q.import_sessions_purge_old(conn)
        finally:
            conn.close()
        _db_initialised = True


# ── Context processor — injects current_profile into every template ───────────

@app.context_processor
def inject_globals():
    profile_id = session.get("profile_id")
    profile = None
    if profile_id:
        profile = Q.get_profile(get_db(), profile_id)
    from config import TMDB_API_KEY
    return {
        "current_profile": profile,
        "addon_url": ADDON_PUBLIC_URL,
        "tmdb_key_missing": not bool(TMDB_API_KEY),
    }


def _require_profile():
    """Return current profile or redirect to profile page."""
    pid = session.get("profile_id")
    if not pid:
        flash("Please select a profile first.", "info")
        return None, redirect(url_for("profile_page"))
    profile = Q.get_profile(get_db(), pid)
    if not profile:
        session.pop("profile_id", None)
        flash("Profile not found. Please select another.", "danger")
        return None, redirect(url_for("profile_page"))
    return profile, None


def _run_async(coro):
    """Run an async coroutine from sync Flask code."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


def _enrich(imdb_ids):
    """Add TMDB metadata to a list of IMDB IDs."""
    from addon.tmdb import get_metadata_batch
    if not imdb_ids:
        return []
    meta_map = _run_async(get_metadata_batch(get_db(), imdb_ids))
    items = []
    for iid in imdb_ids:
        meta = meta_map.get(iid, {"imdb_id": iid, "title": iid, "poster": "", "year": None})
        items.append(meta)
    return items


# ── Pages ─────────────────────────────────────────────────────────────────────

@app.route("/")
def dashboard():
    profile, redir = _require_profile()
    if redir:
        return redir

    db = get_db()
    pid = profile["id"]

    stats = {
        "watchlist": Q.get_watchlist_count(db, pid),
        "not_interested": Q.skip_list_count(db, pid),
        "watched": db.execute(
            "SELECT COUNT(*) FROM watch_history WHERE profile_id=? AND completed=1", (pid,)
        ).fetchone()[0],
        "rated": db.execute(
            "SELECT COUNT(*) FROM ratings WHERE profile_id=?", (pid,)
        ).fetchone()[0],
        "lists": db.execute(
            "SELECT COUNT(*) FROM lists WHERE profile_id=?", (pid,)
        ).fetchone()[0],
    }

    recent_ids = Q.get_watchlist(db, pid, skip=0, limit=12)
    recent = _enrich(recent_ids)

    # ── Decade breakdown (from cached metadata for all watchlist items) ────
    decade_data = []
    try:
        rows = db.execute(
            "SELECT json_extract(mc.tmdb_data, '$.year') AS yr "
            "FROM watchlist w JOIN metadata_cache mc ON mc.imdb_id = w.imdb_id "
            "WHERE w.profile_id = ? AND yr IS NOT NULL AND yr != 'null'",
            (pid,)
        ).fetchall()
        dec_counts = {}
        for r in rows:
            yr = r[0]
            try:
                dec = (int(str(yr)[:4]) // 10) * 10
                k = f"{dec}s"
                dec_counts[k] = dec_counts.get(k, 0) + 1
            except (ValueError, TypeError):
                pass
        decade_data = sorted(dec_counts.items())
    except Exception:
        pass

    # ── Genre breakdown (from cached metadata — populated for newly cached items) ─
    genre_data = []
    try:
        rows = db.execute(
            "SELECT json_extract(mc.tmdb_data, '$.genres') AS genres_json "
            "FROM watchlist w JOIN metadata_cache mc ON mc.imdb_id = w.imdb_id "
            "WHERE w.profile_id = ? AND genres_json IS NOT NULL AND genres_json != '[]'",
            (pid,)
        ).fetchall()
        import json as _json
        g_counts = {}
        for r in rows:
            try:
                genres = _json.loads(r[0])
                for g in (genres or []):
                    g_counts[g] = g_counts.get(g, 0) + 1
            except Exception:
                pass
        genre_data = sorted(g_counts.items(), key=lambda x: -x[1])[:15]
    except Exception:
        pass

    return render_template("dashboard.html", stats=stats, recent=recent,
                           decade_data=decade_data, genre_data=genre_data)


@app.route("/library")
def library():
    import random as _random
    profile, redir = _require_profile()
    if redir:
        return redir

    db = get_db()
    pid = profile["id"]
    skip      = int(request.args.get("skip", 0))
    page_size = min(max(int(request.args.get("page_size", 100)), 1), 10000)

    # ── Active filters from query string ──────────────────────────────
    f_language   = request.args.get("language", "").strip().lower()
    f_type       = request.args.get("type", "").strip()
    f_min_stars  = request.args.get("min_stars", "")
    f_min_rating = request.args.get("min_rating", "")
    f_search     = request.args.get("search", "").strip()
    f_genre      = request.args.get("genre", "").strip()
    f_decade     = request.args.get("decade", "").strip()
    f_sort       = request.args.get("sort", "added")
    f_tag        = request.args.get("tag", "").strip()
    surprise     = request.args.get("surprise", "")

    # ── Serve from cache or trigger background build ───────────────────
    wl_count = Q.get_watchlist_count(db, pid)

    if _lib_is_valid(pid):
        all_items_raw = _LIB_CACHE[pid]["items"]
    else:
        disk = _lib_load_disk(pid)
        if disk is not None:
            _LIB_CACHE[pid] = {"items": disk, "count": wl_count, "ts": _time.time()}
            all_items_raw = disk
        else:
            with _LIB_LOCK:
                if _LIB_STATUS.get(pid, {}).get("status") != "building":
                    _LIB_STATUS[pid] = {"status": "building", "progress": 0,
                                        "done": 0, "total": wl_count, "msg": "Starting…"}
                    threading.Thread(
                        target=_lib_build_bg,
                        args=(pid, wl_count, app.app_context()),
                        daemon=True,
                    ).start()
            return render_template("library_loading.html", total=wl_count)

    # Work on shallow copies so we never mutate the cache
    all_items = [dict(i) for i in all_items_raw]

    # Attach personal ratings
    rating_map = {
        r["imdb_id"]: dict(r) for r in
        db.execute("SELECT * FROM ratings WHERE profile_id=?", (pid,)).fetchall()
    }
    for item in all_items:
        r = rating_map.get(item["imdb_id"])
        item["stars"] = r["stars"] if r else None

    # ── Apply filters ──────────────────────────────────────────────────
    filtered = all_items
    if f_language:
        filtered = [i for i in filtered if (i.get("language") or "").lower() == f_language]
    if f_type in ("movie", "series"):
        filtered = [i for i in filtered if i.get("type") == f_type]
    if f_min_stars:
        try:
            ms = int(f_min_stars)
            filtered = [i for i in filtered if (i.get("stars") or 0) >= ms]
        except ValueError:
            pass
    if f_min_rating:
        try:
            mr = float(f_min_rating)
            filtered = [i for i in filtered if (i.get("vote_average") or 0) >= mr]
        except ValueError:
            pass
    if f_search:
        q = f_search.lower()
        filtered = [i for i in filtered
                    if q in (i.get("title") or "").lower()
                    or q in (i.get("overview") or "").lower()]
    if f_genre:
        filtered = [i for i in filtered if f_genre in (i.get("genres") or [])]
    if f_decade:
        try:
            dec_start = int(f_decade.rstrip("s"))
            filtered = [i for i in filtered
                        if i.get("year") and dec_start <= int(i["year"]) < dec_start + 10]
        except (ValueError, AttributeError):
            pass
    if f_tag:
        tagged_ids = Q.tags_get_ids_by_tag(db, pid, f_tag)
        filtered = [i for i in filtered if i["imdb_id"] in tagged_ids]

    # ── Sort ───────────────────────────────────────────────────────────
    if f_sort == "year_desc":
        filtered.sort(key=lambda x: x.get("year") or "0", reverse=True)
    elif f_sort == "year_asc":
        filtered.sort(key=lambda x: x.get("year") or "9999")
    elif f_sort == "rating":
        filtered.sort(key=lambda x: x.get("vote_average") or 0, reverse=True)
    elif f_sort == "title":
        filtered.sort(key=lambda x: (x.get("title") or "").lower())
    # "added" = default (watchlist order, already correct)

    # ── Surprise redirect ──────────────────────────────────────────────
    if surprise and filtered:
        item = _random.choice(filtered)
        return redirect(url_for("title_page", imdb_id=item["imdb_id"]))

    # ── Build filter options ───────────────────────────────────────────
    lang_counts = {}
    genre_counts = {}
    decade_counts = {}
    for i in all_items:
        lang = i.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
        for g in (i.get("genres") or []):
            genre_counts[g] = genre_counts.get(g, 0) + 1
        yr = i.get("year")
        if yr:
            try:
                dec = (int(yr) // 10) * 10
                k = f"{dec}s"
                decade_counts[k] = decade_counts.get(k, 0) + 1
            except ValueError:
                pass

    lang_options   = sorted(lang_counts.items(),   key=lambda x: -x[1])
    genre_options  = sorted(genre_counts.items(),  key=lambda x: -x[1])
    decade_options = sorted(decade_counts.items())
    all_tags       = Q.tags_get_all(db, pid)

    total_filtered = len(filtered)
    page_items = filtered[skip: skip + page_size]

    # Attach personal tags to page items
    page_ids = [i["imdb_id"] for i in page_items]
    tag_map  = Q.tags_for_items(db, pid, page_ids)
    for item in page_items:
        item["_tags"] = tag_map.get(item["imdb_id"], [])

    return render_template(
        "library.html",
        items=page_items,
        total=total_filtered,
        total_unfiltered=len(all_items),
        skip=skip,
        page_size=page_size,
        lang_options=lang_options,
        genre_options=genre_options,
        decade_options=decade_options,
        all_tags=all_tags,
        f_language=f_language,
        f_type=f_type,
        f_min_stars=f_min_stars,
        f_min_rating=f_min_rating,
        f_search=f_search,
        f_genre=f_genre,
        f_decade=f_decade,
        f_sort=f_sort,
        f_tag=f_tag,
    )


@app.route("/title/<imdb_id>")
def title_page(imdb_id):
    profile, redir = _require_profile()
    if redir:
        return redir

    db = get_db()
    pid = profile["id"]

    from addon.tmdb import get_metadata
    meta = _run_async(get_metadata(db, imdb_id)) or {"imdb_id": imdb_id, "title": imdb_id}

    in_watchlist = Q.watchlist_contains(db, pid, imdb_id)
    in_skip_list = Q.skip_list_contains(db, pid, imdb_id)
    rating = Q.get_rating(db, pid, imdb_id)
    watch_status = Q.get_watch_status(db, pid, imdb_id)
    user_lists = Q.get_lists(db, pid)
    title_tags = Q.tags_get(db, pid, imdb_id)
    all_tags   = Q.tags_get_all(db, pid)
    from companion import stremio_sync as SS
    _sets = SS.shelf_sets(db, pid)
    shelf_on = [k for k in _sets if imdb_id in _sets[k]]
    stremio_row = db.execute("SELECT * FROM stremio_items WHERE id=?", (imdb_id,)).fetchone()

    return render_template(
        "title.html",
        imdb_id=imdb_id,
        meta=meta,
        in_watchlist=in_watchlist,
        in_skip_list=in_skip_list,
        rating=dict(rating) if rating else None,
        watch_status=dict(watch_status) if watch_status else None,
        user_lists=user_lists,
        title_tags=title_tags,
        all_tags=all_tags,
        shelves=SS.SHELVES,
        shelf_on=shelf_on,
        stremio_row=dict(stremio_row) if stremio_row else None,
    )


@app.route("/lists")
def lists_page():
    profile, redir = _require_profile()
    if redir:
        return redir
    lists = Q.get_lists(get_db(), profile["id"])
    return render_template("lists.html", lists=lists)


@app.route("/lists/<list_id>")
def list_detail(list_id):
    profile, redir = _require_profile()
    if redir:
        return redir
    db = get_db()
    lst = Q.get_list(db, list_id)
    if not lst:
        flash("List not found.", "danger")
        return redirect(url_for("lists_page"))
    imdb_ids = Q.get_list_items(db, list_id)
    items = _enrich(imdb_ids)
    return render_template("list_detail.html", lst=dict(lst), items=items)


@app.route("/history/companion")
def history_page_companion():
    # superseded by the Stremio-backed Watch history tab (routes_extra.py),
    # which also merges these companion-recorded entries
    return redirect(url_for("history_page"))
    profile, redir = _require_profile()
    if redir:
        return redir
    db = get_db()
    pid = profile["id"]
    skip = int(request.args.get("skip", 0))
    total = db.execute(
        "SELECT COUNT(*) FROM watch_history WHERE profile_id=?", (pid,)
    ).fetchone()[0]
    imdb_ids = Q.get_history(db, pid, skip=skip, limit=CATALOG_PAGE_SIZE)
    base_items = _enrich(imdb_ids)
    # Merge progress info
    history_map = {
        r["imdb_id"]: dict(r) for r in
        db.execute("SELECT * FROM watch_history WHERE profile_id=?", (pid,)).fetchall()
    }
    for item in base_items:
        h = history_map.get(item["imdb_id"], {})
        item["progress_pct"] = h.get("progress_pct", 0)
        item["completed"] = bool(h.get("completed", 0))
    return render_template(
        "history.html",
        items=base_items,
        total=total,
        skip=skip,
        page_size=CATALOG_PAGE_SIZE,
    )


@app.route("/import")
def import_page():
    profile, redir = _require_profile()
    if redir:
        return redir
    return render_template("import.html", results=None)


@app.route("/profile")
def profile_page():
    profiles = Q.list_profiles(get_db())
    return render_template("profile.html", profiles=profiles, addon_url=ADDON_PUBLIC_URL)


# ── Profile actions ────────────────────────────────────────────────────────────

@app.route("/profile/create", methods=["POST"])
def create_profile_route():
    name = request.form.get("name", "").strip()
    if not name:
        flash("Profile name is required.", "danger")
        return redirect(url_for("profile_page"))
    pid = Q.create_profile(get_db(), name)
    session["profile_id"] = pid
    flash("Profile '{}' created and activated.".format(name), "success")
    return redirect(url_for("profile_page"))


@app.route("/profile/switch", methods=["POST"])
def switch_profile():
    pid = request.form.get("profile_id", "")
    profile = Q.get_profile(get_db(), pid)
    if not profile:
        flash("Profile not found.", "danger")
    else:
        session["profile_id"] = pid
        flash("Switched to profile '{}'.".format(profile["name"]), "success")
    return redirect(url_for("profile_page"))


@app.route("/profile/delete", methods=["POST"])
def delete_profile_route():
    pid = request.form.get("profile_id", "")
    profile = Q.get_profile(get_db(), pid)
    if profile:
        Q.delete_profile(get_db(), pid)
        if session.get("profile_id") == pid:
            session.pop("profile_id", None)
        flash("Profile '{}' deleted.".format(profile["name"]), "success")
    return redirect(url_for("profile_page"))


# ── Watchlist actions ──────────────────────────────────────────────────────────

@app.route("/api/watchlist/add", methods=["POST"])
def api_watchlist_add():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    if imdb_id:
        db  = get_db()
        pid = profile["id"]
        Q.watchlist_add(db, pid, imdb_id)
        _lib_cache_add_items(pid, [imdb_id], db)   # patch cache, no full rebuild
        flash("Added {} to library.".format(imdb_id), "success")
    return redirect(request.referrer or url_for("library"))


@app.route("/api/watchlist/remove", methods=["POST"])
def api_watchlist_remove():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    if imdb_id:
        db  = get_db()
        pid = profile["id"]
        Q.watchlist_remove(db, pid, imdb_id)
        Q.blacklist_add(db, pid, imdb_id)
        _lib_cache_remove_items(pid, [imdb_id])   # patch cache, no full rebuild
        flash("Removed from library and added to blacklist.", "success")
    return redirect(request.referrer or url_for("library"))


@app.route("/api/watchlist/bulk-remove", methods=["POST"])
def api_watchlist_bulk_remove():
    """Remove multiple titles from the watchlist at once."""
    profile, redir = _require_profile()
    if redir:
        return redir
    # Accept either form-encoded list (checkboxes) or JSON body
    if request.is_json:
        imdb_ids = request.json.get("imdb_ids", [])
    else:
        imdb_ids = request.form.getlist("imdb_ids")
    imdb_ids = [i.strip() for i in imdb_ids if i.strip()]
    if imdb_ids:
        db  = get_db()
        pid = profile["id"]
        n   = Q.bulk_watchlist_remove(db, pid, imdb_ids)
        Q.bulk_blacklist_add(db, pid, imdb_ids)
        _lib_cache_remove_items(pid, imdb_ids)   # patch cache, no full rebuild
        flash("Removed {} title{} from library (blacklisted so they won't re-import).".format(n, "s" if n != 1 else ""), "success")
    else:
        flash("No titles selected.", "warning")
    return redirect(request.referrer or url_for("library"))


# ── Blacklist management ──────────────────────────────────────────────────────

@app.route("/blacklist")
def blacklist_page():
    profile, redir = _require_profile()
    if redir:
        return redir
    db = get_db()
    ids = Q.get_blacklist(db, profile["id"])
    items = _enrich(ids)
    return render_template("blacklist.html", items=items, total=len(items))


@app.route("/api/blacklist/remove", methods=["POST"])
def api_blacklist_remove():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    if imdb_id:
        Q.blacklist_remove(get_db(), profile["id"], imdb_id)
        flash("Removed from blacklist — it can be imported again.", "success")
    return redirect(request.referrer or url_for("blacklist_page"))


@app.route("/api/blacklist/bulk-remove", methods=["POST"])
def api_blacklist_bulk_remove():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_ids = request.form.getlist("imdb_ids")
    imdb_ids = [i.strip() for i in imdb_ids if i.strip()]
    if imdb_ids:
        db = get_db()
        for iid in imdb_ids:
            Q.blacklist_remove(db, profile["id"], iid)
        flash("Removed {} item{} from blacklist.".format(len(imdb_ids), "s" if len(imdb_ids) != 1 else ""), "success")
    return redirect(request.referrer or url_for("blacklist_page"))


# ── Skip list ("Not Interested") ─────────────────────────────────────────────

@app.route("/skip-list")
def skip_list_page():
    profile, redir = _require_profile()
    if redir:
        return redir
    db = get_db()
    ids = Q.get_skip_list(db, profile["id"])
    items = _enrich(ids)
    return render_template("skip_list.html", items=items, total=len(items))


@app.route("/api/skip-list/add", methods=["POST"])
def api_skip_list_add():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    if imdb_id:
        db = get_db()
        Q.skip_list_add(db, profile["id"], imdb_id)
        # Remove from watchlist — mutually exclusive
        Q.watchlist_remove(db, profile["id"], imdb_id)
        flash("Marked as Not Interested.", "success")
    return redirect(request.referrer or url_for("skip_list_page"))


@app.route("/api/skip-list/remove", methods=["POST"])
def api_skip_list_remove():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    if imdb_id:
        Q.skip_list_remove(get_db(), profile["id"], imdb_id)
        flash("Removed from Not Interested.", "success")
    return redirect(request.referrer or url_for("skip_list_page"))


@app.route("/api/skip-list/bulk-remove", methods=["POST"])
def api_skip_list_bulk_remove():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_ids = [i.strip() for i in request.form.getlist("imdb_ids") if i.strip()]
    if imdb_ids:
        n = Q.bulk_skip_list_remove(get_db(), profile["id"], imdb_ids)
        flash("Removed {} item{} from Not Interested.".format(n, "s" if n != 1 else ""), "success")
    return redirect(request.referrer or url_for("skip_list_page"))


@app.route("/api/skip-list/bulk-blacklist", methods=["POST"])
def api_skip_list_bulk_blacklist():
    """Move selected items from skip list to blacklist."""
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_ids = [i.strip() for i in request.form.getlist("imdb_ids") if i.strip()]
    if imdb_ids:
        db = get_db()
        Q.bulk_skip_list_remove(db, profile["id"], imdb_ids)
        Q.bulk_blacklist_add(db, profile["id"], imdb_ids)
        flash("Moved {} item{} to Blacklist.".format(len(imdb_ids), "s" if len(imdb_ids) != 1 else ""), "success")
    return redirect(request.referrer or url_for("skip_list_page"))


# ── Metadata refresh ─────────────────────────────────────────────────────────

@app.route("/api/metadata/refresh-stubs", methods=["POST"])
def api_refresh_stubs():
    """
    Clear all stub cache entries so real metadata is fetched on next load.
    Useful after the user adds their TMDB API key.
    """
    from config import TMDB_API_KEY
    if not TMDB_API_KEY:
        flash("Add your TMDB API key to config.py first, then restart the server.", "warning")
        return redirect(request.referrer or url_for("library"))
    n = Q.cache_clear_stubs(get_db())
    flash(
        "Cleared {} cached stub entr{}. "
        "Real titles and posters will load as you browse your library.".format(
            n, "ies" if n != 1 else "y"
        ),
        "success",
    )
    return redirect(request.referrer or url_for("library"))


# ── Rating actions ────────────────────────────────────────────────────────────

@app.route("/api/rate", methods=["POST"])
def api_rate():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    stars = request.form.get("stars", "")
    review = request.form.get("review", "")
    if imdb_id and stars:
        try:
            Q.set_rating(get_db(), profile["id"], imdb_id, int(stars), review)
            flash("Rating saved.", "success")
        except ValueError:
            flash("Invalid rating.", "danger")
    return redirect(request.referrer or url_for("library"))


@app.route("/api/rating/delete", methods=["POST"])
def api_delete_rating():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    if imdb_id:
        Q.delete_rating(get_db(), profile["id"], imdb_id)
        flash("Rating removed.", "success")
    return redirect(request.referrer or url_for("library"))


@app.route("/api/watch", methods=["POST"])
def api_record_watch():
    profile, redir = _require_profile()
    if redir:
        return redir
    imdb_id = request.form.get("imdb_id", "").strip()
    completed = request.form.get("completed", "1") == "1"
    progress = 100 if completed else 0
    if imdb_id:
        Q.record_watch(get_db(), profile["id"], imdb_id, progress_pct=progress, completed=completed)
        flash("Watch status updated.", "success")
    return redirect(request.referrer or url_for("library"))


# ── List actions ──────────────────────────────────────────────────────────────

@app.route("/api/list/create", methods=["POST"])
def api_list_create():
    profile, redir = _require_profile()
    if redir:
        return redir
    name = request.form.get("name", "").strip()
    if name:
        Q.create_list(get_db(), profile["id"], name)
        flash("List '{}' created.".format(name), "success")
    return redirect(url_for("lists_page"))


@app.route("/api/list/delete", methods=["POST"])
def api_list_delete():
    profile, redir = _require_profile()
    if redir:
        return redir
    list_id = request.form.get("list_id", "")
    lst = Q.get_list(get_db(), list_id)
    if lst:
        Q.delete_list(get_db(), list_id)
        flash("List deleted.", "success")
    return redirect(url_for("lists_page"))


@app.route("/api/list/add-item", methods=["POST"])
def api_list_add_item():
    profile, redir = _require_profile()
    if redir:
        return redir
    list_id = request.form.get("list_id", "")
    imdb_id = request.form.get("imdb_id", "")
    if list_id and imdb_id:
        Q.list_add_item(get_db(), list_id, imdb_id)
        flash("Added to list.", "success")
    return redirect(request.referrer or url_for("lists_page"))


@app.route("/api/list/remove-item", methods=["POST"])
def api_list_remove_item():
    profile, redir = _require_profile()
    if redir:
        return redir
    list_id = request.form.get("list_id", "")
    imdb_id = request.form.get("imdb_id", "")
    if list_id and imdb_id:
        Q.list_remove_item(get_db(), list_id, imdb_id)
        flash("Removed from list.", "success")
    return redirect(request.referrer or url_for("list_detail", list_id=list_id))


# ── Import actions — all paths funnel through preview ─────────────────────────
#
# Flow:
#   1. User submits CSV / URL / paste form
#   2. We parse raw IDs + unresolved candidates
#   3. Enrich everything with TMDB (language, rating, type, poster)
#   4. Mark items already in library
#   5. Store enriched list in import_sessions table, keyed by UUID
#   6. Redirect to /import/preview/<session_id>
#   7. User filters / selects -> POST to /api/import/confirm
# ─────────────────────────────────────────────────────────────────────────────

async def _resolve_candidates(candidates):
    """
    Convert (title, year) pairs to IMDB IDs via TMDB search.
    Tries movies first, then TV series. Returns list of IMDB IDs.
    """
    from companion.paste_import import _tmdb_search, _confidence
    import httpx as _httpx
    from config import TMDB_API_KEY, TMDB_BASE_URL
    sem = asyncio.Semaphore(5)

    async def lookup(title, year):
        async with sem:
            result = await _tmdb_search(title, year)
            if not result:
                return None
            conf = _confidence(title, year, result)
            # With year: 35 — catches slightly weaker title matches
            # Without year: 50 — single bare word titles need strong match
            threshold = 50 if not year else 35
            if conf < threshold:
                return None
            tmdb_id    = result.get("id")
            media_type = result.get("media_type", "movie")
            if not tmdb_id or not TMDB_API_KEY:
                return None
            try:
                endpoint = (
                    f"{TMDB_BASE_URL}/tv/{tmdb_id}/external_ids"
                    if media_type == "tv"
                    else f"{TMDB_BASE_URL}/movie/{tmdb_id}/external_ids"
                )
                async with _httpx.AsyncClient(timeout=8) as client:
                    resp = await client.get(endpoint, params={"api_key": TMDB_API_KEY})
                    resp.raise_for_status()
                    return resp.json().get("imdb_id")
            except Exception:
                return None

    results = await asyncio.gather(*[lookup(t, y) for t, y in candidates])
    return [r for r in results if r]


def _build_preview_items(profile_id, imdb_ids, enriched, import_type="watchlist", conn=None):
    """
    Build the preview item list from enriched TMDB metadata.
    Marks each item as already_in_library.
    conn is optional — if None, uses the per-request DB connection (get_db()).
    Pass an explicit conn when calling from a background thread.
    """
    db = conn if conn is not None else get_db()
    items = []
    for iid in imdb_ids:
        meta = enriched.get(iid, {})
        already = Q.watchlist_contains(db, profile_id, iid)
        items.append({
            "imdb_id": iid,
            "title": meta.get("title") or iid,
            "year": meta.get("year"),
            "type": meta.get("type", "movie"),
            "poster": meta.get("poster", ""),
            "language": meta.get("language"),
            "vote_average": meta.get("vote_average"),
            "already_in_library": already,
            "import_type": import_type,
            "selected": True,
        })
    return items


def _goto_preview(profile, imdb_ids, import_type="watchlist"):
    """Enrich IDs, store in DB, redirect to preview page."""
    if not imdb_ids:
        flash("No titles found to preview.", "danger")
        return redirect(url_for("import_page"))

    from addon.tmdb import get_metadata_batch
    enriched = _run_async(get_metadata_batch(get_db(), imdb_ids))
    items = _build_preview_items(profile["id"], imdb_ids, enriched, import_type)

    sid = str(uuid.uuid4())
    Q.import_session_create(get_db(), sid, profile["id"], items)
    return redirect(url_for("import_preview", session_id=sid))


@app.route("/api/import/csv", methods=["POST"])
def api_import_csv():
    profile, redir = _require_profile()
    if redir:
        return redir

    f = request.files.get("csv_file")
    import_type = request.form.get("import_type", "watchlist")

    if not f or not f.filename:
        flash("No file selected.", "danger")
        return redirect(url_for("import_page"))

    content = f.read().decode("utf-8", errors="replace")

    if import_type == "ratings":
        lb_rows = parse_letterboxd_csv(content)
        if lb_rows and any(r.get("stars") for r in lb_rows):
            ids = [r["imdb_id"] for r in lb_rows if r.get("imdb_id")]
            return _goto_preview(profile, ids, import_type="ratings")

    # Watchlist: try IMDB CSV first, then Letterboxd
    ids = parse_imdb_csv(content)
    if not ids:
        lb_rows = parse_letterboxd_csv(content)
        ids = [r["imdb_id"] for r in lb_rows if r.get("imdb_id")]

    return _goto_preview(profile, ids, import_type)


@app.route("/api/import/url", methods=["POST"])
def api_import_url():
    profile, redir = _require_profile()
    if redir:
        return redir

    url = request.form.get("url", "").strip()
    if not url:
        flash("No URL provided.", "danger")
        return redirect(url_for("import_page"))

    try:
        result = _run_async(scrape_list_url(url))
    except Exception as e:
        flash("Import failed: {}".format(e), "danger")
        return redirect(url_for("import_page"))

    imdb_ids = result.get("imdb_ids", [])

    # Resolve unmatched candidates (e.g. from Wikipedia text fallback)
    candidates = result.get("candidates", [])
    if candidates:
        resolved = _run_async(_resolve_candidates(candidates))
        existing = set(imdb_ids)
        imdb_ids += [r for r in resolved if r not in existing]

    return _goto_preview(profile, imdb_ids)


def _do_paste_import_bg(app_ctx, sid: str, profile_id: str, candidates: list):
    """
    Background thread for paste imports.
    Resolves (title, year) candidates via TMDB with real-time progress,
    enriches results, stores import session, marks status done.
    """
    from companion.paste_import import _tmdb_search, _confidence
    import httpx as _httpx
    from config import TMDB_API_KEY, TMDB_BASE_URL

    with app_ctx:
        from db.schema import get_connection
        conn = get_connection()
        try:
            total    = len(candidates)
            done_ctr = [0]   # list so inner async fn can mutate it

            async def resolve_all():
                sem = asyncio.Semaphore(8)

                async def lookup_one(title, year):
                    async with sem:
                        result = await _tmdb_search(title, year)
                        done_ctr[0] += 1
                        pct = done_ctr[0] / total if total else 1
                        with _import_status_lock:
                            _import_status[sid] = {
                                "status":   "processing",
                                "progress": round(pct, 3),
                                "done":     done_ctr[0],
                                "total":    total,
                                "message":  f"Searching TMDB… {done_ctr[0]}/{total}",
                            }
                        if not result:
                            return None
                        conf = _confidence(title, year, result)
                        threshold = 50 if not year else 35
                        if conf < threshold:
                            return None
                        tmdb_id    = result.get("id")
                        media_type = result.get("media_type", "movie")
                        if not tmdb_id or not TMDB_API_KEY:
                            return None
                        try:
                            ep = (
                                f"{TMDB_BASE_URL}/tv/{tmdb_id}/external_ids"
                                if media_type == "tv"
                                else f"{TMDB_BASE_URL}/movie/{tmdb_id}/external_ids"
                            )
                            async with _httpx.AsyncClient(timeout=8) as cl:
                                r = await cl.get(ep, params={"api_key": TMDB_API_KEY})
                                r.raise_for_status()
                                return r.json().get("imdb_id")
                        except Exception:
                            return None

                raw = await asyncio.gather(*[lookup_one(t, y) for t, y in candidates])
                return [r for r in raw if r]

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                imdb_ids = loop.run_until_complete(resolve_all())
            finally:
                loop.close()

            if not imdb_ids:
                with _import_status_lock:
                    _import_status[sid] = {
                        "status":  "error",
                        "message": "No titles matched. Try a different format or check your paste.",
                    }
                return

            # Filter out blacklisted titles before preview
            blacklisted = Q.get_blacklist_set(conn, profile_id)
            before = len(imdb_ids)
            imdb_ids = [i for i in imdb_ids if i not in blacklisted]
            bl_skipped = before - len(imdb_ids)

            if not imdb_ids:
                with _import_status_lock:
                    _import_status[sid] = {
                        "status":  "error",
                        "message": f"All {bl_skipped} matched titles are on your blacklist.",
                    }
                return

            from addon.tmdb import get_metadata_batch as _gmb
            loop2 = asyncio.new_event_loop()
            asyncio.set_event_loop(loop2)
            try:
                enriched = loop2.run_until_complete(_gmb(conn, imdb_ids))
            finally:
                loop2.close()

            items = _build_preview_items(profile_id, imdb_ids, enriched, conn=conn)
            Q.import_session_create(conn, sid, profile_id, items)

            with _import_status_lock:
                _import_status[sid] = {
                    "status":   "done",
                    "progress": 1,
                    "redirect": f"/import/preview/{sid}",
                }

        except Exception as exc:
            with _import_status_lock:
                _import_status[sid] = {
                    "status":  "error",
                    "message": str(exc),
                }
        finally:
            conn.close()


@app.route("/import/waiting/<session_id>")
def import_waiting(session_id):
    """Progress-tracking waiting page for background imports."""
    profile, redir = _require_profile()
    if redir:
        return redir
    return render_template("import_waiting.html", session_id=session_id)


@app.route("/api/import/session/<session_id>/status")
def api_import_session_status(session_id):
    """Poll endpoint used by the waiting page."""
    with _import_status_lock:
        st = _import_status.get(
            session_id,
            {"status": "processing", "progress": 0, "done": 0, "total": 0},
        )
    return jsonify(st)


@app.route("/api/import/paste", methods=["POST"])
def api_import_paste():
    profile, redir = _require_profile()
    if redir:
        return redir

    text = request.form.get("text", "")
    candidates = _extract_candidates(text)
    if not candidates:
        flash("No titles found in the pasted text.", "danger")
        return redirect(url_for("import_page"))

    sid = str(uuid.uuid4())
    with _import_status_lock:
        _import_status[sid] = {
            "status":   "processing",
            "progress": 0,
            "done":     0,
            "total":    len(candidates),
            "message":  f"Starting TMDB search for {len(candidates)} titles…",
        }

    t = threading.Thread(
        target=_do_paste_import_bg,
        args=(app.app_context(), sid, profile["id"], candidates),
        daemon=True,
    )
    t.start()
    return redirect(url_for("import_waiting", session_id=sid))


@app.route("/import/preview/<session_id>")
def import_preview(session_id):
    profile, redir = _require_profile()
    if redir:
        return redir

    items = Q.import_session_get(get_db(), session_id)
    if items is None:
        flash("Preview session expired or not found.", "danger")
        return redirect(url_for("import_page"))

    # Build available filter values from items
    languages = sorted({i["language"] for i in items if i.get("language")})

    return render_template(
        "import_preview.html",
        items=items,
        session_id=session_id,
        languages=languages,
        total=len(items),
        already_count=sum(1 for i in items if i["already_in_library"]),
    )


@app.route("/api/import/confirm", methods=["POST"])
def api_import_confirm():
    profile, redir = _require_profile()
    if redir:
        return redir

    session_id = request.form.get("session_id", "")
    selected_ids = request.form.getlist("imdb_ids")

    if not selected_ids:
        flash("Nothing selected.", "info")
        return redirect(url_for("import_page"))

    n = Q.bulk_watchlist_add(get_db(), profile["id"], selected_ids)
    Q.import_session_delete(get_db(), session_id)
    skipped = len(selected_ids) - n
    msg = "Added {} title{} to your library.".format(n, "s" if n != 1 else "")
    if skipped:
        msg += " ({} already in library, skipped.)".format(skipped)
    flash(msg, "success")
    return redirect(url_for("library"))


# ── JSON API (for browser extension) ─────────────────────────────────────────

def _get_stremio_auth_key() -> str:
    """
    Return the Stremio authKey by checking (in order):
    1. config.py STREMIO_AUTH_KEY
    2. Common Stremio data-file locations on Windows/Mac/Linux
    Returns '' if nothing found.
    """
    from config import STREMIO_AUTH_KEY
    if STREMIO_AUTH_KEY:
        return STREMIO_AUTH_KEY

    # Stremio 5 keeps it in its WebView2 local storage (see stremio_local.py)
    try:
        from companion import stremio_local
        key = stremio_local.auth_key()
        if key:
            return key
    except Exception:
        pass

    import os, json, glob
    appdata    = os.environ.get("APPDATA", "")
    localdata  = os.environ.get("LOCALAPPDATA", "")
    home       = os.path.expanduser("~")

    candidate_files = []
    # Windows — stremio-server writes a server-settings.json
    for base in [appdata, localdata]:
        if base:
            candidate_files += glob.glob(os.path.join(base, "stremio-server", "*.json"))
            candidate_files += glob.glob(os.path.join(base, "Stremio", "*.json"))
    # macOS / Linux
    candidate_files += glob.glob(os.path.join(home, ".stremio-server", "*.json"))
    candidate_files += glob.glob(os.path.join(home, ".config", "stremio-server", "*.json"))

    for path in candidate_files:
        try:
            with open(path, encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                continue
            # top-level authKey
            key = data.get("authKey") or data.get("auth_key")
            if not key:
                # nested under "user"
                user = data.get("user") or {}
                key = user.get("authKey") or user.get("auth_key")
            if key and len(str(key)) > 8:
                return str(key)
        except Exception:
            pass

    return ""


@app.route("/api/sync-to-stremio", methods=["POST"])
def api_sync_to_stremio():
    """
    Push every watchlist item into Stremio's native Library via api.strem.io.
    Requires a Stremio authKey (auto-detected or set in config.py).
    """
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "No profile selected"}), 400

    auth_key = _get_stremio_auth_key()
    if not auth_key:
        return jsonify({
            "synced": 0,
            "error": (
                "Stremio auth key not found. "
                "Open Stremio → press F12 → Application tab → Local Storage → "
                "http://app.strem.io → copy the value of 'authKey'. "
                "Then add  STREMIO_AUTH_KEY = \"paste-key-here\"  to config.py "
                "and restart the companion."
            )
        }), 400

    db = get_db()
    imdb_ids = Q.get_watchlist(db, profile["id"], skip=0, limit=500000)
    if not imdb_ids:
        return jsonify({"synced": 0, "error": None})

    from addon.tmdb import get_metadata_batch
    meta_map = _run_async(get_metadata_batch(db, imdb_ids))

    from datetime import datetime, timezone
    import httpx

    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    # Only sync items that have a real tt-ID (Stremio ignores tmdb: prefixed IDs)
    items = []
    skipped = 0
    for iid in imdb_ids:
        if not iid.startswith("tt"):
            skipped += 1
            continue
        meta = meta_map.get(iid) or {}
        items.append({
            "_id":         iid,
            "name":        meta.get("title") or iid,
            "type":        meta.get("type") or "movie",
            "poster":      meta.get("poster") or "",
            "posterShape": "poster",
            "removed":     False,
            "temp":        False,
            "_ctime":      now_ms,
            "_mtime":      now_ms,
            "state": {
                "lastWatched":        None,
                "timeWatched":        0,
                "timeOffset":         0,
                "overallTimeWatched": 0,
                "timesWatched":       0,
                "flaggedWatched":     0,
                "duration":           0,
                "video_id":           None,
                "watched":            None,
                "noNotif":            False,
            },
        })

    if not items:
        return jsonify({
            "synced": 0,
            "error": f"No items with IMDB IDs to sync ({skipped} entries had no tt-ID)."
        }), 400

    payload = {
        "authKey":    auth_key,
        "collection": "libraryItem",
        "ids":        [i["_id"] for i in items],
        "changed":    items,
    }

    try:
        resp = httpx.post(
            "https://api.strem.io/api/datastorePut",
            json=payload,
            timeout=30,
        )
        if not resp.is_success:
            body = resp.text[:400]
            return jsonify({
                "synced": 0,
                "error": f"Stremio API returned HTTP {resp.status_code}: {body}"
            }), 502
        result = resp.json()
        if result.get("err"):
            return jsonify({
                "synced": 0,
                "error": f"Stremio API error: {result['err']}"
            }), 400
        note = f" ({skipped} skipped — no IMDB ID)" if skipped else ""
        return jsonify({"synced": len(items), "skipped": skipped, "error": None,
                        "note": note})
    except httpx.ConnectError:
        return jsonify({
            "synced": 0,
            "error": "Cannot reach api.strem.io. Check your internet connection."
        }), 503
    except httpx.TimeoutException:
        return jsonify({"synced": 0, "error": "Request to api.strem.io timed out."}), 504
    except Exception as e:
        return jsonify({"synced": 0, "error": f"{type(e).__name__}: {e}"}), 500


@app.route("/api/watchlist/check")
def api_watchlist_check():
    profile_id = request.args.get("profile_id") or session.get("profile_id")
    imdb_id = request.args.get("imdb_id", "")
    if not profile_id or not imdb_id:
        return jsonify({"error": "Missing parameters"}), 400
    in_list = Q.watchlist_contains(get_db(), profile_id, imdb_id)
    return jsonify({"in_watchlist": in_list, "imdb_id": imdb_id})


@app.route("/api/import/batch", methods=["POST"])
def api_import_batch():
    """JSON endpoint for browser extension bulk import."""
    data = request.get_json(silent=True) or {}
    profile_id = data.get("profile_id") or session.get("profile_id")
    imdb_ids = data.get("imdb_ids", [])
    if not profile_id:
        return jsonify({"error": "No profile"}), 400
    n = Q.bulk_watchlist_add(get_db(), profile_id, imdb_ids)
    return jsonify({"imported": n, "total": len(imdb_ids)})


@app.route("/api/reclassify-cache", methods=["POST"])
def api_reclassify_cache():
    """
    Re-fetch TMDB type for every cached entry and update the stored type if it
    changed (movie ↔ series).  Non-destructive: all other cached fields stay.
    Only processes real tt-IDs; tmdb: prefixed IDs already have correct types.
    """
    conn = get_db()
    rows = conn.execute(
        "SELECT imdb_id, tmdb_data FROM metadata_cache"
    ).fetchall()

    if not rows:
        return jsonify({"total": 0, "updated": 0, "skipped": 0, "errors": 0})

    from addon.tmdb import _fetch_from_tmdb

    async def _do_reclassify():
        updated = 0
        errors  = 0
        skipped = 0
        sem = asyncio.Semaphore(5)

        async def check_one(imdb_id: str, cached: dict):
            nonlocal updated, errors, skipped
            # Only re-check real IMDB IDs; tmdb: IDs were typed at import time
            if not imdb_id.startswith("tt"):
                skipped += 1
                return
            if cached.get("_stub"):
                skipped += 1
                return
            async with sem:
                try:
                    fresh = await _fetch_from_tmdb(imdb_id)
                    if fresh.get("_stub"):
                        skipped += 1
                        return
                    new_type = fresh.get("type", "movie")
                    old_type = cached.get("type", "movie")
                    if new_type != old_type:
                        cached["type"] = new_type
                        Q.cache_set(conn, imdb_id, cached)
                        updated += 1
                    else:
                        skipped += 1
                except Exception:
                    errors += 1

        tasks = []
        for row in rows:
            iid = row["imdb_id"]
            try:
                data = json.loads(row["tmdb_data"])
            except Exception:
                errors += 1
                continue
            tasks.append(check_one(iid, data))

        await asyncio.gather(*tasks)
        return {
            "total":   len(rows),
            "updated": updated,
            "skipped": skipped,
            "errors":  errors,
        }

    result = _run_async(_do_reclassify())
    return jsonify(result)


@app.route("/api/debug/scrape")
def api_debug_scrape():
    """Debug endpoint: fetch a URL and show raw HTML snippet + parse results."""
    import httpx as _httpx
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"error": "Pass ?url=..."}), 400

    # First: show raw fetch result
    _BROWSER_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    async def _raw_fetch():
        async with _httpx.AsyncClient(timeout=20, follow_redirects=True, headers=_BROWSER_HEADERS) as c:
            r = await c.get(url)
            return r.status_code, r.headers.get("content-type",""), r.text[:3000]
    try:
        status, ctype, snippet = _run_async(_raw_fetch())
    except Exception as e:
        return jsonify({"fetch_error": str(e)}), 500

    # Then: run the full scraper
    parse_result = {}
    parse_error = None
    try:
        result = _run_async(scrape_list_url(url))
        parse_result = {
            "source": result.get("source"),
            "imdb_ids_count": len(result.get("imdb_ids", [])),
            "imdb_ids_sample": result.get("imdb_ids", [])[:10],
            "candidates_count": len(result.get("candidates", [])),
            "candidates_sample": result.get("candidates", [])[:5],
        }
    except Exception as e:
        parse_error = str(e)

    return jsonify({
        "http_status": status,
        "content_type": ctype,
        "html_snippet": snippet,
        "parse_result": parse_result,
        "parse_error": parse_error,
    })


# ── Browser extension endpoints ───────────────────────────────────────────────

@app.route("/api/profiles")
def api_profiles():
    """Return all profiles as JSON (used by the browser extension popup)."""
    profiles = Q.list_profiles(get_db())
    return jsonify(profiles)


def _do_extension_import_bg(app_ctx, sid: str, profile_id: str, source: str, page_url: str, imdb_ids_fast: list, article_titles: list = None):
    """
    Background thread: resolve IDs, enrich with TMDB, write session, update status.
    app_ctx is the Flask app context so we can use get_connection().

    Wikipedia uses DOM-extracted article_titles (TMDB search) — the browser
    already rendered the page, so no Wikipedia API scraping is needed.
    """
    with app_ctx:
        from db.schema import get_connection
        conn = get_connection()
        try:
            imdb_ids   = list(imdb_ids_fast)
            candidates = []

            if source == "letterboxd" and page_url:
                from companion.url_import import _scrape_letterboxd_list
                imdb_ids = _run_async(_scrape_letterboxd_list(page_url))

            elif source == "wikipedia":
                titles = article_titles or []
                if titles:
                    # Extension sent DOM article titles — just TMDB-search them.
                    # Much simpler and more reliable than scraping Wikipedia API.
                    from companion.url_import import resolve_titles_via_tmdb
                    imdb_ids = _run_async(resolve_titles_via_tmdb(titles))
                elif page_url:
                    # Fallback for older extension versions without DOM extraction.
                    from companion.url_import import _scrape_wikipedia_list
                    result    = _run_async(_scrape_wikipedia_list(page_url))
                    imdb_ids  = result.get("imdb_ids", [])
                    candidates = result.get("candidates", [])

            if not imdb_ids and candidates:
                imdb_ids = _run_async(_resolve_candidates([(c[0], c[1]) for c in candidates[:100]]))

            if not imdb_ids:
                src_hint = {
                    "letterboxd": "Make sure the URL is a Letterboxd film list.",
                    "wikipedia":  "No film titles found. Try a Wikipedia list or Category: page.",
                    "imdb":       "No tt-IDs found — scroll to load all items first.",
                }.get(source, "")
                with _import_status_lock:
                    _import_status[sid] = {
                        "status":  "error",
                        "message": "No titles found. " + src_hint,
                    }
                return

            # ── Filter blacklisted titles ────────────────────────────────────
            blacklisted = Q.get_blacklist_set(conn, profile_id)
            imdb_ids = [i for i in imdb_ids if i not in blacklisted]

            if not imdb_ids:
                with _import_status_lock:
                    _import_status[sid] = {
                        "status":  "error",
                        "message": "All matched titles are on your blacklist.",
                    }
                return

            # ── Enrich IDs with TMDB metadata ────────────────────────────────
            from addon.tmdb import get_metadata_batch
            enriched = _run_async(get_metadata_batch(conn, imdb_ids))

            # ── Build preview items ──────────────────────────────────────────
            items = _build_preview_items(
                profile_id, imdb_ids, enriched, conn=conn
            )

            # ── Persist session ──────────────────────────────────────────────
            Q.import_session_create(conn, sid, profile_id, items)

            with _import_status_lock:
                _import_status[sid] = {
                    "status":   "done",
                    "redirect": "/import/preview/" + sid,
                }

        except Exception as exc:
            with _import_status_lock:
                _import_status[sid] = {
                    "status":  "error",
                    "message": str(exc),
                }
        finally:
            conn.close()




# ── Personal tags ──────────────────────────────────────────────────────────────


@app.route("/api/tags/add", methods=["POST"])
def api_tags_add():
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    imdb_id = request.form.get("imdb_id", "").strip()
    tag     = request.form.get("tag", "").strip().lower()
    if not imdb_id or not tag:
        return jsonify({"error": "missing imdb_id or tag"}), 400
    Q.tags_add(get_db(), profile["id"], imdb_id, tag)
    return jsonify({"ok": True})


@app.route("/api/tags/remove", methods=["POST"])
def api_tags_remove():
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    imdb_id = request.form.get("imdb_id", "").strip()
    tag     = request.form.get("tag", "").strip().lower()
    if not imdb_id or not tag:
        return jsonify({"error": "missing imdb_id or tag"}), 400
    Q.tags_remove(get_db(), profile["id"], imdb_id, tag)
    return jsonify({"ok": True})


@app.route("/api/tags/get", methods=["GET"])
def api_tags_get():
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    imdb_id = request.args.get("imdb_id", "").strip()
    if not imdb_id:
        return jsonify({"error": "missing imdb_id"}), 400
    tags = Q.tags_get(get_db(), profile["id"], imdb_id)
    return jsonify({"tags": tags})


# ── Quick "mark watched" from library grid ─────────────────────────────────────

@app.route("/api/watchlist/quick-watched", methods=["POST"])
def api_watchlist_quick_watched():
    """Remove from watchlist and add to blacklist (mark as seen) in one shot."""
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    imdb_id = request.form.get("imdb_id", "").strip()
    if not imdb_id:
        return jsonify({"error": "missing imdb_id"}), 400
    db  = get_db()
    pid = profile["id"]
    Q.watchlist_remove(db, pid, imdb_id)
    Q.blacklist_add(db, pid, imdb_id)
    _lib_cache_remove_items(pid, [imdb_id])   # patch cache, no full rebuild
    return jsonify({"ok": True})


@app.route("/api/library/cache/status")
def api_library_cache_status():
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    pid    = profile["id"]
    status = _LIB_STATUS.get(pid, {"status": "idle", "progress": 0,
                                    "done": 0, "total": 0, "msg": ""})
    return jsonify(status)


@app.route("/api/library/cache/rebuild", methods=["POST"])
def api_library_cache_rebuild():
    """Force a full cache rebuild (e.g. after importing new titles)."""
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    pid = profile["id"]
    db  = get_db()
    _lib_invalidate(pid)
    wl_count = Q.get_watchlist_count(db, pid)
    with _LIB_LOCK:
        if _LIB_STATUS.get(pid, {}).get("status") != "building":
            _LIB_STATUS[pid] = {"status": "building", "progress": 0,
                                 "done": 0, "total": wl_count, "msg": "Starting rebuild..."}
            threading.Thread(
                target=_lib_build_bg,
                args=(pid, wl_count, app.app_context()),
                daemon=True,
            ).start()
    return jsonify({"ok": True, "msg": "Rebuild started"})


@app.route("/api/library/cache/sync", methods=["POST"])
def api_library_cache_sync():
    """Fast sync: find items in DB but missing from cache and add only those."""
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    pid = profile["id"]
    with _LIB_LOCK:
        if _LIB_STATUS.get(pid, {}).get("status") == "building":
            return jsonify({"ok": False, "msg": "Already building"}), 409
        _LIB_STATUS[pid] = {"status": "building", "progress": 0,
                             "done": 0, "total": 0, "msg": "Starting sync..."}
        threading.Thread(
            target=_lib_sync_bg,
            args=(pid, app.app_context()),
            daemon=True,
        ).start()
    return jsonify({"ok": True, "msg": "Sync started"})


# ── Genre backfill ─────────────────────────────────────────────────────────────

@app.route("/api/genres/fix", methods=["POST"])
def api_genres_fix():
    """Delete metadata cache entries where genres is empty so next load re-fetches."""
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    db  = get_db()
    pid = profile["id"]
    try:
        cur = db.execute(
            "DELETE FROM metadata_cache WHERE imdb_id IN ("
            "  SELECT mc.imdb_id FROM metadata_cache mc "
            "  JOIN watchlist w ON w.imdb_id = mc.imdb_id AND w.profile_id = ?"
            "  WHERE json_extract(mc.tmdb_data, '$.genres') = '[]'"
            ")",
            (pid,)
        )
        db.commit()
        _lib_invalidate(pid)
        return jsonify({"ok": True, "cleared": cur.rowcount,
                        "message": f"Cleared {cur.rowcount} entries. Reload the Library to re-fetch genres."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/extension/import", methods=["POST"])
def api_extension_import():
    data = request.get_json(silent=True) or {}
    profile_id = data.get("profile_id") or session.get("profile_id")
    if not profile_id:
        return jsonify({"error": "No profile selected"}), 400
    source         = data.get("source", "")
    page_url       = data.get("page_url", "")
    imdb_ids_fast  = data.get("imdb_ids", [])
    article_titles = data.get("article_titles", [])
    sid = str(uuid.uuid4())
    with _import_status_lock:
        _import_status[sid] = {"status": "processing", "progress": 0, "done": 0, "total": 0, "message": "Starting import..."}
    t = threading.Thread(
        target=_do_extension_import_bg,
        args=(app.app_context(), sid, profile_id, source, page_url, imdb_ids_fast, article_titles),
        daemon=True,
    )
    t.start()
    return jsonify({"session_id": sid, "waiting_url": f"/import/waiting/{sid}"})


# Watch History / Shelves / Torrents tabs
from companion import routes_extra  # noqa: E402,F401
