import {videoInteractiveQuestions} from '@/data/assessment/video-interactive-questions'
import {VIDEO_VOCABULARY} from '@/data/video-vocabulary'
import {demand} from '@/lib/assessment-demand'
import type { BlockDocument, ContentBlock, GewaBlock, WorkedExampleBlock } from '@/data/content-blocks'
import { PHYSICS_VIDEO_PROMPTS } from '@/data/physics-video-prompts'

type Example = Pick<WorkedExampleBlock, 'prompt' | 'given' | 'equation' | 'work' | 'answer'>
interface PracticePair { example?: Example; replica: string; model: string; plan: string; teacher: string }
export const VIDEO_PRACTICE: Record<string, PracticePair> = {
  Z1qFlfqlS_E: {
    example: { prompt: 'Calculate and report the area of a card measured as 12.4 cm by 3.2 cm.',given: 'Model the card as a rectangle. Both lengths are measured, not exact.',equation: 'A = length × width. For multiplication, report as many significant figures as the least precise measurement.',work: '12.4 × 3.2 = 39.68 cm². The width has two significant figures, so round to two.',answer: '4.0 × 10¹ cm². The two significant figures communicate the supported precision.' },
    replica: 'A rectangular card measures 15.6 cm by 4.3 cm. Calculate and report its area with appropriate significant figures. Use the same model and method as the example; explain your rounding.',model: 'Identify the two measured sides, their units, and their significant figures.',plan: 'Use the rectangle relationship, then decide which measurement limits the reported precision.',teacher: '15.6×4.3=67.08 cm² → 67 cm² (two significant figures). Look for model, plan, unrounded work, and justified final precision.',
  },
  vf7X7mmJfsE: {
    example:{prompt: 'A cyclist moves 3 m each second along a straight path, then follows a curve at the same speed. Describe position, velocity, and acceleration during each part.',given: 'The first path is straight; the second changes direction. Speed is 3 m/s throughout.',equation: 'Velocity includes speed and direction. Acceleration means a change in velocity.',work: 'On the straight path position changes and velocity stays constant. On the curve, equal-length velocity arrows point in changing directions.',answer: 'Position changes in both parts. Acceleration is zero on the steady straight part and nonzero on the curve because velocity changes direction.'},
    replica: 'A cyclist moves 5 m each second along a straight path, then follows a curve at the same speed. Describe position, velocity, and acceleration during each part. Explain whether changing the speed number changes the reasoning used in the example.',model: 'Draw a straight segment and a curve with velocity arrows at two places on each.',plan: 'Check separately whether the speed changes and whether the direction changes.',teacher: 'Same qualitative result as example: position changes throughout, straight velocity constant, curved velocity changes and acceleration nonzero. The new speed does not change the logic; no numeric acceleration can be calculated from the given information.',
  },
  u0V8uJ5KTvo: {
    example:{prompt: 'Find total distance and displacement for a trip from −2 m to +4 m, then back to +1 m. Right is positive.',given: 'Mark start −2 m, turn +4 m, finish +1 m on a straight number line.',equation: 'Distance adds the magnitudes of the legs; displacement is final minus initial.',work: 'Legs: |4−(−2)|=6 m and |1−4|=3 m. Distance=9 m. Displacement=1−(−2)=+3 m.',answer: 'Distance 9 m, displacement +3 m (3 m right). The return leg adds distance but reduces net change.'},
    replica: 'A cart starts at −3 m, travels directly to +5 m, then returns to +2 m. Right is positive. Find total distance and displacement and explain why they differ.',model: 'Mark the three positions in order and draw both travel arrows.',plan: 'Add leg lengths for distance. Use only the endpoints for displacement.',teacher: 'Legs 8 m and 3 m; distance 11 m; displacement 2−(−3)=+5 m. Interpret positive as right.',
  },
  djR8sAAi740: {
    example:{prompt: 'Find the displacement from (1, 4, 2) m to (5, 1, 6) m.',given: 'Use x east, y north, z up. Initial and final positions use the same origin.',equation: 'Subtract each initial coordinate from the matching final coordinate.',work: 'Δx=5−1=4 m; Δy=1−4=−3 m; Δz=6−2=4 m.',answer: 'Δr=(4, −3, 4) m: 4 m east, 3 m south, 4 m up.'},
    replica: 'Find the displacement from (2, 6, 1) m to (8, 2, 7) m. Use x east, y north, and z up. Interpret each component.',model: 'Record initial and final coordinates in separate x, y, and z columns.',plan: 'Use final minus initial separately for each axis.',teacher: '(6, −4, 6)m: 6 m east, 4 m south, 6 m up.',
  },
  FshpPgPAeWM: {
    example:{prompt: 'An object is 3 m east and 4 m north of an origin. Describe its position vector and find its distance from the origin.',given: 'Choose east +x and north +y; draw an arrow from (0, 0) to (3, 4)m.',equation: 'r=(x, y); magnitude |r|=√(x²+y²).',work: '|r|=√(3²+4²)=√25=5 m.',answer: 'Position vector(3, 4)m; magnitude 5 m. The components locate the object; 5 m alone does not.'},
    replica: 'An object is 6 m east and 8 m north of an origin. Describe its position vector and find its distance from the origin. Explain why the distance alone cannot locate it.',model: 'Draw the arrow from the origin with labeled x and y components.',plan: 'Use the perpendicular components to calculate the vector magnitude.',teacher: 'Position(6, 8)m, magnitude 10 m. Distance alone allows many directions.',
  },
  'maoz-9mGWyk': {
    example:{prompt: 'With ground level as y=0 and up positive, an elevator moves from −6 m to −2 m. Find both position magnitudes and the displacement.',given: 'Both positions are below ground. Place the two marks on a vertical axis.',equation: 'Magnitude is absolute value. Displacement is yf −yi.',work: '|−6|=6 m; |−2|=2 m; Δy=−2−(−6)=+4 m.',answer: 'The elevator starts 6 m below ground and ends 2 m below. Its displacement is 4 m upward despite both positions being negative.'},
    replica: 'With ground level as y=0 and up positive, an elevator moves from −9 m to −3 m. Find both position magnitudes and the displacement. Explain the meaning of each sign.',model: 'Mark initial and final positions on a vertical axis with up positive.',plan: 'Use absolute value for each magnitude; final minus initial for displacement.',teacher: 'Magnitudes 9 m and 3 m; displacement +6 m, upward. Negative positions mean below the origin.',
  },
  YViTBR_aygk: {
    example:{prompt: 'A cart changes position from 2 m to 14 m in 6 s. Find the average rate of change of position.',given: 'xi=2 m, xf=14 m, elapsed time 6 s; positive is right.',equation: 'Average velocity=(xf −xi)/Δt.',work: 'Change=14−2=12 m. Average rate=12 m/6 s=2 m/s.',answer: '+2 m/s: the cart’s net change averages 2 m right per second over the interval.'},
    replica: 'A cart changes position from 3 m to 23 m in 5 s. Positive is right. Find its average rate of change of position and explain the units.',model: 'Identify initial position, final position, and elapsed time with units.',plan: 'Find the change before dividing by elapsed time.',teacher: '(23−3)/5=+4 m/s, average 4 m right per second. Do not divide final position alone by time.',
  },
  hj8usnvYrRo: {
    example:{prompt: 'A runner moves 80 m east and then 20 m west in 20 s total. Find average speed and average velocity.',given: 'Positive is east; distance adds both legs, displacement compares start and finish.',equation: 'Average speed=distance/Δt; average velocity=displacement/Δt.',work: 'Distance=80+20=100 m; displacement=80−20=+60 m. Divide each by 20 s.',answer: 'Average speed 5 m/s; average velocity +3 m/s east. Neither is automatically the instantaneous value.'},
    replica: 'A runner moves 120 m east and then 30 m west in 30 s total. Find average speed and average velocity. Explain why the same time interval gives different answers.',model: 'Draw the out-and-back route and label east as positive.',plan: 'Find total distance and net displacement separately, then divide each by the total time.',teacher: 'Distance 150 m, displacement +90 m; speed 5 m/s, velocity +3 m/s. Difference comes from different numerators.',
  },
  fmjVsKsU9Sw: {replica: 'Choose uniform scales for position data from 0 to 2.6 m over 0 to 4.0 s using 30 squares across and 20 up. Both axes start at zero. Label the axes, check that all data fits, and locate the point(2.0 s, 1.2 m).',model: 'Identify the range and number of squares separately for time and position.',plan: 'Divide range by squares, round up to a convenient step, and multiply back to check.',teacher: 'Minimum steps .1333 s and .13 m; .2 s and .2 m fit 6 s and 4 m. Point 10 squares across 6 up. Accept other readable uniform scales with correct checks and placement.'},
  lZIZ8jByakc: {replica: 'Write 6 500 000 m and 0.0072 s in scientific notation. Explain the sign of each exponent and check that the rewritten quantities are equal to the originals.',model: 'Keep both original measurements and units visible.',plan: 'Make each coefficient at least 1 and less than 10; choose the power that restores the original value.',teacher: '6.5×10⁶ m and 7.2×10⁻³ s. Large value positive exponent, small positive fraction negative exponent.'},
  VQlq7_OtDF8: {replica: 'Express 4.8 km and 0.72 mm in meters. Show the prefix factors and explain why the physical lengths stay the same.',model: 'kilo=10³, milli=10⁻³; identify meters as the requested unit.',plan: 'Replace each prefix with its power of ten.',teacher: '4800 m and.00072 m=7.2×10⁻⁴ m. Value and unit size change together, physical length unchanged.'},
  SE8M273AKXw: {replica: 'Convert 3.0 h to seconds, then 54 km/h to m/s. Use 1 h=60 min, 1 min=60 s, and 1 km=1000 m. Show unit cancellation.',model: 'Keep the time conversion separate from the speed conversion.',plan: 'Use ratios of equal quantities with unwanted units on opposite sides.',teacher: '10800 s and 15 m/s. Both numerator and denominator units converted for the speed.'},
  E0CpXzmViwQ: {replica: 'Draw the displacement for a trip 6 m east, then 8 m north. Use 1 square=2 m. Find resultant magnitude and direction, and compare with distance traveled.',model: 'Choose east right, north up, and draw both arrows to the same scale.',plan: 'Place arrows tip to tail; resultant joins first tail to last tip.',teacher: 'Resultant 10 m about 53° north of east; distance 14 m. Diagram 3 squares east 4 north, 5-square resultant.'},
  'uH-NE-LlybM': {replica: 'Add A=(9, 12)m and B=(−3, −4)m. Positive x is east and positive y north. Find the resultant components, magnitude, and direction from positive x.',model: 'Organize matching components and preserve signs.',plan: 'Add x to x and y to y, then recover magnitude and angle using the quadrant.',teacher: 'R=(6, 8)m, magnitude 10 m, about 53° north of east. Same steps as(6, 8)+(−2, −5)example, with different inputs.'},
  pwbD3H8R0BU: {replica: 'Compare A·B and A×B for A=(5, 2)m and B=(1, 4)m in the xy plane, with +z out of the page. Explain the type, direction, and units of each result.',model: 'Identify Ax, Ay, Bx, By and draw their directions.',plan: 'Dot=AxBx +AyBy; cross z=AxBy −AyBx. Interpret scalar versus vector.',teacher: 'Dot 13 m²; cross(0, 0, 18)m², out of page. Swapping order reverses cross but not dot.'},
  B51oRJa9MSM: {
    example:{prompt: 'A student starts at +2 m, walks to +8 m, then to −3 m. Right is positive. Find distance and displacement.',given: 'Draw +2→+8→−3 m on a straight number line.',equation: 'Distance adds leg lengths; displacement=xf −xi.',work: 'Legs 6 m and 11 m; distance 17 m; displacement −3−2=−5 m.',answer: '17 m distance; −5 m displacement, meaning 5 m left of the start.'},
    replica: 'A student starts at +3 m, walks directly to a fountain at +10 m, then to a locker at −4 m. Right is positive. Find total distance and displacement, showing the same five-stage method as the worked example.',model: 'Label the start, turn, and finish on one number line, with one arrow per leg.',plan: 'Add the magnitudes of both legs for distance; compare only endpoints for displacement.',teacher: 'Legs 7 m and 14 m; distance 21 m; displacement −4−3=−7 m, 7 m left of start. Require model, plan, work, and interpretation.',
  },
}

