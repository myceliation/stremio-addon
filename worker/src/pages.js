import { esc } from "./util.js";
import { MG_COUNT, FAMILIES, FAMILY_GROUPS, MICROGENRES, familiesOf } from "./microgenres.js";
import { extractCandidates, parseCsv, csvCandidates } from "./extract.js";

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="#1a1a24"/><path d="M128 52c-46 0-78 26-78 58 0 9 7 14 16 14h124c9 0 16-5 16-14 0-32-32-58-78-58z" fill="#7c6ef7"/><circle cx="104" cy="88" r="9" fill="#e8e8f0" opacity=".85"/><circle cx="146" cy="76" r="6" fill="#e8e8f0" opacity=".85"/><circle cx="160" cy="100" r="7" fill="#e8e8f0" opacity=".85"/><path d="M114 124h28l6 62c1 10-6 18-20 18s-21-8-20-18z" fill="#c96cf7"/><path d="M128 204c-18 6-40 4-58 16M128 204c18 6 40 4 58 16M128 204v28" stroke="#7c6ef7" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></svg>`;

export const HISTORY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="#1a1a24"/><circle cx="128" cy="128" r="74" fill="none" stroke="#55c88a" stroke-width="16"/><path d="M128 84v48l32 20" stroke="#e8e8f0" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const TILES = {
  import: ["📥", "Import a list", "#7c6ef7"], settings: ["⚙", "Settings", "#c96cf7"], lists: ["📋", "Your lists", "#7c9ef7"],
  history: ["🕓", "Watch History", "#55c88a"], share: ["❤", "Share", "#f7c95a"], bg: ["", "", "#7c6ef7"],
};
export function tileSvg(name) {
  // a microgenre family's tile ("fam-horror"): its name over two lines
  if (name.startsWith("fam-")) {
    const fam = name.slice(4), label = (FAMILIES.find(([f]) => f === fam) || [, fam])[1];
    const words = label.split(" "), lines = [""];
    for (const w of words) { if ((lines[lines.length - 1] + " " + w).trim().length > 15 && lines[lines.length - 1]) lines.push(""); lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); }
    const icon = fam === "channels" ? "📺" : "🍄", color = "#55c88a";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 586"><rect width="400" height="586" fill="#16161f"/><rect x="0" y="0" width="400" height="10" fill="${color}"/><text x="200" y="230" font-size="130" text-anchor="middle" fill="${color}" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">${icon}</text>${
      lines.slice(0, 4).map((l, i) => `<text x="200" y="${340 + i * 48}" font-size="38" font-weight="700" text-anchor="middle" fill="#e8e8f0" font-family="Segoe UI,Roboto,sans-serif">${esc(l)}</text>`).join("")
    }<text x="200" y="550" font-size="26" text-anchor="middle" fill="#8a8ab0" font-family="Segoe UI,Roboto,sans-serif">Mycelium</text></svg>`;
  }
  const [icon, label, color] = TILES[name] || TILES.import;
  if (name === "bg") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f0f13"/><stop offset="1" stop-color="#2a2150"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 586"><rect width="400" height="586" fill="#16161f"/><rect x="0" y="0" width="400" height="10" fill="${color}"/><text x="200" y="270" font-size="150" text-anchor="middle" fill="${color}" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">${icon}</text><text x="200" y="400" font-size="40" font-weight="700" text-anchor="middle" fill="#e8e8f0" font-family="Segoe UI,Roboto,sans-serif">${label}</text><text x="200" y="540" font-size="26" text-anchor="middle" fill="#8a8ab0" font-family="Segoe UI,Roboto,sans-serif">Mycelium</text></svg>`;
}

const BASE_CSS = `
:root{--bg:#0f0f13;--surface:#1a1a24;--s2:#22222f;--border:#2a2a3a;--accent:#7c6ef7;--accent2:#c96cf7;--text:#e8e8f0;--muted:#8a8ab0;--danger:#e05555;--ok:#55c88a;--star:#f7c95a}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}
.wrap{max-width:860px;margin:0 auto;padding:32px 16px 80px}
h1{font-size:1.9rem;letter-spacing:-.5px;display:flex;align-items:center;gap:12px}
h1 img{width:44px;height:44px}
h2{font-size:1.1rem;margin:0 0 10px}
.lead{color:var(--muted);margin:6px 0 26px;max-width:62ch}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:18px}
.btn{display:inline-flex;align-items:center;gap:8px;border:1px solid transparent;border-radius:8px;padding:9px 16px;font-family:inherit;font-weight:600;font-size:.9rem;cursor:pointer;text-decoration:none;color:var(--text);background:var(--s2)}
.btn.primary{background:var(--accent);color:#fff}
.btn.ghost{background:transparent;border-color:var(--border)}
.btn:disabled{opacity:.5;cursor:default}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
input[type=text],input[type=email],input[type=password],select,textarea{background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:9px 11px;font:inherit;width:100%}
label{color:var(--muted);font-size:.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px 14px}
.chk{display:flex;gap:8px;align-items:flex-start;color:var(--text);font-size:.9rem;padding:3px 0}
.chk input{margin-top:4px;accent-color:var(--accent)}
.note{color:var(--muted);font-size:.84rem}
.code{font:700 2.4rem/1 ui-monospace,Consolas,monospace;letter-spacing:.2em;color:var(--accent);margin:8px 0}
.hidden{display:none!important}
details summary{cursor:pointer;color:var(--muted);font-size:.9rem;margin-top:12px}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--accent);padding:10px 16px;border-radius:8px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.mg-search{margin-bottom:10px}
.tmdb{color:var(--muted);font-size:.78rem;margin-top:30px}
.stat{display:inline-flex;flex-direction:column;background:var(--s2);border-radius:8px;padding:8px 12px;min-width:110px}
.stat b{font-size:1.2rem}.stat span{color:var(--muted);font-size:.78rem}
.tabs{display:flex;gap:6px;margin-bottom:12px}.tabs .btn[aria-pressed=true]{background:var(--accent);color:#fff}
table.res{width:100%;border-collapse:collapse;font-size:.86rem}table.res td{padding:6px;border-bottom:1px solid var(--border);vertical-align:middle}
table.res img{width:38px;border-radius:4px;display:block}.conf{font-size:.75rem;padding:2px 6px;border-radius:5px;background:var(--s2)}
.conf.hi{color:var(--ok)}.conf.lo{color:var(--danger)}.bar{height:8px;background:var(--s2);border-radius:5px;overflow:hidden}.bar i{display:block;height:100%;background:var(--accent);width:0}
.listrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid var(--border)}.listrow:last-child{border-bottom:0}
`;

// a value written into a page's script: JSON, with "<" escaped so text can never close the <script> tag
const js = v => JSON.stringify(v).replace(/</g, "\\u003c");
const page = (title, body, script = "") => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link rel="icon" href="/logo.svg"><style>${BASE_CSS}</style></head><body>${body}
<script>${script}</script></body></html>`;

const SHELF_OPTS = [["library", "📚 Library (everything)"], ["watched", "✔ Watched"], ["loved", "❤ Loved"], ["liked", "👍 Liked"], ["waiting", "⏳ Waiting for release"],
  ["rewatch", "🔁 Rewatch"], ["dropped", "✖ Dropped"], ["ignore", "👎 Ignore"], ["blacklist", "🚫 Blacklist"]];

const COMMON_JS = `
const $=id=>document.getElementById(id);
const toast=m=>{const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2600)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const api=(path,body)=>fetch("/"+token+"/api/"+path,body===undefined?{}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json());
// Stremio's code login runs in your browser (Stremio's code service doesn't answer Cloudflare's servers, but it does answer browsers)
async function codeLogin(show){let c={};try{c=await(await fetch("https://link.stremio.com/api/v2/create?type=Create")).json()}catch{}
  const r=c.result||c;if(!r.code)throw new Error("Stremio didn't hand out a code. Try again in a minute.");
  show(r.code,r.link||("https://link.stremio.com/"+r.code));const t0=Date.now();
  while(Date.now()-t0<600e3){await new Promise(z=>setTimeout(z,3000));
    try{const j=await(await fetch("https://link.stremio.com/api/v2/read?type=Read&code="+encodeURIComponent(r.code))).json();const x=j.result||{};const k=x.authKey||(x.auth||{}).key;if(k)return k}catch{}}
  throw new Error("The code expired. Try again.")}
