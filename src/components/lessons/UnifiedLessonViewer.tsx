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
  Home
} from 'lucide-react'

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
    question_timing?: 'before' | 'after' | 'mixed'
    objectives?: string[]
    prerequisites?: string[]
    difficulty?: string
    estimated_time?: number
    unit?: string
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
                      <MarkdownLessonContent lesson={lesson} onComplete={onComplete} />
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

// Markdown Lesson Content (Legacy)
function MarkdownLessonContent({ 
  lesson,
  onComplete 
}: { 
  lesson: any
  onComplete?: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200 border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Reading Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-900">
            Read through the lesson content and work through examples.
          </p>
        </CardContent>
      </Card>

      {lesson.content && (
        <Card>
          <CardContent className="py-6 prose prose-slate max-w-none">
            <MathMarkdown content={lesson.content} />
          </CardContent>
        </Card>
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
              <div className="text-sm font-medium">{question.question?.question || 'Question'}</div>
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
