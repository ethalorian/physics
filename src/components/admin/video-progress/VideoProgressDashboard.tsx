'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {CheckCircle2,PlayCircle,RefreshCw,Video,Clock3} from 'lucide-react'
import {VIEWING_LABELS,type VideoClassReport,type ViewingState} from '@/lib/teacher-video-progress'
import s from './VideoProgress.module.css'

const when=(iso:string|null)=>iso?new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—'
const duration=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`
const accessLabel={open:'Open to class',closed:'Not released',scheduled:'Scheduled',ended:'Closed to class'}
const lessonTitle=(l:VideoClassReport['lessons'][number])=>`${l.sequence?`Video ${l.sequence} · `:''}${l.title}`
type Filter='all'|'viewed'|'in_progress'|'no_record'|'untracked'|'not_submitted'
const filters:{id:Filter;label:string}[]=[{id:'all',label:'Everyone'},{id:'viewed',label:'Viewed'},{id:'in_progress',label:'In progress'},{id:'no_record',label:'No playback'},{id:'not_submitted',label:'Never submitted'},{id:'untracked',label:'Tracking unavailable'}]
export default function VideoProgressDashboard({classId,nameFilter=''}:{classId:string|null;nameFilter?:string}) {
  const [chosen,setChosen]=useState(''),[filter,setFilter]=useState<Filter>('all')
  const [result,setResult]=useState<{key:string;data:VideoClassReport}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[refresh,setRefresh]=useState(0)
  const requestVersion=useRef(0)
  const key=`${classId??''}:${chosen}`
  const data=result?.key===key?result.data:null
  useEffect(()=>{
    if(!classId)return
    let disposed=false,controller:AbortController|undefined
    const load=async()=>{
      const version=++requestVersion.current;controller?.abort();controller=new AbortController();setLoading(true);setError('')
      try {
        const query=new URLSearchParams({class:classId});if(chosen)query.set('lesson',chosen)
        const r=await fetch(`/api/teacher/video-progress?${query}`,{cache:'no-store',signal:controller.signal})
        const d=await r.json();if(!r.ok)throw new Error(d.error??'Could not load video progress.')
        if(!disposed&&version===requestVersion.current)setResult({key,data:d})
      } catch(e){if(!disposed&&version===requestVersion.current&&!controller.signal.aborted)setError((e as Error).message)}
      finally{if(!disposed&&version===requestVersion.current)setLoading(false)}
    }
    void load()
    const check=()=>{if(document.visibilityState==='visible')void load()}
    const timer=setInterval(check,30000);window.addEventListener('focus',check)
    return()=>{disposed=true;controller?.abort();clearInterval(timer);window.removeEventListener('focus',check)}
  },[classId,chosen,key,refresh])
  const lesson=data?.lessons.find(l=>l.id===data.lessonId)
  const students=data?.students??[]
  const viewed=students.filter(s=>s.state==='viewed').length,started=students.filter(s=>s.state==='in_progress').length,noPlayback=students.filter(s=>s.state==='no_record'||s.state==='opened').length,untracked=students.filter(s=>s.state==='untracked').length
  const visible=students.filter(r=>{
    if(!r.name.toLowerCase().includes(nameFilter.toLowerCase()))return false
    if(filter==='all')return true
    if(filter==='not_submitted')return !r.submittedAt
    if(filter==='no_record')return r.state==='no_record'||r.state==='opened'
    return r.state===filter
  })
  const status=(state:ViewingState)=><span className={s.status} data-state={state}>{state==='viewed'?<CheckCircle2 size={15}/>:state==='in_progress'?<PlayCircle size={15}/>:<span aria-hidden="true">○</span>}{VIEWING_LABELS[state]}</span>
  return <section className={s.dashboard} aria-label="Video progress dashboard">
    <header className={s.hero}><div className={s.eyebrow}><Video size={17}/> VIDEO PROGRESS</div><h2>See who has watched.</h2><p>Recorded playback for each student, separate from submitted work and mastery.</p><div className={s.legend}><span><CheckCircle2 size={17}/> Viewed = at least 90% of each lesson video</span><span><Clock3 size={17}/> Refreshes every 30 seconds while open</span></div></header>
    {!classId?<div className={s.empty}><h3>Choose a class to see its students.</h3><p>Use the class selector above. Then choose the video lesson you want to check.</p></div>:<>
      <div className={s.toolbar}><label>Video lesson<select aria-label="Video lesson" value={chosen||data?.lessonId||''} onChange={e=>{setChosen(e.target.value);setFilter('all')}} disabled={!data?.lessons.length}><option value="" disabled>{loading?'Loading lessons…':'Choose a video lesson'}</option>{data?.lessons.map(l=><option key={l.id} value={l.id}>{lessonTitle(l)} · {accessLabel[l.access]}</option>)}</select></label><button className={s.button} disabled={loading} onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={16}/>{loading?'Checking…':'Refresh'}</button></div>
      {error&&<div className={s.error} role="alert"><strong>Video progress could not be refreshed.</strong><p>{error}{data?' The previous results are shown below.':''}</p><button className={s.button} onClick={()=>setRefresh(v=>v+1)}>Try again</button></div>}
      {loading&&!data&&<p className={s.empty} role="status">Loading viewing records…</p>}
      {data&&!data.lessons.length&&<div className={s.empty}><h3>No video lessons for this class yet.</h3><p>Current published lessons for this class’s program and track will appear here when they include a video.</p><Link href={`/admin/dashboard?class=${classId}`}>Open Lessons →</Link></div>}
      {data&&lesson&&<>
        <div className={s.context}><div><h3>{lessonTitle(lesson)}</h3><p>{data.course.name} · {accessLabel[lesson.access]} · {lesson.videoCount} video{lesson.videoCount===1?'':'s'}</p></div><div className={s.links}><Link href={`/admin/lessons/${lesson.id}/preview?class=${classId}`}>Preview lesson</Link><Link href={`/admin/control-room?view=mastery&class=${classId}&lesson=${lesson.id}&unit=${lesson.unitId}`}>Review lesson evidence →</Link></div></div>
        {lesson.access!=='open'&&<p className={s.notice}>This lesson is {lesson.access==='scheduled'?'scheduled for later':lesson.access==='ended'?'closed':'not released'} for this class. Existing viewing records are still shown; a missing record is not overdue work.</p>}
        <div className={s.stats} aria-label="Class viewing summary">{[{label:'Viewed',value:viewed,icon:CheckCircle2,tone:'viewed'},{label:'In progress',value:started,icon:PlayCircle,tone:'in_progress'},{label:'No playback',value:noPlayback,icon:Video,tone:'no_record'},{label:'Students in class',value:students.length,icon:null,tone:'all'}].map(({label,value,icon:Icon,tone})=><div key={label} data-tone={tone}><span>{label}{Icon&&<Icon size={19}/>}</span><strong>{value}</strong><small>{tone==='viewed'?`of ${students.length} students` :tone==='all'?`${untracked} with tracking unavailable`:'students'}</small></div>)}</div>
        <div className={s.filterRow}><div className={s.filters} aria-label="Filter viewing status">{filters.filter(f=>f.id!=='untracked'||untracked>0).map(f=><button key={f.id} aria-pressed={filter===f.id} onClick={()=>setFilter(f.id)}>{f.label}</button>)}</div><small>Checked {when(data.checkedAt)}</small></div>
        <div className={s.tableScroll} tabIndex={0} role="region" aria-label="Student video viewing records"><table className={s.table}><thead><tr><th scope="col">Student</th><th scope="col">Viewing status</th><th scope="col">Recorded playback</th><th scope="col">Last recorded activity</th><th scope="col">Last submitted</th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><th scope="row">{r.name}</th><td>{status(r.state)}{r.totalVideos>1&&<small>{r.viewedVideos} of {r.totalVideos} videos viewed</small>}</td><td>{r.percent===null?<small>Duration needs verification</small>:<><div className={s.progressLabel}><strong>{r.percent}%</strong><span>{duration(r.watched)} / {duration(r.duration)}</span></div><progress max={100} value={r.percent} aria-label={`${r.name}: ${r.percent}% watched`}/></>}{r.videos.length>1&&<details><summary>Video breakdown</summary>{r.videos.map((v,i)=><p key={i}>{v.title} · {VIEWING_LABELS[v.state]}{v.percent!==null?` · ${v.percent}%`:''}</p>)}</details>}</td><td>{when(r.lastActivity)}</td><td>{r.submittedAt?<><span className={s.submitted}>Submitted</span><small>{when(r.submittedAt)}</small></>:<span className={s.notSubmitted}>Never submitted</span>}</td></tr>)}</tbody></table>{!visible.length&&<p className={s.empty}>{!students.length?'There are no students enrolled in this class.':'No students match these filters.'}</p>}</div>
        <p className={s.caption}>{visible.length} of {students.length} students shown. “Last submitted” records the latest turn-in; check lesson evidence for revisions and teacher feedback.</p>
      </>}
    </>}
    <footer className={s.foot}><strong>What this tells you</strong><p>Playback is recorded when students watch inside their assigned lesson. Watching separately on YouTube, a class projector, or before tracking was available cannot be verified here. “No viewing recorded” means no matching playback record, not proof that a student has never seen the video. Tracking stops once watch credit is earned, so a viewed video may show about 90% rather than 100%. Viewing is participation evidence; mastery comes from the student’s work.</p></footer>
  </section>
}
