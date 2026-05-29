// Internal imports
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch single assignment by ID
export const GET = withAuth<{ id: string }>(async (request, ctx) => {
    const { id } = await ctx.params
    const userRole = ctx.role

    // Fetch assignment
    const { data: assignment, error } = await supabaseAdmin
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
})
