# Admin Home: individual engagement and practice

The admin Home route now opens a student engagement workspace. Select a class and date range, inspect daily participation and individual calendars, select students, and assign vocabulary practice through the existing `/api/vocab/tasks` workflow. Assignments appear in the existing student Home cards and vocabulary workspace.

## Definitions

- Class-day engagement = distinct active class dates / eligible elapsed class dates. One double-block day counts once.
- Eligible dates begin at the latest of the reporting start, section start (or rotation anchor), and enrollment date. The section rotation, alternating weeks, global holidays, and section holidays determine meeting days.
- Today is excluded until midnight Eastern; date controls allow at most 370 completed calendar days.
- Off-day credit = distinct active off dates × the chosen multiplier. The default is 1.5×, saved as a browser preference, adjustable to 1×, 2×, or 3×.
- With bonus = (active class dates + off-day credit) / eligible class dates × 100. This may exceed 100%; the unadjusted percentage remains visible.
- Engagement never writes XP, attendance, grades, or mastery ratings. Respects M-1/E-3; uses existing student assignments and checking evidence, with no schema changes.
- Activity sources: lesson/site events, math submissions, math practice issuance, vocabulary attempts, vocabulary check starts/completions, and arcade session creation. These report recorded use, not time-on-task. Unlogged historical visits cannot be reconstructed.
- Assignment tracking is vocabulary check activity since assignment creation, independent of the reporting range: checks started, completed checks, active dates, latest activity, and word-readiness progress. Reading words without starting a check is not claimed as a completed check.
- Missing calendars produce unavailable percentages. Query failures produce errors, not zeros. Activity and check evidence is paginated.

## Verification

- Nine calculation tests: repeated events, Eastern midnight, DST, enrollment, missing schedules, empty denominator, alternating weeks, double blocks, rotation drops, invalid dates.
- API fixture tests: owner and role scoping, >500-row histories, enrollment boundaries, assignment progress, query failure, missing schedules, range limit.
- Browser tests: daily-chart inspection, individual calendar, multiplier persistence, student search/selection, exact assignment recipients, failed-save retry, practice tracking, class switching, empty/error states, responsive layout, mobile dialog bounds, dark/reduced-motion mode.
- Targeted ESLint and full TypeScript checks.
- Live database schema and aggregate read checks verified the existing source tables and enrollment dates via the connected Supabase tool. The local `.env.local` credentials were rejected (`Invalid API key`), so a live authenticated route/assignment round trip could not be verified locally. No real student assignments were created in testing.

Screenshots use synthetic student records. This is a local implementation, not a production deployment.

Run:

```sh
npx tsx --test src/lib/student-engagement.test.ts
node scripts/test-admin-engagement-api.cjs
node scripts/test-admin-home-browser.cjs
```

## Follow-up refinement

- Daily bars and individual calendar dates retain a visible selected state. A daily bar can filter the roster to students with or without activity on that date; dates before a student's enrollment are excluded.
- Follow-up buttons find unique students with no recorded use on at least three consecutive class days in the reporting range, practice not started, or unfinished practice past its due date. Practice follow-up uses the current date, independent of the engagement date filter.
- Recent class-day summaries compare the last five actual class dates with the previous five, reporting a percentage-point change only with ten eligible class dates. Off days do not break or inflate this comparison.
- Practice status groups filter the roster, and a nearby assignment button acts on the selected students. Hidden selections are explicitly counted. Due dates can be updated or removed using the existing authorized vocabulary task endpoint; failures preserve the editor and retry.
- Mobile student selection brings the detail heading into view and moves keyboard focus there. Follow-up actions bring the filtered roster into view.
- Chart entrance (260 ms), student-detail changes (180 ms), selected rows, progress widths, and date hover/selection provide brief visual feedback. No animation loops; reduced-motion disables these transitions and smooth scrolling.
- Twelve calculation tests and the expanded browser suite passed, including chart filters, practice follow-up groups, due-date error/retry, mobile navigation, and reduced-motion styles. No real assignments or due dates were changed during testing.

## Average XP per day

The roster and student detail show average XP/day, earned XP, and the calendar-day denominator. Sorting supports highest average XP/day. Earnings come from the canonical `economy_earning_events()` function used by balances and rankings, with paginated, roster-scoped, date-bounded reads. XP is grouped by its recorded earning timestamp; the existing ledger's historical vocabulary events retain their original aggregated award dates.

The denominator is every eligible calendar day in the selected completed-day range, including off days and zero-XP days, excluding dates before enrollment/class start. The engagement multiplier is not applied. An empty eligible range yields unavailable; no earnings in a valid range yields zero. XP read errors fail the report rather than showing a false zero. Calculation, API, and browser coverage include this metric, its sort, enrollment bounds, Eastern-time cutoffs, and query failures. Live read-only SQL verified the earning-event source; no XP was awarded or changed.
