import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { touchStaffPresence } from '@/lib/presence'

// Derived notification feed. Rather than insert a row at every event source, we
// query recent events (mastery ratings, grades, math points, duel challenges,
// due assignments) and compare each to the student's `notification_reads.seen_at`.
// Opening the bell (POST) advances seen_at, clearing the unread badge.

interface Notif {
  id: string
  type: 'mastery' | 'grade' | 'math' | 'duel' | 'due' | 'part' | 'access'
  title: string
  detail: string
  at: string        // ISO — drives sort + unread
  href: string
  unread: boolean
}

const LEVEL_WORD = (l: number) => (l >= 2.5 ? 'Got it' : l >= 1.5 ? 'Almost' : 'Not yet')

export const GET = withAuth(async (_req, ctx) => {
  const me = ctx.userId
  const items: Notif[] = []

  // Presence heartbeat: this endpoint is polled every 60s by the navbar bell on
  // every staff page, so it doubles as the "still online" signal for staff.
  if (ctx.realRole === 'admin' || ctx.realRole === 'teacher') {
    try { await touchStaffPresence(ctx.email) } catch { /* ignore */ }
  }

  // last-seen baseline (default: 3 days ago so a new student sees recent activity)
  const { data: readRow } = await supabaseAdmin.from('notification_reads').select('seen_at').eq('user_id', me).maybeSingle()
  const seenAt = readRow?.seen_at ? new Date(readRow.seen_at) : new Date(Date.now() - 3 * 86400000)
  const isUnread = (iso: string | null) => !!iso && new Date(iso) > seenAt

  // student email for the assignment tables (they key by email)
  let email: string | null = null
  try {
    const { data: s } = await supabaseAdmin.from('students').select('email').eq('google_user_id', me).maybeSingle()
    email = s?.email ?? null
  } catch { /* ignore */ }

  // 1. Mastery ratings
  try {
    const { data } = await supabaseAdmin.from('mastery_records').select('id, level, observed_at').eq('user_id', me).order('observed_at', { ascending: false }).limit(8)
    for (const r of (data ?? []) as { id: string; level: number; observed_at: string }[]) {
      items.push({ id: `mastery:${r.id}`, type: 'mastery', title: 'New mastery rating', detail: LEVEL_WORD(r.level), at: r.observed_at, href: '/dashboard/growth', unread: isUnread(r.observed_at) })
    }
  } catch { /* ignore */ }

  // 2. Grades (graded submissions)
  try {
    const { data } = await supabaseAdmin.from('submissions').select('id, score, max_score, graded_at').eq('user_id', me).eq('status', 'graded').order('graded_at', { ascending: false }).limit(8)
    for (const r of (data ?? []) as { id: string; score: number | null; max_score: number | null; graded_at: string | null }[]) {
      if (!r.graded_at) continue
      items.push({ id: `grade:${r.id}`, type: 'grade', title: 'Assignment graded', detail: r.max_score ? `${r.score ?? 0} / ${r.max_score}` : `${r.score ?? 0} pts`, at: r.graded_at, href: '/dashboard', unread: isUnread(r.graded_at) })
    }
  } catch { /* ignore */ }

  // 3. Math points
  try {
    const { data } = await supabaseAdmin.from('math_spine_point_grants').select('id, points, note, awarded_at').eq('user_id', me).order('awarded_at', { ascending: false }).limit(8)
    for (const r of (data ?? []) as { id: string; points: number; note: string | null; awarded_at: string }[]) {
      items.push({ id: `math:${r.id}`, type: 'math', title: 'Math points earned', detail: r.note ? `+${r.points} · ${r.note}` : `+${r.points}`, at: r.awarded_at, href: '/dashboard/math-spine', unread: isUnread(r.awarded_at) })
    }
  } catch { /* ignore */ }

  // 4. Duel challenges (incoming, pending)
  try {
    const { data } = await supabaseAdmin.from('challenges').select('id, challenger_user_id, created_at').eq('opponent_user_id', me).eq('status', 'pending').order('created_at', { ascending: false }).limit(8)
    const rows = (data ?? []) as { id: string; challenger_user_id: string; created_at: string }[]
    if (rows.length) {
      const ids = rows.map((r) => r.challenger_user_id)
      const { data: studs } = await supabaseAdmin.from('students').select('google_user_id, alias, name').in('google_user_id', ids)
      const nameBy = new Map<string, string>()
      for (const s of (studs ?? []) as { google_user_id: string | null; alias: string | null; name: string | null }[]) if (s.google_user_id) nameBy.set(s.google_user_id, s.alias || s.name || 'A classmate')
      for (const r of rows) {
        items.push({ id: `duel:${r.id}`, type: 'duel', title: 'Duel challenge', detail: `${nameBy.get(r.challenger_user_id) ?? 'A classmate'} challenged you`, at: r.created_at, href: '/leaderboard', unread: isUnread(r.created_at) })
      }
    }
  } catch { /* ignore */ }

  // 5. Car parts earned (Unit-8 grant-type rewards). Created PENDING when the build
  //    lesson is passed; the teacher releases the physical part from the admin queue.
  try {
    const { data } = await supabaseAdmin
      .from('reward_redemptions')
      .select('id, reward_name, status, created_at, reward:rewards(grant_lesson_id, category)')
      .eq('user_id', me)
      .neq('status', 'denied')
      .order('created_at', { ascending: false })
      .limit(8)
    type RInfo = { grant_lesson_id: string | null; category: string | null }
    for (const r of (data ?? []) as { id: string; reward_name: string; status: string; created_at: string; reward: RInfo | RInfo[] | null }[]) {
      const rw = Array.isArray(r.reward) ? r.reward[0] : r.reward
      if (!rw || !(rw.grant_lesson_id || rw.category === 'Car Part')) continue
      const released = r.status === 'fulfilled'
      items.push({
        id: `part:${r.id}`, type: 'part', title: 'Car part earned!',
        detail: `${r.reward_name} — ${released ? 'released by your teacher' : 'ask your teacher for it in class'}`,
        at: r.created_at, href: '/store', unread: isUnread(r.created_at),
      })
    }
  } catch { /* ignore */ }

  // 6. Due soon (assignments not finished, due within 3 days). Becomes "unread"
  //    when it enters the 2-day window — so it nags until the bell is opened.
  if (email) {
    try {
      const { data } = await supabaseAdmin
        .from('student_assignment_progress')
        .select('id, status, assignment:unified_assignments(title, due_date, published)')
        .eq('student_email', email)
        .in('status', ['not_started', 'in_progress', 'assigned'])
        .limit(30)
      const now = Date.now()
      type AInfo = { title: string | null; due_date: string | null; published: boolean | null }
      for (const r of (data ?? []) as { id: string; status: string; assignment: AInfo | AInfo[] | null }[]) {
        const a = Array.isArray(r.assignment) ? r.assignment[0] : r.assignment
        if (!a?.due_date || a.published === false) continue
        const due = new Date(a.due_date).getTime()
        if (due < now || due - now > 3 * 86400000) continue // only the next 3 days
        const soonThreshold = new Date(due - 2 * 86400000).toISOString()
        const days = Math.max(0, Math.round((due - now) / 86400000))
        items.push({
          id: `due:${r.id}`, type: 'due', title: 'Due soon', detail: `${a.title ?? 'Assignment'} · due ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`,
          at: a.due_date, href: '/dashboard', unread: now >= new Date(soonThreshold).getTime() && isUnread(soonThreshold),
        })
      }
    } catch { /* ignore */ }
  }

  // 7. Teacher access requests (ADMIN only) — a colleague tried to sign in and is
  //    waiting for approval. Links to the oversight page where you approve them.
  if (ctx.realRole === 'admin') {
    try {
      const { data } = await supabaseAdmin
        .from('teacher_access_requests')
        .select('email, name, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)
      for (const r of (data ?? []) as { email: string; name: string | null; created_at: string }[]) {
        items.push({
          id: `access:${r.email}`, type: 'access', title: 'Teacher access request',
          detail: `${r.name || r.email} is waiting for approval`,
          at: r.created_at, href: '/admin/oversight', unread: isUnread(r.created_at),
        })
      }
    } catch { /* ignore */ }
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const top = items.slice(0, 20)
  return NextResponse.json({ items: top, unread: top.filter((i) => i.unread).length })
})

export const POST = withAuth(async (_req, ctx) => {
  await supabaseAdmin.from('notification_reads').upsert(
    { user_id: ctx.userId, seen_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  return NextResponse.json({ ok: true })
})
