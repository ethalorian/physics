/* Original rap adaptations of the user-supplied narration scripts and course targets. See docs/MIC_CHECK_2026-09-28.md. */
(function(root,factory){const tracks=factory();if(typeof module==='object')module.exports=tracks;else root.MicCheckTracks=tracks;})(typeof globalThis!=='undefined'?globalThis:this,function(){return [
  {
    "id": "unit-1",
    "title": "Change the Motion",
    "unit": "Motion & Forces",
    "color": "#c5f45b",
    "icon": "↗",
    "hook": "How fast, and where will it arrive? Your video explanations, on beat.",
    "verses": [
      {
        "chunks": [
          "Distance counts each step.",
          "Displacement: end minus start.",
          "Out and back is zero.",
          "Two ideas apart."
        ],
        "target": "u1.vocab-position-distance-displacement",
        "fact": "Your number-line lesson counts every step for distance, but compares only start and end for displacement. Out and back to the origin gives zero displacement, even though distance is positive.",
        "formula": "Δx = xfinal − xinitial",
        "source": "Number Line - Position",
        "cue": "Distance counts every step; displacement compares start and end."
      },
      {
        "chunks": [
          "How fast and which way?",
          "Velocity carries both.",
          "Speed drops direction.",
          "That is how they go."
        ],
        "target": "u1.kinematics-language",
        "fact": "Your velocity lesson uses two probes with equal speed but opposite directions. The speeds match, while the velocities have opposite signs in the chosen one-dimensional frame.",
        "formula": "velocity: how fast + which way",
        "source": "Velocity and Speed",
        "cue": "Speed keeps the size, drops the direction."
      },
      {
        "chunks": [
          "Position-time graph.",
          "Slope tells the story.",
          "Steeper means faster.",
          "Velocity in glory."
        ],
        "target": "u1.capture-pt-graph",
        "fact": "As in your cart example, equal steps in equal times make a straight position–time graph. Its slope is velocity; the size of that slope is speed.",
        "formula": "slope of x(t) → v",
        "source": "Position-Time Graphs",
        "cue": "Equal times, equal steps: a straight line."
      },
      {
        "chunks": [
          "Slope of position: v.",
          "Slope of velocity: a.",
          "Same direction? Speed grows.",
          "Opposite? Slows away."
        ],
        "target": "u1.acceleration-rate-of-change",
        "fact": "Your graph chain links position to velocity to acceleration. In one dimension, velocity and acceleration in the same direction increase speed; opposite directions decrease it. Negative acceleration does not always mean slowing down.",
        "formula": "x(t) → slope → v(t) → slope → a(t)",
        "source": "Velocity Graphs and Acceleration",
        "cue": "Compare the directions of v and a."
      },
      {
        "chunks": [
          "No net force.",
          "No velocity change.",
          "Rest or a straight line.",
          "Nothing to rearrange."
        ],
        "target": "u1.newtons-first-law-inertia",
        "fact": "Your puck moves farther as friction is reduced. With zero net force it keeps a constant velocity. Forces can still act when their vector sum is zero.",
        "formula": "ΣF = 0 → a = 0 → constant v",
        "source": "Newtons First Law",
        "cue": "Constant velocity needs no net force."
      },
      {
        "chunks": [
          "Add every force.",
          "Then divide by mass.",
          "Forces in, motion out.",
          "Predict the asteroid path."
        ],
        "target": "u1.fma-solve-net-force",
        "fact": "Your box example adds 50 N forward and 20 N of friction backward: net force is 30 N. Divide by 10 kg to get 3 m/s². Apply the same chain to the fictional asteroid: net force → acceleration → motion.",
        "formula": "a = ΣF / m",
        "source": "Newtons Second Law",
        "cue": "Forces in, motion out."
      }
    ]
  },
  {
    "id": "unit-2",
    "title": "Stay in Orbit",
    "unit": "Gravitation & Fields",
    "color": "#bda4ff",
    "icon": "◎",
    "hook": "Does its path bend toward us? Gravity bends the path.",
    "verses": [
      {
        "chunks": [
          "Mass is in kilos.",
          "Weight is a force.",
          "Mass times local g.",
          "Gravity, of course."
        ],
        "target": "u2.mass-vs-weight",
        "fact": "Mass is measured in kilograms. Weight is the gravitational force mg, measured in newtons, and depends on the local field.",
        "formula": "W = mg",
        "source": "The 2026-XJ Series",
        "cue": "U2 · 1:55–2:22 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Double the distance.",
          "Same masses there.",
          "Force drops to a fourth.",
          "Inverse square."
        ],
        "target": "u2.r1-scale-f",
        "fact": "For the same two spherical masses, doubling their center-to-center separation reduces gravitational force to one quarter.",
        "formula": "F = Gm₁m₂ / r²",
        "source": "The 2026-XJ Series",
        "cue": "U2 · 1:55–2:22 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "No air resistance.",
          "Drop from the sky.",
          "Same acceleration.",
          "Watch them fly."
        ],
        "target": "u2.free-fall-g",
        "fact": "At the same location, freely falling objects share gravitational acceleration when air resistance is negligible.",
        "formula": "a = g (free fall)",
        "source": "Free Fall - Along y",
        "cue": "Gravity changes vertical velocity; air resistance neglected.",
        "sourceKind": "Video explanation + course learning target"
      },
      {
        "chunks": [
          "Sideways and falling.",
          "One shared time.",
          "Split the components.",
          "Solve that climb."
        ],
        "target": "u2.k3-projectile-independence",
        "fact": "Without air resistance, a projectile has constant horizontal velocity and vertical acceleration due to gravity.",
        "formula": "ax = 0 · ay = −g",
        "source": "The 2026-XJ Series",
        "cue": "U2 · 1:55–2:22 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Turn in a circle.",
          "Inward we go.",
          "Speed squared over r.",
          "That is the flow."
        ],
        "target": "u2.s3-centripetal-calc",
        "fact": "Circular motion requires inward acceleration. Centripetal describes the role of the net inward force, not an extra kind of force.",
        "formula": "ac = v² / r",
        "source": "The 2026-XJ Series",
        "cue": "U2 · 1:55–2:22 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Orbit is falling.",
          "Earth curves away.",
          "Gravity still acts.",
          "All night, all day."
        ],
        "target": "u2.k5-orbit-free-fall",
        "fact": "An orbit is continuous free fall. Astronauts experience weightlessness because they and their spacecraft fall together.",
        "formula": "vorbit = √(GM / r)",
        "source": "The 2026-XJ Series",
        "cue": "U2 · 1:55–2:22 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  },
  {
    "id": "unit-3",
    "title": "Keep It Moving",
    "unit": "Momentum & Collisions",
    "color": "#ffb577",
    "icon": "⇄",
    "hook": "Could we push it out of the way? Give a small nudge time to work.",
    "verses": [
      {
        "chunks": [
          "Mass times velocity.",
          "Momentum on track.",
          "Keep the direction.",
          "Plus or minus back."
        ],
        "target": "u3.k1-momentum-vector",
        "fact": "Momentum is a vector equal to mass times velocity. Choose a positive direction and keep the signs.",
        "formula": "p = mv",
        "source": "The 2026-XJ Series",
        "cue": "U3 · 2:22–2:49 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Force over time.",
          "Impulse in play.",
          "Changes momentum.",
          "Push a new way."
        ],
        "target": "u3.k2-impulse-theorem",
        "fact": "Impulse is net force integrated over time; for average net force, impulse equals Faverage Δt and equals change in momentum.",
        "formula": "Favg Δt = Δp",
        "source": "The 2026-XJ Series",
        "cue": "U3 · 2:22–2:49 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Same momentum change.",
          "More stopping time.",
          "Less average force.",
          "A safer rhyme."
        ],
        "target": "u3.r1-extend-time",
        "fact": "For a fixed momentum change, increasing the stopping time reduces the average net force.",
        "formula": "Favg = Δp / Δt",
        "source": "The 2026-XJ Series",
        "cue": "U3 · 2:22–2:49 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "No net outside force.",
          "Total p stays.",
          "Before and after.",
          "Through the crash phase."
        ],
        "target": "u3.k3-conservation",
        "fact": "Total system momentum is conserved when net external force is zero (or external impulse is negligible during a collision).",
        "formula": "Σpbefore = Σpafter",
        "source": "The 2026-XJ Series",
        "cue": "U3 · 2:22–2:49 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Stick after impact.",
          "Together they slide.",
          "Momentum conserved.",
          "No outside force applied."
        ],
        "target": "u3.s2-inelastic-solve",
        "fact": "In a perfectly inelastic collision the objects stick together. Momentum is conserved for an isolated system; kinetic energy is not.",
        "formula": "m₁v₁ + m₂v₂ = (m₁ + m₂)vf",
        "source": "The 2026-XJ Series",
        "cue": "U3 · 2:22–2:49 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Could we push it away?",
          "A small nudge in time.",
          "Early change in velocity.",
          "Shifts the arrival line."
        ],
        "target": "u3.r3-deflection",
        "fact": "In a simple constant-velocity estimate, a small sideways velocity change produces an offset approximately equal to Δv times lead time.",
        "formula": "offset ≈ Δv × lead time",
        "source": "The 2026-XJ Series",
        "cue": "U3 · 2:22–2:49 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  },
  {
    "id": "unit-4",
    "title": "Energy Never Quits",
    "unit": "Energy & Work",
    "color": "#ffd45f",
    "icon": "ϟ",
    "hook": "If it hits, how bad is it? Follow the energy budget.",
    "verses": [
      {
        "chunks": [
          "Force along motion.",
          "Work gets done.",
          "Force times distance.",
          "Joules, every one."
        ],
        "target": "u4.k1-work",
        "fact": "For a constant force parallel to displacement, work is Fd. At an angle use Fd cos θ.",
        "formula": "W = Fd cos θ",
        "source": "The 2026-XJ Series",
        "cue": "U4 · 2:49–3:16 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Double the speed.",
          "Same mass in flight.",
          "Four times the K E.",
          "Get that right."
        ],
        "target": "u4.k2-kinetic-energy",
        "fact": "Kinetic energy depends on the square of speed. At fixed mass, twice the speed gives four times the kinetic energy.",
        "formula": "KE = ½mv²",
        "source": "The 2026-XJ Series",
        "cue": "U4 · 2:49–3:16 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Net work on the cart.",
          "Changes K E.",
          "Energy in motion.",
          "That is the key."
        ],
        "target": "u4.s1-work-energy-theorem",
        "fact": "The net work done on an object equals its change in kinetic energy.",
        "formula": "Wnet = ΔKE",
        "source": "The 2026-XJ Series",
        "cue": "U4 · 2:49–3:16 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Near Earth, lift it.",
          "Store energy high.",
          "m g times height.",
          "Let it fly."
        ],
        "target": "u4.k3-gpe-mgh",
        "fact": "Near Earth, with approximately constant g, the change in gravitational potential energy is mgΔh.",
        "formula": "ΔUg = mgΔh",
        "source": "The 2026-XJ Series",
        "cue": "U4 · 2:49–3:16 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Where does energy go?",
          "Keep accounts clear.",
          "Transforms into thermal.",
          "Does not disappear."
        ],
        "target": "u4.r5-heat-bridge",
        "fact": "Friction can transfer mechanical energy to thermal energy. Total energy is still conserved when all transfers are included.",
        "formula": "energy in = energy out + change stored",
        "source": "The 2026-XJ Series",
        "cue": "U4 · 2:49–3:16 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Same work, less time.",
          "Power goes higher.",
          "Joules every second.",
          "Watts in the wire."
        ],
        "target": "u4.k7-power",
        "fact": "Average power is energy transferred or work done per unit time. One watt is one joule per second.",
        "formula": "Pavg = W / Δt",
        "source": "The 2026-XJ Series",
        "cue": "U4 · 2:49–3:16 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  },
  {
    "id": "unit-5",
    "title": "Heat on the Beat",
    "unit": "Thermal Physics & the Second Law",
    "color": "#ff8f97",
    "icon": "♨",
    "hook": "Where does all that energy go? Heat, work, and what changes.",
    "verses": [
      {
        "chunks": [
          "Temperature and heat.",
          "Not the same thing.",
          "Heat is a transfer.",
          "Let that bell ring."
        ],
        "target": "u5.anchor-heat-vs-temp",
        "fact": "Temperature characterizes thermal state. Heat is energy transferred because of a temperature difference; it is not a substance stored inside an object.",
        "formula": "heat = energy in transit",
        "source": "The 2026-XJ Series",
        "cue": "U5 · 3:16–3:43 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Mass times heat capacity.",
          "Temperature change.",
          "Q equals m c delta T.",
          "Now rearrange."
        ],
        "target": "u5.k1-specific-heat",
        "fact": "For a temperature change without a phase change and approximately constant specific heat, Q = mcΔT.",
        "formula": "Q = mcΔT",
        "source": "The 2026-XJ Series",
        "cue": "U5 · 3:16–3:43 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Touch: conduction.",
          "Flow: convection.",
          "Waves: radiation.",
          "Make the connection."
        ],
        "target": "u5.k2-transfer-modes",
        "fact": "Conduction transfers energy through microscopic interactions; convection involves bulk fluid motion; radiation uses electromagnetic waves.",
        "formula": "conduction · convection · radiation",
        "source": "The 2026-XJ Series",
        "cue": "U5 · 3:16–3:43 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Melting takes energy.",
          "Temperature stays.",
          "At fixed pressure.",
          "Through the phase."
        ],
        "target": "u5.k3-latent-heat",
        "fact": "A pure substance can absorb energy during melting at fixed pressure while its temperature stays constant.",
        "formula": "Q = mL",
        "source": "The 2026-XJ Series",
        "cue": "U5 · 3:16–3:43 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Heat added in.",
          "Work done out.",
          "Changes stored energy.",
          "That is the route."
        ],
        "target": "u5.k5-first-law",
        "fact": "With Q positive into the system and W positive for work done by the system, the first law is ΔU = Q − W.",
        "formula": "ΔU = Q − W",
        "source": "The 2026-XJ Series",
        "cue": "U5 · 3:16–3:43 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Heat flows hot to cold.",
          "On its own.",
          "A fridge needs work.",
          "To reverse that zone."
        ],
        "target": "u5.r1-second-law",
        "fact": "Spontaneous heat transfer goes from hotter to colder. Moving heat from cold to hot requires external work, as in a refrigerator.",
        "formula": "hot → cold (spontaneous heat transfer)",
        "source": "The 2026-XJ Series",
        "cue": "U5 · 3:16–3:43 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  },
  {
    "id": "unit-6",
    "title": "Wave After Wave",
    "unit": "Waves, Sound & Light",
    "color": "#72e5e0",
    "icon": "≈",
    "hook": "How do we actually know? Echo delay gives distance.",
    "verses": [
      {
        "chunks": [
          "Waves carry energy.",
          "Across the floor.",
          "Medium oscillates.",
          "Hear the roar."
        ],
        "target": "u6.anchor-energy-not-matter",
        "fact": "A mechanical wave transports energy while particles of the medium oscillate about equilibrium rather than traveling along with the wave.",
        "formula": "energy travels · particles oscillate",
        "source": "The 2026-XJ Series",
        "cue": "U6 · 3:43–4:10 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Cycles each second.",
          "Frequency in hertz.",
          "Higher sound frequency.",
          "Higher pitch works."
        ],
        "target": "u6.k1-wave-anatomy",
        "fact": "Frequency counts cycles per second. For a simple tone, higher frequency corresponds to higher perceived pitch.",
        "formula": "f = 1 / T",
        "source": "The 2026-XJ Series",
        "cue": "U6 · 3:43–4:10 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Frequency times wavelength.",
          "Wave speed in play.",
          "v equals f lambda.",
          "Ride that wave."
        ],
        "target": "u6.k2-wave-equation",
        "fact": "Wave speed equals frequency times wavelength. At fixed speed, increasing frequency decreases wavelength.",
        "formula": "v = fλ",
        "source": "The 2026-XJ Series",
        "cue": "U6 · 3:43–4:10 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Air squeezes together.",
          "Then spreads away.",
          "Longitudinal sound.",
          "That is our way."
        ],
        "target": "u6.k6-sound-longitudinal",
        "fact": "Sound in air is a longitudinal pressure wave with compressions and rarefactions. It requires a medium.",
        "formula": "compressions ↔ rarefactions",
        "source": "The 2026-XJ Series",
        "cue": "U6 · 3:43–4:10 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Crests meet crests.",
          "Waves combine.",
          "Crest meets a trough.",
          "Subtract that line."
        ],
        "target": "u6.r1-interference",
        "fact": "In linear superposition, displacements add. In-phase equal waves reinforce; opposite-phase equal waves can cancel.",
        "formula": "ytotal = y₁ + y₂",
        "source": "The 2026-XJ Series",
        "cue": "U6 · 3:43–4:10 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "How do we know?",
          "Radar out and back.",
          "Echo delay gives distance.",
          "Half of c times that."
        ],
        "target": "u6.r5-radar-chain",
        "fact": "For a reflected radar pulse, round-trip travel time gives distance d = cΔt/2. Divide by two because the pulse travels out and back.",
        "formula": "d = cΔt / 2",
        "source": "The 2026-XJ Series",
        "cue": "U6 · 3:43–4:10 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  },
  {
    "id": "unit-7",
    "title": "Close the Circuit",
    "unit": "Electricity & Magnetism",
    "color": "#9bbcff",
    "icon": "⏚",
    "hook": "What protects us — and what can we build? Close the circuit.",
    "verses": [
      {
        "chunks": [
          "Like charges repel.",
          "Opposites pull near.",
          "An electric force.",
          "Make it clear."
        ],
        "target": "u7.k1-coulombs-law",
        "fact": "Like electric charges repel and opposite charges attract. For point charges the force magnitude follows an inverse-square law.",
        "formula": "|F| = k|q₁q₂| / r²",
        "source": "The 2026-XJ Series",
        "cue": "U7 · 4:10–4:37 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Voltage is energy.",
          "Per unit charge.",
          "Joules per coulomb.",
          "Small or large."
        ],
        "target": "u7.k3-voltage",
        "fact": "Potential difference is energy transferred per unit charge. One volt is one joule per coulomb.",
        "formula": "ΔV = ΔE / q",
        "source": "The 2026-XJ Series",
        "cue": "U7 · 4:10–4:37 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Charge passing through.",
          "Each second of time.",
          "That is the current.",
          "Amps in the rhyme."
        ],
        "target": "u7.k4-current",
        "fact": "Electric current is the rate of flow of charge across a cross-section.",
        "formula": "Iavg = Δq / Δt",
        "source": "The 2026-XJ Series",
        "cue": "U7 · 4:10–4:37 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Ohmic resistor.",
          "Temperature steady.",
          "V equals I R.",
          "Circuit ready."
        ],
        "target": "u7.k5-ohms-law",
        "fact": "An ohmic resistor at constant temperature has voltage proportional to current, with resistance R.",
        "formula": "V = IR",
        "source": "The 2026-XJ Series",
        "cue": "U7 · 4:10–4:37 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Series: same current.",
          "One path to go.",
          "Parallel: same voltage.",
          "Branch currents flow."
        ],
        "target": "u7.s2-parallel-circuits",
        "fact": "Components in series carry the same current. Parallel branches between the same two nodes share the same voltage.",
        "formula": "series: shared I · parallel: shared ΔV",
        "source": "The 2026-XJ Series",
        "cue": "U7 · 4:10–4:37 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Change magnetic flux.",
          "Voltage appears.",
          "Generator energy.",
          "Power the gears."
        ],
        "target": "u7.r1-faraday",
        "fact": "A changing magnetic flux induces an emf. A generator converts mechanical energy into electrical energy.",
        "formula": "emf = −N ΔΦ / Δt",
        "source": "The 2026-XJ Series",
        "cue": "U7 · 4:10–4:37 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  },
  {
    "id": "unit-8",
    "title": "Built to Roll",
    "unit": "The Car Project",
    "color": "#f4a7e3",
    "icon": "⚙",
    "hook": "Can you build what you’ve learned? Put a year of physics on wheels.",
    "verses": [
      {
        "chunks": [
          "Battery and switch.",
          "Motor and wire.",
          "Close the whole loop.",
          "Spin that tire."
        ],
        "target": "u8.k1-circuit-components",
        "fact": "A closed circuit connects the battery, switch, motor, and wires so current can flow.",
        "formula": "battery → switch → motor → battery",
        "source": "The 2026-XJ Series",
        "cue": "U8 · 4:37–5:04 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Chemical energy.",
          "Electrical flow.",
          "Motor turns wheels.",
          "Off we go."
        ],
        "target": "u8.k2-energy-chain",
        "fact": "Stored chemical energy in the battery becomes electrical transfer, rotational and translational kinetic energy, and thermal energy.",
        "formula": "chemical → electrical → motion + thermal",
        "source": "The 2026-XJ Series",
        "cue": "U8 · 4:37–5:04 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Gear the speed down.",
          "Torque can rise.",
          "Trade with rotation.",
          "Choose your prize."
        ],
        "target": "u8.k3-gear-relationship",
        "fact": "An ideal reduction gear lowers output angular speed and increases output torque, conserving power. Real gears have losses.",
        "formula": "τin ωin ≈ τout ωout",
        "source": "The 2026-XJ Series",
        "cue": "U8 · 4:37–5:04 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Same axle spin.",
          "Bigger wheels roll.",
          "More distance each turn.",
          "Speed is the goal."
        ],
        "target": "u8.r1-ratio-reasoning-wheels",
        "fact": "At fixed axle rotational speed and without slipping, larger wheel diameter gives more distance per turn and higher linear speed.",
        "formula": "v = πd × revolutions per second",
        "source": "The 2026-XJ Series",
        "cue": "U8 · 4:37–5:04 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Line up the axles.",
          "Balance the drag.",
          "Unequal friction.",
          "Turns our flag."
        ],
        "target": "u8.k4-veer-cause",
        "fact": "Asymmetric friction can create a torque about a vertical axis, making a car veer. Alignment helps reduce unwanted turning.",
        "formula": "unbalanced torque → change in rotation",
        "source": "The 2026-XJ Series",
        "cue": "U8 · 4:37–5:04 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      },
      {
        "chunks": [
          "Build what you learned.",
          "Measure the run.",
          "Explain the difference.",
          "A year of physics done."
        ],
        "target": "u8.r3-observation-vs-prediction",
        "fact": "Compare measured performance with your prediction. Use physics and evidence to explain differences and guide the next design change.",
        "formula": "predict → measure → explain → improve",
        "source": "The 2026-XJ Series",
        "cue": "U8 · 4:37–5:04 · unit introduction",
        "sourceKind": "Unit introduction + course learning target"
      }
    ]
  }
];});
