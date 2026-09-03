-- Spam-clicker cleanup (2026-09-03):
-- 1. Runs over 100,000 were reached by rapid-guess clicking (five games sat
--    pinned at the 250,000 cap). Zero those runs' scores so the all-time
--    boards reset; the runs stay for the audit trail, tagged in meta.
update arcade_plays
set score = 0,
    meta = coalesce(meta, '{}'::jsonb) || '{"score_reset": "spam-cleanup-2026-09-03"}'::jsonb
where score > 100000;

-- 2. 250,000 was far above any legitimate ceiling (best honest run app-wide:
--    ~87k). Cap plausible scores at 100,000 everywhere the cap was higher.
update arcade_games
set max_plausible_score = 100000
where max_plausible_score > 100000;
