import { AsyncLocalStorage } from "node:async_hooks";

// ── per-request subrequest accounting ────────────────────────────────────────
// Cloudflare's free plan allows 50 subrequests per request, and fetches, Cache API
// calls and D1 queries all count. Everything that makes one goes through spend().
export const ALS = new AsyncLocalStorage();
export const LIMIT = 46;
const cur = () => ALS.getStore() || { used: 0 };
export const used = () => cur().used;
export const room = n => LIMIT - cur().used >= n;
export function spend(n = 1) { const b = cur(); if (b.used + n > LIMIT) throw new Error("budget"); b.used += n; }
/** Budget object compatible with the older `budget.left--` style. */
export const newBudget = () => ({
  get left() { return LIMIT - cur().used; },
  set left(v) { const d = LIMIT - cur().used - v; if (d > 0) cur().used += d; },
});
/** Wrap a D1 binding so each query counts. */
export function countingDB(raw) {
  const wrap = st => ({
    __raw: st,
    bind: (...a) => wrap(st.bind(...a)),
    first: (...a) => { spend(); return st.first(...a); },
    all: () => { spend(); return st.all(); },
    run: () => { spend(); return st.run(); },
  });
  return { prepare: sql => wrap(raw.prepare(sql)), batch: stmts => { spend(1); return   /* one round trip, however many statements */ raw.batch(stmts.map(s => s.__raw || s)); } };
}

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });

export const html = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", ...CORS } });

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "*",
};

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function randomId(bytes = 24) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function parseExtra(str) {
  const out = {};
  if (!str) return out;
  for (const part of str.split("&")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[decodeURIComponent(part.slice(0, i))] = decodeURIComponent(part.slice(i + 1).replace(/\+/g, " "));
  }
  return out;
}

export const today = () => new Date().toISOString().slice(0, 10);
export const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

// ── small cache helper over the Workers Cache API ─────────────────────────────
const CACHE_HOST = "https://cache.mycelium.internal/";
export async function cacheGet(key) {
  spend();
  const r = await caches.default.match(CACHE_HOST + encodeURIComponent(key));
  return r ? r.json() : null;
}
export async function cachePut(key, value, ttlSeconds, ctx) {
  if (!room(1)) return;                     // skip caching rather than fail the request
  spend();
  const res = new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json", "cache-control": `max-age=${ttlSeconds}` },
  });
  const p = caches.default.put(CACHE_HOST + encodeURIComponent(key), res);
  if (ctx) ctx.waitUntil(p); else await p;
}
