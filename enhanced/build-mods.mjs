// Builds the other two packagings from mycelium.plugin.js:
//   webmods/mycelium/      -> Stremio Community v5 (portable_config/webmods/)
//   mycelium.user.js       -> userscript for web.stremio.com (Violentmonkey / Tampermonkey)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const here = fileURLToPath(new URL(".", import.meta.url));
const src = readFileSync(here + "mycelium.plugin.js", "utf8");
const version = (src.match(/@version\s+([\d.]+)/) || [])[1] || "0.0.0";
const body = src.replace(/^\/\*\*[\s\S]*?\*\/\s*/, "");

mkdirSync(here + "webmods/mycelium", { recursive: true });
writeFileSync(here + "webmods/mycelium/mycelium.js", `/* Mycelium ${version}: Stremio Community v5 WebMod. Built from mycelium.plugin.js. */\n` + body);
mkdirSync(here + "webmods/mycelium-night", { recursive: true });
writeFileSync(here + "webmods/mycelium-night/mycelium-night.css", readFileSync(here + "mycelium-night.theme.css", "utf8"));
mkdirSync(here + "webmods/mycelium-compact", { recursive: true });
writeFileSync(here + "webmods/mycelium-compact/compact.css", readFileSync(here + "compact.theme.css", "utf8"));

writeFileSync(here + "mycelium.user.js", `// ==UserScript==
// @name         Mycelium for Stremio
// @namespace    https://github.com/myceliation/stremio-addon
// @version      ${version}
// @description  Shelf and list buttons, genre mixer and local watch history on web.stremio.com
// @match        https://web.stremio.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/myceliation/stremio-addon/main/enhanced/mycelium.user.js
// ==/UserScript==
` + body);
console.log("built webmods/ and mycelium.user.js for", version);
