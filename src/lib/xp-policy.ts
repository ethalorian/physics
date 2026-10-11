export const UNIT_XP_TARGETS = { cpa: { lesson: 500, math: 200, total: 700, dailyMath: 10 }, honors: { lesson: 650, math: 250, total: 900, dailyMath: 15 } } as const
export type LessonRewardMaps = Record<'cpa' | 'honors', Record<string, number>>
// Matches economy_earning_events(); game points are a separate score.
export const VOCABULARY_DAILY_XP_CAP = 5
export interface VocabXpStatus { dailyEarned: number; dailyCap: number; lifetimeEarned: number }
export interface MathXpStatus { dailyEarned: number; dailyCap: number; remaining: number; resetsAt: string }
export const VOCAB_ASSIGNMENT_XP = 5
export const SPIN_SEGMENTS = [1, 2, 1, 3, 1, 5, 1, 2, 1, 25, 1, 2]
export const SPIN_PRIZES = [{ xp: 25, weight: .0033 }, { xp: 5, weight: .04 }, { xp: 3, weight: .10 }, { xp: 2, weight: .25 }, { xp: 1, weight: .6067 }]
export interface UnitXpReport {
 track: 'cpa' | 'honors'; lessonTarget: number; mathTarget: number; unitTarget: number; mathDailyCap: number; currentUnitId: string | null; effectiveAt: string;
 units: { id: string; name: string; lesson_target: number; math_target: number; lesson_available: number; lesson_earned: number; math_earned: number; evidence_count: number }[];
 term?: { label: string; starts_at: string; ends_at: string; minimum_xp: number; grade_points: number; earned: number } | null
}
