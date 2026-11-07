alter table public.textbook_assignments
  drop constraint textbook_assignments_chapter_check,
  add constraint textbook_assignments_chapter_check check (
    chapter between 2 and 40 or
    (chapter = 1 and section_ids = array['etf-1.1']::text[] and honors_reading is null and passage is null)
  );
