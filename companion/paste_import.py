"""
Paste import — extract film titles from any free-form pasted text.

Handles all common formats encountered when doing Ctrl+A Ctrl+C on:
  IMDB list pages:
    - "Actor, Actor in Title (YEAR)" photo captions
    - "N. Title\\nYEAR\\n"           numbered entries
  Letterboxd list pages:
    - "Poster for Title (YEAR)"      poster alt-text
  Wikipedia category/list pages:
    - "Title (YEAR film)"            article title disambiguation
    - bare article titles            year-less, searched by title only
  Wikipedia table list pages (e.g. "List of cult films"):
    - "Title\tYEAR\tDirector\t[refs]"  tab-delimited table rows
  Any plain text list:
    - "Title (YEAR)"                 standard format
"""

import re
import asyncio
from typing import Optional

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import TMDB_API_KEY, TMDB_BASE_URL


_SKIP = re.compile(
    r'^(https?://|Category:|File:|Template:|User:|Talk:|Special:|'
    r'Retrieved |Jump to |Navigation|See also|References|External links|'
    r'Contents|From Wikipedia|This page|The following|All articles|'
    r'Subcategor|Pages in|Hidden category|This list|This category|'
    r'Director|Stars?[A-Z]|Metascore|Sort by|List Order|Visibility|'
    r'Sign in|Create account|Log in|About|Privacy|Terms|Contact|'
    r'Instagram|Threads|Facebook|TikTok|YouTube|Bluesky|'
    r'Tagged|Comments?|Feedback|Tell us|Recently viewed|More to explore|'
    r'Get the|For Android|For iOS|Follow IMDb|HelpSite|'
    r'Text is|Color Auto|Appearance|Width |Cookie|Mobile view|'
    r'Creative Commons|Wikimedia|MediaWiki|Wikipedia®)',
    re.IGNORECASE,
)

_JUNK = {
    'r','pg','pg-13','tv-ma','tv-14','tv-pg','nc-17','unrated','not rated',
    'video','short','grid','list','genre','decade','service','read','edit',
    'view','talk','help','history','more','search','films','lists','members',
    'journal','appearances','show','profile','horror','topstats','allstats',
    'likes','updated','text','statistics','automatic','standard','appearance',
    'narrow','wide','color','light','dark','small','large','normal',
    'a','b','c','d','e','f','g','h','i','j','k','l','m',
    'n','o','p','q','r','s','t','u','v','w','x','y','z',
}


