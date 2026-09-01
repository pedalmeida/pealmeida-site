import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(jsx?|tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("UI never recalculates contract inputs", () => {
  it("src does not compute costPerResult from spend/result", () => {
    const files = walk(SRC);
    assert.ok(files.length > 0, "expected src files");
    const hits = [];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      const patterns = [
        /spend\s*\/\s*result/i,
        /roundCostPerResult\s*\(/,
        /costPerResult\s*=\s*[^;]*spend/,
      ];
      for (const re of patterns) {
        if (re.test(text)) hits.push(`${path.relative(ROOT, file)} matches ${re}`);
      }
    }
    assert.deepEqual(hits, []);
  });

  it("src does not derive verdict from metrics", () => {
    const files = walk(SRC);
    const hits = [];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      if (/verdict\s*=\s*["']boa["']/.test(text)) {
        hits.push(`${path.relative(ROOT, file)} assigns a verdict literal`);
      }
      if (/function\s+\w*[Vv]erdict/.test(text) && /costPerResult/.test(text)) {
        hits.push(`${path.relative(ROOT, file)} looks like a verdict calculator`);
      }
    }
    assert.deepEqual(hits, []);
  });

  it("sparkline skips non-finite costPerResult (vault IG post is null)", () => {
    const charts = fs.readFileSync(path.join(SRC, "components/HandCharts.jsx"), "utf8");
    assert.match(charts, /isFiniteNumber\(c\.costPerResult\)/);
    assert.doesNotMatch(charts, /Math\.max\(\.\.\.campaigns\.map\(\(c\) => c\.costPerResult/);
  });
});
