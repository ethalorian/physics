-- Explicit calendar availability can close a review without creating a due date.
alter table public.review_module_assignments add column closes_at timestamptz;
alter table public.review_module_assignments drop constraint review_calendar_date_required;
alter table public.review_module_assignments add constraint review_calendar_date_required
 check (cardinality(course_ids)=0 or (due_on is not null and isfinite(due_on)) or (closes_at is not null and isfinite(closes_at)));
alter table public.review_module_assignments add constraint review_closing_time_finite
 check (closes_at is null or isfinite(closes_at));
comment on column public.review_module_assignments.closes_at is 'Exclusive calendar access end; independent of the optional due date.';