def _extract_candidates(text: str) -> list[tuple[str, str]]:
    """
    Return (title, year) pairs from pasted film-list text.
    year is '' when no year could be determined.
    Deduplicates: if a year-bearing entry exists, the bare-title entry is dropped.
    """
    seen: set[tuple[str, str]] = set()
    seen_titles: set[str] = set()          # titles already found WITH a year
    results: list[tuple[str, str]] = []

    def add(raw_title: str, year: str = '') -> None:
        title = raw_title.strip().strip('–—-·"\'').strip()
        # Strip "Poster for " prefix  (Letterboxd)
        title = re.sub(r'(?i)^poster\s+for\s+', '', title).strip()
        # Strip leading numbering "1. ", "42) " etc.
        title = re.sub(r'^\d+[\.\)]\s*', '', title).strip()
        # Strip Wikipedia disambiguation "(film)" / "(2010 film)" / "(2010 American film)"
        if not year:
            title = re.sub(r'\s*\(\w*\s*film[^)]*\)\s*$', '', title, flags=re.I).strip()

        if len(title) < 2 or len(title) > 120:
            return
        if title.lower() in _JUNK:
            return
        if _SKIP.match(title):
            return
        if re.match(r'^(\d+h\s*\d*m|\d+\.\d+|\d+K?|\w{1,3}-\d+)$', title):
            return

        year = (year or '').strip()
        if year and not re.match(r'^\d{4}$', year):
            year = ''

        tl = title.lower()
        # Don't add a year-less duplicate when we already have a year-bearing version
        if not year and tl in seen_titles:
            return

        key = (tl, year)
        if key not in seen:
            seen.add(key)
            if year:
                seen_titles.add(tl)
            results.append((title, year))

    # ── Pass A: "X, Y in Title (YEAR)" — IMDB actor-credit photo captions ────
    # Captures only the title part after the last " in " before the year.
    for m in re.finditer(
        r'\bin\s+([A-ZÀ-ɏ\"\'][^\n(]{1,100}?)\s*\((\d{4})[^)]*\)',
        text,
    ):
        add(m.group(1), m.group(2))

    # ── Pass B: "Poster for Title (YEAR)" — Letterboxd poster alt-text ───────
    for m in re.finditer(
        r'(?i)poster\s+for\s+([A-ZÀ-ɏ\"\'][^\n(]{0,100}?)\s*\((\d{4})[^)]*\)',
        text,
    ):
        add(m.group(1), m.group(2))

    # ── Pass C: IMDB numbered list  "N. Title\nYEAR\n" ───────────────────────
    for m in re.finditer(
        r'^\s*\d+\.\s+([A-ZÀ-ɏ\"\'][^\n]{1,120})\n\s*(\d{4})\s*\n',
        text, re.MULTILINE,
    ):
        title = m.group(1).strip()
        if not re.search(r'(?i)\b(director|stars?)', title):
            add(title, m.group(2))

    # ── Pass D: generic "Title (YEAR[…])" — line-start ───────────────────────
    for m in re.finditer(
        r'(?:^|\n)\s*(?:\d+[\.\)]\s+)?([A-ZÀ-ɏ\"\'][^\n(]{1,100}?)'
        r'\s*\((\d{4})[^)]*\)',
        text, re.MULTILINE,
    ):
        title = m.group(1).strip()
        # Skip actor-credit lines — "Name, Name in Title"; Pass A already got them
        # Also skip "FirstName LastName in Title" single-name actor credits
        if ' in ' in title:
            before_in = title.rsplit(' in ', 1)[0].strip()
            # Multi-name: "Name, Name in ..."
            if re.search(r',\s*[A-Z]', before_in):
                continue
            # Single proper-noun name: "Sam Neill in ..." (2 capitalized words,
            # no articles, no digits, nothing that looks like a title fragment)
            words = before_in.split()
            if (2 <= len(words) <= 4
                    and all(re.match(r'[A-Z][a-z]', w) for w in words)
                    and words[0].lower() not in ('the','a','an','la','le','les',
                                                 'das','die','der','el','los','las')):
                continue
        if re.match(
            r'(?i)^(director|stars?|sort|list order|visibility|tagged|poster)',
            title,
        ):
            continue
        add(title, m.group(2))

    # ── Pass E: Wikipedia "(YEAR film)" / "(film)" titles ────────────────────
    for m in re.finditer(
        r'(?:^|\n)\s*([A-ZÀ-ɏ\"\'][^\n(]{1,80}?)'
        r'\s*\((\d*\s*\w*\s*film[^)]*)\)',
        text, re.MULTILINE | re.IGNORECASE,
    ):
        title = m.group(1).strip()
        year_m = re.search(r'\d{4}', m.group(2))
        add(title, year_m.group(0) if year_m else '')

    # ── Pass G: Wikipedia tab-separated table  "Title\tYEAR\tDirector\t…" ────
    # Handles "List of cult films" and similar Wikipedia list pages where each
    # row is tab-delimited: title in col[0], bare 4-digit year in col[1].
    for line in text.splitlines():
        if '\t' not in line:
            continue
        cols = [c.strip() for c in line.split('\t')]
        if len(cols) < 2:
            continue
        raw_title = cols[0]
        raw_year  = cols[1]
        # Second column must be a bare 4-digit year (skip header row "Year", etc.)
        if not re.match(r'^\d{4}$', raw_year):
            continue
        if not raw_title:
            continue
        # Skip obvious header/nav rows
        if raw_title.lower() in ('title', 'film', 'name', 'movie'):
            continue
        if _SKIP.match(raw_title):
            continue
        # Strip alternate-title parentheticals before the main title cleanup
        title = re.sub(r'\s*\(also known as[^)]*\)', '', raw_title, flags=re.I).strip()
        title = re.sub(r'\s*\(a\.k\.a\.[^)]*\)',    '', title,     flags=re.I).strip()
        title = re.sub(r'\s*\(aka[^)]*\)',           '', title,     flags=re.I).strip()
        # Strip trailing Wikipedia ref markers "[1]" that may bleed into the cell
        title = re.sub(r'(\s*\[\d+\])+\s*$', '', title).strip()
        # Strip Wikipedia "(film)" / "(2010 film)" disambiguation
        title = re.sub(r'\s*\(\w*\s*film[^)]*\)\s*$', '', title, flags=re.I).strip()
        title = title.strip('–—-·"\'').strip()
        if len(title) < 2 or len(title) > 120:
            continue
        if title.lower() in _JUNK:
            continue
        add(title, raw_year)

    # ── Pass F: bare short lines — Wikipedia article titles, no year ──────────
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        line = re.sub(r'^[\d\.\)\-\*•·]+\s*', '', line).strip()
        line = line.strip('–—-·"\'').strip()

        if len(line) < 2 or len(line) > 70:
            continue
        if not re.match(r'^[A-ZÀ-ɏ"\']', line):
            continue
        if _SKIP.match(line):
            continue
        if line.lower() in _JUNK:
            continue
        if re.search(r'http|@|\||\t|\d{4}', line):
            continue
        # Skip parentheticals other than "(film)" variants — handled above
        if re.search(r'\([^)]+\)', line) and not re.search(
            r'\(\w*\s*film[^)]*\)', line, re.IGNORECASE
        ):
            continue
        if re.match(r'^(\d+h|\d+\.\d+|[A-Z]{1,5}-\d+|Not Rated|TV-|PG|NC)', line):
            continue
        if line.isupper() and len(line) > 2:
            continue
        if len(line.split()) > 8:
            continue
        if re.match(
            r'(?i)^(poster|updated|visibility|sort|grid|list\b|genre|decade|'
            r'service|filter|followers|following|tagged|comments|likes|'
            r'please|sign|create|join|profile|recently|more to|tell us|'
            r'feedback|follow|get the|for android|list activity|list by|'
            r'lovecraftian|cosmic|suggestions available|list order)',
            line,
        ):
            continue

        tl = line.lower()
        # Drop if a year-bearing version was already found
        if tl in seen_titles:
            continue
        key = (tl, '')
        if key not in seen:
            seen.add(key)
            results.append((line, ''))

    return results


