'use client'

import { useSession } from 'next-auth/react'
import { useAssignments } from '@/contexts/ConsolidatedAssignmentContext'
import { Clock, CheckCircle2, FileText } from 'lucide-react'

/**
 * Assignments & deadlines, relocated from the retired /dashboard (Surface 19)
 * into the home hub as one tokenized panel. Keeps the useful logic — due-soon
 * priorities, upcoming deadlines, average grade — and retires the apple-card
 * gradient skin. No per-assignment links: the old dashboard pointed at
 * /assignments/[id], a route that doesn't exist.
 *
 * Renders nothing when the class publishes no assignments, so classes that
 * run purely on lessons/mastery don't get an empty obligation box.
 */
export default function AssignmentsPanel() {
  const { assignments, submissions, getSubmissionByAssignmentId } = useAssignments()
  const { data: session } = useSession()

  const published = assignments.filter((a) => a.published)
  if (published.length === 0) return null

  const now = new Date()
  const days = (iso: string) => Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000)

  const unsubmitted = published.filter((a) => !getSubmissionByAssignmentId?.(a.id, session?.user?.id))
  const dueSoon = unsubmitted
    .filter((a) => a.due_date && days(a.due_date) >= 0 && days(a.due_date) <= 3)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
  const upcoming = unsubmitted
    .filter((a) => a.due_date && days(a.due_date) > 3 && days(a.due_date) <= 30)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  const graded = (submissions || []).filter((s) => s.score !== undefined)
  const avg = graded.length > 0
    ? Math.round(graded.reduce((sum, s) => sum + ((s.score || 0) / (s.max_score || 1)) * 100, 0) / graded.length)
    : null

  const dueLabel = (iso: string) => {
    const d = days(iso)
    return d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `${d} days left`
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'color-mix(in oklch, var(--card) 80%, transparent)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
        border: '1px solid color-mix(in oklch, var(--border) 75%, transparent)',
        padding: '18px 20px',
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <span className="text-sm font-semibold inline-flex items-center gap-1.5">
          <FileText size={15} style={{ color: 'var(--primary)' }} /> Assignments
        </span>
        {avg !== null && (
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Average grade: <b style={{ color: 'var(--foreground)' }}>{avg}%</b>
          </span>
        )}
      </div>

      {dueSoon.length === 0 && upcoming.length === 0 ? (
        <p className="text-sm inline-flex items-center gap-1.5 mt-1" style={{ color: 'var(--success)' }}>
          <CheckCircle2 size={15} /> All caught up — no deadlines in the next 30 days.
        </p>
      ) : (
        <div className="mt-1">
          {dueSoon.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: '1px solid color-mix(in oklch, var(--border) 60%, transparent)' }}>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{a.title}</div>
                <div className="text-xs font-medium inline-flex items-center gap-1" style={{ color: 'var(--reward-foreground)' }}>
                  <Clock size={11} /> {dueLabel(a.due_date!)}
                </div>
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                {new Date(a.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
          {upcoming.map((a, i) => (
            <div key={a.id} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: i < upcoming.length - 1 ? '1px solid color-mix(in oklch, var(--border) 60%, transparent)' : 'none' }}>
              <div className="text-sm truncate">{a.title}</div>
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                {new Date(a.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {dueLabel(a.due_date!)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
