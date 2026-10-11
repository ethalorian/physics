import {VIDEO_WATCH_FRACTION} from './lesson-video-xp'
import type {ReleaseStatus} from './lesson-release'

export type ViewingState = 'viewed' | 'in_progress' | 'opened' | 'no_record' | 'untracked'
export const VIEWING_LABELS: Record<ViewingState,string> = {viewed:'Viewed',in_progress:'In progress',opened:'Player opened',no_record:'No viewing recorded',untracked:'Tracking unavailable'}
export interface VideoSpec {youtubeId:string; title:string; duration:number|null; start:number}
export interface RecordedVideo {youtube_id:string; duration_seconds:number; start_seconds:number; watched_seconds:number[]; updated_at:string}
export interface VideoViewing {
  state:ViewingState; percent:number|null; watched:number; duration:number; viewedVideos:number; totalVideos:number; lastActivity:string|null
}
export interface VideoLessonOption {id:string;title:string;unitId:string;sequence:number|null;access:ReleaseStatus;videoCount:number}
export interface VideoStudentRow extends VideoViewing {id:string;name:string;submittedAt:string|null;videos:(VideoViewing & {title:string})[]}
export interface VideoClassReport {
  course:{id:string;name:string};lessons:VideoLessonOption[];lessonId:string|null;students:VideoStudentRow[];checkedAt:string
}
/** Uses unique covered seconds, never playhead position, page visits, or earned XP. */
export function videoViewing(spec:VideoSpec, row?:RecordedVideo):VideoViewing {
  const valid=/^[A-Za-z0-9_-]{11}$/.test(spec.youtubeId) && spec.duration!==null && Number.isInteger(spec.duration) && spec.duration>=15 && spec.duration<=14400 && spec.start>=0 && spec.start<spec.duration
  if(!valid)return {state:'untracked',percent:null,watched:0,duration:0,viewedVideos:0,totalVideos:1,lastActivity:null}
  const duration=spec.duration!-spec.start
  const matching=row?.youtube_id===spec.youtubeId && row.duration_seconds===spec.duration && row.start_seconds===spec.start
  const watched=matching?new Set(row.watched_seconds.filter(s=>Number.isInteger(s)&&s>=spec.start&&s<spec.duration!)).size:0
  const state:ViewingState=watched>=Math.ceil(duration*VIDEO_WATCH_FRACTION)?'viewed':watched>0?'in_progress':matching?'opened':'no_record'
  return {state,percent:Math.min(100,Math.floor(watched/duration*100)),watched,duration,viewedVideos:state==='viewed'?1:0,totalVideos:1,lastActivity:matching?row.updated_at:null}
}
export function lessonViewing(videos:VideoViewing[]):VideoViewing {
  const watched=videos.reduce((n,v)=>n+v.watched,0),duration=videos.reduce((n,v)=>n+v.duration,0),viewedVideos=videos.filter(v=>v.state==='viewed').length
  const untracked=!videos.length||videos.some(v=>v.state==='untracked')
  const state:ViewingState=untracked?'untracked':viewedVideos===videos.length?'viewed':watched>0?'in_progress':videos.some(v=>v.state==='opened')?'opened':'no_record'
  const lastActivity=videos.map(v=>v.lastActivity).filter((v):v is string=>!!v).sort().at(-1)??null
  return {state,percent:untracked?null:Math.floor(watched/duration*100),watched,duration,viewedVideos,totalVideos:videos.length,lastActivity}
}
