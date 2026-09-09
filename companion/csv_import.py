"""
CSV import parsers for IMDB and Letterboxd export formats.

IMDB export columns (sample):
  Position,Const,Created,Modified,Description,Title,URL,Title Type,
  IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors

Letterboxd ratings.csv columns (sample):
  Date,Name,Year,Letterboxd URI,Rating

Letterboxd watchlist.csv columns (sample):
  Date,Name,Year,Letterboxd URI

Letterboxd diary.csv columns (sample):
  Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
"""

import csv
import io
import re
from typing import Optional


def _parse_csv_str(content: str) -> list[dict]:
    """Parse CSV string into list of row dicts."""
    reader = csv.DictReader(io.StringIO(content))
    return [row for row in reader]


def _extract_imdb_id_from_url(url: str) -> Optional[str]:
    """Extract ttXXXXXXX from an IMDB URL or direct ID string."""
    if not url:
        return None
    m = re.search(r"(tt\d{7,})", url)
    return m.group(1) if m else None


# ── IMDB CSV ──────────────────────────────────────────────────────────────────

def parse_imdb_csv(content: str) -> list[str]:
    """
    Parse an IMDB export CSV.
    Returns list of IMDB IDs (e.g. ["tt1234567", ...]).
    """
    try:
        rows = _parse_csv_str(content)
    except Exception:
        return []

    ids = []
    for row in rows:
        # "Const" column holds the IMDB ID directly
        imdb_id = row.get("Const", "").strip()
        if not imdb_id:
            # Some exports put it in a URL column
            imdb_id = _extract_imdb_id_from_url(row.get("URL", ""))
        if imdb_id and imdb_id.startswith("tt"):
            ids.append(imdb_id)
    return ids


# ── Letterboxd CSV ────────────────────────────────────────────────────────────

def parse_letterboxd_csv(content: str) -> list[dict]:
    """
    Parse a Letterboxd export CSV (watchlist, ratings, or diary).
    Returns list of dicts with keys: imdb_id, stars (optional), title, year.

    Note: Letterboxd CSVs don't include IMDB IDs directly.  The "Letterboxd URI"
    column points to a Letterboxd film page, not IMDB.  We extract what we can
    and let the caller do the TMDB/IMDB resolution if needed.

    For watchlist/diary imports we return the Letterboxd slug so the URL importer
    can optionally resolve it.  For ratings we map Letterboxd's 0.5–5.0 half-star
    scale to our 1–5 integer scale.
    """
    try:
        rows = _parse_csv_str(content)
    except Exception:
        return []

    results = []
    for row in rows:
        title = row.get("Name", "").strip()
        year_str = row.get("Year", "").strip()
        lb_uri = row.get("Letterboxd URI", "").strip()
        rating_str = row.get("Rating", "").strip()

        # Try to extract an IMDB ID if it's hiding in a URL field
        imdb_id = _extract_imdb_id_from_url(lb_uri)

        # Convert Letterboxd rating (0.5 – 5.0 in 0.5 steps) → 1–5 integer
        stars = None
        if rating_str:
            try:
                lb_rating = float(rating_str)
                stars = max(1, min(5, round(lb_rating)))
            except ValueError:
                pass

        # Extract slug from Letterboxd URI for potential later resolution
        slug_m = re.search(r"letterboxd\.com/film/([^/]+)", lb_uri)
        lb_slug = slug_m.group(1) if slug_m else None

        results.append(
            {
                "imdb_id": imdb_id,     # may be None; caller handles
                "lb_slug": lb_slug,
                "title": title,
                "year": year_str,
                "stars": stars,
            }
        )

    return results


def parse_letterboxd_watchlist_csv(content: str) -> list[str]:
    """
    Convenience wrapper: parse Letterboxd watchlist.csv and return IMDB IDs.
    Rows without a resolvable IMDB ID are silently dropped.
    """
    rows = parse_letterboxd_csv(content)
    return [r["imdb_id"] for r in rows if r.get("imdb_id")]
