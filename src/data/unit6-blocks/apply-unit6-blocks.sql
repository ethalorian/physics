-- Apply Unit 6: Waves, Sound & Light lesson blocks + learning targets (paste into Supabase SQL editor).
-- Generated from /sessions/laughing-zen-feynman/mnt/physics-classroom/src/data/unit6-blocks/*.json
BEGIN;

-- Learning targets
INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.anchor-energy-not-matter', 'I can explain that waves carry energy, not matter, and frame how RADAR measured everything we know about 2026-XJ.', 'reasoning', 'unit-6', 1)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k1-wave-anatomy', 'I can label and compute wave anatomy: frequency, wavelength, amplitude, and period.', 'knowledge', 'unit-6', 2)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k2-wave-equation', 'I can use the wave equation v = fλ to solve for any of the three quantities.', 'knowledge', 'unit-6', 3)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k3-reflection', 'I can apply the law of reflection and describe wave behavior at boundaries.', 'knowledge', 'unit-6', 4)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k4-refraction', 'I can explain refraction as speed change at a boundary and predict which way a wave bends.', 'knowledge', 'unit-6', 5)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k5-diffraction', 'I can describe diffraction around obstacles and how it depends on wavelength vs. opening size.', 'knowledge', 'unit-6', 6)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r1-interference', 'I can predict constructive and destructive interference and explain standing waves.', 'reasoning', 'unit-6', 7)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k6-sound-longitudinal', 'I can describe sound as a longitudinal pressure wave with compressions and rarefactions.', 'knowledge', 'unit-6', 8)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r2-resonance', 'I can reason about the speed of sound in different media and explain resonance and harmonics.', 'reasoning', 'unit-6', 9)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.s1-echo-lab', 'I can measure the speed of sound with an echo timing experiment and report % error.', 'skill', 'unit-6', 10)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r3-doppler', 'I can reason about intensity, decibels, and the Doppler shift of a moving source.', 'reasoning', 'unit-6', 11)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k7-em-spectrum', 'I can place EM bands on the spectrum and use c = fλ for light.', 'knowledge', 'unit-6', 12)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.k8-mirrors', 'I can locate virtual images in plane mirrors using the law of reflection.', 'knowledge', 'unit-6', 13)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r4-lenses', 'I can qualitatively describe how converging and diverging lenses form images.', 'reasoning', 'unit-6', 14)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r5-radar-chain', 'I can walk the full radar measurement chain: pulse timing → distance, Doppler shift → velocity, signal strength → size.', 'reasoning', 'unit-6', 15)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r6-wiens-law', 'I can use Wien''s law to connect meteor color to temperature.', 'reasoning', 'unit-6', 16)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.r7-tsunami', 'I can reason about seismic waves and tsunami formation, shoaling, and damage at distance.', 'reasoning', 'unit-6', 17)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

INSERT INTO learning_targets (id, slug, statement, domain, unit_id, order_index)
VALUES (gen_random_uuid(), 'u6.transfer-task', 'I can apply every Unit 6 tool independently on the transfer task.', 'reasoning', 'unit-6', 18)
ON CONFLICT (slug) DO UPDATE SET statement = EXCLUDED.statement, domain = EXCLUDED.domain, unit_id = EXCLUDED.unit_id, order_index = EXCLUDED.order_index;

-- Lessons
INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 1 — Waves Carry Energy, Not Matter', 'u6-d01', 'Unit 6: Waves, Sound & Light', 1, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe how a wave carries ENERGY and INFORMATION through a medium without carrying matter, and name the unit's three payoff days (Day 15 radar, Day 16 meteor color, Day 17 seismic + tsunami).",
      "targetId": "u6.anchor-energy-not-matter"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "From Units 1–5: 2026-XJ — distance, velocity, mass, impact yield, damage radii. But every NUMBER had to come from a measurement.",
      "connection": "The measurement was RADAR. Radio waves SENT, BOUNCED, RECEIVED — and Doppler-shifted by the moving asteroid. Unit 6 is the framework that makes radar work. Day 15 is the reveal."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "NASA / Planetary Defense Briefing — Update 6",
      "markdown": "For five units, you have been computing things about 2026-XJ. Distance. Velocity. Mass. Trajectory. Impact yield. Damage radii. Every one of those numbers had to come from a measurement.\n\nBut HOW did NASA measure them? You haven't been told. The answer is **RADAR**.\n\nFor decades, NASA's planetary radar network has tracked near-Earth asteroids by sending out radio pulses and timing the return. The **TIME** tells distance. The frequency **SHIFT** tells velocity (Doppler effect). The signal **STRENGTH** tells size. Every number you've used was derived from bounced radio waves.\n\nUnit 6 reveals the measurement chain. By Day 15, you will walk through the FULL chain — radar pulse out, radar echo back, what each piece of the signal tells us about 2026-XJ.\n\nTwo new pieces of data this unit:\n\n**(1)** 2026-XJ has a **70% chance of impacting OCEAN**, not land. Earth is 70% water. If it splashes down instead of landing, the damage mechanism shifts from thermal-pulse-and-shockwave to **TSUNAMI**. Day 17 builds the tsunami physics.\n\n**(2)** Meteor color tells temperature. The atmospheric-entry glow from Day 10 of Unit 5 is yellow-white. Why not red, why not blue? **Wien's law** connects color directly to temperature. Day 16 explains.\n\n*This is fiction. The physics — and the equations — are real.*"
    },
    {
      "id": "b4",
      "type": "prose",
      "markdown": "## What travels — and what doesn't\n\nA **wave** is a disturbance that carries **energy and information** through a medium — *without carrying the medium itself*. The cork on the ocean bobs in place while the wave races past. The air molecules near your ear wiggle back and forth while a friend's voice crosses the room.\n\nTwo basic kinds, by how the medium moves:\n\n- **Transverse** — the medium wiggles **perpendicular** to the wave's travel (rope shaken up-down, light, seismic S-waves).\n- **Longitudinal** — the medium wiggles **parallel** to the wave's travel, as compressions and rarefactions (sound, a push-pulled slinky, seismic P-waves).\n\nThis one idea — *energy travels, matter stays* — is why a radio pulse from Earth can reach 2026-XJ millions of km away, bounce, and come home carrying information. Nothing material makes the trip. The **pattern** does."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "In class today — the slinky demo",
      "markdown": "A slinky stretched along the floor, two students holding the ends. Pulse it side-to-side (transverse), then push-pull it (longitudinal). If you're at home: tie a rope or phone-charger cable to a doorknob and flick it — watch a single point on the rope. Does it travel to the door, or just wiggle in place?"
    },
    {
      "id": "b6",
      "type": "observation",
      "capture": true,
      "patternPrompt": "Demo: a slinky stretched along the floor. Pulse it side-to-side (transverse), then push-pull (longitudinal). Watch CAREFULLY. What TRAVELED down the slinky? What did NOT travel?",
      "interpretPrompt": "What do you WONDER about how a wave could measure an asteroid millions of km away?",
      "frame": "I notice ___. I wonder ___."
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Trace what happens to a single coil during each kind of pulse. Does any coil move all the way across the slinky? What DOES travel from end to end?",
      "prompts": [
        "Two panels: transverse pulse, longitudinal pulse.",
        "Mark ONE coil and show its motion with arrows.",
        "Write what travels end to end (and what doesn't)."
      ]
    },
    {
      "id": "b8",
      "type": "vocab",
      "terms": [
        {
          "term": "Wave",
          "definition": "A disturbance that transfers ENERGY (and information) through a medium without transferring matter. The medium oscillates in place; only the pattern moves. A floating cork bobs up and down as an ocean wave passes — but doesn't move with the wave. Sound makes air molecules wiggle in place; the COMPRESSION pattern travels.",
          "cognate": "Sp. onda · Pt. onda · HC vag"
        },
        {
          "term": "Transverse wave",
          "definition": "The medium oscillates PERPENDICULAR to the direction the wave travels. A rope shaken up and down. Light waves. Seismic S-waves. Picture the wave moving →, but the medium wiggling ↕ — two different directions.",
          "cognate": "Sp. onda transversal · Pt. onda transversal · HC vag transvèsal"
        },
        {
          "term": "Longitudinal wave",
          "definition": "The medium oscillates PARALLEL to the direction the wave travels — compressions and rarefactions. Sound waves in air. A slinky pushed-and-pulled along its length. Seismic P-waves. A wave's TYPE (transverse / longitudinal) is about how the medium moves, NOT about what carries the wave.",
          "cognate": "Sp. onda longitudinal · Pt. onda longitudinal · HC vag longitidinal"
        }
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "misconception",
      "title": "The medium does NOT travel",
      "markdown": "Only the DISTURBANCE travels. A wave can move kilometers; the water molecules barely shift. If you think the water itself crosses the ocean, ask the cork — it just bobs."
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Three payoff days",
      "markdown": "Unit 6 has THREE payoff days. **Day 15: RADAR** — every 2026-XJ number traces to bounced radio waves. **Day 16: METEOR COLOR** — Wien's law connects glow color to temperature. **Day 17: SEISMIC + TSUNAMI** — mechanical waves carry impact damage across the planet."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "MY GUESS — If a wave can transfer energy without transferring matter, how could a signal from Earth ever measure something millions of km away? (Day 15 is the answer.)",
      "frame": "My guess: we could send ___ and learn about the asteroid from ___."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "You wave the end of a rope. A pulse travels down the rope. What's moving through the rope: rope material, energy, or both? Explain in two sentences.",
      "frame": "What moves through the rope is ___. The rope material itself ___."
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.anchor-energy-not-matter"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 2 — Wave Anatomy: f, λ, A, T', 'u6-d02', 'Unit 6: Waves, Sound & Light', 2, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can identify f, λ, A, and T on a wave diagram, give correct units for each, and use f = 1/T to convert between frequency and period.",
      "targetId": "u6.k1-wave-anatomy"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Radar uses radio waves around f ≈ 10⁹ Hz (gigahertz). At c = 3×10⁸ m/s, that's λ ≈ 0.3 m wavelength.",
      "connection": "Today: the vocabulary that lets us describe radar precisely. Day 3: the equation that connects them."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Four numbers describe any wave\n\nTwo are **SPACE** measurements, taken from a snapshot of the wave:\n\n- **Wavelength λ** — distance from one crest to the next. Units: meters.\n- **Amplitude A** — maximum displacement from rest. Units: meters (or Pa for sound pressure).\n\nTwo are **TIME** measurements, taken by watching one point oscillate:\n\n- **Period T** — time for ONE complete cycle. Units: seconds.\n- **Frequency f** — cycles per second. Units: hertz (Hz).\n\nT and f are reciprocals of each other:\n\n**f = 1/T** and **T = 1/f**\n\n| Property | Type | Symbol | Units |\n|---|---|---|---|\n| Wavelength | SPACE | λ | m, mm, nm |\n| Amplitude | SPACE | A | m (Pa for sound) |\n| Period | TIME | T | s |\n| Frequency | TIME | f | Hz |"
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Wavelength (λ)",
          "definition": "Distance from one crest to the next crest (or any equivalent point). A SPACE measurement. Units: m, mm, nm. Visible light ≈ 500 nm. Sound (at 440 Hz, A4) ≈ 0.78 m. Ocean swell ≈ 30 m. Radio FM ≈ 3 m.",
          "cognate": "Sp. longitud de onda · Pt. comprimento de onda · HC longè vag"
        },
        {
          "term": "Amplitude (A)",
          "definition": "Maximum displacement from the rest position. A SPACE measurement. Units: m for transverse, Pa for sound pressure. A loud sound has bigger A than a soft sound at the same pitch. Bright light has bigger A than dim light at the same color.",
          "cognate": "Sp. amplitud · Pt. amplitude · HC anplitid"
        },
        {
          "term": "Period (T)",
          "definition": "Time for ONE complete cycle. A TIME measurement. Units: seconds (s). A 440 Hz tuning fork has T = 1/440 ≈ 0.00227 s. Earth's orbit: T = 1 year.",
          "cognate": "Sp. período · Pt. período · HC peryòd"
        },
        {
          "term": "Frequency (f)",
          "definition": "Number of cycles per second. Units: hertz (Hz). f = 1/T. A 440 Hz tuning fork vibrates 440 times per second. FM radio at 95.7 MHz vibrates 9.57 × 10⁷ times per second.",
          "cognate": "Sp. frecuencia · Pt. frequência · HC fwekans"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Watch out — units and reciprocals",
      "markdown": "λ is in METERS, not seconds — it's a distance. A is the MAX displacement, not crest-to-trough (full peak-to-peak is 2A). T is SECONDS PER CYCLE; f is CYCLES PER SECOND — they are reciprocals, so higher f = MORE cycles per second = shorter T. For sound: higher f = higher pitch."
    },
    {
      "id": "b6",
      "type": "graph",
      "title": "One snapshot of a transverse wave (λ = 4 m, A = 2 m)",
      "xLabel": "position (m)",
      "yLabel": "displacement (m)",
      "series": [
        {
          "label": "y = A·sin(2πx/λ)",
          "points": [
            [
              0,
              0
            ],
            [
              0.5,
              1.41
            ],
            [
              1,
              2
            ],
            [
              1.5,
              1.41
            ],
            [
              2,
              0
            ],
            [
              2.5,
              -1.41
            ],
            [
              3,
              -2
            ],
            [
              3.5,
              -1.41
            ],
            [
              4,
              0
            ],
            [
              4.5,
              1.41
            ],
            [
              5,
              2
            ],
            [
              5.5,
              1.41
            ],
            [
              6,
              0
            ],
            [
              6.5,
              -1.41
            ],
            [
              7,
              -2
            ],
            [
              7.5,
              -1.41
            ],
            [
              8,
              0
            ]
          ]
        }
      ],
      "genPrompt": "Read λ off this snapshot (crest at x = 1 m to crest at x = 5 m) and A (peak height). Which property — T — CANNOT be read from a single snapshot, and why?"
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Label each property — λ, A, T — on the sine wave with arrows. Then identify which label is a SPACE measurement and which is a TIME measurement.",
      "prompts": [
        "Draw one sine wave; arrow λ crest-to-crest and A rest-to-crest.",
        "Note: T can't be shown on a snapshot — it needs a clock.",
        "Tag each label SPACE or TIME."
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "A wave has period T = 0.004 s. What's its frequency?",
      "given": "T = 0.004 s",
      "equation": "f = 1/T",
      "work": "f = 1 / 0.004\nf = 250 Hz",
      "answer": "f = 250 Hz (250 cycles per second)."
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "A tuning fork has f = 440 Hz. What's its period?",
      "given": "f = 440 Hz",
      "equation": "T = 1/f",
      "work": "T = 1 / 440\nT ≈ 0.00227 s\nT ≈ 2.27 ms",
      "answer": "T ≈ 2.27 milliseconds."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "A radar transmitter operates at f = 2.4 GHz = 2.4 × 10⁹ Hz. What's its period (in seconds and nanoseconds)?",
      "givenHint": "f = 2.4 × 10⁹ Hz. 1 ns = 10⁻⁹ s.",
      "equationHint": "T = 1/f — then convert seconds to nanoseconds.",
      "equationIds": [
        "period"
      ]
    },
    {
      "id": "b11",
      "type": "callout",
      "variant": "note",
      "title": "Thousands of cycles per pulse",
      "markdown": "ONE 2.4 GHz radio pulse takes about 0.42 nanoseconds per cycle. In a 1 μs pulse, that's 2400 cycles. Day 15 will show why pulses contain THOUSANDS of cycles — for precise distance + Doppler measurement."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A wave has f = 250 Hz. What's its period? Show one line of work. Then complete the frame.",
      "frame": "f tells us ___ per second. T tells us seconds per ___. They are reciprocals, so high f means ___ T."
    },
    {
      "id": "rd-ch25-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **25.1–25.3** (pendulums and the period, wave anatomy: crests, troughs, amplitude, wavelength, frequency, and how waves carry energy — not matter). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch25-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 25,
      "title": "Vibrations and Waves — read & practice",
      "sectionIds": [
        "25.1",
        "25.2",
        "25.3"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k1-wave-anatomy"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 3 — The Wave Equation: v = fλ', 'u6-d03', 'Unit 6: Waves, Sound & Light', 3, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply v = fλ to compute any one of v, f, or λ given the other two, and explain WHY a wave changing media keeps the same f but changes λ.",
      "targetId": "u6.k2-wave-equation"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Radar pulses travel at v = c = 3×10⁸ m/s. The round-trip time tells distance.",
      "connection": "Today's equation IS the radar equation in disguise. Once you trust v = fλ for everyday waves, you trust d = c·Δt/2 for radar."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## One equation for every wave\n\n**v = f · λ**\n\nWhy it has to be true: in one period T, a wave moves forward exactly one wavelength λ. Speed = distance / time = λ/T — and since f = 1/T, that's **v = fλ**. Same equation for water, sound, light, radio.\n\nThe division of labor:\n\n- **v is set by the MEDIUM** (343 m/s for sound in air, 1480 m/s in water, 3×10⁸ m/s for radio in vacuum).\n- **f is set by the SOURCE** (the tuning fork vibrates at 440 Hz no matter what it's in).\n- **λ adjusts** to satisfy the equation: λ = v/f.\n\nSame source, different medium → same f, different λ. Hold that thought — it's exactly why refraction (Day 5) happens at a boundary."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "v = f · λ (the wave equation)",
          "definition": "Speed of a wave equals frequency times wavelength. Same equation for water, sound, light, radio. Sound at 440 Hz with λ = 0.78 m: v = 440 · 0.78 ≈ 343 m/s (sound in air).",
          "cognate": "Sp. v = f · λ · Pt. v = f · λ (universal symbols)"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Who sets what",
      "markdown": "v depends on the MEDIUM. f is set by the SOURCE. λ adjusts: λ = v/f. Same source, different medium → different λ. Don't let the equation fool you into thinking cranking up f makes the wave travel faster — it just shortens λ."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Two snapshots of the same wave, one period apart. Mark a single crest in both. How far did it travel? Write the relationship: speed = distance / time.",
      "prompts": [
        "Top: snapshot at t = 0. Bottom: snapshot at t = T.",
        "Arrow the SAME crest in both — it moved exactly one λ.",
        "Write v = λ/T = fλ underneath."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "An A4 tuning fork at 440 Hz makes sound that travels at v = 343 m/s in air. What's the wavelength?",
      "given": "f = 440 Hz · v = 343 m/s",
      "equation": "v = f·λ → λ = v/f",
      "work": "λ = 343 / 440\nλ ≈ 0.78 m",
      "answer": "λ ≈ 0.78 m ≈ 78 cm."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "An FM radio station broadcasts at f = 100 MHz = 10⁸ Hz. Radio waves travel at c = 3 × 10⁸ m/s. What's the wavelength?",
      "given": "f = 10⁸ Hz · c = 3 × 10⁸ m/s",
      "equation": "λ = c/f",
      "work": "λ = (3 × 10⁸) / 10⁸\nλ = 3 m",
      "answer": "λ = 3 m. An FM antenna sized at λ/4 ≈ 75 cm captures these waves efficiently."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "A4 IN WATER — The same A4 tuning fork (f = 440 Hz) sounds underwater. Sound in water moves at v ≈ 1480 m/s. What's the new wavelength?",
      "givenHint": "f = 440 Hz (set by the source — unchanged) · v = 1480 m/s in water.",
      "equationHint": "λ = v/f — bigger v, same f → bigger λ.",
      "equationIds": [
        "wave-speed"
      ]
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "RADAR WAVELENGTH — NASA's planetary radar transmits at f = 2.4 GHz = 2.4 × 10⁹ Hz. Radio in vacuum travels at c = 3 × 10⁸ m/s. What's λ?",
      "givenHint": "f = 2.4 × 10⁹ Hz · c = 3 × 10⁸ m/s.",
      "equationHint": "λ = c/f — watch the powers of 10.",
      "equationIds": [
        "wave-speed"
      ]
    },
    {
      "id": "b11",
      "type": "callout",
      "variant": "note",
      "title": "Same source, two media",
      "markdown": "Same FREQUENCY (set by the source). But because v differs in each medium, the WAVELENGTH adjusts to fit. This is exactly why refraction (Day 5) happens at a boundary."
    },
    {
      "id": "b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "An FM radio wave has f = 95 MHz. What's its wavelength? (Use c = 3 × 10⁸ m/s.) Then complete the frame.",
      "frame": "When a wave enters a new medium, the SOURCE doesn't change. So f stays the ___. But v changes, so by v = fλ, the ___ must change. If v decreases, λ ___."
    },
    {
      "id": "rd-ch25-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **25.4–25.6** (wave speed v = λf, transverse waves, and longitudinal waves). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch25-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 25,
      "title": "Vibrations and Waves — read & practice",
      "sectionIds": [
        "25.4",
        "25.5",
        "25.6"
      ]
    },
    {
      "id": "b13",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k2-wave-equation"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 4 — Reflection at Boundaries', 'u6-d04', 'Unit 6: Waves, Sound & Light', 4, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply the law of reflection to predict the reflected angle, measuring angles from the NORMAL — not from the surface — and explain why the law holds for sound, light, and radar.",
      "targetId": "u6.k3-reflection"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Radar works because radio waves REFLECT off the asteroid. Without reflection, no echo, no distance, no Doppler.",
      "connection": "Today: the law that says EVERY wave reflects with equal angles. Day 15 applies this to the radar echo from 2026-XJ."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Equal angles — from the normal\n\nWhen a wave hits a flat surface, it bounces off obeying one rule:\n\n**θᵢ = θᵣ** — angle of incidence equals angle of reflection.\n\nBoth angles are measured from the **NORMAL**: the imaginary line perpendicular to the surface at the point of impact. Not from the surface. From the normal. Every reflection problem starts by drawing that line.\n\nThe law is the same for light off a mirror, sound off a wall, and radar off an asteroid — because reflection is geometry, not chemistry.\n\nOne more thing happens at every boundary: **some of the wave reflects, some transmits** into the new medium. A brick wall reflects almost all the sound; a curtain lets most of it through. Radar engineers live on this split — the echo we detect is the reflected fraction."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Law of reflection",
          "definition": "The angle of incidence equals the angle of reflection. Both angles are measured from the NORMAL (perpendicular to the surface). Light at 35° from normal reflects at 35° from normal — on the OTHER side of the normal. Same for radar off an asteroid.",
          "cognate": "Sp. ley de reflexión · Pt. lei da reflexão · HC lwa refleksyon"
        },
        {
          "term": "Normal",
          "definition": "A line perpendicular to the surface at the point where the wave hits. On a flat tabletop, the normal points straight up. On a curved mirror, the normal is perpendicular to the tangent at that point. 'Normal' in physics means perpendicular — not 'usual'.",
          "cognate": "Sp. normal · Pt. normal · HC nòmal"
        },
        {
          "term": "Transmission (vs. reflection)",
          "definition": "When a wave hits a boundary, SOME reflects and SOME transmits into the new medium. The fraction depends on the impedance contrast between the two media. A wave hits a brick wall → almost all reflects. Hits a curtain → much passes through. Light through window → most transmits. Reflection + transmission together conserve the wave's energy (minus any absorbed).",
          "cognate": "Sp. transmisión · Pt. transmissão · HC transmisyon"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Measure from the NORMAL, not the surface",
      "markdown": "A common mistake: \"35° from the mirror\" — that's actually 55° from the normal. Always convert to angle-from-normal FIRST, apply θᵣ = θᵢ, then convert back if the question asks in surface terms."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Mark angle of incidence (θᵢ) and angle of reflection (θᵣ) — both from the NORMAL, not from the mirror surface. Verify the angles are equal.",
      "prompts": [
        "Draw the surface, then the dashed NORMAL perpendicular to it.",
        "Incoming ray on one side of the normal, outgoing on the other.",
        "Label θᵢ = θᵣ at the normal."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "You shine a laser at a mirror so the beam makes a 35° angle with the NORMAL. At what angle does it reflect?",
      "given": "θᵢ = 35° (from normal)",
      "equation": "θᵣ = θᵢ",
      "work": "θᵣ = 35°",
      "answer": "The beam reflects at 35° from the normal, on the OTHER side of the normal."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "A radar beam strikes a flat asteroid surface at 20° from the SURFACE (i.e., a glancing hit). At what angle from the surface does it reflect?",
      "given": "20° from surface → 70° from normal",
      "equation": "θᵣ (from normal) = θᵢ (from normal) = 70°",
      "work": "θᵣ (from surface) = 90° − 70° = 20°",
      "answer": "20° from the surface — same as it came in. (Always convert to angle-from-normal first.)"
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "SOUND OFF A WALL — A sound wave hits a wall at 50° from the normal. At what angle does the echo return? What if measured from the wall surface?",
      "givenHint": "θᵢ = 50° from the normal. From the surface that's 90° − 50° = 40°.",
      "equationHint": "θᵣ = θᵢ (both from the normal); angle-from-surface = 90° − angle-from-normal.",
      "equationOptions": [
        "θᵣ = θᵢ (both measured from the normal)",
        "θᵣ = 90° − θᵢ",
        "θᵣ = 2·θᵢ",
        "v = f·λ"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Real asteroids are rough",
      "markdown": "A perfectly mirrored asteroid would reflect the radar straight back if hit head-on. Real asteroids have ROUGH surfaces — radar scatters in many directions. The echo we detect is whatever reflects toward Earth. Signal strength × distance² ≈ size estimate (Day 15)."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "You shine a laser at a mirror at 35° from the normal. At what angle does it reflect? If you accidentally measured 35° from the mirror surface, what would the reflected angle be in that frame?",
      "frame": "When a wave hits a flat surface, the angle measured from the ___ on the way IN equals the angle on the way OUT. We never measure from the ___ itself."
    },
    {
      "id": "rd-ch29-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **29.1–29.5** (reflection at boundaries, the law of reflection, plane and curved mirrors, diffuse reflection, and echoes). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch29-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 29,
      "title": "Reflection and Refraction — read & practice",
      "sectionIds": [
        "29.1",
        "29.2",
        "29.3",
        "29.4",
        "29.5"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k3-reflection"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 5 — Refraction: Bending at a Boundary', 'u6-d05', 'Unit 6: Waves, Sound & Light', 5, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can predict whether a wave bends TOWARD or AWAY from the normal as it enters a new medium, given which medium is faster.",
      "targetId": "u6.k4-refraction"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Radio waves don't refract much in vacuum, but they DO refract in Earth's atmosphere. Sound from a distant impact refracts in air (sound bends toward cooler air).",
      "connection": "The pencil-in-water effect IS refraction. Same rule explains why distant thunder can be heard around hills."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Speed change → direction change\n\n**Refraction** is the bending of a wave at a boundary, caused by a change in wave SPEED. The rule fits in two lines:\n\n- Entering a **SLOWER** medium → bends **TOWARD** the normal.\n- Entering a **FASTER** medium → bends **AWAY** from the normal.\n\nWhy? The marching-band picture: a row of marchers crosses from pavement into mud at an angle. The side that hits the mud first **slows first**, the row pivots, and the whole line swings toward the normal. Waves do exactly this — the wavefront twists because one edge slows before the other.\n\nRemember from Day 3: crossing a boundary, **f stays the same** (set by the source) while **v and λ change** together. The speed change is the whole engine of refraction — same speed on both sides, no bend at all."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Refraction",
          "definition": "The BENDING of a wave at a boundary, caused by a change in wave SPEED. Slower medium → bends TOWARD normal. Faster medium → bends AWAY. Light going from air (faster) into water (slower) bends TOWARD the normal — that's why a pencil in a glass of water looks broken at the surface.",
          "cognate": "Sp. refracción · Pt. refração · HC refraksyon"
        },
        {
          "term": "Index of refraction (n) — advanced",
          "definition": "A ratio: n = c / v_in_medium. Higher n = slower wave. Air ≈ 1.00, water ≈ 1.33, glass ≈ 1.50. In glass (n = 1.5), light travels at 2 × 10⁸ m/s — two-thirds of c. Big n = SLOWER medium: the bigger the n, the more the wave slows and the more it bends toward normal.",
          "cognate": "Sp. índice de refracción · Pt. índice de refração"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Refraction needs a SPEED CHANGE, not just a boundary",
      "markdown": "If two media have the same wave speed, no refraction occurs — the wave crosses the boundary in a straight line. The bend is caused by the speed mismatch, not by the surface itself."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "warning",
      "title": "The marching-band analogy",
      "markdown": "A row of soldiers marching at angle into mud. The side hitting mud first slows; the row twists. Same with waves entering the slower medium. The geometry follows."
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "The pencil enters water at an angle. Draw the normal at the air-water boundary. Which way does the wave bend? Mark θ₁ (above) and θ₂ (below).",
      "prompts": [
        "Dashed normal perpendicular to the water surface.",
        "Ray in air at θ₁; ray in water bent TOWARD the normal at θ₂ < θ₁.",
        "Label which medium is faster."
      ]
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "Light enters water from air. Does it bend TOWARD or AWAY from the normal? Why?",
      "given": "Light in air: v ≈ c (faster) · Light in water: v ≈ 0.75c (slower)",
      "equation": "Slower medium → bends TOWARD normal",
      "work": "Water is the slower medium.\nTherefore the light bends TOWARD the normal in water.\nθ₂ (in water) < θ₁ (in air).",
      "answer": "Bends TOWARD normal. The refracted ray is closer to vertical than the incident ray."
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "A swimmer underwater shines a flashlight UP through the water surface into the air. Does the beam bend toward or away from the normal as it exits water into air?",
      "given": "Light leaves water (slow) and enters air (fast).",
      "equation": "Faster medium → bends AWAY from normal",
      "work": "Air is the faster medium.\nTherefore the light bends AWAY from the normal as it leaves water.",
      "answer": "AWAY from the normal. The beam tilts further from vertical as it exits."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "RADIO IN ATMOSPHERE — Radio waves enter Earth's atmosphere from space. The ionosphere slows them slightly compared to vacuum. Which way would the waves bend?",
      "givenHint": "Vacuum: faster. Ionosphere: slightly slower. The wave is entering the SLOWER medium.",
      "equationHint": "Slower medium → bends TOWARD the normal (qualitative — no numbers needed).",
      "equationOptions": [
        "Slower medium → bends TOWARD the normal",
        "Slower medium → bends AWAY from the normal",
        "θᵣ = θᵢ (reflection rule)",
        "No bend — boundaries alone don't matter"
      ]
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Light enters glass (n = 1.5) from air (n = 1.0). Does it bend toward or away from the normal? In one sentence, explain why.",
      "frame": "When a wave enters a SLOWER medium, the side that hits the boundary first ___ first. That makes the wavefront ___, bending it ___ the normal."
    },
    {
      "id": "rd-ch29-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **29.6–29.12** (refraction of sound and light, mirages, dispersion in a prism, rainbows, and total internal reflection). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch29-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 29,
      "title": "Reflection and Refraction — read & practice",
      "sectionIds": [
        "29.6",
        "29.7",
        "29.8",
        "29.9",
        "29.10",
        "29.11",
        "29.12"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k4-refraction"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 6 — Diffraction: Bending Around Obstacles', 'u6-d06', 'Unit 6: Waves, Sound & Light', 6, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can predict how much diffraction occurs given the ratio of wavelength to obstacle size, and explain why we can HEAR around a corner but not SEE around one.",
      "targetId": "u6.k5-diffraction"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Long-wavelength radar diffracts around mountains (over-the-horizon radar). Short-wavelength radar doesn't diffract around small objects — better RESOLUTION for asteroid imaging.",
      "connection": "Engineers CHOOSE the radar wavelength based on what they want to detect. Diffraction sets the trade-off."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Waves bend around things — sometimes\n\n**Diffraction** is the spreading of a wave as it passes an obstacle or squeezes through an opening. The amount of spreading is governed by ONE ratio:\n\n**λ / (size of opening or obstacle)**\n\n- Ratio near 1 (or bigger) → **strong** diffraction. The wave fans out and fills the space behind the obstacle.\n- Ratio tiny → almost **no** diffraction. The wave goes straight, leaving sharp shadows.\n\nSound through a doorway: λ ≈ 1 m, doorway ≈ 1 m → ratio ≈ 1 → sound floods around the corner. Light through the same doorway: λ ≈ 5×10⁻⁷ m → ratio ≈ 10⁻⁷ → light travels in straight lines and you can't see the speaker.\n\nThe same ratio limits **resolution**: a wave can't resolve features much smaller than its own λ. That's the radar designer's trade-off — long λ bends around obstacles but sees only big features; short λ gives crisp detail but is blocked by terrain."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Diffraction",
          "definition": "The spreading of a wave as it passes by an obstacle or through an opening. More diffraction when the opening is comparable to or smaller than the wavelength. Sound (λ ≈ 1 m) diffracts easily around doorways. Visible light (λ ≈ 500 nm) barely diffracts around everyday objects — that's why we get sharp shadows.",
          "cognate": "Sp. difracción · Pt. difração · HC difraksyon"
        },
        {
          "term": "Resolution (in radar / imaging) — preview",
          "definition": "The minimum size of detail you can distinguish. Limited by diffraction — you can't resolve features smaller than ~λ. Radar at λ ≈ 0.1 m can resolve asteroid features down to ~0.1 m. Shorter wavelength = better resolution — that's why X-ray crystallography (λ ≈ 0.1 nm) can image molecules.",
          "cognate": "Sp. resolución · Pt. resolução · HC rezolisyon"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Diffraction depends on the RATIO, not the wave alone",
      "markdown": "More diffraction when λ ≈ obstacle size. If the obstacle is much BIGGER than λ, the wave just passes straight (light through a window) or stops (light by a wall). The same wave can diffract strongly around one obstacle and not at all around another."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Compare the wide slit vs. narrow slit. Which produces a wave-fan? Why? What sets the amount of fanning — the slit size, the wavelength, or BOTH?",
      "prompts": [
        "Two panels: plane waves hitting a WIDE slit, then a NARROW slit.",
        "Show the fan (curved wavefronts) behind the narrow slit.",
        "Write the ratio that controls it: λ / opening."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "Sound has λ ≈ 1 m. Visible light has λ ≈ 500 nm = 5 × 10⁻⁷ m. A doorway is 1 m wide. Compare each wave's λ-to-opening ratio. Which diffracts strongly through the doorway?",
      "given": "λ_sound = 1 m · λ_light = 5 × 10⁻⁷ m · opening width = 1 m",
      "equation": "ratio = λ / opening → compare",
      "work": "λ_sound / 1 m = 1          (comparable)\nλ_light / 1 m = 5 × 10⁻⁷ (tiny)\nSound: ratio ≈ 1, strong diffraction.\nLight: ratio ≈ 10⁻⁷, essentially no diffraction.",
      "answer": "Sound diffracts → you HEAR around the doorway. Light doesn't diffract → you can't SEE around the doorway."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "PICK A RADAR WAVELENGTH — You want to image an asteroid the size of a city block (~100 m across) but resolve features ~1 m in size. Should you use long-wavelength radio (~10 m) or short-wavelength radar (~0.1 m)? Explain.",
      "givenHint": "Target features ≈ 1 m. Option A: λ ≈ 10 m. Option B: λ ≈ 0.1 m. You can't resolve features smaller than ~λ.",
      "equationHint": "Compare λ to the feature size — resolution requires λ ≲ feature size.",
      "equationOptions": [
        "resolution limit ≈ λ (can't resolve features smaller than ~λ)",
        "resolution limit ≈ 1/λ",
        "ratio = λ / opening → compare",
        "v = f·λ"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "Different wavelengths, different views",
      "markdown": "Radio telescopes can see HUGE features in galaxies that optical telescopes can't — long wavelengths diffract around the dust clouds blocking visible light. Different wavelengths = different VIEWS of the universe."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why can you hear a conversation around a corner but not see the speaker? Answer with wavelengths.",
      "frame": "Diffraction happens when a wave passes through an opening or around an obstacle whose size is comparable to its ___. The bigger the ratio of λ to obstacle size, the MORE the wave ___."
    },
    {
      "id": "rd-ch31-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **31.1–31.2 and 31.6–31.7** (Huygens' principle, diffraction around obstacles and through openings, laser light, and holograms). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch31-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 31,
      "title": "Diffraction and Interference — read & practice",
      "sectionIds": [
        "31.1",
        "31.2",
        "31.6",
        "31.7"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k5-diffraction"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 7 — Interference + Standing Waves', 'u6-d07', 'Unit 6: Waves, Sound & Light', 7, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can predict constructive vs. destructive interference based on whether two waves are in phase, and identify a standing wave as the interference of a wave with its reflection.",
      "targetId": "u6.r1-interference"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Modern radar uses INTERFEROMETRY — combining signals from multiple receivers to resolve fine asteroid details much smaller than a single antenna could see.",
      "connection": "Day 9 builds on standing waves to explain how guitar strings + organ pipes (and Earth's seismic resonances on Day 17) work."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## When two waves meet, they ADD\n\nAt every point, the displacements of overlapping waves simply **add**:\n\n- **IN PHASE** (crest meets crest) → **CONSTRUCTIVE** interference. Net amplitude doubles.\n- **OUT OF PHASE by λ/2** (crest meets trough) → **DESTRUCTIVE** interference. Net amplitude = 0.\n\nNo energy is destroyed in the quiet spots — it's redistributed to the loud spots.\n\n**Standing waves** are the star application: a wave interferes with **its own reflection** off a fixed end. The result looks frozen in place — fixed **NODES** (no motion) and **ANTINODES** (max motion). A guitar string fixed at both ends can only host standing waves that FIT: nodes at both ends. The longest one that fits (one antinode in the middle) is the **fundamental**, with frequency\n\n**f₁ = v / (2L)** — and harmonics at f_n = n·v/(2L)."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Interference",
          "definition": "When two waves meet, their displacements ADD at each point. Same-direction crests → bigger crest (CONSTRUCTIVE). Opposite displacements → cancellation (DESTRUCTIVE). Two stones dropped in a pond — ripples meet and create bright + dark patterns. Noise-canceling headphones produce a sound exactly opposite to incoming noise — they CANCEL.",
          "cognate": "Sp. interferencia · Pt. interferência · HC entèfewans"
        },
        {
          "term": "Constructive interference",
          "definition": "Two waves IN PHASE: crests align with crests, troughs with troughs. Net displacement = sum (bigger). Two speakers playing the same tone reinforce each other at certain spots = LOUD. In phase doesn't mean identical — it means crests align in TIME and SPACE.",
          "cognate": "Sp. interferencia constructiva · Pt. interferência construtiva"
        },
        {
          "term": "Destructive interference",
          "definition": "Two waves OUT OF PHASE by half a wavelength: crests align with troughs. Net displacement = 0 (cancellation). Noise-canceling headphones detect incoming noise and play the EXACT OPPOSITE — they cancel at your eardrum.",
          "cognate": "Sp. interferencia destructiva · Pt. interferência destrutiva"
        },
        {
          "term": "Standing wave",
          "definition": "A wave interfering with its own reflection. Produces fixed NODES (no motion) and ANTINODES (max motion). The wave LOOKS stationary. A guitar string fixed at both ends: pluck it and a standing wave forms — the fundamental has nodes at the ends and one antinode in the middle.",
          "cognate": "Sp. onda estacionaria · Pt. onda estacionária · HC vag estasyonè"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Interference doesn't destroy energy",
      "markdown": "In destructive zones, the energy is just shifted to constructive zones elsewhere. At dark fringes the energy is zero; at bright fringes it's doubled. And a standing wave is REAL motion of the medium — it just doesn't TRANSLATE left-right; it oscillates up-down at fixed locations."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "TOP: two waves IN PHASE — sum. BOTTOM: two waves OUT OF PHASE — sum. Mark the amplitudes (in phase = double, out of phase = zero).",
      "prompts": [
        "Top panel: two identical sines aligned, then their sum (2A).",
        "Bottom panel: same sines shifted by λ/2, then their sum (flat zero).",
        "Label CONSTRUCTIVE and DESTRUCTIVE."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "Incoming engine noise enters as a 200 Hz wave with amplitude A = 1 (relative units). The headphones detect it and produce a 200 Hz wave with amplitude A = 1, but SHIFTED by half a wavelength. What's the net amplitude at your eardrum?",
      "given": "Both waves: 200 Hz, A = 1. Headphone wave shifted by λ/2 (opposite phase).",
      "equation": "A_net = A₁ + A₂ (where A₂ is OPPOSITE-signed)",
      "work": "At every instant: A_net = (+1) + (−1) = 0\nContinuously for both waves → silence at the eardrum.",
      "answer": "A_net = 0 → silence. (Headphones never PERFECTLY cancel — but ~30 dB attenuation is real.)"
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "A guitar string is 0.65 m long. The wave speed along the string is 80 m/s. What's the fundamental (lowest) standing-wave frequency?",
      "given": "L = 0.65 m · v = 80 m/s · n = 1 (fundamental)",
      "equation": "f₁ = v / (2L)",
      "work": "f₁ = 80 / (2 · 0.65)\nf₁ = 80 / 1.30\nf₁ ≈ 61.5 Hz",
      "answer": "f₁ ≈ 61.5 Hz. The second harmonic (n = 2) would be 123 Hz, third 184.5, etc."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "PIPE ORGAN — A 1.0-m-long pipe organ tube, open at both ends, supports standing waves. Sound in air is 343 m/s. What's the fundamental frequency? (Use f₁ = v/(2L).)",
      "givenHint": "L = 1.0 m · v = 343 m/s.",
      "equationHint": "f₁ = v/(2L) — divide the speed by twice the length.",
      "equationOptions": [
        "f₁ = v / (2L)",
        "f₁ = 2L / v",
        "f₁ = v · 2L",
        "v = f·λ"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Geometry sets the song",
      "markdown": "The frequencies a guitar string + pipe organ + bell + Earth's crust + even an asteroid PRODUCE are set by their geometry — which standing waves fit. That's why a long string has a low fundamental and a short string a high one."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Noise-canceling headphones produce a sound wave OPPOSITE to incoming noise. Why does this cancel? Where does the noise energy go? Answer in two sentences.",
      "frame": "Two waves in phase produce ___ interference. Two waves out of phase by λ/2 produce ___ interference. A standing wave is what happens when a wave interferes with its own ___."
    },
    {
      "id": "rd-ch25-c",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **25.7–25.8** (interference patterns and standing waves: nodes and antinodes). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch25-c",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 25,
      "title": "Vibrations and Waves — read & practice",
      "sectionIds": [
        "25.7",
        "25.8"
      ]
    },
    {
      "id": "rd-ch31-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **31.3–31.5** (interference of light: Young's double-slit experiment, diffraction gratings, and thin-film colors). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch31-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 31,
      "title": "Diffraction and Interference — read & practice",
      "sectionIds": [
        "31.3",
        "31.4",
        "31.5"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r1-interference"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 8 — Sound as a Longitudinal Wave', 'u6-d08', 'Unit 6: Waves, Sound & Light', 8, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can describe sound as a longitudinal mechanical wave, identify pitch with frequency and loudness with amplitude, and explain why sound needs a MEDIUM (no sound in space).",
      "targetId": "u6.k6-sound-longitudinal"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "An asteroid impact generates HUGE atmospheric shockwaves and INFRASOUND (< 20 Hz). The infrasound from the 2013 Chelyabinsk impact traveled around the entire planet — twice.",
      "connection": "Today: the foundation. Day 17 applies sound + seismic-wave physics to predict the damage and detection range from an asteroid strike."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Sound, dissected\n\nSound is a **longitudinal mechanical wave**: a traveling pattern of **compressions** (molecules squeezed together) and **rarefactions** (molecules spread apart). A tuning fork pushes the air forward, pulls it back, and the pattern races outward at about 343 m/s — while each air molecule just wiggles in place.\n\nThe perception dictionary:\n\n- **Pitch** ↔ frequency f. Higher f = higher pitch. Middle C ≈ 262 Hz; A4 = 440 Hz.\n- **Loudness** ↔ amplitude A (intensity). Bigger A = louder, measured logarithmically in decibels.\n\nAnd the boundary cases of human hearing: **infrasound** below 20 Hz, **ultrasound** above 20 kHz. Both are real sound waves — just outside our ears' range.\n\nBecause sound is mechanical, it needs molecules to compress. **No medium → no sound.** Space explosions are silent, no matter what the movies say."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Sound (as a wave)",
          "definition": "A longitudinal mechanical wave — compressions and rarefactions in a medium (air, water, solid). Cannot travel through vacuum. A tuning fork pushes air molecules forward (compression), then pulls them back (rarefaction); the pattern travels outward at v ≈ 343 m/s in air.",
          "cognate": "Sp. sonido · Pt. som · HC son"
        },
        {
          "term": "Pitch",
          "definition": "Our perception of a sound's frequency. Higher f = higher pitch. Units: Hz. Middle C ≈ 262 Hz. A4 = 440 Hz. Soprano high note ≈ 1500 Hz. Bass drum ≈ 50 Hz. Pitch is the PERCEPTUAL name; frequency is the physical quantity.",
          "cognate": "Sp. tono · Pt. altura · HC ton"
        },
        {
          "term": "Loudness",
          "definition": "Our perception of a sound's amplitude (or intensity). Bigger A = louder. Often measured in decibels on a logarithmic scale. A whisper has small A; a rock concert has large A. Loudness is logarithmic in our ears: +10 dB feels about twice as loud, even though it's ×10 intensity.",
          "cognate": "Sp. intensidad · Pt. intensidade · HC fòs"
        },
        {
          "term": "Infrasound + ultrasound",
          "definition": "INFRASOUND is sound below 20 Hz (we can't hear it). ULTRASOUND is above 20 kHz (we can't hear it). Both are real sound waves; just outside our range. Asteroid impacts produce powerful infrasound. Bats use ultrasound for echolocation. Medical ultrasound imaging operates near 1 MHz. Infra = below; ultra = above.",
          "cognate": "Sp. infrasonido / ultrasonido · Pt. infrassom / ultrassom"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Sound is NOT made of moving air",
      "markdown": "Air molecules wiggle in place; only the COMPRESSION pattern moves. Your friend's voice doesn't blow air across the room at 343 m/s — that would be a hurricane. No medium = no sound."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Pattern shows alternating dense + sparse vertical lines. Label one COMPRESSION and one RAREFACTION. Mark the direction the SOUND travels — is it the same as the molecule motion, or perpendicular?",
      "prompts": [
        "Draw bands of close-together lines (compression) and spread-out lines (rarefaction).",
        "Arrow the wave's travel direction.",
        "Arrow the molecule wiggle — PARALLEL to travel (longitudinal)."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "In a sci-fi movie, an explosion in space is shown with a loud BOOM. From a physics perspective, what's wrong?",
      "given": "Sound = compression wave needing a medium",
      "equation": "(qualitative — no equation needed)",
      "work": "Space between objects is nearly vacuum.\nSound needs molecules to compress + rarefy.\nNo molecules → no compressions → no sound wave.",
      "answer": "The boom can't propagate. Realistic space explosions are SILENT."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "A 1000 Hz tuning fork is held just above the surface of a lake. What are the WAVELENGTHS of the sound (a) in air (v = 343 m/s) and (b) in water (v = 1480 m/s)?",
      "given": "f = 1000 Hz · v_air = 343 · v_water = 1480",
      "equation": "λ = v/f",
      "work": "(a) λ_air = 343 / 1000 = 0.343 m\n(b) λ_water = 1480 / 1000 = 1.48 m\nSame f, but λ in water is 4.3× larger.",
      "answer": "Air: 0.343 m. Water: 1.48 m. Same f, faster medium → longer λ."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "PERIOD OF A TUNING FORK — A 512 Hz tuning fork is struck. What's the period of one cycle? (Use T = 1/f.)",
      "givenHint": "f = 512 Hz.",
      "equationHint": "T = 1/f — expect a few milliseconds.",
      "equationIds": [
        "period"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Infrasound — the impact's long-distance signature",
      "markdown": "Below 20 Hz, sound waves travel thousands of km with little attenuation. NOAA's infrasound monitoring network has detected every major asteroid airburst since 2000."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why is there no sound in outer space, even from a violent event? Answer in two sentences using the word 'medium'.",
      "frame": "Sound is a ___ wave (compressions + rarefactions). Pitch is the perception of ___. Loudness is the perception of ___. Without a medium, sound cannot ___."
    },
    {
      "id": "rd-ch26-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **26.1–26.5** (where sound originates, compressions and rarefactions, media that transmit sound, the speed of sound, and loudness in decibels). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch26-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 26,
      "title": "Sound — read & practice",
      "sectionIds": [
        "26.1",
        "26.2",
        "26.3",
        "26.4",
        "26.5"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k6-sound-longitudinal"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 9 — Speed of Sound + Resonance', 'u6-d09', 'Unit 6: Waves, Sound & Light', 9, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can predict the speed of sound in different media (air, water, solid) and apply f_n = nv/(2L) to find the fundamental + harmonics of a standing wave instrument.",
      "targetId": "u6.r2-resonance"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Earth has natural resonant frequencies — when a major impact (or earthquake) happens, the planet 'rings' at characteristic frequencies.",
      "connection": "Day 17's seismic waves are launched at these resonances. A 2026-XJ impact would excite them measurably from the other side of the planet."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## How fast — and why instruments sing\n\n**Speed of sound depends on the medium.** Stiff media snap back fast, so compressions travel fast:\n\n| Medium | v_sound |\n|---|---|\n| Air (20 °C) | ≈ 343 m/s |\n| Water | ≈ 1480 m/s |\n| Steel | ≈ 5960 m/s |\n\nIn gases, v rises with temperature — about +0.6 m/s per °C in air.\n\n**Resonance:** every object has natural standing-wave frequencies set by its geometry. Drive it AT one of those frequencies and energy builds up — the swing goes higher, the wine glass shatters, the string sings. Drive it at the wrong frequency and nothing accumulates.\n\nFor a string (or open pipe) of length L with wave speed v:\n\n**f_n = n·v / (2L)** — fundamental at n = 1, harmonics at n = 2, 3, …\n\nBonus tool from yesterday's reflection ideas: an **echo** is sound reflecting back to you, and the round-trip time gives distance: **d = v·Δt / 2**. (Sound today; radar on Day 15 — same equation, different wave.)"
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Speed of sound (v_sound)",
          "definition": "The speed at which compression waves travel through a medium. Faster in stiff media, slower in compressible ones. Increases with temperature in gases. Air at 20 °C: ≈ 343 m/s. Water: ≈ 1480 m/s. Steel: ≈ 5960 m/s. Adding 1 °C to air adds about 0.6 m/s.",
          "cognate": "Sp. velocidad del sonido · Pt. velocidade do som · HC vitès son"
        },
        {
          "term": "Resonance",
          "definition": "When you drive a system at one of its natural standing-wave frequencies, energy builds up. The system 'sings' loudly at that frequency. Push a kid on a swing at exactly the swing's natural period → they go very high. Hit the right note near a wine glass → it shatters. Earth rings at low-Hz frequencies after large earthquakes.",
          "cognate": "Sp. resonancia · Pt. ressonância · HC rezonans"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Stiff means FASTER, not slower",
      "markdown": "A stiff medium (steel) transmits sound FASTER, not slower. Stiff = fast restoring force = fast wave. And resonance requires MATCHING the natural frequency — wrong frequency → energy doesn't build up."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Three rows show n = 1, 2, 3 standing waves on a fixed-end string. For n = 1, λ = ____. Compute f₁ using v = 80 m/s, L = 0.65 m.",
      "prompts": [
        "Row n = 1: nodes at ends, one antinode (λ = 2L).",
        "Rows n = 2 and n = 3: add a node each time.",
        "Compute f₁ = v/(2L) below your sketch."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "A guitar string is 0.65 m long. Wave speed on the string is 80 m/s. What's the fundamental frequency?",
      "given": "L = 0.65 m · v = 80 m/s · n = 1",
      "equation": "f_n = n · v / (2L)",
      "work": "f₁ = 1 · 80 / (2 · 0.65)\nf₁ = 80 / 1.30\nf₁ ≈ 61.5 Hz",
      "answer": "f₁ ≈ 61.5 Hz (close to a low B on a bass guitar)."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "You shout into a canyon and hear the echo 3.0 s later. How far away is the canyon wall? (v_sound in air = 343 m/s.)",
      "given": "Δt_round_trip = 3.0 s · v = 343 m/s",
      "equation": "d = v · Δt / 2 (round-trip → one-way)",
      "work": "d = 343 · 3.0 / 2\nd = 1029 / 2\nd ≈ 514 m",
      "answer": "≈ 514 m. (Quick rule: 1 second of echo delay ≈ 170 m to wall.)"
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "HARMONICS OF AN OPEN PIPE — A 0.85-m pipe organ tube, open at both ends, has v_sound = 343 m/s. Compute f₁ and f₂.",
      "givenHint": "L = 0.85 m · v = 343 m/s · n = 1 then n = 2.",
      "equationHint": "f_n = n·v/(2L) — compute f₁, then f₂ = 2·f₁.",
      "equationOptions": [
        "f_n = n·v / (2L)",
        "f_n = 2L / (n·v)",
        "d = v·Δt / 2",
        "v = f·λ"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Earth rang like a bell",
      "markdown": "The 1960 Chilean earthquake (9.5 magnitude) rang Earth like a bell for weeks. Some of its longest-period oscillations had T ≈ 54 minutes — below 1 mHz infrasound. Day 17 returns to seismic resonance."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A guitar string is 65 cm long. The wave speed on the string is 80 m/s. What's the fundamental frequency? Show one line of work.",
      "frame": "A standing wave's frequency depends on the medium speed ___ and the geometry ___ — specifically, f₁ = v/(2L). The harmonics are multiples of ___."
    },
    {
      "id": "rd-ch26-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **26.6–26.10** (natural frequency, forced vibration, resonance, interference of sound, and beats). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch26-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 26,
      "title": "Sound — read & practice",
      "sectionIds": [
        "26.6",
        "26.7",
        "26.8",
        "26.9",
        "26.10"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r2-resonance"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 10 — Vernier Echo Lab (Investigation 6.1)', 'u6-d10', 'Unit 6: Waves, Sound & Light', 10, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can use a Vernier microphone + LabQuest to time the delay between a clap and its echo from a known distance, compute v_sound = 2L/Δt, and compare to the accepted value with one credible source of error noted.",
      "targetId": "u6.s1-echo-lab"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "We've stated v_sound ≈ 343 m/s in air. Today we measure it ourselves.",
      "connection": "If we trust v = fλ + echo timing for everyday sound, we trust the same logic for radar pulse + Doppler analysis on Day 15."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "Investigation 6.1 — Measure v_sound by timing the echo",
      "markdown": "**Driving question:** Can we measure the speed of sound in our classroom by clapping toward a wall and timing the echo with a Vernier microphone?\n\n**Equipment:** Vernier LabQuest + microphone (one per pair) · tape measure or laser distance finder · wall (or large flat surface) at least 10 m away · thermometer (room temp affects v_sound) · spreadsheet or LoggerPro for waveform analysis.\n\n**How this lab serves the year's question:** If our v_sound is accurate to within 2% from a simple clap, NASA's Doppler radar (timing nanosecond pulses) achieves accuracy thousands of times better. Same physics, scaled."
    },
    {
      "id": "b4",
      "type": "procedure",
      "title": "What you do",
      "steps": [
        "Choose a wall and measure L (one-way distance) to ±0.05 m. Record.",
        "Set LabQuest sample rate to at least 10 kHz so the clap waveform is clean.",
        "Have one partner clap sharply near the microphone. The other partner triggers data capture.",
        "On the captured waveform, identify the clap peak + the echo peak. Read off Δt between them.",
        "Compute v_sound = 2L / Δt. Round-trip distance is 2L.",
        "Repeat for 3 trials. Average. Note room temperature.",
        "Compare to expected 343 m/s + temperature correction (about +0.6 m/s per °C above 20 °C)."
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety",
      "markdown": "Loud claps near the microphone can damage hearing if amplified — keep volume low and don't clap directly at someone's ear."
    },
    {
      "id": "b6",
      "type": "callout",
      "variant": "warning",
      "title": "Small Δt warning",
      "markdown": "A 10 m wall + a 0.06 s round trip means Δt is small. Use a sample rate ≥ 10 kHz, or use a longer corridor (15–20 m) to spread the peaks apart."
    },
    {
      "id": "b7",
      "type": "sketch",
      "capture": true,
      "instruction": "Sketch the setup: clapper + Vernier mic + wall + tape measure. Label L. The waveform shows two peaks; mark Δt between them. Compute v_sound = 2L/Δt.",
      "prompts": [
        "Label the one-way distance L on your diagram.",
        "Draw the captured waveform with the clap peak and the echo peak — mark Δt between them.",
        "Write the working equation v_sound = 2L/Δt next to the waveform."
      ]
    },
    {
      "id": "b8",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "L (m)",
        "Δt (s)",
        "v_sound (m/s)",
        "Notes"
      ],
      "rows": 4,
      "plot": false,
      "patternPrompt": "CLAP-ECHO TIMING. After your trials, compute the mean v_sound and note the room temperature."
    },
    {
      "id": "b9",
      "type": "observation",
      "capture": true,
      "patternPrompt": "How close did your average come to 343 m/s? What's the percent difference? Was the room warmer or cooler than 20 °C?",
      "interpretPrompt": "If you could only improve ONE of (L precision, Δt precision, room temperature control) — which would shrink your error the most? And the asteroid connection: how does this serve the year's question?",
      "frame": "We measured v_sound = ___ m/s. The accepted value at room temperature is ___ m/s. Our percent difference is ___ %. The main source of error was likely ___."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "If you measured v_sound = 350 m/s and your wall was 10.0 m away, what Δt did you record? Show one line of work.",
      "frame": "Δt = 2L / v_sound = ___ s."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.s1-echo-lab"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 11 — Intensity, Decibels, Doppler', 'u6-d11', 'Unit 6: Waves, Sound & Light', 11, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply I ∝ 1/r² for a point source, convert intensity to decibels using dB = 10·log₁₀(I/I₀), and predict whether a Doppler-shifted frequency rises or falls based on relative motion.",
      "targetId": "u6.r3-doppler"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Doppler is HOW radar measures asteroid velocity. The echo's frequency shift from the transmit frequency tells the line-of-sight speed.",
      "connection": "Today: Doppler on a familiar scale (ambulance siren). Day 15: Doppler applied to 2026-XJ's radar return."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Loudness, distance, and motion\n\nThree ideas today, all about how sound changes between source and listener.\n\n**Intensity falls as 1/r².** A point source spreads its power over a sphere of area 4πr². Double the distance and the same power covers 4× the area — so intensity drops to ¼. That's the inverse-square law, and it will come back with a vengeance on Day 15 (radar echoes fall as 1/r⁴ — out AND back).\n\n**The decibel scale is logarithmic.** Your ear handles intensities spanning 12 orders of magnitude, so we compress them: **dB = 10 · log₁₀(I / I₀)** with I₀ = 10⁻¹² W/m². Every +10 dB means ×10 in intensity. A 110 dB rock concert is 10¹¹ times more intense than the threshold of hearing.\n\n**The Doppler effect.** A moving source compresses wavefronts ahead of it and stretches the ones behind. Approach → higher observed frequency. Recede → lower. The equation: **f ' = f · v / (v ∓ v_source)** — minus sign for approaching (f rises), plus sign for receding (f falls)."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Intensity (I)",
          "definition": "Power per unit area. Units: W/m². Drops as 1/r² for a point source (energy spread over a 4πr² sphere). Example: a 1 W bulb 1 m away delivers I = 1/(4π) ≈ 0.080 W/m². At 2 m, only ¼ as much (0.020 W/m²).",
          "cognate": "Sp. intensidad · Pt. intensidade · HC entansite"
        },
        {
          "term": "Decibel (dB)",
          "definition": "A logarithmic measure of intensity. dB = 10 · log₁₀(I / I₀), with I₀ = 10⁻¹² W/m² (threshold of hearing). Every +10 dB = ×10 in intensity. Example: 0 dB hearing threshold, 60 dB normal conversation, 120 dB pain. A rock concert (110 dB) is 10¹¹ times more intense than the threshold.",
          "cognate": "Sp. decibelio · Pt. decibel · HC desibèl"
        },
        {
          "term": "Doppler effect",
          "definition": "When a wave SOURCE moves relative to an observer, the observed frequency SHIFTS. Approach → higher f. Recede → lower f. Example: an ambulance siren goes from high pitch to low pitch as it passes you; a train horn rises in pitch as it approaches.",
          "cognate": "Sp. efecto Doppler · Pt. efeito Doppler · HC efè Doppler"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Watch out",
      "markdown": "**Inverse SQUARE law:** double the distance → ¼ the intensity, not ½.\n\n**dB is a LOG scale:** +20 dB ≠ +2× intensity — it's +100× intensity. Hearing damage starts around 85 dB with prolonged exposure.\n\n**Doppler is about RELATIVE motion:** the SOURCE moving toward you gives the same shift as YOU moving toward the source."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "An ambulance moves right. Wavefronts AHEAD of it are compressed (higher f for the approaching listener). Wavefronts BEHIND it are stretched (lower f for the receder). Label which side hears HIGHER pitch.",
      "prompts": [
        "Draw the ambulance with circular wavefronts bunched up ahead and spread out behind.",
        "Place a listener on each side and label what each one hears (higher/lower pitch).",
        "Mark the direction of motion with an arrow."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "DOPPLER SHIFT, AMBULANCE APPROACHING. An ambulance siren emits at f = 800 Hz. The ambulance approaches you at v_source = 30 m/s. Sound in air: v = 343 m/s. What frequency do you hear?",
      "given": "f = 800 Hz · v = 343 m/s · v_source = 30 m/s (toward listener)",
      "equation": "f ' = f · v / (v − v_source)",
      "work": "f ' = 800 · 343 / (343 − 30)\nf ' = 800 · 343 / 313\nf ' = 274 400 / 313\nf ' ≈ 877 Hz",
      "answer": "You hear ≈ 877 Hz — about a half-step higher in pitch."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "DECIBEL RATIO. A whisper measures 30 dB. A motorcycle measures 100 dB. The motorcycle is how many times more INTENSE than the whisper?",
      "given": "ΔdB = 100 − 30 = 70 dB",
      "equation": "ratio = 10^(ΔdB / 10)",
      "work": "ratio = 10^(70 / 10)\nratio = 10⁷\nratio = 10 000 000",
      "answer": "The motorcycle is 10 million times more INTENSE than the whisper. (Perceived loudness rises slower than intensity.)"
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — TRAIN HORN RECEDING. A train with a 600 Hz horn moves AWAY from you at 20 m/s. What frequency do you hear? (v_sound = 343 m/s. Use plus sign for receding.)",
      "givenHint": "f = 600 Hz · v = 343 m/s · v_source = 20 m/s (away from listener)",
      "equationHint": "Receding source → plus sign in the denominator → lower frequency. Expect f ' below 600 Hz.",
      "equationOptions": [
        "f ' = f · v / (v + v_source)",
        "f ' = f · v / (v − v_source)",
        "dB = 10 · log₁₀(I / I₀)",
        "v = f · λ"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "Same Doppler logic, scaled to radar",
      "markdown": "2026-XJ at v_source returns radar with a tiny frequency shift Δf. NASA detects shifts as small as 0.01 Hz on a 2.4 GHz carrier. That's 4 parts in 10¹². Day 15 walks through the full chain."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A train with a 600 Hz horn moves at 20 m/s. You stand on the platform as it APPROACHES. What frequency do you hear? (Use v_sound = 343 m/s.) Show your work.",
      "frame": "A source moving TOWARD you compresses wavefronts → higher ___. Moving AWAY stretches them → lower ___. The dB scale is ___ in intensity: every +10 dB is ___× more intense."
    },
    {
      "id": "rd-ch25-d",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **25.9–25.11** (the Doppler effect, bow waves, and shock waves with sonic booms). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch25-d",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 25,
      "title": "Vibrations and Waves — read & practice",
      "sectionIds": [
        "25.9",
        "25.10",
        "25.11"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r3-doppler"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 12 — EM Spectrum: Light Is a Wave', 'u6-d12', 'Unit 6: Waves, Sound & Light', 12, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can identify the bands of the EM spectrum in order (radio → gamma), explain that all travel at c in vacuum, and compute λ from f using c = fλ for any band.",
      "targetId": "u6.k7-em-spectrum"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Radar (radio band) and the meteor's atmospheric-entry GLOW (visible) are the SAME kind of wave family. Different f, same physics.",
      "connection": "Day 16 makes this concrete — the meteor's GLOW color (visible light) tells us its temperature (Wien's law)."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Light is a wave — and it has a LOT of relatives\n\nEverything from radio to gamma rays is the same physical thing: a transverse wave of oscillating electric and magnetic fields, traveling at **c = 3 × 10⁸ m/s** in vacuum. No medium needed — that's how sunlight crosses 150 million km of empty space.\n\nThe only difference between the bands is frequency (and therefore wavelength, since **c = fλ** always holds). Walk the spectrum from longest λ to shortest:\n\n| Band | λ (vacuum) | Use |\n|---|---|---|\n| Radio | > 1 m | Broadcasting, cell, planetary radar (Day 15) |\n| Microwave | 1 m to 1 mm | Microwave oven (2.4 GHz), radar |\n| Infrared (IR) | 1 mm to 700 nm | Heat, night vision, TV remote |\n| Visible | 700 to 400 nm | ROYGBIV — what our eyes detect |\n| Ultraviolet (UV) | 400 to 10 nm | Sunburn, sterilization |\n| X-ray | 10 to 0.01 nm | Medical imaging |\n| Gamma | < 0.01 nm | Nuclear processes, cosmic events |\n\nSame wave equation as Day 3 — just substitute c for v: **λ = c / f** and **f = c / λ**. Master those two moves and you can place any EM wave on the spectrum."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Electromagnetic wave",
          "definition": "A transverse wave of oscillating electric + magnetic fields. Travels at c = 3 × 10⁸ m/s in vacuum. No medium needed — EM waves are NOT mechanical, which is why they cross vacuum from the Sun to Earth. Example: light, radio, X-rays, microwaves — all the same kind of wave, different frequencies.",
          "cognate": "Sp. onda electromagnética · Pt. onda eletromagnética · HC onn elektwomayetik"
        },
        {
          "term": "EM spectrum",
          "definition": "The full range of EM frequencies, from low-f radio (km wavelengths) up to high-f gamma rays (sub-nm wavelengths). Example: radio (km), microwave (cm), infrared (μm), VISIBLE (400–700 nm), UV (10s of nm), X-ray (nm), gamma (sub-nm). The bands shade into each other — the names are conventions, not sharp edges.",
          "cognate": "Sp. espectro electromagnético · Pt. espectro eletromagnético"
        },
        {
          "term": "Visible light",
          "definition": "The narrow band of EM the human eye detects, from ~400 nm (violet) to ~700 nm (red). The Sun emits its peak intensity here. Example: ROYGBIV — red has the longest visible λ, violet the shortest. Color = wavelength. \"Visible\" is just our species' window: bees see UV, some snakes see IR.",
          "cognate": "Sp. luz visible · Pt. luz visível · HC limyè vizib"
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Walk left-to-right through the EM bands. Which band has the LONGEST wavelength? The HIGHEST frequency? Where does our radar fall? Where does visible light fall?",
      "prompts": [
        "Draw the spectrum as a left-to-right strip: radio → microwave → IR → visible → UV → X-ray → gamma.",
        "Label which end has long λ / low f and which has short λ / high f.",
        "Mark where NASA's 2.4 GHz radar sits and where the meteor's visible glow sits."
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "MICROWAVE WAVELENGTH. Your microwave oven operates at f = 2.4 GHz = 2.4 × 10⁹ Hz. What's its wavelength? Which EM band is this?",
      "given": "f = 2.4 × 10⁹ Hz · c = 3 × 10⁸ m/s",
      "equation": "λ = c / f",
      "work": "λ = (3 × 10⁸) / (2.4 × 10⁹)\nλ = 0.125 m\nλ = 12.5 cm",
      "answer": "λ ≈ 12.5 cm. This is in the MICROWAVE band — sized to make food molecules absorb."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "VISIBLE GREEN LIGHT. Green light has λ ≈ 530 nm. What's its frequency?",
      "given": "λ = 530 nm = 5.30 × 10⁻⁷ m · c = 3 × 10⁸ m/s",
      "equation": "f = c / λ",
      "work": "f = (3 × 10⁸) / (5.30 × 10⁻⁷)\nf = 5.66 × 10¹⁴ Hz",
      "answer": "f ≈ 5.66 × 10¹⁴ Hz ≈ 566 THz — about a half-quadrillion cycles per second."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — X-RAY FREQUENCY. An X-ray has λ ≈ 1.0 × 10⁻¹⁰ m. What's its frequency?",
      "givenHint": "λ = 1.0 × 10⁻¹⁰ m · c = 3 × 10⁸ m/s",
      "equationHint": "Same move as the green-light example: f = c / λ. Expect a HUGE number — X-rays are near the top of the spectrum.",
      "equationIds": [
        "wave-speed"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "Why X-rays are dangerous but visible light is safe",
      "markdown": "Energy per photon depends on frequency. Higher f = higher-energy photons. X-rays can ionize molecules (break bonds). Visible photons can't."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "What's the wavelength of a microwave oven's 2.4 GHz radiation? (Use c = 3 × 10⁸.) Which EM band is this?",
      "frame": "All EM waves travel at ___ in vacuum. The EM spectrum is ordered from longest wavelength (___) to shortest (___). Visible light is just one narrow band, from ~___ nm to ~___ nm."
    },
    {
      "id": "rd-ch27-a",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **27.1–27.4** (early ideas about light, measuring the speed of light, the electromagnetic spectrum, and why glass is transparent). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch27-a",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 27,
      "title": "Light — read & practice",
      "sectionIds": [
        "27.1",
        "27.2",
        "27.3",
        "27.4"
      ]
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k7-em-spectrum"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 13 — Plane Mirrors + Virtual Images', 'u6-d13', 'Unit 6: Waves, Sound & Light', 13, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can construct a ray diagram for a plane mirror, locate the virtual image at equal distance behind the mirror, and explain why the image is upright + same size.",
      "targetId": "u6.k8-mirrors"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Radio telescopes are giant CURVED mirrors that focus radio waves to a detector. The Day 4 reflection law applies directly.",
      "connection": "Today the FLAT-mirror case. Day 14 generalizes to curves (lenses). Day 15 mentions parabolic radio dishes that combine both ideas."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Where IS your mirror image, really?\n\nWhen you look in a flat mirror, your brain does ray-tracing without asking permission. Light leaves your face, reflects off the mirror obeying the Day 4 law (θᵢ = θᵣ), and enters your eye. Your brain assumes light travels in straight lines, so it traces those rays **backward** — and they converge at a point **behind** the mirror.\n\nNo light is actually there. That's a **virtual image**: it can't be caught on a screen, because the rays never really meet. But the geometry is exact and predictable:\n\n- **d_image = d_object** — the image sits exactly as far behind the mirror as you stand in front of it.\n- **h_image = h_object** — same size, no magnification.\n- **Upright** — a plane mirror never flips you top-to-bottom.\n\nTwo rays from any point on the object, reflected by the law and traced backward, are enough to locate the image. That two-ray construction is today's core skill — and it's the same construction that explains why a radio dish needs to be CURVED to focus signals to one point."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Plane mirror",
          "definition": "A flat reflecting surface. Light obeys the law of reflection (Day 4). Produces VIRTUAL images behind the mirror at equal distance from the object. Example: your bathroom mirror, a glass storefront, a still pond surface. \"Plane\" means flat — not like an airplane; curved mirrors (concave, convex) behave differently and are not on the CPA scope.",
          "cognate": "Sp. espejo plano · Pt. espelho plano · HC miwa plat"
        },
        {
          "term": "Virtual image",
          "definition": "An image that LIGHT DOES NOT ACTUALLY REACH. The brain TRACES light rays backward and locates the image at the convergence point. Cannot be projected on a screen. Example: your mirror image — the light reflects off the mirror and into your eye; the image APPEARS to be behind the mirror, but no light is actually there.",
          "cognate": "Sp. imagen virtual · Pt. imagem virtual · HC imaj vityèl"
        }
      ]
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "misconception",
      "title": "Watch out",
      "markdown": "A virtual image cannot be 'caught' on a screen. A real image CAN. Plane mirrors always make virtual images."
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Object on the left of the mirror. Draw two rays from the object's tip — through the law of reflection. Trace each reflected ray BACKWARD (dashed). They converge at the VIRTUAL image, equal distance behind the mirror.",
      "prompts": [
        "Draw the mirror as a vertical line and the object on the left.",
        "Reflect two rays from the object's tip using θᵢ = θᵣ.",
        "Extend the reflected rays backward as dashed lines and mark where they converge — the virtual image."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "IMAGE LOCATION. A 2.0-m-tall person stands 1.5 m from a flat mirror. Where is their image? How tall does it appear?",
      "given": "height = 2.0 m · d_object = 1.5 m from mirror",
      "equation": "d_image = d_object · h_image = h_object (plane mirror)",
      "work": "d_image = 1.5 m behind the mirror.\nh_image = 2.0 m tall.\nImage is upright + virtual + same size.",
      "answer": "1.5 m behind the mirror, 2.0 m tall, upright."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "CLOSING THE DISTANCE. You walk 0.5 m closer to a mirror. By how much do you and your image close on each other?",
      "given": "You move 0.5 m toward mirror. Mirror is stationary.",
      "equation": "d_you = − 0.5 m → d_image = + 0.5 m closer also (mirror)",
      "work": "Your distance to mirror: ↓ 0.5 m\nImage's distance to mirror (= your distance): ↓ 0.5 m\nImage moves 0.5 m TOWARD mirror also.\nTotal closing: 1.0 m.",
      "answer": "You and your image close on each other by 1.0 m total."
    },
    {
      "id": "b9",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — SHORTEST MIRROR TO SEE YOURSELF. What's the shortest mirror that lets you see your full body (top of head to feet)? Hint: trace two rays — one from your eyes to your feet, one from your eyes to the top of your head. The mirror only needs to cover the midpoints.",
      "givenHint": "Your full height h. Eyes near the top of your head. Mirror is vertical, flat.",
      "equationHint": "Trace the eye-to-feet ray and the eye-to-head-top ray. Each reflection point sits at the MIDPOINT — so how much mirror do you actually need?",
      "equationOptions": [
        "h_mirror = ½ · h_person (ray midpoints)",
        "h_mirror = h_person (full height)",
        "d_image = 2 · d_object",
        "v = f · λ"
      ]
    },
    {
      "id": "b10",
      "type": "callout",
      "variant": "note",
      "title": "The answer to the YOUR TURN problem",
      "markdown": "A mirror HALF your height, mounted at the right height (top edge at eye level + half of forehead, bottom edge at feet midpoint), shows you head-to-toe regardless of how far away you stand."
    },
    {
      "id": "b11",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A 2-m-tall person stands 1.5 m from a flat mirror. Where is their image? How tall does it appear? Answer in one line.",
      "frame": "A plane mirror produces a ___ image (light doesn't actually reach it). The image is the same ___ as the object, located the same ___ behind the mirror as the object is in front. It is ___ (upright/inverted)."
    },
    {
      "id": "rd-ch27-b",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **27.5–27.8** (opaque materials, shadows and eclipses, polarization, and 3-D viewing). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch27-b",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 27,
      "title": "Light — read & practice",
      "sectionIds": [
        "27.5",
        "27.6",
        "27.7",
        "27.8"
      ]
    },
    {
      "id": "b12",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.k8-mirrors"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 14 — Lenses, Qualitatively', 'u6-d14', 'Unit 6: Waves, Sound & Light', 14, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can distinguish convex (converging) from concave (diverging) lenses by their shape and ray behavior, and identify whether the image is REAL or VIRTUAL.",
      "targetId": "u6.r4-lenses"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Optical telescopes combine MIRRORS (objective) + LENSES (eyepiece) to magnify distant objects. Asteroid optical telescopes are limited by diffraction (Day 6) and lens / mirror size.",
      "connection": "Day 15 will mention that NASA's Goldstone radar dish is a parabolic reflector — a giant curved mirror for radio."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Lenses: refraction with a job to do\n\nA lens is just shaped glass exploiting Day 5 refraction. Light slows down in glass; curve the surfaces and you control WHERE each ray bends. Two shapes, two opposite jobs:\n\n**Convex (converging):** thicker in the middle. Parallel rays bend inward and CONVERGE to a real focal point F, a distance f from the lens. This is the magnifying glass, the camera lens, your eye's lens.\n\n**Concave (diverging):** thinner in the middle. Parallel rays bend outward and DIVERGE; trace them backward and they appear to come from a virtual focal point on the incoming side. This is nearsighted glasses and the door peephole.\n\n**Real vs. virtual is the payoff question.** A REAL image forms where light actually converges — you can catch it on a screen (movie projector, camera sensor). A VIRTUAL image is where rays only APPEAR to come from — only an eye or camera looking through the lens sees it (magnifying glass held close to print). Concave lenses can ONLY make virtual images; convex lenses make real OR virtual depending on where the object sits relative to F."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Convex lens",
          "definition": "A lens that is THICKER in the middle than at the edges. Refraction at the curved surfaces makes parallel rays CONVERGE to a focal point F at distance f from the lens. Example: a magnifying glass, a camera lens, the eye's lens. \"Convex\" = bulging outward; \"converging\" = brings rays together. Both apply.",
          "cognate": "Sp. lente convexa · Pt. lente convexa · HC lant konvèks"
        },
        {
          "term": "Concave lens",
          "definition": "A lens THINNER in the middle. Refraction makes parallel rays DIVERGE outward; tracing them back gives a virtual focal point on the incoming side. Example: eyeglasses for nearsightedness (myopia), a peephole / door viewer (wide-angle). Concave lenses ALWAYS make virtual images — they spread rays out, can't focus them onto a screen.",
          "cognate": "Sp. lente cóncava · Pt. lente côncava · HC lant konkav"
        },
        {
          "term": "Focal length (f)",
          "definition": "Distance from a lens (or mirror) to its focal point. Shorter f = stronger converging. Convex: real F; concave: virtual F. Example: a magnifying glass with f = 10 cm has its focal point 10 cm from the lens — the Sun's rays focused to a tiny spot there can ignite paper. Note: the 'f' in focal length is NOT the same as the 'f' for frequency. Context.",
          "cognate": "Sp. distancia focal · Pt. distância focal · HC distans fokal"
        },
        {
          "term": "Real vs. virtual image",
          "definition": "REAL image: light rays actually converge to the image point — CAN be caught on a screen. VIRTUAL image: rays only APPEAR to converge (after tracing back) — cannot be caught on a screen. Example: movie projector → REAL image on the screen; magnifying glass close to small print → VIRTUAL magnified image (you see it through the lens). Real ↔ catchable on a screen; virtual ↔ only seen by an eye/camera looking through the lens.",
          "cognate": "Sp. imagen real/virtual · Pt. imagem real/virtual"
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "TOP: parallel rays hit a convex lens — converge to focal point F. BOTTOM: same rays hit a concave lens — diverge outward; trace back (dashed) to a virtual F. Which lens is in a magnifying glass? In nearsighted glasses?",
      "prompts": [
        "Top panel: convex lens, parallel rays converging to a labeled real F.",
        "Bottom panel: concave lens, rays diverging, dashed back-traces to a virtual F.",
        "Label which lens belongs in a magnifying glass and which in nearsighted glasses."
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "CLASSIFY EACH APPLICATION. For each application, identify the lens type (convex/concave) and image type (real/virtual): (a) magnifying glass; (b) camera; (c) movie projector; (d) nearsighted glasses; (e) door peephole.",
      "given": "—",
      "equation": "(qualitative reasoning — no equation)",
      "work": "(a) magnifying glass: CONVEX, VIRTUAL (close to object)\n(b) camera: CONVEX, REAL (image on sensor)\n(c) movie projector: CONVEX, REAL (image on screen)\n(d) nearsighted glasses: CONCAVE, VIRTUAL (diverges focus)\n(e) peephole: CONCAVE, VIRTUAL (wide-angle view)",
      "answer": "3 convex (2 real, 1 virtual), 2 concave (both virtual)."
    },
    {
      "id": "b7",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — BURN PAPER WITH THE SUN. You hold a magnifying glass (convex, f = 10 cm) above a piece of dry paper on a sunny day. At what distance above the paper do you hold the lens to focus the Sun's image and ignite the paper?",
      "givenHint": "Convex lens, f = 10 cm. The Sun is effectively at infinite distance → its rays arrive parallel.",
      "equationHint": "Parallel rays converge at the focal point. Where must the paper sit relative to the lens?",
      "equationOptions": [
        "Parallel rays (Sun at ∞) → image at the focal point: hold the lens f = 10 cm above the paper",
        "Hold it at 2f = 20 cm — images always form at twice the focal length",
        "v = f · λ",
        "θᵢ = θᵣ"
      ]
    },
    {
      "id": "b8",
      "type": "callout",
      "variant": "warning",
      "title": "That last one is real",
      "markdown": "Kids burn ants with magnifying glasses for a reason. The focused Sun's image at the focal point has roughly 1000× the intensity of unfocused sunlight. Inverse-square-law (Day 11) in reverse: small area → concentrated power."
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does looking through a magnifying glass make small print bigger? In one sentence, say what kind of lens it is + what kind of image is formed.",
      "frame": "A ___ lens brings parallel rays to a real focal point — it CONVERGES light. A ___ lens spreads them out, producing only virtual images. The KIND of image depends on the lens shape and the object's ___."
    },
    {
      "id": "rd-ch30",
      "type": "callout",
      "variant": "note",
      "title": "Read & practice",
      "markdown": "Open the reader and read **30.1–30.8** (converging and diverging lenses, real and virtual images, ray diagrams, optical instruments, the eye, and defects in vision and lenses). Answer the questions beside the reading as you go."
    },
    {
      "id": "ce-ch30",
      "type": "concept_exercise",
      "capture": true,
      "chapter": 30,
      "title": "Lenses — read & practice",
      "sectionIds": [
        "30.1",
        "30.2",
        "30.3",
        "30.4",
        "30.5",
        "30.6",
        "30.7",
        "30.8"
      ]
    },
    {
      "id": "b10",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r4-lenses"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 15 — RADAR: The Reveal', 'u6-d15', 'Unit 6: Waves, Sound & Light', 15, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can trace the FULL radar measurement chain: send a pulse, time the round trip for DISTANCE (d = c·Δt/2), measure the frequency SHIFT for VELOCITY (v = (Δf/f)·c), and estimate SIZE from signal strength.",
      "targetId": "u6.r5-radar-chain"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "For five units we've USED 2026-XJ numbers. Today we see WHERE THEY CAME FROM.",
      "connection": "Every Unit 6 idea is required: v = fλ (Day 3), reflection (Day 4), Doppler (Day 11), EM waves (Day 12), mirrors (Day 13). Today they combine into the radar measurement chain."
    },
    {
      "id": "b3",
      "type": "callout",
      "variant": "note",
      "title": "★ THE REVEAL · Where the numbers came from",
      "markdown": "Since Unit 1 you have used these 2026-XJ numbers: distance from Earth, closing velocity, mass, trajectory, impact KE, damage radii. Every one had to be MEASURED. The instrument is RADAR — specifically NASA's Goldstone (California) and Arecibo-era (Puerto Rico) planetary radar systems. Modern planetary radar transmits 2.4 GHz radio pulses at very high power, listens for the echo from the asteroid, and extracts three pieces of information from the return:\n\n► **DISTANCE:** from the round-trip TIME Δt: d = c · Δt / 2. At c = 3×10⁸ m/s, a Δt = 2.5 s means the asteroid is 375 000 km away.\n\n► **VELOCITY (line-of-sight):** from the DOPPLER SHIFT Δf: v = (Δf / f) · c. A 5 kHz shift on a 2.4 GHz carrier means v ≈ 312 m/s closing (or receding).\n\n► **SIZE (estimate):** from signal STRENGTH vs. distance: a stronger echo means a larger radar cross-section. Combined with an assumed albedo + density, size and mass estimates fall out — with uncertainty."
    },
    {
      "id": "b4",
      "type": "diagram",
      "kind": "energy_chain",
      "links": [
        {
          "label": "Transmit",
          "sublabel": "Goldstone dish sends a 2.4 GHz pulse (f_T) toward 2026-XJ"
        },
        {
          "label": "Echo returns",
          "sublabel": "Pulse reflects off the asteroid; intensity falls as 1/r⁴ (out AND back)"
        },
        {
          "label": "Time Δt → DISTANCE",
          "sublabel": "d = c·Δt/2 — precise to meters"
        },
        {
          "label": "Shift Δf → VELOCITY",
          "sublabel": "v = (Δf/f_T)·c — higher echo f = approaching; precise to mm/s"
        },
        {
          "label": "Strength → SIZE",
          "sublabel": "Radar cross-section + assumed albedo/density → size + mass, with the biggest uncertainty"
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "The unit's centerpiece. Trace the full chain. Mark Δt (round-trip time). Compare outgoing wave (f_T) to returning wave (f_R) — does it look compressed or stretched? What does that tell you about asteroid motion?",
      "prompts": [
        "Draw Earth dish → pulse out → 2026-XJ → echo back. Mark Δt across the round trip.",
        "Sketch the outgoing wave at f_T and the returning wave at f_R — compressed or stretched?",
        "Annotate what each measured quantity (Δt, Δf, strength) tells NASA."
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "STEP 1 — DISTANCE FROM ROUND-TRIP TIME. A radar pulse is sent toward 2026-XJ. The echo returns Δt = 2.5 s later. How far away is the asteroid?",
      "given": "Δt = 2.5 s · c = 3.00 × 10⁸ m/s",
      "equation": "d = c · Δt / 2 (round trip → one way)",
      "work": "d = (3.00 × 10⁸) · 2.5 / 2\nd = 7.5 × 10⁸ / 2\nd = 3.75 × 10⁸ m\nd = 375 000 km",
      "answer": "d ≈ 375 000 km — about the distance to the Moon. Real-world precision: ±100 m."
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "STEP 2 — VELOCITY FROM THE DOPPLER SHIFT. The transmitted radar pulse is at f_T = 2.4 GHz. The echo returns at f_R = 2.40005 GHz (5 kHz HIGHER). What's the asteroid's line-of-sight velocity? Is it approaching or receding?",
      "given": "f_T = 2.4 × 10⁹ Hz · f_R = 2.400005 × 10⁹ Hz · Δf = 5 000 Hz · c = 3 × 10⁸ m/s",
      "equation": "v = (Δf / f_T) · c (HIGHER echo → APPROACHING)",
      "work": "v = (5000 / 2.4 × 10⁹) · 3 × 10⁸\nv = (2.08 × 10⁻⁶) · 3 × 10⁸\nv ≈ 625 m/s",
      "answer": "v ≈ 625 m/s, APPROACHING (echo frequency was higher than transmitted). Modern systems detect Δf down to 0.01 Hz — ~mm/s velocity precision."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "STEP 3 — SIZE ESTIMATE FROM SIGNAL STRENGTH. The echo's STRENGTH (energy per square meter back at Earth) depends on (a) how far the wave traveled (1/r⁴ — out AND back), and (b) the asteroid's RADAR CROSS-SECTION (effective area). Why does the signal weaken as 1/r⁴, not just 1/r²?",
      "given": "Wave travels: Earth → asteroid → Earth. Two legs, each inverse-square.",
      "equation": "I ∝ 1 / (r² × r²) = 1 / r⁴",
      "work": "Outgoing wave to asteroid: I drops as 1/r² (Day 11).\nAfter reflecting, echo wave back to Earth: ANOTHER 1/r² drop.\nTotal: 1/r⁴. So radar at TWICE the distance is 16× weaker.",
      "answer": "1/r⁴ is brutal — that's why planetary radar transmits MEGAWATT pulses. Larger asteroid → larger cross-section → stronger echo → size estimate."
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "These numbers are REAL outputs of this chain",
      "markdown": "The 2026-XJ mass estimate has the largest uncertainty (depends on assumed albedo + density). The velocity is precise to mm/s. The distance is precise to meters. That's WHY the impact KE has uncertainty — not because the physics is wrong, but because the measurement is bounded by what radar can resolve."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why does NASA need MULTIPLE radar observations of the same asteroid (over weeks or months) to predict its orbit precisely?",
      "frame": "Radar measures asteroid distance from ___ (the round-trip time times c, halved). Radar measures velocity from ___ (the Doppler frequency shift). Higher echo frequency → asteroid is ___; lower → receding. Mass uncertainty comes from the fact that signal STRENGTH only gives a ___ estimate of size."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r5-radar-chain"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 16 — Meteor Color (Wien''s Law)', 'u6-d16', 'Unit 6: Waves, Sound & Light', 16, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply Wien's law qualitatively (and the constant 2.9 × 10⁻³ m·K quantitatively if stretched) to predict the COLOR of a thermally radiating object — meteor, star, stovetop — from its TEMPERATURE.",
      "targetId": "u6.r6-wiens-law"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "A meteor's atmospheric-entry glow (Unit 5 Day 10) heats it to 5000–10 000 K. It glows yellow-white, sometimes blue-white.",
      "connection": "Wien's law explains WHY. Same rule that classifies stars by color. Both 2026-XJ's entry glow AND the impact fireball follow this law."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Color is a thermometer\n\nEvery warm object glows. You glow (in infrared). A stovetop coil glows red. The Sun glows yellow-white. A welding arc glows blue-white. The pattern is not a coincidence — it's **blackbody radiation**, and the color is set entirely by temperature.\n\n**Wien's law** pins it down: the peak emission wavelength times the temperature is a constant.\n\n**λ_max · T = 2.9 × 10⁻³ m·K**, so **λ_max = b / T**.\n\nHotter object → shorter peak wavelength → color slides from red toward blue:\n\n- Red-hot iron, ~1000 K → λ_max ≈ 3 μm, mostly infrared; only the longest visible reds leak through. Looks RED.\n- The Sun, ~6000 K → λ_max ≈ 500 nm. Looks YELLOW-WHITE.\n- Meteor entry glow, ~5000 K → λ_max ≈ 580 nm. YELLOW-WHITE — exactly what observers report.\n- Extreme entry, ~10 000 K → λ_max ≈ 290 nm, in the UV; the visible tail is weighted blue. Looks BLUE-WHITE.\n\nOne law, one constant, and suddenly meteor color, star classification, and \"warm vs. cool\" light bulbs are all the same physics."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Blackbody radiation",
          "definition": "The EM radiation emitted by ALL warm objects, with a spectrum determined entirely by temperature. Hotter object = higher peak frequency. Example: a red-hot iron, a glowing meteor, the Sun, the Cosmic Microwave Background — all blackbodies at different T. A blackbody doesn't have to look black — it's an idealization that real objects approximate well at high T.",
          "cognate": "Sp. radiación de cuerpo negro · Pt. radiação de corpo negro"
        },
        {
          "term": "Wien's law",
          "definition": "The peak wavelength of a blackbody's emission is inversely proportional to its temperature: λ_max · T = 2.9 × 10⁻³ m·K. Higher T → shorter λ_max (toward blue). Example: the Sun at T ≈ 6000 K → λ_max ≈ 500 nm (yellow-green); a red-hot iron at 1000 K → λ_max ≈ 3 μm (mostly infrared; only the longest visible reds are seen). At very high T (10 000 K+) the peak shifts into UV — but visible red + blue together look BLUE-WHITE to us.",
          "cognate": "Sp. ley de Wien · Pt. lei de Wien"
        },
        {
          "term": "Color temperature",
          "definition": "A way of expressing the COLOR of a thermally radiating object as a temperature (in Kelvin). Used in photography, astronomy, lighting design. Example: incandescent bulb 2700 K (warm yellow), sunlight 5500–6500 K (white), cloudy sky 10 000 K (blue tint). Counterintuitive: \"warm\" light is LOWER T; \"cool\" light is HIGHER T — higher color temperature looks BLUER.",
          "cognate": "Sp. temperatura de color · Pt. temperatura de cor"
        }
      ]
    },
    {
      "id": "b5",
      "type": "sketch",
      "capture": true,
      "instruction": "Order from coolest to hottest: red-hot iron, yellow flame, the Sun, atmospheric meteor, blue star. Each step UP in temperature shifts peak emission toward SHORTER wavelengths.",
      "prompts": [
        "Draw a temperature ladder, coolest at the bottom, hottest at the top.",
        "Place all five objects on the ladder with an estimated T for each.",
        "Next to each, mark its glow color — watch it slide red → yellow → white → blue."
      ]
    },
    {
      "id": "b6",
      "type": "worked_example",
      "prompt": "METEOR PEAK WAVELENGTH. A meteor at atmospheric entry is heated to T ≈ 5000 K. Compute the peak emission wavelength using Wien's law: λ_max · T = 2.9 × 10⁻³ m·K. What color does this correspond to?",
      "given": "T = 5000 K · b = 2.9 × 10⁻³ m·K",
      "equation": "λ_max = b / T",
      "work": "λ_max = (2.9 × 10⁻³) / 5000\nλ_max = 5.8 × 10⁻⁷ m\nλ_max = 580 nm",
      "answer": "λ_max ≈ 580 nm — YELLOW. (The peak's in yellow; the wings reach red + green, making the meteor look YELLOW-WHITE.)"
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "EXTREME ENTRY SPEED. A faster meteor (or an asteroid at high entry speed) can heat to T ≈ 10 000 K. What's the peak λ? What color?",
      "given": "T = 10 000 K · b = 2.9 × 10⁻³ m·K",
      "equation": "λ_max = b / T",
      "work": "λ_max = (2.9 × 10⁻³) / 10 000\nλ_max = 2.9 × 10⁻⁷ m\nλ_max = 290 nm",
      "answer": "λ_max ≈ 290 nm — UV. The visible part looks BLUE-WHITE (heavily weighted toward blue + violet)."
    },
    {
      "id": "b8",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — CLASSIFY BY COLOR. A red-hot iron glows at T ≈ 1000 K. What's λ_max? Why does it look RED to us (despite λ_max being beyond visible)?",
      "givenHint": "T = 1000 K · b = 2.9 × 10⁻³ m·K",
      "equationHint": "Same move as the meteor examples. Expect λ_max in the infrared — then explain which visible wavelengths leak through.",
      "equationOptions": [
        "λ_max = b / T",
        "λ_max = b · T",
        "v = f · λ",
        "dB = 10 · log₁₀(I / I₀)"
      ]
    },
    {
      "id": "b9",
      "type": "callout",
      "variant": "note",
      "title": "Stars are classified by this law",
      "markdown": "Astronomers measure star COLOR to estimate surface temperature. Cool stars (M-class, 3000 K) are RED. Sun-like stars (G-class, 6000 K) are YELLOW. Hot stars (O-class, 30 000 K) are BLUE. Same physics as the meteor glow."
    },
    {
      "id": "b10",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "A meteor entering at extreme speed could heat to 10 000 K. What color would it glow? How does this compare to a typical meteor (5000 K)? Give a one-sentence comparison.",
      "frame": "Hotter object → peak emission at ___ wavelength. The Sun (6000 K) peaks at ___ nm. A 10 000 K meteor peaks at ___ nm — in the ___ band. Visible color combines the WHOLE spectrum, weighted by intensity."
    },
    {
      "id": "b11",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r6-wiens-law"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 17 — Seismic + Tsunami Damage at Distance', 'u6-d17', 'Unit 6: Waves, Sound & Light', 17, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can predict the arrival time of seismic P-waves and S-waves at distant locations, and apply v = √(g·d) to estimate tsunami speed + arrival time at a distant coastline.",
      "targetId": "u6.r7-tsunami"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "2026-XJ has a 70% chance of impacting OCEAN. If it does, the dominant long-range damage mechanism shifts to TSUNAMI. If it hits land, SEISMIC waves register globally.",
      "connection": "Today's payoff: both kinds of mechanical waves carry impact damage far beyond the immediate strike zone. Wave physics scales up to planetary geometry."
    },
    {
      "id": "b3",
      "type": "prose",
      "markdown": "## Mechanical waves at continental scale\n\nEverything from Days 1–9 — longitudinal vs. transverse, v set by the medium, energy carried without matter — now scales up to a planet.\n\n**Seismic waves** travel through rock. **P-waves** are longitudinal (compressions of rock, like sound), move ~6 km/s in the mantle, and arrive FIRST. **S-waves** are transverse (side-to-side rock motion), move ~4 km/s, and arrive SECOND. The P–S arrival gap is how seismologists triangulate a source. Bonus diagnostic: S-waves can't cross liquid — which is how we know Earth's outer core is liquid.\n\n**Tsunamis** travel along the ocean surface. Their speed depends only on ocean depth: **v = √(g·d)**. At d = 4 km, v ≈ 200 m/s ≈ 700 km/h — jet-airliner fast. In deep water the wave is only ~1 m tall. Near shore, d shrinks, so v drops — but the wave's energy has to go somewhere (**energy conservation**), so the amplitude GROWS. Fast-and-low in deep water becomes slow-and-tall at the coast. That's why the coast is where the damage happens.\n\nFor an ocean impact, every distance becomes an arrival TIME via t = d/v — and the differences between those times are the warning windows."
    },
    {
      "id": "b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Seismic P-wave (primary)",
          "definition": "A LONGITUDINAL mechanical wave traveling through Earth's crust + mantle. Compressions and rarefactions of rock. ≈ 6 km/s in mantle. FIRST to arrive at a seismograph (hence 'P'). Example: diameter of Earth (~12 700 km) / 6 km/s ≈ 35 min — P-waves traverse the whole planet in about half an hour. They can travel through solid AND liquid — the only seismic wave that crosses Earth's liquid outer core.",
          "cognate": "Sp. onda P · Pt. onda P · HC vag P"
        },
        {
          "term": "Seismic S-wave (secondary)",
          "definition": "A TRANSVERSE mechanical wave through Earth's crust + mantle. Side-to-side oscillation of rock. ≈ 4 km/s in mantle. ARRIVES SECOND. The TIME GAP between P and S arrival is how seismologists triangulate the source distance. S-waves can NOT travel through liquids — that's how we know Earth's outer core is liquid: S-waves don't make it through; P-waves do.",
          "cognate": "Sp. onda S · Pt. onda S · HC vag S"
        },
        {
          "term": "Tsunami",
          "definition": "An ocean-surface gravity wave triggered by a sudden displacement of water (impact, undersea earthquake, landslide). Speed v = √(g · d), where d is ocean depth. Example: a 2026-XJ ocean impact at 4 km depth generates a tsunami moving at v = √(9.8 · 4000) ≈ 200 m/s ≈ 700 km/h — reaching a coast 1500 km away in about 2 hours. In DEEP water it's only ~1 m tall but fast; in SHALLOW water it slows AND grows tall (energy conservation). Coast is where damage happens.",
          "cognate": "Sp. tsunami · Pt. tsunami · HC tsunami"
        }
      ]
    },
    {
      "id": "b5",
      "type": "diagram",
      "kind": "energy_chain",
      "links": [
        {
          "label": "Ocean impact",
          "sublabel": "2026-XJ displaces a column of water — impact KE becomes wave energy"
        },
        {
          "label": "Deep ocean (d ≈ 4 km)",
          "sublabel": "v = √(g·d) ≈ 200 m/s — fast, but only ~1 m tall"
        },
        {
          "label": "Shallowing shelf",
          "sublabel": "d drops → v drops; energy conservation forces amplitude UP"
        },
        {
          "label": "Coastline",
          "sublabel": "Slow + tall — catastrophic run-up where people live"
        }
      ]
    },
    {
      "id": "b6",
      "type": "sketch",
      "capture": true,
      "instruction": "Cross-section of the ocean. Tsunami in DEEP water is fast + low. As it reaches the SHALLOW coast, it slows AND amplifies. Where does the most energy build up? What happens at the shoreline?",
      "prompts": [
        "Draw the ocean floor rising toward the coast, with depth d labeled at two spots.",
        "Show the wave low-and-fast over deep water, tall-and-slow near shore.",
        "Annotate where the energy concentrates and what happens at the shoreline."
      ]
    },
    {
      "id": "b7",
      "type": "worked_example",
      "prompt": "P-WAVE ARRIVAL ACROSS EARTH. An asteroid impact in Africa launches seismic waves. How long until the P-waves are detected by a seismograph in California, about 13 000 km away through Earth?",
      "given": "d = 13 000 km = 1.3 × 10⁷ m · v_P = 6 km/s = 6000 m/s",
      "equation": "t = d / v",
      "work": "t = 1.3 × 10⁷ / 6000\nt = 2167 s\nt ≈ 36 minutes",
      "answer": "≈ 36 min after impact. S-waves arrive ~18 minutes later (slower at 4 km/s)."
    },
    {
      "id": "b8",
      "type": "worked_example",
      "prompt": "TSUNAMI SPEED IN DEEP OCEAN. An ocean impact occurs at d = 4 km depth. What's the tsunami's deep-ocean speed?",
      "given": "g = 9.8 m/s² · d = 4000 m",
      "equation": "v = √(g · d)",
      "work": "v = √(9.8 · 4000)\nv = √(39 200)\nv ≈ 198 m/s\nv ≈ 200 m/s ≈ 700 km/h",
      "answer": "≈ 200 m/s ≈ 700 km/h. As fast as a jet airliner."
    },
    {
      "id": "b9",
      "type": "worked_example",
      "prompt": "ARRIVAL TIME ON A DISTANT COAST. Continuing the example above: how long until that tsunami reaches a coastline 1500 km away?",
      "given": "d = 1.5 × 10⁶ m · v = 200 m/s",
      "equation": "t = d / v",
      "work": "t = 1.5 × 10⁶ / 200\nt = 7500 s\nt ≈ 125 min\nt ≈ 2.1 hours",
      "answer": "≈ 2 hours warning before impact at the coast. That window is why tsunami early-warning networks (DART buoys + seismic detection) exist."
    },
    {
      "id": "b10",
      "type": "gewa",
      "capture": true,
      "prompt": "YOUR TURN — S-WAVE ARRIVAL. After the same African impact, how long until the S-waves arrive in California (13 000 km away, v_S = 4 km/s)? Compute the GAP between P-wave and S-wave arrival.",
      "givenHint": "d = 13 000 km = 1.3 × 10⁷ m · v_S = 4 km/s = 4000 m/s · P-wave arrival from the worked example: ≈ 36 min",
      "equationHint": "Same t = d/v move as the P-wave, then subtract the two arrival times for the gap.",
      "equationOptions": [
        "t = d / v",
        "v = √(g · d)",
        "d = c · Δt / 2",
        "v = f · λ"
      ]
    },
    {
      "id": "b11",
      "type": "prose",
      "markdown": "## Wave damage-by-distance · 2026-XJ ocean impact scenario\n\n| Mechanism | Arrival | Reach | Effect |\n|---|---|---|---|\n| ► Atmospheric shockwave | minutes | few hundred km | broken windows; flattened forest |\n| ► Thermal pulse (Unit 5) | seconds | ~800 km | wildfire ignition radius |\n| ► Seismic P-wave | ~35 min | global (~12 700 km) | registers worldwide |\n| ► Seismic S-wave | ~50 min | via mantle (no liquid core) | global on land |\n| ► Tsunami | ~2 hours | thousands of km | catastrophic at the coast |"
    },
    {
      "id": "b12",
      "type": "callout",
      "variant": "warning",
      "title": "The warning window",
      "markdown": "If 2026-XJ splashes down 1500 km from a coast, the THERMAL pulse arrives in seconds, the SEISMIC arrival in ~35 min, but the TSUNAMI takes ~2 hours. That's the warning window. Whether the warning saves lives depends on how fast it's relayed."
    },
    {
      "id": "b13",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Why is a tsunami much more dangerous on the shoreline than in deep ocean? Answer in two sentences using the phrase 'energy conservation'.",
      "frame": "Seismic P-waves are ___ (longitudinal/transverse) and travel ~___ km/s. S-waves are ___ and travel ~___ km/s. A tsunami moves at v = √(___), so deeper ocean → ___ tsunami."
    },
    {
      "id": "b14",
      "type": "marzano",
      "capture": true,
      "targetId": "u6.r7-tsunami"
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

INSERT INTO lessons (title, slug, unit, lesson_number, lesson_type, published, content_blocks)
VALUES ('Day 18 — Unit 6 Transfer Task', 'u6-d18', 'Unit 6: Waves, Sound & Light', 18, 'markdown', true, $u6${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "b1",
      "type": "target",
      "statement": "I can apply every Unit 6 tool — v = fλ, reflection, refraction, diffraction, interference, Doppler, dB, EM spectrum, mirrors, lenses, Wien's law, and tsunami physics — independently on the transfer task.",
      "targetId": "u6.transfer-task"
    },
    {
      "id": "b2",
      "type": "asteroid_thread",
      "whatWeKnow": "Every Unit 6 tool: v = fλ, reflection, refraction, diffraction, interference, Doppler, dB, EM spectrum, mirrors, lenses, Wien's law, tsunami v = √(g·d), seismic speeds.",
      "connection": "Problem 5 is the load-bearing R4 prompt: given a radar return + Doppler shift, compute distance + velocity, then predict tsunami arrival on a coast. The whole unit in one problem."
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
      "markdown": "## The task — 5 multi-part problems, ~40 minutes, independent\n\n- **Problem 1 — Wave equation across media.** A 1000 Hz sound moves from air (v = 343 m/s) into water (v = 1480 m/s). Compute λ in each medium. Explain what stays the same and what changes (and why).\n- **Problem 2 — Reflection.** A flat mirror is 2.0 m from a 1.6-m-tall person. Locate the image and compute its height. State whether real or virtual. Sketch a 2-ray diagram.\n- **Problem 3 — Doppler.** A 1000 Hz ambulance siren moves at 25 m/s toward a stationary listener. What frequency is heard? What about the listener BEHIND the ambulance (away)? Use f ' = f · v / (v ∓ v_source).\n- **Problem 4 — EM spectrum.** A radio station broadcasts at f = 540 kHz. Compute λ. Which EM band is this? (Use c = 3 × 10⁸ m/s.) Is this AM or FM?\n- **Problem 5 — ★ Asteroid scenario.** Radar pulse to 2026-XJ: transmitted f_T = 2.4 GHz, round-trip time Δt = 2.4 s, echo received at f_R = 2.40010 GHz (10 kHz higher). (a) Compute distance. (b) Compute approach velocity. (c) If 2026-XJ impacts the ocean 1500 km from a coast (d_ocean = 4 km), how long until the tsunami arrives at the coast?\n\n### How it's scored — 4 dimensions, each 0–4\n\n- **Science** — correct physics: vectors, kinematics, units.\n- **Reasoning** — sound method; uncertainty explained, not just stated.\n- **Communication** — work shown, units labeled, organized, readable.\n- **Transfer-to-Asteroid** — honest public-facing connection to 2026-XJ."
    },
    {
      "id": "b5",
      "type": "callout",
      "variant": "tip",
      "title": "Allowed today",
      "markdown": "The Unit 6 Equation Reference card and a calculator. Every equation on it is on the MCAS Equation Sheet — you do **not** need to memorize them. You DO need to recognize when each one applies. You may ask **clarifying** questions about what the task means — but not physics-content questions."
    },
    {
      "id": "b6",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Before you start the paper task, write your plan: match each of the five problems to its Unit 6 idea, decide what order you'll tackle them, and predict where you will struggle. (Problem 5 is the ★ — it integrates radar + Doppler + tsunami.)",
      "frame": "My plan: first I will ___, then ___. I expect to struggle most with ___."
    },
    {
      "id": "b7",
      "type": "prose",
      "markdown": "## After the task — final unit self-assessment\n\nRate yourself on every Unit 6 target below. This is your end-of-unit Marzano record — it feeds your Mastery Growth Chart and tells us both exactly where to focus before Unit 7 builds on this one."
    },
    {
      "id": "b8",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "u6.k1-wave-anatomy",
        "u6.k2-wave-equation",
        "u6.k3-reflection",
        "u6.k4-refraction",
        "u6.k5-diffraction",
        "u6.r1-interference",
        "u6.k6-sound-longitudinal",
        "u6.r2-resonance",
        "u6.s1-echo-lab",
        "u6.r3-doppler",
        "u6.k7-em-spectrum",
        "u6.k8-mirrors",
        "u6.r4-lenses",
        "u6.r5-radar-chain",
        "u6.r6-wiens-law",
        "u6.r7-tsunami"
      ]
    },
    {
      "id": "b9",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "End-of-unit reflection: where did you grow the most this unit, and what's the one idea you want locked in before Unit 7 (electricity & magnetism)?",
      "frame": "I grew most on ___. Before Unit 7 I want to lock in ___."
    }
  ]
}$u6$::jsonb)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, unit = EXCLUDED.unit, lesson_number = EXCLUDED.lesson_number, content_blocks = EXCLUDED.content_blocks, updated_at = now();

-- Wire each target to its lesson (publish guardrail requires learning_targets.lesson_id)
WITH map(target_slug, lesson_slug) AS (VALUES
  ('u6.anchor-energy-not-matter','u6-d01'),
  ('u6.k1-wave-anatomy','u6-d02'),
  ('u6.k2-wave-equation','u6-d03'),
  ('u6.k3-reflection','u6-d04'),
  ('u6.k4-refraction','u6-d05'),
  ('u6.k5-diffraction','u6-d06'),
  ('u6.r1-interference','u6-d07'),
  ('u6.k6-sound-longitudinal','u6-d08'),
  ('u6.r2-resonance','u6-d09'),
  ('u6.s1-echo-lab','u6-d10'),
  ('u6.r3-doppler','u6-d11'),
  ('u6.k7-em-spectrum','u6-d12'),
  ('u6.k8-mirrors','u6-d13'),
  ('u6.r4-lenses','u6-d14'),
  ('u6.r5-radar-chain','u6-d15'),
  ('u6.r6-wiens-law','u6-d16'),
  ('u6.r7-tsunami','u6-d17'),
  ('u6.transfer-task','u6-d18')
)
UPDATE learning_targets t SET lesson_id = l.id::text
FROM map m JOIN lessons l ON l.slug = m.lesson_slug
WHERE t.slug = m.target_slug;

UPDATE learning_targets SET exclude_from_growth = true WHERE slug IN ('u6.transfer-task');

COMMIT;
