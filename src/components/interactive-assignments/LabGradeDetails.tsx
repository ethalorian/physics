import {isDimensionRubric} from '@/lib/interactive-assignments/graded-assignment'
import { LAB_DIMENSIONS, labDimensionGrade } from '@/lib/interactive-assignments/lab-rubric'
import type { LabGrade } from '@/lib/interactive-assignments/lab-grades'

export default function LabGradeDetails({ grade }: { grade: Pick<LabGrade, 'rubric_version' | 'items'> }) {
  const result = isDimensionRubric(grade.rubric_version) ? labDimensionGrade(grade.items) : null
  return <details><summary>{result ? 'Four rubric scores and feedback' : 'Earlier points and feedback by question'}</summary>
    {result && <p>Lowest dimension: {result.lowest} / 4 → {result.percent}% · {result.letter}. The four scores are not averaged.</p>}
    {grade.items.map(item => <p key={item.id}><strong>{result ? LAB_DIMENSIONS.find(d => d.id === item.id)?.label : item.id}: {item.earned} / {item.possible}</strong>{item.feedback ? ' · ' + item.feedback : ''}</p>)}
  </details>
}
