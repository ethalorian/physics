alter table public.vocabulary_terms add column if not exists contexts jsonb not null default '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.save_vocab_terms(p_set uuid, p_terms jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare item jsonb; oldrow public.vocabulary_terms; termrow public.vocabulary_terms; keep uuid[] := '{}'; tid uuid;
begin
 perform 1 from public.vocabulary_sets where id=p_set for update;
 if not found then raise exception 'Unknown vocabulary set'; end if;
 if jsonb_typeof(p_terms) <> 'array' then raise exception 'Terms must be an array'; end if;
 for item in select value from jsonb_array_elements(p_terms) loop
  if nullif(trim(item->>'term'),'') is null then raise exception 'A word is required'; end if;
  tid := null;
  if (item->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
   tid := (item->>'id')::uuid;
   select * into oldrow from public.vocabulary_terms where id=tid and vocabulary_set_id=p_set;
   if not found then raise exception 'Word does not belong to this set; reload before saving'; end if;
  else
   select * into oldrow from public.vocabulary_terms where vocabulary_set_id=p_set and lower(trim(term))=lower(trim(item->>'term')) order by archived,id limit 1;
   if found then tid:=oldrow.id; end if;
  end if;
  if tid=any(keep) then raise exception 'Duplicate word'; end if;
  if tid is null then
   insert into public.vocabulary_terms(vocabulary_set_id,term,definition) values(p_set,trim(item->>'term'),coalesce(item->>'definition','')) returning * into oldrow;
   tid:=oldrow.id;
  end if;
  select * into termrow from jsonb_populate_record(oldrow,item - 'id' - 'vocabulary_set_id' - 'created_at');
  update public.vocabulary_terms set term=trim(termrow.term),definition=termrow.definition,
   category=termrow.category,difficulty=termrow.difficulty,tier=termrow.tier,cognate=termrow.cognate,
   definition_es=termrow.definition_es,icon=termrow.icon,example=termrow.example,
   part_of_speech=termrow.part_of_speech,image_url=termrow.image_url,translations=termrow.translations,contexts=termrow.contexts,
   order_index=cardinality(keep),archived=false,updated_at=now() where id=tid;
  keep:=array_append(keep,tid);
 end loop;
 update public.vocabulary_terms set archived=true where vocabulary_set_id=p_set and not(id=any(keep));
end $function$

;
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
 update public.vocabulary_sets set unit_id=l.unit_id,published=coalesce(p_published,s.published,false),updated_at=next_version where id=s.id;
 return jsonb_build_object('setId',s.id,'updated_at',next_version,'published',coalesce(p_published,s.published,false));
end $$;
revoke all on function public.save_lesson_vocabulary(uuid,timestamptz,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_lesson_vocabulary(uuid,timestamptz,jsonb,boolean) to service_role;
