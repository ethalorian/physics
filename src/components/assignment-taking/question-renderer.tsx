"use client"
import { useState } from 'react'
import { Question, MultipleChoiceQuestion, NumericalQuestion, OpenResponseQuestion, VocabularyMatchingQuestion, VocabularyCrosswordQuestion, VocabularyFillBlankQuestion, VocabularyHangmanQuestion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Award, Sparkles, Info, Image as ImageIcon, Wand2, RefreshCw } from 'lucide-react'
import VocabularyMatchingGame from '@/components/vocabulary/games/VocabularyMatchingGame'
import VocabularyCrosswordGame from '@/components/vocabulary/games/VocabularyCrosswordGame'
import VocabularyFillBlankGame from '@/components/vocabulary/games/VocabularyFillBlankGame'
import VocabularyHangmanGame from '@/components/vocabulary/games/VocabularyHangmanGame'
import MathMarkdown from '@/components/MathMarkdown'

interface QuestionRendererProps {
  question: Question
  answer: string | number | string[] | Record<string, any>
  onAnswerChange: (answer: string | number | string[] | Record<string, any>) => void
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)

  const handleGenerateImage = async () => {
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
        setGeneratedImage(data.imageUrl)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleGenerateAnswer = async () => {
    setIsGeneratingAnswer(true)
    try {
      // Get correct concepts if it's an open response question
      const correctConcepts = question.type === 'open-response' 
        ? (question as OpenResponseQuestion).correctConcepts 
        : []

      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.question,
          questionType: question.type,
          correctConcepts: correctConcepts
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate answer')
      }

      const data = await response.json()
      if (data.sampleAnswer) {
        onAnswerChange(data.sampleAnswer)
      }
    } catch (error) {
      console.error('Error generating answer:', error)
      alert('Failed to generate answer. Please try again.')
    } finally {
      setIsGeneratingAnswer(false)
    }
  }

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
              className="space-y-3"
            >
              {mcQuestion.options?.map((option: string, index: number) => (
                <div 
                  key={index} 
                  className={`relative flex items-center p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    answer?.toString() === index.toString()
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  } ${
                    showFeedback && mcQuestion.correctAnswer === index
                      ? 'ring-2 ring-green-400 ring-offset-2'
                      : ''
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mr-2 sm:mr-3 flex-shrink-0" />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed">
                    <MathMarkdown content={option} />
                  </Label>
                  {showFeedback && mcQuestion.correctAnswer === index && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-4" />
                  )}
                </div>
              ))}
            </RadioGroup>
            {showFeedback && mcQuestion.explanation && (
              <div className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Explanation</p>
                    <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      <MathMarkdown content={mcQuestion.explanation} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      // Short-answer and Essay removed - consolidated into open-response

      case 'numerical':
        const numQuestion = question as NumericalQuestion
        
        // Parse answer to separate value and unit if stored as string
        let numValue = answer
        let selectedUnit = ''
        
        if (typeof answer === 'string' && answer.includes('|')) {
          const parts = answer.split('|')
          numValue = parts[0]
          selectedUnit = parts[1] || ''
        }
        
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  step="any"
                  value={typeof numValue === 'string' || typeof numValue === 'number' ? numValue : ''}
                  onChange={(e) => {
                    if (numQuestion.unitOptions) {
                      onAnswerChange(`${e.target.value}|${selectedUnit}`)
                    } else {
                      onAnswerChange(e.target.value)
                    }
                  }}
                  placeholder="Enter your answer"
                  disabled={disabled}
                  className="text-base sm:text-lg p-3 sm:p-4 rounded-lg border-2 border-gray-200 focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
              
              {numQuestion.unitOptions && numQuestion.unitOptions.length > 0 ? (
                <Select
                  value={selectedUnit}
                  onValueChange={(value) => onAnswerChange(`${numValue}|${value}`)}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full sm:w-40 h-full text-sm sm:text-base font-semibold border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {numQuestion.unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit} className="text-base">
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : numQuestion.unit ? (
                <div className="flex items-center px-5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
                  <span className="text-base font-semibold text-indigo-700 dark:text-indigo-300">{numQuestion.unit}</span>
                </div>
              ) : null}
            </div>
            
            {numQuestion.unitOptions && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-3 h-3" />
                <span>Select the correct unit from the dropdown</span>
              </div>
            )}
            
            {numQuestion.tolerance && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>Tolerance: <span className="font-semibold">± {numQuestion.tolerance}</span></span>
              </div>
            )}
          </div>
        )

      case 'open-response':
        const openResponseQuestion = question as OpenResponseQuestion
        const wordCount = (answer as string || '').split(/\s+/).filter((word: string) => word.length > 0).length
        return (
          <div className="space-y-4">
            {/* Concept Hints for Students */}
            {openResponseQuestion.correctConcepts && openResponseQuestion.correctConcepts.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Key Concepts to Address:
                    </p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      {openResponseQuestion.correctConcepts.map((concept, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500">•</span>
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* AI Answer Helper Button */}
            {!disabled && (
              <div className="flex justify-end mb-2">
                <Button
                  onClick={handleGenerateAnswer}
                  disabled={isGeneratingAnswer}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200"
                >
                  {isGeneratingAnswer ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin text-indigo-600" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2 text-indigo-600" />
                  )}
                  {isGeneratingAnswer ? 'Generating...' : 'AI Answer Helper'}
                </Button>
              </div>
            )}
            
            <Textarea
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Explain your answer using physics concepts. Be sure to address all key concepts listed above..."
              rows={6}
              disabled={disabled}
              className="min-h-[150px] sm:min-h-[200px] text-sm sm:text-base p-3 sm:p-4 rounded-lg border-2 border-gray-200 focus:border-indigo-500 transition-colors"
            />
            
            <div className="flex items-center justify-between mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Word count: <span className="font-semibold text-gray-800 dark:text-gray-200">{wordCount}</span>
                  {openResponseQuestion.minLength && (
                    <span className="ml-2 text-xs">Min: {openResponseQuestion.minLength}</span>
                  )}
                  {openResponseQuestion.maxLength && (
                    <span className="ml-2 text-xs">Max: {openResponseQuestion.maxLength}</span>
                  )}
                </span>
              </div>
              {openResponseQuestion.autoGrade && (
                <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 dark:from-purple-900/30 dark:to-indigo-900/30 dark:text-purple-300 font-semibold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Concept Grading
                </Badge>
              )}
            </div>

            {/* Show rubric criteria to students */}
            {openResponseQuestion.rubric && openResponseQuestion.rubric.length > 0 && (
              <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">Grading Criteria</h4>
                </div>
                <div className="space-y-3">
                  {openResponseQuestion.rubric.map((criterion, index) => (
                    <div key={criterion.id} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {index + 1}
                          </span>
                          <span className="font-medium text-indigo-800 dark:text-indigo-200">
                            {criterion.name}
                          </span>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-semibold">
                          {criterion.maxPoints} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 pl-8">
                        {criterion.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show sample answer if provided and not disabled (i.e., after submission) */}
            {showFeedback && openResponseQuestion.sampleAnswer && (
              <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-green-900 dark:text-green-100 mb-2">Sample Answer</h4>
                    <div className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap leading-relaxed bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur">
                      <MathMarkdown content={openResponseQuestion.sampleAnswer} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'vocabulary-matching':
        const matchingQuestion = question as VocabularyMatchingQuestion
        return (
          <VocabularyMatchingGame
            question={matchingQuestion}
            onAnswer={(gameAnswer) => onAnswerChange(gameAnswer)}
            showResults={showFeedback}
            initialAnswer={answer as { matches: Record<string, string> }}
            disabled={disabled}
          />
        )

      case 'vocabulary-crossword':
        const crosswordQuestion = question as VocabularyCrosswordQuestion
        return (
          <VocabularyCrosswordGame
            question={crosswordQuestion}
            onAnswer={(gameAnswer) => onAnswerChange(gameAnswer)}
            showResults={showFeedback}
            initialAnswer={answer as { answers: Record<string, string> }}
            disabled={disabled}
          />
        )

      case 'vocabulary-fill-blank':
        const fillBlankQuestion = question as VocabularyFillBlankQuestion
        return (
          <VocabularyFillBlankGame
            question={fillBlankQuestion}
            onAnswer={(gameAnswer) => onAnswerChange(gameAnswer)}
            showResults={showFeedback}
            initialAnswer={answer as { answers: Record<string, string> }}
            disabled={disabled}
          />
        )

      case 'vocabulary-hangman':
        const hangmanQuestion = question as VocabularyHangmanQuestion
        return (
          <VocabularyHangmanGame
            vocabularyTerms={hangmanQuestion.vocabularyTerms || []}
            difficulty={hangmanQuestion.difficulty}
            showDefinitions={hangmanQuestion.showDefinitions}
            maxWrongGuesses={hangmanQuestion.maxWrongGuesses}
            onGameComplete={(score, totalWords, timeSpent) => {
              onAnswerChange({
                score,
                totalWords,
                timeSpent,
                completed: true,
                timestamp: new Date().toISOString()
              })
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`relative mb-4 sm:mb-6 md:mb-8 transition-all duration-300 ${
      showFeedback 
        ? isCorrect 
          ? 'ring-1 sm:ring-2 ring-green-400 ring-offset-2 sm:ring-offset-4 rounded-lg sm:rounded-2xl' 
          : 'ring-1 sm:ring-2 ring-red-400 ring-offset-2 sm:ring-offset-4 rounded-lg sm:rounded-2xl'
        : ''
    }`}>
      {/* Modern card with gradient border on hover - Mobile optimized */}
      <Card className="overflow-hidden border-0 shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        {/* Cinematic image section - Mobile responsive */}
        {question.scenarioImage && (
          <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
            <img
              src={question.scenarioImage}
              alt="Physics scenario visualization"
              className="w-full h-full object-cover opacity-95 hover:opacity-100 hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Overlay badges on image - Mobile responsive */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-1 sm:gap-2">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 font-semibold text-xs sm:text-sm">
                <Award className="w-3 h-3 mr-1" />
                <span className="hidden xs:inline">{question.points} pts</span>
                <span className="xs:hidden">{question.points}</span>
              </Badge>
              {showFeedback && (
                <Badge className={`backdrop-blur-md font-semibold ${
                  isCorrect 
                    ? 'bg-green-500/30 text-green-100 border-green-400/50' 
                    : 'bg-red-500/30 text-red-100 border-red-400/50'
                }`}>
                  {isCorrect ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Correct</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Incorrect</>
                  )}
                </Badge>
              )}
            </div>

            {/* Question text overlay on image bottom - Mobile responsive */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight drop-shadow-lg [&_.markdown-content]:text-white [&_.katex]:text-white">
                <MathMarkdown content={question.question} />
              </div>
            </div>
          </div>
        )}
        
        {/* AI Generation Buttons - Mobile responsive */}
        {!disabled && !question.scenarioImage && !generatedImage && (
          <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
            <Button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200 text-sm"
            >
              {isGeneratingImage ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin text-purple-600" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2 text-purple-600" />
              )}
              {isGeneratingImage ? 'Generating Image...' : 'Generate Visual Aid'}
            </Button>
          </div>
        )}

        {/* Display generated image */}
        {generatedImage && (
          <div className="relative h-96 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
            <img
              src={generatedImage}
              alt="AI generated physics scenario"
              className="w-full h-full object-cover opacity-95 hover:opacity-100 hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Overlay badges on image */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Badge className="bg-purple-500/30 backdrop-blur-md text-white border-purple-400/50 font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 font-semibold">
                <Award className="w-3 h-3 mr-1" />
                {question.points} points
              </Badge>
            </div>

            {/* Question text overlay on image bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg [&_.markdown-content]:text-white [&_.katex]:text-white">
                <MathMarkdown content={question.question} />
              </div>
            </div>
            
            {/* Remove image button */}
            <Button
              onClick={() => setGeneratedImage(null)}
              className="absolute top-4 left-4 bg-red-500/30 backdrop-blur-md text-white border-red-400/50 hover:bg-red-500/50"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        )}
        
        {/* If no image, show question in header with modern styling - Mobile responsive */}
        {!question.scenarioImage && !generatedImage && (
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6 md:p-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight pr-2 [&_.markdown-content]:text-white [&_.katex]:text-white">
                  <MathMarkdown content={question.question} />
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Badge className="bg-white/20 backdrop-blur text-white border-white/30 font-semibold">
                  <Award className="w-4 h-4 mr-1" />
                  {question.points} points
                </Badge>
                {showFeedback && (
                  <Badge className={`font-semibold ${
                    isCorrect 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {isCorrect ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1" /> Correct</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-1" /> Incorrect</>
                    )}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        )}
        
        {/* Modern content section with better spacing - Mobile responsive */}
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Answer input section with modern styling - Mobile responsive */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              {renderInput()}
            </div>
            
            {/* Modern feedback section - Mobile responsive */}
            {showFeedback && feedback && (
              <div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-4 sm:p-6 ${
                isCorrect 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 dark:from-green-900/20 dark:to-emerald-900/20' 
                  : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 dark:from-red-900/20 dark:to-pink-900/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    isCorrect ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-300" />
                    ) : (
                      <Info className="w-5 h-5 text-red-600 dark:text-red-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold mb-1 ${
                      isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      Feedback
                    </p>
                    <div className={`text-sm leading-relaxed ${
                      isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      <MathMarkdown content={feedback} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

