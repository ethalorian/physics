-- Add the Unit 2 / Unit 3 simulations (Spine C-Asteroid) to the catalog.
--   picket-fence-g     · Unit 2 · Vernier lab 2.1 (measure g)
--   cart-collisions    · Unit 3 · Vernier lab 3.1 (momentum conservation)
--   impulse-momentum   · Unit 3 · Vernier lab 3.2 (impulse = area = Δp)
--   dart-deflection    · Unit 3 · capstone (kinetic-impactor deflection)
--
-- Uses the current catalog conventions (unit id, topic, sort_order, tags), which
-- the gallery (/api/simulations) reads to group and order the cards. Idempotent:
-- re-running updates the existing rows by slug.

INSERT INTO public.simulations (
    title, slug, description, category, unit, topic, difficulty, sort_order,
    component_path, estimated_time, objectives, key_concepts, tags,
    can_embed, has_ai_guide, published, created_by
)
VALUES
(
    'Picket-Fence g — Measuring Free-Fall Acceleration',
    'picket-fence-g',
    'Drop a banded strip through a photogate and read free-fall acceleration off the slope of its velocity-time points - the same g for any mass.',
    'kinematics', 'unit-2', 'Gravity & free fall', 'intermediate', 10,
    '/simulations/picket-fence-g', 20,
    ARRAY['Measure g from photogate timing','The slope of a velocity-time graph is g','g is independent of mass'],
    ARRAY['Free fall','Photogate timing','Velocity from spacing over time','Mass independence'],
    ARRAY['free-fall','gravity','acceleration','photogate','velocity-time','slope','mass-independence','vernier','asteroid'],
    true, false, true, 'system'
),
(
    'Cart Collisions — Conservation of Momentum',
    'cart-collisions',
    'Two carts collide. Slide from elastic to inelastic and watch total momentum stay conserved while kinetic energy does not.',
    'momentum', 'unit-3', 'Momentum & collisions', 'intermediate', 10,
    '/simulations/cart-collisions', 20,
    ARRAY['Predict 1D collisions with momentum conservation','Distinguish elastic from inelastic collisions','Momentum and energy are independent conservation laws'],
    ARRAY['Momentum conservation','Elastic vs inelastic','Coefficient of restitution'],
    ARRAY['momentum','conservation-of-momentum','collisions','elastic','inelastic','coefficient-of-restitution','kinetic-energy','carts','vernier','asteroid'],
    true, false, true, 'system'
),
(
    'Impulse & Momentum — Area Under the Force Curve',
    'impulse-momentum',
    'A cart hits a force sensor. The area under the force-time pulse is the impulse and the change in momentum; soften the bumper to drop the peak force.',
    'momentum', 'unit-3', 'Impulse', 'intermediate', 20,
    '/simulations/impulse-momentum', 20,
    ARRAY['Calculate impulse as the area under a force-time graph','Apply the impulse-momentum theorem','A longer contact time lowers the peak force'],
    ARRAY['Impulse','Momentum change','Contact time vs peak force'],
    ARRAY['impulse','momentum','impulse-momentum-theorem','force-time-graph','area-under-curve','contact-time','peak-force','airbag','force-sensor','vernier','asteroid'],
    true, false, true, 'system'
),
(
    'Kinetic Impactor — Deflecting the Asteroid',
    'dart-deflection',
    'Fire a DART-style impactor at the asteroid. Momentum transfer gives a tiny velocity change that grows into a miss distance over years of lead time.',
    'momentum', 'unit-3', 'Asteroid deflection', 'advanced', 30,
    '/simulations/dart-deflection', 25,
    ARRAY['Apply momentum conservation to a kinetic impactor','The asteroid velocity change depends on impactor momentum','Lead time is the dominant lever in deflection'],
    ARRAY['Momentum transfer','Deflection velocity','Lead time'],
    ARRAY['momentum','conservation-of-momentum','impulse','asteroid','asteroid-deflection','planetary-defense','kinetic-impactor','dart-mission','delta-v','lead-time','space-physics'],
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
