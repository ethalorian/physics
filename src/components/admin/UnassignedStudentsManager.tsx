"use client"

// React/Next.js imports
import { useState, useEffect, useCallback } from 'react'

// External imports
import { UserPlus, RefreshCw, AlertCircle, Users, Calendar } from 'lucide-react'

// Internal imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/providers/toast-provider'

interface UnassignedStudent {
  id: string
  email: string
  name: string
  google_user_id: string
  created_at: string
  last_sign_in: string
  course_count: number
}

interface Course {
  id: string
  name: string
  section?: string
  google_course_id: string
}

export default function UnassignedStudentsManager() {
  const { showToast } = useToast()
  const [students, setStudents] = useState<UnassignedStudent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string>>({})

  const fetchUnassignedStudents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/students/unassigned')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch unassigned students')
      }

      setStudents(data.students || [])
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load students',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/roster/courses')
      
      if (!response.ok) {
        console.log('Could not fetch courses from database')
        return
      }
      
      const data = await response.json()

      if (data.courses) {
        setCourses(data.courses)
      }
    } catch (error) {
      console.log('Courses not available yet - import from Google Classroom first')
    }
  }, [])

  useEffect(() => {
    fetchUnassignedStudents()
    fetchCourses()
  }, [fetchUnassignedStudents, fetchCourses])

  const handleAssignStudent = async (studentId: string, courseId: string) => {
    if (!courseId) {
      showToast({
        title: 'Error',
        description: 'Please select a course',
        variant: 'error'
      })
      return
    }

    setAssigning(studentId)
    try {
      const response = await fetch('/api/students/unassigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign student')
      }

      showToast({
        title: 'Success',
        description: 'Student assigned to course successfully!'
      })

      // Refresh the list
      fetchUnassignedStudents()

      // Clear selection
      setSelectedCourses(prev => {
        const newState = { ...prev }
        delete newState[studentId]
        return newState
      })

    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign student',
        variant: 'error'
      })
    } finally {
      setAssigning(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Students</CardTitle>
          <CardDescription>
            Students who have signed in but are not enrolled in any course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Unassigned Students
              {students.length > 0 && (
                <Badge variant="destructive">{students.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Students who have signed in but are not enrolled in any course
            </CardDescription>
          </div>
          <Button
            onClick={fetchUnassignedStudents}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">
              No unassigned students
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All students have been assigned to courses
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{student.name}</p>
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Signed up {formatDate(student.created_at)}</span>
                    </div>
                    {student.last_sign_in && student.last_sign_in !== student.created_at && (
                      <div className="flex items-center gap-1">
                        <span>Last seen {formatDate(student.last_sign_in)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Select
                    value={selectedCourses[student.id] || ''}
                    onValueChange={(value) => 
                      setSelectedCourses(prev => ({ ...prev, [student.id]: value }))
                    }
                    disabled={assigning === student.id}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No courses available
                        </div>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} {course.section && `(${course.section})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleAssignStudent(student.id, selectedCourses[student.id])}
                    disabled={!selectedCourses[student.id] || assigning === student.id}
                    size="sm"
                  >
                    {assigning === student.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {students.length > 0 && courses.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  No courses available
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Please import courses from Google Classroom first to assign students.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

