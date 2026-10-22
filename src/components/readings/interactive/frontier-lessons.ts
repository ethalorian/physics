import type {LessonContent} from './lesson-contract'
export const frontierLessons = {
  "yukawa": {
    "title": "The Yukawa Particle and the Heisenberg Uncertainty Principle",
    "heading": "A mass scale can introduce a short interaction range.",
    "subtitle": "The Yukawa Particle and the Heisenberg Uncertainty Principle",
    "target": "A mass scale can introduce a short interaction range.",
    "visual": "frontier-yukawa",
    "paragraphs": [
      "Atomic nuclei present a puzzle: positive protons repel electrically, yet nuclei can remain bound. A short-range attractive interaction between nucleons helps explain the observation. Yukawa proposed that exchange of a massive particle could account for a characteristic range. Pions later provided an important effective description of the longer-range part of the nuclear interaction.",
      "A simple Yukawa potential has the form V(r) proportional to e^(−r/λ)/r. The length λ = ℏ/(mc) sets the exponential suppression scale. A larger exchanged-particle mass corresponds to a smaller λ. Using ℏc ≈ 197 MeV·fm and mc² ≈ 140 MeV gives a range scale near 1.4 fm, comparable to nuclear dimensions.",
      "The exploration plots only the exponential factor relative to the unscreened 1/r form. It therefore remains finite at r = 0, whereas the ideal potential itself has a 1/r singularity. The mass control is a mathematical parameter, not a claim that every selected mass corresponds to an observed particle. The plotted factor is not the force; force involves the derivative of the potential.",
      "Virtual particles are internal terms in a quantum-field calculation, not tiny projectiles temporarily exempt from conservation. Energy and momentum remain conserved in a complete process. The familiar phrase borrowing energy for a short time is a heuristic that can mislead; energy–time uncertainty does not license an energy-conservation violation.",
      "Pions are composite quark–antiquark particles. The fundamental strong interaction is quantum chromodynamics, mediated by gluons between color charges. Its residual effect between nucleons is more complicated than a single Yukawa potential. Use the model to connect a mass scale to a range scale while keeping the effective nuclear picture distinct from the underlying theory."
    ],
    "terms": [
      [
        "Yukawa potential",
        "Short-range potential with an exponential factor multiplying a 1/r dependence."
      ],
      [
        "range scale",
        "Characteristic distance over which an interaction term changes substantially."
      ],
      [
        "virtual particle",
        "Internal contribution in a quantum-field calculation, not an independently detected particle."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Compare exchange mass scales of 100 and 200 MeV/c² in the same Yukawa model.",
      "reasoning": "Because λ = ℏc/(mc²), doubling the mass halves the range scale. This is a model relationship, not evidence that either hypothetical particle exists."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Energy–time uncertainty permits…",
      "options": [
        "No violation of energy conservation in the complete process",
        "Unlimited energy borrowing if it is repaid",
        "A directly measured path for every virtual particle"
      ],
      "correct": 0,
      "feedback": [
        "Correct: uncertainty and conservation are different statements.",
        "That common phrase is not a physical permission to break conservation.",
        "Virtual lines in a calculation are not measured trajectories."
      ],
      "hint": "Separate a mathematical contribution from an observed intermediate object.",
      "teacher": "Ask students to identify whether a graph shows potential, force, or a relative suppression factor."
    }
  },
  "forces": {
    "title": "The Four Basic Forces",
    "heading": "Identify what interacts and which description applies.",
    "subtitle": "The Four Basic Forces",
    "target": "Identify what interacts and which description applies.",
    "visual": "frontier-forces",
    "paragraphs": [
      "The four established fundamental interactions are gravitational, electromagnetic, strong, and weak. Their names alone do not predict an outcome. A comparison must identify the particles, distance or energy scale, and physical process. Gravity dominates many astronomical systems even though its effect between individual elementary particles is extraordinarily small.",
      "Electromagnetism couples to electric charge and is described quantum mechanically using photons. At everyday scales, electric and magnetic fields provide an effective account. Neutral composite objects can still interact electromagnetically through their charged constituents, polarization, and magnetic moments. Neutral therefore does not always mean electromagnetically inactive.",
      "The strong interaction acts on color charge and is described by quantum chromodynamics. Quarks and gluons participate directly. Protons and neutrons are color-neutral composite objects, and a residual interaction binds nuclei. Although gluons are massless in the theory, confinement makes the strong interaction unlike an unrestricted inverse-square electromagnetic force between freely isolated charges.",
      "The weak interaction involves W and Z bosons and can change particle flavor. It is responsible for processes such as beta decay. Its short range is associated with the large masses of its carriers. Neutrinos participate in weak interactions and gravity, while their lack of electric charge makes ordinary detection difficult.",
      "General relativity describes gravity through spacetime geometry. A graviton is a hypothetical quantum description of gravitational excitations, not an experimentally confirmed particle. Gravity is absent from the Standard Model’s quantum account of the other three interactions. The exploration compares these categories without assigning one universal numerical strength ratio. Such ratios depend on what is compared, and the couplings themselves depend on energy scale."
    ],
    "terms": [
      [
        "fundamental interaction",
        "One of the established basic classes of physical interaction."
      ],
      [
        "gauge boson",
        "Quantum particle associated with the fields of a gauge interaction."
      ],
      [
        "color charge",
        "Quantum property that determines coupling to the strong interaction, unrelated to visible color."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Why can a neutron interact strongly even though its net electric charge is zero?",
      "reasoning": "Electric charge and color structure are different properties. A neutron is a composite of quarks and gluons and participates in strong interactions."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Which statement describes current theory accurately?",
      "options": [
        "A graviton has been detected like the photon",
        "Every neutral particle ignores every interaction",
        "Gravity is not included in the Standard Model"
      ],
      "correct": 2,
      "feedback": [
        "A graviton remains hypothetical.",
        "Neutrality refers to a specified charge, not all possible interactions.",
        "Correct: combining gravity with quantum theory remains an open challenge."
      ],
      "hint": "Name the interaction and relevant property of the object.",
      "teacher": "Ask students why a table of force names is not enough to predict a specific experiment."
    },
    "references": [
      {
        "title": "CERN · Standard Model",
        "url": "https://home.web.cern.ch/science/physics/standard-model/"
      }
    ]
  },
  "accelerators": {
    "title": "Accelerators Create Matter from Energy",
    "heading": "Useful collision energy depends on momentum as well as energy.",
    "subtitle": "Accelerators Create Matter from Energy",
    "target": "Useful collision energy depends on momentum as well as energy.",
    "visual": "frontier-collider",
    "paragraphs": [
      "Particle accelerators transfer energy to charged particles using electric fields. Magnetic fields steer and focus moving charges; the magnetic Lorentz force is perpendicular to velocity and does no work on a point charge. A real accelerator combines accelerating structures, magnets, timing, vacuum, and detectors to prepare and measure a beam.",
      "In a nonrelativistic cyclotron, a uniform magnetic field gives a circular frequency that is approximately independent of speed. As particles become relativistic, that approximation fails. Synchrotrons coordinate fields and accelerating phases as momentum changes. Increasing energy near light speed mainly increases momentum and total energy, rather than letting massive particles exceed c.",
      "A collision can create particles if the total energy, momentum, and other conserved quantities allow the final state. Energy is not a substance that becomes matter without an account. The energy available in the center-of-momentum frame is particularly useful because it removes motion of the system as a whole.",
      "The exploration compares equal-mass particles. For two opposite beams, each with total energy E, the center-of-momentum energy is 2E. For one particle of total energy E hitting an identical stationary target, it is √(2m²c⁴ + 2mc²E). Some laboratory energy in the second case must remain as motion of the combined system. These examples use the same projectile energy, not the same total machine energy budget.",
      "The calculation treats pointlike particles with proton rest energy as a scale. Real proton collisions involve constituent quarks and gluons that carry fractions of beam momentum, so the full proton–proton energy is not automatically available to one elementary subprocess. Crossing a threshold establishes energetic possibility, not a guaranteed production rate."
    ],
    "terms": [
      [
        "accelerator",
        "Device that increases charged-particle energy through electric-field work."
      ],
      [
        "center-of-momentum frame",
        "Frame in which the total momentum of the selected system is zero."
      ],
      [
        "invariant collision energy",
        "Total energy measured in the center-of-momentum frame."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Two identical particles move with equal and opposite momenta. What is their total momentum, and what does that imply for the frame?",
      "reasoning": "Their vector momenta add to zero. The laboratory is already the center-of-momentum frame, so the two total energies add directly there."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Why does a magnetic steering field not increase a point charge’s kinetic energy?",
      "options": [
        "Relativity forbids all acceleration",
        "Its force is perpendicular to the velocity",
        "Magnetic fields exert no force on moving charges"
      ],
      "correct": 1,
      "feedback": [
        "Electric fields can increase energy while speed remains below c.",
        "Correct: force dot velocity, the rate of work, is zero.",
        "Magnetic forces can change direction."
      ],
      "hint": "Separate changing direction from changing kinetic energy.",
      "teacher": "Ask students which energy boundary is being compared before calling a collider more efficient."
    }
  },
  "particles": {
    "title": "Particles, Patterns, and Conservation Laws",
    "heading": "A complete particle ledger includes what the detector misses.",
    "subtitle": "Particles, Patterns, and Conservation Laws",
    "target": "A complete particle ledger includes what the detector misses.",
    "visual": "frontier-particles",
    "paragraphs": [
      "Particle classification grew from patterns in masses, charges, lifetimes, and reaction products. Leptons include electrons, muons, taus, and their neutrinos. Hadrons are composite particles that participate in the strong interaction. Conventional baryons contain three valence quarks, while conventional mesons contain a valence quark–antiquark pair; additional multiquark hadrons are also known.",
      "Each particle has an antiparticle with the same mass and opposite additive quantum numbers where applicable. Some neutral particles are their own antiparticles, but electric neutrality alone does not establish that identity. An electron and positron can annihilate into photons. The photons remain physical particles carrying energy and momentum; calling them pure energy can obscure the conservation account.",
      "Charge and four-momentum must balance in every complete reaction. Baryon and lepton numbers provide further useful bookkeeping in familiar processes. Individual lepton flavor is not an exact universal conservation law: neutrino oscillations show that flavor states can change during propagation. Selection rules also depend on the interaction; for example, strangeness is conserved by strong processes but can change in weak decays.",
      "The exploration compares real weak-decay channels with their charge, baryon, and total lepton ledgers. A neutron beta decay includes an electron antineutrino, while a negative muon decay includes an electron, electron antineutrino, and muon neutrino. Missing neutral products can carry energy and momentum even when they leave no visible track.",
      "Passing the displayed ledger checks does not prove that an arbitrary channel occurs or give its rate. Energetics, angular momentum, interaction dynamics, and available phase space matter too. Nonobservation can mean forbidden, too rare, or experimentally inaccessible. Use conservation to rule out possibilities while respecting what it cannot establish by itself."
    ],
    "terms": [
      [
        "antiparticle",
        "Partner with the same mass and opposite relevant additive quantum numbers."
      ],
      [
        "hadron",
        "Composite particle built from quarks and gluons that participates in the strong interaction."
      ],
      [
        "lepton number",
        "Additive bookkeeping number assigning +1 to leptons and −1 to antileptons in the displayed processes."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Why must neutron beta decay include the antineutrino in a conservation account?",
      "reasoning": "It carries energy, momentum, and lepton number. Omitting it leaves an incomplete event even if the electron and proton are detected."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A balanced charge ledger proves…",
      "options": [
        "Charge conservation is satisfied, while further checks remain",
        "The reaction happens with high probability",
        "Undetected neutral particles are irrelevant"
      ],
      "correct": 0,
      "feedback": [
        "Correct: one necessary test is not a full dynamics calculation.",
        "Conservation does not determine reaction rate.",
        "Neutral particles can carry other conserved quantities."
      ],
      "hint": "Name the conserved quantity that each product carries.",
      "teacher": "Ask students to distinguish nonobservation from a demonstrated prohibition."
    }
  },
  "quarks": {
    "title": "Quarks: Is That All There Is?",
    "heading": "Add quantum numbers while keeping the composite structure in view.",
    "subtitle": "Quarks: Is That All There Is?",
    "target": "Add quantum numbers while keeping the composite structure in view.",
    "visual": "frontier-quarks",
    "paragraphs": [
      "The quark model organizes many hadrons using a small set of constituents. Six quark flavors are established: up, down, charm, strange, top, and bottom. Up-type quarks have electric charge +2e/3, and down-type quarks have −e/3. Antiquarks carry the opposite electric charge and opposite additive flavor quantum numbers.",
      "A proton has valence composition uud, giving charge +e. A neutron has udd, giving zero net charge. A positive pion has u and anti-d, also giving +e. Quarks each carry baryon number 1/3 and antiquarks −1/3, so a conventional three-quark baryon has baryon number one while a quark–antiquark meson has zero.",
      "Valence composition identifies important quantum numbers but is not a complete picture of everything inside a proton. Gluons and quark–antiquark contributions also matter, and much of the proton’s mass arises from strong-interaction dynamics rather than simply adding bare quark masses. Likewise, a proton’s spin is not fully explained by assigning three little classical spinning balls.",
      "Color is a strong-interaction quantum property, not visible color. Observable isolated hadrons are color-neutral states. Confinement prevents simply pulling an isolated quark out of a hadron; adding energy can produce additional hadrons instead. Jets provide evidence about underlying quarks and gluons, but their number is determined by the collision process, not always by the count of a proton’s valence quarks.",
      "The exploration sums charge and baryon number for selected valence compositions. It does not predict masses, lifetimes, spin couplings, or production probabilities. Modern observations include tetraquark and pentaquark candidates and states, so the traditional two- and three-constituent patterns are useful starting categories rather than an exhaustive list of all possible hadronic structure."
    ],
    "terms": [
      [
        "quark flavor",
        "Type of quark, such as up, down, or strange."
      ],
      [
        "valence quark",
        "Constituent used to specify a hadron’s net flavor and important quantum numbers."
      ],
      [
        "confinement",
        "Property preventing isolated color-charged quarks and gluons from appearing as free observed particles."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Add the charges and baryon numbers of an up quark and an anti-down quark.",
      "reasoning": "Charge is 2/3 + 1/3 = +1 in units of e. Baryon number is 1/3 − 1/3 = 0, consistent with a positive meson."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A neutron’s zero net charge implies…",
      "options": [
        "It contains no charged constituents",
        "It cannot have a magnetic moment",
        "Its constituent charges sum to zero"
      ],
      "correct": 2,
      "feedback": [
        "The udd composition contains charged quarks.",
        "Internal structure allows a magnetic moment.",
        "Correct: zero net charge need not mean no internal charge structure."
      ],
      "hint": "Distinguish a sum from the individual terms being summed.",
      "teacher": "Ask students what valence bookkeeping explains and what needs the full interacting theory."
    },
    "references": [
      {
        "title": "CERN · Standard Model",
        "url": "https://home.web.cern.ch/science/physics/standard-model/"
      }
    ]
  },
  "unification": {
    "title": "GUTs: The Unification of Forces",
    "heading": "Keep tested unification distinct from proposed extensions.",
    "subtitle": "GUTs: The Unification of Forces",
    "target": "Keep tested unification distinct from proposed extensions.",
    "visual": "frontier-unification",
    "paragraphs": [
      "Unification explains apparently different phenomena through a common framework. Electricity and magnetism became parts of electromagnetism. Electroweak theory connects electromagnetic and weak interactions, while quantum chromodynamics describes the strong interaction. Together with the Higgs sector, these form the Standard Model’s quantum account of known fundamental particles and three interactions.",
      "Electroweak theory predicted W and Z bosons with measurable properties, and their observation provided a demanding test. The Higgs boson was discovered at CERN in 2012. Its measured behavior supports the mechanism associated with electroweak symmetry breaking. The Higgs field contributes to elementary-particle masses, but it does not account for all the mass of ordinary composite matter by simply adding constituent masses.",
      "Interaction strengths depend on the energy scale at which they are probed. A grand unified theory proposes a common description of the strong and electroweak interactions at a higher scale. It does not automatically include gravity, and no experimentally established grand unified theory has replaced the Standard Model. A suggestive meeting of extrapolated curves is not by itself an observation.",
      "Some proposed extensions predict rare processes such as proton decay. A search with no candidate signal can constrain particular decay channels and model parameters. It does not prove that protons are absolutely stable or exclude every imaginable unification model. State the tested channel, sensitivity, background, and assumptions when interpreting a null result.",
      "The exploration separates measured milestones, a tested framework, and proposals needing further evidence. This is an evidence map, not a numerical prediction of coupling unification. A successful future theory must reproduce established observations in their domains and make additional testable predictions. Elegance and consistency guide theory building, while evidence determines whether the theory describes nature."
    ],
    "terms": [
      [
        "electroweak theory",
        "Unified quantum framework for electromagnetic and weak interactions."
      ],
      [
        "Standard Model",
        "Quantum framework for known elementary particles and strong, electromagnetic, and weak interactions."
      ],
      [
        "grand unified theory",
        "Proposed framework unifying strong and electroweak interactions at a higher scale."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A proton-decay search finds no convincing event. What is a justified conclusion?",
      "reasoning": "Within the search’s sensitivity and assumptions, the tested decay rate is constrained. The result does not prove infinite proton lifetime or rule out every extension of current theory."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Which claim is supported by established observations?",
      "options": [
        "Every grand unified model has been confirmed",
        "W, Z, and Higgs particles have been observed",
        "All four forces are already experimentally unified"
      ],
      "correct": 1,
      "feedback": [
        "Grand unification remains a proposal requiring evidence.",
        "Correct: those discoveries are measured milestones.",
        "Gravity remains outside the Standard Model."
      ],
      "hint": "Separate a measurement from an extrapolation.",
      "teacher": "Ask students to state one prediction that would distinguish two proposed theories."
    },
    "references": [
      {
        "title": "CERN · Higgs boson",
        "url": "https://home.cern/science/physics/higgs-boson/"
      }
    ]
  },
  "cosmology": {
    "title": "Cosmology and Particle Physics",
    "heading": "Use several independent traces of an expanding, cooling universe.",
    "subtitle": "Cosmology and Particle Physics",
    "target": "Use several independent traces of an expanding, cooling universe.",
    "visual": "frontier-expansion",
    "paragraphs": [
      "Cosmology studies the universe’s large-scale structure and evolution. Light from distant objects carries information from earlier times, but cosmological distance is not generally just light-travel time multiplied by c. Expansion changes distances during the journey, so astronomers specify which distance definition they use.",
      "The hot Big Bang model describes an earlier hotter, denser universe that expanded and cooled. It is not an explosion from one central point into pre-existing empty space. In an ideal homogeneous expansion, comoving observers all see the same large-scale relationship: more distant comoving objects have larger recession rates. Bound systems such as atoms and galaxies do not simply expand along with this ideal background.",
      "A scale factor a describes that expansion. For freely traveling light in the ideal cosmological model, 1 + z = a(observed)/a(emitted). At sufficiently small redshift, the Hubble–Lemaître relation gives an approximately linear connection between recession velocity and distance. Applying that low-redshift approximation indiscriminately to very distant objects would be incorrect.",
      "The cosmic microwave background has a nearly thermal spectrum at about 2.7 K, with small variations that carry information about early conditions. Light-element abundances and the distribution of galaxies supply additional tests. The strength of the cosmological model comes from comparing these independent observations, not from a single redshift graph.",
      "The exploration expands a comoving pattern and tracks the corresponding wavelength ratio. It does not solve an expansion history or determine the universe’s age. Particle physics enters because early temperatures allowed reactions and species that are rare today. Inflation and the origin of the matter–antimatter imbalance remain research questions; known symmetry violations are not, by themselves, a complete demonstrated explanation of the cosmic matter excess."
    ],
    "terms": [
      [
        "scale factor",
        "Quantity describing relative expansion of an ideal homogeneous universe."
      ],
      [
        "cosmological redshift",
        "Increase in light wavelength associated with expansion during its travel."
      ],
      [
        "cosmic microwave background",
        "Nearly thermal radiation carrying evidence of the early universe."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "The scale factor doubles while a photon travels between emission and observation. What is its redshift?",
      "reasoning": "Its wavelength doubles, so 1 + z = 2 and z = 1. This does not require assigning a simple special-relativistic Doppler velocity to the whole journey."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The hot Big Bang model describes…",
      "options": [
        "Expansion from an earlier hotter, denser state",
        "An explosion with Earth at its unique center",
        "Every bound atom growing at the cosmic expansion rate"
      ],
      "correct": 0,
      "feedback": [
        "Correct: it is a model of cosmic evolution.",
        "Homogeneous expansion has no special central observer.",
        "Bound systems need their own local dynamics."
      ],
      "hint": "Separate large-scale expansion from motion within a bound system.",
      "teacher": "Ask students to connect a model claim with at least two distinct observations."
    },
    "references": [
      {
        "title": "NASA · Cosmic history",
        "url": "https://science.nasa.gov/universe/overview/"
      }
    ]
  },
  "gravity": {
    "title": "General Relativity and Quantum Gravity",
    "heading": "Distinguish a tested gravitational prediction from a quantum-gravity proposal.",
    "subtitle": "General Relativity and Quantum Gravity",
    "target": "Distinguish a tested gravitational prediction from a quantum-gravity proposal.",
    "visual": "frontier-lensing",
    "paragraphs": [
      "General relativity connects matter and energy with spacetime geometry. Freely falling bodies and light follow paths determined by that geometry. The equivalence principle relates gravity and acceleration locally, over a sufficiently small region. Tidal effects can distinguish an extended gravitational field from a uniformly accelerating frame, so the equivalence must not be stated without its local qualification.",
      "Gravity can bend the apparent path of light even though photons have no rest mass. Gravitational lensing can magnify, distort, or produce multiple images of a background source. The exploration uses an ideal point-mass lens and a dimensionless angular source offset. Its two image positions satisfy the thin-lens equation; the diagram shows sky positions rather than a physical ray trajectory through a black hole.",
      "An event horizon is a causal boundary beyond which future-directed signals cannot reach distant observers. For an isolated nonrotating uncharged black hole, the Schwarzschild radius is 2GM/c². This formula is more than a classical escape-speed analogy: the horizon belongs to spacetime’s causal structure. Rotating black holes require a different detailed geometry.",
      "Gravitational waves were directly detected by LIGO in September 2015, with the discovery announced in 2016. Such observations test dynamical spacetime, complementing lensing and orbital evidence. They do not constitute detection of individual gravitons or proof of a complete quantum theory of gravity.",
      "Quantum gravity seeks a consistent description where quantum effects and gravity both matter. Hawking radiation is a theoretical prediction of quantum fields on curved spacetime; the cartoon of one member of a particle pair escaping is not its full derivation. Neither an established smallest time interval nor practical wormhole travel follows from the current evidence. Separate verified phenomena, theoretical predictions, and unresolved questions."
    ],
    "terms": [
      [
        "gravitational lensing",
        "Deflection of light by gravity that changes the apparent image of a source."
      ],
      [
        "event horizon",
        "Causal boundary beyond which signals cannot reach a specified distant exterior."
      ],
      [
        "quantum gravity",
        "Research toward a consistent description incorporating quantum physics and gravitation."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An ideal point lens gives two apparent images of one source. Does that require two physically separate source stars?",
      "reasoning": "No. Light from the same source can reach the observer along different paths. Spectra and correlated variations can help identify the images as related."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Direct gravitational-wave detection establishes…",
      "options": [
        "Detection of individual gravitons",
        "Proof of a practical time machine",
        "Evidence for propagating spacetime disturbances"
      ],
      "correct": 2,
      "feedback": [
        "A classical wave observation is not an individual-graviton measurement.",
        "The observation makes no such engineering claim.",
        "Correct: it tests a prediction of general relativity."
      ],
      "hint": "Match the observation to the claim it actually tests.",
      "teacher": "Ask students which assumptions the lens equation makes about the lens and source."
    },
    "references": [
      {
        "title": "LIGO · First detection",
        "url": "https://www.ligo.caltech.edu/detection"
      }
    ]
  },
  "strings": {
    "title": "Superstrings",
    "heading": "A mathematical analogy is useful only when its limits stay visible.",
    "subtitle": "Superstrings",
    "target": "A mathematical analogy is useful only when its limits stay visible.",
    "visual": "frontier-strings",
    "paragraphs": [
      "String theory explores the possibility that elementary particles arise as different excitations of extended one-dimensional objects. Some formulations include a massless spin-two excitation with the properties expected for a graviton. This motivates work on quantum gravity, but motivation and mathematical consistency are different from experimental confirmation.",
      "A familiar vibrating string offers a limited analogy. One object can support different modes, with different frequencies and node patterns. The exploration shows an ordinary fixed-end string with an integer mode number. It illustrates how one underlying system can have multiple excitations; it does not calculate the masses or properties of elementary particles.",
      "Superstring formulations involve additional mathematical structure, including supersymmetry and extra dimensions. In some descriptions, extra spatial dimensions are compact, so motion around them would be difficult to resolve at accessible scales. A quantum number should not simply be identified with an ordinary spatial direction, and a curled-up dimension is not a measured miniature loop inside every known particle.",
      "Connecting such a framework to the observed world requires specifying a concrete model and extracting distinguishable predictions. A large family of mathematical possibilities can make this difficult. An attractive explanation after the fact is less discriminating than a successful prediction that competing models did not also make.",
      "The status of a proposal should be stated with care. There is no established experimental detection of fundamental strings. Nor does this prove that every related mathematical idea is useless. The useful scientific question is what observations could support, constrain, or distinguish a particular proposal. At the frontier, honest uncertainty is part of the explanation rather than a gap to fill with an impressive picture."
    ],
    "terms": [
      [
        "string theory",
        "Framework exploring extended stringlike objects and their quantum excitations."
      ],
      [
        "compact dimension",
        "Spatial dimension with a finite wrapped extent in a mathematical model."
      ],
      [
        "testable prediction",
        "Specified observable consequence that can be compared with evidence."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A mechanical string has several vibration modes. Does observing those modes confirm fundamental string theory?",
      "reasoning": "No. It illustrates a shared mathematical idea, but the mechanical system is not a test of the proposed microscopic constituents of nature."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The mechanical-string illustration is…",
      "options": [
        "A calculation of the electron’s mass",
        "An analogy for multiple excitations of one system",
        "A measured picture of a fundamental string"
      ],
      "correct": 1,
      "feedback": [
        "Particle masses require a different and much more detailed theory.",
        "Correct: its scope is explicitly limited.",
        "The image is a classical teaching model."
      ],
      "hint": "Name which feature transfers and which does not.",
      "teacher": "Ask students to propose evidence that would distinguish a physical theory from a merely suggestive analogy."
    }
  },
  "dark": {
    "title": "Dark Matter and Closure",
    "heading": "Infer a mass distribution without confusing it with cosmic acceleration.",
    "subtitle": "Dark Matter and Closure",
    "target": "Infer a mass distribution without confusing it with cosmic acceleration.",
    "visual": "frontier-dark",
    "paragraphs": [
      "Galactic rotation and galaxy-cluster motions reveal gravitational effects that visible matter alone does not adequately explain in the standard account. Gravitational lensing and cosmological observations provide additional evidence. Dark matter names an inferred component whose microscopic identity remains unknown; it is not simply ordinary gas that happens to be faint in visible light.",
      "For a spherical mass distribution and a circular orbit, v² = GM(enclosed)/r. Outside a centrally concentrated mass, the enclosed mass becomes nearly constant and speed falls approximately as r^(−1/2). A roughly flat outer rotation curve instead suggests that enclosed mass continues to grow with radius over the measured region. Real galaxies have disks, gas, and uncertainties, so the spherical calculation is an instructive approximation.",
      "The exploration compares a concentrated visible component with an added extended halo in dimensionless units. The curves are synthetic, not observations. They show how a mass distribution affects a rotation prediction; they do not identify the dark-matter particle or prove that this one toy halo describes a particular galaxy.",
      "Neutrino oscillations establish differences between squared neutrino masses and imply that at least two neutrino mass states are nonzero. The known neutrinos contribute to cosmic matter, but cannot account for the dominant cold dark-matter component required by the standard cosmological picture. Proposed dark-matter candidates remain subjects of experiment rather than established new particles.",
      "Dark energy is a separate name for the component or physics associated with cosmic accelerated expansion. Spatial curvature, total energy density, and future expansion depend on the cosmological model and its contents. A flat spatial geometry does not alone settle the universe’s future fate when dark energy is included. Keep local mass inference, particle identity, and global expansion as connected but distinct questions."
    ],
    "terms": [
      [
        "dark matter",
        "Inferred gravitating component whose microscopic identity is not established."
      ],
      [
        "rotation curve",
        "Orbital speed as a function of distance from a galaxy’s center."
      ],
      [
        "dark energy",
        "Name for the component or physics associated with accelerated cosmic expansion."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "If circular speed stays approximately constant while orbital radius doubles in a spherical model, how does enclosed mass change?",
      "reasoning": "M = v²r/G, so enclosed mass doubles. This is a mass-distribution inference, not a particle-identification measurement."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Dark matter and dark energy are…",
      "options": [
        "Different concepts inferred from different aspects of cosmic behavior",
        "Two names for the same detected particle",
        "Both ordinary cold gas seen in x rays"
      ],
      "correct": 0,
      "feedback": [
        "Correct: gravitational structure and accelerated expansion pose different questions.",
        "Neither statement is established.",
        "Hot x-ray gas is ordinary matter and does not settle either question."
      ],
      "hint": "State which observation each concept helps explain.",
      "teacher": "Ask students to separate evidence for extra gravitation from a claim about its microscopic cause."
    },
    "references": [
      {
        "title": "NASA · Dark matter",
        "url": "https://science.nasa.gov/dark-matter/"
      },
      {
        "title": "NASA · Dark energy",
        "url": "https://science.nasa.gov/dark-energy/"
      }
    ]
  },
  "superconductors": {
    "title": "High-temperature Superconductors",
    "heading": "A zero-resistance state has conditions and additional signatures.",
    "subtitle": "High-temperature Superconductors",
    "target": "A zero-resistance state has conditions and additional signatures.",
    "visual": "frontier-superconductor",
    "paragraphs": [
      "A superconductor supports direct current without ordinary electrical resistance under appropriate conditions. Cooling below a critical temperature is part of the requirement, but magnetic field and current also have limits. A device can leave the superconducting state even while its temperature remains below the quoted zero-field critical temperature.",
      "The Meissner effect is another defining feature: magnetic flux is expelled from the bulk as a material enters the appropriate superconducting state. This is stronger evidence than simply measuring a very small resistance. Type-II materials can admit quantized vortices in a mixed state, and flux pinning helps explain some magnetic-levitation demonstrations. A simple perfect-diamagnet drawing does not describe every field regime.",
      "Conventional superconductivity is described by a collective quantum state involving paired electrons, with lattice vibrations providing the effective pairing interaction in the standard BCS account. Many high-temperature materials involve more complicated mechanisms. High temperature is a historical comparison with earlier superconductors; it does not automatically mean room temperature or ordinary pressure.",
      "The exploration uses an idealized resistivity transition for a hypothetical material. Its step is a teaching approximation; real transitions have finite widths and depend on sample quality and measurement conditions. The graph assumes sufficiently small current and field. It cannot establish a critical current, cooling cost, or practical wire performance.",
      "Applications include strong magnets, sensing, and electrical systems, but refrigeration, alternating-current losses, joints, fabrication, and stability still matter. Zero DC resistance in one material does not imply zero energy consumption for an entire installation. Extraordinary new-material claims require reproducible measurements, independent checks, and clearly specified pressure, temperature, and magnetic conditions. The exciting frontier is connecting a microscopic explanation to reliable, verifiable material behavior."
    ],
    "terms": [
      [
        "critical temperature",
        "Temperature marking a superconducting transition under specified conditions."
      ],
      [
        "Meissner effect",
        "Expulsion of magnetic flux from the bulk in the appropriate superconducting state."
      ],
      [
        "critical current",
        "Current limit beyond which a specified superconducting state or performance is lost."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A superconducting wire has zero DC resistance, but its cooling system draws power. Does the entire installation use zero power?",
      "reasoning": "No. The wire’s resistive dissipation and the installation’s total energy account have different boundaries. Cooling and other losses still matter."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A credible superconductivity claim needs…",
      "options": [
        "Only one unusually small resistance reading",
        "No information about temperature or pressure",
        "Reproducible electrical and magnetic evidence under stated conditions"
      ],
      "correct": 2,
      "feedback": [
        "A single reading can have alternative explanations.",
        "Conditions determine the claimed state.",
        "Correct: multiple signatures and reproducibility matter."
      ],
      "hint": "Distinguish a material property from whole-system performance.",
      "teacher": "Ask students to name an independent check of an apparent resistance transition."
    },
    "references": [
      {
        "title": "DOE · Superconductivity",
        "url": "https://www.energy.gov/science/doe-explainssuperconductivity"
      }
    ]
  },
  "questions": {
    "title": "Some Questions We Know to Ask",
    "heading": "Turn an open question into a comparison that evidence can decide.",
    "subtitle": "Some Questions We Know to Ask",
    "target": "Turn an open question into a comparison that evidence can decide.",
    "visual": "frontier-questions",
    "paragraphs": [
      "A good scientific question identifies what is unknown without discarding what is already established. Physics at the frontier builds on successful models and asks where their explanations are incomplete. The strongest next step is often a measurement that different explanations predict differently, rather than a search for one dramatic result that explains everything.",
      "On the largest scales, researchers investigate the nature of dark matter and dark energy, the formation of cosmic structures, and the growth of black holes. Observations connect multiple epochs and instruments. A mismatch can reveal new physics, but it can also reflect calibration, selection effects, or an incomplete model of ordinary astrophysical processes.",
      "At intermediate scales, collective behavior in materials raises questions about superconductivity, magnetism, transport, and nonequilibrium organization. Many interacting parts can produce simple large-scale patterns without every microscopic detail being directly observable. Connecting theory to a material requires choosing the relevant scale and measurable quantity.",
      "At the smallest scales, questions include neutrino masses, matter–antimatter asymmetry, possible particle substructure, and extensions of the Standard Model. Neutrino oscillation is established evidence, so asking whether neutrinos have any mass at all is no longer the same open question it once was. Questions evolve as results accumulate; historical textbook lists should be read in that light.",
      "The exploration pairs a question with a discriminating observation and an alternative explanation to check. Use it as a reasoning routine: state the claim, name the measurement, predict competing outcomes, and identify what would change your mind. A null result can still constrain a theory if the sensitivity and assumptions are explicit. Uncertainty should be quantified when possible, and an answer should never claim more than its evidence establishes."
    ],
    "terms": [
      [
        "null result",
        "Observation without the sought signal, interpreted relative to sensitivity and assumptions."
      ],
      [
        "systematic uncertainty",
        "Uncertainty associated with calibration, method, or other structured measurement effects."
      ],
      [
        "discriminating measurement",
        "Measurement whose possible outcomes differ between competing explanations."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A detector sees no signal predicted by one model. What information is needed to interpret that result?",
      "reasoning": "Specify the predicted signal size, detection efficiency, background, observation time, and uncertainty. The absence constrains the model only where the experiment could have detected the relevant signal."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The most useful next experiment often…",
      "options": [
        "Treats every unexplained result as a discovery",
        "Distinguishes competing predictions with stated uncertainty",
        "Repeats a claim without specifying an observable"
      ],
      "correct": 1,
      "feedback": [
        "Alternatives and measurement limitations must be checked.",
        "Correct: a discriminating test can change justified beliefs.",
        "A claim needs a measurable consequence."
      ],
      "hint": "Ask what result would count against the proposed explanation.",
      "teacher": "Have students write a question, two possible explanations, and a measurement that separates them."
    }
  }
} satisfies Record<string,LessonContent>
