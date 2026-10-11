import manifest from '@/data/daily-worksheets.json'

export type WorksheetTrack = 'cpa' | 'honors' | 'cpa-sei' | 'honors-sei'

export const worksheetLabels: Record<WorksheetTrack, string> = {
  cpa: 'CPA', honors: 'Honors', 'cpa-sei': 'CPA + SEI', 'honors-sei': 'Honors + SEI',
}

/** The manifest is the allowlist for public downloads and private answer keys. */
export function dailyWorksheet(unit: string, day: number) {
  if (!/^unit-[1-8]$/.test(unit) || !Number.isInteger(day)) return null
  return manifest.find(entry => `unit-${entry.unit}` === unit && entry.day === day) ?? null
}
