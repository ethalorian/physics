-- Supabase default privileges may grant ALL to service_role at table creation.
-- Explicitly replace those defaults: private blueprints and audit events are append-only.
revoke all on public.vocab_checkpoint_blueprints,public.vocab_checkpoint_attempts,public.vocab_checkpoint_events from service_role;
grant select,insert on public.vocab_checkpoint_blueprints,public.vocab_checkpoint_events to service_role;
grant select,insert,update on public.vocab_checkpoint_attempts to service_role;
