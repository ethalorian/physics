import type { AssessmentDemand } from '@/lib/assessment-demand'

export type Bloom = AssessmentDemand['blooms']
export interface AnalyticsClass { id: string; name: string; section: string | null; teacher: string | null; program: string }
export interface AnalyticsStudent { id: string; name: string; classIds: string[] }
export interface AnalyticsTarget { id: string; slug: string; statement: string; unitId: string; domain: string }
export interface Rating { id: string; studentId: string; targetId: string; level: number; at: string; teacher: string | null; source?: string | null }
export interface AssignmentExposure { id: string; assignmentId: string; title: string; kind: 'quiz' | 'interactive' | 'lesson'; studentId: string; classIds: string[]; targetIds: string[]; at: string }
/** One immutable submitted question, with its released review (never an AI draft). */
export interface QuestionEvidence {
  id: string; questionKey: string; questionId: string; assessmentId: string; assessment: string; classId: string;
  studentId: string; targetId: string; kind: 'choice' | 'written' | 'problem'; bloom: Bloom | null; dok: number | null; prompt: string; answer: string;
  at: string; score: number | null; possible: number; reviewedAt: string | null; feedback: string;
}
export interface PracticeEvidence {
  id: string; studentId: string; classId: string; targetIds: string[]; title: string; questionId: string;
  at: string; attempts: number; firstCorrect: boolean; latestCorrect: boolean;
}
export interface FeedbackEvidence { id: string; studentId: string; targetId: string | null; at: string; message: string; teacher: string | null }
export interface ActivityEvidence { studentId: string; at: string; source: string; device: 'Mobile' | 'Tablet' | 'Computer' | 'Unknown' }
export interface AnalyticsDataset {
  program: string; from: string; asOf: string; readOnly: true;
  classes: AnalyticsClass[]; students: AnalyticsStudent[]; targets: AnalyticsTarget[]; units: { id: string; name: string }[];
  ratings: Rating[]; questions: QuestionEvidence[]; practice: PracticeEvidence[]; feedback: FeedbackEvidence[]; activity: ActivityEvidence[];
  assignments: AssignmentExposure[];
  coverage: { untaggedQuestions: number; unscoredQuestions: number; sources: string[] };
}
export interface AnalyticsFilter { classId?: string; teacher?: string; unitId?: string; targetId?: string; bloom?: string; studentId?: string }
export interface SkillGrowth {
  studentId: string; targetId: string; current: number | null; first: number | null; latest: number | null; delta: number | null;
  observations: number; lastAt: string | null; persistent: boolean;
}
export type StudentFocus = 'all' | 'improving' | 'attention' | 'missing'
export type AnalyticsView = 'overview' | 'impact' | 'classes' | 'students' | 'skills' | 'blooms' | 'engagement' | 'guide'
