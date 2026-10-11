-- Keep source references and generation records intact when removing an unused draft.
-- No existing rows or student work change. A deleted draft cannot be published.
set lock_timeout = '5s';
alter table public.quiz_assignments add column deleted_at timestamptz;
alter table public.quiz_assignments add constraint quiz_deleted_draft_only check (deleted_at is null or status = 'draft');
comment on column public.quiz_assignments.deleted_at is 'Reversible deletion of unpublished drafts. Hidden from quiz lists and direct access; assigned copies retain their source reference.';