export function videoExample(youtubeId: string, targetId?: string): WorkedExampleBlock | null {
  const content = PHYSICS_VIDEO_PROMPTS[youtubeId]?.workedExample ?? VIDEO_PRACTICE[youtubeId]?.example
  return content ? { id:`worked-video-${youtubeId}`,type:'worked_example',format:'problem-workspace',interactive:true,targetId,...content,workshop:{stage:'Worked example',pageBreakBefore:true} } : null
}
export function videoReplica(youtubeId: string, exampleId: string, targetId?: string): GewaBlock | null {
  const item=VIDEO_PRACTICE[youtubeId]
  if (!item) return null
  return {id:`replica-video-${youtubeId}`,type:'gewa',capture:true,responseFormat:'problem-workspace',requireCompleteWork:true,targetId,evidenceRole:'practice',referenceBlockIds:[exampleId],workshop:{stage:'Your turn · new numbers',pageBreakBefore:true},demand:demand('Apply',2,'Select and apply the example’s method to new quantities; interpret units and direction.'),prompt:item.replica,stageHints:{model:item.model,plan:item.plan,work: 'Use the new values from this problem. Show each step with its units or directional evidence.',answer: 'Interpret the result in context. Check the units, signs, and size; explain what the result means.'},sei:{modes:['text','sketch'],frames:[{level:1,text:'My model shows ___. I will use ___ because ___. My work gives ___. This means ___.'}]},note:`Teacher review guide: ${item.teacher} Compare the method with the worked example; do not infer mastery from completion alone.`}
}

