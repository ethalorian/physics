-- THE GREAT INVERSION: the physics floor becomes the earner, the Midway
-- becomes the sink.
--
-- Every curriculum cabinet (units: Kinematics, Dynamics, Gravitation,
-- Momentum, Energy, Thermal, Waves, E&M, Car Project) flips to cost_xp = 0.
-- Free cabinets ride the existing payout path: games attach run stats
-- (mode 'physics' → top tier) to their arcade:score posts, and the player
-- page calls /api/arcade/payout on finish — floor(min(25, clears × 2 × acc²)),
-- zero below 50% bonus-question accuracy, 75 XP/day cap shared across all
-- free cabinets. Midway cabinets (stack/timber/vortex, 10 XP) and the store
-- remain the sinks.
--
-- All ten games were patched to report stats {solved: level clears,
-- right/wrong: bonus questions, mode: 'physics'}; syntax-verified.
-- Applied to production 2026-06-12 via MCP.

UPDATE public.arcade_games SET cost_xp = 0
WHERE unit NOT IN ('Math Spine', 'Midway');
