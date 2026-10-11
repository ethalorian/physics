'use client'
import {useState} from 'react'
import type {AssessmentComparison} from '@/lib/quizzes/comparison'
import {average} from '@/lib/quizzes/comparison'
import {matchedGrowth,questionSignals,resultPercent} from '@/lib/quizzes/insights'
import QuizContent from './QuizContent'
import s from './Quiz.module.css'
import w from './QuizWorkspace.module.css'

export default function QuizInsights({assignments,courseId,targets}:{assignments:AssessmentComparison[];courseId:string;targets:{id:string;statement:string}[]}) {
  const [selected,setSelected]=useState(''),[baseline,setBaseline]=useState(''),[threshold,setThreshold]=useState(70)
  const quiz=assignments.find(a=>a.id===selected)??assignments[0]
  const before=assignments.find(a=>a.id===baseline&&a.id!==quiz?.id)
  const label=(id:string)=>targets.find(t=>t.id===id)?.statement??'Learning target'
  if(!quiz)return <p className={s.notice}>No assigned quizzes match these filters. Publish a quiz or include archived quizzes to inspect results.</p>
  const students=quiz.students.filter(st=>!courseId||st.course_id===courseId),scores=students.flatMap(st=>st.percent===null?[]:[st.percent])
  const signals=questionSignals(quiz,courseId),growth=before?matchedGrowth(before,quiz,courseId):[]
  const graded=students.filter(st=>st.state==='graded').length,submitted=students.filter(st=>['submitted','graded','returned'].includes(st.state)).length
  const name=(a:AssessmentComparison)=>`${a.title} · ${a.classes.map(c=>c.section).join(', ')}${a.created_at?' · '+new Date(a.created_at).toLocaleDateString():''}`
  return <div className={s.stack}>
    <div className={s.two}><label className={s.field}>Quiz to evaluate<select value={quiz.id} onChange={e=>setSelected(e.target.value)}>{assignments.map(a=><option key={a.id} value={a.id}>{name(a)}</option>)}</select></label><label className={s.field}>Question review threshold<select value={threshold} onChange={e=>setThreshold(Number(e.target.value))}>{[50,60,70,80,90].map(n=><option key={n} value={n}>{n}% of points</option>)}</select></label></div>
    <div className={w.metrics}>
      <Metric label="Submitted at least once" value={`${submitted} / ${students.length}`} detail="Includes revisions and graded work"/>
      <Metric label="Class average" value={resultPercent(average(scores))} detail={`${scores.length} fully scored of ${students.length} assigned`}/>
      <Metric label="At or above threshold" value={scores.length?`${Math.round(100*scores.filter(n=>n>=threshold).length/scores.length)}%`:'—'} detail={`${scores.filter(n=>n>=threshold).length} of ${scores.length} scored · ${threshold}% threshold`}/>
      <Metric label="Grading coverage" value={students.length?`${Math.round(100*graded/students.length)}%`:'—'} detail={`${graded} grades returned · ${students.length-graded} outstanding`}/>
    </div>
    <section className={s.card}><div className={s.row}><div><p className={s.eyebrow}>QUIZ QUALITY & NEXT LESSON</p><h2>What needs another look?</h2></div><span className={s.badge}>{signals.filter(q=>q.mean!==null&&q.mean<threshold).length} questions below {threshold}%</span></div>
      <p className={s.muted}>Low scores can reflect a learning gap, wording, or scoring criteria. Read the responses before choosing reteaching or revising the question. Signals use returned grades only.</p>
      <div className={s.tableScroll}><table className={`${s.resultsTable} ${w.signalTable}`}><thead><tr><th scope="col">Question / learning target</th><th scope="col">Average points</th><th scope="col">Responses</th><th scope="col">Next check</th></tr></thead><tbody>{signals.map(q=><tr key={q.index}>
        <th scope="row"><span className={s.eyebrow}>Q{q.index+1} · {q.points} POINTS</span><QuizContent content={q.prompt}/><small>{label(q.target_id)}</small></th>
        <td><strong>{resultPercent(q.mean)}</strong><div className={w.bar} aria-hidden="true"><span style={{width:`${q.mean??0}%`}}/></div></td><td>{q.count}<small>{q.count<10?'Small sample':'graded'}</small></td>
        <td>{q.mean===null?'Return grades to see evidence':q.itemRest!==null&&q.itemRest<0?'Check wording and answer key':q.mean<threshold?'Inspect reasoning; consider reteaching':q.mean>=95?'Check challenge or transfer':'Review errors; keep monitoring'}<small>Item–rest correlation: {q.itemRest===null?'—':q.itemRest.toFixed(2)}</small></td>
      </tr>)}</tbody></table></div>
      <details className={w.method}><summary>How to read these signals</summary><p>Item–rest correlation compares points on a question with total points on the other questions. A negative value is a reason to inspect the key, wording, and learning target, not proof of a bad question. It is shown only with at least 10 fully scored responses, two questions, and variation in both scores. This minimum is a display rule, not a guarantee of reliability. A high average may be appropriate for a mastery check.</p><p>The review threshold is your screening choice. It does not change grades or mastery ratings. Missing and pending work never count as zero.</p></details>
    </section>
    <section className={s.card}><p className={s.eyebrow}>TEACHING & LEARNING</p><h2>Did the same students improve?</h2><p className={s.muted}>Choose an earlier quiz to compare your 1–2–3 ratings on shared learning targets. Each row pairs the same students in the same class, using submissions made in the correct order.</p>
      <label className={`${s.field} ${w.baseline}`}>Earlier quiz<select value={before?.id??''} onChange={e=>setBaseline(e.target.value)}><option value="">Choose a baseline…</option>{assignments.filter(a=>a.id!==quiz.id).map(a=><option key={a.id} value={a.id}>{name(a)}</option>)}</select></label>
      {before?(growth.length?<div className={s.tableScroll}><table className={s.resultsTable}><thead><tr>{['Shared target','Paired students','Improved / same / declined','Got it: before → after','Change in “Got it”'].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{growth.map(g=><tr key={g.target}><th scope="row">{label(g.target)}</th><td>{g.count}</td><td>{g.improved} / {g.stable} / {g.declined}</td><td>{g.count?`${g.beforeSecure}/${g.count} → ${g.afterSecure}/${g.count}`:'—'}</td><td><strong>{g.secureGain===null?'—':`${g.secureGain>0?'+':''}${Math.round(g.secureGain)} pp`}</strong><small>{g.count<10?'Small or incomplete sample':'Percentage-point change'}</small></td></tr>)}</tbody></table></div>:<p className={s.notice}>These quizzes have no shared learning targets. Choose a quiz assessing the same target.</p>):<p className={s.notice}>Start with a baseline, teach or reteach, then assess the same targets again. Include Archived in the filters to find older quizzes.</p>}
      <p className={s.muted}>Only students with a returned teacher rating on both quizzes count. “Got it” means level 3; change is the difference in that share. No matched ratings means no growth estimate. Differences in quiz difficulty, practice, attendance, and grading also affect results. This is evidence for reflection, not a causal rating of teaching effectiveness.</p>
    </section>
  </div>
}
function Metric({label,value,detail}:{label:string;value:string;detail:string}){return <div className={w.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}
