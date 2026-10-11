export type VocabularyTeachingSource = {kind:'none'} | {kind:'video';lesson_id:string} | {kind:'deck';unit_id:string;day:number;track:'cpa'|'honors'}
export interface VocabularyTeachingChoice {key:string;source:VocabularyTeachingSource;label:string;unit_id:string;unit_name:string;program:string;href:string}
export function teachingSourceKey(source: VocabularyTeachingSource | null | undefined): string {
  return source?.kind==='video'?`video:${source.lesson_id}`:source?.kind==='deck'?`deck:${source.unit_id}:${source.day}:${source.track}`:''
}
export function validTeachingSource(value: unknown): value is VocabularyTeachingSource {
  if(!value||typeof value!=='object'||Array.isArray(value))return false
  const s=value as Record<string,unknown>
  return s.kind==='none'?Object.keys(s).length===1:s.kind==='video'?typeof s.lesson_id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.lesson_id):s.kind==='deck'&&typeof s.unit_id==='string'&&/^unit-\d+$/.test(s.unit_id)&&Number.isSafeInteger(s.day)&&Number(s.day)>0&&(s.track==='cpa'||s.track==='honors')
}

export function teachingDeckLabel(title:string,track:'cpa'|'honors'):string {
  return `${track==='honors'?'Honors':'CPA'} · ${title.replace(/^(?:CPA|Honors) · /,'')}`
}
