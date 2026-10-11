import { isCatalogUnit } from '@/lib/retired-curriculum'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses, readingJson, readingRows } from '@/lib/textbook-assignments-server'

export const GET = withRole(['teacher', 'admin'], async (_req, ctx) => {
  const [courses, targets, units] = await Promise.all([
    readingCourses(ctx),
    readingRows((a, b) => supabaseAdmin.from('learning_targets').select('id,slug,statement,unit_id,domain,program').eq('exclude_from_growth', false).order('unit_id').order('order_index').order('id').range(a, b)),
    readingRows((a, b) => supabaseAdmin.from('units').select('id,name,program').order('order_index').order('id').range(a, b)),
  ])
  return readingJson({ courses: courses.map(({ id, name, section, program, track }) => ({ id, name, section, program, track })), targets, units: units.filter(isCatalogUnit), readOnly: ctx.viewingAsTeacher })
})
