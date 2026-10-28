import type {Quiz, QuizTarget} from './types'

export const QUIZ_HEADER_TOPICS = {
  motion: 'Motion and acceleration',
  forces: 'Forces and equilibrium',
  gravity: 'Gravity and orbits',
  momentum: 'Momentum and collisions',
  energy: 'Work and energy',
  thermal: 'Heat and thermodynamics',
  waves: 'Waves and sound',
  optics: 'Light and optics',
  electricity: 'Electricity and circuits',
  magnetism: 'Magnetism and induction',
  engineering: 'Engineering and design',
  measurement: 'Measurement and investigation',
} as const

export type QuizHeaderTopic = keyof typeof QUIZ_HEADER_TOPICS
type HeaderQuiz = Pick<Quiz, 'title' | 'questions'>

// Specific subjects precede broader words such as force, energy, and motion.
const TOPICS: readonly [QuizHeaderTopic, RegExp][] = [
  ['engineering', /\b(car project|engineering|design process|prototype|gears?|hydraulics?|pneumatics?|syringe|sled|organizer|community room|build a stand)\b/i],
  ['optics', /\b(light|optics?|refraction|reflection|lenses?|mirrors?|spectrum)\b/i],
  ['waves', /\b(waves?|sound|oscillat\w*|resonance|frequenc\w*|wavelength|interference|superposition|harmonics?|vibrat\w*)\b/i],
  ['magnetism', /\b(magnet\w*|induction|electromagnet\w*|faraday|oersted|motors?|generators?)\b/i],
  ['electricity', /\b(electric\w*|circuits?|current|voltage|resistance|ohm\w*|coulomb\w*|charges?|series|parallel)\b/i],
  ['thermal', /\b(heat|thermal|thermodynamic\w*|temperature|conduction|convection|radiation|phase changes?|latent|internal energy|kinetic theory|heat engines?|second law of thermodynamics)\b/i],
  ['gravity', /\b(gravit\w*|orbits?|orbital|kepler\w*|projectiles?|free[ -]fall|weightlessness|circular|centripetal|mass.{0,12}weight)\b/i],
  ['momentum', /\b(momentum|impulse|collisions?|inelastic|elastic collisions?|recoil|stopping time)\b/i],
  ['energy', /\b(energy|work|power|efficiency|dissipation|springs?)\b/i],
  ['forces', /\b(forces?|newton\w*|inertia|friction|equilibrium|tension|compression|torque|free[ -]body|f\s*=\s*ma)\b/i],
  ['motion', /\b(motion|kinematic\w*|velocity|speed|acceleration|displacement|distance|position|vectors?|graphs?)\b/i],
  ['measurement', /\b(measur\w*|units|dimensions?|precision|uncertainty|significant|scale|ruler|tape|fractions?|tolerance|metrology)\b/i],
]

// Current eight-unit course sequence (also used by the reading syllabus).
const UNIT_TOPICS: Readonly<Record<string, QuizHeaderTopic>> = {
  'unit-1': 'motion', 'unit-2': 'gravity', 'unit-3': 'momentum',
  'unit-4': 'energy', 'unit-5': 'thermal', 'unit-6': 'waves',
  'unit-7': 'electricity', 'unit-8': 'engineering',
  'trades-etf-1': 'measurement', 'trades-etf-2': 'engineering',
  'trades-etf-3': 'engineering', 'trades-etf-4': 'electricity',
}

function topicIn(text: string): QuizHeaderTopic | undefined {
  return TOPICS.find(([, pattern]) => pattern.test(text))?.[0]
}

function mostCommon(topics: QuizHeaderTopic[]): QuizHeaderTopic | undefined {
  const counts = new Map<QuizHeaderTopic, number>()
  for (const topic of topics) counts.set(topic, (counts.get(topic) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
}

/** Use the same public content in teacher and student views; never use answer keys or reading levels. */
export function quizHeaderTopic(quiz: HeaderQuiz, targets: readonly QuizTarget[] = []): QuizHeaderTopic {
  const ids = new Set(quiz.questions.map(question => question.target_id))
  const selected = targets.filter(target => ids.has(target.id))
  return topicIn(quiz.title)
    ?? mostCommon(selected.flatMap(target => {
      const match = topicIn(target.statement)
      return match ? [match] : []
    }))
    ?? mostCommon(selected.flatMap(target => UNIT_TOPICS[target.unit_id] ? [UNIT_TOPICS[target.unit_id]] : []))
    ?? mostCommon(quiz.questions.flatMap(question => {
      const match = topicIn(question.prompt)
      return match ? [match] : []
    }))
    ?? 'measurement'
}
