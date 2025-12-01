/**
 * Configuration for AI-Generated Reading Lessons
 * 
 * Provides structured data for physics terms, real-world environments,
 * and mastery levels for generating engaging reading content.
 */

// ============================================================================
// MASTERY LEVELS
// ============================================================================

export interface MasteryLevel {
  id: string
  name: string
  gradeRange: string
  readingLevel: string
  description: string
  characteristics: string[]
}

export const masteryLevels: MasteryLevel[] = [
  {
    id: 'elementary',
    name: 'Elementary',
    gradeRange: 'Grades 3-5',
    readingLevel: 'Lexile 500-700',
    description: 'Simple vocabulary, short sentences, concrete examples',
    characteristics: [
      'Simple, everyday vocabulary',
      'Short sentences (8-12 words)',
      'Concrete, relatable examples',
      'Visual analogies emphasized',
      'No mathematical formulas',
      'Story-based explanations'
    ]
  },
  {
    id: 'middle-school',
    name: 'Middle School',
    gradeRange: 'Grades 6-8',
    readingLevel: 'Lexile 800-1000',
    description: 'Introduction to scientific terminology with scaffolding',
    characteristics: [
      'Introduction of scientific vocabulary with definitions',
      'Medium-length sentences',
      'Real-world connections',
      'Simple quantitative relationships',
      'Cause-and-effect reasoning',
      'Basic problem-solving scenarios'
    ]
  },
  {
    id: 'high-school-intro',
    name: 'High School Introductory',
    gradeRange: 'Grades 9-10',
    readingLevel: 'Lexile 1000-1150',
    description: 'Standard conceptual physics level with algebra-based explanations',
    characteristics: [
      'Scientific vocabulary used naturally',
      'Algebraic relationships introduced',
      'Multi-step reasoning',
      'Historical context included',
      'Real-world applications emphasized',
      'Misconceptions addressed directly'
    ]
  },
  {
    id: 'high-school-advanced',
    name: 'High School Advanced',
    gradeRange: 'Grades 11-12',
    readingLevel: 'Lexile 1150-1300',
    description: 'Pre-AP level with mathematical rigor and deeper analysis',
    characteristics: [
      'Advanced scientific terminology',
      'Mathematical derivations explained',
      'Complex multi-concept integration',
      'Research connections',
      'Critical analysis of models',
      'Quantitative problem contexts'
    ]
  },
  {
    id: 'college-prep',
    name: 'College Preparatory',
    gradeRange: 'AP/College Intro',
    readingLevel: 'Lexile 1300+',
    description: 'University-level conceptual depth with calculus connections',
    characteristics: [
      'Professional scientific language',
      'Calculus concepts referenced',
      'Deep theoretical understanding',
      'Current research mentioned',
      'Sophisticated analysis',
      'Graduate-level vocabulary introduced'
    ]
  }
]

// ============================================================================
// PHYSICS TERMS BY TOPIC
// ============================================================================

export interface PhysicsTerm {
  id: string
  term: string
  symbol?: string
  unit?: string
  definition: string
  relatedTerms?: string[]
  commonMisconceptions?: string[]
}

export interface PhysicsTopic {
  id: string
  name: string
  icon: string
  description: string
  terms: PhysicsTerm[]
}

