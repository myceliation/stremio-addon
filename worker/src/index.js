import { json, html, CORS, parseExtra, cacheGet, cachePut, ALS, countingDB, used, spend, room } from "./util.js";
import { buildManifest, historyManifest, publicManifest, RATING_FILTERS, listFilters, ADDON_ID, HISTORY_ID, servicePacks, packManifest, VERSION, allServicesManifest, microgenresManifest, sidesManifest, mgPartPath, mgPartCount, libraryManifest, libPartCount, LIB_ALL, fromPhones, sideShown } from "./manifest.js";
import { sidesSpec, SIDE_ALL } from "./sides.js";
import { BUILD } from "./build.js";
import { CAT_ROWS } from "./catrows.js";
import { BUILDERS, genreId, COUNTRIES_BY_NAME, WIDE_COUNTRIES } from "./catalogs.js";
import { ITEM_META } from "./itemmeta.js";
import { syncAwards, awardItems } from "./awardsync.js";
import { AWARD_LISTS } from "./awards.js";
const AWARD_IDS = new Set(AWARD_LISTS.map(a => a.id));
import { pagedCatalog, newBudget, toMeta, imdbMap, tmdb, titleInfo } from "./tmdb.js";
import * as S from "./store.js";
import * as I from "./importer.js";
import { getUser, linkCreate, linkRead, datastoreMeta, datastorePut, libraryItem, reorderAddons } from "./stremio.js";
import { configurePage, importPage, actPage, sharePage, historySetupPage, markPage, untaggedPage, LOGO_SVG, HISTORY_SVG, tileSvg } from "./pages.js";
import { PROVIDERS, REGIONS, normalizeProviders, MOVIE_GENRES, TV_GENRES } from "./providers.js";
import { MICROGENRES, MG_BY_ID, matchMicrogenres, mgString, mgCurrent, familyOf, FAMILIES, mgByName } from "./microgenres.js";
import UI_PLUGIN from "./uiplugin.js";

export default {
  // hourly (wrangler.toml [triggers]): even hours keep the festival and award rows current; odd hours put a new version
  // of Mycelium's add-ons into the Stremio accounts of everyone who connected theirs (Stremio keeps the copy it installed)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(ALS.run({ used: 0 }, async () => {
      const e2 = { ...env, DB: countingDB(env.DB) };
      const odd = new Date(event.scheduledTime || Date.now()).getUTCHours() % 2;
      try { console.log(odd ? "updates" : "awards", JSON.stringify(odd ? await autoUpdate(e2) : await syncAwards(e2))); }
      catch (e) { console.error(odd ? "updates" : "awards", e && e.stack || e); }
    }));
  },
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    // extras ("genre=Rated 4+&skip=100") are decoded by parseExtra itself, so a "+" or "&" inside survives
    const parts = url.pathname.split("/").filter(Boolean).map(x => (x.includes("=") ? x : decodeURIComponent(x)));
    return ALS.run({ used: 0 }, async () => {
      const e2 = { ...env, DB: countingDB(env.DB), ORIGIN: url.origin };
      try {
        const res = await route(req, e2, ctx, url, url.origin, parts);
        if (env.DEV_COUNT) res.headers.set("x-subrequests", String(used()));
        return res;
      } catch (e) {
        console.error(e && e.stack || e);
        // a catalog that fails should look empty to Stremio, not break the board
        if (parts[1] === "catalog" || parts[2] === "catalog") return json({ metas: [] }, 200, { "cache-control": "no-store" });
        return json({ error: String(e.message || e) }, 500);
      }
    });
  },
};

const body = async req => { try { return await req.json(); } catch { return {}; } };
const pageOpts = (origin, token = "") => ({ origin, token, providers: PROVIDERS, regions: REGIONS, microgenres: MICROGENRES });

