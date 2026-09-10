import {MISSION_VERSION,SESSION_STEPS,missionBySlug,type CompetencyCode} from './catalog'
import {MATH_TEACHING_GUIDES} from '@/lib/math-teaching-guides'
import {gradeTask,makeTask} from './tasks'
import type {Answer,MissionState,Session,SessionView} from './types'
export const initialState=():MissionState=>({index:0,level:1,answers:[],hintCount:0,errorCodes:[],evidence:[],revealed:false,checked:false,draft:{},paused:false})
export function phase(s:Session){return s.mode==='challenge'?'Challenge':s.mode==='retention'?'Delayed check':s.state.index<2?'Find your starting point':s.state.index<4?'Build the strategy':'Try independently'}
export function currentTask(s:Session){const codes=missionBySlug(s.mission)!.codes;const code=s.mode==='challenge'?codes[s.state.index%codes.length] as CompetencyCode:s.code;return makeTask(code,s.seed,s.state.index,s.mode==='challenge'?2:s.state.level,s.mode==='challenge'?Math.floor(s.state.index/codes.length):s.state.variant??s.state.index)}
export function viewSession(s:Session):SessionView{
 const task=s.status==='active'?currentTask(s):null;
 const publicTask=task?{id:task.id,code:task.code,title:task.title,prompt:task.prompt,fields:task.fields,board:task.board,data:task.data,explanation:task.explanation,review:task.review}:null;
 return {id:s.id,mission:s.mission,code:s.code,mode:s.mode,index:s.state.index,phase:phase(s),level:s.state.level,revision:s.revision,status:s.status,ranked:s.ranked,xp:s.xp,score:s.score,maxScore:(s.mode==='challenge'?Array.from({length:SESSION_STEPS},(_,i)=>missionBySlug(s.mission)!.codes[i%missionBySlug(s.mission)!.codes.length]).filter(c=>c!=='QE3').length:SESSION_STEPS)*100,task:publicTask,hint:s.state.hintCount&&task?task.hint:null,worked:s.state.revealed&&task?task.worked:[],state:s.state,strategy:task&&(s.state.hintCount>0||phase(s)==='Build the strategy')?{idea:MATH_TEACHING_GUIDES[task.code].idea,words:MATH_TEACHING_GUIDES[task.code].words}:undefined};
}
export function transition(session:Session,action:string,input:unknown):{state:MissionState;ranked:boolean;complete:boolean;score:number}{
 if(session.version!==MISSION_VERSION)throw Error('This session uses an older mission version. Contact your teacher.');
 const s=structuredClone(session.state),task=currentTask(session);let ranked=session.ranked && (session.mode!=='challenge'||session.created_at.slice(0,10)===new Date().toISOString().slice(0,10));
 const raw=input&&typeof input==='object'?input as Record<string,unknown>:{};
 const answer:Answer=Object.fromEntries(task.fields.map(f=>[f.id,typeof raw[f.id]==='string'?(raw[f.id] as string).slice(0,1500):'']));
 if(action==='pause'){s.paused=true;s.draft=answer;}
 else if(action==='resume'){s.paused=false;}
 else if(s.paused)throw Error('Resume the mission first.');
 else if(action==='draft'){s.draft=answer;}
 else if(action==='hint'||action==='worked'){s.draft=answer;s.hintCount++;s.revealed=action==='worked'||s.revealed;ranked=false;}
 else if(action==='answer'){
  if(s.checked&&(s.feedback?.correct||session.mode==='challenge'||s.revealed))throw Error('Continue to the next task.');
  if(s.answers.length>=5)throw Error('Review the worked example, then continue to a fresh task.');
  const result=gradeTask(task,answer);if(result.error==='incomplete')throw Error(result.message);
  if(!s.answers.length)s.firstHintCount=s.hintCount;
  s.answers.push(answer);s.draft=answer;s.checked=true;s.feedback={correct:result.correct,message:result.message,review:result.review};
  if(result.error)s.errorCodes.push(result.error);
 }else if(action==='next'){
  if(!s.checked||(!s.feedback?.correct&&!s.revealed&&session.mode!=='challenge'))throw Error('Try again or review the worked example before continuing.');
  const first=gradeTask(task,s.answers[0]);
  s.evidence.push({taskId:task.id,code:task.code,phase:phase(session),prompt:task.prompt,answers:s.answers,firstCorrect:first.correct,firstAssisted:!!s.firstHintCount||(session.mode==='practice'&&s.index>=2&&s.index<4),correct:s.feedback!.correct,assisted:s.hintCount>0||s.answers.length>1||(session.mode==='practice'&&s.index>=2&&s.index<4),hints:s.hintCount,errorCodes:[...new Set(s.errorCodes)],review:!!task.review,explanation:task.explanation,completedAt:new Date().toISOString()});
  s.index++;
  if(session.mode==='practice'){
   const recent=s.evidence.slice(-2);
   const repeated=recent.length===2&&recent[0].errorCodes.some(e=>recent[1].errorCodes.includes(e));
   if(repeated)s.variant=session.state.variant??session.state.index;else delete s.variant;
   s.level=recent.length===2&&recent.every(e=>e.firstCorrect&&!e.hints)?2:1;
  }
  s.answers=[];s.hintCount=0;delete s.firstHintCount;s.errorCodes=[];s.feedback=undefined;s.revealed=false;s.checked=false;s.draft={};
 }else throw Error('Unknown mission action.');
 return {state:s,ranked,complete:s.index>=SESSION_STEPS,score:s.evidence.filter(e=>e.firstCorrect&&!e.assisted&&!e.review).length*100};
}
