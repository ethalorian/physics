import { VocabularyTerm } from '@/types/assignment'

export interface VocabularySet {
  id: string
  name: string
  description?: string
  unit?: string
  lesson?: string
  terms: VocabularyTerm[]
  created_by?: string
  created_at: string
  updated_at: string
}

export const sampleVocabularySets: VocabularySet[] = [
  {
    id: 'vocab-set-motion',
    name: 'Motion and Kinematics Terms',
    description: 'Basic vocabulary for motion and kinematics',
    unit: 'unit-1',
    lesson: 'lesson-1-1',
    terms: [
      {
        id: 'term-velocity',
        term: 'Velocity',
        definition: 'The rate of change of displacement with respect to time; a vector quantity',
        category: 'Motion',
        difficulty: 'medium'
      },
      {
        id: 'term-acceleration',
        term: 'Acceleration',
        definition: 'The rate of change of velocity with respect to time; a vector quantity',
        category: 'Motion',
        difficulty: 'medium'
      },
      {
        id: 'term-displacement',
        term: 'Displacement',
        definition: 'The change in position of an object; a vector quantity',
        category: 'Motion',
        difficulty: 'easy'
      },
      {
        id: 'term-speed',
        term: 'Speed',
        definition: 'The rate of change of distance with respect to time; a scalar quantity',
        category: 'Motion',
        difficulty: 'easy'
      },
      {
        id: 'term-kinematics',
        term: 'Kinematics',
        definition: 'The branch of mechanics that describes motion without considering forces',
        category: 'Motion',
        difficulty: 'hard'
      }
    ],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab-set-forces',
    name: 'Forces and Newton\'s Laws',
    description: 'Key terms related to forces and Newton\'s laws',
    unit: 'unit-2',
    lesson: 'lesson-2-1',
    terms: [
      {
        id: 'term-force',
        term: 'Force',
        definition: 'A push or pull that can cause an object to accelerate; a vector quantity',
        category: 'Forces',
        difficulty: 'easy'
      },
      {
        id: 'term-inertia',
        term: 'Inertia',
        definition: 'The tendency of an object to resist changes in its motion',
        category: 'Forces',
        difficulty: 'medium'
      },
      {
        id: 'term-friction',
        term: 'Friction',
        definition: 'A force that opposes motion between surfaces in contact',
        category: 'Forces',
        difficulty: 'easy'
      },
      {
        id: 'term-normal-force',
        term: 'Normal Force',
        definition: 'The perpendicular contact force between surfaces',
        category: 'Forces',
        difficulty: 'medium'
      },
      {
        id: 'term-net-force',
        term: 'Net Force',
        definition: 'The vector sum of all forces acting on an object',
        category: 'Forces',
        difficulty: 'medium'
      }
    ],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vocab-set-energy',
    name: 'Energy and Work Vocabulary',
    description: 'Essential energy and work terminology',
    unit: 'unit-3',
    lesson: 'lesson-3-1',
    terms: [
      {
        id: 'term-kinetic-energy',
        term: 'Kinetic Energy',
        definition: 'Energy possessed by an object due to its motion',
        category: 'Energy',
        difficulty: 'medium'
      },
      {
        id: 'term-potential-energy',
        term: 'Potential Energy',
        definition: 'Stored energy due to position or configuration',
        category: 'Energy',
        difficulty: 'medium'
      },
      {
        id: 'term-work',
        term: 'Work',
        definition: 'Energy transferred to or from an object via the application of force',
        category: 'Energy',
        difficulty: 'medium'
      },
      {
        id: 'term-power',
        term: 'Power',
        definition: 'The rate at which work is done or energy is transferred',
        category: 'Energy',
        difficulty: 'hard'
      },
      {
        id: 'term-conservation-energy',
        term: 'Conservation of Energy',
        definition: 'Energy cannot be created or destroyed, only transformed',
        category: 'Energy',
        difficulty: 'hard'
      }
    ],
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export function initializeVocabularyData() {
  try {
    const existing = localStorage.getItem('physics-vocabulary-sets')
    if (!existing) {
      localStorage.setItem('physics-vocabulary-sets', JSON.stringify(sampleVocabularySets))
      console.log('Initialized sample vocabulary data')
    }
  } catch (error) {
    console.error('Error initializing vocabulary data:', error)
  }
}
