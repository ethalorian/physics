import {demand} from './assessment-demand'
import type {CheckpointQuestion} from './vocab-checkpoint'
import {AUTHORED_CHECKPOINTS} from './vocab-checkpoint-bank'
type Word={term:string;definition:string}
type Item=[string,string[],number,string,string[]]
const examples:Record<string,Item[]>={
 dimension:[
 ['A drawing says NTS, but its dimension says 150 mm. How should you set the layout on a blank?',['Measure the printed line with a ruler','Use the stated 150 mm dimension from the specified datum','Multiply the printed length by 150','Ignore the dimension because NTS means no dimensions'],1,'NTS means not to scale. Use the specified dimension and reference datum.',['NTS','dimension','layout','blank','datum']],
 ['A 3/4 inch feature must be marked from a datum. Which mark matches that fraction?',['0.25 in','0.5 in','0.75 in','1.75 in'],2,'3 divided by 4 is 0.75; measure that distance from the datum.',['fraction','datum']],
 ['A cardboard stand is tested before the final part is cut. What is its role?',['A finished blank','A prototype that tests the design','A replacement for every dimension','A datum that cannot change'],1,'A prototype lets the designer test function and identify needed changes.',['prototype']],
 ['The first stand tips with a phone on it. Which revision best addresses the test evidence?',['Change its color','Use smaller lettering','Widen the base and retest with the same phone','Remove the phone from every later test'],2,'Widening and retesting the support base addresses tipping under the original load.',['revision','prototype']],
 ],
 component:[
 ['A point is (3,−2) m with east +x and north +y. Where is it?',['3 m east and 2 m south','3 m west and 2 m north','2 m east and 3 m north','3 m east and 2 m north'],0,'Read each signed coordinate along its own axis.',['coordinate','axis','position vector']],
 ['A cart moves from (1,2) m to (4,6) m. What is its displacement?',['(5,8) m','(4,6) m','(3,4) m','(−3,−4) m'],2,'Final minus initial separately in each component gives (3,4) m.',['displacement','component']],
 ['The origin is moved but the physical trip is unchanged. Which statement is correct?',['All coordinates stay the same','Displacement stays the same when both endpoints use the new origin','The distance must double','The axes must rotate'],1,'Both position vectors shift by the same amount; their difference is unchanged.',['position vector','displacement']],
 ['Two positions are (5,1,2) m and (5,4,−1) m. Which component of displacement is zero?',['x','y','z','All three'],0,'The x-coordinate is unchanged, so Δx=0.',['coordinate','component']],
 ],
 speed:[
 ['A cyclist rides 60 m east then 20 m west in 20 s. What is the average velocity, east positive?',['+4 m/s','+2 m/s','−2 m/s','0 m/s'],1,'Displacement is +40 m; +40/20=+2 m/s.',['average velocity','velocity']],
 ['Two cyclists move at 3 m/s, one north and one south. What is the same?',['Their velocity vectors','Their direction','Their speed','Their position'],2,'Speed is magnitude only; opposite directions give different velocities.',['speed','velocity']],
 ['A runner completes a lap and ends at the start. Which conclusion follows for the whole lap?',['Average velocity is zero','Speed is zero throughout','The runner stayed still','Velocity never changed direction'],0,'Zero net displacement gives zero average velocity over the whole interval.',['average velocity']],
 ['A car turns at constant speed. What happens to its velocity?',['It stays constant','It changes direction','It becomes zero for the whole turn','It loses its units'],1,'Velocity includes direction even if its magnitude remains fixed.',['speed','velocity']],
 ],
 vector:[
 ['A cart travels from −2 m to +5 m, then to +1 m. Find distance and displacement.',['3 m and +11 m','11 m and +3 m','11 m and −3 m','7 m and +3 m'],1,'Leg lengths are 7 and 4 m; final minus initial is +3 m.',['distance','displacement']],
 ['A label says the ball is 4 m east of a door. What does it describe?',['Its position relative to an origin','Its whole travel distance','Its speed','Its elapsed time'],0,'The door supplies an origin and the signed direction locates the ball.',['position','origin']],
 ['Which report is a vector displacement?',['12 s','8 m of path','3 m north from the start','A 2 kg mass'],2,'Displacement has magnitude and direction.',['vector','displacement']],
 ['A different origin is chosen on the same axis. Which can change for a stationary object?',['Its traveled distance','Its physical location','Its reported position','Its mass'],2,'Coordinates depend on the reference origin even without motion.',['origin','position']],
 ],
 kinematics:[
 ['Position changes from 2 m at 1 s to 14 m at 5 s. What is the average velocity?',['14/5 m/s','3 m/s','12 m/s','4 m/s'],1,'Use the change in position divided by elapsed time:12/4=3 m/s.',['position','elapsed time','average velocity','meters per second']],
 ['A runner completes 100 m out and 100 m back in 50 s. Which pair is correct?',['Average speed 0; average velocity 4 m/s','Both 4 m/s','Both zero','Average speed 4 m/s; average velocity zero'],3,'Total distance is 200 m but net displacement is zero.',['average speed','average velocity']],
 ['On a curved position–time graph, which slope estimates velocity at one instant?',['A tangent at that instant','Any secant over the whole trip','The graph height','The time-axis label'],0,'Tangent slope gives instantaneous velocity; a secant gives an interval average.',['tangent','secant','instantaneous velocity','rate of change']],
 ['A car turns at constant speed. Which statement is correct?',['It has no acceleration','Its instantaneous velocity changes; its instantaneous speed may stay fixed','Its position cannot change','Kinematics cannot describe turning'],1,'Changing velocity direction means acceleration even at fixed speed.',['kinematics','acceleration','velocity','instantaneous speed','instantaneous velocity']],
 ],
}

