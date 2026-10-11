'use client'
import { useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, ClipboardCheck, PencilLine } from 'lucide-react'
import type { ReadingBlock } from '@/data/content-blocks'
import { textbookChapter } from '@/data/textbook'
import { TEXTBOOK_SECTIONS, sectionPageRange } from '@/data/textbook-sections'
import { lessonReadingKey } from '@/lib/lesson-reading-key'
import { readingState, type ReadingList } from '@/lib/textbook-assignments'
import { dueLabel, readingFetch } from './ReadingShared'
import { LessonReadingPreview } from './LessonReadingContext'
import theme from '@/components/lessons/LearningTheme.module.css'
import styles from './LessonReadingCard.module.css'

export default function LessonReadingCard({block,lessonId}:{block:ReadingBlock;lessonId:string}) {
  const preview=useContext(LessonReadingPreview)
  const [data,setData]=useState<ReadingList|null>(null),[error,setError]=useState('')
  const load=useCallback(async(signal?:AbortSignal)=>{
    setError('')
    try { setData(await readingFetch<ReadingList>(`/api/readings?lesson_id=${encodeURIComponent(lessonId)}`,{signal})) }
    catch(e){if(!signal?.aborted)setError((e as Error).message)}
  },[lessonId])
  useEffect(()=>{setData(null);const c=new AbortController();if(!preview)void load(c.signal);return()=>c.abort()},[load,preview])
  const chapter=textbookChapter(block.chapter),sections=TEXTBOOK_SECTIONS[block.chapter]?.sections.filter(s=>block.sectionIds.includes(s.id))??[],range=sectionPageRange(block.sectionIds)
  const assignments=data?.assignments.filter(a=>a.origin_key===lessonReadingKey(lessonId,block.id))??[]
  const checks=block.assignmentChecks??sections.filter(s=>s.conceptCheck).map(s=>({reference:`Section ${s.id}`,prompt:s.conceptCheck!}))
  if(!chapter||sections.length!==block.sectionIds.length)return <p role="alert">This reading reference needs a teacher correction. Ask your teacher for the assigned pages.</p>
  return <article className={`${theme.theme} ${styles.card}`}>
    <header className={styles.heading}><BookOpen size={25}/><div><p>CONCEPTUAL PHYSICS · CHAPTER {block.chapter}</p><h3>Read & respond</h3></div><span className={styles.chapter}>{String(block.chapter).padStart(2,'0')}</span></header>
    <div className={styles.body}>
      {assignments.length>0?assignments.map(a=>{
        const work=data?.work.find(w=>w.assignment_id===a.id),course=data?.courses.find(c=>c.id===a.course_id)
        const action=data?.staff?(a.status==='draft'?'Review & publish draft':'Review class answers'):work?.state==='returned'?'Revise my answers':work?.state==='rated'?'View feedback':work?.state==='submitted'?'View my submission':work?'Continue reading & checks':'Start reading & checks'
        return <section key={a.id} className={styles.assignment}>
          <div className={styles.status}><span>{a.status==='draft'?'Teacher draft':a.status==='archived'?'Archived':data?.staff?'Assigned to class':readingState(work)}</span><span>{a.questions.length} collected checks</span></div>
          <h4>{a.title}</h4><p className={styles.muted}>{course?.name}{course?.section?` · ${course.section}`:''}</p>
          <p><strong>Chapter {a.chapter}</strong> · {a.reading}</p>{a.instructions&&<p>{a.instructions}</p>}
          <details className={styles.questions}><summary>See the {a.questions.length} assigned questions</summary><ol>{a.questions.map(q=><li key={q.id}><strong>{q.reference}</strong>{q.prompt&&<p>{q.prompt}</p>}</li>)}</ol></details>
          <p className={styles.muted}>{dueLabel(a.due_at)}</p>
          <Link className={styles.primary} href={data?.staff?`/admin/readings?id=${a.id}`:`/readings/${a.id}`}>{action}<ArrowRight size={17}/></Link>
        </section>
      }):<>
        <h4>{chapter.title}</h4>{block.focus&&<p>{block.focus}</p>}
        <ul className={styles.sections}>{sections.map(s=><li key={s.id}><strong>{s.id}</strong> {s.title} <span>· p. {s.page}</span></li>)}</ul>
        <Link className={styles.secondary} href={`/textbook?ch=${block.chapter}`}><BookOpen size={17}/>Open textbook{range?` · p. ${range.from}${range.to>range.from?'–'+range.to:''}`:''}</Link>
        {preview?<><p className={styles.muted}>Preview of the reading checks. Your teacher publishes the class assignment separately.</p><ol className={styles.checks}>{checks.map((q,i)=><li key={i}>{q.prompt||q.reference}</li>)}</ol></>:error?<p role="alert">Couldn’t check your reading assignment. <button type="button" onClick={()=>void load()}>Try again</button></p>:!data?<p role="status">Checking class assignment…</p>:<p className={styles.muted}>{data.staff?'Publish this reading to collect answers and review them against the learning targets.':'Your teacher has not assigned collected checks for this reading yet. You can still use the pages as a reference.'}</p>}
      </>}
      {!!assignments.length&&<><ol className={styles.steps} aria-label="Reading assignment process"><li><BookOpen size={18}/>Read</li><li><PencilLine size={18}/>Respond</li><li><ClipboardCheck size={18}/>Submit</li></ol><p className={styles.muted}>Submit these reading answers separately from your lesson responses. Your teacher reviews them for mastery; opening the textbook does not change your rating.</p></>}
      {data?.staff&&<Link className={styles.secondary} href={`/admin/readings?lesson_id=${encodeURIComponent(lessonId)}&block_id=${encodeURIComponent(block.id)}`}>{assignments.length?'Assign to another class':'Assign this reading'}<ArrowRight size={16}/></Link>}
    </div>
  </article>
}
