import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

async function getLessons() {
  // Use supabaseAdmin for server-side rendering (bypasses RLS)
  const { data: lessons, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('published', true)
    .order('unit', { ascending: true })
    .order('lesson_number', { ascending: true })
  
  if (error) {
    console.error('Error fetching lessons:', error)
    return []
  }
  
  // Add enhanced flags for specific lessons
  const enhancedLessons = lessons?.map(lesson => ({
    ...lesson,
    // Mark unit conversion lessons as enhanced
    isEnhanced: lesson.title?.toLowerCase().includes('unit conversion') || 
                lesson.title?.toLowerCase().includes('conversion'),
    // Mark recently created lessons as new (within last 7 days)
    isNew: new Date(lesson.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  }))
  
  return enhancedLessons || []
}

interface Lesson {
  id: string  // Changed from number to string for UUID
  title: string
  slug: string
  description: string
  unit: string
  lesson_number: number
  published: boolean
  created_at: string
  isNew?: boolean
  isEnhanced?: boolean
}

function groupLessonsByUnit(lessons: Lesson[]) {
  const grouped = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.unit]) {
      acc[lesson.unit] = []
    }
    acc[lesson.unit].push(lesson)
    return acc
  }, {} as Record<string, Lesson[]>)
  
  return grouped
}

export default async function LessonsPage() {
  const lessons = await getLessons()
  const groupedLessons = groupLessonsByUnit(lessons)

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-[#4A1A4A] dark:text-[#FFFFFF] relative">
          Physics Lessons
          <div className="absolute -bottom-3 left-0 w-32 h-1.5 bg-gradient-to-r from-[#D4AF37] to-[#6A4C93] rounded-full" />
        </h1>
        <p className="text-xl text-[#6A4C93] dark:text-[#E8DDFF] max-w-2xl mx-auto">
          Explore the fundamental concepts of physics through interactive lessons and engaging content.
        </p>
      </div>
      
      {Object.keys(groupedLessons).length > 0 ? (
        <div className="space-y-12">
          {Object.entries(groupedLessons).map(([unit, unitLessons]) => (
            <div key={unit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[#4A1A4A] mb-2">
                  Unit: {unit}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#6A4C93] to-[#9A8AC0] mx-auto rounded-full"></div>
              </div>
              
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {unitLessons.map((lesson) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.slug}`} className="group">
                    <Card className="apple-card hover:apple-shadow-lg transition-all duration-300 group-hover:scale-[1.02] border-0 overflow-hidden relative">
                      {/* Enhanced lesson indicator */}
                      {lesson.isEnhanced && (
                        <div className="absolute top-3 right-3 z-20">
                          <Badge className="bg-[#D4AF37] text-[#4A1A4A] flex items-center gap-1 font-medium border border-[#D4AF37]/30">
                            <Sparkles className="w-3 h-3" />
                            Interactive
                          </Badge>
                        </div>
                      )}
                      {/* New lesson indicator */}
                      {lesson.isNew && (
                        <div className="absolute top-3 left-3 z-20">
                          <Badge className="bg-[#6A4C93] text-[#F7F5F3] border border-[#6A4C93]/30">
                            New!
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#C5B9E8]/20 via-[#B19CD9]/20 to-[#9A8AC0]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] flex items-center justify-center mb-4 apple-shadow-sm">
                            <span className="text-[#F7F5F3] font-bold text-lg">
                              {lesson.lesson_number}
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
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#B19CD9] to-[#9A8AC0] flex items-center justify-center">
            <svg className="w-12 h-12 text-[#4A1A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#4A1A4A] mb-2">No lessons available</h3>
          <p className="text-[#6A4C93]">Check back soon for new physics content!</p>
        </div>
      )}
    </div>
  )
}
