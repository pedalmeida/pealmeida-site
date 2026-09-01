import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSeed } from "../tools/validate-seed.mjs";

function baseClient(overrides = {}) {
  return {
    id: "pedro",
    name: "Pedro Almeida",
    descriptor: "Lead gen — pedroalmeida.ai",
    isPilot: true,
    needsAttention: false,
    attentionReason: "",
    targets: { costPerResult: 15, currency: "EUR" },
    sources: ["meta"],
    kpisBySource: [
      {
        platform: "meta",
        spend: 100,
        results: 10,
        resultLabel: "leads",
        costPerResult: 10,
        deltaPct: 0,
      },
    ],
    campaigns: [
      {
        id: "c1",
        name: "Lead gen — Uma",
        platform: "meta",
        spend: 100,
        result: 10,
        resultLabel: "leads",
        costPerResult: 10,
        deltaPct: -1,
        verdict: "boa",
        reason: "Razão escrita curta o suficiente.",
        recommendation: null,
      },
      {
        id: "c2",
        name: "Lead gen — Duas",
        platform: "meta",
        spend: 80,
        result: 8,
        resultLabel: "leads",
        costPerResult: 10,
        deltaPct: 0,
        verdict: "neutra",
        reason: "Neutra por volume baixo esta semana.",
        recommendation: null,
      },
      {
        id: "c3",
        name: "Lead gen — Três",
        platform: "meta",
        spend: 40,
        result: 2,
        resultLabel: "leads",
        costPerResult: 20,
        deltaPct: 10,
        verdict: "ma",
        reason: "CPL acima do alvo com pouco volume de leads.",
        recommendation: null,
      },
    ],
    alerts: [],
    ...overrides,
  };
}

describe("validateSeed rejects broken inputs", () => {
  it("rejects a wrong precomputed costPerResult", () => {
    const errors = validateSeed({
      seedVersion: "x",
      frozenAt: "2026-09-01T00:00:00.000Z",
      notice: "exemplos até o pipeline Meta → seed estar activo",
      metaAccount: { accountId: "2089804794903235", currency: "EUR", timezone: "Europe/Lisbon" },
      period: { label: "a", start: "2026-08-02", end: "2026-08-31", comparison: "b" },
      clients: [
        baseClient({
          kpisBySource: [
            {
              platform: "meta",
              spend: 100,
              results: 10,
              resultLabel: "leads",
              costPerResult: 9.99,
              deltaPct: 0,
            },
          ],
        }),
      ],
    });
    assert.ok(errors.some((e) => e.includes("costPerResult")));
  });

  it("rejects an unknown campaign status when the extra is present", () => {
    const client = baseClient();
    client.campaigns[0] = { ...client.campaigns[0], status: "ENABLED" };
    const errors = validateSeed({
      seedVersion: "x",
      frozenAt: "2026-09-01T00:00:00.000Z",
      notice: "exemplos até o pipeline Meta → seed estar activo",
      metaAccount: { accountId: "2089804794903235", currency: "EUR", timezone: "Europe/Lisbon" },
      period: { label: "a", start: "2026-08-02", end: "2026-08-31", comparison: "b" },
      clients: [client],
    });
    assert.ok(errors.some((e) => e.includes("status")));
  });

  it("rejects a numeric costPerResult when result is 0 (must be null)", () => {
    const client = baseClient();
    client.campaigns[2] = {
      ...client.campaigns[2],
      result: 0,
      costPerResult: 0,
    };
    const errors = validateSeed({
      seedVersion: "x",
      frozenAt: "2026-09-01T00:00:00.000Z",
      notice: "exemplos até o pipeline Meta → seed estar activo",
      metaAccount: { accountId: "2089804794903235", currency: "EUR", timezone: "Europe/Lisbon" },
      period: { label: "a", start: "2026-08-02", end: "2026-08-31", comparison: "b" },
      clients: [client],
    });
    assert.ok(errors.some((e) => e.includes("must be null when result is 0")));
  });
});
