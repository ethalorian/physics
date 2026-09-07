-- A-2: additive display state; M-1: no evidence or mastery writes.
alter table public.present_sessions add column projected_block_id text;
alter table public.present_sessions add column projected_block_page integer not null default 0 check (projected_block_page >= 0);
