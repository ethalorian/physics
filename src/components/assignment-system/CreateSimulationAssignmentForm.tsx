'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Save, 
  Loader2, 
  Users, 
  Calendar, 
  Clock, 
  FileDown,
  GraduationCap,
  CheckCircle
} from 'lucide-react'

interface CreateSimulationAssignmentFormProps {
  simulation: {
    id: string
    title: string
    slug: string
    description: string
    estimated_time: number
  }
  onSuccess: () => void
  onCancel: () => void
}

interface Course {
  id: string
  name: string
  section?: string
  student_count: number
}

interface Rubric {
  id: string
  name: string
  description: string
}

export function CreateSimulationAssignmentForm({ 
  simulation, 
  onSuccess, 
  onCancel 
}: CreateSimulationAssignmentFormProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [title, setTitle] = useState(simulation.title)
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [minTimeRequired, setMinTimeRequired] = useState(simulation.estimated_time)
  const [requiresDataExport, setRequiresDataExport] = useState(false)
  const [selectedRubric, setSelectedRubric] = useState<string>('')
  const [published, setPublished] = useState(true)

  // Load courses and rubrics
  useEffect(() => {
    async function loadData() {
      try {
        // Load courses (from Google Classroom integration)
        const coursesRes = await fetch('/api/google-classroom/courses')
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData.courses || [])
        }

        // Load rubrics for this simulation
        const rubricsRes = await fetch(`/api/rubrics?simulation_id=${simulation.id}`)
        if (rubricsRes.ok) {
          const rubricsData = await rubricsRes.json()
          setRubrics(rubricsData.rubrics || [])
          
          // Auto-select default rubric if available
          const defaultRubric = rubricsData.rubrics?.find((r: Rubric & { is_default: boolean }) => r.is_default)
          if (defaultRubric) {
            setSelectedRubric(defaultRubric.id)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [simulation.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const assignmentData = {
        simulation_id: simulation.id,
        course_id: selectedCourse || undefined,
        title: title !== simulation.title ? title : undefined,
        instructions,
        due_date: dueDate || undefined,
        min_time_required: minTimeRequired,
        requires_data_export: requiresDataExport,
        rubric_id: selectedRubric || undefined,
        published
      }

      const response = await fetch('/api/assignments/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create assignment')
      }

      // Success!
      onSuccess()
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert(error instanceof Error ? error.message : 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Configure the basic assignment information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={simulation.title}
              required
            />
            <p className="text-xs text-muted-foreground">
              Override the simulation title if needed
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions for Students</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Provide specific instructions or focus areas for this assignment..."
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date (Optional)
            </Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Student Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign To
          </CardTitle>
          <CardDescription>Select a course or individual students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No courses available
                  </SelectItem>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} {course.section && `(${course.section})`} - {course.student_count} students
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Students will see this assignment in their dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Requirements
          </CardTitle>
          <CardDescription>Set completion requirements for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Minimum Time */}
          <div className="space-y-2">
            <Label htmlFor="minTime">
              Minimum Time in Simulation (minutes)
            </Label>
            <Input
              id="minTime"
              type="number"
              min="0"
              value={minTimeRequired}
              onChange={(e) => setMinTimeRequired(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Estimated time: {simulation.estimated_time} minutes
            </p>
          </div>

          {/* Data Export Requirement */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="dataExport"
              checked={requiresDataExport}
              onCheckedChange={(checked) => setRequiresDataExport(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="dataExport"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
              >
                <FileDown className="h-4 w-4" />
                Require Data Export
              </Label>
              <p className="text-xs text-muted-foreground">
                Students must export their data (CSV file) from the simulation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Grading Rubric
          </CardTitle>
          <CardDescription>Select a standards-based rubric for grading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rubric">Rubric</Label>
            <Select value={selectedRubric} onValueChange={setSelectedRubric}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rubric..." />
              </SelectTrigger>
              <SelectContent>
                {rubrics.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No rubrics available
                  </SelectItem>
                ) : (
                  rubrics.map((rubric) => (
                    <SelectItem key={rubric.id} value={rubric.id}>
                      {rubric.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedRubric && (
              <p className="text-xs text-muted-foreground">
                Students will be graded using A/B/C/Fail standards-based rubric
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publishing */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="published"
              checked={published}
              onCheckedChange={(checked) => setPublished(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="published"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Publish Immediately
              </Label>
              <p className="text-xs text-muted-foreground">
                Students will see this assignment right away. Uncheck to save as draft.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !selectedCourse}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Create Assignment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

