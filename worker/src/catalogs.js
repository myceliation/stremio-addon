import { tmdb } from "./tmdb.js";
import { MOVIE_GENRES, TV_GENRES, normalizeProviders, providerTarget, showName } from "./providers.js";
import { MG_BY_ID, futureItems } from "./microgenres.js";
import { today, daysAgo, cacheGet, cachePut, room } from "./util.js";

const BIG = ["US", "GB", "DE", "FR", "CA", "AU", "JP", "KR", "IN", "BR", "ES", "IT", "NL", "SE", "MX"];
/** Where a service has the most titles, among your regions (cached a week per service and type). */
export async function bestRegion(env, type, p, regions) {
  const avail = p.ids["*"] ? regions : regions.filter(r => p.ids[r] != null);
  if (!avail.length) return regions[0];
  if (avail.length === 1) return avail[0];
  const key = `best:${type}:${p.key || p.name}:${avail.length}`;
  const hit = await cacheGet(key);
  if (hit) return hit;
  // check the home region, the big markets and a few more: at most 8 TMDB counts, then remembered
  const cands = [...new Set([regions[0], ...BIG, ...avail].filter(r => avail.includes(r)))].slice(0, 8);
  let best = cands[0], most = -1;
  for (const r of cands) {
    if (!room(6)) break;
    try {
      const d = await tmdb(env, `/discover/${type === "series" ? "tv" : "movie"}`, { with_watch_providers: p.ids[r] || p.ids["*"], watch_region: r,
        with_watch_monetization_types: "flatrate|free|ads" }, null, 7 * 86400);
      if ((d.total_results || 0) > most) { most = d.total_results || 0; best = r; }
    } catch { break; }
  }
  await cachePut(key, best, 7 * 86400);
  return best;
}
import { LANGUAGES } from "./store.js";

const kindOf = type => (type === "series" ? "tv" : "movie");
const genreMap = type => (type === "series" ? TV_GENRES : MOVIE_GENRES);
export const genreNames = type => Object.keys(genreMap(type));

export function genreId(type, name) {
  if (!name) return null;
  return genreMap(type)[name] ?? null;
}

// ── the shared dropdowns: Genre, And, Year, Language, Country, Sort by ──────────
export const COUNTRIES_BY_NAME = {
  "United States": "US", "United Kingdom": "GB", Ireland: "IE", Canada: "CA", Australia: "AU", "New Zealand": "NZ",
  France: "FR", Italy: "IT", Spain: "ES", Germany: "DE", Belgium: "BE", Netherlands: "NL", Sweden: "SE",
  Denmark: "DK", Norway: "NO", Finland: "FI", Iceland: "IS", Poland: "PL", Czechia: "CZ", Hungary: "HU",
  Romania: "RO", Greece: "GR", Russia: "RU", "Soviet Union": "SU", Turkey: "TR", Iran: "IR", Israel: "IL",
  Egypt: "EG", Nigeria: "NG", "South Africa": "ZA", India: "IN", Thailand: "TH", Philippines: "PH",
  Indonesia: "ID", China: "CN", "Hong Kong": "HK", Taiwan: "TW", Japan: "JP", "South Korea": "KR",
  Mexico: "MX", Brazil: "BR", Argentina: "AR",
};
export const COUNTRY_NAMES = Object.keys(COUNTRIES_BY_NAME);
// the longer list used by the war, prejudice and world families' Country dropdown
export const WIDE_COUNTRIES = {
  "United States": "US", "United Kingdom": "GB", Ireland: "IE", Canada: "CA", Australia: "AU", "New Zealand": "NZ", France: "FR", Germany: "DE",
  "East Germany": "DD", Italy: "IT", Spain: "ES", Portugal: "PT", Netherlands: "NL", Belgium: "BE", Austria: "AT", Switzerland: "CH", Sweden: "SE",
  Denmark: "DK", Norway: "NO", Finland: "FI", Iceland: "IS", Poland: "PL", Czechia: "CZ|CS", Slovakia: "SK", Hungary: "HU", Romania: "RO",
  Bulgaria: "BG", Greece: "GR", Serbia: "RS|YU", "Bosnia and Herzegovina": "BA", Croatia: "HR", Slovenia: "SI", Kosovo: "XK", Albania: "AL",
  Russia: "RU", "Soviet Union": "SU", Ukraine: "UA", Belarus: "BY", Georgia: "GE", Armenia: "AM", Azerbaijan: "AZ", Kazakhstan: "KZ",
  Turkey: "TR", Israel: "IL", Palestine: "PS", Lebanon: "LB", Syria: "SY", Jordan: "JO", Iraq: "IQ", Iran: "IR", "Saudi Arabia": "SA",
  Egypt: "EG", Algeria: "DZ", Morocco: "MA", Tunisia: "TN", Afghanistan: "AF", Pakistan: "PK", India: "IN", Bangladesh: "BD", "Sri Lanka": "LK",
  Nepal: "NP", China: "CN", "Hong Kong": "HK", Taiwan: "TW", Japan: "JP", "South Korea": "KR", "North Korea": "KP", Mongolia: "MN",
  Vietnam: "VN", Cambodia: "KH", Thailand: "TH", Myanmar: "MM", Indonesia: "ID", Malaysia: "MY", Singapore: "SG", Philippines: "PH",
  Nigeria: "NG", Ghana: "GH", Senegal: "SN", Mali: "ML", "Burkina Faso": "BF", Ethiopia: "ET", Kenya: "KE", Rwanda: "RW", "South Africa": "ZA",
  "DR Congo": "CD", Mexico: "MX", Cuba: "CU", Brazil: "BR", Argentina: "AR", Chile: "CL", Colombia: "CO", Peru: "PE", Venezuela: "VE", Bolivia: "BO",
};
export const TMDB_SORTS = type => ["Popular", "Newest", "Oldest", "Top rated", "Most voted",
  ...(type === "series" ? [] : ["Box office"]), "Hidden gems"];

