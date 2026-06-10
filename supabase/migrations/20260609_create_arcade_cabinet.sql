-- Arcade cabinet: ranked physics games that COST XP to play (pure sink).
-- Design (2026-06): vocabulary games are the XP EARNERS; arcade games are XP
-- SPENDERS whose only payout is a public leaderboard rank. One "coin" =
-- one reward_redemption (status 'approved', note 'arcade:<slug>') + one
-- arcade_plays row that authorizes exactly one ranked run. Practice play
-- (opening the raw HTML file) is free but can never post a score.
-- Weekly boards reset Monday 00:00 UTC; all-time records form the Hall of Fame.

CREATE TABLE IF NOT EXISTS public.arcade_games (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  blurb TEXT,
  src_path TEXT NOT NULL,                          -- iframe src, e.g. /games/kinematics-descent.html
  cost_xp INTEGER NOT NULL DEFAULT 25 CHECK (cost_xp >= 0),
  unit TEXT,                                       -- curriculum unit label, e.g. 'Kinematics'
  accent TEXT,                                     -- cabinet art color (hex)
  max_plausible_score INTEGER NOT NULL DEFAULT 100000,  -- server-side sanity cap on reported scores
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.arcade_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                           -- Google user id (matches other work tables)
  user_email TEXT,
  game_slug TEXT NOT NULL REFERENCES public.arcade_games(slug) ON DELETE CASCADE,
  redemption_id UUID REFERENCES public.reward_redemptions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','finished','expired')),
  score INTEGER NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,         -- e.g. {"act":2,"staff":true}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_arcade_plays_user ON public.arcade_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_arcade_plays_game_score ON public.arcade_plays(game_slug, score DESC);
CREATE INDEX IF NOT EXISTS idx_arcade_plays_created ON public.arcade_plays(created_at DESC);

ALTER TABLE public.arcade_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arcade_plays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view arcade games" ON public.arcade_games;
CREATE POLICY "Anyone can view arcade games" ON public.arcade_games FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff manage arcade games" ON public.arcade_games;
CREATE POLICY "Staff manage arcade games" ON public.arcade_games FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Students view own arcade plays" ON public.arcade_plays;
CREATE POLICY "Students view own arcade plays" ON public.arcade_plays FOR SELECT
  USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "Staff manage all arcade plays" ON public.arcade_plays;
CREATE POLICY "Staff manage all arcade plays" ON public.arcade_plays FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- Seed the first cabinet: DESCENT (kinematics, three acts).
INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order)
VALUES (
  'descent',
  'DESCENT',
  'Land on five worlds with one engine, then two, then a cannon. Three acts of kinematics: graphs, vectors, projectiles.',
  '/games/kinematics-descent.html',
  25,
  'Kinematics',
  '#5eead4',
  250000,
  1
)
ON CONFLICT (slug) DO NOTHING;
