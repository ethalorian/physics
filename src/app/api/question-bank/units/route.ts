import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch from database first
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        lessons (*)
      `)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Database units table not found, falling back to static data:', error)
      
      // Fallback to static physics units data
      const { physicsUnits } = await import('@/data/physics-units')
      return NextResponse.json(physicsUnits)
    }

    return NextResponse.json(data || [])
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