async function route(req, env, ctx, url, origin, p) {
  // ── public ────────────────────────────────────────────────────────────────
  if (p.length === 0) return Response.redirect(origin + "/configure", 302);
  if (p[0] === "logo.svg") return new Response(LOGO_SVG, { headers: { "content-type": "image/svg+xml", "cache-control": "max-age=86400", ...CORS } });
  if (p[0] === "configure") return html(configurePage(pageOpts(origin)));
  if (p[0] === "ui") return ui(req, url);
  if (p[0] === "history.svg") return new Response(HISTORY_SVG, { headers: { "content-type": "image/svg+xml", "cache-control": "max-age=86400", ...CORS } });
  if (p[0] === "tile" && p[1]) return new Response(tileSvg(p[1].replace(/\.svg$/, "")), { headers: { "content-type": "image/svg+xml", "cache-control": "max-age=86400", ...CORS } });
  if (p[0] === "manifest.json") return json(publicManifest(origin));
  if (p[0] === "version.json") return json({ version: VERSION, build: BUILD }, 200, { "cache-control": "no-store" });
  if ((p[0] === "history" || p[0] === "watched") && p[1] === "manifest.json") return json(publicManifest(origin, "history"));
  if (p[0] === "history" || p[0] === "watched") return html(historySetupPage({ origin }));

  if (p[0] === "api" && p[1] === "new" && req.method === "POST") {
    const ip = req.headers.get("cf-connecting-ip");          // absent only in local dev
    const k = "rl:new:" + ip;
    const n = ((await cacheGet(k)) || 0) + 1;
    if (ip && !env.DEV_NO_RATELIMIT && n > 5) return json({ error: "Too many new accounts from this network. Try again in an hour." }, 429);
    await cachePut(k, n, 3600);
    return json({ token: (await S.createUser(env)).token });
  }

  if (p[0] === "u" && p[1]) return share(env, origin, p);

  // Live from TMDB (JustWatch data): every region, and which services exist where
  if (p[0] === "api" && p[1] === "regions") {
    const d = await tmdb(env, "/watch/providers/regions", {}, null, 86400);
    return json((d.results || []).map(r => ({ code: r.iso_3166_1, name: r.english_name })).sort((a, b) => a.name.localeCompare(b.name)),
      200, { "cache-control": "max-age=86400" });
  }
  if (p[0] === "api" && p[1] === "providers") {
    const regions = (url.searchParams.get("regions") || "US").split(",").filter(r => /^[A-Z]{2}$/.test(r)).slice(0, 6);
    const byId = {};
    for (const r of regions) for (const kind of ["movie", "tv"]) {
      const d = await tmdb(env, `/watch/providers/${kind}`, { watch_region: r }, null, 86400);
      for (const x of d.results || []) {
        const e = (byId[x.provider_id] ||= { id: String(x.provider_id), name: x.provider_name,
          logo: x.logo_path ? "https://image.tmdb.org/t/p/w92" + x.logo_path : null, regions: [], rank: 999 });
        if (!e.regions.includes(r)) e.regions.push(r);
        e.rank = Math.min(e.rank, (x.display_priorities || {})[r] ?? x.display_priority ?? 999);
      }
    }
    return json(Object.values(byId).sort((a, b) => a.rank - b.rank), 200, { "cache-control": "max-age=86400" });
  }

  // ── per user: /{token}/… ──────────────────────────────────────────────────
  const user = await S.userByToken(env, p[0]);
  if (!user) {
    if (p[1] === "manifest.json") return json(publicManifest(origin));
    if ((p[1] === "history" || p[1] === "watched") && p[2] === "manifest.json") return json(publicManifest(origin, "history"));
    return json({ error: "Unknown install link. Set Mycelium up again at " + origin + "/configure" }, 404);
  }
  const T = user.token;

  if (p[1] === "manifest.json") {
    await ensureHomeServices(env, user).catch(() => {});
    if (user.settings.origin !== origin || user.settings.servedBuild !== BUILD) {
      user.settings.origin = origin; user.settings.servedBuild = BUILD; await S.saveSettings(env, user).catch(() => {});
    }
    return json(buildManifest(user, origin, await S.getLists(env, user.uid)), 200, { "cache-control": "max-age=60" });
  }

  // the extra service add-ons: /{token}/services/{n}/… and /{token}/allservices/{movie|series}/…
  // 📚 Library by microgenre: /{token}/library/{movie|series}/…  (served by the same catalog code as the main add-on)
  if (/^library\d?$/.test(p[1] || "") && p[2]) {
    if (p[3] === "manifest.json") return json(libraryManifest(user, origin, p[2], +p[1].slice(7) || 1), 200, { "cache-control": "max-age=60" });
    if (p[3] === "catalog") {
      const type = p[4], id = (p[5] || "").replace(/\.json$/, ""), extra = fromPhones(id, parseExtra((p[6] || "").replace(/\.json$/, "")));
      if (extra.microgenre === LIB_ALL) delete extra.microgenre;
      if (!/^lib\.|^list\.library$/.test(id)) return json({ metas: [] });
      try { return json({ metas: await catalog(env, user, type, "list.library", extra) }, 200, { "cache-control": "max-age=60" }); }
      catch { return json({ metas: [] }); }
    }
  }
  if ((p[1] === "services" || p[1] === "allservices" || /^microgenres\d?$/.test(p[1] || "") || p[1] === "sides") && p[2]) {
    if (p[3] === "manifest.json") {
      const m = p[1] === "services" ? packManifest(user, origin, await S.getLists(env, user.uid), +p[2])
        : /^microgenres\d?$/.test(p[1]) ? microgenresManifest(user, origin, p[2], +p[1].slice(11) || 1)
        : p[1] === "sides" ? sidesManifest(user, origin, p[2]) : allServicesManifest(user, origin, p[2]);
      return m ? json(m, 200, { "cache-control": "max-age=60" }) : json({ error: "no such pack" }, 404);
    }
    if (p[3] === "catalog") {
      const type = p[4], id = (p[5] || "").replace(/\.json$/, ""), extra = fromPhones(id, parseExtra((p[6] || "").replace(/\.json$/, "")));
      if (!(id.startsWith("prov.") || id === "svc" || id.startsWith("mgf.") || id.startsWith("war.") || id === "prej")) return json({ metas: [] });
      try { return json({ metas: await catalog(env, user, type, id, extra) }, 200, { "cache-control": "max-age=60" }); }
      catch { return json({ metas: [] }); }
    }
  }
  if (p[1] === "configure") return html(configurePage(pageOpts(origin, T)));
  if (p[1] === "untagged") return html(untaggedPage({ token: T, list: await S.untaggedTitles(env, user.uid), waiting: (await S.titlesMissingMg(env, user.uid, 5000)).length }));
  if (p[1] === "import") return html(importPage(pageOpts(origin, T)));

  // Watch History add-on, served under /{token}/history/ (old /watched/ links still work)
  if (p[1] === "history" || p[1] === "watched") {
    if (p[2] === "manifest.json") return json(historyManifest(user, origin), 200, { "cache-control": "max-age=60" });
    if (p[2] === "catalog") {
      const type = p[3], id = (p[4] || "").replace(/\.json$/, ""), extra = parseExtra((p[5] || "").replace(/\.json$/, ""));
      const skip = +extra.skip || 0;
      if (user.auth_enc) { try { await S.refreshHistory(env, user); } catch { /* serve what we have */ } }
      let metas = [];
      if (id === "list.watched") metas = await S.listPage(env, user, "watched", type, { skip, f: listF(extra) });
      else if (id === "hist.progress") metas = await S.historyPage(env, user, type, "In progress", skip);
      else if (id === "hist.rewatched") metas = await S.historyPage(env, user, type, "Rewatched", skip);
      return json({ metas }, 200, { "cache-control": "max-age=60" });
    }
    // "Mark as watched" entry on every title, from any add-on
    if (p[2] === "stream") {
      const type = p[3], id = (p[4] || "").replace(/\.json$/, "").split(":")[0];
      if (!/^tt\d+$/.test(id)) return json({ streams: [] });
      const on = (await S.membership(env, user.uid, [id]))[id].lists.includes("watched");
      return json({ streams: [{
        name: "🕓 Watch History",
        title: on ? "✔ In your Watch History\nTap to remove it" : "Mark as watched\nAdds it to your Watch History",
        externalUrl: `${origin}/${T}/history/mark/${type}/${id}?do=${on ? "remove" : "add"}`,
      }] }, 200, { "cache-control": "no-store" });
    }
    if (p[2] === "mark") {
      const type = p[3] === "series" ? "series" : "movie", id = p[4];
      if (!/^tt\d+$/.test(id || "")) return json({ error: "bad id" }, 400);
      const add = url.searchParams.get("do") !== "remove";
      const meta = await S.ensureTitle(env, type, id);
      await S.setMember(env, user.uid, "watched", id, type, add);
      await S.mirrorToStremio(env, user, "watched", id, type, add);
      return html(markPage({ token: T, type, id, meta, added: add }));
    }
    return html(historySetupPage({ origin, token: T }));
  }

  if (p[1] === "catalog") {
    const type = p[2], id = (p[3] || "").replace(/\.json$/, "");
    const extra = parseExtra((p[4] || "").replace(/\.json$/, ""));
    return json({ metas: await catalog(env, user, type, id, extra) }, 200, { "cache-control": "max-age=60" });
  }

  if (p[1] === "meta" && /^tt\d+/.test(p[3] || "")) {
    const type = p[2] === "series" ? "series" : "movie", id = p[3].replace(/\.json$/, "").split(":")[0];
    const meta = await cinemetaMeta(type, id);
    if (!meta) return json({ meta: null }, 404);                       // Stremio then uses the next add-on's page
    try {
      const ms = await microgenresOf(env, type, id, meta);
      const manifestUrl = encodeURIComponent(`${origin}/${T}/manifest.json`);
      // phones and TVs don't show link groups other than Stremio's own, so the microgenres also go in the description,
      // first (TV pages only show its opening lines)
      if (ms.length) meta.description = `🍄 ${ms.slice(0, 8).map(m => m.tag.replace(/:.*$/, "")).join(" · ")}\n\n${meta.description || ""}`.trim();
      meta.links = [...(meta.links || []), ...ms.slice(0, 14).map(m => ({ name: m.tag.replace(/:.*$/, ""), category: "Microgenres",
        url: sideShown(m) ? `stremio:///discover/${encodeURIComponent(`${origin}/${T}/sides/${m.type}/manifest.json`)}/${m.type}/war.${m.side}?genre=${encodeURIComponent(SIDE_ALL)}`
          : `stremio:///discover/${encodeURIComponent(`${origin}/${T}/${mgPartPath(m.type, familyOf(m))}/${m.type}/manifest.json`)}/${m.type}/mgf.${familyOf(m)}?genre=${encodeURIComponent(m.name)}` }))];
    } catch { /* the page without microgenres */ }
    return json({ meta }, 200, { "cache-control": "max-age=3600" });
  }

  if (p[1] === "meta") {
    const id = (p[3] || "").replace(/\.json$/, "");
    const t = tile(origin, T, user, id);
    if (!t) return json({ meta: null }, 404);
    return json({ meta: { id, type: "movie", name: t.name, poster: t.poster, posterShape: "poster", background: origin + "/tile/bg.svg",
      description: t.description, behaviorHints: { defaultVideoId: id } } });
  }

  if (p[1] === "stream" && (p[3] || "").startsWith("myc:")) {
    const t = tile(origin, T, user, (p[3] || "").replace(/\.json$/, ""));
    return json({ streams: t ? [{ name: "🍄 Mycelium", title: t.action, externalUrl: t.url },
      ...(t.seriesUrl ? [{ name: "🍄 Mycelium", title: "Open it in Discover (series)", externalUrl: t.seriesUrl }] : [])] : [] }, 200, { "cache-control": "no-store" });
  }

  if (p[1] === "stream") {
    const type = p[2], id = (p[3] || "").replace(/\.json$/, "").split(":")[0];
    const st = (await S.membership(env, user.uid, [id]))[id];
    const lists = await S.getLists(env, user.uid);
    const names = st.lists.map(l => l === "library" ? "📚 Library" : l.startsWith("l:") ? "📋 " + ((lists.find(x => "l:" + x.lid === l) || {}).name || "list")
      : (S.SHELVES.find(s => s.key === l) || {}).icon + " " + (S.SHELVES.find(s => s.key === l) || {}).label);
    return json({ streams: [{
      name: "🍄 Mycelium",
      title: [names.join("  ") || "Not in your lists", "Tap to add or shelve"].filter(Boolean).join("\n"),
      externalUrl: `${origin}/${T}/act/${type}/${id}`,
    }] }, 200, { "cache-control": "no-store" });
  }

  if (p[1] === "act") {
    const type = p[2] === "series" ? "series" : "movie", id = p[3];
    if (!/^tt\d+$/.test(id || "")) return json({ error: "bad id" }, 400);
    const meta = await S.ensureTitle(env, type, id);
    const st = (await S.membership(env, user.uid, [id]))[id];
    return html(actPage({ origin, token: T, type, id, meta, state: st, shelves: S.SHELVES, lists: await S.getLists(env, user.uid) }));
  }

  if (p[1] === "api") return api(req, env, ctx, url, origin, user, p.slice(2));
  return json({ error: "not found" }, 404);
}

