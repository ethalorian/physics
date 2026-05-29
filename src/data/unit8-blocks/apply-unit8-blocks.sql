-- Apply Unit 8 lesson blocks (paste into Supabase SQL editor). Generated from src/data/unit8-blocks/*.json
BEGIN;
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "ANCHOR",
  "blocks": [
    {
      "id": "d1-b1",
      "type": "callout",
      "variant": "note",
      "title": "The Car Project — 9 days",
      "markdown": "For the next **9 days you will build a car**, then race it down the corridor. On Day 9 you will not only race — you will write a **transfer task** defending **three physics choices** you made. Every build decision this unit is a physics decision in disguise. Today is the kickoff: we walk the race corridor, meet the four safety zones, and commit a team theme."
    },
    {
      "id": "d1-b2",
      "type": "target",
      "statement": "I can name the four components of a DC circuit (battery, switch, motor, wires in series) — at least by sight.",
      "targetId": "K1"
    },
    {
      "id": "d1-b3",
      "type": "target",
      "statement": "I can preview the energy chain that drives the car: chemical → electrical → mechanical-rotational → mechanical-translational.",
      "targetId": "K2"
    },
    {
      "id": "d1-b4",
      "type": "target",
      "statement": "I can explain that a car veers because of friction asymmetry, not lack of power — a geometry problem, not a strength problem.",
      "targetId": "K4"
    },
    {
      "id": "d1-b5",
      "type": "prose",
      "markdown": "### Walk the corridor\n\nStand inside the actual race corridor. Notice how **narrow** it is. Notice the length — about **6 meters**. The corridor is not decoration; it **is the design constraint**.\n\nHere is the thing that should worry you: a car that starts pointed just **2 cm off-true** does not stay 2 cm off. The error grows over the whole 6 m run. A tiny misalignment on build day becomes a wall-scraping disaster on race day. That is why the days ahead obsess over straight axle lines and parallel wheels."
    },
    {
      "id": "d1-b6",
      "type": "callout",
      "variant": "warning",
      "title": "Four safety zones — show, don't touch (yet)",
      "markdown": "This room has **four hazard zones**. You will be trained on each before you use it, and every day opens with a 60-second safety beat on the relevant zone.\n\n1. **Soldering iron** — hot enough to burn instantly; never set down off its stand.\n2. **Hot glue** — the glue AND the nozzle stay dangerously hot for minutes.\n3. **Drill** — eye protection on, hands clear, work clamped.\n4. **Switch installation / first power-on** — live circuits; respect the loop.\n\nToday you only **observe** these stations. Do not power anything, heat anything, or cut anything without a teacher present."
    },
    {
      "id": "d1-b7",
      "type": "vocab",
      "terms": [
        {
          "term": "Battery",
          "definition": "The source — stores chemical energy and pushes current around the loop.",
          "cognate": "batería"
        },
        {
          "term": "Switch",
          "definition": "The gate — opens or closes the loop to start and stop the motor.",
          "cognate": "interruptor"
        },
        {
          "term": "Motor",
          "definition": "The load — converts electrical energy into spinning (rotational) motion.",
          "cognate": "motor"
        },
        {
          "term": "Series",
          "definition": "Components wired one after another in a single loop; break it anywhere and current stops everywhere.",
          "cognate": "en serie"
        },
        {
          "term": "Current",
          "definition": "The flow of charge around the closed loop that makes the motor turn.",
          "cognate": "corriente"
        }
      ]
    },
    {
      "id": "d1-b8",
      "type": "callout",
      "variant": "tip",
      "title": "Team roles (3–4 per team)",
      "markdown": "Pick roles now so every build day runs smoothly: **build lead** (drives construction), **safety officer** (owns the zone checklist), and **scribe** (records data and decisions in this packet). A fourth member shares the build-lead and scribe load."
    },
    {
      "id": "d1-b9",
      "type": "gewa",
      "capture": true,
      "prompt": "Quick estimate: the race corridor is about 6 m long. If your car can cover roughly 2 m every second, about how long does one clean run take? (This sets your expectations for the race — no precise data yet, just a back-of-the-envelope estimate.)",
      "givenHint": "distance d ≈ 6 m; estimated speed v ≈ 2 m/s",
      "equationHint": "t = d / v"
    },
    {
      "id": "d1-b10",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "THEME COMMIT — sketch your team's car concept (silhouette, colors, signature feature), then log your reasoning in the boxes below. A stranger should be able to recognize your theme from the sketch alone.",
      "fields": [
        "My theme is…",
        "It fits the project because…",
        "My first build worry is…"
      ],
      "grid": true
    },
    {
      "id": "d1-b11",
      "type": "sentence_frame",
      "frame": "Our team's theme is ___ . It fits a fast, straight-rolling race car because ___ . The part of the build I am most worried about is ___ because ___ .",
      "wordBank": [
        "theme",
        "fast",
        "straight",
        "alignment",
        "weight",
        "decoration",
        "wiring",
        "wheels"
      ]
    },
    {
      "id": "d1-b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Exit ticket: In one or two sentences, name your team theme AND the single biggest physical challenge you expect to face building it.",
      "frame": "Our theme is ___ ; the biggest challenge we expect is ___ ."
    },
    {
      "id": "d1-b13",
      "type": "marzano",
      "capture": true,
      "targetId": "968fcf25-cde2-4e32-8dc6-6d3931aa2488"
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d01';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "d2-b1",
      "type": "callout",
      "variant": "warning",
      "title": "Safety beat — the soldering iron",
      "markdown": "**60 seconds before anything else.** The soldering iron tip runs around **350-400 degrees C** — hot enough to burn you instantly, and it *looks* the same cold or hot.\n\n- The iron **lives in its stand**, always. Never set it on the bench.\n- **Eye protection on** before you melt solder — it can spit.\n- Solder fumes go **up and away** — don't lean over your joint; let the fan pull them.\n- Heat the **joint**, not the solder. Touch solder to the hot metal, not to the tip.\n- Hot iron, hot work, hot bench — assume everything near the station is hot until proven cool."
    },
    {
      "id": "d2-b2",
      "type": "target",
      "statement": "I can name the four DC components and describe what each one does in the loop.",
      "targetId": "K1"
    },
    {
      "id": "d2-b3",
      "type": "target",
      "statement": "I can trace the energy chain from battery to motion: chemical to electrical to mechanical.",
      "targetId": "K2"
    },
    {
      "id": "d2-b4",
      "type": "target",
      "statement": "I can build a working series circuit in PhET (battery, switch, motor) and predict what happens when I change the loop.",
      "targetId": "S1"
    },
    {
      "id": "d2-b5",
      "type": "target",
      "statement": "I can produce a clean scrap solder joint that is shiny, tight, and compact.",
      "targetId": "S2"
    },
    {
      "id": "d2-b6",
      "type": "prose",
      "markdown": "### Today: simulate it, then practice the iron\n\nFirst we build the car's circuit **in PhET** where mistakes cost nothing. We open switches, double voltages, and break wires on purpose — then watch what current does. Once the model lives in your head, we move to the iron and practice the joint that will hold your real circuit together.\n\nThe move to make habitual today: **\"What did I predict? What actually happened?\"** Say it out loud every time you power the loop. It pays off on race day."
    },
    {
      "id": "d2-b7",
      "type": "diagram",
      "kind": "circuit",
      "title": "The car's series loop",
      "caption": "One single loop: the battery pushes current, the switch gates it, the motor spins. Break the loop anywhere and the motor stops.",
      "components": [
        {
          "kind": "battery",
          "side": "top",
          "label": "battery"
        },
        {
          "kind": "switch",
          "side": "right",
          "label": "switch"
        },
        {
          "kind": "motor",
          "side": "bottom",
          "label": "motor"
        }
      ]
    },
    {
      "id": "d2-b8",
      "type": "vocab",
      "terms": [
        {
          "term": "Circuit",
          "definition": "A complete, closed loop that lets current flow from the battery and back.",
          "cognate": "circuito"
        },
        {
          "term": "Series",
          "definition": "Components wired one after another in a single loop; break it anywhere and current stops everywhere.",
          "cognate": "en serie"
        },
        {
          "term": "Current",
          "definition": "The flow of charge around the closed loop that makes the motor turn.",
          "cognate": "corriente"
        },
        {
          "term": "Switch",
          "definition": "The gate that opens (stops current) or closes (allows current) the loop.",
          "cognate": "interruptor"
        },
        {
          "term": "Motor",
          "definition": "The load — converts electrical energy into spinning, rotational motion.",
          "cognate": "motor"
        },
        {
          "term": "Solder",
          "definition": "A metal alloy melted to bond two conductors into one electrical and mechanical joint.",
          "cognate": "soldadura"
        }
      ]
    },
    {
      "id": "d2-b9",
      "type": "lesson_vocab"
    },
    {
      "id": "d2-b10",
      "type": "sim_embed",
      "simulationSlug": "circuit-construction-kit-dc"
    },
    {
      "id": "d2-b11",
      "type": "gewa",
      "capture": true,
      "prompt": "In PhET, build the loop: battery, switch, motor (use a bulb as the motor stand-in). Close the switch and power it. Now trace the current path with your finger and explain in words what the switch does when it is OPEN versus CLOSED.",
      "givenHint": "Describe the single closed loop and where the switch sits in it.",
      "equationHint": "No equation needed — explain in terms of a complete vs. broken loop and whether current can flow."
    },
    {
      "id": "d2-b12",
      "type": "gewa",
      "capture": true,
      "prompt": "Probe the model. (a) Open the switch — what happens to the motor and why? (b) Double the battery voltage — what happens to the current and the motor's speed? Record what you PREDICTED and what actually HAPPENED for each.",
      "givenHint": "Note your prediction first, then the observation, for each change.",
      "equationHint": "Reason from: more push (voltage) in the same loop means more current means a faster motor; an open switch means a broken loop means no current."
    },
    {
      "id": "d2-b13",
      "type": "gewa",
      "capture": true,
      "prompt": "The motor only spins when the circuit is COMPLETE. A solder joint on the real car cracks and goes open. What happens to the current, and why does this make the case for a clean, tight solder joint?",
      "givenHint": "Treat the cracked joint as a break in the single series loop.",
      "equationHint": "Connect: open loop means no current path means motor stops. A weak joint is an open waiting to happen."
    },
    {
      "id": "d2-b14",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "Battery to motion: the energy chain",
      "caption": "The battery's stored chemical energy becomes electrical energy in the loop, which the motor converts to mechanical (spinning) motion.",
      "links": [
        {
          "label": "Chemical",
          "sublabel": "stored in the battery",
          "color": "var(--primary)"
        },
        {
          "label": "Electrical",
          "sublabel": "current in the loop",
          "color": "var(--reward)"
        },
        {
          "label": "Mechanical",
          "sublabel": "the motor spins",
          "color": "var(--success)"
        }
      ]
    },
    {
      "id": "d2-b15",
      "type": "worked_example",
      "prompt": "A pod's circuit uses a 3 V battery and the motor draws current through a loop with about 6 ohms of total resistance. Estimate the current in the loop.",
      "given": "V = 3 V (battery), R = 6 ohms (total loop resistance, motor + wires)",
      "equation": "Ohm's law: $I = \\dfrac{V}{R}$",
      "work": "$I = \\dfrac{3\\,\\text{V}}{6\\,\\Omega} = 0.5\\,\\text{A}$",
      "answer": "$I = 0.5\\,\\text{A}$ — and because it is a series loop, that same 0.5 A flows through every component. Double the voltage to 6 V and the current doubles to 1 A."
    },
    {
      "id": "d2-b16",
      "type": "callout",
      "variant": "tip",
      "title": "Key idea — one loop, one current",
      "markdown": "In a **series** circuit there is exactly **one path**. The **same current** flows through the battery, the switch, and the motor. That is why a single broken joint — a cracked solder bead, an open switch — stops **everything**. Build every joint as if the whole car depends on it, because it does."
    },
    {
      "id": "d2-b17",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "Sketch your circuit and log the build. Draw arrows ON TOP of the loop below to show the direction current flows when the switch is closed, then fill in the boxes.",
      "fields": [
        "What I built (components in order around the loop)",
        "Current direction + what the switch does",
        "What I observed when I opened the switch / changed the voltage"
      ],
      "backgroundDiagram": {
        "kind": "circuit",
        "components": [
          {
            "kind": "battery",
            "side": "top",
            "label": "battery"
          },
          {
            "kind": "switch",
            "side": "right",
            "label": "switch"
          },
          {
            "kind": "motor",
            "side": "bottom",
            "label": "motor"
          }
        ]
      }
    },
    {
      "id": "d2-b18",
      "type": "callout",
      "variant": "note",
      "title": "Scrap solder practice — turn in two joints",
      "markdown": "Now the iron. On **scrap wire** (not your car), make **two practice joints**. Aim for the three S's:\n\n- **Shiny** — a good joint looks bright and smooth, not dull/grey/lumpy (that's a cold joint).\n- **Tight** — the wires don't wiggle; the solder wicked into the strands.\n- **Compact** — a small, clean bead, not a blob.\n\nHeat the joint, feed solder to the joint, remove solder, then remove iron — and hold still while it cools. Teacher inspects each one. **Finished early?** Solder a third joint with stranded wire (harder)."
    },
    {
      "id": "d2-b19",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "In your own words, sketch or describe the four-link energy chain that drives the car, from the battery to the wheels turning.",
      "frame": "The battery stores ___ energy, which becomes ___ in the loop, which the motor turns into ___ motion."
    },
    {
      "id": "d2-b20",
      "type": "marzano",
      "capture": true,
      "targetId": "108b06c3-58ce-43e7-aa42-93841e1e1dc2"
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d02';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "STANDARD",
  "blocks": [
    {
      "id": "d3-b1",
      "type": "target",
      "statement": "K3 — I can explain how a gear pair trades RPM for torque, and predict whether the axle spins faster/slower and pushes harder/weaker than the motor.",
      "targetId": "u8-k3"
    },
    {
      "id": "d3-b2",
      "type": "target",
      "statement": "R1 — I can use ratio reasoning to predict how changing wheel diameter changes top speed and starting effort.",
      "targetId": "u8-r1"
    },
    {
      "id": "d3-b3",
      "type": "target",
      "statement": "R2 — I can justify our team's wheel choice with numbers (gear ratio + circumference), not just a guess.",
      "targetId": "u8-r2"
    },
    {
      "id": "d3-b4",
      "type": "callout",
      "variant": "tip",
      "title": "The big idea today",
      "markdown": "**The motor only spins. Gears change _how_.** A motor gives you one thing: rotations per minute. Gears decide whether those rotations come out *fast and weak* or *slow and strong*. Today you pick the wheel that turns your gear ratio into the speed you want."
    },
    {
      "id": "d3-b5",
      "type": "callout",
      "variant": "warning",
      "title": "Safety beat (30 seconds)",
      "markdown": "Tomorrow we cut chassis and use the **hot glue guns**. Tip dries clear but burns — never touch the metal tip, and lay the gun on its stand, not the table. Listen for the full briefing at the start of Day 4."
    },
    {
      "id": "d3-b6",
      "type": "vocab",
      "terms": [
        {
          "term": "RPM",
          "definition": "Rotations per minute — how fast a shaft spins.",
          "cognate": "RPM (revoluciones por minuto)"
        },
        {
          "term": "Gear ratio",
          "definition": "Driven teeth ÷ driving teeth. Tells you how RPM and torque are traded.",
          "cognate": "relación de engranajes"
        },
        {
          "term": "Torque",
          "definition": "Twisting/pushing force a turning shaft delivers.",
          "cognate": "torque / par"
        },
        {
          "term": "Circumference",
          "definition": "Distance around the wheel; how far the car rolls in one turn. C = π·d.",
          "cognate": "circunferencia"
        },
        {
          "term": "Mechanical advantage",
          "definition": "Trading speed for force (or force for speed) with gears or wheels.",
          "cognate": "ventaja mecánica"
        }
      ]
    },
    {
      "id": "d3-b7",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "Where the spin comes from — and where the gears sit",
      "caption": "The battery's chemical energy becomes electrical, the motor turns it into a fast spin, the gear pair trades that spin for torque at the axle, and the wheel turns it into distance on the floor.",
      "links": [
        {
          "label": "Battery",
          "sublabel": "chemical",
          "color": "var(--primary)"
        },
        {
          "label": "Wires",
          "sublabel": "electrical"
        },
        {
          "label": "Motor",
          "sublabel": "fast spin (high RPM)"
        },
        {
          "label": "Gear pair",
          "sublabel": "10T → 20T: trades RPM for torque",
          "color": "var(--reward)"
        },
        {
          "label": "Wheel",
          "sublabel": "C = π·d → distance",
          "color": "var(--success)"
        }
      ]
    },
    {
      "id": "d3-b8",
      "type": "prose",
      "markdown": "### The gear-pair rule\n\nThe small gear on the **motor** is the **driving** gear. The big gear on the **axle** is the **driven** gear.\n\n$$\\text{gear ratio} = \\frac{\\text{driven teeth}}{\\text{driving teeth}}$$\n\nWhen the driven gear has **more** teeth than the driving gear:\n\n- The axle spins **slower** (RPM goes _down_ by the ratio).\n- The axle pushes **harder** (torque goes _up_ by the ratio).\n\nA $2{:}1$ ratio means: half the RPM, double the torque."
    },
    {
      "id": "d3-b9",
      "type": "worked_example",
      "prompt": "A 10-tooth gear on the motor drives a 20-tooth gear on the axle. The motor spins at 6000 RPM. Find the gear ratio, the axle RPM, and what happens to torque.",
      "given": "Driving (motor) gear = 10 teeth; Driven (axle) gear = 20 teeth; Motor speed = 6000 RPM.",
      "equation": "$\\text{gear ratio} = \\dfrac{\\text{driven teeth}}{\\text{driving teeth}}$, and $\\text{axle RPM} = \\dfrac{\\text{motor RPM}}{\\text{ratio}}$.",
      "work": "$\\text{ratio} = \\dfrac{20}{10} = 2 \\;(2{:}1)$.  $\\;$ $\\text{axle RPM} = \\dfrac{6000}{2} = 3000\\ \\text{RPM}$.  $\\;$ Torque is traded the opposite way, so torque is multiplied by 2.",
      "answer": "Gear ratio = **2:1**. Axle spins at **3000 RPM** (half the motor). Torque at the axle is **doubled** — slower but stronger. **The motor only spins; the gears chose slow-and-strong.**"
    },
    {
      "id": "d3-b10",
      "type": "worked_example",
      "prompt": "Your team is looking at a wheel that measures 60 mm across (diameter). How far does the car roll in one full turn of that wheel?",
      "given": "Wheel diameter d = 60 mm; one full rotation; π ≈ 3.14.",
      "equation": "$C = \\pi \\cdot d$",
      "work": "$C = 3.14 \\times 60\\ \\text{mm} = 188.4\\ \\text{mm}$.",
      "answer": "Circumference ≈ **188 mm per turn** (about 0.19 m). Each axle rotation rolls the car ~188 mm forward — that's the link from RPM to real distance."
    },
    {
      "id": "d3-b11",
      "type": "callout",
      "variant": "note",
      "title": "Ratio reasoning rule (write this down)",
      "markdown": "At the **same axle RPM**, **doubling the wheel diameter doubles top speed** — *and* **doubles the starting effort** the motor needs to get rolling. Big wheels = faster top end, harder launch. Small wheels = snappier start, lower top speed. There is no free lunch; you are choosing a trade-off."
    },
    {
      "id": "d3-b12",
      "type": "gewa",
      "capture": true,
      "prompt": "Your motor gear has 10 teeth and your axle gear has 20 teeth. Find the gear ratio, then state in words what happens to the axle's RPM and torque compared to the motor.",
      "givenHint": "List the driving (motor) teeth and the driven (axle) teeth.",
      "equationHint": "gear ratio = driven teeth ÷ driving teeth",
      "equationOptions": [
        "ratio = driven ÷ driving",
        "C = π·d",
        "axle RPM = motor RPM ÷ ratio",
        "torque ∝ ratio"
      ]
    },
    {
      "id": "d3-b13",
      "type": "gewa",
      "capture": true,
      "prompt": "Pick one of the candidate wheels at the front and measure its diameter in mm. Compute its circumference — the distance the car rolls in one axle turn.",
      "givenHint": "Measure the wheel diameter d with a ruler (in mm).",
      "equationHint": "C = π·d",
      "equationOptions": [
        "C = π·d",
        "C = 2·π·r",
        "ratio = driven ÷ driving"
      ]
    },
    {
      "id": "d3-b14",
      "type": "gewa",
      "capture": true,
      "prompt": "Your team chose a wheel. A rival team chose a wheel with HALF your diameter, and both cars use the same gear ratio and motor. Predict how your top speed compares to theirs, and how your starting effort compares — and explain why using the ratio reasoning rule.",
      "givenHint": "Your wheel diameter vs. the rival's (half of yours); same axle RPM for both.",
      "equationHint": "C = π·d  (and: top speed scales with diameter)",
      "equationOptions": [
        "C = π·d",
        "top speed ∝ diameter",
        "starting effort ∝ diameter",
        "ratio = driven ÷ driving"
      ]
    },
    {
      "id": "d3-b15",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Wheel",
        "Diameter (mm)",
        "Circumference (mm)",
        "Predicted speed (vs smallest)"
      ],
      "rows": 4,
      "plot": true,
      "xCol": 1,
      "yCol": 2,
      "patternPrompt": "As diameter goes up, what happens to circumference — and what does that tell you about top speed?"
    },
    {
      "id": "d3-b16",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "Sketch your gear pair (motor gear → axle gear) and your chosen wheel. Label the teeth, the ratio, and the wheel diameter. Then log WHY you committed to this wheel.",
      "fields": [
        "Our gear ratio (driven ÷ driving) and what it does to RPM/torque",
        "We chose ___-mm wheels because ___",
        "We predict our top speed will be ___ relative to a team that chose ___ because ___"
      ],
      "grid": true,
      "backgroundDiagram": {
        "kind": "energy_chain",
        "links": [
          {
            "label": "Motor",
            "sublabel": "10T driving"
          },
          {
            "label": "Axle",
            "sublabel": "20T driven"
          },
          {
            "label": "Wheel",
            "sublabel": "C = π·d"
          }
        ]
      }
    },
    {
      "id": "d3-b17",
      "type": "sentence_frame",
      "frame": "We chose ____-mm wheels because ____. We predict our top speed will be ____ relative to a team that chose ____-mm wheels, because ____.",
      "wordBank": [
        "faster",
        "slower",
        "larger diameter",
        "smaller diameter",
        "more torque",
        "harder to start",
        "snappier launch",
        "circumference"
      ]
    },
    {
      "id": "d3-b18",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "In one or two sentences: what is the trade-off between choosing a big wheel and a small wheel, and which side of that trade-off did your team pick?",
      "frame": "A bigger wheel gives more ____ but costs more ____, so we picked ____ because ____."
    },
    {
      "id": "d3-b19",
      "type": "marzano",
      "capture": true,
      "targetId": "3eda5c97-f3a6-45a3-b911-0ab5680ac7fc"
    },
    {
      "id": "d3-b20",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "3eda5c97-f3a6-45a3-b911-0ab5680ac7fc",
        "6964687c-fb59-44b0-a39a-d870f0d4843a",
        "a0da8983-b50b-4222-9f1d-11352c1f2cf4"
      ]
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d03';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "d4-b1",
      "type": "target",
      "statement": "S4 — I can cut my balsa chassis to spec and mark a SINGLE straight pencil axle line, so my axles can sit parallel and the car rolls straight.",
      "targetId": "u8-s4"
    },
    {
      "id": "d4-b2",
      "type": "callout",
      "variant": "warning",
      "title": "Safety beat — read before you touch a knife (60 seconds)",
      "markdown": "We are cutting balsa with **X-acto knives** on cutting mats today.\n\n- **Cut away from your hand**, never toward your fingers or your body.\n- Keep your **non-cutting hand behind the blade**, never in front of it.\n- One pass, light pressure — let the blade do the work. Forcing it makes it skip.\n- **Mask on** for the dust. Cap the knife the second you set it down.\n\nTomorrow we add **hot glue** — same calm hands, full briefing on Day 5."
    },
    {
      "id": "d4-b3",
      "type": "callout",
      "variant": "tip",
      "title": "The big idea today",
      "markdown": "**Day 5 depends on Day 4.** If your two axle marks aren't on one straight line today, your axles can't be parallel tomorrow — and a car with non-parallel axles *cannot* roll straight on Day 6. Measure twice, mark once, in pencil, before you cut anything."
    },
    {
      "id": "d4-b4",
      "type": "vocab",
      "terms": [
        {
          "term": "Chassis",
          "definition": "The flat balsa base that everything else mounts to — the frame of your car.",
          "cognate": "chasis"
        },
        {
          "term": "Wheelbase",
          "definition": "The straight-line distance from the front axle to the rear axle.",
          "cognate": "distancia entre ejes"
        },
        {
          "term": "Axle line",
          "definition": "A single straight pencil line drawn across the chassis where an axle will sit; both wheels of a pair share it.",
          "cognate": "línea del eje"
        },
        {
          "term": "Symmetry",
          "definition": "Both sides matching — equal margins left/right and a centered wheelbase so the car tracks straight.",
          "cognate": "simetría"
        }
      ]
    },
    {
      "id": "d4-b5",
      "type": "prose",
      "markdown": "### Build step 1 — confirm before you cut\n\nBefore the knife comes out, lock in two decisions:\n\n1. **Theme confirmed** — what your car is going to *be*. Sketch the finish on the chassis underside if you're ahead.\n2. **Wheel set confirmed** — pull your wheels from the kit and measure them. The wheel diameter you chose on Day 3 sets how much chassis margin you need so the wheels don't rub.\n\nThen plan the chassis on paper: overall **length**, the **front axle line**, and the **rear axle line** — all in pencil first."
    },
    {
      "id": "d4-b6",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "Where the axle line fits in the build",
      "caption": "Today is the chassis + axle-line step. Everything downstream — parallel axles, straight rolling, the final run — rides on getting this one straight pencil line right.",
      "links": [
        {
          "label": "Chassis cut",
          "sublabel": "to length (Day 4)",
          "color": "var(--primary)"
        },
        {
          "label": "Axle line",
          "sublabel": "one straight pencil mark",
          "color": "var(--reward)"
        },
        {
          "label": "Axles mounted",
          "sublabel": "parallel (Day 5)"
        },
        {
          "label": "Rolls straight",
          "sublabel": "the run (Day 6)",
          "color": "var(--success)"
        }
      ]
    },
    {
      "id": "d4-b7",
      "type": "prose",
      "markdown": "### Build step 2 — center the wheelbase\n\nTo place two axle lines so the **wheelbase is centered** on the chassis:\n\n$$\\text{front margin} = \\frac{\\text{chassis length} - \\text{wheelbase}}{2}$$\n\nThat leftover length splits **evenly** between the front and the back. Equal margins front-and-back is symmetry along the car; equal margins left-and-right keeps each axle line crossing square. Mark from the **same ruler edge every time** so small errors don't pile up."
    },
    {
      "id": "d4-b8",
      "type": "worked_example",
      "prompt": "Your chassis is 18 cm long and you want a 12 cm wheelbase, centered. Where do you draw the front and rear axle lines, measured from the front edge?",
      "given": "Chassis length L = 18 cm; wheelbase W = 12 cm; centered (equal margins front and back).",
      "equation": "$\\text{front margin} = \\dfrac{L - W}{2}$, then $\\text{rear axle} = \\text{front margin} + W$.",
      "work": "$\\text{front margin} = \\dfrac{18 - 12}{2} = \\dfrac{6}{2} = 3\\ \\text{cm}$.  $\\;$ Front axle line at $3\\ \\text{cm}$. Rear axle line at $3 + 12 = 15\\ \\text{cm}$. Check: rear margin $= 18 - 15 = 3\\ \\text{cm}$ ✓ (matches the front).",
      "answer": "Draw the **front axle line at 3 cm** and the **rear axle line at 15 cm** from the front edge. Equal 3 cm margins front and back = **centered wheelbase**. Each line goes straight across, square to the long edge."
    },
    {
      "id": "d4-b9",
      "type": "callout",
      "variant": "note",
      "title": "Square-across rule (write this down)",
      "markdown": "An axle line must be **one straight line all the way across**, at a **right angle (90°)** to the long edge of the chassis. Mark the same distance from the front edge on **both sides**, then connect the two dots with a ruler. Two separate squiggles = two non-parallel axles = a car that pulls to one side."
    },
    {
      "id": "d4-b10",
      "type": "gewa",
      "capture": true,
      "prompt": "Measure your actual chassis length with a ruler. You want your wheelbase centered. Find the front margin and state where to draw the front axle line (distance from the front edge).",
      "givenHint": "Measure chassis length L (cm) and decide your wheelbase W (cm).",
      "equationHint": "front margin = (L − W) ÷ 2",
      "equationOptions": [
        "front margin = (L − W) ÷ 2",
        "rear axle = front margin + W",
        "C = π·d",
        "symmetry: left margin = right margin"
      ]
    },
    {
      "id": "d4-b11",
      "type": "gewa",
      "capture": true,
      "prompt": "Using your front margin from the last problem, find where the REAR axle line goes (distance from the front edge), then verify the rear margin equals the front margin so the wheelbase is truly centered.",
      "givenHint": "Use your chassis length L, wheelbase W, and the front margin you just computed.",
      "equationHint": "rear axle = front margin + W;  check: rear margin = L − rear axle",
      "equationOptions": [
        "rear axle = front margin + W",
        "rear margin = L − rear axle",
        "front margin = (L − W) ÷ 2",
        "centered ⇔ front margin = rear margin"
      ]
    },
    {
      "id": "d4-b12",
      "type": "gewa",
      "capture": true,
      "prompt": "Symmetry check for ONE axle line: your chassis is 5.0 cm wide and the axle should sit centered across it. If you mark a dot 1.2 cm in from the LEFT edge, how far in from the RIGHT edge must the matching dot be so the line crosses square and centered? Is your 1.2 cm dot correct?",
      "givenHint": "Chassis width = 5.0 cm; left dot at 1.2 cm from the left edge.",
      "equationHint": "right distance = width − left distance;  centered ⇔ left distance = right distance",
      "equationOptions": [
        "right distance = width − left distance",
        "centered ⇔ left distance = right distance",
        "front margin = (L − W) ÷ 2"
      ]
    },
    {
      "id": "d4-b13",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "Build step 3 — make your chassis plan. On the graph paper, sketch your chassis from the top: draw the outline to your measured length and width, then draw BOTH axle lines as single straight lines across (label which is front/rear). Mark where the motor and battery will sit. Then log your measurements below.",
      "fields": [
        "Chassis length × width (cm) I measured / marked",
        "Wheelbase (cm) and my front-axle and rear-axle distances from the front edge",
        "Front margin and rear margin — do they match? (centered? show the numbers)",
        "Planned motor position and battery position (and why there — balance/clearance)",
        "Eye-level check: is each axle line ONE straight line, square to the edge? What I fixed."
      ],
      "grid": true
    },
    {
      "id": "d4-b14",
      "type": "sentence_frame",
      "frame": "My chassis is ____ cm long. To center a ____ cm wheelbase I drew the front axle line at ____ cm and the rear axle line at ____ cm, leaving equal ____ cm margins, because ____.",
      "wordBank": [
        "front margin",
        "rear margin",
        "centered",
        "wheelbase",
        "symmetry",
        "square across",
        "one straight line",
        "parallel axles"
      ]
    },
    {
      "id": "d4-b15",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Hold your chassis at eye level and look down the two axle lines. In one or two sentences: why does it matter that each axle line is ONE straight line, and what would go wrong tomorrow and on race day if they weren't?",
      "frame": "Each axle line must be ____ because ____. If they weren't, then on Day 5 ____ and on Day 6 the car would ____."
    },
    {
      "id": "d4-b16",
      "type": "marzano",
      "capture": true,
      "targetId": "2728d6f0-199b-4751-8591-c285abed5e6a"
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d04';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "d5-b1",
      "type": "target",
      "statement": "K4 — I can explain that a car veers because of friction asymmetry: when one side's wheels drag more than the other, that unequal friction makes a turning effect (torque) about a vertical axis through the car.",
      "targetId": "u8-k4"
    },
    {
      "id": "d5-b2",
      "type": "target",
      "statement": "S4 — I can install axles parallel and aligned so the car rolls straight ≥ 3 m unpowered.",
      "targetId": "u8-s4"
    },
    {
      "id": "d5-b3",
      "type": "callout",
      "variant": "warning",
      "title": "Safety beat (60 seconds)",
      "markdown": "**Hot glue today.** The tip dries clear but it *burns* — never touch the metal tip, and lay the gun back on its stand, not the table. Glue the axle holders, then keep hands clear while it sets. One person glues at a time per team."
    },
    {
      "id": "d5-b4",
      "type": "callout",
      "variant": "tip",
      "title": "The big idea today: a straight car is a GEOMETRY problem, not a power problem",
      "markdown": "Your car can have a perfect motor and still lose the race by veering into the wall. **Why does a car veer?** Because the wheels on one side drag (rub) more than the wheels on the other side. That unequal friction is like pushing harder on one side of a shopping cart — it makes the whole car *turn*. Today you install the axles **parallel** so both sides have equal friction and the car tracks straight."
    },
    {
      "id": "d5-b5",
      "type": "lesson_vocab"
    },
    {
      "id": "d5-b6",
      "type": "vocab",
      "terms": [
        {
          "term": "Axle",
          "definition": "The rod that the wheels are pressed onto; it spins in the axle holders.",
          "cognate": "eje"
        },
        {
          "term": "Alignment",
          "definition": "Whether the two axles are parallel and square to the chassis so the car rolls straight.",
          "cognate": "alineación"
        },
        {
          "term": "Friction",
          "definition": "The rubbing force that resists a wheel's motion; more drag on one side slows that side.",
          "cognate": "fricción"
        },
        {
          "term": "Veer",
          "definition": "To drift off a straight line to one side as the car rolls.",
          "cognate": "desviarse"
        },
        {
          "term": "Torque",
          "definition": "A turning effect. Unequal side-to-side friction produces a torque about a vertical axis, swinging the nose toward the higher-friction side.",
          "cognate": "torque / par"
        }
      ]
    },
    {
      "id": "d5-b7",
      "type": "diagram",
      "kind": "friction_asymmetry",
      "title": "Why a car veers — unequal wheel friction makes it turn",
      "caption": "Top-down view. The right wheels drag MORE than the left (longer friction arrow on the right). The slow side acts like a pivot, so the nose swings toward the higher-friction side — the car veers RIGHT. Equal arrows on both sides = no turning effect = straight roll.",
      "genPrompt": "Top-down sketch of a four-wheel car. Friction arrows at the left and right wheel pairs point backward (opposing motion). Right friction is larger than left, producing a vertical-axis torque that veers the car to the right.",
      "leftMag": 3,
      "rightMag": 7,
      "veerDir": "right"
    },
    {
      "id": "d5-b8",
      "type": "prose",
      "markdown": "### The veer rule\n\nFriction at each wheel points **backward** — it opposes the car's roll. If both sides have the *same* drag, the two backward forces are balanced and the car rolls **straight**.\n\nBut if one side drags more, that side is like a slower wheel on a shopping cart. The car **pivots toward the higher-friction side**:\n\n$$\\text{nose veers toward the side with } \\textbf{more}\\text{ friction}$$\n\nThis is a **torque about a vertical axis** through the middle of the car. The bigger the difference in friction, *and* the wider the car, the stronger the turning effect. Fix it by making the axles **parallel** and the wheels spin **equally freely** on both sides."
    },
    {
      "id": "d5-b9",
      "type": "callout",
      "variant": "note",
      "title": "Build steps 4–9 (do these in order)",
      "markdown": "**4.** Hot-glue the pen-tube **axle holders** onto the chassis, centered on your Day-4 alignment line. **5.** Drill the **3/16\" holes** along that line — both holders must line up. **6.** Slide the **axles** through. **7.** Press-fit the **wheels** so they sit flush and spin freely. **8.** Mount the **20T axle gear**, offset slightly to leave room for the motor mesh tomorrow. **9.** **Roll test #1** — push the car gently down the corridor and watch which way it drifts."
    },
    {
      "id": "d5-b10",
      "type": "worked_example",
      "prompt": "Estimate the veer. A team pushes their car down a 4.0 m corridor and it drifts 8 cm to the right. About how far would it drift over a full 12 m race run if nothing is fixed? Which side has more friction?",
      "given": "Drift over test run = 8 cm to the right; test distance = 4.0 m; race distance = 12 m; veer is proportional to distance (drift ∝ distance).",
      "equation": "$\\dfrac{\\text{drift}_{\\text{race}}}{\\text{distance}_{\\text{race}}} = \\dfrac{\\text{drift}_{\\text{test}}}{\\text{distance}_{\\text{test}}}$",
      "work": "Rate of drift $= \\dfrac{8\\ \\text{cm}}{4.0\\ \\text{m}} = 2\\ \\text{cm per m}$.  Over 12 m: $\\;2\\ \\tfrac{\\text{cm}}{\\text{m}} \\times 12\\ \\text{m} = 24\\ \\text{cm}$. The nose swings toward the higher-friction side, and it veered RIGHT — so the **right** wheels are dragging more.",
      "answer": "About **24 cm of drift** over a 12 m run — that's into the wall. The **right side has more friction** (the car veers toward the side that drags more). Fix: free up the right wheels / re-align that axle until both sides spin equally."
    },
    {
      "id": "d5-b11",
      "type": "gewa",
      "capture": true,
      "prompt": "If the RIGHT wheels drag more than the left wheels, which way does the car veer — and why? Explain the cause using friction and the turning effect (torque), not just the answer.",
      "givenHint": "State which side has more friction (drag) and that friction points backward, opposing the roll.",
      "equationHint": "Nose veers toward the side with MORE friction (unequal friction → vertical-axis torque).",
      "equationOptions": [
        "nose veers toward the higher-friction side",
        "friction opposes motion",
        "torque about a vertical axis",
        "balanced friction → straight roll"
      ]
    },
    {
      "id": "d5-b12",
      "type": "gewa",
      "capture": true,
      "prompt": "Your car drifted 8 cm to the right over a 4 m roll test. (a) Which side is dragging more? (b) Describe the alignment fix you would make to your axles/wheels so the next roll test tracks straight.",
      "givenHint": "Drift = 8 cm right over 4 m; the car veers toward the side with more friction.",
      "equationHint": "drift ∝ distance; nose veers toward higher-friction side → reduce that side's drag / re-square the axle.",
      "equationOptions": [
        "nose veers toward the higher-friction side",
        "drift ∝ distance",
        "make axles parallel",
        "equal friction → straight"
      ]
    },
    {
      "id": "d5-b13",
      "type": "gewa",
      "capture": true,
      "prompt": "Proportional reasoning: a car drifts 3 cm over a 2 m roll test. At that same rate, how many cm will it drift over a full 10 m run? Show the rate, then scale it.",
      "givenHint": "Drift = 3 cm over 2 m; assume the drift rate stays constant (drift ∝ distance).",
      "equationHint": "drift rate = drift ÷ distance; then drift = rate × new distance",
      "equationOptions": [
        "drift = rate × distance",
        "rate = drift ÷ distance",
        "drift ∝ distance"
      ]
    },
    {
      "id": "d5-b14",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "Run your roll test. On the top-down diagram, ANNOTATE the friction arrows at your left and right wheel pairs (make the side that dragged more a longer arrow) and draw your PREDICTED veer direction. Then log what actually happened and your fix.",
      "fields": [
        "Which way it veered (left / right / straight)",
        "Likely cause — which side dragged more and why (loose wheel, bent axle, not parallel...)",
        "My fix — exactly what I'll adjust before the next roll test",
        "Roll test #2 result: distance before it veered, and what changed"
      ],
      "grid": false,
      "backgroundDiagram": {
        "kind": "friction_asymmetry",
        "title": "Annotate your car's friction + veer",
        "caption": "Draw your friction arrows (longer = more drag) and your predicted veer direction.",
        "leftMag": 3,
        "rightMag": 7,
        "veerDir": "right"
      }
    },
    {
      "id": "d5-b15",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Roll test #",
        "Distance before veer (m)",
        "Veer direction",
        "What we changed"
      ],
      "rows": 4,
      "plot": false,
      "patternPrompt": "As you fixed the alignment across roll tests, what happened to the distance before the car veered?"
    },
    {
      "id": "d5-b16",
      "type": "sentence_frame",
      "frame": "Our car veered to the ____ because the ____ wheels had more ____. To fix it we will ____ so both sides have equal friction and the car rolls straight.",
      "wordBank": [
        "left",
        "right",
        "friction",
        "drag",
        "make the axles parallel",
        "re-square the axle",
        "free up the wheel",
        "re-glue the holder"
      ]
    },
    {
      "id": "d5-b17",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "In one or two sentences: a teammate says 'our car veers because the motor is weak.' Correct them — what is the real cause of a veer, and what fixes it?",
      "frame": "A veer is not a power problem; it is caused by ____, which makes a ____ about a vertical axis. We fix it by ____."
    },
    {
      "id": "d5-b18",
      "type": "marzano",
      "capture": true,
      "targetId": "1c6e1fcc-63e2-40fc-9093-20352f02f3d6"
    },
    {
      "id": "d5-b19",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "1c6e1fcc-63e2-40fc-9093-20352f02f3d6",
        "2728d6f0-199b-4751-8591-c285abed5e6a"
      ]
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d05';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "d6-b1",
      "type": "target",
      "statement": "S5 — I can install the gears, motor, switch, and battery in a series loop and power the car on safely without breaking the chassis.",
      "targetId": "u8-s5"
    },
    {
      "id": "d6-b2",
      "type": "target",
      "statement": "S6 — I can measure my car's wheel/axle RPM from a timed run, then use the gear ratio and wheel circumference to PREDICT and CHECK the car's speed.",
      "targetId": "u8-s6"
    },
    {
      "id": "d6-b3",
      "type": "callout",
      "variant": "warning",
      "title": "Safety beat (60 seconds) — drill + first power-on",
      "markdown": "**Two hazards today.** (1) **The drill** for the switch hole: put a **wood block UNDER the chassis** so the bit exits into wood, not your hand or the table — *chassis-break watch*. Keep fingers clear of the bit; clamp or hold the chassis firmly. (2) **First power-on:** keep fingers, hair, and loose sleeves away from the **spinning gears and wheels**. Power on for a *short tap* first to check direction — never run it on the bench with the wheels jammed. Disconnect the battery when you stop building."
    },
    {
      "id": "d6-b4",
      "type": "callout",
      "variant": "tip",
      "title": "The big idea today: from spin to speed",
      "markdown": "Your motor spins fast but weak; the **gear reduction** trades that fast spin for a slower, stronger axle spin. Today you finally **measure** how fast the axle turns (its **RPM**) and turn that number into a real **speed** in meters per second. The chain is simple: **how fast the wheel turns** × **how far it rolls per turn (the circumference)** = **how fast the car moves**. Then you compare that to your Day-3 *prediction* — does the math match the floor?"
    },
    {
      "id": "d6-b5",
      "type": "lesson_vocab"
    },
    {
      "id": "d6-b6",
      "type": "vocab",
      "terms": [
        {
          "term": "RPM (revolutions per minute)",
          "definition": "How many full turns something makes in one minute. Motor RPM is fast; the reduced wheel/axle RPM is slower but stronger.",
          "cognate": "RPM / revoluciones por minuto"
        },
        {
          "term": "rev/s (revolutions per second)",
          "definition": "Turns per second. Convert from RPM by dividing by 60: rev/s = RPM ÷ 60.",
          "cognate": "rev/s / revoluciones por segundo"
        },
        {
          "term": "Gear ratio",
          "definition": "How much the gears reduce the spin, e.g. a 3:1 reduction means the wheel turns once for every 3 motor turns, so wheel RPM = motor RPM ÷ 3.",
          "cognate": "relación de engranajes"
        },
        {
          "term": "Circumference",
          "definition": "The distance the wheel rolls in ONE full turn. For a wheel of diameter d, C = π·d (meters per revolution).",
          "cognate": "circunferencia"
        },
        {
          "term": "Speed",
          "definition": "How fast the car moves, in meters per second. Speed = (revolutions per second) × (circumference): v = (rev/s) × C.",
          "cognate": "rapidez / velocidad"
        }
      ]
    },
    {
      "id": "d6-b7",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "The full drivetrain — energy chain from battery to road",
      "caption": "Power-on traces this chain left to right: the battery's stored chemistry becomes electrical energy in the wires, the motor turns that into a fast ROTATIONAL spin, the gear reduction passes that spin to the axle, and the wheels convert axle rotation into the car's forward (translational) motion down the floor.",
      "genPrompt": "Left-to-right energy chain for an electric car drivetrain: Chemical (battery) -> Electrical (wires through switch) -> Mechanical rotational (motor + gears spinning the axle) -> Translational (car moving forward).",
      "links": [
        {
          "label": "Chemical",
          "sublabel": "battery (stored)"
        },
        {
          "label": "Electrical",
          "sublabel": "wires + switch"
        },
        {
          "label": "Mechanical — rotational",
          "sublabel": "motor + gears spin the axle"
        },
        {
          "label": "Translational",
          "sublabel": "car rolls forward"
        }
      ]
    },
    {
      "id": "d6-b8",
      "type": "callout",
      "variant": "note",
      "title": "Build steps 10–15 (do these in order)",
      "markdown": "**10.** Press the **pinion gear** onto the motor shaft. **11.** Mount the **motor** and slide it in until the pinion **meshes** with the 20T axle gear (snug, not jammed — it should spin by hand). **12.** **Drill the switch hole** — *wood block under the chassis!* — and mount the switch. **13.** Mount the **battery clip**. **14.** Wire the loop in **series**: battery → switch → motor → back to battery (tape the splices for now). **15.** **Direction test:** short tap of the switch — does the car go the way you want? If it runs backward, swap the two motor wires."
    },
    {
      "id": "d6-b9",
      "type": "callout",
      "variant": "note",
      "title": "Name the wires you just connected",
      "markdown": "Three jobs in one loop: the **battery is the source** (it pushes the current), the **switch is the gate** (it opens and closes the path), and the **motor is the load** (it uses the energy to spin). It's a **series** circuit, so: **break the loop anywhere, current stops everywhere.** A dead car is usually a broken loop — check every splice."
    },
    {
      "id": "d6-b10",
      "type": "worked_example",
      "prompt": "WHEEL RPM from MOTOR RPM. A motor spins at 6000 RPM. The drivetrain is a 3:1 reduction (the gears turn the wheel once for every 3 motor turns). What is the wheel/axle RPM?",
      "given": "Motor RPM = 6000 RPM; gear reduction = 3:1 (wheel turns once per 3 motor turns).",
      "equation": "$\\text{wheel RPM} = \\dfrac{\\text{motor RPM}}{\\text{gear ratio}}$",
      "work": "$\\text{wheel RPM} = \\dfrac{6000\\ \\text{RPM}}{3} = 2000\\ \\text{RPM}$.  The reduction slows the spin by a factor of 3 (and trades it for more turning strength).",
      "answer": "The wheel/axle spins at **2000 RPM** — three times slower than the motor."
    },
    {
      "id": "d6-b11",
      "type": "worked_example",
      "prompt": "SPEED from WHEEL RPM. The wheel spins at 2000 RPM and its circumference is C = 0.19 m (the distance it rolls per turn). How fast does the car move, in m/s?",
      "given": "Wheel RPM = 2000 RPM; wheel circumference C = 0.19 m per revolution.",
      "equation": "$\\text{rev/s} = \\dfrac{\\text{RPM}}{60}\\quad\\text{then}\\quad v = (\\text{rev/s}) \\times C$",
      "work": "Convert RPM to rev/s: $\\;\\text{rev/s} = \\dfrac{2000\\ \\text{rev/min}}{60\\ \\text{s/min}} = 33.3\\ \\text{rev/s}$.  Then multiply by the distance per turn: $\\;v = 33.3\\ \\tfrac{\\text{rev}}{\\text{s}} \\times 0.19\\ \\tfrac{\\text{m}}{\\text{rev}} = 6.33\\ \\tfrac{\\text{m}}{\\text{s}}$ (the 'rev' units cancel, leaving m/s).",
      "answer": "The car moves at about **6.3 m/s**. Notice the unit cancellation: revolutions cancel, so rev/s × m/rev = m/s."
    },
    {
      "id": "d6-b12",
      "type": "gewa",
      "capture": true,
      "prompt": "WHEEL RPM. Your motor spins at 9000 RPM and your drivetrain is a 3:1 reduction. What is the wheel/axle RPM? Show the relationship, then compute.",
      "givenHint": "Motor RPM = 9000 RPM; gear reduction = 3:1 (wheel turns once per 3 motor turns).",
      "equationHint": "wheel RPM = motor RPM ÷ gear ratio",
      "equationOptions": [
        "wheel RPM = motor RPM ÷ gear ratio",
        "rev/s = RPM ÷ 60",
        "v = (rev/s) × C",
        "gear ratio = motor RPM ÷ wheel RPM"
      ]
    },
    {
      "id": "d6-b13",
      "type": "gewa",
      "capture": true,
      "prompt": "RPM → rev/s → SPEED. Your wheel spins at 1800 RPM and your wheel circumference is C = 0.20 m. First convert RPM to rev/s, then find the car's speed in m/s. Show BOTH steps and keep your units.",
      "givenHint": "Wheel RPM = 1800 RPM; circumference C = 0.20 m per revolution.",
      "equationHint": "rev/s = RPM ÷ 60; then v = (rev/s) × C",
      "equationOptions": [
        "rev/s = RPM ÷ 60",
        "v = (rev/s) × C",
        "wheel RPM = motor RPM ÷ gear ratio",
        "C = π × d"
      ]
    },
    {
      "id": "d6-b14",
      "type": "gewa",
      "capture": true,
      "prompt": "PREDICTED vs MEASURED. From your run you measured the car covering 2.00 m in 0.40 s. (a) Find the MEASURED speed v = d/t. (b) Your Day-3 PREDICTED speed was 6.3 m/s. Is your measured speed faster, slower, or about the same — and give one physical reason for any difference.",
      "givenHint": "Distance d = 2.00 m; time t = 0.40 s; predicted speed = 6.3 m/s.",
      "equationHint": "v = d ÷ t; then compare measured vs predicted",
      "equationOptions": [
        "v = d ÷ t",
        "v = (rev/s) × C",
        "rev/s = RPM ÷ 60",
        "wheel RPM = motor RPM ÷ gear ratio"
      ]
    },
    {
      "id": "d6-b15",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Trial",
        "Motor RPM",
        "Wheel RPM",
        "Predicted speed (m/s)"
      ],
      "rows": 4,
      "plot": true,
      "xCol": 2,
      "yCol": 3,
      "patternPrompt": "As wheel RPM goes up across your trials, what happens to the predicted speed? Is the relationship a straight line — and why would it be?"
    },
    {
      "id": "d6-b16",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "RUN THE CAR. Mark 2.00 m on the floor. Switch ON at the start as the stopwatch starts; STOP the watch at the finish. Compute v = d/t, then rev/s = v/C and RPM = (rev/s)×60. Do THREE runs. On the sketch, trace the energy chain from battery to road, then log your first-power result and your measured-vs-predicted comparison.",
      "fields": [
        "First power-on: which direction did the car go, and was it what you predicted?",
        "Run data: distance (2.00 m), the three times, and your computed v = d/t for each",
        "Measured wheel RPM I worked back to (rev/s = v/C, then ×60)",
        "Measured speed vs my Day-3 PREDICTED speed — faster, slower, or same, and ONE physical reason for the difference"
      ],
      "grid": false,
      "backgroundDiagram": {
        "kind": "energy_chain",
        "title": "Trace your car's energy chain",
        "caption": "Annotate where each energy change happens on your car.",
        "links": [
          {
            "label": "Chemical",
            "sublabel": "battery"
          },
          {
            "label": "Electrical",
            "sublabel": "switch + wires"
          },
          {
            "label": "Rotational",
            "sublabel": "motor + gears"
          },
          {
            "label": "Translational",
            "sublabel": "car rolls"
          }
        ]
      }
    },
    {
      "id": "d6-b17",
      "type": "sentence_frame",
      "frame": "My measured speed was ____ m/s and my predicted speed was ____ m/s, so my prediction was ____. The most likely reason for the difference is ____.",
      "wordBank": [
        "faster",
        "slower",
        "about the same",
        "too high",
        "too low",
        "friction in the bearings",
        "gear slip / poor mesh",
        "battery wasn't fully charged",
        "the wheel circumference I used was off",
        "timing error on the stopwatch"
      ]
    },
    {
      "id": "d6-b18",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "In one or two sentences: explain HOW you turn a measured wheel RPM into a car speed in m/s. Name the two steps and why the units work out.",
      "frame": "First I convert RPM to rev/s by ____. Then I multiply by the ____ because each turn rolls the car C meters, so the units become ____."
    },
    {
      "id": "d6-b19",
      "type": "marzano",
      "capture": true,
      "targetId": "c767b249-82ba-4742-8af3-199c26f233bb"
    },
    {
      "id": "d6-b20",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "fae0b910-e74a-4ad9-99f1-8905a02b0619",
        "c767b249-82ba-4742-8af3-199c26f233bb"
      ]
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d06';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "WORKSHOP",
  "blocks": [
    {
      "id": "d7-b1",
      "type": "target",
      "statement": "I can make clean, reliable solder joints on my car's wiring (S3) and begin executing my Day-1 theme with visible craftsmanship (S7).",
      "targetId": "s3"
    },
    {
      "id": "d7-b2",
      "type": "callout",
      "variant": "warning",
      "title": "SAFETY — soldering iron, second take",
      "markdown": "The iron tip runs **350–450 °C**. Park it in the stand every single time you set it down. **One hand behind your back** while you solder so you never brace a wire with bare fingers. Solder in the ventilated zone, and let joints cool 10 seconds before you touch them. Hot glue burns too — treat the nozzle like the iron."
    },
    {
      "id": "d7-b3",
      "type": "vocab",
      "terms": [
        {
          "term": "solder joint",
          "definition": "A wire splice fused with melted solder so the connection is permanent and low-resistance.",
          "cognate": "junta de soldadura"
        },
        {
          "term": "cold joint",
          "definition": "A dull, grainy joint where the solder never fully flowed — it looks connected but breaks contact and stops the current.",
          "cognate": "soldadura fría"
        },
        {
          "term": "series circuit",
          "definition": "One single loop: battery → switch → motor. Current must pass through every part in order; break it anywhere and it stops everywhere.",
          "cognate": "circuito en serie"
        },
        {
          "term": "finish craftsmanship",
          "definition": "How carefully the surface, paint, and decoration are executed — one of the three things the Day-9 judge scores."
        }
      ]
    },
    {
      "id": "d7-b4",
      "type": "diagram",
      "kind": "circuit",
      "title": "One loop, four joints to commit",
      "caption": "Battery (source) → switch (gate) → motor (load), back to battery. Every tape splice you replace with solder is one link in this single series loop. A cold joint on ANY edge opens the whole loop.",
      "components": [
        {
          "kind": "battery",
          "side": "left",
          "label": "Battery (source)"
        },
        {
          "kind": "switch",
          "side": "top",
          "label": "Switch (gate)"
        },
        {
          "kind": "motor",
          "side": "right",
          "label": "Motor (load)"
        }
      ]
    },
    {
      "id": "d7-b5",
      "type": "callout",
      "variant": "tip",
      "title": "What a good joint looks like",
      "markdown": "**Heat the wire, not the solder.** Touch the iron to the joint for 2–3 seconds, then feed solder onto the *wire* — it should flow and wick in. A good joint is **shiny and smooth**, like a tiny silver volcano. A **dull, blobby, grainy** joint is a *cold joint*: reheat it until it flows. Then slide heat-shrink over it and hot-glue the wire so it cannot snag."
    },
    {
      "id": "d7-b6",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "FINISH PLAN. Sketch your car's aesthetic (top + side view): where paint, decoration, and your Day-1 theme go. Then log which of the four solder joints are COMMITTED (soldered + inspected) vs. still on tape.",
      "fields": [
        "Theme (Day-1 commitment) + the aesthetic I'm sketching",
        "Joints committed so far (which edges of the loop) and how I inspected each",
        "Reasoning: which joint is most critical to solder first, and why",
        "Reasoning: what I want the Day-9 judge to SEE in my finish"
      ],
      "grid": true,
      "palette": [
        "#1f2937",
        "#b45309",
        "#2563eb",
        "#dc2626",
        "#16a34a"
      ]
    },
    {
      "id": "d7-b7",
      "type": "worked_example",
      "prompt": "Reliability reasoning: the wheel circumference is fixed and the build is nearly final. One team's car ran fine on Day 6 but now refuses to power on after soldering. Re-derive what a single COLD joint does to the series loop, and confirm whether the predicted top speed even matters if the loop is open.",
      "given": "Series loop: battery → switch → motor → battery. One splice cooled into a cold joint (no metal-to-metal flow). Day-3 predicted top speed v = 1.80 m/s came from wheel circumference C = 0.180 m and motor output ≈ 10.0 rev/s.",
      "equation": "In one series loop the current I is the SAME everywhere; open the loop at any joint and I = 0 A throughout. Speed only exists if current reaches the motor: v = (rev/s) × C.",
      "work": "A cold joint behaves like an open switch — resistance spikes toward infinity, so I ≈ 0 A at every component, not just the bad one. With I = 0 A the motor produces 0 rev/s. Then v = (0 rev/s) × 0.180 m = 0 m/s. The other three joints being perfect does not help: current must pass through ALL of them in order.",
      "answer": "v = 0 m/s. A single cold joint kills the car. The predicted 1.80 m/s is irrelevant until every joint in the series loop carries current — reliability comes before speed."
    },
    {
      "id": "d7-b8",
      "type": "gewa",
      "capture": true,
      "prompt": "RELIABILITY GEWA. Your teammate says 'three of our four joints are perfect, so the car is 75% reliable.' Use series-circuit reasoning to decide if that's true. State what current flows to the motor and what top speed results if the fourth joint is cold.",
      "givenHint": "GIVEN: a single series loop (battery, switch, motor); 3 good joints + 1 cold joint; current I is shared by every component in a series loop.",
      "equationHint": "EQUATION: series current is the same everywhere → open the loop anywhere → I = 0 A everywhere → v = (rev/s) × C = 0.",
      "equationOptions": [
        "I_series = same through every component",
        "v = (rev/s) × C",
        "rev/s = v / C",
        "RPM = (rev/s) × 60"
      ]
    },
    {
      "id": "d7-b9",
      "type": "prose",
      "markdown": "### Final alignment roll test\n\nSoldering means heat and handling — that can nudge an axle out of true. Before you paint, **roll your car unpowered down at least 3 m** and watch it. If it veers, the wheels are no longer parallel and you fix it *now*, while the joints are exposed, not after the paint dries."
    },
    {
      "id": "d7-b10",
      "type": "gewa",
      "capture": true,
      "prompt": "RE-PREDICT TOP SPEED (review). Your build is near-final and you re-measured the wheel circumference as C = 0.180 m. In a clean corridor run the axle turns about 10.0 rev/s once the loop is solid. Re-predict the car's top speed in m/s, and convert the axle rate to RPM.",
      "givenHint": "GIVEN: C = 0.180 m, rev/s ≈ 10.0 rev/s, all joints soldered (current flows).",
      "equationHint": "EQUATION: v = (rev/s) × C, then RPM = (rev/s) × 60.",
      "equationOptions": [
        "v = (rev/s) × C",
        "RPM = (rev/s) × 60",
        "rev/s = v / C",
        "v = d / t"
      ]
    },
    {
      "id": "d7-b11",
      "type": "callout",
      "variant": "note",
      "title": "Day-9 judging is three things",
      "markdown": "The design judge scores **theme execution + finish craftsmanship + build craftsmanship**. Today's solder joints are the *build* score, and the paint/decoration you start now is the *finish* score. Don't rush the finish to chase a faster lap — a reliable, clean car wins on the table even before it wins in the corridor."
    },
    {
      "id": "d7-b12",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "Name the ONE joint you committed today that you're most confident in, and explain in series-circuit terms why a single bad joint would have stopped the whole car.",
      "frame": "The joint I trust most is ___ because the solder ___. A single cold joint anywhere would ___ because in a series loop the current ___."
    },
    {
      "id": "d7-b13",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "1d0721bd-1b72-4921-b1c8-7dadc157786d",
        "1fb2b1c7-3372-4573-81f6-e413185c283c"
      ]
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d07';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "LAB",
  "blocks": [
    {
      "id": "d8-b1",
      "type": "target",
      "statement": "I can finish, sign, and photograph my car (S7), then run timed PRACTICE RUNS and compute its real speed with v = d/t, average my trials, and compare the measured speed to my Day-6 prediction.",
      "targetId": "s7"
    },
    {
      "id": "d8-b2",
      "type": "callout",
      "variant": "tip",
      "title": "Today's flow: finish → sign → photo → run → compute → compare",
      "markdown": "**Theme execution is done today.** First close out the finish (paint touch-ups, sealant if needed). Then **sign the underside of the chassis** with your team name + date and write your judging name card. Take the **group + hero photos**. Then the real physics: take your car to the **actual race corridor** for timed **practice runs** — record distance and time, compute speed, and tune. Tomorrow is the race."
    },
    {
      "id": "d8-b3",
      "type": "vocab",
      "terms": [
        {
          "term": "trial",
          "definition": "One single timed practice run. You repeat trials because no single run is perfectly reliable — repeating lets you average out random timing and release errors.",
          "cognate": "ensayo / prueba"
        },
        {
          "term": "average speed",
          "definition": "The mean of your measured speeds across several trials: add the trial speeds and divide by the number of trials. It is a more trustworthy number than any one run.",
          "cognate": "rapidez promedio"
        },
        {
          "term": "percent difference",
          "definition": "How far your measured value sits from your predicted value, as a percent: %diff = |measured − predicted| ÷ predicted × 100%. A small percent means your prediction matched the floor well.",
          "cognate": "diferencia porcentual"
        }
      ]
    },
    {
      "id": "d8-b4",
      "type": "callout",
      "variant": "tip",
      "title": "Run procedure — make every trial fair",
      "markdown": "Mark a **fixed distance** on the corridor floor (e.g. 6.0 m) with tape — the SAME start and finish line for every trial. **Switch ON at the start line as the stopwatch starts**; stop the watch the instant the front of the car crosses the finish line. Run the car **straight down the same lane** each time. Do at least **four trials** back to back so you can average them."
    },
    {
      "id": "d8-b5",
      "type": "callout",
      "variant": "warning",
      "title": "Measurement care — where error sneaks in",
      "markdown": "Your speed is only as good as your distance and time. **Measure the distance once, carefully, and keep it fixed.** Most error lives in the **stopwatch**: human reaction time is about 0.2 s, so a single short run can be off by a lot. That is exactly why you **repeat and average** — and why you should toss any run where the car veered into the wall or you fumbled the start."
    },
    {
      "id": "d8-b6",
      "type": "worked_example",
      "prompt": "MEASURED SPEED from one practice run. Your car covers a measured 6.0 m of corridor in a timed 2.4 s. What was its measured speed for that run, in m/s?",
      "given": "Distance d = 6.0 m; time t = 2.4 s (one trial).",
      "equation": "$v = \\dfrac{d}{t}$",
      "work": "Substitute the measured numbers and keep the units: $\\;v = \\dfrac{6.0\\ \\text{m}}{2.4\\ \\text{s}} = 2.5\\ \\tfrac{\\text{m}}{\\text{s}}$. The meters stay on top and the seconds stay on the bottom, so the answer comes out in m/s — a speed.",
      "answer": "The car's measured speed for that run was **2.5 m/s**. This is the REAL speed on the floor — distance you measured divided by the time you timed."
    },
    {
      "id": "d8-b7",
      "type": "worked_example",
      "prompt": "AVERAGING three trial speeds. Over the same 6.0 m course you time three runs and compute their speeds: 2.5 m/s, 2.7 m/s, and 2.6 m/s. What is the car's average speed across the three trials?",
      "given": "Three measured trial speeds: $v_1 = 2.5$ m/s, $v_2 = 2.7$ m/s, $v_3 = 2.6$ m/s; number of trials $n = 3$.",
      "equation": "$\\bar{v} = \\dfrac{v_1 + v_2 + v_3}{n}$",
      "work": "Add the three trial speeds: $\\;2.5 + 2.7 + 2.6 = 7.8\\ \\tfrac{\\text{m}}{\\text{s}}$. Divide by the number of trials: $\\;\\bar{v} = \\dfrac{7.8\\ \\text{m/s}}{3} = 2.6\\ \\tfrac{\\text{m}}{\\text{s}}$.",
      "answer": "The average speed is **2.6 m/s**. Averaging smooths out the timing wobble of any single trial, so this is the number you trust to compare against your prediction."
    },
    {
      "id": "d8-b8",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Run",
        "Distance (m)",
        "Time (s)",
        "Speed (m/s)"
      ],
      "rows": 4,
      "plot": true,
      "xCol": 2,
      "yCol": 1,
      "patternPrompt": "Plot Distance (m) on the y-axis against Time (s) on the x-axis for your four trials. Do the points cluster near a straight line through the origin? The slope of that line IS your speed — does it match the speeds you computed in the last column?"
    },
    {
      "id": "d8-b9",
      "type": "gewa",
      "capture": true,
      "prompt": "MEASURED SPEED, your run. Pick your BEST clean trial from the table. Using your measured distance and your timed value, compute that run's speed with v = d/t. Show GIVEN, EQUATION, WORK, ANSWER and keep your units.",
      "givenHint": "GIVEN: your measured distance d (m) and your timed t (s) for one good trial.",
      "equationHint": "EQUATION: v = d / t. Substitute your numbers and keep m on top, s on the bottom → m/s.",
      "equationOptions": [
        "v = d / t",
        "average speed = (v1 + v2 + ... + vn) / n",
        "v = (rev/s) × C",
        "%diff = |measured − predicted| / predicted × 100%"
      ]
    },
    {
      "id": "d8-b10",
      "type": "gewa",
      "capture": true,
      "prompt": "AVERAGE SPEED across your trials. Take the four Speed (m/s) values from your data table and compute your car's AVERAGE speed. Show how you added them and divided by the number of trials, and report the average with units.",
      "givenHint": "GIVEN: your four trial speeds v1, v2, v3, v4 from the Speed column; number of trials n = 4 (drop any run you had to toss).",
      "equationHint": "EQUATION: average speed = (v1 + v2 + v3 + v4) / 4. Add the speeds, then divide by how many trials you kept.",
      "equationOptions": [
        "average speed = (v1 + v2 + ... + vn) / n",
        "v = d / t",
        "%diff = |measured − predicted| / predicted × 100%",
        "v = (rev/s) × C"
      ]
    },
    {
      "id": "d8-b11",
      "type": "gewa",
      "capture": true,
      "prompt": "MEASURED vs PREDICTED. Your Day-6 PREDICTED top speed came from wheel RPM × circumference. Compare your AVERAGE measured speed to that prediction: compute the percent difference, state which is faster, and give ONE physical reason for the gap (friction in the bearings, wheel alignment / veer, gear slip, battery charge, or timing error).",
      "givenHint": "GIVEN: your average measured speed (from the previous GEWA) and your Day-6 predicted speed (m/s).",
      "equationHint": "EQUATION: %diff = |measured − predicted| / predicted × 100%. Then decide faster vs slower and name a physical cause.",
      "equationOptions": [
        "%diff = |measured − predicted| / predicted × 100%",
        "average speed = (v1 + v2 + ... + vn) / n",
        "v = d / t",
        "v = (rev/s) × C"
      ]
    },
    {
      "id": "d8-b12",
      "type": "observation",
      "patternPrompt": "Look across your four trials in the data table. What pattern do you see in the Speed (m/s) column — are the trials tightly clustered, or do they spread out? Are your Distance-vs-Time points close to one straight line?",
      "interpretPrompt": "What does the SPREAD between your trials mean? If your speeds are tightly clustered, what does that say about your measurement and your car? If they spread out a lot, what is the likely cause (timing reaction, an off-lane run, a sticky start), and which trial would you throw out before averaging?",
      "frame": "Across my trials the speeds were (tightly clustered / spread out), which tells me ___. The spread is mostly caused by ___, so before averaging I would ___."
    },
    {
      "id": "d8-b13",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "PRACTICE-RUN LOG. Sketch the corridor course with your fixed start and finish lines and the measured distance labeled. Log each of your four timed trials (distance, time, computed v = d/t), then reflect on measured vs predicted and one tune you made between runs.",
      "fields": [
        "Course setup: measured distance (m) and how I kept the start/finish the same every trial",
        "Trial log: the four times, and the speed v = d/t I computed for each run",
        "Reasoning: my AVERAGE measured speed vs my Day-6 PREDICTED speed — which was faster and by how much (percent difference)",
        "Reasoning: the most likely PHYSICAL reason for the gap (friction, alignment/veer, gear slip, battery, timing) and the ONE tune I made to improve the next run"
      ],
      "grid": true,
      "palette": [
        "#1f2937",
        "#b45309",
        "#2563eb",
        "#dc2626",
        "#16a34a"
      ]
    },
    {
      "id": "d8-b14",
      "type": "callout",
      "variant": "note",
      "title": "Why measured usually comes in under predicted",
      "markdown": "Your Day-6 prediction assumed the wheel turns at a steady RPM and the car rolls in a perfectly straight line. On the real floor, **friction in the bearings** steals speed, a **slight misalignment** makes the car veer and travel a longer, slower path, and **gear slip or a half-charged battery** lowers the actual RPM. A small percent difference (measured a bit *under* predicted) is normal and *good* — it means your model was sound and your build is clean."
    },
    {
      "id": "d8-b15",
      "type": "exit_ticket",
      "capture": true,
      "prompt": "In your own words: why did you run FOUR trials instead of trusting one, and was your average measured speed faster or slower than your Day-6 prediction? Name the one physical reason for the difference.",
      "frame": "I ran four trials because a single run ___. My average measured speed was ___ than my predicted speed, mostly because ___."
    },
    {
      "id": "d8-b16",
      "type": "marzano",
      "capture": true,
      "targetId": "1fb2b1c7-3372-4573-81f6-e413185c283c"
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d08';
UPDATE lessons SET content_blocks = $u8${
  "schemaVersion": 1,
  "dayType": "TRANSFER",
  "blocks": [
    {
      "id": "d9-b1",
      "type": "target",
      "statement": "I can run my car in a timed RACE and compute its official speed with v = d/t (R3), compare my measured race speed to my Day-6 prediction with a percent difference (R3), and defend three physics design choices in writing on the transfer task (R4).",
      "targetId": "u8-r3"
    },
    {
      "id": "d9-b2",
      "type": "callout",
      "variant": "tip",
      "title": "Today's flow: race -> judge design -> analyze with physics -> transfer task -> reflect",
      "markdown": "**This is the capstone.** First we **race in heats** down the marked corridor while the teacher records each car's time and straightness. Then we **judge design** at the table (theme, finish, build craftsmanship). Then YOU do the physics: compute each official race **speed with v = d/t**, find the **percent difference** between your measured speed and your Day-6 prediction, and reason about **why one car beat another from the physics, not the team**. Finally the **transfer task** asks you to defend three design choices in writing."
    },
    {
      "id": "d9-b3",
      "type": "callout",
      "variant": "note",
      "title": "Race procedure -- make every heat fair",
      "markdown": "Heats run down the **same marked corridor** over a **fixed race distance** (e.g. 6.0 m) with the SAME start and finish line for every car. **Switch the car ON at the start line as the stopwatch starts**; the teacher stops the watch the instant the front of the car crosses the finish line and records **time** plus a **straightness** rating (1-2-3). Signed-chassis check happens before any heat. Keep the lane clear -- a car that hits the wall gets a re-run, not a thrown-out result."
    },
    {
      "id": "d9-b4",
      "type": "callout",
      "variant": "tip",
      "title": "Sportsmanship + celebration",
      "markdown": "**Race the cars, not each other.** Cheer every heat -- the slowest car taught its team just as much physics as the fastest one. When a car wins that nobody expected, the question is never *\"whose team is best\"* -- it is *\"what design choice made that car faster?\"* Congratulate the builders, then put on your scientist hat: the race is a **thinking artifact**, evidence for the physics, not a popularity contest."
    },
    {
      "id": "d9-b5",
      "type": "vocab",
      "terms": [
        {
          "term": "official run",
          "definition": "The single timed race heat that counts -- the one whose distance and time you use to compute your car's official race speed.",
          "cognate": "carrera oficial"
        },
        {
          "term": "percent difference",
          "definition": "How far your measured race speed sits from your predicted speed, as a percent: %diff = |measured - predicted| / predicted x 100%. Small percent = your Day-6 prediction matched the floor well.",
          "cognate": "diferencia porcentual"
        },
        {
          "term": "gear ratio",
          "definition": "The ratio of motor turns to wheel turns. A ratio favoring speed lets the wheels spin faster per motor turn (more top speed, less pulling force); a ratio favoring torque does the opposite.",
          "cognate": "relacion de engranajes"
        },
        {
          "term": "alignment",
          "definition": "How straight and parallel the wheels/axles run. Good alignment keeps the car going straight so it covers the race distance in less time; misalignment veers the car and wastes distance.",
          "cognate": "alineacion"
        }
      ]
    },
    {
      "id": "d9-b6",
      "type": "data_table",
      "capture": true,
      "columns": [
        "Car",
        "Time (s)",
        "Speed (m/s)",
        "Notes"
      ],
      "rows": 4,
      "plot": false,
      "patternPrompt": "Record each car's official heat: its time over the fixed race distance, the speed you compute with v = d/t, and a note on straightness or any design feature you observed. After the table is full, rank the cars by speed -- which was fastest, and what do you notice about that car's design?"
    },
    {
      "id": "d9-b7",
      "type": "diagram",
      "kind": "energy_chain",
      "title": "From battery to race speed: the full drivetrain",
      "caption": "Every design choice lives somewhere on this chain. A weak link anywhere -- a draining battery, a stalling motor, a bad gear ratio, or misaligned wheels losing energy to friction -- shows up as a slower official time. Reason about a slow car by asking which link leaked energy.",
      "links": [
        {
          "label": "Battery",
          "sublabel": "chemical energy stored",
          "color": "var(--primary)"
        },
        {
          "label": "Motor",
          "sublabel": "electrical -> rotation",
          "color": "var(--reward)"
        },
        {
          "label": "Gears",
          "sublabel": "gear ratio sets wheel speed",
          "color": "oklch(0.58 0.10 255)"
        },
        {
          "label": "Wheels + axles",
          "sublabel": "rotation -> ground (friction)",
          "color": "var(--success)"
        },
        {
          "label": "Car speed",
          "sublabel": "v = d / t down the corridor",
          "color": "var(--foreground)"
        }
      ]
    },
    {
      "id": "d9-b8",
      "type": "worked_example",
      "prompt": "OFFICIAL RACE SPEED from distance and time. A car covers the official 6.0 m race corridor in a timed 2.0 s. What was its official race speed, in m/s?",
      "given": "Race distance d = 6.0 m; official time t = 2.0 s.",
      "equation": "$v = \\dfrac{d}{t}$",
      "work": "Substitute the official numbers and keep the units: $\\;v = \\dfrac{6.0\\ \\text{m}}{2.0\\ \\text{s}} = 3.0\\ \\tfrac{\\text{m}}{\\text{s}}$. Meters stay on top, seconds on the bottom, so the answer is in m/s -- a speed.",
      "answer": "The car's official race speed was **3.0 m/s**. This is the real speed on race day: the fixed race distance divided by the timed heat."
    },
    {
      "id": "d9-b9",
      "type": "worked_example",
      "prompt": "PERCENT DIFFERENCE between predicted and measured. On Day 6 a team predicted their car would go 2.5 m/s. On race day it measured 3.0 m/s. What is the percent difference between the measured and predicted speeds?",
      "given": "Predicted speed = 2.5 m/s; measured race speed = 3.0 m/s.",
      "equation": "$\\%\\text{diff} = \\dfrac{\\lvert \\text{measured} - \\text{predicted}\\rvert}{\\text{predicted}} \\times 100\\%$",
      "work": "Find the gap, then divide by the prediction: $\\;\\dfrac{\\lvert 3.0 - 2.5\\rvert}{2.5}\\times 100\\% = \\dfrac{0.5}{2.5}\\times 100\\% = 0.20 \\times 100\\% = 20\\%$.",
      "answer": "The measured speed was about **20% higher** than predicted. A gap this size tells the team their Day-6 model missed something -- maybe a better gear ratio or smoother floor than they assumed. The sign (measured faster) is part of the story, not just the size."
    },
    {
      "id": "d9-b10",
      "type": "gewa",
      "capture": true,
      "prompt": "OFFICIAL SPEED, your car. Using your car's official race DISTANCE and its timed value from today's heat, compute your official race speed with v = d/t. Show GIVEN, EQUATION, WORK, ANSWER and keep your units (m on top, s on the bottom -> m/s).",
      "givenHint": "GIVEN: the official race distance d (m) and your timed heat t (s).",
      "equationHint": "EQUATION: v = d / t. Substitute your numbers, keep meters on top and seconds on the bottom.",
      "equationOptions": [
        "v = d / t",
        "%diff = |measured - predicted| / predicted x 100%",
        "average speed = (v1 + v2 + ... + vn) / n",
        "v = (rev/s) x C"
      ]
    },
    {
      "id": "d9-b11",
      "type": "gewa",
      "capture": true,
      "prompt": "PERCENT DIFFERENCE, your car. Compare your official race speed (just computed) to your Day-6 PREDICTED speed. Compute the percent difference. Show GIVEN, EQUATION, WORK, ANSWER, and say in your ANSWER whether you were faster or slower than predicted.",
      "givenHint": "GIVEN: your predicted speed (m/s) from Day 6 and your measured official race speed (m/s) from today.",
      "equationHint": "EQUATION: %diff = |measured - predicted| / predicted x 100%. Subtract, take the absolute value, divide by your prediction, x 100%.",
      "equationOptions": [
        "%diff = |measured - predicted| / predicted x 100%",
        "v = d / t",
        "average speed = (v1 + v2 + ... + vn) / n",
        "v = (rev/s) x C"
      ]
    },
    {
      "id": "d9-b12",
      "type": "gewa",
      "capture": true,
      "prompt": "WHOSE CAR WAS FASTER -- AND WHY (reason from the physics). Pick TWO cars from your results table: the faster one and a slower one. State which had the higher official speed (back it with the v = d/t numbers), then explain ONE design choice -- wheel size, gear ratio, or alignment -- that best explains the difference. Reason from the drivetrain, not from the team.",
      "givenHint": "GIVEN: the two cars' official speeds from your data table, plus what you observed about their wheels, gearing, or how straight each ran.",
      "equationHint": "EQUATION: compare with v = d/t (same race distance, so the car with the shorter time has the higher speed). Then argue the design cause: e.g. larger wheels cover more distance per turn; a speed gear ratio spins wheels faster; better alignment wastes less distance to veering and friction.",
      "equationOptions": [
        "v = d / t",
        "%diff = |measured - predicted| / predicted x 100%",
        "v = (rev/s) x C",
        "average speed = (v1 + v2 + ... + vn) / n"
      ]
    },
    {
      "id": "d9-b13",
      "type": "callout",
      "variant": "note",
      "title": "Transfer task -- defend your design with physics",
      "markdown": "The transfer task is scored on a **4-dimension rubric (Identify / Calculate / Construct / Transfer)** where the **lowest dimension wins** -- so do all four well. You will defend **three physics choices**: (1) **wheels** -- use your computed speed to argue your wheel choice; (2) **alignment** -- explain how straightness affected your time; (3) **circuit + a counterfactual** -- what would have happened to your speed if one circuit or drivetrain choice had been different. Use real numbers and units from your own car. **Sentence frames are available** if you want them: *\"My measured speed of ___ m/s shows ___ because ___.\"*"
    },
    {
      "id": "d9-b14",
      "type": "transfer_prompt",
      "masteryTaskSlug": "u8-car-project-transfer"
    },
    {
      "id": "d9-b15",
      "type": "lab_notebook",
      "capture": true,
      "instruction": "DESIGN-JUDGING REFLECTION. Sketch your car (or the winning car) and label the one design feature you are most proud of. Then reason through what worked, what you would change, and why -- tying each idea back to the physics of speed and straightness.",
      "fields": [
        "What worked best on my car (and the physics reason it helped)",
        "What I would change next time (and how it would change my speed or straightness)",
        "What the race results taught me that my prediction missed"
      ],
      "grid": true
    },
    {
      "id": "d9-b16",
      "type": "self_assessment",
      "capture": true,
      "targetIds": [
        "3eda5c97-f3a6-45a3-b911-0ab5680ac7fc",
        "1c6e1fcc-63e2-40fc-9093-20352f02f3d6",
        "6964687c-fb59-44b0-a39a-d870f0d4843a",
        "a0da8983-b50b-4222-9f1d-11352c1f2cf4",
        "bfd76c34-7786-4ad0-80e8-7bea9136e2db",
        "2728d6f0-199b-4751-8591-c285abed5e6a",
        "fae0b910-e74a-4ad9-99f1-8905a02b0619",
        "c767b249-82ba-4742-8af3-199c26f233bb"
      ]
    },
    {
      "id": "d9-b17",
      "type": "marzano",
      "capture": true,
      "targetId": "567971c3-1f85-4da8-bfac-233381593285"
    }
  ]
}$u8$::jsonb, updated_at = now() WHERE slug = 'u8-d09';
COMMIT;
