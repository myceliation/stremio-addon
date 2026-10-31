// List scraping: collect candidates from a source, then resolve them to IMDb
// ids a few at a time. The import page calls /step repeatedly; each step stays
// under the free plan's 50 outbound requests and 50 D1 queries.
import { randomId, newBudget } from "./util.js";
import { insertMany } from "./store.js";
import { MOVIE_GENRES, TV_GENRES } from "./providers.js";

const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
             "accept-language": "en-US,en;q=0.9" };
const WIKI_UA = { "user-agent": "Mycelium-Stremio/0.2 (https://github.com/myceliation/stremio-addon)" };
const GENRE_NAME = Object.fromEntries([...Object.entries(MOVIE_GENRES), ...Object.entries(TV_GENRES)].map(([n, i]) => [i, n]));
const MAX_ROWS = 6000;
export const POSTER = tt => `https://images.metahub.space/poster/small/${tt}/img`;

const db = env => env.DB;

// ── job lifecycle ────────────────────────────────────────────────────────────
export async function startJob(env, uid, { source, target, rows, url, wlang, maxRows }) {
  const id = randomId(12);
  await db(env).prepare("DELETE FROM job_rows WHERE job IN (SELECT id FROM jobs WHERE created < ?)").bind(Date.now() - 2 * 864e5).run();
  await db(env).prepare("DELETE FROM jobs WHERE created < ?").bind(Date.now() - 2 * 864e5).run();
  const info = { url: url || null, cursor: url ? 0 : null, n: 0, msg: "", ...(wlang ? { wlang } : {}),
    ...(maxRows > 0 && maxRows < MAX_ROWS ? { max: maxRows | 0 } : {}) };
  await db(env).prepare("INSERT INTO jobs (id, uid, source, target, phase, state, created) VALUES (?,?,?,?,?,?,?)")
    .bind(id, uid, source, target, url ? "collect" : "resolve", JSON.stringify(info), Date.now()).run();
  if (rows && rows.length) await addRows(env, id, info, rows);
  await saveInfo(env, id, info);
  return id;
}

export async function getJob(env, uid, id) {
  const j = await db(env).prepare("SELECT * FROM jobs WHERE id=? AND uid=?").bind(id, uid).first();
  if (!j) return null;
  j.info = JSON.parse(j.state);
  return j;
}
const saveInfo = (env, id, info, phase) => phase
  ? db(env).prepare("UPDATE jobs SET state=?, phase=? WHERE id=?").bind(JSON.stringify(info), phase, id).run()
  : db(env).prepare("UPDATE jobs SET state=? WHERE id=?").bind(JSON.stringify(info), id).run();

async function addRows(env, job, info, rows) {
  const room = (info.max || MAX_ROWS) - info.n;
  rows = rows.slice(0, Math.max(0, room));
  await insertMany(env, "job_rows", ["job", "idx", "kind", "input", "ref", "stars"],
    rows.map((r, i) => [job, info.n + i, r.kind, String(r.input).slice(0, 200), r.ref == null ? null : String(r.ref).slice(0, 300), r.stars ?? null]));
  info.n += rows.length;
}

export async function progress(env, job) {
  const r = await db(env).prepare("SELECT status, COUNT(*) n FROM job_rows WHERE job=? GROUP BY status").bind(job.id).all();
  const c = { 0: 0, 1: 0, 2: 0 };
  r.results.forEach(x => (c[x.status] = x.n));
  return { phase: job.phase, total: c[0] + c[1] + c[2], pending: c[0], found: c[1], missing: c[2], msg: job.info.msg };
}

export async function step(env, job, shard = 0, of = 1) {
  const budget = newBudget();
  of = Math.max(1, Math.min(8, of | 0)); shard = Math.max(0, Math.min(of - 1, shard | 0));
  try {
    if (job.phase === "collect" && shard > 0) return progress(env, job);   // only one helper reads the source
    if (job.phase === "collect") {
      const more = await collect(env, job, budget);
      if (!more) { job.phase = "resolve"; }
      await saveInfo(env, job.id, job.info, job.phase);
      if (job.phase === "collect") return progress(env, job);
    }
    if (job.phase === "resolve") {
      const done = await resolveSome(env, job, budget, shard, of);
      if (done) { job.phase = "ready"; await saveInfo(env, job.id, job.info, "ready"); }
      else if (job.info.lbRefused != null) await saveInfo(env, job.id, job.info, "resolve");   // keep the Letterboxd back-off count
    }
  } catch (e) {
    // running out of this request's subrequests isn't a failure: the next step carries on
    if (String(e.message) === "budget") return { phase: job.phase, total: job.info.n || 0, pending: 1, found: 0, missing: 0, msg: "Working…" };
    job.info.msg = String(e.message || e);
    try { await saveInfo(env, job.id, job.info, "error"); } catch { /* reported below anyway */ }
    job.phase = "error";
  }
  return progress(env, job);
}

