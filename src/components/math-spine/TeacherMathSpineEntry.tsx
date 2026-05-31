'use client'

/**
 * TeacherMathSpineEntry — how math-literacy mastery gets into the system, and
 * where it gets celebrated.
 *
 * Pick a student, see the eleven competencies grouped by strand with the
 * student's current whole-year value, and tap Not yet / Almost / Got it (1/2/3).
 * Each tap POSTs an APPEND-ONLY observation to /api/math-spine/records. The API
 * returns any celebration MILESTONES that just unlocked (points into the existing
 * economy) and we surface them right here. A "Spotlight" button lets the teacher
 * hand-award recognition for a specific contribution.
 */
import { useState } from 'react'
import { MathCompetencyRecord, MathStrand, MarzanoLevel, DEFAULT_RECENCY_WEIGHT } from '@/data/curriculum-types'
import { STRAND_ORDER, STRAND_LABEL } from '@/lib/math-spine'
import {
  PALETTE,
  levelWord,
  levelColor,
  buildRecordsByCompetency,
  competencyValue,
} from './math-spine-display'
import type { SpineCompetency } from './MathSpineGrowth'

export interface RosterStudent {
  id: string
  name: string
  email?: string
}

interface AwardedGrant {
  milestone: string
  points: number
  note?: string
}

export interface TeacherMathSpineEntryProps {
  competencies: SpineCompetency[]
  students: RosterStudent[]
  initialRecords?: MathCompetencyRecord[]
  recencyWeight?: number
}

const LEVELS: { value: MarzanoLevel; label: string }[] = [
  { value: 1, label: 'Not yet' },
  { value: 2, label: 'Almost' },
  { value: 3, label: 'Got it' },
]

const EVIDENCE_OPTIONS = ['warm-up', 'retrieval check', 'embedded target', 'transfer task', 'lab', 'conversation']

const MILESTONE_LABEL: Record<string, string> = {
  'levelup-almost': 'reached "Almost"',
  'competency-fluent': 'became Fluent',
  'strand-complete': 'completed a whole strand',
  'spotlight': 'spotlighted',
}

