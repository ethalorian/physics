/* eslint-disable no-restricted-syntax -- public content read, pending auth review (audit follow-up) */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/simulations/[slug] - Fetch specific simulation by slug
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 })
    }

    // Fetch simulation
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
      }
      console.error('Error fetching simulation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment view count
    await supabase.rpc('increment_simulation_views', { simulation_slug: slug })

    return NextResponse.json({ simulation: data })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch simulation',
      message: error.message 
    }, { status: 500 })
  }
}
