-- Private AI suggestions never write grades, mastery records or student feedback.
create table public.assessment_suggestions (
  source text not null check (source in ('lesson','reading','math','presentation','choice','vocabulary','checkpoint')),
  source_id text not null,
  version text not null,
  user_id uuid not null references public.students(id),
  status text not null default 'queued' check (status in ('queued','processing','ready','error')),
  targets jsonb not null default '[]',
  result jsonb,
  error text,
  lock_id uuid,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (source, source_id, version)
);
alter table public.assessment_suggestions enable row level security;
revoke all on public.assessment_suggestions from public, anon, authenticated;
grant select, insert, update, delete on public.assessment_suggestions to service_role;
create index assessment_suggestions_user on public.assessment_suggestions(user_id);

-- Existing review-module analysis is a draft until a teacher explicitly releases it.
alter table public.review_module_scores add column released_at timestamptz, add column released_by text;
create function public.invalidate_review_module_release() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.result is distinct from old.result or new.overrides is distinct from old.overrides
    or new.response_snapshot is distinct from old.response_snapshot or new.work_status is distinct from old.work_status
    or new.status is distinct from old.status then
    new.released_at := null; new.released_by := null;
  end if;
  return new;
end $$;
revoke all on function public.invalidate_review_module_release() from public, anon, authenticated;
create trigger review_module_release_invalidation before update on public.review_module_scores
for each row execute function public.invalidate_review_module_release();

create function public.release_review_module_score(p_slug text,p_user uuid,p_revision integer,p_actor text,p_owner_emails text[])
returns boolean language plpgsql security invoker set search_path=public as $$
declare w public.review_module_work; s public.review_module_scores;
begin
  if not exists(select 1 from public.review_module_assignments a join public.course_students cs on cs.course_id=any(a.course_ids)
    join public.courses c on c.id=cs.course_id where a.slug=p_slug and cs.student_id=p_user and cs.enrollment_state='ACTIVE'
    and c.teacher_email=any(p_owner_emails) and c.archived_at is null) then raise exception 'Teacher scope changed.'; end if;
  select * into w from public.review_module_work where module_slug=p_slug and user_id=p_user for update;
  select * into s from public.review_module_scores where module_slug=p_slug and user_id=p_user for update;
  if s.status is distinct from 'ready' or w.status is distinct from 'submitted' or s.work_status is distinct from 'submitted'
    or s.revision is distinct from p_revision or s.response_snapshot is distinct from w.state->'responses' then
    raise exception 'Responses or scoring changed. Refresh before release.';
  end if;
  update public.review_module_scores set released_at=now(),released_by=p_actor where module_slug=p_slug and user_id=p_user;
  return true;
end $$;
revoke all on function public.release_review_module_score(text,uuid,integer,text,text[]) from public,anon,authenticated;
grant execute on function public.release_review_module_score(text,uuid,integer,text,text[]) to service_role;