`;


// "What's inside": every family with its number of microgenres, in the same lumps as in Stremio (worked out, so it never goes stale)
function insideCard() {
  const n = {}; for (const m of MICROGENRES) if (!m.allof) for (const f of familiesOf(m)) n[f] = (n[f] || 0) + 1;
  const label = Object.fromEntries(FAMILIES);
  const lumps = FAMILY_GROUPS.map(([g, fams]) => `<p style="margin:10px 0 2px"><b>${esc(g)}</b></p><p class="note" style="margin:0">${
    fams.filter(f => n[f]).map(f => `${esc(label[f])} (${n[f]})`).join(" · ")}</p>`).join("");
  return `<section class="card"><h2>What's inside</h2>
  <p class="note">${MG_COUNT().all.toLocaleString("en")} microgenres in Discover, each family a dropdown, then genre, year, country and sort. On top of that:</p>
  <ul class="note" style="margin:6px 0 8px 18px;line-height:1.7">
    <li><b>Your Library in Discover by microgenre</b>: every microgenre your saved titles fall into, as one flat list.</li>
    <li><b>Festivals & awards that keep themselves current</b>: Oscars, Cannes, Venice, Berlin, Sundance, TIFF, the Emmys and about 50 more, newest first. Once an hour Mycelium reads one of them on Wikipedia and adds new winners and nominees.</li>
    <li><b>Stremio's own buttons count</b>: Like and Love fill Liked and Loved; what you finish in Stremio joins Watched; what you mark watched here is ticked in Stremio too.</li>
    <li><b>Wars from every side</b>: pick a war, then whose films.</li>
    <li><b>For you</b>: from what you loved, liked and watched, a different mix each day.</li>
    <li><b>Streaming-service rows</b> for any region, an honest Popular / In cinemas / New on digital, a list scraper, named lists and a page to share what you loved and watched.</li>
  </ul>${lumps}</section>`;
}

export function configurePage({ origin, providers, regions, microgenres, token = "" }) {
  const body = `<div class="wrap">
<h1><img src="/logo.svg" alt="">Mycelium</h1>
<p class="lead">Your library, your own lists, watched and shelves, living inside Stremio, with Stremio's own Like and Love buttons feeding Loved and Liked. Paste or link any Letterboxd, IMDb, TMDB or Wikipedia list and it's scraped into whichever list you choose. Plus streaming-service rows, an honest Popular and In cinemas, ${MG_COUNT().all.toLocaleString("en")} microgenres and a genre mixer in search.</p>

<section class="card" id="signin">
  <h2>Get started</h2>
  <p class="note">No sign-in. Mycelium makes you a private install link. Once it's installed, Stremio carries it to your phone, TV and other computers along with your other add-ons. It never sees your Stremio password.</p>
  <div class="row" style="margin-top:12px"><button class="btn primary" id="newBtn" type="button">Create my Mycelium</button></div>
  <p class="note" style="margin-top:12px">Already installed? In Stremio open Add-ons → Mycelium → Configure to come back here.</p>
</section>

${insideCard()}

