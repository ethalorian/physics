// Canonical simulation catalog — the single source for the gallery DB rows.
//
// The gallery (/api/simulations) reads these from the `simulations` table; this
// module is what seeds/repairs that table (see api/admin/seed-missing-simulations)
// and is mirrored by the SQL migrations. Keep slugs in sync with SIM_COMPONENTS
// (src/components/simulations/registry.ts) and the per-sim def.ts.
//
// Conventions: unit is an id (`unit-1`..`unit-7`); topic groups cards within a
// unit; sort_order orders them; tags follow the lowercase-hyphenated style.

export interface SimulationCatalogEntry {
  title: string
  slug: string
  description: string
  category: string
  unit: string
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  sort_order: number
  component_path: string
  estimated_time: number
  objectives: string[]
  key_concepts: string[]
  tags: string[]
  can_embed: boolean
  has_ai_guide: boolean
  published: boolean
}

export const SIMULATION_CATALOG: SimulationCatalogEntry[] = [
  {
    "title": "Measurement, Precision & Accuracy",
    "slug": "measurement-precision",
    "description": "Learn to measure with proper precision and understand the difference between accuracy and precision. Practice reading measurements from various instruments.",
    "category": "lab-skills",
    "unit": "unit-1",
    "topic": "Lab skills",
    "difficulty": "beginner",
    "sort_order": 10,
    "component_path": "/simulations/measurement-precision",
    "estimated_time": 20,
    "objectives": [
      "Measure to the precision of a measuring device",
      "Understand accuracy vs precision",
      "Identify systematic and random errors"
    ],
    "key_concepts": [
      "precision",
      "accuracy",
      "measurement",
      "error analysis"
    ],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Race Track: Distance vs. Displacement",
    "slug": "race-track",
    "description": "Watch a race car go around a circular track and explore the fundamental difference between distance (scalar) and displacement (vector). Learn how \"How Far,\" \"How Fast,\" and \"How Long\" differ when dealing with scalars vs. vectors, and understand the critical \"Which Way\" component that makes vectors different.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "1D motion",
    "difficulty": "beginner",
    "sort_order": 20,
    "component_path": "/simulations/race-track",
    "estimated_time": 20,
    "objectives": [
      "Understand the difference between distance and displacement",
      "Recognize that distance is always increasing (scalar) while displacement can increase or decrease (vector)",
      "Learn that speed has no direction while velocity includes direction",
      "Calculate distance traveled around a circular path",
      "Measure displacement as straight-line distance from starting point",
      "Understand that after one complete lap, displacement returns to zero while distance equals the circumference",
      "Recognize the \"Which Way\" component that makes something a vector"
    ],
    "key_concepts": [
      "distance",
      "displacement",
      "speed",
      "velocity",
      "scalar",
      "vector",
      "kinematics",
      "circular motion",
      "position",
      "magnitude",
      "direction"
    ],
    "tags": [
      "kinematics",
      "vectors",
      "scalars",
      "circular-motion",
      "1d-motion",
      "distance-displacement",
      "speed-velocity"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Distance vs. Displacement",
    "slug": "distance-displacement",
    "description": "Walk a path and compare total distance traveled with net displacement. See why direction matters.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "1D motion",
    "difficulty": "beginner",
    "sort_order": 21,
    "component_path": "/simulations/distance-displacement",
    "estimated_time": 15,
    "objectives": [],
    "key_concepts": [],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Constant Velocity Motion Lab",
    "slug": "constant-velocity",
    "description": "Control a walker's motion and collect position data. Observe constant velocity in 1D motion and analyze position-time graphs to find velocity from slope.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "1D motion",
    "difficulty": "beginner",
    "sort_order": 22,
    "component_path": "/simulations/constant-velocity",
    "estimated_time": 15,
    "objectives": [
      "Understand constant velocity motion",
      "Collect and analyze position-time data",
      "Calculate velocity from graph slope"
    ],
    "key_concepts": [
      "velocity",
      "kinematics",
      "graphs",
      "data collection"
    ],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Car Race: Relative Motion & Kinematics",
    "slug": "car-race",
    "description": "Analyze relative motion between two cars traveling at constant velocities with different start times. Use kinematics equations to predict when and where one car overtakes the other. Learn to interpret position-time graphs, understand relative velocity, apply reference frames, and solve multi-object motion problems. See how mathematical tools (systems of equations) help solve physics problems!",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "1D motion",
    "difficulty": "intermediate",
    "sort_order": 23,
    "component_path": "/simulations/car-race",
    "estimated_time": 25,
    "objectives": [
      "Set up position equations for objects with constant velocity",
      "Create a system of two linear equations from a word problem",
      "Solve systems of equations algebraically to find intersection",
      "Interpret intersection point as the time and place where cars meet",
      "Graph position vs. time for multiple objects on same axes",
      "Identify intersection point visually on a graph",
      "Understand that intersection = solution to system of equations",
      "Apply systems of equations to relative motion problems",
      "Verify algebraic solutions using graphical methods",
      "Predict race outcomes using mathematical models"
    ],
    "key_concepts": [
      "systems of equations",
      "linear equations",
      "intersection point",
      "relative motion",
      "position-time graphs",
      "constant velocity",
      "kinematics",
      "algebraic solution",
      "graphical solution",
      "mathematical modeling",
      "word problems",
      "simultaneous equations"
    ],
    "tags": [
      "kinematics",
      "algebra",
      "systems-of-equations",
      "graphing",
      "linear-equations",
      "relative-motion",
      "intersections",
      "word-problems"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Slope Calculator",
    "slug": "slope-calculator",
    "description": "Find velocity from the slope of a position-time graph. Drag points and read rise over run.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion graphs",
    "difficulty": "beginner",
    "sort_order": 30,
    "component_path": "/simulations/slope-calculator",
    "estimated_time": 15,
    "objectives": [],
    "key_concepts": [],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Area Under the Curve",
    "slug": "area-under-curve",
    "description": "Discover how the area under a velocity-time graph gives displacement. Build the curve and read the accumulated area.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion graphs",
    "difficulty": "intermediate",
    "sort_order": 31,
    "component_path": "/simulations/area-under-curve",
    "estimated_time": 20,
    "objectives": [],
    "key_concepts": [],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Uniformly Accelerated Motion",
    "slug": "uniformly-accelerated-motion",
    "description": "Watch a car drop oil spots every second to visualize constant acceleration. Explore all four kinematic equations and see how spacing patterns reveal acceleration.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Acceleration & free fall",
    "difficulty": "intermediate",
    "sort_order": 40,
    "component_path": "/simulations/uniformly-accelerated-motion",
    "estimated_time": 25,
    "objectives": [
      "Visualize constant acceleration",
      "Understand all four kinematic equations",
      "Connect math to physical motion patterns"
    ],
    "key_concepts": [
      "acceleration",
      "kinematics",
      "velocity",
      "displacement"
    ],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Freefall Cliff Lab",
    "slug": "freefall-cliff",
    "description": "Help a traveler measure cliff height by dropping a stone! Watch position traces every 0.25 seconds and use the freefall equation h = ½gt² to calculate the height.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Acceleration & free fall",
    "difficulty": "intermediate",
    "sort_order": 41,
    "component_path": "/simulations/freefall-cliff",
    "estimated_time": 20,
    "objectives": [
      "Apply freefall equations to real problems",
      "Use experimental data to calculate height",
      "Understand acceleration due to gravity"
    ],
    "key_concepts": [
      "freefall",
      "kinematics",
      "gravity",
      "experimental methods"
    ],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Vacuum Chamber: Feather vs. Bowling Ball",
    "slug": "vacuum-chamber",
    "description": "Drop a feather and bowling ball side-by-side in a vacuum chamber with adjustable air pressure. Discover that without air resistance, all objects fall at the same rate regardless of mass! Observe how air resistance affects light objects much more than heavy objects, and explore the concept of terminal velocity. This is the famous experiment demonstrated by Apollo 15 astronauts on the Moon!",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Acceleration & free fall",
    "difficulty": "beginner",
    "sort_order": 42,
    "component_path": "/simulations/vacuum-chamber",
    "estimated_time": 15,
    "objectives": [
      "Understand that all objects fall at the same rate in a vacuum",
      "Recognize that gravity pulls on all objects equally (a = g = 9.8 m/s²)",
      "Observe how air resistance affects objects differently",
      "Understand that air resistance depends on speed, area, and shape",
      "Explain why feathers fall slowly on Earth but quickly on the Moon",
      "Recognize the concept of terminal velocity",
      "Compare kinematics with and without air resistance",
      "Understand that mass does not affect falling rate in vacuum"
    ],
    "key_concepts": [
      "gravity",
      "air resistance",
      "drag force",
      "terminal velocity",
      "free fall",
      "acceleration due to gravity",
      "g = 9.8 m/s²",
      "vacuum",
      "mass independence",
      "kinematics",
      "Galileo",
      "Apollo 15 experiment"
    ],
    "tags": [
      "forces",
      "gravity",
      "air-resistance",
      "drag",
      "terminal-velocity",
      "free-fall",
      "galileo",
      "moon",
      "vacuum"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Maze Navigator: Vector Addition",
    "slug": "maze-vectors",
    "description": "Guide a mouse through a maze to find cheese while learning how position vectors are composed of x and y components. Visualize vector addition in real-time as component vectors combine to form resultant vectors using the Pythagorean theorem.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Vectors & 2D motion",
    "difficulty": "beginner",
    "sort_order": 50,
    "component_path": "/simulations/maze-vectors",
    "estimated_time": 15,
    "objectives": [
      "Understand that position vectors have x and y components",
      "Recognize that vectors can be broken down into perpendicular components",
      "Learn how to add vectors by adding their components",
      "Apply the Pythagorean theorem to find vector magnitude",
      "Visualize vector addition geometrically",
      "Calculate resultant vectors from component vectors",
      "Understand the relationship between components and magnitude"
    ],
    "key_concepts": [
      "vectors",
      "vector addition",
      "vector components",
      "position vectors",
      "x-component",
      "y-component",
      "resultant vector",
      "magnitude",
      "Pythagorean theorem",
      "kinematics",
      "coordinate system"
    ],
    "tags": [
      "vectors",
      "vector-addition",
      "components",
      "kinematics",
      "position",
      "pythagorean-theorem",
      "coordinate-geometry"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Riverboat Crossing: Vector Addition",
    "slug": "riverboat-crossing",
    "description": "Navigate a boat across a river with flowing current and discover how velocities add as vectors! See three velocity vectors simultaneously: boat velocity (relative to water), current velocity (water flow), and resultant velocity (actual path over ground). Learn to calculate drift distance, find the angle needed to go straight across, and understand relative motion. Perfect for teaching vector addition, components, and real-world applications of 2D motion!",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Vectors & 2D motion",
    "difficulty": "intermediate",
    "sort_order": 51,
    "component_path": "/simulations/riverboat-crossing",
    "estimated_time": 20,
    "objectives": [
      "Understand that velocities add as vectors",
      "Recognize boat velocity is relative to the water, not ground",
      "Calculate resultant velocity from vector addition",
      "Predict drift distance caused by current",
      "Determine the angle needed to travel straight across",
      "Apply Pythagorean theorem to find resultant velocity magnitude",
      "Understand relative motion between boat, water, and ground",
      "Solve real-world navigation problems using vector addition",
      "Interpret velocity vectors visually and mathematically"
    ],
    "key_concepts": [
      "vector addition",
      "relative velocity",
      "resultant vector",
      "velocity components",
      "drift",
      "navigation",
      "reference frames",
      "ground velocity vs water velocity",
      "current",
      "vector sum",
      "Pythagorean theorem",
      "2D motion"
    ],
    "tags": [
      "kinematics",
      "vectors",
      "vector-addition",
      "relative-velocity",
      "navigation",
      "river-crossing",
      "2d-motion"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Projectile Motion Lab",
    "slug": "projectile-motion",
    "description": "Launch projectiles and analyze 2D motion under gravity. Drag the targets, then dial in angle and speed to hit them. Explore range, height, and trajectory.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Vectors & 2D motion",
    "difficulty": "intermediate",
    "sort_order": 53,
    "component_path": "/simulations/projectile-motion",
    "estimated_time": 20,
    "objectives": [],
    "key_concepts": [],
    "tags": [],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Monkey Hunter: Projectile Motion",
    "slug": "monkey-hunter",
    "description": "The classic physics demonstration! A monkey hangs from a tree branch. You aim a dart gun directly at it and fire. At that exact moment, the monkey drops (lets go of the branch). Will the dart hit the monkey? Discover why aiming directly at the target works even when it falls! Learn about projectile motion, independence of x and y components, and how gravity affects all objects equally. Perfect for understanding 2D kinematics and the counterintuitive results of simultaneous motion.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Vectors & 2D motion",
    "difficulty": "intermediate",
    "sort_order": 54,
    "component_path": "/simulations/monkey-hunter",
    "estimated_time": 20,
    "objectives": [
      "Understand that horizontal and vertical motion are independent",
      "Recognize that gravity affects all objects equally (dart and monkey)",
      "Apply projectile motion equations to predict trajectory",
      "Understand why aiming directly at a dropping target still hits it",
      "Analyze motion in two dimensions (x and y components)",
      "Calculate time of flight from horizontal motion",
      "Predict where projectile and falling object meet",
      "Understand that both objects fall ½gt² regardless of horizontal motion",
      "Recognize the principle behind \"aim at the target\" strategy"
    ],
    "key_concepts": [
      "projectile motion",
      "2D kinematics",
      "independence of motion",
      "horizontal and vertical components",
      "gravity",
      "free fall",
      "simultaneous equations",
      "trajectory",
      "parabolic path",
      "aim and drop",
      "monkey hunter problem"
    ],
    "tags": [
      "kinematics",
      "projectile-motion",
      "2d-motion",
      "gravity",
      "free-fall",
      "trajectory",
      "monkey-hunter"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Free Body Diagram Lab",
    "slug": "free-body-diagram",
    "description": "Interactive free body diagram simulation where students can experiment with force vectors and see how they affect acceleration. Drag and drop force vectors to explore Newton's Second Law (F = ma) with real-time calculations showing the relationship between force, mass, and acceleration.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces & Newton's laws",
    "difficulty": "intermediate",
    "sort_order": 60,
    "component_path": "/simulations/free-body-diagram",
    "estimated_time": 25,
    "objectives": [
      "Understand Newton's Second Law (F = ma)",
      "Practice vector addition and decomposition",
      "Visualize how multiple forces affect an object",
      "Explore equilibrium conditions",
      "See the relationship between force, mass, and acceleration"
    ],
    "key_concepts": [
      "force",
      "mass",
      "acceleration",
      "vectors",
      "Newton's Second Law",
      "free body diagram",
      "equilibrium",
      "net force"
    ],
    "tags": [
      "interactive",
      "drag-and-drop",
      "vectors",
      "forces",
      "Newton"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Sumo Wrestling Forces",
    "slug": "sumo-forces",
    "description": "Experience Newton's Second Law through an exciting sumo wrestling simulation! Control the force and mass of two wrestlers to see how unbalanced forces lead to motion. Watch real-time kinematics tracking as wrestlers battle for victory. When forces are balanced, neither wrestler moves; when unbalanced, the battle begins!",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces & Newton's laws",
    "difficulty": "beginner",
    "sort_order": 61,
    "component_path": "/simulations/sumo-forces",
    "estimated_time": 15,
    "objectives": [
      "Understand how unbalanced forces cause acceleration",
      "See the relationship between force, mass, and acceleration (F=ma)",
      "Track kinematics: position, velocity, and acceleration over time",
      "Explore how mass affects the outcome when forces are applied",
      "Visualize equilibrium when forces are balanced"
    ],
    "key_concepts": [
      "force",
      "mass",
      "acceleration",
      "Newton's Second Law",
      "balanced forces",
      "unbalanced forces",
      "net force",
      "kinematics",
      "position",
      "velocity"
    ],
    "tags": [
      "interactive",
      "game-based",
      "kinematics",
      "forces",
      "Newton",
      "competition"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Carts & Springs: Newton's Third Law",
    "slug": "carts-third-law",
    "description": "Watch two carts push apart when a compressed spring is released between them. Observe Newton's Third Law (action-reaction pairs), see how equal forces cause different accelerations for different masses, and verify conservation of momentum. The classic physics demonstration that proves forces come in pairs!",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces & Newton's laws",
    "difficulty": "intermediate",
    "sort_order": 62,
    "component_path": "/simulations/carts-third-law",
    "estimated_time": 20,
    "objectives": [
      "Understand Newton's Third Law (action-reaction pairs)",
      "Recognize that forces always come in pairs",
      "Observe that action and reaction forces are equal in magnitude and opposite in direction",
      "Understand that same force on different masses produces different accelerations",
      "Apply F = ma to predict motion of each cart",
      "Verify conservation of momentum (total momentum = 0)",
      "Calculate velocities using momentum conservation",
      "Analyze kinematics data for both objects simultaneously"
    ],
    "key_concepts": [
      "Newton's Third Law",
      "action-reaction pairs",
      "equal and opposite forces",
      "momentum",
      "conservation of momentum",
      "F = ma with different masses",
      "kinematics",
      "internal forces",
      "isolated system",
      "center of mass"
    ],
    "tags": [
      "forces",
      "newtons-laws",
      "third-law",
      "action-reaction",
      "momentum",
      "conservation-laws",
      "carts",
      "collisions"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Astronaut Thrust: Newton's Laws in Space",
    "slug": "astronaut-thrust",
    "description": "Apply thrust vectors to an astronaut floating in space and observe Newton's First and Second Laws in action. Explore mechanical equilibrium, vector forces, and how acceleration relates to force. Collect kinematics data including position, velocity, and acceleration over time in a frictionless environment.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces & Newton's laws",
    "difficulty": "intermediate",
    "sort_order": 63,
    "component_path": "/simulations/astronaut-thrust",
    "estimated_time": 20,
    "objectives": [
      "Understand Newton's First Law (inertia and equilibrium)",
      "Apply Newton's Second Law (F = ma) with vector forces",
      "Recognize mechanical equilibrium (F_net = 0)",
      "Observe that constant force produces constant acceleration",
      "Analyze velocity changes under applied forces",
      "Understand vector nature of forces and accelerations",
      "Collect and analyze kinematics data (position, velocity, acceleration)",
      "Recognize that in space, no friction means forces cause permanent changes"
    ],
    "key_concepts": [
      "Newton's First Law",
      "Newton's Second Law",
      "mechanical equilibrium",
      "net force",
      "acceleration",
      "velocity",
      "inertia",
      "vector forces",
      "kinematics",
      "F = ma",
      "thrust",
      "frictionless motion",
      "constant acceleration"
    ],
    "tags": [
      "forces",
      "newtons-laws",
      "acceleration",
      "vectors",
      "kinematics",
      "equilibrium",
      "space-physics",
      "F=ma"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Atwood Machine: Forces & Equilibrium",
    "slug": "atwood-machine",
    "description": "Study the classic Atwood machine - two masses connected by a rope over a frictionless pulley. Explore static equilibrium (equal masses at rest), dynamic equilibrium (equal masses moving), and accelerated motion (unequal masses). Calculate system acceleration using Newton's Second Law, predict time to fall a fixed distance, and understand tension forces. Beautiful, smooth animation with realistic rope physics and force vectors. Perfect for teaching balanced/unbalanced forces, tension, and applying F=ma to connected objects!",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces & Newton's laws",
    "difficulty": "intermediate",
    "sort_order": 64,
    "component_path": "/simulations/atwood-machine",
    "estimated_time": 20,
    "objectives": [
      "Understand static equilibrium (F_net = 0, v = 0)",
      "Understand dynamic equilibrium (F_net = 0, v = constant)",
      "Calculate acceleration for connected masses using a = g(m1-m2)/(m1+m2)",
      "Apply Newton's Second Law to systems of objects",
      "Calculate rope tension in pulley systems",
      "Predict time to fall a given distance using kinematics",
      "Recognize that tension is same throughout massless rope",
      "Understand that heavier side accelerates down, lighter up",
      "Verify predictions using experimental data"
    ],
    "key_concepts": [
      "Atwood machine",
      "equilibrium",
      "static equilibrium",
      "dynamic equilibrium",
      "tension force",
      "connected objects",
      "pulley system",
      "Newton's Second Law",
      "F = ma",
      "net force",
      "acceleration",
      "kinematics",
      "free body diagrams"
    ],
    "tags": [
      "forces",
      "equilibrium",
      "tension",
      "pulleys",
      "newtons-laws",
      "F=ma",
      "connected-objects",
      "atwood-machine"
    ],
    "can_embed": true,
    "has_ai_guide": true,
    "published": true
  },
  {
    "title": "Picket-Fence g — Measuring Free-Fall Acceleration",
    "slug": "picket-fence-g",
    "description": "Drop a banded strip through a photogate and read free-fall acceleration off the slope of its velocity-time points - the same g for any mass.",
    "category": "kinematics",
    "unit": "unit-2",
    "topic": "Gravity & free fall",
    "difficulty": "intermediate",
    "sort_order": 10,
    "component_path": "/simulations/picket-fence-g",
    "estimated_time": 20,
    "objectives": [
      "Measure g from photogate timing",
      "The slope of a velocity-time graph is g",
      "g is independent of mass"
    ],
    "key_concepts": [
      "Free fall",
      "Photogate timing",
      "Velocity from spacing over time",
      "Mass independence"
    ],
    "tags": [
      "free-fall",
      "gravity",
      "acceleration",
      "photogate",
      "velocity-time",
      "slope",
      "mass-independence",
      "vernier",
      "asteroid"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Cart Collisions — Conservation of Momentum",
    "slug": "cart-collisions",
    "description": "Two carts collide. Slide from elastic to inelastic and watch total momentum stay conserved while kinetic energy does not.",
    "category": "momentum",
    "unit": "unit-3",
    "topic": "Momentum & collisions",
    "difficulty": "intermediate",
    "sort_order": 10,
    "component_path": "/simulations/cart-collisions",
    "estimated_time": 20,
    "objectives": [
      "Predict 1D collisions with momentum conservation",
      "Distinguish elastic from inelastic collisions",
      "Momentum and energy are independent conservation laws"
    ],
    "key_concepts": [
      "Momentum conservation",
      "Elastic vs inelastic",
      "Coefficient of restitution"
    ],
    "tags": [
      "momentum",
      "conservation-of-momentum",
      "collisions",
      "elastic",
      "inelastic",
      "coefficient-of-restitution",
      "kinetic-energy",
      "carts",
      "vernier",
      "asteroid"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Impulse & Momentum — Area Under the Force Curve",
    "slug": "impulse-momentum",
    "description": "A cart hits a force sensor. The area under the force-time pulse is the impulse and the change in momentum; soften the bumper to drop the peak force.",
    "category": "momentum",
    "unit": "unit-3",
    "topic": "Impulse",
    "difficulty": "intermediate",
    "sort_order": 20,
    "component_path": "/simulations/impulse-momentum",
    "estimated_time": 20,
    "objectives": [
      "Calculate impulse as the area under a force-time graph",
      "Apply the impulse-momentum theorem",
      "A longer contact time lowers the peak force"
    ],
    "key_concepts": [
      "Impulse",
      "Momentum change",
      "Contact time vs peak force"
    ],
    "tags": [
      "impulse",
      "momentum",
      "impulse-momentum-theorem",
      "force-time-graph",
      "area-under-curve",
      "contact-time",
      "peak-force",
      "airbag",
      "force-sensor",
      "vernier",
      "asteroid"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Kinetic Impactor — Deflecting the Asteroid",
    "slug": "dart-deflection",
    "description": "Fire a DART-style impactor at the asteroid. Momentum transfer gives a tiny velocity change that grows into a miss distance over years of lead time.",
    "category": "momentum",
    "unit": "unit-3",
    "topic": "Asteroid deflection",
    "difficulty": "advanced",
    "sort_order": 30,
    "component_path": "/simulations/dart-deflection",
    "estimated_time": 25,
    "objectives": [
      "Apply momentum conservation to a kinetic impactor",
      "The asteroid velocity change depends on impactor momentum",
      "Lead time is the dominant lever in deflection"
    ],
    "key_concepts": [
      "Momentum transfer",
      "Deflection velocity",
      "Lead time"
    ],
    "tags": [
      "momentum",
      "conservation-of-momentum",
      "impulse",
      "asteroid",
      "asteroid-deflection",
      "planetary-defense",
      "kinetic-impactor",
      "dart-mission",
      "delta-v",
      "lead-time",
      "space-physics"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Reading 2026-XJ’s Trajectory",
    "slug": "asteroid-trajectory",
    "description": "Each week NASA reports a new distance to the asteroid. The distance-time data falls on a line - read the slope for the closing speed and extrapolate to zero to predict the impact day. More measurement scatter, shakier prediction. (Returns as the Unit 1 transfer task.)",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion graphs",
    "difficulty": "intermediate",
    "sort_order": 32,
    "component_path": "/simulations/asteroid-trajectory",
    "estimated_time": 20,
    "objectives": [
      "Read velocity as the slope of a distance-time graph",
      "Extrapolate a linear trend to predict a future position and arrival time",
      "Explain why measurement scatter creates uncertainty in a prediction"
    ],
    "key_concepts": [
      "Position-time graphs",
      "Slope = velocity",
      "Linear extrapolation",
      "Constant velocity",
      "Measurement uncertainty"
    ],
    "tags": [
      "position-time-graph",
      "slope",
      "velocity",
      "extrapolation",
      "prediction",
      "constant-velocity",
      "measurement-uncertainty",
      "asteroid",
      "planetary-defense",
      "nasa"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Closing Speed — How Fast Is It Really Coming?",
    "slug": "closing-speed",
    "description": "The asteroid has its own speed through space, but Earth is racing along its orbit too. Subtract the velocity vectors to find the asteroid velocity relative to Earth - the closing/impact speed, usually bigger than either speed alone.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Vectors & 2D motion",
    "difficulty": "intermediate",
    "sort_order": 52,
    "component_path": "/simulations/closing-speed",
    "estimated_time": 15,
    "objectives": [
      "Find a relative velocity by subtracting velocity vectors",
      "Read the impact speed as the length of the relative-velocity vector",
      "Reason about motion in different reference frames"
    ],
    "key_concepts": [
      "Relative velocity",
      "Vector subtraction",
      "Reference frames",
      "Closing speed",
      "Impact speed"
    ],
    "tags": [
      "relative-velocity",
      "vector-subtraction",
      "reference-frames",
      "closing-speed",
      "impact-speed",
      "vectors",
      "asteroid",
      "planetary-defense"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Transfer Task: Predicting 2026-XJ’s Position",
    "slug": "predicting-2026-xj",
    "description": "Unit 1's transfer task - the same trajectory tool from Motion graphs, now the assessed challenge. You have the distance-time graph, slope as velocity, and extrapolation: produce a predicted impact day, state your confidence, and justify it from the data. Push the measurement scatter and decide how many observations you'd demand before staking a real decision on the number.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Transfer Task: Predicting 2026-XJ",
    "difficulty": "advanced",
    "sort_order": 70,
    "component_path": "/simulations/predicting-2026-xj",
    "estimated_time": 25,
    "objectives": [
      "Produce a defensible impact-day prediction from real trajectory data",
      "Quantify and communicate the uncertainty in that prediction",
      "Justify a claim using slope and extrapolation evidence from the graph",
      "Decide how much data is enough before acting on a prediction"
    ],
    "key_concepts": [
      "Transfer task",
      "Slope = velocity",
      "Linear extrapolation",
      "Evidence-based claim",
      "Measurement uncertainty"
    ],
    "tags": [
      "transfer-task",
      "position-time-graph",
      "slope",
      "extrapolation",
      "prediction",
      "measurement-uncertainty",
      "asteroid",
      "planetary-defense",
      "nasa"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  }
]
