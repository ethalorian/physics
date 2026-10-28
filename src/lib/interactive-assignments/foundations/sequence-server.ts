import 'server-only'
import {supabaseAdmin} from '@/lib/supabase'
export type MissingDailyLesson={quiz_id:string;id:string;title:string;role:'foundation'|'review'}
export type MissingReviewFoundation={assignment_id:string;id:string;title:string;role:'foundation'}
export async function missingReviewFoundations(ids:string[],user:string):Promise<MissingReviewFoundation[]> {
 if(!ids.length)return []
 const {data,error}=await supabaseAdmin.rpc('daily_review_missing',{p_reviews:ids,p_user:user})
 if(error)throw error
 return data??[]
}
export async function missingDailyLessons(ids:string[],user:string):Promise<MissingDailyLesson[]> {
 if(!ids.length)return []
 const {data,error}=await supabaseAdmin.rpc('daily_lesson_missing',{p_quizzes:ids,p_user:user})
 if(error)throw error
 return data??[]
}