export async function results(env, job) {
  const r = await db(env).prepare("SELECT idx, input, status, id, type, name, year, poster, conf, stars FROM job_rows WHERE job=? ORDER BY idx").bind(job.id).all();
  return r.results;
}

// ── collect: turn a URL into candidate rows (paged) ──────────────────────────
async function get(url, budget, headers = UA, asJson = false) {
  if (budget.left-- <= 0) throw new Error("budget");
  const r = await fetch(url, { headers, redirect: "follow" });
  if (!r.ok) throw new Error(`${new URL(url).hostname} answered ${r.status}`);
  return asJson ? r.json() : r.text();
}

async function collect(env, job, budget) {
  const info = job.info, url = info.url;
  const add = rows => addRows(env, job.id, info, rows);
  try {
    // Letterboxd: lists, watchlists, /films/ (watched), diary — page by page
    if (/letterboxd\.com/.test(url)) {
      const base = url.replace(/[?#].*$/, "").replace(/\/page\/\d+\/?$/, "").replace(/\/?$/, "/");
      for (let i = 0; i < 3; i++) {
        const page = ++info.cursor;
        if (i) await new Promise(z => setTimeout(z, 900));     // Letterboxd refuses quick bursts
        let html;
        try { html = await get(page === 1 ? base : `${base}page/${page}/`, budget); }
        catch (e) {
          // a refusal part-way through a long list: wait and retry that page on the next step,
          // and after several refusals in a row keep what was read instead of failing the import
          if (page === 1 || !/answered (403|429|5\d\d)/.test(String(e.message))) throw e;
          info.cursor--; info.retries = (info.retries || 0) + 1;
          if (info.retries > 6) { info.msg = `Letterboxd stopped answering after ${page - 1} pages; kept what was read. Import the same link again later for the rest (duplicates are skipped).`; return false; }
          info.msg = `Letterboxd asked us to slow down at page ${page}; retrying…`;
          await new Promise(z => setTimeout(z, 2500));
          return true;
        }
        info.retries = 0;
        const slugs = [...new Set([...html.matchAll(/data-(?:film|item)-slug="([a-z0-9][a-z0-9-]*)"/g), ...html.matchAll(/data-target-link="\/film\/([a-z0-9][a-z0-9-]*)\/"/g)].map(m => m[1]))];
        // the poster tags also carry "Title (Year)", which resolves through TMDB search without
        // fetching every film's own Letterboxd page (much faster, and Letterboxd doesn't rate-limit it)
        const named = {};
        for (const m of html.matchAll(/<[^>]*data-item-slug="([a-z0-9][a-z0-9-]*)"[^>]*>/g)) {
          const n = (m[0].match(/data-item-name="([^"]+)"/) || [])[1];
          if (n) named[m[1]] = n.replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"');
        }
        if (!slugs.length) {
          if (page === 1) throw new Error("Letterboxd returned a page without films (it may have blocked the request). Paste the page text instead, or use a Letterboxd CSV export.");
          return false;
        }
        await add(slugs.map(s => {
          const n = named[s], m = n && n.match(/^(.*?)\s*\((\d{4})\)$/);
          return { kind: "lb", input: n || s.replace(/-/g, " "), ref: m ? `${s}\u0000${m[1]}\u0000${m[2]}` : s };
        }));
        info.msg = `Read ${page} page${page > 1 ? "s" : ""} of the Letterboxd list`;
        if (!/class="next"/.test(html) || info.n >= (info.max || MAX_ROWS)) return false;
      }
      return true;
    }
    // TMDB: lists, collections, keywords, people, companies
    let m;
    if ((m = url.match(/themoviedb\.org\/(list|collection|keyword|person|company)\/(\d+)/))) {
      const [, kind, id] = m;
      const page = ++info.cursor;
      let items = [], last = true;
      if (kind === "list") { const d = await tmdbGet(env, `/list/${id}`, { page }, budget); items = d.items || []; last = page >= (d.total_pages || 1); }
      else if (kind === "collection") { items = (await tmdbGet(env, `/collection/${id}`, {}, budget)).parts || []; }
      else if (kind === "person") { const d = await tmdbGet(env, `/person/${id}/combined_credits`, {}, budget); items = [...(d.cast || []), ...(d.crew || []).filter(c => c.job === "Director")]; }
      else {
        const d = await tmdbGet(env, "/discover/movie", { [kind === "keyword" ? "with_keywords" : "with_companies"]: id, sort_by: "popularity.desc", page }, budget);
        items = d.results || []; last = page >= Math.min(d.total_pages || 1, 40);
      }
      await add(items.map(it => ({ kind: "tmdb", input: it.title || it.name || String(it.id), ref: `${it.media_type === "tv" || it.first_air_date ? "tv" : "movie"}:${it.id}` })));
      info.msg = `Read ${info.n} titles from TMDB`;
      return !last && info.n < (info.max || MAX_ROWS);
    }
    // Wikipedia: categories (members) or articles (linked articles); resolved via Wikidata
    if ((m = url.match(/(\w+)\.wikipedia\.org\/wiki\/([^?#]+)/))) {
      const lang = m[1], title = decodeURIComponent(m[2]).replace(/_/g, " ");
      info.wlang = lang;
      const api = `https://${lang}.wikipedia.org/w/api.php`;
      if (/^Category:/i.test(title)) {
        // walk the category and its subcategories (two levels deep, up to 60 categories)
        info.cats ||= [[title, 0]];
        info.seenCats ||= [title];
        const [cat, depth] = info.cats[0];
        const p = new URLSearchParams({ action: "query", list: "categorymembers", cmtitle: cat, cmtype: "page|subcat", cmlimit: "500", format: "json" });
        if (info.cont) p.set("cmcontinue", info.cont);
        const d = await get(`${api}?${p}`, budget, WIKI_UA, true);
        const members = d.query?.categorymembers || [];
        await add(members.filter(x => x.ns === 0).map(x => ({ kind: "wiki", input: x.title, ref: x.title })));
        if (depth < 2) for (const sc of members.filter(x => x.ns === 14)) {
          if (!info.seenCats.includes(sc.title) && info.seenCats.length < 60) { info.seenCats.push(sc.title); info.cats.push([sc.title, depth + 1]); }
        }
        info.cont = d.continue?.cmcontinue || null;
        if (!info.cont) info.cats.shift();
        info.msg = `Read ${info.n} articles from ${info.seenCats.length - info.cats.length} of ${info.seenCats.length} categories`;
        return info.cats.length > 0 && info.n < (info.max || MAX_ROWS);
      }
      // Article: every linked article is a candidate (Wikidata keeps only films/series).
      // Index pages ("List of cult films" → "…: A", "…: B") are followed one level down.
      info.pages ||= [title];
      info.seenPages ||= [title];
      const page = info.pages.shift();
      const p = new URLSearchParams({ action: "parse", page, prop: "links", format: "json", redirects: "1" });
      const d = await get(`${api}?${p}`, budget, WIKI_UA, true);
      if (d.error) throw new Error("Wikipedia: " + d.error.info);
      const links = (d.parse?.links || []).filter(l => l.ns === 0).map(l => l["*"]);
      // follow "List of …" pages one level down: the alphabetical parts of a long list, or every list
      // when this is an index page ("Lists of films considered the worst" → 20th- and 21st-century lists)
      const real = (d.parse?.title || page);
      const isIndex = /^Lists of /i.test(real) || links.filter(t => !/^List(s)? of /i.test(t)).length < 20;
      const sub = links.filter(t => /^List(s)? of /i.test(t) && (isIndex || t.startsWith(title) || t.startsWith(title.replace(/s$/, ""))));
      if (page === title) for (const t of sub) if (!info.seenPages.includes(t) && info.seenPages.length < 40) { info.seenPages.push(t); info.pages.push(t); }
      await add(links.filter(t => !/^List(s)? of /i.test(t)).map(t => ({ kind: "wiki", input: t, ref: t })));
      info.msg = `Read ${info.n} linked articles from ${info.seenPages.length - info.pages.length} page${info.seenPages.length > 1 ? "s" : ""}`;
      return info.pages.length > 0 && info.n < (info.max || MAX_ROWS);
    }
    // IMDb list pages: usually behind a bot wall from servers; try, then explain
    // Anything else: pull IMDb ids / links out of the page, else parse its text
    const html = await get(url, budget);
    const { extractCandidates } = await import("./extract.js");
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|\/p|\/li|\/tr|\/h\d|\/div)[^>]*>/gi, "\n").replace(/<\/td>/gi, "\t").replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/[  ]+/g, " ");
    let rows = extractCandidates(html.match(/tt\d{7,9}/g) ? html.match(/tt\d{7,9}/g).join("\n") : "");
    if (!rows.length) rows = extractCandidates(text);
    if (!rows.length && /imdb\.com/.test(url))
      throw new Error("IMDb blocked the request. Open the list in your browser, press Ctrl+A then Ctrl+C, and paste it here instead (or use IMDb's Export CSV).");
    await add(rows);
    info.msg = `Found ${rows.length} candidates on the page`;
    return false;
  } catch (e) {
    if (String(e.message) === "budget") { info.cursor = Math.max(0, (info.cursor || 1) - 1); return true; }
    throw e;
  }
}

// ── resolve: candidate → IMDb id + metadata ──────────────────────────────────
async function tmdbGet(env, path, params, budget) {
  if (budget.left-- <= 0) throw new Error("budget");
  const r = await fetch(`${TMDB}${path}?${new URLSearchParams({ ...params, api_key: env.TMDB_KEY })}`);
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

const tokens = s => new Set((s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]+/g) || []).filter(w => !["the", "a", "an"].includes(w)));
function confidence(inTitle, inYear, hit) {
  const name = hit.title || hit.name || "", orig = hit.original_title || hit.original_name || "";
  const y = (hit.release_date || hit.first_air_date || "").slice(0, 4);
  const yearScore = !inYear ? 15 : y === inYear ? 40 : Math.abs(+y - +inYear) <= 1 ? 20 : 0;
  const a = tokens(inTitle);
  const bigrams = s => { s = [...tokens(s)].join(" "); const out = []; for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2)); return out; };
  const dice = t => {   // spelling-tolerant: "Tenebrae" vs "Tenebre", "Crash, The" vs "Crash"
    const x = bigrams(inTitle), y = bigrams(t); if (!x.length || !y.length) return 0;
    const pool = [...y]; let n = 0;
    for (const g of x) { const k = pool.indexOf(g); if (k >= 0) { n++; pool.splice(k, 1); } }
    return 2 * n / (x.length + y.length);
  };
  const sim = t => { const b = tokens(t); if (!a.size || !b.size) return 0; let n = 0; a.forEach(w => b.has(w) && n++); return Math.max(n / Math.max(a.size, b.size), dice(t)); };
  return Math.min(100, Math.round(yearScore + 60 * Math.max(sim(name), sim(orig))));
}

