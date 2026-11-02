# Mycelium for Stremio

Mycelium is everything the offline Stremio suite did, now as a hosted Stremio add-on, with
**no sign-in**:

- **📚 Library, ✔ Watched, shelves and your own named lists**, each shown as a Stremio row.
  In Discover every list gets separate dropdowns that combine: **Genre**, **And** (a second
  genre), **Year** (single years or decades), **Language**, **Show** (not watched yet,
  watched, loved or liked, loved, liked) and **Sort by** (recently/oldest added,
  newest/oldest releases, TMDB rating, A–Z, Z–A, shuffle of the day).
  A 17,000-title Library sorted and filtered is worked out once per change and cached, so
  paging through it stays fast and inside the free tier. Each row is also searchable from
  Stremio's search.
- **The list scraper:** paste a whole page (Ctrl+A, Ctrl+C on a Letterboxd, IMDb, TMDB or
  Wikipedia list, or any text with titles), give a link, or upload an IMDb or Letterboxd
  CSV. Mycelium finds every title and shows matches with a confidence score. You pick what
  to keep, and it goes into the list you chose: Library, Watched, any shelf, an existing
  list or a new one. Star ratings in CSVs aren't used (Mycelium follows Stremio's Like and Love).
  - **Letterboxd:** lists, watchlists, /films/ and diary pages, every page of them
  - **TMDB:** lists, collections, keywords, people and companies
  - **Wikipedia:** list articles (it also follows "List of … : A, B, C" index pages) and
    categories (two levels of subcategories). It resolves through Wikidata, so only real
    films and series get in.
  - **IMDb:** paste the page or use its CSV. IMDb blocks server requests to list pages.
- **Stremio's Like and Love** fill Liked and Loved, and what you finish in Stremio joins Watched,
  once your Stremio account is connected. Marking something in Mycelium is copied back to Stremio.
- **A share page** of what you loved, liked and watched, which friends can also install as rows.
- **Watch History** (`/history`): an optional separate add-on with just your Watched rows. Stremio
  now shows what you've watched by itself, so it's off unless you turn it on under Rows.
- **A "🍄 Mycelium" entry on every title**: add to Library, mark watched, shelve, put on any
  list. It works on PC, phone and TV.
- **Discover add-ons** (installed by the Mycelium window's step 3, or the settings page's Update
  button): microgenres by family, Library by microgenre, wars from every side, and every streaming
  service and TV channel. Phones and TVs only show Discover's "Genre" dropdown, so in these add-ons
  that dropdown holds the microgenre (or service, or side); on PC the ordinary genre is under "And".
- **Streaming services for any region:** the service list comes live from TMDB (JustWatch
  data) for whichever of ~140 regions you pick, with Select all. Each service row has a
  dropdown to switch between your regions and defaults to one where that service exists.
- **From inside Stremio:** a 🍄 Mycelium row with Import, Settings and Lists tiles and one tile
  per microgenre family. Paste any list link into Stremio's search and an "Import this list" tile appears.
- **Microgenres everywhere:** every title page in Stremio, from any add-on, lists the microgenres
  it belongs to as tappable links (Mycelium serves the page from Cinemeta's details plus that row; a
  settings checkbox turns it off). Saved lists get a **Microgenre** dropdown built from the microgenres
  most common in your own titles. Includes black comedy, transgressive, nihilist, New French Extremity,
  World War II and other wars, plus hand-picked **Bottle films** and **Bad endings** lists.
- **🔎 All films / All series** (Discover only): an accurate replacement for Discover's
  Popular / New / year dropdowns. Genre + And, Year, Language, Country of origin and Sort by
  (popular, newest, oldest, top rated, most voted, box office, hidden gems), straight from
  TMDB, with shorts and music videos left out. The streaming-service, Popular, Hidden gems
  and microgenre rows have the same dropdowns.
- **Update Mycelium in Stremio / put it first:** Stremio keeps an add-on's manifest from
  install time and lists add-ons in install order. A button on the settings page refreshes
  Mycelium and Watch History in your account and can move them to the top, on every device.
- **Discovery rows:** Popular this week, Only in cinemas,
  New on digital, Hidden gems, 533 microgenres (60 of them drawn from the author's own 17,000-title library: claymation, video nasties, canuxploitation, jidaigeki, tokusatsu, pre-Code, psychotronic…), your own described genres, a genre mixer in
  search, and Films by director / with actor.
- **Optional Stremio connection:** a Watch history row, auto-merging finished titles into
  Watched, and copying any list into Stremio's own Library (Watched ones arrive marked
  watched).

No torrents and no streams, so it's safe to host publicly and to list in Stremio's
Community catalog.

## Moving over from the offline suite

1. Deploy (below) and press **Create my Mycelium** on the setup page. Install it, then
   **Copy link**.
2. On the PC with the offline suite: `python migrate_to_mycelium.py "<that link>" --dry-run`
   shows what will move. Run it again without `--dry-run`. It moves:
   - the offline watchlist → Library
   - "Mark watched" / Blacklist and finished history, plus everything you finished in the
     Stremio app → Watched
   - Not Interested → Ignore
   - tags and named lists → shelves or named lists
   - ratings → ratings

   It reuses the offline metadata, so nothing is looked up again. It's resumable, and fits
   in one day of Cloudflare's free allowance.

