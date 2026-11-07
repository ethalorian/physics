import { Check, Clock3, Star } from 'lucide-react'
import { MASTERY_WORK_XP, type CalendarXpStatus } from '@/lib/assigned-mastery-xp'
import s from './AssignmentXpBadge.module.css'

const XP_BADGES = {
  available: { Icon: Star, label: 'available', detail: 'Submit this assignment to earn XP toward your unit floor.' },
  pending: { Icon: Clock3, label: 'pending', detail: 'You’ve submitted this assignment. Your XP credit is pending.' },
  earned: { Icon: Check, label: 'earned', detail: 'You already earned this XP. Revising won’t award it again.' },
} satisfies Record<CalendarXpStatus, { Icon: typeof Star; label: string; detail: string }>

export default function AssignmentXpBadge({ status, explain = false }: { status: CalendarXpStatus; explain?: boolean }) {
  const { Icon, label, detail } = XP_BADGES[status]
  return <><span className={s.xpBadge} data-xp={status} title={detail}><Icon size={13} aria-hidden="true"/>{MASTERY_WORK_XP} XP {label}</span>{explain && <p className={s.explanation}>{detail}</p>}</>
}
