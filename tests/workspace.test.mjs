import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";
const { restoreDeskState, latestRequest, validDay } =
  await loadTs("lib/workspace.ts");
const defaults = {
  watchlist: ["INFY", "TCS"],
  saved: [],
  notes: [],
  theses: [],
  settings: { price: 4, volume: 2, categories: ["Results"], market: true },
};
test("desk restoration preserves valid notes while repairing malformed tags, sources and preferences", () => {
  const result = restoreDeskState(
    {
      watchlist: ["INFY", "INFY", "__proto__", null],
      notes: [
        {
          id: "n1",
          symbol: "INFY",
          title: "Revenue",
          text: "Review this",
          createdAt: "2026-10-28T10:00:00Z",
          reviewOn: "2026-02-31",
          sources: [
            null,
            42,
            { title: "Official", url: "https://example.com/report" },
            { title: "Bad", url: "javascript:alert(1)" },
          ],
        },
      ],
      theses: [
        {
          id: "t1",
          symbol: "INFY",
          text: "Margin trend",
          tags: [null, 42, "margin", "", { bad: true }],
        },
      ],
      settings: {
        price: Infinity,
        volume: -4,
        categories: [null, "Results", "Unknown"],
        market: false,
      },
    },
    defaults,
  );
  assert.deepEqual(result.watchlist, ["INFY"]);
  assert.deepEqual(result.theses[0].tags, ["margin"]);
  assert.equal(result.notes[0].sources.length, 2);
  assert.equal(result.notes[0].sources[1].url, "");
  assert.equal(result.notes[0].reviewOn, undefined);
  assert.deepEqual(result.settings, {
    price: 4,
    volume: 1,
    categories: ["Results"],
    market: false,
  });
});
test("empty watchlists remain empty and bad note identities/dates cannot break the notebook", () => {
  const n = {
    id: "a",
    symbol: "WIPRO.NS",
    title: "Test",
    text: "Text",
    createdAt: "2026-10-28",
    sources: [],
  };
  const result = restoreDeskState(
    {
      watchlist: [],
      notes: [
        n,
        n,
        { ...n, id: "b", createdAt: "nonsense" },
        { ...n, id: "c", symbol: "../bad" },
      ],
    },
    defaults,
  );
  assert.deepEqual(result.watchlist, []);
  assert.equal(result.notes.length, 1);
  assert.equal(restoreDeskState(null, defaults), defaults);
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(validDay("2028-02-29"), true);
});
test("switching company invalidates an in-flight answer, document fetch or upload", async () => {
  const requests = latestRequest();
  let resolveOld;
  const delayed = new Promise((resolve) => {
    resolveOld = resolve;
  });
  const first = requests.begin();
  const applied = [];
  const old = delayed.then((value) => {
    if (first.current()) applied.push(value);
  });
  requests.cancel();
  const second = requests.begin();
  resolveOld("old company evidence");
  await old;
  if (second.current()) applied.push("new company evidence");
  assert.deepEqual(applied, ["new company evidence"]);
  assert.equal(first.signal.aborted, true);
});
test("a newer request supersedes an older one and cancellation stops its result", () => {
  const requests = latestRequest();
  const a = requests.begin(),
    b = requests.begin();
  assert.equal(a.current(), false);
  assert.equal(b.current(), true);
  requests.cancel();
  assert.equal(b.current(), false);
  assert.equal(b.signal.aborted, true);
});
