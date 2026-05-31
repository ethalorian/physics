"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lesson, LessonVideo } from '@/types/assignment'
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Trash2,
  Plus,
  X,
  Video,
  Target,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LessonVideoManager from './LessonVideoManager'

interface AdminLessonEditorProps {
  lesson: Lesson
}

export default function AdminLessonEditor({ lesson }: AdminLessonEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVideoManager, setShowVideoManager] = useState(false)
  
  const [formData, setFormData] = useState({
    title: lesson.title || '',
    slug: lesson.slug || '',
    description: lesson.description || '',
    content: lesson.content || '',
    unit: lesson.unit || '',
    lesson_number: lesson.lesson_number || 1,
    estimated_time: lesson.estimated_time || 30,
    objectives: lesson.objectives || [],
    hero_image: (lesson as { hero_image?: string | null }).hero_image || '',
    published: lesson.published || false
  })
  const [heroBusy, setHeroBusy] = useState(false)

  const uploadHero = async (file: File) => {
    setHeroBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'heroes')
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (res.ok) setFormData((p) => ({ ...p, hero_image: d.url }))
      else setError(d.error || 'Hero image upload failed')
    } catch {
      setError('Could not upload the hero image')
    } finally {
      setHeroBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          content: formData.content,
          unit: formData.unit,
          lesson_number: formData.lesson_number,
          estimated_time: formData.estimated_time,
          objectives: formData.objectives,
          hero_image: formData.hero_image || null,
          published: formData.published
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lesson')
      }
      
      // Redirect back to preview page
      router.push(`/admin/lessons/${lesson.id}/preview`)
      router.refresh()
    } catch (err) {
      console.error('Error saving lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleVideoSave = async (videos: LessonVideo[]) => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/videos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save videos')
      }
      
      setShowVideoManager(false)
      router.refresh()
    } catch (err) {
      console.error('Error saving videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to save videos')
    }
  }

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }))
  }

  const updateObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj)
    }))
  }

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }))
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete lesson')
      }

      if (data.unpublished) {
        alert('Lesson has existing assignments and was unpublished instead of deleted.')
      }
      
      router.push('/admin/dashboard')
    } catch (err) {
      console.error('Error deleting lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete lesson')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/lessons/${lesson.id}/preview`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Preview
              </Button>
              <Badge variant="outline" className="text-primary border-primary">
                Lesson {formData.lesson_number}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground border-border">
                {formData.unit}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => router.push(`/admin/lessons/${lesson.id}/build`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Build blocks
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`/lessons/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </a>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground">Edit Lesson</h1>
          <p className="text-muted-foreground mt-1">Update lesson content and settings</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Core lesson details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Newton&apos;s First Law"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Slug *
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., newtons-first-law"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Unit *
                  </label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., Mechanics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Lesson Number *
                  </label>
                  <Input
                    type="number"
                    value={formData.lesson_number}
                    onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Duration (min)
                  </label>
                  <Input
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the lesson..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Hero image (optional — a banner shown at the top of the lesson)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={formData.hero_image}
                    onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                    placeholder="Paste an image URL, or upload…"
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <label className="text-xs font-semibold rounded-md border px-3 py-2 whitespace-nowrap cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                    {heroBusy ? 'Uploading…' : 'Upload'}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={heroBusy}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHero(f); e.target.value = '' }} style={{ display: 'none' }} />
                  </label>
                  {formData.hero_image && (
                    <button type="button" onClick={() => setFormData({ ...formData, hero_image: '' })} className="text-xs text-gray-500 underline">Remove</button>
                  )}
                </div>
                {formData.hero_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.hero_image} alt="" style={{ marginTop: 4, maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)' }} />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Published (visible to students)
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Learning Objectives
                  </CardTitle>
                  <CardDescription>Define what students will learn</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addObjective}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.objectives.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No objectives added yet. Click &quot;Add Objective&quot; to get started.
                </p>
              ) : (
                formData.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder={`Objective ${index + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjective(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Lesson Content */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
              <CardDescription>
                Main lesson content in Markdown format. Supports KaTeX math expressions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="# Lesson Content

Write your lesson content here using Markdown...

## Math Examples
Use \\( inline math \\) or \\[ display math \\] for equations.

Example: \\[ F = ma \\]"
                rows={20}
                className="font-mono text-sm"
                required
              />
            </CardContent>
          </Card>

          {/* Videos Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Videos
                  </CardTitle>
                  <CardDescription>
                    Manage YouTube videos for this lesson
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVideoManager(!showVideoManager)}
                >
                  {showVideoManager ? 'Hide' : 'Manage'} Videos
                </Button>
              </div>
            </CardHeader>
            {showVideoManager && (
              <CardContent>
                <LessonVideoManager
                  lessonId={lesson.id}
                  lessonTitle={lesson.title}
                  initialVideos={lesson.videos || []}
                  onSave={handleVideoSave}
                />
              </CardContent>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/lessons/${lesson.id}/preview`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


