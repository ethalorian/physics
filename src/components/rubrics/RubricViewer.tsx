'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'

export interface RubricCriterion {
  name: string
  weight: number
  levels: {
    A: string
    B: string
    C: string
    Fail: string
  }
}

export interface SimulationRubric {
  id: string
  simulation_id: string
  name: string
  description?: string
  grade_a_min: number
  grade_b_min: number
  grade_c_min: number
  criteria: Record<string, RubricCriterion>
  grade_descriptions: {
    A: { name: string; description: string }
    B: { name: string; description: string }
    C: { name: string; description: string }
    Fail: { name: string; description: string }
  }
}

interface RubricViewerProps {
  rubric: SimulationRubric
  highlightGrade?: 'A' | 'B' | 'C' | 'Fail'
  compact?: boolean
}

export function RubricViewer({ rubric, highlightGrade, compact = false }: RubricViewerProps) {
  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'B':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'C':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'Fail':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Fail':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Rubric Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{rubric.name}</span>
            <Badge variant="outline">Standards-Based</Badge>
          </CardTitle>
          {rubric.description && (
            <p className="text-sm text-muted-foreground">{rubric.description}</p>
          )}
        </CardHeader>
        {!compact && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {(['A', 'B', 'C', 'Fail'] as const).map((grade) => (
                <div
                  key={grade}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    highlightGrade === grade
                      ? `${getGradeBadgeColor(grade)} shadow-md scale-105`
                      : 'border-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getGradeIcon(grade)}
                    <span className="font-bold text-lg">{grade}</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">
                      {rubric.grade_descriptions[grade].name}
                    </div>
                    {grade !== 'Fail' ? (
                      <div className="text-muted-foreground">
                        {grade === 'A' && `≥${rubric.grade_a_min}%`}
                        {grade === 'B' && `${rubric.grade_b_min}%-${rubric.grade_a_min - 1}%`}
                        {grade === 'C' && `${rubric.grade_c_min}%-${rubric.grade_b_min - 1}%`}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        &lt;{rubric.grade_c_min}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Criteria Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Grading Criteria</h3>
        {Object.entries(rubric.criteria).map(([key, criterion]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{criterion.name}</span>
                <Badge variant="secondary">{criterion.weight} points</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['A', 'B', 'C', 'Fail'] as const).map((grade) => (
                  <div
                    key={grade}
                    className={`p-3 rounded-lg border ${
                      highlightGrade === grade
                        ? `${getGradeBadgeColor(grade)}`
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        {getGradeIcon(grade)}
                        <span className="font-bold">{grade}</span>
                      </div>
                      <p className="text-sm flex-1">{criterion.levels[grade]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
