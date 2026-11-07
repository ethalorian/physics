import activities from '../../../scripts/etf-student-packets/activities.json'
import type { ContentBlock, DataTableBlock, LabNotebookBlock, ObservationBlock } from '../content-blocks'
import { demand } from '@/lib/assessment-demand'
import meetings from './meetings.json'

type Meeting = typeof meetings[number]
type Activity = { ref: string; tables: [string[], string[][]][] }

/** The paper and online routes use the same meeting, table labels and drawing task. */
export function onlineWork(meeting: Meeting, stage: string): ContentBlock | null {
  const slug = `etf-book-${meeting.project}-${String(meeting.day).padStart(2, '0')}`
  const activity = (activities as unknown as Record<string, Activity>)[`${meeting.project}.${meeting.day}`]
  const buildingStart = meeting.project === 2 && meeting.day === 1
  const common = {
    id: `${slug}-${stage.toLowerCase()}-record`,
    capture: true as const,
    requiredForCompletion: false,
    targetId: `etfbook.p${meeting.project}.${meeting.strand}`,
    xp: 0,
  }
  if (stage === 'Brief') return {
    ...common, type: 'observation',
    workshop: { taskLabel: buildingStart ? 'A need in your neighborhood' : 'Identify the need' },
    patternPrompt: buildingStart ? 'Describe a local trip from a home to a business or service. What makes the trip easy or difficult?' : 'Who will use the design? What do they need it to do?',
    interpretPrompt: buildingStart ? 'What idea from Peter Park could improve that trip? Include the printed page number.' : 'Name one detail from the assigned reading that could help with this design. Include the printed page number.',
    demand: demand('Analyze', 2, 'Connect a documented user need with a specific idea from a source.'),
  } satisfies ObservationBlock
  if (stage === 'Measure' || (stage === 'Test' && !buildingStart)) {
    let table = activity?.tables[stage === 'Measure' ? 0 : 1]
    if (buildingStart) table = [['Walk', 'Distance for 10 steps (ft)', 'Average step length (ft/step)'], [['Trial 1'], ['Trial 2'], ['Trial 3'], ['Average']]]
    if (meeting.project === 4 && meeting.day === 1 && stage === 'Measure') table = [['Digit', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], Array.from({ length: 10 }, (_, i) => [String(i)])]
    if (!table) throw Error(`Missing online table for ${slug}, ${stage}`)
    return {
      ...common, type: 'data_table', columns: table[0], rows: table[1].length,
      rowLabels: table[1].map(row => row[0]), minRows: 1, plot: false, analysisMode: 'record',
      workshop: { taskLabel: stage === 'Measure' ? 'Your measurements' : 'Your test results' },
      demand: stage === 'Measure' ? demand('Apply', 2, 'Use the measurement procedure and keep units consistent across recorded quantities.') : demand('Analyze', 2, 'Compare measured outcomes under the stated test conditions.'),
    } satisfies DataTableBlock
  }
  if (stage === 'Plan') return {
    ...common, type: 'lab_notebook',
    workshop: { taskLabel: buildingStart ? 'Room survey and floor plan' : 'Your drawing and design choice' },
    instruction: buildingStart ? 'Draw a ground floor with housing access and a business or service. Label entrances and dimensions. Trace one trip between the two uses.' : meeting.plan + ' ' + (activity?.ref ?? ''),
    fields: buildingStart ? [
      'Average step length (ft/step)',
      'Room length and width in steps; convert each to feet',
      'Room area (ft²); show length × width',
      'Tape-check one dimension; compare with your estimate',
      'One success criterion and one constraint',
    ] : ['Dimensions, quantities or settings with units', 'My design choice and the reason for it'],
    demand: demand('Create', 3, 'Develop a design that addresses the measured need and justify a choice within the constraints.'),
  } satisfies LabNotebookBlock
  if (stage === 'Make') return {
    ...common, type: 'observation',
    workshop: { taskLabel: buildingStart ? 'Explain your first layout' : 'Your build record' },
    patternPrompt: buildingStart ? 'Which resident and service does your plan connect? Describe the route between the entrances.' : 'Describe what you made or observed. Include a dimension, setting or part you checked.',
    interpretPrompt: buildingStart ? 'Which feature responds to the local need you identified? Explain how.' : 'What differed from your plan? Explain the change or a quality check that helped you continue.',
    demand: demand('Apply', 2, 'Use the design in a physical task and document a specific check or adjustment.'),
  } satisfies ObservationBlock
  if (stage === 'Test' && buildingStart) return {
    ...common, type: 'observation', workshop: { taskLabel: 'Partner feedback and your revision' },
    patternPrompt: 'Ask a partner to follow your drawn route without hints. Where did they pause or find a barrier?',
    interpretPrompt: 'Describe the entrance or route you revised. Which criterion or constraint guided the change? Update your drawing in Plan & draw.',
    demand: demand('Evaluate', 3, 'Use an independent user test to justify a revision against a stated criterion.'),
  } satisfies ObservationBlock
  return null
}
