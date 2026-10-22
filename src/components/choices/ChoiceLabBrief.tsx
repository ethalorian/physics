import type { ChoiceOption } from '@/lib/choice-calendar'

export default function ChoiceLabBrief({ option, teacher = false }: { option?: ChoiceOption; teacher?: boolean }) {
  if (!option?.lab || option.labType !== 'problem-solving') return null
  return <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Problem-solving lab">
    <h4 className="font-semibold">Problem-solving lab</h4>
    <p className="text-sm text-muted-foreground">{teacher ? 'Listen to each student’s reasoning as the group works. Mark lab work complete after the session.' : 'Work together. Show your steps. Explain your thinking.'}</p>
    <p className="whitespace-pre-wrap break-words">{option.problem}</p>
  </section>
}
