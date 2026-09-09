"""
TMDB metadata resolver with SQLite caching.

When TMDB_API_KEY is empty the module works in stub mode:
  - cache_get / cache_set still work normally
  - fetch_* functions return a placeholder dict instead of hitting the API
"""

import json
import httpx
import asyncio
from typing import Optional

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE
import db.queries as Q

# Static TMDB genre ID → name mapping (these IDs are stable)
_GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
    53: "Thriller", 10752: "War", 37: "Western",
    # TV-specific
    10759: "Action & Adventure", 10762: "Kids", 10763: "News",
    10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
    10767: "Talk", 10768: "War & Politics",
}


# ── Stub helpers ──────────────────────────────────────────────────────────────

def _stub_meta(imdb_id: str) -> dict:
    """Placeholder when no API key is configured."""
    return {
        "imdb_id": imdb_id,
        "tmdb_id": None,
        "title": imdb_id,
        "year": None,
        "overview": "TMDB API key not configured -- add TMDB_API_KEY to config.py",
        "poster": "",
        "backdrop": "",
        "genres": [],
        "runtime": None,
        "type": "movie",
        "language": None,
        "vote_average": None,
        "origin_country": [],
        "_stub": True,
    }


# ── TMDB API calls ────────────────────────────────────────────────────────────

async def _get(path: str, params: dict = None) -> dict:
    """Low-level async TMDB GET."""
    if not TMDB_API_KEY:
        return {}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{TMDB_BASE_URL}{path}",
            params={"api_key": TMDB_API_KEY, **(params or {})},
        )
        resp.raise_for_status()
        return resp.json()


def _build_meta_from_tmdb_result(cache_key: str, r: dict, is_tv: bool) -> dict:
    """Build a metadata dict from a raw TMDB movie or TV result dict.
    Uses the real IMDB ID from TMDB's external_ids if available, so that
    tmdb:-keyed items still get served with proper tt- IDs to Stremio.
    """
    real_imdb = (
        r.get("imdb_id")
        or (r.get("external_ids") or {}).get("imdb_id")
        or cache_key
    )
    title    = r.get("title") or r.get("name", cache_key)
    release  = r.get("release_date") or r.get("first_air_date", "")
    year     = release[:4] if release else None
    poster   = f"{TMDB_IMAGE_BASE}{r['poster_path']}"   if r.get("poster_path")   else ""
    backdrop = f"{TMDB_IMAGE_BASE}{r['backdrop_path']}" if r.get("backdrop_path") else ""
    genre_ids = r.get("genre_ids") or [g["id"] for g in r.get("genres", [])]
    genres = [_GENRE_MAP[gid] for gid in genre_ids if gid in _GENRE_MAP]
    return {
        "imdb_id":       real_imdb,
        "tmdb_id":       r.get("id"),
        "title":         title,
        "year":          year,
        "overview":      r.get("overview", ""),
        "poster":        poster,
        "backdrop":      backdrop,
        "genres":        genres,
        "runtime":       None,
        "type":          "series" if is_tv else "movie",
        "language":      r.get("original_language"),
        "vote_average":  r.get("vote_average"),
        "origin_country": r.get("origin_country", []),
        "_stub":         False,
    }


async def _fetch_by_tmdb_numeric_id(cache_key: str) -> dict:
    """
    Resolve a tmdb:XXXXXX ID (stored by paste/title-search import) using
    TMDB's /movie/{id} and /tv/{id} endpoints.
    Fetches external_ids so we can swap the tmdb: key for a real tt- ID,
    making the catalog item fully navigable inside Stremio.
    """
    tmdb_num = cache_key[len("tmdb:"):]
    for path, is_tv in [
        (f"/movie/{tmdb_num}", False),
        (f"/tv/{tmdb_num}",    True),
    ]:
        try:
            r = await _get(path, {"append_to_response": "external_ids"})
            if r.get("id"):
                return _build_meta_from_tmdb_result(cache_key, r, is_tv)
        except Exception:
            continue
    return _stub_meta(cache_key)


