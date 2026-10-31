"""Minimal qBittorrent Web UI (API v2) client for the Torrents tab."""
from __future__ import annotations

import httpx

import config as C


class QbtError(Exception):
    pass


class Qbt:
    def __init__(self):
        self.base = C.QBT_URL.rstrip("/")
        self.cl = httpx.Client(timeout=8, headers={"Referer": self.base})
        self._logged = False

    def _login(self):
        if self._logged:
            return
        try:
            r = self.cl.post(f"{self.base}/api/v2/auth/login",
                             data={"username": C.QBT_USERNAME, "password": C.QBT_PASSWORD})
        except httpx.HTTPError as e:
            raise QbtError(f"Can't reach qBittorrent Web UI at {self.base} ({type(e).__name__}).")
        if r.status_code == 403:
            raise QbtError("qBittorrent refused the login (too many failed attempts — wait or restart it).")
        if r.text.strip() != "Ok." and not self.cl.cookies:
            raise QbtError("qBittorrent login failed — check QBT_USERNAME / QBT_PASSWORD in .env.")
        self._logged = True

    def get(self, path: str, **params):
        self._login()
        r = self.cl.get(f"{self.base}/api/v2/{path}", params=params)
        r.raise_for_status()
        return r.json() if "json" in r.headers.get("content-type", "") else r.text

    def post(self, path: str, **data):
        self._login()
        r = self.cl.post(f"{self.base}/api/v2/{path}", data=data)
        if r.status_code == 404:
            raise FileNotFoundError(path)
        r.raise_for_status()
        return r.text

    # convenience
    def info(self):
        return {"version": self.get("app/version"), "torrents": self.get("torrents/info", sort="added_on", reverse="true"),
                "transfer": self.get("transfer/info")}

    def add(self, magnet: str, category: str = "", paused: bool = False):
        data = {"urls": magnet}
        if category:
            data["category"] = category
        if paused:
            data["paused"] = "true"
            data["stopped"] = "true"
        return self.post("torrents/add", **data)

    def action(self, act: str, hashes: str, delete_files: bool = False):
        # qBittorrent 5 renamed pause/resume to stop/start
        alias = {"pause": ("stop", "pause"), "resume": ("start", "resume")}
        if act in alias:
            for name in alias[act]:
                try:
                    return self.post(f"torrents/{name}", hashes=hashes)
                except FileNotFoundError:
                    continue
            raise QbtError(f"qBittorrent doesn't support {act}")
        if act == "delete":
            return self.post("torrents/delete", hashes=hashes, deleteFiles=str(delete_files).lower())
        if act in ("recheck", "reannounce", "topPrio", "bottomPrio"):
            return self.post(f"torrents/{act}", hashes=hashes)
        raise QbtError(f"unknown action {act}")
