"use client"
// Removed unused useState import
import { Question, QuestionType, MultipleChoiceQuestion, ShortAnswerQuestion, EssayQuestion, NumericalQuestion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'

interface QuestionEditorProps {
  question: Question
  onUpdate: (question: Question) => void
  onDelete: () => void
}

export default function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates } as Question)
  }

  const renderQuestionTypeEditor = () => {
    switch (question.type) {
      case 'multiple-choice':
        const mcQuestion = question as MultipleChoiceQuestion
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              {mcQuestion.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(mcQuestion.options || [])]
                      newOptions[index] = e.target.value
                      updateQuestion({ options: newOptions })
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuestion({ correctAnswer: index })}
                    className={mcQuestion.correctAnswer === index ? 'bg-green-100' : ''}
                  >
                    {mcQuestion.correctAnswer === index ? '✓' : 'Set Correct'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = mcQuestion.options.filter((_: string, i: number) => i !== index)
                      updateQuestion({ 
                        options: newOptions,
                        correctAnswer: mcQuestion.correctAnswer === index ? undefined : mcQuestion.correctAnswer
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(mcQuestion.options || []), '']
                  updateQuestion({ options: newOptions })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Explanation (optional)</label>
              <Textarea
                value={mcQuestion.explanation || ''}
                onChange={(e) => updateQuestion({ explanation: e.target.value })}
                placeholder="Explain why this answer is correct..."
                rows={3}
              />
            </div>
          </div>
        )

      case 'short-answer':
        const saQuestion = question as ShortAnswerQuestion
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Expected Answer (optional)</label>
              <Input
                value={saQuestion.expectedAnswer || ''}
                onChange={(e) => updateQuestion({ expectedAnswer: e.target.value })}
                placeholder="Sample correct answer..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Keywords (comma-separated)</label>
              <Input
                value={saQuestion.keywords?.join(', ') || ''}
                onChange={(e) => updateQuestion({ 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                })}
                placeholder="force, acceleration, Newton"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Length (characters)</label>
              <Input
                type="number"
                value={saQuestion.maxLength || ''}
                onChange={(e) => updateQuestion({ maxLength: parseInt(e.target.value) || undefined })}
                placeholder="500"
              />
            </div>
          </div>
        )

      case 'numerical':
        const numQuestion = question as NumericalQuestion
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Correct Value</label>
                <Input
                  type="number"
                  step="any"
                  value={numQuestion.correctValue || ''}
                  onChange={(e) => updateQuestion({ correctValue: parseFloat(e.target.value) || 0 })}
                  placeholder="9.8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tolerance (±)</label>
                <Input
                  type="number"
                  step="any"
                  value={numQuestion.tolerance || ''}
                  onChange={(e) => updateQuestion({ tolerance: parseFloat(e.target.value) || undefined })}
                  placeholder="0.1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <Input
                value={numQuestion.unit || ''}
                onChange={(e) => updateQuestion({ unit: e.target.value })}
                placeholder="m/s²"
              />
            </div>
          </div>
        )

      case 'essay':
        const essayQuestion = question as EssayQuestion
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rubric</label>
              <Textarea
                value={essayQuestion.rubric || ''}
                onChange={(e) => updateQuestion({ rubric: e.target.value })}
                placeholder="Describe what constitutes a good answer..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Length (words)</label>
                <Input
                  type="number"
                  value={essayQuestion.minLength || ''}
                  onChange={(e) => updateQuestion({ minLength: parseInt(e.target.value) || undefined })}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Length (words)</label>
                <Input
                  type="number"
                  value={essayQuestion.maxLength || ''}
                  onChange={(e) => updateQuestion({ maxLength: parseInt(e.target.value) || undefined })}
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Question</CardTitle>
            <Badge variant="secondary">{question.type.replace('-', ' ')}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Question Text</label>
          <Textarea
            value={question.question}
            onChange={(e) => updateQuestion({ question: e.target.value })}
            placeholder="Enter your question..."
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <Select
              value={question.type}
              onValueChange={(value: QuestionType) => updateQuestion({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
                <SelectItem value="numerical">Numerical</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Points</label>
            <Input
              type="number"
              value={question.points}
              onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
        </div>

        {renderQuestionTypeEditor()}
      </CardContent>
    </Card>
  )
}

