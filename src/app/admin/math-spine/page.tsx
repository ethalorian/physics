'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import TeacherMathSpineEntry, { RosterStudent } from '@/components/math-spine/TeacherMathSpineEntry'
import { SpineCompetency } from '@/components/math-spine/MathSpineGrowth'

export default function AdminMathSpinePage() {
  const [competencies, setCompetencies] = useState<SpineCompetency[]>([])
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/math-spine/dashboard').then((r) => r.json()),
      fetch('/api/mastery/roster').then((r) => r.json()),
    ])
      .then(([dashboard, roster]) => {
        if (!active) return
        if (dashboard?.error) throw new Error(dashboard.error)
        if (roster?.error) throw new Error(roster.error)
        setCompetencies(dashboard.competencies ?? [])
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
      <div className="flex justify-end mb-3">
        <Link href="/admin/math-spine/bank">
          <Button variant="outline" size="sm" className="rounded-full">
            <BookOpen className="h-4 w-4 mr-1.5" /> Warm-Up Bank
          </Button>
        </Link>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-red-600">Could not load: {error}</p>}
      {!loading && !error && <TeacherMathSpineEntry competencies={competencies} students={students} />}
    </div>
  )
}