const metaFrom = (hit, kind) => ({
  type: kind === "tv" ? "series" : "movie",
  name: hit.title || hit.name || null,
  year: (hit.release_date || hit.first_air_date || "").slice(0, 4) || null,
  poster: hit.poster_path ? IMG + hit.poster_path : null,
  genres: hit.genre_ids ? "|" + hit.genre_ids.map(g => GENRE_NAME[g]).filter(Boolean).join("|") + "|"
        : hit.genres ? "|" + hit.genres.map(g => g.name).join("|") + "|" : null,
});

async function byImdb(env, tt, budget) {
  const d = await tmdbGet(env, `/find/${tt}`, { external_source: "imdb_id" }, budget);
  const mv = (d.movie_results || [])[0], tv = (d.tv_results || [])[0];
  if (mv) return { id: tt, ...metaFrom(mv, "movie") };
  if (tv) return { id: tt, ...metaFrom(tv, "tv") };
  return { id: tt, type: "movie", name: null };   // keep it; Stremio still knows the id
}

async function byTmdb(env, kind, tid, budget) {
  const d = await tmdbGet(env, `/${kind}/${tid}`, { append_to_response: "external_ids" }, budget);
  const tt = d.imdb_id || d.external_ids?.imdb_id;
  return tt ? { id: tt, ...metaFrom(d, kind) } : null;
}

