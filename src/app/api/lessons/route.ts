import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

/**
 * POST /api/lessons
 * Create a new lesson (admin/teacher only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden - Admin or teacher access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.slug || !body.unit || !body.lesson_number) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, unit, lesson_number' },
        { status: 400 }
      )
    }

    // Build lesson data
    const lessonData: any = {
      title: body.title,
      slug: body.slug,
      description: body.description || '',
      unit: body.unit,
      lesson_number: body.lesson_number,
      lesson_type: body.lesson_type || 'markdown',
      estimated_time: body.estimated_time || 30,
      objectives: body.objectives || [],
      published: body.published || false,
      created_by: session.user.email
    }

    // Add type-specific fields
    if (body.lesson_type === 'markdown' && body.content) {
      lessonData.content = body.content
    }
    
    if (body.lesson_type === 'video' && body.video_url) {
      lessonData.video_url = body.video_url
    }
    
    if (body.lesson_type === 'simulation' && body.simulation_id) {
      lessonData.simulation_id = body.simulation_id
    }

    // Insert using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert(lessonData)
      .select()
      .single()

    if (error) {
      console.error('Database error creating lesson:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`Created lesson: ${data.title} by ${session.user.email}`)

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Error in lesson creation API:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
