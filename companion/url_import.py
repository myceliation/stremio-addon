"""
URL import -- scrape IMDB, Letterboxd, and Wikipedia list pages.

IMDB:       Their WAF blocks HTML scraping. Use /export CSV endpoint.
            Falls back to a clear error asking for CSV upload.
Letterboxd: Use /rss/ feed (bypasses JS-rendering issue).
            Falls back to regex on raw HTML.
Wikipedia:  Use MediaWiki API entirely (no HTML scraping -- avoids 403).
            Handles both regular list pages and Category: pages.
            Falls back to TMDB title-search when articles lack IMDB ext-links.
"""

import re
import json
import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import Optional
from urllib.parse import unquote

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import TMDB_API_KEY, TMDB_BASE_URL

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
_BROWSER_HEADERS = {
    "User-Agent": _BROWSER_UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
_WIKI_API = "https://en.wikipedia.org/w/api.php"
_WIKI_API_HEADERS = {
    "User-Agent": "StremioLibraryImporter/1.0 (personal use; github.com/user/stremio-addon)",
}


# ── IMDB list scraper ─────────────────────────────────────────────────────────

async def _scrape_imdb_list(url: str) -> list:
    """
    Attempt to get IMDB IDs via the /export CSV endpoint.
    IMDB's main list pages are behind AWS WAF and require JS.
    """
    m = re.search(r'(ls\d+)', url)
    if not m:
        raise RuntimeError("Could not parse IMDB list ID from URL.")

    export_url = "https://www.imdb.com/list/{}/export".format(m.group(1))

    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True,
                                     headers=_BROWSER_HEADERS) as client:
            resp = await client.get(export_url)
            ct = resp.headers.get("content-type", "")
            if resp.status_code == 200 and ("csv" in ct or "text/plain" in ct or "," in resp.text[:100]):
                from companion.csv_import import parse_imdb_csv
                ids = parse_imdb_csv(resp.text)
                if ids:
                    return ids
            if resp.status_code in (401, 403, 302) or (
                    resp.status_code == 200 and "sign in" in resp.text.lower()[:2000]):
                raise RuntimeError(
                    "IMDB requires login to export this list. "
                    "Instead: go to your IMDB list -> three-dot menu -> Export -> "
                    "upload the downloaded CSV using the CSV tab."
                )
    except RuntimeError:
        raise
    except Exception:
        pass

    # Fallback: try scraping HTML
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True,
                                     headers=_BROWSER_HEADERS) as client:
            resp = await client.get(url)
            if resp.status_code == 202 or "awswaf" in resp.text.lower():
                raise RuntimeError(
                    "IMDB is showing a bot-protection challenge. "
                    "Please export your list manually: IMDB list -> three-dot menu -> Export, "
                    "then upload the CSV using the CSV tab."
                )
            html = resp.text
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError("Failed to fetch IMDB list: {}".format(e))

    ids = [el["data-tconst"] for el in BeautifulSoup(html, "lxml").select("[data-tconst]")]
    if ids:
        return list(dict.fromkeys(ids))

    m2 = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if m2:
        try:
            ids = list(dict.fromkeys(
                re.findall(r'"(?:imdbId|tconst)"\s*:\s*"(tt\d{7,})"', m2.group(1))
            ))
            if ids:
                return ids
        except Exception:
            pass

    ids = list(dict.fromkeys(re.findall(r'/title/(tt\d{7,})/', html)))
    return ids


# ── Letterboxd list scraper ───────────────────────────────────────────────────

async def _lb_slug_to_imdb(slug: str, client: httpx.AsyncClient) -> Optional[str]:
    """Resolve a Letterboxd film slug to an IMDB ID."""
    try:
        resp = await client.get("https://letterboxd.com/film/{}/".format(slug))
        resp.raise_for_status()
        html = resp.text
    except Exception:
        return None
    m = re.search(r'imdb\.com/title/(tt\d{7,})', html)
    if m:
        return m.group(1)
    m = re.search(r'"sameAs":\s*"https://www\.imdb\.com/title/(tt\d+)"', html)
    return m.group(1) if m else None


