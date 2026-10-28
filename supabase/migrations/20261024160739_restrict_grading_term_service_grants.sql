-- Supabase defaults grant service_role all table privileges. Restrict these
-- configuration tables to the operations used by the settings API and RPC.
revoke all on public.course_grading_settings, public.course_grading_settings_history from service_role;
grant select, insert, update on public.course_grading_settings to service_role;
grant select, insert on public.course_grading_settings_history to service_role;
