import {DAY_NINE_CHECKPOINTS} from './day-nine-checkpoints'
import {DAY_EIGHT_CHECKPOINTS} from './day-eight-checkpoints'
import {DAY_SEVEN_CHECKPOINTS} from './day-seven-checkpoints'
import {DAY_SIX_CHECKPOINTS} from './day-six-checkpoints'
import {DAY_FIVE_CHECKPOINTS} from './day-five-checkpoints'
import {DAY_FOUR_CHECKPOINTS} from './day-four-checkpoints'
import {DAY_THREE_CHECKPOINTS,DAY_THREE_SAMPLE_DATA} from './day-three-checkpoints'
import {DAY_TWO_CHECKPOINTS} from './day-two-checkpoints'
export type FoundationKey = 'day-one'|'day-two'|'day-three'|'day-four'|'day-five'|'day-six'|'day-seven'|'day-eight'|'day-nine'
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
 peers?: {slot:number;name:string;contribution:string|null;reply:string|null;replyToSlot:number|null}[]
 sharedCount?: number; repliedCount?: number; replyToSlot?: number|null
}
export type FoundationMember = {slot:number;name:string;isYou:boolean;independent:'pending'|'approved'|null;avatar:{traits:Record<string,string>;equipped:Record<string,string>}}
export type FoundationPair = {code: string; slot: number; peerJoined: boolean; peerName: string | null; checkpoints: CheckpointView[]; complete: boolean; makeup?: boolean; approved?: boolean; flaggedAt?: string; peerIndependent?: boolean;protocolVersion?:number;started?:boolean;members?:FoundationMember[];items?:AvatarItem[];realtime?:{url:string;key:string;topic:string}|null}
export type Checkpoint = {
 id: CheckpointId; title: string; roles: [string, string]; prompts: [string, string]
 discuss: string; reply: string; reflection: string; demand: AssessmentDemand
 solo: {idea:string;example:string;critique:string;reflection:string}
}
export const FOUNDATION_CHECKPOINTS: readonly Checkpoint[] = [
 {
  id: 'evidence', title: 'Compare the evidence', roles: ['Evidence finder', 'Assumption checker'],
  prompts: [
   'Choose one observation from the slides. Cite its slide or labeled value and explain what it supports. Distinguish the cart model from the fictional asteroid premise.',
   'Choose one claim the briefing does not yet establish. Explain what is missing and name a measurement that would help check it.',
  ],
  discuss: 'Read each other’s ideas aloud. Together, identify one thing you know and one thing you still need to measure.',
  reply: 'Point to a specific detail in your partner’s idea. Explain whether it is evidence or an inference, and add a source detail or a measurement that would strengthen it.',
  reflection: 'In your own words, what can you now defend with evidence, and what remains uncertain? Explain how your partner’s idea helped you decide.',
  demand: {blooms: 'Analyze', dok: 2, evidence: 'Distinguishes evidence from inference and connects a peer’s idea to a supported claim and an uncertainty.'},
  solo: {
   idea: 'Choose a stated observation from the slides and cite its source. Explain what it supports and one conclusion it does not establish.',
   example: '“The object is approaching Earth, so a collision is certain.”',
   critique: 'Which part is a stated observation, and which is an unsupported inference? Explain what measurements are missing.',
   reflection: 'Rewrite the claim in your own words so it accurately distinguishes what we know from what remains uncertain.',
  },
 },
 {
  id: 'model', title: 'Challenge the prediction', roles: ['Model tester', 'Prediction builder'],
  prompts: [
   'The model predicted 6 m, but the next reading is 5 m. Explain two possible causes and a check that would help distinguish them.',
   'The cart is at 0, 2, and 4 m at 0, 1, and 2 s. Explain your prediction for 3 s and the assumption it depends on.',
  ],
  discuss: 'You have switched roles. Compare the prediction with the unexpected reading. Agree on a useful next check and explain why it helps.',
  reply: 'Address one assumption or proposed check in your partner’s explanation. Use the numbers or explain what result would distinguish the possible causes.',
  reflection: 'State your current explanation for the mismatch. Use an idea from your partner and explain what new evidence would make you change your mind.',
  demand: {blooms: 'Evaluate', dok: 3, evidence: 'Critiques a conditional prediction and defends a test that distinguishes competing explanations.'},
  solo: {
   idea: 'Predict the next position after 0, 2, and 4 m at one-second intervals. State the assumption. Give two explanations for a new reading of 5 m.',
   example: '“The model says 6 m. The 5 m reading must be wrong, so we should discard it.”',
   critique: 'Evaluate this response to unexpected evidence. Propose a check that could distinguish changing motion from a measurement problem.',
   reflection: 'State your revised explanation and describe what evidence would make you change your mind.',
  },
 },
 {
  id: 'questions', title: 'Build a better question', roles: ['Question designer', 'Measurement planner'],
  prompts: [
   'Choose one of your wonder questions. Make it specific enough to investigate, and explain whether it needs physics evidence, human decisions, or both.',
   'Choose one of your wonder questions. Propose two measurements and explain how each helps. Identify any part that measurements alone cannot decide.',
  ],
  discuss: 'Combine your strengths: sharpen one question and its measurement plan. Each person should explain one improvement before you write your responses.',
  reply: 'Use a specific idea from your partner to improve the question or measurement plan. Explain why the improvement makes it more useful or testable.',
  reflection: 'Write your own improved question and measurement plan. Name the partner idea you used and justify one change. Do not copy a shared final answer.',
  demand: {blooms: 'Create', dok: 3, evidence: 'Constructs a testable question with a justified measurement plan and attributes a substantive peer contribution.'},
  solo: {
   idea: 'Choose a wonder question. Identify whether it needs physics evidence, human decisions, or both, and propose two useful measurements.',
   example: '“Can we stop it? Measuring its speed once will tell us which response everyone should choose.”',
   critique: 'Identify a missing measurement and a decision that measurements alone cannot settle. Explain why the proposed plan is insufficient.',
   reflection: 'Write a more specific question and an improved measurement plan. Justify a change you made after critiquing the example.',
  },
 },
]
export function getFoundationCheckpoints(foundation:FoundationKey='day-one'){return foundation==='day-nine'?DAY_NINE_CHECKPOINTS:foundation==='day-eight'?DAY_EIGHT_CHECKPOINTS:foundation==='day-seven'?DAY_SEVEN_CHECKPOINTS:foundation==='day-six'?DAY_SIX_CHECKPOINTS:foundation==='day-five'?DAY_FIVE_CHECKPOINTS:foundation==='day-four'?DAY_FOUR_CHECKPOINTS:foundation==='day-three'?DAY_THREE_CHECKPOINTS:foundation==='day-two'?DAY_TWO_CHECKPOINTS:FOUNDATION_CHECKPOINTS}
export const emptyCheckpointWriting = (): CheckpointWriting => ({contribution: null, reply: null, reflection: null})

