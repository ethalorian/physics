import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to edit lessons
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { videos, objectives, estimated_time } = body

    // Validate videos array
    if (videos && !Array.isArray(videos)) {
      return NextResponse.json({ error: 'Videos must be an array' }, { status: 400 })
    }

    // Validate each video object
    if (videos) {
      for (const video of videos) {
        if (!video.id || !video.title || !video.youtubeId) {
          return NextResponse.json(
            { error: 'Each video must have id, title, and youtubeId' }, 
            { status: 400 }
          )
        }
      }
    }

    // Update lesson in database
    const updateData: any = {}
    if (videos !== undefined) updateData.videos = JSON.stringify(videos)
    if (objectives !== undefined) updateData.objectives = objectives
    if (estimated_time !== undefined) updateData.estimated_time = estimated_time

    const { data, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      lesson: data,
      message: 'Lesson updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, title, videos, objectives, estimated_time')
      .eq('id', id)
      .single()

    if (error || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Parse videos JSON
    let videos = []
    if (lesson.videos) {
      try {
        videos = typeof lesson.videos === 'string' 
          ? JSON.parse(lesson.videos) 
          : lesson.videos
      } catch (e) {
        console.warn('Failed to parse lesson videos:', e)
        videos = []
      }
    }

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      videos,
      objectives: lesson.objectives || [],
      estimated_time: lesson.estimated_time
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
