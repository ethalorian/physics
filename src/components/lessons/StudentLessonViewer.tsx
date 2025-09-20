"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  BookOpen, 
  Clock, 
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import MathMarkdown from '@/components/MathMarkdown'

interface LessonObjective {
  id: string
  text: string
  completed?: boolean
}

interface LessonVideo {
  id: string
  title: string
  youtubeId: string
  duration?: string
  description?: string
  timestamp?: number // For starting at specific time
}

interface StudentLessonViewerProps {
  lesson: {
    id: string
    title: string
    description?: string
    content?: string
    unit: string
    lesson_number: number
    objectives?: string[]
    videos?: LessonVideo[]
    estimated_time?: number
  }
  onProgress?: (lessonId: string, progress: number) => void
  onComplete?: (lessonId: string) => void
}

// YouTube embed component with mobile-first design
function YouTubeEmbed({ 
  videoId, 
  title, 
  timestamp = 0,
  onReady,
  className = "" 
}: { 
  videoId: string
  title: string
  timestamp?: number
  onReady?: () => void
  className?: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
    autoplay: '0',
    controls: '1',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    fs: '1',
    cc_load_policy: '1',
    iv_load_policy: '3',
    start: timestamp.toString(),
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : ''
  })}`

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
      onReady?.()
    }, 100)
    return () => clearTimeout(timer)
  }, [onReady])

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full pb-[56.25%] h-0">
        {isLoaded ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={title}
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Video overlay for mobile touch targets */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 md:p-4">
        <div className="flex items-center justify-between text-white text-sm">
          <span className="truncate font-medium">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-white hover:bg-white/20 p-1 h-auto min-w-0"
            asChild
          >
            <a 
              href={`https://www.youtube.com/watch?v=${videoId}${timestamp ? `&t=${timestamp}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in YouTube"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Collapsible section component
function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false,
  icon: Icon
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: any
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-600" />}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

// Learning objectives component
function LearningObjectives({ 
  objectives, 
  onObjectiveToggle 
}: { 
  objectives: LessonObjective[]
  onObjectiveToggle: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      {objectives.map((objective) => (
        <div
          key={objective.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => onObjectiveToggle(objective.id)}
        >
          <div className={`mt-0.5 transition-colors ${
            objective.completed 
              ? 'text-green-600' 
              : 'text-gray-400'
          }`}>
            <CheckCircle className={`h-5 w-5 ${
              objective.completed ? 'fill-current' : ''
            }`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm leading-relaxed transition-colors ${
              objective.completed 
                ? 'text-gray-600 line-through' 
                : 'text-gray-900'
            }`}>
              {objective.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StudentLessonViewer({ 
  lesson, 
  onProgress,
  onComplete 
}: StudentLessonViewerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [objectives, setObjectives] = useState<LessonObjective[]>(() => 
    lesson.objectives?.map((text, index) => ({
      id: `obj-${index}`,
      text,
      completed: false
    })) || []
  )
  const [progress, setProgress] = useState(0)
  const [isContentExpanded, setIsContentExpanded] = useState(false)

  // Calculate progress based on completed objectives
  useEffect(() => {
    const completedCount = objectives.filter(obj => obj.completed).length
    const newProgress = objectives.length > 0 ? (completedCount / objectives.length) * 100 : 0
    setProgress(newProgress)
    onProgress?.(lesson.id, newProgress)

    // Mark lesson complete if all objectives are done
    if (newProgress === 100 && objectives.length > 0) {
      onComplete?.(lesson.id)
    }
  }, [objectives, lesson.id, onProgress, onComplete])

  const toggleObjective = (id: string) => {
    setObjectives(prev => 
      prev.map(obj => 
        obj.id === id ? { ...obj, completed: !obj.completed } : obj
      )
    )
  }

  const currentVideo = lesson.videos?.[currentVideoIndex]
  const hasMultipleVideos = (lesson.videos?.length || 0) > 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-xs">
              {lesson.unit}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Lesson {lesson.lesson_number}
            </Badge>
            {lesson.estimated_time && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                {lesson.estimated_time}min
              </div>
            )}
          </div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-2">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {lesson.description}
            </p>
          )}
          
          {/* Progress bar */}
          {objectives.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
        
        {/* Featured Video Section - Hero Style */}
        {currentVideo && (
          <div className="space-y-4">
            {/* Video Hero Card */}
            <Card className="overflow-hidden shadow-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-0">
                {/* Video Player with Enhanced Styling */}
                <div className="relative">
                  <YouTubeEmbed
                    videoId={currentVideo.youtubeId}
                    title={currentVideo.title}
                    timestamp={currentVideo.timestamp}
                    className="w-full shadow-lg"
                  />
                  {/* Video badge overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1">
                      📹 Watch & Learn
                    </Badge>
                  </div>
                  {hasMultipleVideos && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" className="bg-black/70 text-white border-0">
                        Video {currentVideoIndex + 1} of {lesson.videos?.length}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Video Info */}
                <div className="p-6 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">
                          {currentVideo.title}
                        </h2>
                      </div>
                      {currentVideo.description && (
                        <p className="text-gray-700 leading-relaxed mb-3 text-base">
                          {currentVideo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {currentVideo.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{currentVideo.duration}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>Physics Lesson</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multiple Video Navigation - Enhanced */}
                  {hasMultipleVideos && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">More Videos in This Lesson</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {lesson.videos?.map((video, index) => (
                          <Button
                            key={video.id}
                            variant={index === currentVideoIndex ? "default" : "outline"}
                            size="sm"
                            className={`h-auto p-3 text-left justify-start ${
                              index === currentVideoIndex 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                                : "hover:bg-blue-50 hover:border-blue-200"
                            }`}
                            onClick={() => setCurrentVideoIndex(index)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === currentVideoIndex 
                                  ? "bg-white text-blue-600" 
                                  : "bg-blue-100 text-blue-600"
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium text-sm">
                                  {video.title}
                                </div>
                                {video.duration && (
                                  <div className="text-xs opacity-75 mt-1">
                                    {video.duration}
                                  </div>
                                )}
                              </div>
                              {index === currentVideoIndex && (
                                <Play className="h-3 w-3 flex-shrink-0" />
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Call-to-Action for Video Engagement */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">Ready to Learn?</h3>
                    <p className="text-sm text-green-700">
                      Watch the video above, then complete the learning objectives below to master this lesson!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call-to-Action for Video Engagement */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">Ready to Learn?</h3>
                    <p className="text-sm text-green-700">
                      Watch the video above, then complete the learning objectives below to master this lesson!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Learning Objectives */}
        {objectives.length > 0 && (
          <CollapsibleSection
            title="Learning Objectives"
            defaultOpen={true}
            icon={Target}
          >
            <LearningObjectives 
              objectives={objectives}
              onObjectiveToggle={toggleObjective}
            />
          </CollapsibleSection>
        )}

        {/* Lesson Content */}
        {lesson.content && (
          <CollapsibleSection
            title="Lesson Content"
            defaultOpen={false}
            icon={BookOpen}
          >
            <div className="prose prose-sm max-w-none">
              <MathMarkdown content={lesson.content} />
            </div>
          </CollapsibleSection>
        )}

        {/* Completion Status */}
        {progress === 100 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600 fill-current" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Lesson Complete!</h3>
                  <p className="text-sm text-green-700">
                    Great job! You&apos;ve completed all learning objectives.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom spacing for mobile */}
        <div className="h-8" />
      </div>
    </div>
  )
}
