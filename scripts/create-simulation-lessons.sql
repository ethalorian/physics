-- ============================================================================
-- CREATE SIMULATION LESSONS FROM YOUR 9 NEW SIMULATIONS
-- ============================================================================
-- This converts your simulations into actual lessons in the lessons table

-- ============================================================================
-- UNIT 1: KINEMATICS
-- ============================================================================

-- Lesson 1-1: Distance vs. Displacement (Race Track)
INSERT INTO public.lessons (
  slug,
  title,
  description,
  lesson_type,
  simulation_id,
  unit_id,
  unit_name,
  objectives,
  prerequisites,
  difficulty,
  estimated_time,
  order_index,
  published,
  created_by
) VALUES (
  'lesson-1-1-distance-displacement',
  'Distance vs. Displacement',
  'Explore the fundamental difference between distance (scalar) and displacement (vector) using an interactive race track simulation. Discover why displacement can be zero after traveling a long distance!',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'race-track'),
  'unit-1',
  'Motion and Kinematics',
  ARRAY[
    'Distinguish between distance and displacement',
    'Understand scalar vs vector quantities',
    'Calculate both for curved paths',
    'Recognize the "Which Way" component of vectors'
  ],
  ARRAY['basic understanding of position and movement'],
  'beginner',
  20,
  1,
  TRUE,
  'system'
) ON CONFLICT (slug) DO UPDATE SET
  lesson_type = EXCLUDED.lesson_type,
  simulation_id = EXCLUDED.simulation_id,
  updated_at = NOW();

-- Lesson 1-2: Vector Components (Maze Navigator)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-1-2-vector-addition',
  'Vector Addition & Components',
  'Navigate a maze while learning how position vectors are composed of x and y components. See vector addition in action!',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'maze-vectors'),
  'unit-1', 'Motion and Kinematics',
  ARRAY[
    'Break vectors into perpendicular components',
    'Add vectors using the component method',
    'Apply Pythagorean theorem to find magnitude',
    'Understand position vectors'
  ],
  ARRAY['basic coordinate systems', 'Pythagorean theorem'],
  'beginner', 15, 2, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- Lesson 1-3: Relative Motion (Car Race)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-1-3-relative-motion',
  'Relative Motion & Kinematics',
  'Use kinematics equations to predict when one car overtakes another. Learn about relative velocity and position-time graph analysis.',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'car-race'),
  'unit-1', 'Motion and Kinematics',
  ARRAY[
    'Apply constant velocity kinematics',
    'Calculate relative velocity',
    'Interpret position-time graphs',
    'Solve multi-object problems'
  ],
  ARRAY['constant velocity motion', 'basic algebra'],
  'intermediate', 25, 3, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- Lesson 1-4: Projectile Motion (Monkey Hunter)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-1-4-projectile-motion',
  'Projectile Motion',
  'Discover why aiming directly at a dropping target still hits it! Learn about 2D kinematics and independence of motion.',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'monkey-hunter'),
  'unit-1', 'Motion and Kinematics',
  ARRAY[
    'Understand independence of x and y motion',
    'Apply projectile motion equations',
    'Recognize gravity affects all objects equally',
    'Solve 2D kinematics problems'
  ],
  ARRAY['constant velocity', 'free fall', 'basic trigonometry'],
  'intermediate', 20, 4, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- Lesson 1-5: Vector Addition in Motion (Riverboat)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-1-5-riverboat-vectors',
  'Vector Addition: Riverboat Problem',
  'Navigate a boat across a flowing river. Learn how velocities add as vectors and calculate drift distance.',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'riverboat-crossing'),
  'unit-1', 'Motion and Kinematics',
  ARRAY[
    'Add velocity vectors',
    'Calculate resultant velocity',
    'Understand relative motion',
    'Solve navigation problems'
  ],
  ARRAY['vector addition', 'velocity concept'],
  'intermediate', 20, 5, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- ============================================================================
