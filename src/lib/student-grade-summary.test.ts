import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STUDENT_GRADE_CATEGORIES, studentGradeSummary as calculateSummary, weightedStudentAverage } from './student-grade-summary'
import type { StudentProgressData } from './student-gradebook'
import { liveAttendanceGrade, postedAttendanceGrade, type DayMark } from './meaningful-attendance'
import { FOUR_DIMENSION_LAB_VERSION, LAB_DIMENSIONS } from './interactive-assignments/lab-rubric'

const studentGradeSummary = (data: StudentProgressData | null, term: string) => calculateSummary(data, term, new Date('2026-11-04T03:00:00Z'))

function fixture(): StudentProgressData {
  return {
    staff: false, courseId: 'fictional', student: { id: 'example', name: 'Example Student' }, courses: [], roster: [],
    settings: { terms: [], placements: {}, revision: 0 }, units: [], targets: [], feedback: [], warnings: [], generatedAt: '', syllabusCategories: true,
    rows: [{ key: 'quiz:example', title: 'Quiz', kind: 'quiz', unitIds: [], dueAt: '2026-10-20', archived: false, termId: 'term-1', manualTerm: false, href: '/', status: 'graded', statusLabel: 'Graded', grade: { earned: 8, possible: 10, percent: 80, letter: 'B-' }, feedback: null, releasedAt: '2026-10-21', submittedAt: '2026-10-20' }],
    transferEntries: [],
    labEntries: [{ submissionId: 'lab-example', assignmentKey: 'lab:example', title: 'Lab', href: '/', termId: 'term-1', attempt: 1, rubricVersion: FOUR_DIMENSION_LAB_VERSION, items: LAB_DIMENSIONS.map(d => ({ id: d.id, earned: 3, possible: 4, feedback: '' })), percent: 89, letter: 'B+', feedback: '', releasedAt: '2026-10-21', submittedAt: '2026-10-20' }],
  }
}

test('live attendance adds only counted meetings to date and updates the weighted average', () => {
  const term = { id:'term-1', name:'Term 1', start:'2026-10-20', end:'2026-11-10' }
  const mark = (meeting_day:string, value:DayMark['mark']):DayMark => ({meeting_day,mark:value,made_up:false,revision:1})
  const marks = [mark('2026-10-19','absent'),mark('2026-10-20','excused'),mark('2026-10-21','participated'),
    mark('2026-10-22','absent'),mark('2026-10-23','participated'),mark('2026-11-11','absent')]
  const data=fixture()
  const gradeThrough=(day:string)=>{
    const posted=liveAttendanceGrade(term,marks,day)
    data.attendance={meetings:[],marks,posted:[posted],scheduleConfigured:true}
    return { percent:postedAttendanceGrade(posted), overall:studentGradeSummary(data,term.id).average.percent }
  }
  assert.equal(gradeThrough('2026-10-20').percent,null)
  assert.equal(gradeThrough('2026-10-21').percent,100)
  assert.deepEqual(gradeThrough('2026-10-22'),{percent:62.5,overall:(87.6*50+62.5*5)/55})
  assert.equal(liveAttendanceGrade(term,marks,'2026-11-12').eligible,3)
  marks[3].made_up=true
  assert.equal(gradeThrough('2026-10-22').percent,100)
})

