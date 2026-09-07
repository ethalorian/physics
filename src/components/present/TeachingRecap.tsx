'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTeachingTools } from './useTeachingTools'
export default function TeachingRecap({ sessionId }: { sessionId: string }) {
  const { state, error } = useTeachingTools(sessionId)
  const notes = state?.marks.filter(m => m.kind === 'bookmark') ?? []
  function download() {
    const text = notes.map(m => `Slide ${m.slide + 1}${m.student_id ? ` · ${state?.roster.find(s => s.id === m.student_id)?.name ?? 'Student'}` : ''}: ${m.note}`).join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a'); a.href = url; a.download = 'teaching-recap.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-title-1">Private teaching recap</h1>{error && <p role="alert" className="text-destructive">{error}</p>}<Button className="min-h-12" disabled={!notes.length} onClick={download}>Download recap</Button>{!state ? <p>Loading…</p> : !notes.length ? <p>No bookmarks for this session.</p> : notes.map(m => <Card key={m.id} className="gap-2 p-4"><p className="text-caption">Slide {m.slide + 1}{m.student_id ? ` · ${state.roster.find(s => s.id === m.student_id)?.name ?? 'Student'}` : ''}</p><p className="whitespace-pre-wrap">{m.note}</p></Card>)}</div>
}
