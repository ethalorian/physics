'use client'
import {useState} from 'react'
import type {VocabularyTeachingChoice} from '@/lib/vocab-teaching-source'

/** Each checked source contributes words to the same assignment. */
export default function VocabularyAssignmentSources({choices,selectedKeys,onToggle}:{choices:VocabularyTeachingChoice[];selectedKeys:string[];onToggle:(key:string)=>void}){
  const [kind,setKind]=useState('all'),[search,setSearch]=useState('')
  const selected=choices.filter(c=>selectedKeys.includes(c.key))
  const visible=choices.filter(c=>(kind==='all'||c.source.kind===kind)&&`${c.unit_name} ${c.label}`.toLowerCase().includes(search.trim().toLowerCase()))
  const field='mt-1 min-h-11 min-w-0 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'
  return <fieldset className="min-w-0 space-y-3 rounded-lg border border-border p-3">
    <legend className="px-1 font-medium">Lessons and presentation decks</legend>
    <p className="text-sm text-muted-foreground">Select one or more sources. Their words combine into one assignment. You can uncheck individual words below.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block min-w-0 text-sm">Source type<select aria-label="Vocabulary source type" className={field} value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Videos and presentation decks</option><option value="video">Video lessons</option><option value="deck">Class presentation decks</option></select></label>
      <label className="block min-w-0 text-sm">Find a lesson or deck<input aria-label="Find assignment sources" className={field} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title, day number, or unit"/></label>
    </div>
    <div className="max-h-64 space-y-1 overflow-auto rounded-lg border border-border p-2">
      {visible.map(c=><label key={c.key} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted"><input type="checkbox" value={c.key} aria-label={`Include ${c.unit_name}: ${c.label}`} checked={selectedKeys.includes(c.key)} onChange={()=>onToggle(c.key)} className="mt-1 h-5 w-5 shrink-0"/><span className="min-w-0 text-sm"><span className="block font-medium">{c.label}</span><span className="text-muted-foreground">{c.source.kind==='video'?'Video lesson':'Presentation deck'} · {c.unit_name}</span></span></label>)}
      {!visible.length&&<p className="p-2 text-sm text-muted-foreground">No connected word sets match. Choose a class, try another search, or connect a word set to a video lesson or deck.</p>}
    </div>
    {selected.length>0&&<div className="space-y-2"><p role="status" className="text-sm font-medium">{selected.length} {selected.length===1?'source':'sources'} selected for this assignment</p><div className="flex flex-wrap gap-2">{selected.map(c=><button key={c.key} type="button" aria-label={`Remove ${c.label}`} onClick={()=>onToggle(c.key)} className="min-h-11 max-w-full rounded-lg border border-border bg-muted px-3 py-2 text-left text-sm">{c.label} <span aria-hidden="true">×</span></button>)}</div></div>}
  </fieldset>
}