export const physicsTopics: PhysicsTopic[] = [
  {
    id: 'kinematics',
    name: 'Motion & Kinematics',
    icon: '🏃',
    description: 'The study of motion without considering forces',
    terms: [
      {
        id: 'position',
        term: 'Position',
        symbol: 'x',
        unit: 'm',
        definition: 'The location of an object relative to a reference point',
        relatedTerms: ['displacement', 'distance']
      },
      {
        id: 'displacement',
        term: 'Displacement',
        symbol: 'Δx',
        unit: 'm',
        definition: 'The change in position; a vector quantity',
        relatedTerms: ['position', 'distance'],
        commonMisconceptions: ['Displacement is the same as distance']
      },
      {
        id: 'velocity',
        term: 'Velocity',
        symbol: 'v',
        unit: 'm/s',
        definition: 'The rate of change of displacement with respect to time',
        relatedTerms: ['speed', 'acceleration'],
        commonMisconceptions: ['Velocity and speed are identical']
      },
      {
        id: 'speed',
        term: 'Speed',
        symbol: 'v',
        unit: 'm/s',
        definition: 'The rate of change of distance with respect to time; a scalar',
        relatedTerms: ['velocity']
      },
      {
        id: 'acceleration',
        term: 'Acceleration',
        symbol: 'a',
        unit: 'm/s²',
        definition: 'The rate of change of velocity with respect to time',
        relatedTerms: ['velocity', 'force'],
        commonMisconceptions: ['Acceleration always means speeding up']
      },
      {
        id: 'free-fall',
        term: 'Free Fall',
        symbol: 'g',
        unit: 'm/s²',
        definition: 'Motion under the influence of gravity alone',
        relatedTerms: ['gravity', 'acceleration'],
        commonMisconceptions: ['Heavier objects fall faster']
      },
      {
        id: 'projectile-motion',
        term: 'Projectile Motion',
        definition: 'Motion of an object thrown or projected into the air',
        relatedTerms: ['free-fall', 'velocity', 'trajectory']
      }
    ]
  },
  {
    id: 'forces',
    name: 'Forces & Newton\'s Laws',
    icon: '💪',
    description: 'How forces affect motion',
    terms: [
      {
        id: 'force',
        term: 'Force',
        symbol: 'F',
        unit: 'N',
        definition: 'A push or pull that can cause acceleration',
        relatedTerms: ['mass', 'acceleration', 'net force']
      },
      {
        id: 'net-force',
        term: 'Net Force',
        symbol: 'ΣF',
        unit: 'N',
        definition: 'The vector sum of all forces acting on an object',
        relatedTerms: ['force', 'equilibrium']
      },
      {
        id: 'mass',
        term: 'Mass',
        symbol: 'm',
        unit: 'kg',
        definition: 'A measure of the amount of matter in an object',
        relatedTerms: ['weight', 'inertia'],
        commonMisconceptions: ['Mass and weight are the same thing']
      },
      {
        id: 'weight',
        term: 'Weight',
        symbol: 'W',
        unit: 'N',
        definition: 'The gravitational force on an object (W = mg)',
        relatedTerms: ['mass', 'gravity']
      },
      {
        id: 'inertia',
        term: 'Inertia',
        definition: 'The tendency of an object to resist changes in motion',
        relatedTerms: ['mass', 'newton-first-law']
      },
      {
        id: 'friction',
        term: 'Friction',
        symbol: 'f',
        unit: 'N',
        definition: 'A force that opposes relative motion between surfaces',
        relatedTerms: ['normal-force', 'coefficient-of-friction']
      },
      {
        id: 'normal-force',
        term: 'Normal Force',
        symbol: 'N',
        unit: 'N',
        definition: 'The perpendicular contact force between surfaces',
        relatedTerms: ['friction', 'weight']
      },
      {
        id: 'tension',
        term: 'Tension',
        symbol: 'T',
        unit: 'N',
        definition: 'The pulling force transmitted through a string or rope',
        relatedTerms: ['force', 'equilibrium']
      },
      {
        id: 'equilibrium',
        term: 'Equilibrium',
        definition: 'State where the net force on an object is zero',
        relatedTerms: ['net-force', 'balanced-forces']
      }
    ]
  },
  {
    id: 'energy',
    name: 'Energy & Work',
    icon: '⚡',
    description: 'Energy transformations and conservation',
    terms: [
      {
        id: 'energy',
        term: 'Energy',
        symbol: 'E',
        unit: 'J',
        definition: 'The capacity to do work',
        relatedTerms: ['work', 'power']
      },
      {
        id: 'kinetic-energy',
        term: 'Kinetic Energy',
        symbol: 'KE',
        unit: 'J',
        definition: 'Energy due to motion (KE = ½mv²)',
        relatedTerms: ['velocity', 'mass', 'potential-energy']
      },
      {
        id: 'potential-energy',
        term: 'Potential Energy',
        symbol: 'PE',
        unit: 'J',
        definition: 'Stored energy due to position or configuration',
        relatedTerms: ['kinetic-energy', 'height', 'spring']
      },
      {
        id: 'gravitational-pe',
        term: 'Gravitational Potential Energy',
        symbol: 'PE_g',
        unit: 'J',
        definition: 'Energy stored due to height above a reference (PE = mgh)',
        relatedTerms: ['potential-energy', 'height', 'gravity']
      },
      {
        id: 'work',
        term: 'Work',
        symbol: 'W',
        unit: 'J',
        definition: 'Energy transferred by a force over a distance (W = Fd)',
        relatedTerms: ['energy', 'force', 'power'],
        commonMisconceptions: ['Holding something heavy is doing work']
      },
      {
        id: 'power',
        term: 'Power',
        symbol: 'P',
        unit: 'W',
        definition: 'The rate at which work is done or energy is transferred',
        relatedTerms: ['work', 'energy', 'time']
      },
      {
        id: 'conservation-of-energy',
        term: 'Conservation of Energy',
        definition: 'Energy cannot be created or destroyed, only transformed',
        relatedTerms: ['kinetic-energy', 'potential-energy'],
        commonMisconceptions: ['Energy can be lost or used up']
      }
    ]
  },
  {
    id: 'momentum',
    name: 'Momentum & Collisions',
    icon: '🎱',
    description: 'Linear momentum and its conservation',
    terms: [
      {
        id: 'momentum',
        term: 'Momentum',
        symbol: 'p',
        unit: 'kg·m/s',
        definition: 'The product of mass and velocity (p = mv)',
        relatedTerms: ['mass', 'velocity', 'impulse']
      },
      {
        id: 'impulse',
        term: 'Impulse',
        symbol: 'J',
        unit: 'N·s',
        definition: 'The change in momentum (J = FΔt)',
        relatedTerms: ['momentum', 'force', 'time']
      },
      {
        id: 'conservation-of-momentum',
        term: 'Conservation of Momentum',
        definition: 'Total momentum remains constant in an isolated system',
        relatedTerms: ['momentum', 'collision']
      },
      {
        id: 'elastic-collision',
        term: 'Elastic Collision',
        definition: 'A collision where kinetic energy is conserved',
        relatedTerms: ['inelastic-collision', 'kinetic-energy', 'momentum']
      },
      {
        id: 'inelastic-collision',
        term: 'Inelastic Collision',
        definition: 'A collision where kinetic energy is not conserved',
        relatedTerms: ['elastic-collision', 'momentum']
      }
    ]
  },
  {
    id: 'waves',
    name: 'Waves & Sound',
    icon: '🌊',
    description: 'Properties and behavior of waves',
    terms: [
      {
        id: 'wave',
        term: 'Wave',
        definition: 'A disturbance that transfers energy through matter or space',
        relatedTerms: ['wavelength', 'frequency', 'amplitude']
      },
      {
        id: 'wavelength',
        term: 'Wavelength',
        symbol: 'λ',
        unit: 'm',
        definition: 'The distance between consecutive wave crests',
        relatedTerms: ['frequency', 'wave-speed']
      },
      {
        id: 'frequency',
        term: 'Frequency',
        symbol: 'f',
        unit: 'Hz',
        definition: 'The number of waves passing a point per second',
        relatedTerms: ['wavelength', 'period']
      },
      {
        id: 'amplitude',
        term: 'Amplitude',
        symbol: 'A',
        unit: 'm',
        definition: 'The maximum displacement from equilibrium in a wave',
        relatedTerms: ['wave', 'energy']
      },
      {
        id: 'period',
        term: 'Period',
        symbol: 'T',
        unit: 's',
        definition: 'The time for one complete wave cycle (T = 1/f)',
        relatedTerms: ['frequency']
      },
      {
        id: 'interference',
        term: 'Interference',
        definition: 'The combination of two or more waves',
        relatedTerms: ['constructive-interference', 'destructive-interference']
      },
      {
        id: 'resonance',
        term: 'Resonance',
        definition: 'Large amplitude oscillation at natural frequency',
        relatedTerms: ['frequency', 'standing-wave']
      },
      {
        id: 'doppler-effect',
        term: 'Doppler Effect',
        definition: 'Change in frequency due to relative motion between source and observer',
        relatedTerms: ['frequency', 'wave-speed']
      }
    ]
  },
  {
    id: 'electricity',
    name: 'Electricity & Circuits',
    icon: '🔌',
    description: 'Electric charge, current, and circuits',
    terms: [
      {
        id: 'electric-charge',
        term: 'Electric Charge',
        symbol: 'q',
        unit: 'C',
        definition: 'A fundamental property of matter (positive or negative)',
        relatedTerms: ['current', 'electron']
      },
      {
        id: 'current',
        term: 'Electric Current',
        symbol: 'I',
        unit: 'A',
        definition: 'The rate of flow of electric charge',
        relatedTerms: ['voltage', 'resistance'],
        commonMisconceptions: ['Current gets used up in a circuit']
      },
      {
        id: 'voltage',
        term: 'Voltage',
        symbol: 'V',
        unit: 'V',
        definition: 'Electric potential difference that drives current flow',
        relatedTerms: ['current', 'resistance', 'energy']
      },
      {
        id: 'resistance',
        term: 'Resistance',
        symbol: 'R',
        unit: 'Ω',
        definition: 'Opposition to current flow in a circuit',
        relatedTerms: ['current', 'voltage', 'ohms-law']
      },
      {
        id: 'ohms-law',
        term: 'Ohm\'s Law',
        definition: 'V = IR; the relationship between voltage, current, and resistance',
        relatedTerms: ['voltage', 'current', 'resistance']
      },
      {
        id: 'series-circuit',
        term: 'Series Circuit',
        definition: 'Circuit where components are connected in a single path',
        relatedTerms: ['parallel-circuit', 'current']
      },
      {
        id: 'parallel-circuit',
        term: 'Parallel Circuit',
        definition: 'Circuit where components are connected across common points',
        relatedTerms: ['series-circuit', 'voltage']
      }
    ]
  },
  {
    id: 'thermodynamics',
    name: 'Heat & Thermodynamics',
    icon: '🔥',
    description: 'Heat transfer and thermal energy',
    terms: [
      {
        id: 'temperature',
        term: 'Temperature',
        symbol: 'T',
        unit: 'K or °C',
        definition: 'A measure of the average kinetic energy of particles',
        relatedTerms: ['heat', 'thermal-energy'],
        commonMisconceptions: ['Temperature and heat are the same thing']
      },
      {
        id: 'heat',
        term: 'Heat',
        symbol: 'Q',
        unit: 'J',
        definition: 'Thermal energy transferred due to temperature difference',
        relatedTerms: ['temperature', 'thermal-energy']
      },
      {
        id: 'specific-heat',
        term: 'Specific Heat Capacity',
        symbol: 'c',
        unit: 'J/(kg·K)',
        definition: 'Energy needed to raise 1 kg of a substance by 1 K',
        relatedTerms: ['heat', 'temperature']
      },
      {
        id: 'conduction',
        term: 'Conduction',
        definition: 'Heat transfer through direct contact',
        relatedTerms: ['convection', 'radiation', 'heat']
      },
      {
        id: 'convection',
        term: 'Convection',
        definition: 'Heat transfer through fluid movement',
        relatedTerms: ['conduction', 'radiation', 'heat']
      },
      {
        id: 'radiation',
        term: 'Radiation',
        definition: 'Heat transfer through electromagnetic waves',
        relatedTerms: ['conduction', 'convection', 'electromagnetic-wave']
      }
    ]
  },
  {
    id: 'optics',
    name: 'Light & Optics',
    icon: '💡',
    description: 'Properties and behavior of light',
    terms: [
      {
        id: 'light',
        term: 'Light',
        definition: 'Electromagnetic radiation visible to the human eye',
        relatedTerms: ['electromagnetic-wave', 'wavelength', 'frequency']
      },
      {
        id: 'reflection',
        term: 'Reflection',
        definition: 'Light bouncing off a surface',
        relatedTerms: ['mirror', 'angle-of-incidence']
      },
      {
        id: 'refraction',
        term: 'Refraction',
        definition: 'Bending of light when passing between different media',
        relatedTerms: ['snells-law', 'index-of-refraction'],
        commonMisconceptions: ['Light always travels in straight lines']
      },
      {
        id: 'index-of-refraction',
        term: 'Index of Refraction',
        symbol: 'n',
        definition: 'Ratio of light speed in vacuum to speed in a medium',
        relatedTerms: ['refraction', 'snells-law']
      },
      {
        id: 'lens',
        term: 'Lens',
        definition: 'Transparent material that focuses or disperses light',
        relatedTerms: ['refraction', 'focal-length', 'image']
      },
      {
        id: 'focal-length',
        term: 'Focal Length',
        symbol: 'f',
        unit: 'm',
        definition: 'Distance from lens center to the focal point',
        relatedTerms: ['lens', 'magnification']
      },
      {
        id: 'dispersion',
        term: 'Dispersion',
        definition: 'Separation of light into its component colors',
        relatedTerms: ['prism', 'rainbow', 'wavelength']
      },
      {
        id: 'total-internal-reflection',
        term: 'Total Internal Reflection',
        definition: 'Complete reflection when light hits a boundary at a steep angle',
        relatedTerms: ['refraction', 'critical-angle', 'fiber-optics']
      }
    ]
  },
  {
    id: 'magnetism',
    name: 'Magnetism',
    icon: '🧲',
    description: 'Magnetic fields and electromagnetic interactions',
    terms: [
      {
        id: 'magnetic-field',
        term: 'Magnetic Field',
        symbol: 'B',
        unit: 'T',
        definition: 'Region around a magnet where magnetic forces act',
        relatedTerms: ['magnetic-force', 'north-pole', 'south-pole']
      },
      {
        id: 'magnetic-pole',
        term: 'Magnetic Pole',
        definition: 'The ends of a magnet where the field is strongest',
        relatedTerms: ['magnetic-field', 'compass'],
        commonMisconceptions: ['You can isolate a single magnetic pole']
      },
      {
        id: 'electromagnet',
        term: 'Electromagnet',
        definition: 'Magnet created by electric current flowing through a coil',
        relatedTerms: ['current', 'magnetic-field', 'solenoid']
      },
      {
        id: 'magnetic-force',
        term: 'Magnetic Force',
        symbol: 'F',
        unit: 'N',
        definition: 'Force exerted on moving charges or magnets by a magnetic field',
        relatedTerms: ['magnetic-field', 'current', 'motor']
      },
      {
        id: 'electromagnetic-induction',
        term: 'Electromagnetic Induction',
        definition: 'Generation of electric current by changing magnetic fields',
        relatedTerms: ['faraday-law', 'generator', 'transformer']
      },
      {
        id: 'motor',
        term: 'Electric Motor',
        definition: 'Device converting electrical energy to mechanical motion',
        relatedTerms: ['magnetic-force', 'current', 'generator']
      },
      {
        id: 'generator',
        term: 'Electric Generator',
        definition: 'Device converting mechanical motion to electrical energy',
        relatedTerms: ['electromagnetic-induction', 'motor']
      }
    ]
  },
  {
    id: 'rotational',
    name: 'Rotational Motion',
    icon: '🔄',
    description: 'Rotation, torque, and angular momentum',
    terms: [
      {
        id: 'angular-velocity',
        term: 'Angular Velocity',
        symbol: 'ω',
        unit: 'rad/s',
        definition: 'Rate of change of angular position',
        relatedTerms: ['angular-acceleration', 'rotation', 'rpm']
      },
      {
        id: 'angular-acceleration',
        term: 'Angular Acceleration',
        symbol: 'α',
        unit: 'rad/s²',
        definition: 'Rate of change of angular velocity',
        relatedTerms: ['angular-velocity', 'torque']
      },
      {
        id: 'torque',
        term: 'Torque',
        symbol: 'τ',
        unit: 'N·m',
        definition: 'Rotational equivalent of force; causes angular acceleration',
        relatedTerms: ['force', 'lever-arm', 'angular-acceleration'],
        commonMisconceptions: ['Torque and force are the same thing']
      },
      {
        id: 'moment-of-inertia',
        term: 'Moment of Inertia',
        symbol: 'I',
        unit: 'kg·m²',
        definition: 'Resistance to changes in rotational motion',
        relatedTerms: ['mass', 'torque', 'angular-acceleration']
      },
      {
        id: 'angular-momentum',
        term: 'Angular Momentum',
        symbol: 'L',
        unit: 'kg·m²/s',
        definition: 'Rotational equivalent of linear momentum (L = Iω)',
        relatedTerms: ['moment-of-inertia', 'angular-velocity', 'conservation']
      },
      {
        id: 'centripetal-force',
        term: 'Centripetal Force',
        symbol: 'Fc',
        unit: 'N',
        definition: 'Force directed toward center keeping object in circular path',
        relatedTerms: ['circular-motion', 'centrifugal'],
        commonMisconceptions: ['Centrifugal force pushes objects outward']
      },
      {
        id: 'centripetal-acceleration',
        term: 'Centripetal Acceleration',
        symbol: 'ac',
        unit: 'm/s²',
        definition: 'Acceleration toward center in circular motion (ac = v²/r)',
        relatedTerms: ['centripetal-force', 'circular-motion']
      }
    ]
  },
  {
    id: 'fluids',
    name: 'Fluids & Pressure',
    icon: '💧',
    description: 'Liquids, gases, pressure, and buoyancy',
    terms: [
      {
        id: 'pressure',
        term: 'Pressure',
        symbol: 'P',
        unit: 'Pa',
        definition: 'Force per unit area (P = F/A)',
        relatedTerms: ['force', 'area', 'pascal']
      },
      {
        id: 'density',
        term: 'Density',
        symbol: 'ρ',
        unit: 'kg/m³',
        definition: 'Mass per unit volume (ρ = m/V)',
        relatedTerms: ['mass', 'volume', 'buoyancy']
      },
      {
        id: 'buoyancy',
        term: 'Buoyancy',
        definition: 'Upward force on object submerged in fluid',
        relatedTerms: ['density', 'archimedes-principle', 'floating']
      },
      {
        id: 'archimedes-principle',
        term: 'Archimedes\' Principle',
        definition: 'Buoyant force equals weight of displaced fluid',
        relatedTerms: ['buoyancy', 'density', 'floating']
      },
      {
        id: 'pascals-principle',
        term: 'Pascal\'s Principle',
        definition: 'Pressure applied to enclosed fluid transmits equally throughout',
        relatedTerms: ['pressure', 'hydraulics']
      },
      {
        id: 'bernoullis-principle',
        term: 'Bernoulli\'s Principle',
        definition: 'Fast-moving fluids have lower pressure',
        relatedTerms: ['pressure', 'velocity', 'lift'],
        commonMisconceptions: ['Airplane lift is only due to Bernoulli\'s principle']
      },
      {
        id: 'viscosity',
        term: 'Viscosity',
        definition: 'Fluid resistance to flow; internal friction',
        relatedTerms: ['fluid', 'flow']
      },
      {
        id: 'atmospheric-pressure',
        term: 'Atmospheric Pressure',
        definition: 'Pressure exerted by the weight of air above',
        relatedTerms: ['pressure', 'barometer', 'altitude']
      }
    ]
  },
  {
    id: 'modern-physics',
    name: 'Modern Physics',
    icon: '⚛️',
    description: 'Quantum mechanics, relativity, and nuclear physics basics',
    terms: [
      {
        id: 'photon',
        term: 'Photon',
        definition: 'A particle of light; quantum of electromagnetic energy',
        relatedTerms: ['light', 'energy', 'quantum']
      },
      {
        id: 'wave-particle-duality',
        term: 'Wave-Particle Duality',
        definition: 'Light and matter exhibit both wave and particle properties',
        relatedTerms: ['photon', 'electron', 'quantum']
      },
      {
        id: 'photoelectric-effect',
        term: 'Photoelectric Effect',
        definition: 'Electrons ejected from metal when light shines on it',
        relatedTerms: ['photon', 'energy', 'electron']
      },
      {
        id: 'special-relativity',
        term: 'Special Relativity',
        definition: 'Physics at speeds approaching the speed of light',
        relatedTerms: ['time-dilation', 'length-contraction', 'speed-of-light']
      },
      {
        id: 'time-dilation',
        term: 'Time Dilation',
        definition: 'Time passes slower for fast-moving objects',
        relatedTerms: ['special-relativity', 'speed-of-light']
      },
      {
        id: 'mass-energy-equivalence',
        term: 'Mass-Energy Equivalence',
        definition: 'Mass and energy are interchangeable (E = mc²)',
        relatedTerms: ['energy', 'mass', 'nuclear']
      },
      {
        id: 'radioactivity',
        term: 'Radioactivity',
        definition: 'Spontaneous emission of particles from unstable nuclei',
        relatedTerms: ['nuclear', 'alpha', 'beta', 'gamma']
      },
      {
        id: 'half-life',
        term: 'Half-Life',
        definition: 'Time for half of radioactive atoms to decay',
        relatedTerms: ['radioactivity', 'decay']
      }
    ]
  }
]

