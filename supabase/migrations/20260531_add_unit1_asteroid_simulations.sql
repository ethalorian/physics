-- Weave the Spine C-Asteroid thread THROUGH Unit 1 (interleaved, not bolted on
-- the end), and add the unit's transfer task as a capstone:
--
--   asteroid-trajectory  -> "Reading 2026-XJ's Trajectory": joins Motion graphs
--                           (sort 32), right where slope = velocity is taught.
--   closing-speed        -> joins Vectors & 2D motion (sort 52), paired right
--                           after riverboat-crossing (relative velocity by
--                           addition) as its vector-subtraction mirror. This
--                           pushes projectile-motion -> 53 and monkey-hunter -> 54.
--   predicting-2026-xj   -> NEW capstone reusing the trajectory engine. The
--                           assessed Unit 1 transfer task (sort 70), after Forces.
--
-- Idempotent: re-running upserts by slug and re-applies the sort_order moves.

-- 1. Early teaching copy of the trajectory sim, re-homed into Motion graphs.
INSERT INTO public.simulations (
    title, slug, description, category, unit, topic, difficulty, sort_order,
    component_path, estimated_time, objectives, key_concepts, tags,
    can_embed, has_ai_guide, published, created_by
)
VALUES
(
    'Reading 2026-XJ’s Trajectory',
    'asteroid-trajectory',
    'Each week NASA reports a new distance to the asteroid. The distance-time data falls on a line - read the slope for the closing speed and extrapolate to zero to predict the impact day. More measurement scatter, shakier prediction. (Returns as the Unit 1 transfer task.)',
    'kinematics', 'unit-1', 'Motion graphs', 'intermediate', 32,
    '/simulations/asteroid-trajectory', 20,
    ARRAY['Read velocity as the slope of a distance-time graph','Extrapolate a linear trend to predict a future position and arrival time','Explain why measurement scatter creates uncertainty in a prediction'],
    ARRAY['Position-time graphs','Slope = velocity','Linear extrapolation','Constant velocity','Measurement uncertainty'],
    ARRAY['position-time-graph','slope','velocity','extrapolation','prediction','constant-velocity','measurement-uncertainty','asteroid','planetary-defense','nasa'],
    true, false, true, 'system'
),
(
    'Closing Speed — How Fast Is It Really Coming?',
    'closing-speed',
    'The asteroid has its own speed through space, but Earth is racing along its orbit too. Subtract the velocity vectors to find the asteroid velocity relative to Earth - the closing/impact speed, usually bigger than either speed alone.',
    'kinematics', 'unit-1', 'Vectors & 2D motion', 'intermediate', 52,
    '/simulations/closing-speed', 15,
    ARRAY['Find a relative velocity by subtracting velocity vectors','Read the impact speed as the length of the relative-velocity vector','Reason about motion in different reference frames'],
    ARRAY['Relative velocity','Vector subtraction','Reference frames','Closing speed','Impact speed'],
    ARRAY['relative-velocity','vector-subtraction','reference-frames','closing-speed','impact-speed','vectors','asteroid','planetary-defense'],
    true, false, true, 'system'
),
(
    'Transfer Task: Predicting 2026-XJ’s Position',
    'predicting-2026-xj',
    'Unit 1''s transfer task - the same trajectory tool from Motion graphs, now the assessed challenge. You have the distance-time graph, slope as velocity, and extrapolation: produce a predicted impact day, state your confidence, and justify it from the data. Push the measurement scatter and decide how many observations you''d demand before staking a real decision on the number.',
    'kinematics', 'unit-1', 'Transfer Task: Predicting 2026-XJ', 'advanced', 70,
    '/simulations/predicting-2026-xj', 25,
    ARRAY['Produce a defensible impact-day prediction from real trajectory data','Quantify and communicate the uncertainty in that prediction','Justify a claim using slope and extrapolation evidence from the graph','Decide how much data is enough before acting on a prediction'],
    ARRAY['Transfer task','Slope = velocity','Linear extrapolation','Evidence-based claim','Measurement uncertainty'],
    ARRAY['transfer-task','position-time-graph','slope','extrapolation','prediction','measurement-uncertainty','asteroid','planetary-defense','nasa'],
    true, false, true, 'system'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    topic = EXCLUDED.topic,
    difficulty = EXCLUDED.difficulty,
    sort_order = EXCLUDED.sort_order,
    component_path = EXCLUDED.component_path,
    estimated_time = EXCLUDED.estimated_time,
    objectives = EXCLUDED.objectives,
    key_concepts = EXCLUDED.key_concepts,
    tags = EXCLUDED.tags,
    can_embed = EXCLUDED.can_embed,
    has_ai_guide = EXCLUDED.has_ai_guide,
    published = EXCLUDED.published,
    updated_at = CURRENT_TIMESTAMP;

-- 2. Make room in Vectors & 2D motion for closing-speed at 52.
UPDATE public.simulations SET sort_order = 53, updated_at = CURRENT_TIMESTAMP
    WHERE slug = 'projectile-motion';
UPDATE public.simulations SET sort_order = 54, updated_at = CURRENT_TIMESTAMP
    WHERE slug = 'monkey-hunter';
