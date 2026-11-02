"""
Checks that Mycelium, its Discover add-ons, Watch History, the in-app interface and the importer
all work, and (after migrate_to_mycelium.py) that everything from the offline tool arrived:
every title, its genres and language.

    python check_mycelium.py "<your Mycelium install link>"
    python check_mycelium.py "<link>" --quick          # skip the importer and migration checks
    (or step 4 in the Mycelium window)

Nothing it does stays in your account: test imports go into a temporary list that is
deleted at the end, and a title marked watched for the test is unmarked again.
A report is written to data/mycelium_check.txt.
"""
import argparse
import json
import os
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
from migrate_to_mycelium import parse_link, build_plan  # noqa: E402

REPORT = os.path.join(ROOT, "data", "mycelium_check.txt")
lines, counts = [], {"PASS": 0, "WARN": 0, "FAIL": 0}


def say(status, what, detail=""):
    counts[status] += 1
    mark = {"PASS": "  ok ", "WARN": "  !  ", "FAIL": "  XX "}[status]
    line = f"{mark} {what}" + (f"  ({detail})" if detail else "")
    print(line)
    lines.append(line)


def head(title):
    print("\n" + title)
    lines.append("\n" + title)


def fetch(url, body=None, timeout=60, raw=False):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET",
                                 headers={"content-type": "application/json", "user-agent": "mycelium-check"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        text = r.read().decode("utf-8", errors="replace")
        return (text if raw else json.loads(text)), time.time() - t0, r.headers


def check(what, fn):
    try:
        return fn()
    except urllib.error.HTTPError as e:
        say("FAIL", what, f"HTTP {e.code} {e.read().decode(errors='replace')[:160]}")
    except Exception as e:
        say("FAIL", what, str(e)[:200])
    return None


def q(path_extra):
    return urllib.parse.quote(path_extra, safe="=&")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("link")
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--profile")
    args = ap.parse_args()
    base, token = parse_link(args.link)
    U = f"{base}/{token}"

    # ── 1. the site ──────────────────────────────────────────────────────────
    head("1. The site")
    for path, want in [("/manifest.json", '"community.myceliation.mycelium"'), ("/history/manifest.json", '"community.myceliation.watchhistory"'),
                       ("/configure", "<html"), ("/history", "<html"), ("/ui/", "mycelium.js"), ("/ui/mycelium.js", "Mycelium")]:
        def one(path=path, want=want):
            text, dt, _ = fetch(base + path, raw=True)
            say("PASS" if want in text else "FAIL", f"{path}", f"{dt:.1f}s" if want in text else f"expected {want}")
        check(path, one)

    # ── 2. Mycelium add-on ───────────────────────────────────────────────────
    head("2. Mycelium add-on: every row loads")
    m = check("your Mycelium manifest", lambda: fetch(U + "/manifest.json")[0])
    if m:
        say("PASS", f"manifest: {len(m['catalogs'])} catalogs, version {m.get('version')}")
        if len(json.dumps(m)) > 400_000:
            say("WARN", "manifest is large", f"{len(json.dumps(m)) // 1000} KB; fewer services/microgenres would make Stremio load it faster")
        empty_ok = ("list.", "rated", "hist", "cinema")
        for c in m["catalogs"]:
            req = [e for e in c.get("extra", []) if e.get("isRequired")]
            if any(e["name"] == "search" for e in req):
                continue
            extra = "/" + q(f"{req[0]['name']}={req[0]['options'][0]}") if req and req[0].get("options") else ""
            label = f"{c['type']:<6} {c['name']}" + (f"  [{req[0]['options'][0]}]" if extra else "")
            def one(c=c, extra=extra, label=label):
                d, dt, h = fetch(f"{U}/catalog/{c['type']}/{c['id']}{extra}.json", timeout=90)
                n = len(d.get("metas") or [])
                if n:
                    say("PASS" if dt < 8 else "WARN", label, f"{n} titles, {dt:.1f}s")
                else:
                    say("PASS" if c["id"].startswith(empty_ok) else "WARN", label, f"empty, {dt:.1f}s" + ("" if c["id"].startswith(empty_ok) else "; a discovery row should not be empty"))
            check(label, one)
        # combined dropdowns on your Library
        head("3. Library dropdowns combine (genre + year + language + show + sort)")
        lib = next((c for c in m["catalogs"] if c["id"] == "list.library" and c["type"] == "movie"), None)
        if lib:
            for combo in ["genre=Horror", "genre=Horror&and=Comedy", "genre=Drama&year=1970s&sort_by=Oldest releases",
                          "language=Japanese&sort_by=TMDB rating", "show=Not watched yet&sort_by=Shuffle",
                          "sort_by=A–Z", "year=2024&sort_by=Newest releases"]:
                def one(combo=combo):
                    d, dt, _ = fetch(f"{U}/catalog/movie/list.library/{q(combo)}.json", timeout=90)
                    ms = d.get("metas") or []
                    say("PASS", combo, f"{len(ms)} titles, {dt:.1f}s" + (": " + ", ".join(f"{x['name']} {x.get('releaseInfo', '')}" for x in ms[:3]) if ms else ""))
                check(combo, one)
        else:
            say("WARN", "Library row is turned off in settings; skipped")

    # ── 4. Watch History (optional add-on; the 'Mark as watched' entry and syncing work either way) ──
    head("4. Watch History")
    hm = check("Watch History manifest", lambda: fetch(U + "/history/manifest.json")[0])
    if hm:
        say("PASS", f"manifest: {', '.join(sorted(set(c['name'] for c in hm['catalogs'])))}")
        for t in ("movie", "series"):
            check(f"Watched {t}", lambda t=t: say("PASS", f"Watched {t}s", f"{len(fetch(f'{U}/history/catalog/{t}/list.watched.json')[0]['metas'])} on the first page"))
        probe = "tt0084787"   # The Thing (1982)
        state = check("state", lambda: fetch(f"{U}/api/state?ids={probe}")[0])
        st = check("stream entry", lambda: fetch(f"{U}/history/stream/movie/{probe}.json")[0])
        if st and st.get("streams"):
            say("PASS", "a 'Mark as watched' entry appears in every title's stream list", st["streams"][0].get("title", "").replace("\n", " / ")[:80])
        already = state is not None and "watched" in ((state.get(probe) or {}).get("lists") or [])
        if state is not None and not already:
            def mark():
                fetch(f"{U}/history/mark/movie/{probe}?do=add", raw=True)
                after = fetch(f"{U}/history/stream/movie/{probe}.json")[0]["streams"][0].get("title", "")
                fetch(f"{U}/history/mark/movie/{probe}?do=remove", raw=True)
                back = fetch(f"{U}/history/stream/movie/{probe}.json")[0]["streams"][0].get("title", "")
                ok = after.startswith("✔") and back.startswith("Mark as watched")
                say("PASS" if ok else "FAIL", "marking a title watched, then unmarking it", after.split("\n")[0] + " → " + back.split("\n")[0])
            check("mark watched", mark)
        conn = check("history connection", lambda: fetch(f"{U}/api/history")[0])
        if conn is not None:
            say("PASS" if conn.get("connected") else "WARN", "Stremio account connected for automatic history",
                "" if conn.get("connected") else "optional: connect it on the settings page to get Still watching / Rewatched rows")

    # ── 5. Discover add-ons (microgenres, Library by microgenre, wars, streaming & channels) ──
    head("5. Discover add-ons: every catalog loads, and phones and TVs can pick from it")
    urls = check("add-on list", lambda: fetch(f"{U}/api/addons")[0]) or []
    PHONE = ("mgf.", "lib.", "svc", "war.")      # these keep their main choice in the one dropdown phones show ("genre")
    for url in urls:
        if url.endswith(f"/{token}/manifest.json") or "/history/" in url:
            continue
        man = check(url.rsplit(f"/{token}/", 1)[-1], lambda url=url: fetch(url)[0])
        if not man:
            continue
        cats = man.get("catalogs") or []
        say("PASS" if len(json.dumps(man)) < 20_000 else "WARN", man.get("name", "?"), f"{len(cats)} catalogs, {len(json.dumps(man)) // 1000} KB")
        base_url = url.rsplit("/", 1)[0]
        for c in cats:
            ex = c.get("extra") or []
            if c["id"].startswith(PHONE) and not (ex and ex[0].get("name") == "genre" and ex[0].get("options")):
                say("FAIL", f"   {c['name']}", "its main choice isn't in the 'genre' dropdown, so phones and TVs can't pick it")
            opts = (ex[0].get("options") or []) if ex and ex[0].get("isRequired") else []
            picks = [None] if not opts else list(dict.fromkeys([opts[0], opts[-1]]))
            for v in picks:
                path = f"{base_url}/catalog/{c['type']}/{c['id']}" + ("/" + ex[0]["name"] + "=" + urllib.parse.quote(v, safe="") if v else "") + ".json"
                def one(path=path, c=c, v=v):
                    d, dt, _ = fetch(path, timeout=90)
                    n = len(d.get("metas") or [])
                    say("PASS" if n and dt < 8 else "WARN", f"   {c['type']:<6} {c['name']}" + (f" = {v}" if v else ""), f"{n} titles, {dt:.1f}s")
                check(f"{c['name']} {v or ''}", one)

    if args.quick:
        return finish()

    # ── 6. importer ──────────────────────────────────────────────────────────
    head("6. List importer (into a temporary list that's deleted afterwards)")
    tmp = check("create temp list", lambda: fetch(f"{U}/api/lists", {"name": "Mycelium check (safe to delete)"})[0])
    lid = tmp and tmp.get("lid")
    sources = [
        ("pasted titles", {"source": "paste", "rows": [{"kind": "title", "input": f"{t} ({y})", "ref": f"{t}\u0000{y}"} for t, y in
                                                       [("The Thing", "1982"), ("Tenebre", "1982"), ("Stalker", "1979"), ("House", "1977"), ("Possession", "1981")]]}, 5),
        ("Letterboxd page", {"url": "https://letterboxd.com/director/andrei-tarkovsky/"}, 7),
        ("Wikipedia category", {"url": "https://en.wikipedia.org/wiki/Category:Films_directed_by_Andrei_Tarkovsky", "wlang": "en"}, 7),
        ("TMDB collection", {"url": "https://www.themoviedb.org/collection/8091"}, 3),     # Alien films
    ]
    for name, body, want in sources:
        if not lid:
            break
        def one(name=name, body=body, want=want):
            job = fetch(f"{U}/api/import/start", {**body, "target": "l:" + lid})[0]["job"]
            p = {}
            for _ in range(60):
                p = fetch(f"{U}/api/import/{job}/step", {"shard": 0, "of": 1}, timeout=90)[0]
                if p.get("phase") in ("ready", "error"):
                    break
            rows = fetch(f"{U}/api/import/{job}/results")[0]["rows"]
            good = [r for r in rows if r.get("status") == 1 and (r.get("conf") or 0) >= 70]
            ok = p.get("phase") == "ready" and len(good) >= want
            say("PASS" if ok else ("WARN" if good else "FAIL"), name,
                f"{len(good)} matched of {len(rows)}" + (f"; {p.get('msg')}" if p.get("msg") else "") + ("; " + ", ".join(f"{r['name']} {r.get('year') or ''}" for r in good[:4]) if good else ""))
            if good:
                fetch(f"{U}/api/import/{job}/commit", {"idxs": [r["idx"] for r in good], "target": "l:" + lid})
        check(name, one)
    if lid:
        inlist = check("temp list contents", lambda: fetch(f"{U}/catalog/movie/list.l:{lid}.json")[0]["metas"])
        if inlist is not None:
            say("PASS" if len(inlist) >= 10 else "WARN", "imported titles show up as a row", f"{len(inlist)} titles")
        check("delete temp list", lambda: fetch(f"{U}/api/lists/{lid}/delete", {}))

    # ── 7. migration ─────────────────────────────────────────────────────────
    head("7. Migration from the offline tool: titles, genres, languages")
    if not os.path.exists(os.path.join(ROOT, "data", "mycelium_migration_progress.json")):
        say("PASS", "offline library not copied over yet, so there's nothing to compare",
            "that's fine: try Mycelium first; after copying, run this check again")
        return finish()
    try:
        from config import DB_PATH
        con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
        con.row_factory = sqlite3.Row
    except Exception as e:
        say("WARN", "offline database not found; skipped", str(e)[:120])
        return finish()
    profiles = con.execute("SELECT id, name FROM profiles").fetchall()
    prof = next((p for p in profiles if not args.profile or p["name"] == args.profile), None)
    plan, named, ratings, meta, _, _ = build_plan(con, prof["id"], "watched", True)
    blacklist = {r["imdb_id"] for r in con.execute("SELECT imdb_id FROM blacklist WHERE profile_id=?", (prof["id"],))}
    have = {}
    for key in list(plan) + ["blacklist"]:
        got = check(f"export {key}", lambda key=key: fetch(f"{U}/api/export?list={urllib.parse.quote(key)}&format=json", timeout=180)[0])
        have[key] = {x["id"]: x for x in (got or [])}
    missing_all = []
    for key, items in plan.items():
        got = dict(have.get(key, {}))
        if key == "watched":
            got.update(have.get("blacklist", {}))     # --blacklist-as blacklist puts them there instead
        missing = [i for i in items if i not in got]
        missing_all += [(key, i, items[i].get("name")) for i in missing]
        n = len(items)
        say("PASS" if not missing else ("WARN" if len(missing) < n * 0.01 else "FAIL"), f"{key}: {n - len(missing):,} of {n:,} titles present",
            f"{len(missing):,} missing; listed in data/mycelium_missing.csv" if missing else "")
    lists = check("named lists", lambda: fetch(f"{U}/api/lists")[0]) or []
    for name, items in named.items():
        lst = next((l for l in lists if l["name"] == name), None)
        if not lst:
            say("FAIL", f"list '{name}' missing")
            continue
        got = {x["id"] for x in fetch(f"{U}/api/export?list=l:{lst['lid']}&format=json")[0]}
        miss = [i for i in items if i not in got]
        say("PASS" if not miss else "FAIL", f"list '{name}': {len(items) - len(miss)} of {len(items)}")
    # genres + language: compare what Mycelium stores with the offline metadata
    checked = gmiss = lmiss = 0
    for key in plan:
        for i, row in have.get(key, {}).items():
            off = meta.get(i)
            if not off:
                continue
            checked += 1
            if off.get("genres") and not set(off["genres"]) <= set(row.get("genres") or []):
                gmiss += 1
            if off.get("lang") and row.get("lang") != off.get("lang"):
                lmiss += 1
    if checked:
        say("PASS" if gmiss <= checked * 0.01 else "FAIL", f"genres carried over for {checked - gmiss:,} of {checked:,} titles")
        say("PASS" if lmiss <= checked * 0.01 else "FAIL", f"original language carried over for {checked - lmiss:,} of {checked:,} titles")
    if missing_all:
        with open(os.path.join(ROOT, "data", "mycelium_missing.csv"), "w", encoding="utf-8") as f:
            f.write("list,imdb_id,title\n" + "\n".join(f'{k},{i},"{(n or "").replace(chr(34), "")}"' for k, i, n in missing_all))
        say("WARN", "to send the missing ones: delete data/mycelium_migration_progress.json and run migrate_to_mycelium.py again (titles already there are skipped)")
    return finish()


def finish():
    total = f"\n{counts['PASS']} passed, {counts['WARN']} warnings, {counts['FAIL']} failed."
    print(total)
    lines.append(total)
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Report saved to {REPORT}")


if __name__ == "__main__":
    main()
