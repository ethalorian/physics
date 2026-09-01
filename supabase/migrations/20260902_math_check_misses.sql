-- Every answer the instant checker could not confirm ('unknown') or rejected
-- ('mismatch'), from warm-ups AND practice reps. Feeds the admin Check Lab,
-- where a real student phrasing can be promoted into an item's accepted forms.
-- (Backfill from math_warmup_submissions ran against the live DB 2026-09-02.)
CREATE TABLE IF NOT EXISTS math_check_misses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES math_spiral_items(id) ON DELETE CASCADE,
  user_id text,
  answer text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 500),
  verdict text NOT NULL CHECK (verdict IN ('unknown', 'mismatch')),
  source text NOT NULL DEFAULT 'warmup' CHECK (source IN ('warmup', 'practice')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS math_check_misses_item_idx ON math_check_misses (item_id, created_at DESC);
ALTER TABLE math_check_misses ENABLE ROW LEVEL SECURITY;
