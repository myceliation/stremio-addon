"""
Stream handler — queries several torrent *indexers* in parallel and returns
ranked Stremio stream objects.

Indexers vs trackers
  An indexer answers "which torrents exist for this title?" (YTS, TPB, Nyaa,
  Jackett/Prowlarr, Torrentio...). A tracker answers "who is seeding this
  hash?". Coverage comes from indexers; trackers only help peers find each
  other once a hash is chosen. So every stream we return also carries a short
  list of good trackers in `sources`, which Stremio's streaming server uses
  for peer discovery alongside DHT.

Sources
  - YTS            official JSON API, movies only
  - The Pirate Bay apibay.org JSON API (IMDb-id search for movies)
  - Nyaa           RSS, anime / series
  - Jackett        any indexers you've configured in your local Jackett
                   (or Prowlarr's Jackett-compatible endpoint)
  - Upstream       other Stremio stream add-ons (e.g. Torrentio) merged in,
                   de-duplicated and re-ranked with everything else
"""
from __future__ import annotations

import asyncio
import json
import math
import os
import re
import sys
import time
from urllib.parse import quote

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config as C  # noqa: E402

UA = {"User-Agent": "Mozilla/5.0 (stremio-addon-suite)"}
SOURCE_TIMEOUT = float(getattr(C, "STREAM_SOURCE_TIMEOUT", 9))


# ── Quality / scoring ─────────────────────────────────────────────────────────

_QUALITY_SCORE = {"2160p": 100, "1080p": 80, "720p": 60, "480p": 30, "unknown": 10}


def _quality_tag(name: str) -> str:
    n = name.lower()
    if "2160p" in n or re.search(r"\b4k\b|\buhd\b", n):
        return "2160p"
    for q in ("1080p", "720p", "480p"):
        if q in n:
            return q
    return "unknown"


def _extras(name: str) -> str:
    n = name.lower()
    bits = []
    if re.search(r"x265|hevc|h\.?265", n): bits.append("HEVC")
    if re.search(r"\bhdr|dolby.?vision|\bdv\b", n): bits.append("HDR")
    if re.search(r"remux", n): bits.append("REMUX")
    if re.search(r"web-?dl|webrip", n): bits.append("WEB")
    if re.search(r"blu-?ray|bdrip|brrip", n): bits.append("BluRay")
    if re.search(r"\bcam\b|hdcam|\bts\b|telesync|hdts", n): bits.append("CAM")
    return " ".join(bits)


def _score(s: dict) -> float:
    """Quality first, but a barely-seeded 4K loses to a healthy 1080p."""
    q = _QUALITY_SCORE.get(s.get("_quality", "unknown"), 10)
    seeds = int(s.get("_seeds") or 0)
    score = q * 10 + 40 * math.log10(1 + seeds)
    if seeds < 5:
        score -= 300
    if "CAM" in s.get("_extras", ""):
        score -= 700
    return score


def _fmt_size(n) -> str:
    try:
        n = float(n)
    except (TypeError, ValueError):
        return "?"
    if n <= 0:
        return "?"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} PB"


def _mk(source: str, release: str, info_hash: str, seeds, size_str: str,
        extra_label: str = "", file_idx=None) -> dict:
    q = _quality_tag(release)
    ex = _extras(release)
    s = {
        "_source": source, "_quality": q, "_seeds": int(seeds or 0), "_extras": ex,
        "_release": release, "_size": size_str,
        "infoHash": info_hash.lower(),
        "_label": extra_label,
    }
    if file_idx is not None:
        s["fileIdx"] = file_idx
    return s


# ── Trackers (peer discovery) ─────────────────────────────────────────────────

_TRACKERS: list[str] = []
_TRACKERS_TS = 0.0


def _qbt_trackers() -> list[str]:
    """Your own qBittorrent tracker list, deduplicated, original order kept."""
    ini = os.path.join(os.environ.get("APPDATA", ""), "qBittorrent", "qBittorrent.ini")
    try:
        txt = open(ini, encoding="utf-8", errors="replace").read()
    except OSError:
        return []
    m = re.search(r"^Session\\AdditionalTrackers=(.*)$", txt, re.M)
    if not m:
        return []
    seen, out = set(), []
    for t in m.group(1).strip('"').replace("\\n", "\n").splitlines():
        t = t.strip()
        if t and t not in seen and re.match(r"^(udp|https?|wss?)://", t):
            seen.add(t)
            out.append(t)
    return out