<div id="settings" class="hidden">
  <section class="card">
    <h2 id="install">Install</h2>
    <p class="note">Mycelium is one main add-on plus <b id="addonCount">its</b> Discover add-ons: every microgenre family, your Library by microgenre, wars from every side, and every streaming service and TV channel. <b>Install everything</b> puts all of them in your Stremio account at once, at the top, on every device. It asks you to approve a one-time Stremio code; that sign-in is used once and not kept.</p>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="installAll" type="button">Install everything in Stremio</button>
      <span class="note" id="installAllNote"></span></div>
    <div id="installCode" class="hidden" style="margin-top:12px"><div class="code" id="installCodeText"></div>
      <div class="row"><a class="btn" id="installCodeLink" target="_blank" rel="noopener">Open link.stremio.com</a><span class="note">Approve it there; this page carries on by itself.</span></div></div>
    <details style="margin-top:14px"><summary class="note">Or install them one at a time</summary>
      <p class="note">In Stremio open <b>Add-ons</b>, paste a link into the search box at the top, press Enter and click <b>Install</b>. The main one first:</p>
      <div class="row"><button class="btn" id="copyUrl" type="button">Copy the main link</button>
        <a class="btn" id="installWeb" target="_blank" rel="noopener">Install on web.stremio.com</a>
        <a class="btn ghost" id="installApp">Open in Stremio app</a></div>
      <div id="addonLinks" style="display:grid;gap:6px;margin-top:10px"></div></details>
    <p class="note" style="margin-top:10px">Keep the link private: it's the key to your lists. Installed once, Stremio carries it to your other devices. If <i>Open in Stremio app</i> does nothing, that's a current Stremio bug; copy-paste always works.</p>
    <p class="note" style="margin-top:6px">The separate <a id="historyLink">Watch History</a> add-on is optional now: Stremio shows what you've watched by itself. Turn it on under Rows if you still want it.</p>
  </section>

  <section class="card">
    <h2>Your lists</h2>
    <div class="row" id="stats" style="margin-bottom:12px"></div>
    <div id="lists"></div>
    <div class="row" style="margin-top:12px">
      <input type="text" id="newListName" placeholder="New list name, e.g. Swamp cinema" style="max-width:320px">
      <button class="btn" id="newList" type="button">Create list</button>
      <a class="btn primary" id="importLink">Import a list…</a>
    </div>
  </section>

  <section class="card">
    <h2>Watch history from your Stremio account <span class="note">(optional)</span></h2>
    <p class="note">Connecting adds a Watch history row, and copies everything you finish in Stremio into Watched automatically. It also lets you push any of your lists into Stremio's own Library. Connecting uses Stremio's code login, which creates a separate session. The key is stored encrypted and deleted when you disconnect, and signing that session out in Stremio revokes it.</p>
    <div class="row" style="margin-top:12px" id="histOff"><button class="btn" id="histConnect" type="button">Connect with a Stremio code</button></div>
    <div id="histCode" class="hidden" style="margin-top:12px"><div class="code" id="code"></div>
      <div class="row"><a class="btn" id="codeLink" target="_blank" rel="noopener">Open link.stremio.com</a><span class="note">Waiting for you to approve…</span></div></div>
    <div class="hidden" id="histOn" style="margin-top:12px">
      <div class="row"><span class="note" id="histNote">Connected.</span><button class="btn ghost" id="histDisconnect" type="button">Disconnect and delete the copy</button></div>
      <div class="row" style="margin-top:12px"><label for="pushList">Copy into Stremio's Library:</label><select id="pushList" style="width:auto"></select>
        <button class="btn" id="pushBtn" type="button">Copy</button><span class="note" id="pushNote">Only adds titles Stremio doesn't have yet. Copying Watched marks them watched in Stremio.</span></div>
    </div>
  </section>

  <section class="card">
    <h2>Update Mycelium in Stremio, and put it first</h2>
    <p class="note">Stremio keeps the version of an add-on it saw when you installed it, so new lists, rows and dropdowns only appear after an update. It also shows rows, and Discover's catalog list, in install order, so a new add-on lands at the bottom, and it has no reorder button. Both live in your Stremio account, so these buttons fix them on every device; Stremio picks it up the next time its window is focused. If history isn't connected, it asks for a one-time Stremio code; that login is used once and not kept.</p>
    <div class="row" style="margin-top:12px"><button class="btn primary" id="orderKeep" type="button">Update Mycelium in Stremio</button>
      <button class="btn" id="orderTop" type="button">Update and move to the very top</button>
      <button class="btn" id="orderCine" type="button">Update and put right after Cinemeta</button></div>
    <div id="orderCode" class="hidden" style="margin-top:12px"><div class="code" id="orderCodeText"></div>
      <div class="row"><a class="btn" id="orderCodeLink" target="_blank" rel="noopener">Open link.stremio.com</a><span class="note">Approve it there; this page carries on by itself.</span></div></div>
    <p class="note" id="orderNote" style="margin-top:8px"></p>
  </section>

  <section class="card">
    <h2>Rows on your board</h2>
    <div class="grid" id="rows"></div>
    <div class="row" style="margin-top:14px">
      <label class="chk"><input type="checkbox" id="hideWatched"> Keep watched titles out of the Library row and Home's discovery rows (Popular, For you, Hidden gems…). Microgenres, studios, channels and streaming services in Discover always show everything.</label>
      <label class="chk"><input type="checkbox" id="hideIgnored"> Hide Ignore and Blacklist titles everywhere</label>
      <label class="chk"><input type="checkbox" id="shelveButton"> Show a “🍄 Mycelium” entry on every title (add or shelve)</label>
      <label class="chk"><input type="checkbox" id="autoUpdate"> Update Mycelium in Stremio by itself when there's a new version (needs your Stremio account connected, above; otherwise a 🍄 “Update Mycelium” tile appears in the Mycelium row)</label>
      <label class="chk"><input type="checkbox" id="serviceHome"> Home rows for the 6 biggest streaming services where you live (every service is always in Discover → 📺 Streaming services; rows also appear as separate entries in Discover's list)</label>
      <label class="chk"><input type="checkbox" id="serviceRows"> A Home row for every streaming service you picked (with hundreds of services this adds several "Mycelium · Services" add-ons)</label>
      <label class="chk"><input type="checkbox" id="mgLinks"> List each title's microgenres on its page, as links (Mycelium then supplies title pages, using Cinemeta's details)</label>
    </div>
  </section>

  <section class="card">
    <h2>Streaming services</h2>
    <p class="note">Availability comes live from TMDB (JustWatch data), so rows always show what's on each service now. Pick regions (Select all for the whole world), then services. Each service appears once, even when it uses different ids in different countries, and its row has a dropdown with every one of your regions where it exists. It opens on your home region when the service is there.</p>
    <div class="row" style="margin-top:10px"><input type="text" id="regionSearch" placeholder="Filter regions" style="max-width:260px">
      <button class="btn ghost" id="regionsAll" type="button">Select all</button><button class="btn ghost" id="regionsNone" type="button">Clear</button>
      <label for="homeRegion">Home</label><select id="homeRegion" style="width:auto"></select></div>
    <div class="grid" id="regionsGrid" style="margin-top:8px;max-height:220px;overflow:auto"></div>
    <div class="row" style="margin-top:12px"><button class="btn" id="loadProv" type="button">Show services in these regions</button><span class="note" id="provNote"></span></div>
    <div class="row" style="margin-top:8px"><input type="text" id="provSearch" placeholder="Filter services" style="max-width:260px">
      <button class="btn ghost" id="provAll" type="button">Select all shown</button><button class="btn ghost" id="provNone" type="button">Clear</button><span class="note" id="provCount"></span></div>
    <div class="grid" id="providers" style="margin-top:8px;max-height:360px;overflow:auto"></div>
  </section>

  <section class="card">
    <h2>Microgenres on your Home board</h2>
    <p class="note">You don't need to pick anything here to get microgenres: all ${MG_COUNT().all.toLocaleString("en")} are already in Stremio's Discover, in the 🍄 Mycelium add-ons (one dropdown per family). Ticking one here also gives it its own row on your Home board. Up to 20, because Stremio loads every Home row each time you open it, and it refuses an add-on that gets too big. Every title's page also lists its microgenres as links. ${token ? `<a href="/${token}/untagged">See the titles in your Library that fall in no microgenre</a>.` : ""}</p>
    <div class="row" style="margin-top:10px"><input type="text" class="mg-search" id="mgSearch" placeholder="Filter microgenres" style="max-width:300px;margin:0">
      <button class="btn ghost" id="mgNone" type="button">Clear</button></div>
    <div class="grid" id="mgs" style="max-height:420px;overflow:auto;margin-top:8px">${microgenres.map(m =>
      `<label class="chk" data-name="${esc(m.long.toLowerCase())}"><input type="checkbox" value="${m.id}">${esc(m.long)}${m.type === "series" ? " (series)" : ""}</label>`).join("")}</div>
  </section>

  <section class="card">
    <h2>Your own genres</h2>
    <p class="note">Describe a genre: “slow japanese horror 1990s”, “best korean crime series”, “obscure swamp thrillers”. Each one appears in Discover under ✎ Your own genres, at the top of the first Mycelium microgenre list. The same mixer also runs on anything you type into Stremio's search.</p>
    <div id="custom" style="display:grid;gap:8px;margin-top:10px"></div>
    <button class="btn ghost" id="addCustom" type="button" style="margin-top:10px">Add a genre</button>
  </section>

  <section class="card">
    <h2>Share what you loved, liked and watched</h2>
    <label for="displayName">Name shown to friends</label>
    <input type="text" id="displayName" placeholder="e.g. Guy" style="max-width:280px;margin:4px 0 10px">
    <div class="row" style="margin-top:8px"><a class="btn" id="shareLink" target="_blank" rel="noopener">Open my share page</a><button class="btn ghost" id="copyShare" type="button">Copy share link</button></div>
  </section>

  <div class="row"><button class="btn primary" id="save" type="button">Save changes</button><button class="btn ghost" id="signout" type="button">Forget this browser</button>
    <button class="btn ghost" id="wipe" type="button" style="margin-left:auto;color:var(--danger)">Delete my Mycelium data</button></div>
</div>
<p class="tmdb">Film and series data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB. Not affiliated with Stremio.</p>
</div>`;
  const script = `
let token=${js(token)}||(()=>{try{return localStorage.getItem("mycelium_token")||""}catch{return""}})();
${COMMON_JS}
const ROWS=[["library","📚 Library"],["history","🕓 Watch history (needs connection)"],["loved","❤ Loved & liked (Stremio's Like and Love buttons count)"],["waiting","⏳ Waiting for release"],["rewatch","🔁 Rewatch"],["forYou","✨ For you (from what you loved, liked and watched)"],["popular","🔥 Popular this week"],["cinema","🎟 Only in cinemas"],["digital","📦 New on digital"],["gems","💎 Hidden gems"],["browse","🔎 All films / All series (Discover only: every filter and sort)"],["people","🎬 Director / actor search"],["tools","🍄 Mycelium tools row (import, settings)"],["historyAddon","🕓 The separate Watch History add-on (Stremio now shows what you've watched by itself; Mycelium keeps syncing it either way)"]];
const SHELVES=${js(SHELF_OPTS.slice(0, 9))};
$("rows").innerHTML=ROWS.map(([k,l])=>'<label class="chk"><input type="checkbox" data-row="'+k+'">'+l+'</label>').join("");
let state=null;
function gotToken(t){token=t;try{localStorage.setItem("mycelium_token",t)}catch{}load()}
$("newBtn").onclick=async()=>{$("newBtn").disabled=true;const r=await fetch("/api/new",{method:"POST"}),j=await r.json();
  if(j.token)gotToken(j.token);else{toast(j.error||"Couldn't create it");$("newBtn").disabled=false}};
