"use client"

// The Measure of All Things — an immersive metric-system quest.
// Six playable chapters from 1789 market chaos to the 1799 Archives.
// Narrative sim: custom page (not SimLab) that still plugs into the platform's
// registry, embed route, and activity/completion APIs. Progress persists in
// localStorage so students can stop and resume across sessions (self-paced HW).
//
// Two-tier completion: finishing all chapters completes the activity; scoring
// >= MASTERY_THRESHOLD on the final mission additionally records mastery=true
// in final_state for the gradebook.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react'
import { useSimulations } from '@/contexts/SimulationContext'
import { useSimEmbedded } from '@/components/simulations/embed-context'
import { useSimulationCompletion } from '@/hooks/useSimulationCompletion'
import { getSimulationCriteria } from '@/config/simulationCompletionCriteria'
import type { SimulationResult } from '@/types/interactive-content'

import {
  SIM_SLUG, MASTERY_THRESHOLD, CHAPTERS, CHAPTER_COUNT,
  GameState, freshGame, loadGame, saveGame, clearGame,
} from './types'
import Ch0Market from './ch0-market'
import Ch1Meridian from './ch1-meridian'
import Ch2Ladder from './ch2-ladder'
import Ch3Water from './ch3-water'
import Ch4Time from './ch4-time'
import Ch5Mission from './ch5-mission'