async def get_trackers() -> list[str]:
    global _TRACKERS, _TRACKERS_TS
    if _TRACKERS and time.time() - _TRACKERS_TS < 86400:
        return _TRACKERS
    limit = int(getattr(C, "MAX_STREAM_TRACKERS", 40))
    found: list[str] = []
    url = getattr(C, "TRACKERS_URL", "")
    if url:
        try:
            async with httpx.AsyncClient(timeout=6, headers=UA) as cl:
                r = await cl.get(url)
                r.raise_for_status()
                found = [l.strip() for l in r.text.splitlines() if l.strip()]
        except Exception:
            found = []
    for t in _qbt_trackers():
        if t not in found:
            found.append(t)
    if not found:
        found = ["udp://tracker.opentrackr.org:1337/announce",
                 "udp://open.demonii.com:1337/announce",
                 "udp://open.stealth.si:80/announce"]
    # UDP first: cheapest announces, most of the healthy public trackers
    found.sort(key=lambda t: 0 if t.startswith("udp") else 1)
    _TRACKERS, _TRACKERS_TS = found[:limit], time.time()
    return _TRACKERS


# ── YTS ───────────────────────────────────────────────────────────────────────

async def _search_yts(imdb_id: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT, headers=UA) as cl:
        r = await cl.get("https://yts.mx/api/v2/movie_details.json",
                         params={"imdb_id": imdb_id})
        r.raise_for_status()
        movie = (r.json().get("data") or {}).get("movie") or {}
    out = []
    for t in movie.get("torrents") or []:
        rel = f"{movie.get('title_long', '')} {t.get('quality','')} {t.get('type','')} {t.get('video_codec','')}"
        out.append(_mk("YTS", rel, t["hash"], t.get("seeds"), t.get("size", "?")))
    return out


# ── The Pirate Bay (apibay) ───────────────────────────────────────────────────

async def _search_tpb(query: str, cat: str = "200") -> list[dict]:
    async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT, headers=UA) as cl:
        r = await cl.get("https://apibay.org/q.php", params={"q": query, "cat": cat})
        r.raise_for_status()
        data = r.json()
    out = []
    for t in data if isinstance(data, list) else []:
        if t.get("id") == "0" or not t.get("info_hash"):
            continue
        out.append(_mk("TPB", t.get("name", ""), t["info_hash"], t.get("seeders"),
                       _fmt_size(t.get("size"))))
    return out


# ── Nyaa ──────────────────────────────────────────────────────────────────────

async def _search_nyaa(query: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT, headers=UA) as cl:
        r = await cl.get("https://nyaa.si/", params={"page": "rss", "q": query, "c": "1_0", "f": "0"})
        r.raise_for_status()
        xml = r.text
    out = []
    for item in re.findall(r"<item>(.*?)</item>", xml, re.S)[:40]:
        title = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", item, re.S)
        ih = re.search(r"<nyaa:infoHash>([a-fA-F0-9]{40})</nyaa:infoHash>", item)
        seeds = re.search(r"<nyaa:seeders>(\d+)</nyaa:seeders>", item)
        size = re.search(r"<nyaa:size>(.*?)</nyaa:size>", item)
        if title and ih:
            out.append(_mk("Nyaa", title.group(1), ih.group(1),
                           seeds.group(1) if seeds else 0, size.group(1) if size else "?"))
    return out


# ── Jackett / Prowlarr ────────────────────────────────────────────────────────

def jackett_settings() -> tuple[str, str]:
    url = getattr(C, "JACKETT_URL", "") or ""
    key = getattr(C, "JACKETT_API_KEY", "") or ""
    if not (url and key):
        # reuse what you already configured for qBittorrent's Jackett search plugin
        p = os.path.join(os.environ.get("LOCALAPPDATA", ""), "qBittorrent", "nova3", "engines", "jackett.json")
        try:
            j = json.load(open(p, encoding="utf-8"))
            url = url or j.get("url", "")
            key = key or j.get("api_key", "")
        except Exception:
            pass
    if key == "YOUR_API_KEY_HERE":
        key = ""
    return url.rstrip("/"), key


