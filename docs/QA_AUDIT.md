# FINN audit — 29 October 2026

This is an evidence log, not a claim that every device or external provider works without failure. Latest mobile layout verification is explicitly separated from earlier browser tests.

## Automated checks

- 57 unit/regression tests passed, including authentication, data parsing, games, workspace restoration, asynchronous response cancellation and research route validation.
- TypeScript, ESLint (zero warnings/errors), production webpack build and `git diff --check` passed.
- 45 HTTP integration checks passed against the rebuilt local production server. Run `FINN_TEST_URL=http://127.0.0.1:3006 npm run test:audit` to reproduce.
- All 18 saved watchlist histories have 248 sessions through 28 October 2026. Unfinished daily sessions are excluded; exchange-local dates and newer cached data are preserved.
- Samsung, Wipro, Toyota and Apple directory/price requests passed with exchange-specific symbols and KRW/INR/JPY/USD currencies. INFY and Wipro document discovery returned dated disclosures; Apple retained an official-source fallback.
- Eleven curated primary-source links returned HTTP 200; one Infosys PDF needed a retry after a network timeout. Availability can change independently of FINN.
- Three locally configured private values were checked against 242 source/build files; none appeared. This is a targeted credential scan, not a third-party penetration test.

## Browser interactions completed before the final mobile simplification

| Area | Actual Chrome checks |
| --- | --- |
| Briefing | Market City / Signal Map / Chart Desk switching, company selection, saved filing filter, historical/Today empty states, insight modal and Escape dismissal |
| Watchlist | Filtering, remove/re-add company, review baseline, refresh all 18 histories, session/date coverage |
| Charts/comparison | 1M range, previous-date slider, three/four-company comparison, fifth selection disabled, adjusted/unadjusted toggles |
| Notebook | Create note, dated follow-up, resolve/reopen, filters, reload persistence, Markdown download and contents, deletion confirmation cancelled with Keep |
| Thesis/alerts | Create thesis, matching disclosures, threshold changes and matching counts, pause alerts |
| Returns Rally | Complete six-question round; one wrong/five right; 80 points, 83% accuracy, six explanations |
| Number Sprint | Reject nonnumeric input, correct arithmetic, timer pause/resume, hidden-tab automatic pause, automatic timed completion, untimed 15-question completion |
| Evidence Detective | Complete six-question round with answer feedback and skipped questions |
| Daily Mix | Complete eight questions; completed-today badge and persisted aggregate progress |
| Game records | Reload persistence and copy-scorecard feedback |

Chrome console showed zero messages after the exercised game flows. Earlier mobile emulation at 390 pixels was inspected. A signed-in Gemini answer was observed on the existing production release; the revised research route additionally passed mocked provider/authentication/cache tests.

## Latest mobile-first changes

The phone home screen now uses a compact overview, real-price sparkline cards, watchlist direction bar, large company search and icon shortcuts. Market City opens on demand. Quick takes, price methodology, reports and company facts use expandable sections. Research has Chart / Reports / Facts / Ask FINN jump actions. Phone game screens have shorter copy and smaller headings; navigation accommodates safe-area insets and inputs use readable sizing.

The final redesign passed compilation, lint, type checks, regression tests and the 45 local HTTP checks. Its desktop page rendered in Chrome. **Final mobile screenshots and interaction checks for this redesign remain pending:** the native automation controls Chrome's foreground window, which the owner is actively using for YouTube. Browser-host access is unavailable, and an extra window did not isolate keyboard controls. The owner agreed to continue automated work without interrupting their browsing. No final mobile visual pass is claimed.

## Remaining coverage and product limits

- No physical iOS/Android or Safari/Firefox audit. The newest mobile layout, browser company-search-to-research flow, glossary/calculator interaction and new accordion/jump controls still need targeted visual checks.
- Fresh Google account selection was not repeated; negative authentication, origin, cookie and challenge handling passed. Successful live generation on the revised deployment needs a signed-in browser follow-up.
- Permanent notebook deletion was not executed; the confirmation/cancel path was checked.
- SEC automated access can return 403; some exchange PDFs block retrieval. FINN exposes coverage warnings and original source links; it does not invent missing financial analysis.
- Prices are dated EOD observations, not live quotes. Historical filing examples are labelled. Charts do not prove causes or predict returns.
- Notes, watchlists, game records and review baselines are local to this browser/account. Alerts run in-app, with no background push or cloud sync.
- AI citation validation checks allowed source IDs and server-owned metadata, not semantic entailment of every generated sentence.

## Production verification

Runtime commit `0961c3e` is deployed at https://finn-investment-agent.vercel.app. Vercel deployment `dpl_DX5dQXHUZn6DV1eFLBmjYAtxucQd` reports READY and the production alias is confirmed. All 45 HTTP audit checks and five anonymous smoke checks passed on the production URL. New dashboard markup and mobile stylesheet selectors were fetched and verified. This confirms delivery, not a rendered mobile visual pass. Live generation/caching was explicitly skipped because those checks require a real signed-in session.
