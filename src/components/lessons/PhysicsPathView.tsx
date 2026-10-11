'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, FlaskConical, PencilLine, PlayCircle, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LessonPage } from '@/data/content-blocks'
import theme from './LearningTheme.module.css'
import styles from './PhysicsLearning.module.css'

interface Props { preview?:boolean; previewLabel?:string; title:string; focus:string; pages:LessonPage[]; current:number; done:number; total:number; staff:boolean; onGo:(index:number)=>void; isLocked:(index:number)=>boolean; next:()=>void; children:ReactNode; support:ReactNode; submit:ReactNode; toolbar:ReactNode; mastery:ReactNode; follow:ReactNode }
export default function PhysicsPathView(p:Props) {
  const titleFor=(page:LessonPage,index:number)=>page.blocks.find(b=>b.workshop?.stage)?.workshop?.stage || (index===0?'Learn':page.hasCapture?'Try it':'Connect')
  const appearance=(title:string)=>/read/i.test(title)?{tone:'reading',Icon:BookOpen}:/explore|investigat/i.test(title)?{tone:'investigate',Icon:FlaskConical}:/2026|apply|connect/i.test(title)?{tone:'mission',Icon:Rocket}:/try|check|explain|worked/i.test(title)?{tone:'practice',Icon:PencilLine}:{tone:'concept',Icon:PlayCircle}
  const stageTitle=titleFor(p.pages[p.current],p.current),{tone,Icon}=appearance(stageTitle)
  return <div className={`${theme.theme} ${styles.reader}`}>
    <header className={styles.readerHead}><div>{!p.preview && <Link href="/lessons">← Learning library</Link>}<p className={styles.readerLabel}>LEARN · PRACTICE · CONNECT</p><h1>{p.title}</h1><p className={styles.targetNote}>{p.focus}</p></div><div className="space-y-3 text-sm"><p>{p.staff?p.previewLabel??'Teacher preview':`${p.done} of ${p.total} responses saved`}</p>{p.toolbar}</div></header>
    {p.mastery}{p.follow}
    <div className={styles.readerGrid}><nav className={styles.rail} aria-label="Lesson steps">{p.pages.map((page,i)=><button type="button" data-tone={appearance(titleFor(page,i)).tone} key={i} onClick={()=>p.onGo(i)} disabled={p.isLocked(i)} aria-current={p.current===i?'step':undefined}><span>{i+1}</span>{titleFor(page,i)}</button>)}</nav><div><section className={styles.stage} data-tone={tone}><div className={styles.stageHeading} key={p.current}><span className={styles.stageIcon}><Icon size={26}/></span><div><p className={styles.eyebrow}>STEP {p.current+1} OF {p.pages.length}</p><h2>{stageTitle}</h2></div></div><div className={styles.stageContent}>{p.children}</div>{p.support}</section><div className={styles.readerFoot}><Button variant="outline" disabled={p.current===0} onClick={()=>p.onGo(p.current-1)}><ChevronLeft size={16}/>Back</Button>{p.current<p.pages.length-1?<Button onClick={p.next} disabled={p.isLocked(p.current+1)}>Continue<ChevronRight size={16}/></Button>:<span className="inline-flex items-center gap-2 text-sm text-muted-foreground">{p.staff ? 'Final step · read-only preview' : 'Final step · submit your responses'}</span>}</div>{p.submit}</div></div>
  </div>
}
