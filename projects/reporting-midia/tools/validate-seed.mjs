/** Shared seed invariants. Used by the builder and by tests. The UI must not import this to compute verdicts. */

export const PLATFORMS = ["meta", "google"];
export const VERDICTS = ["boa", "neutra", "ma"];
export const REC_KINDS = ["reforcar", "corrigir"];

export function roundCostPerResult(spend, results) {
  if (results == null || results === 0) return null;
  return Math.round((spend / results) * 100) / 100;
}

function fail(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

export function validateSeed(seed) {
  const errors = [];

  if (!seed || typeof seed !== "object") {
    return ["seed: missing or not an object"];
  }

  for (const field of ["seedVersion", "frozenAt", "notice", "period", "clients"]) {
    if (seed[field] == null || seed[field] === "") {
      fail(errors, field, "required");
    }
  }

  if (typeof seed.notice === "string") {
    const n = seed.notice.toLowerCase();
    const mentionsDemo =
      n.includes("demo") || n.includes("exemplo") || n.includes("exemplos") || n.includes("fixture");
    const mentionsLive = n.includes("refresh") || n.includes("pipeline") || n.includes("meta");
    if (!mentionsDemo || !mentionsLive) {
      fail(errors, "notice", "must say this is a demo seed until live Meta refresh");
    }
  }

  const accountId = seed.metaAccount?.accountId;
  if (accountId !== "2089804794903235") {
    fail(errors, "metaAccount.accountId", 'must be "2089804794903235"');
  }
  if (!seed.metaAccount?.currency) fail(errors, "metaAccount.currency", "required");

  const period = seed.period;
  if (period) {
    for (const field of ["label", "start", "end", "comparison"]) {
      if (!period[field]) fail(errors, `period.${field}`, "required");
    }
  }

  if (!Array.isArray(seed.clients) || seed.clients.length < 1) {
    fail(errors, "clients", "need at least one client");
    return errors;
  }

  const ids = new Set();
  for (const [i, client] of seed.clients.entries()) {
    validateClient(client, `clients[${i}]`, errors, ids);
  }

  if (!ids.has("pedro")) {
    fail(errors, "clients", 'first-wave client id "pedro" is required');
  }

  return errors;
}

function validateClient(client, path, errors, ids) {
  if (!client?.id) fail(errors, `${path}.id`, "required");
  else if (ids.has(client.id)) fail(errors, `${path}.id`, `duplicate id "${client.id}"`);
  else ids.add(client.id);

  for (const field of ["name", "descriptor"]) {
    if (!client?.[field]) fail(errors, `${path}.${field}`, "required");
  }

  if (typeof client.isPilot !== "boolean") {
    fail(errors, `${path}.isPilot`, "must be boolean");
  }
  if (typeof client.needsAttention !== "boolean") {
    fail(errors, `${path}.needsAttention`, "must be boolean");
  }
  if (client.needsAttention && !client.attentionReason) {
    fail(errors, `${path}.attentionReason`, "required when needsAttention is true");
  }

  const target = client.targets?.costPerResult;
  const currency = client.targets?.currency;
  if (typeof target !== "number") {
    fail(errors, `${path}.targets.costPerResult`, "number required");
  }
  if (!currency) fail(errors, `${path}.targets.currency`, "required");

  if (!Array.isArray(client.sources) || client.sources.length < 1) {
    fail(errors, `${path}.sources`, "need at least one platform");
  } else {
    for (const src of client.sources) {
      if (!PLATFORMS.includes(src)) {
        fail(errors, `${path}.sources`, `invalid platform "${src}"`);
      }
    }
  }

  if (!Array.isArray(client.kpisBySource) || client.kpisBySource.length < 1) {
    fail(errors, `${path}.kpisBySource`, "need per-platform KPIs (never a cross-sum)");
  } else {
    const seen = new Set();
    for (const [k, kpi] of client.kpisBySource.entries()) {
      validateKpi(kpi, `${path}.kpisBySource[${k}]`, errors, seen);
    }
  }

  const campaignIds = new Set();
  if (!Array.isArray(client.campaigns) || client.campaigns.length < 1) {
    fail(errors, `${path}.campaigns`, "need at least one campaign");
  } else {
    for (const [c, campaign] of client.campaigns.entries()) {
      validateCampaign(campaign, `${path}.campaigns[${c}]`, errors, campaignIds);
    }
  }

  if (!Array.isArray(client.alerts)) {
    fail(errors, `${path}.alerts`, "must be an array");
  } else {
    for (const [a, alert] of client.alerts.entries()) {
      validateAlert(alert, `${path}.alerts[${a}]`, errors, campaignIds);
    }
  }

  if (client.id === "pedro") {
    if (client.name !== "Pedro Almeida") {
      fail(errors, `${path}.name`, 'must be "Pedro Almeida"');
    }
    if (!/lead gen/i.test(client.descriptor) || !/pedroalmeida\.ai/i.test(client.descriptor)) {
      fail(errors, `${path}.descriptor`, 'must be "Lead gen — pedroalmeida.ai" (or equivalent)');
    }
    if (client.isPilot !== true) {
      fail(errors, `${path}.isPilot`, "Pedro is the Phase 1 pilot");
    }
    if (JSON.stringify(client.sources) !== JSON.stringify(["meta"])) {
      fail(errors, `${path}.sources`, "Phase 1 is Meta-only");
    }
    if (client.targets?.costPerResult !== 15 || client.targets?.currency !== "EUR") {
      fail(errors, `${path}.targets`, "Phase 1 target is 15 EUR per lead");
    }
    if (client.campaigns?.length !== 3) {
      fail(errors, `${path}.campaigns`, "Phase 1 compact pilot is exactly 3 campaigns (boa / neutra / ma)");
    }
    const mix = new Set(client.campaigns?.map((c) => c.verdict));
    if (!mix.has("boa") || !mix.has("neutra") || !mix.has("ma")) {
      fail(errors, `${path}.campaigns`, "need one boa, one neutra, one ma");
    }
    if (client.campaigns?.some((c) => c.platform !== "meta")) {
      fail(errors, `${path}.campaigns`, "Phase 1 campaigns must all be Meta");
    }
  }
}

function validateKpi(kpi, path, errors, seen) {
  if (!PLATFORMS.includes(kpi?.platform)) {
    fail(errors, `${path}.platform`, `invalid "${kpi?.platform}"`);
  } else if (seen.has(kpi.platform)) {
    fail(errors, `${path}.platform`, `duplicate platform "${kpi.platform}"`);
  } else {
    seen.add(kpi.platform);
  }

  assertNumber(kpi?.spend, `${path}.spend`, errors);
  assertNumber(kpi?.results, `${path}.results`, errors);
  if (!kpi?.resultLabel) fail(errors, `${path}.resultLabel`, "required");
  assertNumber(kpi?.deltaPct, `${path}.deltaPct`, errors, true);

  const expected = roundCostPerResult(kpi.spend, kpi.results);
  if (kpi.costPerResult !== expected) {
    fail(
      errors,
      `${path}.costPerResult`,
      `expected ${expected} (spend/results, 2 decimals), got ${kpi.costPerResult}`,
    );
  }
}

function validateCampaign(campaign, path, errors, campaignIds) {
  if (!campaign?.id) fail(errors, `${path}.id`, "required");
  else if (campaignIds.has(campaign.id)) fail(errors, `${path}.id`, `duplicate "${campaign.id}"`);
  else campaignIds.add(campaign.id);

  if (typeof campaign.name !== "string" || campaign.name.trim().length < 3) {
    fail(errors, `${path}.name`, "literal campaign name required");
  }
  if (!PLATFORMS.includes(campaign.platform)) {
    fail(errors, `${path}.platform`, `invalid "${campaign.platform}"`);
  }

  assertNumber(campaign.spend, `${path}.spend`, errors);
  assertNumber(campaign.result, `${path}.result`, errors);
  if (!campaign.resultLabel) fail(errors, `${path}.resultLabel`, "required");
  assertNumber(campaign.deltaPct, `${path}.deltaPct`, errors, true);

  const expected = roundCostPerResult(campaign.spend, campaign.result);
  if (campaign.costPerResult !== expected) {
    fail(
      errors,
      `${path}.costPerResult`,
      `expected ${expected} (spend/result, 2 decimals), got ${campaign.costPerResult}`,
    );
  }

  if (!VERDICTS.includes(campaign.verdict)) {
    fail(errors, `${path}.verdict`, `must be one of ${VERDICTS.join(" | ")} (input, not computed)`);
  }
  if (typeof campaign.reason !== "string" || campaign.reason.trim().length < 8) {
    fail(errors, `${path}.reason`, "short written reason is required (input)");
  }

  const rec = campaign.recommendation;
  if (rec != null) {
    if (!REC_KINDS.includes(rec.kind)) {
      fail(errors, `${path}.recommendation.kind`, `must be ${REC_KINDS.join(" | ")}`);
    }
    if (!rec.suggestedAction) fail(errors, `${path}.recommendation.suggestedAction`, "required");
    if (!rec.evidence) fail(errors, `${path}.recommendation.evidence`, "required");
  }
}

function validateAlert(alert, path, errors, campaignIds) {
  if (!alert?.id) fail(errors, `${path}.id`, "required");
  if (!alert?.campaignId) fail(errors, `${path}.campaignId`, "required");
  else if (!campaignIds.has(alert.campaignId)) {
    fail(errors, `${path}.campaignId`, `unknown campaign "${alert.campaignId}"`);
  }
  if (!alert.condition) fail(errors, `${path}.condition`, "required");
  if (!alert.channel) fail(errors, `${path}.channel`, "required");
  if (!alert.status) fail(errors, `${path}.status`, "required");
  if (!alert.createdAt) fail(errors, `${path}.createdAt`, "required");
}

function assertNumber(value, path, errors, allowNegative = false) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(errors, path, "number required");
    return;
  }
  if (!allowNegative && value < 0) fail(errors, path, "must be ≥ 0");
}
