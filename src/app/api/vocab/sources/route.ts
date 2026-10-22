import {withAuth} from '@/lib/api-auth'
import {readingJson} from '@/lib/textbook-assignments-server'
import {vocabularyFor} from '@/lib/vocab-scope-server'
export const GET=withAuth(async(req,ctx)=>{
 const {sets,units,lessons}=await vocabularyFor(ctx,{courseId:req.nextUrl.searchParams.get('class'),unitPractice:true})
 return readingJson({units:units.map(u=>({id:u.id,name:u.name})),lessons:lessons.map(l=>({id:l.id,title:l.title,unit:units.find(u=>u.id===l.unit_id)?.name??''})),
  assigned:sets.filter(s=>s.assignment_titles.length||!s.lesson_id).map(s=>({setId:s.id,lessonId:s.lesson_id,unitId:s.unit_id,dueOn:null,label:s.label})),
  sets:sets.map(s=>({id:s.id,label:s.label,lessonId:s.lesson_id,lessonTitle:s.lesson_title,unitId:s.unit_id,unitName:s.unit_name,wordCount:s.term_ids.length,teachingConnection:s.teachingConnection}))})
})
