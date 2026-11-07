import {DAY_SIXTEEN_CHECKPOINTS} from './day-sixteen-checkpoints'
import sixteenCopy from '@/data/foundations/day-sixteen-copy.json'
import {DAY_FIFTEEN_CHECKPOINTS} from './day-fifteen-checkpoints'
import fifteenCopy from '@/data/foundations/day-fifteen-copy.json'
import {DAY_FOURTEEN_CHECKPOINTS} from './day-fourteen-checkpoints'
import fourteenCopy from '@/data/foundations/day-fourteen-copy.json'
import {DAY_THIRTEEN_CHECKPOINTS} from './day-thirteen-checkpoints'
import thirteenCopy from '@/data/foundations/day-thirteen-copy.json'
import {DAY_TWELVE_CHECKPOINTS} from './day-twelve-checkpoints'
import twelveCopy from '@/data/foundations/day-twelve-copy.json'
import {DAY_ELEVEN_CHECKPOINTS} from './day-eleven-checkpoints'
import elevenCopy from '@/data/foundations/day-eleven-copy.json'
import {DAY_TEN_CHECKPOINTS} from './day-ten-checkpoints'
import tenCopy from '@/data/foundations/day-ten-copy.json'
import {DAY_NINE_CHECKPOINTS} from './day-nine-checkpoints'
import {DAY_EIGHT_CHECKPOINTS} from './day-eight-checkpoints'
import {DAY_SEVEN_CHECKPOINTS} from './day-seven-checkpoints'
import {DAY_SIX_CHECKPOINTS} from './day-six-checkpoints'
import {DAY_FIVE_CHECKPOINTS} from './day-five-checkpoints'
import {DAY_FOUR_CHECKPOINTS} from './day-four-checkpoints'
import {DAY_THREE_CHECKPOINTS,DAY_THREE_SAMPLE_DATA} from './day-three-checkpoints'
import {DAY_TWO_CHECKPOINTS} from './day-two-checkpoints'
export type FoundationKey = 'day-one'|'day-two'|'day-three'|'day-four'|'day-five'|'day-six'|'day-seven'|'day-eight'|'day-nine'|'day-ten'|'day-eleven'|'day-twelve'|'day-thirteen'|'day-fourteen'|'day-fifteen'|'day-sixteen'
import type {AssessmentDemand} from '@/lib/assessment-demand'
import type {AvatarItem} from '@/lib/avatar/types'

