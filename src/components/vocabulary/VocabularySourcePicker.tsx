'use client'
import {useState} from 'react'
import type {VocabularyTeachingChoice,VocabularyTeachingSource} from '@/lib/vocab-teaching-source'
import {teachingSourceKey} from '@/lib/vocab-teaching-source'
import {physicsUnits} from '@/data/physics-units'
const field='mt-1 min-h-11 w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-sm'
export default function VocabularySourcePicker({choices,value,unit,onChange,disabled=false}:{choices:VocabularyTeachingChoice[];value:VocabularyTeachingSource|null;unit:string;onChange:(value:VocabularyTeachingSource|null,unit:string)=>void;disabled?:boolean}){
  const [kind,setKind]=useState(value?.kind??'none')
  const [search,setSearch]=useState('')
  const units=[...new Map([...physicsUnits.map(u=>[u.id,u.name] as const),...choices.map(c=>[c.unit_id,c.unit_name] as const)]).entries()]
  const matches=choices.filter(c=>c.source.kind===kind&&(!unit||c.unit_id===unit)&&(c.key===teachingSourceKey(value)||c.label.toLowerCase().includes(search.toLowerCase())))
  return <fieldset disabled={disabled} className="min-w-0 space-y-3">
    <legend className="font-medium">Connect vocabulary to</legend>
    <label className="block text-sm">Connection type<select aria-label="Vocabulary connection type" className={field} value={kind} onChange={e=>{const next=e.target.value as typeof kind;setKind(next);setSearch('');onChange(next==='none'?{kind:'none'}:null,unit)}}><option value="none">Unit only · no specific lesson or deck</option><option value="video">Video lesson</option><option value="deck">Class presentation deck</option></select></label>
    <label className="block text-sm">Unit<select aria-label="Vocabulary source unit" className={field} value={unit} onChange={e=>{setSearch('');onChange(kind==='none'?{kind:'none'}:null,e.target.value)}}><option value="">Choose unit</option>{units.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    {kind!=='none'&&<><label className="block text-sm">Find a {kind==='video'?'video lesson':'day or deck'}<input aria-label="Find vocabulary connection" className={field} value={search} onChange={e=>setSearch(e.target.value)} placeholder={kind==='video'?'Video title or topic':'Day number or topic'}/></label><label className="block text-sm">{kind==='video'?'Video lesson':'Course Plans presentation deck'}<select aria-label="Vocabulary connection" className={field} value={teachingSourceKey(value)} onChange={e=>{const choice=choices.find(c=>c.key===e.target.value);onChange(choice?.source??null,choice?.unit_id??unit)}}><option value="">Choose {kind==='video'?'video lesson':'presentation deck'}…</option>{value&&teachingSourceKey(value)&&!matches.some(c=>c.key===teachingSourceKey(value))&&<option value={teachingSourceKey(value)}>Current connection · unavailable in this catalog</option>}{matches.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></label>{!matches.length&&<p className="text-sm text-muted-foreground">No matching {kind==='video'?'video lessons':'authored decks'} for your classes. Try another unit or search.</p>}</>}
  </fieldset>
}
