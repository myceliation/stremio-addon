// "Wars from every side" and "Prejudice, stereotypes & propaganda": two Discover hubs built on TMDB keywords
// and origin countries. Counts are TMDB's (checked when this file was made) and only decide which rows/options show.
import { applyFilters } from "./catalogs.js";
import { SIDE_PICKS } from "./sidepicks.js";
export { SIDE_PICKS };

export const WARS = [{"id": "ww1", "name": "World War I", "kw": "2504|205326", "n": {"movie": 609, "series": 121}, "sides": [["British", "GB", 105, 54], ["French", "FR", 83, 9], ["German", "DE", 50, 7], ["American", "US", 269, 13], ["Australian & NZ", "AU|NZ", 23, 11], ["Italian", "IT", 14, 1], ["Russian", "SU|RU", 10, 4], ["Turkish", "TR", 4, 1], ["Canadian", "CA", 25, 2]]},
  {"id": "spanish", "name": "Spanish Civil War", "kw": "5509|252639", "n": {"movie": 347, "series": 12}, "sides": [["Spanish", "ES", 277, 10], ["British", "GB", 6, 2], ["Soviet & Russian", "SU|RU", 3, 0], ["Mexican", "MX", 6, 0]]},
  {"id": "sinojapanese", "name": "Second Sino-Japanese War", "kw": "321999|10535|217895|190931", "n": {"movie": 36, "series": 13}, "sides": [["Chinese", "CN|HK|TW", 22, 13], ["Japanese", "JP", 4, 0], ["American", "US", 6, 0]]},
  {"id": "ww2", "name": "World War II", "kw": "1956|9525|336082", "n": {"movie": 3230, "series": 490}, "sides": [["American", "US", 1254, 104], ["British", "GB", 430, 129], ["Soviet & Russian", "SU|RU", 117, 23], ["German", "DE", 228, 54], ["Japanese", "JP", 108, 11], ["French", "FR", 352, 39], ["Italian", "IT", 113, 8], ["Polish", "PL", 58, 7], ["Chinese", "CN|HK|TW", 34, 9], ["Dutch", "NL", 52, 4], ["Norwegian", "NO", 37, 9], ["Yugoslav", "YU|RS|HR|BA|SI", 129, 6], ["Czech & Slovak", "CZ|CS|SK", 47, 7], ["Finnish", "FI", 35, 3], ["Australian", "AU|NZ", 42, 21], ["Indian", "IN", 9, 0], ["Korean", "KR", 7, 0]]},
  {"id": "korea", "name": "Korean War", "kw": "373511|197794|3264", "n": {"movie": 191, "series": 16}, "sides": [["South Korean", "KR", 77, 6], ["North Korean", "KP", 3, 0], ["Chinese", "CN", 12, 2], ["American", "US", 85, 5], ["British", "GB", 4, 0]]},
  {"id": "algeria", "name": "Algerian War", "kw": "213473|371555", "n": {"movie": 157, "series": 6}, "sides": [["French", "FR", 92, 6], ["Algerian", "DZ", 72, 0]]},
  {"id": "vietnam", "name": "Vietnam War", "kw": "2957", "n": {"movie": 338, "series": 34}, "sides": [["American", "US", 253, 21], ["Vietnamese", "VN", 15, 1], ["French", "FR", 14, 1], ["Australian", "AU", 12, 2], ["South Korean", "KR", 9, 1]]},
  {"id": "coldwar", "name": "Cold War", "kw": "2106|224693|7059", "n": {"movie": 468, "series": 102}, "sides": [["American", "US", 247, 35], ["Soviet & Russian", "SU|RU", 8, 2], ["British", "GB", 59, 25], ["German", "DE|DD", 52, 8], ["Polish", "PL", 10, 1], ["Czech", "CZ|CS", 7, 0]]},
  {"id": "troubles", "name": "The Troubles", "kw": "230977", "n": {"movie": 41, "series": 9}, "sides": [["Irish", "IE", 13, 3], ["British", "GB", 19, 7]]},
  {"id": "israel", "name": "Israel, Palestine & the Arab–Israeli wars", "kw": "381382|359486|5907|275377|208908|255640|235551|257142|8344|367115", "n": {"movie": 310, "series": 25}, "sides": [["Israeli", "IL", 50, 9], ["Palestinian", "PS", 34, 1], ["Lebanese", "LB", 9, 1], ["American", "US", 104, 3], ["French", "FR", 44, 3]]},
  {"id": "lebanon", "name": "Lebanese Civil War", "kw": "236275", "n": {"movie": 19, "series": 0}, "sides": [["Lebanese", "LB", 9, 0], ["French", "FR", 5, 0]]},
  {"id": "indopak", "name": "India–Pakistan wars & Partition", "kw": "227377|379258|158512|360299", "n": {"movie": 29, "series": 0}, "sides": [["Indian", "IN", 21, 0]]},
  {"id": "iraniraq", "name": "Iran–Iraq War", "kw": "259106|277034", "n": {"movie": 18, "series": 3}, "sides": [["Iranian", "IR", 11, 1]]},
  {"id": "sovafghan", "name": "Soviet–Afghan War", "kw": "194440", "n": {"movie": 20, "series": 4}, "sides": [["Soviet & Russian", "SU|RU", 7, 2], ["American", "US", 6, 1]]},
  {"id": "falklands", "name": "Falklands War", "kw": "33852", "n": {"movie": 40, "series": 2}, "sides": [["British", "GB", 19, 1], ["Argentine", "AR", 11, 0]]},
  {"id": "yugoslav", "name": "Yugoslav wars", "kw": "343883|7973|260216|363031", "n": {"movie": 95, "series": 8}, "sides": [["Bosnian", "BA", 28, 0], ["Serbian", "RS|YU", 9, 0], ["Croatian", "HR", 3, 0], ["Kosovar & Albanian", "XK|AL", 3, 0], ["American", "US", 20, 0]]},
  {"id": "rwanda", "name": "Rwandan genocide", "kw": "8053", "n": {"movie": 51, "series": 3}, "sides": [["Rwandan", "RW", 3, 0], ["American", "US", 18, 1], ["British", "GB", 4, 2], ["French", "FR", 12, 0]]},
  {"id": "gulfiraq", "name": "Gulf War & Iraq War", "kw": "2952|15087|8159", "n": {"movie": 185, "series": 14}, "sides": [["American", "US", 150, 8], ["British", "GB", 14, 3], ["Iraqi", "IQ", 9, 0]]},
  {"id": "afghanistan", "name": "Afghanistan & the War on Terror", "kw": "7158|1242", "n": {"movie": 141, "series": 28}, "sides": [["American", "US", 103, 7], ["British", "GB", 15, 9]]},
  {"id": "colombia", "name": "Colombian conflict", "kw": "305114|371138", "n": {"movie": 4, "series": 0}, "sides": [["Colombian", "CO", 4, 0]]},
  {"id": "syria", "name": "Syrian civil war", "kw": "256693", "n": {"movie": 31, "series": 2}, "sides": [["Syrian", "SY", 4, 0], ["American", "US", 6, 0], ["French", "FR", 3, 0]]},
  {"id": "karabakh", "name": "Nagorno-Karabakh", "kw": "331737|271665|331736", "n": {"movie": 32, "series": 2}, "sides": [["Armenian", "AM", 6, 1], ["Azerbaijani", "AZ", 21, 1]]},
  {"id": "ukraine", "name": "Russia–Ukraine war", "kw": "301386|252606", "n": {"movie": 203, "series": 10}, "sides": [["Ukrainian", "UA", 118, 3], ["American", "US", 37, 0], ["British", "GB", 15, 1]]}];

