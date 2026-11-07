-- Paper practice planning only. Selecting or printing never submits work or grades it.
create table public.student_choice_selections (
 assignment_id uuid not null references public.student_choice_assignments(id),
 user_id uuid not null references public.students(id),
 option_numbers smallint[] not null,
 version integer not null check(version > 0),
 updated_at timestamptz not null default now(),
 primary key(assignment_id,user_id),
 check(array_ndims(option_numbers)=1 and array_lower(option_numbers,1)=1 and cardinality(option_numbers)=3
   and option_numbers[1] between 1 and 6 and option_numbers[2] between 1 and 6 and option_numbers[3] between 1 and 6
   and option_numbers[1]<option_numbers[2] and option_numbers[2]<option_numbers[3]
   and array_position(option_numbers,null) is null)
);
alter table public.student_choice_selections enable row level security;
revoke all on public.student_choice_selections from public,anon,authenticated,service_role;
grant select,insert,update on public.student_choice_selections to service_role;

create function public.save_student_choice_selection(p_id uuid,p_user uuid,p_options integer[],p_version integer)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.student_choice_assignments;s public.student_choice_selections;ordered smallint[];
begin
 select w.* into a from public.student_choice_assignments w join public.courses c on c.id=w.course_id
 where w.id=p_id and c.program='physics' and c.archived_at is null for share of w,c;
 if not found or a.status<>'published' then raise exception 'This Student Choice assignment is not open for changes.';end if;
 if not exists(select 1 from public.course_students cs join public.students st on st.id=cs.student_id
  where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false)
 then raise exception 'Student is not assigned to this class.';end if;
 if p_version is null or p_version<0 or p_options is null or array_ndims(p_options)<>1 or cardinality(p_options)<>3
  or exists(select 1 from unnest(p_options)n where n is null or n not between 1 and 6)
  or (select count(distinct n) from unnest(p_options)n)<>3
 then raise exception 'Choose exactly three different options from the six available.';end if;
 select array_agg(n::smallint order by n) into ordered from unnest(p_options)n;
 -- Same lock as manual review: receipt and selection changes cannot race.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text||':'||p_user::text,0));
 select * into s from public.student_choice_selections where assignment_id=p_id and user_id=p_user for update;
 if found and s.version=p_version+1 and s.option_numbers=ordered then return to_jsonb(s);end if;
 if exists(select 1 from public.student_choice_reviews where assignment_id=p_id and user_id=p_user and state<>'not_received')
 then raise exception 'Your teacher has recorded this paper. Ask your teacher before changing choices.';end if;
 if coalesce(s.version,0)<>p_version then raise exception 'Your choices changed in another tab. Reload before saving.';end if;
 insert into public.student_choice_selections(assignment_id,user_id,option_numbers,version)
 values(p_id,p_user,ordered,p_version+1)
 on conflict(assignment_id,user_id) do update set option_numbers=excluded.option_numbers,version=excluded.version,updated_at=now()
 returning * into s;
 return to_jsonb(s);
end $$;
revoke all on function public.save_student_choice_selection(uuid,uuid,integer[],integer) from public,anon,authenticated;
grant execute on function public.save_student_choice_selection(uuid,uuid,integer[],integer) to service_role;
