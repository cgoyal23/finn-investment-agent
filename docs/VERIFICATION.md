# Second prototype verification

See `RELEASE_V2.md` for the current Next.js/Vercel release: 17 tests passed, the production build passed, six migrated API smoke checks passed, the live Vercel page/research endpoint passed, and cross-origin authentication requests were rejected. Direct Google sign-in is not activated without a Google Client ID, and final browser testing remains pending.

# Prototype verification — 28 October 2026

## Completed

- TypeScript check: passed after correcting JSON response types.
- Six calculation/data-integrity tests: passed. These cover zero denominators, a known negative return, a 20-session volume baseline excluding the latest day, chart session ranges, date filtering, company-scoped thesis matching and 18 chronological market series.
- Six local API smoke checks: passed against the working server. Status omits credentials, INFY history contains real provider records, invalid tickers are rejected, empty questions are rejected, a non-demo ticker can be analysed from supplied source text, and repeated research uses the response cache.
- Live Gemini known-company request: returned a source-cited original-guidance-versus-outcome comparison and acknowledged missing revised-guidance evidence.
- Live Gemini non-demo WIPRO pipeline test: used explicitly fictional test data, returned 25% revenue growth and said debt was not disclosed. The test did not use or assert real Wipro financials.
- Provider reliability: initial `gemini-3.8-flash` calls later timed out; `gemini-2.5-flash` also returned a high-demand 503 during diagnostics. The configured model was changed to free-tier-listed `gemini-3.5-flash-lite`, which responded in the direct check and passed the complete API test.
- Initial browser review: the responsive briefing, navigation, search overlay, alerts and price chart rendered in the available approximately 662px-wide browser. The actual chart displayed real dated data and filing markers.
- Visual adjustment: secondary text contrast and copy sizes were increased following the initial review.

- Production Worker build: passed. The root app and all four API routes were built successfully.
- Source secret scan: 131 tracked files checked; no real Gemini key or private environment file was included.

## Verification limits

The browser-control surfaces became unavailable after an interrupted development turn. Final browser interaction tests at an exact 390px phone width and desktop width could not be completed in that environment. No claim is made that every screen, keyboard path, external document link or final responsive breakpoint has passed browser QA. The production build and API checks are separate from that missing final visual pass.

Publisher discovery and PDF download success depend on third-party availability. Unknown-ticker research has been verified with a supplied source extract; exhaustive automatic discovery across NSE tickers has not been demonstrated.

This log is updated with the actual build/deployment result when it is available. Deployment success does not imply the site is accessible to external evaluators: development hosting is owner-private.

### Daily review upgrade — 28 October 2026

19 automated tests pass. New cases verify that missing, same-date, older and invalid-baseline market data cannot imply a new price change; follow-ups due today are included; resolved questions stay resolved; exports retain review metadata. Local production compilation and TypeScript passed using `npm run build -- --webpack`; local Turbopack was blocked by sandbox process-port restrictions. Browser access host remains unavailable, so this upgrade has no new visual QA claim.

### Company discovery and visual redesign — 28 October 2026

23 tests pass. API-level checks (not browser clicks): Wipro/Toyota multi-exchange search; Samsung 245 KRW sessions, Wipro 248 INR sessions and Apple 251 USD sessions at test time; Wipro primary report discovery and five dated announcements. SEC discovery returned 403 and its failure state was exercised. Tests cover symbol validation, exchange preservation, arbitrary remote equities, safe SEC URL construction, announcement dates and exclusion of aggregator summary text. The local homepage SSR includes the new chart stage and pause control. Browser host unavailable and native Chrome timeout prevent visual/browser interaction verification.

### Field-guide interface — 28 October 2026

26 tests pass. New cases cover actual latest-session values, duplicate/missing holdings, absence of fabricated comparisons for a single session, safe flat-price sparkline geometry and shared isometric face corners. Actual React city/map SVG renders were inspected as images, and the initial SVG-title warning was corrected. Selected caption/action/down-session contrast ratios are 4.84, 5.05, 5.10 and 8.41. These targeted checks do not constitute a whole-app accessibility audit. Production compilation passes. Native Chrome read/screenshot access recovered after a retry; control/navigation remains intermittent, so a full browser interaction/responsive QA pass is not claimed.

Native Chrome testing subsequently recovered when the browser was idle and macOS Meta-key shortcuts were used. On the deployed release, building selection changed the passport to TCS (₹2,535, +0.20%); Tab + Enter selected Larsen & Toubro (₹3,680, +0.90%); pause toggled to Resume; Signal Map retained selection; Chart Desk rendered correctly. Screenshots were inspected. A 390×844 DevTools viewport exposed city overflow; mobile styles were adjusted to fit the whole illustration and enlarge selector buttons. These checks supersede the earlier browser-blocked status for this release. A full cross-browser/device audit is still not claimed.

Final live 390×844 review confirmed the city now fits in full and the headline uses two lines. Mobile company-selector spacing was inspected, and the visible passport research button successfully opened the selected Infosys company page with its price/volume section. A missing separator in the compact source caption was corrected. Browser checks cover this Chrome desktop/mobile-emulation workflow, not every physical device.
