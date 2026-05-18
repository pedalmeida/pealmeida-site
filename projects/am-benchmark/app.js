/* ===============================================================
   AM Benchmark — public viewer
   Vanilla JS + Fuse.js. Hash-router. Read-only dossier browser.
   =============================================================== */

// ---- Tooltip dictionaries ----
const HOOK_TOOLTIPS = {
  "direct": "Direct response hook: states the offer or benefit immediately. No storytelling or teasing — just 'come to X on date Y'. Works when the audience is already warm or when the event itself is the hook. Used by 67% of ads in this sample, making it the dominant but least differentiated approach.",
  "religious-curiosity": "Insider hook: uses devotional language (darshan, mantra, Krishna) as the primary draw. Assumes the reader already has spiritual context. Targets warm-to-believer traffic who self-select in. Risky for cold audiences but highly efficient for retention and community ads.",
  "emotional": "Emotion-first hook: opens with a feeling state (loneliness, stress, seeking, transformation) before naming the org or offer. Classic cold-traffic approach — meets the prospect where they are mentally. Works well as a first touch for audiences who wouldn't click on a brand name.",
  "curiosity": "Curiosity gap hook: raises a question or incomplete thought that the audience wants resolved. 'Have you ever wondered...' or a provocative statement. Broad appeal — works across cold and warm. Often used as a bridge to a quiz or landing page opt-in.",
  "authority-quote": "Social proof via teacher quote: uses a direct quote from the lineage founder or living master as the hook. Targets believers who respect that authority. High trust signal, but pre-supposes the reader already knows and trusts the source — best for warm/believer traffic.",
  "identity": "Identity hook: leads with the org's full name and mission statement ('We are the X centre…'). Targets hot traffic who is already researching. Kadampa's 263-day evergreen winner uses this — it works because it speaks to people comparing options, not to strangers.",
  "tourism": "Tourism/place hook: uses location imagery or retreat setting as the primary draw ('Escape to the mountains', 'Retreat in the Alentejo'). Converts wellness tourists who are searching for experiences, not beliefs. Low theology, high aspiration.",
  "quiz": "Quiz/segmentation hook: invites the prospect to answer a few questions to find their personalised path. Art of Living's signature play. Most sophisticated cold-traffic hook — generates qualified leads and gives the org first-party data for follow-up sequences.",
};

const TEMP_TOOLTIPS = {
  "cold": "Cold traffic: people who have never heard of this org. Ads in this tier use pain/aspiration hooks, minimal jargon, and typically point to a low-friction free offer (quiz, free class, free event). Requires the most creative spend to convert.",
  "warm": "Warm traffic: people who have engaged before (website visit, social follow, past event). Ads in this tier can use brand name and specific offer names. Conversion rates are higher; CPL is lower. Often used for retargeting.",
  "hot": "Hot traffic: people who have attended before or are actively comparing options. Can go straight to the offer, use identity language, and assume familiarity. Kadampa's identity ads ('We are the Kadampa…') target this tier — people who already know the centre.",
  "believer": "Believer traffic: existing community members and devotees. Ads in this tier use insider vocabulary (darshan, mantra, satsang), quote the teacher, and promote community events. Not for acquisition — for retention and reactivation of lapsed members.",
};

