# Lesson video XP — September 27, 2026

Video instruction now participates in the existing XP economy. Each assigned instruction video offers 5 XP after 90% of its content has been watched in the embedded player. Reward identity is the student, lesson, and YouTube video; replays and duplicate blocks in that lesson cannot pay twice. Watch progress persists across visits. Seeking, stale heartbeats, pauses, and concurrent sessions cannot multiply covered seconds.

Complete explicitly saved answers retain their existing rewards, including incorrect answers. The three published video lessons currently pay 5 XP per answer. Their totals are 15 XP for Kinematics and 25 XP each for Position and Displacement and Units, Quantities and Precision. Student lessons show video progress, question reward labels, and lesson XP totals. Teacher previews, snapshots, and classroom presentation views award no watch XP. Watching on YouTube outside the assigned lesson does not record credit. Video participation does not automatically award mastery or block lesson navigation.

The server uses verified published durations for all eight catalog videos. Additional instruction videos can specify a verified duration in the lesson editor. The endpoint derives student identity, authorized lesson access, video metadata, and reward amount on the server. New tables and RPCs are service-only, with RLS enabled and direct student access revoked. The informational RLS-without-policies advisor notices for these two tables are intentional.

Video rewards use the existing immutable economy ledger. They count in the spendable wallet, lifetime earnings, term eligibility, and unit lesson totals. Existing unit targets and question allocation are unchanged. No backfill guesses which students watched earlier videos.

## Validation

- 31 lesson/video/notebook/store regression checks passed, plus 8 API authorization and payload checks.
- Isolated PostgreSQL transactions verified duration authority, seeks, pause/resume, stale and cross-tab events, 90% threshold, duplicate payouts, track restrictions, and direct-access permissions. Wallet, term, lifetime and unit totals all increased by exactly 5 XP.
- Real React components with a synthetic player/API verified restored progress, award feedback, question rewards, reload persistence, teacher preview isolation, visible support content, and iPad layout without horizontal overflow or console errors. This fixture did not exercise actual YouTube streaming or a production student account.
- TypeScript, scoped ESLint, style audit and Vercel production build passed. Existing unrelated build warnings remain.
- Production schema migration applied successfully. Before/after ledger checks: 1,633 grants, 14,027 points, fingerprint d3d135bf4fd89c466c2b72afdc86afd6. No student XP changed during migration/testing.
- Release assembled from exact production baseline dpl_EbF5fpiWF1iPhhbvMRHXq3NtdUx5: 8 changed existing files, 10 new files, 2,247 preserved files. Staged checks passed for 12 routes.

## Release

Deployment: dpl_8pcRipHZxgGQe5bocFEkF6Ywd1Gb (physics-j5zwhlpia-ethalorians-projects.vercel.app).
Migration source: supabase/migrations/20260927222710_lesson_video_xp.sql; applied as lesson_video_xp.
Release assembly and evidence: /private/tmp/lesson-video-xp-release and /private/tmp/lesson-video-xp-work.
Rollback app deployment: dpl_EbF5fpiWF1iPhhbvMRHXq3NtdUx5. The additive schema can remain; preserve all earned grants.

Live verification: www.antocciphysics.com resolves to dpl_8pcRipHZxgGQe5bocFEkF6Ywd1Gb; all 12 live route checks passed and four preserved teaching/brand assets matched the release exactly. No error/fatal runtime logs were returned for this deployment at the verification check. The local fixture and isolated PostgreSQL server were stopped.