// ── JSON API (configure page, import page, act page, plugin, migration) ─────
async function api(req, env, ctx, url, origin, user, p) {
  const T = user.token;
  const b = req.method === "POST" ? await body(req) : {};

  // your library's import batches (worked out from the offline tool's import times), as a Library dropdown
  if (p[0] === "batches" && req.method === "POST") {
    user.settings.batches = (Array.isArray(b.batches) ? b.batches : []).slice(0, 80).map(x => ({
      name: String(x.name || "").slice(0, 90), from: +x.from || 0, to: +x.to || 0, n: +x.n || 0,
      ...(Array.isArray(x.ranges) ? { ranges: x.ranges.slice(0, 200).map(r => [+r[0] || 0, +r[1] || 0]) } : {}),
    })).filter(x => x.name);
    // the times were written by the PC that ran the migration, in its own time zone: if the first batch finds nothing,
    // line the batches up with the library's actual first import (to the nearest quarter hour)
    const bs = user.settings.batches;
    if (bs.length && bs[0].to) {
      const q = "SELECT COUNT(*) n, MIN(added) a FROM items WHERE uid=? AND list='library'";
      const hit = await env.DB.prepare(q + " AND added BETWEEN ? AND ?").bind(user.uid, bs[0].from, bs[0].to).first();
      if (!hit.n) {
        const first = await env.DB.prepare(q).bind(user.uid).first();
        const off = first.a ? Math.round((first.a - bs[0].from - 60000) / 9e5) * 9e5 : 0;
        if (off) for (const x of bs) { x.from += off; x.to += off; if (x.ranges) x.ranges = x.ranges.map(([a, z]) => [a + off, z + off]); }
      }
    }
    await S.saveSettings(env, user);
    return json({ ok: true, batches: user.settings.batches.length });
  }
  if (p[0] === "settings") {
    if (req.method === "POST") {
      const keep = ["mgTop", "mgAll", "histV", "batches", "origin", "servedBuild", "autoBuild", "homeServices", "homeServicesFor"];
      user.settings = { ...sanitizeSettings(b), ...Object.fromEntries(keep.map(k => [k, user.settings[k]])) };
      await S.saveSettings(env, user);
      await ensureHomeServices(env, user).catch(() => {});
    }
    return json({
      settings: user.settings, share: `${origin}/u/${user.share}`,
      install: `${origin}/${T}/manifest.json`, installWatched: `${origin}/${T}/watched/manifest.json`,
      historyConnected: !!user.auth_enc, counts: await S.listCounts(env, user.uid), lists: await S.getLists(env, user.uid),
    });
  }

  if (p[0] === "lists") {
    if (!p[1] && req.method === "POST") return json(await S.createList(env, user.uid, b.name || "Untitled list"));
    if (p[1] && p[2] === "delete" && req.method === "POST") { await S.deleteList(env, user.uid, p[1]); return json({ ok: true }); }
    if (p[1] && req.method === "POST") { await S.updateList(env, user.uid, p[1], b); return json({ ok: true }); }
    return json(await S.getLists(env, user.uid));
  }

  if (p[0] === "state") {
    const ids = (url.searchParams.get("ids") || url.searchParams.get("id") || "").split(",").filter(x => /^tt\d+$/.test(x)).slice(0, 50);
    return json(await S.membership(env, user.uid, ids));
  }

  if ((p[0] === "member" || p[0] === "shelf") && req.method === "POST") {
    const list = b.list || b.shelf, id = b.id, type = b.type === "series" ? "series" : "movie";
    if (!/^tt\d+$/.test(id || "") || !S.isListKey(list)) return json({ error: "bad id or list" }, 400);
    if (b.on) await S.ensureTitle(env, type, id);
    await S.setMember(env, user.uid, list, id, type, !!b.on);
    if (b.on && list === "loved") { await S.setMember(env, user.uid, "dropped", id, type, false); await S.setMember(env, user.uid, "liked", id, type, false); }
    if (b.on && list === "liked") await S.setMember(env, user.uid, "loved", id, type, false);
    if (b.on && list === "dropped") { await S.setMember(env, user.uid, "loved", id, type, false); await S.setMember(env, user.uid, "liked", id, type, false); }
    await S.mirrorToStremio(env, user, list === "dropped" && b.on ? "loved" : list, id, type, list === "dropped" ? false : !!b.on);
    return json((await S.membership(env, user.uid, [id]))[id]);
  }

  if (p[0] === "rate" && req.method === "POST") {
    if (!/^tt\d+$/.test(b.id || "")) return json({ error: "bad id" }, 400);
    const type = b.type === "series" ? "series" : "movie";
    if (b.stars) await S.ensureTitle(env, type, b.id);
    await S.rate(env, user.uid, b.id, type, b.stars, b.review);
    return json((await S.membership(env, user.uid, [b.id]))[b.id]);
  }

  // ── list scraping ──────────────────────────────────────────────────────────
  if (p[0] === "import") {
    if (p[1] === "start" && req.method === "POST") {
      if (!S.isListKey(b.target) && b.target !== "rated") return json({ error: "Pick where the titles should go." }, 400);
      if (!b.url && !(b.rows || []).length) return json({ error: "Nothing to import: paste a list, a link or a CSV." }, 400);
      if (b.url && !/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(String(b.url))) return json({ error: "That isn't a web link (it should start with https://)." }, 400);
      const id = await I.startJob(env, user.uid, { source: b.source || (b.url ? "url" : "paste"), target: b.target, rows: (b.rows || []).slice(0, 6000), url: b.url,
        wlang: /^[a-z]{2,3}$/.test(b.wlang || "") ? b.wlang : null, maxRows: +b.maxRows || 0 });
      return json({ job: id });
    }
    const job = p[1] && await I.getJob(env, user.uid, p[1]);
    if (!job) return json({ error: "That import has expired. Start it again." }, 404);
    if (p[2] === "step" && req.method === "POST") return json(await I.step(env, job, +b.shard || 0, +b.of || 1));
    if (p[2] === "results") return json({ target: job.target, rows: await I.results(env, job) });
    if (p[2] === "commit" && req.method === "POST") {
      const target = b.target || job.target;
      if (!S.isListKey(target) && target !== "rated") return json({ error: "bad target" }, 400);
      return json(await I.commit(env, job, user.uid, b.idxs || [], target));
    }
    return json(await I.progress(env, job));
  }

  // microgenres of saved titles: work out the missing ones a few at a time, then rank them for the dropdown
  if (p[0] === "mg-fill" && req.method === "POST") {
    const todo = await S.titlesMissingMg(env, user.uid, 5);
    for (const t of todo) { try { await microgenresOf(env, t.type, t.id); } catch { break; } }
    const left = (await S.titlesMissingMg(env, user.uid, 1)).length;
    return json({ filled: todo.length, done: !left });
  }
  if (p[0] === "addons") {
    const packs = servicePacks(user, origin, await S.getLists(env, user.uid));
    return json([`${origin}/${T}/manifest.json`, ...(user.settings.rows.historyAddon ? [`${origin}/${T}/history/manifest.json`] : []),
      ...(user.settings.rows.library ? ["movie", "series"].flatMap(t => Array.from({ length: libPartCount(user, t) }, (_, i) => `${origin}/${T}/library${i ? i + 1 : ""}/${t}/manifest.json`)) : []),
      `${origin}/${T}/allservices/movie/manifest.json`, `${origin}/${T}/allservices/series/manifest.json`,   // ✎ your genres, 📺 services and channels
      ...["movie", "series"].flatMap(t => Array.from({ length: mgPartCount(t) }, (_, i) => `${origin}/${T}/microgenres${i ? i + 1 : ""}/${t}/manifest.json`)),
      `${origin}/${T}/sides/movie/manifest.json`, `${origin}/${T}/sides/series/manifest.json`,
      ...packs.map((_, i) => `${origin}/${T}/services/${i + 1}/manifest.json`)]);
  }
  if (p[0] === "mg-stats" && req.method === "POST") return json({ ok: true, microgenres: await S.microgenreStats(env, user) });

  // Bulk add with metadata in hand (migration from the offline tool, extension)
  if (p[0] === "bulk" && req.method === "POST") {
    const items = (b.items || []).slice(0, 150).filter(x => /^tt\d+$/.test(x.id || ""));
    for (const x of items) if (Array.isArray(x.kw)) x.mg = mgString(matchMicrogenres(x.type === "series" ? "series" : "movie", {
      imdb: x.id, kw: new Set(x.kw.map(Number)), genres: new Set(genreIds(x.genres)), lang: x.lang || null,
      year: +String(x.year || "").slice(0, 4) || 0, countries: new Set(x.countries || []) }));
    if (items.length) await S.upsertTitles(env, items);
    let added = 0, rated = 0;
    if (b.list && items.length) { if (!S.isListKey(b.list)) return json({ error: "bad list" }, 400); added = await S.addMany(env, user.uid, b.list, items); }
    if ((b.ratings || []).length) rated = await S.rateMany(env, user.uid, b.ratings.slice(0, 150));
    return json({ ok: true, added, rated });
  }

  // ── move Mycelium + Watch History up in Stremio's add-on order ─────────────
  // uses the stored key when history is connected, otherwise a one-time code login whose key is not kept
  if (p[0] === "addon-order" && req.method === "POST") {
    let key = null;
    if (/^[A-Za-z0-9+/=_-]{20,200}$/.test(b.authKey || "")) key = b.authKey;        // from the page's own code login; used once, not kept
    else if (b.code) { key = await linkRead(String(b.code)); if (!key) return json({ pending: true }); }
    else if (user.auth_enc) key = await S.authKeyOf(env, user);
    else return json({ needCode: true });
    await ensureHomeServices(env, user).catch(() => {});
    const fresh = await freshAddons(env, user, origin);
    const where = ["after-cinemeta", "keep"].includes(b.where) ? b.where : "top";
    try {
      const r = await reorderAddons(key, where, [ADDON_ID, HISTORY_ID], fresh);
      if (r.ok) { user.settings.servedBuild = user.settings.autoBuild = BUILD; await S.saveSettings(env, user).catch(() => {}); }
      return json(r);
    }
    catch (e) { return json({ ok: false, error: String(e.message || e) }); }
  }

  // ── Stremio account (optional) ─────────────────────────────────────────────
  if (p[0] === "history") {
    if (p[1] === "start") { try { return json(await linkCreate()); } catch (e) { return json({ error: String(e.message || e) }); } }
    // the Mycelium window on your PC does the code login itself and hands over the resulting key
    if (p[1] === "connect" && req.method === "POST") {
      if (!/^[A-Za-z0-9+/=_-]{20,200}$/.test(b.authKey || "")) return json({ error: "bad key" }, 400);
      try { await S.connectHistory(env, user, b.authKey); return json({ connected: true }); }
      catch (e) { return json({ connected: false, error: String(e.message || e) }); }
    }
    if (p[1] === "poll") {
      const key = await linkRead(url.searchParams.get("code") || "");
      if (!key) return json({ pending: true });
      await S.connectHistory(env, user, key);
      return json({ connected: true });
    }
    if (p[1] === "disconnect" && req.method === "POST") { await S.disconnectHistory(env, user); return json({ connected: false }); }
    if (!user.auth_enc) return json({ connected: false });
    let account = null;
    try { const u = await getUser(await S.unseal(env, user.auth_enc)); account = (u && (u.email || (u.user || {}).email)) || null; } catch { /* key no longer valid */ }
    return json({ connected: true, account });
  }
  if (p[0] === "warm") {
    if (!user.auth_enc) return json({ connected: false, complete: true, titles: 0 });
    return json(await S.refreshHistory(env, user, { force: true, maxFetch: 300 }));
  }
  // Copy one of your lists into Stremio's own Library (only titles not already there)
  if (p[0] === "to-stremio" && req.method === "POST") {
    if (!user.auth_enc) return json({ error: "Connect your Stremio account first (Watch history section)." }, 400);
    if (!S.isListKey(b.list)) return json({ error: "bad list" }, 400);
    const authKey = await S.unseal(env, user.auth_enc);
    const existing = new Set((await datastoreMeta(authKey)).map(([id]) => id));
    const offset = +b.offset || 0;
    const r = await env.DB.prepare(`SELECT i.id, i.type, t.name, t.poster FROM items i LEFT JOIN titles t ON t.id=i.id
        WHERE i.uid=? AND i.list=? ORDER BY i.added DESC LIMIT 200 OFFSET ?`).bind(user.uid, b.list, offset).all();
    const fresh = r.results.filter(x => !existing.has(x.id));
    if (fresh.length) await datastorePut(authKey, fresh.map(x => libraryItem(x, b.list === "watched")));
    return json({ pushed: fresh.length, scanned: r.results.length, next: r.results.length === 200 ? offset + 200 : null });
  }

  if (p[0] === "export") {
    const list = url.searchParams.get("list") || "library";
    // JSON with genres, language and your stars: used by check_mycelium.py to compare against the offline tool
    if (url.searchParams.get("format") === "json") {
      const r = list === "rated"
        ? await env.DB.prepare(`SELECT r.id, r.type, t.name, t.year, t.genres, t.lang, r.stars, r.review FROM ratings r LEFT JOIN titles t ON t.id=r.id WHERE r.uid=?`).bind(user.uid).all()
        : await env.DB.prepare(`SELECT i.id, i.type, t.name, t.year, t.genres, t.lang, r.stars FROM items i LEFT JOIN titles t ON t.id=i.id
            LEFT JOIN ratings r ON r.uid=i.uid AND r.id=i.id WHERE i.uid=? AND i.list=?`).bind(user.uid, list).all();
      return json(r.results.map(x => ({ ...x, genres: String(x.genres || "").split("|").filter(Boolean) })));
    }
    const r = await env.DB.prepare(`SELECT i.id, i.type, t.name, t.year, i.added FROM items i LEFT JOIN titles t ON t.id=i.id
        WHERE i.uid=? AND i.list=? ORDER BY i.added DESC`).bind(user.uid, list).all();
    const csv = "Const,Title,Year,Type,Added\n" + r.results.map(x =>
      [x.id, `"${String(x.name || "").replace(/"/g, '""')}"`, x.year || "", x.type, new Date(x.added).toISOString().slice(0, 10)].join(",")).join("\n");
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="mycelium-${list.replace(/\W/g, "-")}.csv"`, ...CORS } });
  }

  if (p[0] === "delete" && req.method === "POST") { await S.deleteUser(env, user); return json({ ok: true }); }
  return json({ error: "not found" }, 404);
}

function sanitizeSettings(s) {
  const out = S.mergeSettings(s);
  out.regions = [...new Set((s.regions || [s.region || "US"]).filter(r => /^[A-Z]{2}$/.test(r)))].slice(0, 200);
  if (!out.regions.length) out.regions = ["US"];
  out.region = out.regions[0];
  out.displayName = String(s.displayName || "").slice(0, 40);
  out.providers = normalizeProviders(s.providers).map(({ name, ids }) => ({ name, ids })).slice(0, 500);
  out.microgenres = (s.microgenres || []).filter(x => MICROGENRES.some(m => m.id === x)).slice(0, 20);
  out.custom = (s.custom || []).slice(0, 15).map((c, i) => ({
    id: c.id || "c" + Date.now().toString(36) + i, name: String(c.name || c.query || "").slice(0, 60),
    query: String(c.query || "").slice(0, 120), type: c.type === "series" ? "series" : "movie",
  })).filter(c => c.query);
  out.rows = Object.fromEntries(Object.keys(S.DEFAULT_SETTINGS.rows).map(k => [k, !!(s.rows || {})[k]]));
  for (const k of ["hideIgnored", "hideWatched", "shelveButton"]) out[k] = !!s[k];
  out.autoUpdate = s.autoUpdate !== false;
  return out;
}

// ── catalogs ─────────────────────────────────────────────────────────────────
// the separate list dropdowns; an old-style single "genre" value is passed as legacy
function listF(extra) {
  const known = ["Shuffle", "Oldest added", "Release year", "TMDB rating", "A–Z"];
  const legacy = extra.genre && (known.includes(extra.genre) || /^(Decade|Language): |^Rated \d\+$/.test(extra.genre)) ? extra.genre : "";
  return { legacy, genre: legacy ? null : extra.genre, and: extra.and, year: extra.year, language: extra.language,
    show: extra.show, sort: extra.sort_by, search: extra.search, microgenre: extra.microgenre, batch: extra.import };
}

async function catalog(env, user, type, id, extra) {
  const skip = +extra.skip || 0;
  if (id.startsWith("list.")) {
    const list = id.slice(5);
    if (!S.isListKey(list)) return [];
    // with Stremio connected, anything finished in Stremio joins Watched before the row is built
    // (at most every 10 minutes), so Library's "Not watched yet" and Watched stay current on their own
    if (user.auth_enc && (list === "library" || list === "watched")) { try { await S.refreshHistory(env, user); } catch { /* use what we have */ } }
    const hide = list === "library" ? [...(user.settings.hideWatched ? ["watched"] : []), ...(user.settings.hideIgnored ? ["ignore", "blacklist"] : [])] : [];
    return S.listPage(env, user, list, type, { skip, hide, f: listF(extra) });
  }
  if (id === "hist") {
    try { await S.refreshHistory(env, user); } catch { /* show the cached copy */ }
    return S.historyPage(env, user, type, extra.genre, skip);
  }
  if (id === "rated") return [];            // star ratings are gone (Stremio's Like / Love replace them); old installs see an empty row
  if (id === "titles") return titleSearch(env, type, extra.search, skip);
  if (id === "director" || id === "actor") return (await isTitle(env, extra.search, "movie")) ? [] : people(env, id, extra.search, skip);
  // the 🍄 Mycelium row: import, settings, your lists, then one tile per microgenre family (opens it in Discover)
  if (id === "tools") return skip ? [] : [...(user.settings.servedBuild && user.settings.servedBuild !== BUILD ? ["myc:tool:update"] : []),
    ...["import", "settings", "lists"].map(k => "myc:tool:" + k), ...FAMILIES.map(([f]) => "myc:fam:" + f)]
    .map(k => tileMeta(env.ORIGIN, user, k)).filter(Boolean);
  if (id === "import") {
    const m = (extra.search || "").match(/https?:\/\/\S+/);
    if (!m || skip) return [];
    return [tileMeta(env.ORIGIN, user, "myc:import:" + b64u(m[0]))];
  }

  const budget = newBudget();
  const c = { env, settings: user.settings, budget, uid: user.uid };
  const dot = id.indexOf(".");
  const [kind, arg] = dot > 0 ? [id.slice(0, dot), id.slice(dot + 1)] : [id, null];
  let spec = null;
  // whole catalogues and canons (a studio, a channel, a festival's winners, someone's favourites, a decade's hits) show
  // everything, watched or not; discovery rows still leave out what you've seen
  // Discover's lists (microgenres, studios, channels, streaming services, wars) are complete: they show everything,
  // watched or not. "Keep watched titles out" only applies to the Library row and Home's discovery rows.
  let canon = ["svc", "prov", "war", "prej", "mgf", "mg"].includes(kind);
  if (kind === "popular") spec = BUILDERS.popular(type, extra, c);
  else if (kind === "cinema") spec = await BUILDERS.cinema(type, extra, c);
  else if (kind === "digital") spec = BUILDERS.digital(type, extra, c);
  else if (kind === "gems") spec = BUILDERS.gems(type, extra, c);
  else if (kind === "browse") spec = BUILDERS.browse(type, extra, c);
  else if (kind === "prov") spec = await BUILDERS.provider(type, extra, c, arg);
  else if (kind === "svc") spec = await BUILDERS.allServices(type, extra, c);
  else if (kind === "rec") {
    // what you finished in Stremio since the last look joins Watched first, so For you drops it
    if (user.auth_enc) { try { await S.refreshHistory(env, user, { maxFetch: 150 }); } catch { /* use what we have */ } }
    spec = await BUILDERS.forYou(type, extra, c);
  }
  else if (kind === "mgf") {                     // a family hub: the microgenre comes from its dropdown
    const m = arg === "mine" ? null : mgByName(extra.microgenre, type, arg);
    if (m) { spec = BUILDERS.microgenre(type, extra, c, m.id); canon = true; }
    // a studio's or channel's whole catalogue, from Wikipedia's lists and Wikidata, before TMDB's own credits
    const catKeys = m ? [m.id, ...(m.aliases || [])].map(x => x + "|" + type).filter(k => CAT_ROWS.has(k)) : [];
    if (m && spec && catKeys.length) {
      const cat = (await Promise.all(catKeys.map(k => S.catalogueItems(env, k)))).flat();
      if (cat.length) { const have = new Set((spec.static || []).map(x => x.id)); spec = { ...spec, static: [...(spec.static || []), ...cat.filter(x => !have.has(x.id))] }; }
    }
    // festival and award rows: this year's winners and nominees (added by the hourly job) before the starting list
    if (m && spec && AWARD_IDS.has(m.id)) {
      const live = await awardItems(env, m.id).catch(() => []);
      const have = new Set(live.map(x => x.id));
      spec = { ...spec, static: [...live, ...(spec.static || []).filter(x => !have.has(x.id))] };
    }
    else if (arg === "mine" || /^✎ /.test(extra.microgenre || "")) {      // one of your own genres (✎ Your own genres)
      const cu = (user.settings.custom || []).find(x => (x.name || x.query) === extra.microgenre || "✎ " + (x.name || x.query) + " (yours)" === extra.microgenre);
      if (cu) spec = await BUILDERS.mixer(type, { ...extra, microgenre: undefined, search: cu.query }, c);
    }
  }
  else if (kind === "mg") { spec = BUILDERS.microgenre(type, extra, c, arg); canon = true; }
  else if (kind === "war" || kind === "prej") {
    spec = sidesSpec(type, id, extra);
    // "All sides": the War family's hand-picked films for that war first
    const mg = kind === "war" && (!extra.side || extra.side === SIDE_ALL) && !extra.kind && !extra.year && MICROGENRES.find(m => m.side === arg && m.type === type && m.items);
    if (spec && mg) { const have = new Set(mg.items.map(x => x.id)); spec = { ...spec, static: [...mg.items, ...(spec.static || []).filter(x => !have.has(x.id))] }; }
  }
  else if (kind === "mix") spec = (await isTitle(env, extra.search, type)) ? null : await BUILDERS.mixer(type, { ...extra, fromSearch: true }, c);
  else if (kind === "custom") {
    const cu = (user.settings.custom || []).find(x => x.id === arg);
    if (cu) spec = await BUILDERS.mixer(type, { ...extra, search: cu.query }, c);
  }
  if (!spec) return [];
  // with a dropdown filter picked, hand-picked titles can't be filtered by genre or country: use TMDB's results,
  // or (for rows that are only hand-picked) filter them by year
  // dropdown filters apply to the hand-picked titles too (their countries and genres are on file), then TMDB's
  if (spec.static && (extra.genre || extra.year || extra.country || extra.sort_by)) {
    const y = String(extra.year || ""), dec = /^\d{3}0s$/.test(y);
    const gid = extra.genre ? String(genreId(type, extra.genre) || "") : "";
    const cc = extra.country ? String(COUNTRIES_BY_NAME[extra.country] || WIDE_COUNTRIES[extra.country] || "").split("|") : [];
    spec.static = spec.static.filter(x => {
      const [c = "", g = ""] = x.meta || ITEM_META[x.id] || [];
      if (y && !(dec ? String(x.year || "").startsWith(y.slice(0, 3)) : String(x.year) === y)) return false;
      if (gid && !g.split("|").includes(gid)) return false;
      if (cc.length && cc[0] && !c.split("|").some(v => cc.includes(v))) return false;
      return true;
    });
    if (extra.sort_by === "Newest") spec.static.sort((a, b) => (+b.year || 0) - (+a.year || 0));
    if (extra.sort_by === "Oldest") spec.static.sort((a, b) => (+a.year || 0) - (+b.year || 0));
    if (!spec.static.length) delete spec.static;
  }
  if (spec.static) {
    // hand-picked titles stay even when watched (only hidden/ignored ones go); TMDB's extras follow the usual rule
    const excl = await S.excludedIds(env, { ...user, settings: { ...user.settings, hideWatched: false } });
    const st = spec.static.filter(x => !excl.has(x.id));
    const picked = st.slice(skip, skip + 100).map(x => ({ id: x.id, type, name: x.name, posterShape: "poster",
      poster: x.poster || `https://images.metahub.space/poster/small/${x.id}/img`, releaseInfo: x.year || undefined }));
    if (!spec.path || picked.length >= 20) return picked;
    // after the hand-picked titles, the rest of TMDB's matches (on the same page when only a few were picked)
    const sopts = { budget, exclude: canon ? excl : await S.excludedIds(env, user), alsoSkip: spec.static.map(x => x.id) };
    let sp = spec.params;
    for (const alt of spec.fallbacks || []) { if ((await pagedCatalog(env, type, spec.path, sp, 0, sopts)).length) break; sp = alt; }
    return [...picked, ...(await pagedCatalog(env, type, spec.path, sp, Math.max(0, skip - st.length), sopts)).map(toMeta)];
  }
  const opts = { budget, keep: spec.keep, exclude: kind === "rec" ? await S.savedIds(env, user.uid)
    : await S.excludedIds(env, canon ? { ...user, settings: { ...user.settings, hideWatched: false } } : user) };
  let params = spec.params;
  for (const alt of spec.fallbacks || []) {
    if ((await pagedCatalog(env, type, spec.path, params, 0, opts)).length) break;
    params = alt;
  }
  return (await pagedCatalog(env, type, spec.path, params, skip, opts)).map(toMeta);
}

