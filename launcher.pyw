"""
Stremio Suite Launcher
Double-click to open. Stays in taskbar. Manages both servers.
"""
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import subprocess
import threading
import socket
import os
import sys
import re
import winreg
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "config.py")
STARTUP_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"

def _find_python():
    """Return the path to whichever python.exe has flask + uvicorn installed."""
    # Build a list of candidate pythons to probe
    candidates = []

    # 1. Every 'python' entry visible in PATH (via where.exe)
    try:
        r = subprocess.run(
            ["where", "python"],
            capture_output=True, text=True,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        for line in r.stdout.splitlines():
            p = line.strip()
            if p and p.endswith(".exe") and os.path.isfile(p):
                candidates.append(p)
    except Exception:
        pass

    # 2. Common conda / Anaconda / venv roots
    home = os.path.expanduser("~")
    conda_roots = [
        os.path.join(home, "miniconda3"),
        os.path.join(home, "miniconda"),
        os.path.join(home, "anaconda3"),
        os.path.join(home, "anaconda"),
        r"C:\ProgramData\miniconda3",
        r"C:\ProgramData\Anaconda3",
        r"C:\miniconda3",
        r"C:\Anaconda3",
    ]
    for root in conda_roots:
        candidates.append(os.path.join(root, "python.exe"))
        envs = os.path.join(root, "envs")
        if os.path.isdir(envs):
            for env in os.listdir(envs):
                candidates.append(os.path.join(envs, env, "python.exe"))

    # 3. sys.executable itself (the Python running this launcher)
    candidates.append(sys.executable)

    seen = set()
    for py in candidates:
        py = os.path.normpath(py)
        if py in seen or not os.path.isfile(py):
            continue
        seen.add(py)
        try:
            r = subprocess.run(
                [py, "-c", "import flask, uvicorn, httpx; print('ok')"],
                capture_output=True, text=True, timeout=6,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            if r.stdout.strip() == "ok":
                return py
        except Exception:
            continue

    return None   # nothing found — caller will show an error

# Cached at start so start_servers doesn't re-probe every time
_PYTHON = _find_python()
STARTUP_NAME = "StremioSuite"
STARTUP_CMD = f'"{sys.executable}" "{os.path.join(ROOT, "launcher.pyw")}" --minimized'

# ── Helpers ────────────────────────────────────────────────────────────────────

def port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except Exception:
        return False

def kill_port(port):
    # Find PIDs listening on the port and kill them
    result = subprocess.run(
        ["netstat", "-aon"], capture_output=True, text=True,
        creationflags=subprocess.CREATE_NO_WINDOW
    )
    for line in result.stdout.splitlines():
        if f":{port} " in line and "LISTENING" in line:
            parts = line.split()
            pid = parts[-1]
            subprocess.run(["taskkill", "/f", "/pid", pid],
                           capture_output=True,
                           creationflags=subprocess.CREATE_NO_WINDOW)

def start_servers():
    import time
    if not _PYTHON:
        messagebox.showerror(
            "Python not found",
            "Could not find a Python installation with flask, uvicorn, and httpx.\n\n"
            "Make sure your conda/venv environment is active and the packages are\n"
            "installed, then restart this launcher.\n\n"
            "Quick fix:\n"
            "  pip install flask uvicorn httpx",
        )
        return
    try:
        os.makedirs(os.path.join(ROOT, "logs"), exist_ok=True)
        kill_port(7000)
        kill_port(7001)
        time.sleep(1)

        flags      = subprocess.CREATE_NO_WINDOW
        addon_path = os.path.join(ROOT, "run_addon.py")
        comp_path  = os.path.join(ROOT, "run_companion.py")

        subprocess.Popen(
            [_PYTHON, addon_path],
            cwd=ROOT, creationflags=flags,
        )
        time.sleep(3)
        subprocess.Popen(
            [_PYTHON, comp_path],
            cwd=ROOT, creationflags=flags,
        )

    except Exception as e:
        messagebox.showerror("Start failed", str(e))

def stop_servers():
    kill_port(7000)
    kill_port(7001)

def read_config():
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"# Error reading config: {e}"

def write_config(text):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        f.write(text)

def get_startup():
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_KEY)
        val, _ = winreg.QueryValueEx(key, STARTUP_NAME)
        winreg.CloseKey(key)
        return True
    except Exception:
        return False

def set_startup(enable):
    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_KEY, 0, winreg.KEY_SET_VALUE)
    if enable:
        winreg.SetValueEx(key, STARTUP_NAME, 0, winreg.REG_SZ, STARTUP_CMD)
    else:
        try:
            winreg.DeleteValue(key, STARTUP_NAME)
        except FileNotFoundError:
            pass
    winreg.CloseKey(key)

