-- NextAuth owns authorization. Only scoped server APIs can read or write this configuration.
-- Term placement is independent of assignment deadlines, submissions, grades, mastery and XP.
create table public.course_grading_settings (
  course_id uuid primary key references public.courses(id) on delete cascade,
  terms jsonb not null default '[]' check (jsonb_typeof(terms) = 'array' and jsonb_array_length(terms) <= 40),
  placements jsonb not null default '{}' check (jsonb_typeof(placements) = 'object'),
  revision integer not null check (revision > 0),
  updated_by text not null,
  updated_at timestamptz not null default now()
);
create table public.course_grading_settings_history (
  course_id uuid not null references public.courses(id) on delete cascade,
  revision integer not null,
  terms jsonb not null,
  placements jsonb not null,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  primary key (course_id, revision)
);
alter table public.course_grading_settings enable row level security;
alter table public.course_grading_settings_history enable row level security;
revoke all on public.course_grading_settings, public.course_grading_settings_history from public, anon, authenticated;
grant select, insert, update on public.course_grading_settings to service_role;
grant select, insert on public.course_grading_settings_history to service_role;

create function public.save_course_grading_settings(p_course uuid, p_terms jsonb, p_placements jsonb, p_revision integer, p_owner text, p_actor text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare saved public.course_grading_settings; item jsonb; term_id text; term_name text; start_day date; end_day date; previous_end date; ids text[] := '{}'; names text[] := '{}'; placement record;
begin
  perform 1 from public.courses where id = p_course and lower(teacher_email) = lower(p_owner) and archived_at is null for share;
  if not found then raise exception 'Class unavailable for this account.'; end if;
  if p_actor is null or length(btrim(p_actor)) = 0 or p_revision is null or p_revision < 0 or p_terms is null or jsonb_typeof(p_terms) <> 'array' or p_placements is null or jsonb_typeof(p_placements) <> 'object' then raise exception 'Invalid grading settings.'; end if;
  if jsonb_array_length(p_terms) > 40 or (select count(*) from jsonb_object_keys(p_placements)) > 5000 then raise exception 'Too many terms or placements.'; end if;
  for item in select value from jsonb_array_elements(p_terms) order by value->>'start' loop
    term_id := item->>'id'; term_name := btrim(item->>'name');
    if jsonb_typeof(item) <> 'object' or term_id is null or term_id !~ '^[a-zA-Z0-9_-]{1,80}$' or term_id in ('all','unassigned','auto') or term_id = any(ids) or term_name is null or length(term_name) not between 1 and 60 or lower(term_name) = any(names) then raise exception 'Each term needs a unique name and identifier.'; end if;
    if coalesce(item->>'start','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(item->>'end','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Choose valid term dates.'; end if;
    start_day := (item->>'start')::date; end_day := (item->>'end')::date;
    if start_day < date '2000-01-01' or end_day > date '2199-12-31' or end_day < start_day then raise exception 'Choose a valid start and end date.'; end if;
    if previous_end is not null and start_day <= previous_end then raise exception 'Term dates overlap. Both dates are included.'; end if;
    previous_end := end_day; ids := array_append(ids,term_id); names := array_append(names,lower(term_name));
  end loop;
  for placement in select key,value from jsonb_each_text(p_placements) loop
    if placement.key !~ '^[a-z][a-z-]*:[a-zA-Z0-9:_-]{1,200}$' or placement.value is null or not (placement.value = any(ids)) then raise exception 'Every placement must use an existing term.'; end if;
  end loop;
  perform pg_advisory_xact_lock(hashtextextended('grading-terms:' || p_course::text,0));
  select * into saved from public.course_grading_settings where course_id = p_course for update;
  if found and saved.terms = p_terms and saved.placements = p_placements then return to_jsonb(saved); end if;
  if coalesce(saved.revision,0) <> p_revision then raise exception 'Grading settings changed in another window. Reload before saving.' using errcode = '40001'; end if;
  insert into public.course_grading_settings(course_id,terms,placements,revision,updated_by)
  values(p_course,p_terms,p_placements,p_revision+1,p_actor)
  on conflict(course_id) do update set terms=excluded.terms, placements=excluded.placements, revision=excluded.revision, updated_by=excluded.updated_by, updated_at=now()
  returning * into saved;
  insert into public.course_grading_settings_history(course_id,revision,terms,placements,updated_by,updated_at)
  values(saved.course_id,saved.revision,saved.terms,saved.placements,saved.updated_by,saved.updated_at);
  return to_jsonb(saved);
end $$;
revoke all on function public.save_course_grading_settings(uuid,jsonb,jsonb,integer,text,text) from public, anon, authenticated;
grant execute on function public.save_course_grading_settings(uuid,jsonb,jsonb,integer,text,text) to service_role;
