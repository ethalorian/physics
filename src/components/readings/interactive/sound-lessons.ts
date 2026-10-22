import type { LessonContent } from './lesson-contract'
export const soundLessons = {
  "origin": {
    "title": "The origin of sound",
    "heading": "Connect vibration to a pressure disturbance.",
    "subtitle": "The origin of sound",
    "target": "Connect vibration to a pressure disturbance.",
    "visual": "pressure-wave",
    "paragraphs": [
      "A vibrating speaker cone alternately pushes on the air and retreats from it. This creates pressure changes that spread through the surrounding air. A struck tuning fork and a plucked string use different mechanical motions, but both can drive a disturbance in a medium that eventually reaches a receiver.",
      "For a steady tone, frequency strongly influences perceived pitch. A faster repeating pressure variation generally sounds higher in pitch. Amplitude is a separate property and is more closely related to intensity. A louder tone need not have a higher frequency, and increasing pitch need not make a sound louder.",
      "Human hearing is often introduced with an approximate range from 20 Hz to 20 kHz for young listeners. Actual thresholds vary with frequency, level, age, and individual hearing. Infrasonic and ultrasonic label frequencies below and above this conventional range; they are still mechanical disturbances whether a particular listener hears them or not.",
      "Complex sounds contain many frequency components. Their relative strengths and time evolution contribute to timbre, which helps distinguish instruments playing the same note. Follow the organized air motion in the diagram. The pressure signal propagates while each parcel oscillates locally; neither the instrument nor a parcel of air must travel to the listener."
    ],
    "terms": [
      [
        "pitch",
        "A perceptual quality strongly associated with sound frequency."
      ],
      [
        "timbre",
        "The sound quality shaped by its frequency components and their evolution."
      ],
      [
        "ultrasound",
        "Sound above the conventional upper audible frequency of about 20 kHz."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Two steady tones have frequencies 250 Hz and 500 Hz at comparable intensity.",
      "reasoning": "The 500 Hz tone generally has higher pitch. Comparable intensity does not make their pitches equal."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Increasing a tone’s amplitude at unchanged frequency mainly changes…",
      "options": [
        "Its intensity",
        "Its propagation speed in the same linear medium",
        "Its frequency"
      ],
      "correct": 0,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Correct: intensity depends on amplitude, while frequency remains fixed.",
        "Small-amplitude sound speed is determined by the medium.",
        "The premise holds frequency fixed."
      ],
      "teacher": "The 500 Hz tone generally has higher pitch. Comparable intensity does not make their pitches equal. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "media": {
    "title": "Media that transmit sound",
    "heading": "Identify the mechanical connection.",
    "subtitle": "Media that transmit sound",
    "target": "Identify the mechanical connection.",
    "visual": "sound-speed",
    "paragraphs": [
      "Sound can travel through gases, liquids, and solids because neighboring parts of those materials exert forces on one another. A vibrating surface creates local motion and stress changes; the material's elasticity provides the restoring response and its inertia resists acceleration. A vacuum provides no material chain for an ordinary sound wave.",
      "Seeing a vibrating object does not guarantee hearing it. Light from a bell can cross an evacuated space, while its mechanical sound requires a transmitting path. In real apparatus, residual gas and solid supports can still carry some vibration, so an evacuation demonstration approaches an ideal rather than removing every possible path instantly.",
      "Propagation speed depends on stiffness and density together. For a fluid, v = √(B/ρ), where B is the appropriate bulk modulus and ρ is density. A thin elastic rod has a related longitudinal approximation involving Young's modulus. It is inaccurate to say density never matters, or that a denser material must always transmit sound more slowly.",
      "Many solids transmit sound faster than air because their much greater stiffness outweighs their larger density. A wave reaching an interface can reflect and transmit; speed alone does not determine how much energy gets through. Use the model to vary stiffness at fixed density, then density at fixed stiffness, and keep those comparisons separate from changing to a completely different material."
    ],
    "terms": [
      [
        "bulk modulus",
        "Resistance to a fractional volume change under pressure."
      ],
      [
        "acoustic medium",
        "Material that carries mechanical sound disturbances."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Two model fluids have the same density, but B doubles in the second.",
      "reasoning": "Its sound speed increases by √2 because v = √(B/ρ). Both material properties must be considered."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Can ordinary sound propagate across a perfect vacuum?",
      "options": [
        "Yes, because light does",
        "No, it needs a mechanical medium",
        "Only if its frequency is high enough"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Light is electromagnetic; sound is mechanical.",
        "Correct: no material is present to transmit the disturbance.",
        "Higher frequency does not supply a missing medium."
      ],
      "teacher": "Its sound speed increases by √2 because v = √(B/ρ). Both material properties must be considered. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "speed": {
    "title": "Speed of sound",
    "heading": "Separate temperature, frequency, and travel time.",
    "subtitle": "Speed of sound",
    "target": "Separate temperature, frequency, and travel time.",
    "visual": "sound-speed",
    "paragraphs": [
      "A flash and a sound produced together can arrive at different times. Light crosses everyday distances much faster than sound in air, so a measured sound delay can estimate distance. For a direct path through nearly uniform air, d ≈ vt. An echo makes a round trip and requires dividing the total travel distance by two.",
      "The small-disturbance speed in an ideal gas is v = √(γRT/M), using absolute temperature, molar mass M, and heat-capacity ratio γ. For dry air near ordinary room temperatures, v ≈ 331 + 0.60T°C m/s is a useful approximation. It is not a formula for liquids, solids, arbitrary temperatures, or changing gas composition.",
      "In the same ordinary air, high and low audible notes travel at nearly the same speed. Their wavelengths differ: λ = v/f. Higher frequency means more cycles per second and a shorter wavelength, not an earlier arrival simply because the note is higher. Wind changes propagation relative to the ground and temperature gradients can bend paths.",
      "Use the air-temperature setting to compare delay and wavelength. Then switch to the stiffness-density comparison to see why a universal speed based only on density is inadequate. Each calculation assumes a uniform medium and a small-amplitude disturbance; shock propagation needs a different treatment."
    ],
    "terms": [
      [
        "sound speed",
        "Propagation speed of a small pressure disturbance in a specified medium."
      ],
      [
        "echo",
        "A reflected sound received after traveling to a reflector and back."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An echo returns after 0.40 s in air with v = 340 m/s. How far away is the wall?",
      "reasoning": "d = vt/2 = 68 m. The sound traveled 136 m in total."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A high and a low note are emitted together in the same ordinary air. Which travels faster?",
      "options": [
        "The higher note",
        "The lower note",
        "They have approximately equal speeds"
      ],
      "correct": 2,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Frequency changes wavelength, not the fixed-medium speed.",
        "Low frequency does not imply a greater speed here.",
        "Correct under the stated nondispersive approximation."
      ],
      "teacher": "d = vt/2 = 68 m. The sound traveled 136 m in total. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "level": {
    "title": "Loudness and sound level",
    "heading": "Read a logarithmic comparison correctly.",
    "subtitle": "Loudness and sound level",
    "target": "Read a logarithmic comparison correctly.",
    "visual": "sound-level",
    "paragraphs": [
      "Intensity measures energy transferred per second through a unit area, in watts per square meter. Loudness is a perception influenced by intensity, frequency, duration, and the listener. Decibels specify a logarithmic level relative to a reference; a decibel is not the SI unit of intensity itself.",
      "The intensity level is β = 10 log₁₀(I/I₀), often with I₀ = 10⁻¹² W/m² for an introductory sound comparison. Raising level by 10 dB multiplies intensity by ten. A 20 dB rise multiplies it by one hundred. A 0 dB level means equality with the chosen reference, not zero sound energy.",
      "For a plane sinusoidal wave in the same medium, intensity is proportional to squared pressure amplitude. Doubling that amplitude multiplies intensity by four and raises level by about 6 dB. Two independent equal sources add intensities, giving about 3 dB more; coherent sources require interference analysis instead.",
      "For an ideal source radiating uniformly into open space, I = P/(4πr²). Doubling distance quarters intensity and lowers level by about 6 dB. Rooms, reflections, absorption, and directionality can change that result. The explorer calculates a level comparison without playing audio. It is not a calibrated hearing test or a way to determine a safe exposure from a screen value."
    ],
    "terms": [
      [
        "intensity",
        "Power transferred through unit area, measured in W/m²."
      ],
      [
        "decibel",
        "A unit for a logarithmic level relative to a specified reference."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare sounds at 60 dB and 80 dB using the same intensity reference.",
      "reasoning": "The 20 dB difference means an intensity ratio of 10² = 100. It does not establish a universal ratio of perceived loudness."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A 10 dB rise means intensity increases by…",
      "options": [
        "A factor of 2",
        "A factor of 10",
        "10 W/m² in every case"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Decibels are logarithmic, not a direct doubling count.",
        "Correct: 10 log₁₀(10) = 10 dB.",
        "The absolute change depends on the starting intensity."
      ],
      "teacher": "The 20 dB difference means an intensity ratio of 10² = 100. It does not establish a universal ratio of perceived loudness. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "natural": {
    "title": "Natural frequency",
    "heading": "Connect free vibration to stiffness and inertia.",
    "subtitle": "Natural frequency",
    "target": "Connect free vibration to stiffness and inertia.",
    "visual": "spring-oscillator",
    "paragraphs": [
      "Pluck a string or tap a ruler and then stop driving it. The object responds with its own characteristic free motions. These natural modes have frequencies set by the object's material, geometry, constraints, and inertia. Different objects can therefore produce different sounds even when struck in a similar way.",
      "A single ideal mass on a spring has angular frequency ω₀ = √(k/m), ordinary frequency f₀ = ω₀/(2π), and period T = 2π√(m/k). A stiffer spring restores the mass more strongly and speeds up the cycle. A larger mass supplies more inertia and slows it. Small oscillations are assumed, with a linear spring and negligible damping.",
      "Real objects usually have many modes. A string's fundamental and overtones form one familiar family; a bell's modes need not be exact integer multiples of one lowest frequency. The way an object is struck determines how strongly each mode begins, while losses determine how quickly each one fades.",
      "Change mass and stiffness in the explorer, then move through one cycle. At maximum displacement the restoring force is greatest, yet the instantaneous velocity is zero. At equilibrium the restoring force is zero, yet the moving mass can have its greatest speed. Zero force at an instant does not require zero motion."
    ],
    "terms": [
      [
        "natural frequency",
        "Frequency of a system’s free oscillation under specified constraints."
      ],
      [
        "normal mode",
        "A characteristic pattern in which parts of a system oscillate together at one frequency."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Keep k fixed and quadruple the mass of a spring oscillator.",
      "reasoning": "The period doubles and frequency halves because T is proportional to √m."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At the equilibrium position of an ideal spring oscillator, the speed is…",
      "options": [
        "Zero because force is zero",
        "Maximum",
        "Always equal to its acceleration"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Zero net force means zero acceleration at that instant, not zero velocity.",
        "Correct: elastic potential energy is minimum there.",
        "Speed and acceleration have different units."
      ],
      "teacher": "The period doubles and frequency halves because T is proportional to √m. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "forced": {
    "title": "Forced vibration",
    "heading": "Trace energy from a driver into a responding object.",
    "subtitle": "Forced vibration",
    "target": "Trace energy from a driver into a responding object.",
    "visual": "resonance-wave",
    "paragraphs": [
      "Hold a vibrating tuning fork near a tabletop and then gently bring its stem into contact. The tabletop can become a forced oscillator: the fork supplies a periodic force and transfers energy into it. A larger moving surface may couple more effectively to the surrounding air than the small fork alone.",
      "The driver sets the frequency of the steady forced response in a linear system. The receiving object's natural frequency still matters because it influences the amplitude and phase of that response. Driving at an arbitrary frequency is forced vibration; it is not automatically resonance.",
      "A sounding board redistributes and radiates energy supplied by the player or vibrating string. It does not create extra energy. Stronger coupling to air can make sound louder while also making the source's vibration decay more quickly. A complete account includes energy stored in the driver and board, energy radiated as sound, and internal dissipation.",
      "Use the response curve to compare a drive well below, near, and above the natural frequency. The plotted amplitude is normalized to the static displacement F₀/k for the same force amplitude. This keeps the comparison meaningful: turning up the driving force and tuning the driving frequency are different changes, and both can affect the observed motion."
    ],
    "terms": [
      [
        "forced vibration",
        "Oscillation sustained by an external time-dependent driving force."
      ],
      [
        "coupling",
        "An interaction through which energy passes between systems."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A board vibrates at the frequency of a driven string, but away from its strongest response. Is this forced vibration?",
      "reasoning": "Yes. A periodic driver causes the motion. Resonance describes a particularly strong response near an appropriate natural frequency."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A sounding board makes a string easier to hear by…",
      "options": [
        "Creating energy",
        "Coupling the supplied vibration to more air",
        "Making sound travel through a vacuum"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Energy must come from the driver.",
        "Correct: a larger vibrating surface can transfer energy to air more effectively.",
        "A mechanical medium is still needed."
      ],
      "teacher": "Yes. A periodic driver causes the motion. Resonance describes a particularly strong response near an appropriate natural frequency. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "resonance": {
    "title": "Resonance",
    "heading": "Match the drive while accounting for losses.",
    "subtitle": "Resonance",
    "target": "Match the drive while accounting for losses.",
    "visual": "resonance-wave",
    "paragraphs": [
      "Push a swing at appropriate moments and each push can add energy to its motion. Poorly timed pushes can add less energy or even remove it. Resonance describes a strong response when a periodic drive interacts effectively with a system near a natural oscillation frequency.",
      "For a damped linear spring oscillator driven by F₀ cos(ωt), the steady displacement amplitude is F₀/√((k − mω²)² + (bω)²). Damping b limits the response and broadens the frequency range over which appreciable motion occurs. With weak damping the displacement peak lies close to the undamped natural frequency; it is not exactly at that frequency for every damping value.",
      "In steady state, average input power equals average energy loss. The system does not accumulate unlimited energy indefinitely. If damping were exactly zero and an ideal drive remained exactly resonant, the steady-state formula would fail and amplitude would grow with time; real systems eventually encounter losses or nonlinear limits.",
      "Compare the curve at two damping ratios. Explain both the height and width, rather than looking only for one special frequency. Structural vibrations can involve aerodynamic feedback and many coupled modes, so the single forced-spring model should not be used as a complete explanation of every bridge failure. Its value is to isolate timing, inertia, restoring force, and dissipation."
    ],
    "terms": [
      [
        "resonance",
        "Enhanced response when a drive efficiently excites a natural mode."
      ],
      [
        "damping",
        "Processes that remove organized oscillation energy."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why does increasing damping reduce the sharp response near resonance?",
      "reasoning": "More energy is dissipated per cycle and the steady amplitude is limited more strongly; the response also becomes broader in frequency."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At steady resonance in a real damped system, average input power…",
      "options": [
        "Exceeds losses forever",
        "Balances average dissipated power",
        "Is zero although losses continue"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "That would keep increasing stored energy rather than a steady response.",
        "Correct: the average stored energy is then constant.",
        "A continuing driver supplies the energy lost."
      ],
      "teacher": "More energy is dissipated per cycle and the steady amplitude is limited more strongly; the response also becomes broader in frequency. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "interference": {
    "title": "Sound interference",
    "heading": "Compare pressure phase at the listening point.",
    "subtitle": "Sound interference",
    "target": "Compare pressure phase at the listening point.",
    "visual": "wave-superposition",
    "paragraphs": [
      "Two speakers sending the same steady frequency can create regions of strong and weak pressure variation. What matters at a listener is the phase of each arriving wave, not merely the fact that both speakers are switched on. Their starting phase and their different path lengths both contribute.",
      "For synchronized in-phase sources in a uniform medium, a path difference of an integer number of wavelengths gives constructive interference. An odd half-wavelength gives destructive interference. Complete cancellation additionally requires equal amplitudes at the point being considered. Moving the listener changes the paths, so cancellation at one place need not occur elsewhere.",
      "The superposition graph can represent acoustic pressure rather than physical up-and-down air displacement. Positive values mean compression relative to equilibrium; negative values mean rarefaction. Equal opposite pressure variations cancel locally. This does not mean all sound energy disappears everywhere around the sources.",
      "Noise cancellation uses a controlled signal intended to oppose an unwanted pressure signal at a receiver. Its effectiveness depends on frequency, geometry, timing, and changing conditions. The ideal equal-wave model shows the principle but cannot predict a particular product's performance. Change the phase and explain why a pressure microphone at one point could read a minimum while another location still receives substantial sound."
    ],
    "terms": [
      [
        "path difference",
        "Difference between the distances traveled by waves to a receiver."
      ],
      [
        "destructive interference",
        "Reduction of the resultant disturbance through opposite-phase contributions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Equal in-phase sources reach a listener with paths differing by λ/2.",
      "reasoning": "Their arrivals differ by half a cycle, so equal amplitudes cancel at that point in the linear model."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "Does cancellation at one listening point prove sound is canceled throughout the room?",
      "options": [
        "Yes",
        "No, path differences vary with position",
        "Only for low notes"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "The relative phase depends on location.",
        "Correct: a spatial pattern contains different interference conditions.",
        "Frequency matters, but a local result is still not a whole-room guarantee."
      ],
      "teacher": "Their arrivals differ by half a cycle, so equal amplitudes cancel at that point in the linear model. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "beats": {
    "title": "Beats",
    "heading": "Watch phase drift between nearby frequencies.",
    "subtitle": "Beats",
    "target": "Watch phase drift between nearby frequencies.",
    "visual": "beats-wave",
    "paragraphs": [
      "Two nearly equal frequencies can produce a slow rise and fall in the amplitude of their sum. At one moment their pressure peaks align; later a peak aligns with a trough; later still they align again. These recurring strong and weak intervals are beats.",
      "For equal amplitudes, adding cos(2πf₁t) and cos(2πf₂t) gives 2 cos(π(f₁ − f₂)t) cos(π(f₁ + f₂)t). The fast carrier varies near the average frequency, while the magnitude of the slow factor gives an envelope. Successive loudness maxima occur at the beat frequency |f₁ − f₂|, not half that difference.",
      "A beat count tells you the magnitude of a frequency mismatch, but not which source is higher. If changing one source makes beats slower, the frequencies are approaching one another. At exact equality the relative phase stops drifting; whether the sum is strong or weak then depends on that fixed phase.",
      "Inspect the explorer's time trace without playing a sound. The solid curve is the algebraic sum and the dashed lines show its amplitude envelope. The plotted carrier uses low demonstration frequencies so that its cycles remain visible; the same algebra applies to nearby audible tones. Distinguish this temporal modulation from a fixed spatial node pattern in a standing wave."
    ],
    "terms": [
      [
        "beat frequency",
        "The absolute difference between two nearby frequencies."
      ],
      [
        "envelope",
        "A curve describing the changing amplitude of a rapidly oscillating signal."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Two forks vibrate at 440 Hz and 443 Hz.",
      "reasoning": "Their beat frequency is 3 Hz. Three amplitude maxima per second do not mean either fork emits a 3 Hz tone by itself."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "A 440 Hz reference gives 4 beats/s with another fork. The other frequency could be…",
      "options": [
        "Only 444 Hz",
        "436 Hz or 444 Hz",
        "Exactly 4 Hz"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Beat rate alone does not identify the sign of the mismatch.",
        "Correct: both differ from 440 Hz by 4 Hz.",
        "The slow modulation is not the individual tone frequency."
      ],
      "teacher": "Their beat frequency is 3 Hz. Three amplitude maxima per second do not mean either fork emits a 3 Hz tone by itself. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "columns": {
    "title": "Standing waves in air columns",
    "heading": "Apply the correct boundary condition.",
    "subtitle": "Standing waves in air columns",
    "target": "Apply the correct boundary condition.",
    "visual": "air-column",
    "paragraphs": [
      "Air in a tube can support standing pressure and displacement patterns. At an ideal rigid closed end, air cannot oscillate through the wall, so displacement has a node. At an open end, pressure stays near the surrounding atmospheric pressure, so pressure variation has a node and displacement has an approximate antinode.",
      "These are complementary patterns: a pressure node is not a displacement node. For a tube closed at one end and open at the other, the lowest mode fits one-quarter wavelength into its length. Its resonances are f = nv/(4L) with n = 1, 3, 5, and so on. The ideal model allows odd harmonics only.",
      "A tube open at both ends has displacement antinodes at both ends. Its lowest mode fits half a wavelength, so fₙ = nv/(2L) for every positive integer n. At the same length and sound speed its fundamental is twice that of the tube closed at one end. Real openings require end corrections, and instruments can depart from ideal cylindrical geometry.",
      "Compare the boundary settings and mode numbers in the explorer. The plotted displacement curve describes longitudinal air motion; it does not mean particles move sideways into the tube wall. A musical instrument can excite several allowed modes simultaneously, and their relative strengths influence timbre. Identify the field on the graph before labeling a node."
    ],
    "terms": [
      [
        "pressure node",
        "A point of zero pressure-variation amplitude."
      ],
      [
        "air-column resonance",
        "A standing sound pattern compatible with a tube’s acoustic boundaries."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare equal-length ideal tubes, one open–open and one closed–open.",
      "reasoning": "The open–open fundamental is v/(2L), twice the closed–open value v/(4L). Their permitted overtones also differ."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At an ideal closed end, which pattern has a node?",
      "options": [
        "Displacement",
        "Pressure variation",
        "Both simultaneously"
      ],
      "correct": 0,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Correct: the rigid wall prevents longitudinal displacement.",
        "Pressure variation has an antinode there.",
        "The two fields have complementary boundary patterns."
      ],
      "teacher": "The open–open fundamental is v/(2L), twice the closed–open value v/(4L). Their permitted overtones also differ. Ask the student to name what is held fixed and justify the prediction."
    }
  },
  "hearing": {
    "title": "Hearing",
    "heading": "Follow mechanical energy into a sensory signal.",
    "subtitle": "Hearing",
    "target": "Follow mechanical energy into a sensory signal.",
    "visual": "hearing-chain",
    "paragraphs": [
      "A sound reaching the outer ear enters the ear canal and drives the eardrum. The middle-ear bones transmit this motion toward the fluid-filled cochlea. Their geometry helps couple a pressure disturbance in air to the mechanical response of the inner ear; a passive mechanical system still obeys energy conservation.",
      "Fluid motion in the cochlea produces a traveling disturbance along the basilar membrane. Different positions respond most strongly to different frequency ranges. Movement bends the tiny projections on sensory hair cells, helping convert mechanical stimulation into electrical signaling. The auditory nerve carries information onward to the brain. Follow the sequence in the diagram rather than treating hearing as one isolated vibrating membrane.",
      "Pitch, loudness, and timbre describe perception. Equal physical sound levels at different frequencies need not sound equally loud. Equal-loudness curves summarize measured comparisons for specified listeners and conditions; they are not a universal personal hearing threshold. A phon scale matches numerical decibels at 1 kHz by convention, while other frequencies require different levels for equal perceived loudness.",
      "An audiogram measures threshold as a function of frequency under controlled conditions. Classroom graphics cannot diagnose hearing or replace a calibrated test. Excessive sound exposure can damage sensory structures, and lack of discomfort is not a measurement of acoustic energy. Our diagram is a conceptual pathway with no sound playback; anatomical details and source audiograms remain in the PDF."
    ],
    "terms": [
      [
        "cochlea",
        "The fluid-filled inner-ear structure involved in converting sound-driven motion into neural signals."
      ],
      [
        "audiogram",
        "A measured hearing-threshold pattern across frequencies."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Two tones have equal intensity level but different frequencies. Must they sound equally loud?",
      "reasoning": "No. Perceived loudness depends on frequency and the listener as well as physical intensity. Equal-loudness data are needed for that comparison."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "What converts sound-driven mechanical stimulation into sensory signaling in the cochlea?",
      "options": [
        "Hair-cell mechanisms",
        "The sound speed alone",
        "The air becoming an electrical wire"
      ],
      "correct": 0,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "Correct: motion of sensory structures participates in transduction.",
        "Speed affects propagation, not the entire sensory conversion.",
        "Neural signaling follows specialized biological transduction."
      ],
      "teacher": "No. Perceived loudness depends on frequency and the listener as well as physical intensity. Equal-loudness data are needed for that comparison. Ask the student to name what is held fixed and justify the prediction."
    },
    "references": [
      {
        "title": "NIDCD: How do we hear?",
        "url": "https://www.nidcd.nih.gov/health/how-do-we-hear"
      }
    ]
  },
  "ultrasound": {
    "title": "Ultrasound",
    "heading": "Infer depth from the round-trip travel time.",
    "subtitle": "Ultrasound",
    "target": "Infer depth from the round-trip travel time.",
    "visual": "ultrasound-echo",
    "paragraphs": [
      "Ultrasound has a frequency above the conventional upper audible range, about 20 kHz. A transducer can convert electrical driving into mechanical pulses and convert returning motion into electrical signals. Imaging uses measured echoes to infer the positions and properties of reflecting boundaries; it does not directly photograph the inside of an object.",
      "If sound speed along a path is approximately v and an echo returns after Δt, reflector depth is d = vΔt/2. The factor of two accounts for outward and returning travel. In a simplified soft-tissue calculation, v = 1540 m/s is commonly used. Different tissues and angled paths introduce uncertainty, and the model assumes a straight path with a known average speed.",
      "Reflection depends on acoustic impedance Z = ρv. For normal incidence at a plane boundary, the reflected intensity fraction is ((Z₂ − Z₁)/(Z₂ + Z₁))². Matching impedances reduces reflection; coupling gel avoids a poorly transmitting air gap. Shorter wavelengths can support finer spatial resolution, while higher frequencies often attenuate more strongly and reduce useful penetration.",
      "Echoes from moving scatterers can shift frequency twice, once on arrival and once on return. At speeds small compared with sound speed, a beam-aligned Doppler estimate is Δf ≈ 2f₀u cos θ/v; angle matters. Medical ultrasound does not use ionizing radiation, but it deposits energy and can have biological effects. Its clinical use requires trained judgment. The explorer illustrates timing and wavelength only, not diagnosis or device settings."
    ],
    "terms": [
      [
        "acoustic impedance",
        "The product of density and sound speed for a simple traveling acoustic wave."
      ],
      [
        "pulse-echo method",
        "Inferring a reflector’s location from the return time of an emitted pulse."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An echo returns after 100 μs through material modeled with v = 1540 m/s.",
      "reasoning": "Depth is 1540×100×10⁻⁶/2 = 0.077 m, or 7.7 cm. Using vt without the factor of two counts both legs."
    },
    "check": {
      "title": "Explain the change",
      "prompt": "At fixed medium and frequency doubled, wavelength becomes…",
      "options": [
        "Twice as long",
        "Half as long",
        "Unchanged because ultrasound is inaudible"
      ],
      "correct": 1,
      "hint": "Distinguish the source, the medium, and the response measured by the receiver.",
      "feedback": [
        "λ = v/f, so the relationship is inverse.",
        "Correct; resolution and attenuation tradeoffs still matter in a real instrument.",
        "Audibility does not change the wave relation."
      ],
      "teacher": "Depth is 1540×100×10⁻⁶/2 = 0.077 m, or 7.7 cm. Using vt without the factor of two counts both legs. Ask the student to name what is held fixed and justify the prediction."
    },
    "references": [
      {
        "title": "FDA: Ultrasound imaging and its physical effects",
        "url": "https://www.fda.gov/radiation-emitting-products/medical-imaging/ultrasound-imaging"
      }
    ]
  }
} satisfies Record<string, LessonContent>
