import type {LessonContent} from './lesson-contract'
/** Original quantum and atomic physics adaptations with explicit domains and conventions. */
export const quantumLessons = {
  "quanta": {
    "title": "Quantization of Energy",
    "heading": "A smooth-looking spectrum can arise from discrete energy exchanges.",
    "subtitle": "Quantization of Energy",
    "target": "A smooth-looking spectrum can arise from discrete energy exchanges.",
    "visual": "quantum-steps",
    "paragraphs": [
      "A hot object emits radiation across a range of wavelengths. Increasing its absolute temperature raises the total emitted power and shifts the peak of its wavelength spectrum toward shorter wavelengths. Classical equipartition applied to all electromagnetic modes predicted an unphysical excess at high frequencies. Explaining the measured blackbody spectrum required a different account of energy exchange.",
      "Planck introduced energy steps proportional to oscillator frequency: ΔE = hf, where h is Planck’s constant. A historical oscillator ladder uses E = nhf for nonnegative integer n. The modern quantum harmonic oscillator includes a ground-state offset of hf/2, but adjacent steps still differ by hf. That distinction matters when comparing a historical model with a modern one; the diagram explicitly shows energy above the ground state.",
      "Energy quantization does not mean every photon or every particle in nature must have the same energy. An individual mode has a particular frequency; different modes have different spacings. A free particle can have a continuous range of kinetic energies. Bound atomic states instead have characteristic allowed energies, and those levels are generally not equally spaced.",
      "A gas can emit separated spectral lines because atomic transitions release photons whose energies match differences between allowed states. The lines reveal those differences rather than the absolute zero chosen for the atom’s energy. An atom does not release a fraction of a required transition energy merely because the source is dimmer.",
      "The exploration links an adjustable equally spaced ladder to the frequency-dependent energy step, while a thermal spectrum shows how a broad collection of modes can still produce a smooth distribution. These are complementary models with different purposes. At everyday energy scales, the tiny steps can be difficult to resolve; this explains why a continuous classical approximation often succeeds."
    ],
    "terms": [
      [
        "quantization",
        "Restriction of a physical quantity to specified discrete values in a particular system."
      ],
      [
        "energy quantum",
        "A discrete amount of energy exchanged in a process, such as hf for a photon."
      ],
      [
        "line spectrum",
        "Separated spectral features associated with particular transition energies."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An oscillator has frequency 5.0 × 10¹⁴ Hz. Find the energy change when its excitation increases by three steps.",
      "reasoning": "One step is hf ≈ 2.07 eV. Three steps add about 6.20 eV. The ground-state offset cancels when calculating this change."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "If oscillator frequency doubles, the separation of adjacent excitation levels…",
      "options": [
        "Doubles",
        "Stays the same",
        "Halves"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the step is hf.",
        "h is fixed, but the spacing also depends on frequency.",
        "Frequency and step energy are directly proportional."
      ],
      "hint": "Compare energy differences, not the arbitrary zero.",
      "teacher": "Ask students why a blackbody can have a continuous spectrum even though exchanges with each mode are quantized."
    }
  },
  "photo": {
    "title": "The Photoelectric Effect",
    "heading": "Brightness changes the number of opportunities; frequency sets energy per photon.",
    "subtitle": "The Photoelectric Effect",
    "target": "Brightness changes the number of opportunities; frequency sets energy per photon.",
    "visual": "quantum-photo",
    "paragraphs": [
      "In an external photoelectric experiment, light strikes a material and can eject electrons into a surrounding vacuum. An electric field collects some of those electrons, producing a measurable current. A reverse potential can stop even the most energetic emitted electrons. The stopping-potential magnitude therefore measures their maximum kinetic energy through Kmax = eVs.",
      "In the ordinary one-photon regime, an absorbed photon transfers energy hf. The material’s work function φ is the minimum energy needed to remove an electron from its surface. Energy conservation gives Kmax = hf − φ when emission is energetically possible. Below the threshold f₀ = φ/h, increasing brightness alone does not create single-photon emission. At the exact threshold the ideal maximum kinetic energy is zero; real surfaces and collection conditions complicate a measured current.",
      "Above threshold, increasing frequency raises the maximum kinetic energy. Increasing intensity at fixed frequency increases incident photon flux, so the emission rate can rise if collection and material response are unchanged. Real electrons have a distribution of energies, and quantum efficiency can depend on wavelength and the surface. The simple proportionality is conditional, not a universal statement that current depends on no other property.",
      "The exploration separates wavelength from incident photon rate. Its emitted rate assumes unit efficiency and complete collection, so it is an upper-limit illustration rather than a prediction for a particular metal. The work-function slider describes an idealized surface, not a set of measured materials.",
      "This model also has a regime: sufficiently intense fields can produce multiphoton and other nonlinear processes. Those effects do not invalidate the successful low-intensity account; they require a different calculation. Semiconductor photovoltaic devices involve charge separation inside a material and should not be pictured as metal surfaces ejecting their working electrons into the air."
    ],
    "terms": [
      [
        "work function",
        "Minimum energy needed to remove an electron from a material’s surface."
      ],
      [
        "threshold frequency",
        "Minimum photon frequency for the ideal single-photon photoelectric process."
      ],
      [
        "stopping potential",
        "Reverse potential magnitude that stops the most energetic photoelectrons."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A surface has work function 2.0 eV and absorbs 400 nm light. Find Kmax and the stopping-potential magnitude.",
      "reasoning": "The photon energy is approximately 1240/400 = 3.10 eV. Subtracting 2.0 eV gives 1.10 eV, corresponding to about 1.10 V."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At fixed above-threshold wavelength, doubling photon rate changes the ideal maximum electron energy by…",
      "options": [
        "A factor of two",
        "A factor of one-half",
        "No change"
      ],
      "correct": 2,
      "feedback": [
        "More photons can eject more electrons; they do not each become more energetic.",
        "The energy per photon is unchanged.",
        "Correct: each photon still supplies the same hf."
      ],
      "hint": "Separate energy per event from events per second.",
      "teacher": "Ask students to predict current and stopping voltage separately when intensity changes."
    }
  },
  "spectrum": {
    "title": "Photon Energies and the Electromagnetic Spectrum",
    "heading": "Use photon energy and total power to answer different questions.",
    "subtitle": "Photon Energies and the Electromagnetic Spectrum",
    "target": "Use photon energy and total power to answer different questions.",
    "visual": "quantum-photons",
    "paragraphs": [
      "For light in vacuum, E = hf = hc/λ. A shorter wavelength means a larger photon energy. Expressing the energy in electron volts is convenient: E in eV is approximately 1240 divided by λ in nanometers. An electron volt is an energy unit, equal to the energy gained by a charge of magnitude e through one volt; it is not a voltage.",
      "A monochromatic source of optical power P emits photons at rate Ṅ = P/E. Thus two sources with the same power can emit different numbers of photons per second. Higher-energy photons mean fewer photons at the same total energy rate. If an electrical device is only partly efficient at making light, use its optical output power rather than its electrical input.",
      "Whether a photon can excite or ionize a target depends on the target’s allowed states, threshold energies, and interaction probabilities. A sufficiently energetic photon can remove an electron, but energy alone does not guarantee absorption. Broad labels such as ultraviolet cover many energies and cannot replace a material-specific threshold. Non-ionizing radiation can still transfer substantial thermal energy at high power.",
      "X-ray tubes accelerate electrons through a potential difference. An electron starting nearly at rest gains kinetic energy eV. If one emitted photon receives that entire energy, its maximum energy is eV and its minimum wavelength is hc/(eV). Most photons carry less, and much of the input becomes heat. The source spectrum can contain both a continuous background and characteristic atomic lines.",
      "The spectrum slider spans many powers of ten, so equal slider movements represent equal wavelength ratios. The diagram compares energy per photon and photons per second without equating either quantity to biological risk. Absorbed dose, tissue, geometry, and exposure conditions matter; the reader does not rank safety from color or frequency alone."
    ],
    "terms": [
      [
        "photon flux",
        "Number of photons passing a specified surface per unit time, often also specified per unit area."
      ],
      [
        "electron volt",
        "Energy equal to 1.602176634 × 10⁻¹⁹ joule."
      ],
      [
        "ionization",
        "Removal of an electron from an atom or molecule, leaving an ion."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Compare 1.0 mW sources at 400 nm and 800 nm. Which emits more photons each second?",
      "reasoning": "At 800 nm each photon has half the energy of a 400 nm photon. Equal optical power therefore requires twice the photon rate at 800 nm."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "An electron accelerated through 40 kV can produce a single x-ray photon with at most…",
      "options": [
        "An unlimited energy if many electrons arrive",
        "40 keV",
        "40 eV"
      ],
      "correct": 1,
      "feedback": [
        "In this tube model each event is bounded by the incident electron’s energy.",
        "Correct: the maximum one-electron energy transfer is eV.",
        "A kilovolt gives a kiloelectron-volt per elementary charge."
      ],
      "hint": "Keep the energy per incident electron separate from the beam power.",
      "teacher": "Ask students to calculate both photon energy and rate, with units, before comparing sources."
    }
  },
  "photonMomentum": {
    "title": "Photon Momentum",
    "heading": "Light transfers momentum even though a photon has zero invariant mass.",
    "subtitle": "Photon Momentum",
    "target": "Light transfers momentum even though a photon has zero invariant mass.",
    "visual": "quantum-compton",
    "paragraphs": [
      "A photon in vacuum carries momentum magnitude p = h/λ = E/c in its direction of propagation. The massive-particle expression γmv should not be used by substituting m = 0 and v = c; that limiting expression is undefined. The energy–momentum relation directly gives E = pc for a massless photon.",
      "When an ideal stationary absorber receives a normally incident beam of power P, the momentum delivered per second gives force P/c. A perfect reflector approximately reverses each photon’s momentum and receives force 2P/c. These formulas assume negligible surface recoil speed and the stated geometry. A tilted or partially absorbing surface needs a vector momentum account.",
      "Compton scattering provides a microscopic test. For a photon scattered through angle θ by an initially stationary free electron, conservation of energy and momentum gives λ′ − λ = (h/mec)(1 − cos θ). The factor h/mec is the electron Compton wavelength, about 2.426 pm. The scattered photon loses energy for a nonzero angle, and the electron gains kinetic energy and recoil momentum.",
      "The wavelength change depends on angle in this ideal model; the fractional change and energy transfer also depend on the incident wavelength. Forward scattering has no wavelength change. Backward scattering has the maximum shift, twice the Compton wavelength. Bound-electron effects and other interactions require a fuller material model.",
      "The exploration shows the incoming and outgoing photon directions, together with the electron momentum needed to close the vector account. It is a momentum diagram drawn to a common scale, not a movie of trajectories or an electron orbit. The numerical energy check includes the electron’s rest energy, keeping the same conservation laws used for collisions at everyday scales."
    ],
    "terms": [
      [
        "photon momentum",
        "Momentum p = E/c = h/λ carried by a photon in vacuum."
      ],
      [
        "Compton scattering",
        "Scattering of a photon by an electron with energy and momentum transfer."
      ],
      [
        "radiation pressure",
        "Force per area due to momentum transferred by radiation."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A 10 pm photon scatters backward from a free electron initially at rest. Estimate its new wavelength.",
      "reasoning": "The maximum shift is 2 × 2.426 = 4.852 pm, so the scattered wavelength is 14.852 pm. The longer wavelength means lower photon energy."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "For the same incident beam, an ideal reflecting sail receives how much force compared with an absorbing sail?",
      "options": [
        "Twice as much",
        "The same",
        "Zero because photons have no mass"
      ],
      "correct": 0,
      "feedback": [
        "Correct: reversing momentum transfers twice the incident normal momentum.",
        "Absorption removes the forward photon momentum; reflection reverses it.",
        "Zero invariant mass does not imply zero momentum."
      ],
      "hint": "Draw the photon momentum before and after reflection.",
      "teacher": "Ask students to close the vector momentum diagram and check the energy lost by the photon against electron recoil."
    }
  },
  "duality": {
    "title": "The Particle-Wave Duality",
    "heading": "Individual detections build an interference distribution.",
    "subtitle": "The Particle-Wave Duality",
    "target": "Individual detections build an interference distribution.",
    "visual": "quantum-interference",
    "paragraphs": [
      "A detector can register light as separated events while the distribution of many events displays interference. Calling light wave-like or particle-like describes aspects of the evidence; it does not mean a photon alternates between a tiny classical ball and a water wave. Neither familiar picture supplies the complete quantum description.",
      "For two coherent alternatives that the apparatus does not distinguish, add probability amplitudes and then take the squared magnitude. The cross term produces bright and dark regions. When the alternatives become fully distinguishable through a path record in the apparatus or environment, the corresponding probabilities add without that interference term. A person does not have to look at the record for distinguishability to matter.",
      "Lowering the source rate until detections occur one at a time does not by itself erase interference. The experimental arrangement and coherence determine the distribution. Each ideal absorption event is localized, while the model predicts probabilities over many equally prepared trials. The distribution is not a set of predetermined classical paths inferred from a smooth curve.",
      "The graphic uses a Gaussian envelope multiplied by a two-path interference factor. Its visibility control represents the strength of the interference term; it does not separately simulate a particular path detector. Probabilities are normalized over the displayed detection window. Increasing the number of detections reveals the shape more clearly, but the example uses a repeatable synthetic sampling sequence rather than live experimental data.",
      "Look first at the predicted distribution, then at a small sample and a large sample. A sparse set can miss a bright region or put several detections close together. Such fluctuations are compatible with a probability model. A convincing comparison repeats the preparation and compares a distribution of outcomes, rather than explaining every individual dot after it appears."
    ],
    "terms": [
      [
        "probability amplitude",
        "A quantity whose squared magnitude determines probability and whose alternatives can interfere."
      ],
      [
        "coherence",
        "A stable phase relationship that permits a reproducible interference contribution."
      ],
      [
        "which-path information",
        "A physical record that can distinguish alternatives in an interference experiment."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A two-slit source is dimmed so only one photon at a time passes through the apparatus. Predict the long-run pattern if coherence and alignment stay unchanged.",
      "reasoning": "The arrival rate falls, but the normalized interference pattern remains. Individual localized detections gradually build the same probability distribution."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Interference is lost when a reliable path record exists because…",
      "options": [
        "A conscious observer decides to watch",
        "Each photon’s energy necessarily doubles",
        "The alternatives become distinguishable"
      ],
      "correct": 2,
      "feedback": [
        "The effect does not depend on human awareness.",
        "Path distinguishability is not an energy-doubling rule.",
        "Correct: the physical record changes which alternatives can interfere."
      ],
      "hint": "Separate information in the apparatus from a person reading it.",
      "teacher": "Ask students to distinguish a single observed detection from the probability distribution predicted before a trial."
    }
  },
  "matterWaves": {
    "title": "The Wave Nature of Matter",
    "heading": "Momentum sets matter wavelength.",
    "subtitle": "The Wave Nature of Matter",
    "target": "Momentum sets matter wavelength.",
    "visual": "quantum-matter",
    "paragraphs": [
      "De Broglie proposed that matter has wavelength λ = h/p. Electron diffraction from crystals, including the Davisson–Germer experiment, supported this relationship: the outgoing intensity had maxima and minima consistent with interference. The electron retains its charge and invariant mass; the wave description concerns its quantum state and the probabilities of measurement outcomes.",
      "For a nonrelativistic electron accelerated from rest through voltage V, energy conservation gives K = eV and momentum p ≈ √(2meK). Therefore λ ≈ h/√(2meeV). Doubling voltage does not halve wavelength; quadrupling it does in this approximation. At larger energies use relativistic momentum: pc = √[K(K + 2mec²)]. The exploration uses this latter expression, which approaches the classical one at low voltage.",
      "Regular crystal planes can reinforce scattered waves when 2d sin θ = nλ. Here d is the plane spacing and θ is measured from the planes, not from their normal. This Bragg relation is a simple geometric guide; detailed electron diffraction can involve multiple scattering and the crystal’s internal potential. A calculated sine greater than one means that order is unavailable for the specified geometry.",
      "Short wavelengths help electron microscopes resolve fine structure. A transmission instrument forms signals from electrons passing through a thin specimen; a scanning instrument builds an image from position-dependent signals generated as a focused beam scans. Actual resolution also depends on lenses, apertures, sample interactions, and instrument stability. It is not exactly one wavelength in every instrument.",
      "A ball also has a de Broglie wavelength, but its large momentum gives a fantastically small value. Short wavelength and loss of coherence help explain why a simple classical trajectory works in everyday settings. Macroscopic size is not a rule that deletes quantum mechanics; the relevant preparation, scales, and interactions matter."
    ],
    "terms": [
      [
        "de Broglie wavelength",
        "Wavelength λ = h/p associated with a particle’s momentum."
      ],
      [
        "electron diffraction",
        "Interference effects observed when electron waves scatter or pass through an aperture."
      ],
      [
        "Bragg condition",
        "Constructive interference condition 2d sin θ = nλ for waves scattered by parallel crystal planes."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An electron gains 100 eV from rest. Estimate its wavelength using the nonrelativistic approximation.",
      "reasoning": "Using h/√(2meK) gives about 0.123 nm. Raising the energy to 400 eV reduces the wavelength to about 0.0613 nm; relativistic corrections are tiny at these energies."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At low voltage, quadrupling electron accelerating voltage changes its wavelength by…",
      "options": [
        "A factor of two",
        "A factor of one-half",
        "A factor of one-quarter"
      ],
      "correct": 1,
      "feedback": [
        "Increasing kinetic energy shortens wavelength.",
        "Correct: momentum grows as the square root of voltage.",
        "The inverse dependence is on momentum, not directly on kinetic energy."
      ],
      "hint": "Combine K = eV with K = p²/(2m).",
      "teacher": "Ask students to test the low-energy approximation and name the angle convention before applying Bragg’s equation."
    }
  },
  "uncertainty": {
    "title": "Probability: The Heisenberg Uncertainty Principle",
    "heading": "A narrower position distribution requires a wider momentum distribution.",
    "subtitle": "Probability: The Heisenberg Uncertainty Principle",
    "target": "A narrower position distribution requires a wider momentum distribution.",
    "visual": "quantum-uncertainty",
    "paragraphs": [
      "A quantum state predicts a distribution of positions and a distribution of momenta for identically prepared systems. Their standard deviations obey σxσp ≥ ℏ/2, where ℏ = h/(2π). This is a property of the prepared state, not merely a statement that instruments are clumsy. Measurement error and measurement disturbance are related topics, but they are not interchangeable with these state spreads.",
      "A localized wave packet requires a range of wave numbers. Since p = ℏk, that range corresponds to a spread in momentum. A long, nearly sinusoidal wave can have narrowly specified momentum while remaining broadly distributed in position. The minimum product is reached by an appropriate Gaussian state; other states can have larger products.",
      "The two plots show normalized Gaussian position and momentum densities for that minimum-uncertainty case. The axes have separate physical units. Narrowing the position distribution widens the momentum distribution and keeps σxσp = ℏ/2. The control changes the prepared state, not the resolution of a simulated measuring device. Position and momentum are not being simultaneously assigned exact values to a single particle.",
      "Time–energy relations require extra care because time is a parameter in ordinary quantum mechanics, rather than the same kind of observable as position. A short-lived exponentially decaying state has a broadened spectral line: for that ideal decay model the energy full width at half maximum is Γ = ℏ/τ, with τ the population lifetime. Different definitions of spread and characteristic time lead to different relations. Label the quantities before using a numerical factor.",
      "Uncertainty does not grant permission to violate energy conservation or borrow energy for a short time. A finite spectral width describes the state and its preparation or decay. Include the complete system when making an energy account. Probability limits a prediction of individual results; it still makes precise, testable claims about repeated trials."
    ],
    "terms": [
      [
        "uncertainty relation",
        "A bound on the spreads of specified observables in a quantum state."
      ],
      [
        "standard deviation",
        "A measure of spread about a distribution’s mean."
      ],
      [
        "spectral linewidth",
        "A specified width of a spectral feature, such as its full width at half maximum."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A minimum-uncertainty electron state has σx = 0.10 nm. Find σp and the nonrelativistic velocity spread.",
      "reasoning": "σp = ℏ/(2σx) ≈ 5.27 × 10⁻²⁵ kg·m/s. Dividing by electron mass gives σv ≈ 5.79 × 10⁵ m/s. This is a spread, not the electron’s known velocity."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Halving σx in a minimum-uncertainty Gaussian state changes σp by…",
      "options": [
        "A factor of two",
        "No change",
        "A factor of one-half"
      ],
      "correct": 0,
      "feedback": [
        "Correct: their product remains ℏ/2.",
        "A narrower state cannot keep both minimum spreads unchanged.",
        "Both cannot shrink together below the bound."
      ],
      "hint": "Use the product of the two state spreads.",
      "teacher": "Ask students to distinguish a distribution width, an instrument error, and the mean value."
    },
    "references": [
      {
        "title": "Feynman Lectures · Wave packets and the uncertainty relation",
        "url": "https://www.feynmanlectures.caltech.edu/III_02.html"
      }
    ]
  },
  "review": {
    "title": "The Particle-Wave Duality Reviewed",
    "heading": "Use one momentum relation while respecting different energy relations.",
    "subtitle": "The Particle-Wave Duality Reviewed",
    "target": "Use one momentum relation while respecting different energy relations.",
    "visual": "quantum-compare",
    "paragraphs": [
      "Photons and electrons can both produce localized detections and interference distributions. For either, λ = h/p connects wavelength with momentum magnitude. Equal wavelengths therefore mean equal momenta, but they do not imply equal speeds, equal kinetic energies, or equal interactions with a detector.",
      "For a photon in vacuum, E = pc and its speed is c. For an electron, total energy obeys E² = (pc)² + (mec²)², and kinetic energy is the total minus mec². When p is small compared with mec, K ≈ p²/(2me). Thus an electron and a visible photon with the same momentum can have very different kinetic or photon energies. Do not subtract rest energy from a photon or apply p = mv to it.",
      "What counts as wave evidence also needs a precise statement. An interference pattern concerns probabilities across repeated preparations. A localized detection concerns one interaction. These statements can describe different aspects of the same experiment without forcing the object into a classical label. Energy quantization, diffraction, and uncertainty solve related but distinct questions.",
      "The comparison lets you choose a common wavelength and examine momentum, photon energy, and electron kinetic energy side by side. It assumes a free electron and light in vacuum. The low-energy electron expression is shown alongside the relativistic calculation so you can judge when its approximation is adequate.",
      "To solve a combined problem, identify the object, the preparation, and the measured quantity. Use conservation laws to determine energy or momentum transfer, use the appropriate energy relation, then connect momentum to wavelength. Check whether a bound-state restriction, threshold, or loss of coherence matters. No single word such as quantum substitutes for that reasoning chain."
    ],
    "terms": [
      [
        "correspondence principle",
        "Recovery of successful classical predictions in the appropriate quantum limits."
      ],
      [
        "matter wave",
        "A wave description of a material particle’s quantum state."
      ],
      [
        "kinetic energy",
        "Energy associated with motion; for a free massive particle, total energy minus rest energy."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A photon and an electron both have wavelength 500 nm. Which has larger photon or kinetic energy?",
      "reasoning": "Both have momentum about 1.33 × 10⁻²⁷ kg·m/s. The photon has about 2.48 eV; the electron has kinetic energy about 6.02 × 10⁻⁶ eV. Equal momentum is not equal energy."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Equal de Broglie wavelength guarantees equal…",
      "options": [
        "Speed",
        "Kinetic energy",
        "Momentum magnitude"
      ],
      "correct": 2,
      "feedback": [
        "The speed–momentum relationship depends on invariant mass.",
        "The energy–momentum relationship differs for a photon and electron.",
        "Correct: p = h/λ applies to both objects."
      ],
      "hint": "Start with the relationship that is shared, then use the appropriate energy model.",
      "teacher": "Ask students to connect two different experimental observations without treating wave and particle as exclusive identities."
    }
  },
  "atoms": {
    "title": "Discovery of the Atom",
    "heading": "Several independent measurements support the atomic model.",
    "subtitle": "Discovery of the Atom",
    "target": "Several independent measurements support the atomic model.",
    "visual": "quantum-atom-evidence",
    "paragraphs": [
      "The atomic idea became a physical theory through measurements that could distinguish it from alternatives. Chemical compounds form in definite proportions. Gas pressure and temperature can be explained through particle motion. Brownian motion provides an additional connection between an observable suspended particle and much smaller constituents of the surrounding fluid.",
      "A visible grain does not show every molecular collision. Its irregular motion reflects fluctuations in many impacts and drag from the fluid. Repeating the experiment on many comparable grains produces a predictable distribution even though an individual path is irregular. In a simple one-dimensional diffusion model, the mean squared displacement is 2Dt, where D is the diffusion coefficient and t is elapsed time.",
      "The root-mean-square displacement therefore grows as √t rather than t. This differs from motion at a constant velocity. Temperature, viscosity, particle size, boundaries, and observation interval matter when comparing a real suspension with the ideal model. The illustration displays a synthetic walk and the ensemble scaling rule; it does not claim that one trajectory must equal an ensemble average.",
      "Modern scanning probe instruments add different evidence by measuring interactions near a surface. A scanning tunneling microscope maps a signal related to electron tunneling and the surface’s electronic structure. Its atom-scale image is a calibrated measurement rendered visually, not a visible-light photograph of little hard spheres. Such observations complement earlier chemical and mechanical evidence.",
      "An atom has a small positively charged nucleus and surrounding electrons. Its atomic number counts protons and identifies the element; a neutral atom has the same number of electrons. Isotopes share proton number but differ in neutron number, and ions differ in net charge. Atomic identity, charge state, and isotope are separate labels supported by different measurements."
    ],
    "terms": [
      [
        "Brownian motion",
        "Irregular motion of suspended particles arising from fluctuations in molecular interactions with the fluid."
      ],
      [
        "diffusion coefficient",
        "The parameter D setting the growth of mean squared displacement in a diffusion model."
      ],
      [
        "atomic number",
        "Number of protons in an atomic nucleus."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "In one-dimensional diffusion with D = 0.50 μm²/s, compare root-mean-square displacements after 1 s and 4 s.",
      "reasoning": "They are √(2 × 0.50 × 1) = 1 μm and √(2 × 0.50 × 4) = 2 μm. Four times the time gives twice the RMS displacement."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Why does one irregular particle path not contradict a predictable diffusion law?",
      "options": [
        "Diffusion requires constant speed in one direction",
        "The law describes an ensemble distribution",
        "Every particle follows the same hidden drawn path"
      ],
      "correct": 1,
      "feedback": [
        "Constant directed motion gives a different displacement scaling.",
        "Correct: individual outcomes fluctuate while ensemble statistics can be reproducible.",
        "The model does not prescribe an identical trajectory for every particle."
      ],
      "hint": "Separate a single trial from a repeated-trial statistic.",
      "teacher": "Ask students to connect an observable signal to an atomic claim and identify what the instrument actually measures."
    }
  },
  "parts": {
    "title": "Discovery of the Parts of the Atom: Electrons and Nuclei",
    "heading": "Different experiments isolate charge, mass, and concentrated positive charge.",
    "subtitle": "Discovery of the Parts of the Atom: Electrons and Nuclei",
    "target": "Different experiments isolate charge, mass, and concentrated positive charge.",
    "visual": "quantum-parts",
    "paragraphs": [
      "Cathode-ray experiments showed that atoms contain negatively charged constituents. Deflection in electric and magnetic fields allowed a charge-to-mass ratio to be inferred. With crossed fields adjusted to cancel the transverse force, the selected speed is v = E/B. With a magnetic field alone and perpendicular motion, the nonrelativistic curvature gives |q|/m = v/(Br).",
      "A ratio does not separately determine charge and mass. Millikan’s oil-drop experiment supplied a charge measurement. In a simplified stationary-drop balance, electric force offsets effective weight: |q|E = Weffective. Real analysis includes buoyancy, viscous drag when determining drop size, and calibration. Charges appeared in integer multiples of a common elementary charge. Combining this charge with the measured ratio gives electron mass.",
      "The gold-foil scattering experiment probed a different feature. Most energetic alpha particles were only slightly deflected, while a small fraction turned through large angles. Geiger and Marsden’s observations, interpreted by Rutherford, supported positive charge and most atomic mass concentrated in a small nucleus. Large deflections arise from the Coulomb interaction; a particle does not have to strike a hard nuclear surface.",
      "For a heavy stationary nucleus in the classical point-charge approximation, the scattering angle increases as impact parameter decreases. The exploration compares selected encounters using that relationship. It is not a plot of the fraction scattered to each angle, nor does it include electron screening, nuclear recoil, finite nuclear size, or the strong interaction.",
      "The nuclear model was a major advance, but classical orbiting electrons would radiate and lose energy. Atomic stability and line spectra therefore required more than a miniature solar-system analogy. Later quantum models describe stationary states and probability distributions. The nucleus and electron are supported by evidence even when the earliest picture of their motion must be replaced."
    ],
    "terms": [
      [
        "charge-to-mass ratio",
        "Electric charge divided by mass, inferred from a particle’s response to fields."
      ],
      [
        "impact parameter",
        "Perpendicular offset of the incoming asymptotic path from a scattering center."
      ],
      [
        "nuclear model",
        "Atomic description with positive charge and most mass concentrated in a small nucleus."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An electron beam has speed 2.0 × 10⁶ m/s in a perpendicular 1.0 mT field and radius 11.4 mm. Estimate |q|/m.",
      "reasoning": "v/(Br) = 2.0 × 10⁶ /(0.0010 × 0.0114) ≈ 1.75 × 10¹¹ C/kg. A separate charge measurement is needed to infer mass."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Rare large alpha-particle deflections most directly supported…",
      "options": [
        "Concentrated positive charge in a small region",
        "Positive charge spread evenly through the whole atom",
        "A unique classical electron orbit"
      ],
      "correct": 0,
      "feedback": [
        "Correct: concentrated charge can produce a strong deflection in a close encounter.",
        "Diffuse positive charge did not explain the observed large-angle events.",
        "Scattering did not establish a specific stable electron orbit."
      ],
      "hint": "Connect the surprising observation to the feature of the model it tests.",
      "teacher": "Ask students which experimental result determines a ratio and which supplies the missing independent quantity."
    }
  },
  "bohr": {
    "title": "Bohr’s Theory of the Hydrogen Atom",
    "heading": "Spectral photons measure differences between bound-state energies.",
    "subtitle": "Bohr’s Theory of the Hydrogen Atom",
    "target": "Spectral photons measure differences between bound-state energies.",
    "visual": "quantum-levels",
    "paragraphs": [
      "Hydrogen’s separated spectral lines were known before their physical explanation. Bohr combined a nuclear atom with new restrictions: certain stationary states were allowed, and emission or absorption connected their energy differences with hf. The model predicted the main hydrogen spectrum even though its picture of definite circular electron paths is not the modern quantum description.",
      "For a hydrogen-like ion with one electron and nuclear charge Ze, the simple nonrelativistic model gives En = −13.6Z²/n² eV and rn = a₀n²/Z, where n is a positive integer and a₀ ≈ 0.0529 nm. The energy zero is the separated electron and nucleus at rest. Negative energy means bound, not negative kinetic energy. Finite nuclear mass and finer interactions produce corrections to these rounded formulas.",
      "A downward transition emits photon energy Ei − Ef; an upward transition requires energy input. The Lyman series ends at n = 1, the Balmer series at n = 2, and the Paschen series at n = 3. A series shares its lower state, while its upper states vary. The lines crowd together as the upper state approaches the ionization limit.",
      "The level diagram places energy on the vertical axis. Its lines are not rings at different distances from the nucleus. The transition arrow marks an energy change, not a tracked electron journey. This model shows the energy differences between principal levels without claiming that every possible pair is an equally probable optical transition; selection rules and state populations determine actual strengths.",
      "The model succeeds for hydrogen-like energies and scaling but fails as a general treatment of multi-electron atoms and fine structure. Quantum orbitals replace definite paths. In particular, the hydrogen ground state has orbital angular momentum zero, unlike Bohr’s circular-orbit assignment. Retain the useful energy predictions while keeping that limitation explicit."
    ],
    "terms": [
      [
        "ground state",
        "Lowest-energy state of a system."
      ],
      [
        "excited state",
        "An allowed state with energy above the ground state."
      ],
      [
        "ionization energy",
        "Energy needed to remove a bound electron to the specified free-state reference."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "For hydrogen, calculate the photon emitted in a transition from n = 3 to n = 2.",
      "reasoning": "E3 ≈ −1.511 eV and E2 = −3.400 eV. Their difference is about 1.889 eV, giving λ ≈ 656 nm in the rounded model."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "How much energy ionizes hydrogen initially in n = 2?",
      "options": [
        "13.6 eV",
        "Zero because its energy is negative",
        "3.4 eV"
      ],
      "correct": 2,
      "feedback": [
        "13.6 eV applies to the ground state.",
        "Negative bound energy means energy must be supplied to reach the continuum.",
        "Correct: the required increase is from −3.4 eV to the zero-energy continuum boundary."
      ],
      "hint": "Identify the starting level and the chosen zero.",
      "teacher": "Ask students to distinguish an energy-level diagram from a spatial orbit drawing."
    }
  },
  "xray": {
    "title": "X Rays: Atomic Origins and Applications",
    "heading": "The voltage sets a cutoff; the target sets characteristic lines.",
    "subtitle": "X Rays: Atomic Origins and Applications",
    "target": "The voltage sets a cutoff; the target sets characteristic lines.",
    "visual": "quantum-xray",
    "paragraphs": [
      "An x-ray tube converts part of an accelerated electron beam’s energy into radiation when the electrons interact with a target. Deceleration in the target produces a continuous bremsstrahlung spectrum. A separate process can remove an inner-shell electron; when another electron fills that vacancy, the atom may emit a characteristic x ray whose energy is the difference between its states.",
      "The maximum photon energy from an electron accelerated from rest is eV. Thus a 60 kV tube has an ideal endpoint of 60 keV and a minimum wavelength of about 0.0207 nm. Increasing current mainly increases the number of incident electrons and radiation output at fixed voltage, while increasing voltage changes the available energy range. The detailed spectrum also depends on the target and filtration.",
      "Characteristic lines have element-specific energies. A Kα line involves a transition into a K-shell vacancy from the next shell; a Kβ line comes from a higher shell. Enough incident energy is needed to create the vacancy. A simple screened hydrogen-like estimate can explain rough scaling with nuclear charge, but measured multi-electron energies are required for accurate material identification.",
      "The illustrative spectrum uses a normalized schematic continuum and two explicitly fictional target lines. Their heights are not measured yields. Raising the voltage extends the endpoint; it does not continuously slide the target’s characteristic energies. The model also distinguishes the vacancy-creation threshold from the energy of the emitted line.",
      "Medical radiographs use differences in transmission through tissues. CT combines projections from many directions to reconstruct slices. Contrast depends on photon energy, composition, and thickness rather than density alone. These methods involve ionizing radiation; their clinical use weighs the diagnostic benefit against exposure and optimizes the examination. The exploration is a physics explanation, not an imaging setting or medical recommendation."
    ],
    "terms": [
      [
        "bremsstrahlung",
        "Radiation emitted when a charged particle is accelerated or decelerated, producing a continuous x-ray background in a tube."
      ],
      [
        "characteristic x ray",
        "Photon emitted in an atomic transition involving an inner-shell vacancy."
      ],
      [
        "computed tomography",
        "Reconstruction of internal slices from multiple projection measurements."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A target has a 20 keV inner-shell binding energy and emits a 17 keV characteristic line after a suitable vacancy is made. Can 18 keV incident electrons create that vacancy?",
      "reasoning": "No. The photon energy is a difference between levels, while making the vacancy requires at least the 20 keV binding energy in this ideal example."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At fixed target composition, raising tube voltage above threshold mainly shifts…",
      "options": [
        "The elementary charge",
        "The continuum endpoint",
        "Every characteristic line to the new endpoint"
      ],
      "correct": 1,
      "feedback": [
        "Elementary charge is unchanged.",
        "Correct: the maximum energy tracks eV.",
        "The target’s level differences set line positions."
      ],
      "hint": "Separate the energy available to create a vacancy from the energy released when it is filled.",
      "teacher": "Ask students why a line position identifies the target while its appearance also depends on excitation conditions."
    },
    "references": [
      {
        "title": "FDA · Medical x-ray imaging",
        "url": "https://www.fda.gov/radiation-emitting-products/medical-imaging/medical-x-ray-imaging"
      }
    ]
  },
  "excitation": {
    "title": "Applications of Atomic Excitations and De-Excitations",
    "heading": "Track the energy source, the transition, and the emitted light.",
    "subtitle": "Applications of Atomic Excitations and De-Excitations",
    "target": "Track the energy source, the transition, and the emitted light.",
    "visual": "quantum-excitation",
    "paragraphs": [
      "Atoms, molecules, and solids can absorb energy and later emit light. The input might be a photon, an electrical discharge, or another interaction. Emission energies depend on available states and transition rules. A complete energy account includes light, internal energy changes, and energy transferred to the surroundings.",
      "In ordinary fluorescence, optical excitation is followed by relatively prompt emission, often at a longer wavelength after some energy is transferred to the material. Phosphorescence involves longer-lived states and delayed light. A metastable state has a comparatively long lifetime because available transitions are inhibited. These processes do not make energy from nothing, and not every fluorescent material requires ultraviolet excitation.",
      "Stimulated emission occurs when an incident field induces an excited system to emit into the same radiation mode. It competes with absorption. In a simple model with equal statistical weights, more systems in the upper lasing level than the lower produce population inversion and allow net stimulated gain. Inversion concerns the two relevant levels; it need not mean that most atoms occupy a particular state relative to every other state combined.",
      "A laser adds pumping, a gain medium, and usually optical feedback. Useful output requires gain sufficient to overcome losses. The model compares absorption and stimulated emission for a fixed pair of equally weighted levels; it does not model saturation or claim that positive small-signal gain alone guarantees lasing. Real lasers can have finite linewidth, multiple modes, and diffraction.",
      "Coherent light also helps record holograms. Interference between reference and object fields encodes information about their relative phase; illumination can reconstruct an outgoing wavefront by diffraction. A photograph of intensity alone does not preserve that same information. The linked exploration revisits this connection between an atomic light source and the earlier wave-optics chapter."
    ],
    "terms": [
      [
        "fluorescence",
        "Relatively prompt light emission following excitation, commonly after some energy relaxation."
      ],
      [
        "metastable state",
        "An excited state with a comparatively long lifetime because its decay is inhibited."
      ],
      [
        "population inversion",
        "Population of an upper transition level exceeding the lower population after accounting for relevant state weights."
      ],
      [
        "stimulated emission",
        "Emission into a radiation mode induced by an incident field interacting with an excited system."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A material absorbs a 4.0 eV photon and emits a 2.5 eV photon after relaxation. Account for the remaining energy.",
      "reasoning": "The other 1.5 eV goes to additional emitted energy or the material and surroundings, depending on the process. A longer emitted wavelength is consistent with the lower photon energy."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "In an equal-weight two-level gain model with 70 upper and 30 lower systems, which stimulated process dominates?",
      "options": [
        "Emission",
        "Absorption",
        "Neither, because 70 and 30 sum to 100"
      ],
      "correct": 0,
      "feedback": [
        "Correct: more upper systems are available for stimulated emission.",
        "Absorption dominates when the lower population is larger in this model.",
        "The total population does not determine the sign of the difference."
      ],
      "hint": "Compare the two relevant populations under the stated equal-weight assumption.",
      "teacher": "Ask students to identify the pump energy and the losses before describing a laser as an energy source."
    }
  },
  "confinement": {
    "title": "The Wave Nature of Matter Causes Quantization",
    "heading": "Boundary conditions select stationary states.",
    "subtitle": "The Wave Nature of Matter Causes Quantization",
    "target": "Boundary conditions select stationary states.",
    "visual": "quantum-box",
    "paragraphs": [
      "A wave description helps explain why a bound system has discrete allowed energies. A state must satisfy the wave equation and the system’s boundary conditions together. Arbitrarily choosing a wavelength will generally fail those conditions. The allowed states depend on the potential; a string, a particle in a box, and hydrogen do not share one universal energy ladder.",
      "For an ideal one-dimensional box with impenetrable walls at x = 0 and x = L, the wavefunction vanishes at each wall. The stationary solutions are proportional to sin(nπx/L), with positive integer n. Their energies are En = n²h²/(8mL²). The lowest state has nonzero energy because a confined state cannot have both a narrow position distribution and exactly zero momentum spread.",
      "The exploration draws the wavefunction and its probability density separately. Negative wavefunction values are meaningful amplitudes; probabilities are never negative. Squaring makes the density positive, and integrating it over the box gives one. Nodes are positions of zero probability density in this stationary state. Changing the box width changes the energy scale as 1/L².",
      "A historical ring analogy fits a whole number of wavelengths into a circumference: 2πr = nλ. With p = h/λ it gives pr = nℏ, the rule used in Bohr’s old model. This is a useful route to a quantization condition for a ring, but it is not a full derivation of hydrogen orbitals. A three-dimensional Coulomb potential has different states and angular-momentum rules.",
      "The hydrogen ground-state probability density extends over many radii and is nonzero at the nucleus. It is incorrect to treat the Bohr radius as a hard inner boundary that an electron cannot enter. Stable atomic structure comes from the quantum energy balance and allowed states, not a tiny electron traveling forever along a sharply defined ring."
    ],
    "terms": [
      [
        "boundary condition",
        "A restriction a physical solution must satisfy at the boundary of a system."
      ],
      [
        "stationary state",
        "An energy eigenstate whose probability density is time-independent under a time-independent Hamiltonian."
      ],
      [
        "node",
        "A location where a wavefunction is zero."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "For an electron in a 1.0 nm one-dimensional box, compare the first two energies.",
      "reasoning": "The ground energy is about 0.376 eV and E2 = 4E1 ≈ 1.50 eV. The energy gap is 3E1, not one equally spaced ladder step."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Doubling the box width at fixed n changes the energy by…",
      "options": [
        "A factor of one-half",
        "A factor of four",
        "A factor of one-quarter"
      ],
      "correct": 2,
      "feedback": [
        "Both the wavelength and its square enter the kinetic-energy relationship.",
        "A larger box lowers the confinement energy.",
        "Correct: En is proportional to 1/L²."
      ],
      "hint": "Apply the width dependence with all other inputs fixed.",
      "teacher": "Ask students why a negative amplitude is compatible with a positive probability density."
    }
  },
  "splitting": {
    "title": "Patterns in Spectra Reveal More Quantization",
    "heading": "A magnetic field probes energy differences between sublevels.",
    "subtitle": "Patterns in Spectra Reveal More Quantization",
    "target": "A magnetic field probes energy differences between sublevels.",
    "visual": "quantum-zeeman",
    "paragraphs": [
      "A spectral line that appears single at low resolution can have structure. Applying a magnetic field may split it into several components, the Zeeman effect. This provides evidence that magnetic properties and allowed angular-momentum projections affect atomic energies. It is more informative than treating a line as a colored mark with no internal physics.",
      "For a simplified orbital contribution in a weak field, a sublevel shift is ΔE = μB B ml, where μB is the Bohr magneton and ml labels an allowed projection. An orbital angular momentum l has 2l + 1 projection values from −l to +l. Real atoms also involve spin, coupling, and transition selection rules, so their splitting need not match this simple picture.",
      "The model shows a normal Zeeman triplet for an idealized spin-zero transition from an l = 1 upper level to an l = 0 lower level. The upper level has three projections; the lower has one. The line energy shifts are −μB B, zero, and +μB B. The chart deliberately exaggerates the tiny energy separation and does not predict intensities or polarization for a chosen viewing direction.",
      "Increasing the weak field separates these lines proportionally to B. Removing the field brings this model’s components back together. Fine structure, however, can remain at zero applied field because relativistic and spin-related interactions affect the levels. A zero-field splitting is therefore not evidence that an external magnet was accidentally left on.",
      "Electron spin is intrinsic angular momentum. It should not be pictured as a charged solid sphere literally turning on its surface. Likewise, the magnetic moment and angular momentum of a negatively charged electron have opposite sign relationships. Use the quantum numbers and measured energy changes rather than an overextended mechanical analogy."
    ],
    "terms": [
      [
        "Zeeman effect",
        "Splitting or shifting of spectral lines caused by an applied magnetic field."
      ],
      [
        "magnetic sublevel",
        "A state distinguished by an angular-momentum projection quantum number."
      ],
      [
        "fine structure",
        "Small atomic energy differences from relativistic and spin-related effects."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "In the ideal normal triplet, the adjacent line separation is μB B. What happens when B rises from 1 T to 2 T?",
      "reasoning": "With μB ≈ 5.79 × 10⁻⁵ eV/T, the separation rises from about 5.79 × 10⁻⁵ eV to 1.16 × 10⁻⁴ eV. The central component stays at the unshifted model energy."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At zero applied field, a real spectrum can still show fine structure because…",
      "options": [
        "The electron becomes a spinning solid sphere",
        "Internal relativistic and spin-related effects remain",
        "Every atomic line must always be a triplet"
      ],
      "correct": 1,
      "feedback": [
        "Spin is intrinsic; literal surface rotation is not the model.",
        "Correct: external-field splitting and fine structure are different effects.",
        "The triplet is one limited model, not a universal pattern."
      ],
      "hint": "Separate the source of each energy correction.",
      "teacher": "Ask students what the chosen triplet model leaves out before applying it to an arbitrary element."
    }
  },
  "numbers": {
    "title": "Quantum Numbers and Rules",
    "heading": "Allowed labels constrain a state without specifying a classical orbit.",
    "subtitle": "Quantum Numbers and Rules",
    "target": "Allowed labels constrain a state without specifying a classical orbit.",
    "visual": "quantum-numbers",
    "paragraphs": [
      "In the introductory one-electron atomic description, a state can be labeled by n, l, ml, and ms. The principal quantum number n is a positive integer. For a chosen n, orbital quantum number l can be 0 through n − 1. For a chosen l, ml can take the integer values −l through +l. The electron spin projection label ms is +1/2 or −1/2.",
      "Orbital angular-momentum magnitude is L = ℏ√[l(l + 1)], while its measured component along a specified axis is Lz = mlℏ. The magnitude and one component can be specified together, but all three Cartesian components cannot be simultaneously assigned sharp classical values. A vector-cone drawing is a visualization of allowed projection ratios, not a tracked direction sweeping around a classical orbit.",
      "For l greater than zero, the conventional angle construction uses cos θ = ml/√[l(l + 1)]. For l = 0, L is zero and there is no meaningful direction angle to calculate. The hydrogen ground state has n = 1, l = 0, ml = 0. It does not have n = 0, and its orbital angular momentum is not Bohr’s ground-state value of ℏ.",
      "Electron spin has s = 1/2 and magnitude ℏ√3/2, with two possible component results ±ℏ/2 along a chosen axis. Changing the measurement axis changes which component is being discussed. Spin up is therefore incomplete unless the axis is named.",
      "The control keeps all selected quantum numbers valid as n or l changes and lists the permitted values. In multi-electron atoms, interactions complicate energies and the useful coupled-state labels; n alone is not a complete energy formula. The rules here organize the single-electron orbital basis and prepare you to count states without turning an orbital into a miniature planetary path."
    ],
    "terms": [
      [
        "principal quantum number",
        "Positive integer n labeling the principal shell in the introductory atomic model."
      ],
      [
        "orbital quantum number",
        "Integer l specifying orbital angular-momentum magnitude through ℏ√[l(l + 1)]."
      ],
      [
        "projection quantum number",
        "Label specifying the allowed component of angular momentum along a chosen axis."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "For n = 3 and l = 2, list ml values and determine L and the largest Lz.",
      "reasoning": "ml can be −2, −1, 0, 1, or 2. L = √6ℏ, while the largest Lz is 2ℏ. The largest component is smaller than the magnitude."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "For n = 1, which orbital labels are allowed?",
      "options": [
        "l = 0 and ml = 0",
        "l = 1 and ml = 0",
        "l = 0 and ml = 1"
      ],
      "correct": 0,
      "feedback": [
        "Correct: l runs from zero to n − 1, then ml runs from −l to +l.",
        "l cannot reach n in this atomic rule.",
        "When l is zero its only projection is zero."
      ],
      "hint": "Apply the rules in order: n, then l, then ml.",
      "teacher": "Ask students to explain why no direction angle is reported when orbital angular momentum is zero."
    },
    "references": [
      {
        "title": "NIST · Atomic states, shells, and configurations",
        "url": "https://www.nist.gov/pml/atomic-spectroscopy-compendium-basic-ideas-notation-data-and-formulas/atomic-spectroscopy-10"
      }
    ]
  },
  "pauli": {
    "title": "The Pauli Exclusion Principle",
    "heading": "Count distinct states before filling a shell.",
    "subtitle": "The Pauli Exclusion Principle",
    "target": "Count distinct states before filling a shell.",
    "visual": "quantum-pauli",
    "paragraphs": [
      "Electrons are identical fermions. The Pauli exclusion principle prohibits two electrons in the same system from occupying the same complete single-particle state. In the introductory orbital model, that means no two share all four labels n, l, ml, and ms. Two electrons can share one spatial orbital if their spin projections differ.",
      "For a fixed l, there are 2l + 1 allowed ml values and two spin projections. A subshell therefore has capacity 2(2l + 1): an s subshell holds two electrons, p holds six, d holds ten, and f holds fourteen. Adding the allowed subshells for a principal shell gives capacity 2n². Capacity is a count of available states; it is not an instruction that the whole shell must fill before any higher shell begins.",
      "The exploration first shows the two distinct spin states of each orbital as separate slots. Placing a third electron into one spatial orbital is impossible within this basis because both allowed spin states are already occupied. Different ml values provide different orbitals in the same subshell. The diagram is a state-counting board, not a spatial arrangement of electrons around the nucleus.",
      "Ground-state configurations also depend on energy ordering and electron interactions. For the first twenty neutral elements, the usual sequence is 1s, 2s, 2p, 3s, 3p, then 4s. Potassium begins 4s before 3d is occupied. Within degenerate orbitals, Hund’s rule favors unpaired electrons with parallel spins before pairing in the elementary ground-state account. Pauli alone does not determine those energy preferences.",
      "Valence configurations help explain recurring chemical behavior. Atomic number counts protons, while neutral atoms have equally many electrons; ions require a different electron count. Elements in the same main-group column often share related outer configurations. These useful patterns have qualifications, so the reader separates state capacity, ground-state filling, and chemical trends rather than presenting them as one rule."
    ],
    "terms": [
      [
        "Pauli exclusion principle",
        "Identical fermions cannot occupy the same complete single-particle state."
      ],
      [
        "subshell",
        "Set of orbitals sharing principal quantum number n and orbital quantum number l."
      ],
      [
        "valence electrons",
        "Electrons relevant to an atom’s outer-shell bonding and chemical behavior."
      ],
      [
        "electron configuration",
        "Description of electron occupation of atomic orbitals or subshells."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Count the capacity of the n = 3 shell without assuming it fills before n = 4.",
      "reasoning": "Its subshells have l = 0, 1, and 2, giving capacities 2, 6, and 10. The total is 18 = 2n². This count does not predict the energy ordering of 3d and 4s."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Two electrons in the same spatial orbital must differ in…",
      "options": [
        "Principal quantum number",
        "Atomic number",
        "Spin projection"
      ],
      "correct": 2,
      "feedback": [
        "Different n would describe different spatial orbitals.",
        "Atomic number describes the nucleus, not an electron’s state label.",
        "Correct: n, l, and ml are shared; ms must differ."
      ],
      "hint": "Distinguish the three orbital labels from the fourth spin label.",
      "teacher": "Ask students to separate what Pauli forbids from what energy ordering and Hund’s rule favor."
    }
  }
} satisfies Record<string,LessonContent>