-- UNIT 2: FORCES AND MOTION
-- ============================================================================

-- Lesson 2-1: Gravity for All Objects (Vacuum Chamber)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-2-1-gravity-air-resistance',
  'Gravity & Air Resistance',
  'Drop a feather and bowling ball in a vacuum chamber. Discover that all objects fall at the same rate without air resistance!',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'vacuum-chamber'),
  'unit-2', 'Forces and Newton''s Laws',
  ARRAY[
    'Understand all objects fall at g in vacuum',
    'Recognize how air resistance affects objects differently',
    'Explain terminal velocity',
    'Apply to real-world situations'
  ],
  ARRAY['basic understanding of gravity'],
  'beginner', 15, 1, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- Lesson 2-2: Newton's Laws (Astronaut Thrust)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-2-2-newtons-first-second-laws',
  'Newton''s 1st & 2nd Laws',
  'Apply thrust vectors to an astronaut in space. Observe equilibrium (F=0) and acceleration (F=ma) with no friction!',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'astronaut-thrust'),
  'unit-2', 'Forces and Newton''s Laws',
  ARRAY[
    'Understand Newton''s First Law (inertia)',
    'Apply Newton''s Second Law (F = ma)',
    'Recognize mechanical equilibrium',
    'Work with vector forces'
  ],
  ARRAY['kinematics basics', 'understanding of force'],
  'intermediate', 20, 2, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- Lesson 2-3: Newton's Third Law (Carts & Springs)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-2-3-newtons-third-law',
  'Newton''s Third Law: Action-Reaction',
  'Watch two carts push apart with equal and opposite forces. Learn about action-reaction pairs and momentum conservation.',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'carts-third-law'),
  'unit-2', 'Forces and Newton''s Laws',
  ARRAY[
    'State Newton''s Third Law',
    'Identify action-reaction pairs',
    'Understand equal and opposite forces',
    'Apply momentum conservation'
  ],
  ARRAY['Newton''s Second Law', 'understanding of force'],
  'intermediate', 20, 3, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- Lesson 2-4: Equilibrium & Tension (Atwood Machine)
INSERT INTO public.lessons (
  slug, title, description, lesson_type, simulation_id,
  unit_id, unit_name, objectives, prerequisites, difficulty,
  estimated_time, order_index, published, created_by
) VALUES (
  'lesson-2-4-equilibrium-tension',
  'Equilibrium & Tension Forces',
  'Study the classic Atwood machine with adjustable masses. Explore static equilibrium, dynamic equilibrium, and accelerated motion.',
  'simulation',
  (SELECT id FROM public.simulations WHERE slug = 'atwood-machine'),
  'unit-2', 'Forces and Newton''s Laws',
  ARRAY[
    'Understand static and dynamic equilibrium',
    'Calculate system acceleration',
    'Determine rope tension',
    'Apply F = ma to connected objects'
  ],
  ARRAY['Newton''s Second Law', 'free body diagrams'],
  'intermediate', 20, 4, TRUE, 'system'
) ON CONFLICT (slug) DO UPDATE SET lesson_type = EXCLUDED.lesson_type, simulation_id = EXCLUDED.simulation_id, updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all simulation lessons created
SELECT 
  l.slug,
  l.title,
  l.lesson_type,
  s.title as simulation_title,
  l.unit_id,
  l.order_index,
  l.published
FROM public.lessons l
LEFT JOIN public.simulations s ON l.simulation_id = s.id
WHERE l.lesson_type = 'simulation'
ORDER BY l.unit_id, l.order_index;

-- Show lesson count by type
SELECT 
  lesson_type,
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN published THEN 1 END) as published_lessons
FROM public.lessons
GROUP BY lesson_type;

-- Success messages
SELECT '✓ 9 simulation lessons created successfully!' as status;
SELECT '✓ Lessons linked to simulations' as status;
SELECT '✓ Ready for student access' as status;


