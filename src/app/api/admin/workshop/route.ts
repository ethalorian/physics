import { isCatalogUnit } from '@/lib/retired-curriculum'
import { currentLessonIds } from '@/lib/current-lesson-catalog-server'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin as db } from '@/lib/supabase'
import { decayingAverage } from '@/data/curriculum-types'
import { lookAhead } from '@/lib/curriculum-lookahead'
import { planAlignment } from '@/lib/lesson-plan-alignment'
import { targetCoverage, lessonReadiness, type CatalogLesson, type CatalogTarget } from '@/lib/curriculum-readiness'
import { viewerCanSeeGate } from '@/lib/track-visibility'
import { releaseStatus } from '@/lib/lesson-release'
import type { BlockDocument } from '@/data/content-blocks'

export const GET = withRole('admin', async (request) => {
  const params = new URL(request.url).searchParams
  const courseId = params.get('class'), unitParam = params.get('unit'), targetParam = params.get('target')
  const cr = await db.from('courses').select('id, name, section, program, track').is('archived_at', null)
  if (cr.error) throw cr.error
  const courses = cr.data ?? [], selected = courses.find(c => c.id === courseId)
  if (courseId && !selected) return NextResponse.json({ error: 'Class not found.' }, { status: 404 })
  let targetUnit = unitParam
  if (targetParam) {
    const r = await db.from('learning_targets').select('unit_id').eq('id', targetParam).maybeSingle()
    if (r.error) throw r.error
    if (!r.data) return NextResponse.json({ error: 'Target not found.' }, { status: 404 })
    targetUnit = r.data.unit_id
  }
  let uq = db.from('units').select('id, name, order_index, program, allotted_days').order('order_index')
  if (selected) uq = uq.eq('program', selected.program ?? 'physics')
  const ur = await uq; if (ur.error) throw ur.error
  const units = (ur.data ?? []).filter(isCatalogUnit), unitIds = units.map(u => u.id)
  if (targetUnit && !unitIds.includes(targetUnit)) return NextResponse.json({ error: 'This unit is outside the selected class curriculum.' }, { status: 404 })
  // Only summaries on the shelf; only the selected unit on drilldown.
  const scope = targetUnit ? [targetUnit] : unitIds
  const [lr, tr, pr, currentIds] = await Promise.all([
    db.from('lesson_catalog_summary').select('*').in('unit_id', scope).order('lesson_number'),
    db.from('learning_targets').select('id, slug, statement, unit_id, lesson_id').in('unit_id', scope).eq('exclude_from_growth', false).order('order_index'),
    db.from('section_pacing').select('course_id, current_unit_id, current_lesson_id, updated_at').in('course_id', selected ? [selected.id] : courses.map(c => c.id)),
    currentLessonIds(scope),
  ])
  for (const r of [lr, tr, pr]) if (r.error) throw r.error
  const lessons = ((lr.data ?? []) as CatalogLesson[]).filter(l => currentIds.has(l.id) && (!selected || viewerCanSeeGate({ role: 'student', track: selected.track }, l.visibility_track)))
  const targets = (tr.data ?? []) as CatalogTarget[], pacing = pr.data ?? []
  const rr = await db.from('review_catalog_summary').select('*').in('target_id', targets.map(t => t.id)); if (rr.error) throw rr.error
  const reviews = rr.data ?? []
  const coverage = targets.map(t => ({ ...t, ...targetCoverage(lessons, t, selected ? selected.track : undefined), approved: reviews.filter(r => r.target_id === t.id && r.status === 'approved').length, pending: reviews.filter(r => r.target_id === t.id && r.status === 'pending').length }))
  const courseList = courses.map(c => ({ id: c.id, label: [c.name, c.section].filter(Boolean).join(' · '), program: c.program ?? 'physics' }))
  const context = { courses: courseList, scope: selected ? courseList.find(c => c.id === selected.id)?.label : 'App-wide comparison', classId: courseId }
  if (!targetUnit) {
    const shelf = units.map(u => {
      const ls = lessons.filter(l => l.unit_id === u.id), ts = coverage.filter(t => t.unit_id === u.id)
      return { ...u, lessons: ls.length, published: ls.filter(l => l.published).length, drafts: ls.filter(l => !l.published).length, targets: ts.length, covered: ts.filter(t => t.published.length).length, reviews: ts.filter(t => t.approved).length, pending: ts.reduce((s, t) => s + t.pending, 0), missing: ts.filter(t => !t.published.length), teachingSections: pacing.filter(p => p.current_unit_id === u.id).map(p => courseList.find(c => c.id === p.course_id)?.label).filter(Boolean) }
    })
    let upcoming=null
    if(selected){
      const position=pacing.find(p=>p.course_id===selected.id), window=lookAhead(lessons,units,position,params.get('from'))
      const ids=window.items.map(l=>l.id)
      const [dr,vr,ar,pl]=await Promise.all([
        ids.length?db.from('lessons').select('id,content_blocks').in('id',ids):Promise.resolve({data:[],error:null}),
        ids.length?db.from('vocabulary_sets').select('lesson_id,vocabulary_terms(id,term,archived)').in('lesson_id',ids):Promise.resolve({data:[],error:null}),
        db.from('learning_targets').select('id,slug,statement,unit_id'),
        ids.length?db.from('lesson_plan_links').select('*').in('lesson_id',ids):Promise.resolve({data:[],error:null})
      ]);for(const r of [dr,vr,ar,pl])if(r.error)throw r.error
      upcoming={...window,pacingUpdatedAt:position?.updated_at,choices:lessons.map(l=>({id:l.id,title:l.title,unit_id:l.unit_id})),unbuilt:units.filter(u=>!lessons.some(l=>l.unit_id===u.id)).map(u=>({id:u.id,name:u.name})),items:window.items.map(l=>({...l,block_summary:undefined,alignment:planAlignment(l,pl.data??[]),issues:lessonReadiness(dr.data?.find(d=>d.id===l.id)?.content_blocks as BlockDocument,ar.data??[],(vr.data?.find(v=>v.lesson_id===l.id)?.vocabulary_terms??[]).filter(t=>!t.archived).map(t=>t.term))}))}
    }
    return NextResponse.json({ ...context, shelf, pacing, upcoming })
  }
  const relevantCourses = selected ? [selected.id] : courses.filter(c => (c.program ?? 'physics') === (units.find(u => u.id === targetUnit)?.program ?? 'physics')).map(c => c.id)
  const er = await db.from('course_students').select('course_id, student_id').eq('enrollment_state', 'ACTIVE').in('course_id', relevantCourses); if (er.error) throw er.error
  const enrollments = er.data ?? [], studentIds = [...new Set(enrollments.map(e => e.student_id))]
  const records: {target_id:string;user_id:string;level:number;observed_at:string}[]=[]
  if(studentIds.length)for(let offset=0;;offset+=1000){const mr=await db.from('mastery_records').select('target_id,user_id,level,observed_at').in('target_id',targetParam?[targetParam]:targets.map(t=>t.id)).in('user_id',studentIds).order('observed_at').order('id').range(offset,offset+999);if(mr.error)throw mr.error;records.push(...(mr.data??[]));if((mr.data??[]).length<1000)break}

  const ratings = (targetId: string, ids = studentIds) => {
    const byUser = new Map<string, number[]>()
    for (const r of records) if (r.target_id === targetId && ids.includes(r.user_id)) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.level])
    const vals = [...byUser.values()].map(decayingAverage).filter((v): v is number => v != null)
    return { rated: vals.length, avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null }
  }
  if (targetParam) return NextResponse.json({ ...context, unit: units.find(u => u.id === targetUnit), target: coverage.find(t => t.id === targetParam), evidence: records.length, sections: courseList.filter(c => relevantCourses.includes(c.id)).map(c => ({ ...c, ...ratings(targetParam, enrollments.filter(e => e.course_id === c.id).map(e => e.student_id)) })), pending: reviews.filter(r => r.target_id === targetParam && r.status === 'pending') })
  const [dr, wr, vr, ar] = await Promise.all([
    db.from('lessons').select('id, content_blocks').in('id', lessons.map(l => l.id)),
    db.from('lesson_class_windows').select('lesson_id, course_id, open_at, close_at').in('lesson_id', lessons.map(l => l.id)).in('course_id', relevantCourses),
    db.from('vocabulary_sets').select('id, lesson_id, vocabulary_terms(term, archived)').in('lesson_id', lessons.map(l => l.id)),
    db.from('learning_targets').select('id, slug, statement, unit_id'),
  ])
  for (const r of [dr, wr, vr, ar]) if (r.error) throw r.error
  return NextResponse.json({ ...context, unit: units.find(u => u.id === targetUnit), lessons: lessons.map(l => ({ ...l, block_summary: undefined, issues: lessonReadiness(dr.data?.find(d => d.id === l.id)?.content_blocks as BlockDocument | null, ar.data ?? [], (vr.data?.find(s => s.lesson_id === l.id)?.vocabulary_terms ?? []).filter(t => !t.archived).map(t => t.term)), openIn: l.published ? (wr.data ?? []).filter(w => w.lesson_id === l.id && releaseStatus(w) === 'open').filter(w => { const c = courses.find(c => c.id === w.course_id); return c && viewerCanSeeGate({ role: 'student', track: c.track }, l.visibility_track) }).map(w => courseList.find(c => c.id === w.course_id)?.label) : [] })), targets: coverage.map(t => ({ ...t, ...ratings(t.id) })) })
})
