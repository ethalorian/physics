create or replace function public.quiz_student_action(p_quiz uuid,p_user uuid,p_action text,p_answers jsonb,p_version integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments;w public.quiz_work;s public.quiz_submissions;q jsonb;e record;k text;
begin
 select * into a from public.quiz_assignments where id=p_quiz and status='published' for share;
 if not found or (a.student_ids is not null and not p_user=any(a.student_ids)) or not exists(select 1 from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null) then raise exception 'This quiz is unavailable.';end if;
 if p_action not in ('save','submit') or p_request is null or p_version<0 then raise exception 'Invalid quiz action.';end if;
 if jsonb_typeof(p_answers) is distinct from 'object' or octet_length(p_answers::text)>800000 then raise exception 'Invalid answers.';end if;
 for e in select * from jsonb_each(p_answers) loop
  select value into q from jsonb_array_elements(a.questions) where value->>'id'=e.key;
  if not found then raise exception 'Answer does not belong to this quiz.';end if;
  if q->>'kind'='problem' then
   if jsonb_typeof(e.value) is distinct from 'object' or exists(select 1 from jsonb_object_keys(e.value) key where key not in ('model','plan','work','answer')) then raise exception 'Invalid problem response.';end if;
   foreach k in array array['model','plan','work','answer'] loop
    if jsonb_typeof(e.value->k) is distinct from 'string' or length(e.value->>k)>10000 or (p_action='submit' and btrim(e.value->>k)='') then raise exception 'Complete Model, Plan, Work and Answer.';end if;
   end loop;
  else
   if jsonb_typeof(e.value) is distinct from 'string' or length(e.value#>>'{}')>10000 or (p_action='submit' and btrim(e.value#>>'{}')='') then raise exception 'Add a response to every question.';end if;
   if q->>'kind'='choice' and e.value#>>'{}'<>'' and not exists(select 1 from jsonb_array_elements(q->'options') with ordinality o where (o.ordinality-1)::text=e.value#>>'{}') then raise exception 'Choose an available answer.';end if;
  end if;
 end loop;
 insert into public.quiz_work(quiz_id,user_id) values(a.id,p_user) on conflict do nothing;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=p_user for update;
 if p_action='submit' then
  select * into s from public.quiz_submissions where id=p_request;
  if found then
   if s.quiz_id<>a.id or s.user_id<>p_user or s.answers<>p_answers then raise exception 'Submission request changed.';end if;
   return to_jsonb(w);
  end if;
 end if;
 if w.version<>p_version then raise exception 'Your work changed in another window. Keep a copy of your answers, then reload.';end if;
 if w.state not in ('in_progress','returned') then raise exception 'This quiz is already submitted.';end if;
 if p_action='submit' then
  if exists(select 1 from jsonb_array_elements(a.questions) question_row(value) where not p_answers ? (question_row.value->>'id')) then raise exception 'Answer every question before submitting.';end if;
  insert into public.quiz_submissions(id,quiz_id,user_id,answers,snapshot) values(p_request,a.id,p_user,p_answers,to_jsonb(a));
 end if;
 update public.quiz_work set answers=p_answers,state=case when p_action='submit' then 'submitted' else w.state end,submission_id=case when p_action='submit' then p_request else w.submission_id end,version=version+1,updated_at=now() where quiz_id=a.id and user_id=p_user returning * into w;
 return to_jsonb(w);
end $$;

create or replace function public.review_quiz_submission(p_submission uuid,p_request uuid,p_actor text,p_owner text,p_decision text,p_scores jsonb,p_ratings jsonb,p_note text,p_question_notes jsonb,p_grade_value text,p_draft_version integer default 0)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments;w public.quiz_work;s public.quiz_submissions;r public.quiz_reviews;q jsonb;e record;earned numeric:=0;possible numeric:=0;score numeric;
begin
 select * into s from public.quiz_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable.';end if;
 select a0.* into a from public.quiz_assignments a0 join public.courses c on c.id=a0.course_id where a0.id=s.quiz_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of a0;
 if not found or not exists(select 1 from public.course_students where course_id=a.course_id and student_id=s.user_id and enrollment_state='ACTIVE') then raise exception 'Student is not in your class.';end if;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=s.user_id for update;
 select * into r from public.quiz_reviews where id=p_request;
 if found then
  if r.submission_id<>s.id or r.reviewer_email<>p_actor or r.decision<>p_decision or r.scores<>p_scores or r.ratings<>p_ratings or r.note<>p_note or r.question_notes<>p_question_notes or r.grade_value is distinct from p_grade_value then raise exception 'Review request changed.';end if;
  return to_jsonb(r);
 end if;
 if coalesce((select version from public.quiz_review_drafts where submission_id=s.id),0)<>p_draft_version then raise exception 'The review draft changed in another window. Reload before returning the grade.';end if;
 if w.state<>'submitted' or w.submission_id<>s.id then raise exception 'This attempt has already been reviewed. Reload the roster.';end if;
 if p_decision not in ('graded','returned') or p_note is null or length(btrim(p_note)) not between 1 and 3000 or jsonb_typeof(p_scores) is distinct from 'object' or jsonb_typeof(p_ratings) is distinct from 'object' or jsonb_typeof(p_question_notes) is distinct from 'object' then raise exception 'Add feedback and complete this review.';end if;
 for e in select * from jsonb_each(p_question_notes) loop
  if jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000 or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'id'=e.key) then raise exception 'Invalid question feedback.';end if;
 end loop;
 if p_decision='returned' then
  if p_ratings<>'{}' or p_scores<>'{}' or p_grade_value is not null then raise exception 'Request revision without grades or mastery ratings.';end if;
  earned:=null;possible:=null;
 else
  if exists(select 1 from jsonb_each(p_ratings) rating_row where rating_row.value not in ('null'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb) or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'target_id'=rating_row.key)) then raise exception 'Rate assessed targets using 1–3 or not enough evidence.';end if;
  if exists(select 1 from jsonb_each(p_scores) rating_row where not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'id'=rating_row.key and question_row.value->>'kind'<>'choice')) then raise exception 'Automatic question scores cannot be changed.';end if;
  for q in select value from jsonb_array_elements(s.snapshot->'questions') loop
   if not p_ratings ? (q->>'target_id') then raise exception 'Make a mastery decision for every assessed target.';end if;
   possible:=possible+(q->>'points')::numeric;
   if q->>'kind'='choice' then score:=case when s.answers->>(q->>'id')=q->>'correct_index' then (q->>'points')::numeric else 0 end;
   else
    if jsonb_typeof(p_scores->(q->>'id')) is distinct from 'number' then raise exception 'Score every written response.';end if;
    score:=(p_scores->>(q->>'id'))::numeric;
    if score<0 or score>(q->>'points')::numeric or score*2<>trunc(score*2) then raise exception 'Invalid written score.';end if;
   end if;
   earned:=earned+score;
  end loop;
  if (a.grade_mode='numeric' and p_grade_value is not null) or (a.grade_mode='letter' and (p_grade_value is null or p_grade_value not in ('A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F'))) or (a.grade_mode='credit' and (p_grade_value is null or p_grade_value not in ('credit','no_credit'))) then raise exception 'Choose the quiz grade.';end if;
 end if;
 insert into public.quiz_reviews(id,submission_id,reviewer_email,decision,scores,ratings,note,question_notes,earned,possible,grade_mode,grade_value)
 values(p_request,s.id,p_actor,p_decision,p_scores,p_ratings,p_note,p_question_notes,earned,possible,a.grade_mode,p_grade_value) returning * into r;
 if p_decision='graded' then
  insert into public.mastery_records(user_id,user_email,target_id,level,rated_by,evidence_source)
  select s.user_id,st.email,rating_row.key::uuid,(rating_row.value::text)::smallint,p_actor,'Quiz: '||(s.snapshot->>'title')||' · submission '||s.id::text from jsonb_each(p_ratings) rating_row cross join public.students st where st.id=s.user_id and rating_row.value<>'null'::jsonb;
 end if;
 update public.quiz_work set state=p_decision,version=version+1,updated_at=now() where quiz_id=a.id and user_id=s.user_id;
 return to_jsonb(r);
