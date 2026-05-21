-- ============================================================================
-- CREATE MASTERY TRACKING SYSTEM
-- ============================================================================
-- Additive migration. Introduces the curriculum content layer's runtime
-- projection: first-class learning targets (kinds-of-thinking domains) plus an
-- append-only, longitudinal record of student mastery, and a standalone
-- summative mastery-task result.
--
-- Derived from src/data/curriculum-types.ts (source of truth). See the spec at
-- "Physics Curriculum Planning/App Integration/content_layer_spec.md".
--
-- SAFE BY DESIGN: this migration does NOT touch lessons.objectives or any
-- existing table/column. The app keeps running exactly as before. Wiring the
-- components to these tables is a deliberate second step.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONTENT TABLES (authored; seeded from the repo data layer)
-- ----------------------------------------------------------------------------

-- Learning targets — the hinge of the model. Each "I can…" carries exactly ONE
-- kind-of-thinking domain (the growth-rollup axis) and exactly ONE unit.
CREATE TABLE IF NOT EXISTS public.learning_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                 -- e.g. 'u1.f-ma-solve'
  statement TEXT NOT NULL,                   -- verbatim student-facing "I can…"
  domain TEXT NOT NULL CHECK (domain IN ('knowledge','reasoning','skill','product')),
  unit_id TEXT NOT NULL,                     -- matches lessons.unit_id, e.g. 'unit-1'
  content_strand TEXT,                       -- optional secondary filter tag
  standard_refs TEXT[],                       -- NGSS / AP / MA codes
  exclude_from_growth BOOLEAN NOT NULL DEFAULT FALSE, -- e.g. metacognitive workshop targets
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_targets_unit ON public.learning_targets(unit_id);
CREATE INDEX IF NOT EXISTS idx_learning_targets_domain ON public.learning_targets(domain);
CREATE INDEX IF NOT EXISTS idx_learning_targets_order ON public.learning_targets(unit_id, order_index);

-- Mastery task — separate summative instrument, scored on the 4-D rubric.
CREATE TABLE IF NOT EXISTS public.mastery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                 -- e.g. 'u1.mastery-task'
  unit_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  rubric JSONB NOT NULL,                      -- { science|reasoning|communication|transfer: { description } }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mastery_tasks_unit ON public.mastery_tasks(unit_id);

-- ----------------------------------------------------------------------------
-- RUNTIME TABLES (DB-authoritative student state)
-- ----------------------------------------------------------------------------

