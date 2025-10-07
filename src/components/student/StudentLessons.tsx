"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Search, Clock, CheckCircle, Eye } from 'lucide-react'
import Link from 'next/link'

interface Lesson {
  id: number
  title: string
  slug: string
  description: string
  unit: string
  lesson_number: number
  published: boolean
  created_at: string
}

interface LessonProgress {
  lesson_id: number
  completed: boolean
  completed_at?: string
  time_spent?: number
}

export default function StudentLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLessonsAndProgress()
  }, [])

  const fetchLessonsAndProgress = async () => {
    try {
      setLoading(true)
      
      // Fetch lessons from API (handles auth and RLS properly)
      const response = await fetch('/api/lessons/published')
      
      if (!response.ok) {
        throw new Error('Failed to fetch lessons')
      }
      
      const data = await response.json()
      setLessons(data.lessons || [])
      
      // TODO: Fetch user progress when user system is implemented
      // For now, progress remains empty since no placeholder data allowed
      setProgress([])
      
    } catch (error) {
      console.error('Error fetching lessons:', error)
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const getLessonProgress = (lessonId: number) => {
    return progress.find(p => p.lesson_id === lessonId)
  }

  const getProgressBadge = (lessonId: number) => {
    const lessonProgress = getLessonProgress(lessonId)
    if (lessonProgress?.completed) {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    }
    return <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">Not Started</Badge>
  }

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.unit.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A4C93]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#4A1A4A]">My Lessons</h2>
          <p className="text-[#6A4C93]">Track your progress through physics concepts</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9A8AC0]" />
        <Input
          placeholder="Search lessons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Progress Overview */}
      {lessons.length > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Total Lessons
              </CardTitle>
              <BookOpen className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">{lessons.length}</div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">
                {progress.filter(p => p.completed).length}
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6A4C93]">
                Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-[#9A8AC0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4A1A4A]">
                {lessons.length > 0 ? Math.round((progress.filter(p => p.completed).length / lessons.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        {filteredLessons.length === 0 ? (
          <Card className="apple-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-[#9A8AC0] mb-4" />
              <h3 className="text-lg font-medium text-[#4A1A4A] mb-2">
                {lessons.length === 0 ? 'No lessons available' : 'No lessons match your search'}
              </h3>
              <p className="text-[#6A4C93] text-center">
                {lessons.length === 0 
                  ? 'Your teacher hasn\'t published any lessons yet. Check back later!'
                  : 'Try adjusting your search terms to find the lessons you\'re looking for.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="apple-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[#6A4C93] border-[#6A4C93]">
                      Lesson {lesson.lesson_number}
                    </Badge>
                    <Badge variant="outline" className="text-[#9A8AC0] border-[#9A8AC0]">
                      {lesson.unit}
                    </Badge>
                    {getProgressBadge(lesson.id)}
                  </div>
                  <Link href={`/lessons/${lesson.slug}`}>
                    <Button size="sm" className="bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] hover:from-[#5A2A5A] hover:to-[#7A5CA3]">
                      <Eye className="h-4 w-4 mr-2" />
                      View Lesson
                    </Button>
                  </Link>
                </div>
                <CardTitle className="text-[#4A1A4A]">{lesson.title}</CardTitle>
                <CardDescription className="text-[#6A4C93]">{lesson.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-[#9A8AC0]">
                  <span>Published: {new Date(lesson.created_at).toLocaleDateString()}</span>
                  {getLessonProgress(lesson.id)?.completed_at && (
                    <span>
                      Completed: {new Date(getLessonProgress(lesson.id)!.completed_at!).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
