-- ============================================================================
-- CREATE MATH-LITERACY SPINE SYSTEM
-- ============================================================================
-- Additive migration. Introduces the course's QUANTITATIVE SPINE: a small set
-- of cross-cutting "I can…" math competencies that are taught just-in-time but
-- NEVER retired, plus an append-only longitudinal record of student mastery on
-- them, and the wiring that lets the spine be "sprinkled in" everywhere.
--
-- WHY A NEW AXIS (not new learning_targets):
--   learning_targets carry EXACTLY ONE unit_id (the time axis) and roll up
--   per-unit. A math competency is the opposite: it spans the whole year and
--   must accrue evidence across every unit. Jamming it into learning_targets
--   would either fragment it into 7 rows or distort a unit's K/R/S/P growth.
--   So the spine is a parallel, cross-cutting projection that mirrors the
--   learning_targets + mastery_records pattern exactly — same slugs, same
--   Marzano 1-3 grain, same decaying-average rollup (w=0.60) — on its own axis.
--
-- Derived from src/data/curriculum-types.ts (source of truth). The TS additions
-- that declare these shapes are listed in the integration spec; wiring the
-- dashboard to these tables is a deliberate second step, exactly as the mastery
-- migration intended.
--
-- SAFE BY DESIGN: additive only. Touches no existing table or column. FK to
-- learning_targets / mastery_tasks is additive (tag tables only). The app keeps
-- running exactly as before.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONTENT TABLES (authored; seeded below)
-- ----------------------------------------------------------------------------

-- Math competencies — the spine. Cross-cutting: NO unit_id. Each carries ONE
-- strand (the spine-rollup axis), mirroring how a learning_target carries one
-- domain.
CREATE TABLE IF NOT EXISTS public.math_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                 -- e.g. 'm.qe.sci-notation'
  code TEXT NOT NULL,                        -- short teacher/student handle, e.g. 'QE2'
  statement TEXT NOT NULL,                   -- verbatim student-facing "I can…"
  strand TEXT NOT NULL CHECK (strand IN (
    'proportional-reasoning',                -- ratios, scaling, inverse-square
    'quantities-estimation',                 -- sci notation, units, orders of magnitude, sig figs
    'symbolic-manipulation',                 -- rearrange, substitute, evaluate
    'graphs-vectors'                         -- slope/area, linearize, components/trig
  )),
  rationale TEXT,                            -- why this is load-bearing in physics
  is_active BOOLEAN NOT NULL DEFAULT TRUE,   -- spine items never expire; toggle if retiring
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_competencies_strand ON public.math_competencies(strand);
CREATE INDEX IF NOT EXISTS idx_math_competencies_order ON public.math_competencies(strand, order_index);