end $$;

create or replace function public.save_quiz_review_draft(p_submission uuid,p_actor text,p_owner text,p_payload jsonb,p_version integer)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.quiz_submissions;a public.quiz_assignments;w public.quiz_work;d public.quiz_review_drafts;e record;q jsonb;
begin
 select * into s from public.quiz_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable.';end if;
 select a0.* into a from public.quiz_assignments a0 join public.courses c on c.id=a0.course_id where a0.id=s.quiz_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of a0;
 if not found or not exists(select 1 from public.course_students where course_id=a.course_id and student_id=s.user_id and enrollment_state='ACTIVE') then raise exception 'Student is not in your class.';end if;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=s.user_id for update;
 if w.state<>'submitted' or w.submission_id<>s.id then raise exception 'This attempt has already been reviewed.';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>100000 or jsonb_typeof(p_payload->'scores') is distinct from 'object' or jsonb_typeof(p_payload->'ratings') is distinct from 'object' or jsonb_typeof(p_payload->'question_notes') is distinct from 'object' or jsonb_typeof(p_payload->'note') is distinct from 'string' or length(p_payload->>'note')>3000 then raise exception 'Invalid review draft.';end if;
 for e in select * from jsonb_each(p_payload->'scores') loop
  select value into q from jsonb_array_elements(s.snapshot->'questions') where value->>'id'=e.key and value->>'kind'<>'choice';
  if not found or jsonb_typeof(e.value)<>'number' then raise exception 'Invalid draft score.';end if;
  if (e.value::text)::numeric<0 or (e.value::text)::numeric>(q->>'points')::numeric or (e.value::text)::numeric*2<>trunc((e.value::text)::numeric*2) then raise exception 'Invalid draft score.';end if;
 end loop;
 if exists(select 1 from jsonb_each(p_payload->'ratings') rating_row where rating_row.value not in ('null'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb) or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'target_id'=rating_row.key)) then raise exception 'Invalid draft mastery decision.';end if;
 for e in select * from jsonb_each(p_payload->'question_notes') loop
  if jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000 or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'id'=e.key) then raise exception 'Invalid question feedback.';end if;
 end loop;
 select * into d from public.quiz_review_drafts where submission_id=s.id for update;
 if found then
  if d.version=p_version+1 and d.payload=p_payload and d.reviewer_email=p_actor then return to_jsonb(d);end if;
  if d.version<>p_version then raise exception 'Review draft changed in another window. Reload before saving.';end if;
  update public.quiz_review_drafts set payload=p_payload,reviewer_email=p_actor,version=version+1,updated_at=now() where submission_id=s.id returning * into d;
 else
  if p_version<>0 then raise exception 'Review draft unavailable.';end if;
  insert into public.quiz_review_drafts(submission_id,reviewer_email,payload) values(s.id,p_actor,p_payload) returning * into d;
 end if;
 return to_jsonb(d);
end $$;