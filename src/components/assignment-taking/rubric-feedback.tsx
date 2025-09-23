"use client"
import { OpenResponseGrade, RubricCriterion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Bot, User } from 'lucide-react'

interface RubricFeedbackProps {
  grade: OpenResponseGrade
  rubric: RubricCriterion[]
  showDetails?: boolean
}

export default function RubricFeedback({ grade, rubric, showDetails = true }: RubricFeedbackProps) {
  const maxTotalScore = rubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0)
  const scorePercentage = maxTotalScore > 0 ? (grade.totalScore / maxTotalScore) * 100 : 0

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700'
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700'
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700'
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700'
  }

  const getOverallScoreColor = () => {
    if (scorePercentage >= 90) return 'text-green-600 dark:text-green-300'
    if (scorePercentage >= 80) return 'text-blue-600 dark:text-blue-300'
    if (scorePercentage >= 70) return 'text-yellow-600 dark:text-yellow-300'
    if (scorePercentage >= 60) return 'text-orange-600 dark:text-orange-300'
    return 'text-red-600 dark:text-red-300'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Grading Results</CardTitle>
          <div className="flex items-center gap-2">
            {grade.aiGenerated && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                AI Graded
              </Badge>
            )}
            <Badge variant="outline" className={getOverallScoreColor()}>
              {grade.totalScore} / {maxTotalScore} points
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={scorePercentage} className="flex-1" />
          <span className={`text-sm font-medium ${getOverallScoreColor()}`}>
            {Math.round(scorePercentage)}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Feedback */}
        {grade.overallFeedback && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Overall Feedback</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{grade.overallFeedback}</p>
          </div>
        )}

        {/* Detailed Criterion Scores */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Detailed Breakdown</h4>
            {grade.rubricScores.map((score) => {
              const criterion = rubric.find(c => c.id === score.criterionId)
              if (!criterion) return null

              const percentage = criterion.maxPoints > 0 ? (score.score / criterion.maxPoints) * 100 : 0
              const colorClass = getScoreColor(score.score, criterion.maxPoints)

              return (
                <div key={score.criterionId} className={`p-3 rounded-lg border ${colorClass}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{criterion.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {score.score} / {criterion.maxPoints} pts
                      </Badge>
                      <span className="text-xs font-medium">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <Progress value={percentage} className="h-1" />
                  </div>

                  <div className="text-xs text-gray-600 mb-2">
                    <strong>Criterion:</strong> {criterion.description}
                  </div>

                  {score.feedback && (
                    <div className="text-xs">
                      <strong>Feedback:</strong> {score.feedback}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Scoring Levels Reference */}
        {showDetails && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Scoring Reference</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rubric.map((criterion) => (
                <div key={criterion.id} className="text-xs">
                  <div className="font-medium text-blue-800 mb-1">
                    {criterion.name} ({criterion.maxPoints} pts)
                  </div>
                  <div className="space-y-1">
                    {criterion.levels
                      .sort((a, b) => b.score - a.score)
                      .map((level, index) => (
                      <div key={index} className="flex justify-between text-blue-700">
                        <span>{level.description}</span>
                        <span className="font-medium">{level.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Review Notice */}
        {!grade.aiGenerated && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Manual Review Required</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              This response requires manual grading by an instructor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
