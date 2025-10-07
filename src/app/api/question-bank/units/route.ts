import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch from database first
    // Note: units and lessons are not directly related via foreign key
    // We fetch them separately and combine client-side
    const { data: unitsData, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .order('order_index', { ascending: true })

    if (unitsError) {
      console.error('Database units table not found, falling back to static data:', unitsError)
      
      // Fallback to static physics units data
      const { physicsUnits } = await import('@/data/physics-units')
      return NextResponse.json(physicsUnits)
    }

    // Fetch lessons separately
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, unit, lesson_number, published')
      .order('lesson_number', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      // Return units without lessons
      return NextResponse.json(unitsData || [])
    }

    // Combine units with their lessons
    const unitsWithLessons = (unitsData || []).map(unit => ({
      ...unit,
      lessons: (lessonsData || []).filter(lesson => lesson.unit === unit.id)
    }))

    return NextResponse.json(unitsWithLessons)
  } catch (error) {
    console.error('Error in GET /api/question-bank/units:', error)
    
    // Final fallback to static data
    try {
      const { physicsUnits } = await import('@/data/physics-units')
      return NextResponse.json(physicsUnits)
    } catch (fallbackError) {
      return NextResponse.json({ error: 'Failed to load units data' }, { status: 500 })
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or teacher
    const userRole = getUserRole(session.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can add units' }, { status: 403 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('units')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Error adding unit:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/question-bank/units:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