## Deploy (once)

1. Make a free account at <https://dash.cloudflare.com/sign-up>.
2. Double-click **`deploy.bat`**. It installs wrangler, opens Cloudflare sign-in in your
   browser, creates the D1 database and its tables, deploys, and stores two secrets: your
   TMDB key (read from `../.env`) and a random `AUTH_SECRET`.
3. Paste the workers.dev address it prints. It gives you the setup page and offers to publish
   the add-on to Stremio's Community catalog.

Re-running `deploy.bat` redeploys the current code. To deploy on every git push instead, use
Cloudflare dashboard → Workers → mycelium → Settings → Build → connect the GitHub repo, with
root directory `worker`. Secrets persist across deploys.

## Inside the official Stremio app (desktop)

Stremio's add-on system can't add buttons or tabs. The official Windows app does have a
built-in `--webui-url` option for loading a different web interface, though.
`/ui/` on your Mycelium serves Stremio's own current web app, straight from
web.stremio.com, with the Mycelium plugin added. **`Stremio with Mycelium.bat`** (in the
project folder) starts the official app pointed at it, and you get:

- a 🕓 **History** tab in the side bar: what Stremio saved on that device plus your Watched
  list, with one button to copy Stremio's finished titles into Watched
- Library / Watched / shelf / list buttons on every title, from any add-on
- Movies ⇄ Series in Discover keeps your place in Mycelium's add-ons (only in this interface:
  the official apps reset it; the fix is offered to Stremio as a pull request)
- the 🧪 multi-genre mixer in Discover

Videos don't play in this interface; use normal Stremio to watch. Nothing in Stremio is
modified, and opening Stremio normally gives you the plain app again.
An add-on can't switch this on by itself (add-ons are only web addresses Stremio asks for
rows), but **`Make Mycelium the default.bat`** points every Stremio shortcut (desktop,
Start menu, taskbar) and stremio:// links at it; `Undo Mycelium default.bat` reverses it.
After a Stremio update the updater opens the plain app once; later launches use Mycelium again.
Phones and TVs can't load a custom interface, so there you use the add-ons' rows and the
"🍄 Mycelium" / "🕓 Watch History" entries in each title's stream list.

## Listing in Stremio's Community catalog

Run **`publish.bat`** after deploying. It submits Mycelium and Watch History through the
same call Stremio's add-on SDK uses (`api.strem.io/api/addonPublish`). It's free.

## Cost

Nothing. Cloudflare's free Workers plan needs no payment method and never bills: past the
daily limits, requests just fail until the next day.

## Free-tier limits

- **Workers:** 100,000 requests a day.
- **D1 (the database):** 5 million row reads and 100,000 row writes a day, and 5 GB. The
  full migration of a 17,000-title library uses about 56,000 writes, once.
- **Every request** counts its fetches, cache calls and database queries, and stays under the
  free plan's 50-per-request limit. TMDB-to-IMDb lookups are stored in D1, so rows get
  cheaper the more they're used. Scraping runs in small steps driven by the import page. A 500-film Letterboxd list takes about a minute and a
  half; a 5,000-link Wikipedia list about three minutes.

## Privacy and security

- **There are no accounts.** "Create my Mycelium" makes a random 256-bit install token. Stremio
  syncs installed add-ons, link included, to every device on the same Stremio account, so your
  shelves follow you without Mycelium ever seeing your Stremio login.
- Treat the install link like a password: whoever has it can edit your shelves. It can't
  touch your Stremio account. The share link is a separate read-only ID.
- **History on a computer** comes from the Stremio Enhanced / Community v5 / userscript plugin,
  which reads Stremio's local storage on that machine and sends nothing anywhere.
- **History rows on phone/TV are opt-in.** Connecting uses Stremio's own code login
  (link.stremio.com), which creates a *separate* Stremio session. That session key is stored
  AES-GCM-encrypted (key = the `AUTH_SECRET` Worker secret). It's used to read your library and
  Like / Love, and to copy back what you mark watched, liked or loved in Mycelium. It also puts new versions of
  Mycelium's add-ons into your Stremio account (Stremio keeps the copy it installed); turn that off in Rows. It's deleted
  when you press Disconnect. The code login itself runs in your browser or in the Mycelium window,
  because Stremio's code service doesn't answer Cloudflare's servers. Signing that session out in Stremio also revokes it.
  Email and password are never asked for.
- Account creation is rate-limited per IP. "Delete my Mycelium data" wipes everything for that
  install.

## Listing it in Stremio

The last step of `deploy.bat` can publish the add-on to Stremio's official **Community
Add-ons** catalog, through the same endpoint the official add-on SDK uses
(`api.strem.io/api/addonPublish`). It appears there with a **Configure** button that opens
`/configure`. You can also publish later by re-running `deploy.bat`.

## Develop

```
npm install
npx wrangler d1 migrations apply mycelium --local
npx wrangler dev        # local workerd + local D1; secrets go in .dev.vars (TMDB_KEY, AUTH_SECRET, DEV_NO_RATELIMIT=1)
```

Microgenres live in `src/microgenres.js` (TMDB discover params; keyword ids were resolved
against TMDB and every entry returns at least 18 titles).

Film data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
Not affiliated with Stremio.
