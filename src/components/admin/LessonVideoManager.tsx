"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Play,
  ExternalLink,
  GripVertical,
  AlertCircle
} from 'lucide-react'
import { LessonVideo, VideoQuestion, Question } from '@/types/assignment'
import VideoQuestionEditor from './VideoQuestionEditor'

interface LessonVideoManagerProps {
  lessonId: string
  lessonTitle: string
  initialVideos?: LessonVideo[]
  onSave: (videos: LessonVideo[]) => Promise<void>
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct YouTube ID
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

function VideoEditor({ 
  video, 
  onSave, 
  onCancel 
}: { 
  video: Partial<LessonVideo>
  onSave: (video: LessonVideo) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: video.title || '',
    youtubeUrl: video.youtubeId || '',
    duration: video.duration || '',
    description: video.description || '',
    timestamp: video.timestamp?.toString() || '0'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.youtubeUrl.trim()) {
      newErrors.youtubeUrl = 'YouTube URL or ID is required'
    } else {
      const youtubeId = extractYouTubeId(formData.youtubeUrl.trim())
      if (!youtubeId) {
        newErrors.youtubeUrl = 'Invalid YouTube URL or ID'
      }
    }
    
    const timestamp = parseInt(formData.timestamp)
    if (isNaN(timestamp) || timestamp < 0) {
      newErrors.timestamp = 'Timestamp must be a valid number >= 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return
    
    const youtubeId = extractYouTubeId(formData.youtubeUrl.trim())!
    const newVideo: LessonVideo = {
      id: video.id || `video-${Date.now()}`,
      title: formData.title.trim(),
      youtubeId,
      duration: formData.duration.trim() || undefined,
      description: formData.description.trim() || undefined,
      timestamp: parseInt(formData.timestamp) || 0
    }
    
    onSave(newVideo)
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          {video.id ? 'Edit Video' : 'Add New Video'}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Introduction to Velocity"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        <div>
          <Label htmlFor="youtubeUrl">YouTube URL or ID *</Label>
          <Input
            id="youtubeUrl"
            value={formData.youtubeUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
            placeholder="https://youtube.com/watch?v=... or just the video ID"
            className={errors.youtubeUrl ? 'border-red-500' : ''}
          />
          {errors.youtubeUrl && <p className="text-xs text-red-600 mt-1">{errors.youtubeUrl}</p>}
          {formData.youtubeUrl && !errors.youtubeUrl && extractYouTubeId(formData.youtubeUrl) && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Valid YouTube ID: {extractYouTubeId(formData.youtubeUrl)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (optional)</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g., 5:30"
            />
          </div>
          <div>
            <Label htmlFor="timestamp">Start Time (seconds)</Label>
            <Input
              id="timestamp"
              type="number"
              min="0"
              value={formData.timestamp}
              onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
              className={errors.timestamp ? 'border-red-500' : ''}
            />
            {errors.timestamp && <p className="text-xs text-red-600 mt-1">{errors.timestamp}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this video covers..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default function LessonVideoManager({ 
  lessonId, 
  lessonTitle, 
  initialVideos = [],
  onSave 
}: LessonVideoManagerProps) {
  const [videos, setVideos] = useState<LessonVideo[]>(initialVideos)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingQuestionsId, setEditingQuestionsId] = useState<string | null>(null)

  const handleSaveVideo = (video: LessonVideo) => {
    if (editingId) {
      // Update existing video
      setVideos(prev => prev.map(v => v.id === editingId ? video : v))
      setEditingId(null)
    } else {
      // Add new video
      setVideos(prev => [...prev, video])
      setIsAddingNew(false)
    }
  }

  const handleDeleteVideo = (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      setVideos(prev => prev.filter(v => v.id !== videoId))
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await onSave(videos)
    } catch (error) {
      console.error('Failed to save videos:', error)
      alert('Failed to save videos. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const moveVideo = (fromIndex: number, toIndex: number) => {
    const newVideos = [...videos]
    const [moved] = newVideos.splice(fromIndex, 1)
    newVideos.splice(toIndex, 0, moved)
    setVideos(newVideos)
  }

  const handleQuestionsSave = async (videoId: string, questions: VideoQuestion[]) => {
    // Update video with new questions
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, questions } : v
    ))
    setEditingQuestionsId(null)
  }

  const editingQuestionsVideo = videos.find(v => v.id === editingQuestionsId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Manage Videos</h2>
          <p className="text-sm text-gray-600">
            Add YouTube videos to: <strong>{lessonTitle}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew || editingId !== null}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
          <Button 
            onClick={handleSaveAll}
            disabled={isSaving}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Question Editor */}
      {editingQuestionsVideo && (
        <Card className="border-2 border-purple-300 shadow-xl">
          <CardContent className="p-6">
            <VideoQuestionEditor
              videoId={editingQuestionsVideo.id}
              videoTitle={editingQuestionsVideo.title}
              youtubeId={editingQuestionsVideo.youtubeId}
              videoDuration={editingQuestionsVideo.duration}
              initialQuestions={editingQuestionsVideo.questions || []}
              onSave={(questions) => handleQuestionsSave(editingQuestionsVideo.id, questions)}
              onClose={() => setEditingQuestionsId(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Add New Video Form */}
      {isAddingNew && (
        <VideoEditor
          video={{}}
          onSave={handleSaveVideo}
          onCancel={() => setIsAddingNew(false)}
        />
      )}

      {/* Existing Videos */}
      <div className="space-y-4">
        {videos.map((video, index) => (
          <div key={video.id}>
            {editingId === video.id ? (
              <VideoEditor
                video={video}
                onSave={handleSaveVideo}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="cursor-move text-gray-400 mt-2">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{video.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Video {index + 1}
                            </Badge>
                            {video.duration && (
                              <Badge variant="secondary" className="text-xs">
                                {video.duration}
                              </Badge>
                            )}
                            {video.questions && video.questions.length > 0 && (
                              <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                ⚡ {video.questions.length} question{video.questions.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              ID: {video.youtubeId}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingQuestionsId(video.id)}
                            disabled={editingId !== null || isAddingNew}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Add Interactive Questions"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a 
                              href={`https://youtube.com/watch?v=${video.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Play className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(video.id)}
                            disabled={editingId !== null || isAddingNew}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVideo(video.id)}
                            disabled={editingId !== null || isAddingNew}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {video.description && (
                        <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                      )}
                      
                      {video.timestamp && video.timestamp > 0 && (
                        <p className="text-xs text-gray-500">
                          Starts at: {Math.floor(video.timestamp / 60)}:{(video.timestamp % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>

      {videos.length === 0 && !isAddingNew && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <h3 className="font-medium">No videos added yet</h3>
              <p className="text-sm">Add YouTube videos to enhance this lesson</p>
            </div>
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
