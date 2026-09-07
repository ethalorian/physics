-- Audit 1; A-2, M-1, O-2. These objects are server-only behind NextAuth.
-- Do not add auth.uid policies: app identities are not Supabase Auth sessions.
alter table public.block_drafts enable row level security;
alter table public.present_sessions enable row level security;
revoke all on table public.block_drafts, public.present_sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.block_drafts, public.present_sessions to service_role;
alter view public.mastery_calibration set (security_invoker = true);
revoke all on table public.mastery_calibration from public, anon, authenticated;
grant select on table public.mastery_calibration to service_role;
