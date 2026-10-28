import { dailyWorksheet, type WorksheetTrack } from './daily-worksheets'

export function worksheetPlanKey(unit: string, day: number, edition: WorksheetTrack) {
  return `worksheet-template:${unit}:${day}:${edition}`
}

export function parseWorksheetPlanKey(key: string) {
  const match = /^worksheet-template:(unit-[1-8]):([1-9]\d?):(cpa|honors|cpa-sei|honors-sei)$/.exec(key)
  if (!match || !dailyWorksheet(match[1], Number(match[2]))) return null
  return { unit: match[1], day: Number(match[2]), edition: match[3] as WorksheetTrack }
}
