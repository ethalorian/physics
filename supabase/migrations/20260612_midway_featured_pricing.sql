-- The Midway becomes the storefront. Two changes, one intent: the sink must
-- be SEEN, and it must cost enough to funnel players into learning.
--
-- 1. Pricing: Midway coins rise 10 → 25 XP. The arithmetic now tells the
--    story by itself: a mastered physics run pays up to 25 XP — one coin.
--    Learn well downstairs, play upstairs. (Daily free-cabinet payout cap is
--    75, so a dedicated day funds about three Midway coins.)
-- 2. Placement (code, /arcade page): the Midway row moved to the TOP of the
--    arcade, in a featured glow card, above the training/physics/math
--    floors — desire first, then the means.
--
-- Applied to production 2026-06-12 via MCP.

UPDATE public.arcade_games SET cost_xp = 25 WHERE unit = 'Midway';
