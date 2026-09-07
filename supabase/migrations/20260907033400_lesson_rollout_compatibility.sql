-- Keep actual legacy reviews made during rollout; explicit submissions never auto-review.
create or replace function public.bridge_legacy_lesson_review()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
declare event jsonb:=to_jsonb(new); actor uuid; action_at timestamptz;
begin
 actor:=(event->>'user_id')::uuid;
 if tg_table_name='mastery_records' then
  action_at:=(event->>'observed_at')::timestamptz;
  insert into public.lesson_reviews(user_id,lesson_id,submission_id,reviewer_email,reviewed_at)
  select s.user_id::text,s.lesson_id,s.id,coalesce(event->>'rated_by','legacy-review'),action_at
  from public.lesson_submissions s join public.learning_targets t on t.id=(event->>'target_id')::uuid
  where s.user_id=actor and s.review_policy='legacy' and s.submitted_at<action_at
  and (t.lesson_id=s.lesson_id::text or exists (
   select 1 from public.lessons l cross join lateral jsonb_array_elements(coalesce(l.content_blocks->'blocks','[]')) b
   where l.id=s.lesson_id and (b->>'targetId' in(t.slug,t.id::text) or coalesce(b->'targetIds','[]') ? t.slug or coalesce(b->'targetIds','[]') ? t.id::text)
  )) on conflict(submission_id) do nothing;
 elsif event->>'item_type'='lesson' and event->>'graded_at' is not null then
  action_at:=(event->>'graded_at')::timestamptz;
  insert into public.lesson_reviews(user_id,lesson_id,submission_id,reviewer_email,reviewed_at)
  select s.user_id::text,s.lesson_id,s.id,'legacy-gradebook',action_at
  from public.lesson_submissions s
  where s.user_id=actor and s.lesson_id::text=event->>'item_id' and s.review_policy='legacy' and s.submitted_at<action_at
  on conflict(submission_id) do nothing;
 end if;
 return new;
end $$;
revoke all on function public.bridge_legacy_lesson_review() from public,anon,authenticated;
grant execute on function public.bridge_legacy_lesson_review() to service_role;
drop trigger if exists bridge_legacy_mastery_review on public.mastery_records;
create trigger bridge_legacy_mastery_review after insert on public.mastery_records for each row execute function public.bridge_legacy_lesson_review();
drop trigger if exists bridge_legacy_gradebook_review on public.gradebook_entries;
create trigger bridge_legacy_gradebook_review after insert or update of graded_at on public.gradebook_entries for each row execute function public.bridge_legacy_lesson_review();

-- Snapshot the authored math attribution in the same transaction as the answer.
do $$
declare definition text;
begin
 select pg_get_functiondef('public.capture_lesson_submission()'::regprocedure) into definition;
 if position('br.math_competency_ids' in definition)=0 then
  if position('br.response_mode,br.scaffolds_used' in definition)=0 then raise exception 'Snapshot function changed; review migration'; end if;
  definition:=replace(definition,'br.response_mode,br.scaffolds_used','br.math_competency_ids,br.response_mode,br.scaffolds_used');
  execute definition;
 end if;
end $$;
