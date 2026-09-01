import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { roundCostPerResult, validateSeed } from "./validate-seed.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "seed.json");
const RESULT_LABEL = "leads";

function campaign(raw) {
  const costPerResult = roundCostPerResult(raw.spend, raw.result);
  if (costPerResult == null) {
    throw new Error(`Campaign ${raw.id}: cannot precompute costPerResult`);
  }
  return { ...raw, costPerResult };
}

function kpiFor(platform, campaigns, deltaPct) {
  const rows = campaigns.filter((c) => c.platform === platform);
  const spend = rows.reduce((s, c) => s + c.spend, 0);
  const results = rows.reduce((s, c) => s + c.result, 0);
  return {
    platform,
    spend: Math.round(spend * 100) / 100,
    results,
    resultLabel: RESULT_LABEL,
    costPerResult: roundCostPerResult(spend, results),
    deltaPct,
  };
}

const campaigns = [
  campaign({
    id: "meta-engine-auditoria",
    name: "Lead gen — Engine Auditoria grátis",
    platform: "meta",
    spend: 148.32,
    result: 12,
    resultLabel: RESULT_LABEL,
    deltaPct: -8.1,
    verdict: "boa",
    reason: "CPL abaixo do alvo de 15 EUR, com o melhor volume da conta.",
    recommendation: {
      kind: "reforcar",
      suggestedAction: "Subir o orçamento diário desta campanha e manter os criativos actuais.",
      evidence: "CPL 12,36 EUR vs alvo 15 EUR; −8,1% vs período anterior; 12 leads.",
    },
  }),
  campaign({
    id: "meta-watch-agencies",
    name: "Lead gen — Watch Agencies reporting",
    platform: "meta",
    spend: 112.02,
    result: 6,
    resultLabel: RESULT_LABEL,
    deltaPct: 6.4,
    verdict: "neutra",
    reason: "CPL acima do midpoint mas ainda dentro de uma leitura aceitável; volume baixo.",
    recommendation: null,
  }),
  campaign({
    id: "meta-terapeutas-coaches",
    name: "Lead gen — Terapeutas + coaches",
    platform: "meta",
    spend: 132.66,
    result: 8,
    resultLabel: RESULT_LABEL,
    deltaPct: 22,
    verdict: "ma",
    reason: "Custo por lead a subir depressa; esta campanha puxa o CPL da conta.",
    recommendation: {
      kind: "corrigir",
      suggestedAction: "Cortar o orçamento e rever o conjunto de anúncios com pior CPL.",
      evidence: "CPL 16,58 EUR; +22% vs período anterior; 132,66 EUR de spend.",
    },
  }),
];

const seed = {
  seedVersion: "0.1.0-pedro-pilot",
  frozenAt: "2026-09-01T12:00:00.000Z",
  notice:
    "Seed de demo até existir refresh live da conta Meta. Números de fixture — não são dados em tempo real.",
  metaAccount: {
    accountId: "2089804794903235",
    currency: "EUR",
    timezone: "Europe/Lisbon",
  },
  period: {
    label: "2–31 ago 2026",
    start: "2026-08-02",
    end: "2026-08-31",
    comparison: "3 jul – 1 ago 2026",
  },
  clients: [
    {
      id: "pedro",
      name: "Pedro Almeida",
      descriptor: "Lead gen — pedroalmeida.ai",
      isPilot: true,
      needsAttention: true,
      attentionReason:
        "Terapeutas + coaches está +22% no CPL e é a campanha a corrigir nesta janela.",
      targets: { costPerResult: 15, currency: "EUR" },
      sources: ["meta"],
      kpisBySource: [kpiFor("meta", campaigns, 4.2)],
      campaigns,
      alerts: [
        {
          id: "alert-terapeutas-delta",
          campaignId: "meta-terapeutas-coaches",
          condition: "CPL +22% vs período anterior",
          channel: "telegram",
          status: "aberto",
          createdAt: "2026-08-31T09:00:00.000Z",
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
