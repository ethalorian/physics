import type { LessonContent } from './lesson-contract'
export const thermalLessons = {
  "temperature": {
    "title": "Temperature",
    "heading": "Separate temperature from the amount of matter.",
    "subtitle": "Temperature",
    "target": "Separate temperature from the amount of matter.",
    "visual": "temperature-lab",
    "paragraphs": [
      "A bathtub and a teacup can have the same temperature even though they contain very different amounts of water. Temperature describes a thermal state, not a count of particles or a total energy inventory. When we compare ordinary gases, a higher absolute temperature corresponds to a greater average translational kinetic energy per molecule. Individual molecules still have a range of speeds.",
      "A thermometer uses a reproducible property that changes with temperature, such as liquid volume, electrical resistance, or a radiation spectrum. Its scale needs calibration. Celsius assigns familiar values near water's freezing and boiling points at standard pressure; those phase-change temperatures depend on pressure and composition. A reading is a measurement with limitations, not a sensation of how hot an object feels.",
      "Convert scales with T(K) = T(°C) + 273.15 and T(°F) = 1.8T(°C) + 32. A change of one kelvin has the same size as a change of one Celsius degree. Ratios of absolute temperatures require kelvins: 40°C is not twice the absolute temperature of 20°C.",
      "Use the scale explorer to compare a temperature and a temperature change. Before claiming that one sample has more internal energy, also identify its mass, material, phase, and reference state. Temperature alone is insufficient."
    ],
    "terms": [
      [
        "temperature",
        "A measure of a system’s thermal state that determines the direction of spontaneous heat transfer."
      ],
      [
        "kelvin",
        "The SI unit of thermodynamic temperature, measured from absolute zero."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Convert 25°C to kelvins; compare a 10°C rise with a 10 K rise.",
      "reasoning": "25°C is 298.15 K. Both rises have the same size, although the numerical temperatures use different zero points."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which comparison means twice the absolute temperature?",
      "options": [
        "20°C and 40°C",
        "150 K and 300 K",
        "20°F and 40°F"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "Celsius has an offset zero; its numerical ratio is not an absolute-temperature ratio.",
        "Correct: kelvins share the absolute zero required for this comparison.",
        "Fahrenheit also has an offset zero."
      ],
      "teacher": "25°C is 298.15 K. Both rises have the same size, although the numerical temperatures use different zero points. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "heat": {
    "title": "Heat",
    "heading": "Treat heat as energy crossing a boundary.",
    "subtitle": "Heat",
    "target": "Treat heat as energy crossing a boundary.",
    "visual": "thermal-contact",
    "paragraphs": [
      "Place a warm spoon in cooler water. Energy transfers from the spoon to the water because their temperatures differ. We call that transfer heat. Once energy is inside the water, it belongs to the water's internal-energy account; it is not a separate fluid called heat stored between the molecules. Choosing a system boundary makes this language precise.",
      "The direction of spontaneous net heat transfer is from higher temperature toward lower temperature. A large cooler reservoir can have more total internal energy than a small hot object, yet energy still transfers from the hot object to the cooler reservoir. Temperature difference, rather than total energy, determines this direction.",
      "Both heat and work transfer energy and are measured in joules. Rubbing, stirring, or compressing can raise internal energy by work without requiring energy transfer caused by a temperature difference. The change in temperature is an outcome; it does not by itself identify which transfer occurred.",
      "In the contact model, change the starting temperatures and predict the arrow before checking it. At equal temperatures the net heat transfer vanishes, although microscopic exchanges continue. A refrigerator can move energy from cold to hot only with an additional input and an accompanying effect on its surroundings; it does not contradict this spontaneous direction."
    ],
    "terms": [
      [
        "heat",
        "Energy transferred because of a temperature difference."
      ],
      [
        "system boundary",
        "The chosen division between a system and its surroundings."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A hot nail enters a large cooler bath. Which way does net heat flow?",
      "reasoning": "From the hotter nail into the cooler bath, regardless of which has more total internal energy. The nail loses internal energy while the bath gains it if work and other transfers are negligible."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A large cool object touches a small hot object. What controls the initial heat-flow direction?",
      "options": [
        "Their total energy",
        "Their temperature difference",
        "Their masses alone"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "Total energy does not determine the spontaneous direction.",
        "Correct: net heat transfer starts from higher to lower temperature.",
        "Mass affects the temperature change, not the spontaneous direction."
      ],
      "teacher": "From the hotter nail into the cooler bath, regardless of which has more total internal energy. The nail loses internal energy while the bath gains it if work and other transfers are negligible. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "equilibrium": {
    "title": "Thermal equilibrium",
    "heading": "Use a common temperature to interpret a measurement.",
    "subtitle": "Thermal equilibrium",
    "target": "Use a common temperature to interpret a measurement.",
    "visual": "thermal-contact",
    "paragraphs": [
      "A thermometer initially reads the temperature of its own sensing element. When placed in a sample, it exchanges energy with that sample. Wait long enough under steady conditions and the two approach thermal equilibrium: the same temperature and no net heat transfer caused by a temperature difference. Reading too soon can report the instrument's earlier state.",
      "The zeroth law connects comparisons. If system A is in thermal equilibrium with system C, and system B is also in thermal equilibrium with C, then A and B are in thermal equilibrium with one another. This makes a thermometer a useful transferable reference, rather than requiring direct contact between every pair of objects.",
      "For two insulated samples that undergo no phase change, the warmer sample's energy loss equals the cooler sample's gain. The final temperature is a heat-capacity-weighted average of their initial temperatures. Equal masses do not guarantee a simple arithmetic average unless their specific heat capacities are equal as well.",
      "The measuring instrument can disturb a small sample. A large cold probe may cool a tiny warm droplet appreciably; energy transferred to the probe must be included. Our model treats the two bodies as uniform in temperature and ignores external losses. Real measurements also require good contact, enough settling time, and appropriate calibration."
    ],
    "terms": [
      [
        "thermal equilibrium",
        "A condition of equal temperature with no net heat transfer between bodies."
      ],
      [
        "zeroth law",
        "Bodies separately in thermal equilibrium with a third body are in thermal equilibrium with each other."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Equal heat capacities start at 80°C and 20°C inside an insulated enclosure. Find the final temperature.",
      "reasoning": "The common temperature is 50°C. One body loses the same energy that the other gains because the heat capacities match."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A thermometer is still warming in a stable bath. Has it measured the bath’s equilibrium temperature?",
      "options": [
        "Yes, immediately",
        "No, it has not yet equilibrated",
        "Only if it is heavier than the bath"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "An unsettled sensor still reports its own changing temperature.",
        "Correct: wait for equilibrium and account for disturbance of the sample.",
        "A heavy sensor can disturb the bath more; it does not guarantee a correct reading."
      ],
      "teacher": "The common temperature is 50°C. One body loses the same energy that the other gains because the heat capacities match. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "internal": {
    "title": "Internal energy",
    "heading": "Account for microscopic motion and interactions.",
    "subtitle": "Internal energy",
    "target": "Account for microscopic motion and interactions.",
    "visual": "energy-ledger",
    "paragraphs": [
      "Internal energy is the energy associated with the microscopic state of a system. It includes molecular motion and interactions between particles. The kinetic energy of the entire object moving across the room is a separate macroscopic account. Choosing the system lets us distinguish a speeding cart from the agitation of particles within its wheels.",
      "Temperature and internal energy are related, but they are not interchangeable. For a fixed amount of a simple ideal gas, internal energy depends on temperature. For real matter, the material, phase, and microscopic interactions also matter. A melting solid can gain internal energy while its temperature remains nearly constant at a specified pressure.",
      "Energy can cross the boundary as heat or work. With the convention that Q is heat entering and W is work done by the system, the change is ΔU = Q − W. A positive W means energy has left through mechanical work. Compression has negative W, so it can increase internal energy even when Q is zero.",
      "Follow the arrows in the energy ledger and compare two processes that produce the same ΔU. The final internal-energy change can match even when the separate amounts of heat and work do not. Heat and work describe a process, whereas internal energy describes a state relative to a chosen reference."
    ],
    "terms": [
      [
        "internal energy",
        "Microscopic kinetic and interaction energy within a system."
      ],
      [
        "work",
        "Energy transferred by forces acting through displacement or another generalized mechanical interaction."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A gas receives 120 J of heat and does 40 J of work. Find ΔU.",
      "reasoning": "ΔU = 120 − 40 = 80 J. The gas retains 80 J more internal energy; the other 40 J left as work."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Can internal energy increase while temperature stays constant?",
      "options": [
        "Yes, during an appropriate phase change",
        "No, they are the same quantity",
        "Only if energy is created"
      ],
      "correct": 0,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "Correct: changing intermolecular arrangement can absorb energy without a temperature rise.",
        "They measure different properties; phase changes reveal the distinction.",
        "Energy is transferred, not created."
      ],
      "teacher": "ΔU = 120 − 40 = 80 J. The gas retains 80 J more internal energy; the other 40 J left as work. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "measure": {
    "title": "Measurement of heat",
    "heading": "Infer energy transfer from a calibrated change.",
    "subtitle": "Measurement of heat",
    "target": "Infer energy transfer from a calibrated change.",
    "visual": "heat-capacity",
    "paragraphs": [
      "A temperature rise can help measure an energy transfer, but the rise alone is not enough. Heating a kilogram of water by one degree requires much more energy than heating a gram of the same water by one degree. The material matters too: water and copper respond differently to an equal energy input.",
      "For a sample with no phase change and approximately constant specific heat capacity c, Q = mcΔT when heating is the only important energy transfer. Here m is mass, ΔT is final minus initial temperature, and c has units J/(kg·K). A cooling sample has negative Q with the convention that heat entering the sample is positive.",
      "The joule is the SI unit for heat and work. A thermochemical calorie is 4.184 J; a food Calorie is a kilocalorie, or 4184 J. Those unit conversions change the numerical count without changing the energy. Do not confuse a temperature unit such as the kelvin with an energy unit such as the joule.",
      "Calorimetry measures energy exchanges within an approximately insulated arrangement. Include the container and any other relevant bodies in the balance. If stirring, evaporation, or energy loss to the room is important, a simple temperature-only calculation needs additional terms. The model below isolates sensible heating so that mass, material, and temperature change can be compared fairly."
    ],
    "terms": [
      [
        "calorimetry",
        "Measurement of energy exchange using known thermal responses and an energy balance."
      ],
      [
        "calorie",
        "An energy unit equal to 4.184 J in the thermochemical convention."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Heat 0.50 kg of water by 2 K using c = 4184 J/(kg·K).",
      "reasoning": "Q = 0.50 × 4184 × 2 = 4184 J, equal to 1 food Calorie. Assume no phase change and negligible other transfers."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which information is needed to infer Q from a temperature rise?",
      "options": [
        "Only the final temperature",
        "Mass, specific heat, and temperature change",
        "Only the thermometer scale"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "A final temperature does not specify the change or the amount of matter.",
        "Correct under the stated no-phase-change, negligible-work assumptions.",
        "The scale must be interpreted, but it cannot replace mass and material."
      ],
      "teacher": "Q = 0.50 × 4184 × 2 = 4184 J, equal to 1 food Calorie. Assume no phase change and negligible other transfers. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "capacity": {
    "title": "Specific heat capacity",
    "heading": "Predict how mass and material change a temperature response.",
    "subtitle": "Specific heat capacity",
    "target": "Predict how mass and material change a temperature response.",
    "visual": "heat-capacity",
    "paragraphs": [
      "Give equal amounts of energy to equal masses of two materials. Their temperatures need not rise equally. Specific heat capacity tells us how much energy per kilogram is required for a one-kelvin rise under specified conditions. A high value means a smaller temperature change for the same energy input per kilogram.",
      "Heat capacity C belongs to a particular sample and equals mc when c is approximately constant. Doubling the mass doubles C without changing the material's specific heat. Rearranging Q = mcΔT gives ΔT = Q/(mc), which makes the comparison visible: more mass or a larger c reduces the temperature response.",
      "Microscopic energy can occupy different kinds of motion and interactions. Materials therefore distribute added energy differently. Specific heat also varies with temperature and with constraints such as constant pressure or constant volume. A single tabulated value is an approximation over a stated range, not a universal number for every state of a substance.",
      "Use the model to change one factor at a time. Keep mass fixed while changing c; then keep the material fixed while changing mass. Feeling a surface is a different experiment because the rate of heat transfer to skin matters too. Heat capacity alone cannot establish whether a hot surface is safe to touch."
    ],
    "terms": [
      [
        "specific heat capacity",
        "Energy per unit mass per temperature rise for a specified process, absent a phase change."
      ],
      [
        "heat capacity",
        "The energy required per temperature rise of a particular sample."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Two equal masses receive 600 J each. Material B has twice material A’s specific heat. Compare their temperature rises.",
      "reasoning": "B rises by half as much because ΔT is inversely proportional to c at equal Q and m."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Double the mass while keeping material and energy input fixed. What happens to ΔT?",
      "options": [
        "It doubles",
        "It halves",
        "It stays the same"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "More matter shares the same input; the rise becomes smaller.",
        "Correct: ΔT = Q/(mc).",
        "The material property stays fixed, but the sample heat capacity doubles."
      ],
      "teacher": "B rises by half as much because ΔT is inversely proportional to c at equal Q and m. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "waterCapacity": {
    "title": "Water and thermal storage",
    "heading": "Connect a large heat capacity to a slower thermal response.",
    "subtitle": "Water and thermal storage",
    "target": "Connect a large heat capacity to a slower thermal response.",
    "visual": "heat-capacity",
    "paragraphs": [
      "A coast can experience a smaller daily temperature swing than nearby inland ground. Water's large specific heat is part of the explanation: a given absorbed energy per kilogram changes its temperature less than it changes the temperature of many rocks or soils. A large body of water can store and later release substantial energy while changing temperature relatively little.",
      "The comparison needs a defined amount of matter and an energy input. Sunlight may penetrate water, mixing can spread energy through a large volume, and evaporation can carry energy away. Land and water also differ in reflectivity and circulation. Specific heat is an important mechanism, but it is not a complete climate model by itself.",
      "Water's molecular interactions provide ways to distribute added energy. Its heat capacity is a material property under specified conditions; the ocean's enormous total heat capacity additionally reflects its enormous mass. Neither statement means the water contains stored heat as a substance. Internal energy is stored, and heat names a mode of transfer.",
      "Compare equal masses in the model, then imagine expanding the participating water mass through mixing. Explain why both a material property and the depth of the mixed layer influence the warming rate. A reservoir can delay a temperature response without removing the need for an energy balance over longer intervals."
    ],
    "terms": [
      [
        "thermal storage",
        "Retention of energy in a material’s internal-energy account."
      ],
      [
        "thermal inertia",
        "Resistance to rapid temperature change arising from heat capacity and transfer conditions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Two 1 kg samples absorb 4184 J. One is water with c = 4184 and one has c = 1000 J/(kg·K).",
      "reasoning": "Water warms by 1 K; the other sample warms by 4.184 K. Equal absorbed energy does not mean equal temperature rise."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why can a large lake moderate nearby temperature swings?",
      "options": [
        "It destroys absorbed energy",
        "It stores substantial energy with a relatively small temperature change",
        "Its temperature can never change"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "Energy remains in the total account.",
        "Correct; circulation and evaporation also influence real conditions.",
        "A large heat capacity reduces the response; it does not eliminate it."
      ],
      "teacher": "Water warms by 1 K; the other sample warms by 4.184 K. Equal absorbed energy does not mean equal temperature rise. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "expansion": {
    "title": "Thermal expansion",
    "heading": "Predict a dimensional change without changing the amount of matter.",
    "subtitle": "Thermal expansion",
    "target": "Predict a dimensional change without changing the amount of matter.",
    "visual": "expansion-lab",
    "paragraphs": [
      "Most materials expand when heated over ordinary temperature ranges at roughly constant pressure. Their particles do not simply grow larger. Instead, the average spacing changes as the microscopic motion and interactions change. Real materials can behave differently, so an expansion coefficient is always tied to a material and a range of conditions.",
      "For a small change in a uniform rod, ΔL = αL₀ΔT. The original length L₀ sets how much material contributes; α is the linear expansion coefficient. A long bridge therefore needs room to change length even when the fractional change is small. If expansion is prevented, stress can develop instead of the free change in length.",
      "An isotropic plate expands in both directions. A hole expands as though the removed material were still present; its boundary moves outward with the surrounding plate. For small changes, area and volume coefficients are approximately 2α and 3α. Liquids are described using a volume coefficient β rather than a permanent rod length.",
      "Joining two materials with different coefficients makes a bimetallic strip bend. The side that lengthens more lies on the outside of the curve when heated. The straight-rod model below magnifies the displacement and reports its actual size numerically. Use the numerical result, not the exaggerated drawing, when deciding how much clearance is needed."
    ],
    "terms": [
      [
        "thermal expansion",
        "A change in dimensions caused by a temperature change under specified constraints."
      ],
      [
        "linear expansion coefficient",
        "Fractional length change per unit temperature change in the small-change approximation."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A 10 m rod has α = 12 × 10⁻⁶/K and warms by 50 K.",
      "reasoning": "ΔL = 12 × 10⁻⁶ × 10 × 50 = 0.006 m, or 6 mm. The unconstrained rod becomes 10.006 m long."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A metal ring is heated uniformly and can expand freely. Its hole usually…",
      "options": [
        "Shrinks",
        "Expands",
        "Fills with newly created metal"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "The boundary moves outward with the expanding material.",
        "Correct: treat the hole as a missing piece of the same expanding plate.",
        "No additional matter is created."
      ],
      "teacher": "ΔL = 12 × 10⁻⁶ × 10 × 50 = 0.006 m, or 6 mm. The unconstrained rod becomes 10.006 m long. Ask the student to identify the system and justify the relevant assumption."
    }
  },
  "waterExpansion": {
    "title": "Expansion of water",
    "heading": "Explain why freezing can reduce density.",
    "subtitle": "Expansion of water",
    "target": "Explain why freezing can reduce density.",
    "visual": "water-density",
    "paragraphs": [
      "Liquid water behaves unusually near its freezing point at ordinary atmospheric pressure. Heating it from about 0°C to about 4°C decreases its volume for a fixed mass. Above roughly 4°C, the usual trend returns and warming increases its volume. Density, mass divided by volume, is therefore greatest near 4°C for fresh water at this pressure.",
      "The explanation involves the changing arrangement of water molecules and their hydrogen bonds. Ice has an open crystal structure that occupies more volume than the same mass of liquid water. Melting permits a denser arrangement. This does not mean the molecules become smaller or that the amount of matter disappears.",
      "A fresh-water lake cooling from above 4°C can mix as cooler, denser surface water sinks. Once surface water cools below the density maximum, it becomes less dense than the water beneath. Ice forms at the surface and floats; the ice layer then limits further energy transfer. Wind, depth, salts, and changing conditions complicate an actual lake.",
      "Use the density curve to distinguish cooling liquid water from crossing the freezing transition. Our curve is an approximation for liquid fresh water, not a prediction for seawater or high pressure. The floating-ice illustration shows a different phase with a different density. Always identify the phase before applying an expansion coefficient or comparing volumes."
    ],
    "terms": [
      [
        "density maximum",
        "A temperature at which a material’s density is greatest under the stated conditions."
      ],
      [
        "hydrogen bond",
        "An intermolecular interaction that helps organize water molecules into characteristic structures."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Does cooling fresh liquid water from 4°C to 1°C make it denser at atmospheric pressure?",
      "reasoning": "No. Its density decreases below the approximate 4°C maximum, so it can remain above denser water."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why does ordinary ice float on liquid water?",
      "options": [
        "Its molecules lose all mass",
        "Its open structure gives lower bulk density",
        "Its temperature creates an upward force unrelated to water"
      ],
      "correct": 1,
      "hint": "Name the system, identify what stays fixed, and use the relationship developed in this section.",
      "feedback": [
        "Mass is conserved during freezing.",
        "Correct: the same mass occupies more volume, giving lower density and flotation.",
        "Buoyancy comes from fluid pressure and displaced-water weight."
      ],
      "teacher": "No. Its density decreases below the approximate 4°C maximum, so it can remain above denser water. Ask the student to identify the system and justify the relevant assumption."
    }
  }
} satisfies Record<string, LessonContent>
