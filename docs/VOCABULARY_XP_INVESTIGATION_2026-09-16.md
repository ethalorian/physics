# Vocabulary game XP investigation

Students reported that Matching showed earned XP which did not appear on Home.

## Findings

- `ArcadeEndScreen` displayed the raw score as `+{score} XP` before receiving any save confirmation. A 151-point game therefore promised 151 XP.
- The published database policy converts each game's score to XP with `min(25, round(score / 10))`, then limits total vocabulary earnings to **5 XP per UTC day**, shared across games. That policy has been active since September 9. Home reads `economy_totals`, which uses the same `economy_earning_events` calculation.
- Production read-only checks found **97 saved games across 25 student-days since September 10, with zero discrepancies** between expected vocabulary XP and the earning calculation. All six students with games on September 16 had received their 5 XP daily allowance. No particular reporting student was identified, and these checks cannot establish whether an unsaved game was played.
- The old screen ignored unsuccessful HTTP responses. Its save also waited for the personal-best lookup, so navigating away during that lookup could prevent submission. React Strict Mode's effect cleanup/replay could skip the submission altogether in development.
- Home fetches its total when mounted; no separate vocabulary total or client cache was found in that path. An already-open Home tab does not automatically refresh.

## Prepared changes

- Separate game points from confirmed daily vocabulary XP and show the lifetime total calculated by the same function Home uses.
- Explain the shared daily cap instead of displaying an invented per-game reward.
- Start saving immediately, independently of the optional personal-best request.
- Show pending and failure states; provide a retry and wait for confirmation before starting another game.
- Assign one UUID to each completed game and reuse it on retries. The existing database primary key deduplicates simultaneous/repeated requests; ownership and immutable score checks prevent one user from reading or changing another user's receipt.
- Preserve accuracy and time values of zero.

No XP amounts, policy, database schema, production records or deployment were changed. The patch is local and requires an application deployment to reach students. There is no evidence justifying a historical XP adjustment from the saved records examined.

## Verification

- `node scripts/test-vocab-xp.cjs`: passed API integration cases for conversion/cap totals, retry, post-save response loss, concurrent duplicate requests, ownership, immutable receipts, invalid input and zero-valued metrics. Uses an isolated database stub; authentication guards remain unchanged.
- `node scripts/test-vocab-xp.cjs --serve` plus `node scripts/test-vocab-xp-browser.cjs`: passed the actual Matching page → completion screen → actual score route flow against an isolated fixture; Strict Mode saves once; personal-best failure does not block saving; save and total-read failures can be retried without duplication; missing set shows no reward. Desktop/mobile inspection passed without page errors or horizontal overflow. The Home check in this fixture is a total display, not the full production Home page.
- `node scripts/test-vocab-flows.cjs`: 14 existing vocabulary integration checks passed.
- `node_modules/.bin/tsc --noEmit -p tsconfig.vocab-check.json`, targeted ESLint, and `git diff --check`: passed.
- Production SQL confirmed the server role can execute `economy_earning_events` and the browser role cannot.
- The existing `test-unit-xp-db.cjs` suite could not run because the local PostgreSQL test server on port 55439 is stopped. Production accounting was inspected read-only; no SQL policy changes are part of this patch.
