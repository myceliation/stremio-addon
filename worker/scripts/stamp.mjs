// Writes src/build.js: a fingerprint of every file in src/ (except build.js itself), so the site can say exactly
// which code it's running and the Mycelium window can tell when this folder has changes that aren't online yet.
// (mycelium.pyw works out the same fingerprint the same way: sha1 over "name\n" + bytes for each file, sorted by name)
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";
const h = createHash("sha1");
for (const f of readdirSync("src").filter(f => f.endsWith(".js") && f !== "build.js").sort()) {
  h.update(f + "\n"); h.update(readFileSync("src/" + f));
}
const build = h.digest("hex").slice(0, 12);
writeFileSync("src/build.js", `// made by scripts/stamp.mjs on deploy\nexport const BUILD = "${build}";\n`);
console.log("Build", build);
