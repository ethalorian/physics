import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all courses from database
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
    // Fetch all courses from database
    const { data: courses, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      courses: courses || []
    })
})

