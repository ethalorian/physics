import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { getStudentLessonGate } from '@/lib/lesson-windows'
import { getEnrollment } from '@/lib/student-enrollment'
import BlockLessonViewer from '@/components/lessons/BlockLessonViewer'
import LessonActivityTracker from '@/components/lessons/LessonActivityTracker'
import EnrollmentGateScreen from '@/components/EnrollmentGateScreen'

type SiblingRow = { id: string; slug: string; title: string; lesson_number: number }

// A lesson gate keyed by lesson id. Staff see everything; a student only sees
// lessons their class has opened (and not closed). Unauthenticated → open
// (status quo; sign-in is enforced elsewhere).
async function buildLessonGate(): Promise<(lessonId: string) => boolean> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return () => true
  const ctx = await getEffectiveContext(session.user.email)
  if (ctx.role === 'admin' || ctx.role === 'teacher') return () => true
  return getStudentLessonGate(session.user.id)
}

// Prev/next within the same unit (by lesson_number) for the lesson footer nav.
async function getNav(unit: string | null | undefined, currentSlug: string, gate: (id: string) => boolean) {
  if (!unit) return { prev: null, next: null }
  const { data } = await supabaseAdmin
    .from('lessons')
    .select('id, slug, title, lesson_number')
    .eq('unit', unit)
    .eq('published', true)
    .order('lesson_number', { ascending: true })
  const list = ((data ?? []) as SiblingRow[]).filter((l) => gate(l.id))
  const i = list.findIndex((l) => l.slug === currentSlug)
  return {
    prev: i > 0 ? { slug: list[i - 1].slug, title: list[i - 1].title } : null,
    next: i >= 0 && i < list.length - 1 ? { slug: list[i + 1].slug, title: list[i + 1].title } : null,
  }
}

async function getLesson(slug: string) {
  // Fetch lesson with simulation data
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select(`
      *,
      simulation:simulations(
        id,
        slug,
        title,
        description,
        difficulty,
        estimated_time
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  if (error || !lesson) {
    console.error('Error fetching lesson:', error)
    return null
  }
  
  // Parse JSONB fields - helper function
  const parseJsonField = <T,>(field: unknown, fieldName: string, defaultValue: T): T => {
    if (!field) return defaultValue
    try {
      return (typeof field === 'string' ? JSON.parse(field) : field) as T
    } catch (e) {
      console.warn(`Failed to parse ${fieldName}:`, e)
      return defaultValue
    }
  }

  // Parse all JSONB fields for full lesson content
  const videos = parseJsonField(lesson.videos, 'videos', [])
  const embeddedQuestions = parseJsonField(lesson.embedded_questions, 'embedded_questions', [])
  const taReactions = parseJsonField(lesson.ta_reactions, 'ta_reactions', null)
  const keyTerms = parseJsonField(lesson.key_terms, 'key_terms', [])
  const checkForUnderstanding = parseJsonField(lesson.check_for_understanding, 'check_for_understanding', [])
  const generationMetadata = parseJsonField(lesson.generation_metadata, 'generation_metadata', null)
  const objectives = parseJsonField(lesson.objectives, 'objectives', [])
  
  return {
    ...lesson,
    videos,
    embedded_questions: embeddedQuestions,
    ta_reactions: taReactions,
    key_terms: keyTerms,
    check_for_understanding: checkForUnderstanding,
    generation_metadata: generationMetadata,
    objectives
  }
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = await getLesson(slug)

  if (!lesson) {
    notFound()
  }

  // Enrollment gate: an un-enrolled student must not see lesson content even
  // in the initial HTML. Server-side check + early return so nothing leaks.
  const sess = await auth()
  if (sess?.user?.id && sess.user.email) {
    const sctx = await getEffectiveContext(sess.user.email)
    if (sctx.realRole === 'student') {
      const enrollment = await getEnrollment(sess.user.id)
      if (!enrollment.enrolled) {
        const firstName = (sess.user.name ?? '').split(' ')[0]
        return <EnrollmentGateScreen firstName={firstName} />
      }
    }
  }

  // Per-class release gate: block a student deep-linking a lesson their class
  // hasn't opened (or has closed).
  const gate = await buildLessonGate()
  if (!gate(lesson.id)) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center px-4">
        <div className="rounded-2xl border p-8" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h1 className="text-xl font-semibold tracking-tight mb-2">This lesson isn’t open yet</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Your teacher hasn’t opened this lesson for your class, or its window has closed. Check back, or head to your home for what’s available now.
          </p>
          <Link href="/home" className="inline-block mt-5 text-sm font-semibold rounded-lg px-4 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  // All lessons are curriculum block lessons now; the legacy viewer is retired.
  const nav = await getNav(lesson.unit, slug, gate)

  return (
    <LessonActivityTracker lessonId={lesson.id}>
      <BlockLessonViewer lesson={lesson} nav={nav} />
    </LessonActivityTracker>
  )
}
