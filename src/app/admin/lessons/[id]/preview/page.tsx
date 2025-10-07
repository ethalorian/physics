import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Lesson } from '@/types/assignment'
import AdminLessonPreview from '@/components/admin/AdminLessonPreview'

async function getLesson(id: string): Promise<Lesson | null> {
  // Use supabaseAdmin for server-side rendering (admin can view unpublished)
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !lesson) {
    console.error('Error fetching lesson for preview:', error)
    return null
  }
  
  // Parse videos JSON if it exists
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
  
  return {
    ...lesson,
    videos
  } as Lesson
}

export default async function LessonPreviewPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const lesson = await getLesson(id)
  
  if (!lesson) {
    notFound()
  }

  return <AdminLessonPreview lesson={lesson} />
}