export function isIndependentFoundation(state:unknown){
 if(!state||typeof state!=='object'||!('partner_exchange' in state))return false
 const exchange=state.partner_exchange
 return !!exchange&&typeof exchange==='object'&&'mode' in exchange&&exchange.mode==='independent'
}
export function foundationQuestionText(q:{id:string;prompt:string;explanation:string},independent:boolean){
 return independent&&q.id==='f1-revise'?{
  prompt:'After critiquing the prediction example in Part 2, write your revised explanation. Name a specific assumption you challenged and explain how you improved the explanation with evidence.',
  explanation:'Uses the independent example critique and source evidence to defend a revision. No partner contribution is expected for flagged make-up work.',
 }:{prompt:q.prompt,explanation:q.explanation}
}
export function foundationSectionText(index:number,original:string,independent:boolean,foundation:FoundationKey='day-one'){
 if(!independent)return original
 if(foundation==='day-nine')return index<3?'Read the matching slides and write your own answers. Identify the object, reference frame and interactions. Use the novel as explicitly supplied story evidence when a demonstration is unavailable; do not claim measurements you did not collect. Complete each approved independent stop with your idea, an example critique and your own reflection.':original
 if(foundation==='day-eight')return index<3?'Read the matching slides and write your own answers. List signed givens, the unknown and the constant-acceleration assumption before choosing an equation. Complete each approved independent stop by writing your idea, critiquing the example and saving your reflection. The examples are supplied practice data.':original
 if(foundation==='day-seven')return index<3?'Read the matching slides and write your own answers. Choose a positive direction and include units and model assumptions. Complete each approved independent stop by writing your idea, critiquing the supplied example and saving your reflection. These examples are practice data, not measurements you collected.':original
 if(foundation==='day-six')return index<3?'Read the matching slides and write your own answers. Use a stated drawing scale and degree-mode calculator. Complete each approved independent stop by writing your idea, critiquing the example and saving your reflection. The examples are supplied, not measurements you collected.':original
 if(foundation==='day-five')return index<3?'Read the matching slides and write your own answers. Use the supplied fictional model inputs and original timers. Complete each approved independent stop by writing your idea, critiquing the example and saving your own reflection.':original
 if(foundation==='day-four')return index<3?'Read the matching slides and write your answers independently. Complete the approved stop by sharing your idea, critiquing the provided example and saving your own reflection. Use the original timers and graph-paper tasks at your own pace.':original
 if(foundation==='day-three')return index===1?DAY_THREE_SAMPLE_DATA:index<3?'Read the matching slides and answer independently. Complete the approved stop by writing your idea, critiquing the example and saving your own reflection. Use the provided samples in Part 2 if you do not have a teacher-approved equipment alternative.':original
 if(foundation==='day-two')return index<3?'Read the matching slides and answer on your own. Then complete the approved independent stop: write your idea, critique the example, and save your reflection. You may trace the walking route on paper with equal units.':original
 return [
  'Read the briefing and distinguish the fictional scenario from the evidence in a model. Answer on your own, then complete the independent make-up stop below.',
  'Answer on your own, then challenge a sample explanation at the independent stop below. A prediction states what would follow if a model continues to apply.',
 ][index]??original
}
