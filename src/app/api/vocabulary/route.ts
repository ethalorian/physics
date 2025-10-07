import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdminAdmin } from '@/lib/supabaseAdmin'
import { getUserRole } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const setId = searchParams.get('setId')

    if (setId) {
      // Get specific vocabulary set with terms
      const { data: vocabularySet, error: setError } = await supabaseAdmin
        .from('vocabulary_sets')
        .select(`
          *,
          vocabulary_terms (*)
        `)
        .eq('id', setId)
        .single()

      if (setError) {
        console.error('Error fetching vocabulary set:', setError)
        return NextResponse.json({ error: setError.message }, { status: 500 })
      }

      return NextResponse.json(vocabularySet)
    } else {
      // Get all vocabulary sets with terms
      const { data: vocabularySets, error } = await supabaseAdmin
        .from('vocabulary_sets')
        .select(`
          *,
          vocabulary_terms (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database vocabulary tables not found, falling back to localStorage:', error)
        
        // Fallback to localStorage - return empty array for now, context will handle localStorage fallback
        return NextResponse.json([])
      }

      // Transform to match the expected format
      const transformedSets = vocabularySets.map((set) => ({
        id: set.id,
        name: set.name,
        description: set.description,
        unit: set.unit_id,
        lesson: set.lesson_id,
        terms: set.vocabulary_terms.map((term: any) => ({
          id: term.id,
          term: term.term,
          definition: term.definition,
          category: term.category,
          difficulty: term.difficulty
        })),
        created_by: set.created_by,
        created_at: set.created_at,
        updated_at: set.updated_at
      }))

      return NextResponse.json(transformedSets)
    }
  } catch (error) {
    console.error('Error in GET /api/vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can create vocabulary sets' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, unit, lesson, terms } = body

    // Create vocabulary set
    const { data: vocabularySet, error: setError } = await supabaseAdmin
      .from('vocabulary_sets')
      .insert([{
        name,
        description,
        unit_id: unit,
        lesson_id: lesson,
        created_by: session.user.id
      }])
      .select()
      .single()

    if (setError) {
      console.error('Database vocabulary tables not found, falling back to localStorage:', setError)
      
      // Fallback: Return a mock response for localStorage handling
      const mockVocabularySet = {
        id: `vocab-set-${Date.now()}`,
        name,
        description,
        unit_id: unit,
        lesson_id: lesson,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return NextResponse.json(mockVocabularySet)
    }

    // Add terms if provided
    if (terms && terms.length > 0) {
      const termsData = terms.map((term: any, index: number) => ({
        vocabulary_set_id: vocabularySet.id,
        term: term.term,
        definition: term.definition,
        category: term.category,
        difficulty: term.difficulty || 'medium',
        order_index: index
      }))

      const { error: termsError } = await supabaseAdmin
        .from('vocabulary_terms')
        .insert(termsData)

      if (termsError) {
        console.error('Error adding terms:', termsError)
        // Clean up the vocabulary set if terms failed
        await supabaseAdmin.from('vocabulary_sets').delete().eq('id', vocabularySet.id)
        return NextResponse.json({ error: 'Failed to add terms' }, { status: 500 })
      }
    }

    return NextResponse.json(vocabularySet)
  } catch (error) {
    console.error('Error in POST /api/vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, unit, lesson, terms } = body

    if (!id) {
      return NextResponse.json({ error: 'Vocabulary set ID is required' }, { status: 400 })
    }

    // Update vocabulary set
    const { data: vocabularySet, error: setError } = await supabaseAdmin
      .from('vocabulary_sets')
      .update({
        name,
        description,
        unit_id: unit,
        lesson_id: lesson,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (setError) {
      console.error('Error updating vocabulary set:', setError)
      return NextResponse.json({ error: setError.message }, { status: 500 })
    }

    // Update terms if provided
    if (terms) {
      // Delete existing terms
      await supabaseAdmin
        .from('vocabulary_terms')
        .delete()
        .eq('vocabulary_set_id', id)

      // Add new terms
      if (terms.length > 0) {
        const termsData = terms.map((term: any, index: number) => ({
          vocabulary_set_id: id,
          term: term.term,
          definition: term.definition,
          category: term.category,
          difficulty: term.difficulty || 'medium',
          order_index: index
        }))

        const { error: termsError } = await supabaseAdmin
          .from('vocabulary_terms')
          .insert(termsData)

        if (termsError) {
          console.error('Error updating terms:', termsError)
          return NextResponse.json({ error: 'Failed to update terms' }, { status: 500 })
        }
      }
    }

    return NextResponse.json(vocabularySet)
  } catch (error) {
    console.error('Error in PUT /api/vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Vocabulary set ID is required' }, { status: 400 })
    }

    // Delete vocabulary set (terms will be deleted automatically due to CASCADE)
    const { error } = await supabaseAdmin
      .from('vocabulary_sets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting vocabulary set:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
