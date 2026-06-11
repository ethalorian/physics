-- Apply Unit 3: Momentum & Collisions lesson blocks + learning targets (paste into Supabase SQL editor).
-- Generated from /sessions/laughing-zen-feynman/mnt/physics-classroom/src/data/unit3-blocks/*.json
BEGIN;

-- Learning targets
INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.anchor-two-questions', 'I can name the two things that make a moving object hard to stop and frame the two Unit 3 questions about 2026-XJ.', 'reasoning', 'unit-3', 1)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.k1-momentum-vector', 'I can compute p = m·v with correct units and use momentum as a vector with signed velocities.', 'knowledge', 'unit-3', 2)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.k2-impulse-theorem', 'I can derive FΔt = Δp from F = ma and use the impulse-momentum theorem.', 'knowledge', 'unit-3', 3)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.s1-compute-impulse', 'I can compute momentum, Δp, and impulse, and find force from Δp and Δt.', 'skill', 'unit-3', 4)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.r1-extend-time', 'I can explain why extending Δt reduces F for the same Δp and apply it to safety devices and follow-through.', 'reasoning', 'unit-3', 5)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.k3-conservation', 'I can state conservation of momentum and its no-net-external-force condition, and solve recoil problems.', 'knowledge', 'unit-3', 6)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.k4-collision-types', 'I can distinguish elastic, inelastic, and perfectly inelastic collisions and which conservation laws apply to each.', 'knowledge', 'unit-3', 7)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.s4-vernier-collisions', 'I can run Vernier cart collisions, compute Σp before and after, and report % difference with a credible error source.', 'skill', 'unit-3', 8)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.s2-inelastic-solve', 'I can solve a 1D perfectly inelastic collision with correct signs and units.', 'skill', 'unit-3', 9)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.s3-elastic-solve', 'I can solve a 1D elastic collision, including the equal-mass and one-at-rest special cases.', 'skill', 'unit-3', 10)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.r2-2d-components', 'I can apply conservation of momentum separately to x- and y-components and solve a 2D glancing collision.', 'reasoning', 'unit-3', 11)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.r3-deflection', 'I can compute a DART-style Δv and reason about asteroid deflection using Δv × lead time.', 'reasoning', 'unit-3', 12)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.r4-impact-analysis', 'I can compute an asteroid impact''s average force and explain why Earth''s velocity change is negligible while the local force is catastrophic.', 'reasoning', 'unit-3', 13)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.synthesis-two-branch', 'I can run a full 2026-XJ analysis on both branches (deflection and impact) and articulate which unit ideas were load-bearing.', 'reasoning', 'unit-3', 14)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u3.transfer-task', 'I can apply every Unit 3 tool independently on the transfer task.', 'reasoning', 'unit-3', 15)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

-- Lessons
INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 1 — Re-anchoring: What If It Hits, and Can We Nudge It?', 'u3-d01', 'Unit 3: Momentum & Collisions', 1, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can name the two things that make a moving object hard to stop, and I can frame the two questions Unit 3 must answer about 2026-XJ.",
      "targetId": "u3.anchor-two-questions"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Unit 2: 2026-XJ and Earth arrive at the orbit-crossing point within HOURS of each other. Closest-approach distance: 40,000–100,000 km — inside the Moon's orbit.",
      "connection": "Unit 2 told us WHERE 2026-XJ is going. Today we open Unit 3 with two new questions: (1) IF it hits, what does the physics say? (2) Could we PUSH it off course before it gets here, like NASA's DART mission did in 2022?"
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "NASA / Planetary Defense Briefing — Update 3",
      "markdown": "NASA has run high-precision ephemeris simulations and confirmed: at current trajectory, 2026-XJ and Earth will arrive at the orbit-crossing point within **HOURS** of each other. Refined closest-approach distance: somewhere between **40,000 and 100,000 km**. For reference, Earth's radius is 6,371 km, and the Moon orbits at about 384,000 km. So: not a definite impact — but uncomfortably **inside the Moon's orbit**.\n\nPrecedent on the table: in 2022, NASA's **DART** mission deliberately crashed a 600-kg spacecraft into a small asteroid called Dimorphos and changed its orbital period by 32 minutes. The math behind DART is exactly the math you'll learn this unit.\n\n*This is fiction. The physics — and the equations — are real.*"
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## What makes something hard to stop?\n\nWatch the three crashes (live or in the simulation below):\n\n- **A** — a toy car rolls *gently* into a cardboard wall. The wall stands.\n- **B** — the *same* car going **fast**. The wall moves.\n- **C** — a **heavier** cart at the slow speed. The wall moves.\n\nA vs. B says **speed** matters. A vs. C says **mass** matters. Two properties, multiplied together — that product gets a name tomorrow: **momentum**."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — the wall crashes",
      "markdown": "We ran the Hot Wheels crashes live. At home, run the cart-collision simulation below: vary the mass, then vary the speed, and watch what changes how hard the carts slam."
    },
    {
      "id": "b6",
      "type": "sim_embed",
      "simulationSlug": "cart-collisions"
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch the three crash cases (A: slow car, B: fast car, C: heavy cart slow). Circle the cases where the wall MOVES. Then write: what do A & B tell you? What do A & C tell you? What TWO things matter?",
      "prompts": [
        "Three quick panels: A, B, C.",
        "Circle the wall-movers.",
        "Name the TWO properties that matter."
      ]
    },
    {
      "id": "b8",
      "type": "observation",
      "capture": true,
      "patternPrompt": "What did you NOTICE in the crash demos (live or in the simulation)?",
      "interpretPrompt": "What do you WONDER about stopping — or deflecting — something as big as an asteroid?",
      "frame": "I notice ___. I wonder ___."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write your ONE question about deflecting (or surviving) an asteroid.",
      "frame": "My one question is ___."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Between (a) a 1500-kg car at 30 m/s and (b) a 0.05-kg bullet at 400 m/s, which would be HARDER to stop with your hand? Why? (Both have honest defenses — name the trade-off.)",
      "frame": "I'd say ___ is harder to stop, because even though ___, its ___ is much bigger."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.anchor-two-questions"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 2 — Momentum p = m·v', 'u3-d02', 'Unit 3: Momentum & Collisions', 2, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write p = m·v, give the units (kg·m/s), compute momentum for a moving object, and explain why momentum is a VECTOR (sign and direction matter).",
      "targetId": "u3.k1-momentum-vector"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's mass is ~10⁹ kg; its speed (with respect to Earth) is ~30 km/s.",
      "connection": "Today we put a NUMBER on what makes the asteroid hard to stop. Spoiler: the number is enormous, and the rest of Unit 3 figures out what to do with that fact."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Momentum: mass in motion\n\n**p = m·v** — units: **kg·m/s**.\n\nMomentum is a **vector**: it points the same direction as the velocity. That's not bookkeeping pedantry — when two objects move in *opposite* directions, one of them carries **negative** momentum, and the negatives do real work in every calculation this unit.\n\nThe rule for change: **Δp = p_f − p_i = m·(v_f − v_i)**, with signed velocities. Pick a positive direction first, assign signs second, compute third."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Momentum (p)",
          "definition": "A measure of how hard it is to stop a moving object. p = m·v. Vector — has the same direction as the velocity. A 1500-kg car at 30 m/s has p = 45,000 kg·m/s; a 0.05-kg bullet at 400 m/s has p = 20 kg·m/s. The car wins.",
          "cognate": "Sp. cantidad de movimiento (momento lineal) · Pt. quantidade de movimento · HC kantite mouvman"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Momentum is NOT the same as speed",
      "markdown": "A slow heavy thing can have MORE momentum than a fast light thing. A drifting cruise ship out-momentums a rifle bullet by orders of magnitude."
    },
    {
      "id": "b6",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Object",
        "m (kg)",
        "v (m/s)",
        "p = m·v (kg·m/s)"
      ],
      "rows": 5,
      "plot": false,
      "patternPrompt": "Compute p for each object you choose (try: bullet, sprinter, car, loaded truck, cruise ship). Rank biggest to smallest. What surprised you about the spread?"
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "A 1500-kg car moves east at 30 m/s. Find its momentum (magnitude AND direction).",
      "given": "m = 1500 kg · v = 30 m/s east",
      "equation": "p = m·v",
      "work": "p = 1500 × 30 = 45,000 kg·m/s\np = 4.5 × 10⁴ kg·m/s east",
      "answer": "4.5 × 10⁴ kg·m/s east. (East matters — p is a vector.)"
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "2026-XJ has mass m = 1.0 × 10⁹ kg and approaches at v = 3.0 × 10⁴ m/s toward Earth. Find its momentum.",
      "givenHint": "The asteroid's mass and speed (toward Earth).",
      "equationHint": "p = m·v — keep the powers of ten organized.",
      "equationIds": [
        "momentum",
        "impulse",
        "newton-2nd",
        "avg-speed"
      ]
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "A 0.15-kg baseball moves east at 40 m/s, meets the bat, and bounces back west at 50 m/s. What is the CHANGE in its momentum, Δp = p_f − p_i? (Hint: pick east = positive, so v_f = −50.)",
      "givenHint": "m = 0.15 kg, v_i = +40 m/s, v_f = −50 m/s. Write the sign convention first.",
      "equationHint": "Δp = m·(v_f − v_i) — with SIGNED velocities.",
      "equationIds": [
        "momentum",
        "impulse"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "warning",
      "title": "Sign matters",
      "markdown": "If you ignore the negative on v_f, your Δp will look like 1.5 kg·m/s. The real Δp is **−13.5 kg·m/s** — almost 10× bigger. The direction of Δp is opposite v_i."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 0.15-kg baseball moves east at 40 m/s. After the bat, it goes WEST at 50 m/s. Find Δp — force the sign. Then complete the cruise-ship frame.",
      "frame": "Δp = ___ kg·m/s. Momentum is bigger for the cruise ship than the bullet because, even though the ship is ___, its ___ is overwhelmingly larger."
    },
    {
      "id": "rd-ch08-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **8.1** (momentum — inertia in motion; what makes momentum large). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch08-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 8,
      "title": "Momentum — read & practice",
      "sectionIds": [
        "8.1"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.k1-momentum-vector"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 3 — Impulse: J = F·Δt = Δp', 'u3-d03', 'Unit 3: Momentum & Collisions', 3, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can derive FΔt = Δp from F = ma, name FΔt as impulse, and use the equation to find force, time, or change in momentum given the other two.",
      "targetId": "u3.k2-impulse-theorem"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "To CHANGE 2026-XJ's momentum we need to apply a force OVER A TIME.",
      "connection": "Today's equation IS the DART equation. A small spacecraft, hitting an asteroid for a tiny instant, delivers a Δp — same math we use for a bat hitting a ball."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Where FΔt = Δp comes from\n\nStart with Unit 1's law and unpack the acceleration:\n\n**F = m·a = m·(Δv/Δt)**\n\nMultiply both sides by Δt:\n\n**F·Δt = m·Δv = Δp**\n\nName F·Δt the **impulse**, J. Then **J = Δp**. Units check: N·s = kg·m/s — impulse and momentum are the same kind of quantity, which is exactly why one can change the other."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Impulse (J)",
          "definition": "The product of force and the time it acts: J = F·Δt. Equals the change in momentum Δp. A 0.002-s bat-hit at 6,750 N delivers J = 13.5 N·s of impulse to the baseball.",
          "cognate": "Sp. impulso · Pt. impulso · HC enpilsyon"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Impulse is NOT just force",
      "markdown": "It's force × TIME. Half the force for twice the time gives the **same** impulse — and the same Δp."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "See it in the simulation",
      "markdown": "Run the impulse-momentum simulation below. Watch the F-vs-t graph during the collision: the AREA under that curve is the impulse, and it always equals the cart's Δp."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "impulse-momentum"
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "A 0.15-kg baseball moves east at 40 m/s, then rebounds WEST at 50 m/s. Bat-ball contact lasts 0.002 s. Find (a) Δp, (b) the average force.",
      "given": "m = 0.15 kg · v_i = +40 m/s · v_f = −50 m/s · Δt = 0.002 s",
      "equation": "Δp = m·(v_f − v_i) ; F = Δp / Δt",
      "work": "Δp = 0.15·(−50 − 40) = 0.15·(−90) = −13.5 kg·m/s\nF = −13.5 / 0.002 = −6750 N",
      "answer": "Δp = −13.5 kg·m/s (westward). F ≈ −6750 N (westward, applied BY the bat ON the ball)."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "DART hit Dimorphos for about 0.05 s with an average force of about 8 × 10⁵ N. What change in asteroid momentum did it deliver?",
      "givenHint": "F = 8 × 10⁵ N and Δt = 0.05 s.",
      "equationHint": "J = F·Δt = Δp.",
      "equationIds": [
        "impulse",
        "momentum",
        "newton-2nd"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Two roads to the same J",
      "markdown": "The same J can come from **BIG F over a SHORT Δt** or **SMALL F over a LONG Δt**. That choice is tomorrow's payoff — it's the difference between DART and a gravity tractor."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "DART hit its target for 0.05 s with an average 8×10⁵ N. What Δp did it deliver to the asteroid? Show your work.",
      "frame": "J = F·Δt = ___ × ___ = ___ kg·m/s = Δp."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.k2-impulse-theorem"
    },
    {
      "id": "rd-ch08-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **8.2** (impulse changes momentum; increasing vs. decreasing momentum; extending impact time). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch08-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 8,
      "title": "Momentum — read & practice",
      "sectionIds": [
        "8.2"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.s1-compute-impulse"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 4 — Why Impulse Matters: Airbags, Follow-Through', 'u3-d04', 'Unit 3: Momentum & Collisions', 4, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can explain why extending Δt reduces the force needed to deliver the same Δp, and I can apply this to airbags, padded floors, follow-through, and asteroid deflection.",
      "targetId": "u3.r1-extend-time"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "To deflect 2026-XJ we want the LARGEST Δp possible — either short-and-hard (DART) or long-and-soft (gravity tractor).",
      "connection": "Same physics that saves lives in a car crash (long Δt, small F) shapes how planetary defense engineers design asteroid pushers."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The trade nobody can escape\n\nJ = F·Δt is a fixed budget: if the Δp is decided (a sprinter must stop; a ball must reverse), then **F and Δt trade off exactly**.\n\n- Stretch Δt by 10× → F drops to **1/10**.\n- That's an airbag, a crumple zone, a gymnastics mat, a parkour roll, bent knees on a landing.\n- Flip the goal: a hitter wants MORE Δp delivered to the ball. **Follow-through** extends Δt → bigger J → bigger Δp → ball goes farther.\n\nSame equation, both directions."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Crumple zone / cushion",
          "definition": "A region designed to DEFORM during impact, extending Δt and so reducing peak force. Modern car fronts are designed to crumple: same Δp, but Δt × 5 means F ÷ 5.",
          "cognate": "Sp. zona de absorción · Pt. zona de deformação"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "A crumple zone doesn't 'absorb momentum'",
      "markdown": "Δp is the SAME either way — the car still stops. The crumple zone **spreads the time**, so the peak force drops. Don't say momentum was absorbed; say the time was stretched."
    },
    {
      "id": "b6",
      "type": "graph",
      "title": "Same Δp = 720 kg·m/s — force vs. stopping time",
      "xLabel": "Stopping time Δt (s)",
      "yLabel": "Average force F (N)",
      "genPrompt": "F = 720/Δt hyperbola showing the force-time tradeoff for a fixed impulse of 720 N·s.",
      "series": [
        {
          "label": "F = Δp / Δt",
          "points": [
            [
              0.05,
              14400
            ],
            [
              0.1,
              7200
            ],
            [
              0.2,
              3600
            ],
            [
              0.3,
              2400
            ],
            [
              0.4,
              1800
            ],
            [
              0.5,
              1440
            ],
            [
              0.75,
              960
            ],
            [
              1,
              720
            ]
          ]
        }
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "An 80-kg sprinter at 9 m/s stops in (a) 0.05 s on concrete, or (b) 0.5 s into a foam pit. Compute the average force in each case.",
      "given": "m = 80 kg · Δv = 9 m/s (he stops) · Δt_a = 0.05 s · Δt_b = 0.5 s",
      "equation": "Δp = m·Δv ; F = Δp / Δt",
      "work": "Δp = 80·9 = 720 kg·m/s (same for both)\nF_a = 720 / 0.05 = 14,400 N (concrete)\nF_b = 720 / 0.5 = 1,440 N (foam — 10× smaller!)",
      "answer": "Concrete: 14.4 kN. Foam: 1.44 kN. Stretching Δt by 10× cut F by 10×."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "Pick one: airbag, helmet, boxing glove, gymnastics mat, parkour roll, or follow-through on a tennis swing. Explain how it uses LONGER Δt to reduce F for the SAME Δp (or, for follow-through, longer Δt to deliver MORE Δp). Be specific about what physically extends the contact time.",
      "givenHint": "Name your case and what the Δp is (what stops, or what speeds up).",
      "equationHint": "J = F·Δt = Δp — argue with the equation, not just words.",
      "equationIds": [
        "impulse",
        "momentum"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does a boxer 'roll with the punch'? Use 'Δp', 'Δt', and 'F' in your answer.",
      "frame": "Rolling with the punch keeps ___ roughly the same but makes ___ larger — which makes ___ smaller."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.r1-extend-time"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 5 — Conservation of Momentum: Explosions & Recoil', 'u3-d05', 'Unit 3: Momentum & Collisions', 5, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can state conservation of momentum (Σp_before = Σp_after) and its condition (no net external force), and I can use it to solve recoil/explosion problems.",
      "targetId": "u3.k3-conservation"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "When DART hit Dimorphos, total momentum BEFORE = total momentum AFTER. The asteroid sped up; the spacecraft slowed (and was destroyed).",
      "connection": "Today's rule is the BIG one of the unit. The next eight days are all special cases of it."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The big rule\n\n**Σp_before = Σp_after** — total momentum of a system stays constant, **provided no net EXTERNAL force acts**.\n\nInternal forces don't count. Bullet pushes rifle, rifle pushes bullet — those are internal to the bullet+rifle system, and they cancel (Newton's 3rd Law, Unit 1). Only an outside push — friction, gravity pulling the system sideways, a wall — can change the total.\n\nFor recoil/explosion problems the recipe is short: the system starts at rest, so **Σp = 0 before and 0 after**. Whatever momentum one piece carries east, the other piece must carry west."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Conservation of momentum",
          "definition": "If the NET external force on a system is zero, the TOTAL momentum of the system stays constant: Σp_before = Σp_after. A rifle at rest fires a bullet east; the rifle recoils west; total p stays zero.",
          "cognate": "Sp. conservación del momento · Pt. conservação do momento · HC konsèvasyon mouvman"
        },
        {
          "term": "Recoil",
          "definition": "When an object at rest splits into two pieces (or expels mass), the pieces move in opposite directions so total p stays the same. The smaller mass moves FASTER: m₁v₁ = m₂v₂ in size, opposite in sign.",
          "cognate": "Sp. retroceso · Pt. recuo · HC rekil"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "The condition is NO NET EXTERNAL FORCE — not 'no forces'",
      "markdown": "Internal forces (between bullet and rifle, between two exploding pieces) are fine — they cancel in pairs. Only EXTERNAL forces (friction, a wall, gravity acting unevenly) can change the system's total p."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Watch recoil happen",
      "markdown": "Run the third-law carts simulation below: two carts at rest push apart. Watch the lighter cart leave faster — exactly what 0 = m₁v₁ + m₂v₂ demands."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "carts-third-law"
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "A 70-kg ice skater (initially at rest) throws a 5-kg ball east at 8 m/s. What is the skater's recoil velocity?",
      "given": "m_skater = 70 kg · m_ball = 5 kg · v_ball = +8 m/s east · both at rest before",
      "equation": "Σp_before = Σp_after → 0 = m_skater·v_skater + m_ball·v_ball",
      "work": "0 = 70·v_skater + 5·(+8)\n0 = 70·v_skater + 40\nv_skater = −40/70 ≈ −0.57 m/s",
      "answer": "Skater drifts WEST at about 0.57 m/s. (Small, because she's 14× heavier than the ball.)"
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "A 0.5-kg firework at REST explodes into two pieces: a 0.3-kg chunk goes east at 12 m/s. The other piece (0.2 kg) goes — what direction and how fast?",
      "givenHint": "Total p before = 0. Piece 1: 0.3 kg at +12 m/s. Piece 2: 0.2 kg at v = ?",
      "equationHint": "0 = m₁v₁ + m₂v₂ — solve for v₂ and read its sign as a direction.",
      "equationOptions": [
        "Σp_before = Σp_after",
        "0 = m₁v₁ + m₂v₂",
        "p = m·v",
        "J = F·Δt"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your firework answer, then complete the frame about WHY total momentum stayed the same.",
      "frame": "The 0.2-kg piece goes ___ at ___ m/s. Total momentum stays the same because the only forces during the explosion are ___ (between the pieces), which means no NET ___ force."
    },
    {
      "id": "rd-ch08-c",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **8.3–8.4** (bouncing makes impulses bigger; the law of conservation of momentum and cannon recoil). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch08-c",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 8,
      "title": "Momentum — read & practice",
      "sectionIds": [
        "8.3",
        "8.4"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.k3-conservation"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 6 — Three Flavors of Collision', 'u3-d06', 'Unit 3: Momentum & Collisions', 6, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can distinguish elastic, inelastic, and perfectly inelastic collisions, and I can identify which real-world collisions fit each category.",
      "targetId": "u3.k4-collision-types"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid striking Earth would be PERFECTLY INELASTIC — it becomes part of Earth (after vaporizing). A pure gravity flyby (no contact) is ELASTIC. DART was somewhere in between.",
      "connection": "Once you know which TYPE you have, you know which equations to use."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Three flavors, one family\n\n| Type | Momentum | Kinetic energy | After impact |\n|---|---|---|---|\n| **Elastic** | conserved | conserved | bounce apart, no energy lost |\n| **Inelastic** | conserved | some lost | bounce apart, energy → heat/sound/dents |\n| **Perfectly inelastic** | conserved | maximum lost | **stick together** |\n\nThe family resemblance: **all three conserve momentum**. The flavor only tells you what happens to the kinetic energy — and whether the objects separate."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Elastic collision",
          "definition": "Both MOMENTUM and KINETIC ENERGY are conserved. Objects bounce off without losing energy. Superball off concrete; Newton's cradle; billiard balls (approximately); gravity flybys.",
          "cognate": "Sp. colisión elástica · Pt. colisão elástica · HC kolizyon elastik"
        },
        {
          "term": "Inelastic collision",
          "definition": "MOMENTUM is conserved but KINETIC ENERGY is NOT — some KE goes to heat, sound, deformation. Most car crashes; a dropped clay ball that flattens but doesn't stick.",
          "cognate": "Sp. colisión inelástica · Pt. colisão inelástica · HC kolizyon inelastik"
        },
        {
          "term": "Perfectly inelastic collision",
          "definition": "The objects STICK TOGETHER after impact. Momentum conserved; maximum KE lost. Clay into wall; bullet into block (ballistic pendulum); asteroid impact. 'Perfectly' means 'stuck completely,' not 'ideal.'",
          "cognate": "Sp. perfectamente inelástica · Pt. perfeitamente inelástica · HC pèfètman inelastik"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Energy lost ≠ momentum lost",
      "markdown": "ALL THREE types conserve momentum. Only ELASTIC conserves kinetic energy. 'The collision lost energy' is often true; 'the collision lost momentum' never is (absent external forces). They're different rules."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Try all three in the sim",
      "markdown": "In the cart-collision simulation below, switch the bumper type: magnetic bumpers ≈ elastic, plain bumpers ≈ inelastic, velcro = perfectly inelastic. Watch what stays the same (Σp) and what changes (KE) across the three."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "cart-collisions"
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Make a three-column chart: Elastic | Inelastic | Perfectly inelastic. In each column, write/draw the textbook example AND add ONE more real example from your own life. Circle the ones you've personally seen.",
      "prompts": [
        "Three columns, labeled.",
        "One example of your own per column.",
        "Circle what you've witnessed."
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Classification drill — label each scenario E (elastic), I (inelastic), or PI (perfectly inelastic). Be ready to defend each. (a) Two billiard balls bouncing off each other. (b) A car rear-ends a stalled truck, bumpers lock. (c) Football tackle — players grip each other and tumble. (d) Bullet hits a wood block and sticks. (e) Two magnets repel and bounce apart without touching. (f) Asteroid hits Earth. (g) Newton's cradle — end ball stops, opposite end ball moves. (h) Wet clay ball thrown against a wall, sticks.",
      "frame": "a) ___ b) ___ c) ___ d) ___ e) ___ f) ___ g) ___ h) ___"
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A meteorite buries itself in the desert. What kind of collision is this? Where did its kinetic energy go?",
      "frame": "It's a ___ collision. The kinetic energy went to ___."
    },
    {
      "id": "rd-ch08-d",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **8.5–8.6** (elastic vs. inelastic collisions; momentum as a vector in 2D collisions). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch08-d",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 8,
      "title": "Momentum — read & practice",
      "sectionIds": [
        "8.5",
        "8.6"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.k4-collision-types"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 7 — Vernier Collision Lab (Investigation 3.1)', 'u3-d07', 'Unit 3: Momentum & Collisions', 7, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can run elastic and perfectly inelastic cart collisions with photogates, compute Σp_before and Σp_after, and report the % difference with one credible source of error.",
      "targetId": "u3.s4-vernier-collisions"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We've been STATING that Σp is conserved for 7 days. Today we MEASURE it.",
      "connection": "If our lab carts confirm conservation, we can trust the same rule for asteroids. Days 11–13 depend on it."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 3.1 — Verify conservation",
      "markdown": "**Driving question:** How well does Σp_before match Σp_after in our lab carts? And does it work for BOTH elastic and perfectly inelastic collisions?\n\n**Equipment:** Vernier dynamics track (1 per pair) + 2 carts · magnetic bumpers (elastic trial) · velcro pads (perfectly inelastic trial) · 2 photogates + LabQuest + Logger Pro or Graphical Analysis · balance to weigh each cart (record m₁ and m₂ first).\n\n**How this lab serves the year's question:** if conservation holds in carts within a few percent, the asteroid math on Days 11–13 stands."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "Level the track. Weigh both carts and record m₁, m₂.",
        "**ELASTIC trials** (magnet bumpers): cart 2 at rest. Push cart 1 gently. Photogates read v₁ᵢ, v₁f, and v₂f.",
        "Compute Σp_before = m₁v₁ᵢ and Σp_after = m₁v₁f + m₂v₂f. Compare.",
        "**PERFECTLY INELASTIC trials** (velcro): cart 2 at rest. Push cart 1; carts stick.",
        "Compute Σp_after = (m₁+m₂)·v_combined. Compare to Σp_before.",
        "Two trials of each type. Compute % difference for each."
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "Cart speeds gentle. Photogates clamped firmly. Hands clear of cart paths."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Not in class today?",
      "markdown": "Run the cart-collision simulation below in both bumper modes (magnetic = elastic, velcro = stick). Read the before/after velocities off the sim and fill the data tables from those."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "cart-collisions"
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch your setup: track, both carts, both photogates. Record m₁ and m₂ on the diagram.",
      "prompts": [
        "Label both carts with their measured masses.",
        "Mark where each photogate reads velocity.",
        "Show the push direction."
      ]
    },
    {
      "id": "b9",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "v₁ᵢ (m/s)",
        "v₁f (m/s)",
        "v₂f (m/s)",
        "Σp_before",
        "Σp_after",
        "% diff"
      ],
      "rows": 2,
      "plot": false,
      "patternPrompt": "ELASTIC trials (magnet bumpers, cart 2 at rest). How close are your before/after totals?"
    },
    {
      "id": "b10",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "v₁ᵢ (m/s)",
        "v_combined (m/s)",
        "Σp_before",
        "Σp_after",
        "% diff"
      ],
      "rows": 2,
      "plot": false,
      "patternPrompt": "PERFECTLY INELASTIC trials (velcro, cart 2 at rest). How close are your before/after totals?"
    },
    {
      "id": "b11",
      "type": "observation",
      "capture": true,
      "patternPrompt": "In your trials, did Σp_after match Σp_before? Within what %?",
      "interpretPrompt": "If there's a difference, what physical thing leaked momentum out? Was it the same for elastic and inelastic trials? And the asteroid connection: how does this serve the year's question?",
      "frame": "My elastic Σp matched within ___ %; my perfectly inelastic Σp matched within ___ %. The biggest source of error was ___."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write a one-sentence CLAIM about what your lab showed, then one sentence of EVIDENCE (your numbers), then one sentence of REASONING (why the % difference is small).",
      "frame": "CLAIM: ___. EVIDENCE: ___. REASONING: ___."
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.s4-vernier-collisions"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 8 — Inelastic Collisions: Stick-Together Worked Examples', 'u3-d08', 'Unit 3: Momentum & Collisions', 8, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can solve a 1D perfectly inelastic collision using m₁v₁ + m₂v₂ = (m₁+m₂)v_f, with correct signs and units.",
      "targetId": "u3.s2-inelastic-solve"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid impact is the planetary version of 'stick together.' Today's math is what we'd use to estimate Earth's velocity change from a 2026-XJ strike.",
      "connection": "Same equation. Different scale. The arithmetic generalizes."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Stick-together problems\n\nWhen objects lock after impact, there's only ONE final velocity — and only one unknown:\n\n**m₁v₁ + m₂v₂ = (m₁ + m₂)·v_f**\n\nThe whole game is in the **signs**: write your sign convention before you compute, assign a sign to every velocity, then sum."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Ballistic pendulum",
          "definition": "A classic stick-together problem: a small fast object embeds in a larger object at rest. Use conservation of momentum. A 0.05-kg bullet at 400 m/s into a 5-kg block gives (bullet + block) moving together at v_f ≈ 4 m/s.",
          "cognate": "Sp. péndulo balístico · Pt. pêndulo balístico"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Don't reach for energy here",
      "markdown": "Don't try ½mv² = ½(M+m)v_f² — that's kinetic energy, which is NOT conserved in a stick-together collision. Use momentum: m·v = (M+m)·v_f."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "A 0.05-kg bullet moving east at 400 m/s embeds itself in a 5-kg block at rest. Find the velocity of the bullet+block immediately after impact.",
      "given": "m = 0.05 kg · v = +400 m/s · M = 5 kg · V = 0",
      "equation": "m·v + M·V = (m + M)·v_f",
      "work": "(0.05)(400) + (5)(0) = (0.05 + 5)·v_f\n20 = 5.05·v_f\nv_f = 20/5.05 ≈ 3.96 m/s",
      "answer": "v_f ≈ 3.96 m/s east. The block + bullet move together at about 4 m/s."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "A 1200-kg car going east at 25 m/s collides head-on with an 1800-kg car going west at 15 m/s. They lock together. Find the final velocity.",
      "given": "m₁ = 1200 kg, v₁ = +25 m/s (east) · m₂ = 1800 kg, v₂ = −15 m/s (west)",
      "equation": "m₁v₁ + m₂v₂ = (m₁ + m₂)·v_f",
      "work": "(1200)(25) + (1800)(−15) = (3000)·v_f\n30,000 + (−27,000) = 3000·v_f\n3,000 = 3000·v_f\nv_f = +1.0 m/s",
      "answer": "+1.0 m/s — the wreckage drifts EAST slowly. The heavier westbound car lost out narrowly."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "warning",
      "title": "Sign convention FIRST",
      "markdown": "ALWAYS write the sign convention before you compute. East = + (or whatever you pick). Then assign signs to every v BEFORE you sum."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "A 1000-kg car going east at 20 m/s rear-ends a 2000-kg stalled truck. They lock together. Find the final velocity.",
      "givenHint": "m₁ = 1000 kg at +20 m/s; m₂ = 2000 kg at 0 (stalled).",
      "equationHint": "m₁v₁ + m₂v₂ = (m₁+m₂)·v_f — one unknown.",
      "equationOptions": [
        "m₁v₁ + m₂v₂ = (m₁+m₂)·v_f",
        "p = m·v",
        "J = F·Δt",
        "Σp_x = Σp_x'"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 1000-kg car at 20 m/s east rear-ends a 2000-kg stalled truck. They lock. What's the final velocity? Show the sign convention you used.",
      "frame": "Taking east as ___, v_f = ___ m/s, moving ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.s2-inelastic-solve"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 9 — Elastic Collisions: Bounce-Apart Worked Examples', 'u3-d09', 'Unit 3: Momentum & Collisions', 9, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can solve a 1D elastic collision using conservation of momentum AND conservation of kinetic energy, and I can apply the equal-mass and one-at-rest simplifications.",
      "targetId": "u3.s3-elastic-solve"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "A gravity flyby (no contact) is essentially elastic — both p and KE conserved.",
      "connection": "The math here is what we'd use to predict an asteroid's path AFTER a gravity-assist swing-by."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The elastic pair\n\nElastic collisions obey TWO rules at once:\n\n- **p:** m₁v₁ᵢ + m₂v₂ᵢ = m₁v₁f + m₂v₂f\n- **KE:** ½m₁v₁ᵢ² + ½m₂v₂ᵢ² = ½m₁v₁f² + ½m₂v₂f²\n\nTwo equations, two unknowns (v₁f, v₂f) — solvable. And when object 2 starts **at rest**, the algebra collapses into two shortcut formulas:\n\n- **v₁f = ((m₁−m₂)/(m₁+m₂))·v₁ᵢ**\n- **v₂f = (2m₁/(m₁+m₂))·v₁ᵢ**"
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Elastic — one at rest (special case)",
          "definition": "Object 1 (mass m₁, speed v₁ᵢ) strikes object 2 (mass m₂, at rest): v₁f = ((m₁−m₂)/(m₁+m₂))·v₁ᵢ and v₂f = (2m₁/(m₁+m₂))·v₁ᵢ — both straight from the two conservation rules. If m₁ = m₂: v₁f = 0, v₂f = v₁ᵢ — the mover STOPS, the resting one takes off (Newton's cradle).",
          "cognate": "Sp. un cuerpo en reposo · Pt. um corpo em repouso"
        }
      ]
    },
    {
      "id": "b5",
      "type": "worked_example",
      "prompt": "A 0.5-kg ball at 4 m/s east strikes a 1.0-kg ball at rest, elastically. Find v₁f and v₂f.",
      "given": "m₁ = 0.5 kg, v₁ᵢ = +4 m/s · m₂ = 1.0 kg, v₂ᵢ = 0",
      "equation": "v₁f = ((m₁−m₂)/(m₁+m₂))·v₁ᵢ ; v₂f = (2m₁/(m₁+m₂))·v₁ᵢ",
      "work": "v₁f = ((0.5 − 1.0)/(0.5 + 1.0))·(4) = (−0.5/1.5)·4 ≈ −1.33 m/s\nv₂f = (2·0.5/1.5)·(4) = (1/1.5)·4 ≈ 2.67 m/s",
      "answer": "v₁f ≈ −1.33 m/s (bounces BACK west). v₂f ≈ 2.67 m/s east."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "note",
      "title": "Newton's cradle is the equal-mass rule",
      "markdown": "The moving ball stops; an identical ball on the far end leaves at the original speed. Conservation of both p AND KE forces it — no other outcome satisfies both equations."
    },
    {
      "id": "b7",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Pattern-finding — use the one-at-rest formulas to predict each case. (a) m₁ = m₂ (equal masses). (b) m₁ ≫ m₂ (big hits small). (c) m₁ ≪ m₂ (small hits big).",
      "frame": "(a) v₁f = ___, v₂f = ___. (b) v₁f ≈ ___ (continues almost unchanged?), v₂f ≈ ___. (c) v₁f ≈ ___ (bounces back?), v₂f ≈ ___ (barely moves?)."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "A 0.2-kg superball moving east at 5 m/s strikes a 0.2-kg superball at rest, elastically. Use the equal-mass result to predict v₁f and v₂f.",
      "givenHint": "m₁ = m₂ = 0.2 kg; v₁ᵢ = +5 m/s; ball 2 at rest.",
      "equationHint": "Equal masses: the mover stops, the resting ball takes the full velocity.",
      "equationOptions": [
        "v₁f = ((m₁−m₂)/(m₁+m₂))·v₁ᵢ",
        "v₂f = (2m₁/(m₁+m₂))·v₁ᵢ",
        "m₁v₁ + m₂v₂ = (m₁+m₂)·v_f",
        "p = m·v"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 0.2-kg superball at 5 m/s east strikes a 0.2-kg ball at rest, elastically. What happens to each?",
      "frame": "Ball 1 ___; ball 2 ___ at ___ m/s. This is exactly what happens in ___ (the desk toy)."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.s3-elastic-solve"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 10 — 2D Collisions: Glancing Blows', 'u3-d10', 'Unit 3: Momentum & Collisions', 10, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply conservation of momentum SEPARATELY to the x- and y-components, and I can solve a 2D glancing collision.",
      "targetId": "u3.r2-2d-components"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid that's nudged doesn't just slow down — it DEFLECTS sideways.",
      "connection": "2D momentum is the framework for asking 'how much sideways?' Tomorrow's DART analysis depends on it."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Momentum conserves axis by axis\n\nMomentum is a **vector**, so conservation isn't one equation — it's one **per axis**:\n\n- **Σp_x before = Σp_x after**\n- **Σp_y before = Σp_y after**\n\nUnit 1's vector decomposition (v·cos θ, v·sin θ) comes straight back. A glancing billiards shot gives two equations and two unknowns (the second ball's speed and angle) — solvable, every time."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Component-wise conservation",
          "definition": "Total momentum is a VECTOR. Conservation applies separately to its x- and y-components. A cue ball east strikes a stationary ball; afterward both move at angles — Σp_x and Σp_y each balance on their own.",
          "cognate": "Sp. componentes (x, y) · Pt. componentes (x, y)"
        }
      ]
    },
    {
      "id": "b5",
      "type": "diagram",
      "kind": "vectors",
      "title": "Glancing collision — before and after",
      "caption": "Before: the cue ball carries all the momentum east. After: the cue ball goes 30° north of east, so the struck ball MUST go south of east — the y-components have to cancel.",
      "genPrompt": "Cue ball initial velocity east, cue ball final at +30 degrees, struck ball final at about -24 degrees, showing y-components canceling.",
      "vectors": [
        {
          "label": "p_cue before (east)",
          "angle": 0,
          "mag": 90
        },
        {
          "label": "p_cue after (30° N of E)",
          "angle": 30,
          "mag": 45
        },
        {
          "label": "p_ball2 after (≈24° S of E)",
          "angle": -24,
          "mag": 55
        }
      ],
      "showResultant": false
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "A 0.16-kg cue ball moves east at 2 m/s and strikes a 0.16-kg ball at rest. Afterward, the cue ball moves at 1 m/s, 30° north of east. Find the second ball's speed and direction.",
      "given": "m₁ = m₂ = 0.16 kg (cancels) · v_cue_i = +2 m/s east · v_cue_f = 1 m/s @ +30° · v₂_i = 0",
      "equation": "Σp_x: m·v_i = m·v_cue_f·cos30° + m·v₂·cos θ\nΣp_y: 0 = m·v_cue_f·sin30° − m·v₂·sin θ",
      "work": "Drop the masses (cancel):\nx: 2 = 1·cos30° + v₂·cos θ → v₂·cos θ = 2 − 0.866 = 1.134\ny: 0 = 1·sin30° − v₂·sin θ → v₂·sin θ = 0.500\ntan θ = 0.500/1.134 → θ ≈ 23.8° (south of east)\nv₂ = 0.500/sin23.8° ≈ 1.24 m/s",
      "answer": "Ball 2: ≈ 1.24 m/s at ≈ 23.8° south of east."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "warning",
      "title": "The y-components must cancel",
      "markdown": "If the cue ball was originally moving only along x, then Σp_y starts at ZERO and must stay zero. One ball goes 'north' → the other must go 'south' in its y-component. Use this as a sanity check on every answer."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "Same setup, but now the cue ball goes 1.5 m/s at 45° north of east after impact. Find the second ball's speed and direction.",
      "givenHint": "Equal masses (cancel). v_cue_i = 2 m/s east; v_cue_f = 1.5 m/s @ 45°.",
      "equationHint": "Balance x: v₂cosθ = 2 − 1.5·cos45°. Balance y: v₂sinθ = 1.5·sin45°. Then tan θ and v₂.",
      "equationOptions": [
        "Σp_x: before = after",
        "Σp_y: before = after",
        "vₓ = v·cos θ",
        "v_y = v·sin θ"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why must p_x and p_y each be conserved separately, not just total p? Use the word 'vector' in your answer.",
      "frame": "We can't just balance the total magnitudes. We need to balance x and y ___, because momentum is a ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.r2-2d-components"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 11 — DART Case Study: Nudging an Asteroid', 'u3-d11', 'Unit 3: Momentum & Collisions', 11, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can use conservation of momentum to compute the Δv DART gave to Dimorphos, and I can apply the same calculation to 2026-XJ to estimate what it would take to deflect it.",
      "targetId": "u3.r3-deflection"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "On Sept 26, 2022, NASA's DART spacecraft (~600 kg, ~6 km/s) crashed into a small asteroid called Dimorphos (~5 × 10⁹ kg). It changed Dimorphos's orbital period by 32 minutes.",
      "connection": "This is the day the unit pays off. Today's math is the math we'd use on 2026-XJ. If the Δv we need is DART-scale, deflection is on the table. If not, we'd need a much bigger push (or a different strategy)."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## DART, in two equations\n\n**Equation 1 — the strike.** Treat the impact as perfectly inelastic with M ≫ m:\n\n**Δv ≈ m·v / M** — spacecraft momentum, spread over the asteroid's mass.\n\n**Equation 2 — why tiny works.**\n\n**offset = Δv × lead time**\n\nIf Δv ≈ 1 mm/s and we have 1 year (3.15 × 10⁷ s): offset ≈ 31.5 km. The push is microscopic; the **time** does the heavy lifting. More lead time = more offset. Linear in both."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "DART (Double Asteroid Redirection Test)",
          "definition": "NASA's 2022 mission that deliberately crashed a 600-kg spacecraft into a small asteroid to test whether kinetic impact can change its trajectory. DART hit Dimorphos at ~6 km/s, delivering only ~3 mm/s of Δv — but that tiny push, accumulated over time, shifts position by kilometers.",
          "cognate": "Sp. misión DART · Pt. missão DART · HC misyon DART"
        }
      ]
    },
    {
      "id": "b5",
      "type": "worked_example",
      "prompt": "DART (m = 600 kg) hit Dimorphos (M = 5 × 10⁹ kg) at v = 6 × 10³ m/s, treating the impact as perfectly inelastic. Find the velocity change Δv of the asteroid. (Hint: M ≫ m, so (m+M) ≈ M.)",
      "given": "m = 600 kg · v = 6000 m/s · M = 5×10⁹ kg · asteroid initially at rest in DART's frame",
      "equation": "m·v + M·0 = (m + M)·Δv ≈ M·Δv → Δv ≈ m·v / M",
      "work": "Δv ≈ (600 × 6000) / (5 × 10⁹)\nΔv ≈ 3.6 × 10⁶ / 5 × 10⁹\nΔv ≈ 7.2 × 10⁻⁴ m/s ≈ 0.72 mm/s\n(NASA measured ≈ 2.7 mm/s with momentum enhancement from ejecta — same order of magnitude.)",
      "answer": "≈ 0.72 mm/s (less than a millimeter per second). Tiny — but it adds up."
    },
    {
      "id": "b6",
      "type": "gewa",
      "capture": true,
      "prompt": "2026-XJ has mass M ≈ 1 × 10⁹ kg and will pass Earth in 6 months (t ≈ 1.5 × 10⁷ s). We need to shift its position by R_Earth ≈ 6.4 × 10⁶ m to miss us. What Δv does it need? Then: would a DART-scale strike (600 kg at 6 km/s) deliver it?",
      "givenHint": "Required: Δv = shift / time. Available from one DART: Δv = m·v / M with M = 10⁹ kg.",
      "equationHint": "Compute the NEEDED Δv first, then the DELIVERED Δv, then compare.",
      "equationOptions": [
        "Δv = shift / time",
        "Δv ≈ m·v / M",
        "p = m·v",
        "J = F·Δt"
      ]
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "note",
      "title": "Read your own gap",
      "markdown": "When you compare the required Δv to what a single DART gives: the gap tells you whether one impactor is enough, or whether we'd need many — or need to have launched **sooner**."
    },
    {
      "id": "b8",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Complete the deflection frame, then answer: why doesn't NASA need a HUGE Δv to deflect an asteroid? Use 'lead time' and 'small change in velocity' in your answer.",
      "frame": "To deflect 2026-XJ by one Earth-radius in 6 months, we need Δv ≈ ___. A single DART-class strike would give about ___. So we'd need ___ DARTs (or more lead time)."
    },
    {
      "id": "b9",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.r3-deflection"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 12 — Asteroid Impact: What Momentum Says', 'u3-d12', 'Unit 3: Momentum & Collisions', 12, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute the average force of an asteroid impact using F = Δp/Δt and explain why Earth's velocity changes negligibly even though the impact is catastrophic locally.",
      "targetId": "u3.r4-impact-analysis"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "If deflection fails, momentum gives our FIRST picture of the impact. Earth gains almost no velocity (we outmass the asteroid 10¹⁵ to 1). But the asteroid delivers all of its momentum in 0.1 s.",
      "connection": "Today is the OTHER branch of the unit. Yesterday: deflect. Today: what if we don't?"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Two true things at once\n\nConservation of momentum makes two statements about an asteroid impact, and they sound contradictory until you see they're about different things:\n\n1. **Globally:** Earth's center-of-mass velocity barely changes. We outmass 2026-XJ by ~10¹⁵, so its momentum spread over the whole planet is nothing.\n2. **Locally:** the impact SITE absorbs the asteroid's entire Δp in ~0.1 s — and F = Δp/Δt with a tiny Δt is a colossal force.\n\nBoth follow from the same equation. Hold both."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Local vs. global momentum",
          "definition": "In a planetary collision, the asteroid's momentum transfers to a SMALL local region in a SHORT time. Earth as a whole barely moves (Δv ≈ 5×10⁻¹² m/s) — but the impact site absorbs the entire force.",
          "cognate": "Sp. local vs. global · Pt. local vs. global"
        }
      ]
    },
    {
      "id": "b5",
      "type": "worked_example",
      "prompt": "If 2026-XJ (m = 1 × 10⁹ kg) hits Earth at v = 3 × 10⁴ m/s and stops in Δt ≈ 0.1 s, what is the AVERAGE force during impact?",
      "given": "m = 1 × 10⁹ kg · v = 3 × 10⁴ m/s · v_f = 0 · Δt = 0.1 s",
      "equation": "Δp = m·(v_f − v_i) = −m·v_i ; F = Δp / Δt",
      "work": "Δp = −(1 × 10⁹)(3 × 10⁴) = −3 × 10¹³ kg·m/s\nF = −3 × 10¹³ / 0.1 = −3 × 10¹⁴ N",
      "answer": "≈ 3 × 10¹⁴ N of force. About 50,000 × the weight of Hoover Dam, applied in a tenth of a second."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "Using conservation of momentum, find Earth's velocity change after a 2026-XJ impact. (M_Earth = 5.97 × 10²⁴ kg.)",
      "given": "p_asteroid = 3 × 10¹³ kg·m/s · M_Earth = 5.97 × 10²⁴ kg",
      "equation": "p_asteroid + 0 = M_Earth·Δv_Earth (asteroid essentially absorbed) → Δv_Earth = p_asteroid / M_Earth",
      "work": "Δv_Earth = (3 × 10¹³) / (5.97 × 10²⁴)\nΔv_Earth ≈ 5 × 10⁻¹² m/s",
      "answer": "≈ 5 × 10⁻¹² m/s — utterly undetectable. Earth doesn't 'move.' But the impact site catches the full force."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "warning",
      "title": "Momentum is only PART of the disaster picture",
      "markdown": "Momentum gives us the FORCE. It does NOT capture the energy (heat, shockwave, crater). That comes in Unit 4. Today's number is one part of the analysis."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "Compute 2026-XJ's momentum at impact, then the average force if it stops in 0.1 s. Finally: how many 'Hoover Dams' of force is that? (Hoover Dam weighs ≈ 6 × 10⁹ N.)",
      "givenHint": "m = 10⁹ kg, v = 3 × 10⁴ m/s, Δt = 0.1 s, Hoover Dam = 6 × 10⁹ N.",
      "equationHint": "p = m·v, then F = p/Δt, then divide F by the dam's weight.",
      "equationIds": [
        "momentum",
        "impulse",
        "newton-2nd"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why is Earth's velocity change after an asteroid impact essentially zero, even though the impact is catastrophic locally?",
      "frame": "Earth's velocity barely changes because Earth's ___ is roughly 10¹⁵ times the asteroid's. But the LOCAL force is enormous because ___ is delivered in a very short ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.r4-impact-analysis"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 13 — Two-Branch Analysis: Deflect or Impact?', 'u3-d13', 'Unit 3: Momentum & Collisions', 13, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "SYNTHESIS",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can run a full 2026-XJ analysis on both branches (deflection and impact) and articulate which two ideas from the unit were load-bearing for the conclusion.",
      "targetId": "u3.synthesis-two-branch"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We have every tool we need. Days 11 and 12 each gave us a branch. Today the class does both, compiles, and reports.",
      "connection": "Tomorrow is the transfer task. Today is the rehearsal — done in groups, with talk and revision."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Two branches, one decision\n\nToday you run BOTH analyses end-to-end, the way a planetary defense team would:\n\n- **Branch 1 — DEFLECT:** what Δv does one DART-class impactor give 2026-XJ, what Δv do we need, and how many impactors is that?\n- **Branch 2 — IMPACT:** if we don't deflect, what momentum arrives, what force does the impact site absorb, and what (negligibly) happens to Earth's motion?\n\nThen the class writes its consensus: what do we tell NASA?"
    },
    {
      "id": "b4",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the two-branch decision tree. On the LEFT branch (deflect), list the physics tools you'll use. On the RIGHT branch (impact), do the same. Then circle one tool that shows up in BOTH.",
      "prompts": [
        "Left branch: deflection tools.",
        "Right branch: impact tools.",
        "Circle the shared tool."
      ]
    },
    {
      "id": "b5",
      "type": "gewa",
      "capture": true,
      "prompt": "STATION 1 — DEFLECTION. 2026-XJ has M = 1 × 10⁹ kg, will pass Earth in t = 1.5 × 10⁷ s (6 months). We need to shift its position by 6.4 × 10⁶ m (one Earth-radius). A DART-class impactor has m = 600 kg at v = 6 × 10³ m/s. (a) Find the Δv from ONE impactor. (b) Find the Δv we NEED (Δv = shift / time). (c) How many DART impactors would it take?",
      "givenHint": "All the numbers are in the prompt — organize them by which sub-question they serve.",
      "equationHint": "(a) Δv ≈ m·v/M. (b) Δv = shift/time. (c) divide.",
      "equationOptions": [
        "Δv ≈ m·v / M",
        "Δv = shift / time",
        "p = m·v",
        "J = F·Δt"
      ]
    },
    {
      "id": "b6",
      "type": "gewa",
      "capture": true,
      "prompt": "STATION 2 — IMPACT. 2026-XJ at v = 3 × 10⁴ m/s, M = 1 × 10⁹ kg, hits Earth and stops in Δt = 0.1 s. (a) Find the asteroid's momentum at impact. (b) Find the average impact force. (c) Compare F to: Hoover Dam weight (6 × 10⁹ N) or Burj Khalifa weight (5 × 10⁹ N).",
      "givenHint": "m, v, Δt, and your comparison weight.",
      "equationHint": "(a) p = m·v. (b) F = Δp/Δt. (c) divide.",
      "equationIds": [
        "momentum",
        "impulse",
        "newton-2nd"
      ]
    },
    {
      "id": "b7",
      "type": "observation",
      "capture": true,
      "patternPrompt": "CLASS CONSENSUS — after both stations, compare answers across groups (or, at home, across your own two branches). Is DART-scale deflection realistic for 2026-XJ with 6 months of lead time?",
      "interpretPrompt": "What would the impact branch mean if deflection isn't attempted? Write the 2-sentence consensus statement you'd send NASA.",
      "frame": "Our consensus: deflection is ___ because ___. If we don't deflect, the impact branch says ___."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "This is the real job",
      "markdown": "Real planetary defense analysts do exactly this kind of two-branch reasoning. Your numbers are within an order of magnitude of NASA's. The asteroid is fictional; the math is real."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Of all the things you learned in Unit 3, which TWO ideas were load-bearing for today's analysis? Why?",
      "frame": "The two most load-bearing ideas were ___ (used in deflection) and ___ (used in impact). Both rely on conservation of ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u3.synthesis-two-branch"
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 14 — Unit 3 Transfer Task', 'u3-d14', 'Unit 3: Momentum & Collisions', 14, 'markdown', true, $u3${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply every Unit 3 tool — momentum, impulse, conservation, collision types, 2D components, and the deflection/impact branches — independently on the transfer task.",
      "targetId": "u3.transfer-task"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Every tool from Unit 3 is in your hands: p = mv, J = FΔt = Δp, conservation, three collision types, 2D components, and the DART/impact branches.",
      "connection": "One of the 4 transfer problems anchors in 2026-XJ — given a DART-style Δv, compute the lead time required for an Earth-radius lateral shift."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "warning",
      "title": "This task is on paper, in class",
      "markdown": "The transfer task itself is completed **on paper during class** — keep your work in the room. This page is your **planning and reflection space** around it. Use it to get ready and to capture your thinking; the graded task lives on the paper packet."
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## The task — 4 multi-part problems, ~40 minutes, independent\n\n- **Problem 1 — Momentum + impulse.** A baseball-bat collision: given m, v_i, v_f, and contact time, find Δp and the average force.\n- **Problem 2 — Ballistic pendulum (perfectly inelastic).** Given bullet mass, bullet speed, and block mass, find the combined velocity. Then find the kinetic energy lost (preview to Unit 4).\n- **Problem 3 — 2D billiards.** Given m₁, m₂, v_cue_i, and the cue ball's final speed + angle, find the second ball's final speed and direction.\n- **Problem 4 — Asteroid deflection.** Given the Δv from a DART-style impactor and a target lateral shift of 6,400 km, how much lead time is needed?\n\n### How it's scored — 4 dimensions, each 0–4\n\n- **Science** — correct physics: vectors, kinematics, units.\n- **Reasoning** — sound method; uncertainty explained, not just stated.\n- **Communication** — work shown, units labeled, organized, readable.\n- **Transfer-to-Asteroid** — honest public-facing connection to 2026-XJ."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Allowed today",
      "markdown": "The Unit 3 Equation Reference card and a calculator. Every equation on it is on the MCAS Equation Sheet — you do **not** need to memorize them. You DO need to recognize when each one applies. You may ask **clarifying** questions about what the task means — but not physics-content questions."
    },
    {
      "id": "b6",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Before you start the paper task, write your plan: what order will you tackle the four problems, and where do you predict you will struggle?",
      "frame": "My plan: first I will ___, then ___. I expect to struggle most with ___."
    },
    {
      "id": "b7",
      "type": "prose",
      "markdown": "## After the task — final unit self-assessment\n\nRate yourself on every Unit 3 target below. This is your end-of-unit Marzano record — it feeds your Mastery Growth Chart and tells us both exactly where to focus before Unit 4 builds on this one."
    },
    {
      "id": "b8",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "u3.k1-momentum-vector",
        "u3.k2-impulse-theorem",
        "u3.k3-conservation",
        "u3.k4-collision-types",
        "u3.s1-compute-impulse",
        "u3.s2-inelastic-solve",
        "u3.s3-elastic-solve",
        "u3.s4-vernier-collisions",
        "u3.r1-extend-time",
        "u3.r2-2d-components",
        "u3.r3-deflection",
        "u3.r4-impact-analysis"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "End-of-unit reflection: where did you grow the most this unit, and what's the one idea you want locked in before Unit 4 (energy)?",
      "frame": "I grew most on ___. Before Unit 4 I want to lock in ___."
    }
  ]
}$u3$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

-- Wire each target to its lesson (publish guardrail requires learning_targets.lesson_id)
WITH map(target_slug, lesson_slug) AS (VALUES
  ('u3.anchor-two-questions','u3-d01'),
  ('u3.k1-momentum-vector','u3-d02'),
  ('u3.k2-impulse-theorem','u3-d03'),
  ('u3.s1-compute-impulse','u3-d03'),
  ('u3.r1-extend-time','u3-d04'),
  ('u3.k3-conservation','u3-d05'),
  ('u3.k4-collision-types','u3-d06'),
  ('u3.s4-vernier-collisions','u3-d07'),
  ('u3.s2-inelastic-solve','u3-d08'),
  ('u3.s3-elastic-solve','u3-d09'),
  ('u3.r2-2d-components','u3-d10'),
  ('u3.r3-deflection','u3-d11'),
  ('u3.r4-impact-analysis','u3-d12'),
  ('u3.synthesis-two-branch','u3-d13'),
  ('u3.transfer-task','u3-d14')
)
UPDATE learning_targets t SET lesson_id = l.id::text
FROM map m JOIN lessons l ON l.slug = m.lesson_slug
WHERE t.slug = m.target_slug;

UPDATE learning_targets SET exclude_from_growth = true WHERE slug IN ('u3.synthesis-two-branch', 'u3.transfer-task');

COMMIT;
