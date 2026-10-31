"""
Publishes this folder to GitHub and sends the Stremio bug fixes, using the GitHub login
Windows already has saved for git (the same one your website .bat files use).

  1. creates github.com/<you>/stremio-addon (public, if it doesn't exist) and pushes this
     folder to it; .gitignore keeps your library, data, keys and logs out
  2. forks Stremio/stremio-web and Stremio/stremio-shell-ng (if not already forked)
  3. puts each patch in upstream-fixes/ on its own branch of your fork and opens a
     pull request on Stremio's repo (or reports the one already open)
  4. files the feature requests below on Stremio's public trackers, once each: anything already
     filed by you (data/github_published.json) or already requested by someone else is skipped
     and reported, so pressing 7 again only sends what's new

Run from the Mycelium window (step 7) or:  python tools/github_publish.py
"""
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "stremio-addon"
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
PATCHES = [
    ("stremio-web", "development", "fix/deeplink-port-and-query", "stremio-web-1-deeplink-port-and-query.patch",
     "Keep port and query string when opening stremio:// add-on links",
     "`ShellOpenHandler` builds the add-on address from `hostname`, which drops a non-default port, and never appends "
     "the query string. So `stremio://example.com:8443/manifest.json` opens `https://example.com/manifest.json`, and "
     "`stremio://my.addon/manifest.json?key=abc` loses `?key=abc`. Using `host` and `search` keeps both."),
    ("stremio-web", "development", "fix/discover-multiselect-extra-title", "stremio-web-2-discover-multiselect-title.patch",
     "Discover: show every selected value of a multi-select extra",
     "stremio-core supports extras with `optionsLimit` > 1 and toggles values correctly, but the Discover dropdown "
     "title only shows the first selected value, so there's no way to see what's applied. This shows all of them."),
    ("stremio-shell-ng", "main", "fix/reclaim-stale-protocol-handler", "stremio-shell-ng-1-reclaim-stremio-links.patch",
     "Setup: take over stremio:// from stale or older-Stremio handlers",
     "`RegisterProtocol` skips registering `stremio://` whenever any handler exists that this installer didn't write, "
     "including one left by Stremio 4 or one pointing at a program that no longer exists. After upgrading, Install "
     "buttons on add-on sites silently do nothing. This also takes over handlers whose target is missing or is an "
     "older Stremio executable; handlers belonging to other programs are still left alone."),
]
FOOTER = "\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)"
# (repo, title, words that would be in the title of an existing request for the same thing, body)
ISSUES = [
    ("stremio-features", "Phone and TV apps: show all of an add-on's Discover dropdowns, like the desktop app",
     "dropdown extra filters",
     "On desktop and web, Discover shows a dropdown for every extra a catalog declares with options (genre, year, sort, "
     "an add-on's own filters), because stremio-core hands all of them over (`catalog_with_filters.rs`, `selectable.extra`). "
     "The Android, Android TV and other TV apps only draw the first one, so catalogs with a second or third filter can't be "
     "narrowed down there, and the three apps behave differently with the same add-on.\n\n"
     "Request: draw every selectable extra on phones and TVs too (a row of chips, or a Filters sheet), so Discover works the "
     "same on every app. Add-ons that already declare several extras would just start working."),
    ("stremio-features", "Option to hide the Calendar tab", "calendar hide",
     "Not everyone uses the Calendar. A setting to hide it from the navigation (as some apps let you hide tabs) would keep "
     "the menu shorter, especially on TVs where every tab costs remote presses."),
    ("stremio-features", "Let users reorder installed add-ons", "reorder add-ons",
     "Rows on the Board and Discover's catalog list follow install order, so a newly installed add-on always lands at the "
     "bottom. The order is already stored in the account (`addonCollectionSet`) and stremio-core keeps it; only a "
     "drag-to-reorder (or move up / down) control is missing."),
    ("stremio-features", "Discover: keep the add-on, catalog and filters when switching Movies ⇄ Series", "switching type filters",
     "Changing the type in Discover resets the catalog and every dropdown to the defaults, even when the same add-on has a "
     "catalog with the same id and the same options for the other type. Expected: keep the add-on, catalog id and any extras "
     "whose values exist in the new type's catalog, so you can flick between films and series of the same kind."),
    ("stremio-features", "Streaming server: let users add their own extra BitTorrent trackers", "trackers",
     "The streaming server only announces to the trackers each stream's add-on lists (plus DHT). Desktop torrent clients "
     "(qBittorrent, Transmission) let you keep a list of extra trackers that's added to every torrent, which helps slow or "
     "poorly seeded torrents find peers. Request: a Settings → Streaming field for extra trackers (one per line, or a URL "
     "to a public tracker list that's refreshed now and then), added to every torrent the server opens."),
    ("TheBeastLT/torrentio-scraper", "Configure page: let users add their own extra trackers", "trackers",
     "Torrentio already attaches a set of public trackers to every stream. Request: a field on the configure page where a "
     "user can paste extra trackers (one per line) or a link to a public tracker list, added to the sources of every "
     "stream Torrentio returns for them. It would sit in the config string like the other options, so nothing changes "
     "for anyone who leaves it empty."),
    ("stremio-web", "Add-on dropdown values are run through the translator", "translat dropdown",
     "Discover passes every add-on option label through i18next (`t.string(value)`), so an option that happens to equal a "
     "translation key (e.g. \"SEARCH\", \"FILTER\", \"SORT\") shows the translated word instead of the add-on's text. "
     "Labels coming from add-ons should be shown as given."),
]
STATE = os.path.join(ROOT, "data", "github_published.json")


