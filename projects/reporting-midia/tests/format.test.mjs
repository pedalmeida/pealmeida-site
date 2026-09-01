import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFiniteNumber, money } from "../src/lib/format.js";

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
});
