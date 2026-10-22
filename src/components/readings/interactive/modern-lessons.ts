import type {LessonContent} from './lesson-contract'
export const modernLessons = {
  "models": {
    "title": "Models",
    "heading": "Choose a model by the question and the evidence.",
    "subtitle": "Models",
    "target": "Choose a model by the question and the evidence.",
    "visual": "modern-models",
    "paragraphs": [
      "A model is a representation that connects assumptions to predictions. It is useful when it explains observations within a stated range, even if its picture is incomplete. A road map is helpful without showing every tree. Likewise, an atomic drawing should be judged by what it predicts, not by whether it resembles a tiny solar system.",
      "A planetary picture places an electron on a definite path around a nucleus. It is memorable, but classical electrodynamics predicts that an accelerating charge radiates and loses energy. That picture therefore cannot account for stable atoms. Bohr added allowed energies and explained important hydrogen spectral features, while leaving many-electron atoms and other observations unresolved.",
      "Modern quantum mechanics represents an electron with a state that predicts probabilities for measurement outcomes. An orbital is a spatial state, not an orbit. An electron-density cloud indicates the probability density for finding the electron at different positions across repeated identically prepared measurements. It is not a photograph of a tiny object following a blurred, pre-existing circular path.",
      "Light also requires different representations for different questions. A ray model predicts image geometry when diffraction is negligible. A wave model explains interference and polarization. Quantized electromagnetic interactions explain discrete energy exchanges and single-photon detection. These are connected descriptions with overlapping domains; light does not make a conscious choice between being a little ball and being a water wave.",
      "The exploration pairs an observation with the kind of prediction it needs. State the measured quantity before selecting a model. Then identify a result that would challenge the prediction. Updating a model is a strength of scientific reasoning: new evidence can reveal a boundary that earlier experiments could not resolve."
    ],
    "terms": [
      [
        "model",
        "Representation connecting stated assumptions to testable predictions."
      ],
      [
        "orbital",
        "A quantum spatial state of an electron, distinct from a classical path."
      ],
      [
        "probability density",
        "Quantity whose integral over a region gives the probability of an outcome in that region."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An atom emits several sharply defined colors. What must a successful model account for?",
      "reasoning": "It must predict particular photon energies, connected to differences between allowed atomic energies. A drawing of an orbit alone is not enough."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A cloud drawing of an orbital represents…",
      "options": [
        "A probability distribution for position measurements",
        "A measured circular path with fuzzy edges",
        "A miniature material cloud that can be cut into electron pieces"
      ],
      "correct": 0,
      "feedback": [
        "Correct: its interpretation comes from repeated measurement probabilities.",
        "An orbital is not a classical trajectory.",
        "The drawing encodes a quantum state rather than pieces of electron material."
      ],
      "hint": "Ask what the picture predicts an experiment will record.",
      "teacher": "Require students to name both a useful prediction and a limit of each model."
    }
  },
  "electronWaves": {
    "title": "Electron Waves",
    "heading": "Boundary conditions select allowed states.",
    "subtitle": "Electron Waves",
    "target": "Boundary conditions select allowed states.",
    "visual": "modern-ring",
    "paragraphs": [
      "De Broglie proposed that matter has a wavelength related to momentum by λ = h/p. That relationship helps explain why an electron confined near an atom cannot have just any state. A wave must fit the conditions imposed on it. The allowed patterns then have particular momenta or energies instead of a continuous range of arbitrary possibilities.",
      "Imagine a wave defined around an ideal ring of fixed circumference. Returning once around the ring brings you to the same physical point, so the complex wave amplitude must match itself. An integer number of wavelengths satisfies this periodic boundary condition. A noninteger number returns with the wrong phase. The exploration lets you compare those cases without pretending the ring is a literal atomic orbit.",
      "For a free particle on a one-dimensional ring, clockwise and counterclockwise traveling-wave states are possible, and combinations can make standing patterns. Their energies scale with the square of the integer mode number when the ring is fixed. A zero-momentum constant state is also allowed in that ideal ring problem. This detail shows why a mathematical boundary model must not be confused with every feature of a real atom.",
      "Bohr’s historical orbit rule can be motivated using an integer number of de Broglie wavelengths. Modern atomic theory instead solves a three-dimensional wave equation in the electric interaction with the nucleus, including appropriate boundary and normalization conditions. Its orbitals include radial and angular structure and do not specify electron trajectories.",
      "The common idea is compatibility: a permitted state must satisfy both the governing equation and its boundary conditions. Compare this with a vibrating string, where fixed endpoints select standing modes. The analogy explains discreteness, while the different geometry and equation explain why the spectra are not identical."
    ],
    "terms": [
      [
        "boundary condition",
        "Restriction that a physical solution must satisfy at a boundary or equivalent point."
      ],
      [
        "mode",
        "An allowed wave pattern satisfying the governing equation and boundary conditions."
      ],
      [
        "quantization",
        "Restriction of a quantity to particular allowed values in a specified system."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A ring circumference equals three wavelengths. Does the wave match its starting phase after one circuit?",
      "reasoning": "Yes. Three complete cycles return to the same phase. Three-and-a-half cycles instead reverse the sign and fail the periodic matching condition."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The ring model explains atomic states most directly by illustrating…",
      "options": [
        "That electrons follow visible circular tracks",
        "That all confined systems have identical energy levels",
        "How compatibility conditions restrict wave patterns"
      ],
      "correct": 2,
      "feedback": [
        "The ring is an analogy, not a measured atomic path.",
        "Geometry and interactions change the allowed energies.",
        "Correct: the boundary-condition principle transfers."
      ],
      "hint": "Transfer the principle while naming the difference between the systems.",
      "teacher": "Ask students to explain why an integer condition is needed without drawing an electron trajectory."
    }
  },
  "atomicSize": {
    "title": "Relative Sizes of Atoms",
    "heading": "Separate a one-electron scaling law from many-electron trends.",
    "subtitle": "Relative Sizes of Atoms",
    "target": "Separate a one-electron scaling law from many-electron trends.",
    "visual": "modern-radius",
    "paragraphs": [
      "An atom does not have a hard outer surface. Atomic size can mean a measure inferred from bonding, scattering, or a calculated electron distribution. Different definitions produce different numerical radii. Before comparing atoms, choose the same definition and physical situation for both.",
      "The Bohr model gives a useful one-electron size scale rₙ = a₀n²/Z, where Z is nuclear charge and a₀ is the Bohr radius. Holding the state label n fixed, a larger positive charge binds the electron more tightly and reduces that scale. Holding Z fixed, a larger n gives a larger characteristic extent. Modern hydrogenic states retain this broad scaling, although their probability distributions are not circular orbits.",
      "A neutral atom with Z protons also has Z electrons. Increasing Z in a neutral sequence therefore adds both nuclear attraction and electron interactions. Inner electrons partly shield outer electrons from the nucleus. The effective attraction felt by a valence electron is consequently different from the attraction of an otherwise bare nucleus.",
      "Across many main-group periods, effective nuclear attraction increases and comparable atomic radii generally decrease. Beginning a new occupied shell usually increases size. These are trends with qualifications, not a claim that a simple one-electron formula exactly predicts every neutral element. Electron configuration, bonding, and the chosen radius definition all matter.",
      "The exploration varies n and Z for a single electron only. It deliberately keeps electron count fixed so that the prediction is clear. Use it to explain why a hydrogenic ion can contract as Z increases, then explain why that calculation cannot simply be relabeled as a table of neutral atomic radii. Distinguishing those comparisons is more valuable than memorizing an unqualified rule about bigger atoms."
    ],
    "terms": [
      [
        "shielding",
        "Reduction of nuclear attraction experienced by an electron because of other electrons."
      ],
      [
        "hydrogenic ion",
        "An atom or ion containing only one electron."
      ],
      [
        "Bohr radius",
        "Characteristic hydrogen length scale a₀, approximately 0.0529 nm."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "For a one-electron system in the same n state, double Z. How does the Bohr radius scale change?",
      "reasoning": "Because rₙ is proportional to 1/Z, the scale halves. This comparison does not add electrons to make both atoms neutral."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Why does rₙ = a₀n²/Z not directly give every neutral atom’s radius?",
      "options": [
        "Nuclear charge never affects electron states",
        "Many-electron interactions and shielding matter",
        "Neutral atoms contain no electrons"
      ],
      "correct": 1,
      "feedback": [
        "Nuclear attraction is central; it is modified by other electrons.",
        "Correct: the one-electron assumption no longer applies.",
        "A neutral atom has an electron count matching its proton count."
      ],
      "hint": "Keep track of electron count as well as proton count.",
      "teacher": "Ask students to distinguish a controlled hydrogenic comparison from a periodic trend."
    }
  },
  "chaos": {
    "title": "Predictability and Chaos",
    "heading": "A deterministic rule can amplify uncertainty in its starting point.",
    "subtitle": "Predictability and Chaos",
    "target": "A deterministic rule can amplify uncertainty in its starting point.",
    "visual": "modern-chaos",
    "paragraphs": [
      "Deterministic means that a model’s present state and rule determine its next state. It does not mean that a person can predict the state indefinitely from a measurement. Measurements have finite precision, and some deterministic systems amplify a small uncertainty until it becomes large enough to matter.",
      "The logistic map is a simple example: x at the next step equals r times x times (1 − x). Here x is a normalized number between zero and one and r controls the update. It was inspired by population models, but the exploration treats it as a mathematical sequence. The step number is not automatically a day, and x is not a forecast for a real ecosystem.",
      "For some r values, different initial states settle toward a common fixed value or a repeating cycle. For others, nearby initial values can separate strongly and produce irregular-looking sequences. That sensitivity is a defining feature of chaotic dynamics. It is different from adding random noise at each step: this model uses the same exact update rule throughout.",
      "The two plotted records begin only slightly apart. Compare them first with r = 2.8 and then with r = 3.9. Their early agreement does not prove permanent agreement. Nor does a later disagreement prove that the equations are wrong. It may reflect uncertainty in the initial state or parameters, along with the sensitivity of the dynamics.",
      "Chaos does not make every kind of prediction useless. Short-term forecasts, bounds, patterns, and statistical properties may still be reliable. Weather illustrates the need to distinguish a detailed long-range trajectory from a distribution of possibilities. Quantum probabilities raise a different issue: they are part of the quantum description of measurement outcomes, rather than merely classical uncertainty amplified by nonlinear motion."
    ],
    "terms": [
      [
        "deterministic",
        "Describes a model whose rule and exact state specify its later evolution."
      ],
      [
        "chaos",
        "Dynamics with sensitive dependence on initial conditions in an appropriate deterministic system."
      ],
      [
        "initial condition",
        "State specified at the start of a model calculation."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Two records use the same deterministic rule but begin at 0.4000 and 0.4001. Can different later values prove that random noise was added?",
      "reasoning": "No. A sensitive deterministic map can amplify the initial difference. Check the rule, parameter, and initial state before explaining the divergence."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A chaotic system necessarily makes which claim false?",
      "options": [
        "Exact long-term prediction follows from finite-precision starting data",
        "The same exact state follows the same deterministic rule",
        "Some short-term or statistical predictions can be useful"
      ],
      "correct": 0,
      "feedback": [
        "Correct: finite precision can limit the useful forecast horizon.",
        "That is compatible with chaos.",
        "Chaos does not eliminate every useful prediction."
      ],
      "hint": "Distinguish exact mathematical state from a measured initial state.",
      "teacher": "Ask students to describe both what remains predictable and what becomes uncertain."
    }
  },
  "attenuation": {
    "title": "Radiation Penetrating Power",
    "heading": "A transmission fraction differs from a fixed stopping distance.",
    "subtitle": "Radiation Penetrating Power",
    "target": "A transmission fraction differs from a fixed stopping distance.",
    "visual": "modern-attenuation",
    "paragraphs": [
      "Radiation transfers energy by interacting with matter. The important variables include radiation type, energy, material, and geometry. A broad comparison between alpha, beta, and gamma radiation is useful, but a ranking without those conditions cannot establish an exact penetration depth or a biological effect.",
      "An alpha particle is relatively massive and carries charge +2e. It produces many ionizations along a relatively short path and eventually loses its kinetic energy. Electrons and positrons also interact electrically, but their smaller masses and scattering lead to different tracks. Charged-particle ranges depend on initial energy and material; a simple sketch of paper or metal is not a universal shielding specification.",
      "A photon is neutral but still interacts electromagnetically. Photoelectric absorption, Compton scattering, and, at sufficiently high energy, pair production can remove it from an uncollided beam. It need not strike a classical hard ball head-on. After one interaction a photon can disappear or leave with changed energy and direction.",
      "For a narrow monoenergetic beam in a uniform material, the uncollided intensity follows I = I₀e^(−μx). Each equal thickness removes the same fraction of the remaining beam. A half-value layer therefore halves the uncollided intensity; two such layers leave one-quarter. The model omits buildup from scattered radiation and changes caused by a broad energy spectrum.",
      "The exploration uses thickness in half-value-layer units. Its prediction is a fraction, not a guarantee that every photon has stopped. Short penetration also does not imply harmlessness: an alpha-emitting substance inside tissue can deposit energy nearby. Separate radiation exposure from radioactive contamination, and separate the transmitted fraction from dose in a specified material."
    ],
    "terms": [
      [
        "attenuation",
        "Reduction of a beam through absorption and scattering out of the measured beam."
      ],
      [
        "half-value layer",
        "Thickness that halves uncollided intensity under specified conditions."
      ],
      [
        "contamination",
        "Presence of radioactive material where it is not intended."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A narrow beam crosses three half-value layers. What fraction remains uncollided?",
      "reasoning": "Each layer halves the remaining fraction, so (1/2)³ = 1/8 = 12.5%. Scattered contributions require additional modeling."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Adding another half-value layer removes…",
      "options": [
        "Half of the original beam every time",
        "Every remaining photon with certainty",
        "Half of the beam still uncollided"
      ],
      "correct": 2,
      "feedback": [
        "That would become negative after enough layers.",
        "An exponential model does not give a universal finite stopping distance.",
        "Correct: the reduction is multiplicative."
      ],
      "hint": "Apply the fraction to what remains.",
      "teacher": "Ask students which measurement geometry is implicit in the attenuation law."
    }
  },
  "isotopes": {
    "title": "Radioactive Isotopes",
    "heading": "Change neutrons, electrons, and protons one at a time.",
    "subtitle": "Radioactive Isotopes",
    "target": "Change neutrons, electrons, and protons one at a time.",
    "visual": "modern-isotopes",
    "paragraphs": [
      "An element is defined by the number of protons in its nucleus. Every hydrogen nucleus has one proton; every helium nucleus has two. The neutron count can vary without changing the element. These different nuclear forms of the same element are isotopes.",
      "Hydrogen provides a clear comparison. Protium has one proton and no neutron; deuterium has one proton and one neutron; tritium has one proton and two neutrons. Their mass numbers are one, two, and three. Protium and deuterium are stable, while tritium is radioactive. Merely being an isotope does not mean that a nucleus is unstable.",
      "Atomic number Z counts protons, and mass number A counts protons plus neutrons. The neutron count is A − Z. A is an integer count, not an exact measured atomic mass in unified atomic mass units. Binding energy contributes to the difference between the mass of an atom and the sum of isolated-particle masses.",
      "Electrons determine the net charge together with the protons. Removing an electron produces a more positive ion without changing A or Z. Adding a neutron changes the isotope without directly changing charge. Changing the proton number changes the element, which is a nuclear transformation rather than ordinary ionization.",
      "Isotopes have closely similar electronic chemistry because they share nuclear charge, but their masses can affect vibrational frequencies, reaction rates, and diffusion. Thus, chemically identical is an approximation, not a universal statement. The exploration keeps the nucleus and electron count visible as separate ledgers. Explain which property changes before naming the resulting isotope or ion; that habit prevents confusion in decay equations and tracer experiments."
    ],
    "terms": [
      [
        "atomic number",
        "Number Z of protons that identifies an element."
      ],
      [
        "isotope",
        "Nuclear form of an element with a specified neutron count."
      ],
      [
        "ion",
        "Atom or molecule whose electron and proton charges do not balance."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A deuterium atom loses its electron. What changes?",
      "reasoning": "Its charge changes from zero to +e. Its nucleus still contains one proton and one neutron, so it remains deuterium."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Adding a neutron to a nucleus while leaving its proton count fixed changes…",
      "options": [
        "Its electron count automatically",
        "Its isotope",
        "Its element by definition"
      ],
      "correct": 1,
      "feedback": [
        "Electron count is a separate property.",
        "Correct: isotopes share Z and differ in neutron count.",
        "Element identity depends on proton number."
      ],
      "hint": "Track Z, N, and electrons separately.",
      "teacher": "Ask students to distinguish exact nuclear counts from approximate chemical similarities."
    }
  },
  "transmutation": {
    "title": "Artificial Transmutation of Elements",
    "heading": "A nuclear reaction changes identity while closing the full ledger.",
    "subtitle": "Artificial Transmutation of Elements",
    "target": "A nuclear reaction changes identity while closing the full ledger.",
    "visual": "modern-transmutation",
    "paragraphs": [
      "Transmutation changes one element into another by changing the proton number of a nucleus. Natural radioactive decay can do this spontaneously. An induced reaction instead begins with an interaction involving an incoming particle or photon. Ordinary chemical reactions rearrange electrons and bonds; they do not ordinarily change nuclear proton counts.",
      "Rutherford’s early induced-transmutation experiment involved alpha particles interacting with nitrogen. One possible reaction is nitrogen-14 plus helium-4 producing oxygen-17 plus a proton. On the left, the nucleon count is 14 + 4 and charge is 7 + 2. On the right, the corresponding counts are 17 + 1 and 8 + 1. Both ledgers balance.",
      "Those two balances are necessary but insufficient. Energy and momentum must also balance, and the interaction must have a nonzero probability under the actual conditions. A mathematically balanced nuclear equation does not tell you how frequently it occurs. A reaction may need incoming kinetic energy, and competing channels may occur instead.",
      "The exploration highlights the total nucleon and charge counts in that historical reaction. It is an accounting diagram, not an experimental procedure. The newly produced oxygen has a different electronic structure after it exchanges energy and electrons with its surroundings. Nuclear identity changes first; the atom’s eventual ionization state is a separate matter.",
      "Induced reactions make radioactive tracers, support research, and have produced elements beyond uranium. Some transuranic nuclides also occur naturally in minute quantities, so produced artificially does not mean logically impossible in nature. Identify the incoming and outgoing particles, explain the changed element, and then state what evidence would be needed to establish the reaction’s rate or practical usefulness."
    ],
    "terms": [
      [
        "transmutation",
        "Change of one element into another through a change in nuclear proton number."
      ],
      [
        "induced reaction",
        "Nuclear reaction initiated by an incoming particle or radiation interaction."
      ],
      [
        "reaction channel",
        "A specified set of incoming and outgoing particles in a reaction."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Check nitrogen-14 + helium-4 → oxygen-17 + hydrogen-1 for nucleon count and charge.",
      "reasoning": "Nucleons: 14 + 4 = 17 + 1 = 18. Charge in units of e: 7 + 2 = 8 + 1 = 9. Energy and momentum require an additional check."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Balancing charge and nucleon number alone establishes…",
      "options": [
        "Two necessary conservation checks",
        "That the reaction must happen rapidly",
        "That no incoming energy is ever needed"
      ],
      "correct": 0,
      "feedback": [
        "Correct: other conditions and probabilities still matter.",
        "A balanced equation does not determine a rate.",
        "Energetics must be considered separately."
      ],
      "hint": "Separate bookkeeping from dynamics.",
      "teacher": "Ask students to explain why possible on paper does not mean observed in an experiment."
    }
  },
  "carbon": {
    "title": "Carbon Dating",
    "heading": "Use the decay clock only after checking what started it.",
    "subtitle": "Carbon Dating",
    "target": "Use the decay clock only after checking what started it.",
    "visual": "modern-carbon",
    "paragraphs": [
      "Carbon-14 forms mainly when neutrons produced by cosmic-ray interactions convert atmospheric nitrogen-14 into carbon-14. The carbon enters carbon dioxide and cycles through living systems. It later undergoes beta-minus decay back to nitrogen-14, emitting an electron and an electron antineutrino. The decay does not reverse the whole atmospheric production process particle by particle.",
      "While an organism exchanges carbon with its environment, its carbon isotope composition reflects that exchange. After exchange stops, its carbon-14 decreases relative to stable carbon. The clock therefore concerns cessation of exchange in the sampled material; it does not automatically date the manufacture of every object found nearby.",
      "For an ideal closed sample with known initial fraction, f = 2^(−t/T), where T is the half-life. Solving gives t = −T log₂f. A quarter of the initial carbon-14 corresponds to two half-lives. The classroom calculation uses the physical half-life of about 5730 years and is an uncalibrated decay age, not a laboratory radiocarbon report.",
      "Real dating requires corrections and evidence about the sample. Atmospheric carbon-14 has varied, organisms draw carbon from different reservoirs, and later contamination can add older or younger carbon. Calibration records connect measured radiocarbon to calendar dates. There is no universal percentage uncertainty that applies to every artifact and method.",
      "The exploration changes the surviving fraction and shows how the logarithmic age follows. Near the detection limit, a tiny measured amount is harder to distinguish from contamination and background. Zero detectable carbon-14 is therefore not an exact infinite age. Use the model to explain the principle, then state the closed-system, initial-composition, calibration, and measurement assumptions needed for a defensible date."
    ],
    "terms": [
      [
        "radiocarbon dating",
        "Inference of time since carbon exchange ceased using carbon-14 measurements and calibration."
      ],
      [
        "closed system",
        "System with no relevant material exchange over the interval being modeled."
      ],
      [
        "calibration",
        "Connection of a measurement or inferred scale to independently established reference information."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An ideal closed sample retains one-eighth of its initial carbon-14. Estimate its uncalibrated decay age.",
      "reasoning": "One-eighth is three successive halvings. The age is approximately 3 × 5730 = 17,190 years, before real-world calibration and sample corrections."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A carbon-14 age directly dates…",
      "options": [
        "Any metal object discovered beside the sample",
        "The formation of every mineral in the same region",
        "The modeled cessation of carbon exchange in the sampled material"
      ],
      "correct": 2,
      "feedback": [
        "Association needs separate archaeological evidence.",
        "Minerals generally require other isotope systems.",
        "Correct: the physical clock belongs to the carbon sample."
      ],
      "hint": "Identify which material carries the clock.",
      "teacher": "Ask students which assumption contamination would violate."
    },
    "references": [
      {
        "title": "NOAA · Radiocarbon decay",
        "url": "https://gml.noaa.gov/ccgg/isotopes/decay.html"
      }
    ]
  },
  "uranium": {
    "title": "Uranium Dating",
    "heading": "Combine a decay clock with a mineral’s history.",
    "subtitle": "Uranium Dating",
    "target": "Combine a decay clock with a mineral’s history.",
    "visual": "modern-geodate",
    "paragraphs": [
      "Long-lived radioactive systems can record geological time. Uranium-238 ultimately produces lead-206 through a decay chain, while uranium-235 ultimately produces lead-207. Their different decay constants provide two related clocks. These are distinct isotope systems, not a claim that all lead in a rock must have formed from its present uranium.",
      "For a simplified closed system, let P be the surviving parent count and D* the daughter count produced by decay since the clock started. If the initial radiogenic daughter count is zero and no parent or daughter has entered or left, P + D* equals the initial parent count. The ratio D*/P grows as the parent decays.",
      "With half-life T, the simplified age is t = T log₂(1 + D*/P). Equal parent and radiogenic daughter counts imply one half-life; three daughters per surviving parent imply two. The exploration uses a generic parent-to-stable-daughter model and a selectable time unit. Real uranium chains contain intermediate nuclides and require the appropriate isotope and chain treatment.",
      "Minerals are chosen because their chemistry and thermal history can help constrain the starting conditions. A date may record crystallization or later closure to diffusion, depending on the mineral and method. Initial lead, later lead loss, alteration, and mixing must be investigated. Two uranium–lead clocks that disagree can reveal a disturbed history rather than an arbitrary failure of radioactivity.",
      "Dating one mineral is not automatically dating Earth. Geological and meteoritic evidence together constrain planetary history. The practical reasoning is to connect the isotope measurement to a specific event and then test the assumptions about material exchange. A precise instrument reading cannot compensate for choosing the wrong physical history."
    ],
    "terms": [
      [
        "radiogenic daughter",
        "Daughter nuclide produced by radioactive decay."
      ],
      [
        "closure",
        "Conditions after which a mineral effectively retains the isotope system used for a date."
      ],
      [
        "parent–daughter ratio",
        "Comparison of surviving radioactive parent with its specified decay product."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "In an ideal closed clock, radiogenic daughter count is three times parent count. How many half-lives have passed?",
      "reasoning": "D*/P = 3 gives log₂(1 + 3) = 2 half-lives. Parent is one-quarter of the original total."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Why distinguish radiogenic daughter from all measured daughter?",
      "options": [
        "Daughter atoms have no measurable mass",
        "Some daughter may have been present initially or entered later",
        "All daughter isotopes are necessarily radioactive"
      ],
      "correct": 1,
      "feedback": [
        "Isotope measurements are possible; their history is the issue.",
        "Correct: the clock needs the daughter produced during the modeled interval.",
        "The final daughter may be stable."
      ],
      "hint": "Identify what the initial-condition assumption actually excludes.",
      "teacher": "Ask students to state the geological event and closed-system evidence behind an age."
    },
    "references": [
      {
        "title": "USGS · Radiometric time scale",
        "url": "https://pubs.usgs.gov/gip/geotime/radiometric.html"
      }
    ]
  },
  "tracers": {
    "title": "Radioactive Tracers",
    "heading": "A signal follows both material movement and nuclear decay.",
    "subtitle": "Radioactive Tracers",
    "target": "A signal follows both material movement and nuclear decay.",
    "visual": "modern-tracer",
    "paragraphs": [
      "A tracer is a detectable label used to follow material through a process. A radioactive isotope can act as a label because detectors can measure its emissions even when the amount is small. The isotope’s chemistry should closely represent the material being studied, while its radiation provides a distinguishable signal.",
      "In a plant study, a labeled nutrient can reveal where the nutrient travels. In medicine, a radiopharmaceutical can provide information about distribution and function. In industry, tracers can help investigate flow or wear. These examples share an inference problem: the measured signal depends on where the tracer is, how much remains radioactive, and how the detector responds.",
      "A falling signal does not necessarily mean that material has left a region. Radioactive decay also reduces activity. Conversely, increasing activity can reflect incoming tracer even while some nuclei decay. Detection efficiency, attenuation, background, and changing geometry can further affect recorded counts. A useful experiment therefore needs a model and calibration, not just a bright image.",
      "The exploration uses an ideal one-way two-compartment model. Tracer moves from A to B at a constant fractional rate, and radioactive decay acts in both compartments. The total surviving radioactive fraction falls only through decay; movement redistributes that surviving amount. The model excludes return flow, chemical differences, and detector effects.",
      "Choosing a tracer involves the purpose, time scale, detectability, and exposure considerations. Tiny or useful does not mean harmless by definition. Exposure to a radiation field also differs from incorporation of a radioactive label. Food irradiation, for example, treats food with radiation and is not an example of deliberately adding a tracer to it. Explain which process changes the label’s location and which changes its nuclear identity before interpreting a signal."
    ],
    "terms": [
      [
        "tracer",
        "Detectable label used to follow material through a process."
      ],
      [
        "compartment",
        "Region treated as internally mixed in a transfer model."
      ],
      [
        "activity",
        "Expected number of radioactive transformations per unit time."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Radioactive label disappears from compartment A but appears in B. Why is A’s decrease alone insufficient to measure decay?",
      "reasoning": "Transfer removes label from A without a nuclear transformation. Comparing both compartments helps separate movement from radioactive loss."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "In the ideal two-compartment model, transfer alone changes…",
      "options": [
        "Distribution but not the total number of surviving labels",
        "The nuclear decay constant",
        "The element identity of every label"
      ],
      "correct": 0,
      "feedback": [
        "Correct: moving a label is different from transforming its nucleus.",
        "Transfer rate and decay constant are separate parameters.",
        "Transport need not change nuclear identity."
      ],
      "hint": "Add the two compartments before explaining a loss.",
      "teacher": "Ask students what detector calibration would be needed to compare measured counts with model fractions."
    }
  },
  "fissionEvent": {
    "title": "Nuclear Fission",
    "heading": "Balance fragments and follow the released energy.",
    "subtitle": "Nuclear Fission",
    "target": "Balance fragments and follow the released energy.",
    "visual": "modern-fission",
    "paragraphs": [
      "Fission splits a heavy nucleus into smaller nuclear products. It can occur spontaneously for some nuclides or follow an interaction such as neutron absorption. The process involves competition between nuclear binding and electric repulsion as the nucleus changes shape; it is not simply an ordinary atom being cracked like a solid bead.",
      "One possible uranium-235 reaction begins with absorption of a neutron and produces barium-141, krypton-92, and three neutrons. The incoming nucleon count is 235 + 1; the outgoing count is 141 + 92 + 3. The proton counts also balance: 92 = 56 + 36. Other fragment combinations occur, so this equation is an example channel rather than a unique outcome.",
      "The products have a smaller total rest mass than the initial system for an energy-releasing channel. Their kinetic energy, emitted radiation, and later decay energy complete the energy account. Most of the prompt energy is carried by charged fragments, which transfer it to surrounding matter through interactions. Nucleons have not disappeared merely because the summed rest masses changed.",
      "Emitted neutrons may cause additional fissions, be absorbed in other reactions, or escape. A sustained chain depends on the overall balance of these possibilities. A controlled reactor maintains an appropriate balance while continuously removing heat. Critical means self-sustaining in this context; the word does not by itself describe an explosion.",
      "The exploration checks the charge and nucleon ledger for a selected reaction. It does not calculate multiplication, material amounts, or device geometry. Use the picture to explain conservation and energy transfer. Then connect it to the next sections, which distinguish isotope composition, controlled heat production, fuel conversion, and the continuing responsibilities created by radioactive products."
    ],
    "terms": [
      [
        "fission",
        "Division of a heavy nucleus into smaller nuclear products."
      ],
      [
        "fission fragment",
        "One of the smaller nuclei formed in a fission event."
      ],
      [
        "chain reaction",
        "Sequence in which products of one event induce further events."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Check the nucleon ledger for U-235 + n → Ba-141 + Kr-92 + 3n.",
      "reasoning": "The incoming total is 236 and outgoing total is 141 + 92 + 3 = 236. Charge balances as 92 = 56 + 36. Rest-energy differences can still produce kinetic energy."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Equal nucleon counts before and after mean…",
      "options": [
        "No energy can be released",
        "All possible fragment pairs have the same probability",
        "Nucleon number balances even if summed rest masses differ"
      ],
      "correct": 2,
      "feedback": [
        "Binding differences allow an energy release.",
        "Probabilities require nuclear dynamics and conditions.",
        "Correct: counting particles is different from adding rest energies."
      ],
      "hint": "Keep integer counts separate from mass measurements.",
      "teacher": "Ask students to trace the energy from the reaction products into surrounding material."
    }
  },
  "enrichment": {
    "title": "Uranium Enrichment",
    "heading": "Isotope composition can change while element identity stays fixed.",
    "subtitle": "Uranium Enrichment",
    "target": "Isotope composition can change while element identity stays fixed.",
    "visual": "modern-enrichment",
    "paragraphs": [
      "A sample of an element can contain several isotopes. Enrichment means increasing the fraction of a selected isotope in that sample. It does not mean increasing the proton count of individual nuclei or creating a new element. The total amount of material and its isotope fractions are separate quantities.",
      "Uranium-235 and uranium-238 both have 92 protons, while their neutron counts differ. Their nuclear responses are not identical: the probability of fission or capture depends on both isotope and neutron energy. Calling uranium-238 incapable of fission under all conditions would be incorrect. Nuclear behavior cannot be inferred solely from the similar chemistry of the two isotopes.",
      "Because isotopes share nuclear charge, their electronic chemistry is closely similar. Ordinary chemical separation is therefore not the same problem as separating two different elements. Isotope separation exploits physical differences related to mass or other isotope-dependent properties. The chapter’s historical discussion names industrial approaches; the important physics here is why isotope identity requires a different distinction from chemical element identity.",
      "Different reactor concepts use different fuel compositions and neutron conditions. Enrichment is not a universal prerequisite for every reactor: some designs use natural uranium. A statement about one reactor family must not silently become a claim about all fission systems. Fuel suitability involves an entire engineered system and its safeguards.",
      "The exploration compares three samples of stable hydrogen isotopes using abstract counts. It lets you calculate a fraction while holding the total count fixed. The illustration contains no uranium-processing conditions or separation procedure. Explain how the fraction can rise without any nucleus changing identity, then distinguish that sorting process from the transmutation studied in the preceding chapter."
    ],
    "terms": [
      [
        "enrichment",
        "Increase in the fraction of a selected isotope in a sample."
      ],
      [
        "isotope fraction",
        "Number of atoms of a specified isotope divided by the relevant total atom count."
      ],
      [
        "isotope separation",
        "Sorting isotopes by isotope-dependent physical properties."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A teaching sample contains two deuterium atoms among ten hydrogen atoms. Another contains four among ten. Compare the deuterium fractions.",
      "reasoning": "The fractions are 0.20 and 0.40. Both samples still consist of hydrogen isotopes; the comparison does not describe a nuclear transformation."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Enrichment necessarily changes…",
      "options": [
        "One element into a different element",
        "The relative isotope composition of a sample",
        "The proton count of every nucleus"
      ],
      "correct": 1,
      "feedback": [
        "Sorting isotopes does not itself change the element.",
        "Correct: composition is the defining change.",
        "Changing proton number is transmutation."
      ],
      "hint": "Distinguish a sample property from a property of one nucleus.",
      "teacher": "Ask students to explain why isotope separation and chemical separation pose different problems."
    }
  },
  "plutonium": {
    "title": "Plutonium",
    "heading": "Use nuclear identity and exposure pathways without oversimplifying risk.",
    "subtitle": "Plutonium",
    "target": "Use nuclear identity and exposure pathways without oversimplifying risk.",
    "visual": "modern-plutonium",
    "paragraphs": [
      "Plutonium is the element with atomic number 94. Uranium has atomic number 92, so plutonium is a different element, not a heavy uranium isotope. Different plutonium isotopes share the same proton number but have different neutron counts, decay properties, and nuclear responses.",
      "Neutron capture followed by radioactive transformations can change nuclear identity. Beta-minus decay increases the daughter nucleus’s proton number by one while emitting an electron and an electron antineutrino; the full event conserves charge. This general principle explains how nuclear reactions and decays can connect neighboring elements without any violation of the conservation laws studied earlier.",
      "Some plutonium isotopes can undergo fission after neutron absorption. Other applications use heat from radioactive decay rather than a self-sustaining fission chain. Those are different mechanisms of energy release. A material name alone therefore does not identify the isotope, the physical process, or the device’s purpose.",
      "Plutonium’s alpha radiation has a short range in matter, but inhaled or otherwise incorporated radioactive material can irradiate nearby tissue. The EPA describes lung injury and cancer concerns from inhaled plutonium particles. An insoluble compound should not be called biologically harmless simply because it does not dissolve readily; retention and exposure pathways matter. Nor does cell killing mean that cancer risk disappears.",
      "The exploration compares isotope identity cards and separates radioactive decay from induced fission. It is a classification model, not a fuel-processing or exposure calculation. A responsible explanation names the isotope, physical process, quantity, and pathway before comparing uses or risks. The same precision supports discussion of controlled energy production, material stewardship, and nonproliferation without treating all nuclear materials as interchangeable."
    ],
    "terms": [
      [
        "plutonium",
        "Chemical element with atomic number 94."
      ],
      [
        "transuranic element",
        "Element with atomic number greater than uranium’s 92."
      ],
      [
        "internal exposure",
        "Irradiation from radioactive material located within the body."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "How many neutrons are in Pu-239? Is it an isotope of uranium?",
      "reasoning": "Pu-239 has 239 − 94 = 145 neutrons. It is an isotope of plutonium; uranium has a different proton number."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Why does short alpha range not establish harmlessness?",
      "options": [
        "An internal source can deposit energy in nearby tissue",
        "Alpha particles have zero energy",
        "All radioactive materials behave like external sources"
      ],
      "correct": 0,
      "feedback": [
        "Correct: location and exposure pathway matter.",
        "Their deposited energy is the source of ionization.",
        "Internal incorporation changes the situation."
      ],
      "hint": "Locate the source relative to the absorbing tissue.",
      "teacher": "Ask students to distinguish element, isotope, energy mechanism, and exposure route."
    },
    "references": [
      {
        "title": "EPA · Plutonium",
        "url": "https://www.epa.gov/radiation/radionuclide-basics-plutonium"
      }
    ]
  },
  "breeder": {
    "title": "The Breeder Reactor",
    "heading": "Distinguish useful fuel conversion from creating matter or energy.",
    "subtitle": "The Breeder Reactor",
    "target": "Distinguish useful fuel conversion from creating matter or energy.",
    "visual": "modern-breeder",
    "paragraphs": [
      "A fertile nuclide can be transformed into a fissile nuclide through nuclear reactions and subsequent decays. Fissile describes a nuclide capable of sustaining a fission chain with suitable slow-neutron conditions. These terms describe nuclear behavior; they are not synonyms for stable, radioactive, or chemically reactive.",
      "A reactor can consume fissile nuclei through fission while other reactions create fissile nuclei from fertile material. A breeder is designed so that, over a specified account, more fissile material is produced than is consumed. The new fissile material comes from existing nuclei. It is not creation of matter from nothing or evidence that the plant produces unlimited energy.",
      "The exploration contrasts two bookkeeping questions: what supplies useful heat, and what changes the future fuel inventory? Fission releases energy; conversion changes which nuclides are present. A complete account includes all material streams, neutron absorption, radioactive products, processing needs, and losses. The diagram is qualitative and does not specify a design or an operating recipe.",
      "Fuel conversion can extend use of nuclear resources, but a favorable conversion account alone does not establish economic or environmental superiority. Construction, reliability, materials handling, waste, safeguards, and the broader energy system also matter. A claim about one proposed design is not automatically evidence about every design that uses the same general idea.",
      "Nuclear electricity has low direct greenhouse-gas emissions during operation, while its full life cycle includes mining, construction, fuel activities, and decommissioning. Comparisons should use consistent boundaries and measures for all energy sources. Ask whether a claim concerns fuel utilization, electrical output, cost, reliability, emissions, or material stewardship before deciding what evidence would support it. Better reasoning begins with naming the account being kept."
    ],
    "terms": [
      [
        "fertile nuclide",
        "Nuclide that can be converted into a fissile nuclide through nuclear reactions."
      ],
      [
        "fissile nuclide",
        "Nuclide capable of sustaining a fission chain with suitable slow-neutron conditions."
      ],
      [
        "breeder reactor",
        "Reactor designed to produce more fissile material than it consumes within a specified account."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A claim says a reactor can make more usable fissile material while producing heat. Does that violate conservation?",
      "reasoning": "No. Existing fertile nuclei are transformed into different nuclides while fission releases binding-energy differences. A full matter and energy account must still balance."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Fuel breeding means…",
      "options": [
        "Creation of matter without an input",
        "Automatic proof of lower cost than every alternative",
        "Conversion of existing nuclei into usable fissile material"
      ],
      "correct": 2,
      "feedback": [
        "Nuclei and energy must be accounted for.",
        "Economic claims require additional evidence and a common boundary.",
        "Correct: the inventory changes through nuclear transformations."
      ],
      "hint": "Separate a material inventory from an energy or cost account.",
      "teacher": "Ask students to identify the system boundary behind each benefit or drawback."
    }
  },
  "fusionControl": {
    "title": "Controlling Nuclear Fusion",
    "heading": "Confinement, fuel, and energy recovery are separate challenges.",
    "subtitle": "Controlling Nuclear Fusion",
    "target": "Confinement, fuel, and energy recovery are separate challenges.",
    "visual": "modern-confinement",
    "paragraphs": [
      "Fusion requires nuclei to reach conditions in which reactions occur often enough to matter. Temperature affects particle speeds, density affects encounter rates, and confinement determines how long the conditions persist. No single temperature guarantees useful net energy for every fuel and confinement approach.",
      "Magnetic confinement uses fields to influence charged-particle motion in a plasma. Motion around field lines helps explain why a field can restrict transport, but real plasma behavior also involves collective effects, collisions, instabilities, and losses. A magnetic field does not directly confine neutral neutrons produced by common fusion reactions. The hardware producing the field also has its own temperature and engineering limits.",
      "Inertial confinement instead compresses a small target so that reactions occur during a brief interval before it expands. External drivers deliver energy to the target. The 2022 National Ignition Facility milestone exceeded the laser energy delivered to the target; that boundary is different from all electrical input to the facility or useful electrical output.",
      "Fuel and materials create additional questions. Deuterium is available in water, while tritium is radioactive and scarce. Proposed deuterium–tritium power systems commonly investigate producing replacement tritium through interactions involving lithium. Energetic neutrons can damage and activate structural materials. Fusion therefore does not imply an absence of radioactive material or a solved waste problem.",
      "The exploration compares confinement principles, then connects them to an energy account. It deliberately avoids operating specifications. A successful reaction, a target energy gain, sustained operation, and net electricity are distinct achievements. Evaluate each with its own evidence and boundary. The scientific challenge is to turn a promising microscopic process into a reliable whole system, while acknowledging the engineering work that a simple reaction equation leaves out."
    ],
    "terms": [
      [
        "confinement",
        "Maintenance of particles and energy within the conditions needed for a process."
      ],
      [
        "inertial confinement",
        "Brief confinement of compressed fuel by its inertia before expansion."
      ],
      [
        "net electrical output",
        "Electrical energy delivered after subtracting the system’s electrical demands."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A target releases more fusion energy than the laser energy delivered to it. What further account is needed before claiming net electricity?",
      "reasoning": "Include the driver’s total electrical input, conversion of fusion heat to electricity, and all other facility demands. A target ratio alone does not close that account."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Which particles are directly bent by a magnetic Lorentz force?",
      "options": [
        "Every particle equally regardless of charge",
        "Moving charged particles with velocity across the field",
        "Neutral neutrons because they are massive"
      ],
      "correct": 1,
      "feedback": [
        "The effect is not independent of particle properties.",
        "Correct: charge and motion relative to the field determine that force.",
        "A neutral neutron has no electric charge for this Lorentz force."
      ],
      "hint": "Use q v × B and state what it does not describe.",
      "teacher": "Ask students to name which milestone a fusion claim actually establishes."
    },
    "references": [
      {
        "title": "DOE · Deuterium–tritium fusion fuel",
        "url": "https://www.energy.gov/science/doe-explainsdeuterium-tritium-fusion-fuel"
      },
      {
        "title": "DOE · 2022 ignition milestone",
        "url": "https://www.energy.gov/articles/doe-national-laboratory-makes-history-achieving-fusion-ignition"
      }
    ]
  }
} satisfies Record<string,LessonContent>
