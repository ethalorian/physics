'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MathMarkdown from '@/components/MathMarkdown'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { ContentBlock } from '@/data/content-blocks'
import StudentLessonViewer from '@/components/lessons/StudentLessonViewer'
import { 
  CheckCircle, 
  Lock, 
  Play, 
  FileText,
  Clock,
  Target,
  Loader2,
  BookOpen,
  Video,
  Microscope,
  ChevronRight,
  AlertCircle,
  Award,
  BarChart3,
  ListChecks,
  Home,
  GraduationCap
} from 'lucide-react'

interface TAReaction {
  reaction: string
  taName: string
  generatedAt: string
}

interface KeyTerm {
  term: string
  definition: string
}

interface CheckQuestion {
  question: string
  answer: string
}

interface UnifiedLessonViewerProps {
  lesson: {
    id: string
    slug: string
    title: string
    description?: string
    content?: string
    lesson_type: 'video' | 'simulation' | 'markdown'
    videos?: any[]
    simulation_id?: string
    simulation?: {
      id: string
      slug: string
      title: string
      description?: string
      difficulty: string
      estimated_time?: number
    }
    embedded_questions?: any[]
    content_blocks?: ContentBlock[]
    question_timing?: 'before' | 'after' | 'mixed'
    objectives?: string[]
    prerequisites?: string[]
    difficulty?: string
    estimated_time?: number
    unit?: string
    // New fields for enhanced reading lessons
    ta_reactions?: {
      jose?: TAReaction
      marialys?: TAReaction
    }
    key_terms?: KeyTerm[]
    check_for_understanding?: CheckQuestion[]
    mastery_level?: string
    generation_metadata?: {
      topic?: string
      environments?: string[]
      wordCount?: number
      generatedAt?: string
      aiModel?: string
    }
  }
  onProgress?: (lessonId: string, progress: number) => void
  onComplete?: (lessonId: string) => void
}

