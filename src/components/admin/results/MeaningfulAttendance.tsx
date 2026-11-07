'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { termDateLabel } from '@/lib/grading-terms'
import { ATTENDANCE_LABELS, attendanceCounts, attendanceGrade, postedAttendanceGrade, termPreview, type AttendanceEdit, type AttendancePreview, type AttendanceStatus } from '@/lib/meaningful-attendance'
import s from './ResultsWorkspace.module.css'

const percent = (n: number | null) => n===null?'—':n.toFixed(1)+'%'

export default function MeaningfulAttendance({course,initialTerm,backHref}:{course:string;initialTerm:string|null;backHref:string}) {
  const [term,setTerm]=useState(initialTerm && !['all','unassigned'].includes(initialTerm)?initialTerm:'')
  const [day,setDay]=useState('')
  const [daily,setDaily]=useState(false)
  const [unmarkedOnly,setUnmarkedOnly]=useState(true)
  const [edits,setEdits]=useState<Record<string,AttendanceEdit|null>>({})
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState('')
  const params=new URLSearchParams({class:course})
  if(term) params.set('term',term)
  if(day) params.set('day',day)
  if(daily) params.set('daily','1')
  const resource=useLearningResource<AttendancePreview>('/api/teacher/attendance?'+params)
  const report=resource.data
  const hasEdits=Object.keys(edits).length>0
  const controlsLocked=busy || resource.loading || hasEdits
  async function write(body:Record<string,unknown>,message:string) {
    if(!report?.term || busy || report.readOnly) return
    setBusy(true);setNotice('')
    try {
      const response=await fetch('/api/teacher/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,course,term:report.term.id})})
      const result=await response.json()
      if(!response.ok) throw new Error(result.error || 'Attendance could not be saved.')
      setEdits({});setNotice(message);resource.refresh()
    } catch(error) {setNotice(error instanceof Error ? error.message : 'Attendance could not be saved.')}
    finally {setBusy(false)}
  }
  const rows=report?.roster ?? [], current=report?.term
  const currentTerm = !!(current && report && current.start <= report.today && report.today <= current.end)
  const dayRows=rows.filter(row=>report?.day && (!row.entered || row.entered<=report.day || row.marks.some(m=>m.meeting_day===report.day)))
  function chosen(id:string): AttendanceEdit|null {
    if(id in edits) return edits[id]
    const original=rows.find(r=>r.id===id)?.marks.find(m=>m.meeting_day===report?.day)
    if(original && original.mark!=='no_credit') return {id,mark:original.mark,made_up:original.made_up,revision:original.revision}
    return null
  }
  const changes=dayRows.flatMap(row=>{
    const selection=chosen(row.id), original=row.marks.find(m=>m.meeting_day===report?.day)
    return selection && (selection.mark!==original?.mark || selection.made_up!==original?.made_up)?[selection]:[]
  })
  const originalForDay = (row: typeof rows[number]) => row.marks.find(mark => mark.meeting_day === report?.day)
  const unmarkedRows = dayRows.filter(row => {
    const mark = originalForDay(row)
    return !mark || mark.mark === 'no_credit'
  })
  const offlineCredits = unmarkedRows.filter(row => !(row.id in edits)).map(row => ({
    id: row.id, mark: 'participated' as const, made_up: false, revision: 0,
  }))
  const visibleRows = unmarkedOnly ? unmarkedRows : dayRows
  const snapshot=termPreview(rows)
  const changed=rows.some(row=>{
    const c=attendanceCounts(row.marks)
    return c.eligible!==(row.posted?.eligible ?? 0) || c.earned!==(row.posted?.earned ?? 0) || (!!row.posted && row.posted.eligible > 0 && row.posted.full_credit_at !== 80)
  })
  const released=rows.some(row=>row.posted!==null)
  const meetings = report?.meetings ?? []
  const unmarkedByMeeting = new Map(meetings.map(date => [date, 0]))
  for (const row of rows) {
    for (const mark of row.marks) {
      if (mark.mark === 'no_credit') {
        const date = mark.meeting_day
        unmarkedByMeeting.set(date, (unmarkedByMeeting.get(date) ?? 0) + 1)
      }
    }
  }
  const automaticCount = rows.reduce((count, row) => count + row.marks.filter(mark => mark.mark === 'participated' && mark.revision === 0).length, 0)
  const meetingsToReview = [...unmarkedByMeeting.values()].filter(count => count > 0).length
  const latestPendingMeeting = meetings.find(date => (unmarkedByMeeting.get(date) ?? 0) > 0)
  const disabled=busy || resource.loading || !!resource.error || !!report?.readOnly
  function switchScope(run:()=>void) {setNotice('');setEdits({});run()}
  return <section className={s.workspace} aria-label="Meaningful attendance">
    <Link href={backHref} className={s.textButton}>← Back to assignment results</Link>
    <header className={s.heading}><div><h2>Meaningful attendance</h2><p>One grade per term · 5% of the term average</p></div></header>
    {resource.error && <p role="alert">Attendance could not load. <button className={s.button} onClick={resource.refresh}>Retry</button></p>}
    {!report && resource.loading && <p role="status">Loading attendance…</p>}
    {report && <>
      <div className={s.toolbar}>
        <button className={s.button} disabled={busy || resource.loading} onClick={()=>{setEdits({});setNotice('');resource.refresh()}}>{hasEdits?'Discard edits and refresh':'Refresh attendance'}</button>
        <label>Grading term<select value={current?.id ?? ''} disabled={controlsLocked} onChange={e=>switchScope(()=>{setTerm(e.target.value);setDay('')})}>
          {!current && <option value="">Choose a term</option>}{report.terms.map(t=><option key={t.id} value={t.id}>{t.name} · {termDateLabel(t.start)} – {termDateLabel(t.end)}</option>)}
        </select></label>
        <Link className={s.textButton} href={'/admin/students?'+new URLSearchParams({class:course,view:'settings',section:'grading-terms'})}>Manage grading terms</Link>
      </div>
      {current ? <>
        <div className={s.toolbar}><button className={daily?s.button:s.primary} aria-pressed={!daily} disabled={controlsLocked} onClick={()=>switchScope(()=>setDaily(false))}>Term summary</button>
          <button className={daily?s.primary:s.button} aria-pressed={daily} disabled={controlsLocked} onClick={()=>switchScope(()=>setDaily(true))}>Daily roster</button></div>
        {!report.scheduleConfigured && <p className={s.note}>Set the rotation and class meeting pattern in Pacing to review new meeting dates.</p>}
        {report.readOnly && <p className={s.note}>Teacher preview · read only</p>}
        {daily ? <>
          <div className={s.toolbar}><label>Class meeting<select value={report.day ?? ''} disabled={controlsLocked} onChange={e=>switchScope(()=>setDay(e.target.value))}>
            {!report.day && <option value="">No elapsed meetings</option>}{report.meetings.map(d=><option key={d} value={d}>{termDateLabel(d)}</option>)}
          </select></label></div>
          <p className={s.note}>Saved responses and submissions already earn credit. For offline work, mark any exceptions, then credit the remaining participants.</p>
          {report.day && <div className={s.toolbar}>
            <button className={unmarkedOnly?s.primary:s.button} aria-pressed={unmarkedOnly} onClick={()=>setUnmarkedOnly(true)}>Unmarked ({unmarkedRows.length})</button>
            <button className={!unmarkedOnly?s.primary:s.button} aria-pressed={!unmarkedOnly} onClick={()=>setUnmarkedOnly(false)}>Whole roster ({dayRows.length})</button>
          </div>}
          {report.day && unmarkedOnly && !unmarkedRows.length && <p className={s.note}>Everyone has a mark for this meeting. Open the whole roster to make a correction.</p>}
          <div className={s.toolbar}><button className={s.primary} disabled={disabled || !changes.length} onClick={()=>write({action:'confirm',day:report.day,marks:changes},'Meeting marks confirmed. Term progress is updated.')}>Confirm {changes.length} mark{changes.length===1?'':'s'}</button>
            {offlineCredits.length > 0 && <button className={s.button} disabled={disabled} onClick={()=>write(
              {action:'confirm',day:report.day,marks:[...changes,...offlineCredits]},
              'Offline participation credited and your exceptions saved.'
            )}>Credit {offlineCredits.length} remaining as participated</button>}
            {hasEdits && <button className={s.button} disabled={busy} onClick={()=>{setEdits({});setNotice('Edits discarded.')}}>Discard edits</button>}</div>
          {report.day && visibleRows.length > 0 && <div className={s.scroll}><table className={s.overview}><thead><tr><th>Student</th><th>Same-day classwork</th><th>Attendance mark</th></tr></thead>
            <tbody>{visibleRows.map(row=>{
              const original=originalForDay(row), value=chosen(row.id)
              return <tr key={row.id}><th>{row.name}</th><td>{original?.source? <>{original.source}<small>{original.revision===0?'Credited automatically':'Teacher mark takes priority'}{original.at_time && ' · '+new Date(original.at_time).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})}</small></>:'No online evidence'}</td>
                <td><select aria-label={'Attendance for '+row.name} disabled={disabled} value={value?.mark ?? ''} onChange={e=>{
                  const mark=e.target.value as AttendanceStatus|''
                  setEdits(prev=>({...prev,[row.id]:mark?{id:row.id,mark,made_up:mark===original?.mark && original.made_up,revision:original?.revision ?? 0}:null}))
                }}>
                  {(!original || original.mark==='no_credit') && <option value="">No credit recorded</option>}{Object.entries(ATTENDANCE_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}
                </select>
                {original && (original.mark==='absent'||original.mark==='present') && value?.mark===original.mark && <label><input type="checkbox" disabled={disabled} checked={value.made_up} onChange={e=>setEdits(prev=>({...prev,[row.id]:{...value,made_up:e.target.checked}}))}/> Made up</label>}</td></tr>
            })}</tbody></table></div>}
        </> : <>
          <div className={s.entryFocus}>
            <div>
              <h3>{meetings.length} class {meetings.length === 1 ? 'meeting' : 'meetings'} to date</h3>
              {meetings.length > 0 && <p>{meetingsToReview
                ? `${meetingsToReview} ${meetingsToReview === 1 ? 'meeting has' : 'meetings have'} students without recorded participation.`
                : 'All student marks are up to date.'} {automaticCount} student {automaticCount===1?'mark':'marks'} credited automatically.</p>}
            </div>
            {latestPendingMeeting && <button className={s.primary} disabled={controlsLocked}
              onClick={()=>switchScope(()=>{setDay(latestPendingMeeting);setDaily(true)})}>
              Open {termDateLabel(latestPendingMeeting)} roster
            </button>}
            {meetings.length > 0 && <label>
              Review a meeting{' '}
              <select className={s.button} value="" disabled={controlsLocked}
                onChange={event => switchScope(() => { setDay(event.target.value); setDaily(true) })}>
                <option value="" disabled>Choose a class date</option>
                {meetings.map(date => <option key={date} value={date}>
                  {termDateLabel(date)} · {unmarkedByMeeting.get(date) ? `${unmarkedByMeeting.get(date)} unmarked` : 'All marked'}
                </option>)}
              </select>
            </label>}
          </div>
          <p className={s.note}>Every elapsed meeting during enrollment counts unless excused. An unmarked day earns no credit. Saved classwork, offline participation, and makeups can earn credit. Full credit starts at 80% of counted meetings.</p>
          <div className={s.scroll}><table className={s.overview}><thead><tr><th>Student</th><th>Credited / counted</th><th>Days without credit</th><th>Attendance grade to date</th><th>Posted term grade</th></tr></thead>
            <tbody>{rows.map(row=>{
              const c=attendanceCounts(row.marks)
              const credit = c.eligible ? `${c.earned} / ${c.eligible}` : row.marks.length ? 'All excused' : 'No meetings yet'
              return <tr key={row.id}>
                <th><Link href={'/home/gradebook?'+new URLSearchParams({class:course,student:row.id,term:current.id})}>{row.name}</Link></th>
                <td>{credit}</td><td>{c.eligible - c.earned}</td><td>{percent(attendanceGrade(c))}</td>
                <td>{row.posted?.eligible ? percent(postedAttendanceGrade(row.posted)) : report.livePublished ? 'No counted meetings' : 'Unposted'}</td>
              </tr>
            })}</tbody></table></div>
          {report.livePublished ? <p className={s.note}>Posted · updates automatically as attendance is recorded. Grades include counted meetings through {termDateLabel(report.today < current.end ? report.today : current.end)}.</p>
            : currentTerm ? <>
              <p className={s.note}>Post once to include attendance in the term average. Each student’s grade updates as meetings are credited or marked.</p>
              <button className={s.primary} disabled={disabled || !report.scheduleConfigured} onClick={()=>write({action:'publish-live'},'Attendance is posted and will update automatically.')}>Post attendance through today</button>
            </> : current.end < report.today ? <>
              <p className={s.note}>Posting applies the shown grades to the term average.</p>
              <button className={s.primary} disabled={disabled || !changed} onClick={()=>write({action:'post',preview:snapshot},'Attendance grades posted for '+current.name+'.')}>{released?'Update posted grades':'Post term grades'}</button>
            </> : <p className={s.note}>Posting opens when this term starts on {termDateLabel(current.start)}.</p>}
        </>}
      </>:<p className={s.note}>Choose or configure a grading term to review attendance.</p>}
    </>}
    {notice && <p role="status" className={s.note}>{notice}</p>}
  </section>
}
