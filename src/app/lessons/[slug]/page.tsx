import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MathMarkdown from '@/components/MathMarkdown'
import EnhancedLessonView from '@/components/lessons/EnhancedLessonView'

async function getLesson(slug: string) {
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  if (error || !lesson) return null
  
  // Determine if this lesson should use enhanced view
  const isEnhanced = lesson.title?.toLowerCase().includes('unit conversion') || 
                    lesson.title?.toLowerCase().includes('conversion') ||
                    lesson.content?.includes('train tracks') ||
                    lesson.content?.includes('Train Tracks')
  
  return {
    ...lesson,
    isEnhanced
  }
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = await getLesson(slug)
  
  if (!lesson) {
    notFound()
  }

  // Use enhanced view for specially marked lessons
  if (lesson.isEnhanced) {
    return <EnhancedLessonView lesson={lesson} />
  }

  // Default view for regular lessons
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="apple-card p-8 md:p-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-[#C5B9E8] to-[#B19CD9] text-[#4A1A4A] rounded-full text-sm font-semibold">
              {lesson.unit}
            </span>
            <span className="w-8 h-8 bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-[#F7F5F3] rounded-full flex items-center justify-center font-bold text-sm">
              {lesson.lesson_number}
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#4A1A4A] via-[#6A4C93] to-[#9A8AC0] bg-clip-text text-transparent leading-tight">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-xl text-[#6A4C93] max-w-3xl mx-auto leading-relaxed">
              {lesson.description}
            </p>
          )}
        </header>
        
        <MathMarkdown content={lesson.content || '# No content available'} />
      </div>
    </div>
  )
}
