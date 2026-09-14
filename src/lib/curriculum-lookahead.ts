import type { CatalogLesson } from './curriculum-readiness'
export function lookAhead(lessons: CatalogLesson[], units: {id:string}[], pacing: {current_lesson_id?:string|null;current_unit_id?:string|null}|undefined, from?:string|null, meetings=10) {
  const ordered=lessons.filter(l=>!(l.unit_id.startsWith('proj-') && (l.lesson_number??0)%10===0)).sort((a,b)=>units.findIndex(u=>u.id===a.unit_id)-units.findIndex(u=>u.id===b.unit_id)||(a.lesson_number??0)-(b.lesson_number??0))
  const anchor=lessons.find(l=>l.id===(from||pacing?.current_lesson_id))
  if(!anchor)return {needsStart:true,inferred:false,items:[] as CatalogLesson[],meetings:0}
  const start=ordered.findIndex(l=>l.id===anchor.id || l.unit_id===anchor.unit_id && (l.lesson_number??0)>(anchor.lesson_number??0))
  if(start<0)return {needsStart:false,inferred:true,items:[] as CatalogLesson[],meetings:0}
  const items:CatalogLesson[]=[];let used=0
  for(const l of ordered.slice(start)){if(used>=meetings)break;items.push(l);used+=Math.max(1,l.planned_days??1)}
  return {needsStart:false,inferred:ordered[start].id!==anchor.id,items,meetings:used}
}