async def _fetch_from_tmdb(imdb_id: str) -> dict:
    """Fetch metadata for a given ID via TMDB.
    Handles both real IMDB tt-IDs (via /find) and tmdb:XXXXXX IDs
    produced by paste import (via /movie or /tv directly).
    """
    if not TMDB_API_KEY:
        return _stub_meta(imdb_id)

    # ── tmdb: prefixed IDs (paste import / TMDB title-search flow) ───────────
    if imdb_id.startswith("tmdb:"):
        return await _fetch_by_tmdb_numeric_id(imdb_id)

    # ── Standard IMDB tt-ID lookup via /find ──────────────────────────────────
    data    = await _get(f"/find/{imdb_id}", {"external_source": "imdb_id"})
    results = data.get("movie_results", []) or data.get("tv_results", [])
    if not results:
        return _stub_meta(imdb_id)

    r     = results[0]
    is_tv = "name" in r
    return _build_meta_from_tmdb_result(imdb_id, r, is_tv)


async def get_metadata(conn, imdb_id: str) -> dict:
    """
    Return metadata for imdb_id.
    Checks cache first; hits TMDB if stale/missing; writes back to cache.
    """
    cached = Q.cache_get(conn, imdb_id)
    if cached:
        return cached

    meta = await _fetch_from_tmdb(imdb_id)
    if not meta.get("_stub"):
        Q.cache_set(conn, imdb_id, meta)
    return meta


async def get_metadata_batch(conn, imdb_ids: list) -> dict:
    """
    Fetch metadata for multiple IDs. Uses a single batch SELECT for cache
    hits (fast), then fires TMDB requests only for misses (rate-limited).
    """
    if not imdb_ids:
        return {}

    # ── Batch cache lookup — chunked to stay under SQLite's 999-var limit ───────
    from datetime import datetime, timedelta
    from config import TMDB_CACHE_TTL_DAYS
    cutoff = (datetime.utcnow() - timedelta(days=TMDB_CACHE_TTL_DAYS)).isoformat()

    out = {}
    chunk_size = 900
    for i in range(0, len(imdb_ids), chunk_size):
        chunk = imdb_ids[i : i + chunk_size]
        placeholders = ",".join("?" * len(chunk))
        rows = conn.execute(
            f"SELECT imdb_id, tmdb_data FROM metadata_cache "
            f"WHERE imdb_id IN ({placeholders}) AND cached_at > ?",
            (*chunk, cutoff),
        ).fetchall()
        for row in rows:
            try:
                data = json.loads(row["tmdb_data"])
                if not data.get("_stub"):
                    out[row["imdb_id"]] = data
            except Exception:
                pass

    # ── TMDB fetch for cache misses (semaphore keeps rate limits sane) ────────
    misses = [iid for iid in imdb_ids if iid not in out]
    if misses:
        sem = asyncio.Semaphore(8)

        async def _fetch_one(iid):
            async with sem:
                return await _fetch_from_tmdb(iid)

        results = await asyncio.gather(*[_fetch_one(iid) for iid in misses],
                                       return_exceptions=True)
        for iid, res in zip(misses, results):
            if isinstance(res, Exception):
                out[iid] = _stub_meta(iid)
            else:
                if not res.get("_stub"):
                    Q.cache_set(conn, iid, res)
                out[iid] = res

    return out


# ── Person / director / actor search ──────────────────────────────────────────

async def search_person(name: str) -> list:
    """Return list of people matching the name query."""
    if not TMDB_API_KEY:
        return []
    data = await _get("/search/person", {"query": name, "include_adult": False})
    return data.get("results", [])


async def person_movie_credits(tmdb_person_id: int) -> list:
    """Return list of movie credits for a TMDB person ID."""
    if not TMDB_API_KEY:
        return []
    data = await _get(f"/person/{tmdb_person_id}/movie_credits")
    return data


# ── Stremio meta object builder ───────────────────────────────────────────────

def meta_to_stremio(meta: dict) -> dict:
    """Convert our internal metadata dict to a Stremio meta object."""
    obj = {
        "id": meta["imdb_id"],
        "type": meta.get("type", "movie"),
        "name": meta.get("title", meta["imdb_id"]),
        "poster": meta.get("poster", ""),
        "background": meta.get("backdrop", ""),
        "description": meta.get("overview", ""),
        "genres": meta.get("genres", []),
    }
    if meta.get("year"):
        obj["year"] = int(meta["year"])
    if meta.get("runtime"):
        obj["runtime"] = f"{meta['runtime']} min"
    return obj


def meta_to_catalog_item(meta: dict) -> dict:
    """Minimal catalog item for Stremio catalog responses."""
    return {
        "id": meta["imdb_id"],
        "type": meta.get("type", "movie"),
        "name": meta.get("title", meta["imdb_id"]),
        "poster": meta.get("poster", ""),
    }
