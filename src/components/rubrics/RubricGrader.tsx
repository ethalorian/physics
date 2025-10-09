'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Save,
  Calculator
} from 'lucide-react'
import { SimulationRubric, RubricCriterion } from './RubricViewer'

interface RubricGraderProps {
  rubric: SimulationRubric
  initialScores?: Record<string, number>
  initialFeedback?: string
  onSave: (assessment: RubricAssessment) => void
  readOnly?: boolean
}

export interface RubricAssessment {
  criterion_scores: Record<string, number>
  total_score: number
  letter_grade: 'A' | 'B' | 'C' | 'Fail'
  feedback: string
  strengths: string[]
  improvements: string[]
}

export function RubricGrader({ rubric, initialScores, initialFeedback, onSave, readOnly = false }: RubricGraderProps) {
  const [scores, setScores] = useState<Record<string, number>>(initialScores || {})
  const [feedback, setFeedback] = useState(initialFeedback || '')
  const [totalScore, setTotalScore] = useState(0)
  const [letterGrade, setLetterGrade] = useState<'A' | 'B' | 'C' | 'Fail'>('Fail')

  // Calculate total score and letter grade whenever scores change
  useEffect(() => {
    calculateGrade()
  }, [scores])

  const calculateGrade = () => {
    const criteriaEntries = Object.entries(rubric.criteria)
    let weightedSum = 0
    let totalWeight = 0

    criteriaEntries.forEach(([key, criterion]) => {
      const score = scores[key] || 0
      weightedSum += score * criterion.weight
      totalWeight += criterion.weight
    })

    const total = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
    setTotalScore(total)

    // Determine letter grade
    if (total >= rubric.grade_a_min) {
      setLetterGrade('A')
    } else if (total >= rubric.grade_b_min) {
      setLetterGrade('B')
    } else if (total >= rubric.grade_c_min) {
      setLetterGrade('C')
    } else {
      setLetterGrade('Fail')
    }
  }

  const handleScoreChange = (criterion: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criterion]: value
    }))
  }

  const getGradeLevel = (score: number): 'A' | 'B' | 'C' | 'Fail' => {
    if (score >= 85) return 'A'
    if (score >= 70) return 'B'
    if (score >= 50) return 'C'
    return 'Fail'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100 border-green-300'
      case 'B': return 'text-blue-600 bg-blue-100 border-blue-300'
      case 'C': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
      case 'Fail': return 'text-red-600 bg-red-100 border-red-300'
      default: return ''
    }
  }

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A': return <CheckCircle className="h-6 w-6" />
      case 'B': return <TrendingUp className="h-6 w-6" />
      case 'C': return <AlertTriangle className="h-6 w-6" />
      case 'Fail': return <XCircle className="h-6 w-6" />
      default: return null
    }
  }

  const handleSave = () => {
    // Auto-generate strengths and improvements based on scores
    const strengths: string[] = []
    const improvements: string[] = []

    Object.entries(scores).forEach(([key, score]) => {
      const criterion = rubric.criteria[key]
      const level = getGradeLevel(score)
      
      if (level === 'A') {
        strengths.push(`Excellent ${criterion.name.toLowerCase()}`)
      } else if (level === 'Fail' || level === 'C') {
        improvements.push(`Work on ${criterion.name.toLowerCase()}`)
      }
    })

    const assessment: RubricAssessment = {
      criterion_scores: scores,
      total_score: totalScore,
      letter_grade: letterGrade,
      feedback,
      strengths: strengths.length > 0 ? strengths : ['Good effort overall'],
      improvements: improvements.length > 0 ? improvements : ['Keep up the good work']
    }

    onSave(assessment)
  }

  return (
    <div className="space-y-6">
      {/* Grade Summary Card */}
      <Card className={`border-2 ${getGradeColor(letterGrade)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {getGradeIcon(letterGrade)}
              <span>Overall Grade: {letterGrade}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalScore}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {rubric.grade_descriptions[letterGrade].description}
          </p>
        </CardContent>
      </Card>

      {/* Criterion Grading */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Grade Each Criterion</h3>
        {Object.entries(rubric.criteria).map(([key, criterion]) => {
          const score = scores[key] || 0
          const level = getGradeLevel(score)
          
          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{criterion.name}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{criterion.weight} pts</Badge>
                    <Badge className={getGradeColor(level)}>
                      {level}
                    </Badge>
                    <span className="font-mono text-lg font-bold min-w-[50px] text-right">
                      {score}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slider */}
                <div className="px-2">
                  <Slider
                    value={[score]}
                    onValueChange={([value]) => handleScoreChange(key, value)}
                    min={0}
                    max={100}
                    step={5}
                    disabled={readOnly}
                    className="my-4"
                  />
                </div>

                {/* Level Descriptions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {(['A', 'B', 'C', 'Fail'] as const).map((grade) => (
                    <div
                      key={grade}
                      className={`p-2 rounded border ${
                        level === grade
                          ? `${getGradeColor(grade)} border-2`
                          : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <div className="font-bold mb-1">{grade}</div>
                      <div className="text-muted-foreground line-clamp-3">
                        {criterion.levels[grade]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback for Student</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide specific feedback about strengths and areas for improvement..."
            rows={4}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Save Grade
          </Button>
        </div>
      )}
    </div>
  )
}
