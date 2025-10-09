"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Users, BookOpen, FileText, Clock, Search, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAssignmentSystem } from '@/contexts/AssignmentSystemContext'
import { useAssignments } from '@/contexts/AssignmentContext'
import { CreateLessonAssignmentRequest, CreateAssignmentAssignmentRequest, CourseInfo, StudentInfo } from '@/types/assignment-system'

interface CreateLessonAssignmentFormProps {
  onSuccess: () => void
  preselectedLessonId?: string
  preselectedCourseId?: string
}

export function CreateLessonAssignmentForm({ 
  onSuccess, 
  preselectedLessonId, 
  preselectedCourseId 
}: CreateLessonAssignmentFormProps) {
  const { data: session } = useSession()
  const { createLessonAssignment } = useAssignmentSystem()
  
  const [formData, setFormData] = useState<CreateLessonAssignmentRequest>({
    lesson_id: preselectedLessonId || '',
    course_id: preselectedCourseId,
    assigned_students: undefined,
    due_date: undefined,
    title: undefined,
    instructions: undefined,
    estimated_time: undefined,
    published: true
  })
  
  const [assignmentTarget, setAssignmentTarget] = useState<'course' | 'students'>('course')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date>()
  const [loading, setLoading] = useState(false)
  
  // Real data from API
  const [lessons, setLessons] = useState<Array<{
    id: string
    title: string
    unit: string
    lesson_number: number
    description?: string
    estimated_time?: number
  }>>([])
  const [loadingLessons, setLoadingLessons] = useState(true)
  
  const [courses, setCourses] = useState<CourseInfo[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Fetch lessons on component mount
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch('/api/lessons')
        if (response.ok) {
          const data = await response.json()
          setLessons(data.lessons || [])
        } else {
          console.error('Failed to fetch lessons:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching lessons:', error)
      } finally {
        setLoadingLessons(false)
      }
    }

    fetchLessons()
  }, [])

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses || [])
        } else {
          console.error('Failed to fetch courses:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [])

  // Fetch students when a course is selected
  useEffect(() => {
    const fetchStudents = async (courseId: string) => {
      setLoadingStudents(true)
      try {
        const response = await fetch(`/api/roster/students?course_id=${courseId}&active_only=true`)
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
        } else {
          console.error('Failed to fetch students:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching students:', error)
      } finally {
        setLoadingStudents(false)
      }
    }

    if (assignmentTarget === 'students' && formData.course_id) {
      fetchStudents(formData.course_id)
    }
  }, [assignmentTarget, formData.course_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lesson_id) {
      alert('Please select a lesson')
      return
    }

    if (assignmentTarget === 'course' && !formData.course_id) {
      alert('Please select a course')
      return
    }

    if (assignmentTarget === 'students' && selectedStudents.length === 0) {
      alert('Please select at least one student')
      return
    }

    setLoading(true)
    try {
      const submitData: CreateLessonAssignmentRequest = {
        ...formData,
        due_date: dueDate?.toISOString(),
        course_id: assignmentTarget === 'course' ? formData.course_id : undefined,
        assigned_students: assignmentTarget === 'students' ? selectedStudents : undefined
      }

      await createLessonAssignment(submitData)
      onSuccess()
    } catch (error) {
      console.error('Error creating lesson assignment:', error)
      alert('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const selectedLesson = lessons.find(l => l.id === formData.lesson_id)
  const selectedCourse = courses.find(c => c.google_course_id === formData.course_id)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lesson Selection */}
        <div className="space-y-3">
          <Label htmlFor="lesson" className="text-sm font-medium">
            Select Lesson *
          </Label>
          {loadingLessons ? (
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading lessons...</span>
            </div>
          ) : (
            <Select 
              value={formData.lesson_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, lesson_id: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a lesson to assign" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{lesson.unit} - {lesson.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedLesson && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium">{selectedLesson.title}</p>
                <p className="text-xs text-muted-foreground">{selectedLesson.unit}, Lesson {selectedLesson.lesson_number}</p>
                {selectedLesson.description && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedLesson.description}</p>
                )}
                {selectedLesson.estimated_time && (
                  <p className="text-xs text-muted-foreground">Estimated time: {selectedLesson.estimated_time} minutes</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assignment Target */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Assign To *</Label>
          <RadioGroup
            value={assignmentTarget}
            onValueChange={(value) => setAssignmentTarget(value as 'course' | 'students')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="course" id="assign-course" />
              <Label htmlFor="assign-course" className="text-sm font-normal cursor-pointer">
                Entire Class
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="students" id="assign-students" />
              <Label htmlFor="assign-students" className="text-sm font-normal cursor-pointer">
                Individual Students
              </Label>
            </div>
          </RadioGroup>

          {assignmentTarget === 'course' && (
            <div className="space-y-3">
              <Label htmlFor="course" className="text-sm font-medium">Select Class</Label>
              {loadingCourses ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading courses...</span>
                </div>
              ) : (
                <Select 
                  value={formData.course_id || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.google_course_id} value={course.google_course_id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{course.name}</span>
                          <Badge variant="outline">{course.student_count} students</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedCourse && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">{selectedCourse.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCourse.student_count} students • Section {selectedCourse.section}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {assignmentTarget === 'students' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Students</Label>
              {!formData.course_id ? (
                <p className="text-sm text-muted-foreground">Please select a course first to see students</p>
              ) : loadingStudents ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading students...</span>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 max-h-40 overflow-y-auto">
                    <div className="space-y-3">
                      {students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No students found for this course</p>
                      ) : (
                        students.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStudents(prev => [...prev, student.id])
                                } else {
                                  setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                }
                              }}
                            />
                            <Label htmlFor={`student-${student.id}`} className="text-sm font-normal cursor-pointer">
                              {student.name} (ID: {student.google_user_id || student.id})
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedStudents.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedStudents.length} students selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Custom Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Override lesson title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated-time" className="text-sm font-medium">Estimated Time (Minutes)</Label>
            <Input
              id="estimated-time"
              type="number"
              placeholder={selectedLesson?.estimated_time?.toString() || "30"}
              value={formData.estimated_time || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                estimated_time: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-sm font-medium">Special Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="Any special instructions for this assignment..."
            value={formData.instructions || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Due Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Select due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Published */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="published"
            checked={formData.published}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: !!checked }))}
          />
          <Label htmlFor="published" className="text-sm font-normal cursor-pointer">
            Publish immediately (students can see this assignment)
          </Label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Assignment'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

interface CreateHomeworkAssignmentFormProps {
  onSuccess: () => void
  preselectedAssignmentId?: string
  preselectedCourseId?: string
}

export function CreateHomeworkAssignmentForm({ 
  onSuccess, 
  preselectedAssignmentId, 
  preselectedCourseId 
}: CreateHomeworkAssignmentFormProps) {
  const { data: session } = useSession()
  const { createAssignmentAssignment } = useAssignmentSystem()
  const { assignments } = useAssignments()
  
  const [formData, setFormData] = useState<CreateAssignmentAssignmentRequest>({
    assignment_id: preselectedAssignmentId || '',
    course_id: preselectedCourseId,
    assigned_students: undefined,
    due_date: undefined,
    title: undefined,
    instructions: undefined,
    max_attempts: 1,
    time_limit: undefined,
    published: true
  })
  
  const [assignmentTarget, setAssignmentTarget] = useState<'course' | 'students'>('course')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date>()
  const [loading, setLoading] = useState(false)
  
  // Real data from API
  const [courses, setCourses] = useState<CourseInfo[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses || [])
        } else {
          console.error('Failed to fetch courses:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [])

  // Fetch students when a course is selected
  useEffect(() => {
    const fetchStudents = async (courseId: string) => {
      setLoadingStudents(true)
      try {
        const response = await fetch(`/api/roster/students?course_id=${courseId}&active_only=true`)
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
        } else {
          console.error('Failed to fetch students:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching students:', error)
      } finally {
        setLoadingStudents(false)
      }
    }

    if (assignmentTarget === 'students' && formData.course_id) {
      fetchStudents(formData.course_id)
    }
  }, [assignmentTarget, formData.course_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.assignment_id) {
      alert('Please select an assignment')
      return
    }

    if (assignmentTarget === 'course' && !formData.course_id) {
      alert('Please select a course')
      return
    }

    if (assignmentTarget === 'students' && selectedStudents.length === 0) {
      alert('Please select at least one student')
      return
    }

    setLoading(true)
    try {
      const submitData: CreateAssignmentAssignmentRequest = {
        ...formData,
        due_date: dueDate?.toISOString(),
        course_id: assignmentTarget === 'course' ? formData.course_id : undefined,
        assigned_students: assignmentTarget === 'students' ? selectedStudents : undefined
      }

      await createAssignmentAssignment(submitData)
      onSuccess()
    } catch (error) {
      console.error('Error creating assignment assignment:', error)
      alert('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const selectedAssignment = assignments.find(a => a.id === formData.assignment_id)
  const selectedCourse = courses.find(c => c.google_course_id === formData.course_id)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Selection */}
        <div className="space-y-3">
          <Label htmlFor="assignment" className="text-sm font-medium">
            Select Assignment *
          </Label>
          <Select 
            value={formData.assignment_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, assignment_id: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an assignment to assign" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{assignment.title}</span>
                    <Badge variant="outline">{assignment.total_points} pts</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAssignment && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium">{selectedAssignment.title}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAssignment.questions.length} questions • {selectedAssignment.total_points} points
                </p>
                {selectedAssignment.description && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedAssignment.description}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assignment Target */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Assign To *</Label>
          <RadioGroup
            value={assignmentTarget}
            onValueChange={(value) => setAssignmentTarget(value as 'course' | 'students')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="course" id="assign-course-hw" />
              <Label htmlFor="assign-course-hw" className="text-sm font-normal cursor-pointer">
                Entire Class
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="students" id="assign-students-hw" />
              <Label htmlFor="assign-students-hw" className="text-sm font-normal cursor-pointer">
                Individual Students
              </Label>
            </div>
          </RadioGroup>

          {assignmentTarget === 'course' && (
            <div className="space-y-3">
              <Label htmlFor="course" className="text-sm font-medium">Select Class</Label>
              {loadingCourses ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading courses...</span>
                </div>
              ) : (
                <Select 
                  value={formData.course_id || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.google_course_id} value={course.google_course_id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{course.name}</span>
                          <Badge variant="outline">{course.student_count} students</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedCourse && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">{selectedCourse.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCourse.student_count} students • Section {selectedCourse.section}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {assignmentTarget === 'students' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Students</Label>
              {!formData.course_id ? (
                <p className="text-sm text-muted-foreground">Please select a course first to see students</p>
              ) : loadingStudents ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading students...</span>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 max-h-40 overflow-y-auto">
                    <div className="space-y-3">
                      {students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No students found for this course</p>
                      ) : (
                        students.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`student-hw-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStudents(prev => [...prev, student.id])
                                } else {
                                  setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                }
                              }}
                            />
                            <Label htmlFor={`student-hw-${student.id}`} className="text-sm font-normal cursor-pointer">
                              {student.name} (ID: {student.google_user_id || student.id})
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedStudents.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedStudents.length} students selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Assignment-specific fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-attempts" className="text-sm font-medium">Max Attempts</Label>
            <Input
              id="max-attempts"
              type="number"
              min="1"
              value={formData.max_attempts}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                max_attempts: parseInt(e.target.value) || 1 
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-limit" className="text-sm font-medium">Time Limit (Minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              placeholder="No limit"
              value={formData.time_limit || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                time_limit: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title-hw" className="text-sm font-medium">Custom Title (Optional)</Label>
            <Input
              id="title-hw"
              placeholder="Override assignment title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions-hw" className="text-sm font-medium">Special Instructions (Optional)</Label>
          <Textarea
            id="instructions-hw"
            placeholder="Any special instructions for this assignment..."
            value={formData.instructions || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Due Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Select due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Published */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="published-hw"
            checked={formData.published}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: !!checked }))}
          />
          <Label htmlFor="published-hw" className="text-sm font-normal cursor-pointer">
            Publish immediately (students can see this assignment)
          </Label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Assignment'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}