// hand-picked films per war and side (the main opponents always get a side, even where TMDB has few)
for (const w of WARS) for (const [label, x] of Object.entries(SIDE_PICKS[w.id] || {})) {
  const have = w.sides.find(s => s[0] === label);
  if (have) have.push(true); else w.sides.unshift([label, x.cc, x.items.length, 0, true]);
}

export const PREJUDICE = [{"name": "Racism (everything)", "kw": "12425|168567|163178|160335|233016|6984", "n": {"movie": 1130, "series": 139}},
  {"name": "Black Americans, slavery & Jim Crow", "kw": "2831|6984|239612|157136|233016|270891", "n": {"movie": 410, "series": 71}},
  {"name": "The civil rights movement", "kw": "270891", "n": {"movie": 39, "series": 8}},
  {"name": "Police brutality & racial profiling", "kw": "796|223215", "n": {"movie": 252, "series": 9}},
  {"name": "White supremacy & the KKK", "kw": "209044|529", "n": {"movie": 80, "series": 3}},
  {"name": "Blackface & minstrel shows", "kw": "184816|210349", "n": {"movie": 63, "series": 2}},
  {"name": "Apartheid South Africa", "kw": "4106", "n": {"movie": 98, "series": 2}},
  {"name": "Antisemitism", "kw": "10144", "n": {"movie": 150, "series": 7}},
  {"name": "Islamophobia", "kw": "160916", "n": {"movie": 27, "series": 2}},
  {"name": "How Arabs & Palestinians are shown", "kw": "212815|173259|268752", "n": {"movie": 121, "series": 7}},
  {"name": "How Native Americans are shown", "kw": "10322", "n": {"movie": 581, "series": 31}},
  {"name": "Japanese American internment", "kw": "195140|195139", "n": {"movie": 47, "series": 3}},
  {"name": "Colonialism & empire", "kw": "158217", "n": {"movie": 267, "series": 21}},
  {"name": "Orientalism", "kw": "198555", "n": {"movie": 18, "series": 0}},
  {"name": "Racial & national stereotypes", "kw": "168567|163178|212815", "n": {"movie": 96, "series": 28}},
  {"name": "Xenophobia & immigration", "kw": "160910|1900", "n": {"movie": 696, "series": 55}},
  {"name": "Nationalism", "kw": "1628", "n": {"movie": 85, "series": 7}},
  {"name": "Caste", "kw": "180492|265813|255663", "n": {"movie": 50, "series": 6}},
  {"name": "Religious persecution & ethnic conflict", "kw": "220890|256478", "n": {"movie": 45, "series": 4}},
  {"name": "Hate crimes", "kw": "160335", "n": {"movie": 58, "series": 4}},
  {"name": "Homophobia", "kw": "1013", "n": {"movie": 420, "series": 42}},
  {"name": "Sexism & misogyny", "kw": "4411|161166", "n": {"movie": 218, "series": 28}},
  {"name": "Propaganda films", "kw": "2903|33846|210094|209473|224693", "n": {"movie": 516, "series": 33}},
  {"name": "Nazi propaganda", "kw": "210094", "n": {"movie": 58, "series": 3}},
  {"name": "Soviet propaganda", "kw": "209473", "n": {"movie": 18, "series": 0}},
  {"name": "Cold War propaganda & anti-communism", "kw": "224693|7059|173686|194595", "n": {"movie": 129, "series": 8}},
  {"name": "Other prejudice & discrimination", "kw": "186782|10360|157912|3010", "without": "1013,10144,10322,12425,157136,158217,160335,160910,160916,161166,1628,163178,168567,173259,173686,180492,184816,1900,194595,195139,195140,198555,209044,209473,210094,210349,212815,220890,223215,224693,233016,239612,255663,256478,265813,268752,270891,2831,2903,33846,4106,4411,529,6984,7059,796", "n": {"movie": 197, "series": 38}},
  {"name": "Everything else: other prejudice, persecution & bigotry", "catchall": true, "kw": "186782|10360|157912|3010|161167|276804|174445|233134|385026|158455|244446", "n": {"movie": 999, "series": 999}}];

