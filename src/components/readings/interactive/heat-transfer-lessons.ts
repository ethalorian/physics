import type { LessonContent } from './lesson-contract'
export const heatTransferLessons = {
  "conduction": {
    "title": "Conduction",
    "heading": "Explain transfer through a material without bulk flow.",
    "subtitle": "Conduction",
    "target": "Explain transfer through a material without bulk flow.",
    "visual": "conduction-lab",
    "paragraphs": [
      "Touching metal and wood in the same room often produces different sensations even when they have the same temperature. The metal can transfer energy from warmer skin more rapidly. The sensation tells us about an exchange rate as well as temperature. It does not establish that the metal was initially colder.",
      "In conduction, energy transfers through microscopic interactions within matter or across a contact. Particles in a solid vibrate about local positions rather than traveling from the hot end to the cold end. Mobile electrons make a strong contribution in many metals. Good insulation reduces the rate of transfer; it does not generate energy or guarantee zero transfer forever.",
      "For a uniform slab in steady state, the conduction rate is P = kAΔT/L. The thermal conductivity k describes the material; A is the cross-sectional area, L the thickness, and ΔT the face-to-face temperature difference. Doubling area doubles the rate, while doubling thickness halves it under these assumptions. The symbol P here is power, measured in watts.",
      "Use the slab model to separate energy from rate: a watt is a joule each second. Real walls combine layers and may also exchange energy by convection and radiation at their surfaces. Trapped air works well only when its motion is restricted; an open air gap can support convection that bypasses a simple conduction-only estimate."
    ],
    "terms": [
      [
        "conduction",
        "Energy transfer through microscopic interactions without bulk transport of the material."
      ],
      [
        "thermal conductivity",
        "A material property determining the steady conduction rate for a specified temperature gradient."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Double a slab’s thickness while keeping k, area, and face temperatures fixed.",
      "reasoning": "P = kAΔT/L becomes half as large. The same energy transfer takes twice as long if the boundary temperatures remain fixed."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Why can room-temperature metal feel colder than room-temperature wood?",
      "options": [
        "Metal must have a lower temperature",
        "Metal can transfer energy from the skin faster",
        "Wood creates heat"
      ],
      "correct": 1,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Equal temperatures can produce different transfer rates.",
        "Correct: the material response changes the energy-transfer rate.",
        "Insulating materials slow transfer; they do not create energy."
      ],
      "teacher": "P = kAΔT/L becomes half as large. The same energy transfer takes twice as long if the boundary temperatures remain fixed. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  },
  "convection": {
    "title": "Convection",
    "heading": "Connect fluid motion with energy transport.",
    "subtitle": "Convection",
    "target": "Connect fluid motion with energy transport.",
    "visual": "convection-lab",
    "paragraphs": [
      "Warm water rising in a pot transports internal energy with it. This bulk movement of fluid is convection. It differs from conduction, where microscopic interactions transfer energy without a bulk current, and from radiation, which can carry energy across empty space. Several methods commonly operate at the same time.",
      "Natural convection often begins when heating at approximately constant pressure lowers a fluid's density. Surrounding denser fluid then provides a buoyant force greater than the warmer parcel's weight. The parcel rises, cooler fluid replaces it, and a circulation can develop. Heat itself does not have a direction called up; buoyancy in a gravitational field creates the upward motion in this example.",
      "Heating from below can therefore create an unstable density arrangement. Heating from above can leave a stable warm layer over cooler fluid and produce much weaker natural mixing. A fan or pump can force convection even when buoyancy is weak. Forced convection still needs an energy source to run the device.",
      "Follow a parcel around the diagram and identify where it receives and gives up energy. Expansion of rising air can also cool it as the parcel does work against its surroundings. Condensation may release energy when moist air rises, so a real cloud does not necessarily follow the dry-air temperature trend. The diagram illustrates circulation, not a weather forecast."
    ],
    "terms": [
      [
        "convection",
        "Energy transport associated with bulk motion of a fluid."
      ],
      [
        "natural convection",
        "Fluid circulation driven by density differences and buoyancy."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare heating a water layer from below and from above before boiling.",
      "reasoning": "Heating from below can put lower-density warm water underneath denser water, causing buoyant overturning. Heating from above tends to form a stable arrangement, so conduction may dominate across the layer."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which statement best describes natural convection?",
      "options": [
        "Heat always rises",
        "Buoyancy can move warmer, less-dense fluid upward",
        "Only gases can convect"
      ],
      "correct": 1,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Energy also transfers sideways and downward; identify the moving fluid.",
        "Correct under the usual expansion and gravity assumptions.",
        "Liquids can also move in convective currents."
      ],
      "teacher": "Heating from below can put lower-density warm water underneath denser water, causing buoyant overturning. Heating from above tends to form a stable arrangement, so conduction may dominate across the layer. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  },
  "radiation": {
    "title": "Radiation",
    "heading": "Follow energy across space without a material carrier.",
    "subtitle": "Radiation",
    "target": "Follow energy across space without a material carrier.",
    "visual": "radiation-lab",
    "paragraphs": [
      "Sunlight transfers energy across the nearly empty space between the Sun and Earth. Conduction and convection require matter along the transfer path; electromagnetic radiation does not. A warm object can therefore exchange energy with its surroundings even inside a vacuum chamber, provided radiation can reach another surface.",
      "Thermal radiation spans a range of wavelengths. Everyday objects emit mostly infrared radiation, which is invisible to human eyes. A hotter object can emit visibly without losing its infrared emission. Color seen in reflected room light is not a reliable measurement of how strongly a material emits at every infrared wavelength.",
      "For an idealized diffuse gray surface of area A and emissivity ε, the emitted power is εσAT⁴. When surrounded by a large environment at temperature Ts with appropriate view and surface assumptions, the net outward transfer is εσA(T⁴ − Ts⁴). Both temperatures must be in kelvins. The environment also radiates toward the object.",
      "Change the two temperatures in the model. Equal temperatures give zero net transfer, rather than zero emission. A colder object can receive more energy than it emits and warm up. The equation treats an ideal enclosure; actual windows, wavelength-dependent properties, geometry, and multiple surfaces require a more detailed radiation balance."
    ],
    "terms": [
      [
        "thermal radiation",
        "Electromagnetic energy emitted because of a material’s temperature."
      ],
      [
        "emissivity",
        "A measure of emission relative to an ideal blackbody under specified conditions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An object and its enclosing room are both at 300 K. Does the object stop radiating?",
      "reasoning": "No. It emits and absorbs at equal rates, giving zero net radiative transfer in equilibrium."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which method can transfer energy across a vacuum?",
      "options": [
        "Conduction through air",
        "Convection",
        "Electromagnetic radiation"
      ],
      "correct": 2,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Air conduction requires matter, which the vacuum does not provide.",
        "Convection requires bulk-moving matter.",
        "Correct: electromagnetic radiation needs no material medium."
      ],
      "teacher": "No. It emits and absorbs at equal rates, giving zero net radiative transfer in equilibrium. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  },
  "emission": {
    "title": "Emission of radiant energy",
    "heading": "Connect temperature with emission rate and wavelength.",
    "subtitle": "Emission of radiant energy",
    "target": "Connect temperature with emission rate and wavelength.",
    "visual": "spectrum-lab",
    "paragraphs": [
      "Every ordinary object at a temperature above absolute zero emits thermal radiation. We notice a glowing stove element because enough of its spectrum lies in the visible range, but an unlit cooler element still emits infrared radiation. The absence of visible glow is not the absence of emission.",
      "An ideal blackbody is a useful reference. Its total emitted power per area is σT⁴, and the wavelength of the maximum in its wavelength spectrum satisfies λmaxT ≈ 2.898 × 10⁻³ m·K. Raising temperature therefore increases total emission and moves that peak toward shorter wavelengths. The full spectrum remains broad rather than becoming a single color.",
      "Real materials have emissivities that can depend on wavelength, direction, temperature, and surface condition. Infrared instruments estimate temperature from measured radiation using assumptions about those properties and reflected background radiation. A shiny surface may reflect the surroundings strongly, so a radiation reading requires more interpretation than aiming and accepting a number.",
      "Use the peak-wavelength explorer to compare a room-temperature object with a hotter emitter. The plotted peak is defined per unit wavelength; a spectrum plotted per unit frequency has a different numerical peak position. Keep the representation explicit. A change in emission rate is also different from a change in net cooling rate because the environment continues to irradiate the surface."
    ],
    "terms": [
      [
        "blackbody",
        "An ideal absorber whose thermal emission provides a reference spectrum."
      ],
      [
        "Wien displacement law",
        "The inverse relationship between absolute temperature and the peak wavelength of a blackbody’s wavelength spectrum."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Estimate the peak wavelength at 300 K.",
      "reasoning": "λmax = 2.898 × 10⁻³/300 m ≈ 9.66 μm, in the infrared."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "When a blackbody’s temperature doubles, its wavelength-spectrum peak…",
      "options": [
        "Moves to half the wavelength",
        "Moves to twice the wavelength",
        "Does not move"
      ],
      "correct": 0,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Correct: λmax is inversely proportional to T.",
        "The peak moves toward shorter, not longer, wavelengths.",
        "The spectral distribution changes with temperature."
      ],
      "teacher": "λmax = 2.898 × 10⁻³/300 m ≈ 9.66 μm, in the infrared. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  },
  "absorption": {
    "title": "Absorption of radiant energy",
    "heading": "Balance incoming and outgoing radiation.",
    "subtitle": "Absorption of radiant energy",
    "target": "Balance incoming and outgoing radiation.",
    "visual": "radiation-lab",
    "paragraphs": [
      "A surface warms by radiation only when it absorbs more energy than it emits and loses through other mechanisms. A dark shirt in sunlight often absorbs more visible light than a pale one, but the result also depends on fabric, airflow, and infrared properties. Visible appearance alone cannot determine the entire thermal balance.",
      "At a given wavelength and direction, good absorbers are also good emitters under equilibrium conditions. A surface that absorbs strongly can emit strongly as well. This connection does not mean every surface at every temperature emits the same power, or that a white visible appearance guarantees weak infrared emission.",
      "A blackbody cavity makes the idea concrete. Radiation entering a small opening can reflect many times from the internal walls, giving many opportunities for absorption. The opening behaves approximately like an excellent absorber. When the cavity is at a uniform temperature, radiation leaving the opening has a spectrum close to the blackbody reference.",
      "In the exchange model, emissivity multiplies the net rate for a gray surface in a large enclosure. Increasing it increases net cooling when the object is hotter, but also increases net warming when the enclosure is hotter. At equal temperatures, emission and absorption balance for either setting. Predict the direction before interpreting the change in magnitude."
    ],
    "terms": [
      [
        "absorption",
        "Transfer of incident radiation energy into a material."
      ],
      [
        "radiative equilibrium",
        "A condition in which absorbed and emitted radiative powers balance, absent other net transfers."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Increase emissivity for an object at 350 K inside a 300 K enclosure.",
      "reasoning": "Net outward radiative power increases in the gray-surface model. If both were at 300 K, the net rate would remain zero."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A good absorber in thermal equilibrium is also…",
      "options": [
        "A good emitter at the same wavelength",
        "Unable to radiate",
        "Necessarily hotter than everything nearby"
      ],
      "correct": 0,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Correct: absorption and emission properties are linked at matched wavelengths and conditions.",
        "Absorption does not prevent emission.",
        "Equilibrium can occur at a common temperature."
      ],
      "teacher": "Net outward radiative power increases in the gray-surface model. If both were at 300 K, the net rate would remain zero. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  },
  "cooling": {
    "title": "Newton’s law of cooling",
    "heading": "Distinguish a temperature difference from a cooling rate.",
    "subtitle": "Newton’s law of cooling",
    "target": "Distinguish a temperature difference from a cooling rate.",
    "visual": "cooling-lab",
    "paragraphs": [
      "A hot drink usually cools rapidly at first and more slowly as it approaches room temperature. A simple model takes the net outward power to be proportional to the temperature difference: P = hA(T − Ta). Here Ta is ambient temperature, A an effective exchange area, and h an effective transfer coefficient for the stated conditions.",
      "If the drink has a uniform temperature and constant heat capacity C, the resulting temperature is T(t) = Ta + (T₀ − Ta)e^(−t/τ), where τ = C/(hA). The difference from ambient shrinks by the same fraction in each interval of length τ. The model does not predict a constant number of degrees lost every minute.",
      "A larger heat capacity slows the response, while stronger exchange reduces τ. Air motion, a lid, container shape, evaporation, and changing material properties can alter the response. Radiation is fundamentally a fourth-power relationship, though a linear approximation can work over a limited temperature range.",
      "Use the time control to follow the approach to ambient. The same equation predicts warming for an initially colder object. It approaches ambient without crossing it under these fixed assumptions. A drink that drops below room temperature would require an additional mechanism, such as evaporation or contact with a colder reservoir, outside this simple model."
    ],
    "terms": [
      [
        "time constant",
        "The time in an exponential model for the difference from equilibrium to fall to 1/e of its initial value."
      ],
      [
        "ambient temperature",
        "The temperature of the surrounding environment used in a transfer model."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A sample starts 60 K above ambient. What difference remains after one time constant?",
      "reasoning": "60/e ≈ 22.1 K. The difference has fallen to about 37% of its initial value, not by a fixed 60-degree amount."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "In this model, does the same number of degrees disappear each minute?",
      "options": [
        "Yes",
        "No, the rate decreases as the temperature difference shrinks",
        "Only because time stops near equilibrium"
      ],
      "correct": 1,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "The rate is proportional to the remaining temperature difference.",
        "Correct: equal intervals remove equal fractions of the difference.",
        "Time continues; the transfer rate becomes small."
      ],
      "teacher": "60/e ≈ 22.1 K. The difference has fallen to about 37% of its initial value, not by a fixed 60-degree amount. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  },
  "greenhouse": {
    "title": "The greenhouse effect",
    "heading": "Explain warming using a planetary energy balance.",
    "subtitle": "The greenhouse effect",
    "target": "Explain warming using a planetary energy balance.",
    "visual": "greenhouse-lab",
    "paragraphs": [
      "Earth receives sunlight, reflects some of it, and emits thermal infrared radiation to space. Over an interval, absorbed energy minus outgoing energy changes the system's stored energy. A stable global average temperature requires a balanced long-term energy budget, even though local temperatures and weather continue to vary.",
      "Greenhouse gases absorb and emit infrared radiation in particular wavelength bands. They do not form a perfectly sealed lid or block every outgoing wavelength. Emission occurs in multiple directions, including toward the surface. Increasing infrared opacity can reduce outgoing energy at the same initial temperature structure, creating an imbalance that leads to warming until the budget readjusts.",
      "Human activities increase concentrations of long-lived greenhouse gases, especially through fossil-fuel use and land-use changes. Water vapor and clouds interact with the resulting temperature changes. A classroom energy-balance model helps isolate a mechanism; it cannot by itself predict a regional climate, a date, or the size of every feedback.",
      "The one-layer illustration holds absorbed sunlight fixed and represents atmospheric infrared absorptivity with one parameter. Its temperatures are model outputs, not forecasts. A glass greenhouse also restricts air movement, so the everyday structure is an incomplete analogy for atmospheric warming. Trace the upward and downward energy flows and explain why the final outgoing planetary energy must match the absorbed input in equilibrium."
    ],
    "terms": [
      [
        "greenhouse effect",
        "Warming associated with atmospheric absorption and emission of thermal infrared radiation."
      ],
      [
        "energy imbalance",
        "A difference between incoming and outgoing energy rates that changes stored energy."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Outgoing radiation temporarily decreases while absorbed sunlight stays fixed. What happens to Earth’s energy account?",
      "reasoning": "Stored energy increases because input exceeds output. Temperatures and other parts of the climate system respond; a new equilibrium requires outgoing power to recover to the absorbed input."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does the greenhouse model require the atmosphere to block all outgoing radiation?",
      "options": [
        "Yes",
        "No, selective absorption and emission change the energy balance",
        "No, because energy is created in the atmosphere"
      ],
      "correct": 1,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Radiation still escapes; the mechanism depends on its exchange and emission conditions.",
        "Correct: outgoing energy is altered at the original temperature structure.",
        "Energy is redistributed and stored, not created."
      ],
      "teacher": "Stored energy increases because input exceeds output. Temperatures and other parts of the climate system respond; a new equilibrium requires outgoing power to recover to the absorbed input. Look for a causal explanation, a named system, and an appropriate limitation."
    },
    "references": [
      {
        "title": "NASA: Earth’s radiation budget",
        "url": "https://science.nasa.gov/ems/13_radiationbudget/"
      }
    ]
  },
  "methods": {
    "title": "Heat-transfer methods",
    "heading": "Identify simultaneous energy-transfer paths.",
    "subtitle": "Heat-transfer methods",
    "target": "Identify simultaneous energy-transfer paths.",
    "visual": "transfer-paths",
    "paragraphs": [
      "A pan on a stove contains several energy-transfer paths at once. Energy conducts through the metal base, moving water transports energy by convection, and hot surfaces emit radiation. Naming one visible method does not prove the others have vanished. The task is to identify the system boundary and the path of interest.",
      "Conduction transfers energy through microscopic interactions in matter. Convection carries energy with bulk motion of a fluid. Radiation transfers electromagnetic energy and can cross empty space. Each description addresses a mechanism; none means that heat is a substance or that temperature itself travels from one place to another.",
      "Choose a boundary around the water alone. Energy crossing the pan–water contact enters through conduction, after which circulation redistributes energy through the water. Choose a boundary around pan and water together and the stove, room air, and surrounding surfaces become external participants. The correct account changes with the chosen boundary even though the physical experiment is the same.",
      "The path diagram lets you isolate each mechanism in a familiar scene. A thermos uses multiple strategies because suppressing just one path leaves others available: a vacuum reduces gas conduction and convection, while reflective surfaces reduce radiative exchange. A stopper and structural supports still provide paths. Predict a design improvement by naming the path it changes and explaining the effect on the net transfer rate."
    ],
    "terms": [
      [
        "transfer mechanism",
        "The physical process by which energy crosses a selected boundary."
      ],
      [
        "energy balance",
        "An account equating stored-energy change with net energy transferred in and out."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why does a vacuum flask benefit from reflective surfaces as well as an evacuated gap?",
      "reasoning": "The gap limits conduction and convection through gas, while reflective low-emissivity surfaces reduce radiation across the gap. Supports and the stopper still transfer energy."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Which pair can act together in a pot of water?",
      "options": [
        "Conduction at the base and convection within the water",
        "Only radiation; liquids cannot conduct",
        "Only convection; the metal base cannot transfer energy"
      ],
      "correct": 0,
      "hint": "Track the energy transfer and state which conditions are held fixed.",
      "feedback": [
        "Correct: mechanisms can operate along different parts of the same energy path.",
        "Liquids conduct, even if convection is stronger in the bulk.",
        "The metal base conducts energy to the adjacent water."
      ],
      "teacher": "The gap limits conduction and convection through gas, while reflective low-emissivity surfaces reduce radiation across the gap. Supports and the stopper still transfer energy. Look for a causal explanation, a named system, and an appropriate limitation."
    }
  }
} satisfies Record<string, LessonContent>
