import { genreNames } from "./catalogs.js";
import { normalizeProviders, showName } from "./providers.js";
import { MICROGENRES, MG_BY_ID, FAMILIES, FAMILY_GROUPS, familyOf, familiesOf, MG_COUNT } from "./microgenres.js";
import { LANGUAGES, LIST_SORTS, LIST_SHOW, TASTE_BASIS } from "./store.js";
import { COUNTRY_NAMES, TMDB_SORTS, WIDE_COUNTRIES } from "./catalogs.js";
import { warsFor, topicsFor, MADE_IN, SIDE_ALL, SIDE_OTHER, KINDS } from "./sides.js";

export const ADDON_ID = "community.myceliation.mycelium";
export const VERSION = "0.12.3";

const skip = { name: "skip" };
// Phones and TVs: Stremio's Android, iOS and TV apps show only the dropdown called "genre". So in the add-ons
// where the first choice is ours (a microgenre, a streaming service, a side in a war), that choice is sent as
// "genre", and TMDB's own genre moves to "and" (shown on PC). fromPhones() turns a request back.
export const SELECTOR = id => /^(mgf\.|lib\.)/.test(id) ? "microgenre" : id === "svc" ? "service" : id === "war.other" ? "kind" : /^war\./.test(id) ? "side" : null;
export function forPhones(cat) {
  const sel = SELECTOR(cat.id);
  if (!sel || !cat.extra || !cat.extra.some(e => e.name === sel)) return cat;
  const ex = cat.extra.filter(e => e.name !== "and")
    .map(e => e.name === "genre" ? { ...e, name: "and", isRequired: undefined } : e.name === sel ? { ...e, name: "genre" } : e)
    .map(e => Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined)));
  const g = ex.findIndex(e => e.name === "genre");                 // the choice first, the way Stremio expects
  if (g > 0) ex.unshift(...ex.splice(g, 1));
  return { ...cat, extra: ex };
}
export function fromPhones(id, extra) {
  const sel = SELECTOR(id);
  if (!sel || extra[sel] !== undefined || extra.genre === undefined) return extra;   // an older manifest's request
  const out = { ...extra, [sel]: extra.genre };
  if (extra.and !== undefined) out.genre = extra.and; else delete out.genre;
  delete out.and;
  return out;
}
const search = { name: "search" };
const both = (id, name, extra) => [
  { type: "movie", id, name, extra: extra("movie") },
  { type: "series", id, name, extra: extra("series") },
];

export const HISTORY_FILTERS = ["Finished & in progress", "Finished", "In progress", "Rewatched", "Everything I opened"];
export const RATING_FILTERS = ["5 stars", "4 stars and up", "3 stars and up"];
// Every filter is its own dropdown in Stremio's Discover, so they combine:
// Genre + And (a second genre) + Year + Language + Show + Sort by.
// Stremio labels a dropdown by its name ("genre" → Genre, "year" → Year, "language" → Language,
// "sort_by" → Sort by, all translated by Stremio itself).
// (worked out per request: in Workers the clock reads 1970 until a request arrives)
export const years = (type = "movie") => {
  const now = Math.max(new Date().getUTCFullYear(), 2026);
  return [...Array.from({ length: 10 }, (_, i) => String(now - i)),
    "2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "1950s",
    ...(type === "series" ? [] : ["1940s", "1930s", "1920s", "1910s"])];     // hardly any TV before the 1950s
};
const LANG_NAMES = Object.keys(LANGUAGES);
const g1 = (type, extra = []) => ({ name: "genre", options: [...extra, ...genreNames(type)] });
const g2 = type => ({ name: "and", options: genreNames(type) });
const yr = (type) => ({ name: "year", options: years(type) });
const lang = { name: "language", options: LANG_NAMES };
// your own lists (Library, named lists, shelves, Watched)
// "Microgenre": the ones most common in your own saved titles (worked out after an import)
let MG_OPTS = { movie: [], series: [] };
const mgx = type => (MG_OPTS[type] && MG_OPTS[type].length ? [{ name: "microgenre", options: MG_OPTS[type] }] : []);
export const listExtras = type => [skip, g1(type), g2(type), yr(type), lang, ...mgx(type), { name: "show", options: LIST_SHOW },
  { name: "sort_by", options: LIST_SORTS }, search];
