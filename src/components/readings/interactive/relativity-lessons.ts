import type { LessonContent } from './lesson-contract'
/** Original adaptations; mass denotes invariant mass. */
export const relativityLessons = {
  "events": {
    "title": "Space-time",
    "heading": "An event needs a place and a time.",
    "subtitle": "Describe events, reference frames, and elapsed time along a worldline.",
    "target": "Describe events, reference frames, and elapsed time along a worldline.",
    "visual": "spacetime-lab",
    "paragraphs": [
      "A flash at a station is an event: something happens at a particular place and time. To describe it, an observer assigns three spatial coordinates and a time coordinate. Space-time combines these descriptions. A reference frame is a way of assigning coordinates using rulers and synchronized clocks, not merely a place from which someone watches.",
      "A worldline joins the events in an object’s history. On a diagram with position horizontally and time vertically, an object resting in the chosen frame has a vertical worldline. An object moving steadily has a slanted one. The slope depends on the axis convention, so always read the labels before interpreting a diagram.",
      "The elapsed time recorded by a clock traveling between two events is its proper time. Different routes through space-time can accumulate different proper times between a shared departure and reunion. Each traveler still experiences their own clock ticking normally. There is no universal master clock whose reading every possible moving clock must match.",
      "Light travels at c in vacuum in every inertial frame. A light ray has a worldline, but a photon has no inertial rest frame: one cannot ride alongside light and use a clock at rest with it. Statements about what a photon sees therefore are not valid observer descriptions in special relativity."
    ],
    "terms": [
      [
        "Event",
        "Something specified by a position and a time in a reference frame."
      ],
      [
        "Proper time",
        "Elapsed time measured by a clock along its own worldline."
      ],
      [
        "Worldline",
        "The sequence of events occupied by an object."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A clock stays at x = 2 light-seconds for 3 seconds in a chosen frame. What does its worldline look like?",
      "reasoning": "It is vertical at x = 2. Its position stays fixed while its time coordinate increases by 3 seconds."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "On a position-horizontal, time-vertical diagram, a vertical worldline represents…",
      "options": [
        "an object at rest in that frame.",
        "an object moving at light speed.",
        "an object for which time has stopped."
      ],
      "correct": 0,
      "hint": "Ask which coordinate is changing.",
      "feedback": [
        "Correct. Time changes while position stays constant.",
        "Light changes position as time advances.",
        "A vertical line spans different times."
      ],
      "teacher": "Ask students to identify two events and name the clock measuring their separation."
    }
  },
  "first": {
    "title": "The first postulate",
    "heading": "Steady motion does not select a special laboratory.",
    "subtitle": "Apply the same laws of physics in all inertial reference frames.",
    "target": "Apply the same laws of physics in all inertial reference frames.",
    "visual": "relative",
    "paragraphs": [
      "Imagine doing an experiment inside a sealed train moving smoothly along a straight track. A dropped ball falls toward your feet, and a spring oscillator behaves as it does in a stationary laboratory. The first postulate of special relativity says that the laws of physics take the same form in every inertial reference frame.",
      "An inertial frame is one in which a freely moving object continues at constant velocity. Frames moving at constant velocity relative to an inertial frame are also inertial. A turning, braking, or accelerating train is a different case: its changing motion can be detected by local mechanical experiments without looking outside.",
      "The postulate does not require every observer to report the same position, velocity, momentum, or elapsed coordinate time. Those measurements depend on the frame. What stays consistent is the physical law relating properly measured quantities and the events on which observers agree, such as a ball striking a particular detector.",
      "There is no experiment confined to an ideal inertial cabin that determines its absolute constant velocity through space. You can measure velocity relative to Earth, another spacecraft, or a passing marker. Naming that reference is meaningful; claiming that one uniformly moving cabin is truly at rest while all others violate the laws is not."
    ],
    "terms": [
      [
        "Inertial frame",
        "A reference frame in which an unforced object moves at constant velocity."
      ],
      [
        "Relativity principle",
        "The laws of physics have the same form in all inertial frames."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Two sealed spacecraft coast at different constant velocities. Can identical local spring experiments identify which craft is absolutely at rest?",
      "reasoning": "No. Both are inertial laboratories. Their relative velocity can be measured using an external reference, but neither is a privileged rest frame."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which motion can be detected locally inside an otherwise sealed cabin?",
      "options": [
        "A constant velocity relative to Earth.",
        "A turn that changes the cabin’s velocity.",
        "A different choice of coordinate origin."
      ],
      "correct": 1,
      "hint": "A turn is acceleration.",
      "feedback": [
        "Uniform motion alone does not distinguish inertial laboratories.",
        "Correct. Acceleration can produce observable effects inside the cabin.",
        "Relabeling coordinates does not change the physical motion."
      ],
      "teacher": "Use the low-speed relative-velocity illustration as a reference-frame example, then distinguish acceleration from steady motion."
    }
  },
  "light": {
    "title": "The second postulate",
    "heading": "Changing the source motion does not change vacuum light speed.",
    "subtitle": "Distinguish relativistic velocity addition from ordinary low-speed addition.",
    "target": "Distinguish relativistic velocity addition from ordinary low-speed addition.",
    "visual": "light-speed-lab",
    "paragraphs": [
      "In everyday life, a ball thrown forward from a moving vehicle has a road-frame speed close to the throwing speed plus the vehicle speed. Extending that rule unchanged to light would conflict with the second postulate: every inertial observer measures vacuum light speed c, independent of the motion of its source.",
      "The same flash can be emitted from a lamp on a spacecraft or from a lamp on a station. Each inertial laboratory uses its own rulers and synchronized clocks to measure distance divided by elapsed time. Both obtain c for the flash. This result concerns locally defined measurements, not the delay before a distant observer receives a signal.",
      "For velocities along one line, the relativistic addition rule is u = (u′ + v)/(1 + u′v/c²). Here u′ is the projectile’s velocity in the moving craft and v is the craft velocity relative to the station. Substituting u′ = c produces u = c. For speeds much smaller than c, the denominator is almost one and the familiar sum is an excellent approximation.",
      "Consistency requires changes to how different frames compare distances, time intervals, and simultaneity. Two events simultaneous at separated locations in one frame need not be simultaneous in another. The postulates change the coordinate relationship while preserving the same physical events."
    ],
    "terms": [
      [
        "Vacuum light speed",
        "The invariant speed c measured for light in vacuum by inertial observers."
      ],
      [
        "Simultaneity",
        "Whether two events receive the same time coordinate in a specified frame."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A craft moves at 0.60c and launches a probe forward at 0.60c relative to itself. Find the probe’s station-frame speed.",
      "reasoning": "u/c = (0.60 + 0.60)/(1 + 0.36) ≈ 0.882. The result is below c."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A lamp moves toward you at 0.60c. You measure its approaching light in vacuum at…",
      "options": [
        "0.40c.",
        "c.",
        "1.60c."
      ],
      "correct": 1,
      "hint": "Apply the light-speed postulate in your own inertial frame.",
      "feedback": [
        "Subtracting the source speed uses the wrong transformation.",
        "Correct. Source motion changes other observations, such as frequency, but not vacuum light speed.",
        "Ordinary velocity addition is not valid for light."
      ],
      "teacher": "Separate a speed measurement from the frequency or arrival spacing of pulses."
    }
  },
  "time": {
    "title": "Time dilation",
    "heading": "A longer light path takes longer at the same c.",
    "subtitle": "Compare coordinate time with the proper time of a moving clock.",
    "target": "Compare coordinate time with the proper time of a moving clock.",
    "visual": "light-clock",
    "paragraphs": [
      "A light clock sends a pulse between two mirrors. In the clock’s rest frame, the pulse travels straight across their separation. In a frame where the clock moves sideways, the pulse follows a diagonal path because the receiving mirror changes position during the trip. Both frames measure the pulse speed as c.",
      "The diagonal path is longer, so the frame in which the clock moves assigns a larger time interval than the interval recorded by the clock itself. The relationship is Δt = γΔτ, where γ = 1/√(1 − v²/c²), Δτ is proper time, and v is the clock’s speed in the inertial frame measuring Δt. The factor γ is at least one for a massive clock.",
      "This is not a fault in the clock. Mechanical, biological, and other properly functioning clocks reflect the same relation. A traveler experiences ordinary local time aboard the craft; they do not feel their thinking or heartbeat slowing relative to their own watch. Comparing separated clocks requires a frame and a synchronization procedure.",
      "Two inertial observers can each describe the other’s moving clock as running slowly without contradiction because they use different sets of simultaneous distant events. To compare ages directly at a reunion, examine the whole paths through space-time. Also distinguish time dilation from visual appearance: received flashes include changing light-travel time and Doppler effects."
    ],
    "terms": [
      [
        "Time dilation",
        "A moving clock accumulates less proper time than the coordinate time between its ticks in an inertial frame."
      ],
      [
        "Lorentz factor",
        "γ = 1/√(1 − v²/c²), the factor in relativistic time and length comparisons."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A clock moves at 0.60c. How much proper time passes while the laboratory records 10 seconds?",
      "reasoning": "γ = 1.25, so Δτ = 10/1.25 = 8 seconds. The moving clock works normally in its own frame."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At 0.80c, γ = 5/3. A moving clock records 3 seconds. The laboratory interval is…",
      "options": [
        "1.8 seconds.",
        "3 seconds.",
        "5 seconds."
      ],
      "correct": 2,
      "hint": "Multiply proper time by γ.",
      "feedback": [
        "This divides in the wrong direction.",
        "Equal intervals occur when relative speed is zero.",
        "Correct. (5/3) × 3 = 5 seconds."
      ],
      "teacher": "Require students to label whose clock measures each interval before calculating."
    }
  },
  "travel": {
    "title": "Space and time travel",
    "heading": "Compare the entire journey before comparing ages.",
    "subtitle": "Explain unequal aging at reunion and the limits of fast travel.",
    "target": "Explain unequal aging at reunion and the limits of fast travel.",
    "visual": "twin-trip",
    "paragraphs": [
      "Suppose a traveler leaves Earth, coasts to a distant destination, reverses direction, and returns. In an idealized Earth inertial frame, the traveler moves for most of the trip while the Earth clock remains at one position. Both clocks start together and can be compared directly when they reunite.",
      "If each coasting leg has the same speed magnitude v and the turnaround takes negligible time, the traveler’s elapsed time is the Earth-frame duration divided by γ. The paths differ: the traveler changes inertial frames at the turnaround. The stay-at-home description uses one inertial frame throughout the idealized journey. The situation is not symmetric between two travelers who simply pass once and never meet again.",
      "Acceleration is relevant to the change of path, but the proper-time difference is calculated from the complete worldlines. A short turnaround does not need to account for all the age difference as a local slowing mechanism. Real journeys would include finite acceleration periods and would require integrating the elapsed proper time over them.",
      "Time dilation can make a long Earth-frame trip occupy fewer years on a traveler’s watch. It does not allow a massive craft to exceed c, send information backward in time, or reach a distant destination sooner than a light signal in the Earth frame. Energy, propulsion, shielding, and acceleration remain physical constraints."
    ],
    "terms": [
      [
        "Twin comparison",
        "Comparison of proper times along different departure-to-reunion worldlines."
      ],
      [
        "Light-year",
        "The distance light travels in vacuum in one year, not a unit of time."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A destination is 4 light-years away in the Earth frame. A craft coasts out and back at 0.80c with an ideal instantaneous turnaround. Compare elapsed times.",
      "reasoning": "Earth records 2 × 4/0.80 = 10 years. With γ = 5/3, the traveler records 6 years."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why can the twins’ reunited clocks differ?",
      "options": [
        "One watch must malfunction.",
        "They follow different worldlines between the same meetings.",
        "The craft exceeds light speed."
      ],
      "correct": 1,
      "hint": "Compare departure and reunion events along both routes.",
      "feedback": [
        "Ideal clocks can correctly record unequal proper times.",
        "Correct. The traveler changes frames at the turnaround.",
        "Every coasting speed in this example is below c."
      ],
      "teacher": "Have students draw the turnaround rather than invoke reciprocal time dilation for the whole trip."
    }
  },
  "length": {
    "title": "Length contraction",
    "heading": "Measure both ends at the same time in your frame.",
    "subtitle": "Relate proper length to a moving object’s measured longitudinal length.",
    "target": "Relate proper length to a moving object’s measured longitudinal length.",
    "visual": "length-lab",
    "paragraphs": [
      "To measure the length of a moving rod, record both endpoint positions simultaneously in your chosen frame and subtract them. Following the front endpoint first and the rear endpoint later mixes length with motion. A photograph also combines light emitted at different times, so its apparent shape is not automatically a direct length measurement.",
      "The proper length L₀ is the rod’s length measured in its rest frame. A frame in which it moves parallel to its length measures L = L₀/γ. Only the component parallel to the relative velocity contracts; transverse dimensions stay unchanged in the standard inertial comparison. A rod lying sideways across the motion therefore does not shorten along its sideways length.",
      "The rod has not been mechanically crushed in its own frame. Its passengers use ordinary onboard rulers and measure L₀. They can in turn measure the laboratory’s moving rulers as contracted. The coordinate transformation changes which pairs of distant endpoint events count as simultaneous, allowing these reciprocal statements to coexist.",
      "Length contraction and time dilation describe the same consistent space-time relationship. For a traveler, the distance between Earth and a destination moving past the craft is contracted, helping explain a shorter travel time on the craft’s clock. Always specify the rest frame, the measured frame, and the direction before substituting a Lorentz factor."
    ],
    "terms": [
      [
        "Proper length",
        "An object’s length measured in its own rest frame."
      ],
      [
        "Length contraction",
        "Reduction of a moving object’s measured length parallel to relative motion: L = L₀/γ."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 10 m rod moves parallel to itself at 0.60c. Find its laboratory length.",
      "reasoning": "γ = 1.25, so L = 10/1.25 = 8 m. A transverse 10 m rod retains that transverse length."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A moving rod’s endpoints must be recorded…",
      "options": [
        "at the same time in the measuring frame.",
        "at any two times.",
        "only when the rod is photographed."
      ],
      "correct": 0,
      "hint": "A length is a spatial separation at one chosen coordinate time.",
      "feedback": [
        "Correct. Simultaneity is part of the measurement procedure.",
        "Different times mix position change with length.",
        "Light-arrival timing can complicate a photograph."
      ],
      "teacher": "Ask students to rotate the rod and identify which dimension contracts."
    }
  },
  "momentum": {
    "title": "Momentum and inertia in relativity",
    "heading": "Momentum can keep increasing while speed approaches c.",
    "subtitle": "Use invariant mass and relativistic momentum without treating c as reachable.",
    "target": "Use invariant mass and relativistic momentum without treating c as reachable.",
    "visual": "rel-energy",
    "paragraphs": [
      "At everyday speeds, momentum p = mv describes motion extremely well. At speeds comparable with light speed, the consistent expression is p = γmv, where m is invariant rest mass. The Lorentz factor grows without bound as v approaches c. A finite increase in momentum therefore produces a progressively smaller speed increase near c.",
      "Some older explanations call γm a relativistic mass. In this reading, mass means invariant mass throughout. The object’s rest mass does not grow merely because another observer assigns it a larger velocity. Its momentum and energy are frame dependent, and those quantities express the increasingly demanding response to acceleration.",
      "Force remains related to the rate of momentum change. It cannot generally be replaced by m times acceleration with the same simple scalar coefficient used at low speed. The direction of the force relative to the motion matters in a full relativistic treatment. Conservation of total momentum still applies to an isolated system when relativistic momenta are used.",
      "A massive spacecraft cannot be accelerated to c with finite energy. Light can travel at c because photons have zero rest mass; they are not massive objects successfully pushed through the limiting speed. A photon can carry momentum even though the low-speed formula mv cannot be applied to it."
    ],
    "terms": [
      [
        "Invariant mass",
        "An object’s rest mass, the same for all inertial observers."
      ],
      [
        "Relativistic momentum",
        "p = γmv for a particle with rest mass m."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "For a particle moving at 0.60c, compare p with the low-speed estimate mv.",
      "reasoning": "γ = 1.25, so p is 1.25 times mv, or 25% larger. Its rest mass is unchanged."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "As a massive particle approaches c, its momentum…",
      "options": [
        "must approach mc.",
        "can grow without bound.",
        "decreases to zero."
      ],
      "correct": 1,
      "hint": "The factor γ multiplies mv.",
      "feedback": [
        "That omits the Lorentz factor.",
        "Correct. Speed approaches c while γ continues increasing.",
        "Increasing speed does not remove momentum."
      ],
      "teacher": "Require a statement about invariant mass when students describe resistance to further acceleration."
    }
  },
  "massEnergy": {
    "title": "Mass and energy",
    "heading": "Rest energy belongs in the complete energy account.",
    "subtitle": "Distinguish rest energy, total energy, and kinetic energy.",
    "target": "Distinguish rest energy, total energy, and kinetic energy.",
    "visual": "rel-energy",
    "paragraphs": [
      "A body at rest has energy associated with its invariant mass: E₀ = mc². Because c² is enormous in SI units, even a small change in a system’s rest mass corresponds to a large energy difference. The relation applies to the whole system, including its internal energy and binding interactions.",
      "For a freely moving massive particle, total energy is E = γmc² and kinetic energy is K = (γ − 1)mc². The rest-energy contribution remains even when the particle stops. At low speeds, K approaches ½mv². Total energy and momentum also satisfy E² = (pc)² + (mc²)², which allows a massless photon to have E = pc.",
      "When energy leaves a system at rest, its mass can decrease by the energy loss divided by c², with recoil and the complete energy balance accounted for. A bound nucleus can have less mass than its separated constituents because energy was released as the bound system formed. Chemical reactions also change system mass by tiny amounts; the principle is not limited to nuclear processes.",
      "Matter is not a mysterious extra source that bypasses conservation. Include emitted radiation, kinetic energy, and the remaining matter in the system account. A sealed heated object has slightly greater mass than the same object after it has lost that thermal energy, even though the difference is ordinarily too small for a classroom balance."
    ],
    "terms": [
      [
        "Rest energy",
        "E₀ = mc², energy associated with a system’s invariant mass."
      ],
      [
        "Mass defect",
        "Difference between the mass of separated constituents and their bound system."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A system loses 9 × 10¹³ J of energy while recoil is negligible. Using c ≈ 3 × 10⁸ m/s, what mass difference corresponds to that energy?",
      "reasoning": "Δm = ΔE/c² = 9 × 10¹³ / 9 × 10¹⁶ = 0.001 kg."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "For a massive particle at rest, which energy is zero?",
      "options": [
        "Rest energy.",
        "Kinetic energy.",
        "Both rest and total energy."
      ],
      "correct": 1,
      "hint": "Separate motion energy from the mc² contribution.",
      "feedback": [
        "A massive particle has rest energy even when stationary.",
        "Correct. γ = 1 gives K = 0 and E = mc².",
        "Total energy still contains the rest energy."
      ],
      "teacher": "Ask students to draw the boundary around all reaction products and radiation."
    }
  },
  "correspondence": {
    "title": "The correspondence principle",
    "heading": "A broader theory must recover successful old predictions.",
    "subtitle": "Identify when Newtonian approximations are accurate and when they fail.",
    "target": "Identify when Newtonian approximations are accurate and when they fail.",
    "visual": "rel-energy",
    "paragraphs": [
      "Newtonian mechanics predicts everyday motion remarkably well. Special relativity does not discard those successful observations. It supplies a wider model whose predictions become nearly the same as Newton’s when speeds are much smaller than c. This agreement in an established domain is an example of the correspondence principle.",
      "For small β = v/c, γ is approximately 1 + β²/2. Thus relativistic momentum approaches mv. Subtracting rest energy from total energy gives K = (γ − 1)mc² ≈ ½mv². The familiar kinetic-energy expression emerges from the relativistic one instead of being an unrelated rule that happens to work.",
      "An approximation is judged against the precision a task requires. A tiny fractional correction might be irrelevant to a classroom cart measurement but important in a precision experiment. There is no single speed at which Newtonian mechanics suddenly turns off. Its error grows smoothly, so compare the predicted discrepancy with the acceptable measurement uncertainty.",
      "The same reasoning applies beyond relativity. A fluid model may neglect viscosity when losses are small, and a point-particle model may neglect rotation when size does not matter to the question. State the model’s conditions, test its limiting behavior, and choose the simplest model that preserves the needed accuracy. A more complete theory should explain why the simpler one worked."
    ],
    "terms": [
      [
        "Correspondence principle",
        "A broader theory reproduces a successful earlier theory in its established limiting domain."
      ],
      [
        "Approximation",
        "A model or expression accurate enough under stated conditions and tolerance."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "At v = 0.10c, γ ≈ 1.00504. How different is relativistic momentum from mv?",
      "reasoning": "It is about 0.504% larger. Whether that matters depends on the required precision."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why does Newtonian mechanics remain useful?",
      "options": [
        "It is exact at every speed.",
        "Its low-speed predictions closely approximate relativity.",
        "Relativity applies only to light."
      ],
      "correct": 1,
      "hint": "Compare γ with one at small v/c.",
      "feedback": [
        "Measurable high-speed corrections show it is not universally exact.",
        "Correct. Its domain includes most everyday mechanical motion.",
        "Relativity also describes massive particles and clocks."
      ],
      "teacher": "Have students name a required tolerance before deciding whether an approximation is sufficient."
    }
  },
  "equivalence": {
    "title": "General relativity",
    "heading": "Free fall removes local support, not the gravitational environment.",
    "subtitle": "Use the local equivalence principle and recognize tidal limits.",
    "target": "Use the local equivalence principle and recognize tidal limits.",
    "visual": "equivalence-lab",
    "paragraphs": [
      "Standing on a floor, you feel a support force. Inside a freely falling cabin, you and nearby loose objects accelerate together, so the floor need not push on your feet. This apparent weightlessness can occur where the gravitational field is substantial. It describes the absence of support, not the disappearance of gravity.",
      "The equivalence principle connects a sufficiently small freely falling laboratory with a local inertial laboratory. Conversely, an accelerating rocket far from gravitating bodies can produce floor support like that experienced in a laboratory at rest in a gravitational field. The comparison is local: it applies over a small enough region and duration.",
      "Real gravitational fields vary across space. Two freely falling objects separated vertically or sideways can change their separation because the field has different strength or direction at their positions. These tidal effects cannot be removed throughout an extended region merely by choosing a falling frame. They mark an important limit to the simple cabin analogy.",
      "General relativity describes gravity through space-time geometry. Freely falling bodies follow natural paths called geodesics. An object held stationary by a floor is being prevented from following its free-fall path. Newton’s force description remains a very useful approximation for many weak-field, low-speed situations, while the geometrical account explains additional clock and light effects."
    ],
    "terms": [
      [
        "Equivalence principle",
        "Local connection between freely falling frames and inertial physics, and between support in gravity and acceleration."
      ],
      [
        "Tidal effect",
        "Relative acceleration caused by gravitational variation across a region."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 60 kg astronaut stands on the floor of a rocket accelerating at 9.8 m/s² far from significant gravity. What does a scale read as force?",
      "reasoning": "The floor supplies F = ma = 588 N. In a freely coasting rocket, the same astronaut can have zero scale force."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A freely falling cabin near Earth is weightless because…",
      "options": [
        "Earth’s gravity is zero.",
        "the cabin and occupants share free fall without floor support.",
        "their rest masses disappear."
      ],
      "correct": 1,
      "hint": "A scale measures contact force.",
      "feedback": [
        "Gravity can remain large during free fall.",
        "Correct. Support vanishes in the ideal shared fall.",
        "Rest mass does not vanish in a falling frame."
      ],
      "teacher": "Ask what two separated floating objects could reveal about tidal effects."
    }
  },
  "geometry": {
    "title": "Gravity and geometry",
    "heading": "Natural paths depend on the geometry.",
    "subtitle": "Use curved-space analogies carefully and connect gravity to space-time curvature.",
    "target": "Use curved-space analogies carefully and connect gravity to space-time curvature.",
    "visual": "curved-geometry",
    "paragraphs": [
      "On a flat plane, the angles inside a triangle sum to 180°. On a sphere, a triangle made from shortest surface paths can have a larger sum. Start at the north pole, follow a meridian to the equator, travel a quarter of the equator, and return along another meridian. Each corner is a right angle, producing 270° altogether.",
      "This example shows how inhabitants can discover curvature through measurements within their space. They do not need to step outside the surface to compare paths and angles. A geodesic is a locally straight or natural path for the geometry. On a sphere, great-circle arcs play that role, even when they look curved from an external viewpoint.",
      "General relativity concerns four-dimensional space-time, including the time coordinate, rather than only a bent two-dimensional surface. Mass-energy affects that geometry, and the geometry determines the free-fall paths of matter and light. A rubber-sheet picture can suggest altered paths, but it relies on an external downward gravity and must not be mistaken for the mechanism of gravity itself.",
      "Curvature also connects to tidal effects: neighboring free-fall paths can converge or separate. In a sufficiently small region one can choose coordinates that resemble an inertial frame, yet variations across a larger region reveal curvature. The surface triangle is an analogy for testing geometry, not a numerical model of Earth’s gravitational field."
    ],
    "terms": [
      [
        "Geodesic",
        "A locally natural path determined by a space or space-time geometry."
      ],
      [
        "Curvature",
        "Departure from flat geometry, detectable through intrinsic measurements or neighboring free-fall behavior."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A spherical triangle joins the north pole to two equatorial points 90° apart using great-circle arcs. Find the angle sum.",
      "reasoning": "Its three angles are each 90°, so the sum is 270°. This exceeds the planar sum by 90°."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why does the rubber-sheet analogy have limits?",
      "options": [
        "It includes all four space-time dimensions exactly.",
        "It uses external gravity to pull objects down the sheet.",
        "Curved geometry has no measurable consequences."
      ],
      "correct": 1,
      "hint": "Identify what makes a ball roll down the pictured surface.",
      "feedback": [
        "The sheet is only a lower-dimensional analogy.",
        "Correct. That outside pull cannot explain the origin of gravity in the theory.",
        "Angles and relative free-fall paths can reveal curvature."
      ],
      "teacher": "Require students to identify both a useful feature and a limit of the analogy."
    }
  },
  "tests": {
    "title": "Tests of general relativity",
    "heading": "Compare measurable predictions with evidence.",
    "subtitle": "Connect orbital precession, light deflection, clock rates, and gravitational waves to tests.",
    "target": "Connect orbital precession, light deflection, clock rates, and gravitational waves to tests.",
    "visual": "gravity-clock",
    "paragraphs": [
      "A physical theory earns confidence by making predictions that measurements can test. General relativity accounts for an additional part of Mercury’s orbital precession that Newtonian calculations with the known planetary influences did not explain. The relevant comparison is a small residual beyond already understood effects, not the claim that Newtonian gravity predicts no orbital changes at all.",
      "Light also follows paths affected by space-time geometry. Light passing near the Sun is deflected, shifting the measured position of a distant source. Testing that prediction requires separating the deflection from the source’s ordinary position and controlling observational uncertainty. Gravitational lensing extends this idea to other astronomical systems.",
      "Clocks at different gravitational potentials accumulate different elapsed times. In a weak, approximately uniform field, a higher stationary clock runs faster than a lower one by a fractional amount approximately gΔh/c². The effect is small near Earth but measurable. This comparison assumes the clocks are stationary in the stated setting; motion can introduce additional relativistic changes.",
      "Gravitational waves are another tested prediction: changing mass distributions can produce propagating disturbances in space-time. LIGO directly detected a signal from merging black holes on September 14, 2015. The source textbook predates that result. Distinct tests probe different consequences, and none should be replaced by an unsupported claim that every imaginable acceleration necessarily emits the same wave pattern."
    ],
    "terms": [
      [
        "Gravitational redshift",
        "Change in light frequency associated with emission and reception at different gravitational potentials."
      ],
      [
        "Gravitational wave",
        "A propagating disturbance in space-time geometry."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Two stationary clocks are separated vertically by 100 m near Earth. Estimate the fractional rate difference with g = 9.8 m/s² and c ≈ 3 × 10⁸ m/s.",
      "reasoning": "gΔh/c² ≈ 1.09 × 10⁻¹⁴. The upper clock runs faster; over one day the difference is about 0.94 ns."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Two stationary clocks near Earth are compared. The higher clock runs…",
      "options": [
        "slightly faster.",
        "slightly slower.",
        "at exactly the same rate under every condition."
      ],
      "correct": 0,
      "hint": "Higher gravitational potential changes the proper-time rate.",
      "feedback": [
        "Correct for this stationary weak-field comparison.",
        "That reverses the gravitational effect.",
        "The difference is small but measurable."
      ],
      "teacher": "Separate predicted size, measurement uncertainty, and evidence. Source update: https://www.ligo.caltech.edu/detection"
    }
  }
} satisfies Record<string, LessonContent>
