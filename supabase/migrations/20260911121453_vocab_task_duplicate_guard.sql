-- Preserve existing assignments and evidence, including historical duplicates.
-- New/changed active assignments receive a unique key. Existing rows are checked
-- by the trigger; a unique index handles concurrent new requests atomically.
create function public.vocab_word_selection(ids uuid[]) returns text language sql immutable set search_path='' as $$
 select string_agg(id::text,',' order by id) from (select distinct unnest(ids) id) w;
$$;
alter table public.vocab_tasks add column duplicate_guard text;
create unique index vocab_tasks_no_new_duplicates on public.vocab_tasks(course_id,duplicate_guard) where active;
create function public.guard_vocab_task_duplicate() returns trigger language plpgsql set search_path='' as $$
begin
 if not new.active then return new; end if;
 if TG_OP='UPDATE' then
  if old.active and old.course_id=new.course_id and old.term_ids=new.term_ids then return new; end if;
 end if;
 new.duplicate_guard:=public.vocab_word_selection(new.term_ids);
 if exists(select 1 from public.vocab_tasks t where t.active and t.course_id=new.course_id and t.id<>new.id and public.vocab_word_selection(t.term_ids)=new.duplicate_guard) then
  raise exception 'Words already assigned to this class' using errcode='23505';
 end if;
 return new;
end $$;
create trigger vocab_tasks_duplicate_guard before insert or update of active,term_ids,course_id on public.vocab_tasks for each row execute function public.guard_vocab_task_duplicate();
revoke all on function public.vocab_word_selection(uuid[]),public.guard_vocab_task_duplicate() from public,anon,authenticated;
grant execute on function public.vocab_word_selection(uuid[]),public.guard_vocab_task_duplicate() to service_role;
