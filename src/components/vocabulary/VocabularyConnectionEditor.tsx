'use client'
import {useState} from 'react'
import {Button} from '@/components/ui/button'
import type {VocabularySet} from '@/contexts/VocabularyContext'
import type {VocabularyTeachingChoice,VocabularyTeachingSource} from '@/lib/vocab-teaching-source'
import VocabularySourcePicker from './VocabularySourcePicker'
export default function VocabularyConnectionEditor({set,choices,onSave,onCancel}:{set:VocabularySet;choices:VocabularyTeachingChoice[];onSave:(source:VocabularyTeachingSource,unit:string)=>Promise<void>;onCancel:()=>void}){
  const [source,setSource]=useState<VocabularyTeachingSource|null>(set.teachingSource??set.teachingConnection?.source??{kind:'none'})
  const [unit,setUnit]=useState(set.unit??'')
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  async function save(){
    if(!source||busy)return
    setBusy(true);setError('')
    try{await onSave(source,unit)}
    catch(e){setError(e instanceof Error?e.message:'Could not save the connection')}
    finally{setBusy(false)}
  }
  return <div className="mb-4 space-y-4 rounded-xl border p-4">
    <VocabularySourcePicker choices={choices} value={source} unit={unit} disabled={busy} onChange={(s,u)=>{setSource(s);setUnit(u);setError('')}}/>
    <p className="text-sm text-muted-foreground">This connection helps you find the words while planning and assigning. Assign vocabulary to make it available with a presentation deck.</p>
    {error&&<p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button disabled={busy||!source||!unit} onClick={save}>{busy?'Saving…':'Save connection'}</Button><Button variant="outline" disabled={busy} onClick={onCancel}>Cancel connection changes</Button></div>
  </div>
}
