'use client'

import ChoiceCalendar from '@/components/choices/ChoiceCalendar'
import { useLearningResource } from '@/app/home/useLearningWeek'
import type { ChoiceSnapshot } from '@/lib/choice-calendar-server'
import s from './UnitPlanningWorkspace.module.css'

export default function ChoicePlanningWorkspace({ classId, classLabel, program, unitId }: { classId: string | null; classLabel: string | null; program: string | null; unitId: string }) {
  if (!classId) return <div className={s.empty}><h2>Choose a class</h2><p>Select a Physics class above to build its student choice menus.</p></div>
  if (!program) return <p role="status" className={s.empty}>Loading the selected class…</p>
  if (program !== 'physics') return <div className={s.empty}><h2>Student choice is available for Physics classes</h2><p>Select a Physics class above to build its menus.</p></div>
  return <ClassChoices key={classId} classId={classId} classLabel={classLabel} unitId={unitId} />
}

function ClassChoices({ classId, classLabel, unitId }: { classId: string; classLabel: string | null; unitId: string }) {
  const resource = useLearningResource<ChoiceSnapshot>('/api/choice-calendar?class=' + encodeURIComponent(classId))
  const data = resource.data?.staff && resource.data.courseId === classId ? resource.data : null
  return <div className={s.root}>
    <div className={s.heading}><div><p className={s.eyebrow}>CLASS CHOICE MENUS</p><h2>{classLabel ?? 'Selected Physics class'}</h2><p>Build a sequence of choices for this class. Students drag its activity cards from their home screen onto their calendar.</p><p>Browse the library or select from the unit sequence. Each activity counts as one choice unless you group it.</p></div></div>
    <ChoiceCalendar {...resource} data={data} error={resource.error || (!!resource.data && !data)} dates={[]} courseId={classId} unitId={unitId} />
  </div>
}
