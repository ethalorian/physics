import type {LessonContent} from './lesson-contract'
export const opticsLessons:Record<string,LessonContent> = {
  "reflection": {
    "title": "Reflection",
    "heading": "Track reflected energy and direction separately.",
    "subtitle": "Reflection",
    "target": "Track reflected energy and direction separately.",
    "visual": "reflect-light",
    "paragraphs": [
      "At a boundary, part of an incident wave can return into the original medium. That part is reflected. Another part may enter the second medium, and some energy may be absorbed. A surface can therefore produce a reflected image while also allowing you to see through it. A window viewed from a brightly lit room is a familiar example.",
      "The law of reflection determines the direction of an ideal reflected ray, not the fraction of energy reflected. That fraction depends on the materials, incidence angle, wavelength, and polarization. At normal incidence between nonabsorbing media, a simple optical model gives R = [(n₁ − n₂)/(n₁ + n₂)]². Air-to-glass indices 1 and 1.5 give about 4% reflection at one surface.",
      "A two-sided window has two boundaries, so its total reflection is not exactly the single-surface value. Coatings can also change reflection through interference. A perfectly reflecting boundary is an idealization, and a visually shiny object need not reflect every wavelength equally well.",
      "Use the ray diagram to predict a direction, then use a separate energy account to discuss brightness. Reversing a ray along a reciprocal optical path retraces the path, but does not imply that every practical device transmits all incident light. Specify which boundary and which incoming beam your explanation concerns."
    ],
    "terms": [
      [
        "reflection",
        "Return of a wave into its incident medium at an interaction."
      ],
      [
        "incident ray",
        "A ray arriving at an optical boundary."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Air and glass have indices 1 and 1.5. Estimate normal-incidence reflection at their single interface.",
      "reasoning": "R = (0.5/2.5)² = 0.04. About 4% reflects; the angle law alone would not give this percentage."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "The law of reflection tells you directly…",
      "options": [
        "The direction of a reflected ray",
        "That 100% of incident energy must reflect",
        "The color perceived by every observer"
      ],
      "correct": 0,
      "hint": "Separate the direction of a reflected ray from the fraction of incident energy it carries.",
      "feedback": [
        "Correct: angle equality specifies direction.",
        "Partial reflection also obeys the angle law.",
        "Color also depends on spectrum and observer response."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. angle equality specifies direction. Then use the worked example to test transfer to a new situation."
    }
  },
  "reflectionLaw": {
    "title": "The law of reflection",
    "heading": "Measure both angles from the local normal.",
    "subtitle": "The law of reflection",
    "target": "Measure both angles from the local normal.",
    "visual": "reflect-light",
    "paragraphs": [
      "Draw a normal perpendicular to the reflecting surface at the point where the ray arrives. The angle of incidence is between the incoming ray and this normal. The reflected ray makes the same angle with the normal on the opposite side. The incident ray, reflected ray, and normal lie in one plane.",
      "An angle measured from the surface is complementary to one measured from the normal. A ray arriving 20° above a horizontal mirror is 70° from its vertical normal. It leaves 70° from that normal, or 20° above the surface. Naming the reference line prevents a correct numerical value from being attached to the wrong angle.",
      "For a curved surface, use the local tangent plane and its perpendicular normal at each hit point. Neighboring points can have different normals and therefore send rays in different directions. This is how a curved mirror can focus or spread an incoming beam while every ray obeys the same law.",
      "In the model, move the incident direction and compare the two angles. Arrowheads identify travel toward and away from the boundary. The ray sketch omits wavelength and does not calculate reflection strength. Before discussing a mirror rotation, redraw its normal: rotating a plane mirror by a small angle turns the reflected direction by twice that angle when the incident direction stays fixed."
    ],
    "terms": [
      [
        "normal",
        "A line perpendicular to a surface at the point of interaction."
      ],
      [
        "angle of incidence",
        "The angle between an arriving ray and the local normal."
      ],
      [
        "angle of reflection",
        "The angle between the outgoing reflected ray and the local normal."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A ray makes 25° with a flat mirror surface. Find its angle of reflection.",
      "reasoning": "The incidence angle is 90° − 25° = 65° from the normal. The reflection angle is also 65° from the normal."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "A ray is 30° from the normal. The reflected ray is…",
      "options": [
        "60° from the normal",
        "30° from the surface",
        "30° from the normal"
      ],
      "correct": 2,
      "hint": "Mark a line perpendicular to the mirror. Measure both angles from that line.",
      "feedback": [
        "60° is its angle from the surface.",
        "That would be 60° from the normal.",
        "Correct: incidence and reflection angles use the same normal."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. incidence and reflection angles use the same normal. Then use the worked example to test transfer to a new situation."
    }
  },
  "mirror": {
    "title": "Mirrors",
    "heading": "Locate a virtual image by extending reflected rays.",
    "subtitle": "Mirrors",
    "target": "Locate a virtual image by extending reflected rays.",
    "visual": "plane-mirror",
    "paragraphs": [
      "A plane mirror sends rays from one object point toward an observer as if they had come from a point behind the mirror. Extend the reflected rays backward to locate that apparent origin. The extensions are construction lines: the actual reflected light remains in front of an opaque mirror.",
      "The image is virtual because the outgoing rays do not physically converge at its location. A screen placed behind the mirror would not receive a focused image there. Nevertheless, a person can see it and a camera can photograph it, because their lenses focus the real arriving light onto a retina or sensor.",
      "For a flat mirror, the image lies as far behind the mirror as the object lies in front. Image height equals object height, and the image is upright. The transformation reverses the coordinate perpendicular to the mirror. It does not single out left versus right independently of how the observer compares orientations.",
      "Curved mirrors produce other distance and size relationships. A convex mirror gives an upright reduced virtual image for a real object, while a concave mirror can produce either a real image or a magnified virtual one. The plane-mirror exploration isolates the symmetric case. Move the object and compare object-to-mirror, mirror-to-image, and object-to-image distances before predicting where an observer should focus."
    ],
    "terms": [
      [
        "virtual image",
        "An apparent source location obtained from backward extensions of outgoing rays."
      ],
      [
        "plane mirror",
        "A mirror with a flat reflecting surface."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "An object is 1.2 m in front of a plane mirror. How far is it from its image?",
      "reasoning": "The image is 1.2 m behind the mirror, giving 2.4 m from object to image. The image location is not the mirror surface."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Can a camera photograph a virtual mirror image?",
      "options": [
        "Only if light passes through the mirror",
        "No, because virtual means no light enters the camera",
        "Yes, by focusing the arriving reflected rays"
      ],
      "correct": 2,
      "hint": "Trace real reflected light into a camera lens, then distinguish its sensor image from the mirror image.",
      "feedback": [
        "Transmission through the mirror is unnecessary.",
        "Reflected light really does enter the camera.",
        "Correct: the camera forms its own real sensor image from those rays."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. the camera forms its own real sensor image from those rays. Then use the worked example to test transfer to a new situation."
    }
  },
  "diffuse": {
    "title": "Diffuse reflection",
    "heading": "Use different local normals to explain many outgoing directions.",
    "subtitle": "Diffuse reflection",
    "target": "Use different local normals to explain many outgoing directions.",
    "visual": "diffuse-light",
    "paragraphs": [
      "A rough surface can scatter incident light across many directions. In a geometric picture, small surface patches have different local orientations. A parallel bundle arriving at those patches encounters different normals, and each patch reflects its ray according to equal incident and reflected angles.",
      "Diffuse reflection therefore does not require breaking the law of reflection. It requires applying that law to the actual local surface rather than one imaginary normal for the entire object. A sheet of paper can send light toward readers at many positions, while a smooth mirror sends a narrow incident bundle into a much more restricted set of directions.",
      "Roughness is relative to wavelength and incidence conditions. A surface that is effectively smooth for long radio waves can be rough for visible light. At microscopic scales, a complete treatment uses wave scattering and material properties rather than treating every patch as an independent perfect mirror.",
      "The adjustable diagram changes facet orientations under vertically incident rays. It exaggerates the facets to show their normals and reflected directions. Real rough surfaces generally have a distribution of slopes rather than a few repeated tilted patches. Explain how spreading the same reflected power across more directions can change brightness at one observer without requiring an increase in total reflected energy."
    ],
    "terms": [
      [
        "diffuse reflection",
        "Reflection spread over a range of directions by a surface."
      ],
      [
        "specular reflection",
        "Mirror-like reflection concentrated around the direction predicted for a smooth surface."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Why can several students read the same illuminated page from different seats?",
      "reasoning": "Its rough surface sends reflected light into many directions. Each observer receives some of those paths; local reflection still obeys the angle law."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "For diffuse reflection, which statement holds?",
      "options": [
        "Local incidence and reflection angles can still be equal",
        "All incident energy must be absorbed",
        "Every ray leaves along one shared global normal"
      ],
      "correct": 0,
      "hint": "Draw a separate perpendicular line at each small surface patch.",
      "feedback": [
        "Correct: the local normals differ across the surface.",
        "Absorption and directional spreading are different processes.",
        "Different patch orientations yield different reflected directions."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. the local normals differ across the surface. Then use the worked example to test transfer to a new situation."
    }
  },
  "echo": {
    "title": "Reflection of sound",
    "heading": "Distinguish one delayed echo from a reverberating room.",
    "subtitle": "Reflection of sound",
    "target": "Distinguish one delayed echo from a reverberating room.",
    "visual": "echo-room",
    "paragraphs": [
      "A reflected sound follows a longer path than a direct sound, so it arrives later. If the delay is large enough, the listener may recognize a separate echo. Many closely spaced reflections instead blend into a decaying continuation called reverberation. The same room can contain both kinds of arrival patterns.",
      "For a source and receiver together a distance d from a flat wall, the simplest echo travels approximately 2d. At sound speed v, its delay is 2d/v. The round-trip reasoning resembles light ranging, but sound propagates much more slowly and depends on its material medium.",
      "Wall treatments affect both absorption and scattering. Absorption removes energy from the reverberating sound field, while irregular surfaces redistribute reflected sound. A diffuser does not automatically absorb everything it redirects. Designing a useful room requires balancing clarity, coverage, and persistence rather than assuming that every reflection is harmful.",
      "The diagram shows a single-wall return path and an illustrative sequence of progressively weaker reflections. It holds propagation speed at 340 m/s and treats each successive bounce as retaining the same fraction of energy. Real rooms have many path lengths, frequency-dependent surfaces, and sound sources with directional patterns. Use this model to isolate timing and energy loss, then identify which extra details a real room would require."
    ],
    "terms": [
      [
        "echo",
        "A reflected sound heard as a distinct delayed arrival."
      ],
      [
        "reverberation",
        "Persistence of sound from many overlapping reflections."
      ],
      [
        "acoustics",
        "The study of sound and its behavior."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A listener and source are 17 m from a wall. Estimate the echo delay at 340 m/s.",
      "reasoning": "The return path is 34 m, so delay = 34/340 = 0.10 s. Using only 17 m would omit half the path."
    },
    "check": {
      "title": "Predict the sound path",
      "prompt": "An absorbing panel mainly reduces reverberation by…",
      "options": [
        "Increasing the speed of every reflection",
        "Creating a new sound source of equal power",
        "Removing energy from the returning sound field"
      ],
      "correct": 2,
      "hint": "Track the energy remaining after each encounter with the room surfaces.",
      "feedback": [
        "Absorption does not require a faster propagation speed.",
        "It reduces reflected energy rather than replacing it with equal new sound.",
        "Correct: less sound energy remains after interaction."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. less sound energy remains after interaction. Then use the worked example to test transfer to a new situation."
    }
  },
  "refraction": {
    "title": "Refraction",
    "heading": "Connect wavefront speed changes to ray bending.",
    "subtitle": "Refraction",
    "target": "Connect wavefront speed changes to ray bending.",
    "visual": "snell-light",
    "paragraphs": [
      "When a wave enters a region with a different propagation speed, its wavelength changes if the source frequency stays fixed. At an oblique boundary, one part of a wavefront reaches the new region before another. Their differing advances rotate the wavefront, changing the ray direction perpendicular to it.",
      "For a stationary boundary between uniform isotropic media, the frequency is the same on both sides. The geometric relationship can be written sin θ₁/v₁ = sin θ₂/v₂, with both angles measured from the normal. Entering a slower medium bends a transmitted ray toward the normal; entering a faster one bends it away, when a propagating transmitted ray exists.",
      "At normal incidence, speed and wavelength can change without changing the ray direction. This limiting case shows why a speed change does not always imply a visible bend. Reflection can occur at the same boundary, so tracing the transmitted direction is only part of a complete energy account.",
      "The exploration uses optical indices n = c/v and Snell's equivalent form n₁ sin θ₁ = n₂ sin θ₂. Keep frequency fixed while adjusting the index. The model describes a planar interface and excludes absorption and dispersion. Compare the ray direction with the physical wavelength ratio; a shorter wavelength in the slower medium is not evidence that the source is oscillating more rapidly."
    ],
    "terms": [
      [
        "refraction",
        "Change in propagation associated with entering a different optical medium or speed region."
      ],
      [
        "wavefront",
        "A surface of equal phase in a wave."
      ],
      [
        "Snell’s law",
        "n₁ sin θ₁ = n₂ sin θ₂ for a stationary isotropic optical interface."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A wave enters a slower medium directly along the normal. What changes?",
      "reasoning": "Speed and wavelength decrease while frequency stays fixed. Direction remains along the normal because both incidence and refraction angles are zero."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "A transmitted ray enters a higher-index medium obliquely. It bends…",
      "options": [
        "Because the source frequency must double",
        "Toward the normal",
        "Away from the normal"
      ],
      "correct": 1,
      "hint": "Use n₁ sin θ₁ = n₂ sin θ₂ and measure both angles from the normal.",
      "feedback": [
        "A stationary boundary does not change the source frequency.",
        "Correct: larger n₂ requires smaller sin θ₂.",
        "That is the usual trend for entering a lower-index medium."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. larger n₂ requires smaller sin θ₂. Then use the worked example to test transfer to a new situation."
    }
  },
  "soundRefraction": {
    "title": "Refraction of sound",
    "heading": "Use a speed gradient to predict a curved sound path.",
    "subtitle": "Refraction of sound",
    "target": "Use a speed gradient to predict a curved sound path.",
    "visual": "sound-gradient",
    "paragraphs": [
      "Sound speed in air depends on temperature, and the wind can change propagation relative to the ground. If different parts of a wavefront advance at different speeds, its direction changes gradually. This is refraction through a speed gradient, even without a sharply defined boundary between two materials.",
      "For still air, warmer regions usually have a greater sound speed. A ray tends to curve toward the region of lower speed. When the ground-level air is warmer than the air above, near-horizontal sound paths can curve upward, away from a distant listener near the surface. A cooler layer below warmer air can instead curve paths downward.",
      "Wind requires an additional directional comparison. The component of wind along the propagation direction contributes to ground-relative travel, and a change of that component with height can refract sound. A uniform wind and a wind gradient are different conditions. Real outdoor audibility also depends on spreading, absorption, obstacles, and background noise.",
      "The diagram contrasts warmer and cooler air near the ground with no wind. Its curvature is schematic, magnified to make the direction visible; it is not a forecast of listening range. Track which edge of a wavefront travels faster, then predict the direction toward the slower region. This reasoning transfers to optical gradients, but the relationship between temperature and light speed in air differs from that for sound."
    ],
    "terms": [
      [
        "speed gradient",
        "A systematic spatial change in propagation speed."
      ],
      [
        "temperature inversion",
        "A layer in which air temperature increases with height."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Still air is cool near a lake and warmer above it. Predict the tendency of near-horizontal sound paths.",
      "reasoning": "Sound is slower in the cool lower layer, so paths tend to curve downward. This can help sound reach a distant low receiver under suitable conditions."
    },
    "check": {
      "title": "Predict the sound path",
      "prompt": "In still air, sound rays tend to curve toward…",
      "options": [
        "Lower sound speed",
        "Higher sound speed",
        "Only a solid wall"
      ],
      "correct": 0,
      "hint": "Compare how far the upper and lower parts of a sound wavefront advance in the same time.",
      "feedback": [
        "Correct: the wavefront rotates toward the slower region.",
        "The faster side advances farther, turning the ray toward the slower side.",
        "A continuous speed gradient can bend a wave without a solid boundary."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. the wavefront rotates toward the slower region. Then use the worked example to test transfer to a new situation."
    }
  },
  "lightRefraction": {
    "title": "Refraction of light",
    "heading": "Apply Snell’s law and explain apparent depth.",
    "subtitle": "Refraction of light",
    "target": "Apply Snell’s law and explain apparent depth.",
    "visual": "snell-depth",
    "paragraphs": [
      "Refractive index connects light's vacuum speed with its phase speed in a medium: n = c/v. At a stationary boundary, the frequency is unchanged and Snell's law gives n₁ sin θ₁ = n₂ sin θ₂. Measure both angles from the same interface normal, and label which index belongs to the arriving ray.",
      "For air entering water, n increases and the transmitted ray bends toward the normal. For water entering air, the transmitted ray bends away from it until the critical-angle limit is reached. At normal incidence there is no directional bend even though speed and wavelength change. In a slab with parallel faces and the same medium on both sides, the exiting ray is parallel to the incident ray but can be laterally displaced.",
      "Looking almost straight down at an object under a flat water surface, rays leaving water bend away from the normal. Extending the received rays backward places the apparent object closer to the surface. In the small-angle approximation, apparent depth equals real depth times nviewer/nobject-medium. Water index 1.33 gives an apparent depth about three quarters of the actual depth for an observer in air.",
      "This approximation becomes less accurate at large viewing angles, and a curved container can behave as a lens. Use the model to predict refraction first, then compare the separate near-normal depth calculation. The object remains where it was; the apparent position changes because the observer receives redirected light."
    ],
    "terms": [
      [
        "refractive index",
        "Vacuum light speed divided by phase speed in a specified medium."
      ],
      [
        "apparent depth",
        "Depth inferred by extending received rays backward as straight lines."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Estimate the apparent depth of a 2.0 m pool viewed nearly straight down from air, using nwater = 1.33.",
      "reasoning": "d apparent ≈ 2.0/1.33 = 1.50 m. The bottom has not risen; refraction changes its apparent location."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Light crosses into glass along the normal. Which can change?",
      "options": [
        "Frequency but never wavelength",
        "Neither speed nor wavelength",
        "Wavelength but not frequency"
      ],
      "correct": 2,
      "hint": "Use v = fλ while keeping the source frequency fixed across the stationary boundary.",
      "feedback": [
        "The relation v = fλ requires wavelength to adjust.",
        "Normal incidence removes bending, not the speed change.",
        "Correct: the stationary boundary preserves frequency while the medium changes phase speed."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. the stationary boundary preserves frequency while the medium changes phase speed. Then use the worked example to test transfer to a new situation."
    }
  },
  "atmosphere": {
    "title": "Atmospheric refraction",
    "heading": "Explain a mirage through a continuous optical gradient.",
    "subtitle": "Atmospheric refraction",
    "target": "Explain a mirage through a continuous optical gradient.",
    "visual": "air-gradient",
    "paragraphs": [
      "Air has a refractive index only slightly greater than one, but small changes accumulated along a long path can visibly redirect light. Temperature, pressure, and composition affect air density and its optical response. Rays through a smooth gradient tend to bend toward higher refractive index, where phase speed is lower.",
      "Near a hot road, a low-density hot layer can have a lower refractive index than the cooler air above it. A downward-traveling ray from the sky can curve upward through the gradient and reach an observer. The observer's straight backward extension suggests light from below, creating the appearance of a sky reflection on a wet road even when the road is dry.",
      "This inferior mirage is produced by real light paths and can be photographed. It is not a source of water and not merely an imagined picture. Other temperature structures can produce different mirage geometries. Turbulent fluctuations can make distant views shimmer by continually changing the refractive paths.",
      "Near the horizon, the usual vertical density variation of the atmosphere also shifts the apparent position of astronomical objects. The exact displacement depends on atmospheric conditions, so one fixed correction is not universal. The model exaggerates a hot-surface gradient to isolate the bending direction. Compare the actual curved ray with its dashed backward sightline, and distinguish the inferred image location from a physical reflecting surface."
    ],
    "terms": [
      [
        "mirage",
        "An apparent displaced or distorted image caused by atmospheric refraction."
      ],
      [
        "index gradient",
        "A spatial variation in refractive index."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A dry hot road appears to contain a patch of reflected sky. Explain the path without adding water.",
      "reasoning": "Light from the sky curves through a lower-index hot layer and enters the eye. Backward straight-line interpretation makes it appear to originate near or below the road."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "A mirage can be photographed because…",
      "options": [
        "The road must contain an invisible mirror",
        "A real optical path carries light to the camera",
        "Only a human imagination creates it"
      ],
      "correct": 1,
      "hint": "Distinguish the actual curved path from its straight backward interpretation.",
      "feedback": [
        "A continuous refractive-index gradient can supply the effect.",
        "Correct: refraction changes the arriving ray direction.",
        "A camera records the redirected light too."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. refraction changes the arriving ray direction. Then use the worked example to test transfer to a new situation."
    }
  },
  "dispersion": {
    "title": "Dispersion in a prism",
    "heading": "Separate wavelengths through unequal refraction.",
    "subtitle": "Dispersion in a prism",
    "target": "Separate wavelengths through unequal refraction.",
    "visual": "prism-light",
    "paragraphs": [
      "A transparent material's refractive index generally depends on wavelength. In ordinary visible-range dispersion, blue or violet light has a somewhat larger index than red light. Snell's law then predicts different directions for the transmitted wavelengths, even when they enter with the same incident direction.",
      "A triangular prism has nonparallel faces. Refraction at its entrance and exit can produce a net angular separation, making the spectrum easier to see. Frequency stays unchanged at both stationary boundaries. The prism redirects existing spectral components rather than creating them or permanently changing their vacuum speeds.",
      "A useful quantitative comparison is minimum deviation through a prism of apex angle A. At that symmetric path, δmin = 2 asin[n sin(A/2)] − A for a prism in air, provided the transmitted path exists. Increasing index increases this deviation in the ordinary operating range. Use degrees or radians consistently inside the trigonometric functions.",
      "The exploration compares two chosen indices for a 60° prism. The paths are schematic while the minimum-deviation values are calculated. Real glasses have measured dispersion curves, and anomalous dispersion near absorption features needs more care than a universal claim about all blue light. A parallel-sided plate can laterally separate colors while leaving their final directions parallel; nonparallel surfaces make angular spreading particularly clear."
    ],
    "terms": [
      [
        "dispersion",
        "Variation of refractive index or wave propagation with wavelength."
      ],
      [
        "deviation angle",
        "The change between incoming and outgoing ray directions."
      ],
      [
        "prism apex angle",
        "The angle between the two refracting faces of a prism."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "At minimum deviation in the same glass prism, blue has n = 1.53 and red has n = 1.51. Which deviates more?",
      "reasoning": "The minimum-deviation expression increases with n here, so blue has the larger deviation. Both retain their original frequencies."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "After dispersed light returns to vacuum, different visible wavelengths…",
      "options": [
        "Again all travel at c",
        "Retain permanently different vacuum speeds",
        "Must become one frequency"
      ],
      "correct": 0,
      "hint": "Separate the refractive index of a material from the vacuum speed of light.",
      "feedback": [
        "Correct: material dispersion does not alter the vacuum constant.",
        "Their speeds differed inside the medium, not in vacuum.",
        "They retain their distinct frequencies."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. material dispersion does not alter the vacuum constant. Then use the worked example to test transfer to a new situation."
    }
  },
  "rainbow": {
    "title": "The rainbow",
    "heading": "Trace a drop path and the observer’s viewing cone.",
    "subtitle": "The rainbow",
    "target": "Trace a drop path and the observer’s viewing cone.",
    "visual": "rainbow-light",
    "paragraphs": [
      "A primary rainbow forms from light that enters a water droplet, reflects once internally, and exits through another part of the surface. Refraction at entry and exit separates wavelengths because water's index varies with wavelength. The internal reflection in the principal rainbow path is partial; it need not be total internal reflection.",
      "Many neighboring incident paths emerge near a minimum-deviation direction, concentrating brightness near the rainbow angle. In a spherical-drop ray model, the primary bow is around 42° from the antisolar direction for red and around 40° for violet. These angles describe the line opposite the Sun through the observer, not an arbitrary angle above the horizon.",
      "Different droplets send the required colors toward a particular eye. Rotating a selected viewing direction around the antisolar axis traces a cone, whose intersection with the droplet-filled scene creates an arc or circle. Moving the observer changes which drops contribute. A rainbow is not a fixed painted object with a reachable endpoint.",
      "A secondary bow uses two internal reflections and has reversed color order, with lower brightness under typical conditions. The exploration shows the geometry of a spherical primary-bow drop and computes its deviation from Snell's law. Droplet size, wave interference, finite solar angular size, and nonspherical drops can add features beyond this ray model. Begin by putting the Sun behind the observer before predicting where the primary bow can appear."
    ],
    "terms": [
      [
        "antisolar direction",
        "The direction directly opposite the Sun from an observer."
      ],
      [
        "primary rainbow",
        "A bow associated mainly with one internal reflection in spherical water droplets."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Two observers stand several meters apart. Do precisely the same drops necessarily send the same rainbow color to both?",
      "reasoning": "No. Each observer has a different viewing cone, so the contributing paths and droplets differ even though the bows appear similar."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "The primary bow’s roughly 42° red angle is measured from…",
      "options": [
        "Straight upward in every case",
        "The surface normal of the ground",
        "The antisolar direction"
      ],
      "correct": 2,
      "hint": "Draw the direction from the observer directly away from the Sun.",
      "feedback": [
        "The bow’s position depends on the Sun’s elevation.",
        "The ground normal does not define the rainbow cone.",
        "Correct: its center is opposite the Sun."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. its center is opposite the Sun. Then use the worked example to test transfer to a new situation."
    }
  },
  "tir": {
    "title": "Total internal reflection",
    "heading": "Find the critical angle before deciding whether a ray escapes.",
    "subtitle": "Total internal reflection",
    "target": "Find the critical angle before deciding whether a ray escapes.",
    "visual": "fiber-light",
    "paragraphs": [
      "A ray traveling from a higher refractive index to a lower one bends away from the normal. Increasing incidence angle eventually makes Snell's predicted refraction angle reach 90°. That incident angle is the critical angle, θc = asin(n₂/n₁), and exists only when n₁ > n₂.",
      "For larger incidence angles, Snell's law would require a sine greater than one. There is no propagating transmitted ray carrying energy away into a uniform lossless second medium; the ideal boundary totally internally reflects the incident power. A decaying evanescent field still extends beyond the boundary, so saying absolutely no field exists outside is too strong.",
      "An optical fiber can guide light because its core index exceeds its cladding index. Rays within an appropriate range repeatedly meet the core–cladding boundary above the critical angle. Real fibers still lose energy through absorption, scattering, bends, and imperfect coupling. Total reflection at an ideal boundary does not make an entire real fiber lossless.",
      "A high-index gemstone has a small critical angle against air, helping trap and redirect suitable internal paths. Geometry still determines where rays eventually exit. In the model, choose the indices and incidence angle independently before tracing the ray. Do not apply the critical-angle formula to an air-to-glass incoming ray: the order of the indices is part of the physical condition, not a labeling detail."
    ],
    "terms": [
      [
        "critical angle",
        "The higher-to-lower-index incidence angle giving a 90° refracted direction."
      ],
      [
        "total internal reflection",
        "Complete reflection at an ideal lossless boundary above the critical angle."
      ],
      [
        "cladding",
        "The lower-index outer optical material surrounding a fiber core."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Light in n = 1.50 glass approaches air at 50° from the normal.",
      "reasoning": "θc = asin(1/1.5) ≈ 41.8°. Because 50° exceeds it and the ray travels from higher to lower index, total internal reflection occurs in the ideal model."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Can light entering glass from air undergo total internal reflection at that first boundary?",
      "options": [
        "Only if its frequency doubles",
        "Yes, at any steep angle",
        "No, it is entering the higher-index medium"
      ],
      "correct": 2,
      "hint": "Check which side has the larger refractive index before calculating a critical angle.",
      "feedback": [
        "A stationary boundary does not double frequency.",
        "The required index direction is reversed.",
        "Correct: TIR requires travel from higher index toward lower index."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. TIR requires travel from higher index toward lower index. Then use the worked example to test transfer to a new situation."
    }
  },
  "lensKinds": {
    "title": "Converging and diverging lenses",
    "heading": "Use parallel rays to define a focal length.",
    "subtitle": "Converging and diverging lenses",
    "target": "Use parallel rays to define a focal length.",
    "visual": "lens-parallel",
    "paragraphs": [
      "A lens redirects light through refraction at its surfaces. In the thin-lens approximation, its thickness is small compared with the relevant object and image distances. Rays near the principal axis can then be represented as changing direction at one lens plane, simplifying a two-surface optical problem.",
      "A converging lens sends an incoming axis-parallel bundle toward a focal point on the outgoing side. Its focal length is positive in the convention used here. A diverging lens makes that bundle spread as if it came from a focal point on the incoming side, giving a negative focal length. Dashed backward extensions locate that virtual origin.",
      "For an ordinary glass lens in air, thicker-center shapes usually converge and thinner-center shapes usually diverge. Shape alone is not a universal rule: the relative refractive indices of the lens and surrounding medium matter. The same shape in a different surrounding material can behave differently.",
      "Optical power is P = 1/f with f in meters, giving units of inverse meters called diopters. A +0.25 m lens has +4 D of power. In the exploration, compare incoming and outgoing directions while switching the sign of focal length. The axis is a reference line, not an additional ray, and the focal marks apply to an incoming parallel bundle rather than to every object position."
    ],
    "terms": [
      [
        "converging lens",
        "A lens that focuses an axis-parallel bundle in the stated surrounding medium."
      ],
      [
        "diverging lens",
        "A lens that spreads an axis-parallel bundle as if from a virtual focus."
      ],
      [
        "diopter",
        "The unit of optical power, equal to one inverse meter."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Compare focal lengths +0.20 m and +0.40 m.",
      "reasoning": "Their powers are +5 D and +2.5 D. The shorter focal length gives greater convergence for a given incoming ray height."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "A diverging thin lens in air has, in this convention…",
      "options": [
        "Negative focal length",
        "Zero optical power in every case",
        "A real focus for parallel incoming rays"
      ],
      "correct": 0,
      "hint": "Trace parallel input and decide whether actual outgoing rays meet or only their backward extensions meet.",
      "feedback": [
        "Correct: its focus is the backward extension of diverging outgoing rays.",
        "A diverging lens has nonzero negative optical power.",
        "Parallel input spreads after the lens."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. its focus is the backward extension of diverging outgoing rays. Then use the worked example to test transfer to a new situation."
    }
  },
  "images": {
    "title": "Image formation by a lens",
    "heading": "Decide whether rays or their extensions meet.",
    "subtitle": "Image formation by a lens",
    "target": "Decide whether rays or their extensions meet.",
    "visual": "thin-lens",
    "paragraphs": [
      "An image point corresponds to rays from one object point. When outgoing rays physically converge, they form a real image that can be intercepted by a screen. When the rays diverge but their backward extensions meet, they define a virtual image. Real and virtual describe the ray geometry, not whether an observer is allowed to see the image.",
      "For a thin converging lens and a real object beyond the focal point, the image is real and inverted. Moving the object inside the focal length changes the outgoing bundle to a diverging one, creating an upright magnified virtual image on the object's side. At the focal point itself, the outgoing rays are parallel and there is no finite image distance.",
      "A diverging lens with a real object produces an upright reduced virtual image. This statement assumes one lens and a real object; multi-element systems can send converging rays into a diverging lens and require a more general analysis. Always identify the incoming bundle rather than applying a memorized rule without its conditions.",
      "Use the model to move the object through the focal position. Solid segments show actual rays and dashed segments show only backward constructions. The image calculation uses 1/f = 1/dₒ + 1/dᵢ and m = −dᵢ/dₒ. Positive image distance means a real image on the outgoing side; negative means a virtual image on the incoming side. Check that the sign and orientation agree with the drawing."
    ],
    "terms": [
      [
        "real image",
        "An image formed by actual convergence of rays from object points."
      ],
      [
        "virtual image",
        "An apparent origin located by backward extensions of outgoing rays."
      ],
      [
        "magnification",
        "Image height divided by object height, with sign indicating orientation."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A converging lens has f = 10 cm and dₒ = 30 cm.",
      "reasoning": "1/dᵢ = 1/10 − 1/30 gives dᵢ = 15 cm; m = −0.5. The real image is inverted and half as tall."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Place a real object inside a converging lens’s focal length. Its image is…",
      "options": [
        "Real and always smaller",
        "A finite image at the back focal point",
        "Virtual, upright, and enlarged"
      ],
      "correct": 2,
      "hint": "Compare dₒ with f and check the signs of dᵢ and −dᵢ/dₒ.",
      "feedback": [
        "A real image from this single lens requires the object beyond f.",
        "Only a distant axis-parallel bundle focuses at the back focal point.",
        "Correct: outgoing rays diverge but extend back to an enlarged apparent source."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. outgoing rays diverge but extend back to an enlarged apparent source. Then use the worked example to test transfer to a new situation."
    }
  },
  "rayConstruction": {
    "title": "Constructing images through ray diagrams",
    "heading": "Trace two rays from the same object point.",
    "subtitle": "Constructing images through ray diagrams",
    "target": "Trace two rays from the same object point.",
    "visual": "lens-rays",
    "paragraphs": [
      "A useful ray diagram starts with a principal axis, a lens plane, the two focal points, and a clearly located object. Choose one point on the object, often the arrow tip. At least two rays from that same point are needed to locate its image; combining rays from different object points does not identify one image point.",
      "For an ideal thin converging lens, an incoming ray parallel to the axis leaves through the far focus. A ray through the lens center continues approximately straight. A ray directed through the near focus leaves parallel to the axis. These convenient rays sample a much larger bundle; they are not the only light that forms an image.",
      "When the object is inside the focal length, the actual outgoing rays do not meet. Extend them backward with dashed lines to locate the virtual image. For a diverging lens, the outgoing parallel-input ray appears to come from the near focus, while the central ray again remains straight in the thin-lens approximation.",
      "The model reveals principal rays in stages. Predict their intersection before revealing the image. If a ray appears to miss the image, check the chosen object point, the focal sign, and the scale. Covering part of a lens generally reduces light from every object point rather than deleting one matching half of the image, although vignetting and aperture limits can complicate a real system."
    ],
    "terms": [
      [
        "principal axis",
        "The reference line through the centers of a centered optical system."
      ],
      [
        "principal ray",
        "A convenient ray whose path is known from the ideal lens rules."
      ],
      [
        "ray tracing",
        "Following optical paths through successive interactions to locate images."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Cover the top half of an ideal imaging lens. Must the top half of the image disappear?",
      "reasoning": "No. Remaining lens regions still receive rays from many object points, so a full dimmer image can form, subject to field and aperture limits."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "To locate one image point, the traced rays must start…",
      "options": [
        "Only at the center of the lens",
        "At the same object point",
        "At any two unrelated parts of the object"
      ],
      "correct": 1,
      "hint": "A point on the object sends a bundle of rays through different parts of the lens.",
      "feedback": [
        "Rays begin at the object and then pass through the lens.",
        "Correct: image formation maps each object point to its own ray bundle.",
        "Different source points generally have different images."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. image formation maps each object point to its own ray bundle. Then use the worked example to test transfer to a new situation."
    }
  },
  "imageSummary": {
    "title": "Image formation summarized",
    "heading": "Classify the image before calculating its location.",
    "subtitle": "Image formation summarized",
    "target": "Classify the image before calculating its location.",
    "visual": "lens-cases",
    "paragraphs": [
      "For a converging thin lens, compare a real object's distance with f and 2f. Beyond 2f, the real inverted image lies between f and 2f and is smaller. At 2f, image distance is 2f and image size equals object size, with inversion. Between f and 2f, the real inverted image lies beyond 2f and is enlarged.",
      "At dₒ = f, outgoing rays are parallel, so the ideal image is at infinity rather than at a finite screen position. Inside f, the image is virtual, upright, and enlarged. An object approaching f from either side gives a rapidly changing image distance, so a diagram with a fixed small viewing window may place the image offscreen.",
      "For a diverging lens and a real object, dᵢ stays negative and the image stays upright and reduced. The thin-lens equation gives the same classification when its sign convention is used consistently. An inverted image has negative signed magnification; its physical height magnitude remains positive.",
      "Use the case selector to compare representative positions before manipulating a continuous distance. The numerical result remains valid even if the drawing must change its display scale. A useful explanation states location, orientation, size, and whether a screen can receive the image. A list of those four properties is more informative than saying only that the lens magnifies."
    ],
    "terms": [
      [
        "focal length",
        "The signed distance from the thin-lens plane to the appropriate focus."
      ],
      [
        "image distance",
        "The signed distance from an optical element to an image in a stated convention."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Where is the image of an object at 2f in a converging thin lens?",
      "reasoning": "It lies at 2f on the outgoing side, is real and inverted, and has m = −1. Equal height magnitude does not mean upright."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "At dₒ = f for an ideal converging lens, outgoing rays from one point…",
      "options": [
        "Are parallel with no finite image distance",
        "Meet at dᵢ = 0",
        "Form an upright image exactly at f"
      ],
      "correct": 0,
      "hint": "Substitute dₒ = f into 1/dᵢ = 1/f − 1/dₒ.",
      "feedback": [
        "Correct: 1/dᵢ becomes zero.",
        "An image at the lens plane would not satisfy the equation.",
        "The focal-object case gives a parallel outgoing bundle."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. 1/dᵢ becomes zero. Then use the worked example to test transfer to a new situation."
    }
  },
  "instruments": {
    "title": "Some common optical instruments",
    "heading": "Treat each optical element as one step in an image chain.",
    "subtitle": "Some common optical instruments",
    "target": "Treat each optical element as one step in an image chain.",
    "visual": "instrument-chain",
    "paragraphs": [
      "A camera forms a real image on a sensor or film. In a simple model, a converging lens maps each scene point to a sensor point, with the image inverted. Focusing changes the optical configuration so that the image plane coincides with the sensor. A camera's displayed picture can then be oriented electronically or mechanically.",
      "A telescope uses an objective to gather light from a distant scene and form an intermediate image. An eyepiece lets the observer view that image under a larger angle. A compound microscope instead places a nearby specimen just beyond its objective's focal point, producing an enlarged intermediate image that the eyepiece further magnifies.",
      "Aperture controls the cone of admitted light and affects resolution, aberrations, and depth of field. Exposure time controls how long a camera sensor collects light. More magnification by itself does not guarantee more resolved detail: a blurred intermediate image can simply become a larger blur.",
      "The diagram lets you select an instrument and follow the role of each stage. It is an optical-path map rather than a complete engineering drawing. Real cameras and eyepieces contain multiple elements to control aberrations, and binoculars often use prisms to reorient the view. Name which stage forms a real image and which stage makes it easier to inspect before multiplying magnifications or comparing brightness."
    ],
    "terms": [
      [
        "objective",
        "The optical element or group first gathering light from the object."
      ],
      [
        "eyepiece",
        "The optical group used to view an intermediate image."
      ],
      [
        "aperture",
        "An opening that limits the admitted light bundle."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A telescope eyepiece is replaced with one giving twice the angular magnification. Does it necessarily reveal twice the detail?",
      "reasoning": "No. Detail already lost through diffraction, aberrations, or atmospheric blur is not restored by enlarging the intermediate image."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Which device intentionally forms a real image on a detector?",
      "options": [
        "Only a single magnifying glass inside f",
        "A plane mirror by itself",
        "A camera"
      ],
      "correct": 2,
      "hint": "A detector records an image where actual rays from each object point come together.",
      "feedback": [
        "That magnifier produces a virtual image in the stated configuration.",
        "A plane mirror produces a virtual image for a real object.",
        "Correct: the sensor is placed at the real image plane."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. the sensor is placed at the real image plane. Then use the worked example to test transfer to a new situation."
    }
  },
  "eye": {
    "title": "The eye",
    "heading": "Keep the retina fixed while adjusting optical power.",
    "subtitle": "The eye",
    "target": "Keep the retina fixed while adjusting optical power.",
    "visual": "eye-focus",
    "paragraphs": [
      "Light enters the eye through the cornea, passes through the pupil and lens, and reaches the retina. The iris controls pupil size. The cornea and lens together provide the focusing power. Retinal photoreceptors convert absorbed light into signals that the nervous system processes; the eye is more than a passive camera with a picture flipped afterward.",
      "The retinal image is real and inverted in a simple ray model. To focus at different object distances, the eye changes lens shape and therefore optical power, a process called accommodation. The retina remains at approximately the same position. A nearer object sends a more divergent bundle, requiring greater converging power to focus on that fixed receiving surface.",
      "For an illustrative thin-lens eye with fixed image distance 0.020 m, focusing at infinity requires about 50 D. Focusing at 0.25 m requires 1/0.25 + 1/0.020 = 54 D. These are deliberately simplified system values, not a person's lens prescription or a full anatomical calculation.",
      "The fovea supports detailed central vision with densely packed cones. Rods are important for sensitivity in dim light, and the optic-disc region lacks photoreceptors. Peripheral and central vision therefore differ in more than lens sharpness. In the model, change object distance and observe the required convergence. Distinguish the pupil's light-admitting role from accommodation's focusing role."
    ],
    "terms": [
      [
        "retina",
        "Light-sensitive tissue at the back of the eye."
      ],
      [
        "accommodation",
        "Adjustment of the eye’s optical power for different viewing distances."
      ],
      [
        "pupil",
        "The opening within the iris through which light enters."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "In the 20 mm thin-eye model, bring an object from far away to 50 cm.",
      "reasoning": "The required power rises from 50 D to 52 D. The added 2 D offsets the increased divergence from the nearer object while the image plane stays fixed."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "To focus a nearer object on the same retina, the model eye needs…",
      "options": [
        "A pupil that changes the object’s distance",
        "Greater converging power",
        "A new retina behind the original one"
      ],
      "correct": 1,
      "hint": "Hold dᵢ fixed in P = 1/dₒ + 1/dᵢ and move the object closer.",
      "feedback": [
        "Pupil size affects admitted light but does not move the object.",
        "Correct: 1/dₒ increases while dᵢ stays fixed.",
        "Accommodation changes the optics, not the location of a second retina."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. 1/dₒ increases while dᵢ stays fixed. Then use the worked example to test transfer to a new situation."
    },
    "references": [
      {
        "title": "National Eye Institute · How the eyes work",
        "url": "https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work"
      }
    ]
  },
  "vision": {
    "title": "Some defects in vision",
    "heading": "Explain correction as a change to the incoming ray bundle.",
    "subtitle": "Some defects in vision",
    "target": "Explain correction as a change to the incoming ray bundle.",
    "visual": "vision-focus",
    "paragraphs": [
      "A refractive error occurs when the eye's optical system does not focus an intended view sharply on the retina. In a relaxed myopic eye, distant parallel rays focus in front of the retina. A diverging corrective lens can reduce the incoming convergence so that the eye forms its image farther back, at the retina.",
      "In hyperopia, the relaxed system would focus parallel rays behind the retina; accommodation may compensate for some of the mismatch. Converging correction supplies additional optical power. Astigmatism involves different focusing behavior in different meridians and requires more than one rotationally symmetric focal-length adjustment. These are idealized ray descriptions of optical mechanisms.",
      "Presbyopia is a loss of near-focusing ability associated with reduced accommodation as the lens becomes less flexible with age. It is distinct from hyperopia even though both can make near tasks difficult. Glasses, contacts, and selected procedures alter optical focusing in different ways. Changing corneal shape changes refraction, but an optical principle alone does not determine whether a procedure suits an individual.",
      "The diagram compares schematic uncorrected and corrected distant-ray paths. It does not measure a viewer's eyes or select treatment. In textbook calculations, lens power P = 1/f can be used to place a virtual image at a specified far or near point, with vertex distance included when stated. Explain the required ray change first; do not confuse a useful classroom model with an actual prescription."
    ],
    "terms": [
      [
        "myopia",
        "A refractive condition in which distant rays focus in front of the retina in the relaxed eye."
      ],
      [
        "hyperopia",
        "A refractive condition associated with insufficient relaxed optical power for the eye’s length."
      ],
      [
        "presbyopia",
        "Age-related reduction in accommodation for near viewing."
      ],
      [
        "astigmatism",
        "Different optical focusing in different meridians."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "An ideal diverging correction makes a distant scene appear at a model eye’s far point of 0.50 m, neglecting lens–eye separation.",
      "reasoning": "For a distant object, dᵢ = f = −0.50 m. The correction has power −2 D. This is an ideal sign-convention exercise, not a personal prescription."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Why is a diverging lens useful in the elementary myopia model?",
      "options": [
        "It reduces the convergence entering the eye",
        "It makes the retina move forward",
        "It changes red light into blue"
      ],
      "correct": 0,
      "hint": "Start with rays focusing in front of the retina; decide what reduces their convergence.",
      "feedback": [
        "Correct: the eye then focuses the bundle farther back.",
        "The optical correction works without moving the retina.",
        "Ordinary refraction preserves light frequency."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. the eye then focuses the bundle farther back. Then use the worked example to test transfer to a new situation."
    },
    "references": [
      {
        "title": "National Eye Institute · Types of refractive errors",
        "url": "https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/refractive-errors/types-refractive-errors"
      },
      {
        "title": "National Eye Institute · Presbyopia",
        "url": "https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/presbyopia"
      }
    ]
  },
  "aberrations": {
    "title": "Some defects of lenses",
    "heading": "Distinguish wavelength errors from aperture errors.",
    "subtitle": "Some defects of lenses",
    "target": "Distinguish wavelength errors from aperture errors.",
    "visual": "aberration-light",
    "paragraphs": [
      "The thin-lens model assumes rays near the principal axis and an ideal relation between incident and outgoing directions. Real optics depart from that approximation. An aberration is a systematic failure to bring the intended rays to the same ideal image point or shape, even when the nominal focus setting is correct.",
      "Spherical aberration makes rays passing at different distances from the axis focus at different axial positions. Restricting an aperture can remove some strongly affected marginal rays, but also reduces light throughput. Aspherical surfaces or carefully combined elements can improve the correction without simply blocking every outer ray.",
      "Chromatic aberration arises because refractive index varies with wavelength. A simple converging lens can focus shorter visible wavelengths closer than longer ones. An achromatic combination uses elements with different powers and dispersions to reduce selected color errors. Ordinary mirror reflection does not have this refractive chromatic effect, although mirrors still have geometric aberrations and wavelength-dependent reflectivity.",
      "Off-axis points can also produce coma or astigmatic image shapes. Making an aperture arbitrarily small is not a universal cure: diffraction eventually broadens the image, and brightness falls. The model isolates spherical and chromatic focus spreads, exaggerating them for clarity. Identify which ray property differs—height, wavelength, or field angle—before choosing an explanation. A larger displayed image is not necessarily a better-resolved image."
    ],
    "terms": [
      [
        "aberration",
        "A departure of an optical image from the ideal image predicted by a simple model."
      ],
      [
        "spherical aberration",
        "Different focus positions for rays passing at different heights through a spherical optical system."
      ],
      [
        "chromatic aberration",
        "Wavelength-dependent image errors in refracting optics."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A lens focuses blue light closer than red light from the same distant point. Which error is present?",
      "reasoning": "Chromatic aberration: wavelength-dependent index gives different optical powers. Stopping down may help other errors but does not remove material dispersion."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Why can a very small aperture still blur an image?",
      "options": [
        "All aberrations must grow without limit",
        "Light stops obeying energy conservation",
        "Diffraction becomes significant"
      ],
      "correct": 2,
      "hint": "Compare an aperture with the wavelength when deciding where the ray approximation breaks down.",
      "feedback": [
        "Some geometric aberrations shrink as marginal rays are excluded.",
        "Blur is consistent with conserved energy redistributed across the image.",
        "Correct: finite apertures spread waves, limiting resolution."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. finite apertures spread waves, limiting resolution. Then use the worked example to test transfer to a new situation."
    }
  },
  "rays": {
    "title": "The ray aspect of light",
    "heading": "State when a straight-path model is useful.",
    "subtitle": "The ray aspect of light",
    "target": "State when a straight-path model is useful.",
    "visual": "light-path",
    "paragraphs": [
      "A light ray marks a direction of propagation. It is a representation of a wave, not a thin material thread. In a uniform isotropic medium, rays travel along straight paths between interactions. At a boundary, reflected and refracted paths follow optical laws determined by the surface and materials.",
      "The ray approximation is especially useful when lenses, openings, and obstacles are large compared with wavelength and when fine diffraction structure is not the quantity of interest. A ray diagram can predict where an image forms without resolving every oscillation of its electromagnetic field. A later wave treatment is needed to explain interference fringes or the smallest resolvable detail.",
      "Seeing an object may involve direct emission, reflection, transmission, or several interactions in sequence. Draw the entire route from source to object to receiver. A beam can travel through clean air without being conspicuous from the side because little light is redirected into that observer's eye; visible fog reveals a path through scattering.",
      "The model begins with source, page, and eye. Switch the source off and identify the missing path rather than imagining rays emitted by the eye. A few drawn rays represent an extended bundle and do not imply that only those rays exist. Name the omitted physics before extending the approximation to tiny apertures, rough surfaces, or strongly nonuniform materials."
    ],
    "terms": [
      [
        "geometric optics",
        "The approximation that describes light using rays and optical path laws."
      ],
      [
        "ray",
        "A directed path representing local propagation of light."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A beam crosses a nearly empty region. Must an observer viewing it from the side see a bright line?",
      "reasoning": "No. Light needs a path into the observer. Without significant sideways scattering, transmission along the beam does not by itself make the path bright from the side."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Which situation most strongly calls for a wave correction?",
      "options": [
        "A straight path in uniform air away from boundaries",
        "An aperture comparable with wavelength",
        "A large flat mirror used far from its edge"
      ],
      "correct": 1,
      "hint": "Compare the opening’s size with the wavelength of the light.",
      "feedback": [
        "A straight ray is often adequate for that path.",
        "Correct: diffraction becomes important.",
        "Geometric reflection is usually a useful approximation there."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. diffraction becomes important. Then use the worked example to test transfer to a new situation."
    }
  },
  "curvedMirror": {
    "title": "Image formation by mirrors",
    "heading": "Use the mirror’s focal sign and reflected-ray geometry.",
    "subtitle": "Image formation by mirrors",
    "target": "Use the mirror’s focal sign and reflected-ray geometry.",
    "visual": "curved-mirror",
    "paragraphs": [
      "A plane mirror gives an upright virtual image at equal object and image distances from its surface. A curved mirror changes the local normals across the reflecting aperture, allowing a parallel incoming bundle to converge or diverge. For a spherical mirror with near-axis rays, focal length has magnitude approximately half the radius of curvature.",
      "Use positive f for a concave converging mirror and negative f for a convex diverging mirror. With a real object in front of the mirror, dₒ is positive. Positive dᵢ places a real image in front, where reflected rays converge; negative dᵢ places a virtual image behind it. These side meanings differ from a lens because the outgoing light reverses its overall travel direction.",
      "Within this paraxial model, 1/f = 1/dₒ + 1/dᵢ and m = −dᵢ/dₒ. A concave mirror can give a real inverted image for dₒ > f or an upright magnified virtual image for dₒ < f. A convex mirror gives an upright reduced virtual image for a real object. A large spherical aperture introduces spherical aberration, so a perfectly common focus is an approximation.",
      "The explorer shows solid reflected rays and dashed backward extensions. Compare the signs with which side of the mirror contains the image. A convex security mirror increases the field of view while reducing image size; judging distance from familiar apparent size can therefore be misleading. State the optical geometry before interpreting what a driver or observer sees."
    ],
    "terms": [
      [
        "concave mirror",
        "A mirror curved inward toward an incident real object."
      ],
      [
        "convex mirror",
        "A mirror curved outward toward an incident real object."
      ],
      [
        "paraxial approximation",
        "An optical approximation using rays close to and at small angles to the principal axis."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A concave mirror has radius 40 cm and object distance 60 cm.",
      "reasoning": "f ≈ 20 cm, so 1/dᵢ = 1/20 − 1/60 and dᵢ = 30 cm. Magnification is −0.5: real, in front, inverted, and reduced."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "For a convex mirror and a real object, the elementary image is…",
      "options": [
        "Virtual, upright, and reduced",
        "Always real and inverted",
        "Behind the observer because the mirror absorbs it"
      ],
      "correct": 0,
      "hint": "Use f < 0 for a convex mirror and dₒ > 0 for a real object.",
      "feedback": [
        "Correct: f and dᵢ are negative, with 0 < m < 1.",
        "A convex mirror makes the reflected bundle diverge.",
        "Image location comes from ray geometry, not absorption."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. f and dᵢ are negative, with 0 < m < 1. Then use the worked example to test transfer to a new situation."
    }
  },
  "colorVision": {
    "title": "Color and color vision",
    "heading": "Compare spectral input, cone signals, and context.",
    "subtitle": "Color and color vision",
    "target": "Compare spectral input, cone signals, and context.",
    "visual": "color-vision",
    "paragraphs": [
      "Typical human color vision compares responses from three classes of cones with broad, overlapping spectral sensitivities. They are often called short-, medium-, and long-wavelength cones. No single cone class acts as a perfect detector for only one named color, and a cone response alone cannot separate a change of wavelength from a change of intensity.",
      "The brain uses relationships among these signals and surrounding spatial information. Different spectra can produce similar response patterns and similar color appearances, a phenomenon called metamerism. This is why RGB displays can reproduce many colors without emitting every wavelength of the original scene. Their limited primaries also mean a display cannot reproduce every possible color.",
      "Rods provide greater sensitivity in dim conditions but do not supply the same three-channel color discrimination. Receptor distribution varies across the retina, so central and peripheral vision differ. Color-vision differences also mean that a diagram should carry labels and patterns rather than communicating a scientific result by hue alone.",
      "Context matters: a gray patch can appear lighter or darker against different surroundings even when its physical screen value is identical. Color constancy reflects how the visual system uses context to interpret changing illumination; a simple three-number input model is not the whole perceptual process. The explorer compares ideal display-channel mixing and equal gray patches on different backgrounds. It demonstrates input and context without pretending to diagnose vision or reproduce a calibrated cone-sensitivity measurement."
    ],
    "terms": [
      [
        "cone",
        "A retinal photoreceptor involved in daylight and color vision."
      ],
      [
        "rod",
        "A retinal photoreceptor important for sensitivity in dim light."
      ],
      [
        "metamerism",
        "Different spectra producing matching color appearances under specified conditions."
      ],
      [
        "color constancy",
        "Relative stability of perceived object color as illumination changes."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "Two lights look equally yellow to an observer, but one contains a narrow yellow band and the other red plus green. Are they physically identical?",
      "reasoning": "No. Similar visual responses can come from different spectra. A spectrometer or a colored sample can reveal the difference."
    },
    "check": {
      "title": "Explain the visual evidence",
      "prompt": "Why label red and green curves in a scientific diagram?",
      "options": [
        "Because labels change the wavelength",
        "Because cones detect only printed letters",
        "Because hue alone is not a reliable identifier for every viewer"
      ],
      "correct": 2,
      "hint": "Consider what happens if two hues appear alike to the viewer.",
      "feedback": [
        "Labels communicate identity without changing the light’s wavelength.",
        "Cones respond to light, while recognition involves later processing.",
        "Correct: explicit labels preserve meaning across color-vision and display differences."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. explicit labels preserve meaning across color-vision and display differences. Then use the worked example to test transfer to a new situation."
    }
  },
  "microscope": {
    "title": "Microscopes",
    "heading": "Use the intermediate image as the next lens’s object.",
    "subtitle": "Microscopes",
    "target": "Use the intermediate image as the next lens’s object.",
    "visual": "microscope-light",
    "paragraphs": [
      "A compound microscope forms an enlarged intermediate image with an objective and lets an eyepiece examine that image. The specimen is placed slightly beyond the objective's focal point. The objective then forms a real inverted image farther away, which becomes the object for the next optical stage.",
      "For two separated thin lenses, calculate each stage in order. If their separation is L and the first image lies dᵢ₁ to the right of the objective, the eyepiece object distance is dₒ₂ = L − dᵢ₁. A positive distance smaller than the eyepiece focal length gives an upright virtual image relative to the intermediate image. It remains inverted relative to the original specimen.",
      "For finite image distances, signed linear magnifications multiply: mtotal = m₁m₂. Commercial microscope magnification is usually discussed as a viewing or angular comparison, so distinguish that rating from a calculated finite-image height ratio. Neither measure alone states the smallest resolvable detail.",
      "Numerical aperture NA = n sin α describes the admitted cone, with α the half-angle in the specimen-side medium. A larger NA can improve light collection and diffraction-limited resolution. Immersion media, specimen preparation, illumination, and aberrations matter too. The model exposes the intermediate image and shows how changing lens separation affects the eyepiece stage. The diagram uses ideal thin lenses; real objectives contain multiple elements and have finite working distances."
    ],
    "terms": [
      [
        "compound microscope",
        "A microscope that uses successive optical stages to enlarge a specimen’s image."
      ],
      [
        "intermediate image",
        "An image formed by one stage that serves as the object for the next."
      ],
      [
        "numerical aperture",
        "n sin α for a cone of rays in a medium with refractive index n."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "An objective forms an image 18 cm to its right; the eyepiece is 22 cm from the objective and has focal length 5 cm.",
      "reasoning": "The eyepiece object distance is 4 cm, inside its focal length. It forms a virtual image; its positive magnification multiplies the objective’s negative magnification."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "For the second lens, what is the relevant object?",
      "options": [
        "The lens’s own center",
        "The image made by the first lens",
        "Always the original specimen at its original distance"
      ],
      "correct": 1,
      "hint": "Locate the intermediate image relative to the eyepiece, not just relative to the first lens.",
      "feedback": [
        "The lens center is a reference location, not the object.",
        "Correct: each stage receives a bundle shaped by the preceding stage.",
        "That ignores the optical transformation before the eyepiece."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. each stage receives a bundle shaped by the preceding stage. Then use the worked example to test transfer to a new situation."
    }
  },
  "telescope": {
    "title": "Telescopes",
    "heading": "Separate angular magnification from collecting area and resolution.",
    "subtitle": "Telescopes",
    "target": "Separate angular magnification from collecting area and resolution.",
    "visual": "telescope-light",
    "paragraphs": [
      "A telescope gathers light from a distant scene with an objective lens or mirror. Nearly parallel rays from a given distant point meet near the objective's focal plane. An eyepiece then changes the angular size of the view seen by the observer. A detector can instead be placed at an image plane for imaging.",
      "For a simple two-converging-lens astronomical telescope adjusted for relaxed viewing, lens separation is approximately fₒ + fₑ. The signed angular magnification is M = −fₒ/fₑ. The negative sign indicates inversion. A shorter-focal-length eyepiece increases the angular magnification, but cannot recover information that the objective or atmosphere failed to deliver.",
      "Objective diameter matters independently. Collecting area grows as D², while a circular aperture's diffraction-limited angular scale grows as λ/D. A larger aperture can collect more light and resolve finer angles under suitable conditions. Atmospheric turbulence and optical errors may dominate the actual image, so aperture alone does not guarantee the ideal limit.",
      "Reflecting telescopes use mirrors to avoid a refracting objective's chromatic focusing error. Other wavelengths may require different optical systems, such as antenna arrays or grazing-incidence X-ray mirrors. In the model, change objective and eyepiece focal lengths and compare magnification with the separate diameter control. Explain whether a proposed adjustment changes image scale, collected power, or resolution; these are different improvements."
    ],
    "terms": [
      [
        "angular magnification",
        "The ratio of viewed angular size with and without an optical instrument under stated conditions."
      ],
      [
        "objective aperture",
        "The light-collecting entrance diameter of an optical system."
      ],
      [
        "relaxed viewing",
        "An optical arrangement sending approximately parallel rays into the eye."
      ]
    ],
    "worked": {
      "title": "Trace it, then calculate",
      "prompt": "A telescope uses fₒ = 100 cm and fₑ = 5 cm. Replace the eyepiece with fₑ = 2.5 cm.",
      "reasoning": "The angular magnification changes from −20 to −40. Objective collecting area is unchanged, and the objective’s diffraction limit does not improve simply from the eyepiece change."
    },
    "check": {
      "title": "Predict the optical change",
      "prompt": "Doubling objective diameter ideally changes collecting area by…",
      "options": [
        "A factor of four",
        "A factor of two",
        "No factor unless eyepiece power also doubles"
      ],
      "correct": 0,
      "hint": "Write the circular collecting area in terms of diameter.",
      "feedback": [
        "Correct: circular area is proportional to D².",
        "That is the diameter ratio, not the area ratio.",
        "Light collection depends on objective aperture independently of eyepiece magnification."
      ],
      "teacher": "Ask the student to justify the answer and explain why each alternative fails. circular area is proportional to D². Then use the worked example to test transfer to a new situation."
    }
  }
}
