// Sorts titles into microgenres on this PC (same rules as the site), so step 3 doesn't make the site do 19,000
// titles' worth of work. Reads a JSON array of {id, type, genres, lang, year, countries, kw} from argv[2], writes {id: mg} to argv[3].
import fs from "fs";
import { matchMicrogenres, mgString } from "../src/microgenres.js";
import { MOVIE_GENRES, TV_GENRES } from "../src/providers.js";
const GENRE_ID = { ...TV_GENRES, ...MOVIE_GENRES, "Science Fiction": 878, "TV Movie": 10770 };
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), out = {};
for (const x of rows) {
  const type = x.type === "series" ? "series" : "movie";
  out[x.id] = mgString(matchMicrogenres(type, { imdb: x.id, kw: new Set((x.kw || []).map(Number)),
    genres: new Set((x.genres || []).map(n => typeof n === "number" ? n : GENRE_ID[n]).filter(Boolean)),
    lang: x.lang || null, year: +String(x.year || "").slice(0, 4) || 0, countries: new Set(x.countries || []) }));
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log(Object.keys(out).length + " titles sorted");
