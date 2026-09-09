# Published XP policy · 2026–27

Standard students have a 700 XP unit plan: 500 from published lesson evidence and 200 from math. Honors students have a 900 XP unit plan: 650 from evidence and 250 from math. Each question/evidence block shows a whole-number reward, divided across its track's published unit work. Complete and explicitly save every required part to earn it once. An incorrect but complete lesson answer earns participation XP; correctness and mastery ratings remain separate.

The initial term minimum is **1,400 XP standard / 1,800 XP Honors**, qualifying for **+5 term-average points**. No partial bonus below the minimum. Teachers apply eligible points when finalizing grades; this feature does not directly modify gradebook averages. Home shows earned, required and remaining XP. Purchases never reduce qualifying earnings. All earned sources count within the term; earnings do not carry between terms, and wallet balances never reset.

Starting calendar (America/New_York, inclusive dates):

| Term | First day | Last day |
| --- | --- | --- |
| 1 | August 31, 2026 | November 6, 2026 |
| 2 | November 7, 2026 | January 22, 2027 |
| 3 | January 23, 2027 | April 2, 2027 |
| 4 | April 3, 2027 | June 18, 2027 |

These dates are starting defaults created at the teacher's request, not an imported official school calendar. Course owners can edit dates, thresholds, and grade points at `/admin/xp-terms`; adjacent terms cannot overlap. Existing active courses receive four rules. Students without an active published term see a truthful unavailable-rule message.

Future math games and issued practice/warm-up grants share a UTC daily allowance: 10 XP standard / 15 Honors. Issued math practice pays 1 XP for a correct solution; the daily warm-up pays 1 XP for its completed submission. Existing teacher-rated math milestones remain additional bonuses. Vocabulary is capped at 5 XP/day. Daily spin awards 1–25 XP (mostly 1–2). Math can exceed the unit planning target through additional days of practice.

Historical earnings are preserved. Old implicit lesson-progress/video earnings are frozen into ledger entries at their recorded earning dates. Existing block grants keep their amount and identity; repeat saves do not increase them. Newly published/edited evidence can redistribute future unit rewards; historical receipts never change. Unit attribution for math follows the most recently visited assigned published unit, or the first available unit. Older unattributed math still counts in lifetime/term totals.

Database grants are transactional with evidence saves and protected by deduplication. Shared daily math limits use a per-student/day transaction lock. Public/authenticated clients cannot execute reward-policy RPCs directly; authenticated server routes scope them to the current student. Course edits check the owning teacher, including viewing-as scope.

Verification: unit allocation and preserved balances; SQL/TypeScript completion parity; incomplete/complete/replayed evidence; track isolation; shared daily math limit; vocabulary cap; term eligibility independent of purchases; math reward retry/rollback; Home and lesson browser previews at desktop/iPad/mobile sizes. The migration aborts if any existing student's accounting totals would change.

## Release verification

Published September 9, 2026 to `https://www.antocciphysics.com` (Vercel deployment `dpl_A46LYvaxgH1Fqqgwa4xsMSs71MwC`). The cloud production build passed. Live `/xp` returned HTTP 200 with the published standard/Honors minima; `/api/xp-policy` rejected an unauthenticated request. Database verification found 64 term rows across 16 active courses, correct lesson allocations for all 20 published unit/track combinations, zero leaderboard/lifetime accounting mismatches, and preserved accounting for all 291 existing students. The 280 enrolled students have an active term report; unenrolled accounts do not receive an invented course minimum.

Local verification passed 91 SQL/TypeScript completion cases, XP accounting and replay tests, math award API/database checks, teacher policy ownership and input validation, and responsive Home/lesson browser fixtures. Browser previews use sample student data. Supabase advisors show no new security warning for the new XP functions; service-only tables intentionally have RLS without browser policies. Existing unrelated repository advisor warnings remain outside this release.
