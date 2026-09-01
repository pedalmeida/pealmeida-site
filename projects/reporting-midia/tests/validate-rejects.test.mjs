import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSeed } from "../tools/validate-seed.mjs";

describe("validateSeed rejects broken inputs", () => {
  it("rejects a wrong precomputed costPerResult", () => {
    const errors = validateSeed({
      seedVersion: "x",
      frozenAt: "2026-09-01T00:00:00.000Z",
      notice: "exemplos até o pipeline Meta → seed estar activo",
      period: { label: "a", start: "2026-08-25", end: "2026-08-31", comparison: "b" },
      clients: [
        {
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
              costPerResult: 9.99,
              deltaPct: 0,
            },
          ],
          campaigns: [
            {
              id: "c1",
              name: "Lead gen — Fake name here",
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
              name: "Lead gen — Segunda campanha",
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
              name: "Lead gen — Terceira campanha",
              platform: "meta",
              spend: 50,
              result: 5,
              resultLabel: "leads",
              costPerResult: 10,
              deltaPct: 2,
              verdict: "neutra",
              reason: "Ainda a estabilizar o conjunto de anúncios.",
              recommendation: null,
            },
            {
              id: "c4",
              name: "Lead gen — Quarta campanha",
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
        },
      ],
    });
    assert.ok(errors.some((e) => e.includes("costPerResult")));
  });
});
