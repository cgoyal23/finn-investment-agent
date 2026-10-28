import assert from "node:assert/strict";
const origin = process.env.FINN_TEST_URL || "http://127.0.0.1:3000";
const checks = [];
const testCookie = process.env.FINN_TEST_COOKIE || "";
async function json(path, options) {
  const r = await fetch(origin + path, {
    ...options,
    headers: {
      Origin: origin,
      ...options?.headers,
      ...(testCookie ? { Cookie: testCookie } : {}),
    },
  });
  return { status: r.status, data: await r.json() };
}
const auth = await json("/api/auth");
assert.equal(auth.status, 200);
const needsLogin = auth.data.configured && !auth.data.user;
await Promise.all([
  json("/api/status").then(({ status, data }) => {
    assert.equal(status, 200);
    assert.equal(typeof data.aiConfigured, "boolean");
    checks.push("non-sensitive status endpoint");
  }),
  json("/api/market?symbol=INFY").then(({ status, data }) => {
    assert.equal(status, 200);
    assert.ok(data.points.length >= 200);
    assert.equal(data.source, "Yahoo Finance");
    assert.equal(data.symbol, "INFY");
    checks.push("real INFY market snapshot");
  }),
  json("/api/market?symbol=INVALID%2FURL").then(({ status }) => {
    assert.equal(status, 400);
    checks.push("invalid ticker rejected");
  }),
  json("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: "INFY", question: "" }),
  }).then(({ status }) => {
    assert.equal(status, needsLogin ? 401 : 400);
    checks.push(
      needsLogin
        ? "anonymous research rejected before input handling"
        : "empty research request rejected",
    );
  }),
]);
const request = {
  symbol: "WIPRO",
  question:
    "Using only this test extract, calculate revenue growth and state whether debt can be established.",
  documentName: "Fictional pipeline validation; not a real issuer report",
  extract:
    "Fictional test data for pipeline validation only. Revenue for the year ended 31 March 2025 was INR 100 crore, compared with INR 80 crore in the previous year. Profit after tax was INR 12 crore. This extract does not disclose debt.",
};
const options = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request),
};
const response = await json("/api/research", options);
if (needsLogin) {
  assert.equal(response.status, 401);
  assert.equal(response.data.loginRequired, true);
  checks.push("Google sign-in required for live research");
  console.log(
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        skipped: [
          "Live generation and caching require a real signed-in session. Security is not bypassed for this test.",
        ],
      },
      null,
      2,
    ),
  );
} else {
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert.equal(response.data.mode, "gemini");
  assert.match(response.data.answer, /25\s*%/);
  assert.match(response.data.answer, /debt/i);
  assert.ok(response.data.citations.some((s) => s.id === "USER-EXTRACT"));
  assert.ok(response.data.citations.every((s) => s.id === "USER-EXTRACT"));
  checks.push(
    "live Gemini research for non-demo WIPRO using fictional source evidence",
  );
  const repeat = await json("/api/research", options);
  assert.equal(repeat.status, 200);
  assert.equal(repeat.data.cached, true);
  checks.push("repeated question uses saved answer");
  console.log(
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        research: {
          mode: response.data.mode,
          answer: response.data.answer,
          citationIds: response.data.citations.map((c) => c.id),
          limitations: response.data.limitations,
        },
      },
      null,
      2,
    ),
  );
}
