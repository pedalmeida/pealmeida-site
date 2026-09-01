import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { isFiniteNumber, money } from "../src/lib/format.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("null costPerResult never becomes NaN in the UI", () => {
  it("money() renders an em dash for null, undefined, NaN, and Infinity", () => {
    assert.equal(money(null), "—");
    assert.equal(money(undefined), "—");
    assert.equal(money(Number.NaN), "—");
    assert.equal(money(Infinity), "—");
    assert.equal(isFiniteNumber(null), false);
    assert.equal(isFiniteNumber(15.22), true);
  });

  it("money() still formats a vault CPL", () => {
    assert.match(money(15.12, "EUR"), /15,12/);
  });

  it("vault IG post is excluded from sparkline scale and formats as —", () => {
    const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "public/seed.json"), "utf8"));
    const campaigns = seed.clients[0].campaigns;
    const ig = campaigns.find((c) => c.id === "pedro-cmp-ig-claude-post");
    assert.ok(ig);
    assert.equal(ig.result, 0);
    assert.equal(ig.costPerResult, null);
    const plotted = campaigns.filter((c) => isFiniteNumber(c.costPerResult));
    assert.equal(plotted.length, campaigns.length - 1);
    assert.ok(!plotted.some((c) => c.id === ig.id));
    assert.equal(money(ig.costPerResult), "—");
    const scale = Math.max(...plotted.map((c) => c.costPerResult), seed.clients[0].targets.costPerResult, 1);
    assert.equal(Number.isFinite(scale), true);
  });
});
