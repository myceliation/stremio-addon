/**
 * Content script — IMDB, Letterboxd, Wikipedia.
 *
 * IMDB:       Reads fully-rendered DOM (bypasses WAF entirely).
 * Letterboxd: Returns URL — server fetches all pages via RSS feed.
 * Wikipedia:  Reads article titles directly from the rendered DOM.
 *             No Wikipedia API needed — the browser already loaded the page.
 */

function extractData() {
  const hostname = window.location.hostname;
  const href     = window.location.href;

  // ── IMDB ──────────────────────────────────────────────────────────────────
  if (hostname.includes("imdb.com")) {
    const seen = new Set();
    const ids  = [];

    // Method 1: data-tconst attribute (older list pages)
    document.querySelectorAll("[data-tconst]").forEach(el => {
      const id = el.dataset.tconst;
      if (/^tt\d{7,}$/.test(id) && !seen.has(id)) { seen.add(id); ids.push(id); }
    });

    // Method 2: /title/tt links in main content area
    if (!ids.length) {
      const main = document.querySelector(
        ".lister-list, .lister, main, #main, #content, .ipc-page-content-container"
      ) || document.body;
      main.querySelectorAll("a[href*='/title/tt']").forEach(a => {
        const m = a.href.match(/\/title\/(tt\d{7,})\//);
        if (m && !seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); }
      });
    }

    // Method 3: scan page HTML for embedded JSON (modern React IMDB, 2023+)
    if (!ids.length) {
      const html = document.documentElement.innerHTML;
      const patterns = [
        /"(?:tconst|imdbId)"\s*:\s*"(tt\d{7,})"/g,
        /"id"\s*:\s*"(tt\d{7,})"/g,
        /\/title\/(tt\d{7,})\//g,
      ];
      for (const pat of patterns) {
        for (const m of html.matchAll(pat)) {
          if (!seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); }
        }
        if (ids.length) break;
      }
    }

    return {
      source:   "imdb",
      type:     "imdb_ids",
      data:     ids,
      page_url: href,
    };
  }

  // ── Letterboxd ────────────────────────────────────────────────────────────
  // Server fetches ALL pages via RSS — just pass the URL so it can do that.
  if (hostname.includes("letterboxd.com")) {
    const seen = new Set();
    let domCount = 0;
    document.querySelectorAll("[data-film-slug]").forEach(el => {
      const s = el.dataset.filmSlug;
      if (s && !seen.has(s)) { seen.add(s); domCount++; }
    });

    return {
      source:    "letterboxd",
      type:      "url_only",
      use_url:   true,
      page_url:  href,
      dom_count: domCount,
      data:      [],
    };
  }

  // ── Wikipedia ─────────────────────────────────────────────────────────────
  // The browser already rendered the full page — just read the article links.
  // We send the title list to the companion which TMDB-searches each one.
  // No Wikipedia API calls needed at all.
  if (hostname.includes("wikipedia.org")) {
    const isCategory = /\/wiki\/Category:/i.test(href);

    // For category pages, member links are in #mw-pages.
    // For list pages, film links are scattered through #mw-content-text.
    const scope = isCategory
      ? (document.getElementById("mw-pages") || document.getElementById("mw-content-text") || document.body)
      : (document.getElementById("mw-content-text") || document.body);

    const seen   = new Set();
    const titles = [];

    scope.querySelectorAll("a[href^='/wiki/']").forEach(a => {
      // Decode and strip the /wiki/ prefix
      let raw;
      try { raw = decodeURIComponent(a.pathname.slice(6)); }
      catch { return; }

      // Skip namespace pages (Category:, File:, Help:, Talk:, etc.)
      if (raw.includes(":")) return;
      // Skip utility pages
      if (!raw || raw === "Main_Page") return;
      // Skip edit/history anchors
      if (a.href.includes("action=")) return;

      const title = raw.replace(/_/g, " ").trim();
      if (title.length < 2) return;
      if (!seen.has(title)) { seen.add(title); titles.push(title); }
    });

    return {
      source:         "wikipedia",
      type:           "article_titles",
      use_url:        false,
      page_url:       href,
      is_category:    isCategory,
      article_titles: titles,
      data:           [],
    };
  }

  return { source: "unknown", type: "unknown", data: [] };
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extract") {
    sendResponse(extractData());
  }
});
