'use client'

import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'
import { paginateBlocks, isRequiredCaptureBlock, type BlockDocument } from '@/data/content-blocks'
import { deriveSectionTitle } from '@/components/lessons/lesson-sections'
import InstructionVideo from '@/components/blocks/InstructionVideo'
import MathMarkdown from '@/components/MathMarkdown'
import CognitiveProfile from './CognitiveProfile'
import s from './VideoLessonWorkspace.module.css'

export default function VideoLessonPreparation({ document, unit, minutes, previewHref, teachHref }: { document: BlockDocument; unit?: string; minutes?: number; previewHref: string; teachHref: string }) {
  const pages = paginateBlocks(document.blocks)
  const videos = document.blocks.filter(block => block.type === 'instruction_video')
  const responses = document.blocks.filter(isRequiredCaptureBlock)
  const transfers = document.blocks.filter((block): block is import('@/data/content-blocks').InteractiveQuestionBlock => block.type === 'interactive_question' && block.task.format === 'transfer')
  return <div className={s.prepare}>
    <section className={s.film} aria-label="Preview lesson videos"><p className={s.eyebrow}>Watch & prepare</p><h2>The video students will use</h2>{videos.map(video => <div key={video.id}><InstructionVideo block={video}/></div>)}</section>
    <section className={s.outline} aria-label="Student lesson sequence"><p className={s.eyebrow}>Student experience</p><h2>From watching to explaining</h2><p>{document.learningPath?.focus}</p><p>{unit}{minutes ? ` · ${minutes} minutes` : ''}</p>
      <div className={s.stats}><span>{videos.length} video{videos.length===1?'':'s'}</span><span>{pages.length} steps</span><span>{responses.length} required responses</span></div>
      <CognitiveProfile demands={document.blocks.map(b=>b.demand)}/>
      <ol>{pages.map((page,index) => <li key={page.blocks[0]?.id ?? index}><span>{index+1}</span><div><strong>{deriveSectionTitle(page,index,pages.length)}</strong><small>{page.captureBlocks.some(isRequiredCaptureBlock) ? 'Student response · saved with the lesson' : 'Watch, read, or explore'}</small></div></li>)}</ol>
      {transfers.length>0 && <details className={s.transfer}><summary>Preview the transfer question{transfers.length===1?'':'s'} & scaffolding</summary>{transfers.map(block => <article key={block.id}><MathMarkdown content={block.task.prompt}/>{block.task.parts.map(part=><p key={part.id}><strong>{part.label}: </strong>{part.prompt}</p>)}</article>)}</details>}
      <div className={s.prepareActions}><Link className={s.primary} href={previewHref}><Eye size={16}/>Try student view</Link><Link className={s.secondary} href={teachHref}>Teach this lesson<ArrowRight size={16}/></Link></div>
    </section>
  </div>
}
