-- Classroom token economy: a teacher-run rewards store + student redemptions.
-- Spendable balance = lifetime points earned (computed, leaderboard logic) - points committed to redemptions.

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cost_points INTEGER NOT NULL CHECK (cost_points >= 0),
  category TEXT,
  image_url TEXT,
  stock INTEGER,                -- NULL = unlimited
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
  reward_name TEXT,
  cost_points INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','fulfilled','denied')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_rewards_active ON public.rewards(active);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.reward_redemptions(status);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view rewards" ON public.rewards;
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff manage rewards" ON public.rewards;
CREATE POLICY "Staff manage rewards" ON public.rewards FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Students manage own redemptions" ON public.reward_redemptions;
CREATE POLICY "Students manage own redemptions" ON public.reward_redemptions FOR ALL
  USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "Staff manage all redemptions" ON public.reward_redemptions;
CREATE POLICY "Staff manage all redemptions" ON public.reward_redemptions FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));