// 🔎 Titles: TMDB's title search (films or series), exact title matches first, then the best known
const normT = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
async function titleHits(env, q, type, budget) {
  if (!q || q.length < 2) return [];
  const kind = type === "series" ? "tv" : "movie";
  const r = (await tmdb(env, `/search/${kind}`, { query: q }, budget, 86400)).results || [];
  const exact = x => [x.title, x.name, x.original_title, x.original_name].some(n => n && normT(n) === normT(q));
  return r.sort((a, b) => (exact(b) - exact(a)) || ((b.vote_count || 0) - (a.vote_count || 0)));
}
async function isTitle(env, q, type) {
  try { const h = await titleHits(env, q, type, newBudget()); const x = h[0]; return !!x && [x.title, x.name].some(n => n && normT(n) === normT(q)) && (x.vote_count || 0) >= 20; }
  catch { return false; }
}
async function titleSearch(env, type, q, skip) {
  if (skip) return [];
  const budget = newBudget();
  const hits = (await titleHits(env, q, type, budget)).slice(0, 20);
  const map = await imdbMap(env, type === "series" ? "tv" : "movie", hits.map(x => x.id));
  return hits.filter(x => map.get(x.id)).map(x => ({ id: map.get(x.id), type, name: x.title || x.name,
    poster: x.poster_path ? "https://image.tmdb.org/t/p/w342" + x.poster_path : undefined, releaseInfo: (x.release_date || x.first_air_date || "").slice(0, 4) }));
}

