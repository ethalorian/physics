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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#4A1A4A] via-[#6A4C93] to-[#9A8AC0] bg-clip-text text-transparent">
          Physics Lessons
        </h1>
        <p className="text-xl text-[#6A4C93] max-w-2xl mx-auto">
          Explore the fundamental concepts of physics through interactive lessons and engaging content.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson, index) => (
          <Link key={lesson.id} href={`/lessons/${lesson.slug}`} className="group">
            <Card className="apple-card hover:apple-shadow-lg transition-all duration-300 group-hover:scale-[1.02] border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C5B9E8]/20 via-[#B19CD9]/20 to-[#9A8AC0]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] flex items-center justify-center mb-4 apple-shadow-sm">
                    <span className="text-[#F7F5F3] font-bold text-lg">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#9A8AC0] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#4A1A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-[#4A1A4A] group-hover:text-[#6A4C93] transition-colors duration-200 mb-2">
                  {lesson.title}
                </CardTitle>
                {lesson.description && (
                  <CardDescription className="text-[#6A4C93] leading-relaxed">
                    {lesson.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      
      {lessons.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No lessons available</h3>
          <p className="text-gray-600">Check back soon for new physics content!</p>
        </div>
      )}
    </div>
  )
}
