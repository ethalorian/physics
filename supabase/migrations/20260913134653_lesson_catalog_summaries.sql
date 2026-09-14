-- Compact, live authoring summaries; no student data and no public API grants.
create or replace view public.lesson_catalog_summary with (security_invoker = true) as
select l.id, l.slug, l.title, l.unit, l.unit_id, l.lesson_number, l.published,
       l.visibility_track, l.estimated_time, l.planned_days, l.updated_at,
       md5(coalesce(l.content_blocks::text, 'null')) as content_fingerprint,
       jsonb_array_length(case when jsonb_typeof(l.content_blocks->'blocks') = 'array' then l.content_blocks->'blocks' else '[]'::jsonb end) as block_count,
       coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
         'id', b->'id', 'type', b->'type', 'capture', b->'capture',
         'visibilityTrack', b->'visibilityTrack', 'targetId', b->'targetId',
         'targetIds', b->'targetIds', 'targets', b->'targets'
       ))) from jsonb_array_elements(case when jsonb_typeof(l.content_blocks->'blocks') = 'array' then l.content_blocks->'blocks' else '[]'::jsonb end) b), '[]'::jsonb) as block_summary
from public.lessons l;
revoke all on public.lesson_catalog_summary from public, anon, authenticated;
grant select on public.lesson_catalog_summary to service_role;

create or replace view public.review_catalog_summary with (security_invoker = true) as
select id, target_id, status, created_at,
       jsonb_array_length(case when jsonb_typeof(questions)='array' then questions else '[]'::jsonb end) as question_count
from public.target_reviews;
revoke all on public.review_catalog_summary from public, anon, authenticated;
grant select on public.review_catalog_summary to service_role;
