// Next.js imports
import { NextRequest, NextResponse } from 'next/server'

// Internal imports
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Fetch single assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userRole = getUserRole(session.user.email)

    // Fetch assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        lesson:lessons(id, title, slug)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
      }
      console.error('Error fetching assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Students can only view published assignments
    if (userRole === 'student' && !assignment.published) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(assignment)

  } catch (error) {
    console.error('Error in GET /api/assignments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

