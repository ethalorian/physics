import type {LessonContent} from './lesson-contract'
export const waveOpticsLessons:Record<string,LessonContent> = {
  "huygens": {
    "title": "Huygens’ principle",
    "heading": "Build the next wavefront from many contributions.",
    "subtitle": "Huygens’ principle",
    "target": "Build the next wavefront from many contributions.",
    "visual": "huygens-optics",
    "paragraphs": [
      "A wavefront joins points that share a phase of an advancing wave. Huygens’ construction treats points on one wavefront as sources of secondary wavelets. After a short time, the forward envelope of those wavelets locates the next wavefront. The drawn points are samples of a continuous field, not a claim that the medium contains a row of tiny lamps.",
      "For a plane wave in a uniform medium, each point advances by the same distance vΔt. Their envelope is another parallel plane. For an expanding spherical wave, the next front has a larger radius. Over a small region very far from the source, that curved surface is well approximated by a plane. Rays indicate the propagation direction and are perpendicular to fronts in a uniform isotropic medium.",
      "At a boundary, different parts of a front encounter the new medium at different times. Changing their propagation speed changes the front’s direction. This construction connects refraction to the wave picture and agrees with Snell’s law. A reflected front can likewise be constructed consistently with the angle law.",
      "An aperture restricts which parts of the incoming field contribute beyond a barrier. Contributions still spread and overlap, so a sharp geometrical shadow is only an approximation. The simple envelope construction locates fronts; quantitative diffraction intensity also requires relative phases, amplitudes, and an appropriate propagation model. Move the time control and distinguish distance traveled from a change in wavelength."
    ],
    "terms": [
      [
        "wavefront",
        "A surface joining points with the same wave phase."
      ],
      [
        "Huygens’ principle",
        "A wavefront construction using secondary wavelets and their forward envelope."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "A plane wave advances for 2 ns in vacuum. How far does the front move?",
      "reasoning": "vΔt ≈ (3 × 10⁸ m/s)(2 × 10⁻⁹ s) = 0.60 m. Its direction and wavelength have not changed."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "In a uniform medium, a plane wavefront’s forward envelope is…",
      "options": [
        "Another parallel plane",
        "A set of unrelated new sources with random frequencies",
        "A surface that must turn toward the nearest observer"
      ],
      "correct": 0,
      "feedback": [
        "Correct: all parts advance at the same speed for the same time.",
        "Wavelets represent the same advancing field, not random added sources.",
        "An observer does not determine the propagation direction."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. all parts advance at the same speed for the same time."
    }
  },
  "diffraction": {
    "title": "Diffraction",
    "heading": "Compare wavelength with the opening before predicting spreading.",
    "subtitle": "Diffraction",
    "target": "Compare wavelength with the opening before predicting spreading.",
    "visual": "single-optics",
    "paragraphs": [
      "Diffraction is the spreading and redistribution of a wave when its propagation is constrained by an opening, edge, or obstacle. It follows from the superposition of contributions from different parts of the field. There is no sudden point at which diffraction turns on; its practical importance depends on wavelength, geometry, and what detail you are trying to predict.",
      "For a uniformly illuminated narrow slit in the far field, the first dark directions satisfy a sin θ = ±λ, where a is slit width and λ is the wavelength in the surrounding medium. A wider slit produces a narrower central peak. A longer wavelength gives a broader peak for the same slit. If a is smaller than λ, no first dark minimum occurs at a propagating angle, even though the transmitted field still spreads.",
      "The plotted profile is normalized to its central peak. That normalization isolates shape; it does not imply that narrowing a real slit transmits the same total power. A screen farther away spreads the same angular pattern over a wider physical area. Separate angular width, screen width, and received energy when comparing experiments.",
      "Diffraction helps waves reach regions that a ray-only model would call shadow. It also limits the separation of nearby details in conventional imaging. Increasing magnification alone cannot recover spatial information that an optical system has failed to transmit. Specialized imaging methods can use additional information, so the ordinary far-field limit should not be treated as a ban on every possible measurement."
    ],
    "terms": [
      [
        "diffraction",
        "Wave spreading and interference caused by constrained propagation."
      ],
      [
        "central maximum",
        "The bright central region between the first dark minima of a diffraction pattern."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "For a = 10λ, estimate the first minimum angle.",
      "reasoning": "sin θ = 1/10, so θ ≈ 5.74°. Doubling the slit width halves sin θ for this minimum."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "At fixed wavelength, a narrower slit usually produces…",
      "options": [
        "A narrower central diffraction peak",
        "A higher source frequency",
        "A broader central diffraction peak"
      ],
      "correct": 2,
      "feedback": [
        "That is the trend for a wider slit.",
        "Changing an aperture does not change the source frequency.",
        "Correct: the characteristic angular scale grows as λ/a."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the characteristic angular scale grows as λ/a."
    }
  },
  "interference": {
    "title": "Interference",
    "heading": "Add fields before comparing intensities.",
    "subtitle": "Interference",
    "target": "Add fields before comparing intensities.",
    "visual": "phase-optics",
    "paragraphs": [
      "When waves overlap in a linear system, their instantaneous disturbances add. For light, the relevant additions are electric and magnetic fields. A detector typically records a time-averaged intensity proportional to the squared field amplitude. Adding intensities first would miss the cross term responsible for interference.",
      "For two waves of the same frequency and compatible polarization, I = I₁ + I₂ + 2√(I₁I₂) cos φ when their relative phase φ is stable. In-phase waves reinforce. Waves half a cycle apart oppose. Complete cancellation at one position requires equal amplitudes as well as the correct phase difference. Unequal waves leave a nonzero minimum.",
      "A dark fringe does not destroy energy or prove that no light was emitted. Interference redirects the spatial distribution of energy; bright and dark regions belong to the whole pattern. A stable pattern requires sufficient coherence over the relevant paths and observation time. If relative phase fluctuates rapidly, the detector averages the interference term toward zero.",
      "Use the model to vary phase and the second wave’s amplitude independently. The two input traces are signed fields; the resulting intensity is nonnegative. State whether a claim concerns field amplitude, local intensity, or total power. The model assumes matching polarization and a common frequency, so it does not predict interference between arbitrary unrelated light sources."
    ],
    "terms": [
      [
        "interference",
        "The effect of overlapping wave amplitudes on the resulting field and intensity."
      ],
      [
        "coherence",
        "A sufficiently predictable phase relationship over the paths and times being compared."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "Two equal waves each have intensity I₀. Compare local intensity at phase 0 and π.",
      "reasoning": "The summed amplitudes are 2A and 0, giving 4I₀ and 0 locally. Energy is redistributed across the complete pattern."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "Equal-frequency waves differ by half a cycle but have unequal amplitudes. Their minimum intensity is…",
      "options": [
        "Negative",
        "Nonzero",
        "Always exactly zero"
      ],
      "correct": 1,
      "feedback": [
        "Measured intensity cannot be negative.",
        "Correct: the larger field is not completely canceled.",
        "Zero requires equal amplitudes too."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the larger field is not completely canceled."
    }
  },
  "young": {
    "title": "Young’s interference experiment",
    "heading": "Turn path difference into a fringe prediction.",
    "subtitle": "Young’s interference experiment",
    "target": "Turn path difference into a fringe prediction.",
    "visual": "double-optics",
    "paragraphs": [
      "Two narrow slits illuminated by the same coherent source can send waves to the same screen position. Their path lengths differ. In the far field, the difference is approximately d sin θ, where d is slit separation and θ is the viewing angle from the central direction. The phase difference is 2π times that path difference divided by wavelength.",
      "Constructive interference occurs at d sin θ = mλ for integer m. Destructive interference for equal slit amplitudes occurs halfway between successive orders: d sin θ = (m + 1/2)λ. Near the center of a distant screen, y ≈ Lθ gives fringe spacing Δy ≈ λL/d. Increasing wavelength or screen distance spreads the fringes; increasing slit separation compresses them.",
      "Real slits have finite width, so their interference fringes sit inside a single-slit diffraction envelope. The model includes both factors. It uses the far-field approximation and calculates screen angle from position rather than assuming every angle is tiny. Its displayed small-angle fringe spacing is a useful central estimate, not a promise of equal spacing all the way across the screen.",
      "Stable phase matters as much as geometry. Two independent ordinary lamps do not usually produce a stable visible fringe pattern because their phase difference changes during observation. White-light illumination overlays wavelength-dependent patterns. Changing a control should begin with a prediction about spacing or envelope width, followed by an explanation using the correct distance."
    ],
    "terms": [
      [
        "path difference",
        "The difference between two propagation path lengths to the same observation point."
      ],
      [
        "interference order",
        "The integer number of wavelength differences at a constructive fringe."
      ],
      [
        "fringe spacing",
        "The separation between adjacent bright or dark fringes near a specified screen region."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "Use λ = 500 nm, L = 2 m, and d = 0.10 mm near the screen center.",
      "reasoning": "Δy ≈ λL/d = 0.010 m = 1.0 cm. Doubling d halves this spacing."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "Double slit separation while holding wavelength and screen distance fixed. Central fringe spacing…",
      "options": [
        "Halves",
        "Doubles",
        "Stays fixed because frequency stays fixed"
      ],
      "correct": 0,
      "feedback": [
        "Correct: Δy is inversely proportional to d.",
        "That would follow from doubling λ or L.",
        "Frequency can stay fixed while path geometry changes."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. Δy is inversely proportional to d."
    }
  },
  "film": {
    "title": "Interference from thin films",
    "heading": "Count propagation phase and reflection phase.",
    "subtitle": "Interference from thin films",
    "target": "Count propagation phase and reflection phase.",
    "visual": "film-optics",
    "paragraphs": [
      "A thin transparent film can return light from more than one interface. The reflected contributions travel different optical paths and can carry different reflection phase shifts. Their superposition makes reflectance depend on wavelength and film thickness. The resulting color is structural: it need not come from colored pigment in the film.",
      "At normal incidence, the round-trip propagation phase in a film is 4πnt/λ₀, where n is film index, t is thickness, and λ₀ is vacuum wavelength. A reflected electric field reverses sign when light reflects toward a higher-index nonabsorbing medium. Reflection toward lower index does not have that same sign reversal. Count both interfaces before selecting a constructive or destructive condition.",
      "For a soap-like film surrounded by air, one of the two first reflected waves reverses sign. In the limit of zero thickness, the reflected contributions cancel. At approximately quarter-wave optical thickness, reflection is enhanced for the selected wavelength. A coating on glass has a different second boundary, so its cancellation condition and residual reflection must be evaluated for that index arrangement.",
      "The model computes normal-incidence reflectance including repeated internal reflections for ideal lossless media. It plots a spectrum rather than assigning a supposedly exact screen color. Real appearance also depends on illumination, angle, absorption, thickness variation, and the observer. The same physical thickness can therefore produce different appearances under different viewing conditions without changing the material itself."
    ],
    "terms": [
      [
        "thin-film interference",
        "Interference between contributions reflected or transmitted at closely spaced interfaces."
      ],
      [
        "optical path length",
        "Geometrical path length multiplied by refractive index in a uniform medium."
      ],
      [
        "reflection phase shift",
        "A phase change of the reflected field determined by the interface."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "For a film with n = 1.33 in air, estimate the first reflection maximum at λ₀ = 532 nm.",
      "reasoning": "With one relative reflection reversal, 2nt = λ₀/2 gives t = λ₀/(4n) = 100 nm."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "Why is a vanishingly thin soap film dark in reflection?",
      "options": [
        "Its molecules must become black pigment",
        "Its transmitted light must also vanish",
        "Its reflected fields approach cancellation"
      ],
      "correct": 2,
      "feedback": [
        "The effect is interference rather than newly created pigment.",
        "For a lossless film, reduced reflection means increased transmission.",
        "Correct: the relative reflection phase matters even when propagation distance is tiny."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the relative reflection phase matters even when propagation distance is tiny."
    }
  },
  "laser": {
    "title": "Laser light",
    "heading": "Connect stimulated emission, coherence, and a finite beam.",
    "subtitle": "Laser light",
    "target": "Connect stimulated emission, coherence, and a finite beam.",
    "visual": "laser-optics",
    "paragraphs": [
      "A laser amplifies light through stimulated emission. An appropriate incoming field can stimulate an excited system to emit into the same optical mode. Pumping supplies energy and maintains a population distribution that supports amplification. Many lasers use a resonator to provide feedback and select modes; an output coupler allows part of the circulating light to leave.",
      "Coherence describes a predictable phase relationship across distance or time. It is different from simply calling light one color. A narrow range of frequencies often supports a longer coherence time, but spatial mode structure also matters. Two points across a beam and two times along it pose different coherence questions. Practical lasers have finite linewidth, noise, and mode-dependent behavior.",
      "A laser does not create energy. In steady operation, optical output plus heating and other output channels must be supplied by the input. Efficiency varies across devices, so no single small percentage describes all lasers. A narrow beam can deliver substantial intensity to a small area even when its total power is modest; beam width and power are separate quantities.",
      "Laser beams also diffract. In an ideal Gaussian beam, a smaller waist gives a larger far-field divergence, approximately θ = λ/(πw₀). The displayed beam radius and Rayleigh range follow this model. Changing the waist shows why perfect collimation for a finite beam is not possible in ordinary free-space propagation. Coherence enables controlled interference; it does not eliminate wave superposition or diffraction."
    ],
    "terms": [
      [
        "stimulated emission",
        "Emission induced by a matching field into the corresponding optical mode."
      ],
      [
        "population inversion",
        "A population distribution supporting net stimulated amplification between relevant levels."
      ],
      [
        "beam waist",
        "The location and radius of the narrowest cross section of a Gaussian beam."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "A 532 nm ideal Gaussian beam has waist radius 0.50 mm. Estimate its far-field half-angle.",
      "reasoning": "θ = λ/(πw₀) ≈ 0.339 mrad. Reducing the waist radius by half doubles this angle."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "Can a coherent finite laser beam diffract?",
      "options": [
        "Only after its frequency changes",
        "Yes; coherence does not remove diffraction",
        "No; all coherent beams have zero divergence"
      ],
      "correct": 1,
      "feedback": [
        "The beam can spread at a fixed frequency.",
        "Correct: the finite spatial field still spreads under propagation.",
        "Finite width and zero divergence are incompatible in this free-space model."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the finite spatial field still spreads under propagation."
    }
  },
  "hologram": {
    "title": "The hologram",
    "heading": "Use a reference wave to encode phase information.",
    "subtitle": "The hologram",
    "target": "Use a reference wave to encode phase information.",
    "visual": "hologram-optics",
    "paragraphs": [
      "A conventional intensity image records how much light reaches each detector location. A holographic recording instead superposes an object wave with a reference wave. The recorded intensity includes a cross term that depends on their phase difference. Relative phase information is therefore encoded in a measurable fringe pattern without requiring a detector to measure the rapidly oscillating field directly.",
      "Changing the object’s position changes its wavefront curvature and its phase relative to the reference. The recorded pattern changes accordingly. During suitable reconstruction, diffraction from the recording can produce a wave with the form of the original object wave. An observer can receive different perspectives from different positions, creating depth cues and parallax.",
      "The model isolates this encoding step in one dimension. It combines an ideal point-object wave with an oblique plane reference, keeps their amplitudes equal, and displays the normalized intensity across a recording line. Moving the point changes fringe curvature. This is an instructional interference record, not a complete rendered three-dimensional hologram or a simulation of photographic chemistry.",
      "A smaller piece of a hologram can retain information from many parts of an object because object light reaches an extended recording area. However, cutting the aperture reduces the available light, viewing range, and resolution; unlimited cutting does not preserve full quality. Reconstruction also depends on wavelength and geometry. Distinguish the recorded fringes, the reconstructing illumination, and the perceived image when explaining how the method works."
    ],
    "terms": [
      [
        "hologram",
        "A recording that encodes an object wave through interference with a reference."
      ],
      [
        "reference wave",
        "A known or controlled wave superposed with an object wave."
      ],
      [
        "parallax",
        "A change in apparent relative position caused by changing viewpoint."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "An object moves while the reference path stays fixed. Why can the recorded fringes change?",
      "reasoning": "The object-wave optical path and phase change, altering the interference cross term even if its individual intensity stays similar."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "What makes phase information appear in an intensity hologram?",
      "options": [
        "Interference with the reference wave",
        "An ordinary detector directly following every optical field oscillation",
        "The object emitting a new color at every depth"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the cross term depends on relative phase.",
        "Ordinary recording measures averaged intensity, not optical-cycle motion.",
        "Depth can be encoded without assigning a new wavelength to each point."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the cross term depends on relative phase."
    }
  },
  "grating": {
    "title": "Multiple-slit diffraction",
    "heading": "Separate the location of an order from its width.",
    "subtitle": "Multiple-slit diffraction",
    "target": "Separate the location of an order from its width.",
    "visual": "grating-optics",
    "paragraphs": [
      "A diffraction grating combines light from many regularly spaced slits or grooves. In a direction where neighboring contributions differ in path by an integer number of wavelengths, all ideal equal contributions reinforce. For normal incidence, the principal maxima satisfy d sin θ = mλ, where d is the spacing between adjacent elements and m is the order.",
      "Adding more illuminated slits makes the principal peaks narrower while retaining their angular locations for the same d and λ. At many directions between peaks, the contributions nearly cancel. The model displays the normalized array factor for N equally illuminated, negligibly narrow slits. A real slit-width envelope, efficiency variation, and imperfect illumination can reduce or reshape particular orders.",
      "Different wavelengths reach the same order at different angles, allowing a grating to separate spectral components. Only orders with |mλ/d| ≤ 1 can propagate. The zero order remains at θ = 0 for every wavelength in this ideal normal-incidence arrangement. Different combinations of order and wavelength can overlap, so interpreting a spectrum requires identifying the order.",
      "Peak separation and peak width are different measures. Changing slit spacing moves the order angles; changing the number of illuminated slits mainly changes sharpness. In the ideal limit, resolving power grows with illuminated slit count and order. The graph is normalized to the central peak and does not imply that increasing the number of illuminated slits leaves total transmitted power fixed."
    ],
    "terms": [
      [
        "diffraction grating",
        "An array of regularly spaced elements that produces wavelength-dependent interference maxima."
      ],
      [
        "principal maximum",
        "A direction in which the contributions from all ideal grating elements reinforce."
      ],
      [
        "resolving power",
        "A measure of the ability to distinguish nearby wavelengths or details."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "Use d = 2.0 μm and λ = 0.50 μm. Locate the first order.",
      "reasoning": "sin θ = λ/d = 0.25, so θ ≈ 14.5°. Orders beyond |m| = 4 cannot propagate in this ideal geometry."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "Increase illuminated slit count without changing spacing or wavelength. Principal peaks…",
      "options": [
        "All move to twice their original angle",
        "Disappear because only two waves can interfere",
        "Become narrower at the same order angles"
      ],
      "correct": 2,
      "feedback": [
        "Their directions are set by d sin θ = mλ.",
        "Superposition applies to many coherent contributions.",
        "Correct: additional phase contributions sharpen the array maxima."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. additional phase contributions sharpen the array maxima."
    }
  },
  "resolution": {
    "title": "Limits of resolution: the Rayleigh criterion",
    "heading": "Compare two point-spread patterns before claiming two objects.",
    "subtitle": "Limits of resolution: the Rayleigh criterion",
    "target": "Compare two point-spread patterns before claiming two objects.",
    "visual": "resolution-optics",
    "paragraphs": [
      "A finite circular aperture does not form an infinitely sharp image of a distant point source. Diffraction spreads its intensity into a central Airy disk and weaker rings. Two nearby points therefore produce overlapping patterns. Magnifying the detector image enlarges those patterns as well as their separation; it does not automatically make the original optical information more distinct.",
      "For two equally bright incoherent point sources and an ideal circular aperture, the Rayleigh criterion places the center of one pattern at the first minimum of the other. Their angular separation is approximately θR = 1.22λ/D, with aperture diameter D. A larger aperture or shorter wavelength reduces this angular scale. This is a useful conventional criterion with stated assumptions, not a universal threshold for every estimator or imaging method.",
      "The model adds the intensities of two incoherent point sources. It does not add their fields, because there is no stable relative phase between them. Each individual central peak has normalized height one. Moving the separation control shows how a single broad profile develops a dip as the two contributions become more distinguishable. The horizontal coordinate is an angular scale, not a physical detector distance.",
      "Real resolution also depends on noise, aberrations, focus, sampling, atmospheric blur, and source brightness differences. In microscopy, numerical aperture describes the accepted cone and medium; a commonly used lateral scale is about 0.61λ/NA. State the optical setup and criterion before translating a small number into a claim that an instrument can see a specific feature."
    ],
    "terms": [
      [
        "Airy pattern",
        "The diffraction intensity pattern of an ideal uniformly illuminated circular aperture."
      ],
      [
        "Rayleigh criterion",
        "A conventional separation criterion using one point pattern’s maximum and the other’s first minimum."
      ],
      [
        "numerical aperture",
        "The product n sin α for the refractive index and accepted half-angle of a lens."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "For λ = 550 nm and D = 0.10 m, estimate the Rayleigh angular scale.",
      "reasoning": "θR ≈ 6.71 × 10⁻⁶ rad, or about 1.38 arcseconds. Doubling D halves that ideal angular scale."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "Why does the two-source model add intensities?",
      "options": [
        "Intensity can be negative at dark points",
        "The two sources are mutually incoherent",
        "Light fields can never interfere"
      ],
      "correct": 1,
      "feedback": [
        "Each intensity contribution is nonnegative.",
        "Correct: the relative-phase cross term averages away.",
        "Coherent fields can interfere; source assumptions matter."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the relative-phase cross term averages away."
    }
  },
  "polarization": {
    "title": "Polarization",
    "heading": "Follow field orientation through interfaces and materials.",
    "subtitle": "Polarization",
    "target": "Follow field orientation through interfaces and materials.",
    "visual": "polarization-extended",
    "paragraphs": [
      "Polarization specifies the orientation behavior of the transverse electric field. An ideal linear polarizer transmits the component along its transmission axis. For already linearly polarized light, Malus’s law gives I = Iin cos² θ, where θ is the angle between the incoming polarization and the axis. An ideal first polarizer transmits half of unpolarized light’s intensity.",
      "Reflection can favor one polarization over another. At Brewster’s angle for an ideal interface between nonabsorbing dielectrics, the reflected component polarized in the plane of incidence vanishes. The angle obeys tan θB = n₂/n₁. This does not mean that every reflected ray at every angle has the same complete polarization, or that the transmitted beam necessarily carries only one polarization.",
      "Materials can also change polarization during propagation. Optical activity rotates the plane of linear polarization in suitable conditions. Birefringence gives different phase velocities to different polarization modes and can change the state to elliptical polarization. These effects should not all be described as simple absorption. A polarizer following the material converts some of that polarization change into an intensity change.",
      "The models separate three cases: projection through ideal polarizers, Brewster reflection geometry, and an ideal polarization rotator between crossed axes. In the last case, a material can restore transmitted light between otherwise crossed polarizers because it changes the state arriving at the analyzer. Actual liquid-crystal displays and stress measurements involve device-specific wavelength and material behavior beyond this simplified rotation model."
    ],
    "terms": [
      [
        "Malus’s law",
        "The cos² dependence of transmitted intensity for a linear polarizer and polarized input."
      ],
      [
        "Brewster’s angle",
        "An incidence angle where ideal dielectric reflection of the p-polarized component vanishes."
      ],
      [
        "birefringence",
        "Different optical phase velocities for different polarization modes in a material."
      ],
      [
        "optical activity",
        "Rotation of the plane of linear polarization during propagation through an appropriate medium."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "An ideal rotator turns the output of a first polarizer by 45° before a crossed analyzer. The original input is unpolarized.",
      "reasoning": "The first polarizer leaves I₀/2. The analyzer passes cos²45° = 1/2 of that, giving I₀/4. This differs from adding a lossy intermediate polarizer."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "At Brewster’s angle, which reflected component vanishes in the ideal dielectric model?",
      "options": [
        "The component polarized in the plane of incidence",
        "Both reflected polarization components at all angles",
        "The magnetic field while the electric field remains alone"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the reflected p component is zero at that angle.",
        "The s component can still reflect.",
        "A propagating electromagnetic wave contains related electric and magnetic fields."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. the reflected p component is zero at that angle."
    }
  },
  "microscopy": {
    "title": "Microscopy enhanced by wave characteristics",
    "heading": "Distinguish contrast, sectioning, and resolution.",
    "subtitle": "Microscopy enhanced by wave characteristics",
    "target": "Distinguish contrast, sectioning, and resolution.",
    "visual": "phase-contrast",
    "paragraphs": [
      "A transparent specimen can alter light’s phase without strongly absorbing it. A bright-field image may then show little contrast even though the optical path differs across the sample. Interference methods compare the specimen field with a reference or modified background field so that phase differences produce visible intensity differences.",
      "For a uniform thickness t and index difference Δn, the optical path difference is approximately Δn t and the phase delay is φ = 2πΔn t/λ₀. An ideal two-beam comparison gives intensity proportional to 2 + 2 cos(φ + β), where β is a controlled reference bias. Near a quadrature bias, small phase changes cause a first-order intensity change. The displayed model demonstrates this principle; it is not a full design of a Zernike phase plate.",
      "Other methods answer different imaging questions. Polarization microscopy highlights polarization changes in suitable specimens. Confocal microscopy uses a focused illumination and detection arrangement, including a conjugate pinhole, to reject much of the out-of-focus light. Scanning through positions and depths produces optical sections. That improvement in sectioning is different from simply increasing magnification or promising unlimited lateral resolution.",
      "Spectroscopic microscopy can add information from wavelength-dependent signals, including characteristic Raman shifts. A brighter or more colorful image alone does not establish chemical identity without calibration and interpretation. Compare each method by the information it measures: amplitude, phase, polarization, depth, or spectrum. Contrast enhancement helps reveal existing differences; resolution describes the ability to separate nearby details."
    ],
    "terms": [
      [
        "phase contrast",
        "Conversion of optical phase differences into observable intensity differences."
      ],
      [
        "confocal microscopy",
        "Imaging that uses conjugate illumination and detection to suppress much out-of-focus signal."
      ],
      [
        "contrast",
        "A measurable difference between a feature’s signal and its surrounding background."
      ]
    ],
    "worked": {
      "title": "Build the wave explanation",
      "prompt": "Use Δn = 0.01, t = 10 μm, and λ₀ = 500 nm. Estimate phase delay.",
      "reasoning": "The optical path difference is 0.10 μm, so φ = 2π(0.10/0.50) = 0.4π radians. A reference can convert that delay into intensity contrast."
    },
    "check": {
      "title": "Predict the wave pattern",
      "prompt": "A phase object looks uniform in an ideal intensity-only view. This proves…",
      "options": [
        "That it has no optical effect whatsoever",
        "That increasing display magnification must reveal its phase",
        "Neither that it has no structure nor that its phase is uniform"
      ],
      "correct": 2,
      "feedback": [
        "Optical path changes can be invisible to that measurement.",
        "A measurement that converts phase to intensity is needed.",
        "Correct: a specimen can change phase without appreciable absorption."
      ],
      "hint": "Compare the phase difference, path geometry, and the quantity plotted.",
      "teacher": "Ask the student to explain the phase relationship and predict a changed condition. a specimen can change phase without appreciable absorption."
    }
  }
}
