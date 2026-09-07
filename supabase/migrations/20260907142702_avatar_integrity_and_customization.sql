-- Avatar drafts, atomic purchases, and one shared spend contract. Respects M-1/A-2.
-- Existing portraits remain intact. Gallery publication now requires explicit opt-in.
ALTER TABLE public.student_avatars ADD COLUMN revision integer NOT NULL DEFAULT 0;
ALTER TABLE public.student_avatars ADD COLUMN gallery_visible boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_avatars ADD COLUMN saved_looks jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.avatar_items ADD COLUMN render_options jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.avatar_items ADD CONSTRAINT avatar_price_nonnegative CHECK (cost_xp IS NULL OR cost_xp >= 0);
ALTER TABLE public.avatar_items ADD CONSTRAINT avatar_eligibility_exclusive CHECK (cost_xp IS NULL OR unlock_target_id IS NULL);
ALTER TABLE public.avatar_items ADD CONSTRAINT avatar_unlock_range CHECK (unlock_min_level IS NULL OR unlock_min_level BETWEEN 1 AND 3);
CREATE INDEX IF NOT EXISTS avatar_likes_target_idx ON public.avatar_likes(target_user_id);
CREATE INDEX IF NOT EXISTS owned_items_slug_idx ON public.student_owned_items(item_slug);

-- Same caps, UTC day boundary, and Math.round semantics as points.ts (floor(x+.5)).
-- VOLATILE gives a fresh snapshot after the transaction lock has been acquired.
CREATE OR REPLACE FUNCTION public.economy_totals(p_user_id uuid)
RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
 WITH earned AS (
 SELECT floor((
   COALESCE((SELECT sum(least(25, d.points)) FROM (
     SELECT (created_at AT TIME ZONE 'UTC')::date AS day,
       sum(least(25, floor(COALESCE(score,0)::numeric / 10 + .5))) AS points
     FROM public.vocabulary_game_scores WHERE user_id = p_user_id GROUP BY 1
   ) d),0)
   + COALESCE((SELECT sum(floor(COALESCE(progress_percentage,0)::numeric / 4 + .5) + 5 * COALESCE(video_questions_correct,0)) FROM public.lesson_progress WHERE user_id=p_user_id),0)
   + COALESCE((SELECT sum(least(40,COALESCE(score,0))) FROM public.submissions WHERE user_id=p_user_id AND status='graded'),0)
   + COALESCE((SELECT sum(points) FROM public.math_spine_point_grants WHERE user_id=p_user_id),0)
   + COALESCE((SELECT sum(points) FROM public.economy_point_grants WHERE user_id=p_user_id),0)
 ) + .5) AS total
 ), spent AS (SELECT COALESCE(sum(cost_points),0) AS total FROM public.reward_redemptions WHERE user_id=p_user_id AND status IS DISTINCT FROM 'denied')
 SELECT jsonb_build_object('lifetimeEarned',earned.total,'spent',spent.total,'balance',earned.total-spent.total) FROM earned,spent;
$$;

-- Protect every writer, including re-approval of denied redemptions. Refunds and
-- already-committed status transitions do not require new funds.
CREATE OR REPLACE FUNCTION public.guard_economy_spend()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE old_cost numeric := 0; new_cost numeric; available numeric;
BEGIN
 IF NEW.cost_points < 0 THEN RAISE EXCEPTION 'INVALID_COST'; END IF;
 IF TG_OP='UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
   -- Staff identity merges transfer an existing debit together with earnings.
   -- Lock both wallets in canonical order; this is not a new purchase.
   PERFORM pg_advisory_xact_lock(hashtext('redeem:' || least(OLD.user_id::text,NEW.user_id::text)));
   PERFORM pg_advisory_xact_lock(hashtext('redeem:' || greatest(OLD.user_id::text,NEW.user_id::text)));
   IF NEW.cost_points IS DISTINCT FROM OLD.cost_points OR NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'INVALID_TRANSFER'; END IF;
   RETURN NEW;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext('redeem:' || NEW.user_id::text));
 IF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM 'denied' THEN old_cost := COALESCE(OLD.cost_points,0); END IF;
 new_cost := CASE WHEN NEW.status='denied' THEN 0 ELSE COALESCE(NEW.cost_points,0) END;
 IF new_cost > old_cost THEN
   available := (public.economy_totals(NEW.user_id)->>'balance')::numeric;
   IF available < new_cost-old_cost THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS:%:%',available,new_cost-old_cost; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER economy_spend_guard BEFORE INSERT OR UPDATE ON public.reward_redemptions
FOR EACH ROW EXECUTE FUNCTION public.guard_economy_spend();

