"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, ExternalLink, Play, Target, Clock } from 'lucide-react'

interface QuickLesson {
  id: string
  title: string
  slug: string
  unit: string
  lesson_number: number
  videos?: any[]
  objectives?: string[]
  estimated_time?: number
  created_at: string
}

export default function QuickLessonPreview() {
  const [lessons, setLessons] = useState<QuickLesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentLessons()
  }, [])

  const fetchRecentLessons = async () => {
    try {
      // Fetch lessons from API (handles auth properly)
      const response = await fetch('/api/lessons/published')

      if (!response.ok) {
        throw new Error('Failed to fetch lessons')
      }

      const data = await response.json()
      const allLessons = data.lessons || []

      // Get the 5 most recent lessons
      const recentLessons = allLessons
        .sort((a: QuickLesson, b: QuickLesson) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5)

      // Parse videos JSON for each lesson
      const parsedLessons = recentLessons.map((lesson: QuickLesson) => {
        let videos = []
        if (lesson.videos) {
          try {
            videos = typeof lesson.videos === 'string' 
              ? JSON.parse(lesson.videos) 
              : lesson.videos
          } catch (e) {
            videos = []
          }
        }
        return { ...lesson, videos }
      })

      setLessons(parsedLessons)
    } catch (error) {
      console.error('Error fetching recent lessons:', error)
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-secondary rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (lessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No lessons to preview yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Recent Lessons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="border rounded-lg p-3 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      L{lesson.lesson_number}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {lesson.unit}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {lesson.title}
                  </h3>
                  
                  {/* Quick stats */}
                  <div className="flex items-center gap-3 mt-2">
                    {lesson.videos && lesson.videos.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Play className="h-3 w-3" />
                        {lesson.videos.length}
                      </div>
                    )}
                    {lesson.objectives && lesson.objectives.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <Target className="h-3 w-3" />
                        {lesson.objectives.length}
                      </div>
                    )}
                    {lesson.estimated_time && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Clock className="h-3 w-3" />
                        {lesson.estimated_time}min
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/5"
                    asChild
                  >
                    <a
                      href={`/lessons/${lesson.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Preview as Student"
                    >
                      <Eye className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/5"
                    asChild
                  >
                    <a
                      href={`/admin/lessons/${lesson.id}/preview`}
                      title="Admin Preview"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="/admin/dashboard?tab=content">
              View All Lessons
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