def create_shortcuts():
    """Create 'Watchlist server' shortcut on Desktop and in Start Menu via PowerShell."""
    # Use the same Python that successfully runs the servers
    base = _PYTHON or sys.executable
    pythonw = base.replace("python.exe", "pythonw.exe")
    if not os.path.isfile(pythonw):
        pythonw = base  # fall back to python.exe if no pythonw sibling
    launcher = os.path.join(ROOT, "launcher.pyw")
    # icon: use shell32 icon 162 (screen/monitor) — widely available on all Windows
    icon = r"%SystemRoot%\system32\shell32.dll,162"

    ps_script = f"""
$WS   = New-Object -ComObject WScript.Shell
$locs = @(
    [Environment]::GetFolderPath('Desktop'),
    [Environment]::GetFolderPath('Programs')
)
foreach ($loc in $locs) {{
    $sc = $WS.CreateShortcut("$loc\\Watchlist server.lnk")
    $sc.TargetPath       = '{pythonw}'
    $sc.Arguments        = '"{launcher}"'
    $sc.WorkingDirectory = '{ROOT}'
    $sc.Description      = 'Watchlist server'
    $sc.IconLocation     = '{icon}'
    $sc.Save()
}}
Write-Output 'OK'
"""
    result = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
        capture_output=True, text=True,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    if "OK" in result.stdout:
        messagebox.showinfo(
            "Shortcut created",
            "Done!\n\n"
            "• Desktop shortcut: Watchlist server\n"
            "• Start Menu: searchable as 'Watchlist server'\n\n"
            "Double-clicking it opens this launcher.",
        )
    else:
        messagebox.showerror("Error", result.stderr or result.stdout or "PowerShell returned no output.")

