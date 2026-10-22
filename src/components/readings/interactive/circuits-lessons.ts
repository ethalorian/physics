import type {LessonContent} from './lesson-contract'
export const circuitLessons:Record<string,LessonContent> = {
  "flow": {
    "title": "Flow of charge",
    "heading": "A sustained current needs a maintained potential difference.",
    "subtitle": "Flow of charge",
    "target": "A sustained current needs a maintained potential difference.",
    "visual": "circuit-flow",
    "paragraphs": [
      "Connect two conductors at different electric potentials and mobile charge can redistribute. For an ordinary resistive connection, the electric field drives a current during that redistribution. If the conductors are isolated reservoirs with only a finite initial imbalance, their potentials approach one another and the transient current falls. A large initial voltage alone does not guarantee a sustained current.",
      "A source such as a battery maintains a potential difference by converting another form of energy. In a complete resistive circuit, it continually supplies energy while charge moves through the conducting path. The source is analogous to a pump that restores a pressure difference in a closed water loop. It supplies the energy needed to keep the circulation going.",
      "The analogy separates a driving difference from the flow it produces. Water pressure is not the same quantity as water flow, and voltage is not electric current. Potential difference is energy per charge; current is charge crossing a chosen surface per time. A source can maintain voltage across an open switch even though the steady current is zero.",
      "Compare the maintained source with the discharging reservoir in the model. The transient uses an ideal capacitor and resistor, with a time scale selected for teaching. It omits inductance and rapid switching effects. In both cases ask where charge crosses the boundary and where energy is converted. An ordinary resistor needs a continuous energy input for a continuous current."
    ],
    "terms": [
      [
        "potential difference",
        "Electrical potential energy change per unit charge between two points."
      ],
      [
        "steady current",
        "A current that does not change with time at the location considered."
      ],
      [
        "transient",
        "A time-dependent response while a system moves between conditions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A charged reservoir initially provides 6 V across 3 Ω. Later its voltage is 3 V.",
      "reasoning": "The current decreases from 2 A to 1 A. A maintained 6 V source would sustain 2 A in the same ideal resistor."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "An ideal battery is connected across an open switch. It can have…",
      "options": [
        "Nonzero voltage and zero steady current",
        "Current without any complete path",
        "Zero voltage merely because current is zero"
      ],
      "correct": 0,
      "feedback": [
        "Correct: voltage can exist across a gap without steady conduction.",
        "An open simple circuit interrupts the steady conducting path.",
        "The source can maintain separation of charge without supplying steady current."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. voltage can exist across a gap without steady conduction."
    }
  },
  "current": {
    "title": "Electric current",
    "heading": "Count charge crossing a surface, not charge sitting in a wire.",
    "subtitle": "Electric current",
    "target": "Count charge crossing a surface, not charge sitting in a wire.",
    "visual": "circuit-current",
    "paragraphs": [
      "Electric current measures the rate at which charge crosses a chosen surface. Average current is I = ΔQ/Δt. One ampere is one coulomb per second, so a two-ampere current transports twice as much net charge through a cross-section in each second as a one-ampere current. The amount transported during a steady interval is Q = It.",
      "Conventional current points in the direction of positive-charge transport. In a metal the mobile carriers are negative electrons, whose net drift is opposite conventional current. Positive ions moving right and negative ions moving left both contribute current to the right. The carrier type and its direction therefore need to be considered together.",
      "A conducting metal already contains mobile electrons. In steady operation, as much charge enters a wire segment as leaves it. The wire remains nearly neutral in bulk, although small surface-charge distributions are important for establishing the electric field. Current does not require a large net charge to accumulate inside every piece of wire.",
      "The illustrated cut through a wire is an accounting surface, not a barrier. The visible dots represent groups of carriers, not a literal microscopic count. Change the transported charge and time separately, then predict their ratio. For a current varying during the interval, Q/Δt describes the average; the instantaneous current is the slope of charge transported versus time."
    ],
    "terms": [
      [
        "electric current",
        "Rate of signed charge transport through a surface."
      ],
      [
        "ampere",
        "SI unit of current, equal to one coulomb per second."
      ],
      [
        "conventional current",
        "Current direction defined by positive-charge transport."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A wire carries 0.4 A for 15 s. How much charge passes one cross-section?",
      "reasoning": "Q = It = 6 C, corresponding to about 3.75 × 10¹⁹ electrons in magnitude. Their drift direction is opposite conventional current."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Negative ions moving left contribute conventional current…",
      "options": [
        "To the left",
        "In no direction because they are negative",
        "To the right"
      ],
      "correct": 2,
      "feedback": [
        "That is the particle direction, not the conventional-current direction.",
        "Negative charge transport contributes to electric current.",
        "Correct: negative charge moving left is positive conventional current to the right."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. negative charge moving left is positive conventional current to the right."
    }
  },
  "source": {
    "title": "Voltage sources",
    "heading": "A source supplies energy per charge.",
    "subtitle": "Voltage sources",
    "target": "A source supplies energy per charge.",
    "visual": "circuit-source",
    "paragraphs": [
      "A battery converts chemical energy into electrical energy available to a circuit. A generator converts mechanical energy, and a solar cell converts energy from light. Their physical mechanisms differ, but each can maintain a potential difference while supplying energy to an attached load within its operating limits.",
      "Voltage describes joules per coulomb. An ideal 9 V source supplies 9 J of energy for each coulomb transported through the source in its supplying direction. This does not specify how many coulombs pass per second. The complete circuit determines the current, and the product of current and source voltage gives the rate of energy delivery.",
      "Electromotive force, written ε or emf, is source energy supplied per charge. Despite its historical name, emf is measured in volts, not newtons. For a battery in the simple emf-plus-internal-resistance model, its open-circuit terminal voltage equals ε. Under load some energy becomes heat inside the source, so terminal voltage can be smaller.",
      "Follow one positive unit of charge around the energy diagram: the ideal source raises potential and the resistive load lowers it. Returning to the starting location returns to the starting potential. The source replaces energy converted in the load, not electrons consumed by the load. Two batteries with the same labeled voltage can have different stored energies and current capabilities."
    ],
    "terms": [
      [
        "voltage source",
        "A device that maintains a potential difference by converting energy."
      ],
      [
        "electromotive force",
        "Energy supplied by a source per unit charge, measured in volts."
      ],
      [
        "load",
        "A circuit element or network receiving electrical energy."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "An ideal 6 V source supplies a current of 0.5 A for 10 s.",
      "reasoning": "5 C crosses the source and it supplies 30 J. Its power is 3 W; voltage, current, and energy are distinct quantities."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Two batteries each labeled 9 V must have…",
      "options": [
        "The same current in every possible circuit",
        "The same nominal energy per charge, not necessarily the same total energy",
        "The same total stored energy"
      ],
      "correct": 1,
      "feedback": [
        "Current depends on the circuit and source behavior.",
        "Correct: voltage is an energy-per-charge rating.",
        "Stored energy also depends on capacity and operating conditions."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. voltage is an energy-per-charge rating."
    }
  },
  "resistance": {
    "title": "Resistance and resistivity",
    "heading": "Separate material properties from geometry and temperature.",
    "subtitle": "Resistance and resistivity",
    "target": "Separate material properties from geometry and temperature.",
    "visual": "circuit-resistivity",
    "paragraphs": [
      "Resistance describes how strongly a component limits current at a specified voltage and operating condition. A uniform wire has R = ρL/A, where ρ is the material resistivity, L its length, and A its cross-sectional area. Resistivity has units Ω·m, while the resistance of the complete wire is measured in ohms.",
      "Doubling length doubles resistance at the same area and resistivity. Doubling area halves resistance. Doubling a round wire’s diameter quadruples its area and therefore quarters its resistance. A thin wire is not resistive merely because it contains fewer electrons in total; geometry changes the conducting paths available along its length.",
      "Temperature also matters. Over a suitable limited interval, R ≈ R₀[1 + α(T − T₀)] if thermal expansion is negligible. Many metals have positive α, while some semiconductors and thermistors have decreasing resistance with increasing temperature. A single linear coefficient should not be extended across an unlimited temperature range.",
      "Some materials become superconducting below a critical temperature under appropriate current and field conditions. Zero DC resistance then allows persistent current in a closed loop without resistive heating. This is a distinct state, not a prediction that every cold conductor becomes perfect. In the model, geometry and a modest temperature change vary independently; the selected material values are illustrative and the superconducting transition is not simulated."
    ],
    "terms": [
      [
        "resistance",
        "Ratio of voltage to current at the stated operating condition."
      ],
      [
        "resistivity",
        "Material property relating a uniform sample’s resistance to its geometry."
      ],
      [
        "temperature coefficient",
        "Fractional resistance or resistivity change per degree in a limited linear approximation."
      ],
      [
        "superconductivity",
        "A state with zero DC electrical resistance under suitable conditions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A wire has ρ = 2 × 10⁻⁸ Ω·m, L = 2 m, and A = 1 mm².",
      "reasoning": "Convert the area to 10⁻⁶ m²: R = 0.040 Ω. Doubling its diameter gives 0.010 Ω at unchanged length and temperature."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Doubling the diameter of a round wire at fixed material and length…",
      "options": [
        "Quarters its resistance",
        "Halves its resistance",
        "Doubles its resistance"
      ],
      "correct": 0,
      "feedback": [
        "Correct: area increases by four in R = ρL/A.",
        "That would follow from doubling area, not diameter.",
        "A larger area reduces resistance."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. area increases by four in R = ρL/A."
    }
  },
  "ohm": {
    "title": "Ohm’s law",
    "heading": "Use proportionality only while resistance stays constant.",
    "subtitle": "Ohm’s law",
    "target": "Use proportionality only while resistance stays constant.",
    "visual": "circuit-ohm",
    "paragraphs": [
      "For an ohmic component under unchanged physical conditions, current is proportional to applied voltage: I = V/R. A graph of current against voltage is a straight line through the origin with slope 1/R. A larger resistance produces a smaller slope, since each volt drives less current.",
      "One ohm equals one volt per ampere. Rearranging gives V = IR or R = V/I, but the algebra alone does not make every device ohmic. A diode has a strongly direction-dependent response, and an incandescent filament heats as its operating point changes. Its effective resistance can therefore change substantially with voltage.",
      "In a simple closed circuit with an ideal voltage source, negligible wire resistance, and one resistor, the resistor’s voltage drop equals the source voltage. The same steady current flows through the whole loop. The source supplies energy while the resistor converts it to thermal energy; charge is neither created at the source nor consumed in the resistor.",
      "Change voltage while holding resistance fixed in the graph. Then compare a deliberately nonlinear teaching curve, I = V/[R(1 + 0.08|V|)], whose increasing effective resistance represents a qualitative heating effect. This curve is not a calibrated lamp model. Use the contrast to decide which predictions require constant resistance and which follow directly from charge or energy conservation."
    ],
    "terms": [
      [
        "Ohm’s law",
        "Current is proportional to voltage for an ohmic component at fixed physical conditions."
      ],
      [
        "ohmic",
        "Having a constant voltage-to-current ratio over the stated operating range."
      ],
      [
        "voltage drop",
        "Decrease in electric potential along the chosen direction across a component."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 12 Ω resistor is connected across 6 V, then 12 V, without changing its temperature.",
      "reasoning": "The currents are 0.5 A and 1 A. The factor-of-two prediction uses the explicit constant-resistance assumption."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Doubling voltage always doubles current in…",
      "options": [
        "Every diode",
        "Every heating filament regardless of temperature",
        "An ohmic resistor at fixed conditions"
      ],
      "correct": 2,
      "feedback": [
        "A diode’s current–voltage response is nonlinear and directional.",
        "Heating can change filament resistance.",
        "Correct: constant resistance gives direct proportionality."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. constant resistance gives direct proportionality."
    }
  },
  "hazard": {
    "title": "Current paths and electrical hazards",
    "heading": "Explain risk without treating a calculation as a safety guarantee.",
    "subtitle": "Current paths and electrical hazards",
    "target": "Explain risk without treating a calculation as a safety guarantee.",
    "visual": "circuit-hazard",
    "paragraphs": [
      "Electrical current through the body can interfere with nerves and muscles, disrupt breathing or heart rhythm, and cause burns. The outcome depends on the current, its path, exposure duration, frequency, and contact conditions. There is no single classroom resistance value that can certify a real contact as safe.",
      "Wet skin can reduce resistance and increase current at a given applied voltage. The useful lesson from I = V/R is this dependence, not permission to test it on a person. Current can split among multiple available paths; it does not exclusively choose one path of least resistance. A small current in one branch can still matter even when another branch carries much more.",
      "An equipment grounding conductor provides a low-impedance fault-return path that helps protective devices disconnect a fault. An ordinary fuse or circuit breaker primarily protects wiring against excessive current. A ground-fault circuit interrupter compares outgoing and returning current and responds to an imbalance. It does not protect against every contact arrangement, including one in which current leaves and returns through the monitored conductors equally.",
      "The drawing uses an abstract load and leakage path, not a human-body simulator. Compare normal operation, leakage, and overload to see why different protective devices answer different questions. A bird-on-one-wire illustration only motivates potential difference; it is never a safe-contact rule for power lines. Treat damaged electrical equipment, water near powered devices, and exposed conductors as hazards requiring qualified help."
    ],
    "terms": [
      [
        "shock hazard",
        "Risk of injury from electric current passing through a person."
      ],
      [
        "ground-fault circuit interrupter",
        "A device that detects an imbalance between outgoing and returning current."
      ],
      [
        "equipment grounding conductor",
        "A conductive fault-return path for exposed equipment parts."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A conceptual circuit sends 2.000 A out and returns 1.994 A through the monitored conductor.",
      "reasoning": "The 0.006 A difference is 6 mA on another path. A small total load current does not rule out a ground fault. The model is not a trip-time or injury predictor."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A standard overcurrent breaker alone guarantees protection from all shocks.",
      "options": [
        "True; current flows only through the lowest-resistance path",
        "False; harmful body current can be below its overcurrent operating range",
        "True; any current through a person exceeds the breaker rating"
      ],
      "correct": 1,
      "feedback": [
        "Current generally divides among available paths.",
        "Correct: overcurrent and ground-fault protection address different conditions.",
        "A circuit rating is not a threshold for human injury."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. overcurrent and ground-fault protection address different conditions."
    },
    "references": [
      {
        "title": "OSHA: ground-fault circuit interrupters and their limits",
        "url": "https://www.osha.gov/etools/construction/electrical-incidents/ground-fault-circuit-interrupters"
      },
      {
        "title": "OSHA: electrical safety training",
        "url": "https://www.osha.gov/sites/default/files/2020-11/Train-the-Trainer_Electrical_binder-English.pdf"
      }
    ]
  },
  "ac": {
    "title": "Direct and alternating current",
    "heading": "Separate signed average, peak, and RMS values.",
    "subtitle": "Direct and alternating current",
    "target": "Separate signed average, peak, and RMS values.",
    "visual": "circuit-ac",
    "paragraphs": [
      "Direct current maintains one direction, although its magnitude need not be constant. Alternating current reverses direction periodically. A sinusoidal source has v(t) = Vpeak sin(2πft). Across a constant resistor, i(t) = v(t)/R, so current and voltage reverse together and are in phase.",
      "Over a whole number of symmetric AC cycles, the signed average voltage and current are zero. The energy delivered to a resistor is not zero: p(t) = v(t)i(t) = v(t)²/R is never negative. Squaring first, averaging, and taking a square root defines RMS voltage. For a sine wave, Vrms = Vpeak/√2 and Irms = Ipeak/√2.",
      "A resistor on sinusoidal AC has average power VrmsIrms = Vrms²/R, equal to the heating from a DC voltage of Vrms. For example, 120 V RMS corresponds to about 170 V peak, not an ordinary signed average of 120 V. Loads containing capacitors, inductors, or switching electronics need a fuller analysis; multiplying RMS voltage and current alone need not give their average real power.",
      "Higher transmission voltage permits a smaller current for the same delivered power and can reduce I²R line heating. Transformers make voltage changes convenient in AC systems; DC transmission also exists with electronic conversion. The graph compares DC and sinusoidal AC across a fixed resistor. Both transfer energy even though only the AC curve changes sign."
    ],
    "terms": [
      [
        "direct current",
        "Charge transport that maintains one conventional direction."
      ],
      [
        "alternating current",
        "Current that periodically reverses direction."
      ],
      [
        "root mean square",
        "Square root of the mean of a squared quantity."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A sine-wave source has a 12 V peak and drives a 6 Ω resistor.",
      "reasoning": "Vrms ≈ 8.49 V, Irms ≈ 1.41 A, and average power = 12 W. Signed average current is zero; peak power is 24 W."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A symmetric AC current has zero signed average. A resistor’s average heating is…",
      "options": [
        "Positive when the current is nonzero",
        "Zero because charge reverses",
        "Negative during half the cycle"
      ],
      "correct": 0,
      "feedback": [
        "Correct: resistive power depends on current squared.",
        "Reversal changes the sign of both voltage and current.",
        "Their product remains nonnegative for a resistor."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. resistive power depends on current squared."
    }
  },
  "rectifier": {
    "title": "Converting AC to DC",
    "heading": "A diode selects direction; a capacitor reduces ripple.",
    "subtitle": "Converting AC to DC",
    "target": "A diode selects direction; a capacitor reduces ripple.",
    "visual": "circuit-rectifier",
    "paragraphs": [
      "A diode conducts much more readily in one direction than the other within its intended operating range. A half-wave rectifier uses this asymmetry to pass one half of an alternating input and block the other. Its output is unidirectional but pulsed, so calling it DC does not imply a perfectly constant value.",
      "A full-wave rectifier redirects the negative half-cycle so that both halves contribute the same output polarity. A bridge commonly uses four diodes; a center-tapped arrangement can use two. The diagram’s ideal full-wave curve describes polarity conversion rather than a complete practical power-supply design. Real diodes have voltage drops, reverse limits, and finite current ratings.",
      "A smoothing capacitor connected across the load charges near input peaks. When the rectified input falls below the capacitor voltage, the diode stops conducting and the capacitor supplies the load. Its voltage then decreases until the next charging interval. Greater capacitance or smaller load current usually reduces the size of this ripple.",
      "The exploration computes an ideal rectifier feeding a resistor with an optional capacitor. Its time axis spans repeated cycles after initial settling. Capacitor voltage follows the input when the ideal diode conducts and decays exponentially through the load between peaks. Regulation and isolation require additional design. A smoothed curve alone does not establish that a real supply is appropriate for a device."
    ],
    "terms": [
      [
        "diode",
        "A component with strongly asymmetric current response to applied voltage."
      ],
      [
        "rectification",
        "Conversion of alternating polarity into unidirectional output."
      ],
      [
        "ripple",
        "Residual variation in a nominally DC output."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A full-wave rectifier is supplied by a 60 Hz sinusoid. How often are charging peaks available?",
      "reasoning": "There are two rectified peaks per input cycle, or 120 per second. This shortens the interval over which the capacitor must support the load."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Adding a smoothing capacitor primarily…",
      "options": [
        "Creates energy without a source",
        "Makes every diode conduct in both directions",
        "Supplies the load between rectified peaks"
      ],
      "correct": 2,
      "feedback": [
        "The capacitor stores source energy and later releases it.",
        "The rectifier’s directional conduction remains essential.",
        "Correct: stored energy supports the load as capacitor voltage falls."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. stored energy supports the load as capacitor voltage falls."
    }
  },
  "drift": {
    "title": "Drift speed and signal speed",
    "heading": "Many slow carriers can carry a substantial current.",
    "subtitle": "Drift speed and signal speed",
    "target": "Many slow carriers can carry a substantial current.",
    "visual": "circuit-drift",
    "paragraphs": [
      "Mobile electrons in a metal have microscopic motion that is much faster and less orderly than their average drift. Without a driving field, motion in different directions does not produce a net current. An applied electric field changes the average motion, producing a small net drift opposite the field for negatively charged electrons.",
      "For one type of carrier with number density n, charge magnitude |q|, and drift-speed magnitude vd, the current magnitude is I = n|q|Avd. The expression counts the carriers in a cylinder of length vdΔt crossing area A during Δt. It relates bulk transport to a microscopic average without claiming every electron follows one straight path.",
      "At fixed current and carrier density, increasing area reduces drift speed. Increasing current in the same wire increases drift speed. A large density of mobile electrons allows appreciable current even when the average drift is only a small fraction of a millimeter per second. Scattering transfers energy to the lattice in the resistive model.",
      "When a switch closes, an electromagnetic change propagates through and around the circuit at a finite speed determined by its geometry and materials. The load does not wait for one particular electron to travel from the source. Local carriers respond as the signal reaches them. The path drawing exaggerates drift and scattering to separate three ideas: microscopic motion, average carrier transport, and propagation of a signal."
    ],
    "terms": [
      [
        "drift velocity",
        "Average velocity of charge carriers associated with net transport."
      ],
      [
        "carrier density",
        "Number of mobile charge carriers per unit volume."
      ],
      [
        "signal propagation",
        "Travel of a change in electromagnetic conditions through a system."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Use n = 8 × 10²⁸ m⁻³, A = 1 mm², and I = 1 A.",
      "reasoning": "vd = I/(neA) ≈ 7.80 × 10⁻⁵ m/s = 0.078 mm/s. This is a drift speed, not the speed at which a switch’s effect reaches the lamp."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Double wire area while holding current and carrier density fixed. Drift speed…",
      "options": [
        "Becomes the speed of light",
        "Halves",
        "Doubles"
      ],
      "correct": 1,
      "feedback": [
        "Signal speed and drift speed are different quantities.",
        "Correct: vd = I/(n|q|A).",
        "A larger area provides more carriers crossing simultaneously."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. vd = I/(n|q|A)."
    }
  },
  "carriers": {
    "title": "Where circuit carriers come from",
    "heading": "The load receives energy while charge is conserved.",
    "subtitle": "Where circuit carriers come from",
    "target": "The load receives energy while charge is conserved.",
    "visual": "circuit-carriers",
    "paragraphs": [
      "A metal wire contains mobile conduction electrons before it is connected to a battery. A lamp filament does too. Closing a circuit establishes conditions that make these local carriers drift. A battery does not need to manufacture electrons and send a fresh supply to every device before those devices can respond.",
      "In a steady series circuit the same current enters and leaves the load. If charge continually entered faster than it left, charge would accumulate and change the fields until a different condition developed. The load converts electrical energy to light, heat, or mechanical work; it does not consume the electric charge passing through it.",
      "For sinusoidal AC, carriers can move back and forth with essentially no net transport over a complete cycle while energy is still delivered. Voltage and current reverse together in a resistor, leaving their product positive. Electromagnetic fields carry energy through the circuit environment and into the load; the simple circuit model tracks this transfer as power VI.",
      "Charge carriers need not always be electrons. Ions carry current in electrolytes and biological fluids, and chemical reactions connect electronic and ionic transport at battery interfaces. A single electron need not pass unchanged through every material inside a cell. The model highlights equal current at two cuts in a steady loop and a separate energy account. Use it to explain what a utility supplies and what already exists in the connected materials."
    ],
    "terms": [
      [
        "conduction electron",
        "An electron able to move through a conducting material."
      ],
      [
        "charge continuity",
        "The relationship between charge accumulation and the currents crossing a boundary."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A lamp has 0.25 A entering and leaving while 12 V is across it.",
      "reasoning": "Its power input is 3 W. During 4 s, 1 C passes each boundary and 12 J is converted; there is no growing charge stockpile."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A lit lamp in a steady series circuit has…",
      "options": [
        "Equal incoming and outgoing current while converting energy",
        "Less outgoing current because light consumes electrons",
        "More outgoing current because heat creates charge"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the charge account balances while energy changes form.",
        "Electrical energy is converted; charge is not used up.",
        "Ordinary lamp heating does not generate net charge."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. the charge account balances while energy changes form."
    }
  },
  "power": {
    "title": "Electric power and energy",
    "heading": "State what is fixed before comparing heating.",
    "subtitle": "Electric power and energy",
    "target": "State what is fixed before comparing heating.",
    "visual": "circuit-power",
    "paragraphs": [
      "Electrical power is the rate of energy transfer. For a DC load, P = IV. A watt is a joule per second. Combining this relation with an ohmic resistance gives P = I²R = V²/R. The equations agree, but each comparison needs a clear condition: fixed current and fixed voltage are different experiments.",
      "At fixed voltage, a smaller resistance draws more current and receives more power. At fixed current, a larger resistance has a larger voltage drop and receives more power. In a series pair the current is shared, so the larger resistor dissipates more. In a parallel pair the voltage is shared, so the smaller resistor dissipates more.",
      "Energy transferred over a steady interval is E = Pt. A kilowatt-hour is an energy unit equal to 3.6 × 10⁶ J. A 0.1 kW device used for 5 h consumes 0.5 kWh. Multiply energy by a stated tariff to estimate its energy charge; real bills may include other charges and prices vary. The model’s tariff is an illustrative assumption.",
      "Input electrical power is not automatically useful light or mechanical output. Devices can deliver similar useful output with different efficiency and power consumption. Name the energy forms and system boundary when comparing them. The exploration separates the electrical operating condition, elapsed use, and price so a student can explain which change affects power and which affects accumulated energy."
    ],
    "terms": [
      [
        "electric power",
        "Rate of electrical energy transfer or conversion."
      ],
      [
        "kilowatt-hour",
        "Energy transferred at one kilowatt for one hour."
      ],
      [
        "efficiency",
        "Useful output energy divided by input energy for a stated process."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 60 W lamp runs for 5 h at an illustrative $0.20 per kWh.",
      "reasoning": "Energy = 0.060 × 5 = 0.300 kWh, so the energy charge is $0.06. Doubling time doubles energy without changing the 60 W power."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Increase R while keeping current fixed. Resistor power…",
      "options": [
        "Decreases because V²/R has R in the denominator",
        "Must stay fixed",
        "Increases"
      ],
      "correct": 2,
      "feedback": [
        "That comparison incorrectly assumes voltage stays fixed too.",
        "Power depends on the resistance under a fixed-current condition.",
        "Correct: I²R increases, and the source must supply a larger voltage."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. I²R increases, and the source must supply a larger voltage."
    }
  },
  "loop": {
    "title": "A battery and a bulb",
    "heading": "Trace a complete path through both bulb contacts.",
    "subtitle": "A battery and a bulb",
    "target": "Trace a complete path through both bulb contacts.",
    "visual": "circuit-loop",
    "paragraphs": [
      "A simple incandescent bulb has two separate electrical contacts connected through its filament. In a typical screw-base bulb these are the metal shell and the small bottom contact, separated by insulation. A complete circuit connects one battery terminal to one contact and the other terminal to the other contact, so current passes through the filament.",
      "Touching both wires to the same contact fails to place the source voltage across the filament. Leaving one connection missing makes an open circuit. A conducting connection directly across the source that bypasses the intended load is a short circuit and can produce excessive current. Explore these arrangements in the diagram rather than shorting a physical battery.",
      "When the circuit is correctly closed, the carriers already present throughout the conductors respond to the evolving field. The source supplies energy and the filament converts much of it to thermal energy, with some emitted as visible light. In steady operation the current is the same on both sides of the filament.",
      "The visual uses a constant-resistance lamp to isolate connectivity. A real incandescent filament’s resistance increases markedly as it warms, so brightness is not generally proportional to current. The symbol glow only indicates whether the intended filament path is complete; it is not a temperature or luminous-output calculation. Follow the two contacts and the source terminals before deciding whether an arrangement works."
    ],
    "terms": [
      [
        "closed circuit",
        "A complete conducting path through the components being considered."
      ],
      [
        "open circuit",
        "A path interrupted by a gap that prevents steady conduction in the simple model."
      ],
      [
        "short circuit",
        "An unintended low-resistance path bypassing the intended load."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Both battery wires touch the shell of a bulb, and neither touches its bottom contact.",
      "reasoning": "There is no complete path through the filament. The arrangement may connect the battery terminals through the shell, making a hazardous bypass rather than lighting the bulb."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Which connection lights the ideal bulb?",
      "options": [
        "One terminal connected with no return path",
        "Opposite battery terminals connected to its two distinct contacts",
        "Both terminals connected only to its shell"
      ],
      "correct": 1,
      "feedback": [
        "The steady circuit requires a return path.",
        "Correct: this makes a complete path through the filament.",
        "That bypasses the filament rather than placing voltage across it."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. this makes a complete path through the filament."
    }
  },
  "connections": {
    "title": "Electric circuits",
    "heading": "Identify branches before deciding what stays equal.",
    "subtitle": "Electric circuits",
    "target": "Identify branches before deciding what stays equal.",
    "visual": "circuit-connections",
    "paragraphs": [
      "A circuit diagram represents connections, not the physical layout on a table. Ideal wires join points into a node of one potential. Components connected between the same two nodes are in parallel, even if their drawn shapes and positions differ. Components in a simple unbranched chain are in series because the same current must pass through each.",
      "Closing a switch joins two parts of a conducting path; opening it interrupts that path. The everyday word open can be misleading because opening a water tap starts flow, whereas opening an electrical switch stops conduction through that branch. A source can still maintain voltage across the open gap.",
      "For a series connection, current cannot divide at an intermediate point with no branch. For parallel connections, a junction allows total current to split and later recombine. Each branch current is set by the branch voltage and its components. A break in one parallel branch need not interrupt other branches when the source maintains their voltage.",
      "Switch the exploration between two topologies while keeping the component resistances and source voltage the same. Trace a complete route from one source terminal to the other, then compare routes. Ideal source and wire assumptions make the contrast clean. Later, including source or wire resistance explains why adding a real parallel load can change the voltage available to the existing loads."
    ],
    "terms": [
      [
        "node",
        "A set of points connected by ideal wire and sharing one potential."
      ],
      [
        "branch",
        "A distinct conducting path between circuit junctions."
      ],
      [
        "topology",
        "The pattern of component connections independent of drawing shape."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Two resistors each touch node A at one end and node B at the other.",
      "reasoning": "They are parallel regardless of how the wires bend on the drawing. Their voltages are equal; their currents need not be."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Two components are parallel when…",
      "options": [
        "They connect to the same two nodes",
        "They are drawn side by side",
        "They have equal resistance"
      ],
      "correct": 0,
      "feedback": [
        "Correct: shared node endpoints determine equal voltage.",
        "Page position does not determine electrical connection.",
        "Equal resistance is neither necessary nor sufficient."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. shared node endpoints determine equal voltage."
    }
  },
  "series": {
    "title": "Series circuits",
    "heading": "One current, shared source voltage.",
    "subtitle": "Series circuits",
    "target": "One current, shared source voltage.",
    "visual": "circuit-series",
    "paragraphs": [
      "Resistors in a simple series chain carry the same steady current. Charge cannot be continually lost at each resistor or pile up between them. Instead, each component transfers energy from the electrical system while the same amount of charge passes through every cross-section in each second.",
      "The voltage drops add: Vsource = V₁ + V₂ + …. Using Vᵢ = IRᵢ gives Req = R₁ + R₂ + …. The total current is Vsource/Req. A larger resistance in the chain has a larger voltage drop because the common current multiplies a larger R.",
      "Equal resistors divide the source voltage equally. Unequal resistors do not. For two resistors the voltage across the second is V₂ = VsourceR₂/(R₁ + R₂), the unloaded voltage-divider relation. Connecting another load across that resistor changes the network and can change this division.",
      "Adding another resistor in series to a fixed ideal voltage source increases total resistance and reduces current through every resistor. Opening any point in the only path interrupts the steady current everywhere. The model shows potential drops and current separately to make the distinction visible. It uses fixed ohmic resistors; lamp temperature and source internal resistance are additional effects. Always compute the complete circuit current before finding an individual resistor’s voltage or power."
    ],
    "terms": [
      [
        "series connection",
        "A connection in which the same current passes sequentially through components."
      ],
      [
        "voltage divider",
        "A series arrangement that allocates source voltage according to resistance."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Place 2 Ω and 4 Ω in series across 12 V.",
      "reasoning": "Req = 6 Ω and I = 2 A. The voltage drops are 4 V and 8 V, and their powers are 8 W and 16 W."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "In a series pair with unequal resistances…",
      "options": [
        "Voltage is equal and current differs",
        "Current is consumed by the first resistor",
        "Current is equal and voltage drops differ"
      ],
      "correct": 2,
      "feedback": [
        "That describes the equality associated with parallel branches.",
        "The resistor transfers energy without consuming charge.",
        "Correct: continuity fixes the common current and Vi = IRi sets each drop."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. continuity fixes the common current and Vi = IRi sets each drop."
    }
  },
  "parallel": {
    "title": "Parallel circuits",
    "heading": "Shared voltage, divided current.",
    "subtitle": "Parallel circuits",
    "target": "Shared voltage, divided current.",
    "visual": "circuit-parallel",
    "paragraphs": [
      "Parallel resistors connect between the same two nodes and therefore have the same voltage. Each branch current is Iᵢ = V/Rᵢ. A smaller branch resistance carries more current, while a larger resistance carries less. The currents are equal only when the branch resistances are equal under the same conditions.",
      "Charge conservation at a junction gives Itotal = I₁ + I₂ + …. Dividing by the common voltage leads to 1/Req = 1/R₁ + 1/R₂ + …. The equivalent resistance is smaller than the smallest individual finite positive resistance because the additional branch adds another route for conduction.",
      "For two equal resistors R, the equivalent is R/2. For an unequal pair, Req = R₁R₂/(R₁ + R₂). Taking the reciprocal at the end matters: the sum of inverse resistances is conductance, not resistance. Check that an answer for Req is smaller than either branch before using it.",
      "At fixed ideal source voltage, adding a parallel branch leaves existing branch currents unchanged but increases source current. Opening one branch leaves the other complete paths working. These predictions depend on maintaining the terminal voltage; real wire and source resistance can produce voltage sag. In the model, compare each labeled branch current with the total rather than assigning the source current to every branch."
    ],
    "terms": [
      [
        "parallel connection",
        "Components connected between the same two nodes and sharing a voltage."
      ],
      [
        "conductance",
        "Reciprocal of resistance, measured in siemens."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Place 6 Ω and 3 Ω in parallel across 12 V.",
      "reasoning": "Branch currents are 2 A and 4 A. The total is 6 A and Req = 2 Ω. Both branches have 12 V across them."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Add another branch across a fixed ideal voltage source. Existing branch current…",
      "options": [
        "Doubles in every branch",
        "Stays the same while source current increases",
        "Falls because the source has a fixed current budget"
      ],
      "correct": 1,
      "feedback": [
        "Only the newly connected branch adds a new current contribution.",
        "Correct: each existing branch still has the same V and R.",
        "An ideal voltage source fixes voltage, not total current."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. each existing branch still has the same V and R."
    }
  },
  "schematic": {
    "title": "Reading schematic diagrams",
    "heading": "Connections carry meaning; artistic placement does not.",
    "subtitle": "Reading schematic diagrams",
    "target": "Connections carry meaning; artistic placement does not.",
    "visual": "circuit-schematic",
    "paragraphs": [
      "A schematic simplifies a physical circuit into standard symbols and connected nodes. A straight line denotes an ideal conducting connection. A zigzag or rectangular resistor symbol denotes resistance, while a cell uses a long line for its positive terminal and a shorter line for its negative terminal. A switch shows whether the path is connected or interrupted.",
      "A lamp symbol represents a component with two terminals, not a container into which electricity disappears. A filled junction dot indicates an intended wire connection in the drawings used here. A crossing without a dot is shown with an explicit bridge when necessary, so that two crossing paths are not mistaken for one node.",
      "To read a diagram, mark every continuous ideal-wire node, then record the two nodes attached to each component. Stretching a wire or moving a symbol on the page does not change that list. The same network can therefore be drawn in several shapes while keeping the same equivalent resistance and branch behavior.",
      "The exploration redraws a parallel pair without changing its node endpoints. It then contrasts a series pair, where an intermediate node connects just the two resistors. Trace the wiring rather than guessing from which symbols appear beside one another. Schematics omit physical spacing, insulation, and component ratings; they are reasoning tools, not complete construction plans for actual electrical installations."
    ],
    "terms": [
      [
        "schematic diagram",
        "A symbolic drawing of circuit elements and their electrical connections."
      ],
      [
        "junction",
        "A location where conducting branches connect."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A resistor is moved to the far side of a page while its two node connections remain A and B.",
      "reasoning": "Its electrical relationship to the other components is unchanged. Redrawing a circuit does not change the circuit’s topology."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A resistor drawn beside another must be parallel to it.",
      "options": [
        "False; compare both node endpoints",
        "True; side-by-side placement defines parallel",
        "True if their symbols are the same size"
      ],
      "correct": 0,
      "feedback": [
        "Correct: connectivity, not placement, defines the network.",
        "Wire connections can create series or parallel arrangements in many shapes.",
        "Symbol size carries no such electrical meaning."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. connectivity, not placement, defines the network."
    }
  },
  "mixed": {
    "title": "Combining resistors",
    "heading": "Reduce a network, then restore its branch details.",
    "subtitle": "Combining resistors",
    "target": "Reduce a network, then restore its branch details.",
    "visual": "circuit-mixed",
    "paragraphs": [
      "A mixed network can contain a parallel pair in series with another resistor. First identify the shared nodes of the pair. Replace it with Rp = R₂R₃/(R₂ + R₃), then add the series resistance: Req = R₁ + Rp. This replacement preserves the current–voltage relationship seen from the source terminals.",
      "The equivalent resistor does not preserve every internal current or voltage by itself. After finding source current I = Vsource/Req, restore the original network. The series resistor has drop IR₁, leaving Vp = Vsource − IR₁ across both parallel branches. Their currents are Vp/R₂ and Vp/R₃ and must sum to I.",
      "A small series resistance can represent connecting wires. Adding a low-resistance parallel load increases total current, increases the wire’s voltage drop, and lowers the voltage available to an existing load. That explains why the unchanged branch-current prediction for ideal parallel circuits may fail with real supply wiring or source resistance.",
      "Use the full-network and reduced-network views to check each stage of the calculation. Preserve the source terminals and never combine resistors merely because they look adjacent. Some bridge networks cannot be simplified by repeated series and parallel reductions. Those require a more general method such as Kirchhoff’s rules. The exploration deliberately uses a reducible three-resistor network so every reduction can be justified from its connections."
    ],
    "terms": [
      [
        "equivalent resistance",
        "Resistance giving the same terminal current–voltage relation as a network."
      ],
      [
        "voltage sag",
        "Reduction in available terminal voltage as load current increases."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 2 Ω resistor is in series with 6 Ω and 3 Ω in parallel, across 12 V.",
      "reasoning": "The pair is 2 Ω, total is 4 Ω, and source current is 3 A. The pair receives 6 V, giving branch currents 1 A and 2 A."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "After replacing a parallel pair by its equivalent, its two original currents…",
      "options": [
        "Both equal the total source current",
        "Disappear from the charge account",
        "Must be recovered using the pair’s voltage"
      ],
      "correct": 2,
      "feedback": [
        "The total splits between the two branches.",
        "Charge conservation still constrains the original network.",
        "Correct: the equivalent preserves terminal behavior, not individual branch values."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. the equivalent preserves terminal behavior, not individual branch values."
    }
  },
  "overload": {
    "title": "Parallel circuits and overloading",
    "heading": "Branch currents add in the supply wires.",
    "subtitle": "Parallel circuits and overloading",
    "target": "Branch currents add in the supply wires.",
    "visual": "circuit-overload",
    "paragraphs": [
      "A supply circuit commonly serves several loads in parallel so each receives approximately the same operating voltage. Turning on another load adds its branch current to the current in the shared supply conductors. Independent operation of the loads does not mean that the common wiring carries only one load’s current.",
      "Real wires have resistance. Their heating rate is I²Rwire, so doubling total line current quadruples line heating if resistance stays fixed. An overload means the connected demand exceeds what the wiring and protective system are intended to support. A short circuit is different: an unintended low-resistance connection can bypass the normal load and produce a very large fault current.",
      "A fuse or breaker is placed in series with the protected circuit so the relevant supply current passes through it. It opens the path under specified overcurrent conditions. A fuse melts an element and must be replaced appropriately; a breaker uses a switching mechanism. Real devices have time–current characteristics, so a current rating is not an exact instantaneous cutoff boundary.",
      "The model totals three illustrative constant-power resistive loads at a stated voltage and reports the corresponding wire heating. Its 15 A reference is a comparison marker, not a wiring design or a prediction of trip time. Overcurrent protection is distinct from ground-fault protection and does not make every shock path safe. Explain both the branch-current sum and the squared effect on the common wire before proposing which load change reduces heating."
    ],
    "terms": [
      [
        "overload",
        "Demand exceeding the intended current capacity of a circuit or system."
      ],
      [
        "fuse",
        "An overcurrent device whose element melts to interrupt a circuit."
      ],
      [
        "circuit breaker",
        "A resettable device designed to interrupt a circuit under specified fault conditions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Two modeled loads draw 8 A and 10 A from one supply. A third draws 2 A.",
      "reasoning": "The line carries 20 A when all are on. Relative to the 10 A load alone, heating in the same wire is four times as large."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Adding a parallel load usually reduces equivalent load resistance and…",
      "options": [
        "Makes line heating vanish",
        "Increases total line current at fixed voltage",
        "Reduces current in the shared line"
      ],
      "correct": 1,
      "feedback": [
        "Real wires dissipate I²R even when loads are parallel.",
        "Correct: more conducting paths increase total demand.",
        "Current contributions add in the common conductors."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. more conducting paths increase total demand."
    }
  },
  "terminal": {
    "title": "Emf and terminal voltage",
    "heading": "Include source resistance in the energy account.",
    "subtitle": "Emf and terminal voltage",
    "target": "Include source resistance in the energy account.",
    "visual": "circuit-terminal",
    "paragraphs": [
      "A useful battery model places an ideal emf ε in series with an internal resistance r. With load resistance R, current is I = ε/(R + r). When the battery supplies current from its positive terminal, its terminal voltage is V = ε − Ir = IR. Emf and terminal voltage coincide at zero current in this model.",
      "Increasing internal resistance at fixed emf and load reduces current, terminal voltage, and power delivered to the load. It does not imply a change in the definition of voltage. The source power εI divides into load power I²R and internal heating I²r. This accounting makes explicit where the energy goes.",
      "For cells in series, emfs add with signs determined by orientation and internal resistances add. Two identical aligned cells double the emf but also double internal resistance. Two identical sources in parallel have the same emf as one and half the effective internal resistance in this ideal matched-source model. Mismatched real batteries require appropriate management and must not be casually connected together.",
      "Charging reverses the current through a rechargeable battery. With current defined positive outward, a negative I makes terminal voltage exceed emf by the internal drop magnitude. Charging requires controlled equipment appropriate to the chemistry. Biological electric organs and photovoltaic arrays also combine sources, but their details cannot be inferred from one fixed-resistance battery model. Use the model to distinguish source capability, energy delivery, and a load-dependent terminal measurement."
    ],
    "terms": [
      [
        "internal resistance",
        "A model of resistive energy loss inside a source."
      ],
      [
        "terminal voltage",
        "Potential difference measured across a source’s external terminals."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A source has ε = 12 V, r = 1 Ω, and R = 5 Ω.",
      "reasoning": "I = 2 A, terminal voltage = 10 V, load power = 20 W, and internal heating = 4 W. The source supplies 24 W."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Two identical modeled cells in parallel have…",
      "options": [
        "The same emf and half the effective internal resistance",
        "Twice the emf and twice the internal resistance",
        "Zero internal resistance"
      ],
      "correct": 0,
      "feedback": [
        "Correct: equal source voltages remain equal while their internal paths share current.",
        "That describes two aligned cells in series.",
        "Finite parallel resistances combine to a smaller, nonzero value."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. equal source voltages remain equal while their internal paths share current."
    }
  },
  "kirchhoff": {
    "title": "Kirchhoff’s rules",
    "heading": "Use signed currents and independent conservation equations.",
    "subtitle": "Kirchhoff’s rules",
    "target": "Use signed currents and independent conservation equations.",
    "visual": "circuit-kirchhoff",
    "paragraphs": [
      "Kirchhoff’s junction rule states that total current entering a steady node equals total current leaving it. It is charge conservation with no continuing accumulation at the node. Assign an arrow to each unknown current; a negative result means the actual current runs opposite the chosen arrow, not that the solution is physically impossible.",
      "The loop rule states that signed voltage changes around a closed loop sum to zero in the lumped DC model. Crossing a resistor with its assigned current gives −IR; crossing against it gives +IR. Crossing an ideal source from negative to positive gives +ε, and reversing that traversal gives −ε. These signs describe potential changes, not a new rule for charge direction.",
      "The exploration has two source branches feeding one load node. Let the lower node be zero, the upper node V, and source-branch currents point toward the upper node. Then I₁ = (ε₁ − V)/R₁, I₂ = (ε₂ − V)/R₂, and I₃ = V/R₃. The junction equation I₁ + I₂ = I₃ determines V and all three currents.",
      "Write independent equations before solving; a second traversal of the same loop in reverse does not supply new information. Verify both junction balance and power balance afterward. If one source absorbs power, its signed source power is negative. Time-varying magnetic flux requires an induced-emf treatment beyond this DC model. The displayed arrows remain reference arrows even when a calculated current reverses."
    ],
    "terms": [
      [
        "junction rule",
        "Steady currents entering a node sum to the currents leaving it."
      ],
      [
        "loop rule",
        "Signed potential changes around a closed DC circuit loop sum to zero."
      ],
      [
        "reference direction",
        "An assigned positive direction used to interpret a signed quantity."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Let ε₁ = 12 V, ε₂ = 6 V, R₁ = R₂ = 2 Ω, and R₃ = 4 Ω.",
      "reasoning": "(12 − V)/2 + (6 − V)/2 = V/4 gives V = 7.2 V. I₁ = 2.4 A, I₂ = −0.6 A, and I₃ = 1.8 A. The second branch runs opposite its arrow."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A calculated branch current is negative. This means…",
      "options": [
        "Charge conservation failed",
        "The resistor has negative resistance",
        "Its actual direction is opposite the reference arrow"
      ],
      "correct": 2,
      "feedback": [
        "Signed currents still satisfy the junction rule.",
        "A negative current does not imply a negative resistance.",
        "Correct: reference directions can be chosen before the solution is known."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. reference directions can be chosen before the solution is known."
    }
  },
  "meters": {
    "title": "Voltmeters and ammeters",
    "heading": "A measurement can change the circuit.",
    "subtitle": "Voltmeters and ammeters",
    "target": "A measurement can change the circuit.",
    "visual": "circuit-meters",
    "paragraphs": [
      "A voltmeter measures potential difference and connects across the two nodes of the component being measured. It should have a large input resistance so it draws little additional current. An ammeter measures branch current and connects in series with that branch. It should have a small resistance so it adds little voltage drop.",
      "A finite-resistance voltmeter placed across one resistor in a divider changes that resistor’s effective value. The reading can then differ from the original unloaded voltage even if the meter is perfectly calibrated. Likewise, adding ammeter resistance to a branch reduces the current being measured. Loading error is a circuit effect, separate from calibration error.",
      "An analog galvanometer has a full-scale current Ig and internal resistance Rg. A voltmeter range Vmax requires a series multiplier resistance Rs = Vmax/Ig − Rg. An ammeter range Imax uses a parallel shunt Rsh = IgRg/(Imax − Ig), so most current bypasses the sensitive movement. These formulas assume ranges greater than the bare instrument capability.",
      "The model compares an unloaded divider with a voltmeter-loaded one and a simple branch before and after adding ammeter resistance. A separate range calculation uses a 1 mA, 100 Ω movement. Never connect a low-resistance ammeter directly across a source: it creates a potentially destructive low-resistance path. Real instruments also require appropriate ratings, terminals, and procedures. Here the goal is to explain why each measurement belongs in its stated topology."
    ],
    "terms": [
      [
        "voltmeter",
        "An instrument measuring potential difference between two nodes."
      ],
      [
        "ammeter",
        "An instrument measuring current through a branch."
      ],
      [
        "shunt",
        "A parallel low-resistance path that diverts part of a current."
      ],
      [
        "loading error",
        "A change caused by connecting a measuring instrument to the system."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 1 mA, 100 Ω galvanometer must read 10 V at full scale.",
      "reasoning": "Its total resistance must be 10,000 Ω, so add 9,900 Ω in series. A 1 A ammeter range would instead need a shunt of about 0.1001 Ω."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "To minimize voltmeter loading, its input resistance should be…",
      "options": [
        "Placed in series with the measured branch",
        "Large compared with the resistance it bridges",
        "Zero"
      ],
      "correct": 1,
      "feedback": [
        "A voltmeter compares the potentials at two nodes.",
        "Correct: a high input resistance draws less current.",
        "A zero-resistance parallel meter would short the measured nodes."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. a high input resistance draws less current."
    }
  },
  "null": {
    "title": "Null measurements",
    "heading": "Balance two potentials to avoid drawing detector current.",
    "subtitle": "Null measurements",
    "target": "Balance two potentials to avoid drawing detector current.",
    "visual": "circuit-null",
    "paragraphs": [
      "A null measurement adjusts a known electrical condition until a detector reads zero current. Equal detector-terminal potentials then prevent current through the detector branch. This removes one source of loading, although uncertainty in standards, contacts, temperature, and detecting the exact zero still remains.",
      "A potentiometer comparison maintains a steady voltage gradient along a uniform wire. An unknown emf is opposed to the voltage across an adjustable length until the detector current vanishes. Comparing balance lengths for an unknown and a reference source gives εunknown/εreference = Lunknown/Lreference, provided the gradient is unchanged. The test source supplies no detector current at balance.",
      "A Wheatstone bridge uses two voltage dividers across one source. In the drawing, R₁ is above R₂ on the left and R₃ is above the unknown Rx on the right. The midpoint potentials are VL = VsourceR₂/(R₁ + R₂) and VR = VsourceRx/(R₃ + Rx) when the detector is open. At a null, VL = VR, giving Rx = R₂R₃/R₁.",
      "The model displays the open-detector voltage difference while you adjust R₃. A real finite detector affects the unbalanced network, but at zero current the balance equation applies. Change the source voltage and notice that the balance ratio stays the same. A null means equal midpoint potentials, not zero current everywhere in the bridge; both divider branches can continue conducting."
    ],
    "terms": [
      [
        "null measurement",
        "A comparison adjusted until detector current is zero."
      ],
      [
        "Wheatstone bridge",
        "A four-resistor network using equal divider potentials to determine an unknown resistance."
      ],
      [
        "potentiometer comparison",
        "A null voltage measurement using an adjustable reference potential difference."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "At bridge balance R₁ = 100 Ω, R₂ = 200 Ω, and R₃ = 150 Ω.",
      "reasoning": "Rx = R₂R₃/R₁ = 300 Ω. Both divider midpoints are two-thirds of the source voltage above the lower node."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At a balanced bridge…",
      "options": [
        "Detector current is zero while divider currents can remain nonzero",
        "All four resistors carry zero current",
        "Every resistor must have the same resistance"
      ],
      "correct": 0,
      "feedback": [
        "Correct: only the detector endpoints have equal potential.",
        "The source still drives the two divider branches.",
        "Equal ratios, rather than four equal values, establish balance."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. only the detector endpoints have equal potential."
    }
  },
  "rc": {
    "title": "Resistor–capacitor circuits",
    "heading": "Time changes voltage and current together.",
    "subtitle": "Resistor–capacitor circuits",
    "target": "Time changes voltage and current together.",
    "visual": "circuit-rc",
    "paragraphs": [
      "A resistor and capacitor connected to a DC source produce a time-dependent response. For an initially uncharged ideal capacitor charging through total series resistance R, VC(t) = ε[1 − exp(−t/RC)]. Current starts at ε/R and falls as I(t) = (ε/R)exp(−t/RC), because the increasing capacitor voltage leaves less voltage across the resistor.",
      "The time constant τ = RC has units of seconds. At one time constant the capacitor reaches about 63.2% of its final charging voltage. After five time constants it is about 99.3% charged in this model. The mathematical exponential approaches its final value without reaching it at a finite time.",
      "For discharge from initial voltage V₀ through a resistor, VC(t) = V₀exp(−t/RC). After one time constant 36.8% of the initial voltage remains. Current flows in the opposite direction to charging when the same reference is used. Stored energy is ½CVC², so its discharge decay is faster than the voltage decay: after one τ, about 13.5% of the initial energy remains.",
      "Timing circuits exploit predictable threshold crossings. Reaching a fraction f of the final charging voltage takes t = −RC ln(1 − f). A flash can charge slowly through one resistance and discharge rapidly through another; motion blur is approximately speed times flash duration. These models omit leakage, inductance, switching details, and real lamp behavior. Disconnecting a source does not by itself discharge an isolated capacitor."
    ],
    "terms": [
      [
        "time constant",
        "The product RC setting the exponential response timescale."
      ],
      [
        "exponential decay",
        "A decrease by the same fraction during each equal time interval."
      ],
      [
        "RC circuit",
        "A circuit whose time-dependent behavior involves resistance and capacitance."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 100 μF capacitor charges through 10 kΩ from a 12 V source.",
      "reasoning": "τ = 1 s. At 1 s, VC ≈ 7.59 V and I ≈ 0.441 mA. Reaching 90% takes about 2.303 s."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "After one time constant of discharge, the stored energy is…",
      "options": [
        "36.8% because energy is proportional to voltage",
        "Zero because one time constant completes discharge",
        "About 13.5% of its initial value"
      ],
      "correct": 2,
      "feedback": [
        "The 36.8% factor applies to voltage and charge.",
        "The ideal exponential approaches zero gradually.",
        "Correct: energy depends on voltage squared, giving exp(−2)."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. energy depends on voltage squared, giving exp(−2)."
    }
  },
  "nerve": {
    "title": "Nerve conduction and electrocardiograms",
    "heading": "Distinguish local ion movement from a traveling electrical signal.",
    "subtitle": "Nerve conduction and electrocardiograms",
    "target": "Distinguish local ion movement from a traveling electrical signal.",
    "visual": "circuit-nerve",
    "paragraphs": [
      "A neuron maintains different ion concentrations inside and outside its membrane. Selective permeability and electrochemical gradients create a membrane potential, while pumps use metabolic energy to maintain the gradients over time. The bulk fluids remain nearly neutral; a small separated charge near the membrane is enough to support a voltage.",
      "An action potential is a temporary change in the membrane voltage at one location. In a simplified neuronal sequence, sodium-channel opening supports depolarization, followed by sodium-channel inactivation and increased potassium conductance that supports repolarization. Ion movement across one patch helps bring adjacent membrane to threshold. The signal travels along the axon even though an individual sodium ion does not travel the whole length with it.",
      "Myelin changes the electrical properties of the axon membrane. Local current spreads between exposed nodes of Ranvier, where action potentials are regenerated. This saltatory conduction can be much faster than regeneration along every adjacent membrane patch. The illustration shows the sequence rather than a quantitative biological speed model; axon diameter and many other properties also matter.",
      "An electrocardiogram records body-surface voltage differences associated with the heart’s electrical activity. In a simplified tracing, P reflects atrial depolarization, QRS ventricular depolarization, and T ventricular repolarization. Electrical activation precedes mechanical contraction; the ECG is not a blood-pressure graph or a direct force measurement. Different leads view different voltage differences. The schematic waveform teaches timing and signal type and cannot be used to diagnose a person."
    ],
    "terms": [
      [
        "action potential",
        "A transient change in membrane voltage that can propagate by regeneration."
      ],
      [
        "myelin",
        "Insulating membrane wrapping that changes axonal electrical properties."
      ],
      [
        "electrocardiogram",
        "A recording of voltage differences associated with cardiac electrical activity."
      ],
      [
        "depolarization",
        "A change making membrane potential less negative than its resting value."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A traveling nerve signal reaches successive nodes while ions cross locally at each active node.",
      "reasoning": "The propagated pattern is not one ion traveling from start to finish. Likewise, an ECG waveform is an electrical measurement associated with coordinated activation, not the motion of one blood parcel."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The QRS complex primarily represents…",
      "options": [
        "Electrons traveling from the heart to the recording screen",
        "Ventricular electrical depolarization",
        "A direct graph of arterial blood pressure"
      ],
      "correct": 1,
      "feedback": [
        "Electrodes sense voltage differences; the trace is a signal representation.",
        "Correct: it records an electrical activation pattern associated with ventricular depolarization.",
        "Pressure is a mechanical quantity measured differently."
      ],
      "hint": "Trace the connected paths, identify what is held fixed, and keep charge and energy accounts separate.",
      "teacher": "Ask the student to justify the prediction with conservation and then change one condition. it records an electrical activation pattern associated with ventricular depolarization."
    },
    "references": [
      {
        "title": "NHLBI: the heart’s electrical activity",
        "url": "https://www.nhlbi.nih.gov/health/heart/heart-beats"
      },
      {
        "title": "NCBI Bookshelf: increased conduction velocity with myelination",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK10921/"
      }
    ]
  }
}
