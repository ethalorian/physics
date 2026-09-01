-- Credit the ACTOR: engagement metrics were attributing mastery ratings to
-- the rated student's teacher-of-record (roster inference). Record who
-- actually pressed the button instead. (Backfill to the sole grading teacher
-- ran against the live DB 2026-09-02.)
ALTER TABLE mastery_records ADD COLUMN IF NOT EXISTS rated_by text;
