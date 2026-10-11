'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Maximize, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { classDaySource, type ClassDayTool } from '@/lib/class-day-tools'

/** Hosts the exported animation unchanged; only the surrounding launch controls are ours. */
export default function ClassDayPlayer({ tool, courseId }: { tool: ClassDayTool; courseId: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [slow, setSlow] = useState(false)
  const [tweaks, setTweaks] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guide, setGuide] = useState('')
  const [notice, setNotice] = useState('')
  const [mount, setMount] = useState(0)
  const label = `Unit ${tool.unit.slice(5)} · Day ${tool.day}`
  const returnHref = `/admin/teacher/plans?unit=${encodeURIComponent(tool.unit)}&day=${tool.day}${courseId ? `&class=${encodeURIComponent(courseId)}` : ''}`

  useEffect(() => {
    setReady(false); setSlow(false); setTweaks(false)
    const timer = window.setTimeout(() => setSlow(true), 20000)
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === '__edit_mode_available') {
        // The exported engine shares one saved playhead across every document.
        // Start each launch at its own title using its existing host seek protocol.
        requestAnimationFrame(() => {
          const canvas = frame.current?.contentDocument?.querySelector('[data-om-exportable-video-with-duration-secs]')
          canvas?.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: 0, sync: true } }))
          setReady(true); setSlow(false); window.clearTimeout(timer)
        })
      }
      if (event.data?.type === '__edit_mode_dismissed') setTweaks(false)
      if (event.data?.type === 'omelette:request-video-export') {
        setNotice('Video export is available in the original Claude project. All classroom playback controls work here.')
      }
    }
    window.addEventListener('message', receive)
    return () => { window.clearTimeout(timer); window.removeEventListener('message', receive) }
  }, [tool.unit, tool.day, mount])

  useEffect(() => {
    if (!guideOpen) return
    const controller = new AbortController()
    setGuide('')
    fetch(classDaySource(tool.guide), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.text() })
      .then(setGuide)
      .catch(() => { if (!controller.signal.aborted) setGuide('Could not load the guide. Use the download link to try again.') })
    return () => controller.abort()
  }, [guideOpen, tool.guide])

  function toggleTweaks() {
    const open = !tweaks
    frame.current?.contentWindow?.postMessage({ type: open ? '__activate_edit_mode' : '__deactivate_edit_mode' }, window.location.origin)
    setTweaks(open)
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await stage.current?.requestFullscreen()
    } catch { setNotice('Fullscreen is unavailable in this browser. Open the original animation in a new tab below.') }
  }

  return <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground" data-class-day-player={tool.day} data-class-day-unit={tool.unit}>
    <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <Link href={returnHref} className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16} /> Course plan</Link>
      <h1 className="min-w-0 flex-[1_1_16rem] text-base font-semibold">{label} · {tool.title}</h1>
      <Button className="min-h-11" variant="outline" disabled={!ready} aria-pressed={tweaks} onClick={toggleTweaks}><Settings2 size={16} /> Tweaks</Button>
      <Button className="min-h-11" variant="outline" aria-expanded={guideOpen} aria-controls="class-day-guide" onClick={() => setGuideOpen(open => !open)}>Teacher guide</Button>
      <Button className="min-h-11" variant="outline" onClick={fullscreen}><Maximize size={16} /> Fullscreen</Button>
    </header>
    {notice && <p role="status" className="border-b px-4 py-2 text-sm">{notice} <button className="min-h-11 underline" onClick={() => setNotice('')}>Dismiss</button></p>}
    <div className="relative min-h-0 flex-1" ref={stage}>
      {!ready && <div role="status" className="absolute inset-x-0 top-0 z-10 bg-background p-4 text-sm">{slow ? 'The animation is taking longer to load.' : 'Loading teaching tool…'} {slow && <Button className="min-h-11" variant="outline" onClick={() => setMount(value => value + 1)}>Retry</Button>}</div>}
      <iframe key={`${tool.unit}:${tool.day}:${mount}`} ref={frame} src={classDaySource(tool.file)} title={`${label} · ${tool.title}`} allowFullScreen className="block h-full w-full border-0" />
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-1 text-xs text-muted-foreground">
      <span>Click the animation, then Space to play or continue · N next section · B back · 0 restart</span>
      <a className="inline-flex min-h-11 items-center underline" href={classDaySource(tool.file)} target="_blank" rel="noopener noreferrer">Open original in a new tab</a>
    </footer>
    {guideOpen && <aside id="class-day-guide" aria-label={`${label} teacher guide`} className="absolute inset-y-0 right-0 z-20 w-full max-w-xl overflow-y-auto border-l bg-background p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-semibold">Teacher guide</h2><Button className="min-h-11" variant="outline" onClick={() => setGuideOpen(false)}>Close guide</Button></div>
      <a href={classDaySource(tool.guide)} download className="mb-4 inline-flex min-h-11 items-center underline">Download original guide</a>
      <div className="space-y-3 text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal [&_p]:my-3 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2"><ReactMarkdown remarkPlugins={[remarkGfm]}>{guide || 'Loading guide…'}</ReactMarkdown></div>
    </aside>}
  </div>
}
