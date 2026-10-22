import {rebuildVocabulary} from './vocab-rebuild'
import 'server-only'
import type { LearningWord } from './vocab-learning'
import type { CheckpointQuestion } from './vocab-checkpoint'
import { AUTHORED_CHECKPOINTS } from './vocab-checkpoint-bank'

/** Private starting content, returned only through the teacher authoring endpoint. */
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

export function draftCheckpoint(words: LearningWord[]): CheckpointQuestion[] {
  const rebuilt=rebuildVocabulary(words)
  if(rebuilt.length===10&&rebuilt.every(q=>q.prompt&&!q.prompt.startsWith('A student uses')))return rebuilt
  const selected = new Map(words.map(word => [word.term.trim().toLowerCase(), word.term]))
  const authored = AUTHORED_CHECKPOINTS.find(pack => pack.terms.length === words.length && pack.terms.every(term => selected.has(term.toLowerCase())))
  if (authored) return structuredClone(authored.questions).map(question => ({ ...question, words: question.words.map(term => selected.get(term.toLowerCase())!) }))
  const motion=['position','distance','displacement','speed','velocity','trajectory']
  if(words.length===6 && motion.every(t=>words.some(w=>w.term.toLowerCase()===t))) return CHECKPOINT_QUESTIONS.map(q=>({...q,words:q.words.map(t=>words.find(w=>w.term.toLowerCase()===t)!.term)}))
  return Array.from({length:10},(_,i)=>{
    const part=i<4?'recognize':i<8?'interpret':'explain'
    const word=words[i%words.length]
    const used=i<8?[word]:words.filter((_,j)=>j%2===i%2)
    const choices=[word,...words.filter(w=>w.id!==word.id).slice(0,3)].map(w=>w.term)
    const offset=i%4
    const options=[...choices.slice(4-offset),...choices.slice(0,4-offset)]
    const prompt=part==='recognize'?'Which word means: '+word.definition:part==='interpret'?'': 'Describe one specific situation that connects '+used.map(w=>w.term).join(', ')+'. Explain what each word means in that situation.'
    return {id:'q'+(i+1),part,points:i<4?1:i<8?2:4,words:used.map(w=>w.term),prompt,explanation:used.map(w=>w.term+': '+w.definition).join(' ') + (part==='explain'?' Award 0–2 for accurate meanings and 0–2 for a specific, correctly connected application.':''),...(part==='explain'?{frame:'In this situation, … means … because … .'}:{options,answer:offset})}
  })
}
