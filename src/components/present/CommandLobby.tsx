'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { lobbyReadyDefault, type ContentBlock } from '@/data/content-blocks'
import { commandRequest, commandQuestion, type CommandLesson, type LiveCommandState } from '@/lib/classroom-command'

function blockPrompt(block: ContentBlock): string {
  if (block.type === 'question') return commandQuestion(block)!.prompt
  const data = block as unknown as Record<string, unknown>
  return String(data.prompt ?? data.instruction ?? data.title ?? block.type)
}
export default function CommandLobby({ lesson, live, pulseOpen = false }: { lesson: CommandLesson; live: LiveCommandState; pulseOpen?: boolean }) {
  const blocks = lesson.content_blocks.blocks.filter(lobbyReadyDefault)
  const [blockId, setBlockId] = useState(blocks[0]?.id ?? '')
  const [size, setSize] = useState(4)
  const [mode, setMode] = useState('near_peer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const pending = useRef(false)
  const [created, setCreated] = useState<LiveCommandState['lobby']>(null)
  // Hold a newly created session until the live polling response catches up.
  useEffect(() => { if (live.lobby) setCreated(null) }, [live.lobby])
  const lobby = live.lobby ?? created
  async function action(url: string, body: Record<string, unknown>, method = 'POST') {
    if (pending.current) return
    pending.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const data = await commandRequest<{ session?: NonNullable<LiveCommandState['lobby']> }>(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (data.session && url === '/api/lobby/sessions') setCreated(data.session)
      if (body.status === 'closed') setCreated(null)
      setNotice('Activity updated. The classroom screen will catch up in a moment.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Activity was not confirmed. Check before retrying.') }
    finally { pending.current = false; setBusy(false) }
  }
  function launch() {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return
    void action('/api/lobby/sessions', { course_id: live.session.course_id, lesson_id: lesson.id, block_id: block.id, target_slug: block.targetId ?? null, prompt: blockPrompt(block), task_type: ['sketch', 'lab_notebook'].includes(block.type) ? 'drawing' : ['gewa', 'equation_sandbox'].includes(block.type) ? 'proof' : block.type === 'question' ? 'question' : 'short_response', grouping_mode: mode, group_size: size })
  }
  const selectClass = 'min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base'
  return <div className="space-y-3"><h2 className="text-title-2">Group activity</h2><p className="text-muted-foreground">The join code replaces the slides while the activity is open. Close it to return to your slide.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}{notice && <p role="status">{notice}</p>}
    {lobby ? <><p className="text-title-1 tracking-widest">{lobby.code}</p><p>Status: {lobby.status}</p><div className="flex flex-wrap gap-2"><Button className="min-h-12" disabled={busy || lobby.status !== 'lobby'} onClick={() => action(`/api/lobby/sessions/${lobby.id}/group`, {})}>Form groups</Button><Button className="min-h-12" disabled={busy || lobby.status !== 'grouped'} onClick={() => action(`/api/lobby/sessions/${lobby.id}`, { status: 'open' }, 'PATCH')}>Start work</Button><Button variant="outline" className="min-h-12" disabled={busy} onClick={() => action(`/api/lobby/sessions/${lobby.id}`, { status: 'closed' }, 'PATCH')}>Close activity & return to slides</Button><Button asChild variant="outline" className="min-h-12"><Link href={`/admin/lobby/${lobby.id}`} target="_blank">View groups & work</Link></Button></div></> : blocks.length ? <fieldset disabled={busy || pulseOpen || Boolean(live.session.poll_block_id)} className="min-w-0 space-y-3"><label className="block text-caption">Lesson activity<select className={selectClass} value={blockId} onChange={e => setBlockId(e.target.value)}>{blocks.map(b => <option key={b.id} value={b.id}>{blockPrompt(b)}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-caption">Grouping<select className={selectClass} value={mode} onChange={e => setMode(e.target.value)}><option value="near_peer">Near-peer</option><option value="random">Random</option><option value="matched">Matched</option></select></label><label className="text-caption">Group size<select className={selectClass} value={size} onChange={e => setSize(Number(e.target.value))}>{[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label></div><Button className="min-h-14 w-full" onClick={launch}>Launch lobby</Button></fieldset> : <p>This lesson has no activities ready for a lobby.</p>}
    {live.session.poll_block_id && !lobby && <p>Close the poll before launching a group activity.</p>}
  </div>
}
