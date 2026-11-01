// Storage on Cloudflare D1 (SQLite). See migrations/0001_init.sql.
import { randomId, cacheGet, cachePut } from "./util.js";
import { MICROGENRES, MG_TAG } from "./microgenres.js";
import { getUser, datastoreMeta, datastoreGet, cinemeta, likesAll, likeSend, setStremioWatched } from "./stremio.js";

// ── authKey at rest (only if the user connects history): AES-GCM ─────────────
async function aesKey(env) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(env.AUTH_SECRET));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64 = u8 => btoa(String.fromCharCode(...u8));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export async function seal(env, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), new TextEncoder().encode(text)));
  return b64(iv) + "." + b64(ct);
}
export async function unseal(env, sealed) {
  const [iv, ct] = sealed.split(".").map(unb64);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await aesKey(env), ct));
}

// ── constants ────────────────────────────────────────────────────────────────
export const SHELVES = [
  { key: "watched",   icon: "✔", label: "Watched" },
  { key: "loved",     icon: "❤", label: "Loved" },
  { key: "liked",     icon: "👍", label: "Liked" },
  { key: "waiting",   icon: "⏳", label: "Waiting for release" },
  { key: "rewatch",   icon: "🔁", label: "Rewatch" },
  { key: "dropped",   icon: "✖", label: "Dropped" },
  { key: "ignore",    icon: "👎", label: "Ignore" },
  { key: "blacklist", icon: "🚫", label: "Blacklist" },
];
export const SHELF_KEYS = SHELVES.map(s => s.key);
export const isListKey = k => k === "library" || SHELF_KEYS.includes(k) || /^l:[A-Za-z0-9_-]{4,40}$/.test(k);

export const DEFAULT_SETTINGS = {
  region: "US",
  regions: ["US"],            // first one is home; rows can switch between them
  displayName: "",
  rows: { library: true, history: true, loved: true, waiting: true, rewatch: true, rated: false,
          forYou: true, popular: true, cinema: true, digital: true, gems: true, browse: true, people: false, tools: true,
          historyAddon: false },   // the separate Watch History add-on: Stremio now shows what you've watched itself
  providers: [{ id: "8|175", name: "Netflix" }, { id: "1899|384|1825", name: "Max" }, { id: "258", name: "Criterion Channel" }],
  microgenres: ["folk-horror", "cerebral-70s-scifi", "korean-thrillers"],
  custom: [],
  hideIgnored: true,
  hideWatched: true,          // keep watched titles out of discovery rows and the Library row
  shelveButton: true,
  mgLinks: true,
  serviceRows: false,
  serviceHome: false,         // true: Home rows for the 6 biggest services where you live         // true: every streaming service gets its own Home row (extra "Services" add-ons)              // title pages list their microgenres (Mycelium serves the page, from Cinemeta)
};
export const mergeSettings = s => ({
  ...structuredClone(DEFAULT_SETTINGS), ...(s || {}),
  rows: { ...DEFAULT_SETTINGS.rows, ...((s || {}).rows || {}) },
});

const now = () => Date.now();
const db = env => env.DB;

