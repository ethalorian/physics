import type { LessonContent } from './lesson-contract'
export const rotationLessons = {
  "rotation": {
    "title": "Rotation and revolution",
    "heading": "Name the axis before describing the motion.",
    "subtitle": "One object can spin and orbit at the same time.",
    "target": "Distinguish rotation about an internal axis from revolution about an external axis.",
    "visual": "rotation-axes",
    "paragraphs": [
      "A wheel spins about an axle through the wheel: that motion is rotation. A small marker attached to its rim travels around the axle: that point revolves around the axis. The words describe the position of the chosen axis relative to the object you are describing. They do not name different fundamental laws of motion.",
      "Earth rotates about an axis through its poles and revolves around the Sun. Those motions can occur together. A person riding a turning playground platform revolves around the platform axis while the platform itself rotates. To make a description unambiguous, name the object, the axis, and the observer instead of simply saying that something goes around.",
      "An object can also change its orientation while its center follows a larger path. Imagine carrying a marked ball around a table. You could keep its arrow pointing toward one wall, or turn the ball so the arrow always points toward the table center. These choices produce the same path for the ball’s center but different changes in the ball’s orientation relative to the room.",
      "This distinction explains why showing the same face to a central body does not mean zero rotation. In one trip around the center, an inward-facing arrow changes its room-frame direction by a full turn. The Moon’s approximate synchronization is one rotation per revolution relative to distant stars."
    ],
    "terms": [
      [
        "Rotation",
        "Turning about an axis through an object."
      ],
      [
        "Revolution",
        "Motion around an external axis or another body."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A marked ball circles a table once while its arrow always points toward the table center. How much does its orientation change relative to the room?",
      "reasoning": "Its arrow turns through 360°. One revolution of its center accompanies one rotation of its orientation."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A moon always shows the same face to its planet. Relative to distant stars it…",
      "options": [
        "never rotates.",
        "rotates once per revolution.",
        "must rotate twice per revolution."
      ],
      "correct": 1,
      "hint": "Follow a painted arrow through four positions.",
      "feedback": [
        "Its orientation changes as it travels around the planet.",
        "Yes. Its spin and orbital periods match.",
        "Two turns would present different faces during the orbit."
      ],
      "teacher": "Have students draw the same marked object at four orbital positions."
    }
  },
  "torque": {
    "title": "Torque",
    "heading": "A force needs a moment arm.",
    "subtitle": "Where and how you push both matter.",
    "target": "Calculate torque from the perpendicular lever arm and identify its sign.",
    "visual": "torque-lab",
    "paragraphs": [
      "Push a door close to its hinge and then near its handle. The same force has a different turning effect. Torque measures that effect about a specified pivot or axis. For a force in a plane, its magnitude is τ = rF sin θ, where r points from the pivot to the application point and θ is the angle between r and the force.",
      "The perpendicular moment arm d is the shortest distance from the pivot to the force’s line of action. Thus τ = Fd. It is not automatically the length of the handle. Pulling straight along a wrench handle has zero moment arm even if the handle is long. A perpendicular pull uses the full distance and produces the largest torque for fixed force and application point.",
      "Choose counterclockwise as positive and clockwise as negative, then add signed torques about the same axis. A positive torque means a tendency to change angular momentum counterclockwise; it does not guarantee that an already spinning object is currently turning that way. Torque can slow an opposite rotation before reversing it.",
      "Torque is measured in newton meters. Although those units have the same dimensions as joules, torque and energy describe different things. A force through the pivot contributes no torque about that pivot, but it can still contribute to the net force on the object."
    ],
    "terms": [
      [
        "Torque",
        "Turning effect of a force about a specified axis."
      ],
      [
        "Moment arm",
        "Perpendicular distance from an axis to a force’s line of action."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 20 N force acts 0.30 m from a hinge at 30° to the radius. Find its torque magnitude.",
      "reasoning": "τ = 0.30 × 20 × sin 30° = 3.0 N·m. The moment arm is 0.15 m."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "For fixed force and radius, torque is largest when the force is…",
      "options": [
        "parallel to the radius.",
        "perpendicular to the radius.",
        "applied through the pivot."
      ],
      "correct": 1,
      "hint": "Compare perpendicular distances to the force lines.",
      "feedback": [
        "Its line of action then passes through the pivot.",
        "Correct. sin 90° = 1.",
        "That gives zero moment arm."
      ],
      "teacher": "Ask students to draw the force line, not just measure the handle."
    }
  },
  "balance": {
    "title": "Balanced torques",
    "heading": "Balance products, not just weights.",
    "subtitle": "A smaller load can balance a larger load farther from the pivot.",
    "target": "Apply both force and torque balance to a supported lever.",
    "visual": "balance-lab",
    "paragraphs": [
      "A seesaw can remain horizontal with unequal loads. The heavier load must sit closer to the pivot so that its weight times its perpendicular distance matches the opposing product. If the beam is horizontal and the weights act vertically, equilibrium requires Wleft dleft = Wright dright when no other torque contributes.",
      "The distances start at the pivot, not at the end of the beam or at an arbitrary ruler zero. A mass hung at the 10 cm mark on a stick supported at 50 cm has a 40 cm moment arm. A uniform stick supported at its center has no gravitational torque about that support. Moving the support away from its center requires including the stick’s own weight and moment arm.",
      "Torque balance alone is not enough for static equilibrium. The support must also supply a force that balances all the downward weights. Choosing the pivot as the torque origin removes the unknown support force from the torque equation, but it does not make that force disappear from the vertical force equation.",
      "Zero net torque means no change in angular momentum about the chosen fixed axis. An object already rotating can continue rotating when its net torque vanishes. For the resting seesaw, the initial angular velocity is zero and remains zero while both equilibrium conditions hold."
    ],
    "terms": [
      [
        "Rotational equilibrium",
        "A condition of zero net external torque."
      ],
      [
        "Fulcrum",
        "The support or pivot about which a lever can turn."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A weightless beam has 60 N at 0.40 m left of its support. Where should 30 N act on the right?",
      "reasoning": "60 × 0.40 = 30d gives d = 0.80 m. The upward support force is 90 N."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A balanced beam carries unequal downward loads. The larger load is…",
      "options": [
        "always farther from the pivot.",
        "closer to the pivot.",
        "at the same distance."
      ],
      "correct": 1,
      "hint": "Equal torques require equal force–distance products.",
      "feedback": [
        "That would increase its already larger turning effect.",
        "Yes. A smaller distance compensates for the larger weight.",
        "Equal distances require equal loads in this model."
      ],
      "teacher": "Include a second calculation for the support force."
    }
  },
  "center": {
    "title": "Center of mass",
    "heading": "Track the average position of the mass.",
    "subtitle": "A tumbling object can have a simple overall path.",
    "target": "Locate a center of mass and predict its motion from external forces.",
    "visual": "center-mass",
    "paragraphs": [
      "The center of mass is a mass-weighted average of position. Along one axis, xCM = Σmixi / Σmi. A heavier piece contributes more strongly than a lighter piece at the same distance. For two equal masses, the center lies halfway between them; if one mass increases, the center shifts toward it rather than staying at the geometric midpoint.",
      "For a uniform symmetric object, symmetry often locates the center of mass without calculation. For an irregular shape or uneven density, geometry alone is insufficient. The center of mass need not contain material: it can lie in the empty center of a ring. Its location is a property of the whole chosen system, so including another object can move it outside either object.",
      "The total external force controls the acceleration of the center of mass: ΣFexternal = M aCM. A tossed bat can tumble while its center follows the same projectile parabola as a point object launched with the same initial center velocity, when gravity is uniform and air resistance is negligible.",
      "Internal forces can rearrange the pieces but cannot change that center-of-mass trajectory by themselves. After an ideal airborne explosion, the mass-weighted center of all fragments continues along the original projectile path. Track all fragments; choosing only one changes the system and removes that conclusion."
    ],
    "terms": [
      [
        "Center of mass",
        "Mass-weighted average position of a system."
      ],
      [
        "External force",
        "Force exerted on the chosen system by something outside it."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Place 2 kg at x = 0 m and 6 kg at x = 2 m. Where is their center of mass?",
      "reasoning": "xCM = (2 × 0 + 6 × 2)/8 = 1.5 m, closer to the 6 kg mass."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A tossed object explodes with negligible air resistance. The center of mass of all fragments…",
      "options": [
        "stops at the explosion.",
        "continues on the original parabola.",
        "moves along the fastest fragment’s path."
      ],
      "correct": 1,
      "hint": "The internal impulses cancel in the total momentum change.",
      "feedback": [
        "Gravity and the initial center velocity still determine its motion.",
        "Correct. The external force remains the total gravitational force.",
        "Every fragment enters the mass-weighted average."
      ],
      "teacher": "Ask how excluding one fragment changes the system boundary."
    }
  },
  "cg": {
    "title": "Center of gravity",
    "heading": "Replace distributed weight with one equivalent force.",
    "subtitle": "The balance point is a model of gravitational torque.",
    "target": "Distinguish center of gravity from center of mass and locate it by suspension.",
    "visual": "center-mass",
    "paragraphs": [
      "Gravity acts on every small part of an object. In a uniform gravitational field, those parallel forces can be replaced by the total weight acting at the center of mass. The point representing the resultant weight is called the center of gravity. For ordinary classroom objects near Earth, the field varies so little across the object that these two centers coincide to excellent accuracy.",
      "This equivalence has a condition. In a noticeably nonuniform gravitational field, different parts can experience different field strengths or directions. A gravitational torque calculation must then account for that variation. Do not assume that a mass-weighted average is automatically a universal replacement for every extended object in every field.",
      "To locate a flat object’s center of gravity experimentally, suspend it freely from one point and wait for it to settle. Its center lies on the vertical line through the support; otherwise its weight would exert a turning torque. Suspend it from another point and draw a second vertical. The intersection locates the center under the uniform-field approximation.",
      "A ring can balance even though its center lies in empty space. The equivalent force is a way to reproduce the external torque of distributed weight, not a claim that all the matter has moved there. Changing the shape or moving attached loads changes that equivalent location."
    ],
    "terms": [
      [
        "Center of gravity",
        "Point representing the resultant gravitational force in a suitable field model."
      ],
      [
        "Plumb line",
        "A freely hanging line that identifies the local vertical."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A uniform 1 m bar weighs 12 N and is supported at its midpoint. What gravitational torque acts about that point?",
      "reasoning": "Its weight acts through the midpoint, so the moment arm and gravitational torque are zero. An upward 12 N support force balances its weight."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Two suspension lines for a settled object intersect at its…",
      "options": [
        "heaviest visible corner.",
        "center of gravity.",
        "first suspension point."
      ],
      "correct": 1,
      "hint": "Weight must act vertically below each support in settled equilibrium.",
      "feedback": [
        "Distributed weight is not represented by one visibly heavy corner.",
        "Correct. The two vertical lines locate the resultant weight.",
        "The center generally lies below either support."
      ],
      "teacher": "Compare the suspension method with the weighted-average model."
    }
  },
  "topple": {
    "title": "Torque and toppling",
    "heading": "Watch the vertical line through the center.",
    "subtitle": "The support boundary determines which way gravity turns an object.",
    "target": "Predict toppling using the center of gravity and the support base.",
    "visual": "stability-lab",
    "paragraphs": [
      "A resting block is supported by contact forces distributed over its base. As it tilts, the vertical line through its center of gravity moves toward the edge of that base. While the line remains inside, an available support force can balance the weight without an overturning gravitational torque about the outer edge.",
      "At the limiting angle, the weight line passes through that edge. Beyond it, gravity produces a torque that increases the tilt. The block topples if nothing else supports it. For a rectangular block of width b and height h, initially flat on a horizontal surface, the ideal critical tilt about a lower corner satisfies tan θ = b/h. This assumes a rigid block, uniform density, and no slipping.",
      "The support base can span gaps. Four chair feet define an area bounded by their outer contact points; there need not be material under every point in that area. Widening the support base or lowering the center of gravity usually increases resistance to tipping. Added props can change the relevant boundary.",
      "The static rule does not describe every moving balance problem. Catching a falling broom requires moving its support to change the motion. An accelerating vehicle also needs a force analysis that includes the acceleration and tire contacts. Keep the simple tilt test separate from those dynamic situations."
    ],
    "terms": [
      [
        "Support base",
        "Area bounded by the outer supporting contact points."
      ],
      [
        "Overturning torque",
        "Torque that increases a tilt away from supported equilibrium."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A uniform block is 0.40 m wide and 0.80 m tall. At what ideal tilt about its bottom edge does it reach the tipping threshold?",
      "reasoning": "tan θ = 0.40/0.80 = 0.50, giving θ ≈ 26.6°. Sliding must be prevented for this tilt model."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A taller block with the same base width generally tips…",
      "options": [
        "at a smaller tilt.",
        "only at 90°.",
        "at a larger tilt."
      ],
      "correct": 0,
      "hint": "Its center begins farther above the pivot.",
      "feedback": [
        "Correct. The weight line reaches the edge sooner.",
        "The threshold depends on the width-to-height ratio.",
        "A higher center usually reduces the tipping margin."
      ],
      "teacher": "Ask students to mark the edge pivot and gravitational line of action."
    }
  },
  "people": {
    "title": "Balance of people",
    "heading": "Posture moves the combined center.",
    "subtitle": "A body can reshape while its mass stays the same.",
    "target": "Explain how posture, a carried load, and support affect balance.",
    "visual": "center-mass",
    "paragraphs": [
      "A person is not a rigid block. Raising arms, bending knees, or carrying a bag changes the distribution of mass and therefore the position of the combined center of mass. In a nearly uniform gravitational field, that also changes the center of gravity. The important center includes the person and any load being supported together.",
      "When standing quietly, the support area is bounded by the feet and other contacts. Leaning forward shifts the center toward the toes. Moving the hips backward can compensate. A wall behind the hips can prevent that adjustment, which explains why bending forward with heels and back constrained can become difficult without stepping or using a hand for support.",
      "A carried load on one side shifts the combined center toward that side. Leaning the body in the opposite direction can bring the weight line back over the feet. This is a torque and support problem, not evidence that the load somehow loses weight. The ground must still support the combined weight in static equilibrium.",
      "During a jump, the athlete can change body shape around a center whose trajectory is largely set at takeoff. Arching over a bar lets different body parts clear it at different times while the center can pass lower than a rigid upright body would require. Changing shape in flight does not independently raise the center’s projectile trajectory."
    ],
    "terms": [
      [
        "Combined center of mass",
        "Weighted average position including a person and carried objects."
      ],
      [
        "Posture",
        "Arrangement of body parts that changes mass distribution and lever arms."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 60 kg person’s center is at x = 0. A 10 kg bag is held at x = 0.35 m. Find the combined center before the person adjusts posture.",
      "reasoning": "xCM = (60 × 0 + 10 × 0.35)/70 = 0.050 m toward the bag."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A jumper arches in midair. With negligible air resistance, this primarily changes…",
      "options": [
        "the center-of-mass trajectory.",
        "body-part positions around the center.",
        "the gravitational acceleration."
      ],
      "correct": 1,
      "hint": "Internal forces can rearrange the body but do not add external impulse.",
      "feedback": [
        "The center trajectory is set by external forces and takeoff conditions.",
        "Correct. Shape and center motion are different descriptions.",
        "Ordinary posture changes do not change the local field."
      ],
      "teacher": "Connect a high-jump sketch to the all-fragment projectile argument."
    }
  },
  "stability": {
    "title": "Stability",
    "heading": "Disturb the balance a little.",
    "subtitle": "Equilibrium describes now; stability describes the response.",
    "target": "Classify equilibrium using restoring torque and potential energy.",
    "visual": "stability-lab",
    "paragraphs": [
      "An object can have zero net force and zero net torque at one instant yet be difficult to keep balanced. Stability asks what happens after a small displacement. In stable equilibrium, the resulting forces or torques tend to restore the original configuration. In unstable equilibrium, they carry the object farther away. In neutral equilibrium, nearby positions remain in equilibrium.",
      "Gravitational potential energy gives another test. If a small displacement raises the center of gravity, energy increases and gravity tends to return the object toward the lower position. If the displacement lowers the center, gravity helps it move away. If center height stays unchanged, gravity provides no preference among the nearby positions in the ideal model.",
      "A pendulum hanging below its support is stable; balancing it above the support is unstable. A sphere on a perfectly level plane is neutral with respect to horizontal displacement. A book resting on its broad face is harder to topple than the same book on a narrow edge because a larger energy increase is needed to lift its center over the support edge.",
      "Stable does not mean impossible to overturn. A sufficiently large disturbance can carry a system beyond its restoring region. Nor does stable guarantee that oscillations die away: damping is needed to dissipate energy and settle at rest. A frictionless pendulum continues oscillating about its stable equilibrium."
    ],
    "terms": [
      [
        "Stable equilibrium",
        "Nearby disturbances produce a restoring tendency."
      ],
      [
        "Unstable equilibrium",
        "Nearby disturbances produce a tendency to depart farther."
      ],
      [
        "Neutral equilibrium",
        "Nearby configurations have no restoring or departing tendency."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "An ideal pendulum is displaced slightly from its lowest position and released. What does gravity do?",
      "reasoning": "Its center rises during the displacement, so gravity produces a restoring torque. Without damping it oscillates rather than immediately settling."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A small displacement lowers an object’s center of gravity. Its original equilibrium is…",
      "options": [
        "stable.",
        "unstable.",
        "necessarily neutral."
      ],
      "correct": 1,
      "hint": "Gravity favors decreasing potential energy.",
      "feedback": [
        "A stable gravitational equilibrium resists displacement by raising the center.",
        "Correct. Gravity encourages departure from the original position.",
        "Neutral equilibrium has unchanged potential energy nearby."
      ],
      "teacher": "Ask for both a torque explanation and an energy explanation."
    }
  },
  "statics": {
    "title": "Conditions and strategy for statics",
    "heading": "Solve translation and rotation together.",
    "subtitle": "A good pivot simplifies the algebra without removing forces.",
    "target": "Use force components and a torque equation to determine supports.",
    "visual": "beam-supports",
    "paragraphs": [
      "For a rigid object at rest in static equilibrium, the net external force and the net external torque are both zero. In a plane, write ΣFx = 0, ΣFy = 0, and Στ = 0. Zero force alone is insufficient: two equal opposite forces at different lines of action can form a couple that turns the object without accelerating its center of mass.",
      "Begin by isolating one object or a clearly defined combination. Draw every external contact and gravitational force. Replace a uniform beam’s distributed weight by its weight at the midpoint when the gravitational field is uniform. Mark actual application points and perpendicular distances before selecting equations.",
      "Choose a torque origin through an unknown force when that removes an inconvenient term. Then use the remaining force equations to find that force. A different origin must give the same final result if all forces and distances are included. Support reactions can be unexpectedly large, particularly when a long load is held using two hands close together.",
      "Finally check the physical meaning of signs. A calculated downward force at a simple floor contact cannot be supplied by that contact alone; a clamp or tie-down would be needed. A rope can pull but cannot push. Equilibrium algebra only describes a realizable setup when the required interactions actually exist."
    ],
    "terms": [
      [
        "Static equilibrium",
        "Rest with zero net external force and torque."
      ],
      [
        "Couple",
        "Equal opposite forces with separated lines of action and nonzero net torque."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 4 m uniform beam weighs 100 N and has supports at both ends. A 200 N load rests 1 m from the left end. Find the reactions.",
      "reasoning": "About the left support: 4Rright − 100 × 2 − 200 × 1 = 0, so Rright = 100 N. Vertical balance gives Rleft = 200 N."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Choosing a pivot through an unknown support means its force…",
      "options": [
        "has zero torque about that point.",
        "vanishes from all equations.",
        "must equal zero."
      ],
      "correct": 0,
      "hint": "Torque and force are different quantities.",
      "feedback": [
        "Correct. Its moment arm is zero, but its force remains in ΣF.",
        "It still enters force balance.",
        "The support can exert a large force through the pivot."
      ],
      "teacher": "Solve the same beam from the other support as a consistency check."
    }
  },
  "muscles": {
    "title": "Muscles and joints",
    "heading": "A short muscle lever arm demands a large force.",
    "subtitle": "Force advantage and movement advantage trade places.",
    "target": "Estimate muscle and joint forces using an explicit lever model.",
    "visual": "muscle-lever",
    "paragraphs": [
      "A forearm holding a load can be modeled as a lever with the elbow as its pivot. The biceps pulls at a short distance from the elbow, while the hand load acts much farther away. Torque balance can therefore require a muscle force much larger than the load’s weight. The forearm’s own weight also contributes and acts near its center of gravity.",
      "For vertical forces on a horizontal forearm, muscle force Fm at distance d balances Wload at L and Warm at its center distance c: Fm d = Wload L + Warm c. If the muscle is angled, use its perpendicular moment arm instead. The elbow reaction follows from vertical force balance and may point downward even though the external load also points downward.",
      "The short muscle moment arm is not simply poor design. A small muscle shortening can produce a larger displacement and speed at the hand. That trades force for motion. Real anatomy includes multiple muscles, three-dimensional joints, tendons, changing angles, and active control, so a one-lever model isolates a relationship rather than predicting an individual’s capability.",
      "The same reasoning explains why holding a load farther from the body can greatly increase required torques and internal forces. State the geometry and load before making a comparison. These idealized calculations are physics examples, not personalized medical advice or safe lifting limits."
    ],
    "terms": [
      [
        "Muscle moment arm",
        "Perpendicular distance from a joint axis to the muscle force line."
      ],
      [
        "Joint reaction",
        "Contact force transmitted at a joint in the chosen model."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A horizontal forearm supports 40 N at 0.30 m and its own 20 N at 0.15 m. A vertical muscle force acts at 0.05 m. Find muscle force.",
      "reasoning": "Fm = (40 × 0.30 + 20 × 0.15)/0.05 = 300 N. Vertical balance requires a 240 N downward elbow reaction."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Moving the same hand load farther from the elbow, with muscle moment arm fixed, requires…",
      "options": [
        "less muscle force.",
        "more muscle force.",
        "no change in muscle force."
      ],
      "correct": 1,
      "hint": "The load torque is its weight times its moment arm.",
      "feedback": [
        "The load torque increases, not decreases.",
        "Correct. The muscle must supply a larger balancing torque.",
        "Fixed load weight does not imply fixed torque."
      ],
      "teacher": "Ask students to include the joint reaction after solving the torque balance."
    }
  }
} satisfies Record<string, LessonContent>