export type CheckpointId = 'evidence' | 'model' | 'questions'
export type CheckpointWriting = {
 contribution: string | null; reply: string | null; reflection: string | null
 contributed_at?: string | null; replied_at?: string | null; reflected_at?: string | null
}
export type CheckpointView = {
 id: CheckpointId; own: CheckpointWriting; peer: Omit<CheckpointWriting, 'reflection' | 'reflected_at'> | null
 peerShared: boolean; complete: boolean; available: boolean
 previousTable?:boolean; chosenIdeaKey?:string|null
 peers?: {slot:number;name:string;ideaKey?:string;inReplyToYou?:boolean;contribution:string|null;reply:string|null;replyToSlot:number|null}[]
 sharedCount?: number; repliedCount?: number; replyToSlot?: number|null
 exampleSelected?: boolean; exampleOpensAt?: string|null
}
export type FoundationMember = {slot:number;name:string;isYou:boolean;independent:'pending'|'approved'|null;avatar:{traits:Record<string,string>;equipped:Record<string,string>}}
export type TableSwitch = {id:string;destination_code:string;status:'pending'|'reserved'|'moved'|'declined'|'canceled'|'unavailable'}
export type FoundationPair = {tableSwitch?:TableSwitch|null;code: string; slot: number; peerJoined: boolean; peerName: string | null; checkpoints: CheckpointView[]; complete: boolean; makeup?: boolean; approved?: boolean; flaggedAt?: string; peerIndependent?: boolean;protocolVersion?:number;individualPace?:boolean;started?:boolean;members?:FoundationMember[];items?:AvatarItem[];realtime?:{url:string;key:string;topic:string}|null}
export type Checkpoint = {
 id: CheckpointId; title: string; roles: [string, string]; prompts: [string, string]
 discuss: string; reply: string; reflection: string; demand: AssessmentDemand
 solo: {idea:string;example:string;critique:string;reflection:string}
}
export const FOUNDATION_CHECKPOINTS: readonly Checkpoint[] = [
 {
  id: 'evidence', title: "Compare the observations", roles: ["Find an observation", "Check what is treated as true"],
  prompts: [
   "Choose **one observation from the slides**. Give its slide number or labeled value. Explain what it supports. Explain how the cart demonstration differs from the story’s asteroid situation.",
   "Choose **one statement the briefing does not yet show is true**. Explain what is missing. Name a measurement that would help you check it.",
  ],
  discuss: "Read each other’s ideas aloud. Together, name one thing you know and one thing you still need to measure.",
  reply: "Point to **one detail in your partner’s idea**. Is it something directly observed or measured, or an explanation based on those observations? Explain. Add a source detail or measurement that would make the idea stronger.",
  reflection: "In your own words, **what can you now support with measurements or observations**? What is still not known for sure? Explain how your partner’s idea helped you decide.",
  demand: {blooms: 'Analyze', dok: 2, evidence: 'Distinguishes evidence from inference and connects a peer’s idea to a supported claim and an uncertainty.'},
  solo: {
   idea: "1. **Choose an observation from the slides.** Give its slide number or source.\n2. **Explain what it supports** and one answer it cannot support.",
   example: '“The object is approaching Earth, so a collision is certain.”',
   critique: "**Which part was observed? Which part goes beyond the observation?** Explain what measurements are missing.",
   reflection: "Rewrite the statement in your own words. **Make clear what we know and what is still not known for sure.**",
  },
 },
 {
  id: 'model', title: 'Challenge the prediction', roles: ["Check the prediction", 'Prediction builder'],
  prompts: [
   "The predicted position was **6 m**, but the next reading is **5 m**. Explain **two possible reasons** for the difference. Describe a check that could help you tell which reason fits.",
   "The cart is at 0, 2, and 4 m at 0, 1, and 2 s. Explain your prediction for 3 s and what you are treating as true when you make that prediction.",
  ],
  discuss: 'You have switched roles. Compare the prediction with the unexpected reading. Agree on a useful next check and explain why it helps.',
  reply: "**Check one thing your partner treated as true, or one check they suggested.** Use the numbers, or explain which result would help tell the possible causes apart.",
  reflection: "State your current explanation for the difference. Use an idea from your partner. **What new measurement or observation would make you change your mind? Explain.**",
  demand: {blooms: 'Evaluate', dok: 3, evidence: 'Critiques a conditional prediction and defends a test that distinguishes competing explanations.'},
  solo: {
   idea: "Predict the next position after 0, 2, and 4 m at one-second time steps. Say what you are treating as true. Give two explanations for a new reading of 5 m.",
   example: "“The prediction says 6 m. The 5 m reading must be wrong, so we should throw it away.”",
   critique: "Check this response to an unexpected reading. **Explain what is wrong or missing.** Describe a check that could help you tell whether the motion changed or the measurement had a problem.",
   reflection: "State your improved explanation. **Describe a measurement or observation that would make you change your mind.**",
  },
 },
 {
  id: 'questions', title: 'Build a better question', roles: ['Question designer', 'Measurement planner'],
  prompts: [
   "Choose one of your wonder questions. Make it clear enough to investigate. Explain whether it needs **measurements and physics ideas, decisions by people, or both**.",
   "1. Choose one of your wonder questions.\n2. Suggest two measurements and explain how each helps.\n3. Name any part that measurements alone cannot decide.",
  ],
  discuss: 'Combine your strengths: sharpen one question and its measurement plan. Each person should explain one improvement before you write your responses.',
  reply: "1. Use a clear idea from your partner to improve the question or measurement plan.\n2. Explain why the improvement makes it more useful or testable.",
  reflection: "Write your own improved question and measurement plan. Name the partner idea you used. **Explain why you made one change.** Do not copy a shared final answer.",
  demand: {blooms: 'Create', dok: 3, evidence: 'Constructs a testable question with a justified measurement plan and attributes a substantive peer contribution.'},
  solo: {
   idea: "Choose a wonder question. Does it need **measurements and physics ideas, decisions by people, or both**? Explain and suggest **two useful measurements**.",
   example: '“Can we stop it? Measuring its speed once will tell us which response everyone should choose.”',
   critique: "1. **Name a missing measurement** and a decision that measurements alone cannot settle.\n2. **Explain why the plan is not enough.**",
   reflection: "Write a more clear question and an improved measurement plan. **Explain why you made a change** after checking the example.",
  },
 },
]
export function getFoundationCheckpoints(foundation:FoundationKey='day-one'){return foundation==='day-sixteen'?DAY_SIXTEEN_CHECKPOINTS:foundation==='day-fifteen'?DAY_FIFTEEN_CHECKPOINTS:foundation==='day-fourteen'?DAY_FOURTEEN_CHECKPOINTS:foundation==='day-thirteen'?DAY_THIRTEEN_CHECKPOINTS:foundation==='day-twelve'?DAY_TWELVE_CHECKPOINTS:foundation==='day-eleven'?DAY_ELEVEN_CHECKPOINTS:foundation==='day-ten'?DAY_TEN_CHECKPOINTS:foundation==='day-nine'?DAY_NINE_CHECKPOINTS:foundation==='day-eight'?DAY_EIGHT_CHECKPOINTS:foundation==='day-seven'?DAY_SEVEN_CHECKPOINTS:foundation==='day-six'?DAY_SIX_CHECKPOINTS:foundation==='day-five'?DAY_FIVE_CHECKPOINTS:foundation==='day-four'?DAY_FOUR_CHECKPOINTS:foundation==='day-three'?DAY_THREE_CHECKPOINTS:foundation==='day-two'?DAY_TWO_CHECKPOINTS:FOUNDATION_CHECKPOINTS}
export const emptyCheckpointWriting = (): CheckpointWriting => ({contribution: null, reply: null, reflection: null})

