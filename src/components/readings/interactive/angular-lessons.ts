import type { LessonContent } from './lesson-contract'
export const angularLessons = {
  "inertia": {
    "title": "Rotational inertia",
    "heading": "Mass distribution matters as much as mass.",
    "subtitle": "Always name the axis.",
    "target": "Compare rotational inertia and use net torque to predict angular acceleration.",
    "visual": "inertia-lab",
    "paragraphs": [
      "Mass measures resistance to a change in translational velocity. Rotational inertia measures resistance to a change in angular velocity about a specified axis. For separated small masses, I = Σmr², where each r is the perpendicular distance to that axis. Moving a mass twice as far away makes its contribution four times larger without changing the mass itself.",
      "For a rigid object about a fixed axis with constant I, Newton’s rotational law is Στ = Iα. Angular acceleration α is the rate of change of angular velocity. At the same net torque, a larger rotational inertia produces a smaller angular acceleration. An object with zero net torque can keep spinning; torque is needed to change its angular momentum, not to maintain ideal frictionless rotation.",
      "Shape formulas encode how mass is distributed. A thin hoop has I = MR² about its central symmetry axis; a uniform solid disk has I = ½MR². A uniform slender rod has I = ML²/12 about its midpoint and ML²/3 about one end, for axes perpendicular to the rod. Identical mass does not make these inertias equal.",
      "The parallel-axis theorem gives I = ICM + Md² for a parallel axis displaced by d from the center-of-mass axis. It does not apply to arbitrary axes with different directions. Before substituting a formula, match both the shape and the axis to the physical situation."
    ],
    "terms": [
      [
        "Rotational inertia",
        "Sum or integral of mass times squared perpendicular distance from an axis."
      ],
      [
        "Angular acceleration",
        "Rate of change of angular velocity."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Two 1 kg masses are each 0.50 m from a light axle. Find I and the angular acceleration from a 2 N·m net torque.",
      "reasoning": "I = 2 × 1 × 0.50² = 0.50 kg·m². α = 2/0.50 = 4 rad/s²."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Moving each mass twice as far from the same axis multiplies I by…",
      "options": [
        "2.",
        "4.",
        "½."
      ],
      "correct": 1,
      "hint": "Distance enters as a square.",
      "feedback": [
        "That would be a linear distance dependence.",
        "Correct. Each mr² term becomes four times larger.",
        "Mass farther from the axis resists changes in rotation more."
      ],
      "teacher": "Require the axis and units in each comparison."
    }
  },
  "gymnastics": {
    "title": "Rotational inertia and gymnastics",
    "heading": "Change shape to change the rotational response.",
    "subtitle": "A tucked body concentrates mass near an axis.",
    "target": "Explain how body position changes inertia about different axes.",
    "visual": "spin-lab",
    "paragraphs": [
      "A body has a different rotational inertia about different axes. Spinning upright uses an axis along the body; a forward somersault uses an axis across it. Extended arms may lie far from one axis but near another. Saying that a person has one rotational inertia without specifying the axis leaves out essential information.",
      "Tucking knees toward the chest concentrates mass nearer the somersault axis and reduces rotational inertia. Straightening the body spreads mass farther away and increases it. During the brief flight of an idealized jump, external torque about the center of mass is small, so angular momentum stays approximately constant. The smaller inertia of a tuck then accompanies a larger angular speed.",
      "During takeoff, contact forces from the floor can supply external torque and establish angular momentum. Once airborne, changing shape redistributes it but does not create net angular momentum. Opening out before landing reduces angular speed for the same total angular momentum, while landing contacts can finally remove that momentum through external torque.",
      "Bending a leg during its forward swing also lowers inertia about the hip, allowing greater angular acceleration for a given muscle torque. This is a different comparison from a freely spinning gymnast: here a muscle is actively applying torque to the selected leg. Choose whether your system is one limb or the entire airborne body before invoking conservation."
    ],
    "terms": [
      [
        "Tuck",
        "Body position concentrating mass nearer a rotation axis."
      ],
      [
        "External torque",
        "Torque exerted on a system by interactions outside its boundary."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "An airborne gymnast reduces inertia from 12 to 4 kg·m² while external torque is negligible. Initial angular speed is 2 rad/s. Find the new speed.",
      "reasoning": "Iinitial ωinitial = Ifinal ωfinal, so ωfinal = 12 × 2/4 = 6 rad/s."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "The angular momentum needed for a somersault is chiefly established…",
      "options": [
        "by tucking during torque-free flight.",
        "through contact torque during takeoff.",
        "by gravity pulling harder on a tuck."
      ],
      "correct": 1,
      "hint": "Identify an external interaction that supplies angular impulse.",
      "feedback": [
        "Tucking changes inertia and speed while conserving existing momentum.",
        "Correct. The floor interaction can provide angular impulse.",
        "Uniform gravity acts through the center of mass and produces no torque about it."
      ],
      "teacher": "Separate takeoff, flight, and landing in the explanation."
    }
  },
  "rolling": {
    "title": "Rotational inertia and rolling",
    "heading": "A descent supplies two kinds of kinetic energy.",
    "subtitle": "Rolling links rotation to translation.",
    "target": "Predict rolling speed from mass distribution and energy conservation.",
    "visual": "rolling-lab",
    "paragraphs": [
      "A rigid object rolling without slipping has vCM = Rω. Its kinetic energy contains both translation of the center of mass and rotation about that center: K = ½MvCM² + ½ICMω². Counting only the first term would predict too much translational speed after a descent because some energy is in rotation.",
      "Write ICM = kMR², where k describes the shape. A thin hoop has k = 1, a solid cylinder has k = ½, and a solid sphere has k = ⅖. Starting from rest and dropping through height h with no dissipative losses gives Mgh = ½Mv²(1 + k), hence v = √[2gh/(1 + k)]. Under these assumptions, mass and radius cancel; the distribution factor remains.",
      "On the same incline, acceleration is g sin θ/(1 + k), so the solid sphere accelerates more than the cylinder, and the hoop least. Static friction supplies the torque needed for rolling when a body descends under gravity. At the ideal stationary contact point, that friction does no work on the rigid rolling body, although it affects the division of translational and rotational energy.",
      "The result requires enough static friction to prevent slipping. A sliding object, a deforming tire, rolling resistance, or liquid moving inside a can needs a different account. Do not apply one shape formula to an object whose material rotates internally in a different way."
    ],
    "terms": [
      [
        "Rolling without slipping",
        "Motion with the contact point instantaneously at rest relative to the surface."
      ],
      [
        "Rotational kinetic energy",
        "Energy ½Iω² associated with rotation about the stated axis."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A solid cylinder rolls from rest down a 1.5 m height drop without losses. Find its bottom speed.",
      "reasoning": "With k = ½, v = √(2 × 9.8 × 1.5/1.5) = √19.6 ≈ 4.43 m/s."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Equal-radius solid and hollow cylinders roll down the same slope without slipping. The solid one is faster because…",
      "options": [
        "it always weighs more.",
        "less of its energy is needed for rotation at a given v.",
        "friction adds extra total energy."
      ],
      "correct": 1,
      "hint": "Compare I/(MR²), not simply total mass.",
      "feedback": [
        "Mass cancels from the ideal acceleration.",
        "Correct. Its smaller shape factor leaves more energy in translation.",
        "Ideal static friction does not supply extra energy at the stationary contact."
      ],
      "teacher": "Ask students to state the no-slip and rigid-body assumptions."
    }
  },
  "momentum": {
    "title": "Angular momentum",
    "heading": "Follow the turning motion about an axis.",
    "subtitle": "Torque changes a vector quantity.",
    "target": "Relate angular momentum to inertia, angular velocity, and external torque.",
    "visual": "spin-lab",
    "paragraphs": [
      "Linear momentum is mass times velocity. For a rigid body rotating about a principal axis, angular momentum along that axis is L = Iω. Its units are kg·m²/s. Doubling angular speed at fixed inertia doubles angular momentum; moving mass outward at fixed angular speed can also increase it by increasing I.",
      "For a small particle moving in a plane, angular momentum about a point is L = r × p. Its magnitude is mvr sin θ. Only the momentum component perpendicular to the radius contributes. A particle traveling in a straight line can therefore have nonzero angular momentum about a point off its path, even though it is not circling that point.",
      "The net external torque controls the change: Στexternal = dL/dt. An angular impulse, the time integral of torque, changes angular momentum. With constant torque, ΔL = τΔt. Do not substitute mass where rotational inertia belongs, and do not add linear and angular momentum; their units and conservation conditions differ.",
      "Angular momentum has a direction determined by a right-hand rule. Curl the fingers in the rotation direction; the thumb indicates the axial direction for symmetric rotation. A torque perpendicular to L can change its direction even if its magnitude stays nearly constant. This is the starting point for understanding a precessing gyroscope."
    ],
    "terms": [
      [
        "Angular momentum",
        "Rotational momentum about a specified point or axis."
      ],
      [
        "Angular impulse",
        "Time integral of torque, equal to the change in angular momentum."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A wheel has I = 0.40 kg·m² and ω = 5 rad/s. A 0.20 N·m torque acts in its spin direction for 3 s. Find final L.",
      "reasoning": "Initial L = 2.0 kg·m²/s. Angular impulse = 0.60 N·m·s, so final L = 2.60 kg·m²/s."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A particle travels straight past a point off its path. Its angular momentum about that point…",
      "options": [
        "must be zero.",
        "can be nonzero.",
        "has units of kilograms."
      ],
      "correct": 1,
      "hint": "Evaluate the perpendicular distance to its momentum line.",
      "feedback": [
        "Straight motion does not make r × p zero for every origin.",
        "Correct. The offset momentum line gives nonzero angular momentum.",
        "The units are kg·m²/s."
      ],
      "teacher": "Ask how the result changes if the reference point lies on the path."
    }
  },
  "conserve": {
    "title": "Conservation of angular momentum",
    "heading": "Pull inward and spin faster.",
    "subtitle": "The conserved quantity is Iω, not ω alone.",
    "target": "Apply angular momentum conservation and account for changes in energy.",
    "visual": "spin-lab",
    "paragraphs": [
      "When net external torque about the chosen axis is negligible, total angular momentum stays constant. For a simple body rotating about that axis, Iinitial ωinitial = Ifinal ωfinal. Pulling mass closer decreases I and increases ω. Extending it increases I and decreases ω. Internal forces can make these changes without adding net angular momentum to the complete system.",
      "Rotational kinetic energy need not remain constant during that rearrangement. Using L = Iω gives K = L²/(2I). At fixed L, reducing I increases K. A skater must do internal work to pull inward while spinning; stored chemical energy can become additional rotational kinetic energy. Conservation of angular momentum is fully compatible with this energy transfer.",
      "Choose a system large enough to include interacting parts. A person turning a spinning wheel on a low-friction stool can rotate in response so that person-plus-wheel angular momentum stays nearly constant about the vertical axis. For the wheel alone, the person applies external torque and its angular momentum changes.",
      "A falling cat illustrates a more subtle case: changing body shape can reorient the body while keeping total angular momentum near zero. Different parts counterrotate, and their geometry changes. This does not justify creating nonzero total angular momentum from nothing. The single rigid-body equation L = Iω is not a complete model of a deforming, articulated animal."
    ],
    "terms": [
      [
        "Angular momentum conservation",
        "Constancy of total angular momentum when net external torque is zero."
      ],
      [
        "Internal work",
        "Energy transfer through forces among parts of the chosen system."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A skater halves I while conserving L. Compare angular speed and rotational kinetic energy.",
      "reasoning": "Angular speed doubles. Since K = L²/(2I), rotational kinetic energy also doubles, supplied by internal work."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "When a skater pulls inward with negligible external torque, what remains constant?",
      "options": [
        "Angular speed.",
        "Angular momentum.",
        "Rotational kinetic energy."
      ],
      "correct": 1,
      "hint": "Conservation follows from the absence of external torque.",
      "feedback": [
        "Speed changes as inertia changes.",
        "Correct. The product Iω remains constant.",
        "Internal work can increase rotational kinetic energy."
      ],
      "teacher": "Require a separate momentum statement and energy statement."
    }
  },
  "habitat": {
    "title": "Simulated gravity",
    "heading": "Let the floor supply the inward force.",
    "subtitle": "Apparent weight can come from rotation.",
    "target": "Relate habitat radius and rotation rate to support force.",
    "visual": "habitat-lab",
    "paragraphs": [
      "An astronaut in a freely falling spacecraft can float because little support force acts. A rotating habitat changes the contact condition. A person standing on the inside of the rim travels in a circle, and the floor pushes inward to supply centripetal acceleration. That support force creates the sensation associated with weight even where the local gravitational field is weak.",
      "In an inertial frame, the force requirement is N = mω²r for a stationary rider relative to the habitat. The acceleration magnitude ω²r can be chosen to equal Earth’s surface value. At fixed angular speed, a location halfway to the axis has half the acceleration; at the axis the rotational contribution is zero.",
      "In the rotating frame, the rider is at rest and an outward centrifugal term can be included to balance the inward floor force in that frame’s equation. It is not a second physical interaction acting in the inertial diagram. The two descriptions must use consistent coordinates and account for the same contact force.",
      "For a chosen apparent gravity, a larger radius permits a lower angular speed: ω = √(g/r). A smaller habitat requires faster rotation and produces larger relative changes between head and feet. Moving relative to the habitat also introduces Coriolis effects. The ideal calculation establishes geometry and force requirements, not a claim that all rotation rates are equally comfortable."
    ],
    "terms": [
      [
        "Simulated gravity",
        "An apparent-weight effect produced by an accelerating support."
      ],
      [
        "Rotation rate",
        "Number of turns per time, convertible to angular speed in rad/s."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "What angular speed produces 9.8 m/s² at a radius of 100 m?",
      "reasoning": "ω = √(9.8/100) ≈ 0.313 rad/s, or ω × 60/(2π) ≈ 2.99 revolutions per minute."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At fixed habitat rotation rate, moving halfway toward the axis makes the rotational acceleration…",
      "options": [
        "twice as large.",
        "half as large.",
        "unchanged."
      ],
      "correct": 1,
      "hint": "Use a = ω²r with ω fixed.",
      "feedback": [
        "That reverses the radius dependence.",
        "Correct. It scales linearly with radius at fixed ω.",
        "Equal angular speed does not mean equal linear acceleration."
      ],
      "teacher": "Have students label inertial and rotating force diagrams separately."
    }
  },
  "alpha": {
    "title": "Angular acceleration",
    "heading": "Changing spin has a tangential signature.",
    "subtitle": "Radial and tangential accelerations answer different questions.",
    "target": "Calculate angular acceleration and both components of linear acceleration.",
    "visual": "angular-kinematics",
    "paragraphs": [
      "Angular velocity describes how quickly an angle changes. Angular acceleration describes how quickly angular velocity changes: average α = Δω/Δt, with units rad/s². Choose one positive rotation direction and use it consistently. A clockwise-spinning wheel can have counterclockwise angular acceleration while it slows down.",
      "For a point at fixed radius r on a rigid rotating body, tangential acceleration is at = rα. It changes the magnitude of tangential velocity. Radial acceleration is ar = rω² and points toward the axis; it changes the direction of velocity. A wheel spinning steadily has zero α but its rim still has radial acceleration.",
      "These components are perpendicular. Their vector sum gives the total acceleration, with magnitude √(at² + ar²). A larger radius on the same rigid wheel gives larger values of both components at the same instant because all its points share ω and α. That statement does not compare different wheels whose angular rates may differ.",
      "For rolling without slipping, the translational acceleration of the wheel center relates to angular acceleration through aCM = Rα with appropriate signs. A motor-driven wheel that slips does not obey that constraint. Distinguish the ground-frame acceleration of a material point on a rolling tire from the simpler acceleration of a point on an axle-fixed wheel."
    ],
    "terms": [
      [
        "Tangential acceleration",
        "Component that changes speed along a circular path."
      ],
      [
        "Radial acceleration",
        "Inward component associated with the changing velocity direction."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A fixed-axis wheel has ω = 3 rad/s and α = 4 rad/s². At r = 0.50 m, find acceleration components.",
      "reasoning": "at = 0.50 × 4 = 2.0 m/s²; ar = 0.50 × 9 = 4.5 m/s². Total magnitude is √(4 + 20.25) ≈ 4.92 m/s²."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A rim point on a wheel with constant nonzero angular speed has…",
      "options": [
        "zero acceleration.",
        "radial acceleration but zero tangential acceleration.",
        "tangential acceleration only."
      ],
      "correct": 1,
      "hint": "Speed and direction can change independently.",
      "feedback": [
        "Its velocity direction still changes.",
        "Correct. α is zero while rω² is not.",
        "Constant speed makes the tangential component zero."
      ],
      "teacher": "Ask students to draw perpendicular acceleration components."
    }
  },
  "kinematics": {
    "title": "Rotational kinematics",
    "heading": "Track accumulated angle as well as final spin.",
    "subtitle": "Constant angular acceleration has a specific set of equations.",
    "target": "Solve fixed-axis motion with constant angular acceleration and consistent units.",
    "visual": "angular-kinematics",
    "paragraphs": [
      "For fixed-axis motion with constant angular acceleration, angular velocity changes linearly: ω = ω0 + αt. The angular displacement is the area under the angular-velocity-versus-time graph. A rectangle plus a triangle gives Δθ = ω0t + ½αt², or equivalently Δθ = ½(ω0 + ω)t.",
      "Eliminating time gives ω² = ω0² + 2αΔθ. These equations parallel constant-acceleration linear kinematics, with angle replacing position and angular velocity replacing velocity. They apply only while α is constant. A braking torque that changes with speed may require dividing the motion into intervals or integrating a changing acceleration.",
      "Convert turns to radians before using linear relations such as s = rΔθ, v = rω, and at = rα. One revolution is 2π radians. Revolutions per minute is not the same as radians per second. Record the axis and sign convention, then choose the equation containing the known quantities and the desired unknown.",
      "A negative angular acceleration does not automatically mean decreasing speed. If ω is also negative, its magnitude grows. If a wheel slows through zero and reverses, signed angular displacement can be smaller than the total angle traveled. Separate the intervals if the question asks for total travel rather than net orientation change."
    ],
    "terms": [
      [
        "Angular displacement",
        "Signed change in angular position, including accumulated turns when tracked."
      ],
      [
        "Constant angular acceleration",
        "Angular velocity changes by the same amount in equal times."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A wheel starts from rest with α = 2 rad/s² for 3 s. Find ω and the angle turned.",
      "reasoning": "ω = 6 rad/s. Δθ = ½ × 2 × 3² = 9 rad, approximately 1.43 revolutions."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A wheel starts from rest with constant α. Doubling the elapsed time multiplies its angle turned by…",
      "options": [
        "2.",
        "4.",
        "8."
      ],
      "correct": 1,
      "hint": "Use Δθ = ½αt² under these stated conditions.",
      "feedback": [
        "Final angular speed doubles, but the accumulated angle grows faster.",
        "Correct. The time is squared.",
        "There is no cubic time dependence in this model."
      ],
      "teacher": "Compare graph area with the equation calculation."
    }
  },
  "rotEnergy": {
    "title": "Rotational work and energy",
    "heading": "Torque transfers energy through an angle.",
    "subtitle": "A spinning object stores kinetic energy.",
    "target": "Apply rotational work, kinetic energy, and power with stated axes.",
    "visual": "rolling-lab",
    "paragraphs": [
      "A tangential force F acting through arc length s does work Fs. Using s = rθ and torque τ = rF gives W = τθ for constant torque about a fixed axis. The angle must be in radians. For varying torque, work is the area under the torque-versus-angle graph, not simply final torque times total angle.",
      "A rigid body with rotational inertia I and angular speed ω has rotational kinetic energy Krot = ½Iω². Net work changes its kinetic energy when the fixed-axis assumptions apply. Doubling ω quadruples that energy. A flywheel can store energy mechanically, but real bearings and air resistance transfer some of it into internal energy over time.",
      "Instantaneous rotational power is P = τω for torque and rotation about the same axis. A braking torque opposite the rotation does negative work and removes rotational kinetic energy. If a motor simultaneously overcomes friction and speeds up a wheel, motor work is divided between increased kinetic energy and dissipated energy.",
      "For an object that both translates and rotates, include ½MvCM² and ½ICMω². The rolling model below demonstrates their combined energy account. The center-of-mass inertia belongs in that sum; using an arbitrary displaced-axis inertia would double-count some motion. Check what the axis formula describes before combining translation and rotation."
    ],
    "terms": [
      [
        "Rotational work",
        "Torque integrated over angular displacement."
      ],
      [
        "Rotational power",
        "Rate of energy transfer, τω for a common fixed axis."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A wheel with I = 2 kg·m² speeds from 1 to 3 rad/s. Find the net work.",
      "reasoning": "ΔK = ½ × 2 × (3² − 1²) = 8 J. A constant 4 N·m net torque would do this over 2 rad."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At fixed I, doubling angular speed multiplies rotational kinetic energy by…",
      "options": [
        "2.",
        "4.",
        "½."
      ],
      "correct": 1,
      "hint": "Compare the squared angular speeds.",
      "feedback": [
        "Angular momentum doubles; energy quadruples.",
        "Correct. Krot is proportional to ω².",
        "Increasing speed increases energy."
      ],
      "teacher": "Ask students why torque units are written N·m while work uses J."
    }
  },
  "collision": {
    "title": "Collisions of extended bodies",
    "heading": "Choose a pivot before conserving angular momentum.",
    "subtitle": "A support impulse can change linear momentum without torque about the support.",
    "target": "Analyze a sticking collision with a pivoted rod and explain the percussion point.",
    "visual": "rotational-collision",
    "paragraphs": [
      "A projectile striking a rod away from its pivot can set the rod spinning. During a short collision, choose the system to include projectile and rod. An ideal fixed pivot can exert a substantial external impulse, so the system’s linear momentum need not be conserved. However, that impulse has zero moment arm about the pivot and therefore contributes no angular impulse about that point.",
      "If other external angular impulses are negligible, angular momentum about the pivot is conserved. A small mass m striking perpendicular to the rod at distance r with speed v brings angular momentum mvr. If it sticks, the final inertia is Irod + mr² and the common angular speed is ω = mvr/(Irod + mr²). Treating the projectile as a point mass neglects its own size and spin.",
      "The sticking collision is inelastic, so kinetic energy decreases into deformation and other internal changes. Conservation of angular momentum does not imply conservation of kinetic energy. Nor does the pivot doing no work imply zero impulse: a fixed application point can exchange momentum while its displacement is zero.",
      "For a uniform slender rod initially at rest, the ideal percussion point is 2L/3 from an end pivot. A transverse impact there produces no net pivot impulse in the simple model. Actual sports equipment has additional vibration modes, so this point is related to, but not a complete definition of, every comfortable striking region."
    ],
    "terms": [
      [
        "Angular impulse about a pivot",
        "Change in angular momentum caused by external torque over an interval."
      ],
      [
        "Center of percussion",
        "Impact location producing zero instantaneous pivot impulse in an ideal rigid-body model."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 0.20 kg point mass at 3 m/s sticks at r = 1 m on a uniform 1 m, 1.2 kg rod pivoted at one end. Find ω.",
      "reasoning": "Irod = 1.2 × 1²/3 = 0.40 kg·m². Initial L = 0.60 kg·m²/s; final I = 0.60 kg·m², so ω = 1 rad/s. K falls from 0.90 J to 0.30 J."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A fixed frictionless pivot during impact can…",
      "options": [
        "change linear momentum while exerting zero torque about itself.",
        "guarantee conservation of kinetic energy.",
        "never exert an impulse."
      ],
      "correct": 0,
      "hint": "Separate impulse, angular impulse, and work.",
      "feedback": [
        "Correct. Zero moment arm does not mean zero force.",
        "Sticking remains inelastic.",
        "The pivot constrains the motion and can supply impulse."
      ],
      "teacher": "Ask for three separate conservation decisions with reasons."
    }
  },
  "gyro": {
    "title": "Gyroscopic effects",
    "heading": "A torque can turn angular momentum sideways.",
    "subtitle": "Direction changes count even when spin stays nearly steady.",
    "target": "Use the right-hand rule and vector addition to explain precession.",
    "visual": "gyroscope-lab",
    "paragraphs": [
      "Angular momentum is a vector. For rotation about a symmetric principal axis, point your right thumb along the axis when your curled fingers follow the rotation. The resulting L vector can change in magnitude, direction, or both. A torque determines dL/dt, not simply the direction the wheel’s visible rim moves.",
      "Consider a rapidly spinning wheel supported at one end of a horizontal axle. Its weight acts at its center of mass and its support force acts at the end. About the support, gravity produces torque perpendicular to the axle and to the vertical. That torque changes the direction of L, causing the axle to sweep around the vertical: precession.",
      "In the steady, fast-spin approximation, the precession rate is Ω = mgr/L. Here r is the distance from support to center of mass, and L is the large spin angular momentum. A faster-spinning wheel has larger L and precesses more slowly under the same gravitational torque. The approximation omits startup wobble and assumes spin dominates the angular momentum associated with precession.",
      "If the wheel is not spinning rapidly, it can simply fall or undergo complicated nutation instead; the formula should not be extended to L = 0. Earth’s nonspherical shape also permits external gravitational torques that slowly change its spin-axis direction. The common principle is vector angular momentum responding to torque, not a special force that cancels gravity."
    ],
    "terms": [
      [
        "Precession",
        "Slow change in the direction of a rotation axis."
      ],
      [
        "Right-hand rule",
        "Convention assigning an axial vector direction to a rotation or cross product."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A wheel has L = 4 kg·m²/s and a perpendicular torque of magnitude 0.20 N·m. Estimate its steady precession rate.",
      "reasoning": "Ω = τ/L = 0.050 rad/s. Doubling L under the same torque would halve Ω."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "In ideal steady gyroscopic precession, the torque primarily changes the…",
      "options": [
        "direction of angular momentum.",
        "mass of the wheel.",
        "existence of gravity."
      ],
      "correct": 0,
      "hint": "Use dL/dt as a vector relation.",
      "feedback": [
        "Correct. L turns while its magnitude is approximately constant.",
        "Torque does not change the wheel’s mass.",
        "Gravity remains the source of the torque."
      ],
      "teacher": "Have students construct L plus a small perpendicular ΔL."
    }
  }
} satisfies Record<string, LessonContent>
