import catalog from '@/data/deck-activities.json'
import worksheetCatalog from '@/data/worksheet-deck-activities.json'
import { coursePlanAssessment } from '@/lib/course-plan-assessment'
import etfCatalog from '@/data/trades-etf-deck-activities.json'
import type { PresentationIdentity } from '@/lib/course-plan-presentation'

export interface DeckActivity {
  id: string
  unitId: string
  day: number
  track: string
  src: string
  slide: number
  title: string
  prompt: string
  targetSlug: string
  kind: 'warmup' | 'solo' | 'exit_ticket'
  usesVisual: boolean
  targetId: string | null
  targetStatement: string | null
}

/** Course Plan identity takes precedence over a video lesson's day number. */
export function activitiesForDeck(identity: PresentationIdentity, targets: { id: string; slug?: string; statement: string }[], lessonSlug?: string | null): DeckActivity[] {
  const legacy = lessonSlug?.match(/^u([12])-d(\d{2})$/)
  const project = lessonSlug?.match(/^pp-w01-d([13])$/)
  const etf = lessonSlug?.match(/^mvp-etf-([1-4])-(\d{2})$/)
  const unit = identity.plan_unit_id ?? (legacy ? `unit-${legacy[1]}` : project ? 'proj-1' : etf ? `trades-etf-${etf[1]}` : null)
  const day = identity.plan_day ?? (legacy ? Number(legacy[2]) : project ? 10 + Number(project[1]) : etf ? Number(etf[2]) : null)
  const track = identity.plan_track === 'honors' ? 'honors' : 'cpa'
  if (unit && day && coursePlanAssessment(unit,day)) return []
  const worksheet = worksheetCatalog.some(a => a.unitId === unit && a.day === day && a.track === track)
  const source = worksheet ? worksheetCatalog : unit?.startsWith('trades-etf-') ? etfCatalog : catalog
  return source.filter(a => a.unitId === unit && a.day === day && (a.track === 'shared' || a.track === track)).map(a => {
    const target = targets.find(t => t.slug === a.targetSlug)
    return { ...a, kind: a.kind as DeckActivity['kind'], targetId: target?.id ?? null, targetStatement: target?.statement ?? null }
  })
}
