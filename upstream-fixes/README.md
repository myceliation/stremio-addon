# Fixes for Stremio itself

Bugs found by reading Stremio's current source (stremio-web development branch,
stremio-shell-ng main = the Windows app 5.0.x, stremio-core), with ready patches.
Stremio is open source (GPL-2.0), so anyone can propose fixes: fork the repo on
GitHub, push a branch, open a pull request. `submit-fixes.bat` does the git part.

## Patches (ready to submit)

1. **stremio-web-1-deeplink-port-and-query.patch** (Stremio/stremio-web)
   `stremio://` add-on links lose their port and query string. The app builds the
   install address from `hostname`, which drops `:8443`-style ports, and never adds
   `?key=…`. So any add-on on a non-standard port, or whose link carries a query
   string, can't be installed by clicking. Fix: use `host` + `search`.

2. **stremio-web-2-discover-multiselect-title.patch** (Stremio/stremio-web)
   Add-ons can let a Discover dropdown take several values at once (`optionsLimit` > 1;
   stremio-core already supports it and toggles values correctly), but the dropdown
   only ever shows the first selected value, so you can't see what's applied.
   Fix: show all selected values.

3. **stremio-shell-ng-1-reclaim-stremio-links.patch** (Stremio/stremio-shell-ng)
   The Windows installer refuses to register `stremio://` if *any* handler already
   exists that it didn't write itself, including one left by Stremio 4 or one
   pointing at a deleted program. After upgrading, "Install" buttons on add-on sites
   (Torrentio's included) then silently do nothing. Fix: take over handlers that
   point at an older Stremio or at a program that no longer exists.
   (Not compiled here: Inno Setup only runs on Windows. Their CI builds it on the PR.)

`Fix Stremio install links.bat` (in the main Stremio folder) fixes #3 on your own PC now.

## Issues worth filing (no patch: bigger changes or other people's code)

- **No way to reorder add-ons.** Rows and Discover's catalog dropdown follow install
  order, so a new add-on's catalogs always land at the bottom. The order is already
  stored in the account (addonCollectionSet), and stremio-core keeps it; the app just
  has no drag-to-reorder. (Mycelium's settings page now does it through the account.)
- **Add-on dropdown values go through the translator.** Discover passes every add-on
  option label through i18next (`t.string(value)`), so an option that happens to equal
  a translation key (e.g. "SEARCH", "FILTER", "SORT") is shown as the translated word
  instead of the add-on's text. Labels from add-ons should be shown as given.
- **Cinemeta's Discover filters can't combine.** Popular and Featured have only a genre
  dropdown; New has only a year dropdown (years are stuffed into the "genre" slot).
  So "1980s horror sorted by rating" or anything by language/country isn't possible,
  and its year lists are sparse. Cinemeta's source isn't public, so this is a request,
  not a patch. Mycelium's "🔎 All films / All series" rows do this properly.
- **Switching Movies ⇄ Series in Discover throws away the other dropdowns.** Changing the
  type navigates to a fresh Discover address for that type, so the catalog and every
  extra (genre, year, sort, an add-on's own dropdowns) reset to the defaults, even when
  the same add-on has a matching catalog with the same options for the other type.
  Expected: keep the add-on, catalog id and any extras whose values exist in the new
  type's catalog. (Mycelium's hubs use the same catalog ids and option names in both
  types, e.g. `mgf.war` with the same family, so they would carry over.)

- **Phone and TV apps show only one of an add-on's dropdowns.** The desktop/web app
  shows every extra that has options (stremio-core's Discover model hands all of them
  over: `catalog_with_filters.rs`, `selectable.extra`), but the phone and TV apps appear to
  draw only the first one (usually "genre"). An add-on with a second or third dropdown
  (year, sort, country, a sub-genre) loses them there, so Discover can't be narrowed
  down. Expected: draw every selectable extra, as the desktop app does, e.g. as a row of
  chips or a "Filters" sheet. (Mycelium's hubs: family → microgenre → genre / year /
  country / sort; on phones and TVs only the microgenre picker appears.)

## How to submit

1. On GitHub, open https://github.com/Stremio/stremio-web and
   https://github.com/Stremio/stremio-shell-ng and click **Fork** on each (into myceliation).
2. Double-click `submit-fixes.bat`. It clones your forks, applies each patch on its own
   branch, pushes with your saved GitHub login, and opens the "Create pull request" page
   for each one in your browser.
3. On each page, check the text and click **Create pull request**.