// every country TMDB films come from, for "Everyone else" (all of these minus the war's named sides)
const ALL = "AF AL DZ AO AR AM AU AT AZ BD BY BE BO BA BR BG KH CM CA CL CN CO CD HR CU CY CZ DK EC EG SV EE ET FI FR GE DE GH GR GT HK HU IS IN ID IR IQ IE IL IT CI JM JP JO KZ KE KP KR XK KW KG LV LB LY LT LU MK MY ML MT MX MD MN ME MA MM NP NL NZ NI NG NO PK PS PA PY PE PH PL PT PR QA RO RU RW SA SN RS SG SK SI SO ZA ES LK SD SE CH SY TW TJ TZ TH TN TR UG UA AE GB US UY UZ VE VN YE ZM ZW SU YU CS DD XC".split(" ");

// "Made in" for the prejudice row (wider than the main Country list)
export const MADE_IN = {
  "United States": "US", "United Kingdom": "GB", Ireland: "IE", Canada: "CA", Australia: "AU", France: "FR", Germany: "DE",
  "East Germany": "DD", Italy: "IT", Spain: "ES", Netherlands: "NL", Belgium: "BE", Austria: "AT", Sweden: "SE", Denmark: "DK",
  Norway: "NO", Poland: "PL", Czechia: "CZ|CS", Hungary: "HU", Serbia: "RS|YU", "Bosnia and Herzegovina": "BA", Croatia: "HR",
  Russia: "RU", "Soviet Union": "SU", Ukraine: "UA", Turkey: "TR", Greece: "GR", Israel: "IL", Palestine: "PS", Lebanon: "LB",
  Syria: "SY", Egypt: "EG", Algeria: "DZ", Morocco: "MA", Tunisia: "TN", Iran: "IR", Iraq: "IQ", "Saudi Arabia": "SA",
  India: "IN", Pakistan: "PK", Bangladesh: "BD", "Sri Lanka": "LK", China: "CN", "Hong Kong": "HK", Taiwan: "TW", Japan: "JP",
  "South Korea": "KR", "North Korea": "KP", Vietnam: "VN", Cambodia: "KH", Indonesia: "ID", Philippines: "PH", Thailand: "TH",
  Nigeria: "NG", "South Africa": "ZA", Rwanda: "RW", Kenya: "KE", Senegal: "SN", Mexico: "MX", Cuba: "CU", Brazil: "BR",
  Argentina: "AR", Chile: "CL", Colombia: "CO",
};

