import { TriangleAlert } from 'lucide-react'
import { ATTENDANCE_LABELS, attendanceCounts, attendanceGrade, attendancePercent, postedAttendanceGrade, inAttendanceTerm, withoutAttendanceCredit, type StudentAttendance } from '@/lib/meaningful-attendance'
import { termDateLabel, type GradingTerm } from '@/lib/grading-terms'
import s from './StudentGradeBreakdown.module.css'

export default function AttendanceProgress({report,terms,termId}: {report?: StudentAttendance; terms: GradingTerm[]; termId:string}) {
  if (!report) return null
  const selected = terms.filter(t=>termId==='all' || t.id===termId)
  return <section id="attendance-progress" className={s.attendance} aria-label="Meaningful attendance progress">
    <h4>Meaningful attendance</h4>
    {!selected.length && <p>Select a configured grading term to see attendance.</p>}
    {selected.map(term=>{
      const marks=report.marks.filter(m=>inAttendanceTerm(m.meeting_day,term))
      const counts=attendanceCounts(marks), progress=attendancePercent(counts)
      const posted=report.posted.find(g=>g.term_id===term.id)
      const grade=posted && postedAttendanceGrade(posted)
      const missedDates = marks.filter(withoutAttendanceCredit).map(mark => mark.meeting_day).sort().reverse()
      const dates=[...new Set([...report.meetings.filter(day=>inAttendanceTerm(day,term)),...marks.map(m=>m.meeting_day)])].sort().reverse()
      return <div key={term.id}><strong>{term.name}</strong>
        <p>Progress to date: {report.progressUnavailable?'Could not load meeting progress':progress===null?'No counted meetings yet':counts.earned+' of '+counts.eligible+' meetings credited · '+progress.toFixed(1)+'% participation'}</p>
        {progress!==null && !posted?.live && <p>Attendance grade to date: {attendanceGrade(counts)!.toFixed(1)}% · full credit at 80% participation</p>}
        {posted?.live ? <p>{grade == null ? 'Attendance is posted. Your grade starts with your first counted meeting.' : 'Posted term grade: '+grade.toFixed(1)+'% · updates as attendance is recorded'}</p>
          : <p>{grade!=null ? 'Posted term grade: '+grade.toFixed(1)+'% · '+posted!.earned+' of '+posted!.eligible+' meetings at posting' : 'Unposted · excluded from your average'}</p>}
        {missedDates.length > 0 && <aside className={s.attendanceNotice} aria-label="Attendance credit notice">
          <TriangleAlert aria-hidden="true" size={18}/>
          <div><strong>No participation credit for {missedDates.length === 1 ? '1 meeting' : missedDates.length+' meetings'}</strong>
            <p>{missedDates.map(termDateLabel).join(' · ')}</p>
            <p>If you think one of these dates is incorrect, please check with your teacher.</p>
          </div>
        </aside>}
        {dates.length>0 && <details><summary>View {dates.length} class meeting{dates.length===1?'':'s'}</summary>
          <ul>{dates.map(day=>{
            const m=marks.find(mark=>mark.meeting_day===day)
            const label=!m || m.mark==='no_credit' ? 'No participation credit' : m.made_up?'Made up · originally '+ATTENDANCE_LABELS[m.mark].toLowerCase():m.revision===0?'Participated · automatic credit':ATTENDANCE_LABELS[m.mark]
            return <li key={day}><time dateTime={day}>{termDateLabel(day)}</time><span>{label}</span></li>
          })}</ul></details>}
      </div>
    })}
    <p>Every elapsed class meeting during your enrollment counts unless you are excused. Saving a response or submitting classwork on that date earns credit, including after school. Your teacher can also credit offline work or a makeup. Four credited meetings out of five earns full credit.</p>
  </section>
}
