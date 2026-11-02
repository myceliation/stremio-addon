"""
Stress test: a temporary Mycelium copy with every option switched on, then every row,
every dropdown option, every import source, every button the settings page uses,
Watch History, the share page and exports. Your own copy isn't touched; the temporary
one is deleted at the end. Report: data/mycelium_stress.txt

    python stress_mycelium.py            (or step 5 in the Mycelium window → Stress test)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "https://mycelium.myceliation.workers.dev"
REPORT = os.path.join(ROOT, "data", "mycelium_stress.txt")
STREMIO_LIMIT = 26000          # biggest add-on Stremio has accepted on this account (Anime Catalogs); 45 KB was refused
results, slow, lines = {"ok": 0, "warn": 0, "fail": 0}, [], []


def log(s=""):
    print(s, flush=True)
    lines.append(s)


def note(kind, what, detail=""):
    results[kind] += 1
    if kind != "ok":
        log(f"  {'!' if kind == 'warn' else 'XX'}  {what}" + (f"  ({detail})" if detail else ""))


def req(path, body=None, raw=False, timeout=90):
    url = path if path.startswith("http") else SITE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method="POST" if data else "GET",
                               headers={"content-type": "application/json", "user-agent": "mycelium-stress"})
    t0 = time.time()
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    dt = time.time() - t0
    if dt > 6:
        slow.append((dt, url.replace(SITE, "")))
    return text if raw else json.loads(text)


def safe(what, fn):
    try:
        return fn()
    except urllib.error.HTTPError as e:
        note("fail", what, f"HTTP {e.code}: {e.read().decode(errors='replace')[:150]}")
    except Exception as e:
        note("fail", what, str(e)[:150])
    return None


def q(s):
    return urllib.parse.quote(s, safe="=&")


def main():
    t_start = time.time()
    log(f"Stress test of {SITE}  ({time.strftime('%Y-%m-%d %H:%M')})")

    # ── a temporary copy with everything on ─────────────────────────────────
    log("\n1. Temporary copy with every option on")
    T = req("/api/new", {})["token"]
    U = f"/{T}"
    regions = [r["code"] for r in req("/api/regions")]
    provs = {}
    batches = [regions[i:i + 6] for i in range(0, len(regions), 6)]
    with ThreadPoolExecutor(6) as ex:
        for got in ex.map(lambda b: safe("providers " + ",".join(b), lambda: req("/api/providers?regions=" + ",".join(b))) or [], batches):
            for p in got:
                e = provs.setdefault(p["name"], {"name": p["name"], "ids": {}})
                for r in p["regions"]:
                    e["ids"][r] = p["id"]
    s = req(f"{U}/api/settings")["settings"]
    s["regions"] = regions
    s["rows"] = {k: True for k in s["rows"]}
    s["providers"] = list(provs.values())
    s["hideWatched"] = s["hideIgnored"] = s["shelveButton"] = s["mgLinks"] = s["serviceRows"] = True
    s["displayName"] = "Stress test"
    import re
    src = open(os.path.join(ROOT, "worker", "src", "microgenres.js"), encoding="utf-8").read()
    mg_ids = re.findall(r'"id":"([a-z0-9-]+)","name"', src)
    mg_ids = mg_ids[::max(1, len(mg_ids) // 20)]            # 20 spread across the whole list (the most it allows)
    s["microgenres"] = mg_ids[:20]
    s["custom"] = [{"name": n, "query": n, "type": t} for n, t in [
        ("slow 70s japanese horror", "movie"), ("swamp", "movie"), ("korean crime series", "series"), ("time loop", "movie"),
        ("best french new wave", "movie"), ("obscure italian giallo", "movie"), ("road trip comedy", "movie"),
        ("nordic noir", "series"), ("witch", "movie"), ("90s anime", "movie"), ("cosmic horror", "movie"),
        ("heist", "movie"), ("bollywood musical", "movie"), ("british sitcom", "series"), ("folk horror", "movie")]]
    saved = req(f"{U}/api/settings", s)["settings"]
    log(f"  {len(saved['regions'])} regions, {len(saved['providers'])} streaming services, {len(saved['microgenres'])} microgenres, "
        f"{len(saved['custom'])} custom genres, every row on")
    note("ok", "settings saved")

    # lists, shelves, ratings
    lids = [req(f"{U}/api/lists", {"name": n})["lid"] for n in ("Swamp cinema", "Stress list 2", "To delete")]
    req(f"{U}/api/lists/{lids[1]}", {"name": "Renamed list"})
    req(f"{U}/api/lists/{lids[1]}", {"row": False})
    req(f"{U}/api/lists/{lids[1]}", {"row": True})
    titles = [("tt0084787", "movie"), ("tt0081505", "movie"), ("tt0096283", "movie"), ("tt0903747", "series"), ("tt0245429", "movie"),
              ("tt0078748", "movie"), ("tt0365748", "movie"), ("tt0141842", "series"), ("tt0091064", "movie"), ("tt0087843", "movie")]
    shelves = ["library", "watched", "loved", "waiting", "rewatch", "dropped", "ignore", "blacklist", "l:" + lids[0], "l:" + lids[1]]
    for i, (tid, typ) in enumerate(titles):
        for sh in shelves[: 3 + i % 8]:
            safe(f"member {sh} {tid}", lambda: req(f"{U}/api/member", {"list": sh, "id": tid, "type": typ, "on": True}))
        safe(f"rate {tid}", lambda: req(f"{U}/api/rate", {"id": tid, "type": typ, "stars": 1 + i % 5, "review": "stress review " + str(i)}))
    safe("unshelve", lambda: req(f"{U}/api/member", {"list": "loved", "id": titles[0][0], "type": "movie", "on": False}))
    safe("unrate", lambda: req(f"{U}/api/rate", {"id": titles[1][0], "type": "movie", "stars": 0}))
    st = safe("state", lambda: req(f"{U}/api/state?ids=" + ",".join(t for t, _ in titles)))
    note("ok" if st and len(st) == len(titles) else "fail", "shelves, lists and ratings saved")
    req(f"{U}/api/lists/{lids[2]}/delete", {})

    # ── imports: every source ───────────────────────────────────────────────
    log("\n2. Importer: every kind of source")
    sources = [
        ("pasted titles", {"source": "paste", "rows": [{"kind": "title", "input": f"{t} ({y})", "ref": f"{t}\u0000{y}"} for t, y in
                                                       [("The Thing", "1982"), ("Tenebre", "1982"), ("Stalker", "1979"), ("House", "1977"), ("Possession", "1981"), ("Suspiria", "1977")]]}),
        ("pasted IMDb ids", {"source": "paste", "rows": [{"kind": "id", "input": i, "ref": i} for i in ("tt0081505", "tt0096283", "tt0057012")]}),
        ("IMDb CSV with ratings", {"source": "csv", "rows": [{"kind": "id", "input": i, "ref": i, "stars": st} for i, st in (("tt0068646", 5), ("tt0110912", 4), ("tt0050083", 3))]}),
        ("Letterboxd CSV with ratings", {"source": "csv", "rows": [{"kind": "title", "input": "Possession (1981)", "ref": "Possession\u00001981", "stars": 4.5},
                                                                   {"kind": "title", "input": "Tenebrae (1982)", "ref": "Tenebrae\u00001982", "stars": 4}]}),
        ("Letterboxd page", {"url": "https://letterboxd.com/director/andrei-tarkovsky/"}),
        ("Letterboxd watchlist (several pages, first 150)", {"url": "https://letterboxd.com/dave/watchlist/", "maxRows": 150}),
        ("TMDB collection", {"url": "https://www.themoviedb.org/collection/8091"}),
        ("TMDB person", {"url": "https://www.themoviedb.org/person/138-quentin-tarantino"}),
        ("TMDB company", {"url": "https://www.themoviedb.org/company/41077-a24"}),
        ("TMDB keyword", {"url": "https://www.themoviedb.org/keyword/9715-superhero/movie"}),
        ("Wikipedia category", {"url": "https://en.wikipedia.org/wiki/Category:Films_directed_by_Andrei_Tarkovsky", "wlang": "en"}),
        ("Wikipedia list article", {"url": "https://en.wikipedia.org/wiki/List_of_films_considered_the_worst", "wlang": "en"}),
        ("IMDb list link (should explain to paste instead)", {"url": "https://www.imdb.com/list/ls000004717/"}),
    ]
    targets = ["library", "l:" + lids[0], "loved", "liked", "l:" + lids[1]]
    for n, (name, body) in enumerate([] if os.environ.get("STRESS_SKIP_IMPORT") else sources):
        target = targets[n % len(targets)]
        print(f"  …  {name}", flush=True)

        def run(name=name, body=body, target=target):
            job = req(f"{U}/api/import/start", {**body, "target": target})["job"]
            t0 = time.time()
            last = {"p": {}}

            def helper(k):                       # four helpers side by side, like the import page
                while time.time() - t0 < 150:
                    q = req(f"{U}/api/import/{job}/step", {"shard": k, "of": 4})
                    if k == 0:
                        last["p"] = q
                    if q.get("phase") in ("ready", "error"):
                        return q
                    if k and q.get("phase") == "collect":
                        time.sleep(1.5)
                return q
            with ThreadPoolExecutor(4) as ex:
                ends = list(ex.map(helper, range(4)))
            p = next((q for q in ends if q.get("phase") == "error"), ends[0])
            rows = req(f"{U}/api/import/{job}/results")["rows"]
            good = [r for r in rows if r.get("status") == 1 and (r.get("conf") or 0) >= 70]
            expect_error = "IMDb list" in name
            if expect_error:
                note("ok" if p.get("phase") == "error" and "paste" in (p.get("msg") or "").lower() else "warn", name, p.get("msg", ""))
                return
            if not good:
                note("fail", name, f"{p.get('phase')}: nothing matched of {len(rows)}; {p.get('msg', '')}")
            else:
                if p.get("phase") != "ready":
                    log(f"  …  {name}: still working through {len(rows)} titles after 150s; keeping the {len(good)} matched so far")
                c = req(f"{U}/api/import/{job}/commit", {"idxs": [r["idx"] for r in good][:150], "target": target})
                note("ok", name)
                log(f"  ok  {name} → {target}: {len(good)} of {len(rows)} matched ({time.time() - t0:.0f}s)" + (f"; {p.get('msg')}" if p.get("msg") else ""))
        safe(name, run)

    # ── every row, every dropdown option ───────────────────────────────────
    log("\n3. Every row, and every option of every dropdown")
    m = req(f"{U}/manifest.json")
    size = len(json.dumps(m, separators=(",", ":")))
    note("ok" if size <= STREMIO_LIMIT else "fail", "manifest size", f"{size:,} bytes, {len(m['catalogs'])} rows; Stremio refused 45 KB")
    log(f"  manifest: {size:,} bytes, {len(m['catalogs'])} rows ({'fits' if size <= STREMIO_LIMIT else 'TOO BIG for Stremio'})" +
        (f"; {m['description'].split('(')[-1].rstrip(')')}" if "left out" in m["description"] else ""))
    # every service must end up somewhere: Mycelium itself or a "Mycelium · Services N" add-on
    extra_addons = safe("add-on list", lambda: req(f"{U}/api/addons")) or []
    svc_rows = 0
    for au in extra_addons:
        am = safe(au, lambda au=au: req(au))
        if not am:
            continue
        sz = len(json.dumps(am, separators=(",", ":")))
        svc_rows += sum(1 for c in am["catalogs"] if c["id"].startswith("prov."))
        note("ok" if sz <= STREMIO_LIMIT else "fail", f"{am['name']} size", f"{sz:,} bytes")
        if "/services/" in au and am["catalogs"]:
            c0 = am["catalogs"][0]
            safe(f"{am['name']} row", lambda au=au, c0=c0: req(au.replace("manifest.json", f"catalog/{c0['type']}/{c0['id']}.json")))
        # hub add-ons (microgenre families, streaming services): every option of the required dropdown
        if "/microgenres/" in au or "/allservices/" in au:
            hub_urls = []
            for c in am["catalogs"]:
                req0 = next((e for e in c["extra"] if e.get("isRequired")), None)
                for o in (req0["options"] if req0 else []):
                    hub_urls.append(au.replace("manifest.json", f"catalog/{c['type']}/{c['id']}/{q(req0['name'] + '=' + o)}.json"))
            if "/allservices/" in au:
                hub_urls = hub_urls[::10]          # every tenth service (they're also tested as rows)
            empty = []
            def hub(u):
                try:
                    return None if req(u).get("metas") else urllib.parse.unquote(u.rsplit("/", 1)[-1])
                except Exception as e:
                    return "ERROR " + str(e)[:60]
            with ThreadPoolExecutor(8) as ex:
                bad = [r for r in ex.map(hub, hub_urls) if r]
            errs = [b for b in bad if b.startswith("ERROR")]
            note("ok" if not errs else "fail", f"{am['name']}: {len(hub_urls)} options", f"{len(bad) - len(errs)} empty, {len(errs)} errors" + (": " + "; ".join(bad[:4]) if bad else ""))
            log(f"  {am['name']}: {len(hub_urls) - len(bad)} of {len(hub_urls)} options have titles" + (f" (empty: {', '.join(b for b in bad[:6] if not b.startswith('ERROR'))})" if bad else ""))
    note("ok" if svc_rows == 2 * len(saved["providers"]) else "fail", "every streaming service has its rows",
         f"{svc_rows // 2} of {len(saved['providers'])} services across {len(extra_addons)} add-ons")
    log(f"  {len(extra_addons)} add-ons in all; {svc_rows // 2} of {len(saved['providers'])} services have rows")
    urls = []
    for c in m["catalogs"]:
        base = f"{U}/catalog/{c['type']}/{c['id']}"
        req_extra = [e for e in c.get("extra", []) if e.get("isRequired")]
        if any(e["name"] == "search" for e in req_extra):
            urls.append((c, base + "/" + q("search=" + ("slow 70s japanese horror" if c["id"] == "mix" else
                                                     "https://letterboxd.com/director/andrei-tarkovsky/" if c["id"] == "import" else "Tarkovsky")) + ".json"))
            continue
        fixed = f"{req_extra[0]['name']}={req_extra[0]['options'][0]}&" if req_extra and req_extra[0].get("options") else ""
        urls.append((c, base + ("/" + q(fixed.rstrip("&")) if fixed else "") + ".json"))
        for e in c.get("extra", []):
            if e.get("isRequired") or not e.get("options"):
                continue
            for o in e["options"]:
                urls.append((c, f"{base}/{q(fixed + e['name'] + '=' + o)}.json"))
        if any(e["name"] == "skip" for e in c.get("extra", [])):
            urls.append((c, f"{base}/{q(fixed + 'skip=100')}.json"))
        if any(e["name"] == "search" for e in c.get("extra", [])):
            urls.append((c, f"{base}/{q('search=the')}.json"))
    log(f"  {len(urls):,} requests…")
    empties = {}

    def one(cu):
        c, url = cu
        try:
            d = req(url)
            if not (d.get("metas") or []):
                empties.setdefault(c["id"], []).append(urllib.parse.unquote(url.rsplit("/", 1)[-1]))
            return None
        except urllib.error.HTTPError as e:
            return f"{url}: HTTP {e.code}"
        except Exception as e:
            return f"{url}: {str(e)[:80]}"
    with ThreadPoolExecutor(8) as ex:
        errs = [r for r in ex.map(one, urls) if r]
    for e in errs[:25]:
        note("fail", e)
    results["ok"] += len(urls) - len(errs)
    # small services often have nothing for one type in one region, and lists only hold what was added,
    # so only discovery rows that come back empty for most of their options are worth a look
    for k, v in empties.items():
        if k.startswith(("list.", "rated", "hist", "prov.")):
            continue
        n_opts = sum(1 for c, u in urls if c["id"] == k)
        if len(v) > max(3, n_opts * 0.25):
            note("warn", f"{k}: {len(v)} of {n_opts} option combinations came back empty", ", ".join(v[:5]))
    pe = sum(1 for k in empties if k.startswith("prov."))
    if pe:
        log(f"  (note: {pe} niche streaming services have no titles for films or series in their region — normal)")

    # ── Watch History, share page, exports, other pages ────────────────────
    log("\n4. Watch History, share page, exports, title pages")
    hm = safe("history manifest", lambda: req(f"{U}/history/manifest.json"))
    if hm:
        for c in hm["catalogs"]:
            for e in [x for x in c.get("extra", []) if x.get("options")]:
                for o in e["options"]:
                    safe(f"history {e['name']}={o}", lambda o=o, e=e, c=c: req(f"{U}/history/catalog/{c['type']}/{c['id']}/{q(e['name'] + '=' + o)}.json"))
        note("ok", "Watch History rows and dropdowns")
    tid = "tt0050083"
    a = safe("mark", lambda: req(f"{U}/history/mark/movie/{tid}?do=add", raw=True))
    on = safe("stream after mark", lambda: req(f"{U}/history/stream/movie/{tid}.json")["streams"][0]["title"])
    req(f"{U}/history/mark/movie/{tid}?do=remove", raw=True)
    off = safe("stream after unmark", lambda: req(f"{U}/history/stream/movie/{tid}.json")["streams"][0]["title"])
    note("ok" if on and on.startswith("✔") and off and off.startswith("Mark") else "fail", "Mark as watched / unmark")
    # microgenres: title pages, filling, ranking, and the lists' Microgenre dropdown
    meta = safe("title page", lambda: req(f"{U}/meta/movie/tt0084787.json")["meta"])
    mgl = [l["name"] for l in (meta or {}).get("links", []) if l.get("category") == "Microgenres"]
    note("ok" if mgl else "fail", "title page lists microgenres", ", ".join(mgl[:6]))
    if mgl:
        log("  The Thing's microgenres: " + ", ".join(mgl))
    for _ in range(40):
        if (safe("mg-fill", lambda: req(f"{U}/api/mg-fill", {})) or {}).get("done", True):
            break
    safe("mg-stats", lambda: req(f"{U}/api/mg-stats", {}))
    lib = [c for c in req(f"{U}/manifest.json")["catalogs"] if c["id"] == "list.library" and c["type"] == "movie"]
    mgx = [e for e in (lib[0]["extra"] if lib else []) if e["name"] == "microgenre"]
    note("ok" if mgx else "fail", "Library has a Microgenre dropdown", f"{len(mgx[0]['options'])} options" if mgx else "")
    # (Library hides watched titles, so look across the shelves too)
    for o in (mgx[0]["options"][:5] if mgx else []):
        n = sum(len(safe("microgenre filter", lambda o=o, l=l: req(f"{U}/catalog/movie/list.{l}/{q('microgenre=' + o)}.json")["metas"]) or [])
                for l in ("library", "waiting", "rewatch", "loved"))
        note("ok" if n else "warn", f"lists filtered to microgenre '{o}'", f"{n} titles")
    settings = req(f"{U}/api/settings")
    share = settings["share"].rsplit("/", 1)[-1]
    for path in [f"/u/{share}", f"/u/{share}/manifest.json", f"/u/{share}/catalog/movie/watched.json", f"/u/{share}/catalog/movie/loved.json",
                 f"{U}/act/movie/tt0084787", f"{U}/stream/movie/tt0084787.json", f"{U}/meta/movie/myc:tool:import.json",
                 f"{U}/import", f"{U}/configure", "/history", "/configure", "/ui/", "/ui/mycelium.js", "/manifest.json", "/history/manifest.json"]:
        safe(path, lambda path=path: req(path, raw=True)) and note("ok", path)
    for lst in ["library", "watched", "loved", "liked", "l:" + lids[0]]:
        safe(f"export {lst}", lambda lst=lst: req(f"{U}/api/export?list={lst}&format=json")) is not None and note("ok", f"export {lst}")
        safe(f"export csv {lst}", lambda lst=lst: req(f"{U}/api/export?list={lst}", raw=True))
    counts = settings.get("counts", {})
    log("  lists now: " + ", ".join(f"{k} {v.get('movie', 0) + v.get('series', 0)}" for k, v in counts.items()))

    # ── clean up ───────────────────────────────────────────────────────────
    safe("delete temporary copy", lambda: req(f"{U}/api/delete", {}))
    gone = not (safe("manifest after delete", lambda: req(f"{U}/manifest.json")) or {}).get("catalogs")
    note("ok" if gone else "warn", "temporary copy deleted")

    log(f"\nSlowest requests: " + ("; ".join(f"{u} {d:.1f}s" for d, u in sorted(slow, reverse=True)[:5]) if slow else "none over 6s"))
    log(f"\n{results['ok']:,} passed, {results['warn']} warnings, {results['fail']} failed, in {(time.time() - t_start) / 60:.1f} minutes.")
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    open(REPORT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    log(f"Report saved to {REPORT}")


if __name__ == "__main__":
    main()
