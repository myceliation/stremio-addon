// Stremio's own account API (the same endpoints the official apps use).
import { spend } from "./util.js";
const API = "https://api.strem.io/api/";
const LINK = "https://link.stremio.com/api/v2/";

async function call(method, body) {
  spend();
  const r = await fetch(API + method, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (j.error) throw new Error(j.error.message || "Stremio API error");
  return j.result;
}

export const getUser = authKey => call("getUser", { type: "GetUser", authKey });

export const datastoreMeta = authKey =>
  call("datastoreMeta", { authKey, collection: "libraryItem" });

export const datastoreGet = (authKey, ids) =>
  call("datastoreGet", { authKey, collection: "libraryItem", ids, all: ids.length === 0 });

// ── add-on order ────────────────────────────────────────────────────────────
// Stremio lists rows and Discover's catalog dropdown in install order and has no reorder button.
// The account's add-on collection is an ordered list, so moving entries in it reorders every device
// (the apps re-read it whenever their window gets focus).
export const addonCollectionGet = authKey => call("addonCollectionGet", { type: "AddonCollectionGet", authKey, update: true });
export const addonCollectionSet = (authKey, addons) => call("addonCollectionSet", { type: "AddonCollectionSet", authKey, addons });
// Stremio keeps a snapshot of each add-on's manifest from install time and never re-reads it, so new
// rows, lists and dropdowns only show up after a reinstall. `fresh` ({transportUrl: manifest}) swaps
// the snapshot for the current manifest, which is what reinstalling does, without losing the position.
export async function reorderAddons(authKey, where, ids, fresh = {}) {
  // ids: Mycelium's own add-on ids; anything starting with ids[0] (the service packs) counts as ours too
  const mineId = id => ids.includes(id) || (id || "").startsWith(ids[0] + ".");
  const idOf = a => (a.manifest || {}).id;
  const current = (await addonCollectionGet(authKey)).addons || [];
  const rest = current.filter(a => !mineId(idOf(a)));
  // ours, in the order given: refreshed manifests, new packs added, packs no longer needed dropped
  const mine = Object.entries(fresh).filter(([, m]) => m && m.id).map(([url, m]) => {
    const old = current.find(a => a.transportUrl === url);
    return { ...(old || { flags: { official: false, protected: false } }), transportUrl: url, manifest: m };
  });
  if (!mine.length) return { ok: false, error: "Nothing to install." };
  let out;
  if (where === "keep" && current.some(a => mineId(idOf(a)))) {
    const at = current.findIndex(a => mineId(idOf(a)));
    const before = current.slice(0, at).filter(a => !mineId(idOf(a)));
    out = [...before, ...mine, ...rest.filter(a => !before.includes(a))];
  } else {
    const at = where === "after-cinemeta" ? rest.findIndex(a => idOf(a) === "com.linvo.cinemeta") + 1 : 0;
    out = [...rest.slice(0, at), ...mine, ...rest.slice(at)];
  }
  await addonCollectionSet(authKey, out);
  return { ok: true, refreshed: mine.length, order: out.map(a => (a.manifest || {}).name || idOf(a)) };
}

// "Log in with a code" — the flow the Stremio TV app uses
const LINK_HEADERS = { "user-agent": "Mozilla/5.0 (Mycelium add-on)", accept: "application/json" };
export async function linkCreate() {
  spend();
  const r = await fetch(LINK + "create?type=Create", { headers: LINK_HEADERS });
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch {
    throw new Error("Stremio's code service didn't answer this server (" + text.slice(0, 40) + "). Use step 4 in the Mycelium window on your PC instead.");
  }
  return j.result || j;
}
export async function linkRead(code) {
  spend();
  const r = await fetch(LINK + "read?type=Read&code=" + encodeURIComponent(code), { headers: LINK_HEADERS });
  const j = await r.json().catch(() => ({}));
  const res = j.result || {};
  return res.authKey || res.auth?.key || null;
}

// Cinemeta for names/posters of single titles (shelf actions, share page)
export async function cinemeta(type, id) {
  const base = id.split(":")[0];
  spend();
  try {
    const r = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${base}.json`);
    const m = (await r.json()).meta || {};
    return { name: m.name || base, poster: m.poster || null, year: (m.releaseInfo || m.year || "").toString().slice(0, 4),
             genres: m.genres || m.genre || [] };
  } catch {
    return { name: base, poster: null, year: "", genres: [] };
  }
}

export const datastorePut = (authKey, changes) =>
  call("datastorePut", { authKey, collection: "libraryItem", changes });

/** A brand-new Stremio library item (optionally already marked watched). */
export function libraryItem({ id, type, name, poster }, watched = false) {
  const t = new Date().toISOString();
  return {
    _id: id, name: name || id, type, poster: poster || null, posterShape: "poster",
    removed: false, temp: false, _ctime: t, _mtime: t,
    state: { lastWatched: watched ? t : null, timeWatched: 0, timeOffset: 0, overallTimeWatched: 0,
             timesWatched: watched ? 1 : 0, flaggedWatched: watched ? 1 : 0, duration: 0, video_id: null,
             watched: null, noNotif: false },
    behaviorHints: { defaultVideoId: null, featuredVideoId: null, hasScheduledVideos: false },
  };
}

// ── Stremio's own Like / Love buttons (likes.stremio.com) ────────────────────
const LIKES = "https://likes.stremio.com";
/** Every title this account liked or loved in Stremio: { loved: [{id,type,name,poster}], liked: [...] } (null on failure). */
export async function likesAll(authKey) {
  const out = { loved: [], liked: [] };
  for (const w of ["loved", "liked"]) for (const type of ["movie", "series"]) {
    for (let skip = 0; skip < 500; skip += 100) {
      spend();
      const r = await fetch(`${LIKES}/addons/${w}/movies-shows/${encodeURIComponent(authKey)}/catalog/${type}/stremio-${w}-${type}${skip ? `/skip=${skip}` : ""}.json`);
      if (!r.ok) return null;
      const metas = ((await r.json().catch(() => null)) || {}).metas;
      if (!Array.isArray(metas)) return null;
      out[w].push(...metas.filter(m => /^tt\d+$/.test(m.id || "")).map(m => ({ id: m.id, type, name: m.name, poster: m.poster })));
      if (metas.length < 100) break;
    }
  }
  return out;
}
/** Set Stremio's Like / Love on one title ("liked", "loved" or null to clear). */
export async function likeSend(authKey, id, type, status) {
  spend();
  await fetch(`${LIKES}/api/send`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ authToken: authKey, mediaId: id, mediaType: type, status }) });
}
/** Mark one title watched / not watched in Stremio's own library without adding it to the Library view. */
export async function setStremioWatched(authKey, { id, type, name, poster }, on) {
  const [it] = (await datastoreGet(authKey, [id])) || [];
  const t = new Date().toISOString();
  let item;
  if (it) {
    const st = { ...(it.state || {}) };
    if (!!(st.flaggedWatched || st.timesWatched) === on) return;
    if (on) { st.flaggedWatched = 1; st.timesWatched = Math.max(1, st.timesWatched || 0); st.lastWatched = st.lastWatched || t; }
    else { st.flaggedWatched = 0; st.timesWatched = 0; }
    item = { ...it, state: st, _mtime: t };
  } else {
    if (!on) return;
    item = libraryItem({ id, type, name, poster: poster || `https://images.metahub.space/poster/medium/${id}/img` }, true);
    item.removed = true;                       // watched, but not put into the Library view
  }
  await datastorePut(authKey, [item]);
}
