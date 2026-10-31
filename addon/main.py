"""
Stremio Add-on — FastAPI entry point.

All endpoints are scoped under /{profile_id}/ so each profile
gets its own installable add-on URL:

  http://localhost:7000/{profile_uuid}/manifest.json
"""

import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db.schema import init_db, get_connection
import db.queries as Q
from addon.manifest import build_manifest
from addon.catalog import (
    handle_watchlist,
    handle_watch_history,
    handle_ratings,
    handle_user_list,
    handle_director_search,
    handle_actor_search,
    handle_shelf,
    handle_stremio_history,
)
from addon.stream import get_streams
from addon.meta import get_meta

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(title="Stremio Custom Add-on", docs_url="/docs")

# Raw CORS middleware — intercepts OPTIONS before FastAPI's router touches it,
# and stamps Access-Control-Allow-Origin: * on every response.
# Replaces Starlette's CORSMiddleware which was returning 400 on preflight.
class StremioCorsMW(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin":  "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age":       "86400",
                },
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

app.add_middleware(StremioCorsMW)

# Initialise DB on startup
@app.on_event("startup")
def startup():
    init_db()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_conn():
    return get_connection()


def _require_profile(conn, profile_id: str):
    profile = Q.get_profile(conn, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found.")
    return profile


def _parse_skip(skip_str: str) -> int:
    try:
        return int(skip_str)
    except (TypeError, ValueError):
        return 0


# ── Root / health ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    conn = _get_conn()
    try:
        profiles = Q.list_profiles(conn)
    finally:
        conn.close()
    return {
        "status": "ok",
        "profiles": [
            {"id": p["id"], "name": p["name"],
             "manifest_url": f"/{p['id']}/manifest.json"}
            for p in profiles
        ],
        "hint": "Install a manifest URL in Stremio to get started.",
    }


# ── Manifest ──────────────────────────────────────────────────────────────────

@app.get("/{profile_id}/manifest.json")
def manifest(profile_id: str):
    conn = _get_conn()
    try:
        profile = _require_profile(conn, profile_id)
        user_lists = Q.get_lists(conn, profile_id)
        manifest_data = build_manifest(
            profile_id,
            profile["name"],
            [{"id": l["id"], "name": l["name"]} for l in user_lists],
        )
    finally:
        conn.close()
    return JSONResponse(content=manifest_data)


# ── Catalog ───────────────────────────────────────────────────────────────────
#
# Stremio catalog URL patterns:
#   /{profile_id}/catalog/{type}/{id}.json
#   /{profile_id}/catalog/{type}/{id}/skip={n}.json
#   /{profile_id}/catalog/{type}/{id}/search={q}.json

@app.get("/{profile_id}/catalog/{media_type}/{catalog_id}.json")
@app.get("/{profile_id}/catalog/{media_type}/{catalog_id}/skip={skip}.json")
async def catalog(
    profile_id: str,
    media_type: str,
    catalog_id: str,
    skip: str = "0",
    search: str = "",
):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        skip_n = _parse_skip(skip)
        items = await _resolve_catalog(conn, profile_id, catalog_id, media_type, skip_n, search)
    finally:
        conn.close()
    return JSONResponse(content={"metas": items})


@app.get("/{profile_id}/catalog/{media_type}/{catalog_id}/search={search}.json")
async def catalog_search(
    profile_id: str,
    media_type: str,
    catalog_id: str,
    search: str,
):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        items = await _resolve_catalog(conn, profile_id, catalog_id, media_type, 0, search)
    finally:
        conn.close()
    return JSONResponse(content={"metas": items})


@app.get("/{profile_id}/catalog/{media_type}/{catalog_id}/{extra}.json")
async def catalog_extra(profile_id: str, media_type: str, catalog_id: str, extra: str):
    """Generic extras path, e.g. genre=Horror&skip=100"""
    from urllib.parse import parse_qs
    ex = {k: v[0] for k, v in parse_qs(extra).items()}
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        items = await _resolve_catalog(conn, profile_id, catalog_id, media_type,
                                       _parse_skip(ex.get("skip", "0")), ex.get("search", ""),
                                       ex.get("genre", ""))
    finally:
        conn.close()
    return JSONResponse(content={"metas": items})


async def _resolve_catalog(conn, profile_id, catalog_id, media_type, skip, search, genre="") -> list:
    if catalog_id.startswith("shelf_"):
        return await handle_shelf(conn, profile_id, catalog_id[len("shelf_"):], media_type, skip, genre)
    if catalog_id == "watch_history":
        has_stremio = conn.execute("SELECT 1 FROM stremio_items LIMIT 1").fetchone()
        if has_stremio:
            return await handle_stremio_history(conn, profile_id, media_type, skip, genre)
    if catalog_id == "watchlist":
        return await handle_watchlist(conn, profile_id, media_type, skip=skip)
    elif catalog_id == "watch_history":
        return await handle_watch_history(conn, profile_id, skip=skip)
    elif catalog_id == "ratings":
        return await handle_ratings(conn, profile_id, skip=skip)
    elif catalog_id == "director_search":
        return await handle_director_search(conn, search)
    elif catalog_id == "actor_search":
        return await handle_actor_search(conn, search)
    elif catalog_id.startswith("list_"):
        list_id = catalog_id[len("list_"):]
        return await handle_user_list(conn, list_id, skip=skip)
    else:
        return []


# ── Stream ────────────────────────────────────────────────────────────────────

@app.get("/{profile_id}/stream/{media_type}/{imdb_id}.json")
async def stream(profile_id: str, media_type: str, imdb_id: str):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        # Try to get title for better torrent search accuracy
        # series ids arrive as tt1234567:season:episode
        meta_data = Q.cache_get(conn, imdb_id.split(":")[0])
        title = meta_data.get("title", "") if meta_data else ""
        year = str(meta_data.get("year") or "")[:4] if meta_data else ""
    finally:
        conn.close()

    streams = await get_streams(imdb_id, media_type, title, year)
    return JSONResponse(content={"streams": streams})


# ── Meta ──────────────────────────────────────────────────────────────────────

@app.get("/{profile_id}/meta/{media_type}/{imdb_id}.json")
async def meta(profile_id: str, media_type: str, imdb_id: str):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        meta_obj = await get_meta(conn, imdb_id, media_type)
    finally:
        conn.close()

    if not meta_obj:
        raise HTTPException(status_code=404, detail="Title not found.")
    return JSONResponse(content={"meta": meta_obj})


# ── Profile management (convenience REST API) ──────────────────────────────────

@app.post("/api/profiles")
def api_create_profile(request: Request, name: str = ""):
    if not name.strip():
        raise HTTPException(status_code=400, detail="name is required")
    conn = _get_conn()
    try:
        pid = Q.create_profile(conn, name.strip())
        profile = Q.get_profile(conn, pid)
    finally:
        conn.close()
    return {"profile": dict(profile), "manifest_url": f"/{pid}/manifest.json"}


@app.get("/api/profiles")
def api_list_profiles():
    conn = _get_conn()
    try:
        profiles = Q.list_profiles(conn)
    finally:
        conn.close()
    return {"profiles": profiles}


@app.delete("/api/profiles/{profile_id}")
def api_delete_profile(profile_id: str):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        Q.delete_profile(conn, profile_id)
    finally:
        conn.close()
    return {"status": "deleted"}


# ── Watchlist REST API (for companion app / extension) ─────────────────────────

@app.post("/api/{profile_id}/watchlist/add")
def api_watchlist_add(profile_id: str, imdb_id: str):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        Q.watchlist_add(conn, profile_id, imdb_id)
    finally:
        conn.close()
    return {"status": "added", "imdb_id": imdb_id}


@app.post("/api/{profile_id}/watchlist/remove")
def api_watchlist_remove(profile_id: str, imdb_id: str):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        Q.watchlist_remove(conn, profile_id, imdb_id)
    finally:
        conn.close()
    return {"status": "removed", "imdb_id": imdb_id}


@app.get("/api/{profile_id}/watchlist/check")
def api_watchlist_check(profile_id: str, imdb_id: str):
    conn = _get_conn()
    try:
        _require_profile(conn, profile_id)
        in_list = Q.watchlist_contains(conn, profile_id, imdb_id)
    finally:
        conn.close()
    return {"in_watchlist": in_list, "imdb_id": imdb_id}
