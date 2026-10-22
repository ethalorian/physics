import type {LessonContent} from './lesson-contract'
export const nuclearLessons:Record<string,LessonContent> = {
  "radiation": {
    "title": "Nuclear Radioactivity",
    "heading": "Identify what leaves the nucleus before explaining its effect.",
    "subtitle": "Nuclear Radioactivity",
    "target": "Identify what leaves the nucleus before explaining its effect.",
    "visual": "nuclear-radiation",
    "paragraphs": [
      "Radioactivity is the spontaneous transformation of an unstable nucleus, often accompanied by emitted particles or photons. Becquerel’s photographic evidence and the Curies’ isolation of strongly radioactive materials showed that matter contains an internal energy source. Energy conservation still holds: the initial system’s rest energy becomes the rest energy and kinetic energy of the products, together with any radiation.",
      "An alpha particle is a helium-4 nucleus with charge +2e. Beta-minus radiation consists of newly created electrons; beta-plus radiation consists of positrons. A beta electron is not an atomic electron that was previously hiding inside the nucleus. Gamma radiation consists of photons from nuclear transitions. Gamma rays and x rays of the same energy have the same electromagnetic properties; their names describe the source process.",
      "A magnetic field distinguishes moving charged particles from neutral photons. With a fixed velocity direction and field orientation, opposite charges bend in opposite directions. The amount of bending depends on momentum and charge, so a track’s curvature cannot identify a particle without other information. A gamma photon travels straight until it interacts; a straight track alone does not prove that an object is a photon.",
      "Ionizing radiation can remove electrons from atoms. Charged particles lose energy through many interactions and have energy-dependent ranges. Photons instead have probabilities of absorption and scattering: a layer reduces the uncollided beam by a fraction rather than providing a universal stopping distance. Material, radiation type, and energy all matter.",
      "Short penetration is not equivalent to low hazard. Alpha-emitting material inside the body can deliver energy directly to tissue. Exposure to radiation and contamination by radioactive material are different situations. The exploration compares particle identity and magnetic deflection; it is not a shielding design or a dose estimate."
    ],
    "terms": [
      [
        "radioactivity",
        "Spontaneous nuclear transformation accompanied by emitted particles or radiation."
      ],
      [
        "alpha particle",
        "A helium-4 nucleus containing two protons and two neutrons."
      ],
      [
        "ionization",
        "Removal of an electron from an atom or molecule."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A beam moving right enters a magnetic field into the page. Compare the initial forces on an alpha particle, an electron, and a gamma photon.",
      "reasoning": "For v to the right and B into the page, v × B points up. The positive alpha force is up, the electron force is down, and the photon has no magnetic Lorentz force."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A thicker absorber gives fewer transmitted gamma photons because…",
      "options": [
        "Each photon has a chance to interact",
        "Every photon has the same fixed stopping distance",
        "Gamma photons lose charge as they pass"
      ],
      "correct": 0,
      "feedback": [
        "Correct: transmission is statistical.",
        "A fixed range is not the photon attenuation model.",
        "Photons have no electric charge to lose."
      ],
      "hint": "Distinguish a particle range from an interaction probability.",
      "teacher": "Ask students to use charge and momentum separately when interpreting deflection."
    },
    "references": [
      {
        "title": "EPA · Radiation basics",
        "url": "https://www.epa.gov/radiation/radiation-basics"
      }
    ]
  },
  "detectors": {
    "title": "Radiation Detection and Detectors",
    "heading": "A detector count is evidence filtered by an instrument.",
    "subtitle": "Radiation Detection and Detectors",
    "target": "A detector count is evidence filtered by an instrument.",
    "visual": "nuclear-detector",
    "paragraphs": [
      "Ionizing radiation is detected through the changes it produces in matter. Historical photographic plates recorded chemical changes; modern instruments can collect electric charge or detect light from excited materials. No single detector measures every radiation type, energy, or direction equally well. A measurement therefore includes both the source and the instrument’s response.",
      "In a Geiger–Müller tube, radiation can ionize gas. The electric field accelerates charges and produces a discharge pulse, which electronics count. The pulse does not normally preserve useful information about the original particle’s energy. After a pulse the detector needs a recovery interval, so high rates can produce missed events. More clicks do not automatically mean a known absorbed dose.",
      "A scintillator converts some deposited energy into light. A photomultiplier or another photosensor converts that light into an electric signal. With calibration, pulse size can estimate deposited energy. A semiconductor detector collects electron–hole pairs created in its material. These methods support energy measurements, but incomplete energy deposition, resolution, and detection efficiency still matter.",
      "The counting model separates true source activity from efficiency and background. For constant activity A, efficiency ε, and background rate b, the expected count in time t is C = (εA + b)t. Here efficiency includes the selected geometry and detector response; it is not just the material’s intrinsic efficiency. Real counts fluctuate about the expectation.",
      "For independent Poisson counts, the standard deviation is approximately √C when counts are sufficiently large. Collecting four times as long doubles the relative precision of a constant-rate measurement rather than multiplying it by four. Subtracting a separately measured background adds uncertainty from that measurement. This model omits dead time and changing activity, so identify those limitations before interpreting a laboratory record."
    ],
    "terms": [
      [
        "detection efficiency",
        "Fraction of relevant source events recorded in a specified detector arrangement."
      ],
      [
        "scintillation",
        "A light flash produced when deposited radiation energy excites a material."
      ],
      [
        "background count",
        "Detected event not attributed to the source being measured."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An idealized source has activity 100 Bq, efficiency 0.20, background 2 counts/s, and a 10 s observation. Find the expected total.",
      "reasoning": "The source contributes 20 counts/s and background contributes 2 counts/s. Expect 220 counts in 10 s, with Poisson standard deviation about √220 = 14.8 counts."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Quadrupling observation time at constant rate changes relative counting uncertainty to…",
      "options": [
        "About one-quarter",
        "Twice as large",
        "About half"
      ],
      "correct": 2,
      "feedback": [
        "The count grows fourfold, but its standard deviation grows twofold.",
        "Longer measurement improves relative precision under these assumptions.",
        "Correct: relative uncertainty scales as 1/√C."
      ],
      "hint": "Compare √C with C.",
      "teacher": "Ask students what calibration would be needed to infer activity from a count rate."
    }
  },
  "nuclei": {
    "title": "Substructure of the Nucleus",
    "heading": "Count protons and neutrons, then test the size model.",
    "subtitle": "Substructure of the Nucleus",
    "target": "Count protons and neutrons, then test the size model.",
    "visual": "nuclear-size",
    "paragraphs": [
      "The atomic number Z counts protons and identifies the element. The neutron number N counts neutrons; the mass number A = Z + N counts all nucleons. Isotopes of an element share Z but differ in N. Changing the number of atomic electrons instead changes the ion’s charge without changing which nuclide it is.",
      "Mass number is an integer count, not a mass measurement in kilograms or atomic mass units. An atom’s measured mass differs from the sum of free-particle masses because binding changes the system’s internal energy. One unified atomic mass unit is one-twelfth the mass of a neutral carbon-12 atom in its ground state. Most of an atom’s mass lies in its tiny nucleus.",
      "For a rough spherical model, nuclear radius is R ≈ r₀A^(1/3), with r₀ ≈ 1.2 fm. Volume therefore grows approximately in proportion to A. Using mass ≈ Au gives a nearly constant density of roughly 2.3 × 10¹⁷ kg/m³. The nucleus is not literally a pile of hard, motionless balls: this is a scale model with no claim about a sharp surface or an exact shape for every nuclide.",
      "The residual strong interaction binds nucleons over nuclear distances, while electric repulsion acts between protons. The weak interaction enables transformations such as beta decay; it is not the principal glue holding a nucleus together. Stable light nuclei often have similar proton and neutron numbers, while heavier stable nuclei generally have extra neutrons. Shell structure and pairing also influence stability.",
      "A radius formula cannot determine whether an arbitrary combination is bound or radioactive. The exploration changes mass number to test scaling and separately compares real carbon isotopes. Predict the radius ratio before moving the control, and explain why increasing radius and increasing density are different claims."
    ],
    "terms": [
      [
        "nuclide",
        "A nuclear species specified by its proton and neutron numbers."
      ],
      [
        "isotope",
        "One of the nuclides of an element, sharing its proton number."
      ],
      [
        "mass number",
        "Integer count A = Z + N of nucleons in a nucleus."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Compare spherical nuclei with mass numbers 8 and 64 using the approximate radius law.",
      "reasoning": "The mass-number ratio is 8. The radius ratio is the cube root of 8, or 2. Volume and approximate mass both grow eightfold, so their modeled density stays the same."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Carbon-12 and carbon-14 have…",
      "options": [
        "Different elements because A differs",
        "The same Z and different N",
        "Different Z and the same N"
      ],
      "correct": 1,
      "feedback": [
        "A different mass number can identify an isotope of the same element.",
        "Correct: both have six protons; their neutron counts differ.",
        "Changing Z changes the element."
      ],
      "hint": "Use the proton count to identify the element.",
      "teacher": "Ask students to distinguish exact integer counts from approximate radius and mass models."
    }
  },
  "decay": {
    "title": "Nuclear Decay and Conservation Laws",
    "heading": "Balance the complete event, including the particles you do not detect.",
    "subtitle": "Nuclear Decay and Conservation Laws",
    "target": "Balance the complete event, including the particles you do not detect.",
    "visual": "nuclear-decay",
    "paragraphs": [
      "A decay equation names the parent, daughter, and emitted or absorbed particles. Charge, energy, linear momentum, and angular momentum must balance for the complete system. In the ordinary nuclear reactions considered here, nucleon number also balances. Separate proton and neutron counts need not remain unchanged because the weak interaction can transform one into the other.",
      "Alpha emission changes the daughter to A − 4 and Z − 2. Beta-minus decay converts a neutron into a proton while creating an electron and an electron antineutrino: A stays fixed and the daughter’s Z increases by one. Beta-plus decay converts a proton into a neutron with a positron and electron neutrino, lowering Z by one. Electron capture also lowers Z, consuming an atomic electron and emitting a neutrino. These processes occur only when the full energy and quantum-state conditions allow them.",
      "Gamma emission lowers a nuclear excitation without changing A or Z. The photon carries energy and momentum, so the daughter recoils. A beta spectrum is continuous because available energy is shared among the charged lepton, neutrino, and recoiling daughter. A missing-energy inference is not evidence that energy conservation has failed; it can reveal a particle that the detector did not register.",
      "Using consistent nuclear masses, the available energy is Q = (initial mass − final rest masses)c². Neutral-atom mass tables require electron bookkeeping: beta-minus atomic mass differences already account for the emitted electron, whereas beta-plus decay requires subtracting two electron rest masses. Electron binding and daughter excitation can matter for precision work.",
      "The equation selector displays verified example channels, not a rule that every chosen nuclide supports every decay. A positive Q alone does not determine a lifetime. Forces, selection rules, and tunneling affect how readily an allowed transformation occurs, and an unstable daughter can begin a longer decay series."
    ],
    "terms": [
      [
        "parent nucleus",
        "Nucleus before a radioactive transformation."
      ],
      [
        "daughter nucleus",
        "Nucleus produced by a radioactive transformation."
      ],
      [
        "Q value",
        "Initial rest energy minus final rest energy available to a reaction."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Carbon-14 undergoes beta-minus decay. Name its daughter and balance electric charge.",
      "reasoning": "Carbon has Z = 6. The daughter has A = 14 and Z = 7, so it is nitrogen-14. Charge balances as 6 = 7 − 1 + 0, including the electron and antineutrino."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "During gamma emission, the daughter’s A and Z…",
      "options": [
        "Both stay the same",
        "Both decrease by one",
        "Change into an electron"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the nuclear energy state changes.",
        "That is not the effect of photon emission.",
        "The nucleus remains a nucleus; it emits a photon."
      ],
      "hint": "Track identity separately from excitation energy.",
      "teacher": "Ask students to explain why balancing A and Z is necessary but insufficient to prove a decay can happen."
    }
  },
  "halflife": {
    "title": "Half-Life and Activity",
    "heading": "Predict a population without predicting the next individual decay.",
    "subtitle": "Half-Life and Activity",
    "target": "Predict a population without predicting the next individual decay.",
    "visual": "nuclear-half-life",
    "paragraphs": [
      "For a single unstable nucleus with a constant decay probability per unit time, surviving one interval does not make it older in the sense of being more likely to decay during the next equal interval. A half-life is the interval over which its survival probability is one-half. It is not the time at which every nucleus has completed half of a gradual transformation.",
      "For a large independent population, the expected number remaining is N(t) = N₀e^(−λt) = N₀2^(−t/T½), where λ = ln 2/T½. Each additional half-life halves what remains, rather than removing half of the original amount again. Small samples fluctuate around this smooth expectation. The exploration shows both the expectation and a repeatable synthetic set of individual decay times.",
      "Activity is the expected rate of decay, A = λN. One becquerel is one decay per second. Equal numbers of nuclei with different half-lives have different activities: a shorter half-life means more decays per second initially. Equal activities need not imply equal masses or equal doses to a person. State the nuclide, amount, time, and geometry before making a comparison.",
      "Radiometric dating compares present composition with a justified initial composition and a model of exchange. For a closed sample with known initial parent amount, age is t = −ln(N/N₀)/λ. Carbon-14 is produced mainly when cosmic-ray-generated neutrons interact with atmospheric nitrogen. It enters the carbon cycle; after a sample stops exchanging carbon, its changing isotopic ratio can provide a clock.",
      "Actual dates require calibration, contamination checks, and a suitable half-life for the age range. Carbon dating is not a method for dating every rock or dinosaur fossil. Nuclear decay rates are generally insensitive to ordinary temperature and pressure, but processes such as electron capture can depend on electronic conditions; avoid turning a useful approximation into an absolute rule."
    ],
    "terms": [
      [
        "half-life",
        "Time over which the survival probability of a nucleus falls by one-half."
      ],
      [
        "activity",
        "Expected number of nuclear decays per unit time."
      ],
      [
        "decay constant",
        "Probability rate λ in an exponential survival model."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A closed ideal sample retains one-eighth of its initial radioactive parent. How many half-lives have elapsed?",
      "reasoning": "One-eighth is (1/2)³, so three half-lives have elapsed. Its remaining activity is also one-eighth of its initial activity if the decay constant is unchanged."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A nucleus that survives two half-lives has what chance of surviving one more?",
      "options": [
        "Zero",
        "One-eighth",
        "One-half"
      ],
      "correct": 2,
      "feedback": [
        "There is no fixed expiration time for each nucleus.",
        "One-eighth is survival over three half-lives from the original start, not conditional survival from now.",
        "Correct: the constant-rate process has the same conditional survival probability."
      ],
      "hint": "Distinguish probability from the original start and probability conditional on survival.",
      "teacher": "Ask students to compare expected counts with a small synthetic sample and explain the fluctuations."
    },
    "references": [
      {
        "title": "NOAA · Radiocarbon production and decay",
        "url": "https://gml.noaa.gov/ccgg/isotopes/decay.html"
      }
    ]
  },
  "binding": {
    "title": "Binding Energy",
    "heading": "A bound system has less rest energy than its separated parts.",
    "subtitle": "Binding Energy",
    "target": "A bound system has less rest energy than its separated parts.",
    "visual": "nuclear-binding",
    "paragraphs": [
      "Binding energy is the energy required to separate a bound nucleus completely into free protons and neutrons at rest and far apart. The separated system has more energy, and therefore more invariant mass, than the bound nucleus. The mass defect is a difference between two systems, not matter that vanishes without an energy account.",
      "With nuclear masses, B = [Zmₚ + Nmₙ − M_nucleus]c². With neutral-atom masses, hydrogen-atom masses can replace the free protons so that electron masses cancel approximately: B ≈ [Zm_H + Nmₙ − M_atom]c². Small electron-binding corrections are neglected in this introductory calculation. One atomic mass unit corresponds to about 931.5 MeV/c².",
      "Total binding energy and binding energy per nucleon answer different questions. A large nucleus can require more total separation energy even though each nucleon is less tightly bound on average. Plotting B/A reveals a broad maximum near the iron–nickel region, with important local structure. Nickel-62 is near the peak; saying that every nuclear reaction ends in iron would be incorrect.",
      "Many reactions among light nuclei can release energy by forming more tightly bound products, and many heavy-nucleus fissions also release energy. For a specific reaction, calculate the difference in total rest energies or total binding energies, conserving the nucleon account. A rise in binding energy per nucleon is a useful guide only after counting all products, including free neutrons and any other particles.",
      "The exploration uses a small table of rounded atomic masses rather than an invented smooth curve. It highlights the total and per-nucleon values for each nuclide. Nuclear reactions also supply part of Earth’s internal heat, while energy release in stars helps explain element production. Abundance still depends on reaction pathways and cosmic history, not solely on which nucleus is most tightly bound."
    ],
    "terms": [
      [
        "binding energy",
        "Energy needed to separate a bound system into specified free constituents."
      ],
      [
        "mass defect",
        "Difference between the sum of free constituent masses and the bound system’s mass."
      ],
      [
        "binding energy per nucleon",
        "Total nuclear binding energy divided by its nucleon count."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Helium-4 has total nuclear binding energy about 28.3 MeV. Find its binding energy per nucleon.",
      "reasoning": "Helium-4 contains four nucleons, so B/A ≈ 28.3/4 = 7.07 MeV per nucleon. Separating the whole nucleus still requires about 28.3 MeV."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "If energy is supplied to disassemble a bound nucleus into resting nucleons, their combined mass…",
      "options": [
        "Must stay exactly equal",
        "Is greater than the original nuclear mass",
        "Is smaller"
      ],
      "correct": 1,
      "feedback": [
        "Rest mass of the nuclear subsystem is not separately conserved.",
        "Correct: the supplied energy increases the rest energy of the separated system.",
        "Disassembly requires energy input, not release."
      ],
      "hint": "Compare the energy of the bound state with that of the specified separated state.",
      "teacher": "Ask students to use total energies rather than subtracting two per-nucleon values without counting nucleons."
    }
  },
  "tunnel": {
    "title": "Tunneling",
    "heading": "A finite barrier can transmit a quantum state without energy borrowing.",
    "subtitle": "Tunneling",
    "target": "A finite barrier can transmit a quantum state without energy borrowing.",
    "visual": "nuclear-tunnel",
    "paragraphs": [
      "A classical particle with total energy below a potential barrier cannot pass over it. The quantum state satisfies a wave equation across the entire region, including the barrier. For a finite barrier, a nonzero transmitted wave can exist beyond it even when the incident energy is below the barrier height. This is tunneling.",
      "Inside a constant barrier with V₀ > E, the wave contains exponential terms instead of the oscillations of a freely propagating region. The wave function does not abruptly disappear at the boundary. Reflection and transmission follow from matching the state and its derivative. The evanescent amplitude inside the barrier is not a classical particle following a path with a negative kinetic energy.",
      "For equal potentials on both sides of a rectangular barrier, reflection probability R and transmission probability T sum to one. The transmitted particles have the same energy as the incident particles when the potential is time-independent. They have not borrowed energy to climb over the barrier and then repaid it. A thinner or lower barrier generally transmits more for a fixed incident energy below its top.",
      "Alpha decay involves a nuclear potential and an external electric barrier, rather than the rectangular electron barrier drawn here. Its strong sensitivity to barrier penetration helps explain very different nuclear lifetimes. The simple exploration teaches the relationship without claiming to calculate a particular nuclide’s half-life.",
      "Tunneling also permits current between a scanning-tunneling-microscope tip and a conducting surface. Its sensitivity to separation makes atomic-scale structure detectable. The displayed probability is calculated from the exact one-dimensional rectangular-barrier formula; the fading strip is a schematic evanescent amplitude, not a normalized probability density or a measured trajectory. Change width first, then compare that effect with changing incident energy."
    ],
    "terms": [
      [
        "tunneling",
        "Quantum transmission through a finite classically forbidden potential barrier."
      ],
      [
        "potential barrier",
        "Region with potential energy higher than that of neighboring regions."
      ],
      [
        "transmission probability",
        "Fraction of incident probability current transmitted by a scattering arrangement."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An electron crosses a fixed, time-independent barrier whose far side has the same potential as the near side. Compare incident and transmitted energies.",
      "reasoning": "They are equal. Tunneling changes the probability of transmission, while the stationary potential conserves energy. Reflection accounts for the remaining incident probability."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Increasing barrier width at fixed below-barrier energy generally makes T…",
      "options": [
        "Smaller",
        "Larger",
        "Exactly one"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the evanescent state extends across a greater distance.",
        "A thicker barrier suppresses transmission in this model.",
        "Finite transmission is not guaranteed transmission."
      ],
      "hint": "Keep the incident energy fixed while changing width.",
      "teacher": "Ask students why nonzero transmission does not require a violation of energy conservation."
    }
  },
  "imaging": {
    "title": "Diagnostics and Medical Imaging",
    "heading": "Reconstruct a distribution from many limited measurements.",
    "subtitle": "Diagnostics and Medical Imaging",
    "target": "Reconstruct a distribution from many limited measurements.",
    "visual": "nuclear-imaging",
    "paragraphs": [
      "Nuclear medicine follows radiation emitted by a tracer inside the body. A radiopharmaceutical combines an appropriate radionuclide with a substance whose distribution provides useful information. The detector measures emitted signals, and the imaging system infers a spatial distribution. An image is evidence interpreted with physiology and clinical context; a bright region is not by itself a diagnosis.",
      "A gamma camera uses a collimator to admit photons from selected directions and a detector to estimate their positions and energies. Single-photon emission computed tomography, or SPECT, combines projections from many directions to reconstruct a three-dimensional tracer distribution. Collimation rejects many photons, creating a tradeoff between sensitivity and spatial information.",
      "In positron emission tomography, or PET, a radionuclide emits a positron that travels some distance before annihilating with an electron. For annihilation nearly at rest, two approximately opposite photons each carry about 511 keV. A coincidence between two detectors identifies a line of response. One pair does not uniquely identify a point along that line. Many events support reconstruction, and timing information can further constrain position.",
      "The exploration deliberately overlays lines through a known synthetic source. It isolates the geometric inference rather than simulating a clinical scanner. Positron range, photon scattering, attenuation, detector size, and timing resolution all limit real images. A narrower mathematical intersection is not a promise of clinical resolution.",
      "CT obtains transmission measurements from an external x-ray source, while PET and SPECT use emission. MRI uses magnetic and radiofrequency interactions rather than ionizing radiation. Radioimmunoassay is another nuclear technique, measuring a substance through competition with a labeled tracer and a calibrated binding measurement. These different signals answer different questions, so select the measurement principle before interpreting the image."
    ],
    "terms": [
      [
        "radiopharmaceutical",
        "A radionuclide-containing substance used for medical diagnosis or treatment."
      ],
      [
        "PET",
        "Positron emission tomography, reconstructing tracer distribution from annihilation-photon coincidences."
      ],
      [
        "line of response",
        "Line associated with a detected pair of annihilation photons."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Two opposite PET detectors register a coincidence. Does that event alone determine the emission point?",
      "reasoning": "It constrains the event to a line of response. Multiple events, reconstruction, and sometimes timing information are needed to localize the distribution."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A conventional CT measurement primarily records…",
      "options": [
        "Positron decay inside the patient",
        "Radioactive decay induced by every image",
        "X-ray transmission from an external source"
      ],
      "correct": 2,
      "feedback": [
        "That describes the source of PET signals.",
        "X-ray imaging does not mean the patient becomes a radioactive source.",
        "Correct: attenuation of external x rays provides the signal."
      ],
      "hint": "Locate the source of the detected radiation.",
      "teacher": "Ask students to separate an observed coincidence from the position inferred using a reconstruction model."
    }
  },
  "dose": {
    "title": "Biological Effects of Ionizing Radiation",
    "heading": "Track deposited energy, affected mass, and the purpose of a dose quantity.",
    "subtitle": "Biological Effects of Ionizing Radiation",
    "target": "Track deposited energy, affected mass, and the purpose of a dose quantity.",
    "visual": "nuclear-dose",
    "paragraphs": [
      "Ionizing radiation can alter molecules directly and through reactive chemical products, including damage to DNA. Cells may repair damage, stop dividing, die, or persist with changes. Outcomes depend on radiation quality, dose, timing, tissue, and biological response. It is incorrect to assume that every effect is simply proportional to dose or that all cancer cells respond identically.",
      "Absorbed dose is deposited energy divided by the mass of the specified material: D = E_abs/m. Its SI unit is the gray, where 1 Gy = 1 J/kg. The relevant mass is the irradiated region, not automatically the person’s total mass. Activity in becquerels describes a source’s decay rate and cannot alone determine the energy absorbed by tissue.",
      "Radiation-protection quantities add other information. Equivalent dose weights a tissue’s absorbed dose for radiation type; effective dose also applies tissue weighting. They use sieverts. These quantities support specified protection comparisons and are not interchangeable with the absorbed dose used to describe an individual radiotherapy treatment. Relative biological effectiveness is experimentally defined for an endpoint and reference radiation; it is not one universal biological multiplier.",
      "Some tissue reactions have dose thresholds, while cancer-risk assessment uses population evidence and models with uncertainty, especially at low doses. A small model dose calculation cannot predict a particular person’s outcome. Natural background also varies by location and circumstances. Avoid comparing two exposure numbers unless the quantities, regions, and time intervals match.",
      "The illustration divides a fixed deposited energy among an adjustable number of equal material cells. It is a unit-and-averaging model, not a body model. Reducing avoidable exposure and obtaining enough information for a justified medical purpose must be considered together. The FDA describes justification and optimization as central to medical x-ray use; the reading teaches those principles without recommending individual examinations or treatment."
    ],
    "terms": [
      [
        "absorbed dose",
        "Energy deposited by radiation per unit mass, measured in gray."
      ],
      [
        "gray",
        "SI absorbed-dose unit equal to one joule per kilogram."
      ],
      [
        "effective dose",
        "A radiation-protection quantity using radiation and tissue weighting, measured in sievert."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An ideal material sample absorbs 0.020 J in a 2.0 kg region. Calculate the region’s average absorbed dose.",
      "reasoning": "D = 0.020/2.0 = 0.010 Gy. Averaging over an unrelated larger mass would conceal the dose in the affected region. This calculation does not determine a medical outcome."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A source activity in Bq is insufficient to determine absorbed dose because…",
      "options": [
        "All radiation deposits all its energy in every nearby object",
        "Energy, transport, absorption, time, and mass also matter",
        "A becquerel is already a gray"
      ],
      "correct": 1,
      "feedback": [
        "Some radiation escapes or deposits energy elsewhere.",
        "Correct: source decay rate is only one part of the account.",
        "Bq measures decays per second; Gy measures J/kg."
      ],
      "hint": "Follow energy from source to the specified absorbing material.",
      "teacher": "Ask students to identify the measured quantity and denominator before comparing two radiation numbers."
    },
    "references": [
      {
        "title": "EPA · Radiation terms and units",
        "url": "https://www.epa.gov/radiation/radiation-terms-and-units"
      },
      {
        "title": "FDA · Medical x-ray imaging",
        "url": "https://www.fda.gov/radiation-emitting-products/medical-imaging/medical-x-ray-imaging"
      }
    ]
  },
  "therapy": {
    "title": "Therapeutic Uses of Ionizing Radiation",
    "heading": "Concentrating a treatment signal also requires accounting for surrounding tissue.",
    "subtitle": "Therapeutic Uses of Ionizing Radiation",
    "target": "Concentrating a treatment signal also requires accounting for surrounding tissue.",
    "visual": "nuclear-therapy",
    "paragraphs": [
      "Radiation therapy uses ionizing radiation to damage cancer-cell DNA and limit the cells’ ability to reproduce. Healthy tissues can also be affected. The physics problem includes where energy is deposited, while the medical decision also depends on tumor biology, normal-tissue response, other treatments, and the individual patient. A useful treatment cannot be chosen from a physics sketch alone.",
      "External-beam therapy directs radiation from a machine toward the treatment region. Internal therapy places a source in or near the target, or uses a radiopharmaceutical that distributes through the body. These categories differ in source location, radiation transport, and how the distribution changes with time. They should not be pictured as interchangeable ways of delivering one universal dose.",
      "Using beams from several directions can distribute entrance exposure over different paths while their contributions overlap at the target. Each beam also deposits energy outside the target. The exploration shows equal-weight strips that add at their intersection; it is deliberately a geometry model in relative units. It omits attenuation, scatter, anatomy, motion, and the different depth-dose behavior of photons and charged particles.",
      "Real planning uses detailed images, calibrated equipment, calculations, and checks by a clinical team. Treatment dose is specified in grays, and dividing delivery across sessions can alter tissue response. A schedule and total dose depend on the actual treatment; older textbook tables in sieverts are not a current prescription guide.",
      "The important transfer is to ask what a diagram leaves out. More overlapping paths can change the distribution, but that alone does not establish a better treatment. Compare target coverage with normal-tissue exposure and name the model’s limits. The same care explains why radiation can both cause harm and be useful in medicine without any contradiction: purpose, location, amount, and evidence all matter."
    ],
    "terms": [
      [
        "radiotherapy",
        "Use of ionizing radiation to treat disease, commonly cancer."
      ],
      [
        "external-beam therapy",
        "Treatment in which radiation comes from a source outside the body."
      ],
      [
        "fractionation",
        "Division of a treatment dose into separate delivery sessions."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "In a toy geometry, four equal beam contributions overlap at a target. Each contributes one relative unit there. Compare the target sum with a location crossed by only one beam.",
      "reasoning": "The target receives four relative units and the single-path location receives one. Real tissue doses require a transport and anatomy calculation; this sum only demonstrates superposition."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "The overlapping-beam diagram proves…",
      "options": [
        "A geometric pattern of summed contributions",
        "That healthy tissue receives zero dose",
        "Which treatment schedule is best for a patient"
      ],
      "correct": 0,
      "feedback": [
        "Correct: its inference is limited to the stated model.",
        "Each beam also crosses surrounding regions.",
        "That requires clinical evidence and an individualized plan."
      ],
      "hint": "Separate a geometric relationship from a treatment decision.",
      "teacher": "Ask students to name two omitted effects before making a claim about the diagram."
    },
    "references": [
      {
        "title": "National Cancer Institute · Radiation therapy",
        "url": "https://www.cancer.gov/about-cancer/treatment/types/radiation-therapy"
      }
    ]
  },
  "food": {
    "title": "Food Irradiation",
    "heading": "Changing molecules does not automatically make a food radioactive.",
    "subtitle": "Food Irradiation",
    "target": "Changing molecules does not automatically make a food radioactive.",
    "visual": "nuclear-food",
    "paragraphs": [
      "Food irradiation exposes food to an approved source of ionizing radiation for purposes such as reducing pathogens, controlling insects, or slowing certain spoilage processes. Deposited energy can damage biological molecules directly and through reactive chemical products. A free radical has an unpaired electron; it is a chemical species, not a miniature radioactive nucleus.",
      "The interaction is primarily with the food’s electrons and molecules. Under approved conditions, food irradiation does not make the food radioactive. That statement concerns the specified process: it is not a claim that every radiation type at every energy can never induce a nuclear reaction. The source is controlled separately from the product.",
      "Dose in gray measures absorbed energy per mass. In food processing, doses are often expressed in kilograys, but a numerical dose by itself does not tell you a process’s effectiveness. The organism, food composition, temperature, and treatment conditions matter. An illustrative survival law can show why a larger dose may reduce a population without implying universal sterilization.",
      "The model uses a hypothetical decimal-reduction dose D₁₀: each additional D₁₀ reduces the expected surviving fraction by a factor of ten. This is an educational response curve with invented parameters, not a food-processing specification. A tiny expected surviving fraction is different from a guarantee that no organisms remain, especially for a large starting population.",
      "FDA guidance treats food irradiation as an established food-safety technology and explains its permitted uses. It also emphasizes that irradiation complements appropriate handling and storage. Irradiation does not reverse every form of spoilage or remove every toxin. Evaluate the particular purpose and evidence instead of assuming that the word radiation means either a contaminated product or a universally effective preservation method."
    ],
    "terms": [
      [
        "food irradiation",
        "Use of ionizing radiation to achieve specified food-processing purposes."
      ],
      [
        "free radical",
        "A chemical species containing an unpaired electron."
      ],
      [
        "decimal-reduction dose",
        "Dose that reduces a specified surviving population by a factor of ten under stated conditions."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A hypothetical organism has D₁₀ = 1 dose unit. What surviving fraction does a simple exponential model predict after 3 units?",
      "reasoning": "Three tenfold reductions give 10⁻³ = 0.001, or 0.1%. This is a model expectation for the specified response, not a guarantee about a real food."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Approved food irradiation differs from radioactive contamination because…",
      "options": [
        "The radiation has no energy",
        "All microorganisms are guaranteed to disappear",
        "Exposure does not require radioactive material to become part of the food"
      ],
      "correct": 2,
      "feedback": [
        "Deposited radiation energy produces the intended molecular changes.",
        "Effectiveness depends on the organism and treatment conditions.",
        "Correct: irradiation and contamination are different processes."
      ],
      "hint": "Separate the radiation field from radioactive source material.",
      "teacher": "Ask students to explain why a survival fraction and an absolute survivor count are different."
    },
    "references": [
      {
        "title": "FDA · Food irradiation",
        "url": "https://www.fda.gov/food/buy-store-serve-safe-food/food-irradiation-what-you-need-know"
      }
    ]
  },
  "fusion": {
    "title": "Fusion",
    "heading": "Account for all products and distinguish reaction energy from useful electricity.",
    "subtitle": "Fusion",
    "target": "Account for all products and distinguish reaction energy from useful electricity.",
    "visual": "nuclear-fusion",
    "paragraphs": [
      "Fusion combines light nuclei into products whose total rest energy can be smaller than that of the initial system. The difference appears as kinetic energy and radiation. Not every combination releases energy, so the binding-energy trend is a guide rather than a substitute for a balanced reaction and an energy calculation.",
      "Positive nuclei repel electrically. Their attractive nuclear interaction becomes important only at much shorter separations. Thermal motion and quantum tunneling together allow reactions in stellar interiors. The Sun’s proton–proton chain has a net conversion of hydrogen into helium, with positrons and neutrinos among the intermediate or emitted products. Neutrinos carry away some energy, while other energy is transported through the star before emerging as light.",
      "In the main sequence, fusion supplies energy in the Sun’s core. It is not currently restricted to a hydrogen-burning shell around an inert helium core; that describes a later stage of stellar evolution. Neutrino flavor changes also explain why early experiments sensitive mainly to electron neutrinos detected fewer than the total predicted flux.",
      "Fusion-energy research investigates ways to confine hot plasma, including magnetic and inertial approaches. A successful reaction is only part of a useful power system: heating, confinement, materials, repeated operation, heat recovery, and electricity generation also matter. The 2022 National Ignition Facility result exceeded the laser energy delivered to its target, a specific milestone that should not be confused with net electricity from an entire facility.",
      "The interactive energy account uses hypothetical plant-level values. It separates fusion output, driver input, conversion losses, and other electrical demand. A gain quoted across one boundary cannot be applied silently to another. Define the boundary and distinguish energy per event, power, and net useful output before evaluating a claim about a breakthrough."
    ],
    "terms": [
      [
        "fusion",
        "A nuclear reaction combining light nuclei into larger nuclear products."
      ],
      [
        "plasma",
        "Matter containing mobile charged particles, often an ionized gas."
      ],
      [
        "energy gain",
        "Output-to-input ratio defined across a stated system boundary."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A hypothetical system makes 100 energy units of fusion output, converts 40% to electricity, and requires 30 units of electrical input. Find net electricity.",
      "reasoning": "Gross electricity is 40 units. Subtracting 30 gives 10 net units. The result depends on that complete boundary, not solely on the fusion output."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A target-level fusion gain greater than one guarantees…",
      "options": [
        "That all engineering losses are zero",
        "Only that the stated target output exceeds its stated input",
        "Net electrical output from the entire facility"
      ],
      "correct": 1,
      "feedback": [
        "A ratio above one at one stage does not remove other losses.",
        "Correct: the boundary defines the claim.",
        "Facility input and conversion losses require a separate account."
      ],
      "hint": "Draw the boundary around the quantities in the ratio.",
      "teacher": "Ask students to rewrite a gain claim with its input, output, and system boundary made explicit."
    },
    "references": [
      {
        "title": "Department of Energy · The 2022 fusion ignition milestone",
        "url": "https://www.energy.gov/articles/doe-national-laboratory-makes-history-achieving-fusion-ignition"
      }
    ]
  },
  "fission": {
    "title": "Fission",
    "heading": "Follow nuclear energy into heat, electricity, and continuing decay.",
    "subtitle": "Fission",
    "target": "Follow nuclear energy into heat, electricity, and continuing decay.",
    "visual": "nuclear-fission",
    "paragraphs": [
      "Fission divides a heavy nucleus into smaller nuclear products, often with emitted neutrons and photons. The total electric charge and nucleon number balance in ordinary fission reactions, while the sum of the products’ rest masses can be smaller. The resulting kinetic energy and radiation account for the rest-energy difference.",
      "A single parent can produce different fragment pairs, so a fission equation specifies a possible channel rather than one inevitable outcome. Many fragments are radioactive and later decay. The energy initially carried by charged fragments becomes thermal energy as they interact with surrounding material; delayed radioactive products continue to contribute heat.",
      "Some emitted neutrons can induce further fissions, producing a chain reaction. Others escape or are absorbed without inducing fission. A sustained reactor depends on the overall neutron balance, not simply on the fact that one event emitted more than one neutron. Control systems manage this balance while cooling systems remove heat. The word critical, in this context, denotes a self-sustaining balance and does not by itself mean an accident.",
      "A power station converts some reactor thermal energy into electricity and rejects the remainder as heat. This connects nuclear physics to the thermodynamic heat engines studied earlier. The exploration tracks a hypothetical thermal input through an adjustable conversion efficiency. It is an energy-flow diagram, not a reactor-design calculation or a prediction of a particular plant’s performance.",
      "Stopping the main fission chain does not immediately eliminate heat generation, because radioactive fission products continue to decay. Continuing cooling and containment therefore remain important. Fuel use, waste management, reliability, cost, and environmental effects require evidence beyond a single efficiency number. Distinguish a controlled heat source, an energy-conversion system, and its long-term material responsibilities when evaluating nuclear power."
    ],
    "terms": [
      [
        "fission",
        "Splitting of a heavy nucleus into smaller nuclear products."
      ],
      [
        "chain reaction",
        "A sequence in which products of one event induce further events."
      ],
      [
        "decay heat",
        "Heat from radioactive decay that can continue after the main fission chain stops."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An illustrative reactor supplies 900 MW of thermal power to a conversion system with efficiency one-third. Find electrical and rejected-heat power.",
      "reasoning": "The electrical output is 300 MW and rejected heat is 600 MW. Their sum is 900 MW; energy is conserved even though not all input becomes useful electricity."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "After the main fission chain stops, cooling may still be needed because…",
      "options": [
        "Radioactive products continue releasing decay energy",
        "Energy conservation has stopped applying",
        "All neutrons instantly become heat-free"
      ],
      "correct": 0,
      "feedback": [
        "Correct: shutdown and zero heat generation are different conditions.",
        "The continuing heat has an identifiable nuclear-energy source.",
        "Decay products matter even after the controlled chain has stopped."
      ],
      "hint": "Track the daughter products after the primary reactions end.",
      "teacher": "Ask students to explain the difference between neutron balance and thermal balance."
    },
    "references": [
      {
        "title": "NRC · Reactor concepts and decay heat",
        "url": "https://www.nrc.gov/sites/default/files/doc_library/cdn/legacy/reading-rm/basic-ref/students/for-educators/02.pdf"
      }
    ]
  },
  "consequences": {
    "title": "Nuclear Weapons",
    "heading": "Connect energy pathways to human consequences and evidence.",
    "subtitle": "Nuclear Weapons",
    "target": "Connect energy pathways to human consequences and evidence.",
    "visual": "nuclear-consequences",
    "paragraphs": [
      "Nuclear weapons release energy from nuclear transformations on a very short timescale. Chemical explosives draw on rearrangements of electrons and bonds; nuclear processes involve changes in nuclear rest energy. Fission and fusion provide the relevant nuclear mechanisms, but describing an energy source does not by itself describe a weapon or justify its use.",
      "A nuclear detonation transfers energy through several interacting pathways. A blast wave damages structures and people; intense thermal radiation can cause burns and fires; prompt ionizing radiation can damage tissue. Radioactive material produced or dispersed by an event can contribute to later exposure. These pathways have different timescales and are not represented by a single dose, temperature, or energy number.",
      "The consequences also depend on the environment and on disrupted services. Damage to hospitals, transport, water, and communications can make emergency response difficult. Long-term effects include continuing health burdens, displacement, and environmental contamination. A physical description of energy transfer is therefore necessary but insufficient for understanding the humanitarian impact.",
      "The atomic bombings of Hiroshima and Nagasaki in August 1945 demonstrated devastating civilian consequences. Historical photographs and testimony are evidence of those consequences, while casualty estimates and long-term studies require careful attention to methods and uncertainty. Modern arsenal counts and treaty status change, so the historical textbook’s numbers should not be treated as a current inventory.",
      "The interactive diagram organizes consequence pathways and the evidence needed to study each. It is a qualitative concept map, with no distances, yields, or design parameters. Use it to distinguish a physical claim from an ethical or policy judgment. International discussion of disarmament and nonproliferation draws on both kinds of reasoning; clearly stated evidence supports that discussion without pretending that physics alone determines the decision."
    ],
    "terms": [
      [
        "prompt radiation",
        "Ionizing radiation emitted near the time of a nuclear event."
      ],
      [
        "fallout",
        "Radioactive particles deposited after being carried through the atmosphere."
      ],
      [
        "nonproliferation",
        "Efforts to prevent the spread of nuclear weapons."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A report discusses blast damage, later radioactive contamination, and loss of hospital capacity. Are these three descriptions of the same measured quantity?",
      "reasoning": "No. They concern mechanical damage, radioactive material and exposure pathways, and disrupted services. A responsible comparison names a separate measure and timescale for each."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Which statement is a physical claim that can be tested?",
      "options": [
        "A particular policy is automatically proved by E = mc²",
        "One energy number completely describes all human consequences",
        "Radioactive deposits can create later exposure pathways"
      ],
      "correct": 2,
      "feedback": [
        "Policy judgments also involve values and other evidence.",
        "Location, timing, population, and services also shape consequences.",
        "Correct: measurements and transport models can test that pathway."
      ],
      "hint": "Separate a measurable mechanism from a value judgment.",
      "teacher": "Ask students to build an evidence-based explanation without treating human consequences as a single number."
    },
    "references": [
      {
        "title": "United Nations · Nuclear disarmament",
        "url": "https://www.un.org/en/peaceandsecurity/what-nuclear-disarmament/"
      }
    ]
  }
}
