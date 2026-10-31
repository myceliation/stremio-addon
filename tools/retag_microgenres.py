"""
Re-sorts your saved titles into the current microgenres in one go, from the TMDB details this PC already has
(data/stremio.db + data/mycelium_keywords.jsonl), instead of Mycelium looking each of 19,000 titles up again.
Run by step 3 (Add to Stremio) whenever the microgenre list has changed; or:  python tools/retag_microgenres.py
"""
import json, os, sqlite3, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def http(url, body=None, timeout=90):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"content-type": "application/json", "user-agent": "mycelium-applet"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def titles():
    db = os.path.join(ROOT, "data", "stremio.db")
    if not os.path.exists(db):
        return []
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    kw = {}
    kp = os.path.join(ROOT, "data", "mycelium_keywords.jsonl")
    if os.path.exists(kp):
        for line in open(kp, encoding="utf-8"):
            try:
                k = json.loads(line); kw[k["id"]] = [x[0] for x in k.get("k") or []]
            except Exception:
                pass
    out = []
    for iid, data in con.execute("SELECT imdb_id, tmdb_data FROM metadata_cache"):
        if not str(iid).startswith("tt") or iid not in kw:
            continue
        try:
            d = json.loads(data)
        except Exception:
            continue
        if d.get("_stub"):
            continue
        out.append({"id": iid, "type": "series" if d.get("type") in ("series", "tv") else "movie", "name": d.get("title"),
                    "year": str(d.get("year") or "")[:4] or None, "poster": d.get("poster") or None, "genres": d.get("genres") or [],
                    "lang": d.get("language") or None, "countries": d.get("origin_country") or [], "kw": kw[iid]})
    return out


def run(base, token, say=print):
    rows = titles()
    if not rows:
        return say("No offline TMDB details on this PC; Mycelium will sort titles itself, a few at a time.")
    api = f"{base}/{token}/api/"
    for i in range(0, len(rows), 150):
        http(api + "bulk", {"items": rows[i:i + 150]})
        if i % 3000 == 0:
            say(f"Sorting your saved titles into microgenres… {i:,} of {len(rows):,}")
    http(api + "mg-stats", {})
    say(f"Sorted {len(rows):,} titles into the current microgenres.")


if __name__ == "__main__":
    link = open(os.path.join(ROOT, "data", "mycelium_link.txt")).read().strip()
    import re
    m = re.match(r"^(https?://[^/]+)/([A-Za-z0-9_-]{30,})", link)
    run(m.group(1), m.group(2))
