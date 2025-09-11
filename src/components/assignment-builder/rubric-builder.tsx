"use client"
import { useState } from 'react'
import { RubricCriterion } from '@/types/assignment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, GripVertical } from 'lucide-react'

interface RubricBuilderProps {
  rubric: RubricCriterion[]
  onRubricChange: (rubric: RubricCriterion[]) => void
  maxPoints?: number
}

export default function RubricBuilder({ rubric, onRubricChange, maxPoints = 100 }: RubricBuilderProps) {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null)

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `criterion-${Date.now()}`,
      name: '',
      description: '',
      maxPoints: 10,
      levels: [
        { score: 10, description: 'Excellent' },
        { score: 8, description: 'Good' },
        { score: 6, description: 'Satisfactory' },
        { score: 4, description: 'Needs Improvement' },
        { score: 0, description: 'Inadequate' }
      ]
    }
    onRubricChange([...rubric, newCriterion])
    setExpandedCriterion(newCriterion.id)
  }

  const updateCriterion = (id: string, updates: Partial<RubricCriterion>) => {
    const updatedRubric = rubric.map(criterion =>
      criterion.id === id ? { ...criterion, ...updates } : criterion
    )
    onRubricChange(updatedRubric)
  }

  const deleteCriterion = (id: string) => {
    const updatedRubric = rubric.filter(criterion => criterion.id !== id)
    onRubricChange(updatedRubric)
    if (expandedCriterion === id) {
      setExpandedCriterion(null)
    }
  }

  const addLevel = (criterionId: string) => {
    const criterion = rubric.find(c => c.id === criterionId)
    if (!criterion) return

    const newLevel = {
      score: Math.max(0, Math.min(...criterion.levels.map(l => l.score)) - 1),
      description: ''
    }

    updateCriterion(criterionId, {
      levels: [...criterion.levels, newLevel].sort((a, b) => b.score - a.score)
    })
  }

  const updateLevel = (criterionId: string, levelIndex: number, updates: { score?: number; description?: string }) => {
    const criterion = rubric.find(c => c.id === criterionId)
    if (!criterion) return

    const updatedLevels = criterion.levels.map((level, index) =>
      index === levelIndex ? { ...level, ...updates } : level
    )

    updateCriterion(criterionId, { levels: updatedLevels.sort((a, b) => b.score - a.score) })
  }

  const deleteLevel = (criterionId: string, levelIndex: number) => {
    const criterion = rubric.find(c => c.id === criterionId)
    if (!criterion || criterion.levels.length <= 2) return // Keep at least 2 levels

    const updatedLevels = criterion.levels.filter((_, index) => index !== levelIndex)
    updateCriterion(criterionId, { levels: updatedLevels })
  }

  const getTotalPoints = () => {
    return rubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Grading Rubric</h3>
          <p className="text-sm text-muted-foreground">
            Define criteria and scoring levels for automated grading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Total: {getTotalPoints()} / {maxPoints} points
          </Badge>
          <Button onClick={addCriterion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
        </div>
      </div>

      {rubric.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No rubric criteria defined</p>
            <Button onClick={addCriterion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Criterion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rubric.map((criterion, index) => (
            <Card key={criterion.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        Criterion {index + 1}
                        {criterion.name && `: ${criterion.name}`}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{criterion.maxPoints} pts</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCriterion(
                        expandedCriterion === criterion.id ? null : criterion.id
                      )}
                    >
                      {expandedCriterion === criterion.id ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCriterion(criterion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedCriterion === criterion.id && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Criterion Name</label>
                      <Input
                        value={criterion.name}
                        onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                        placeholder="e.g., Scientific Accuracy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Points</label>
                      <Input
                        type="number"
                        min="1"
                        value={criterion.maxPoints}
                        onChange={(e) => updateCriterion(criterion.id, { maxPoints: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      value={criterion.description}
                      onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                      placeholder="Describe what this criterion evaluates..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">Scoring Levels</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addLevel(criterion.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Level
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {criterion.levels.map((level, levelIndex) => (
                        <div key={levelIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-20">
                            <Input
                              type="number"
                              min="0"
                              max={criterion.maxPoints}
                              value={level.score}
                              onChange={(e) => updateLevel(criterion.id, levelIndex, { 
                                score: parseInt(e.target.value) || 0 
                              })}
                              className="text-center"
                            />
                            <p className="text-xs text-muted-foreground text-center mt-1">points</p>
                          </div>
                          <div className="flex-1">
                            <Input
                              value={level.description}
                              onChange={(e) => updateLevel(criterion.id, levelIndex, { 
                                description: e.target.value 
                              })}
                              placeholder="Describe this performance level..."
                            />
                          </div>
                          {criterion.levels.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLevel(criterion.id, levelIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {getTotalPoints() > maxPoints && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Warning: Total rubric points ({getTotalPoints()}) exceed maximum allowed points ({maxPoints})
          </p>
        </div>
      )}
    </div>
  )
}
