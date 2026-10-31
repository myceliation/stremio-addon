"""
Mirror the Stremio app's own library / watch history into our SQLite DB and
query it for the Watch History tab.

Source order:
  1. the desktop app's local storage (companion/stremio_local.py) — no network,
     no account, sees everything the app shows in Continue Watching / Library
  2. api.strem.io datastoreGet with your authKey — fallback when the app isn't
     installed on this machine
"""
from __future__ import annotations

import json
import time
from datetime import datetime

from companion import stremio_local

# ── Shelves ───────────────────────────────────────────────────────────────────
# Tag-backed shelves (stored in title_tags) plus the two table-backed ones that
# already existed (skip_list = "Ignore", blacklist).
SHELVES = [
    {"key": "loved",     "icon": "❤",  "label": "Loved",               "hint": "Watched and loved"},
    {"key": "waiting",   "icon": "⏳", "label": "Waiting for release", "hint": "Not out properly yet / season incomplete"},
    {"key": "rewatch",   "icon": "🔁", "label": "Rewatch",             "hint": "Want to see again"},
    {"key": "dropped",   "icon": "✖",  "label": "Dropped",             "hint": "Started, gave up"},
    {"key": "ignore",    "icon": "👎", "label": "Ignore",              "hint": "Not interested (hidden from suggestions)"},
    {"key": "blacklist", "icon": "🚫", "label": "Blacklist",           "hint": "Never show anywhere"},
]
SHELF_KEYS = {s["key"] for s in SHELVES}
TAG_SHELVES = {"loved", "waiting", "rewatch", "dropped"}


def shelf_sets(conn, profile_id: str) -> dict[str, set]:
    out = {k: set() for k in SHELF_KEYS}
    for r in conn.execute(
        "SELECT imdb_id, tag FROM title_tags WHERE profile_id=? AND tag IN (%s)"
        % ",".join("?" * len(TAG_SHELVES)), [profile_id, *TAG_SHELVES]
    ):
        out[r["tag"]].add(r["imdb_id"])
    out["ignore"] = {r[0] for r in conn.execute(
        "SELECT imdb_id FROM skip_list WHERE profile_id=?", (profile_id,))}
    out["blacklist"] = {r[0] for r in conn.execute(
        "SELECT imdb_id FROM blacklist WHERE profile_id=?", (profile_id,))}
    return out


def shelf_toggle(conn, profile_id: str, imdb_id: str, shelf: str, on: bool) -> None:
    if shelf in TAG_SHELVES:
        if on:
            conn.execute("INSERT OR IGNORE INTO title_tags (profile_id, imdb_id, tag) VALUES (?,?,?)",
                         (profile_id, imdb_id, shelf))
        else:
            conn.execute("DELETE FROM title_tags WHERE profile_id=? AND imdb_id=? AND tag=?",
                         (profile_id, imdb_id, shelf))
    elif shelf == "ignore":
        if on:
            conn.execute("INSERT OR IGNORE INTO skip_list (profile_id, imdb_id) VALUES (?,?)", (profile_id, imdb_id))
        else:
            conn.execute("DELETE FROM skip_list WHERE profile_id=? AND imdb_id=?", (profile_id, imdb_id))
    elif shelf == "blacklist":
        if on:
            conn.execute("INSERT OR IGNORE INTO blacklist (profile_id, imdb_id) VALUES (?,?)", (profile_id, imdb_id))
        else:
            conn.execute("DELETE FROM blacklist WHERE profile_id=? AND imdb_id=?", (profile_id, imdb_id))
    else:
        raise ValueError(f"unknown shelf {shelf!r}")
    conn.commit()


# ── kv helpers ────────────────────────────────────────────────────────────────

def kv_get(conn, key: str, default=None):
    r = conn.execute("SELECT value FROM kv_state WHERE key=?", (key,)).fetchone()
    if not r:
        return default
    try:
        return json.loads(r[0])
    except Exception:
        return default


def kv_set(conn, key: str, value) -> None:
    conn.execute(
        "INSERT INTO kv_state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
        (key, json.dumps(value)),
    )
    conn.commit()


# ── Sync ──────────────────────────────────────────────────────────────────────

def _row(it: dict) -> tuple:
    st = it.get("state") or {}
    bh = it.get("behaviorHints") or {}
    return (
        it.get("_id"), it.get("type"), it.get("name"), it.get("poster") or "",
        int(bool(it.get("removed"))), int(bool(it.get("temp"))),
        it.get("_ctime"), it.get("_mtime"), st.get("lastWatched"),
        int(st.get("timeWatched") or 0), int(st.get("timeOffset") or 0),
        int(st.get("overallTimeWatched") or 0), int(st.get("timesWatched") or 0),
        int(st.get("flaggedWatched") or 0), int(st.get("duration") or 0),
        st.get("video_id"), int(bool(bh.get("hasScheduledVideos"))),
    )


def _upsert(conn, items: list[dict]) -> int:
    rows = [_row(i) for i in items if i.get("_id")]
    conn.executemany(
        "INSERT OR REPLACE INTO stremio_items (id, type, name, poster, removed, temp, ctime, mtime, "
        "last_watched, time_watched, time_offset, overall_time_watched, times_watched, "
        "flagged_watched, duration, video_id, has_scheduled, synced_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)",
        rows,
    )
    conn.commit()
    return len(rows)


def _fetch_api(auth_key: str) -> list[dict]:
    import httpx
    r = httpx.post(
        "https://api.strem.io/api/datastoreGet",
        json={"authKey": auth_key, "collection": "libraryItem", "ids": [], "all": True},
        timeout=30,
    )
    r.raise_for_status()
    return r.json().get("result") or []


