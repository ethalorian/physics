"use client"
import { useState } from 'react'
import { Question, QuestionType, MultipleChoiceQuestion, EssayQuestion, NumericalQuestion, OpenResponseQuestion, VocabularyMatchingQuestion, VocabularyCrosswordQuestion, VocabularyFillBlankQuestion, VocabularyHangmanQuestion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Wand2, RefreshCw, Image as ImageIcon, Calculator, BookPlus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import RubricBuilder from './rubric-builder'
import { calculatePhysicsSolution, generateIncorrectUnits } from '@/utils/physics-calculator'
import dynamic from 'next/dynamic'

const AddToQuestionBankModal = dynamic(() => import('@/components/question-bank/AddToQuestionBankModal'), {
  ssr: false
})

const VocabularyQuestionEditor = dynamic(() => import('./VocabularyQuestionEditor'), {
  ssr: false
})

interface QuestionEditorProps {
  question: Question
  onUpdate: (question: Question) => void
  onDelete: () => void
}

export default function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [unitOptions, setUnitOptions] = useState<string[]>([])
  const [showAddToBank, setShowAddToBank] = useState(false)
  const [optionExplanations, setOptionExplanations] = useState<string[]>([])
  const [showMisconceptions, setShowMisconceptions] = useState(false)

  // Handle vocabulary questions with specialized editor
  if (question.type === 'vocabulary-matching' || question.type === 'vocabulary-crossword' || question.type === 'vocabulary-fill-blank' || question.type === 'vocabulary-hangman') {
    return (
      <VocabularyQuestionEditor 
        question={question as VocabularyMatchingQuestion | VocabularyCrosswordQuestion | VocabularyFillBlankQuestion | VocabularyHangmanQuestion}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    )
  }
  
  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates } as Question)
  }

  const handleGenerateOptions = async () => {
    if (!question.question) {
      alert('Please enter a question first')
      return
    }

    setIsGeneratingOptions(true)
    try {
      const response = await fetch('/api/generate-mc-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.question,
          topic: (question as any).topic
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 408 || errorData.timeout) {
          throw new Error('Request timed out')
        }
        throw new Error(errorData.details || errorData.error || 'Failed to generate options')
      }

      const data = await response.json()
      
      if (data.options && data.correctIndex !== undefined) {
        updateQuestion({
          options: data.options,
          correctAnswer: data.correctIndex,
          explanation: data.detailedExplanation || data.concept
        } as Partial<MultipleChoiceQuestion>)
        
        // Store the explanations/misconceptions for display
        if (data.explanations) {
          setOptionExplanations(data.explanations)
          setShowMisconceptions(true)
        }
      }
    } catch (error) {
      console.error('Error generating options:', error)
      
      // Try to get more specific error information
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          alert('The AI service timed out. Please try again with a simpler question or wait a moment and try again.')
        } else {
          alert(`Failed to generate options: ${error.message}. Please try again.`)
        }
      } else {
        alert('Failed to generate options. Please try again.')
      }
    } finally {
      setIsGeneratingOptions(false)
    }
  }

  const handleAutoCalculate = () => {
    if (!question.question) {
      alert('Please enter a question first')
      return
    }

    setIsCalculating(true)
    try {
      // Try to calculate the answer
      const solution = calculatePhysicsSolution(question.question)
      
      if (solution) {
        // Generate incorrect unit options
        const incorrectUnits = generateIncorrectUnits(solution.unit)
        const allUnits = [solution.unit, ...incorrectUnits.slice(0, 3)]
        // Shuffle the units
        const shuffledUnits = allUnits.sort(() => Math.random() - 0.5)
        
        updateQuestion({ 
          correctValue: solution.value,
          unit: solution.unit,
          unitOptions: shuffledUnits
        } as Partial<NumericalQuestion>)
        
        setUnitOptions(shuffledUnits)
      } else {
        alert('Unable to auto-calculate for this question. Please enter the answer manually.')
      }
    } catch (error) {
      console.error('Error calculating:', error)
      alert('Error during calculation. Please check the question format.')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!question.question) {
      alert('Please enter a question first')
      return
    }

    setIsGeneratingImage(true)
    try {
      const response = await fetch('/api/generate-scenario-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.question,
          questionType: question.type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      if (data.imageUrl) {
        updateQuestion({ scenarioImage: data.imageUrl })
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const renderQuestionTypeEditor = () => {
    switch (question.type) {
      case 'multiple-choice':
        const mcQuestion = question as MultipleChoiceQuestion
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Options</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateOptions}
                    disabled={isGeneratingOptions || !question.question}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200"
                  >
                    {isGeneratingOptions ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin text-purple-600" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2 text-purple-600" />
                    )}
                    {isGeneratingOptions ? 'Generating...' : 'AI Generate Options'}
                  </Button>
                </div>
              </div>
              {mcQuestion.options?.map((option: string, index: number) => (
                <div key={index} className="space-y-2 mb-3 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(mcQuestion.options || [])]
                        newOptions[index] = e.target.value
                        updateQuestion({ options: newOptions })
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuestion({ correctAnswer: index })}
                      className={mcQuestion.correctAnswer === index ? 'bg-green-100 border-green-300' : ''}
                    >
                      {mcQuestion.correctAnswer === index ? '✓ Correct' : 'Set Correct'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = mcQuestion.options.filter((_: string, i: number) => i !== index)
                        const newExplanations = optionExplanations.filter((_, i) => i !== index)
                        updateQuestion({ 
                          options: newOptions,
                          correctAnswer: mcQuestion.correctAnswer === index ? undefined : mcQuestion.correctAnswer
                        })
                        setOptionExplanations(newExplanations)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {showMisconceptions && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        {mcQuestion.correctAnswer === index ? 'Explanation:' : 'Misconception/Logic Flaw:'}
                      </label>
                      <Textarea
                        value={optionExplanations[index] ? optionExplanations[index].replace(/^[✓✗]\s*/, '').replace(/^CORRECT:\s*/, '') : ''}
                        onChange={(e) => {
                          const newExplanations = [...optionExplanations]
                          newExplanations[index] = e.target.value
                          setOptionExplanations(newExplanations)
                        }}
                        placeholder={mcQuestion.correctAnswer === index 
                          ? "Explain why this is correct..." 
                          : "Describe the misconception or logic error..."}
                        className={`text-xs min-h-[60px] ${
                          mcQuestion.correctAnswer === index 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-orange-50 border-orange-200'
                        }`}
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(mcQuestion.options || []), '']
                    updateQuestion({ options: newOptions })
                    // Add empty explanation for the new option
                    if (optionExplanations.length > 0) {
                      setOptionExplanations([...optionExplanations, ''])
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
                {optionExplanations.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMisconceptions(!showMisconceptions)}
                    className={showMisconceptions ? 'bg-purple-50 border-purple-200' : ''}
                  >
                    {showMisconceptions ? 'Hide' : 'Show'} Misconceptions
                  </Button>
                )}
              </div>
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

      // Short-answer removed - consolidated into open-response

      case 'numerical':
        const numQuestion = question as NumericalQuestion
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Answer Configuration</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoCalculate}
                disabled={isCalculating || !question.question}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200"
              >
                {isCalculating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2 text-blue-600" />
                )}
                {isCalculating ? 'Calculating...' : 'Auto-Calculate'}
              </Button>
            </div>
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
            {numQuestion.unitOptions && numQuestion.unitOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Unit Options (for students)</label>
                <div className="flex flex-wrap gap-2">
                  {numQuestion.unitOptions.map((unitOption, idx) => (
                    <Badge 
                      key={idx}
                      variant={unitOption === numQuestion.unit ? "default" : "outline"}
                      className={unitOption === numQuestion.unit ? "bg-green-100 text-green-800" : ""}
                    >
                      {unitOption}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Students will select from these unit options
                </p>
              </div>
            )}
          </div>
        )

      case 'essay':
        const essayQuestion = question as EssayQuestion
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="essayAutoGrade"
                  checked={essayQuestion.autoGrade || false}
                  onChange={(e) => updateQuestion({ autoGrade: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="essayAutoGrade">Enable AI Auto-Grading</Label>
              </div>
              <div className="text-sm text-muted-foreground">
                Uses OpenAI to automatically grade essay responses
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rubric</label>
              <Textarea
                value={essayQuestion.rubric || ''}
                onChange={(e) => updateQuestion({ rubric: e.target.value })}
                placeholder="Describe what constitutes a good answer..."
                rows={4}
              />
            </div>

            {essayQuestion.autoGrade && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Sample Answer (Optional)</label>
                  <Textarea
                    value={essayQuestion.sampleAnswer || ''}
                    onChange={(e) => updateQuestion({ sampleAnswer: e.target.value })}
                    placeholder="Provide an example of an excellent answer..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Helps the AI understand the expected depth and style of response
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Key Concepts (Optional)</label>
                  <Input
                    value={(essayQuestion.correctConcepts || []).join(', ')}
                    onChange={(e) => updateQuestion({ 
                      correctConcepts: e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0) 
                    })}
                    placeholder="velocity, acceleration, Newton's laws"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Physics concepts the student should demonstrate (comma-separated)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Common Misconceptions (Optional)</label>
                  <Input
                    value={(essayQuestion.commonMisconceptions || []).join(', ')}
                    onChange={(e) => updateQuestion({ 
                      commonMisconceptions: e.target.value.split(',').map(m => m.trim()).filter(m => m.length > 0) 
                    })}
                    placeholder="heavier objects fall faster, force equals velocity"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Common wrong ideas to check for in student responses
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Custom Grading Instructions (Optional)</label>
                  <Textarea
                    value={essayQuestion.gradePrompt || ''}
                    onChange={(e) => updateQuestion({ gradePrompt: e.target.value })}
                    placeholder="Additional instructions for the AI grader..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Specific instructions to guide the AI&apos;s grading approach
                  </p>
                </div>
              </>
            )}

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

      case 'open-response':
        const openResponseQuestion = question as OpenResponseQuestion
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoGrade"
                  checked={openResponseQuestion.autoGrade || false}
                  onChange={(e) => updateQuestion({ autoGrade: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="autoGrade">Enable AI Auto-Grading</Label>
              </div>
              <div className="text-sm text-muted-foreground">
                Uses OpenAI to automatically grade responses based on the rubric
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sample Answer (Optional)</label>
              <Textarea
                value={openResponseQuestion.sampleAnswer || ''}
                onChange={(e) => updateQuestion({ sampleAnswer: e.target.value })}
                placeholder="Provide a sample high-quality answer for AI reference..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps the AI understand what constitutes a good response
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Length (words)</label>
                <Input
                  type="number"
                  value={openResponseQuestion.minLength || ''}
                  onChange={(e) => updateQuestion({ minLength: parseInt(e.target.value) || undefined })}
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Length (words)</label>
                <Input
                  type="number"
                  value={openResponseQuestion.maxLength || ''}
                  onChange={(e) => updateQuestion({ maxLength: parseInt(e.target.value) || undefined })}
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Custom Grading Instructions (Optional)</label>
              <Textarea
                value={openResponseQuestion.gradePrompt || ''}
                onChange={(e) => updateQuestion({ gradePrompt: e.target.value })}
                placeholder="Additional instructions for the AI grader..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Specific instructions to guide the AI&apos;s grading approach
              </p>
            </div>

            <RubricBuilder
              rubric={openResponseQuestion.rubric || []}
              onRubricChange={(rubric) => updateQuestion({ rubric })}
              maxPoints={question.points}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-lg">Question</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {question.type.replace('-', ' ')}
              </Badge>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddToBank(true)}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 text-xs sm:text-sm px-2 sm:px-3"
                title="Save to Question Bank"
                disabled={!question.question || question.question.trim() === ''}
              >
                <BookPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Save to Bank</span>
                <span className="xs:hidden">Bank</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete} className="px-2 sm:px-3">
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
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
        
        {/* Image Generation Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Visual Aid</label>
            {!question.scenarioImage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !question.question}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200"
              >
                {isGeneratingImage ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin text-indigo-600" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2 text-indigo-600" />
                )}
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </Button>
            )}
          </div>
          
          {question.scenarioImage && (
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={question.scenarioImage}
                alt="Question visual"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-purple-500/90 text-white">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => updateQuestion({ scenarioImage: undefined })}
                className="absolute top-2 right-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <Select
              value={question.type}
              onValueChange={(value: QuestionType) => updateQuestion({ type: value })}
            >
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="open-response">Open Response (Concept-Based)</SelectItem>
                <SelectItem value="numerical">Numerical</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="vocabulary-matching">Vocabulary Matching</SelectItem>
                <SelectItem value="vocabulary-crossword">Vocabulary Crossword</SelectItem>
                <SelectItem value="vocabulary-fill-blank">Vocabulary Fill in the Blank</SelectItem>
                <SelectItem value="vocabulary-hangman">Vocabulary Hangman</SelectItem>
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
              className="h-10 sm:h-11"
            />
          </div>
        </div>

        {renderQuestionTypeEditor()}
      </CardContent>
    </Card>
    
    {showAddToBank && (
      <AddToQuestionBankModal
        question={question}
        onClose={() => setShowAddToBank(false)}
        onSuccess={() => {
          setShowAddToBank(false)
          alert('Question added to Question Bank successfully!')
        }}
      />
    )}
  </>
  )
}

