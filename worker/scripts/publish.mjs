// Lists Mycelium and Watch History in Stremio's public Community add-on catalog,
// using the same call as Stremio's own add-on SDK (publishToCentral). Free.
import { createInterface } from "node:readline/promises";
const rl = createInterface({ input: process.stdin, output: process.stdout });
const def = "https://mycelium.myceliation.workers.dev";
const base = ((await rl.question(`Your Mycelium address [${def}]: `)).trim() || def).replace(/\/+$/, "");
for (const [name, path] of [["Mycelium", "/manifest.json"], ["Watch History", "/history/manifest.json"]]) {
  const url = base + path;
  const check = await fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
  if (!check || !check.id) { console.log(`✗ ${name}: ${url} didn't answer with a manifest. Deploy first.`); continue; }
  if ((await rl.question(`Publish ${name} (${url}) to Stremio's Community catalog? (y/N): `)).trim().toLowerCase() !== "y") continue;
  const r = await fetch("https://api.strem.io/api/addonPublish", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ transportUrl: url, transportName: "http" }),
  });
  const j = await r.json().catch(() => ({}));
  console.log(j.error ? `✗ Stremio refused ${name}: ${JSON.stringify(j.error)}` : `✓ ${name} submitted: ${JSON.stringify(j.result ?? j)}`);
}
rl.close();