/** Rebuild the video sequence from authored tasks. Legacy response blocks are retired. */
export function enrichVideoLesson(document: BlockDocument): BlockDocument {
  const videos=document.blocks.filter((b): b is import('@/data/content-blocks').InstructionVideoBlock=>b.type==='instruction_video'&&Boolean(VIDEO_PRACTICE[b.youtubeId]))
  const blocks:ContentBlock[]=[]
  for(const video of videos){
    const id=video.youtubeId, tasks=videoInteractiveQuestions(id,video.targetId)
    blocks.push({...video,workshop:{stage:videos.length>1?video.title:'Watch & understand',pageBreakBefore:true}})
    const vocabulary=document.blocks.find(b=>b.type==='vocab'&&(b.id.includes(id)||videos.length===1))
    if(vocabulary?.type==='vocab') blocks.push({...vocabulary,id:'iq3-vocab-'+id,referencePanel:true,workshop:undefined})
    else if(VIDEO_VOCABULARY[id]?.length) blocks.push({id:'iq3-vocab-'+id,type:'vocab',terms:VIDEO_VOCABULARY[id],referencePanel:true})
    blocks.push(tasks[0])
    const example=videoExample(id,video.targetId)
    if(example){
      example.id='iq3-worked-'+id
      blocks.push(example)
      const replica=videoReplica(id,example.id,video.targetId)
      if(replica) blocks.push({...replica,id:'iq3-replica-'+id})
    }
    blocks.push(...tasks.slice(1))
  }
  for(const old of document.blocks.filter(b=>b.mcasId)){
    if(old.type==='interactive_question'){blocks.push(old);continue}
    if(old.type!=='question')continue
    const question=old.question as import('@/data/content-blocks').InlineQuestion
    blocks.push({id:'iq3-'+old.mcasId,type:'interactive_question',capture:true,mcasId:old.mcasId,targetId:old.targetId,requiredForCompletion:false,xp:0,note:old.note,workshop:{stage:old.teachingMoment?.title??'MCAS extension',pageBreakBefore:true},demand:demand('Analyze',2,'Interpret the released assessment item and explain the evidence behind the selected answer.'),task:{title:old.teachingMoment?.title??'MCAS extension',format:'concept',prompt:'Use the original MCAS question above, then support your answer.',parts:[{id:'choice',kind:'choice',label:'Choose',prompt:'Which answer matches the original question?',options:(question.options??[]).map(o=>({id:o.id,text:'Option '+o.id+' in the MCAS question'})),answer:question.correctOptionId},{id:'evidence',kind:'reasoning',label:'Support with evidence',prompt:question.explain??'Use the data, model, or calculation in the question to justify your choice.'}]}})
  }
  return {...document,blocks}
}
