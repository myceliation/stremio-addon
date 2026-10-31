"""
Mycelium — the online version of the Watchlist server, as a Stremio add-on.
A small window that walks through it in order. Opened from the Watchlist server
window (🍄 button) or by double-clicking this file. The Watchlist server itself
is never changed by anything here.
"""
import json
import os
import re
import subprocess
import sys
import threading
import tkinter as tk
import urllib.error
import urllib.request
import webbrowser
from tkinter import messagebox, scrolledtext, simpledialog

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
SITE = "https://mycelium.myceliation.workers.dev"
LINK_FILE = os.path.join(ROOT, "data", "mycelium_link.txt")
PROGRESS = os.path.join(ROOT, "data", "mycelium_migration_progress.json")
STREMIO_EXE = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Stremio", "stremio-shell-ng.exe")
IDS = ("community.myceliation.mycelium", "community.myceliation.watchhistory")
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
NEW_CONSOLE = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
GREEN, RED, AMBER, GRAY = "#2ecc71", "#e74c3c", "#f39c12", "gray"


# ── helpers ────────────────────────────────────────────────────────────────────

def http(url, body=None, timeout=20):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET",
                                 headers={"content-type": "application/json", "user-agent": "mycelium-applet"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def console_python():
    """python.exe next to the pythonw.exe running this window (so output can be captured)."""
    exe = sys.executable
    alt = exe.replace("pythonw.exe", "python.exe")
    return alt if os.path.isfile(alt) else exe


def local_version():
    try:
        src = open(os.path.join(ROOT, "worker", "src", "manifest.js"), encoding="utf-8").read()
        return re.search(r'VERSION = "([^"]+)"', src).group(1)
    except Exception:
        return None


def read_link():
    try:
        return open(LINK_FILE, encoding="utf-8").read().strip() or None
    except FileNotFoundError:
        return None


def save_link(link):
    os.makedirs(os.path.dirname(LINK_FILE), exist_ok=True)
    with open(LINK_FILE, "w", encoding="utf-8") as f:
        f.write(link)


def parse_token(link):
    m = re.match(r"^(https?://[^/]+)/([A-Za-z0-9_-]{30,})(?:/|$)", (link or "").strip())
    return (m.group(1), m.group(2)) if m else (None, None)


def stremio_profile():
    """Stremio's own saved profile on this PC (sign-in key + installed add-ons). Read-only."""
    try:
        from companion import stremio_local
        return (stremio_local.load_state() or {}).get("profile") or {}
    except Exception:
        return {}


def stremio_api(method, body):
    j = http("https://api.strem.io/api/" + method, body)
    if j.get("error"):
        raise RuntimeError(j["error"].get("message") if isinstance(j["error"], dict) else str(j["error"]))
    return j.get("result")


# ── window ─────────────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Mycelium — online version")
        self.resizable(False, False)
        self.link = read_link()
        self._build()
        self.after(200, self.refresh)

    def _build(self):
        st = tk.LabelFrame(self, text="Status", padx=10, pady=8)
        st.pack(fill="x", padx=12, pady=(12, 4))
        self.dots, self.texts = {}, {}
        for row, (key, name) in enumerate([("site", "Online site"), ("copy", "Your copy"),
                                           ("stremio", "In Stremio"), ("sync", "History sync"), ("library", "Your library")]):
            d = tk.Label(st, text="●", font=("Segoe UI", 14), fg=GRAY)
            d.grid(row=row, column=0, padx=(0, 6))
            tk.Label(st, text=name, font=("Segoe UI", 10), width=11, anchor="w").grid(row=row, column=1, sticky="w")
            t = tk.Label(st, text="checking…", font=("Segoe UI", 9), fg="#555", anchor="w", width=46)
            t.grid(row=row, column=2, sticky="w")
            self.dots[key], self.texts[key] = d, t

        steps = tk.LabelFrame(self, text="Steps, in order", padx=10, pady=8)
        steps.pack(fill="x", padx=12, pady=4)
        self.buttons = {}
        for row, (key, label, note, cmd) in enumerate([
            ("deploy", "1  Put online", "Uploads this folder's code to the site (after changes)", self.do_deploy),
            ("copy", "2  Make my copy", "Your private copy, with its settings page", self.do_copy),
            ("stremio", "3  Add to Stremio", "Installs Mycelium + Watch History at the top", self.do_stremio),
            ("sync", "4  Sync my history", "Whatever you finish in Stremio joins Watched by itself", self.do_sync),
            ("check", "5  Check it works", "Quick check of your copy, or a full stress test", self.do_check),
            ("library", "6  Copy my library", "Optional: the Watchlist server keeps its own copy", self.do_library),
            ("publish", "7  Publish", "Stremio's Community add-ons, then GitHub (repo + bug-fix PRs)", self.do_publish),
        ]):
            b = tk.Button(steps, text=label, width=17, anchor="w", font=("Segoe UI", 10), relief="flat",
                          bg="#ecf0f1", command=cmd)
            b.grid(row=row, column=0, pady=2, sticky="w")
            tk.Label(steps, text=note, font=("Segoe UI", 9), fg="gray").grid(row=row, column=1, sticky="w", padx=(8, 0))
            self.buttons[key] = b

        util = tk.Frame(self)
        util.pack(fill="x", padx=14, pady=(4, 10))
        for text, cmd in [("⚙ Settings page", self.open_settings), ("🖥 Stremio with Mycelium", self.open_stremio_ui),
                          ("🧹 Remove add-ons…", self.remove_addons), ("↻ Refresh", self.refresh)]:
            tk.Button(util, text=text, font=("Segoe UI", 9), relief="flat", bg="#ecf0f1", fg="#555",
                      command=cmd).pack(side="left", padx=(0, 6))

    # ── status ──────────────────────────────────────────────────────────────
    def set(self, key, color, text):
        self.dots[key].config(fg=color)
        self.texts[key].config(text=text)

    def refresh(self):
        threading.Thread(target=self._refresh, daemon=True).start()

    def _refresh(self):
        ui = lambda *a: self.after(0, lambda: self.set(*a))
        want = local_version()
        try:
            live = http(SITE + "/manifest.json").get("version")
            if want and live != want:
                ui("site", AMBER, f"version {live} is live; this folder has {want}: do step 1")
            else:
                ui("site", GREEN, f"version {live} is live")
        except Exception as e:
            ui("site", RED, f"not reachable ({str(e)[:40]}): do step 1")
        self.link = read_link()
        base, token = parse_token(self.link)
        if not token:
            ui("copy", GRAY, "none yet: do step 2")
        else:
            try:
                http(f"{base}/{token}/manifest.json")
                ui("copy", GREEN, f"…{token[-8:]} (saved in data\\mycelium_link.txt)")
            except Exception:
                ui("copy", RED, "saved link doesn't answer: do step 1, or step 2 for a new copy")
        prof = stremio_profile()
        have = {(a.get("manifest") or {}).get("id"): a for a in prof.get("addons") or []}
        if not prof:
            ui("stremio", GRAY, "couldn't read Stremio on this PC")
        elif all(i in have for i in IDS):
            mine = have[IDS[0]]
            ver = (mine.get("manifest") or {}).get("version")
            note = "" if not want or ver == want else f"; Stremio has {ver}: do step 3 to update"
            ui("stremio", GREEN if not note else AMBER, "both installed" + note)
        elif any(i in have for i in IDS):
            ui("stremio", AMBER, "only one of the two installed: do step 3")
        else:
            ui("stremio", GRAY, "not installed yet: do step 3" if (prof.get("auth") or {}).get("key") else "sign in to Stremio first, then step 3")
        if token:
            try:
                on = http(f"{base}/{token}/api/history").get("connected")
                pc = False
                try:
                    sys.path.insert(0, os.path.join(ROOT, "tools"))
                    import history_sync
                    pc = history_sync.enabled()
                except Exception:
                    pass
                ui("sync", GREEN if (on or pc) else GRAY, "on: Stremio's finished titles join Watched automatically" if on
                   else "on, from this PC (every 30 min while the Watchlist server window is open)" if pc else "off: do step 4")
            except Exception:
                ui("sync", GRAY, "unknown")
        else:
            ui("sync", GRAY, "off")
        if os.path.exists(PROGRESS):
            try:
                done = json.load(open(PROGRESS))
                n = sum(v for k, v in done.items() if isinstance(v, int) and not k.startswith("_"))
                ui("library", GREEN, f"copied (about {n:,} titles sent)")
            except Exception:
                ui("library", GREEN, "copied")
        else:
            ui("library", GRAY, "not copied (optional; try it first)")

    # ── output window for long jobs ─────────────────────────────────────────
    def run_in_window(self, title, args, then=None):
        win = tk.Toplevel(self)
        win.title(title)
        win.geometry("760x480")
        txt = scrolledtext.ScrolledText(win, font=("Consolas", 9), wrap="word", relief="flat", bd=0,
                                        bg="#1a1a1a", fg="#d4d4d4")
        txt.pack(fill="both", expand=True, padx=8, pady=8)
        close = tk.Button(win, text="Close", relief="flat", command=win.destroy)
        close.pack(anchor="e", padx=8, pady=(0, 8))

        def add(line):
            txt.insert("end", line)
            txt.see("end")

        def work():
            try:
                p = subprocess.Popen(args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     text=True, encoding="utf-8", errors="replace", creationflags=NO_WINDOW,
                                     env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUNBUFFERED": "1"})
                out = []
                for line in p.stdout:
                    out.append(line)
                    self.after(0, add, line)
                p.wait()
                self.after(0, add, "\n— finished —\n")
                self.after(0, self.refresh)
                if then:
                    self.after(0, then, "".join(out), p.returncode)
            except Exception as e:
                self.after(0, add, f"\nCouldn't run it: {e}\n")
        threading.Thread(target=work, daemon=True).start()
        return win

    # ── steps ───────────────────────────────────────────────────────────────
    def do_deploy(self):
        if not messagebox.askokcancel("Put online", "This opens a console window that uploads the code in this folder "
                                      "to the Mycelium site (your Cloudflare account). It may open your browser once to "
                                      "log in.\n\nWhen it says Done, close it and click Refresh here."):
            return
        subprocess.Popen(["cmd", "/c", os.path.join(ROOT, "worker", "deploy.bat")], cwd=os.path.join(ROOT, "worker"),
                         creationflags=NEW_CONSOLE)

    def do_copy(self):
        base, token = parse_token(self.link)
        if token:
            choice = messagebox.askyesnocancel("Your copy", "You already have a copy.\n\nYes: open its settings page\n"
                                               "No: use a different link (paste one)\nCancel: nothing")
            if choice is None:
                return
            if choice:
                return self.open_settings()
            new = simpledialog.askstring("Use a different copy", "Paste a Mycelium install or settings link:", parent=self)
            if new and parse_token(new)[1]:
                b, t = parse_token(new)
                save_link(f"{b}/{t}/manifest.json")
                self.refresh()
            return
        try:
            j = http(SITE + "/api/new", {})
            save_link(f"{SITE}/{j['token']}/manifest.json")
            self.link = read_link()
            self.refresh()
            self.open_settings()
        except Exception as e:
            messagebox.showerror("Make my copy", f"The site didn't answer: {e}\n\nDo step 1 first.")

    def do_stremio(self):
        base, token = parse_token(self.link)
        if not token:
            return messagebox.showinfo("Add to Stremio", "Do step 2 first.")
        urls = [f"{base}/{token}/manifest.json", f"{base}/{token}/history/manifest.json"]
        key = (stremio_profile().get("auth") or {}).get("key")
        if not key:
            self.clipboard_clear()
            self.clipboard_append(urls[0])
            webbrowser.open("stremio://" + urls[0].split("://", 1)[1])
            return messagebox.showinfo("Add to Stremio", "Stremio on this PC isn't signed in, so it can't be added "
                                       "automatically.\n\nStremio should now show an Install button. If it doesn't, "
                                       "the link is copied: paste it into the search box in Stremio's Add-ons page.")
        try:
            # the microgenre list changed since titles were last sorted: re-sort them all from this PC's TMDB details (quick)
            ver = (http(f"{base}/manifest.json", timeout=30) or {}).get("version")
            mark = os.path.join(ROOT, "data", "mycelium_retagged.txt")
            if ver and (not os.path.exists(mark) or open(mark).read().strip() != ver):
                sys.path.insert(0, os.path.join(ROOT, "tools"))
                import retag_microgenres
                retag_microgenres.run(base, token, say=lambda m: None)
                open(mark, "w").write(ver)
            # newly added titles get sorted into microgenres first, so the lists' Microgenre dropdown is current
            for _ in range(20):
                if http(f"{base}/{token}/api/mg-fill", {}, timeout=60).get("done"):
                    break
            http(f"{base}/{token}/api/mg-stats", {}, timeout=60)
        except Exception:
            pass
        try:
            # the Library's "import" dropdown: one entry per batch the offline tool imported (data\import_batches.json)
            bf = os.path.join(ROOT, "data", "import_batches.json")
            if os.path.isfile(bf):
                http(f"{base}/{token}/api/batches", {"batches": json.load(open(bf, encoding="utf-8"))}, timeout=30)
        except Exception:
            pass
        report = []      # (name, url, status) for every add-on this copy should have
        try:
            # Mycelium, Watch History, and the extra service add-ons (so every streaming service fits)
            try:
                urls = http(f"{base}/{token}/api/addons")
            except Exception:
                pass
            fresh = []
            for u in urls:
                try:
                    m = http(u)
                    fresh.append({"transportUrl": u, "manifest": m, "flags": {"official": False, "protected": False}})
                except Exception as e:
                    report.append((u.rsplit("/" + token + "/", 1)[-1], u, f"✖ couldn't load it from the site ({e})"))
            addons = (stremio_api("addonCollectionGet", {"type": "AddonCollectionGet", "authKey": key, "update": True}) or {}).get("addons") or []
            mine = lambda a: (a.get("manifest") or {}).get("id", "") in IDS or (a.get("manifest") or {}).get("id", "").startswith(IDS[0] + ".")
            rest = [a for a in addons if not mine(a)]
            removed = [(a.get("manifest") or {}).get("name") for a in addons if mine(a)
                       and a.get("transportUrl") not in {f["transportUrl"] for f in fresh}]
            refused = []
            while True:
                try:
                    stremio_api("addonCollectionSet", {"type": "AddonCollectionSet", "authKey": key, "addons": fresh + rest})
                    break
                except Exception as e:
                    # if Stremio won't take that many, drop service packs from the end until it does
                    if "descriptor" not in str(e).lower() or len(fresh) <= 2:
                        raise
                    refused.insert(0, fresh.pop())
            # read it back from Stremio to confirm what actually landed
            after = (stremio_api("addonCollectionGet", {"type": "AddonCollectionGet", "authKey": key, "update": True}) or {}).get("addons") or []
            got = {a.get("transportUrl"): (a.get("manifest") or {}).get("version") for a in after}
        except Exception as e:
            hint = ("\n\nThe live Mycelium description is too big for Stremio. Do step 1 (Put online) to upload "
                    "the smaller version, then step 3 again." if "descriptor" in str(e).lower() else "")
            return messagebox.showerror("Add to Stremio", f"Stremio's server said: {e}{hint}\n\nNothing in Stremio was changed.")
        for f in fresh:
            m = f["manifest"]
            rows = len(m.get("catalogs") or [])
            ok = got.get(f["transportUrl"]) == m.get("version")
            report.append((m.get("name"), f["transportUrl"], (f"✔ installed, version {m.get('version')}, {rows} rows" if ok
                           else "✖ sent, but Stremio doesn't list it")))
        for f in refused:
            report.append((f["manifest"].get("name"), f["transportUrl"], "✖ Stremio refused it (account size limit)"))
        services = sum(1 for f in fresh if got.get(f["transportUrl"]) for c in (f["manifest"].get("catalogs") or [])
                       if c.get("id", "").startswith("prov.")) // 2
        ok_n = sum(1 for r in report if r[2].startswith("✔"))
        lines = [f"{ok_n} of {len(report)} add-ons installed or updated, at the top of your add-ons.",
                 f"Streaming services with their own rows: {services} of {len((self._settings() or {}).get('providers') or [])}.", ""]
        lines += [f"{st[:1]}  {name}\n     {st[2:]}" for name, url, st in report]
        if removed:
            lines += ["", "Removed (no longer needed): " + ", ".join(n or "?" for n in removed)]
        lines += ["", "Click into Stremio's window (or restart it) to see them."]
        self.show_report("Add to Stremio — result", "\n".join(lines))
        self.after(1500, self.refresh)

    def do_sync(self):
        base, token = parse_token(self.link)
        if not token:
            return messagebox.showinfo("Sync my history", "Do step 2 first.")
        api = f"{base}/{token}/api/"
        auth = (stremio_profile().get("auth") or {})
        local_key, local_email = auth.get("key"), ((auth.get("user") or {}).get("email") or "")

        def use_local(text):
            win, status = self._sync_window(text)
            threading.Thread(target=lambda: self._after_key(api, local_key, win, status), daemon=True).start()
        try:
            st = http(api + "history", timeout=30)
            if st.get("connected"):
                acct = st.get("account") or "?"
                if local_key and local_email and acct.lower() != local_email.lower():
                    if messagebox.askyesno("Sync my history", f"Mycelium is linked to the Stremio account {acct},\n"
                                           f"but Stremio on this PC is signed in as {local_email}.\n\nSwitch Mycelium to {local_email}?"):
                        return use_local(f"Switching to {local_email}…")
                    return
                return messagebox.showinfo("Sync my history", f"Already on, linked to the Stremio account {acct}.\n\n"
                                           "Everything you finish in Stremio joins Watched, and Stremio's Like / Love buttons fill "
                                           "Liked / Loved (checked whenever a row loads, at most every 10 minutes). Marking something "
                                           "watched, liked or loved in Mycelium is copied back to Stremio.\n\n"
                                           "To turn it off, use Disconnect on the settings page.")
            if local_key and local_email and messagebox.askyesno("Sync my history",
                    f"Use the Stremio account signed in on this PC ({local_email})?\n\nNo: approve a different account with a code instead."):
                return use_local(f"Connecting {local_email}…")
            # the code login runs from this PC (Stremio's code service doesn't answer Cloudflare's servers)
            j = http("https://link.stremio.com/api/v2/create?type=Create")
            j = j.get("result") or j
        except Exception as e:
            return messagebox.showerror("Sync my history", f"Couldn't reach Stremio: {e}")
        if not j.get("code"):
            return messagebox.showerror("Sync my history", "Stremio didn't hand out a code. Try again in a minute.")
        win = tk.Toplevel(self)
        win.title("Sync my history")
        win.resizable(False, False)
        tk.Label(win, text="Stremio needs to approve this once. On the page that opens, sign in to Stremio if asked,\n"
                 "check that it shows this code, and approve:", font=("Segoe UI", 9), justify="left").pack(padx=14, pady=(12, 6), anchor="w")
        tk.Label(win, text=j["code"], font=("Consolas", 22, "bold")).pack(pady=4)
        status = tk.Label(win, text="Waiting for you to approve…", font=("Segoe UI", 9), fg="gray", wraplength=460, justify="left")
        status.pack(pady=(4, 6), padx=14)
        link = j.get("link") or f"https://link.stremio.com/{j['code']}"
        tk.Button(win, text="Open the approval page again", relief="flat", bg="#ecf0f1",
                  command=lambda: webbrowser.open(link)).pack(pady=(0, 12))
        webbrowser.open(link)
        say = lambda text, color="black": self.after(0, lambda: status.config(text=text, fg=color))

        def poll():
            import time
            key, t0 = None, time.time()
            while time.time() - t0 < 600 and not key:
                time.sleep(3)
                try:
                    r = http("https://link.stremio.com/api/v2/read?type=Read&code=" + urllib.request.quote(j["code"]))
                    r = r.get("result") or {}
                    key = r.get("authKey") or (r.get("auth") or {}).get("key")
                except Exception:
                    pass
            if not key:
                return say("The code expired. Close this and try again.", "red")
            self._after_key(api, key, win, status)
        threading.Thread(target=poll, daemon=True).start()


    def _sync_window(self, text):
        win = tk.Toplevel(self)
        win.title("Sync my history")
        win.resizable(False, False)
        status = tk.Label(win, text=text, font=("Segoe UI", 9), wraplength=460, justify="left")
        status.pack(pady=14, padx=14)
        return win, status

    def _after_key(self, api, key, win, status):
        """Hand the Stremio key to Mycelium, then read the history and sort it (runs on a worker thread)."""
        say = lambda text, color="black": self.after(0, lambda: status.config(text=text, fg=color))
        say("Approved. Connecting your Mycelium…")
        try:
            c = http(api + "history/connect", {"authKey": key}, timeout=60)
        except Exception as e:
            c = {"error": str(e)}
        if not c.get("connected"):
            return self.after(0, lambda: self.pc_sync_fallback(win, status, c.get("error")))
        say("Connected. Reading your Stremio history…")
        r = {}
        for _ in range(40):
            try:
                r = http(api + "warm", timeout=60)
            except Exception as e:
                r = {"error": str(e)}
                break
            if r.get("complete") or r.get("error"):
                break
        if r.get("error"):
            return say(f"Connected, but reading failed: {r['error']}", "red")
        say(f"{r.get('titles', 0):,} titles in your Stremio library; the finished ones are in Watched. "
            "Sorting your saved titles into microgenres…")
        n = 0
        for _ in range(600):                      # 5 titles per call
            try:
                f = http(api + "mg-fill", {}, timeout=60)
            except Exception:
                break
            n += f.get("filled", 0)
            if f.get("done"):
                break
            say(f"Sorting your saved titles into microgenres… {n:,} so far")
        try:
            http(api + "mg-stats", {}, timeout=60)
        except Exception:
            pass
        say(f"Done: {r.get('titles', 0):,} titles in your Stremio library; the finished ones are in Watched and sorted "
            "into microgenres. New ones will follow automatically.")
        self.after(0, self.refresh)

    def pc_sync_fallback(self, win, status, err):
        """Mycelium's server can't reach Stremio's account service, so this PC does the syncing instead."""
        sys.path.insert(0, os.path.join(ROOT, "tools"))
        import history_sync
        status.config(text=f"Mycelium's server can't reach Stremio's account service ({(err or '')[:80]}).\n\n"
                      "So this PC will do it instead: the Watchlist server window copies whatever you finish in Stremio "
                      "into Watched every 30 minutes while it's open (it can start with Windows). Copying now…", fg="black")
        history_sync.set_enabled(True)

        def run():
            try:
                n = history_sync.sync_once()
                self.after(0, lambda: status.config(text=f"Done: {n:,} finished titles copied to Watched. From now on the Watchlist "
                                                    "server window keeps it in sync every 30 minutes while it's open."))
            except Exception as e:
                self.after(0, lambda: status.config(text=f"Couldn't copy: {e}", fg="red"))
            self.after(0, self.refresh)
        threading.Thread(target=run, daemon=True).start()

    def do_check(self):
        if not parse_token(self.link)[1]:
            return messagebox.showinfo("Check", "Do step 2 first.")
        full = messagebox.askyesnocancel("Check it works", "Yes: full stress test. A temporary copy with every option on: "
                                         "every row and dropdown option, every kind of import, Watch History, sharing and exports "
                                         "(about 10 minutes; your own copy isn't touched).\n\nNo: quick check of your own copy (about 1 minute).")
        if full is None:
            return
        if full:
            self.run_in_window("Stress test — Mycelium", [console_python(), "-u", os.path.join(ROOT, "stress_mycelium.py"), SITE])
        else:
            self.run_in_window("Check — Mycelium", [console_python(), "-u", os.path.join(ROOT, "check_mycelium.py"), self.link])

    def do_library(self):
        if not parse_token(self.link)[1]:
            return messagebox.showinfo("Copy my library", "Do step 2 first.")
        script = os.path.join(ROOT, "migrate_to_mycelium.py")

        def after_preview(out, code):
            if code != 0:
                return
            if messagebox.askyesno("Copy my library", "That's what would be copied (see the window).\n\nCopy it now? "
                                   "The Watchlist server keeps its own copy; nothing there changes."):
                self.run_in_window("Copying your library", [console_python(), "-u", script, self.link])
        self.run_in_window("Preview — nothing is sent", [console_python(), "-u", script, self.link, "--dry-run"], then=after_preview)

    def do_publish(self):
        listing = messagebox.askyesno("Publish", "List Mycelium in Stremio's public Community add-ons (or refresh its listing)?\n\n"
                                      "If it's already listed you can say No: the listing points at your live site, so step 1 "
                                      "already updates what everyone gets.\n\n(GitHub is asked next either way.)")
        out = []
        import time
        for n, (name, path) in enumerate([("Mycelium", "/manifest.json")] if listing else []):
            if n:
                time.sleep(5)                     # Stremio answers 429 to two submissions in a row
            for attempt in range(4):
                try:
                    j = http("https://api.strem.io/api/addonPublish", {"transportUrl": SITE + path, "transportName": "http"})
                    out.append(f"{name}: " + ("refused — " + json.dumps(j["error"]) if j.get("error") else "submitted"))
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 429 and attempt < 3:
                        time.sleep(20 * (attempt + 1))
                        continue
                    out.append(f"{name}: failed — {e}")
                    break
                except Exception as e:
                    out.append(f"{name}: failed — {e}")
                    break
        if out:
            messagebox.showinfo("Publish", "\n".join(out) + "\n\nIt appears under Add-ons → Community once Stremio lists it.")
        if messagebox.askyesno("Publish to GitHub", "Publish on GitHub now?\n\n• this folder as github.com/myceliation/stremio-addon "
                               "(your library, data, keys and logs stay out): updated every time\n• the Stremio bug fixes as pull requests, "
                               "and the feature requests (all dropdowns on phones and TVs, hiding the Calendar, …): only ones not sent "
                               "before, and not ones someone else already asked for\n\nUses the GitHub login Windows already has saved for git."):
            self.run_in_window("Publishing to GitHub", [console_python(), "-u", os.path.join(ROOT, "tools", "github_publish.py")])

    def _settings(self):
        base, token = parse_token(self.link)
        try:
            return http(f"{base}/{token}/api/settings").get("settings")
        except Exception:
            return None

    def show_report(self, title, text):
        win = tk.Toplevel(self)
        win.title(title)
        win.geometry("640x460")
        txt = scrolledtext.ScrolledText(win, font=("Segoe UI", 10), wrap="word", relief="flat", bd=0)
        txt.pack(fill="both", expand=True, padx=10, pady=10)
        txt.insert("1.0", text)
        txt.config(state="disabled")
        tk.Button(win, text="Close", relief="flat", command=win.destroy).pack(anchor="e", padx=10, pady=(0, 10))

    def remove_addons(self):
        """Tick add-ons to take out of Stremio (on every device). The Watchlist server's own add-on is pre-ticked."""
        key = (stremio_profile().get("auth") or {}).get("key")
        if not key:
            return messagebox.showinfo("Remove add-ons", "Stremio on this PC isn't signed in. Remove add-ons in Stremio's Add-ons page instead.")
        try:
            addons = (stremio_api("addonCollectionGet", {"type": "AddonCollectionGet", "authKey": key, "update": True}) or {}).get("addons") or []
        except Exception as e:
            return messagebox.showerror("Remove add-ons", f"Couldn't read your add-ons from Stremio: {e}")
        old = lambda a: re.match(r"https?://(localhost|127\.0\.0\.1)(:\d+)?/", a.get("transportUrl", "")) or \
            (a.get("manifest") or {}).get("id", "").startswith("community.stremio.custom.")
        # catalog add-ons whose rows Mycelium already covers (ticked as suggestions; nothing goes without the confirm box)
        COVERED = {"tmdb-addon": "Mycelium's All films/series, Popular and streaming rows cover it",
                   "org.imdbcatalogs": "covered by Mycelium's Popular / Newest / Top rated sorts",
                   "pw.ers.netflix-catalog": "covered by Mycelium's streaming-service rows, any region",
                   "org.stremio.customlistspro": "Mycelium's named lists replace it (it has no rows)",
                   "community.omnicatalogs.stremio.addon": "has no rows",
                   "org.stremio.cinemeta-catalogs-halloweenpopular": "covered by Mycelium's Halloween microgenres",
                   "community.myceliation.watchhistory": "Stremio now shows what you've watched by itself; Mycelium keeps syncing it "
                                                         "(turn the add-on back on under Rows in Mycelium's settings if you miss it)"}
        def covered(a):
            mid = (a.get("manifest") or {}).get("id", "")
            if mid in COVERED: return COVERED[mid]
            if mid.startswith("com.stremio.imdblist.") and "People" not in (a.get("manifest") or {}).get("name", ""):
                return "an IMDb list row: covered by Mycelium's sorts (or import the list into Mycelium)"
            return ""
        seen_ids = set()
        def dupe(a):
            mid = (a.get("manifest") or {}).get("id", "")
            d = mid in seen_ids
            seen_ids.add(mid)
            return d
        win = tk.Toplevel(self)
        win.title("Remove add-ons from Stremio")
        win.geometry("560x520")
        tk.Label(win, text="Ticked add-ons are removed from Stremio on every device signed in to your account.\n"
                 "Ticked for you: the Watchlist server's old add-on, anything installed twice, and catalog add-ons Mycelium covers.\n"
                 "Untick anything you want to keep. Stream and subtitle add-ons are never suggested. Stremio's built-in ones aren't listed.",
                 font=("Segoe UI", 9), justify="left").pack(anchor="w", padx=12, pady=(10, 6))
        box = scrolledtext.ScrolledText(win, relief="flat", bd=0, cursor="arrow")
        box.pack(fill="both", expand=True, padx=12)
        rows = []
        for a in addons:
            m = a.get("manifest") or {}
            if (a.get("flags") or {}).get("protected") or (a.get("flags") or {}).get("official"):
                continue
            dup, cov = dupe(a), covered(a)
            v = tk.BooleanVar(value=bool(old(a)) or dup or bool(cov))
            note = "  ← Watchlist server (old)" if old(a) else ("  (Mycelium; step 3 puts it back)" if m.get("id", "").startswith(IDS[0]) or m.get("id") in IDS
                    else "  ← installed twice" if dup else f"  ← suggested: {cov}" if cov else "")
            cb = tk.Checkbutton(box, text=f"{m.get('name', '?')}{note}", variable=v, font=("Segoe UI", 9), bg="white", anchor="w")
            box.window_create("end", window=cb)
            box.insert("end", "\n")
            rows.append((a, v))
        box.config(state="disabled")

        def go():
            drop = [a for a, v in rows if v.get()]
            if not drop:
                return win.destroy()
            names = "\n".join("• " + (a.get("manifest") or {}).get("name", "?") for a in drop)
            if not messagebox.askyesno("Remove add-ons", f"Remove these from Stremio?\n\n{names}", parent=win):
                return
            keep = [a for a in addons if a not in drop]
            try:
                stremio_api("addonCollectionSet", {"type": "AddonCollectionSet", "authKey": key, "addons": keep})
                after = {x.get("transportUrl") for x in (stremio_api("addonCollectionGet", {"type": "AddonCollectionGet", "authKey": key, "update": True}) or {}).get("addons") or []}
            except Exception as e:
                return messagebox.showerror("Remove add-ons", f"Stremio's server said: {e}\n\nNothing was changed.", parent=win)
            gone = [a for a in drop if a.get("transportUrl") not in after]
            win.destroy()
            self.show_report("Remove add-ons — result", f"Removed {len(gone)} of {len(drop)}:\n\n" +
                             "\n".join(("✔ " if a in gone else "✖ ") + (a.get("manifest") or {}).get("name", "?") for a in drop) +
                             "\n\nClick into Stremio's window (or restart it) to see the change. The Watchlist server itself keeps "
                             "running and keeps its data; to get its add-on back, install it again from its companion page (localhost:7001).")
            self.after(1500, self.refresh)
        bar = tk.Frame(win)
        bar.pack(fill="x", padx=12, pady=10)
        tk.Button(bar, text="Remove ticked", bg="#e74c3c", fg="white", font=("Segoe UI", 10, "bold"), relief="flat", command=go).pack(side="left")
        tk.Button(bar, text="Cancel", relief="flat", command=win.destroy).pack(side="right")

    # ── utilities ───────────────────────────────────────────────────────────
    def open_settings(self):
        base, token = parse_token(self.link)
        webbrowser.open(f"{base}/{token}/configure" if token else SITE + "/configure")

    def open_stremio_ui(self):
        if not os.path.isfile(STREMIO_EXE):
            return messagebox.showerror("Stremio", f"Stremio isn't installed at\n{STREMIO_EXE}")
        running = "stremio-shell-ng.exe" in subprocess.run(["tasklist", "/fi", "imagename eq stremio-shell-ng.exe"],
                                                            capture_output=True, text=True, creationflags=NO_WINDOW).stdout
        if running and not messagebox.askyesno("Stremio is open", "Stremio is already running, and it can only load "
                                               "the Mycelium interface when it starts.\n\nClose Stremio and reopen it with Mycelium?"):
            return
        if running:
            subprocess.run(["taskkill", "/im", "stremio-shell-ng.exe", "/f"], capture_output=True, creationflags=NO_WINDOW)
            import time
            time.sleep(2)
        # hand the interface this PC's Mycelium link, so its buttons work before you sign in there
        url = f"{SITE}/ui/"
        try:
            base, token = parse_token(self.link or read_link())
            if token:
                url += "?myc=" + token
        except Exception:
            pass
        subprocess.Popen([STREMIO_EXE, f"--webui-url={url}"], creationflags=NO_WINDOW)
        messagebox.showinfo("Stremio with Mycelium", "Stremio is opening with the Mycelium interface.\n\n"
                            "The first time: sign in to Stremio inside it (it keeps its own sign-in, separate from normal Stremio). "
                            "After that your library, add-ons and Mycelium rows appear.\n\n"
                            "Playing videos doesn't work in this interface: Stremio's streaming server only plays for Stremio's own "
                            "web pages. Use normal Stremio to watch; use this one for browsing, lists and history.")


if __name__ == "__main__":
    App().mainloop()
