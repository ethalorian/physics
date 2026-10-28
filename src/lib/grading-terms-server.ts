import 'server-only'
import { supabaseAdmin } from './supabase'
import { emptyGradingSettings, type GradingSettings } from './grading-terms'

export async function loadGradingSettings(courseId: string): Promise<GradingSettings> {
  const { data, error } = await supabaseAdmin.from('course_grading_settings').select('terms,placements,revision').eq('course_id', courseId).maybeSingle()
  if (error) throw error
  return data ?? emptyGradingSettings()
}
