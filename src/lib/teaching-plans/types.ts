import type { LibraryMetadata } from '../activity-library'
export type ActivityKind = 'worksheet' | 'simulation' | 'interactive' | 'quiz' | 'reading' | 'review' | 'vocabulary' | 'math' | 'video' | 'lesson'
export type PlanActivity = LibraryMetadata & {
  quizSchedule?: import('../quiz-schedule').QuizSchedule;
  key: string; sourceId: string; kind: ActivityKind; title: string; unitIds: string[];
  targetIds: string[]; description: string; prompts: string[]; minutes: number | null;
  href: string; setupHref: string; teach: { label: string; href: string }[];
  scheduling: 'interactive' | 'source'; availability: string; courseId?: string;
}
export type PlanStep = { id: string; activityKey: string; title: string; kind: ActivityKind; purpose: string; optional: boolean; notes: string }
export type UnitPlan = { id: string; version: number; steps: PlanStep[]; updated_at: string }
export type TeachingSlot = { date: string; block: string }
export type ClassPlan = { course_id: string; plan_version: number; version: number; steps: PlanStep[]; meetings: Record<string, TeachingSlot>; current_step_id: string | null; confirmed_at: string | null }
export type PlanningClass = { id: string; label: string; scheduleIssue: string | null; meetings: (TeachingSlot & { long: boolean })[]; state: ClassPlan | null }
export type PlanningData = {
  classId: string; unitId: string; unitName: string; plan: UnitPlan | null;
  catalog: PlanActivity[]; targets: { id: string; statement: string; slug: string; unit_id: string }[];
  classes: PlanningClass[]; readOnly: boolean; warnings: string[];
  assignments: { id: string; course_id: string; slug: string; due_on: string | null }[];
}

export type SavedUnitSequence = {id:string;title:string;unitId:string;updatedAt:string;steps:PlanStep[]}
