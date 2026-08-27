-- ===========================================================================
-- YEAR-END WIPE — executed 2026-08-24 against PhysicsAPP (ymszffulqmkqgvhioege)
--
-- ALREADY RUN. This file is a record, not a migration. It is deliberately NOT
-- in supabase/migrations/ — replaying it against a restored backup would delete
-- the very data the restore was for.
--
-- Scope confirmed before running:
--   · all student data                          -> DELETED
--   · reward catalog (rows only, table kept)    -> DELETED
--   · roster, courses, schedules                -> DELETED
--   · arcade games + avatar wardrobe catalogs   -> KEPT
--   · all curriculum content                    -> KEPT
--   · staff / roles / admin                     -> KEPT
--   · target_reviews                            -> KEPT (teacher-authored
--     reteach plans — created_by is staff, not student work)
--
-- No export was taken. Supabase's own automatic backups are the only rollback.
-- ===========================================================================

begin;

-- 1. STUDENTS — 40 rows. ON DELETE CASCADE reaches 29 child tables:
--    arcade_plays, assignment_reminders, assignment_submissions, avatar_likes,
--    block_responses, challenges, course_students, economy_point_grants,
--    gradebook_entries, lesson_progress, lesson_submissions, lobby_members,
--    mastery_records, mastery_task_results, math_competency_records,
--    math_spine_point_grants, math_warmup_submissions, notification_reads,
--    question_usage_log, reward_redemptions, student_activity,
--    student_assignment_assignments, student_avatars, student_identities,
--    student_lesson_assignments, student_owned_items, submissions,
--    video_question_responses, vocabulary_game_scores.
delete from public.students;

-- 2. Student data with NO foreign key to students. These carry a plain text
--    user_id, so the cascade above does not reach them — they would have been
--    left behind as orphans pointing at students that no longer exist.
delete from public.lesson_section_progress;
delete from public.duel_matches;

-- 3. REWARDS — 14 rows. The TABLE is kept so new rewards can be added this
--    year; only the catalog contents go. Cascades store_reward_placements.
--    (reward_redemptions.reward_id is ON DELETE SET NULL, but those rows had
--    already gone with the students above.)
delete from public.rewards;

-- 4. ROSTER + SCHEDULES. Cascades course_students, lobby_sessions,
--    section_pacing, section_schedules, store_reward_placements.
delete from public.courses;
delete from public.lesson_class_windows;   -- course_id is text, no FK: explicit
delete from public.rotation_calendar;      -- last year's anchor + no-school dates

commit;
