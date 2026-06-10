-- Physics Balderdash: peer-judged fake-definition game (3-12 players).
-- All reads/writes go through API routes using the service role (supabaseAdmin),
-- so RLS is enabled with no policies — deny-by-default, same as duel_matches.

create table if not exists balderdash_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  vocabulary_set_id text,                      -- score attribution, passed through to vocabulary_game_scores
  label text not null default '',
  host_id text not null,                       -- google user id; the host starts the game
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  players jsonb not null default '[]',         -- BalPlayer[] (see src/lib/balderdash.ts)
  rounds jsonb not null default '[]',           -- BalRound[]
  current_round int not null default 0,
  host_seen_at timestamptz,                    -- host poll heartbeat; waiting rooms are only listed while fresh
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists balderdash_sessions_code_idx on balderdash_sessions (code);
create index if not exists balderdash_sessions_open_idx on balderdash_sessions (status, created_at desc);

alter table balderdash_sessions enable row level security;
