-- Local Day 1 pilot. No existing assignment, submission, grade or mastery is rewritten.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs)
values ('day-1-foundation-briefing',1,'Day 1 · Foundation: The briefing',array['u1.anchor-know-unknow']);
create table public.daily_lesson_templates (
 key text primary key, foundation_slug text not null unique references public.interactive_assignment_templates(slug),
 review_slug text not null unique references public.interactive_assignment_templates(slug),
 foundation_questions text[] not null, review_questions text[] not null, quiz jsonb not null
);
alter table public.quiz_assignments add column daily_sequence_key text references public.daily_lesson_templates(key);
create table public.daily_lesson_sequences (
 course_id uuid not null references public.courses(id), sequence_key text not null references public.daily_lesson_templates(key),
 foundation_id uuid not null unique references public.interactive_assignments(id), review_id uuid not null unique references public.interactive_assignments(id),
 quiz_id uuid not null unique references public.quiz_assignments(id), primary key(course_id,sequence_key)
);
alter table public.daily_lesson_templates enable row level security;
alter table public.daily_lesson_sequences enable row level security;
revoke all on public.daily_lesson_templates,public.daily_lesson_sequences from public,anon,authenticated;
grant select on public.daily_lesson_templates to service_role;
grant select,insert on public.daily_lesson_sequences to service_role;

-- Daily linked quizzes follow their review's actual Eastern calendar day.
create or replace function public.enforce_quiz_schedule()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.daily_sequence_key is not null then
  if exists(select 1 from daily_lesson_sequences b join interactive_assignments a on a.id=b.review_id where b.quiz_id=new.id and a.due_on is not null and new.due_at is distinct from ((a.due_on::date+time '23:59') at time zone 'America/New_York')) then
   raise exception 'Move the review on the teaching calendar to move its daily quiz.' using errcode='23514';
  end if;
  return new;
 end if;
 if tg_op='UPDATE' and new.due_at is not distinct from old.due_at and new.kind=old.kind then return new;end if;
 if new.due_at is not null and new.due_at is distinct from public.quiz_schedule_due(new.due_at,new.kind='vocabulary') then
  if new.kind='vocabulary' then raise exception 'Vocabulary quizzes are scheduled on Tuesdays and Thursdays.' using errcode='23514';
  else raise exception 'Quizzes are scheduled on Mondays, Wednesdays, and Fridays.' using errcode='23514';end if;
 end if;return new;
end $$;

create function public.schedule_daily_lesson_sequence()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare t daily_lesson_templates;b daily_lesson_sequences;f interactive_assignments;c courses;qid uuid;questions jsonb;deadline timestamptz;
begin
 select * into t from daily_lesson_templates where review_slug=new.slug;
 if not found then return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(new.course_id::text||':'||t.key,0));
 select * into b from daily_lesson_sequences where course_id=new.course_id and sequence_key=t.key;
 if new.due_on is null then
  if found then update quiz_assignments set status='archived',version=version+1,updated_at=now() where id=b.quiz_id and status<>'archived';end if;
  return new;
 end if;
 select * into c from courses where id=new.course_id and program='physics' and archived_at is null;
 if not found then raise exception 'Choose an active Physics class.';end if;
 deadline:=(new.due_on::date+time '23:59') at time zone 'America/New_York';
 insert into interactive_assignments(course_id,slug,target_id,due_on) values(new.course_id,t.foundation_slug,new.target_id,new.due_on)
 on conflict(course_id,slug) do update set due_on=coalesce(interactive_assignments.due_on,excluded.due_on) returning * into f;
 if b.quiz_id is null then
  qid:=gen_random_uuid();
  select jsonb_agg(x||jsonb_build_object('target_id',new.target_id,'id',gen_random_uuid()) order by ordinality) into questions from jsonb_array_elements(t.quiz->'questions') with ordinality a(x,ordinality);
  insert into quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,due_at,status,daily_sequence_key)
  values(qid,new.course_id,c.teacher_email,t.quiz->>'title','understanding',t.quiz->>'instructions','numeric',questions,deadline,'published',t.key);
  insert into daily_lesson_sequences(course_id,sequence_key,foundation_id,review_id,quiz_id) values(new.course_id,t.key,f.id,new.id,qid);
 else
  if exists(select 1 from quiz_assignments where id=b.quiz_id and deleted_at is not null) then raise exception 'Restore the linked daily quiz before rescheduling this review.';end if;
  update quiz_assignments set due_at=deadline,status='published',version=version+1,updated_at=now() where id=b.quiz_id and (due_at is distinct from deadline or status<>'published');
 end if;
 return new;
end $$;
create trigger schedule_daily_lesson after insert or update of due_on on public.interactive_assignments for each row execute function public.schedule_daily_lesson_sequence();