-- Mastery records — the growth-line grain. APPEND-ONLY and longitudinal:
-- a target is re-observed over time; rows are never overwritten. Deliberately
-- NO unique constraint on (user_id, target_id). The dashboard's per-target
-- value is the decaying weighted average (w = 0.60) of these rows in date order.
CREATE TABLE IF NOT EXISTS public.mastery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                      -- matches existing convention (e.g. lesson_progress.user_id)
  user_email TEXT,
  target_id UUID NOT NULL REFERENCES public.learning_targets(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level IN (1,2,3)), -- Marzano formative level
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_source TEXT,                       -- exit ticket, lab, conversation, quiz item…
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mastery_records_user ON public.mastery_records(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_records_target ON public.mastery_records(target_id);
CREATE INDEX IF NOT EXISTS idx_mastery_records_user_target ON public.mastery_records(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_mastery_records_observed ON public.mastery_records(observed_at);

-- Mastery-task results — the standalone summative readout. NEVER blended into
-- the K/R/S/P growth lines.
CREATE TABLE IF NOT EXISTS public.mastery_task_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  mastery_task_id UUID NOT NULL REFERENCES public.mastery_tasks(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,                      -- { science|reasoning|communication|transfer: 0..4 }
  overall NUMERIC,                            -- lowest-dimension rule
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mastery_task_results_user ON public.mastery_task_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_task_results_task ON public.mastery_task_results(mastery_task_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Mirrors the self-contained pattern used in create_simulation_tool_system.sql
-- (app.admin_emails / app.teacher_emails settings). Note: the app writes student
-- data via the service-role client (supabaseAdmin), which bypasses RLS; these
-- policies are the backstop for any anon/authenticated access.

ALTER TABLE public.learning_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_task_results ENABLE ROW LEVEL SECURITY;

-- Content is readable by anyone signed in; only staff manage it.
DROP POLICY IF EXISTS "Anyone can view learning targets" ON public.learning_targets;
CREATE POLICY "Anyone can view learning targets"
  ON public.learning_targets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage learning targets" ON public.learning_targets;
CREATE POLICY "Staff manage learning targets"
  ON public.learning_targets FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Anyone can view mastery tasks" ON public.mastery_tasks;
CREATE POLICY "Anyone can view mastery tasks"
  ON public.mastery_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage mastery tasks" ON public.mastery_tasks;
CREATE POLICY "Staff manage mastery tasks"
  ON public.mastery_tasks FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- Mastery records: a student may read their own; staff read/write all.
-- (Records are teacher-assessed by default — students do not self-insert. Easy
--  to relax later if you want student self-reporting.)
DROP POLICY IF EXISTS "Students view own mastery records" ON public.mastery_records;
CREATE POLICY "Students view own mastery records"
  ON public.mastery_records FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff manage all mastery records" ON public.mastery_records;
CREATE POLICY "Staff manage all mastery records"
  ON public.mastery_records FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

DROP POLICY IF EXISTS "Students view own task results" ON public.mastery_task_results;
CREATE POLICY "Students view own task results"
  ON public.mastery_task_results FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff manage all task results" ON public.mastery_task_results;
CREATE POLICY "Staff manage all task results"
  ON public.mastery_task_results FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- ============================================================================
-- SEED — Unit 1 (Motion & Forces, Asteroid 2026-XJ)
-- ============================================================================
-- 18 growth-tree targets (Knowledge x2, Reasoning x11, Skill x5) plus 1
-- metacognitive workshop target flagged exclude_from_growth.

INSERT INTO public.learning_targets
  (slug, statement, domain, unit_id, content_strand, standard_refs, exclude_from_growth, order_index)
VALUES
  ('u1.anchor-know-unknow', 'I can describe what we currently know and don''t know about 2026-XJ, and identify what physics tools I would need to learn more.', 'reasoning', 'unit-1', 'motion-kinematics', NULL, FALSE, 1),
  ('u1.vocab-position-distance-displacement', 'I can use precise vocabulary (position, distance, displacement) to describe motion, and I can tell the difference between scalar and vector quantities.', 'knowledge', 'unit-1', 'motion-kinematics', NULL, FALSE, 2),
  ('u1.capture-pt-graph', 'I can capture a position–time graph with a Vernier motion detector and explain what its slope tells me about velocity.', 'skill', 'unit-1', 'motion-kinematics', NULL, FALSE, 3),
  ('u1.read-vt-graph-components', 'I can read a velocity-time graph and break a 2-D velocity into its toward-Earth and perpendicular components.', 'reasoning', 'unit-1', 'motion-kinematics', NULL, FALSE, 4),
  ('u1.predict-position-uncertainty', 'I can use velocity and time to predict an object''s future position, and I can express uncertainty in a prediction.', 'reasoning', 'unit-1', 'motion-kinematics', NULL, FALSE, 5),
  ('u1.vectors-tip-to-tail', 'I can add two vectors tip-to-tail and break a vector into components with simple trig.', 'skill', 'unit-1', 'motion-kinematics', NULL, FALSE, 6),
  ('u1.acceleration-rate-of-change', 'I can define acceleration as the rate of change of velocity and calculate it from velocity-time data.', 'reasoning', 'unit-1', 'motion-kinematics', NULL, FALSE, 7),
  ('u1.pick-equation-of-motion', 'I can pick and use the right equation of motion for a constant-acceleration problem.', 'reasoning', 'unit-1', 'motion-kinematics', NULL, FALSE, 8),
  ('u1.newtons-first-law-inertia', 'I can explain Newton''s 1st Law in my own words and find everyday examples of inertia.', 'reasoning', 'unit-1', 'forces-dynamics', NULL, FALSE, 9),
  ('u1.identify-forces', 'I can identify the types of force in a scenario (gravity, normal, friction, applied, tension) and draw them as arrows.', 'knowledge', 'unit-1', 'forces-dynamics', NULL, FALSE, 10),
  ('u1.lab-accel-vs-mass', 'I can measure how acceleration changes when I change mass at constant force.', 'skill', 'unit-1', 'forces-dynamics', ARRAY['HS-PS2-1'], FALSE, 11),
  ('u1.lab-accel-vs-force', 'I can measure how acceleration changes when I change the force at constant mass — and combine it with Day 11 to get F = ma.', 'skill', 'unit-1', 'forces-dynamics', ARRAY['HS-PS2-1'], FALSE, 12),
  ('u1.fma-solve-net-force', 'I can use F = ma to solve problems — always finding the NET force first.', 'reasoning', 'unit-1', 'forces-dynamics', ARRAY['HS-PS2-1'], FALSE, 13),
  ('u1.third-law-pairs', 'I can identify Newton''s 3rd Law force pairs and explain why they don''t cancel.', 'reasoning', 'unit-1', 'forces-dynamics', NULL, FALSE, 14),
  ('u1.draw-fbd', 'I can draw a free body diagram showing all forces on one object, with arrows sized to the forces.', 'skill', 'unit-1', 'forces-dynamics', NULL, FALSE, 15),
  ('u1.net-force-from-fbd', 'I can find the net force on an object from its FBD and use it to find acceleration.', 'reasoning', 'unit-1', 'forces-dynamics', ARRAY['HS-PS2-1'], FALSE, 16),
  ('u1.friction-static-kinetic', 'I can explain friction as a force that depends on the surfaces and the normal force, and tell static from kinetic friction.', 'reasoning', 'unit-1', 'forces-dynamics', NULL, FALSE, 17),
  ('u1.equilibrium-find-unknown', 'I can recognize when ΣF = 0 and use that to find an unknown force.', 'reasoning', 'unit-1', 'forces-dynamics', NULL, FALSE, 18),
  ('u1.workshop-self-diagnose', 'I can find my own weak spots from Unit 1 and work to fix them before the transfer task.', 'reasoning', 'unit-1', NULL, NULL, TRUE, 19)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.mastery_tasks (slug, unit_id, prompt, rubric)
VALUES (
  'u1.mastery-task',
  'unit-1',
  'Apply all of Unit 1''s tools — vectors, F = ma, FBDs, equilibrium — to asteroid 2026-XJ in one integrated, public-facing analysis.',
  '{
    "science": {"description": "Correct physics: vectors, kinematics, units."},
    "reasoning": {"description": "Sound method; uncertainty explained, not just stated."},
    "communication": {"description": "Work shown, units labeled, organized, readable."},
    "transfer": {"description": "Honest public-facing connection to 2026-XJ."}
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.learning_targets IS 'First-class learning targets (kinds-of-thinking domains). Source of truth: src/data/curriculum-types.ts.';
COMMENT ON TABLE public.mastery_records IS 'Append-only, longitudinal Marzano (1-3) observations per student per target. Rolled up via decaying weighted average (w=0.60).';
COMMENT ON TABLE public.mastery_tasks IS 'Summative mastery task scored on the 4-D rubric; stands separate from the growth tree.';
COMMENT ON TABLE public.mastery_task_results IS 'Per-student 4-D rubric scores. NEVER blended into the K/R/S/P growth lines.';