function installButtons(url,app,web,copy){const host=url.replace(/^https?:\\/\\//,"");$(app).href="stremio://"+host;
  $(web).href="https://web.stremio.com/#/addons?addon="+encodeURIComponent(url);$(copy).onclick=()=>{navigator.clipboard.writeText(url);toast("Link copied")}}
function renderLists(){
  const c=state.counts||{},n=k=>((c[k]||{}).movie||0)+((c[k]||{}).series||0);
  $("stats").innerHTML=SHELVES.map(([k,l])=>'<div class="stat"><b>'+n(k).toLocaleString()+'</b><span>'+esc(l.replace(" (everything)",""))+'</span></div>').join("");
  $("lists").innerHTML=(state.lists||[]).map(l=>'<div class="listrow" data-lid="'+l.lid+'"><input type="text" value="'+esc(l.name)+'" data-f="name" style="max-width:280px"><span class="note">'+n("l:"+l.lid).toLocaleString()+' titles</span><label class="chk"><input type="checkbox" data-f="row" '+(l.row?"checked":"")+'> show as a row</label><a class="btn ghost" href="/'+token+'/import?target=l:'+l.lid+'">Import into it</a><a class="btn ghost" href="/'+token+'/api/export?list=l:'+l.lid+'">CSV</a><button class="btn ghost" data-del type="button" style="color:var(--danger)">Delete</button></div>').join("")||'<p class="note">No named lists yet. Create one, then import any list into it.</p>';
  $("pushList").innerHTML=SHELVES.map(([k,l])=>'<option value="'+k+'">'+esc(l)+'</option>').join("")+(state.lists||[]).map(l=>'<option value="l:'+l.lid+'">📋 '+esc(l.name)+'</option>').join("");
}
$("lists").addEventListener("change",async e=>{const r=e.target.closest(".listrow");if(!r)return;
  if(e.target.dataset.f==="name")await api("lists/"+r.dataset.lid,{name:e.target.value});
  if(e.target.dataset.f==="row")await api("lists/"+r.dataset.lid,{row:e.target.checked});toast("Saved. Click “Update Mycelium in Stremio” below to see it in Stremio")});
$("lists").addEventListener("click",async e=>{if(e.target.dataset.del===undefined)return;const r=e.target.closest(".listrow");
  if(!confirm("Delete this list? The titles stay in your other lists."))return;await api("lists/"+r.dataset.lid+"/delete",{});load()});
$("newList").onclick=async()=>{const name=$("newListName").value.trim();if(!name)return toast("Give it a name");await api("lists",{name});$("newListName").value="";load()};
$("histConnect").onclick=async()=>{$("histConnect").disabled=true;
  try{const key=await codeLogin((code,link)=>{$("code").textContent=code;$("codeLink").href=link;$("histCode").classList.remove("hidden")});
    $("histCode").classList.add("hidden");const r=await api("history/connect",{authKey:key});if(!r.connected)throw new Error(r.error||"Mycelium couldn't use that sign-in");showHist(true);warm()}
  catch(e){$("histCode").classList.add("hidden");$("histConnect").disabled=false;toast(e.message)}};
async function addonOrder(where){$("orderNote").textContent="Working…";let r=await api("addon-order",{where});
  if(r.needCode){try{const key=await codeLogin((code,link)=>{$("orderCodeText").textContent=code;$("orderCodeLink").href=link;$("orderCode").classList.remove("hidden")});
      r=await api("addon-order",{where,authKey:key})}catch(e){r={error:e.message}}
    $("orderCode").classList.add("hidden")}
  $("orderNote").textContent=r.ok?"Done: updated "+r.refreshed+" add-on"+(r.refreshed===1?"":"s")+(where==="keep"?"":". Order now: "+r.order.join(" → "))+". Click into Stremio (or restart it) to see it.":"Couldn't update: "+(r.error||"code expired")}
$("installAll").onclick=async()=>{$("installAll").disabled=true;$("installAllNote").textContent="Working…";let r=await api("addon-order",{where:"top"});
  if(r.needCode){try{const key=await codeLogin((code,link)=>{$("installCodeText").textContent=code;$("installCodeLink").href=link;$("installCode").classList.remove("hidden")});
      r=await api("addon-order",{where:"top",authKey:key})}catch(e){r={error:e.message}}$("installCode").classList.add("hidden")}
  $("installAllNote").textContent=r.ok?"Done: "+r.refreshed+" add-ons installed at the top. Restart Stremio (on phones and TVs, close and reopen the app) to see them.":"Couldn't install: "+(r.error||"code expired");$("installAll").disabled=false};
async function addonLinks(){try{const urls=await api("addons");$("addonCount").textContent=(urls.length-1)+"";
  $("addonLinks").innerHTML=urls.map((u,i)=>'<div class="row"><code class="note" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(u.split("/").slice(4).join("/"))+'</code><button class="btn ghost" type="button" data-u="'+esc(u)+'">Copy</button></div>').join("");
  $("addonLinks").onclick=e=>{const u=e.target.dataset.u;if(u){navigator.clipboard.writeText(u);toast("Link copied")}}}catch{}}
$("orderKeep").onclick=()=>addonOrder("keep");$("orderTop").onclick=()=>addonOrder("top");$("orderCine").onclick=()=>addonOrder("after-cinemeta");
$("histDisconnect").onclick=async()=>{await api("history/disconnect",{});showHist(false);toast("Disconnected; history copy deleted")};
function showHist(on){$("histOff").classList.toggle("hidden",on);$("histOn").classList.toggle("hidden",!on);$("histConnect").disabled=false}
async function warm(){for(let i=0;i<30;i++){const j=await api("warm");if(j.error){$("histNote").textContent="Couldn't read your Stremio library: "+j.error;return}
  $("histNote").textContent=j.complete?"Connected. "+(j.titles||0).toLocaleString()+" titles in your Stremio library; finished ones are in Watched.":"Reading your Stremio library… "+(j.titles||0).toLocaleString();if(j.complete)return load(true)}}
$("pushBtn").onclick=async()=>{$("pushBtn").disabled=true;let off=0,n=0;
  while(off!==null){const j=await api("to-stremio",{list:$("pushList").value,offset:off});if(j.error){toast(j.error);break}n+=j.pushed;off=j.next;$("pushNote").textContent="Copied "+n.toLocaleString()+" so far…"}
  $("pushNote").textContent="Done: "+n.toLocaleString()+" titles added to Stremio's Library.";$("pushBtn").disabled=false};
function customRow(c={}){const d=document.createElement("div");d.className="row";
  d.innerHTML='<input type="text" placeholder="name (optional)" style="flex:1;min-width:140px" data-f="name"><input type="text" placeholder="what to look for" style="flex:2;min-width:200px" data-f="query"><select data-f="type" style="width:auto"><option value="movie">Films</option><option value="series">Series</option></select><button class="btn ghost" type="button">Remove</button>';
  d.querySelector('[data-f=name]').value=c.name||"";d.querySelector('[data-f=query]').value=c.query||"";d.querySelector("select").value=c.type||"movie";d.dataset.id=c.id||"";d.querySelector("button").onclick=()=>d.remove();$("custom").append(d)}
$("addCustom").onclick=()=>customRow();
// ── regions + services (live from TMDB) ──
let allRegions=[],provList=[],chosenProv=new Map();
async function initServices(s){
  if(!allRegions.length)allRegions=await(await fetch("/api/regions")).json();
  const sel=new Set(s.regions&&s.regions.length?s.regions:[s.region||"US"]);
  $("regionsGrid").innerHTML=allRegions.map(r=>'<label class="chk" data-name="'+esc((r.name+" "+r.code).toLowerCase())+'"><input type="checkbox" value="'+r.code+'" '+(sel.has(r.code)?"checked":"")+'>'+esc(r.name)+' <span class="note">'+r.code+'</span></label>').join("");
  chosenProv=new Map((s.providers||[]).map(p=>[p.name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),{name:p.name,ids:p.ids||{"*":p.id}}]));
  refreshHome((s.regions||[])[0]);await loadProviders();
}
// the home region sticks through "Select all" / "Clear" (it used to fall back to the first region in the list)
let homeWanted="";
function refreshHome(want){const regs=[...document.querySelectorAll("#regionsGrid input:checked")].map(c=>c.value);if(want)homeWanted=want;const cur=homeWanted||$("homeRegion").value;
  const order=[...regs].sort((a,b)=>(a===cur?-1:b===cur?1:0));
  $("homeRegion").innerHTML=order.map(c=>'<option value="'+c+'">'+esc((allRegions.find(r=>r.code===c)||{name:c}).name)+'</option>').join("");if(regs.includes(cur))$("homeRegion").value=cur}
$("regionsGrid").onchange=()=>refreshHome();$("homeRegion").onchange=()=>{homeWanted=$("homeRegion").value};
$("regionSearch").oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll("#regionsGrid label").forEach(l=>l.classList.toggle("hidden",!!q&&!l.dataset.name.includes(q)))};
$("regionsAll").onclick=()=>{document.querySelectorAll("#regionsGrid label:not(.hidden) input").forEach(c=>c.checked=true);refreshHome()};
$("regionsNone").onclick=()=>{document.querySelectorAll("#regionsGrid input").forEach(c=>c.checked=false);refreshHome()};
async function loadProviders(){
  const regs=[...document.querySelectorAll("#regionsGrid input:checked")].map(c=>c.value);if(!regs.length)return;
  const by=new Map(),key=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  for(let i=0;i<regs.length;i+=6){$("provNote").textContent="Loading services… "+Math.min(i+6,regs.length)+" of "+regs.length+" regions";
    const part=await(await fetch("/api/providers?regions="+regs.slice(i,i+6).join(","))).json();
    for(const p of part){const k=key(p.name);const e=by.get(k)||{name:p.name,ids:{},rank:999};
      for(const r of p.regions)if(!e.ids[r])e.ids[r]=p.id;e.rank=Math.min(e.rank,p.rank);by.set(k,e)}}
  for(const [k,p] of chosenProv){const e=by.get(k);if(e)chosenProv.set(k,{name:e.name,ids:{...p.ids,...e.ids}});else by.set(k,{name:p.name,ids:p.ids,rank:0})}
  provList=[...by.entries()].map(([k,e])=>({key:k,...e,n:Object.keys(e.ids).length})).sort((a,b)=>b.n-a.n||a.rank-b.rank);
  $("provNote").textContent=provList.length.toLocaleString()+" services across "+regs.length+" region"+(regs.length>1?"s":"");drawProv()}