# ── TMDB search ───────────────────────────────────────────────────────────────

async def _tmdb_search(title: str, year: str) -> Optional[dict]:
    """
    Search TMDB for title+year (year may be '').
    Tries movies first, then TV series. Returns best hit or None.
    Result dict is tagged with 'media_type': 'movie' | 'tv'.
    """
    if not TMDB_API_KEY:
        return None
    import httpx
    base = {
        "api_key":       TMDB_API_KEY,
        "query":         title,
        "include_adult": "true",
        "language":      "en-US",
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            # ── Movie search ──────────────────────────────────────
            params = dict(base)
            if year:
                params["year"] = year
            resp = await client.get(f"{TMDB_BASE_URL}/search/movie", params=params)
            results = resp.json().get("results", [])
            if not results and year:
                params.pop("year")
                resp = await client.get(f"{TMDB_BASE_URL}/search/movie", params=params)
                results = resp.json().get("results", [])
            if results:
                return {**results[0], "media_type": "movie"}

            # ── TV search (fallback) ──────────────────────────────
            params = dict(base)
            if year:
                params["first_air_date_year"] = year
            resp = await client.get(f"{TMDB_BASE_URL}/search/tv", params=params)
            tv = resp.json().get("results", [])
            if not tv and year:
                params.pop("first_air_date_year")
                resp = await client.get(f"{TMDB_BASE_URL}/search/tv", params=params)
                tv = resp.json().get("results", [])
            if tv:
                return {**tv[0], "media_type": "tv"}
    except Exception:
        return None
    return None


# ── Confidence scoring ────────────────────────────────────────────────────────

def _confidence(input_title: str, input_year: str, result: dict) -> int:
    """Score 0–100 for how well a TMDB result matches the input."""
    if not result:
        return 0
    matched_title = (result.get("title") or result.get("name") or "").lower()
    # TV uses first_air_date; movies use release_date
    release      = result.get("release_date") or result.get("first_air_date") or ""
    matched_year = release[:4] if release else ""

    if not input_year:
        year_score = 0
    elif matched_year == input_year:
        year_score = 40
    else:
        try:
            year_score = 15 if abs(int(matched_year or 0) - int(input_year)) <= 1 else 0
        except ValueError:
            year_score = 0

    inp_tokens = set(re.findall(r'\w+', input_title.lower()))
    mat_tokens = set(re.findall(r'\w+', matched_title))
    title_score = (
        int(60 * len(inp_tokens & mat_tokens) / max(len(inp_tokens), len(mat_tokens)))
        if inp_tokens else 0
    )
    return min(100, year_score + title_score)


# ── Main entry point ──────────────────────────────────────────────────────────


async def parse_paste_text(text: str) -> list[dict]:
    """Parse pasted text, TMDB-search each title, return candidates."""
    candidates = _extract_candidates(text)
    if not candidates:
        return []
    sem = asyncio.Semaphore(5)

    async def search_one(title, year):
        async with sem:
            return await _tmdb_search(title, year)

    tmdb_results = await asyncio.gather(*[search_one(t, y) for t, y in candidates])
    output = []
    for (title, year), result in zip(candidates, tmdb_results):
        conf = _confidence(title, year, result)
        if result:
            release      = result.get("release_date") or result.get("first_air_date") or ""
            matched_year = release[:4] if release else year
            poster       = result.get("poster_path", "")
            media_type   = result.get("media_type", "movie")
            output.append({
                "input":      f"{title} ({year})" if year else title,
                "title":      result.get("title") or result.get("name") or title,
                "year":       matched_year,
                "imdb_id":    f"tmdb:{result['id']}",
                "tmdb_id":    result["id"],
                "media_type": media_type,
                "poster":     f"https://image.tmdb.org/t/p/w185{poster}" if poster else "",
                "confidence": conf,
            })
        else:
            output.append({
                "input":      f"{title} ({year})" if year else title,
                "title":      title,
                "year":       year,
                "imdb_id":    None,
                "tmdb_id":    None,
                "media_type": "movie",
                "poster":     "",
                "confidence": 0,
            })
    output.sort(key=lambda x: x["confidence"], reverse=True)
    return output
