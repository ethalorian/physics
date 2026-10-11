-- Repair only the unit metadata for videos 4–8. Release windows and student work stay intact.
BEGIN;
DO $$
DECLARE
  video_ids uuid[] := ARRAY['7456e6c4-fd01-455f-b0a2-e8e1a0f65304','df1acb44-9f62-45cf-9270-1f1a2d413505','c1f8c609-88ad-4d42-93ce-25ae2b0c8206','685abc3e-737c-4572-9be2-928f8fd7a707','f2770d7c-8494-4808-9ba2-fb463bd47508']::uuid[];
  canonical_name text;
  windows_before jsonb;
BEGIN
  SELECT name INTO STRICT canonical_name FROM public.units WHERE id='unit-1';
  IF (SELECT count(*) FROM public.lessons WHERE id=ANY(video_ids) AND content_blocks->>'presentation'='physics-path') <> 5 THEN
    RAISE EXCEPTION 'Expected the five canonical video lessons';
  END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id),'[]') INTO windows_before FROM public.lesson_class_windows w WHERE w.lesson_id=ANY(ARRAY(SELECT id::text FROM public.lessons WHERE id=ANY(video_ids)));
  -- The existing sync_lesson_unit_id trigger derives unit_id from the display name.
  UPDATE public.lessons SET unit=canonical_name,unit_id='unit-1' WHERE id=ANY(video_ids);
  IF (SELECT count(*) FROM public.lessons WHERE id=ANY(video_ids) AND unit_id='unit-1') <> 5 THEN
    RAISE EXCEPTION 'Video unit repair failed';
  END IF;
  IF windows_before IS DISTINCT FROM (SELECT coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id),'[]') FROM public.lesson_class_windows w WHERE w.lesson_id=ANY(ARRAY(SELECT id::text FROM public.lessons WHERE id=ANY(video_ids)))) THEN
    RAISE EXCEPTION 'Release windows changed';
  END IF;
END $$;
COMMIT;
