"""
Common query helpers. All functions accept an open sqlite3.Connection.
Callers are responsible for connection lifecycle (open / commit / close).
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Optional

from config import TMDB_CACHE_TTL_DAYS, CATALOG_PAGE_SIZE


# ─────────────────────────────────────────────────────────────────────────────
# Profiles
# ─────────────────────────────────────────────────────────────────────────────

def create_profile(conn, name: str) -> str:
    pid = str(uuid.uuid4())
    conn.execute("INSERT INTO profiles (id, name) VALUES (?, ?)", (pid, name))
    conn.commit()
    return pid


def get_profile(conn, profile_id: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    return dict(row) if row else None


def list_profiles(conn) -> list:
    rows = conn.execute("SELECT * FROM profiles ORDER BY created_at").fetchall()
    return [dict(r) for r in rows]


def delete_profile(conn, profile_id: str) -> None:
    for table in ("watchlist", "ratings", "watch_history", "lists"):
        conn.execute(f"DELETE FROM {table} WHERE profile_id = ?", (profile_id,))
    conn.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
    conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Watchlist
# ─────────────────────────────────────────────────────────────────────────────

def watchlist_add(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "INSERT OR IGNORE INTO watchlist (profile_id, imdb_id) VALUES (?, ?)",
        (profile_id, imdb_id),
    )
    conn.commit()


def watchlist_remove(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "DELETE FROM watchlist WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    )
    conn.commit()


def bulk_watchlist_remove(conn, profile_id: str, imdb_ids: list) -> int:
    """Remove multiple titles from the watchlist. Returns count removed."""
    if not imdb_ids:
        return 0
    placeholders = ",".join("?" * len(imdb_ids))
    cur = conn.execute(
        f"DELETE FROM watchlist WHERE profile_id = ? AND imdb_id IN ({placeholders})",
        [profile_id] + list(imdb_ids),
    )
    conn.commit()
    return cur.rowcount


def watchlist_contains(conn, profile_id: str, imdb_id: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM watchlist WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    ).fetchone()
    return row is not None


def get_watchlist(conn, profile_id: str, skip: int = 0, limit: int = CATALOG_PAGE_SIZE) -> list:
    rows = conn.execute(
        "SELECT imdb_id FROM watchlist WHERE profile_id = ? "
        "ORDER BY added_at DESC LIMIT ? OFFSET ?",
        (profile_id, limit, skip),
    ).fetchall()
    return [r["imdb_id"] for r in rows]


def get_watchlist_count(conn, profile_id: str) -> int:
    return conn.execute(
        "SELECT COUNT(*) FROM watchlist WHERE profile_id = ?", (profile_id,)
    ).fetchone()[0]


# ─────────────────────────────────────────────────────────────────────────────
# Ratings
# ─────────────────────────────────────────────────────────────────────────────

def set_rating(conn, profile_id: str, imdb_id: str, stars: int, review: str = "") -> None:
    conn.execute(
        "INSERT INTO ratings (profile_id, imdb_id, stars, review, rated_at) "
        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(profile_id, imdb_id) DO UPDATE SET "
        "stars = excluded.stars, review = excluded.review, rated_at = excluded.rated_at",
        (profile_id, imdb_id, stars, review),
    )
    conn.commit()


def get_rating(conn, profile_id: str, imdb_id: str) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM ratings WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    ).fetchone()
    return dict(row) if row else None


def get_rated_titles(conn, profile_id: str, skip: int = 0, limit: int = CATALOG_PAGE_SIZE) -> list:
    rows = conn.execute(
        "SELECT imdb_id FROM ratings WHERE profile_id = ? "
        "ORDER BY stars DESC, rated_at DESC LIMIT ? OFFSET ?",
        (profile_id, limit, skip),
    ).fetchall()
    return [r["imdb_id"] for r in rows]


def delete_rating(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "DELETE FROM ratings WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    )
    conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Watch history
# ─────────────────────────────────────────────────────────────────────────────

def record_watch(conn, profile_id: str, imdb_id: str,
                 progress_pct: int = 100, completed: bool = True) -> None:
    conn.execute(
        "INSERT INTO watch_history (profile_id, imdb_id, progress_pct, completed, watched_at) "
        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(profile_id, imdb_id) DO UPDATE SET "
        "progress_pct = excluded.progress_pct, completed = excluded.completed, "
        "watched_at = excluded.watched_at",
        (profile_id, imdb_id, progress_pct, int(completed)),
    )
    conn.commit()


def get_history(conn, profile_id: str, skip: int = 0, limit: int = CATALOG_PAGE_SIZE) -> list:
    rows = conn.execute(
        "SELECT imdb_id FROM watch_history WHERE profile_id = ? "
        "ORDER BY watched_at DESC LIMIT ? OFFSET ?",
        (profile_id, limit, skip),
    ).fetchall()
    return [r["imdb_id"] for r in rows]


def get_watch_status(conn, profile_id: str, imdb_id: str) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM watch_history WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    ).fetchone()
    return dict(row) if row else None


# ─────────────────────────────────────────────────────────────────────────────
# Named lists
# ─────────────────────────────────────────────────────────────────────────────

def create_list(conn, profile_id: str, name: str, description: str = "") -> str:
    lid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO lists (id, profile_id, name, description) VALUES (?, ?, ?, ?)",
        (lid, profile_id, name, description),
    )
    conn.commit()
    return lid


def get_lists(conn, profile_id: str) -> list:
    rows = conn.execute(
        "SELECT l.*, COUNT(li.imdb_id) AS item_count "
        "FROM lists l LEFT JOIN list_items li ON l.id = li.list_id "
        "WHERE l.profile_id = ? GROUP BY l.id ORDER BY l.created_at",
        (profile_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def get_list(conn, list_id: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM lists WHERE id = ?", (list_id,)).fetchone()
    return dict(row) if row else None


def delete_list(conn, list_id: str) -> None:
    conn.execute("DELETE FROM list_items WHERE list_id = ?", (list_id,))
    conn.execute("DELETE FROM lists WHERE id = ?", (list_id,))
    conn.commit()


def list_add_item(conn, list_id: str, imdb_id: str) -> None:
    max_order = conn.execute(
        "SELECT COALESCE(MAX(sort_order), -1) FROM list_items WHERE list_id = ?",
        (list_id,),
    ).fetchone()[0]
    conn.execute(
        "INSERT OR IGNORE INTO list_items (list_id, imdb_id, sort_order) VALUES (?, ?, ?)",
        (list_id, imdb_id, max_order + 1),
    )
    conn.commit()


def list_remove_item(conn, list_id: str, imdb_id: str) -> None:
    conn.execute(
        "DELETE FROM list_items WHERE list_id = ? AND imdb_id = ?",
        (list_id, imdb_id),
    )
    conn.commit()


def get_list_items(conn, list_id: str, skip: int = 0, limit: int = CATALOG_PAGE_SIZE) -> list:
    rows = conn.execute(
        "SELECT imdb_id FROM list_items WHERE list_id = ? "
        "ORDER BY sort_order LIMIT ? OFFSET ?",
        (list_id, limit, skip),
    ).fetchall()
    return [r["imdb_id"] for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# Metadata cache
# ─────────────────────────────────────────────────────────────────────────────

def cache_get(conn, imdb_id: str) -> Optional[dict]:
    row = conn.execute(
        "SELECT tmdb_data, cached_at FROM metadata_cache WHERE imdb_id = ?",
        (imdb_id,),
    ).fetchone()
    if not row:
        return None
    cached_at = datetime.fromisoformat(str(row["cached_at"]))
    if datetime.utcnow() - cached_at > timedelta(days=TMDB_CACHE_TTL_DAYS):
        return None
    return json.loads(row["tmdb_data"])


def cache_set(conn, imdb_id: str, data: dict) -> None:
    conn.execute(
        "INSERT INTO metadata_cache (imdb_id, tmdb_data, cached_at) "
        "VALUES (?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(imdb_id) DO UPDATE SET "
        "tmdb_data = excluded.tmdb_data, cached_at = excluded.cached_at",
        (imdb_id, json.dumps(data)),
    )
    conn.commit()


def cache_purge_stale(conn) -> int:
    cutoff = (datetime.utcnow() - timedelta(days=TMDB_CACHE_TTL_DAYS)).isoformat()
    cur = conn.execute("DELETE FROM metadata_cache WHERE cached_at < ?", (cutoff,))
    conn.commit()
    return cur.rowcount


def cache_clear_stubs(conn) -> int:
    """Delete cached entries that were stored in stub mode (no real title).
    This forces a fresh TMDB fetch next time get_metadata() is called."""
    cur = conn.execute(
        "DELETE FROM metadata_cache WHERE json_extract(tmdb_data, '$._stub') = 1"
    )
    conn.commit()
    return cur.rowcount


# ─────────────────────────────────────────────────────────────────────────────
# Import sessions  (preview staging — server-side, keyed by UUID in cookie)
# ─────────────────────────────────────────────────────────────────────────────

def import_session_create(conn, session_id: str, profile_id: str, items: list) -> None:
    conn.execute(
        "INSERT INTO import_sessions (id, profile_id, items_json, created_at) "
        "VALUES (?, ?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(id) DO UPDATE SET "
        "items_json = excluded.items_json, created_at = excluded.created_at",
        (session_id, profile_id, json.dumps(items)),
    )
    conn.commit()


def import_session_get(conn, session_id: str) -> Optional[list]:
    row = conn.execute(
        "SELECT items_json FROM import_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    return json.loads(row["items_json"]) if row else None


def import_session_delete(conn, session_id: str) -> None:
    conn.execute("DELETE FROM import_sessions WHERE id = ?", (session_id,))
    conn.commit()


def import_sessions_purge_old(conn) -> int:
    cur = conn.execute(
        "DELETE FROM import_sessions WHERE created_at < datetime('now', '-1 day')"
    )
    conn.commit()
    return cur.rowcount


# ─────────────────────────────────────────────────────────────────────────────
# Blacklist
# ─────────────────────────────────────────────────────────────────────────────

def blacklist_add(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "INSERT OR IGNORE INTO blacklist (profile_id, imdb_id) VALUES (?, ?)",
        (profile_id, imdb_id),
    )
    conn.commit()


def bulk_blacklist_add(conn, profile_id: str, imdb_ids: list) -> int:
    inserted = 0
    for imdb_id in imdb_ids:
        cur = conn.execute(
            "INSERT OR IGNORE INTO blacklist (profile_id, imdb_id) VALUES (?, ?)",
            (profile_id, imdb_id),
        )
        inserted += cur.rowcount
    conn.commit()
    return inserted


def blacklist_remove(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "DELETE FROM blacklist WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    )
    conn.commit()



def get_blacklist(conn, profile_id: str, skip: int = 0, limit: int = 500000) -> list:
    rows = conn.execute(
        "SELECT imdb_id FROM blacklist WHERE profile_id = ? "
        "ORDER BY blocked_at DESC LIMIT ? OFFSET ?",
        (profile_id, limit, skip),
    ).fetchall()
    return [r["imdb_id"] for r in rows]


def get_blacklist_set(conn, profile_id: str) -> set:
    """Return the full blacklist as a set for fast O(1) membership checks."""
    rows = conn.execute(
        "SELECT imdb_id FROM blacklist WHERE profile_id = ?", (profile_id,)
    ).fetchall()
    return {r["imdb_id"] for r in rows}


def blacklist_count(conn, profile_id: str) -> int:
    return conn.execute(
        "SELECT COUNT(*) FROM blacklist WHERE profile_id = ?", (profile_id,)
    ).fetchone()[0]


# ─────────────────────────────────────────────────────────────────────────────
# Skip list  ("Not Interested")
# ─────────────────────────────────────────────────────────────────────────────

def skip_list_add(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "INSERT OR IGNORE INTO skip_list (profile_id, imdb_id) VALUES (?, ?)",
        (profile_id, imdb_id),
    )
    conn.commit()


def skip_list_remove(conn, profile_id: str, imdb_id: str) -> None:
    conn.execute(
        "DELETE FROM skip_list WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    )
    conn.commit()


def bulk_skip_list_add(conn, profile_id: str, imdb_ids: list) -> int:
    n = 0
    for imdb_id in imdb_ids:
        conn.execute(
            "INSERT OR IGNORE INTO skip_list (profile_id, imdb_id) VALUES (?, ?)",
            (profile_id, imdb_id),
        )
        n += 1
    conn.commit()
    return n


def bulk_skip_list_remove(conn, profile_id: str, imdb_ids: list) -> int:
    n = len(imdb_ids)
    for imdb_id in imdb_ids:
        conn.execute(
            "DELETE FROM skip_list WHERE profile_id = ? AND imdb_id = ?",
            (profile_id, imdb_id),
        )
    conn.commit()
    return n


def skip_list_contains(conn, profile_id: str, imdb_id: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM skip_list WHERE profile_id = ? AND imdb_id = ?",
        (profile_id, imdb_id),
    ).fetchone() is not None


def get_skip_list(conn, profile_id: str, skip: int = 0, limit: int = 500000) -> list:
    rows = conn.execute(
        "SELECT imdb_id FROM skip_list WHERE profile_id = ? "
        "ORDER BY skipped_at DESC LIMIT ? OFFSET ?",
        (profile_id, limit, skip),
    ).fetchall()
    return [r["imdb_id"] for r in rows]


def skip_list_count(conn, profile_id: str) -> int:
    return conn.execute(
        "SELECT COUNT(*) FROM skip_list WHERE profile_id = ?", (profile_id,)
    ).fetchone()[0]


def bulk_watchlist_add(conn, profile_id: str, imdb_ids: list) -> int:
    inserted = 0
    for imdb_id in imdb_ids:
        cur = conn.execute(
            "INSERT OR IGNORE INTO watchlist (profile_id, imdb_id) VALUES (?, ?)",
            (profile_id, imdb_id),
        )
        inserted += cur.rowcount
    conn.commit()
    return inserted


# ─────────────────────────────────────────────────────────────────────────────
# Personal tags
# ─────────────────────────────────────────────────────────────────────────────

def tags_add(conn, profile_id: str, imdb_id: str, tag: str) -> None:
    conn.execute(
        "INSERT OR IGNORE INTO title_tags (profile_id, imdb_id, tag) VALUES (?, ?, ?)",
        (profile_id, imdb_id, tag.strip().lower()),
    )
    conn.commit()


def tags_remove(conn, profile_id: str, imdb_id: str, tag: str) -> None:
    conn.execute(
        "DELETE FROM title_tags WHERE profile_id = ? AND imdb_id = ? AND tag = ?",
        (profile_id, imdb_id, tag.strip().lower()),
    )
    conn.commit()


def tags_get(conn, profile_id: str, imdb_id: str) -> list:
    rows = conn.execute(
        "SELECT tag FROM title_tags WHERE profile_id = ? AND imdb_id = ? ORDER BY tag",
        (profile_id, imdb_id),
    ).fetchall()
    return [r["tag"] for r in rows]


def tags_get_all(conn, profile_id: str) -> list:
    rows = conn.execute(
        "SELECT DISTINCT tag FROM title_tags WHERE profile_id = ? ORDER BY tag",
        (profile_id,),
    ).fetchall()
    return [r["tag"] for r in rows]


def tags_for_items(conn, profile_id: str, imdb_ids: list) -> dict:
    """Return {imdb_id: [tags]} for a batch of IDs."""
    if not imdb_ids:
        return {}
    placeholders = ",".join("?" * len(imdb_ids))
    rows = conn.execute(
        f"SELECT imdb_id, tag FROM title_tags WHERE profile_id = ? AND imdb_id IN ({placeholders}) ORDER BY tag",
        [profile_id] + list(imdb_ids),
    ).fetchall()
    result = {}
    for r in rows:
        result.setdefault(r["imdb_id"], []).append(r["tag"])
    return result


def tags_get_ids_by_tag(conn, profile_id: str, tag: str) -> set:
    """Return set of imdb_ids that have the given tag."""
    rows = conn.execute(
        "SELECT imdb_id FROM title_tags WHERE profile_id = ? AND tag = ?",
        (profile_id, tag.strip().lower()),
    ).fetchall()
    return {r["imdb_id"] for r in rows}
