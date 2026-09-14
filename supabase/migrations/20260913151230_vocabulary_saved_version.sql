create or replace function public.save_lesson_vocabulary(p_lesson uuid, p_expected timestamptz, p_terms jsonb, p_published boolean default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare s public.vocabulary_sets; l public.lessons; next_version timestamptz := clock_timestamp();
begin
 select * into l from public.lessons where id=p_lesson for update;
 if not found then raise exception 'Lesson not found'; end if;
 select * into s from public.vocabulary_sets where lesson_id=p_lesson::text for update;
 if found then
  if s.updated_at is distinct from p_expected then raise exception using errcode='40001',message='Vocabulary changed in another editor. Reload before saving; your edits are still available.'; end if;
 else
  if p_expected is not null then raise exception using errcode='40001',message='Vocabulary set changed. Reload before saving.'; end if;
  insert into public.vocabulary_sets(name,lesson_id,unit_id,published) values(l.title || ' vocabulary',p_lesson::text,l.unit_id,false) returning * into s;
 end if;
 perform public.save_vocab_terms(s.id,p_terms);
 update public.vocabulary_sets set unit_id=l.unit_id,published=coalesce(p_published,s.published,false),updated_at=next_version where id=s.id returning updated_at into next_version;
 return jsonb_build_object('setId',s.id,'updated_at',next_version,'published',coalesce(p_published,s.published,false));
end $$;
revoke all on function public.save_lesson_vocabulary(uuid,timestamptz,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_lesson_vocabulary(uuid,timestamptz,jsonb,boolean) to service_role;