function drawProv(){const q=$("provSearch").value.toLowerCase();
  $("providers").innerHTML=provList.filter(p=>!q||p.name.toLowerCase().includes(q)).slice(0,1500).map(p=>{const rs=Object.keys(p.ids).filter(r=>r!=="*");
    return '<label class="chk"><input type="checkbox" value="'+p.key+'" '+(chosenProv.has(p.key)?"checked":"")+'>'+esc(p.name)+' <span class="note">'+(rs.length>5?rs.length+" regions":rs.join(" "))+'</span></label>'}).join("");
  $("provCount").textContent=chosenProv.size+" selected"}
$("providers").onchange=e=>{const p=provList.find(x=>x.key===e.target.value);if(!p)return;e.target.checked?chosenProv.set(p.key,{name:p.name,ids:p.ids}):chosenProv.delete(p.key);$("provCount").textContent=chosenProv.size+" selected"};
$("provSearch").oninput=drawProv;$("loadProv").onclick=loadProviders;
$("provAll").onclick=()=>{document.querySelectorAll("#providers input").forEach(c=>{c.checked=true;const p=provList.find(x=>x.key===c.value);chosenProv.set(p.key,{name:p.name,ids:p.ids})});$("provCount").textContent=chosenProv.size+" selected"};
$("provNone").onclick=()=>{chosenProv.clear();drawProv()};
window._unusedMgAll=()=>document.querySelectorAll("#mgs label:not(.hidden) input").forEach(c=>c.checked=true);
$("mgNone").onclick=()=>document.querySelectorAll("#mgs input").forEach(c=>c.checked=false);
$("mgs").onchange=e=>{if(e.target.checked&&document.querySelectorAll("#mgs input:checked").length>20){e.target.checked=false;toast("Up to 20 Home rows. All of them are in Discover already.")}};
$("mgSearch").oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll("#mgs label").forEach(l=>l.classList.toggle("hidden",!!q&&!l.dataset.name.includes(q)))};
async function load(quiet){
  const r=await fetch("/"+token+"/api/settings");if(!r.ok){try{localStorage.removeItem("mycelium_token")}catch{};token="";return}
  state=await r.json();const s=state.settings;
  $("signin").classList.add("hidden");$("settings").classList.remove("hidden");
  installButtons(state.install,"installApp","installWeb","copyUrl");addonLinks();$("historyLink").href="/"+token+"/history";
  $("importLink").href="/"+token+"/import";$("shareLink").href=state.share;$("copyShare").onclick=()=>{navigator.clipboard.writeText(state.share);toast("Share link copied")};
  renderLists();showHist(!!state.historyConnected);
  if(quiet)return;
  document.querySelectorAll("[data-row]").forEach(c=>c.checked=!!s.rows[c.dataset.row]);
  initServices(s);["hideIgnored","hideWatched","shelveButton"].forEach(k=>$(k).checked=!!s[k]);$("autoUpdate").checked=s.autoUpdate!==false;$("mgLinks").checked=s.mgLinks!==false;$("serviceRows").checked=!!s.serviceRows;$("serviceHome").checked=!!s.serviceHome;$("displayName").value=s.displayName||"";
  document.querySelectorAll("#mgs input").forEach(c=>c.checked=s.microgenres.includes(c.value));
  $("custom").innerHTML="";(s.custom||[]).forEach(customRow);
  if(state.historyConnected)warm();
}
$("save").onclick=async()=>{
  const regs=[...document.querySelectorAll("#regionsGrid input:checked")].map(c=>c.value);const home=$("homeRegion").value;
  const s={regions:[home,...regs.filter(r=>r!==home)].filter(Boolean),hideIgnored:$("hideIgnored").checked,autoUpdate:$("autoUpdate").checked,hideWatched:$("hideWatched").checked,shelveButton:$("shelveButton").checked,mgLinks:$("mgLinks").checked,serviceRows:$("serviceRows").checked,serviceHome:$("serviceHome").checked,displayName:$("displayName").value,
    rows:Object.fromEntries([...document.querySelectorAll("[data-row]")].map(c=>[c.dataset.row,c.checked])),
    providers:[...chosenProv.values()],
    microgenres:[...document.querySelectorAll("#mgs input:checked")].map(c=>c.value),
    custom:[...document.querySelectorAll("#custom .row")].map(d=>({id:d.dataset.id,name:d.querySelector('[data-f=name]').value,query:d.querySelector('[data-f=query]').value,type:d.querySelector('[data-f=type]').value}))};
  const j=await api("settings",s);toast(j.settings?"Saved. Click “Update Mycelium in Stremio” to see the changes in Stremio":"Couldn't save")};
