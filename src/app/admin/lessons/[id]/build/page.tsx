import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LessonBlockBuilder from '@/components/admin/LessonBlockBuilder'
import { BlockDocument } from '@/data/content-blocks'

export default async function LessonBuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, title, slug, content_blocks')
    .eq('id', id)
    .single()

  if (!lesson) notFound()

  return (
    <LessonBlockBuilder
      lessonId={lesson.id}
      lessonTitle={lesson.title}
      lessonSlug={lesson.slug}
      initial={(lesson.content_blocks ?? undefined) as BlockDocument | undefined}
    />
  )
}
