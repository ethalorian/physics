-- Link readings to lessons without changing submissions or mastery.
alter table public.textbook_assignments add column if not exists origin_key text;
create index if not exists textbook_assignments_origin_key_idx on public.textbook_assignments(origin_key text_pattern_ops) where origin_key is not null;
CREATE OR REPLACE FUNCTION public.save_textbook_assignment(p_assignment jsonb, p_actor text, p_owner text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare a public.textbook_assignments; c public.courses; q jsonb;
begin
  select * into c from public.courses where id=(p_assignment->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
  if not found then raise exception 'This class is unavailable.'; end if;

  if p_assignment->>'origin_key' is not null then
    if p_assignment->>'origin_key' !~* '^lesson:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[^[:space:]]{1,160}$' then
      raise exception 'Invalid lesson reading link.';
    end if;
    if not exists (
      select 1 from public.lessons l join public.units u on u.id=l.unit_id
      cross join lateral jsonb_array_elements(coalesce(l.content_blocks->'blocks','[]'::jsonb)) b
      where l.id=split_part(p_assignment->>'origin_key',':',2)::uuid
      and b->>'id'=substring(p_assignment->>'origin_key' from 45)
      and b->>'type'='reading' and coalesce(u.program,'physics')=coalesce(c.program,'physics')
      and (l.visibility_track is null or l.visibility_track=coalesce(c.track,'cpa'))
      and (b->>'visibilityTrack' is null or b->>'visibilityTrack'=coalesce(c.track,'cpa'))
    ) then raise exception 'This lesson reading is not available for this class.'; end if;
  end if;
  if p_assignment->>'status' not in ('draft','published') then raise exception 'Invalid assignment state.'; end if;
  if jsonb_typeof(p_assignment->'questions') is distinct from 'array' or jsonb_array_length(p_assignment->'questions') not between 1 and 30 then raise exception 'Add 1–30 questions.'; end if;
  for q in select value from jsonb_array_elements(p_assignment->'questions') loop
    if not exists(select 1 from public.learning_targets where id=(q->>'target_id')::uuid and coalesce(program,'physics')=coalesce(c.program,'physics') and not exclude_from_growth) then raise exception 'Choose mastery targets from this class curriculum.'; end if;
  end loop;
  -- Serializes first-save retries, too: row locks alone cannot lock a missing row.
  perform pg_advisory_xact_lock(hashtextextended(p_assignment->>'id',0));
  select * into a from public.textbook_assignments where id=(p_assignment->>'id')::uuid for update;
  if found then
    -- Same payload + previous version is an exact retry after a lost response.
    if a.origin_key is not distinct from (p_assignment->>'origin_key') and a.course_id=c.id and a.version=(p_assignment->>'version')::integer+1 and a.title=p_assignment->>'title' and a.chapter=(p_assignment->>'chapter')::integer and a.reading=p_assignment->>'reading' and a.section_ids=array(select jsonb_array_elements_text(p_assignment->'section_ids')) and a.instructions=p_assignment->>'instructions' and a.questions=p_assignment->'questions' and a.due_at is not distinct from (p_assignment->>'due_at')::timestamptz and a.status=p_assignment->>'status' then return to_jsonb(a); end if;
    if a.course_id<>c.id or a.status<>'draft' or a.version<>(p_assignment->>'version')::integer then raise exception 'This assignment changed. Reload it before saving.'; end if;
    update public.textbook_assignments set origin_key=p_assignment->>'origin_key',title=p_assignment->>'title',chapter=(p_assignment->>'chapter')::integer,reading=p_assignment->>'reading',section_ids=array(select jsonb_array_elements_text(p_assignment->'section_ids')),instructions=p_assignment->>'instructions',questions=p_assignment->'questions',due_at=(p_assignment->>'due_at')::timestamptz,status=p_assignment->>'status',version=version+1,updated_at=now() where id=a.id returning * into a;
  else
    if (p_assignment->>'version')::integer<>0 then raise exception 'Assignment unavailable.'; end if;
    insert into public.textbook_assignments(id,origin_key,course_id,created_by,title,chapter,reading,section_ids,instructions,questions,due_at,status)
    values ((p_assignment->>'id')::uuid,p_assignment->>'origin_key',c.id,p_actor,p_assignment->>'title',(p_assignment->>'chapter')::integer,p_assignment->>'reading',array(select jsonb_array_elements_text(p_assignment->'section_ids')),p_assignment->>'instructions',p_assignment->'questions',(p_assignment->>'due_at')::timestamptz,p_assignment->>'status') returning * into a;
  end if;
  return to_jsonb(a);
end $function$
;

