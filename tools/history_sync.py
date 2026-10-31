"""
Copies what Stremio on this PC has marked finished into your Mycelium Watched list.
Used when Mycelium's server can't read your Stremio account itself: the Watchlist server
window runs it every 30 minutes while it's open (and once on demand from the Mycelium window).
Reads Stremio's own saved data on this PC; nothing is sent anywhere but your Mycelium.
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
LINK_FILE = os.path.join(ROOT, "data", "mycelium_link.txt")
STATE = os.path.join(ROOT, "data", "history_sync.json")


def enabled():
    try:
        return json.load(open(STATE)).get("on", False)
    except Exception:
        return False


def set_enabled(on):
    st = _state()
    st["on"] = bool(on)
    _save(st)


def _state():
    try:
        return json.load(open(STATE))
    except Exception:
        return {"on": False, "sent": []}


def _save(st):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    json.dump(st, open(STATE, "w"))


def sync_once():
    """Returns how many newly finished titles were sent."""
    import re
    from companion import stremio_local
    link = open(LINK_FILE, encoding="utf-8").read().strip()
    m = re.match(r"^(https?://[^/]+)/([A-Za-z0-9_-]{30,})", link)
    base, token = m.group(1), m.group(2)
    st = _state()
    sent = set(st.get("sent") or [])
    items = []
    for it in stremio_local.library_items():
        s = it.get("state") or {}
        iid = str(it.get("_id", ""))
        if iid.startswith("tt") and (s.get("flaggedWatched") or s.get("timesWatched")) and iid not in sent:
            items.append({"id": iid, "type": "series" if it.get("type") in ("series", "tv") else "movie",
                          "name": it.get("name"), "poster": it.get("poster")})
    for i in range(0, len(items), 150):
        chunk = items[i:i + 150]
        req = urllib.request.Request(f"{base}/{token}/api/bulk", data=json.dumps({"list": "watched", "items": chunk}).encode(),
                                     headers={"content-type": "application/json", "user-agent": "mycelium-history-sync"}, method="POST")
        urllib.request.urlopen(req, timeout=60).read()
        sent |= {x["id"] for x in chunk}
        st["sent"] = sorted(sent)
        _save(st)
    # sort the new ones into microgenres and refresh the lists' Microgenre dropdown
    for _ in range(200):
        try:
            r = json.loads(urllib.request.urlopen(urllib.request.Request(f"{base}/{token}/api/mg-fill", data=b"{}",
                headers={"content-type": "application/json", "user-agent": "mycelium-history-sync"}, method="POST"), timeout=60).read())
        except Exception:
            break
        if r.get("done"):
            break
    try:
        urllib.request.urlopen(urllib.request.Request(f"{base}/{token}/api/mg-stats", data=b"{}",
            headers={"content-type": "application/json", "user-agent": "mycelium-history-sync"}, method="POST"), timeout=60).read()
    except Exception:
        pass
    return len(items)


if __name__ == "__main__":
    print(f"{sync_once()} newly finished titles copied to Watched.")
