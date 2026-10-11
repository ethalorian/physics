import { supabaseAdmin } from '@/lib/supabase'
export interface ReaderFlags { experience:'classic'|'stepped';gateCheckpoints:boolean;presentLive:boolean;lobbyLauncher:boolean }
export const DEFAULT_READER_FLAGS:ReaderFlags={experience:'stepped',gateCheckpoints:true,presentLive:true,lobbyLauncher:true}
export async function studentReaderFlags(userId:string):Promise<ReaderFlags>{
  const result=await supabaseAdmin.from('course_students').select('courses ( lesson_experience, gate_checkpoints, present_live_layer, lobby_launcher )').eq('student_id',userId)
  if(result.error)throw result.error
  type Course={lesson_experience:string|null;gate_checkpoints:boolean|null;present_live_layer:boolean|null;lobby_launcher:boolean|null}
  const courses=(result.data as {courses:Course|Course[]|null}[]??[]).flatMap(r=>Array.isArray(r.courses)?r.courses:r.courses?[r.courses]:[])
  const pick=courses.find(c=>c.lesson_experience==='stepped')??courses[0]
  return pick?{experience:pick.lesson_experience==='classic'?'classic':'stepped',gateCheckpoints:pick.gate_checkpoints??true,presentLive:pick.present_live_layer??true,lobbyLauncher:pick.lobby_launcher??true}:DEFAULT_READER_FLAGS
}
