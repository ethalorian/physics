'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {foundationRequest} from '@/lib/interactive-assignments/foundations/request'
import {mergeDiscussionDrafts,type DiscussionDrafts,type DraftConflicts} from '@/lib/interactive-assignments/foundations/draft-merge'
const encode=(value:DiscussionDrafts)=>JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))))
export function useDiscussionDrafts(id:string,enabled:boolean,preview:boolean,mode:'group'|'independent'){
 const [values,setValues]=useState<DiscussionDrafts>({}),[ready,setReady]=useState(!enabled||preview),[status,setStatus]=useState(''),[error,setError]=useState(''),[conflicts,setConflicts]=useState<DraftConflicts>({})
 const latest=useRef(values),base=useRef<DiscussionDrafts>({}),version=useRef(0),chain=useRef<Promise<boolean>>(Promise.resolve(true)),loaded=useRef(!enabled||preview),stale=useRef(false),unresolved=useRef<DraftConflicts>({}),mounted=useRef(true)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 const load=useCallback(async()=>{
  const r=await foundationRequest(`/api/interactive-assignments/${id}/partner/drafts`,{cache:'no-store'}),d=await r.json()
  if(!r.ok)throw Error(d.error||'Could not load your discussion drafts.')
  if(!Number.isInteger(d.version)||d.version<0||!d.drafts||typeof d.drafts!=='object'||Array.isArray(d.drafts)||Object.values(d.drafts).some(v=>typeof v!=='string'))throw Error('Could not read saved discussion drafts. Your text is still here.')
  const merged=mergeDiscussionDrafts(base.current,latest.current,d.drafts)
  base.current=d.drafts;version.current=d.version;latest.current=merged.drafts;unresolved.current=merged.conflicts;loaded.current=true;stale.current=false
  if(mounted.current){setValues(merged.drafts);setConflicts(merged.conflicts);setReady(true)}
  if(Object.keys(merged.conflicts).length)throw Error('This answer was edited in another tab. Compare both versions below and choose which to keep. Nothing has been overwritten.')
 },[id])
 const flush=useCallback(()=>{
  const task=chain.current.catch(()=>false).then(async()=>{
   if(!enabled||preview)return true
   try{
    if(Object.keys(unresolved.current).length)throw Error('Compare both versions below and choose which to keep before saving.')
    if(!loaded.current||stale.current)await load()
    for(let attempt=0;attempt<2;attempt++){
     const snapshot=latest.current,serialized=encode(snapshot)
     if(serialized===encode(base.current)){if(mounted.current){setError('');setStatus('Discussion drafts saved privately')}return true}
     if(mounted.current){setStatus('Saving discussion drafts…');setError('')}
     const r=await foundationRequest(`/api/interactive-assignments/${id}/partner/drafts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:version.current,drafts:snapshot})}),d=await r.json()
     if(!r.ok){
      if(r.status===409){stale.current=true;await load();if(encode(latest.current)===encode(base.current)){if(mounted.current){setError('');setStatus('Discussion drafts saved privately')}return true}if(attempt===0)continue}
      throw Error(d.error||'Could not save your discussion draft. Your text is still here.')
     }
     version.current=d.version;base.current=snapshot
     if(mounted.current){setError('');setStatus(encode(latest.current)===serialized?'Discussion drafts saved privately':'Discussion draft changes not saved yet')}
     return true
    }
    return false
   }catch(e){if(mounted.current){setError((e as Error).message);setStatus('Discussion drafts need attention')}return false}
  });chain.current=task;return task
 },[id,enabled,preview,load])
 useEffect(()=>{if(enabled&&!preview)void flush()},[enabled,preview,flush])
 const draft=useCallback((key:string,value:string)=>{const field=mode+':'+key,next={...latest.current,[field]:value};latest.current=next;setValues(next);if(unresolved.current[field]){unresolved.current={...unresolved.current,[field]:{...unresolved.current[field],local:value}};setConflicts(unresolved.current)}setStatus(preview?'Preview only':'Discussion draft changes not saved yet')},[mode,preview])
 const resolve=useCallback((key:string,choice:'local'|'remote')=>{
  const conflict=unresolved.current[key];if(!conflict)return
  const next={...latest.current,[key]:choice==='local'?latest.current[key]??'':conflict.remote},remaining={...unresolved.current};delete remaining[key]
  latest.current=next;unresolved.current=remaining;setValues(next);setConflicts(remaining);setError('');setStatus('Discussion draft changes not saved yet')
  void flush()
 },[flush])
 useEffect(()=>{if(!ready||!enabled||preview)return;const timer=setTimeout(()=>void flush(),800);return()=>clearTimeout(timer)},[values,ready,enabled,preview,flush])
 useEffect(()=>{
  const warn=(e:BeforeUnloadEvent)=>{if(enabled&&!preview&&encode(latest.current)!==encode(base.current)){e.preventDefault();e.returnValue=''}}
  const online=()=>{if(enabled&&!preview)void flush()}
  window.addEventListener('beforeunload',warn);window.addEventListener('online',online)
  return()=>{window.removeEventListener('beforeunload',warn);window.removeEventListener('online',online)}
 },[enabled,preview,flush])
 return {retry:()=>{void flush()},drafts:Object.fromEntries(Object.entries(values).filter(([key])=>key.startsWith(mode+':')).map(([key,v])=>[key.slice(mode.length+1),v])),values,draft,flush,ready,status,error,conflicts,resolve}
}
