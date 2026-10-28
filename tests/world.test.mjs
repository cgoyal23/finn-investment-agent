import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../lib/market-world.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { worldCompanies, worldSparkline, buildingFaces, isoPoint } =
  await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
const series = (symbol, values) => ({
  symbol,
  currency: "INR",
  points: values.map((close, i) => ({
    date: `2026-10-${25 + i}`,
    close,
    adjusted: close,
    volume: 100,
  })),
  source: "Fixture",
  sourceUrl: "",
  fetchedAt: "",
});
test("world companies show the real latest session and do not fabricate missing holdings or comparisons", () => {
  const rows = worldCompanies(["A", "A", "B", "MISSING"], {
    A: series("A", [100, 80]),
    B: series("B", [15]),
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].close, 80);
  assert.equal(rows[0].date, "2026-10-26");
  assert.ok(Math.abs(rows[0].change + 20) < 1e-9);
  assert.equal(rows[1].change, null);
  assert.deepEqual(worldCompanies([], { A: series("A", [100]) }), []);
});
test("sparkline coordinates stay finite for flat prices and reject unusable history", () => {
  assert.equal(worldSparkline([12, 12]), "M0.00,40.00 L240.00,40.00");
  assert.equal(worldSparkline([12]), "");
  assert.equal(worldSparkline([12, NaN]), "");
  assert.equal(worldSparkline([12, 0]), "");
  const path = worldSparkline([10, 20, 15]);
  assert.ok(!/NaN|Infinity/.test(path));
  assert.match(path, /L120.00,8.00/);
});
test("building faces share the same corners and remain within the fixed city illustration", () => {
  const faces = buildingFaces(4.5, 4.2, 82);
  assert.deepEqual(faces.roof[2], faces.left[1]);
  assert.deepEqual(faces.roof[2], faces.right[1]);
  for (const p of [...faces.roof, ...faces.left, ...faces.right, faces.label]) {
    assert.ok(p.every(Number.isFinite));
    assert.ok(p[0] >= 0 && p[0] <= 720 && p[1] >= 0 && p[1] <= 390);
  }
  assert.deepEqual(isoPoint(0, 0, 10), [360, 100]);
});
