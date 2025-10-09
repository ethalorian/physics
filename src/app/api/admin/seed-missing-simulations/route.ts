import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'

/**
 * Add missing simulations to database
 */
export async function POST() {
  try {
    // Check auth
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Define all simulations that should exist
    const expectedSimulations = [
      {
        title: 'Measurement, Precision & Accuracy',
        slug: 'measurement-precision',
        description: 'Learn to measure with proper precision and understand the difference between accuracy and precision.',
        category: 'lab-skills',
        unit: 'lab-skills',
        difficulty: 'beginner',
        component_path: '/simulations/measurement-precision',
        estimated_time: 20,
        objectives: ['Measure to the precision of a measuring device', 'Understand accuracy vs precision'],
        key_concepts: ['precision', 'accuracy', 'measurement'],
        can_embed: true,
        has_ai_guide: false,  // Students work independently - NO AI hints
        published: true
      },
      {
        title: 'Constant Velocity Motion Lab',
        slug: 'constant-velocity',
        description: 'Control a walker\'s motion and collect position data. Observe constant velocity in 1D motion.',
        category: 'kinematics',
        unit: 'unit-1',
        difficulty: 'beginner',
        component_path: '/simulations/constant-velocity',
        estimated_time: 15,
        objectives: ['Understand constant velocity motion', 'Analyze position-time graphs'],
        key_concepts: ['velocity', 'kinematics', 'graphs'],
        can_embed: true,
        has_ai_guide: false,  // Students work independently - NO AI hints
        published: true
      },
      {
        title: 'Freefall Cliff Lab',
        slug: 'freefall-cliff',
        description: 'Measure cliff height by dropping a stone and timing its fall.',
        category: 'kinematics',
        unit: 'unit-1',
        difficulty: 'intermediate',
        component_path: '/simulations/freefall-cliff',
        estimated_time: 20,
        objectives: ['Apply freefall equations', 'Use experimental data'],
        key_concepts: ['freefall', 'kinematics', 'gravity'],
        can_embed: true,
        has_ai_guide: false,  // Students work independently - NO AI hints
        published: true
      },
      {
        title: 'Uniformly Accelerated Motion',
        slug: 'uniformly-accelerated-motion',
        description: 'Watch a car drop oil spots to visualize constant acceleration.',
        category: 'kinematics',
        unit: 'unit-1',
        difficulty: 'intermediate',
        component_path: '/simulations/uniformly-accelerated-motion',
        estimated_time: 25,
        objectives: ['Visualize acceleration', 'Understand kinematic equations'],
        key_concepts: ['acceleration', 'kinematics'],
        can_embed: true,
        has_ai_guide: false,  // Students work independently - NO AI hints
        published: true
      }
    ]

    // Check which ones exist
    const { data: existing } = await supabase
      .from('simulations')
      .select('slug')

    const existingSlugs = new Set((existing || []).map((s: any) => s.slug))
    const missing = expectedSimulations.filter(s => !existingSlugs.has(s.slug))

    if (missing.length === 0) {
      return NextResponse.json({ 
        message: 'All simulations already exist',
        count: expectedSimulations.length
      })
    }

    // Insert missing simulations
    const { data: inserted, error } = await supabase
      .from('simulations')
      .insert(missing.map(s => ({
        ...s,
        created_by: 'system'
      })))
      .select()

    if (error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      added: inserted,
      count: inserted?.length || 0,
      message: `Added ${inserted?.length || 0} missing simulation(s)`
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
