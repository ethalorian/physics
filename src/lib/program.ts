import { supabaseAdmin } from '@/lib/supabase'

// Which CURRICULUM a class follows. Distinct from `track` (cpa/honors = level
// gate on physics content): `program` picks the units, learning targets and
// lessons a class sees at all. Physics is the asteroid year; trades is the
// fieldhouse curriculum. Lives on courses.program; units/learning_targets
// carry the same key.

// projects = Project Physics: the MVP CPA section re-sequenced around builds
// (see claude/MVP-CPA-Physics-Project-Year-Map.md). Same level as CPA physics,
// its own units/targets/lessons, counts meetings like physics.
export type Program = 'physics' | 'trades' | 'projects'
export const PROGRAMS: Program[] = ['physics', 'trades', 'projects']
export function asProgram(p: string | null | undefined): Program { return p === 'trades' ? 'trades' : p === 'projects' ? 'projects' : 'physics' }

export const PROGRAM_LABEL: Record<Program, string> = { physics: 'Physics', trades: 'Trades Physics', projects: 'Project Physics' }

// A student's program: trades if ANY enrolled course is trades, else projects
// if any is projects, else physics. (A student in two would be unusual; the
// non-default program wins so that class isn't silently shown the asteroid
// curriculum.)
export async function getStudentProgram(userId: string): Promise<Program> {
  if (!userId) return 'physics'
  const { data } = await supabaseAdmin
    .from('course_students')
    .select('courses ( program )')
    .eq('student_id', userId)
  const programs = ((data ?? []) as Array<{ courses: { program: string | null } | { program: string | null }[] | null }>)
    .flatMap((r) => (Array.isArray(r.courses) ? r.courses : r.courses ? [r.courses] : []))
    .map((c) => asProgram(c.program))
  return programs.includes('trades') ? 'trades' : programs.includes('projects') ? 'projects' : 'physics'
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
