# AI-assisted build history — curated, redacted record

This is a curated decision and prompt record from the development chat, not a complete conversation export or a claim to contain every tool call. The original coding-agent conversation should also be exported, with credentials redacted, for final submission. Do not publish an unredacted chat share link: an API credential was supplied during development.

## User direction

1. The user supplied the ENAM main and reference PDFs and asked how to build a strong submission.
2. The user selected a free Gemini API approach while continuing to use Codex for development.
3. The user asked for a plain-language explanation of FINN and whether additional features were allowed.
4. Ideas explored: thesis-aware alerts, linking related disclosures, questions for management, changes in language, shared portfolio risks, and financial-term explanations.
5. The user proposed share-price graphs with insights. The accepted design shows price and volume, filing markers, calculated observations, and a path to source-grounded research, without inventing causation.
6. Build request: “now first bulit an end to end prototype whatever the best you can and make it. which platform you are going to use because keep in mind what to submut”.
7. The user supplied a Gemini credential. **[CREDENTIAL REDACTED]** It was stored as a server secret and an ignored private local setting, never as authored application source.
8. The user provided the repository: `https://github.com/cgoyal23/finn-investment-agent`.

## Decisions made during implementation

- Choose a mobile-first web app to make the evaluator's phone demo simple.
- Use React/TypeScript plus a same-origin Worker backend through Sites, replacing the earlier tentative separate Python service to reduce deployment complexity.
- Fetch real EOD history for 18 NSE companies; preserve timestamps and provider attribution.
- Use real dated company disclosures as a historical filing library. Do not restamp old news as current alerts.
- Build five connected screens: Briefing, Portfolio, Research, Thesis Watch, Alerts.
- Make the original Infosys guidance versus actual full-year outcome the first evidence-based comparison.
- Keep financial arithmetic deterministic; distinguish EBIT from EBITDA and reported from adjusted margin.
- Connect Gemini server-side, verify the credential, and test a source-cited research request.
- Provide unknown-ticker document discovery and a transparent source-extract fallback.
- Store browser preferences locally. Document that there is no account sync, background exchange polling or phone push yet.
- Validate citation membership and reject unknown source IDs; acknowledge that semantic claim verification remains a future evaluation task.
- Keep the site owner-private during development; reviewer access is a separate submission check.

## Observed failures and corrections

- Initial dependency installation could not use the default package-manager cache; it was retried using a workspace cache.
- Public-data retrieval initially encountered a certificate-store error; retrieval was retried with a maintained CA bundle while retaining certificate verification.
- Local preview initially lacked permission to listen; the preview was relaunched with the required permission.
- Type checking exposed unknown JSON-response types; the response boundaries were corrected before packaging.
- Initial visual review showed overly faint secondary text; contrast and readable copy sizes were increased.
- GitHub CLI was not authenticated, and the connector did not expose repository creation. The user created the target repository; source upload uses the connected account.

## Verification intent

Use numerical invariants and source-integrity checks, not tests that merely mirror UI markup. Exercise chart controls, saved preferences, research, failure handling and a non-demo ticker. Record actual results in `docs/VERIFICATION.md`; do not claim future checks passed.

## Reliability refinement

Repeated provider checks exposed timeouts for the initially selected Gemini model. The app was configured to use `gemini-3.5-flash-lite` after a successful direct request and a passing end-to-end evidence-analysis test. A supplied fictional record for a non-demo ticker tested arithmetic and abstention without claiming real issuer facts.

## Second prototype direction

The user requested a more attractive, understandable interface, more useful features, Google authentication instead of the former platform login, and a hosting address without the former provider suffix. The app gained comparison, a research notebook, source-linked timelines, a plain-language learning guide, interactive chart markers and new onboarding. Standard Next.js was added as the primary deployment path for Vercel. The user completed Vercel’s device authorization; no password or OTP was collected by the app. Direct Google login is implemented but still needs a web OAuth Client ID and an actual account test.

The user supplied the Google web-client identifier after creating a Web application client. It was configured in production, the application was redeployed, and server-side challenge/invalid-token/anonymous-research checks passed. No Google password, OTP or client secret was requested.

## 28 October 2026 — daily research workflow

