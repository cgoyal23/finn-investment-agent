import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../lib/market.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { percentChange, marketStats, rangePoints, filterFilings, watchMatches } =
  await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
test("percentage change handles zero denominator and a known negative return", () => {
  assert.equal(percentChange(120, 0), null);
  assert.ok(Math.abs(percentChange(80, 100) + 20) < 1e-10);
  assert.equal(percentChange(NaN, 100), null);
});
test("volume baseline excludes the latest spike and needs 20 completed sessions", () => {
  const points = Array.from({ length: 21 }, (_, i) => ({
    date: String(i),
    close: 100 + i,
    volume: i === 20 ? 300 : 100,
  }));
  const stats = marketStats(points);
  assert.equal(stats.volumeRatio, 3);
  assert.equal(stats.averageVolume, 100);
  assert.equal(marketStats(points.slice(1)).volumeRatio, null);
});
test("chart ranges use trading sessions without dropping newest session", () => {
  const p = Array.from({ length: 247 }, (_, i) => ({
    date: String(i),
    close: i,
    volume: 1,
  }));
  assert.equal(rangePoints(p, "1M").length, 22);
  assert.equal(rangePoints(p, "6M").at(-1).close, 246);
  assert.equal(rangePoints(p, "1Y").length, 247);
});
test("recent-window filters do not turn old or future filings into current alerts", () => {
  const base = { priority: "High", category: "Results", symbol: "INFY" };
  const items = [
    { ...base, date: "2026-10-27" },
    { ...base, date: "2025-04-17" },
    { ...base, date: "2026-11-01" },
    { ...base, date: "2026-10-28", priority: "Routine" },
  ];
  assert.deepEqual(
    filterFilings(items, {
      days: 1,
      now: "2026-10-28",
      category: "All",
      symbol: "All",
      routine: false,
    }).map((f) => f.date),
    [],
  );
  assert.equal(
    filterFilings(items, {
      days: 0,
      now: "2026-10-28",
      category: "Results",
      symbol: "INFY",
      routine: true,
    }).length,
    4,
  );
});
test("thesis matching requires company as well as keyword", () => {
  const thesis = { symbol: "INFY", tags: ["margin"] };
  assert.equal(
    watchMatches(thesis, {
      symbol: "TCS",
      title: "margin",
      summary: "",
      why: "",
    }),
    false,
  );
  assert.equal(
    watchMatches(thesis, {
      symbol: "INFY",
      title: "Margins",
      summary: "",
      why: "",
    }),
    true,
  );
});
test("downloaded market records are chronological with finite prices and valid volumes", () => {
  const data = JSON.parse(
    fs.readFileSync(
      new URL("../lib/market-snapshot.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(Object.keys(data).length, 18);
  for (const series of Object.values(data)) {
    assert.ok(series.points.length >= 200);
    assert.ok(
      series.points.every(
        (p, i) =>
          Number.isFinite(p.close) &&
          p.close > 0 &&
          p.volume >= 0 &&
          (!i || p.date > series.points[i - 1].date),
      ),
    );
  }
});
