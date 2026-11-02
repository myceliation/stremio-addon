# Mycelium plugin and themes

The official Stremio desktop app has no plugin loader (its interface is loaded from Stremio's
servers), so these run in the PC builds that do load mods:

- **[Stremio Enhanced](https://github.com/REVENGE977/stremio-enhanced)** loads `.plugin.js` and `.theme.css` files
- **[Stremio Community v5](https://github.com/Zaarrg/stremio-community-v5)** (5.0.20+) loads WebMods
- **web.stremio.com in any browser** runs the userscript through Violentmonkey or Tampermonkey

All three use the same code. `build-mods.mjs` turns `mycelium.plugin.js` into the WebMods and
userscript versions.

| File | What it does |
|---|---|
| `mycelium.plugin.js` / `webmods/mycelium/` / `mycelium.user.js` | Shelf buttons (Loved, Waiting, Rewatch, Dropped, Ignore, Blacklist) and buttons for your own lists under every title's action buttons. A **🧪 Mix genres** button in Discover (any combination of genres, decade, country, sort, extra words; "Save as a row" adds it to your board). A **🕓 Watch history** button in Library with Films/Series and Finished / In progress / Rewatched filters, read from Stremio's local storage on that computer. Nothing is sent anywhere, and no add-on connection is needed. |
| `mycelium-night.theme.css` | The Mycelium palette (deep ink, violet, orchid) using Stremio's own CSS variables. |
| `compact.theme.css` | Denser layout: smaller interface scale and nav bars. Stacks with any colour theme. |

## Install

First install the Mycelium add-on in Stremio from its setup page. The plugin finds it on its own.

**Stremio Enhanced:** Settings → *Open plugins folder* → drop in `mycelium.plugin.js`; *Open
themes folder* → drop in the `.theme.css` files. Press Ctrl+R, then enable them in Settings.

**Stremio Community v5:** copy the folders in `webmods/` into
`%LOCALAPPDATA%\Programs\LNV\Stremio-5\portable_config\webmods\`, then fully restart the app.

**Browser:** install Violentmonkey or Tampermonkey, open `mycelium.user.js`, and click Install.
Then use web.stremio.com.

Outside Stremio Enhanced, the plugin's toggles live in localStorage. From the DevTools console:
`localStorage.mycelium_settings = JSON.stringify({mycelium_mixer: false})`.

`@updateUrl` points at this repo, so Stremio Enhanced offers updates when the version
number goes up. To list them in its in-app Community browser, open a PR at
<https://github.com/REVENGE977/stremio-enhanced-registry>.