/** Layer the dropdown choices onto a TMDB /discover query. */
export function applyFilters(type, extra, params, { years = true } = {}) {
  const p = { ...params };
  const dk = type === "series" ? "first_air_date" : "primary_release_date";
  const gs = [extra.genre, extra.and].map(g => genreId(type, g)).filter(Boolean).map(String);
  if (gs.length) {
    const have = p.with_genres ? String(p.with_genres) : "";
    p.with_genres = have.includes("|") ? [have, ...gs].join(",") : [...new Set([...have.split(",").filter(Boolean), ...gs])].join(",");
  }
  let narrow = gs.length > 1;
  const y = String(extra.year || "");
  if (years && /^\d{4}$/.test(y)) { p[`${dk}.gte`] = `${y}-01-01`; p[`${dk}.lte`] = `${y}-12-31`; narrow = true; }
  else if (years && /^\d{3}0s$/.test(y)) { const a = +y.slice(0, 4); p[`${dk}.gte`] = `${a}-01-01`; p[`${dk}.lte`] = `${a + 9}-12-31`; narrow = true; }
  if (extra.language && LANGUAGES[extra.language]) { p.with_original_language = LANGUAGES[extra.language]; narrow = true; }
  if (extra.country && COUNTRIES_BY_NAME[extra.country]) { p.with_origin_country = COUNTRIES_BY_NAME[extra.country]; narrow = true; }
  const minVotes = (n) => { p["vote_count.gte"] = n; };
  switch (extra.sort_by) {
    case "Popular": p.sort_by = "popularity.desc"; break;
    case "Newest": p.sort_by = `${dk}.desc`; if (!p[`${dk}.lte`] || p[`${dk}.lte`] > today()) p[`${dk}.lte`] = today(); minVotes(narrow ? 1 : 3); break;
    case "Oldest": p.sort_by = `${dk}.asc`; minVotes(narrow ? 3 : 10); break;
    case "Top rated": p.sort_by = "vote_average.desc"; minVotes(narrow ? 40 : 250); delete p["vote_count.lte"]; break;
    case "Most voted": p.sort_by = "vote_count.desc"; break;
    case "Box office": p.sort_by = "revenue.desc"; break;
    case "Hidden gems": p.sort_by = "vote_average.desc"; minVotes(narrow ? 15 : 40); p["vote_count.lte"] = 1500; p["vote_average.gte"] = 6.6; break;
  }
  return p;
}
const filtered = extra => !!(extra.and || extra.year || extra.language || extra.country || extra.sort_by);

