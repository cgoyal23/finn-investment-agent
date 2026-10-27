# FINN second prototype — 28 October 2026

## Added

- Company comparison on common trading dates, rebased to 100; up to four companies, adjustable range and explicit adjusted/unadjusted basis.
- Historical maximum drawdown for the selected comparative series.
- Research notebook: original notes, saving answers with their source links, searching, deletion confirmation and Markdown export.
- Plain-English finance guide with searchable definitions, examples and a live margin calculator using fictional teaching inputs.
- A partial source-linked company timeline.
- A first-use guide, clearer action labels and a stronger visual hierarchy with a forest-green navigation and larger readable copy.
- Clickable and keyboard-operable filing markers on the price chart.
- Keyboard focus handling inside dialogs and storage-quota error handling.
- FINN-branded Google sign-in page, verified server sessions and account-aware local desk storage.
- A first-class Next.js/Vercel deployment path, while retaining the old Worker build path for reference.

## Verified

- Next.js production build passed with the application, login, privacy, terms and all API routes.
- 17 unit/security/data-integrity tests passed.
- Six API smoke checks passed under the migrated Next.js server, including live Gemini analysis and response caching.
- No real Google identity was fabricated. The owner’s web OAuth Client ID is still required to activate Google login and complete a real account sign-in test.

## Known limits

The browser-control environment is unavailable in this session, so exact-device visual testing and the real Google popup are not claimed as tested. Automated security tests use test keys. The historical disclosure library and source-extract fallback remain transparent; this release does not add a continuous exchange feed, background phone notifications, durable note sync or a complete four-quarter guidance ledger.

The finance guide and comparison panel use deterministic calculations. No chart movement is presented as a causal explanation or a prediction.

## Production address

https://finn-investment-agent.vercel.app

Vercel deployment `dpl_2enD5T6YaWVLpUBswCNpM54fLMza` reported READY and assigned the stable production alias. Runtime source commit: `584e9af`. The Vercel account was connected by the owner through the CLI device flow.

## Live checks

The stable production URL returned HTTP 200 for the app, login page, status and authentication configuration endpoints. Gemini was configured and a production research request returned a cited answer. Cross-origin login and logout requests returned HTTP 403 as expected. Authentication configuration currently reports `configured: false` because the Google Client ID is still pending. No claim of a completed real Google sign-in is made.

## Google configuration activation

The owner supplied the Google Web Client ID, which was configured in Vercel. Deployment `dpl_23yQip6wx6PKcmZ38HueNVCQUH43` reported READY. The production auth endpoint now reports `configured: true` and returns a nonce and CSRF value with a Secure, HttpOnly challenge cookie and no-store caching. Invalid Google credentials return HTTP 401. Anonymous live research returns HTTP 401. A successful real Google account sign-in remains a human browser check; this update supersedes the earlier pending-configuration note.
