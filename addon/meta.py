"""
Meta endpoint handler.
Returns full Stremio meta object for a given IMDB ID.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from addon.tmdb import get_metadata, meta_to_stremio


async def get_meta(conn, imdb_id: str, media_type: str) -> dict | None:
    """Return a Stremio meta object, or None if not found."""
    meta = await get_metadata(conn, imdb_id)
    if not meta:
        return None
    stremio_meta = meta_to_stremio(meta)
    # Override type from URL if we know it
    if media_type in ("movie", "series"):
        stremio_meta["type"] = media_type
    return stremio_meta
