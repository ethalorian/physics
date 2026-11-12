-- The original assignment edition and all saved option numbers stay pinned.
alter table public.student_choice_assignments add column available_choices integer not null default 6 check (available_choices between 1 and 10);
alter table public.student_choice_assignments drop constraint student_choice_assignments_required_choices_check,
 add constraint student_choice_assignments_required_choices_check check(required_choices between 1 and available_choices);
create or replace function public.valid_student_choice_options(options smallint[]) returns boolean
language sql immutable security invoker set search_path=public,pg_temp as $$
 select coalesce(array_ndims(options)=1 and array_lower(options,1)=1 and cardinality(options) between 1 and 10
 and not exists(select 1 from unnest(options)n where n is null or n not between 1 and 10)
 and options = array(select distinct n from unnest(options)n order by n),false)
$$;
revoke all on function public.valid_student_choice_options(smallint[]) from public,anon,authenticated;
grant execute on function public.valid_student_choice_options(smallint[]) to service_role;
drop function public.save_student_choice_assignment(uuid,uuid,text,text,text,integer,text,text,timestamptz,text,integer,text,text,integer);
create function public.save_student_choice_assignment(p_id uuid,p_course uuid,p_packet text,p_packet_version text,p_unit text,p_day integer,p_edition text,p_title text,p_due timestamptz,p_status text,p_version integer,p_actor text,p_owner text,p_required integer default null,p_available integer default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.student_choice_assignments; required integer; capacity integer;
begin
 if p_actor is null or btrim(p_actor)='' or not exists(select 1 from public.courses where id=p_course and lower(teacher_email)=lower(p_owner) and program='physics' and archived_at is null) then raise exception 'Choose your own active Physics class.';end if;
 if p_due is null or p_status is null or p_status not in ('published','archived') or p_version is null or p_version<0 or p_day is null or p_day<1 or p_edition is null or p_edition not in ('cpa','honors') or p_packet is null or p_packet_version is null or p_title is null or btrim(p_title)='' then raise exception 'Invalid Student Choice assignment.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into a from public.student_choice_assignments where id=p_id for update;
 required := coalesce(p_required,a.required_choices,3);
 capacity := coalesce(a.available_choices,p_available,6);
 if capacity not between 1 and 10 or required not between 1 and capacity then raise exception 'Choose a required practice count from 1 to %.',capacity;end if;
 if p_available is not null and p_available<>capacity then raise exception 'An assigned page edition cannot be replaced.';end if;
 if found then
  if a.course_id<>p_course or a.packet_key<>p_packet or a.packet_version<>p_packet_version or a.unit_id<>p_unit or a.day<>p_day or a.edition<>p_edition or a.title<>p_title then raise exception 'An assigned page edition cannot be replaced. Create a new assignment.';end if;
  if a.version=p_version+1 and a.due_at=p_due and a.status=p_status and a.required_choices=required then return to_jsonb(a);end if;
  if a.version<>p_version then raise exception 'This assignment changed. Reload before saving.';end if;
  update public.student_choice_assignments set due_at=p_due,status=p_status,required_choices=required,version=version+1,updated_at=now() where id=p_id returning * into a;
 else
  if p_version<>0 or p_status<>'published' then raise exception 'Reload before saving.';end if;
  insert into public.student_choice_assignments(id,course_id,unit_id,day,edition,title,packet_key,packet_version,due_at,status,created_by,required_choices,available_choices)
  values(p_id,p_course,p_unit,p_day,p_edition,p_title,p_packet,p_packet_version,p_due,p_status,p_actor,required,capacity) returning * into a;
 end if;
 return to_jsonb(a);
end $$;
revoke all on function public.save_student_choice_assignment(uuid,uuid,text,text,text,integer,text,text,timestamptz,text,integer,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.save_student_choice_assignment(uuid,uuid,text,text,text,integer,text,text,timestamptz,text,integer,text,text,integer,integer) to service_role;
create or replace function public.save_student_choice_selection(p_id uuid,p_user uuid,p_options integer[],p_version integer)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.student_choice_assignments;s public.student_choice_selections;ordered smallint[];
begin
 select w.* into a from public.student_choice_assignments w join public.courses c on c.id=w.course_id
 where w.id=p_id and c.program='physics' and c.archived_at is null for share of w,c;
 if not found or a.status<>'published' then raise exception 'This Student Choice assignment is not open for changes.';end if;
 if not exists(select 1 from public.course_students cs join public.students st on st.id=cs.student_id
  where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false)
 then raise exception 'Student is not assigned to this class.';end if;
 if p_version is null or p_version<0 or p_options is null or array_ndims(p_options)<>1 or cardinality(p_options)<>a.required_choices
  or exists(select 1 from unnest(p_options)n where n is null or n not between 1 and a.available_choices)
  or (select count(distinct n) from unnest(p_options)n)<>a.required_choices
 then raise exception 'This assignment requires exactly % different practice pages. Reload the assignment if the requirement changed.',a.required_choices;end if;
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
