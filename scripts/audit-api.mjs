import fs from "node:fs";
import assert from "node:assert/strict";
const base = process.env.FINN_TEST_URL || "http://127.0.0.1:3000";
const results = [];
async function check(name, path, verify, options = {}) {
  const at = Date.now();
  try {
    const r = await fetch(base + path, {
      ...options,
      signal: AbortSignal.timeout(30000),
    });
    const raw = await r.text();
    const data = r.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(raw)
      : raw;
    const detail = await verify(r, data);
    results.push({ name, status: "PASS", ms: Date.now() - at, ...detail });
  } catch (e) {
    results.push({
      name,
      status: "FAIL",
      ms: Date.now() - at,
      error: e.message,
    });
  }
}
for (const path of ["/", "/login", "/privacy", "/terms"])
  await check("Page " + path, path, (r, b) => {
    assert.equal(r.status, 200);
    assert.match(b, /FINN|finn/);
  });
await check("Unknown route returns 404", "/qa-route-does-not-exist", (r) =>
  assert.equal(r.status, 404),
);
await check("Status is safe and configured", "/api/status", (r, d) => {
  assert.equal(r.status, 200);
  assert.equal(typeof d.aiConfigured, "boolean");
  assert.ok(!JSON.stringify(d).match(/AIza|SESSION_SECRET|GEMINI_API_KEY/));
  return { aiConfigured: d.aiConfigured, model: d.model };
});
await check(
  "Anonymous Google session configuration",
  "/api/auth?challenge=1",
  (r, d) => {
    assert.equal(r.status, 200);
    assert.equal(d.user, null);
    assert.equal(d.configured, true);
    assert.match(d.clientId, /\.apps\.googleusercontent\.com$/);
    assert.match(r.headers.get("cache-control"), /no-store/);
    const cookie = r.headers.get("set-cookie") || "";
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    if (base.startsWith("https:")) assert.match(cookie, /Secure/);
    return { configured: d.configured };
  },
);
await check(
  "Cross-site sign-in rejected",
  "/api/auth/google",
  (r) => assert.equal(r.status, 403),
  {
    method: "POST",
    headers: {
      Origin: "https://untrusted.invalid",
      "Content-Type": "application/json",
    },
    body: "{}",
  },
);
await check(
  "Invalid Google credential rejected",
  "/api/auth/google",
  (r) => assert.equal(r.status, 401),
  {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: '{"credential":"invalid","csrfToken":"invalid"}',
  },
);
await check(
  "Cross-site sign-out rejected",
  "/api/auth/logout",
  (r) => assert.equal(r.status, 403),
  { method: "POST", headers: { Origin: "https://untrusted.invalid" } },
);
await check(
  "Anonymous sign-out safe",
  "/api/auth/logout",
  (r, d) => {
    assert.equal(r.status, 200);
    assert.equal(d.ok, true);
    assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
  },
  { method: "POST", headers: { Origin: base } },
);
for (const symbol of Object.keys(
  JSON.parse(fs.readFileSync("lib/market-snapshot.json", "utf8")),
))
  await check(
    "Saved prices " + symbol,
    "/api/market?symbol=" + symbol,
    (r, d) => {
      assert.equal(r.status, 200);
      assert.equal(d.symbol, symbol);
      assert.ok(d.points.length > 20);
      assert.ok(
        d.points.every(
          (p, i) =>
            Number.isFinite(p.close) &&
            p.close > 0 &&
            Number.isFinite(p.volume) &&
            p.volume >= 0 &&
            (!i || p.date > d.points[i - 1].date),
        ),
      );
      return {
        sessions: d.points.length,
        last: d.points.at(-1).date,
        currency: d.currency,
      };
    },
  );
for (const q of ["Samsung", "Wipro", "Toyota", "Apple"])
  await check(
    "Company search " + q,
    "/api/companies?q=" + encodeURIComponent(q),
    (r, d) => {
      assert.equal(r.status, 200);
      assert.ok(d.results.length > 0);
      assert.ok(
        d.results.every((c) => typeof c.symbol === "string" && c.exchange),
      );
      return {
        symbols: d.results.slice(0, 5).map((c) => c.symbol),
        warning: d.warning || null,
      };
    },
  );
for (const path of [
  "/api/companies?q=a",
  "/api/market?symbol=INVALID%2FURL",
  "/api/company?symbol=INVALID%2FURL",
  "/api/documents?symbol=INVALID%2FURL",
])
  await check("Invalid input " + path, path, (r) =>
    assert.equal(r.status, 400),
  );
for (const symbol of ["WIPRO.NS", "005930.KS", "AAPL.US", "7203.T"])
  await check(
    "External prices " + symbol,
    "/api/market?symbol=" + symbol,
    (r, d) => {
      assert.equal(r.status, 200);
      assert.ok(d.points.length > 20);
      assert.equal(d.symbol, symbol);
      return {
        sessions: d.points.length,
        last: d.points.at(-1).date,
        currency: d.currency,
        warning: d.warning || null,
      };
    },
  );
for (const symbol of ["INFY", "WIPRO.NS", "AAPL.US"])
  await check(
    "Company reports " + symbol,
    "/api/company?symbol=" + symbol,
    (r, d) => {
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(d.documents));
      assert.ok(Array.isArray(d.announcements));
      assert.ok(d.documents.every((x) => /^https:\/\//.test(x.url)));
      return {
        documents: d.documents.length,
        announcements: d.announcements.length,
        warning: d.warning || null,
      };
    },
  );
await check(
  "Anonymous AI research denied",
  "/api/research",
  (r, d) => {
    assert.equal(r.status, 401);
    assert.equal(d.loginRequired, true);
  },
  {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: "INFY",
      question: "Summarise the evidence.",
    }),
  },
);
console.log(
  JSON.stringify(
    {
      base,
      passed: results.filter((r) => r.status === "PASS").length,
      failed: results.filter((r) => r.status === "FAIL").length,
      results,
    },
    null,
    2,
  ),
);
fs.mkdirSync("work", { recursive: true });
fs.writeFileSync(
  "work/audit-api-" +
    (base.startsWith("https:") ? "production" : "local") +
    ".json",
  JSON.stringify({ base, results }, null, 2),
);

if (results.some((r) => r.status === "FAIL")) process.exitCode = 1;