const STRATEGY_TOOLTIPS = {
  "always-on": "Always-on: runs a small set of evergreen ads continuously, 365 days a year. Optimises for CPL over time. Kadampa's approach — they've held the same identity ad live for 263+ days. Requires good creative testing up front, minimal maintenance after.",
  "event-funnel": "Event funnel: builds a full paid-ad campaign around a single major event (annual darshan, festival, retreat). Ad spend spikes before the event, drops after. Bhakti Marga's model. High ROI if the event is sellable; risky if the event doesn't happen.",
  "event-pulse": "Event pulse: short bursts of ad activity for each individual event or visiting speaker. No consistent presence — just spikes. Brahma Kumaris' pattern. Cost-efficient but no brand-building compound effect; audience never learns to expect a consistent presence.",
  "multi-brand": "Multi-brand: runs separate ads under multiple sub-brands (Isha Europe, Isha Life, Save Soil, Sadhguru) to access different audience segments without cannibalising the main brand. Isha Foundation's architecture. Requires significant content and budget.",
  "course-finder": "Course finder: uses a quiz or segmentation tool as the front-end lead magnet to route prospects into the right program. Art of Living's approach. Generates first-party data and personalises the funnel. Highest upfront complexity; best long-term CPL.",
  "decentralized": "Decentralised: different centres and chapters run their own ads independently with no global coordination. Sivananda's pattern — Bahamas Ashram runs most of the global ad spend. No brand consistency; no compounding. AM currently has a similar problem.",
  "none": "No paid acquisition: this org relies entirely on organic reach, word of mouth, and search. ISKCON Lisboa's situation. Zero Meta advertising history. Either a deliberate choice or a capability gap — either way, leaves acquisition entirely to chance.",
};

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
  const stratTip = STRATEGY_TOOLTIPS[c.ad_strategy] || "";
  const strategy = c.ad_strategy ? `<span class="badge strategy-${c.ad_strategy}" data-tooltip="${escapeAttr(stratTip)}">${c.ad_strategy}</span>` : "";
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
    const endLabel = a.ended_at ? fmtDate(a.ended_at) : (a.is_active ? "active" : "?");
    const dates = `${fmtDate(a.started_at)} → ${endLabel}`;
    const hookTip = HOOK_TOOLTIPS[a.hook_angle] || "";
    const hookBadge = a.hook_angle ? `<span class="badge hook ${a.hook_angle}" data-tooltip="${escapeAttr(hookTip)}">${a.hook_angle}</span>` : "";
    const tempTip = TEMP_TOOLTIPS[a.traffic_temperature] || "";
    const tempBadge = a.traffic_temperature ? `<span class="badge hook" data-tooltip="${escapeAttr(tempTip)}">${a.traffic_temperature}</span>` : "";
    const adCat = inferAdCategory(a);
    const adCatBadge = adCat ? `<span class="badge ad-cat">${adCat}</span>` : "";
    const evergreen = a.is_evergreen_winner ? `<span class="badge evergreen">★ evergreen</span>` : "";
    const statusDot = `<span class="status-dot ${a.is_active ? "active" : "inactive"}"></span>`;
    const variants = a.creative_variants > 1 ? ` <span class="muted">(${a.creative_variants}×)</span>` : "";
    const competitorName = competitorMap.get(a.competitor_id) || a.competitor_id;
    const libraryLink = a.ad_library_url ?
      `<a href="${a.ad_library_url}" target="_blank" rel="noopener" class="col-library-id">${a.library_id}</a>` :
      `<span class="col-library-id">${a.library_id}</span>`;

    // Thumbnail cell. asset_path may be null for the one ad with no CDN URL.
    // Open the full ad on the Meta Ad Library when clicked.
    const thumbCell = a.asset_path
      ? `<a href="${a.ad_library_url || '#'}" target="_blank" rel="noopener" title="Open in Meta Ad Library">
           <img src="${a.asset_path}" alt="" class="ad-thumb ${a.asset_type === 'creative-thumb' ? 'is-fallback' : ''}" loading="lazy" />
         </a>`
      : `<div class="ad-thumb no-asset" title="No image captured"></div>`;

    return `
      <tr>
        <td class="col-thumb">${thumbCell}</td>
        <td class="col-duration">${dur}${variants}</td>
        <td>${statusDot}<a href="#/c/${a.competitor_id}">${escapeHtml(competitorName)}</a></td>
        <td>${hookBadge}${tempBadge}${adCatBadge}${evergreen}</td>
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
          <th></th>
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
        ${c.ad_strategy ? `<span class="badge strategy-${c.ad_strategy}" data-tooltip="${escapeAttr(STRATEGY_TOOLTIPS[c.ad_strategy] || "")}">${c.ad_strategy}</span>` : ""}
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
            <span class="label" data-tooltip="${escapeAttr(HOOK_TOOLTIPS[k] || "")}">${k}</span>
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
            <span class="label" data-tooltip="${escapeAttr(TEMP_TOOLTIPS[k] || "")}">${k}</span>
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
    <p style="font-size:12px; color:var(--text-muted); margin:0 0 16px 0;">
      Brunson's Value Ladder maps an org's offers from lowest-commitment (free) to highest-commitment (advanced programs, residency, ordination).
      Each rung exists to ascend the prospect toward the next. Click any rung title to visit the offer page.
    </p>
    <div class="ladder">
      ${ladder.map((r) => {
        const offerHtml = r.url
          ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" style="font-weight:500;">${escapeHtml(r.offer || "")}</a>`
          : `<span style="font-weight:500;">${escapeHtml(r.offer || "")}</span>`;
        const typeHtml = r.type ? ` <span class="muted" style="font-size:11px;">(${escapeHtml(r.type)})</span>` : "";
        const descHtml = r.description ? `<div class="rung-desc">${escapeHtml(r.description)}</div>` : "";
        return `
        <div class="ladder-rung">
          <span class="rung-num">${r.rung}</span>
          <span class="rung-offer">${offerHtml}${typeHtml}${descHtml}</span>
          <span class="rung-price">${escapeHtml(r.price || "")}</span>
        </div>`;
      }).join("")}
    </div>
  `;
}

// ---- Patterns view ----
function renderPatterns() {
  const p = state.data.patterns;
  const competitorMap = new Map(state.data.competitors.map((c) => [c.id, c.name]));
  const cs = state.data.competitors;

  const hooksMax = Math.max(1, ...p.hooks_global.map((h) => h.count));
  const stratMax = Math.max(1, ...p.strategies_count.map((s) => s.count));

  // ---- Marketing intelligence: derived from competitor fields ----

  // 1. Paid intro program: does the org have a paid (non-free) offer as their first paid rung?
  function hasPaidIntro(c) {
    const ladder = Array.isArray(c.value_ladder) ? c.value_ladder : [];
    const paidRungs = ladder.filter((r) => r.price && !r.price.toLowerCase().includes("free") && !r.price.toLowerCase().includes("donation"));
    if (!paidRungs.length) return false;
    const firstPaid = paidRungs[0];
    return firstPaid.type && (firstPaid.type.includes("intro") || firstPaid.type.includes("flagship"));
  }

  // 2. Email capture: inferred from having a continuity-type rung or newsletter
  function hasEmailCapture(c) {
    const ladder = Array.isArray(c.value_ladder) ? c.value_ladder : [];
    return ladder.some((r) =>
      r.type && (r.type.includes("continuity") || r.type.includes("content")) ||
      (r.offer || "").toLowerCase().includes("newsletter")
    );
  }

  // 3. Secular front door: non-religious entry point
  function hasSecularFraming(c) {
    return ["secular-mystical", "warm-secular", "calm-secular-friendly"].includes(c.voice_descriptor || "");
  }

  // 4. Living attractive character
  function hasLivingCharacter(c) {
    return c.attractive_character_alive === true;
  }

  // 5. Evergreen ads (runs continuously for >60 days)
  function evergreenCount(c) {
    return (c.stats && c.stats.evergreen) || 0;
  }

  // 6. Funnel archetype
  function funnelLabel(c) {
    return c.funnel_archetype || "—";
  }

  const intelRows = cs
    .filter((c) => c.id !== "iskcon-international-diaspora") // exclude diaspora branch from strategic table
    .map((c) => ({
      id: c.id,
      name: (competitorMap.get(c.id) || c.id).replace("Centro de Meditação Kadampa Deuachen", "Kadampa").replace("Brahma Kumaris Portugal", "BK Portugal").replace("The Art of Living Foundation", "Art of Living"),
      paidIntro: hasPaidIntro(c),
      email: hasEmailCapture(c),
      secular: hasSecularFraming(c),
      livingChar: hasLivingCharacter(c),
      evergreen: evergreenCount(c),
      funnel: funnelLabel(c),
      adStrategy: c.ad_strategy || "—",
    }));

  function dot(val) {
    if (val === true) return `<span class="intel-dot yes" title="Yes"></span>`;
    if (val === false) return `<span class="intel-dot no" title="No"></span>`;
    return `<span class="intel-dot partial" title="Partial"></span>`;
  }

  const intelTableRows = intelRows.map((r) => `
    <tr>
      <td class="org"><a href="#/c/${r.id}">${escapeHtml(r.name)}</a></td>
      <td style="text-align:center">${dot(r.paidIntro)}</td>
      <td style="text-align:center">${dot(r.email)}</td>
      <td style="text-align:center">${dot(r.secular)}</td>
      <td style="text-align:center">${dot(r.livingChar)}</td>
      <td style="text-align:center; font-family:var(--mono); font-size:11px;">${r.evergreen || "—"}</td>
      <td><span class="badge strategy-${r.adStrategy}" data-tooltip="${escapeAttr(STRATEGY_TOOLTIPS[r.adStrategy] || "")}" style="font-size:10px;">${r.adStrategy}</span></td>
    </tr>
  `).join("");

  // ---- Brunson opportunity gaps ----
  const gaps = [];
  const hasAlwaysOn = cs.some((c) => c.ad_strategy === "always-on");
  const hasCourseFinderQuiz = cs.some((c) => c.ad_strategy === "course-finder");
  const hasPaidIntroAnyone = cs.some(hasPaidIntro);
  const hasEmailSeq = cs.some(hasEmailCapture);
  const hasEvergreenWinner = cs.some((c) => (c.stats && c.stats.evergreen > 0));

  gaps.push({ label: "Evergreen winner gap", text: hasEvergreenWinner
    ? `Kadampa holds the sample's strongest evergreen (263 days, identity hook). AM should test an identity hook using the 'Ananda Marga in Portugal' frame — same audience logic applies.`
    : `No competitor in the sample has cracked an evergreen winner. First mover advantage available.`
  });
  gaps.push({ label: "Course-finder quiz", text: hasCourseFinderQuiz
    ? `Art of Living is the only org using a quiz lead magnet ('Find your practice'). This is the most sophisticated cold-traffic play in the sample. AM's diverse programs (meditation, yoga, social service) are a natural fit for a segmentation quiz.`
    : `No one is using a quiz funnel — blue ocean for AM.`
  });
  gaps.push({ label: "Paid intro program", text: hasPaidIntroAnyone
    ? `Isha Foundation ($175 Inner Engineering Online) and Art of Living (~$395 SKY Breath) are the only orgs with a paid front-end program. This is the lever that funds their entire ad machine. AM has no equivalent — the whole ladder is free-or-donation today.`
    : `No competitor has a paid intro program — opportunity for AM to pioneer one.`
  });
  gaps.push({ label: "Tourism / secular pre-frame", text: "Only 4 ads (Kadampa) use the tourism hook explicitly. Broader opportunity: AM's retreat properties and community centres are underused as wellness-tourism destinations in Portugal's growing market."});
  gaps.push({ label: "Bhakti Marga analog risk", text: "Bhakti Marga has the most structurally similar model to AM: living Master, PT ashram, global organisation, event-funnel architecture. They are running 22-ad PT Meta campaigns and growing. AM's biggest competitive threat in Portugal — and the clearest model to study."});
  gaps.push({ label: "Dream 100 / organic distribution gap", text: "No competitor in the sample is systematically working yoga studios, wellness influencers, or retreat booking platforms as distribution partners. This is the Dream 100 play — work your way in to where AM's buyers already congregate before buying ads."});

  $("#app").innerHTML = `
    <h2 style="margin:0 0 4px 0; font-size:18px;">Cross-competitor patterns</h2>
    <p style="margin:0 0 20px 0; font-size:12px; color:var(--text-muted);">Hook angles, traffic temperatures, and strategies are classified using Russell Brunson's Hook/Story/Offer framework and traffic temperature ladder (cold → warm → hot → believer). Hover any label for the methodology definition.</p>

    <div class="patterns-grid">
      <div class="pattern-card">
        <h3>Top 20 evergreen winners (≥100 days)</h3>
        <p style="margin:0 0 12px 0; font-size:11px; color:var(--text-muted);">Ads running continuously for 100+ days signal proven messaging that survived market testing. Longer = more confident the org is in the copy.</p>
        ${p.evergreen_winners_top_20.length === 0 ? '<p class="muted" style="margin:0;">None.</p>' : ""}
        ${p.evergreen_winners_top_20.map((w) => `
          <div class="evergreen-row">
            <span class="days">${w.duration_days}d</span>
            <span class="competitor"><a href="#/c/${w.competitor_id}">${escapeHtml((competitorMap.get(w.competitor_id) || w.competitor_id).replace("Centro de Meditação Kadampa Deuachen", "Kadampa").slice(0, 18))}</a></span>
            <span class="headline-preview" title="${escapeHtml(w.headline)}">${escapeHtml(w.headline)}</span>
          </div>
        `).join("")}
      </div>

      <div class="pattern-card">
        <h3>Hook-angle distribution (all competitors)</h3>
        <p style="margin:0 0 12px 0; font-size:11px; color:var(--text-muted);">Hook = the first thing the audience sees. Hover each label for the definition and strategic implications. Direct dominates (67%) — meaning most orgs are speaking to warm audiences who already know them.</p>
        ${p.hooks_global.map((h) => `
          <div class="pattern-bar">
            <span class="label" data-tooltip="${escapeAttr(HOOK_TOOLTIPS[h.angle] || "")}">${h.angle}</span>
            <div class="bar"><div class="bar-fill" style="width:${(h.count / hooksMax) * 100}%"></div></div>
            <span class="count">${h.count}</span>
          </div>
        `).join("")}
      </div>

      <div class="pattern-card">
        <h3>Ad strategies in use</h3>
        <p style="margin:0 0 12px 0; font-size:11px; color:var(--text-muted);">Strategy = the overall architecture of how an org uses paid ads over time. Hover each label for what it means and who uses it. Only 1 org (Kadampa) has an always-on strategy.</p>
        ${p.strategies_count.map((s) => `
          <div class="pattern-bar">
            <span class="label" data-tooltip="${escapeAttr(STRATEGY_TOOLTIPS[s.strategy] || "")}">${s.strategy}</span>
            <div class="bar"><div class="bar-fill" style="width:${(s.count / stratMax) * 100}%"></div></div>
            <span class="count">${s.count}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <h2 style="margin:28px 0 4px 0; font-size:18px;">Marketing intelligence</h2>
    <p style="margin:0 0 16px 0; font-size:12px; color:var(--text-muted);">Structured comparison of acquisition infrastructure across all orgs. Derived from value ladders, ad strategy, voice descriptor, and ad data using Brunson's Linchpin model and Hormozi's Value Equation.</p>

    <div class="intel-grid">
      <div class="intel-card" style="grid-column: 1 / -1;">
        <h3>Acquisition infrastructure comparison</h3>
        <p class="card-intro">Green = yes, grey = no, orange = partial. 'Paid intro' = first paid offer is a low-ticket intro program. 'Email capture' = has a newsletter or free lead magnet with email. 'Secular framing' = non-religious front door for cold traffic. 'Living character' = org's brand is built around a living teacher.</p>
        <table class="intel-table">
          <thead>
            <tr>
              <th>Org</th>
              <th style="text-align:center">Paid intro</th>
              <th style="text-align:center">Email capture</th>
              <th style="text-align:center">Secular framing</th>
              <th style="text-align:center">Living character</th>
              <th style="text-align:center">Evergreen ads</th>
              <th>Ad strategy</th>
            </tr>
          </thead>
          <tbody>
            ${intelTableRows}
          </tbody>
        </table>
      </div>

      <div class="intel-card">
        <h3>Strategic gaps and opportunities for AM</h3>
        <p class="card-intro">Based on what's working across this competitor sample, filtered through Brunson's Linchpin model (continuity-first) and Hormozi's Dream 100 distribution logic.</p>
        <ul class="insight-list">
          ${gaps.map((g) => `
            <li>
              <span class="insight-label">${escapeHtml(g.label)}</span>
              ${escapeHtml(g.text)}
            </li>
          `).join("")}
        </ul>
      </div>

      <div class="intel-card">
        <h3>Traffic temperature analysis</h3>
        <p class="card-intro">Brunson's traffic ladder: cold (never heard of you) → warm (engaged before) → hot (comparing options) → believer (already in community). Most orgs in this sample are advertising almost exclusively to warm/believer. AM needs a cold-traffic machine first.</p>
        <ul class="insight-list">
          <li><span class="insight-label">Dominant temperature</span>Direct + religious-curiosity hooks = 83 of 126 ads (66%) are targeting warm/believer traffic. Almost no one is investing in cold acquisition.</li>
          <li><span class="insight-label">Cold traffic opportunity</span>Emotional and quiz hooks (27 ads, 21%) are the only real cold-traffic plays in the sample. Both convert strangers by leading with pain/aspiration, not brand or theology.</li>
          <li><span class="insight-label">Kadampa's model</span>Their 263-day winner uses an identity hook (hot traffic), but their tourism + curiosity ads do run cold. The genius is using cold ads to warm the audience, then identity ads to close them.</li>
          <li><span class="insight-label">AM implication</span>AM has no cold traffic infrastructure. The first ad to write should be emotional or curiosity-hook, pointing to a free event or free meditation, not a branded mission statement.</li>
        </ul>
      </div>
    </div>
  `;
}

// ---- Utils ----
// Format an ISO date (or ISO timestamp from Postgres DATE casting) as
// "15 Jun 2025". Returns "?" on bad input. Day-Month-Year because we
// have mixed PT + EN sources and PT users expect DMY.
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d) {
  if (!d) return "?";
  // Strip any time portion — DATE columns come back as ISO timestamps
  // from @neondatabase/serverless, but the source value is just a date.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return String(d);
  const year = m[1];
  const month = MONTHS[parseInt(m[2], 10) - 1];
  const day = parseInt(m[3], 10);
  return `${day} ${month} ${year}`;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Infer what the ad is actually promoting from CTA + body + landing URL keywords.
// Returns a short human-readable label ("free class", "retreat", "event", etc.)
function inferAdCategory(a) {
  const text = [a.headline, a.body, a.cta, a.landing_url].filter(Boolean).join(" ").toLowerCase();
  if (/\b(retiro|retreat|ashram|residential|viver no|stay at)\b/.test(text)) return "retreat";
  if (/\b(festival|just love fest|ratha yatra|narasimha|janmastami|navratri|diwali)\b/.test(text)) return "festival";
  if (/\b(teacher training|teacher course|instrutor|formac|tcc|ttc|formation)\b/.test(text)) return "teacher training";
  if (/\b(samyama|sanyam|advanced program|advanced course|bsp|bhava spandana)\b/.test(text)) return "advanced program";
  if (/\b(inner engineering|happiness program|sky breath|sudarshan kriya|art of living part)\b/.test(text)) return "flagship course";
  if (/\b(darshan|blessing|divine blessing|master.*available)\b/.test(text)) return "darshan event";
  if (/\b(workshop|taller|atelier|minicurso)\b/.test(text)) return "workshop";
  if (/\b(webinar|online session|livestream|live stream|aula online)\b/.test(text)) return "online session";
  if (/\b(free class|aula gratuita|meditacao gratuita|free meditation|free session|try for free|experien)\b/.test(text)) return "free class";
  if (/\b(quiz|find your|discover your path|qual.*caminho)\b/.test(text)) return "quiz / lead magnet";
  if (/\b(app|download|install|google play|app store)\b/.test(text)) return "app install";
  if (/\b(book|livro|loja|shop|merchandise|donate|donativo|donation|apoiar|give)\b/.test(text)) return "donation / merch";
  if (/\b(volunteer|seva|bhumi|work with us|join us|work.*spirit)\b/.test(text)) return "volunteer";
  if (/\b(weekly class|curso semanal|class.*week|regular.*class|drop.?in)\b/.test(text)) return "regular class";
  if (/\b(event|evento|program|programa|upcoming|conference)\b/.test(text)) return "event";
  return "";
}

boot();
