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

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const lesson = await getLesson(params.slug)
  
  if (!lesson) {
    notFound()
  }

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-xl text-muted-foreground">{lesson.description}</p>
        )}
      </header>
      <div className="prose prose-lg max-w-none">
        <MDXRemote source={lesson.content} />
      </div>
    </article>
  )
}
