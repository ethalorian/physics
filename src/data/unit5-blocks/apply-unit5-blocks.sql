-- Apply Unit 5: Thermal Physics & the Second Law lesson blocks + learning targets (paste into Supabase SQL editor).
-- Generated from /sessions/laughing-zen-feynman/mnt/physics-classroom/src/data/unit5-blocks/*.json
BEGIN;

-- Learning targets
INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.anchor-heat-vs-temp', 'I can distinguish thermal energy (total molecular KE), temperature (average per molecule), and heat (thermal energy that transfers).', 'reasoning', 'unit-5', 1)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.k1-specific-heat', 'I can compute heat with Q = m·c·ΔT and interpret specific heat as a material property.', 'knowledge', 'unit-5', 2)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.k2-transfer-modes', 'I can distinguish conduction, convection, and radiation and identify each in real scenarios.', 'knowledge', 'unit-5', 3)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.k3-latent-heat', 'I can compute phase-change heat with Q = m·L and read a heating curve''s plateaus.', 'knowledge', 'unit-5', 4)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.s1-calorimetry-lab', 'I can run a Vernier calorimetry experiment and identify a metal from its measured specific heat.', 'skill', 'unit-5', 5)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.k4-kinetic-theory', 'I can explain temperature as average molecular kinetic energy using kinetic theory.', 'knowledge', 'unit-5', 6)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.k5-first-law', 'I can apply the first law ΔU = Q − W with correct signs.', 'knowledge', 'unit-5', 7)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.r1-second-law', 'I can state the second law, explain why heat flows hot to cold, and reason about entropy.', 'reasoning', 'unit-5', 8)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.r2-heat-engines', 'I can analyze a heat engine''s energy flow and compute its efficiency.', 'reasoning', 'unit-5', 9)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.r3-atmospheric-entry', 'I can explain why small rocks burn up on atmospheric entry and reason about the size threshold.', 'reasoning', 'unit-5', 10)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.r4-thermal-damage', 'I can partition impact energy into thermal components and build a damage-by-distance map.', 'reasoning', 'unit-5', 11)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u5.transfer-task', 'I can apply every Unit 5 tool independently on the transfer task.', 'reasoning', 'unit-5', 12)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

-- Lessons
INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 1 — Heat Is Energy, but It''s NOT Temperature', 'u5-d01', 'Unit 5: Thermal Physics & the Second Law', 1, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can distinguish THERMAL ENERGY (total molecular KE), TEMPERATURE (intensive — average per molecule), and HEAT (thermal energy that TRANSFERS) — and explain why a bathtub at 40 °C has MORE thermal energy than a thimble at 100 °C.",
      "targetId": "u5.anchor-heat-vs-temp"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Unit 4: 2026-XJ delivers ~4.5 × 10¹⁷ J ≈ 108 megatons. That's the YIELD. But yield isn't damage — damage is what the energy DOES.",
      "connection": "The damage MECHANISM is heat. Day 10 explains atmospheric burn-up. Day 11 builds the impact thermal damage map. Today we untangle the words."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "NASA / Planetary Defense Briefing — Update 5",
      "markdown": "The Unit 4 yield number — 2026-XJ KE ≈ **4.5 × 10¹⁷ J ≈ 108 megatons TNT ≈ \"7000 Hiroshimas\"** — is real, but INCOMPLETE. A shockwave alone doesn't account for the full damage profile. What people remember about asteroid impacts — Tunguska's flattened forest, Chelyabinsk's broken windows — is largely **THERMAL**. The fireball. The infrared pulse. The atmospheric entry glow that's hot enough to ignite vegetation kilometers away from where the rock lands.\n\nToday there are THREE new pieces of data on our desks:\n\n**(1)** At 2026-XJ's size, does the atmosphere actually slow it down enough to matter? Most asteroids burn up before they hit. Where's the size threshold?\n\n**(2)** If it does reach the ground, how does its KE partition into vaporized rock vs. shockwave vs. thermal radiation? Each component has a different damage radius.\n\n**(3)** Closer to home: the Unit 4 yield calculation assumed a clean energy-to-shockwave conversion. The yield is REAL, but the FRAMEWORK was missing heat. Unit 5 builds it.\n\nThe two payoff days are Day 10 (atmospheric entry — the burn-up question) and Day 11 (impact thermal damage — the damage-by-distance map). The Day 12 transfer task asks the burn-up question for a sample pebble-sized rock.\n\n*This is fiction. The physics — and the equations — are real.*"
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## Three words people mix up — and physics doesn't\n\n**Thermal energy** is the TOTAL kinetic energy of all the molecules in an object. It's *extensive*: more molecules → more thermal energy. Units: Joules.\n\n**Temperature** is the AVERAGE kinetic energy PER molecule. It's *intensive*: it doesn't care how much stuff there is. Units: °C or K.\n\n**Heat (Q)** is thermal energy that is *TRANSFERRED* from one object to another because of a temperature difference. Also Joules.\n\nSo a thimble of boiling water (100 °C) has hotter molecules per piece — higher temperature. But a bathtub at 40 °C has *billions of times more molecules*, so its TOTAL — its thermal energy — is far larger. \"Which is hotter?\" and \"which holds more energy?\" are **different questions**, and Unit 5 needs both: temperature decides which way heat flows; total energy decides how much damage it can do."
    },
    {
      "id": "b5",
      "type": "observation",
      "capture": true,
      "patternPrompt": "Demo: a thimble of boiling water (100 °C) next to a bathtub of warm bathwater (40 °C). Which has MORE thermal energy? Same question for a match flame vs. a campfire. What did you NOTICE?",
      "interpretPrompt": "What do you WONDER?",
      "frame": "I notice ___. I wonder ___."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Compare A (thimble, 100 °C) and B (bathtub, 40 °C). Which has more thermal energy? Which has higher temperature? Why are these DIFFERENT questions?",
      "prompts": [
        "Draw A and B side by side; label each with its temperature.",
        "Mark which wins on TEMPERATURE and which wins on THERMAL ENERGY.",
        "One sentence: why are these different questions?"
      ]
    },
    {
      "id": "b7",
      "type": "vocab",
      "terms": [
        {
          "term": "Thermal energy",
          "definition": "The TOTAL kinetic energy of all the molecules in an object. Extensive — depends on HOW MANY molecules. Units: Joules. A bathtub of warm water has billions of times more molecules than a thimble of boiling water — so its thermal energy is far larger, even though it's cooler.",
          "cognate": "Sp. energía térmica · Pt. energia térmica · HC enèji tèmik"
        },
        {
          "term": "Temperature",
          "definition": "The AVERAGE kinetic energy PER molecule. Intensive — doesn't depend on how much stuff. Units: °C or K. 100 °C boiling water has hotter molecules per piece than 40 °C bathwater — regardless of how much water there is.",
          "cognate": "Sp. temperatura · Pt. temperatura · HC tanperati"
        },
        {
          "term": "Heat (Q)",
          "definition": "Thermal energy that is TRANSFERRED from one object to another, because of a temperature difference. Units: Joules. Symbol: Q. Putting your hand on a cold ice cube — heat (Q) flows from your hand to the ice. The ice warms; your hand cools.",
          "cognate": "Sp. calor · Pt. calor · HC chalè"
        }
      ]
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "misconception",
      "title": "Objects don't 'have heat' — heat is energy IN TRANSIT",
      "markdown": "Once heat arrives, it's just the receiving object's thermal energy. Don't say \"the object has heat\" — say \"thermal energy.\" And thermal energy ≠ temperature: a cool ocean has VASTLY more thermal energy than a cup of hot tea, and \"hot\" only means high temperature (fast molecules) — it says nothing about how much total energy is there."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "MY GUESS — which would burn me worse: a teaspoon of boiling water spilled on my hand, or my hand in a bathtub at 40 °C? Why?",
      "frame": "My guess: ___ would burn me worse, because ___."
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Where this unit is headed",
      "markdown": "Unit 5 has TWO payoff days: Day 10 (atmospheric burn-up — the size threshold) and Day 11 (impact damage map — the unit's centerpiece). Both require **Q = mcΔT** and **Q = mL**. We get those tomorrow and Day 4."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Which contains MORE THERMAL ENERGY: a cup of hot coffee at 80 °C, or a cold lake at 5 °C? Which is at HIGHER TEMPERATURE? In two sentences, explain why these are different questions.",
      "frame": "The ___ has more thermal energy; the ___ has higher temperature. They're different questions because thermal energy is the ___ and temperature is the ___."
    },
    {
      "id": "rd-ch21-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **21.1–21.5** (temperature, heat, thermal equilibrium, internal energy, and measuring heat with the calorie). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch21-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 21,
      "title": "Temperature, Heat, and Expansion — read & practice",
      "sectionIds": [
        "21.1",
        "21.2",
        "21.3",
        "21.4",
        "21.5"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.anchor-heat-vs-temp"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 2 — Specific Heat: Q = m·c·ΔT', 'u5-d02', 'Unit 5: Thermal Physics & the Second Law', 2, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can write Q = mcΔT, identify each piece with units, look up c from a table, and solve for any one variable given the other three.",
      "targetId": "u5.k1-specific-heat"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Asteroids are mostly rock (c ≈ 800 J/kg·°C). Oceans are water (c ≈ 4186). Water's c is 5× rock's.",
      "connection": "When 2026-XJ heats up entering atmosphere, the same energy raises rock temperature 5× more than it would water. That asymmetry sets the atmospheric burn-up threshold on Day 10."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The price of a degree\n\nDifferent materials charge different prices to warm up. **Specific heat (c)** is the energy needed to raise 1 kg of a material by 1 °C — and the equation that totals the bill is:\n\n**Q = m · c · ΔT**\n\nwhere Q is heat in Joules, m is mass in kg, c is in J/kg·°C, and ΔT is the temperature CHANGE in °C (final − initial).\n\n| Material | c (J/kg·°C) |\n|---|---|\n| Water | 4186 |\n| Aluminum | 900 |\n| Rock (typical) | ≈ 800 |\n| Copper | 387 |\n\nWater is the most expensive material on the list — over 5× rock, over 10× copper. Give the same 1000 J to 1 kg of each, and the copper warms more than 10× as much as the water. That one fact runs through the whole unit: it's why oceans moderate climate, why calorimetry labs use water, and why entering rock heats up FAST on Day 10."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Specific heat (c)",
          "definition": "The energy needed to raise 1 kg of a material by 1 °C. Units: J/kg·°C. Material-specific. Water: c = 4186 J/kg·°C — to raise 1 kg by 1 °C takes 4186 J. Aluminum: c = 900. Copper: 387. Water needs the MOST per kg per °C — that's why it heats slowly.",
          "cognate": "Sp. calor específico · Pt. calor específico · HC chalè espesifik"
        },
        {
          "term": "Q = m · c · ΔT",
          "definition": "Heat needed to change a mass m by ΔT, with material specific heat c. Q in J, m in kg, ΔT in °C. Example: 0.5 kg of water raised by 20 °C: Q = 0.5 · 4186 · 20 = 41,860 J.",
          "cognate": "Sp. ecuación de calor · Pt. equação de calor"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "ΔT can be NEGATIVE",
      "markdown": "If an object COOLS, ΔT = T_final − T_initial is negative — so Q comes out negative. That's not an error: negative Q means heat flowed OUT of the object. Keep the sign; it tells you the direction."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Compare the bars for water, aluminum, rock, copper. If you give each 1000 J, which warms by the LEAST? Why?",
      "prompts": [
        "Draw four bars showing c for water (4186), aluminum (900), rock (≈800), copper (387).",
        "Mark which material warms LEAST with the same 1000 J.",
        "One sentence: how does ΔT depend on c?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "How much heat is required to raise 0.5 kg of water from 20 °C to 40 °C?",
      "given": "m = 0.5 kg · c_water = 4186 J/kg·°C · ΔT = 40 − 20 = 20 °C",
      "equation": "Q = m · c · ΔT",
      "work": "Q = 0.5 · 4186 · 20\nQ = 0.5 · 83,720\nQ = 41,860 J",
      "answer": "≈ 4.2 × 10⁴ J ≈ 42 kJ to heat 0.5 kg of water by 20 °C."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "Apply the same 41,860 J of energy to 0.5 kg of aluminum (c = 900). What's the temperature rise?",
      "given": "Q = 41,860 J · m = 0.5 kg · c_Al = 900 J/kg·°C",
      "equation": "Q = m · c · ΔT → ΔT = Q / (m · c)",
      "work": "ΔT = 41,860 / (0.5 · 900)\nΔT = 41,860 / 450\nΔT ≈ 93 °C",
      "answer": "≈ 93 °C — the aluminum heats almost 5× as much as the water did with the same energy."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "How much heat is needed to raise 2 kg of copper from 20 °C to 80 °C? (c_Cu = 387 J/kg·°C.)",
      "givenHint": "m = 2 kg · c_Cu = 387 J/kg·°C · ΔT = 80 − 20 = 60 °C",
      "equationHint": "Q = m · c · ΔT — multiply straight through.",
      "equationIds": [
        "heat"
      ]
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "A 0.20-kg metal sample receives 1800 J and warms by 50 °C. What's its specific heat? Use the table to identify the metal.",
      "givenHint": "Q = 1800 J · m = 0.20 kg · ΔT = 50 °C · c = ?",
      "equationHint": "Q = m · c · ΔT → c = Q / (m · ΔT). Then compare your c to the table values to name the metal.",
      "equationIds": [
        "heat"
      ]
    },
    {
      "id": "b11",
      "type": "callout",
      "variant": "note",
      "title": "Why beach sand burns your feet",
      "markdown": "Water's high c is why beach sand burns your feet but the ocean still feels cool — same sun, but the sand (low c) heats fast while the water (high c) barely budges. It's also why oceans are Earth's thermostat."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "How much heat is needed to raise 2 kg of copper from 20 °C to 80 °C? (c_Cu = 387 J/kg·°C.) Then complete the frame.",
      "frame": "Water has a c that is ___ times bigger than rock's. Given the same energy, water heats ___ than rock does. This is why ___."
    },
    {
      "id": "rd-ch21-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **21.6–21.9** (specific heat capacity, water's high specific heat, thermal expansion, and the odd expansion of water). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch21-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 21,
      "title": "Temperature, Heat, and Expansion — read & practice",
      "sectionIds": [
        "21.6",
        "21.7",
        "21.8",
        "21.9"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.k1-specific-heat"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 3 — Three Modes: Conduction, Convection, Radiation', 'u5-d03', 'Unit 5: Thermal Physics & the Second Law', 3, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can distinguish CONDUCTION (direct molecular contact), CONVECTION (fluid currents), and RADIATION (electromagnetic waves), and identify the dominant mode in real scenarios.",
      "targetId": "u5.k2-transfer-modes"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "During atmospheric entry, the asteroid loses heat by ALL three modes — friction (conduction at its surface), convection (heated air swept around), and radiation (the asteroid GLOWS).",
      "connection": "Radiation is the one that reaches OBSERVERS — what we see as a meteor's glow. Day 11's damage map uses radiation only to compute the burn radius."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Three ways heat moves\n\nHeat always flows hot → cold, but it has exactly three vehicles:\n\n**Conduction** — molecule bumps molecule. Fast-moving molecules pass KE to slower neighbors by direct contact. No matter moves; only energy does. Needs touching. Metals are great at it; air and styrofoam are terrible.\n\n**Convection** — the fluid itself moves. Warm (less dense) fluid rises, cool (denser) fluid sinks, and the bulk motion carries energy with it. Needs a FLUID — a liquid or a gas.\n\n**Radiation** — electromagnetic waves (especially infrared). Needs NOTHING — it crosses a vacuum. It's how the Sun reaches Earth across 150 million km of empty space.\n\n| Mode | Carrier | Needs a medium? |\n|---|---|---|\n| Conduction | molecular collisions | yes — direct contact |\n| Convection | moving fluid | yes — liquid or gas |\n| Radiation | EM waves (IR) | no — works in vacuum |\n\nMost real scenarios involve more than one mode — your job is to name the **dominant** one."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Conduction",
          "definition": "Heat transfer by direct molecular contact. Fast-moving molecules bump slower-moving neighbors and pass energy along. No bulk motion of matter. Example: a metal spoon in hot soup — the handle warms because molecules at the soup end transfer KE up the spoon. Needs DIRECT CONTACT; metals conduct well, air and styrofoam do not.",
          "cognate": "Sp. conducción · Pt. condução · HC kondiksyon"
        },
        {
          "term": "Convection",
          "definition": "Heat transfer by FLUID CURRENTS. Warmer (less dense) fluid rises; cooler (denser) fluid sinks. Bulk motion of the fluid carries energy. Example: boiling water — hot bubbles rise, cool water replaces them at the bottom; house heating — warm air rises from radiators. Needs a FLUID (liquid or gas); solids don't convect.",
          "cognate": "Sp. convección · Pt. convecção · HC konveksyon"
        },
        {
          "term": "Radiation (thermal)",
          "definition": "Heat transfer by ELECTROMAGNETIC WAVES (especially infrared). No medium needed — works through a vacuum. Example: the Sun warms Earth across 150 million km of vacuum; a meteor's glow reaches your eye through air. This is THERMAL radiation (light/infrared) — not the same as nuclear radiation.",
          "cognate": "Sp. radiación · Pt. radiação · HC radyasyon"
        }
      ]
    },
    {
      "id": "b5",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "Where an entering asteroid's heat goes",
      "caption": "Entry KE becomes surface heat by contact with the slamming air (conduction), the heated air is swept away behind the rock (convection), and the white-hot surface glows (radiation). Only the radiation crosses kilometers of air — or vacuum — to reach your eye on the ground.",
      "genPrompt": "Left-to-right energy chain for atmospheric entry: asteroid KE → surface heating by air contact (conduction) → hot air swept away (convection) → glow (radiation) reaching observers.",
      "links": [
        {
          "label": "Asteroid KE",
          "sublabel": "entry speed ~ km/s"
        },
        {
          "label": "Surface heating",
          "sublabel": "conduction — air slams the rock face"
        },
        {
          "label": "Hot air swept away",
          "sublabel": "convection — currents behind the rock"
        },
        {
          "label": "Glow",
          "sublabel": "radiation — EM waves reach YOU"
        }
      ]
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "For each panel (conduction, convection, radiation), write ONE sentence about HOW energy moves from hot to less-hot. Bottom: which TWO modes carry heat AWAY from an asteroid entering the atmosphere?",
      "prompts": [
        "Three panels: spoon in soup, boiling pot, the Sun warming Earth.",
        "One sentence per panel: how does energy move?",
        "Name the TWO modes that carry heat away from an entering asteroid."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "For each, write the dominant mode: (a) Sun warms Earth. (b) Hot drink in your hand. (c) Convection oven. (d) Wind chill. (e) Asteroid glow seen from the ground. (f) Microwave heats food.",
      "given": "—",
      "equation": "(no equation — name the mode for each)",
      "work": "(a) Sun → Earth: RADIATION (vacuum, EM waves)\n(b) Hot mug → hand: CONDUCTION (direct contact)\n(c) Convection oven: CONVECTION (forced hot air currents)\n(d) Wind chill: CONVECTION (moving air sweeps heat off skin)\n(e) Meteor glow: RADIATION (EM waves through air/vacuum)\n(f) Microwave: RADIATION (microwaves are EM waves)",
      "answer": "3 radiation, 2 convection, 1 conduction."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "Classify each: (a) ice cube melts on a metal plate. (b) Lake surface freezes from the top down in winter. (c) You feel a hot stove without touching. (d) A thermos with vacuum gap.",
      "givenHint": "Four scenarios — for each, ask: is there direct contact? a moving fluid? or EM waves crossing a gap?",
      "equationHint": "No equation today — name the dominant MODE for each scenario (the thermos question: which mode does the vacuum gap FAIL to block?).",
      "equationOptions": [
        "Conduction — direct molecular contact",
        "Convection — fluid currents",
        "Radiation — EM waves (works in vacuum)"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "warning",
      "title": "The thermos trick — vacuum beats two modes, not three",
      "markdown": "A vacuum thermos defeats CONDUCTION and CONVECTION (no air to transfer through) but NOT radiation — so the inside is shiny to reflect IR. The vacuum is the key engineering trick."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "You see a glowing meteor cross the sky. By which mode does the meteor lose energy to YOU on the ground? Why is that the only possible mode? Then complete the frame.",
      "frame": "An asteroid burns up in the atmosphere because ___ (mode) heats its surface, then ___ (mode) carries heat away as the rock glows. Only one of these can happen through a vacuum."
    },
    {
      "id": "rd-ch22",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **22.1–22.7** (conduction, convection, radiation, emission and absorption of radiant energy, Newton's law of cooling, and the greenhouse effect). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch22",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 22,
      "title": "Heat Transfer — read & practice",
      "sectionIds": [
        "22.1",
        "22.2",
        "22.3",
        "22.4",
        "22.5",
        "22.6",
        "22.7"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.k2-transfer-modes"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 4 — Phase Changes + Latent Heat: Q = m·L', 'u5-d04', 'Unit 5: Thermal Physics & the Second Law', 4, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compute the heat needed to phase-change a mass using Q = mL, explain why temperature is constant during phase changes, and add multiple Q's across a full heating curve (ice → water → steam).",
      "targetId": "u5.k3-latent-heat"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ doesn't just heat up at impact — it MELTS rock, then VAPORIZES rock. Each transition takes enormous energy.",
      "connection": "The crater's heat doesn't just raise rock temperature; it phases rock into vapor. Day 11 uses latent heat values to compute the vaporization energy at the impact site."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## When the thermometer stops moving\n\nHeat a block of ice and watch the thermometer. It climbs… then STOPS at 0 °C while the ice melts… then climbs again… then STOPS at 100 °C while the water boils. During the flat stretches you're still pouring energy in — it's just going into **breaking molecular bonds**, not into faster molecules.\n\nThe energy price of a phase change is:\n\n**Q = m · L**\n\nwhere L is the **latent heat** in J/kg. For water:\n\n| Transition | L (J/kg) |\n|---|---|\n| Melting / freezing (L_f, fusion) | 334,000 |\n| Boiling / condensing (L_v, vaporization) | 2,260,000 |\n\nNotice L_v is about **7× bigger** than L_f — fully separating molecules into a gas costs far more than loosening them into a liquid.\n\nA full heating curve (say, ice at −10 °C → steam at 110 °C) is just an **addition problem**: sloped segments use Q = mcΔT (with the right c for ice, water, or steam), flat segments use Q = mL. Compute each piece, add them up."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Phase change",
          "definition": "A transition between solid ⇄ liquid ⇄ gas. Temperature stays CONSTANT during the change while energy goes into breaking molecular bonds (not into KE). Example: pure ice at 0 °C absorbs heat → stays at 0 °C while it melts → only AFTER it's all liquid does the temperature rise.",
          "cognate": "Sp. cambio de fase · Pt. mudança de fase · HC chanjman faz"
        },
        {
          "term": "Latent heat (L)",
          "definition": "Energy per kg required for a phase change at the transition temperature. L_f = latent heat of FUSION (melt/freeze). L_v = latent heat of VAPORIZATION (boil/condense). Units: J/kg. Water L_f = 334,000 J/kg — to melt 1 kg of ice: Q = 1 · 334,000 = 334 kJ. Water L_v = 2,260,000 J/kg — boiling needs 7× more energy than melting! 'Latent' means hidden — the energy goes into breaking bonds, not into temperature.",
          "cognate": "Sp. calor latente · Pt. calor latente · HC chalè latant"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Adding heat but the thermometer doesn't move?",
      "markdown": "During a phase change you ARE adding energy — but it's breaking bonds, not raising the average molecular KE. So T holds constant until the entire mass has changed phase. A thermometer reading a flat line does NOT mean the heat stopped."
    },
    {
      "id": "b6",
      "type": "graph",
      "title": "Heating curve — 0.5 kg of water from ice at −10 °C to steam at 110 °C",
      "xLabel": "Total heat added Q (kJ)",
      "yLabel": "Temperature (°C)",
      "genPrompt": "Heating curve for 0.5 kg: warm ice (−10→0 °C, 10 kJ), melt flat at 0 °C (167 kJ), warm water (0→100 °C, 209 kJ), boil flat at 100 °C (1130 kJ), warm steam (100→110 °C, 10 kJ). The boiling plateau dominates the x-axis.",
      "series": [
        {
          "label": "T vs. heat added",
          "points": [
            [
              0,
              -10
            ],
            [
              10,
              0
            ],
            [
              177,
              0
            ],
            [
              387,
              100
            ],
            [
              1517,
              100
            ],
            [
              1527,
              110
            ]
          ]
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Label each segment of the heating curve with its equation (Q = mcΔT or Q = mL). Mark where T stays constant. Which flat segment is LONGER — melting or boiling? Why?",
      "prompts": [
        "Copy the staircase shape; label all 5 segments with the right equation.",
        "Circle the two flat (constant-T) segments.",
        "One sentence: why is the boiling plateau so much longer?"
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "How much heat is needed to melt 0.5 kg of ice at 0 °C? (L_f = 334 kJ/kg.)",
      "given": "m = 0.5 kg · L_f = 334,000 J/kg",
      "equation": "Q = m · L_f",
      "work": "Q = 0.5 · 334,000\nQ = 167,000 J\nQ = 167 kJ",
      "answer": "167 kJ — and the ice stays at 0 °C the whole time."
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "Total heat to convert 0.5 kg of ice at -10 °C to steam at 110 °C? Five sub-steps. Add them up.",
      "given": "m = 0.5 kg · c_ice = 2090 · c_water = 4186 · c_steam = 2010 · L_f = 334,000 · L_v = 2,260,000",
      "equation": "Q_total = Q_warm_ice + Q_melt + Q_warm_water + Q_boil + Q_warm_steam",
      "work": "Q₁ = 0.5 · 2090 · 10 = 10,450 J   (warm ice -10 → 0)\nQ₂ = 0.5 · 334,000 = 167,000 J    (MELT at 0)\nQ₃ = 0.5 · 4186 · 100 = 209,300 J (warm water 0 → 100)\nQ₄ = 0.5 · 2,260,000 = 1,130,000 J (BOIL at 100)\nQ₅ = 0.5 · 2010 · 10 = 10,050 J   (warm steam 100 → 110)\nQ_total ≈ 1,526,800 J ≈ 1.5 × 10⁶ J",
      "answer": "≈ 1.5 × 10⁶ J. The BOILING step alone is ~75% of the total energy."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "How much heat is needed to vaporize 0.2 kg of water already at 100 °C? (L_v = 2,260,000 J/kg.)",
      "givenHint": "m = 0.2 kg · L_v = 2,260,000 J/kg · water is ALREADY at 100 °C, so no warming step.",
      "equationHint": "Q = m · L_v — one step, no ΔT term (the temperature doesn't change during the phase change).",
      "equationOptions": [
        "Q = m · L_v",
        "Q = m · c · ΔT",
        "Q = m · L_f",
        "KE = ½ · m · v²"
      ]
    },
    {
      "id": "b11",
      "type": "callout",
      "variant": "note",
      "title": "Why sweating works",
      "markdown": "This is why sweating cools you: every drop of sweat that evaporates carries off 2,260 kJ/kg of body heat. The high L_v of water is a survival adaptation."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "How much heat to vaporize 0.2 kg of water at 100 °C? (Use L_v = 2,260,000 J/kg.) Then complete the frame.",
      "frame": "During a phase change, temperature stays ___ because energy is going into ___, not into ___. Boiling water requires ___× more energy than melting the same mass of ice."
    },
    {
      "id": "rd-ch23",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **23.1–23.8** (evaporation, condensation, boiling, freezing, regelation, and the energy of phase changes). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch23",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 23,
      "title": "Change of Phase — read & practice",
      "sectionIds": [
        "23.1",
        "23.2",
        "23.3",
        "23.4",
        "23.5",
        "23.6",
        "23.7",
        "23.8"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.k3-latent-heat"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 5 — Vernier Calorimetry Lab (Investigation 5.1)', 'u5-d05', 'Unit 5: Thermal Physics & the Second Law', 5, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can mix hot + cold water using styrofoam-cup calorimetry, predict T_final using Q_lost = Q_gained, measure T_final with a Vernier probe, and identify an unknown metal by its specific heat with one credible source of error noted.",
      "targetId": "u5.s1-calorimetry-lab"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We've stated Q = mcΔT and the calorimetry balance Q_lost = Q_gained. Today we measure them.",
      "connection": "If we trust the equation in our cups, we can trust it for the planetary-scale calculations on Day 11 (impact vaporization)."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 5.1 — Calorimetry: predict, measure, identify",
      "markdown": "**Driving question:** Does the predicted final temperature of mixed hot + cold water match the measured value within 5%? Then: can we identify an unknown metal from its measured c?\n\n**Equipment:** Vernier temperature probe + LabQuest (or Graphical Analysis) · two styrofoam cups (insulated calorimeter) + lid with hole for probe · hot-water source (~70 °C) and ice-cooled water (~20 °C) · balance (read m_water to 0.1 g) · unknown metal samples labeled 'A' and 'B' (aluminum + copper) · hot plate or pre-heated water bath to bring metals to ~95 °C · tongs (HOT METAL — do not touch with bare hands).\n\n**How this lab serves the year's question:** A successful Q_lost = Q_gained check confirms calorimetry works — the foundation for the impact vaporization calculation on Day 11."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "**TRIAL A — mix two waters.** Mass cup empty. Add 100 mL hot water; record m_h and T_h. Pour in 100 mL cold water; record m_c and T_c. Cover. Stir gently. Watch probe. Record T_final when steady.",
        "Predict T_f using m_h·c·(T_h − T_f) = m_c·c·(T_f − T_c). Compare to measured. % diff.",
        "Repeat Trial A two more times with different mass ratios. Three rows of data.",
        "**TRIAL B — identify a metal.** Heat a known mass of metal A to ~95 °C in a hot bath. Drop into a fresh cup of cold water. Record T_final.",
        "Compute Q_gained_water = m_w·c_w·(T_f − T_c) and set = -Q_lost_metal = m_m·c_m·(T_f − T_m_initial). Solve for c_m. Compare to table.",
        "Repeat for metal B. Identify both samples."
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "HOT WATER and HOT METAL. Use tongs. Pour with care. Goggles always."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "tip",
      "title": "Not in class today?",
      "markdown": "There's no simulation for this one — use this sample run instead and do all the math yourself. **Trial A:** 100.0 g of hot water at 70.0 °C mixed with 100.0 g of cold water at 20.0 °C; the probe settled at **44.2 °C** (prediction first — what SHOULD it be for equal masses?). **Trial B:** Sample A — 50.0 g of metal at 95.0 °C dropped into 100.0 g of water at 20.0 °C; T_f = **27.0 °C**. Sample B — 50.0 g of metal at 95.0 °C into 100.0 g of water at 20.0 °C; T_f = **23.2 °C**. Fill the data tables from these numbers, compute c for each metal, and identify both samples from the table (water 4186 · aluminum 900 · copper 387)."
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch your setup for BOTH trials. Label masses and starting temperatures on the diagram. Fill in T_final after each trial.",
      "prompts": [
        "Trial A panel: two cups, probe through the lid, m_h/T_h and m_c/T_c labeled.",
        "Trial B panel: hot bath with metal, tongs, fresh cup of cold water.",
        "Write T_final on each panel after the trial."
      ]
    },
    {
      "id": "b8",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "m_h (g)",
        "T_h (°C)",
        "m_c (g)",
        "T_c (°C)",
        "T_f predicted (°C)",
        "T_f measured (°C)",
        "% diff"
      ],
      "rows": 3,
      "plot": false,
      "patternPrompt": "TRIAL A — mix hot + cold water (three trials, different mass ratios). How close are your predicted and measured T_f values?"
    },
    {
      "id": "b9",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Sample",
        "m_metal (g)",
        "T_metal_i (°C)",
        "m_water (g)",
        "T_water_i (°C)",
        "T_f (°C)",
        "c_metal computed",
        "identified as"
      ],
      "rows": 2,
      "plot": false,
      "patternPrompt": "TRIAL B — identify the unknown metal. Does your computed c land near a table value?"
    },
    {
      "id": "b10",
      "type": "observation",
      "capture": true,
      "patternPrompt": "In Trial A, did T_predicted match T_measured? Across all 3 trials, within what %?",
      "interpretPrompt": "In Trial B, which metals did A and B turn out to be? Did c land within 10% of the table value? If not, what physical thing did we miss? Asteroid connection: how does this serve the year's question?",
      "frame": "My T_f predictions agreed within ___ %. Metal A came out closest to ___ (with c = ___). The biggest source of error was ___."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Complete the frame about WHY calorimetry works.",
      "frame": "Calorimetry works because the energy LOST by the hot water equals the energy GAINED by the ___. The cup is styrofoam to MINIMIZE ___."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Write a one-sentence CLAIM about what the lab confirmed, then one sentence of EVIDENCE (your numbers), then one sentence of REASONING (why the % difference is small — or not).",
      "frame": "CLAIM: ___. EVIDENCE: ___. REASONING: ___."
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.s1-calorimetry-lab"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 6 — Temperature Is Molecular KE', 'u5-d06', 'Unit 5: Thermal Physics & the Second Law', 6, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can state that temperature is proportional to the average KE per molecule (KE_avg = 3/2 · k · T), explain phase changes as bond-breaking at the molecular level, and predict what happens to molecular speed as T changes.",
      "targetId": "u5.k4-kinetic-theory"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Day 1: thermal energy is total molecular KE. From Day 4: phase changes happen at constant T.",
      "connection": "The molecular picture explains BOTH. Temperature is avg KE per molecule. During a phase change, added energy goes into breaking bonds — not into raising avg KE. So T stays put while the bonds break."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Zoom in far enough and 'hot' means 'fast'\n\nKinetic theory says matter is molecules in constant motion: in a gas they fly randomly, in a liquid they jostle, in a solid they vibrate in place. Temperature is nothing mysterious — it's a **speedometer reading averaged over molecules**:\n\n**KE_avg = (3/2) · k · T**\n\nwhere k = Boltzmann's constant (1.38 × 10⁻²³ J/K) and T is in **Kelvin** (add 273 to °C).\n\nThis one idea closes two loops from earlier in the unit:\n\n- **Day 1's distinction**: thermal energy = TOTAL molecular KE (extensive); temperature = AVERAGE KE per molecule (intensive). Same molecules, two different bookkeeping questions.\n- **Day 4's flat plateaus**: during a phase change, the added heat breaks intermolecular bonds instead of speeding molecules up. Average KE doesn't change → the thermometer doesn't move.\n\nOne more payoff: since KE = ½mv², doubling the Kelvin temperature doubles the average KE — but speed only grows by **√2**, because v sits inside a square."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Kinetic theory",
          "definition": "Matter is made of molecules in constant motion. In a gas, they fly randomly. In a liquid, they jostle. In a solid, they vibrate in place. Temperature measures the AVERAGE KE per molecule. At room temperature, an N₂ molecule moves at ~500 m/s on average — heat the gas, molecules speed up; cool it, they slow down. ALL molecules move (even in solids — they vibrate); absolute zero (0 K = -273 °C) is the theoretical floor where motion is minimum.",
          "cognate": "Sp. teoría cinética · Pt. teoria cinética · HC teyori sinetik"
        },
        {
          "term": "KE_avg = (3/2) · k · T",
          "definition": "The average kinetic energy per molecule of a gas, where k = Boltzmann's constant (1.38 × 10⁻²³ J/K) and T is in Kelvin. At T = 300 K: KE_avg = 1.5 · 1.38e-23 · 300 ≈ 6.2 × 10⁻²¹ J per molecule. Multiply by ~10²³ molecules per mole → ~620 J per mole.",
          "cognate": "Sp. energía cinética promedio · Pt. energia cinética média"
        },
        {
          "term": "Phase change at the molecular level",
          "definition": "Adding heat breaks intermolecular BONDS. Energy goes into breaking bonds, not into faster motion. So T stays constant. At 0 °C, ice molecules vibrate; add heat and molecules break loose into liquid — same average speed as the ice they came from. T stays at 0 °C until all the ice is melted. The latent heat from Day 4 is exactly the energy that goes into BOND-BREAKING, not into avg KE.",
          "cognate": "Sp. ruptura de enlaces · Pt. ruptura de ligações"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "T must be in KELVIN, not Celsius",
      "markdown": "KE_avg = (3/2)·k·T only works with absolute temperature. Add 273 to °C to get K. (Using 27 °C instead of 300 K makes the answer 11× too small — and 0 °C would absurdly predict zero molecular motion.)"
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Compare the three panels (solid · liquid · gas). Where are molecules FASTEST on average? Where do they have the MOST freedom of position? Why does temperature stay constant during a phase change?",
      "prompts": [
        "Three panels: vibrating lattice (solid), jostling crowd (liquid), flying dots (gas).",
        "Mark which panel has the fastest average molecules and which has the most positional freedom.",
        "One sentence: where does the energy go during a phase change?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "Compute the average KE per molecule for a gas at room temperature (T = 300 K). Use k = 1.38 × 10⁻²³ J/K.",
      "given": "T = 300 K · k = 1.38 × 10⁻²³ J/K",
      "equation": "KE_avg = (3/2) · k · T",
      "work": "KE_avg = 1.5 · 1.38e-23 · 300\nKE_avg = 1.5 · 4.14e-21\nKE_avg ≈ 6.2 × 10⁻²¹ J per molecule",
      "answer": "≈ 6.2 × 10⁻²¹ J per molecule — a tiny number, but multiply by ~10²³ molecules and you get the gas's thermal energy."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "If you double the Kelvin temperature (300 K → 600 K), what happens to the average molecular KE? What happens to the average molecular SPEED? (Hint: KE = ½mv².)",
      "givenHint": "T doubles: 300 K → 600 K. KE_avg ∝ T. Speed hides inside KE = ½mv².",
      "equationHint": "KE_avg = (3/2)·k·T says KE doubles. Then KE = ½·m·v² — if KE doubles, v grows by √2 ≈ 1.41×, not 2×.",
      "equationOptions": [
        "KE_avg = (3/2) · k · T",
        "KE = ½ · m · v²",
        "Q = m · c · ΔT",
        "p = m · v"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "tip",
      "title": "Try it — PhET States of Matter",
      "markdown": "PhET States of Matter sim: heat solid argon. Watch molecular motion increase. See solid → liquid → gas transitions. Look for the moments when T plateaus (phase change in progress). Search \"PhET States of Matter\" — it runs free in any browser."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does temperature stay constant during a phase change, even though heat is being added? Answer in terms of where the energy is GOING at the molecular level. Then complete the frame.",
      "frame": "Temperature is the ___ kinetic energy per molecule. During a phase change, added heat goes into ___ instead of raising avg KE — so the thermometer doesn't move."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.k4-kinetic-theory"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 7 — First Law: ΔU = Q − W', 'u5-d07', 'Unit 5: Thermal Physics & the Second Law', 7, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply ΔU = Q − W to gas systems, assign correct signs to Q (heat in = +) and W (work BY system = +), and predict ΔU in heating, cooling, expansion, and compression cases.",
      "targetId": "u5.k5-first-law"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "After impact, the fireball is a high-temperature gas EXPANDING against the surrounding atmosphere — a thermodynamic system.",
      "connection": "The first law describes how the fireball's internal energy converts to WORK pushing on the surrounding air — that's the shockwave. Day 11 will partition the impact KE using this framework."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Energy bookkeeping for a gas\n\n**ΔU = Q − W** — the first law of thermodynamics. It's conservation of energy, written for gases: the change in a system's internal energy equals the heat that flows IN minus the work the system does on its surroundings.\n\nThere are exactly two ways to change a gas's internal energy U:\n\n1. **Heat (Q)** crosses the boundary. Heat IN: Q > 0. Heat OUT: Q < 0.\n2. **Work (W)** is done across the boundary. The gas EXPANDS and pushes on the surroundings: W > 0 (the system spends energy). The gas is COMPRESSED by an outside push: W < 0 (the system gains energy).\n\nA bike pump warms up with NO flame anywhere — you do work ON the gas, so W is negative, and ΔU = 0 − (−W) is positive. Compression alone raises temperature. The impact fireball runs the same equation in reverse: a huge ΔU drives expansion work on the air — the shockwave."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Internal energy (U)",
          "definition": "The total energy contained inside a system — sum of all molecules' KE and bond PE. Symbol: U. Units: Joules. Heating a gas raises U. Cooling lowers U. Compressing it without heat exchange ALSO raises U (work done on the system).",
          "cognate": "Sp. energía interna · Pt. energia interna · HC enèji entèn"
        },
        {
          "term": "First law: ΔU = Q − W",
          "definition": "Change in internal energy = heat added to the system MINUS work done BY the system on the surroundings. Energy conservation, written for gases. Example: 500 J of heat IN, gas does 200 J of work expanding → ΔU = 500 − 200 = 300 J. Internal energy rises by 300 J.",
          "cognate": "Sp. primera ley · Pt. primeira lei"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "U lives INSIDE — Q and W cross the boundary",
      "markdown": "U is the system's OWN energy. Q and W are how energy MOVES across the boundary. ΔU = what stays. Don't write Q or W as 'energy the gas has' — they're flows, not contents."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw a gas in a cylinder with a movable piston. Label Q (heat crossing the boundary), W (work at the piston), and ΔU (inside the gas). Then sketch the signs for the three cases.",
      "prompts": [
        "Case 1: heat enters and the gas expands — signs of Q, W, ΔU?",
        "Case 2: heat enters and the gas is held still — signs?",
        "Case 3: a bike pump compresses the gas with no heat exchange — signs?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "HEAT A GAS, IT EXPANDS — 500 J of heat is added to a gas. The gas does 200 J of work as it expands. What is ΔU?",
      "given": "Q = +500 J (heat IN) · W = +200 J (work BY system, expansion)",
      "equation": "ΔU = Q − W",
      "work": "ΔU = 500 − 200\nΔU = +300 J",
      "answer": "Internal energy rises by 300 J. Some heat became work; the rest stayed."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "BIKE PUMP (ADIABATIC COMPRESSION) — You compress air in a bike pump. 300 J of work is done ON the gas (so W = −300 J from the system's perspective). No heat is exchanged (adiabatic; Q = 0). What is ΔU? Why does the pump get warm?",
      "given": "Q = 0 (adiabatic — no heat in) · W = −300 J (work done ON the gas)",
      "equation": "ΔU = Q − W",
      "work": "ΔU = 0 − (−300)\nΔU = +300 J",
      "answer": "Internal energy rises by 300 J → temperature rises. That's why the pump is warm."
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "warning",
      "title": "SIGNS, SIGNS, SIGNS",
      "markdown": "Stop on every problem and ask: is heat going IN or OUT? Is work being done BY the system or ON it? Get these right and the math is easy."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "SYSTEM DOES MORE WORK THAN HEAT ADDED — 100 J of heat enters a system. The system does 150 J of work on the surroundings. What is ΔU? What's happening physically?",
      "givenHint": "Q = +100 J (heat IN) · W = +150 J (work BY the system)",
      "equationHint": "ΔU = Q − W — the system does MORE work than the heat coming in, so watch the sign of ΔU.",
      "equationOptions": [
        "ΔU = Q − W",
        "Q = m·c·ΔT",
        "η = W/Q_hot",
        "KE = ½mv²"
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Check your YOUR TURN answer: 100 J of heat enters a system and the system does 150 J of work. What is ΔU, and what does the sign tell you? Then complete the bike-pump frame.",
      "frame": "When the bike pump warms up, the work I do ON the gas becomes ___. With Q = 0 and W negative (work done ON the gas), ΔU is ___ — so T ___."
    },
    {
      "id": "rd-ch24-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **24.1–24.3** (absolute zero, the first law of thermodynamics, and adiabatic processes). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch24-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 24,
      "title": "Thermodynamics — read & practice",
      "sectionIds": [
        "24.1",
        "24.2",
        "24.3"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.k5-first-law"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 8 — Second Law: Heat Flows Hot → Cold; Entropy', 'u5-d08', 'Unit 5: Thermal Physics & the Second Law', 8, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can state the second law (heat flows spontaneously HOT → COLD; entropy of the universe always increases), and classify everyday processes as spontaneous (entropy-increasing) or requiring an external energy input.",
      "targetId": "u5.r1-second-law"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ's KE at impact becomes thermal energy — a HIGH-entropy state.",
      "connection": "There's no natural process that converts that heat back into organized motion. The impact is IRREVERSIBLE — it can't be undone. The second law tells us why."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The law with a direction built in\n\nThe first law says energy is conserved — but it never says which WAY a process runs. Energy would still be conserved if your coffee spontaneously got hotter by pulling heat out of the cool room. That never happens. The **second law** is the rule that gives nature its one-way arrow:\n\n- **Clausius form:** heat NEVER spontaneously flows from cold to hot. To push it backward, you must do external work (that's what a refrigerator is).\n- **Entropy form:** in every spontaneous process, the total **entropy** (disorder) of the universe INCREASES.\n\nShuffled cards don't un-shuffle. Broken eggs don't un-break. Mixed cream doesn't un-mix. And an asteroid impact — organized kinetic energy turned into the random jiggling of hot rock, hot air, and hot vapor — can never run in reverse. Today you'll classify processes: **spontaneous** (entropy goes up, no help needed) versus **requires input** (entropy drops locally only because something outside pays for it)."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Second law (Clausius)",
          "definition": "Heat NEVER spontaneously flows from cold to hot. To move heat backward, you must do external work (a refrigerator). Coffee never spontaneously gets hotter sitting in a cool room — it always cools. 'Spontaneous' doesn't mean fast — it means happens WITHOUT external help.",
          "cognate": "Sp. segunda ley · Pt. segunda lei"
        },
        {
          "term": "Entropy (S)",
          "definition": "A measure of disorder — the number of ways the molecules in a system can be arranged. Higher entropy = more disorder = more possible arrangements. An organized deck of cards has LOW entropy; shuffled, HIGH. Entropy can drop LOCALLY (your fridge cools), but the room outside heats more than the fridge cools — the universe's TOTAL entropy increases.",
          "cognate": "Sp. entropía · Pt. entropia"
        },
        {
          "term": "Arrow of time",
          "definition": "The reason we feel time as moving forward — it's the direction of increasing entropy. A movie of an ice cube melting looks normal. Reversed (cold water spontaneously freezing into a cube), it looks bizarre — even though physics doesn't forbid the molecular motion. Statistically, it just never happens.",
          "cognate": "Sp. flecha del tiempo · Pt. seta do tempo"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "The FIRST law doesn't forbid cold → hot. The SECOND law does.",
      "markdown": "Heat flowing from cold to hot would still conserve energy — the first law is perfectly happy with it. It's the second law that rules it out. That's why we need BOTH laws: one for the amount, one for the direction."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw a HOT block and a COLD block touching. Mark the ALLOWED direction of spontaneous heat flow and the FORBIDDEN direction. Bottom of the page: the open-fridge kitchen.",
      "prompts": [
        "Arrow for the allowed direction; an X over the forbidden one",
        "Sketch the kitchen with the fridge door open — draw every heat flow, including the motor's work",
        "Why can't you cool a room by leaving the fridge door open?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "CLASSIFY 6 PROCESSES — For each, write SPONTANEOUS (entropy increases) or REQUIRES INPUT (entropy decreases locally): (a) hot coffee cools. (b) egg breaks. (c) sugar dissolves in water. (d) iron rusts. (e) refrigerator cools food. (f) battery being charged.",
      "given": "—",
      "equation": "(no equation — classify each)",
      "work": "(a) coffee cools: SPONTANEOUS (entropy ↑)\n(b) egg breaks: SPONTANEOUS (entropy ↑)\n(c) sugar dissolves: SPONTANEOUS (entropy ↑)\n(d) iron rusts: SPONTANEOUS (entropy ↑ slowly)\n(e) refrigerator cools food: REQUIRES INPUT (electricity from outlet)\n(f) battery charges: REQUIRES INPUT (electrical work)",
      "answer": "All natural processes go entropy ↑. Reversing them costs energy."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "FRIDGE WITH DOOR OPEN — You leave the fridge door open hoping to cool your kitchen. Will the room get colder? Explain using the second law. (Hint: where does the heat removed from inside the fridge GO?)",
      "givenHint": "The fridge PUMPS heat from inside (cool) to its coils outside (warmer) — and the kitchen contains BOTH sides.",
      "equationHint": "Track every heat flow, including the work the motor adds — that work ends up as heat in the kitchen too.",
      "equationOptions": [
        "Second law: heat flows hot → cold; pushing it backward costs external work",
        "ΔU = Q − W",
        "Q = m·c·ΔT",
        "η_max = 1 − T_C/T_H"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "Why the open-door fridge HEATS the room",
      "markdown": "A refrigerator pumps heat from inside (cool) to outside (warmer). With the door open, the kitchen is BOTH inside and outside the fridge — so the kitchen heats up (because the fridge motor adds work, which becomes heat)."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why can't you cool your kitchen by leaving the refrigerator door open? Use the second law in your answer. Then complete the frame.",
      "frame": "Heat flows from hot to cold spontaneously because that direction ___ entropy. Going the other way requires ___. A refrigerator does this by ___."
    },
    {
      "id": "rd-ch24-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **24.4, 24.6–24.7** (the second and third laws, order tending to disorder, and entropy). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch24-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 24,
      "title": "Thermodynamics — read & practice",
      "sectionIds": [
        "24.4",
        "24.6",
        "24.7"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.r1-second-law"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 9 — Heat Engines + Efficiency', 'u5-d09', 'Unit 5: Thermal Physics & the Second Law', 9, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe a heat engine cycle (heat in from hot reservoir → some work out → waste heat to cold reservoir), compute efficiency from Q_hot and W, and compare to the Carnot limit η_max = 1 − T_cold/T_hot.",
      "targetId": "u5.r2-heat-engines"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "The expanding fireball after impact is a NATURAL heat engine — it converts some thermal energy to mechanical work (the shockwave).",
      "connection": "No engine — not even an impact fireball — converts 100% of heat to work. The second law forbids it. Day 11's KE partition (vaporization + shockwave + thermal radiation) reflects exactly this limit."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Heat in, work out, waste required\n\nA **heat engine** is any device that turns heat into work: car engine, power plant, jet turbine — or an impact fireball. Every one of them runs the same three-arrow cycle:\n\n1. **Q_hot** flows IN from a hot reservoir (burning gasoline, steam, the fireball).\n2. SOME of it leaves as useful **work W** (piston, turbine, shockwave).\n3. The REST is dumped as waste heat **Q_cold** to a cold reservoir (exhaust, cooling tower, the surrounding air).\n\nEnergy conservation ties them together: **Q_hot = W + Q_cold**. The fraction that becomes work is the **efficiency**:\n\n**η = W / Q_hot = 1 − Q_cold/Q_hot** — always less than 1.\n\nAnd the second law puts a hard ceiling on it. The best ANY engine can do between a hot reservoir at T_H and a cold one at T_C (both in Kelvin) is the **Carnot limit**:\n\n**η_max = 1 − T_C/T_H**\n\nNo design, no fuel, no clever engineering beats it. A real engine can only creep closer."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Heat engine",
          "definition": "A device that takes heat IN from a hot reservoir, converts SOME to useful work, and DUMPS the rest as waste heat to a cold reservoir. Car engine: gasoline combustion (hot) → piston work (W) → exhaust heat (Q_cold to outside). Power plant: steam (hot) → turbine work → cooling tower (cold). The cold reservoir is REQUIRED — without a cold side the engine can't work; the second law mandates waste heat.",
          "cognate": "Sp. máquina térmica · Pt. máquina térmica · HC machin a chalè"
        },
        {
          "term": "Efficiency (η)",
          "definition": "The fraction of heat input that becomes useful work. η = W / Q_hot = 1 − Q_cold/Q_hot. Always < 1. Power plant: 1000 J in, 400 J of work, 600 J waste → η = 400/1000 = 40%. Car: ~25%. Human body: ~25%. η is dimensionless (between 0 and 1, or 0% and 100%); 1 (100%) is impossible.",
          "cognate": "Sp. eficiencia · Pt. eficiência · HC efikasite"
        },
        {
          "term": "Carnot limit (η_max)",
          "definition": "The MAXIMUM possible efficiency for an engine between hot reservoir at T_H (Kelvin) and cold reservoir at T_C (Kelvin). η_max = 1 − T_C/T_H. Real engines are always below this. Power plant with T_H = 600 K, T_C = 300 K → η_max = 1 − 300/600 = 0.50 = 50%. Real plant gets 40% — below the limit.",
          "cognate": "Sp. límite de Carnot · Pt. limite de Carnot"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "USE KELVIN. ALWAYS.",
      "markdown": "T_C/T_H is a RATIO — only Kelvin gives the right ratio. Don't use °C. (300 K / 600 K = 0.5, but 27 °C / 327 °C = 0.08 — nonsense.) Convert first: K = °C + 273.15."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "energy_chain",
      "links": [
        {
          "label": "Q_hot in",
          "sublabel": "1000 J from hot reservoir (600 K steam)"
        },
        {
          "label": "Engine converts SOME to work",
          "sublabel": "W = 400 J useful (turbine / piston / shockwave)"
        },
        {
          "label": "Q_cold dumped",
          "sublabel": "600 J waste heat to cold reservoir (300 K cooling tower)"
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw the heat-engine box diagram: hot reservoir on top, engine box in the middle, cold reservoir on the bottom. Label Q_hot, W, and Q_cold with arrows.",
      "prompts": [
        "Label the power-plant numbers: 1000 J in, 400 J of work out — where does the other 600 J go?",
        "Compute the efficiency for that example and write it inside the engine box",
        "Compute the Carnot limit at T_H = 500 K, T_C = 300 K and compare"
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "POWER PLANT EFFICIENCY — A power plant takes 1000 J of heat from steam at 600 K, produces 400 J of useful work, and dumps 600 J as waste heat to a 300-K cooling tower. (a) Real efficiency? (b) Carnot limit at these temperatures? (c) Is the real engine doing OK?",
      "given": "Q_hot = 1000 J · W = 400 J · Q_cold = 600 J · T_H = 600 K · T_C = 300 K",
      "equation": "η = W/Q_hot AND η_max = 1 − T_C/T_H",
      "work": "η = 400 / 1000 = 0.40 = 40%\nη_max = 1 − 300/600 = 1 − 0.5 = 0.50 = 50%\nReal / Carnot = 40 / 50 = 80% of the limit.",
      "answer": "40% efficient. Carnot limit is 50%. The plant is at 80% of the theoretical max."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "CAR ENGINE — A car engine receives 1500 J of heat per cycle and produces 400 J of work. (a) Efficiency? (b) How much heat is wasted to exhaust?",
      "givenHint": "Q_hot = 1500 J · W = 400 J per cycle",
      "equationHint": "η = W/Q_hot for part (a). For part (b): Q_cold = Q_hot − W.",
      "equationIds": [
        "efficiency"
      ]
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "CARNOT FOR A STEAM ENGINE — A steam engine runs between T_H = 450 K (steam) and T_C = 300 K (condenser). What is the maximum possible efficiency?",
      "givenHint": "T_H = 450 K · T_C = 300 K (already in Kelvin — no conversion needed)",
      "equationHint": "η_max = 1 − T_C/T_H — temperatures in Kelvin only.",
      "equationOptions": [
        "η_max = 1 − T_C/T_H",
        "η = W/Q_hot",
        "ΔU = Q − W",
        "Q = m·c·ΔT"
      ]
    },
    {
      "id": "b11",
      "type": "callout",
      "variant": "warning",
      "title": "The Carnot limit is set by the TEMPERATURES alone",
      "markdown": "Not by the working fluid or the engine design. You can never beat it. You can only get closer to it."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A car engine receives 1500 J of heat per cycle and produces 400 J of work. What's its efficiency? Then complete the frame.",
      "frame": "An engine's efficiency is bounded by η_max = ___, which depends only on the hot and cold ___ (in ___). Real engines fall ___ this limit because of friction and other losses."
    },
    {
      "id": "rd-ch24-c",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **24.5** (heat engines and the second law — Carnot's ideal efficiency). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch24-c",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 24,
      "title": "Thermodynamics — read & practice",
      "sectionIds": [
        "24.5"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.r2-heat-engines"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 10 — Atmospheric Entry: Why Pebbles Burn Up', 'u5-d10', 'Unit 5: Thermal Physics & the Second Law', 10, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can compare an asteroid's KE to the energy required to vaporize its mass and explain why surface-area-to-mass ratio sets the size threshold for atmospheric burn-up.",
      "targetId": "u5.r3-atmospheric-entry"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ is HUGE (m ≈ 10⁹ kg, r ≈ 50 m). The Chelyabinsk meteor was tiny (m ≈ 10⁴ kg) — it burst in the atmosphere with no crater.",
      "connection": "Today's question: at 2026-XJ's size, does the atmosphere matter at all? Where's the size threshold between 'burns up' and 'reaches ground'?"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Why pebbles burn up and boulders don't\n\nA rock entering the atmosphere at 15 km/s carries an enormous KE = ½mv². Atmospheric drag does NEGATIVE work on it, and every joule the drag removes shows up as **heat at the rock's surface**.\n\nHere's the surprise: per kilogram, EVERY rock at 15 km/s carries the same KE — about 1.1 × 10⁸ J/kg — which is roughly **13× the energy needed to vaporize that kilogram** (E_vap ≈ 8.6 × 10⁶ J/kg, using c_rock·ΔT + L_v). So why doesn't everything vaporize?\n\n**Geometry.** Drag heating happens at the SURFACE; mass lives in the VOLUME. For a sphere, A/m = 3/(ρ·r):\n\n- A **1-kg pebble** is essentially ALL surface — high A/m, huge drag per kg, every gram gets cooked. It vaporizes completely. (That's a shooting star.)\n- A **10⁹-kg asteroid** has 1000× less surface area per kg. The heat chews on the outside (**ablation**) while the core never feels it. It loses < 1% of its mass and arrives at the ground at nearly full KE.\n\nThe per-kg energy ratio is identical for both. The size threshold isn't about energy — it's about WHERE the heat can reach."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Atmospheric drag",
          "definition": "A friction-like force that air exerts on a fast-moving object. Does NEGATIVE work — takes KE away. The KE removed becomes HEAT at the object's surface. A satellite re-entering at 7.8 km/s heats its surface to ~2000 °C from drag — this is why re-entry shielding matters. The faster the object, the MORE drag per second (drag ∝ v² roughly).",
          "cognate": "Sp. arrastre atmosférico · Pt. arrasto atmosférico"
        },
        {
          "term": "Surface-area-to-mass ratio",
          "definition": "For a sphere, A/m = 3/(ρ·r). SMALL rocks have HIGH A/m → lots of drag per kg → vaporize. BIG rocks have LOW A/m → little drag per kg → survive. A 1-kg pebble has ~1000× more A/m than a 10⁹-kg asteroid: the pebble burns away entirely; the asteroid loses < 1% of its mass to ablation.",
          "cognate": "Sp. área/masa · Pt. área/massa"
        },
        {
          "term": "Ablation",
          "definition": "The process by which a rock's outer layer vaporizes during atmospheric entry, carrying heat AWAY from the rock as molten/vapor mass. The Apollo capsules used ablative heat shields — designed to char and vaporize, carrying heat away rather than letting it into the spacecraft. Ablation HELPS: without it, big asteroids would heat all the way through.",
          "cognate": "Sp. ablación · Pt. ablação"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "It's drag PER KG, not total drag",
      "markdown": "It's not the rock's TOTAL drag force that decides survival — it's the drag force PER KG of rock. Big rocks have lots of drag too, but they have even more mass."
    },
    {
      "id": "b6",
      "type": "diagram",
      "kind": "energy_chain",
      "links": [
        {
          "label": "Kinetic energy",
          "sublabel": "½mv² of the incoming rock at ~15 km/s"
        },
        {
          "label": "Drag does negative work",
          "sublabel": "air resistance strips KE during entry"
        },
        {
          "label": "Heat at the surface",
          "sublabel": "surface reaches ~2000 °C — the glow"
        },
        {
          "label": "Ablation / vaporization",
          "sublabel": "outer layer vaporizes, carrying heat away; high A/m → ALL of it goes"
        }
      ]
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Draw three rocks entering the atmosphere: a 1-kg pebble, a 1000-kg boulder, and 10⁹-kg 2026-XJ. Compare them.",
      "prompts": [
        "Why does the 1-kg pebble vaporize completely?",
        "Why does the 10⁹-kg asteroid arrive at essentially full mass?",
        "Mark the size threshold between 'burns up' and 'reaches ground' on your diagram"
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "THE BIG COMPARISON — KE VS. VAPORIZATION ENERGY. Three rocks at v = 15 km/s. For each, compute (1) KE = ½mv² and (2) energy to vaporize: E_vap = m · (c_rock · ΔT + L_v_rock) where c_rock ≈ 800 J/kg·°C, ΔT ≈ 2000 °C, L_v ≈ 7 × 10⁶ J/kg. Compare ratios.",
      "given": "v = 1.5 × 10⁴ m/s · c_rock = 800 · ΔT ≈ 2000 · L_v ≈ 7 × 10⁶\nE_vap per kg = (800·2000) + (7 × 10⁶) = 1.6 × 10⁶ + 7 × 10⁶ ≈ 8.6 × 10⁶ J/kg",
      "equation": "KE = ½ m v²   AND   E_vap = m · 8.6 × 10⁶ J/kg",
      "work": "ROCK A: m = 1 kg\n  KE = 0.5 · 1 · (1.5e4)² = 1.125 × 10⁸ J\n  E_vap = 1 · 8.6e6 = 8.6 × 10⁶ J\n  ratio KE / E_vap ≈ 13 → KE is 13× more than needed to vaporize. BURNS UP.\n\nROCK B: m = 1000 kg\n  KE = 0.5 · 1000 · (1.5e4)² = 1.125 × 10¹¹ J\n  E_vap = 1000 · 8.6e6 = 8.6 × 10⁹ J\n  ratio = 13 → same ratio per kg — but most heat goes into the surface, not the core. Only OUTER ~10% vaporizes.\n\nROCK C: m = 10⁹ kg (2026-XJ)\n  KE = 0.5 · 1e9 · (1.5e4)² ≈ 1.125 × 10¹⁷ J\n  E_vap = 1e9 · 8.6e6 = 8.6 × 10¹⁵ J\n  ratio = 13 → surface ablation is < 1% of mass. REACHES GROUND.",
      "answer": "Small rocks: ALL surface, vaporize entirely. Big rocks: surface ablates, core survives. The ratio per kg is the SAME — it's geometry (A/m) that decides."
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "Chelyabinsk, February 2013",
      "markdown": "The Chelyabinsk meteor was ~10⁴ kg — small enough that it AIRBURST 30 km up. No crater. Just a shockwave that broke 100,000 windows and injured 1500 people. Big rocks behave differently — Day 11 explains how."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "WOULD A 10-KG ROCK SURVIVE? A 10-kg rock at v = 15 km/s. Compute KE, E_vap, and the ratio. Will it reach the ground intact? Why?",
      "givenHint": "m = 10 kg · v = 1.5 × 10⁴ m/s · E_vap per kg ≈ 8.6 × 10⁶ J/kg",
      "equationHint": "KE = ½mv² and E_vap = m · 8.6 × 10⁶ J/kg. Compare the ratio — then think about A/m: is a 10-kg rock closer to the pebble or the asteroid?",
      "equationIds": [
        "kinetic-energy",
        "heat"
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does a 1-kg rock burn up but a 10⁹-kg asteroid reach the ground? Reason in terms of surface-area-to-mass ratio.",
      "frame": "A small rock burns up because its surface area per kg is ___, so drag per kg is ___ and ALL its KE becomes heat at the surface. 2026-XJ's surface area per kg is ___, so only ___ % ablates and the rest reaches the ground."
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.r3-atmospheric-entry"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 11 — Impact Thermal Damage Map', 'u5-d11', 'Unit 5: Thermal Physics & the Second Law', 11, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can partition 2026-XJ's impact KE into vaporization, shockwave, and thermal radiation; use I = E/(4πr²) with the threshold values to compute the wildfire-ignition and third-degree-burn radii; and build a damage-by-distance map.",
      "targetId": "u5.r4-thermal-damage"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Unit 4 Day 19: 2026-XJ's impact KE ≈ 4.5 × 10¹⁷ J ≈ 108 megatons TNT. That's the YIELD. Today the unit PAYS OFF: where does that energy GO thermally?",
      "connection": "A shockwave alone doesn't explain Tunguska's flattened forest (mostly thermal!) or Chelyabinsk's burning eyes (UV pulse). The fireball is doing damage at HUGE distances. Today: how far?"
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## The payoff day — from yield to damage map\n\nUnit 4 gave us the number: 4.5 × 10¹⁷ J. Today we turn that number into a MAP. Three steps:\n\n**1. Partition the energy.** Impact KE doesn't become one thing — it splits roughly into thirds: vaporized rock, atmospheric shockwave, and thermal radiation (the fireball glow + infrared pulse). About 10% goes to 'other' (ground heating, sound, light losses).\n\n**2. Spread the radiation over a sphere.** The thermal pulse races outward in all directions. At distance r it has spread over a sphere of area 4πr², so the energy per square meter is\n\n**I = E / (4π·r²)** — intensity falls off as 1/r².\n\n**3. Compare to damage thresholds.** Each thermal effect has a known energy-per-area threshold (0.4 cal/cm² ignites paper; 5 cal/cm² causes third-degree burns). Set I equal to a threshold and solve for the radius:\n\n**r = √(E / (4π · threshold))**\n\nEach threshold gives one RING on the map. The shocking result you'll compute today: the wildfire ring reaches ~**800 km** — far beyond the shockwave's ~5 km. Heat, not blast, owns the long range."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Energy partition",
          "definition": "At impact, KE doesn't all become one thing. It splits roughly into thirds: vaporized rock, atmospheric shockwave, and thermal radiation (fireball glow + infrared pulse). For 2026-XJ: vaporization ≈ 1.5 × 10¹⁷ J · shockwave ≈ 1.5 × 10¹⁷ J · radiation ≈ 1.5 × 10¹⁷ J. The exact partition depends on impact angle, target type, and composition — ~⅓ each is a useful first estimate.",
          "cognate": "Sp. partición de energía · Pt. partição de energia"
        },
        {
          "term": "Thermal radiation intensity",
          "definition": "The thermal energy per area received at distance r from a point source emitting energy E. I = E / (4π·r²). Falls off as 1/r². The 4π comes from a SPHERICAL surface at distance r — energy spreads over the whole sphere. 2026-XJ radiates ~1.5 × 10¹⁷ J: at r = 10 km, I ≈ 2900 cal/cm²; at 100 km, ~29 cal/cm²; at 500 km, ~1.1 cal/cm² (still enough to ignite paper).",
          "cognate": "Sp. intensidad de radiación · Pt. intensidade de radiação"
        },
        {
          "term": "Damage thresholds",
          "definition": "Energy-per-area values for specific thermal damage. 0.4 cal/cm² = paper ignites. 5 cal/cm² = third-degree burns. Below ~0.1 cal/cm² = felt but not damaging. Set I = threshold and solve for r: r = √(E / (4π · threshold)). Convert carefully: 1 cal/cm² = 4.184 × 10⁴ J/m².",
          "cognate": "Sp. umbrales de daño · Pt. limiares de dano"
        }
      ]
    },
    {
      "id": "b5",
      "type": "diagram",
      "kind": "energy_chain",
      "links": [
        {
          "label": "Impact KE",
          "sublabel": "4.5 × 10¹⁷ J ≈ 108 megatons (Unit 4 yield)"
        },
        {
          "label": "Vaporized rock (~30%)",
          "sublabel": "1.35 × 10¹⁷ J → R1 ≈ 140 m crater core"
        },
        {
          "label": "Shockwave (~30%)",
          "sublabel": "1.35 × 10¹⁷ J → R2 ≈ 5 km structures flattened"
        },
        {
          "label": "Thermal radiation (~30%)",
          "sublabel": "1.35 × 10¹⁷ J → R3 ≈ 800 km wildfire ring — the longest reach"
        }
      ]
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "This is the centerpiece of the unit. Draw concentric rings around the impact point and fill in the radii R1–R5 using today's calculations. Each ring is a different damage mode.",
      "prompts": [
        "R1 ≈ ___ m: total vaporization (crater) · R2 ≈ 5 km: shockwave destruction",
        "R4 ≈ ___ km: third-degree burns · R3 ≈ ___ km: wildfire ignition",
        "R5 ≈ thousands of km: felt but not catastrophic — which ring is biggest, and why?"
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "STEP 1 — PARTITION 2026-XJ'S IMPACT KE. 2026-XJ delivers 4.5 × 10¹⁷ J at impact. Partition it: 30% to vaporized rock, 30% to shockwave KE, 30% to thermal radiation, 10% other.",
      "given": "KE_total = 4.5 × 10¹⁷ J",
      "equation": "E_x = (fraction) · KE_total",
      "work": "E_vap = 0.30 · 4.5e17 ≈ 1.35 × 10¹⁷ J\nE_shock = 0.30 · 4.5e17 ≈ 1.35 × 10¹⁷ J\nE_rad = 0.30 · 4.5e17 ≈ 1.35 × 10¹⁷ J\n(other = 0.10 · 4.5e17 ≈ 4.5 × 10¹⁶ J — ground heating, sound, light losses)",
      "answer": "Each major channel gets ~1.35 × 10¹⁷ J. Thermal radiation is the one with the LONGEST reach."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "STEP 2 — COMPUTE R1, THE TOTAL-VAPORIZATION RADIUS (CRATER). Using E_vap = 1.35 × 10¹⁷ J, and energy to vaporize rock = 8.6 × 10⁶ J/kg, plus ρ_rock = 2700 kg/m³, compute the mass of rock vaporized and the spherical radius it occupies (assume rock is vaporized from a hemisphere).",
      "given": "E_vap = 1.35 × 10¹⁷ J · e_per_kg = 8.6 × 10⁶ J/kg · ρ = 2700 kg/m³",
      "equation": "m = E_vap / e_per_kg · V = m / ρ · V = ⅔πR1³ → R1",
      "work": "m_vap = 1.35e17 / 8.6e6 ≈ 1.57 × 10¹⁰ kg\nV = 1.57e10 / 2700 ≈ 5.8 × 10⁶ m³\nR1 = (V · 3 / (2π))^(1/3) ≈ (2.77 × 10⁶)^(1/3) ≈ 140 m",
      "answer": "R1 ≈ 140 m. Inside this hemisphere: total rock vaporization (the crater core)."
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "STEP 3 — COMPUTE R3, THE WILDFIRE-IGNITION RADIUS (0.4 CAL/CM²). Using E_rad = 1.35 × 10¹⁷ J, compute the radius at which intensity drops to 0.4 cal/cm² = 1.67 × 10⁴ J/m².",
      "given": "E_rad = 1.35 × 10¹⁷ J · I_paper = 1.67 × 10⁴ J/m²",
      "equation": "I = E / (4π·r²) → r = √(E / (4π·I))",
      "work": "r² = 1.35e17 / (4π · 1.67e4)\nr² = 1.35e17 / 2.10e5\nr² ≈ 6.43 × 10¹¹\nr = √(6.43 × 10¹¹) ≈ 8.0 × 10⁵ m ≈ 800 km",
      "answer": "R3 ≈ 800 km. Inside this ring, paper and dry vegetation can spontaneously ignite. That's a continent-scale wildfire zone."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "STEP 4 — YOUR TURN: COMPUTE R4, THE THIRD-DEGREE BURN RADIUS (5 CAL/CM²). Using E_rad = 1.35 × 10¹⁷ J, compute the radius at which intensity drops to 5 cal/cm² = 2.09 × 10⁵ J/m².",
      "givenHint": "E_rad = 1.35 × 10¹⁷ J · I_3rd-burn = 2.09 × 10⁵ J/m²",
      "equationHint": "Same move as Step 3, new threshold: r = √(E / (4π·I)). Expect R4 SMALLER than R3 — a bigger threshold needs a closer ring.",
      "equationOptions": [
        "I = E/(4π·r²) → r = √(E/(4π·I))",
        "Q = m·c·ΔT",
        "KE = ½mv²",
        "η = W/Q_hot"
      ]
    },
    {
      "id": "b11",
      "type": "prose",
      "markdown": "## Damage-by-distance map — 2026-XJ thermal damage\n\n| Ring | Radius | Damage mode | What happens |\n|---|---|---|---|\n| **R1** | ~140 m | Total vaporization (crater zone) | everything melted/vapor |\n| **R2** | ~5 km | Shockwave destruction (Unit 4 Day 19 reference) | all structures flattened |\n| **R4** | ~227 km | Third-degree burns (5 cal/cm²) | exposed skin burns |\n| **R3** | ~800 km | Wildfire ignition (0.4 cal/cm²) | paper + vegetation burn |\n| **R5** | ~thousands of km | Felt but not catastrophic | windows broken; bright flash |"
    },
    {
      "id": "b12",
      "type": "callout",
      "variant": "warning",
      "title": "Thermal radiation has the LONGEST reach",
      "markdown": "The R3 wildfire radius (~800 km) is HIGHER than R4 (~227 km) and even the shockwave radius (R2 ~5 km). Thermal radiation has the LONGEST reach — which is why historical impacts are remembered for their fires."
    },
    {
      "id": "b13",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Of vaporization, shockwave, and thermal radiation — which damage mode reaches the FURTHEST from a 108-megaton impact? Why? Write two sentences, then complete the frame.",
      "frame": "2026-XJ's impact does damage by THREE main mechanisms: ___ (out to ~140 m), ___ (out to ~5 km), and ___ (out to ~800 km). The thermal pulse has the ___ reach."
    },
    {
      "id": "b14",
      "type": "marzano",
      "capture": true,
      "targetId": "u5.r4-thermal-damage"
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 12 — Unit 5 Transfer Task', 'u5-d12', 'Unit 5: Thermal Physics & the Second Law', 12, 'markdown', true, $u5${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply every Unit 5 tool — Q = mcΔT, Q = mL, the calorimetry balance, ΔU = Q − W, efficiency, the Carnot limit, and the atmospheric-entry energy comparison — independently on the transfer task.",
      "targetId": "u5.transfer-task"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Every Unit 5 tool is in your hands: Q = mcΔT, Q = mL, calorimetry balance, ΔU = Q − W, efficiency, Carnot, atmospheric entry energy comparison.",
      "connection": "Problem 4 is the burn-up question — for a small pebble. You will decide whether a sample asteroid reaches the ground or vaporizes in flight."
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
      "markdown": "## The task — 4 multi-part problems, ~40 minutes, independent\n\n- **Problem 1 — Calorimetry.** Mix two known water samples at different temperatures. Predict T_f using Q_lost = Q_gained. Verify with the value you'd MEASURE if you had a probe.\n- **Problem 2 — Phase change.** Total heat to convert 0.5 kg of ice at −10 °C to steam at 110 °C. Five-step calculation. Identify which step is the LARGEST and explain why.\n- **Problem 3 — Heat engine.** Given Q_hot, Q_cold, T_H, T_C: compute real efficiency. Compute the Carnot limit. Comment on the engine's performance relative to its theoretical max.\n- **Problem 4 — Atmospheric entry (R3 reasoning).** Given a pebble's mass (2 kg) and speed (20 km/s), compute its KE. Then compute the energy to vaporize it entirely (use c_rock + L_v_rock). Compare the two. Does the rock reach the ground? Justify your conclusion.\n\n### How it's scored — 4 dimensions, each 0–4\n\n- **Science** — correct physics: vectors, kinematics, units.\n- **Reasoning** — sound method; uncertainty explained, not just stated.\n- **Communication** — work shown, units labeled, organized, readable.\n- **Transfer-to-Asteroid** — honest public-facing connection to 2026-XJ."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Allowed today",
      "markdown": "The Unit 5 Equation Reference card (with the specific heat, latent heat, and damage-threshold tables) and a calculator. Every equation on it is on the MCAS Equation Sheet — you do **not** need to memorize them. You DO need to recognize when each one applies. You may ask **clarifying** questions about what the task means — but not physics-content questions."
    },
    {
      "id": "b6",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Before you start the paper task, write your plan: four problems, four physics ideas — identify the equation you'll use for each, decide your order, and predict where you'll struggle.",
      "frame": "My plan: first I will ___, then ___. I expect to struggle most with ___."
    },
    {
      "id": "b7",
      "type": "prose",
      "markdown": "## After the task — final unit self-assessment\n\nRate yourself on every Unit 5 target below. This is your end-of-unit Marzano record — it feeds your Mastery Growth Chart and tells us both exactly where to focus before Unit 6 (Waves, Sound & Light) builds on this one."
    },
    {
      "id": "b8",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "u5.k1-specific-heat",
        "u5.k2-transfer-modes",
        "u5.k3-latent-heat",
        "u5.s1-calorimetry-lab",
        "u5.k4-kinetic-theory",
        "u5.k5-first-law",
        "u5.r1-second-law",
        "u5.r2-heat-engines",
        "u5.r3-atmospheric-entry",
        "u5.r4-thermal-damage"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "End-of-unit reflection: where did you grow the most this unit, and what's the one idea you want locked in before Unit 6 (Waves, Sound & Light)?",
      "frame": "I grew most on ___. Before Unit 6 I want to lock in ___."
    }
  ]
}$u5$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

-- Wire each target to its lesson (publish guardrail requires learning_targets.lesson_id)
WITH map(target_slug, lesson_slug) AS (VALUES
  ('u5.anchor-heat-vs-temp','u5-d01'),
  ('u5.k1-specific-heat','u5-d02'),
  ('u5.k2-transfer-modes','u5-d03'),
  ('u5.k3-latent-heat','u5-d04'),
  ('u5.s1-calorimetry-lab','u5-d05'),
  ('u5.k4-kinetic-theory','u5-d06'),
  ('u5.k5-first-law','u5-d07'),
  ('u5.r1-second-law','u5-d08'),
  ('u5.r2-heat-engines','u5-d09'),
  ('u5.r3-atmospheric-entry','u5-d10'),
  ('u5.r4-thermal-damage','u5-d11'),
  ('u5.transfer-task','u5-d12')
)
UPDATE learning_targets t SET lesson_id = l.id::text
FROM map m JOIN lessons l ON l.slug = m.lesson_slug
WHERE t.slug = m.target_slug;

UPDATE learning_targets SET exclude_from_growth = true WHERE slug IN ('u5.transfer-task');

COMMIT;