export default function MeasureOfAllThingsSim() {
  const { data: session } = useSession()
  const embedded = useSimEmbedded()
  const { getSimulationBySlug, startActivity, recordInteraction, completeActivity } = useSimulations()

  const [game, setGame] = useState<GameState | null>(null)
  const [resumed, setResumed] = useState(false)
  const [playing, setPlaying] = useState<number | null>(null)
  const activityIdRef = useRef<string | null>(null)
  const completedRef = useRef(false)

  // ---- load / resume ------------------------------------------------------
  useEffect(() => {
    const saved = loadGame()
    if (saved) {
      setGame(saved)
      setResumed(saved.done.some(Boolean))
      setPlaying(saved.done.every(Boolean) ? null : saved.current)
    } else {
      const g = freshGame()
      saveGame(g)
      setGame(g)
      setPlaying(0)
    }
  }, [])

  // ---- activity registration (same path as SimLab) ------------------------
  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    getSimulationBySlug(SIM_SLUG)
      .then((sim) => {
        if (!sim || cancelled) return
        return startActivity(sim.id)
      })
      .then((id) => { if (id && !cancelled) activityIdRef.current = id })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session?.user?.id, getSimulationBySlug, startActivity])

  // ---- completion plumbing -------------------------------------------------
  const onComplete = useCallback((payload: Record<string, unknown>, score?: number) => {
    const result: SimulationResult = {
      completed: true,
      score,
      data: payload,
      interactions: [],
      time_spent: typeof payload.timeSpent === 'number' ? payload.timeSpent : 0,
    }
    if (activityIdRef.current) completeActivity(activityIdRef.current, result).catch(() => {})
  }, [completeActivity])

  const { trackInteraction, markComplete } =
    useSimulationCompletion(getSimulationCriteria(SIM_SLUG), onComplete)

  // Fire platform completion exactly once, when every chapter is done.
  useEffect(() => {
    if (!game || completedRef.current) return
    if (game.done.every(Boolean)) {
      completedRef.current = true
      const best = game.missionBest ?? 0
      markComplete(
        { missionScore: best, mastery: best >= MASTERY_THRESHOLD, masteryThreshold: MASTERY_THRESHOLD },
        best,
      )
    }
  }, [game, markComplete])

  // ---- state transitions ---------------------------------------------------
  const update = useCallback((next: GameState) => {
    setGame(next)
    saveGame(next)
  }, [])

  const completeChapter = useCallback((i: number) => {
    setGame(prev => {
      if (!prev) return prev
      const done = prev.done.map((d, k) => (k === i ? true : d))
      const next: GameState = { ...prev, done, current: Math.min(i + 1, CHAPTER_COUNT - 1) }
      saveGame(next)
      return next
    })
    const interaction = trackInteraction(`chapter_${i}_complete`)
    if (activityIdRef.current) {
      recordInteraction(activityIdRef.current, { ...interaction, data: interaction.data ?? {} }).catch(() => {})
    }
    setPlaying(i + 1 < CHAPTER_COUNT ? i + 1 : null)
  }, [trackInteraction, recordInteraction])

  const finishMission = useCallback((score: number) => {
    setGame(prev => {
      if (!prev) return prev
      const best = Math.max(prev.missionBest ?? 0, score)
      const done = prev.done.map((d, k) => (k === 5 ? true : d))
      const next: GameState = { ...prev, done, missionBest: best }
      saveGame(next)
      return next
    })
    const interaction = trackInteraction('mission_finished', { score })
    if (activityIdRef.current) {
      recordInteraction(activityIdRef.current, { ...interaction, data: interaction.data ?? {} }).catch(() => {})
    }
  }, [trackInteraction, recordInteraction])

  const resetAll = useCallback(() => {
    if (!window.confirm('Start the whole journey over? Your chapter progress and mission score will be erased.')) return
    clearGame()
    completedRef.current = false
    const g = freshGame()
    update(g)
    setPlaying(0)
    setResumed(false)
  }, [update])

  if (!game) {
    return <div className="p-8 text-center text-muted-foreground">Loading the year 1789…</div>
  }

  const unlocked = (i: number) => i === 0 || game.done[i - 1]
  const allDone = game.done.every(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* header */}
      <div className="space-y-1">
        {!embedded && (
          <Link href="/simulations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> All simulations
          </Link>
        )}
        <h1 className="text-2xl font-bold">The Measure of All Things</h1>
        <p className="text-muted-foreground text-sm">
          A journey from the measurement chaos of 1789 to the system every scientist on Earth uses today.
        </p>
      </div>

      {resumed && playing !== null && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm">
          Welcome back, citizen — your progress was saved. Continuing at Chapter {playing}: {CHAPTERS[playing].title}.
        </div>
      )}

      {/* chapter map */}
      <div className="grid gap-2 sm:grid-cols-2">
        {CHAPTERS.map((c) => {
          const isDone = game.done[c.id]
          const isOpen = unlocked(c.id)
          const isActive = playing === c.id
          return (
            <button
              key={c.id}
              type="button"
              disabled={!isOpen}
              onClick={() => setPlaying(c.id)}
              className={`text-left rounded-lg border px-3 py-2 transition
                ${isActive ? 'border-amber-500 ring-2 ring-amber-300 dark:ring-amber-700' : 'border-border'}
                ${isOpen ? 'hover:border-amber-400 bg-card' : 'opacity-45 cursor-not-allowed bg-muted/40'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground">{c.year} · Ch. {c.id}</span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
              </div>
              <div className="font-semibold text-sm">{c.title}</div>
              <div className="text-xs text-muted-foreground">{c.subtitle}</div>
            </button>
          )
        })}
      </div>

      {/* finished banner */}
      {allDone && playing === null && (
        <div className="rounded-xl border border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-4 space-y-1 text-center">
          <div className="font-semibold text-green-800 dark:text-green-300">
            Journey complete — your work has been recorded.
          </div>
          <div className="text-sm text-muted-foreground">
            Final mission best: {game.missionBest ?? 0}%
            {(game.missionBest ?? 0) >= MASTERY_THRESHOLD
              ? ' · Master Inspector badge earned'
              : ` · revisit Chapter 5 anytime to chase the ${MASTERY_THRESHOLD}% mastery badge`}
          </div>
        </div>
      )}

      {/* active chapter */}
      {playing === 0 && <Ch0Market onComplete={() => completeChapter(0)} />}
      {playing === 1 && <Ch1Meridian onComplete={() => completeChapter(1)} />}
      {playing === 2 && <Ch2Ladder onComplete={() => completeChapter(2)} />}
      {playing === 3 && <Ch3Water onComplete={() => completeChapter(3)} />}
      {playing === 4 && <Ch4Time onComplete={() => completeChapter(4)} />}
      {playing === 5 && (
        <Ch5Mission
          onFinish={finishMission}
          finished={game.done[5]}
          bestScore={game.missionBest}
        />
      )}

      {/* footer */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Start over
        </button>
      </div>
    </div>
  )
}
