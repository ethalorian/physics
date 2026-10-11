import assessments from '@/data/course-assessments.json'

/** Assessment directions replace guided practice only on formal transfer days. */
export function coursePlanAssessment(unit: string, day: number) {
  return assessments.find(plan => plan.unit === unit && plan.day === day) ?? null
}
