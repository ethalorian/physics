import { supabaseAdmin } from '@/lib/supabase'

// Which CURRICULUM a class follows. Distinct from `track` (cpa/honors = level
// gate on physics content): `program` picks the units, learning targets and
// lessons a class sees at all. Physics is the asteroid year; trades is the
// fieldhouse curriculum. Lives on courses.program; units/learning_targets
// carry the same key.

export type Program = 'physics' | 'trades'
export const PROGRAMS: Program[] = ['physics', 'trades']
export function asProgram(p: string | null | undefined): Program { return p === 'trades' ? 'trades' : 'physics' }

export const PROGRAM_LABEL: Record<Program, string> = { physics: 'Physics', trades: 'Trades Physics' }

// A student's program: trades if ANY enrolled course is trades, else physics.
// (A student in both would be unusual; trades wins so the trades class isn't
// silently shown the asteroid curriculum.)
export async function getStudentProgram(userId: string): Promise<Program> {
  if (!userId) return 'physics'
  const { data } = await supabaseAdmin
    .from('course_students')
    .select('courses ( program )')
    .eq('student_id', userId)
  const programs = ((data ?? []) as Array<{ courses: { program: string | null } | { program: string | null }[] | null }>)
    .flatMap((r) => (Array.isArray(r.courses) ? r.courses : r.courses ? [r.courses] : []))
    .map((c) => asProgram(c.program))
  return programs.includes('trades') ? 'trades' : 'physics'
}

// The unit ids that belong to a program — the key every lesson/target query
// filters on. Lessons link by lessons.unit_id.
export async function getProgramUnitIds(program: Program): Promise<string[]> {
  const { data } = await supabaseAdmin.from('units').select('id').eq('program', program)
  return ((data ?? []) as { id: string }[]).map((u) => u.id)
}

// unit id → program, for tagging rows that carry a unit_id.
export async function getUnitProgramMap(): Promise<Map<string, Program>> {
  const { data } = await supabaseAdmin.from('units').select('id, program')
  return new Map(((data ?? []) as { id: string; program: string | null }[]).map((u) => [u.id, asProgram(u.program)]))
}
