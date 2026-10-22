import type { LessonContent } from './lesson-contract'
export const oscillationLessons = {
  "hooke": {
    "title": "Hooke’s law revisited",
    "heading": "Use a restoring force with the correct sign.",
    "subtitle": "Hooke’s law revisited",
    "target": "Use a restoring force with the correct sign.",
    "visual": "spring-oscillator",
    "paragraphs": [
      "Displace a mass attached to a spring and the spring acts to reduce its deformation. In a linear elastic range, the restoring force is F = −kx, with x measured from the appropriate equilibrium position. The minus sign means force opposes displacement. It does not mean force always points left or always opposes velocity.",
      "The constant k has units N/m and measures stiffness. A graph of the applied force needed to stretch an ideal spring quasistatically rises linearly with extension. The work required is the area under that graph: U = ½kx². Using kx² would count twice the work because the force increases gradually from zero.",
      "For a vertical oscillator, gravity shifts the equilibrium extension. Measuring x from that new equilibrium makes the combined restoring force proportional to −x. The support force and gravity have not disappeared; their constant contributions balance at equilibrium. For a horizontal ideal oscillator, the relevant displacement can be measured from the spring's unstretched position.",
      "Hooke's law is a model, not a rule for unlimited deformation. Real springs can become nonlinear, permanently deform, or fail. In the explorer, compare the force sign with displacement on either side of equilibrium. Explain why the mass can be moving one way while the restoring force points the other way, and why it passes through equilibrium instead of stopping there."
    ],
    "terms": [
      [
        "restoring force",
        "A force component directed toward stable equilibrium."
      ],
      [
        "spring constant",
        "The proportionality between restoring-force magnitude and displacement in a linear spring."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A spring with k = 80 N/m is displaced +0.05 m. Find its restoring force and stored energy.",
      "reasoning": "F = −4 N and U = 0.10 J. Force has a direction; stored elastic energy is nonnegative relative to equilibrium."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A mass left of equilibrium is moving left. The spring’s restoring force points…",
      "options": [
        "Left, with the velocity",
        "Right, toward equilibrium",
        "Nowhere because it is moving"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "Restoring force opposes displacement, not necessarily velocity.",
        "Correct: x is negative, so −kx is positive.",
        "Motion does not eliminate the spring force."
      ],
      "teacher": "F = −4 N and U = 0.10 J. Force has a direction; stored elastic energy is nonnegative relative to equilibrium. Ask the student to compare a limiting case and explain its meaning."
    }
  },
  "period": {
    "title": "Period and frequency",
    "heading": "Count complete cycles before taking a reciprocal.",
    "subtitle": "Period and frequency",
    "target": "Count complete cycles before taking a reciprocal.",
    "visual": "wave-travel",
    "paragraphs": [
      "Periodic motion repeats its state after an interval T called the period. A full oscillation returns both position and direction of motion to their starting values. Passing equilibrium twice can occur within one cycle, so counting every crossing as a new cycle overestimates frequency.",
      "If N complete cycles take time Δt, the frequency is f = N/Δt and the period is T = Δt/N. Therefore fT = 1. Frequency is measured in hertz, equivalent to inverse seconds. Angular frequency ω = 2πf instead counts radians of phase per second; it has a different numerical value from f for the same physical motion.",
      "Timing many cycles can reduce the relative influence of starting and stopping uncertainty. If a stopwatch measurement of ten cycles is uncertain by 0.2 s, dividing by ten gives a smaller uncertainty in the estimated single-cycle period than directly timing one cycle with the same reaction uncertainty. Repeated measurements help reveal variability but do not automatically remove a systematic timing bias.",
      "Use the wave trace as a periodic clock at a fixed location. A snapshot across positions is a different measurement and gives wavelength. Before using v = fλ, identify which observations supply time and distance. The equations connect those observations only when they describe the same repeating wave component."
    ],
    "terms": [
      [
        "hertz",
        "One complete cycle per second."
      ],
      [
        "angular frequency",
        "Rate of phase advance in radians per second, equal to 2πf."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A mass makes 20 complete oscillations in 8 s.",
      "reasoning": "f = 2.5 Hz and T = 0.40 s. The angular frequency is 5π rad/s, not 2.5 rad/s."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "An oscillator crosses equilibrium 10 times during 5 complete cycles. Counted cycles are…",
      "options": [
        "10",
        "5",
        "20"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "There are two crossings per complete cycle.",
        "Correct: direction of motion must repeat too.",
        "Counting half-cycles and then doubling overcounts further."
      ],
      "teacher": "f = 2.5 Hz and T = 0.40 s. The angular frequency is 5π rad/s, not 2.5 rad/s. Ask the student to compare a limiting case and explain its meaning."
    }
  },
  "shm": {
    "title": "Simple harmonic motion",
    "heading": "Relate displacement, velocity, and acceleration.",
    "subtitle": "Simple harmonic motion",
    "target": "Relate displacement, velocity, and acceleration.",
    "visual": "spring-oscillator",
    "paragraphs": [
      "A repeating motion is simple harmonic when its net restoring acceleration is proportional to displacement and directed toward equilibrium: a = −ω²x. An ideal linear spring and fixed mass provide this relation with ω = √(k/m). Not every periodic motion is simple harmonic; the restoring relationship matters.",
      "A useful solution is x = A cos(ωt + φ). The amplitude A sets the largest displacement and the phase φ describes the starting state. Differentiating gives v = −Aω sin(ωt + φ) and a = −Aω² cos(ωt + φ). These quantities do not reach their maximum magnitudes at the same time.",
      "At either endpoint, speed is zero while acceleration has maximum magnitude toward equilibrium. At the center, acceleration is zero while speed has magnitude Aω. The period T = 2π√(m/k) is independent of amplitude only within the ideal linear model. Doubling amplitude doubles maximum speed and acceleration without changing that model period.",
      "Advance the phase in the explorer and compare signed numerical values with the drawing. Identify a quarter-cycle step before checking its result. A snapshot of displacement alone does not determine the sign of velocity; the mass can pass the same interior position in either direction. The phase or an additional observation resolves that ambiguity."
    ],
    "terms": [
      [
        "simple harmonic motion",
        "Motion with acceleration proportional to and opposite displacement from equilibrium."
      ],
      [
        "phase",
        "A parameter specifying position within an oscillation cycle."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An ideal oscillator has A = 0.10 m and ω = 4 rad/s.",
      "reasoning": "Its maximum speed is 0.40 m/s and maximum acceleration magnitude is 1.6 m/s². Speed is maximum at equilibrium, acceleration at the endpoints."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At maximum positive displacement, velocity and acceleration are…",
      "options": [
        "Both positive maxima",
        "Zero velocity and negative acceleration",
        "Both zero"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "The object is turning around, not moving fastest.",
        "Correct: it is instantaneously at rest and accelerates toward equilibrium.",
        "Zero acceleration would not turn the mass back."
      ],
      "teacher": "Its maximum speed is 0.40 m/s and maximum acceleration magnitude is 1.6 m/s². Speed is maximum at equilibrium, acceleration at the endpoints. Ask the student to compare a limiting case and explain its meaning."
    }
  },
  "energy": {
    "title": "Energy in an oscillator",
    "heading": "Follow one conserved total through a cycle.",
    "subtitle": "Energy in an oscillator",
    "target": "Follow one conserved total through a cycle.",
    "visual": "oscillator-energy",
    "paragraphs": [
      "In an ideal horizontal mass-spring system, mechanical energy shifts between kinetic energy K = ½mv² and elastic potential energy U = ½kx². At maximum displacement A, all of this model's energy is elastic: E = ½kA². At equilibrium, U is zero with this reference and kinetic energy is maximum.",
      "At an intermediate position, K = ½k(A² − x²). This gives the speed magnitude √((k/m)(A² − x²)); the sign of velocity still depends on the direction of motion. A square root of the energy relation cannot by itself distinguish the outward and return parts of the cycle.",
      "Doubling amplitude quadruples total energy at fixed k. Doubling mass at fixed k and A leaves total energy unchanged but lowers the maximum speed, because the same kinetic energy is distributed over more mass. The period then changes even though the energy total does not.",
      "Move through the explorer and check that the two bars always sum to the same total. Friction and drag would transfer mechanical energy into internal energy and surroundings, causing amplitude to decline. That process conserves total energy of a sufficiently broad system while reducing the mechanical-energy account. Distinguish a chosen account from the total energy of everything involved."
    ],
    "terms": [
      [
        "elastic potential energy",
        "Energy associated with reversible elastic deformation."
      ],
      [
        "mechanical energy",
        "The sum of kinetic and potential energy in the chosen mechanical model."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "At x = A/2, what fraction of an ideal oscillator’s total energy is elastic?",
      "reasoning": "U/E = x²/A² = 1/4, leaving 3/4 as kinetic energy. Half the displacement does not mean half the energy."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Double amplitude at fixed spring constant. Total oscillator energy…",
      "options": [
        "Doubles",
        "Quadruples",
        "Halves"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "Energy depends on amplitude squared.",
        "Correct: E = ½kA².",
        "A larger excursion stores more elastic energy."
      ],
      "teacher": "U/E = x²/A² = 1/4, leaving 3/4 as kinetic energy. Half the displacement does not mean half the energy. Ask the student to compare a limiting case and explain its meaning."
    }
  },
  "circle": {
    "title": "Circular motion and simple harmonic motion",
    "heading": "Project a constant-speed circle onto one axis.",
    "subtitle": "Circular motion and simple harmonic motion",
    "target": "Project a constant-speed circle onto one axis.",
    "visual": "circle-projection",
    "paragraphs": [
      "A point traveling uniformly around a circle has a changing horizontal coordinate even though its speed around the circle is constant. If the circle has radius A and angular speed ω, the projection on a diameter is x = A cos(ωt + φ). That projection follows simple harmonic motion.",
      "The circle is a mathematical construction. A real mass on a spring need not travel around any circle, and its speed along a line is not constant. The projection moves slowly near the ends of the diameter and fastest across the center because the circular velocity has a changing component along the chosen axis.",
      "Centripetal acceleration points toward the center with magnitude ω²A. Its horizontal component is −ω²x, the defining acceleration for simple harmonic motion. The geometric projection therefore connects the position, velocity, and acceleration equations in one picture. One revolution advances phase by 2π and corresponds to one oscillation period.",
      "Rotate the point using the phase control. Compare the circular point and its horizontal projection, then read the normalized x, v, and a values. At a quarter turn from the rightmost point, x is zero while the projection moves left fastest. State which quantity is a coordinate and which is a magnitude before interpreting a negative value."
    ],
    "terms": [
      [
        "projection",
        "The component or coordinate of a geometric object along a chosen direction."
      ],
      [
        "phase angle",
        "An angular representation of progress through a cycle."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A point starts at the rightmost side of a circle and rotates counterclockwise through a quarter turn.",
      "reasoning": "The horizontal projection reaches equilibrium moving left. Its x is zero, horizontal speed magnitude is maximum, and horizontal acceleration is zero."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does the projected point have constant speed?",
      "options": [
        "Yes, because the circular point does",
        "No, its component velocity varies",
        "Only if the radius is nonzero"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "A constant vector magnitude can have changing components.",
        "Correct: projection changes the motion being measured.",
        "A nonzero radius still gives changing projected speed."
      ],
      "teacher": "The horizontal projection reaches equilibrium moving left. Its x is zero, horizontal speed magnitude is maximum, and horizontal acceleration is zero. Ask the student to compare a limiting case and explain its meaning."
    }
  },
  "damping": {
    "title": "Damped harmonic motion",
    "heading": "Explain where the mechanical energy goes.",
    "subtitle": "Damped harmonic motion",
    "target": "Explain where the mechanical energy goes.",
    "visual": "damping-wave",
    "paragraphs": [
      "A plucked string gradually becomes quiet because energy leaves its organized motion. Air drag, internal friction, and radiation of sound can all contribute. Damping reduces mechanical energy without violating conservation of energy for the system and surroundings together.",
      "A common linear model uses a resistive force −bv. The equation is m ẍ + b ẋ + kx = 0. Define ω₀ = √(k/m) and damping ratio ζ = b/(2√(mk)). For ζ below one, the response is underdamped: it oscillates while an exponential envelope decays. Its damped angular frequency is ω₀√(1 − ζ²).",
      "At ζ = 1, critical damping separates oscillatory and nonoscillatory responses. For a release from rest on one side, it returns toward equilibrium without crossing and does so faster than an overdamped response with ζ greater than one. Different initial velocities can change crossing behavior, so always state the starting conditions rather than treating a sketch as universal.",
      "The explorer compares exact linear-model responses for x(0) = A and v(0) = 0. Time is normalized as ω₀t, letting systems with different natural frequencies share a comparison. Increase damping and describe both oscillation and settling. An underdamped system can cross equilibrium quickly yet keep overshooting; first arrival and remaining near equilibrium are different measures."
    ],
    "terms": [
      [
        "damping ratio",
        "Damping strength relative to the critical value in a linear oscillator."
      ],
      [
        "critical damping",
        "The boundary between oscillatory and nonoscillatory free responses."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A system released from rest returns without repeated overshoot, but much more slowly as damping increases beyond critical.",
      "reasoning": "That is the overdamped regime. Additional resistance suppresses oscillation but can delay relaxation."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does stronger damping always make settling faster?",
      "options": [
        "Yes",
        "No, excessive damping can slow the return",
        "Damping never changes motion"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "That overlooks the overdamped regime.",
        "Correct: compare complete relaxation, not just suppression of oscillation.",
        "The resistive force changes both motion and energy transfer."
      ],
      "teacher": "That is the overdamped regime. Additional resistance suppresses oscillation but can delay relaxation. Ask the student to compare a limiting case and explain its meaning."
    }
  },
  "intensity": {
    "title": "Energy in waves: intensity",
    "heading": "Separate spreading from absorption.",
    "subtitle": "Energy in waves: intensity",
    "target": "Separate spreading from absorption.",
    "visual": "sound-level",
    "paragraphs": [
      "A wave can transfer energy through a surface. Average intensity is the transferred power divided by area, I = P/A, measured in W/m². The direction and orientation of the surface matter: we usually choose an area perpendicular to propagation when quoting a simple intensity.",
      "For a sinusoidal wave in a fixed linear medium at fixed frequency, intensity grows as amplitude squared. On a uniform string, average power is ½μvω²A². For a plane sound wave, average intensity is pmax²/(2ρv), or prms²/(ρv). These formulas use different amplitudes, so identify whether the supplied quantity is displacement or pressure and whether it is peak or rms.",
      "Even with no absorption, energy can spread over a growing area. A source radiating equally in all directions has I = P/(4πr²). At twice the radius, the area is four times as large and intensity is one quarter. The total power through each complete sphere stays the same. Absorption would reduce that total as energy transfers to the medium.",
      "Use the level explorer to connect intensity ratios with distance ratios. Its logarithmic display is a convenient comparison, but the energy account remains linear in power. A room, a narrow beam, or a guided string wave does not automatically follow spherical spreading. Choose the geometry before applying an inverse-square law, and check that the area in your model matches the physical pathway."
    ],
    "terms": [
      [
        "wave intensity",
        "Average wave power passing through unit area."
      ],
      [
        "inverse-square spreading",
        "Reduction proportional to 1/r² when fixed power spreads uniformly over spherical surfaces."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An isotropic source emits 4π W. Find intensity at 1 m and 2 m without absorption.",
      "reasoning": "At 1 m, I = 1 W/m². At 2 m, I = 0.25 W/m². Both complete spheres carry 4π W."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Where did the missing local intensity go when distance doubled without absorption?",
      "options": [
        "Energy was destroyed",
        "The same power spread over a larger area",
        "The source frequency had to decrease"
      ],
      "correct": 1,
      "hint": "Use a signed displacement, define equilibrium, and state the assumptions of the model.",
      "feedback": [
        "Power through the entire sphere remains conserved.",
        "Correct: compare local intensity with total power.",
        "Geometric spreading does not require a frequency change."
      ],
      "teacher": "At 1 m, I = 1 W/m². At 2 m, I = 0.25 W/m². Both complete spheres carry 4π W. Ask the student to compare a limiting case and explain its meaning."
    }
  }
} satisfies Record<string, LessonContent>
