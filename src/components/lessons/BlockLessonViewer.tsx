'use client'

import Link from 'next/link'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { useBlockResponses } from '@/components/blocks/useBlockResponses'
import { BlockDocument, isCaptureBlock, isBlockComplete } from '@/data/content-blocks'
import { Home, ChevronLeft, ChevronRight, Clock, Star, Sparkles, FlaskConical, BookOpen, Wrench, Rocket, Layers, type LucideIcon } from 'lucide-react'

interface NavLink { slug: string; title: string }

interface BlockLessonViewerProps {
  lesson: {
    id: string
    title: string
    unit?: string
    estimated_time?: number
    hero_image?: string | null
    content_blocks?: BlockDocument
  }
  nav?: { prev?: NavLink | null; next?: NavLink | null }
}

const DAY_META: Record<string, { label: string; Icon: LucideIcon }> = {
  ANCHOR: { label: 'Anchor', Icon: Sparkles },
  STANDARD: { label: 'Lesson', Icon: BookOpen },
  LAB: { label: 'Lab day', Icon: FlaskConical },
  WORKSHOP: { label: 'Workshop', Icon: Wrench },
  SYNTHESIS: { label: 'Synthesis', Icon: Layers },
  TRANSFER: { label: 'Transfer', Icon: Rocket },
}

export default function BlockLessonViewer({ lesson, nav }: BlockLessonViewerProps) {
  const blocks = lesson.content_blocks?.blocks ?? []
  const dayType = lesson.content_blocks?.dayType
  const day = dayType ? DAY_META[dayType] : undefined
  const trim = (s: string) => (s.length > 28 ? s.slice(0, 27) + '…' : s)

  // One source of truth for responses, shared with the renderer so the header
  // progress fills as the student answers interactive blocks.
  const { responses, save } = useBlockResponses(lesson.id)
  const interactive = blocks.filter(isCaptureBlock)
  const total = interactive.length
  const done = interactive.filter((b) => isBlockComplete(b, responses[b.id]?.response)).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const complete = total > 0 && done === total

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24" style={{ color: 'var(--foreground)' }}>
      {/* decorative hero art (optional, per lesson) */}
      {lesson.hero_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lesson.hero_image}
          alt=""
          className="mt-4 w-full rounded-3xl"
          style={{ height: 176, objectFit: 'cover', border: '1px solid var(--border)' }}
        />
      )}
      {/* playful hero */}
      <div
        className={`rounded-3xl px-5 pt-4 pb-5 ${lesson.hero_image ? 'mt-3' : 'mt-4'}`}
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <Link href="/home" className="inline-flex items-center gap-1 text-xs" style={{ color: 'color-mix(in oklch, var(--primary-foreground) 78%, transparent)' }}>
          <ChevronLeft size={15} /> Home
        </Link>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {lesson.unit && (
            <span className="text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'color-mix(in oklch, var(--primary-foreground) 16%, transparent)', color: 'var(--primary-foreground)' }}>
              {lesson.unit}
            </span>
          )}
          {day && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>
              <day.Icon size={12} /> {day.label}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mt-2 leading-tight">{lesson.title}</h1>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-3 text-xs" style={{ color: 'color-mix(in oklch, var(--primary-foreground) 82%, transparent)' }}>
            {lesson.estimated_time ? (
              <span className="inline-flex items-center gap-1"><Clock size={13} /> ~{lesson.estimated_time} min</span>
            ) : null}
            {total > 0 && <span className="inline-flex items-center gap-1"><Star size={13} /> {total} {total === 1 ? 'task' : 'tasks'}</span>}
          </div>
          <span className="rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap inline-flex items-center gap-1" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>
            <Star size={14} /> +25 XP
          </span>
        </div>

        {total > 0 && (
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'color-mix(in oklch, var(--primary-foreground) 20%, transparent)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--reward)' }} />
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'color-mix(in oklch, var(--primary-foreground) 82%, transparent)' }}>
              {complete ? 'All steps done — nice work! ✦' : `${done} of ${total} steps done`}
            </div>
          </div>
        )}
      </div>

      {/* blocks */}
      <div className="mt-5">
        {blocks.length > 0 ? (
          <BlockRenderer blocks={blocks} lessonId={lesson.id} responses={responses} save={save} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This lesson does not have content yet.</p>
        )}
      </div>

      {/* footer nav */}
      <div className="mt-10 pt-6 flex items-center justify-between gap-3 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
        <Link href="/home" className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
          <Home size={16} /> Back to home
        </Link>
        <div className="flex gap-2">
          {nav?.prev && (
            <Link href={`/lessons/${nav.prev.slug}`} className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
              <ChevronLeft size={16} /> Previous
            </Link>
          )}
          {nav?.next ? (
            <Link href={`/lessons/${nav.next.slug}`} className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
              Next: {trim(nav.next.title)} <ChevronRight size={16} />
            </Link>
          ) : (
            <Link href="/home" className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
              Finish — back to journey <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