export default function UnifiedLessonViewer({ 
  lesson, 
  onProgress,
  onComplete 
}: UnifiedLessonViewerProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('content')
  const [progress, setProgress] = useState(0)
  const [simulationLoaded, setSimulationLoaded] = useState(false)

  // Update progress when it changes
  useEffect(() => {
    if (progress > 0 && onProgress) {
      onProgress(lesson.id, progress)
    }
    if (progress === 100 && onComplete) {
      onComplete(lesson.id)
    }
  }, [progress, lesson.id, onProgress, onComplete])

  // Get lesson type icon and color
  const getLessonTypeInfo = () => {
    switch (lesson.lesson_type) {
      case 'video':
        return { icon: Video, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Video Lesson' }
      case 'simulation':
        return { icon: Microscope, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Interactive Simulation' }
      case 'markdown':
        return { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Reading' }
      default:
        return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Lesson' }
    }
  }

  const typeInfo = getLessonTypeInfo()
  const TypeIcon = typeInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Hero Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
            <ChevronRight className="h-4 w-4" />
            <Button variant="ghost" size="sm" onClick={() => router.push('/lessons')}>
              Lessons
            </Button>
            <ChevronRight className="h-4 w-4" />
            {lesson.unit && (
              <>
                <span>{lesson.unit}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground font-medium">{lesson.title}</span>
          </div>

          {/* Title Section */}
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${typeInfo.bg} ${typeInfo.border} border-2`}>
                    <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{typeInfo.label}</div>
                    <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
                  </div>
                </div>
                
                {lesson.description && (
                  <p className="text-lg text-muted-foreground max-w-3xl">
                    {lesson.description}
                  </p>
                )}
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-col gap-2">
                {lesson.difficulty && (
                  <Badge variant="outline" className="justify-center">
                    {lesson.difficulty}
                  </Badge>
                )}
                {lesson.estimated_time && (
                  <Badge variant="secondary" className="justify-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {lesson.estimated_time} min
                  </Badge>
                )}
                {progress > 0 && (
                  <Badge variant="default" className="justify-center bg-green-600">
                    <Award className="h-3 w-3 mr-1" />
                    {progress.toFixed(0)}% Complete
                  </Badge>
                )}
              </div>
            </div>

            {/* Objectives Card */}
            {lesson.objectives && lesson.objectives.length > 0 && (
              <Card className={`${typeInfo.bg} ${typeInfo.border} border-2`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-white ${typeInfo.border} border`}>
                      <Target className={`h-5 w-5 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <span>Learning Objectives</span>
                        <Badge variant="secondary" className="text-xs">
                          {lesson.objectives.length} goals
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                        {lesson.objectives.map((obj, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className={`h-4 w-4 ${typeInfo.color} flex-shrink-0 mt-0.5`} />
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {lesson.prerequisites && lesson.prerequisites.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900 mb-1">Prerequisites</div>
                  <div className="text-sm text-amber-800 space-y-1">
                    {lesson.prerequisites.map((prereq, i) => (
                      <div key={i}>• {prereq}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">{progress.toFixed(0)}% Complete</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Tabbed Interface */}
            <Card className="border-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content" className="gap-2">
                      <Play className="h-4 w-4" />
                      Main Content
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="gap-2">
                      <ListChecks className="h-4 w-4" />
                      Questions
                      {lesson.embedded_questions && lesson.embedded_questions.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {lesson.embedded_questions.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Your Progress
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Content Tab */}
                  <TabsContent value="content" className="mt-0 space-y-6">
                    {lesson.content_blocks && lesson.content_blocks.length > 0 ? (
                      <BlockRenderer blocks={lesson.content_blocks} lessonId={lesson.id} />
                    ) : (
                      <>
                        {lesson.lesson_type === 'simulation' && lesson.simulation && (
                          <SimulationLessonContent
                            lesson={lesson}
                            onComplete={onComplete}
                            onLoad={() => setSimulationLoaded(true)}
                          />
                        )}

                        {lesson.lesson_type === 'video' && lesson.videos && lesson.videos.length > 0 && (
                          <VideoLessonContent lesson={lesson} onComplete={onComplete} />
                        )}

                        {lesson.lesson_type === 'markdown' && lesson.content && (
                          <MarkdownLessonContent
                            lesson={lesson}
                            onComplete={onComplete}
                            onProgressUpdate={(p) => setProgress(p)}
                          />
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Questions Tab */}
                  <TabsContent value="questions" className="mt-0">
                    <QuestionsSummary lesson={lesson} />
                  </TabsContent>

                  {/* Progress Tab */}
                  <TabsContent value="progress" className="mt-0">
                    <ProgressDashboard lesson={lesson} progress={progress} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar (1 column) */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lesson Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline">{typeInfo.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{lesson.estimated_time || '—'} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge variant="secondary">{lesson.difficulty || 'Intermediate'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="font-medium">{lesson.unit || '—'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button className="w-full" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    {progress > 0 ? 'Continue Lesson' : 'Start Lesson'}
                  </Button>
                  {progress === 100 && (
                    <Button variant="outline" className="w-full" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Review Lesson
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Learning Path */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Path</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <LearningPathItem 
                  status="complete" 
                  title="Prerequisites" 
                  count={lesson.prerequisites?.length || 0}
                />
                <LearningPathItem 
                  status={progress > 0 ? 'active' : 'locked'} 
                  title="Main Content" 
                  isActive
                />
                <LearningPathItem 
                  status={progress === 100 ? 'complete' : 'locked'} 
                  title="Assessment" 
                  count={lesson.embedded_questions?.length || 0}
                />
                <LearningPathItem 
                  status="locked" 
                  title="Next Lesson" 
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {lesson.lesson_type === 'simulation' && lesson.simulation && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-sm text-purple-900">Simulation Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push(`/simulations/${lesson.simulation!.slug}`)}
                  >
                    <Microscope className="h-4 w-4 mr-2" />
                    Open in Simulation Mode
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View Instructions
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Learning Path Item Component
function LearningPathItem({ 
  status, 
  title, 
  count,
  isActive = false
}: { 
  status: 'complete' | 'active' | 'locked'
  title: string
  count?: number
  isActive?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${isActive ? 'bg-primary/5 border-2 border-primary' : ''}`}>
      <div className={`flex-shrink-0 ${
        status === 'complete' ? 'text-green-600' :
        status === 'active' ? 'text-primary' :
        'text-muted-foreground'
      }`}>
        {status === 'complete' ? <CheckCircle className="h-5 w-5" /> :
         status === 'active' ? <Play className="h-5 w-5" /> :
         <Lock className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${
          status === 'locked' ? 'text-muted-foreground' : ''
        }`}>
          {title}
        </div>
        {count !== undefined && count > 0 && (
          <div className="text-xs text-muted-foreground">{count} items</div>
        )}
      </div>
    </div>
  )
}

// Simulation Lesson Content
function SimulationLessonContent({ 
  lesson,
  onComplete,
  onLoad
}: { 
  lesson: any
  onComplete?: (id: string) => void
  onLoad?: () => void
}) {
  const router = useRouter()
  const [SimulationComponent, setSimulationComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lesson.simulation?.slug) {
      setLoading(true)
      // Dynamically import the simulation
      import(`@/app/simulations/${lesson.simulation.slug}/page`)
        .then((module) => {
          setSimulationComponent(() => module.default)
          setLoading(false)
          onLoad?.()
        })
        .catch((err) => {
          console.error('Failed to load simulation:', err)
          setError('Failed to load simulation')
          setLoading(false)
        })
    }
  }, [lesson.simulation?.slug, onLoad])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading simulation...</p>
        </div>
      </div>
    )
  }

  if (error || !SimulationComponent) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-900 font-semibold">Simulation not available</p>
          <p className="text-red-700 text-sm mt-2 mb-4">
            This lesson references a simulation that couldn't be loaded.
          </p>
          <Button onClick={() => router.push('/simulations')}>
            Browse All Simulations
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simulation Instructions */}
      <Card className="bg-purple-50 border-purple-200 border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Microscope className="h-5 w-5 text-purple-600" />
            Interactive Simulation: {lesson.simulation?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-purple-900 mb-4">
            {lesson.simulation?.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-purple-700">
            <Clock className="h-3 w-3" />
            <span>Estimated: {lesson.simulation?.estimated_time || 20} minutes</span>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Simulation */}
      <div className="border-4 border-primary/20 rounded-xl overflow-hidden shadow-lg">
        <SimulationComponent />
      </div>
    </div>
  )
}

// Video Lesson Content
function VideoLessonContent({ 
  lesson,
  onComplete 
}: { 
  lesson: any
  onComplete?: (id: string) => void
}) {
  // Use existing StudentLessonViewer for video lessons
  return <StudentLessonViewer lesson={lesson} />
}

// Markdown Lesson Content - Enhanced with all reading lesson features
function MarkdownLessonContent({ 
  lesson,
  onComplete,
  onProgressUpdate
}: { 
  lesson: any
  onComplete?: (id: string) => void
  onProgressUpdate?: (progress: number) => void
}) {
  const [contentRead, setContentRead] = useState(false)
  const [questionsCompleted, setQuestionsCompleted] = useState<Record<string, boolean>>({})
  const [checkAnswersRevealed, setCheckAnswersRevealed] = useState<Record<number, boolean>>({})
  const [taReactionsRead, setTaReactionsRead] = useState({ jose: false, marialys: false })
  const [expandedTerms, setExpandedTerms] = useState<Record<number, boolean>>({})

  // Calculate overall progress
  const calculateProgress = () => {
    const components: boolean[] = []
    
    // Content read (30%)
    components.push(contentRead)
    
    // Embedded questions answered (40%)
    if (lesson.embedded_questions?.length > 0) {
      const answeredCount = Object.values(questionsCompleted).filter(Boolean).length
      const allAnswered = answeredCount === lesson.embedded_questions.length
      components.push(allAnswered)
    }
    
    // Check for understanding (20%)
    if (lesson.check_for_understanding?.length > 0) {
      const revealedCount = Object.values(checkAnswersRevealed).filter(Boolean).length
      const allRevealed = revealedCount === lesson.check_for_understanding.length
      components.push(allRevealed)
    }
    
    // TA reactions read (10%)
    if (lesson.ta_reactions?.jose || lesson.ta_reactions?.marialys) {
      const taRead = (lesson.ta_reactions?.jose ? taReactionsRead.jose : true) && 
                     (lesson.ta_reactions?.marialys ? taReactionsRead.marialys : true)
      components.push(taRead)
    }
    
    const completedComponents = components.filter(Boolean).length
    return components.length > 0 ? (completedComponents / components.length) * 100 : 0
  }

  const progress = calculateProgress()

  useEffect(() => {
    onProgressUpdate?.(progress)
    if (progress === 100) {
      onComplete?.(lesson.id)
    }
  }, [progress, lesson.id, onComplete, onProgressUpdate])

  return (
    <div className="space-y-8">
      {/* Reading Progress Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 border-2">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Your Progress</span>
            </div>
            <Badge variant={progress === 100 ? "default" : "secondary"} className={progress === 100 ? "bg-green-600" : ""}>
              {progress.toFixed(0)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className={`flex items-center gap-1 ${contentRead ? 'text-green-600' : 'text-slate-500'}`}>
              {contentRead ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
              Read Content
            </span>
            {lesson.embedded_questions?.length > 0 && (
              <span className={`flex items-center gap-1 ${Object.values(questionsCompleted).filter(Boolean).length === lesson.embedded_questions.length ? 'text-green-600' : 'text-slate-500'}`}>
                {Object.values(questionsCompleted).filter(Boolean).length === lesson.embedded_questions.length ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
                Answer Questions ({Object.values(questionsCompleted).filter(Boolean).length}/{lesson.embedded_questions.length})
              </span>
            )}
            {lesson.check_for_understanding?.length > 0 && (
              <span className={`flex items-center gap-1 ${Object.values(checkAnswersRevealed).filter(Boolean).length === lesson.check_for_understanding.length ? 'text-green-600' : 'text-slate-500'}`}>
                {Object.values(checkAnswersRevealed).filter(Boolean).length === lesson.check_for_understanding.length ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
                Check Understanding
              </span>
            )}
            {(lesson.ta_reactions?.jose || lesson.ta_reactions?.marialys) && (
              <span className={`flex items-center gap-1 ${(taReactionsRead.jose || !lesson.ta_reactions?.jose) && (taReactionsRead.marialys || !lesson.ta_reactions?.marialys) ? 'text-green-600' : 'text-slate-500'}`}>
                {(taReactionsRead.jose || !lesson.ta_reactions?.jose) && (taReactionsRead.marialys || !lesson.ta_reactions?.marialys) ? <CheckCircle className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full border" />}
                Read TA Tips
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Lesson Content */}
      {lesson.content && (
        <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
              Lesson Content
          </CardTitle>
        </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <MathMarkdown content={lesson.content} />
            {!contentRead && (
              <div className="mt-6 pt-6 border-t">
                <Button onClick={() => setContentRead(true)} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
              </div>
            )}
            {contentRead && (
              <div className="mt-6 pt-6 border-t flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Content completed!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Embedded Questions */}
      {lesson.embedded_questions && lesson.embedded_questions.length > 0 && (
        <Card className="border-2 border-violet-200">
          <CardHeader className="bg-violet-50">
            <CardTitle className="text-lg flex items-center gap-2 text-violet-900">
              <ListChecks className="h-5 w-5" />
              Check Your Understanding ({Object.values(questionsCompleted).filter(Boolean).length}/{lesson.embedded_questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {lesson.embedded_questions.map((q: any, idx: number) => (
              <EmbeddedQuestionCard 
                key={q.id || idx}
                question={q}
                number={idx + 1}
                completed={questionsCompleted[q.id || idx]}
                onComplete={(correct) => {
                  setQuestionsCompleted(prev => ({...prev, [q.id || idx]: true}))
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Terms / Vocabulary */}
      {lesson.key_terms && lesson.key_terms.length > 0 && (
        <Card className="border-2 border-amber-200">
          <CardHeader className="bg-amber-50">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <BookOpen className="h-5 w-5" />
              Key Terms ({lesson.key_terms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid md:grid-cols-2 gap-3">
              {lesson.key_terms.map((term: KeyTerm, idx: number) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-white border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                  onClick={() => setExpandedTerms(prev => ({...prev, [idx]: !prev[idx]}))}
                >
                  <div className="font-semibold text-amber-800 flex items-center justify-between">
                    {term.term}
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedTerms[idx] ? 'rotate-90' : ''}`} />
                  </div>
                  {expandedTerms[idx] && (
                    <div className="text-sm text-slate-600 mt-2 pt-2 border-t border-amber-100">
                      {term.definition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TA Reactions - Jose & Marialys */}
      {(lesson.ta_reactions?.jose || lesson.ta_reactions?.marialys) && (
        <Card className="border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
              <span className="text-xl">🎓</span>
              Student TA Insights
            </CardTitle>
            <p className="text-sm text-indigo-600 mt-1">
              Your student Teaching Assistants share their thoughts on this lesson
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {lesson.ta_reactions?.jose && (
                <TAReactionCard 
                  ta="jose"
                  reaction={lesson.ta_reactions.jose}
                  read={taReactionsRead.jose}
                  onRead={() => setTaReactionsRead(prev => ({...prev, jose: true}))}
                />
              )}
              {lesson.ta_reactions?.marialys && (
                <TAReactionCard 
                  ta="marialys"
                  reaction={lesson.ta_reactions.marialys}
                  read={taReactionsRead.marialys}
                  onRead={() => setTaReactionsRead(prev => ({...prev, marialys: true}))}
                />
              )}
            </div>
        </CardContent>
      </Card>
      )}

      {/* Check for Understanding */}
      {lesson.check_for_understanding && lesson.check_for_understanding.length > 0 && (
        <Card className="border-2 border-emerald-200">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
              <Target className="h-5 w-5" />
              Final Check ({Object.values(checkAnswersRevealed).filter(Boolean).length}/{lesson.check_for_understanding.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {lesson.check_for_understanding.map((item: CheckQuestion, idx: number) => (
              <div key={idx} className="p-4 rounded-lg bg-white border border-emerald-100">
                <div className="font-medium text-emerald-800 mb-3">
                  Q{idx + 1}: {item.question}
                </div>
                {!checkAnswersRevealed[idx] ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCheckAnswersRevealed(prev => ({...prev, [idx]: true}))}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    Reveal Answer
                  </Button>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-sm text-emerald-800">
                      <MathMarkdown content={item.answer} skipAutoDetect={true} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {progress === 100 && (
        <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">🎉 Lesson Complete!</h3>
            <p className="text-green-700">
              Great job! You've completed all sections of this lesson.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Embedded Question Card Component
function EmbeddedQuestionCard({ 
  question, 
  number, 
  completed,
  onComplete 
}: { 
  question: any
  number: number
  completed?: boolean
  onComplete: (correct: boolean) => void
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [reflectionText, setReflectionText] = useState('')

  const isCorrect = question.correctAnswer !== undefined && selectedAnswer === question.correctAnswer

  const handleSubmit = () => {
    setShowResult(true)
    onComplete(isCorrect)
  }

  if (completed && showResult) {
    return (
      <div className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-200' : 'bg-amber-200'}`}>
            {isCorrect ? <CheckCircle className="h-5 w-5 text-green-700" /> : <AlertCircle className="h-5 w-5 text-amber-700" />}
          </div>
          <div className="flex-1">
            <div className="font-medium mb-2">Q{number}: {question.question}</div>
            <div className={`text-sm ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
              {isCorrect ? '✓ Correct!' : `The correct answer was: ${question.options?.[question.correctAnswer]}`}
            </div>
            {question.explanation && (
              <div className="mt-2 p-2 rounded bg-white/50 text-sm">
                <MathMarkdown content={question.explanation} skipAutoDetect={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg border border-violet-200 bg-white">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-violet-700">{number}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="font-medium">{question.question}</div>
          
          {/* Multiple Choice */}
          {question.options && (
            <div className="space-y-2">
              {question.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  disabled={showResult}
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    selectedAnswer === idx 
                      ? 'border-violet-500 bg-violet-50' 
                      : 'border-slate-200 hover:border-violet-300'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}
          
          {/* Reflection/Open Response */}
          {question.type === 'reflection' || question.type === 'open-response' ? (
            <div className="space-y-2">
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Type your response..."
                className="w-full p-3 border rounded-lg min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                disabled={showResult}
              />
            </div>
          ) : null}

          {/* Submit Button */}
          {!showResult && (
            <Button 
              onClick={handleSubmit}
              disabled={question.options ? selectedAnswer === null : !reflectionText.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Submit Answer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// TA Reaction Card Component  
function TAReactionCard({ 
  ta, 
  reaction, 
  read,
  onRead 
}: { 
  ta: 'jose' | 'marialys'
  reaction: TAReaction
  read: boolean
  onRead: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  
  const taInfo = {
    jose: {
      emoji: '⚽🏐',
      name: 'Jose',
      title: 'Volleyball & Soccer • Energy Expert',
      bgClass: 'bg-gradient-to-br from-blue-100 to-indigo-100',
      borderClass: 'border-blue-300',
      textClass: 'text-blue-900',
      accentClass: 'text-blue-700'
    },
    marialys: {
      emoji: '🏃‍♀️🥏',
      name: 'Marialys',
      title: 'Track & Field • Forces Expert',
      bgClass: 'bg-gradient-to-br from-purple-100 to-pink-100',
      borderClass: 'border-purple-300',
      textClass: 'text-purple-900',
      accentClass: 'text-purple-700'
    }
  }

  const info = taInfo[ta]

  useEffect(() => {
    if (expanded && !read) {
      onRead()
    }
  }, [expanded, read, onRead])

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${info.bgClass} ${info.borderClass}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-white/30 transition-colors"
      >
        <span className="text-2xl">{info.emoji}</span>
        <div className="flex-1 text-left">
          <div className={`font-bold ${info.textClass}`}>{info.name}</div>
          <div className="text-xs text-slate-600">{info.title}</div>
        </div>
        <div className="flex items-center gap-2">
          {read && <CheckCircle className="h-4 w-4 text-green-600" />}
          <ChevronRight className={`h-5 w-5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4">
          {/* Clean plain text content */}
          <div className={`text-sm leading-relaxed whitespace-pre-wrap ${info.textClass}`}>
            {reaction.reaction}
          </div>
        </div>
      )}
    </div>
  )
}

// Questions Summary
function QuestionsSummary({ lesson }: { lesson: any }) {
  const beforeQuestions = lesson.embedded_questions?.filter((q: any) => q.timing === 'before') || []
  const afterQuestions = lesson.embedded_questions?.filter((q: any) => q.timing === 'after') || []

  if (!lesson.embedded_questions || lesson.embedded_questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No questions have been added to this lesson yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {beforeQuestions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Pre-Simulation Questions ({beforeQuestions.length})
          </h3>
          <div className="space-y-3">
            {beforeQuestions.map((q: any, i: number) => (
              <QuestionCard key={q.id} question={q} number={i + 1} />
            ))}
          </div>
        </div>
      )}

      {afterQuestions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Post-Simulation Questions ({afterQuestions.length})
          </h3>
          <div className="space-y-3">
            {afterQuestions.map((q: any, i: number) => (
              <QuestionCard key={q.id} question={q} number={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionCard({ question, number }: { question: any; number: number }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{number}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-sm font-medium">
                <MathMarkdown content={question.question?.question || 'Question'} />
              </div>
              <Badge variant="secondary">{question.question?.points || 0} pts</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {question.question?.type || 'unknown'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.timing}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Progress Dashboard
function ProgressDashboard({ lesson, progress }: { lesson: any; progress: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{progress.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Complete</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">0</div>
            <div className="text-xs text-muted-foreground mt-1">Time Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">—</div>
            <div className="text-xs text-muted-foreground mt-1">Score</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Lesson started</p>
            <p>• No activities recorded yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
