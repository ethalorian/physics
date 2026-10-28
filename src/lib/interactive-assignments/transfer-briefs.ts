import { demand } from '@/lib/assessment-demand'
import type { LessonAssignment, LessonQuestion } from './catalog'

const motion='u1.pick-equation-of-motion',vectors='u1.vectors-tip-to-tail',force='u1.fma-solve-net-force',friction='u1.friction-static-kinetic'
const question=(id:string,prompt:string,explanation:string,targets:string[],calculate=false):LessonQuestion=>({
  id,part:1,prompt,explanation,targets,independent:true,
  hint:'Use the supplied data and assumptions. Make the decision requested and explain what supports it.',
  demand:calculate?demand('Apply',2,'Choose a unit model and calculate evidence for the decision.'):demand('Evaluate',3,'Use evidence to judge a real-world claim or decision and explain the limits of the model.'),
})

/** Focused real-world applications; context serves the unit concept, not a fixed theme. */
export const TRANSFER_BRIEFS:LessonAssignment[]=[
  {
    slug:'transfer-brief-shuttle-acceleration',day:8,unit:'unit-1',title:'Will the shuttle be ready to merge?',minutes:15,
    targets:[motion],toolHref:'',
    transferBrief:{scene:'shuttle-acceleration',question:'Can an electric shuttle reach traffic speed in an 18 m acceleration lane?',
      science:'Use constant-acceleration relationships to find the time and distance from rest to 6.0 m/s, with units.',
      reasoning:'Compare the calculated distance with the 18 m lane and use that evidence to recommend a change.',
      communication:'Make the calculations, comparison and recommendation understandable. Concise equations and sentences are enough; a graph or diagram is not required.',
      transfer:'Use the motion model to evaluate the lane proposal and explain how one real condition that changes acceleration could affect the recommendation.'},
    targetNote:'Assess only the requested constant-acceleration time and distance, lane comparison, recommendation and one explained model limitation. Do not require a force calculation, graph, second scenario, extra measurement, numerical redesign, traffic-gap analysis or full engineering safety assessment. One relevant condition with a direction of effect is sufficient. Answer-guide examples are alternatives, not a checklist. Accept equivalent methods and carried-forward arithmetic errors; do not penalize language supports. Feedback must check all three answers before proposing a next step. Do not ask students to add equations, a yes/no decision or a changed recommendation when they already supplied them. For complete evidence, reinforce a specific successful habit with a keep-doing next step instead of inventing a correction. No equation or numerical result is required in brief-c.',
    sections:[{title:'Decision brief',stop:'Transfer Brief · Acceleration in transport',
      learn:'A campus team proposes an 18 m acceleration lane for an electric shuttle joining a campus loop. In this illustrative planning case, the shuttle starts from rest at the beginning of the lane and should reach the loop traffic speed of 6.0 m/s by the merge point. Model its motion along a straight, level lane with a constant forward acceleration of 0.80 m/s² from the moment it starts. Check whether the proposed lane provides enough distance to reach that speed. Your recommendation addresses this motion requirement; it is not a complete traffic-safety assessment.',
      questions:[
        question('brief-a','How long will the shuttle take to reach 6.0 m/s, and how far will it travel during that time? Show the relationships you use, your calculations and units.','With u=0 m/s and a=0.80 m/s², t=(v−u)/a=6.0/0.80=7.5 s. Distance Δx=ut+½at²=22.5 m, or Δx=(v²−u²)/(2a)=36/1.60=22.5 m. Average-speed reasoning, Δx=((u+v)/2)t, is equally valid. Consistent rounding to about 23 m is acceptable.',[motion],true),
        question('brief-b','Is the proposed 18 m lane long enough for the shuttle to reach traffic speed in this model? Use your results to explain your decision and recommend one change.','No. The model requires 22.5 m, which is 4.5 m more than the proposed 18 m. Recommend a longer acceleration lane (at least the modeled distance, with real operating conditions checked) or another justified change that addresses the mismatch. No calculation of a redesigned acceleration, speed limit or safety margin is required. A consistent comparison using the student’s carried-forward result is valid reasoning even if the earlier arithmetic is wrong.',[motion]),
        question('brief-c','Choose one real condition that could make the shuttle’s acceleration differ from 0.80 m/s². Explain how that change would affect the distance needed and your recommendation.','For example, an uphill lane, more passengers with the same available driving force, or reduced motor output could lower acceleration. Reaching the same target speed would then need more time and distance, so the lane recommendation would need more room or a revised operating plan. A justified condition that raises acceleration and reduces the required distance also works. One condition and its direction of effect are enough; extra calculations, a force derivation, measurements or a test procedure are not required.',[motion]),
      ]}],questions:[],
  },
  {
    slug:'transfer-brief-robot-stopping',day:8,unit:'unit-1',title:'Will the delivery robot stop in time?',minutes:15,
    targets:[motion],toolHref:'',
    transferBrief:{scene:'robot-stopping',question:'Should a delivery robot keep its current speed near a crossing?',
      science:'Separate constant-speed response distance from constant-deceleration braking distance, with units.',
      reasoning:'Use the available distance and both braking conditions to evaluate the speed policy.',
      communication:'Label the stages, assumptions and recommendation clearly; concise equations are sufficient.',
      transfer:'Use the motion model to make a crossing policy decision and identify one real condition that needs checking.'},
    targetNote:'Assess only the two-stage stopping calculation, comparison and recommendation asked here. Do not require a force calculation, a graph or every method in the broader target. Accept a justified recommendation with carried-forward arithmetic errors; do not penalize language supports.',
    sections:[{title:'Decision brief',stop:'Transfer Brief · Motion in a public space',
      learn:'A campus team is testing a delivery robot near a pedestrian crossing. In this simplified planning case, the robot travels at 3.0 m/s and detects the crossing 5.0 m ahead. It keeps the same speed during a 0.50 s response delay, then brakes at a constant 2.0 m/s² on dry pavement. On wet pavement, braking deceleration is only 1.0 m/s². Assume level ground and an unobstructed path. Decide whether a rule allowing 3.0 m/s in both conditions is supported by this model.',
      questions:[
        question('brief-a','How far does the robot travel during the response delay, and how far while braking on dry pavement? Find its total stopping distance and compare it with the 5.0 m available. Show relationships and units.','Response: d=vt=3.0×0.50=1.50 m. Braking: 0=v₀²+2aΔx gives Δx=9/4=2.25 m with a=−2.0 m/s². Total=3.75 m, 1.25 m before the crossing. Equivalent average-speed methods are valid.',[motion],true),
        question('brief-b','Repeat the total stopping-distance comparison for wet pavement. Would you approve the same 3.0 m/s speed rule in both conditions? Use the evidence to recommend one change.','Wet braking distance=9/2=4.50 m, plus 1.50 m response gives 6.00 m, beyond the crossing. Do not approve this policy for both conditions. A lower approach speed, earlier detection or a larger clear stopping distance is justified. No calculation of a new speed is required.',[motion]),
        question('brief-c','Choose one assumption that the team should check before using this policy around people. Explain how a different value or condition could change the recommendation.','Examples include longer detection/response delay, lower deceleration on a different surface, a slope, or uncertain initial speed. Explain a direction of effect on stopping distance. One supported limitation is enough; a full risk analysis or engineering design is not required.',[motion]),
      ]}],questions:[],
  },
  {
    slug:'transfer-brief-river-crossing',day:6,unit:'unit-1',title:'Where should the rescue boat aim?',minutes:12,
    targets:[vectors],toolHref:'',
    transferBrief:{scene:'river-crossing',question:'Can a boat aimed straight at a landing actually reach it?',
      science:'Add the boat’s water-relative velocity and the current as signed vector components.',
      reasoning:'Connect crossing time and downstream drift to the landing location.',
      communication:'Distinguish across-river and downstream components, with an explicit reference frame.',
      transfer:'Select a useful steering plan from the evidence and identify a current condition that could change it.'},
    targetNote:'Assess component addition and the landing decision only. The prompt supplies the alternate components, so trigonometry, a scale drawing and a derivation of boat speed are not required. A clear written explanation can replace a sketch.',
    sections:[{title:'Decision brief',stop:'Transfer Brief · Navigation with a current',
      learn:'A rescue team is practicing a crossing on a river 120 m wide. For this planning model, take the current as a constant 1.5 m/s downstream and ignore wind. Plan A points the boat straight across: its velocity relative to the water is 4.0 m/s across and 0 downstream. The landing is directly opposite the start. Plan B aims upstream: the boat’s water-relative components are approximately 3.7 m/s across and −1.5 m/s downstream. Assume both plans can hold their stated components.',
      questions:[
        question('brief-a','For Plan A, calculate the crossing time and downstream drift. Would the boat reach the landing directly opposite the start? Show your component calculations with units.','Across speed=4.0 m/s gives t=120/4.0=30 s. Ground-relative downstream speed=1.5 m/s gives drift=45 m. It reaches the far bank 45 m downstream of the landing.',[vectors],true),
        question('brief-b','Which plan would you choose to reach the landing in this model? Add Plan B’s components to the current, estimate its crossing time, and explain why it is worth taking a little longer.','Plan B: downstream ground velocity=−1.5+1.5=0 m/s; across remains 3.7 m/s. Time≈32.4 s. It reaches the opposite landing instead of drifting 45 m. The important tradeoff is position versus slightly shorter travel time.',[vectors]),
        question('brief-c','If the current strengthened while the team crossed, would Plan B still reach the same landing? Explain using the components and identify what the team would need to update.','A current above 1.5 m/s leaves a net downstream component with the given heading, so the endpoint shifts downstream. Update the current measurement and upstream steering component. No new numerical heading or trigonometric calculation is required.',[vectors]),
      ]}],questions:[],
  },
  {
    slug:'transfer-brief-cargo-braking',day:17,unit:'unit-1',title:'Will the cargo slide when the van brakes?',minutes:15,
    targets:[force,friction],toolHref:'',
    transferBrief:{scene:'cargo-braking',question:'Is a non-slip mat enough to keep a crate in place?',
      science:'Connect the force needed for the crate’s acceleration with the maximum available static friction.',
      reasoning:'Compare required and available force instead of assuming that “non-slip” guarantees no motion.',
      communication:'Identify the force direction and distinguish the friction limit from the friction actually needed.',
      transfer:'Use the force comparison to judge both mats, explain why “never” is unsupported, and name one condition to check or one securing measure. A supported choice is sufficient; a test procedure or new numerical failure threshold is not asked for.'},
    targetNote:'Use brief-a for F=ma and brief-b/brief-c for static friction and the cargo decision. Do not demand a full force diagram, kinetic sliding distance, a coefficient calculation or a certified restraint design. Keep target judgments separate and accept carried-forward arithmetic errors. Brief-c earns full credit when the student explains why the guarantee is too strong and names one relevant condition or measure. Do not require a test design, quantitative failure threshold, or all alternative assumptions from the answer guide.',
    sections:[{title:'Decision brief',stop:'Transfer Brief · Forces in transport',
      learn:'A delivery team places a 20 kg crate on a non-slip mat in a van. In a test braking maneuver, the van slows at 4.0 m/s². The measured maximum static friction between this crate and the mat is 65 N. A second tested mat provides up to 100 N of static friction with the same crate. Treat the floor as horizontal, the crate as not tipping, and the braking acceleration as constant. The team claims the first mat alone will keep the crate from sliding relative to the van.',
      questions:[
        question('brief-a','What horizontal net force must act on the crate for it to slow with the van at 4.0 m/s²? Give the magnitude and direction, and show the relationship with units.','Fnet=ma=20×4.0=80 N opposite the van’s forward motion. This is the force needed on the crate to match the van’s acceleration.',[force],true),
        question('brief-b','Does the 65 N mat support the team’s claim? Compare it with the 100 N mat. For each, explain whether the crate can slow with the van without sliding in this model.','Required static friction is 80 N. The first mat’s 65 N maximum is insufficient, so the crate slides relative to the van. The second can supply 80 N within its 100 N limit, so no sliding is predicted under the stated conditions. Static friction need not always equal its maximum.',[friction]),
        question('brief-c','A teammate says the 100 N mat guarantees the crate will never slide. Explain why the model cannot support “never,” and name one condition the team should test or one additional securing measure it should investigate.','Stronger braking would require more force; changing load, surface condition or tipping can invalidate the assumptions. One supported condition or appropriately rated cargo-restraint measure is sufficient. This calculation is evidence for the modeled maneuver, not a guarantee for every journey.',[friction]),
      ]}],questions:[],
  },
].map(brief=>({...brief,questions:brief.sections.flatMap(section=>section.questions)})) as LessonAssignment[]