/** Each builder returns {path, params, keep?} for pagedCatalog. */
export const BUILDERS = {
  // "Popular" that tracks what people are actually watching this week, minus the barely-rated noise.
  // With any extra dropdown chosen it switches to TMDB's popularity ranking so the filters can apply.
  popular(type, extra) {
    if (filtered(extra)) return this.browse(type, { sort_by: "Popular", ...extra });
    const g = genreId(type, extra.genre);
    return {
      path: `/trending/${kindOf(type)}/week`, params: {},
      keep: it => it.votes >= 30 && (!g || it.genres.includes(g)),
    };
  },

  // Everything, with every dropdown — the accurate version of Discover's Popular / New / Year
  browse(type, extra) {
    return {
      path: `/discover/${kindOf(type)}`,
      params: applyFilters(type, { sort_by: "Popular", ...extra }, {
        sort_by: "popularity.desc", "vote_count.gte": 10, ...(type === "series" ? (["Talk", "News"].includes(extra.genre) || ["Talk", "News"].includes(extra.and) ? {} : { without_genres: "10767,10763" }) : { "with_runtime.gte": 40 }),   // no shorts or music videos
      }),
    };
  },

  // In cinemas and *not yet* on digital/streaming in your region
  async cinema(type, extra, ctx) {
    const region = ctx.settings.region || "US";
    const digital = await digitalSet(ctx.env, region, ctx.budget);
    return {
      path: "/discover/movie",
      params: applyFilters("movie", { ...extra, year: null, sort_by: null }, {
        region, with_release_type: "3|2", "release_date.gte": daysAgo(75), "release_date.lte": today(),
        sort_by: "popularity.desc", "vote_count.gte": 5,
      }),
      keep: it => !digital.has(it.tmdb),
    };
  },

  // Just landed on digital / streaming — usually the moment a "waiting" film is watchable
  digital(type, extra, ctx) {
    return {
      path: "/discover/movie",
      params: applyFilters("movie", { ...extra, year: null, sort_by: null }, {
        region: ctx.settings.region || "US", with_release_type: "4|5",
        "release_date.gte": daysAgo(45), "release_date.lte": today(),
        sort_by: "popularity.desc", "vote_count.gte": 10,
      }),
    };
  },

  // Loved by the people who saw them, seen by few
  gems(type, extra) {
    return {
      path: `/discover/${kindOf(type)}`,
      params: applyFilters(type, { ...extra, sort_by: null }, {
        sort_by: "vote_average.desc", "vote_count.gte": 150, "vote_count.lte": 2500,
        "vote_average.gte": 7.2, without_genres: "10767,10764,10763",
      }),
    };
  },

  // A streaming service. The Region dropdown picks which country's catalogue (of the regions you chose).
  async provider(type, extra, ctx, arg) {
    const p = normalizeProviders(ctx.settings.providers).find(x => x.key === arg)
      || (/^[\d|]+$/.test(arg || "") ? { ids: { "*": arg } } : null);     // old numeric ids
    if (!p) return null;
    const regions = ctx.settings.regions && ctx.settings.regions.length ? ctx.settings.regions : [ctx.settings.region || "US"];
    const legacy = extra.genre || "";
    const pick = (String(extra.region || "").match(/([A-Z]{2})\)?$/) || [])[1] || (legacy.match(/^Region: ([A-Z]{2})$/) || [])[1];
    // the region you picked, if this service is there; otherwise the region where it has the most titles
    // (RTL+ → Germany, PBS → US), so switching service with a region still selected never comes up empty
    const has = r => p.ids[r] != null || p.ids["*"] != null;
    const region = pick && has(pick) ? pick : await bestRegion(ctx.env, type, p, regions);
    const id = p.ids[region] || p.ids["*"];
    if (!id) return null;
    const ex = { ...extra };
    if (legacy === "New arrivals") { ex.sort_by = "Newest"; ex.genre = null; }
    if (pick && legacy.startsWith("Region: ")) ex.genre = null;
    return {
      path: `/discover/${kindOf(type)}`,
      params: applyFilters(type, ex, {
        with_watch_providers: id, watch_region: region,
        with_watch_monetization_types: "flatrate|free|ads",
        sort_by: "popularity.desc",              // no vote floor: small services' whole catalogue, popular first
      }),
    };
  },

  // "All streaming films / series": the service comes from the Service dropdown
  async allServices(type, extra, ctx) {
    const want = String(extra.service || "").trim();
    const p = normalizeProviders(ctx.settings.providers).find(x => x.name.trim() === want || showName(x.name).trim() === want);
    return p ? this.provider(type, extra, ctx, p.key) : null;
  },

  // ✨ For you: TMDB titles carrying the keywords of the microgenres your best-liked titles share
  async forYou(type, extra, ctx) {
    const { tasteMicrogenres } = await import("./store.js");
    const ids = await tasteMicrogenres(ctx.env, ctx.uid, type, extra.based_on || "My taste");
    // your strongest 40-odd keywords, a different dozen of them each day, so the row moves even when your taste doesn't
    const pool = [];
    for (const id of ids) {
      const m = MG_BY_ID[id];
      const k = m && m.params && m.params.with_keywords;
      if (k && !String(k).includes(",")) pool.push(...String(k).split("|"));
      if (pool.length >= 40) break;
    }
    const uniq = [...new Set(pool)], day = Math.floor(Date.now() / 864e5);
    const start = uniq.length > 12 ? (day * 7) % (uniq.length - 11) : 0;
    const kws = uniq.slice(0, 4).concat(uniq.slice(4 + start, 4 + start + 8));
    if (!kws.length) return null;
    // keep it to your two strongest genres, so a shared "remake" or "Halloween" keyword doesn't pull in anything at all
    const gids = (ids.genres || []).map(n => genreId(type, n) ?? genreId(type, ({ "Science Fiction": "Sci-Fi", "Sci-Fi": "Sci-Fi & Fantasy" })[n]))
      .filter(Boolean).slice(0, 2);
    return {
      path: `/discover/${kindOf(type)}`,
      params: applyFilters(type, { sort_by: "Top rated", ...extra }, { sort_by: "popularity.desc", "vote_count.gte": 30,
        with_keywords: [...new Set(kws)].join("|"), without_genres: type === "series" ? "10767,10763" : "16,10751",
        ...(gids.length && !extra.genre ? { with_genres: gids.join("|") } : {}) }),
    };
  },

  microgenre(type, extra, ctx, arg) {
    const m = MG_BY_ID[arg] || Object.values(MG_BY_ID).find(x => x.name === extra.genre && x.type === type);
    if (!m) return null;
    if (m.future) return { static: futureItems(m) };                 // futures: split by today's date
    if (m.items && !m.params) return { static: m.items };            // hand-picked only
    // everything TMDB has for it: keyword microgenres drop the vote floor entirely (popular first,
    // the obscure tail after); genre-only ones keep a small floor so they aren't swamped by empty entries
    const base = { ...m.params };
    for (const k of Object.keys(base)) if (base[k] === "today") base[k] = new Date().toISOString().slice(0, 10);
    // (rows sorted by rating or box office keep their own floor, or a handful of votes would top them)
    if (/^(vote_average|revenue)/.test(base.sort_by || "")) { /* keep it */ }
    else if (base.with_keywords) delete base["vote_count.gte"];
    else base["vote_count.gte"] = Math.min(+base["vote_count.gte"] || 0, 10);
    const params = arg ? applyFilters(m.type, extra, base) : base;
    if (arg && extra.country && !COUNTRIES_BY_NAME[extra.country] && WIDE_COUNTRIES[extra.country]) params.with_origin_country = WIDE_COUNTRIES[extra.country];
    return { path: `/discover/${kindOf(m.type)}`, params, ...(m.items ? { static: m.items } : {}) };   // hand-picked first, then TMDB
  },

  async mixer(type, extra, ctx, arg) {
    const q = extra.search || arg;
    if (!q) return null;
    let parsed = await parseMix(ctx.env, q, type, ctx.budget);
    if (!parsed) return null;
    const { named = [], signal, ...rest } = parsed;
    // in Stremio's search, only answer descriptions ("slow 70s swedish horror"), not plain titles
    if (extra.fromSearch && !signal) return null;
    parsed = applyFilters(type, { ...extra, search: null }, rest);
    const path = `/discover/${kindOf(type)}`;
    // titles named in the description ("like Come and See"), first in the row
    const items = [];
    for (const n of named) {
      try {
        const res = (await tmdb(ctx.env, `/search/${kindOf(type)}`, { query: n }, ctx.budget, 30 * 86400)).results || [];
        const same = res.filter(r => (r.title || r.name || "").toLowerCase() === n.toLowerCase()).sort((a, b) => b.vote_count - a.vote_count);
        const hit = same[0] || res[0];
        if (!hit) continue;
        const ex = await tmdb(ctx.env, `/${kindOf(type)}/${hit.id}/external_ids`, {}, ctx.budget, 30 * 86400);
        if (ex.imdb_id) items.push({ id: ex.imdb_id, name: hit.title || hit.name, year: (hit.release_date || hit.first_air_date || "").slice(0, 4),
          poster: hit.poster_path ? `https://image.tmdb.org/t/p/w342${hit.poster_path}` : null });
      } catch { break; }
    }
    // fallbacks, tried in order when a stricter version comes back empty
    const fallbacks = [];
    if (parsed.with_keywords && parsed.with_keywords.includes(",")) fallbacks.push({ ...parsed, with_keywords: parsed.with_keywords.replace(/,/g, "|") });
    if (parsed.with_keywords && (parsed.with_genres || parsed.with_origin_country)) { const { with_keywords, ...rest } = parsed; fallbacks.push(rest); }
    const searchable = parsed.with_genres || parsed.with_keywords || parsed.with_origin_country || parsed[`${type === "series" ? "first_air_date" : "primary_release_date"}.gte`];
    return { path: searchable ? path : null, params: parsed, fallbacks, ...(items.length ? { static: items } : {}) };
  },
};