// shelves and named lists: the dropdowns that matter most, kept small (Stremio caps how big an add-on's
// description can be in your account, and every option is repeated per row)
// (no search: the Library row already searches everything saved, so these don't add rows to Stremio's search)
const listExtra = type => [skip, g1(type), yr(type), ...mgx(type), { name: "sort_by", options: LIST_SORTS }];
// streaming services, Popular, Hidden gems, your own genres: genre + sort (+ region for services)
const SHORT_SORTS = ["Popular", "Newest", "Top rated", "Hidden gems"];
const leanExtras = (type, { region = null, sorts = SHORT_SORTS } = {}) => [skip, g1(type),
  ...(region && region.length ? [{ name: "region", options: region }] : []),
  ...(sorts.length ? [{ name: "sort_by", options: sorts }] : [])];
// TMDB-backed rows: same dropdowns, plus country of origin; sorts come from TMDB
const tmdbExtras = (type, { sorts = TMDB_SORTS(type), country = true, years = true, genreExtra = [], region = null } = {}) => [
  skip, g1(type, genreExtra), g2(type), ...(years ? [yr(type)] : []), lang,
  ...(country ? [{ name: "country", options: COUNTRY_NAMES }] : []),
  ...(region && region.length ? [{ name: "region", options: region }] : []),
  ...(sorts.length ? [{ name: "sort_by", options: sorts }] : []),
];
// kept so older cached manifests' requests still work
export const listFilters = type => ["Shuffle", "Oldest added", "Release year", "TMDB rating", "A–Z", ...genreNames(type)];

function setMgOptions(s) {
  const top = s.mgTop || {};
  for (const type of ["movie", "series"]) {
    const ids = (top[type] && top[type].length ? top[type] : (s.microgenres || [])).filter(id => MG_BY_ID[id] && MG_BY_ID[id].type === type);
    MG_OPTS[type] = ids.slice(0, 30).map(id => MG_BY_ID[id].tag);
  }
}

