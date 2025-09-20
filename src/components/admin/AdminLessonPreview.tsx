"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  EyeOff, 
  Settings, 
  ExternalLink, 
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  Edit,
  Play,
  Clock,
  Target,
  BookOpen,
  Info
} from 'lucide-react'
import { Lesson } from '@/types/assignment'
import StudentLessonViewer from '@/components/lessons/StudentLessonViewer'
import MathMarkdown from '@/components/MathMarkdown'
import LessonVideoManager from '@/components/admin/LessonVideoManager'

interface AdminLessonPreviewProps {
  lesson: Lesson
}

export default function AdminLessonPreview({ lesson }: AdminLessonPreviewProps) {
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student')
  const [devicePreview, setDevicePreview] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [showVideoManager, setShowVideoManager] = useState(false)

  const handleVideoSave = async (videos: any[]) => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/videos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save videos')
      }
      
      alert('Videos saved successfully!')
      // Refresh the page to show updated videos
      window.location.reload()
    } catch (error) {
      console.error('Error saving videos:', error)
      alert('Failed to save videos. Please try again.')
    }
  }

  const getDeviceClasses = () => {
    switch (devicePreview) {
      case 'mobile':
        return 'max-w-sm mx-auto border-8 border-gray-800 rounded-3xl overflow-hidden shadow-2xl'
      case 'tablet':
        return 'max-w-2xl mx-auto border-4 border-gray-600 rounded-2xl overflow-hidden shadow-xl'
      default:
        return 'w-full'
    }
  }

  const getDeviceHeight = () => {
    switch (devicePreview) {
      case 'mobile':
        return 'h-[800px]'
      case 'tablet':
        return 'h-[900px]'
      default:
        return 'min-h-screen'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <a href="/admin/dashboard?tab=content" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </a>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Preview: {lesson.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{lesson.unit}</Badge>
                  <Badge variant="secondary">Lesson {lesson.lesson_number}</Badge>
                  {lesson.estimated_time && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {lesson.estimated_time}min
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'student' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('student')}
                  className="h-8"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Student View
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'admin' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('admin')}
                  className="h-8"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Admin View
                </Button>
              </div>

              {/* Device Preview Toggle */}
              {viewMode === 'student' && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={devicePreview === 'mobile' ? 'default' : 'ghost'}
                    onClick={() => setDevicePreview('mobile')}
                    className="h-8"
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={devicePreview === 'tablet' ? 'default' : 'ghost'}
                    onClick={() => setDevicePreview('tablet')}
                    className="h-8"
                  >
                    <Tablet className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={devicePreview === 'desktop' ? 'default' : 'ghost'}
                    onClick={() => setDevicePreview('desktop')}
                    className="h-8"
                  >
                    <Monitor className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <Button variant="outline" asChild>
                <a 
                  href={`/lessons/${lesson.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Live
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6">
        {viewMode === 'student' ? (
          <div className={getDeviceClasses()}>
            <div className={`${getDeviceHeight()} overflow-auto bg-white`}>
              <StudentLessonViewer 
                lesson={lesson}
                onProgress={(id, progress) => console.log(`Preview progress: ${progress}%`)}
                onComplete={(id) => console.log('Preview lesson completed')}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Admin Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Lesson Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Play className="h-4 w-4" />
                      <span className="font-medium">Videos</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {lesson.videos?.length || 0}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Objectives</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {lesson.objectives?.length || 0}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Est. Time</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {lesson.estimated_time || 0}min
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Content</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {lesson.content ? '✓' : '✗'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setShowVideoManager(!showVideoManager)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {showVideoManager ? 'Hide' : 'Manage'} Videos
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`/admin/lessons/${lesson.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Lesson
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Management */}
            {showVideoManager && (
              <Card>
                <CardContent className="p-6">
                  <LessonVideoManager
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    initialVideos={lesson.videos || []}
                    onSave={handleVideoSave}
                  />
                </CardContent>
              </Card>
            )}

            {/* Lesson Details */}
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="videos">Videos ({lesson.videos?.length || 0})</TabsTrigger>
                <TabsTrigger value="objectives">Objectives ({lesson.objectives?.length || 0})</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.content ? (
                      <div className="prose max-w-none">
                        <MathMarkdown content={lesson.content} />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No content added yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="videos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.videos && lesson.videos.length > 0 ? (
                      <div className="space-y-4">
                        {lesson.videos.map((video, index) => (
                          <div key={video.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{video.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  YouTube ID: {video.youtubeId}
                                </p>
                                {video.description && (
                                  <p className="text-sm text-gray-700 mt-2">
                                    {video.description}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  {video.duration && (
                                    <Badge variant="outline">{video.duration}</Badge>
                                  )}
                                  {video.timestamp && video.timestamp > 0 && (
                                    <Badge variant="secondary">
                                      Starts at {Math.floor(video.timestamp / 60)}:{(video.timestamp % 60).toString().padStart(2, '0')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
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
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No videos added yet</p>
                        <Button 
                          className="mt-4" 
                          onClick={() => setShowVideoManager(true)}
                        >
                          Add Videos
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="objectives" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.objectives && lesson.objectives.length > 0 ? (
                      <div className="space-y-2">
                        {lesson.objectives.map((objective, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-relaxed">{objective}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No learning objectives defined yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">ID</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                          {lesson.id}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Slug</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                          {lesson.slug}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Created</label>
                        <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">
                          {new Date(lesson.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Updated</label>
                        <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">
                          {new Date(lesson.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Published</label>
                        <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded">
                          {lesson.published ? '✅ Yes' : '❌ No'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Student URL</label>
                        <p className="text-sm text-blue-600 bg-gray-100 p-2 rounded break-all">
                          /lessons/{lesson.slug}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
