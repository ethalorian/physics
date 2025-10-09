"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Save, 
  Trash2, 
  Settings, 
  FileText,
  Clock,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Copy
} from 'lucide-react'
import QuestionEditor from '@/components/assignment-builder/question-editor'
import { Question, QuestionType, MultipleChoiceQuestion, NumericalQuestion } from '@/types/assignment'

interface SimulationAssignment {
  id?: string
  simulation_slug: string
  simulation_id?: string
  title: string
  description?: string
  instructions?: string
  questions: Question[]
  total_points?: number
  show_on_start: boolean
  show_on_complete: boolean
  allow_skip: boolean
  required_for_progress: boolean
  time_limit?: number
  available_after: number
  max_attempts: number
  allow_late_submission: boolean
  published: boolean
}

interface SimulationAssignmentEditorProps {
  isOpen: boolean
  onClose: () => void
  simulationSlug: string
  simulationId?: string
  assignment?: SimulationAssignment
  onSave: (assignment: SimulationAssignment) => void
}

export default function SimulationAssignmentEditor({
  isOpen,
  onClose,
  simulationSlug,
  simulationId,
  assignment,
  onSave
}: SimulationAssignmentEditorProps) {
  const [formData, setFormData] = useState<SimulationAssignment>({
    simulation_slug: simulationSlug,
    simulation_id: simulationId,
    title: '',
    description: '',
    instructions: '',
    questions: [],
    show_on_start: false,
    show_on_complete: false,
    allow_skip: true,
    required_for_progress: false,
    time_limit: undefined,
    available_after: 0,
    max_attempts: 1,
    allow_late_submission: true,
    published: false,
    ...assignment
  })
  
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  // Update form when assignment prop changes
  useEffect(() => {
    if (assignment) {
      setFormData({
        ...formData,
        ...assignment
      })
    }
  }, [assignment])

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('Please enter a title for the assignment')
      return
    }

    if (formData.questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    setSaving(true)
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const response = await fetch('/api/simulations/assignments', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        onSave(data.assignment)
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Failed to save assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      points: 10,
      options: ['', '', '', ''],
      correctAnswer: 0
    } as MultipleChoiceQuestion

    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    })
  }

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = updatedQuestion
    setFormData({
      ...formData,
      questions: newQuestions
    })
  }

  const deleteQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      questions: newQuestions
    })
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...formData.questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]
      setFormData({
        ...formData,
        questions: newQuestions
      })
    }
  }

  const duplicateQuestion = (index: number) => {
    const questionToDupe = { ...formData.questions[index] }
    questionToDupe.id = `q-${Date.now()}`
    
    const newQuestions = [...formData.questions]
    newQuestions.splice(index + 1, 0, questionToDupe)
    
    setFormData({
      ...formData,
      questions: newQuestions
    })
  }

  const totalPoints = formData.questions.reduce((sum, q) => sum + (q.points || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {assignment?.id ? 'Edit' : 'Create'} Simulation Assignment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details">
              <Settings className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="questions">
              <FileText className="h-4 w-4 mr-2" />
              Questions ({formData.questions.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Clock className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the assignment..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instructions for students..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Assignment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Questions:</span>
                    <span className="font-medium">{formData.questions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Points:</span>
                    <span className="font-medium">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={formData.published ? 'default' : 'secondary'}>
                      {formData.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {formData.questions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add questions to create your assignment
                    </p>
                    <Button onClick={addQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <div key={question.id || index} className="relative">
                      <div className="absolute -left-12 top-4 flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === formData.questions.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateQuestion(index)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <QuestionEditor
                        question={question}
                        onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                        onDelete={() => deleteQuestion(index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Display Settings</CardTitle>
                  <CardDescription>Control when the assignment appears</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="show_on_start">Show on Simulation Start</Label>
                      <p className="text-sm text-muted-foreground">
                        Display assignment when student starts the simulation
                      </p>
                    </div>
                    <Switch
                      id="show_on_start"
                      checked={formData.show_on_start}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_on_start: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="show_on_complete">Show on Simulation Complete</Label>
                      <p className="text-sm text-muted-foreground">
                        Display assignment when simulation is completed
                      </p>
                    </div>
                    <Switch
                      id="show_on_complete"
                      checked={formData.show_on_complete}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_on_complete: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="available_after">Available After (seconds)</Label>
                    <Input
                      id="available_after"
                      type="number"
                      value={formData.available_after}
                      onChange={(e) => setFormData({ ...formData, available_after: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Show assignment after this many seconds in the simulation
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Completion Requirements</CardTitle>
                  <CardDescription>Set requirements and limitations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="required_for_progress">Required for Progress</Label>
                      <p className="text-sm text-muted-foreground">
                        Students must complete this to mark simulation as done
                      </p>
                    </div>
                    <Switch
                      id="required_for_progress"
                      checked={formData.required_for_progress}
                      onCheckedChange={(checked) => setFormData({ ...formData, required_for_progress: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="allow_skip">Allow Skip</Label>
                      <p className="text-sm text-muted-foreground">
                        Students can skip this assignment
                      </p>
                    </div>
                    <Switch
                      id="allow_skip"
                      checked={formData.allow_skip}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_skip: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                      <Input
                        id="time_limit"
                        type="number"
                        value={formData.time_limit || ''}
                        onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || undefined })}
                        min="1"
                        placeholder="No limit"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_attempts">Max Attempts</Label>
                      <Input
                        id="max_attempts"
                        type="number"
                        value={formData.max_attempts}
                        onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="10"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="allow_late_submission">Allow Late Submission</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept submissions after due date
                      </p>
                    </div>
                    <Switch
                      id="allow_late_submission"
                      checked={formData.allow_late_submission}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_late_submission: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Publication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="published">Publish Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Make assignment visible to students
                      </p>
                    </div>
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {formData.questions.length} question(s) • {totalPoints} total points
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {assignment?.id ? 'Update' : 'Create'} Assignment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
