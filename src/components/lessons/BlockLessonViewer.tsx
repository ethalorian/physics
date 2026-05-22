'use client'

import Link from 'next/link'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { BlockDocument } from '@/data/content-blocks'
import { Home, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface NavLink { slug: string; title: string }

interface BlockLessonViewerProps {
  lesson: {
    id: string
    title: string
    unit?: string
    estimated_time?: number
    content_blocks?: BlockDocument
  }
  nav?: { prev?: NavLink | null; next?: NavLink | null }
}

const DAY_LABEL: Record<string, string> = {
  ANCHOR: 'Anchor', STANDARD: 'Lesson', LAB: 'Lab', WORKSHOP: 'Workshop', SYNTHESIS: 'Synthesis', TRANSFER: 'Transfer',
}

export default function BlockLessonViewer({ lesson, nav }: BlockLessonViewerProps) {
  const blocks = lesson.content_blocks?.blocks ?? []
  const dayType = lesson.content_blocks?.dayType
  const trim = (s: string) => (s.length > 28 ? s.slice(0, 27) + '…' : s)

  return (
    <div className="max-w-3xl mx-auto px-5 pb-24" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div className="pt-6 pb-5">
        <Link href="/home" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <ChevronLeft size={16} /> Home
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              {lesson.unit && <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{lesson.unit}</span>}
              {dayType && <span className="text-xs font-bold rounded px-2 py-0.5" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>{DAY_LABEL[dayType] ?? dayType}</span>}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">{lesson.title}</h1>
            {lesson.estimated_time ? (
              <div className="mt-1 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <Clock size={13} /> ~{lesson.estimated_time} min
              </div>
            ) : null}
          </div>
          <span className="rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)', boxShadow: '0 0 16px color-mix(in oklch, var(--reward) 40%, transparent)' }}>★ +25 XP</span>
        </div>
      </div>

      {/* blocks */}
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} lessonId={lesson.id} />
      ) : (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This lesson does not have content yet.</p>
      )}

      {/* footer nav */}
      <div className="mt-10 pt-6 flex items-center justify-between gap-3 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
        <Link href="/home" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
          <Home size={16} /> Back to home
        </Link>
        <div className="flex gap-2">
          {nav?.prev && (
            <Link href={`/lessons/${nav.prev.slug}`} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
              <ChevronLeft size={16} /> Previous
            </Link>
          )}
          {nav?.next ? (
            <Link href={`/lessons/${nav.next.slug}`} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
              Next: {trim(nav.next.title)} <ChevronRight size={16} />
            </Link>
          ) : (
            <Link href="/home" className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
              Finish — back to journey <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
