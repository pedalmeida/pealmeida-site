/* ===============================================================
   AM Benchmark — public viewer
   Vanilla JS + Fuse.js. Hash-router. Read-only dossier browser.
   =============================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  data: null,
  fuseAds: null,
  filters: {
    competitor: "",
    country: "",
    hook: "",
    temperature: "",
    active: "",
    evergreen: false,
    q: "",
  },
  sort: { field: "duration_days", dir: "desc" },
};

// ---- Boot ----
async function boot() {
  try {
    const res = await fetch("data.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    state.data = await res.json();
    indexAds();
    setMeta();
    window.addEventListener("hashchange", render);
    render();
  } catch (e) {
    $("#app").innerHTML = `<div class="loading">Failed to load data: ${e.message}</div>`;
    console.error(e);
  }
}

function indexAds() {
  state.fuseAds = new Fuse(state.data.ads, {
    keys: [
      { name: "headline", weight: 3 },
      { name: "body", weight: 1 },
      { name: "hashtags", weight: 1 },
      { name: "advertiser_page", weight: 2 },
      { name: "library_id", weight: 2 },
    ],
    threshold: 0.35,
    minMatchCharLength: 3,
    includeScore: false,
  });
}

function setMeta() {
  const d = new Date(state.data.generated_at);
  $("#meta-date").textContent = d.toISOString().slice(0, 10) + " " + d.toISOString().slice(11, 16) + " UTC";
  $("#meta-counts").textContent =
    `${state.data.counts.competitors} competitors · ${state.data.counts.ads} ads`;
}

// ---- Router ----
function render() {
  const hash = window.location.hash || "#/";
  const route = hash.replace(/^#\/?/, "").split("?")[0];

  $$(".nav a").forEach((a) => a.classList.toggle("active",
    (route === "" && a.dataset.route === "grid") ||
    (route === "ads" && a.dataset.route === "ads") ||
    (route === "patterns" && a.dataset.route === "patterns")
  ));

  if (route === "" || route === "grid") return renderGrid();
  if (route === "ads") return renderAdsTable(null);
  if (route === "patterns") return renderPatterns();
  if (route.startsWith("c/")) return renderDossier(route.slice(2));

  $("#app").innerHTML = `<div class="loading">Page not found.</div>`;
}

// ---- Competitor grid (landing) ----
function renderGrid() {
  const html = `
    <h2 style="margin:0 0 16px 0; font-size:18px; font-weight:600;">All competitors</h2>
    <div class="competitor-grid">
      ${state.data.competitors.map(competitorCard).join("")}
    </div>
  `;
  $("#app").innerHTML = html;
  $$(".competitor-card").forEach((el) => {
    el.addEventListener("click", () => {
      window.location.hash = `#/c/${el.dataset.id}`;
    });
  });
}

function competitorCard(c) {
  const s = c.stats || { total: 0, active: 0, evergreen: 0, longest_run_days: 0 };
  const archetype = c.archetype ? `<span class="badge archetype">${c.archetype}</span>` : "";
  const country = c.hq_country ? `<span class="badge country">${c.hq_country}</span>` : "";
  const strategy = c.ad_strategy ? `<span class="badge strategy-${c.ad_strategy}">${c.ad_strategy}</span>` : "";
  const evergreen = s.evergreen > 0 ? `<span class="badge evergreen">${s.evergreen} evergreen</span>` : "";

  return `
    <div class="competitor-card" data-id="${c.id}">
      <h3>${escapeHtml(c.name)}</h3>
      <div class="badges">${country}${archetype}${strategy}${evergreen}</div>
      <p class="one-liner">${escapeHtml(c.one_line_summary || "")}</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-num">${s.total}</span>
          <span class="stat-label">Total ads</span>
        </div>
        <div class="stat">
          <span class="stat-num">${s.active}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat">
          <span class="stat-num">${s.longest_run_days || "—"}${s.longest_run_days ? "d" : ""}</span>
          <span class="stat-label">Longest run</span>
        </div>
      </div>
    </div>
  `;
}

// ---- Ads table (global or scoped to one competitor) ----
function renderAdsTable(competitorId) {
  state.filters.competitor = competitorId || state.filters.competitor;
  const html = `
    ${competitorId ? "" : `<h2 style="margin:0 0 16px 0; font-size:18px;">All ads</h2>`}
    <div id="filter-bar"></div>
    <div id="ads-results"></div>
  `;
  $("#app").innerHTML = html;
  renderFilterBar({ scoped: !!competitorId });
  renderAdsResults();
}

function renderFilterBar({ scoped }) {
  const f = state.filters;
  const competitorOptions = scoped ? "" :
    state.data.competitors.map((c) => `<option value="${c.id}" ${f.competitor === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("");

  const countryOptions = Array.from(new Set(state.data.ads.map((a) => a.country)))
    .filter(Boolean)
    .sort()
    .map((c) => `<option value="${c}" ${f.country === c ? "selected" : ""}>${c}</option>`).join("");

  const hookOptions = Array.from(new Set(state.data.ads.map((a) => a.hook_angle)))
    .filter(Boolean)
    .sort()
    .map((h) => `<option value="${h}" ${f.hook === h ? "selected" : ""}>${h}</option>`).join("");

  const tempOptions = ["cold", "warm", "hot", "believer"]
    .map((t) => `<option value="${t}" ${f.temperature === t ? "selected" : ""}>${t}</option>`).join("");

  $("#filter-bar").outerHTML = `
    <div class="filter-bar" id="filter-bar">
      <input type="search" id="q" placeholder="Search headline, body, library ID…" value="${escapeHtml(f.q)}" />
      ${scoped ? "" : `<select id="f-competitor"><option value="">All competitors</option>${competitorOptions}</select>`}
      <select id="f-country"><option value="">All countries</option>${countryOptions}</select>
      <select id="f-hook"><option value="">All hooks</option>${hookOptions}</select>
      <select id="f-temp"><option value="">All temps</option>${tempOptions}</select>
      <select id="f-active">
        <option value="" ${f.active === "" ? "selected" : ""}>Any status</option>
        <option value="true" ${f.active === "true" ? "selected" : ""}>Active</option>
        <option value="false" ${f.active === "false" ? "selected" : ""}>Inactive</option>
      </select>
      <button id="f-evergreen" class="${f.evergreen ? "active" : ""}">Evergreen only</button>
      <span class="filter-count" id="filter-count"></span>
    </div>
  `;

  $("#q").addEventListener("input", (e) => { state.filters.q = e.target.value; renderAdsResults(); });
  if (!scoped) $("#f-competitor").addEventListener("change", (e) => { state.filters.competitor = e.target.value; renderAdsResults(); });
  $("#f-country").addEventListener("change", (e) => { state.filters.country = e.target.value; renderAdsResults(); });
  $("#f-hook").addEventListener("change", (e) => { state.filters.hook = e.target.value; renderAdsResults(); });
  $("#f-temp").addEventListener("change", (e) => { state.filters.temperature = e.target.value; renderAdsResults(); });
  $("#f-active").addEventListener("change", (e) => { state.filters.active = e.target.value; renderAdsResults(); });
  $("#f-evergreen").addEventListener("click", () => { state.filters.evergreen = !state.filters.evergreen; renderAdsResults(); });
}

function filterAds() {
  const f = state.filters;
  let ads = state.data.ads;

  if (f.q && f.q.length >= 3) {
    ads = state.fuseAds.search(f.q).map((r) => r.item);
  }
  if (f.competitor) ads = ads.filter((a) => a.competitor_id === f.competitor);
  if (f.country) ads = ads.filter((a) => a.country === f.country);
  if (f.hook) ads = ads.filter((a) => a.hook_angle === f.hook);
  if (f.temperature) ads = ads.filter((a) => a.traffic_temperature === f.temperature);
  if (f.active !== "") ads = ads.filter((a) => String(!!a.is_active) === f.active);
  if (f.evergreen) ads = ads.filter((a) => a.is_evergreen_winner);

  ads = ads.slice().sort((a, b) => {
    const dir = state.sort.dir === "asc" ? 1 : -1;
    const va = a[state.sort.field];
    const vb = b[state.sort.field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string") return dir * va.localeCompare(vb);
    return dir * (va - vb);
  });

  return ads;
}

function renderAdsResults() {
  const ads = filterAds();
  $("#filter-count").textContent = `${ads.length} ad${ads.length === 1 ? "" : "s"}`;

  if (ads.length === 0) {
    if ($("#ads-results")) $("#ads-results").innerHTML = `<div class="loading">No ads match these filters.</div>`;
    return;
  }

  const competitorMap = new Map(state.data.competitors.map((c) => [c.id, c.name]));

  const rows = ads.map((a) => {
    const dur = a.duration_days != null ? `${a.duration_days}d` : "—";
    const dates = `${a.started_at || "?"} → ${a.ended_at || (a.is_active ? "active" : "?")}`;
    const hookBadge = a.hook_angle ? `<span class="badge hook ${a.hook_angle}">${a.hook_angle}</span>` : "";
    const tempBadge = a.traffic_temperature ? `<span class="badge hook">${a.traffic_temperature}</span>` : "";
    const evergreen = a.is_evergreen_winner ? `<span class="badge evergreen">★ evergreen</span>` : "";
    const statusDot = `<span class="status-dot ${a.is_active ? "active" : "inactive"}"></span>`;
    const variants = a.creative_variants > 1 ? ` <span class="muted">(${a.creative_variants}×)</span>` : "";
    const competitorName = competitorMap.get(a.competitor_id) || a.competitor_id;
    const libraryLink = a.ad_library_url ?
      `<a href="${a.ad_library_url}" target="_blank" rel="noopener" class="col-library-id">${a.library_id}</a>` :
      `<span class="col-library-id">${a.library_id}</span>`;

    return `
      <tr>
        <td class="col-duration">${dur}${variants}</td>
        <td>${statusDot}<a href="#/c/${a.competitor_id}">${escapeHtml(competitorName)}</a></td>
        <td>${hookBadge}${tempBadge}${evergreen}</td>
        <td class="col-headline">
          <div class="headline">${escapeHtml(a.headline || "")}</div>
          <div class="body-preview">${escapeHtml((a.body || "").slice(0, 240))}</div>
        </td>
        <td class="col-dates">${dates}</td>
        <td>${libraryLink}</td>
        <td class="col-cta">${a.cta ? `<span class="badge">${escapeHtml(a.cta)}</span>` : ""}</td>
      </tr>
    `;
  }).join("");

  $("#ads-results").innerHTML = `
    <table class="ads-table">
      <thead>
        <tr>
          <th data-sort="duration_days" class="${state.sort.field === "duration_days" ? "sorted " + state.sort.dir : ""}">Run</th>
          <th data-sort="competitor_id" class="${state.sort.field === "competitor_id" ? "sorted " + state.sort.dir : ""}">Competitor</th>
          <th>Hook</th>
          <th data-sort="headline">Headline + body</th>
          <th data-sort="started_at" class="${state.sort.field === "started_at" ? "sorted " + state.sort.dir : ""}">Dates</th>
          <th>Library ID</th>
          <th>CTA</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  $$(".ads-table th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (state.sort.field === field) {
        state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      } else {
        state.sort.field = field;
        state.sort.dir = "desc";
      }
      renderAdsResults();
    });
  });
}

// ---- Competitor dossier ----
function renderDossier(id) {
  const c = state.data.competitors.find((x) => x.id === id);
  if (!c) {
    $("#app").innerHTML = `<a href="#/" class="back-link">All competitors</a><div class="loading">Competitor not found.</div>`;
    return;
  }

  const s = c.stats || {};
  const ads = state.data.ads.filter((a) => a.competitor_id === id);

  // Pre-filter the ads view to this competitor only
  state.filters.competitor = id;

  const ladder = Array.isArray(c.value_ladder) ? c.value_ladder : [];

  $("#app").innerHTML = `
    <a href="#/" class="back-link">All competitors</a>
    <div class="dossier-header">
      <h1>${escapeHtml(c.name)}</h1>
      <div class="badges">
        ${c.hq_country ? `<span class="badge country">${c.hq_country}${c.hq_city ? " · " + escapeHtml(c.hq_city) : ""}</span>` : ""}
        ${c.archetype ? `<span class="badge archetype">${c.archetype}</span>` : ""}
        ${c.ad_strategy ? `<span class="badge strategy-${c.ad_strategy}">${c.ad_strategy}</span>` : ""}
        ${s.evergreen ? `<span class="badge evergreen">${s.evergreen} evergreen winners</span>` : ""}
      </div>
      <p class="summary">${escapeHtml(c.one_line_summary || "")}</p>
      <div class="dossier-meta">
        ${metaItem("Founder", c.founder, c.founder_alive === true ? " (living)" : c.founder_alive === false ? " (deceased)" : "")}
        ${metaItem("Attractive Character", c.attractive_character_name || "—")}
        ${metaItem("Org type", c.org_type)}
        ${metaItem("Size", c.org_size_estimate)}
        ${metaItem("Voice", c.voice_descriptor)}
        ${metaItem("Audience", c.audience_target)}
        ${metaItem("Funnel archetype", c.funnel_archetype)}
        ${c.primary_site_url ? `<div class="dossier-meta-item"><span class="label">Website</span><span class="value"><a href="${c.primary_site_url}" target="_blank" rel="noopener">${shortUrl(c.primary_site_url)}</a></span></div>` : ""}
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="overview">Overview</button>
      <button class="tab" data-tab="ads">Ads <span class="count">${ads.length}</span></button>
      <button class="tab" data-tab="ladder">Value ladder <span class="count">${ladder.length}</span></button>
    </div>

    <div id="tab-content"></div>
  `;

  function showTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    if (name === "overview") renderOverview(c, s);
    else if (name === "ads") renderScopedAds(id);
    else if (name === "ladder") renderLadder(ladder);
  }

  $$(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  showTab("overview");
}

function metaItem(label, value, suffix = "") {
  if (!value) return "";
  return `<div class="dossier-meta-item"><span class="label">${label}</span><span class="value">${escapeHtml(String(value))}${suffix}</span></div>`;
}

function shortUrl(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

function renderOverview(c, s) {
  const hookEntries = Object.entries(s.hook_counts || {}).sort((a, b) => b[1] - a[1]);
  const tempEntries = Object.entries(s.temperature_counts || {}).sort((a, b) => b[1] - a[1]);
  const maxHook = Math.max(1, ...hookEntries.map((e) => e[1]));
  const maxTemp = Math.max(1, ...tempEntries.map((e) => e[1]));

  $("#tab-content").innerHTML = `
    <div class="patterns-grid">
      <div class="pattern-card">
        <h3>Hook angles used</h3>
        ${hookEntries.map(([k, v]) => `
          <div class="pattern-bar">
            <span class="label">${k}</span>
            <div class="bar"><div class="bar-fill" style="width:${(v / maxHook) * 100}%"></div></div>
            <span class="count">${v}</span>
          </div>
        `).join("")}
        ${hookEntries.length === 0 ? '<p class="muted" style="margin:0;">No paid ads — this org doesn\'t run Meta advertising.</p>' : ""}
      </div>
      <div class="pattern-card">
        <h3>Traffic temperatures</h3>
        ${tempEntries.map(([k, v]) => `
          <div class="pattern-bar">
            <span class="label">${k}</span>
            <div class="bar"><div class="bar-fill" style="width:${(v / maxTemp) * 100}%"></div></div>
            <span class="count">${v}</span>
          </div>
        `).join("")}
        ${tempEntries.length === 0 ? '<p class="muted" style="margin:0;">—</p>' : ""}
      </div>
      <div class="pattern-card">
        <h3>Activity snapshot</h3>
        <div class="dossier-meta" style="border-top:none; padding-top:0;">
          ${metaItem("Total ads", String(s.total))}
          ${metaItem("Currently active", String(s.active))}
          ${metaItem("Evergreen (≥100d)", String(s.evergreen))}
          ${metaItem("Longest run", s.longest_run_days ? `${s.longest_run_days} days` : "—")}
        </div>
      </div>
      ${c.positioning_notes ? `
      <div class="pattern-card">
        <h3>Positioning notes</h3>
        <p style="margin:0; font-size:13px; color:var(--text-muted);">${escapeHtml(c.positioning_notes)}</p>
      </div>` : ""}
    </div>
  `;
}

function renderScopedAds(competitorId) {
  $("#tab-content").innerHTML = `<div id="filter-bar"></div><div id="ads-results"></div>`;
  renderFilterBar({ scoped: true });
  renderAdsResults();
}

function renderLadder(ladder) {
  if (!ladder || ladder.length === 0) {
    $("#tab-content").innerHTML = `<p class="muted">No value ladder captured yet for this org.</p>`;
    return;
  }
  $("#tab-content").innerHTML = `
    <div class="ladder">
      ${ladder.map((r) => `
        <div class="ladder-rung">
          <span class="rung-num">${r.rung}</span>
          <span class="rung-offer">${escapeHtml(r.offer || "")}${r.type ? ` <span class="muted">(${escapeHtml(r.type)})</span>` : ""}</span>
          <span class="rung-price">${escapeHtml(r.price || "")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ---- Patterns view ----
function renderPatterns() {
  const p = state.data.patterns;
  const competitorMap = new Map(state.data.competitors.map((c) => [c.id, c.name]));

  const hooksMax = Math.max(1, ...p.hooks_global.map((h) => h.count));
  const stratMax = Math.max(1, ...p.strategies_count.map((s) => s.count));

  $("#app").innerHTML = `
    <h2 style="margin:0 0 16px 0; font-size:18px;">Cross-competitor patterns</h2>
    <div class="patterns-grid">
      <div class="pattern-card">
        <h3>Top 20 evergreen winners (≥100 days)</h3>
        ${p.evergreen_winners_top_20.length === 0 ? '<p class="muted" style="margin:0;">None.</p>' : ""}
        ${p.evergreen_winners_top_20.map((w) => `
          <div class="evergreen-row">
            <span class="days">${w.duration_days}d</span>
            <span class="competitor"><a href="#/c/${w.competitor_id}">${escapeHtml((competitorMap.get(w.competitor_id) || w.competitor_id).slice(0, 16))}</a></span>
            <span class="headline-preview" title="${escapeHtml(w.headline)}">${escapeHtml(w.headline)}</span>
          </div>
        `).join("")}
      </div>
      <div class="pattern-card">
        <h3>Hook-angle distribution (all competitors)</h3>
        ${p.hooks_global.map((h) => `
          <div class="pattern-bar">
            <span class="label">${h.angle}</span>
            <div class="bar"><div class="bar-fill" style="width:${(h.count / hooksMax) * 100}%"></div></div>
            <span class="count">${h.count}</span>
          </div>
        `).join("")}
      </div>
      <div class="pattern-card">
        <h3>Ad strategies in use</h3>
        ${p.strategies_count.map((s) => `
          <div class="pattern-bar">
            <span class="label">${s.strategy}</span>
            <div class="bar"><div class="bar-fill" style="width:${(s.count / stratMax) * 100}%"></div></div>
            <span class="count">${s.count}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ---- Utils ----
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

boot();
