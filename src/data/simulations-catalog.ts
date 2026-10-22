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
    "title": "Measurement Lab",
    "slug": "measurement-precision",
    "description": "Can a precise measurement still be wrong? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Measurement",
    "difficulty": "beginner",
    "sort_order": 10,
    "component_path": "/simulations/measurement-precision",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Read, repeat, and calibrate",
      "Separate variation from offset",
      "Try a new situation"
    ],
    "key_concepts": [
      "precision",
      "accuracy",
      "measurement",
      "error analysis"
    ],
    "tags": [
      "interactive-assignment"
    ],
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
    "title": "Out & Back",
    "slug": "distance-displacement",
    "description": "What changes when you turn around? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "beginner",
    "sort_order": 10,
    "component_path": "/simulations/distance-displacement",
    "estimated_time": 15,
    "objectives": [
      "Make a prediction",
      "Follow the two legs",
      "Return, then overshoot",
      "Try a new situation"
    ],
    "key_concepts": [],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Motion Studio",
    "slug": "constant-velocity",
    "description": "Does changing the origin change the motion? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "beginner",
    "sort_order": 15,
    "component_path": "/simulations/constant-velocity",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Connect motion and slope",
      "Change the coordinate reading",
      "Try a new situation"
    ],
    "key_concepts": [
      "velocity",
      "kinematics",
      "graphs",
      "data collection"
    ],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Catch-Up Challenge",
    "slug": "car-race",
    "description": "When does a faster car actually catch up? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "intermediate",
    "sort_order": 25,
    "component_path": "/simulations/car-race",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Find the meeting",
      "Separate speed from start time",
      "Try a new situation"
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
      "word-problems",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Slope Detective",
    "slug": "slope-calculator",
    "description": "Is a high point on the graph a high speed? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "beginner",
    "sort_order": 15,
    "component_path": "/simulations/slope-calculator",
    "estimated_time": 15,
    "objectives": [
      "Make a prediction",
      "Read rise and run",
      "Move the line, then change its slope",
      "Try a new situation"
    ],
    "key_concepts": [],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Signed Area Lab",
    "slug": "area-under-curve",
    "description": "Can you travel far and end where you began? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "intermediate",
    "sort_order": 20,
    "component_path": "/simulations/area-under-curve",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Read three intervals",
      "Design a return trip",
      "Try a new situation"
    ],
    "key_concepts": [],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Acceleration Studio",
    "slug": "uniformly-accelerated-motion",
    "description": "Can positive velocity go with negative acceleration? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "intermediate",
    "sort_order": 35,
    "component_path": "/simulations/uniformly-accelerated-motion",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Find the turn",
      "Separate velocity from acceleration",
      "Try a new situation"
    ],
    "key_concepts": [
      "acceleration",
      "kinematics",
      "velocity",
      "displacement"
    ],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Cliff Drop",
    "slug": "freefall-cliff",
    "description": "What can fall time tell you about height? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "intermediate",
    "sort_order": 40,
    "component_path": "/simulations/freefall-cliff",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Use time as a measuring tool",
      "Change the model condition",
      "Try a new situation"
    ],
    "key_concepts": [
      "freefall",
      "kinematics",
      "gravity",
      "experimental methods"
    ],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Vacuum Chamber",
    "slug": "vacuum-chamber",
    "description": "Why does mass matter in air but not in a vacuum? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Motion",
    "difficulty": "beginner",
    "sort_order": 40,
    "component_path": "/simulations/vacuum-chamber",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Remove the air",
      "Add drag without changing gravity",
      "Try a new situation"
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
      "vacuum",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Vector Routes",
    "slug": "maze-vectors",
    "description": "Do different routes lead to the same displacement? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Vectors",
    "difficulty": "beginner",
    "sort_order": 30,
    "component_path": "/simulations/maze-vectors",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Build the resultant",
      "Change order, then close the route",
      "Try a new situation"
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
      "coordinate-geometry",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "River Crossing",
    "slug": "riverboat-crossing",
    "description": "Can pointing upstream make the crossing take longer? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Optional extensions",
    "difficulty": "intermediate",
    "sort_order": 196,
    "component_path": "/simulations/riverboat-crossing",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Add velocities by components",
      "Trade drift for crossing time",
      "Try a new situation"
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
      "2d-motion",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Launch Lab",
    "slug": "projectile-motion",
    "description": "Which part of the motion does gravity change? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Optional extensions",
    "difficulty": "intermediate",
    "sort_order": 198,
    "component_path": "/simulations/projectile-motion",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Follow two independent components",
      "Same speed, different launch",
      "Try a new situation"
    ],
    "key_concepts": [],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Dropping Target",
    "slug": "monkey-hunter",
    "description": "Why aim at where a falling target started? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Optional extensions",
    "difficulty": "intermediate",
    "sort_order": 198,
    "component_path": "/simulations/monkey-hunter",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Compare the gravitational offsets",
      "Test the limit",
      "Try a new situation"
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
      "monkey-hunter",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Force Inspector",
    "slug": "free-body-diagram",
    "description": "Which forces belong on this object’s diagram? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 75,
    "component_path": "/simulations/free-body-diagram",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Choose the object and the agents",
      "Reduce support, then lose contact",
      "Try a new situation"
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
      "Newton",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Force Tug-of-War",
    "slug": "sumo-forces",
    "description": "Do balanced forces mean the object must be stopped? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "beginner",
    "sort_order": 80,
    "component_path": "/simulations/sumo-forces",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Find the sum before using F=ma",
      "Balance while moving",
      "Try a new situation"
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
      "competition",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Spring Carts",
    "slug": "carts-third-law",
    "description": "Equal forces—so why do the carts move differently? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 70,
    "component_path": "/simulations/carts-third-law",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Compare the two objects at one instant",
      "Swap masses and release",
      "Try a new situation"
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
      "collisions",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Thrust & Coast",
    "slug": "astronaut-thrust",
    "description": "What happens after the engine switches off? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 45,
    "component_path": "/simulations/astronaut-thrust",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Separate burn from coast",
      "Brake without changing the model",
      "Try a new situation"
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
      "F=ma",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Pulley Balance",
    "slug": "atwood-machine",
    "description": "When does tension equal weight? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 90,
    "component_path": "/simulations/atwood-machine",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Write one equation per object",
      "Balance does not require rest",
      "Try a new situation"
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
      "atwood-machine",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
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
    "title": "Trajectory Reader",
    "slug": "asteroid-trajectory",
    "description": "Is an asteroid’s distance from Earth the same as its x position? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Mission",
    "difficulty": "intermediate",
    "sort_order": 20,
    "component_path": "/simulations/asteroid-trajectory",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Read a coordinate, not a road",
      "Hold the x motion fixed",
      "Try a new situation"
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
      "nasa",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Closing Speed",
    "slug": "closing-speed",
    "description": "Does all of an asteroid’s speed bring it closer? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Mission",
    "difficulty": "intermediate",
    "sort_order": 30,
    "component_path": "/simulations/closing-speed",
    "estimated_time": 20,
    "objectives": [
      "Make a prediction",
      "Separate toward and across",
      "Same speed, different direction",
      "Try a new situation"
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
      "planetary-defense",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "title": "Prediction Envelope",
    "slug": "predicting-2026-xj",
    "description": "How confident should we be in a distant prediction? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "kinematics",
    "unit": "unit-1",
    "topic": "Mission",
    "difficulty": "advanced",
    "sort_order": 100,
    "component_path": "/simulations/predicting-2026-xj",
    "estimated_time": 30,
    "objectives": [
      "Make a prediction",
      "Predict a region, not just a dot",
      "Change time and measurement quality separately",
      "Try a new situation"
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
      "nasa",
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "slug": "incline-lab",
    "title": "Tilted Axes",
    "description": "Why does the normal force change on a ramp? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 80,
    "component_path": "/simulations/incline-lab",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Choose axes that fit the constraint",
      "Tilt, then release",
      "Try a new situation"
    ],
    "key_concepts": [
      "forces"
    ],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "slug": "force-mass",
    "title": "Force & Mass Lab",
    "description": "What does a fair test of F = ma look like? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 55,
    "component_path": "/simulations/force-mass",
    "estimated_time": 30,
    "objectives": [
      "Make a prediction",
      "Hold force fixed",
      "Hold mass fixed",
      "Combine the two fair tests",
      "Try a new situation"
    ],
    "key_concepts": [
      "forces"
    ],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  },
  {
    "slug": "friction-lab",
    "title": "Grip & Slip",
    "description": "Why is it harder to start sliding than to keep sliding? Run controlled trials, compare saved evidence, and complete an assignable investigation.",
    "category": "forces",
    "unit": "unit-1",
    "topic": "Forces",
    "difficulty": "intermediate",
    "sort_order": 85,
    "component_path": "/simulations/friction-lab",
    "estimated_time": 25,
    "objectives": [
      "Make a prediction",
      "Find the threshold",
      "Keep it moving, then let it stop",
      "Try a new situation"
    ],
    "key_concepts": [
      "forces"
    ],
    "tags": [
      "interactive-assignment"
    ],
    "can_embed": true,
    "has_ai_guide": false,
    "published": true
  }
]