async def _search_jackett(query: str, cats: list[int]) -> list[dict]:
    url, key = jackett_settings()
    if not (url and key):
        return []
    params = [("apikey", key), ("Query", query)] + [("Category[]", str(c)) for c in cats]
    async with httpx.AsyncClient(timeout=max(SOURCE_TIMEOUT, 15), headers=UA) as cl:
        r = await cl.get(f"{url}/api/v2.0/indexers/all/results", params=params)
        r.raise_for_status()
        results = r.json().get("Results") or []
    out = []
    for t in results:
        ih = t.get("InfoHash") or ""
        if not ih and t.get("MagnetUri"):
            m = re.search(r"btih:([a-fA-F0-9]{40})", t["MagnetUri"])
            ih = m.group(1) if m else ""
        if not ih:
            continue  # .torrent-only result: skip rather than download it
        out.append(_mk("Jackett", t.get("Title", ""), ih, t.get("Seeders"),
                       _fmt_size(t.get("Size")), extra_label=t.get("Tracker", "")))
    return out


# ── Upstream Stremio add-ons (Torrentio etc.) ─────────────────────────────────

def _upstreams() -> list[str]:
    raw = getattr(C, "UPSTREAM_STREAM_ADDONS", "") or ""
    return [u.strip().rstrip("/").removesuffix("/manifest.json") for u in raw.split(",") if u.strip()]


async def _search_upstream(base: str, media_type: str, stremio_id: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=max(SOURCE_TIMEOUT, 12), headers=UA) as cl:
        r = await cl.get(f"{base}/stream/{media_type}/{quote(stremio_id, safe=':')}.json")
        r.raise_for_status()
        streams = r.json().get("streams") or []
    host = re.sub(r"^https?://", "", base).split("/")[0].split(".")[0].capitalize()
    out = []
    for s in streams:
        ih = s.get("infoHash")
        if not ih:
            continue
        text = f"{s.get('name','')} {s.get('title','') or s.get('description','')}"
        seeds = re.search(r"👤\s*(\d+)", text)
        size = re.search(r"💾\s*([\d.]+\s*[KMGT]B)", text)
        release = (s.get("title") or s.get("description") or "").split("\n")[0]
        item = _mk(host, release or text, ih, seeds.group(1) if seeds else 0,
                   size.group(1) if size else "?", file_idx=s.get("fileIdx"))
        prov = re.search(r"⚙️?\s*(\S+)", text)
        item["_label"] = prov.group(1) if prov else ""
        if s.get("behaviorHints", {}).get("filename"):
            item["_filename"] = s["behaviorHints"]["filename"]
        out.append(item)
    return out


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_id(stremio_id: str) -> tuple[str, int | None, int | None]:
    parts = stremio_id.split(":")
    if len(parts) == 3 and parts[1].isdigit() and parts[2].isdigit():
        return parts[0], int(parts[1]), int(parts[2])
    return parts[0], None, None


def _episode_match(release: str, season: int, episode: int) -> bool:
    r = release.lower()
    pats = [rf"s0*{season}[ ._-]*e0*{episode}(?!\d)", rf"\b0*{season}x0*{episode}(?!\d)"]
    return any(re.search(p, r) for p in pats)


async def _gather(named: dict) -> tuple[list[dict], dict]:
    names = list(named)
    res = await asyncio.gather(*(asyncio.wait_for(named[n], SOURCE_TIMEOUT + 8) for n in names),
                               return_exceptions=True)
    streams, report = [], {}
    for n, r in zip(names, res):
        if isinstance(r, list):
            streams.extend(r)
            report[n] = len(r)
        else:
            report[n] = f"error: {type(r).__name__}"
    return streams, report


