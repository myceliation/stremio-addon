"""
Read Stremio's *local* state (library / watch history / profile) straight out of
the desktop app's WebView2 localStorage — no Trakt, no extra account.

Stremio 5 (stremio-shell-ng) keeps stremio-core's storage in Chromium
localStorage, which is a LevelDB directory. This module is a small pure-Python
LevelDB reader (log files + SSTables, snappy via `cramjam`) that pulls out the
`library`, `library_recent` and `profile` keys for the app.strem.io origin.

It only ever *reads* (and copies files first), so it is safe while Stremio runs.
"""
from __future__ import annotations

import glob
import json
import os
import shutil
import struct
import tempfile

try:
    import cramjam  # snappy for compressed SSTable blocks
except Exception:  # pragma: no cover
    cramjam = None


# ── locating the store ───────────────────────────────────────────────────────

def candidate_dirs() -> list[str]:
    local = os.environ.get("LOCALAPPDATA", "")
    roaming = os.environ.get("APPDATA", "")
    pats = [
        # Stremio 5 (WebView2 shell)
        os.path.join(local, "Programs", "Stremio", "stremio-shell-ng.exe.WebView2",
                     "EBWebView", "*", "Local Storage", "leveldb"),
        # Stremio 4.x (Qt WebEngine shell)
        os.path.join(local, "Smart Code ltd", "Stremio", "QtWebEngine", "*",
                     "Local Storage", "leveldb"),
        os.path.join(roaming, "stremio", "*", "Local Storage", "leveldb"),
    ]
    extra = os.getenv("STREMIO_LOCALSTORAGE_DIR")
    out = [extra] if extra else []
    for p in pats:
        out += glob.glob(p)
    return [d for d in out if d and os.path.isdir(d)]


# ── LevelDB primitives ───────────────────────────────────────────────────────

def _varint(buf: bytes, pos: int) -> tuple[int, int]:
    result = shift = 0
    while True:
        b = buf[pos]
        pos += 1
        result |= (b & 0x7F) << shift
        if not b & 0x80:
            return result, pos
        shift += 7


def _read_log(path: str):
    """Yield (user_key, seq, is_value, value) from a LevelDB .log file."""
    data = open(path, "rb").read()
    BLOCK = 32768
    pos, frag = 0, b""
    records = []
    while pos + 7 <= len(data):
        block_left = BLOCK - (pos % BLOCK)
        if block_left < 7:
            pos += block_left
            continue
        length = struct.unpack_from("<H", data, pos + 4)[0]
        rtype = data[pos + 6]
        payload = data[pos + 7: pos + 7 + length]
        pos += 7 + length
        if rtype == 0 and length == 0:
            continue
        if rtype == 1:
            records.append(payload)
        elif rtype == 2:
            frag = payload
        elif rtype == 3:
            frag += payload
        elif rtype == 4:
            records.append(frag + payload)
            frag = b""
    for rec in records:
        if len(rec) < 12:
            continue
        seq, count = struct.unpack_from("<QI", rec, 0)
        p = 12
        try:
            for i in range(count):
                tag = rec[p]; p += 1
                klen, p = _varint(rec, p)
                key = rec[p:p + klen]; p += klen
                if tag == 1:
                    vlen, p = _varint(rec, p)
                    val = rec[p:p + vlen]; p += vlen
                    yield key, seq + i, True, val
                else:
                    yield key, seq + i, False, b""
        except IndexError:
            continue


def _read_block(data: bytes, off: int, size: int) -> bytes:
    raw = data[off:off + size]
    ctype = data[off + size]
    if ctype == 1:
        if cramjam is None:
            raise RuntimeError("cramjam not installed (pip install cramjam)")
        return bytes(cramjam.snappy.decompress_raw(raw))
    return raw


