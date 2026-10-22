import type {LessonContent} from './lesson-contract'
export const magneticLessons = {
  "poles": {
    "title": "Magnetic poles",
    "heading": "Every piece of an ordinary bar magnet remains a dipole.",
    "subtitle": "Magnetic poles",
    "target": "Every piece of an ordinary bar magnet remains a dipole.",
    "visual": "mag-poles",
    "paragraphs": [
      "Bring two bar magnets near one another and the result depends on which ends face. Like poles repel; unlike poles attract. The north label means north-seeking: that end of a freely turning compass tends to point along the local magnetic field toward magnetic north. Pole labels describe magnetic orientation, not positive and negative electric charge.",
      "Cutting a bar magnet across its length produces two smaller magnets. Each piece has a north and south pole, including newly exposed ends at the cut. Repeating the cut does not isolate a north pole in one pile and a south pole in another. This differs from separating positive and negative electric charge. The model concerns ordinary magnets; it does not pretend to settle every theoretical proposal about magnetic monopoles.",
      "A magnet can also attract initially unmagnetized iron. The nearby field changes the iron’s domain arrangement, giving the nearer region an orientation that attracts it. Attraction alone therefore does not prove that an unknown object was already a permanent magnet. Reproducible repulsion provides a stronger test for a second magnet.",
      "Use the illustration to flip a second magnet or divide the first. Track the facing ends after every change. The arrows show the qualitative interaction, not a force-versus-distance calculation. Real force depends on geometry, separation, material, and magnetization, so pole labels alone do not determine its numerical magnitude."
    ],
    "terms": [
      [
        "magnetic pole",
        "A region of a magnet associated with its north-seeking or south-seeking behavior."
      ],
      [
        "magnetic dipole",
        "A magnetic arrangement with paired north and south behavior."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A bar magnet labeled S on the left and N on the right is cut at its center.",
      "reasoning": "The left piece is S–N and the right piece is S–N. The two new faces are opposite poles; neither piece is an isolated pole."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Cut an ordinary bar magnet in half. The result is…",
      "options": [
        "Two magnets, each with both poles",
        "One isolated north pole and one isolated south pole",
        "Two pieces with no magnetic field"
      ],
      "correct": 0,
      "feedback": [
        "Correct: each piece retains dipole behavior.",
        "Cutting separates material, not isolated magnetic poles.",
        "Smaller pieces can remain magnetized."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. each piece retains dipole behavior."
    }
  },
  "field": {
    "title": "Magnetic fields and field lines",
    "heading": "A compass shows the local direction of B.",
    "subtitle": "Magnetic fields and field lines",
    "target": "A compass shows the local direction of B.",
    "visual": "mag-field",
    "paragraphs": [
      "A magnetic field assigns a vector to each location. Its direction is the direction toward which the north end of a small compass tends to turn. Around a bar magnet the field points from north to south outside the magnet and returns through the magnet from south to north. Field lines therefore form continuous loops rather than terminating on isolated magnetic charges.",
      "A field-line drawing is a map. The tangent to a line gives local field direction; a denser set of consistently drawn lines represents stronger field. Lines are not tracks carved into space, and an object does not have to move along one. Lines for a nonzero field cannot cross because a single point cannot have two distinct resultant field directions.",
      "Small iron filings become magnetized and align with the field. Their visible pattern is useful, but individual filings also interact and do not provide a calibrated measurement of field magnitude. A compass supplies direction; a calibrated probe is needed for a quantitative field measurement. Both instruments can disturb a field if their influence is not negligible.",
      "Move the compass around the model and reverse the source magnet. The arrow turns tangent to the ideal dipole field. Compare points above, beside, and below the source rather than assuming every compass points directly toward one pole. The display is a two-dimensional slice of a three-dimensional field and omits Earth’s background field to isolate the source."
    ],
    "terms": [
      [
        "magnetic field",
        "A vector field describing magnetic interactions, conventionally denoted B."
      ],
      [
        "field line",
        "A curve tangent to the field direction at each point."
      ],
      [
        "tesla",
        "SI unit of magnetic field, equivalent to N/(A·m)."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A compass is above the middle of a horizontal magnet with S left and N right.",
      "reasoning": "The external field there points left, from the N side around toward S. The north end of the compass points left even though neither pole lies directly left of it."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Outside a bar magnet, a field line runs…",
      "options": [
        "From S toward N everywhere",
        "Only where iron filings have been placed",
        "From N toward S, returning through the magnet"
      ],
      "correct": 2,
      "feedback": [
        "The external direction is N to S; the internal return reverses that direction.",
        "The field exists even without filings or a compass.",
        "Correct: the complete field line is a closed loop."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the complete field line is a closed loop."
    }
  },
  "moment": {
    "title": "The nature of a magnetic field",
    "heading": "Microscopic magnetic moments can reinforce or cancel.",
    "subtitle": "The nature of a magnetic field",
    "target": "Microscopic magnetic moments can reinforce or cancel.",
    "visual": "mag-moments",
    "paragraphs": [
      "A current in a wire produces a magnetic field. Matter also has magnetic behavior associated with microscopic motion and intrinsic properties of particles. An electron has an intrinsic magnetic moment associated with spin, and orbital angular momentum can contribute to an atom’s magnetic moment. These are quantum properties; an electron is not literally a tiny classical ball spinning about its surface.",
      "A small current loop provides a helpful classical analogy for a magnetic dipole. Its field has paired north and south behavior, and an external field can exert a torque tending to align its magnetic moment. The analogy captures direction and alignment without claiming that an atomic electron follows a visible planetary orbit.",
      "Different magnetic contributions can cancel. In many atoms, paired electron contributions largely oppose one another. Some atoms retain a net magnetic moment, but that alone does not guarantee that an entire sample becomes a permanent magnet. The arrangement and interactions of many atoms matter too. Ferromagnetic order arises from cooperative quantum interactions, not merely from adding a collection of independent spinning tops.",
      "Compare equal moments pointing together and opposite in the model. The net moment is their vector sum. Cancellation of the sample’s net moment does not mean each microscopic contribution vanished. This distinction helps explain how a piece of material can show little external field and still contain strongly magnetized regions that can reorganize when an external field is applied."
    ],
    "terms": [
      [
        "magnetic moment",
        "A vector describing the strength and orientation of a magnetic dipole."
      ],
      [
        "spin",
        "An intrinsic quantum angular momentum, not literal rotation of a tiny solid ball."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Two equal magnetic moments point in opposite directions.",
      "reasoning": "Their vector sum is zero in this model. Each contribution remains present even though their net moment cancels."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A sample with zero net moment must have…",
      "options": [
        "No possible response to an applied field",
        "No net vector sum; microscopic moments may remain",
        "No electrons"
      ],
      "correct": 1,
      "feedback": [
        "A field can change the arrangement or response of magnetic contributions.",
        "Correct: cancellation is different from absence.",
        "Electrons remain present in ordinary matter."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. cancellation is different from absence."
    }
  },
  "domains": {
    "title": "Magnetic domains",
    "heading": "Alignment changes the whole sample’s field.",
    "subtitle": "Magnetic domains",
    "target": "Alignment changes the whole sample’s field.",
    "visual": "mag-domains",
    "paragraphs": [
      "Within a ferromagnetic domain, many atomic magnetic moments share a common orientation. An unmagnetized piece of iron can contain strongly magnetized domains pointing in different directions. Their contributions largely cancel outside the sample. The phrase unmagnetized therefore describes the overall state, not a complete absence of microscopic magnetic order.",
      "An applied field can move domain boundaries and rotate magnetization. Favorably oriented domains grow at the expense of others, increasing the sample’s net moment. Some materials retain substantial magnetization after the field is removed; others lose much of it. Material composition, structure, and history affect that behavior, which is why an iron core and a permanent magnet need not respond identically.",
      "Temperature also matters. Above a ferromagnet’s Curie temperature, thermal effects destroy the long-range ferromagnetic order. The material may still have a weaker magnetic response; saying all magnetism disappears would be too broad. Mechanical disturbance and changing applied fields can also alter a domain pattern, but their effects depend on the material and conditions.",
      "The diagram groups moments into domains and lets their orientations become more aligned. It is a qualitative model, not a simulation of domain-wall motion or a measured hysteresis curve. Use it to explain why a magnet can attract a previously unmagnetized paper clip and why a long chain of clips can temporarily acquire magnetization from its neighbors."
    ],
    "terms": [
      [
        "magnetic domain",
        "A region of a ferromagnet with a common magnetization direction."
      ],
      [
        "ferromagnetism",
        "Cooperative magnetic ordering that can produce strong magnetization."
      ],
      [
        "Curie temperature",
        "Temperature above which a material loses its ferromagnetic order."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Two iron samples have the same amount of material, but one has more aligned domains.",
      "reasoning": "The more aligned sample has the larger net moment in this comparison. The number of atoms alone is insufficient to predict the external field."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Magnetizing iron primarily changes…",
      "options": [
        "The arrangement and relative sizes of magnetic domains",
        "Its total electric charge into north charge",
        "Every atom into a new chemical element"
      ],
      "correct": 0,
      "feedback": [
        "Correct: magnetic organization changes the net response.",
        "Magnetic pole labels are not a new kind of electric charge.",
        "Magnetization does not require changing chemical identity."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. magnetic organization changes the net response."
    }
  },
  "currentfield": {
    "title": "Electric currents and magnetic fields",
    "heading": "Reverse the current and reverse the surrounding field.",
    "subtitle": "Electric currents and magnetic fields",
    "target": "Reverse the current and reverse the surrounding field.",
    "visual": "mag-current",
    "paragraphs": [
      "A long straight current-carrying wire produces a magnetic field that circles the wire. Point the right thumb along conventional current; curled fingers give the field direction. Current out of the page gives a counterclockwise field as viewed on the page. Current into the page gives a clockwise field. The rule uses conventional current, which is opposite electron drift in a metal.",
      "Bending the wire into a loop makes contributions from its different parts reinforce near the center. Several similarly oriented turns reinforce further. A long coil, or solenoid, produces an approximately uniform field in its central interior. Its outside return field completes the field pattern, although it is much weaker away from the ends of a sufficiently long solenoid.",
      "An iron core can increase an electromagnet’s field through domain alignment. The increase is not unlimited or a universal constant: magnetic saturation and material history matter. An air-core model avoids those complications and makes the roles of current and geometry easier to compare. Ordinary coils also dissipate I²R heat; stronger current is not free of an energy cost.",
      "Switch among the wire, loop, and solenoid. The formulas apply at specified locations: distance r from a long wire, the center of a circular loop, and deep inside a long air-core solenoid. Do not use a loop-center formula at an arbitrary point outside the loop. Predict a reversal or scaling before changing the current."
    ],
    "terms": [
      [
        "electromagnet",
        "A magnet whose field is produced by electric current."
      ],
      [
        "solenoid",
        "A coil with many turns arranged along a length."
      ],
      [
        "right-hand rule",
        "A directional convention relating current and magnetic field or velocity and magnetic force."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Double current in the same air-core coil.",
      "reasoning": "The field doubles in the ideal linear model and reverses if current reverses. In a real resistive coil, doubling current also quadruples I²R heating."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A straight wire’s field lines are…",
      "options": [
        "Arrows pointing directly away from the wire",
        "Parallel to the current everywhere",
        "Circles around the wire"
      ],
      "correct": 2,
      "feedback": [
        "That resembles an electric field of a line charge, not this magnetic field.",
        "The straight wire’s magnetic field circles its axis.",
        "Correct: the direction is tangent to circles around the current."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the direction is tangent to circles around the current."
    }
  },
  "force": {
    "title": "Magnetic force on moving charges",
    "heading": "The magnetic force is sideways to motion.",
    "subtitle": "Magnetic force on moving charges",
    "target": "The magnetic force is sideways to motion.",
    "visual": "mag-force",
    "paragraphs": [
      "For a point charge q moving with velocity v in a magnetic field B, the magnetic force is F = q(v × B). Its magnitude is |q|vB sin θ, where θ is the angle between velocity and field. A stationary charge has no magnetic force, and motion parallel or antiparallel to B also gives zero magnetic force. Perpendicular motion gives the largest magnitude for fixed q, v, and B.",
      "Use a right-handed cross product for a positive charge and reverse the result for a negative charge. On the page, a dot represents a vector coming toward you and a cross represents a vector going away. Naming these directions prevents a memorized hand motion from replacing a physical argument. Reversing either charge sign or field reverses the force; reversing both leaves it unchanged.",
      "The magnetic force is perpendicular to instantaneous velocity, so its power F·v is zero. A magnetic field alone can bend a point particle’s path without increasing its kinetic energy. An electric field can do work and change the speed. Separate these effects when analyzing an accelerator, a motor, or an induction experiment.",
      "The model isolates a uniform magnetic field and one particle. It displays a selected instant, not the entire subsequent trajectory. When a parallel component of velocity is present, only the perpendicular component contributes to force. State all three directions before calculating a magnitude, and check that the proposed force cannot have a component along the particle’s velocity."
    ],
    "terms": [
      [
        "Lorentz force",
        "The electromagnetic force q(E + v × B) on a point charge."
      ],
      [
        "cross product",
        "A vector operation producing a direction perpendicular to both input vectors."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A positive charge moves right with B out of the page.",
      "reasoning": "Right × out points down, so the magnetic force is downward. A negative charge with the same velocity bends upward."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A magnetic field alone acts on a moving point charge. Its kinetic energy…",
      "options": [
        "Falls because every force removes energy",
        "Stays constant while direction may change",
        "Must increase whenever the path curves"
      ],
      "correct": 1,
      "feedback": [
        "Work depends on the component along displacement.",
        "Correct: the magnetic force does no work on the point charge.",
        "A perpendicular force changes direction without changing speed."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the magnetic force does no work on the point charge."
    }
  },
  "wire": {
    "title": "Magnetic force on current-carrying wires",
    "heading": "Use conventional current to predict the wire’s force.",
    "subtitle": "Magnetic force on current-carrying wires",
    "target": "Use conventional current to predict the wire’s force.",
    "visual": "mag-wire",
    "paragraphs": [
      "Moving charge carriers experience magnetic forces. In a conductor, interactions transfer their collective effect to the material, so an entire wire segment can feel a force. For a straight segment of length L in a uniform field, F = I(L × B), where L points along conventional current. The magnitude is ILB sin θ.",
      "Only the length within the specified field belongs in this simple expression. A long wire partly inside a magnet’s gap does not receive the same force over its unexposed length. B is the external field acting on the segment, not a recipe for making the wire push itself using its own field. More complicated wire shapes require combining the forces on their individual segments.",
      "Reverse the current or reverse the field and the force reverses. Reverse both and the original force returns. A wire parallel to the field has zero force in the ideal model, even while it carries current. The relationship lets a speaker coil respond to a varying current and lets a motor convert source energy into mechanical motion.",
      "The electrical source supplies energy when the wire does mechanical work. There is no contradiction with a magnetic force doing no work on an individual point charge: charges in a moving conductor respond to electric fields and constraints as well. The diagram separates current, external field, and force so that the energy source and direction argument remain visible."
    ],
    "terms": [
      [
        "magnetic force on a conductor",
        "Net force from the external magnetic field acting on current in the conductor."
      ],
      [
        "active length",
        "The portion of a conductor within the field used in the force calculation."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 0.40 m wire carries 3 A perpendicular to a 0.20 T field.",
      "reasoning": "F = ILB = 0.24 N. Halving the active length halves the force if current and field stay fixed."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A current-carrying wire parallel to uniform B experiences…",
      "options": [
        "Zero magnetic force in this model",
        "Its maximum magnetic force",
        "A force necessarily along the current"
      ],
      "correct": 0,
      "feedback": [
        "Correct: sin 0° = 0.",
        "Maximum force requires perpendicular current and field.",
        "Magnetic force is perpendicular to current and field."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. sin 0° = 0."
    }
  },
  "motor": {
    "title": "Meters and motors",
    "heading": "A force couple can turn a loop without translating it.",
    "subtitle": "Meters and motors",
    "target": "A force couple can turn a loop without translating it.",
    "visual": "mag-motor",
    "paragraphs": [
      "Opposite sides of a rectangular current loop carry opposite currents. In a uniform magnetic field, the forces on these sides can be equal and opposite, making the net force zero while producing a torque. Zero net force does not imply zero turning effect. A couple turns the loop because its forces act at different positions.",
      "For N turns of area A carrying current I, the magnetic moment has magnitude NIA. The torque magnitude is NIAB sin θ, with θ measured between the loop’s normal and B. The normal is perpendicular to the loop’s plane. Maximum torque occurs when that normal is perpendicular to B; zero torque occurs when they are aligned or opposed.",
      "A simple DC motor reverses coil current each half-turn using a commutator and brushes. The reversal preserves the torque’s rotational sense through successive half-turns. A single ideal loop still has zero-torque positions and may need an initial push there; real motors use additional design features and coils. Continuous rotation also depends on inertia and the applied load.",
      "A moving-coil meter instead turns against a spring until magnetic and spring torques balance. A shaped radial field can make deflection proportional to current over its operating range. The exploration compares fixed-current torque with commutated torque and shows a spring-balanced meter separately. It is a torque-versus-angle model, not a prediction of rotation speed without friction, inertia, and load information."
    ],
    "terms": [
      [
        "torque",
        "The turning effect of a force about an axis."
      ],
      [
        "commutator",
        "A switching arrangement that reverses coil connections during rotation."
      ],
      [
        "galvanometer",
        "A sensitive instrument that detects current through magnetic deflection."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "N = 50, I = 0.2 A, A = 0.01 m², B = 0.4 T. Find maximum torque.",
      "reasoning": "NIAB = 0.040 N·m, reached at a 90° angle between the loop normal and B. A net force of zero is compatible with this torque."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A simple motor reverses its coil current to…",
      "options": [
        "Eliminate every zero-torque position of a single loop",
        "Create energy without a power source",
        "Maintain the rotational sense of torque through successive half-turns"
      ],
      "correct": 2,
      "feedback": [
        "A single ideal loop still has zero-torque angles.",
        "The motor converts energy supplied electrically.",
        "Correct: commutation reverses the force pair as the coil crosses alignment."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. commutation reverses the force pair as the coil crosses alignment."
    }
  },
  "earth": {
    "title": "Earth’s magnetic field",
    "heading": "A compass follows local magnetic north, not necessarily true north.",
    "subtitle": "Earth’s magnetic field",
    "target": "A compass follows local magnetic north, not necessarily true north.",
    "visual": "mag-earth",
    "paragraphs": [
      "Earth’s geographic axis defines true north, while a compass aligns with the horizontal component of the local magnetic field. The angle between these directions is magnetic declination. The field can also tilt into or out of the ground; that angle is magnetic inclination. Neither angle is one fixed number for every location or date.",
      "Earth’s main field is sustained by dynamo action involving moving electrically conducting fluid in the outer core. It is not adequately explained as a permanent iron bar at Earth’s center. A dipole drawing is a useful approximation to the large-scale field, but it omits local structure and changes over time. Near the geographic north region, the field generally enters Earth, attracting the north-seeking end of a compass.",
      "Rocks can preserve a record of field direction when magnetic minerals acquire remanent magnetization. Alternating patterns on either side of an ocean ridge support the history of seafloor spreading and magnetic polarity reversals. The time intervals between reversals are irregular. A recent change in field strength cannot simply be extended as a straight-line countdown to the next reversal.",
      "Use the compass model to distinguish heading from declination, then compare the paired rock bands about the ridge. Its angles and band widths are illustrative, not a navigation forecast or a dated geological dataset. A strong explanation connects present direction measurements to the separate evidence recorded by older rocks."
    ],
    "terms": [
      [
        "magnetic declination",
        "Angle between true north and the horizontal magnetic-field direction."
      ],
      [
        "geodynamo",
        "Generation of Earth’s main magnetic field by motions of conducting fluid in its outer core."
      ],
      [
        "magnetic reversal",
        "A change in the dominant polarity of Earth’s field recorded in geologic history."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "At an illustrative location, magnetic north lies 12° east of true north.",
      "reasoning": "A compass pointing magnetic north has a true heading of 12°. The offset is a local declination, not a rotation of Earth’s geographic axis."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A decrease in field strength proves a reversal will occur on a fixed schedule.",
      "options": [
        "True; a compass directly dates the next reversal",
        "False; reversals are irregular and a trend is not a countdown",
        "True; all reversals are equally spaced"
      ],
      "correct": 1,
      "feedback": [
        "A compass measures a direction, not a future reversal time.",
        "Correct: current trends alone do not establish a reversal date.",
        "The geological intervals vary greatly."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. current trends alone do not establish a reversal date."
    },
    "references": [
      {
        "title": "USGS · Earth’s core and the geodynamo",
        "url": "https://www.usgs.gov/faqs/how-does-earths-core-generate-a-magnetic-field"
      },
      {
        "title": "USGS · Magnetic polarity reversals",
        "url": "https://www.usgs.gov/faqs/it-true-earths-magnetic-field-occasionally-reverses-its-polarity"
      }
    ]
  },
  "induction": {
    "title": "Electromagnetic induction",
    "heading": "A changing flux can induce emf without a battery.",
    "subtitle": "Electromagnetic induction",
    "target": "A changing flux can induce emf without a battery.",
    "visual": "mag-induction",
    "paragraphs": [
      "Move a magnet toward a coil and a voltage can appear around the coil’s conducting path. Reverse the motion and the polarity can reverse. Hold the magnet still and the induced emf falls to zero once the field settles, even though the magnetic field through the coil remains nonzero. The key quantity is changing magnetic flux, not simply the presence of a magnet.",
      "Relative motion is one way to change flux, but it is not the only way. A stationary electromagnet with changing current can induce emf in a stationary neighboring coil. Conversely, motion that leaves a loop’s flux unchanged does not automatically induce a net emf around that loop. Track the field through the actual enclosed area before deciding what motion accomplishes.",
      "An induced emf can exist even when the circuit is open. Appreciable current also requires a conducting path and depends on the circuit’s resistance and inductance. Adding turns multiplies emf when each turn links the same changing flux, but adding real wire can also change resistance. More turns do not guarantee the same proportional increase in current under every condition.",
      "The exploration varies the rate of an external field through a stationary coil. It represents approaching, stationary, and receding conditions by increasing, constant, and decreasing flux. A closed resistive circuit dissipates supplied energy. If a moving magnet drives that current, the interaction resists its imposed motion, and the agent moving it provides the energy."
    ],
    "terms": [
      [
        "electromagnetic induction",
        "Production of emf associated with changing magnetic flux or motion through a magnetic field."
      ],
      [
        "emf",
        "Energy supplied per unit charge around a circuit, measured in volts."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A coil has a strong but constant flux. A second coil has a weaker flux that changes rapidly.",
      "reasoning": "The first has zero induced emf from the constant flux. The second can have a substantial induced emf because its flux changes rapidly."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "An open coil experiences changing flux. It can have…",
      "options": [
        "Induced emf with negligible conduction current",
        "No emf because the circuit is open",
        "Current independent of every circuit property"
      ],
      "correct": 0,
      "feedback": [
        "Correct: induced emf and current are different quantities.",
        "A closed conducting path is needed for substantial current, not for emf itself.",
        "Resistance and inductance affect the current response."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. induced emf and current are different quantities."
    }
  },
  "faraday": {
    "title": "Faraday’s law and Lenz’s law",
    "heading": "Oppose the change in flux, not always the original field.",
    "subtitle": "Faraday’s law and Lenz’s law",
    "target": "Oppose the change in flux, not always the original field.",
    "visual": "mag-faraday",
    "paragraphs": [
      "For N turns sharing the same flux Φ, the average induced emf is −NΔΦ/Δt. Instantaneously it is −N dΦ/dt. The minus sign carries a directional meaning once a loop orientation and its positive normal have been chosen consistently. A rapid change produces a larger magnitude than the same flux change spread over a longer time.",
      "Lenz’s law gives the direction: an induced current produces a field that opposes the change in flux. If outward flux increases, the induced field points inward. If outward flux decreases, the induced field points outward to oppose that decrease. The second case shows why always oppose the external field is an unreliable shortcut.",
      "Choose outward as the positive normal. Counterclockwise circulation viewed from the front is then positive. Increasing outward flux gives negative emf and clockwise current in a closed resistive loop. Decreasing outward flux gives positive emf and counterclockwise current. Reversing the external field requires reconsidering whether the signed flux is increasing or decreasing.",
      "The model assumes a uniform external field, constant area, and negligible self-inductance. It computes emf and a resistive current separately. The energy cost is supplied by whatever changes the field or moves the apparatus. If induction reinforced its own driving motion without an energy input, the resulting unlimited growth would conflict with energy conservation."
    ],
    "terms": [
      [
        "Faraday’s law",
        "Induced emf equals the negative time rate of change of linked magnetic flux."
      ],
      [
        "Lenz’s law",
        "An induced current acts to oppose the change in magnetic flux that produces it."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 20-turn coil has flux per turn increase from 0.002 to 0.005 Wb in 0.10 s.",
      "reasoning": "The average emf is −20(0.003)/0.10 = −0.60 V for the chosen positive normal. Across 3 Ω, the quasistatic current magnitude is 0.20 A."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Outward flux is decreasing. The induced field is…",
      "options": [
        "Inward, because it must always oppose B",
        "Zero merely because B is decreasing",
        "Outward, opposing the decrease"
      ],
      "correct": 2,
      "feedback": [
        "Lenz’s law opposes a change, not necessarily the field itself.",
        "A nonzero rate of flux change produces emf.",
        "Correct: the induced contribution tends to sustain the outward flux."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the induced contribution tends to sustain the outward flux."
    }
  },
  "generator": {
    "title": "Generators and alternating current",
    "heading": "Maximum flux and maximum emf occur at different angles.",
    "subtitle": "Generators and alternating current",
    "target": "Maximum flux and maximum emf occur at different angles.",
    "visual": "mag-generator",
    "paragraphs": [
      "A simple generator rotates a coil in a uniform magnetic field. With θ measured between the coil normal and B, flux per turn is Φ = BA cos θ. For constant angular speed ω, θ = ωt and the induced emf is NBAω sin θ with the chosen orientation. The coil’s flux and emf are a quarter-cycle out of phase.",
      "At maximum positive or negative flux, the instantaneous rate of flux change is zero, so emf is zero. When the normal is perpendicular to B, flux crosses zero most rapidly and the emf magnitude is greatest. A picture of many field lines through a coil therefore does not automatically mean a large induced voltage at that instant.",
      "Increasing rotation speed increases both frequency and peak emf in this ideal model. More turns, larger area, or larger field also increases peak emf at the same speed. Slip rings preserve the alternating output polarity of a simple rotating coil. A split-ring commutator can reverse external connections every half-turn to produce a pulsed unidirectional output rather than a sinusoidal AC output.",
      "A generator converts mechanical energy into electrical energy. Wind, falling water, or a turbine may provide the mechanical input; the magnetic field does not supply an endless store of energy. Loading the generator requires additional driving torque to maintain speed. The exploration fixes speed externally and neglects coil resistance, friction, and detailed load dynamics so that flux, rate, and polarity are visible."
    ],
    "terms": [
      [
        "generator",
        "A device that converts mechanical energy into electrical energy by induction."
      ],
      [
        "angular frequency",
        "Rate of phase change in radians per second, equal to 2πf."
      ],
      [
        "slip ring",
        "A conducting ring that maintains electrical contact with a rotating coil."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 100-turn coil with A = 0.01 m² rotates at 10 Hz in B = 0.20 T.",
      "reasoning": "ω = 2π(10), so peak emf is NBAω ≈ 12.57 V. At θ = 0° its instantaneous emf is zero despite maximum flux."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A rotating coil has its maximum positive flux. Its instantaneous emf is…",
      "options": [
        "Independent of its rotation",
        "Zero at that instant",
        "At its positive maximum"
      ],
      "correct": 1,
      "feedback": [
        "The flux-change rate sets the emf.",
        "Correct: flux has zero slope at its maximum.",
        "Peak emf occurs at a zero crossing of flux."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. flux has zero slope at its maximum."
    }
  },
  "conversion": {
    "title": "Motor and generator comparison",
    "heading": "Follow the energy into and out of the same device.",
    "subtitle": "Motor and generator comparison",
    "target": "Follow the energy into and out of the same device.",
    "visual": "mag-conversion",
    "paragraphs": [
      "An electromechanical device can act as a motor or generator depending on how energy enters and leaves. In motor operation, a source drives current and magnetic torque turns a shaft against a load. In generator operation, an external mechanical torque turns the shaft and the induced emf delivers electrical energy to a connected load.",
      "The same device can display both effects at once. A rotating motor also generates an emf. In ordinary motoring operation that back emf opposes the applied source voltage, reducing the current compared with a stationary coil. A machine being driven mechanically can instead send current back toward an electrical storage system when its circuit and control system support that operation.",
      "Regenerative braking is an example of generator operation. The moving vehicle supplies mechanical energy, and the electrical system can return part of it to storage. Conversion is not perfect: electrical resistance, mechanical friction, and control losses turn some energy into heat. A closed motor-generator loop cannot indefinitely run itself and deliver extra energy without an external input.",
      "The energy-flow diagram changes direction when you select the operating mode. Compare the source, useful output, and losses before using the words motor or generator. A magnetic field mediates forces and induction in both modes, but the energy must still come from a defined source. Reading the arrows is a first step toward checking a quantitative power balance."
    ],
    "terms": [
      [
        "motor effect",
        "Mechanical force or torque produced by current in a magnetic field."
      ],
      [
        "generator effect",
        "Electrical emf produced by changing magnetic flux, often through mechanical motion."
      ],
      [
        "regenerative braking",
        "Conversion of motion energy into electrical energy during slowing."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A generator receives 100 W of mechanical input and loses 12 W as heat.",
      "reasoning": "Its electrical output is 88 W, an efficiency of 88%. Reversing energy flow does not eliminate those losses."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "During regenerative braking, the immediate energy source is…",
      "options": [
        "The vehicle’s mechanical energy",
        "The magnet creating energy from nothing",
        "A disappearance of electric charge"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the vehicle loses mechanical energy as electrical energy and heat increase.",
        "A magnet does not remove the need for an energy source.",
        "Charge is conserved while energy changes form."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the vehicle loses mechanical energy as electrical energy and heat increase."
    }
  },
  "transformer": {
    "title": "Transformers",
    "heading": "A voltage ratio changes the current ratio, not the energy budget.",
    "subtitle": "Transformers",
    "target": "A voltage ratio changes the current ratio, not the energy budget.",
    "visual": "mag-transformer",
    "paragraphs": [
      "A transformer links two coils through changing magnetic flux. The primary receives electrical input and the secondary provides output. An iron core can guide and strengthen the shared flux. The coils need not share a conducting connection: their coupling is magnetic. In a simple ideal transformer, Vs/Vp = Ns/Np for corresponding AC voltage magnitudes.",
      "A larger secondary turn count raises the secondary voltage; a smaller count lowers it. For an ideal transformer with a resistive load, input and output power are equal, VpIp = VsIs. Therefore Is/Ip = Np/Ns. This compares currents on opposite sides under one operating condition. It does not say that raising the voltage across the same resistor reduces that resistor’s current.",
      "A steady DC current produces steady flux after transients and cannot sustain a secondary emf in this simple arrangement. Switching current can create changing flux, which is why electronic converters can use a DC supply together with switching circuitry. A transformer by itself does not rectify AC into DC; a diode circuit and often additional filtering are needed.",
      "The model uses RMS AC values and a fixed resistive secondary load, with perfect coupling and no losses. Changing the turns ratio changes the load voltage, load current, and power demanded from the primary. Real transformers have winding resistance, leakage flux, heating, saturation, and ratings. The ideal equations describe relationships, not permission to exceed a physical device’s limits."
    ],
    "terms": [
      [
        "transformer",
        "A device transferring electrical energy between circuits through changing linked magnetic flux."
      ],
      [
        "turns ratio",
        "Secondary turn count divided by primary turn count."
      ],
      [
        "primary and secondary",
        "The input and output coils for the stated transformer operating direction."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "An ideal transformer has Np = 100, Ns = 200, Vp = 12 V RMS, and a 24 Ω load.",
      "reasoning": "Vs = 24 V and Is = 1 A. Output power is 24 W, so Ip = 2 A. Voltage doubles while the secondary current is half the primary current."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A step-up transformer can ideally increase…",
      "options": [
        "Both voltage and power without additional input",
        "DC output simply by adding secondary turns",
        "Voltage while conserving input and output power"
      ],
      "correct": 2,
      "feedback": [
        "Output energy must be supplied at the input.",
        "A transformer alone does not rectify AC.",
        "Correct: the current ratio compensates in the ideal power balance."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the current ratio compensates in the ideal power balance."
    }
  },
  "transmission": {
    "title": "Power transmission",
    "heading": "For the same delivered power, higher voltage means less line heating.",
    "subtitle": "Power transmission",
    "target": "For the same delivered power, higher voltage means less line heating.",
    "visual": "mag-transmission",
    "paragraphs": [
      "A transmission line has resistance, so its current produces heat at a rate I²Rline. To deliver a specified power P at a specified receiving voltage V, a simple unity-power-factor model gives I = P/V. Increasing that voltage reduces current for the same delivered power, and the resistive loss falls with the square of the current.",
      "Doubling the receiving voltage while holding delivered power and line resistance fixed halves current and quarters line heating. This comparison is different from connecting a fixed resistor across a larger voltage, which raises its current and power. Always identify what is fixed before using either relationship. Power, voltage, and current cannot all be chosen independently.",
      "Transformers make AC voltage changes convenient: voltage can be increased for transmission and decreased near users. Modern power systems can also use high-voltage DC links with electronic conversion. The core lesson is the current-and-loss relationship, not the claim that every power line must use AC. Real networks also involve reactance, insulation requirements, control, and equipment losses.",
      "The model tracks receiving-end load power, line heating, and required sending power separately. The sending voltage is higher than the receiving voltage by IRline. This prevents a misleading calculation that silently assumes the source delivers the load’s full power while also losing part of that same amount in the line. All selected voltages here are illustrative calculations, not wiring or equipment instructions."
    ],
    "terms": [
      [
        "line loss",
        "Power dissipated in transmission conductors, modeled here as I²R."
      ],
      [
        "receiving voltage",
        "Voltage across the load at the receiving end of a line."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Deliver 10 kW at 1 kV through a line with 2 Ω total resistance.",
      "reasoning": "I = 10 A and loss = 200 W, requiring 10.2 kW input. At 2 kV receiving voltage, I = 5 A and loss = 50 W."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At fixed delivered power, doubling receiving voltage changes line heating to…",
      "options": [
        "The same because power was fixed",
        "One quarter",
        "Twice as much"
      ],
      "correct": 1,
      "feedback": [
        "Delivered power stays fixed; line current and heating do not.",
        "Correct: current halves and I²R becomes one quarter.",
        "That confuses this condition with a fixed load resistance."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. current halves and I²R becomes one quarter."
    }
  },
  "changing": {
    "title": "Induction of electric and magnetic fields",
    "heading": "A changing field has effects even without a wire.",
    "subtitle": "Induction of electric and magnetic fields",
    "target": "A changing field has effects even without a wire.",
    "visual": "mag-changing",
    "paragraphs": [
      "Faraday’s law can be expressed in terms of fields: the circulation of an electric field around a closed path equals the negative rate of change of magnetic flux through the path. A physical wire is not required for this field relationship. If a conducting loop is present, the induced electric field can drive charge along it.",
      "This circulating electric field differs from the electrostatic field of stationary charges. In an electrostatic situation the electric-field integral around a closed loop is zero. With changing magnetic flux it need not be zero. A single-valued electrostatic potential difference is therefore not enough to describe every aspect of an induction experiment.",
      "Maxwell’s extension of Ampere’s law includes a changing electric flux as a source of magnetic-field circulation, alongside conduction current. This allows a consistent description of a charging capacitor: current flows in its wires while changing electric field in the gap contributes to the magnetic-field relationship. Charges do not need to cross the ideal insulating gap as a conduction current.",
      "The two field laws help describe electromagnetic waves. Their directions must be worked out from the geometry and circulation rules rather than a blanket claim that every local electric field is perpendicular to every local magnetic field. The diagram uses a circularly symmetric changing-flux region to make one clear example; more general geometries require the full field equations."
    ],
    "terms": [
      [
        "induced electric field",
        "An electric field with circulation associated with changing magnetic flux."
      ],
      [
        "displacement current",
        "The changing-electric-flux term in the Ampere–Maxwell law, expressed in current units."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Magnetic flux outward through a circular region increases while no wire is present.",
      "reasoning": "The induced electric field still circulates clockwise when viewed from the front. Adding a conducting ring allows that field to drive current."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Removing the wire from a changing-flux region removes…",
      "options": [
        "The conducting path, but not the induced electric field",
        "Every induced electric field",
        "The need for Faraday’s law"
      ],
      "correct": 0,
      "feedback": [
        "Correct: fields exist independently of the measuring or conducting material.",
        "Induction is a field relationship, not only a wire effect.",
        "Faraday’s law still relates field circulation to changing flux."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. fields exist independently of the measuring or conducting material."
    }
  },
  "waves": {
    "title": "Electromagnetic waves",
    "heading": "Energy travels with coordinated electric and magnetic fields.",
    "subtitle": "Electromagnetic waves",
    "target": "Energy travels with coordinated electric and magnetic fields.",
    "visual": "mag-emwaves",
    "paragraphs": [
      "An accelerating charge can emit electromagnetic radiation. A driven antenna uses an alternating current distribution to launch a wave, and the arriving electric field can drive charges in a receiving antenna. Energy at the receiver comes from the transmitting system; propagation does not manufacture energy as the wave travels.",
      "For a plane electromagnetic wave in vacuum, E and B are perpendicular to one another and to the propagation direction. They vary in phase, with magnitudes related by E = cB. The direction of E × B gives the direction of energy transport. These relationships describe a traveling plane wave; near an antenna the fields can have more complicated patterns.",
      "The vacuum speed is c, approximately 3.00 × 10⁸ m/s, and c = fλ. Increasing frequency reduces wavelength at the same vacuum speed. Radio, visible light, and other electromagnetic bands differ in frequency and wavelength rather than needing different vacuum propagation speeds. In materials, propagation and absorption depend on the material and frequency.",
      "The illustration shows a fixed phase snapshot with separate electric and magnetic directions. The drawn lengths use different visual scales, so equal arrow lengths do not imply equal numerical field magnitudes in their different units. No water, air, or other material medium is required for propagation through vacuum. Use the wave to connect the induction laws to a receiver’s charge motion and to an explicit energy source."
    ],
    "terms": [
      [
        "electromagnetic wave",
        "A propagating electromagnetic disturbance that can carry energy through vacuum."
      ],
      [
        "transverse wave",
        "A wave whose relevant oscillations are perpendicular to propagation."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A vacuum radio wave has frequency 100 MHz.",
      "reasoning": "λ = c/f = 3.00 m. Doubling frequency halves wavelength; it does not double the vacuum wave speed."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "For a plane wave in vacuum, E and B are…",
      "options": [
        "Parallel and a quarter-cycle apart",
        "Present only inside a conducting wire",
        "Perpendicular and in phase"
      ],
      "correct": 2,
      "feedback": [
        "That does not describe the plane traveling wave model.",
        "The wave propagates through vacuum without a conductor.",
        "Correct: both fields are transverse and vary together at a point."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. both fields are transverse and vary together at a point."
    }
  },
  "orbit": {
    "title": "Charged-particle paths",
    "heading": "Separate the motion across B from the motion along B.",
    "subtitle": "Charged-particle paths",
    "target": "Separate the motion across B from the motion along B.",
    "visual": "mag-orbit",
    "paragraphs": [
      "A particle moving perpendicular to a uniform magnetic field can follow a circular path. Equate |q|vB to mv²/r to obtain r = mv/(|q|B) in the nonrelativistic model. The magnetic force supplies the required centripetal acceleration without doing work, so speed stays constant while velocity changes direction.",
      "Increasing speed or mass increases the radius when the other quantities stay fixed. Increasing field strength or charge magnitude reduces it. Reversing charge sign reverses the bending direction without changing the radius for the same mass and speed. The formula uses momentum mv; at relativistic speeds that expression must be replaced by the relativistic momentum.",
      "If the velocity has a component along B, that component remains unchanged in a uniform field. The perpendicular component circles while the parallel component advances, producing a helix. Its radius is mvperp/(|q|B), and its pitch is vparallel times the period 2πm/(|q|B). Motion exactly along B has no magnetic bending.",
      "Earth’s field and magnetic confinement devices are nonuniform and more complicated. A magnetic mirror can exchange parallel and perpendicular motion while preserving kinetic energy under suitable conditions; a uniform-field helix alone does not simulate a radiation belt or a fusion plasma. The model deliberately isolates the uniform-field case so its assumptions, direction, radius, and energy account can be checked."
    ],
    "terms": [
      [
        "gyroradius",
        "Radius of a charged particle’s circular motion perpendicular to a magnetic field."
      ],
      [
        "helical motion",
        "Combined circular motion and uniform translation along an axis."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A proton moves at 1.0 × 10⁶ m/s perpendicular to B = 0.10 T.",
      "reasoning": "Using m = 1.67 × 10⁻²⁷ kg and |q| = 1.60 × 10⁻¹⁹ C gives r ≈ 0.104 m. Doubling B halves r while speed remains fixed."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Add velocity parallel to uniform B without changing vperp. The radius…",
      "options": [
        "Becomes zero for any parallel component",
        "Stays the same while the path gains pitch",
        "Must double"
      ],
      "correct": 1,
      "feedback": [
        "A perpendicular component still produces bending.",
        "Correct: radius depends on the perpendicular component.",
        "Parallel motion changes pitch, not the circular radius."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. radius depends on the perpendicular component."
    }
  },
  "hall": {
    "title": "The Hall effect",
    "heading": "A transverse voltage reveals how carriers respond.",
    "subtitle": "The Hall effect",
    "target": "A transverse voltage reveals how carriers respond.",
    "visual": "mag-hall",
    "paragraphs": [
      "Current carriers moving through a magnetic field feel a sideways force. In a flat conducting strip, charge separation builds an electric field that opposes further sideways motion. In steady transverse equilibrium, qE balances the magnetic force q(vd × B). For mutually perpendicular directions, the magnitude satisfies E = vdB.",
      "Across width d, the Hall voltage magnitude is VHall = Bvd d in the simple uniform single-carrier model. With current density J = nqvd and strip thickness t, an equivalent magnitude is |I B/(n q t)|. The sign requires careful attention to carrier charge, current direction, field direction, and which side’s potential is subtracted.",
      "In the diagram, conventional current points right and B points out of the page. Positive carriers drift right and accumulate at the bottom; negative carriers drift left and also experience a downward magnetic force, but place negative charge at the bottom. The polarity of Vtop − Vbottom therefore distinguishes the two carrier signs under these stated directions.",
      "Hall probes use calibrated transverse signals to measure magnetic fields. Conducting-fluid flow measurements use a related balance but require the bulk flow direction to be specified; one must not copy the polarity argument for opposite carrier drift without checking that difference. Real materials can have multiple carrier types and more complex responses than this introductory strip model."
    ],
    "terms": [
      [
        "Hall effect",
        "Development of a transverse voltage in a current-carrying material subjected to a magnetic field."
      ],
      [
        "Hall voltage",
        "Potential difference across the material produced by transverse charge separation."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "For B = 0.20 T, drift-speed magnitude 0.01 m/s, and width 0.02 m, find the magnitude.",
      "reasoning": "VHall = Bvd d = 0.000040 V = 40 µV. The sign still requires carrier and orientation information."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Keep conventional current and B fixed but replace electron carriers with positive carriers. The simple Hall polarity…",
      "options": [
        "Reverses",
        "Must remain the same",
        "Vanishes for all positive carriers"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the accumulation occurs with the opposite sign of charge.",
        "The same current does not mean the same carrier drift or accumulated charge sign.",
        "Positive carriers can produce a Hall voltage."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the accumulation occurs with the opposite sign of charge."
    }
  },
  "ampere": {
    "title": "Fields produced by currents: Ampere’s law",
    "heading": "Choose the field formula that matches the geometry.",
    "subtitle": "Fields produced by currents: Ampere’s law",
    "target": "Choose the field formula that matches the geometry.",
    "visual": "mag-ampere",
    "paragraphs": [
      "For a long straight wire in vacuum, B = μ₀I/(2πr), with r measured perpendicular to the wire. At the center of N closely spaced circular turns of radius R, B = μ₀NI/(2R). Deep inside a long air-core solenoid, B ≈ μ₀NI/ℓ. Each formula describes a different geometry and observation location, so their similar appearance does not make them interchangeable.",
      "The direction follows the right-hand grip rule. For a solenoid, curl the fingers with the current around its turns; the thumb gives the interior field direction. Reversing current reverses B. Increasing turn density N/ℓ strengthens the ideal interior field. Near the ends, the long-solenoid approximation becomes less accurate and the field spreads into the outside return path.",
      "For steady currents, Ampere’s law relates magnetic-field circulation around a closed path to the net current threading the path: ∮B·dl = μ₀Ienclosed. Symmetry makes it useful for the long straight wire and ideal long solenoid. It is not a rule that B must be constant along every arbitrarily drawn closed path.",
      "The model uses μ₀ ≈ 4π × 10⁻⁷ H/m, accurate for these classroom calculations. In the modern SI it is no longer an exactly fixed defining value. The ampere is defined through the elementary charge; older force-between-wires definitions in the source are historical. Keep the useful force and field relationships while distinguishing measurement physics from the current definition of a unit."
    ],
    "terms": [
      [
        "Ampere’s law",
        "For steady currents, the circulation of B equals μ₀ times enclosed current in vacuum."
      ],
      [
        "permeability of free space",
        "The magnetic constant μ₀, approximately 4π × 10⁻⁷ H/m."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A long wire carries 5 A. Compare its field at 0.02 m and 0.04 m.",
      "reasoning": "The values are about 50 µT and 25 µT. Doubling distance halves the field for this long-wire geometry."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The long-wire formula is valid…",
      "options": [
        "At every point of any current loop without change",
        "Only if μ₀ is an exact defining constant",
        "At distance r from a sufficiently long straight wire"
      ],
      "correct": 2,
      "feedback": [
        "A loop has different geometry and field expressions.",
        "A measured constant can appear in a valid physical relation.",
        "Correct: geometry and observation location are part of the model."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. geometry and observation location are part of the model."
    },
    "references": [
      {
        "title": "NIST · SI definitions and the ampere",
        "url": "https://www.nist.gov/pml/special-publication-330/sp-330-section-2"
      }
    ]
  },
  "parallel": {
    "title": "Force between parallel currents",
    "heading": "Find one wire’s field, then its force on the other.",
    "subtitle": "Force between parallel currents",
    "target": "Find one wire’s field, then its force on the other.",
    "visual": "mag-parallel",
    "paragraphs": [
      "Two long parallel wires exert magnetic forces on one another. First find the field of wire 1 at wire 2: B₁ = μ₀I₁/(2πd). Then use the force on wire 2 in that external field. For straight parallel segments the magnitude per unit length is F/ℓ = μ₀|I₁I₂|/(2πd).",
      "The right-hand rules show that currents in the same direction attract and currents in opposite directions repel. This can feel surprising after learning that like electric charges repel. A current direction is not an electric charge sign; it describes charge transport, and the magnetic interaction uses both the source field and the other wire’s current.",
      "Each wire experiences an equal-magnitude opposite force in this ideal steady arrangement. Changing one current changes both forces. Doubling either current doubles the force per length, while doubling their separation halves it. The inverse-distance law here comes from the long straight wire’s magnetic field and should not be replaced by the point-charge inverse-square law.",
      "The source historically used this force to motivate a definition of the ampere. Since the 2019 SI revision, the ampere is defined using the exact elementary charge and the second. The force experiment remains physically meaningful. The exploration marks both current directions and both forces, with a common magnitude readout so that attraction, repulsion, and Newton’s third-law pairing remain explicit."
    ],
    "terms": [
      [
        "parallel-current force",
        "Magnetic interaction between currents in parallel conductors."
      ],
      [
        "force per unit length",
        "Force divided by the length of wire experiencing it, measured in N/m."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Two 5 A currents flow in the same direction in long wires 0.10 m apart.",
      "reasoning": "F/ℓ = 5.0 × 10⁻⁵ N/m, attractive. Reversing one current makes the force repulsive with the same magnitude."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Two parallel currents in opposite directions…",
      "options": [
        "Produce a force on only the smaller current",
        "Repel magnetically",
        "Attract because opposite charges attract"
      ],
      "correct": 1,
      "feedback": [
        "The force pair has equal magnitude in this arrangement.",
        "Correct: applying both right-hand rules gives repulsion.",
        "Current directions are not electric charge signs."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. applying both right-hand rules gives repulsion."
    },
    "references": [
      {
        "title": "NIST · SI definitions and the ampere",
        "url": "https://www.nist.gov/pml/special-publication-330/sp-330-section-2"
      }
    ]
  },
  "applications": {
    "title": "Applications of magnetism",
    "heading": "Distinguish steering a beam from measuring a resonant signal.",
    "subtitle": "Applications of magnetism",
    "target": "Distinguish steering a beam from measuring a resonant signal.",
    "visual": "mag-applications",
    "paragraphs": [
      "A magnetic mass spectrometer can combine a velocity selector with a bending region. In the selector, perpendicular electric and magnetic forces cancel for speed v = E/B when their directions oppose. A subsequent magnetic-only region bends the selected particles with radius r = mv/(|q|B). At fixed speed, charge state, and field, a larger radius indicates a larger mass.",
      "The instrument actually depends on mass-to-charge ratio, so charge state cannot be ignored. Two particles with different masses can trace the same radius if their charge magnitudes differ proportionally. A beam-steering coil in a cathode-ray tube uses the same force principle, while the electric accelerator supplies the kinetic energy before steering.",
      "MRI uses a different magnetic response. A strong field establishes conditions for nuclear magnetic resonance; radiofrequency pulses disturb the nuclear magnetization, and receiving coils detect signals as it evolves. Field gradients help encode position. Image contrast depends on tissue properties and pulse sequences, not a direct photograph of individual atoms. This is an application of magnetic moments and resonance rather than a beam of ions sorted by radius.",
      "MRI does not use ionizing x rays, but its strong fields and radiofrequency energy require screening and safety controls, including attention to implants and magnetic objects. The diagram explains the signal chain only and is not a clinical decision tool. More broadly, a magnetic measurement must identify its signal, calibration, and mechanism before supporting any claim about an object or a person."
    ],
    "terms": [
      [
        "velocity selector",
        "A crossed-field device that transmits particles whose electric and magnetic forces balance."
      ],
      [
        "mass-to-charge ratio",
        "Mass divided by charge magnitude, a key quantity in particle separation."
      ],
      [
        "magnetic resonance",
        "Resonant response of magnetic moments to an applied oscillating field."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A selector uses E = 20,000 V/m and B = 0.10 T.",
      "reasoning": "Selected speed is 2.0 × 10⁵ m/s. In the same analyzer field, doubling mass at fixed charge and selected speed doubles the bending radius."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Two ions have equal selected speed and equal m/|q| in the same analyzer field. Their radii…",
      "options": [
        "Are equal",
        "Must differ if their masses differ",
        "Depend only on the sign of the charge"
      ],
      "correct": 0,
      "feedback": [
        "Correct: r depends on m/|q| at fixed speed and field.",
        "Different masses can be offset by proportional charge magnitudes.",
        "Charge sign sets bending sense; magnitude contributes to radius."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. r depends on m/|q| at fixed speed and field."
    },
    "references": [
      {
        "title": "FDA · MRI principles",
        "url": "https://www.fda.gov/radiation-emitting-products/medical-imaging/mri-magnetic-resonance-imaging"
      },
      {
        "title": "FDA · MRI benefits and risks",
        "url": "https://www.fda.gov/radiation-emitting-products/mri-magnetic-resonance-imaging/benefits-and-risks"
      }
    ]
  },
  "flux": {
    "title": "Induced emf and magnetic flux",
    "heading": "Measure the field through the loop’s area.",
    "subtitle": "Induced emf and magnetic flux",
    "target": "Measure the field through the loop’s area.",
    "visual": "mag-flux",
    "paragraphs": [
      "Magnetic flux measures how much magnetic field passes through an oriented surface. For a uniform field and a flat area, Φ = BA cos θ, where θ is the angle between B and the area’s normal. The normal is perpendicular to the surface, not an arrow lying in its plane. Flux is greatest in magnitude when the field crosses the surface squarely.",
      "When B lies in the plane, θ = 90° and flux is zero. Reversing the normal reverses the sign of flux without changing the physical field. A coil’s linked flux includes its turn count: NΦ when every turn encloses the same flux. Flux is measured in webers, with one weber equal to one tesla square meter.",
      "Changing B, changing area, or rotating the loop can change flux. A large constant flux alone produces no induced emf. A small flux changing quickly can produce substantial emf. Faraday’s law connects emf to the rate of change, making the distinction between a quantity and its time derivative central to induction.",
      "The exploration changes the angle while keeping field and area fixed, showing both the normal and the projected area. It reports a static flux value; moving a slider is not assigned a physical duration, so no voltage is inferred from how quickly a student drags it. The following model supplies an explicit rate when calculating emf. This keeps the mathematical meaning separate from the browser interaction."
    ],
    "terms": [
      [
        "magnetic flux",
        "The oriented surface integral of B through an area; BA cos θ for a uniform field and flat surface."
      ],
      [
        "weber",
        "SI unit of magnetic flux, equal to T·m²."
      ],
      [
        "area normal",
        "A direction perpendicular to a surface, used to define oriented flux."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "B = 0.40 T crosses an area of 0.020 m² with a 60° angle to the normal.",
      "reasoning": "Φ = (0.40)(0.020)cos 60° = 0.0040 Wb. Using the angle to the plane without conversion would give the wrong result."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The field lies in the plane of a flat loop. Its flux is…",
      "options": [
        "BA, the maximum",
        "Undefined because the loop has area",
        "Zero"
      ],
      "correct": 2,
      "feedback": [
        "Maximum flux occurs when B is normal to the plane.",
        "The oriented flux is well defined and zero.",
        "Correct: the field is perpendicular to the normal, so cos 90° = 0."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the field is perpendicular to the normal, so cos 90° = 0."
    }
  },
  "motion": {
    "title": "Motional emf",
    "heading": "Pulling a rod can supply electrical energy.",
    "subtitle": "Motional emf",
    "target": "Pulling a rod can supply electrical energy.",
    "visual": "mag-motion",
    "paragraphs": [
      "A conducting rod moves right along rails in a uniform magnetic field into the page. Positive charges moving with the rod experience a magnetic force upward, so the top end becomes positive relative to the bottom. With perpendicular rod length ℓ, velocity v, and field B, the emf magnitude is Bℓv.",
      "If a resistor completes the circuit, conventional current runs up the rod and counterclockwise around the rails as viewed on the page. Its induced field points outward, opposing the increasing inward flux as the enclosed area grows. This agrees with the direct force-on-carriers argument. Two different reasoning routes therefore predict the same polarity and current direction.",
      "The rod carrying current upward in an inward field feels a force to the left. An external agent must pull right to maintain constant speed. In the ideal resistive model I = Bℓv/R, the magnetic drag magnitude is IℓB, and the required mechanical power Fv equals I²R. The energy dissipated in the resistor comes from the pulling agent.",
      "Open the circuit and charge separation can still produce an end-to-end voltage, but sustained circuit current and this resistive drag vanish in the idealization. The model neglects friction, rail resistance, self-inductance, and initial transients. Its energy account applies to the stated steady speed and complete resistive path, not to every moving piece of metal regardless of geometry."
    ],
    "terms": [
      [
        "motional emf",
        "Emf associated with motion of a conductor through a magnetic field."
      ],
      [
        "magnetic drag",
        "A magnetic force opposing imposed motion when induced currents transfer mechanical energy."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "B = 0.5 T, ℓ = 0.4 m, v = 2 m/s, R = 2 Ω.",
      "reasoning": "Emf = 0.4 V, I = 0.2 A, drag = 0.04 N, and input power = 0.08 W = I²R."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Open the rail circuit while pulling at the same speed. Ideally…",
      "options": [
        "The rod supplies energy without mechanical work",
        "Emf remains but sustained current vanishes",
        "Both emf and current must double"
      ],
      "correct": 1,
      "feedback": [
        "Energy supplied to a load must come from a source.",
        "Correct: charge separation still occurs, but there is no complete resistive path.",
        "Opening a path does not increase conduction current."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. charge separation still occurs, but there is no complete resistive path."
    }
  },
  "eddy": {
    "title": "Eddy currents and magnetic damping",
    "heading": "A conductor can contain its own closed current paths.",
    "subtitle": "Eddy currents and magnetic damping",
    "target": "A conductor can contain its own closed current paths.",
    "visual": "mag-eddy",
    "paragraphs": [
      "A solid conducting plate can support circulating currents within its material even without a separately wound coil. When the plate enters or leaves a region of magnetic field, the flux through possible internal loops changes. Induced eddy currents produce magnetic effects opposing that change, often exerting a force that resists the plate’s motion.",
      "For a finite plate moving entirely inside a uniform steady field, after transients settle, the simple translational model has no changing loop flux and no sustained eddy-current drag. The strongest effects in the illustrated experiment occur at field boundaries. Leaving the field can produce drag too: the induced field now tends to sustain the diminishing flux, still opposing the motion.",
      "Slots interrupt large current loops and reduce magnetic damping. Thin insulated laminations in a transformer core similarly reduce unwanted eddy-current paths and heating. The detailed current pattern depends on geometry, conductivity, field variation, and speed; a single ring sketch represents a possible loop rather than an exact current-density map.",
      "The energy removed from a moving plate becomes internal energy through electrical resistance. Magnetic braking therefore does not create or destroy energy, and its drag generally changes with speed. Induction heating deliberately uses changing fields to transfer energy into suitable conducting objects. The interactive comparison changes the available paths and location, showing why electrical conductivity and changing flux both matter."
    ],
    "terms": [
      [
        "eddy current",
        "An induced circulating current within a bulk conductor."
      ],
      [
        "magnetic damping",
        "Reduction of motion through magnetic interactions associated with energy transfer."
      ],
      [
        "lamination",
        "A thin insulated layer used to reduce large eddy-current paths."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A metal plate and a deeply slotted plate swing through the same localized field.",
      "reasoning": "The solid plate permits larger closed current paths and usually shows stronger damping. Slots reduce those paths rather than removing the external field."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A plate leaves a localized field. Eddy-current drag…",
      "options": [
        "Can still oppose the motion",
        "Must help the plate accelerate out",
        "Exists only if the plate is a permanent magnet"
      ],
      "correct": 0,
      "feedback": [
        "Correct: induction opposes the decreasing flux and can resist the exit motion.",
        "Lenz’s law does not supply free accelerating energy.",
        "A nonmagnetic conductor can support eddy currents."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. induction opposes the decreasing flux and can resist the exit motion."
    }
  },
  "back": {
    "title": "Back emf",
    "heading": "A spinning motor draws less current than a stalled one.",
    "subtitle": "Back emf",
    "target": "A spinning motor draws less current than a stalled one.",
    "visual": "mag-back",
    "paragraphs": [
      "A motor’s rotating coil also acts as a generator. Its induced emf opposes the applied voltage in ordinary motor operation. This back emf grows with rotation speed in a simple fixed-field motor. With supply V, back emf Eback, and coil resistance R, the steady electrical relation is I = (V − Eback)/R.",
      "At rest the rotational back emf is zero. Ignoring the initial inductive transient, the current can approach V/R, which may be much larger than the running current. A mechanical load can slow the motor, reducing back emf and increasing current. That added current increases torque, but also increases I²R heating. A prolonged stall can therefore be damaging.",
      "Separate the power terms. Electrical input is VI, resistive heating is I²R, and electromagnetic mechanical conversion is Eback I in this ideal model. The identity VI = I²R + Eback I follows directly from the voltage equation. Friction and other mechanical losses further reduce useful shaft output.",
      "The model varies an imposed speed-related back emf and uses a fixed supply and coil resistance. It does not solve the acceleration, inertia, or load dynamics. If an external drive makes Eback exceed V, current reverses and the sign of electrical power indicates generator operation. That mathematical extension assumes a circuit able to accept reverse current; an actual motor controller may impose different constraints."
    ],
    "terms": [
      [
        "back emf",
        "The induced emf of a rotating motor that opposes the applied supply in motor operation."
      ],
      [
        "stall current",
        "Current at zero rotational speed, limited by resistance and the circuit’s transient or control behavior."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 12 V motor has R = 2 Ω and back emf 8 V.",
      "reasoning": "I = 2 A, input = 24 W, coil heat = 8 W, and mechanical conversion = 16 W. At zero back emf the steady model gives 6 A and 72 W of heat."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Slowing a motor at fixed supply and resistance usually…",
      "options": [
        "Increases back emf and reduces current",
        "Eliminates resistive heating",
        "Reduces back emf and increases current"
      ],
      "correct": 2,
      "feedback": [
        "Back emf increases with speed in this simple model.",
        "Heating grows as I²R if current increases.",
        "Correct: the voltage left across the coil resistance grows."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the voltage left across the coil resistance grows."
    }
  },
  "protection": {
    "title": "Electrical safety systems and devices",
    "heading": "Different devices detect different faults.",
    "subtitle": "Electrical safety systems and devices",
    "target": "Different devices detect different faults.",
    "visual": "mag-protection",
    "paragraphs": [
      "An overcurrent breaker or fuse responds to excessive current and helps protect wiring against overheating. A ground-fault circuit interrupter compares outgoing and returning currents. If part of the current takes another path, the imbalance can trigger interruption even when total load current is far below an ordinary breaker’s rating. These protections solve different problems.",
      "A sensing core can surround the outgoing and return conductors. Under balanced operation their magnetic effects cancel. A difference creates a net magnetic signal that the protection circuit can detect. A GFCI does not guarantee protection against every contact arrangement: a hazardous path that returns all current through the monitored return conductor may not create the imbalance it detects.",
      "Equipment grounding and bonding provide a designed fault-current return path to the source so protection can operate. Ground is not a place where current simply disappears, and normal load current should not rely on the protective conductor. Neutral is a working conductor and must not be assumed safe to touch. Insulation, enclosures, and double-insulated designs provide additional layers of protection.",
      "An isolation transformer separates conducting connections between primary and secondary, but its secondary still has a voltage between its terminals. Touching both terminals can complete a hazardous circuit. The illustration is a conceptual current-accounting exercise, not a wiring plan. Keep hands-on classroom investigations to approved low-voltage equipment and use qualified help for mains systems. No displayed current is labeled universally harmless."
    ],
    "terms": [
      [
        "ground-fault circuit interrupter",
        "A device that detects outgoing/returning current imbalance and interrupts the protected circuit."
      ],
      [
        "overcurrent protection",
        "Interruption intended to limit excessive current and its heating effects."
      ],
      [
        "equipment grounding conductor",
        "A protective conductor providing a designed fault-current path back toward the source."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A load sends 2.000 A out and returns 1.994 A through the monitored return.",
      "reasoning": "The imbalance is 0.006 A = 6 mA. A suitable ground-fault device can detect it even though the load current is well below a typical branch-breaker rating."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A GFCI and an overcurrent breaker…",
      "options": [
        "Make exposed neutral safe to touch",
        "Detect different fault conditions",
        "Guarantee every possible shock is prevented"
      ],
      "correct": 1,
      "feedback": [
        "Neutral can carry current and develop hazardous voltage.",
        "Correct: imbalance and excessive total current are different signals.",
        "No single protective device covers every hazardous path."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. imbalance and excessive total current are different signals."
    },
    "references": [
      {
        "title": "OSHA · Ground-fault circuit interrupters",
        "url": "https://www.osha.gov/etools/construction/electrical-incidents/ground-fault-circuit-interrupters"
      }
    ]
  },
  "inductance": {
    "title": "Inductance",
    "heading": "Changing current changes stored magnetic energy.",
    "subtitle": "Inductance",
    "target": "Changing current changes stored magnetic energy.",
    "visual": "mag-inductance",
    "paragraphs": [
      "A coil’s current produces linked magnetic flux. When the current changes, the changing flux induces an emf in that same coil. In a linear fixed-geometry model, self-induced emf is −L dI/dt, where L is inductance. The minus sign says the emf opposes the change in current: it resists an increase and supports a current that is decreasing.",
      "Mutual inductance describes coupling between two circuits. With an agreed orientation, changing current in one produces an emf −M dI/dt in the other. Geometry, spacing, orientation, and magnetic materials affect the coupling. A transformer is designed for strong coupling, whereas unwanted coupling between circuits may need to be reduced.",
      "For a long air-core solenoid, L ≈ μ₀N²A/ℓ. More turns affect both the field produced and the flux linked, explaining the square of N. This expression assumes the long-solenoid geometry and a linear magnetic response. Inserting a ferromagnetic core can change L, but saturation and hysteresis make a single constant-L model inadequate in some regimes.",
      "Energy stored in an ideal linear inductor is U = ½LI². Doubling current quadruples that stored energy. Rapidly interrupting current requires a large emf and can transfer the stored energy into other components or an arc. The model computes energy and induced emf separately: a large steady current can store energy while producing zero self-induced emf because its rate of change is zero."
    ],
    "terms": [
      [
        "inductance",
        "The proportionality relating linked flux to current in a linear system, measured in henries."
      ],
      [
        "mutual inductance",
        "A measure of flux coupling between two circuits."
      ],
      [
        "henry",
        "Unit of inductance, equal to V·s/A."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 0.20 H coil carries 3 A and its current is decreasing at 5 A/s.",
      "reasoning": "Stored energy is 0.90 J. The self-induced emf is +1.0 V along the chosen positive circulation, acting to sustain the decreasing positive current."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "An ideal inductor carries constant nonzero current. It has…",
      "options": [
        "Stored magnetic energy but zero self-induced emf",
        "Zero energy because current is constant",
        "An emf set by current alone"
      ],
      "correct": 0,
      "feedback": [
        "Correct: energy depends on I² while self-emf depends on dI/dt.",
        "A steady current can maintain a magnetic field with stored energy.",
        "A rate of change is required for self-induced emf."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. energy depends on I² while self-emf depends on dI/dt."
    }
  },
  "rl": {
    "title": "RL circuits",
    "heading": "Inductor current changes continuously on the L/R timescale.",
    "subtitle": "RL circuits",
    "target": "Inductor current changes continuously on the L/R timescale.",
    "visual": "mag-rl",
    "paragraphs": [
      "Connect an initially unenergized ideal inductor and resistor in series with a DC voltage V. Current starts at zero and rises toward V/R according to I = (V/R)(1 − e^(−t/τ)), where τ = L/R. The initial slope is V/L. The inductor initially takes the full applied voltage; as current builds, more voltage appears across the resistor.",
      "After one time constant, current has reached about 63.2% of its final value. Each additional time constant closes the same fraction of the remaining gap. The current approaches its limit rather than reaching it exactly after a finite number of time constants. A larger L slows the response; changing R affects both the timescale and final current.",
      "To let the current decay, remove the source while preserving a closed resistor–inductor path. Then I = I₀e^(−t/τ). Current initially keeps its direction because the inductor’s induced emf supports it as stored magnetic energy decreases. The resistor converts that energy into heat. After one τ, current is 36.8% of its initial value, but energy is only e⁻², about 13.5%, because it depends on I².",
      "The model’s decay switch includes that return path. Simply opening a real coil circuit is a different problem involving high voltage, stray capacitance, or a protective discharge path. The graph and energy readout show current continuity and distinguish an electrical timescale from a claim that the current can vanish instantly."
    ],
    "terms": [
      [
        "RL time constant",
        "The characteristic current-response time L/R for a series resistor–inductor circuit."
      ],
      [
        "inductor current continuity",
        "The requirement that finite voltage cannot instantaneously change an ideal inductor’s current."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "For L = 0.20 H and R = 10 Ω, find τ and the fraction after one τ during decay.",
      "reasoning": "τ = 0.020 s. Current falls to 36.8%; stored magnetic energy falls to 13.5% of its initial value."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "During decay through a closed resistor, current immediately…",
      "options": [
        "Reverses because the source was removed",
        "Drops to exactly zero with no energy transfer",
        "Keeps its direction while decreasing continuously"
      ],
      "correct": 2,
      "feedback": [
        "Its emf supports the existing current during decay.",
        "Stored magnetic energy must go somewhere.",
        "Correct: the inductor releases stored energy while sustaining the current direction."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the inductor releases stored energy while sustaining the current direction."
    }
  },
  "reactance": {
    "title": "Inductive and capacitive reactance",
    "heading": "Frequency changes the response of L and C in opposite ways.",
    "subtitle": "Inductive and capacitive reactance",
    "target": "Frequency changes the response of L and C in opposite ways.",
    "visual": "mag-reactance",
    "paragraphs": [
      "A sinusoidal voltage across an ideal resistor produces current in phase with the voltage. For an ideal inductor, current lags voltage by 90°, because voltage controls the rate of current change. For an ideal capacitor, current leads voltage by 90°, because current controls the rate at which charge and voltage change.",
      "The reactance magnitudes are XL = 2πfL and XC = 1/(2πfC). Both use ohms, but neither is ordinary dissipative resistance. With an isolated ideal L or C at nonzero sinusoidal frequency, Irms = Vrms/X. Increasing frequency raises inductive reactance and lowers capacitive reactance. A circuit’s filtering behavior also depends on how its components are connected and where output is measured.",
      "During part of a cycle an ideal inductor or capacitor receives energy; during another part it returns energy. Its average power over a full steady sinusoidal cycle is zero. A resistor instead dissipates positive average power. Real components have resistance and other losses, so their average energy account differs from the ideal element model.",
      "The graph normalizes voltage and current separately to compare phase without confusing their different units. Changing the selected component shifts the current trace relative to voltage. The magnitude readout uses the selected frequency and stated component values. A capacitor’s DC limit means zero steady conduction after charging; it does not mean that no transient current ever occurred while the charge was building."
    ],
    "terms": [
      [
        "reactance",
        "Frequency-dependent opposition associated with inductive or capacitive energy storage."
      ],
      [
        "phase difference",
        "The relative position of periodic signals within a cycle."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "L = 0.10 H at f = 50 Hz gives what inductive reactance?",
      "reasoning": "XL = 2π(50)(0.10) ≈ 31.4 Ω. Doubling frequency doubles XL and halves current for the same voltage across the ideal inductor."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "For an ideal capacitor under sinusoidal voltage, current…",
      "options": [
        "Is always zero because the plates do not touch",
        "Leads voltage by a quarter-cycle",
        "Lags voltage by a quarter-cycle"
      ],
      "correct": 1,
      "feedback": [
        "Charging and discharging produce current in the external circuit.",
        "Correct: current is largest when capacitor voltage changes fastest.",
        "Lagging by a quarter-cycle describes an ideal inductor."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. current is largest when capacitor voltage changes fastest."
    }
  },
  "rlc": {
    "title": "RLC series AC circuits",
    "heading": "Combine phase relationships before combining magnitudes.",
    "subtitle": "RLC series AC circuits",
    "target": "Combine phase relationships before combining magnitudes.",
    "visual": "mag-rlc",
    "paragraphs": [
      "In a series RLC circuit, the same instantaneous current flows through every component. The resistor voltage is in phase with that current, the inductor voltage leads it by 90°, and the capacitor voltage lags it by 90°. Their instantaneous voltages add to the source voltage, but their peak or RMS magnitudes cannot simply be added as positive numbers.",
      "The impedance magnitude is Z = √(R² + (XL − XC)²). For sinusoidal steady state, Irms = Vrms/Z. The source-voltage phase relative to current satisfies tan φ = (XL − XC)/R. A positive phase means net inductive behavior and lagging current; a negative phase means net capacitive behavior and leading current.",
      "At f₀ = 1/(2π√LC), the two reactances cancel in the series impedance and Z = R. Current is then largest for a fixed source-voltage amplitude. The inductor and capacitor can each have a large voltage even when their opposing contributions cancel at the source. Resistance limits the resonance peak; a lossless ideal resonance requires a different treatment because no finite steady amplitude is selected.",
      "Average supplied power is VrmsIrms cos φ = Irms²R, with power factor cos φ = R/Z. L and C exchange stored energy while R dissipates it. The model uses positive resistance and computes the phasor triangle, current response, and power account. Its resonance slider compares frequencies relative to f₀, allowing an exact resonance selection without mistaking a nearby sample for exact cancellation."
    ],
    "terms": [
      [
        "impedance",
        "The combined AC relationship between voltage and current, including magnitude and phase."
      ],
      [
        "series resonance",
        "Frequency where inductive and capacitive reactances cancel in a series circuit."
      ],
      [
        "power factor",
        "Average real power divided by VrmsIrms; cos φ for sinusoidal signals."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "At resonance a series circuit has R = 20 Ω and a 12 V RMS source.",
      "reasoning": "Z = 20 Ω, Irms = 0.60 A, power factor = 1, and average power = 7.2 W. Inductor and capacitor voltages cancel as phasors, not by disappearing individually."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At series resonance with positive R…",
      "options": [
        "Source voltage and current are in phase",
        "The current must be infinite",
        "Both stored energies must be zero"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the net reactive voltage is zero and Z = R.",
        "Positive resistance limits the steady current.",
        "Energy can still exchange between electric and magnetic storage."
      ],
      "hint": "Name the source, draw the relevant directions, identify what changes, and check the energy account.",
      "teacher": "Ask for a directional or energy argument and then reverse one condition. the net reactive voltage is zero and Z = R."
    }
  }
} satisfies Record<string,LessonContent>