export default function TeacherMathSpineEntry({
  competencies,
  students,
  initialRecords = [],
  recencyWeight = DEFAULT_RECENCY_WEIGHT,
}: TeacherMathSpineEntryProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [records, setRecords] = useState<MathCompetencyRecord[]>(initialRecords)
  const [evidence, setEvidence] = useState('warm-up')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<{ name: string; grants: AwardedGrant[] } | null>(null)
  const [spotlightNote, setSpotlightNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const student = students.find((s) => s.id === studentId)
  const studentRecords = records.filter((r) => r.studentId === studentId)
  const byCompetency = buildRecordsByCompetency(studentRecords)

  function celebrate(grants: AwardedGrant[]) {
    if (!grants || grants.length === 0) return
    setCelebration({ name: student?.name ?? 'Student', grants })
    setTimeout(() => setCelebration(null), 5000)
  }

  async function record(competency: SpineCompetency, level: MarzanoLevel) {
    if (!studentId) {
      setError('Pick a student first.')
      return
    }
    const key = `${competency.id}:${level}`
    setSavingKey(key)
    setError(null)
    try {
      const res = await fetch('/api/math-spine/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: studentId,
          user_email: student?.email ?? null,
          competency_id: competency.id,
          level,
          evidence_source: evidence,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Save failed (${res.status})`)
      }
      const data = await res.json()
      setRecords((prev) => [
        ...prev,
        {
          studentId,
          competencyId: competency.id,
          level,
          observedAt: data.record?.observed_at ?? new Date().toISOString(),
          evidenceSource: evidence,
        },
      ])
      celebrate(data.awarded ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingKey(null)
    }
  }

  async function spotlight() {
    if (!studentId) {
      setError('Pick a student first.')
      return
    }
    setError(null)
    try {
      const res = await fetch('/api/math-spine/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: studentId,
          user_email: student?.email ?? null,
          note: spotlightNote || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Spotlight failed (${res.status})`)
      }
      const data = await res.json()
      celebrate([data.awarded])
      setSpotlightNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Spotlight failed')
    }
  }

  return (
    <div style={{ background: '#FAF9FC', color: PALETTE.indigo }} className="rounded-xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-xl font-medium" style={{ color: PALETTE.indigo }}>
          Record math literacy
        </h2>
        <span className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          The quantitative spine · all year
        </span>
      </div>
      <p className="text-sm mb-4" style={{ color: PALETTE.indigoMuted }}>
        Each tap adds a new observation — it never overwrites. Reaching Almost, Fluent, or a whole strand
        earns points into the class economy automatically.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          Student
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="ml-2 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: '#fff' }}
          >
            {students.length === 0 && <option value="">No students</option>}
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          Evidence
          <select
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="ml-2 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: '#fff' }}
          >
            {EVIDENCE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      {celebration && (
        <div
          className="text-sm rounded-md px-3 py-2 mb-3"
          style={{ background: '#EEF4EF', color: '#3F6B4F', border: `1px solid ${PALETTE.sage}` }}
        >
          🎉 {celebration.name}{' '}
          {celebration.grants
            .map((g) => `${MILESTONE_LABEL[g.milestone] ?? g.milestone} (+${g.points} pts)`)
            .join(', ')}
          .
        </div>
      )}

      {error && (
        <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: '#FBEFEF', color: '#8A4A4A' }}>
          {error}
        </div>
      )}

      {STRAND_ORDER.map((strand: MathStrand) => {
        const comps = competencies.filter((c) => c.strand === strand)
        if (comps.length === 0) return null
        return (
          <div key={strand} className="mb-3">
            <p className="text-sm font-medium mt-3 mb-1" style={{ color: '#4A4470' }}>
              {STRAND_LABEL[strand]}
            </p>
            <div className="rounded-lg border bg-white px-4" style={{ borderColor: PALETTE.hairline }}>
              {comps.map((c, i) => {
                const recs = byCompetency.get(c.id)
                const value = competencyValue(recs, recencyWeight)
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                    style={{ borderTop: i === 0 ? 'none' : '0.5px solid #EEEBF5' }}
                  >
                    <span
                      className="text-[11px] font-medium rounded px-2 py-0.5 tabular-nums"
                      style={{ background: '#EEEBF6', color: '#4A4470' }}
                    >
                      {c.code}
                    </span>
                    <span className="flex-1 min-w-[12rem] text-[13px] leading-snug">{c.statement}</span>
                    <span
                      className="text-[13px] font-medium tabular-nums"
                      style={{ color: value === null ? PALETTE.indigoMuted : levelColor(value), minWidth: 70, textAlign: 'right' }}
                    >
                      {value === null ? '—' : `${value.toFixed(1)} ${levelWord(value)}`}
                    </span>
                    <span className="inline-flex gap-1.5">
                      {LEVELS.map((lv) => {
                        const key = `${c.id}:${lv.value}`
                        const saving = savingKey === key
                        return (
                          <button
                            key={lv.value}
                            onClick={() => record(c, lv.value)}
                            disabled={saving || !studentId}
                            className="text-xs rounded-md border px-2.5 py-1 transition-colors disabled:opacity-50"
                            style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: '#fff' }}
                            title={`Record "${lv.label}" (${lv.value})`}
                          >
                            {saving ? '…' : lv.label}
                          </button>
                        )
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Spotlight — teacher-awarded recognition */}
      <div className="rounded-lg border p-4 mt-2" style={{ background: '#F4F2FA', borderColor: PALETTE.hairline }}>
        <div className="text-sm font-medium mb-2" style={{ color: '#4A4470' }}>
          Spotlight a contribution
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={spotlightNote}
            onChange={(e) => setSpotlightNote(e.target.value)}
            placeholder="e.g. caught a units error nobody else saw"
            className="flex-1 min-w-[14rem] rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: '#fff' }}
          />
          <button
            onClick={spotlight}
            disabled={!studentId}
            className="text-sm rounded-md border px-3 py-1 transition-colors disabled:opacity-50"
            style={{ borderColor: PALETTE.sage, color: '#3F6B4F', background: '#EEF4EF' }}
          >
            ★ Spotlight
          </button>
        </div>
      </div>
    </div>
  )
}
