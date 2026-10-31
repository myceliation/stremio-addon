"""
Catalog endpoint handlers.
Each handler receives (profile_id, catalog_id, media_type, skip, search, conn)
and returns a list of Stremio catalog item dicts.
"""

import asyncio
import json
from typing import Optional

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import db.queries as Q
from addon.tmdb import get_metadata_batch, meta_to_catalog_item, search_person, person_movie_credits
from config import CATALOG_PAGE_SIZE, TMDB_API_KEY


async def _ids_to_catalog(conn, imdb_ids: list) -> list:
    """Resolve a list of IMDB IDs to Stremio catalog items via TMDB."""
    if not imdb_ids:
        return []
    meta_map = await get_metadata_batch(conn, imdb_ids)
    # Preserve original order
    items = []
    for iid in imdb_ids:
        meta = meta_map.get(iid)
        if meta:
            items.append(meta_to_catalog_item(meta))
    return items


def _watchlist_from_cache(conn, profile_id: str, media_type: str, skip: int, limit: int) -> list:
    """
    Pull watchlist items directly from the metadata cache via a SQL JOIN.
    This never makes TMDB API calls — if a title isn't cached yet it simply
    won't appear until the background worker fills the cache.  Fast path for
    the Stremio catalog endpoint.
    """
    rows = conn.execute(
        """
        SELECT w.imdb_id, m.tmdb_data
        FROM watchlist w
        JOIN metadata_cache m ON m.imdb_id = w.imdb_id
        WHERE w.profile_id = ?
          AND json_extract(m.tmdb_data, '$._stub') IS NOT 1
          AND json_extract(m.tmdb_data, '$.type') = ?
        ORDER BY w.added_at DESC
        LIMIT ? OFFSET ?
        """,
        (profile_id, media_type, limit, skip),
    ).fetchall()

    items = []
    for row in rows:
        try:
            meta = json.loads(row["tmdb_data"])
            items.append({
                "id":     meta.get("imdb_id", row["imdb_id"]),
                "type":   meta.get("type", media_type),
                "name":   meta.get("title", row["imdb_id"]),
                "poster": meta.get("poster", ""),
            })
        except Exception:
            pass
    return items


async def handle_watchlist(
    conn,
    profile_id: str,
    media_type: str,
    skip: int = 0,
) -> list:
    """
    Return one page of the watchlist filtered by media_type.
    Uses a direct SQL JOIN against the metadata cache — no TMDB calls,
    responds in milliseconds even for 5000+ item libraries.
    """
    return _watchlist_from_cache(conn, profile_id, media_type, skip, CATALOG_PAGE_SIZE)


async def handle_watch_history(
    conn,
    profile_id: str,
    skip: int = 0,
) -> list:
    imdb_ids = Q.get_history(conn, profile_id, skip=skip, limit=CATALOG_PAGE_SIZE)
    return await _ids_to_catalog(conn, imdb_ids)


async def handle_ratings(
    conn,
    profile_id: str,
    skip: int = 0,
) -> list:
    imdb_ids = Q.get_rated_titles(conn, profile_id, skip=skip, limit=CATALOG_PAGE_SIZE)
    return await _ids_to_catalog(conn, imdb_ids)


async def handle_user_list(
    conn,
    list_id: str,
    skip: int = 0,
) -> list:
    imdb_ids = Q.get_list_items(conn, list_id, skip=skip, limit=CATALOG_PAGE_SIZE)
    return await _ids_to_catalog(conn, imdb_ids)


async def handle_director_search(conn, query: str) -> list:
    """Search TMDB for a director name and return their filmography."""
    if not query or not TMDB_API_KEY:
        return []
    people = await search_person(query)
    if not people:
        return []
    # Use the most-popular result
    person = people[0]
    credits = await person_movie_credits(person["id"])
    crew = credits.get("crew", [])
    directed = [c for c in crew if c.get("job") == "Director"]
    # Sort by popularity
    directed.sort(key=lambda x: x.get("popularity", 0), reverse=True)
    items = []
    for c in directed[:CATALOG_PAGE_SIZE]:
        poster = f"https://image.tmdb.org/t/p/w500{c['poster_path']}" if c.get("poster_path") else ""
        items.append({
            "id":     f"tmdb:{c['id']}",
            "type":   "movie",
            "name":   c.get("title", "Unknown"),
            "poster": poster,
        })
    return items


async def handle_actor_search(conn, query: str) -> list:
    """Search TMDB for an actor name and return their filmography."""
    if not query or not TMDB_API_KEY:
        return []
    people = await search_person(query)
    if not people:
        return []
    person = people[0]
    credits = await person_movie_credits(person["id"])
    cast = credits.get("cast", [])
    cast.sort(key=lambda x: x.get("popularity", 0), reverse=True)
    items = []
    for c in cast[:CATALOG_PAGE_SIZE]:
        poster = f"https://image.tmdb.org/t/p/w500{c['poster_path']}" if c.get("poster_path") else ""
        items.append({
            "id":     f"tmdb:{c['id']}",
            "type":   "movie",
            "name":   c.get("title", "Unknown"),
            "poster": poster,
        })
    return items


# ── Shelves + Stremio's own history (read by the companion) ───────────────────

GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama",
          "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance",
          "Sci-Fi", "Thriller", "War", "Western"]


def _meta_item(iid, tmdb_json, fallback_type, name=None, poster=None):
    meta = {}
    if tmdb_json:
        try:
            meta = json.loads(tmdb_json)
        except Exception:
            meta = {}
    return {
        "id": iid,
        "type": meta.get("type") or fallback_type,
        "name": meta.get("title") or name or iid,
        "poster": meta.get("poster") or poster or "",
        "genres": meta.get("genres") or [],
        "releaseInfo": str(meta.get("year") or "")[:4],
    }


def _page(items, media_type, genre, skip):
    out = [i for i in items
           if (i["type"] == media_type or (media_type == "series" and i["type"] == "tv"))
           and (not genre or genre in i["genres"])]
    return out[skip: skip + CATALOG_PAGE_SIZE]


async def handle_shelf(conn, profile_id: str, shelf: str, media_type: str,
                       skip: int = 0, genre: str = "") -> list:
    rows = conn.execute(
        "SELECT t.imdb_id, m.tmdb_data, s.name, s.poster FROM title_tags t "
        "LEFT JOIN metadata_cache m ON m.imdb_id=t.imdb_id "
        "LEFT JOIN stremio_items s ON s.id=t.imdb_id "
        "WHERE t.profile_id=? AND t.tag=? ORDER BY t.tagged_at DESC",
        (profile_id, shelf),
    ).fetchall()
    items = [_meta_item(r[0], r[1], "movie", r[2], r[3]) for r in rows]
    return _page(items, media_type, genre, skip)


async def handle_stremio_history(conn, profile_id: str, media_type: str,
                                 skip: int = 0, genre: str = "") -> list:
    rows = conn.execute(
        "SELECT s.id, m.tmdb_data, s.name, s.poster, s.type FROM stremio_items s "
        "LEFT JOIN metadata_cache m ON m.imdb_id=s.id "
        "WHERE (s.flagged_watched>0 OR s.times_watched>0 OR s.time_offset>60000) "
        "AND s.id NOT IN (SELECT imdb_id FROM blacklist WHERE profile_id=?) "
        "ORDER BY s.last_watched DESC",
        (profile_id,),
    ).fetchall()
    items = [_meta_item(r[0], r[1], r[4] or "movie", r[2], r[3]) for r in rows]
    return _page(items, media_type, genre, skip)
