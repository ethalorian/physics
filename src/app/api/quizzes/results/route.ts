import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizCourses,quizRows,quizJson,quizListWork} from '@/lib/quizzes/server'
import type {Quiz,QuizSubmission,QuizReview} from '@/lib/quizzes/types'
import {assessmentResults} from '@/lib/quizzes/comparison'
import {choiceQuizDispositions} from '@/lib/choice-calendar-server'

export const GET=withRole(['teacher','admin'],async(_req,ctx)=>{
 const courses=(await quizCourses(ctx)).map(c=>({id:c.id,name:c.name,section:c.section??'',program:c.program})),ids=courses.map(c=>c.id)
 const [quizzes,roster,targets]=ids.length?await Promise.all([
  quizRows<Quiz>((a,b)=>supabaseAdmin.from('quiz_assignments').select('*').is('deleted_at',null).in('course_id',ids).order('created_at',{ascending:false}).order('id').range(a,b)),
  quizRows<{course_id:string;student_id:string;students:{name:string;is_active:boolean}|{name:string;is_active:boolean}[]|null}>((a,b)=>supabaseAdmin.from('course_students').select('course_id,student_id,students(name,is_active)').in('course_id',ids).eq('enrollment_state','ACTIVE').order('id').range(a,b)),
  quizRows<{id:string;statement:string}>((a,b)=>supabaseAdmin.from('learning_targets').select('id,statement').in('program',[...new Set(courses.map(c=>c.program))]).order('id').range(a,b)),
 ]):[[],[],[]]
 const work=await quizListWork(quizzes.filter(q=>q.status!=='draft').map(q=>q.id))
 const submissionIds=work.flatMap(w=>w.submission_id?[w.submission_id]:[])
 const chunks=Array.from({length:Math.ceil(submissionIds.length/150)},(_,i)=>submissionIds.slice(i*150,(i+1)*150))
 const [submissions,reviews]=submissionIds.length?await Promise.all([
  Promise.all(chunks.map(ids=>quizRows<QuizSubmission>((a,b)=>supabaseAdmin.from('quiz_submissions').select('*').in('id',ids).order('id').range(a,b)))).then(rows=>rows.flat()),
  Promise.all(chunks.map(ids=>quizRows<QuizReview>((a,b)=>supabaseAdmin.from('quiz_reviews').select('*').in('submission_id',ids).order('id').range(a,b)))).then(rows=>rows.flat()),
 ]):[[],[]]
 const enrollments=roster.flatMap(e=>{const student=Array.isArray(e.students)?e.students[0]:e.students;return student&&student.is_active!==false?[{course_id:e.course_id,student_id:e.student_id,name:student.name}]:[]})
 const choices=await choiceQuizDispositions(ids,[...new Set(enrollments.map(e=>e.student_id))])
 const input={quizzes,courses,enrollments,work,submissions,reviews,choiceExemptions:choices.exemptions,choiceAvailable:choices.available}
 return quizJson({assessments:assessmentResults(input),assignments:assessmentResults({...input,groupCopies:false}),targets,courses,enrollments})
})
