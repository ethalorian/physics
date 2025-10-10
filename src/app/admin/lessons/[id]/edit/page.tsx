import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Lesson } from '@/types/assignment'
import AdminLessonEditor from '@/components/admin/AdminLessonEditor'

async function getLesson(id: string): Promise<Lesson | null> {
  // Use supabaseAdmin for server-side rendering
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !lesson) {
    console.error('Error fetching lesson for edit:', error)
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
  
  // Parse objectives JSON if it exists
  let objectives = []
  if (lesson.objectives) {
    try {
      objectives = typeof lesson.objectives === 'string'
        ? JSON.parse(lesson.objectives)
        : lesson.objectives
    } catch (e) {
      console.warn('Failed to parse lesson objectives:', e)
      objectives = []
    }
  }
  
  return {
    ...lesson,
    videos,
    objectives
  } as Lesson
}

export default async function LessonEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const lesson = await getLesson(id)
  
  if (!lesson) {
    notFound()
  }

  return <AdminLessonEditor lesson={lesson} />
}


