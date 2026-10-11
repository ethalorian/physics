-- Teaching context is separate from the canonical lesson-word binding, so
-- connecting a set to a deck never moves word IDs or removes lesson content.
alter table public.vocabulary_sets add column teaching_source jsonb;
alter table public.vocabulary_sets add constraint vocabulary_teaching_source_valid check (
 teaching_source is null or coalesce(
  jsonb_typeof(teaching_source)='object' and (
   teaching_source='{"kind":"none"}'::jsonb or
   (teaching_source->>'kind'='video' and teaching_source->>'lesson_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') or
   (teaching_source->>'kind'='deck' and teaching_source->>'unit_id' ~ '^unit-[0-9]+$'
    and jsonb_typeof(teaching_source->'day')='number' and teaching_source->>'day' ~ '^[1-9][0-9]*$'
    and teaching_source->>'track' in ('cpa','honors'))
  ),false)
);
create or replace function public.update_vocabulary_set(p_set uuid, p_expected timestamptz, p_patch jsonb, p_terms jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.vocabulary_sets;
begin
 select * into s from public.vocabulary_sets where id=p_set for update;
 if not found then raise exception 'Vocabulary set not found'; end if;
 if s.updated_at is distinct from p_expected then raise exception using errcode='40001',message='Vocabulary changed in another editor. Reload before saving; your edits are still here.'; end if;
 select * into s from jsonb_populate_record(s,p_patch - 'id' - 'created_at' - 'created_by' - 'updated_at');
 update public.vocabulary_sets set name=s.name,description=s.description,unit_id=s.unit_id,lesson_id=s.lesson_id,teaching_source=s.teaching_source,published=s.published,updated_at=clock_timestamp() where id=p_set;
 if p_terms is not null then perform public.save_vocab_terms(p_set,p_terms); end if;
 select * into s from public.vocabulary_sets where id=p_set;
 return to_jsonb(s);
end $$;
revoke all on function public.update_vocabulary_set(uuid,timestamptz,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.update_vocabulary_set(uuid,timestamptz,jsonb,jsonb) to service_role;
comment on column public.vocabulary_sets.teaching_source is 'Optional video lesson or Course Plans deck connection. Null preserves legacy lesson context. Does not itself publish or assign words.';
