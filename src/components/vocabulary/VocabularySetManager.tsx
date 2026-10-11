"use client"
import { Spinner } from '@/components/ui/spinner'
import { useEffect, useState } from 'react'
import { useVocabulary, VocabularySet } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, BookOpen, Save, X, Upload, Eye, EyeOff } from 'lucide-react'
import { physicsUnits } from '@/data/physics-units'
import VocabularyUploader from './VocabularyUploader'
import VocabularySourcePicker from './VocabularySourcePicker'
import VocabularyConnectionEditor from './VocabularyConnectionEditor'
import type {VocabularyTeachingChoice,VocabularyTeachingSource} from '@/lib/vocab-teaching-source'

interface VocabularySetManagerProps {
  onSelectSet?: (vocabularySet: VocabularySet) => void
  selectedSetId?: string
}

export default function VocabularySetManager({ onSelectSet, selectedSetId }: VocabularySetManagerProps) {
  const { vocabularySets, createVocabularySet, deleteVocabularySet, addTermToSet, deleteTerm, publishVocabularySet, updateVocabularySet, loading, error } = useVocabulary()
  const [choices,setChoices]=useState<VocabularyTeachingChoice[]>([])
  const [choicesError,setChoicesError]=useState(''),[choicesLoading,setChoicesLoading]=useState(true),[choicesRetry,setChoicesRetry]=useState(0),[creating,setCreating]=useState(false)
  const [connecting,setConnecting]=useState('')
  useEffect(()=>{const abort=new AbortController();setChoicesLoading(true);setChoicesError('');fetch('/api/vocab/teaching-sources',{signal:abort.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error??'Could not load teaching sources');return d}).then(d=>{if(!abort.signal.aborted)setChoices(d.sources)}).catch(e=>{if(!abort.signal.aborted)setChoicesError(e.message)}).finally(()=>{if(!abort.signal.aborted)setChoicesLoading(false)});return()=>abort.abort()},[choicesRetry])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [newSetData, setNewSetData] = useState({
    name: '',
    description: '',
    unit: '',
    lesson: '',
    teachingSource: {kind:'none'} as VocabularyTeachingSource|null
  })
  const [newTerm, setNewTerm] = useState({
    term: '',
    definition: '',
    category: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  })

  const handlePublishToggle = async (setId: string, currentPublishedStatus: boolean) => {
    try {
      await publishVocabularySet(setId, !currentPublishedStatus)
    } catch (error) {
      console.error('Error toggling publish status:', error)
    }
  }

  const handleCreateSet = async () => {
    if (creating || !newSetData.name.trim() || !newSetData.teachingSource || !newSetData.unit) return
    setCreating(true)

    try {
      await createVocabularySet({
        ...newSetData,
        terms: [],
        published: false
      })
      setNewSetData({ name: '', description: '', unit: '', lesson: '', teachingSource:{kind:'none'} })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating vocabulary set:', error)
    } finally {setCreating(false)}
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



  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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

      {choicesError&&<p role="alert" className="text-destructive">{choicesError} <Button variant="outline" onClick={()=>setChoicesRetry(n=>n+1)}>Reload video and deck choices</Button></p>}
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

            <VocabularySourcePicker choices={choices} value={newSetData.teachingSource} unit={newSetData.unit} disabled={creating||choicesLoading} onChange={(teachingSource,unit)=>setNewSetData({...newSetData,teachingSource,unit,lesson:''})}/>

            <div className="flex gap-2">
              <Button disabled={creating||choicesLoading||!!choicesError||!newSetData.name.trim()||!newSetData.unit||!newSetData.teachingSource} onClick={handleCreateSet}>
                <Save className="w-4 h-4 mr-2" />
                Create Set
              </Button>
              <Button disabled={creating} variant="outline" onClick={() => setShowCreateForm(false)}>
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
            <div className="flex flex-wrap items-start justify-between gap-3">
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
          <Spinner size="md" className="text-primary" />
        </div>
      )}

      <div className="grid gap-6">
        {vocabularySets.map((set) => (
          <Card key={set.id} className={selectedSetId === set.id ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {set.name}
                  </CardTitle>
                  {set.teachingConnection&&<p className="mt-2 text-sm">Connected {set.teachingConnection.source.kind==='deck'?'presentation deck':'video lesson'}: <a className="underline" href={set.teachingConnection.href} target="_blank" rel="noopener noreferrer">{set.teachingConnection.label}</a></p>}
                  <Button variant="outline" className="mt-2 min-h-11" disabled={choicesLoading||!!choicesError} onClick={()=>setConnecting(connecting===set.id?'':set.id)}>Connect to video or deck</Button>
                  {set.published && <a className="ml-2 inline-block min-h-11 py-2 underline text-sm" href={`/admin/vocabulary/assign?set_id=${set.id}`}>Assign these words</a>}
                  {set.description && (
                    <p className="text-sm text-muted-foreground mt-1">{set.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{set.terms.length} terms</Badge>
                    {set.unit && (
                      <Badge variant="outline">
                        {set.teachingConnection?.unit_name || physicsUnits.find(u => u.id === set.unit)?.name || set.unit}
                      </Badge>
                    )}
                    <Badge variant={set.published ? "default" : "secondary"} className={set.published ? "bg-success" : ""}>
                      {set.published ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={set.published ? "outline" : "default"}
                    size="sm"
                    onClick={() => handlePublishToggle(set.id, set.published)}
                    className={set.published ? "" : "bg-success hover:bg-success"}
                  >
                    {set.published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
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

            {connecting===set.id&&<CardContent><VocabularyConnectionEditor key={set.id} set={set} choices={choices} onCancel={()=>setConnecting('')} onSave={async(teachingSource,unit)=>{await updateVocabularySet(set.id,{teachingSource,unit});setConnecting('')}}/></CardContent>}
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
