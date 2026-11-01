// One-time (and repeatable) deploy of Mycelium to your Cloudflare account.
// Run via deploy.bat on Windows, or `node scripts/setup.mjs` anywhere.
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";

import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));   // handles spaces in the folder path
process.chdir(root);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const run = (args, opts = {}) => spawnSync(npx, ["wrangler", ...args], { stdio: "inherit", shell: process.platform === "win32", ...opts });
const capture = (args, input = "") => {
  const r = spawnSync(npx, ["wrangler", ...args], { input, encoding: "utf8", shell: process.platform === "win32" });
  return (r.stdout || "") + (r.stderr || "");
};
const ask = async q => { const rl = createInterface({ input: process.stdin, output: process.stdout }); const a = await rl.question(q); rl.close(); return a.trim(); };

console.log("\n== Mycelium deploy ==\n");
if (!existsSync("node_modules/wrangler")) { console.log("Installing wrangler…"); execSync("npm install --silent", { stdio: "inherit" }); }

// 1. sign in to Cloudflare (opens the browser the first time)
const who = capture(["whoami"]);
if (/not authenticated|You are not logged in/i.test(who)) run(["login"]);

// 2. D1 database (once) + schema migrations (every run; already-applied ones are skipped)
let toml = readFileSync("wrangler.toml", "utf8");
if (toml.includes("REPLACE_WITH_D1_ID")) {
  console.log("Creating the database…");
  const out = capture(["d1", "create", "mycelium"], "n\n");
  const id = (out.match(/database_id\s*=\s*"([0-9a-f-]{36})"/) || out.match(/"database_id":\s*"([0-9a-f-]{36})"/) || [])[1];
  if (!id) { console.error(out); throw new Error("Couldn't read the database id from wrangler's output (above)."); }
  toml = toml.replace("REPLACE_WITH_D1_ID", id);
  writeFileSync("wrangler.toml", toml);
  console.log("Database id saved to wrangler.toml:", id);
}
console.log("Applying database schema…");
console.log(capture(["d1", "migrations", "apply", "mycelium", "--remote"], "y\n"));

// 3. bundle the in-app plugin, then deploy the code
execSync("node scripts/build-ui.mjs", { stdio: "inherit" });
execSync("node scripts/stamp.mjs", { stdio: "inherit" });    // after the plugin is bundled into src/
// 3b. deploy the code
console.log("\nDeploying…");
const dep = run(["deploy"]);
if (dep.status !== 0) process.exit(dep.status || 1);

// 4. secrets (only asked for if missing)
const secrets = capture(["secret", "list"]);
if (!secrets.includes("TMDB_KEY")) {
  let key = "";
  try { key = (readFileSync("../.env", "utf8").match(/^TMDB_API_KEY=(.+)$/m) || [])[1]?.trim() || ""; } catch {}
  if (!key) key = await ask("TMDB API key (free at https://www.themoviedb.org/settings/api): ");
  console.log(capture(["secret", "put", "TMDB_KEY"], key + "\n"));
}
if (!secrets.includes("AUTH_SECRET")) {
  console.log(capture(["secret", "put", "AUTH_SECRET"], randomBytes(32).toString("base64url") + "\n"));
  console.log("AUTH_SECRET created. Keep it: changing it signs everyone out.");
}
// publishing to Stremio's community list is step 6 in the Mycelium window, once you've tried it
console.log("\nDone. The new version is live. You can close this window.\n");
