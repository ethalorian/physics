export interface StudentClassIdentity {
  id: string
  name: string
  section: string | null
  track: string | null
  program: string | null
  teacher: string | null
}

export function classLevelLabel(track: string | null): string {
  const value = track?.trim().toLowerCase()
  const labels: Record<string, string> = { cpa: 'CPA', honors: 'Honors', ap: 'AP', pbl: 'Project-Based' }
  return value ? labels[value] ?? track!.trim() : 'Level not set'
}

export function classProgramLabel(program: string | null): string {
  const labels: Record<string, string> = { physics: 'Physics', trades: 'Trades Physics', projects: 'Project Physics' }
  return program ? labels[program] ?? program : 'Physics'
}
