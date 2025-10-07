import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// POST - Sync grades to Google Classroom
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { gradebook_entry_ids, course_id } = body

    if (!gradebook_entry_ids || !Array.isArray(gradebook_entry_ids)) {
      return NextResponse.json(
        { error: 'gradebook_entry_ids must be an array' },
        { status: 400 }
      )
    }

    // Fetch gradebook entries to sync
    const { data: entries, error: fetchError } = await supabase
      .from('gradebook_entries')
      .select('*')
      .in('id', gradebook_entry_ids)

    if (fetchError) {
      console.error('Error fetching gradebook entries:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const syncResults = []
    const errors = []

    // Sync each entry to Google Classroom
    for (const entry of entries || []) {
      try {
        // Call Google Classroom API
        const classroomResponse = await fetch(
          `https://classroom.googleapis.com/v1/courses/${course_id}/courseWork/${entry.item_id}/studentSubmissions`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              assignedGrade: entry.score,
              draftGrade: entry.score
            })
          }
        )

        if (classroomResponse.ok) {
          const classroomData = await classroomResponse.json()
          
          // Update gradebook entry as synced
          await supabase
            .from('gradebook_entries')
            .update({
              synced_to_classroom: true,
              classroom_grade_id: classroomData.id,
              last_synced_at: new Date().toISOString()
            })
            .eq('id', entry.id)

          syncResults.push({
            entry_id: entry.id,
            success: true,
            student_email: entry.user_email
          })
        } else {
          const errorData = await classroomResponse.json().catch(() => ({}))
          errors.push({
            entry_id: entry.id,
            error: errorData.error?.message || 'Failed to sync',
            student_email: entry.user_email
          })
        }
      } catch (error) {
        console.error(`Error syncing entry ${entry.id}:`, error)
        errors.push({
          entry_id: entry.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          student_email: entry.user_email
        })
      }
    }

    return NextResponse.json({
      synced: syncResults.length,
      failed: errors.length,
      results: syncResults,
      errors: errors
    })

  } catch (error) {
    console.error('Error in POST /api/gradebook/sync-to-classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
