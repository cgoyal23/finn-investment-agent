import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../lib/insights.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { alignComparison, maxDrawdown, financialRatio, notebookMarkdown } =
  await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
const s = (symbol, points) => ({
  symbol,
  points: points.map(([date, close, adjusted = close]) => ({
    date,
    close,
    adjusted,
    volume: 100,
  })),
  currency: "INR",
  source: "Test",
  sourceUrl: "",
  fetchedAt: "",
});
test("comparison uses shared dates and a common base, not each company’s first available day", () => {
  const a = s("A", [
      ["2026-01-01", 50],
      ["2026-01-02", 100],
      ["2026-01-03", 120],
    ]),
    b = s("B", [
      ["2026-01-02", 200],
      ["2026-01-03", 180],
    ]);
  const r = alignComparison([a, b], 22);
  assert.equal(r[0].points[0].date, "2026-01-02");
  assert.equal(r[0].points[0].value, 100);
  assert.equal(r[1].points[0].value, 100);
  assert.ok(Math.abs(r[0].change - 20) < 1e-9);
  assert.ok(Math.abs(r[1].change + 10) < 1e-9);
});
test("missing adjusted prices are excluded rather than silently replaced with raw close", () => {
  const a = s("A", [
      ["2026-01-01", 100, null],
      ["2026-01-02", 110, 110],
      ["2026-01-03", 120, 120],
    ]),
    b = s("B", [
      ["2026-01-01", 200],
      ["2026-01-02", 220],
      ["2026-01-03", 240],
    ]);
  assert.equal(alignComparison([a, b], 22, true)[0].points.length, 2);
  assert.equal(alignComparison([a, b], 22, false)[0].points.length, 3);
});
test("non-overlapping or single-day data cannot imply a comparative return", () => {
  assert.deepEqual(
    alignComparison(
      [s("A", [["2026-01-01", 10]]), s("B", [["2026-01-02", 10]])],
      22,
    ),
    [],
  );
});
test("maximum drawdown measures a fall from a previous peak, not endpoint return", () => {
  assert.ok(Math.abs(maxDrawdown([100, 120, 90, 130]) + 25) < 1e-9);
  assert.equal(maxDrawdown([100, 110, 120]), 0);
  assert.equal(maxDrawdown([0, 10]), null);
});
test("margin calculator handles negative profits and zero revenue", () => {
  assert.equal(financialRatio(-20, 100), -20);
  assert.equal(financialRatio(20, 0), null);
  assert.equal(financialRatio(20, 100), 20);
});
test("notebook export retains source provenance and note contents", () => {
  const out = notebookMarkdown([
    {
      id: "1",
      symbol: "INFY",
      title: "Check guidance",
      text: "Question with evidence.",
      createdAt: "2026-10-28",
      sources: [{ title: "Report", url: "https://example.com/report" }],
    },
  ]);
  assert.match(out, /Check guidance/);
  assert.match(out, /Question with evidence/);
  assert.match(out, /https:\/\/example.com\/report/);
});