/** Complete mixed-demand checkpoint, including usable defaults for future word sets. */
export function rebuildVocabulary(words:Word[]):CheckpointQuestion[]{
 const unique=[...new Map(words.map(w=>[w.term.toLowerCase(),w])).values()]
 if(unique.length<3)throw Error('A varied vocabulary checkpoint needs at least three words.')
 const terms=unique.map(w=>w.term),has=(t:string)=>terms.some(x=>x.toLowerCase()===t)
 const pack=AUTHORED_CHECKPOINTS.find(p=>p.terms.length===terms.length&&p.terms.every(has))
 const selected=Object.entries(examples).find(([key])=>has(key))?.[1]
 const recognition=unique.slice(0,4);while(recognition.length<4)recognition.push(unique[0])
 const start:CheckpointQuestion[]=recognition.map((word,i)=>{
  const alternatives=unique.filter(w=>w.term!==word.term).slice(0,3).map(w=>w.definition)
  while(alternatives.length<3)alternatives.push('This word has no specific meaning in this subject.')
  const options=[word.definition,...alternatives],offset=i%4
  const rotated=[...options.slice(4-offset),...options.slice(0,4-offset)]
  return {id:`q${i+1}`,part:'recognize',points:1,words:[word.term],prompt:`Which meaning best matches “${word.term}”?`,options:rotated,answer:offset,explanation:word.definition,demand:demand('Remember',1,'Recall the meaning of a taught technical word.')}
 })
 if(unique.length===3){const [a,b]=unique;start[3]={id:'q4',part:'recognize',points:1,words:[a.term,b.term],prompt:`Which statement correctly distinguishes “${a.term}” and “${b.term}”?`,options:[`${a.term}: ${a.definition} ${b.term}: ${b.definition}`,`${a.term}: ${b.definition} ${b.term}: ${a.definition}`,'They always mean exactly the same thing.','Neither word can be used to describe a physical situation.'],answer:0,explanation:'Keep the two meanings distinct and connect each word to the quantity it describes.',demand:demand('Understand',1,'Distinguish two taught meanings.') }}
 const middle=selected?.map(([prompt,options,answer,explanation,words],i):CheckpointQuestion=>({id:`q${i+5}`,part:'interpret',points:2,prompt,options,answer,explanation,words,demand:demand(i===0?'Apply':'Analyze',2,'Interpret a specific situation and distinguish quantities, relationships or evidence.')}))
 const base=pack?structuredClone(pack.questions):[...start,...(middle??Array.from({length:4},(_,i)=>{const word=unique[i%unique.length];return ({id:`q${i+5}`,part:'interpret',points:2,words:[word.term],prompt:`A student uses “${word.term}” in an explanation. Which approach would best establish whether the use is scientifically correct?`,options:[`Check that the situation actually matches this meaning: ${word.definition}`,'Check only that the word is spelled correctly','Use the word repeatedly without naming any evidence','Replace the word with a longer word'],answer:0,explanation:`Check both meaning and evidence in the situation: ${word.definition}`,demand:demand('Understand',2,'Connect the meaning to the evidence required for correct use.')} as CheckpointQuestion)}))]
 // Two required responses replace recall-only endings, and assess every selected term.
 const first=terms.slice(0,Math.ceil(terms.length/2)),second=terms.slice(Math.ceil(terms.length/2))
 base[8]={id:'q9',part:'explain',points:4,words:first,prompt:`Construct a specific example using ${first.join(', ')}. Add a plausible incorrect explanation that confuses at least two of these ideas. Correct it using evidence from your example and explain why the correction matters.`,frame:'The example is ___. The incorrect claim is ___. The evidence shows ___ because ___.',explanation:`Meanings: ${unique.filter(w=>first.includes(w.term)).map(w=>`${w.term}: ${w.definition}`).join('; ')}. Award 1 point for a specific example, 1 for identifying a substantive error, and 2 for a correct evidence-based correction.`,demand:demand('Evaluate',3,'Construct and critique a plausible misuse, using evidence and accurate distinctions.')}
 base[9]={id:'q10',part:'explain',points:4,words:second,prompt:`Design a new situation using ${second.join(', ')} accurately. State a condition you can change, predict what would change and what would stay the same, and describe evidence that would test your prediction. Explain how each listed word contributes to the reasoning.`,frame:'My situation is ___. I will change ___. I predict ___ because ___. I would check ___.',explanation:`Meanings: ${unique.filter(w=>second.includes(w.term)).map(w=>`${w.term}: ${w.definition}`).join('; ')}. Award 1 point for a coherent situation, 1 for correct use of all assessed words, 1 for a justified prediction, and 1 for a test linked to that prediction.`,demand:demand('Create',3,'Design a coherent situation, justify a conditional prediction, and propose relevant evidence.')}
 return base.map((q,i)=>({...q,id:`q${i+1}`,demand:q.demand??demand(i<4?'Remember':'Analyze',i<4?1:2,i<4?'Recall the meaning of a taught word.':'Interpret a scenario and distinguish the relevant physical quantities.')}))
}
