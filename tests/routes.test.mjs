import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";
const runtime = `export const runtimeValue = name => name==='SESSION_SECRET'?'a-test-secret-at-least-thirty-two-characters-long':name==='GOOGLE_CLIENT_ID'?'test.apps.googleusercontent.com':'';`;
test("auth status checks never rotate login challenges; subsequent login tabs reuse the valid challenge", async () => {
  const { GET } = await loadTs("app/api/auth/route.ts", {
    "@/lib/runtime-env": runtime,
    "./runtime-env": runtime,
  });
  const plain = await GET(new Request("https://finn.test/api/auth"));
  assert.equal(plain.headers.get("set-cookie"), null);
  assert.equal((await plain.json()).nonce, null);
  const first = await GET(
    new Request("https://finn.test/api/auth?challenge=1"),
  );
  const original = await first.json();
  const cookie = first.headers.get("set-cookie").split(";")[0];
  assert.ok(original.nonce);
  assert.ok(original.csrfToken);
  assert.match(
    first.headers.get("set-cookie"),
    /HttpOnly.*SameSite=Lax.*Secure/,
  );
  const next = await GET(
    new Request("https://finn.test/api/auth?challenge=1", {
      headers: { cookie },
    }),
  );
  const reused = await next.json();
  assert.equal(reused.nonce, original.nonce);
  assert.equal(reused.csrfToken, original.csrfToken);
  assert.equal(next.headers.get("set-cookie"), null);
});
test("fresh prices survive normal reads and an upstream outage after cache expiry", async (t) => {
  const saved = {
    symbol: "INFY",
    currency: "INR",
    source: "Yahoo Finance",
    sourceUrl: "https://example.com",
    fetchedAt: "2019-01-01",
    points: [{ date: "2019-01-01", close: 10, adjusted: 10, volume: 100 }],
  };
  const { GET } = await loadTs("app/api/market/route.ts", {
    "@/lib/market-snapshot.json":
      "export default " + JSON.stringify({ INFY: saved }),
  });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({
      chart: {
        result: [
          {
            meta: { currency: "INR", exchangeTimezoneName: "Asia/Kolkata" },
            timestamp: [1577943000],
            indicators: {
              quote: [{ close: [20], volume: [200] }],
              adjclose: [{ adjclose: [19] }],
            },
          },
        ],
      },
    });
  });
  const req = (refresh) =>
    new Request(
      "http://localhost/api/market?symbol=INFY" + (refresh ? "&refresh=1" : ""),
    );
  assert.equal((await (await GET(req(false))).json()).points[0].close, 10);
  assert.equal(calls, 0);
  const fresh = await (await GET(req(true))).json();
  assert.equal(fresh.points[0].close, 20);
  assert.equal(calls, 1);
  assert.equal((await (await GET(req(false))).json()).points[0].close, 20);
  assert.equal(calls, 1);
  const later = Date.now() + 1000000;
  t.mock.method(Date, "now", () => later);
  t.mock.method(globalThis, "fetch", async () => {
    throw Error("Provider down");
  });
  const fallback = await (await GET(req(true))).json();
  assert.equal(fallback.points[0].close, 20);
  assert.match(fallback.warning, /could not refresh/);
  assert.equal(
    (await GET(new Request("http://localhost/api/market?symbol=INVALID%2FURL")))
      .status,
    400,
  );
  assert.equal(
    (await GET(new Request("http://localhost/api/market?symbol=NOTREAL.NS")))
      .status,
    502,
  );
});