# ── Main window ────────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self, start_minimized=False):
        super().__init__()
        self.title("Stremio Suite")
        self.resizable(False, False)
        self.protocol("WM_DELETE_WINDOW", self.on_close)

        self._build_ui()
        self._poll()

        if start_minimized:
            self.after(100, self.iconify)

    def _build_ui(self):
        PAD = dict(padx=12, pady=6)

        # ── Status section ─────────────────────────────────────────────────────
        frame_status = tk.LabelFrame(self, text="Server Status", padx=10, pady=8)
        frame_status.pack(fill="x", padx=12, pady=(12, 4))

        self.dot_addon = tk.Label(frame_status, text="●", font=("Segoe UI", 14), fg="gray")
        self.dot_addon.grid(row=0, column=0, padx=(0, 6))
        tk.Label(frame_status, text="Addon  (port 7000)", font=("Segoe UI", 10)).grid(row=0, column=1, sticky="w")

        self.dot_comp = tk.Label(frame_status, text="●", font=("Segoe UI", 14), fg="gray")
        self.dot_comp.grid(row=1, column=0, padx=(0, 6))
        tk.Label(frame_status, text="Companion  (port 7001)", font=("Segoe UI", 10)).grid(row=1, column=1, sticky="w")

        # ── Buttons ────────────────────────────────────────────────────────────
        frame_btns = tk.Frame(self)
        frame_btns.pack(fill="x", padx=12, pady=4)

        tk.Button(frame_btns, text="▶  Start", width=10, bg="#2ecc71", fg="white",
                  font=("Segoe UI", 10, "bold"), relief="flat",
                  command=self.on_start).pack(side="left", padx=(0, 6))

        tk.Button(frame_btns, text="■  Stop", width=10, bg="#e74c3c", fg="white",
                  font=("Segoe UI", 10, "bold"), relief="flat",
                  command=self.on_stop).pack(side="left", padx=(0, 6))

        tk.Button(frame_btns, text="↺  Restart", width=10, bg="#3498db", fg="white",
                  font=("Segoe UI", 10, "bold"), relief="flat",
                  command=self.on_restart).pack(side="left")

        # ── Open companion ─────────────────────────────────────────────────────
        tk.Button(self, text="🌐  Open Companion  →  localhost:7001",
                  font=("Segoe UI", 10), relief="flat", bg="#ecf0f1",
                  command=lambda: webbrowser.open("http://localhost:7001")
                  ).pack(fill="x", padx=12, pady=(4, 2))

        # ── Settings button ────────────────────────────────────────────────────
        tk.Button(self, text="⚙  Edit Settings (config.py)",
                  font=("Segoe UI", 10), relief="flat", bg="#ecf0f1",
                  command=self.open_settings
                  ).pack(fill="x", padx=12, pady=(2, 4))

        # ── Startup toggle ─────────────────────────────────────────────────────
        self.startup_var = tk.BooleanVar(value=get_startup())
        tk.Checkbutton(self, text="Launch automatically at Windows startup",
                       variable=self.startup_var, font=("Segoe UI", 9),
                       command=self.toggle_startup
                       ).pack(anchor="w", padx=14, pady=(0, 4))

        # ── Utility buttons ────────────────────────────────────────────────────
        frame_util = tk.Frame(self)
        frame_util.pack(fill="x", padx=14, pady=(0, 10))

        tk.Button(frame_util, text="📋 View Logs",
                  font=("Segoe UI", 9), relief="flat", bg="#ecf0f1", fg="#555",
                  command=self.show_logs).pack(side="left", padx=(0, 6))

        tk.Button(frame_util, text="📌 Create Shortcut",
                  font=("Segoe UI", 9), relief="flat", bg="#ecf0f1", fg="#555",
                  command=create_shortcuts).pack(side="left", padx=(0, 6))

        tk.Button(frame_util, text="🐍 Which Python?",
                  font=("Segoe UI", 9), relief="flat", bg="#ecf0f1", fg="#555",
                  command=lambda: messagebox.showinfo(
                      "Python in use",
                      f"Using:\n{_PYTHON or '(not found — Start will show error)'}"
                  )).pack(side="left")

    # ── Status polling ─────────────────────────────────────────────────────────

    def _poll(self):
        addon_up = port_open(7000)
        comp_up  = port_open(7001)
        self.dot_addon.config(fg="#2ecc71" if addon_up else "#e74c3c")
        self.dot_comp.config( fg="#2ecc71" if comp_up  else "#e74c3c")
        self.after(3000, self._poll)

    # ── Actions ────────────────────────────────────────────────────────────────

    def on_start(self):
        threading.Thread(target=start_servers, daemon=True).start()

    def on_stop(self):
        threading.Thread(target=stop_servers, daemon=True).start()

    def on_restart(self):
        def _do():
            stop_servers()
            import time; time.sleep(1)
            start_servers()
        threading.Thread(target=_do, daemon=True).start()

    def toggle_startup(self):
        set_startup(self.startup_var.get())

    def on_close(self):
        self.destroy()

    def show_logs(self):
        win = tk.Toplevel(self)
        win.title("Server Logs")
        win.geometry("760x500")

        nb = ttk.Notebook(win)
        nb.pack(fill="both", expand=True, padx=8, pady=8)

        for label, fname in [("Addon (7000)", "addon.log"), ("Companion (7001)", "companion.log")]:
            frame = tk.Frame(nb)
            nb.add(frame, text=label)
            txt = scrolledtext.ScrolledText(frame, font=("Consolas", 9), wrap="none",
                                            relief="flat", bd=0, bg="#1a1a1a", fg="#d4d4d4")
            txt.pack(fill="both", expand=True)
            path = os.path.join(ROOT, "logs", fname)
            try:
                with open(path, encoding="utf-8", errors="replace") as f:
                    content = f.read()
                txt.insert("1.0", content or "(empty — server may not have started yet)")
            except FileNotFoundError:
                txt.insert("1.0", f"(no log file yet — click Start first)\nExpected: {path}")
            txt.config(state="disabled")

    # ── Settings window ────────────────────────────────────────────────────────

    def open_settings(self):
        win = tk.Toplevel(self)
        win.title("Settings — config.py")
        win.geometry("680x520")

        tk.Label(win, text="Edit config.py directly. Save to apply on next server restart.",
                 font=("Segoe UI", 9), fg="gray").pack(anchor="w", padx=10, pady=(8, 2))

        editor = scrolledtext.ScrolledText(win, font=("Consolas", 10), wrap="none",
                                           undo=True, relief="flat", bd=1)
        editor.pack(fill="both", expand=True, padx=10, pady=4)
        editor.insert("1.0", read_config())

        btn_frame = tk.Frame(win)
        btn_frame.pack(fill="x", padx=10, pady=(0, 8))

        def save():
            write_config(editor.get("1.0", "end-1c"))
            messagebox.showinfo("Saved", "config.py saved.\nRestart servers to apply changes.", parent=win)

        tk.Button(btn_frame, text="💾  Save", bg="#2ecc71", fg="white",
                  font=("Segoe UI", 10, "bold"), relief="flat",
                  command=save).pack(side="left", padx=(0, 8))

        tk.Button(btn_frame, text="↺  Restart servers now", bg="#3498db", fg="white",
                  font=("Segoe UI", 10, "bold"), relief="flat",
                  command=lambda: [save(), self.on_restart()]).pack(side="left")

        tk.Button(btn_frame, text="Cancel", relief="flat",
                  command=win.destroy).pack(side="right")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    minimized = "--minimized" in sys.argv
    app = App(start_minimized=minimized)
    app.mainloop()
