"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Clock,
  AlertCircle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CheckCircle,
  X,
  Save as SaveIcon,
  Video as VideoIcon
} from 'lucide-react'
import { VideoQuestion, Question } from '@/types/assignment'
import QuestionEditor from '@/components/assignment-builder/question-editor'
import MathMarkdown from '@/components/MathMarkdown'

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface VideoQuestionEditorProps {
  videoId: string
  videoTitle: string
  youtubeId: string
  videoDuration?: string
  initialQuestions?: VideoQuestion[]
  onSave: (questions: VideoQuestion[]) => Promise<void>
  onClose: () => void
}

// Convert duration string (e.g., "5:30") to seconds
function durationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

// Convert seconds to MM:SS format
function secondsToMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Video Player with Scrubbing
function VideoPlayerWithScrubber({
  youtubeId,
  duration,
  currentTime,
  onTimeChange,
  onAddQuestionAtTime,
  onDurationDetected
}: {
  youtubeId: string
  duration: number
  currentTime: number
  onTimeChange: (time: number) => void
  onAddQuestionAtTime: (time: number) => void
  onDurationDetected?: (duration: number) => void
}) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [actualDuration, setActualDuration] = useState<number | null>(null)
  const updateInterval = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      // Wait a bit for the container to be ready
      setTimeout(() => initializePlayer(), 100)
      return
    }

    // Check if script is already in the document
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    
    if (!existingScript) {
      // Load the IFrame Player API code asynchronously
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    // API will call this function when ready
    const originalCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready')
      setTimeout(() => initializePlayer(), 100)
      if (originalCallback && typeof originalCallback === 'function') {
        originalCallback()
      }
    }

    // Fallback: Try to initialize every second for up to 10 seconds
    const retryInterval = setInterval(() => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        console.log('Retrying player initialization')
        initializePlayer()
        clearInterval(retryInterval)
      }
    }, 1000)

    // Cleanup after 10 seconds
    const cleanup = setTimeout(() => {
      clearInterval(retryInterval)
    }, 10000)

    return () => {
      clearInterval(retryInterval)
      clearTimeout(cleanup)
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.error('Error destroying player:', e)
        }
      }
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
      }
    }
  }, [youtubeId])

  const initializePlayer = () => {
    if (!containerRef.current) {
      console.log('Container not ready yet')
      return
    }

    if (playerRef.current) {
      console.log('Player already exists')
      return
    }

    try {
      // Create a div for the player if it doesn't exist
      if (!containerRef.current.children.length) {
        const playerDiv = document.createElement('div')
        containerRef.current.appendChild(playerDiv)
        
        playerRef.current = new window.YT.Player(playerDiv, {
          videoId: youtubeId,
          width: '100%',
          height: '360',
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready')
              setIsPlayerReady(true)
              
              // Get actual video duration
              try {
                if (typeof event.target.getDuration === 'function') {
                  const videoDuration = event.target.getDuration()
                  if (typeof videoDuration === 'number' && videoDuration > 0) {
                    console.log('Detected video duration:', videoDuration)
                    setActualDuration(videoDuration)
                    onDurationDetected?.(Math.floor(videoDuration))
                  }
                }
              } catch (error) {
                console.error('Error getting video duration:', error)
              }
            },
            onStateChange: (event: any) => {
              // YT.PlayerState.PLAYING = 1
              // YT.PlayerState.PAUSED = 2
              if (event.data === 1) {
                setIsPlaying(true)
                startTimeUpdates()
              } else {
                setIsPlaying(false)
                stopTimeUpdates()
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data)
            }
          }
        })
      }
    } catch (error) {
      console.error('Error initializing YouTube player:', error)
    }
  }

  const startTimeUpdates = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current)
    }
    updateInterval.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime()
          if (typeof time === 'number' && !isNaN(time)) {
            onTimeChange(time)
          }
        } catch (error) {
          // Silently fail - player might not be ready yet
        }
      }
    }, 100)
  }

  const stopTimeUpdates = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current)
      updateInterval.current = null
    }
  }

  const handlePlayPause = () => {
    if (!playerRef.current || !isPlayerReady) return
    try {
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo()
        }
      } else {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo()
        }
      }
    } catch (error) {
      console.error('Error controlling playback:', error)
    }
  }

  const handleSkipBack = () => {
    if (!playerRef.current || !isPlayerReady) return
    try {
      const newTime = Math.max(0, currentTime - 5)
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(newTime, true)
        onTimeChange(newTime)
      }
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const handleSkipForward = () => {
    if (!playerRef.current || !isPlayerReady) return
    try {
      const maxDuration = actualDuration || duration
      const newTime = Math.min(maxDuration, currentTime + 5)
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(newTime, true)
        onTimeChange(newTime)
      }
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const handleSliderChange = (value: number[]) => {
    if (!playerRef.current || !isPlayerReady) return
    try {
      const newTime = value[0]
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(newTime, true)
        onTimeChange(newTime)
      }
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const handleAddQuestion = () => {
    onAddQuestionAtTime(Math.floor(currentTime))
  }

  const displayDuration = actualDuration || duration

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <div ref={containerRef} className="w-full h-full" />
        {!isPlayerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-sm">Loading video player...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
        {/* Playback Controls */}
        {!isPlayerReady && (
          <div className="text-center py-4 text-gray-600">
            <p className="text-sm font-medium">⏳ Initializing video controls...</p>
            <p className="text-xs mt-1">Controls will be available in a moment</p>
          </div>
        )}
        {actualDuration && actualDuration !== duration && (
          <div className="text-center py-2 px-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            ✓ Detected actual video length: <strong>{secondsToMMSS(actualDuration)}</strong>
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipBack}
            disabled={!isPlayerReady}
            title={!isPlayerReady ? "Loading..." : "Skip back 5 seconds"}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            size="lg"
            onClick={handlePlayPause}
            disabled={!isPlayerReady}
            className="w-16"
            title={!isPlayerReady ? "Loading..." : isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipForward}
            disabled={!isPlayerReady}
            title={!isPlayerReady ? "Loading..." : "Skip forward 5 seconds"}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="mx-4 px-4 py-2 bg-white rounded-md border border-gray-200 font-mono text-sm font-semibold">
            {secondsToMMSS(currentTime)} / {secondsToMMSS(displayDuration)}
          </div>

          <Button
            onClick={handleAddQuestion}
            disabled={!isPlayerReady}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            title={!isPlayerReady ? "Loading..." : `Add question at ${secondsToMMSS(currentTime)}`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question Here
          </Button>
        </div>

        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={displayDuration}
            step={0.1}
            onValueChange={handleSliderChange}
            disabled={!isPlayerReady}
            className="cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>0:00</span>
            <span className="text-purple-600 font-medium">Scrub to find the perfect moment</span>
            <span>{secondsToMMSS(displayDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Timeline component showing questions
function VideoTimeline({ 
  questions, 
  duration,
  currentTime,
  onQuestionClick
}: {
  questions: VideoQuestion[]
  duration: number
  currentTime: number
  onQuestionClick: (question: VideoQuestion) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>0:00</span>
        <span className="text-xs font-medium">Questions on Timeline</span>
        <span>{secondsToMMSS(duration)}</span>
      </div>
      
      <div className="relative h-16 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-lg border-2 border-gray-300">
        {/* Time markers */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
            <div key={percent} className="h-8 w-px bg-gray-300" />
          ))}
        </div>

        {/* Current playhead position */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-500" />
        </div>

        {/* Question markers */}
        {questions.map((q) => {
          const position = (q.timestamp / duration) * 100
          return (
            <button
              key={q.id}
              onClick={() => onQuestionClick(q)}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-20"
              style={{ left: `${position}%` }}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white">
                  {q.question.points}
                </div>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {secondsToMMSS(q.timestamp)} - {q.question.type}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded-sm" />
          <span>Current position</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
            3
          </div>
          <span>Question (points shown)</span>
        </div>
      </div>
    </div>
  )
}

export default function VideoQuestionEditor({
  videoId,
  videoTitle,
  youtubeId,
  videoDuration,
  initialQuestions = [],
  onSave,
  onClose
}: VideoQuestionEditorProps) {
  const [questions, setQuestions] = useState<VideoQuestion[]>(initialQuestions)
  const [editingQuestion, setEditingQuestion] = useState<VideoQuestion | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null)

  // Use detected duration if available, otherwise fallback to provided or default
  const duration = detectedDuration || (videoDuration ? durationToSeconds(videoDuration) : 300)

  const createDefaultQuestion = (type: Question['type'] = 'multiple-choice'): Question => {
    const baseQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      points: 5,
      required: true
    }

    if (type === 'multiple-choice') {
      return {
        ...baseQuestion,
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    } else if (type === 'numerical') {
      return {
        ...baseQuestion,
        type: 'numerical',
        correctValue: 0,
        tolerance: 0.01,
        unit: 'm/s'
      }
    } else {
      // Default to open-response for written answers
      return {
        ...baseQuestion,
        type: 'open-response',
        points: 10,
        rubric: [
          {
            id: `criterion-${Date.now()}`,
            name: 'Understanding',
            description: 'Demonstrates understanding',
            maxPoints: 10,
            levels: [
              { score: 10, description: 'Excellent' },
              { score: 7, description: 'Good' },
              { score: 5, description: 'Fair' },
              { score: 3, description: 'Poor' },
              { score: 0, description: 'No understanding' }
            ]
          }
        ],
        autoGrade: true
      }
    }
  }

  const handleAddQuestionAtTime = (timestamp: number) => {
    setSelectedTimestamp(timestamp)
    setIsCreating(true)
    // Create a default question when adding
    const defaultQuestion = createDefaultQuestion('multiple-choice')
    setEditingQuestion({
      id: `vq-${Date.now()}`,
      timestamp,
      question: defaultQuestion,
      answered: false
    })
  }

  const handleQuestionClick = (question: VideoQuestion) => {
    setEditingQuestion(question)
    setSelectedTimestamp(question.timestamp)
    setIsCreating(true)
  }

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    if (!editingQuestion) return
    
    // Update the editing question
    setEditingQuestion(prev => prev ? { ...prev, question: updatedQuestion } : null)
  }

  const handleQuestionSave = () => {
    if (!editingQuestion || (!selectedTimestamp && selectedTimestamp !== 0)) return

    // Find if this is an existing question
    const existingIndex = questions.findIndex(q => q.id === editingQuestion.id)
    
    if (existingIndex >= 0) {
      // Update existing question
      setQuestions(prev => prev.map((q, idx) => 
        idx === existingIndex
          ? { ...editingQuestion, timestamp: selectedTimestamp }
          : q
      ))
    } else {
      // Add new question
      setQuestions(prev => [...prev, {
        ...editingQuestion,
        timestamp: selectedTimestamp
      }].sort((a, b) => a.timestamp - b.timestamp))
    }

    setIsCreating(false)
    setEditingQuestion(null)
    setSelectedTimestamp(null)
  }

  const handleQuestionCancel = () => {
    setIsCreating(false)
    setEditingQuestion(null)
    setSelectedTimestamp(null)
  }

  const handleQuestionDeleteFromList = (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await onSave(questions)
      onClose()
    } catch (error) {
      console.error('Error saving questions:', error)
      alert('Failed to save questions. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Interactive Questions</h3>
          <p className="text-sm text-gray-600">
            Add questions that pause the video: <strong>{videoTitle}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save All Questions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{questions.length}</div>
                <div className="text-xs text-gray-600">Total Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{secondsToMMSS(duration)}</div>
                <div className="text-xs text-gray-600">
                  Video Length {detectedDuration && '(auto-detected)'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {questions.reduce((sum, q) => sum + q.question.points, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Player with Scrubbing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <VideoIcon className="h-4 w-4" />
            Video Preview & Scrubber
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoPlayerWithScrubber
            youtubeId={youtubeId}
            duration={duration}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
            onAddQuestionAtTime={handleAddQuestionAtTime}
            onDurationDetected={(newDuration) => {
              console.log('Setting detected duration:', newDuration)
              setDetectedDuration(newDuration)
            }}
          />
        </CardContent>
      </Card>

      {/* Visual Timeline with Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Question Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoTimeline
            questions={questions}
            duration={duration}
            currentTime={currentTime}
            onQuestionClick={handleQuestionClick}
          />
        </CardContent>
      </Card>

      {/* Question Editor */}
      {isCreating && selectedTimestamp !== null && (
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
                <Badge className="bg-white/20 text-white border-0">
                  at {secondsToMMSS(selectedTimestamp)}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setIsCreating(false)
                  setEditingQuestion(null)
                  setSelectedTimestamp(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Timestamp Input */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="timestamp" className="text-sm font-medium text-blue-900 mb-2 block">
                Pause Video At
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="timestamp"
                  type="number"
                  min="0"
                  max={Math.floor(duration)}
                  value={selectedTimestamp}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setSelectedTimestamp(Math.min(value, Math.floor(duration)))
                  }}
                  className="w-32"
                />
                <span className="text-sm text-gray-600">
                  seconds ({secondsToMMSS(selectedTimestamp || 0)})
                </span>
                {selectedTimestamp !== null && selectedTimestamp > duration && (
                  <span className="text-xs text-red-600">
                    ⚠️ Exceeds video length!
                  </span>
                )}
                <div className="flex-1" />
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeId}&t=${selectedTimestamp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Preview timestamp
                </a>
              </div>
            </div>

            {/* Question Editor */}
            {editingQuestion && (
              <>
                <QuestionEditor
                  question={editingQuestion.question}
                  onUpdate={handleQuestionUpdate}
                  onDelete={() => {
                    if (confirm('Delete this question?')) {
                      handleQuestionCancel()
                    }
                  }}
                />
                
                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button
                    onClick={handleQuestionSave}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleQuestionCancel}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {questions.length > 0 && !isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">All Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <Badge variant="outline" className="w-fit mb-1 text-xs">
                      {secondsToMMSS(q.timestamp)}
                    </Badge>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {q.question.type}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    <MathMarkdown content={q.question.question} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {q.question.points} point{q.question.points !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuestionClick(q)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuestionDeleteFromList(q.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {questions.length === 0 && !isCreating && (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click anywhere on the timeline above to add your first interactive question!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Play className="h-4 w-4" />
              Questions will pause the video and test student understanding
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

