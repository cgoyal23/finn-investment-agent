import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const transpile = (path) =>
  ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const url = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const dataUrl = url(transpile("../lib/finn-data.ts"));
const directory = await import(
  url(
    transpile("../lib/company-directory.ts").replace(
      '"./finn-data"',
      JSON.stringify(dataUrl),
    ),
  )
);
test("company lookup keeps exchange identity and does not turn Samsung or US stocks into NSE symbols", () => {
  assert.equal(directory.localCompanyMatches("samsung")[0].symbol, "005930.KS");
  assert.equal(directory.providerSymbol("005930.KS"), "005930.KS");
  assert.equal(directory.providerSymbol("AAPL.US"), "AAPL");
  assert.equal(directory.providerSymbol("WIPRO.NS"), "WIPRO.NS");
  assert.equal(directory.providerSymbol("INFY"), "INFY.NS");
  assert.equal(
    directory.localCompanyMatches("unknown private company").length,
    0,
  );
});
test("remote company search resolves arbitrary equities and rejects unsupported or unsafe results", () => {
  assert.deepEqual(
    directory.normalizeSearchQuote({
      symbol: "TOYOF",
      quoteType: "EQUITY",
      longname: "Toyota Motor Corporation",
      exchDisp: "OTC",
    }),
    {
      symbol: "TOYOF.US",
      name: "Toyota Motor Corporation",
      exchange: "OTC",
      currency: "",
    },
  );
  assert.equal(
    directory.normalizeSearchQuote({
      symbol: "WIPRO.NS",
      quoteType: "EQUITY",
      shortname: "Wipro",
      exchDisp: "NSE",
    }).symbol,
    "WIPRO.NS",
  );
  assert.equal(
    directory.normalizeSearchQuote({
      symbol: "INFY.NS",
      quoteType: "EQUITY",
      shortname: "Infosys",
    }).symbol,
    "INFY",
  );
  assert.equal(
    directory.normalizeSearchQuote({
      symbol: "SPY",
      quoteType: "ETF",
      longname: "Fund",
    }),
    null,
  );
  for (const symbol of [
    "https://bad.example",
    "../secret",
    "AAPL.US?key=x",
    "BAD.LOCAL",
    "",
  ])
    assert.equal(directory.validCompanySymbol(symbol), false);
});
test("SEC discovery maps a new ticker to its own CIK and only constructs safe official filing URLs", async () => {
  const sec = await import(url(transpile("../lib/sec-discovery.ts")));
  const previous = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (request) => {
    requested.push(String(request));
    return {
      ok: true,
      json: async () =>
        requested.length === 1
          ? { data: [[1234, "Example", "EXAMPLE", "Nasdaq"]] }
          : {
              name: "Example",
              filings: {
                recent: {
                  form: ["8-K", "10-K", "10-Q", "4"],
                  accessionNumber: [
                    "0001-01-001",
                    "0001-01-002",
                    "0001-01-003",
                    "0001-01-004",
                  ],
                  primaryDocument: [
                    "result.htm",
                    "annual.htm",
                    "../unsafe.htm",
                    "ownership.htm",
                  ],
                  filingDate: [
                    "2026-10-28",
                    "2026-10-01",
                    "2026-09-01",
                    "2026-08-01",
                  ],
                },
              },
            },
    };
  };
  try {
    const docs = await sec.discoverSecDocuments("EXAMPLE.US");
    assert.equal(docs.length, 2);
    assert.equal(docs[1].kind, "Annual report");
    assert.match(requested[1], /CIK0000001234.json$/);
    assert.equal(
      docs[1].url,
      "https://www.sec.gov/Archives/edgar/data/1234/000101002/annual.htm",
    );
  } finally {
    globalThis.fetch = previous;
  }
});
test("Indian disclosure discovery preserves announcement dates and excludes aggregator summaries", async () => {
  const parser = await import(url(transpile("../lib/document-parser.ts")));
  const docs = parser.parsePrimaryDocuments(
    `<section id="documents"><a href="https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=example.pdf">Acquisition<div><time datetime="2026-10-16T08:30:00+05:30">16 Oct</time> - Aggregator summary</div></a><a href="https://www.bseindia.com/report.pdf">Annual Report 2026</a><a href="https://evilbseindia.com/random.pdf">Untrusted</a><a href="javascript:alert(1)">Fake transcript</a></section>`,
    "TEST.NS",
  );
  assert.equal(docs.length, 2);
  assert.equal(docs[0].date, "2026-10-16");
  assert.equal(docs[0].title, "Acquisition");
  assert.equal(docs[0].kind, "Exchange announcement");
  assert.equal(docs[1].kind, "Annual report");
  assert.deepEqual(
    parser.parsePrimaryDocuments(
      '<a href="https://www.bseindia.com/report.pdf">Not a documents section</a>',
      "TEST",
    ),
    [],
  );
});
