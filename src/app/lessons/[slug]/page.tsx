import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MathMarkdown from '@/components/MathMarkdown'
import EnhancedLessonView from '@/components/lessons/EnhancedLessonView'
import LessonActivityTracker from '@/components/lessons/LessonActivityTracker'
import StudentLessonViewer from '@/components/lessons/StudentLessonViewer'
import { Lesson } from '@/types/assignment'

async function getLesson(slug: string): Promise<Lesson | null> {
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  if (error || !lesson) return null
  
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
  
  // Determine if this lesson should use enhanced view
  const isEnhanced = lesson.title?.toLowerCase().includes('unit conversion') || 
                    lesson.title?.toLowerCase().includes('conversion') ||
                    lesson.content?.includes('train tracks') ||
                    lesson.content?.includes('Train Tracks')
  
  return {
    ...lesson,
    videos,
    isEnhanced
  } as Lesson & { isEnhanced: boolean }
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = await getLesson(slug)
  
  if (!lesson) {
    notFound()
  }

  // Use enhanced view for specially marked lessons
  if (lesson.isEnhanced) {
    return (
      <LessonActivityTracker lessonId={lesson.id}>
        <EnhancedLessonView lesson={lesson} />
      </LessonActivityTracker>
    )
  }

  // Use new student viewer for lessons with videos or objectives
  if ((lesson.videos && lesson.videos.length > 0) || (lesson.objectives && lesson.objectives.length > 0)) {
    return (
      <LessonActivityTracker lessonId={lesson.id}>
        <StudentLessonViewer lesson={lesson} />
      </LessonActivityTracker>
    )
  }

  // Default view for regular lessons without videos/objectives
  return (
    <LessonActivityTracker lessonId={lesson.id}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="apple-card p-8 md:p-12">
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="px-4 py-2 bg-[#C5B9E8] text-[#4A1A4A] rounded-full text-sm font-semibold border border-[#C5B9E8]/50">
                {lesson.unit}
              </span>
              <span className="w-8 h-8 bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-[#F7F5F3] rounded-full flex items-center justify-center font-bold text-sm">
                {lesson.lesson_number}
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-6 text-[#4A1A4A] dark:text-[#FFFFFF] leading-tight relative">
              {lesson.title}
              <div className="absolute -bottom-2 left-0 w-20 h-1.5 bg-gradient-to-r from-[#D4AF37] to-[#6A4C93] rounded-full" />
            </h1>
            {lesson.description && (
              <p className="text-xl text-[#6A4C93] dark:text-[#E8DDFF] max-w-3xl mx-auto leading-relaxed">
                {lesson.description}
              </p>
            )}
          </header>
          
          <MathMarkdown content={lesson.content || '# No content available'} />
        </div>
      </div>
    </LessonActivityTracker>
  )
}