-- Valid immutable submissions, including earlier submitted revisions, satisfy the gate.
-- A draft, partner submission, partial/legacy response, or self-check does not.
create function public.daily_lesson_missing(p_quizzes uuid[],p_user uuid)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('quiz_id',b.quiz_id,'id',a.id,'title',it.title,'role',p.role) order by b.quiz_id,p.role),'[]'::jsonb)
 from daily_lesson_sequences b join daily_lesson_templates t on t.key=b.sequence_key
 cross join lateral (values (b.foundation_id,t.foundation_questions,'foundation'),(b.review_id,t.review_questions,'review')) p(id,keys,role)
 join interactive_assignments a on a.id=p.id and a.course_id=b.course_id join interactive_assignment_templates it on it.slug=a.slug
 where b.quiz_id=any(p_quizzes) and not exists(
  select 1 from interactive_assignment_submissions s where s.assignment_id=a.id and s.user_id=p_user and jsonb_typeof(s.state->'answers')='object'
  and cardinality(p.keys)>0 and not exists(select 1 from unnest(p.keys) k where jsonb_typeof(s.state->'answers'->k) is distinct from 'string' or coalesce(btrim(s.state->'answers'->>k),'')='')
 );
$$;
create function public.enforce_daily_quiz_prerequisites()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if jsonb_array_length(public.daily_lesson_missing(array[new.quiz_id],new.user_id))>0 then raise exception 'Submit both the foundation and the review before opening this quiz.';end if;return new;
end $$;
create trigger daily_quiz_work_gate before insert or update of answers on public.quiz_work for each row execute function public.enforce_daily_quiz_prerequisites();
create trigger daily_quiz_submit_gate before insert on public.quiz_submissions for each row execute function public.enforce_daily_quiz_prerequisites();

create table public.foundation_pairs (
 id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.interactive_assignments(id),
 code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),created_at timestamptz not null default now(),unique(id,assignment_id)
);
create table public.foundation_pair_members (
 pair_id uuid not null,assignment_id uuid not null,user_id uuid not null references public.students(id),slot smallint not null check(slot in(1,2)),
 contribution text check(length(contribution) between 10 and 4000),contributed_at timestamptz,reply text check(length(reply) between 10 and 4000),replied_at timestamptz,
 primary key(assignment_id,user_id),unique(pair_id,slot),foreign key(pair_id,assignment_id) references public.foundation_pairs(id,assignment_id)
);
create index foundation_pair_members_user on public.foundation_pair_members(user_id,assignment_id);
alter table public.foundation_pairs enable row level security;
alter table public.foundation_pair_members enable row level security;
revoke all on public.foundation_pairs,public.foundation_pair_members from public,anon,authenticated;
-- UPDATE privilege permits the row lock that prevents a third student joining.
grant select,insert,update on public.foundation_pairs to service_role;
grant select,insert,update on public.foundation_pair_members to service_role;

create function public.foundation_partner_action(p_assignment uuid,p_user uuid,p_action text,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a interactive_assignments;pair foundation_pairs;m foundation_pair_members;peer foundation_pair_members;count_members integer;
begin
 select a0.* into a from interactive_assignments a0 join courses c on c.id=a0.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
 where a0.id=p_assignment and a0.slug='day-1-foundation-briefing' and a0.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false for share of a0;
 if not found then raise exception 'Assigned foundation unavailable.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user;
 if p_action not in('create','join','share','reply') then raise exception 'Choose a partner action.';end if;
 if p_action in('create','join') and m.pair_id is not null then return jsonb_build_object('ok',true);end if;
 if p_action='create' then
  insert into foundation_pairs(assignment_id) values(p_assignment) returning * into pair;
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot) values(pair.id,p_assignment,p_user,1);
 elsif p_action='join' then
  select * into pair from foundation_pairs where assignment_id=p_assignment and code=upper(btrim(p_text)) for update;
  if not found then raise exception 'Check your partner code and class assignment.';end if;
  select count(*) into count_members from foundation_pair_members where pair_id=pair.id;
  if count_members<>1 then raise exception 'This pair is already full.';end if;
  if not exists(select 1 from foundation_pair_members pm join course_students cs on cs.student_id=pm.user_id and cs.course_id=a.course_id join students s on s.id=pm.user_id where pm.pair_id=pair.id and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Your partner is no longer active in this class.';end if;
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot) values(pair.id,p_assignment,p_user,2);
 else
  if m.pair_id is null then raise exception 'Join your partner first.';end if;
  if length(btrim(p_text)) not between 10 and 4000 then raise exception 'Write an explanation between 10 and 4,000 characters.';end if;
  if p_action='share' then
   if m.contribution is not null and m.contribution<>btrim(p_text) then raise exception 'Your shared explanation is saved. Use your reply and final answer to revise it.';end if;
   update foundation_pair_members set contribution=btrim(p_text),contributed_at=coalesce(contributed_at,now()) where assignment_id=p_assignment and user_id=p_user;
  else
   select * into peer from foundation_pair_members where pair_id=m.pair_id and user_id<>p_user;
   if m.contribution is null or peer.contribution is null then raise exception 'Both partners must share an explanation before replying.';end if;
   if m.reply is not null and m.reply<>btrim(p_text) then raise exception 'Your reply is saved. Continue your revision in the assignment.';end if;
   update foundation_pair_members set reply=btrim(p_text),replied_at=coalesce(replied_at,now()) where assignment_id=p_assignment and user_id=p_user;
  end if;
 end if;
 return jsonb_build_object('ok',true);