async function digitalSet(env, region, budget) {
  // titles already on digital/streaming in this region (one cache entry, rebuilt every 6h)
  const key = `digitalset:${region}:${today()}`;
  const hit = await cacheGet(key);
  if (hit) return new Set(hit);
  const ids = new Set();
  for (let page = 1; page <= 4 && room(8); page++) {
    try {
      const d = await tmdb(env, "/discover/movie", {
        region, with_release_type: "4|5", "release_date.gte": daysAgo(400), "release_date.lte": today(),
        sort_by: "popularity.desc", page,
      }, budget);
      (d.results || []).forEach(r => ids.add(r.id));
      if (page >= (d.total_pages || 1)) break;
    } catch { break; }
  }
  await cachePut(key, [...ids], 6 * 3600);
  return ids;
}

// ── Genre mixer: "slow 70s japanese horror", "best korean crime series" ──────

const SYN_MOVIE = {
  action: [28], adventure: [12], animated: [16], animation: [16], cartoon: [16], comedy: [35], comedies: [35],
  funny: [35], crime: [80], documentary: [99], documentaries: [99], doc: [99], docs: [99], drama: [18],
  dramas: [18], family: [10751], kids: [10751], fantasy: [14], history: [36], historical: [36],
  horror: [27], scary: [27], music: [10402], musical: [10402], musicals: [10402], mystery: [9648],
  romance: [10749], romantic: [10749], romcom: [10749, 35], "rom-com": [10749, 35], scifi: [878],
  "sci-fi": [878], sf: [878], thriller: [53], thrillers: [53], war: [10752], western: [37], westerns: [37],
};
const SYN_TV = {
  action: [10759], adventure: [10759], animated: [16], animation: [16], cartoon: [16], comedy: [35],
  sitcom: [35], funny: [35], crime: [80], documentary: [99], docuseries: [99], doc: [99], drama: [18],
  family: [10751], kids: [10762], fantasy: [10765], scifi: [10765], "sci-fi": [10765], mystery: [9648],
  reality: [10764], war: [10768], political: [10768], western: [37],
};
const COUNTRIES = {
  japan: "JP", japanese: "JP", korea: "KR", korean: "KR", france: "FR", french: "FR", italy: "IT",
  italian: "IT", germany: "DE", german: "DE", spain: "ES", spanish: "ES", mexico: "MX", mexican: "MX",
  india: "IN", indian: "IN", bollywood: "IN", china: "CN", chinese: "CN", "hong kong": "HK", hk: "HK",
  taiwan: "TW", taiwanese: "TW", british: "GB", uk: "GB", english: "GB", irish: "IE", ireland: "IE",
  swedish: "SE", sweden: "SE", danish: "DK", denmark: "DK", norwegian: "NO", norway: "NO",
  finnish: "FI", icelandic: "IS", russian: "RU", soviet: "SU", polish: "PL", czech: "CZ",
  hungarian: "HU", brazilian: "BR", brazil: "BR", argentine: "AR", argentinian: "AR", iranian: "IR",
  thai: "TH", turkish: "TR", australian: "AU", canadian: "CA", nigerian: "NG", nollywood: "NG",
  american: "US", greek: "GR", belgian: "BE", dutch: "NL", filipino: "PH", indonesian: "ID",
  egyptian: "EG", "south african": "ZA", nordic: "SE|DK|NO|FI|IS", scandinavian: "SE|DK|NO",
};
const STOP = new Set(["movie", "movies", "film", "films", "series", "show", "shows", "tv", "about", "with",
  "and", "the", "a", "an", "of", "from", "in", "set", "that", "are", "is", "to", "for", "like", "on",
  "slow", "slowburn", "weird", "cool", "fun", "good", "great", "really", "very", "some", "kind", "type",
  "stuff", "things", "where", "when", "who", "made", "era", "style", "vibe", "vibes", "genre",
  "intense", "intensely", "depiction", "depictions", "depicting", "depicted", "showing", "shows", "portrayal", "portrayals",
  "endless", "awful", "terrible", "movies", "everything", "anything", "lots", "lot", "but", "or", "not", "just", "feel", "feels"]);
