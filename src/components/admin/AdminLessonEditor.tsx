"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lesson, LessonVideo } from '@/types/assignment'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import type { BlockDocument, ContentBlock } from '@/data/content-blocks'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import {
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X,
  Video,
  Target,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SectionLabel } from '@/components/ds'
import LessonVideoManager from './LessonVideoManager'

interface AdminLessonEditorProps {
  lesson: Lesson
  /** Learning targets attached to this lesson — the server won't publish at 0. */
  targetCount?: number
}

// The lessons row carries more than the shared Lesson type declares. These
// fields already exist in the table (and in the PUT pass-through) — we only
// read/write them here, no data-model change.
type LessonRow = Lesson & {
  content_blocks?: BlockDocument | null
  key_terms?: unknown
  hero_image?: string | null
}

export default function AdminLessonEditor({ lesson, targetCount = 0 }: AdminLessonEditorProps) {
  const router = useRouter()
  const raw = lesson as LessonRow
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVideoManager, setShowVideoManager] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const [formData, setFormData] = useState({
    title: lesson.title || '',
    slug: lesson.slug || '',
    description: lesson.description || '',
    content: lesson.content || '',
    unit: lesson.unit || '',
    lesson_number: lesson.lesson_number || 1,
    estimated_time: lesson.estimated_time || 30,
    objectives: lesson.objectives || [],
    hero_image: raw.hero_image || '',
    published: lesson.published || false
  })
  const [heroBusy, setHeroBusy] = useState(false)

  // ── Key terms: existing key_terms column, edited as JSON here ─────────────
  const [keyTerms, setKeyTerms] = useState<string>(() => {
    const kt = raw.key_terms
    if (!kt) return ''
    try {
      const v = typeof kt === 'string' ? JSON.parse(kt) : kt
      return JSON.stringify(v, null, 2)
    } catch {
      return typeof kt === 'string' ? kt : ''
    }
  })
  const keyTermsParse = useMemo<{ ok: boolean; value: GlossaryEntry[] | null }>(() => {
    const t = keyTerms.trim()
    if (!t) return { ok: true, value: null }
    try {
      const v = JSON.parse(t)
      return Array.isArray(v) ? { ok: true, value: v as GlossaryEntry[] } : { ok: false, value: null }
    } catch {
      return { ok: false, value: null }
    }
  }, [keyTerms])

  // ── Live preview: the same BlockRenderer students see ─────────────────────
  const doc = raw.content_blocks ?? undefined
  const blocks = useMemo<ContentBlock[]>(() => doc?.blocks ?? [], [doc])
  const glossary = useMemo<GlossaryEntry[]>(
    () => (keyTermsParse.ok ? (keyTermsParse.value ?? []).filter((t) => t && t.term && t.definition) : []),
    [keyTermsParse],
  )
  // Throwaway play state so interactive blocks work in the preview without
  // writing anything to the real response store.
  const [play, setPlay] = useState<BlockResponseMap>({})
  const playSave = (id: string, _type: string, value: unknown) =>
    setPlay((m) => ({ ...m, [id]: { response: value, created_at: new Date().toISOString() } }))
  // The legacy Markdown field, previewed live through the same renderer as a
  // prose block (KaTeX + key-equation styling included).
  const mdPreviewBlocks = useMemo<ContentBlock[]>(
    () => (formData.content.trim()
      ? [{ id: 'md-draft-preview', type: 'prose', markdown: formData.content } as unknown as ContentBlock]
      : []),
    [formData.content],
  )

  // ── Draft / Published + pre-publish check ──────────────────────────────────
  // null = no publish attempt yet · [] = last attempt passed · [...] = failures
  const [publishIssues, setPublishIssues] = useState<string[] | null>(null)

  const runPublishChecks = (): string[] => {
    const issues: string[] = []
    if (!formData.title.trim()) issues.push('Give the lesson a title')
    if (blocks.length === 0) issues.push('Add at least one content block (open the block builder)')
    if (targetCount === 0) issues.push('Attach at least one learning target — the server refuses to publish without one, and the control room can\'t grade the work')
    if (!keyTermsParse.ok) issues.push('Key terms must be valid JSON (an array of term/definition objects)')
    if (!formData.estimated_time || Number.isNaN(formData.estimated_time) || formData.estimated_time < 1) {
      issues.push('Set an estimated time in minutes')
    }
    return issues
  }

  const setStatus = (next: 'draft' | 'published') => {
    if (next === 'draft') {
      setFormData((p) => ({ ...p, published: false }))
      setPublishIssues(null)
      return
    }
    const issues = runPublishChecks()
    setPublishIssues(issues)
    if (issues.length === 0) setFormData((p) => ({ ...p, published: true }))
  }

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
    if (!keyTermsParse.ok) {
      setError('Key terms aren’t valid JSON — fix or clear that field before saving.')
      return
    }
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
          key_terms: keyTermsParse.value,
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: showPreview ? 1500 : 1000 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
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
              {/* The badge reports the SAVED state (what students can actually reach);
                  an unsaved toggle shows as intent, never as fact. */}
              <Badge
                variant="outline"
                style={lesson.published
                  ? { color: 'var(--success)', borderColor: 'color-mix(in oklch, var(--success) 55%, var(--border))', background: 'color-mix(in oklch, var(--success) 10%, transparent)' }
                  : { color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
              >
                {lesson.published ? 'Published' : 'Draft'}
                {formData.published !== !!lesson.published && (
                  <span className="ml-1.5 font-normal" style={{ color: 'var(--reward-foreground)' }}>
                    → {formData.published ? 'publish' : 'unpublish'} on save
                  </span>
                )}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Hide preview' : 'Show preview'}
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/admin/lessons/${lesson.id}/build`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Build blocks
              </Button>
              {lesson.published ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/lessons/${lesson.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open lesson
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled title="Students can only reach published lessons. Use the preview on the right, or publish first.">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open lesson · draft
                </Button>
              )}
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
          <p className="text-muted-foreground mt-1">Update lesson content and settings — the preview shows what students see</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Split pane: form left, live student preview right (stacks below lg) */}
        <div className={`grid items-start gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
            {/* ── Identity ── */}
            <section className="space-y-3">
              <SectionLabel className="mt-0 mb-0">Identity</SectionLabel>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Title, slug, unit and description</CardDescription>
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

                  <div className="grid md:grid-cols-2 gap-4">
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
                </CardContent>
              </Card>
            </section>

            {/* ── Content ── */}
            <section className="space-y-3">
              <SectionLabel className="mt-0 mb-0">Content</SectionLabel>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Content blocks</CardTitle>
                      <CardDescription>
                        What students read — authored in the block builder, rendered live in the preview.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/lessons/${lesson.id}/build`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Open block builder
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {blocks.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {blocks.length} block{blocks.length === 1 ? '' : 's'}
                      {doc?.dayType ? ` · ${doc.dayType} day` : ''} — edit them in the block builder; this page saves the lesson&apos;s settings.
                    </p>
                  ) : (
                    <p
                      className="text-sm rounded-lg border px-3 py-2"
                      style={{
                        borderColor: 'color-mix(in oklch, var(--reward) 45%, var(--border))',
                        background: 'color-mix(in oklch, var(--reward) 10%, var(--card))',
                        color: 'var(--foreground)',
                      }}
                    >
                      No content blocks yet — students would see an empty lesson. Use the block builder to author the content.
                    </p>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Legacy Markdown (optional)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Students see the block content above, not this field. Kept for older lessons; it renders live under the preview. Supports KaTeX (\\( inline \\) and \\[ display \\]).
                    </p>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="# Lesson Content

Write legacy Markdown content here...

Example: \\[ F = ma \\]"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

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
                    <p className="text-sm text-muted-foreground italic">
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
            </section>

            {/* ── Extras ── */}
            <section className="space-y-3">
              <SectionLabel className="mt-0 mb-0">Extras</SectionLabel>
              <Card>
                <CardHeader>
                  <CardTitle>Reader extras</CardTitle>
                  <CardDescription>Key terms, hero image and estimated time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-xs">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Estimated time (min)
                    </label>
                    <Input
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) })}
                      min="1"
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
                        style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                      />
                      <label className="text-xs font-semibold rounded-md border px-3 py-2 whitespace-nowrap cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                        {heroBusy ? 'Uploading…' : 'Upload'}
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={heroBusy}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHero(f); e.target.value = '' }} style={{ display: 'none' }} />
                      </label>
                      {formData.hero_image && (
                        <button type="button" onClick={() => setFormData({ ...formData, hero_image: '' })} className="text-xs underline" style={{ color: 'var(--muted-foreground)' }}>Remove</button>
                      )}
                    </div>
                    {formData.hero_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.hero_image} alt="" style={{ marginTop: 4, maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)' }} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Key terms (JSON)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      An array of term/definition objects (optional &quot;cognate&quot;). These power the hover definitions in the reader — try them in the preview.
                    </p>
                    <Textarea
                      value={keyTerms}
                      onChange={(e) => setKeyTerms(e.target.value)}
                      placeholder={'[\n  { "term": "velocity", "definition": "Speed with a direction.", "cognate": "velocidad" }\n]'}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    {!keyTermsParse.ok ? (
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--destructive)' }}>
                        <XCircle size={13} /> Not valid JSON — expected an array of term/definition objects.
                      </p>
                    ) : keyTermsParse.value ? (
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                        <CheckCircle2 size={13} /> {keyTermsParse.value.length} term{keyTermsParse.value.length === 1 ? '' : 's'} parsed.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── Status ── */}
            <section className="space-y-3">
              <SectionLabel className="mt-0 mb-0">Status</SectionLabel>
              <Card>
                <CardHeader>
                  <CardTitle>Draft / Published</CardTitle>
                  <CardDescription>
                    Publishing makes this lesson visible to students in classes where it&apos;s open.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => setStatus('draft')}
                      className="px-4 py-2 text-sm font-semibold"
                      style={{
                        background: !formData.published ? 'var(--muted)' : 'transparent',
                        color: !formData.published ? 'var(--foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('published')}
                      className="px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5"
                      style={{
                        background: formData.published ? 'color-mix(in oklch, var(--success) 15%, var(--card))' : 'transparent',
                        color: formData.published ? 'var(--success)' : 'var(--muted-foreground)',
                      }}
                    >
                      {formData.published && <CheckCircle2 size={15} />}
                      Published
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The status applies when you save. This lesson has {targetCount} learning target{targetCount === 1 ? '' : 's'} attached; the server requires at least one to publish.
                  </p>

                  {publishIssues && publishIssues.length > 0 && (
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: 'color-mix(in oklch, var(--destructive) 40%, var(--border))',
                        background: 'color-mix(in oklch, var(--destructive) 6%, var(--card))',
                      }}
                    >
                      <div className="text-sm font-semibold mb-1.5" style={{ color: 'var(--destructive)' }}>
                        Not published yet — fix these first:
                      </div>
                      <ul className="space-y-1">
                        {publishIssues.map((issue) => (
                          <li key={issue} className="flex items-start gap-1.5 text-sm" style={{ color: 'var(--foreground)' }}>
                            <XCircle size={15} style={{ color: 'var(--destructive)', marginTop: 2, flexShrink: 0 }} />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {publishIssues && publishIssues.length === 0 && formData.published && (
                    <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                      <CheckCircle2 size={15} /> Pre-publish checks passed — save to make it live.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

          {/* Live student preview — the same BlockRenderer the reader uses */}
          {showPreview && (
            <aside
              className="min-w-0 rounded-xl border lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div
                className="flex items-center justify-between gap-2 px-5 py-3 border-b sticky top-0 z-10"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <span className="text-overline" style={{ color: 'var(--primary)' }}>Student preview</span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Rendered with the students&apos; block renderer
                </span>
              </div>
              <div className="p-5">
                {formData.hero_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.hero_image}
                    alt=""
                    className="w-full mb-4"
                    style={{ maxHeight: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }}
                  />
                )}
                <div className="text-overline" style={{ color: 'var(--muted-foreground)' }}>
                  {formData.unit || 'Unit'} · Lesson {formData.lesson_number}
                </div>
                <h2 className="text-title-2 mt-1" style={{ color: 'var(--foreground)' }}>
                  {formData.title || 'Untitled lesson'}
                </h2>
                <div className="mt-1 text-sm flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock size={14} />
                  ~{formData.estimated_time || 0} min
                  {glossary.length > 0 && <span>· {glossary.length} key term{glossary.length === 1 ? '' : 's'}</span>}
                </div>

                {/* `lesson-reading` scopes the key-equation styling (globals.css) */}
                <div className="mt-5 lesson-reading">
                  {blocks.length > 0 ? (
                    <BlockRenderer
                      blocks={blocks}
                      lessonId={`preview:${lesson.id}`}
                      responses={play}
                      save={playSave}
                      glossary={glossary}
                    />
                  ) : (
                    <div
                      className="rounded-xl border p-8 text-center text-sm"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      No content blocks yet — this is the empty lesson a student would see.
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/lessons/${lesson.id}/build`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Open block builder
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {mdPreviewBlocks.length > 0 && (
                  <details className="mt-6" open={blocks.length === 0}>
                    <summary className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
                      Legacy Markdown draft (not shown to students)
                    </summary>
                    <div
                      className="mt-2 lesson-reading rounded-xl border p-4"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <BlockRenderer
                        blocks={mdPreviewBlocks}
                        lessonId={`preview-md:${lesson.id}`}
                        responses={play}
                        save={playSave}
                        glossary={glossary}
                      />
                    </div>
                  </details>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
