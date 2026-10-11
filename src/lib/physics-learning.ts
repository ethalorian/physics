import catalog from '@/data/physics-learning-catalog.json'
import type { BlockDocument } from '@/data/content-blocks'
import { lessonTargetReferences } from './lesson-target-references'

export interface PhysicsTarget { id:string;slug:string;statement:string;domain?:string|null;unit_id:string;lesson_id?:string|null }
export interface PhysicsLearningEntry {
  id:string;slug:string;title:string;unitId:string;kind:string;
  targets:{slug:string;statement:string;domain:string}[];
  readings:{chapter:number;sectionIds:string[];track?:string}[];
  hasSimulation:boolean;hasWorkedExample:boolean;videoIds:string[];source:string;replaces?:string;
}
export const PHYSICS_GROUPS: Record<string,string> = { foundations:'Foundations', 'unit-1':'Motion & forces', 'unit-2':'Gravitation & fields', 'unit-3':'Momentum & collisions', 'unit-4':'Energy & work', 'unit-5':'Thermal physics', 'unit-6':'Waves, sound & light', 'unit-7':'Electricity & magnetism', 'unit-8':'Design & build' }
const byId=new Map(catalog.map(entry=>[entry.id,entry]))
/** Current content and target definitions win over the one-time migration map.
 * Only safe metadata leaves the server. Call after track filtering. */
export function physicsLearningEntry(lesson:{id:string;title:string;slug:string;unit_id?:string|null;content_blocks?:BlockDocument|null}, targets?:PhysicsTarget[]):PhysicsLearningEntry|undefined {
  const existing=byId.get(lesson.id), document=lesson.content_blocks, path=document?.learningPath
  if(!existing&&!path&&!/^unit-[1-8]$/.test(lesson.unit_id??''))return undefined
  const blocks=document?.blocks, refs=new Set(lessonTargetReferences(document))
  const assigned=targets?.filter(t=>refs.has(t.slug)||refs.has(t.id)||t.lesson_id===lesson.id)
  const foundations=path?.foundations??(existing?.unitId==='foundations')
  return {
    id:lesson.id,slug:lesson.slug,title:lesson.title.replace(/^Day\s+\d+(?:[–-]\d+)?\s*[—–:-]\s*/i,''),
    unitId:foundations?'foundations':lesson.unit_id??existing?.unitId??'unit-1',
    kind:path?.kind??existing?.kind??(document?.dayType==='LAB'?'investigation':'lesson'),
    targets:assigned?assigned.map(t=>({slug:t.slug,statement:t.statement,domain:t.domain??'knowledge'})):blocks?blocks.flatMap(b=>b.type==='target'?[{slug:b.targetId??b.id,statement:b.statement,domain:'knowledge'}]:[]):existing?.targets??[],
    readings:blocks?blocks.flatMap(b=>b.type==='reading'?[{chapter:b.chapter,sectionIds:b.sectionIds,track:b.visibilityTrack}]:[]):existing?.readings??[],
    hasSimulation:blocks?blocks.some(b=>b.type==='sim_embed'||b.type==='position_explorer'):existing?.hasSimulation??false,
    hasWorkedExample:blocks?blocks.some(b=>b.type==='worked_example'):existing?.hasWorkedExample??false,
    videoIds:blocks?[...new Set(blocks.flatMap(b=>b.type==='instruction_video'&&/^[A-Za-z0-9_-]{11}$/.test(b.youtubeId)?[b.youtubeId]:[]))]:existing?.videoIds??[],
    source:document?path&&document.presentation==='physics-path'?'new':'existing':existing?.source??'existing',
    ...(existing&&'replaces' in existing&&typeof existing.replaces==='string'?{replaces:existing.replaces}:{})
  }
}
/** A draft replacement must not push currently published instruction into history. */
export function replacedPhysicsLessons(rows:{replaces?:string;published?:boolean}[]):Set<string> {
  return new Set(rows.flatMap(row=>row.published!==false&&row.replaces?[row.replaces]:[]))
}
