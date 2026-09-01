import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { roundCostPerResult, validateSeed } from "./validate-seed.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "seed.json");
const RESULT_LABEL = "leads";

function campaign(raw) {
  return { ...raw, costPerResult: roundCostPerResult(raw.spend, raw.result) };
}

const campaigns = [
  campaign({
    id: "pedro-cmp-agencias-pmes",
    name: "LEADS OFFER - Agências + PMEs Ago 2026",
    platform: "meta",
    status: "ACTIVE",
    spend: 289.11,
    result: 19,
    resultLabel: RESULT_LABEL,
    deltaPct: 0,
    verdict: "neutra",
    reason: "CPL €15,22 no alvo com volume sólido (19 leads).",
    recommendation: null,
  }),
  campaign({
    id: "pedro-cmp-ig-claude-post",
    name: "Instagram post: O Claude sozinho é um chatbot...",
    platform: "meta",
    status: "ACTIVE",
    spend: 57.85,
    result: 0,
    resultLabel: RESULT_LABEL,
    deltaPct: 0,
    verdict: "ma",
    reason: "Spend sem leads (não é objetivo lead) — dilui o CPL da conta.",
    recommendation: {
      kind: "corrigir",
      suggestedAction: "Pausar ou tirar do orçamento de lead gen.",
      evidence: "€57,85 spend / 0 leads",
    },
  }),
  campaign({
    id: "pedro-cmp-escolas-terapeutas",
    name: "LEADS OFFER - Escolas + Terapeutas / Coaches - Ago 2026",
    platform: "meta",
    status: "PAUSED",
    spend: 46.22,
    result: 7,
    resultLabel: RESULT_LABEL,
    deltaPct: -20,
    verdict: "boa",
    reason: "CPL €6,60 excelente mas campanha em pausa.",
    recommendation: {
      kind: "reforcar",
      suggestedAction: "Reavaliar reativação com guardrails de orçamento.",
      evidence: "7 leads a €6,60 CPL lifetime",
    },
  }),
];

const accountSpend = 393.18;
const accountResults = 26;

const seed = {
  seedVersion: "0.1.1-pedro-vault-2026-08-31",
  frozenAt: "2026-08-31T23:59:00.000Z",
  notice:
    "Vault snapshot 2026-08-31. Estes números são exemplos até o pipeline Meta → seed estar activo.",
  metaAccount: {
    accountId: "2089804794903235",
    currency: "EUR",
    timezone: "Europe/Lisbon",
    attributionSetting: "7d_click_1d_view",
    apiVersion: "v21.0",
  },
  period: {
    label: "lifetime até 31 ago 2026",
    start: "2026-08-02",
    end: "2026-08-31",
    comparison: "3 jul – 1 ago 2026 (30d anteriores)",
  },
  clients: [
    {
      id: "pedro",
      name: "Pedro Almeida",
      descriptor: "Lead gen — pedroalmeida.ai",
      isPilot: true,
      needsAttention: true,
      attentionReason:
        "O post de Instagram gastou €57,85 sem leads e dilui o CPL da conta. A oferta Escolas + Terapeutas (CPL €6,60) está em pausa.",
      targets: { costPerResult: 15, currency: "EUR" },
      sources: ["meta"],
      kpisBySource: [
        {
          platform: "meta",
          spend: accountSpend,
          results: accountResults,
          resultLabel: RESULT_LABEL,
          costPerResult: roundCostPerResult(accountSpend, accountResults),
          deltaPct: -4.2,
        },
      ],
      campaigns,
      alerts: [
        {
          id: "alert-ig-claude-post",
          campaignId: "pedro-cmp-ig-claude-post",
          condition: "Spend sem leads no post Instagram",
          channel: "telegram",
          status: "aberto",
          createdAt: "2026-08-31T18:00:00.000Z",
        },
      ],
    },
  ],
};

const errors = validateSeed(seed);
if (errors.length) {
  console.error("Seed failed contract validation:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(seed, null, 2) + "\n");
console.log(`Wrote ${path.relative(ROOT, OUT)} (${seed.seedVersion}, frozen ${seed.frozenAt})`);