def _iter_block(block: bytes):
    n_restarts = struct.unpack_from("<I", block, len(block) - 4)[0]
    end = len(block) - 4 - 4 * n_restarts
    pos, key = 0, b""
    while pos < end:
        shared, pos = _varint(block, pos)
        non_shared, pos = _varint(block, pos)
        vlen, pos = _varint(block, pos)
        key = key[:shared] + block[pos:pos + non_shared]
        pos += non_shared
        val = block[pos:pos + vlen]
        pos += vlen
        yield key, val


def _read_ldb(path: str):
    data = open(path, "rb").read()
    if len(data) < 48:
        return
    footer = data[-48:]
    _, p = _varint(footer, 0)
    _, p = _varint(footer, p)
    idx_off, p = _varint(footer, p)
    idx_size, p = _varint(footer, p)
    index = _read_block(data, idx_off, idx_size)
    for _, handle in _iter_block(index):
        off, q = _varint(handle, 0)
        size, q = _varint(handle, q)
        try:
            blk = _read_block(data, off, size)
        except Exception:
            continue
        for ikey, val in _iter_block(blk):
            if len(ikey) < 8:
                continue
            trailer = struct.unpack_from("<Q", ikey, len(ikey) - 8)[0]
            yield ikey[:-8], trailer >> 8, (trailer & 0xFF) == 1, val


def read_localstorage(ldb_dir: str) -> dict[bytes, bytes]:
    """Return the newest value for every live key in a localStorage LevelDB."""
    tmp = tempfile.mkdtemp(prefix="stremio_ls_")
    try:
        for f in os.listdir(ldb_dir):
            if f.endswith((".log", ".ldb")):
                try:
                    shutil.copy2(os.path.join(ldb_dir, f), tmp)
                except OSError:
                    pass
        best: dict[bytes, tuple[int, bool, bytes]] = {}
        for f in os.listdir(tmp):
            fp = os.path.join(tmp, f)
            it = _read_log(fp) if f.endswith(".log") else _read_ldb(fp)
            try:
                for key, seq, is_val, val in it:
                    cur = best.get(key)
                    if cur is None or seq > cur[0]:
                        best[key] = (seq, is_val, val)
            except Exception:
                continue
        return {k: v for k, (s, live, v) in best.items() if live}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _decode(val: bytes) -> str:
    if not val:
        return ""
    if val[0] == 0:
        return val[1:].decode("utf-16-le", errors="replace")
    return val[1:].decode("latin-1", errors="replace")


def load_state() -> dict:
    """
    Return {'library': {...}, 'library_recent': {...}, 'profile': {...}, 'source': dir}
    for the Stremio web origin. Keys missing in storage are omitted.
    """
    for d in candidate_dirs():
        kv = read_localstorage(d)
        out: dict = {"source": d}
        for key, val in kv.items():
            if not key.startswith(b"_"):
                continue
            origin, _, name = key[1:].partition(b"\x00")
            if b"strem" not in origin:
                continue
            name = name[1:].decode("latin-1", errors="replace") if name else ""
            if name in ("library", "library_recent", "profile"):
                try:
                    out[name] = json.loads(_decode(val))
                except Exception:
                    pass
        if len(out) > 1:
            return out
    return {}


def library_items(state: dict | None = None) -> list[dict]:
    """Merge `library` + `library_recent` buckets into one list of LibraryItems."""
    state = state if state is not None else load_state()
    merged: dict[str, dict] = {}
    for bucket in ("library", "library_recent"):
        items = (state.get(bucket) or {}).get("items") or {}
        for _id, it in items.items():
            prev = merged.get(_id)
            if prev is None or (it.get("_mtime") or "") >= (prev.get("_mtime") or ""):
                merged[_id] = it
    return list(merged.values())


def auth_key(state: dict | None = None) -> str:
    state = state if state is not None else load_state()
    auth = (state.get("profile") or {}).get("auth") or {}
    return str(auth.get("key") or "")


if __name__ == "__main__":
    st = load_state()
    items = library_items(st)
    print("source:", st.get("source"))
    print("items:", len(items), "| auth key found:", bool(auth_key(st)))
