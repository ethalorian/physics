import type { EvidenceSuggestions } from './suggestions'
import { addRemainingSuggestedScores, targetMasterySummary, type Rating, type ReviewDecision, type ReviewDocument } from './types'

/** Fill a private review in one explicit action; never replace an existing teacher decision. */
export function applyAllSuggestions(doc: ReviewDocument, current: ReviewDecision, suggestions: EvidenceSuggestions | null) {
  const decision: ReviewDecision = {
    ...addRemainingSuggestedScores(doc, current),
    ratings: { ...current.ratings },
    evidenceRatings: { ...current.evidenceRatings },
    feedback: { ...current.feedback },
  }
  let count = Object.keys(decision.scores).length - Object.keys(current.scores).length
  const validRating = (value: unknown): value is Rating => value === null || value === 1 || value === 2 || value === 3
  const fillFeedback = (id: string, value?: string) => {
    const text = value?.trim()
    if (!decision.feedback[id]?.trim() && text && text.length <= 800) {
      decision.feedback[id] = text
      count++
    }
  }

  for (const item of doc.evidence) {
    const suggested = suggestions?.evidence.find(s => s.id === item.id)
    if (!Object.hasOwn(decision.evidenceRatings, item.id) && suggested && validRating(suggested.level)) {
      decision.evidenceRatings[item.id] = suggested.level
      count++
    }
    fillFeedback(item.id, suggested?.feedback)
  }
  for (const item of doc.scoreItems) fillFeedback(item.id, item.feedback)

  for (const target of doc.targets) {
    if (target.released !== undefined || Object.hasOwn(decision.ratings, target.id)) continue
    const combined = targetMasterySummary(doc, decision, target.id).suggested
    const level = combined ?? suggestions?.targets.find(s => s.id === target.id)?.level
    if (validRating(level) && (level !== null || target.allowSkip)) {
      decision.ratings[target.id] = level
      count++
    }
  }

  const note = suggestions?.feedback.trim() || doc.suggestedFeedback?.trim()
  if (!decision.note.trim() && note && note.length <= 1600) {
    decision.note = note
    count++
  }
  return { decision, count }
}
