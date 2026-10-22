import type { LessonContent } from './lesson-contract'
export const phaseLessons = {
  "evaporation": {
    "title": "Evaporation",
    "heading": "Explain cooling by following escaping molecules.",
    "subtitle": "Evaporation",
    "target": "Explain cooling by following escaping molecules.",
    "visual": "evaporation-lab",
    "paragraphs": [
      "A puddle can disappear without ever reaching its boiling temperature. Molecules in liquid water have a range of energies. Some near the surface can escape the attractions of their neighbors and enter the vapor above it. This surface process is evaporation, and it can occur below the boiling point.",
      "Escaping molecules tend to remove more energy than the average molecule left behind. If no compensating energy arrives, the remaining liquid cools. Sunlight, warm air, or a container may replace that energy, so evaporation does not guarantee a measured temperature decrease in every setting. Keep the liquid's energy account separate from the energy carried away by the vapor.",
      "Wind can increase net evaporation by carrying vapor away from the surface. Humid air supplies more returning water molecules and often reduces the net rate. Increasing exposed area provides more places for exchange. These influences depend on conditions; a simple molecular sketch cannot predict an exact drying time.",
      "In the diagram, compare molecules leaving with molecules returning. Net evaporation means more leave than return, while both processes can occur simultaneously. Evaporative cooling requires an energy transfer associated with the phase change; a fan alone does not make a dry object colder than the air in a steady, closed temperature-only model. A wet surface adds a different energy pathway."
    ],
    "terms": [
      [
        "evaporation",
        "Escape of molecules from a liquid surface into vapor."
      ],
      [
        "net evaporation",
        "An excess of molecules leaving the liquid over molecules returning from vapor."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A wet cloth dries in moving air while its temperature falls. Explain both observations.",
      "reasoning": "Water molecules escape; moving air can remove nearby vapor and sustain net evaporation. Energy carried away is not fully replaced, so the cloth and remaining water cool."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Must a liquid boil before evaporation occurs?",
      "options": [
        "Yes",
        "No, molecules can escape from its surface below boiling",
        "Only in a vacuum"
      ],
      "correct": 1,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Boiling is a different bulk process involving vapor bubbles.",
        "Correct: surface evaporation occurs across a range of temperatures.",
        "Evaporation commonly occurs in ordinary air."
      ],
      "teacher": "Water molecules escape; moving air can remove nearby vapor and sustain net evaporation. Energy carried away is not fully replaced, so the cloth and remaining water cool. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "condensation": {
    "title": "Condensation",
    "heading": "Account for the energy released when vapor becomes liquid.",
    "subtitle": "Condensation",
    "target": "Account for the energy released when vapor becomes liquid.",
    "visual": "evaporation-lab",
    "paragraphs": [
      "Water on the outside of a cold glass usually came from water vapor in the surrounding air, not from liquid leaking through the glass. Near the cold surface, vapor can become liquid. This phase change is condensation, the reverse of vaporization. A surface below the local dew point can collect visible droplets.",
      "When vapor condenses, energy is released to the surroundings as molecules settle into a more strongly bound liquid arrangement. The receiving surface can gain energy even while remaining cold because it transfers energy onward to the drink. A constant temperature does not mean zero energy exchange.",
      "For an appropriate latent heat L, the magnitude of energy released by condensing mass m is mL. The sign is negative for heat entering the condensing water and positive for the surroundings receiving it. State the system before assigning a sign. Further cooling of the resulting liquid would release additional sensible heat.",
      "Compare the arrows for evaporation and condensation in the model. The arrows show two-way exchange at the surface; their difference determines whether the liquid gains or loses mass. Steam heating systems use the large energy release from condensation, and clouds can release latent energy as droplets form. Those examples require a full balance rather than a claim that condensation always raises every nearby temperature."
    ],
    "terms": [
      [
        "condensation",
        "Conversion of vapor into liquid."
      ],
      [
        "dew point",
        "The temperature at which a specified amount of water vapor reaches saturation under the stated pressure conditions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why can condensing steam transfer much more energy than the same mass of hot liquid merely cooling a few degrees?",
      "reasoning": "Condensation releases latent energy mL in addition to any later cooling of the liquid. Compare equal masses and specify starting and ending states."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Droplets form outside an intact cold glass because…",
      "options": [
        "Water vapor condenses on the surface",
        "Coldness leaks outward and turns into water",
        "Liquid crosses through ordinary intact glass"
      ],
      "correct": 0,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Correct: water comes from the surrounding vapor.",
        "Coldness is not a material that becomes water.",
        "An intact glass is not the source of these droplets."
      ],
      "teacher": "Condensation releases latent energy mL in addition to any later cooling of the liquid. Compare equal masses and specify starting and ending states. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "rates": {
    "title": "Evaporation and condensation rates",
    "heading": "Recognize equilibrium as balanced exchange.",
    "subtitle": "Evaporation and condensation rates",
    "target": "Recognize equilibrium as balanced exchange.",
    "visual": "evaporation-lab",
    "paragraphs": [
      "Close a container that holds liquid water and initially dry air. Molecules leave the surface, building up water vapor above it. As vapor becomes more abundant, more molecules return to the liquid. Under stable conditions the two rates can become equal, giving dynamic equilibrium rather than complete molecular stillness.",
      "At equilibrium the amount of liquid can stay constant even though individual molecules continue changing phase in both directions. The saturated vapor pressure depends strongly on temperature. Raising the temperature generally increases that pressure because the distribution of molecular energies changes and a larger vapor concentration is needed to balance escape.",
      "An open container need not reach the same equilibrium. Airflow can carry vapor away, or changing temperature can shift the saturation condition. A measured constant liquid level also needs interpretation: an external supply could replenish evaporating liquid. Establish the closed-system assumptions before using an unchanged level as evidence for balanced microscopic rates.",
      "The exchange diagram shows separate outward and inward arrows. Change the relative humidity while holding the liquid temperature fixed and predict whether mass is lost overall. The illustration uses proportional arrows to show a qualitative balance, not a kinetic calculation of molecules per second. At saturation, evaporation continues; it is offset by condensation at the same average rate."
    ],
    "terms": [
      [
        "dynamic equilibrium",
        "A steady macroscopic state maintained by equal opposing microscopic rates."
      ],
      [
        "saturated vapor pressure",
        "The equilibrium pressure of a vapor in contact with its liquid at a specified temperature."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A sealed container keeps the same liquid level at fixed temperature. Are molecules still leaving?",
      "reasoning": "Yes. At equilibrium, evaporation and condensation continue at equal average rates, so there is no net mass change."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At liquid–vapor equilibrium, which statement is correct?",
      "options": [
        "All molecular motion stops",
        "Evaporation and condensation rates match",
        "Only condensation remains"
      ],
      "correct": 1,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "A steady bulk state does not imply stationary molecules.",
        "Correct: opposing exchanges continue while their net effect vanishes.",
        "Both processes continue."
      ],
      "teacher": "Yes. At equilibrium, evaporation and condensation continue at equal average rates, so there is no net mass change. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "boiling": {
    "title": "Boiling",
    "heading": "Connect a stable vapor bubble to surrounding pressure.",
    "subtitle": "Boiling",
    "target": "Connect a stable vapor bubble to surrounding pressure.",
    "visual": "boiling-lab",
    "paragraphs": [
      "Boiling occurs when vapor bubbles can form and grow within a liquid. The vapor pressure associated with the liquid's temperature must match the relevant surrounding pressure, with additional effects from depth and surface tension in small bubbles. This differs from evaporation at a free surface, which can occur below the boiling temperature.",
      "Lowering external pressure lowers the boiling temperature of water over familiar conditions. Water at high altitude can therefore boil below 100°C. Increasing pressure raises the boiling temperature. The familiar 100°C value describes pure water near standard atmospheric pressure, not every liquid in every container.",
      "During steady boiling of a pure liquid at fixed pressure, energy input can convert liquid into vapor without raising the bulk temperature. The phase change carries energy away from the remaining liquid. It is misleading to say boiling must cool an externally heated pot: the measured result depends on the competing energy input and mass loss.",
      "Use the pressure explorer to estimate the change in boiling temperature. It represents water over a limited range and neglects the extra pressure at depth and curvature of tiny bubbles. Predict the direction before using its approximate value. A cooking or engineering situation additionally requires the device's actual conditions and controls; the classroom model is an explanation of phase equilibrium, not operating guidance."
    ],
    "terms": [
      [
        "boiling",
        "Vaporization through growth of vapor bubbles within a liquid."
      ],
      [
        "boiling temperature",
        "The temperature at which the liquid’s vapor pressure matches the relevant surrounding pressure."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why can boiling water at lower atmospheric pressure be cooler than boiling water at sea level?",
      "reasoning": "Less vapor pressure is required for bubbles to persist. Water reaches that saturation pressure at a lower temperature."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Decrease external pressure while holding the liquid composition fixed. Its boiling temperature generally…",
      "options": [
        "Decreases",
        "Increases",
        "Is always 100°C"
      ],
      "correct": 0,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Correct for water over the range explored.",
        "A higher pressure would require a higher boiling temperature.",
        "The 100°C value requires approximately standard pressure."
      ],
      "teacher": "Less vapor pressure is required for bubbles to persist. Water reaches that saturation pressure at a lower temperature. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "freezing": {
    "title": "Freezing",
    "heading": "Follow energy leaving as a liquid forms a solid.",
    "subtitle": "Freezing",
    "target": "Follow energy leaving as a liquid forms a solid.",
    "visual": "heating-curve",
    "paragraphs": [
      "Freezing reorganizes a liquid into a solid. Energy must usually leave the material as particles form a more strongly bound arrangement. For pure water freezing at atmospheric pressure, a mixture of ice and water can remain near 0°C while the amount of ice increases. Temperature stays approximately fixed even though internal energy changes.",
      "The energy released per kilogram is the latent heat of fusion for the reverse melting process. Using Q as energy entering the freezing material, Q = −mLf. The surroundings gain that released energy. Once all the sample is solid, further energy loss can lower the solid's temperature rather than continuing the phase-change plateau.",
      "Dissolved solutes can lower water's freezing point, because the liquid mixture and the nearly pure solid have different equilibrium conditions. The amount depends on concentration and composition. Salt does not create coldness; melting ice in a colder brine requires energy from the surrounding mixture and can lower its temperature.",
      "Read the heating curve in reverse to describe cooling and freezing. Distinguish a pure sample at fixed pressure from mixtures, supercooling, and changing pressure. Real water can remain liquid below its usual freezing temperature before crystals begin to form. A single ideal plateau is a useful model, not a promise that every measured cooling curve will be perfectly flat."
    ],
    "terms": [
      [
        "freezing",
        "Conversion of a liquid into a solid, normally with energy release."
      ],
      [
        "freezing-point depression",
        "Lowering of a solvent’s equilibrium freezing temperature by dissolved solute."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "How much energy leaves when 0.10 kg of water freezes near 0°C, using Lf = 334 kJ/kg?",
      "reasoning": "33.4 kJ leaves the water. The surroundings receive it; Q for the freezing water is −33.4 kJ."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Can pure water release energy while staying near 0°C?",
      "options": [
        "Yes, while freezing at appropriate pressure",
        "No, energy release always lowers temperature",
        "Only if its mass disappears"
      ],
      "correct": 0,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Correct: phase fraction can change at nearly constant temperature.",
        "The freezing plateau separates energy change from temperature change.",
        "Matter is rearranged, not destroyed."
      ],
      "teacher": "33.4 kJ leaves the water. The surroundings receive it; Q for the freezing water is −33.4 kJ. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "vacuum": {
    "title": "Boiling and freezing together",
    "heading": "Explain how rapid vapor loss can cool remaining liquid.",
    "subtitle": "Boiling and freezing together",
    "target": "Explain how rapid vapor loss can cool remaining liquid.",
    "visual": "vacuum-cooling",
    "paragraphs": [
      "Reducing pressure above water can make it boil at a much lower temperature. Vaporization removes energy from the liquid that remains. If an insulated sample loses vapor rapidly and receives little replacement energy, its temperature can fall even while bubbles continue forming. With suitable conditions, some of the remaining water can freeze.",
      "This process is not a claim that an ordinary pot simultaneously stays at 100°C and 0°C. Pressure is changing, the sample is losing mass, and energy is leaving with the escaping vapor. The usual constant-mass sensible-heating equation alone does not describe this open system. The departing material carries both matter and energy across the boundary.",
      "Water's triple point is near 0.01°C and 0.612 kPa, where solid, liquid, and vapor can coexist in equilibrium. Below the triple-point pressure, stable equilibrium liquid water is absent; direct solid–vapor transitions become relevant. The transient pumping experiment need not maintain uniform equilibrium everywhere in the sample.",
      "Use the energy sketch to trace vapor out and compare that energy loss with the energy released by freezing. The displayed estimate isolates latent energies near the transition and omits changing sensible energy and detailed flow. It shows why phase changes can support one another energetically, while the source PDF retains the experimental apparatus and its full context."
    ],
    "terms": [
      [
        "triple point",
        "The pressure and temperature at which three phases coexist in equilibrium."
      ],
      [
        "open system",
        "A system whose boundary permits matter as well as energy to cross."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "How can an insulated sample freeze while losing vapor?",
      "reasoning": "Escaping vapor removes energy. Some remaining liquid can release latent energy by freezing, helping supply the vaporization energy; pressure and mass are changing."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which energy path is essential in this explanation?",
      "options": [
        "Energy carried away by escaping vapor",
        "Creation of negative heat",
        "An unchanged sealed mass at fixed pressure"
      ],
      "correct": 0,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Correct: include the energy transported across the open boundary.",
        "No new form of energy is needed.",
        "The pumping situation is an open system with changing pressure."
      ],
      "teacher": "Escaping vapor removes energy. Some remaining liquid can release latent energy by freezing, helping supply the vaporization energy; pressure and mass are changing. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "regelation": {
    "title": "Regelation",
    "heading": "Connect pressure, melting, and refreezing.",
    "subtitle": "Regelation",
    "target": "Connect pressure, melting, and refreezing.",
    "visual": "regelation-lab",
    "paragraphs": [
      "A loaded thin wire can gradually pass through ice while ice refreezes above it under suitable conditions. This is a classic illustration of regelation: pressure-assisted melting followed by refreezing when pressure is relieved. The sample can remain in one piece even though local material changes phase along the wire's path.",
      "Near ordinary conditions, increasing pressure lowers the melting temperature of ice slightly because liquid water is denser than ice. The pressure favors the smaller-volume phase. Many substances behave oppositely because their solids are denser than their liquids. Water's phase-boundary slope is therefore a material-specific property, not a universal rule for all melting.",
      "The size of the effect matters. A modest pressure change only shifts the melting temperature by a small fraction of a degree. Heat still has to reach the melting region and leave the freezing region. Thermal conduction through the wire and surrounding ice can be important; pressure does not supply unlimited latent energy by itself.",
      "The schematic pressure–melting graph magnifies the small local shift close to 0°C. It is a local approximation, not a description of ice at arbitrary pressure. Pressure melting alone is also insufficient to explain every slippery ice surface; frictional heating and surface properties can matter. Name the mechanism and its limits before applying the analogy to a different situation."
    ],
    "terms": [
      [
        "regelation",
        "Melting under increased pressure followed by refreezing after pressure is relieved."
      ],
      [
        "phase-boundary slope",
        "The relation between changes in equilibrium pressure and transition temperature."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why does the wire illustration work differently for a solid whose liquid is less dense?",
      "reasoning": "Pressure favors the smaller-volume phase. If the solid is denser, pressure tends to favor the solid rather than produce the same melting response as ordinary ice."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does pressure alone remove the need for energy to melt ice?",
      "options": [
        "Yes",
        "No, latent energy must still be supplied",
        "Only for a thick wire"
      ],
      "correct": 1,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "A shifted melting condition does not erase the energy balance.",
        "Correct: heat transfer and local phase changes both matter.",
        "Wire size changes conditions, not conservation of energy."
      ],
      "teacher": "Pressure favors the smaller-volume phase. If the solid is denser, pressure tends to favor the solid rather than produce the same melting response as ordinary ice. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "latent": {
    "title": "Energy and phase changes",
    "heading": "Read slopes and plateaus as different energy changes.",
    "subtitle": "Energy and phase changes",
    "target": "Read slopes and plateaus as different energy changes.",
    "visual": "heating-curve",
    "paragraphs": [
      "Heating a sample does not always raise its temperature. Within a single phase, added energy can increase temperature according to Q = mcΔT under the usual assumptions. During an equilibrium phase change of a pure substance at fixed pressure, added energy changes the phase fraction while temperature remains approximately constant.",
      "The latent energy for melting or vaporization is Q = mL. Melting and vaporization require energy input, while freezing and condensation release it. Vaporization usually requires much more energy per kilogram than melting for water because separating molecules into a dilute gas involves a much larger change in their interactions.",
      "A heating curve plots temperature against energy added. Sloped segments correspond to temperature changes within one phase; plateaus correspond to changing phase fractions. For a fixed mass, a steeper slope means a smaller heat capacity. The horizontal width of a plateau measures the energy required for the transition, not the time unless power is constant.",
      "Break a multistage problem into pieces: warm the ice, melt it, warm the liquid, vaporize it, then warm the vapor if needed. Add the relevant energies and retain units. The model below begins with ice at 0°C and ends with vapor at 100°C near one atmosphere. The omitted colder-ice and hotter-vapor portions remain important when the stated endpoints require them."
    ],
    "terms": [
      [
        "latent heat",
        "Energy per unit mass associated with a phase change under specified conditions."
      ],
      [
        "heating curve",
        "A graph showing temperature as energy is added to a sample."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare melting 1 kg of ice at 0°C with warming the resulting water to 100°C.",
      "reasoning": "Melting takes about 334 kJ. Warming takes 1 × 4.184 × 100 = 418.4 kJ. Both must be included to reach liquid water at 100°C from ice at 0°C."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Energy enters during a melting plateau. What primarily changes?",
      "options": [
        "The phase fraction",
        "The total mass must increase",
        "The temperature must rise at the same rate"
      ],
      "correct": 0,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Correct: the proportions of solid and liquid change.",
        "The same matter changes arrangement.",
        "Temperature remains near the melting point while both phases coexist in the ideal model."
      ],
      "teacher": "Melting takes about 334 kJ. Warming takes 1 × 4.184 × 100 = 418.4 kJ. Both must be included to reach liquid water at 100°C from ice at 0°C. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "idealGas": {
    "title": "The ideal gas law",
    "heading": "Connect pressure, volume, amount, and absolute temperature.",
    "subtitle": "The ideal gas law",
    "target": "Connect pressure, volume, amount, and absolute temperature.",
    "visual": "ideal-gas-lab",
    "paragraphs": [
      "A gas has several linked macroscopic properties: pressure P, volume V, absolute temperature T, and amount n measured in moles. The ideal gas law combines them as PV = nRT. It is a model for particles whose own volume and intermolecular attractions can be neglected compared with the available space and thermal motion.",
      "Use absolute pressure and kelvins. Gauge pressure omits the surrounding atmospheric contribution, while Celsius temperature has an offset zero. Either substitution can spoil the proportional relationships. For a fixed amount at fixed volume, doubling T doubles P. For fixed amount and temperature, increasing volume lowers pressure, reproducing Boyle's law.",
      "A mole counts particles using Avogadro's constant. The equivalent expression PV = NkBT uses the number of particles N and Boltzmann's constant kB, with R = NAkB. Distinguish particle count from mass: equal moles of different gases have equal particle numbers but generally different masses.",
      "Change the volume and temperature in the model and follow the pressure response. A real gas departs from the ideal model at high density or near condensation, where finite particle size and attractions matter. A result that predicts a liquid behaving like an ideal gas signals that the state assumptions need revision. Always specify what is fixed before making a proportional prediction."
    ],
    "terms": [
      [
        "ideal gas",
        "A gas model with negligible particle volume and negligible intermolecular potential energy between collisions."
      ],
      [
        "mole",
        "An amount containing exactly 6.02214076 × 10²³ specified entities."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A sealed rigid ideal-gas container warms from 300 K to 450 K. Compare pressures.",
      "reasoning": "At fixed n and V, P₂/P₁ = 450/300 = 1.5. Absolute pressure increases by 50%."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which values belong in PV = nRT?",
      "options": [
        "Gauge pressure and Celsius",
        "Absolute pressure and kelvins",
        "Any pressure and temperature scale"
      ],
      "correct": 1,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Both zero points would make the proportional law incorrect.",
        "Correct: use absolute quantities and consistent units.",
        "Changing scales requires conversion, not direct substitution."
      ],
      "teacher": "At fixed n and V, P₂/P₁ = 450/300 = 1.5. Absolute pressure increases by 50%. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "kinetic": {
    "title": "Kinetic theory",
    "heading": "Explain gas pressure through momentum exchange.",
    "subtitle": "Kinetic theory",
    "target": "Explain gas pressure through momentum exchange.",
    "visual": "kinetic-gas",
    "paragraphs": [
      "Gas pressure emerges from many molecular collisions with a container wall. Each collision changes the molecule's momentum and exerts a force on the wall. Averaging those impacts over time and area gives pressure. No single molecule needs to move in a preferred direction for the gas to exert pressure on every wall.",
      "For a classical ideal gas in thermal equilibrium, the mean translational kinetic energy per particle is 3kBT/2. Consequently, the root-mean-square speed is vrms = √(3kBT/m), where m is one particle's mass. At the same temperature, lighter particles have a greater rms speed even though the mean translational kinetic energies match.",
      "The particles have a speed distribution, not a common speed. The rms, mean, and most probable speeds are different summaries of that distribution. Raising temperature broadens the distribution and shifts characteristic speeds upward. Random microscopic speeds can be large even when the bulk gas has no net flow.",
      "Use the model to compare gases while holding temperature fixed, then warm one gas. Doubling absolute temperature doubles mean translational kinetic energy but increases rms speed only by √2. Rotations, vibrations, and real intermolecular interactions can contribute to internal energy beyond translational motion. The simple formula must not be treated as a complete internal-energy model for every material and temperature."
    ],
    "terms": [
      [
        "root-mean-square speed",
        "The square root of the mean of the squared molecular speeds."
      ],
      [
        "kinetic theory",
        "A model connecting macroscopic gas properties with microscopic particle motion and collisions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "At the same temperature, compare rms speeds for molecules with masses m and 4m.",
      "reasoning": "The heavier molecules have half the rms speed. Their mean translational kinetic energy is the same because ½(4m)(v/2)² = ½mv²."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Double T for the same ideal gas. Its rms speed becomes…",
      "options": [
        "Twice as large",
        "√2 times as large",
        "Half as large"
      ],
      "correct": 1,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Kinetic energy doubles, but speed enters squared.",
        "Correct: vrms is proportional to √T at fixed molecular mass.",
        "Warming increases characteristic speeds."
      ],
      "teacher": "The heavier molecules have half the rms speed. Their mean translational kinetic energy is the same because ½(4m)(v/2)² = ½mv². Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "phaseDiagram": {
    "title": "Phase diagrams",
    "heading": "Identify the stable phase from pressure and temperature.",
    "subtitle": "Phase diagrams",
    "target": "Identify the stable phase from pressure and temperature.",
    "visual": "phase-map",
    "paragraphs": [
      "Temperature alone does not determine a substance's phase. Pressure also matters. A phase diagram marks regions where solid, liquid, or gas is thermodynamically stable and curves where two phases can coexist in equilibrium. Moving across a boundary changes which phase is favored under the specified conditions.",
      "Water has a triple point where three equilibrium boundaries meet. The liquid–vapor boundary ends at a critical point; beyond it, liquid and gas are no longer separate equilibrium phases with a sharp interface. Below the triple-point pressure, heating stable ice can lead directly to vapor through sublimation rather than a stable liquid interval.",
      "Along a liquid–vapor coexistence boundary, raising pressure generally raises the boiling temperature. Water's solid–liquid boundary near ordinary conditions slopes unusually: increasing pressure slightly lowers the melting temperature because the liquid is denser than ordinary ice. Other materials need their own diagrams.",
      "The schematic lets you inspect these regions without pretending that equally spaced drawing coordinates are precise pressure measurements. Follow a path, name the variable held fixed, and state each boundary crossing. A real sample may temporarily supercool or superheat because phase formation requires nucleation. The equilibrium diagram predicts favored states, while kinetics determines how rapidly a particular sample actually reaches them."
    ],
    "terms": [
      [
        "phase diagram",
        "A map of stable equilibrium phases as functions of variables such as pressure and temperature."
      ],
      [
        "critical point",
        "The endpoint of a liquid–vapor coexistence curve beyond which those phases are no longer distinct."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "At a pressure below water’s triple point, can warming stable ice produce an equilibrium liquid interval?",
      "reasoning": "No. The stable path crosses from solid to vapor by sublimation; the liquid region is absent at that pressure."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why must pressure be specified when quoting a boiling point?",
      "options": [
        "The liquid–vapor boundary depends on pressure",
        "Pressure changes the identity of every molecule",
        "All phase boundaries are vertical"
      ],
      "correct": 0,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Correct: a different pressure gives a different equilibrium boiling temperature.",
        "Molecular identity need not change during a phase change.",
        "Phase boundaries generally connect changing pressures and temperatures."
      ],
      "teacher": "No. The stable path crosses from solid to vapor by sublimation; the liquid region is absent at that pressure. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  },
  "humidity": {
    "title": "Humidity, evaporation, and boiling",
    "heading": "Compare actual vapor with the saturation condition.",
    "subtitle": "Humidity, evaporation, and boiling",
    "target": "Compare actual vapor with the saturation condition.",
    "visual": "humidity-lab",
    "paragraphs": [
      "Relative humidity compares the water vapor actually present with the saturation amount at the same temperature. For a dilute mixture, it is approximately 100 times the ratio of water-vapor partial pressure to saturated vapor pressure. A value of 50% does not mean half the air molecules are water.",
      "Saturation vapor pressure rises strongly with temperature. Cooling air without initially changing its water-vapor content therefore raises relative humidity. When the air reaches its dew point, condensation can begin on suitable surfaces. Further cooling generally requires some vapor to leave the gas phase to maintain equilibrium.",
      "Net evaporation from a surface depends on the imbalance between molecules escaping and returning, as well as transport through the air. Dry moving air often allows faster evaporation than humid still air. Boiling has a different criterion: the saturation vapor pressure must match the relevant total surrounding pressure so vapor bubbles can persist within the liquid.",
      "Use the humidity model to keep vapor partial pressure fixed while changing temperature. It caps the equilibrium relative humidity at saturation and reports when condensation would be required; it is not a prediction that vapor can remain indefinitely above saturation. The approximation applies to liquid water over an ordinary temperature range. Distinguish water-vapor partial pressure from total atmospheric pressure whenever you interpret either humidity or boiling."
    ],
    "terms": [
      [
        "relative humidity",
        "The ratio of actual water-vapor partial pressure to saturation vapor pressure at the same temperature, expressed as a percentage."
      ],
      [
        "partial pressure",
        "The contribution of one gas species to a mixture’s total pressure in the ideal-gas approximation."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Air cools while its water-vapor partial pressure initially stays fixed. What happens to relative humidity?",
      "reasoning": "It rises because saturation vapor pressure falls. At the dew point, condensation can remove vapor during further cooling."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does 50% relative humidity mean that half the air is water vapor?",
      "options": [
        "Yes",
        "No, it is a ratio to saturation at that temperature",
        "Only at sea level"
      ],
      "correct": 1,
      "hint": "Identify the phase, the surrounding pressure, and the energy path.",
      "feedback": [
        "Relative humidity is not a composition percentage.",
        "Correct: the denominator changes strongly with temperature.",
        "The distinction holds at other pressures too."
      ],
      "teacher": "It rises because saturation vapor pressure falls. At the dew point, condensation can remove vapor during further cooling. Accept a labeled particle or energy diagram when it supports the explanation."
    }
  }
} satisfies Record<string, LessonContent>