CREATE OR REPLACE FUNCTION public.redeem_reward(p_user_id text,p_user_email text,p_reward_id text)
RETURNS SETOF public.reward_redemptions LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE r public.rewards%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('redeem:' || p_user_id::uuid::text));
 SELECT * INTO r FROM public.rewards WHERE id=p_reward_id::uuid FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'REWARD_NOT_FOUND'; END IF;
 IF NOT r.active OR r.grant_lesson_id IS NOT NULL OR r.category='Car Part' THEN RAISE EXCEPTION 'REWARD_INACTIVE'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.store_reward_placements p JOIN public.course_students c ON c.course_id=p.course_id WHERE c.student_id=p_user_id::uuid AND c.enrollment_state='ACTIVE' AND p.reward_id=r.id) THEN RAISE EXCEPTION 'REWARD_INACTIVE'; END IF;
 RETURN QUERY INSERT INTO public.reward_redemptions(user_id,user_email,reward_id,reward_name,cost_points,status)
 VALUES(p_user_id::uuid,p_user_email,r.id,r.name,r.cost_points,'pending') RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.avatar_target_level(p_user_id uuid,p_target_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE v numeric; r record;
BEGIN
 FOR r IN SELECT level FROM public.mastery_records WHERE user_id=p_user_id AND target_id=p_target_id ORDER BY observed_at,id LOOP
   v := CASE WHEN v IS NULL THEN r.level ELSE .4*v+.6*r.level END;
 END LOOP;
 RETURN COALESCE(v,0);
END;
$$;

-- Ownership itself is the idempotency key: one permanent grant per user/slug.
CREATE OR REPLACE FUNCTION public.purchase_avatar_item(p_user_id uuid,p_email text,p_slug text,p_staff boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE item public.avatar_items%ROWTYPE; source text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('redeem:' || p_user_id::text));
 IF EXISTS (SELECT 1 FROM public.student_owned_items WHERE user_id=p_user_id AND item_slug=p_slug) THEN
   RETURN jsonb_build_object('ok',true,'already_owned',true,'balance',public.economy_totals(p_user_id)->'balance');
 END IF;
 SELECT * INTO item FROM public.avatar_items WHERE slug=p_slug AND enabled FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'UNKNOWN_ITEM'; END IF;
 IF p_staff THEN source := 'admin_grant';
 ELSIF item.unlock_target_id IS NOT NULL THEN
   IF public.avatar_target_level(p_user_id,item.unlock_target_id) < COALESCE(item.unlock_min_level,2.5) THEN RAISE EXCEPTION 'MASTERY_REQUIRED'; END IF;
   source := 'unlock';
 ELSIF item.cost_xp IS NOT NULL THEN
   INSERT INTO public.reward_redemptions(user_id,user_email,reward_name,cost_points,status,fulfilled_at,fulfilled_by,note)
   VALUES(p_user_id,p_email,'Avatar item: '||item.name,item.cost_xp,'fulfilled',now(),'system','avatar:'||p_slug);
   source := 'purchase';
 ELSE RAISE EXCEPTION 'ITEM_UNAVAILABLE'; END IF;
 INSERT INTO public.student_owned_items(user_id,item_slug,source) VALUES(p_user_id,p_slug,source);
 RETURN jsonb_build_object('ok',true,'source',source,'balance',public.economy_totals(p_user_id)->'balance');
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_arcade_play(p_user_id uuid,p_email text,p_slug text,p_staff boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE g public.arcade_games%ROWTYPE; freebie boolean := false; cost integer := 0; redemption uuid; play uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('redeem:' || p_user_id::text));
 SELECT * INTO g FROM public.arcade_games WHERE slug=p_slug AND enabled FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'UNKNOWN_ITEM'; END IF;
 freebie := NOT p_staff AND g.cost_xp>0 AND NOT EXISTS(SELECT 1 FROM public.arcade_plays WHERE user_id=p_user_id);
 IF NOT p_staff AND NOT freebie THEN cost := g.cost_xp; END IF;
 IF cost>0 THEN
   INSERT INTO public.reward_redemptions(user_id,user_email,reward_name,cost_points,status,fulfilled_at,fulfilled_by,note)
   VALUES(p_user_id,p_email,'Arcade credit — '||g.name,cost,'fulfilled',now(),'system','arcade:'||p_slug) RETURNING id INTO redemption;
 END IF;
 INSERT INTO public.arcade_plays(user_id,user_email,game_slug,redemption_id,status,meta)
 VALUES(p_user_id,p_email,p_slug,redemption,'active',CASE WHEN p_staff THEN '{"staff":true}'::jsonb WHEN freebie THEN '{"freebie":true}'::jsonb ELSE '{}'::jsonb END) RETURNING id INTO play;
 RETURN jsonb_build_object('playId',play,'costXp',cost,'balance',CASE WHEN p_staff THEN NULL ELSE public.economy_totals(p_user_id)->'balance' END,'staff',p_staff,'freebie',freebie);
END;
$$;

-- Atomic revisioned patch. Validation of bounded trait values is performed by
-- the server route; ownership is checked here for both equipped and saved looks.
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
   gallery_visible=COALESCE((p_patch->>'gallery_visible')::boolean,gallery_visible),
   revision=revision+1,updated_at=now()
 WHERE user_id=p_user_id RETURNING * INTO a;
 IF a.gallery_visible AND NOT a.setup_completed THEN RAISE EXCEPTION 'COMPLETE_AVATAR_FIRST'; END IF;
 RETURN to_jsonb(a);
END;
$$;

-- Explicit state is idempotent. Scope/visibility checked within the transaction.
CREATE OR REPLACE FUNCTION public.set_avatar_like(p_user_id uuid,p_target uuid,p_liked boolean,p_role text,p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 IF p_target=p_user_id THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
 PERFORM 1 FROM public.student_avatars WHERE user_id=p_target AND setup_completed AND gallery_visible FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.course_students t JOIN public.students s ON s.id=t.student_id WHERE t.student_id=p_target AND t.enrollment_state='ACTIVE' AND s.is_active AND (
   p_role='admin' OR (p_role='teacher' AND EXISTS(SELECT 1 FROM public.courses c WHERE c.id=t.course_id AND c.teacher_email=p_email)) OR
   (p_role='student' AND EXISTS(SELECT 1 FROM public.course_students me WHERE me.student_id=p_user_id AND me.course_id=t.course_id AND me.enrollment_state='ACTIVE'))
 )) THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('avatar-like:'||p_user_id::text||':'||p_target::text));
 IF p_liked THEN INSERT INTO public.avatar_likes(liker_user_id,target_user_id) VALUES(p_user_id,p_target) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.avatar_likes WHERE liker_user_id=p_user_id AND target_user_id=p_target; END IF;
 RETURN jsonb_build_object('liked',p_liked);
