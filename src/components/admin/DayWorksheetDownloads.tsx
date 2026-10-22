import { Download, FileText, KeyRound } from 'lucide-react'
import { dailyWorksheet, worksheetLabels, type WorksheetTrack } from '@/lib/daily-worksheets'
import { coursePlanAssessment } from '@/lib/course-plan-assessment'

export default function DayWorksheetDownloads({ unit, day, track }: { unit: string; day: number; track: string }) {
  if (coursePlanAssessment(unit, day)) return (
    <section id="student-worksheets" aria-label="Transfer assessment materials" className="mb-4 scroll-mt-28 rounded-xl border bg-card p-4">
      <h3 className="font-semibold">Transfer assessment</h3>
      <p className="mt-1 text-sm text-muted-foreground">Use the assigned task, permitted references, and the four-dimension rubric in this plan. Present opens assessment directions. Save guided practice and worked solutions for preparation or feedback.</p>
    </section>
  )
  const worksheet = dailyWorksheet(unit, day)
  if (!worksheet) return null
  const editions: WorksheetTrack[] = track === 'honors' ? ['honors', 'honors-sei', 'cpa', 'cpa-sei'] : ['cpa', 'cpa-sei', 'honors', 'honors-sei']
  return (
    <section id="student-worksheets" aria-label={`Day ${day} student worksheets`} className="mb-4 scroll-mt-28 rounded-xl border bg-muted/30 p-4">
      <h3 className="font-semibold">Day {day} student worksheets</h3>
      <p className="mt-1 text-sm text-muted-foreground">{worksheet.title}. Learning target, success criteria, visual practice and a 1–3 self-check for every problem.</p>
      <p className="mt-1 text-sm text-muted-foreground">Choose a standard worksheet or a separate SEI edition with English word help, chunked directions and sentence starters.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {editions.map(edition => {
          const file = worksheet.files[edition]
          const label = worksheetLabels[edition]
          const isSei = edition.endsWith('-sei')
          const classTrack = isSei ? edition.slice(0, -4) : edition
          return (
            <div key={edition} className="rounded-lg border bg-card p-3">
              <p className="text-sm font-semibold">{label}{track === classTrack && <span className="ml-2 text-xs font-normal text-muted-foreground">Class edition</span>}</p>
              <p className="mt-1 text-xs text-muted-foreground">{isSei ? 'Same physics with English language supports' : edition === 'cpa' ? 'Guided steps and conceptual practice' : 'Independent calculations and explanation'} · {file.pages} {file.pages === 1 ? 'page' : 'pages'}</p>
              <div className="mt-2 flex flex-wrap gap-x-4">
                <a href={file.path} download={`${unit}-day-${String(day).padStart(2, '0')}-${edition}.pdf`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline" aria-label={`Download ${label} Day ${day} worksheet PDF`}><Download size={15} aria-hidden="true" />Download PDF</a>
                <a href={file.path} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm underline" aria-label={`View or print ${label} Day ${day} worksheet`}><FileText size={15} aria-hidden="true" />View / print</a>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 text-sm">
        <a className="inline-flex min-h-11 items-center gap-1.5 underline" href={`/api/teacher/worksheets/${unit}/${day}/key`} target="_blank" rel="noopener noreferrer"><KeyRound size={15} aria-hidden="true" />Teacher key · all editions</a>
        <a className="inline-flex min-h-11 items-center underline" href={`/worksheets/${unit}/index.html`} target="_blank" rel="noopener noreferrer">All worksheet days in this unit</a>
      </div>
      <p className="text-xs text-muted-foreground">SEI editions keep their CPA or Honors problem numbers and answers. The same teacher key applies.</p>
    </section>
  )
}
