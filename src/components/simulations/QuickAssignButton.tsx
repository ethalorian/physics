"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Send, Clock, FileText } from 'lucide-react'
import { useAssignments } from '@/contexts/ConsolidatedAssignmentContext'

interface QuickAssignButtonProps {
  simulationTitle: string
  simulationSlug: string
  simulationId?: string
}

interface Course {
  id: string
  name: string
  section?: string
  student_count: number
}

export function QuickAssignButton({ 
  simulationTitle, 
  simulationSlug,
  simulationId 
}: QuickAssignButtonProps) {
  const { data: session } = useSession()
  const { quickAssignSimulation } = useAssignments()
  
  const [showDialog, setShowDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [minTime, setMinTime] = useState('10')
  const [assigning, setAssigning] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // Load available courses
  useEffect(() => {
    if (showDialog && session?.user?.email) {
      loadCourses()
    }
  }, [showDialog, session])

  const loadCourses = async () => {
    setLoadingCourses(true)
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      // Fallback to mock courses for demo
      setCourses([
        { id: 'physics-101-p1', name: 'Physics 101', section: 'Period 1', student_count: 25 },
        { id: 'physics-101-p2', name: 'Physics 101', section: 'Period 2', student_count: 28 },
        { id: 'ap-physics', name: 'AP Physics', section: undefined, student_count: 18 }
      ])
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleQuickAssign = async () => {
    if (!selectedCourse) {
      alert('Please select a course')
      return
    }
    
    setAssigning(true)
    try {
      await quickAssignSimulation(
        simulationSlug,
        selectedCourse,
        {
          instructions: instructions || undefined,
          dueDate: dueDate || undefined,
          minTime: parseInt(minTime)
        }
      )
      
      setShowDialog(false)
      // Reset form
      setSelectedCourse('')
      setInstructions('')
      setDueDate('')
      setMinTime('10')
    } catch (error) {
      console.error('Error assigning simulation:', error)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        size="sm"
      >
        <Send className="h-4 w-4 mr-2" />
        Assign to Class
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Assign: {simulationTitle}</DialogTitle>
            <DialogDescription>
              Quickly assign this simulation to a class with default settings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course">Select Course *</Label>
              <Select 
                value={selectedCourse} 
                onValueChange={setSelectedCourse}
                disabled={loadingCourses}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Choose a course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <SelectItem value="none" disabled>No courses available</SelectItem>
                  ) : (
                    courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                        {course.section && ` - ${course.section}`}
                        {` (${course.student_count} students)`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Special instructions for students..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <input
                  type="datetime-local"
                  id="due-date"
                  className="w-full rounded-md border px-3 py-2"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-time">Min. Time (minutes)</Label>
                <Select value={minTime} onValueChange={setMinTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Default Settings Applied:</span>
              </div>
              <ul className="text-sm text-muted-foreground mt-1 ml-6 space-y-1">
                <li>• 3 attempts allowed</li>
                <li>• Data export required</li>
                <li>• Completion tracking enabled</li>
                <li>• Auto-save progress every 30 seconds</li>
                <li>• Students can work at their own pace</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleQuickAssign} 
              disabled={!selectedCourse || assigning}
            >
              {assigning ? 'Assigning...' : 'Assign Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

