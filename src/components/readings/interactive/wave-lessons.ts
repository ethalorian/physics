import type { LessonContent } from './lesson-contract'
export const waveLessons = {
  "pendulum": {
    "title": "Vibration of a pendulum",
    "heading": "Predict a period from length and gravity.",
    "subtitle": "Vibration of a pendulum",
    "target": "Predict a period from length and gravity.",
    "visual": "pendulum-wave",
    "paragraphs": [
      "A pendulum repeats a journey: from one extreme, through the bottom, to the other extreme, and back. The period T is the time for that whole cycle. The trip from one side to the other is only half a period. At the bottom the bob has its greatest speed; at either turning point its speed is momentarily zero.",
      "For a small bob on a light, inextensible string, small-angle motion is approximately simple harmonic. The tangential component of gravity points back toward equilibrium. For small angles sin θ ≈ θ in radians, giving T = 2π√(L/g). Length is measured from the pivot to the bob's center. Mass cancels from the gravitational force and inertia, so changing mass alone does not change this ideal period.",
      "Quadrupling length doubles the period. Moving the same pendulum to a place with weaker gravity also lengthens its period. Increasing the release angle slightly has little effect only within the small-angle approximation; large swings take longer than this formula predicts. Air resistance and friction eventually reduce the amplitude.",
      "Move through a cycle in the model. Distinguish the bob's position from the elapsed time. The drawn angle is small and the string length is magnified to fit the display. Predict a period ratio before calculating it, and state what must remain unchanged for your comparison to hold."
    ],
    "terms": [
      [
        "period",
        "Time required for one complete repeating cycle."
      ],
      [
        "simple pendulum",
        "An ideal small bob on a light inextensible support, moving under gravity."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare pendulums of length 1 m and 4 m at the same g and small amplitude.",
      "reasoning": "The longer pendulum has twice the period because T is proportional to √L; changing mass would not change this ideal result."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Double the bob’s mass at fixed length, g, and small amplitude. The period…",
      "options": [
        "Doubles",
        "Halves",
        "Stays the same"
      ],
      "correct": 2,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "Mass also increases inertia, canceling its effect on the restoring acceleration.",
        "A heavier bob is not faster in this ideal model.",
        "Correct: mass cancels in the small-angle pendulum equation."
      ],
      "teacher": "The longer pendulum has twice the period because T is proportional to √L; changing mass would not change this ideal result. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "description": {
    "title": "Wave description",
    "heading": "Read distance and time from different graphs.",
    "subtitle": "Wave description",
    "target": "Read distance and time from different graphs.",
    "visual": "wave-travel",
    "paragraphs": [
      "A wave pattern can repeat in space and in time. A snapshot showing displacement against position tells you the wavelength λ: the distance between neighboring points in the same phase, such as crest to crest. A time trace at one fixed location tells you the period T. Confusing these graphs can turn a distance into a time without any physical justification.",
      "Amplitude is the largest displacement from equilibrium, not the full crest-to-trough height. For a sinusoidal wave that full height is 2A. The frequency f counts complete cycles per second and is measured in hertz. Period and frequency are reciprocals: f = 1/T. Ten cycles in two seconds means 5 Hz and a period of 0.20 s.",
      "A steadily vibrating source can launch a periodic wave. A single brief disturbance instead launches a pulse, which need not have one repeating frequency. Waves need not be perfect sine curves; a complex pattern can be described as a combination of simpler oscillations within a linear model.",
      "The explorer shows displacement along a string at a chosen instant. Advance the phase and watch a highlighted material point. Count cycles using its repeated motion, and measure wavelength along the horizontal position axis. Changing amplitude alters height without necessarily changing wavelength, frequency, or speed."
    ],
    "terms": [
      [
        "amplitude",
        "Maximum displacement from equilibrium in an oscillation."
      ],
      [
        "wavelength",
        "Distance between neighboring points with the same phase."
      ],
      [
        "frequency",
        "Number of complete cycles per second."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A string point completes 12 cycles in 3 s. Find f and T.",
      "reasoning": "f = 12/3 = 4 Hz, so T = 1/4 = 0.25 s. A position snapshot is needed to measure wavelength."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Crest-to-trough height is 8 cm. What is the amplitude?",
      "options": [
        "8 cm",
        "4 cm",
        "16 cm"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "That measures two amplitudes.",
        "Correct: equilibrium lies halfway between crest and trough.",
        "Doubling the full height moves farther from the definition."
      ],
      "teacher": "f = 12/3 = 4 Hz, so T = 1/4 = 0.25 s. A position snapshot is needed to measure wavelength. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "motion": {
    "title": "Wave motion",
    "heading": "Follow the disturbance and one material point.",
    "subtitle": "Wave motion",
    "target": "Follow the disturbance and one material point.",
    "visual": "wave-particles",
    "paragraphs": [
      "Tie a bright marker to a stretched rope and send a gentle pulse along it. The pulse travels from your hand to the far end, but the marker mainly moves up and down near its original location. The pattern carries energy along the rope without requiring each bit of rope to make the whole journey.",
      "Neighboring pieces of the medium interact. A displaced rope segment exerts forces on adjacent segments; those segments accelerate and pass the disturbance onward. Energy alternates between motion and deformation locally while the disturbance spreads. A traveling sound wave likewise transfers energy through pressure forces without requiring a wind from the speaker to the listener.",
      "This description is a small-amplitude idealization. Real water waves can produce a slow net particle drift, currents can carry matter, and breaking waves transport water dramatically. Distinguishing wave propagation from bulk flow is more accurate than claiming that no wave can ever move any matter. Electromagnetic waves are different again: they can propagate through a vacuum without a material medium.",
      "Use the marked particle in the explorer as a local observer. Advance the phase while tracking a crest separately. The two motions tell different stories. To explain energy transfer, identify the interactions that connect neighboring locations; simply saying that the entire medium travels with the crest misses the mechanism."
    ],
    "terms": [
      [
        "medium",
        "Material through which a mechanical disturbance propagates."
      ],
      [
        "propagation",
        "The spread of a disturbance from one location to another."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A pulse takes 2 s to cross a 6 m rope. Must a marked rope segment move 6 m?",
      "reasoning": "No. The pulse speed is 3 m/s, while a rope segment oscillates locally. Propagation speed and particle velocity describe different motions."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A transverse crest moves right. What must a marked string point do?",
      "options": [
        "Travel right with the crest",
        "Oscillate perpendicular to the string’s propagation direction",
        "Remain motionless everywhere"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "That confuses pattern motion with material motion.",
        "Correct for the ideal transverse string wave.",
        "The string moves locally, except at special points such as standing-wave nodes."
      ],
      "teacher": "No. The pulse speed is 3 m/s, while a rope segment oscillates locally. Propagation speed and particle velocity describe different motions. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "speed": {
    "title": "Wave speed",
    "heading": "Use the medium to constrain frequency and wavelength.",
    "subtitle": "Wave speed",
    "target": "Use the medium to constrain frequency and wavelength.",
    "visual": "wave-travel",
    "paragraphs": [
      "During one period, a crest of a periodic traveling wave advances one wavelength. Therefore v = λ/T = fλ. The units agree: cycles per second times meters per cycle gives meters per second. This connects a time measurement at one location to a distance measurement across the pattern.",
      "For small waves on a uniform stretched string, v = √(F/μ), where F is tension and μ is mass per unit length. Greater tension strengthens the restoring interaction and increases speed. More inertia per unit length reduces speed. In ordinary air, sound speed is nearly independent of audible frequency when temperature and composition stay fixed.",
      "If a source vibrates twice as frequently while the wave speed remains unchanged, wavelength halves. The equation alone does not tell you what stays fixed: identify the medium and the change being made. At a stationary boundary, transmitted waves keep the driving frequency while wavelength adjusts to the new speed.",
      "Some media are dispersive, meaning wave speed depends on frequency. Water surface waves are an important example. The relation v = fλ still holds for a sinusoidal component's phase speed, but different components of a pulse can travel differently. Our string explorer assumes one constant propagation speed so that changing frequency isolates the wavelength response."
    ],
    "terms": [
      [
        "wave speed",
        "Rate at which a specified wave feature propagates."
      ],
      [
        "linear density",
        "Mass per unit length of a string or similar medium."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A wave travels at 12 m/s with frequency 3 Hz. The source changes to 6 Hz in the same nondispersive medium.",
      "reasoning": "Initially λ = 4 m; afterward λ = 2 m. Speed stays 12 m/s under the fixed-medium assumption."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At fixed wave speed, doubling frequency makes wavelength…",
      "options": [
        "Double",
        "Half as large",
        "Unchanged"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "Their product must remain the fixed speed.",
        "Correct: λ = v/f.",
        "Keeping both wavelength and speed fixed would also keep frequency fixed."
      ],
      "teacher": "Initially λ = 4 m; afterward λ = 2 m. Speed stays 12 m/s under the fixed-medium assumption. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "transverse": {
    "title": "Transverse waves",
    "heading": "Compare two perpendicular directions.",
    "subtitle": "Transverse waves",
    "target": "Compare two perpendicular directions.",
    "visual": "wave-particles",
    "paragraphs": [
      "Shake the end of a taut string vertically. A disturbance travels along the string while each small segment moves approximately vertically. The displacement is perpendicular to propagation, which defines a transverse mechanical wave. The word transverse describes a relationship between directions; it does not simply mean that a graph looks wavy.",
      "At a crest, the string segment is at its greatest upward displacement. It is not necessarily moving upward at that instant. In a sinusoidal traveling wave, its transverse velocity is zero at an extreme displacement, while it is fastest when crossing equilibrium. The crest itself continues moving along the string.",
      "The string's tension supplies the restoring forces needed to transmit this disturbance. Solids can also support shear waves because they resist changes in shape. Ordinary bulk fluids do not sustain static shear in the same way, although their surfaces can support waves with both vertical and horizontal particle motion.",
      "Light is transverse too, but its oscillating quantities are electric and magnetic fields, not a string or an invisible mechanical substance. In the particle model, select transverse motion and compare the marked particle's up-and-down path with the rightward pattern. Keep the two arrows conceptually separate when describing what a detector measures."
    ],
    "terms": [
      [
        "transverse wave",
        "A wave whose disturbance is perpendicular to propagation."
      ],
      [
        "crest",
        "A point of maximum positive displacement in a wave snapshot."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A string wave propagates east while the string moves north–south. Classify it.",
      "reasoning": "It is transverse because the disturbance is perpendicular to the direction the pattern travels."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does a crest’s rightward speed equal the marked particle’s upward speed?",
      "options": [
        "Always",
        "No, they describe different motions",
        "Only because both are zero"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "Pattern speed and local particle velocity are distinct quantities.",
        "Correct: one describes propagation; the other describes the medium’s motion.",
        "A traveling crest can move while its local particle is at a turning point."
      ],
      "teacher": "It is transverse because the disturbance is perpendicular to the direction the pattern travels. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "longitudinal": {
    "title": "Longitudinal waves",
    "heading": "Track compressions without transporting the whole medium.",
    "subtitle": "Longitudinal waves",
    "target": "Track compressions without transporting the whole medium.",
    "visual": "pressure-wave",
    "paragraphs": [
      "Push and pull the end of a long spring along its length. Regions of crowded coils and spread-out coils travel away from your hand. Each coil moves back and forth approximately parallel to propagation. That directional relationship defines a longitudinal wave.",
      "In air, a compression is a region where pressure and density exceed their equilibrium values. A rarefaction is a region where they are lower. Molecules have rapid random thermal motion as well as a much smaller organized oscillation associated with the sound. A pressure disturbance is not a line of molecules permanently marching from source to receiver.",
      "A sinusoidal graph of pressure versus position represents these changes with peaks and troughs. The vertical graph axis is pressure, so the drawn curve does not mean that air moves vertically. Particle displacement and pressure variation are also not the same field: for an ideal traveling sound wave, pressure depends on the spatial compression of displacement, with a quarter-cycle spatial offset.",
      "Advance the phase in the row of particles. A highlighted particle oscillates around its own equilibrium location while closely packed regions migrate. The model exaggerates displacement for visibility and shows one-dimensional organized motion rather than thermal trajectories. Use spacing, not the height of an invented air path, to identify compressions and rarefactions."
    ],
    "terms": [
      [
        "compression",
        "A region of above-equilibrium pressure and density in a longitudinal sound wave."
      ],
      [
        "rarefaction",
        "A region of below-equilibrium pressure and density."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A pressure graph has a high crest. Are the air particles physically stacked at that graph height?",
      "reasoning": "No. The graph height reports pressure. The air oscillates along the propagation direction; a compression has locally crowded particles."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A sound wave in air propagates right. Its organized particle motion is…",
      "options": [
        "Up and down",
        "Back and forth along the propagation direction",
        "A permanent rightward flow"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "That describes transverse motion.",
        "Correct: ordinary bulk sound in air is longitudinal.",
        "A sound wave can propagate without a steady wind."
      ],
      "teacher": "No. The graph height reports pressure. The air oscillates along the propagation direction; a compression has locally crowded particles. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "interference": {
    "title": "Interference",
    "heading": "Add signed disturbances at the same place and time.",
    "subtitle": "Interference",
    "target": "Add signed disturbances at the same place and time.",
    "visual": "wave-superposition",
    "paragraphs": [
      "Two small waves can occupy the same region. In a linear medium their displacements add algebraically at each position and instant: y = y₁ + y₂. Two upward disturbances reinforce one another, while an upward and downward disturbance can partially or completely cancel. This is superposition, and its resulting pattern is interference.",
      "Equal-amplitude sinusoidal waves traveling together reinforce most strongly when they are in phase. A phase difference of half a cycle gives complete cancellation if their amplitudes match. Other phase differences produce intermediate amplitudes. Unequal amplitudes cannot completely cancel everywhere, even at opposite phase.",
      "The waves continue propagating after a brief overlap; cancellation does not mean that matter or energy has vanished. Energy must be accounted for over the complete physical system, including kinetic energy, elastic energy, sources, boundaries, and neighboring regions. You cannot add two independently calculated intensities as though coherent waves never interact.",
      "Change relative phase in the explorer. Compare each thin component curve with the bold sum. Predict a point on the sum by adding signed heights rather than adding their magnitudes. The model assumes small disturbances and linear response; large waves in nonlinear media can distort, interact differently, or break."
    ],
    "terms": [
      [
        "superposition",
        "Algebraic addition of disturbances in a linear system."
      ],
      [
        "phase difference",
        "Relative position within the repeating cycles of two oscillations."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "At one point, one pulse displaces a string +3 cm and another −2 cm.",
      "reasoning": "The net displacement is +1 cm. Add signed values, not the two magnitudes."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Two identical waves are half a cycle out of phase. Their displacement sum is…",
      "options": [
        "Twice the amplitude",
        "Zero",
        "Unchanged from either wave"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "That requires matching phase.",
        "Correct, when their amplitudes match and the linear model applies.",
        "Opposite signed displacements cancel."
      ],
      "teacher": "The net displacement is +1 cm. Add signed values, not the two magnitudes. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "standing": {
    "title": "Standing waves",
    "heading": "Let boundaries choose the permitted patterns.",
    "subtitle": "Standing waves",
    "target": "Let boundaries choose the permitted patterns.",
    "visual": "standing-string",
    "paragraphs": [
      "A traveling wave reflects from the fixed end of a string. The reflected displacement reverses sign at that boundary. When equal waves of the same frequency travel in opposite directions, their superposition can form a standing pattern: locations of zero displacement stay fixed instead of following a crest along the string.",
      "Nodes are positions that remain at zero displacement. Antinodes have maximum oscillation amplitude. Adjacent nodes are half a wavelength apart, and a neighboring node and antinode are a quarter wavelength apart. Each string segment still moves between its local extremes; the word standing describes the pattern of amplitudes.",
      "For a string fixed at both ends, L = nλ/2 with positive integer n. Its allowed frequencies are fₙ = nv/(2L). The fundamental has one loop, and the second harmonic has two. Raising tension changes v and therefore changes every allowed frequency, while changing the driving frequency selects a different pattern only when boundary conditions can be satisfied.",
      "Choose a mode and advance the time phase in the explorer. Neighboring loops move in opposite directions, and their nodes remain stationary. Equal opposing traveling waves give no net time-averaged energy transport along the ideal standing pattern, although energy is stored and exchanged locally. Real driven strings need continuing input to replace losses."
    ],
    "terms": [
      [
        "node",
        "A position with zero oscillation amplitude in a standing wave."
      ],
      [
        "antinode",
        "A position with locally maximum oscillation amplitude."
      ],
      [
        "fundamental",
        "The lowest allowed oscillation frequency of a system."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A 2 m string fixed at both ends carries waves at 8 m/s. Find its fundamental and second harmonic.",
      "reasoning": "f₁ = 8/(2×2) = 2 Hz; f₂ = 4 Hz. Their wavelengths are 4 m and 2 m."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "The distance between adjacent displacement nodes is…",
      "options": [
        "One wavelength",
        "Half a wavelength",
        "A full period"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "There are two node spacings per wavelength.",
        "Correct for the sinusoidal standing wave.",
        "A period is a time, not a distance."
      ],
      "teacher": "f₁ = 8/(2×2) = 2 Hz; f₂ = 4 Hz. Their wavelengths are 4 m and 2 m. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "doppler": {
    "title": "The Doppler effect",
    "heading": "Distinguish emission rate from arrival rate.",
    "subtitle": "The Doppler effect",
    "target": "Distinguish emission rate from arrival rate.",
    "visual": "doppler-wave",
    "paragraphs": [
      "A moving siren can emit cycles at a steady rate while a stationary listener receives them at a different rate. Each new wavefront is centered at the source's position when it was emitted. When the source approaches, successive fronts have less distance to travel and arrive closer together. Recession stretches the arrival intervals.",
      "For a source moving directly toward a stationary observer through still air, fobs = f₀v/(v − vs), provided vs is below the sound speed v. For recession use v + vs in the denominator. The propagation speed through the undisturbed air remains set by the medium. The source changes the spacing of fronts, not the sound speed by pushing each front faster.",
      "A moving observer changes how quickly it encounters existing fronts. With source and observer speeds defined positive toward each other along their line, the classical result is fobs = f₀(v + vo)/(v − vs). These speeds are measured relative to the medium; wind and nonradial motion need appropriate treatment.",
      "The model isolates a moving source and fixed observers on either side. Increase source speed and compare front and rear spacings. Light also shows Doppler shifts, but has no air-like preferred medium; its quantitative relation is relativistic. Do not apply the sound formula to a vacuum light signal."
    ],
    "terms": [
      [
        "Doppler effect",
        "A change in observed frequency caused by relative motion of source and receiver."
      ],
      [
        "wavefront",
        "A surface joining points of equal phase in a propagating wave."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A 400 Hz source approaches a fixed listener at 34 m/s in air with v = 340 m/s.",
      "reasoning": "fobs = 400×340/(340−34) ≈ 444 Hz. The air-frame sound speed remains 340 m/s."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "An approaching source makes the received frequency higher because…",
      "options": [
        "Sound travels faster through the same air",
        "Successive fronts reach the listener closer together in time",
        "The source must vibrate faster"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "Propagation speed is held fixed in this model.",
        "Correct: compare arrival intervals with emission intervals.",
        "The source can keep the same emitted frequency."
      ],
      "teacher": "fobs = 400×340/(340−34) ≈ 444 Hz. The air-frame sound speed remains 340 m/s. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "bow": {
    "title": "Bow waves",
    "heading": "Find the envelope when a source outruns disturbances.",
    "subtitle": "Bow waves",
    "target": "Find the envelope when a source outruns disturbances.",
    "visual": "shock-cone",
    "paragraphs": [
      "Imagine a source making circular disturbances that all expand at one constant speed. If the source remains still, the circles share a center. If it moves more slowly than the disturbances, the circles shift but can still extend ahead. At the disturbance speed, the leading fronts gather at the source. Above that speed, the source moves beyond all earlier fronts.",
      "The expanding circles then share an envelope behind the source. In a two-dimensional nondispersive model, this envelope makes a V shape. Geometry gives sin μ = v/vs, where μ is the half-angle between the track behind the source and one side of the V. A faster source produces a narrower angle.",
      "This construction explains the idea of outrunning a disturbance. Actual boat wakes on deep water require more care: surface waves are dispersive and their familiar Kelvin wake pattern is not given directly by this simple constant-speed formula. Depth, speed, hull shape, and the waves carrying the strongest visible amplitude all matter.",
      "Use the model's ratio of source speed to disturbance speed. Compare the traveled source distance with the radius grown by an older front over the same elapsed time. The V is not a rigid object being towed. It is the continually renewed envelope of disturbances emitted at different positions along the path."
    ],
    "terms": [
      [
        "wave envelope",
        "A boundary tangent to a family of wavefronts."
      ],
      [
        "Mach number",
        "Source speed divided by the relevant sound speed, used here as an analogous speed ratio."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "In a constant-speed wave model, a source travels at twice the disturbance speed.",
      "reasoning": "sin μ = 1/2, so the half-angle is 30°. This is the nondispersive construction, not a universal boat-wake formula."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Increasing the source speed above the fixed wave speed makes the ideal V…",
      "options": [
        "Wider",
        "Narrower",
        "Disappear because waves stop"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "The ratio v/vs becomes smaller.",
        "Correct: the inverse-speed ratio reduces the half-angle.",
        "The moving source continues creating disturbances."
      ],
      "teacher": "sin μ = 1/2, so the half-angle is 30°. This is the nondispersive construction, not a universal boat-wake formula. Ask for a labeled comparison and the physical assumption behind it."
    }
  },
  "shock": {
    "title": "Shock waves",
    "heading": "Explain a boom that follows a moving source.",
    "subtitle": "Shock waves",
    "target": "Explain a boom that follows a moving source.",
    "visual": "shock-cone",
    "paragraphs": [
      "A body moving supersonically through air can produce shock waves: thin regions across which pressure, density, and temperature change sharply. Information carried by small disturbances in the undisturbed air cannot propagate ahead of a faster-moving body. A cone-like pattern trails the motion in the simplest geometric picture.",
      "For a weak disturbance in uniform flow, the Mach angle obeys sin μ = 1/M, with M = vs/v. Real finite-strength shocks can have different angles, and aircraft shapes generate a more complicated pressure history than a single ideal cone. The construction is a model of propagation geometry, not a calculation of boom loudness or structural loads.",
      "A sonic boom is heard when the pressure disturbance sweeps past a listener. It is not emitted only at the instant an aircraft first crosses Mach 1. An aircraft already traveling supersonically can carry its shock pattern across many successive observers. A moving body need not have a loudspeaker; displacing and compressing the air can generate the disturbance.",
      "Supersonic describes speed relative to sound speed. Ultrasonic describes a frequency above the conventional human hearing range. The two words answer different questions. Inspect how the cone angle changes with Mach number and explain why a listener beneath the flight path can hear the boom after the aircraft is already ahead."
    ],
    "terms": [
      [
        "shock wave",
        "A thin propagating region of abrupt changes in pressure and other fluid properties."
      ],
      [
        "sonic boom",
        "The sound associated with a supersonic pressure disturbance passing a listener."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An aircraft has flown supersonically for ten minutes before its shock reaches a new observer. Can that observer hear a boom?",
      "reasoning": "Yes. The shock pattern travels with the ongoing supersonic motion; the event is not confined to the first crossing of Mach 1."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Ultrasonic means…",
      "options": [
        "Faster than sound",
        "Higher in frequency than the conventional upper hearing limit",
        "A source with Mach number 2"
      ],
      "correct": 1,
      "hint": "Identify what oscillates, what travels, and which property is held fixed.",
      "feedback": [
        "That is supersonic.",
        "Correct: frequency and source speed are different quantities.",
        "Mach number compares speeds, not frequencies."
      ],
      "teacher": "Yes. The shock pattern travels with the ongoing supersonic motion; the event is not confined to the first crossing of Mach 1. Ask for a labeled comparison and the physical assumption behind it."
    }
  }
} satisfies Record<string, LessonContent>
