// Keeps the festival and award rows current on its own (no outside scheduler): Cloudflare runs this once an hour
// (see [triggers] in wrangler.toml). Each run re-reads one award's Wikipedia page, picks out this year's and last
// year's winners and nominees, looks the new ones up on TMDB and adds them to that row.
import { AWARD_LISTS } from "./awards.js";
import { spend, room } from "./util.js";

const YR = /(?<!\d)(1[89]\d\d|20[0-3]\d)(?!\d)/;
const LINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const ITAL = () => /(?<!')(?:'''''|'')(?!')\s*(\[\[[^\]]+\]\]|[^'\[\]{}|\n]{2,90}?)\s*(?:'''''|'')(?!')|\[\[[^\]|]+\|''([^']+)''\]\]/g;
const HL = /FAEB86|lightyellow|B0C4DE|gold|#ffd|background:#EEDD82/i;
const norm = s => String(s || "").toLowerCase().replace(/&/g, "and").normalize("NFKD").replace(/[^a-z0-9]/g, "");
const unlink = s => s.replace(LINK, (_, a, b) => b || a);

function clean(s) {
  const m = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/.exec(s.trim());
  if (m) s = m[2] || m[1].replace(/\s*\((?:\d{4} )?(?:[A-Za-z ]+ )?(?:film|movie|TV series|series|miniseries|documentary)\)$/, "");
  return s.replace(/<[^>]+>|\{\{[^}]*\}\}/g, "").replace(/\s+/g, " ").trim().replace(/^[ .,:;'"]+|[ .,:;'"]+$/g, "");
}

/** (title, year) pairs from an award page's tables and lists: the same rules the starting lists were built with. */
export function extractAwards(wikitext, cfg = {}) {
  let t = wikitext.replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>|<!--[\s\S]*?-->/g, "");
  if (cfg.section) {
    const out = []; let keep = false, lvl = 0;
    const re = new RegExp(cfg.section, "i");
    for (const line of t.split("\n")) {
      const h = /^(=+)\s*(.*?)\s*=+\s*$/.exec(line);
      if (h) {
        const n = h[1].length;
        if (keep && n <= lvl) keep = false;
        if (!keep && re.test(h[2])) { keep = true; lvl = n; continue; }
      }
      if (keep) out.push(line);
    }
    if (out.length) t = out.join("\n");
  }
  t = t.replace(/\n\s*\|\s*-/g, "\n|-");
  const res = []; let year = null;
  const lineRe = cfg.line ? new RegExp(cfg.line, "i") : null, notRe = cfg.notline ? new RegExp(cfg.notline, "i") : null;
  for (let ch of t.split(/\n\|-[^\n]*|\n(?=\*)|\n(?==)/)) {
    const h = /^\s*=+\s*(.*?)\s*=+/.exec(ch);
    if (h) {
      const y = YR.exec(h[1]); if (y) year = +y[1];
      if (/see also|references|notes|external links|further reading/i.test(h[1])) break;
      continue;
    }
    const lines = ch.split("\n").filter(l => l.trim());
    if (!lines.length) continue;
    if (!(/^\s*[|!*]/.test(lines[0]) || lines.some(l => /^\s*[|!]/.test(l)))) continue;
    const first = ch.trim().replace(/^[|!*]+/, "").trim().split(/\|\||!!|\n/)[0];
    const mi = ITAL().exec(first);
    const pre = mi ? first.slice(0, mi.index) : first;
    const y = YR.exec(unlink(pre).slice(0, 80)); if (y) year = +y[1];
    if (lineRe && !lineRe.test(ch)) continue;
    if (notRe && notRe.test(ch)) continue;
    if (year == null) continue;
    if (cfg.winners) {
      if (!(HL.test(ch) || ch.includes("'''''"))) continue;
      ch = ch.split(/\|\||\n/).filter(l => HL.test(l) || l.includes("'''''")).join("\n");
    }
    for (const m of ch.matchAll(ITAL())) {
      const raw = m[1] || m[2]; const title = raw ? clean(raw) : "";
      if (title.length > 1 && title.length < 90 && !/^\d{4}$/.test(title)) res.push([title, year]);
    }
  }
  const seen = new Set();
  return res.filter(([a, b]) => { const k = a + "|" + b; return !seen.has(k) && seen.add(k); });
}

