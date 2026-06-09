-- Vocab Duel: head-to-head vocabulary matches.
-- All reads/writes go through API routes using the service role (supabaseAdmin),
-- so RLS is enabled with no policies — deny-by-default for anon/authenticated,
-- consistent with enable_rls_security.sql.

create table if not exists duel_matches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  vocabulary_set_id text,                      -- score attribution, passed through to vocabulary_game_scores
  label text not null default '',              -- human label of the vocab selection ("Unit 3 · Waves")
  host_id text not null,                       -- google user id (matches user_id keys on other tables)
  host_name text not null default 'Player 1',
  guest_id text,
  guest_name text,
  mode text not null default 'live' check (mode in ('live', 'ghost')),
  -- live:  waiting → active → finished
  -- ghost: recording → open (ghost ready, waiting for a taker) → active → finished
  status text not null default 'waiting' check (status in ('waiting', 'recording', 'open', 'active', 'finished')),
  rounds jsonb not null default '[]',          -- DuelRound[] (see src/lib/duel.ts)
  current_round int not null default 0,
  winner text check (winner in ('host', 'guest', 'tie')),
  host_seen_at timestamptz,                    -- poll heartbeats for "opponent connected?" UI
  guest_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists duel_matches_code_idx on duel_matches (code);
create index if not exists duel_matches_open_idx on duel_matches (status, created_at desc);

alter table duel_matches enable row level security;
