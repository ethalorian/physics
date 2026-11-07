import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { MASTERY_WORK_XP, type MasteryXpReport } from './assigned-mastery-xp'
import type { ReadingXpStatus } from './xp-policy'

/** Only call after verifying class/assignment access. Historical deposits are never clawed back. */
export async function assignmentXpReceipt(kind:'reading'|'vocabulary', id:string, user:string, course:string, physics:boolean, legacyAmount:number):Promise<ReadingXpStatus> {
  const prefix=kind==='reading'?'reading-assignment':'vocab-assignment'
  const [old,report,saved] = await Promise.all([
    supabaseAdmin.from('economy_point_grants').select('points,awarded_at').eq('user_id',user).eq('dedupe_key',prefix+':'+id+':'+user).maybeSingle(),
    physics ? supabaseAdmin.rpc('student_mastery_xp',{p_course:course,p_user:user}) : null,
    physics ? supabaseAdmin.from('mastery_xp_receipts').select('earned_at,wallet_added').eq('course_id',course).eq('user_id',user).eq('work_key',kind+':'+id).maybeSingle() : null,
  ])
  if(old.error || report?.error || saved?.error) return {earned:null,available:0,awardedAt:null}
  const eligible=(report?.data as MasteryXpReport | undefined)?.items.some(i=>i.key===kind+':'+id)
  return {earned:(saved?.data?.wallet_added??0)+(old.data?.points??0),available:physics && report?.data?.enabled?(eligible?MASTERY_WORK_XP:0):legacyAmount,awardedAt:saved?.data?.earned_at??old.data?.awarded_at??null}
}