// ============================================================================
// REAL-WORLD ENVIRONMENTS
// ============================================================================

export interface RealWorldEnvironment {
  id: string
  name: string
  icon: string
  description: string
  examples: string[]
  bestForTopics: string[]
}

export const realWorldEnvironments: RealWorldEnvironment[] = [
  {
    id: 'sports',
    name: 'Sports & Athletics',
    icon: '🏈',
    description: 'Football, basketball, soccer, baseball, track & field, gymnastics',
    examples: [
      'A football player tackling',
      'A basketball free throw',
      'A soccer ball curve',
      'A baseball pitch',
      'A sprinter accelerating',
      'A gymnast on a balance beam'
    ],
    bestForTopics: ['kinematics', 'forces', 'momentum', 'energy']
  },
  {
    id: 'vehicles',
    name: 'Cars & Transportation',
    icon: '🚗',
    description: 'Cars, trains, airplanes, bicycles, motorcycles',
    examples: [
      'A car braking at a stoplight',
      'A roller coaster loop',
      'An airplane taking off',
      'A cyclist going uphill',
      'A train on curved tracks',
      'Electric vehicle acceleration'
    ],
    bestForTopics: ['kinematics', 'forces', 'energy', 'momentum']
  },
  {
    id: 'amusement-parks',
    name: 'Amusement Parks & Rides',
    icon: '🎢',
    description: 'Roller coasters, ferris wheels, drop towers, bumper cars',
    examples: [
      'A roller coaster drop',
      'A ferris wheel rotation',
      'Bumper car collisions',
      'A spinning teacup ride',
      'A free-fall tower',
      'A pendulum swing ride'
    ],
    bestForTopics: ['energy', 'forces', 'kinematics', 'momentum']
  },
  {
    id: 'music',
    name: 'Music & Sound',
    icon: '🎵',
    description: 'Musical instruments, concerts, speakers, acoustics',
    examples: [
      'A guitar string vibrating',
      'A drum being struck',
      'Concert hall acoustics',
      'Speakers and amplification',
      'Tuning fork resonance',
      'Sound studio design'
    ],
    bestForTopics: ['waves', 'energy']
  },
  {
    id: 'nature',
    name: 'Nature & Weather',
    icon: '🌍',
    description: 'Weather patterns, ocean waves, earthquakes, wildlife',
    examples: [
      'Ocean waves approaching shore',
      'Thunder and lightning timing',
      'Bird flight patterns',
      'Falling leaves',
      'Wind and kite flying',
      'Earthquake wave propagation'
    ],
    bestForTopics: ['waves', 'kinematics', 'forces', 'energy']
  },
  {
    id: 'home',
    name: 'Home & Everyday Life',
    icon: '🏠',
    description: 'Kitchen appliances, household activities, DIY projects',
    examples: [
      'Microwave heating food',
      'Refrigerator cooling',
      'Opening a door',
      'Using a can opener',
      'Blending a smoothie',
      'A ceiling fan spinning'
    ],
    bestForTopics: ['energy', 'forces', 'electricity', 'thermodynamics']
  },
  {
    id: 'space',
    name: 'Space & Astronomy',
    icon: '🚀',
    description: 'Rockets, satellites, planets, astronauts',
    examples: [
      'Rocket launch acceleration',
      'Satellite orbits',
      'Astronaut spacewalks',
      'Planetary gravity',
      'Mars rover exploration',
      'Solar system dynamics'
    ],
    bestForTopics: ['kinematics', 'forces', 'energy', 'momentum']
  },
  {
    id: 'technology',
    name: 'Technology & Gadgets',
    icon: '📱',
    description: 'Smartphones, computers, gaming, electronics',
    examples: [
      'Phone battery charging',
      'Computer cooling systems',
      'Video game controllers',
      'Wireless charging',
      'LED screen displays',
      'Touch screen technology'
    ],
    bestForTopics: ['electricity', 'energy', 'waves']
  },
  {
    id: 'construction',
    name: 'Construction & Engineering',
    icon: '🏗️',
    description: 'Buildings, bridges, cranes, construction equipment',
    examples: [
      'A crane lifting materials',
      'Bridge structural support',
      'Wrecking ball demolition',
      'Elevator operation',
      'Pile driver impacts',
      'Scaffolding stability'
    ],
    bestForTopics: ['forces', 'energy', 'momentum']
  },
  {
    id: 'medical',
    name: 'Medicine & Health',
    icon: '🏥',
    description: 'Medical imaging, physical therapy, biomechanics',
    examples: [
      'X-ray imaging',
      'Ultrasound technology',
      'MRI scanning',
      'Physical therapy exercises',
      'Heart rate monitors',
      'Blood pressure measurement'
    ],
    bestForTopics: ['waves', 'electricity', 'energy']
  },
  {
    id: 'water',
    name: 'Water & Swimming',
    icon: '🏊',
    description: 'Swimming, diving, water parks, boats',
    examples: [
      'A swimmer\'s stroke mechanics',
      'Diving board physics',
      'Boat buoyancy',
      'Water slide acceleration',
      'Wave pool mechanics',
      'Kayak paddle forces'
    ],
    bestForTopics: ['forces', 'kinematics', 'energy', 'waves']
  },
  {
    id: 'winter',
    name: 'Winter Sports & Ice',
    icon: '⛷️',
    description: 'Skiing, ice skating, snowboarding, hockey',
    examples: [
      'Ski jumping trajectory',
      'Ice skating friction',
      'Hockey puck sliding',
      'Snowboard carving',
      'Bobsled acceleration',
      'Curling stone motion'
    ],
    bestForTopics: ['kinematics', 'forces', 'momentum', 'energy']
  },
  {
    id: 'gaming',
    name: 'Video Games & Esports',
    icon: '🎮',
    description: 'Gaming physics, controllers, and esports',
    examples: [
      'Physics engines in games',
      'Controller vibration feedback',
      'VR headset motion tracking',
      'Game character jumping mechanics',
      'Racing game tire physics',
      'Projectile trajectories in shooters'
    ],
    bestForTopics: ['kinematics', 'forces', 'momentum', 'waves']
  },
  {
    id: 'cooking',
    name: 'Cooking & Kitchen Science',
    icon: '👨‍🍳',
    description: 'Food preparation, appliances, and culinary physics',
    examples: [
      'Boiling water at different altitudes',
      'Microwave heating patterns',
      'Pressure cooker operation',
      'Ice cream freezing process',
      'Knife cutting mechanics',
      'Convection oven cooking'
    ],
    bestForTopics: ['thermodynamics', 'waves', 'energy', 'fluids']
  },
  {
    id: 'movies',
    name: 'Movies & Special Effects',
    icon: '🎬',
    description: 'Film physics, stunts, and CGI',
    examples: [
      'Movie explosions and shockwaves',
      'Car chase stunt physics',
      'Wire work in action films',
      'Slow motion cinematography',
      'Sound design and Foley',
      'CGI water and cloth simulation'
    ],
    bestForTopics: ['kinematics', 'forces', 'waves', 'momentum']
  },
  {
    id: 'extreme-sports',
    name: 'Extreme Sports',
    icon: '🪂',
    description: 'Skydiving, bungee jumping, surfing, rock climbing',
    examples: [
      'Terminal velocity in skydiving',
      'Bungee cord elastic energy',
      'Surfing wave dynamics',
      'Rock climbing friction and grip',
      'Paragliding lift and drag',
      'Wingsuit flying aerodynamics'
    ],
    bestForTopics: ['forces', 'energy', 'kinematics', 'fluids']
  },
  {
    id: 'aviation',
    name: 'Aviation & Flight',
    icon: '✈️',
    description: 'Airplanes, helicopters, drones, and flight',
    examples: [
      'Airplane wing lift generation',
      'Helicopter rotor physics',
      'Drone hovering stability',
      'Jet engine thrust',
      'Paper airplane flight',
      'Hot air balloon buoyancy'
    ],
    bestForTopics: ['forces', 'fluids', 'energy', 'kinematics']
  },
  {
    id: 'skateboarding',
    name: 'Skateboarding & BMX',
    icon: '🛹',
    description: 'Street sports, tricks, and ramp physics',
    examples: [
      'Ollie jump mechanics',
      'Half-pipe pendulum motion',
      'Grinding friction and balance',
      'Wheel bearing rotation',
      'Kickflip angular momentum',
      'BMX bunny hop physics'
    ],
    bestForTopics: ['forces', 'momentum', 'rotational', 'energy']
  },
  {
    id: 'dance',
    name: 'Dance & Performance',
    icon: '💃',
    description: 'Ballet, hip-hop, figure skating performances',
    examples: [
      'Pirouette spin conservation',
      'Ballet pointe shoe pressure',
      'Breakdancing rotational moves',
      'Partner lifts and balance',
      'Jump height and hang time',
      'Figure skating spin speed changes'
    ],
    bestForTopics: ['rotational', 'forces', 'momentum', 'energy']
  },
  {
    id: 'photography',
    name: 'Photography & Cameras',
    icon: '📷',
    description: 'Cameras, lenses, and image capture',
    examples: [
      'Camera lens focusing',
      'Aperture and depth of field',
      'Flash photography timing',
      'Image stabilization',
      'Rainbow and prism effects',
      'Infrared and UV photography'
    ],
    bestForTopics: ['optics', 'waves', 'electricity']
  },
  {
    id: 'martial-arts',
    name: 'Martial Arts & Combat Sports',
    icon: '🥋',
    description: 'Boxing, karate, MMA, wrestling',
    examples: [
      'Punch force and momentum transfer',
      'Kick leverage and torque',
      'Wrestling takedown physics',
      'Board breaking technique',
      'Blocking and force distribution',
      'Grappling center of gravity'
    ],
    bestForTopics: ['forces', 'momentum', 'energy', 'rotational']
  },
  {
    id: 'outdoor',
    name: 'Camping & Outdoor Adventure',
    icon: '🏕️',
    description: 'Hiking, camping, survival skills',
    examples: [
      'Campfire heat radiation',
      'Tent pole structural forces',
      'Compass and Earth\'s magnetic field',
      'Flashlight beam optics',
      'Sound echoes in canyons',
      'Rope tension when climbing'
    ],
    bestForTopics: ['thermodynamics', 'magnetism', 'waves', 'forces']
  },
  {
    id: 'pets',
    name: 'Pets & Animals',
    icon: '🐕',
    description: 'Animal movement, behavior, and biology',
    examples: [
      'Dog running and jumping',
      'Cat landing on feet',
      'Fish swimming propulsion',
      'Bird flight and wing beats',
      'Cheetah acceleration',
      'Elephant trunk pressure'
    ],
    bestForTopics: ['kinematics', 'forces', 'fluids', 'energy']
  },
  {
    id: 'superheroes',
    name: 'Superhero Physics',
    icon: '🦸',
    description: 'Analyzing physics in comic books and superhero movies',
    examples: [
      'Superman flight and acceleration',
      'Spider-Man web swinging',
      'Hulk jumping distances',
      'Iron Man suit propulsion',
      'Flash running near light speed',
      'Captain America shield dynamics'
    ],
    bestForTopics: ['kinematics', 'forces', 'momentum', 'modern-physics']
  },
  {
    id: 'music-production',
    name: 'Music Production & Audio',
    icon: '🎧',
    description: 'Recording studios, speakers, and audio technology',
    examples: [
      'Speaker cone vibration',
      'Headphone driver physics',
      'Auto-tune and frequency',
      'Bass and subwoofer response',
      'Microphone sensitivity',
      'Noise-canceling technology'
    ],
    bestForTopics: ['waves', 'electricity', 'energy']
  },
  {
    id: 'fashion',
    name: 'Fashion & Textiles',
    icon: '👗',
    description: 'Clothing, fabric behavior, and wearable tech',
    examples: [
      'Fabric draping and gravity',
      'High heel pressure distribution',
      'Zipper mechanics',
      'Static cling and charging',
      'Waterproof material science',
      'Heated jacket technology'
    ],
    bestForTopics: ['forces', 'electricity', 'thermodynamics']
  },
  {
    id: 'social-media',
    name: 'Social Media & Content',
    icon: '📱',
    description: 'Content creation, streaming, and viral physics',
    examples: [
      'Viral physics experiment videos',
      'Slow-motion content creation',
      'Drone cinematography',
      'Ring light optics',
      'Green screen technology',
      'Time-lapse photography'
    ],
    bestForTopics: ['optics', 'waves', 'kinematics']
  },
  {
    id: 'workplace',
    name: 'Office & Workplace',
    icon: '🏢',
    description: 'Office equipment, ergonomics, and workplace physics',
    examples: [
      'Office chair wheel friction',
      'Standing desk stability',
      'Paper airplane contests',
      'Stapler lever mechanics',
      'Air conditioning thermodynamics',
      'Elevator counterweight systems'
    ],
    bestForTopics: ['forces', 'thermodynamics', 'kinematics', 'energy']
  },
  {
    id: 'circus',
    name: 'Circus & Acrobatics',
    icon: '🎪',
    description: 'Trapeze, juggling, and circus performances',
    examples: [
      'Trapeze swing pendulum',
      'Juggling projectile patterns',
      'Tightrope walker balance',
      'Human cannonball trajectory',
      'Contortionist flexibility',
      'Spinning plate gyroscopic effect'
    ],
    bestForTopics: ['kinematics', 'forces', 'rotational', 'momentum']
  },
  {
    id: 'forensics',
    name: 'Crime Scene & Forensics',
    icon: '🔍',
    description: 'CSI physics, accident reconstruction',
    examples: [
      'Blood spatter trajectory',
      'Bullet path analysis',
      'Car crash reconstruction',
      'Fingerprint detection optics',
      'Glass fracture patterns',
      'Fire spread dynamics'
    ],
    bestForTopics: ['kinematics', 'forces', 'momentum', 'optics']
  },
  {
    id: 'toys',
    name: 'Toys & Playground',
    icon: '🪀',
    description: 'Classic toys, playground equipment, and fun physics',
    examples: [
      'Yo-yo string tension',
      'Slinky wave motion',
      'Playground swing period',
      'Merry-go-round rotation',
      'Spinning top gyroscope',
      'Bouncy ball collision'
    ],
    bestForTopics: ['waves', 'rotational', 'kinematics', 'energy']
  },
  {
    id: 'restaurants',
    name: 'Restaurants & Food Service',
    icon: '🍽️',
    description: 'Restaurant equipment and food physics',
    examples: [
      'Pizza tossing rotation',
      'Wine glass acoustics',
      'Espresso machine pressure',
      'Bread rising gas expansion',
      'Ice dispenser mechanics',
      'Blowtorch caramelization'
    ],
    bestForTopics: ['rotational', 'waves', 'fluids', 'thermodynamics']
  },
  {
    id: 'art',
    name: 'Art & Sculpture',
    icon: '🎨',
    description: 'Artistic creation and physics in art',
    examples: [
      'Kinetic sculpture motion',
      'Paint mixing and color theory',
      'Mobile balance and tension',
      'Pottery wheel rotation',
      'Spray paint aerodynamics',
      'Glass blowing and heat'
    ],
    bestForTopics: ['rotational', 'forces', 'optics', 'thermodynamics']
  },
  {
    id: 'underwater',
    name: 'Underwater & Marine',
    icon: '🤿',
    description: 'Scuba diving, submarines, and ocean physics',
    examples: [
      'Scuba tank pressure changes',
      'Submarine buoyancy control',
      'Deep sea water pressure',
      'Sound travel underwater',
      'Coral reef wave protection',
      'Underwater camera optics'
    ],
    bestForTopics: ['fluids', 'waves', 'optics', 'forces']
  },
  {
    id: 'renewable-energy',
    name: 'Renewable Energy',
    icon: '🌱',
    description: 'Solar, wind, hydro, and green technology',
    examples: [
      'Solar panel photovoltaics',
      'Wind turbine rotation',
      'Hydroelectric dam power',
      'Electric car regenerative braking',
      'Heat pump efficiency',
      'Geothermal energy extraction'
    ],
    bestForTopics: ['energy', 'electricity', 'magnetism', 'fluids']
  },
  {
    id: 'magic',
    name: 'Magic Tricks & Illusions',
    icon: '🎩',
    description: 'Stage magic and the physics behind tricks',
    examples: [
      'Levitation illusion physics',
      'Card throwing aerodynamics',
      'Disappearing ball trajectory',
      'Mirror box reflections',
      'Coin sleight mechanics',
      'Floating table balance points'
    ],
    bestForTopics: ['optics', 'forces', 'kinematics']
  }
]