END;
$$;

-- All functions are server-only; no client-supplied roles can call these RPCs.
REVOKE ALL ON FUNCTION public.economy_totals(uuid), public.guard_economy_spend(), public.redeem_reward(text,text,text), public.avatar_target_level(uuid,uuid), public.purchase_avatar_item(uuid,text,text,boolean), public.purchase_arcade_play(uuid,text,text,boolean), public.save_avatar_state(uuid,integer,jsonb), public.set_avatar_like(uuid,uuid,boolean,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.economy_totals(uuid), public.guard_economy_spend(), public.redeem_reward(text,text,text), public.avatar_target_level(uuid,uuid), public.purchase_avatar_item(uuid,text,text,boolean), public.purchase_arcade_play(uuid,text,text,boolean), public.save_avatar_state(uuid,integer,jsonb), public.set_avatar_like(uuid,uuid,boolean,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.avatar_gallery_page(p_user_id uuid,p_role text,p_email text,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT COALESCE(jsonb_agg(to_jsonb(page)),'[]') FROM (
 SELECT a.user_id, COALESCE(NULLIF(s.alias,''),NULLIF(s.first_name,''),split_part(s.name,' ',1),'Student') AS name,
   a.traits,a.equipped, a.user_id=p_user_id AS is_me,
   CASE WHEN a.user_id=p_user_id THEN (SELECT count(*) FROM public.avatar_likes l WHERE l.target_user_id=a.user_id) ELSE NULL END AS likes,
   EXISTS(SELECT 1 FROM public.avatar_likes l WHERE l.target_user_id=a.user_id AND l.liker_user_id=p_user_id) AS liked_by_me
 FROM public.student_avatars a JOIN public.students s ON s.id=a.user_id
 WHERE a.setup_completed AND a.gallery_visible AND s.is_active AND EXISTS(
   SELECT 1 FROM public.course_students t WHERE t.student_id=a.user_id AND t.enrollment_state='ACTIVE' AND (
    p_role='admin' OR (p_role='teacher' AND EXISTS(SELECT 1 FROM public.courses c WHERE c.id=t.course_id AND c.teacher_email=p_email)) OR
    (p_role='student' AND EXISTS(SELECT 1 FROM public.course_students me WHERE me.student_id=p_user_id AND me.course_id=t.course_id AND me.enrollment_state='ACTIVE'))
   )
 ) ORDER BY lower(COALESCE(NULLIF(s.alias,''),NULLIF(s.first_name,''),split_part(s.name,' ',1),'Student')),a.user_id LIMIT 49 OFFSET greatest(0,p_offset)
 ) page;
$$;
REVOKE ALL ON FUNCTION public.avatar_gallery_page(uuid,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.avatar_gallery_page(uuid,text,text,integer) TO service_role;

-- Versioned artwork. Existing ownership, prices and retirement settings are preserved.
UPDATE public.avatar_items SET svg_layer='<rect x="-120" y="-120" width="240" height="260" fill="#1B1436"/><g fill="#F2EDDE"><circle cx="-52" cy="-58" r="1.5"/><circle cx="44" cy="-66" r="1.6"/><circle cx="-30" cy="-74" r="1.2"/><circle cx="58" cy="-40" r="1.3"/><circle cx="-60" cy="18" r="1.4"/><circle cx="62" cy="24" r="1.5"/><circle cx="-64" cy="70" r="1.3"/><circle cx="60" cy="74" r="1.6"/></g><circle cx="-47" cy="-40" r="9" fill="#D8A547"/><circle cx="-43" cy="-43" r="7.5" fill="#1B1436"/>',render_options='{}'::jsonb WHERE slug='night-sky';
UPDATE public.avatar_items SET svg_layer='<rect x="-120" y="-120" width="240" height="260" fill="#EAF3EC"/><circle cx="0" cy="-6" r="66" fill="#CDE6D5"/>',render_options='{}'::jsonb WHERE slug='sage-halo';
UPDATE public.avatar_items SET svg_layer='<path d="M -10,59 L -33,68 Q -44,75 -42,90 L -34,94 L -33,113 L 33,113 L 34,94 L 42,90 Q 44,75 33,68 L 10,59 L 0,69 Z" fill="#F2F0F7" stroke="#777087" stroke-width="1.6"/><path d="M -10,59 L -20,75 L -8,80 L 0,108 L 8,80 L 20,75 L 10,59 L 0,69 Z" fill="#FFFFFF" stroke="#B5AEC5" stroke-width="1.2"/><path d="M -27,88 L -13,88 L -13,100 L -27,100 Z" fill="none" stroke="#777087" stroke-width="1.3"/><path d="M -23,85 L -23,92" stroke="#3F6FD8" stroke-width="2"/><circle cx="3" cy="101" r="1.5" fill="#777087"/>',render_options='{}'::jsonb WHERE slug='lab-coat';
UPDATE public.avatar_items SET svg_layer='<path d="M -10,59 L -33,68 Q -44,75 -42,90 L -34,94 L -33,113 L 33,113 L 34,94 L 42,90 Q 44,75 33,68 L 10,59 Z" fill="#C8243F" stroke="#63263A" stroke-width="1.5"/><path d="M -30,70 L -24,113 L -33,113 L -34,94 L -42,90 Z M 30,70 L 24,113 L 33,113 L 34,94 L 42,90 Z" fill="#2A3F7A"/><path d="M -14,67 L -14,113 M 0,62 L 0,113 M 14,67 L 14,113 M -26,80 Q 0,87 26,80 M -26,94 Q 0,101 26,94" fill="none" stroke="#63263A" stroke-width="1.2"/><ellipse cx="0" cy="89" rx="4" ry="6" fill="#271F33"/><path d="M -2,86 L -10,81 M 2,86 L 10,81 M -3,90 L -12,90 M 3,90 L 12,90 M -2,93 L -9,99 M 2,93 L 9,99" stroke="#271F33" stroke-width="2"/>',render_options='{}'::jsonb WHERE slug='spiderman-suit';
UPDATE public.avatar_items SET svg_layer='<rect x="-28" y="-7" width="56" height="3" fill="#D8A547"/><circle cx="-15" cy="-4" r="10" fill="#A8D8E5" stroke="#D8A547" stroke-width="2.4" opacity="0.75"/><circle cx="15" cy="-4" r="10" fill="#A8D8E5" stroke="#D8A547" stroke-width="2.4" opacity="0.75"/><line x1="-5" y1="-4" x2="5" y2="-4" stroke="#D8A547" stroke-width="2.4"/>',render_options='{"fit_eyes":true}'::jsonb WHERE slug='lab-goggles';
UPDATE public.avatar_items SET svg_layer='<g fill="none" stroke="#2A1F4D" stroke-width="2"><circle cx="-15" cy="-3" r="9"/><circle cx="15" cy="-3" r="9"/><path d="M -6,-3 Q 0,-6 6,-3"/><path d="M -24,-4 L -33,-7"/><path d="M 24,-4 L 33,-7"/></g>',render_options='{"fit_eyes":true}'::jsonb WHERE slug='round-glasses';
UPDATE public.avatar_items SET svg_layer='<g fill="#1F1812"><rect x="-26" y="-9" width="22" height="12" rx="5"/><rect x="4" y="-9" width="22" height="12" rx="5"/></g><rect x="-26" y="-9" width="22" height="2.4" rx="1.2" fill="#D8A547"/><rect x="4" y="-9" width="22" height="2.4" rx="1.2" fill="#D8A547"/><path d="M -4,-5 Q 0,-7 4,-5" fill="none" stroke="#1F1812" stroke-width="3"/><path d="M -26,-7 L -34,-9" stroke="#1F1812" stroke-width="2" fill="none"/><path d="M 26,-7 L 34,-9" stroke="#1F1812" stroke-width="2" fill="none"/>',render_options='{"fit_eyes":true}'::jsonb WHERE slug='sunglasses';
UPDATE public.avatar_items SET svg_layer='<path d="M 0,17 Q -7,14 -12,17 Q -8,21 0,18 Q 8,21 12,17 Q 7,14 0,17 Z" fill="#3A2618"/>',render_options='{"hair_tint":true}'::jsonb WHERE slug='mustache';
UPDATE public.avatar_items SET svg_layer='<path d="M -38,0 Q -40,30 -20,45 Q 0,53 20,45 Q 40,30 38,0 Q 32,20 22,28 Q 12,30 0,30 Q -12,30 -22,28 Q -32,20 -38,0 Z" fill="#3A2618"/><path d="M -12,17 Q 0,14 12,17 Q 7,21 0,19 Q -7,21 -12,17 Z" fill="#3A2618"/>',render_options='{"hair_tint":true}'::jsonb WHERE slug='full-beard';
UPDATE public.avatar_items SET svg_layer='<circle cx="0" cy="-8" r="54" fill="#B6D6EB" opacity="0.32" stroke="#FFFFFF" stroke-width="2.4"/><ellipse cx="0" cy="44" rx="50" ry="9" fill="#C9C2DE"/><rect x="-46" y="40" width="92" height="10" rx="5" fill="#7B6BCB" opacity="0.4"/><path d="M -32,-38 Q -10,-52 12,-48" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.65"/>',render_options='{"hair":"tuck"}'::jsonb WHERE slug='space-helmet';
UPDATE public.avatar_items SET svg_layer='<path d="M -42,-14 Q -48,-58 0,-60 Q 48,-58 42,-14 Z" fill="#B5B7BE"/><rect x="-44" y="-14" width="88" height="4" rx="1.5" fill="#6E707A"/><path d="M -16,-14 Q 0,-26 16,-14" fill="none" stroke="#D8A547" stroke-width="2.4" stroke-linecap="round"/><path d="M 0,-60 L 0,-14" stroke="#6E707A" stroke-width="2"/><circle cx="0" cy="-60" r="3.4" fill="#D8A547"/><path d="M -36,-26 Q -52,-44 -68,-32 Q -62,-26 -58,-20 Q -50,-16 -38,-14 Z" fill="#B8B0A0"/><path d="M -36,-28 Q -54,-44 -70,-32 Q -64,-28 -60,-24 Q -56,-28 -52,-22 Q -48,-26 -44,-20 Q -40,-24 -38,-16 Z" fill="#F2EDDE" stroke="#B8B0A0" stroke-width="0.6"/><path d="M 36,-26 Q 52,-44 68,-32 Q 62,-26 58,-20 Q 50,-16 38,-14 Z" fill="#B8B0A0"/><path d="M 36,-28 Q 54,-44 70,-32 Q 64,-28 60,-24 Q 56,-28 52,-22 Q 48,-26 44,-20 Q 40,-24 38,-16 Z" fill="#F2EDDE" stroke="#B8B0A0" stroke-width="0.6"/>',render_options='{"hair":"tuck"}'::jsonb WHERE slug='viking-helmet';
UPDATE public.avatar_items SET svg_layer='<path d="M -48,-2 Q -48,-60 0,-60 Q 48,-60 48,-2 Q 48,32 28,44 L 12,68 L -12,68 L -28,44 Q -48,32 -48,-2 Z" fill="#C8243F"/><g stroke="#7E2A12" stroke-width="0.7" fill="none" stroke-linecap="round"><path d="M 0,-58 L 0,68"/><path d="M -10,-56 Q -16,-2 -8,68"/><path d="M 10,-56 Q 16,-2 8,68"/><path d="M -28,-48 Q -38,-2 -22,44"/><path d="M 28,-48 Q 38,-2 22,44"/></g><g stroke="#7E2A12" stroke-width="0.7" fill="none" stroke-linecap="round"><path d="M -36,-34 Q -10,-30 0,-34 Q 10,-30 36,-34"/><path d="M -42,14 Q -20,18 0,14 Q 20,18 42,14"/><path d="M -34,32 Q -12,36 0,32 Q 12,36 34,32"/><path d="M -20,52 Q -8,56 0,52 Q 8,56 20,52"/></g><path d="M -10,-12 Q -20,-14 -28,-6 Q -30,4 -18,6 Q -8,6 -8,-4 Z" fill="#FFFFFF" stroke="#7E2A12" stroke-width="1.4"/><path d="M 10,-12 Q 20,-14 28,-6 Q 30,4 18,6 Q 8,6 8,-4 Z" fill="#FFFFFF" stroke="#7E2A12" stroke-width="1.4"/>',render_options='{"hair":"hide","covers_ears":true,"covers_neck":true}'::jsonb WHERE slug='spiderman-mask';
UPDATE public.avatar_items SET svg_layer='<path d="M -46,-19 Q -48,-58 0,-62 Q 48,-58 46,-19 Z" fill="#3E8E63"/><rect x="-46" y="-27" width="92" height="9" rx="4.5" fill="#2F6E4B"/><circle cx="0" cy="-62" r="6" fill="#F2EDDE"/>',render_options='{"hair":"tuck"}'::jsonb WHERE slug='beanie';
UPDATE public.avatar_items SET svg_layer='<path d="M -24,-46 Q 0,-40 24,-46 L 22,-34 Q 0,-30 -22,-34 Z" fill="#2A1F4D"/><path d="M 0,-58 L 46,-46 L 0,-34 L -46,-46 Z" fill="#2A1F4D"/><circle cx="0" cy="-46" r="2.6" fill="#D8A547"/><path d="M 0,-46 L 30,-44" stroke="#D8A547" stroke-width="1.6" fill="none"/><path d="M 30,-44 L 30,-28" stroke="#D8A547" stroke-width="1.6" fill="none"/><circle cx="30" cy="-26" r="3.2" fill="#D8A547"/>',render_options='{}'::jsonb WHERE slug='grad-cap';
UPDATE public.avatar_items SET svg_layer='<path d="M -44,8 Q -52,-28 -12,-56" fill="none" stroke="#A87A28" stroke-width="1.4"/><path d="M 44,8 Q 52,-28 12,-56" fill="none" stroke="#A87A28" stroke-width="1.4"/><g fill="#D8A547"><ellipse cx="-45" cy="4" rx="3" ry="6" transform="rotate(-20 -45 4)"/><ellipse cx="-47" cy="-8" rx="3" ry="6" transform="rotate(-8 -47 -8)"/><ellipse cx="-46" cy="-20" rx="3" ry="6.5" transform="rotate(4 -46 -20)"/><ellipse cx="-42" cy="-32" rx="3" ry="6.5" transform="rotate(20 -42 -32)"/><ellipse cx="-35" cy="-43" rx="3" ry="6" transform="rotate(38 -35 -43)"/><ellipse cx="-25" cy="-51" rx="2.8" ry="5.5" transform="rotate(56 -25 -51)"/><ellipse cx="-14" cy="-56" rx="2.6" ry="5" transform="rotate(72 -14 -56)"/><ellipse cx="45" cy="4" rx="3" ry="6" transform="rotate(20 45 4)"/><ellipse cx="47" cy="-8" rx="3" ry="6" transform="rotate(8 47 -8)"/><ellipse cx="46" cy="-20" rx="3" ry="6.5" transform="rotate(-4 46 -20)"/><ellipse cx="42" cy="-32" rx="3" ry="6.5" transform="rotate(-20 42 -32)"/><ellipse cx="35" cy="-43" rx="3" ry="6" transform="rotate(-38 35 -43)"/><ellipse cx="25" cy="-51" rx="2.8" ry="5.5" transform="rotate(-56 25 -51)"/><ellipse cx="14" cy="-56" rx="2.6" ry="5" transform="rotate(-72 14 -56)"/></g><circle cx="0" cy="-57" r="2.6" fill="#D8A547"/>',render_options='{}'::jsonb WHERE slug='scholars-laurel';
UPDATE public.avatar_items SET svg_layer='<path d="M -46,-2 Q -50,-52 0,-54 Q 50,-52 46,-2 Q 24,-10 0,-10 Q -24,-10 -46,-2 Z" fill="#2A1F4D"/><rect x="-4" y="-53" width="8" height="44" rx="3" fill="#D8A547"/><circle cx="-44" cy="4" r="7" fill="#B5B7BE"/><circle cx="44" cy="4" r="7" fill="#B5B7BE"/><line x1="-18" y1="-3" x2="-18" y2="22" stroke="#B5B7BE" stroke-width="2.4"/><line x1="18" y1="-3" x2="18" y2="22" stroke="#B5B7BE" stroke-width="2.4"/><line x1="-18" y1="8" x2="18" y2="8" stroke="#B5B7BE" stroke-width="2.2"/><line x1="-18" y1="20" x2="18" y2="20" stroke="#B5B7BE" stroke-width="2.2"/>',render_options='{"hair":"tuck"}'::jsonb WHERE slug='football-helmet';
UPDATE public.avatar_items SET svg_layer='<circle cx="-18" cy="92" r="13" fill="#373149"/><g transform="translate(-18, 92)"><circle cx="0" cy="0" r="3.4" fill="#D8A547"/><ellipse cx="0" cy="0" rx="11" ry="4.4" fill="none" stroke="#FFFFFF" stroke-width="1.5"/><ellipse cx="0" cy="0" rx="11" ry="4.4" fill="none" stroke="#FFFFFF" stroke-width="1.5" transform="rotate(60)"/><ellipse cx="0" cy="0" rx="11" ry="4.4" fill="none" stroke="#FFFFFF" stroke-width="1.5" transform="rotate(-60)"/></g>',render_options='{}'::jsonb WHERE slug='atom-pin';
UPDATE public.avatar_items SET svg_layer='<g transform="translate(-18, 92)"><path d="M -3,-7 L -3,-1 L -7,7 Q -8,9.5 -5,9.5 L 5,9.5 Q 8,9.5 7,7 L 3,-1 L 3,-7 Z" fill="#F8F6FB" stroke="#C9C2DE" stroke-width="0.8"/><path d="M -5.6,3.5 L 5.6,3.5 L 7,7 Q 8,9.5 5,9.5 L -5,9.5 Q -8,9.5 -7,7 Z" fill="#3E8E63"/><rect x="-4.5" y="-8" width="9" height="2.2" rx="1.1" fill="#C9C2DE"/></g>',render_options='{}'::jsonb WHERE slug='beaker-pin';
UPDATE public.avatar_items SET svg_layer='<g transform="translate(-18, 92)"><path d="M 3,-9 L -5,2 L 0,2 L -2,10 L 7,-1 L 2,-1 Z" fill="#D8A547" stroke="#715025" stroke-width="1.2"/></g>',render_options='{}'::jsonb WHERE slug='bolt-pin';
UPDATE public.avatar_items SET svg_layer='<path d="M -28,82 Q 0,104 28,82" fill="none" stroke="#8A5C20" stroke-width="8.5" stroke-linecap="round"/><path d="M -28,82 Q 0,104 28,82" fill="none" stroke="#D8A547" stroke-width="6" stroke-linecap="round"/><line x1="-22" y1="85" x2="-19" y2="91" stroke="#8A5C20" stroke-width="1.4" stroke-linecap="round"/><line x1="-12" y1="92" x2="-9" y2="97" stroke="#8A5C20" stroke-width="1.4" stroke-linecap="round"/><line x1="12" y1="92" x2="9" y2="97" stroke="#8A5C20" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="85" x2="19" y2="91" stroke="#8A5C20" stroke-width="1.4" stroke-linecap="round"/><rect x="-5.5" y="95" width="11" height="9" rx="2.5" fill="#D8A547" stroke="#8A5C20" stroke-width="0.9"/>',render_options='{}'::jsonb WHERE slug='cuban-gold-chain';
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('denim-jacket','body','Denim jacket',180,'<path d="M -10,59 L -33,68 Q -44,75 -42,90 L -34,94 L -33,113 L 33,113 L 34,94 L 42,90 Q 44,75 33,68 L 10,59 Q 0,70 -10,59 Z" fill="#47799C" stroke="#514C65" stroke-width="1.5"/><path d="M -10,60 L -18,72 L -5,78 L 0,68 L 5,78 L 18,72 L 10,60 M 0,69 L 0,113" fill="#86ADC3" stroke="#294E70" stroke-width="1.5"/><path d="M -26,85 L -10,85 L -10,97 L -26,97 Z M 10,85 L 26,85 L 26,97 L 10,97 Z" fill="none" stroke="#D6E4E7" stroke-width="1.4"/>',11,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('cosmic-hoodie','body','Cosmic hoodie',220,'<path d="M -10,59 L -33,68 Q -44,75 -42,90 L -34,94 L -33,113 L 33,113 L 34,94 L 42,90 Q 44,75 33,68 L 10,59 Q 0,70 -10,59 Z" fill="#353460" stroke="#514C65" stroke-width="1.5"/><path d="M -10,59 Q -27,55 -21,74 L -10,80 L 0,68 L 10,80 L 21,74 Q 27,55 10,59" fill="#605786" stroke="#252345" stroke-width="1.4"/><path d="M -8,76 L -8,91 M 8,76 L 8,91" stroke="#E3DEF3" stroke-width="2"/><circle cx="0" cy="98" r="7" fill="#A494D9"/><ellipse cx="0" cy="98" rx="13" ry="3" transform="rotate(-20 0 98)" fill="none" stroke="#E3DEF3" stroke-width="2"/>',11,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('field-vest','body','Field scientist vest',160,'<path d="M -10,59 L -33,68 Q -44,75 -42,90 L -34,94 L -33,113 L 33,113 L 34,94 L 42,90 Q 44,75 33,68 L 10,59 Q 0,70 -10,59 Z" fill="#788865" stroke="#514C65" stroke-width="1.5"/><path d="M 0,65 L 0,113" stroke="#354B3B" stroke-width="3"/><path d="M -27,78 L -10,78 L -10,93 L -27,93 Z M 10,78 L 27,78 L 27,93 L 10,93 Z M -25,100 L -9,100 L -9,109 L -25,109 Z M 9,100 L 25,100 L 25,109 L 9,109 Z" fill="#A5AD8C" stroke="#354B3B" stroke-width="1.3"/>',11,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('flight-suit','body','Flight suit',300,'<path d="M -10,59 L -33,68 Q -44,75 -42,90 L -34,94 L -33,113 L 33,113 L 34,94 L 42,90 Q 44,75 33,68 L 10,59 Q 0,70 -10,59 Z" fill="#E48B43" stroke="#514C65" stroke-width="1.5"/><path d="M 0,64 L 0,113" stroke="#674033" stroke-width="2"/><path d="M -28,81 L -11,81 L -11,95 L -28,95 Z" fill="#F2EDDE" stroke="#674033" stroke-width="1.3"/><circle cx="19" cy="84" r="7" fill="#2A3F7A"/><path d="M 15,87 L 19,78 L 23,87 L 19,85 Z" fill="#F2EDDE"/>',11,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('aurora','background','Aurora',180,'<rect x="-120" y="-120" width="240" height="260" fill="#172F46"/><path d="M -110,-35 Q -35,-105 110,-40 L 110,-10 Q 0,-75 -110,5 Z" fill="#509C91"/><path d="M -110,-9 Q 0,-75 110,-10 L 110,9 Q 0,-48 -110,18 Z" fill="#9380BB"/>',0,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('sunrise','background','Sunrise',140,'<rect x="-120" y="-120" width="240" height="260" fill="#F4DFC0"/><circle cx="0" cy="-6" r="69" fill="#EBA375"/><path d="M -120,58 Q -40,32 0,63 Q 50,32 120,55 L 120,140 L -120,140 Z" fill="#85A39A"/>',0,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('comet-pin','pin','Comet pin',100,'<circle cx="-18" cy="92" r="12" fill="#2A3F7A"/><path d="M -25,85 L -14,89 M -27,89 L -14,93" stroke="#D8A547" stroke-width="2.5"/><circle cx="-14" cy="94" r="4.5" fill="#F2EDDE"/>',140,'{}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order) VALUES('hex-glasses','eyewear','Hexagon glasses',140,'<g fill="none" stroke="#2E6E68" stroke-width="2.3"><polygon points="-25,-7 -20,-12 -10,-12 -5,-7 -5,1 -10,6 -20,6 -25,1"/><polygon points="5,-7 10,-12 20,-12 25,-7 25,1 20,6 10,6 5,1"/><path d="M -5,-4 Q 0,-7 5,-4 M -25,-5 L -33,-8 M 25,-5 L 33,-8"/></g>',120,'{"fit_eyes":true}'::jsonb,100) ON CONFLICT (slug) DO NOTHING;

-- Aggregate ownership in SQL rather than silently truncating at the REST row cap.
CREATE OR REPLACE FUNCTION public.avatar_owner_counts()
RETURNS TABLE(item_slug text,owner_count bigint) LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT o.item_slug,count(*) FROM public.student_owned_items o GROUP BY o.item_slug;
$$;
REVOKE ALL ON FUNCTION public.avatar_owner_counts() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.avatar_owner_counts() TO service_role;

-- Crown-based hats follow the face crown as well as tucking its hair.
UPDATE public.avatar_items SET render_options=render_options||'{"fit_head":true}'::jsonb WHERE slug IN ('football-helmet','viking-helmet','beanie','graduation-cap');