$("wipe").onclick=async()=>{if(!confirm("Delete all your Mycelium lists, shelves and settings? Your Stremio account is not touched."))return;
  await api("delete",{});try{localStorage.removeItem("mycelium_token")}catch{};location.href="/configure"};
$("signout").onclick=()=>{try{localStorage.removeItem("mycelium_token")}catch{};location.href="/configure"};
if(token)load();
`;
  return page("Mycelium for Stremio", body, script);
}

export function importPage({ origin, token }) {
  const body = `<div class="wrap" style="max-width:980px">
<h1><img src="/logo.svg" alt="">Import a list</h1>
<p class="lead">Paste a whole page (Ctrl+A, Ctrl+C on a Letterboxd, IMDb, TMDB or Wikipedia list), drop in a link, or upload an IMDb or Letterboxd CSV. Mycelium finds every title, shows you the matches, and adds the ones you keep to the list you pick.</p>
<section class="card">
  <div class="tabs" id="tabs"><button class="btn" data-t="paste" aria-pressed="true" type="button">Paste text</button><button class="btn" data-t="url" aria-pressed="false" type="button">Link</button><button class="btn" data-t="csv" aria-pressed="false" type="button">CSV file</button></div>
  <div data-p="paste"><textarea id="text" rows="10" placeholder="Paste anything: a list page, titles one per line, IMDb or Letterboxd links…"></textarea><p class="note" id="pasteCount"></p></div>
  <div data-p="url" class="hidden"><input type="text" id="url" placeholder="https://letterboxd.com/…/list/…   ·   https://en.wikipedia.org/wiki/Category:…   ·   https://www.themoviedb.org/list/…">
    <p class="note" style="margin-top:6px">Letterboxd lists, watchlists and /films/ pages; TMDB lists, collections, keywords, people and companies; Wikipedia list articles and categories; most other pages that mention films. IMDb usually blocks servers, so paste IMDb pages instead.</p></div>
  <div data-p="csv" class="hidden"><input type="file" id="csv" accept=".csv,text/csv"><p class="note" style="margin-top:6px">IMDb exports (list, watchlist, ratings) and Letterboxd exports (watched, watchlist, ratings, diary). Star ratings in the file aren't used: Mycelium follows Stremio's Like and Love instead.</p></div>
  <div class="row" style="margin-top:14px">
    <label for="target">Add to</label><select id="target" style="width:auto"></select>
    <input type="text" id="newName" placeholder="Name for the new list" class="hidden" style="max-width:260px">
    <button class="btn primary" id="go" type="button">Find titles</button>
  </div>
</section>
<section class="card hidden" id="prog"><h2 id="progTitle">Finding titles…</h2><div class="bar"><i id="barFill"></i></div><p class="note" id="progNote" style="margin-top:8px"></p></section>
<section class="card hidden" id="review">
  <div class="row" style="justify-content:space-between"><h2 id="revTitle"></h2>
    <div class="row"><label class="chk"><input type="checkbox" id="showMissing"> Show titles that weren't found</label>
      <button class="btn ghost" id="selAll" type="button">Select all</button><button class="btn ghost" id="selNone" type="button">Select none</button>
      <button class="btn primary" id="commit" type="button">Add selected</button></div></div>
  <p class="note" style="margin:6px 0 10px">Matches under 70% confidence start unticked. Check them before adding.</p>
  <table class="res"><tbody id="resBody"></tbody></table>
</section>
<p class="note"><a id="backLink" href="/${token}/configure">← Back to settings</a></p>
</div>`;
  const script = `
const token=${js(token)};
${COMMON_JS}
${extractCandidates.toString()}
${parseCsv.toString()}
${csvCandidates.toString()}
let tab="paste",job=null,rows=[];
document.getElementById("tabs").onclick=e=>{const b=e.target.closest("[data-t]");if(!b)return;tab=b.dataset.t;
  document.querySelectorAll("#tabs .btn").forEach(x=>x.setAttribute("aria-pressed",x===b));document.querySelectorAll("[data-p]").forEach(x=>x.classList.toggle("hidden",x.dataset.p!==tab))};
$("text").oninput=()=>{const n=extractCandidates($("text").value).length;$("pasteCount").textContent=n?n.toLocaleString()+" possible titles spotted":""};
const QS=new URLSearchParams(location.search);
if(QS.get("url")){document.querySelector('#tabs [data-t="url"]').click();$("url").value=QS.get("url")}
if(QS.get("brand")==="history"){document.title="Import watched titles · Watch History";document.querySelector("h1").innerHTML='<img src="/history.svg" alt="">Import what you&#39;ve watched';
  document.querySelector("p.lead").textContent="Paste a Letterboxd diary or /films/ page, an IMDb ratings page, or upload a Letterboxd or IMDb CSV. Everything you keep goes into Watched.";}
(async()=>{const s=await api("settings");const want=QS.get("target");
  $("target").innerHTML=${js(SHELF_OPTS)}.map(([k,l])=>'<option value="'+k+'">'+esc(l)+'</option>').join("")
   +(s.lists||[]).map(l=>'<option value="l:'+l.lid+'">📋 '+esc(l.name)+'</option>').join("")+'<option value="new">＋ New list…</option>';
  if(want)$("target").value=want})();
