import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {vocabularyFor} from '@/lib/vocab-scope-server'
import {readingJson} from '@/lib/textbook-assignments-server'
export const GET=withAuth(async(_req,ctx)=>{
 const {sets}=await vocabularyFor(ctx)
 if(!sets.length)return readingJson({scope:null})
 const {data,error}=await supabaseAdmin.from('lesson_progress').select('lesson_id').eq('user_id',ctx.userId).order('created_at',{ascending:false}).limit(10)
 if(error)throw error
 const recent=(data??[]).map(p=>sets.find(s=>s.lesson_id===p.lesson_id)).find(Boolean)
 const selected=recent??sets.find(s=>s.lesson_id)??sets[0]
 if(selected.lesson_id)return readingJson({scope:'lesson',id:selected.lesson_id,label:selected.label})
 if(selected.unit_id)return readingJson({scope:'unit',id:selected.unit_id,label:selected.unit_name??selected.label})
 return readingJson({scope:null})
})
