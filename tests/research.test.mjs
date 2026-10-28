import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";
const { researchInput, checkedAnswer, boundedBytes } = await loadTs(
  "lib/research-validation.ts",
);
const sources = [
  {
    id: "WIPRO.NS-D1",
    title: "Official report",
    url: "https://example.com/report.pdf",
    locator: "Page 4",
    facts: "Revenue was 100.",
  },
];

test("research input rejects malformed types, unsafe symbols and oversized text", () => {
  for (const input of [
    null,
    [],
    {},
    { symbol: 42, question: "Hello" },
    { symbol: "INFY", question: [] },
    { symbol: "../bad", question: "Hi" },
    { symbol: "INFY", question: "Hi", extract: {} },
    { symbol: "INFY", question: "x".repeat(1501) },
    { symbol: "INFY", question: "Hi", extract: "x".repeat(50001) },
    { symbol: "INFY", question: "Hi", documentName: "x".repeat(101) },
  ])
    assert.equal(researchInput(input), null);
  assert.deepEqual(
    researchInput({ symbol: " wipro.ns ", question: " Revenue? " }),
    { symbol: "WIPRO.NS", question: "Revenue?", extract: "", documentName: "" },
  );
});

test("citation checks handle exchange-qualified IDs and preserve server source provenance", () => {
  const answer = checkedAnswer(
    {
      answer: "Revenue was 100 [WIPRO.NS-D1].",
      citations: [
        null,
        42,
        {
          id: "WIPRO.NS-D1",
          url: "https://fake.invalid",
          title: "Invented",
          locator: "Invented",
        },
        { id: "WIPRO.NS-D1" },
      ],
      limitations: {},
    },
    sources,
  );
  assert.equal(answer.citations.length, 1);
  assert.deepEqual(answer.citations[0], {
    id: sources[0].id,
    title: sources[0].title,
    url: sources[0].url,
    locator: sources[0].locator,
  });
  assert.equal(answer.limitations, "");
  assert.equal(
    checkedAnswer(
      {
        answer: "Revenue 100 [NOT-A-SOURCE]",
        citations: [{ id: sources[0].id }],
      },
      sources,
    ),
    null,
  );
  assert.equal(
    checkedAnswer(
      { answer: "Revenue 100 [WIPRO.NS-D1]", citations: [] },
      sources,
    ),
    null,
  );
  assert.equal(
    checkedAnswer({ answer: { bad: true }, citations: [] }, sources),
    null,
  );
  assert.equal(
    checkedAnswer({ answer: "Revenue was 100", citations: [] }, sources),
    null,
  );
  assert.ok(
    checkedAnswer(
      { answer: "Insufficient evidence to establish debt.", citations: [] },
      sources,
    ),
  );
});

test("stream limits cancel oversized requests and retain valid UTF-8 extracts", async () => {
  const bytes = new TextEncoder().encode("Revenue ₹100");
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(bytes.slice(0, 5));
      c.enqueue(bytes.slice(5));
      c.close();
    },
  });
  assert.equal(
    new TextDecoder().decode(await boundedBytes(stream, 100)),
    "Revenue ₹100",
  );
  let cancelled = false;
  await assert.rejects(
    () =>
      boundedBytes(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array(101));
          },
          cancel() {
            cancelled = true;
          },
        }),
        100,
      ),
    /exceeds/,
  );
  assert.equal(cancelled, true);
});

const mocks = {
  "@/lib/runtime-env": `export const runtimeValue=name=>name==='GEMINI_API_KEY'?'test-only-key':name==='GEMINI_MODEL'?'test-model':'';`,
  "@/lib/auth": `export const authConfigured=()=>true; export const currentUser=async request=>{const id=request.headers.get('x-test-user'); return id?{id,name:'Test',email:'test@example.invalid'}:null;};`,
  "@/lib/discovery": `export const discoverDocuments=async()=>({documents:[]}); export const safePrimaryUrl=()=>false;`,
};
const input = {
  symbol: "WIPRO.NS",
  question: "What is revenue?",
  extract: "Revenue was 100. Debt is not disclosed.",
  documentName: "Test report",
};
const request = (body = input, user = "one", origin = "https://finn.test") =>
  new Request("https://finn.test/api/research", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...(user ? { "x-test-user": user } : {}),
    },
    body: JSON.stringify(body),
  });
const providerAnswer = {
  answer: "Revenue was 100 [USER-EXTRACT].",
  citations: [{ id: "USER-EXTRACT" }],
  limitations: "Debt is not disclosed.",
};
const providerResponse = (answer = providerAnswer) =>
  Response.json({
    candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }],
  });

test("research route validates auth, origin and JSON before contacting the provider", async (t) => {
  const { POST } = await loadTs("app/api/research/route.ts", mocks);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return providerResponse();
  });
  assert.equal((await POST(request(input, null))).status, 401);
  assert.equal(
    (await POST(request(input, "one", "https://evil.test"))).status,
    403,
  );
  for (const value of [
    null,
    [],
    { symbol: "INFY", question: 42 },
    { ...input, extract: {} },
  ])
    assert.equal((await POST(request(value))).status, 400);
  assert.equal(
    (
      await POST(
        new Request("https://finn.test/api/research", {
          method: "POST",
          headers: { origin: "https://finn.test", "x-test-user": "one" },
          body: "{bad",
        }),
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
});

test("successful AI answers cache per account and document name, preserving citations", async (t) => {
  const { POST } = await loadTs("app/api/research/route.ts", mocks);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.match(url, /generativelanguage/);
    assert.equal(options.headers["x-goog-api-key"], "test-only-key");
    return providerResponse();
  });
  const first = await (await POST(request())).json();
  assert.equal(first.mode, "gemini");
  assert.equal(first.citations[0].title, "Test report");
  assert.equal(first.cached, false);
  assert.equal((await (await POST(request())).json()).cached, true);
  assert.equal(calls, 1);
  assert.equal(
    (
      await (
        await POST(request({ ...input, documentName: "Another report" }))
      ).json()
    ).citations[0].title,
    "Another report",
  );
  assert.equal(calls, 2);
  await POST(request(input, "two"));
  assert.equal(calls, 3);
});

test("research failures stay explicit and quotas belong to individual accounts", async (t) => {
  const { POST } = await loadTs("app/api/research/route.ts", mocks);
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("quota", { status: 429 }),
  );
  const limited = await POST(request());
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).error, /quota/i);
  for (let i = 1; i < 8; i++)
    await POST(request({ ...input, question: "Question " + i }));
  const localLimit = await POST(request({ ...input, question: "New" }));
  assert.equal(localLimit.status, 429);
  assert.match((await localLimit.json()).error, /wait a minute/i);
  const other = await POST(request(input, "two"));
  assert.match((await other.json()).error, /Gemini/);
});

test("AI output with invented evidence fails closed; absent evidence does not trigger generation", async (t) => {
  const { POST } = await loadTs("app/api/research/route.ts", mocks);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return providerResponse({
      answer: "Debt is 10 [FAKE]",
      citations: [{ id: "FAKE" }],
    });
  });
  assert.equal((await POST(request())).status, 502);
  const noSource = await (
    await POST(request({ ...input, extract: "" }))
  ).json();
  assert.equal(noSource.mode, "needs-sources");
  assert.deepEqual(noSource.citations, []);
  assert.equal(calls, 1);
});
