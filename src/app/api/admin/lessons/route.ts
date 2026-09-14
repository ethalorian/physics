import { NextResponse } from 'next/server'
import { withContentEditor } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { ContentBlock } from '@/data/content-blocks'
import { validateBlockDocument } from '@/data/block-registry'

export const POST = withContentEditor('lessons', async (request) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.title !== 'string' || !body.title.trim() || typeof body.unit_id !== 'string') return NextResponse.json({ error: 'Choose a unit and give the draft a title.' }, { status: 422 })
  if (!Number.isInteger(body.lesson_number) || body.lesson_number < (body.content_blocks?.lessonKind==='week-overview'?0:1)) return NextResponse.json({ error: 'Choose a positive lesson/day number.' }, { status: 422 })
  const document = body.content_blocks ?? { schemaVersion: 1, dayType: 'STANDARD', blocks: [] }
  if (JSON.stringify(document).length > 2_000_000) return NextResponse.json({ error: 'Import a document smaller than 2 MB.' }, { status: 413 })
  const issues = validateBlockDocument(document)
  if (issues.length) return NextResponse.json({ error: issues.map(i => i.message).join(' '), block_issues: issues }, { status: 422 })
  // Copy canonical references into portable inline draft words. The builder imports
  // them into the new lesson's own vocabulary set before publication.
  const ids=[...new Set((document.blocks as ContentBlock[]).flatMap(b=>(b.type==='vocab'||b.type==='lesson_vocab')?b.termIds??[]:[]))]
  if(ids.length){
    const vr=await supabaseAdmin.from('vocabulary_terms').select('id,term,definition,cognate,contexts').in('id',ids).eq('archived',false)
    if(vr.error)throw vr.error
    if((vr.data??[]).length!==ids.length)return NextResponse.json({error:'An imported vocabulary reference is missing. Export the source with its word definitions and import again.'},{status:422})
    document.blocks=(document.blocks as ContentBlock[]).map(b=>{if((b.type!=='vocab'&&b.type!=='lesson_vocab')||!b.termIds)return b;const terms=b.termIds.map(id=>{const t=vr.data!.find(t=>t.id===id)!;const context=(t.contexts as Record<string,{definition?:string;cognate?:string}>)?.[b.id];return {term:t.term,definition:context?.definition??t.definition,cognate:context?.cognate??t.cognate}});return {...b,type:'vocab',terms,termIds:undefined,vocabularySetId:undefined}})
  }
  const { data: unit, error: unitError } = await supabaseAdmin.from('units').select('id, name').eq('id', body.unit_id).maybeSingle()
  if (unitError) throw unitError
  if (!unit) return NextResponse.json({ error: 'Unit not found.' }, { status: 404 })
  const id = crypto.randomUUID()
  const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 8)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ error: 'Use lowercase letters, numbers, and single hyphens in the slug.' }, { status: 422 })
  const { data, error } = await supabaseAdmin.from('lessons').insert({ id, title: body.title.trim(), slug, unit_id: unit.id, unit: unit.name, lesson_number: body.lesson_number, published: false, estimated_time: null, content_blocks: document, updated_at: new Date().toISOString() }).select('id').single()
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'That slug already exists. Choose another.' : error.message }, { status: error.code === '23505' ? 409 : 500 })
  return NextResponse.json({ lesson: data }, { status: 201 })
})
