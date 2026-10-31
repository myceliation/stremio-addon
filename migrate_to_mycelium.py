"""
Move everything from the offline Stremio suite into Mycelium, and merge in
the Stremio app's own watched list.

    python migrate_to_mycelium.py "<your Mycelium install or configure link>"
    python migrate_to_mycelium.py "<link>" --dry-run      # just show what would move

What goes where
  offline watchlist (Library page)        -> 📚 Library
  offline "Mark watched" / Blacklist page -> ✔ Watched   (use --blacklist-as blacklist to keep them as 🚫 Blacklist)
  offline watch history                   -> ✔ Watched (finished) / 📚 Library (unfinished)
  offline Not Interested                  -> 👎 Ignore
  offline ratings                         -> ★ ratings
  offline tags loved/waiting/rewatch/dropped -> those shelves; any other tag -> a named list
  offline named lists                     -> named lists
  Stremio app: everything you finished    -> ✔ Watched

Titles keep the metadata already cached offline (names, posters, genres), so
nothing has to be looked up again. Safe to re-run: anything already in
Mycelium is skipped, and a progress file lets it resume where it stopped
(for example if Cloudflare's free daily write allowance runs out mid-way).
"""
import argparse
import json
import os
import re
import sqlite3
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

CHUNK = 150
PROGRESS = os.environ.get("MYC_PROGRESS") or os.path.join(ROOT, "data", "mycelium_migration_progress.json")
SHELF_TAGS = {"loved", "waiting", "rewatch", "dropped"}


def parse_link(link):
    m = re.match(r"^(https?://[^/]+)/([A-Za-z0-9_-]{30,})(?:/|$)", link.strip())
    if not m:
        sys.exit("That doesn't look like a Mycelium install link. Copy it from the Mycelium settings page "
                 "(Install → Copy link). It looks like https://…workers.dev/<long code>/manifest.json")
    return m.group(1), m.group(2)


def post(base, token, path, body):
    req = urllib.request.Request(f"{base}/{token}/api/{path}", data=json.dumps(body).encode(),
                                 headers={"content-type": "application/json", "user-agent": "mycelium-migrate"},
                                 method="POST")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:300]
            if "limit" in msg.lower() or e.code == 429:
                sys.exit(f"\nCloudflare's free daily limit was reached ({msg}).\n"
                         "Run this script again tomorrow; it carries on where it stopped.")
            if attempt == 3:
                raise RuntimeError(f"{path}: HTTP {e.code} {msg}")
        except Exception as e:  # network blip
            if attempt == 3:
                raise
        time.sleep(2 * (attempt + 1))