async function byTitle(env, title, year, budget, kindHint) {
  const tries = [];
  const order = kindHint === "tv" ? ["tv", "movie"] : ["movie", "tv"];
  for (const kind of order) {
    const yk = kind === "movie" ? "year" : "first_air_date_year";
    let d = await tmdbGet(env, `/search/${kind}`, { query: title, include_adult: "false", ...(year ? { [yk]: year } : {}) }, budget);
    if (!(d.results || []).length && year) d = await tmdbGet(env, `/search/${kind}`, { query: title, include_adult: "false" }, budget);
    const hit = (d.results || [])[0];
    if (hit) tries.push({ kind, hit, conf: confidence(title, year, hit) });
    if (tries.length && tries[tries.length - 1].conf >= 80) break;
  }
  if (!tries.length) return null;
  tries.sort((a, b) => b.conf - a.conf);
  const best = tries[0];
  const r = await byTmdb(env, best.kind, best.hit.id, budget);
  return r && { ...r, conf: best.conf };
}

async function wikidataBatch(env, lang, titles, budget) {
  // article titles → Wikidata items → IMDb id (P345) and whether it's a film/series
  const p = new URLSearchParams({ action: "query", prop: "pageprops", ppprop: "wikibase_item", titles: titles.join("|"), redirects: "1", format: "json" });
  const d = await get(`https://${lang}.wikipedia.org/w/api.php?${p}`, budget, WIKI_UA, true);
  const norm = {};
  for (const n of [...(d.query?.normalized || []), ...(d.query?.redirects || [])]) norm[n.to] = (norm[n.from] || n.from);
  const qByTitle = {};
  for (const pg of Object.values(d.query?.pages || {})) if (pg.pageprops?.wikibase_item) qByTitle[norm[pg.title] || pg.title] = pg.pageprops.wikibase_item;
  const qs = [...new Set(Object.values(qByTitle))];
  const out = {};
  if (!qs.length) return out;
  const w = await get(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: "wbgetentities", ids: qs.join("|"), props: "claims|labels", languages: "en", format: "json" })}`, budget, WIKI_UA, true);
  const SERIES = new Set(["Q5398426", "Q1259759", "Q526877", "Q63952888", "Q1366112", "Q117467246", "Q15416", "Q581714"]);
  for (const [t, q] of Object.entries(qByTitle)) {
    const e = w.entities?.[q];
    const tt = e?.claims?.P345?.map(c => c.mainsnak?.datavalue?.value).find(v => /^tt\d+$/.test(v || ""));
    if (!tt) continue;
    const isA = (e.claims?.P31 || []).map(c => c.mainsnak?.datavalue?.value?.id);
    const date = (e.claims?.P577 || e.claims?.P580 || [])[0]?.mainsnak?.datavalue?.value?.time || "";
    out[t] = { id: tt, name: e.labels?.en?.value || t.replace(/ \(.*\)$/, ""), year: (date.match(/\d{4}/) || [null])[0],
               type: isA.some(x => SERIES.has(x)) ? "series" : "movie" };
  }
  return out;
}

// several helpers can work on one import at once: each takes the rows whose idx % of == shard
async function resolveSome(env, job, budget, shard = 0, of = 1) {
  const isWiki = !!job.info.wlang;
  const pending = (await db(env).prepare("SELECT * FROM job_rows WHERE job=? AND status=0 AND (idx % ?)=? ORDER BY idx LIMIT ?")
    .bind(job.id, of, shard, isWiki ? 150 : 40).all()).results;
  if (!pending.length) {
    const left = await db(env).prepare("SELECT 1 FROM job_rows WHERE job=? AND status=0 LIMIT 1").bind(job.id).first();
    return !left;
  }
  const done = [];
  // Wikipedia rows: 50 at a time through Wikidata (2 requests per 50, no TMDB needed)
  const wiki = pending.filter(r => r.kind === "wiki");
  for (let i = 0; i < wiki.length && budget.left > 4; i += 50) {
    const batch = wiki.slice(i, i + 50);
    const found = await wikidataBatch(env, job.info.wlang || "en", batch.map(r => r.ref), budget);
    for (const r of batch) {
      const f = found[r.ref];
      done.push(f ? { ...r, status: 1, ...f, conf: 95 } : { ...r, status: 2 });
    }
  }
  let lbFetched = 0;
  for (const r of pending.filter(r => r.kind !== "wiki")) {
    if (budget.left < 14) break;          // room for byTitle (3) + saving the batch + progress
    let hit = null;
    try {
      if (r.kind === "id") hit = { ...(await byImdb(env, r.ref, budget)), conf: 100 };
      else if (r.kind === "tmdb") { const [k, i] = r.ref.split(":"); hit = await byTmdb(env, k, i, budget); if (hit) hit.conf = 100; }
      else if (r.kind === "lb" && (job.info.lbRefused || 0) >= 8) {
        // Letterboxd keeps refusing film pages: match by the title in the slug instead ("the-thing-1982")
        const m = r.ref.split("\u0000")[0].match(/^(.*?)(?:-(\d{4}))?(?:-\d+)?$/);
        hit = await byTitle(env, m[1].replace(/-/g, " "), m[2] || "", budget);
      } else if (r.kind === "lb" && r.ref.includes("\u0000") &&
                 (hit = await byTitle(env, r.ref.split("\u0000")[1], r.ref.split("\u0000")[2], budget)) && hit.conf >= 80) {
        hit.conf = Math.max(hit.conf, 95);                                 // Letterboxd's own title + year
      } else if (r.kind === "lb") {
        hit = null;
        r.ref = r.ref.split("\u0000")[0];
        if (lbFetched++) await new Promise(z => setTimeout(z, 350));      // stay under Letterboxd's burst limit
        let html;
        try { html = await get(`https://letterboxd.com/film/${r.ref}/`, budget); }
        catch (e) {
          if (!/answered (403|429|5\d\d)/.test(String(e.message))) throw e;
          job.info.lbRefused = (job.info.lbRefused || 0) + 1;              // leave this row pending; next step retries
          job.info.msg = "Letterboxd asked us to slow down; carrying on in a moment…";
          await new Promise(z => setTimeout(z, 2000));
          break;
        }
        job.info.lbRefused = 0;
        const tt = (html.match(/imdb\.com\/title\/(tt\d{7,9})/) || [])[1];
        const tm = html.match(/data-tmdb-type="(movie|tv)"[^>]*data-tmdb-id="(\d+)"|data-tmdb-id="(\d+)"[^>]*data-tmdb-type="(movie|tv)"/);
        if (tm) { const kind = tm[1] || tm[4], id = tm[2] || tm[3]; hit = await byTmdb(env, kind, id, budget); }
        if (!hit && tt) hit = await byImdb(env, tt, budget);
        if (hit) hit.conf = 100;
      } else {
        const [title, year] = r.ref.split("\u0000");
        hit = await byTitle(env, title, year, budget);
      }
    } catch (e) {
      if (String(e.message) === "budget") break;
      hit = null;
    }
    done.push(hit && hit.id ? { ...r, status: 1, ...hit } : { ...r, status: 2 });
  }
  for (const d of done) if (d.status === 1 && !d.poster) d.poster = POSTER(d.id);   // Stremio's own poster service
  if (done.length) {
    await insertMany(env, "job_rows", ["job", "idx", "kind", "input", "status", "id", "type", "name", "year", "poster", "genres", "conf"],
      done.map(d => [job.id, d.idx, d.kind, d.input, d.status, d.id || null, d.type || "movie", d.name || null, d.year || null, d.poster || null, d.genres || null, d.conf ?? null]),
      `ON CONFLICT(job, idx) DO UPDATE SET status=excluded.status, id=excluded.id, type=excluded.type, name=excluded.name,
       year=excluded.year, poster=excluded.poster, genres=excluded.genres, conf=excluded.conf`);
  }
  job.info.msg = "";
  const left = await db(env).prepare("SELECT COUNT(*) n FROM job_rows WHERE job=? AND status=0").bind(job.id).first();
  return left.n === 0;
}

