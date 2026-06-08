import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withContentEditor } from '@/lib/api-auth'

export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const setId = searchParams.get('setId')

    if (setId) {
      // Check user role
      const userRole = ctx.role
      const isStudent = userRole === 'student'

      // Get specific vocabulary set with terms
      let query = supabaseAdmin
        .from('vocabulary_sets')
        .select(`
          *,
          vocabulary_terms (*)
        `)
        .eq('id', setId)

      // Students can only access published sets
      if (isStudent) {
        query = query.eq('published', true)
      }

      const { data: vocabularySet, error: setError } = await query.single()

      if (setError) {
        console.error('Error fetching vocabulary set:', setError)
        return NextResponse.json({ error: setError.message }, { status: 500 })
      }

      // If student tries to access unpublished set, return 403
      if (isStudent && !vocabularySet.published) {
        return NextResponse.json({ error: 'This vocabulary set is not published' }, { status: 403 })
      }

      return NextResponse.json(vocabularySet)
    } else {
      // Check user role to determine what vocabulary sets to show
      const userRole = ctx.role
      const isStudent = userRole === 'student'

      // Build query - students only see published sets
      let query = supabaseAdmin
        .from('vocabulary_sets')
        .select(`
          *,
          vocabulary_terms (*)
        `)
        .order('created_at', { ascending: false })

      // Filter for students: only show published vocabulary sets
      if (isStudent) {
        query = query.eq('published', true)
      }

      const { data: vocabularySets, error } = await query

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
        published: set.published || false,
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
})

export const POST = withContentEditor('vocabulary', async (request, ctx) => {
    const body = await request.json()
    const { name, description, unit, lesson, terms } = body

    // Create vocabulary set (default to unpublished)
    const { data: vocabularySet, error: setError } = await supabaseAdmin
      .from('vocabulary_sets')
      .insert([{
        name,
        description,
        unit_id: unit,
        lesson_id: lesson,
        published: false,
        created_by: ctx.userId
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
        created_by: ctx.userId,
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
})

export const PUT = withContentEditor('vocabulary', async (request) => {
    const body = await request.json()
    const { id, name, description, unit, lesson, terms, published } = body

    if (!id) {
      return NextResponse.json({ error: 'Vocabulary set ID is required' }, { status: 400 })
    }

    // Build update object - only include fields that are provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (unit !== undefined) updateData.unit_id = unit
    if (lesson !== undefined) updateData.lesson_id = lesson
    if (published !== undefined) updateData.published = published

    // Update vocabulary set
    const { data: vocabularySet, error: setError } = await supabaseAdmin
      .from('vocabulary_sets')
      .update(updateData)
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
})

export const DELETE = withContentEditor('vocabulary', async (request) => {
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
})
