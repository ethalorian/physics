-- Apply Unit 4: Energy & Work lesson blocks + learning targets (paste into Supabase SQL editor).
-- Generated from /sessions/laughing-zen-feynman/mnt/physics-classroom/src/data/unit4-blocks/*.json
BEGIN;

-- Learning targets
INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.anchor-damage-energy', 'I can articulate why momentum gave us force but not damage, and predict that something involving speed-squared does the work.', 'reasoning', 'unit-4', 1)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k1-work', 'I can compute work W = F·d in joules and identify when a force does work.', 'knowledge', 'unit-4', 2)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r1-work-angle', 'I can compute work at an angle (W = F·d·cos θ) and identify negative and zero work.', 'reasoning', 'unit-4', 3)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k2-kinetic-energy', 'I can compute KE = ½mv² and explain why doubling speed quadruples kinetic energy.', 'knowledge', 'unit-4', 4)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.s1-work-energy-theorem', 'I can apply the work-energy theorem W_net = ΔKE to solve problems.', 'skill', 'unit-4', 5)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.s2-vernier-ke-lab', 'I can measure speed with photogates and verify the work-energy theorem within a % difference.', 'skill', 'unit-4', 6)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k3-gpe-mgh', 'I can compute gravitational PE near Earth with U = mgh from a stated reference height.', 'knowledge', 'unit-4', 7)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r2-mgh-limits', 'I can explain when U = mgh fails (g changes with altitude) and read a g-vs-altitude curve.', 'reasoning', 'unit-4', 8)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k4-universal-pe', 'I can use universal PE, U = −GMm/r, and interpret its negative sign.', 'knowledge', 'unit-4', 9)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k5-conservation', 'I can state conservation of mechanical energy (KE + PE = constant) and its no-friction condition.', 'knowledge', 'unit-4', 10)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.s3-conservation-solve', 'I can solve conservation problems for rolling, sliding, and swinging objects.', 'skill', 'unit-4', 11)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r3-coaster-pendulum', 'I can analyze a roller coaster and a pendulum with the energy ledger, including v = √(2gΔh).', 'reasoning', 'unit-4', 12)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.s4-vernier-ramp-lab', 'I can run the Vernier ramp lab and verify v² is proportional to release height.', 'skill', 'unit-4', 13)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k6-hookes-law', 'I can use Hooke''s law F = −kx and interpret the spring constant k.', 'knowledge', 'unit-4', 14)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.s5-spring-pe', 'I can compute spring PE = ½kx² and use it in energy conservation problems.', 'skill', 'unit-4', 15)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.k7-power', 'I can compute power P = W/t = F·v in watts and distinguish energy from power.', 'knowledge', 'unit-4', 16)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r4-ke-collisions', 'I can compute the KE lost in inelastic collisions and verify KE conservation in elastic ones.', 'reasoning', 'unit-4', 17)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r5-heat-bridge', 'I can account for ''missing'' mechanical energy as heat and trace full energy chains.', 'reasoning', 'unit-4', 18)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r6-tnt-yield', 'I can convert an impactor''s kinetic energy to TNT-equivalent yield and place it on the impact scale.', 'reasoning', 'unit-4', 19)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.r7-escape-velocity', 'I can derive and use escape velocity v_esc = √(2GM/r) for any body.', 'reasoning', 'unit-4', 20)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.synthesis-energy-budget', 'I can run the three-branch energy budget for 2026-XJ and defend the conclusion.', 'reasoning', 'unit-4', 21)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u4.transfer-task', 'I can apply every Unit 4 tool independently on the transfer task.', 'reasoning', 'unit-4', 22)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

-- Lessons
INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 1 — Re-anchoring: Damage Isn''t Just Force', 'u4-d01', 'Unit 4: Energy & Work', 1, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can articulate why MOMENTUM gave us force at impact, but didn't give us a DAMAGE answer — and I can predict that something involving SPEED-SQUARED is doing the work.",
      "targetId": "u4.anchor-damage-energy"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Unit 3: 2026-XJ's momentum at impact is enormous, and the AVERAGE force of impact is ~10¹⁴ N. But \"force\" doesn't tell us crater size, fire radius, or tsunami height.",
      "connection": "What people quote for asteroid impacts is the asteroid's KINETIC ENERGY in TNT-equivalents. Unit 4 builds that framework. Day 19 cashes it in."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "NASA / Planetary Defense Briefing — Update 4",
      "markdown": "The Unit 3 DART feasibility analysis came back **INCONCLUSIVE**. The required Δv depends sensitively on lead time — and we may not have lead time. So now Unit 4 has to answer the OTHER branch: if 2026-XJ does impact, **HOW BAD IS IT ACTUALLY?**\n\nReports talk about \"Tunguska-scale\" or \"Chicxulub-scale\" events — but those are TNT-equivalent yields. To compute a yield, we need a framework we don't have yet: **ENERGY**. Specifically, the asteroid's KINETIC ENERGY at impact, converted into the same units the public uses for nuclear weapons and historical impacts.\n\nUnit 4 builds that framework. Day 19 is the payoff — we put a number on 2026-XJ and place it on the same scale as Hiroshima, Tunguska, Chelyabinsk, and Chicxulub.\n\nAnd there's a parallel question we owe ourselves: could 2026-XJ have ESCAPED — slipped past Earth and out of the system — if it had been moving faster, or if we'd pushed it sooner? That's escape velocity. The same energy framework answers both questions.\n\n*This is fiction. The physics — and the equations — are real.*"
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## Damage isn't just force\n\nUnit 3 ended with a number: the average force of a 2026-XJ impact is around 10¹⁴ N. Impressive — but it doesn't answer the question anyone actually asks: *how bad?* Crater size, fire radius, tsunami height — none of those come from force alone.\n\nToday's demo asks a simpler version of the same question. Three drops onto the floor:\n\n- **A** — a tennis ball from **waist** height\n- **B** — the *same* tennis ball from **head** height\n- **C** — a **baseball** from head height\n\nRank \"how hard did the floor get hit\" 1-2-3. A vs. B: same mass, more **height** (so more speed at the floor). B vs. C: same height, more **mass**. Two things matter for damage — and by the end of the unit you'll see that one of them matters *more* than the other, because it comes in **squared**."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — the drop demo",
      "markdown": "We dropped a tennis ball from waist height, the same tennis ball from head height, and a baseball from head height, and ranked how hard the floor got hit. At home, run the freefall simulation below: drop from different heights and watch how the impact speed grows with height — that speed is what carries the damage."
    },
    {
      "id": "b6",
      "type": "sim_embed",
      "simulationSlug": "freefall-cliff"
    },
    {
      "id": "b7",
      "type": "observation",
      "capture": true,
      "patternPrompt": "Watch the drop demo: tennis ball from waist, tennis ball from head, baseball from head. Rank \"how hard did the floor get hit\" 1-2-3. What did you NOTICE?",
      "interpretPrompt": "What do you WONDER?",
      "frame": "I notice ___. I wonder ___."
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Rank the three drops 1-2-3. What stays the same A vs. B? What changes? Same question for B vs. C. What TWO things matter for damage?",
      "prompts": [
        "Three quick panels: A (tennis, waist), B (tennis, head), C (baseball, head).",
        "A vs. B: what stayed the same, what changed?",
        "Name the TWO things that matter for damage."
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "MY GUESS — does damage grow like m·v, or faster? Commit to a guess before the spoiler below.",
      "frame": "I think damage grows like ___, because ___."
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Spoiler",
      "markdown": "The answer is **KINETIC ENERGY = ½ · m · v²** — and that SQUARED v is the load-bearing feature of the entire unit. We don't formalize it today; we feel it."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "If you DOUBLE a moving car's SPEED, does the damage in a crash double, or more than double? Why might that be? (One sentence, your best guess.)",
      "frame": "I think the damage ___, because ___."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.anchor-damage-energy"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 2 — Work: W = F·d', 'u4-d02', 'Unit 4: Energy & Work', 2, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write W = F·d, give units (Joules = N·m), compute work in 1D, and identify cases where work is ZERO even though a force is applied.",
      "targetId": "u4.k1-work"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Earth's gravity does WORK on 2026-XJ as it falls. That work is what increases the asteroid's energy.",
      "connection": "Work is the bridge between FORCE (Unit 1, Unit 3) and ENERGY (today on). It's how energy MOVES from one object to another."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Work: the bridge from force to energy\n\n**W = F·d** — work is energy transferred to (or from) an object by a force applied **along its motion**. Units: **Joules**, where 1 J = 1 N·m.\n\nPush a 50-N box 4 m → W = 200 J transferred into the box. Lift a 20-N book 1.5 m → W = 30 J transferred into the book (against gravity).\n\nThe catch: work needs **both** a force **and** motion in the direction of that force. Three famous zero-work cases:\n\n| Case | Why W = 0 |\n|---|---|\n| Push hard on a wall; it doesn't move | d = 0 |\n| Carry a book level across the room | force (up) ⊥ motion (sideways) |\n| Satellite in circular orbit | gravity ⊥ velocity, always |"
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Work (W)",
          "definition": "Energy transferred to (or from) an object via a force applied along its motion. W = F·d. Pushing a 50-N box 4 m → W = 200 J. Lifting a 20-N book 1.5 m → W = 30 J.",
          "cognate": "Sp. trabajo · Pt. trabalho · HC travay"
        },
        {
          "term": "Joule (J)",
          "definition": "The unit of work and energy. 1 Joule = 1 Newton · 1 meter. Lifting an apple (~1 N) up 1 m takes about 1 J of work. A Joule is small: a snack bar has ~10⁶ J; the asteroid's KE is ~10¹⁷ J — you'll see scientific notation a lot this unit.",
          "cognate": "Sp. julio · Pt. joule · HC joul"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Work is NOT the same as effort",
      "markdown": "If you push a wall and it doesn't move, you've done ZERO work — even though you got tired. (Your body did work internally, but not on the wall.)"
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "You push a 50-N box 4 m across the floor with a constant horizontal force. How much work do you do?",
      "given": "F = 50 N (along motion) · d = 4 m",
      "equation": "W = F·d",
      "work": "W = 50 · 4\nW = 200 J",
      "answer": "200 J of work done on the box."
    },
    {
      "id": "b7",
      "type": "gewa",
      "capture": true,
      "prompt": "You lift a 20-N book straight up 1.5 m at constant speed. How much work do you do AGAINST gravity?",
      "givenHint": "F = 20 N (the book's weight, lifted along the motion) · d = 1.5 m",
      "equationHint": "Same recipe as the box — force along the motion times distance.",
      "equationIds": [
        "work"
      ]
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "THREE ZERO-WORK CASES — for each case, write W and explain in ONE phrase why it's zero. (a) You push hard on a wall; the wall doesn't move. (b) You carry a 20-N book level across a 5-m room. (c) A satellite in CIRCULAR orbit moves around Earth.",
      "givenHint": "For each case ask: is there a d? Is the force ALONG the motion?",
      "equationHint": "W = F·d — lose the d, or lose the 'along the motion', and W = 0.",
      "equationIds": [
        "work"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "warning",
      "title": "Both ingredients, or zero",
      "markdown": "Work needs BOTH a force AND motion in the direction of that force. Lose either one → W = 0."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "You lift a 20-N book 1.5 m, then walk 3 m holding the book at that height. How much work did you do TOTAL on the book? Then complete the frame about the level carry.",
      "frame": "Carrying a book level across the room does NO WORK on the book because the force is ___ and the motion is ___ — and the angle between them is ___°."
    },
    {
      "id": "rd-ch09-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **9.1** (work as force × distance, when work is done, the joule). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch09-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 9,
      "title": "Energy — read & practice",
      "sectionIds": [
        "9.1"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k1-work"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 3 — Work at an Angle + Negative Work', 'u4-d03', 'Unit 4: Energy & Work', 3, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute W = F·d·cos θ for an angled force, and I can assign the correct SIGN of work for forces that aid or oppose motion.",
      "targetId": "u4.r1-work-angle"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "If 2026-XJ enters our atmosphere, air drag does NEGATIVE work on it — taking energy AWAY.",
      "connection": "That's why meteors GLOW. Their KE is converting to heat and light because atmospheric friction did massive negative work."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Work at an angle — and work with a sign\n\nYesterday's W = F·d assumed the force points exactly along the motion. Usually it doesn't. The fix:\n\n**W = F · d · cos θ** — where θ is the angle between the force and the motion. Only the **component of F along the motion** does work.\n\nThe cos θ does three jobs at once:\n\n| θ | cos θ | Meaning |\n|---|---|---|\n| 0° | 1 | force fully helps → full positive work |\n| 90° | 0 | force ⊥ motion → ZERO work |\n| 180° | −1 | force opposes motion → NEGATIVE work |\n\nNegative work is real work: it **removes** energy from the object. Friction always does negative work on a sliding object — that's where the object's energy of motion goes."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Work at an angle",
          "definition": "When the force F makes an angle θ with the direction of motion d, only the COMPONENT of F along d does work: W = F · d · cos θ. Pulling a suitcase with a 100-N handle force at 30° above horizontal over 10 m: W = 100·10·cos30° ≈ 866 J. At θ = 90°, cos θ = 0 and W = 0 — even though there's a big force.",
          "cognate": "Sp. trabajo con ángulo · Pt. trabalho com ângulo · HC travay ak ang"
        },
        {
          "term": "Negative work",
          "definition": "Work done by a force that opposes the motion (θ between 90° and 180°). cos θ is negative, so W is negative — energy is taken AWAY from the object. Friction always does negative work on a sliding object: cos180° = −1.",
          "cognate": "Sp. trabajo negativo · Pt. trabalho negativo · HC travay negatif"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "\"Negative work\" doesn't mean \"no work\"",
      "markdown": "It means energy is being REMOVED from the object, not added. Zero work and negative work are different things."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "You pull a 100-N handle force on a suitcase 10 m at 30° above the horizontal. Friction opposes the motion with 20 N. Find: (a) work done by you, (b) work done by friction, (c) NET work.",
      "given": "F_you = 100 N, θ_you = 30° · F_fric = 20 N, θ_fric = 180° · d = 10 m",
      "equation": "W = F · d · cos θ (for each force)",
      "work": "W_you = 100·10·cos30° = 1000·0.866 = 866 J\nW_fric = 20·10·cos180° = 200·(−1) = −200 J\nW_net = 866 + (−200) = 666 J",
      "answer": "You did 866 J of POSITIVE work. Friction did 200 J of NEGATIVE work. Net: 666 J."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "warning",
      "title": "Write the angle FIRST",
      "markdown": "ALWAYS write the angle BEFORE you compute. θ is between F and d, NOT between F and the floor. cos180° = −1, cos90° = 0, cos0° = 1."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "You push a 30-N box 4 m across the floor at constant speed against 12 N of friction. (a) What work did YOU do? (b) What work did friction do? (c) What's the NET work?",
      "givenHint": "F_you = 30 N at θ = 0° · F_fric = 12 N at θ = 180° · d = 4 m",
      "equationHint": "Compute each force's work with its own angle, then add them (signs and all).",
      "equationOptions": [
        "W = F · d · cos θ",
        "W = F · d",
        "KE = ½ · m · v²",
        "F = m · a"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "You push a 30-N box 4 m at constant speed against 12 N of friction. What's the NET work? Then complete the frame about friction's sign.",
      "frame": "Friction does NEGATIVE work because the friction force points ___ to the motion, so cos θ = ___, so W comes out ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r1-work-angle"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 4 — Kinetic Energy: KE = ½mv²', 'u4-d04', 'Unit 4: Energy & Work', 4, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write KE = ½mv², compute KE for moving objects across mass and speed scales, and state the work-energy theorem W_net = ΔKE.",
      "targetId": "u4.k2-kinetic-energy"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "The DAMAGE number for asteroids is their KINETIC ENERGY at impact, not their momentum.",
      "connection": "Today's equation is the heart of Unit 4. By Day 19, we plug 2026-XJ into it and get its yield in tons of TNT."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The squared-v reveal\n\nDay 1 you guessed it. Here it is:\n\n**KE = ½ · m · v²** — the energy of motion. Units: Joules (kg·m²/s²). Always positive, regardless of direction.\n\nThe load-bearing feature is the **squared v**. KE is NOT proportional to v — it's proportional to v². Doubling speed **quadruples** KE. Tripling speed gives **nine times** the KE.\n\nAnd here's the link back to yesterday: **W_net = ΔKE = KE_f − KE_i**. The NET work done on an object equals the change in its kinetic energy. Push energy in (positive net work) → it speeds up. Drag energy out (negative net work) → it slows down. This is the **work-energy theorem**, and it's the engine of the whole unit."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Kinetic energy (KE)",
          "definition": "The energy of motion. KE = ½ · m · v². Units: Joules (kg·m²/s²). Always positive, regardless of direction. A 1500-kg car at 30 m/s has KE = ½·1500·900 = 675,000 J. At 60 m/s: KE = 2,700,000 J — FOUR times as much.",
          "cognate": "Sp. energía cinética · Pt. energia cinética · HC enèji sinetik"
        },
        {
          "term": "Work-energy theorem",
          "definition": "The NET work done on an object equals the change in its KE: W_net = ΔKE = KE_f − KE_i. A 1-kg cart at rest gets 50 J of net work → KE_f = 50 J → v_f = √(2·50/1) = 10 m/s. It's the NET work that matters — the sum of ALL forces' contributions, not just one.",
          "cognate": "Sp. teorema del trabajo-energía · Pt. teorema do trabalho-energia"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "The squared v matters",
      "markdown": "KE is NOT proportional to v — it's proportional to v². Doubling speed quadruples KE."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "A 1500-kg car moves at (a) 30 m/s, (b) 60 m/s. Find the KE in each case.",
      "given": "m = 1500 kg · v_a = 30 m/s · v_b = 60 m/s",
      "equation": "KE = ½ · m · v²",
      "work": "KE_a = ½ · 1500 · 30² = ½ · 1500 · 900 = 675,000 J\nKE_b = ½ · 1500 · 60² = ½ · 1500 · 3600 = 2,700,000 J\nKE_b / KE_a = 4 (matches: v doubled → KE × 4)",
      "answer": "At 30 m/s: 6.75 × 10⁵ J. At 60 m/s: 2.7 × 10⁶ J — FOUR times the energy."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "note",
      "title": "Why highway speeds are different",
      "markdown": "Highway speeds aren't twice as dangerous as 30 mph. They're FOUR TIMES. This is the squared v at work — and it's why 2026-XJ matters."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "KE OF 2026-XJ — 2026-XJ has m = 1 × 10⁹ kg and impact speed v = 3 × 10⁴ m/s. Find its KE at impact.",
      "givenHint": "m = 1 × 10⁹ kg · v = 3 × 10⁴ m/s. Square the speed FIRST, then multiply.",
      "equationHint": "Same equation as the car — just bigger numbers. Keep the powers of 10 organized.",
      "equationIds": [
        "kinetic-energy"
      ]
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "WORK-ENERGY THEOREM — A 2-kg ball moves at 3 m/s. A net 27 J of work is done on it. What's its final speed? (Use W_net = ΔKE.)",
      "givenHint": "m = 2 kg · v_i = 3 m/s → KE_i = 9 J · W_net = 27 J → KE_f = ?",
      "equationHint": "W_net = KE_f − KE_i. Find KE_f first, then solve ½mv_f² = KE_f for v_f.",
      "equationOptions": [
        "W_net = ΔKE = KE_f − KE_i",
        "KE = ½ · m · v²",
        "W = F · d · cos θ",
        "p = m · v"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 2-kg ball at 3 m/s has 9 J of KE. If a net 27 J of work is done on it, what's its final speed? Then complete the frame.",
      "frame": "Doubling a car's speed ___ the kinetic energy, because KE depends on v ___ (not just v)."
    },
    {
      "id": "rd-ch09-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **9.3** and **9.5–9.6** (mechanical energy, kinetic energy, the work-energy theorem). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch09-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 9,
      "title": "Energy — read & practice",
      "sectionIds": [
        "9.3",
        "9.5",
        "9.6"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k2-kinetic-energy"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 5 — Work-Energy Theorem: Worked Examples', 'u4-d05', 'Unit 4: Energy & Work', 5, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply W_net = ΔKE as a shortcut to find stopping distance, final speed, or net force without solving for time.",
      "targetId": "u4.s1-work-energy-theorem"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Gravity does work on the falling asteroid. That work IS its impact KE.",
      "connection": "The work-energy theorem lets us skip the time-history of the fall and go straight from forces to impact speed. That's tomorrow's lab."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The shortcut that skips time\n\nIn Unit 1 you'd solve a stopping problem with kinematics: find a, find t, find d. The work-energy theorem skips all of that.\n\nWhen forces are CONSTANT:\n\n**W_net = F_net · d · cos θ = ½m·v_f² − ½m·v_i²**\n\nThree knowns → one unknown. No time variable anywhere. Today is a reps day — two worked examples, then yours:\n\n1. **Stopping distance**: known force, known speeds → solve for d.\n2. **Speed at the bottom**: known gravity work → solve for v_f.\n\nThe decision rule: if you KNOW the forces and the DISTANCES — but not the time — the work-energy theorem is the fast lane."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "W_net = ΔKE (shortcut form)",
          "definition": "When forces are CONSTANT, W_net = F_net · d · cosθ = ½m·v_f² − ½m·v_i². Three knowns → one unknown. A 1500-kg car at 30 m/s, brakes apply 9000 N. Stopping distance? W_net = −F·d = 0 − ½mv² → d = ½·1500·900/9000 = 75 m.",
          "cognate": "Sp. teorema trabajo-energía aplicado · Pt. teorema aplicado"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "W_net is the work of the NET force",
      "markdown": "Not any single force. Add up ALL the works (with signs) first — then set the total equal to ΔKE."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "STOPPING DISTANCE OF A CAR — A 1500-kg car at 30 m/s brakes to rest. The brakes apply 9000 N (constant). How far does the car travel before stopping?",
      "given": "m = 1500 kg · v_i = 30 m/s · v_f = 0 · F_brake = 9000 N (opposes motion)",
      "equation": "W_net = ΔKE → −F·d = 0 − ½m·v_i²",
      "work": "−9000 · d = − ½ · 1500 · 30²\n−9000 · d = − 675,000\nd = 675,000 / 9000 = 75 m",
      "answer": "The car travels 75 m before stopping."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "ROLLER-COASTER: FROM GRAVITY WORK TO BOTTOM SPEED — A 100-kg coaster cart starts at rest at the top of a 10-m incline. Friction-free. What's its speed at the bottom?",
      "given": "m = 100 kg · v_i = 0 · h = 10 m · g = 9.81 m/s²",
      "equation": "W_grav = m·g·h   AND   W_net = ΔKE = ½m·v_f²",
      "work": "W_grav = 100 · 9.81 · 10 = 9810 J\n9810 = ½ · 100 · v_f²\nv_f² = 196.2\nv_f ≈ 14 m/s",
      "answer": "≈ 14 m/s at the bottom. Faster than kinematics — no time needed."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "When to take the shortcut",
      "markdown": "If you KNOW the forces and DISTANCES, skip kinematics. Compute the work, set it equal to ΔKE, solve."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "SPRING-LAUNCHED BALL — A 0.5-kg ball is fired from a spring that does 8 J of work on it. The ball starts at rest. What's its speed leaving the spring?",
      "givenHint": "m = 0.5 kg · v_i = 0 (so KE_i = 0) · W_net = 8 J",
      "equationHint": "All 8 J becomes KE_f. Set ½m·v_f² = 8 and solve for v_f.",
      "equationOptions": [
        "W_net = ΔKE = ½m·v_f² − ½m·v_i²",
        "KE = ½ · m · v²",
        "W = F · d",
        "p = m · v"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 0.5-kg ball is fired from a spring that does 8 J of work on it. The ball starts at rest. What's its speed? Then complete the frame.",
      "frame": "The work-energy theorem is faster than kinematics when I already know the ___ and the ___, but not the ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.s1-work-energy-theorem"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 6 — Vernier KE Lab (Investigation 4.1)', 'u4-d06', 'Unit 4: Energy & Work', 6, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can run a Vernier dynamics-cart trial with a hanging-mass pull, compute predicted v from W_net = ΔKE, measure v with a photogate, and report the % difference with one credible source of error.",
      "targetId": "u4.s2-vernier-ke-lab"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We've stated W_net = ΔKE. Today we measure it.",
      "connection": "If our cart confirms the theorem, we can trust it for asteroid energy on Day 19."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 4.1 — Confirm W_net = ΔKE",
      "markdown": "**Driving question:** Does the predicted final speed of a cart (from W_net = ΔKE) match the measured speed from the photogate? Across 3 trials with different hanging masses?\n\n**Equipment:** Vernier dynamics track (1 per pair) + 1 cart · pulley clamped at end of track + string · hanging masses (50 g, 100 g, 150 g) · 1 photogate + LabQuest + Logger Pro or Graphical Analysis · balance to weigh cart (record m_cart) and meter stick for d.\n\n**How this lab serves the year's question:** if the theorem holds in our carts, the Day 19 yield calculation is on solid ground."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "Level the track. Weigh the cart and record m_cart.",
        "Set up pulley + string. Hang first mass m_h. Compute F_pull = m_h · g.",
        "Mark the cart's starting position. Measure d to the photogate.",
        "Release. Photogate reads v_measured.",
        "Compute W_net = F_pull · d, predict v from W_net = ½m_cart·v². Compare to measured.",
        "Repeat with the other two hanging masses. Three trials total. Compute % difference."
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "Hanging masses below knee level. Catch them at end of run. Photogates clamped firmly."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Not in class today?",
      "markdown": "Run the Atwood-machine simulation below — it's the same physics: a hanging mass pulls a load through a distance. Pick a hanging mass, read off the final speed, and compare it to what W_net = ΔKE predicts. Fill the data table from sim values."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "atwood-machine"
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch your setup: track, cart, pulley, string, hanging mass, photogate. Record m_cart and m_h on the diagram. Fill v_predicted and v_measured as you go.",
      "prompts": [
        "Label the cart with m_cart and the hanger with m_h.",
        "Mark where the photogate reads velocity.",
        "Show the pull direction of the string."
      ]
    },
    {
      "id": "b9",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "m_h (kg)",
        "F_pull (N)",
        "d (m)",
        "W_net (J)",
        "v_pred (m/s)",
        "v_meas (m/s)",
        "% diff"
      ],
      "rows": 3,
      "plot": false,
      "patternPrompt": "Three trials with different hanging masses. How close are your predicted and measured speeds?"
    },
    {
      "id": "b10",
      "type": "observation",
      "capture": true,
      "patternPrompt": "Did v_predicted match v_measured? Across all 3 trials, within what %?",
      "interpretPrompt": "If there's a gap, what physical thing did NEGATIVE work that we didn't count? Is the gap bigger for smaller or larger hanging masses? And the asteroid connection: how does this serve the year's question?",
      "frame": "My v values matched within ___ %. The most likely source of error was ___, because it would ___ the cart's KE."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write a one-sentence CLAIM about what the lab showed, then one sentence of EVIDENCE (your numbers), then one sentence of REASONING (why the % difference is small).",
      "frame": "CLAIM: ___. EVIDENCE: ___. REASONING: ___."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.s2-vernier-ke-lab"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 7 — Gravitational PE Near Earth: U = mgh', 'u4-d07', 'Unit 4: Energy & Work', 7, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write U = mgh, compute PE relative to a chosen reference, and explain that only DIFFERENCES in PE are physically meaningful.",
      "targetId": "u4.k3-gpe-mgh"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ has gravitational PE relative to Earth. As it falls, that PE converts to KE.",
      "connection": "Near the surface, U = mgh is the cleanest formula. By Day 9, we'll meet its more general cousin for asteroid distances."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Stored energy of height\n\n**U = m · g · h** — the energy stored by lifting a mass m against gravity to a height h above a **reference level**.\n\nIt's literally the work you did lifting it: weight (mg) times distance (h). Let it fall, and gravity pays that energy back as KE.\n\nThe subtle part is the **reference**. A 2-kg book on a 1-m desk has U ≈ 20 J *relative to the floor* — and U = 0 *relative to the desktop*. Both answers are correct. PE has no absolute zero; **only DIFFERENCES in PE are physically meaningful**. You pick the zero level for convenience, you state it, and you stick with it for the whole problem."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Gravitational PE (near surface)",
          "definition": "The energy stored by lifting a mass m against gravity to height h above a reference level. U = m · g · h. A 2-kg book on a 1-m desk: U = 2·9.81·1 ≈ 20 J (above floor). Same book on the floor: U = 0 (relative to floor). PE depends on the CHOICE of zero height — two answers can both be \"right\" if they use different references.",
          "cognate": "Sp. energía potencial gravitatoria · Pt. energia potencial gravitacional · HC enèji potansyèl gravite"
        },
        {
          "term": "Reference height",
          "definition": "The chosen zero level for PE. Usually the floor, ground, or some convenient surface. A book on a desk has PE = 20 J relative to floor, but PE = 0 relative to the desktop. Only DIFFERENCES in PE matter physically — the choice of zero is for our convenience.",
          "cognate": "Sp. altura de referencia · Pt. altura de referência"
        }
      ]
    },
    {
      "id": "b5",
      "type": "worked_example",
      "prompt": "BOOK ON A DESK — A 2-kg book sits on a desk 1.0 m above the floor. Find its PE (a) relative to the floor, (b) relative to the desktop.",
      "given": "m = 2 kg · g = 9.81 m/s² · h_floor = 1.0 m · h_desk = 0",
      "equation": "U = m · g · h",
      "work": "U_floor = 2 · 9.81 · 1.0 = 19.6 J\nU_desk = 2 · 9.81 · 0 = 0 J",
      "answer": "Both answers are correct — they just use different zero levels."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "warning",
      "title": "Always STATE your reference",
      "markdown": "\"PE = 20 J\" is meaningless without saying \"above what?\""
    },
    {
      "id": "b7",
      "type": "gewa",
      "capture": true,
      "prompt": "PERSON ON TOP OF A BUILDING — A 70-kg person stands at the top of a 100-m building, relative to the street. Find their PE.",
      "givenHint": "m = 70 kg · g = 9.81 m/s² · h = 100 m (reference: the street)",
      "equationHint": "Mass times g times height above the stated reference.",
      "equationIds": [
        "potential-energy"
      ]
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "CART ON A RAMP — A 50-kg cart sits at the top of an 8-m ramp. Find its PE relative to the bottom of the ramp.",
      "givenHint": "m = 50 kg · g = 9.81 m/s² · h = 8 m (reference: bottom of the ramp)",
      "equationHint": "Same recipe — and notice the reference is part of the answer.",
      "equationIds": [
        "potential-energy"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 2-kg book on a desk 1.0 m above the floor. PE relative to floor? PE relative to desktop? Then complete the frame.",
      "frame": "The book on the desk has PE = 20 J above ___, but PE = 0 above ___. Both are correct — physics cares about ___."
    },
    {
      "id": "rd-ch09-c",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **9.4** (elastic, chemical, and gravitational potential energy; PE = mgh). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch09-c",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 9,
      "title": "Energy — read & practice",
      "sectionIds": [
        "9.4"
      ]
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k3-gpe-mgh"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 8 — When mgh Fails: g Changes with Altitude', 'u4-d08', 'Unit 4: Energy & Work', 8, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can explain why U = mgh assumes constant g and breaks at altitudes comparable to Earth's radius, and I can preview U = −GMm/r as the fix.",
      "targetId": "u4.r2-mgh-limits"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ is currently 40,000–100,000 km out. At that distance, g is NOT 9.81 m/s².",
      "connection": "If we used mgh for the asteroid's PE, we'd get a hilariously wrong answer. Today we see WHY and preview the fix."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The hidden assumption in mgh\n\nU = mgh quietly assumes that **g is constant** all the way up. Near the surface, that's fine — lift a book a meter and g barely changes.\n\nBut from Unit 2 you know where g actually comes from: **g(r) = G·M / r²**. At Earth's surface (r ≈ 6,371 km), g ≈ 9.81 m/s². Move out to 100,000 km — asteroid territory — and g ≈ 0.04 m/s². Out at the Moon (r ≈ 384,000 km), Earth's pull is about 0.003 m/s². Almost nothing.\n\nSo mgh works when h is small compared to Earth's radius, and **fails by orders of magnitude** when h is comparable to (or bigger than) Earth's radius. Today we put a number on exactly how wrong it gets — then preview the formula that fixes it."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "g varies with r",
          "definition": "From Unit 2: g(r) = G·M / r². At Earth's surface (r ≈ 6,371 km) g ≈ 9.81. At 100,000 km out, g ≈ 0.04. The Moon (r ≈ 384,000 km from Earth) feels g_Earth ≈ 0.003 m/s² — almost nothing. On Earth's surface, g feels constant only because we don't move far enough vertically; across asteroid distances, g changes by orders of magnitude.",
          "cognate": "Sp. g varía · Pt. g varia"
        }
      ]
    },
    {
      "id": "b5",
      "type": "graph",
      "title": "g falls off as 1/r² — the assumption behind mgh breaks",
      "xLabel": "Distance from Earth's center r (thousands of km)",
      "yLabel": "g (m/s²)",
      "genPrompt": "g(r) = GM/r² from Earth's surface (6,371 km, g = 9.81) out to 100,000 km (g ≈ 0.04), showing the steep 1/r² drop-off across asteroid distances.",
      "series": [
        {
          "label": "g(r) = G·M / r²",
          "points": [
            [
              6.4,
              9.81
            ],
            [
              10,
              3.98
            ],
            [
              15,
              1.77
            ],
            [
              20,
              1
            ],
            [
              30,
              0.44
            ],
            [
              40,
              0.25
            ],
            [
              60,
              0.11
            ],
            [
              80,
              0.06
            ],
            [
              100,
              0.04
            ]
          ]
        }
      ]
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "On the curve, mark where g = 9.8 (surface). Mark where g ≈ 0.04 (asteroid distance). What's the ratio? What does that mean for mgh?",
      "prompts": [
        "Mark the surface point (6,371 km, 9.81 m/s²).",
        "Mark the asteroid-distance point (~100,000 km, ~0.04 m/s²).",
        "Write the ratio between the two g values — and what it does to mgh."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "WORKED PROBE — WHAT MGH WOULD SAY AT ALTITUDE: Using U = mgh with g = 9.81 m/s² (the surface value), find the PE of a 1000-kg object at h = 100,000 km altitude. Then compute g at that altitude using g(r) = GM/r² with r = 6.4×10⁶ + 1×10⁸ m. Comment on the error.",
      "given": "m = 1000 kg · h = 1 × 10⁸ m · g_surface = 9.81 m/s² · G = 6.67×10⁻¹¹ · M_Earth = 6 × 10²⁴ kg",
      "equation": "U_mgh = m · g · h   AND   g(r) = G·M / r²",
      "work": "U_mgh = 1000 · 9.81 · 10⁸ = 9.81 × 10¹¹ J\nr ≈ 1.06 × 10⁸ m\ng(r) = (6.67e-11)(6e24)/(1.06e8)² ≈ 0.036 m/s²\nSo mgh OVERESTIMATES by a factor of 9.81 / 0.036 ≈ 270×",
      "answer": "The mgh number is 270 times too big. We need a formula that uses g(r), not g_surface."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "THE FIX — coming Day 9: U = − G·M·m / r",
      "markdown": "PE = 0 at INFINITY. PE is NEGATIVE everywhere closer (because gravity does positive work pulling things in — they LOSE potential as they fall).\n\nThe negative sign is correct and important: closer = MORE negative PE; farther = closer to zero. This lets us cleanly write KE_at_infinity = 0 = KE_surface + U_surface, which gives escape velocity."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "At Earth's surface, what's the PE of a 1-kg object using U = −GMm/r? Compare to U = mgh with h = 0. (Different — that's OK. Why?) Then complete the frame.",
      "frame": "U = mgh fails when h is comparable to ___, because g is not ___. We need U = ___ to be accurate across altitudes."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r2-mgh-limits"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 9 — Universal PE: U = −GMm/r', 'u4-d09', 'Unit 4: Energy & Work', 9, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply U = −GMm/r to compute the PE of an asteroid at different distances and compute ΔU as it falls (= KE gained).",
      "targetId": "u4.k4-universal-pe"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's PE depends on its distance from Earth. As it gets closer, U becomes MORE NEGATIVE — meaning the asteroid is GAINING kinetic energy.",
      "connection": "ΔU as the asteroid falls is the KE it brings to impact. Day 19 puts a number on this."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The universal formula\n\n**U = − G·M·m / r** — the gravitational PE between two masses M and m separated by distance r (center to center).\n\nThe conventions:\n\n- **PE = 0 at infinity** — the natural zero, since gravity fades to nothing out there.\n- **PE is negative everywhere closer** — the object sits in a gravitational *well*. You'd have to do positive work to lift it out to infinity.\n- **Falling in: U gets MORE negative** — and since total energy is conserved, KE goes UP by exactly the amount U went down. ΔU is the KE the fall delivers.\n\nNo constant-g assumption anywhere. This formula is honest at any altitude — desk height or Moon distance — which is why it's the one the asteroid math needs."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "U = − G·M·m / r",
          "definition": "The universal gravitational PE between two masses M and m separated by distance r. PE = 0 at infinity; negative everywhere closer. A 1-kg object at Earth's surface (r = 6.37×10⁶ m): U = −(6.67e-11)(6e24)(1)/(6.37e6) ≈ −6.28 × 10⁷ J.",
          "cognate": "Sp. energía potencial gravitacional universal · Pt. energia potencial gravitacional universal"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Negative U doesn't mean \"missing energy\"",
      "markdown": "It means the object is in a gravitational well — you'd have to do work to lift it out to infinity."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "PE OF AN ASTEROID AT THREE DISTANCES — A 1000-kg test mass at (a) 384,000 km from Earth's center, (b) Earth's surface (6,371 km), (c) at infinity. Find U at each, then ΔU from (a) to (b).",
      "given": "m = 1000 kg · G = 6.67×10⁻¹¹ · M = 5.97 × 10²⁴ kg · r_a = 3.84 × 10⁸ m · r_b = 6.37 × 10⁶ m · r_c = ∞",
      "equation": "U = − G·M·m / r",
      "work": "U_a = − (6.67e-11)(5.97e24)(1000)/(3.84e8) ≈ −1.04 × 10⁹ J\nU_b = − (6.67e-11)(5.97e24)(1000)/(6.37e6) ≈ −6.25 × 10¹⁰ J\nU_c = 0 J\nΔU (a → b) = U_b − U_a ≈ −6.15 × 10¹⁰ J",
      "answer": "The 1000-kg mass GAINS 6.15 × 10¹⁰ J of KE falling from Moon's distance to surface."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "note",
      "title": "Two derivations, one number",
      "markdown": "A 500-kg meteorite from infinity hits Earth at v ≈ 11.2 km/s — Earth's escape velocity. Same number, two derivations. Day 20 confirms."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "KE GAINED FROM INFINITY — A 500-kg meteorite falls from infinity to Earth's surface (no air friction). How much KE does it gain?",
      "givenHint": "m = 500 kg · r_start = ∞ (so U_start = 0) · r_end = 6.37 × 10⁶ m · G = 6.67×10⁻¹¹ · M = 5.97 × 10²⁴ kg",
      "equationHint": "KE gained = −ΔU = U_start − U_end = 0 − (−GMm/r_surface).",
      "equationOptions": [
        "U = − G·M·m / r",
        "U = m·g·h",
        "KE = ½ · m · v²",
        "F = G·M·m / r²"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 500-kg object falls from infinity to Earth's surface (no air drag). What KE does it gain? Then complete the frame.",
      "frame": "An asteroid GAINS kinetic energy as it falls because its U becomes ___ (more negative). The total ME stays constant, so ___ goes up by the same amount."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k4-universal-pe"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 10 — Conservation: KE + PE = Constant', 'u4-d10', 'Unit 4: Energy & Work', 10, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can state that KE + PE = constant when only conservative forces act, and apply it to a simple drop.",
      "targetId": "u4.k5-conservation"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid in free fall (no air) obeys ME conservation perfectly.",
      "connection": "This is the big rule of Phase 4. Days 11-13 are all special cases. Day 19 uses it to convert PE to impact KE."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The big rule of Phase 4\n\n**KE + PE = constant** — when only conservative forces (gravity, springs) act, the total **mechanical energy** ME = KE + PE never changes. Energy just trades between the two accounts.\n\nA ball dropped from 5 m:\n\n| Position | KE | PE | ME |\n|---|---|---|---|\n| Top (at rest) | 0 | mg·5 | mg·5 |\n| Halfway | ½mv² | mg·2.5 | mg·5 |\n| Bottom | ½mv² | 0 | mg·5 |\n\nSet ME_top = ME_bottom: **mgh = ½mv²**. The mass cancels, and v = √(2gh) pops out — no forces, no time, no kinematics.\n\nThe condition matters: gravity and springs are **conservative** (their work depends only on start and end positions, not the path). Friction is NOT — when friction acts, ME leaks away to thermal energy and this shortcut needs a correction."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Mechanical energy (ME)",
          "definition": "The sum of KE and PE: ME = KE + PE. When only conservative forces act (gravity, springs), ME stays constant. A ball dropped from 5 m: at top, ME = 0 + mg·5; at bottom, ME = ½mv² + 0. Setting them equal gives v.",
          "cognate": "Sp. energía mecánica · Pt. energia mecânica · HC enèji mekanik"
        },
        {
          "term": "Conservative force",
          "definition": "A force whose work depends only on START and END positions, not the path. Gravity, springs. (Friction is NOT.) Walking up a ramp or taking a vertical lift to the same height: gravity does the SAME work. \"Conservative\" is a math word here — it doesn't mean \"saves\" or \"preserves\"; it means the work is path-independent.",
          "cognate": "Sp. fuerza conservativa · Pt. força conservativa"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Friction is NOT conservative",
      "markdown": "When friction acts, ME is NOT conserved — it leaks to thermal energy. Check for friction BEFORE you write KE + PE = const."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "A drop, in energy language",
      "caption": "Total mechanical energy stays the same at every level — it just moves from the PE account to the KE account as the ball falls.",
      "links": [
        {
          "label": "PE at the top",
          "sublabel": "m·g·h, at rest"
        },
        {
          "label": "PE + KE midway",
          "sublabel": "trading, same total"
        },
        {
          "label": "KE at the bottom",
          "sublabel": "½·m·v², h = 0"
        }
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "BALL DROPPED FROM 5 M — A 0.2-kg ball is dropped (from rest) from 5 m above the floor. What's its speed at the floor?",
      "given": "m = 0.2 kg · v_top = 0 · h = 5 m · g = 9.81",
      "equation": "KE_top + PE_top = KE_bot + PE_bot → 0 + m·g·h = ½·m·v² + 0",
      "work": "m·g·h = ½ · m · v²   (m cancels)\nv = √(2 · g · h) = √(2 · 9.81 · 5)\nv = √98.1 ≈ 9.9 m/s",
      "answer": "≈ 9.9 m/s at impact. Mass canceled — the answer only depends on h."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "warning",
      "title": "Check the condition first",
      "markdown": "ME conservation only works when ALL forces are conservative. If friction or air drag acts, you must include their work — which is NEGATIVE."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "DROP FROM 1.8 M — A 0.5-kg ball is dropped from 1.8 m (friction-free). Find its speed at impact.",
      "givenHint": "m = 0.5 kg · v_top = 0 · h = 1.8 m · g = 9.81 m/s²",
      "equationHint": "Set PE at the top equal to KE at the bottom. The mass will cancel.",
      "equationIds": [
        "potential-energy",
        "kinetic-energy"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 0.2-kg ball is dropped from 1.8 m. Speed at impact? Then complete the frame.",
      "frame": "The ball's KE at the bottom equals its ___ at the top, because total ___ is conserved when only gravity acts."
    },
    {
      "id": "rd-ch09-d",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **9.7** (the law of conservation of energy and energy transformations). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch09-d",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 9,
      "title": "Energy — read & practice",
      "sectionIds": [
        "9.7"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k5-conservation"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 11 — Rolling, Sliding, Swinging', 'u4-d11', 'Unit 4: Energy & Work', 11, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply KE + PE = const to pendulums, slides, roller coasters, and drops — and recognize that the technique is the same regardless of path shape.",
      "targetId": "u4.s3-conservation-solve"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Path SHAPE doesn't change the energy answer — only the heights.",
      "connection": "That's why we don't need to know the asteroid's exact trajectory. Just its starting and ending heights (effectively, its r values)."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## One technique, four shapes\n\nPendulum, slide, roller coaster, free drop — four different paths, ONE recipe:\n\n1. Find the **high-PE point** and the **low-PE point**.\n2. Set **ME_high = ME_low**: ½mv_high² + mgh_high = ½mv_low² + mgh_low.\n3. Solve for the unknown.\n\nThe mass usually cancels, and the path between the two points never enters the math. A swinging bob and a falling rock released from the same height arrive at the bottom with the **same speed** — gravity is conservative, so only the height difference Δh matters.\n\nToday is a station day: same equation at every station, different geometry."
    },
    {
      "id": "b4",
      "type": "worked_example",
      "prompt": "SLED DOWN A HILL — A 50-kg sled starts at rest at the top of a 12-m hill. Friction-free. Find the speed at the bottom.",
      "given": "m = 50 kg · v_top = 0 · h = 12 m · g = 9.81",
      "equation": "m·g·h = ½·m·v²   (m cancels)",
      "work": "9.81 · 12 = ½ · v²\nv² = 235.4\nv ≈ 15.3 m/s",
      "answer": "≈ 15.3 m/s — same number for any sled mass."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — station rotation: pendulum / coaster / slide / drop",
      "markdown": "We rotate through four stations. At each one: identify the HIGH-PE point and LOW-PE point, set ME_high = ME_low, solve for the unknown.\n\n- **Station 1 — PENDULUM:** released from h = 0.6 m above the bottom. Find v at the bottom.\n- **Station 2 — SLIDE:** ramp height 2.0 m, length 5 m, frictionless. Find v at the bottom.\n- **Station 3 — ROLLER COASTER:** starts from rest at h₁ = 30 m, then rides to the top of the next hill at h₂ = 18 m. Find v at the top of h₂.\n- **Station 4 — FREE FALL:** 10-kg rock dropped from 7 m. Find v at impact.\n\nNot in class? Solve all four with ME conservation, then check Station 4 in the freefall simulation below."
    },
    {
      "id": "b6",
      "type": "sim_embed",
      "simulationSlug": "freefall-cliff"
    },
    {
      "id": "b7",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Station",
        "Δh (m)",
        "v (m/s)"
      ],
      "rows": 4,
      "plot": false,
      "patternPrompt": "Fill in as you rotate: pendulum (Δh = 0.6), slide (Δh = 2.0), coaster (Δh = 30 − 18 = 12), free fall (Δh = 7). What do all four solutions have in common?"
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "The magic of conservative forces",
      "markdown": "Across all four: the answer depends ONLY on the HEIGHT difference. Path shape doesn't matter. That's the magic of conservative forces."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 0.3-kg pendulum bob is released from 0.6 m above its lowest point (friction-free). What's its speed at the bottom? Then complete the frame.",
      "frame": "Across all four stations, v at the bottom depended only on ___ — not on the ___. That's why we say gravity is ___."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.s3-conservation-solve"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 12 — Roller Coaster + Pendulum', 'u4-d12', 'Unit 4: Energy & Work', 12, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can solve a multi-hill roller-coaster problem using ME conservation and find a pendulum's speed at the bottom from its release angle.",
      "targetId": "u4.r3-coaster-pendulum"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ in an elliptical orbit IS a roller coaster — KE and PE trade off periodically. Faster at perihelion (low U), slower at aphelion (high U).",
      "connection": "Same equation, different scale. The bookkeeping is identical."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Hills and swings — same bookkeeping\n\nOn a frictionless coaster, **ME = KE + PE stays constant** at every point on the track. That gives a shortcut that skips kinematics entirely:\n\n**½v² + gh = constant** (the mass cancels — every cart, heavy or light, gets the same speeds)\n\nStarting from rest at height h₁, the speed at any other height h is:\n\n**v = √(2g·(h₁ − h))**\n\nOnly the DROP matters — not the shape of the track between.\n\nA pendulum is the same problem in disguise. The only new step is geometry: a bob on a string of length L released at angle θ from vertical starts at height\n\n**h = L(1 − cosθ)**\n\nabove its lowest point. From there it's the same bookkeeping: mgh = ½mv² at the bottom."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Pendulum height formula",
          "definition": "For a pendulum of length L released from angle θ, the bob's height above its lowest point is h = L − L·cosθ = L(1 − cosθ). A 1-m pendulum released at 60° above vertical: h = 1·(1 − cos60°) = 1·(1 − 0.5) = 0.5 m.",
          "cognate": "Sp. altura de péndulo · Pt. altura do pêndulo"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "The height is L(1 − cosθ), not L",
      "markdown": "Don't use the string length L as the height. The bob only rises h = L(1 − cosθ) above its lowest point — at 60°, that's exactly HALF the string length."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "THREE-HILL ROLLER COASTER. A coaster cart starts from rest at the top of hill 1 (h₁ = 30 m). Frictionless. Find its speed at the top of hill 2 (h₂ = 18 m) and hill 3 (h₃ = 22 m).",
      "given": "v₁ = 0 · h₁ = 30 m · h₂ = 18 m · h₃ = 22 m",
      "equation": "ME₁ = ME₂ = ME₃ → ½v² + gh = ½v₁² + gh₁ = gh₁",
      "work": "At hill 2: v₂² = 2g(h₁ − h₂) = 2·9.81·12 = 235.4\nv₂ ≈ 15.3 m/s\nAt hill 3: v₃² = 2g(h₁ − h₃) = 2·9.81·8 = 157\nv₃ ≈ 12.5 m/s",
      "answer": "v₂ ≈ 15.3 m/s, v₃ ≈ 12.5 m/s. Higher hill → slower cart."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "PENDULUM RELEASED AT 60°. A 1-kg pendulum bob on a 1-m string is released from θ = 60° above vertical. Find the bob's speed at the bottom of its swing.",
      "given": "m = 1 kg · L = 1 m · θ = 60° · friction-free",
      "equation": "h = L(1 − cosθ) AND mgh = ½mv²",
      "work": "h = 1·(1 − cos60°) = 1·(1 − 0.5) = 0.5 m\nv = √(2gh) = √(2·9.81·0.5) = √9.81\nv ≈ 3.13 m/s",
      "answer": "≈ 3.13 m/s at the bottom of the swing."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "Orbits are roller coasters",
      "markdown": "An asteroid in elliptical orbit: KE and PE trade. Faster near the Sun, slower far away. Same physics as a roller coaster — just on cosmic scale."
    },
    {
      "id": "b9",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the three-hill coaster (h₁ = 30 m, h₂ = 18 m, h₃ = 22 m) and the pendulum released at 60°. Label the heights that matter.",
      "prompts": [
        "On the coaster, mark the DROP h₁ − h₂ — that difference is what sets v₂.",
        "On the pendulum, show h = L(1 − cosθ), NOT the string length L.",
        "Put a speed arrow where each object moves fastest."
      ]
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "COASTER BOTTOM FROM 40 M. A coaster cart starts from rest at the top of a 40-m hill. Frictionless. What's its speed at the bottom?",
      "givenHint": "v_i = 0 · h = 40 m · frictionless.",
      "equationHint": "mgh = ½mv² → v = √(2gh).",
      "equationIds": [
        "potential-energy",
        "kinetic-energy"
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your 40-m coaster answer, then complete the pendulum frame.",
      "frame": "A pendulum at angle θ has height h = ___ above its lowest point. The bottom speed is v = ___."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r3-coaster-pendulum"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 13 — Vernier Ramp Lab (Investigation 4.2)', 'u4-d13', 'Unit 4: Energy & Work', 13, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can release a cart from a measured height, predict v at the bottom from mgh = ½mv², measure v with a photogate, and confirm ME conservation across 3 trials.",
      "targetId": "u4.s4-vernier-ramp-lab"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "ME conservation is the rule we'll use Day 19 to convert asteroid PE to impact KE.",
      "connection": "Today we confirm the rule. If our cart's measured v matches the predicted v, the Day 19 yield calculation rests on solid ground."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 4.2 — PE → KE on a ramp",
      "markdown": "**Driving question:** Does v at the bottom of an incline (predicted from mgh = ½mv²) match the photogate's measured v, across 3 release heights? Can we recover g from a plot of v² vs. h?\n\n**Equipment:** Vernier dynamics track + cart + tilt apparatus · photogate + LabQuest + Logger Pro · meter stick + protractor (or pre-measured incline angle) · balance for cart mass.\n\n**How this lab serves the year's question:** if our lab confirms PE → KE at small scale, we trust it at asteroid scale on Day 19."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "Set the incline at ~15°. Measure the incline angle and length.",
        "Release the cart from h = 10 cm (above the photogate). Record measured v.",
        "Compute predicted v = √(2gh). Compare to measured. Compute % difference.",
        "Repeat at h = 20 cm. Then h = 30 cm. Three trials total.",
        "Plot v_measured² vs. h. The slope should be 2g — does it match?"
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "Hands clear of the cart at the bottom. Catch the cart. Photogate clamped firmly."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Not in class today?",
      "markdown": "Run the freefall simulation below: drop the object from three different heights and read the impact speed each time. Those are your v_meas values; your predicted v is still √(2gh). Fill the data table from the sim and do the same v² vs. h analysis."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "freefall-cliff"
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch your incline + photogate. Record h₁, h₂, h₃ as you run trials.",
      "prompts": [
        "Mark the release height h measured VERTICALLY, not along the track.",
        "Show where the photogate reads v.",
        "Note the incline angle."
      ]
    },
    {
      "id": "b9",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "h (m)",
        "v_pred (m/s)",
        "v_meas (m/s)",
        "% diff",
        "v_meas² (m²/s²)",
        "Notes"
      ],
      "rows": 3,
      "plot": true,
      "xCol": "h (m)",
      "yCol": "v_meas² (m²/s²)",
      "patternPrompt": "Three release heights (0.10 m, 0.20 m, 0.30 m). Does measured v match √(2gh)? The v² vs. h plot's slope should be 2g ≈ 19.6."
    },
    {
      "id": "b10",
      "type": "observation",
      "capture": true,
      "patternPrompt": "Did v_predicted match v_measured? Within what %? Was the gap larger or smaller at higher h? If you plotted v_meas² vs. h, what was the slope — did 2g ≈ 19.6 match?",
      "interpretPrompt": "From your slope, what value of g does your data imply? Compared to 9.81, was your measurement high, low, or right on? And the asteroid connection: how does this serve the year's question?",
      "frame": "My trials confirmed mgh = ½mv² within ___ %. The biggest source of error was ___. From my slope, I estimated g ≈ ___ m/s²."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write a CLAIM about what your lab showed, then EVIDENCE (your slope or one % diff), then REASONING (why the slope is approximately 2g).",
      "frame": "CLAIM: ___. EVIDENCE: ___. REASONING: ___."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.s4-vernier-ramp-lab"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 14 — Hooke''s Law: F = −kx', 'u4-d14', 'Unit 4: Energy & Work', 14, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write F_spring = −kx, compute the spring constant k from a measured stretch + load, and predict the force at any other displacement.",
      "targetId": "u4.k6-hookes-law"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Springs are the textbook template for ELASTIC restoring forces.",
      "connection": "Spring physics shows up in crumple zones (Unit 3 callback), in atomic bonds, and in any system that wants to return to equilibrium."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## A force that fights back\n\nStretch a spring and it pulls back. Compress it and it pushes back. The spring always tries to return to its natural length — its **equilibrium**. Hooke's law says how hard:\n\n**F_spring = −k·x**\n\n- x = displacement from equilibrium (m)\n- k = spring constant (N/m) — the spring's stiffness\n- the minus sign = the force points OPPOSITE the displacement (a *restoring* force)\n\n**Finding k:** hang a known mass and let it settle. In equilibrium the spring force balances the weight:\n\nk·x = m·g → **k = m·g / x**\n\nOnce you know k, you can predict the force at ANY displacement: magnitude F = k·|x|."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Hooke's law",
          "definition": "The force a spring exerts is proportional to its displacement from equilibrium, in the OPPOSITE direction: F_spring = −k·x. A spring with k = 200 N/m, compressed 0.08 m: F = −200·0.08 = −16 N (force pushes BACK toward equilibrium).",
          "cognate": "Sp. ley de Hooke · Pt. lei de Hooke · HC lwa Hooke"
        },
        {
          "term": "Spring constant (k)",
          "definition": "A property of the spring measuring its stiffness. Units: N/m. Bigger k = stiffer spring — and k belongs to the SPRING, not the load: same spring, same k, regardless of how much you stretch it. A car suspension spring might have k ≈ 30,000 N/m; a toy slinky might have k ≈ 1 N/m.",
          "cognate": "Sp. constante del resorte · Pt. constante da mola"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "The minus sign is a DIRECTION marker",
      "markdown": "The negative sign in F_spring = −kx isn't part of the size — it says the force always OPPOSES the displacement. Stretch the spring down, it pulls up; compress it left, it pushes right. Magnitude is k·|x|."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "FINDING K. A spring stretches 5 cm (0.05 m) when a 1-kg mass hangs from it. Find the spring constant. Then: what force does the same spring exert if stretched 12 cm?",
      "given": "m = 1 kg · x₁ = 0.05 m · g = 9.81. Find k. Then F at x₂ = 0.12 m.",
      "equation": "In equilibrium: F_spring = m·g → k·x = m·g → k = m·g/x",
      "work": "k = (1)(9.81) / 0.05 = 196.2 N/m\nF at x₂ = k · x₂ = 196.2 · 0.12 = 23.5 N",
      "answer": "k ≈ 196 N/m. At 12 cm stretch, F ≈ 23.5 N."
    },
    {
      "id": "b7",
      "type": "callout",
      "variant": "warning",
      "title": "Linear has limits",
      "markdown": "Hooke's law is a LINEAR approximation. Real springs deviate from it once you stretch them too far (the \"elastic limit\"). For our problems we stay linear."
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the same spring three times: at equilibrium, stretched 5 cm by the 1-kg load, and stretched 12 cm. Draw the spring-force arrow in each stretched case.",
      "prompts": [
        "Force arrows point BACK toward equilibrium.",
        "More stretch → longer arrow (12 cm arrow ≈ 2.4× the 5 cm arrow).",
        "Label k = 196 N/m — same spring, same k in every panel."
      ]
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "SPRING UNDER COMPRESSION. A spring with k = 200 N/m is compressed 0.08 m. What force does it exert? Which direction?",
      "givenHint": "k = 200 N/m · x = 0.08 m (compression).",
      "equationHint": "Magnitude k·|x|; direction OPPOSES the displacement (pushes back out).",
      "equationOptions": [
        "F_spring = −k·x",
        "U_spring = ½·k·x²",
        "W = F·d",
        "F = m·a"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your compression answer (force AND direction), then complete the frame.",
      "frame": "Hooke's law says the spring force is PROPORTIONAL to ___ and OPPOSITE to the ___ direction. The proportionality constant is ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k6-hookes-law"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 15 — Spring PE: ½kx²', 'u4-d15', 'Unit 4: Energy & Work', 15, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write U_spring = ½kx², compute spring PE for a given compression, and apply ½kx² = ½mv² (or = mgh) to launch problems.",
      "targetId": "u4.s5-spring-pe"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Spring PE and KE have IDENTICAL mathematical structure: both are ½·constant·squared.",
      "connection": "A spring-launched projectile is a clean model for any device that stores energy and releases it as motion."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Where the ½ comes from\n\nThe spring force grows LINEARLY from 0 (at x = 0) to k·x (at compression x).\n\nWork = AVERAGE force × distance. Average force = ½·(0 + kx) = ½kx.\n\nTherefore: **W = ½kx · x = ½·k·x²**. That stored work IS the spring PE.\n\nOnce stored, it spends like any other energy. The launch recipe:\n\n- **Horizontal launch:** ½kx² = ½mv² → solve for v\n- **Vertical launch:** ½kx² = mgh → solve for h\n\nEither way, you're just moving Joules from one column of the energy ledger to another."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Spring PE",
          "definition": "The energy stored in a compressed or stretched spring: U_spring = ½·k·x². Always positive. It's ½kx², NOT kx² — the ½ comes from averaging the force as it grows from 0 to kx during compression. A spring with k = 500 N/m compressed 0.2 m stores U = ½·500·0.04 = 10 J.",
          "cognate": "Sp. energía potencial elástica · Pt. energia potencial elástica · HC enèji potansyèl resò"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "note",
      "title": "Same shape, deep reason",
      "markdown": "½kx² has the SAME structure as ½mv². Both are ½ · (a property) · (a quantity)². That's not a coincidence — both come from integrating a linearly-growing force."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "A spring launch, in energy language",
      "caption": "The stored ½kx² spends as motion — and if the launch is vertical, the motion spends as height. Same Joules, three accounts.",
      "links": [
        {
          "label": "Spring PE",
          "sublabel": "U = ½kx² — stored in the compression"
        },
        {
          "label": "Kinetic energy",
          "sublabel": "½mv² — the cart leaves the spring"
        },
        {
          "label": "Gravitational PE",
          "sublabel": "mgh — if launched upward, KE buys height"
        }
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "SPRING LAUNCHES A CART. A spring (k = 500 N/m) is compressed 0.20 m, then released. A 0.4-kg cart sits against the spring, free to slide on a frictionless track. Find the cart's speed when it leaves the spring.",
      "given": "k = 500 N/m · x = 0.20 m · m = 0.4 kg · horizontal, frictionless",
      "equation": "U_spring = ½ · k · x² = KE_cart = ½ · m · v²",
      "work": "U = ½ · 500 · (0.2)² = ½ · 500 · 0.04 = 10 J\n½ · 0.4 · v² = 10\nv² = 50\nv ≈ 7.07 m/s",
      "answer": "≈ 7.07 m/s. All 10 J of spring PE became cart KE."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "VERTICAL LAUNCH. A spring with k = 800 N/m is compressed 5 cm (0.05 m). It launches a 0.1-kg ball straight up (friction-free). How high does the ball go?",
      "givenHint": "k = 800 N/m · x = 0.05 m · m = 0.1 kg.",
      "equationHint": "All the spring PE becomes gravitational PE at the top: ½kx² = mgh → solve for h.",
      "equationOptions": [
        "½·k·x² = m·g·h",
        "½·k·x² = ½·m·v²",
        "F_spring = −k·x",
        "P = W / t"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your vertical-launch answer, then complete the frame.",
      "frame": "A spring launches the cart because the spring's ___ is fully converted into the cart's ___. The total energy is conserved."
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.s5-spring-pe"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 16 — Power: P = W/t = F·v', 'u4-d16', 'Unit 4: Energy & Work', 16, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute power as work-per-time, apply P = F·v for instantaneous power, and convert between Watts and horsepower.",
      "targetId": "u4.k7-power"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Asteroid impact delivers HUGE energy in MICROSECONDS — that's the catastrophic POWER.",
      "connection": "It's not just the energy. The same energy delivered slowly (a billion years) vs. fast (a millisecond) means lava flow vs. extinction event."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## How fast can you spend energy?\n\nWork tells you HOW MUCH energy moves. Power tells you HOW FAST:\n\n**P = W / t** — units: Watts (1 W = 1 J/s)\n\nWhen a force pushes something moving at speed v, there's an instantaneous form:\n\n**P = F · v** (from P = W/t = F·d/t = F·v)\n\n**Horsepower:** 1 hp ≈ 746 W. A 100-hp engine ≈ 75,000 W. Multiply hp by 746 to get Watts; divide Watts by 746 to get hp.\n\nSame work, different power: climbing the stairs in 5 s or in 50 s moves the SAME energy — the 5-s climb just needs 10× the power."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Power (P)",
          "definition": "The rate of energy transfer. P = W / t. Units: Watts (1 W = 1 J/s). A 700-N person climbing a 4-m staircase in 5 s: P = (700·4)/5 = 560 W.",
          "cognate": "Sp. potencia · Pt. potência · HC pisans"
        },
        {
          "term": "Instantaneous power (P = F·v)",
          "definition": "An instantaneous form of power: force times the speed of the point of application, derived from P = W/t = F·d/t = F·v. A car engine at 75 kW propelling the car at 27 m/s: F = P/v = 75,000/27 ≈ 2,780 N. Use P = F·v when you know force and speed simultaneously; use P = W/t when you know work over time.",
          "cognate": "Sp. potencia instantánea · Pt. potência instantânea"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Power is NOT energy",
      "markdown": "Power is the RATE of energy transfer. Big power = fast transfer — not necessarily a lot of energy. Two devices can do the same work; the more powerful one just does it faster."
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "CLIMBING STAIRS. A 700-N student climbs a 4-m staircase in 5 s. What's their power output?",
      "given": "F = 700 N · d = 4 m · t = 5 s",
      "equation": "P = W / t = (F · d) / t",
      "work": "W = 700 · 4 = 2800 J\nP = 2800 / 5 = 560 W",
      "answer": "560 W — about 5.6 light-bulbs of power, briefly."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "CAR ENGINE POWER. A car engine outputs 100 hp (about 75,000 W) while driving at 27 m/s (≈ 60 mph). What's the driving force?",
      "given": "P = 75,000 W · v = 27 m/s",
      "equation": "P = F·v → F = P/v",
      "work": "F = 75,000 / 27 ≈ 2,780 N",
      "answer": "≈ 2,780 N of driving force — balanced by drag + rolling resistance at steady speed."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "Asteroid impact as a power event",
      "markdown": "Asteroid impact: ~10¹⁷ J in ~0.1 s. Power ≈ 10¹⁸ W. The Sun outputs ~4×10²⁶ W. For a tenth of a second, an asteroid impact is a millionth-of-the-Sun bright at the impact site."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "LIFT POWER. A 2-kg ball is lifted 1.5 m in 0.3 s. What power does the lifter generate?",
      "givenHint": "m = 2 kg · h = 1.5 m · t = 0.3 s. Weight first: F = mg.",
      "equationHint": "W = m·g·h, then P = W/t.",
      "equationOptions": [
        "P = W / t",
        "W = F·d",
        "P = F·v",
        "KE = ½·m·v²"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your lift-power answer, then complete the frame.",
      "frame": "Power is the rate of ___ transfer. Two devices can do the same work, but the one with more power does it ___."
    },
    {
      "id": "rd-ch09-e",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **9.2** and **9.8** (power and the watt; machines, levers, and pulleys). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch09-e",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 9,
      "title": "Energy — read & practice",
      "sectionIds": [
        "9.2",
        "9.8"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.k7-power"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 17 — KE in Elastic vs. Inelastic Collisions', 'u4-d17', 'Unit 4: Energy & Work', 17, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute KE_before and KE_after for an elastic and a perfectly inelastic collision, and explain WHERE the missing KE went.",
      "targetId": "u4.r4-ke-collisions"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid impact is perfectly inelastic. The KE doesn't disappear — it converts to heat, sound, light, mechanical deformation.",
      "connection": "That's the missing piece: ALL of the asteroid's KE becomes 'damage' in an inelastic event. Day 19 will measure that KE in TNT-equivalents."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Momentum survives every collision. KE doesn't.\n\nUnit 3 gave us the rule: Σp_before = Σp_after in EVERY collision. Kinetic energy plays by a different rule:\n\n- **Elastic** (magnetic bumpers): KE_before = KE_after. Nothing lost.\n- **Perfectly inelastic** (they stick): KE_after < KE_before. The maximum possible KE is converted.\n\nThe recipe for any sticking collision:\n\n1. v_f from momentum: m₁v₁ = (m₁ + m₂)·v_f\n2. KE_before = ½m₁v₁² (+ ½m₂v₂² if both move)\n3. KE_after = ½(m₁ + m₂)·v_f²\n4. **KE_lost = KE_before − KE_after** → becomes heat, sound, deformation\n\nAn asteroid impact is the ultimate perfectly inelastic collision — and on Day 19 we'll measure its 'lost' KE in TNT-equivalents."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "KE lost",
          "definition": "In a perfectly inelastic collision, KE_before > KE_after. The DIFFERENCE = the KE converted to other forms (heat, sound, deformation). 'KE was lost' does NOT mean energy disappeared — energy is ALWAYS conserved; the KE just transferred to a different form. Example: a 1-kg ball at 6 m/s hits a 1-kg ball at rest, they stick: KE_before = 18 J, KE_after = 9 J, lost: 9 J → heat/sound.",
          "cognate": "Sp. energía cinética perdida · Pt. energia cinética perdida"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Re-run Unit 3's collisions — with energy eyes",
      "markdown": "Run the cart-collisions simulation below in both bumper modes. Magnetic (elastic): compute KE before and after — they match. Velcro (stick): compute KE before and after — where did the difference go?"
    },
    {
      "id": "b6",
      "type": "sim_embed",
      "simulationSlug": "cart-collisions"
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "EQUAL-MASS PERFECTLY INELASTIC. A 1-kg ball at 6 m/s east strikes an identical ball at rest. They stick. Find: (a) v_f from momentum conservation, (b) KE_before, (c) KE_after, (d) KE lost.",
      "given": "m₁ = m₂ = 1 kg · v₁ᵢ = 6 m/s · v₂ᵢ = 0",
      "equation": "m₁·v₁ = (m₁+m₂)·v_f ; KE = ½·m·v²",
      "work": "v_f = (1·6) / (1+1) = 3 m/s\nKE_before = ½·1·6² + 0 = 18 J\nKE_after = ½·2·3² = 9 J\nKE_lost = 18 − 9 = 9 J",
      "answer": "Half of the original KE became heat, sound, deformation. The other half stayed as motion."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "BULLET INTO BLOCK. A 0.05-kg bullet at 400 m/s embeds in a 5-kg block (ballistic pendulum from Unit 3). Find v_f, KE_before, KE_after, KE_lost.",
      "given": "m₁ = 0.05 kg · v₁ = 400 m/s · M = 5 kg · V = 0",
      "equation": "m·v = (m+M)·v_f ; KE = ½·m·v²",
      "work": "v_f = (0.05·400)/(5.05) ≈ 3.96 m/s\nKE_before = ½·0.05·400² = 4000 J\nKE_after = ½·5.05·3.96² ≈ 39.6 J\nKE_lost ≈ 3960 J (over 99% lost!)",
      "answer": "Over 99% of the bullet's KE was \"lost\" — became heat in the wood, deformation, sound."
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "warning",
      "title": "Momentum and KE follow different rules",
      "markdown": "Momentum is conserved in EVERY collision. KE is only conserved in elastic ones. Don't confuse 'energy lost' with 'momentum lost.' Different rules."
    },
    {
      "id": "b10",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the equal-mass collision BEFORE and AFTER. Then show the missing 9 J leaving the system — squiggles!",
      "prompts": [
        "Before: 1 kg at 6 m/s → 1 kg at rest.",
        "After: 2-kg stuck pair at 3 m/s.",
        "Squiggles: heat, sound waves, dents carrying away the lost 9 J."
      ]
    },
    {
      "id": "b11",
      "type": "gewa",
      "capture": true,
      "prompt": "CLAY ONTO STATIONARY BLOCK. A 0.5-kg ball at 10 m/s strikes a 1.5-kg stationary block; they stick. How much KE was lost?",
      "givenHint": "m₁ = 0.5 kg · v₁ = 10 m/s · m₂ = 1.5 kg · v₂ = 0 · they stick.",
      "equationHint": "First v_f from momentum conservation, then KE_before − KE_after.",
      "equationIds": [
        "momentum",
        "kinetic-energy"
      ]
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your clay-block answer, then complete the frame.",
      "frame": "In a perfectly inelastic collision, momentum is ___ but kinetic energy is ___. The missing KE becomes ___."
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r4-ke-collisions"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 18 — Heat as the Missing Energy (Unit 5 Bridge)', 'u4-d18', 'Unit 4: Energy & Work', 18, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can state that total energy (KE + PE + thermal + ...) is ALWAYS conserved, and identify thermal energy as the destination of \"lost\" ME from friction or inelastic collisions.",
      "targetId": "u4.r5-heat-bridge"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's impact KE becomes heat — enough to vaporize rock, raise tsunamis, ignite forests.",
      "connection": "Unit 5 picks up here. Today's bridge: heat is the form that ME usually becomes when it's \"lost.\""
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The grand rule\n\nME conservation (KE + PE = constant) only holds when no friction acts. But friction doesn't DESTROY energy — it relocates it. The full ledger:\n\n**KE + PE + thermal + sound + light + chemical + ... = constant. ALWAYS.**\n\nME conservation is a SPECIAL CASE of this broader rule — the case where the thermal column stays empty.\n\nWhen friction is in play, the bookkeeping gains one term:\n\n**PE_top + KE_top = KE_bottom + PE_bottom + Q_thermal**\n\nWhatever ME goes missing shows up as Q — the heat generated. Yesterday's 'lost' collision KE and today's friction losses all land in the same place: random molecular motion."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Thermal (heat) energy",
          "definition": "The energy of random molecular motion. When friction or inelastic collisions \"remove\" ME, that energy goes into raising the temperature of the objects involved. Rubbing your hands together: 50 N of friction over 0.5 m → 25 J of thermal energy → hands warm.",
          "cognate": "Sp. energía térmica · Pt. energia térmica · HC enèji tèmik"
        },
        {
          "term": "Total energy conservation",
          "definition": "The grand principle: the SUM of all energy forms (KE + PE + thermal + radiant + sound + chemical + ...) is conserved in any closed system. ALWAYS. ME conservation is a SPECIAL CASE — when no friction; total energy conservation is the broader rule. A sled slides down a hill and stops: PE_top = thermal generated by friction (plus a tiny bit of sound).",
          "cognate": "Sp. conservación de energía total · Pt. conservação da energia total"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Heat is NOT temperature",
      "markdown": "Heat is the ENERGY that flows; temperature is the AVERAGE motion of molecules. Same heat input, different temperature rise — depending on the material and how much of it there is."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "The sled's energy, start to stop",
      "caption": "No energy disappears. The PE that started at the top ends up, Joule for Joule, as thermal energy in the snow and runners.",
      "links": [
        {
          "label": "Gravitational PE at the top",
          "sublabel": "mgh = 50·9.81·8 ≈ 3924 J"
        },
        {
          "label": "Kinetic energy on the slope",
          "sublabel": "the sled speeds up"
        },
        {
          "label": "Thermal energy in snow + runners",
          "sublabel": "friction converts ALL of it — sled stops"
        }
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "SLED SLIDES AND STOPS. A 50-kg sled at the top of a hill (h = 8 m, friction-free start) slides 12 m down a snowy slope and stops at the bottom (friction at the end zone). How much heat was generated?",
      "given": "m = 50 kg · h = 8 m · g = 9.81 · v_top = v_bot = 0",
      "equation": "Total energy: PE_top + KE_top = KE_bot + PE_bot + Q_thermal",
      "work": "50 · 9.81 · 8 + 0 = 0 + 0 + Q\nQ = 50 · 9.81 · 8 ≈ 3924 J",
      "answer": "≈ 3924 J of heat generated. All the starting PE became thermal energy."
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "Preview of Unit 5",
      "markdown": "Unit 5 will tell us how MUCH temperature rise a given heat input produces — and that depends on the material. Steel needs much less heat per °C than water."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "FRICTION ON A HAND-RUB. You rub your hands together. The friction force averages 50 N, you move them 0.5 m of relative distance, back and forth 10 times. How much heat do you generate? (Hint: total distance = 10 × 0.5 m × 2 each pass.)",
      "givenHint": "F = 50 N · 0.5 m per stroke · 10 back-and-forth passes, each pass covering 2 × 0.5 m.",
      "equationHint": "Q = W_friction = F · d_total.",
      "equationIds": [
        "work",
        "heat"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 50-kg sled slides 12 m down a hill (8 m drop) and stops. How much heat was generated by friction? Then complete the frame.",
      "frame": "When a sled slides to a stop, the \"missing\" energy became ___. Total energy is ___ — just in a different ___."
    },
    {
      "id": "rd-ch09-f",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **9.9–9.11** (efficiency and energy dissipated as heat, energy for life, sources of energy). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch09-f",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 9,
      "title": "Energy — read & practice",
      "sectionIds": [
        "9.9",
        "9.10",
        "9.11"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r5-heat-bridge"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 19 — TNT Yield: 2026-XJ on the Impact Scale', 'u4-d19', 'Unit 4: Energy & Work', 19, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute 2026-XJ's KE at impact, convert it to TNT-equivalent tons (1 ton TNT = 4.184 × 10⁹ J), and place the result on the Hiroshima / Tunguska / Chicxulub scale.",
      "targetId": "u4.r6-tnt-yield"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Today the entire unit cashes out. We have all the tools: KE = ½mv², the asteroid's mass, its impact velocity from Unit 2.",
      "connection": "Today's number IS the answer to the impact-branch question from UPDATE 4. After today, the question 'how bad is 2026-XJ?' has a real answer in the same units NASA uses for everything else."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The payoff — putting a number on 2026-XJ\n\nUPDATE 4 asked: if 2026-XJ does impact, HOW BAD IS IT ACTUALLY? Today we answer, in the units the public — and NASA — actually use: **TNT-equivalent tons**.\n\nThe recipe has three steps:\n\n1. **KE at impact:** KE = ½mv², with m = 1 × 10⁹ kg and v = 3 × 10⁴ m/s (from Unit 2).\n2. **Convert:** yield (tons) = KE ÷ (4.184 × 10⁹ J per ton).\n3. **Place it on the scale:**\n\n| Event | Yield (tons TNT) | Context |\n|---|---|---|\n| Hiroshima | 1.5 × 10⁴ | atomic bomb, 1945 · destroyed a city |\n| Chelyabinsk | 5 × 10⁵ | Russia airburst, 2013 · broke windows 100 km out |\n| Tunguska | 1.5 × 10⁷ | Siberia airburst, 1908 · flattened 2,000 km² of forest |\n| **2026-XJ (you)** | **≈ 10⁸** | your answer · a regional-to-continental event |\n| Chicxulub | 1 × 10¹⁴ | 66 Ma · killed the dinosaurs |"
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "TNT yield",
          "definition": "The standard unit for comparing energetic events. 1 ton TNT = 4.184 × 10⁹ J. Used for bombs, asteroids, earthquakes. \"TNT-equivalent\" means \"this much energy, expressed in the units of how-much-TNT-it-would-take\" — the actual asteroid is rock, not TNT. Hiroshima ≈ 15 kilotons = 1.5×10⁴ tons; Chicxulub ≈ 100 million megatons = 10¹⁴ tons.",
          "cognate": "Sp. equivalente en TNT · Pt. equivalente em TNT"
        }
      ]
    },
    {
      "id": "b5",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "From impact KE to a TNT number",
      "caption": "The impact is perfectly inelastic, so ALL the kinetic energy converts to damage — and dividing by 4.184 × 10⁹ J/ton puts it in the units NASA reports.",
      "links": [
        {
          "label": "Asteroid KE at impact",
          "sublabel": "½·(10⁹ kg)·(3×10⁴ m/s)² = 4.5 × 10¹⁷ J"
        },
        {
          "label": "Heat, blast, light, seismic waves",
          "sublabel": "perfectly inelastic — ALL of it converts"
        },
        {
          "label": "TNT-equivalent yield",
          "sublabel": "÷ 4.184 × 10⁹ J/ton ≈ 108 megatons"
        }
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "THE BIG COMPUTATION — STEP 1: KE AT IMPACT. 2026-XJ: m = 1 × 10⁹ kg, impact velocity v = 3 × 10⁴ m/s. Compute its kinetic energy at impact.",
      "given": "m = 1 × 10⁹ kg · v = 3 × 10⁴ m/s",
      "equation": "KE = ½ · m · v²",
      "work": "KE = ½ · (1 × 10⁹) · (3 × 10⁴)²\nKE = ½ · (1 × 10⁹) · (9 × 10⁸)\nKE = ½ · 9 × 10¹⁷\nKE = 4.5 × 10¹⁷ J",
      "answer": "≈ 4.5 × 10¹⁷ Joules of kinetic energy at impact."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "STEP 2: CONVERT TO TNT-EQUIVALENT TONS. Convert your KE to TNT-equivalent tons. 1 ton TNT = 4.184 × 10⁹ J.",
      "given": "KE = 4.5 × 10¹⁷ J · 1 ton TNT = 4.184 × 10⁹ J",
      "equation": "yield (tons) = KE / (4.184 × 10⁹)",
      "work": "yield = (4.5 × 10¹⁷) / (4.184 × 10⁹)\nyield ≈ 1.075 × 10⁸ tons TNT\nyield ≈ 108 million tons TNT\nyield ≈ 108 MEGATONS",
      "answer": "≈ 1.08 × 10⁸ tons TNT ≈ 108 megatons. (Roughly 7000 Hiroshimas.)"
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "note",
      "title": "Damage scale — match to your computed yield",
      "markdown": "- 10⁴–10⁵ tons: city-block destruction (Hiroshima-class)\n- 10⁶–10⁷ tons: regional flattening (Tunguska-class — 2,000 km²)\n- 10⁸–10⁹ tons: multi-continent thermal pulse + months-long climate dimming\n- 10¹⁰–10¹² tons: mass-extinction event begins (smaller K-Pg analog)\n- 10¹³–10¹⁴ tons: Chicxulub — 75% of species extinct, dinosaurs gone"
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "warning",
      "title": "The asteroid is fictional. The math is real.",
      "markdown": "NASA's Planetary Defense Coordination Office does exactly this kind of yield calculation for every newly-discovered Near-Earth Object."
    },
    {
      "id": "b10",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw a log-scale yield ladder from 10⁴ to 10¹⁴ tons. Mark Hiroshima, Chelyabinsk, Tunguska, and Chicxulub — then draw 2026-XJ's bar at your computed yield. Where does it fall? Closer to Hiroshima? Tunguska? Or much higher?",
      "prompts": [
        "Each rung of the ladder is ×10.",
        "Mark 2026-XJ's bar at ≈ 10⁸ tons — between Tunguska and Chicxulub.",
        "Label the damage class at 2026-XJ's level."
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write one sentence stating 2026-XJ's TNT-equivalent yield. Then one sentence comparing it to a historical event. Then one sentence about what that means physically.",
      "frame": "2026-XJ would deliver about ___ tons of TNT-equivalent energy. That's roughly ___ Hiroshimas, and would correspond to ___-scale damage."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r6-tnt-yield"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 20 — Escape Velocity', 'u4-d20', 'Unit 4: Energy & Work', 20, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can derive v_esc from KE = |U|, compute Earth's escape velocity, and compare it to other bodies (Moon, Mars).",
      "targetId": "u4.r7-escape-velocity"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "If 2026-XJ had been moving FASTER than the local escape velocity, it could have slipped past Earth (or the Sun) and never come back.",
      "connection": "Same energy framework as the impact yield — but instead of asking 'how much PE did the asteroid gain falling in,' we ask 'how much KE does it need to climb back out.'"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Climbing out of the gravity well\n\nThrow a ball up: it comes back. Throw it FAST enough and it never does. 'Fast enough' is **escape velocity** — and it falls straight out of energy conservation plus the universal PE from earlier this unit (U = −G·M·m/r).\n\n**Setup:** object at the surface (distance r from the center), mass m, given some launch speed v. At infinity, we want the object to JUST barely have KE_∞ = 0 (any extra is wasted).\n\nConservation of total energy: KE_surface + U_surface = KE_∞ + U_∞\n\n½·m·v_esc² + (−G·M·m/r) = 0 + 0\n\n½·v_esc² = G·M/r → **v_esc = √(2·G·M/r)**\n\nMass m cancels. Escape velocity is a property of the BODY you're leaving, not the escapee — a feather and a battleship need the same launch speed."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Escape velocity",
          "definition": "The minimum speed at distance r from a body of mass M such that the object can reach infinity with KE ≥ 0: v_esc = √(2GM/r). It doesn't depend on the escaping object's mass — m cancels out. Earth's surface escape velocity: ≈ 11.2 km/s (≈ 25,000 mph). Moon's: ≈ 2.4 km/s.",
          "cognate": "Sp. velocidad de escape · Pt. velocidade de escape · HC vitès chape"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "note",
      "title": "Why small worlds are airless",
      "markdown": "Small bodies (Moon, Pluto, asteroids) have LOW escape velocities. That's why they don't hold atmospheres — gas molecules at typical room temperatures easily exceed v_esc and drift away."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "See escape vs. capture",
      "markdown": "Run the asteroid-trajectory simulation below: try slower and faster approach speeds and watch which trajectories swing past Earth and away — and which fall in. That's escape velocity drawn as a picture."
    },
    {
      "id": "b7",
      "type": "sim_embed",
      "simulationSlug": "asteroid-trajectory"
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "EARTH'S ESCAPE VELOCITY. Compute v_esc at Earth's surface.",
      "given": "G = 6.67 × 10⁻¹¹ · M = 5.97 × 10²⁴ kg · r = 6.37 × 10⁶ m",
      "equation": "v_esc = √(2 · G · M / r)",
      "work": "v_esc = √(2 · 6.67×10⁻¹¹ · 5.97×10²⁴ / 6.37×10⁶)\n= √(1.25 × 10⁸)\n≈ 1.12 × 10⁴ m/s ≈ 11.2 km/s",
      "answer": "≈ 11.2 km/s ≈ 25,000 mph. Any slower → eventually falls back to Earth."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "MARS ESCAPE VELOCITY. Compute v_esc at Mars's surface. M_Mars = 6.4×10²³ kg, r_Mars = 3.39×10⁶ m.",
      "givenHint": "G = 6.67×10⁻¹¹ · M = 6.4×10²³ kg · r = 3.39×10⁶ m.",
      "equationHint": "Same recipe as Earth: plug into √(2GM/r).",
      "equationOptions": [
        "v_esc = √(2·G·M / r)",
        "U = −G·M·m / r",
        "KE = ½·m·v²",
        "g = G·M / r²"
      ]
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "MOON ESCAPE VELOCITY. Compute v_esc at the Moon's surface. M_Moon = 7.35×10²² kg, r_Moon = 1.74×10⁶ m. (This explains why Apollo astronauts could leave the Moon with a small ascent stage.)",
      "givenHint": "G = 6.67×10⁻¹¹ · M = 7.35×10²² kg · r = 1.74×10⁶ m.",
      "equationHint": "√(2GM/r) again — expect a much smaller answer than Earth's 11.2 km/s.",
      "equationOptions": [
        "v_esc = √(2·G·M / r)",
        "U = −G·M·m / r",
        "KE = ½·m·v²",
        "g = G·M / r²"
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your Mars answer, then complete the atmosphere frame.",
      "frame": "Earth holds an atmosphere because the speed of a typical air molecule at room temperature is ___ Earth's escape velocity. The Moon doesn't because its v_esc is ___."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.r7-escape-velocity"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 21 — Three-Branch Energy Budget', 'u4-d21', 'Unit 4: Energy & Work', 21, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "SYNTHESIS",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can run a complete 2026-XJ energy analysis on all three branches (impact yield, deflection feasibility, escape) and articulate which TWO unit ideas were load-bearing.",
      "targetId": "u4.synthesis-energy-budget"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We have every tool: KE, PE (local + universal), conservation, springs, power, TNT yield, escape velocity.",
      "connection": "Today is the rehearsal for Day 22's transfer task. Done in groups, compiled as a class, written down in your packet."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Three branches, one energy report\n\nToday you run the COMPLETE 2026-XJ energy budget, the way a planetary defense team would:\n\n- **Branch 1 — IMPACT YIELD:** KE at impact → TNT-equivalent tons → place on the historical scale (Day 19's calculation, now yours end-to-end).\n- **Branch 2 — DEFLECTION ENERGY:** how much KE does a DART-class impactor carry, and how much KE change does it actually buy on the asteroid? Is deflection energy-feasible?\n- **Branch 3 — ESCAPE:** could 2026-XJ leave the solar system at its current speed — or is it bound to keep coming back?\n\nThen the class compiles its consensus energy report."
    },
    {
      "id": "b4",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the three-branch decision tree: IMPACT / DEFLECTION / ESCAPE. Fill in each branch's TOOLS and ANSWER box. Then circle ONE tool that shows up in TWO branches.",
      "prompts": [
        "Impact branch: which equations?",
        "Deflection and escape branches: which equations?",
        "Circle the shared tool."
      ]
    },
    {
      "id": "b5",
      "type": "gewa",
      "capture": true,
      "prompt": "STATION 1 — IMPACT YIELD (revisit Day 19). 2026-XJ has m = 1×10⁹ kg, impact velocity v = 3×10⁴ m/s. (a) Compute KE at impact. (b) Convert to TNT-equivalent tons. (c) Identify it on the Hiroshima/Tunguska/Chicxulub scale.",
      "givenHint": "m = 1×10⁹ kg · v = 3×10⁴ m/s · 1 ton TNT = 4.184×10⁹ J.",
      "equationHint": "(a) KE = ½mv². (b) divide by 4.184×10⁹. (c) compare to the scale.",
      "equationOptions": [
        "KE = ½·m·v²",
        "yield (tons) = KE / (4.184 × 10⁹ J)",
        "U = m·g·h",
        "P = W / t"
      ]
    },
    {
      "id": "b6",
      "type": "gewa",
      "capture": true,
      "prompt": "STATION 2 — DEFLECTION ENERGY (revisit Unit 3 DART). Unit 3 said a single DART-class impactor (600 kg at 6 km/s) delivers about Δv ≈ 7 × 10⁻⁴ m/s to a 5×10⁹ kg asteroid. (a) Compute the KE of a single DART spacecraft at launch. (b) That energy translated into Δv on the asteroid — what KE does the asteroid GAIN in its new (slightly faster) state? (Hint: ΔKE_asteroid ≈ M · v · Δv, where v is the asteroid's prior speed.) (c) Comment on whether this is energy-feasible.",
      "givenHint": "m_DART = 600 kg · v_DART = 6×10³ m/s · M = 5×10⁹ kg · Δv ≈ 7×10⁻⁴ m/s · asteroid prior speed v ≈ 3×10⁴ m/s.",
      "equationHint": "(a) KE = ½mv². (b) ΔKE_asteroid ≈ M·v·Δv. (c) compare the two numbers.",
      "equationOptions": [
        "KE = ½·m·v²",
        "ΔKE_asteroid ≈ M·v·Δv",
        "p = m·v",
        "W = F·d"
      ]
    },
    {
      "id": "b7",
      "type": "gewa",
      "capture": true,
      "prompt": "STATION 3 — ESCAPE FROM THE SUN. 2026-XJ currently orbits the Sun at v ≈ 3×10⁴ m/s (comparable to Earth). Escape velocity from the Sun at Earth's orbital distance (r = 1.5×10¹¹ m) is v_esc ≈ √(2·G·M_Sun/r), with M_Sun = 2×10³⁰ kg. (a) Compute v_esc. (b) Compare to 2026-XJ's current speed. (c) Could 2026-XJ escape the solar system at its current speed?",
      "givenHint": "G = 6.67×10⁻¹¹ · M_Sun = 2×10³⁰ kg · r = 1.5×10¹¹ m · current v ≈ 3×10⁴ m/s.",
      "equationHint": "(a) v_esc = √(2GM_Sun/r). (b)–(c) compare v to v_esc.",
      "equationOptions": [
        "v_esc = √(2·G·M_Sun / r)",
        "KE = ½·m·v²",
        "U = −G·M·m / r",
        "g = G·M / r²"
      ]
    },
    {
      "id": "b8",
      "type": "observation",
      "capture": true,
      "patternPrompt": "CLASS CONSENSUS — WHAT'S OUR ENERGY REPORT? Compile across groups (or, at home, across your own three stations). What did each branch conclude?",
      "interpretPrompt": "Write two sentences: one about the impact yield, one about whether deflection AND escape are feasible.",
      "frame": "Our impact sentence: 2026-XJ would deliver ___. Our feasibility sentence: deflection is ___ and escape is ___."
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "This is the real job",
      "markdown": "Real planetary defense reports include all three branches. Your numbers are within an order of magnitude of NASA's actual analyses."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Of all the things you learned in Unit 4, which TWO ideas were MOST load-bearing for the three-branch analysis? Why?",
      "frame": "Of all the ideas from Unit 4, the TWO most load-bearing for today's analysis were ___ (used in impact) and ___ (used in deflection/escape). Both rest on conservation of ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u4.synthesis-energy-budget"
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 22 — Unit 4 Transfer Task', 'u4-d22', 'Unit 4: Energy & Work', 22, 'markdown', true, $u4${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply every Unit 4 tool — work, kinetic and potential energy, conservation, springs, power, TNT yield, and escape velocity — independently on the transfer task.",
      "targetId": "u4.transfer-task"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Every tool from Unit 4 is in your hands: W = Fd (and W = Fd cosθ), KE, U (mgh and −GMm/r), conservation, springs, power, TNT yield, escape velocity.",
      "connection": "One of the 5 transfer problems is the asteroid yield problem. Another is escape velocity from a body you've never seen. The rest test technique."
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
      "markdown": "## The task — 5 multi-part problems, ~40 minutes, independent\n\n- **Problem 1 — Work + work-energy theorem.** A braking car: given m, v_i, braking force, find the stopping distance using W_net = ΔKE.\n- **Problem 2 — Conservation of ME.** A roller coaster: given heights and a starting speed, find the speed at multiple points. Account for friction in one part.\n- **Problem 3 — Spring-launched projectile.** Given spring constant + compression + launch angle, use ½kx² → KE + (mgh as needed) to find launch speed and max height.\n- **Problem 4 — Power.** An elevator lifting a known mass at a given rate. Compute power required.\n- **Problem 5 — Asteroid impact yield IN TONS TNT + escape velocity from an unfamiliar body.** Asteroid mass + impact speed given; convert KE to TNT tons and place on the scale. Then: compute v_esc for a body with given M and r.\n\n### How it's scored — 4 dimensions, each 0–4\n\n- **Science** — correct physics: vectors, kinematics, units.\n- **Reasoning** — sound method; uncertainty explained, not just stated.\n- **Communication** — work shown, units labeled, organized, readable.\n- **Transfer-to-Asteroid** — honest public-facing connection to 2026-XJ."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Allowed today",
      "markdown": "The Unit 4 Equation Reference card and a calculator. Every equation on it is on the MCAS Equation Sheet — you do **not** need to memorize them. You DO need to recognize when each one applies. You may ask **clarifying** questions about what the task means — but not physics-content questions."
    },
    {
      "id": "b6",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Before you start the paper task, write your plan: what order will you tackle the five problems, and where do you predict you will struggle?",
      "frame": "My plan: first I will ___, then ___. I expect to struggle most with ___."
    },
    {
      "id": "b7",
      "type": "prose",
      "markdown": "## After the task — final unit self-assessment\n\nRate yourself on every Unit 4 target below. This is your end-of-unit Marzano record — it feeds your Mastery Growth Chart and tells us both exactly where to focus before Unit 5 picks up the heat bridge."
    },
    {
      "id": "b8",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "u4.k1-work",
        "u4.r1-work-angle",
        "u4.k2-kinetic-energy",
        "u4.s1-work-energy-theorem",
        "u4.s2-vernier-ke-lab",
        "u4.k3-gpe-mgh",
        "u4.r2-mgh-limits",
        "u4.k4-universal-pe",
        "u4.k5-conservation",
        "u4.s3-conservation-solve",
        "u4.r3-coaster-pendulum",
        "u4.s4-vernier-ramp-lab",
        "u4.k6-hookes-law",
        "u4.s5-spring-pe",
        "u4.k7-power",
        "u4.r4-ke-collisions",
        "u4.r5-heat-bridge",
        "u4.r6-tnt-yield",
        "u4.r7-escape-velocity"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "End-of-unit reflection: where did you grow the most this unit, and what's the one idea you want locked in before Unit 5 (heat & thermal energy)?",
      "frame": "I grew most on ___. Before Unit 5 I want to lock in ___."
    }
  ]
}$u4$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

-- Wire each target to its lesson (publish guardrail requires learning_targets.lesson_id)
WITH map(target_slug, lesson_slug) AS (VALUES
  ('u4.anchor-damage-energy','u4-d01'),
  ('u4.k1-work','u4-d02'),
  ('u4.r1-work-angle','u4-d03'),
  ('u4.k2-kinetic-energy','u4-d04'),
  ('u4.s1-work-energy-theorem','u4-d05'),
  ('u4.s2-vernier-ke-lab','u4-d06'),
  ('u4.k3-gpe-mgh','u4-d07'),
  ('u4.r2-mgh-limits','u4-d08'),
  ('u4.k4-universal-pe','u4-d09'),
  ('u4.k5-conservation','u4-d10'),
  ('u4.s3-conservation-solve','u4-d11'),
  ('u4.r3-coaster-pendulum','u4-d12'),
  ('u4.s4-vernier-ramp-lab','u4-d13'),
  ('u4.k6-hookes-law','u4-d14'),
  ('u4.s5-spring-pe','u4-d15'),
  ('u4.k7-power','u4-d16'),
  ('u4.r4-ke-collisions','u4-d17'),
  ('u4.r5-heat-bridge','u4-d18'),
  ('u4.r6-tnt-yield','u4-d19'),
  ('u4.r7-escape-velocity','u4-d20'),
  ('u4.synthesis-energy-budget','u4-d21'),
  ('u4.transfer-task','u4-d22')
)
UPDATE learning_targets t SET lesson_id = l.id::text
FROM map m JOIN lessons l ON l.slug = m.lesson_slug
WHERE t.slug = m.target_slug;

UPDATE learning_targets SET exclude_from_growth = true WHERE slug IN ('u4.synthesis-energy-budget', 'u4.transfer-task');

COMMIT;
