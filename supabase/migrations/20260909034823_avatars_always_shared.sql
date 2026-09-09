-- Mandatory sharing; retain the field for older clients.
ALTER TABLE public.student_avatars ALTER COLUMN gallery_visible SET DEFAULT true;
UPDATE public.student_avatars SET gallery_visible=true WHERE NOT gallery_visible;
ALTER TABLE public.student_avatars ADD CONSTRAINT student_avatars_always_shared CHECK (gallery_visible);

CREATE OR REPLACE FUNCTION public.save_avatar_state(p_user_id uuid,p_revision integer,p_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE a public.student_avatars%ROWTYPE; pair record; look jsonb; alias_value text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('avatar:'||p_user_id::text));
 SELECT * INTO a FROM public.student_avatars WHERE user_id=p_user_id FOR UPDATE;
 IF COALESCE(a.revision,0)<>p_revision THEN RAISE EXCEPTION 'AVATAR_CONFLICT'; END IF;
 INSERT INTO public.student_avatars(user_id) VALUES(p_user_id) ON CONFLICT DO NOTHING;
 IF p_patch ? 'equipped' THEN
   FOR pair IN SELECT key,value FROM jsonb_each_text(p_patch->'equipped') LOOP
     IF NOT EXISTS(SELECT 1 FROM public.student_owned_items o JOIN public.avatar_items i ON i.slug=o.item_slug WHERE o.user_id=p_user_id AND i.slug=pair.value AND i.slot=pair.key) THEN RAISE EXCEPTION 'ITEM_NOT_OWNED'; END IF;
   END LOOP;
 END IF;
 IF p_patch ? 'saved_looks' THEN
   IF jsonb_typeof(p_patch->'saved_looks')<>'array' OR jsonb_array_length(p_patch->'saved_looks')>6 THEN RAISE EXCEPTION 'INVALID_LOOKS'; END IF;
   FOR look IN SELECT value FROM jsonb_array_elements(p_patch->'saved_looks') LOOP
     FOR pair IN SELECT key,value FROM jsonb_each_text(look->'equipped') LOOP
       IF NOT EXISTS(SELECT 1 FROM public.student_owned_items o JOIN public.avatar_items i ON i.slug=o.item_slug WHERE o.user_id=p_user_id AND i.slug=pair.value AND i.slot=pair.key) THEN RAISE EXCEPTION 'ITEM_NOT_OWNED'; END IF;
     END LOOP;
   END LOOP;
 END IF;
 IF p_patch ? 'alias' THEN
   alias_value := nullif(btrim(p_patch->>'alias'),'');
   -- Serialize alias choices, including case-insensitive clashes, without an
   -- index migration that could fail on existing duplicate legacy aliases.
   PERFORM pg_advisory_xact_lock(hashtext('avatar-alias'));
   IF alias_value IS NOT NULL AND EXISTS(SELECT 1 FROM public.students WHERE id<>p_user_id AND lower(btrim(alias))=lower(alias_value)) THEN RAISE EXCEPTION 'ALIAS_TAKEN'; END IF;
   UPDATE public.students SET alias=alias_value WHERE id=p_user_id;
 END IF;
 UPDATE public.student_avatars SET
   traits=COALESCE(traits,'{}')||COALESCE(p_patch->'traits','{}'),
   equipped=COALESCE(p_patch->'equipped',equipped),
   saved_looks=COALESCE(p_patch->'saved_looks',saved_looks),
   setup_completed=setup_completed OR COALESCE((p_patch->>'complete')::boolean,false),
   use_custom_avatar=use_custom_avatar OR COALESCE((p_patch->>'complete')::boolean,false),
   gallery_visible=true,
   revision=revision+1,updated_at=now()
 WHERE user_id=p_user_id RETURNING * INTO a;
 RETURN to_jsonb(a);
END;
$$;