-- Just-in-time schedule — when each competency is FIRST taught and where it is
-- explicitly re-exercised. This is the "spiral": the competency persists, but
-- each unit names the physics hook that re-surfaces it. role='introduce' marks
-- the JIT debut; role='revisit' marks a deliberate spiral touch.
CREATE TABLE IF NOT EXISTS public.math_competency_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL,                     -- matches units.id / lessons.unit_id, e.g. 'unit-1'
  role TEXT NOT NULL DEFAULT 'revisit' CHECK (role IN ('introduce','revisit')),
  physics_hook TEXT,                         -- the concrete asteroid/physics moment it rides in on
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (competency_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_math_focus_competency ON public.math_competency_focus(competency_id);
CREATE INDEX IF NOT EXISTS idx_math_focus_unit ON public.math_competency_focus(unit_id);

-- Spiral item bank — short Do-Now / retrieval prompts, each tagged to one
-- competency. Serves BOTH the recurring warm-up routine and spaced-retrieval
-- checks (is_spaced flags an item meant to resurface weeks after its unit).
CREATE TABLE IF NOT EXISTS public.math_spiral_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,                      -- student-facing warm-up question
  answer_key TEXT,                           -- teacher answer / acceptable range
  first_unit_id TEXT,                        -- earliest unit the item is fair game
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
  is_spaced BOOLEAN NOT NULL DEFAULT TRUE,   -- eligible for interleaved/spaced resurfacing
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_spiral_competency ON public.math_spiral_items(competency_id);
CREATE INDEX IF NOT EXISTS idx_math_spiral_unit ON public.math_spiral_items(first_unit_id);

-- Tag tables — how the spine is "embedded" in the existing growth tree and in
-- summative tasks, so mastery evidence accrues from work students already do.
CREATE TABLE IF NOT EXISTS public.learning_target_math_tags (
  learning_target_id UUID NOT NULL REFERENCES public.learning_targets(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (learning_target_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_lt_math_tags_competency ON public.learning_target_math_tags(competency_id);

CREATE TABLE IF NOT EXISTS public.mastery_task_math_tags (
  mastery_task_id UUID NOT NULL REFERENCES public.mastery_tasks(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (mastery_task_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_mt_math_tags_competency ON public.mastery_task_math_tags(competency_id);

-- ----------------------------------------------------------------------------
-- RUNTIME TABLE (DB-authoritative student state)
-- ----------------------------------------------------------------------------

-- Math mastery records — the spine growth-line grain. APPEND-ONLY and
-- longitudinal, mirroring mastery_records exactly: a competency is re-observed
-- all year; rows are never overwritten; NO unique constraint on
-- (user_id, competency_id). The dashboard value is the decaying weighted
-- average (w=0.60) of these rows in date order — but, unlike learning targets,
-- it spans EVERY unit (the spine never resets).
CREATE TABLE IF NOT EXISTS public.math_competency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                     -- matches existing convention (e.g. lesson_progress.user_id)
  user_email TEXT,
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level IN (1,2,3)), -- Marzano formative level (anchors in the spec)
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unit_id TEXT,                              -- which unit the evidence came from (analytics only)
  evidence_source TEXT,                      -- warm-up, retrieval check, lab, transfer task, conversation…
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_records_user ON public.math_competency_records(user_id);
CREATE INDEX IF NOT EXISTS idx_math_records_competency ON public.math_competency_records(competency_id);
CREATE INDEX IF NOT EXISTS idx_math_records_user_competency ON public.math_competency_records(user_id, competency_id);
CREATE INDEX IF NOT EXISTS idx_math_records_observed ON public.math_competency_records(observed_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Mirrors create_mastery_tracking_system.sql: content readable by anyone signed
-- in, staff manage; student records are teacher-assessed (students read own),
-- staff read/write all. Service-role writes (supabaseAdmin) bypass RLS.

ALTER TABLE public.math_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.math_competency_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.math_spiral_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_target_math_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_task_math_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.math_competency_records ENABLE ROW LEVEL SECURITY;

-- Content: readable by anyone signed in; only staff manage it.
DROP POLICY IF EXISTS "Anyone can view math competencies" ON public.math_competencies;
CREATE POLICY "Anyone can view math competencies"
  ON public.math_competencies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage math competencies" ON public.math_competencies;
CREATE POLICY "Staff manage math competencies"
  ON public.math_competencies FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Anyone can view math focus" ON public.math_competency_focus;
CREATE POLICY "Anyone can view math focus"
  ON public.math_competency_focus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage math focus" ON public.math_competency_focus;
CREATE POLICY "Staff manage math focus"
  ON public.math_competency_focus FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Anyone can view math spiral items" ON public.math_spiral_items;
CREATE POLICY "Anyone can view math spiral items"
  ON public.math_spiral_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage math spiral items" ON public.math_spiral_items;
CREATE POLICY "Staff manage math spiral items"
  ON public.math_spiral_items FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Anyone can view learning target math tags" ON public.learning_target_math_tags;
CREATE POLICY "Anyone can view learning target math tags"
  ON public.learning_target_math_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage learning target math tags" ON public.learning_target_math_tags;
CREATE POLICY "Staff manage learning target math tags"
  ON public.learning_target_math_tags FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Anyone can view mastery task math tags" ON public.mastery_task_math_tags;
CREATE POLICY "Anyone can view mastery task math tags"
  ON public.mastery_task_math_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage mastery task math tags" ON public.mastery_task_math_tags;
CREATE POLICY "Staff manage mastery task math tags"
  ON public.mastery_task_math_tags FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- Records: a student may read their own; staff read/write all.
DROP POLICY IF EXISTS "Students view own math records" ON public.math_competency_records;
CREATE POLICY "Students view own math records"
  ON public.math_competency_records FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff manage all math records" ON public.math_competency_records;
CREATE POLICY "Staff manage all math records"
  ON public.math_competency_records FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- ============================================================================
-- SEED — the spine (11 competencies across 4 strands)
-- ============================================================================

INSERT INTO public.math_competencies
  (slug, code, statement, strand, rationale, order_index)
VALUES
  ('m.pr.ratio', 'PR1',
   'I can set up and solve a ratio or proportion to scale a quantity up or down.',
   'proportional-reasoning',
   'Proportional reasoning is the single most-cited gatekeeper skill for physics (Karplus, Lawson).', 1),
  ('m.pr.inverse-square', 'PR2',
   'I can predict how a quantity changes when another is doubled or halved, including inverse-square relationships.',
   'proportional-reasoning',
   'Fields, gravity, and light intensity all hinge on multiplicative (not additive) thinking.', 2),

  ('m.qe.sci-notation', 'QE1',
   'I can read, write, and compute with numbers in scientific notation.',
   'quantities-estimation',
   'Asteroid masses and distances are unusable without it (3.5x10^11 kg, 1.2x10^8 km).', 3),
  ('m.qe.units', 'QE2',
   'I can track and convert units through a calculation and use them to check an answer (dimensional analysis).',
   'quantities-estimation',
   'Unit tracking is the cheapest, highest-yield error check students can run.', 4),
  ('m.qe.estimate', 'QE3',
   'I can make and defend an order-of-magnitude estimate (Fermi reasoning).',
   'quantities-estimation',
   'Quantitative literacy = knowing whether an answer is even plausible (Steen; Mahajan).', 5),
  ('m.qe.sigfigs', 'QE4',
   'I can report a measured or computed value with precision that matches the data (significant figures / uncertainty).',
   'quantities-estimation',
   'Vernier data forces the honest question: how much of this number do I actually know?', 6),

  ('m.sm.rearrange', 'SM1',
   'I can rearrange an equation to solve for any one variable before substituting numbers.',
   'symbolic-manipulation',
   'Symbol-first manipulation separates understanding an equation from plug-and-chug (Sherin).', 7),
  ('m.sm.substitute', 'SM2',
   'I can substitute values with their units into a formula and evaluate it correctly.',
   'symbolic-manipulation',
   'The mechanical step where unit/precision/notation errors compound if untrained.', 8),

  ('m.gv.read-graph', 'GV1',
   'I can read a graph''s slope and area and say what they mean physically.',
   'graphs-vectors',
   'Slope-as-rate and area-as-accumulation are reused from kinematics through circuits.', 9),
  ('m.gv.linearize', 'GV2',
   'I can choose or transform axes to reveal a relationship and find a rate from the fit.',
   'graphs-vectors',
   'Turns raw lab data into a law (F=ma, inverse-square, Ohm''s law) (Etkina/ISLE representations).', 10),
  ('m.gv.vectors', 'GV3',
   'I can break a vector into components and add vectors, using sin and cos for the angle.',
   'graphs-vectors',
   'The 15-degree approach trajectory, FBDs, and momentum all need component thinking.', 11)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED — just-in-time schedule (introduce + key spiral revisits)
-- ============================================================================
-- Each competency debuts (role='introduce') on a concrete physics hook, then is
-- deliberately revisited (role='revisit') in later units so it never goes away.

INSERT INTO public.math_competency_focus (competency_id, unit_id, role, physics_hook, order_index)
SELECT c.id, v.unit_id, v.role, v.physics_hook, v.order_index
FROM (VALUES
  -- PR1 ratio
  ('m.pr.ratio',         'unit-1', 'introduce', 'Scale velocity x time to predict how far 2026-XJ travels in a week vs. a month.', 1),
  ('m.pr.ratio',         'unit-3', 'revisit',   'Scale momentum and impulse across different impact masses.', 2),
  ('m.pr.ratio',         'unit-4', 'revisit',   'Scale kinetic energy with speed (the v-squared surprise).', 3),
  -- PR2 inverse-square
  ('m.pr.inverse-square','unit-2', 'introduce', 'Gravitational field strength as 2026-XJ approaches: half the distance, four times the pull.', 1),
  ('m.pr.inverse-square','unit-6', 'revisit',   'Light/EM intensity falls off as 1/r^2 — how we read a faint reflected signal.', 2),
  -- QE1 scientific notation
  ('m.qe.sci-notation',  'unit-1', 'introduce', 'Distance 1.2x10^8 km and velocity 8,500 m/s in the Day-1 NASA briefing.', 1),
  ('m.qe.sci-notation',  'unit-3', 'revisit',   'Impact energy lands in the 10^x joule range; powers must be handled cleanly.', 2),
  ('m.qe.sci-notation',  'unit-6', 'revisit',   'EM frequencies and wavelengths span many orders of magnitude.', 3),
  -- QE2 units
  ('m.qe.units',         'unit-1', 'introduce', 'Carry m, s, kg through F=ma and catch a wrong answer by its units.', 1),
  ('m.qe.units',         'unit-4', 'revisit',   'Joules, watts, and the work-energy bookkeeping of a deflection mission.', 2),
  -- QE3 estimation
  ('m.qe.estimate',      'unit-3', 'introduce', 'Order-of-magnitude estimate of impact energy before computing it exactly.', 1),
  ('m.qe.estimate',      'unit-5', 'revisit',   'Could the atmosphere plausibly absorb this? A Fermi sanity check.', 2),
  -- QE4 sig figs
  ('m.qe.sigfigs',       'unit-1', 'introduce', 'Vernier motion-detector data: how many digits of velocity do we actually trust?', 1),
  ('m.qe.sigfigs',       'unit-7', 'revisit',   'Reporting Ohm''s-law results to the precision the meters support.', 2),
  -- SM1 rearrange
  ('m.sm.rearrange',     'unit-1', 'introduce', 'Solve a kinematics equation for time before plugging in numbers.', 1),
  ('m.sm.rearrange',     'unit-2', 'revisit',   'Rearrange the gravitation equation to solve for orbital quantities.', 2),
  ('m.sm.rearrange',     'unit-4', 'revisit',   'Rearrange energy equations to isolate speed or height.', 3),
  -- SM2 substitute
  ('m.sm.substitute',    'unit-1', 'introduce', 'Substitute values with units into F=ma and evaluate.', 1),
  ('m.sm.substitute',    'unit-7', 'revisit',   'Substitute into V=IR and power relations for the spacecraft systems.', 2),
  -- GV1 read graph
  ('m.gv.read-graph',    'unit-1', 'introduce', 'Slope of a position-time graph is velocity; area under v-t is displacement.', 1),
  ('m.gv.read-graph',    'unit-4', 'revisit',   'Area under a force-distance graph is work.', 2),
  -- GV2 linearize
  ('m.gv.linearize',     'unit-1', 'introduce', 'Linearize accel-vs-force lab data to extract F=ma.', 1),
  ('m.gv.linearize',     'unit-2', 'revisit',   'Linearize field-vs-distance data to reveal the inverse-square law.', 2),
  ('m.gv.linearize',     'unit-7', 'revisit',   'Linearize voltage-vs-current data to find resistance (Ohm''s law).', 3),
  -- GV3 vectors
  ('m.gv.vectors',       'unit-1', 'introduce', 'Break the 15-degree approach velocity into toward-Earth and perpendicular components.', 1),
  ('m.gv.vectors',       'unit-2', 'revisit',   'Resolve gravitational force directions in orbital geometry.', 2),
  ('m.gv.vectors',       'unit-3', 'revisit',   'Add momentum vectors in a 2-D collision.', 3)
) AS v(slug, unit_id, role, physics_hook, order_index)
JOIN public.math_competencies c ON c.slug = v.slug
ON CONFLICT (competency_id, unit_id) DO NOTHING;

-- ============================================================================
-- SEED — embed the spine in existing Unit 1 learning targets
-- ============================================================================
-- Demonstrates the "embedded sub-target" mechanism: math evidence accrues from
-- the physics targets students already work on. (Tags only the targets that
-- genuinely exercise each skill.)

INSERT INTO public.learning_target_math_tags (learning_target_id, competency_id)
SELECT lt.id, c.id
FROM (VALUES
  ('u1.capture-pt-graph',              'm.gv.read-graph'),
  ('u1.read-vt-graph-components',      'm.gv.read-graph'),
  ('u1.read-vt-graph-components',      'm.gv.vectors'),
  ('u1.predict-position-uncertainty',  'm.sm.substitute'),
  ('u1.predict-position-uncertainty',  'm.qe.sigfigs'),
  ('u1.vectors-tip-to-tail',           'm.gv.vectors'),
  ('u1.acceleration-rate-of-change',   'm.gv.read-graph'),
  ('u1.pick-equation-of-motion',       'm.sm.rearrange'),
  ('u1.pick-equation-of-motion',       'm.sm.substitute'),
  ('u1.lab-accel-vs-mass',             'm.gv.linearize'),
  ('u1.lab-accel-vs-mass',             'm.qe.sigfigs'),
  ('u1.lab-accel-vs-force',            'm.gv.linearize'),
  ('u1.fma-solve-net-force',           'm.sm.rearrange'),
  ('u1.fma-solve-net-force',           'm.qe.units'),
  ('u1.net-force-from-fbd',            'm.sm.substitute'),
  ('u1.net-force-from-fbd',            'm.gv.vectors')
) AS m(target_slug, comp_slug)
JOIN public.learning_targets lt ON lt.slug = m.target_slug
JOIN public.math_competencies c ON c.slug = m.comp_slug
ON CONFLICT (learning_target_id, competency_id) DO NOTHING;

-- Tag the Unit 1 mastery (transfer) task with the math it exercises.
INSERT INTO public.mastery_task_math_tags (mastery_task_id, competency_id)
SELECT mt.id, c.id
FROM (VALUES
  ('u1.mastery-task', 'm.gv.vectors'),
  ('u1.mastery-task', 'm.sm.rearrange'),
  ('u1.mastery-task', 'm.qe.sci-notation'),
  ('u1.mastery-task', 'm.qe.units'),
  ('u1.mastery-task', 'm.qe.sigfigs')
) AS m(task_slug, comp_slug)
JOIN public.mastery_tasks mt ON mt.slug = m.task_slug
JOIN public.math_competencies c ON c.slug = m.comp_slug
ON CONFLICT (mastery_task_id, competency_id) DO NOTHING;

-- ============================================================================
-- SEED — a starter spiral / warm-up item bank
-- ============================================================================
-- One or two exemplars per strand so the warm-up + spaced-retrieval routine has
-- real content from day one. Expand freely; the dashboard draws from here.

INSERT INTO public.math_spiral_items (competency_id, prompt, answer_key, first_unit_id, difficulty)
SELECT c.id, v.prompt, v.answer_key, v.first_unit_id, v.difficulty
FROM (VALUES
  ('m.qe.sci-notation', 'Write 8,500 m/s and 0.00042 s in scientific notation, then multiply them.', '8.5x10^3; 4.2x10^-4; product = 3.57 m', 'unit-1', 'easy'),
  ('m.pr.ratio',        'If 2026-XJ covers 1.2x10^8 km in 14 days at constant speed, how far in 49 days?', '4.2x10^8 km (scale by 49/14 = 3.5)', 'unit-1', 'easy'),
  ('m.pr.inverse-square','A field is 12 N/kg at distance d. What is it at 2d? At d/2?', '3 N/kg at 2d; 48 N/kg at d/2', 'unit-2', 'medium'),
  ('m.qe.units',        'You compute a force and get units of kg*m/s. What went wrong, and what should the units be?', 'Missing a per-second: force is kg*m/s^2 (N). Likely used v instead of a.', 'unit-1', 'medium'),
  ('m.qe.estimate',     'Estimate the kinetic energy of a 3.5x10^11 kg asteroid at 17 km/s to the nearest power of ten.', '~5x10^19 J, i.e. order 10^19-10^20 J', 'unit-3', 'hard'),
  ('m.sm.rearrange',    'Solve v^2 = v0^2 + 2*a*x for x. Then for a.', 'x = (v^2 - v0^2)/(2a); a = (v^2 - v0^2)/(2x)', 'unit-1', 'medium'),
  ('m.gv.read-graph',   'A position-time graph is a straight line through (0,2 m) and (4 s,10 m). What is the velocity?', '2 m/s (slope = 8 m / 4 s)', 'unit-1', 'easy'),
  ('m.gv.vectors',      'A velocity of 8,500 m/s points 15 degrees toward Earth from the perpendicular. Find both components.', 'toward-Earth = 8500*sin15 ~ 2200 m/s; perpendicular = 8500*cos15 ~ 8210 m/s', 'unit-1', 'medium')
) AS v(comp_slug, prompt, answer_key, first_unit_id, difficulty)
JOIN public.math_competencies c ON c.slug = v.comp_slug;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE public.math_competencies IS 'The quantitative spine: cross-cutting math "I can…" competencies (one strand each). Taught just-in-time, never retired. Source of truth: src/data/curriculum-types.ts.';
COMMENT ON TABLE public.math_competency_focus IS 'Just-in-time spiral schedule: where each competency is introduced and deliberately revisited, with the physics hook it rides in on.';
COMMENT ON TABLE public.math_spiral_items IS 'Warm-up / spaced-retrieval item bank, one competency per item. Feeds the Do-Now routine and interleaved retrieval checks (Rohrer & Taylor).';
COMMENT ON TABLE public.learning_target_math_tags IS 'Embeds the spine in the existing growth tree: which math competencies a learning target also exercises.';
COMMENT ON TABLE public.mastery_task_math_tags IS 'Which math competencies a summative mastery/transfer task exercises.';
COMMENT ON TABLE public.math_competency_records IS 'Append-only, longitudinal Marzano (1-3) observations per student per math competency. Rolled up via decaying weighted average (w=0.60) ACROSS THE WHOLE YEAR — the spine never resets per unit.';
