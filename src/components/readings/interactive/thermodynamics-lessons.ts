import type { LessonContent } from './lesson-contract'
export const thermodynamicsLessons = {
  "absolute": {
    "title": "Absolute zero",
    "heading": "Use an absolute scale without extending a model beyond its range.",
    "subtitle": "Absolute zero",
    "target": "Use an absolute scale without extending a model beyond its range.",
    "visual": "temperature-lab",
    "paragraphs": [
      "The kelvin scale starts at absolute zero, equivalent to −273.15°C. Absolute temperature is required in ideal-gas and heat-engine relationships because their ratios depend on a physically meaningful zero. An increase from 300 K to 600 K doubles absolute temperature; an increase from 30°C to 60°C does not.",
      "For a fixed amount of ideal gas at constant volume, pressure is proportional to temperature. Extrapolating that model toward zero pressure historically suggested an absolute zero. Real gases condense and eventually require different models before the extrapolation reaches its endpoint. A useful straight line is not proof that a real sample remains an ideal gas throughout the extension.",
      "In classical kinetic theory, mean translational kinetic energy decreases with absolute temperature. Quantum physics adds a crucial qualification: the lowest-energy state can retain zero-point motion. Absolute zero is therefore not accurately described as every particle becoming perfectly motionless with no remaining energy of any kind.",
      "The third law describes the limiting behavior of entropy as temperature approaches zero for an ideal perfect crystal with a unique ground state. Absolute zero cannot be reached by a finite sequence of ordinary cooling operations. Use the scale explorer to compare familiar temperatures while keeping this limit conceptually separate from the simplified particle picture used for warm dilute gases."
    ],
    "terms": [
      [
        "absolute zero",
        "The zero of thermodynamic temperature, equal to −273.15°C."
      ],
      [
        "zero-point energy",
        "Energy that can remain in a quantum system’s lowest-energy state."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An ideal gas warms from 0°C until its mean translational kinetic energy doubles. What is its final Celsius temperature?",
      "reasoning": "Start at 273.15 K, double to 546.30 K, then convert back to 273.15°C. Doubling the Celsius number would be incorrect."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does absolute zero require every quantum particle to have exactly zero energy and motion?",
      "options": [
        "Yes",
        "No, a ground state can retain zero-point energy",
        "Only for every solid"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "The classical picture has limits near the quantum ground state.",
        "Correct: distinguish thermal excitation from ground-state energy.",
        "Solids also require quantum treatment at sufficiently low temperatures."
      ],
      "teacher": "Start at 273.15 K, double to 546.30 K, then convert back to 273.15°C. Doubling the Celsius number would be incorrect. Require a consistent system boundary and a statement of the model’s limits."
    },
    "references": [
      {
        "title": "NIST: the kelvin and absolute zero",
        "url": "https://www.nist.gov/si-redefinition/kelvin-introduction"
      }
    ]
  },
  "first": {
    "title": "First law of thermodynamics",
    "heading": "Close the energy account with a consistent sign convention.",
    "subtitle": "First law of thermodynamics",
    "target": "Close the energy account with a consistent sign convention.",
    "visual": "energy-ledger",
    "paragraphs": [
      "Thermodynamics follows energy transfers and changes of state without tracking every particle. For a closed system with negligible changes in bulk kinetic and potential energy, the first law is ΔU = Q − W. Here Q is heat entering the system and W is work done by the system on its surroundings.",
      "Expansion against an external pressure gives positive work by the gas, so that energy leaves the gas's account. Compression gives negative W because the surroundings do work on the gas. A different convention can use work done on the system with a plus sign, but mixing conventions in the same calculation produces an incorrect result.",
      "Internal energy is a state function. Two paths between the same initial and final equilibrium states have the same ΔU even if their heat and work differ. For a complete cycle, ΔU = 0, so net heat entering equals net work leaving. This conservation rule does not by itself determine whether a proposed process is physically possible; the second law adds a direction constraint.",
      "Move the heat and work controls separately in the ledger. Include negative values and explain each arrow in words. For an ideal monatomic gas, U = 3nRT/2 supplies an additional link to temperature, but that expression is not valid for every substance. The first law remains the broader accounting principle even when a more detailed internal-energy model is required."
    ],
    "terms": [
      [
        "first law of thermodynamics",
        "Conservation of energy expressed through changes in internal energy and energy transfers as heat and work."
      ],
      [
        "state function",
        "A property whose change depends on the initial and final states rather than the process path."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A gas loses 30 J of heat while surroundings do 80 J of work on it.",
      "reasoning": "Q = −30 J and W = −80 J, so ΔU = −30 − (−80) = +50 J."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A gas expands and does work with Q = 0. Its internal energy…",
      "options": [
        "Increases",
        "Decreases",
        "Must stay constant"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "Energy leaves through the work path.",
        "Correct: ΔU = −W for this adiabatic expansion.",
        "No heat transfer does not mean no energy transfer."
      ],
      "teacher": "Q = −30 J and W = −80 J, so ΔU = −30 − (−80) = +50 J. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "adiabatic": {
    "title": "Adiabatic processes",
    "heading": "Explain temperature changes that occur without heat transfer.",
    "subtitle": "Adiabatic processes",
    "target": "Explain temperature changes that occur without heat transfer.",
    "visual": "gas-process",
    "paragraphs": [
      "An adiabatic process has negligible heat transfer across the system boundary: Q ≈ 0. This can occur with good insulation or during a change rapid enough that relatively little heat crosses. Adiabatic does not mean constant temperature. The system can still exchange energy as work.",
      "Compressing an ideal gas adiabatically requires work by the surroundings. With W defined as work done by the gas, W is negative and ΔU = −W is positive. The gas warms. During adiabatic expansion, the gas does positive work and its internal energy and temperature decrease.",
      "For a reversible adiabatic change of an ideal gas with constant heat capacities, PV^γ is constant and TV^(γ−1) is constant, where γ = Cp/Cv. Reversibility and the ideal-gas assumptions matter: these equations cannot be applied to every rapid expansion, especially free expansion into a vacuum. An ideal gas in insulated free expansion can have no work and no temperature change.",
      "A rising parcel of dry air often expands as ambient pressure falls and can cool approximately adiabatically. Descending air is compressed and can warm. Condensation in moist air changes the energy accounting and temperature trend. In the model, compare a reversible adiabatic path with an isothermal path to see why equal volume changes do not require equal heat transfers or final temperatures."
    ],
    "terms": [
      [
        "adiabatic",
        "Describing a process with negligible heat transfer."
      ],
      [
        "heat-capacity ratio",
        "The ratio γ = Cp/Cv used in a reversible ideal-gas adiabatic relation."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A gas is compressed adiabatically and receives 100 J of work. What is ΔU?",
      "reasoning": "Q = 0 and W = −100 J, so ΔU = +100 J. For the ideal gas in this example its temperature rises."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which condition defines an adiabatic process?",
      "options": [
        "Constant temperature",
        "Negligible heat transfer",
        "No work"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "Constant temperature defines an isothermal process.",
        "Correct: energy may still cross as work.",
        "Work can change internal energy without heat transfer."
      ],
      "teacher": "Q = 0 and W = −100 J, so ΔU = +100 J. For the ideal gas in this example its temperature rises. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "second": {
    "title": "Second and third laws",
    "heading": "Check the direction of a process as well as its energy balance.",
    "subtitle": "Second and third laws",
    "target": "Check the direction of a process as well as its energy balance.",
    "visual": "entropy-transfer",
    "paragraphs": [
      "Conservation alone permits many imagined processes that do not occur spontaneously. Two bodies in thermal contact exchange net heat from the hotter body to the colder one. Reversing that exchange without any other effect would conserve energy but violate the second law. A refrigerator accomplishes cold-to-hot transfer only by consuming work and changing the surroundings.",
      "Entropy gives a quantitative direction test. For an isolated combined system, total entropy cannot decrease: it stays constant for an ideal reversible process and increases for an irreversible one. The entropy of a selected part can decrease if it exports enough entropy to its surroundings. Always specify what has been included before saying entropy increases.",
      "For a small heat transfer Q between two reservoirs held at Th and Tc, with Th > Tc, the total change is Q/Tc − Q/Th > 0. Use absolute temperatures. The colder reservoir gains more entropy per joule than the hotter one loses. This calculation assumes temperatures remain essentially fixed during the transfer.",
      "The third law describes an ideal perfect crystal's entropy approaching zero as absolute temperature approaches zero, under the unique-ground-state assumption. It also motivates the unattainability of absolute zero through finite cooling operations. These laws constrain models; they do not imply that every open subsystem becomes less organized at every moment."
    ],
    "terms": [
      [
        "second law",
        "The total entropy of an isolated system cannot decrease."
      ],
      [
        "reversible process",
        "An ideal limiting process that can be reversed without a net change in system and surroundings."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Transfer 60 J from a 600 K reservoir to a 300 K reservoir. Find total ΔS.",
      "reasoning": "ΔS = 60/300 − 60/600 = 0.10 J/K. The hot reservoir loses entropy, but the total increases."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Can a refrigerator’s cold compartment lose entropy?",
      "options": [
        "No, no subsystem can lose entropy",
        "Yes, if the surroundings gain at least as much",
        "Yes, without any energy input or other effect"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "The law constrains the combined isolated total, not each part separately.",
        "Correct: include the compressor work and heat rejected to the room.",
        "An uncompensated cold-to-hot transfer is excluded by the second law."
      ],
      "teacher": "ΔS = 60/300 − 60/600 = 0.10 J/K. The hot reservoir loses entropy, but the total increases. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "engine": {
    "title": "Heat engines",
    "heading": "Account for useful work and rejected energy over a cycle.",
    "subtitle": "Heat engines",
    "target": "Account for useful work and rejected energy over a cycle.",
    "visual": "engine-lab",
    "paragraphs": [
      "A cyclic heat engine takes energy Qh from a hot reservoir, delivers work W, and rejects energy Qc to a colder reservoir. Here Qh and Qc denote positive magnitudes. Returning to the starting state makes ΔU zero, so the first law gives W = Qh − Qc. The energy is conserved even though only part becomes useful work.",
      "Thermal efficiency is η = W/Qh = 1 − Qc/Qh. Rejected energy has not disappeared; it enters the surroundings and has less ability to produce additional work when available temperature differences are small. A cyclic engine cannot turn heat drawn from a single reservoir completely into work with no other effect.",
      "The second law gives a stronger bound for engines between fixed reservoir temperatures: η ≤ 1 − Tc/Th. Equality belongs to an ideal reversible Carnot engine. Both temperatures must be in kelvins. Real friction, finite temperature differences, and other irreversible processes reduce efficiency below that ideal limit.",
      "Use the diagram to trace all three energy paths and compare the chosen efficiency with the bound. Larger output for the same heat input requires a smaller rejected portion, but the bound cannot be crossed. A warmer cold reservoir reduces the best possible efficiency even if the hot reservoir is unchanged. Engine power additionally depends on how quickly cycles and energy transfers occur."
    ],
    "terms": [
      [
        "heat engine",
        "A cyclic device that converts part of heat input into work while rejecting energy to a cooler reservoir."
      ],
      [
        "thermal efficiency",
        "The ratio of net work output to heat input for an engine."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An engine receives 1000 J and rejects 650 J per cycle.",
      "reasoning": "W = 350 J and η = 350/1000 = 35%. Check the reservoir temperatures separately to determine whether that efficiency is allowed."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why is rejected energy included in the engine diagram?",
      "options": [
        "It is destroyed",
        "It completes the conserved energy account",
        "It is always zero for an efficient engine"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "Rejected energy remains in the surroundings.",
        "Correct: Qh = W + Qc for a full cycle.",
        "Finite-temperature cyclic engines retain a nonzero rejected-energy requirement."
      ],
      "teacher": "W = 350 J and η = 350/1000 = 35%. Check the reservoir temperatures separately to determine whether that efficiency is allowed. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "dispersal": {
    "title": "Energy dispersal and probability",
    "heading": "Distinguish likely macrostates from individual arrangements.",
    "subtitle": "Energy dispersal and probability",
    "target": "Distinguish likely macrostates from individual arrangements.",
    "visual": "multiplicity-lab",
    "paragraphs": [
      "Release a gas from one half of an insulated container into the other half. A typical later observation finds particles spread across the available volume. A return of every particle to the original half is not forbidden by energy conservation, but it is extraordinarily unlikely for a macroscopic number of particles.",
      "A microstate specifies detailed particle information, while a macrostate describes coarse properties such as how many particles occupy each half. Many different microstates can produce the same macrostate. Near-equal populations usually correspond to far more arrangements than the condition in which all particles occupy one side.",
      "For N independently placed particles with equally probable sides, the number of arrangements with k on the left is the binomial coefficient C(N,k). The probability of every particle being on the left is 1/2ᴺ. The model below uses a small number so the counting is visible. A gas contains vastly more particles, making extreme imbalances correspondingly less likely.",
      "The word disorder is a loose analogy, not a complete entropy definition. A messy room, a neat drawing, or a visually complex structure cannot establish thermodynamic entropy without a physical model. Use the count of accessible microscopic arrangements and the specified constraints to explain the tendency. Energy can remain conserved while its distribution becomes less useful for producing directed work."
    ],
    "terms": [
      [
        "microstate",
        "A detailed microscopic arrangement consistent with a system’s constraints."
      ],
      [
        "macrostate",
        "A coarse description shared by many possible microscopic arrangements."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "For four independent particles, compare two on each side with all four on the left.",
      "reasoning": "The balanced macrostate has C(4,2) = 6 arrangements out of 16. All left has one arrangement out of 16. The balanced macrostate is six times as probable."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why is a balanced population more likely than all particles on one side?",
      "options": [
        "It always has less energy",
        "More microstates correspond to that macrostate",
        "Every particle prefers the center"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "The counting example gives equal energy to each arrangement.",
        "Correct: multiplicity explains the probability difference.",
        "No individual preference is required."
      ],
      "teacher": "The balanced macrostate has C(4,2) = 6 arrangements out of 16. All left has one arrangement out of 16. The balanced macrostate is six times as probable. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "entropy": {
    "title": "Entropy",
    "heading": "Connect energy dispersal with a quantitative state variable.",
    "subtitle": "Entropy",
    "target": "Connect energy dispersal with a quantitative state variable.",
    "visual": "entropy-transfer",
    "paragraphs": [
      "Entropy is a state variable that helps describe which macroscopic changes are possible and how much energy remains available for useful work. For a reversible heat transfer at fixed absolute temperature, ΔS = Qrev/T. More generally, one evaluates the integral of reversible heat transfer divided by temperature along a suitable reversible path between the states.",
      "An actual process need not be reversible for its entropy change to be calculated. Because entropy is a state function, a hypothetical reversible path with the same endpoints gives the same change. It is incorrect to insert an arbitrary irreversible heat transfer directly into Q/T without checking the conditions.",
      "The entropy of an isolated system is nondecreasing. A subsystem can lose entropy by transferring it outward, as water does when freezing while its surroundings receive energy. The combined change must still satisfy the second law. For two reservoirs exchanging energy, summing each reservoir's change makes that distinction explicit.",
      "Entropy production also reduces the work that can be obtained relative to a chosen environment. Energy is not destroyed when it becomes less useful. In a system approaching equilibrium, temperature differences and other available gradients disappear. Use the reservoir model to compare the same transfer across small and large temperature differences, then explain why a reversible limit produces no additional total entropy."
    ],
    "terms": [
      [
        "entropy",
        "A thermodynamic state variable related to reversible heat transfer and accessible microscopic arrangements."
      ],
      [
        "entropy production",
        "The nonnegative entropy generated by irreversible processes in the combined account."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A hot reservoir loses 100 J at 500 K and a cold one gains it at 250 K.",
      "reasoning": "The changes are −0.20 J/K and +0.40 J/K, respectively. Total entropy increases by 0.20 J/K while total energy remains constant."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Can energy be conserved while the ability to obtain useful work decreases?",
      "options": [
        "Yes",
        "No, lost usefulness means destroyed energy",
        "Only if entropy decreases in an isolated system"
      ],
      "correct": 0,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "Correct: energy conservation and availability for work are different questions.",
        "Energy remains; its distribution relative to the surroundings changes.",
        "Irreversibility normally increases the combined entropy."
      ],
      "teacher": "The changes are −0.20 J/K and +0.40 J/K, respectively. Total entropy increases by 0.20 J/K while total energy remains constant. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "processes": {
    "title": "Simple thermodynamic processes",
    "heading": "Use a pressure–volume path to identify work.",
    "subtitle": "Simple thermodynamic processes",
    "target": "Use a pressure–volume path to identify work.",
    "visual": "gas-process",
    "paragraphs": [
      "A pressure–volume diagram records a sequence of equilibrium or near-equilibrium states. For a quasistatic change, work done by the gas is the signed area under the path: W = ∫P dV. Expansion gives positive work and compression negative work. The axes and path direction must be identified before interpreting an area.",
      "At constant volume, boundary work is zero, so heat entering changes internal energy. At constant pressure, W = PΔV. An isothermal ideal-gas process has constant temperature and therefore ΔU = 0; heat entering balances work done by the gas. It can still transfer substantial energy despite no temperature change.",
      "A reversible adiabatic ideal-gas path has Q = 0 and PV^γ constant, so expansion reduces internal energy and temperature. It is steeper than the isothermal curve through the same state. Free expansion into a vacuum is a different process: external pressure is zero, so no boundary work is delivered even though volume increases.",
      "A closed loop on the diagram returns the gas to its original state. Net work is the signed area enclosed by the loop, and net heat equals that work because ΔU over the cycle is zero. The explorer compares two carefully defined paths from the same initial state; changing the path changes the energy transfers even when the final volume is the same."
    ],
    "terms": [
      [
        "isothermal",
        "Describing a process at constant temperature."
      ],
      [
        "pressure–volume work",
        "The integral of external pressure against volume change, equal to the area under a quasistatic P–V path."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A quasistatic gas expands at 100 kPa from 2 L to 5 L.",
      "reasoning": "W = 100,000 × 0.003 = 300 J. The liter-to-cubic-meter conversion is essential."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A rigid container is heated without other work modes. Boundary work is…",
      "options": [
        "Positive because temperature rises",
        "Zero because volume does not change",
        "Equal to every heat input"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "A temperature rise does not require a moving boundary.",
        "Correct: ΔV = 0 gives zero pressure–volume work.",
        "The heat can increase internal energy instead."
      ],
      "teacher": "W = 100,000 × 0.003 = 300 J. The liter-to-cubic-meter conversion is essential. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "carnot": {
    "title": "Carnot’s ideal heat engine",
    "heading": "Apply the reversible limit using absolute temperatures.",
    "subtitle": "Carnot’s ideal heat engine",
    "target": "Apply the reversible limit using absolute temperatures.",
    "visual": "engine-lab",
    "paragraphs": [
      "A reversible heat engine operating between two reservoirs has a maximum efficiency determined only by their absolute temperatures. The Carnot result is ηmax = 1 − Tc/Th. It is independent of the particular ideal working substance, provided the cycle and reservoir interactions are reversible.",
      "The ideal Carnot cycle contains two isothermal processes and two reversible adiabatic processes. The working substance receives heat while matching the hot reservoir's temperature, expands adiabatically to a lower temperature, rejects heat while matching the cold reservoir, and is compressed adiabatically back to its starting state. The limiting construction avoids entropy production.",
      "For the reversible cycle, Qc/Qh = Tc/Th. The reservoirs' entropy changes cancel, while the cyclic working substance has zero net entropy change. An irreversible engine must produce additional total entropy and therefore delivers less work for the same heat input between the same reservoir temperatures.",
      "Use the efficiency control to explore fractions of the Carnot limit. Raising the hot temperature or lowering the cold temperature increases the limit, but using Celsius ratios produces a false result. Equal reservoir temperatures give zero maximum efficiency. A reversible cycle also represents an ideal limit rather than a promise of large power: heat exchange across vanishing temperature differences cannot be assumed to happen arbitrarily fast."
    ],
    "terms": [
      [
        "Carnot efficiency",
        "The maximum reversible heat-engine efficiency 1 − Tc/Th between two fixed-temperature reservoirs."
      ],
      [
        "reservoir",
        "An idealized body large enough to exchange energy without appreciably changing temperature."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Find the maximum efficiency between 600 K and 300 K.",
      "reasoning": "ηmax = 1 − 300/600 = 0.50, or 50%. A real engine between these reservoirs must have a smaller efficiency."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Could an engine between 600 K and 300 K have 80% thermal efficiency?",
      "options": [
        "Yes, if friction is small enough",
        "No, it exceeds the Carnot limit",
        "Yes, if the Celsius values are used"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "Reducing friction approaches the limit; it cannot exceed it.",
        "Correct: the reversible upper bound is 50%.",
        "Celsius ratios are invalid in this equation."
      ],
      "teacher": "ηmax = 1 − 300/600 = 0.50, or 50%. A real engine between these reservoirs must have a smaller efficiency. Require a consistent system boundary and a statement of the model’s limits."
    }
  },
  "pump": {
    "title": "Heat pumps and refrigerators",
    "heading": "Explain why useful heat moved can exceed work supplied.",
    "subtitle": "Heat pumps and refrigerators",
    "target": "Explain why useful heat moved can exceed work supplied.",
    "visual": "heat-pump",
    "paragraphs": [
      "A refrigerator uses work to move energy from a cooler region to a warmer one. Its cold side absorbs Qc, its compressor receives work W, and its hot side releases Qh. Over a cycle, conservation gives Qh = Qc + W. The warm coils must reject both the removed energy and the work input.",
      "Performance is measured by a coefficient of performance rather than engine efficiency. A refrigerator's useful result is energy removed from the cold region, so COPr = Qc/W. A heat pump used for heating values the warm-side delivery, giving COPh = Qh/W = COPr + 1. Either can exceed one because the device moves energy as well as converting work into internal energy.",
      "For reversible operation between fixed temperatures, COPr = Tc/(Th − Tc) and COPh = Th/(Th − Tc), with kelvins. Real devices have smaller values because of irreversible effects. A smaller temperature lift permits a larger ideal COP, but actual power, exchanger size, and operating conditions also limit performance.",
      "Trace the arrows in the model and state which side is useful for the chosen application. Leaving a refrigerator door open in a closed room cannot cool the room overall: both coils interact with that room, and the net effect includes the positive electrical work input. Cooling a room requires sending the rejected energy elsewhere."
    ],
    "terms": [
      [
        "coefficient of performance",
        "Useful heat moved divided by work input for a refrigerator or heat pump."
      ],
      [
        "temperature lift",
        "The difference between the warm-side and cold-side temperatures."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A refrigerator uses 100 J of work to remove 300 J from its cold compartment.",
      "reasoning": "It releases 400 J to the room. COPr = 3 and COPh = 4; energy conservation is satisfied because 300 + 100 = 400."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why can a heat pump have COP greater than one?",
      "options": [
        "It creates energy",
        "It moves existing energy as well as receiving work",
        "Its hot side rejects no energy"
      ],
      "correct": 1,
      "hint": "Define the system, choose a sign convention, and check both conservation and the direction of the process.",
      "feedback": [
        "The energy balance remains Qh = Qc + W.",
        "Correct: useful heat delivered includes energy taken from the source.",
        "The hot-side transfer is the useful heating output."
      ],
      "teacher": "It releases 400 J to the room. COPr = 3 and COPh = 4; energy conservation is satisfied because 300 + 100 = 400. Require a consistent system boundary and a statement of the model’s limits."
    }
  }
} satisfies Record<string, LessonContent>
