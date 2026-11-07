-- Preserve legacy evidence; recognize the exact supported shortened question contract.
-- No assignment, date, draft, submission, mastery, or grade rows are rewritten.
create or replace function public.foundation_required_question_ids(p_slug text,p_state jsonb,p_original text[])
returns text[] language sql immutable security invoker set search_path=public,pg_temp as $$
 select case when c.ids is null then p_original
  when p_state->>'foundationQuestionEdition'='cpa-v1' then c.ids
  when exists(select 1 from unnest(p_original) k where not(k=any(c.ids)) and (p_state->'answers') ? k) then p_original
  else c.ids end
 from (select 1) seed left join (values
 ('day-1-foundation-briefing',array['f1-source','f1-evidence','f1-predict','f1-wonders','f1-question']),
 ('day-2-foundation-motion',array['f2-position','f2-distance','f2-walk','f2-track','f2-transfer']),
 ('day-3-foundation-velocity',array['f3-predict','f3-trials','f3-slopes','f3-revise','f3-transfer','f3-exit']),
 ('day-4-foundation-vectors',array['f4-axis','f4-area','f4-diagonal','f4-model','f4-exit-vector']),
 ('day-5-foundation-prediction',array['f5-start','f5-endpoint','f5-claim','f5-bound','f5-exit-window']),
 ('day-6-foundation-vector-tools',array['f6-translate','f6-add','f6-components','f6-quadrant','f6-exit-sum']),
 ('day-7-foundation-acceleration',array['f7-definition','f7-rate','f7-graph','f7-signs','f7-exit-transfer']),
 ('day-8-foundation-kinematics',array['f8-equation','f8-select','f8-braking','f8-reversal','f8-exit-stop']),
 ('day-9-foundation-inertia',array['f9-law','f9-demo','f9-balance','f9-passenger','f9-exit-transfer'])
 ) c(slug,ids) on c.slug=p_slug;
$$;
revoke all on function public.foundation_required_question_ids(text,jsonb,text[]) from public,anon,authenticated;
grant execute on function public.foundation_required_question_ids(text,jsonb,text[]) to service_role;

create or replace function public.daily_lesson_missing(p_quizzes uuid[],p_user uuid)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('quiz_id',b.quiz_id,'id',a.id,'title',it.title,'role',p.role) order by b.quiz_id,p.role),'[]'::jsonb)
 from daily_lesson_sequences b join daily_lesson_templates t on t.key=b.sequence_key
 cross join lateral (values (b.foundation_id,t.foundation_questions,'foundation'),(b.review_id,t.review_questions,'review')) p(id,keys,role)
 join interactive_assignments a on a.id=p.id and a.course_id=b.course_id join interactive_assignment_templates it on it.slug=a.slug
 where b.quiz_id=any(p_quizzes) and not exists(
  select 1 from interactive_assignment_submissions s where s.assignment_id=a.id and s.user_id=p_user and jsonb_typeof(s.state->'answers')='object'
  and cardinality(p.keys)>0 and not exists(
   select 1 from unnest(case when p.role='foundation' then public.foundation_required_question_ids(a.slug,s.state,p.keys) else p.keys end) k
   where jsonb_typeof(s.state->'answers'->k) is distinct from 'string' or coalesce(btrim(s.state->'answers'->>k),'')='')
 );
$$;
revoke all on function public.daily_lesson_missing(uuid[],uuid) from public,anon,authenticated;
grant execute on function public.daily_lesson_missing(uuid[],uuid) to service_role;
