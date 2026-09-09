const COMPANION = "http://localhost:7001";
let extracted = null;

async function getProfiles() {
  try {
    const r = await fetch(`${COMPANION}/api/profiles`, { credentials: "include" });
    if (!r.ok) return [];
    return await r.json();
  } catch { return null; }
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  let result;
  try {
    result = await browser.tabs.sendMessage(tab.id, { action: "extract" });
  } catch {
    showUnsupported("Open an IMDB list, Letterboxd list, or Wikipedia article first.");
    return;
  }

  if (!result || result.source === "unknown") {
    showUnsupported("This page isn't supported. Open an IMDB list, Letterboxd list, or Wikipedia article.");
    return;
  }

  extracted = result;
  const foundMsg = document.getElementById("found-msg");

  if (result.source === "imdb") {
    const count = (result.data || []).length;
    foundMsg.innerHTML = count
      ? `Found <span class="badge">${count}</span> titles on this IMDB page.`
      : `<span class="warn">No titles found.</span> Scroll down to load all items, then try again.`;
    document.getElementById("import-btn").disabled = (count === 0);

  } else if (result.source === "letterboxd") {
    const shown = result.dom_count || 0;
    const extra = result.has_more_pages
      ? ` <span class="note">📄 Full list will be fetched automatically.</span>`
      : "";
    foundMsg.innerHTML = `<span class="badge">${shown}</span> films visible on this page.${extra}<br>
      <span class="note">The server will fetch all pages via RSS feed.</span>`;
    document.getElementById("import-btn").textContent = "Import Full List →";
    document.getElementById("import-btn").disabled = false;

  } else if (result.source === "wikipedia") {
    const count = (result.article_titles || []).length;
    const kind  = result.is_category ? "category members" : "linked articles";
    foundMsg.innerHTML = `Found <span class="badge">${count}</span> ${kind} on this page.<br>
      <span class="note">Each title will be looked up on TMDB.</span>`;
    document.getElementById("import-btn").textContent = "Import →";
    document.getElementById("import-btn").disabled = (count === 0);
  }

  // Load profiles
  const profiles = await getProfiles();
  const sel = document.getElementById("profile-select");
  sel.innerHTML = "";

  if (profiles === null) {
    sel.innerHTML = '<option value="">⚠ Cannot reach localhost:7001</option>';
    setMsg("error", "Make sure the companion is running.");
    return;
  }
  if (!profiles.length) {
    sel.innerHTML = '<option value="">No profiles — create one at localhost:7001</option>';
    document.getElementById("import-btn").disabled = true;
    return;
  }

  profiles.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

function showUnsupported(msg) {
  document.getElementById("main").style.display = "none";
  const u = document.getElementById("unsupported");
  u.style.display = "block";
  u.querySelector(".status").textContent = msg;
}

function setMsg(type, text) {
  const el = document.getElementById("msg");
  el.className = type;
  el.textContent = text;
}

function showProgress(text) {
  const p = document.getElementById("progress");
  p.style.display = "block";
  document.getElementById("progress-text").textContent = text;
}

function hideProgress() {
  document.getElementById("progress").style.display = "none";
}

async function doImport() {
  const profileId = document.getElementById("profile-select").value;
  if (!profileId) { setMsg("error", "Please select a profile."); return; }

  document.getElementById("import-btn").disabled = true;
  setMsg("", "");

  // Show appropriate progress message
  if (extracted.source === "letterboxd") {
    showProgress("Fetching full list via RSS…");
  } else if (extracted.source === "wikipedia") {
    showProgress("Fetching via Wikipedia API… (30–60 s for large lists)");
  } else {
    const count = (extracted.data || []).length;
    showProgress(`Sending ${count} titles to companion…`);
  }

  try {
    const payload = {
      profile_id:     profileId,
      source:         extracted.source,
      use_url:        extracted.use_url || false,
      page_url:       extracted.page_url || "",
      // IMDB only — DOM-extracted IDs
      data:           extracted.data || [],
      // unused now for LB/Wiki but kept for back-compat
      article_titles: [],
      candidates:     [],
      full_list:      true,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180000); // 3 min

    const r = await fetch(`${COMPANION}/api/import/from-extension`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timer);
    hideProgress();

    const result = await r.json();

    if (result.redirect) {
      // Open preview tab — popup can close immediately
      browser.tabs.create({ url: COMPANION + result.redirect });
      window.close();
    } else {
      setMsg("error", result.error || "Something went wrong.");
      document.getElementById("import-btn").disabled = false;
    }
  } catch (e) {
    hideProgress();
    if (e.name === "AbortError") {
      setMsg("error", "Timed out. Try again or use the URL import in the companion app.");
    } else {
      setMsg("error", "Could not reach companion. Is it running?");
    }
    document.getElementById("import-btn").disabled = false;
  }
}

document.getElementById("import-btn").addEventListener("click", doImport);
init();
