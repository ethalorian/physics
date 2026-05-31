"use client"
import { useState } from 'react'
import { useQuestionBank } from '@/contexts/QuestionBankContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  BookOpen,
  Target,
  Brain,
  Clock,
  BarChart3,
  X
} from 'lucide-react'
import { QuestionBankItem } from '@/types/question-bank'
import MathMarkdown from '@/components/MathMarkdown'

interface QuestionBankBrowserProps {
  onSelectQuestion?: (question: QuestionBankItem) => void
  selectionMode?: boolean
  selectedQuestions?: string[]
  onSelectionChange?: (questionIds: string[]) => void
}

export default function QuestionBankBrowser({
  onSelectQuestion,
  selectionMode = false,
  selectedQuestions = [],
  onSelectionChange
}: QuestionBankBrowserProps) {
  const {
    filteredQuestions,
    units,
    filters,
    setFilters,
    clearFilters,
    stats,
    deleteQuestion,
    duplicateQuestion,
    incrementUsageCount
  } = useQuestionBank()

  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (value: string) => {
    setFilters({ ...filters, searchText: value })
  }

  const handleUnitFilter = (unitId: string) => {
    const currentUnits = filters.units || []
    if (currentUnits.includes(unitId)) {
      setFilters({ 
        ...filters, 
        units: currentUnits.filter(u => u !== unitId),
        lessons: [] // Clear lesson filter when unit changes
      })
    } else {
      setFilters({ 
        ...filters, 
        units: [...currentUnits, unitId],
        lessons: [] // Clear lesson filter when unit changes
      })
    }
  }

  const handleLessonFilter = (lessonId: string) => {
    const currentLessons = filters.lessons || []
    if (currentLessons.includes(lessonId)) {
      setFilters({ 
        ...filters, 
        lessons: currentLessons.filter(l => l !== lessonId)
      })
    } else {
      setFilters({ 
        ...filters, 
        lessons: [...currentLessons, lessonId]
      })
    }
  }

  const handleDifficultyFilter = (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentDifficulties = filters.difficulty || []
    if (currentDifficulties.includes(difficulty)) {
      setFilters({ 
        ...filters, 
        difficulty: currentDifficulties.filter(d => d !== difficulty)
      })
    } else {
      setFilters({ 
        ...filters, 
        difficulty: [...currentDifficulties, difficulty]
      })
    }
  }

  const handleQuestionTypeFilter = (type: string) => {
    const currentTypes = filters.questionTypes || []
    if (currentTypes.includes(type)) {
      setFilters({ 
        ...filters, 
        questionTypes: currentTypes.filter(t => t !== type)
      })
    } else {
      setFilters({ 
        ...filters, 
        questionTypes: [...currentTypes, type]
      })
    }
  }

  const handleQuestionSelect = (question: QuestionBankItem) => {
    if (selectionMode && onSelectionChange) {
      if (selectedQuestions.includes(question.id)) {
        onSelectionChange(selectedQuestions.filter(id => id !== question.id))
      } else {
        onSelectionChange([...selectedQuestions, question.id])
      }
    } else if (onSelectQuestion) {
      incrementUsageCount(question.id)
      onSelectQuestion(question)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success dark:bg-success/30 dark:text-success'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'hard': return 'bg-destructive/10 text-destructive dark:bg-destructive/30 dark:text-destructive'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary'
      case 'open-response': return 'bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary'
      case 'numerical': return 'bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary'
      // Essay type removed - consolidated into open-response
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getCognitiveLevelIcon = (level?: string) => {
    switch (level) {
      case 'remember': return '🧠'
      case 'understand': return '💡'
      case 'apply': return '⚙️'
      case 'analyze': return '🔍'
      case 'evaluate': return '⚖️'
      case 'create': return '🎨'
      default: return '📝'
    }
  }

  // Get selected unit and its lessons
  const selectedUnits = units.filter(u => filters.units?.includes(u.id))
  const availableLessons = selectedUnits.flatMap(u => u.lessons)

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={filters.searchText || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-10 sm:h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-initial ${showFilters ? 'bg-primary text-primary-foreground' : ''}`}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Filters</span>
            <span className="xs:hidden">•</span>
            {(filters.units?.length || filters.difficulty?.length || filters.questionTypes?.length) ? (
              <Badge className="ml-1 sm:ml-2" variant="secondary">
                {(filters.units?.length || 0) + (filters.difficulty?.length || 0) + (filters.questionTypes?.length || 0)}
              </Badge>
            ) : null}
          </Button>
          {(filters.units?.length || filters.difficulty?.length || filters.questionTypes?.length || filters.searchText) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              size="sm"
              className="px-2 sm:px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Units Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Units</label>
              <div className="flex flex-wrap gap-2">
                {units.map(unit => (
                  <Badge
                    key={unit.id}
                    variant={filters.units?.includes(unit.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleUnitFilter(unit.id)}
                  >
                    {unit.name}
                    {filters.units?.includes(unit.id) && (
                      <span className="ml-1">({stats.by_unit[unit.id] || 0})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Lessons Filter (if unit selected) */}
            {availableLessons.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Lessons</label>
                <div className="flex flex-wrap gap-2">
                  {availableLessons.map(lesson => (
                    <Badge
                      key={lesson.id}
                      variant={filters.lessons?.includes(lesson.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleLessonFilter(lesson.id)}
                    >
                      {lesson.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map(difficulty => (
                  <Badge
                    key={difficulty}
                    variant={filters.difficulty?.includes(difficulty as any) ? 'default' : 'outline'}
                    className={`cursor-pointer ${getDifficultyColor(difficulty)}`}
                    onClick={() => handleDifficultyFilter(difficulty as any)}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    <span className="ml-1">({stats.by_difficulty[difficulty as keyof typeof stats.by_difficulty]})</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Question Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Question Type</label>
              <div className="flex gap-2">
                {Object.entries(stats.by_type).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant={filters.questionTypes?.includes(type) ? 'default' : 'outline'}
                    className={`cursor-pointer ${getTypeColor(type)}`}
                    onClick={() => handleQuestionTypeFilter(type)}
                  >
                    {type.replace('-', ' ')}
                    <span className="ml-1">({count})</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary - Mobile optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold">{stats.total_questions}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold">{filteredQuestions.length}</div>
          <div className="text-xs text-muted-foreground">Filtered</div>
        </Card>
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold">{selectedQuestions.length}</div>
          <div className="text-xs text-muted-foreground">Selected</div>
        </Card>
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold">{units.length}</div>
          <div className="text-xs text-muted-foreground">Units</div>
        </Card>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No questions found matching your filters.</p>
              <Button
                variant="link"
                onClick={clearFilters}
                className="mt-2"
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map(item => {
            const unit = units.find(u => u.id === item.unit)
            const lesson = unit?.lessons.find(l => l.id === item.lesson)
            const isExpanded = expandedQuestion === item.id
            const isSelected = selectedQuestions.includes(item.id)

            return (
              <Card 
                key={item.id} 
                className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${selectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => selectionMode && handleQuestionSelect(item)}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                        <Badge className={`${getDifficultyColor(item.difficulty)} text-xs`}>
                          {item.difficulty}
                        </Badge>
                        <Badge className={`${getTypeColor(item.question.type)} text-xs`}>
                          {item.question.type.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.question.points} pts
                        </Badge>
                        {item.cognitive_level && (
                          <span title={item.cognitive_level} className="text-sm">
                            {getCognitiveLevelIcon(item.cognitive_level)}
                          </span>
                        )}
                        {item.estimated_time && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.estimated_time}min
                          </div>
                        )}
                        {item.usage_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BarChart3 className="h-3 w-3" />
                            {item.usage_count}x
                          </div>
                        )}
                      </div>
                      <CardTitle 
                        className="text-base cursor-pointer hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedQuestion(isExpanded ? null : item.id)
                        }}
                      >
                        <MathMarkdown content={item.question.question} />
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {unit?.name} → {lesson?.name}
                      </div>
                      {item.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.topics.map(topic => (
                            <Badge key={topic} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!selectionMode && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onSelectQuestion) {
                                incrementUsageCount(item.id)
                                onSelectQuestion(item)
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicateQuestion(item.id)
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Implement edit functionality
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Delete this question from the bank?')) {
                                deleteQuestion(item.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Show question details based on type */}
                    {item.question.type === 'multiple-choice' && 'options' in item.question && (
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Options:</div>
                        {item.question.options.map((option, idx) => {
                          const mcQuestion = item.question as any // Type assertion for MultipleChoiceQuestion
                          return (
                            <div 
                              key={idx} 
                              className={`text-sm p-2 rounded ${
                                idx === mcQuestion.correctAnswer 
                                  ? 'bg-success/5 border border-success/30' 
                                  : 'bg-muted'
                              }`}
                            >
                              <span className="font-medium">{idx + 1}.</span> <MathMarkdown content={option} />
                              {idx === mcQuestion.correctAnswer && (
                                <Badge className="ml-2 bg-success/10 text-success">Correct</Badge>
                              )}
                            </div>
                          )
                        })}
                        {'explanation' in item.question && item.question.explanation && (
                          <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                            <strong>Explanation:</strong> <MathMarkdown content={item.question.explanation as string} />
                          </div>
                        )}
                      </div>
                    )}
                    {item.question.type === 'open-response' && 'correctConcepts' in item.question && (
                      <div className="space-y-2">
                        {item.question.correctConcepts && item.question.correctConcepts.length > 0 && (
                          <div>
                            <div className="font-medium text-sm mb-1">Key Concepts:</div>
                            <ul className="text-sm space-y-1">
                              {item.question.correctConcepts.map((concept, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-success">✓</span>
                                  <MathMarkdown content={concept} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.question.sampleAnswer && (
                          <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                            <strong>Sample Answer:</strong> <MathMarkdown content={item.question.sampleAnswer as string} />
                          </div>
                        )}
                      </div>
                    )}
                    {item.question.type === 'numerical' && 'correctValue' in item.question && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Answer:</strong> <MathMarkdown content={`${item.question.correctValue} ${item.question.unit || ''}`} />
                          {item.question.tolerance && (
                            <span className="text-muted-foreground"> (±{item.question.tolerance})</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
