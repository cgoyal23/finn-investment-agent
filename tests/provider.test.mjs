import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";
const { parseDailyPrices, newestSeries } = await loadTs(
  "lib/market-provider.ts",
);
const sec = (s) => Date.parse(s) / 1000;
function quote({
  timezone = "Asia/Kolkata",
  start = "2026-10-28T03:45:00Z",
  end = "2026-10-28T10:00:00Z",
  timestamps = ["2026-10-27T03:45:00Z", "2026-10-28T03:45:00Z"],
} = {}) {
  return {
    meta: {
      exchangeTimezoneName: timezone,
      currentTradingPeriod: { regular: { start: sec(start), end: sec(end) } },
    },
    timestamp: timestamps.map(sec),
    indicators: {
      quote: [{ close: [100, 120], volume: [1000, 2000] }],
      adjclose: [{ adjclose: [99, 119] }],
    },
  };
}
test("end-of-day prices exclude the unfinished exchange session and include it after close", () => {
  const before = parseDailyPrices(quote(), Date.parse("2026-10-28T08:30:00Z"));
  assert.deepEqual(
    before.points.map((p) => p.date),
    ["2026-10-27"],
  );
  assert.equal(before.excludedOpenSession, true);
  const after = parseDailyPrices(quote(), Date.parse("2026-10-28T10:01:00Z"));
  assert.deepEqual(
    after.points.map((p) => p.date),
    ["2026-10-27", "2026-10-28"],
  );
});
test("daily dates use the exchange calendar, including sessions beginning on the previous UTC day", () => {
  const r = quote({
    timezone: "Pacific/Auckland",
    start: "2026-10-27T21:00:00Z",
    end: "2026-10-28T03:45:00Z",
    timestamps: ["2026-10-26T21:00:00Z", "2026-10-27T21:00:00Z"],
  });
  assert.deepEqual(
    parseDailyPrices(r, Date.parse("2026-10-28T04:00:00Z")).points.map(
      (p) => p.date,
    ),
    ["2026-10-27", "2026-10-28"],
  );
});
test("provider ingestion rejects bad bars, deduplicates sessions and sorts chronologically", () => {
  const r = quote({
    timestamps: [
      "2026-10-26T03:45:00Z",
      "2026-10-23T03:45:00Z",
      "2026-10-26T04:00:00Z",
      "2026-10-22T03:45:00Z",
    ],
  });
  r.indicators.quote[0] = {
    close: [100, 90, 101, NaN],
    volume: [10, 20, 30, 40],
  };
  r.indicators.adjclose[0].adjclose = [null, Infinity, 100, 1];
  const points = parseDailyPrices(r, Date.parse("2026-10-28T08:00:00Z")).points;
  assert.deepEqual(
    points.map((p) => p.date),
    ["2026-10-23", "2026-10-26"],
  );
  assert.equal(points[1].close, 101);
  assert.equal(points[0].adjusted, null);
  assert.throws(() => parseDailyPrices({ timestamp: [] }), /No prices/);
});
test("unknown close times never turn today's quote into an EOD observation", () => {
  const r = quote();
  delete r.meta.currentTradingPeriod;
  assert.equal(
    parseDailyPrices(r, Date.parse("2026-10-28T12:00:00Z")).points.length,
    1,
  );
});
test("refresh/fallback chooses the newest dated data without discarding a successful refresh", () => {
  const old = { points: [{ date: "2026-10-26" }], fetchedAt: "2026-10-27" };
  const fresh = { points: [{ date: "2026-10-27" }], fetchedAt: "2026-10-28" };
  assert.equal(newestSeries(old, fresh), fresh);
  assert.equal(newestSeries(fresh, old), fresh);
  assert.equal(newestSeries(undefined, fresh), fresh);
});
