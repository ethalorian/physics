-- Apply Unit 2 lesson blocks + learning targets (paste into Supabase SQL editor).
-- Generated from src/data/unit2-blocks/*.json
BEGIN;

-- Unit 2 learning targets (marzano / self_assessment blocks reference these slugs)
INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.anchor-why-bend', 'I can explain why 2026-XJ''s velocity won''t stay constant and name the force that bends its path.', 'reasoning', 'unit-2', 1)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.free-fall-g', 'I can describe free fall as constant acceleration g, read g from a v–t slope, and calculate fall times for short drops.', 'reasoning', 'unit-2', 2)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.mass-vs-weight', 'I can distinguish mass from weight and use F = mg to find weight for any local g.', 'knowledge', 'unit-2', 3)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.k1-universal-gravitation', 'I can write F = G·m₁·m₂/r², explain each symbol, and explain why gravitation is universal and inverse-square.', 'knowledge', 'unit-2', 4)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.s1-compute-gravitation', 'I can compute the gravitational force between two masses using scientific notation.', 'skill', 'unit-2', 5)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.r1-scale-f', 'I can reason about how F scales when mass or distance changes (r×2 → F×¼; r×½ → F×4).', 'reasoning', 'unit-2', 6)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.k2-field-strength', 'I can explain g as gravitational field strength (N/kg) and compute g(r) = G·M/r² at any distance.', 'knowledge', 'unit-2', 7)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.r3-compare-g', 'I can compare g across altitudes and bodies, and explain orbital weightlessness as free fall — not absent gravity.', 'reasoning', 'unit-2', 8)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.s4-vernier-measure-g', 'I can measure g from the slope of a Vernier v–t graph and identify credible sources of error.', 'skill', 'unit-2', 9)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.k3-projectile-independence', 'I can decompose projectile motion into independent horizontal and vertical pieces linked only by time.', 'knowledge', 'unit-2', 10)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.s2-projectile-calc', 'I can solve horizontal-launch problems: fall time from height first, then horizontal range.', 'skill', 'unit-2', 11)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.r2-predict-landing', 'I can decompose an angled launch into components and predict flight time and range, including why 45° maximizes range.', 'reasoning', 'unit-2', 12)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.s3-centripetal-calc', 'I can compute a_c = v²/r and F_c = m·v²/r and identify which force plays the centripetal role.', 'skill', 'unit-2', 13)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.k5-orbit-free-fall', 'I can explain an orbit as continuous free fall and derive v_orbit = √(G·M/r).', 'knowledge', 'unit-2', 14)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.k4-keplers-laws', 'I can state Kepler''s three laws and use T² = a³ for Sun-orbits.', 'knowledge', 'unit-2', 15)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.r4-closest-approach', 'I can apply gravitation and Kepler''s laws to predict 2026-XJ''s period, perihelion, and orbit crossings.', 'reasoning', 'unit-2', 16)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u2.transfer-task', 'I can apply every Unit 2 tool — gravitation, fields, projectiles, circular motion, orbits, Kepler — independently on the transfer task.', 'reasoning', 'unit-2', 17)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

-- Unit 2 lessons (16 days)
INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 1 — Re-anchoring: What Makes 2026-XJ Move?', 'u2-d01', 'Unit 2: Gravitation & Fields', 1, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can explain why 2026-XJ's velocity won't stay constant, and I can name the force that bends its path.",
      "targetId": "u2.anchor-why-bend"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "NASA has refined 2026-XJ's orbit using three more weeks of radar tracking. Semi-major axis a ≈ 1.42 AU, eccentricity e ≈ 0.31, currently about 1.18 AU out — and closing.",
      "connection": "Unit 1 answered HOW FAST. Unit 2 answers WHY — and that means a force. Today we name that force and frame the unit's question: does the asteroid's path bend enough to bring it to Earth?"
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "NASA / Planetary Defense Briefing — Update 2",
      "markdown": "The earlier Unit 1 prediction assumed the asteroid's velocity stayed constant. **It does not.** Gravity bends its path. The new orbit solution treats 2026-XJ as a Sun-orbiting body governed by Newton's law of universal gravitation.\n\nThe new question: where does its orbit **cross Earth's**? And — load-bearing — will both objects arrive at the crossing at the **same time**? Unit 2 builds the physics to answer this.\n\n*This is fiction. The physics — and the equations — are real.*"
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## What makes a path bend?\n\nNewton's 1st Law (Unit 1): with **no net force**, an object keeps moving in a straight line at constant velocity. Forever.\n\n2026-XJ is **not** moving in a straight line — radar shows its path curving around the Sun. By Newton's own logic, something must be pulling on it.\n\nThat something is **gravity** — mostly the Sun's, and (much more weakly) Earth's. This unit is about how that pull works, how strong it is at any distance, and what kind of path it produces."
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Predict before the demo runs: a book and a FLAT sheet of paper are dropped together; then a book and a CRUMPLED sheet of paper. Sketch the race(s), circle which one(s) you think hit first, and write WHY next to your sketch.",
      "prompts": [
        "Round 1: book vs. flat paper — who wins?",
        "Round 2: book vs. crumpled paper — who wins?",
        "Write your WHY in a corner of the canvas."
      ]
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — the drop races",
      "markdown": "We ran the races live: book vs. flat paper, then book vs. crumpled paper. The flat sheet drifts down late; the crumpled one essentially **ties the book**. Air resistance — not gravity — made the difference. Run the vacuum-chamber simulation below and watch what happens when air is removed entirely."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "vacuum-chamber"
    },
    {
      "id": "b8",
      "type": "observation",
      "capture": true,
      "patternPrompt": "What did you NOTICE in the drop races (live or in the simulation)?",
      "interpretPrompt": "What do you WONDER about gravity after watching them?",
      "frame": "I notice ___. I wonder ___."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write your ONE question about gravity — the thing you most want this unit to answer.",
      "frame": "My one question about gravity is ___."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why doesn't 2026-XJ just drift off into space at constant velocity? What pulls on it?",
      "frame": "It can't keep a constant velocity because ___ is pulling on it, so its path ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.anchor-why-bend"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 2 — Free Fall: Everything Falls at g', 'u2-d02', 'Unit 2: Gravitation & Fields', 2, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe free fall as constant acceleration g, read g off a v–t slope, and calculate fall times for short drops.",
      "targetId": "u2.free-fall-g"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ would fall at g if it were close enough to Earth.",
      "connection": "g is a NUMBER (9.81 m/s² near Earth). Today you read it off a graph and use it. Same g for a coin, a feather, and an asteroid."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Everything falls at g\n\nDrop anything near Earth's surface (and ignore air): its velocity grows by **9.81 m/s every second**. That steady growth is an acceleration, and it has a name: **g**.\n\nTwo equations do all of today's work:\n\n- **v = g·t** — how fast after falling for time t\n- **y = ½·g·t²** — how far it has fallen after time t\n\nOn a **velocity–time graph** of a falling object, the line is straight and its **slope is g**. That's not a coincidence — it's the definition of acceleration from Unit 1, with gravity setting the rate."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Free fall",
          "definition": "Motion under gravity only — no air resistance, no other forces. A ball dropped 1 m takes about 0.45 s to fall (ignoring air). All objects fall the same.",
          "cognate": "Sp. caída libre · Pt. queda livre · HC chit lib"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Free fall doesn't mean 'floating'",
      "markdown": "Free fall means gravity is the **only** force acting. Falling IS the motion — a skydiver before the parachute, a dropped coin, and an orbiting station are all in free fall."
    },
    {
      "id": "b6",
      "type": "graph",
      "title": "v–t graph for a dropped object",
      "xLabel": "Time (s)",
      "yLabel": "Velocity (m/s)",
      "series": [
        {
          "label": "Falling from rest",
          "points": [
            [
              0,
              0
            ],
            [
              0.5,
              4.9
            ],
            [
              1,
              9.8
            ],
            [
              1.5,
              14.7
            ],
            [
              2,
              19.6
            ],
            [
              2.5,
              24.5
            ],
            [
              3,
              29.4
            ]
          ]
        }
      ]
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "tip",
      "title": "Read the graph like a physicist",
      "markdown": "Pick any two points on the line. Δv between them, divided by Δt, gives the slope. You should get **≈ 9.8 m/s²** no matter which two points you pick — that's what 'constant acceleration' looks like. Try the cliff-drop simulation below and watch the v–t graph build."
    },
    {
      "id": "b8",
      "type": "sim_embed",
      "simulationSlug": "freefall-cliff"
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "A coin is dropped from rest off a 10 m balcony. How long until it hits the ground? (Ignore air. Use y = ½·g·t².)",
      "given": "y = 10 m · v₀ = 0 · g = 9.81 m/s²",
      "equation": "y = ½·g·t²",
      "work": "10 = ½·(9.81)·t² → t² = 20/9.81 ≈ 2.04 → t ≈ 1.43 s",
      "answer": "≈ 1.43 s. The coin falls for about a second and a half."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "A pebble is dropped from a 100 m bridge. How long until it hits the water? Show your work.",
      "givenHint": "The fall height, the starting velocity (it's dropped), and g.",
      "equationHint": "The fall-distance equation: y = ½·g·t². Solve it for t.",
      "equationOptions": [
        "y = ½·g·t²",
        "v = g·t",
        "x = vₓ·t",
        "F = G·m₁·m₂/r²"
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "How long does it take a coin to fall 1 m from rest, ignoring air? Show your work — then complete the frame about the v–t graph.",
      "frame": "t ≈ ___ s. On the v–t graph for a falling object, the slope is ___, because v increases by ___ every second."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.free-fall-g"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 3 — Weight as F = mg (Local Gravity)', 'u2-d03', 'Unit 2: Gravitation & Fields', 3, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can distinguish mass from weight, calculate weight on different worlds with F = mg, and explain why weight changes but mass does not.",
      "targetId": "u2.mass-vs-weight"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's mass is the same everywhere. Its weight depends on WHERE it is.",
      "connection": "Set up the question: if 2026-XJ stood on Earth's surface, what would it weigh? Tomorrow we get the equation that gives g on any world."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Mass is what you are. Weight is what gravity does to you.\n\n- **Mass** (kg) — how much matter is in an object. The same on Earth, on the Moon, on 2026-XJ.\n- **Weight** (N) — the **force** of gravity pulling on that mass: **F_w = m·g**.\n\nChange worlds and you change g — so your weight changes. Your mass never does.\n\n| World | g (m/s²) |\n|---|---|\n| Earth | 9.81 |\n| Moon | 1.62 |\n| Mars | 3.71 |"
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Mass",
          "definition": "How much MATTER is in an object. Same everywhere in the universe. Measured in kg.",
          "cognate": "Sp. masa · Pt. massa · HC mas"
        },
        {
          "term": "Weight",
          "definition": "The FORCE of gravity pulling on a mass. Depends on local g. A 70 kg student weighs 686 N on Earth, 113 N on the Moon, 260 N on Mars.",
          "cognate": "Sp. peso · Pt. peso · HC pwa"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Cognate alert",
      "markdown": "*peso* = weight (Sp.), *masa* = mass (Sp.). Don't mix them up. Your bathroom scale measures **force** (weight), not 'how much stuff' (mass)."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "A 70 kg student stands on the Moon. What is their weight? (g_Moon = 1.62 m/s²)",
      "given": "m = 70 kg · g_Moon = 1.62 m/s²",
      "equation": "F_w = m·g",
      "work": "F_w = 70 × 1.62 = 113.4 N",
      "answer": "113 N. About 1/6 their Earth weight, but their mass is unchanged."
    },
    {
      "id": "b7",
      "type": "data_table",
      "capture": true,
      "columns": [
        "World",
        "g (m/s²)",
        "My weight F = m·g (N)"
      ],
      "rows": 4,
      "plot": false,
      "patternPrompt": "Pick your own mass (be honest). Fill in your weight on Earth, the Moon, Mars, and one world of your choice. What pattern connects g and your weight?"
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "If you weigh 600 N on Earth, find your mass first. Then calculate your weight on Mars (g_Mars = 3.71 m/s²).",
      "givenHint": "Earth weight (600 N), g_Earth = 9.81 m/s², g_Mars = 3.71 m/s².",
      "equationHint": "Use F_w = m·g twice: once backwards to get m, once forwards on Mars.",
      "equationIds": [
        "weight",
        "gravitation",
        "newton-2nd",
        "avg-speed",
        "displacement"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "If you weigh 600 N on Earth, what is your mass? What would you weigh on a planet with g = 25 m/s²?",
      "frame": "My mass is ___ kg, because mass = weight ÷ ___. On the g = 25 planet I would weigh ___ N."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.mass-vs-weight"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 4 — Newton''s Law of Universal Gravitation', 'u2-d04', 'Unit 2: Gravitation & Fields', 4, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write F = G·m₁·m₂/r², explain what each symbol means, and reason about how F changes when masses or distance change.",
      "targetId": "u2.k1-universal-gravitation"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "The asteroid feels gravity from the Sun and (weakly) Earth.",
      "connection": "THIS is the equation we've been building toward. The 1/r² geometry decides how steeply gravity grows as 2026-XJ approaches."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The equation that runs the solar system\n\n**F = G · m₁ · m₂ / r²**\n\n- **F** — the gravitational force between the two masses (newtons)\n- **G** = 6.67 × 10⁻¹¹ N·m²/kg² — always the same. That's why we call it *universal*.\n- **m₁** — mass of one object (kg)\n- **m₂** — mass of the other object (kg)\n- **r** — distance between the **centers** of the two objects (meters)\n- **r²** — r SQUARED. Doubling r makes F drop to **1/4**. Tripling r makes F drop to **1/9**.\n\nEvery mass pulls on every other mass. Earth pulls the Moon; the Moon pulls Earth back (that's the tides). You pull on your neighbor — tiny, but real."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Universal gravitation",
          "definition": "Every mass pulls on every other mass with a force F = G·m₁·m₂/r². Earth pulls the Moon; the Moon pulls Earth back (tides).",
          "cognate": "Sp. gravitación universal · Pt. gravitação universal"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "r is between CENTERS",
      "markdown": "r is measured center-to-center, **not** surface-to-surface. For an Earth–asteroid calculation, r ≈ the gap between them **plus Earth's radius**."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "misconception",
      "title": "Gravity is not just 'Earth pulling things down'",
      "markdown": "Every **pair** of masses attracts. The reason you don't feel your neighbor's pull is the sizes involved: with human-scale masses, G·m₁·m₂ is microscopic. It takes a planet-sized m to make F noticeable."
    },
    {
      "id": "b7",
      "type": "equation_sandbox",
      "capture": true,
      "prompt": "Explore F = G·m₁·m₂/r². Start with reasonable asteroid numbers, then test: what happens to F when you double r? Triple it? Double one of the masses? Write what you find.",
      "variables": [
        {
          "symbol": "G",
          "value": "6.67e-11",
          "unit": "N·m²/kg²"
        },
        {
          "symbol": "m₁",
          "value": "5.97e24",
          "unit": "kg"
        },
        {
          "symbol": "m₂",
          "value": "3.5e11",
          "unit": "kg"
        },
        {
          "symbol": "r",
          "unit": "m"
        }
      ]
    },
    {
      "id": "b8",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "If 2026-XJ doubles its distance from Earth, what happens to F_gravity? What if it triples its distance?",
      "frame": "At 2r, F drops to ___ of its old value. At 3r, F drops to ___. The pattern is called an ___-square law."
    },
    {
      "id": "b9",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.k1-universal-gravitation"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 5 — F = Gm₁m₂/r² Calculation Day', 'u2-d05', 'Unit 2: Gravitation & Fields', 5, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute the gravitational force between two masses given their distance, and I can reason about how F scales when any input changes.",
      "targetId": "u2.s1-compute-gravitation"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's mass: roughly 3.5 × 10¹¹ kg (estimate). Sun's mass: 1.99 × 10³⁰ kg.",
      "connection": "Today you compute real Earth–Moon, Earth–Sun, Earth–asteroid forces. The biggest force in 2026-XJ's life is the SUN."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Calculation day — two skills, one equation\n\n**Skill 1 — compute.** Plug into F = G·m₁·m₂/r² with scientific notation. Keep the powers of ten organized: multiply the front numbers, add the exponents on top, subtract the bottom's.\n\n**Skill 2 — scale.** When only r changes, don't recompute from scratch. Use the 1/r² rule:\n\n- r × 2 → F × ¼\n- r × 3 → F × 1/9\n- r × ½ → F × **4**\n\nScaling is faster than recomputing — and it's the skill the transfer task rewards."
    },
    {
      "id": "b4",
      "type": "worked_example",
      "prompt": "Find F between Earth (m₁ = 5.97 × 10²⁴ kg) and Moon (m₂ = 7.35 × 10²² kg) at r = 3.84 × 10⁸ m.",
      "given": "m₁ = 5.97×10²⁴ kg · m₂ = 7.35×10²² kg · r = 3.84×10⁸ m · G = 6.67×10⁻¹¹",
      "equation": "F = G·m₁·m₂ / r²",
      "work": "F = (6.67×10⁻¹¹)(5.97×10²⁴)(7.35×10²²) / (3.84×10⁸)²\nF = (2.93×10³⁷) / (1.47×10¹⁷)\nF ≈ 1.99 × 10²⁰ N",
      "answer": "≈ 2.0 × 10²⁰ N — gigantic, but felt by a gigantic Moon."
    },
    {
      "id": "b5",
      "type": "gewa",
      "capture": true,
      "prompt": "Find F between Earth (m₁ = 5.97 × 10²⁴ kg) and 2026-XJ (m₂ = 3.5 × 10¹¹ kg) at r = 1.0 × 10¹⁰ m (about 26 lunar distances).",
      "givenHint": "Both masses, the distance r, and G = 6.67 × 10⁻¹¹.",
      "equationHint": "Newton's universal gravitation — same recipe as the worked example.",
      "equationIds": [
        "gravitation",
        "weight",
        "newton-2nd",
        "avg-speed",
        "displacement"
      ]
    },
    {
      "id": "b6",
      "type": "gewa",
      "capture": true,
      "prompt": "If 2026-XJ moves to r = 5.0 × 10⁹ m (HALF the previous distance), what is F now? You can SCALE rather than recompute: F_new = F_old × (factor).",
      "givenHint": "Your previous answer for F, and the fact that r was cut in half.",
      "equationHint": "r × ½ → F × 4. Scale your previous answer.",
      "equationIds": [
        "gravitation"
      ]
    },
    {
      "id": "b7",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "If 2026-XJ is currently at 5 lunar distances from Earth and gets to 1 lunar distance, how many times larger is the gravitational force?",
      "frame": "r shrinks by a factor of ___, so F grows by a factor of ___² = ___."
    },
    {
      "id": "b8",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.s1-compute-gravitation"
    },
    {
      "id": "b9",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.r1-scale-f"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 6 — Gravitational Fields: g as Field Strength', 'u2-d06', 'Unit 2: Gravitation & Fields', 6, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute g(r) = G·M/r² at any distance from a body, and I can explain g as a field that lives in space — force per unit mass.",
      "targetId": "u2.k2-field-strength"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Earth makes a gravitational field everywhere in space.",
      "connection": "As 2026-XJ moves through Earth's field, the strength at its location changes. The field IS the bridge between 'Earth's mass' and 'force on the asteroid.'"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## g is a field — it lives in space, not in objects\n\nTake F = G·M·m/r² and divide out the small mass m. What's left is a property of the **location**:\n\n**g(r) = G·M / r²**\n\nThis is the **gravitational field strength** at distance r from a body of mass M — the force a 1 kg mass would feel there. Units: **N/kg**, which is exactly the same as m/s².\n\nAt Earth's surface, g = 9.81 N/kg. At ISS altitude (~400 km up), g ≈ 8.7 N/kg. The field is there whether or not anything is in it — drop a mass anywhere and the field tells it how to fall."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Gravitational field",
          "definition": "A region of space where a mass would feel a gravitational force; its strength is g(r) at each point. At Earth's surface g = 9.81 N/kg; at ISS altitude g ≈ 8.7 N/kg.",
          "cognate": "Sp. campo gravitatorio · Pt. campo gravitacional · HC chan gravitasyonèl"
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw Earth as a circle in the middle. Around it, draw field arrows pointing INWARD toward Earth. Close to Earth, make the arrows LONG (strong field). Farther away, make them SHORT (weak field). Gravity weakens with distance — your arrows should show it.",
      "prompts": [
        "Arrows point toward Earth's center.",
        "Long arrows near the surface, shorter arrows farther out.",
        "Label one near arrow '9.81 N/kg' and one far arrow with a smaller value."
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "Compute g at Earth's surface using G·M_Earth / R_Earth². Show that you get 9.81 m/s².",
      "given": "G = 6.67×10⁻¹¹ · M_Earth = 5.97×10²⁴ kg · R_Earth = 6.37×10⁶ m",
      "equation": "g(R) = G·M / R²",
      "work": "g = (6.67×10⁻¹¹)(5.97×10²⁴) / (6.37×10⁶)²\ng = (3.98×10¹⁴) / (4.06×10¹³)\ng ≈ 9.81 m/s²",
      "answer": "9.81 m/s². The number matches what we measure in lab — the equation works."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "misconception",
      "title": "'Zero gravity' in space is a myth",
      "markdown": "At the ISS, g is about **89% of surface g**. Astronauts float because they are **falling with the station** — that's what an orbit is. We'll prove this with numbers today and explore it fully on Day 13."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "Compute g at the ISS (altitude 400 km, so r = R_Earth + 400 km = 6.77 × 10⁶ m). Then explain in one sentence why astronauts float anyway.",
      "givenHint": "G, M_Earth = 5.97 × 10²⁴ kg, and r = 6.77 × 10⁶ m (center-to-center!).",
      "equationHint": "Field strength: g(r) = G·M/r².",
      "equationOptions": [
        "g(r) = G·M/r²",
        "F = G·m₁·m₂/r²",
        "F = m·g",
        "v = √(G·M/r)"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why is the ISS NOT 'in zero gravity' even though astronauts float? Use your computed g at ISS altitude in your answer.",
      "frame": "Astronauts on the ISS float NOT because g is zero (it's about ___ m/s² up there), but because they and the station are both ___ around Earth, so they fall ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.k2-field-strength"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 7 — g Varies with Altitude → Orbit Preview', 'u2-d07', 'Unit 2: Gravitation & Fields', 7, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can graph g vs. altitude, read the curve, and explain qualitatively why weightlessness in orbit is FREE FALL — not the absence of gravity.",
      "targetId": "u2.r3-compare-g"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's distance is changing, so the g it feels is changing.",
      "connection": "g(r) is the function that lets us compute the force on the asteroid at ANY distance — not just at Earth's surface."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## g is a curve, not a constant\n\nYesterday's equation g(r) = G·M/r² isn't just for one altitude — it's a **function**. Feed it any r, it returns the field strength there.\n\nBecause of the r², the curve falls fast at first and then flattens: going up 400 km only costs you ~11% of g, but by the Moon's distance, Earth's g has shrunk to about **1/3600** of its surface value.\n\nRead the graph below: where does g drop to half? To a tenth?"
    },
    {
      "id": "b4",
      "type": "graph",
      "title": "Earth's gravitational field strength vs. altitude",
      "xLabel": "Altitude above surface (km)",
      "yLabel": "g (m/s²)",
      "genPrompt": "g(r) = G·M_Earth/r² computed at increasing altitudes, showing the inverse-square falloff from 9.81 at the surface.",
      "series": [
        {
          "label": "g(r) = G·M/r²",
          "points": [
            [
              0,
              9.81
            ],
            [
              400,
              8.7
            ],
            [
              1000,
              7.33
            ],
            [
              2000,
              5.68
            ],
            [
              3000,
              4.53
            ],
            [
              5000,
              3.08
            ],
            [
              8000,
              1.93
            ],
            [
              10000,
              1.49
            ],
            [
              15000,
              0.87
            ],
            [
              20000,
              0.57
            ],
            [
              35786,
              0.22
            ]
          ]
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch the g-vs-altitude curve from the graph above. MARK the altitude where g drops to half (≈ 4.9 m/s²). MARK where it drops to about a tenth (≈ 1 m/s²). Then, in a corner, answer in 2 sentences: why doesn't the ISS fall straight down?",
      "prompts": [
        "Mark and label the half-g point.",
        "Mark and label the tenth-g point.",
        "2 sentences: why doesn't the ISS fall straight down?"
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "Find Earth's g at the Moon's average orbital distance (r = 3.84 × 10⁸ m). Compare to surface g.",
      "given": "M_Earth = 5.97×10²⁴ kg · r = 3.84×10⁸ m",
      "equation": "g(r) = G·M / r²",
      "work": "g = (6.67×10⁻¹¹)(5.97×10²⁴) / (3.84×10⁸)²\ng = (3.98×10¹⁴) / (1.47×10¹⁷)\ng ≈ 0.0027 m/s²",
      "answer": "≈ 0.0027 m/s² — about 1/3600 of surface g. The Moon still feels Earth's pull."
    },
    {
      "id": "b7",
      "type": "gewa",
      "capture": true,
      "prompt": "Find the altitude above Earth's surface where g = 4.9 m/s² (half of surface g). Hint: solve g = G·M/r² for r. Then subtract R_Earth.",
      "givenHint": "g = 4.9 m/s², G, M_Earth = 5.97 × 10²⁴ kg, R_Earth = 6.37 × 10⁶ m.",
      "equationHint": "Rearrange: r = √(G·M/g). Don't forget to subtract R_Earth at the end — the question asks for ALTITUDE.",
      "equationOptions": [
        "g(r) = G·M/r²",
        "r = √(G·M/g)",
        "F = m·g",
        "F = G·m₁·m₂/r²"
      ]
    },
    {
      "id": "b8",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Explain the difference between (a) 'no gravity in orbit' and (b) 'falling freely in orbit.' Which one is true?",
      "frame": "Statement ___ is true. In orbit, gravity is ___ — the station and astronauts are both ___."
    },
    {
      "id": "b9",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.r3-compare-g"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 8 — Vernier Free-Fall Lab: Measure g (Investigation 2.1)', 'u2-d08', 'Unit 2: Gravitation & Fields', 8, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can capture a v–t graph for a falling ball with a Vernier motion detector and find g from the slope.",
      "targetId": "u2.s4-vernier-measure-g"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We've been USING g = 9.81 m/s² for a week. Today we MEASURE it.",
      "connection": "If our lab number matches theory, the F = G·m₁·m₂/r² framework we'll apply to 2026-XJ stands on tested ground."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 2.1 — Measure g",
      "markdown": "**Driving question:** How close can we come to measuring g = 9.81 m/s² in this room?\n\n**Equipment:** Vernier motion detector + LabQuest (1 per pair) · Logger Pro or Graphical Analysis on a laptop · a drop ball (≥ 4 cm diameter — bigger is better for the sensor) · tape measure (to set drop height) · clear floor zone (head and toes out of the drop path).\n\n**How this lab serves the year's question:** if the lab confirms g near Earth, the equations we use for 2026-XJ are trustworthy."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "Point the motion detector UP. Hold the ball at a known height above it.",
        "Start data collection. Release the ball cleanly (no toss).",
        "On the v–t graph, the falling portion is a straight line. Fit it. **Slope = g.**",
        "Repeat for 3 trials. Average. Compare to 9.81 m/s²."
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "Catch the ball **before** it hits the sensor. Keep hands and faces clear of the drop path. Don't release toward another group."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Not in class today?",
      "markdown": "Run the picket-fence simulation below — it's the same measurement: an object falls past a sensor, you read g from the slope of the v–t graph. Use its values to fill your data table."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "picket-fence-g"
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch your lab setup: detector pointing up, ball above it, drop height h marked. Record your h value on the diagram.",
      "prompts": [
        "Show the detector, the ball, and the drop path.",
        "Label the drop height h with its value.",
        "Mark the 'clear zone' around the drop path."
      ]
    },
    {
      "id": "b9",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "Drop height (m)",
        "Slope of v–t (m/s²)",
        "Notes (release? ball wobble?)"
      ],
      "rows": 5,
      "plot": false,
      "patternPrompt": "Row 5 is your average. How consistent are your slopes across trials?"
    },
    {
      "id": "b10",
      "type": "observation",
      "capture": true,
      "patternPrompt": "How close is your AVERAGE to 9.81 m/s²? Compute your percent error.",
      "interpretPrompt": "If your value is LOW, what in your setup might cause that? If HIGH, what might? And the asteroid connection: how does this measurement serve the year's question?",
      "frame": "My measured g was ___ m/s². The accepted value is 9.81 m/s². My percent error was ___. I think the biggest source of error was ___."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write a claim-evidence-reasoning paragraph about your measurement.",
      "frame": "From my data, I claim g = ___ m/s². My evidence is ___. This is ___% off from 9.81 m/s². I think the difference is because ___."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.s4-vernier-measure-g"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 9 — Projectile Motion: Two Independent Dimensions', 'u2-d09', 'Unit 2: Gravitation & Fields', 9, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can decompose a projectile's motion into independent horizontal and vertical pieces, and I can explain why a side-pushed ball and a dropped ball hit the ground at the same time.",
      "targetId": "u2.k3-projectile-independence"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid in flight is technically a projectile — gravity bends its path.",
      "connection": "What you learn about projectiles in 3 days scales straight up to orbits. The math is the same; only the distances grow."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Two motions, one object\n\nA projectile's motion splits into two **independent** pieces:\n\n- **Horizontal:** x = vₓ · t — horizontal velocity **never changes** (no horizontal force).\n- **Vertical:** y = y₀ − ½·g·t² — vertical velocity changes at g per second (gravity acts here).\n\nThe two pieces don't talk to each other. **Time is the only link** between them."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Projectile",
          "definition": "Any object moving under gravity alone after launch — no engine, no air force. A thrown baseball. A horizontally-fired bullet. An asteroid in free fall.",
          "cognate": "Sp. proyectil · Pt. projétil · HC pwojektil"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "note",
      "title": "The drop-and-push race",
      "markdown": "Drop one ball. Push another sideways at the **same instant**. They hit the ground at the **SAME time**. Time is set by the VERTICAL motion alone — the sideways push changes *where* it lands, not *when*."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — monkey and hunter",
      "markdown": "We watched the classic monkey-and-hunter setup: aim straight at the target, and if the target drops the instant you fire, you ALWAYS hit it — both fall at the same g. Run the simulation below and test which prediction survives."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "monkey-hunter"
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the dropped ball and the side-pushed ball at three moments (t = 0, 1 s, 2 s). For the pushed ball, label vₓ at each moment (it never changes) and v_y at each moment (it grows by ~10 m/s each second).",
      "prompts": [
        "Both balls at the SAME height at each moment.",
        "vₓ labels: same value all three times.",
        "v_y labels: 0, ~10, ~20 m/s."
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does a side-pushed ball NOT take longer to fall than a ball that's just dropped? Use the word 'independent' in your answer.",
      "frame": "The horizontal and vertical motions are ___, so the sideways push changes ___ but not ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.k3-projectile-independence"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 10 — Horizontal Projectile Launches', 'u2-d10', 'Unit 2: Gravitation & Fields', 10, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can solve a horizontal-launch projectile problem: find fall time from height, then find horizontal range.",
      "targetId": "u2.s2-projectile-calc"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ has both horizontal and vertical velocity (with respect to Earth).",
      "connection": "Cliff problems are the small-scale version. The recipe (find t first, then x) is the same recipe orbit problems use."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The two-step recipe\n\nEvery horizontal-launch problem is the same two steps, in the same order:\n\n1. **Find time from the VERTICAL motion:** h = ½·g·t² → t = √(2h/g). The height alone decides how long it's in the air.\n2. **Find range from the HORIZONTAL motion:** x = vₓ·t. Plug in the t you just found.\n\nNever the other way around. The horizontal motion can't tell you the time — vₓ never changes, so it has no clock in it."
    },
    {
      "id": "b4",
      "type": "callout",
      "variant": "tip",
      "title": "Strategy every time",
      "markdown": "**FIND TIME FIRST** from the vertical motion. Then plug t into x = vₓ·t."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Test it in the simulation",
      "markdown": "Launch a few projectiles below. Change the height and watch the fall time change; change vₓ and watch the range change while the fall time stays put. That asymmetry IS the independence from yesterday."
    },
    {
      "id": "b6",
      "type": "sim_embed",
      "simulationSlug": "projectile-motion"
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "A ball is fired horizontally from a 5 m cliff at vₓ = 10 m/s. (a) How long until it hits the ground? (b) How far from the cliff base?",
      "given": "h = 5 m · vₓ = 10 m/s · g = 9.81 m/s²",
      "equation": "(1) h = ½·g·t²      (2) x = vₓ·t",
      "work": "(1) 5 = ½·(9.81)·t² → t² = 10/9.81 → t ≈ 1.01 s\n(2) x = 10 × 1.01 ≈ 10.1 m",
      "answer": "t ≈ 1.0 s, lands ≈ 10 m from the cliff."
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Pick your own numbers for cliff height h and launch speed vₓ. Draw the cliff, the launch arrow, and trace the parabola lightly. Label the range x where it lands.",
      "prompts": [
        "Label h on the cliff and vₓ on the launch arrow.",
        "The path curves down more and more steeply — a parabola.",
        "Label the range x along the ground."
      ]
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "A ball is fired horizontally from a 45 m cliff at vₓ = 15 m/s. (a) Find fall time. (b) Find horizontal range.",
      "givenHint": "h = 45 m, vₓ = 15 m/s, g = 9.81 m/s².",
      "equationHint": "Step 1: h = ½·g·t² gives the time. Step 2: x = vₓ·t gives the range.",
      "equationOptions": [
        "h = ½·g·t²",
        "x = vₓ·t",
        "vₓ = v·cos θ",
        "v_y = v·sin θ"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "From a 20 m cliff at vₓ = 8 m/s, where does the ball land? Show both steps.",
      "frame": "Step 1 (time from height): t ≈ ___ s. Step 2 (range): x = 8 × ___ ≈ ___ m."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.s2-projectile-calc"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 11 — Angled Projectile Launches', 'u2-d11', 'Unit 2: Gravitation & Fields', 11, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can decompose a launch velocity into vₓ = v cos θ and v_y = v sin θ, compute flight time, and explain why 45° maximizes range on level ground.",
      "targetId": "u2.r2-predict-landing"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's velocity has both horizontal and angled components in Earth's frame.",
      "connection": "If the asteroid entered the atmosphere, this is the math we'd use to predict the impact point."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Angled launches — split the velocity first\n\nAn angled launch is just a horizontal launch wearing a disguise. Strip it with two lines of trig:\n\n- **vₓ = v·cos θ** — the horizontal piece (constant the whole flight)\n- **v_y = v·sin θ** — the vertical piece (gravity eats it at g per second)\n\nOn level ground the flight time is **t = 2·v_y/g** (up and back down), and the range is **x = vₓ·t**.\n\nWhy is **45°** the max-range angle on level ground? Because the speed is split **equally** between the two jobs: enough v_y to buy time in the air, enough vₓ to use that time covering ground. Tilt steeper and you buy time you can't use; tilt shallower and you have speed with no time to spend it."
    },
    {
      "id": "b4",
      "type": "worked_example",
      "prompt": "A ball launches at 20 m/s at 30° above level ground. Find (a) vₓ, (b) v_y, (c) flight time, (d) range.",
      "given": "v = 20 m/s · θ = 30° · level ground · g = 9.81 m/s²",
      "equation": "vₓ = v cos θ · v_y = v sin θ · t_flight = 2·v_y/g · x = vₓ·t_flight",
      "work": "vₓ = 20·cos30° ≈ 17.3 m/s\nv_y = 20·sin30° = 10.0 m/s\nt_flight = 2·10.0 / 9.81 ≈ 2.04 s\nx = 17.3 × 2.04 ≈ 35.3 m",
      "answer": "≈ 35 m. (Try 45° — you'll get ≈ 40.8 m, the maximum on level ground.)"
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Pick a launch speed v. Draw three arcs from the same launch point: one at 30°, one at 45°, one at 60°. Make the 45° arc go farthest. Then write a 1-sentence reason WHY 45° wins.",
      "prompts": [
        "Same launch speed for all three arcs.",
        "30° and 60° should land at about the SAME spot (try it tomorrow with the math!).",
        "Your one-sentence WHY in a corner."
      ]
    },
    {
      "id": "b6",
      "type": "gewa",
      "capture": true,
      "prompt": "Same launch speed (20 m/s), but now θ = 60°. Predict first: will the range be bigger, smaller, or the same as 30°? Then compute it.",
      "givenHint": "v = 20 m/s, θ = 60°, level ground. Write your prediction in the Given box too.",
      "equationHint": "Same four-equation chain as the worked example: components → flight time → range.",
      "equationOptions": [
        "vₓ = v·cos θ",
        "v_y = v·sin θ",
        "t = 2·v_y/g",
        "x = vₓ·t"
      ]
    },
    {
      "id": "b7",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does 45° give max range on level ground? Reason it physically (not just algebraically).",
      "frame": "On level ground, 45° gives max range because the launch speed is split ___ between horizontal and vertical, balancing ___ in the air with ___ across the ground."
    },
    {
      "id": "b8",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.r2-predict-landing"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 12 — Circular Motion + Centripetal Force', 'u2-d12', 'Unit 2: Gravitation & Fields', 12, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute a_c = v²/r and F_c = m·v²/r for an object in circular motion and explain why F_c always points toward the center.",
      "targetId": "u2.s3-centripetal-calc"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An orbit IS circular motion. The force that holds an orbit is gravity.",
      "connection": "Today we get the centripetal math. Tomorrow we connect it to gravity and discover that orbits ARE FALLING."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Turning is accelerating\n\nAn object moving in a circle at constant **speed** is still accelerating — its **direction** is changing every instant. That acceleration points toward the center:\n\n- **a_c = v² / r** — centripetal acceleration\n- **F_c = m·v² / r** — the net inward force required to keep the circle\n\nFaster (bigger v) or tighter (smaller r) → more force needed. If the available force can't supply F_c, the object leaves the circle."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Centripetal force",
          "definition": "The NET inward force that keeps an object on a circular path; F_c = m·v²/r. A car turning a corner: friction is the centripetal force. A satellite orbiting: gravity is.",
          "cognate": "Sp. fuerza centrípeta · Pt. força centrípeta · HC fòs santipèt"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Centripetal force is a ROLE, not a new force",
      "markdown": "It's not a new kind of force. It's the role played by an **existing** force — friction, gravity, tension — whenever that force points toward the center. And when the string cuts, the ball flies along the **TANGENT** — not outward. There's no 'centrifugal force' pushing it out; the inward force just disappears."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "vectors",
      "title": "Ball on a string — the two arrows that matter",
      "caption": "v points along the tangent (where the ball would go if released). F_c points inward along the string. If the string cuts, the ball follows v — straight out along the tangent.",
      "genPrompt": "A ball in circular motion: velocity vector tangent to the circle, centripetal force vector pointing toward the center, 90 degrees apart.",
      "vectors": [
        {
          "label": "v (tangent)",
          "angle": 0,
          "mag": 80
        },
        {
          "label": "F_c (toward center)",
          "angle": 90,
          "mag": 60
        }
      ],
      "showResultant": false
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "A 1500 kg car rounds a 50 m radius curve at 20 m/s. What centripetal force must friction provide?",
      "given": "m = 1500 kg · v = 20 m/s · r = 50 m",
      "equation": "F_c = m·v² / r",
      "work": "F_c = 1500 × (20)² / 50\nF_c = 1500 × 400 / 50\nF_c = 12,000 N",
      "answer": "12,000 N inward. Friction has to provide all of it — if it can't, the car skids out."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "A 0.2 kg ball moves in a horizontal circle at 4 m/s on a 1 m string. What is the centripetal force? What provides it?",
      "givenHint": "m = 0.2 kg, v = 4 m/s, r = 1 m. Name the force playing the centripetal role in your Answer.",
      "equationHint": "F_c = m·v²/r.",
      "equationOptions": [
        "F_c = m·v²/r",
        "a_c = v²/r",
        "F = m·g",
        "F = G·m₁·m₂/r²"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "The string cuts while the ball is circling. Which way does the ball fly, and why is 'it gets flung outward by centrifugal force' the wrong explanation?",
      "frame": "The ball flies along the ___, because the only thing that changed is that the ___ force disappeared."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.s3-centripetal-calc"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 13 — Newton''s Cannon: Orbits as Continuous Falling (Investigation 2.2)', 'u2-d13', 'Unit 2: Gravitation & Fields', 13, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can explain an orbit as continuous free fall, and I can use the PhET Gravity and Orbits sim to find what launch speed produces a circular orbit at a given altitude.",
      "targetId": "u2.k5-orbit-free-fall"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Two orbits (Earth's and 2026-XJ's) can cross. The question is timing.",
      "connection": "Today we discover that an orbit IS falling — at exactly the speed that lets the ground curve away as fast as you fall toward it."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Newton's cannon\n\nNewton's thought experiment: fire a cannonball horizontally from a tall mountain.\n\n- Fire it **slow** → it falls and hits the ground nearby.\n- Fire it **faster** → it still falls, but lands farther away.\n- Fire it at exactly the right speed → it falls toward Earth at the same rate the Earth's surface **curves away beneath it**. It falls forever and never lands.\n\nThat last case **is an orbit**. Nothing is holding the object up. It is falling the entire time — which is exactly why astronauts inside it float."
    },
    {
      "id": "b4",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 2.2 — PhET Gravity and Orbits",
      "markdown": "**Driving question:** What launch speed produces a CIRCULAR orbit at a given altitude?\n\n**Equipment:** laptop with the PhET *Gravity and Orbits* sim ([phet.colorado.edu](https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_en.html)) · calculator · today's data table.\n\n**How this lab serves the year's question:** 2026-XJ is on a Sun-orbit. The same v_orbit equation applies — only the central mass changes."
    },
    {
      "id": "b5",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "Open PhET **Gravity and Orbits**. Place a satellite near Earth at a chosen altitude.",
        "Try a small launch velocity. What happens? (Crashes.)",
        "Increase the velocity. Find a speed that makes a **CIRCULAR** orbit.",
        "Then compute v_orbit = √(G·M/r) for that altitude. Compare."
      ]
    },
    {
      "id": "b6",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "Altitude (km)",
        "Launch v (m/s)",
        "Result (crash / oval / circle / escape)"
      ],
      "rows": 5,
      "plot": false,
      "patternPrompt": "What pattern connects launch speed to the shape of the path?"
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw Earth and three cannonball paths from the same launch point: label which is 'slow' (crashes near), which is 'faster' (crashes far), and which is 'orbit speed' (never lands). Then write the key idea sentence using the words 'falling' and 'horizontal'.",
      "prompts": [
        "Three paths, one launch point.",
        "Labels: slow / faster / orbit speed.",
        "Key sentence with 'falling' and 'horizontal'."
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "For a circular orbit, gravity IS the centripetal force. Set F_gravity = F_centripetal and solve for v. Show every step.",
      "given": "Circular orbit at radius r around mass M",
      "equation": "F_g = G·M·m/r² ; F_c = m·v²/r ; set them equal",
      "work": "G·M·m / r² = m·v² / r\nG·M / r² = v² / r         (cancel m)\nG·M / r = v²              (multiply both sides by r)\nv = √(G·M / r)",
      "answer": "v_orbit = √(G·M / r). The orbit speed depends on the CENTRAL mass and the radius — not on the satellite's mass."
    },
    {
      "id": "b9",
      "type": "observation",
      "capture": true,
      "patternPrompt": "What was the launch speed for a CLEAN circular orbit at 400 km altitude in the sim?",
      "interpretPrompt": "Compare your sim value to v_orbit = √(G·M_Earth / r) at r = R_Earth + 400 km. Do they match? And the asteroid connection: how does this serve the year's question?",
      "frame": "The launch speed for a circular orbit at 400 km is about ___ m/s. Theory predicts ___ m/s. The sim agrees ___."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "In 2-3 sentences, explain why the ISS doesn't fall straight down. Use the words 'falling', 'horizontal', and 'curves away'.",
      "frame": "The ISS IS falling — but it also moves ___ so fast that the Earth ___ beneath it as fast as it falls."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.k5-orbit-free-fall"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 14 — Kepler''s Three Laws', 'u2-d14', 'Unit 2: Gravitation & Fields', 14, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can state Kepler's three laws in my own words and use Kepler's third law to compare orbital periods.",
      "targetId": "u2.k4-keplers-laws"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's semi-major axis a ≈ 1.42 AU (refined orbit).",
      "connection": "Kepler's third law gives 2026-XJ's PERIOD — and that's the timing we need to answer Phase 5's question: WHEN does it next cross Earth's orbit?"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Kepler's three laws, plainly\n\n1. **Orbits are ellipses**, with the central body at one focus (not at the center).\n2. **Equal areas in equal times** — an orbiting body sweeps out area at a steady rate. Near the Sun it moves FAST (perihelion); far from the Sun it moves SLOW (aphelion).\n3. **T² = a³** — for Sun-orbits with T in years and a in AU. Bigger orbit → much longer year, because T² grows as a³.\n\nKepler found these from data alone, decades before Newton explained WHY with universal gravitation."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Ellipse",
          "definition": "An oval-shaped closed curve with TWO foci. Every planet's orbit is an ellipse with the central body at one focus. Earth's orbit is nearly circular (e ≈ 0.017); a comet's can be e ≈ 0.9.",
          "cognate": "Sp. elipse · Pt. elipse · HC elips"
        },
        {
          "term": "Period (T)",
          "definition": "The time for one full orbit. Earth's period around the Sun = 1 year. Moon's period around Earth ≈ 27.3 days. A longer period means a longer orbit, not a slower object.",
          "cognate": "Sp. periodo · Pt. período · HC peryòd"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Two foci, one Sun",
      "markdown": "An ellipse has TWO foci. The central body sits at **one** of them — not at the center of the oval. The other focus is empty space."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw an elliptical orbit with the Sun at one focus (off-center!). MARK the point where the object moves FASTEST (perihelion — closest to the Sun) and the point where it moves SLOWEST (aphelion — farthest). Then write WHY in one sentence (think: equal areas in equal times).",
      "prompts": [
        "Sun at one focus, visibly off-center.",
        "Label perihelion (fastest) and aphelion (slowest).",
        "One sentence: why faster when closer?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "Mars has a semi-major axis a = 1.52 AU. Find its period in years using Kepler's third law.",
      "given": "a = 1.52 AU · use T² = a³ (Sun-orbit, T in years)",
      "equation": "T² = a³ → T = √(a³)",
      "work": "T² = (1.52)³ = 3.51\nT = √3.51 ≈ 1.87 years",
      "answer": "≈ 1.87 Earth-years. (Real value: 1.88. Match.)"
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "2026-XJ has a = 1.42 AU. Find its period in years. (This number tells us how often it could return to its current location.)",
      "givenHint": "a = 1.42 AU. Sun-orbit, so T² = a³ works directly with T in years.",
      "equationHint": "Cube a, then square-root: T = √(a³).",
      "equationOptions": [
        "T² = a³",
        "v = √(G·M/r)",
        "F = G·m₁·m₂/r²",
        "F_c = m·v²/r"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write each of Kepler's three laws in ONE sentence in your own words.",
      "frame": "1) Orbits are ___. 2) Objects sweep ___ in equal times, so they move faster when ___. 3) T² = ___ for Sun-orbits."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.k4-keplers-laws"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 15 — When Does 2026-XJ Arrive?', 'u2-d15', 'Unit 2: Gravitation & Fields', 15, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can use Kepler's third law and universal gravitation to compute 2026-XJ's period, its perihelion distance, and whether/when its orbit crosses Earth's.",
      "targetId": "u2.r4-closest-approach"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Refined parameters (from the cover briefing): a = 1.42 AU, e = 0.31, currently closing.",
      "connection": "This is the day the unit pays off. We use EVERY tool we built — universal gravitation, fields, orbits, Kepler — to answer: when does 2026-XJ next cross Earth's path?"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The payoff — three steps to an answer\n\nEverything this unit built converges on three calculations:\n\n1. **Period** from Kepler's third law: T² = a³.\n2. **Perihelion and aphelion** from the orbit's shape: r_peri = a(1−e), r_apo = a(1+e).\n3. **The crossing question:** if perihelion is INSIDE Earth's orbit (1.00 AU), the asteroid crosses Earth's path twice per pass — once inbound, once outbound. Then the only question left is **timing**.\n\nWork the steps below. Steps 1 and 2 are worked for you; step 3 is yours."
    },
    {
      "id": "b4",
      "type": "callout",
      "variant": "tip",
      "title": "Watch it happen",
      "markdown": "Run the trajectory simulation below while you work. You're computing, by hand, exactly what the simulation integrates numerically — the same physics, two methods."
    },
    {
      "id": "b5",
      "type": "sim_embed",
      "simulationSlug": "asteroid-trajectory"
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "STEP 1 — Period from Kepler's third law. Use T² = a³ with a = 1.42 AU. Find 2026-XJ's orbital period in years.",
      "given": "a = 1.42 AU (heliocentric, around the Sun)",
      "equation": "T² = a³ → T = √(a³)",
      "work": "T² = (1.42)³ = 2.86\nT = √2.86 ≈ 1.69 years",
      "answer": "≈ 1.69 Earth-years — about 20 months for one full orbit of the Sun."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "STEP 2 — Perihelion and aphelion distances. Use perihelion = a(1−e) and aphelion = a(1+e) with a = 1.42 AU and e = 0.31.",
      "given": "a = 1.42 AU · e = 0.31",
      "equation": "r_peri = a(1−e) ; r_apo = a(1+e)",
      "work": "r_peri = 1.42 × (1 − 0.31) = 1.42 × 0.69 ≈ 0.98 AU\nr_apo = 1.42 × (1 + 0.31) = 1.42 × 1.31 ≈ 1.86 AU",
      "answer": "Perihelion ≈ 0.98 AU; aphelion ≈ 1.86 AU. PERIHELION IS INSIDE EARTH'S ORBIT (1.00 AU)."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "STEP 3 — Does it cross Earth's orbit? WHEN? Since 2026-XJ's perihelion is 0.98 AU and Earth's orbit is 1.00 AU, the asteroid CROSSES Earth's orbit twice per pass — once going in, once going out. Use your period (≈ 1.69 yr) to estimate WHEN it next reaches perihelion. (Use any reasonable assumption about its current position in the orbit; show your reasoning.)",
      "givenHint": "T ≈ 1.69 yr, r_peri ≈ 0.98 AU, current distance ≈ 1.18 AU and closing. State your assumption about where it is in its orbit.",
      "equationHint": "Reason with fractions of the period — e.g., if it's partway from aphelion to perihelion, what fraction of T remains?",
      "equationOptions": [
        "T² = a³",
        "r_peri = a(1−e)",
        "r_apo = a(1+e)",
        "v = √(G·M/r)"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "This is what NASA actually does",
      "markdown": "The math you ran here is the same kind they run on real near-Earth objects — the constants are real, the equations are real, only the asteroid is fictional."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write one sentence to a non-physics friend explaining when (year + roughly what month) 2026-XJ next crosses Earth's orbit — and whether being at the SAME PLACE in space at the SAME TIME is likely. Be honest about the uncertainty. Then complete the comparison frame.",
      "frame": "Compared to Unit 1's prediction, this answer is more trustworthy because Unit 1 assumed ___, but we now know that ___ depends on r. The new tools we used were ___ and ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u2.r4-closest-approach"
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 16 — Unit 2 Transfer Task', 'u2-d16', 'Unit 2: Gravitation & Fields', 16, 'markdown', false, $u2${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply every Unit 2 tool — gravitation, fields, projectiles, circular motion, orbits, Kepler — independently on the transfer task.",
      "targetId": "u2.transfer-task"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Every tool from Unit 2 is in your hands: free fall, F = mg, universal gravitation, field strength g(r), projectiles, centripetal force, orbits, Kepler.",
      "connection": "One of the 4 transfer problems anchors in 2026-XJ — compute F_gravity between Earth and the asteroid at a specific separation and reason about how F changes."
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
      "markdown": "## The task — 4 multi-part problems, ~40 minutes, independent\n\n- **Problem 1 — Universal gravitation.** Compute F between Earth and 2026-XJ at a given r. Then reason about how F changes if r is halved.\n- **Problem 2 — Projectile motion.** A ball is launched at 25° from a 30 m cliff at 18 m/s. Find time of flight, range, and max height.\n- **Problem 3 — Orbital speed.** Given the ISS altitude and Earth's mass, compute v_orbit.\n- **Problem 4 — Kepler's third law.** Given a Sun-orbiting asteroid's semi-major axis, find its period; reason about its closest approach to Earth.\n\n### How it's scored — 4 dimensions, each 0–4\n\n- **Science** — correct physics: vectors, kinematics, units.\n- **Reasoning** — sound method; uncertainty explained, not just stated.\n- **Communication** — work shown, units labeled, organized, readable.\n- **Transfer-to-Asteroid** — honest public-facing connection to 2026-XJ."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Allowed today",
      "markdown": "The Unit 2 Equation Reference card and a calculator. Every equation on it is on the MCAS Equation Sheet — you do **not** need to memorize them. You DO need to recognize when each one applies. You may ask **clarifying** questions about what the task means — but not physics-content questions."
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
      "markdown": "## After the task — final unit self-assessment\n\nRate yourself on every Unit 2 target below. This is your end-of-unit Marzano record — it feeds your Mastery Growth Chart and tells us both exactly where to focus before the next unit builds on this one."
    },
    {
      "id": "b8",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "u2.anchor-why-bend",
        "u2.free-fall-g",
        "u2.mass-vs-weight",
        "u2.k1-universal-gravitation",
        "u2.s1-compute-gravitation",
        "u2.r1-scale-f",
        "u2.k2-field-strength",
        "u2.r3-compare-g",
        "u2.s4-vernier-measure-g",
        "u2.k3-projectile-independence",
        "u2.s2-projectile-calc",
        "u2.r2-predict-landing",
        "u2.s3-centripetal-calc",
        "u2.k5-orbit-free-fall",
        "u2.k4-keplers-laws",
        "u2.r4-closest-approach"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "End-of-unit reflection: where did you grow the most this unit, and what's the one idea you want locked in before Unit 3?",
      "frame": "I grew most on ___. Before Unit 3 I want to lock in ___."
    }
  ]
}$u2$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

-- Wire each target to its lesson (publish guardrail requires learning_targets.lesson_id)
WITH map(target_slug, lesson_slug) AS (VALUES
  ('u2.anchor-why-bend','u2-d01'),
  ('u2.free-fall-g','u2-d02'),
  ('u2.mass-vs-weight','u2-d03'),
  ('u2.k1-universal-gravitation','u2-d04'),
  ('u2.s1-compute-gravitation','u2-d05'),
  ('u2.r1-scale-f','u2-d05'),
  ('u2.k2-field-strength','u2-d06'),
  ('u2.r3-compare-g','u2-d07'),
  ('u2.s4-vernier-measure-g','u2-d08'),
  ('u2.k3-projectile-independence','u2-d09'),
  ('u2.s2-projectile-calc','u2-d10'),
  ('u2.r2-predict-landing','u2-d11'),
  ('u2.s3-centripetal-calc','u2-d12'),
  ('u2.k5-orbit-free-fall','u2-d13'),
  ('u2.k4-keplers-laws','u2-d14'),
  ('u2.r4-closest-approach','u2-d15'),
  ('u2.transfer-task','u2-d16')
)
UPDATE learning_targets t SET lesson_id = l.id::text
FROM map m JOIN lessons l ON l.slug = m.lesson_slug
WHERE t.slug = m.target_slug;

UPDATE learning_targets SET exclude_from_growth = true WHERE slug = 'u2.transfer-task';

COMMIT;