end $$;

-- Freeze the attributable partner evidence in each student's own submission.
create function public.capture_foundation_exchange()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;p foundation_pair_members;
begin
 if not exists(select 1 from interactive_assignments where id=new.assignment_id and slug='day-1-foundation-briefing') then return new;end if;
 select * into m from foundation_pair_members where assignment_id=new.assignment_id and user_id=new.user_id;
 select * into p from foundation_pair_members where pair_id=m.pair_id and user_id<>new.user_id;
 if m.contribution is null or m.reply is null or p.contribution is null or p.reply is null then raise exception 'Complete the partner exchange: both partners share an explanation and reply with evidence.';end if;
 new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('pair_id',m.pair_id,'own',to_jsonb(m),'peer',to_jsonb(p)));
 return new;
end $$;
create trigger capture_foundation_exchange before insert on public.interactive_assignment_submissions for each row execute function public.capture_foundation_exchange();
revoke all on function public.schedule_daily_lesson_sequence(),public.daily_lesson_missing(uuid[],uuid),public.enforce_daily_quiz_prerequisites(),public.foundation_partner_action(uuid,uuid,text,text),public.capture_foundation_exchange() from public,anon,authenticated;
grant execute on function public.schedule_daily_lesson_sequence(),public.daily_lesson_missing(uuid[],uuid),public.enforce_daily_quiz_prerequisites(),public.foundation_partner_action(uuid,uuid,text,text),public.capture_foundation_exchange() to service_role;
-- The offline-authored template is appended by scripts/day-one/build-template.ts.
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values ('unit-1-day-1','day-1-foundation-briefing','day-1-the-briefing',array['f1-notice','f1-source','f1-evidence','f1-predict','f1-mismatch','f1-wonders','f1-revise','f1-transfer','f1-question'],array['r2-1a','r2-1b','r2-2a','r2-2b','r2-3a','r2-3b','r2-4a','r2-4b','r2-5a','r2-5b'],'{"title":"Day 1 · Quiz: Evidence and predictions","instructions":"Work independently after completing the foundation and review. Explain uncertainty where asked. Your teacher releases the quiz grade and reviews mastery separately.","questions":[{"kind":"choice","prompt":"A sensor records a cart at 3 m. Which statement is an observation?","options":["The sensor reading is 3 m","The cart will always stay at 3 m","The cart must be accelerating","The next reading will be 6 m"],"correct_index":0,"guide":"The current sensor reading is observed; the other claims go beyond it.","points":1,"demand":{"blooms":"Remember","dok":1,"evidence":"Recognizes a recorded observation."}},{"kind":"choice","prompt":"A rover is at 1, 4, and 7 m at successive one-second times. If the same pattern continues, what is its next position?","options":["8 m","9 m","10 m","14 m"],"correct_index":2,"guide":"Each interval adds 3 m; 7 + 3 = 10 m.","points":1,"demand":{"blooms":"Apply","dok":2,"evidence":"Extends a constant-change pattern in a new example."}},{"kind":"choice","prompt":"A forecast shows a range of possible future positions. What does the range represent?","options":["The physical width of the object","Limits in measurements and the prediction model","A guarantee of impact","Proof that no measurements were taken"],"correct_index":1,"guide":"A range communicates uncertainty, not object size or certainty of impact.","points":1,"demand":{"blooms":"Understand","dok":1,"evidence":"Interprets uncertainty in a prediction."}},{"kind":"choice","prompt":"Which question needs human priorities as well as physics evidence?","options":["Where is the object now?","How far did it travel in one hour?","How should limited mission funding be shared?","How did its measured position change?"],"correct_index":2,"guide":"Funding allocation involves values and resources, as well as evidence.","points":1,"demand":{"blooms":"Analyze","dok":2,"evidence":"Distinguishes measurable quantities from a decision involving values."}},{"kind":"written","prompt":"A model predicts a rover at 10 m. A new reading is 8 m. Describe two plausible explanations and one additional check that would help distinguish them. Explain why that check helps.","guide":"Changing motion or a measurement/timing problem; repeat or independently verify position and time, explaining how results distinguish the explanations. Keep the unexpected reading.","points":3,"demand":{"blooms":"Evaluate","dok":3,"evidence":"Evaluates alternative explanations and defends an evidence-gathering choice."}},{"kind":"written","prompt":"“The object is moving toward us, so we know where it will be tomorrow.” Evaluate this claim. Identify two missing measurements and one assumption or model limit that matters.","guide":"Approaching alone is insufficient. Position and velocity including direction, plus elapsed time, support a prediction; changing velocity/gravity and measurement uncertainty limit a constant-motion forecast.","points":3,"demand":{"blooms":"Analyze","dok":2,"evidence":"Connects missing information and model assumptions to a prediction’s limits."}}]}'::jsonb);
