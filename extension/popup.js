// Mycelium list importer: collects titles from the current page, starts an
// import job on your Mycelium, then opens Mycelium's review page for it.
const $ = id => document.getElementById(id);
const store = { get: k => browser.storage.local.get(k).then(r => r[k]), set: (k, v) => browser.storage.local.set({ [k]: v }) };
let base = null, token = null, payload = null;

function parseLink(l) {
  const m = String(l || "").trim().match(/^(https?:\/\/[^/]+)\/([A-Za-z0-9_-]{30,})(?:\/|$)/);
  return m ? { base: m[1], token: m[2] } : null;
}
const api = (path, body) => fetch(`${base}/${token}/api/${path}`, body === undefined ? {} :
  { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());

async function init() {
  const saved = parseLink(await store.get("myceliumLink"));
  if (!saved) { $("setup").style.display = "block"; return; }
  ({ base, token } = saved);
  $("main").style.display = "block";

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let res;
  try { res = await browser.tabs.sendMessage(tab.id, { action: "extract" }); }
  catch { $("found-msg").textContent = "Can't read this tab. Reload the page and try again."; return; }

  if (res.source === "letterboxd" || /themoviedb\.org\/(list|collection|keyword|person|company)\//.test(res.page_url)) {
    payload = { url: res.page_url, source: "extension" };
    $("found-msg").innerHTML = `Mycelium will read <b>the whole list</b>, every page of it.`;
  } else if (res.source === "imdb") {
    payload = { rows: res.data.map(id => ({ kind: "id", input: id, ref: id })), source: "extension" };
    $("found-msg").innerHTML = `Found <span class="badge">${payload.rows.length}</span> titles on this IMDb page. Scroll to the bottom first if the list loads as you scroll.`;
  } else if (res.source === "wikipedia") {
    const lang = (res.page_url.match(/\/\/(\w+)\.wikipedia/) || [])[1] || "en";
    payload = { rows: res.article_titles.map(t => ({ kind: "wiki", input: t, ref: t })), wlang: lang, source: "extension" };
    $("found-msg").innerHTML = `Found <span class="badge">${payload.rows.length}</span> linked articles. Mycelium keeps the films and series among them.`;
  } else {
    payload = { rows: extractCandidates(res.text || ""), source: "extension" };
    $("found-msg").innerHTML = `Spotted <span class="badge">${payload.rows.length}</span> possible titles on this page.`;
  }

  try {
    const s = await api("settings");
    const opts = [["library", "📚 Library (everything)"], ["watched", "✔ Watched"], ["loved", "❤ Loved"], ["waiting", "⏳ Waiting for release"],
      ["rewatch", "🔁 Rewatch"], ["dropped", "✖ Dropped"], ["ignore", "👎 Ignore"], ["blacklist", "🚫 Blacklist"]]
      .concat((s.lists || []).map(l => ["l:" + l.lid, "📋 " + l.name]));
    $("target").innerHTML = opts.map(([v, l]) => `<option value="${v}">${l.replace(/</g, "&lt;")}</option>`).join("");
    const last = await store.get("lastTarget"); if (last) $("target").value = last;
  } catch {
    $("msg").innerHTML = `<div class="error">Can't reach Mycelium at ${base}. Check the link.</div>`;
    return;
  }
  $("import-btn").disabled = !(payload.url || (payload.rows || []).length);
}

$("save-link").onclick = async () => {
  if (!parseLink($("link").value)) { $("link").style.borderColor = "#f87171"; return; }
  await store.set("myceliumLink", $("link").value.trim());
  location.reload();
};
$("change-link").onclick = async e => { e.preventDefault(); await store.set("myceliumLink", ""); location.reload(); };
$("import-btn").onclick = async () => {
  $("import-btn").disabled = true;
  await store.set("lastTarget", $("target").value);
  const r = await api("import/start", { ...payload, target: $("target").value });
  if (r.error) { $("msg").innerHTML = `<div class="error">${r.error}</div>`; $("import-btn").disabled = false; return; }
  browser.tabs.create({ url: `${base}/${token}/import?job=${r.job}` });
  window.close();
};
init();
