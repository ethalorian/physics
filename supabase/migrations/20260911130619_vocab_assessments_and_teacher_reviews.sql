alter table public.vocab_tasks add column task_kind text not null default 'practice' check(task_kind in ('practice','quiz'));
alter table public.vocab_tasks add column quiz_format text check(quiz_format in ('multiple_choice','matching','recall','definition','sentence','quiz_game'));
alter table public.vocab_tasks add constraint vocab_quiz_format_required check((task_kind='practice' and quiz_format is null) or (task_kind='quiz' and quiz_format is not null));
alter table public.vocab_checks add column quiz_guard boolean not null default false;
alter table public.vocab_checks add column review_version integer not null default 0;
alter table public.vocab_checks add column reviewed_by text;
alter table public.vocab_checks add column reviewed_at timestamptz;
create unique index vocab_quiz_one_attempt on public.vocab_checks(task_id,user_id) where quiz_guard;
create function public.set_vocab_quiz_guard() returns trigger language plpgsql set search_path='' as $$
begin
 select task_kind='quiz' into new.quiz_guard from public.vocab_tasks where id=new.task_id;
 return new;
end $$;
create trigger vocab_quiz_guard before insert on public.vocab_checks for each row execute function public.set_vocab_quiz_guard();
revoke all on function public.set_vocab_quiz_guard() from public,anon,authenticated;
grant execute on function public.set_vocab_quiz_guard() to service_role;
create or replace function public.guard_vocab_task_duplicate() returns trigger language plpgsql set search_path='' as $$
begin
 if not new.active then return new; end if;
 if TG_OP='UPDATE' then
  if old.active and old.course_id=new.course_id and old.term_ids=new.term_ids and old.task_kind=new.task_kind then return new; end if;
 end if;
 new.duplicate_guard:=new.task_kind||':'||public.vocab_word_selection(new.term_ids);
 if exists(select 1 from public.vocab_tasks t where t.active and t.course_id=new.course_id and t.task_kind=new.task_kind and t.id<>new.id and public.vocab_word_selection(t.term_ids)=public.vocab_word_selection(new.term_ids)) then
  raise exception 'Words already assigned in this assignment type' using errcode='23505';
 end if;
 return new;
end $$;
drop trigger vocab_tasks_duplicate_guard on public.vocab_tasks;
create trigger vocab_tasks_duplicate_guard before insert or update of active,term_ids,course_id,task_kind on public.vocab_tasks for each row execute function public.guard_vocab_task_duplicate();
