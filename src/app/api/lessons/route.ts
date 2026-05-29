import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRole } from '@/lib/api-auth'

/**
 * POST /api/lessons
 * Create a new lesson (admin/teacher only)
 */
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
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
      created_by: ctx.email
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

    // Add embedded questions if provided
    if (body.embedded_questions && Array.isArray(body.embedded_questions)) {
      lessonData.embedded_questions = JSON.stringify(body.embedded_questions)
    }

    // Add TA reactions if provided (Jose & Marialys student TAs)
    if (body.ta_reactions) {
      lessonData.ta_reactions = JSON.stringify(body.ta_reactions)
    }

    // Add key terms/vocabulary if provided
    if (body.key_terms && Array.isArray(body.key_terms)) {
      lessonData.key_terms = JSON.stringify(body.key_terms)
    }

    // Add check for understanding questions if provided
    if (body.check_for_understanding && Array.isArray(body.check_for_understanding)) {
      lessonData.check_for_understanding = JSON.stringify(body.check_for_understanding)
    }

    // Add mastery level if provided
    if (body.mastery_level) {
      lessonData.mastery_level = body.mastery_level
    }

    // Add generation metadata if provided
    if (body.generation_metadata) {
      lessonData.generation_metadata = JSON.stringify(body.generation_metadata)
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

    console.log(`Created lesson: ${data.title} by ${ctx.email}`)

    return NextResponse.json({ data }, { status: 201 })
})