export function buildManifest(user, origin, lists = []) {
  const s = user.settings, r = s.rows;
  setMgOptions(s);
  const cats = [];
  // "import": the batches your library was built from (one dropdown entry per scrape)
  const batches = (s.batches || []).map(x => x.name);
  const libExtras = t => [...listExtras(t), ...(batches.length ? [{ name: "import", options: batches }] : [])];
  if (r.library) cats.push(...both("list.library", "📚 Library", libExtras));
  for (const l of lists) if (l.row) cats.push(...both(`list.l:${l.lid}`, `📋 ${l.name}`, listExtra));
  if (r.history && user.auth_enc) cats.push(...both("hist", "🕓 Watch history", () => [skip, { name: "genre", options: HISTORY_FILTERS }]));
  if (r.loved) cats.push(...both("list.loved", "❤ Loved & liked", listExtra));
  if (r.waiting) cats.push(...both("list.waiting", "⏳ Waiting for release", listExtra));
  if (r.rewatch) cats.push(...both("list.rewatch", "🔁 Rewatch", listExtra));
  // recommendations from your ratings, Loved shelf and Watched list (via the microgenres they share)
  if (r.forYou !== false) cats.push(...both("rec", "✨ For you", t => [skip, { name: "based_on", options: TASTE_BASIS }, g1(t),
    { name: "sort_by", options: ["Top rated", "Popular", "Hidden gems", "Newest"] }]));
  if (r.popular) cats.push(...both("popular", "🔥 Popular this week", t => leanExtras(t)));
  if (r.cinema) cats.push({ type: "movie", id: "cinema", name: "🎟 Only in cinemas", extra: leanExtras("movie", { sorts: [] }) });
  if (r.digital) cats.push({ type: "movie", id: "digital", name: "📦 New on digital", extra: leanExtras("movie", { sorts: [] }) });
  const regions = (s.regions && s.regions.length ? s.regions : [s.region || "US"]);
  // Home rows for the six biggest services where you live (worked out from TMDB's ranking); every service is in Discover's
  // "📺 Streaming" (Service dropdown), and "every service as a Home row" adds the Services add-ons
  const allServices = normalizeProviders(s.providers);
  // every row also shows up in Discover's catalog list, so service rows are off unless you ask for them:
  // all services live in "📺 Streaming services" (Service dropdown)
  const shownServices = s.serviceRows ? allServices
    : s.serviceHome ? (s.homeServices || []).map(k => allServices.find(p => p.key === k)).filter(Boolean).slice(0, 6) : [];
  for (const p of shownServices) {
    // the dropdown lists every region (of the ones you picked) where this service exists
    const where = p.ids["*"] ? regions : regions.filter(r => p.ids[r] != null);
    cats.push(...both(`prov.${p.key}`, `📺 ${showName(p.name)}`, t => leanExtras(t, { region: where.length > 1 ? where : null })));
  }
  // your own genres live at the end of the microgenres' "Everything else" family (no rows of their own)
  for (const mid of s.microgenres || []) {
    const m = MG_BY_ID[mid];
    if (m) cats.push({ type: m.type, id: `mg.${mid}`, name: `🍄 ${m.tag}`, extra: [skip] });
  }
  if (r.gems) cats.push(...both("gems", "💎 Hidden gems", t => leanExtras(t, { sorts: [] })));
  // Browse everything: an accurate replacement for Discover's Popular / New / year dropdowns.
  // Sort is required, so it stays off the Home board and opens on "Popular" in Discover.
  if (r.browse !== false) for (const type of ["movie", "series"]) {
    const ex = tmdbExtras(type);
    ex[ex.length - 1] = { name: "sort_by", isRequired: true, options: TMDB_SORTS(type) };
    cats.push({ type, id: "browse", name: type === "series" ? "🔎 All series" : "🔎 All films", extra: ex });
  }
  // every microgenre is browsable in Discover through the "Mycelium · Microgenres" add-ons (one per type)
  // Stremio's search: titles first (by name, exact matches on top), then the mixer and people rows, which stay quiet when
  // what you typed is a title ("Russian Ark" isn't a mix of Russian films; "May" isn't the actor called May)
  cats.push(...both("titles", "🔎 Titles", () => [{ name: "search", isRequired: true }, skip]));
  cats.push(...both("mix", "🧪 Genre mixer", () => [{ name: "search", isRequired: true }, skip]));
  // paste a list link into Stremio's search → an "import this list" tile
  cats.push({ type: "movie", id: "import", name: "📥 Import into Mycelium", extra: [{ name: "search", isRequired: true }] });
  if (r.tools) cats.unshift({ type: "movie", id: "tools", name: "🍄 Mycelium", extra: [] });
  if (r.people) {
    cats.push({ type: "movie", id: "director", name: "🎬 Films by director", extra: [{ name: "search", isRequired: true }, skip] });
    cats.push({ type: "movie", id: "actor", name: "🎭 Films with actor", extra: [{ name: "search", isRequired: true }, skip] });
  }
  // Stremio refuses add-ons whose manifest is too big ("max descriptor size reached"), so trim the
  // biggest optional parts until it fits: first the full Microgenres dropdown (your picked ones stay),
  // then the extra dropdowns on Library, then the rows' sorts.
  const size = () => JSON.stringify(cats).length;
  const LIMIT = 15000;   // old 19 KB version was accepted, the 45 KB one refused; stay well under
  if (size() > LIMIT) for (const c of cats) if (c.id === "mg") {
    const picked = MICROGENRES.filter(m => m.type === c.type && (s.microgenres || []).includes(m.id)).map(m => m.tag);
    c.extra[0].options = picked.length ? picked : MICROGENRES.filter(m => m.type === c.type).slice(0, 40).map(m => m.tag);
  }
  if (size() > LIMIT) for (const c of cats) if (c.id === "list.library") c.extra = [...listExtra(c.type), ...(batches.length ? [{ name: "import", options: batches }] : [])];
  if (size() > LIMIT) for (const c of cats) c.extra = (c.extra || []).filter(e => e.name !== "sort_by" || e.isRequired || c.id.startsWith("list."));
  if (size() > LIMIT) for (const c of cats) if (!c.id.startsWith("list.") && c.id !== "browse") c.extra = (c.extra || []).filter(e => e.isRequired || ["skip", "search"].includes(e.name));
  // still too big (dozens of services): keep the services that fit, in the order you picked them
  // still too big (dozens of services): the services that don't fit move to "Mycelium · Services N"
  // add-ons of their own (installed alongside by step 3), so every service still gets its rows
  let dropped = 0;
  const moved = [];
  while (size() > 20000) {
    const last = [...cats].reverse().find(c => c.id.startsWith("prov."));
    if (!last) break;
    for (let i = cats.length - 1; i >= 0; i--) if (cats[i].id === last.id) cats.splice(i, 1);
    moved.unshift(last.id.slice(5));
    dropped++;
  }
  LAST_MOVED = moved;
  return {
    id: ADDON_ID, version: VERSION, name: "Mycelium",
    description: "Your library, named lists and shelves (with Stremio's Like and Love) inside Stremio, plus a list scraper "
      + "(paste or link any Letterboxd / IMDb / TMDB / Wikipedia list), streaming-service rows, honest Popular / "
      + "In cinemas / New on digital, " + MG_COUNT().all.toLocaleString("en") + " microgenres and a genre mixer in search. Configure at " + origin + "/configure"
      + (dropped ? ` (${dropped} more streaming services are in the "Mycelium · Services" add-ons)` : ""),
    logo: origin + "/logo.svg",
    types: ["movie", "series"], idPrefixes: ["tt", "myc:"],
    resources: ["catalog", s.mgLinks === false ? { name: "meta", types: ["movie"], idPrefixes: ["myc:"] }
        : { name: "meta", types: ["movie", "series"], idPrefixes: ["myc:", "tt"] },
      { name: "stream", types: ["movie", "series"], idPrefixes: s.shelveButton ? ["tt", "myc:"] : ["myc:"] }],
    catalogs: cats,
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

// ── extra add-ons so every streaming service fits ───────────────────────────
// Stremio caps how big one add-on's description may be. Services that don't fit in Mycelium itself go
// into packs of 50 (plain rows, 100 per pack), and "All streaming services" puts every chosen service
// in one Discover dropdown (with genre, region and sort), one add-on per type.
let LAST_MOVED = [];
export const PACK_SIZE = 50;
export function servicePacks(user, origin, lists) {
  if (!user.settings.serviceRows) return [];
  buildManifest(user, origin, lists);
  const moved = LAST_MOVED.slice();
  const packs = [];
  for (let i = 0; i < moved.length; i += PACK_SIZE) packs.push(moved.slice(i, i + PACK_SIZE));
  return packs;
}
export function packManifest(user, origin, lists, n) {
  const packs = servicePacks(user, origin, lists);
  const keys = packs[n - 1];
  if (!keys) return null;
  const byKey = Object.fromEntries(normalizeProviders(user.settings.providers).map(p => [p.key, p]));
  const cats = [];
  for (const k of keys) if (byKey[k]) cats.push(...both(`prov.${k}`, `📺 ${showName(byKey[k].name)}`, () => [skip]));
  return {
    id: `${ADDON_ID}.services${n}`, version: VERSION, name: `Mycelium · Services ${n}`,
    description: `Streaming-service rows ${(n - 1) * PACK_SIZE + 1}–${(n - 1) * PACK_SIZE + keys.length} of yours that didn't fit in Mycelium itself. Settings at ${origin}/configure`,
    logo: origin + "/logo.svg", types: ["movie", "series"], idPrefixes: ["tt"], resources: ["catalog"], catalogs: cats,
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}
/** A War-family row that ⚔ Wars from every side has as its own row (for this type), so it lives there instead. */
export const sideShown = m => !!m.side && warsFor(m.type).some(w => w.id === m.side);
// a family's dropdown: "All" first, then A–Z (numbers in order, so decades and groups like "Oscars: …" sit together), "Everything else" last
const edge = m => m.allof ? 0 : m.catchall || m.name === "Everything else" ? 2 : 1;
const byDropdown = (a, b) => edge(a) - edge(b) || (a.sortKey || a.name).localeCompare(b.sortKey || b.name, "en", { numeric: true, sensitivity: "base" });
// The families are split over two add-ons per type (Stremio refuses an add-on whose description gets too big):
// part 1 takes families in order until it holds about half of the total.
const famCats = t => FAMILIES.map(([fam, label]) => {
  // "All: …" first, the family's "Everything else" last
  const names = MICROGENRES.filter(m => m.type === t && !sideShown(m) && familiesOf(m).includes(fam))
    .sort(byDropdown).map(m => m.name);
  return names.length ? { fam, cat: { type: t, id: `mgf.${fam}`, name: `${fam === "channels" ? "📺" : "🍄"} ${label}`, extra: [{ name: "microgenre", isRequired: true, options: names }, skip,
    { name: "genre", options: genreNames(t) }, { name: "year", options: years(t) },
    ...(["prejudice", "war", "world", "china", "eras", "awards"].includes(fam) ? [{ name: "country", options: Object.keys(WIDE_COUNTRIES) }] : []), { name: "sort_by", options: SHORT_SORTS }] } } : null;
}).filter(Boolean);
const PARTS = {};
export function mgParts(t) {
  if (PARTS[t]) return PARTS[t];
  // one add-on per lump of families (FAMILY_GROUPS), split again only if a lump is too big for Stremio to sync (~18 KB)
  const CAP = 15500, parts = [], all = famCats(t);
  for (const [label, fams] of FAMILY_GROUPS) {
    let cur = [], n = 0, k = 0;
    for (const x of all.filter(x => fams.includes(x.fam))) {
      const size = JSON.stringify(x.cat).length;
      if (n && n + size > CAP) { parts.push(Object.assign(cur, { label, k: ++k })); cur = []; n = 0; }
      cur.push(x.fam); n += size;
    }
    if (cur.length) parts.push(Object.assign(cur, { label, k: k ? k + 1 : 0 }));
  }
  // (TV channels sit next to 📺 Streaming services, in that add-on)
  const left = all.map(x => x.fam).filter(f => f !== "channels" && !parts.some(p => p.includes(f)));
  if (left.length) parts.push(Object.assign(left, { label: "More", k: 0 }));
  return (PARTS[t] = parts);
}
/** Path of the microgenre add-on ("microgenres", "microgenres2", …) that holds a family. */
export const mgPartPath = (t, fam) => { if (fam === "channels") return "allservices"; const i = mgParts(t === "series" ? "series" : "movie").findIndex(p => p.includes(fam)); return i > 0 ? `microgenres${i + 1}` : "microgenres"; };
export const mgPartCount = t => mgParts(t === "series" ? "series" : "movie").length;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
export function microgenresManifest(user, origin, type, part = 1) {
  const t = type === "series" ? "series" : "movie";
  const fams = mgParts(t)[part - 1] || [];
  const cats = famCats(t).filter(x => fams.includes(x.fam)).map(x => x.cat);

  const labels = FAMILIES.filter(([f]) => fams.includes(f)).map(([, l]) => l);
  return {
    id: `${ADDON_ID}.microgenres${part > 1 ? part : ""}.${t}`, version: VERSION,
    name: `Mycelium · ${(mgParts(t)[part - 1] || {}).label || "Microgenres"}${(mgParts(t)[part - 1] || {}).k ? " " + ROMAN[(mgParts(t)[part - 1]).k - 1] : ""} (${t === "series" ? "series" : "films"})`,
    description: `Microgenres in Discover, by family (${labels.join(", ")}): pick a family, then the microgenre ("All" for everything in it), then genre, year or sort.`,
    logo: origin + "/logo.svg", types: [t], idPrefixes: ["tt"], resources: ["catalog"], catalogs: cats.map(forPhones),
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

// 📚 Library by microgenre: your Library in Discover, one dropdown per lump of families (as in the microgenre
// add-ons), listing every microgenre at least two of your saved titles fall into, in the families' own order.
// As many add-ons as it takes to keep each one small enough for Stremio to sync.
export const LIB_ALL = "Everything in your Library";
const LIB_PARTS = new Map();
function libParts(user, t) {
  const s = user.settings, key = t + ":" + JSON.stringify(((s.mgAll || {})[t] || []).length) + ":" + ((s.mgAll || {})[t] || []).slice(0, 5).join();
  if (LIB_PARTS.has(key)) return LIB_PARTS.get(key);
  const have = new Set(((s.mgAll || {})[t] || (s.mgTop || {})[t] || []).filter(id => MG_BY_ID[id] && MG_BY_ID[id].type === t));
  const extra = listExtras(t).filter(e => e.name !== "microgenre" && e.name !== "search");
  const cats = [];
  for (const [label, fams] of FAMILY_GROUPS.map(([l, f]) => [l, f.includes("normal") ? ["channels", ...f] : f])) {
    const names = [];
    for (const fam of fams) for (const m of MICROGENRES.filter(x => x.type === t && have.has(x.id) && familyOf(x) === fam).sort(byDropdown))
      if (!names.includes(m.tag)) names.push(m.tag);
    if (names.length) cats.push({ type: t, id: `lib.${label.split(" ")[1] === "basics" ? "basics" : label.split(/[ ,&']/)[0].toLowerCase()}`,
      name: `📚 Library · ${label}`, extra: [{ name: "microgenre", isRequired: true, options: [LIB_ALL, ...names] }, ...extra] });
  }
  if (!cats.length) { LIB_PARTS.set(key, []); return []; }      // nothing saved yet: no Library add-on until there is
  const parts = [[]]; let n = 0;
  for (const c of cats) { const z = JSON.stringify(c).length; if (n && n + z > 17000) { parts.push([]); n = 0; } parts[parts.length - 1].push(c); n += z; }
  LIB_PARTS.set(key, parts);
  return parts;
}
export const libPartCount = (user, t) => libParts(user, t === "series" ? "series" : "movie").length;
export function libraryManifest(user, origin, type, part = 1) {
  const t = type === "series" ? "series" : "movie", parts = libParts(user, t), cats = parts[part - 1] || [];
  const n = cats.reduce((a, c) => a + c.extra[0].options.length - 1, 0);
  return {
    id: `${ADDON_ID}.library${part > 1 ? part : ""}.${t}`, version: VERSION,
    name: `Mycelium · Library by microgenre${parts.length > 1 ? " " + ROMAN[part - 1] : ""} (${t === "series" ? "series" : "films"})`,
    description: `Your Library in Discover by microgenre: ${n} microgenres your saved ${t === "series" ? "series" : "films"} fall into, grouped like the microgenre add-ons, then genre, year, watched or not, and sort.`,
    logo: origin + "/logo.svg", types: [t], idPrefixes: ["tt"], resources: ["catalog"], catalogs: cats.map(forPhones),
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

// Wars from every side + Prejudice, stereotypes & propaganda: one Discover add-on per type
export function sidesManifest(user, origin, type) {
  const t = type === "series" ? "series" : "movie";
  const yrs = years(t).filter(y => y.endsWith("s")), sorts = { name: "sort_by", options: SHORT_SORTS }, kind = { name: "kind", options: KINDS };
  const cats = warsFor(t).map(w => ({ type: t, id: `war.${w.id}`, name: `⚔ ${w.name}`, extra: [
    { name: "side", isRequired: true, options: [SIDE_ALL, ...w.shown.map(s => s[0]), ...(t === "movie" ? [SIDE_OTHER] : [])] }, kind, { name: "year", options: yrs }, sorts, skip] }));
  cats.push({ type: t, id: "war.other", name: "⚔ Every other war & conflict", extra: [
    { name: "kind", isRequired: true, options: ["Films and documentaries", ...KINDS] }, { name: "country", options: Object.keys(MADE_IN) },
    { name: "year", options: yrs }, sorts, skip] });
  return {
    id: `${ADDON_ID}.sides.${t}`, version: VERSION, name: `Mycelium · Wars from every side (${t === "series" ? "series" : "films"})`,
    description: "Every war seen from each side: pick a war, then whose films (by country of origin), documentaries or fiction, and decade. "
      + "(Prejudice, stereotypes and propaganda now live in the microgenres' Racism, prejudice & propaganda family.)",
    logo: origin + "/logo.svg", types: [t], idPrefixes: ["tt"], resources: ["catalog"], catalogs: cats.map(forPhones),
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

// "India (IN)" in the Streaming dropdown; the code alone where space is tight (Home rows)
let REGION_NAMES = null;
export function regionLabel(code) {
  try { REGION_NAMES ||= new Intl.DisplayNames(["en"], { type: "region" }); return `${REGION_NAMES.of(code)} (${code})`; }
  catch { return code; }
}
// ✎ Your own genres: first in Discover's list after the Library, so they ride at the top of the streaming add-on
const mineCat = (user, t) => {
  const mine = ((user && user.settings && user.settings.custom) || []).filter(c => (c.type || "movie") === t && c.query);
  return mine.length ? [{ type: t, id: "mgf.mine", name: "✎ Your own genres",
    extra: [{ name: "microgenre", isRequired: true, options: [...new Set(mine.map(c => c.name || c.query))] }, skip] }] : [];
};
export function allServicesManifest(user, origin, type) {
  const s = user.settings;
  const names = normalizeProviders(s.providers).map(p => showName(p.name).trim()).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  const regions = s.regions && s.regions.length ? s.regions : [s.region || "US"];
  const t = type === "series" ? "series" : "movie";
  return {
    id: `${ADDON_ID}.allservices.${t}`, version: VERSION, name: `Mycelium · Your genres, streaming & TV (${t === "series" ? "series" : "films"})`,
    description: `Your own genres; every streaming service you picked (${names.length}) in one Discover row, then genre, region and sort; and every TV channel's and service's own shows and films.`,
    logo: origin + "/logo.svg", types: [t], idPrefixes: ["tt"], resources: ["catalog"],
    catalogs: [...mineCat(user, t), ...(names.length ? [{ type: t, id: "svc", name: `📺 Streaming services`, extra: [
      { name: "service", isRequired: true, options: names }, skip, { name: "genre", options: genreNames(t) },
      ...(regions.length > 1 ? [{ name: "region", options: regions.map(regionLabel) }] : []), { name: "sort_by", options: SHORT_SORTS }] }] : []), ...famCats(t).filter(x => x.fam === "channels").map(x => x.cat)].map(forPhones),
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

// Watch History: its own add-on (same host and account system as Mycelium, own name)
export const HISTORY_ID = "community.myceliation.watchhistory";
export function historyManifest(user, origin) {
  setMgOptions(user.settings);
  const extra = listExtras;
  const cats = [
    { type: "movie", id: "list.watched", name: "✔ Watched", extra: extra("movie") },
    { type: "series", id: "list.watched", name: "✔ Watched", extra: extra("series") },
  ];
  if (user.auth_enc) {
    cats.push({ type: "movie", id: "hist.progress", name: "▶ Still watching", extra: [skip] });
    cats.push({ type: "series", id: "hist.progress", name: "▶ Still watching", extra: [skip] });
  }
  return {
    id: HISTORY_ID, version: VERSION, name: "Watch History",
    description: "Everything you've watched, as rows you can filter by genre, decade or language: your Stremio history "
      + "merged with anything you mark or import as watched. Works on its own; made alongside Mycelium (" + origin + "/configure). "
      + "Set up at " + origin + "/history",
    logo: origin + "/history.svg", types: ["movie", "series"], idPrefixes: ["tt"],
    resources: ["catalog", { name: "stream", types: ["movie", "series"], idPrefixes: ["tt"] }],
    catalogs: cats,
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

export function publicManifest(origin, which = "mycelium") {
  if (which === "history") return {
    id: HISTORY_ID, version: VERSION, name: "Watch History",
    description: "Everything you've watched, as filterable rows: your Stremio history plus anything you mark or import as watched. Made alongside Mycelium.",
    logo: origin + "/history.svg", types: ["movie", "series"], resources: ["catalog"], catalogs: [],
    behaviorHints: { configurable: true, configurationRequired: true },
  };
  return {
    id: ADDON_ID, version: VERSION, name: "Mycelium",
    description: "Your library, named lists and shelves inside Stremio, a shareable page of what you loved, liked and watched, a list scraper for Letterboxd / IMDb / TMDB / Wikipedia lists, streaming-service rows for any region, honest Popular / In cinemas, " + MG_COUNT().all.toLocaleString("en") + " oddly specific microgenres (" + MG_COUNT().series + " for series) and a genre mixer in search. No sign-in needed.",
    logo: origin + "/logo.svg", types: ["movie", "series"], resources: ["catalog"], catalogs: [],
    behaviorHints: { configurable: true, configurationRequired: true },
  };
}
