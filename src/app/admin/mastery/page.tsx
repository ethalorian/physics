"use client"

import { useEffect, useState } from 'react'
import TeacherMasteryEntry, { RosterStudent } from '@/components/mastery/TeacherMasteryEntry'
import { LearningTarget } from '@/data/curriculum-types'

const UNIT_ID = 'unit-1'
const UNIT_NAME = 'Unit 1 — Motion & Forces (Asteroid 2026-XJ)'

export default function AdminMasteryPage() {
  const [targets, setTargets] = useState<LearningTarget[]>([])
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/mastery/dashboard?unit_id=${UNIT_ID}`).then((r) => r.json()),
      fetch('/api/mastery/roster').then((r) => r.json()),
    ])
      .then(([dashboard, roster]) => {
        if (!active) return
        if (dashboard?.error) throw new Error(dashboard.error)
        if (roster?.error) throw new Error(roster.error)
        setTargets(dashboard.targets ?? [])
        setStudents(roster.students ?? [])
        setLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Could not load')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4">
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-red-600">Could not load: {error}</p>}
      {!loading && !error && (
        <TeacherMasteryEntry unitName={UNIT_NAME} targets={targets} students={students} />
      )}
    </div>
  )
}
