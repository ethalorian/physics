import type {LessonContent} from './lesson-contract'
/** Original instructional adaptations, with explicit measurement and reference-frame conventions. */
export const foundationLessons = {
  "inquiry": {
    "title": "Physics: An Introduction",
    "heading": "A useful model makes a prediction that evidence can challenge.",
    "subtitle": "Physics: An Introduction",
    "target": "A useful model makes a prediction that evidence can challenge.",
    "visual": "foundation-evidence",
    "paragraphs": [
      "Physics connects observations of matter, motion, energy, space, and time. The same energy account can describe a falling object, an electrical device, or a warming room. These connections make a small set of ideas useful in many situations. Learning physics therefore includes deciding what to measure and explaining why a particular model fits the evidence, not just choosing an equation after seeing familiar numbers.",
      "A model is a deliberately limited representation of a system. Treating a cart as a point can be useful for its overall motion while leaving out its wheel rotation. A scientific theory is an explanatory framework supported by evidence. A law expresses a recurring relationship, often mathematically. A theory does not become a law after enough tests; the terms describe different roles. Names such as principle and law also reflect historical convention rather than a strict ranking of certainty.",
      "Begin an investigation with a question that different possible observations could answer. Specify a system, a measurable quantity, a comparison, and the assumptions behind the prediction. Repeat measurements and look for systematic effects. When a prediction disagrees with data, examine the measurement and the model: a faulty sensor and an omitted force are different explanations that require different follow-up tests. One agreeable result does not prove a model valid under every condition.",
      "The exploration compares position predictions with a small, fixed set of synthetic cart measurements. Both models start at the same place and speed; only one includes a steady acceleration. Later points separate the predictions. Changing the size of an uncertainty interval changes whether this particular data set distinguishes the models, not which physical mechanism truly occurred. Real investigations use independent measurements and justified uncertainty estimates.",
      "Classical and modern physics overlap in their successful predictions. A Newtonian model can be sufficient at low speeds, while a precision clock comparison may require relativity. Choose a model by the question and required accuracy. There is no universal microscope size or speed percentage at which one theory suddenly stops working."
    ],
    "terms": [
      [
        "model",
        "A representation of a system with stated assumptions and a limited purpose."
      ],
      [
        "scientific theory",
        "An evidence-supported explanatory framework with testable consequences."
      ],
      [
        "physical law",
        "A concise description of a recurring physical relationship."
      ],
      [
        "hypothesis",
        "A proposed explanation or claim that can be tested against evidence."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Two models predict the same starting position. At 4 s they predict 8 m and 12 m. A measured position is 12.1 ± 0.2 m; the stated interval summarizes this example’s measurement bounds.",
      "reasoning": "The later measurement distinguishes these predictions under the stated bounds: 12 m is compatible and 8 m is not. Next examine whether the acceleration model predicts additional independent observations."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "What most strongly supports choosing between the two models?",
      "options": [
        "A measurement where their predictions differ by more than the relevant uncertainty",
        "The model with the longest equation",
        "A single starting point that both predict equally well"
      ],
      "correct": 0,
      "feedback": [
        "Correct: a discriminating measurement tests the competing predictions.",
        "Complexity alone is not evidence.",
        "Agreement where predictions coincide does not distinguish them."
      ],
      "hint": "Compare different predictions at the same measured time.",
      "teacher": "Ask students to propose a new measurement and explain why it distinguishes the candidate models."
    }
  },
  "units": {
    "title": "Physical Quantities and Units",
    "heading": "Convert the number and the unit together.",
    "subtitle": "Physical Quantities and Units",
    "target": "Convert the number and the unit together.",
    "visual": "foundation-units",
    "paragraphs": [
      "A measurement needs a quantity, a numerical value, and a unit. Writing 4.2 without saying meters, seconds, or kilograms leaves the physical meaning incomplete. Changing units changes the number used to describe the same quantity. A length of 2.5 m is also 250 cm; the object does not grow when you choose a smaller unit.",
      "SI has seven base units: second, meter, kilogram, ampere, kelvin, mole, and candela. Many quantities in mechanics use combinations of mass, length, and time, but these are not the only SI base quantities. The current SI fixes numerical values of defining constants. For example, the meter uses the exact vacuum light speed c and the second; the kilogram uses the fixed Planck constant. Practical instruments still have measurement uncertainty even when a defining constant has an exact stipulated value.",
      "Build a conversion factor from an equality. Since 1 km = 1000 m, multiplying 3 km by 1000 m / 1 km leaves 3000 m after the kilometer units cancel. For squared or cubed quantities, raise the whole factor to the appropriate power. One square meter contains 10,000 square centimeters, not 100. For speed, convert distance and time separately: the time unit occurs in the denominator.",
      "Prefixes are powers of ten. Kilo means 10³, milli means 10⁻³, micro means 10⁻⁶, and nano means 10⁻⁹. Scientific notation makes large ratios easier to inspect. Unit symbols are case-sensitive, and mass uses kg as its base unit even though practical prefixes are commonly attached to the gram.",
      "Dimensional analysis checks whether an equation can be meaningful. Distance divided by time has speed units; distance multiplied by time does not. Matching units is necessary but does not prove an equation correct: both v = d/t and v = 2d/t have speed dimensions. Combine the unit check with a physical definition and a limiting-case check."
    ],
    "terms": [
      [
        "SI",
        "The International System of Units, based on seven defining constants."
      ],
      [
        "conversion factor",
        "A ratio equal to one made from equivalent quantities in different units."
      ],
      [
        "dimension",
        "The type of physical quantity, such as length or time, independent of its chosen unit."
      ],
      [
        "derived unit",
        "A unit expressed as a product of powers of base units."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "Convert 72 km/h to m/s and 2.0 m² to cm².",
      "reasoning": "72 × 1000 / 3600 = 20 m/s. For area, 2.0 × 100² = 20,000 cm². The exact conversion factors do not add measurement uncertainty."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "How many cm² are in 3 m²?",
      "options": [
        "300 cm²",
        "0.03 cm²",
        "30,000 cm²"
      ],
      "correct": 2,
      "feedback": [
        "That converts only one of the two dimensions.",
        "Square centimeters are smaller units, so the numerical area grows.",
        "Correct: both length dimensions gain a factor of 100."
      ],
      "hint": "Square the complete length-conversion factor.",
      "teacher": "Ask students to write the cancelling units and distinguish an exact conversion factor from a measured length."
    },
    "references": [
      {
        "title": "BIPM · Current SI base units and defining constants",
        "url": "https://www.bipm.org/en/measurement-units/"
      }
    ]
  },
  "measurement": {
    "title": "Accuracy, Precision, and Significant Figures",
    "heading": "Tightly grouped measurements can still share a bias.",
    "subtitle": "Accuracy, Precision, and Significant Figures",
    "target": "Tightly grouped measurements can still share a bias.",
    "visual": "foundation-measurement",
    "paragraphs": [
      "Repeated measurements tell two different stories. Precision describes how closely repeated results agree under specified conditions. Accuracy concerns agreement with the quantity being measured, assessed using appropriate reference information. A scale that consistently reads too high can be precise while biased. Repeating its reading many times does not remove the shared calibration error.",
      "Measurement uncertainty describes the range of values reasonably attributable to the measured quantity, using stated information and a specified method. It is not simply a synonym for a mistake or for the difference from an assumed exact answer. Instrument resolution, calibration, sampling, environmental variation, and the measurement procedure can all contribute. A quoted interval needs an explanation: a standard uncertainty and a stated bound do not mean the same thing.",
      "For a positive result x with an uncertainty amount u, the relative uncertainty is u/x and the percentage is 100u/x. If a classroom length is reported as 2.40 ± 0.03 m, that uncertainty amount is 1.25% of the result. Adding more calculator digits does not reduce it. A mean can reduce some random contributions when measurements are independent, but common systematic effects remain.",
      "Significant figures communicate the justified detail of a result. Nonzero digits and zeros between them count; trailing zeros after a decimal point can communicate measured precision. Leading zeros locate the decimal place. For classroom calculations, round products or quotients to the limiting significant-figure count, and sums or differences to the limiting decimal place. Keep guard digits until the final answer. Exact counts and defined conversion factors do not limit significant figures.",
      "Explicit uncertainty is more informative than digit counting alone. For small stated bounds, adding relative uncertainties gives an approximate bound on a product; it is not the general statistical rule for independent standard uncertainties, which combine in quadrature under suitable assumptions. The model shows a synthetic repeated-measurement pattern and an area interval calculated directly from positive length bounds, so its uncertainty meaning stays visible."
    ],
    "terms": [
      [
        "precision",
        "Agreement among repeated measurements under specified conditions."
      ],
      [
        "bias",
        "A systematic offset in a measurement process relative to an appropriate reference."
      ],
      [
        "measurement uncertainty",
        "A quantified description of dispersion of values attributable to a measured quantity, under a stated method."
      ],
      [
        "significant figures",
        "Digits used to communicate justified numerical detail in a measured result."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A length is 2.0 ± 0.1 m and a width is 3.0 ± 0.1 m. Treat the intervals as bounds. Find the possible area range.",
      "reasoning": "The lower product is 1.9 × 2.9 = 5.51 m² and the upper is 2.1 × 3.1 = 6.51 m². The central product is 6.00 m²; the interval is not exactly symmetric. Do not present the full calculator output as measurement precision."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A balance gives closely grouped readings 0.5 kg above a trusted calibration reference. What will repeated averaging alone fix?",
      "options": [
        "It makes the reference value irrelevant",
        "It may reduce random scatter but does not remove the shared bias",
        "It removes the bias automatically"
      ],
      "correct": 1,
      "feedback": [
        "Reference information is needed to assess calibration and accuracy.",
        "Correct: a common offset survives averaging and requires a calibration investigation.",
        "Repeating a biased procedure preserves its offset."
      ],
      "hint": "Separate a shared shift from reading-to-reading variation.",
      "teacher": "Have students explain what their uncertainty interval means and which additional check could expose a common bias."
    },
    "references": [
      {
        "title": "NIST · Measurement uncertainty",
        "url": "https://www.nist.gov/glossary-term/39291"
      }
    ]
  },
  "estimate": {
    "title": "Approximation",
    "heading": "Build an estimate from quantities you can defend.",
    "subtitle": "Approximation",
    "target": "Build an estimate from quantities you can defend.",
    "visual": "foundation-estimate",
    "paragraphs": [
      "An estimate is a reasoned calculation with deliberately limited precision. It can answer whether a result is plausible before a detailed measurement is available. Rather than guessing one impressive number, break the problem into quantities you can approximate, record the assumptions, and check the units at each step.",
      "Suppose you want the number of small rectangular boxes that could fill a storage room. Estimate the room’s length, width, and height, multiply them to obtain volume, and divide by the volume of one box. Then include an occupied-volume fraction because doorways, aisles, uneven packing, and unusable space prevent complete filling. The resulting estimate is a capacity calculation under a stated packing assumption, not a promise about a real room.",
      "Powers of ten help locate the scale. A thousand objects and a million objects differ by three orders of magnitude. A rough answer should not carry a long trail of decimal digits. If the input measurements are approximate, report perhaps one or two significant figures and a plausible range. An estimate can be useful even when its uncertainty is tens of percent, provided the decision only needs that level of accuracy.",
      "Sensitivity tells you which assumptions deserve attention. In the room model, doubling the occupied fraction doubles the estimated count. Doubling the assumed box length while holding its other dimensions fixed halves the count. If a length estimate affects all three dimensions of a geometrically similar object, volume instead changes with the cube of that scale. State which quantities you are holding fixed before making a proportional argument.",
      "Finish with an independent check. Compare the count with the number of layers times the approximate boxes per layer, or compare the total mass with what the floor could support. Such checks can reveal a wrong unit or impossible assumption. An estimate is a starting point for investigation; revise it when better evidence arrives."
    ],
    "terms": [
      [
        "order of magnitude",
        "A power-of-ten scale used to compare quantities."
      ],
      [
        "estimate",
        "An approximate result built from stated information and assumptions."
      ],
      [
        "sensitivity",
        "How strongly a result changes when an input or assumption changes."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A room is about 8 m × 6 m × 3 m. Boxes occupy about 60% of its volume, and each box is 0.060 m³. Estimate their count.",
      "reasoning": "Room volume is 144 m³; usable box volume is about 86 m³. Dividing by 0.060 m³ per box gives about 1.4 × 10³ boxes. The assumptions do not justify reporting 1440 as an exact count."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At fixed room size and occupied fraction, doubling each box dimension changes the count by…",
      "options": [
        "A factor of 1/8",
        "A factor of 1/2",
        "A factor of 8"
      ],
      "correct": 0,
      "feedback": [
        "Correct: each box takes 2³ = 8 times as much volume.",
        "That would apply if only one box dimension doubled.",
        "Larger boxes fit fewer times into the same available volume."
      ],
      "hint": "Count how many independent lengths contribute to volume.",
      "teacher": "Ask students to identify the least certain input and explain how its range changes their conclusion."
    }
  },
  "addition": {
    "title": "Relativistic Addition of Velocities",
    "heading": "Velocity changes between frames; vacuum light speed does not.",
    "subtitle": "Relativistic Addition of Velocities",
    "target": "Velocity changes between frames; vacuum light speed does not.",
    "visual": "foundation-velocity",
    "paragraphs": [
      "Choose an inertial station frame S and a craft frame S′ moving at velocity v along the positive x direction. If an object moves at u′ in the craft frame along the same line, its station velocity is u = (u′ + v)/(1 + u′v/c²). The signs describe direction in the chosen coordinates. Speed is the magnitude of velocity; it cannot carry a minus sign.",
      "When both speeds are much smaller than c, the product u′v/c² is tiny and ordinary addition is a good approximation. For a fast craft and fast projectile, the denominator matters. With v = 0.60c and u′ = 0.60c, the result is about 0.882c, not 1.20c. An onboard projectile launched backward can still move forward in the station frame, depending on both signed velocities.",
      "Substituting u′ = c gives u = c; substituting u′ = −c gives u = −c. Source motion does not add to the vacuum light speed. A photon has no inertial rest frame. Do not apply the transformation by setting the craft speed equal to c: the transformation relates physical inertial observers whose relative speed is below c.",
      "Light frequency does change. For motion directly along the line of sight, define β as positive when source and receiver separate. Then f_received / f_source = √[(1 − β)/(1 + β)], while the wavelength ratio is its reciprocal. Recession lowers frequency and increases wavelength; approach does the reverse. This longitudinal Doppler shift combines the motion of source and receiver with clock timing. It is distinct from a change in light’s vacuum speed.",
      "The two explorations use different explicitly labeled sign conventions: positive craft velocity means rightward, while positive separation speed means recession. They describe local inertial comparisons in flat space-time. Cosmological expansion and gravitational frequency shifts require additional context rather than automatic substitution into this special-relativistic Doppler formula."
    ],
    "terms": [
      [
        "relativistic velocity addition",
        "The transformation u = (u′ + v)/(1 + u′v/c²) for collinear velocities between inertial frames."
      ],
      [
        "longitudinal Doppler shift",
        "A change in received frequency due to relative motion along the line of sight."
      ],
      [
        "redshift",
        "A shift to longer received wavelength relative to emitted wavelength."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A source recedes directly at 0.60c and emits a 100 MHz signal in its own frame. Find the received frequency.",
      "reasoning": "The frequency factor is √(0.40/1.60) = 0.50, so the receiver measures 50 MHz. Light still travels at c in vacuum, while its wavelength doubles."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A craft moves right at 0.60c and launches an object left at 0.60c relative to the craft. Its station velocity is…",
      "options": [
        "1.20c left",
        "0.60c right",
        "Zero"
      ],
      "correct": 2,
      "feedback": [
        "The signed numerator cancels rather than adding magnitudes.",
        "The onboard backward launch must be included.",
        "Correct: the numerator is zero, and the denominator is 1 − 0.36 = 0.64."
      ],
      "hint": "Use signed velocities and identify the frame of each one.",
      "teacher": "Ask students to explain why a frequency shift is compatible with invariant light speed."
    }
  },
  "momentum": {
    "title": "Relativistic Momentum",
    "heading": "A speed limit does not create a momentum limit.",
    "subtitle": "Relativistic Momentum",
    "target": "A speed limit does not create a momentum limit.",
    "visual": "foundation-momentum",
    "paragraphs": [
      "For a particle of invariant mass m and velocity v, relativistic momentum is p = γmv, with γ = 1/√(1 − v²/c²). Momentum points with velocity. The Lorentz factor depends on speed squared and is positive, so reversing the velocity reverses momentum while keeping its magnitude unchanged.",
      "At low speeds γ is close to one, recovering p ≈ mv. As a massive particle approaches c, γ grows without bound. Increasing momentum therefore produces a smaller and smaller change in speed near c. This behavior does not require redefining the particle’s invariant mass as a growing mass. Throughout this reader, m means invariant mass.",
      "Momentum conservation still applies to an isolated system, but every particle’s momentum must be calculated in the same inertial frame using the appropriate relativistic expression. Adding velocities first and treating the collection as a single particle generally loses the system’s internal energy and momentum structure. In a collision, include every product, and include radiation when present.",
      "The form F = dp/dt, with force, momentum, and coordinate time measured in one inertial frame, remains useful. At high speeds it does not simplify to m times acceleration with a fixed scalar factor for every direction. An accelerator can continue delivering energy and momentum even though a beam’s speed changes very little. The new momentum is measurable through effects such as magnetic bending and collision products.",
      "The graph compares p/(mc) = γβ with the Newtonian estimate β on one signed scale. It stops below |β| = 1 rather than plotting an infinite endpoint. That boundary is a physical limit for a massive particle, not an optional display setting. State the mass and frame before translating the dimensionless result into SI units."
    ],
    "terms": [
      [
        "relativistic momentum",
        "The vector p = γmv for a particle of invariant mass m."
      ],
      [
        "invariant mass",
        "A particle or system’s mass, independent of the inertial frame used to describe its motion."
      ],
      [
        "isolated system",
        "A system with no net external transfer of the conserved quantity under consideration."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "An electron moves at 0.80c. Use m = 9.11 × 10⁻³¹ kg and c ≈ 3.00 × 10⁸ m/s to find its momentum.",
      "reasoning": "γ = 5/3, so p = (5/3)(9.11 × 10⁻³¹)(0.80)(3.00 × 10⁸) ≈ 3.64 × 10⁻²² kg·m/s. This is 5/3 times the Newtonian estimate at the same velocity."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Reversing a particle from +0.80c to −0.80c changes p/(mc) from…",
      "options": [
        "+4/3 to +4/3",
        "+4/3 to −4/3",
        "+0.80 to −0.80"
      ],
      "correct": 1,
      "feedback": [
        "Momentum is a vector; its direction reverses.",
        "Correct: γ = 5/3 stays the same while the velocity changes sign.",
        "That omits γ at a speed where it matters."
      ],
      "hint": "Keep the sign of velocity and the positive Lorentz factor separate.",
      "teacher": "Ask students why two nearly equal speeds can correspond to substantially different momenta near c."
    }
  },
  "energy": {
    "title": "Relativistic Energy",
    "heading": "Include rest energy and momentum in the same account.",
    "subtitle": "Relativistic Energy",
    "target": "Include rest energy and momentum in the same account.",
    "visual": "foundation-energy",
    "paragraphs": [
      "For a freely moving massive particle, total energy is E = γmc². Rest energy is E₀ = mc², and kinetic energy is K = E − E₀ = (γ − 1)mc². A particle at rest has zero kinetic energy while retaining its rest energy. Energy and momentum depend on the inertial frame, whereas m does not.",
      "At low speeds the kinetic-energy expression approaches ½mv². Near c it grows without bound for fixed nonzero mass. A finite amount of work can bring a massive particle closer to c but cannot make it reach c. Avoid rounding γ to one before subtracting it: for very small speeds, doing so can erase the small kinetic energy you are trying to calculate.",
      "The general energy-momentum relation is E² = (pc)² + (mc²)². It connects three quantities with consistent energy units. For a massless photon it gives E = |p|c. A photon can carry energy and momentum without invariant mass, and it has no rest frame. A single photon in empty space cannot simply become a stationary massive system while conserving both energy and momentum; all participants and interaction conditions matter.",
      "A composite system’s rest energy includes internal energy and binding. If a stationary system stores an extra energy ΔE and no other net energy or momentum is transferred, its mass increases by ΔE/c². A chemical battery therefore has a tiny mass difference between otherwise comparable energy states. In nuclear reactions a larger measurable rest-mass difference can appear as kinetic energy and radiation. Energy conservation accounts for every product rather than treating missing mass as missing energy.",
      "Use the diagram to compare total energy, rest energy, and momentum on consistent normalized scales. The right triangle represents the algebraic relation among energy magnitudes, not a particle trajectory through space. The separate photon case has zero rest-energy leg, while the storage calculation concerns a composite system at rest. These are different physical questions even though both use c²."
    ],
    "terms": [
      [
        "rest energy",
        "E₀ = mc², energy associated with invariant mass."
      ],
      [
        "relativistic kinetic energy",
        "K = (γ − 1)mc² for a freely moving massive particle."
      ],
      [
        "energy-momentum relation",
        "E² = (pc)² + (mc²)², relating total energy, momentum magnitude, and invariant mass."
      ]
    ],
    "worked": {
      "title": "Reason from the evidence",
      "prompt": "A particle has pc = 3 MeV and mc² = 4 MeV. Find E and K.",
      "reasoning": "E = √(3² + 4²) = 5 MeV, and K = 5 − 4 = 1 MeV. Subtracting rest energy, rather than momentum energy pc, gives kinetic energy."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "For the same 3–4–5 energy triangle, what is the kinetic energy?",
      "options": [
        "1 MeV",
        "3 MeV",
        "5 MeV"
      ],
      "correct": 0,
      "feedback": [
        "Correct: K = E − mc² = 5 − 4.",
        "pc is not generally the kinetic energy.",
        "5 MeV is total energy, including rest energy."
      ],
      "hint": "Separate the total-energy hypotenuse from the rest-energy leg.",
      "teacher": "Ask students to add radiation to a reaction account and explain why massless does not mean energyless."
    }
  }
} satisfies Record<string,LessonContent>
