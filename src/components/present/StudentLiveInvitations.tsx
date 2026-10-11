'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {useSession} from 'next-auth/react'
import {usePathname} from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import {Textarea} from '@/components/ui/textarea'
import {Button} from '@/components/ui/button'
import {isTicket,pulseOptions,pulsePrompt} from '@/lib/presentation-tools'
import type {PresentInvitation} from '@/lib/present-invitation'

/** Site-wide class invitations. No navigation or edits to the student's open work. */
export default function StudentLiveInvitations(){
 const {data:session,status}=useSession(),pathname=usePathname()
 const userId=session?.user?.id
 const enabled=status==='authenticated'&&session?.user?.role==='student'&&!pathname?.startsWith('/embed')
 const [items,setItems]=useState<PresentInvitation[]>([]),[dismissed,setDismissed]=useState<Set<string>>(new Set())
 const [stale,setStale]=useState(false),[choice,setChoice]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [written,setWritten]=useState('')
 const [permission,setPermission]=useState<NotificationPermission|'unsupported'>('unsupported')
 const completed=useRef(new Set<string>()),notified=useRef(new Set<string>()),notifications=useRef(new Map<string,Notification>())
 const pending=useRef(false),refresh=useRef(()=>{})
 const current=items.find(i=>!dismissed.has(i.id)||i.required&&!stale)
 const storageKey=(id:string)=>`live-class-invite:${userId}:${id}`
 function dismiss(id:string){setDismissed(previous=>new Set([...previous,id]));try{sessionStorage.setItem(storageKey(id),'1')}catch{}}
 const show=useCallback((id:string)=>{setDismissed(previous=>new Set([...previous].filter(k=>k!==id)));try{sessionStorage.removeItem(`live-class-invite:${userId}:${id}`)}catch{}},[userId])
 useEffect(()=>{setPermission('Notification' in window?Notification.permission:'unsupported')},[])
 useEffect(()=>{
  setItems([]);setDismissed(new Set());setStale(false);setNotice('');completed.current.clear();notified.current.clear()
  if(!enabled||!userId)return
  const openNotifications=notifications.current
  let active=true,reading=false,again=false,timer:ReturnType<typeof setTimeout>,controller:AbortController|null=null
  const read=async()=>{
   clearTimeout(timer);if(reading){again=true;return}reading=true;controller=new AbortController()
   const deadline=setTimeout(()=>controller?.abort(),10000)
   try{
    const response=await fetch('/api/present/invitations',{cache:'no-store',signal:controller.signal})
    if(response.status===401||response.status===403){if(active){setItems([]);setStale(false)}return}
    if(!response.ok)throw Error('Could not check live class')
    const data=await response.json() as {invitations:PresentInvitation[]}
    if(active){const invitations=data.invitations.filter(i=>!completed.current.has(i.id));setItems(invitations);setStale(false);setDismissed(previous=>{const next=new Set(previous);for(const i of invitations)try{if(sessionStorage.getItem(`live-class-invite:${userId}:${i.id}`))next.add(i.id)}catch{}return next})}
   }catch{if(active)setStale(true)}
   finally{clearTimeout(deadline);reading=false;if(active){timer=setTimeout(read,again?0:document.hidden?10000:3000);again=false}}
  }
  const wake=()=>{void read()},offline=()=>setStale(true)
  refresh.current=wake;void read()
  window.addEventListener('focus',wake);window.addEventListener('online',wake);window.addEventListener('offline',offline);document.addEventListener('visibilitychange',wake)
  return()=>{active=false;controller?.abort();clearTimeout(timer);refresh.current=()=>{};window.removeEventListener('focus',wake);window.removeEventListener('online',wake);window.removeEventListener('offline',offline);document.removeEventListener('visibilitychange',wake);for(const n of openNotifications.values())n.close();openNotifications.clear()}
 },[enabled,userId])
 useEffect(()=>{setChoice(null);setError('');try{setWritten(sessionStorage.getItem(`live-class-draft:${userId}:${current?.id}`)??'')}catch{setWritten('')}},[current?.id,userId])
 useEffect(()=>{if(!notice)return;const timeout=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(timeout)},[notice])
 useEffect(()=>{
  const ids=new Set(items.map(i=>i.id));for(const [id,n] of notifications.current)if(!ids.has(id)){n.close();notifications.current.delete(id)}
  for(const item of items){if(notified.current.has(item.id))continue;notified.current.add(item.id)
   if(permission==='granted'&&document.hidden){try{const n=new Notification(item.required?'Your class needs a poll response':'Live class activity',{body:item.kind==='lobby'?'Your teacher opened a group lobby. Return to the classroom tab to join.':'Your teacher opened a live poll. Return to the classroom tab to respond.',tag:item.id});n.onclick=()=>{window.focus();show(item.id);n.close()};notifications.current.set(item.id,n)}catch{}}
  }
 },[items,permission,show])
 async function respond(){
  if(!current||current.kind!=='pulse'||(isTicket(current.pulse)?!written.trim():choice===null)||pending.current||stale)return
  pending.current=true;setBusy(true);setError('')
  const id=current.id
  try{const response=await fetch('/api/present/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:current.sessionId,action:isTicket(current.pulse)?'ticket':'pulse',pulse_id:current.pulse.id,choice,response:written})});const data=await response.json();if(!response.ok){if(response.status===409||response.status===403)refresh.current();throw Error(data.error??'Your response was not saved. Try again.')}completed.current.add(id);try{sessionStorage.removeItem(`live-class-draft:${userId}:${id}`)}catch{}setItems(previous=>previous.filter(i=>i.id!==id));setNotice('Response saved. You can continue working.');refresh.current()}
  catch(e){setError(e instanceof Error?e.message:'Your response was not saved. Try again.')}
  finally{pending.current=false;setBusy(false)}
 }
 if(!enabled)return null
 const required=Boolean(current?.required&&!stale)
 return <>
  {notice&&<p role="status" className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-xl border bg-background p-4 shadow-lg">{notice}</p>}
  {!!items.length&&!current&&<div className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-xl border bg-background p-4 shadow-lg"><p className="font-medium">{items.some(i=>i.required)?'Your class needs a response':'Your teacher opened a live activity'}</p><Button className="mt-2 min-h-11" onClick={()=>show(items[0].id)}>Open live activity</Button></div>}
  <Dialog.Root open={Boolean(current)} onOpenChange={open=>{if(!open&&current&&!required&&!busy)dismiss(current.id)}}>
   <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm"/><Dialog.Content onEscapeKeyDown={e=>{if(required||busy)e.preventDefault()}} onPointerDownOutside={e=>{if(required||busy)e.preventDefault()}} className="fixed left-1/2 top-1/2 z-[81] grid max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-lg">
    <Dialog.Title className="text-xl font-bold">{current?.kind==='lobby'?'Join your class lobby':current?.kind==='pulse'&&current.pulse.kind==='warmup'?'Class warm-up':current?.kind==='pulse'&&current.pulse.kind==='exit_ticket'?'Class exit ticket':current?.kind==='pulse'&&current.pulse.kind==='solo'?'Class solo activity':'Live class poll'}</Dialog.Title>
    <Dialog.Description>{current?.courseName}{current?.required?' · Your teacher requires a response.':' · Your teacher invited you to participate.'}</Dialog.Description>
    {stale&&<p role="alert" className="rounded-lg bg-muted p-3">Live connection interrupted. Reconnecting… Your other work is still here.</p>}
    {current?.kind==='pulse'?<><p className="font-medium whitespace-pre-wrap">{pulsePrompt(current.pulse)}</p><p className="text-sm text-muted-foreground">{current.pulse.anonymous?'Anonymous: your teacher sees totals without names.':'Your teacher can see your response.'}</p>{isTicket(current.pulse)?<label className="text-sm font-medium">Your response<Textarea aria-label="Your activity response" className="mt-2 min-h-36 text-base" maxLength={5000} disabled={busy} value={written} onChange={e=>{setWritten(e.target.value);try{sessionStorage.setItem(`live-class-draft:${userId}:${current.id}`,e.target.value)}catch{}}}/><span className="text-xs text-muted-foreground">Explain your thinking. Your teacher will review this for the learning target.</span></label>:<div role="group" aria-label="Poll answer choices" className="grid gap-2">{pulseOptions(current.pulse).map((option,i)=><Button key={i} variant={choice===i?'default':'outline'} aria-pressed={choice===i} disabled={busy||stale} className="min-h-12 h-auto justify-start whitespace-normal text-left" onClick={()=>setChoice(i)}>{option}</Button>)}</div>}<Button className="min-h-12" disabled={(isTicket(current.pulse)?!written.trim():choice===null)||busy||stale} onClick={respond}>{busy?'Saving response…':'Submit response'}</Button></>:current?.kind==='lobby'?<><p className="whitespace-pre-wrap">{current.prompt}</p><p>Join code: <strong>{current.code}</strong></p><Button asChild className="min-h-12"><a href={'/lobby/'+encodeURIComponent(current.code)} target="_blank" rel="noopener noreferrer" onClick={()=>dismiss(current.id)}>Join lobby in a new tab</a></Button><p className="text-sm text-muted-foreground">Your current work stays open in this tab.</p></>:current?.kind==='lesson_poll'?<><p>{current.prompt}</p><Button asChild className="min-h-12"><a href={current.href} target="_blank" rel="noopener noreferrer" onClick={()=>dismiss(current.id)}>Open live question</a></Button></>:null}
    {error&&<p role="alert" className="text-destructive">{error}</p>}
    {!required&&<Button variant="outline" disabled={busy} className="min-h-11" onClick={()=>current&&dismiss(current.id)}>{stale?'Keep working while reconnecting':'Remind me in the corner'}</Button>}
    {permission==='default'&&<div className="border-t pt-3"><Button variant="outline" className="min-h-11" onClick={()=>{void Notification.requestPermission().then(setPermission)}}>Enable browser alerts</Button><p className="mt-2 text-xs text-muted-foreground">Optional alerts when you switch tabs. Keep the classroom tab open.</p></div>}
   </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
 </>
}
