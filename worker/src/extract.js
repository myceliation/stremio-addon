// List-text parsing, shared by the Worker and the import page (this file's
// functions are inlined into the browser so huge pastes are parsed client-side).
// Port of companion/paste_import.py _extract_candidates, plus id/link detection.

export function extractCandidates(text) {
  const SKIP = /^(https?:\/\/|Category:|File:|Template:|User:|Talk:|Special:|Retrieved |Jump to |Navigation|See also|References|External links|Contents|From Wikipedia|This page|The following|All articles|Subcategor|Pages in|Hidden category|This list|This category|Director|Stars?[A-Z]|Metascore|Sort by|List Order|Visibility|Sign in|Create account|Log in|About|Privacy|Terms|Contact|Instagram|Threads|Facebook|TikTok|YouTube|Bluesky|Tagged|Comments?|Feedback|Tell us|Recently viewed|More to explore|Get the|For Android|For iOS|Follow IMDb|HelpSite|Text is|Color Auto|Appearance|Width |Cookie|Mobile view|Creative Commons|Wikimedia|MediaWiki|Wikipedia®)/i;
  const JUNK = new Set(("r pg pg-13 tv-ma tv-14 tv-pg nc-17 unrated not rated video short grid list genre decade service read edit view talk help history more search films lists members journal appearances show profile horror topstats allstats likes updated text statistics automatic standard appearance narrow wide color light dark small large normal").split(" ").concat("abcdefghijklmnopqrstuvwxyz".split("")));
  const CAP = "A-ZÀ-ɏ\"'";
  const seen = new Set(), withYear = new Set(), out = [];
  const ids = [], idSeen = new Set();

  // explicit ids and links first: tt…, letterboxd films, TMDB pages
  for (const m of text.matchAll(/\b(tt\d{7,9})\b/g)) if (!idSeen.has(m[1])) { idSeen.add(m[1]); ids.push({ kind: "id", input: m[1], ref: m[1] }); }
  for (const m of text.matchAll(/letterboxd\.com\/(?:[\w-]+\/)?film\/([a-z0-9][a-z0-9-]*)\/?/gi)) {
    const k = "lb:" + m[1]; if (!idSeen.has(k)) { idSeen.add(k); ids.push({ kind: "lb", input: m[1], ref: m[1] }); } }
  for (const m of text.matchAll(/themoviedb\.org\/(movie|tv)\/(\d+)/gi)) {
    const k = "tmdb:" + m[1] + m[2]; if (!idSeen.has(k)) { idSeen.add(k); ids.push({ kind: "tmdb", input: m[0], ref: m[1] + ":" + m[2] }); } }

  const add = (raw, year = "") => {
    let t = String(raw).trim().replace(/^[–—\-·"']+|[–—\-·"']+$/g, "").trim();
    t = t.replace(/^poster\s+for\s+/i, "").replace(/^\d+[.)]\s*/, "").trim();
    if (!year) t = t.replace(/\s*\(\w*\s*film[^)]*\)\s*$/i, "").trim();
    if (t.length < 2 || t.length > 120 || JUNK.has(t.toLowerCase()) || SKIP.test(t)) return;
    if (/^(\d+h\s*\d*m|\d+\.\d+|\d+K?|\w{1,3}-\d+)$/.test(t)) return;
    year = /^\d{4}$/.test(String(year).trim()) ? String(year).trim() : "";
    const tl = t.toLowerCase();
    if (!year && withYear.has(tl)) return;
    const key = tl + "|" + year;
    if (seen.has(key)) return;
    seen.add(key); if (year) withYear.add(tl);
    out.push({ kind: "title", input: year ? `${t} (${year})` : t, ref: t + "\u0000" + year });
  };

  // A: IMDb photo captions "Actor, Actor in Title (YEAR)"
  for (const m of text.matchAll(new RegExp(`\\bin\\s+([${CAP}][^\\n(]{1,100}?)\\s*\\((\\d{4})[^)]*\\)`, "g"))) add(m[1], m[2]);
  // B: Letterboxd "Poster for Title (YEAR)"
  for (const m of text.matchAll(new RegExp(`poster\\s+for\\s+([${CAP}][^\\n(]{0,100}?)\\s*\\((\\d{4})[^)]*\\)`, "gi"))) add(m[1], m[2]);
  // C: IMDb numbered "N. Title\nYEAR\n"
  for (const m of text.matchAll(new RegExp(`^\\s*\\d+\\.\\s+([${CAP}][^\\n]{1,120})\\n\\s*(\\d{4})\\s*\\n`, "gm")))
    if (!/\b(director|stars?)/i.test(m[1])) add(m[1].trim(), m[2]);
  // D: generic "Title (YEAR…)" at line start
  for (const m of text.matchAll(new RegExp(`(?:^|\\n)\\s*(?:\\d+[.)]\\s+)?([${CAP}][^\\n(]{1,100}?)\\s*\\((\\d{4})[^)]*\\)`, "gm"))) {
    const t = m[1].trim();
    if (t.includes(" in ")) {
      const before = t.slice(0, t.lastIndexOf(" in ")).trim();
      if (/,\s*[A-Z]/.test(before)) continue;
      const w = before.split(/\s+/);
      if (w.length >= 2 && w.length <= 4 && w.every(x => /^[A-Z][a-z]/.test(x)) &&
          !["the", "a", "an", "la", "le", "les", "das", "die", "der", "el", "los", "las"].includes(w[0].toLowerCase())) continue;
    }
    if (/^(director|stars?|sort|list order|visibility|tagged|poster)/i.test(t)) continue;
    add(t, m[2]);
  }
  // E: Wikipedia "Title (YEAR film)"
  for (const m of text.matchAll(new RegExp(`(?:^|\\n)\\s*([${CAP}][^\\n(]{1,80}?)\\s*\\((\\d*\\s*\\w*\\s*film[^)]*)\\)`, "gim"))) {
    const y = (m[2].match(/\d{4}/) || [""])[0];
    add(m[1].trim(), y);
  }
  // G: tab-separated tables "Title\tYEAR\t…"
  for (const line of text.split("\n")) {
    if (!line.includes("\t")) continue;
    const cols = line.split("\t").map(c => c.trim());
    if (cols.length < 2 || !/^\d{4}$/.test(cols[1]) || !cols[0]) continue;
    if (["title", "film", "name", "movie"].includes(cols[0].toLowerCase()) || SKIP.test(cols[0])) continue;
    let t = cols[0].replace(/\s*\((also known as|a\.k\.a\.|aka)[^)]*\)/gi, "").replace(/(\s*\[\d+\])+\s*$/, "")
      .replace(/\s*\(\w*\s*film[^)]*\)\s*$/i, "").trim();
    add(t, cols[1]);
  }
  // F: bare short lines (Wikipedia article titles, plain lists)
  for (let line of text.split("\n")) {
    line = line.trim().replace(/^[\d.)\-*•·]+\s*/, "").replace(/^[–—\-·"']+|[–—\-·"']+$/g, "").trim();
    if (line.length < 2 || line.length > 70 || !new RegExp(`^[${CAP}]`).test(line)) continue;
    if (SKIP.test(line) || JUNK.has(line.toLowerCase()) || /http|@|\||\t|\d{4}/.test(line)) continue;
    if (/\([^)]+\)/.test(line) && !/\(\w*\s*film[^)]*\)/i.test(line)) continue;
    if (/^(\d+h|\d+\.\d+|[A-Z]{1,5}-\d+|Not Rated|TV-|PG|NC)/.test(line)) continue;
    if (line === line.toUpperCase() && line.length > 2 && /[A-Z]/.test(line)) continue;
    if (line.split(/\s+/).length > 8) continue;
    if (/^(poster|updated|visibility|sort|grid|list\b|genre|decade|service|filter|followers|following|tagged|comments|likes|please|sign|create|join|profile|recently|more to|tell us|feedback|follow|get the|for android|list activity|list by|suggestions available|list order)/i.test(line)) continue;
    const tl = line.toLowerCase();
    if (withYear.has(tl) || seen.has(tl + "|")) continue;
    seen.add(tl + "|");
    out.push({ kind: "title", input: line, ref: line + "\u0000" });
  }
  return ids.concat(out);
}

// Minimal RFC-4180 CSV parser → array of objects keyed by header
export function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = ""; if (row.some(x => x !== "")) rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}

/** IMDb or Letterboxd export CSV → candidates (with stars when the file has ratings). */
export function csvCandidates(text) {
  const rows = parseCsv(text);
  const out = [];
  for (const r of rows) {
    const tt = (r.Const || r.URL || r["Letterboxd URI"] || "").match(/tt\d{7,9}/);
    let stars = null;
    if (r["Your Rating"]) stars = Math.round(+r["Your Rating"] / 2);           // IMDb 1–10
    else if (r.Rating && !isNaN(+r.Rating)) stars = Math.round(+r.Rating);     // Letterboxd 0.5–5
    if (stars !== null) stars = Math.max(1, Math.min(5, stars || 1));
    const title = r.Title || r.Name || "";
    const year = (r.Year || r["Release Date"] || "").slice(0, 4);
    if (tt) out.push({ kind: "id", input: title || tt[0], ref: tt[0], stars });
    else if (title) out.push({ kind: "title", input: year ? `${title} (${year})` : title, ref: title + "\u0000" + year, stars });
  }
  return out;
}
