"use client"
import { useState } from 'react'
import { useVocabulary, VocabularySet } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, BookOpen, Save, X, Upload } from 'lucide-react'
import { physicsUnits } from '@/data/physics-units'
import VocabularyUploader from './VocabularyUploader'

interface VocabularySetManagerProps {
  onSelectSet?: (vocabularySet: VocabularySet) => void
  selectedSetId?: string
}

export default function VocabularySetManager({ onSelectSet, selectedSetId }: VocabularySetManagerProps) {
  const { vocabularySets, createVocabularySet, deleteVocabularySet, addTermToSet, deleteTerm, loading, error } = useVocabulary()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [newSetData, setNewSetData] = useState({
    name: '',
    description: '',
    unit: '',
    lesson: ''
  })
  const [newTerm, setNewTerm] = useState({
    term: '',
    definition: '',
    category: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  })

  const handleCreateSet = async () => {
    if (!newSetData.name.trim()) return

    try {
      await createVocabularySet({
        ...newSetData,
        terms: []
      })
      setNewSetData({ name: '', description: '', unit: '', lesson: '' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating vocabulary set:', error)
    }
  }

  const handleAddTerm = async (setId: string) => {
    if (!newTerm.term.trim() || !newTerm.definition.trim()) return

    try {
      await addTermToSet(setId, newTerm)
      setNewTerm({ term: '', definition: '', category: '', difficulty: 'medium' })
    } catch (error) {
      console.error('Error adding term:', error)
    }
  }


  const selectedUnit = physicsUnits.find(unit => unit.id === newSetData.unit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vocabulary Sets</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowUploader(true)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Set
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Vocabulary Set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="set-name">Set Name</Label>
              <Input
                id="set-name"
                value={newSetData.name}
                onChange={(e) => setNewSetData({ ...newSetData, name: e.target.value })}
                placeholder="e.g., Unit 1 - Motion Vocabulary"
              />
            </div>
            
            <div>
              <Label htmlFor="set-description">Description (Optional)</Label>
              <Textarea
                id="set-description"
                value={newSetData.description}
                onChange={(e) => setNewSetData({ ...newSetData, description: e.target.value })}
                placeholder="Brief description of this vocabulary set"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="set-unit">Physics Unit (Optional)</Label>
                <Select value={newSetData.unit || 'none'} onValueChange={(value) => setNewSetData({ ...newSetData, unit: value === 'none' ? '' : value, lesson: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific unit</SelectItem>
                    {physicsUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="set-lesson">Lesson (Optional)</Label>
                <Select value={newSetData.lesson || 'none'} onValueChange={(value) => setNewSetData({ ...newSetData, lesson: value === 'none' ? '' : value })} disabled={!selectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific lesson</SelectItem>
                    {selectedUnit?.lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateSet}>
                <Save className="w-4 h-4 mr-2" />
                Create Set
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showUploader && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upload Vocabulary</CardTitle>
              <Button variant="outline" size="icon" onClick={() => setShowUploader(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <VocabularyUploader />
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="grid gap-6">
        {vocabularySets.map((set) => (
          <Card key={set.id} className={selectedSetId === set.id ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {set.name}
                  </CardTitle>
                  {set.description && (
                    <p className="text-sm text-muted-foreground mt-1">{set.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{set.terms.length} terms</Badge>
                    {set.unit && (
                      <Badge variant="outline">
                        {physicsUnits.find(u => u.id === set.unit)?.name || set.unit}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {onSelectSet && (
                    <Button
                      variant={selectedSetId === set.id ? "default" : "outline"}
                      onClick={() => onSelectSet(set)}
                    >
                      {selectedSetId === set.id ? 'Selected' : 'Select'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingSetId(editingSetId === set.id ? null : set.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteVocabularySet(set.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {editingSetId === set.id && (
              <CardContent className="border-t">
                <div className="space-y-4">
                  <h4 className="font-semibold">Terms ({set.terms.length})</h4>
                  
                  {/* Add new term form */}
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h5 className="font-medium">Add New Term</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`term-${set.id}`}>Term</Label>
                        <Input
                          id={`term-${set.id}`}
                          value={newTerm.term}
                          onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                          placeholder="Vocabulary term"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`definition-${set.id}`}>Definition</Label>
                        <Input
                          id={`definition-${set.id}`}
                          value={newTerm.definition}
                          onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                          placeholder="Definition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`category-${set.id}`}>Category (Optional)</Label>
                        <Input
                          id={`category-${set.id}`}
                          value={newTerm.category}
                          onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                          placeholder="e.g., Forces, Energy"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`difficulty-${set.id}`}>Difficulty</Label>
                        <Select value={newTerm.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewTerm({ ...newTerm, difficulty: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={() => handleAddTerm(set.id)} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Term
                    </Button>
                  </div>

                  {/* Terms list */}
                  <div className="space-y-2">
                    {set.terms.map((term) => (
                      <div key={term.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{term.term}</div>
                          <div className="text-sm text-muted-foreground">{term.definition}</div>
                          {term.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {term.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Badge variant={term.difficulty === 'easy' ? 'default' : term.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                            {term.difficulty}
                          </Badge>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteTerm(set.id, term.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {vocabularySets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No vocabulary sets yet</h3>
          <p>Create your first vocabulary set to get started with vocabulary games.</p>
        </div>
      )}
    </div>
  )
}
