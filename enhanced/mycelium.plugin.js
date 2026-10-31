/**
 * @name Mycelium
 * @description Library / Watched / shelf / list buttons on every title, a History tab in the side bar (your Stremio history, read locally, merged with your Watched list), and a multi-genre mixer in Discover. Works with the Mycelium add-on. Runs inside the official Stremio app via Mycelium's UI link, and in Stremio Enhanced, Stremio Community v5 (WebMods) and as a userscript on web.stremio.com.
 * @version 0.5.0
 * @author myceliation
 * @updateUrl https://raw.githubusercontent.com/myceliation/stremio-addon/main/enhanced/mycelium.plugin.js
 */
(function () {
  "use strict";
  const API = window.StremioEnhancedAPI;
  const ADDON_ID = "community.myceliation.mycelium";

  try {
    API && API.registerSettings && API.registerSettings([
      { key: "mycelium_url", type: "input", label: "Mycelium install link (optional)",
        description: "Only needed if the add-on isn't installed in this Stremio profile. Paste the link from the Mycelium configure page.",
        defaultValue: "" },
      { key: "mycelium_bar", type: "toggle", label: "Shelf and rating bar on title pages", defaultValue: true },
      { key: "mycelium_mixer", type: "toggle", label: "Genre mixer button in Discover", defaultValue: true },
      { key: "mycelium_history", type: "toggle", label: "Watch history button in Library", defaultValue: true },
    ]);
  } catch (e) { /* older Stremio Enhanced */ }

  // Stremio Enhanced has a settings API; elsewhere (Community v5 WebMods,
  // userscript) settings live in localStorage under "mycelium_settings".
  const setting = async (k, d) => {
    try {
      if (API && API.getSetting) { const v = await API.getSetting(k); if (v !== undefined && v !== null && v !== "") return v; }
      const local = JSON.parse(localStorage.getItem("mycelium_settings") || "{}");
      return k in local ? local[k] : d;
    } catch { return d; }
  };
  const log = m => { try { API.logger.info("[mycelium] " + m); } catch { console.log("[mycelium]", m); } };

  // ── a link handed over by the Mycelium window (?myc=<token>), kept for next time ─
  try {
    const tok = new URLSearchParams(location.search).get("myc");
    if (tok && /^[\w-]{8,}$/.test(tok)) {
      const local = JSON.parse(localStorage.getItem("mycelium_settings") || "{}");
      local.mycelium_url = location.origin + "/" + tok;
      localStorage.setItem("mycelium_settings", JSON.stringify(local));
      history.replaceState(null, "", location.pathname + location.hash);
    }
  } catch {}

  // ── find this user's Mycelium base URL ───────────────────────────────────────
  let BASE = null;
  async function base() {
    if (BASE) return BASE;
    const manual = await setting("mycelium_url", "");
    if (manual) return (BASE = manual.replace(/\/manifest\.json.*$/, "").replace(/\/configure$/, "").replace(/\/$/, ""));
    try {
      const profile = JSON.parse(localStorage.getItem("profile") || "{}");
      const a = (profile.addons || []).find(x => x.manifest && x.manifest.id === ADDON_ID);
      if (a) return (BASE = a.transportUrl.replace(/\/manifest\.json$/, ""));
    } catch {}
    return null;
  }
  const api = async (path, body) => {
    const b = await base();
    if (!b) throw new Error("Mycelium add-on not installed");
    const r = await fetch(b + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
    if (!r.ok) throw new Error(`Mycelium answered ${r.status}`);
    return r.json();
  };

  // ── styles (Stremio's own CSS variables, so themes carry over) ───────────────
  const css = document.createElement("style");
  css.textContent = `
  .myc-bar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:1rem 0;overflow:visible!important}
  .myc-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .9rem;border-radius:2rem;
    background:var(--overlay-color);color:var(--primary-foreground-color);font-size:.95rem;font-weight:600;border:1px solid rgba(255,255,255,.12)}
  .myc-btn:hover{border-color:var(--primary-accent-color)}
  .myc-btn[aria-pressed=true]{background:var(--primary-accent-color);border-color:var(--primary-accent-color);color:#fff}
  .myc-btn:focus-visible{outline:var(--focus-outline-size) solid var(--primary-accent-color)}
  .myc-star{all:unset;cursor:pointer;font-size:1.35rem;color:rgba(255,255,255,.3);padding:0 .1rem}
  .myc-star.on{color:var(--tertiary-accent-color)}
  .myc-fab{position:fixed;right:1.5rem;bottom:1.5rem;z-index:50}
  .myc-fab .myc-btn{background:var(--primary-accent-color);color:#fff;box-shadow:var(--outer-glow);padding:.7rem 1.2rem}
  .myc-overlay{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:flex-start;overflow:auto!important;padding:4rem 1rem}
  .myc-panel{background:var(--modal-background-color);color:var(--primary-foreground-color);border-radius:var(--border-radius);width:min(1100px,100%);padding:1.5rem;overflow:visible!important;user-select:text}
  .myc-panel *{overflow:visible}
  .myc-panel h2{font-size:1.4rem;margin-bottom:.4rem}
  .myc-panel .sub{opacity:.6;margin-bottom:1rem;font-size:.9rem}
  .myc-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 1rem}
  .myc-chips .myc-btn{font-size:.85rem;padding:.35rem .75rem}
  .myc-label{opacity:.6;font-size:.8rem;margin-top:.5rem}
  .myc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:1rem;margin-top:1rem}
  .myc-card{cursor:pointer}
  .myc-card .art{aspect-ratio:1/var(--poster-shape-ratio);background:var(--overlay-color);border-radius:.5rem;overflow:hidden!important}
  .myc-card img{width:100%;height:100%;object-fit:cover;display:block}
  .myc-card .t{font-size:.85rem;margin-top:.4rem;font-weight:600}
  .myc-card .s{font-size:.75rem;opacity:.6}
  .myc-close{float:right}
  .myc-q{width:100%;padding:.6rem .8rem;border-radius:.5rem;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:inherit;font:inherit;user-select:text}
  `;
  document.head.appendChild(css);

  const el = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); Object.assign(e, attrs); if (html) e.innerHTML = html; return e; };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const SHELVES = [["library", "📚", "Library"], ["watched", "✔", "Watched"], ["loved", "❤", "Loved"], ["liked", "👍", "Liked"], ["waiting", "⏳", "Waiting"],
                   ["rewatch", "🔁", "Rewatch"], ["dropped", "✖", "Dropped"], ["ignore", "👎", "Ignore"], ["blacklist", "🚫", "Blacklist"]];

  // ── 1. shelf + rating bar on title pages ─────────────────────────────────────
  function route() {
    const m = location.hash.match(/^#\/detail\/(movie|series)\/(tt\d+)/);
    return m ? { type: m[1], id: m[2] } : null;
  }

  async function mountBar() {
    if (!(await setting("mycelium_bar", true))) return;
    const r = route();
    document.querySelectorAll(".myc-bar[data-for]").forEach(b => { if (!r || b.dataset.for !== r.id) b.remove(); });
    if (!r || document.querySelector(`.myc-bar[data-for="${r.id}"]`)) return;
    const anchor = document.querySelector('[class*="action-buttons-container"]') || document.querySelector('[class*="meta-preview-container"] [class*="description-container"]');
    if (!anchor) return;                       // page not rendered yet; observer retries
    if (!(await base())) return;
    const bar = el("div", { className: "myc-bar" });
    bar.dataset.for = r.id;
    anchor.parentElement.insertBefore(bar, anchor.nextSibling);
    let state, lists = [];
    try {
      [state, lists] = await Promise.all([api(`/api/state?ids=${r.id}`).then(x => x[r.id]), api("/api/lists").catch(() => [])]);
    } catch (e) { bar.remove(); return log(e.message); }
    const paint = st => {
      state = st;
      const on = k => (st.lists || st.shelves || []).includes(k);
      bar.innerHTML = SHELVES.map(([k, i, l]) =>
        `<button class="myc-btn" data-k="${k}" aria-pressed="${on(k)}" title="${l}">${i} ${l}</button>`).join("")
        + (lists.length ? `<div class="myc-chips" style="width:100%;margin:.2rem 0 0">${lists.map(l =>
          `<button class="myc-btn" data-k="l:${esc(l.lid)}" aria-pressed="${on("l:" + l.lid)}">📋 ${esc(l.name)}</button>`).join("")}</div>` : "");
    };
    paint(state);
    bar.addEventListener("click", async e => {
      e.stopPropagation();
      const b = e.target.closest("[data-k]");
      if (!b) return;
      try {
        paint(await api("/api/member", { id: r.id, type: r.type, list: b.dataset.k, on: b.getAttribute("aria-pressed") !== "true" }));
      } catch (err) { log(err.message); b.title = "Couldn't save: " + err.message; }
    });
  }

  // ── shared overlay grid ──────────────────────────────────────────────────────
  function overlay(title, sub) {
    document.querySelector(".myc-overlay")?.remove();
    const o = el("div", { className: "myc-overlay" });
    const p = el("div", { className: "myc-panel" }, `<button class="myc-btn myc-close">Close</button><h2>${esc(title)}</h2><div class="sub">${esc(sub)}</div><div class="body"></div>`);
    o.append(p);
    o.addEventListener("click", e => { if (e.target === o || e.target.closest(".myc-close")) o.remove(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { o.remove(); document.removeEventListener("keydown", k); } });
    document.body.append(o);
    return p.querySelector(".body");
  }
  function grid(metas, type) {
    const g = el("div", { className: "myc-grid" });
    g.innerHTML = metas.map(m => `<div class="myc-card" data-id="${esc(m.id)}" data-type="${esc(m.type || type)}">
      <div class="art">${m.poster ? `<img src="${esc(m.poster)}" loading="lazy" alt="">` : ""}</div>
      <div class="t">${esc(m.name)}</div><div class="s">${esc(m.releaseInfo || "")}</div></div>`).join("");
    g.addEventListener("click", e => {
      const c = e.target.closest(".myc-card"); if (!c) return;
      document.querySelector(".myc-overlay")?.remove();
      location.hash = `#/detail/${c.dataset.type}/${c.dataset.id}`;
    });
    return g;
  }

  // ── 2. multi-genre mixer in Discover ─────────────────────────────────────────
  const GENRES = ["Action", "Adventure", "Animated", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy",
                  "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];
  const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  const PLACES = ["American", "British", "French", "Italian", "German", "Spanish", "Mexican", "Japanese", "Korean",
                  "Chinese", "Hong Kong", "Indian", "Nordic", "Soviet", "Brazilian", "Australian"];
  const SORTS = [["", "Popular"], ["best", "Best rated"], ["hidden", "Hidden gems"], ["new", "Newest"]];

  function openMixer() {
    const body = overlay("Genre mixer", "Pick any combination. Add your own words too: swamp, time loop, witch, road trip…");
    const sel = { g: new Set(), d: "", c: new Set(), s: "", type: "movie" };
    const chips = (name, list, multi) => `<div class="myc-label">${name}</div><div class="myc-chips" data-group="${name}">${list.map(([v, l]) =>
      `<button class="myc-btn" data-v="${esc(v)}" data-multi="${multi}" aria-pressed="false">${esc(l)}</button>`).join("")}</div>`;
    body.innerHTML = chips("Type", [["movie", "Films"], ["series", "Series"]], false)
      + chips("Genres", GENRES.map(g => [g, g]), true) + chips("Decade", DECADES.map(d => [d, d]), false)
      + chips("Made in", PLACES.map(p => [p, p]), true) + chips("Sort", SORTS, false)
      + `<input class="myc-q" placeholder="Extra words (optional)"><div style="display:flex;gap:.5rem;margin-top:1rem"><button class="myc-btn" data-run style="background:var(--primary-accent-color);color:#fff">Show titles</button><button class="myc-btn" data-save>Save as a row</button></div><div class="out"></div>`;
    body.querySelector('[data-group="Type"] [data-v="movie"]').setAttribute("aria-pressed", "true");
    const query = () => [sel.s, ...sel.g, sel.d, ...sel.c, body.querySelector(".myc-q").value].filter(Boolean).join(" ").trim();
    body.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b) return;
      const grp = b.closest("[data-group]")?.dataset.group;
      if (grp) {
        const on = b.getAttribute("aria-pressed") !== "true";
        if (b.dataset.multi !== "true") b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", String(on || b.dataset.multi !== "true"));
        const v = b.dataset.v;
        if (grp === "Type") sel.type = v;
        if (grp === "Genres") on ? sel.g.add(v) : sel.g.delete(v);
        if (grp === "Made in") on ? sel.c.add(v) : sel.c.delete(v);
        if (grp === "Decade") sel.d = on ? v : "";
        if (grp === "Sort") sel.s = on ? v : "";
        return;
      }
      const out = body.querySelector(".out");
      const q = query();
      if (!q) { out.innerHTML = `<p class="sub" style="margin-top:1rem">Pick at least one genre, decade or place.</p>`; return; }
      if (b.dataset.run !== undefined) {
        out.innerHTML = `<p class="sub" style="margin-top:1rem">Looking…</p>`;
        const r = await api(`/catalog/${sel.type}/mix/search=${encodeURIComponent(q)}.json`);
        out.innerHTML = (r.metas || []).length ? "" : `<p class="sub" style="margin-top:1rem">Nothing matches all of that. Drop a chip or two.</p>`;
        if ((r.metas || []).length) out.append(grid(r.metas, sel.type));
      }
      if (b.dataset.save !== undefined) {
        const cur = (await api("/api/settings")).settings;
        const name = q.replace(/\b\w/g, c => c.toUpperCase());
        await api("/api/settings", { ...cur, custom: [...(cur.custom || []), { name, query: q, type: sel.type }] });
        out.innerHTML = `<p class="sub" style="margin-top:1rem">Saved “${esc(name)}” as one of your own genres. It shows up as a row after “Add to Stremio” (step 3 in the Mycelium window) or “Update Mycelium in Stremio” on the settings page.</p>`;
      }
    });
  }

  // ── 3. watch history in Library ──────────────────────────────────────────────
  // Read from Stremio's own local storage on this computer: nothing is sent anywhere.
  function localHistory(type, filter) {
    const items = {};
    for (const key of ["library", "library_recent"]) {
      try {
        const bucket = JSON.parse(localStorage.getItem(key) || "{}").items || {};
        for (const [id, it] of Object.entries(bucket)) {
          if (!items[id] || (it._mtime || "") >= (items[id]._mtime || "")) items[id] = it;
        }
      } catch {}
    }
    const rows = Object.values(items).filter(it => (it.type === type || (type === "series" && it.type === "tv")) && /^tt/.test(it._id)).map(it => {
      const st = it.state || {};
      const status = st.flaggedWatched || st.timesWatched ? "watched" : (st.timeOffset || 0) > 60000 ? "progress" : "opened";
      const pct = st.duration ? Math.round(100 * (st.timeOffset || 0) / st.duration) : 0;
      return { id: it._id, type, name: it.name, poster: it.poster, status, times: st.timesWatched || 0, last: st.lastWatched || it._mtime || "",
               releaseInfo: status === "progress" ? pct + "% watched" : (st.timesWatched > 1 ? "watched " + st.timesWatched + "×" : "") };
    });
    if (!rows.length) return null;
    return rows.filter(r => filter === "Finished" ? r.status === "watched" : filter === "In progress" ? r.status === "progress"
      : filter === "Rewatched" ? r.times > 1 : filter === "Everything I opened" ? true : r.status !== "opened")
      .sort((a, b) => (b.last || "").localeCompare(a.last || ""));
  }

  async function openHistory() {
    const body = overlay("History", "What Stremio saved on this device, plus your Watched list. Only you can see either.");
    const FILTERS = ["Finished & in progress", "Finished", "In progress", "Rewatched", "Everything I opened"];
    let type = "movie", f = FILTERS[0], src = "stremio";
    const W = { sort_by: "", genre: "", year: "" };          // My Watched list: the same sorts and filters as Discover
    const WSORTS = ["Recently added", "Newest releases", "Oldest releases", "TMDB rating", "My rating", "A–Z", "Shuffle"];
    const WGENRES = ["Action", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];
    const WYEARS = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "1950s", "1940s"];
    const wchips = (key, opts) => `<div class="myc-chips">${opts.map(o =>
      `<button class="myc-btn" data-w="${key}" data-v="${esc(o)}" aria-pressed="${W[key] === o || (!W[key] && o === opts[0] && key === "sort_by")}">${esc(o)}</button>`).join("")}</div>`;
    const chips = () => `<div class="myc-chips">${[["stremio", "Saved by Stremio"], ["watched", "My Watched list"]].map(([v, l]) =>
        `<button class="myc-btn" data-src="${v}" aria-pressed="${v === src}">${l}</button>`).join("")}<span style="width:1rem"></span>${[["movie", "Films"], ["series", "Series"]].map(([v, l]) =>
        `<button class="myc-btn" data-t="${v}" aria-pressed="${v === type}">${l}</button>`).join("")}</div>` + (src === "stremio" ? `<div class="myc-chips">${FILTERS.map(x =>
        `<button class="myc-btn" data-f="${esc(x)}" aria-pressed="${x === f}">${esc(x)}</button>`).join("")}</div>`
        : `<div class="myc-label">Sort</div>` + wchips("sort_by", WSORTS) + `<div class="myc-label">Genre</div>` + wchips("genre", WGENRES)
          + `<div class="myc-label">Decade</div>` + wchips("year", WYEARS));
    const draw = async () => {
      body.innerHTML = chips() + `<p class="sub">Loading…</p>`;
      let all;
      if (src === "stremio") {
        all = localHistory(type, f) || [];
        body.querySelector("p.sub").innerHTML = `${all.length} titles saved by Stremio, most recent first.` +
          (await base() ? ` <button class="myc-btn" data-copy style="margin-left:.5rem">Add the finished ones to my Watched list</button>` : "");
      } else {
        all = [];
        const ex = Object.entries(W).filter(([k, v]) => v && !(k === "sort_by" && v === "Recently added"))
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
        if (await base()) for (let skip = 0; skip < 5000; skip += 100) {
          const r = await api(`/catalog/${type}/list.watched/${ex ? ex + "&" : ""}skip=${skip}.json`);
          all.push(...(r.metas || []));
          if ((r.metas || []).length < 100) break;
        }
        body.querySelector("p.sub").textContent = await base() ? `${all.length} titles in your Watched list.` : "Install the Mycelium add-on to keep a Watched list.";
      }
      body.append(grid(all, type));
    };
    body.addEventListener("click", async e => {
      const b = e.target.closest("[data-t],[data-f],[data-src],[data-copy],[data-w]"); if (!b) return;
      if (b.dataset.w) { const k = b.dataset.w; W[k] = W[k] === b.dataset.v && k !== "sort_by" ? "" : b.dataset.v; return draw(); }
      if (b.dataset.copy !== undefined) {
        const rows = [...(localHistory("movie", "Finished") || []), ...(localHistory("series", "Finished") || [])];
        b.disabled = true;
        for (let i = 0; i < rows.length; i += 150) {
          await api("/api/bulk", { list: "watched", items: rows.slice(i, i + 150).map(r => ({ id: r.id, type: r.type, name: r.name, poster: r.poster })) });
          b.textContent = `Adding… ${Math.min(i + 150, rows.length)} of ${rows.length}`;
        }
        b.textContent = `Added ${rows.length} to your Watched list`;
        return;
      }
      if (b.dataset.t) type = b.dataset.t; else if (b.dataset.src) src = b.dataset.src; else f = b.dataset.f;
      draw();
    });
    draw();
  }

  // ── a History tab in Stremio's own side bar ─────────────────────────────────
  function mountNavTab() {
    const nav = document.querySelector('nav[class*="vertical-nav-bar-container"]');
    if (!nav || nav.querySelector(".myc-navtab")) return;
    const sample = nav.querySelector('a[class*="nav-tab-button-container"]');
    if (!sample) return;
    const tab = sample.cloneNode(true);
    tab.classList.add("myc-navtab");
    tab.classList.remove("selected");
    tab.setAttribute("title", "History");
    tab.setAttribute("href", "#/library");
    const icon = tab.querySelector("svg");
    if (icon) { const sp = document.createElement("div"); sp.textContent = "🕓"; sp.style.cssText = "font-size:1.5rem;line-height:1"; icon.replaceWith(sp); }
    const label = [...tab.querySelectorAll("div")].reverse().find(d => d.children.length === 0 && d.textContent.trim());
    if (label) label.textContent = "History";
    tab.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); openHistory(); }, true);
    const settings = [...nav.querySelectorAll('a[class*="nav-tab-button-container"]')].find(a => /settings/.test(a.getAttribute("href") || ""));
    nav.insertBefore(tab, settings || null);
  }

  // ── floating buttons per route ───────────────────────────────────────────────
  async function mountFab() {
    const h = location.hash;
    let want = null;
    if (/^#\/discover/.test(h) && await setting("mycelium_mixer", true)) want = ["🧪 Mix genres", openMixer];
    if (/^#\/library/.test(h) && await setting("mycelium_history", true) && !document.querySelector(".myc-navtab")) want = ["🕓 History", openHistory];
    const cur = document.querySelector(".myc-fab");
    if (!want) { cur?.remove(); return; }
    if (cur && cur.dataset.label === want[0]) return;
    cur?.remove();
    if (want[1] !== openHistory && !(await base())) return;
    const fab = el("div", { className: "myc-fab" });
    fab.dataset.label = want[0];
    const b = el("button", { className: "myc-btn", textContent: want[0] });
    b.onclick = want[1];
    fab.append(b);
    document.body.append(fab);
  }

  let pending = false;
  const tick = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; mountNavTab(); mountBar(); mountFab(); }); };
  // ── one notice: sign in here once; watching needs normal Stremio ─────────────
  function notice() {
    if (document.getElementById("myc-notice")) return;
    let signedIn = false;
    try { signedIn = !!(JSON.parse(localStorage.getItem("profile") || "{}").auth); } catch {}
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem("mycelium_notice") || "{}"); } catch {}
    if (signedIn && seen.play) return;
    const el = document.createElement("div");
    el.id = "myc-notice";
    el.style.cssText = "position:fixed;left:50%;bottom:1.2rem;transform:translateX(-50%);z-index:99999;max-width:44rem;" +
      "background:#1b1b2b;color:#fff;border:1px solid #7b5bf5;border-radius:.8rem;padding:.8rem 1rem;font:14px/1.4 sans-serif;" +
      "box-shadow:0 6px 24px rgba(0,0,0,.5);display:flex;gap:.8rem;align-items:flex-start";
    el.innerHTML = "<div>🍄 <b>Mycelium interface</b><br>" +
      (signedIn ? "" : "Sign in to Stremio here once (the person icon, top right). This window keeps its own sign-in, so until then your library, add-ons and Mycelium rows aren't shown.<br>") +
      "Playing videos doesn't work here: Stremio's streaming server only plays for Stremio's own pages. Watch in normal Stremio.</div>";
    const x = document.createElement("button");
    x.textContent = "OK";
    x.style.cssText = "all:unset;cursor:pointer;padding:.3rem .8rem;border-radius:1rem;background:#7b5bf5;font-weight:600";
    x.onclick = () => { try { localStorage.setItem("mycelium_notice", JSON.stringify({ play: true })); } catch {} el.remove(); };
    el.appendChild(x);
    document.body.appendChild(el);
  }
  setTimeout(notice, 2500);

  // ── Movies ⇄ Series in Discover keeps your place in Mycelium's hubs ──────────
  // Stremio resets every dropdown when the type changes; for Mycelium's per-type hubs
  // (microgenres, wars & prejudice, streaming) we jump to the same row in the other
  // type's hub and keep each choice that exists there ("World War II" → "World War II series").
  let lastDiscover = null;
  const manCache = {};
  const parseDiscover = h => {
    const m = /^#\/discover\/([^/]+)\/(movie|series)\/([^?]+)(?:\?(.*))?$/.exec(h || "");
    return m ? { tu: decodeURIComponent(m[1]), type: m[2], cat: decodeURIComponent(m[3]), q: new URLSearchParams(m[4] || "") } : null;
  };
  async function keepPlace() {
    const now = parseDiscover(location.hash), was = lastDiscover;
    lastDiscover = now;
    if (!now || !was || now.type === was.type) return;
    const hub = /\/(microgenres\d?|sides|allservices)\/(movie|series)\/manifest\.json$/;
    // Mycelium's per-type hubs: look in the other type's hub (the microgenre families are split over several add-ons);
    // any other add-on with both types (Mycelium itself, Cinemeta, TMDB…): the same catalog in the same add-on
    const kinds = hub.test(was.tu) ? (/\/microgenres\d?\//.test(was.tu) ? ["microgenres", "microgenres2", "microgenres3", "microgenres4", "microgenres5", "microgenres6"] : [was.tu.match(hub)[1]]) : [null];
    try {
      let tu = null, cat = null;
      for (const k of kinds) {
        const u = k ? was.tu.replace(hub, `/${k}/${now.type}/manifest.json`) : was.tu;
        const man = manCache[u] || (manCache[u] = await (await fetch(u)).json().catch(() => ({})));
        cat = (man.catalogs || []).find(c => c.id === was.cat && c.type === now.type);
        if (cat) { tu = u; break; }
      }
      if (!cat) return;
      const q = new URLSearchParams();
      // "Action" ⇄ "Action & Adventure", "Sci-Fi" ⇄ "Sci-Fi & Fantasy", "World War II" ⇄ "World War II series"
      const words = x => String(x).toLowerCase().replace(/ \(series\)$| series$/, "").split(/\s*&\s*|\s+and\s+|\s*\/\s*/).filter(Boolean);
      for (const [k, v] of was.q) {
        const ex = (cat.extra || []).find(e => e.name === k);
        if (!ex) continue;
        const opts = ex.options || [];
        const base = v.replace(/ \(series\)$| series$/, "");
        const hit = [v, base, base + " series", base + " (series)"].find(o => opts.includes(o))
          || opts.find(o => { const a = words(o), b = words(v); return a[0] === b[0] || a.some(w => b.includes(w)); });
        if (hit) q.set(k, hit);
      }
      if (!q.toString() && tu === now.tu && cat.id === now.cat) return;   // nothing to carry over
      const hash = `#/discover/${encodeURIComponent(tu)}/${now.type}/${encodeURIComponent(cat.id)}${q.toString() ? "?" + q : ""}`;
      lastDiscover = parseDiscover(hash);
      location.replace(hash);
    } catch {}
  }
  lastDiscover = parseDiscover(location.hash);
  window.addEventListener("hashchange", keepPlace);

  window.addEventListener("hashchange", tick);
  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
  tick();
  log("loaded");
})();
