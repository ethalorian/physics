"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { AssignmentType, CreateUnifiedAssignmentRequest } from '@/types/unified-assignment'
import { useToast } from '@/providers/toast-provider'

interface AssignmentCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialType?: AssignmentType
}

interface Course {
  id: string
  google_course_id: string
  name: string
}

interface ContentOption {
  id: string
  title: string
  description?: string
}

export function AssignmentCreationModal({
  isOpen,
  onClose,
  onSuccess,
  initialType
}: AssignmentCreationModalProps) {
  const { showToast } = useToast()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(initialType || 'lesson')
  const [selectedContent, setSelectedContent] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  
  // Target selection
  const [targetType, setTargetType] = useState<'course' | 'students'>('course')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  // Configuration
  const [dueDate, setDueDate] = useState<Date>()
  const [maxAttempts, setMaxAttempts] = useState<number>(1)
  const [timeLimit, setTimeLimit] = useState<number | undefined>()
  const [allowLateSubmission, setAllowLateSubmission] = useState(true)
  const [maxScore, setMaxScore] = useState<number | undefined>()
  const [weight, setWeight] = useState<number>(1.0)
  const [published, setPublished] = useState(false)

  // Data
  const [courses, setCourses] = useState<Course[]>([])
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([])
  const [students, setStudents] = useState<any[]>([])

  // Load courses on mount
  useEffect(() => {
    if (isOpen) {
      loadCourses()
    }
  }, [isOpen])

  // Load content options when type changes
  useEffect(() => {
    if (assignmentType) {
      loadContentOptions(assignmentType)
    }
  }, [assignmentType])

  // Load students when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse)
    }
  }, [selectedCourse])

  // Auto-populate title when content is selected
  useEffect(() => {
    if (selectedContent && contentOptions.length > 0) {
      const content = contentOptions.find(c => c.id === selectedContent)
      if (content && !title) {
        setTitle(content.title)
        setDescription(content.description || '')
      }
    }
  }, [selectedContent, contentOptions])

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
        if (data.length > 0) {
          setSelectedCourse(data[0].google_course_id)
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadContentOptions = async (type: AssignmentType) => {
    setLoading(true)
    try {
      let endpoint = ''
      switch (type) {
        case 'lesson':
          endpoint = '/api/lessons?published=true'
          break
        case 'homework':
          endpoint = '/api/assignments'
          break
        case 'vocabulary':
          endpoint = '/api/vocabulary/sets?published=true'
          break
        case 'simulation':
          endpoint = '/api/simulations'
          break
        case 'simulation_embedded':
          endpoint = '/api/simulations/embedded'
          break
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const result = await response.json()
        
        // Handle different response formats
        let dataArray: any[] = []
        
        if (Array.isArray(result)) {
          dataArray = result
        } else if (result.data && Array.isArray(result.data)) {
          dataArray = result.data
        } else if (result.lessons && Array.isArray(result.lessons)) {
          dataArray = result.lessons
        } else if (result.assignments && Array.isArray(result.assignments)) {
          dataArray = result.assignments
        } else if (result.simulations && Array.isArray(result.simulations)) {
          dataArray = result.simulations
        } else if (result.sets && Array.isArray(result.sets)) {
          dataArray = result.sets
        } else {
          console.warn('Unexpected API response format:', result)
          dataArray = []
        }
        
        setContentOptions(dataArray.map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          description: item.description
        })))
      }
    } catch (error) {
      console.error('Error loading content options:', error)
      setContentOptions([])
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/students`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!selectedContent) {
      showToast({
        title: 'Error',
        message: 'Please select content to assign',
        variant: 'error'
      })
      return
    }

    if (!selectedCourse && selectedStudents.length === 0) {
      showToast({
        title: 'Error',
        message: 'Please select a course or specific students',
        variant: 'error'
      })
      return
    }

    setSubmitting(true)

    try {
      const requestData: CreateUnifiedAssignmentRequest = {
        assignment_type: assignmentType,
        reference_id: selectedContent,
        title,
        description,
        instructions,
        course_id: targetType === 'course' ? selectedCourse : undefined,
        assigned_students: targetType === 'students' ? selectedStudents : undefined,
        due_date: dueDate?.toISOString(),
        max_attempts: maxAttempts,
        time_limit: timeLimit,
        allow_late_submission: allowLateSubmission,
        max_score: maxScore,
        weight: weight,
        published: published
      }

      const response = await fetch('/api/unified-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create assignment')
      }

      showToast({
        title: 'Success',
        message: 'Assignment created successfully',
        variant: 'success'
      })

      onSuccess()
      resetForm()
    } catch (error) {
      console.error('Error creating assignment:', error)
      showToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create assignment',
        variant: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedContent('')
    setTitle('')
    setDescription('')
    setInstructions('')
    setDueDate(undefined)
    setMaxAttempts(1)
    setTimeLimit(undefined)
    setAllowLateSubmission(true)
    setMaxScore(undefined)
    setWeight(1.0)
    setPublished(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Select Content' : step === 2 ? 'Choose Target' : 'Configure Settings'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Content */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assignment Type</Label>
                <Select value={assignmentType} onValueChange={(value) => setAssignmentType(value as AssignmentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="homework">Homework Assignment</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary Set</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
                    <SelectItem value="simulation_embedded">Simulation (with questions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Content</Label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Select value={selectedContent} onValueChange={setSelectedContent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose content to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {contentOptions.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">No content available for this type</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Assignment Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter assignment title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the assignment"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Choose Target */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={targetType} onValueChange={(value) => setTargetType(value as 'course' | 'students')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Entire Course</SelectItem>
                    <SelectItem value="students">Specific Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetType === 'course' ? (
                <div className="space-y-2">
                  <Label>Select Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.google_course_id} value={course.google_course_id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Students</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id])
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{student.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configure Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Instructions (Optional)</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions for students"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="No limit"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={maxScore || ''}
                    onChange={(e) => setMaxScore(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input
                    type="number"
                    step={0.1}
                    min={0}
                    max={10}
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 1.0)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={allowLateSubmission}
                  onCheckedChange={setAllowLateSubmission}
                />
                <Label>Allow late submission</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label>Publish immediately (students can see it)</Label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1)
                } else {
                  onClose()
                }
              }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            <Button
              onClick={() => {
                if (step < 3) {
                  setStep(step + 1)
                } else {
                  handleSubmit()
                }
              }}
              disabled={
                (step === 1 && !selectedContent) ||
                (step === 2 && !selectedCourse && selectedStudents.length === 0) ||
                submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : step === 3 ? (
                'Create Assignment'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

