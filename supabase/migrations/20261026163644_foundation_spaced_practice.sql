-- Future calendar placements only. Existing dates, work and grades are not backfilled.
-- School days are weekdays excluding the school's saved closure dates; these are
-- calendar dates, not elapsed 24-hour periods or a class's rotating meeting blocks.
create function public.lesson_school_day_shift(p_day date,p_count integer)
returns date language plpgsql stable strict security invoker set search_path=public,pg_temp as $$
declare result date:=p_day; remaining integer:=abs(p_count); direction integer:=case when p_count<0 then -1 else 1 end; closures text[];
begin
 if remaining>366 then raise exception 'School-day offset is too large.';end if;
 select coalesce(no_school_dates::text[],array[]::text[]) into closures from rotation_calendar where id='default';
 while remaining>0 loop
  result:=result+direction;
  if extract(isodow from result)<6 and not (result::text=any(coalesce(closures,array[]::text[]))) then remaining:=remaining-1;end if;
 end loop;
 return result;
end $$;

create or replace function public.schedule_daily_lesson_sequence()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare t daily_lesson_templates;b daily_lesson_sequences;c courses;other_id uuid;fid uuid;rid uuid;qid uuid;
 foundation_day date;review_day date;other_slug text;other_day date;questions jsonb;deadline timestamptz;
begin
 -- Only this trigger writes the companion assignment. Do not let that write
 -- recursively reinterpret the companion as a second calendar placement.
 if pg_trigger_depth()>1 then return new;end if;
 select * into t from daily_lesson_templates where new.slug in (foundation_slug,review_slug);
 if not found then return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(new.course_id::text||':'||t.key,0));
 select * into b from daily_lesson_sequences where course_id=new.course_id and sequence_key=t.key;
 if new.due_on is null then
  if b.quiz_id is not null then
   update interactive_assignments set due_on=null where id in (b.foundation_id,b.review_id) and id<>new.id and due_on is not null;
   update quiz_assignments set status='archived',version=version+1,updated_at=now() where id=b.quiz_id and status<>'archived';
  end if;
  return new;
 end if;
 select * into c from courses where id=new.course_id and program='physics' and archived_at is null;
 if not found then raise exception 'Choose an active Physics class.';end if;
 if new.slug=t.foundation_slug then
  foundation_day:=new.due_on;review_day:=public.lesson_school_day_shift(foundation_day,3);
  other_slug:=t.review_slug;other_day:=review_day;
 else
  review_day:=new.due_on;foundation_day:=public.lesson_school_day_shift(review_day,-3);
  other_slug:=t.foundation_slug;other_day:=foundation_day;
 end if;
 if foundation_day<'2000-01-01'::date or review_day>'2100-12-31'::date then raise exception 'Choose dates between 2000 and 2100 for the whole lesson sequence.';end if;
 insert into interactive_assignments(course_id,slug,target_id,due_on) values(new.course_id,other_slug,new.target_id,other_day)
 on conflict(course_id,slug) do update set due_on=excluded.due_on returning id into other_id;
 fid:=case when new.slug=t.foundation_slug then new.id else other_id end;
 rid:=case when new.slug=t.review_slug then new.id else other_id end;
 deadline:=(review_day+time '23:59') at time zone 'America/New_York';
 if b.quiz_id is null then
  qid:=gen_random_uuid();
  select jsonb_agg(x||jsonb_build_object('target_id',new.target_id,'id',gen_random_uuid()) order by ordinality) into questions from jsonb_array_elements(t.quiz->'questions') with ordinality a(x,ordinality);
  insert into quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,due_at,status,daily_sequence_key)
  values(qid,new.course_id,c.teacher_email,t.quiz->>'title','understanding',t.quiz->>'instructions','numeric',questions,deadline,'published',t.key);
  insert into daily_lesson_sequences(course_id,sequence_key,foundation_id,review_id,quiz_id) values(new.course_id,t.key,fid,rid,qid);
 else
  if b.foundation_id<>fid or b.review_id<>rid then raise exception 'The linked lesson assignments changed. Reload the calendar.';end if;
  if exists(select 1 from quiz_assignments where id=b.quiz_id and deleted_at is not null) then raise exception 'Restore the linked daily quiz before rescheduling this lesson.';end if;
  update quiz_assignments set due_at=deadline,status='published',version=version+1,updated_at=now() where id=b.quiz_id and (due_at is distinct from deadline or status<>'published');
 end if;
 return new;
end $$;

-- Reuse the exact immutable-submission rule already used for quizzes. No
-- teacher grade, partner submission, current draft or self-check can unlock it.
create function public.daily_review_missing(p_reviews uuid[],p_user uuid)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg((m.value-'quiz_id')||jsonb_build_object('assignment_id',b.review_id)),'[]'::jsonb)
 from daily_lesson_sequences b
 cross join lateral jsonb_array_elements(public.daily_lesson_missing(array[b.quiz_id],p_user)) m(value)
 where b.review_id=any(p_reviews) and m.value->>'role'='foundation';
$$;
create function public.enforce_daily_review_prerequisites()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if jsonb_array_length(public.daily_review_missing(array[new.assignment_id],new.user_id))>0 then
  raise exception 'Submit your foundation before opening this review.';
 end if;
 return new;
end $$;
create trigger daily_review_work_gate before insert or update of state on public.interactive_assignment_work for each row execute function public.enforce_daily_review_prerequisites();
create trigger daily_review_submit_gate before insert on public.interactive_assignment_submissions for each row execute function public.enforce_daily_review_prerequisites();

-- Atomic direct-calendar placement, sharing the course lock used by the teaching
-- calendar. An existing assignment keeps its original target and all evidence.
create function public.set_interactive_assignment_date(p_course uuid,p_slug text,p_target uuid,p_due date,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a interactive_assignments;
begin
 perform 1 from courses where id=p_course and teacher_email=p_owner and program='physics' and archived_at is null for update;
 if not found then raise exception 'Class unavailable.';end if;
 if p_due is null then
  update interactive_assignments set due_on=null where course_id=p_course and slug=p_slug returning * into a;
 else
  if p_due<'2000-01-01'::date or p_due>'2100-12-31'::date or not exists(select 1 from learning_targets where id=p_target and program='physics') then raise exception 'Choose a valid Physics target and due date.';end if;
  insert into interactive_assignments(course_id,slug,target_id,due_on) values(p_course,p_slug,p_target,p_due)
  on conflict(course_id,slug) do update set due_on=excluded.due_on returning * into a;
 end if;
 return case when a.id is null then null else to_jsonb(a) end;
end $$;

revoke all on function public.lesson_school_day_shift(date,integer),public.daily_review_missing(uuid[],uuid),public.enforce_daily_review_prerequisites(),public.set_interactive_assignment_date(uuid,text,uuid,date,text) from public,anon,authenticated;
grant execute on function public.lesson_school_day_shift(date,integer),public.daily_review_missing(uuid[],uuid),public.enforce_daily_review_prerequisites(),public.set_interactive_assignment_date(uuid,text,uuid,date,text) to service_role;
