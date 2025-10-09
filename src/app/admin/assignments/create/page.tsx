"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Assignment, Question, MultipleChoiceQuestion, OpenResponseQuestion, VocabularyMatchingQuestion, VocabularyCrosswordQuestion, VocabularyFillBlankQuestion } from '@/types/assignment'
import { useAssignments } from '@/contexts/AssignmentContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import QuestionEditor from '@/components/assignment-builder/question-editor'
import { Plus, Save, Eye, Library, X, ChevronRight, Clock, BarChart3, Target, Sparkles, Home, FileText, Zap, BookOpen, Tag, TrendingUp } from 'lucide-react'
import { PhysicsLevelInfo } from '@/components/physics-level-badge'
import type { QuestionBankItem } from '@/types/question-bank'
import { physicsUnits } from '@/data/physics-units'
import dynamic from 'next/dynamic'

const QuestionBankBrowser = dynamic(() => import('@/components/question-bank/QuestionBankBrowser'), {
  ssr: false
})

export default function CreateAssignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { createAssignment } = useAssignments()
  const [lessons, setLessons] = useState<Array<{id: string, title: string, slug: string}>>([])
  const [dbLessons, setDbLessons] = useState<Record<string, string>>({}) // Maps slug to UUID
  const [assignment, setAssignment] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    instructions: '',
    lesson_id: '',
    questions: [],
    total_points: 0,
    published: false
  })
  
  // Enhanced metadata
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [estimatedTime, setEstimatedTime] = useState<number>(30)
  const [newTag, setNewTag] = useState('')
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [showQuestionBank, setShowQuestionBank] = useState(false)
  const [activeTab, setActiveTab] = useState('basics')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Get filtered lessons based on selected unit
  const filteredLessons = selectedUnit
    ? physicsUnits.find(u => u.id === selectedUnit)?.lessons || []
    : []

  useEffect(() => {
    fetchLessons()
  }, [])

  useEffect(() => {
    // Fetch lessons from database when unit changes
    if (selectedUnit) {
      fetchDbLessons(selectedUnit)
    }
  }, [selectedUnit])

  useEffect(() => {
    // Calculate total points when questions change
    const totalPoints = assignment.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0
    if (totalPoints !== assignment.total_points) {
      setAssignment(prev => ({ ...prev, total_points: totalPoints }))
    }
  }, [assignment.questions, assignment.total_points])

  // Autosave functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (assignment.title && assignment.questions && assignment.questions.length > 0) {
        // Save to localStorage as draft
        localStorage.setItem('assignment-draft', JSON.stringify({
          assignment,
          metadata: {
            unit: selectedUnit,
            tags: selectedTags,
            difficulty,
            estimatedTime
          }
        }))
        setLastSaved(new Date())
      }
    }, 2000) // Autosave after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [assignment, selectedUnit, selectedTags, difficulty, estimatedTime])

  const fetchLessons = async () => {
    // Fetch all lessons from database to build the mapping
    try {
      const response = await fetch('/api/lessons?published=true')
      if (response.ok) {
        const data = await response.json()
        // Build a mapping of slug -> UUID
        const mapping: Record<string, string> = {}
        data.forEach((lesson: any) => {
          if (lesson.slug && lesson.id) {
            mapping[lesson.slug] = lesson.id
          }
        })
        setDbLessons(mapping)
        
        // Also set the lessons array for backward compatibility
        setLessons(data.map((l: any) => ({
          id: l.id,
          title: l.title,
          slug: l.slug
        })))
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      // Fall back to mock data
      setLessons([
        { id: '1', title: 'Newton\'s Laws', slug: 'newtons-laws' },
        { id: '2', title: 'Energy and Work', slug: 'energy-work' },
        { id: '3', title: 'Waves and Sound', slug: 'waves-sound' }
      ])
    }
  }

  const fetchDbLessons = async (unitId: string) => {
    // Fetch lessons for a specific unit
    try {
      const response = await fetch(`/api/lessons?unit_id=${unitId}&published=true`)
      if (response.ok) {
        const data = await response.json()
        // Update the mapping for this unit
        const mapping = { ...dbLessons }
        data.forEach((lesson: any) => {
          if (lesson.slug && lesson.id) {
            mapping[lesson.slug] = lesson.id
          }
        })
        setDbLessons(mapping)
      }
    } catch (error) {
      console.error('Error fetching lessons for unit:', error)
    }
  }

  const addQuestion = (type: Question['type'] = 'multiple-choice') => {
    let newQuestion: Question
    
    if (type === 'multiple-choice') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        question: '',
        points: 5,
        options: ['', '', '', ''],
        correctAnswer: 0
      } as MultipleChoiceQuestion
    } else if (type === 'open-response') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'open-response',
        question: '',
        points: 20,
        rubric: [
          {
            id: `criterion-${Date.now()}`,
            name: 'Understanding',
            description: 'Demonstrates clear understanding of the concepts',
            maxPoints: 10,
            levels: [
              { score: 10, description: 'Excellent understanding' },
              { score: 8, description: 'Good understanding' },
              { score: 6, description: 'Basic understanding' },
              { score: 4, description: 'Limited understanding' },
              { score: 0, description: 'No understanding shown' }
            ]
          },
          {
            id: `criterion-${Date.now() + 1}`,
            name: 'Communication',
            description: 'Clear and organized explanation',
            maxPoints: 10,
            levels: [
              { score: 10, description: 'Very clear and well-organized' },
              { score: 8, description: 'Mostly clear' },
              { score: 6, description: 'Somewhat clear' },
              { score: 4, description: 'Unclear in places' },
              { score: 0, description: 'Very unclear' }
            ]
          }
        ],
        autoGrade: true,
        minLength: 50,
        maxLength: 500
      } as OpenResponseQuestion
    } else if (type === 'vocabulary-matching') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'vocabulary-matching',
        question: 'Vocabulary Matching Game',
        points: 10,
        vocabularyTerms: [],
        instructions: 'Match each term with its correct definition.'
      } as VocabularyMatchingQuestion
    } else if (type === 'vocabulary-crossword') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'vocabulary-crossword',
        question: 'Vocabulary Crossword Puzzle',
        points: 15,
        vocabularyTerms: [],
        gridSize: 15,
        instructions: 'Complete the crossword puzzle using the vocabulary definitions as clues.'
      } as VocabularyCrosswordQuestion
    } else if (type === 'vocabulary-fill-blank') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'vocabulary-fill-blank',
        question: 'Fill in the Blanks',
        points: 10,
        vocabularyTerms: [],
        sentences: [],
        showWordBank: true,
        instructions: 'Fill in the blanks with the correct vocabulary terms.'
      } as VocabularyFillBlankQuestion
    } else {
      // Default fallback
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        question: '',
        points: 5,
        options: ['', '', '', ''],
        correctAnswer: 0
      } as MultipleChoiceQuestion
    }

    setAssignment(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }))
  }

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    setAssignment(prev => ({
      ...prev,
      questions: prev.questions?.map((q, i) => i === index ? updatedQuestion : q) || []
    }))
  }

  const deleteQuestion = (index: number) => {
    setAssignment(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }))
  }

  const handleAddFromBank = (questionBankItem: QuestionBankItem) => {
    // Convert question bank item to assignment question
    const newQuestion: Question = {
      ...questionBankItem.question,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    setAssignment(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }))
    
    // Usage count will be incremented when question is used
  }

  // Tag management
  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  // Get available physics topics from selected unit
  const getAvailableTopics = () => {
    const unit = physicsUnits.find(u => u.id === selectedUnit)
    if (!unit) return []
    
    // Extract topics from lessons
    const topics = new Set<string>()
    unit.lessons.forEach(lesson => {
      lesson.objectives?.forEach(obj => topics.add(lesson.name))
    })
    return Array.from(topics)
  }

  const saveAssignment = async (publish: boolean = false) => {
    if (!assignment.title || !assignment.questions?.length) {
      alert('Please provide a title and at least one question.')
      return
    }

    if (!session?.user?.id) {
      alert('You must be logged in to create assignments.')
      return
    }

    setSaving(true)
    try {
      await createAssignment({
        ...assignment as Omit<Assignment, 'id' | 'created_at' | 'updated_at'>,
        published: publish,
        total_points: assignment.total_points || 0,
        questions: assignment.questions || []
      })
      
      alert(publish ? 'Assignment published successfully!' : 'Assignment saved as draft!')
      router.push('/admin/assignments')
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Error saving assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb 
        items={[
          { label: 'Admin Dashboard', href: '/admin/dashboard' },
          { label: 'Assignments', href: '/admin/assignments' },
          { label: 'Create New' }
        ]}
      />

      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Create Assignment
          </h1>
          <p className="text-muted-foreground text-lg">
            Build a comprehensive homework assignment with AI-powered tools
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={() => saveAssignment(false)} 
              variant="outline"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              onClick={() => saveAssignment(true)}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Eye className="h-4 w-4 mr-2" />
              {saving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
          {lastSaved && (
            <p className="text-xs text-muted-foreground text-right">
              💾 Saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{assignment.questions?.length || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{assignment.total_points || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Time</p>
                <p className="text-2xl font-bold">{estimatedTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                <p className="text-2xl font-bold capitalize">{difficulty}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basics" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basics
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Basics */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Basic information and physics curriculum alignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={assignment.title}
                onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Forces and Motion Quiz"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={assignment.description}
                onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the assignment..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={assignment.instructions}
                onChange={(e) => setAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for students..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physics Curriculum Alignment</CardTitle>
            <CardDescription>
              Link this assignment to your physics curriculum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Physics Unit</Label>
                <Select
                  value={selectedUnit}
                  onValueChange={(value) => {
                    setSelectedUnit(value)
                    setAssignment(prev => ({ ...prev, lesson_id: '' })) // Reset lesson when unit changes
                  }}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select physics unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {physicsUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="lesson">Related Lesson (Optional)</Label>
                <Select
                  value={assignment.lesson_id}
                  onValueChange={(value) => {
                    // Map the lesson slug to its database UUID
                    const dbId = dbLessons[value] || value // Use the mapping if available, otherwise use the value as-is
                    setAssignment(prev => ({ ...prev, lesson_id: dbId }))
                  }}
                  disabled={!selectedUnit}
                >
                  <SelectTrigger id="lesson">
                    <SelectValue placeholder={selectedUnit ? "Select lesson" : "Select unit first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags & Topics</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag (e.g., kinematics, forces)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tags help organize and filter assignments. Press Enter or click Add to add a tag.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(value as 'beginner' | 'intermediate' | 'advanced')}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Beginner
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Intermediate
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Advanced
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimated-time">Estimated Completion Time</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="estimated-time"
                    type="number"
                    min="5"
                    max="180"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => setActiveTab('content')} size="lg">
            Continue to Questions
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        </TabsContent>

        {/* Tab 2: Content (Questions) */}
        <TabsContent value="content" className="space-y-6">

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assignment Questions</CardTitle>
                  <CardDescription>
                    Build your assignment with various question types or import from Question Bank
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setShowQuestionBank(true)}
                    variant="outline"
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 dark:from-indigo-950 dark:to-purple-950"
                  >
                    <Library className="h-4 w-4 mr-2" />
                    Question Bank
                  </Button>
                  <Select onValueChange={(value) => addQuestion(value as Question['type'])}>
                    <SelectTrigger className="w-52">
                      <Plus className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Add Question Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          Multiple Choice
                        </div>
                      </SelectItem>
                      <SelectItem value="open-response">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-purple-500" />
                          Open Response (AI Graded)
                        </div>
                      </SelectItem>
                      <SelectItem value="numerical">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          Numerical Answer
                        </div>
                      </SelectItem>
                      <SelectItem value="essay">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          Essay
                        </div>
                      </SelectItem>
                      <SelectItem value="vocabulary-matching">Vocabulary Matching</SelectItem>
                      <SelectItem value="vocabulary-crossword">Vocabulary Crossword</SelectItem>
                      <SelectItem value="vocabulary-fill-blank">Fill in the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!assignment.questions?.length ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Target className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No questions added yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start building your assignment by adding questions or importing from the Question Bank
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => addQuestion()} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Question
                    </Button>
                    <Button onClick={() => setShowQuestionBank(true)} variant="outline" size="lg">
                      <Library className="h-4 w-4 mr-2" />
                      Browse Question Bank
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignment.questions.map((question, index) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                      onDelete={() => deleteQuestion(index)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab('basics')} variant="outline">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Basics
            </Button>
            <Button onClick={() => setActiveTab('settings')} size="lg">
              Continue to Settings
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Settings</CardTitle>
              <CardDescription>
                Configure due dates, access, and behavior options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="due-date">Due Date & Time</Label>
                <Input
                  id="due-date"
                  type="datetime-local"
                  value={assignment.due_date?.slice(0, 16) || ''}
                  onChange={(e) => setAssignment(prev => ({ 
                    ...prev, 
                    due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Students can still submit after the due date unless you set a hard deadline
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>Additional Options</Label>
                    <p className="text-xs text-muted-foreground">More features coming soon</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 opacity-50">
                  <div>
                    <Label>Time Limit (Coming Soon)</Label>
                    <Input placeholder="No time limit" disabled />
                  </div>
                  <div>
                    <Label>Max Attempts (Coming Soon)</Label>
                    <Input placeholder="Unlimited" disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab('content')} variant="outline">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Questions
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => saveAssignment(false)} variant="outline" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={() => saveAssignment(true)} disabled={saving} size="lg">
                <Eye className="h-4 w-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish Assignment'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Question Bank Modal */}
      {showQuestionBank && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Question Bank</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on any question to add it to your assignment
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuestionBank(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <QuestionBankBrowser
                onSelectQuestion={(question: QuestionBankItem) => {
                  handleAddFromBank(question)
                  setShowQuestionBank(false)
                }}
                selectionMode={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