def _dedupe_rank(items: list[dict], min_seeds: int = 0) -> list[dict]:
    best: dict[tuple, dict] = {}
    for s in items:
        k = (s["infoHash"], s.get("fileIdx"))
        if s["_seeds"] < min_seeds:
            continue
        cur = best.get(k)
        if cur is None or s["_seeds"] > cur["_seeds"]:
            if cur is not None:
                s["_also"] = sorted(set(cur.get("_also", [])) | {cur["_source"]})
            best[k] = s
        else:
            cur.setdefault("_also", [])
            if s["_source"] not in cur["_also"] and s["_source"] != cur["_source"]:
                cur["_also"].append(s["_source"])
    out = list(best.values())
    out.sort(key=_score, reverse=True)
    return out


def _to_stremio(s: dict, trackers: list[str]) -> dict:
    q = s["_quality"] if s["_quality"] != "unknown" else "SD?"
    src = s["_source"] + (f" · {s['_label']}" if s.get("_label") else "")
    lines = [s["_release"][:90]]
    lines.append(f"💾 {s['_size']}   👤 {s['_seeds']}   ⚙ {src}")
    if s.get("_extras"):
        lines.append(s["_extras"])
    out = {
        "name": f"🧲 {s['_source']}\n{q}",
        "title": "\n".join(lines),
        "infoHash": s["infoHash"],
        "sources": [f"tracker:{t}" for t in trackers] + [f"dht:{s['infoHash']}"],
        "behaviorHints": {"bingeGroup": f"suite-{s['_source']}-{q}"},
    }
    if s.get("fileIdx") is not None:
        out["fileIdx"] = s["fileIdx"]
    if s.get("_filename"):
        out["behaviorHints"]["filename"] = s["_filename"]
    return out


# ── Main entry points ─────────────────────────────────────────────────────────

async def get_streams(stremio_id: str, media_type: str = "movie", title: str = "",
                      year: str = "") -> list[dict]:
    imdb_id, season, episode = parse_id(stremio_id)
    named: dict = {}
    if media_type == "movie":
        named["yts"] = _search_yts(imdb_id)
        named["tpb"] = _search_tpb(imdb_id)
        if title:
            named["jackett"] = _search_jackett(f"{title} {year}".strip(), [2000])
    else:
        if title and season is not None:
            tag = f"S{season:02d}E{episode:02d}"
            named["tpb"] = _search_tpb(f"{title} {tag}", "205")
            named["jackett"] = _search_jackett(f"{title} {tag}", [5000])
            named["nyaa"] = _search_nyaa(f"{title} {episode:02d}")
    for base in _upstreams():
        named[f"upstream:{base}"] = _search_upstream(base, media_type, stremio_id)

    items, _report = await _gather(named)
    if season is not None:
        items = [s for s in items if s.get("fileIdx") is not None
                 or _episode_match(s["_release"], season, episode)]
    ranked = _dedupe_rank(items, int(getattr(C, "MIN_STREAM_SEEDS", 1)))
    trackers = await get_trackers()
    limit = int(getattr(C, "MAX_STREAMS", 40))
    return [_to_stremio(s, trackers) for s in ranked[:limit]]


async def search_query(query: str, kind: str = "movie") -> dict:
    """Free-text search across indexers, for the companion's Torrents tab."""
    cats = [2000] if kind == "movie" else [5000] if kind == "series" else [2000, 5000]
    named = {
        "tpb": _search_tpb(query, "200"),
        "jackett": _search_jackett(query, cats),
        "nyaa": _search_nyaa(query),
    }
    items, report = await _gather(named)
    ranked = _dedupe_rank(items)
    trackers = await get_trackers()
    tr = "".join(f"&tr={quote(t, safe='')}" for t in trackers[:20])
    rows = []
    for s in ranked[:150]:
        rows.append({
            "release": s["_release"], "source": s["_source"], "label": s.get("_label", ""),
            "also": s.get("_also", []), "quality": s["_quality"], "extras": s["_extras"],
            "seeds": s["_seeds"], "size": s["_size"], "infoHash": s["infoHash"],
            "magnet": f"magnet:?xt=urn:btih:{s['infoHash']}&dn={quote(s['_release'])}{tr}",
        })
    return {"results": rows, "sources": report}