async def _scrape_letterboxd_list(url: str) -> list:
    """
    Scrape a Letterboxd list.
    Uses the /rss/ feed to get film slugs (bypasses JS-rendering).
    Falls back to regex on raw HTML.
    """
    slugs = []

    # Method 1: RSS feed
    rss_url = url.rstrip("/") + "/rss/"
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True,
                                     headers=_BROWSER_HEADERS) as client:
            resp = await client.get(rss_url)
            if resp.status_code == 200 and ("<rss" in resp.text or "<?xml" in resp.text):
                # Match /film/slug/ anywhere in a letterboxd.com URL,
                # regardless of how many path segments precede it.
                # e.g. /user/list/list-name/film/the-thing/
                found = re.findall(
                    r'letterboxd\.com/[^"<\s]*?/film/([a-z0-9][a-z0-9-]+)/',
                    resp.text
                )
                slugs = list(dict.fromkeys(found))
    except Exception:
        pass

    # Method 2: HTML + regex fallback
    if not slugs:
        try:
            async with httpx.AsyncClient(timeout=20, follow_redirects=True,
                                         headers=_BROWSER_HEADERS) as client:
                page_url = url.rstrip("/") + "/"
                while True:
                    resp = await client.get(page_url)
                    resp.raise_for_status()
                    html = resp.text
                    soup = BeautifulSoup(html, "lxml")

                    page_slugs = [el["data-film-slug"]
                                  for el in soup.select("[data-film-slug]")
                                  if el.get("data-film-slug")]
                    if not page_slugs:
                        page_slugs = list(dict.fromkeys(
                            re.findall(r'data-film-slug="([a-z0-9][a-z0-9-]+)"', html)
                        ))
                    if not page_slugs:
                        page_slugs = list(dict.fromkeys(
                            re.findall(r'href="/film/([a-z0-9][a-z0-9-]+)/"', html)
                        ))
                    if not page_slugs:
                        break
                    slugs.extend(page_slugs)
                    next_link = soup.select_one("a.next")
                    if not next_link:
                        break
                    href = next_link.get("href", "")
                    page_url = "https://letterboxd.com{}".format(href)
        except Exception as e:
            if not slugs:
                raise RuntimeError("Failed to fetch Letterboxd list: {}".format(e))

    if not slugs:
        return []

    seen = set()
    unique_slugs = []
    for s in slugs:
        if s not in seen:
            seen.add(s)
            unique_slugs.append(s)

    semaphore = asyncio.Semaphore(6)

    async def resolve(slug):
        async with semaphore:
            async with httpx.AsyncClient(timeout=12, follow_redirects=True,
                                          headers=_BROWSER_HEADERS) as c:
                return await _lb_slug_to_imdb(slug, c)

    results = await asyncio.gather(*[resolve(s) for s in unique_slugs])
    return [r for r in results if r]


# ── Wikipedia scraper (API-only) ──────────────────────────────────────────────

async def _wiki_get_article_imdb_ids(article_title: str, client: httpx.AsyncClient) -> list:
    """Return IMDB IDs found in the external links of a Wikipedia article."""
    try:
        resp = await client.get(_WIKI_API, params={
            "action": "parse",
            "page": article_title,
            "prop": "externallinks",
            "format": "json",
            "redirects": "1",
        })
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            return []
        ext_links = data.get("parse", {}).get("externallinks", [])
        ids = []
        for link in ext_links:
            m = re.search(r'imdb\.com/title/(tt\d{7,})', link)
            if m:
                ids.append(m.group(1))
        return list(dict.fromkeys(ids))
    except Exception:
        return []


async def _wiki_get_article_links(article_title: str, client: httpx.AsyncClient) -> list:
    """Return internal Wikipedia article links (namespace 0 only)."""
    try:
        resp = await client.get(_WIKI_API, params={
            "action": "parse",
            "page": article_title,
            "prop": "links",
            "format": "json",
            "redirects": "1",
        })
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            return []
        links = data.get("parse", {}).get("links", [])
        return [lnk["*"] for lnk in links if lnk.get("ns") == 0]
    except Exception:
        return []