// Insert many rows in as few statements as D1 allows (≤100 bound params each).
export async function insertMany(env, table, cols, rows, tail = "ON CONFLICT DO NOTHING") {
  if (!rows.length) return 0;
  const per = Math.max(1, Math.floor(100 / cols.length));
  const stmts = [];
  for (let i = 0; i < rows.length; i += per) {
    const chunk = rows.slice(i, i + per);
    const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES ` +
      chunk.map(() => "(" + cols.map(() => "?").join(",") + ")").join(",") + " " + tail;
    stmts.push(db(env).prepare(sql).bind(...chunk.flat()));
  }
  for (let i = 0; i < stmts.length; i += 40) await db(env).batch(stmts.slice(i, i + 40));
  return rows.length;
}

// ── users ────────────────────────────────────────────────────────────────────
const rowToUser = r => r && { ...r, settings: mergeSettings(JSON.parse(r.settings || "{}")) };

export async function userByToken(env, token) {
  if (!token || token.length < 30) return null;
  return rowToUser(await db(env).prepare("SELECT * FROM users WHERE token=?").bind(token).first());
}
export async function userByShare(env, share) {
  return rowToUser(await db(env).prepare("SELECT * FROM users WHERE share=?").bind(share).first());
}
export async function createUser(env) {
  const u = { uid: randomId(16), token: randomId(32), share: randomId(12), settings: structuredClone(DEFAULT_SETTINGS) };
  await db(env).prepare("INSERT INTO users (uid, token, share, settings, created) VALUES (?,?,?,?,?)")
    .bind(u.uid, u.token, u.share, JSON.stringify(u.settings), now()).run();
  return u;
}
export const saveSettings = (env, user) =>
  db(env).prepare("UPDATE users SET settings=? WHERE uid=?").bind(JSON.stringify(user.settings), user.uid).run();

export async function deleteUser(env, user) {
  await db(env).batch(["items", "lists", "ratings", "history", "jobs", "users"].map(t =>
    db(env).prepare(`DELETE FROM ${t} WHERE uid=?`).bind(user.uid)));
}

// ── titles ───────────────────────────────────────────────────────────────────
const genreStr = g => (g && g.length ? "|" + g.join("|") + "|" : null);

export function titleRow(t) {
  return [t.id, t.type === "series" ? "series" : "movie", (t.name || t.id).slice(0, 300), t.year ? String(t.year).slice(0, 4) : null,
          t.poster || null, Array.isArray(t.genres) ? genreStr(t.genres) : (t.genres || null), t.lang || null,
          t.vote == null ? null : +t.vote, now(), t.mg || null];
}
export const TITLE_COLS = ["id", "type", "name", "year", "poster", "genres", "lang", "vote", "updated", "mg"];
// Fill in blanks without clobbering better data we already have
export const upsertTitles = (env, titles) => insertMany(env, "titles", TITLE_COLS, titles.filter(t => /^tt\d+$/.test(t.id)).map(titleRow),
  `ON CONFLICT(id) DO UPDATE SET
     name=COALESCE(excluded.name, titles.name), year=COALESCE(titles.year, excluded.year),
     poster=COALESCE(titles.poster, excluded.poster), genres=COALESCE(titles.genres, excluded.genres),
     lang=COALESCE(titles.lang, excluded.lang), vote=COALESCE(excluded.vote, titles.vote), mg=COALESCE(excluded.mg, titles.mg)`);

export async function ensureTitle(env, type, id) {
  const r = await db(env).prepare("SELECT * FROM titles WHERE id=?").bind(id).first();
  if (r) return r;
  const m = await cinemeta(type, id);
  const t = { id, type, name: m.name, year: m.year, poster: m.poster, genres: m.genres };
  await upsertTitles(env, [t]);
  return { ...t, genres: genreStr(m.genres) };
}

// ── memberships (library, watched, shelves, named lists) ─────────────────────
async function bump(env, uid) { await cachePut("ver:" + uid, now(), 86400); }
export async function version(uid) { return (await cacheGet("ver:" + uid)) || 0; }

export async function setMember(env, uid, list, id, type, on) {
  if (on) {
    await db(env).prepare("INSERT INTO items (uid, list, id, type, added) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING")
      .bind(uid, list, id, type, now()).run();
  } else {
    await db(env).prepare("DELETE FROM items WHERE uid=? AND list=? AND id=?").bind(uid, list, id).run();
  }
  await bump(env, uid);
}

export async function addMany(env, uid, list, rows) {       // rows: [{id, type, added?}]
  const t = now();
  const n = await insertMany(env, "items", ["uid", "list", "id", "type", "added"],
    rows.filter(r => /^tt\d+$/.test(r.id)).map((r, i) => [uid, list, r.id, r.type === "series" ? "series" : "movie", r.added || t - i]));
  await bump(env, uid);
  return n;
}

export async function membership(env, uid, ids) {
  if (!ids.length) return {};
  const out = Object.fromEntries(ids.map(i => [i, { lists: [], rating: null }]));
  const ph = ids.map(() => "?").join(",");
  const [mem, rat] = await db(env).batch([
    db(env).prepare(`SELECT id, list FROM items WHERE uid=? AND id IN (${ph})`).bind(uid, ...ids),
    db(env).prepare(`SELECT id, stars, review FROM ratings WHERE uid=? AND id IN (${ph})`).bind(uid, ...ids),
  ]);
  for (const r of mem.results) out[r.id].lists.push(r.list);
  for (const r of rat.results) out[r.id].rating = { s: r.stars, r: r.review || "" };
  for (const v of Object.values(out)) v.shelves = v.lists.filter(l => SHELF_KEYS.includes(l));
  return out;
}

/** Ids to keep out of discovery rows (cached per user until something changes). */
export async function excludedIds(env, user) {
  const ver = await version(user.uid);
  const key = `excl:${user.uid}:${ver}:${user.settings.hideIgnored}:${user.settings.hideWatched}`;
  const hit = await cacheGet(key);
  if (hit) return new Set(hit);
  const lists = [];
  if (user.settings.hideIgnored) lists.push("ignore", "blacklist");
  if (user.settings.hideWatched) lists.push("watched");
  if (!lists.length) return new Set();
  const r = await db(env).prepare(`SELECT id FROM items WHERE uid=? AND list IN (${lists.map(() => "?").join(",")})`)
    .bind(user.uid, ...lists).all();
  const ids = r.results.map(x => x.id);
  await cachePut(key, ids, 600);
  return new Set(ids);
}

/**
 * One page of a list as Stremio metas. `filter` comes from the catalog's genre
 * dropdown and can be a genre, "Decade: 1980s", "Language: ja", "Rated 4+", "Shuffle".
 */
// ── list browsing: filters + sort, each a separate Stremio dropdown ─────────
// f = { genre, and, year, language, show, sort, search, legacy }  (legacy = the old single "genre" filter values)
const GENRE_ALIASES = {
  "Sci-Fi": ["Sci-Fi", "Science Fiction", "Sci-Fi & Fantasy"],
  "Fantasy": ["Fantasy", "Sci-Fi & Fantasy"],
  "Sci-Fi & Fantasy": ["Sci-Fi & Fantasy", "Sci-Fi", "Science Fiction", "Fantasy"],
  "Action": ["Action", "Action & Adventure"],
  "Adventure": ["Adventure", "Action & Adventure"],
  "Action & Adventure": ["Action & Adventure", "Action", "Adventure"],
  "War": ["War", "War & Politics"],
  "War & Politics": ["War & Politics", "War"],
  "Kids": ["Kids", "Family"],
};
export const LANGUAGES = {
  English: "en", Japanese: "ja", Korean: "ko", French: "fr", Italian: "it", Spanish: "es", German: "de",
  Mandarin: "zh", Cantonese: "cn", Hindi: "hi", Russian: "ru", Swedish: "sv", Danish: "da", Norwegian: "no",
  Finnish: "fi", Icelandic: "is", Portuguese: "pt", Polish: "pl", Czech: "cs", Hungarian: "hu", Romanian: "ro",
  Serbian: "sr", Greek: "el", Turkish: "tr", Persian: "fa", Arabic: "ar", Hebrew: "he", Thai: "th",
  Tagalog: "tl", Indonesian: "id", Dutch: "nl", Ukrainian: "uk", Tamil: "ta", Telugu: "te", Malayalam: "ml",
  Bengali: "bn", Vietnamese: "vi",
};
export const LIST_SORTS = ["Recently added", "Oldest added", "Newest releases", "Oldest releases", "TMDB rating",
  "A–Z", "Z–A", "Shuffle"];
export const LIST_SHOW = ["Not watched yet", "Watched", "Loved or liked", "Loved", "Liked"];

function genreClause(name, where, args) {
  const names = GENRE_ALIASES[name] || [name];
  where.push("(" + names.map(() => "t.genres LIKE ?").join(" OR ") + ")");
  args.push(...names.map(n => `%|${n}|%`));
}
function yearClause(v, where, args) {
  let m;
  if ((m = String(v).match(/^(\d{3})0s$/))) { where.push("t.year LIKE ?"); args.push(m[1] + "%"); }
  else if (/^\d{4}$/.test(v)) { where.push("t.year=?"); args.push(v); }
}
const inList = l => `EXISTS (SELECT 1 FROM items x WHERE x.uid=i.uid AND x.list='${l}' AND x.id=i.id)`;
const RATED = "(SELECT r.stars FROM ratings r WHERE r.uid=i.uid AND r.id=i.id)";

function listQuery(user, list, type, f, hide) {
  // the Loved row also shows what you liked (Stremio's two buttons, Like and Love)
  // Rewatch also offers what you loved or liked and have seen; Waiting for release also shows saved titles from
  // this year on that you haven't watched (both on top of whatever you put there yourself)
  const yearNow = new Date().getUTCFullYear();
  const listWhere = list === "loved" ? "i.list IN (?, 'liked')"
    : list === "rewatch" ? `(i.list=? OR (i.list IN ('loved','liked') AND ${inList("watched")}))`
    : list === "waiting" ? `(i.list=? OR (i.list='library' AND CAST(t.year AS INTEGER) >= ${yearNow} AND NOT ${inList("watched")}))`
    : "i.list=?";
  const where = ["i.uid=?", listWhere, "i.type=?"];
  const args = [user.uid, list, type];
  let order = "i.added DESC";
  const lg = f.legacy || "";
  let m;
  if (lg) {                                   // values from the old single dropdown (older cached manifests)
    if ((m = lg.match(/^Decade: (\d{3}0s)$/))) yearClause(m[1], where, args);
    else if ((m = lg.match(/^Language: (\w+)$/))) { where.push("t.lang=?"); args.push(m[1]); }
    else if ((m = lg.match(/^Rated (\d)\+$/))) { where.push(`${RATED}>=?`); args.push(+m[1]); }
    else if (lg === "Shuffle") f.sort = "Shuffle";
    else if (lg === "Oldest added") f.sort = "Oldest added";
    else if (lg === "Release year") f.sort = "Newest releases";
    else if (lg === "TMDB rating") f.sort = "TMDB rating";
    else if (lg === "A–Z") f.sort = "A–Z";
    else f.genre = f.genre || lg;
  }
  if (f.genre) genreClause(f.genre, where, args);
  if (f.and && f.and !== f.genre) genreClause(f.and, where, args);
  if (f.year) yearClause(f.year, where, args);
  if (f.language) { where.push("t.lang=?"); args.push(LANGUAGES[f.language] || f.language); }
  if (f.microgenre) {
    const m = MICROGENRES.find(x => x.name === f.microgenre && x.type === type) || MICROGENRES.find(x => x.name === f.microgenre);
    if (m) { where.push("t.mg LIKE ?"); args.push(`%|${m.id}|%`); }
  }
  switch (f.show) {
    case "Not watched yet": where.push("NOT " + inList("watched")); break;
    case "Watched": where.push(inList("watched")); break;
    case "Loved": where.push(inList("loved")); break;
    case "Liked": where.push(inList("liked")); break;
    case "Loved or liked": where.push(`(${inList("loved")} OR ${inList("liked")})`); break;
    case "Rated by me": where.push(`${RATED} IS NOT NULL`); break;
    case "Rated 4★ and up": where.push(`${RATED}>=4`); break;
    case "Rated 5★": where.push(`${RATED}=5`); break;
    case "Not rated yet": where.push(`${RATED} IS NULL`); break;
  }
  if (f.batch) {
    const bt = (user.settings.batches || []).find(x => x.name === f.batch);
    const rs = bt ? (bt.ranges || [[bt.from, bt.to]]) : [[0, 0]];
    where.push("(" + rs.map(() => "i.added BETWEEN ? AND ?").join(" OR ") + ")");
    rs.forEach(r => args.push(r[0], r[1]));
  }
  if (f.search) { where.push("t.name LIKE ?"); args.push(`%${f.search}%`); }
  for (const h of hide) { where.push("NOT EXISTS (SELECT 1 FROM items x WHERE x.uid=i.uid AND x.list=? AND x.id=i.id)"); args.push(h); }
  const seed = Math.floor(Date.now() / 864e5) % 9973;   // same shuffle all day, so paging stays consistent
  switch (f.sort) {
    case "Oldest added": order = "i.added ASC"; break;
    case "Newest releases": order = "t.year IS NULL, t.year DESC, i.added DESC"; break;
    case "Oldest releases": order = "t.year IS NULL, t.year ASC, i.added DESC"; break;
    case "TMDB rating": order = "t.vote IS NULL, t.vote DESC"; break;
    case "My rating": order = `${RATED} IS NULL, ${RATED} DESC, i.added DESC`; break;
    case "A–Z": order = "t.name COLLATE NOCASE ASC"; break;
    case "Z–A": order = "t.name COLLATE NOCASE DESC"; break;
    case "Shuffle": order = `((CAST(substr(i.id,3) AS INTEGER) + ${seed}) * 2654435761) % 4294967291`; break;
  }
  return { where, args, order, plain: where.length === 3 + hide.length && order === "i.added DESC" && !["rewatch", "waiting"].includes(list) };
}

const posterOf = (id, p) => p || `https://images.metahub.space/poster/small/${id}/img`;
const toListMeta = (x, type) => ({ id: x.id, type, name: x.name || x.id, poster: posterOf(x.id, x.poster),
  posterShape: "poster", releaseInfo: x.year || undefined });

export async function listPage(env, user, list, type, { skip = 0, limit = 100, filter = "", search = "", hide = [], f = {} } = {}) {
  f = { ...f, search: f.search || search, legacy: f.legacy || filter };
  const q = listQuery(user, list, type, f, hide);
  const from = `FROM items i LEFT JOIN titles t ON t.id=i.id WHERE ${q.where.join(" AND ")}`;
  // the plain newest-first view walks the index directly; anything sorted or filtered is worked out once
  // per change to your lists and kept in the edge cache, so a 17,000-title list doesn't get re-sorted on every page
  if (q.plain || f.search) {
    const r = await db(env).prepare(`SELECT i.id, t.name, t.year, t.poster ${from} ORDER BY ${q.order} LIMIT ? OFFSET ?`)
      .bind(...q.args, limit, skip).all();
    return r.results.map(x => toListMeta(x, type));
  }
  const ver = await version(user.uid);
  const key = `lq:${user.uid}:${ver}:${list}:${type}:${JSON.stringify([f.legacy, f.genre, f.and, f.year, f.language, f.microgenre, f.show, f.sort, f.batch && (user.settings.batches || []).find(x => x.name === f.batch), hide, f.sort === "Shuffle" ? Math.floor(Date.now() / 864e5) : 0])}`;
  let ids = await cacheGet(key);
  if (!ids) {
    ids = [...new Set((await db(env).prepare(`SELECT i.id ${from} ORDER BY ${q.order} LIMIT 25000`).bind(...q.args).all()).results.map(x => x.id))];
    await cachePut(key, ids, 6 * 3600);
  }
  const slice = ids.slice(skip, skip + Math.min(limit, 100));
  if (!slice.length) return [];
  const r = await db(env).prepare(`SELECT id, name, year, poster FROM titles WHERE id IN (${slice.map(() => "?").join(",")})`).bind(...slice).all();
  const byId = new Map(r.results.map(x => [x.id, x]));
  return slice.map(id => toListMeta(byId.get(id) || { id }, type));
}

export async function listCounts(env, uid) {
  const r = await db(env).prepare("SELECT list, type, COUNT(*) n FROM items WHERE uid=? GROUP BY list, type").bind(uid).all();
  const out = {};
  for (const x of r.results) { out[x.list] ||= { movie: 0, series: 0 }; out[x.list][x.type] = x.n; }
  return out;
}

// ── named lists ──────────────────────────────────────────────────────────────
export async function getLists(env, uid) {
  return (await db(env).prepare("SELECT lid, name, row, created FROM lists WHERE uid=? ORDER BY created").bind(uid).all()).results;
}
export async function createList(env, uid, name) {
  const lid = randomId(6).replace(/[^A-Za-z0-9]/g, "x");
  await db(env).prepare("INSERT INTO lists (uid, lid, name, row, created) VALUES (?,?,?,1,?)").bind(uid, lid, String(name).slice(0, 80), now()).run();
  await bump(env, uid);
  return { lid, name };
}
export async function updateList(env, uid, lid, { name, row }) {
  if (name != null) await db(env).prepare("UPDATE lists SET name=? WHERE uid=? AND lid=?").bind(String(name).slice(0, 80), uid, lid).run();
  if (row != null) await db(env).prepare("UPDATE lists SET row=? WHERE uid=? AND lid=?").bind(row ? 1 : 0, uid, lid).run();
}
export async function deleteList(env, uid, lid) {
  await db(env).batch([
    db(env).prepare("DELETE FROM items WHERE uid=? AND list=?").bind(uid, "l:" + lid),
    db(env).prepare("DELETE FROM lists WHERE uid=? AND lid=?").bind(uid, lid),
  ]);
  await bump(env, uid);
}

// ── ratings ──────────────────────────────────────────────────────────────────
export async function rate(env, uid, id, type, stars, review) {
  if (!stars) await db(env).prepare("DELETE FROM ratings WHERE uid=? AND id=?").bind(uid, id).run();
  else await db(env).prepare(`INSERT INTO ratings (uid, id, type, stars, review, rated) VALUES (?,?,?,?,?,?)
       ON CONFLICT(uid, id) DO UPDATE SET stars=excluded.stars, review=excluded.review, rated=excluded.rated`)
    .bind(uid, id, type, Math.max(1, Math.min(5, +stars)), String(review || "").slice(0, 2000), now()).run();
  await bump(env, uid);
}
export async function rateMany(env, uid, rows) {    // [{id, type, stars, review?, rated?}]
  return insertMany(env, "ratings", ["uid", "id", "type", "stars", "review", "rated"],
    rows.filter(r => /^tt\d+$/.test(r.id) && r.stars).map(r => [uid, r.id, r.type === "series" ? "series" : "movie",
      Math.max(1, Math.min(5, Math.round(r.stars))), r.review || null, r.rated || now()]),
    "ON CONFLICT(uid, id) DO UPDATE SET stars=excluded.stars, review=COALESCE(excluded.review, ratings.review)");
}
export async function ratedPage(env, uid, type, minStars, skip) {
  const r = await db(env).prepare(`SELECT r.id, r.stars, r.review, t.name, t.year, t.poster FROM ratings r
      LEFT JOIN titles t ON t.id=r.id WHERE r.uid=? AND r.type=? AND r.stars>=? ORDER BY r.stars DESC, r.rated DESC LIMIT 100 OFFSET ?`)
    .bind(uid, type, minStars, skip).all();
  return r.results.map(x => ({ id: x.id, type, name: x.name || x.id, poster: x.poster || undefined, posterShape: "poster",
    releaseInfo: "★".repeat(x.stars) + (x.year ? "  " + x.year : ""), description: x.review || undefined }));
}

// ── history (optional connection to the user's Stremio account) ──────────────
export async function connectHistory(env, user, authKey) {
  await getUser(authKey);
  await db(env).prepare("UPDATE users SET auth_enc=?, hist_at=0 WHERE uid=?").bind(await seal(env, authKey), user.uid).run();
}
export const authKeyOf = async (env, user) => (user.auth_enc ? unseal(env, user.auth_enc) : null);
export async function disconnectHistory(env, user) {
  await db(env).batch([
    db(env).prepare("UPDATE users SET auth_enc=NULL, hist_at=0 WHERE uid=?").bind(user.uid),
    db(env).prepare("DELETE FROM history WHERE uid=?").bind(user.uid),
  ]);
}

// change times come back as numbers from Stremio but as "1792026318377.0" from D1 (numbers are stored as REAL): compare them as whole numbers
const mtKey = v => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 ? String(n) : String(v); };
// "Still watching" needs a real start (10+ minutes in, or a tenth of the way) and not the end credits; a minute or two
// of a trailer or a stream that was tried and dropped stays out
const STATUS = s => (s.flaggedWatched || s.timesWatched ? "watched"
  : (s.timeOffset || 0) > 600000 || (s.duration && (s.timeOffset || 0) / s.duration > 0.1) ? ((s.duration && (s.timeOffset || 0) / s.duration > 0.92) ? "opened" : "progress") : "opened");

/** Incremental: only downloads library items whose mtime changed. Finished ones also join "watched". */
export async function refreshHistory(env, user, { maxFetch = 300, force = false } = {}) {
  if (!user.auth_enc) return { connected: false, complete: true, titles: 0 };
  if (!force && now() - (user.hist_at || 0) < 10 * 60 * 1000) return { connected: true, complete: true, cached: true };
  const authKey = await unseal(env, user.auth_enc);
  // the rules for "Still watching" changed (v2): read the whole Stremio library again once
  if ((user.settings.histV || 1) < 2) {
    await db(env).prepare("DELETE FROM history WHERE uid=?").bind(user.uid).run();
    user.settings.histV = 2; await saveSettings(env, user);
  }
  const meta = await datastoreMeta(authKey);                         // [[id, mtime], …]
  const have = new Map((await db(env).prepare("SELECT id, mtime FROM history WHERE uid=?").bind(user.uid).all()).results.map(r => [r.id, r.mtime]));
  // Stremio's list gives each item's change time as a number, the items themselves as text: keep the list's own
  // value, or every check would think everything changed and read the same first few hundred forever
  const metaTime = new Map(meta);
  const changed = meta.filter(([id, mt]) => mtKey(have.get(id)) !== mtKey(mt)).map(([id]) => id).slice(0, maxFetch);
  const rows = [], watched = [], titles = [], got = new Set();
  for (let i = 0; i < changed.length; i += 150) {
    for (const it of (await datastoreGet(authKey, changed.slice(i, i + 150))) || []) {
      const st = it.state || {};
      const type = it.type === "series" || it.type === "tv" ? "series" : "movie";
      const status = STATUS(st);
      got.add(it._id);
      rows.push([user.uid, it._id, type, it.name || it._id, it.poster || null, status, st.lastWatched || it._mtime || null,
                 st.timesWatched || 0, st.duration ? Math.round(100 * (st.timeOffset || 0) / st.duration) : 0, metaTime.has(it._id) ? mtKey(metaTime.get(it._id)) : it._mtime]);
      if (/^tt\d+$/.test(it._id)) {
        titles.push({ id: it._id, type, name: it.name, poster: it.poster });
        if (status === "watched") watched.push({ id: it._id, type, added: Date.parse(st.lastWatched || it._mtime) || now() });
      }
    }
  }
  // listed but not handed over (deleted in Stremio): remember it as gone so it isn't asked for again
  for (const id of changed) if (!got.has(id)) rows.push([user.uid, id, "movie", id, null, "gone", null, 0, 0, mtKey(metaTime.get(id))]);
  await insertMany(env, "history", ["uid", "id", "type", "name", "poster", "status", "last", "times", "pct", "mtime"], rows,
    `ON CONFLICT(uid, id) DO UPDATE SET type=excluded.type, name=excluded.name, poster=excluded.poster, status=excluded.status,
     last=excluded.last, times=excluded.times, pct=excluded.pct, mtime=excluded.mtime`);
  await upsertTitles(env, titles);
  if (watched.length) await addMany(env, user.uid, "watched", watched);
  const remaining = meta.filter(([id, mt]) => mtKey(have.get(id)) !== mtKey(mt)).length - changed.length;
  if (remaining <= 0) { try { await refreshLikes(env, user, authKey); } catch { /* likes are a bonus */ } }
  if (remaining <= 0) await db(env).prepare("UPDATE users SET hist_at=? WHERE uid=?").bind(now(), user.uid).run();
  const total = (await db(env).prepare("SELECT COUNT(*) n FROM history WHERE uid=?").bind(user.uid).first()).n;
  return { connected: true, complete: remaining <= 0, remaining: Math.max(0, remaining), titles: total };
}

/** Stremio's Like / Love buttons → Mycelium's Liked / Loved shelves (mirrored). */
export async function refreshLikes(env, user, authKey) {
  const got = await likesAll(authKey);
  if (!got) return;
  const cur = (await db(env).prepare("SELECT list, id FROM items WHERE uid=? AND list IN ('loved','liked')").bind(user.uid).all()).results;
  const del = [];
  for (const w of ["loved", "liked"]) {
    const want = new Set(got[w].map(x => x.id));
    for (const x of cur) if (x.list === w && !want.has(x.id)) del.push(x);
  }
  if (del.length) await db(env).batch(del.map(x => db(env).prepare("DELETE FROM items WHERE uid=? AND list=? AND id=?").bind(user.uid, x.list, x.id)));
  await upsertTitles(env, [...got.loved, ...got.liked]);
  if (got.loved.length) await addMany(env, user.uid, "loved", got.loved);
  if (got.liked.length) await addMany(env, user.uid, "liked", got.liked);
  return { loved: got.loved.length, liked: got.liked.length };
}

/** A change made in Mycelium, copied to Stremio's own account (Watched tick, Like / Love). Best effort. */
export async function mirrorToStremio(env, user, list, id, type, on) {
  if (!user.auth_enc || !["watched", "loved", "liked"].includes(list)) return;
  try {
    const authKey = await unseal(env, user.auth_enc);
    if (list === "watched") {
      const t = await db(env).prepare("SELECT name, poster FROM titles WHERE id=?").bind(id).first() || {};
      await setStremioWatched(authKey, { id, type, name: t.name, poster: t.poster }, on);
    } else await likeSend(authKey, id, type, on ? list : null);
  } catch { /* Stremio unreachable: Mycelium still has it */ }
}

export async function historyPage(env, user, type, filter, skip) {
  const cond = filter === "Finished" ? "status='watched'" : filter === "In progress" ? "status='progress'"
    : filter === "Rewatched" ? "times>1" : filter === "Everything I opened" ? "status!='gone'" : "status NOT IN ('opened','gone')";
  const r = await db(env).prepare(`SELECT * FROM history WHERE uid=? AND type=? AND id LIKE 'tt%' AND ${cond}
      ORDER BY last DESC LIMIT 100 OFFSET ?`).bind(user.uid, type, skip).all();
  return r.results.map(x => ({ id: x.id, type, name: x.name || x.id, poster: x.poster || undefined, posterShape: "poster",
    releaseInfo: x.status === "progress" ? `${x.pct}% watched` : (x.times > 1 ? `watched ${x.times}×` : undefined) }));
}

// ── microgenres of saved titles ─────────────────────────────────────────────
/** The microgenres most common in this person's saved titles, per type (for the lists' Microgenre dropdown). */
export async function microgenreStats(env, user) {
  const r = await db(env).prepare(`SELECT i.type, t.mg FROM items i JOIN titles t ON t.id=i.id
      WHERE i.uid=? AND t.mg LIKE ? GROUP BY i.id`).bind(user.uid, MG_TAG + "|%").all();
  const count = { movie: {}, series: {} };
  for (const x of r.results) for (const id of x.mg.split("|").slice(1).filter(Boolean)) {
    const c = count[x.type] || (count[x.type] = {}); c[id] = (c[id] || 0) + 1;
  }
  const top = {};
  const all = {};
  for (const [type, c] of Object.entries(count)) {
    const ranked = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    top[type] = ranked.slice(0, 40);
    all[type] = Object.entries(c).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 2500);   // the Library add-ons' lists
  }
  user.settings.mgTop = top;
  user.settings.mgAll = all;
  await saveSettings(env, user);
  return Object.fromEntries(Object.entries(count).map(([t, c]) => [t, Object.keys(c).length]));
}
export async function titlesMissingMg(env, uid, n) {
  return (await db(env).prepare(`SELECT DISTINCT i.id, i.type FROM items i JOIN titles t ON t.id=i.id
      WHERE i.uid=? AND (t.mg IS NULL OR t.mg NOT LIKE ?) LIMIT ?`).bind(uid, MG_TAG + "|%", n).all()).results;
}
export async function setTitleMg(env, id, type, mg) {
  await db(env).prepare(`INSERT INTO titles (id, type, name, mg, updated) VALUES (?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET mg=excluded.mg`).bind(id, type, id, mg, now()).run();
}
export async function titleMg(env, id) {
  return (await db(env).prepare("SELECT mg FROM titles WHERE id=?").bind(id).first())?.mg ?? null;
}

