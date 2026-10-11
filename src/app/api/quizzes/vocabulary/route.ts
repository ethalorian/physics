import {withRole} from '@/lib/api-auth'
import {quizCourses,quizJson} from '@/lib/quizzes/server'
import {vocabularyFor} from '@/lib/vocab-scope-server'
export const GET=withRole(['teacher','admin'],async(req,ctx)=>{
 const courseId=req.nextUrl.searchParams.get('class')
 if(!courseId)return quizJson({sets:[],words:[],targets:[]})
 if(!(await quizCourses(ctx)).some(c=>c.id===courseId))return quizJson({error:'Not your class'},403)
 const {sets,words,targets}=await vocabularyFor(ctx,{courseId})
 return quizJson({sets,words,targets})
})
