# FINN — Financial Investment Agent

A mobile-first investment research desk built for the ENAM AI Engineer Build Challenge. FINN helps an investor notice important changes, inspect the evidence, and follow a question through company disclosures.

## Prototype

- **Hosted preview:** https://finn-investment-desk-cg.racingkoi36.chatgpt.site
- **Source:** https://github.com/cgoyal23/finn-investment-agent
- Hosting is owner-private during development. A reviewer must be granted access, or the owner must explicitly publish a public demo, before submission. A URL alone does not grant access.

## Try this first

1. In **Briefing**, open the Infosys results insight and inspect the source-linked financial comparison.
2. In **Portfolio**, choose a company and explore 1M / 3M / 6M / 1Y daily closing prices, volume, and dated filing markers.
3. In **Research → Promises vs. results**, compare original Infosys FY2026 guidance with full-year delivery.
4. Ask **“Compare original FY2026 guidance with actual delivery. What is missing?”** The server calls Gemini using primary-source evidence and returns source links and limitations.
5. Enter a different NSE ticker. Discover company documents, or paste a primary-source text extract and ask a question. There is no prewritten answer for an unknown company.
6. Add an investment reason in **Thesis watch** and adjust **Alerts**. These preferences persist in this browser.

See [Demo guide](docs/DEMO_GUIDE.md), [Architecture](docs/ARCHITECTURE.md), [Verification](docs/VERIFICATION.md), [Build history](docs/BUILD_HISTORY.md), and [Submission checklist](docs/SUBMISSION.md).

## What is real, cached, or deliberately limited?

| Component | Current behavior |
| --- | --- |
| Market charts | Real Yahoo Finance daily prices and volumes for 18 NSE companies. Saved data ends 26 October 2026, with approximately one year per company. On-demand refresh calls Yahoo again. |
| Filing briefing | Selected real historical disclosures from April 2025 to April 2026. No continuous NSE/BSE feed is enabled. Source dates are preserved, so recent-window filters can correctly be empty. |
| Research examples | Four curated historical reviews: Infosys, TCS, Reliance, ITC. Source coverage is intentionally uneven and visible. |
| Live AI | Gemini API, called server-side when configured. No secret is sent to the client. Known-company questions use curated fact records linked to primary documents; new tickers can use discovered annual-report/transcript PDFs or supplied text. |
| Citation checking | Returned IDs must belong to supplied documents. This checks source membership, not full semantic entailment. Users should inspect the original. |
| Guidance comparison | One verified original-guidance-versus-full-year-delivery pair. This is not a complete four-quarter tracker and does not measure delivery against intervening revisions. |
| Alerts | Deterministic in-app threshold evaluation on latest EOD records. No background polling, email, phone push, or real-time trading prices. |
| Thesis watch | Company + user-defined keyword matching to historical disclosures. No automatic verdict on whether an investment thesis is true. |
| Persistence | Watchlist, saved insights, notes and alert settings use localStorage. Research and price-refresh caches are bounded, best-effort in-memory server caches. No account sync or durable server database. |

## Run locally

Use Node.js 22.13 or newer.

```sh
npm ci
cp .env.example .dev.vars
# Edit .dev.vars locally and insert your own Gemini API key.
npm run dev
```

Open the local address printed by the development server, usually `http://127.0.0.1:5173`.

```sh
npm test
npm run typecheck
npm run build
# With the dev server running and Gemini configured:
npm run test:api
```

The app also supports saved research, the market snapshot and extractive evidence search without a Gemini key. New document analysis requires an accessible primary source and configured model access.

Refresh the committed market snapshot with `npm run refresh:market` when needed, then review and rebuild. Runtime refresh does not rewrite the committed snapshot.

## Configuration

```dotenv
GEMINI_API_KEY=your_private_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Use a model your Google project can access; model availability and free quotas can change. The configured model was verified with the provided account during development. The default is a starting point, not a claim that every model is available on every account.

`.dev.vars` and `.env*` are ignored. `.env.example` is an explicit non-secret exception. Hosted secrets are configured through Sites runtime settings, not source files or browser storage. Do not commit a key.

## Platform and portability

The interface is React + TypeScript, with Vinext and Vite, using the Next.js App Router conventions. Backend routes run in Cloudflare Workers through Sites. The supplied Sites build integration is retained. There is no Python server in this prototype.

Sites deploys the built Worker and assets. For another Cloudflare account, adapt the environment and hosting configuration and provision the same secret. Migration to a different host needs runtime-binding changes; deployment is not advertised as a one-command Vercel export.

Data providers and report publishers can be unavailable or block automated access. FINN returns an explicit error or a dated saved record; it does not invent a current value.

## Structure

- `app/page.tsx`: application screens and interaction state
- `app/globals.css`: responsive interface and chart styling
- `app/api/market`: market snapshot and provider refresh
- `app/api/documents`: ticker-based primary-document discovery
- `app/api/research`: evidence retrieval, Gemini calls, source validation and quota protection
- `app/api/status`: non-sensitive connection status
- `lib/finn-data.ts`: company universe, curated evidence and historical filings
- `lib/market-snapshot.json`: real dated daily market records
- `lib/market.ts`: calculations, filtering and matching
- `tests/market.test.mjs`: financial calculation and integrity checks
- `docs/`: design decisions, demo, limitations and submission preparation

## Financial interpretation

Charts show **unadjusted closing prices**, not total returns. Corporate actions can introduce jumps; dividends are excluded from price-return calculations. Volume compares the latest session with the previous 20 sessions, excluding the latest day. EBIT is not relabelled EBITDA. Periods, currencies, standalone/consolidated basis, and adjusted/reported metrics remain explicit. The product supports research, not personalised investment recommendations or price forecasts.

## Next priorities

1. Ingest and deduplicate live NSE/BSE disclosures with durable fetch timestamps and retries.
2. Store downloaded reports and page-level text, with a repeatable extraction evaluation set.
3. Extend guidance tracking to four matched quarters, preserving every revision.
4. Add durable user-owned storage and scheduled EOD refresh.
5. Measure citation support, numerical extraction accuracy, latency and tokens per question before choosing a two-model router.

## Acknowledgements

Primary documents belong to the issuing companies. Market data is attributed to Yahoo Finance. This repository includes the Sites/Vinext starter and dependency licence notices. Company names identify public issuers and do not imply endorsement.
