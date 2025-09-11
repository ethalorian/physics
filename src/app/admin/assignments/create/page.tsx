"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Assignment, Question, MultipleChoiceQuestion, OpenResponseQuestion } from '@/types/assignment'
import { useAssignments } from '@/contexts/AssignmentContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import QuestionEditor from '@/components/assignment-builder/question-editor'
import { Plus, Save, Eye } from 'lucide-react'

export default function CreateAssignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { createAssignment } = useAssignments()
  const [lessons, setLessons] = useState<Array<{id: string, title: string, slug: string}>>([])
  const [assignment, setAssignment] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    instructions: '',
    lesson_id: '',
    questions: [],
    total_points: 0,
    published: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLessons()
  }, [])

  useEffect(() => {
    // Calculate total points when questions change
    const totalPoints = assignment.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0
    if (totalPoints !== assignment.total_points) {
      setAssignment(prev => ({ ...prev, total_points: totalPoints }))
    }
  }, [assignment.questions])

  const fetchLessons = async () => {
    // Backend functionality disabled - keeping frontend only
    // const { data, error } = await supabase
    //   .from('lessons')
    //   .select('id, title, slug')
    //   .order('order_index', { ascending: true })
    // 
    // if (!error && data) {
    //   setLessons(data)
    // }
    
    // Mock data for frontend demo
    setLessons([
      { id: '1', title: 'Newton\'s Laws', slug: 'newtons-laws' },
      { id: '2', title: 'Energy and Work', slug: 'energy-work' },
      { id: '3', title: 'Waves and Sound', slug: 'waves-sound' }
    ])
  }

  const addQuestion = (type: Question['type'] = 'multiple-choice') => {
    let newQuestion: Question
    
    if (type === 'multiple-choice') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        question: '',
        points: 5,
        options: ['', '', '', ''],
        correctAnswer: 0
      } as MultipleChoiceQuestion
    } else if (type === 'open-response') {
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'open-response',
        question: '',
        points: 20,
        rubric: [
          {
            id: `criterion-${Date.now()}`,
            name: 'Understanding',
            description: 'Demonstrates clear understanding of the concepts',
            maxPoints: 10,
            levels: [
              { score: 10, description: 'Excellent understanding' },
              { score: 8, description: 'Good understanding' },
              { score: 6, description: 'Basic understanding' },
              { score: 4, description: 'Limited understanding' },
              { score: 0, description: 'No understanding shown' }
            ]
          },
          {
            id: `criterion-${Date.now() + 1}`,
            name: 'Communication',
            description: 'Clear and organized explanation',
            maxPoints: 10,
            levels: [
              { score: 10, description: 'Very clear and well-organized' },
              { score: 8, description: 'Mostly clear' },
              { score: 6, description: 'Somewhat clear' },
              { score: 4, description: 'Unclear in places' },
              { score: 0, description: 'Very unclear' }
            ]
          }
        ],
        autoGrade: true,
        minLength: 50,
        maxLength: 500
      } as OpenResponseQuestion
    } else {
      // Default fallback
      newQuestion = {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        question: '',
        points: 5,
        options: ['', '', '', ''],
        correctAnswer: 0
      } as MultipleChoiceQuestion
    }

    setAssignment(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }))
  }

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    setAssignment(prev => ({
      ...prev,
      questions: prev.questions?.map((q, i) => i === index ? updatedQuestion : q) || []
    }))
  }

  const deleteQuestion = (index: number) => {
    setAssignment(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }))
  }


  const saveAssignment = async (publish: boolean = false) => {
    if (!assignment.title || !assignment.questions?.length) {
      alert('Please provide a title and at least one question.')
      return
    }

    if (!session?.user?.id) {
      alert('You must be logged in to create assignments.')
      return
    }

    setSaving(true)
    try {
      await createAssignment({
        ...assignment as Omit<Assignment, 'id' | 'created_at' | 'updated_at'>,
        published: publish,
        total_points: assignment.total_points || 0,
        questions: assignment.questions || []
      })
      
      alert(publish ? 'Assignment published successfully!' : 'Assignment saved as draft!')
      router.push('/admin/assignments')
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Error saving assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Create Assignment</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => saveAssignment(false)} 
            variant="outline"
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => saveAssignment(true)}
            disabled={saving}
          >
            <Eye className="h-4 w-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={assignment.title}
                onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Forces and Motion Quiz"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={assignment.description}
                onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the assignment..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Instructions</label>
              <Textarea
                value={assignment.instructions}
                onChange={(e) => setAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for students..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Related Lesson</label>
                <Select
                  value={assignment.lesson_id}
                  onValueChange={(value) => setAssignment(prev => ({ ...prev, lesson_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lesson (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <Input
                  type="datetime-local"
                  value={assignment.due_date?.slice(0, 16) || ''}
                  onChange={(e) => setAssignment(prev => ({ 
                    ...prev, 
                    due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                  }))}
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Total Points: {assignment.total_points}
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Questions</h2>
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => addQuestion(value as Question['type'])}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add Question Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                  <SelectItem value="numerical">Numerical</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="open-response">Open Response (AI Graded)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => addQuestion()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {assignment.questions?.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
              onDelete={() => deleteQuestion(index)}
            />
          ))}

          {!assignment.questions?.length && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">No questions added yet.</p>
                <Button onClick={() => addQuestion()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Question
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
