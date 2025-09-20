"use client"
import { useState } from 'react'
import { VocabularyMatchingQuestion, VocabularyCrosswordQuestion, VocabularyFillBlankQuestion, VocabularyHangmanQuestion, VocabularyTerm } from '@/types/assignment'
import { VocabularySet } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, BookOpen, Shuffle, Wand2, Target } from 'lucide-react'
import VocabularySetManager from '@/components/vocabulary/VocabularySetManager'

type VocabularyQuestion = VocabularyMatchingQuestion | VocabularyCrosswordQuestion | VocabularyFillBlankQuestion | VocabularyHangmanQuestion

interface VocabularyQuestionEditorProps {
  question: VocabularyQuestion
  onUpdate: (question: VocabularyQuestion) => void
  onDelete: () => void
}

export default function VocabularyQuestionEditor({ question, onUpdate, onDelete }: VocabularyQuestionEditorProps) {
  const [showVocabularyManager, setShowVocabularyManager] = useState(false)
  const [selectedVocabularySet, setSelectedVocabularySet] = useState<VocabularySet | null>(null)
  const [customSentence, setCustomSentence] = useState('')

  const updateQuestion = (updates: Partial<VocabularyQuestion>) => {
    onUpdate({ ...question, ...updates } as VocabularyQuestion)
  }

  const handleSelectVocabularySet = (vocabularySet: VocabularySet) => {
    setSelectedVocabularySet(vocabularySet)
    updateQuestion({ vocabularyTerms: vocabularySet.terms })
    setShowVocabularyManager(false)
  }

  const addCustomTerm = () => {
    const newTerm: VocabularyTerm = {
      id: `custom-term-${Date.now()}`,
      term: '',
      definition: '',
      difficulty: 'medium'
    }
    updateQuestion({ 
      vocabularyTerms: [...(question.vocabularyTerms || []), newTerm] 
    })
  }

  const updateTerm = (termId: string, updates: Partial<VocabularyTerm>) => {
    updateQuestion({
      vocabularyTerms: (question.vocabularyTerms || []).map(term =>
        term.id === termId ? { ...term, ...updates } : term
      )
    })
  }

  const removeTerm = (termId: string) => {
    updateQuestion({
      vocabularyTerms: (question.vocabularyTerms || []).filter(term => term.id !== termId)
    })
  }

  const shuffleTerms = () => {
    const shuffled = [...(question.vocabularyTerms || [])].sort(() => Math.random() - 0.5)
    updateQuestion({ vocabularyTerms: shuffled })
  }

  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false)

  const generateSentences = async () => {
    if (question.type !== 'vocabulary-fill-blank' || (question.vocabularyTerms || []).length === 0) return

    setIsGeneratingSentences(true)
    try {
      const response = await fetch('/api/generate-vocab-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocabularyTerms: question.vocabularyTerms,
          context: selectedVocabularySet?.description || 'Physics vocabulary practice',
          unit: selectedVocabularySet?.unit || '',
          lesson: selectedVocabularySet?.lesson || '',
          gameType: 'fill-in-the-blank'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate sentences')
      }

      const data = await response.json()
      
      if (data.success && data.sentences) {
        updateQuestion({ 
          sentences: data.sentences 
        } as Partial<VocabularyFillBlankQuestion>)
        
        if (data.note) {
          console.log('Sentence generation note:', data.note)
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error generating sentences:', error)
      
      // Fallback to simple sentences
      const fallbackSentences = (question.vocabularyTerms || []).map((term) => ({
        id: `sentence-${term.id}`,
        text: `The concept of {term} is important in physics.`,
        termId: term.id
      }))

      updateQuestion({ 
        sentences: fallbackSentences 
      } as Partial<VocabularyFillBlankQuestion>)
      
      alert('AI sentence generation failed. Using simple fallback sentences. You can edit them manually.')
    } finally {
      setIsGeneratingSentences(false)
    }
  }

  const addCustomSentence = () => {
    if (question.type !== 'vocabulary-fill-blank' || !customSentence.trim()) return

    const availableTerms = (question.vocabularyTerms || []).filter(term => 
      !(question as VocabularyFillBlankQuestion).sentences?.some(s => s.termId === term.id)
    )

    if (availableTerms.length === 0) {
      alert('All terms are already used in sentences')
      return
    }

    const newSentence = {
      id: `sentence-${Date.now()}`,
      text: customSentence,
      termId: availableTerms[0].id
    }

    const currentSentences = (question as VocabularyFillBlankQuestion).sentences || []
    updateQuestion({ 
      sentences: [...currentSentences, newSentence]
    } as Partial<VocabularyFillBlankQuestion>)
    
    setCustomSentence('')
  }

  const updateSentence = (sentenceId: string, updates: { text?: string, termId?: string }) => {
    if (question.type !== 'vocabulary-fill-blank') return

    const currentSentences = (question as VocabularyFillBlankQuestion).sentences || []
    updateQuestion({
      sentences: currentSentences.map(sentence =>
        sentence.id === sentenceId ? { ...sentence, ...updates } : sentence
      )
    } as Partial<VocabularyFillBlankQuestion>)
  }

  const removeSentence = (sentenceId: string) => {
    if (question.type !== 'vocabulary-fill-blank') return

    const currentSentences = (question as VocabularyFillBlankQuestion).sentences || []
    updateQuestion({
      sentences: currentSentences.filter(sentence => sentence.id !== sentenceId)
    } as Partial<VocabularyFillBlankQuestion>)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {question.type === 'vocabulary-matching' && 'Vocabulary Matching Game'}
            {question.type === 'vocabulary-crossword' && 'Vocabulary Crossword Game'}
            {question.type === 'vocabulary-fill-blank' && 'Fill in the Blank Game'}
            {question.type === 'vocabulary-hangman' && 'Vocabulary Hangman Game'}
          </CardTitle>
          <Button variant="outline" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Question Info */}
        <div className="grid gap-4">
          <div>
            <Label htmlFor="question-title">Question Title</Label>
            <Input
              id="question-title"
              value={question.question}
              onChange={(e) => updateQuestion({ question: e.target.value })}
              placeholder="Enter a title for this vocabulary game"
            />
          </div>

          <div>
            <Label htmlFor="question-instructions">Instructions (Optional)</Label>
            <Textarea
              id="question-instructions"
              value={question.instructions || ''}
              onChange={(e) => updateQuestion({ instructions: e.target.value })}
              placeholder="Special instructions for students"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min="1"
                value={question.points}
                onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 1 })}
              />
            </div>

            {question.type === 'vocabulary-crossword' && (
              <div>
                <Label htmlFor="grid-size">Grid Size</Label>
                <Select 
                  value={String((question as VocabularyCrosswordQuestion).gridSize || 15)} 
                  onValueChange={(value) => updateQuestion({ gridSize: parseInt(value) } as Partial<VocabularyCrosswordQuestion>)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10x10</SelectItem>
                    <SelectItem value="15">15x15</SelectItem>
                    <SelectItem value="20">20x20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {question.type === 'vocabulary-fill-blank' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-word-bank"
                  checked={(question as VocabularyFillBlankQuestion).showWordBank || false}
                  onCheckedChange={(checked) => updateQuestion({ showWordBank: checked } as Partial<VocabularyFillBlankQuestion>)}
                />
                <Label htmlFor="show-word-bank">Show word bank</Label>
              </div>
            )}

            {question.type === 'vocabulary-hangman' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-wrong-guesses">Max Wrong Guesses</Label>
                  <Select 
                    value={String((question as VocabularyHangmanQuestion).maxWrongGuesses || 6)} 
                    onValueChange={(value) => updateQuestion({ maxWrongGuesses: parseInt(value) } as Partial<VocabularyHangmanQuestion>)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 (Hard)</SelectItem>
                      <SelectItem value="6">6 (Normal)</SelectItem>
                      <SelectItem value="8">8 (Easy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="words-per-game">Words Per Game</Label>
                  <Select 
                    value={String((question as VocabularyHangmanQuestion).wordsPerGame || 10)} 
                    onValueChange={(value) => updateQuestion({ wordsPerGame: parseInt(value) } as Partial<VocabularyHangmanQuestion>)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 words</SelectItem>
                      <SelectItem value="10">10 words</SelectItem>
                      <SelectItem value="15">15 words</SelectItem>
                      <SelectItem value="20">20 words</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-definitions"
                      checked={(question as VocabularyHangmanQuestion).showDefinitions !== false}
                      onCheckedChange={(checked) => updateQuestion({ showDefinitions: checked } as Partial<VocabularyHangmanQuestion>)}
                    />
                    <Label htmlFor="show-definitions">Show definitions as hints</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vocabulary Terms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Vocabulary Terms</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVocabularyManager(true)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Load from Set
              </Button>
              <Button variant="outline" size="sm" onClick={addCustomTerm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Term
              </Button>
              <Button variant="outline" size="sm" onClick={shuffleTerms}>
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle
              </Button>
            </div>
          </div>

          {selectedVocabularySet && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Using vocabulary set: <strong>{selectedVocabularySet.name}</strong>
              {selectedVocabularySet.description && (
                <span> - {selectedVocabularySet.description}</span>
              )}
            </div>
          )}

          <div className="space-y-3">
            {question.vocabularyTerms?.map((term, index) => (
              <Card key={term.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`term-${term.id}`}>Term</Label>
                    <Input
                      id={`term-${term.id}`}
                      value={term.term}
                      onChange={(e) => updateTerm(term.id, { term: e.target.value })}
                      placeholder="Vocabulary term"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`definition-${term.id}`}>Definition</Label>
                    <Input
                      id={`definition-${term.id}`}
                      value={term.definition}
                      onChange={(e) => updateTerm(term.id, { definition: e.target.value })}
                      placeholder="Definition"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    {term.difficulty && (
                      <Badge variant={term.difficulty === 'easy' ? 'default' : term.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                        {term.difficulty}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeTerm(term.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {(question.vocabularyTerms || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No vocabulary terms added yet</p>
              <p className="text-sm">Add terms manually or load from a vocabulary set</p>
            </div>
          )}
        </div>

        {/* Fill-in-the-blank specific options */}
        {question.type === 'vocabulary-fill-blank' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Sentences</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSentences}
                  disabled={(question.vocabularyTerms || []).length === 0 || isGeneratingSentences}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isGeneratingSentences ? 'Generating...' : 'Auto-Generate'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={customSentence}
                onChange={(e) => setCustomSentence(e.target.value)}
                placeholder="Enter a sentence with {term} as placeholder"
              />
              <Button onClick={addCustomSentence} disabled={!customSentence.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Use {'{term}'} in your sentence where the vocabulary word should go</p>
              <p>💡 <strong>Auto-Generate</strong> uses AI to create contextual physics sentences for each term</p>
            </div>

            <div className="space-y-3">
              {(question as VocabularyFillBlankQuestion).sentences?.map((sentence) => {
                const associatedTerm = (question.vocabularyTerms || []).find(t => t.id === sentence.termId)
                
                return (
                  <Card key={sentence.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`sentence-${sentence.id}`}>Sentence</Label>
                        <Input
                          id={`sentence-${sentence.id}`}
                          value={sentence.text}
                          onChange={(e) => updateSentence(sentence.id, { text: e.target.value })}
                          placeholder="Sentence with {term} placeholder"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label>Answer:</Label>
                          <Select
                            value={sentence.termId}
                            onValueChange={(value) => updateSentence(sentence.id, { termId: value })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(question.vocabularyTerms || []).map((term) => (
                                <SelectItem key={term.id} value={term.id}>
                                  {term.term}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {associatedTerm && (
                            <Badge variant="outline">{associatedTerm.term}</Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeSentence(sentence.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {!(question as VocabularyFillBlankQuestion).sentences?.length && (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                <p>No sentences created yet</p>
                <p className="text-sm">Add sentences manually or use auto-generate</p>
              </div>
            )}
          </div>
        )}

        {/* Game Preview */}
        {(question.vocabularyTerms || []).length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Game Preview</h4>
            <div className="text-sm text-muted-foreground">
              {question.type === 'vocabulary-matching' && 
                `Students will match ${(question.vocabularyTerms || []).length} terms with their definitions.`
              }
              {question.type === 'vocabulary-crossword' && 
                `Students will complete a crossword puzzle with ${(question.vocabularyTerms || []).length} vocabulary terms.`
              }
              {question.type === 'vocabulary-fill-blank' && 
                `Students will fill in ${(question as VocabularyFillBlankQuestion).sentences?.length || 0} sentences using ${(question.vocabularyTerms || []).length} vocabulary terms.`
              }
              {question.type === 'vocabulary-hangman' && 
                `Students will play hangman with ${Math.min((question as VocabularyHangmanQuestion).wordsPerGame || 10, (question.vocabularyTerms || []).length)} physics terms. ${(question as VocabularyHangmanQuestion).maxWrongGuesses || 6} wrong guesses allowed per word.`
              }
            </div>
          </div>
        )}
      </CardContent>

      {/* Vocabulary Set Manager Modal */}
      {showVocabularyManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Vocabulary Set</h3>
                <Button variant="outline" onClick={() => setShowVocabularyManager(false)}>
                  Cancel
                </Button>
              </div>
              <VocabularySetManager 
                onSelectSet={handleSelectVocabularySet}
                selectedSetId={selectedVocabularySet?.id}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
