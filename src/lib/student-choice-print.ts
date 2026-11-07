import printData from '@/data/student-choice-practice-print.json'
import { validateChoiceSelection } from './student-choice'

/** Public paper assets only: no assignment, student, grade or service credentials. */
export function renderChoicePracticePrint(packet: string, edition: string, options: number[]) {
  const data = printData as { pages: Record<string, string>; packets: Record<string, { head: string; paths: string[] }> }
  const key = packet + '@' + edition
  if (!Object.prototype.hasOwnProperty.call(data.packets, key)) return null
  const entry = data.packets[key]
  const { option_numbers } = validateChoiceSelection({ option_numbers: options, version: 0 }, options.length)
  return entry.head + option_numbers.map(n => data.pages[entry.paths[n - 1]]).join('\n') + '</doc-page></body></html>'
}
