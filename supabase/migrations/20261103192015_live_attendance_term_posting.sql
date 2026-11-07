-- Publication belongs to a class and term. Each read uses the effective marks
-- through today's school date, including corrections and newly enrolled students.
create table public.attendance_live_terms (
  course_id uuid not null references public.courses(id),
  term_id text not null,
  posted_at timestamptz not null default now(),
  posted_by text not null,
  primary key (course_id, term_id)
);
alter table public.attendance_live_terms enable row level security;
revoke all on public.attendance_live_terms from public, anon, authenticated;
grant select, insert on public.attendance_live_terms to service_role;

create function public.publish_live_attendance_term(p_course uuid, p_term text, p_actor text)
returns void language plpgsql security invoker set search_path='' as $$
declare
  term jsonb;
  school_today date := (now() at time zone 'America/New_York')::date;
begin
  if nullif(btrim(p_actor), '') is null then raise exception 'A teacher is required to post attendance.'; end if;
  select item into term from public.course_grading_settings s
    join public.courses c on c.id=s.course_id
    cross join lateral jsonb_array_elements(s.terms) item
    where s.course_id=p_course and item->>'id'=p_term and c.program='physics' and c.archived_at is null
    for share of s;
  if term is null or school_today not between (term->>'start')::date and (term->>'end')::date then
    raise exception 'Choose the current grading term to post daily attendance.';
  end if;
  insert into public.attendance_live_terms(course_id,term_id,posted_by) values(p_course,p_term,p_actor)
    on conflict (course_id,term_id) do nothing;
end $$;
revoke all on function public.publish_live_attendance_term(uuid,text,text) from public,anon,authenticated;
grant execute on function public.publish_live_attendance_term(uuid,text,text) to service_role;

create function public.keep_live_attendance_terms() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if exists(select from public.attendance_live_terms p where p.course_id=new.course_id
    and not exists(select from jsonb_array_elements(new.terms) t where t->>'id'=p.term_id)) then
    raise exception 'A term with posted attendance grades cannot be removed.' using errcode='23503';
  end if;
  return new;
end $$;
revoke all on function public.keep_live_attendance_terms() from public,anon,authenticated;
create trigger protect_live_attendance_terms before update of terms on public.course_grading_settings
for each row execute function public.keep_live_attendance_terms();
