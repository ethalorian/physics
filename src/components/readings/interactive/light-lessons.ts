import type {LessonContent} from './lesson-contract'
export const lightLessons:Record<string,LessonContent> = {
  "nature": {
    "title": "Early concepts of light",
    "heading": "Use evidence to choose a model of light.",
    "subtitle": "Early concepts of light",
    "target": "Use evidence to choose a model of light.",
    "visual": "light-path",
    "paragraphs": [
      "Seeing requires light to reach the eye. A lamp emits light; a book redirects part of the illumination falling on it. The eye receives that light and the nervous system interprets the signal. Merely looking toward an unilluminated object does not supply the missing light. Start every explanation of vision by tracing a complete path from a source to a receiver.",
      "Different observations require different models. Straight rays explain shadows when openings and obstacles are large compared with wavelength. Wave superposition explains interference, diffraction, and polarization. A photon model describes exchanges of electromagnetic energy in discrete amounts, with photon energy E = hf. Neither a tiny classical ball nor a classical water wave by itself captures all light behavior.",
      "These models are connected descriptions of one physical phenomenon. A single photon can contribute to an interference experiment, while its detection occurs as a localized energy exchange. Calling light both wave-like and particle-like does not mean it periodically turns into a different substance. Ask which observable the model is meant to predict.",
      "In the diagram, change the illumination and trace the arrows. They show directions of energy transport, not beams coming out of the observer. Real objects scatter light toward many directions; only a small portion enters an eye. The ray sketch is a useful first approximation, and later sections will identify the conditions under which it needs a wave description."
    ],
    "terms": [
      [
        "photon",
        "A quantum of electromagnetic radiation with energy hf."
      ],
      [
        "ray model",
        "A representation of light propagation by directed paths, useful when diffraction can be neglected."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A student sees a page but cannot see it after every source in the room is switched off. What path changed?",
      "reasoning": "The source → page → eye path lost its illumination. Looking harder supplies no light. A ray model explains the missing path without needing a photon calculation."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which observation most directly requires going beyond straight rays?",
      "options": [
        "A shadow behind a large wall",
        "Alternating bright and dark bands from two narrow slits",
        "A lamp illuminating a page"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "A large wall is usually well described by ray geometry.",
        "Correct: superposition of waves accounts for the bands.",
        "The source-to-page-to-eye path can be represented with rays."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The source → page → eye path lost its illumination. Looking harder supplies no light. A ray model explains the missing path without needing a photon calculation."
    }
  },
  "speed": {
    "title": "The speed of light",
    "heading": "Distinguish travel time from source timing.",
    "subtitle": "The speed of light",
    "target": "Distinguish travel time from source timing.",
    "visual": "light-time",
    "paragraphs": [
      "Light takes time to carry information. In vacuum its speed is exactly c = 299,792,458 m/s. Over classroom distances the delay is too short for human reaction timing, but across planetary distances it becomes substantial. An event and the arrival of its light are separate moments. A changed arrival time need not mean that the distant event itself occurred late.",
      "Observations of Jupiter's moon Io provided an early way to detect this difference. As the Earth–Jupiter distance changed, the light traveled a different distance. Comparing a known extra path with an extra delay estimates c through Δt = Δd/c. This reasoning is more important than treating the early historical estimate as a modern precision measurement.",
      "Laboratory methods replaced reaction time with rotating mirrors or electronic timing. When light goes to a reflector and returns, the distance in t = d/c is the whole round trip. A reflector 15 km away gives a 30 km path and approximately 100 microseconds of travel. Omitting the return journey produces a factor-of-two error.",
      "A light-year is a distance, not a time: the distance light travels in vacuum during one year. Seeing a distant source means receiving information emitted earlier. Change the one-way distance in the model and compare one-way and round-trip delays. The calculation assumes a vacuum path and stationary endpoints; an optical medium changes the travel time."
    ],
    "terms": [
      [
        "light-year",
        "The distance light travels in vacuum in one year."
      ],
      [
        "time of flight",
        "The elapsed time for a signal to traverse a specified path."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A pulse returns from a stationary reflector after 20 microseconds. Approximately how far away is it?",
      "reasoning": "The round trip is c × 20 μs ≈ 6 km. The one-way distance is half of that, about 3 km."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Double the reflector distance in vacuum. The round-trip delay…",
      "options": [
        "Stays fixed because c is constant",
        "Doubles",
        "Halves"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Constant speed makes time proportional to path length, not constant.",
        "Correct: both outward and return paths double.",
        "A longer path takes longer at the same speed."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The round trip is c × 20 μs ≈ 6 km. The one-way distance is half of that, about 3 km."
    }
  },
  "em": {
    "title": "Electromagnetic waves",
    "heading": "Connect wavelength, frequency, and transverse fields.",
    "subtitle": "Electromagnetic waves",
    "target": "Connect wavelength, frequency, and transverse fields.",
    "visual": "em-wave",
    "paragraphs": [
      "An electromagnetic wave transports energy through changing electric and magnetic fields. Unlike sound, it needs no material medium: sunlight crosses the nearly empty space between the Sun and Earth. The oscillating quantities are fields, not air pressure or pieces of material riding along with the light.",
      "For an ideal plane wave in vacuum, the electric field, magnetic field, and propagation direction are mutually perpendicular. The fields rise and fall together in phase. Their magnitudes obey E = cB in SI units. The drawing uses separate normalized scales for the two fields; equal drawn heights do not mean equal numerical values in volts per meter and tesla.",
      "All electromagnetic frequencies propagate at c in vacuum. Wavelength and frequency therefore obey c = fλ. A higher frequency means a shorter vacuum wavelength, not faster travel. Visible light occupies only a small part of the electromagnetic spectrum, between infrared at lower frequencies and ultraviolet at higher frequencies. Radio, microwave, X-ray, and gamma radiation belong to the same family.",
      "An oscillating current in an antenna involves accelerating charges and can radiate. Atomic and nuclear transitions provide other emission mechanisms. The source fixes frequency in a stationary setup. When the wave crosses into a stationary transparent medium, frequency remains continuous at the boundary while phase speed and wavelength generally change. Keep the vacuum relation distinct from v = fλ inside matter."
    ],
    "terms": [
      [
        "electromagnetic wave",
        "A propagating disturbance of electric and magnetic fields."
      ],
      [
        "electromagnetic spectrum",
        "The continuous range of electromagnetic frequencies and wavelengths."
      ],
      [
        "wavelength",
        "Distance between neighboring points with the same phase."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare 450 nm and 600 nm light in vacuum.",
      "reasoning": "Both travel at c. The 450 nm wave has 600/450 = 4/3 times the frequency of the 600 nm wave."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A radio wave and visible light travel in vacuum. Which is correct?",
      "options": [
        "Radio is slower because its frequency is lower",
        "They have equal speed and different wavelengths",
        "Visible light needs air to travel"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Frequency alone does not set a different vacuum speed.",
        "Correct: both obey c = fλ.",
        "Electromagnetic waves can propagate without air."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Both travel at c. The 450 nm wave has 600/450 = 4/3 times the frequency of the 600 nm wave."
    }
  },
  "transparent": {
    "title": "Light and transparent materials",
    "heading": "Explain transmission without treating matter as empty space.",
    "subtitle": "Light and transparent materials",
    "target": "Explain transmission without treating matter as empty space.",
    "visual": "material-light",
    "paragraphs": [
      "A transparent material allows enough light to pass through with directional information preserved that an object can be seen through it. Its charged particles still respond to the wave. The incident field and the material's collective response combine into the transmitted wave. Transparency does not mean that light ignores the material or travels through it exactly as through vacuum.",
      "In a simple transparent medium, refractive index n describes phase speed through v = c/n. At an unchanging boundary, the frequency remains the same, so the wavelength becomes λ = λ₀/n. Light returning to the original medium returns to that medium's propagation speed. It does not permanently lose speed as if friction had slowed a moving ball.",
      "The response depends on wavelength, material composition, and thickness. A window that passes visible light can absorb strongly in parts of the infrared or ultraviolet. It is inaccurate to say that all glass blocks every infrared or ultraviolet wavelength. A material can also scatter light, making it translucent even when substantial energy gets through.",
      "Track energy as well as direction: incident energy divides among reflection, transmission, and absorption. The idealized sliders enforce R + T + A = 1. They are chosen energy fractions, not measured optical constants for a named substance. Absorption transfers energy into the material; coherent transmission preserves an organized wave. Random absorption followed by unrelated emission would not by itself explain a sharp transmitted image."
    ],
    "terms": [
      [
        "transparent",
        "Transmitting light with enough directional information to see objects through the material."
      ],
      [
        "refractive index",
        "The ratio c/v for the phase speed of a specified wavelength in a medium."
      ],
      [
        "translucent",
        "Transmitting light while scattering it enough to obscure a clear image."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Light of vacuum wavelength 600 nm enters a medium with n = 1.5.",
      "reasoning": "Its frequency stays fixed; phase speed becomes c/1.5 and wavelength becomes 400 nm. On return to vacuum its wavelength is 600 nm again."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "What can change when light enters stationary transparent glass?",
      "options": [
        "Frequency alone",
        "Phase speed and wavelength, with frequency unchanged",
        "Its vacuum speed permanently"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "The oscillation frequency must match across a stationary boundary.",
        "Correct: v = fλ while f is fixed.",
        "A medium does not permanently alter the vacuum constant c."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Its frequency stays fixed; phase speed becomes c/1.5 and wavelength becomes 400 nm. On return to vacuum its wavelength is 600 nm again."
    }
  },
  "opaque": {
    "title": "Opaque materials",
    "heading": "Balance reflected, transmitted, and absorbed energy.",
    "subtitle": "Opaque materials",
    "target": "Balance reflected, transmitted, and absorbed energy.",
    "visual": "material-light",
    "paragraphs": [
      "An opaque object transmits negligible light at the wavelength and thickness being considered. That statement does not say whether the light is mostly reflected or mostly absorbed. A polished metal mirror and a dark fabric can both be opaque even though their reflected brightness differs greatly.",
      "Absorption transfers electromagnetic energy to the material. It can increase internal energy or produce other changes, depending on the interaction. Reflection sends energy back into the original medium. In metals, mobile charge carriers respond collectively to the incident field, often producing strong visible reflection. The response depends on frequency and surface condition; not every metal surface behaves like an ideal mirror.",
      "For a passive sample receiving a fixed amount of light, conservation of energy gives R + T + A = 1 when all outgoing directions are included. If transmission is negligible, the reflected and absorbed fractions must add to approximately one. A material that reflects 80% and transmits essentially none absorbs about 20%, rather than absorbing everything simply because it is opaque.",
      "Use the model to construct two opaque materials with different reflectances. Compare the energy bars before attaching color words to the objects. An object can appear dark either because it absorbs strongly or because its specular reflection misses your eye. Brightness also depends on the source and viewing geometry. Always specify which wavelength, path, and receiving direction your explanation concerns."
    ],
    "terms": [
      [
        "opaque",
        "Transmitting negligible radiation at a specified wavelength and thickness."
      ],
      [
        "absorptance",
        "The fraction of incident radiant energy absorbed by a sample."
      ],
      [
        "reflectance",
        "The fraction of incident radiant energy reflected."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "An opaque surface reflects 70 of 100 incident energy units. Where are the other 30?",
      "reasoning": "With transmission negligible and no stored output source, 30 units are absorbed. Opaque does not mean 100% absorbing."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which pair can both be opaque?",
      "options": [
        "Only two perfectly black objects",
        "A shiny mirror and a dark wall",
        "Only two transparent filters"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Opacity concerns transmission, not requiring perfect absorption.",
        "Correct: both can block transmission while dividing reflection and absorption differently.",
        "Transparent filters transmit some selected light."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. With transmission negligible and no stored output source, 30 units are absorbed. Opaque does not mean 100% absorbing."
    }
  },
  "shadows": {
    "title": "Shadows",
    "heading": "Explain umbra and penumbra with source geometry.",
    "subtitle": "Shadows",
    "target": "Explain umbra and penumbra with source geometry.",
    "visual": "shadow-light",
    "paragraphs": [
      "A shadow is a region receiving less illumination because an intervening object blocks some paths. In the ray approximation, light travels straight through a uniform medium. Draw paths from the edges of the source past the edges of the obstacle to find which parts of a receiving surface can see the source.",
      "A point-like source produces a comparatively sharp boundary. An extended source contains many emitting points, and their shadows overlap. The umbra receives no direct light from that source. In the penumbra, only part of the source is visible, so some direct illumination remains. Other room lights and scattered light can still illuminate either region.",
      "Increasing the angular size of the source generally broadens the transition between lit and shadowed regions. Moving an obstacle close to the receiving surface makes its shadow sharper. For a sufficiently large source and distant screen, the umbra can disappear entirely while a region of partial shadow remains. The model shows this geometric limit without claiming that diffraction is absent in real light.",
      "A solar eclipse places an observer in the Moon's shadow; a lunar eclipse places the Moon in Earth's shadow. These are different alignments of source, obstacle, and receiver. The classroom geometry also helps distinguish a missing ray path from absorption of every wavelength. Predict the shadow boundaries before moving the source-size control, then explain them by naming which source points remain visible at each screen position."
    ],
    "terms": [
      [
        "umbra",
        "A region with all direct light from a specified source blocked."
      ],
      [
        "penumbra",
        "A region with only part of an extended source blocked."
      ],
      [
        "shadow",
        "Reduced illumination caused by obstructed light paths."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Keep the source and screen fixed but move an object closer to the screen.",
      "reasoning": "The edge rays have less distance over which to separate after the object, narrowing the penumbra and sharpening the shadow."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Make the source wider with all distances fixed. What usually happens?",
      "options": [
        "The penumbra broadens",
        "The shadow becomes a perfectly sharp edge",
        "Light must travel faster"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: more source points become partially visible across a wider transition.",
        "An extended source produces overlapping partial shadows.",
        "Source width changes geometry, not propagation speed."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The edge rays have less distance over which to separate after the object, narrowing the penumbra and sharpening the shadow."
    }
  },
  "polarization": {
    "title": "Polarization",
    "heading": "Project a transverse electric field onto a filter axis.",
    "subtitle": "Polarization",
    "target": "Project a transverse electric field onto a filter axis.",
    "visual": "polarization-light",
    "paragraphs": [
      "Polarization describes how an electromagnetic wave's electric-field direction behaves in the plane perpendicular to travel. A linearly polarized wave has a fixed oscillation axis. Unpolarized light has no single persistent transverse axis over the measurement interval. This distinction concerns field direction, not whether a ray travels horizontally or vertically across the room.",
      "An ideal linear polarizer transmits the field component along its transmission axis. For already linearly polarized light, an analyzer at angle θ transmits intensity I = I₀ cos²θ. The field projection contains one cosine; intensity contains its square. Aligned axes transmit the ideal input, while crossed axes transmit none. Real filters have losses and imperfect extinction.",
      "For unpolarized input, an ideal first polarizer transmits half the incident intensity. The transmitted light is then polarized along that first axis, so a second filter obeys the cosine-squared law relative to it. Inserting a filter at 45° between crossed filters permits some light through: each stage projects onto a new axis. This does not create energy.",
      "Reflection from a nonmetallic horizontal surface can preferentially produce horizontally polarized glare. A vertically oriented transmission axis can reduce that component. The effect depends on angle and material; ordinary reflection is not always completely polarized. In the model, identify whether the stated input is already polarized before applying a percentage. Separate the first-filter loss from the analyzer's subsequent projection."
    ],
    "terms": [
      [
        "linear polarization",
        "Electric-field oscillation along a fixed transverse axis."
      ],
      [
        "transmission axis",
        "The electric-field direction passed by an ideal linear polarizer."
      ],
      [
        "Malus’s law",
        "I = I₀ cos²θ for an analyzer receiving linearly polarized light."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Unpolarized intensity 100 passes ideal filters at 0° and 60°.",
      "reasoning": "The first leaves 50. The second leaves 50 cos²60° = 12.5, or 12.5% of the original intensity."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A 45° filter inserted between crossed ideal polarizers can…",
      "options": [
        "Transmit some light",
        "Create extra light energy",
        "Make the wave longitudinal"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: successive projections leave a nonzero component at the final axis.",
        "The output is still less than the original intensity.",
        "Polarization changes transverse field direction, not the wave into sound-like motion."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The first leaves 50. The second leaves 50 cos²60° = 12.5, or 12.5% of the original intensity."
    }
  },
  "stereo": {
    "title": "Polarized light and 3-D viewing",
    "heading": "Separate the two eye views before interpreting depth.",
    "subtitle": "Polarized light and 3-D viewing",
    "target": "Separate the two eye views before interpreting depth.",
    "visual": "stereo-light",
    "paragraphs": [
      "The two eyes view a nearby scene from slightly different positions. A nearby object shifts against a distant background when the viewing eye changes. This binocular disparity supplies one depth cue to the visual system. Perspective, occlusion, and motion provide additional cues, so depth perception is not explained by polarization alone.",
      "A stereoscopic display prepares separate images for the left and right eyes. The task of the glasses is to route the intended image to each eye, preserving their difference. In a simple linear-polarization system, the two projected views use perpendicular polarization axes. Each lens transmits its matching view and rejects the orthogonal view, if the screen and glasses preserve the required polarization.",
      "If both eyes receive the same image, the designed binocular disparity is lost. If substantial light from the wrong view leaks through, the observer may see ghosting. Tilting the head in a simple linear system changes the relative axes and can increase cross-talk. Some systems instead use circular polarization or timed shutters; the exact hardware matters.",
      "The diagram isolates routing from depth interpretation. Two labeled views lead to two receivers. Vary the glasses' alignment and compare intended and leaked intensity. The percentages assume ideal, already polarized incoming beams of equal intensity. They are a channel-separation calculation, not a simulation of an individual's visual perception. Explain first how the optical paths stay separate, then how differing views can carry information about depth."
    ],
    "terms": [
      [
        "binocular disparity",
        "The difference between corresponding features in the two eye views."
      ],
      [
        "stereoscopic display",
        "A display that supplies different intended images to the two eyes."
      ],
      [
        "cross-talk",
        "Unwanted leakage of one image channel into the other."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "In a linear system, rotate both glasses axes by 45° relative to the projectors.",
      "reasoning": "Each eye receives half of each ideal incoming view because cos²45° = sin²45° = 1/2. The channels are no longer separated."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "What is the essential job of stereoscopic glasses?",
      "options": [
        "Make all photons travel faster",
        "Route different intended views to the two eyes",
        "Focus both projectors onto exactly the same eye"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Travel speed is unrelated to separating views.",
        "Correct: separate views preserve binocular disparity.",
        "Each eye needs its appropriate view."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Each eye receives half of each ideal incoming view because cos²45° = sin²45° = 1/2. The channels are no longer separated."
    }
  },
  "visible": {
    "title": "The color spectrum",
    "heading": "Distinguish spectral color from a mixture that looks similar.",
    "subtitle": "The color spectrum",
    "target": "Distinguish spectral color from a mixture that looks similar.",
    "visual": "visible-spectrum",
    "paragraphs": [
      "A prism can spread a narrow beam of white light into a visible spectrum because its refractive index depends on wavelength. In ordinary glass over the visible range, shorter wavelengths generally bend more strongly than longer ones. The colors were present in the incident mixture; the prism separates them rather than painting white light with new frequencies.",
      "Visible wavelengths run approximately from 400 to 700 nanometers, with boundaries varying by observer and conditions. Red lies toward the long-wavelength end and violet toward the short-wavelength end. These are not hard divisions in nature. Frequency increases as wavelength decreases in vacuum, following f = c/λ.",
      "A broad spectrum can appear white, but a suitable mixture of a few narrower bands can also appear white. The visual system does not measure every wavelength independently. A yellow-looking mixture of red and green light therefore need not contain a narrow yellow spectral line. Apparent color and spectral composition are related but are not interchangeable measurements.",
      "Use the wavelength explorer to connect a location in the visible range to frequency and photon energy. The displayed swatch is an approximate screen representation, not a calibrated spectral source. A monitor uses its own red, green, and blue emitters to suggest the chosen appearance. To distinguish two visually similar sources, compare their spectra rather than assuming matching color proves identical wavelengths."
    ],
    "terms": [
      [
        "spectrum",
        "A representation of radiation distributed across wavelengths or frequencies."
      ],
      [
        "spectral color",
        "The perceived color associated with a narrow band of visible wavelengths."
      ],
      [
        "dispersion",
        "Dependence of wave propagation on frequency, which can separate wavelengths."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A red-and-green mixture appears yellow. Has it converted both wavelengths into one yellow wavelength?",
      "reasoning": "No. Superposed red and green light can produce a yellow appearance while the two input spectral bands remain distinct."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "What does a prism primarily do to a white-light beam?",
      "options": [
        "Separate existing wavelengths",
        "Convert every photon into green light",
        "Add missing light energy"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: wavelength-dependent refraction separates the mixture.",
        "A passive ordinary prism does not perform that frequency conversion.",
        "The prism redirects the light and can lose some energy; it does not add energy."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. No. Superposed red and green light can produce a yellow appearance while the two input spectral bands remain distinct."
    }
  },
  "reflectionColor": {
    "title": "Color by reflection",
    "heading": "Predict reflected light from the source and the object together.",
    "subtitle": "Color by reflection",
    "target": "Predict reflected light from the source and the object together.",
    "visual": "color-object",
    "paragraphs": [
      "The light reaching your eye from an ordinary opaque object depends on both the illumination and the object's wavelength-dependent reflectance. A red surface tends to reflect a larger fraction of red light than of some other visible bands. It cannot reflect a red component that the source never supplied.",
      "For a simple spectral band, reflected intensity is incident intensity multiplied by reflectance. Apply that reasoning separately to different bands before combining the result. A surface that reflects red strongly but green weakly can look bright under red illumination and dark under green illumination. Calling it a red object is shorthand for its usual appearance under a familiar broad-spectrum source.",
      "Most natural colors involve broad bands, not a single frequency. Texture also matters: a glossy surface directs some reflection toward particular directions, whereas a rough surface spreads light more widely. A highlight can resemble the source color even when the diffuse part looks strongly colored. Perceived appearance further depends on surrounding colors and adaptation of the observer.",
      "The model uses three labeled channels to keep the accounting visible. Change the illumination and then the reflecting surface. The output bars show which supplied components survive; their labels remain useful even if the colors are difficult to distinguish. This simplified RGB model is not a full measurement of a real pigment spectrum. Support your prediction with a source component and an interaction, not just an object-color name."
    ],
    "terms": [
      [
        "selective reflection",
        "Reflection that varies with wavelength."
      ],
      [
        "illumination",
        "The light incident on an object from its surroundings."
      ],
      [
        "reflectance spectrum",
        "Reflected fraction as a function of wavelength."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Illuminate an ideal red-reflecting surface with only blue light.",
      "reasoning": "The source supplies no red. If the surface absorbs blue, very little light returns and it appears dark."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A white card illuminated only by green light reflects…",
      "options": [
        "White light made from new wavelengths",
        "The available green light",
        "No light because white needs sunlight"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Ordinary reflection does not manufacture the missing red and blue components.",
        "Correct: a broadly reflecting card returns the light it receives.",
        "It can reflect green without receiving a complete spectrum."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The source supplies no red. If the surface absorbs blue, very little light returns and it appears dark."
    }
  },
  "transmissionColor": {
    "title": "Color by transmission",
    "heading": "Track which bands survive a transparent filter.",
    "subtitle": "Color by transmission",
    "target": "Track which bands survive a transparent filter.",
    "visual": "color-filter",
    "paragraphs": [
      "A colored filter transmits selected parts of the incident spectrum more effectively than others. Light that reaches an eye behind the filter has passed through this wavelength-dependent selection. A blue-looking filter under white illumination need not transmit only one exact wavelength; real transmission bands usually have width.",
      "For each wavelength, transmitted intensity equals incident intensity multiplied by the transmission fraction. Two filters in sequence multiply their transmission fractions. They do not add their colors as two light sources do. If their passbands barely overlap, the output can be very dark even though each filter by itself looks bright.",
      "A cyan-like filter preferentially removes red while passing green and blue. A yellow-like filter preferentially removes blue while passing red and green. In an ideal three-band model, placing them in series leaves green. The surviving energy is the portion permitted by both filters. Absorbed energy is transferred to the filter material; reflected energy must also be included in a full energy balance.",
      "Change the incident color before predicting the output. A filter cannot transmit a missing input band, and ordinary filtering does not change each transmitted photon's frequency. The diagram treats the filters as ideal selectors and excludes fluorescence, which would require a separate absorption-and-emission explanation. In a real experiment, thickness, filter quality, and the lamp's spectrum determine how dark or saturated the result appears."
    ],
    "terms": [
      [
        "transmittance",
        "The fraction of incident radiant energy transmitted."
      ],
      [
        "passband",
        "A range of wavelengths or frequencies a filter transmits relatively well."
      ],
      [
        "selective absorption",
        "Absorption that depends on wavelength."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Send white light through ideal cyan and yellow filters.",
      "reasoning": "Cyan removes red and yellow removes blue. Their common transmitted channel is green."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Two filters in series have nonoverlapping passbands. Their output is…",
      "options": [
        "A brighter combination of both colors",
        "Very small or zero in the ideal model",
        "Automatically white"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "That is additive-source reasoning, not sequential filtering.",
        "Correct: no input wavelength can pass both ideal filters.",
        "Filtering removes components; it does not restore all bands."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Cyan removes red and yellow removes blue. Their common transmitted channel is green."
    }
  },
  "sunlight": {
    "title": "Sunlight",
    "heading": "Separate a physical spectrum from visual sensitivity.",
    "subtitle": "Sunlight",
    "target": "Separate a physical spectrum from visual sensitivity.",
    "visual": "solar-spectrum",
    "paragraphs": [
      "Sunlight contains a broad range of wavelengths, including ultraviolet, visible, and infrared radiation. A spectrum reports how radiant energy is distributed; it is not simply a chart of named colors. The solar photosphere is approximately described by a thermal spectrum near 5800 K, with absorption lines and other departures from an ideal blackbody.",
      "A spectral peak depends on what is plotted. Energy per unit wavelength and energy per unit frequency use different horizontal intervals and need not place their maxima at corresponding colors. For a wavelength-based blackbody curve, Wien's relation gives λmax T ≈ 2.90 × 10⁻³ m K, putting a 5800 K peak near 500 nm. The broad visible mixture still appears approximately white outside the atmosphere.",
      "Human daytime visual sensitivity is a separate weighting of the physical spectrum, strongest near the middle of the visible range. Equal radiant powers at different wavelengths need not look equally bright. Likewise, a lamp designed for efficient visibility need not reproduce object colors as well as a broader-spectrum source.",
      "In the model, change temperature and track the wavelength peak. Curves are normalized separately so the graph compares shape, not total power. A hotter equal-area blackbody also emits more total power, which this normalization hides. Atmospheric absorption and scattering further modify ground-level sunlight. State the graph's axis and normalization before making a claim about which part is brightest."
    ],
    "terms": [
      [
        "spectral distribution",
        "Radiant energy or power distributed over specified wavelength or frequency intervals."
      ],
      [
        "blackbody spectrum",
        "The ideal thermal spectrum determined by temperature."
      ],
      [
        "visual sensitivity",
        "The observer’s response to incident light as a function of wavelength and viewing conditions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare ideal blackbody temperatures of 3000 K and 6000 K on a wavelength axis.",
      "reasoning": "Wien’s relation halves the peak wavelength when temperature doubles. This does not mean equal total emitted power or that either source emits only its peak wavelength."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Two separately normalized spectrum curves have the same peak height. Can you conclude equal emitted power?",
      "options": [
        "Yes, peak height determines total power",
        "No, normalization removes that comparison",
        "Yes, provided both curves look white"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Area under an absolute spectrum determines power, and normalization changes the scale.",
        "Correct: equal displayed heights do not preserve absolute power.",
        "Perceived color cannot establish equal radiant power."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Wien’s relation halves the peak wavelength when temperature doubles. This does not mean equal total emitted power or that either source emits only its peak wavelength."
    }
  },
  "additive": {
    "title": "Mixing colored light",
    "heading": "Add light channels without inventing a new wavelength.",
    "subtitle": "Mixing colored light",
    "target": "Add light channels without inventing a new wavelength.",
    "visual": "color-add",
    "paragraphs": [
      "When independent colored lights illuminate the same white surface, their contributions add. Red and green light can produce a yellow appearance, green and blue can appear cyan, and red and blue can appear magenta. A suitable balance of red, green, and blue can appear white. The term additive describes adding incoming light, not combining names in a paint recipe.",
      "This behavior reflects the overlapping spectral sensitivities of the three classes of cones in typical human color vision. Different spectra can produce similar cone-response patterns. A screen can therefore approximate many colors with only three primaries, although it cannot reproduce every physically possible color. The exact achievable range depends on the chosen emitters.",
      "Adding red and green light does not ordinarily merge their photons into yellow photons. A spectrometer can still distinguish the input bands from a narrow yellow source that happens to look similar. This distinction explains why visually matching lights can make colored objects look different: the objects interact with the underlying spectra.",
      "The controls mix three display channels and report their relative levels. They are a digital color demonstration, not calibrated radiometry; equal slider settings are not a claim of equal physical power or equal perceived brightness. Turn one channel off before predicting the change. Describe both the surviving channels and the perceived mixture, keeping a physical description separate from its visual interpretation."
    ],
    "terms": [
      [
        "additive mixing",
        "Combining light from sources so their spectral contributions add."
      ],
      [
        "additive primary",
        "One of a selected set of light colors used to reproduce other appearances."
      ],
      [
        "metamerism",
        "Different spectra producing the same color appearance under specified viewing conditions."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A stage uses red and green spotlights on a white screen. What would a spectrometer detect?",
      "reasoning": "It detects the red and green input bands. A yellow appearance does not require a newly created narrow yellow band."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Turn off blue in a balanced RGB white mixture. It tends toward…",
      "options": [
        "Yellow",
        "More intense white",
        "Black"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: red and green remain.",
        "Removing a component reduces the supplied light and changes the mixture.",
        "Two nonzero light channels remain."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. It detects the red and green input bands. A yellow appearance does not require a newly created narrow yellow band."
    }
  },
  "complements": {
    "title": "Complementary colors",
    "heading": "Identify the missing component needed for a white mixture.",
    "subtitle": "Complementary colors",
    "target": "Identify the missing component needed for a white mixture.",
    "visual": "color-complement",
    "paragraphs": [
      "Two light colors are complementary when an appropriate mixture of them produces a specified white appearance. In an idealized RGB scheme, red pairs with cyan, green with magenta, and blue with yellow. Cyan supplies green and blue, completing the three channels when red is added.",
      "The word appropriate matters: changing relative intensities changes the mixture, and the chosen white point is part of the definition. Complementary appearance is not a promise that any two lamps labeled with those color names will produce exactly the same white. Their spectra and the observer's adaptation influence the match.",
      "Subtraction offers another useful description. Starting with a balanced white RGB mixture, remove the red contribution and the remainder appears cyan. Adding that missing red restores the original mixture. This bookkeeping connects additive lighting to selective absorption, but the physical processes are different: one adds an independent source while the other removes part of existing light.",
      "Choose a channel in the model and compare the original component, its complement, and their combined output. Each channel is labeled, so the relationship is available without relying on hue recognition. An afterimage on a white background can also look approximately complementary because of visual adaptation, but it is a response of the observer rather than a new colored beam emitted by the paper. Keep the optical mixture and the observer's response distinct."
    ],
    "terms": [
      [
        "complementary colors",
        "Two light colors that can combine in suitable proportions to give a specified white appearance."
      ],
      [
        "white point",
        "The reference chromaticity treated as white in a color system."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A white RGB beam loses its green channel. What is left, and what restores white?",
      "reasoning": "Red and blue remain, giving a magenta appearance. Adding back the original green contribution restores the original white mixture."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which completes ideal cyan light to balanced RGB white?",
      "options": [
        "Red",
        "More cyan",
        "Yellow alone"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: cyan supplies green and blue, so red is missing.",
        "More cyan does not provide the missing red component.",
        "Yellow adds red and green, changing the balance rather than simply restoring the missing channel."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Red and blue remain, giving a magenta appearance. Adding back the original green contribution restores the original white mixture."
    }
  },
  "pigments": {
    "title": "Mixing colored pigments",
    "heading": "Explain subtraction by following surviving spectral bands.",
    "subtitle": "Mixing colored pigments",
    "target": "Explain subtraction by following surviving spectral bands.",
    "visual": "color-filter",
    "paragraphs": [
      "Mixing paints usually darkens or changes their reflected spectrum because pigments selectively absorb light. This differs from shining additional colored light on a screen. A paint mixture does not gain the light output of two independent lamps; incident illumination must survive interactions with the mixture before reaching the observer.",
      "Cyan, magenta, and yellow are useful subtractive primaries. Ideal cyan removes red, magenta removes green, and yellow removes blue. Combining ideal cyan and yellow leaves their common green channel. Combining all three removes every channel in this simplified model. Real inks are imperfect, so printing commonly adds black for deep dark tones and practical control.",
      "Actual paint mixing involves scattering, absorption, pigment concentration, binder, and layer thickness. It is not exactly the same as multiplying two transparent-filter transmissions, although that model makes the shared-band reasoning easy to see. Some pigments sold as blue reflect enough green to produce a green mixture with yellow; color names alone do not uniquely determine the result.",
      "Use the ideal filters as an accounting model: label what each layer removes and what survives both. Then state its limitation before applying it to paint. A photograph printed with a few inks and a luminous screen can look similar while sending different spectra to the eye. Predicting their appearance under a new lamp requires the source spectrum and the material response, not merely the original color match."
    ],
    "terms": [
      [
        "subtractive mixing",
        "Color formation by selectively removing components from incident light."
      ],
      [
        "subtractive primary",
        "Cyan, magenta, or yellow in a common ideal subtractive color system."
      ],
      [
        "pigment",
        "A coloring material whose optical response includes wavelength-selective absorption and scattering."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why does overlapping red and green light differ from mixing red and green paint?",
      "reasoning": "The lights add separate incoming contributions. Pigments absorb portions of the same illumination, so a mixture can leave much less reflected light."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why is an ideal cyan-plus-yellow filter combination green?",
      "options": [
        "It creates a new green frequency from red",
        "Green is the band both transmit",
        "It transmits all colors equally"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Ordinary filtering selects wavelengths rather than converting them.",
        "Correct: cyan removes red and yellow removes blue.",
        "Equal transmission of all bands would preserve the input mixture."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The lights add separate incoming contributions. Pigments absorb portions of the same illumination, so a mixture can leave much less reflected light."
    }
  },
  "sky": {
    "title": "Why the sky is blue",
    "heading": "Distinguish scattered light from the direct beam.",
    "subtitle": "Why the sky is blue",
    "target": "Distinguish scattered light from the direct beam.",
    "visual": "rayleigh-light",
    "paragraphs": [
      "A clear atmosphere redirects some sunlight into lines of sight that do not point at the Sun. Air molecules are much smaller than visible wavelengths, making Rayleigh scattering a useful approximation. At a fixed angle and under the same conditions, its strength varies approximately as 1/λ⁴. Shorter visible wavelengths scatter much more strongly than longer ones.",
      "Looking at a patch of clear sky, you receive this redirected light rather than only the unscattered direct beam. Blue wavelengths are enhanced relative to red. The sky does not simply reflect a blue ocean. An atmosphere-free observer would see a dark background away from luminous objects because there would be far less material to redirect sunlight into that direction.",
      "Violet scatters strongly too, but perceived sky color also depends on the solar spectrum, atmospheric transmission, and the wavelength response of the visual system. The fourth-power rule alone is not a complete prediction of perceived hue. Larger aerosol particles and cloud droplets require different scattering descriptions and often scatter visible wavelengths more evenly, producing whiter light.",
      "The model compares two wavelengths for identical small scatterers. It is normalized to red scattering, and does not attempt a photograph of the entire sky. Doubling wavelength reduces the modeled scattering strength by a factor of sixteen. Explain the observer's direction and the redistributed energy: scattering sends light elsewhere, whereas absorption transfers its energy to matter. These are different ways to reduce a direct beam."
    ],
    "terms": [
      [
        "Rayleigh scattering",
        "Scattering by particles much smaller than wavelength, with an approximate inverse-fourth-power wavelength dependence."
      ],
      [
        "scattering",
        "Redirection of radiation by interaction with matter."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Compare 450 nm and 650 nm scattering under the same Rayleigh conditions.",
      "reasoning": "The ratio is (650/450)⁴ ≈ 4.35. The shorter wavelength is scattered more strongly, without traveling faster in vacuum."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why can the sky look blue away from the Sun?",
      "options": [
        "Air redirects shorter visible wavelengths toward the observer",
        "Blue light travels faster than red",
        "The ocean must supply all the light"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: wavelength-dependent scattering changes the mixture received from that direction.",
        "All visible wavelengths have the same vacuum speed.",
        "Blue skies occur over land; atmospheric scattering supplies the mechanism."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The ratio is (650/450)⁴ ≈ 4.35. The shorter wavelength is scattered more strongly, without traveling faster in vacuum."
    }
  },
  "sunset": {
    "title": "Why sunsets are red",
    "heading": "Connect path length to the surviving direct spectrum.",
    "subtitle": "Why sunsets are red",
    "target": "Connect path length to the surviving direct spectrum.",
    "visual": "sunset-light",
    "paragraphs": [
      "The direct sunlight reaching an observer near sunset usually crosses a longer atmospheric path than it does when the Sun is high. More scattering opportunities remove light from the direct beam. Because molecular scattering is stronger at shorter visible wavelengths, blue components are reduced more strongly, often leaving a redder or orange mixture.",
      "This is the other side of the explanation for a blue sky. Light redirected out of one path can enter another observer's line of sight. The atmosphere does not need to convert blue photons into red photons. Selective removal changes the proportions of the wavelengths remaining in the direct beam.",
      "A simple attenuation law writes transmitted intensity as I = I₀e^(−τ), where optical depth τ summarizes interactions along the path. In a uniform Rayleigh-only model, τ scales with path length and approximately with 1/λ⁴. Increasing the path therefore reduces every modeled channel, but reduces short wavelengths faster. A redder beam can also be much dimmer overall.",
      "Clouds, dust, aerosols, absorption, and multiple scattering make actual sunsets more complex. The model holds those out so that one cause can be tested. Its bars show remaining fractions, not a calibrated prediction of sky color at a particular location. Compare the direct and scattered paths in your explanation, and avoid using the remaining beam's color to claim that the source itself changed temperature during the afternoon."
    ],
    "terms": [
      [
        "optical depth",
        "A dimensionless measure of attenuation along a light path."
      ],
      [
        "direct beam",
        "Radiation reaching a receiver without being redirected out of its original path."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A direct beam passes through twice as much of the same ideal atmosphere.",
      "reasoning": "Each wavelength has greater optical depth. All direct components weaken, with shorter wavelengths weakened more strongly under the Rayleigh approximation."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A sunset beam becomes redder mainly because…",
      "options": [
        "Blue photons turn into red photons",
        "Shorter wavelengths are preferentially removed from the direct path",
        "The Sun suddenly cools at that observer’s sunset"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Ordinary elastic scattering changes direction, not photon frequency.",
        "Correct: the surviving mixture changes.",
        "The local viewing geometry changes without requiring a sudden solar temperature change."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Each wavelength has greater optical depth. All direct components weaken, with shorter wavelengths weakened more strongly under the Rayleigh approximation."
    }
  },
  "water": {
    "title": "Why water is greenish blue",
    "heading": "Separate absorption within water from reflection at its surface.",
    "subtitle": "Why water is greenish blue",
    "target": "Separate absorption within water from reflection at its surface.",
    "visual": "water-light",
    "paragraphs": [
      "A glass of clean water often looks nearly colorless because the path is short. Over a longer path, pure water's selective absorption becomes noticeable: red visible wavelengths are attenuated more strongly than blue wavelengths. Light returning from within a deep clear volume can therefore have a blue or cyan appearance.",
      "Surface reflection adds a second contribution. A smooth water surface can reflect the sky or surrounding objects toward the eye, and its appearance changes with viewing angle. It is incomplete to say that every blue ocean is only reflecting the sky, or that surface reflection never matters. Identify which optical path supplies the light being discussed.",
      "Suspended sediment, dissolved substances, organisms, bottom reflections, and multiple scattering also affect natural water. These can shift the observed color strongly. There is no single universal absorption distance for red light in every lake or seawater sample. A physics model should state its assumed attenuation coefficients before reporting a numerical depth effect.",
      "The exploration uses explicitly illustrative coefficients for three bands and the exponential law T = e^(−αL). As path length increases, the red band falls faster. These are chosen teaching values, not a site measurement. An underwater red object may appear dark when little red illumination reaches it; bringing a white lamp close can restore a red appearance. The object's response did not need to change for its appearance to change."
    ],
    "terms": [
      [
        "attenuation coefficient",
        "The fractional rate of beam weakening per unit path length in an exponential model."
      ],
      [
        "selective absorption",
        "Absorption that depends on wavelength."
      ],
      [
        "optical path",
        "The route light follows from source through interactions to receiver."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "Why can a red object look dark in deep water yet red under a nearby white lamp?",
      "reasoning": "The distant illumination has lost much of its red component. A nearby lamp supplies red light over a shorter water path for the object to reflect."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which explanation accounts for water’s intrinsic tint?",
      "options": [
        "Preferential absorption over a long path",
        "A requirement that the sky always be blue",
        "A change of every blue photon into green"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: absorption changes the surviving spectrum even without a reflected sky.",
        "Surface reflection is an additional path, not the only source of water color.",
        "The model selects wavelengths; it does not convert them."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The distant illumination has lost much of its red component. A nearby lamp supplies red light over a shorter water path for the object to reflect."
    }
  },
  "lines": {
    "title": "The atomic color code",
    "heading": "Relate spectral lines to energy differences.",
    "subtitle": "The atomic color code",
    "target": "Relate spectral lines to energy differences.",
    "visual": "atomic-lines",
    "paragraphs": [
      "An isolated atom has allowed energy states. When it moves from a higher state to a lower one and emits a photon, conservation of energy gives Ehigh − Elow = hf = hc/λ. The photon carries the difference between the two energies, not the atom's entire energy. Atomic electrons are described by quantum states rather than miniature planetary orbits.",
      "Because the allowed differences are discrete, a low-density excited gas can emit a pattern of distinct spectral lines. Different elements and ionization states have different patterns. A spectroscope separates the wavelengths, allowing the pattern to be compared with known transitions. One color impression is much less diagnostic than several well-measured lines.",
      "Absorption can produce missing wavelengths when light from a broad-spectrum background passes through cooler material with suitable transitions. The same energy differences underlie emission and absorption, though line strengths depend on state populations and conditions. Dense hot matter often produces a much broader thermal spectrum, rather than a set of isolated visible lines.",
      "Select a transition in the model's hypothetical three-level atom. Its energy levels are teaching values, not the measured levels of a named element. A larger energy drop gives a higher frequency and a shorter vacuum wavelength. The vertical arrows show changes in energy on an energy-axis diagram; they are not literal paths through space. Use both the initial and final levels when calculating a photon."
    ],
    "terms": [
      [
        "energy level",
        "An allowed energy state of a quantum system."
      ],
      [
        "line spectrum",
        "A spectrum with radiation concentrated at distinct wavelengths."
      ],
      [
        "transition",
        "A change between allowed states with an associated energy exchange."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A hypothetical atom drops from 3.0 eV to 1.0 eV. Find the emitted photon’s energy and approximate wavelength.",
      "reasoning": "The difference is 2.0 eV. Using hc ≈ 1240 eV·nm gives λ ≈ 620 nm, not 413 nm from the upper level alone."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Increase the energy difference of an emitting transition. Its photon has…",
      "options": [
        "Higher frequency and shorter wavelength",
        "Lower frequency and longer wavelength",
        "The same energy because all photons are identical"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: E = hf = hc/λ.",
        "Both trends are reversed for a larger energy difference.",
        "Photon energies depend on frequency."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The difference is 2.0 eV. Using hc ≈ 1240 eV·nm gives λ ≈ 620 nm, not 413 nm from the upper level alone."
    }
  },
  "maxwell": {
    "title": "Maxwell’s equations",
    "heading": "Connect field laws to a testable wave prediction.",
    "subtitle": "Maxwell’s equations",
    "target": "Connect field laws to a testable wave prediction.",
    "visual": "maxwell-light",
    "paragraphs": [
      "Maxwell's equations organize electric and magnetic phenomena into one field theory. Gauss's law for electricity relates electric flux through a closed surface to enclosed charge. Gauss's law for magnetism gives zero net magnetic flux through a closed surface: the classical theory has no isolated magnetic poles acting as sources or sinks.",
      "Faraday's law relates a circulating electric field to changing magnetic flux. The Ampère–Maxwell law relates a circulating magnetic field to electric current and changing electric flux. Maxwell's added changing-field term is essential even in a region where no charge crosses a gap. These are spatial and temporal constraints on one electromagnetic field, not a mechanical chain of tiny field objects pushing one another.",
      "In charge-free vacuum, the equations support traveling disturbances with speed c = 1/√(μ₀ε₀). That predicted speed matches light. Hertz then generated and detected radio-frequency waves and tested their reflection, interference, and propagation, connecting a mathematical prediction to observations. A detector responds when an arriving field exerts forces on its charges; source and receiver need not be joined by a material medium.",
      "The four-panel diagram lets you inspect each field relationship. Arrows show flux or circulation, not particle trajectories. Distinguish an enclosed charge from a current crossing a surface and from a changing electric field. Explaining which term matters in a capacitor gap is stronger evidence of understanding than merely reciting that electricity and magnetism are related."
    ],
    "terms": [
      [
        "electric flux",
        "A measure of the electric field passing through an oriented surface."
      ],
      [
        "magnetic flux",
        "A measure of the magnetic field passing through an oriented surface."
      ],
      [
        "displacement-current term",
        "The changing-electric-flux contribution in the Ampère–Maxwell law."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "No conduction current crosses an ideal capacitor’s insulating gap while it charges. Why can the magnetic-field law still be consistent?",
      "reasoning": "The changing electric flux in the gap supplies the Maxwell term. A conduction-current-only law would omit that contribution."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which addition was crucial to Maxwell’s wave prediction?",
      "options": [
        "Changing electric fields contribute to magnetic circulation",
        "Magnetic monopoles must flow through every wire",
        "Only matter can carry changing fields"
      ],
      "correct": 0,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Correct: it complements the changing-magnetic-flux relation in Faraday’s law.",
        "The classical equations do not require isolated magnetic charges.",
        "Electromagnetic disturbances can propagate in vacuum."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. The changing electric flux in the gap supplies the Maxwell term. A conduction-current-only law would omit that contribution."
    }
  },
  "production": {
    "title": "Production of electromagnetic waves",
    "heading": "Relate the source oscillation to both outgoing fields.",
    "subtitle": "Production of electromagnetic waves",
    "target": "Relate the source oscillation to both outgoing fields.",
    "visual": "em-production",
    "paragraphs": [
      "An alternating current in an antenna accelerates charges and changes the surrounding electric and magnetic fields. A radiated disturbance carries energy outward. The charges in the antenna do not travel all the way to the receiver; the receiver's own charges respond to the arriving field. The transmitter supplies the energy eventually delivered to the receiver and other surroundings.",
      "Far from a simple antenna, a small region of the radiation can often be approximated as a plane wave. The electric and magnetic fields are perpendicular to one another and to travel, and their oscillations are in phase. Their vacuum amplitudes satisfy E₀/B₀ = c. Because the units differ, equal field magnitudes are not expected even when a normalized drawing shows equal heights.",
      "The driving frequency determines the radiated frequency in this ideal stationary setup. Increasing frequency shortens wavelength through λ = c/f. A detector antenna responds to the electric field along its length, so orientation influences reception. Transmitter patterns also vary with direction: a real dipole does not radiate equally into every direction.",
      "The exploration links an oscillating source to labeled normalized field traces and a receiver. It represents far-field behavior, not the detailed near fields next to a wire. Change frequency while holding the electric-field amplitude fixed and distinguish wavelength from energy intensity. Frequency determines energy per photon, but the classical intensity also depends on field amplitude; those are separate comparisons."
    ],
    "terms": [
      [
        "radiation field",
        "The outward-propagating part of a source’s electromagnetic field."
      ],
      [
        "antenna",
        "A structure coupling electrical currents to electromagnetic radiation."
      ],
      [
        "plane wave",
        "An ideal wave with uniform phase over planes perpendicular to propagation."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A plane wave has peak electric field 300 V/m. Estimate peak magnetic field.",
      "reasoning": "B₀ = E₀/c ≈ 1.0 × 10⁻⁶ T. The fields peak together even though their numerical magnitudes differ in SI units."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Double source frequency at the same vacuum propagation speed. Wavelength…",
      "options": [
        "Doubles",
        "Halves",
        "Remains fixed because amplitude is fixed"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "The inverse relation follows from c = fλ.",
        "Correct: fixed c requires half the wavelength.",
        "Amplitude does not determine wavelength in this model."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. B₀ = E₀/c ≈ 1.0 × 10⁻⁶ T. The fields peak together even though their numerical magnitudes differ in SI units."
    }
  },
  "spectrum": {
    "title": "The electromagnetic spectrum",
    "heading": "Compare sources and interactions across one wave family.",
    "subtitle": "The electromagnetic spectrum",
    "target": "Compare sources and interactions across one wave family.",
    "visual": "em-spectrum",
    "paragraphs": [
      "Radio, microwave, infrared, visible, ultraviolet, X-ray, and gamma radiation form a continuous electromagnetic spectrum. Their names identify useful ranges and sometimes production mechanisms, not different substances. In vacuum every band propagates at c, with λ = c/f. Photon energy E = hf increases with frequency, while classical intensity also depends on how much radiation is present.",
      "Oscillating currents commonly generate radio waves; microwave sources also drive rapidly varying currents. Thermal matter emits a broad spectrum, often with substantial infrared radiation at everyday temperatures. Electronic transitions produce many visible and ultraviolet lines. High-energy electron deceleration and inner-electron transitions can produce X-rays; nuclear transitions are one source of gamma radiation. X-ray and gamma energy ranges can overlap, so origin also matters.",
      "Uses follow interactions, not a universal rule that higher frequency always penetrates farther. Radio reception depends on antennas, propagation, and bandwidth. Microwaves can heat lossy materials as energy is transferred to molecular motion; an oven need not operate at one sharp isolated water-molecule resonance. Infrared sensing detects emitted or reflected radiation. X-ray images depend on unequal attenuation along different paths. Absorption and penetration depend on material, frequency, and thickness.",
      "The spectrum explorer uses a logarithmic frequency axis so many orders of magnitude fit. A second panel compares amplitude and frequency modulation of a carrier. Information is encoded in a changing property, while an ordinary receiver converts the recovered electrical signal into sound. A radio wave is not itself a sound wave. Shorter wavelength can resolve smaller features in suitable instruments, but bandwidth, noise, aperture, and interaction physics also constrain a useful measurement."
    ],
    "terms": [
      [
        "carrier wave",
        "A wave whose properties are varied to encode information."
      ],
      [
        "amplitude modulation",
        "Encoding information by varying a carrier’s amplitude."
      ],
      [
        "frequency modulation",
        "Encoding information by varying a carrier’s instantaneous frequency."
      ],
      [
        "ionization",
        "Removal of an electron from an atom or molecule."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A 100 MHz radio transmission and a 500 THz visible beam cross vacuum. Compare speed and wavelength.",
      "reasoning": "Both travel at c. Their approximate wavelengths are 3 m and 600 nm. The radio receiver can recover a sound signal, but the propagating radio field is electromagnetic."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which statement about higher frequency is reliable?",
      "options": [
        "It always penetrates every material farther",
        "It gives greater energy per photon",
        "It automatically gives greater total beam power"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Penetration depends on the interaction and material.",
        "Correct: E = hf.",
        "Power also depends on the number of photons arriving per second, or classically on amplitude and area."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Both travel at c. Their approximate wavelengths are 3 m and 600 nm. The radio receiver can recover a sound signal, but the propagating radio field is electromagnetic."
    }
  },
  "emEnergy": {
    "title": "Energy in electromagnetic waves",
    "heading": "Connect power, area, and squared field amplitude.",
    "subtitle": "Energy in electromagnetic waves",
    "target": "Connect power, area, and squared field amplitude.",
    "visual": "em-energy",
    "paragraphs": [
      "An electromagnetic wave carries energy even before a receiver absorbs it. Its electric field can exert forces on charges, allowing energy transfer into matter. Intensity is average power crossing a unit area perpendicular to travel: I = P/A for a uniform beam. Specify whether a stated power is incident, transmitted, or absorbed before using it in a heating calculation.",
      "For a sinusoidal plane wave in vacuum, average intensity is I = ½ε₀cE₀², where E₀ is peak electric field. With B₀ = E₀/c, equivalent forms use magnetic amplitude or their product. The factor one-half comes from averaging a squared sinusoid. Using an rms electric field instead gives I = ε₀cErms², since Erms = E₀/√2.",
      "Doubling field amplitude quadruples intensity. Spreading the same power over twice the area halves intensity and reduces field amplitude by a factor of √2. These relationships differ from energy per photon, hf: increasing intensity at fixed frequency means a larger photon arrival rate on average, not a higher energy for every photon.",
      "The model assumes a uniform beam and computes peak fields from power and area. Real microwave cavities, focused beams, and reflective environments can have nonuniform fields and standing waves. The displayed values are an ideal energy-accounting exercise. To predict warming, also specify the absorbed fraction, duration, mass, and heat capacity; incident intensity alone cannot determine the final temperature of an arbitrary object."
    ],
    "terms": [
      [
        "intensity",
        "Average power crossing unit area perpendicular to propagation."
      ],
      [
        "peak field",
        "The maximum magnitude of an oscillating field."
      ],
      [
        "rms field",
        "The square root of the time average of the squared field."
      ]
    ],
    "worked": {
      "title": "Work through the idea",
      "prompt": "A uniform 12 W beam covers 0.020 m². What happens if its area doubles at the same power?",
      "reasoning": "Initially I = 600 W/m². Doubling area gives 300 W/m², and the peak field becomes 1/√2 of its original value."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Double the peak electric field at fixed waveform and medium. Average intensity…",
      "options": [
        "Doubles",
        "Quadruples",
        "Halves"
      ],
      "correct": 1,
      "hint": "Track the light from source to interaction to receiver. Identify what changes and what stays fixed.",
      "feedback": [
        "Intensity depends on the square, not the first power, of amplitude.",
        "Correct: (2E₀)² = 4E₀².",
        "A larger amplitude carries more intensity under these assumptions."
      ],
      "teacher": "Ask for a labeled source → interaction → receiver explanation. Initially I = 600 W/m². Doubling area gives 300 W/m², and the peak field becomes 1/√2 of its original value."
    }
  }
}
