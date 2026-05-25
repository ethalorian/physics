"use client"

import { useEffect, useState } from 'react'

// Renders the lesson's tiered SEI vocab (the single source authored in the
// builder), grouped Tier 1/2/3, with cognate, part of speech, example, image.

interface Term {
  id: string
  term: string
  definition: string
  tier: number | null
  cognate: string | null
  part_of_speech: string | null
  example: string | null
  image_url: string | null
}

const TIER_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Tier 1 · everyday', color: 'var(--success)' },
  2: { label: 'Tier 2 · academic', color: 'var(--reward)' },
  3: { label: 'Tier 3 · physics', color: 'var(--primary)' },
}

export default function LessonVocabView({ lessonId }: { lessonId: string }) {
  const [terms, setTerms] = useState<Term[] | null>(null)

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/vocab`).then((r) => r.json())
      .then((d: { terms?: Term[] }) => setTerms(d.terms ?? []))
      .catch(() => setTerms([]))
  }, [lessonId])

  if (terms === null) return null
  if (terms.length === 0) return null

  const tiers = [1, 2, 3].filter((t) => terms.some((x) => (x.tier ?? 3) === t))

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-xs font-medium mb-3" style={{ color: 'var(--secondary-foreground, var(--muted-foreground))' }}>Key terms</div>
      <div className="space-y-4">
        {tiers.map((t) => {
          const meta = TIER_META[t]
          return (
            <div key={t}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: meta.color }}>{meta.label}</div>
              <div className="space-y-2">
                {terms.filter((x) => (x.tier ?? 3) === t).map((x) => (
                  <div key={x.id} className="rounded-md p-2.5" style={{ background: `color-mix(in oklch, ${meta.color} 8%, transparent)`, borderLeft: `3px solid ${meta.color}` }}>
                    <div className="flex items-start gap-3">
                      {x.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={x.image_url} alt={x.term} className="rounded-md object-cover flex-shrink-0" style={{ width: 48, height: 48 }} referrerPolicy="no-referrer" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm">
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{x.term}</span>
                          {x.part_of_speech && <span className="italic ml-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{x.part_of_speech}</span>}
                          {x.cognate && <span className="ml-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>· {x.cognate}</span>}
                        </div>
                        <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{x.definition}</div>
                        {x.example && <div className="text-xs italic mt-1" style={{ color: 'var(--muted-foreground)' }}>“{x.example}”</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
