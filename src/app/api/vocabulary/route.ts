import { vocabularyTeachingChoices, resolveVocabularyTeachingSource } from '@/lib/vocab-teaching-source-server'
import { teachingSourceKey } from '@/lib/vocab-teaching-source'
import { saveVocabTerms } from '@/lib/vocab-terms'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withContentEditor } from '@/lib/api-auth'
import { vocabularyFor } from '@/lib/vocab-scope-server'
import { readingJson } from '@/lib/textbook-assignments-server'

export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const setId = searchParams.get('setId')

    if (ctx.role !== 'teacher' && ctx.role !== 'admin') {
      if (ctx.realRole !== 'student') return readingJson({ error: 'Forbidden' }, 403)
      const available = await vocabularyFor(ctx, { courseId: searchParams.get('class') })
      const rows = available.sets.map(set => ({
        id: set.id, name: set.label, description: set.lesson_title ? `Vocabulary for ${set.lesson_title}` : 'Assigned class vocabulary',
        unit: set.unit_id, lesson: set.lesson_id, lessonTitle: set.lesson_title, published: true,
        terms: available.words.filter(w => set.term_ids.includes(w.id)).map(w => ({ ...w, definitionEs: w.definition_es })),
      }))
      if (!setId) return readingJson(rows)
      const selected = rows.find(set => set.id === setId)
      return selected ? readingJson({ ...selected, vocabulary_terms: selected.terms }) : readingJson({ error: 'This vocabulary is not open for your class.' }, 403)
    }

    if (setId) {
      // Get specific vocabulary set with terms
      const query = supabaseAdmin
        .from('vocabulary_sets')
        .select(`
          *,
          vocabulary_terms (*)
        `)
        .eq('id', setId).eq('archived',false)

      const { data: vocabularySet, error: setError } = await query.single()

      if (setError) {
        console.error('Error fetching vocabulary set:', setError)
        return NextResponse.json({ error: setError.message }, { status: 500 })
      }

      return NextResponse.json({...vocabularySet,vocabulary_terms:vocabularySet.vocabulary_terms.filter((t:{archived?:boolean})=>!t.archived)})
    } else {
      // Build query - students only see published sets
      const query = supabaseAdmin
        .from('vocabulary_sets')
        .select(`
          *,
          vocabulary_terms (*)
        `)
        .order('created_at', { ascending: false })

      const { data: vocabularySets, error } = await query

      if (error) {
        console.error('Database vocabulary tables not found, falling back to localStorage:', error)
        
        // Fallback to localStorage - return empty array for now, context will handle localStorage fallback
        return NextResponse.json({error:'Could not load vocabulary. Retry before editing.'},{status:500})
      }

      const choices=await vocabularyTeachingChoices(ctx)
      // Transform to match the expected format
      const transformedSets = vocabularySets.filter((s: { archived?: boolean }) => !s.archived).map((set) => ({
        id: set.id,
        name: set.name,
        description: set.description,
        unit: set.unit_id,
        lesson: set.lesson_id,
        teachingSource: set.teaching_source,
        teachingConnection: choices.find(c=>c.key===teachingSourceKey(set.teaching_source??(set.lesson_id?{kind:'video',lesson_id:set.lesson_id}:null)))??null,
        published: set.published || false,
        terms: set.vocabulary_terms.filter((term: { archived?: boolean }) => !term.archived).map((term: any) => ({
          id: term.id,
          term: term.term,
          definition: term.definition,
          category: term.category,
          difficulty: term.difficulty, tier: term.tier, cognate: term.cognate, definitionEs: term.definition_es, icon: term.icon, example: term.example, partOfSpeech: term.part_of_speech, imageUrl: term.image_url, translations: term.translations
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
    const connection='teachingSource' in body?await resolveVocabularyTeachingSource(body.teachingSource,ctx):null
    if(connection&&!connection.ok)return NextResponse.json({error:connection.error},{status:422})

    // Create vocabulary set (default to unpublished)
    const { data: vocabularySet, error: setError } = await supabaseAdmin
      .from('vocabulary_sets')
      .insert([{
        name,
        description,
        unit_id: connection?.ok&&connection.unit_id?connection.unit_id:unit||null,
        lesson_id: lesson||null,
        ...(connection?.ok?{teaching_source:connection.source}:{}),
        published: false,
        created_by: ctx.userId
      }])
      .select()
      .single()

    if (setError) throw setError

    if (terms?.length) await saveVocabTerms(vocabularySet.id,terms)

    return NextResponse.json(vocabularySet)
})

export const PUT = withContentEditor('vocabulary', async (request, ctx) => {
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
    if (unit !== undefined) updateData.unit_id = unit||null
    if (lesson !== undefined) updateData.lesson_id = lesson||null
    if (published !== undefined) updateData.published = published
    if('teachingSource' in body){
      const connection=await resolveVocabularyTeachingSource(body.teachingSource,ctx)
      if(!connection.ok)return NextResponse.json({error:connection.error},{status:422})
      updateData.teaching_source=connection.source
      if(connection.unit_id)updateData.unit_id=connection.unit_id
    }

    if(!Object.prototype.hasOwnProperty.call(body,'expected_updated_at'))return NextResponse.json({error:'Reload before saving so the vocabulary version can be checked.'},{status:428})
    const aliases:Record<string,string>={definitionEs:'definition_es',partOfSpeech:'part_of_speech',imageUrl:'image_url'}
    const rows=terms?terms.map((t:Record<string,unknown>)=>Object.fromEntries(Object.entries(t).map(([k,v])=>[aliases[k]??k,v]))):null
    const saved=await supabaseAdmin.rpc('update_vocabulary_set',{p_set:id,p_expected:body.expected_updated_at,p_patch:updateData,p_terms:rows})
    if(saved.error)return NextResponse.json({error:saved.error.message},{status:saved.error.code==='40001'?409:422})
    return NextResponse.json(saved.data)
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
      .update({ archived: true, published: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting vocabulary set:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
})
