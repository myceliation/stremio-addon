import sqlite3
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from config import DB_PATH

DDL = (
    "CREATE TABLE IF NOT EXISTS profiles ("
    "id TEXT PRIMARY KEY, name TEXT NOT NULL, "
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

    "CREATE TABLE IF NOT EXISTS watchlist ("
    "profile_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
    "PRIMARY KEY (profile_id, imdb_id));"

    "CREATE TABLE IF NOT EXISTS ratings ("
    "profile_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "stars INTEGER CHECK(stars BETWEEN 1 AND 5), review TEXT, "
    "rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
    "PRIMARY KEY (profile_id, imdb_id));"

    "CREATE TABLE IF NOT EXISTS watch_history ("
    "profile_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
    "progress_pct INTEGER DEFAULT 0, completed INTEGER DEFAULT 0, "
    "PRIMARY KEY (profile_id, imdb_id));"

    "CREATE TABLE IF NOT EXISTS lists ("
    "id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, "
    "name TEXT NOT NULL, description TEXT, is_public INTEGER DEFAULT 0, "
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

    "CREATE TABLE IF NOT EXISTS list_items ("
    "list_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, sort_order INTEGER DEFAULT 0, "
    "PRIMARY KEY (list_id, imdb_id));"

    "CREATE TABLE IF NOT EXISTS metadata_cache ("
    "imdb_id TEXT PRIMARY KEY, tmdb_data TEXT NOT NULL, "
    "cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

    "CREATE TABLE IF NOT EXISTS import_sessions ("
    "id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, "
    "items_json TEXT NOT NULL, "
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

    "CREATE TABLE IF NOT EXISTS blacklist ("
    "profile_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
    "PRIMARY KEY (profile_id, imdb_id));"

    "CREATE TABLE IF NOT EXISTS skip_list ("
    "profile_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "skipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
    "PRIMARY KEY (profile_id, imdb_id));"

    "CREATE TABLE IF NOT EXISTS title_tags ("
    "profile_id TEXT NOT NULL, imdb_id TEXT NOT NULL, "
    "tag TEXT NOT NULL, "
    "tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
    "PRIMARY KEY (profile_id, imdb_id, tag));"

    "CREATE INDEX IF NOT EXISTS idx_title_tags_profile "
    "ON title_tags(profile_id);"

    "CREATE INDEX IF NOT EXISTS idx_blacklist_profile "
    "ON blacklist(profile_id);"

    "CREATE INDEX IF NOT EXISTS idx_skip_list_profile "
    "ON skip_list(profile_id);"

    "CREATE INDEX IF NOT EXISTS idx_watchlist_profile "
    "ON watchlist(profile_id, added_at DESC);"
    "CREATE INDEX IF NOT EXISTS idx_ratings_profile "
    "ON ratings(profile_id, rated_at DESC);"
    "CREATE INDEX IF NOT EXISTS idx_history_profile "
    "ON watch_history(profile_id, watched_at DESC);"
    "CREATE INDEX IF NOT EXISTS idx_lists_profile "
    "ON lists(profile_id);"
    "CREATE INDEX IF NOT EXISTS idx_list_items_list "
    "ON list_items(list_id, sort_order);"
    "CREATE INDEX IF NOT EXISTS idx_cache_cached_at "
    "ON metadata_cache(cached_at);"
    "CREATE INDEX IF NOT EXISTS idx_import_sessions_created "
    "ON import_sessions(created_at);"
)


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _remove_stale_files():
    for suffix in ("-journal", "-shm", "-wal"):
        path = DB_PATH + suffix
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass


def init_db():
    _remove_stale_files()
    conn = get_connection()
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            conn.execute("PRAGMA journal_mode = WAL")
        except Exception:
            pass
        conn.executescript(DDL)
        conn.commit()
        print("[db] Database ready at " + DB_PATH)
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
