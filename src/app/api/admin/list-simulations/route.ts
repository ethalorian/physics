import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'

/**
 * List all simulations in database with details
 */
export const GET = withRole('admin', async () => {
  try {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        tables_exist: false
      }, { status: 500 })
    }

    return NextResponse.json({ 
      simulations: data || [],
      count: data?.length || 0
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
})