// "Films by director" / "Films with actor" (search-only rows, from the offline tool)
async function people(env, role, q, skip) {
  if (!q) return [];
  const budget = newBudget();
  // only when the search is that person's name (so a film title doesn't pull up some actor's filmography)
  const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
  const who = ((await tmdb(env, "/search/person", { query: q }, budget)).results || [])
    .find(p => norm(p.name) === norm(q) && (role === "director" ? p.known_for_department === "Directing" : p.known_for_department === "Acting"));
  if (!who) return [];
  const cr = await tmdb(env, `/person/${who.id}/movie_credits`, {}, budget, 86400);
  let list = role === "director" ? (cr.crew || []).filter(c => c.job === "Director") : (cr.cast || []);
  list = [...new Map(list.map(x => [x.id, x])).values()].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(skip, skip + 25);
  const out = [];
  const map = await imdbMap(env, "movie", list.map(x => x.id));
  for (const it of list) {
    const tt = map.get(it.id);
    if (tt) out.push({ id: tt, type: "movie", name: it.title, poster: it.poster_path ? "https://image.tmdb.org/t/p/w342" + it.poster_path : undefined,
                       posterShape: "poster", releaseInfo: (it.release_date || "").slice(0, 4) || undefined });
  }
  return out;
}

// ── shared ratings (public, read-only) ──────────────────────────────────────
async function share(env, origin, p) {
  const owner = await S.userByShare(env, p[1]);
  if (!owner) return json({ error: "unknown share link" }, 404);
  const who = owner.settings.displayName || "A friend";
  if (p[2] === "manifest.json") {
    return json({
      id: "community.myceliation.mycelium.share." + p[1], version: "0.3.0", name: `${who}'s picks`,
      description: `Films and series ${who} loved, liked and watched, via Mycelium.`, logo: origin + "/logo.svg",
      types: ["movie", "series"], resources: ["catalog"], idPrefixes: ["tt"],
      catalogs: [
        { type: "movie", id: "loved", name: `❤ ${who} loved & liked`, extra: [{ name: "skip" }] },
        { type: "series", id: "loved", name: `❤ ${who} loved & liked`, extra: [{ name: "skip" }] },
        { type: "movie", id: "watched", name: `✔ ${who} watched`, extra: [{ name: "skip" }] },
        { type: "series", id: "watched", name: `✔ ${who} watched`, extra: [{ name: "skip" }] },
      ],
    });
  }
  if (p[2] === "catalog") {
    const type = p[3], id = (p[4] || "").replace(/\.json$/, ""), extra = parseExtra((p[5] || "").replace(/\.json$/, ""));
    const skip = +extra.skip || 0;
    const metas = id === "loved" || id === "watched" ? await S.listPage(env, owner, id, type, { skip }) : [];
    return json({ metas }, 200, { "cache-control": "max-age=300" });
  }
  const loved = [...await S.listPage(env, owner, "loved", "movie", { limit: 200 }), ...await S.listPage(env, owner, "loved", "series", { limit: 200 })];
  const watched = [...await S.listPage(env, owner, "watched", "movie", { limit: 200 }), ...await S.listPage(env, owner, "watched", "series", { limit: 100 })];
  return html(sharePage({ origin, share: p[1], who, watched, loved }));
}

