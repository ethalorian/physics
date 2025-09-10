"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Assignment, Question, MultipleChoiceQuestion } from '@/types/assignment'
import { supabase } from '@/lib/supabase'
import { parseAssignmentMarkdown } from '@/lib/markdown-parser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuestionEditor from '@/components/assignment-builder/question-editor'
import { Plus, Save, Eye, Upload, FileText } from 'lucide-react'

export default function CreateAssignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
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
  const [markdownContent, setMarkdownContent] = useState('')
  const [activeTab, setActiveTab] = useState('manual')

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

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      points: 5,
      options: ['', '', '', ''],
      correctAnswer: 0
    } as MultipleChoiceQuestion

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

  const parseMarkdownAssignment = () => {
    if (!markdownContent.trim()) {
      alert('Please enter markdown content to parse.')
      return
    }

    try {
      const parsed = parseAssignmentMarkdown(markdownContent)
      setAssignment(prev => ({
        ...prev,
        title: parsed.title,
        description: parsed.description || prev.description,
        instructions: parsed.instructions || prev.instructions,
        questions: parsed.questions,
        total_points: parsed.total_points
      }))
      setActiveTab('manual')
      alert(`Successfully parsed ${parsed.questions.length} questions from markdown!`)
    } catch (error) {
      console.error('Error parsing markdown:', error)
      alert('Error parsing markdown. Please check the format.')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/markdown') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setMarkdownContent(content)
      }
      reader.readAsText(file)
    } else {
      alert('Please select a valid markdown file (.md)')
    }
  }

  const saveAssignment = async (publish: boolean = false) => {
    if (!assignment.title || !assignment.questions?.length) {
      alert('Please provide a title and at least one question.')
      return
    }

    // Backend functionality disabled - keeping frontend only
    // const { data, error } = await supabase
    //   .from('assignments')
    //   .insert([{
    //     ...assignment,
    //     published: publish,
    //     updated_at: new Date().toISOString()
    //   }])
    //   .select()
    //   .single()

    // if (error) {
    //   console.error('Error saving assignment:', error)
    //   alert('Error saving assignment')
    // } else {
    //   alert(publish ? 'Assignment published!' : 'Assignment saved as draft!')
    //   router.push('/admin/assignments')
    // }
    
    // Simulate success for frontend demo
    alert('Assignment creation is currently disabled (frontend demo mode)')
    console.log('Assignment data (frontend only):', { ...assignment, published: publish })
  }

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Create Assignment</h1>
        <div className="flex gap-2">
          <Button onClick={() => saveAssignment(false)} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => saveAssignment(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manual Creation
          </TabsTrigger>
          <TabsTrigger value="markdown" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Markdown Upload
          </TabsTrigger>
        </TabsList>

        {/* Markdown upload tab removed - keeping manual creation only */}
        <TabsContent value="markdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Markdown Upload Disabled</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Markdown upload functionality has been disabled.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please use the Manual Creation tab to create assignments.
                </p>
                <Button 
                  onClick={() => setActiveTab('manual')} 
                  className="mt-4"
                  variant="outline"
                >
                  Go to Manual Creation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
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
            <Button onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
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
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Question
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
