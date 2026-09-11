# Teacher XP bounties

The XP Challenges page now assigns a specific arcade or vocabulary game (or an activity category) to the signed-in teacher's active classes and individual students. Administrators use the same teacher scope. New global assignments are rejected server-side.

Reward periods use America/New_York: daily, Monday–Sunday calendar weeks, calendar months, or one custom date range. The first and last calendar windows are clipped to the assignment dates. Existing daily grant keys remain compatible. Grants retain the database unique dedupe key per bounty, student, and window.

Completed arcade runs count by finished_at, excluding staff and spam-flagged runs. XP targets use the existing activity ledgers and vocabulary score conversion. Activity reads are paginated, including monthly/custom windows with more than 1,000 rows. The student home card refreshes on return/focus and every minute; this refresh evaluates and pays eligible current-window bounties. It does not back-pay missed windows or process payouts on a background schedule.

## Validation

- `node scripts/test-xp-bounties.cjs`: real API handlers with isolated synthetic authentication/database. Covers invalid payloads, teacher/admin isolation, individual recipients, inactive enrollment, completed runs, pause, vocabulary game filtering, failure cleanup, concurrent/repeated payout deduplication, pagination, leap years and DST boundaries.
- TypeScript project check and focused ESLint.
- Browser preview at desktop and 390px width: assign custom bounty, pause/resume, student card/game link, no console errors and no horizontal overflow.
- Supabase migration `xp_bounty_periods` applied; checked period constraint and existing unique grant index. RLS remains enabled with service-only access; no new policies or privileged functions.

## Preview and release

`node scripts/test-xp-bounties.cjs --serve` serves the actual editor and student card at `http://127.0.0.1:3112/teacher` and `/student`, with synthetic data and lightweight base styling. No production assignments are created by the tests. The application changes have not been deployed.

## Bounty studio redesign

The teacher editor now uses three short steps: choose game play, choose timing, and choose recipients/reward. Searchable game tiles, date presets, target controls, quick reward choices, a live reward ticket, and a progress board replace the dense form. Individual recipients, custom dates, and custom titles remain available. Keyboard focus follows step changes; selection states and edit actions have accessible labels, and decorative movement respects reduced motion.

Browser checks covered daily/monthly shortcuts, automatic opening of custom dates, recipient validation, selecting a class and 50 XP, launch feedback, returning to a fresh game choice after launch, and the phone layout without horizontal overflow. The preview remains synthetic and the application changes are not deployed.
