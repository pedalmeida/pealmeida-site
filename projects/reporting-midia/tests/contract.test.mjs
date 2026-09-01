import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { roundCostPerResult, validateSeed } from "../tools/validate-seed.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_PATH = path.join(ROOT, "public", "seed.json");

function loadSeed() {
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
}

describe("data contract", () => {
  it("writes a seed that passes validateSeed", () => {
    const seed = loadSeed();
    const errors = validateSeed(seed);
    assert.deepEqual(errors, []);
  });

  it("never lets the UI be the source of verdicts — they arrive on the seed", () => {
    const seed = loadSeed();
    for (const client of seed.clients) {
      for (const campaign of client.campaigns) {
        assert.ok(["boa", "neutra", "ma"].includes(campaign.verdict));
        assert.equal(typeof campaign.reason, "string");
        assert.ok(campaign.reason.length > 0);
      }
    }
  });

  it("precomputes costPerResult as spend/result rounded to 2 decimals", () => {
    const seed = loadSeed();
    for (const client of seed.clients) {
      for (const campaign of client.campaigns) {
        assert.equal(
          campaign.costPerResult,
          roundCostPerResult(campaign.spend, campaign.result),
        );
      }
      for (const kpi of client.kpisBySource) {
        assert.equal(kpi.costPerResult, roundCostPerResult(kpi.spend, kpi.results));
      }
    }
  });

  it("does not expose a cross-platform total", () => {
    const seed = loadSeed();
    const banned = ["totalSpend", "totalResults", "combinedSpend", "grandTotal"];
    const json = JSON.stringify(seed);
    for (const key of banned) {
      assert.equal(json.includes(`"${key}"`), false, `banned key ${key} present`);
    }
    for (const client of seed.clients) {
      const platforms = client.kpisBySource.map((k) => k.platform);
      assert.equal(new Set(platforms).size, platforms.length);
    }
  });

  it("keeps campaign names literal", () => {
    const seed = loadSeed();
    const names = seed.clients.flatMap((c) => c.campaigns.map((x) => x.name));
    assert.ok(names.every((n) => typeof n === "string" && n.trim() === n));
    assert.ok(names.includes("Meta · Engine Auditoria grátis"));
    assert.equal(new Set(names).size, names.length);
  });

  it("seeds Pedro as Meta-only compact pilot (3–6 campaigns, 15 EUR/lead)", () => {
    const seed = loadSeed();
    const pedro = seed.clients.find((c) => c.id === "pedro");
    assert.ok(pedro);
    assert.equal(seed.seedVersion, "0.1.0-pedro-pilot");
    assert.equal(seed.frozenAt, "2026-09-01T18:00:00.000Z");
    assert.equal(pedro.name, "Pedro Almeida");
    assert.equal(pedro.descriptor, "Lead gen — pedroalmeida.ai");
    assert.equal(pedro.isPilot, true);
    assert.deepEqual(pedro.sources, ["meta"]);
    assert.equal(pedro.targets.costPerResult, 15);
    assert.equal(pedro.targets.currency, "EUR");
    assert.ok(pedro.campaigns.length >= 3 && pedro.campaigns.length <= 6);
    assert.equal(pedro.campaigns.length, 3);
    assert.deepEqual(
      pedro.campaigns.map((c) => c.id),
      ["pedro-cmp-01", "pedro-cmp-02", "pedro-cmp-03"],
    );
    assert.ok(pedro.campaigns.every((c) => c.platform === "meta"));
    const kpi = pedro.kpisBySource.find((k) => k.platform === "meta");
    assert.equal(kpi.spend, 393.18);
    assert.equal(kpi.results, 26);
    assert.equal(kpi.costPerResult, 15.12);
    assert.equal(kpi.deltaPct, -4.2);
    assert.equal(seed.metaAccount.accountId, "2089804794903235");
    assert.equal(seed.metaAccount.attributionSetting, "7d_click_1d_view");
    assert.match(seed.notice, /exemplos/i);
    assert.match(seed.notice, /pipeline Meta/i);
    assert.equal(pedro.alerts[0].campaignId, "pedro-cmp-03");
  });

  it("links alerts to existing campaign ids", () => {
    const seed = loadSeed();
    for (const client of seed.clients) {
      const ids = new Set(client.campaigns.map((c) => c.id));
      for (const alert of client.alerts) {
        assert.ok(ids.has(alert.campaignId), alert.campaignId);
      }
    }
  });

  it("treats negative deltaPct as cheaper (good) without flipping the sign", () => {
    const seed = loadSeed();
    const cheaper = seed.clients[0].campaigns.find((c) => c.deltaPct < 0);
    const pricier = seed.clients[0].campaigns.find((c) => c.deltaPct > 0);
    assert.ok(cheaper, "need at least one cheaper campaign in the seed");
    assert.ok(pricier, "need at least one pricier campaign in the seed");
    assert.ok(cheaper.deltaPct < 0);
    assert.ok(pricier.deltaPct > 0);
  });
});
