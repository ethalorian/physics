import { COMPETENCIES, missionForCode, missionHref, type CompetencyCode } from './math-missions/catalog'

export interface MathRemediation {
  code: CompetencyCode
  skill: string
  game: string
  href: string
  reason: 'answer' | 'teacher'
}

export function isMathSkill(code: unknown): code is CompetencyCode {
  return typeof code === 'string' && Object.hasOwn(COMPETENCIES, code)
}

export function mathPracticeHref(code: CompetencyCode) {
  return `/dashboard/math-spine/warmup?practice_skill=${code}#practice`
}

/** A miss recommends support; an unparsed answer is not evidence of a gap.
 * A completed teacher review takes precedence over the automatic check.
 */
export function mathRemediation(
  code: string,
  result: string | null | undefined,
  teacherLevel?: number | null,
): MathRemediation | null {
  const needsSupport = teacherLevel != null ? teacherLevel === 1 : result === 'mismatch'
  if (!needsSupport || !isMathSkill(code)) return null
  const mission = missionForCode(code)
  if (!mission) return null
  return {
    code,
    skill: COMPETENCIES[code],
    game: mission.name,
    href: `${missionHref(code, mathPracticeHref(code))}&mode=practice&from=math-feedback`,
    reason: teacherLevel === 1 ? 'teacher' : 'answer',
  }
}
