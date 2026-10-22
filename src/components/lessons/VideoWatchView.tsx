import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import type { BlockDocument } from '@/data/content-blocks'
import InstructionVideo from '@/components/blocks/InstructionVideo'

export default function VideoWatchView({ title, document }: { title: string; document: BlockDocument }) {
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6" data-video-watch>
    <Link className="inline-flex min-h-11 items-center gap-2 text-sm text-primary underline" href="/lessons"><ArrowLeft size={16}/>Video library</Link>
    <header className="space-y-3"><p className="text-sm font-semibold text-primary">Video library · Watch anytime</p><h1 className="text-3xl font-semibold">{title}</h1><p className="text-muted-foreground">Watch, pause, and replay to learn or review. Questions and assignments are assigned separately on your class calendar.</p></header>
    {document.blocks.map(block => block.type === 'instruction_video' ? <InstructionVideo key={block.id} block={block}/> : null)}
    <aside className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"><p className="text-sm">Looking for assigned questions? Open the assignment from your calendar.</p><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/home"><CalendarDays size={18}/>Go to calendar</Link></aside>
  </main>
}
