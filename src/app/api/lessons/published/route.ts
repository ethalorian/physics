import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/lessons/published
 * Fetch published lessons (or all lessons for admins)
 * This bypasses RLS by using server-side auth check
 */
export async function GET() {
  try {
    // Check authentication using NextAuth
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Determine user role based on email
    const userRole = getUserRole(session.user.email)
    const isAdmin = userRole === 'admin' || userRole === 'teacher'

    console.log('Fetching lessons for:', session.user.email, 'Role:', userRole)

    // Use supabaseAdmin to bypass RLS
    // Admins see all lessons, students see only published
    let query = supabaseAdmin
      .from('lessons')
      .select('*')
      .order('lesson_number', { ascending: true })

    // Students only see published lessons
    if (!isAdmin) {
      query = query.eq('published', true)
    }

    const { data: lessons, error } = await query

    if (error) {
      console.error('Supabase error fetching lessons:', error)
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    console.log(`Fetched ${lessons?.length || 0} lessons for ${session.user.email}`)

    return NextResponse.json({
      lessons: lessons || [],
      userRole,
      isAdmin
    })

  } catch (error) {
    console.error('Error in lessons API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
