import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRole } from '@/lib/api-auth'

export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
    const body = await request.json()
    const { vocabularySets } = body

    if (!vocabularySets || !Array.isArray(vocabularySets)) {
      return NextResponse.json({ error: 'Invalid vocabulary data format' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const setData of vocabularySets) {
      try {
        // Validate required fields
        if (!setData.name || !setData.terms || !Array.isArray(setData.terms)) {
          errors.push(`Invalid vocabulary set: ${setData.name || 'Unnamed set'}`)
          continue
        }

        // Create vocabulary set
        const { data: vocabularySet, error: setError } = await supabaseAdmin
          .from('vocabulary_sets')
          .insert([{
            name: setData.name,
            description: setData.description || '',
            unit_id: setData.unit || null,
            lesson_id: setData.lesson || null,
            created_by: ctx.userId
          }])
          .select()
          .single()

        if (setError) {
          errors.push(`Failed to create set "${setData.name}": ${setError.message}`)
          continue
        }

        // Add terms
        if (setData.terms.length > 0) {
          const termsData = setData.terms.map((term: any, index: number) => {
            // Validate term data
            if (!term.term || !term.definition) {
              throw new Error(`Invalid term data in set "${setData.name}"`)
            }

            return {
              vocabulary_set_id: vocabularySet.id,
              term: term.term.trim(),
              definition: term.definition.trim(),
              category: term.category || null,
              difficulty: ['easy', 'medium', 'hard'].includes(term.difficulty) ? term.difficulty : 'medium',
              order_index: index
            }
          })

          const { error: termsError } = await supabaseAdmin
            .from('vocabulary_terms')
            .insert(termsData)

          if (termsError) {
            // Clean up the vocabulary set if terms failed
            await supabaseAdmin.from('vocabulary_sets').delete().eq('id', vocabularySet.id)
            errors.push(`Failed to add terms for "${setData.name}": ${termsError.message}`)
            continue
          }
        }

        results.push({
          id: vocabularySet.id,
          name: vocabularySet.name,
          termsCount: setData.terms.length
        })

      } catch (error) {
        errors.push(`Error processing "${setData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      imported: results.length,
      total: vocabularySets.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })
})