User requested more quality features after Google authentication setup. Added a daily review panel: refresh the selected watchlist with two concurrent requests, show coverage and session dates, explicitly save a per-account browser baseline, and rank changes only when a newer price session exists. Failed refreshes retain dated data and are counted separately. Unadjusted-price corporate-action limitations are visible.

Notebook now supports optional follow-up dates, due/open/resolved filters and counts, resolving/reopening questions, and export of review metadata. These are browser-local reminders, not scheduled notifications. Historical filings remain historical; live exchange ingestion is not part of this release.

Validation: 19 tests passed, including baseline chronology and research follow-up boundaries. Local Next.js webpack production build passed. Turbopack locally hit a sandbox process-port restriction. Browser inventory still reports the browser access host unavailable, so visual interaction verification remains outstanding.

## 28 October 2026 — company discovery and market-desk redesign

User requested a more appealing finance interface with opening transitions and a running visual element, plus a proper company-name lookup flow that applies to companies beyond the sample portfolio. Samsung was explicitly an example, not the scope limit.

Replaced the fallback that labelled any typed name “NSE listed” with debounced provider-backed company search. Results carry company and exchange identity; Indian results are prioritised, and international listings use explicit exchange-qualified symbols. Selecting a result automatically opens price history, historical price/volume observations, available reports, dated disclosures and evidence-backed research entry points. Price formatting uses the listing’s currency; no FX conversion is implied. Business analysis remains evidence-limited and Google-authenticated. Added generic SEC discovery, with an honest fallback when SEC automated access is rejected. Indian document parsing now preserves exchange-announcement dates and excludes aggregator-written summaries from company facts.

New visual direction uses midnight navy, mint chart accents, a real-data featured chart with company selectors, a moving dated price ribbon with a pause button, short entrance/line-drawing transitions, clearer summary cards, and a compact getting-started tour. Reduced-motion settings disable ornamental motion and smooth scrolling. Charts adapt their coordinate width to available space. Google sign-in styling and favicon match the new identity.

Verification: 23 tests pass, including exchange resolution, new-company normalization, ticker safety, SEC URL construction and disclosure-date parsing. Local API checks found Wipro and Toyota listings, fetched Samsung/Wipro/Apple prices in KRW/INR/USD, and found five Wipro dated announcements plus annual reports and transcripts. SEC directory returned 403 here; the UI reports that limitation. Browser inventory and direct in-app tab creation report “browser access host unavailable”; native Chrome access timed out. No visual screenshot or interaction-test claim is made.

## 28 October 2026 — explorable field-guide interface

User referenced https://antaragni.in/ and requested a more creative interface plus careful self-testing. Inspected its public page structure and street artwork for its spatial-navigation idea. FINN’s city illustration, geometry and styling are original; no reference artwork, logo or code was copied into the product.

Added three actual switchable views: Market City (clickable company buildings), Signal Map (company-selection nodes) and Chart Desk (the previous chart stage). An editorial field-guide layout and a company passport connect the illustration to dated closing prices and primary-source research. Scene height and connection lines are explicitly illustrative. Daily direction dots and numerical changes use real saved data. The eight-company scene is derived from the watchlist, not fabricated holdings. Mode preference is browser-local. Motion can be paused, reduced-motion preferences are respected, and buildings/nodes support keyboard selection with ordinary company-selector buttons as an alternative.

Validation: 26 tests pass; TypeScript and production build pass. Rendered the actual React city/map SVGs and inspected both images; fixed a React SVG-title warning and checked sample text contrast ratios (4.84–8.41). Browser API host remains unavailable. Native Chrome read/screenshot access became available after a retry, but mutation attempts were interrupted or timed out; full browser interaction verification remains in progress/limited and is not inferred from static artwork renders.


Browser follow-up: after the user left Chrome idle, native interaction succeeded with macOS Meta-key shortcuts. Verified all three views, pointer and keyboard company selection, passport prices, pause/resume state and mobile research entry. A 390×844 emulation exposed horizontal city overflow; the scene now fits, selectors have larger targets and the heading is compact. Rechecked the refined layout live; fixed compact source-caption spacing. The browser console showed zero messages after these flows. Restored normal desktop browsing and left FINN on Market City.
