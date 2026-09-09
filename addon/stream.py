"""
Stream handler — queries multiple torrent sources in parallel and returns
ranked Stremio stream objects.

Sources implemented:
  - YTS (official JSON API) — movies only, best quality
  - The Pirate Bay (apibay.org JSON API)
  - Nyaa.si (RSS, anime-focused)

Add more sources by implementing the _search_* coroutines below and
adding them to SOURCES in get_streams().
"""

import re
import asyncio
import httpx
from typing import Optional

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ── Quality scoring ────────────────────────────────────────────────────────────

_QUALITY_SCORE = {
    "2160p": 100, "4k": 100,
    "1080p": 80,
    "720p": 60,
    "480p": 30,
    "unknown": 10,
}

def _quality_tag(name: str) -> str:
    name_l = name.lower()
    for q in ("2160p", "4k", "1080p", "720p", "480p"):
        if q in name_l:
            return q
    return "unknown"

def _score(stream: dict) -> float:
    q = _QUALITY_SCORE.get(stream.get("_quality", "unknown"), 10)
    seeds = stream.get("_seeds", 0)
    return q * 1000 + seeds


# ── YTS ───────────────────────────────────────────────────────────────────────

async def _search_yts(imdb_id: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://yts.mx/api/v2/movie_details.json",
                params={"imdb_id": imdb_id, "with_images": False, "with_cast": False},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    movie = data.get("data", {}).get("movie", {})
    torrents = movie.get("torrents", [])
    results = []
    for t in torrents:
        quality = t.get("quality", "unknown")
        codec = t.get("video_codec", "")
        size = t.get("size", "?")
        seeds = t.get("seeds", 0)
        magnet = (
            f"magnet:?xt=urn:btih:{t['hash']}"
            f"&dn={movie.get('title_long', imdb_id).replace(' ', '+')}"
            f"&tr=udp://open.demonii.com:1337/announce"
            f"&tr=udp://tracker.openbittorrent.com:80"
        )
        results.append({
            "name": f"YTS · {quality} {codec}",
            "title": f"💾 {size}  🌱 {seeds} seeds",
            "infoHash": t["hash"].lower(),
            "behaviorHints": {"bingeGroup": f"yts-{quality}"},
            "_quality": quality.lower(),
            "_seeds": seeds,
            "_source": "YTS",
        })
    return results


# ── The Pirate Bay ────────────────────────────────────────────────────────────

async def _search_tpb(imdb_id: str, title: str = "") -> list[dict]:
    """Use apibay.org JSON API (no scraping needed)."""
    query = title or imdb_id
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://apibay.org/q.php",
                params={"q": query, "cat": "200"},  # cat 200 = Video
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    if not isinstance(data, list):
        return []

    results = []
    for t in data[:20]:
        if t.get("id") == "0":
            continue
        name = t.get("name", "")
        seeders = int(t.get("seeders", 0))
        size_b = int(t.get("size", 0))
        size_str = _fmt_size(size_b)
        info_hash = t.get("info_hash", "").lower()
        if not info_hash:
            continue
        quality = _quality_tag(name)
        results.append({
            "name": f"TPB · {quality}",
            "title": f"💾 {size_str}  🌱 {seeders} seeds\n{name[:60]}",
            "infoHash": info_hash,
            "behaviorHints": {"bingeGroup": f"tpb-{quality}"},
            "_quality": quality,
            "_seeds": seeders,
            "_source": "TPB",
        })
    return results


# ── Nyaa (anime RSS) ──────────────────────────────────────────────────────────

async def _search_nyaa(query: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://nyaa.si/",
                params={"page": "rss", "q": query, "c": "1_0", "f": "0"},
            )
            resp.raise_for_status()
            xml = resp.text
    except Exception:
        return []

    # Minimal RSS parse (avoid lxml dep for small payload)
    results = []
    items = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
    for item in items[:20]:
        title_m = re.search(r"<title><!\[CDATA\[(.*?)\]\]></title>", item)
        link_m  = re.search(r"<link>(.*?)</link>", item)
        seeds_m = re.search(r"<nyaa:seeders>(\d+)</nyaa:seeders>", item)
        size_m  = re.search(r"<nyaa:size>(.*?)</nyaa:size>", item)

        if not (title_m and link_m):
            continue

        name = title_m.group(1)
        link = link_m.group(1)
        seeds = int(seeds_m.group(1)) if seeds_m else 0
        size_str = size_m.group(1) if size_m else "?"
        quality = _quality_tag(name)

        # Nyaa links are .torrent URLs, not magnets — Stremio needs a magnet or infoHash
        # Extract hash from link if possible, else skip
        hash_m = re.search(r"/download/([a-fA-F0-9]{40})\.torrent", link)
        if not hash_m:
            continue

        results.append({
            "name": f"Nyaa · {quality}",
            "title": f"💾 {size_str}  🌱 {seeds} seeds\n{name[:60]}",
            "infoHash": hash_m.group(1).lower(),
            "_quality": quality,
            "_seeds": seeds,
            "_source": "Nyaa",
        })
    return results


# ── Utilities ─────────────────────────────────────────────────────────────────

def _fmt_size(size_bytes: int) -> str:
    if size_bytes == 0:
        return "?"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} PB"


# ── Main entry point ──────────────────────────────────────────────────────────

async def get_streams(imdb_id: str, media_type: str = "movie", title: str = "") -> list[dict]:
    """
    Query all sources in parallel, rank results, return top Stremio stream objects.
    Private _* fields are stripped before returning.
    """
    SOURCES = [
        _search_yts(imdb_id),
        _search_tpb(imdb_id, title),
    ]
    if media_type != "movie":
        # Nyaa is most useful for series / anime
        SOURCES.append(_search_nyaa(title or imdb_id))

    gathered = await asyncio.gather(*SOURCES, return_exceptions=True)
    all_streams = []
    for result in gathered:
        if isinstance(result, list):
            all_streams.extend(result)

    # Deduplicate by infoHash
    seen = set()
    unique = []
    for s in all_streams:
        h = s.get("infoHash", "")
        if h and h not in seen:
            seen.add(h)
            unique.append(s)

    # Rank
    unique.sort(key=_score, reverse=True)

    # Strip internal fields
    public = []
    for s in unique[:20]:
        public.append({k: v for k, v in s.items() if not k.startswith("_")})
    return public
