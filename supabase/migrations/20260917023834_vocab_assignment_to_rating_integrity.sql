-- Starting a check twice resumes one unfinished attempt. Completed practice
-- checks remain append-only; quiz attempts keep their existing lifetime guard.
create unique index vocab_one_unfinished_check
  on public.vocab_checks(task_id,user_id) where completed_at is null;

-- The same words can support a different audience or quiz format. Keep exact
-- duplicates protected in both the trigger (historical rows) and unique index.
create or replace function public.guard_vocab_task_duplicate() returns trigger
language plpgsql set search_path='' as $$
begin
 if not new.active then return new; end if;
 if TG_OP='UPDATE' then
  if old.active and old.course_id=new.course_id and old.term_ids=new.term_ids
   and old.task_kind=new.task_kind and old.student_ids=new.student_ids
   and old.quiz_format is not distinct from new.quiz_format then return new; end if;
 end if;
 new.duplicate_guard:=new.task_kind||':'||coalesce(new.quiz_format,'')||':'||
   public.vocab_word_selection(new.term_ids)||':'||coalesce(public.vocab_word_selection(new.student_ids),'');
 if exists(select 1 from public.vocab_tasks t where t.active and t.course_id=new.course_id
   and t.task_kind=new.task_kind and t.quiz_format is not distinct from new.quiz_format and t.id<>new.id
   and public.vocab_word_selection(t.term_ids)=public.vocab_word_selection(new.term_ids)
   and public.vocab_word_selection(t.student_ids)=public.vocab_word_selection(new.student_ids)) then
  raise exception 'These words and assessment format are already assigned to these students' using errcode='23505';
 end if;
 return new;
end $$;
create or replace trigger vocab_tasks_duplicate_guard
 before insert or update of active,term_ids,course_id,task_kind,student_ids,quiz_format
 on public.vocab_tasks for each row execute function public.guard_vocab_task_duplicate();
