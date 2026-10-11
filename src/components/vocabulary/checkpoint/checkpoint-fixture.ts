import type { CheckpointAttempt, CheckpointQuestion } from '@/lib/vocab-checkpoint'

/** Synthetic, local-preview content only. Answer keys must stay server-side in the production integration. */
export const CHECKPOINT_QUESTIONS: CheckpointQuestion[] = [
  { id: 'q1', part: 'recognize', points: 1, words: ['position'], prompt: 'Which word describes where an object is relative to a reference point?', options: ['Speed', 'Position', 'Distance', 'Trajectory'], answer: 1, explanation: 'Position tells where an object is relative to a reference point.' },
  { id: 'q2', part: 'recognize', points: 1, words: ['distance'], prompt: 'What do we call the total length of the path an object travels?', options: ['Displacement', 'Position', 'Distance', 'Velocity'], answer: 2, explanation: 'Distance measures the entire path traveled, including a return trip.' },
  { id: 'q3', part: 'recognize', points: 1, words: ['speed'], prompt: 'Which word tells how fast an object moves, without giving its direction?', options: ['Speed', 'Velocity', 'Position', 'Displacement'], answer: 0, explanation: 'Speed describes how fast. Velocity includes direction as well.' },
  { id: 'q4', part: 'recognize', points: 1, words: ['trajectory'], prompt: 'The path followed by a moving object is its…', options: ['Reference point', 'Speed', 'Displacement', 'Trajectory'], answer: 3, explanation: 'Trajectory describes the path an object follows through space.' },
  { id: 'q5', part: 'interpret', points: 2, words: ['distance', 'displacement'], scene: 'roundtrip', prompt: 'A rover drives to a marker, then returns to its starting point. Which statement is correct?', options: ['Its distance and displacement are both zero.', 'Its distance is greater than zero; its displacement is zero.', 'Its displacement is greater than its distance.', 'Its position never changed during the trip.'], answer: 1, explanation: 'The rover traveled a path, so its distance is positive. Its final position equals its initial position, so its displacement is zero.' },
  { id: 'q6', part: 'interpret', points: 2, words: ['velocity', 'speed'], prompt: 'A student reports that a cart is moving at “2 meters per second east.” What does this report describe?', options: ['Speed only', 'Distance', 'Velocity', 'Position only'], answer: 2, explanation: 'The report gives both how fast and in which direction, so it describes velocity.' },
  { id: 'q7', part: 'interpret', points: 2, words: ['position'], scene: 'track', prompt: 'A cart is at the 4-meter mark, measured east from a doorway. The “4 meters east of the doorway” describes its…', options: ['Position', 'Speed', 'Total distance traveled', 'Time'], answer: 0, explanation: 'The doorway is a reference point. A location relative to it is a position; it does not tell the cart’s whole travel history.' },
  { id: 'q8', part: 'interpret', points: 2, words: ['trajectory', 'displacement'], prompt: 'You trace a ball’s curved flight through the air. Which word names the whole curve you traced?', options: ['Speed', 'Displacement', 'Position', 'Trajectory'], answer: 3, explanation: 'The curved flight path is its trajectory. Displacement describes the change from the starting position to the ending position.' },
  { id: 'q9', part: 'explain', points: 4, words: ['distance', 'displacement'], scene: 'roundtrip', prompt: 'A rover drives away from its starting point and then returns. Explain why its distance is greater than zero while its displacement is zero.', frame: 'The distance is … because … . The displacement is … because … .', explanation: 'Distance counts the whole path traveled. Displacement is the change from initial to final position. The rover traveled a nonzero path but finished where it started.' },
  { id: 'q10', part: 'explain', points: 4, words: ['speed', 'velocity'], prompt: 'Two cyclists each travel at 3 meters per second. One rides east and the other west. Explain what is the same and what is different about their speed and velocity.', frame: 'Their speed is … . Their velocities are … because … .', explanation: 'Their speeds are the same: both move at 3 m/s. Their velocities differ because velocity includes direction, and they travel in opposite directions.' },
]

export const CHECKPOINT_WORDS = ['position', 'distance', 'displacement', 'speed', 'velocity', 'trajectory']
export interface CheckpointPreviewState {
  version: 1
  title: string
  course: string
  due: string
  instructions: string
  attempts: CheckpointAttempt[]
}

export function createCheckpointPreview(): CheckpointPreviewState {
  const answers = Object.fromEntries(CHECKPOINT_QUESTIONS.filter(q => q.options).map(q => [q.id, String(q.answer)]))
  const writing = { q9: 'The distance is the whole route the rover drove, so it traveled some distance. The displacement is zero because it ends at the same position where it started.', q10: 'They have the same speed because both travel 3 meters each second. Their velocities are different because one is east and the other is west.' }
  const make = (studentId: string, name: string, changes: Partial<CheckpointAttempt> = {}): CheckpointAttempt => ({ studentId, name, answers: {}, submitted: false, scores: {}, notes: {}, released: false, knowledge: null, ...changes })
  return { version: 1, title: 'Motion vocabulary checkpoint', course: 'Honors Physics · A', due: '', instructions: 'Use the words to show what you understand about motion. Short, clear explanations are enough.', attempts: [
    make('avery', 'Avery Morgan', { answers: { ...answers, ...writing, q3: '1', q10: 'Both move 3 meters every second, so their speed is the same. Their velocity is the same too.' }, submitted: true, scores: { q9: 4, q10: 2 }, notes: { q10: 'The speeds match, but the velocities differ: east and west are opposite directions. Include direction when you compare velocities.' }, released: true, knowledge: 3 }),
    make('blair', 'Blair Lewis', { answers: { ...answers, ...writing, q5: '0', q9: 'It drove out and came back. It traveled the whole way, but its displacement is zero because it is back at the start.', q10: 'They have the same speed, but they are going in different directions.' }, submitted: true }),
    make('casey', 'Casey Rivera', { answers: { ...answers, ...writing, q5: '0', q6: '0', q9: 'They are both zero because it came back.', q10: 'The speed is the same. Velocity is how fast they are going.' }, submitted: true, scores: { q9: 1 } }),
    make('devon', 'Devon Lee', { answers: { ...answers, ...writing }, submitted: true, scores: { q9: 4, q10: 4 } }),
    make('emery', 'Emery Patel'),
    make('finley', 'Finley Jordan', { answers: { q1: '1', q2: '2' } }),
    make('gale', 'Gale Chen'),
    make('harper', 'Harper Reed', { answers: { ...answers, ...writing, q6: '0' }, submitted: true, scores: { q9: 3, q10: 3 }, released: true, knowledge: 2 }),
  ] }
}
