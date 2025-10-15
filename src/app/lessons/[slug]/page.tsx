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
  
  // Parse JSONB fields
  let videos = []
  if (lesson.videos) {
    try {
      videos = typeof lesson.videos === 'string' 
        ? JSON.parse(lesson.videos) 
        : lesson.videos
    } catch (e) {
      console.warn('Failed to parse lesson videos:', e)
      videos = []
    }
  }

  let embeddedQuestions = []
  if (lesson.embedded_questions) {
    try {
      embeddedQuestions = typeof lesson.embedded_questions === 'string'
        ? JSON.parse(lesson.embedded_questions)
        : lesson.embedded_questions
    } catch (e) {
      console.warn('Failed to parse embedded questions:', e)
      embeddedQuestions = []
    }
  }
  
  return {
    ...lesson,
    videos,
    embedded_questions: embeddedQuestions
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