// ── Mycelium tiles: things you can open from inside Stremio ─────────────────
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

function tile(origin, T, user, id) {
  const base = `${origin}/${T}`;
  if (id === "myc:tool:import") return { name: "Import a list", poster: `${origin}/tile/import.svg`, action: "Open the list importer",
    url: `${base}/import`, description: "Paste a Letterboxd, IMDb, TMDB or Wikipedia list (or any page that mentions films) and add it to your Library, Watched, a shelf or one of your lists.\n\nTip: paste a list link straight into Stremio's search and an import tile appears." };
  if (id === "myc:tool:update") return { name: "Update Mycelium", poster: `${origin}/tile/settings.svg`, action: "Open the update button",
    url: `${base}/configure#install`, description: "Mycelium has new lists, rows or dropdowns since Stremio installed it. Stremio keeps the copy it installed, so open settings and press Install everything (one Stremio code).\n\nConnect your Stremio account there and future updates arrive by themselves." };
  if (id === "myc:tool:settings") return { name: "Settings", poster: `${origin}/tile/settings.svg`, action: "Open Mycelium settings",
    url: `${base}/configure`, description: "Rows, streaming services and regions, Stremio account, sharing what you loved and watched." };
  if (id === "myc:tool:lists") return { name: "Your lists", poster: `${origin}/tile/lists.svg`, action: "Open your named lists",
    url: `${base}/configure#lists`, description: "Make, rename and fill your own lists, and choose which ones show as rows." };
  if (id.startsWith("myc:fam:")) {
    const fam = id.slice(8), f = FAMILIES.find(([k]) => k === fam);
    if (!f) return null;
    const hub = t => `stremio:///discover/${encodeURIComponent(`${base}/${mgPartPath(t, fam)}/${t}/manifest.json`)}/${t}/mgf.${fam}`;
    const n = MICROGENRES.filter(m => !m.allof && m.family === fam).length;
    return { name: f[1], poster: `${origin}/tile/fam-${fam}.svg`, action: "Open it in Discover (films)", url: hub("movie"), seriesUrl: hub("series"),
      description: `${n} microgenres. Opens the family in Discover: pick a microgenre, then genre, year and sort.` };
  }
  if (id === "myc:tool:history") return { name: "Watch History add-on", poster: `${origin}/tile/history.svg`, action: "Set up Watch History",
    url: `${base}/history`, description: "A separate add-on with just your watched rows, merged with your Stremio history." };
  if (id === "myc:tool:share") return { name: "Share what I loved and watched", poster: `${origin}/tile/share.svg`, action: "Open my public page",
    url: `${origin}/u/${user.share}`, description: "A public page of what you loved, liked and watched, which friends can also install as rows." };
  if (id.startsWith("myc:import:")) {
    let link = "";
    try { link = unb64u(id.slice(11)); } catch { return null; }
    if (!/^https?:\/\//.test(link)) return null;
    return { name: "Import this list", poster: `${origin}/tile/import.svg`, action: "Choose where it goes, then review the matches",
      url: `${base}/import?url=${encodeURIComponent(link)}`, description: "Add every title from\n" + link + "\nto your Library, Watched, a shelf or a list. Opens the importer with the link filled in." };
  }
  return null;
}
function tileMeta(origin, user, id) {
  const t = tile(origin, user.token, user, id);
  return t && { id, type: "movie", name: t.name, poster: t.poster, posterShape: "poster", description: t.description };
}

// ── /ui/: Stremio's own web app with the Mycelium plugin built in ────────────
// The official desktop app can load it with --webui-url (see "Stremio with Mycelium.bat").
// Everything except the plugin comes straight from web.stremio.com, so it's always
// the current official interface.
const UPSTREAM = "https://web.stremio.com/";
async function ui(req, url) {
  if (url.pathname === "/ui") return Response.redirect(url.origin + "/ui/" + url.search + url.hash, 301);
  const rest = url.pathname.slice(4);
  if (rest === "mycelium.js") {
    return new Response(UI_PLUGIN, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "max-age=300" } });
  }
  spend();
  const up = await fetch(UPSTREAM + rest + url.search, {
    headers: { "user-agent": req.headers.get("user-agent") || "Mozilla/5.0", accept: req.headers.get("accept") || "*/*" },
    cf: { cacheEverything: true, cacheTtl: rest === "" || rest === "index.html" ? 600 : 86400 },
  });
  const headers = new Headers(up.headers);
  headers.delete("content-security-policy");
  headers.delete("content-length");
  if (rest === "" || rest === "index.html") {
    const page = (await up.text()).replace("</head>", '<script src="mycelium.js" defer></script></head>');
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "no-cache");
    return new Response(page, { status: up.status, headers });
  }
  return new Response(up.body, { status: up.status, headers });
}

