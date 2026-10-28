import type { WorksheetTrack } from './daily-worksheets'
import type { QuizCourse, QuizQuestion, QuizTarget } from './quizzes/types'
export type PaperState = 'received' | 'not_received' | 'excused'
export const PAPER_LABELS: Record<PaperState,string> = { received:'Paper received', not_received:'Awaiting paper', excused:'Excused' }
export interface WorksheetAssignment {
 id:string; course_id:string; unit_id:string; day:number; edition:WorksheetTrack; title:string; target_ids:string[]; plan_key?:string|null;
 quiz_id:string; due_at:string; status:'published'|'archived'; student_ids:string[]|null; version:number; created_at:string; source_sha256:string;
}
export interface PaperReceipt {assignment_id:string;user_id:string;state:PaperState;version:number;recorded_at:string}
export interface WorksheetList {staff:boolean;readOnly:boolean;courses:QuizCourse[];assignments:WorksheetAssignment[];receipts:PaperReceipt[]}
export interface WorksheetDetail {staff:boolean;readOnly:boolean;assignment:WorksheetAssignment;receipts:PaperReceipt[];students:{id:string;name:string}[];pdf:string;quiz:{id:string;title:string;due_at:string|null;status:string};target:string;criteria:string[]}
export interface WorksheetQuizPreview {unit:string;day:number;title:string;target:string;criteria:string[];questions:QuizQuestion[];targets:QuizTarget[];source_sha256:string;quiz_sha256:string}
