import { Unit } from '@/types/question-bank'

export const physicsUnits: Unit[] = [
  {
    id: 'unit-1',
    name: 'Motion and Kinematics',
    description: 'Study of motion, velocity, acceleration, and the relationships between them',
    order_index: 1,
    lessons: [
      {
        id: 'lesson-1-1',
        unit_id: 'unit-1',
        name: 'Introduction to Motion',
        description: 'Position, distance, and displacement',
        order_index: 1,
        objectives: [
          'Distinguish between distance and displacement',
          'Calculate average speed and velocity',
          'Interpret position-time graphs'
        ]
      },
      {
        id: 'lesson-1-2',
        unit_id: 'unit-1',
        name: 'Velocity and Speed',
        description: 'Understanding velocity as a vector quantity',
        order_index: 2,
        objectives: [
          'Differentiate between speed and velocity',
          'Calculate instantaneous and average velocity',
          'Analyze velocity-time graphs'
        ]
      },
      {
        id: 'lesson-1-3',
        unit_id: 'unit-1',
        name: 'Acceleration',
        description: 'Rate of change of velocity',
        order_index: 3,
        objectives: [
          'Define and calculate acceleration',
          'Solve problems using kinematic equations',
          'Understand uniform acceleration'
        ]
      },
      {
        id: 'lesson-1-4',
        unit_id: 'unit-1',
        name: 'Free Fall',
        description: 'Motion under gravity',
        order_index: 4,
        objectives: [
          'Apply kinematics to free fall problems',
          'Understand that all objects fall at the same rate',
          'Calculate maximum height and time of flight'
        ]
      }
    ]
  },
  {
    id: 'unit-2',
    name: 'Forces and Newton\'s Laws',
    description: 'Understanding forces and their effects on motion',
    order_index: 2,
    lessons: [
      {
        id: 'lesson-2-1',
        unit_id: 'unit-2',
        name: 'Introduction to Forces',
        description: 'What are forces and how do we represent them',
        order_index: 1,
        objectives: [
          'Identify different types of forces',
          'Draw and interpret force diagrams',
          'Understand force as a vector'
        ]
      },
      {
        id: 'lesson-2-2',
        unit_id: 'unit-2',
        name: 'Newton\'s First Law',
        description: 'Law of inertia',
        order_index: 2,
        objectives: [
          'Explain the concept of inertia',
          'Identify balanced and unbalanced forces',
          'Apply the first law to real situations'
        ]
      },
      {
        id: 'lesson-2-3',
        unit_id: 'unit-2',
        name: 'Newton\'s Second Law',
        description: 'F = ma relationship',
        order_index: 3,
        objectives: [
          'Apply F = ma to solve problems',
          'Calculate net force',
          'Understand mass vs weight'
        ]
      },
      {
        id: 'lesson-2-4',
        unit_id: 'unit-2',
        name: 'Newton\'s Third Law',
        description: 'Action and reaction forces',
        order_index: 4,
        objectives: [
          'Identify action-reaction pairs',
          'Explain why forces don\'t cancel',
          'Apply to collision problems'
        ]
      },
      {
        id: 'lesson-2-5',
        unit_id: 'unit-2',
        name: 'Friction',
        description: 'Static and kinetic friction',
        order_index: 5,
        objectives: [
          'Calculate friction forces',
          'Distinguish static and kinetic friction',
          'Solve problems with friction'
        ]
      }
    ]
  },
  {
    id: 'unit-3',
    name: 'Energy and Work',
    description: 'Conservation of energy and the work-energy theorem',
    order_index: 3,
    lessons: [
      {
        id: 'lesson-3-1',
        unit_id: 'unit-3',
        name: 'Work and Power',
        description: 'Defining work in physics',
        order_index: 1,
        objectives: [
          'Calculate work done by forces',
          'Understand when work is positive or negative',
          'Calculate power'
        ]
      },
      {
        id: 'lesson-3-2',
        unit_id: 'unit-3',
        name: 'Kinetic Energy',
        description: 'Energy of motion',
        order_index: 2,
        objectives: [
          'Calculate kinetic energy',
          'Apply work-energy theorem',
          'Understand KE = ½mv²'
        ]
      },
      {
        id: 'lesson-3-3',
        unit_id: 'unit-3',
        name: 'Potential Energy',
        description: 'Gravitational and elastic potential energy',
        order_index: 3,
        objectives: [
          'Calculate gravitational PE',
          'Understand elastic PE in springs',
          'Identify reference points for PE'
        ]
      },
      {
        id: 'lesson-3-4',
        unit_id: 'unit-3',
        name: 'Conservation of Energy',
        description: 'Energy cannot be created or destroyed',
        order_index: 4,
        objectives: [
          'Apply energy conservation to solve problems',
          'Analyze energy transformations',
          'Include friction in energy problems'
        ]
      }
    ]
  },
  {
    id: 'unit-4',
    name: 'Momentum and Collisions',
    description: 'Linear momentum and its conservation',
    order_index: 4,
    lessons: [
      {
        id: 'lesson-4-1',
        unit_id: 'unit-4',
        name: 'Linear Momentum',
        description: 'Definition and calculation of momentum',
        order_index: 1,
        objectives: [
          'Calculate momentum (p = mv)',
          'Understand momentum as a vector',
          'Relate impulse to momentum change'
        ]
      },
      {
        id: 'lesson-4-2',
        unit_id: 'unit-4',
        name: 'Conservation of Momentum',
        description: 'Momentum in isolated systems',
        order_index: 2,
        objectives: [
          'Apply momentum conservation',
          'Solve explosion problems',
          'Analyze recoil situations'
        ]
      },
      {
        id: 'lesson-4-3',
        unit_id: 'unit-4',
        name: 'Elastic Collisions',
        description: 'Collisions where KE is conserved',
        order_index: 3,
        objectives: [
          'Identify elastic collisions',
          'Apply both momentum and KE conservation',
          'Solve elastic collision problems'
        ]
      },
      {
        id: 'lesson-4-4',
        unit_id: 'unit-4',
        name: 'Inelastic Collisions',
        description: 'Collisions where objects stick together',
        order_index: 4,
        objectives: [
          'Analyze perfectly inelastic collisions',
          'Calculate energy lost in collisions',
          'Apply to real-world crashes'
        ]
      }
    ]
  },
  {
    id: 'unit-5',
    name: 'Waves and Sound',
    description: 'Properties of waves and sound phenomena',
    order_index: 5,
    lessons: [
      {
        id: 'lesson-5-1',
        unit_id: 'unit-5',
        name: 'Wave Properties',
        description: 'Amplitude, wavelength, frequency, and speed',
        order_index: 1,
        objectives: [
          'Identify wave characteristics',
          'Use v = fλ relationship',
          'Distinguish transverse and longitudinal waves'
        ]
      },
      {
        id: 'lesson-5-2',
        unit_id: 'unit-5',
        name: 'Sound Waves',
        description: 'Properties of sound in different media',
        order_index: 2,
        objectives: [
          'Understand sound as pressure waves',
          'Calculate sound speed in materials',
          'Relate frequency to pitch'
        ]
      },
      {
        id: 'lesson-5-3',
        unit_id: 'unit-5',
        name: 'Wave Interference',
        description: 'Constructive and destructive interference',
        order_index: 3,
        objectives: [
          'Predict interference patterns',
          'Understand beats',
          'Apply to noise cancellation'
        ]
      },
      {
        id: 'lesson-5-4',
        unit_id: 'unit-5',
        name: 'Resonance and Standing Waves',
        description: 'Natural frequencies and resonance',
        order_index: 4,
        objectives: [
          'Identify resonance conditions',
          'Calculate harmonics',
          'Understand musical instruments'
        ]
      }
    ]
  },
  {
    id: 'unit-6',
    name: 'Electricity and Magnetism',
    description: 'Basic concepts of electricity and circuits',
    order_index: 6,
    lessons: [
      {
        id: 'lesson-6-1',
        unit_id: 'unit-6',
        name: 'Electric Charge and Force',
        description: 'Static electricity and Coulomb\'s law',
        order_index: 1,
        objectives: [
          'Understand charge conservation',
          'Calculate electric forces',
          'Explain charging methods'
        ]
      },
      {
        id: 'lesson-6-2',
        unit_id: 'unit-6',
        name: 'Electric Current',
        description: 'Flow of charge in circuits',
        order_index: 2,
        objectives: [
          'Define current, voltage, and resistance',
          'Apply Ohm\'s law',
          'Understand circuit basics'
        ]
      },
      {
        id: 'lesson-6-3',
        unit_id: 'unit-6',
        name: 'Series and Parallel Circuits',
        description: 'Different circuit configurations',
        order_index: 3,
        objectives: [
          'Analyze series circuits',
          'Analyze parallel circuits',
          'Calculate equivalent resistance'
        ]
      },
      {
        id: 'lesson-6-4',
        unit_id: 'unit-6',
        name: 'Magnetism',
        description: 'Magnetic fields and electromagnetic induction',
        order_index: 4,
        objectives: [
          'Understand magnetic fields',
          'Explain electromagnets',
          'Apply right-hand rule'
        ]
      }
    ]
  }
]
