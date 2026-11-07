import 'server-only'
import { supabaseAdmin } from './supabase'
import { readingRows } from './textbook-assignments-server'
import { read } from './assessment-results/queries'
import { patternFromRow } from './pacing-server'
import { sectionMeetingsOnDate } from './rotation'
import { schoolDayKey } from './school-day'
import { dayRange } from './student-engagement'
import { currentGradingTerm, type GradingTerm } from './grading-terms'
import { loadGradingSettings } from './grading-terms-server'
import { inAttendanceTerm, liveAttendanceGrade, type AttendanceGrade, type AttendancePreview, type DayMark, type StudentAttendance } from './meaningful-attendance'

export async function classMeetings(course: string, terms: GradingTerm[]) {
  const [calendar, section] = await Promise.all([
    supabaseAdmin.from('rotation_calendar').select('anchor_date,anchor_p1_block,no_school_dates,cycle_offset,alt_week_anchor').eq('id','default').maybeSingle(),
    supabaseAdmin.from('section_schedules').select('start_date,block,blocks,week_pattern,on_week_anchor,on_week_dates,no_school_dates').eq('course_id',course).maybeSingle(),
  ])
  if (calendar.error || section.error) throw calendar.error || section.error
  const cal = calendar.data, schedule = section.data, pattern = patternFromRow(schedule)
  const configured = Boolean(cal?.anchor_date && /^[A-F]$/.test(cal.anchor_p1_block) && pattern.blocks.length &&
    (pattern.weekPattern !== 'alternate' || pattern.onWeekAnchor || cal.alt_week_anchor || pattern.onWeekDates?.length))
  if (!configured || !cal) return { dates: [] as string[], configured: false }
  const rotation = { ...cal, no_school_dates: [...(cal.no_school_dates ?? []), ...(schedule?.no_school_dates ?? [])] }
  const today = schoolDayKey()
  const dates = terms.flatMap(term => dayRange([cal.anchor_date, schedule?.start_date, term.start].filter(Boolean).sort().at(-1)!, term.end < today ? term.end : today))
    .filter(day => sectionMeetingsOnDate(rotation, pattern, new Date(day+'T12:00:00Z')).length > 0)
  return { dates, configured }
}
const gradeFields = 'user_id,term_id,earned,eligible,full_credit_at'
type MarkRecord = DayMark & { user_id: string }
type GradeRecord = AttendanceGrade & { user_id: string }
type Member = { student_id: string; enrolled_at: string | null; students: { name: string; is_active: boolean } | null }
function enrolledDay(at: string | null) { return at ? schoolDayKey(new Date(at)) : null }

async function effectiveMarks(course: string, terms: GradingTerm[], days: string[], user: string | null = null) {
  if (!terms.length) return []
  const from = terms.map(term => term.start).sort()[0]
  const to = [terms.map(term => term.end).sort().at(-1)!, schoolDayKey()].sort()[0]
  if (from > to) return []
  return readingRows<MarkRecord>((start, end) => supabaseAdmin.rpc('attendance_elapsed_marks', {
    p_course: course, p_days: days, p_from: from, p_to: to, p_user: user,
  }).order('user_id').order('meeting_day').range(start, end))
}

export async function loadStudentAttendance(course: string, user: string, terms: GradingTerm[]): Promise<StudentAttendance> {
  const postedRead = read<AttendanceGrade>('attendance_term_grades','term_id,earned,eligible,full_credit_at',q=>q.eq('course_id',course).eq('user_id',user),['term_id'])
  const liveRead = read<{term_id:string}>('attendance_live_terms','term_id',q=>q.eq('course_id',course),['term_id'])
  const detailsRead = Promise.all([
    classMeetings(course,terms),
    supabaseAdmin.from('course_students').select('enrolled_at').eq('course_id',course).eq('student_id',user).eq('enrollment_state','ACTIVE').single(),
  ]).then(async ([schedule,member])=>{
    if (member.error) throw member.error
    const marks = await effectiveMarks(course, terms, schedule.dates, user)
    return {marks,schedule,entered:enrolledDay(member.data.enrolled_at)}
  }).catch(()=>null)
  const [snapshots,live,details] = await Promise.all([postedRead,liveRead,detailsRead])
  if (!details) {
    if (live.length) throw new Error('Could not calculate posted attendance.')
    return {posted:snapshots,marks:[],meetings:[],scheduleConfigured:false,progressUnavailable:true}
  }
  const {marks,schedule,entered} = details
  const published = new Set(live.map(row => row.term_id))
  const posted = [
    ...snapshots.filter(grade => !published.has(grade.term_id)),
    ...terms.filter(term => published.has(term.id)).map(term => liveAttendanceGrade(term, marks, schoolDayKey())),
  ]
  return { marks, posted, meetings:schedule.dates.filter(day=>!entered || day>=entered), scheduleConfigured:schedule.configured }
}

export async function loadAttendancePreview(course: string, selected: string | null, requestedDay: string | null, readOnly: boolean): Promise<AttendancePreview> {
  const { terms }=await loadGradingSettings(course)
  const term=terms.find(t=>t.id === (selected || currentGradingTerm(terms))) ?? null
  const base = { terms, term, readOnly, today:schoolDayKey(), meetings:[], roster:[], day:null, scheduleConfigured:false }
  if (!term) return base
  const [members,grades,schedule,publication] = await Promise.all([
    read<Member>('course_students','student_id,enrolled_at,students(name,is_active)',q=>q.eq('course_id',course).eq('enrollment_state','ACTIVE'),['student_id']),
    read<GradeRecord>('attendance_term_grades',gradeFields,q=>q.eq('course_id',course).eq('term_id',term.id),['user_id']),
    classMeetings(course,[term]),
    read<{term_id:string}>('attendance_live_terms','term_id',q=>q.eq('course_id',course).eq('term_id',term.id),['term_id']),
  ])
  const marks = await effectiveMarks(course, [term], schedule.dates)
  const meetings=[...new Set([...schedule.dates,...marks.map(m=>m.meeting_day)])].sort().reverse()
  const day=requestedDay && meetings.includes(requestedDay) ? requestedDay : meetings[0] ?? null
  const livePublished = publication.length > 0
  const roster=members.filter(m=>m.students && m.students.is_active!==false).map(m=>{
    const studentMarks = marks.filter(mark=>mark.user_id===m.student_id)
    return {
      id:m.student_id,name:m.students!.name,entered:enrolledDay(m.enrolled_at),marks:studentMarks,
      posted:livePublished ? liveAttendanceGrade(term, studentMarks, base.today) : grades.find(g=>g.user_id===m.student_id) ?? null,
    }
  }).sort((a,b)=>a.name.localeCompare(b.name))
  return {...base,meetings,day,roster,livePublished,scheduleConfigured:schedule.configured}
}

export async function canMarkMeeting(course: string, term: GradingTerm, day: string) {
  if(!inAttendanceTerm(day,term) || day>schoolDayKey()) return false
  const schedule=await classMeetings(course,[{...term,start:day,end:day}])
  if(schedule.dates.includes(day)) return true
  // A teacher can still correct recorded attendance if the rotation later changes.
  const {data,error}=await supabaseAdmin.from('attendance_marks').select('meeting_day').eq('course_id',course).eq('meeting_day',day).limit(1)
  if(error) throw error
  return !!data?.length
}