def get(base, token, path):
    # a named user-agent: Cloudflare turns away Python's default one with 403 Forbidden
    req = urllib.request.Request(f"{base}/{token}/api/{path}", headers={"user-agent": "mycelium-migrate"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def ts(value):
    """SQLite timestamp text -> epoch ms."""
    if not value:
        return None
    try:
        return int(time.mktime(time.strptime(str(value)[:19], "%Y-%m-%d %H:%M:%S")) * 1000)
    except ValueError:
        return None


def build_plan(con, pid, blacklist_as="watched", include_stremio=True):
    """What should end up where in Mycelium. Shared with check_mycelium.py."""
    # ── metadata already cached offline ─────────────────────────────────────
    meta = {}
    for r in con.execute("SELECT imdb_id, tmdb_data FROM metadata_cache"):
        try:
            d = json.loads(r["tmdb_data"])
        except Exception:
            continue
        if d.get("_stub"):
            continue
        meta[r["imdb_id"]] = {
            "type": "series" if d.get("type") in ("series", "tv") else "movie",
            "name": d.get("title"), "year": str(d.get("year") or "")[:4] or None,
            "poster": d.get("poster") or None, "genres": d.get("genres") or [],
            "lang": d.get("language") or None, "vote": d.get("vote_average"),
            "countries": d.get("origin_country") or [],
        }
    # TMDB keywords per title (data/mycelium_keywords.jsonl), so Mycelium can sort them into microgenres
    kw_path = os.path.join(ROOT, "data", "mycelium_keywords.jsonl")
    if os.path.exists(kw_path):
        for line in open(kw_path, encoding="utf-8"):
            try:
                k = json.loads(line)
            except ValueError:
                continue
            if k.get("id") in meta:
                meta[k["id"]]["kw"] = [x[0] for x in k.get("k") or []]

    def item(iid, added=None, fallback=None):
        m = dict(meta.get(iid) or {})
        if fallback:
            for k, v in fallback.items():
                m.setdefault(k, v) if m.get(k) else m.__setitem__(k, v)
        m.setdefault("type", "movie")
        m.setdefault("name", iid)
        return {"id": iid, "added": added, **m}

    plan = {}   # list key -> {id: item}
    def put(list_key, it):
        if re.match(r"^tt\d+$", it["id"]):
            plan.setdefault(list_key, {}).setdefault(it["id"], it)

    skipped = 0
    for r in con.execute("SELECT imdb_id, added_at FROM watchlist WHERE profile_id=? ORDER BY added_at", (pid,)):
        if r["imdb_id"].startswith("tt"):
            put("library", item(r["imdb_id"], ts(r["added_at"])))
        else:
            skipped += 1
    for r in con.execute("SELECT imdb_id, blocked_at FROM blacklist WHERE profile_id=?", (pid,)):
        put(blacklist_as, item(r["imdb_id"], ts(r["blocked_at"])))
    for r in con.execute("SELECT imdb_id, watched_at, completed FROM watch_history WHERE profile_id=?", (pid,)):
        put("watched" if r["completed"] else "library", item(r["imdb_id"], ts(r["watched_at"])))
    for r in con.execute("SELECT imdb_id, skipped_at FROM skip_list WHERE profile_id=?", (pid,)):
        put("ignore", item(r["imdb_id"], ts(r["skipped_at"])))

    named = {}  # list name -> {id: item}
    for r in con.execute("SELECT imdb_id, tag, tagged_at FROM title_tags WHERE profile_id=?", (pid,)):
        if r["tag"] in SHELF_TAGS:
            put(r["tag"], item(r["imdb_id"], ts(r["tagged_at"])))
        else:
            named.setdefault(r["tag"].title(), {})[r["imdb_id"]] = item(r["imdb_id"], ts(r["tagged_at"]))
    for l in con.execute("SELECT id, name FROM lists WHERE profile_id=?", (pid,)):
        for r in con.execute("SELECT imdb_id, added_at FROM list_items WHERE list_id=?", (l["id"],)):
            named.setdefault(l["name"], {})[r["imdb_id"]] = item(r["imdb_id"], ts(r["added_at"]))

    ratings = [{"id": r["imdb_id"], "type": (meta.get(r["imdb_id"]) or {}).get("type", "movie"),
                "stars": r["stars"], "review": r["review"] or None, "rated": ts(r["rated_at"])}
               for r in con.execute("SELECT * FROM ratings WHERE profile_id=?", (pid,)) if r["imdb_id"].startswith("tt")]

    # ── the Stremio app's own watched list (read locally, nothing sent to Stremio) ──
    stremio_watched = 0
    if include_stremio:
        try:
            from companion import stremio_local
            for it in stremio_local.library_items():
                st = it.get("state") or {}
                if (st.get("flaggedWatched") or st.get("timesWatched")) and str(it.get("_id", "")).startswith("tt"):
                    when = st.get("lastWatched") or it.get("_mtime")
                    added = int(time.mktime(time.strptime(when[:19], "%Y-%m-%dT%H:%M:%S")) * 1000) if when else None
                    put("watched", item(it["_id"], added, {
                        "type": "series" if it.get("type") in ("series", "tv") else "movie",
                        "name": it.get("name"), "poster": it.get("poster")}))
                    stremio_watched += 1
        except Exception as e:
            print(f"  (couldn't read the Stremio app's library: {e})")

    return plan, named, ratings, meta, stremio_watched, skipped


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("link")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--blacklist-as", choices=["watched", "blacklist"], default="watched")
    ap.add_argument("--profile", help="offline profile name (default: the first one)")
    ap.add_argument("--no-stremio", action="store_true", help="don't merge the Stremio app's watched list")
    args = ap.parse_args()
    base, token = parse_link(args.link)

    from config import DB_PATH
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    profiles = con.execute("SELECT id, name FROM profiles").fetchall()
    prof = next((p for p in profiles if not args.profile or p["name"] == args.profile), None)
    if not prof:
        sys.exit("No matching offline profile.")
    pid = prof["id"]
    print(f"Offline profile: {prof['name']}")

    plan, named, ratings, meta, stremio_watched, skipped = build_plan(con, pid, args.blacklist_as, not args.no_stremio)

    # ── summary ──────────────────────────────────────────────────────────────
    print("\nWill move:")
    for k, v in plan.items():
        print(f"  {k:<10} {len(v):>7,} titles")
    for k, v in named.items():
        print(f"  list '{k}': {len(v):,} titles")
    print(f"  ratings    {len(ratings):>7,}")
    print(f"  (Stremio app watched merged: {stremio_watched:,}; skipped non-IMDb ids: {skipped:,})")
    total = sum(len(v) for v in plan.values()) + sum(len(v) for v in named.values())
    print(f"  ≈ {total * 2 + len(meta):,} database writes; Cloudflare's free tier allows 100,000 a day.")
    if args.dry_run:
        print("\nDry run only. Nothing was sent.")
        return

    # ── named lists: create (or reuse by name) ──────────────────────────────
    existing = {l["name"]: l["lid"] for l in get(base, token, "lists")}
    for name in named:
        if name not in existing:
            existing[name] = post(base, token, "lists", {"name": name})["lid"]
    for name, items in named.items():
        plan["l:" + existing[name]] = items

    done = {}
    if os.path.exists(PROGRESS):
        done = json.load(open(PROGRESS))
        if done.get("token") != token:
            done = {}
    done["token"] = token

    for list_key, items in plan.items():
        rows = sorted(items.values(), key=lambda x: x.get("added") or 0)
        start = done.get(list_key, 0)
        for i in range(start, len(rows), CHUNK):
            r = post(base, token, "bulk", {"list": list_key, "items": rows[i:i + CHUNK]})
            done[list_key] = i + CHUNK
            json.dump(done, open(PROGRESS, "w"))
            print(f"\r  {list_key:<12} {min(i + CHUNK, len(rows)):>7,} / {len(rows):,}", end="", flush=True)
        print()
    for i in range(done.get("_ratings", 0), len(ratings), CHUNK):
        post(base, token, "bulk", {"ratings": ratings[i:i + CHUNK]})
        done["_ratings"] = i + CHUNK
        json.dump(done, open(PROGRESS, "w"))
    print(f"  ratings      {len(ratings):,}")

    # microgenres for titles that had no keywords on file, then rank them for the lists' Microgenre dropdown
    print("  sorting titles into microgenres…", end="", flush=True)
    for _ in range(400):
        r = post(base, token, "mg-fill", {})
        if r.get("done"):
            break
        print(".", end="", flush=True)
    print()
    st = post(base, token, "mg-stats", {})
    print(f"  microgenres found in your library: {st.get('microgenres')}")

    counts = get(base, token, "settings").get("counts", {})
    print("\nMycelium now holds:")
    for k, v in counts.items():
        print(f"  {k:<14} {v.get('movie', 0) + v.get('series', 0):>7,}")
    print("\nDone. Reload add-ons in Stremio (or restart it) to see the rows.")


if __name__ == "__main__":
    main()