async def _wiki_get_category_members(category_title: str, client: httpx.AsyncClient) -> list:
    """
    Return article titles that are members of a Wikipedia category.
    category_title should include the 'Category:' prefix.
    Paginates automatically (up to 500 members per request).
    """
    members = []
    cmcontinue = None
    for _ in range(10):
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category_title,
            "cmtype": "page",
            "cmlimit": "500",
            "cmnamespace": "0",
            "format": "json",
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue
        try:
            resp = await client.get(_WIKI_API, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            break
        for m in data.get("query", {}).get("categorymembers", []):
            members.append(m["title"])
        cont = data.get("continue", {})
        cmcontinue = cont.get("cmcontinue")
        if not cmcontinue:
            break
    return members


# ── TMDB title-search fallback ────────────────────────────────────────────────

async def _tmdb_search_imdb_id(title: str, client: httpx.AsyncClient) -> Optional[str]:
    """
    Search TMDB for a movie title and return the IMDB ID of the best match.

    Strips Wikipedia disambiguation suffixes like '(film)', '(1982 film)',
    '(2003 American film)', etc., and uses the year as a search hint when
    present.  Falls back to a year-free search if the narrow query yields
    nothing.
    """
    if not TMDB_API_KEY:
        return None

    # Extract year from parenthetical: "(1982)" or "(1982 film)" etc.
    year = None
    ym = re.search(r'\((\d{4})(?:\s+[^)]+)?\)', title)
    if ym:
        year = ym.group(1)

    # Strip all trailing parenthetical disambiguation
    clean = re.sub(r'\s*\([^)]+\)$', '', title).strip()
    # Also strip " film" suffix if left bare
    clean = re.sub(r'\s+film$', '', clean, flags=re.IGNORECASE).strip()
    if not clean:
        return None

    try:
        params = {
            "query": clean,
            "api_key": TMDB_API_KEY,
            "include_adult": "true",
            "language": "en-US",
        }
        if year:
            params["year"] = year

        resp = await client.get(
            "{}/search/movie".format(TMDB_BASE_URL),
            params=params,
            timeout=8,
        )
        results = resp.json().get("results", [])

        # Retry without year if narrow search produced nothing
        if not results and year:
            params.pop("year")
            resp = await client.get(
                "{}/search/movie".format(TMDB_BASE_URL),
                params=params,
                timeout=8,
            )
            results = resp.json().get("results", [])

        if not results:
            return None

        tmdb_id = results[0]["id"]

        # /movie/{id}/external_ids returns imdb_id
        ext_resp = await client.get(
            "{}/movie/{}/external_ids".format(TMDB_BASE_URL, tmdb_id),
            params={"api_key": TMDB_API_KEY},
            timeout=8,
        )
        imdb_id = ext_resp.json().get("imdb_id") or None
        # Validate format
        if imdb_id and re.match(r'^tt\d{7,}$', imdb_id):
            return imdb_id
        return None

    except Exception:
        return None


# ── Wikipedia main scraper ────────────────────────────────────────────────────

async def _scrape_wikipedia_list(url: str) -> dict:
    """
    Scrape a Wikipedia list or category page using the MediaWiki API.

    Handles two URL patterns:
      /wiki/Category:Films_based_on_works_by_H._P._Lovecraft
        -> uses list=categorymembers to enumerate all member articles
      /wiki/List_of_science_fiction_films_of_the_1980s
        -> uses action=parse&prop=links to get internally-linked articles

    Strategy:
      1. Collect article titles (category members OR linked articles).
      2. For each article, fetch IMDB ID from its Wikipedia external links.
      3. TMDB fallback: for any article that yielded no IMDB ID via Wikipedia,
         search TMDB by title -- this covers the common case where Wikipedia
         articles don't include an IMDB external-link template.
      4. If still nothing (non-category pages only), extract (Title, Year)
         candidates from the article text.
    """
    m = re.search(r'/wiki/([^?#]+)', url)
    if not m:
        raise RuntimeError("Could not parse Wikipedia article title from URL.")
    article_title = unquote(m.group(1)).replace("_", " ")

    is_category = article_title.startswith("Category:")

    async with httpx.AsyncClient(timeout=20, follow_redirects=True,
                                 headers=_WIKI_API_HEADERS) as wiki_client:

        if is_category:
            linked_articles = await _wiki_get_category_members(article_title, wiki_client)
            direct_ids = []
        else:
            direct_ids = await _wiki_get_article_imdb_ids(article_title, wiki_client)
            linked_articles = await _wiki_get_article_links(article_title, wiki_client)

        # ── Step 1: Wikipedia external-links pass ─────────────────────────────
        sem = asyncio.Semaphore(8)

        async def wiki_resolve(title):
            async with sem:
                return await _wiki_get_article_imdb_ids(title, wiki_client)

        articles_to_check = linked_articles[:300]
        nested_results = await asyncio.gather(
            *[wiki_resolve(t) for t in articles_to_check],
            return_exceptions=True
        )

        # Track per-article results so we know which ones came up empty
        wiki_ids_map = {}  # article_title -> list[str]
        for i, t in enumerate(articles_to_check):
            r = nested_results[i]
            wiki_ids_map[t] = r if isinstance(r, list) else []

        extra_ids = []
        for ids_list in wiki_ids_map.values():
            extra_ids.extend(ids_list)

        all_ids = list(dict.fromkeys(direct_ids + extra_ids))

        # ── Step 2: TMDB title-search for articles with no Wikipedia IMDB link ─
        if TMDB_API_KEY and linked_articles:
            missing_articles = [t for t in articles_to_check if not wiki_ids_map.get(t)]
            # For non-category pages there may also be article links that are NOT films
            # (actors, directors, etc.) -- TMDB search will return nothing for those,
            # which is fine (we just get None back).
            if missing_articles:
                # Cap to keep total time reasonable (~5 concurrent * 8s timeout)
                tmdb_cap = 200
                to_search = missing_articles[:tmdb_cap]

                tmdb_sem = asyncio.Semaphore(5)
                already_found = set(all_ids)

                async with httpx.AsyncClient(
                    timeout=15, follow_redirects=True,
                    headers={"User-Agent": _BROWSER_UA}
                ) as tmdb_client:

                    async def tmdb_resolve(title):
                        async with tmdb_sem:
                            return await _tmdb_search_imdb_id(title, tmdb_client)

                    tmdb_results = await asyncio.gather(
                        *[tmdb_resolve(t) for t in to_search],
                        return_exceptions=True
                    )

                for r in tmdb_results:
                    if isinstance(r, str) and r and r not in already_found:
                        all_ids.append(r)
                        already_found.add(r)

        # ── Step 3: text-extraction fallback (list pages only, no TMDB key) ───
        candidates = []
        if not all_ids and not is_category:
            try:
                resp = await wiki_client.get(_WIKI_API, params={
                    "action": "query",
                    "titles": article_title,
                    "prop": "extracts",
                    "explaintext": "1",
                    "format": "json",
                    "redirects": "1",
                })
                data = resp.json()
                pages = data.get("query", {}).get("pages", {})
                for page in pages.values():
                    text = page.get("extract", "")
                    if text:
                        from companion.paste_import import _extract_candidates
                        candidates = _extract_candidates(text)
                        break
            except Exception:
                pass

        return {"imdb_ids": all_ids, "candidates": candidates}


# ── Router ────────────────────────────────────────────────────────────────────

async def scrape_list_url(url: str) -> dict:
    """
    Auto-detect URL type and scrape.
    Returns {"imdb_ids": [...], "candidates": [...], "source": "..."}
    """
    url = url.strip()
    if "imdb.com" in url:
        ids = await _scrape_imdb_list(url)
        return {"imdb_ids": ids, "candidates": [], "source": "imdb"}
    elif "letterboxd.com" in url:
        ids = await _scrape_letterboxd_list(url)
        return {"imdb_ids": ids, "candidates": [], "source": "letterboxd"}
    elif "wikipedia.org" in url:
        result = await _scrape_wikipedia_list(url)
        result["source"] = "wikipedia"
        return result
    else:
        raise RuntimeError(
            "Unsupported URL. Paste an IMDB list, Letterboxd list, or Wikipedia list article URL."
        )


# ── Public helper: TMDB title-search for a list of titles ────────────────────

async def resolve_titles_via_tmdb(titles: list) -> list:
    """
    Given a list of film/article titles (e.g. from a Wikipedia page DOM),
    search each one on TMDB and return the matching IMDB IDs.

    Skips duplicates and None results. Caps at 300 titles.
    Uses concurrency of 5 to stay within TMDB rate limits.
    """
    if not TMDB_API_KEY or not titles:
        return []

    seen_titles = list(dict.fromkeys(t.strip() for t in titles if t.strip()))
    cap = seen_titles[:300]

    sem = asyncio.Semaphore(5)
    found_ids = set()
    ordered   = []

    async with httpx.AsyncClient(
        timeout=15, follow_redirects=True,
        headers={"User-Agent": _BROWSER_UA},
    ) as client:
        async def search_one(title):
            async with sem:
                return await _tmdb_search_imdb_id(title, client)

        results = await asyncio.gather(
            *[search_one(t) for t in cap],
            return_exceptions=True,
        )

    for r in results:
        if isinstance(r, str) and r and r not in found_ids:
            found_ids.add(r)
            ordered.append(r)

    return ordered