def sync(conn, auth_key_fallback: str = "") -> dict:
    """Pull Stremio's library into stremio_items. Returns a status dict."""
    t0 = time.time()
    source, items, err = "", [], ""
    try:
        state = stremio_local.load_state()
        items = stremio_local.library_items(state)
        if items:
            source = "local"
            key = stremio_local.auth_key(state)
            if key:
                kv_set(conn, "stremio_auth_key", key)
    except Exception as e:  # keep going to API fallback
        err = f"local read failed: {e}"
    if not items:
        key = auth_key_fallback or kv_get(conn, "stremio_auth_key", "")
        if key:
            try:
                items = _fetch_api(key)
                source = "api"
            except Exception as e:
                err = f"api.strem.io failed: {e}"
    if source == "local" and stremio_local.cramjam is None:
        err = "cramjam isn't installed, so older history may be missing (pip install cramjam)"
    n = _upsert(conn, items) if items else 0
    status = {
        "ok": bool(items), "source": source, "count": n, "error": err,
        "at": datetime.now().isoformat(timespec="seconds"),
        "secs": round(time.time() - t0, 2),
    }
    kv_set(conn, "stremio_sync", status)
    return status


def maybe_sync(conn, max_age_s: int = 600) -> dict:
    last = kv_get(conn, "stremio_sync") or {}
    try:
        age = (datetime.now() - datetime.fromisoformat(last["at"])).total_seconds()
    except Exception:
        age = 1e9
    if age > max_age_s:
        return sync(conn)
    return last


def stored_auth_key(conn) -> str:
    return kv_get(conn, "stremio_auth_key", "") or ""


# ── Query for the Watch History tab ───────────────────────────────────────────

def _status(r) -> str:
    if r["flagged_watched"] or r["times_watched"]:
        return "watched"
    if r["time_offset"] and r["time_offset"] > 60_000:
        return "progress"
    return "opened"


def history_rows(conn, profile_id: str) -> list[dict]:
    """
    Every title Stremio knows you touched, merged with the companion's own
    watch_history, enriched with cached TMDB metadata and shelf membership.
    """
    rows = conn.execute(
        "SELECT s.*, m.tmdb_data FROM stremio_items s "
        "LEFT JOIN metadata_cache m ON m.imdb_id = s.id"
    ).fetchall()
    shelves = shelf_sets(conn, profile_id)
    ratings = {r[0]: r[1] for r in conn.execute(
        "SELECT imdb_id, stars FROM ratings WHERE profile_id=?", (profile_id,))}
    out, seen = [], set()
    for r in rows:
        meta = {}
        if r["tmdb_data"]:
            try:
                meta = json.loads(r["tmdb_data"])
            except Exception:
                meta = {}
        pct = 0
        if r["duration"]:
            pct = max(0, min(100, round(100 * r["time_offset"] / r["duration"])))
        iid = r["id"]
        seen.add(iid)
        out.append({
            "id": iid,
            "type": "series" if r["type"] in ("series", "tv") else (r["type"] or "movie"),
            "name": r["name"] or meta.get("title") or iid,
            "poster": meta.get("poster") or r["poster"] or "",
            "year": str(meta.get("year") or "")[:4],
            "genres": meta.get("genres") or [],
            "language": meta.get("language") or "",
            "vote": meta.get("vote_average"),
            "status": _status(r),
            "pct": pct,
            "times": r["times_watched"],
            "hours": round((r["overall_time_watched"] or 0) / 3_600_000, 1),
            "last": (r["last_watched"] or r["mtime"] or "")[:19],
            "removed": bool(r["removed"]),
            "airing": bool(r["has_scheduled"]),
            "episode": (r["video_id"] or "") if (r["video_id"] or "").count(":") == 2 else "",
            "shelves": [k for k in shelves if iid in shelves[k]],
            "stars": ratings.get(iid),
            "has_meta": bool(meta) and not meta.get("_stub"),
        })
    # companion-recorded history that Stremio doesn't know about
    for h in conn.execute(
        "SELECT w.imdb_id, w.watched_at, w.completed, m.tmdb_data FROM watch_history w "
        "LEFT JOIN metadata_cache m ON m.imdb_id=w.imdb_id WHERE w.profile_id=?", (profile_id,)
    ):
        if h["imdb_id"] in seen:
            continue
        meta = json.loads(h["tmdb_data"]) if h["tmdb_data"] else {}
        iid = h["imdb_id"]
        out.append({
            "id": iid, "type": meta.get("type") or "movie",
            "name": meta.get("title") or iid, "poster": meta.get("poster") or "",
            "year": str(meta.get("year") or "")[:4], "genres": meta.get("genres") or [],
            "language": meta.get("language") or "", "vote": meta.get("vote_average"),
            "status": "watched", "pct": 100, "times": 1, "hours": 0,
            "last": (h["watched_at"] or "")[:19], "removed": False, "airing": False,
            "episode": "", "shelves": [k for k in shelves if iid in shelves[k]],
            "stars": ratings.get(iid), "has_meta": bool(meta),
        })
    return out


def missing_meta_ids(conn) -> list[str]:
    return [r[0] for r in conn.execute(
        "SELECT s.id FROM stremio_items s LEFT JOIN metadata_cache m ON m.imdb_id=s.id "
        "WHERE s.id LIKE 'tt%' AND (m.imdb_id IS NULL OR json_extract(m.tmdb_data,'$._stub')=1)"
    )]
