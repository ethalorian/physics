/**
 * Configuration for High School Conceptual Physics
 * 
 * This application is specifically designed for:
 * - High school students (ages 14-18)
 * - Conceptual physics courses (not AP Physics)
 * - Students with Algebra 1 mathematics skills
 * - No calculus or advanced trigonometry required
 */

export const PHYSICS_LEVEL = {
  // Course Information
  level: 'High School Conceptual Physics',
  mathLevel: 'Algebra 1',
  targetAge: '14-18 years',
  
  // Simplified Constants for High School
  constants: {
    gravity: 10,              // m/s² (simplified from 9.8)
    speedOfSound: 340,        // m/s
    waterDensity: 1000,       // kg/m³
    earthRadius: 6400000,     // m (6400 km)
    earthMass: 6e24,          // kg
  },
  
  // Core Formulas (Algebra-based only)
  formulas: {
    // Motion
    velocity: 'v = d/t',
    acceleration: 'a = Δv/t',
    distance: 'd = vt',
    
    // Forces
    force: 'F = ma',
    weight: 'W = mg',
    friction: 'f = μN',
    
    // Energy
    kineticEnergy: 'KE = ½mv²',
    potentialEnergy: 'PE = mgh',
    work: 'W = Fd',
    power: 'P = W/t',
    
    // Momentum
    momentum: 'p = mv',
    impulse: 'J = FΔt',
    
    // Waves
    waveSpeed: 'v = fλ',
    period: 'T = 1/f',
    
    // Electricity (Basic)
    ohmsLaw: 'V = IR',
    electricPower: 'P = IV',
    
    // Pressure
    pressure: 'P = F/A',
    fluidPressure: 'P = ρgh',
  },
  
  // Topics Covered
  topics: [
    'Motion and Kinematics',
    'Forces and Newton\'s Laws',
    'Energy and Work',
    'Momentum and Collisions',
    'Waves and Sound',
    'Basic Electricity',
    'Simple Machines',
    'Pressure and Fluids',
    'Heat and Temperature',
  ],
  
  // Common High School Lab Equipment
  equipment: [
    'Meter sticks',
    'Stopwatches',
    'Spring scales',
    'Mass sets',
    'Inclined planes',
    'Pulleys',
    'Simple pendulums',
    'Hot wheels tracks',
    'Basic circuits',
  ],
  
  // Student Misconceptions to Address
  commonMisconceptions: [
    'Heavier objects fall faster',
    'Objects need constant force to maintain constant velocity',
    'Mass and weight are the same thing',
    'Heat and temperature are the same',
    'Current is "used up" in a circuit',
    'Acceleration always means speeding up',
    'Forces always cause motion',
    'Energy can be created or destroyed',
  ],
  
  // Teaching Strategies
  strategies: {
    numerical: 'Use simple, round numbers (5, 10, 20, 100)',
    units: 'Stick to SI units, avoid complex conversions',
    concepts: 'Use everyday examples and analogies',
    problems: 'Start with one-step problems, build to two-step',
    vocabulary: 'Define terms clearly, avoid jargon',
    visuals: 'Use diagrams and demonstrations frequently',
  },
  
  // Assessment Guidelines
  assessment: {
    questionTypes: [
      'Multiple choice with 5 options',
      'Short numerical problems (1-2 steps)',
      'Conceptual explanation questions',
      'Graph interpretation',
      'Simple diagram labeling',
    ],
    difficulty: {
      easy: 'Direct formula application',
      medium: 'Two-step problems or unit conversion',
      hard: 'Combining concepts or multi-part problems',
    },
    gradingTips: 'Partial credit for correct formula even if calculation error',
  },
}

/**
 * Helper function to format numbers for high school students
 */
export function formatForHighSchool(value: number): string {
  // Round to reasonable precision for high school
  if (Math.abs(value) >= 1000) {
    return value.toExponential(2)
  } else if (Math.abs(value) < 0.01) {
    return value.toExponential(2)
  } else {
    // Round to 2-3 significant figures
    return parseFloat(value.toPrecision(3)).toString()
  }
}

/**
 * Check if a problem is appropriate for high school level
 */
export function isHighSchoolAppropriate(problemText: string): boolean {
  const inappropriate = [
    'derivative', 'integral', 'calculus',
    'differential', 'limit',
    'sin²', 'cos²', 'tan²',  // Advanced trig
    'cross product', 'dot product',  // Vector calculus
    'Lagrangian', 'Hamiltonian',  // Advanced physics
    'quantum', 'relativity',  // Modern physics
    'Maxwell', 'Schrödinger',  // Advanced topics
  ]
  
  const lowerText = problemText.toLowerCase()
  return !inappropriate.some(term => lowerText.includes(term))
}

/**
 * Simplify a number for high school problems
 */
export function simplifyNumber(value: number): number {
  // Round to nice numbers for high school
  const niceNumbers = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]
  
  // Find the closest "nice" number
  let closest = value
  let minDiff = Math.abs(value)
  
  for (const nice of niceNumbers) {
    // Check the nice number and its negative
    for (const candidate of [nice, -nice]) {
      const diff = Math.abs(value - candidate)
      if (diff < minDiff) {
        minDiff = diff
        closest = candidate
      }
    }
    
    // Also check multiples of 10
    for (let multiplier = 0.1; multiplier <= 100; multiplier *= 10) {
      const candidate = nice * multiplier
      const diff = Math.abs(value - candidate)
      if (diff < minDiff * 0.3) { // Within 30% of original
        return candidate
      }
    }
  }
  
  return Math.round(value)
}