// mood words TMDB has no keyword for, mapped to keyword groups that carry them
const THEMES = [
  [/\b(brutal|harrowing|dehumani[sz]\w*|atrocit\w*|genocid\w*|massacres?|war crimes?|horrors?|grim|unflinching|traumati[sz]\w*)\b/g,
    "1327|11872|14900|190351|212423|14546|9281"],
];

export async function parseMix(env, raw, type, budget) {
  // "… like Come and See or Conspiracy": the named titles go first in the row; the clause is not searched as keywords
  const named = [];
  raw = raw.replace(/\b(?:like|such as|similar to|e\.?g\.?)\s+(.+)$/i, (m, list) => {
    for (const t of list.split(/\s*(?:,|;|\bor\b)\s*/i)) { const n = t.replace(/[."']/g, "").trim(); if (n) named.push(n); }
    return " ";
  });
  let q = " " + raw.toLowerCase().replace(/[^\p{L}\p{N}\s\-+&]/gu, " ") + " ";
  const p = { sort_by: "popularity.desc", "vote_count.gte": 15 };
  const genres = new Set();
  const syn = type === "series" ? SYN_TV : SYN_MOVIE;
  const dateKey = type === "series" ? "first_air_date" : "primary_release_date";

  // decades / years
  q = q.replace(/\b(19|20)?(\d)0'?s\b/g, (m, c, d) => {
    const century = c || (+d >= 2 ? "19" : "20");
    const start = +(century + d + "0");
    p[`${dateKey}.gte`] = `${start}-01-01`; p[`${dateKey}.lte`] = `${start + 9}-12-31`;
    return " ";
  });
  q = q.replace(/\b(19\d\d|20\d\d)\s*[-–]\s*(19\d\d|20\d\d)\b/, (m, a, b) => {
    p[`${dateKey}.gte`] = `${a}-01-01`; p[`${dateKey}.lte`] = `${b}-12-31`; return " ";
  });
  q = q.replace(/\b(19\d\d|20\d\d)\b/, (m, y) => {
    p[`${dateKey}.gte`] = `${y}-01-01`; p[`${dateKey}.lte`] = `${y}-12-31`; return " ";
  });
  // ranking words
  if (/\b(best|top|acclaimed|greatest|masterpiece)s?\b/.test(q)) {
    p.sort_by = "vote_average.desc"; p["vote_count.gte"] = 300;
  }
  if (/\b(obscure|hidden|underrated|forgotten|gems?)\b/.test(q)) {
    p.sort_by = "vote_average.desc"; p["vote_count.gte"] = 40; p["vote_count.lte"] = 1500; p["vote_average.gte"] = 6.6;
  }
  if (/\b(new|newest|recent|latest)\b/.test(q)) {
    p.sort_by = `${dateKey}.desc`; p[`${dateKey}.lte`] = today();
  }
  if (/\bclassics?\b/.test(q) && !p[`${dateKey}.lte`]) { p[`${dateKey}.lte`] = "1979-12-31"; p["vote_count.gte"] = 100; }
  if (/\bmodern\b/.test(q) && !p[`${dateKey}.gte`]) p[`${dateKey}.gte`] = "2010-01-01";
  q = q.replace(/\b(classics?|modern)\b/g, " ");
  q = q.replace(/\b(best|top|acclaimed|greatest|masterpieces?|obscure|hidden|underrated|forgotten|gems?|new|newest|recent|latest|good|great)\b/g, " ");
  // countries (two-word first)
  for (const [k, v] of Object.entries(COUNTRIES).sort((a, b) => b[0].length - a[0].length)) {
    const re = new RegExp(`\\b${k}\\b`);
    if (re.test(q)) {
      p.with_origin_country = p.with_origin_country ? p.with_origin_country + "|" + v : v;
      q = q.replace(re, " ");
    }
  }
  if (/\banime\b/.test(q)) { genres.add(16); p.with_original_language = "ja"; q = q.replace(/\banime\b/, " "); }
  // genres
  for (const w of q.split(/\s+/)) {
    if (syn[w]) { syn[w].forEach(g => genres.add(g)); q = q.replace(new RegExp(`\\b${w.replace(/[-+]/g, "\\$&")}\\b`), " "); }
  }
  if (genres.size) p.with_genres = [...genres].join(",");

  const kwIds = [];
  let themed = false;
  const ranked = p.sort_by !== "popularity.desc";
  for (const [re, ids] of THEMES) if (re.test(q)) {
    themed = true;
    kwIds.push(ids); q = q.replace(re, " ");
    if (p.sort_by === "popularity.desc") { p.sort_by = "vote_average.desc"; p["vote_count.gte"] = 80; }   // the acclaimed ones first
  }
  // whatever's left → TMDB keywords ("swamp", "time loop", "witch", "road trip"…); at most 6 lookups so a long
  // description can't use up the request allowance
  const words = q.split(/\s+/).filter(w => w && !STOP.has(w)).slice(0, 6);
  for (let i = 0; i < words.length; i++) {
    let found = null;
    if (i + 1 < words.length) found = await keywordId(env, `${words[i]} ${words[i + 1]}`, budget);
    if (found) { kwIds.push(found); i++; continue; }
    found = await keywordId(env, words[i], budget) || await keywordId(env, words[i].replace(/s$/, ""), budget);
    if (found) kwIds.push(found);
  }
  if (kwIds.length) p.with_keywords = kwIds.join(",");
  if (named.length) p.named = named.slice(0, 4);
  p.signal = !!(genres.size || p.with_origin_country || p[`${dateKey}.gte`] || themed || ranked);
  if (!genres.size && !kwIds.length && !p.with_origin_country && !p[`${dateKey}.gte`] && !named.length) return null;
  return p;
}

async function keywordId(env, term, budget) {
  try {
    const d = await tmdb(env, "/search/keyword", { query: term }, budget, 30 * 86400);
    const exact = (d.results || []).find(r => r.name.toLowerCase() === term);
    return exact ? exact.id : null;
  } catch { return null; }
}
