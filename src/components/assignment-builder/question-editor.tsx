"use client"
import { useState } from 'react'
import { Question, QuestionType, MultipleChoiceQuestion, NumericalQuestion, OpenResponseQuestion, VocabularyMatchingQuestion, VocabularyCrosswordQuestion, VocabularyFillBlankQuestion, VocabularyHangmanQuestion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, RefreshCw, Image as ImageIcon, Calculator, BookPlus, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import RubricBuilder from './rubric-builder'
import { calculatePhysicsSolution, generateIncorrectUnits } from '@/utils/physics-calculator'
import dynamic from 'next/dynamic'
import MathMarkdown, { InlineMath } from '@/components/MathMarkdown'
import MediaGenerator from '@/components/admin/MediaGenerator'

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
  const [isCalculating, setIsCalculating] = useState(false)
  const [unitOptions, setUnitOptions] = useState<string[]>([])
  const [showAddToBank, setShowAddToBank] = useState(false)
  const [optionExplanations, setOptionExplanations] = useState<string[]>([])
  const [showMisconceptions, setShowMisconceptions] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

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

  const renderQuestionTypeEditor = () => {
    switch (question.type) {
      case 'multiple-choice':
        const mcQuestion = question as MultipleChoiceQuestion
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Options</label>
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
          <div className="space-y-6">
            {/* Answer Configuration */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Answer Configuration</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoCalculate}
                disabled={isCalculating || !question.question}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200"
              >
                {isCalculating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin text-green-600" />
                ) : (
                    <Calculator className="h-4 w-4 mr-2 text-green-600" />
                )}
                  {isCalculating ? 'Calculating...' : 'Quick Calculate'}
              </Button>
            </div>
              
              <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Correct Value</label>
                <Input
                  type="number"
                  step="any"
                  value={numQuestion.correctValue || ''}
                  onChange={(e) => updateQuestion({ correctValue: parseFloat(e.target.value) || 0 })}
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <Input
                    value={numQuestion.unit || ''}
                    onChange={(e) => updateQuestion({ unit: e.target.value })}
                    placeholder="m/s"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tolerance (±)</label>
                <Input
                  type="number"
                  step="any"
                  value={numQuestion.tolerance || ''}
                  onChange={(e) => updateQuestion({ tolerance: parseFloat(e.target.value) || undefined })}
                    placeholder="0.5"
                />
              </div>
            </div>
            </div>

            {/* Unit Options */}
            {numQuestion.unitOptions && numQuestion.unitOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Unit Options (for students to choose)</label>
                <div className="flex flex-wrap gap-2">
                  {numQuestion.unitOptions.map((unitOption, idx) => (
                    <Badge 
                      key={idx}
                      variant={unitOption === numQuestion.unit ? "default" : "outline"}
                      className={unitOption === numQuestion.unit ? "bg-green-100 text-green-800 border-green-300" : ""}
                    >
                      {unitOption}
                      {unitOption === numQuestion.unit && " ✓"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Solution Steps (collapsible) */}
            {numQuestion.solutionSteps && numQuestion.solutionSteps.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSolution(!showSolution)}
                  className="w-full p-4 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between hover:from-amber-100 hover:to-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-800">Step-by-Step Solution</span>
                    {numQuestion.solutionGeneratedByAI && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" /> AI
                      </Badge>
                    )}
                  </div>
                  <span className="text-amber-600">{showSolution ? '▼ Hide' : '▶ Show'}</span>
                </button>
                
                {showSolution && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Formula */}
                    {numQuestion.formula && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-xs font-medium text-blue-600 block mb-2">Formula Used:</span>
                        <div className="text-lg text-blue-800 text-center py-2">
                          <InlineMath math={numQuestion.formula} displayMode />
                        </div>
                      </div>
                    )}
                    
                    {/* Given Values */}
                    {numQuestion.givenValues && numQuestion.givenValues.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs font-medium text-gray-600 block mb-2">Given Values:</span>
                        <div className="flex flex-wrap gap-3">
                          {numQuestion.givenValues.map((gv, idx) => (
                            <div key={idx} className="px-3 py-1 bg-white rounded border text-sm">
                              <InlineMath math={`${gv.symbol} = ${gv.value} \\text{ ${gv.unit}}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Steps */}
                    <div className="space-y-3">
                      {numQuestion.solutionSteps.map((step) => (
                        <div key={step.step} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 mb-2">{step.description}</p>
                            {step.equation && (
                              <div className="bg-white px-3 py-2 rounded border inline-block">
                                <InlineMath math={step.equation.replace(/\\\\/g, '\\')} />
                              </div>
                            )}
                            {step.result && (
                              <div className="mt-2 text-sm font-semibold text-green-700">
                                Answer: <InlineMath math={step.result} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Explanation */}
                    {numQuestion.explanation && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-xs font-medium text-green-600 block mb-1">Explanation:</span>
                        <p className="text-sm text-green-800">{numQuestion.explanation}</p>
                      </div>
                    )}
                    
                    {/* Common Mistakes */}
                    {numQuestion.commonMistakes && numQuestion.commonMistakes.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-xs font-medium text-red-600 block mb-2">Common Mistakes to Watch:</span>
                        <div className="space-y-2">
                          {numQuestion.commonMistakes.map((mistake, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-red-500">✗</span>
                              <span className="text-red-700">
                                <InlineMath math={`${mistake.incorrectValue} \\text{ ${mistake.incorrectUnit || numQuestion.unit}}`} />
                              </span>
                              <span className="text-red-600">— {mistake.misconception}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      // Essay type removed - consolidated into open-response
      case 'open-response':
        const openResponseQuestion = question as OpenResponseQuestion
        return (
          <div className="space-y-6">
            {/* Auto-Grade Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoGrade"
                  checked={openResponseQuestion.autoGrade || false}
                  onChange={(e) => updateQuestion({ autoGrade: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="autoGrade" className="font-medium">Enable AI Auto-Grading</Label>
              </div>
              <span className="text-sm text-muted-foreground">
                Uses OpenAI to automatically grade responses
              </span>
            </div>

            {/* Sample Answer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Sample Answer</label>
            </div>
                  <Textarea
                value={openResponseQuestion.sampleAnswer || ''}
                onChange={(e) => updateQuestion({ sampleAnswer: e.target.value, sampleAnswerGeneratedByAI: false })}
                placeholder="Provide a sample high-quality answer for AI reference..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                This helps the AI understand what constitutes a good response
                  </p>
                </div>

            {/* Key Concepts */}
                <div>
              <label className="block text-sm font-medium mb-2">Key Concepts</label>
                  <Input
                value={(openResponseQuestion.correctConcepts || []).join(', ')}
                    onChange={(e) => updateQuestion({ 
                      correctConcepts: e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0) 
                    })}
                    placeholder="velocity, acceleration, Newton's laws"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Physics concepts the student should demonstrate (comma-separated)
                  </p>
                </div>

            {/* Common Misconceptions */}
                <div>
              <label className="block text-sm font-medium mb-2">Common Misconceptions</label>
                  <Input
                value={(openResponseQuestion.commonMisconceptions || []).join(', ')}
                    onChange={(e) => updateQuestion({ 
                      commonMisconceptions: e.target.value.split(',').map(m => m.trim()).filter(m => m.length > 0) 
                    })}
                    placeholder="heavier objects fall faster, force equals velocity"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Common wrong ideas to check for in student responses
                  </p>
                </div>

            {/* Word Limits */}
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

            {/* Custom Grading Instructions */}
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

            {/* Rubric Builder */}
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
              <div className="flex gap-2">
                <MediaGenerator
                  defaultPrompt={question.question}
                  mode="image"
                  triggerLabel="AI Media Studio"
                  onImageSelect={(imageData) => {
                    const dataUrl = `data:${imageData.mimeType};base64,${imageData.base64}`
                    updateQuestion({ scenarioImage: dataUrl })
                  }}
                  className="h-8 text-xs bg-gradient-to-r from-violet-50 to-fuchsia-50 hover:from-violet-100 hover:to-fuchsia-100 border-violet-200"
                />
              </div>
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
              <div className="absolute top-2 right-2 flex gap-1">
                <MediaGenerator
                  defaultPrompt={question.question}
                  mode="image"
                  triggerLabel="Replace"
                  onImageSelect={(imageData) => {
                    const dataUrl = `data:${imageData.mimeType};base64,${imageData.base64}`
                    updateQuestion({ scenarioImage: dataUrl })
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => updateQuestion({ scenarioImage: undefined })}
                  className="h-7"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
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
                <SelectItem value="open-response">Open Response (AI-Graded)</SelectItem>
                <SelectItem value="numerical">Numerical</SelectItem>
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

