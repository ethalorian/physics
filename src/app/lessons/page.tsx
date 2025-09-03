import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getLessons() {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('published', true)
    .order('order_index', { ascending: true })
  
  if (error) throw error
  return lessons
}

export default async function LessonsPage() {
  const lessons = await getLessons()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Physics Lessons</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/lessons/${lesson.slug}`} className="hover:underline">
                  {lesson.title}
                </Link>
              </CardTitle>
              {lesson.description && (
                <CardDescription>{lesson.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
