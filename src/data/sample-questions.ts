import { QuestionBankItem } from '@/types/question-bank'
import { MultipleChoiceQuestion, OpenResponseQuestion, NumericalQuestion } from '@/types/assignment'

export const sampleQuestions: QuestionBankItem[] = [
  // Unit 1: Motion and Kinematics
  {
    id: 'qb-001',
    question: {
      id: 'q-001',
      type: 'multiple-choice',
      question: 'A car travels 100 meters in 5 seconds. What is its average speed?',
      points: 5,
      options: ['10 m/s', '15 m/s', '20 m/s', '25 m/s', '500 m/s'],
      correctAnswer: 2,
      explanation: 'Average speed = distance/time = 100m/5s = 20 m/s'
    } as MultipleChoiceQuestion,
    unit: 'unit-1',
    lesson: 'lesson-1-1',
    topics: ['speed', 'average velocity', 'kinematics'],
    difficulty: 'easy',
    usage_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: ['calculation', 'formula'],
    estimated_time: 2,
    cognitive_level: 'apply'
  },
  {
    id: 'qb-002',
    question: {
      id: 'q-002',
      type: 'open-response',
      question: 'Explain the difference between distance and displacement. Give an example where they are different.',
      points: 10,
      rubric: [],
      correctConcepts: [
        'Distance is total path length',
        'Displacement is straight-line distance from start to end',
        'Displacement is a vector with direction',
        'Distance is always positive or zero'
      ],
      commonMisconceptions: [
        'Distance and displacement are the same',
        'Displacement is always larger than distance'
      ],
      sampleAnswer: 'Distance is the total length of the path traveled, while displacement is the straight-line distance from the starting point to the ending point. Displacement includes direction (it\'s a vector), while distance does not (it\'s a scalar). For example, if you walk 3 meters east and then 4 meters north, your distance traveled is 7 meters, but your displacement is 5 meters northeast (using the Pythagorean theorem).',
      autoGrade: true
    } as OpenResponseQuestion,
    unit: 'unit-1',
    lesson: 'lesson-1-1',
    topics: ['distance', 'displacement', 'vectors'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    tags: ['conceptual', 'comparison'],
    estimated_time: 5,
    cognitive_level: 'understand'
  },
  {
    id: 'qb-003',
    question: {
      id: 'q-003',
      type: 'numerical',
      question: 'A ball is dropped from a height of 45 meters. How long does it take to hit the ground? (Use g = 10 m/s²)',
      points: 8,
      correctValue: 3,
      unit: 's',
      tolerance: 0.1
    } as NumericalQuestion,
    unit: 'unit-1',
    lesson: 'lesson-1-4',
    topics: ['free fall', 'kinematics', 'gravity'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    tags: ['calculation', 'free fall'],
    estimated_time: 3,
    cognitive_level: 'apply'
  },

  // Unit 2: Forces and Newton's Laws
  {
    id: 'qb-004',
    question: {
      id: 'q-004',
      type: 'multiple-choice',
      question: 'According to Newton\'s first law, an object at rest will:',
      points: 5,
      options: [
        'Always remain at rest',
        'Start moving on its own',
        'Remain at rest unless acted upon by an unbalanced force',
        'Eventually start moving due to gravity',
        'Slow down over time'
      ],
      correctAnswer: 2,
      explanation: 'Newton\'s first law states that an object at rest stays at rest unless acted upon by an unbalanced force.'
    } as MultipleChoiceQuestion,
    unit: 'unit-2',
    lesson: 'lesson-2-2',
    topics: ['Newton\'s first law', 'inertia', 'forces'],
    difficulty: 'easy',
    usage_count: 0,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    tags: ['conceptual', 'laws'],
    estimated_time: 1,
    cognitive_level: 'remember'
  },
  {
    id: 'qb-005',
    question: {
      id: 'q-005',
      type: 'numerical',
      question: 'A 15 kg box is pushed with a force of 60 N. What is its acceleration?',
      points: 6,
      correctValue: 4,
      unit: 'm/s²',
      tolerance: 0.1
    } as NumericalQuestion,
    unit: 'unit-2',
    lesson: 'lesson-2-3',
    topics: ['Newton\'s second law', 'F=ma', 'acceleration'],
    difficulty: 'easy',
    usage_count: 0,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    tags: ['calculation', 'F=ma'],
    estimated_time: 2,
    cognitive_level: 'apply'
  },
  {
    id: 'qb-006',
    question: {
      id: 'q-006',
      type: 'open-response',
      question: 'When you jump off a small boat onto a dock, the boat moves backward. Explain this phenomenon using Newton\'s laws.',
      points: 10,
      rubric: [],
      correctConcepts: [
        'Newton\'s third law - action and reaction',
        'You push on the boat, boat pushes back on you',
        'Forces are equal and opposite',
        'Momentum conservation'
      ],
      commonMisconceptions: [
        'The boat moves because of wind or water',
        'Only the person exerts a force',
        'The forces cancel out'
      ],
      sampleAnswer: 'This phenomenon is explained by Newton\'s third law of motion. When you jump forward onto the dock, you push backward on the boat with your feet. According to Newton\'s third law, for every action there is an equal and opposite reaction. Therefore, as you push the boat backward, the boat pushes you forward with an equal force. Since the boat is free to move on the water and has less mass than you plus the dock system, it accelerates backward noticeably.',
      autoGrade: true
    } as OpenResponseQuestion,
    unit: 'unit-2',
    lesson: 'lesson-2-4',
    topics: ['Newton\'s third law', 'action-reaction', 'momentum'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z',
    tags: ['conceptual', 'real-world'],
    estimated_time: 5,
    cognitive_level: 'analyze'
  },

  // Unit 3: Energy and Work
  {
    id: 'qb-007',
    question: {
      id: 'q-007',
      type: 'multiple-choice',
      question: 'When the speed of an object doubles, its kinetic energy:',
      points: 6,
      options: [
        'Doubles',
        'Halves',
        'Quadruples',
        'Stays the same',
        'Increases by √2'
      ],
      correctAnswer: 2,
      explanation: 'Kinetic energy = ½mv². When velocity doubles, KE increases by a factor of 4 (2²).'
    } as MultipleChoiceQuestion,
    unit: 'unit-3',
    lesson: 'lesson-3-2',
    topics: ['kinetic energy', 'velocity relationship'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-07T00:00:00Z',
    updated_at: '2024-01-07T00:00:00Z',
    tags: ['conceptual', 'energy'],
    estimated_time: 2,
    cognitive_level: 'understand'
  },
  {
    id: 'qb-008',
    question: {
      id: 'q-008',
      type: 'numerical',
      question: 'How much work is done lifting a 20 kg box to a height of 3 meters? (Use g = 10 m/s²)',
      points: 7,
      correctValue: 600,
      unit: 'J',
      tolerance: 10
    } as NumericalQuestion,
    unit: 'unit-3',
    lesson: 'lesson-3-1',
    topics: ['work', 'gravitational potential energy'],
    difficulty: 'easy',
    usage_count: 0,
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-08T00:00:00Z',
    tags: ['calculation', 'work-energy'],
    estimated_time: 3,
    cognitive_level: 'apply'
  },
  {
    id: 'qb-009',
    question: {
      id: 'q-009',
      type: 'open-response',
      question: 'A roller coaster starts from rest at the top of a 40-meter hill. Ignoring friction, what is its speed at the bottom? Show your work using energy conservation.',
      points: 12,
      rubric: [],
      correctConcepts: [
        'Conservation of energy',
        'PE at top converts to KE at bottom',
        'mgh = ½mv²',
        'Mass cancels out',
        'v = √(2gh)'
      ],
      commonMisconceptions: [
        'Heavier cars go faster',
        'Need to know the mass',
        'Friction can be ignored means no energy loss'
      ],
      sampleAnswer: 'Using conservation of energy: Initial PE = Final KE. At the top: PE = mgh = mg(40). At the bottom: KE = ½mv². Setting them equal: mgh = ½mv². The mass cancels: gh = ½v². Solving for v: v = √(2gh) = √(2 × 10 × 40) = √800 = 28.3 m/s. The speed at the bottom is approximately 28.3 m/s.',
      autoGrade: true
    } as OpenResponseQuestion,
    unit: 'unit-3',
    lesson: 'lesson-3-4',
    topics: ['energy conservation', 'PE to KE conversion'],
    difficulty: 'hard',
    usage_count: 0,
    created_at: '2024-01-09T00:00:00Z',
    updated_at: '2024-01-09T00:00:00Z',
    tags: ['calculation', 'problem-solving'],
    estimated_time: 7,
    cognitive_level: 'apply'
  },

  // Unit 4: Momentum and Collisions
  {
    id: 'qb-010',
    question: {
      id: 'q-010',
      type: 'numerical',
      question: 'A 1000 kg car moving at 20 m/s collides with a stationary 1500 kg car. If they stick together, what is their final velocity?',
      points: 10,
      correctValue: 8,
      unit: 'm/s',
      tolerance: 0.5
    } as NumericalQuestion,
    unit: 'unit-4',
    lesson: 'lesson-4-4',
    topics: ['inelastic collision', 'momentum conservation'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    tags: ['calculation', 'collisions'],
    estimated_time: 5,
    cognitive_level: 'apply'
  },
  {
    id: 'qb-011',
    question: {
      id: 'q-011',
      type: 'multiple-choice',
      question: 'In an elastic collision between two objects:',
      points: 6,
      options: [
        'Only momentum is conserved',
        'Only kinetic energy is conserved',
        'Both momentum and kinetic energy are conserved',
        'Neither momentum nor kinetic energy is conserved',
        'The objects stick together'
      ],
      correctAnswer: 2,
      explanation: 'In elastic collisions, both momentum and kinetic energy are conserved.'
    } as MultipleChoiceQuestion,
    unit: 'unit-4',
    lesson: 'lesson-4-3',
    topics: ['elastic collision', 'conservation laws'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-11T00:00:00Z',
    updated_at: '2024-01-11T00:00:00Z',
    tags: ['conceptual', 'conservation'],
    estimated_time: 2,
    cognitive_level: 'remember'
  },

  // Unit 5: Waves and Sound
  {
    id: 'qb-012',
    question: {
      id: 'q-012',
      type: 'numerical',
      question: 'A wave has a frequency of 500 Hz and a wavelength of 0.68 m. What is its speed?',
      points: 6,
      correctValue: 340,
      unit: 'm/s',
      tolerance: 5
    } as NumericalQuestion,
    unit: 'unit-5',
    lesson: 'lesson-5-1',
    topics: ['wave speed', 'frequency', 'wavelength'],
    difficulty: 'easy',
    usage_count: 0,
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
    tags: ['calculation', 'waves'],
    estimated_time: 2,
    cognitive_level: 'apply'
  },
  {
    id: 'qb-013',
    question: {
      id: 'q-013',
      type: 'open-response',
      question: 'Explain how noise-canceling headphones work using the principle of wave interference.',
      points: 10,
      rubric: [],
      correctConcepts: [
        'Destructive interference',
        'Waves 180° out of phase',
        'Microphone detects ambient noise',
        'Speaker produces inverted wave',
        'Waves cancel when combined'
      ],
      commonMisconceptions: [
        'They just block sound physically',
        'They absorb all sound',
        'They reflect sound away'
      ],
      sampleAnswer: 'Noise-canceling headphones use destructive interference to reduce unwanted sound. They have a microphone that detects ambient noise. The headphone\'s electronics then generate a sound wave that is 180 degrees out of phase (inverted) with the detected noise. When this inverted wave is played through the speaker, it combines with the original noise wave. Since the waves are opposite in phase, they cancel each other out through destructive interference, resulting in reduced noise.',
      autoGrade: true
    } as OpenResponseQuestion,
    unit: 'unit-5',
    lesson: 'lesson-5-3',
    topics: ['interference', 'sound waves', 'technology'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-13T00:00:00Z',
    updated_at: '2024-01-13T00:00:00Z',
    tags: ['conceptual', 'application'],
    estimated_time: 5,
    cognitive_level: 'analyze'
  },

  // Unit 6: Electricity
  {
    id: 'qb-014',
    question: {
      id: 'q-014',
      type: 'numerical',
      question: 'A circuit has a 12V battery and a resistance of 4Ω. What is the current?',
      points: 5,
      correctValue: 3,
      unit: 'A',
      tolerance: 0.1
    } as NumericalQuestion,
    unit: 'unit-6',
    lesson: 'lesson-6-2',
    topics: ['Ohm\'s law', 'current', 'voltage'],
    difficulty: 'easy',
    usage_count: 0,
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
    tags: ['calculation', 'circuits'],
    estimated_time: 2,
    cognitive_level: 'apply'
  },
  {
    id: 'qb-015',
    question: {
      id: 'q-015',
      type: 'multiple-choice',
      question: 'In a parallel circuit with three identical bulbs, if one bulb burns out:',
      points: 6,
      options: [
        'All bulbs go out',
        'The other two bulbs get dimmer',
        'The other two bulbs get brighter',
        'The other two bulbs stay the same brightness',
        'Only one other bulb stays lit'
      ],
      correctAnswer: 3,
      explanation: 'In a parallel circuit, each branch is independent. If one bulb burns out, the others continue to receive the same voltage and current.'
    } as MultipleChoiceQuestion,
    unit: 'unit-6',
    lesson: 'lesson-6-3',
    topics: ['parallel circuits', 'current flow'],
    difficulty: 'medium',
    usage_count: 0,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    tags: ['conceptual', 'circuits'],
    estimated_time: 2,
    cognitive_level: 'understand'
  }
]
