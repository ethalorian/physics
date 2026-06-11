-- Apply Unit 7: Electricity & Magnetism lesson blocks + learning targets (paste into Supabase SQL editor).
-- Generated from /sessions/laughing-zen-feynman/mnt/physics-classroom/src/data/unit7-blocks/*.json
BEGIN;

-- Learning targets
INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.anchor-charge', 'I can describe charge as Unit 7''s fundamental quantity, distinguish positive from negative, and name where the unit is heading — including the bridge to the Car Project.', 'reasoning', 'unit-7', 1)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k1-coulombs-law', 'I can compute the electric force with Coulomb''s law F = kq₁q₂/r² and reason about its inverse-square scaling.', 'knowledge', 'unit-7', 2)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k2-electric-field', 'I can describe an electric field qualitatively and read field-line diagrams.', 'knowledge', 'unit-7', 3)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k3-voltage', 'I can explain voltage as energy per charge and compute it from energy and charge.', 'knowledge', 'unit-7', 4)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k4-current', 'I can compute current I = q/t and describe what physically flows in a wire.', 'knowledge', 'unit-7', 5)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k5-ohms-law', 'I can use Ohm''s law V = IR to solve for any of the three quantities.', 'knowledge', 'unit-7', 6)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.s1-series-circuits', 'I can analyze series circuits: equivalent resistance, shared current, and voltage division.', 'skill', 'unit-7', 7)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.s2-parallel-circuits', 'I can analyze parallel circuits: branch currents, shared voltage, and reduced equivalent resistance.', 'skill', 'unit-7', 8)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.s3-combination-circuits', 'I can reduce and solve combination circuits step by step.', 'skill', 'unit-7', 9)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.s4-vernier-circuit-lab', 'I can wire and measure real circuits with ammeter and voltmeter and verify Ohm''s law and the series/parallel rules.', 'skill', 'unit-7', 10)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k6-electric-power', 'I can compute electric power P = VI and relate it to resistor heating.', 'knowledge', 'unit-7', 11)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k7-magnetism', 'I can describe magnetic fields, poles, and Earth''s magnetic field.', 'knowledge', 'unit-7', 12)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.k8-oersted', 'I can describe how a current creates a magnetic field and predict a solenoid''s polarity.', 'knowledge', 'unit-7', 13)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.r1-faraday', 'I can explain Faraday induction: a changing magnetic flux induces a voltage.', 'reasoning', 'unit-7', 14)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.r2-motors-generators', 'I can trace the energy flow of motors and generators and compute motor efficiency.', 'reasoning', 'unit-7', 15)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.r3-magnetosphere-emp', 'I can explain how Earth''s dynamo makes the magnetosphere and reason about EMP effects from an impact.', 'reasoning', 'unit-7', 16)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.bridge-car-project', 'I can connect every unit of the year to a Car Project component and pre-compute the car''s circuit.', 'reasoning', 'unit-7', 17)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u7.transfer-task', 'I can apply every Unit 7 tool independently on the transfer task.', 'reasoning', 'unit-7', 18)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

-- Lessons
INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 1 — Meet Electric Charge + Unit 8 Preview', 'u7-d01', 'Unit 7: Electricity & Magnetism', 1, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe charge as the FUNDAMENTAL quantity of Unit 7 (analogous to mass in Unit 2, energy in Unit 4), distinguish positive from negative, and name what's coming in the unit — including the Day 17 BRIDGE into Unit 8 Car Project.",
      "targetId": "u7.anchor-charge"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "UPDATE 7 (final): impact probability is now below 1 in 10,000. The asteroid story is closing. A YEAR of theory is closing too.",
      "connection": "Unit 7 simultaneously closes the cosmic arc (Day 16: how Earth's magnetosphere protects us) AND opens the engineering arc (Day 17: every Car Project part traces to a unit). Both threads converge."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "NASA / Planetary Defense Briefing — Update 7 — FINAL",
      "markdown": "After a full year of theory, the orbit predictions for 2026-XJ have refined to the point where the impact probability is now **BELOW 1 in 10,000** — close enough to be uncomfortable, far enough to be useful for planning. The math you've done was REAL physics applied to a possible scenario, not panic-mongering.\n\nBut the asteroid story is closing for ONE reason and opening for another: you've spent a year learning the THEORY. Now Unit 8 has you **BUILDING**. The Car Project doesn't have an asteroid in it — it's a DC-motor electric car that races down a corridor. But every piece of it comes from somewhere in this year of physics: the gear ratio is Unit 2 mechanical advantage; the impulse force during the start is Unit 3; the kinetic energy at top speed is Unit 4; the heat that the motor dissipates is Unit 5; the radio waves that NASA uses to control real-world planetary defense missions are Unit 6; and the **CIRCUIT itself is Unit 7**. Theory becomes engineering.\n\nThe cosmic side: there's also one new piece of data. Earth's **MAGNETOSPHERE** — generated by E&M physics you'll meet on Day 12 — is what protected life on this planet long enough for you to exist and learn this curriculum. A large impact could disrupt the magnetosphere temporarily; that's Day 16's content. The same physics that runs the Car Project's motor runs the dynamo at Earth's core that runs the magnetosphere that runs the protection.\n\n*This is fiction. The physics — and the equations — are real.*"
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## A new fundamental quantity\n\nEvery unit this year opened with one quantity everything else hangs on: Unit 2 had **mass**, Unit 4 had **energy**. Unit 7's is **charge** — a property of matter as basic as mass, but with a twist mass doesn't have: it comes in **two kinds**, positive and negative.\n\n- **Like charges repel.** Two + (or two −) push apart.\n- **Unlike charges attract.** A + and a − pull together.\n\nRub a balloon on your hair and electrons (negative charge) jump from hair to balloon. No mass appeared, no energy appeared from nowhere — **charge moved**. That charged balloon now exerts a force on things it never touches: force at a distance, the same spooky behavior gravity showed in Unit 2.\n\nThe roadmap: charge (today) → the force law between charges (Day 2) → field (Day 3) → voltage and current (Days 4–5) → Ohm's law and circuits (Days 6–9) → power, magnetism, motors — and on Day 17, every one of those pieces snaps into the Car Project circuit."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — the balloon demo",
      "markdown": "Demo: rub a balloon on your hair (or a wool sweater), then bring it near a pile of torn paper bits on the table. The bits LEAP UP to the balloon. Force WITHOUT contact. At home, try it yourself — a balloon, your hair, and some torn paper scraps are all you need."
    },
    {
      "id": "b6",
      "type": "observation",
      "capture": true,
      "patternPrompt": "The paper bits LEAP UP to the balloon — force WITHOUT contact. What did you NOTICE?",
      "interpretPrompt": "What do you WONDER about what happened between the balloon, the hair, and the paper?",
      "frame": "I notice ___. I wonder ___."
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch what changed when you rubbed the balloon on hair. Did mass appear or disappear? Did energy? Something else moved between the balloon and the hair. What was it?",
      "prompts": [
        "Balloon + hair before and after rubbing.",
        "Show what MOVED between them.",
        "Label the kind of charge that moved."
      ]
    },
    {
      "id": "b8",
      "type": "vocab",
      "terms": [
        {
          "term": "Electric charge",
          "definition": "A fundamental property of matter, like mass. Comes in two kinds: POSITIVE and NEGATIVE. Like charges repel; unlike charges attract. Measured in coulombs (C). The electron is the smallest unit: q = −e = −1.6 × 10⁻¹⁹ C. The proton: q = +e = +1.6 × 10⁻¹⁹ C. Rubbing the balloon moves electrons from hair to balloon.",
          "cognate": "Sp. carga eléctrica · Pt. carga elétrica · HC chaj elektrik"
        },
        {
          "term": "Conductor (vs. insulator)",
          "definition": "A material where charge moves freely (metals — copper, aluminum, gold). Insulators (rubber, glass, plastic, dry air) hold charge in place. A copper wire is a conductor — that's why circuits use it; rubber insulation around the wire keeps the charge inside the metal. Semiconductors (silicon) are in-between — basis of all modern electronics.",
          "cognate": "Sp. conductor · Pt. condutor · HC kondiktè"
        },
        {
          "term": "Coulomb (C)",
          "definition": "The SI unit of electric charge. 1 coulomb = the charge of 6.24 × 10¹⁸ electrons. A typical lightning bolt transfers about 15 C. A 9V battery delivers about 5 C per minute when running a small motor. The charge of ONE electron is tiny — 1 C is a HUGE number of electrons.",
          "cognate": "Sp. culombio · Pt. coulomb · HC koulonm"
        }
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "misconception",
      "title": "Charge isn't CREATED by rubbing — it's TRANSFERRED",
      "markdown": "Rubbing the balloon doesn't manufacture charge. Electrons MOVE from hair to balloon: the balloon ends up extra-negative, your hair ends up equally extra-positive. **Total charge is conserved** — one of the deepest laws in physics."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "MY GUESS — If the balloon picked up extra NEGATIVE charges, and the paper bits were NEUTRAL (zero net charge), why did the bits jump up to the balloon? (Day 3 has the answer.)",
      "frame": "My guess: the neutral paper bits jumped because ___."
    },
    {
      "id": "b11",
      "type": "callout",
      "variant": "note",
      "title": "Two payoff days ahead",
      "markdown": "Unit 7 has TWO payoff days. **Day 16:** Earth's MAGNETOSPHERE — generated by E&M physics — is what protects life from cosmic + solar radiation. **Day 17:** every part of the Car Project (battery, wires, motor, gears, wheels) traces to a unit of this year's physics. Theory becomes engineering."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "You rub a balloon on your hair. Why does it stick to a wall afterward? Mention CHARGE and ATTRACTION in two sentences.",
      "frame": "The balloon gained ___ charge from my hair. It sticks because ___."
    },
    {
      "id": "rd-ch32-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **32.1–32.2** (electrical forces and charges; conservation of charge). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch32-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 32,
      "title": "Electrostatics — read & practice",
      "sectionIds": [
        "32.1",
        "32.2"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.anchor-charge"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 2 — Coulomb''s Law: F = kq₁q₂/r²', 'u7-d02', 'Unit 7: Electricity & Magnetism', 2, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply Coulomb's law to compute the electric force between two point charges, predict the direction (attract vs. repel), and explain why it's an INVERSE-SQUARE law (just like gravity).",
      "targetId": "u7.k1-coulombs-law"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Unit 2: F_grav = G m₁m₂/r². Same inverse-square SHAPE.",
      "connection": "Today: the electric version. Same equation pattern — different constant, different 'charges' instead of masses. Both fall off as 1/r²."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The force law between charges\n\nYesterday you saw charges push and pull. Today you compute HOW HARD:\n\n**F = k · q₁ · q₂ / r²**\n\nwhere k = 9 × 10⁹ N·m²/C². Compare it to Unit 2's gravity, F = G·m₁·m₂/r² — same shape, charge swapped in for mass. Both are **inverse-square laws**: double the distance, the force drops to ¼; triple it, 1/9.\n\nTwo differences from gravity matter:\n\n- **Direction comes from the signs.** Same signs (both +, both −) → repel. Different signs → attract. Gravity only attracts.\n- **k is gigantic compared to G.** Two +1 C charges 1 m apart would repel with 9 × 10⁹ N. That's why lab charges are measured in μC (10⁻⁶ C) and nC (10⁻⁹ C) — and why electric forces, not gravity, run everything at the atomic scale."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Coulomb's law",
          "definition": "F = k · q₁ · q₂ / r². The electric force between two point charges. k = 9 × 10⁹ N·m²/C² (Coulomb's constant). Two +1 C charges 1 m apart would repel with F = 9 × 10⁹ N — HUGE. (That's why we usually deal with μC or nC in lab.)",
          "cognate": "Sp. ley de Coulomb · Pt. lei de Coulomb · HC lwa Coulomb"
        },
        {
          "term": "Inverse-square law",
          "definition": "Force falls off as 1/r². Double the distance → ¼ the force. Triple the distance → 1/9 the force. Gravity (F = Gm₁m₂/r²) and Coulomb force (F = kq₁q₂/r²) are both inverse-square. So is light intensity and sound intensity.",
          "cognate": "Sp. ley del inverso del cuadrado · Pt. lei do inverso do quadrado · HC lwa envès kare"
        },
        {
          "term": "Point charge",
          "definition": "An idealization — a charge concentrated at one point with no size. Coulomb's law applies exactly to point charges, approximately to small charged objects. A charged balloon isn't a point — but at distances much larger than the balloon, it acts like one. Same for electrons + protons.",
          "cognate": "Sp. carga puntual · Pt. carga pontual · HC chaj pwen"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "The 'square' is in the DENOMINATOR — and don't lose the sign",
      "markdown": "If r doubles, you divide F by 2² = 4. **NOT** by 2. And the SIGN of the force tells you direction: same signs (both +, both −) → repel; different signs → attract. Don't lose the sign in algebra."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch two charged spheres with the force arrows on each. Show what happens when you DOUBLE the distance between them. (Inverse-square — force drops by 4.)",
      "prompts": [
        "Two spheres, force arrows on EACH (equal and opposite).",
        "Redraw at double the distance.",
        "Label the new force as F/4."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "TWO EQUAL POSITIVE CHARGES — Two equal +2 μC charges are 0.30 m apart. Compute the force on each.",
      "given": "q₁ = q₂ = +2 × 10⁻⁶ C · r = 0.30 m · k = 9 × 10⁹ N·m²/C²",
      "equation": "F = k · q₁ · q₂ / r²",
      "work": "F = (9 × 10⁹) · (2 × 10⁻⁶) · (2 × 10⁻⁶) / (0.30)²\nF = (9 × 10⁹) · (4 × 10⁻¹²) / 0.09\nF = (3.6 × 10⁻²) / 0.09\nF = 0.4 N",
      "answer": "F = 0.4 N on each charge, pushing them APART (like charges repel)."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "INVERSE-SQUARE SCALING — Same two +2 μC charges, but now 0.60 m apart (double the distance). What's the new force?",
      "given": "r' = 0.60 m = 2 · 0.30 m",
      "equation": "F' = F / (r'/r)² = F / 4",
      "work": "F' = 0.4 / 4\nF' = 0.1 N",
      "answer": "F' = 0.1 N. Doubling distance → force divided by 4. Inverse-square."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — PROTON AND ELECTRON IN A HYDROGEN ATOM. A proton (+e) and an electron (−e) are 5.3 × 10⁻¹¹ m apart (Bohr radius). Compute the magnitude of the Coulomb attraction. e = 1.6 × 10⁻¹⁹ C.",
      "givenHint": "q₁ = q₂ = 1.6 × 10⁻¹⁹ C (magnitudes) · r = 5.3 × 10⁻¹¹ m · k = 9 × 10⁹ N·m²/C²",
      "equationHint": "Same move as the worked example: F = kq₁q₂/r². Watch the exponents — the answer is around 10⁻⁸ N.",
      "equationIds": [
        "coulomb"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Why atoms hold together",
      "markdown": "The Coulomb attraction inside an atom is ENORMOUS at that scale — about 10⁸ N when scaled per kg of mass. That's what holds atoms together. Gravity, by contrast, is irrelevant at this distance."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Two +3 μC charges are 0.1 m apart. Compute the force. (k = 9 × 10⁹.) Show one line of work. Then complete the frame.",
      "frame": "Coulomb's law and Newton's gravity both fall off as ___. The Coulomb constant k is much ___ than the gravitational constant G, so electric forces dominate at the ___ scale; gravity dominates at the ___ scale."
    },
    {
      "id": "rd-ch32-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **32.3–32.7** (Coulomb's law; conductors and insulators; charging by friction, contact, and induction; charge polarization). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch32-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 32,
      "title": "Electrostatics — read & practice",
      "sectionIds": [
        "32.3",
        "32.4",
        "32.5",
        "32.6",
        "32.7"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k1-coulombs-law"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 3 — Electric Field (Qualitative)', 'u7-d03', 'Unit 7: Electricity & Magnetism', 3, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can interpret electric field lines (out of + charges, into − charges, denser = stronger), use E = F/q to compute force on a charge in a known field, and explain why a NEUTRAL object can still feel a force in an electric field (induced polarization).",
      "targetId": "u7.k2-electric-field"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Coulomb's law tells us the force between charges. But what if there are MANY charges, or a charge in empty space?",
      "connection": "Field is the answer to 'how does one charge KNOW about another at a distance?' It's a property of every point in space — what a + test charge would feel."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Force per coulomb\n\nCoulomb's law handles two charges at a time. But space around a charge is already 'primed' — drop a test charge anywhere and it feels a push. That readiness-to-push is the **electric field**:\n\n**E = F / q** — the force PER UNIT of positive charge, in N/C.\n\nFlip it around and it becomes a tool: if you know the field, the force on any charge q is **F = E·q**. Positive charges get pushed ALONG the field; negative charges get pushed AGAINST it.\n\nWe draw fields with **field lines**: out of + charges, into − charges, denser where the field is stronger. And for a single point charge, the field strength at distance r is **E = kq/r²** — Coulomb's law with one charge factored out.\n\nToday also pays off Day 1's mystery: why did NEUTRAL paper bits jump to the balloon? The field **polarizes** them — rearranges their internal charges — and the nearer side wins the tug-of-war."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Electric field (E)",
          "definition": "A vector quantity at every point in space. E = F/q — the force per unit positive charge. Units: N/C (or V/m). In a uniform field E = 100 N/C, a +2 C charge feels F = E·q = 200 N in the direction of E.",
          "cognate": "Sp. campo eléctrico · Pt. campo elétrico · HC chan elektrik"
        },
        {
          "term": "Field lines",
          "definition": "Drawn arrows showing E direction at every point. Lines come OUT of + charges, INTO − charges. Denser lines = stronger field. A single + charge: field lines radiate outward like spokes. A single − charge: lines point inward. Between + and −: lines arc from + to −.",
          "cognate": "Sp. líneas de campo · Pt. linhas de campo · HC liy chan"
        },
        {
          "term": "Polarization (induced)",
          "definition": "A neutral object placed in an electric field rearranges its own charges — the + side faces toward the − source, and vice versa. The object becomes a tiny dipole. The balloon attracts neutral paper bits because the field POLARIZES the paper: the closer (+) end feels stronger attraction than the (−) end feels repulsion → net pull toward the balloon.",
          "cognate": "Sp. polarización · Pt. polarização · HC polarizasyon"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Field lines are a DRAWING TOOL — and E doesn't depend on the test charge",
      "markdown": "There aren't actually 'lines' in space — the field exists at EVERY point. And E is a property of the SOURCE charges, independent of the test charge; the test charge just tells you what HAPPENS in the field."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch field lines for: (A) a single + charge alone, (B) a single − charge alone, (C) a + and − together (dipole). Where are the lines most dense? Where is E strongest?",
      "prompts": [
        "Three panels: A (+ alone), B (− alone), C (dipole).",
        "Arrows OUT of +, INTO −.",
        "Circle where the lines are densest (strongest E)."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "FORCE ON A CHARGE IN A KNOWN FIELD — An electric field E = 50 N/C points to the right (+x). What force does it exert on a +3 C charge placed in it?",
      "given": "E = 50 N/C (in +x direction) · q = +3 C",
      "equation": "F = E·q",
      "work": "F = 50 · 3\nF = 150 N (in +x direction)",
      "answer": "F = 150 N pointing right (same direction as E, because q is positive)."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "FORCE ON A NEGATIVE CHARGE IN THE SAME FIELD — Same field E = 50 N/C in +x. Now place a −2 C charge in it. Compute the force.",
      "given": "E = 50 N/C in +x · q = −2 C",
      "equation": "F = E·q",
      "work": "F = 50 · (−2)\nF = −100 N (in +x direction)\nF = 100 N pointing in −x (LEFT)",
      "answer": "F = 100 N to the LEFT. Negative charges feel force OPPOSITE to E."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — FIELD FROM A + CHARGE. A +5 μC point charge is fixed at the origin. What's the electric field magnitude at a point 0.10 m away? (E = kq/r², for a point source.)",
      "givenHint": "q = 5 × 10⁻⁶ C · r = 0.10 m · k = 9 × 10⁹ N·m²/C²",
      "equationHint": "E = kq/r² — one charge, so no q₂. Expect a few million N/C.",
      "equationOptions": [
        "E = kq/r²",
        "E = F/q",
        "F = k·q₁·q₂/r²",
        "F = E·q"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Day 1's mystery, solved",
      "markdown": "The paper bits leaping to the balloon: the balloon's negative charge creates an E field. The neutral paper polarizes — its + side closer to the balloon — so the attractive force on the + side wins. NEUTRAL objects feel forces in NON-UNIFORM fields."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "An electric field E = 100 N/C points east. A −1 μC charge sits in the field. What force does it feel? (Magnitude AND direction.) Show one line of work. Then complete the frame.",
      "frame": "Electric field lines come OUT of ___ charges, IN to ___ charges. The force on a charge q is F = ___. For a positive q, F points along ___; for a negative q, F points ___."
    },
    {
      "id": "rd-ch33-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **33.1–33.3** (electric fields, field lines, and shielding). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch33-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 33,
      "title": "Electric Fields and Potential — read & practice",
      "sectionIds": [
        "33.1",
        "33.2",
        "33.3"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k2-electric-field"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 4 — Voltage: Energy per Charge', 'u7-d04', 'Unit 7: Electricity & Magnetism', 4, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe voltage as the ENERGY each coulomb of charge carries (J/C), use the water-tank analogy to predict whether charge will flow, and identify the voltage of common sources (AA = 1.5V, 9V battery, household = 120V).",
      "targetId": "u7.k3-voltage"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Unit 4: energy is conserved and can be transferred. From Day 1: charge is the fundamental quantity.",
      "connection": "Voltage marries them: how much ENERGY each unit of CHARGE carries. The 9V battery in the Car Project (Day 17 preview) carries 9 J per C."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Energy per coulomb\n\nVoltage glues Unit 4 (energy) to Unit 7 (charge):\n\n**V = U / q** — joules of energy carried PER COULOMB of charge.\n\nA 9V battery stamps 9 J onto every coulomb that passes through it. A 1.5V AA cell: only 1.5 J/C. A wall outlet: 120 J/C. Rearranged, **U = q·V** tells you the TOTAL energy delivered when charge q flows through voltage V.\n\nThe water-tank picture: voltage is like water-tank HEIGHT. Water flows from the high tank to the low tank — and charge flows from high voltage to low voltage. No height difference, no flow; no voltage difference, no current. (Current itself is tomorrow.)\n\nCommon sources to memorize: **AA cell = 1.5V · 9V battery = 9V · car battery = 12V · US household outlet = 120V**."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Voltage (V)",
          "definition": "Electric potential difference. The energy carried per coulomb of charge. V = U / q. Units: volts (V) = joules / coulomb. A 9V battery means 9 J of energy per coulomb of charge that passes through. A 1.5V AA cell: 1.5 J/C.",
          "cognate": "Sp. voltaje · Pt. voltagem · HC voltaj"
        },
        {
          "term": "Electric potential energy (U)",
          "definition": "The energy a charge has due to its position in an electric field. Like gravitational PE = mgh, but for charge: U = q·V. A 0.5 C charge in a 9V battery has U = 0.5 · 9 = 4.5 J of potential energy waiting to be released through the circuit. Potential energy belongs to the CHARGE; voltage is per-coulomb.",
          "cognate": "Sp. energía potencial eléctrica · Pt. energia potencial elétrica · HC enèji potansyèl elektrik"
        },
        {
          "term": "EMF (electromotive force)",
          "definition": "The voltage a battery (or other source) PROVIDES to push charge around a circuit. Confusingly NOT a force — it's a voltage. Symbol: ε. Units: volts. A fresh 9V battery has EMF ≈ 9V; as it drains, the EMF drops. The 'force' name is historical.",
          "cognate": "Sp. fuerza electromotriz · Pt. força eletromotriz · HC fòs elektwomotè"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Voltage is energy PER charge — not total energy",
      "markdown": "A 9V battery has limited TOTAL energy (depends on its size) but the same 9V no matter how full. And EMF is measured in VOLTS, not newtons — the 'force' word is misleading; it's really a per-charge ENERGY."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Two water tanks at different heights. Label which is 'high voltage' and which is 'low voltage'. Mark the JOULES PER COULOMB analogy.",
      "prompts": [
        "Two tanks, one higher than the other.",
        "Arrow for the flow direction (high → low).",
        "Label: height ↔ voltage, water ↔ charge."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "ENERGY DELIVERED BY A BATTERY — A 9V battery pushes 0.5 C of charge through a circuit. How much energy did the battery deliver?",
      "given": "V = 9 V · q = 0.5 C",
      "equation": "U = q·V",
      "work": "U = 0.5 · 9\nU = 4.5 J",
      "answer": "U = 4.5 J of electrical energy delivered to the circuit."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "SAME CHARGE, DIFFERENT BATTERY — The same 0.5 C of charge passes through a 1.5V AA battery. How much energy this time?",
      "given": "V = 1.5 V · q = 0.5 C",
      "equation": "U = q·V",
      "work": "U = 0.5 · 1.5\nU = 0.75 J",
      "answer": "U = 0.75 J. Same charge, less voltage → less energy. Six times less, because 9/1.5 = 6."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — CHARGE NEEDED FOR 100 J. You want a 9V battery to deliver 100 J of energy to a circuit. How many coulombs of charge must flow through?",
      "givenHint": "V = 9 V · U = 100 J · q = ?",
      "equationHint": "Rearrange U = q·V to solve for q. Expect a number bigger than 10.",
      "equationOptions": [
        "q = U/V",
        "U = q·V",
        "V = U/q",
        "I = q/t"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Why so many small batteries?",
      "markdown": "AA is 1.5V — too low for most uses. So we stack them in series: 4 AA = 6V, 6 AA = 9V. **Voltages in series ADD.** The Car Project uses a single 9V (compact rectangular) for simplicity."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "How much energy does a 12V car battery deliver when 1.0 C of charge flows through it? Show one line of work. Then complete the frame.",
      "frame": "Voltage measures ___ per ___. A 9V battery gives ___ J to every coulomb of charge that flows through. To deliver more total energy, you need more ___ (charge to flow)."
    },
    {
      "id": "rd-ch33-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **33.4–33.7** (electrical potential energy, electric potential (voltage), energy storage, and the Van de Graaff generator). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch33-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 33,
      "title": "Electric Fields and Potential — read & practice",
      "sectionIds": [
        "33.4",
        "33.5",
        "33.6",
        "33.7"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k3-voltage"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 5 — Current: I = q/t', 'u7-d05', 'Unit 7: Electricity & Magnetism', 5, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe current as the RATE of charge flow (coulombs per second), distinguish conventional current from electron flow, and compute current from charge and time.",
      "targetId": "u7.k4-current"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Day 4: voltage = energy per charge.",
      "connection": "Today: how FAST charge flows. Voltage and current together (Day 6) = power (Day 11) — the framework for predicting the Car motor (Day 17)."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Charge per second\n\nVoltage told us how much energy each coulomb carries. Current tells us how many coulombs go by each second:\n\n**I = q / t** — coulombs PER SECOND, measured in amperes (A). 1 A = 1 C/s.\n\nIt's a RATE, like Unit 1's speed: speed was meters per second of position; current is coulombs per second of charge. Rearranged, **q = I·t** gives the total charge that passes in time t.\n\nOne historical wrinkle: in a copper wire the things that actually move are ELECTRONS, drifting from the − terminal toward +. But the arrows we draw — **conventional current** — point the way POSITIVE charge would flow, from + to −. Ben Franklin guessed wrong about which charge moves, and we kept his convention. Same physics, opposite arrow.\n\nBenchmarks: phone charger ≈ 1 A · Car Project motor ≈ 2 A · car headlight 5–10 A · microwave 12 A · lightning bolt peak 30,000 A."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Electric current (I)",
          "definition": "Rate of charge flow past a point. I = q / t. Units: amperes (A) = coulombs / second. A 1A current means 1 coulomb of charge passes a given cross-section every second. A USB phone charger ≈ 1 A. The Car motor ≈ 2 A.",
          "cognate": "Sp. corriente eléctrica · Pt. corrente elétrica · HC kouran elektrik"
        },
        {
          "term": "Conventional current (vs. electron flow)",
          "definition": "Conventional current = direction POSITIVE charges would flow (high V to low V). Actual electrons flow OPPOSITE — from low V to high V (− terminal to + terminal). In a copper wire, electrons drift from − to +, but we draw current arrows from + to −. Same idea, opposite arrow.",
          "cognate": "Sp. corriente convencional · Pt. corrente convencional · HC kouran konvansyonèl"
        },
        {
          "term": "Ampere (A)",
          "definition": "The SI unit of current. 1 A = 1 C/s. Named for André-Marie Ampère. Phone charger: 1 A. Car headlight: 5–10 A. Microwave: 12 A. Lightning bolt peak: 30,000 A.",
          "cognate": "Sp. amperio · Pt. ampère · HC anpè"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Current (rate) is not charge (amount)",
      "markdown": "Don't confuse 'A' (amps) with 'C' (coulombs). A is a RATE; C is an AMOUNT. 1A flowing for 1s = 1C; the same 1A flowing for 10s = 10C. Just like speed vs. distance."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "A wire seen in cross-section. Electrons (each carrying −e) flow one way; conventional current is drawn the OPPOSITE way. Label both. How would you count current?",
      "prompts": [
        "Wire cross-section with electrons drifting one way.",
        "Conventional-current arrow the OPPOSITE way.",
        "Write how you'd COUNT the current (charge past the line per second)."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "CURRENT FROM CHARGE AND TIME — A 30 C of charge passes through a wire in 10 seconds. What's the current?",
      "given": "q = 30 C · t = 10 s",
      "equation": "I = q/t",
      "work": "I = 30 / 10\nI = 3 A",
      "answer": "I = 3 A (3 coulombs per second)."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "CHARGE FROM CURRENT AND TIME — A 2 A current flows for 60 seconds. How much charge passes?",
      "given": "I = 2 A · t = 60 s",
      "equation": "q = I·t",
      "work": "q = 2 · 60\nq = 120 C",
      "answer": "q = 120 C of charge passes in 1 minute at 2 A."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — CAR MOTOR CURRENT (PREVIEW). The Car Project motor pulls about 2 A for the duration of a 15-second race. How much total charge flows through the motor?",
      "givenHint": "I = 2 A · t = 15 s · q = ?",
      "equationHint": "q = I·t — same move as the second worked example.",
      "equationOptions": [
        "q = I·t",
        "I = q/t",
        "U = q·V",
        "V = I·R"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "30 C through the motor — and 270 J",
      "markdown": "2 A · 15 s = 30 C of charge through the motor. Each coulomb carries 9 J (from the 9V battery), so total energy delivered = 30 · 9 = 270 J. Day 11 (power) ties this together."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 0.5 A current flows for 5 minutes. How many coulombs of charge pass? Show one line of work. (Careful — convert minutes to seconds.) Then complete the frame.",
      "frame": "Current is ___ per second. 1 A = 1 ___ / s. Conventional current flows from ___ terminal to ___ terminal. Electrons actually flow the opposite direction."
    },
    {
      "id": "rd-ch34-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **34.1–34.4** (flow of charge, electric current, voltage sources, and resistance). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch34-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 34,
      "title": "Electric Current — read & practice",
      "sectionIds": [
        "34.1",
        "34.2",
        "34.3",
        "34.4"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k4-current"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 6 — Ohm''s Law: V = IR', 'u7-d06', 'Unit 7: Electricity & Magnetism', 6, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply V = IR to compute any one of V, I, or R given the other two; explain RESISTANCE as 'how hard charge has to push through' a component; and use the triangle to read off the formula.",
      "targetId": "u7.k5-ohms-law"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Day 4: voltage. From Day 5: current. These two are linked by RESISTANCE.",
      "connection": "Ohm's law is the master equation of every circuit — and the equation that lets us PREDICT the Car motor's current on Day 17 (given V and R)."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The master equation\n\nVoltage pushes; resistance pushes back; current is what results:\n\n**V = I · R**\n\nResistance R measures how hard charge has to push through a component, in ohms (Ω). 1 Ω = 1 V/A. Crank up V and current rises; crank up R and current falls.\n\nThe three equivalent forms — pick the one that solves for your unknown:\n\n| Want | Use |\n|------|-----|\n| Voltage | **V = I·R** |\n| Current | **I = V/R** |\n| Resistance | **R = V/I** |\n\nThe TRIANGLE trick: V on top, I and R on the bottom. Cover the unknown and read off the formula.\n\nFeel for the numbers: copper wire ≈ 0.01 Ω (almost free) · a motor ≈ 3–5 Ω · a toaster element ≈ 15 Ω · an incandescent bulb ≈ 100 Ω. An open switch is R = infinity (no current); a short circuit is R ≈ 0 (huge current — dangerous)."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Resistance (R)",
          "definition": "How much a component opposes the flow of charge. R = V / I. Units: ohms (Ω). 1 Ω = 1 V/A. A copper wire: R ≈ 0.01 Ω (very low). A motor: R ≈ 3–5 Ω. An incandescent lightbulb: R ≈ 100 Ω. A toaster element: R ≈ 15 Ω (carries a lot of current).",
          "cognate": "Sp. resistencia · Pt. resistência · HC rezistans"
        },
        {
          "term": "Ohm's law",
          "definition": "V = I · R. Equivalent forms: I = V/R, R = V/I. The TRIANGLE: cover the unknown, read the formula. 9V across a 3Ω motor → I = V/R = 9/3 = 3 A. Works for OHMIC materials — metals at constant temperature; bulbs and motors are not strictly ohmic (R changes with temperature), but we use it as an approximation.",
          "cognate": "Sp. ley de Ohm · Pt. lei de Ohm · HC lwa Ohm"
        },
        {
          "term": "Ohm (Ω)",
          "definition": "SI unit of resistance. 1 Ω = 1 V/A. Named for Georg Ohm. Common resistor values: 100 Ω, 1 kΩ, 10 kΩ, 1 MΩ — sized for the current and voltage of your circuit. (Capital omega Ω is 'ohm'; lowercase ω is angular frequency — different concept.)",
          "cognate": "Sp. ohmio · Pt. ohm · HC ohm"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "High R means LITTLE current — and R ≈ 0 means danger",
      "markdown": "High R = LITTLE current at a given V (and vice versa). An open switch is R = infinity (no current at all). A short circuit is R ≈ 0 — Ohm's law then demands a HUGE current, which overheats wires. That's why shorts are dangerous."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "circuit",
      "title": "The simplest circuit Ohm's law describes",
      "caption": "One loop: battery (the V), switch, resistor (the R). Close the switch and one current I = V/R flows around the whole loop. This is also EXACTLY the Car Project circuit — swap the resistor for a motor.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "battery (V)"
        },
        {
          "kind": "switch",
          "side": "top",
          "label": "switch"
        },
        {
          "kind": "resistor",
          "side": "right",
          "label": "resistor (R)"
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the Ohm's triangle. Cover V → read V = IR. Cover I → read I = V/R. Cover R → read R = V/I. Practice each.",
      "prompts": [
        "Triangle: V on top, I and R on the bottom.",
        "Cover each letter in turn and write the formula you read.",
        "Three formulas total — check them against the table."
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "CURRENT THROUGH A RESISTOR — A 6V battery is connected across a 12Ω resistor. What's the current?",
      "given": "V = 6 V · R = 12 Ω",
      "equation": "I = V/R",
      "work": "I = 6 / 12\nI = 0.5 A",
      "answer": "I = 0.5 A through the resistor."
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "RESISTANCE FROM V AND I — A circuit measures V = 9V across a component and I = 3 A through it. What's the resistance?",
      "given": "V = 9 V · I = 3 A",
      "equation": "R = V/I",
      "work": "R = 9 / 3\nR = 3 Ω",
      "answer": "R = 3 Ω."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — VOLTAGE ACROSS A COMPONENT. A current of 2.5 A flows through a 4 Ω resistor. What's the voltage across it?",
      "givenHint": "I = 2.5 A · R = 4 Ω · V = ?",
      "equationHint": "Cover the V on the triangle: V = I·R.",
      "equationIds": [
        "ohms-law"
      ]
    },
    {
      "id": "b11",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — CAR MOTOR CURRENT PREVIEW. Estimate: the Car Project motor has R ≈ 4 Ω (estimated). Connected to a 9V battery, what current will it draw?",
      "givenHint": "V = 9 V · R ≈ 4 Ω · I = ?",
      "equationHint": "Cover the I on the triangle: I = V/R. Expect a bit over 2 A.",
      "equationIds": [
        "ohms-law"
      ]
    },
    {
      "id": "b12",
      "type": "callout",
      "variant": "note",
      "title": "Your first Car Project prediction",
      "markdown": "9V / 4Ω = 2.25 A. That's the Car motor current PREDICTED from Ohm's law. Day 17 you'll do this prediction in full detail. Day 18 transfer task will ask you to predict again. Day 1 of Unit 8: you'll MEASURE."
    },
    {
      "id": "b13",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 12V battery drives 4 A through a wire-wound resistor. What's the resistance? Show one line of work. Then complete the frame.",
      "frame": "Ohm's law says V = ___. To find current, use I = ___. To find resistance, use R = ___. A 'short circuit' has R close to ___, leading to a ___ current."
    },
    {
      "id": "rd-ch34-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **34.5–34.10** (Ohm's law, electric shock, DC vs. AC, converting AC to DC, and how electrons actually move in a circuit). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch34-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 34,
      "title": "Electric Current — read & practice",
      "sectionIds": [
        "34.5",
        "34.6",
        "34.7",
        "34.8",
        "34.9",
        "34.10"
      ]
    },
    {
      "id": "b14",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k5-ohms-law"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 7 — Series Circuits', 'u7-d07', 'Unit 7: Electricity & Magnetism', 7, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can identify a series circuit, add resistances to find the total, compute the SHARED current using V = IR, and explain why an open switch (or broken wire) kills the whole circuit.",
      "targetId": "u7.s1-series-circuits"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Day 6: V = IR for a single component.",
      "connection": "Today: what happens when multiple resistances are in a single loop — the SAME current passes through all. Day 8: the other way to wire them."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## One path, one current\n\nA **series circuit** is a single loop: current leaves the battery, passes through every component in order, and returns. One path means one rule above all:\n\n**The SAME current flows through every component.**\n\nThe current sees the resistances stacked along its one path, so they simply add:\n\n**R_series = R₁ + R₂ + R₃ + ...** — always BIGGER than any one component.\n\nThe recipe for any series problem:\n\n1. Add the resistances → R_total.\n2. **I = V / R_total** → the one shared current.\n3. **V_i = I · R_i** → the voltage across each component.\n\nStep 3 reveals the series circuit's second personality: it's a **voltage divider**. The source voltage splits among the components in proportion to their resistance — and the pieces always add back up to the source.\n\nThe dark side of one path: break the loop ANYWHERE (open switch, burned-out bulb, cracked wire) and current stops EVERYWHERE."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Series circuit",
          "definition": "One single path for current. Components are connected end-to-end. The SAME current passes through every component. Three resistors (2Ω, 3Ω, 5Ω) in series across 9V: R_total = 10Ω; I = 0.9 A through all three.",
          "cognate": "Sp. circuito en serie · Pt. circuito em série · HC sikui an seri"
        },
        {
          "term": "R_series (total resistance)",
          "definition": "R_series = R₁ + R₂ + R₃ + ... Just add them. Always BIGGER than any one component. 2Ω + 3Ω + 5Ω = 10Ω total — the current sees the SUM of resistances along its one path. Adding resistors in series ALWAYS increases resistance; parallel (Day 8) does the opposite.",
          "cognate": "Sp. resistencia total · Pt. resistência total · HC rezistans total"
        },
        {
          "term": "Voltage divider",
          "definition": "A series circuit DIVIDES the source voltage across components in proportion to their resistance. V_i = (R_i / R_total) · V_source. 9V across 2Ω + 3Ω + 5Ω: V₁ = (2/10)·9 = 1.8V, V₂ = (3/10)·9 = 2.7V, V₃ = (5/10)·9 = 4.5V. Sum = 9V ✓.",
          "cognate": "Sp. divisor de voltaje · Pt. divisor de tensão · HC divizè vòltaj"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Series divides VOLTAGE, not current",
      "markdown": "In series, the CURRENT is the same everywhere — it's the VOLTAGE that divides among components (proportional to each R), and those voltages ADD UP TO the source. Don't split the current."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "circuit",
      "title": "Three resistors in one series loop",
      "caption": "Battery → R₁ → R₂ → R₃ → back to battery. One loop, so the SAME 0.9 A flows through all three (for the 9V worked example below). The 9 V divides: 1.8 V + 2.7 V + 4.5 V = 9 V.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "9V battery"
        },
        {
          "kind": "resistor",
          "side": "top",
          "label": "R₁ = 2Ω"
        },
        {
          "kind": "resistor",
          "side": "right",
          "label": "R₂ = 3Ω"
        },
        {
          "kind": "resistor",
          "side": "bottom",
          "label": "R₃ = 5Ω"
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the schematic: battery + three resistors in series. Mark current with an arrow. Mark voltage across each resistor. Verify that V₁ + V₂ + V₃ = V_battery.",
      "prompts": [
        "One loop: battery + three resistors end-to-end.",
        "ONE current arrow around the loop.",
        "Label V across each R and check the sum."
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "THREE RESISTORS IN SERIES — 9V battery across R₁ = 2Ω, R₂ = 3Ω, R₃ = 5Ω in series. Find: R_total, current through each, voltage across each.",
      "given": "V = 9 V · R₁ = 2 Ω · R₂ = 3 Ω · R₃ = 5 Ω",
      "equation": "R_series = R₁ + R₂ + R₃ ; I = V / R_total ; V_i = I · R_i",
      "work": "R_total = 2 + 3 + 5 = 10 Ω\nI = 9 / 10 = 0.9 A (through ALL three)\nV₁ = 0.9 · 2 = 1.8 V\nV₂ = 0.9 · 3 = 2.7 V\nV₃ = 0.9 · 5 = 4.5 V\nCheck: 1.8 + 2.7 + 4.5 = 9.0 V ✓",
      "answer": "I = 0.9 A through all. Voltages 1.8 V / 2.7 V / 4.5 V — they add to 9 V."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — TWO RESISTORS IN SERIES. 12V across 4Ω + 8Ω in series. Find R_total, I, and the voltage across each.",
      "givenHint": "V = 12 V · R₁ = 4 Ω · R₂ = 8 Ω (series)",
      "equationHint": "Same three steps: R_total = R₁ + R₂, then I = V/R_total, then V_i = I·R_i. Check that the two voltages add to 12 V.",
      "equationOptions": [
        "R_series = R₁ + R₂ ; I = V/R_total ; V_i = I·R_i",
        "1/R_p = 1/R₁ + 1/R₂",
        "V = I·R only",
        "q = I·t"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Break one, lose all",
      "markdown": "Series Christmas-tree lights from the old days: one bulb burns out → the whole string dies. That's the BREAK-ONE-LOSE-ALL rule of series. Modern strings put bulbs in parallel — Day 8. The Car Project is a SERIES circuit (battery → switch → motor → back to battery)."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "9V across three 3Ω resistors in series. Find R_total and the current. Show one line of work for each. Then complete the frame.",
      "frame": "In a series circuit, the CURRENT is the same through every ___. The VOLTAGES across components ADD up to the ___. Total resistance is the ___ of individual resistances."
    },
    {
      "id": "rd-ch35-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **35.1–35.3** (a battery and a bulb, electric circuits, and series circuits). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch35-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 35,
      "title": "Electric Circuits — read & practice",
      "sectionIds": [
        "35.1",
        "35.2",
        "35.3"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.s1-series-circuits"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 8 — Parallel Circuits', 'u7-d08', 'Unit 7: Electricity & Magnetism', 8, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can identify a parallel circuit, compute total resistance using the reciprocal rule, compute the SHARED voltage and the CURRENT IN EACH BRANCH, and explain why one branch can fail without breaking the others.",
      "targetId": "u7.s2-parallel-circuits"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Day 7: series — one path, shared current.",
      "connection": "Today: multiple paths, shared voltage. Real-world appliances are almost always wired in parallel (so your toaster doesn't die when the microwave is unplugged)."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Many paths, one voltage\n\nA **parallel circuit** flips every series rule. Instead of one loop, the current has multiple independent branches between the same two nodes. The headline rule:\n\n**The SAME voltage is across every branch.**\n\nEach branch then draws its own current by Ohm's law — **I_i = V / R_i** — and the branch currents ADD to give the total leaving the battery. Lower-R branches hog more current (a **current divider**).\n\nCombined resistance uses the reciprocal rule:\n\n**1/R_parallel = 1/R₁ + 1/R₂ + 1/R₃ + ...**\n\nThe result is always SMALLER than the smallest branch — more paths means easier flow. Handy special case: two equal resistors in parallel give R/2.\n\nWhy your house is wired this way: every outlet gets the full 120V regardless of what's plugged in elsewhere, and one dead lamp doesn't kill the refrigerator. Each branch lives independently — the opposite of series' break-one-lose-all."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Parallel circuit",
          "definition": "Multiple independent paths between two nodes. The SAME voltage is across each branch. Your house's wall outlets are in parallel — each receives 120V regardless of what's plugged into the others.",
          "cognate": "Sp. circuito en paralelo · Pt. circuito em paralelo · HC sikui paralèl"
        },
        {
          "term": "R_parallel (combined)",
          "definition": "1/R_parallel = 1/R₁ + 1/R₂ + 1/R₃ + ... Always SMALLER than the smallest individual R. Two equal resistors in parallel: R_p = R/2. Example: 3Ω || 6Ω: 1/R = 1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2 → R = 2Ω. Smaller than either! Adding MORE branches LOWERS total R (more paths for current).",
          "cognate": "Sp. resistencia en paralelo · Pt. resistência em paralelo · HC rezistans paralèl"
        },
        {
          "term": "Current divider",
          "definition": "A parallel circuit divides current among branches inversely with resistance. Lower R = more current; higher R = less current. 9V across 3Ω || 6Ω: each branch sees 9V. I₁ = 9/3 = 3 A; I₂ = 9/6 = 1.5 A. Total I_in = 4.5 A.",
          "cognate": "Sp. divisor de corriente · Pt. divisor de corrente · HC divizè kouran"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Parallel divides CURRENT, not voltage — and a short steals everything",
      "markdown": "In PARALLEL, the SAME voltage is across each branch; it's the CURRENT that divides (more through lower-R branches). In the limit of R → 0 (a short circuit), ALL the current goes through that branch — burning out the wire."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw three resistors in parallel across a battery. Each branch sees the full battery voltage. Mark currents in each branch. Verify I_total = I₁ + I₂ + I₃.",
      "prompts": [
        "Battery on the left; three side-by-side branches, each its own resistor.",
        "Label 9V across EVERY branch.",
        "Branch current arrows — check they add to I_total."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "THREE RESISTORS IN PARALLEL — 9V battery across R₁ = 3Ω, R₂ = 6Ω, R₃ = 9Ω in parallel. Find: voltage on each, current in each, total current, R_parallel.",
      "given": "V = 9 V · R₁ = 3 Ω · R₂ = 6 Ω · R₃ = 9 Ω (all in parallel)",
      "equation": "V is the SAME on each branch ; I_i = V / R_i ; 1/R_p = Σ(1/R_i)",
      "work": "V₁ = V₂ = V₃ = 9 V\nI₁ = 9/3 = 3 A\nI₂ = 9/6 = 1.5 A\nI₃ = 9/9 = 1.0 A\nI_total = 3 + 1.5 + 1.0 = 5.5 A\n1/R_p = 1/3 + 1/6 + 1/9 = 6/18 + 3/18 + 2/18 = 11/18\nR_p = 18/11 ≈ 1.64 Ω\nCheck: 9 / 1.64 ≈ 5.5 A ✓",
      "answer": "Each branch sees 9V. Currents 3 A / 1.5 A / 1.0 A. R_parallel ≈ 1.64 Ω."
    },
    {
      "id": "b8",
      "type": "diagram",
      "kind": "circuit",
      "title": "What the battery 'sees' — the equivalent loop",
      "caption": "This diagram can only draw ONE loop, so it shows the worked example AFTER reduction: the three parallel branches (3Ω, 6Ω, 9Ω) collapse into a single equivalent resistor R_p ≈ 1.64 Ω. From the battery's point of view the two circuits are identical: same 9 V, same 5.5 A.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "9V battery"
        },
        {
          "kind": "resistor",
          "side": "right",
          "label": "R_p ≈ 1.64Ω (3Ω ∥ 6Ω ∥ 9Ω)"
        }
      ]
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — TWO EQUAL RESISTORS IN PARALLEL. Two 10Ω resistors in parallel. What's R_parallel? If 12V is applied, what's the current in each branch and total?",
      "givenHint": "R₁ = R₂ = 10 Ω (parallel) · V = 12 V",
      "equationHint": "Shortcut for two EQUAL resistors: R_p = R/2. Then each branch: I = V/R. Total = sum of branches.",
      "equationOptions": [
        "1/R_p = 1/R₁ + 1/R₂ ; I_i = V/R_i",
        "R_series = R₁ + R₂",
        "V_i = (R_i/R_total)·V",
        "U = q·V"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Why circuit breakers exist",
      "markdown": "A house has many appliances in parallel. The TV doesn't care if the lamp is on. But every parallel branch DRAWS current from the main supply — too many high-draw devices, and the circuit breaker trips (typically at 15 or 20 A) to prevent wire overheating."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "12V across 4Ω || 6Ω. Find R_parallel and the current in each branch. Show one line of work per quantity. Then complete the frame.",
      "frame": "In a parallel circuit, the VOLTAGE is the same across every ___. The CURRENTS in each branch ADD up to the ___ current. Total resistance is ___ than any individual resistance."
    },
    {
      "id": "rd-ch35-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **35.4** (parallel circuits). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch35-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 35,
      "title": "Electric Circuits — read & practice",
      "sectionIds": [
        "35.4"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.s2-parallel-circuits"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 9 — Combination Circuits', 'u7-d09', 'Unit 7: Electricity & Magnetism', 9, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can analyze a circuit that mixes series and parallel by collapsing parallel sections first, then adding remaining series resistors, finding total current at the battery, and working backward to find current/voltage in each branch.",
      "targetId": "u7.s3-combination-circuits"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Day 7 (series) and Day 8 (parallel). Each works in isolation.",
      "connection": "Real circuits mix BOTH. The reduction technique is a Unit 7 problem-solving skill — and shows up on the Day 18 transfer task."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Reduce piece-by-piece\n\nReal circuits mix series and parallel in the same loop. You don't need new physics — you need a STRATEGY: collapse the circuit one chunk at a time until it's simple, then trace your way back.\n\n**The reduction recipe:**\n\n1. Identify the innermost **parallel** groups.\n2. Replace each with its equivalent resistance R_eq (reciprocal rule, or R_eq = R₁R₂/(R₁+R₂) for two).\n3. The circuit is now pure **series** — add everything up → R_total.\n4. **I_total = V / R_total** gives the battery current.\n5. **Trace backward**: use I_total to find the voltage across each section, then Ohm's law inside each parallel group for the branch currents.\n\nTwo sanity checks that catch almost every error: voltages around the loop must add to the battery voltage, and branch currents must add back to I_total."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Combination circuit",
          "definition": "A circuit containing BOTH series and parallel sections. Analyzed by REDUCING — collapse parallel groups first, then add what remains in series. Example: battery → R₁ in series → (R₂ || R₃) → back to battery. Step 1: combine R₂ || R₃ → R_eq. Step 2: R_total = R₁ + R_eq.",
          "cognate": "Sp. circuito combinado · Pt. circuito combinado · HC sikui konbine"
        },
        {
          "term": "Equivalent resistance",
          "definition": "A single value that 'replaces' a complex sub-circuit. Same voltage, same total current. 3Ω || 6Ω → R_eq = 2Ω: from the rest of the circuit's perspective, it sees ONE 2Ω resistor instead of two in parallel. A calculation tool, not a real component — simplify, then trace back for branch details.",
          "cognate": "Sp. resistencia equivalente · Pt. resistência equivalente · HC rezistans ekivalan"
        },
        {
          "term": "Reduction strategy",
          "definition": "(1) Identify innermost parallel groups. (2) Replace each with R_eq. (3) Now the circuit is pure series; add up. (4) Use V = IR_total for battery current. (5) Trace backward. See the worked example — a 3-step reduction.",
          "cognate": "Sp. reducción del circuito · Pt. redução do circuito · HC redui sikui a"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Don't write one huge equation",
      "markdown": "It's tempting to cram the whole circuit into a single formula. DON'T. Reduce step by step — fewer errors, easier to check. Big-picture currents come from R_total; backward-trace gives branch details."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "circuit",
      "title": "The worked example, drawn as its reduced loop",
      "caption": "Battery → R₁ = 2Ω in series → a parallel pair (R₂ = 4Ω ∥ R₃ = 4Ω) drawn here as its single equivalent, R_eq = 2Ω. The diagram can only draw one series loop — the parallel pair really splits into two side-by-side 4Ω branches that share 4.5 V.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "9V battery"
        },
        {
          "kind": "resistor",
          "side": "top",
          "label": "R₁ = 2Ω (series)"
        },
        {
          "kind": "resistor",
          "side": "right",
          "label": "R_eq = 2Ω (4Ω ∥ 4Ω)"
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Three steps of the reduction. ORIGINAL → collapse parallel → final series → total. Mark each R, each current direction, and the answers at each step.",
      "prompts": [
        "Panel 1: the original circuit with the parallel pair drawn as two branches.",
        "Panel 2: parallel pair replaced by R_eq.",
        "Panel 3: one loop, one R_total — write I_total."
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "SERIES + PARALLEL COMBINATION — 9V battery → R₁ = 2Ω in series → (R₂ = 4Ω || R₃ = 4Ω) → back to battery. Find R_total, I_total (battery current), V across each section, and current in each parallel branch.",
      "given": "V = 9 V · R₁ = 2 Ω (series) · R₂ = R₃ = 4 Ω (parallel pair)",
      "equation": "STEP 1: R_eq of parallel pair. STEP 2: R_total = R₁ + R_eq. STEP 3: I_total = V/R_total. STEP 4: trace.",
      "work": "STEP 1: R_eq = (R₂·R₃)/(R₂+R₃) = (4·4)/(4+4) = 16/8 = 2 Ω\nSTEP 2: R_total = R₁ + R_eq = 2 + 2 = 4 Ω\nSTEP 3: I_total = 9 / 4 = 2.25 A (through battery + R₁)\nSTEP 4: V across R₁ = 2.25 · 2 = 4.5 V\n      V across the parallel pair = 9 − 4.5 = 4.5 V\n      I₂ = 4.5 / 4 = 1.125 A ; I₃ = 4.5 / 4 = 1.125 A\n      Check: I₂ + I₃ = 2.25 A = I_total ✓",
      "answer": "R_total = 4 Ω · I_total = 2.25 A · V on R₁ = 4.5 V · V on pair = 4.5 V · I in each branch = 1.125 A."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — MIXED REDUCTION. 12V → R₁ = 3Ω in series → (R₂ = 6Ω || R₃ = 3Ω) → back. Find R_total, I_total, and current in each parallel branch.",
      "givenHint": "V = 12 V · R₁ = 3 Ω (series) · R₂ = 6 Ω || R₃ = 3 Ω",
      "equationHint": "Step 1: R_eq = (6·3)/(6+3). Step 2: add R₁. Step 3: I_total = V/R_total. Step 4: V across the pair = 12 − I_total·R₁, then each branch current by Ohm's law.",
      "equationOptions": [
        "R_eq = (R₂·R₃)/(R₂+R₃) ; R_total = R₁ + R_eq ; I = V/R_total",
        "R_total = R₁ + R₂ + R₃",
        "1/R_total = 1/R₁ + 1/R₂ + 1/R₃",
        "V = I·R only"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Inside-out reduction",
      "markdown": "Identify the deepest parallel group → collapse → then series-add what's left. This is a problem-solving SKILL, not a formula. Practice on a few until it's automatic."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "9V → R₁ = 1Ω in series → (R₂ = 4Ω || R₄ = 4Ω) → back. Find R_total and I_total. Show work for both reduction steps. Then complete the frame.",
      "frame": "Reduce a combination circuit by collapsing ___ groups first, then adding remaining ___ resistances. Find I_total from ___, then trace BACKWARD to find current in each ___."
    },
    {
      "id": "rd-ch35-c",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **35.5–35.7** (schematic diagrams, combining resistors, and overloading/home circuits). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch35-c",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 35,
      "title": "Electric Circuits — read & practice",
      "sectionIds": [
        "35.5",
        "35.6",
        "35.7"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.s3-combination-circuits"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 10 — Vernier Circuit Lab (Investigation 7.1)', 'u7-d10', 'Unit 7: Electricity & Magnetism', 10, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can wire a circuit with a Vernier voltmeter (parallel) and ammeter (series), read V and I correctly, verify V = IR for a single resistor, and confirm the series rule (same I) and the parallel rule (same V).",
      "targetId": "u7.s4-vernier-circuit-lab"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Days 6-9 gave us the EQUATIONS. Today we verify them in the lab.",
      "connection": "If V = IR holds for resistors we measure, we trust it for the Car motor on Day 17."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 7.1 — Verify Ohm's law + circuit rules",
      "markdown": "**Driving question:** Can we verify Ohm's law (V = IR) and the series + parallel circuit rules using a Vernier voltmeter and ammeter on a small DC circuit?\n\n**Equipment:** Vernier LabQuest + voltage probe + current probe (one set per pair) · DC power supply or 9V battery + battery holder · set of resistors: 100 Ω, 220 Ω, 470 Ω (color bands provided) · breadboard + jumper wires · switch (push-button or toggle).\n\n**How this lab serves the year's question:** if the Ohm's law verification is within 5%, you trust V = IR for the Car motor prediction (Day 17). Same physics, scaled up to a working motor."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "**PART A — Ohm's law check.** Build: battery → switch → ammeter (in SERIES with one resistor) → back. Voltmeter ACROSS the resistor (in parallel).",
        "Choose three resistors (100 Ω, 220 Ω, 470 Ω). For each, close switch, read V and I, compute R_measured = V/I.",
        "Compare to nominal R (color-band value). Compute percent error.",
        "**PART B — Series rule.** Build battery → switch → ammeter → R₁ → R₂ → back. Voltmeter across EACH resistor in turn.",
        "Check: same I throughout? V₁ + V₂ = V_battery?",
        "**PART C — Parallel rule.** Build battery → switch → split into two branches, R₁ and R₂. Ammeter in each branch separately. Voltmeter across the parallel pair.",
        "Check: same V across each branch? I₁ + I₂ = total I (from battery)?"
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "Don't short-circuit the battery (positive directly to negative). High current can overheat wires + drain battery in seconds. Use the switch — open before rewiring."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "misconception",
      "title": "Ammeter in SERIES, voltmeter in PARALLEL",
      "markdown": "Ammeter goes in SERIES (broken into the circuit). Voltmeter goes in PARALLEL (across the component). Hooking them up the wrong way is a common error — and a voltmeter wired in series sees no current, while an ammeter in parallel can short out and damage itself."
    },
    {
      "id": "b7",
      "type": "diagram",
      "kind": "circuit",
      "title": "Part A hookup — the loop you build",
      "caption": "Battery → switch → resistor, one series loop. The ammeter breaks INTO the loop next to the resistor; the voltmeter clips ACROSS the resistor (parallel) — it is not part of the loop.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "9V battery"
        },
        {
          "kind": "switch",
          "side": "top",
          "label": "switch (open before rewiring)"
        },
        {
          "kind": "resistor",
          "side": "right",
          "label": "R — ammeter in series here, voltmeter across"
        }
      ]
    },
    {
      "id": "b8",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch the lab: battery + switch + resistor in a loop. Ammeter IN SERIES with the resistor. Voltmeter IN PARALLEL across the resistor. Label which probe is which.",
      "prompts": [
        "Draw the series loop: battery → switch → resistor → back.",
        "Show the ammeter broken INTO the loop, the voltmeter clipped ACROSS the resistor.",
        "Label which Vernier probe is which."
      ]
    },
    {
      "id": "b9",
      "type": "data_table",
      "capture": true,
      "columns": [
        "R nominal (Ω)",
        "V (V)",
        "I (A)",
        "R_measured = V/I (Ω)",
        "% error"
      ],
      "rows": 4,
      "plot": false,
      "patternPrompt": "DATA TABLE A — Ohm's law verification. Compute the mean % error across your resistors. How close does R_measured come to the nominal value?"
    },
    {
      "id": "b10",
      "type": "data_table",
      "capture": true,
      "columns": [
        "R₁ + R₂ (Ω)",
        "V₁ (V)",
        "V₂ (V)",
        "V_total (V)",
        "I (A) constant?"
      ],
      "rows": 3,
      "plot": false,
      "patternPrompt": "DATA TABLE B — Series rule (battery V_total). Check: does V₁ + V₂ match V_battery? Is the current the same everywhere in the loop?"
    },
    {
      "id": "b11",
      "type": "data_table",
      "capture": true,
      "columns": [
        "R₁ ∥ R₂ (Ω)",
        "V across pair (V)",
        "I₁ (A)",
        "I₂ (A)",
        "I_total (A)"
      ],
      "rows": 3,
      "plot": false,
      "patternPrompt": "DATA TABLE C — Parallel rule. Sum check: does I₁ + I₂ match I_total from the battery?"
    },
    {
      "id": "b12",
      "type": "observation",
      "capture": true,
      "patternPrompt": "In your Ohm's law data (Part A), how well does R_measured match the nominal value? What's the largest source of error — your reading precision, the resistor tolerance, or something else?",
      "interpretPrompt": "In your parallel data (Part C), is I_total ≈ I₁ + I₂? Within what percent? If they DIDN'T match, what would that tell you (about charge conservation)? And the asteroid connection: how does this serve the year's question?",
      "frame": "We measured R for three resistors. The mean % error was ___ %. Our series-rule data confirmed that the current was ___ throughout. The parallel data confirmed that the voltage was ___ across each branch and I₁ + I₂ = ___."
    },
    {
      "id": "b13",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A voltmeter reads 6.0 V across a resistor. An ammeter reads 0.25 A through it. What is R? Show one line of work.",
      "frame": "R = V / I = ___ Ω."
    },
    {
      "id": "b14",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.s4-vernier-circuit-lab"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 11 — Electric Power: P = VI', 'u7-d11', 'Unit 7: Electricity & Magnetism', 11, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute power dissipated by a resistor using any of the three forms, pick the form matching what's GIVEN, and explain why a motor or resistor heats up when current flows (P = I²R → heat).",
      "targetId": "u7.k6-electric-power"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Days 4-6: V, I, R individually.",
      "connection": "Today: power = rate of energy delivery. Same idea as Unit 4 — but now for electricity. P = V·I is the master equation of the Car Project's electrical power."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Power: how fast a circuit moves energy\n\nA volt is a joule per coulomb. An amp is a coulomb per second. Multiply them and the coulombs cancel:\n\n**P = V · I**  →  (joules/coulomb) · (coulombs/second) = **joules per second = watts (W)**\n\nThat's power: the RATE at which the circuit delivers (or burns) energy. Substitute Ohm's law (V = IR) into it and you get two more forms of the same fact:\n\n- **P = V · I** — use when you know V and I\n- **P = I² · R** — use when you know I and R\n- **P = V² / R** — use when you know V and R\n\nPick the form using the variables you KNOW. And the heat connection: every resistor (and every motor winding) carrying current dissipates **P = I²R** as heat. That's why a running motor is warm — and why we'll care about it in the Car Project.\n\nTotal energy is power × time: **U = P · t**. A 1000 W toaster running 300 s uses 300 000 J. Your electric bill counts kilowatt-hours (kW · hours) — TOTAL energy, not rate."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Electric power (P)",
          "definition": "Rate of energy delivered or dissipated. P = V · I. Units: watts (W) = joules / second. Example: a 9V battery driving 2 A through a motor: P = 18 W of electrical power. Some becomes mechanical work; some becomes heat.",
          "cognate": "Sp. potencia eléctrica · Pt. potência elétrica · HC pwisans elektrik"
        },
        {
          "term": "Three forms of P",
          "definition": "Substitute Ohm's law into P = VI: P = I²R (when you know I and R), P = V²/R (when you know V and R). All three describe the same thing. Example: same 4 Ω resistor in a 9 V circuit. By any form: P = V·I = 9·2.25 = 20.25 W = V²/R = 81/4 = 20.25 W = I²R = 5.06·4 = 20.25 W ✓. Pick the form using the variables you KNOW.",
          "cognate": "Sp. tres formas de P · Pt. três formas de P · HC twa fòm P"
        },
        {
          "term": "Watt (W)",
          "definition": "SI unit of power. 1 W = 1 J/s = 1 V·A. Named for James Watt. Example: LED bulb: 8 W. Incandescent bulb: 60 W. Toaster: 1000 W. Hair dryer: 1500 W. Microwave: 1100 W.",
          "cognate": "Sp. vatio · Pt. watt · HC wat"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Power is a RATE — energy is a TOTAL",
      "markdown": "Power is energy per time. Energy is the total. Confusing them is a common error. Watts measure the RATE of energy use; kilowatt-hours (kWh) on your electric bill measure TOTAL energy (kW · hours)."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch a resistor with current flowing through it. Show heat radiating outward (wavy lines). Write the three forms of P next to it. Annotate which form to use with which givens.",
      "prompts": [
        "Resistor + current arrow + wavy heat lines.",
        "P = V·I, P = I²R, P = V²/R written beside it.",
        "Annotate: which form goes with which pair of givens?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "POWER DISSIPATED BY A RESISTOR — A 5 Ω resistor carries 2 A of current. How much power does it dissipate as heat?",
      "given": "I = 2 A · R = 5 Ω",
      "equation": "P = I² · R",
      "work": "P = (2)² · 5\nP = 4 · 5\nP = 20 W",
      "answer": "P = 20 W dissipated as heat in the resistor."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "HOUSEHOLD APPLIANCE — A toaster runs on 120 V and draws 8 A. What's its power? How much energy does it use in 5 minutes of operation?",
      "given": "V = 120 V · I = 8 A · t = 5 min = 300 s",
      "equation": "P = V · I ; energy = P · t",
      "work": "P = 120 · 8 = 960 W ≈ 1 kW\nU = 960 · 300 = 288 000 J ≈ 288 kJ\nOr: 960 W · (5/60 hr) ≈ 0.08 kWh",
      "answer": "P ≈ 960 W ≈ 1 kW. 5 min uses ≈ 0.08 kWh of energy."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "CAR MOTOR POWER — The Car Project motor: V = 9 V, R ≈ 4 Ω. Find I, then power delivered, using P = V²/R AND P = V·I to check yourself.",
      "givenHint": "V = 9 V · R ≈ 4 Ω. First find I from Ohm's law.",
      "equationHint": "I = V/R, then P = V²/R — and check that P = V·I gives the same number.",
      "equationOptions": [
        "P = V² / R",
        "P = V · I",
        "P = I² · R",
        "V = I · R"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "★ The Car motor gets WARM",
      "markdown": "The Car Project motor (9V, ~2A) dissipates ~18-20 W. NOT all 18 W becomes mechanical power — most goes to heat (P = I²R loss in the motor's windings). Efficiency of a small DC motor: typically 30-50%. The rest comes out as heat. Touch a motor that's been running — it's WARM."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 120 V hair dryer draws 12.5 A. How much power does it use? How much energy in 2 minutes of use? Show one line of work for each.",
      "frame": "Power equals voltage times ___, in units of ___. The three forms are P = V·I, P = ___, and P = V²/R. Choose the form by which variables you ___."
    },
    {
      "id": "rd-ch34-c",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **34.11** (electric power). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch34-c",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 34,
      "title": "Electric Current — read & practice",
      "sectionIds": [
        "34.11"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k6-electric-power"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 12 — Magnetism + Earth''s Field', 'u7-d12', 'Unit 7: Electricity & Magnetism', 12, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can identify magnetic poles (N + S), describe magnetic field lines (out of N, into S), and explain why Earth itself is a giant magnet — the magnetosphere generated by Earth's iron core dynamo.",
      "targetId": "u7.k7-magnetism"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Static charges (Day 1-3) make electric fields. Now: moving charges + magnets make MAGNETIC fields.",
      "connection": "Today previews Day 16: Earth's magnetosphere — the magnetic shield generated by THIS physics — is what made life on Earth possible."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## A second kind of field\n\nUnit 7 started with the electric field E: a vector at every point in space, sourced by charges. Magnetism gives us a second field, **B**, with its own rules:\n\n- Every magnet has TWO poles, **N and S**. Field lines come **out of N, into S**.\n- **Unlike poles attract; like poles repel** — the same attract/repel logic as charge, but with a twist: you can never isolate one pole. Cut a magnet in half and you get two smaller complete magnets.\n- B is measured in **tesla (T)** — a huge unit. A fridge magnet is ~0.1 T at its surface; an MRI machine is 1–3 T; Earth's field is a tiny **25–65 μT**.\n\nAnd the big one: **Earth itself is a magnet.** Molten iron circulating in the outer core — the **dynamo** — generates a planet-sized field. That field is why a compass works: the needle's N end aligns with Earth's field and swings toward geographic North. Small in teslas, planetary in consequence — Day 16 shows what it protects us from."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Magnetic poles (N, S)",
          "definition": "The two ends of a magnet. North poles attract South poles; like poles repel. Free poles ALONE don't exist — cut a magnet, you get two smaller bipolar magnets. Example: bar magnet, refrigerator magnet, compass needle — all have N + S. The Earth's geographic NORTH is actually a MAGNETIC SOUTH (a compass N points to it).",
          "cognate": "Sp. polos magnéticos · Pt. polos magnéticos · HC pòl mayetik"
        },
        {
          "term": "Magnetic field (B)",
          "definition": "A vector at every point in space. Drawn as field lines: out of N, into S. Units: tesla (T) — very large. Example: a neodymium fridge magnet: B ≈ 0.1 T at the surface. Earth's field: B ≈ 25–65 μT. An MRI machine: B ≈ 1–3 T (HUGE). B is to magnetism what E is to electricity — but B comes from MOVING charges or magnetic materials, E from static charges.",
          "cognate": "Sp. campo magnético · Pt. campo magnético · HC chan mayetik"
        },
        {
          "term": "Earth's magnetic field",
          "definition": "Earth has a magnetic field generated by the molten iron flow ('dynamo') in its outer core. Field strength: 25–65 μT at the surface. Polarity REVERSES on geologic timescales. Example: the field that makes a compass work — N end of the needle aligns with Earth's magnetic field, pointing to (geographic) North.",
          "cognate": "Sp. campo magnético terrestre · Pt. campo magnético da Terra · HC chan mayetik latè"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "No monopoles — and North isn't (magnetically) north",
      "markdown": "No 'magnetic monopoles' exist in nature (so far). Poles always come in pairs — different from electric charges, where a single + or − exists on its own. And watch the map: geographic N pole ≠ magnetic N pole. They're tilted ≈ 11° apart, and a compass needle's N points to Earth's magnetic SOUTH (which is near geographic NORTH)."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Bar magnet with field lines (out of N, into S). Earth as a giant bar magnet — show the tilt between magnetic and geographic axes. Mark where a compass would point.",
      "prompts": [
        "Bar magnet: field lines out of N, into S.",
        "Earth as a bar magnet, tilted ≈ 11° from the spin axis.",
        "Mark which way a compass needle points."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "FIELD STRENGTH COMPARISON — An MRI machine has B ≈ 1.5 T. Earth's field is ≈ 50 μT. How many TIMES stronger is the MRI field?",
      "given": "B_MRI = 1.5 T · B_Earth = 50 μT = 50 × 10⁻⁶ T",
      "equation": "ratio = B_MRI / B_Earth",
      "work": "ratio = 1.5 / (50 × 10⁻⁶)\nratio = 1.5 / 0.00005\nratio = 30 000",
      "answer": "MRI is 30 000 times stronger than Earth's field."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "COMPASS DIRECTION — A compass needle settles pointing approximately to geographic North. Which POLE (N or S) of the needle is pointing 'up' (toward geographic N)? Why?",
      "givenHint": "The needle aligns with Earth's field. Earth's magnetic pole near geographic North is actually a magnetic SOUTH.",
      "equationHint": "No numbers — use the pole rule: unlike poles attract.",
      "equationOptions": [
        "Unlike poles attract; like poles repel",
        "Like poles attract; unlike poles repel",
        "F = k · q₁q₂ / d²",
        "V = I · R"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "★ 50 μT — small field, planetary job",
      "markdown": "Earth's iron-core dynamo generates ≈ 50 μT — small in absolute terms, but it deflects most of the solar wind (charged particles at 400 km/s) before they hit our atmosphere. Without it, the atmosphere would have eroded billions of years ago — and you wouldn't exist. (Day 16.)"
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "What's the source of Earth's magnetic field? Answer in one sentence using the word 'dynamo'.",
      "frame": "Magnetic poles come in ___ — N and S. Like poles ___; unlike poles ___. Earth's magnetic field is generated by the ___ at the core, with strength ≈ ___ μT."
    },
    {
      "id": "rd-ch36-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **36.1–36.4 and 36.9** (magnetic poles, fields, the nature of magnetism, domains, and Earth's magnetic field). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch36-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 36,
      "title": "Magnetism — read & practice",
      "sectionIds": [
        "36.1",
        "36.2",
        "36.3",
        "36.4",
        "36.9"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k7-magnetism"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 13 — Oersted: Current → Magnetic Field', 'u7-d13', 'Unit 7: Electricity & Magnetism', 13, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe Oersted's 1820 discovery (compass deflects near a current-carrying wire), use the right-hand rule to predict B-field direction around a wire, and explain why a coil of wire (solenoid) acts like a bar magnet.",
      "targetId": "u7.k8-oersted"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Day 12: magnets create B-fields.",
      "connection": "Today: CURRENTS also create B-fields. This was the discovery that unified electricity and magnetism — and made the Car motor (Day 15) possible."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The accident that unified two sciences\n\nIn 1820, Hans Christian Oersted was lecturing in Copenhagen with a battery circuit on the bench. A compass happened to sit near the wire. When he closed the circuit, the needle **swung away from North** — and snapped back when he opened it. The conclusion was enormous: **electric currents create magnetic fields.** Before that moment, electricity and magnetism were thought to be separate subjects. After it, they were one: electromagnetism.\n\nThe geometry: a straight wire's B-field wraps in **circles around the wire**. To find the direction, use the **right-hand rule**: point your thumb along the current I, and your fingers **curl in the direction of B**.\n\nNow wrap that wire into a coil — a **solenoid**. Each loop's circular field adds to its neighbors', and the stacked result looks exactly like a bar magnet's field, with an N end and an S end. Strength scales with (number of turns) × (current): more turns, more current → stronger electromagnet. Switch the current off and the field vanishes — a magnet with an OFF switch. That controllable magnet is the heart of doorbells, relays, speakers, and the DC motor you'll build with in Unit 8."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Oersted's discovery (1820)",
          "definition": "Hans Christian Oersted accidentally noticed: a compass needle DEFLECTS when held near a wire carrying current. Conclusion: electric currents create magnetic fields. Example: the compass needle aligned WITH the new magnetic field, not with Earth's. Removing the current → needle returns to North. This was the first link between electricity and magnetism.",
          "cognate": "Sp. descubrimiento de Oersted · Pt. descoberta de Oersted · HC dekouvèt Oersted"
        },
        {
          "term": "Right-hand rule (straight wire)",
          "definition": "To find direction of B around a wire: point thumb in direction of current I, fingers CURL in direction of B field. Example: current pointing UP: B circles the wire counterclockwise as viewed from above. Current pointing into the page (×): B circles clockwise as viewed from in front.",
          "cognate": "Sp. regla de la mano derecha · Pt. regra da mão direita · HC règ men dwat"
        },
        {
          "term": "Solenoid (coiled wire = electromagnet)",
          "definition": "A wire wrapped into a coil. When current flows, the individual loops' B-fields add up, producing a B-field much like a bar magnet — with N and S poles at the ends. Example: doorbells, relays, electromagnets, MRI machines, the speakers in your phone, the inside of a DC motor — all are solenoids in disguise. Strength depends on (number of turns) × (current) × (μ₀); switching off current = field vanishes.",
          "cognate": "Sp. solenoide · Pt. solenoide · HC solenoyid"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "ALWAYS the right hand",
      "markdown": "ALWAYS use your right hand. A left-hand rule does the opposite — confusion-inducing. Even if you're left-handed, the right-hand rule is the convention."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Three parts: (A) straight wire with concentric circular B-lines, (B) right hand showing thumb-along-I, fingers-curling-B, (C) coiled wire = bar-magnet-like B-field.",
      "prompts": [
        "(A) Straight wire, concentric B circles around it.",
        "(B) Right hand: thumb = I, curling fingers = B.",
        "(C) Solenoid with a bar-magnet-shaped field, N and S labeled."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "DIRECTION OF B AROUND A WIRE — A long straight wire carries current flowing UP. A compass is placed to the EAST of the wire. Which way does the compass needle deflect?",
      "given": "I points UP · compass is to the EAST of the wire",
      "equation": "Right-hand rule: thumb UP → fingers curl from N → E → S → W → N (counterclockwise viewed from above)",
      "work": "To the EAST of the wire, the B field points SOUTH (since fingers curl from East toward South).\nCompass N pole aligns with B → compass needle points SOUTH.",
      "answer": "Compass deflects to point SOUTH."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "SOLENOID POLARITY — A solenoid (coiled wire) is wound so that — viewed from one end — the current flows COUNTERCLOCKWISE. Use the right-hand rule (curl fingers along current, thumb points to N pole) to determine which end of the solenoid is N.",
      "givenHint": "Viewed from one end, current circulates counterclockwise.",
      "equationHint": "Coil version of the rule: curl your fingers along the current; your thumb points out of the N pole.",
      "equationOptions": [
        "Curl fingers along current → thumb points to N",
        "Point thumb along current → fingers point to N",
        "F = I · L · B",
        "V = I · R"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "★ Half of electromagnetism — the other half is Day 14",
      "markdown": "Oersted's discovery is the OPENING of electromagnetism. Day 14 will give the REVERSE: changing B-field creates VOLTAGE. Together, these two laws (Oersted + Faraday) make every motor, every generator, every transformer, and every wireless charger work."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A straight wire has current flowing to the RIGHT. Above the wire, which direction does B point? (Use right-hand rule.) Show or describe your work.",
      "frame": "Oersted discovered that currents create ___ fields. The right-hand rule says to point your ___ in the direction of current, then your fingers curl in the direction of ___. A coiled wire (solenoid) acts like a ___."
    },
    {
      "id": "rd-ch36-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **36.5–36.8** (currents make magnetic fields, forces on moving charges and wires, and meters to motors). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch36-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 36,
      "title": "Magnetism — read & practice",
      "sectionIds": [
        "36.5",
        "36.6",
        "36.7",
        "36.8"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.k8-oersted"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 14 — Faraday Induction', 'u7-d14', 'Unit 7: Electricity & Magnetism', 14, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe Faraday's discovery (moving a magnet near a coil induces a voltage and current), predict the direction of induced current using flux change, and explain why generators and transformers all run on this principle.",
      "targetId": "u7.r1-faraday"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Day 13: current creates B. Today: the reverse — changing B creates current.",
      "connection": "Together, Days 13 and 14 are the ENGINE of every motor, generator, and transformer. Day 15 puts both into one machine."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Faraday flips Oersted's arrow\n\nOersted (1820): current → magnetic field. Michael Faraday spent a decade hunting the reverse, and in 1831 found it — with a catch that IS the whole law:\n\n**A CHANGING magnetic flux through a coil induces a voltage (EMF) in the coil.**\n\nPush a magnet INTO a coil → the ammeter swings one way. Pull it OUT → it swings the other way. Hold it perfectly STILL — even a huge magnet — **nothing**. It's the CHANGE that matters, never the value.\n\n**Magnetic flux Φ** measures how much B-field passes through the loop: Φ = B · A · cos θ (roughly), in webers (Wb). Flux changes when ANY of B, A, or the angle changes — move the magnet, or spin the loop.\n\nThe size of the induced voltage: **ε ≈ N · ΔΦ/Δt**. Faster change → bigger voltage. More turns N → bigger voltage.\n\nThis is how a **generator** works: spin a coil inside a magnetic field, the flux through it changes every instant of the rotation, and voltage is induced. Wind turbines, hydroelectric dams, car alternators, hand-crank flashlights — all the same trick: mechanical motion in, electricity out. The exact opposite of a motor — and Day 15 shows they're literally the same machine."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Faraday's law (1831)",
          "definition": "A CHANGING magnetic flux through a coil INDUCES a voltage (EMF) in the coil. The faster the change, or the more turns of wire, the bigger the induced voltage. Example: push a magnet INTO a coil → ammeter swings one way. Pull it OUT → swings the other way. STILL magnet → no current.",
          "cognate": "Sp. ley de Faraday · Pt. lei de Faraday · HC lwa Faraday"
        },
        {
          "term": "Magnetic flux (Φ)",
          "definition": "The amount of magnetic field passing through a loop. Φ = B · A · cos θ (roughly). Units: webers (Wb) = T·m². Example: a 0.1 T field through a 0.01 m² loop perpendicular to the field: Φ = 0.001 Wb. Rotate the loop 90° so field is parallel → Φ drops to 0. Flux changes when ANY of B, A, or angle changes.",
          "cognate": "Sp. flujo magnético · Pt. fluxo magnético · HC fliks mayetik"
        },
        {
          "term": "Generator",
          "definition": "A machine that converts mechanical motion into electrical voltage by spinning a coil inside a magnetic field. The OPPOSITE of a motor. Example: wind turbines, hydroelectric dams, car alternators, hand-crank flashlights — all generators. Each rotation changes flux → induced voltage → current.",
          "cognate": "Sp. generador · Pt. gerador · HC jeneratè"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "It's the CHANGE that matters",
      "markdown": "It's the CHANGE in B that matters, not the value. A constant B-field (even huge) produces NO induced voltage. A magnet sitting motionless inside a coil does nothing at all."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Coil of wire connected to an ammeter. A bar magnet is being PUSHED into the coil. Show the ammeter needle deflecting. Then a second sketch: pulling out → needle deflects the OTHER way.",
      "prompts": [
        "Sketch 1: magnet pushed IN, ammeter needle deflecting.",
        "Sketch 2: magnet pulled OUT, needle deflecting the OTHER way.",
        "Annotate: still magnet = no deflection."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "INDUCED VOLTAGE FROM CHANGING FLUX — A 100-turn coil has a magnetic flux that changes by Φ = 0.005 Wb over Δt = 0.1 s. What's the induced EMF? (ε ≈ N · ΔΦ/Δt.)",
      "given": "N = 100 turns · ΔΦ = 0.005 Wb · Δt = 0.1 s",
      "equation": "ε ≈ N · ΔΦ / Δt",
      "work": "ε = 100 · (0.005 / 0.1)\nε = 100 · 0.05\nε = 5 V",
      "answer": "ε = 5 V induced across the coil's ends — drives current if connected to a circuit."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "FASTER MOTION — Same 100-turn coil, same ΔΦ = 0.005 Wb, but you push the magnet TWICE as fast (Δt = 0.05 s). What's the new EMF?",
      "givenHint": "N = 100 turns · ΔΦ = 0.005 Wb · Δt = 0.05 s.",
      "equationHint": "Same equation as the worked example — halving Δt should do something predictable to ε.",
      "equationOptions": [
        "ε ≈ N · ΔΦ / Δt",
        "ε ≈ N · ΔΦ · Δt",
        "Φ = B · A · cos θ",
        "V = I · R"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "★ Why grid power is AC",
      "markdown": "Generators produce AC (alternating current) because the rotating coil's flux changes sinusoidally — sometimes increasing, sometimes decreasing. The induced voltage alternates direction with each half-rotation. That's why grid power is AC."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does pushing a magnet into a coil light up an attached LED — but holding it still does nothing? Answer in two sentences using the word 'changing'.",
      "frame": "Faraday's law says a ___ magnetic flux through a coil induces a ___. The induced voltage is BIGGER when (a) the change is ___, (b) there are ___ turns of wire. A generator works by ___ a coil through a magnetic field."
    },
    {
      "id": "rd-ch37-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **37.1–37.2 and 37.7–37.8** (electromagnetic induction, Faraday's law, induced fields, and electromagnetic waves). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch37-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 37,
      "title": "Electromagnetic Induction — read & practice",
      "sectionIds": [
        "37.1",
        "37.2",
        "37.7",
        "37.8"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.r1-faraday"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 15 — Motors + Generators', 'u7-d15', 'Unit 7: Electricity & Magnetism', 15, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe how a DC motor uses F = ILB (force on a current in a B-field) to produce torque, and explain why a motor and a generator are the SAME machine running in opposite directions.",
      "targetId": "u7.r2-motors-generators"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Day 13: current → B. Day 14: changing B → voltage.",
      "connection": "Today combines them. A motor takes voltage IN → mechanical rotation OUT. The actual machine you'll use in Unit 8 next week."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The Car Project's heart\n\nPut Oersted and Faraday in one box and you get the most useful machine of the last two centuries.\n\n**The motor side.** A wire carrying current I, of length L, sitting in a perpendicular magnetic field B, feels a sideways force:\n\n**F = I · L · B**\n\nThe direction is perpendicular to BOTH I and B (right-hand rule again). Inside a DC motor, a coil sits between permanent magnets. Current flows through the coil → each side of the coil feels an opposite sideways force → the pair of forces is a **torque** → the coil spins. Repeat every rotation, and the motor runs — thousands of RPM on the Car Project's little 9V motor, geared down to turn the wheels.\n\n**The generator side.** Run the same machine backwards: spin the shaft by hand and the coil's flux through the magnets changes — Faraday's law induces a voltage at the terminals. **Motor and generator are the SAME machine** — current in, motion out (motor); motion in, voltage out (generator).\n\n**The energy ledger.** The Car motor draws ≈ 2 A at 9 V, so P = 18 W of electrical power flows in. A small hobby motor is only ~40% efficient: ≈ 7 W comes out the shaft as motion, and the other ≈ 11 W heats the windings (P = I²R, Day 11). That's why a running motor is warm."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "DC motor",
          "definition": "A machine that converts electrical energy to MECHANICAL rotation. Current flows through a coil in a magnetic field; the field pushes the coil sideways (F = I·L·B); the coil spins. Example: the Car Project motor: 9V input, ≈ 2A current, ≈ 18W of power. Spins the output shaft at thousands of RPM. Gears reduce the speed and increase the torque. DC means 'direct current' — steady one-direction flow (battery).",
          "cognate": "Sp. motor DC · Pt. motor DC · HC motè DC"
        },
        {
          "term": "Force on a current-carrying wire in B (qualitative)",
          "definition": "A wire with current I, length L, in a perpendicular B field, feels a force F = I·L·B. Direction is PERPENDICULAR to both I and B (right-hand rule again). Example: inside the motor: current in coil + permanent magnets' B-field → coil feels sideways force → torque → spin. Repeat each rotation, and the motor runs.",
          "cognate": "Sp. fuerza sobre corriente · Pt. força sobre corrente · HC fòs sou kouran"
        },
        {
          "term": "Motor ⟷ generator (same machine)",
          "definition": "A motor and a generator are the SAME mechanical device. Drive it with current → motor (mechanical out). Spin it by hand → generator (voltage out). Example: a car alternator is a generator that recharges the battery from engine rotation; the starter motor is a motor that turns the engine over from battery power. Internally — same coil-in-field structure. This symmetry is why regenerative braking in electric cars works.",
          "cognate": "Sp. motor y generador · Pt. motor e gerador · HC motè jeneratè"
        }
      ]
    },
    {
      "id": "b5",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "Where the motor's 18 W goes",
      "caption": "Electrical power in, mechanical power out — with a big heat toll on the way. Small DC motors are typically 30-50% efficient.",
      "links": [
        {
          "label": "9V battery",
          "sublabel": "electrical: P = V·I ≈ 18 W"
        },
        {
          "label": "Coil in B-field",
          "sublabel": "F = I·L·B → torque"
        },
        {
          "label": "Shaft spins",
          "sublabel": "mechanical: ≈ 7 W (η ≈ 40%)"
        },
        {
          "label": "Heat in windings",
          "sublabel": "≈ 11 W lost (P = I²R)"
        }
      ]
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Cross-section of a DC motor: permanent magnets (N + S) on the outside, current-carrying coil in the middle. Mark forces on each side of the coil. Mark direction of rotation. F = ILB.",
      "prompts": [
        "Permanent magnets N + S on the outside, coil in the middle.",
        "Force arrows on each side of the coil (opposite directions = torque).",
        "Rotation arrow + F = I·L·B written on the diagram."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "CAR MOTOR POWER — The Car Project motor draws 2.0 A from a 9 V battery. What's the electrical power delivered? If the motor is 40% efficient (typical for small hobby motors), how much mechanical power comes out the shaft?",
      "given": "V = 9 V · I = 2 A · efficiency η = 0.40",
      "equation": "P_electrical = V · I ; P_mechanical = P_electrical · η",
      "work": "P_electrical = 9 · 2 = 18 W\nP_mechanical = 18 · 0.40 = 7.2 W\nHeat dissipated in windings: 18 − 7.2 = 10.8 W",
      "answer": "P_electrical = 18 W. About 7 W becomes mechanical motion; 11 W becomes heat (motor gets warm)."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "EFFICIENT MOTOR PREDICTIONS — A different motor is 60% efficient at 9V and 1.5A. Compute electrical input, mechanical output, and heat dissipated.",
      "givenHint": "V = 9 V · I = 1.5 A · η = 0.60.",
      "equationHint": "P_in = V·I, then P_mech = η·P_in, then heat = P_in − P_mech.",
      "equationOptions": [
        "P = V · I, then P_mech = η · P",
        "P = V² / R",
        "F = I · L · B",
        "ε ≈ N · ΔΦ / Δt"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "★ Don't stall the Car Project motor",
      "markdown": "A real DC motor's resistance changes when it's spinning — it generates its own back-EMF (Faraday's law!) which opposes the source. Stalled motor (not spinning): R ≈ 3-4Ω, full current → too much heat → can damage. Running motor: effective R higher, current lower, runs cool. Don't stall the Car Project motor!"
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "The Car Project motor pulls 2 A at 9 V. (1) What's the electrical power? (2) Where does the energy go? (Two destinations.) Show work.",
      "frame": "A DC motor converts ___ energy into ___ rotation. The force on a current in a magnetic field is F = ___. A motor and a generator are the ___ machine — different inputs."
    },
    {
      "id": "rd-ch37-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **37.3–37.6** (generators and AC, motor–generator comparison, transformers, and power transmission). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch37-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 37,
      "title": "Electromagnetic Induction — read & practice",
      "sectionIds": [
        "37.3",
        "37.4",
        "37.5",
        "37.6"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.r2-motors-generators"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 16 — Magnetosphere + EMP from Impact', 'u7-d16', 'Unit 7: Electricity & Magnetism', 16, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe Earth's magnetosphere as a planetary-scale electromagnetic shield, explain why it protects life from solar wind, and describe how a large asteroid impact could generate an EMP (electromagnetic pulse) that disrupts the field temporarily.",
      "targetId": "u7.r3-magnetosphere-emp"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ has a non-trivial impact probability. Day 11 (Wien's law from Unit 6) tells us a large impactor will produce intense heat and EM radiation.",
      "connection": "Today's PAYOFF: the same E&M physics that runs the Car motor also runs the magnetosphere — the planetary shield. Without it, life on Earth wouldn't exist. A large impact could perturb it."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Planetary-scale E&M\n\nEverything in this unit so far has been bench-top scale: resistors, coils, hobby motors. Today, the same three laws run at the scale of a planet.\n\n**The dynamo (Oersted at planetary scale).** Molten iron circulates in Earth's outer core. Moving charge is current; current makes a magnetic field. The result is the **magnetosphere** — the region of space dominated by Earth's field, stretching ~10 Earth radii toward the Sun and ~100 on the night side, dragged into a teardrop by the solar wind.\n\n**The shield.** The **solar wind** — charged particles streaming off the Sun at 300-800 km/s, continuously — slams into that field and gets deflected around the planet. Charged particles curving in a magnetic field: that's the F-on-a-moving-charge physics from Day 15, planetary edition. The few particles that leak in get funneled down the field lines to the poles — that glow is the **aurora**. Without the shield, the solar wind would have stripped Earth's atmosphere billions of years ago.\n\n**The vulnerability (Faraday at planetary scale).** A violent event — a giant solar storm, or a large asteroid impact that ionizes a huge volume of atmosphere — sends a fast-changing electromagnetic burst across the surface: an **EMP**. Faraday's law says a changing field induces voltage in every conductor it crosses. Power lines hundreds of kilometers long act as giant pickup coils — induced currents can cook transformers and drop grids. Same law that lights the LED in the Day 14 demo; very different stakes."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Magnetosphere",
          "definition": "The region of space around Earth dominated by Earth's magnetic field. Extends ~10× Earth radii on the day side and ~100× on the night side (stretched by solar wind). Example: the magnetosphere deflects most of the solar wind (charged particles, ~400 km/s). Particles that DO enter are funneled to the poles → aurora (northern + southern lights).",
          "cognate": "Sp. magnetosfera · Pt. magnetosfera · HC mayetosfè"
        },
        {
          "term": "Solar wind",
          "definition": "A continuous stream of charged particles (mostly protons + electrons) flowing outward from the Sun at 300-800 km/s. Example: during solar storms (CMEs — coronal mass ejections), the wind intensifies. Disruptions to satellites, GPS, and power grids on Earth can result if the magnetosphere is overwhelmed. The wind is CONTINUOUS — not just during storms.",
          "cognate": "Sp. viento solar · Pt. vento solar · HC van solè"
        },
        {
          "term": "EMP (electromagnetic pulse)",
          "definition": "A burst of electromagnetic radiation strong enough to induce huge currents in electrical conductors — potentially damaging electronics and power grids. Example: a large asteroid impact compresses + heats air, which ionizes it; the rapidly moving charges produce intense EM radiation = EMP. A high-altitude nuclear detonation can also produce one. Effects: from radio static to grid failure (the 1989 Quebec aurora-induced blackout is a real example).",
          "cognate": "Sp. PEM (pulso electromagnético) · Pt. PEM (pulso eletromagnético) · HC PEM"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Magnetosphere ≠ atmosphere",
      "markdown": "The magnetosphere is the magnetic shield. The ATMOSPHERE is the air layer beneath it. Both protect us — magnetosphere from charged particles, atmosphere from radiation."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "From core dynamo to a living planet",
      "caption": "The same physics chain as the Car motor — current makes field, field exerts force — running continuously at planetary scale for billions of years.",
      "links": [
        {
          "label": "Molten iron flows",
          "sublabel": "outer-core dynamo = current"
        },
        {
          "label": "Earth's B-field",
          "sublabel": "≈ 25–65 μT at the surface"
        },
        {
          "label": "Solar wind deflected",
          "sublabel": "≈ 127 GW turned aside, continuously"
        },
        {
          "label": "Atmosphere survives",
          "sublabel": "→ life on Earth"
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Sun on the left sending solar wind. Earth on the right with a magnetosphere (teardrop shape). Most particles deflect around. Some funnel to poles → aurora. Annotate Day 16 scenario: how could 2026-XJ disturb this?",
      "prompts": [
        "Sun → solar wind arrows → teardrop-shaped magnetosphere around Earth.",
        "Most particles deflect; a few funnel to the poles → aurora.",
        "Annotate: how could a 2026-XJ impact disturb this shield?"
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "SOLAR WIND ENERGY FLUX DEFLECTED — The solar wind delivers about 1 mW per square meter of energy to Earth's vicinity. Earth's cross-section (πR²) ≈ 1.27 × 10¹⁴ m². What's the total power deflected by the magnetosphere?",
      "given": "P_per_area = 10⁻³ W/m² · A = 1.27 × 10¹⁴ m²",
      "equation": "P_total = P_per_area · A",
      "work": "P_total = 10⁻³ · 1.27 × 10¹⁴\nP_total = 1.27 × 10¹¹ W\n     = 127 GW",
      "answer": "≈ 127 gigawatts of solar wind power deflected continuously by Earth's magnetic shield."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "MAGNETOSPHERE DISTURBANCE SCENARIO — A 2026-XJ-sized impact generates an EMP. If the pulse induces 10 V/m in the atmosphere over a 10-meter-long power line, what voltage spike is delivered to a transformer at its end? (V = E · L for a uniform field.)",
      "givenHint": "E = 10 V/m · L = 10 m.",
      "equationHint": "For a uniform field along the line: V = E · L.",
      "equationOptions": [
        "V = E · L",
        "V = I · R",
        "E = F / q",
        "P = V · I"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "★ The Carrington Event, 1859",
      "markdown": "The 1859 Carrington Event: a solar coronal mass ejection induced geomagnetic currents that fried telegraph lines worldwide. Operators got electric shocks. Some lines caught fire. If it happened today, modern power grids could fail for weeks. This is the SAME physics — changing B-field → induced V → current → damage."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does Earth need a magnetosphere? Answer in two sentences using 'solar wind' and 'atmosphere'.",
      "frame": "Earth's magnetosphere is generated by the ___ at the core. It deflects the ___ — without it, Earth's atmosphere would erode. A ___ from a major impact or solar storm could induce damaging currents in our electrical grid."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.r3-magnetosphere-emp"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 17 — Bridge to the Car Project', 'u7-d17', 'Unit 7: Electricity & Magnetism', 17, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "SYNTHESIS",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can preview the Car Project parts kit, identify which UNIT each part traces to, and predict the motor's CURRENT and POWER using V = IR and P = VI — BEFORE I build.",
      "targetId": "u7.bridge-car-project"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "FINAL REFRAMING — the asteroid arc is closing. For ONE year you've done physics on a cosmic backdrop — distance, gravity, energy, heat, waves, charge.",
      "connection": "Unit 8 opens the BUILD arc. Starting next week you're building a working machine, by hand, with what you've learned. Today is the explicit handoff: we preview the parts kit, you predict the numbers, and Unit 8 Day 1 you'll measure to compare."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## ★ Car Project — parts preview\n\nEvery part in the kit traces back to a unit of this year. Theory becomes engineering:\n\n| Part | Traces to | The physics |\n|---|---|---|\n| 9V battery | Unit 7 Day 4 | voltage = energy per charge (V = U/q) |\n| Wires + switch | Unit 7 Days 5-6 | current (I = q/t) + resistance (V = IR) |\n| DC motor | Unit 7 Day 15 | current-in-field → torque (F = I·L·B) |\n| Gears (reduction) | Unit 2 | mechanical advantage (input/output gear teeth) |\n| Wheels | Unit 2 | rotational → translational motion (v = ωr) |\n| Starting impulse | Unit 3 | Δp = F·Δt — what gets the car moving |\n| Top-speed kinetic energy | Unit 4 | KE = ½mv² — what the motor builds up |\n| Friction (wheels, bearings) | Unit 2 + Unit 5 | μ·N + heat dissipation |\n\nThe electrical heart of the build is the simplest circuit in this unit: **battery → switch → motor → back**. One series loop. Today you predict its numbers; next week you measure them."
    },
    {
      "id": "b4",
      "type": "diagram",
      "kind": "circuit",
      "title": "The Car Project circuit — one series loop",
      "caption": "Battery → switch → motor → back. This is the exact circuit you will build on Day 1 of Unit 8. Everything you verified in the Day 10 lab applies to it directly.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "9V battery"
        },
        {
          "kind": "switch",
          "side": "top",
          "label": "switch (ON/OFF)"
        },
        {
          "kind": "motor",
          "side": "right",
          "label": "DC motor, R ≈ 3-5 Ω"
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the Car Project with each part labeled with its origin unit. The visual centerpiece of this page — and of the bridge from Unit 7 to Unit 8.",
      "prompts": [
        "Battery, switch, motor, gears, wheels — all drawn and labeled.",
        "Next to each part: the unit it traces to (use the parts table).",
        "Circle the Unit 7 parts — that's what this week was for."
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "★ STEP 1 — PREDICT MOTOR CURRENT. Given: Car Project uses a 9V battery. Estimated motor resistance: R ≈ 3-5 Ω (we'll measure on Day 1 of Unit 8). Predict the current the motor will draw.",
      "given": "V = 9 V · R ≈ 3-5 Ω (motor)",
      "equation": "I = V / R (Ohm's law, Day 6)",
      "work": "If R = 3 Ω: I = 9/3 = 3 A\nIf R = 4 Ω: I = 9/4 = 2.25 A\nIf R = 5 Ω: I = 9/5 = 1.8 A\n→ Expected range: I ≈ 1.8 to 3.0 A",
      "answer": "PREDICTION: the motor will draw between 1.8 A and 3.0 A. Most likely ≈ 2-2.5 A."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "★ STEP 2 — PREDICT MOTOR POWER. Using your predicted current from Step 1, compute the electrical power delivered to the motor. (P = V·I.)",
      "given": "V = 9 V · I ≈ 1.8 to 3.0 A (your prediction)",
      "equation": "P = V · I (Day 11)",
      "work": "If I = 1.8 A: P = 9 · 1.8 = 16.2 W\nIf I = 2.25 A: P = 9 · 2.25 = 20.25 W\nIf I = 3.0 A: P = 9 · 3.0 = 27 W\n→ Expected range: P ≈ 16 to 27 W\n→ About 40% becomes motion; 60% becomes heat (Day 15).",
      "answer": "PREDICTION: motor draws ≈ 16-27 W. Mechanical power out ≈ 7-11 W."
    },
    {
      "id": "b8",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "TEAM PREDICTION — use the most likely numbers from Steps 1 and 2. Fill in the frame, then circle one: the motor will (get warm / not get warm).",
      "frame": "Our team predicts the motor will draw ___ A and consume ___ W. About ___ W will become motion; ___ W will become heat. The motor will (get warm / not get warm)."
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "★ Prediction now, measurement next week",
      "markdown": "The PREDICTION is a Marzano-3 deliverable. The MEASUREMENT happens on Day 1 of Unit 8 (next week). The TRANSFER task (Day 18) will ask you to predict for a different motor."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "WHY is the Car Project's circuit wired in SERIES (battery → switch → motor → back) instead of parallel? Reason about what would happen if any one wire breaks. (Hint: a series-only circuit is what an ON/OFF switch can fully control.)",
      "frame": "A series loop has ___ path for current, so opening the switch ___. If any one wire breaks, ___."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u7.bridge-car-project"
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 18 — Unit 7 Transfer Task', 'u7-d18', 'Unit 7: Electricity & Magnetism', 18, 'markdown', true, $u7${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply every Unit 7 tool — Coulomb's law, electric field, voltage, current, Ohm's law, series + parallel circuits, power, magnetism, Oersted, Faraday, and the motor prediction — independently on the transfer task.",
      "targetId": "u7.transfer-task"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Every Unit 7 tool: Coulomb's law, E field, V = U/q, I = q/t, V = IR, series + parallel rules, P = VI = I²R = V²/R, magnetism + Oersted, Faraday induction, motors.",
      "connection": "Problem 5 is the load-bearing PREDICT prompt: given a different motor and battery, predict current AND power BEFORE the build. Same logic as Day 17."
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
      "markdown": "## The task — 5 multi-part problems, ~40 minutes, independent\n\n- **Problem 1 — Coulomb's law.** Two +5 μC charges are 0.20 m apart. Compute the force on each. Then compute the new force if the distance is doubled to 0.40 m. Show inverse-square scaling.\n- **Problem 2 — Ohm's law + power.** A circuit measures V = 12 V across a resistor and I = 0.30 A through it. (a) Find R. (b) Find P dissipated. (c) Find energy dissipated in 60 s of operation.\n- **Problem 3 — Series + parallel.** 9V battery powers (R₁ = 2Ω in series with R₂ = 4Ω ∥ R₃ = 4Ω). Find R_total, the battery current, and the current in each parallel branch.\n- **Problem 4 — Magnetic field.** A long straight wire carries current flowing into the page. (a) Describe (with right-hand rule) the direction of B in the four cardinal directions around the wire. (b) Why does a compass placed to the SOUTH of the wire deflect WEST?\n- **Problem 5 — ★ Car Project bridge (predict).** A different team's hobby motor has estimated R = 5.5 Ω. Connected to a 9 V battery: (a) Predict current. (b) Predict power. (c) If the motor is 35% efficient, estimate the mechanical power out. (d) If a 15-second race uses this power continuously, how much TOTAL energy is delivered, and how much becomes heat?\n\n### How it's scored — 4 dimensions, each 0–4\n\n- **Science** — correct physics: vectors, kinematics, units.\n- **Reasoning** — sound method; uncertainty explained, not just stated.\n- **Communication** — work shown, units labeled, organized, readable.\n- **Transfer-to-Asteroid** — honest public-facing connection to 2026-XJ."
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Five problems, five physics ideas. Match each problem to its Unit 7 idea BEFORE you begin. Problem 5 is the ★ — it bridges into Unit 8.",
      "prompts": [
        "Write the five problem numbers and draw a line to the Unit 7 idea each one uses.",
        "Mark Problem 5 with a ★ — it's the bridge into Unit 8."
      ]
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Allowed today",
      "markdown": "The Unit 7 Equation Reference card and a calculator. Every equation on it is on the MCAS Equation Sheet — you do **not** need to memorize them. You DO need to recognize when each one applies. You may ask **clarifying** questions about what the task means — but not physics-content questions."
    },
    {
      "id": "b7",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Before you start the paper task, write your plan: what order will you tackle the five problems, and where do you predict you will struggle?",
      "frame": "My plan: first I will ___, then ___. I expect to struggle most with ___."
    },
    {
      "id": "b8",
      "type": "prose",
      "markdown": "## After the task — final unit self-assessment\n\nRate yourself on every Unit 7 target below. This is your end-of-unit Marzano record — it feeds your Mastery Growth Chart and tells us both exactly where to focus before Unit 8 puts this unit's circuit into a machine you build with your hands."
    },
    {
      "id": "b9",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "u7.k1-coulombs-law",
        "u7.k2-electric-field",
        "u7.k3-voltage",
        "u7.k4-current",
        "u7.k5-ohms-law",
        "u7.s1-series-circuits",
        "u7.s2-parallel-circuits",
        "u7.s3-combination-circuits",
        "u7.s4-vernier-circuit-lab",
        "u7.k6-electric-power",
        "u7.k7-magnetism",
        "u7.k8-oersted",
        "u7.r1-faraday",
        "u7.r2-motors-generators",
        "u7.r3-magnetosphere-emp"
      ]
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "End-of-unit reflection: where did you grow the most this unit, and what's the one idea you want locked in before Unit 8 (The Car Project — theory becomes engineering)?",
      "frame": "I grew most on ___. Before Unit 8 I want to lock in ___."
    }
  ]
}$u7$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

-- Wire each target to its lesson (publish guardrail requires learning_targets.lesson_id)
WITH map(target_slug, lesson_slug) AS (VALUES
  ('u7.anchor-charge','u7-d01'),
  ('u7.k1-coulombs-law','u7-d02'),
  ('u7.k2-electric-field','u7-d03'),
  ('u7.k3-voltage','u7-d04'),
  ('u7.k4-current','u7-d05'),
  ('u7.k5-ohms-law','u7-d06'),
  ('u7.s1-series-circuits','u7-d07'),
  ('u7.s2-parallel-circuits','u7-d08'),
  ('u7.s3-combination-circuits','u7-d09'),
  ('u7.s4-vernier-circuit-lab','u7-d10'),
  ('u7.k6-electric-power','u7-d11'),
  ('u7.k7-magnetism','u7-d12'),
  ('u7.k8-oersted','u7-d13'),
  ('u7.r1-faraday','u7-d14'),
  ('u7.r2-motors-generators','u7-d15'),
  ('u7.r3-magnetosphere-emp','u7-d16'),
  ('u7.bridge-car-project','u7-d17'),
  ('u7.transfer-task','u7-d18')
)
UPDATE learning_targets t SET lesson_id = l.id::text
FROM map m JOIN lessons l ON l.slug = m.lesson_slug
WHERE t.slug = m.target_slug;

UPDATE learning_targets SET exclude_from_growth = true WHERE slug IN ('u7.bridge-car-project', 'u7.transfer-task');

COMMIT;
