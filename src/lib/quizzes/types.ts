import type {AssessmentDemand} from '@/lib/assessment-demand'
import type {QuizLanguageLevel} from './language'
import type {ProblemAnswer} from '@/lib/problem-response'
export type {ProblemAnswer} from '@/lib/problem-response'
export const QUIZ_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export type GradeMode = 'numeric' | 'letter' | 'credit'
export type QuizKind = 'vocabulary' | 'understanding' | 'mixed'
export const LETTER_GRADES = ['A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F'] as const
export interface QuizQuestion {
  id:string; kind:'choice'|'written'|'problem'; prompt:string; points:number; target_id:string;
  mcas_id?:string; demand?:AssessmentDemand;
  options?:string[]; correct_index?:number; guide?:string; vocabulary?:string[];
}
export interface Quiz {
  id:string; course_id:string; title:string; kind:QuizKind; instructions:string; grade_mode:GradeMode;
  questions:QuizQuestion[]; due_at:string|null; status:'draft'|'published'|'archived'; version:number;
  student_ids:string[]|null; source_quiz_id:string|null; created_at?:string; updated_at?:string; deleted_at?:string|null;
  language_level?:QuizLanguageLevel|null; sei_supports?:boolean|null;
}
export type QuizCard = Omit<Quiz,'questions'> & {question_count:number; possible:number; target_ids?:string[]; unit_ids?:string[]; work_count?:number}
export type QuizAnswers = Record<string,string|ProblemAnswer>
export interface QuizWork {quiz_id:string;user_id:string;answers:QuizAnswers;state:'in_progress'|'submitted'|'returned'|'graded';version:number;submission_id:string|null;updated_at?:string}
export interface QuizSubmission {id:string;quiz_id:string;user_id:string;answers:QuizAnswers;snapshot:Quiz;submitted_at:string}
export interface QuizReview {id:string;submission_id:string;decision:'returned'|'graded';scores:Record<string,number>;ratings:Record<string,1|2|3|null>;note:string;question_notes:Record<string,string>;earned:number|null;possible:number|null;grade_mode:GradeMode;grade_value:string|null;reviewed_at:string}
export interface QuizCourse {id:string;name:string;section:string;program:string;track?:string|null}
export interface QuizTarget {id:string;statement:string;domain:string;program:string;unit_id:string;slug?:string}
export interface LockedQuizCard { kind:QuizKind; id:string; course_id:string; title:string; due_at:string|null; created_at?:string; reading_id:string; reading_title:string }
export interface QuizList {locked?:LockedQuizCard[];staff:boolean;readOnly:boolean;courses:QuizCourse[];quizzes:QuizCard[];work:QuizWork[];reviews:QuizReview[];pending:Record<string,number>;inventory?:{units:{id:string;name:string}[];targets:QuizTarget[]}}
export interface QuizReviewDraft {submission_id:string;version:number;payload:{scores:Record<string,number>;ratings:Record<string,1|2|3|null>;note:string;question_notes:Record<string,string>;grade_value:string|null}}
export interface QuizDetail {ai?:import('./grading').QuizAiReview[];claudeConfigured?:boolean;claudeModel?:string;drafts?:QuizReviewDraft[];staff:boolean;readOnly:boolean;quiz:Quiz;students:{id:string;name:string}[];work:QuizWork[];submissions:QuizSubmission[];reviews:QuizReview[];targets:QuizTarget[]}
export interface QuizCatalog {courses:QuizCourse[];targets:QuizTarget[];units:{id:string;name:string;program:string}[];sets:{id:string;name:string;unit_id:string}[];words:{id:string;term:string;definition:string;vocabulary_set_id:string}[];enrollments:{course_id:string;student_id:string;name:string}[];readOnly:boolean}
export function quizCard(q:Quiz):QuizCard { const {questions,...card}=q;return {...card,target_ids:[...new Set(questions.map(q=>q.target_id))],question_count:questions.length,possible:questions.reduce((n,q)=>n+q.points,0)} }
/** Always strip assessment keys, including for already-submitted students. */
export function studentQuiz(q:Quiz):Quiz { return {id:q.id,course_id:q.course_id,title:q.title,kind:q.kind,instructions:q.instructions,grade_mode:q.grade_mode,due_at:q.due_at,status:q.status,version:q.version,student_ids:null,source_quiz_id:null,questions:q.questions.map(question=>({id:question.id,kind:question.kind,prompt:question.prompt,points:question.points,target_id:question.target_id,...(question.mcas_id?{mcas_id:question.mcas_id}:{}),...(question.options?{options:question.options}:{})}))} }
export function quizStatus(q:Pick<Quiz,'due_at'>,w?:QuizWork) {if(w?.state==='graded')return 'Returned';if(w?.state==='returned')return 'Revise & resubmit';if(w?.state==='submitted')return 'Awaiting review';if(q.due_at&&Date.parse(q.due_at)<Date.now())return 'Past due';return w?'In progress':'Not started'}
export function gradeLabel(r:QuizReview) {if(r.decision!=='graded')return 'Revision requested';if(r.grade_mode==='numeric')return `${r.earned}/${r.possible} · ${Math.round(100*r.earned!/r.possible!)}%`;return r.grade_mode==='credit'?(r.grade_value==='credit'?'Credit':'No credit'):r.grade_value??'Pending'}