export function isIndependentFoundation(state:unknown){
 if(!state||typeof state!=='object'||!('partner_exchange' in state))return false
 const exchange=state.partner_exchange
 return !!exchange&&typeof exchange==='object'&&'mode' in exchange&&exchange.mode==='independent'
}
export function foundationQuestionText(q:{id:string;prompt:string;explanation:string},independent:boolean){
 return independent&&q.id==='f1-revise'?{
  prompt:"After checking the prediction example in Part 2, **write an improved explanation.**\n1. Name one thing the prediction treated as true that you questioned.\n2. Explain how a specific measurement or detail helped you improve it.",
  explanation:'Uses the independent example critique and source evidence to defend a revision. No partner contribution is expected for flagged make-up work.',
 }:{prompt:q.prompt,explanation:q.explanation}
}
export function foundationSectionText(index:number,original:string,independent:boolean,foundation:FoundationKey='day-one'){
 if(!independent)return original
 if(foundation==='day-sixteen')return index<3?sixteenCopy.solo:original
 if(foundation==='day-fifteen')return index<3?fifteenCopy.solo:original
 if(foundation==='day-fourteen')return index===1?fourteenCopy.sample:index<3?fourteenCopy.solo:original
 if(foundation==='day-thirteen')return index<3?thirteenCopy.solo:original
 if(foundation==='day-twelve')return index===1?twelveCopy.sample:index<3?twelveCopy.solo:original
 if(foundation==='day-eleven')return index===1?elevenCopy.sample:index<3?elevenCopy.solo:original
 if(foundation==='day-ten')return index===0?tenCopy.sample:index<3?tenCopy.solo:original
 if(foundation==='day-nine')return index<3?"Read the matching slides and answer on your own. Name the object, your point of view, and the forces. If a class demonstration is unavailable, use the supplied novel panels and name them as your source. Do not claim measurements you did not collect.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-eight')return index<3?"Read the matching slides and answer on your own. List the known values with signs and the quantity you need to find. State that acceleration is treated as constant before choosing an equation. These are supplied practice data.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-seven')return index<3?"Read the matching slides and answer on your own. Choose a positive direction, include units, and state what you treat as true about the motion. These are supplied practice data, not measurements you collected.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-six')return index<3?"Read the matching slides and answer on your own. State your drawing scale and set your calculator to degrees. These are supplied examples, not measurements you collected.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-five')return index<3?"Read the matching slides and answer on your own. Use the supplied values for the fictional calculation and the slide timers.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-four')return index<3?"Read the matching slides and answer on your own. Use the slide timers and graph-paper tasks at your own pace.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-three')return index===1?DAY_THREE_SAMPLE_DATA:index<3?"Read the matching slides and answer on your own. If you do not have a teacher-approved equipment option, use the supplied sample data in Part 2.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 if(foundation==='day-two')return index<3?"Read the matching slides and answer on your own. You may trace the walking route on paper using equal units.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**":original
 return [
  "Read the briefing. Keep the fictional asteroid story separate from the cart observations. Answer on your own.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**",
  "Read the briefing. Keep the fictional asteroid story separate from the cart observations. Answer on your own.\nAt each approved independent stop:\n1. **Write your own idea.**\n2. **Check what is right, wrong, or missing in the supplied example.**\n3. **Write your final explanation. Say what you learned or changed.**",
 ][index]??original
}
