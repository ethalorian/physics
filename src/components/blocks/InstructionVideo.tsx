'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayCircle } from 'lucide-react'
import MathMarkdown from '@/components/MathMarkdown'
import type { InstructionVideoBlock } from '@/data/content-blocks'
import { loadLessonYouTubeApi, type LessonYouTubePlayer } from '@/lib/youtube-player'
import { useVideoWatchXp } from './useVideoWatchXp'

export default function InstructionVideo({ block, visible = true }: { block: InstructionVideoBlock; visible?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [playerError, setPlayerError] = useState(false)
  const playerContainer = useRef<HTMLDivElement>(null)
  const playerRef = useRef<LessonYouTubePlayer | null>(null)
  const visibleRef = useRef(visible)
  const xp = useVideoWatchXp(block.id)
  const { report } = xp
  const start = Math.max(0, Math.floor(block.startSeconds ?? 0))
  useEffect(() => {
    visibleRef.current = visible
    if (!visible && playerRef.current) {
      playerRef.current.pauseVideo()
      void report(playerRef.current.getCurrentTime(), false)
    }
  }, [visible, report])
  useEffect(() => {
    if (!playing || !playerContainer.current) return
    let active = true, player: LessonYouTubePlayer | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    const container = playerContainer.current
    const frame = document.createElement('iframe')
    frame.className = 'h-full w-full'
    frame.title = block.title
    frame.src = `https://www.youtube-nocookie.com/embed/${block.youtubeId}?rel=0&cc_load_policy=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&start=${start}`
    frame.allow = 'autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen'
    frame.allowFullscreen = true
    frame.referrerPolicy = 'strict-origin-when-cross-origin'
    container.replaceChildren(frame)
    const sample = () => { if (active && player) void report(player.getCurrentTime(), visibleRef.current && player.getPlayerState() === 1 && document.visibilityState === 'visible') }
    loadLessonYouTubeApi().then(api => {
      if (!active) return
      player = new api.Player(frame, { events: { onReady: () => { if (!visibleRef.current) player?.pauseVideo(); sample() }, onStateChange: sample } })
      playerRef.current = player
      timer = setInterval(sample, 5000)
      document.addEventListener('visibilitychange', sample)
    }).catch(() => { if (active) setPlayerError(true) })
    return () => {
      if (player) void report(player.getCurrentTime(), false)
      active = false; clearInterval(timer)
      document.removeEventListener('visibilitychange', sample)
      playerRef.current = null
      player?.destroy()
      container.replaceChildren()
    }
  }, [playing, report, block.title, block.youtubeId, start])
  if (!/^[A-Za-z0-9_-]{11}$/.test(block.youtubeId)) return <p role="alert">This video link needs a teacher correction. Use the key ideas below: {block.summary}</p>
  return <div className="space-y-4">
    <div className="aspect-video overflow-hidden rounded-xl border bg-secondary">
      {playing ? <div ref={playerContainer} className="h-full w-full"/> : <button type="button" className="flex h-full w-full min-h-44 flex-col items-center justify-center gap-4 p-6 text-center" onClick={()=>setPlaying(true)}><PlayCircle className="h-14 w-14 text-primary"/><span className="text-xl font-semibold">{block.title}</span><span className="text-sm text-muted-foreground">Play lesson · antocciphysics</span></button>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Pause and replay whenever you need.</span><a className="min-h-11 inline-flex items-center text-primary underline" href={`https://www.youtube.com/watch?v=${block.youtubeId}&t=${start}s`} target="_blank" rel="noopener noreferrer">Open on YouTube</a></div>
    {typeof block.xp === 'number' && block.xp > 0 && <div className="space-y-2 text-sm">
      <p className="font-semibold text-primary" role="status">{xp.status?.earned ? `${xp.status.earned} XP earned · watch credit recorded` : xp.assigned ? `${block.xp} XP · Watch 90% of this video here to earn once.` : `${block.xp} XP · Open your assigned lesson to earn watch credit.`}</p>
      {xp.preview ? <p className="text-muted-foreground">Preview · no XP is awarded.</p> : xp.status && !xp.status.earned ? <><progress className="h-2 w-full accent-primary" aria-label="Video XP watch progress" value={Math.min(xp.status.watched, xp.status.required)} max={xp.status.required}/><p className="text-muted-foreground">{Math.min(100,Math.floor(xp.status.watched / (xp.status.duration-xp.status.start)*100))}% watched · progress saves automatically.</p></> : null}
      {xp.error && <p role="alert">{xp.error} <button type="button" className="min-h-11 underline" onClick={xp.retry}>Retry XP tracking</button></p>}
      {playerError && <p role="alert">YouTube watch tracking could not load. Reload to try again. Opening YouTube separately does not record watch XP here.</p>}
    </div>}
    {xp.assigned && !xp.preview && <p className="rounded-lg border bg-card p-3 text-sm">Watching earns video XP. To turn in this lesson, complete the required responses and select <strong>Submit lesson for review</strong>.</p>}
    <section aria-label="Key ideas" className="space-y-3 border-l-4 border-primary/40 bg-primary/5 px-5 py-4">
      <h3 className="text-lg font-semibold">Key ideas</h3>
      <MathMarkdown content={block.summary}/>
    </section>
    {block.transcript&&<details className="rounded-lg border p-4"><summary className="min-h-11 cursor-pointer font-semibold">Read the transcript</summary><MathMarkdown content={block.transcript}/></details>}
  </div>
}
