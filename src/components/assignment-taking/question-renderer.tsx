"use client"
// Removed unused useState import
import { Question, MultipleChoiceQuestion, ShortAnswerQuestion, EssayQuestion, NumericalQuestion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Removed unused Button import
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface QuestionRendererProps {
  question: Question
  answer: string | number | string[]
  onAnswerChange: (answer: string | number | string[]) => void
  showFeedback?: boolean
  feedback?: string
  isCorrect?: boolean
  disabled?: boolean
}

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  showFeedback = false,
  feedback,
  isCorrect,
  disabled = false
}: QuestionRendererProps) {
  const renderInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        const mcQuestion = question as MultipleChoiceQuestion
        return (
          <div className="space-y-3">
            <RadioGroup
              value={answer?.toString() || ''}
              onValueChange={(value) => onAnswerChange(parseInt(value))}
              disabled={disabled}
            >
              {mcQuestion.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1">
                    {option}
                  </Label>
                  {showFeedback && mcQuestion.correctAnswer === index && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Correct
                    </Badge>
                  )}
                </div>
              ))}
            </RadioGroup>
            {showFeedback && mcQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Explanation:</p>
                <p className="text-sm text-blue-700 mt-1">{mcQuestion.explanation}</p>
              </div>
            )}
          </div>
        )

      case 'short-answer':
        const saQuestion = question as ShortAnswerQuestion
        return (
          <div className="space-y-2">
            <Textarea
              value={answer || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={3}
              maxLength={saQuestion.maxLength}
              disabled={disabled}
            />
            {saQuestion.maxLength && (
              <div className="text-xs text-muted-foreground text-right">
                {(answer as string || '').length} / {saQuestion.maxLength} characters
              </div>
            )}
          </div>
        )

      case 'essay':
        const essayQuestion = question as EssayQuestion
        return (
          <div className="space-y-2">
            <Textarea
              value={answer || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Write your essay here..."
              rows={8}
              disabled={disabled}
            />
            <div className="text-xs text-muted-foreground">
              Word count: {(answer as string || '').split(/\s+/).filter((word: string) => word.length > 0).length}
              {essayQuestion.minLength && ` (minimum: ${essayQuestion.minLength})`}
              {essayQuestion.maxLength && ` (maximum: ${essayQuestion.maxLength})`}
            </div>
            {essayQuestion.rubric && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800">Grading Rubric:</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{essayQuestion.rubric}</p>
              </div>
            )}
          </div>
        )

      case 'numerical':
        const numQuestion = question as NumericalQuestion
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                value={answer || ''}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Enter your answer"
                disabled={disabled}
              />
              {numQuestion.unit && (
                <div className="flex items-center px-3 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium">{numQuestion.unit}</span>
                </div>
              )}
            </div>
            {numQuestion.tolerance && (
              <p className="text-xs text-muted-foreground">
                Tolerance: ± {numQuestion.tolerance}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={`mb-6 ${showFeedback ? (isCorrect ? 'border-green-200' : 'border-red-200') : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {question.question}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{question.points} pts</Badge>
            {showFeedback && (
              <Badge variant={isCorrect ? 'default' : 'destructive'}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderInput()}
        
        {showFeedback && feedback && (
          <div className={`mt-4 p-4 rounded-lg ${
            isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              Feedback:
            </p>
            <p className={`text-sm mt-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {feedback}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

