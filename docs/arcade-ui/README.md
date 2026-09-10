# Arcade UI refresh

The arcade contains Physics, Math, Workshop, and Midway. Vocabulary games, vocabulary assignment cards, and vocabulary-derived levels, streaks, daily goals, and weekly rank are excluded. The hub no longer requests vocabulary scores, focus, assignments, or XP challenges. Player stats use the actual cabinet response: spendable XP, free activities, personal bests, and ranked cabinets.

Vocabulary remains available through lesson blocks and assignments. The vocabulary index and shared game-return links now lead to vocabulary assignments instead of the arcade. Lesson and assignment practice logic is unchanged.

## Game previews

Every shipped active game has its own real gameplay capture, including the Tape Workshop. The 24 WebP images in `public/arcade/previews` are 720 × 450 and mapped by the cabinet's `srcPath` in `src/components/arcade/game-previews.json`. Next Image handles loading and sizing. An unknown or failed preview displays an explicit placeholder rather than another game's art.

Regenerate with `node scripts/capture-arcade-previews.cjs`. The script serves only local game assets, starts standalone practice, and captures the actual scene. It does not connect to student data. Set `PREVIEW_ONLY` to comma-separated source-file stems to refresh selected captures. Add a manifest entry and capture when registering a new game.

## Verification

- TypeScript and ESLint on the changed React files passed.
- `node scripts/test-arcade-hub-browser.cjs` passed: vocabulary UI/request exclusion, no assignment leakage, distinct images that decode successfully, search/filter/reset, workshop access, rankings, prices, spin failure/retry/already-used state, updated balance, keyboard focus, fullscreen, cabinet navigation, errors/retry, empty state, light/dark, and widths 320–1440px. No page errors.
- All 24 image/source pairs exist, with the expected dimensions.
- Earlier player refresh passed all eight math-game play/save/practice/mobile regressions. This follow-up does not change game mechanics or the player bridge.

Browser UI tests use the real components and application CSS with mocked API transport. Previews show sample data. This change is local, not deployed.
