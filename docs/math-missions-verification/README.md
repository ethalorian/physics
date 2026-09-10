# Math Missions implementation and verification

Implemented locally September 10, 2026. **Not deployed; the new migration has not been applied to production.**

## Delivered

Seven interactive missions cover all thirteen local Math Spine competencies: Numberline Navigator (NS1–2), Ratio Reactor (PR1–2), Unit Courier (QE1–2), Precision Observatory (QE3–4), Balance Bay (SM1–2), Motion Mapper (GV1–2), and Vector Rescue (GV3).

Six-step sessions provide probes, coached practice, independent checks, hints, authored strategies, worked examples, adaptive difficulty, saved drafts, pause/resume, and delayed checks. Challenge assistance removes ranking eligibility. First responses remain distinct from corrections. Estimation reasoning is reserved for teacher review. Practice does not change mastery ratings.

Entry points include arcade browsing, competency panels, lesson blocks, and teacher assignments. The teacher workspace assigns skills and reviews task evidence; feedback returns to students. Cards use captured gameplay and show XP, shared caps, challenge leaders and personal ranks. Vocabulary remains outside arcade browsing.

The server owns generation, grading, progression, scores and rewards. Ownership, teacher roster scope, private tables, revision checks, idempotent completion and atomic XP grants are enforced. Mathle permits one ranked claim per UTC day with repeat practice available.

Legacy repairs include visible untimed questions, persistent practice feedback, manual practice difficulty, correct cubic hints, Expression Crush keyboard selection and evaluation steps, larger Fusion evidence samples, normalized Mathle scoring, and bounded network/start recovery.

## Verification

- Production Next.js build passed using a 4 GB Node heap, two workers, and a temporary verification preload disabling webpack disk cache. Baseline lint warnings remain. Generated server/static output was removed afterward to recover space; rebuild before starting production locally.
- TypeScript passed with a 4 GB Node heap.
- All 25 mission/bridge unit tests passed, including 2,600 generated keys, independent graph calculations, equivalent algebra, safe parsing, evidence integrity and session transitions.
- Legacy logic passed: 6,000 generated questions, Fusion equivalence, 200 Mathle puzzles, and expression arithmetic.
- Actual API handler fixtures passed ownership, roster scope, malformed requests, hidden keys, idempotency, failed-save retry, daily eligibility, assignments and feedback.
- Local PostgreSQL rollback tests passed private access, shared XP caps, atomic completion/assignment/reward behavior, stale writes, leaderboard exclusions and Mathle claims. Production data was not used.
- Mission browser checks passed all seven complete sessions, all thirteen skills at mobile width, pause/reload/resume and teacher-to-student feedback. Actual components and handlers run with mocked authentication/database transport.
- Combined arcade browser checks passed search/category filtering, representative images, vocabulary exclusion, leaderboards, XP, Midway costs, retry states, navigation and 320–1440 px layouts. API transport is mocked.

Screenshots: [library](mission-library.png), [Balance Bay](balance-bay-desktop.png), [mobile Vector Rescue](vector-rescue-mobile.png), [teacher workspace](teacher-missions.png).

## Release sequence

1. Apply `supabase/migrations/20260910005836_math_missions.sql` to the intended project before deploying the application. It creates private session/assignment tables, save/leaderboard functions and the Mathle daily purchase wrapper.
2. Deploy through the normal release process. Preserve the separately developed Unit Lab and Conversion Workshop changes in the shared workspace.
3. Verify a teacher/test-student flow on the deployed system: assignment, completed session, reload/resume, reward, feedback and Mathle daily eligibility.
4. Pilot with students and compare independent and delayed checks. Teacher review is required; automated checks do not establish learning efficacy.

Test entry points: `scripts/test-math-missions-api.cjs`, `scripts/test-math-missions-db.cjs`, `scripts/test-math-missions-browser.cjs`, `scripts/test-arcade-hub-browser.cjs`, `scripts/test-math-arcade-browser.cjs`, and `scripts/test-math-arcade-logic.cjs`.
