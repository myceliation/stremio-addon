"""
Watch History (from Stremio itself), Shelves and Torrents tabs.
Imported at the bottom of companion/app.py.
"""
from __future__ import annotations

import asyncio
import threading
from collections import Counter

from flask import jsonify, render_template, request

from companion.app import app, get_db, _require_profile, _run_async
from companion import stremio_sync as SS
from db.schema import get_connection

_ENRICH = {"running": False, "done": 0, "total": 0, "msg": ""}
_ENRICH_LOCK = threading.Lock()


def _enrich_bg():
    """Fetch TMDB metadata (genres, year, poster) for Stremio titles we lack."""
    from addon.tmdb import get_metadata_batch
    conn = get_connection()
    try:
        ids = SS.missing_meta_ids(conn)
        _ENRICH.update(total=len(ids), done=0, msg="Fetching metadata…")
        loop = asyncio.new_event_loop()
        for i in range(0, len(ids), 40):
            chunk = ids[i:i + 40]
            try:
                loop.run_until_complete(get_metadata_batch(conn, chunk))
            except Exception as e:
                _ENRICH["msg"] = f"partial: {e}"
            _ENRICH["done"] = min(len(ids), i + len(chunk))
        loop.close()
        _ENRICH["msg"] = "Done"
    finally:
        conn.close()
        _ENRICH["running"] = False


def _start_enrich():
    from config import TMDB_API_KEY
    if not TMDB_API_KEY:
        return False
    with _ENRICH_LOCK:
        if _ENRICH["running"]:
            return True
        _ENRICH["running"] = True
    threading.Thread(target=_enrich_bg, daemon=True).start()
    return True


# ── Watch History ─────────────────────────────────────────────────────────────

@app.route("/history")
def history_page():
    profile, redir = _require_profile()
    if redir:
        return redir
    db = get_db()
    sync = SS.maybe_sync(db)
    rows = SS.history_rows(db, profile["id"])
    if SS.missing_meta_ids(db):
        _start_enrich()
    genres = Counter(g for r in rows if r["status"] != "opened" for g in r["genres"])
    return render_template(
        "history.html",
        rows=rows,
        sync=sync,
        shelves=SS.SHELVES,
        genres=[g for g, _ in genres.most_common()],
        languages=[l for l, _ in Counter(r["language"] for r in rows if r["language"]).most_common(25)],
    )


@app.route("/api/stremio/sync", methods=["POST"])
def api_stremio_sync():
    db = get_db()
    st = SS.sync(db)
    if st.get("ok"):
        _start_enrich()
    return jsonify(st)


@app.route("/api/history.json")
def api_history_json():
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    return jsonify({"rows": SS.history_rows(get_db(), profile["id"])})


@app.route("/api/enrich/status")
def api_enrich_status():
    return jsonify(_ENRICH)


# ── Shelves ───────────────────────────────────────────────────────────────────

@app.route("/api/shelf", methods=["POST"])
def api_shelf():
    profile, redir = _require_profile()
    if redir:
        return jsonify({"error": "no profile"}), 400
    data = request.get_json(silent=True) or request.form
    imdb_id = (data.get("imdb_id") or "").strip()
    shelf = (data.get("shelf") or "").strip()
    on = str(data.get("on", "true")).lower() in ("1", "true", "yes", "on")
    if not imdb_id or shelf not in SS.SHELF_KEYS:
        return jsonify({"error": "bad imdb_id or shelf"}), 400
    db = get_db()
    SS.shelf_toggle(db, profile["id"], imdb_id, shelf, on)
    # exclusive pairs: loving something un-drops it, and vice versa
    if on and shelf == "loved":
        SS.shelf_toggle(db, profile["id"], imdb_id, "dropped", False)
    if on and shelf == "dropped":
        SS.shelf_toggle(db, profile["id"], imdb_id, "loved", False)
    sets = SS.shelf_sets(db, profile["id"])
    return jsonify({"ok": True, "shelves": [k for k in sets if imdb_id in sets[k]]})


@app.route("/shelves")
def shelves_page():
    profile, redir = _require_profile()
    if redir:
        return redir
    import json as _json
    db = get_db()
    sets = SS.shelf_sets(db, profile["id"])
    ids = sorted(set().union(*sets.values()))
    meta = {}
    for i in range(0, len(ids), 900):
        chunk = ids[i:i + 900]
        for r in db.execute(
            f"SELECT imdb_id, tmdb_data FROM metadata_cache WHERE imdb_id IN ({','.join('?'*len(chunk))})", chunk
        ):
            try:
                meta[r[0]] = _json.loads(r[1])
            except Exception:
                pass
    names = {r[0]: (r[1], r[2]) for r in db.execute("SELECT id, name, poster FROM stremio_items")}
    rows = []
    for iid in ids:
        m = meta.get(iid, {})
        nm, po = names.get(iid, (None, None))
        rows.append({
            "id": iid, "name": m.get("title") or nm or iid, "poster": m.get("poster") or po or "",
            "year": str(m.get("year") or "")[:4], "genres": m.get("genres") or [],
            "type": m.get("type") or "movie",
            "shelves": [k for k in sets if iid in sets[k]],
        })
    counts = {k: len(v) for k, v in sets.items()}
    return render_template("shelves.html", rows=rows, shelves=SS.SHELVES, counts=counts,
                           active=request.args.get("shelf", "loved"))


# ── Torrents (qBittorrent + indexer search) ───────────────────────────────────

@app.route("/torrents")
def torrents_page():
    from addon.stream import jackett_settings, _upstreams
    j_url, j_key = jackett_settings()
    import config as C
    return render_template("torrents.html", qbt_url=C.QBT_URL,
                           jackett=bool(j_url and j_key), jackett_url=j_url,
                           upstreams=_upstreams(), q=request.args.get("q", ""))


@app.route("/api/torrents/search")
def api_torrents_search():
    from addon.stream import search_query
    q = request.args.get("q", "").strip()
    kind = request.args.get("kind", "any")
    if not q:
        return jsonify({"results": [], "sources": {}})
    return jsonify(_run_async(search_query(q, kind)))


def _qbt_call(fn):
    from companion.qbt import Qbt, QbtError
    try:
        return jsonify(fn(Qbt()))
    except QbtError as e:
        return jsonify({"error": str(e), "offline": True}), 503
    except Exception as e:
        return jsonify({"error": f"{type(e).__name__}: {e}"}), 500


@app.route("/api/qbt/info")
def api_qbt_info():
    return _qbt_call(lambda q: q.info())


@app.route("/api/qbt/add", methods=["POST"])
def api_qbt_add():
    d = request.get_json(silent=True) or request.form
    magnet = d.get("magnet", "")
    if not magnet.startswith("magnet:"):
        return jsonify({"error": "not a magnet link"}), 400
    return _qbt_call(lambda q: {"ok": q.add(magnet, d.get("category", "")) == "Ok."})


@app.route("/api/qbt/action", methods=["POST"])
def api_qbt_action():
    d = request.get_json(silent=True) or request.form
    act, hashes = d.get("action", ""), d.get("hashes", "")
    if not hashes:
        return jsonify({"error": "no hashes"}), 400
    return _qbt_call(lambda q: {"ok": True, "r": q.action(act, hashes, str(d.get("deleteFiles", "")).lower() == "true")})
