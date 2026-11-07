-- All wardrobe items are free, including the former mastery rewards.
UPDATE public.avatar_items
SET cost_xp = 0, unlock_target_id = NULL, unlock_min_level = NULL
WHERE cost_xp IS DISTINCT FROM 0 OR unlock_target_id IS NOT NULL OR unlock_min_level IS NOT NULL;

ALTER TABLE public.avatar_items
  ALTER COLUMN cost_xp SET DEFAULT 0,
  ALTER COLUMN unlock_min_level DROP DEFAULT,
  ADD CONSTRAINT avatar_wardrobe_is_free CHECK (
    cost_xp IS NOT DISTINCT FROM 0 AND unlock_target_id IS NULL AND unlock_min_level IS NULL
  );

-- Keep the RPC signature and response compatible with already-open dressing rooms.
CREATE OR REPLACE FUNCTION public.purchase_avatar_item(
  p_user_id uuid, p_email text, p_slug text, p_staff boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  grant_source text := CASE WHEN p_staff THEN 'admin_grant' ELSE 'unlock' END;
  result jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM public.student_owned_items WHERE user_id = p_user_id AND item_slug = p_slug) THEN
    result := jsonb_build_object('already_owned', true);
  ELSE
    PERFORM 1 FROM public.avatar_items WHERE slug = p_slug AND enabled FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'UNKNOWN_ITEM'; END IF;

    INSERT INTO public.student_owned_items (user_id, item_slug, source)
    VALUES (p_user_id, p_slug, grant_source)
    ON CONFLICT (user_id, item_slug) DO NOTHING;
    result := CASE WHEN FOUND THEN jsonb_build_object('source', grant_source)
                   ELSE jsonb_build_object('already_owned', true) END;
  END IF;

  RETURN result || jsonb_build_object('ok', true, 'balance', public.economy_totals(p_user_id)->'balance');
END;
$$;
