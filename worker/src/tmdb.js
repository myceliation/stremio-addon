import { cacheGet, cachePut, newBudget as nb, room, spend } from "./util.js";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";
export const PAGE = 20;
const MAX_PAGES = 500;                 // TMDB's own ceiling: 10,000 titles per query
export const newBudget = nb;

/** Cached TMDB GET (Cache API). Counts one cache read, plus a fetch and a cache write on a miss. */
export async function tmdb(env, path, params = {}, budget, ttl = 6 * 3600) {
  const key = "tmdb:" + path + "?" + new URLSearchParams(params).toString();
  const hit = await cacheGet(key);
  if (hit) return hit;
  const data = await tmdbRaw(env, path, params);
  await cachePut(key, data, ttl);
  return data;
}
async function tmdbRaw(env, path, params) {
  spend();
  const r = await fetch(`${API}${path}?${new URLSearchParams({ ...params, api_key: env.TMDB_KEY })}`, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`TMDB ${r.status} ${path}`);
  return r.json();
}

/** TMDB ids → IMDb ids: one D1 read for the batch, TMDB only for unknown ones. */
export async function imdbMap(env, kind, ids) {
  const out = new Map();
  if (!ids.length) return out;
  const keys = ids.map(i => `${kind}:${i}`);
  const r = await env.DB.prepare(`SELECT k, imdb FROM tmdb_map WHERE k IN (${keys.map(() => "?").join(",")})`).bind(...keys).all();
  for (const x of r.results) out.set(+x.k.split(":")[1], x.imdb || null);
  const fresh = [];
  for (const id of ids) {
    if (out.has(id)) continue;
    if (!room(3)) break;                      // leave room for the insert + page cache write
    spend();
    let v;
    try {
      const res = await fetch(`${API}/${kind}/${id}/external_ids?api_key=${env.TMDB_KEY}`);
      v = res.ok ? ((await res.json()).imdb_id || "") : undefined;
    } catch { v = undefined; }
    if (v === undefined) continue;
    out.set(id, v || null);
    fresh.push([`${kind}:${id}`, v]);
  }
  if (fresh.length) {
    const per = 50;
    for (let i = 0; i < fresh.length; i += per) {
      const chunk = fresh.slice(i, i + per);
      await env.DB.prepare(`INSERT INTO tmdb_map (k, imdb) VALUES ${chunk.map(() => "(?,?)").join(",")} ON CONFLICT DO NOTHING`).bind(...chunk.flat()).run();
    }
  }
  return out;
}
export async function imdbFor(env, kind, tmdbId) {
  return (await imdbMap(env, kind, [tmdbId])).get(tmdbId);
}

const kindOf = type => (type === "series" ? "tv" : "movie");

/** One TMDB result page as Stremio-ready items with IMDb ids (cached when complete). */
export async function mappedPage(env, type, path, params, page) {
  const key = `mp:${path}?${new URLSearchParams({ ...params, page })}`;
  const hit = await cacheGet(key);
  if (hit) return hit;
  if (!room(5)) throw new Error("budget");
  const data = await tmdbRaw(env, path, { ...params, page });
  const kind = kindOf(type);
  const results = data.results || [];
  const map = await imdbMap(env, kind, results.map(r => r.id));
  let complete = true;
  const items = [];
  for (const r of results) {
    if (!map.has(r.id)) { complete = false; continue; }
    const id = map.get(r.id);
    if (!id) continue;
    items.push({
      id, tmdb: r.id, type, name: r.title || r.name,
      poster: r.poster_path ? IMG + r.poster_path : null,
      year: (r.release_date || r.first_air_date || "").slice(0, 4),
      overview: r.overview || "", genres: r.genre_ids || [],
      vote: r.vote_average || 0, votes: r.vote_count || 0,
    });
  }
  const out = { items, last: page >= Math.min(data.total_pages || 1, MAX_PAGES) };
  if (complete) await cachePut(key, out, 6 * 3600);
  return out;
}