// ── commit: selected rows → titles + the chosen list (+ ratings carried by CSVs)
export async function commit(env, job, uid, idxs, target) {
  const { upsertTitles, addMany, rateMany } = await import("./store.js");
  idxs = idxs.slice(0, 150).map(Number).filter(Number.isInteger);
  if (!idxs.length) return { added: 0 };
  const rows = [];
  for (let i = 0; i < idxs.length; i += 90) {           // D1 allows at most 100 values per query
    const part = idxs.slice(i, i + 90);
    rows.push(...(await db(env).prepare(`SELECT * FROM job_rows WHERE job=? AND status=1 AND idx IN (${part.map(() => "?").join(",")})`)
      .bind(job.id, ...part).all()).results);
  }
  await upsertTitles(env, rows.map(r => ({ id: r.id, type: r.type, name: r.name || r.input, year: r.year, poster: r.poster, genres: r.genres })));
  const base = Date.now();
  if (target !== "rated") await addMany(env, uid, target, rows.map((r, i) => ({ id: r.id, type: r.type, added: base - r.idx })));
  const rated = rows.filter(r => r.stars);
  if (rated.length) await rateMany(env, uid, rated.map(r => ({ id: r.id, type: r.type, stars: r.stars })));
  return { added: rows.length, rated: rated.length };
}
