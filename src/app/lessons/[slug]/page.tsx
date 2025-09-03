import { supabase } from '@/lib/supabase'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'

async function getLesson(slug: string) {
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  if (error || !lesson) return null
  return lesson
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = await getLesson(slug)
  
  if (!lesson) {
    notFound()
  }

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
        
        <div className="prose prose-lg prose-blue max-w-none">
          <div className="[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-6 [&>h1]:mt-8
                      [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-gray-800 [&>h2]:mb-4 [&>h2]:mt-6
                      [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-700 [&>h3]:mb-3 [&>h3]:mt-5
                      [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-4
                      [&>ul]:space-y-2 [&>ol]:space-y-2
                      [&>li]:text-gray-700
                      [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-gray-600
                      [&>code]:bg-gray-100 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
                      [&>pre]:bg-gray-900 [&>pre]:text-gray-100 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto
                      [&>img]:rounded-xl [&>img]:apple-shadow">
            <MDXRemote source={lesson.content} />
          </div>
        </div>
      </div>
    </div>
  )
}
