/** Reviewed activities use existing target slugs and canonical lesson responses. */
export interface SimulationInvestigation {
  slug: string;
  title: string;
  headline: string;
  unitId: string;
  targetId: string;
  target: string;
  scope?: string;
  minutes: number;
  videoId?: string;
  question: string;
  predict: string;
  trials: string[];
  evidence: string[];
  explain: string;
  transfer: string;
  teacherLookFors: string;
}
export const SIMULATION_INVESTIGATIONS: SimulationInvestigation[] = [
  {
    slug: "distance-displacement",
    title: "The route and the result",
    headline: "A longer route.\nThe same arrival.",
    unitId: "unit-1",
    targetId: "u1.vocab-position-distance-displacement",
    target:
      "I can use precise vocabulary (position, distance, displacement) to describe motion, and I can tell the difference between scalar and vector quantities.",
    minutes: 15,
    videoId: "u0V8uJ5KTvo",
    question:
      "Can two journeys have the same displacement but different distances?",
    predict:
      "A rover goes 4 m east, then 4 m west. Predict its total distance and displacement. Explain what each number describes.",
    trials: [
      "Use the controls to travel 4 m east, then return to the origin. Record both readouts.",
      "Reset. Go 3 m east and 4 m north. Record distance, displacement magnitude, Δx, and Δy.",
      "Reset. Travel directly to (3 m, 4 m). Compare this route with your two-leg journey.",
    ],
    evidence: [
      "Trial 1: distance and displacement, with units",
      "Trial 2: distance, |Δr|, Δx and Δy, with units",
      "Trial 3: distance and displacement; compare with Trial 2",
    ],
    explain:
      "Use your two routes to (3, 4) to defend this claim: displacement depends on the endpoints; distance depends on the route. Include the 3–4–5 calculation and name which quantity is a vector.",
    transfer:
      "A rescue robot must return to base after travelling at least 12 m. Design a route and state its distance, Δx and Δy. Can a zero displacement prove that it never moved? Explain.",
    teacherLookFors:
      "Out-and-back: 8 m distance, 0 m displacement. Two-leg: 7 m distance, 5 m displacement magnitude, components (3,4) m. Direct: 5 m for both magnitudes. A vector includes direction; zero displacement does not imply no motion.",
  },
  {
    slug: "constant-velocity",
    title: "Read the motion",
    headline: "Every line\ntells a journey.",
    unitId: "unit-1",
    targetId: "u1.capture-pt-graph",
    target:
      "I can capture a position–time graph with a Vernier motion detector and explain what its slope tells me about velocity.",
    scope:
      "This model practices interpreting slope. A physical Vernier measurement is still needed for the instrument part of this target.",
    minutes: 15,
    videoId: "hj8usnvYrRo",
    question: "What changes in the graph when the motion reverses?",
    predict:
      "Sketch the position–time graph for forward motion, a stop, and backward motion at the same speed. Label the slopes before running.",
    trials: [
      "Set speed to 1 m/s and direction to Forward. Run, pause near 4 s, and record the exact time and position.",
      "Resume with Stopped selected for about 2 s. Record a second point and the velocity.",
      "Switch to Backward and resume for about 4 s. Use the position trace to compare all three segments.",
    ],
    evidence: [
      "Two points from forward motion: time and position, with units",
      "Two points from the stopped segment: time and position, with units",
      "Two points from backward motion and the slope Δx/Δt",
    ],
    explain:
      "Calculate a slope for each segment using your recorded points. Explain why a downward-sloping graph means negative velocity rather than negative speed. What does the height of the graph represent?",
    transfer:
      "An object starts at x = −6 m and moves at +2 m/s for 4 s. Sketch its position–time graph, calculate its final position, and explain why starting on the negative side does not mean moving backward.",
    teacherLookFors:
      "Slopes +1, 0, −1 m/s; position is vertical-axis value, velocity is slope. Transfer ends at +2 m. Simulation evidence supports graph interpretation only, not the physical instrument skill.",
  },
  {
    slug: "uniformly-accelerated-motion",
    title: "Spot the change",
    headline: "Same seconds.\nDifferent distances.",
    unitId: "unit-1",
    targetId: "u1.acceleration-rate-of-change",
    target:
      "I can define acceleration as the rate of change of velocity and calculate it from velocity-time data.",
    minutes: 18,
    question: "How can a pattern of dots reveal acceleration?",
    predict:
      "Predict the velocity–time graph for v₀ = 5 m/s and a = −2 m/s². Does negative acceleration always mean slowing down?",
    trials: [
      "Set initial velocity to 5 m/s and acceleration to +2 m/s². Run and collect at least three readings.",
      "Reset with initial velocity 5 m/s and acceleration −2 m/s². Pause before, near, and after the change in direction.",
      "Compare equal time intervals. Use velocity signs and dot spacing to decide when speed decreases and increases.",
    ],
    evidence: [
      "Positive-acceleration trial: three (time, velocity) pairs",
      "Negative-acceleration trial: three pairs spanning the turn",
      "Calculate Δv/Δt for each trial, including units",
    ],
    explain:
      "Use your negative-acceleration data to identify the instant the car turns and explain why it then speeds up. Distinguish velocity from speed and acceleration from motion direction.",
    transfer:
      "A probe has v₀ = −3 m/s and a = +1 m/s². Predict v at 2 s and 5 s. At which time is it moving in the positive direction? Justify with a graph.",
    teacherLookFors:
      "Velocity is v₀+at; turn at 2.5 s for 5 and −2. After turning, velocity and acceleration are both negative and speed increases. Transfer velocities −1 and +2 m/s.",
  },
  {
    slug: "projectile-motion",
    title: "Two motions, one clock",
    headline: "Sideways motion.\nOne shared fall.",
    unitId: "unit-2",
    targetId: "u2.k3-projectile-independence",
    target:
      "I can decompose projectile motion into independent horizontal and vertical pieces linked only by time.",
    minutes: 20,
    question:
      "Does moving faster sideways keep a projectile in the air longer?",
    predict:
      "Two projectiles leave the same height with the same vertical velocity but different horizontal velocities. Predict which lands first and which travels farther. State your assumptions.",
    trials: [
      "Choose a launch and record initial horizontal and vertical velocity, flight time, and range.",
      "Choose a second speed and angle that keep the vertical component approximately the same while changing the horizontal component. Record the actual components.",
      "Compare flight times and ranges. Explain any difference caused by imperfectly matching the vertical components.",
    ],
    evidence: [
      "Trial 1: launch height, vₓ, vᵧ, flight time and range",
      "Trial 2: the same quantities, with units",
      "Prediction of range using vₓ × flight time; compare with the model",
    ],
    explain:
      "Explain why the two component motions share time without requiring equal velocities. Use your data and identify the assumptions about gravity, air resistance and landing height.",
    transfer:
      "A package leaves a drone horizontally at 6 m/s, 20 m above level ground. Neglect air resistance and use g = 9.8 m/s². Find fall time first, then horizontal range. Explain why using 20/6 for fall time is incorrect.",
    teacherLookFors:
      "Independent components with constant g and no drag; approximately 2.02 s and 12.12 m for transfer. Horizontal velocity does not set vertical fall time.",
  },
  {
    slug: "free-body-diagram",
    title: "Forces tell the next move",
    headline: "Many forces.\nOne net effect.",
    unitId: "unit-1",
    targetId: "u1.net-force-from-fbd",
    target:
      "I can find the net force on an object from its FBD and use it to find acceleration.",
    minutes: 18,
    question: "Can large forces act while acceleration is zero?",
    predict:
      "A 5 kg object has 20 N right and 20 N left, with vertical forces balanced. Predict its acceleration. Can you also determine its velocity?",
    trials: [
      "Build the balanced-force case. Record each force and the net force components.",
      "Change one horizontal force. Record the new net force and acceleration; calculate Fnet/m independently.",
      "Keep that same net force and double the mass. Compare accelerations, checking that other force settings stay fixed.",
    ],
    evidence: [
      "Balanced case: individual forces and ΣFx, ΣFy",
      "Unbalanced case: mass, net force and acceleration, with units",
      "Doubled-mass case: same net force and new acceleration",
    ],
    explain:
      "Draw and label the forces on this one object, then show the vector sum. Explain why net force predicts acceleration but does not specify the current velocity.",
    transfer:
      "A 4 kg cart moves left while the net force is 8 N right. Find its acceleration and describe what happens to its speed initially. State what you cannot determine without more information.",
    teacherLookFors:
      "Balanced means zero acceleration, not necessarily rest. Doubling mass at fixed net force halves acceleration. Transfer: +2 m/s² with right positive; initially slows while moving left.",
  },
  {
    slug: "cart-collisions",
    title: "What survives a collision?",
    headline: "A crash changes\nmore than motion.",
    unitId: "unit-3",
    targetId: "u3.k4-collision-types",
    target:
      "I can distinguish elastic, inelastic, and perfectly inelastic collisions and which conservation laws apply to each.",
    minutes: 20,
    question: "Can momentum stay constant while kinetic energy decreases?",
    predict:
      "Equal-mass carts: A moves right, B is at rest. Predict the outcome if they bounce elastically, then if they stick. Which total quantities stay the same?",
    trials: [
      "Set equal masses, B at rest and e = 1. Record velocities and total momentum and kinetic energy before and after.",
      "Reset with the same masses and velocities but e = 0. Compare the common final velocity with your prediction.",
      "Try e = 0.5. Classify the collision from evidence rather than appearance.",
    ],
    evidence: [
      "Elastic trial: masses, velocities, total p and KE before/after",
      "Sticky trial: the same quantities and predicted common velocity",
      "Intermediate trial: momentum and KE changes, with units",
    ],
    explain:
      "Account for the reduction in kinetic energy without claiming that energy disappears. Explain the system boundary and why negligible external impulse matters to momentum conservation.",
    transfer:
      "A 2 kg cart at +3 m/s sticks to a 1 kg cart at −2 m/s. Calculate the common velocity, total initial/final momentum, and initial/final kinetic energy. Classify the collision.",
    teacherLookFors:
      "Transfer p = 4 kg·m/s; v = 4/3 m/s; initial KE = 11 J; final KE = 8/3 J. Momentum conserved with no external impulse; KE loss becomes other forms of energy.",
  },
  {
    slug: "measurement-precision",
    title: "How certain is that number?",
    headline: "Look closer.\nReport honestly.",
    unitId: "unit-1",
    targetId: "foundations.measurement-precision",
    target:
      "I can report measured and calculated quantities with precision supported by the measurements.",
    minutes: 15,
    videoId: "Z1qFlfqlS_E",
    question: "What does an extra digit claim about a measurement?",
    predict:
      "Two people measure the same length using different scale divisions. Should they report the same number of digits? Explain what their last digit represents.",
    trials: [
      "Choose Read the instrument and Ruler (mm). Record the marked division, your typed reading, and the feedback. Each new problem is a new object; do not compare the lengths as repeat measurements.",
      "Choose Ruler (cm) and solve another problem. Compare the number of justified decimal places, not the two object lengths.",
      "Use the two measured lengths as the sides of a hypothetical rectangle. Calculate its area and decide which precision the inputs support.",
    ],
    evidence: [
      "Instrument/scale division and first reading, with units",
      "Second instrument, scale division and reading; a defensible uncertainty interval",
      "A calculation using the readings, with justified rounding",
    ],
    explain:
      "Distinguish resolution, precision and accuracy using your measurements. Explain why a finely divided scale alone cannot rule out a systematic error.",
    transfer:
      "A length measured as 12.3 cm is multiplied by a width of 4.56 cm. Give a suitably reported area and explain why the calculator display is not the final answer.",
    teacherLookFors:
      "56.1 cm² to three significant figures. Last reported digit and uncertainty are supported by scale/measurement; resolution is not a guarantee of accuracy.",
  },
  {
    slug: "slope-calculator",
    title: "Make the graph speak",
    headline: "A slope is\na physical rate.",
    unitId: "unit-1",
    targetId: "u1.capture-pt-graph",
    target:
      "I can capture a position–time graph with a Vernier motion detector and explain what its slope tells me about velocity.",
    scope:
      "This activity practices graph interpretation and slope. It does not replace collecting a physical motion-detector trace.",
    minutes: 15,
    question: "Why do both axes matter when interpreting slope?",
    predict:
      "On a position–time graph, predict the sign of velocity for a line that rises, a line that falls, and a horizontal line. Explain your reasoning.",
    trials: [
      "Use Kinematics, Points (drag), and Position vs Time. Place points at (1 s, 2 m) and (3 s, 6 m), approximately. Record the actual coordinates shown.",
      "Calculate rise/run, then compare with the tool. Move the points to another pair on the same line x = 2t, such as (2 s, 4 m) and (4 s, 8 m), and repeat.",
      "Reverse the order of both points in your subtraction. Explain why the slope should remain the same.",
    ],
    evidence: [
      "Point pair A: (t₁, x₁), (t₂, x₂) and Δx/Δt",
      "Point pair B on the same line and calculated slope",
      "Both subtractions reversed, with signed differences and units",
    ],
    explain:
      "Explain what the slope means in this physical context and why a visually steeper line on differently scaled axes can be misleading.",
    transfer:
      "A position–time line goes through (2 s, 7 m) and (6 s, −1 m). Calculate velocity and predict position at 8 s if the motion continues. Explain the negative sign.",
    teacherLookFors:
      "Slope −2 m/s and x(8) = −5 m. Subtract coordinates in matching order and retain units. Physical instrument skill remains separate.",
  },
];
export const investigationFor = (slug: string) =>
  SIMULATION_INVESTIGATIONS.find((activity) => activity.slug === slug);