// ── microgenres on title pages ──────────────────────────────────────────────
const GENRE_ID = { ...TV_GENRES, ...MOVIE_GENRES, "Science Fiction": 878, "TV Movie": 10770 };
const genreIds = names => (names || []).map(n => (typeof n === "number" ? n : GENRE_ID[n])).filter(Boolean);

async function cinemetaMeta(type, id) {
  const key = `cmeta:${type}:${id}`;
  const hit = await cacheGet(key);
  if (hit) return hit;
  spend();
  const r = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`).catch(() => null);
  const meta = r && r.ok ? ((await r.json().catch(() => ({}))).meta || null) : null;
  if (meta) await cachePut(key, meta, 6 * 3600);
  return meta;
}

/** A title's microgenres, worked out once (TMDB keywords + genres) and kept with the title. */
async function microgenresOf(env, type, id, meta = null) {
  let mg = await S.titleMg(env, id);
  if (!mgCurrent(mg)) {
    const info = await titleInfo(env, type, id).catch(() => null);
    const found = info ? matchMicrogenres(type, info) : [];
    // the studio and channel catalogues it's in (Wikipedia lists + Wikidata), after the specific ones
    try {
      const r = await env.DB.prepare("SELECT DISTINCT row FROM cat_items WHERE row LIKE ? AND data LIKE ?").bind(`%|${type}`, `%"${id}"%`).all();
      for (const x of r.results || []) { const m = MG_BY_ID[x.row.split("|")[0]]; if (m && !found.includes(m)) found.push(m); }
    } catch { /* catalogues not loaded yet */ }
    mg = mgString(found);
    if (meta && meta.name) await S.upsertTitles(env, [{ id, type, name: meta.name, year: String(meta.releaseInfo || meta.year || "").slice(0, 4),
      poster: meta.poster, genres: meta.genres || [], lang: info && info.lang, mg }]);
    else await S.setTitleMg(env, id, type, mg);
  }
  return mg.split("|").slice(1).filter(Boolean).map(x => MG_BY_ID[x]).filter(Boolean);
}

// ── every add-on of one copy, freshly built (step 3, Install everything, and the automatic updates all install this) ──
async function freshAddons(env, user, origin) {
  const T = user.token, lists = await S.getLists(env, user.uid);
  const fresh = { [`${origin}/${T}/manifest.json`]: buildManifest(user, origin, lists),
                  ...(user.settings.rows.historyAddon ? { [`${origin}/${T}/history/manifest.json`]: historyManifest(user, origin) } : {}) };
  if (user.settings.rows.library) for (const t of ["movie", "series"]) for (let i = 1; i <= libPartCount(user, t); i++) fresh[`${origin}/${T}/library${i > 1 ? i : ""}/${t}/manifest.json`] = libraryManifest(user, origin, t, i);
  // Discover's order: Library, ✎ your own genres + streaming & TV, the microgenre families, wars last
  for (const t of ["movie", "series"]) fresh[`${origin}/${T}/allservices/${t}/manifest.json`] = allServicesManifest(user, origin, t);
  for (const t of ["movie", "series"]) for (let i = 1; i <= mgPartCount(t); i++) fresh[`${origin}/${T}/microgenres${i > 1 ? i : ""}/${t}/manifest.json`] = microgenresManifest(user, origin, t, i);
  for (const t of ["movie", "series"]) fresh[`${origin}/${T}/sides/${t}/manifest.json`] = sidesManifest(user, origin, t);
  servicePacks(user, origin, lists).forEach((_, i) => { fresh[`${origin}/${T}/services/${i + 1}/manifest.json`] = packManifest(user, origin, lists, i + 1); });
  return fresh;
}

// ── automatic updates: a new version of the add-ons goes into the Stremio account of everyone who connected theirs,
// a few accounts per run (each takes about six of the run's 50 requests). Only where Mycelium is still installed.
async function autoUpdate(env) {
  const rows = (await env.DB.prepare("SELECT * FROM users WHERE auth_enc IS NOT NULL").all()).results || [];
  let updated = 0, skipped = 0, failed = 0, waiting = 0;
  for (const row of rows) {
    const user = S.rowToUser(row);
    if (user.settings.autoUpdate === false || user.settings.autoBuild === BUILD || !user.settings.origin) continue;
    if (!room(8)) { waiting++; continue; }
    try {
      const key = await S.authKeyOf(env, user);
      const r = await reorderAddons(key, "keep", [ADDON_ID, HISTORY_ID], await freshAddons(env, user, user.settings.origin), { onlyIfInstalled: true });
      if (r.ok) { updated++; user.settings.servedBuild = BUILD; } else skipped++;
    } catch { failed++; }                       // a revoked or expired key: tried again with the next version
    user.settings.autoBuild = BUILD;
    await S.saveSettings(env, user).catch(() => {});
  }
  return { build: BUILD, updated, skipped, failed, waiting };
}

// ── which services get Home rows: the six most popular (per TMDB) in your home region ──
async function ensureHomeServices(env, user) {
  const s = user.settings;
  const sig = `${s.region}:${(s.providers || []).length}`;
  if (s.homeServices && s.homeServicesFor === sig) return;
  const services = normalizeProviders(s.providers);
  let rank = {};
  try {
    const d = await tmdb(env, "/watch/providers/movie", { watch_region: s.region || "US" }, null, 86400);
    for (const x of d.results || []) rank[String(x.provider_id)] = (x.display_priorities || {})[s.region] ?? x.display_priority ?? 999;
  } catch { /* fall back to list order */ }
  const score = p => Math.min(999, ...String(p.ids[s.region] || "").split("|").filter(Boolean).map(id => rank[id] ?? 999));
  s.homeServices = services.map((p, i) => [p.key, score(p), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).slice(0, 6).map(x => x[0]);
  s.homeServicesFor = sig;
  await S.saveSettings(env, user);
}
