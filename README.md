# Stremio Add-on Suite

A self-hosted [Stremio](https://www.stremio.com/) add-on + companion web app for
running your **own** film/series library as native Stremio catalogs — with
per-profile catalogs, TMDB metadata, Letterboxd/IMDb import, ratings, torrent
stream resolution, and optional qBittorrent hand-off.

Everything runs locally on your machine. There is **no hosted instance** — you
run your own (that's the point).

> **Legal note.** The stream resolver queries public torrent indexers. What you
> download and stream is your responsibility and subject to the law where you
> live. This project ships the *code*; it hosts nothing and indexes nothing.
> Run it as a personal, self-hosted tool.

---

## What's in the box

- **Add-on server** (FastAPI, port `7000`) — serves per-profile Stremio
  manifests, catalogs, metadata, and streams.
- **Companion web app** (Flask, port `7001`) — manage your library, import
  lists, set ratings, configure profiles, sync to Stremio.
- **Browser extension** — send a film to your library from any web page.
- **SQLite** storage — no external database to set up.

### Features

- **Multi-profile** via unique add-on URLs (`/<uuid>/manifest.json`).
- **Custom catalogs**: Watchlist, Watch History, My Ratings, plus
  Search-by-Director and Search-by-Actor.
- **TMDB** posters/metadata (optional — works in stub mode without a key).
- **Imports**: Letterboxd CSV, IMDb CSV, paste-a-list, and URL scraping.
- **Torrent stream resolution** from public indexers, with optional
  **qBittorrent** Web-UI hand-off.
- **Library sync** into Stremio's native Library tab.

---

## Requirements

- Python 3.10+
- [Stremio](https://www.stremio.com/) (desktop, for local streaming + Library sync)
- *(optional)* qBittorrent with the Web UI enabled
- *(optional)* a free [TMDB API key](https://developer.themoviedb.org/) for metadata

## Setup

```bash
git clone https://github.com/myceliation/stremio-addon.git
cd stremio-addon
pip install -r requirements.txt

# configure
cp .env.example .env      # then edit .env and add your TMDB key (optional)
```

## Running

**Windows (easiest):** double-click `start_servers.vbs` (silent) or
`start_servers.bat` (with a console). `stop_servers.bat` stops both.

**Any platform (manual):**
```bash
python run_addon.py       # add-on      -> http://localhost:7000
python run_companion.py   # companion   -> http://localhost:7001
```

Then open the companion at **http://localhost:7001** to build your library.

## Installing the add-on into Stremio

1. First run auto-generates your profile UUID. Find your manifest URL in the
   companion under **Settings**, or open `http://localhost:7000/manifest.json`.
2. In Stremio: **Add-ons → Add add-on from URL** and paste:
   ```
   http://localhost:7000/<your-uuid>/manifest.json
   ```
3. Your catalogs appear on the Stremio home screen.

To reach it from other devices on your LAN, set `ADDON_PUBLIC_URL` in `.env`
to your machine's IP (e.g. `http://192.168.1.50:7000`).

## Configuration

All settings live in `config.py` and can be overridden by environment variables
(or `.env`). See `.env.example` for the full list. Nothing sensitive is
committed — `.env`, your library data, and the runtime database are gitignored.

## Screenshots

_Coming soon._ (See `docs/screenshots/`.)

## Troubleshooting

See [`commands.txt`](commands.txt) for a full command/diagnostics reference
(ports, sync, database queries, common fixes).

## License

See [`LICENSE`](LICENSE).
