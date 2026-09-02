-- Two overloads of record_lesson_view existed; PostgREST could not disambiguate
-- the RPC call (PGRST203) so every lesson view failed. The app calls the
-- p_session_duration variant. Drop the stale p_lesson_slug variant.
drop function if exists public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text);
