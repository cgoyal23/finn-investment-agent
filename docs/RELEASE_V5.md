# FINN Playroom

Original educational games inspired by the general idea of numerical training. This is FINN’s own implementation, not an embedded or affiliated TraderMath service, and does not copy its proprietary assessments.

- Number Sprint: generated arithmetic and percentage questions, starter/stretch difficulty, a 60-second clock or 15-question untimed practice.
- Returns Rally: six fictional scenarios covering recovery percentages, basis points, equal starting weights, chart endpoints, dividends and profit margins.
- Evidence Detective: six distinct fictional report/claim cases; identify support, contradiction or missing evidence.
- Daily Mix: eight mixed questions, deterministic for each India Standard Time calendar day.

A correct answer earns 10 points plus a 2–10 point consecutive-answer bonus. Misses/skips reset the answer streak. Explanations follow every response, and round results retain a review of the submitted answers. Timed games can be paused and auto-pause on a hidden browser tab. Empty rounds do not change progress.

Personal bests distinguish game, difficulty and timer mode. Practice streaks count distinct India calendar dates. Milestones, the latest 20 rounds, lifetime points and the latest completed daily date are saved in the browser under the current FINN workspace. These are personal, editable local records; no shared leaderboard, cash rewards, trading or cloud sync is implemented. Score cards copy plain text and a link for the visitor to share themselves.

The Playroom is reachable from the sidebar, top quick tools, mobile Play navigation and `/#arcade`. Hash navigation now updates an already-open app as well as handling initial links.

Validation: 36 automated tests and TypeScript pass. New tests cover deterministic daily decks, generated arithmetic, distinct multiple-choice answers, nonrepeated evidence cases, numeric parsing, streak scoring, idempotent progress, timer boundaries and the India midnight boundary. Chrome rendered the lobby and exercised correct/incorrect feedback and score progression (12 then 38 points after a deliberate miss and subsequent correct responses). After reconnecting to the local production build, Chrome also verified five consecutive Returns Rally answers, an ended round showing 80 points and 5/5 correct, and reloading restored one round, 80 lifetime points and a one-day practice streak. Native browser controls remained intermittent; a full six-question completion, timer expiry, clipboard success and responsive verification remain unconfirmed. These limits are retained rather than inferred as passing. The optimized webpack production build, including TypeScript, passed.