export const SIDE_ALL = "All sides", SIDE_OTHER = "Everyone else";
export const KINDS = ["Documentaries", "Dramas & fiction"];
const key = t => t === "series" ? "series" : "movie";

/** Wars worth a row for this type, each with the sides that have something to show. */
export function warsFor(type) {
  const t = key(type), i = t === "series" ? 3 : 2;
  return WARS.filter(w => w.n[t] >= (t === "series" ? 5 : 15))
    .map(w => ({ ...w, shown: w.sides.filter(s => s[4] === true || s[i] >= (t === "series" ? 1 : 3)) }));
}
export const topicsFor = type => PREJUDICE.filter(p => p.n[key(type)] >= (key(type) === "series" ? 5 : 15));

function kindFilter(p, kind) {
  if (kind === KINDS[0]) p.with_genres = "99";
  else if (kind === KINDS[1]) p.without_genres = [p.without_genres, "99"].filter(Boolean).join(",");
  return p;
}

/** {path, params} for war.<id> and prej rows. */
export function sidesSpec(type, id, extra) {
  const t = key(type), path = `/discover/${t === "series" ? "tv" : "movie"}`;
  if (id.startsWith("war.") && id !== "war.other") {
    const w = WARS.find(x => x.id === id.slice(4));
    if (!w) return null;
    let p = { sort_by: "popularity.desc", with_keywords: w.kw, without_genres: "16,10751" };
    const side = extra.side;
    if (side === SIDE_OTHER) { const named = new Set(w.sides.flatMap(s => s[1].split("|"))); p.with_origin_country = ALL.filter(c => !named.has(c)).join("|"); }
    else if (side && side !== SIDE_ALL) { const s = w.sides.find(x => x[0] === side); if (s) p.with_origin_country = s[1]; }
    p = kindFilter(p, extra.kind);
    // hand-picked films for that side first (for "All sides": every side's picks)
    const picks = t === "movie" && !extra.kind && !extra.year ? Object.entries(SIDE_PICKS[w.id] || {})
      .filter(([label]) => !side || side === SIDE_ALL || label === side).flatMap(([, x]) => x.items)
      .map(([id, name, year]) => ({ id, name, year })) : [];
    return { path, params: applyFilters(t, { year: extra.year, sort_by: extra.sort_by }, p), ...(picks.length ? { static: picks } : {}) };
  }
  if (id === "war.other") {
    // every war and conflict the named rows don't cover
    let p = { sort_by: "popularity.desc", with_genres: t === "series" ? "10768" : "10752", without_genres: "16,10751",
      without_keywords: [...new Set(WARS.flatMap(w => w.kw.split("|")))].join(",") };
    if (MADE_IN[extra.country]) p.with_origin_country = MADE_IN[extra.country];
    const g = p.with_genres;
    p = kindFilter(p, extra.kind);
    if (extra.kind === KINDS[0]) p.with_genres = `${g},99`;    // war documentaries, not every documentary
    return { path, params: applyFilters(t, { year: extra.year, sort_by: extra.sort_by }, p) };
  }
  if (id === "prej") {
    const topic = PREJUDICE.find(x => x.name === extra.topic);
    if (!topic) return null;
    let p = kindFilter({ sort_by: "popularity.desc", with_keywords: topic.kw, without_genres: "16,10751" }, extra.kind);
    if (topic.catchall) p.without_keywords = [...new Set(PREJUDICE.filter(x => !x.catchall).flatMap(x => x.kw.split("|")))].join(",");
    if (topic.without) p.without_keywords = topic.without;   // "Other": what none of the named topics took
    if (MADE_IN[extra.country]) p.with_origin_country = MADE_IN[extra.country];
    return { path, params: applyFilters(t, { year: extra.year, sort_by: extra.sort_by }, p) };
  }
  return null;
}
