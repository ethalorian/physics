'use client'

import { sourceTitle } from '@/lib/assignment-source-presentation'
import { useState } from 'react'
import { entryChanged, entrySnapshot, entryValue, releasedGrade, type EntryFormat, type EntryMark } from '@/lib/assessment-results/gradebook'
import type { ResultActivity, ResultStudent } from '@/lib/assessment-results/types'
import { CopyGrade, GradeBadge, GradeScale } from './GradeDisplay'
import s from './ResultsWorkspace.module.css'

export type EntryMarks = Record<string, EntryMark>
export const markKey = (activity: string, student: string) => activity + '|' + student
export default function AspenEntry({ activities, students, assignment, onAssignment, marks, onMark, onBack, onReview, disabled }: {
  activities: ResultActivity[]; students: ResultStudent[]; assignment: string; onAssignment: (id: string) => void;
  marks: EntryMarks; onMark: (key: string, value?: EntryMark) => boolean; onBack: () => void; onReview: (a: ResultActivity, student: string) => void; disabled: boolean;
}) {
  const [active, setActive] = useState(''), [format, setFormat] = useState<EntryFormat>('percent'), [undo, setUndo] = useState<{ key: string; previous?: EntryMark; student: string } | null>(null)
  const activity = activities.find(a => a.key === assignment) ?? activities[0]
  const roster = students.filter(st => !!activity?.cells[st.id])
  const index = Math.max(0, roster.findIndex(st => st.id === active)), student = roster[index]
  const cell = activity?.cells[student?.id], grade = releasedGrade(cell)
  const key = activity && student ? markKey(activity.key, student.id) : ''
  const entered = roster.filter(st => { const mark = marks[markKey(activity.key, st.id)]; return mark && !entryChanged(mark, releasedGrade(activity.cells[st.id]), format) }).length
  function next() { if (roster[index + 1]) setActive(roster[index + 1].id) }
  function mark() { if (!grade || !key || disabled) return; setUndo({ key, previous: marks[key], student: student.id }); if(onMark(key, entrySnapshot(grade, format))) next() }
  return <section className={s.entry} aria-label="Manual Aspen entry">
    <div className={s.heading}><div><h2>Enter one assignment in Aspen</h2><p>Copy a value, enter it in Aspen, then mark that student entered.</p></div><button className={s.button} onClick={onBack}>← Gradebook</button></div>
    <div className={s.toolbar}><label>Assignment<select value={activity?.key ?? ''} onChange={e => { onAssignment(e.target.value); setActive(''); setUndo(null) }}>{activities.map(a => <option key={a.key} value={a.key}>{sourceTitle(a)}</option>)}</select></label><label>Entering as<select value={format} onChange={e => setFormat(e.target.value as EntryFormat)}><option value="percent">Percentage</option><option value="points">Points earned</option><option value="letter">Letter grade</option></select></label><span className={s.muted}>{entered} / {roster.length} marked entered</span><GradeScale/></div>
    {!activity || !student ? <p className={s.empty}>No assigned students match this selection.</p> : <>
      <div className={s.entryFocus}>
        <div><small>STUDENT {index + 1} OF {roster.length}</small><h3>{student.name}</h3><p>{cell?.needsReview ? 'Review before entering a grade' : cell?.label}</p></div>
        <div className={s.entryScores}>{grade ? <><span><small>Points</small><strong>{grade.earned} / {grade.possible}</strong></span><span><small>Copy percentage</small><CopyGrade value={grade.percent.toFixed(1)} label={`Copy ${student.name} percentage`}/></span><span><small>Copy letter</small><CopyGrade value={grade.letter} label={`Copy ${student.name} letter grade`}/></span></> : <strong>— · No released grade</strong>}</div>
        <div className={s.entryActions}><button className={s.button} disabled={index === 0} onClick={() => setActive(roster[index - 1].id)}>Previous</button><button className={s.primary} disabled={!grade || disabled} onClick={mark}>Mark entered & next</button><button className={s.button} disabled={index === roster.length - 1} onClick={next}>Next student</button>{cell?.needsReview && <button className={s.button} onClick={() => onReview(activity, student.id)}>Review submission</button>}</div>
        {grade && marks[key] && entryChanged(marks[key], grade, format) && <p className={s.pending}>Score or entry format changed since you marked this student entered. Current {format}: {entryValue(grade, format)}.</p>}
      </div>
      <div className={s.entryNote}><p>Copying keeps your place. Pending, missing and excused work stays in the roster. Entry checkmarks are saved for your account on this browser; they do not sync to Aspen.</p>{undo && <button className={s.button} disabled={disabled} onClick={() => { if(onMark(undo.key, undo.previous)){setActive(undo.student); setUndo(null)} }}>Undo last mark</button>}</div>
      <div className={s.scroll} tabIndex={0} role="region" aria-label="Aspen roster"><table className={s.entryTable}><thead><tr><th>Student</th><th>Points</th><th>Percentage · copy</th><th>Letter · copy</th><th>Entry checklist</th></tr></thead><tbody>{roster.map(st => {
        const c = activity.cells[st.id], g = releasedGrade(c), k = markKey(activity.key, st.id), m = marks[k], changed = entryChanged(m, g, format)
        return <tr key={st.id} data-selected={student.id === st.id} data-tone={g ? g.percent >= 80 ? 'high' : g.percent >= 60 ? 'mid' : 'low' : 'none'}><th><button className={s.student} onClick={() => setActive(st.id)}>{st.name}</button></th><td>{g ? `${g.earned} / ${g.possible}` : '—'}</td><td>{g ? <><GradeBadge percent={g.percent}/><CopyGrade value={g.percent.toFixed(1)} label={`Copy percentage for ${st.name}`}/></> : <span className={s.muted}>{c.label}</span>}</td><td>{g ? <CopyGrade value={g.letter} label={`Copy letter grade for ${st.name}`}/> : '—'}</td><td>{m ? <><span className={changed ? s.pending : s.released}>{changed ? 'Changed · check entry' : '✓ Entered'}</span><button className={s.textButton} disabled={disabled} onClick={() => onMark(k)}>Clear</button></> : <span className={s.muted}>{g ? 'Ready to enter' : 'Not ready'}</span>}</td></tr>
      })}</tbody></table></div>
    </>}
  </section>
}
