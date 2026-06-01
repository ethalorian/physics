-- Close anon-key exposure on tables that are only ever accessed server-side via
-- the service-role client (supabaseAdmin bypasses RLS). Each of these tables is
-- read/written exclusively from app/api/** routes — no browser code queries them
-- with the anon key — so enabling RLS with NO policies denies anon/authenticated
-- roles while leaving server access untouched. Adding permissive policies would
-- be worse here: a read policy on concept_exercises / target_reviews would
-- re-expose teacher-only answer keys to direct client queries.

ALTER TABLE public.concept_exercises ENABLE ROW LEVEL SECURITY;       -- hides answer_key
ALTER TABLE public.target_reviews ENABLE ROW LEVEL SECURITY;          -- hides reteach/questions/answer blocks
ALTER TABLE public.teacher_access_requests ENABLE ROW LEVEL SECURITY; -- emails + approval status
ALTER TABLE public.teacher_onboarding ENABLE ROW LEVEL SECURITY;      -- teacher emails + setup state
ALTER TABLE public.lesson_class_windows ENABLE ROW LEVEL SECURITY;    -- scheduling, server-managed
ALTER TABLE public.avatar_likes ENABLE ROW LEVEL SECURITY;            -- written via API only

-- Obsolete one-time backup: every slug (u8-d01..d09) exists live in lessons with
-- content_blocks intact, so this table is fully redundant.
DROP TABLE IF EXISTS public._u8_blocks_backup;
