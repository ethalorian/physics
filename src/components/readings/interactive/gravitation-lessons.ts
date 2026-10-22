import type { LessonContent } from './lesson-contract'
export const gravitationLessons = {
  "apple": {
    "title": "The falling apple",
    "heading": "Connect a familiar fall to a universal interaction.",
    "subtitle": "The same model should explain more than one setting.",
    "target": "Explain the connection between terrestrial and celestial falling.",
    "visual": "gravity",
    "paragraphs": [
      "An apple accelerates toward Earth after its support is removed. Newton’s important connection was to ask whether the interaction responsible could also reach the Moon. A useful physical law unifies observations that initially look different. Falling fruit and an orbiting satellite differ in their initial motion and distance, but both can respond to Earth’s gravitational field.",
      "Near Earth’s surface, the field is approximately uniform over a small height interval. With air resistance neglected, a released object gains about 9.8 m/s of downward velocity each second. Gravity is present before release as well: while the apple is held still, a supporting force balances its gravitational force. Releasing it removes the support, not a switch that turns gravity on.",
      "Earth also accelerates toward the apple. The two gravitational forces are equal and opposite, but the accelerations are inversely related to the masses. Earth’s enormous mass makes its response to an ordinary apple imperceptibly small. Equal interaction forces therefore do not imply equal observable motions.",
      "The apple story is an illustration of a scientific connection rather than a complete account of how a theory is established. A successful gravitational model must make quantitative predictions that agree with observations over many distances and systems. The next sections test that connection using the Moon, planets, and the inverse-square dependence."
    ],
    "terms": [
      [
        "Gravitation",
        "Attractive interaction between masses in the Newtonian model."
      ],
      [
        "Support force",
        "Contact force that can balance or modify the effect of gravity."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 0.20 kg apple falls near Earth. Find its gravitational force and the force it exerts on Earth.",
      "reasoning": "The apple experiences about 1.96 N toward Earth. Earth experiences an equal 1.96 N toward the apple, with a far smaller acceleration."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Before a supported apple is released, its gravitational force is…",
      "options": [
        "absent.",
        "present and balanced by support.",
        "equal to its acceleration."
      ],
      "correct": 1,
      "hint": "A zero net force can contain several nonzero forces.",
      "feedback": [
        "Support does not remove gravity.",
        "Correct. Release removes the balancing contact force.",
        "Force and acceleration have different units."
      ],
      "teacher": "Ask students to draw before-release and after-release diagrams."
    }
  },
  "moon": {
    "title": "The falling Moon",
    "heading": "Falling can continuously change direction.",
    "subtitle": "Sideways motion prevents a direct radial plunge.",
    "target": "Explain an orbit as continuous free fall and compare lunar and surface acceleration.",
    "visual": "circular",
    "paragraphs": [
      "If gravity suddenly vanished, the Moon would initially continue along the tangent to its orbit. Gravity continually changes that velocity toward Earth. The Moon is therefore falling in the sense of accelerating toward Earth even though its distance from Earth stays approximately constant in a circular approximation. Falling does not require moving straight downward toward a surface.",
      "The inward acceleration needed for a circle is v²/r. Comparing it with gravitational acceleration tests whether one law explains both ordinary falls and orbital motion. The Moon is roughly sixty Earth radii from Earth’s center, so an inverse-square field there is roughly 1/3600 of the surface value. This gives about 0.0027 m/s² as a useful approximate comparison.",
      "Over a sufficiently short interval, the inward departure from the tangent is approximately ½at². For one second at that lunar acceleration, the departure is about 1.4 millimeters. This is not a claim that the Moon loses that much orbital radius every second. The tangent used for the comparison changes as the Moon moves.",
      "The circular picture is an approximation: the lunar orbit is not a perfect circle and the Sun also influences its motion. The key connection survives those refinements. Existing tangential motion together with a continual inward gravitational acceleration can produce an orbit without a supporting surface or a motor continuously pushing forward."
    ],
    "terms": [
      [
        "Orbital free fall",
        "Motion controlled by gravity without a supporting contact force."
      ],
      [
        "Tangent departure",
        "Short-time deviation from the straight path predicted without the inward acceleration."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Use g = 9.8 m/s² and a lunar distance of 60 Earth radii to estimate acceleration.",
      "reasoning": "a ≈ 9.8/60² = 0.00272 m/s². In one second, ½at² ≈ 0.00136 m."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "The Moon’s inward acceleration means that it…",
      "options": [
        "must continually get closer to Earth.",
        "continually changes its velocity toward Earth.",
        "has no sideways velocity."
      ],
      "correct": 1,
      "hint": "Acceleration changes velocity; it is not the same vector as velocity.",
      "feedback": [
        "A nearly circular orbit has nearly constant radius.",
        "Correct. Its direction of motion bends continuously.",
        "Its tangential velocity is essential to the orbit."
      ],
      "teacher": "Draw the tangent departure separately from the orbital radius."
    }
  },
  "earth": {
    "title": "The falling Earth",
    "heading": "Earth participates in the same orbital story.",
    "subtitle": "Gravity and tangential velocity work together.",
    "target": "Explain planetary motion and reject a balancing outward force in an inertial frame.",
    "visual": "kepler",
    "paragraphs": [
      "Earth moves around the Sun while continually accelerating toward it. The planet’s tangential velocity carries it forward as the gravitational interaction bends its path. In an inertial description, no outward force is needed to balance solar gravity. A balanced net force would produce constant velocity along a straight line, not an orbit.",
      "A circular approximation makes the relationship clear: GMm/r² supplies the required mv²/r. The satellite or planet mass m cancels, leaving v² = GM/r for a dominant central mass. Gravity determines the needed curvature for the existing speed. A different speed at the same position generally produces a different trajectory rather than the same circle.",
      "The Sun is not perfectly motionless. Earth attracts the Sun with an equal opposite force, and both move about their common center of mass. Because the Sun is much more massive, its motion from this pair is much smaller. Other planets also contribute, so a precise solar-system model must include more than two bodies.",
      "Earth’s spin about its own axis is distinct from its revolution around the Sun. Neither ordinary daily rotation nor the existence of an orbit means that gravity has stopped acting. Use the mass distribution, distance, and initial motion to explain the trajectory, and identify whether a diagram describes a fixed inertial view or coordinates rotating with Earth."
    ],
    "terms": [
      [
        "Orbital velocity",
        "Velocity tangent to an object’s orbital path at a given point."
      ],
      [
        "Barycenter",
        "The common center of mass about which an isolated pair moves."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "In a circular approximation, what happens to Earth’s immediate motion if the Sun’s gravitational attraction is removed?",
      "reasoning": "Earth initially continues along its current tangent, neglecting other interactions. It does not shoot radially away from the Sun."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "An outward force balancing solar gravity would make Earth’s instantaneous net acceleration…",
      "options": [
        "inward.",
        "zero.",
        "twice as large."
      ],
      "correct": 1,
      "hint": "Apply Newton’s second law to the proposed force sum.",
      "feedback": [
        "Equal opposite forces have no inward resultant.",
        "Correct. That would not provide the acceleration required for the orbit.",
        "Balancing forces cancel instead of add."
      ],
      "teacher": "Ask students to identify the frame before discussing centrifugal terms."
    }
  },
  "inverse": {
    "title": "Gravity and distance",
    "heading": "Measure from the center before squaring.",
    "subtitle": "A modest altitude is not the whole separation.",
    "target": "Use inverse-square ratios and explain their geometric meaning.",
    "visual": "gravity",
    "paragraphs": [
      "Outside a spherical body, gravitational field magnitude follows g = GM/r². Here r is the distance from the body’s center. At altitude h above a body of radius R, use r = R + h. Doubling altitude does not generally double r, especially when both heights are small compared with the planet’s radius.",
      "Ratios are often clearer than substituting the constant G. At unchanged central mass, g2/g1 = (r1/r2)². Twice the center distance gives one-quarter the field; three times the distance gives one-ninth. At any finite distance the ideal field remains nonzero, although it can become very small. Crossing the atmosphere’s edge is not a gravitational boundary.",
      "An inverse-square pattern also appears when a fixed outward flux spreads uniformly over concentric spherical surfaces. Their areas are 4πr². The same total spread over four times the area has one-quarter the intensity. This is a useful geometric analogy, but gravity is not literally a spray of material from a nozzle.",
      "Keep the assumptions explicit. The simple central formula applies to point masses or outside spherically symmetric mass distributions. Within a planet, only the enclosed mass contributes to the net radial field under spherical symmetry, so the outside formula with the entire mass must be revised. Near irregular bodies, local shape also matters."
    ],
    "terms": [
      [
        "Inverse-square law",
        "Magnitude varies as 1/r² with the stated source unchanged."
      ],
      [
        "Center distance",
        "Separation measured from the mass center in the spherical-body model."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A planet has surface field 12 N/kg. Find the field at altitude 2R.",
      "reasoning": "The center distance is 3R, so the field is 12/9 ≈ 1.33 N/kg."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At altitude R above a planet of radius R, gravity is what fraction of its surface value?",
      "options": [
        "½.",
        "¼.",
        "Zero."
      ],
      "correct": 1,
      "hint": "First calculate R + h.",
      "feedback": [
        "The distance doubles but the field depends on its square.",
        "Correct. The center distance is 2R.",
        "Gravity has no sharp altitude cutoff."
      ],
      "teacher": "Require a labeled radius and altitude before any ratio."
    }
  },
  "field": {
    "title": "Gravitational field",
    "heading": "Describe what a small test mass would experience.",
    "subtitle": "Field belongs to the location; force also depends on the object.",
    "target": "Interpret field vectors and calculate gravitational force from mass.",
    "visual": "gravity",
    "paragraphs": [
      "A gravitational field describes the force that would act per unit mass at a location. Define gvector = Fgravity/m for a sufficiently small test mass that does not significantly alter the source. Field strength is measured in N/kg, equivalent to m/s². Near Earth, multiplying about 9.8 N/kg by a mass in kilograms gives its gravitational force in newtons.",
      "A field vector points in the direction a freely released test mass accelerates. Outside a spherical planet, vectors point toward the center and weaken with distance. Field-line drawings summarize that direction and relative strength; lines are not physical tracks or threads. An object can move sideways across them while accelerating along the local field.",
      "Several sources contribute by vector addition. Between two equal masses, their fields cancel at the midpoint, even though each source still attracts a test mass. At a different location, the vectors generally have unequal magnitudes or different directions. Add components rather than subtracting magnitudes without checking the geometry.",
      "Changing the test mass changes the force but not the external field being sampled. This distinction prevents a common confusion: a heavier object near Earth feels a larger gravitational force yet has the same free-fall acceleration when other forces are negligible. The greater force and greater inertia increase in the same proportion."
    ],
    "terms": [
      [
        "Field vector",
        "Force per unit test mass, with magnitude and direction."
      ],
      [
        "Superposition",
        "Combining contributions from different sources by vector addition."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "The field at a location is 3 N/kg toward a planet. What gravitational forces act on 2 kg and 5 kg test objects?",
      "reasoning": "They experience 6 N and 15 N toward the planet. Both have free-fall acceleration 3 m/s² if other forces are negligible."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Doubling a small test mass at the same location doubles…",
      "options": [
        "the external field.",
        "its gravitational force.",
        "its free-fall acceleration."
      ],
      "correct": 1,
      "hint": "Separate source properties from the response of the test object.",
      "feedback": [
        "The source and location are unchanged.",
        "Correct. F = mg.",
        "The doubled force is divided by doubled mass."
      ],
      "teacher": "Have students state field and force with different units."
    }
  },
  "interior": {
    "title": "Gravity inside a planet",
    "heading": "Less radius also means less enclosed mass.",
    "subtitle": "The outside inverse-square formula cannot be extended blindly inward.",
    "target": "Predict the field inside a uniform spherical planet and state the model limit.",
    "visual": "interior-gravity",
    "paragraphs": [
      "Outside a spherical planet, the gravitational field behaves as if all its mass were concentrated at its center. Inside, a different result is needed. A spherical shell contributes zero net field anywhere in its interior. Under spherical symmetry, the field at radius r therefore depends only on the mass enclosed within that radius.",
      "For a uniform-density sphere of radius R and total mass M, the enclosed mass is M(r/R)³. Substituting it into GMenc/r² gives g(r) = GMr/R³. The magnitude decreases linearly from its surface value to zero at the center. The direction is always toward the center, so it reverses after an object passes through to the other side.",
      "In an imaginary frictionless straight tunnel through such a planet, a released object speeds up toward the center even while the acceleration magnitude decreases. At the center, acceleration is momentarily zero and speed is greatest. It then slows as gravity opposes its outward motion. The ideal motion is oscillatory, with period 2π√(R/gsurface).",
      "Real Earth is not uniform in density, so its interior field does not follow this straight-line graph throughout. The tunnel also ignores temperature, pressure, rotation, drag, and structural impossibility. The purpose of the ideal model is to show how symmetry and enclosed mass change the field, not to predict a practical journey through Earth."
    ],
    "terms": [
      [
        "Enclosed mass",
        "Mass inside the sphere through the observation radius."
      ],
      [
        "Shell theorem",
        "A spherical shell produces zero field inside and a point-mass-like field outside."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "In a uniform planet with surface field 10 N/kg, what is the field at radius R/2?",
      "reasoning": "Enclosed mass is M/8, while r² is R²/4. The field is half the surface value: 5 N/kg inward."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At the center of an ideal uniform planet, a tunnel traveler released from the surface has…",
      "options": [
        "zero speed and maximum acceleration.",
        "maximum speed and zero acceleration.",
        "zero speed and zero acceleration."
      ],
      "correct": 1,
      "hint": "Acceleration has pointed toward the center throughout the inward trip.",
      "feedback": [
        "The traveler has been speeding up.",
        "Correct. The field cancels at that instant, but accumulated velocity remains.",
        "Zero acceleration does not imply zero velocity."
      ],
      "teacher": "Use a speed-versus-position sketch alongside the field graph."
    }
  },
  "weight": {
    "title": "Weight and weightlessness",
    "heading": "A scale measures support.",
    "subtitle": "Gravity can remain while the scale reads zero.",
    "target": "Distinguish gravitational force from apparent weight during acceleration.",
    "visual": "elevator",
    "paragraphs": [
      "The word weight is used in two related ways. Gravitational weight means the force mg exerted by gravity. Apparent weight means the supporting contact force a scale measures. Hewitt emphasizes the support-force meaning when describing how heavy a person feels. Naming the convention prevents a vocabulary disagreement from becoming a physics disagreement.",
      "For a person in an elevator, choose upward positive. The vertical force equation is N − mg = ma, so the scale force is N = m(g + a) while the person remains in contact with it. Upward acceleration increases the reading; downward acceleration decreases it. Constant velocity, whether upward or downward, gives a = 0 and the ordinary reading mg.",
      "In ideal free fall, a = −g and N = 0. Gravity has not vanished: it is the unbalanced force causing the fall. The person, the scale, and the surrounding cabin accelerate together, so the scale need not press upward to keep the person moving with it. An orbiting cabin extends this shared free-fall situation continuously around Earth.",
      "If an algebraic calculation gives a negative N for a simple floor contact, the assumed contact has failed. A floor cannot pull the person down through ordinary normal force; the person separates unless another restraint acts. Mass and inertia remain present during apparent weightlessness, even when a scale cannot use support to infer that mass."
    ],
    "terms": [
      [
        "Gravitational weight",
        "The gravitational force mg under the stated field."
      ],
      [
        "Apparent weight",
        "The support-force magnitude measured by a scale."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 60 kg person accelerates downward at 2 m/s² in an elevator. What does an ideal force scale read?",
      "reasoning": "N = 60(9.8 − 2) = 468 N, less than the 588 N gravitational force."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "An elevator travels downward at constant velocity. Its scale reads…",
      "options": [
        "less than mg.",
        "mg.",
        "zero."
      ],
      "correct": 1,
      "hint": "Acceleration, not velocity direction, enters N − mg = ma.",
      "feedback": [
        "A reduced reading requires downward acceleration.",
        "Correct. Constant velocity gives zero net force.",
        "Zero support requires shared free fall, not merely downward travel."
      ],
      "teacher": "Ask students to state both meanings of weight in an orbital example."
    }
  },
  "tides": {
    "title": "Ocean tides",
    "heading": "Compare pulls across Earth.",
    "subtitle": "A strong pull and a strong tidal effect are different quantities.",
    "target": "Explain near-side and far-side tides using differential gravitational acceleration.",
    "visual": "tides-lab",
    "paragraphs": [
      "The Moon pulls on all of Earth, but it pulls more strongly on the near side than on the center and less strongly on the far side. To understand tides, compare each location’s acceleration with Earth’s center. The near side has an excess acceleration toward the Moon. The far side has a deficit in that direction, which is an outward relative acceleration away from the center on the opposite side.",
      "Both sides still experience gravitational attraction toward the Moon. The far-side tidal tendency is not a repulsion by the Moon. The difference across Earth stretches the Earth–ocean system along the Earth–Moon line and compresses it in transverse directions in the simplest equilibrium model.",
      "For a distant source, the tidal scale varies approximately as GM R/d³. This distance-cubed dependence explains why the Sun can exert a greater total gravitational pull on Earth while the Moon has the greater tidal influence. At new and full Moon, lunar and solar tidal patterns reinforce, producing larger spring tidal ranges. At quarter phases, their alignment produces smaller neap ranges.",
      "Actual coastal tides are not just two rigid water bulges passing underneath every shore. Ocean depth, basin geometry, resonance, coastlines, and Earth’s rotation shape timing and range. Some places have two unequal high tides, others one dominant daily tide. Use the ideal differential-force model to explain the driving effect, not to forecast a harbor’s water level."
    ],
    "terms": [
      [
        "Tidal acceleration",
        "Difference between a location’s gravitational acceleration and that of a reference center."
      ],
      [
        "Spring and neap tides",
        "Larger and smaller tidal ranges associated with Sun–Moon alignment."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A distant source moves twice as far away with its mass unchanged. Compare its approximate gravitational field and tidal effect across Earth.",
      "reasoning": "The field becomes 1/4 as large, while the tidal scale becomes 1/8 as large. Tides depend on the spatial difference in field."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "On Earth’s far side, the Moon’s actual gravitational pull points…",
      "options": [
        "away from the Moon.",
        "toward the Moon, but less strongly than at Earth’s center.",
        "nowhere; it is zero."
      ],
      "correct": 1,
      "hint": "Subtract the center’s acceleration only after identifying the actual field.",
      "feedback": [
        "That confuses relative tidal acceleration with actual gravitational attraction.",
        "Correct. The relative deficit produces the far-side stretching tendency.",
        "Lunar gravity remains nonzero across Earth."
      ],
      "teacher": "Ask for actual-force arrows and relative-tide arrows in separate diagrams."
    }
  },
  "blackholes": {
    "title": "Black holes",
    "heading": "Compression changes the close approach, not the total mass rule.",
    "subtitle": "An event horizon is not a material surface.",
    "target": "Explain what changes when mass collapses and distinguish weak-field predictions from strong gravity.",
    "visual": "compact-gravity",
    "paragraphs": [
      "A star’s structure reflects inward gravity and outward pressure gradients. Fusion supplies energy that helps sustain the pressure, but the balance is not a pair of equal forces acting at one surface. When a sufficiently massive stellar core can no longer support itself, collapse can form a black hole. The outcome depends on the remnant and its history, not just a simple statement that every dying star becomes one.",
      "A black hole has an event horizon: a boundary from inside which light cannot escape to distant observers. General relativity is needed to describe that boundary correctly. For an ideal nonrotating uncharged black hole, its radius is 2GM/c². This relation is not a license to use ordinary Newtonian projectile motion as a complete theory of light near the horizon.",
      "Far outside a spherical source, gravitational effects depend primarily on its mass and distance. Compressing an unchanged mass does not suddenly make its distant Newtonian field stronger. What changes is that an observer can approach much closer to the mass than the original star’s surface allowed. If mass is lost during collapse, the external field must be recalculated with the remaining mass.",
      "Black holes are inferred and studied through their effects on nearby matter, light, and spacetime. Hot surrounding matter can emit radiation even though light from inside the horizon cannot reach us. Our Sun is not massive enough to become a black hole; its expected remnant is a white dwarf that cools over time."
    ],
    "terms": [
      [
        "Event horizon",
        "Boundary beyond which signals cannot escape to distant observers."
      ],
      [
        "Compactness",
        "Concentration of a given mass into a small radius."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A spherical source contracts while keeping the same mass. Compare the weak field at a fixed point outside its original radius.",
      "reasoning": "At the same center distance, GM/r² is unchanged. Shrinking the source does not multiply its distant field."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A black hole with the same mass as a former star would, at a distant unchanged radius,…",
      "options": [
        "exert a vastly larger Newtonian attraction solely because it is smaller.",
        "have the same approximate Newtonian field.",
        "have no gravitational field."
      ],
      "correct": 1,
      "hint": "The outside spherical-field formula contains M and r, not the source’s physical radius.",
      "feedback": [
        "A smaller source permits closer approach but does not change M/r² at a fixed external point.",
        "Correct, under the same-mass and weak-field assumptions.",
        "A black hole still has gravitational effects."
      ],
      "teacher": "Separate observations outside the original radius from near-horizon claims."
    }
  },
  "universal": {
    "title": "Universal gravitation",
    "heading": "Let every mass contribute.",
    "subtitle": "A two-body model is a starting point, not the whole solar system.",
    "target": "Explain gravitational shaping and orbital perturbations.",
    "visual": "gravity",
    "paragraphs": [
      "Newtonian gravity applies between every pair of masses. For a planet, the net gravitational force is the vector sum of contributions from the Sun, other planets, moons, and other matter. The Sun usually dominates the simplest orbital model, but the smaller contributions can accumulate into measurable deviations called perturbations.",
      "A mismatch between a predicted and observed orbit is evidence to investigate. It can signal an omitted source, inaccurate initial conditions, measurement error, or limits of the model. The historical prediction and observation of Neptune illustrate how gravitational effects can reveal an unseen body. A discrepancy should prompt competing hypotheses and quantitative tests rather than an automatic declaration that one preferred explanation is correct.",
      "Self-gravity also helps explain why sufficiently large bodies become approximately round: matter can rearrange toward configurations with lower gravitational energy when strength and pressure permit. Rotation, material strength, and uneven density modify the shape. Small rigid asteroids can remain irregular because their material strength can resist the comparatively weak gravitational stresses.",
      "When a rotating cloud contracts, its mass moves nearer the rotation axis. Approximate conservation of angular momentum then increases its angular speed. Gravity, rotation, collisions, pressure, and energy transfer all matter in forming stars and planetary systems. The simple contraction argument explains one tendency; it does not by itself supply a complete formation simulation."
    ],
    "terms": [
      [
        "Perturbation",
        "Change from an idealized trajectory caused by additional influences."
      ],
      [
        "Self-gravity",
        "Mutual gravitational attraction among parts of the same body or system."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Two sources produce perpendicular field components 3 N/kg and 4 N/kg. Find the resultant magnitude.",
      "reasoning": "Vector addition gives √(3² + 4²) = 5 N/kg. Adding magnitudes directly would incorrectly give 7 N/kg."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "An orbital prediction omits a nearby massive body. The likely improvement is to…",
      "options": [
        "add its gravitational contribution as a vector.",
        "add all force magnitudes regardless of direction.",
        "remove the dominant central source."
      ],
      "correct": 0,
      "hint": "Superposition combines directions as well as sizes.",
      "feedback": [
        "Correct. The additional interaction perturbs the original trajectory.",
        "Direction matters in the net force.",
        "The dominant source still contributes."
      ],
      "teacher": "Ask students to name an approximation and an observation that could test it."
    }
  },
  "satellite": {
    "title": "Earth satellites",
    "heading": "Go sideways fast enough to keep missing the surface.",
    "subtitle": "Orbit requires a suitable trajectory and a clear path.",
    "target": "Connect projectile curvature, orbital speed, and atmospheric limitations.",
    "visual": "circular",
    "paragraphs": [
      "A satellite is a projectile whose trajectory continues around a central body. Close to a planet, an ordinary slow horizontal throw curves down and intersects the ground. With a suitable tangential speed and no obstructing terrain or atmosphere, the fall can curve with the planet rather than meeting its surface. Gravity supplies the inward acceleration throughout.",
      "For a circular orbit of radius r around a spherical dominant mass M, gravity and required radial acceleration give v = √(GM/r). Using g at that radius gives v = √(gr). Near Earth’s surface this ideal speed is about 7.9 km/s. This is a model value, not a workable sea-level launch prescription: atmospheric drag and terrain prevent such a free circular path.",
      "Over a short interval, the satellite’s departure from its tangent is approximately ½gt². The surface curvature drops away from the same tangent by approximately s²/(2R) for small horizontal distance s. Setting these departures equal with s = vt yields v² ≈ gR, connecting the geometry with Newton’s force calculation.",
      "Real orbital insertion must provide sufficient horizontal velocity as well as height. Lifting a spacecraft high and then releasing it from rest does not establish an orbit. Atmospheric density decreases gradually, so low satellites can still experience drag and require occasional adjustments. The ideal orbit assumes those non-gravitational influences are negligible over the interval studied."
    ],
    "terms": [
      [
        "Satellite",
        "An object in orbit around another body."
      ],
      [
        "Orbital insertion",
        "Establishing the position and velocity needed for a desired orbit."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Use R = 6.37 × 10⁶ m and g = 9.8 m/s² to estimate near-surface circular speed.",
      "reasoning": "v = √(gR) ≈ 7.90 × 10³ m/s. This ideal calculation neglects atmosphere and terrain."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A spacecraft raised high and released with zero sideways speed will…",
      "options": [
        "automatically enter a circular orbit.",
        "initially fall toward the planet.",
        "remain motionless without support."
      ],
      "correct": 1,
      "hint": "An orbit requires velocity as well as position.",
      "feedback": [
        "Circular motion needs the appropriate tangential velocity.",
        "Correct. Gravity accelerates it inward from that initial state.",
        "A nonzero gravitational field does not allow unsupported rest."
      ],
      "teacher": "Ask students to distinguish gaining altitude from gaining orbital velocity."
    }
  },
  "circularOrbit": {
    "title": "Circular orbits",
    "heading": "Gravity turns velocity without changing its size.",
    "subtitle": "The force is perpendicular to motion.",
    "target": "Predict circular speed, period, work, and apparent weight.",
    "visual": "circular",
    "paragraphs": [
      "In an ideal circular orbit, gravity is radial and velocity is tangential. Their perpendicular directions make instantaneous gravitational power F · v equal to zero. Gravity changes the direction of velocity without changing its magnitude. The satellite accelerates even though its speed and kinetic energy stay constant.",
      "Equating GMm/r² to mv²/r gives v = √(GM/r). The orbital period is circumference divided by speed: T = 2πr/v = 2π√(r³/GM). A larger circular orbit has lower speed and a longer path, so both effects increase its period. These formulas use distance from the central body’s center, not altitude alone.",
      "An astronaut and spacecraft in the same orbit share free fall and can have nearly zero support force. Gravity remains responsible for their curved path. A scale inside the cabin would measure apparent weight, while their masses and gravitational forces remain nonzero. Thrust or rotation can restore contact force and change the apparent-weight experience.",
      "A satellite that stays over one ground longitude on a rotating planet needs a circular equatorial orbit in the same rotation direction with a period matching the planet’s rotation relative to distant stars. Merely matching the period in a tilted orbit does not keep it over one fixed location. Real station-keeping also accounts for perturbations."
    ],
    "terms": [
      [
        "Orbital period",
        "Time for one complete orbit."
      ],
      [
        "Geostationary orbit",
        "An equatorial prograde circular Earth orbit matching Earth’s sidereal rotation."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A circular orbital radius becomes four times larger around the same dominant mass. Compare speed and period.",
      "reasoning": "Speed becomes 1/2 as large and period becomes 4^(3/2) = 8 times larger."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Gravity does no work on an ideal circular-orbit satellite because…",
      "options": [
        "gravity is zero.",
        "force is perpendicular to velocity.",
        "the satellite has no mass."
      ],
      "correct": 1,
      "hint": "Work depends on the component along displacement.",
      "feedback": [
        "Gravity supplies the inward acceleration.",
        "Correct. There is no force component along the instantaneous motion.",
        "Satellite mass remains nonzero."
      ],
      "teacher": "Ask whether the same work argument holds on an ellipse."
    }
  },
  "ellipse": {
    "title": "Elliptical orbits",
    "heading": "The focus is not the center of the oval.",
    "subtitle": "A changed speed can change the orbit’s shape.",
    "target": "Identify ellipse geometry and compare speed around an orbit.",
    "visual": "kepler",
    "paragraphs": [
      "An ellipse consists of points whose distances from two fixed foci have a constant sum. The semimajor axis a is half its longest diameter, and eccentricity e measures the departure from a circle. A circle has e = 0. For an ideal gravitational two-body ellipse, the attracting center occupies a focus, not generally the geometric center.",
      "The closest radius is a(1 − e), and the farthest is a(1 + e). Their sum is 2a. The satellite moves fastest near the closest approach and slowest near the farthest. Equal times correspond to equal swept areas, so dots placed at equal time intervals crowd together where the satellite moves more slowly.",
      "At a given point, changing tangential speed changes the trajectory. A suitable circular speed gives a circle; a larger speed below escape speed can give an ellipse with that point at its closest approach. A lower tangential speed can produce an ellipse whose farthest point is the release location, potentially intersecting the central body. A mathematical ellipse is not a safe orbit if its path runs through the planet.",
      "The familiar small projectile parabola is a local approximation with nearly constant downward gravity. Over planetary distances, gravity changes direction and magnitude. The global gravitational trajectory is a conic section in the ideal two-body model; terrain and atmosphere can interrupt it long before a complete path is traced."
    ],
    "terms": [
      [
        "Focus",
        "One of the two fixed points defining an ellipse."
      ],
      [
        "Periapsis and apoapsis",
        "Closest and farthest points from the attracting focus in an orbit."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "An ellipse has a = 10,000 km and e = 0.20. Find its closest and farthest center distances.",
      "reasoning": "rp = 8,000 km and ra = 12,000 km. These are center distances; subtract the planet’s radius to obtain altitudes."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Equal-time dots on an elliptical orbit are farther apart near…",
      "options": [
        "apoapsis.",
        "periapsis.",
        "both ends equally for every ellipse."
      ],
      "correct": 1,
      "hint": "Compare how much path is traveled in the same time.",
      "feedback": [
        "The satellite moves more slowly there.",
        "Correct. Its speed is greatest at closest approach.",
        "Equal spacing applies to the circular limit."
      ],
      "teacher": "Ask students to locate both foci and distinguish radius from semimajor axis."
    }
  },
  "orbitalEnergy": {
    "title": "Energy and satellite motion",
    "heading": "Trade kinetic and gravitational energy.",
    "subtitle": "Use a potential-energy zero that works far from the planet.",
    "target": "Apply orbital energy conservation and interpret speed changes.",
    "visual": "orbital-energy",
    "paragraphs": [
      "For a satellite far enough from the surface that g changes significantly, mgh with one constant g is not a global potential-energy formula. Choose gravitational potential energy zero at infinite separation. Then U = −GMm/r for a spherical central mass. The negative sign expresses that energy must be added to separate a bound pair to infinity.",
      "With no thrust or drag, total mechanical energy E = ½mv² − GMm/r remains constant. As a satellite moves inward, U becomes more negative and K increases. As it moves outward, U rises toward zero and K decreases. Gravity can therefore do positive or negative work along an ellipse even though it does no work along a perfect circle.",
      "For a bound Kepler ellipse with semimajor axis a, E = −GMm/(2a). Combining this with the energy equation gives v² = GM(2/r − 1/a). This vis-viva relation connects local speed and radius to the whole orbit’s size. For a circle, r = a and it reduces to v² = GM/r.",
      "A rocket burn changes the mechanical energy and angular momentum of the satellite’s orbit. The conserved-energy statement applies to the coasting segment after the burn, not across an interval with unaccounted thrust. Similarly, drag transfers orbital mechanical energy into other forms and changes the trajectory. Define the interval before claiming conservation."
    ],
    "terms": [
      [
        "Orbital mechanical energy",
        "Sum of orbital kinetic and gravitational potential energy."
      ],
      [
        "Vis-viva relation",
        "v² = GM(2/r − 1/a) for an ideal Kepler orbit."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "In units with GM = 1 and a = 1, compare energies per unit mass at r = 0.5 and r = 1.5.",
      "reasoning": "At r = 0.5: U = −2, K = 1.5. At r = 1.5: U = −2/3, K = 1/6. Both total −0.5."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "While a coasting satellite moves farther from the attracting body on an ellipse, its kinetic energy…",
      "options": [
        "increases.",
        "decreases.",
        "must remain constant."
      ],
      "correct": 1,
      "hint": "Potential energy rises as it becomes less negative.",
      "feedback": [
        "That would increase total mechanical energy without an input.",
        "Correct. The rise in U is balanced by a fall in K.",
        "Constant kinetic energy applies to a circular orbit."
      ],
      "teacher": "Have students use signed energy bars instead of treating negative U as missing energy."
    }
  },
  "escape": {
    "title": "Escape speed",
    "heading": "Reach infinity without running out of kinetic energy.",
    "subtitle": "Escape speed depends on location and source mass.",
    "target": "Derive escape speed from energy and distinguish escape from circular orbit.",
    "visual": "escape-lab",
    "paragraphs": [
      "Escape speed is the minimum initial speed needed to reach arbitrarily large separation with zero final speed in an ideal isolated gravitational system, after propulsion stops. Ignore air resistance and other bodies. At the threshold, total mechanical energy is zero: ½mv² − GMm/r = 0. Therefore vescape = √(2GM/r).",
      "At the same radius, circular speed is √(GM/r), so escape speed is √2 times larger. The satellite mass cancels. Near Earth’s surface the ideal value is about 11.2 km/s, compared with about 7.9 km/s for a circular trajectory. These are energy-based reference speeds; real launches face drag, gravity losses, rotation, and trajectory constraints.",
      "Escape does not mean gravity abruptly vanishes. The departing object keeps slowing as gravitational potential energy rises toward zero. Above escape speed it retains positive kinetic energy far away. At exactly escape speed, the ideal path is parabolic; a bound ellipse has negative total energy, and an unbound hyperbolic trajectory has positive energy.",
      "The simple energy threshold assumes an unobstructed path. A velocity aimed into a planet does not produce a successful escape just because its magnitude meets a formula. A continuously powered vehicle can also escape without ever having the local ballistic escape speed at an earlier point, because propulsion continues adding energy. Distinguish a coasting projectile problem from a powered-flight problem."
    ],
    "terms": [
      [
        "Escape speed",
        "Minimum local coasting speed for zero-energy escape under the stated assumptions."
      ],
      [
        "Bound orbit",
        "Orbit with negative total mechanical energy in an isolated two-body model."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "At a location where circular speed is 6 km/s, find escape speed.",
      "reasoning": "vescape = √2 × 6 ≈ 8.49 km/s, assuming an unobstructed coasting path and the same central source."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At the threshold of ideal escape, the object’s total mechanical energy is…",
      "options": [
        "negative.",
        "zero.",
        "always equal to its initial kinetic energy."
      ],
      "correct": 1,
      "hint": "Use zero potential energy at infinite separation.",
      "feedback": [
        "Negative energy corresponds to a bound trajectory.",
        "Correct. Final kinetic and potential energies approach zero.",
        "Initial potential energy must also be included."
      ],
      "teacher": "Ask why escape does not mean crossing a boundary where gravity ends."
    }
  }
} satisfies Record<string, LessonContent>
