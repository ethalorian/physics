create or replace function public.update_vocabulary_set(p_set uuid, p_expected timestamptz, p_patch jsonb, p_terms jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.vocabulary_sets;
begin
 select * into s from public.vocabulary_sets where id=p_set for update;
 if not found then raise exception 'Vocabulary set not found'; end if;
 if s.updated_at is distinct from p_expected then raise exception using errcode='40001',message='Vocabulary changed in another editor. Reload before saving; your edits are still here.'; end if;
 select * into s from jsonb_populate_record(s,p_patch - 'id' - 'created_at' - 'created_by' - 'updated_at');
 update public.vocabulary_sets set name=s.name,description=s.description,unit_id=s.unit_id,lesson_id=s.lesson_id,published=s.published,updated_at=clock_timestamp() where id=p_set;
 if p_terms is not null then perform public.save_vocab_terms(p_set,p_terms); end if;
 select * into s from public.vocabulary_sets where id=p_set;
 return to_jsonb(s);
end $$;
revoke all on function public.update_vocabulary_set(uuid,timestamptz,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.update_vocabulary_set(uuid,timestamptz,jsonb,jsonb) to service_role;
alter table public.lesson_plan_links add column verification_kind text not null default 'reviewed' check (verification_kind in ('baseline','reviewed'));
