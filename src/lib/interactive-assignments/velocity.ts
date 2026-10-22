import {parseForces} from './diagrams'
export const VELOCITY = {
  slug: 'day-3-velocity', title: 'Day 3 · Velocity: motion with direction', unit: 'unit-1', day: 3,
  targetSlug: 'u1.capture-pt-graph',
  targetNote: 'This assignment provides evidence about interpreting position–time graphs and velocity. Consider your classroom motion-detector observations when rating the full S1 target.',
} as const
export type Question = { id: string; part: number; prompt: string; unit?: string; answer?: number; tolerance?: number; options?: string[]; correct?: number; hint: string; explanation: string; independent?: boolean;diagram?:boolean;reflection?:boolean }
export const QUESTIONS: Question[] = [
  {id:'1a',part:1,prompt:'A student walks 6 m east, then 9 m west. What distance did she travel?',unit:'m',answer:15,hint:'Count all of the ground covered on both legs.',explanation:'6 m + 9 m = 15 m.'},
  {id:'1b',part:1,prompt:'Same walk. Call east positive. What is her displacement?',unit:'m',answer:-3,hint:'Use a positive change for east and a negative change for west.',explanation:'+6 m − 9 m = −3 m: 3 m west of the start.'},
  {id:'1c',part:1,prompt:'A runner does one full lap of a 400 m track and stops at the starting line. What is her displacement?',unit:'m',answer:0,hint:'Compare the final position with the starting position.',explanation:'The final position equals the starting position, so displacement is 0 m.'},
  {id:'2a',part:2,prompt:'A car drives 40 km due south in 0.5 h. What is the size of its average velocity?',unit:'km/h south',answer:80,hint:'Divide the displacement magnitude by the elapsed time.',explanation:'40 km ÷ 0.5 h = 80 km/h south.'},
  {id:'2b',part:2,prompt:'A dog runs 30 m out to fetch a ball and 30 m back to its owner. The trip takes 12 s. What is its average speed?',unit:'m/s',answer:5,hint:'Average speed uses the total distance for the whole trip.',explanation:'(30 m + 30 m) ÷ 12 s = 5 m/s.'},
  {id:'2c',part:2,prompt:'Same dog, same trip. What is its average velocity?',unit:'m/s',answer:0,hint:'Average velocity uses displacement, not distance.',explanation:'The dog finishes where it started: 0 m ÷ 12 s = 0 m/s.'},
  {id:'3a',part:3,prompt:'Highway traffic moves at 90 km/h. Convert to m/s.',unit:'m/s',answer:25,hint:'Multiply by 1000 m/km and by 1 h/3600 s.',explanation:'90 ÷ 3.6 = 25 m/s.'},
  {id:'3b',part:3,prompt:'A cyclist rides at 15 m/s. Convert to km/h.',unit:'km/h',answer:54,hint:'There are 3600 seconds in an hour and 1000 meters in a kilometer.',explanation:'15 × 3.6 = 54 km/h.'},
  {id:'3c',part:3,prompt:'In our 2026-XJ mission scenario, the asteroid approaches at 8,500 m/s. Convert to km/h.',unit:'km/h',answer:30600,hint:'Convert from m/s to km/h by multiplying by 3.6.',explanation:'8,500 × 3.6 = 30,600 km/h.'},
  {id:'3d',part:3,prompt:'Now convert 8,500 m/s to mph. Use 1 m/s ≈ 2.237 mph.',unit:'mph',answer:19014.5,tolerance:0.51,hint:'Multiply 8,500 by the supplied conversion factor.',explanation:'8,500 × 2.237 ≈ 19,014.5 mph (about 19,015 mph).'},
  {id:'4a',part:4,prompt:'A flat, horizontal line on a position–time graph means the object is…',options:['Moving at a constant nonzero speed','At rest (not moving)','Speeding up','Moving very fast'],correct:1,hint:'What happens to position as time passes?',explanation:'Position is not changing: slope 0 means velocity 0.'},
  {id:'4b',part:4,prompt:'Find the velocity of a walker whose position changes from 10 m at 0 s to 0 m at 5 s.',unit:'m/s',answer:-2,hint:'Slope = change in position ÷ change in time. Include direction.',explanation:'(0 − 10) m ÷ (5 − 0) s = −2 m/s.'},
  {id:'5a',part:5,prompt:'With the origin at the sensor, a walker heading toward it has a velocity of −1.2 m/s. Now move the origin to the far wall, with + pointing toward the sensor. Same walk. What is the velocity now?',options:['+1.2 m/s','−1.2 m/s','0 m/s','Can’t tell'],correct:0,hint:'The positive direction has reversed. Has the actual motion changed?',explanation:'The walker moves in the new positive direction, so velocity is +1.2 m/s. Moving the origin alone would not change velocity; reversing the axis does.'},
  {id:'6a',part:6,prompt:'The sensor is the origin and positive points away from it. A walker moves away from the sensor at a constant speed. Which position–time graph shows this?',options:['A · horizontal','B · straight rising line','C · curved rising line','D · straight falling line'],correct:1,hint:'',explanation:'A straight rising line has constant positive slope.',independent:true},
  {id:'6b',part:6,prompt:'In one or two sentences: what does the slope of your graph tell you, and how do you know it is constant?',hint:'',explanation:'Look for velocity as change in position per time, and equal changes in position over equal time intervals.',independent:true},
]
export type Attempt = { answer: string; correct: boolean }
export type VelocityState = { answers: Record<string,string>; attempts: Record<string,Attempt[]>; walker: number[]; matches: Record<string,{start:number;velocity:number}>; graph: {target:number;start:number;velocity:number}; conversion:number; explorers?:Record<string,number[]> }
export const emptyVelocityState = ():VelocityState => ({answers:{},attempts:{},walker:[0],matches:{},graph:{target:0,start:0,velocity:0},conversion:36})
export function correctAnswer(q:Question, answer:string) {
  if (!answer.trim()) return false
  if (q.options) return answer === String(q.correct)
  const n = Number(answer.replaceAll(',','').replace('−','-'))
  return q.answer !== undefined && Number.isFinite(n) && Math.abs(n-q.answer) <= (q.tolerance ?? 0.0001)
}
export function validateVelocityState(raw:unknown,questions:Question[]=QUESTIONS):VelocityState {
  if (!raw || typeof raw!=='object' || JSON.stringify(raw).length>80000) throw Error('Invalid assignment response.')
  const r=raw as Partial<VelocityState>, state=emptyVelocityState()
  for(const q of questions){
    const answer=r.answers?.[q.id]??''
    if(typeof answer!=='string'||answer.length>4000||(q.options&&answer!==''&&!q.options.some((_,i)=>answer===String(i))))throw Error('Invalid answer for '+q.id)
    if(q.diagram&&answer.trim()){let rawArrows:unknown;try{rawArrows=JSON.parse(answer)}catch{throw Error('Invalid force diagram for '+q.id)}if(!Array.isArray(rawArrows)||rawArrows.length===0||parseForces(answer).length!==rawArrows.length)throw Error('Invalid force diagram for '+q.id)}
    state.answers[q.id]=answer
    const tries=r.attempts?.[q.id]??[]
    if(!Array.isArray(tries)||tries.length>100)throw Error('Invalid attempt history.')
    // Correctness is recomputed. The exit ticket has no answer reveal or practice checks.
    state.attempts[q.id]=q.independent||q.reflection||(q.answer===undefined&&!q.options)?[]:tries.map(t=>{if(!t||typeof t.answer!=='string'||t.answer.length>4000)throw Error('Invalid attempt.');return {answer:t.answer,correct:correctAnswer(q,t.answer)}})
  }
  if(Array.isArray(r.walker)&&r.walker.length>0&&r.walker.length<=501&&r.walker[0]===0&&r.walker.every((n,i,a)=>Number.isInteger(n)&&Math.abs(n)<=5&&(!i||Math.abs(n-a[i-1])===1)))state.walker=r.walker
  if(r.graph&&Number.isInteger(r.graph.target)&&r.graph.target>=0&&r.graph.target<4&&Number.isFinite(r.graph.start)&&r.graph.start>=0&&r.graph.start<=10&&Number.isFinite(r.graph.velocity)&&Math.abs(r.graph.velocity)<=2)state.graph=r.graph
  if(Number.isFinite(r.conversion)&&r.conversion!>=0&&r.conversion!<=180)state.conversion=r.conversion!
  for(const [i,target] of GRAPH_TARGETS.entries()){const m=r.matches?.[String(i)];if(m&&Math.abs(m.start-target.start)<0.01&&Math.abs(m.velocity-target.velocity)<0.01)state.matches[String(i)]={start:m.start,velocity:m.velocity}}
  state.explorers={}
  if(r.explorers&&typeof r.explorers==='object')for(const [key,value] of Object.entries(r.explorers).slice(0,20)){
    if(!/^[a-z0-9-]{1,40}$/.test(key)||!Array.isArray(value)||value.length>1000||!value.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9))throw Error('Invalid exploration state.')
    state.explorers[key]=value
  }
  return state
}
export const GRAPH_TARGETS=[{start:0,velocity:1},{start:10,velocity:-1},{start:6,velocity:0},{start:2,velocity:0.5}]
export const missingVelocityAnswers=(s:VelocityState,questions:Question[]=QUESTIONS)=>questions.filter(q=>!s.answers[q.id]?.trim()).map(q=>q.id)
export function answerText(q:Question,value?:string){return value===undefined||value===''?'No response':q.options?q.options[Number(value)]??'Invalid choice':value+(q.unit?' '+q.unit:'')}