def say(msg):
    print(msg, flush=True)


def git(*args, cwd=ROOT, check=True, quiet=False):
    r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", creationflags=NO_WINDOW)
    if not quiet and (r.stdout.strip() or r.stderr.strip()):
        say("    " + (r.stdout + r.stderr).strip().replace("\n", "\n    ")[:800])
    if check and r.returncode:
        raise RuntimeError(f"git {' '.join(args[:2])} failed")
    return r


def token():
    r = subprocess.run(["git", "credential", "fill"], input="protocol=https\nhost=github.com\n\n", capture_output=True,
                       text=True, creationflags=NO_WINDOW, timeout=180)
    vals = dict(l.split("=", 1) for l in r.stdout.splitlines() if "=" in l)
    return vals.get("password")


def api(tok, method, path, body=None):
    req = urllib.request.Request("https://api.github.com" + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json",
                                          "Content-Type": "application/json", "User-Agent": "mycelium-publish"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


def main():
    if subprocess.run(["git", "--version"], capture_output=True, creationflags=NO_WINDOW).returncode:
        return say("git isn't installed: get it from https://git-scm.com and run this again.")
    tok = token()
    if not tok:
        return say("Windows has no saved GitHub login for git. Push any of your sites once (that saves it), then run this again.")
    code, me = api(tok, "GET", "/user")
    if code != 200:
        return say(f"GitHub didn't accept the saved login (HTTP {code}). Push one of your sites again to refresh it.")
    user = me["login"]
    say(f"Signed in to GitHub as {user}.\n")

    # 1. this folder → github.com/<user>/stremio-addon
    say(f"1. github.com/{user}/{REPO}")
    code, _ = api(tok, "GET", f"/repos/{user}/{REPO}")
    if code == 404:
        code, r = api(tok, "POST", "/user/repos", {"name": REPO, "private": False, "has_wiki": False,
              "description": "Watchlist server for Stremio (self-hosted) plus Mycelium + Watch History (free hosted Stremio add-ons) and a converter between them"})
        if code >= 300:
            return say(f"   couldn't create it: {r.get('message')}")
        say("   created")
    if not os.path.isdir(os.path.join(ROOT, ".git")):
        git("init", "-b", "main")
    # lock files left behind by a git run that crashed (no git is running now): remove the stale ones
    for d, _, files in os.walk(os.path.join(ROOT, ".git")):
        for f in files:
            p = os.path.join(d, f)
            if f.endswith(".lock") and time.time() - os.path.getmtime(p) > 600:
                try:
                    os.remove(p); say(f"   removed a stale git lock: {os.path.relpath(p, ROOT)}")
                except OSError:
                    pass
    git("add", "-A", quiet=True)
    if git("status", "--porcelain", quiet=True).stdout.strip():
        git("-c", "user.name=" + user, "-c", f"user.email={user}@users.noreply.github.com", "commit", "-q", "-m",
            "Update: Watchlist server, Mycelium + Watch History, converter, Stremio fixes")
    git("branch", "-M", "main", quiet=True)
    url = f"https://github.com/{user}/{REPO}.git"
    if git("remote", "get-url", "origin", check=False, quiet=True).returncode:
        git("remote", "add", "origin", url)
    else:
        git("remote", "set-url", "origin", url)
    git("push", "-u", "origin", "main", "--force-with-lease")
    say(f"   pushed: https://github.com/{user}/{REPO}\n")

    # 2 + 3. forks and pull requests
    work = os.path.join(tempfile.gettempdir(), "stremio-fixes")
    os.makedirs(work, exist_ok=True)
    for repo, base, branch, patch, title, why in PATCHES:
        say(f"2. Stremio/{repo}: {title}")
        code, _ = api(tok, "GET", f"/repos/{user}/{repo}")
        if code == 404:
            api(tok, "POST", f"/repos/Stremio/{repo}/forks", {"default_branch_only": True})
            for _ in range(30):
                time.sleep(3)
                if api(tok, "GET", f"/repos/{user}/{repo}")[0] == 200:
                    break
            say("   forked")
        code, prs = api(tok, "GET", f"/repos/Stremio/{repo}/pulls?state=open&head={user}:{branch}")
        if code == 200 and prs:
            say(f"   already open: {prs[0]['html_url']}\n")
            continue
        d = os.path.join(work, repo)
        if not os.path.isdir(os.path.join(d, ".git")):
            git("clone", "--depth", "50", f"https://github.com/{user}/{repo}.git", d, cwd=work)
            git("remote", "add", "upstream", f"https://github.com/Stremio/{repo}.git", cwd=d, check=False, quiet=True)
        git("fetch", "--depth", "50", "upstream", base, cwd=d, quiet=True)
        git("checkout", "-q", "-B", branch, f"upstream/{base}", cwd=d)
        if git("am", "--3way", os.path.join(ROOT, "upstream-fixes", patch), cwd=d, check=False).returncode:
            git("am", "--abort", cwd=d, check=False, quiet=True)
            say("   the patch no longer applies: Stremio changed that file since. Skipped.\n")
            continue
        git("push", "-q", "-f", "origin", branch, cwd=d)
        code, pr = api(tok, "POST", f"/repos/Stremio/{repo}/pulls",
                       {"title": title, "head": f"{user}:{branch}", "base": base, "body": why + FOOTER, "maintainer_can_modify": True})
        say(f"   pull request: {pr.get('html_url')}\n" if code < 300 else f"   couldn't open the pull request: {pr.get('message')} {pr.get('errors') or ''}\n")
    # 4. feature requests and bug reports, once each
    try:
        done = json.load(open(STATE))
    except Exception:
        done = {}
    for repo, title, words, body in ISSUES:
        full = repo if "/" in repo else f"Stremio/{repo}"
        say(f"4. {full}: {title}")
        if title in done:
            say(f"   already filed: {done[title]}\n")
            continue
        q = urllib.request.quote(f"repo:{full} is:issue in:title {words}")
        code, found = api(tok, "GET", f"/search/issues?q={q}&per_page=5")
        hits = (found or {}).get("items") or [] if code == 200 else []
        mine = [h for h in hits if h.get("title") == title]
        if mine:
            done[title] = mine[0]["html_url"]
            say(f"   already filed: {done[title]}\n")
            continue
        if hits:
            say("   someone already asked for something close; give it a 👍 instead of a duplicate:")
            for h in hits[:3]:
                say(f"     {h['title']}  {h['html_url']}")
            done[title] = hits[0]["html_url"]
            say("")
            continue
        code, r = api(tok, "POST", f"/repos/{full}/issues", {"title": title, "body": body + FOOTER})
        if code < 300:
            done[title] = r.get("html_url")
            say(f"   filed: {done[title]}\n")
        else:
            say(f"   couldn't file it: {r.get('message')}\n")
        time.sleep(3)
    try:
        json.dump(done, open(STATE, "w"), indent=1)
    except Exception:
        pass
    say("Done. Pressing 7 again only sends what's new: open pull requests and filed requests are skipped.")


if __name__ == "__main__":
    main()