/**
 * Deterministic paging for Stremio: skip = items received so far, so walk the
 * cached pages, filter, and return exactly the next PAGE items. Where each answer
 * stopped is remembered (a "cursor" keyed by skip), so the next page resumes there
 * instead of re-walking from page 1. That's what lets a row go all the way to the
 * end of TMDB's results. If the request runs out of subrequests, return what's
 * ready; the next request continues.
 */
export async function pagedCatalog(env, type, path, params, skip, opts = {}) {
  const exclude = opts.exclude || new Set();
  const keep = opts.keep || (() => true);
  const ck = `cur:${type}:${path}?${new URLSearchParams(params)}:${exclude.size}:${opts.keepKey || ""}`;
  let start = { page: 1, idx: 0, seen: 0 };
  if (skip > 0) {
    const c = await cacheGet(`${ck}:${skip}`).catch(() => null);
    if (c) start = c;
  }
  const out = [], ids = new Set(opts.alsoSkip || []);
  let seen = start.seen, page = start.page, idx = start.idx, done = false;
  for (; page <= MAX_PAGES && out.length < PAGE; page++, idx = 0) {
    let mp;
    try { mp = await mappedPage(env, type, path, params, page); }
    catch (e) { if (String(e.message) === "budget") break; throw e; }
    for (; idx < mp.items.length; idx++) {
      const it = mp.items[idx];
      if (exclude.has(it.id) || ids.has(it.id) || !keep(it)) continue;
      ids.add(it.id);
      if (seen++ < skip) continue;
      out.push(it);
      if (out.length >= PAGE) { idx++; break; }
    }
    if (out.length >= PAGE) break;
    if (mp.last) { done = true; break; }
  }
  if (out.length && !done) {
    // next request will ask for skip + out.length; remember where that starts
    if (idx >= PAGE_SIZE_HINT) { page++; idx = 0; }
    await cachePut(`${ck}:${skip + out.length}`, { page, idx, seen }, 6 * 3600);
  }
  return out;
}
const PAGE_SIZE_HINT = 20;     // TMDB pages hold 20 results

export const toMeta = it => ({
  id: it.id, type: it.type, name: it.name, poster: it.poster || undefined, posterShape: "poster",
  releaseInfo: it.year || undefined, description: it.overview || undefined,
});

// ── a title's TMDB facts, for matching it to microgenres ─────────────────────
/** {imdb, kw:Set, genres:Set, lang, year, countries:Set} for an IMDb id, or null. Two cached TMDB calls. */
export async function titleInfo(env, type, imdb) {
  const kind = type === "series" ? "tv" : "movie";
  const row = await env.DB.prepare("SELECT k FROM tmdb_map WHERE imdb=? AND k LIKE ?").bind(imdb, kind + ":%").first();
  let id = row ? row.k.split(":")[1] : null;
  if (!id) {
    const f = await tmdb(env, `/find/${imdb}`, { external_source: "imdb_id" }, null, 30 * 86400);
    const hit = (kind === "tv" ? f.tv_results : f.movie_results) || [];
    if (!hit.length) return null;
    id = String(hit[0].id);
    await env.DB.prepare("INSERT INTO tmdb_map (k, imdb) VALUES (?,?) ON CONFLICT DO NOTHING").bind(`${kind}:${id}`, imdb).run();
  }
  const d = await tmdb(env, `/${kind}/${id}`, { append_to_response: "keywords" }, null, 30 * 86400);
  const kws = (d.keywords && (d.keywords.keywords || d.keywords.results)) || [];
  return {
    imdb, kw: new Set(kws.map(k => k.id)), genres: new Set((d.genres || []).map(g => g.id)),
    lang: d.original_language || null, year: +((d.release_date || d.first_air_date || "").slice(0, 4)) || 0,
    countries: new Set([...(d.origin_country || []), ...((d.production_countries || []).map(c => c.iso_3166_1))]),
    name: d.title || d.name, poster: d.poster_path ? IMG + d.poster_path : null,
  };
}