test('all six syllabus weights contribute to a complete average', () => {
  const scores = [90, 80, 70, 100, 50, 100]
  const result = weightedStudentAverage(STUDENT_GRADE_CATEGORIES.map((category, index) => ({ ...category, percent: scores[index] })))
  assert.deepEqual(result, { percent: 83.5, weight: 100, count: 6, complete: true })
})
test('a running average renormalizes available weights and preserves a real zero', () => {
  assert.deepEqual(weightedStudentAverage([{ weight: 40, percent: 90 }, { weight: 20, percent: 60 }, { weight: 40, percent: null }]), { percent: 80, weight: 60, count: 2, complete: false })
  assert.equal(weightedStudentAverage([{ weight: 20, percent: 0 }, { weight: 20, percent: 80 }]).percent, 40)
  assert.equal(weightedStudentAverage([{ weight: 100, percent: null }]).percent, null)
})
test('Homework completion contributes its syllabus weight alongside released lab and quiz grades', () => {
  const result = studentGradeSummary(fixture(), 'term-1')
  assert.deepEqual(result.average, { percent: 87.6, weight: 50, count: 3, complete: false })
  assert.equal(result.categories.find(c => c.id === 'attendance')?.status, 'empty')
  assert.equal(result.categories.find(c => c.id === 'homework')?.percent, 100)
  assert.equal(result.work.completed, 1)
})
test('term changes remove out-of-term scores, and no-term work remains separate', () => {
  const data = fixture()
  assert.equal(studentGradeSummary(data, 'term-2').average.percent, null)
  assert.equal(studentGradeSummary(data, 'unassigned').average.percent, null)
  data.rows[0].termId = null
  assert.equal(studentGradeSummary(data, 'term-1').average.percent, 89)
  assert.equal(studentGradeSummary(data, 'unassigned').average.percent, 2600 / 30)
  assert.equal(studentGradeSummary(data, 'all').average.percent, 87.6)
})
test('failed grade sources suppress the total instead of silently dropping their weights', () => {
  for (const source of ['Quizzes', 'Grading terms', 'Interactive lessons and simulations', 'Student choices', 'Readings', 'Worksheets']) {
    const data = fixture(); data.warnings = [{ source, message: 'Fixture failure' }]
    assert.equal(studentGradeSummary(data, 'all').average.percent, null, source)
  }
  const data = fixture(); data.warnings = [{ source: 'Learning history', message: 'Fixture failure' }]
  assert.equal(studentGradeSummary(data, 'all').average.percent, 87.6)
  delete data.labEntries
  assert.equal(studentGradeSummary(data, 'all').average.percent, null)
})
test('empty records and no selected student never fabricate a grade', () => {
  assert.equal(studentGradeSummary(null, 'all').average.percent, null)
  const data = fixture(); data.student = null
  assert.equal(studentGradeSummary(data, 'all').average.percent, null)
  const empty = fixture(); empty.rows = []; empty.labEntries = []
  assert.equal(studentGradeSummary(empty, 'all').average.percent, null)
  assert.equal(studentGradeSummary(empty, 'all').categories.find(c => c.id === 'homework')?.status, 'empty')
})
test('Homework counts past-due work, including submissions awaiting feedback', () => {
  const data = fixture(), template = data.rows[0]
  data.labEntries = []
  data.rows = (['pending', 'completed', 'in_progress', 'upcoming', 'missing', 'revise'] as const).map((status, index) => ({
    ...template, key: 'work:' + index, kind: index % 2 ? 'worksheet' : 'quiz', status,
    dueAt: '2026-10-20', grade: null, releasedAt: null,
  }))
  const result = studentGradeSummary(data, 'term-1')
  assert.equal(result.homework.assigned, 6)
  assert.equal(result.homework.completed, 2)
  assert.deepEqual(result.average, { percent: 2 / 6 * 100, weight: 10, count: 1, complete: false })
  data.rows[2].status = 'pending'
  assert.equal(studentGradeSummary(data, 'term-1').average.percent, 50)
  data.rows[0].status = 'revise'
  assert.equal(studentGradeSummary(data, 'term-1').average.percent, 2 / 6 * 100)
})
test('future, excused, archived and undated work do not lower Homework', () => {
  const data = fixture(), template = data.rows[0]
  data.rows.push({ ...template, key: 'future', status: 'upcoming', grade: null, releasedAt: null, dueAt: '2026-12-01' })
  data.rows.push({ ...template, key: 'excused', status: 'excused' }, { ...template, key: 'archived', archived: true }, { ...template, key: 'undated', dueAt: null })
  const result = studentGradeSummary(data, 'term-1')
  assert.equal(result.work.assigned, 2, 'the full assigned-work tracker still includes future work')
  assert.equal(result.homework.assigned, 1)
  assert.equal(result.homework.completed, 1)
  assert.equal(result.categories.find(c => c.id === 'homework')?.percent, 100)
  assert.equal(result.average.percent, 87.6)
})
test('no elapsed deadlines gives no Homework grade; an elapsed unfinished task gives a real zero', () => {
  const data = fixture()
  data.labEntries = []
  data.rows = [{ ...data.rows[0], status: 'upcoming', grade: null, releasedAt: null, dueAt: '2026-11-04T04:00:00Z' }]
  assert.equal(studentGradeSummary(data, 'term-1').categories.find(c => c.id === 'homework')?.status, 'empty')
  assert.equal(calculateSummary(data, 'term-1', new Date('2026-11-04T04:00:00Z')).average.percent, null)
  const after = new Date('2026-11-04T04:00:00.001Z')
  assert.deepEqual(calculateSummary(data, 'term-1', after).average, { percent: 0, weight: 10, count: 1, complete: false })
  data.rows[0].status = 'pending'
  assert.equal(calculateSummary(data, 'term-1', after).average.percent, 100)
})
test('the Homework numerator and denominator both exclude early-completed future activities', () => {
  const data = fixture(), template = data.rows[0]
  data.labEntries = []
  data.rows = Array.from({length:19}, (_, i) => ({...template, key:'work:'+i, kind:'worksheet', grade:null, releasedAt:null,
    dueAt:i<12?'2026-11-02':'2026-11-05', status:i<8||i>=16?'completed':'upcoming'}))
  const result = studentGradeSummary(data, 'term-1')
  assert.equal(result.work.completed,11)
  assert.equal(result.work.assigned,19)
  assert.equal(result.homework.completed,8)
  assert.equal(result.homework.assigned,12)
  assert.equal(result.average.percent,8/12*100)
})
test('classes without the CPA/Honors categories keep their quiz-only score', () => {
  const data = fixture(); data.syllabusCategories = false
  const result = studentGradeSummary(data, 'all')
  assert.equal(result.categories.length, 1)
  assert.equal(result.categories[0].label, 'Quiz score')
  assert.equal(result.average.percent, 80)
})

