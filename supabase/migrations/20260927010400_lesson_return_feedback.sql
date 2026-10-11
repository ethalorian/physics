-- Add feedback to the existing exact-submission review; no ratings change.
alter table public.lesson_reviews add column if not exists feedback text not null default '';