// ── taste: the microgenres your best-liked titles share (for the ✨ For you row) ──
export const TASTE_BASIS = ["My taste", "What I loved", "Recently watched"];
export async function tasteMicrogenres(env, uid, type, basis = "My taste") {
  const q = (sql, ...a) => db(env).prepare(sql).bind(...a).all().then(r => r.results);
  const rows = [];
  if (basis === "My taste" || basis === "What I loved")
    rows.push(...(await q(`SELECT t.mg, t.genres FROM items i JOIN titles t ON t.id=i.id WHERE i.uid=? AND i.list IN ('loved','liked') AND i.type=? AND t.mg IS NOT NULL
      ORDER BY i.added DESC LIMIT 300`, uid, type)).map(x => [x.mg, 2.5, x.genres]));
  if (basis === "My taste" || basis === "Recently watched")
    rows.push(...(await q(`SELECT t.mg, t.genres FROM items i JOIN titles t ON t.id=i.id WHERE i.uid=? AND i.list='watched' AND i.type=? AND t.mg IS NOT NULL
      ORDER BY i.added DESC LIMIT ?`, uid, type, basis === "Recently watched" ? 40 : 400)).map(x => [x.mg, 1, x.genres]));
  const score = {}, genres = {};
  for (const [mg, w, g] of rows) {
    for (const id of String(mg).split("|").slice(1).filter(Boolean)) score[id] = (score[id] || 0) + w;
    for (const n of String(g || "").split("|").filter(Boolean)) genres[n] = (genres[n] || 0) + w;
  }
  const rank = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return Object.assign(rank(score), { genres: rank(genres), seeds: rows.length });
}
/** Everything you've saved anywhere, so recommendations only suggest new things. */
export async function savedIds(env, uid) {
  const ver = await version(uid);
  const key = `saved:${uid}:${ver}`;
  const hit = await cacheGet(key);
  if (hit) return new Set(hit);
  const ids = (await db(env).prepare("SELECT DISTINCT id FROM items WHERE uid=?").bind(uid).all()).results.map(x => x.id);
  await cachePut(key, ids, 3600);
  return new Set(ids);
}