$("target").onchange=()=>$("newName").classList.toggle("hidden",$("target").value!=="new");
if(QS.get("brand")==="history")$("backLink").href="/"+token+"/history";
$("go").onclick=async()=>{
  let target=$("target").value,payload={target};
  if(target==="new"){const name=$("newName").value.trim();if(!name)return toast("Name the new list");const l=await api("lists",{name});target=payload.target="l:"+l.lid}
  if(tab==="paste"){payload.rows=extractCandidates($("text").value);payload.source="paste";if(!payload.rows.length)return toast("No titles spotted in that text")}
  if(tab==="url"){payload.url=$("url").value.trim();if(!/^https?:\\/\\//.test(payload.url))return toast("Paste a full link starting with https://")}
  if(tab==="csv"){const f=$("csv").files[0];if(!f)return toast("Choose a CSV file");payload.rows=csvCandidates(await f.text());payload.source="csv";if(!payload.rows.length)return toast("That CSV has no titles I recognise")}
  $("go").disabled=true;
  const s=await api("import/start",payload);if(s.error){toast(s.error);$("go").disabled=false;return}
  job=s.job;await run(target)};
async function run(target){
  $("review").classList.add("hidden");$("prog").classList.remove("hidden");$("progTitle").textContent="Finding titles…";
  let p={};const show=q=>{p=q;const pct=q.total?Math.round(100*(q.total-q.pending)/q.total):3;$("barFill").style.width=pct+"%";
    $("progNote").textContent=(q.phase==="collect"?(q.msg||"Reading the source…"):q.found.toLocaleString()+" found, "+q.missing.toLocaleString()+" not found, "+q.pending.toLocaleString()+" to go")};
  // four helpers work through the titles side by side
  const worker=async k=>{let q;do{q=await api("import/"+job+"/step",{shard:k,of:4});if(q.error){q={phase:"error",msg:q.error}}
    if(!k||q.phase!=="collect")show(q);if(k&&q.phase==="collect")await new Promise(z=>setTimeout(z,1500))}while(q.phase==="collect"||q.phase==="resolve");return q};
  const ends=await Promise.all([0,1,2,3].map(worker));p=ends.find(q=>q.phase==="error")||ends[0];show(p);
  $("go").disabled=false;
  if(p.phase==="error"){$("progTitle").textContent="That didn't work";$("progNote").textContent=p.msg;return}
  $("prog").classList.add("hidden");showResults(target)}
// started from the browser extension: /import?job=…
(async()=>{const q=new URLSearchParams(location.search).get("job");if(!q)return;job=q;
  const r=await api("import/"+job+"/results");if(r.error)return toast(r.error);$("go").disabled=true;await run(r.target);$("go").disabled=false})();
async function showResults(target){
  const r=await api("import/"+job+"/results");rows=r.rows;const seenIds=new Set();
  rows.forEach(x=>{if(x.status===1&&seenIds.has(x.id))x.dup=true;if(x.status===1)seenIds.add(x.id);x.sel=x.status===1&&!x.dup&&(x.conf==null||x.conf>=70)});
  $("review").dataset.target=target;draw()}
function draw(){
  const showMissing=$("showMissing").checked,found=rows.filter(r=>r.status===1&&!r.dup);
  $("revTitle").textContent=found.length.toLocaleString()+" of "+rows.length.toLocaleString()+" titles found";
  $("resBody").innerHTML=rows.filter(r=>(r.status===1&&!r.dup)||(showMissing&&r.status===2)).map(r=>r.status===1
    ?'<tr><td><input type="checkbox" data-i="'+r.idx+'" '+(r.sel?"checked":"")+'></td><td>'+(r.poster?'<img loading="lazy" src="'+esc(r.poster)+'">':'')+'</td><td><b>'+esc(r.name||r.id)+'</b> <span class="note">'+esc(r.year||"")+' · '+(r.type==="series"?"series":"film")+(r.stars?' · '+"★".repeat(r.stars):"")+'</span><div class="note">from: '+esc(r.input)+'</div></td><td><span class="conf '+(r.conf>=70?"hi":"lo")+'">'+(r.conf??"")+'%</span></td></tr>'
    :'<tr><td></td><td></td><td class="note">Not found: '+esc(r.input)+'</td><td></td></tr>').join("");
  $("review").classList.remove("hidden")}
$("resBody").onchange=e=>{const i=+e.target.dataset.i;const r=rows.find(x=>x.idx===i);if(r)r.sel=e.target.checked};
$("showMissing").onchange=draw;
$("selAll").onclick=()=>{rows.forEach(r=>r.sel=r.status===1);draw()};$("selNone").onclick=()=>{rows.forEach(r=>r.sel=false);draw()};
$("commit").onclick=async()=>{const idxs=rows.filter(r=>r.sel).map(r=>r.idx);if(!idxs.length)return toast("Nothing selected");
  $("commit").disabled=true;let added=0,rated=0;
  for(let i=0;i<idxs.length;i+=150){const j=await api("import/"+job+"/commit",{idxs:idxs.slice(i,i+150),target:$("review").dataset.target});
    if(j.error){toast(j.error);break}added+=j.added;rated+=j.rated||0;$("revTitle").textContent="Adding… "+added.toLocaleString()+" of "+idxs.length.toLocaleString()}
  $("revTitle").textContent="Added "+added.toLocaleString()+" titles"+(rated?" and "+rated.toLocaleString()+" ratings":"")+". Stremio shows them the next time it loads the row.";$("commit").disabled=false};
`;
  return page("Import a list · Mycelium", body, script);
}

export function actPage({ origin, token, type, id, meta, state, shelves, lists }) {
  const has = k => state.lists.includes(k);
  const body = `<div class="wrap" style="max-width:560px">
  <div class="row" style="gap:16px;align-items:flex-start;margin-bottom:20px">
    ${meta.poster ? `<img src="${esc(meta.poster)}" alt="" style="width:110px;border-radius:8px">` : ""}
    <div><h1 style="font-size:1.4rem">${esc(meta.name)}</h1><p class="note">${esc(meta.year || "")}</p></div>
  </div>
  <section class="card"><h2>Lists</h2><div class="row" id="lists">
    <button class="btn ${has("library") ? "primary" : "ghost"}" data-k="library" aria-pressed="${has("library")}" type="button">📚 Library</button>
    ${shelves.map(s => `<button class="btn ${has(s.key) ? "primary" : "ghost"}" data-k="${s.key}" aria-pressed="${has(s.key)}" type="button">${s.icon} ${esc(s.label)}</button>`).join("")}
    ${lists.map(l => `<button class="btn ${has("l:" + l.lid) ? "primary" : "ghost"}" data-k="l:${l.lid}" aria-pressed="${has("l:" + l.lid)}" type="button">📋 ${esc(l.name)}</button>`).join("")}
  </div></section>
  <p class="note">Changes save instantly. Close this tab to go back to Stremio.</p></div>`;
  const script = `
const T=${js(token)},ID=${js(id)},TY=${js(type)};
const post=(p,b)=>fetch("/"+T+"/api/"+p,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(r=>r.json());
function paint(st){document.querySelectorAll("#lists button").forEach(b=>{const on=st.lists.includes(b.dataset.k);b.className="btn "+(on?"primary":"ghost");b.setAttribute("aria-pressed",on)});}
document.getElementById("lists").onclick=async e=>{const b=e.target.closest("button");if(!b)return;
  paint(await post("member",{id:ID,type:TY,list:b.dataset.k,on:b.getAttribute("aria-pressed")!=="true"}))};`;
  return page(meta.name + " · Mycelium", body, script);
}

export function untaggedPage({ token, list, waiting }) {
  const e = x => String(x ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const part = t => { const xs = list.filter(x => x.type === t); return `<h2>${t === "series" ? "Series" : "Films"} (${xs.length})</h2>` +
    (xs.length ? `<ul>${xs.map(x => `<li><a href="https://www.imdb.com/title/${e(x.id)}/" target="_blank" rel="noopener">${e(x.name && x.name !== x.id ? x.name : x.id)}</a></li>`).join("")}</ul>` : "<p class=\"note\">None.</p>"); };
  const body = `<div class="wrap"><h1>In no microgenre</h1>
<p class="lead">Titles in your Library that were checked against every microgenre and fall in none. They're what the next rows could be built from.</p>
${waiting ? `<p class="note">${waiting.toLocaleString("en")} titles haven't been checked yet. <button class="btn" id="fill" type="button">Check them now</button> <span id="fillMsg" class="note"></span></p>` : ""}
${part("movie")}${part("series")}
<p><a href="/${e(token)}/configure">Back to settings</a></p></div>`;
  const script = `const T=${JSON.stringify(token)};const b=document.getElementById("fill");if(b)b.onclick=async()=>{b.disabled=true;const m=document.getElementById("fillMsg");let n=0;
for(;;){let r;try{r=await fetch("/"+T+"/api/mg-fill",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}).then(x=>x.json())}catch{m.textContent="Stopped; try again.";break}
n+=r.filled||0;m.textContent=n+" checked…";if(r.done||!r.filled){location.reload();break}}};`;
  return page("In no microgenre · Mycelium", body, script);
}

export function sharePage({ origin, share, who, watched, loved }) {
  const card = m => `<a href="https://www.imdb.com/title/${m.id}/" style="color:inherit;text-decoration:none" target="_blank" rel="noopener">
    <div style="aspect-ratio:2/3;background:var(--s2);border-radius:8px;overflow:hidden">${m.poster ? `<img src="${esc(m.poster)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">` : ""}</div>
    <div style="font-size:.85rem;font-weight:600;margin-top:6px">${esc(m.name)}</div>
    <div class="note">${esc(m.releaseInfo || "")}</div></a>`;
  const install = `${origin}/u/${share}/manifest.json`;
  const grid = `display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:16px;margin-bottom:30px`;
  const body = `<div class="wrap" style="max-width:1100px">
  <h1><img src="/logo.svg" alt="">${esc(who)}'s picks</h1>
  <p class="lead">${loved.length} loved or liked, ${watched.length} recently watched. Add them to your own Stremio as rows:</p>
  <div class="row" style="margin-bottom:24px"><a class="btn primary" href="stremio://${esc(install.replace(/^https?:\/\//, ""))}">Install in Stremio</a>
    <a class="btn" href="https://web.stremio.com/#/addons?addon=${encodeURIComponent(install)}" target="_blank" rel="noopener">Install on web.stremio.com</a></div>
  ${loved.length ? `<h2>Loved and liked</h2><div style="${grid}">${loved.map(card).join("")}</div>` : ""}
  ${watched.length ? `<h2>Watched</h2><div style="${grid}">${watched.map(card).join("")}</div>` : ""}
  ${!watched.length && !loved.length ? `<p class="note">Nothing here yet.</p>` : ""}
  <p class="tmdb">Shared with Mycelium for Stremio.</p></div>`;
  return page(`${who}'s picks`, body);
}

// ── Watch History: its own setup page (same accounts as Mycelium, own branding) ──
export function historySetupPage({ origin, token = "" }) {
  const body = `<div class="wrap" style="max-width:760px">
<h1><img src="/history.svg" alt="">Watch History</h1>
<p class="lead">Everything you've watched, as rows in Stremio that you can filter by genre, decade or language. It merges your Stremio history with anything you mark or import as watched. No sign-in.</p>

<section class="card" id="hsStart">
  <h2>Get started</h2>
  <div class="row" style="margin-top:6px"><button class="btn primary" id="newBtn" type="button">Create my Watch History</button></div>
  <p class="note" style="margin-top:10px">Already set up? In Stremio open Add-ons → Watch History → Configure to come back here.</p>
</section>

<div id="hsMain" class="hidden">
  <section class="card">
    <h2>1. Install</h2>
    <ol class="note" style="margin:6px 0 12px 18px;line-height:1.8"><li>Click <b>Copy link</b>.</li><li>In Stremio open <b>Add-ons</b>, paste it into the search box at the top, press Enter.</li><li>Click <b>Install</b>.</li></ol>
    <div class="row"><button class="btn primary" id="copyUrl" type="button">Copy link</button><a class="btn" id="installWeb" target="_blank" rel="noopener">Install on web.stremio.com</a><a class="btn ghost" id="installApp">Open in Stremio app</a></div>
    <p class="note" style="margin-top:10px">Keep the link private. Stremio carries it to your other devices.</p>
  </section>
  <section class="card">
    <h2>2. Fill it</h2>
    <p class="note">Connect your Stremio account so everything you finish in Stremio appears automatically, along with <i>Still watching</i> and <i>Watched more than once</i> rows. This uses Stremio's own code login (a separate session you can revoke); the key is stored encrypted and deleted when you disconnect.</p>
    <div class="row" style="margin-top:10px" id="histOff"><button class="btn" id="histConnect" type="button">Connect with a Stremio code</button></div>
    <div id="histCode" class="hidden" style="margin-top:12px"><div class="code" id="code"></div><div class="row"><a class="btn" id="codeLink" target="_blank" rel="noopener">Open link.stremio.com</a><span class="note">Waiting for you to approve…</span></div></div>
    <div class="row hidden" id="histOn" style="margin-top:10px"><span class="note" id="histNote">Connected.</span><button class="btn ghost" id="histDisconnect" type="button">Disconnect</button></div>
    <p class="note" style="margin-top:14px">You can also import what you've watched elsewhere (a Letterboxd diary, IMDb ratings, any list):</p>
    <div class="row" style="margin-top:6px"><a class="btn" id="importLink">Import watched titles</a><span class="note" id="count"></span></div>
  </section>
  <p class="note">Watch History is made alongside <a href="${origin}/configure">Mycelium</a>, which adds your library, lists, shelves and discovery rows. The same link works for both if you ever want it; nothing about Mycelium is installed unless you choose to.</p>
</div>
</div>`;
  const script = `
let token=${js(token)}||(()=>{try{return localStorage.getItem("mycelium_token")||""}catch{return""}})();
${COMMON_JS}
function gotToken(t){token=t;try{localStorage.setItem("mycelium_token",t)}catch{}load()}
$("newBtn").onclick=async()=>{$("newBtn").disabled=true;const j=await(await fetch("/api/new",{method:"POST"})).json();if(j.token)gotToken(j.token);else{toast(j.error||"Couldn't create it");$("newBtn").disabled=false}};
function showHist(on){$("histOff").classList.toggle("hidden",on);$("histOn").classList.toggle("hidden",!on);$("histConnect").disabled=false}
$("histConnect").onclick=async()=>{$("histConnect").disabled=true;
  try{const key=await codeLogin((code,link)=>{$("code").textContent=code;$("codeLink").href=link;$("histCode").classList.remove("hidden")});
    $("histCode").classList.add("hidden");const r=await api("history/connect",{authKey:key});if(!r.connected)throw new Error(r.error||"Mycelium couldn't use that sign-in");showHist(true);warm()}
  catch(e){$("histCode").classList.add("hidden");$("histConnect").disabled=false;toast(e.message)}};
$("histDisconnect").onclick=async()=>{await api("history/disconnect",{});showHist(false);toast("Disconnected")};
async function warm(){for(let i=0;i<30;i++){const j=await api("warm");if(j.error){$("histNote").textContent="Couldn't read your Stremio library: "+j.error;return}
  $("histNote").textContent=j.complete?"Connected. Your finished titles are in Watched.":"Reading your Stremio library… "+(j.titles||0).toLocaleString();if(j.complete)return load(true)}}
async function load(quiet){const r=await fetch("/"+token+"/api/settings");if(!r.ok){try{localStorage.removeItem("mycelium_token")}catch{};token="";return}
  const s=await r.json();$("hsStart").classList.add("hidden");$("hsMain").classList.remove("hidden");
  const url=s.install.replace(/manifest\\.json$/,"history/manifest.json"),host=url.replace(/^https?:\\/\\//,"");
  $("copyUrl").onclick=()=>{navigator.clipboard.writeText(url);toast("Link copied")};$("installWeb").href="https://web.stremio.com/#/addons?addon="+encodeURIComponent(url);$("installApp").href="stremio://"+host;
  $("importLink").href="/"+token+"/import?target=watched&brand=history";
  const w=(s.counts||{}).watched||{};$("count").textContent=((w.movie||0)+(w.series||0)).toLocaleString()+" titles in Watched so far";
  showHist(!!s.historyConnected);if(!quiet&&s.historyConnected)warm()}
if(token)load();
`;
  return page("Watch History for Stremio", body, script).replace('<link rel="icon" href="/logo.svg">', '<link rel="icon" href="/history.svg">');
}

export function markPage({ token, type, id, meta, added }) {
  const body = `<div class="wrap" style="max-width:520px;text-align:center">
  ${meta.poster ? `<img src="${esc(meta.poster)}" alt="" style="width:150px;border-radius:10px;margin:10px auto 16px;display:block">` : ""}
  <h1 style="font-size:1.4rem;justify-content:center">${esc(meta.name || id)}</h1>
  <p class="lead" style="margin:10px auto 20px">${added ? "✔ Added to your Watch History." : "Removed from your Watch History."}</p>
  <a class="btn ghost" href="/${token}/history/mark/${type}/${id}?do=${added ? "remove" : "add"}">${added ? "Undo" : "Add it back"}</a>
  <p class="note" style="margin-top:20px">Close this tab to go back to Stremio.</p></div>`;
  return page((meta.name || id) + " · Watch History", body).replace('<link rel="icon" href="/logo.svg">', '<link rel="icon" href="/history.svg">');
}
