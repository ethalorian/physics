import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import BlockLessonViewer from '@/components/lessons/BlockLessonViewer'
import LessonActivityTracker from '@/components/lessons/LessonActivityTracker'

type SiblingRow = { slug: string; title: string; lesson_number: number }

// Prev/next within the same unit (by lesson_number) for the lesson footer nav.
async function getNav(unit: string | null | undefined, currentSlug: string) {
  if (!unit) return { prev: null, next: null }
  const { data } = await supabaseAdmin
    .from('lessons')
    .select('slug, title, lesson_number')
    .eq('unit', unit)
    .eq('published', true)
    .order('lesson_number', { ascending: true })
  const list = (data ?? []) as SiblingRow[]
  const i = list.findIndex((l) => l.slug === currentSlug)
  return {
    prev: i > 0 ? { slug: list[i - 1].slug, title: list[i - 1].title } : null,
    next: i >= 0 && i < list.length - 1 ? { slug: list[i + 1].slug, title: list[i + 1].title } : null,
  }
}

async function getLesson(slug: string) {
  // Fetch lesson with simulation data
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select(`
      *,
      simulation:simulations(
        id,
        slug,
        title,
        description,
        difficulty,
        estimated_time
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  if (error || !lesson) {
    console.error('Error fetching lesson:', error)
    return null
  }
  
  // Parse JSONB fields - helper function
  const parseJsonField = <T,>(field: unknown, fieldName: string, defaultValue: T): T => {
    if (!field) return defaultValue
    try {
      return (typeof field === 'string' ? JSON.parse(field) : field) as T
    } catch (e) {
      console.warn(`Failed to parse ${fieldName}:`, e)
      return defaultValue
    }
  }

  // Parse all JSONB fields for full lesson content
  const videos = parseJsonField(lesson.videos, 'videos', [])
  const embeddedQuestions = parseJsonField(lesson.embedded_questions, 'embedded_questions', [])
  const taReactions = parseJsonField(lesson.ta_reactions, 'ta_reactions', null)
  const keyTerms = parseJsonField(lesson.key_terms, 'key_terms', [])
  const checkForUnderstanding = parseJsonField(lesson.check_for_understanding, 'check_for_understanding', [])
  const generationMetadata = parseJsonField(lesson.generation_metadata, 'generation_metadata', null)
  const objectives = parseJsonField(lesson.objectives, 'objectives', [])
  
  return {
    ...lesson,
    videos,
    embedded_questions: embeddedQuestions,
    ta_reactions: taReactions,
    key_terms: keyTerms,
    check_for_understanding: checkForUnderstanding,
    generation_metadata: generationMetadata,
    objectives
  }
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = await getLesson(slug)
  
  if (!lesson) {
    notFound()
  }

  // All lessons are curriculum block lessons now; the legacy viewer is retired.
  const nav = await getNav(lesson.unit, slug)

  return (
    <LessonActivityTracker lessonId={lesson.id}>
      <BlockLessonViewer lesson={lesson} nav={nav} />
    </LessonActivityTracker>
  )
}
