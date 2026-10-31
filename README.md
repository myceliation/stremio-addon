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


> **Optional: Mycelium, the hosted version**
> - [`worker/`](worker/): **Mycelium** and **Watch History**, two hosted Stremio add-ons (Cloudflare Workers + D1,
>   free tier, no sign-in) with everything this suite does except torrent streams: Library, Watched, shelves,
>   named lists, the list importer, ratings, combinable sort/filter dropdowns, streaming-service and discovery rows.
> - `mycelium.pyw` (also the 🍄 button in the launcher) walks through it in order: put online, make your copy,
>   add to Stremio, sync Stremio's history, check / stress-test, copy this suite's library across
>   (`migrate_to_mycelium.py`), publish. The self-hosted suite keeps working either way.
> - [`enhanced/`](enhanced/): plugin and themes for Stremio Enhanced, Stremio Community v5 and
>   web.stremio.com: shelf buttons, the genre mixer and local watch history inside Stremio's own screens.
> - [`upstream-fixes/`](upstream-fixes/): patches for bugs found in Stremio's own code.

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
- **Watch history** read straight from the Stremio desktop app's own local
  storage (no Trakt, no extra account): finished / in progress / opened,
  hours watched, rewatch counts, filters by genre, decade, language, shelf.
- **Shelves**: Loved, Waiting for release, Rewatch, Dropped, Ignore, Blacklist.
  Loved / Waiting / Rewatch also appear as catalogs inside Stremio.
- **Torrents tab**: search all indexers at once and send to qBittorrent, plus
  a live qBittorrent transfer list (needs qBittorrent's Web UI turned on).

### Stream sources

Coverage comes from *indexers*, not trackers. The add-on queries YTS, The
Pirate Bay, Nyaa, your local **Jackett** (or Prowlarr) if you run one, and can
merge in other Stremio stream add-ons such as Torrentio
(`UPSTREAM_STREAM_ADDONS`). Results are de-duplicated by info-hash and
re-ranked by quality and seed health. Every stream also carries a short list
of healthy public trackers (plus DHT) so Stremio finds peers faster.

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

[Viral Public License (VPL)](https://viralpubliclicense.org/) — copyleft, “all rights reversed.” See [`LICENSE`](LICENSE).