test('posted unit floors feed the same weighted average as the student banner', () => {
  const data=fixture(); data.masteryXp={items:[],posted:[{unitId:'unit-1',termId:'term-1',assigned:5,completed:4}]}
  const result=studentGradeSummary(data,'term-1'); assert.equal(result.categories.find(c=>c.id==='xp')?.percent,100);assert.equal(result.average.percent,(87.6*50+100*5)/55)
})

test('attendance progress never contributes until posted, including corrections and posted zeros', () => {
  const data = fixture()
  data.attendance = { meetings: [], scheduleConfigured:true, marks: [
    {meeting_day:'2026-10-20',mark:'participated',revision:1,made_up:false},
  ], posted:[] }
  const grade = (term:string)=>studentGradeSummary(data,term)
  assert.equal(grade('term-1').average.percent,87.6)
  data.attendance.posted.push({term_id:'term-1',earned:0,eligible:1})
  assert.equal(grade('term-1').average.percent,87.6*50/55)
  data.attendance.posted.push({term_id:'term-2',earned:2,eligible:2},{term_id:'empty',earned:0,eligible:0})
  assert.equal(grade('term-2').average.percent,100)
  assert.equal(grade('empty').average.percent,null)
  assert.equal(grade('all').categories.find(c=>c.id==='attendance')?.percent,50)
  data.attendance.marks[0]={meeting_day:'2026-10-20',mark:'absent',revision:2,made_up:true}
  assert.equal(grade('term-1').categories.find(c=>c.id==='attendance')?.percent,0)
  data.attendance.posted[0]={term_id:'term-1',earned:3,eligible:5,full_credit_at:80}
  assert.equal(grade('term-1').categories.find(c=>c.id==='attendance')?.percent,75)
  data.attendance.posted[0].earned=4
  assert.equal(grade('term-1').categories.find(c=>c.id==='attendance')?.percent,100)
  data.attendance.posted[0].earned=5
  assert.equal(grade('term-1').categories.find(c=>c.id==='attendance')?.percent,100)
  data.warnings.push({source:'Meaningful attendance',message:'Could not load'})
  assert.equal(grade('term-1').average.percent,null)
  assert.equal(grade('term-1').workUnavailable,false)
})
