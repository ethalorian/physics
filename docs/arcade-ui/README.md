# Arcade UI refresh

The arcade hub now groups games into Physics, Math, Vocabulary, Workshop, and Midway, with topic search, category counts, and consistent illustrated cards. Player progress sits above the library; daily goals and rewards sit alongside it. Leaderboards are expandable, and every ranked cabinet displays its actual price or free-credit eligibility. Assigned vocabulary and teacher challenges remain visible before game selection.

The cabinet player adds fullscreen access and a loading state. Daily spin handles failed requests and already-used rewards, exposes accessible controls, and respects reduced motion. Game mechanics and XP award policies are unchanged.

## Verification

- `npx tsc --noEmit` — passed.
- ESLint on the three changed React files — passed.
- `node scripts/test-arcade-hub-browser.cjs` — passed: search/filter/reset, focus and multiplayer links, workshop access, rankings, pricing, spin failure/retry/already-used state, updated balance, assignments, keyboard focus, fullscreen, cabinet navigation, loading failures and retry, empty state, light/dark, widths 320–1440px. No page errors.
- `node scripts/test-math-arcade-browser.cjs` — all eight math games passed existing play/save/practice/mobile regressions.

Browser suites render the real components and use mocked API transport. No live student transactions were made. The hub suite compiles the actual application CSS. Existing game fixtures now specify an in-memory bundle output filename so esbuild can resolve the player's CSS module.

Preview uses sample game/player data. Not deployed.
