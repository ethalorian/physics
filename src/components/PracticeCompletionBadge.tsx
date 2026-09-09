import { CheckCircle2, Circle, CircleAlert, MinusCircle } from 'lucide-react'

interface PracticeCompletionBadgeProps {
  state: 'done' | 'todo' | 'empty' | 'loading' | 'error'
  label: string
}

export default function PracticeCompletionBadge({ state, label }: PracticeCompletionBadgeProps) {
  const Icon = state === 'done' ? CheckCircle2 : state === 'error' ? CircleAlert : state === 'empty' ? MinusCircle : Circle
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${state === 'done' ? 'border-success/50 bg-success/15 text-foreground' : 'border-border bg-card text-muted-foreground'}`}>
      <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${state === 'done' ? 'text-success' : ''}`} />
      {label}
    </span>
  )
}
