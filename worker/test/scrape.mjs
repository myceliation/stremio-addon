// URL scrapes: Letterboxd list, Wikipedia category, Wikipedia article, TMDB list/collection
const O = "http://127.0.0.1:8788";
const j = async (p, b) => { const r = await fetch(O + p, b === undefined ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return r.json(); };
const { token: T } = await j("/api/new", {});
for (const url of process.argv.slice(2)) {
  const t0 = Date.now();
  const s = await j(`/${T}/api/import/start`, { target: "library", url });
  let p, steps = 0; do { p = await j(`/${T}/api/import/${s.job}/step`, {}); steps++; if (steps % 10 === 0) console.log("  step", steps, JSON.stringify(p)); } while ((p.phase === "resolve" || p.phase === "collect") && steps < 200);
  const r = await j(`/${T}/api/import/${s.job}/results`); if (!r.rows) { console.log("ERR", JSON.stringify(p), JSON.stringify(r).slice(0,300)); continue; }
  const found = r.rows.filter(x => x.status === 1);
  console.log(`${url.slice(0, 70)}\n   ${p.phase} ${p.msg || ""} | ${found.length}/${r.rows.length} found, ${p.pending} pending after ${steps} steps, ${((Date.now() - t0) / 1000).toFixed(0)}s | ${found.slice(0, 4).map(x => x.name + " (" + x.year + ")").join("; ")}`);
}
