// TMDB watch-provider ids (subscription "flatrate" availability, per region).
// Several services have more than one id (tiers / channels) — joined with "|".
export const PROVIDERS = [
  { id: "netflix",   name: "Netflix",            tmdb: "8|175" },
  { id: "prime",     name: "Prime Video",        tmdb: "9" },
  { id: "disney",    name: "Disney+",            tmdb: "337" },
  { id: "max",       name: "Max",                tmdb: "1899|384|1825" },
  { id: "appletv",   name: "Apple TV+",          tmdb: "350" },
  { id: "hulu",      name: "Hulu",               tmdb: "15" },
  { id: "paramount", name: "Paramount+",         tmdb: "2303|2616|531|582" },
  { id: "peacock",   name: "Peacock",            tmdb: "386|387" },
  { id: "criterion", name: "Criterion Channel",  tmdb: "258" },
  { id: "mubi",      name: "MUBI",               tmdb: "11" },
  { id: "shudder",   name: "Shudder",            tmdb: "99" },
  { id: "crunchyroll", name: "Crunchyroll",      tmdb: "283|1968" },
  { id: "amcplus",   name: "AMC+",               tmdb: "526|1854" },
  { id: "starz",     name: "Starz",              tmdb: "43" },
  { id: "mgmplus",   name: "MGM+",               tmdb: "34|583" },
  { id: "britbox",   name: "BritBox",            tmdb: "151|1852" },
  { id: "kanopy",    name: "Kanopy (free with library card)", tmdb: "191" },
  { id: "hoopla",    name: "Hoopla (free with library card)", tmdb: "212" },
  { id: "tubi",      name: "Tubi (free)",        tmdb: "73" },
  { id: "pluto",     name: "Pluto TV (free)",    tmdb: "300" },
  { id: "plex",      name: "Plex (free)",        tmdb: "538" },
];
export const PROVIDER_BY_ID = Object.fromEntries(PROVIDERS.map(p => [p.id, p]));

export const REGIONS = ["US", "CA", "GB", "IE", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI", "BR", "MX", "AR", "IN", "JP", "KR"];

// TMDB genre ids by name, per media type (TMDB uses different ids for TV).
export const MOVIE_GENRES = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80, Documentary: 99, Drama: 18,
  Family: 10751, Fantasy: 14, History: 36, Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Sci-Fi": 878, Thriller: 53, War: 10752, Western: 37,
};
export const TV_GENRES = {
  "Action & Adventure": 10759, Animation: 16, Comedy: 35, Crime: 80, Documentary: 99, Drama: 18,
  Family: 10751, Kids: 10762, Mystery: 9648, Reality: 10764, "Sci-Fi & Fantasy": 10765,
  Soap: 10766, Talk: 10767, "War & Politics": 10768, Western: 37,
};

// A service is stored once by name, with the TMDB provider id it has in each
// region (Amazon, for one, uses different ids in different countries):
//   { name: "Amazon Prime Video", ids: { US: "9", GB: "9", IN: "119" } }
// "*" means "same id everywhere / region unknown" (older settings).
export const slug = name => String(name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "service";
// "Disney Plus" and "Disney+", "Shudder Amazon Channel", "Netflix Standard with Ads", "Paramount Plus
// Premium"… are the same service sold different ways: one row, querying all of their ids at once
export function canonicalService(name) {
  let c = String(name || "").trim();
  c = c.replace(/\s+(Amazon|Apple TV|Apple|Roku Premium|Roku|Prime Video|Pluto TV|Samsung TV Plus)\s+Channels?$/i, "");
  c = c.replace(/\s+(Standard|Basic|Premium)?\s*with Ads$/i, "").replace(/\s+Premium(\s+Plus)?$/i, "");
  c = c.replace(/\s+Plus$/i, "+").replace(/\s*\+\s*$/, "+");
  return c.toLowerCase().replace(/[^a-z0-9+]/g, "") || slug(name);
}
/** How a service reads in Stremio: "Shudder Amazon Channel" → "Shudder (Amazon)", "MUBI Apple TV Channel" → "MUBI (Apple TV)". */
export const showName = n => String(n || "")
  .replace(/\s+(Amazon|Prime Video)\s+Channels?$/i, " (Amazon)").replace(/\s+(Apple TV|Apple)\s+Channels?$/i, " (Apple TV)")
  .replace(/\s+Roku Premium\s+Channels?$/i, " (Roku)").replace(/\s+(Roku|Pluto TV|Samsung TV Plus)\s+Channels?$/i, " ($1)")
  .replace(/\s+Channels?$/i, "");
const nicer = (a, b) => (!a ? b : (b.length < a.length && !/channel|with ads/i.test(b)) || /channel|with ads/i.test(a) ? b : a);
export function normalizeProviders(list) {
  const out = new Map();
  for (const p of list || []) {
    let e = null;
    if (p && typeof p === "object" && p.ids && typeof p.ids === "object") {
      e = { name: String(p.name || "").slice(0, 60), ids: {} };
      for (const [r, id] of Object.entries(p.ids)) if ((r === "*" || /^[A-Z]{2}$/.test(r)) && /^[\d|]+$/.test(String(id))) e.ids[r] = String(id);
    } else if (p && typeof p === "object" && p.id) {
      e = { name: String(p.name || p.id).slice(0, 60), ids: {} };
      if (Array.isArray(p.r) && p.r.length) for (const r of p.r) e.ids[r] = String(p.id); else e.ids["*"] = String(p.id);
    } else if (PROVIDER_BY_ID[p]) {
      e = { name: PROVIDER_BY_ID[p].name, ids: { "*": PROVIDER_BY_ID[p].tmdb } };
    }
    if (!e || !e.name || !Object.keys(e.ids).length) continue;
    const c = canonicalService(e.name);
    const have = out.get(c);
    if (!have) { out.set(c, { ...e, key: slug(e.name) }); continue; }
    for (const [r, id] of Object.entries(e.ids)) {             // same region, several ids → "a|b"
      const ids = new Set(String(have.ids[r] || "").split("|").filter(Boolean));
      String(id).split("|").forEach(x => ids.add(x));
      have.ids[r] = [...ids].join("|");
    }
    const name = nicer(have.name, e.name);
    if (name !== have.name) { have.name = name; have.key = slug(name); }
  }
  return [...out.values()];
}
/** Which region a service row shows by default, and the id to query there. */
// when your home region doesn't have a service, use the biggest market (of your regions) that does,
// rather than whichever comes first alphabetically
const BIG = ["US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI", "IE", "NZ", "JP", "KR", "BR", "MX", "IN", "BE", "AT", "CH", "PL", "PT"];
export function providerTarget(p, regions, pick) {
  const has = r => p.ids[r] != null;
  const ranked = [regions[0], ...BIG.filter(r => regions.includes(r)), ...regions];
  // a region you chose that this service isn't in shows nothing, rather than quietly showing another country
  if (pick && !has(pick) && !p.ids["*"]) return { region: pick, id: null };
  const region = pick && (has(pick) || p.ids["*"]) ? pick
    : ranked.find(has) || (p.ids["*"] ? regions[0] : Object.keys(p.ids).find(r => r !== "*")) || "US";
  return { region, id: p.ids[region] || p.ids["*"] };
}
