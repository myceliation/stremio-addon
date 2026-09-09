"""
Global configuration for the Stremio Add-on Suite.
Edit this file before running either server.
"""

import os

# Load a local .env (gitignored) so secrets stay out of the repo.
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except Exception:
    pass

# ── TMDB ─────────────────────────────────────────────────────────────────────
# Get a free key at https://developer.themoviedb.org/
# Leave empty to run in stub mode (no posters / metadata, but everything else works)
TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL: str = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE: str = "https://image.tmdb.org/t/p/w500"
TMDB_CACHE_TTL_DAYS: int = 7

# ── Servers ───────────────────────────────────────────────────────────────────
ADDON_HOST: str = os.getenv("ADDON_HOST", "0.0.0.0")
ADDON_PORT: int = int(os.getenv("ADDON_PORT", "7000"))

COMPANION_HOST: str = os.getenv("COMPANION_HOST", "0.0.0.0")
COMPANION_PORT: int = int(os.getenv("COMPANION_PORT", "7001"))

# Public-facing base URL used to build install links shown in the companion app.
# Auto-detects your local network IP so mobile devices on the same Wi-Fi can reach the addon.
def _local_ip() -> str:
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

ADDON_PUBLIC_URL: str = os.getenv("ADDON_PUBLIC_URL", f"http://{_local_ip()}:{ADDON_PORT}")

# ── Database ──────────────────────────────────────────────────────────────────
import pathlib
_ROOT = pathlib.Path(__file__).parent
DB_PATH: str = str(_ROOT / "data" / "stremio.db")

# ── Stremio local server ─────────────────────────────────────────────────────
# Stremio runs a local HTTP server (streaming only — port 11470).
STREMIO_SERVER_URL: str = os.getenv("STREMIO_SERVER_URL", "http://127.0.0.1:11470")

# ── Stremio auth key (for Library sync) ───────────────────────────────────────
# Needed to push items into Stremio's native Library tab via api.strem.io.
# Leave blank — the companion will try to auto-detect it from Stremio's data files.
# If auto-detect fails: open Stremio → F12 → Application → Local Storage →
#   http://app.strem.io → copy the value of "authKey" → paste below.
STREMIO_AUTH_KEY: str = os.getenv("STREMIO_AUTH_KEY", "")

# ── qBittorrent ───────────────────────────────────────────────────────────────
QBT_URL: str = os.getenv("QBT_URL", "http://localhost:8080")
QBT_USERNAME: str = os.getenv("QBT_USERNAME", "admin")
QBT_PASSWORD: str = os.getenv("QBT_PASSWORD", "adminadmin")

# ── Catalog pagination ────────────────────────────────────────────────────────
CATALOG_PAGE_SIZE: int = 100        # Stremio addon catalog pages (keep at 100)
LIBRARY_PAGE_SIZE: int = 2000       # Companion library page — items per page

# ── Flask secret key ──────────────────────────────────────────────────────────
FLASK_SECRET: str = os.getenv("FLASK_SECRET", "change-me-in-production")
