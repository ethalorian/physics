import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import UnifiedLessonViewer from '@/components/lessons/UnifiedLessonViewer'
import LessonActivityTracker from '@/components/lessons/LessonActivityTracker'

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
  const parseJsonField = <T>(field: unknown, fieldName: string, defaultValue: T): T => {
    if (!field) return defaultValue
    try {
      return typeof field === 'string' ? JSON.parse(field) : field
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

  return (
    <LessonActivityTracker lessonId={lesson.id}>
      <UnifiedLessonViewer lesson={lesson} />
    </LessonActivityTracker>
  )
}
