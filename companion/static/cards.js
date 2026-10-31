/* Poster cards + shelf toggles shared by Watch history and Shelves. */
window.Cards = (function () {
  const TOOL_SHELVES = [
    ["loved", "❤", "Loved"], ["waiting", "⏳", "Waiting for release"],
    ["rewatch", "🔁", "Rewatch"], ["dropped", "✖", "Dropped"],
    ["ignore", "👎", "Ignore"], ["blacklist", "🚫", "Blacklist"],
  ];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function card(r, opts = {}) {
    const sh = new Set(r.shelves || []);
    const badges = [];
    if (sh.has("loved")) badges.push('<span class="badge loved">❤</span>');
    if (sh.has("waiting")) badges.push('<span class="badge waiting">⏳ waiting</span>');
    if (r.airing) badges.push('<span class="badge airing">airing</span>');
    if (r.times > 1) badges.push(`<span class="badge">×${r.times}</span>`);
    if (r.stars) badges.push(`<span class="badge" style="color:var(--star)">★${r.stars}</span>`);
    const pct = r.status === "watched" ? 100 : (r.pct || 0);
    const bar = (r.status && r.status !== "opened") ? `<span class="bar"><i style="width:${pct}%"></i></span>` : "";
    const art = r.poster
      ? `<img src="${esc(r.poster)}" alt="" loading="lazy" onerror="this.remove()">`
      : "";
    const sub = [r.year, r.episode ? "S" + r.episode.split(":")[1] + "E" + r.episode.split(":")[2] : "",
                 opts.showWhen && r.last ? r.last.slice(0, 10) : ""].filter(Boolean).join("  ");
    const tools = TOOL_SHELVES.map(([k, i, l]) =>
      `<button type="button" data-shelf="${k}" aria-pressed="${sh.has(k)}" title="${l}" aria-label="${l}">${i}</button>`).join("");
    const href = r.id.startsWith("tt") ? `/title/${encodeURIComponent(r.id)}` : "#";
    return `<div class="pcard ${r.status || ""}" data-id="${esc(r.id)}">
      <div class="artwrap"><a class="art" href="${href}"><span class="noart">${esc(r.name)}</span>${art}${bar}
        <span class="badges">${badges.join("")}</span></a>
      <div class="tools">${tools}</div></div>
      <div class="meta"><div class="name" title="${esc(r.name)}">${esc(r.name)}</div><div class="sub">${esc(sub)}</div></div>
    </div>`;
  }

  async function toggle(btn, rowsById, onChange) {
    const cardEl = btn.closest(".pcard");
    const id = cardEl.dataset.id, shelf = btn.dataset.shelf;
    const on = btn.getAttribute("aria-pressed") !== "true";
    const res = await fetch("/api/shelf", {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({imdb_id: id, shelf, on})});
    const j = await res.json();
    if (!res.ok) { toast(j.error || "Couldn't update shelf"); return; }
    const row = rowsById[id];
    if (row) row.shelves = j.shelves;
    cardEl.querySelectorAll(".tools button").forEach(b =>
      b.setAttribute("aria-pressed", j.shelves.includes(b.dataset.shelf)));
    toast(`${on ? "Added to" : "Removed from"} ${btn.title}`);
    onChange && onChange(row, shelf, on);
  }

  function bind(container, rowsById, onChange) {
    container.addEventListener("click", e => {
      const b = e.target.closest(".tools button");
      if (b) { e.preventDefault(); toggle(b, rowsById, onChange); }
    });
  }
  return {card, bind, toast, esc};
})();
