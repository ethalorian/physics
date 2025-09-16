"use client"
import { useState } from 'react'
import { Question } from '@/types/assignment'
import { useQuestionBank } from '@/contexts/QuestionBankContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { X, Plus, Save, BookOpen } from 'lucide-react'
import MathMarkdown from '@/components/MathMarkdown'

interface AddToQuestionBankModalProps {
  question: Question
  onClose: () => void
  onSuccess?: () => void
}

export default function AddToQuestionBankModal({ question, onClose, onSuccess }: AddToQuestionBankModalProps) {
  const { units, addQuestion } = useQuestionBank()
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [topics, setTopics] = useState<string[]>([])
  const [currentTopic, setCurrentTopic] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [estimatedTime, setEstimatedTime] = useState(5)
  const [cognitiveLevel, setCognitiveLevel] = useState<'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'>('apply')
  const [saving, setSaving] = useState(false)

  const selectedUnitData = units.find(u => u.id === selectedUnit)
  const availableLessons = selectedUnitData?.lessons || []

  const handleAddTopic = () => {
    if (currentTopic && !topics.includes(currentTopic)) {
      setTopics([...topics, currentTopic])
      setCurrentTopic('')
    }
  }

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag('')
    }
  }

  const handleSave = async () => {
    if (!selectedUnit || !selectedLesson) {
      alert('Please select a unit and lesson')
      return
    }

    if (topics.length === 0) {
      alert('Please add at least one topic')
      return
    }

    setSaving(true)
    try {
      addQuestion({
        question,
        unit: selectedUnit,
        lesson: selectedLesson,
        topics,
        difficulty,
        tags,
        estimated_time: estimatedTime,
        cognitive_level: cognitiveLevel
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error('Error adding to question bank:', error)
      alert('Failed to add question to bank')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Add to Question Bank
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Save this question for future use
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <MathMarkdown content={question.question} />
                <div className="flex gap-2">
                  <Badge variant="outline">{question.type}</Badge>
                  <Badge variant="outline">{question.points} points</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unit and Lesson Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select value={selectedUnit} onValueChange={(value) => {
                setSelectedUnit(value)
                setSelectedLesson('') // Reset lesson when unit changes
              }}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lesson">Lesson *</Label>
              <Select 
                value={selectedLesson} 
                onValueChange={setSelectedLesson}
                disabled={!selectedUnit}
              >
                <SelectTrigger id="lesson">
                  <SelectValue placeholder="Select a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {availableLessons.map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty and Cognitive Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cognitive">Cognitive Level</Label>
              <Select value={cognitiveLevel} onValueChange={(value) => setCognitiveLevel(value as any)}>
                <SelectTrigger id="cognitive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remember">Remember 🧠</SelectItem>
                  <SelectItem value="understand">Understand 💡</SelectItem>
                  <SelectItem value="apply">Apply ⚙️</SelectItem>
                  <SelectItem value="analyze">Analyze 🔍</SelectItem>
                  <SelectItem value="evaluate">Evaluate ⚖️</SelectItem>
                  <SelectItem value="create">Create 🎨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topics */}
          <div>
            <Label htmlFor="topics">Topics * (e.g., kinematics, velocity, acceleration)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="topics"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                placeholder="Enter a topic"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTopic}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setTopics(topics.filter((_, i) => i !== idx))}
                  >
                    {topic} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Enter a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                  >
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Estimated Time */}
          <div>
            <Label htmlFor="time">Estimated Time (minutes)</Label>
            <Input
              id="time"
              type="number"
              min="1"
              max="60"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 5)}
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedUnit || !selectedLesson || topics.length === 0}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Add to Question Bank
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