async function tmdbGet(env, path, params) {
  spend();
  const r = await fetch(`https://api.themoviedb.org/3${path}?${new URLSearchParams({ ...params, api_key: env.TMDB_KEY })}`);
  return r.ok ? r.json() : null;
}
/** A title from an award list → its IMDb id, only on an exact title match within a year or so (like the starting lists). */
async function resolve(env, type, title, year) {
  const kind = type === "series" ? "tv" : "movie";
  const r = (await tmdbGet(env, `/search/${kind}`, { query: title })) || {};
  const want = norm(title);
  const hit = (r.results || []).find(c => {
    const cy = +String(c.release_date || c.first_air_date || "0").slice(0, 4);
    const names = [c.title, c.name, c.original_title, c.original_name].map(norm);
    return cy && Math.abs(cy - year) <= (kind === "tv" ? 30 : 2) && names.includes(want);
  });
  if (!hit) return null;
  const ex = await tmdbGet(env, `/${kind}/${hit.id}/external_ids`, {});
  return ex && ex.imdb_id ? { id: ex.imdb_id, name: hit.title || hit.name, year: +String(hit.release_date || hit.first_air_date).slice(0, 4) } : null;
}

/** One hourly step: the award page checked longest ago, its lists' recent entries looked up and added. */
export async function syncAwards(env) {
  const db = env.DB, now = Date.now();
  const pages = [...new Set(AWARD_LISTS.map(a => a.page))];
  const state = new Map((await db.prepare("SELECT page, checked FROM award_state").all()).results.map(r => [r.page, r.checked]));
  const page = pages.sort((a, b) => (state.get(a) || 0) - (state.get(b) || 0))[0];
  if (!page) return { page: null };
  await db.prepare("INSERT INTO award_state (page, checked) VALUES (?, ?) ON CONFLICT(page) DO UPDATE SET checked=excluded.checked").bind(page, now).run();
  spend();
  const res = await fetch("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "parse", page, prop: "wikitext", format: "json", redirects: "1", formatversion: "2" }),
    { headers: { "user-agent": "Mycelium/1.0 (github.com/myceliation; award lists for a Stremio add-on)" } });
  if (!res.ok) return { page, error: res.status };
  const text = ((await res.json()).parse || {}).wikitext || "";
  const thisYear = new Date().getUTCFullYear(), added = [];
  for (const a of AWARD_LISTS.filter(x => x.page === page)) {
    const recent = extractAwards(text, a.cfg).filter(([, y]) => y >= thisYear - 2);
    if (!recent.length) continue;
    const seen = new Set((await db.prepare("SELECT title, year FROM award_seen WHERE list=? AND year>=?").bind(a.id, thisYear - 2).all()).results.map(r => r.title + "|" + r.year));
    for (const [title, year] of recent) {
      if (seen.has(title + "|" + year)) continue;
      if (!room(5)) break;                           // the rest waits for this page's next turn
      const hit = await resolve(env, a.type, title, year).catch(() => null);
      seen.add(title + "|" + year);
      await db.batch([
        db.prepare("INSERT INTO award_seen (list, title, year, id) VALUES (?,?,?,?) ON CONFLICT DO NOTHING").bind(a.id, title, year, hit ? hit.id : null),
        ...(hit ? [db.prepare("INSERT INTO award_items (list, id, name, year, added) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING").bind(a.id, hit.id, hit.name, year, now)] : []),
      ]);
      if (hit) added.push(a.id + ": " + hit.name);
    }
  }
  return { page, added };
}

/** The newest additions to an award row (shown before its starting list). */
export async function awardItems(env, list) {
  const r = await env.DB.prepare("SELECT id, name, year FROM award_items WHERE list=? ORDER BY year DESC, added DESC LIMIT 300").bind(list).all();
  return r.results.map(x => ({ id: x.id, name: x.name, year: String(x.year) }));
}