// ============================================================================
// LESSON STRUCTURE TEMPLATES
// ============================================================================

export interface LessonStructure {
  id: string
  name: string
  description: string
  sections: string[]
  estimatedWords: number
}

export const lessonStructures: LessonStructure[] = [
  {
    id: 'real-world-scenario',
    name: 'Real-World Scenario',
    description: 'Explain physics through a concrete, relatable situation',
    sections: [
      'The Situation (describe a real scenario where this physics occurs)',
      'The Physics (explain what\'s happening and why)',
      'How It Works (deeper explanation with examples)',
      'Key Takeaways (summarize the main concepts)',
      'Where You\'ll See This (other everyday examples)'
    ],
    estimatedWords: 800
  },
  {
    id: 'concept-explanation',
    name: 'Concept Explanation',
    description: 'Clear, direct explanation of a physics concept with examples',
    sections: [
      'Introduction (what we\'re learning and why it matters)',
      'The Core Concept (clear explanation of the physics)',
      'Examples in Action (2-3 practical examples)',
      'Common Misconceptions (what people often get wrong)',
      'Summary (key points to remember)'
    ],
    estimatedWords: 750
  },
  {
    id: 'problem-solving',
    name: 'Problem-Solving Focus',
    description: 'Learn physics by working through how to analyze real situations',
    sections: [
      'The Problem (present a real situation to analyze)',
      'What We Know (identify the relevant physics)',
      'Working Through It (step-by-step analysis)',
      'The Answer (solution and what it means)',
      'Practice Thinking (similar situations to consider)'
    ],
    estimatedWords: 850
  },
  {
    id: 'compare-contrast',
    name: 'Compare & Contrast',
    description: 'Understand physics by comparing related concepts or situations',
    sections: [
      'Two Situations (present scenarios that seem similar or different)',
      'What\'s the Same (common physics principles)',
      'What\'s Different (key distinctions)',
      'Why It Matters (practical implications)',
      'Quick Review (summary of comparisons)'
    ],
    estimatedWords: 700
  },
  {
    id: 'misconception-focus',
    name: 'Clearing Up Confusion',
    description: 'Address common misunderstandings about physics concepts',
    sections: [
      'What People Often Think (the misconception)',
      'Why It Seems Right (why people believe this)',
      'What\'s Actually Happening (the correct physics)',
      'Evidence and Examples (proof that supports the correct view)',
      'Getting It Right (how to think about it correctly)'
    ],
    estimatedWords: 750
  },
  {
    id: 'applications',
    name: 'Real Applications',
    description: 'Focus on how physics is used in technology, sports, or daily life',
    sections: [
      'The Application (what we\'re looking at)',
      'The Physics Behind It (the science that makes it work)',
      'Design and Engineering (how understanding physics helps)',
      'Variations and Examples (other applications of the same physics)',
      'Key Concepts Review (physics principles covered)'
    ],
    estimatedWords: 800
  },
  {
    id: 'day-in-life',
    name: 'A Day in the Life',
    description: 'Follow someone through their day, discovering physics everywhere',
    sections: [
      'Morning Routine (physics in waking up, getting ready)',
      'On the Move (transportation and travel physics)',
      'Work or School (physics in activities)',
      'Leisure Time (sports, entertainment, hobbies)',
      'Physics All Around (recap of concepts discovered)'
    ],
    estimatedWords: 900
  },
  {
    id: 'what-if',
    name: 'What If...?',
    description: 'Explore physics by asking hypothetical questions',
    sections: [
      'The Big Question (pose an interesting what-if scenario)',
      'Current Reality (how things actually work)',
      'Changing the Variables (what would happen if...)',
      'The Physics Explains (why things would change)',
      'Mind-Blowing Implications (surprising conclusions)'
    ],
    estimatedWords: 850
  },
  {
    id: 'detective',
    name: 'Physics Detective',
    description: 'Solve a mystery using physics principles',
    sections: [
      'The Mystery (present a puzzling situation)',
      'Gathering Clues (observations and measurements)',
      'Applying Physics (using principles to analyze)',
      'Case Solved (the physics-based explanation)',
      'Detective\'s Notebook (key physics concepts used)'
    ],
    estimatedWords: 850
  },
  {
    id: 'invention',
    name: 'The Invention Story',
    description: 'Learn physics through the story of an invention',
    sections: [
      'Before the Invention (the problem that needed solving)',
      'The Physics Insight (key understanding that led to solution)',
      'How It Works (detailed physics explanation)',
      'Impact and Evolution (how it changed things)',
      'Physics Principles at Work (concepts summary)'
    ],
    estimatedWords: 800
  },
  {
    id: 'sports-analysis',
    name: 'Sports Breakdown',
    description: 'Analyze a specific sport or athletic move',
    sections: [
      'The Athletic Challenge (what the athlete is trying to do)',
      'Breaking Down the Motion (kinematics and timing)',
      'Forces at Play (what pushes, pulls, and resists)',
      'Energy and Power (where energy comes from and goes)',
      'Tips from Physics (how science can improve performance)'
    ],
    estimatedWords: 850
  },
  {
    id: 'extreme-scenario',
    name: 'Extreme Physics',
    description: 'Explore physics in extreme environments or conditions',
    sections: [
      'The Extreme Environment (describe the unusual conditions)',
      'Normal vs Extreme (how physics behaves differently)',
      'Survival and Adaptation (how things cope)',
      'Engineering Solutions (technology for extremes)',
      'Core Physics Concepts (principles at work)'
    ],
    estimatedWords: 800
  },
  {
    id: 'myth-busters',
    name: 'Physics Myth Busters',
    description: 'Test popular myths and beliefs with physics',
    sections: [
      'The Myth (common belief to examine)',
      'Why People Believe It (intuitive reasoning)',
      'Setting Up the Test (how to analyze with physics)',
      'The Verdict (what physics actually says)',
      'Reality Check (correct understanding)'
    ],
    estimatedWords: 750
  },
  {
    id: 'historical-moment',
    name: 'Physics in History',
    description: 'Explore a historical event or discovery through physics',
    sections: [
      'Setting the Scene (historical context)',
      'The Physics Discovery or Event (what happened)',
      'Scientific Understanding (the physics involved)',
      'Impact on History (how it changed things)',
      'Connecting to Today (modern relevance)'
    ],
    estimatedWords: 850
  },
  {
    id: 'design-challenge',
    name: 'Design Challenge',
    description: 'Present a design problem and solve it with physics',
    sections: [
      'The Challenge (problem to solve)',
      'Physics Considerations (what factors matter)',
      'Design Options (different approaches)',
      'Optimal Solution (best physics-based design)',
      'Engineering Takeaways (design principles learned)'
    ],
    estimatedWords: 900
  },
  {
    id: 'tiny-to-huge',
    name: 'Scale Exploration',
    description: 'Explore how physics changes at different scales',
    sections: [
      'Everyday Scale (physics we experience)',
      'Going Small (microscopic world)',
      'Going Big (planetary and cosmic scale)',
      'Same Physics, Different Effects (scale dependencies)',
      'Big Picture Understanding (how scale matters)'
    ],
    estimatedWords: 800
  },
  {
    id: 'failure-analysis',
    name: 'When Physics Goes Wrong',
    description: 'Learn from engineering failures and accidents',
    sections: [
      'What Happened (describe the failure or accident)',
      'The Physics Behind the Failure (what went wrong)',
      'Warning Signs (what should have been noticed)',
      'Lessons Learned (how to prevent similar failures)',
      'Safety and Design Principles (key takeaways)'
    ],
    estimatedWords: 850
  },
  {
    id: 'future-tech',
    name: 'Future Technology',
    description: 'Explore emerging technology and the physics enabling it',
    sections: [
      'The Technology (what it is and does)',
      'Current State (where we are now)',
      'Physics Enabling Progress (key principles)',
      'Challenges Ahead (physics problems to solve)',
      'Possibilities and Potential (what could be possible)'
    ],
    estimatedWords: 800
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTermsByTopic(topicId: string): PhysicsTerm[] {
  const topic = physicsTopics.find(t => t.id === topicId)
  return topic?.terms || []
}

export function getAllTerms(): PhysicsTerm[] {
  return physicsTopics.flatMap(topic => topic.terms)
}

export function getEnvironmentsByTopic(topicId: string): RealWorldEnvironment[] {
  return realWorldEnvironments.filter(env => 
    env.bestForTopics.includes(topicId)
  )
}

export function getMasteryLevelById(levelId: string): MasteryLevel | undefined {
  return masteryLevels.find(l => l.id === levelId)
}

export function getTopicById(topicId: string): PhysicsTopic | undefined {
  return physicsTopics.find(t => t.id === topicId)
}

export function getEnvironmentById(envId: string): RealWorldEnvironment | undefined {
  return realWorldEnvironments.find(e => e.id === envId)
}

