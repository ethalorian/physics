import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withRole } from '@/lib/api-auth'
import type { LanguageProfile, WidaLevel } from '@/lib/sei'
import type { LangCode } from '@/data/content-blocks'

// A student's language profile — the input to the SEI level dial.
//   GET  /api/language-profile              → the caller's own profile (students)
//   GET  /api/language-profile?user_id=…    → one student's profile (teacher/admin)
//   PUT  /api/language-profile              → { user_id?, wida?, home_lang?, l1_default? }
//        students may set only their own l1_default; teachers/admins set everything.
// Mastery never reads this table.

type Row = { user_id: string; wida: number | null; home_lang: string | null; l1_default: boolean | null }
const LANGS: LangCode[] = ['es', 'pt', 'ht', 'ar', 'zh', 'vi', 'fr']

function toProfile(r: Row | null, userId: string): LanguageProfile {
  return { userId, wida: (r?.wida ?? null) as WidaLevel | null, homeLang: (r?.home_lang ?? null) as LangCode | null, l1Default: Boolean(r?.l1_default) }
}

export const GET = withAuth(async (request, ctx) => {
    const requested = new URL(request.url).searchParams.get('user_id')
    const staff = ctx.role === 'admin' || ctx.role === 'teacher'
    const userId = requested && staff ? requested : ctx.userId
    const { data } = await supabaseAdmin.from('language_profile').select('user_id, wida, home_lang, l1_default').eq('user_id', userId).maybeSingle()
    return NextResponse.json({ profile: toProfile((data as Row | null) ?? null, userId) })
})

export const PUT = withAuth(async (request, ctx) => {
    const body = (await request.json()) as { user_id?: string; wida?: number | null; home_lang?: string | null; l1_default?: boolean }
    const staff = ctx.role === 'admin' || ctx.role === 'teacher'
    const userId = body.user_id && staff ? body.user_id : ctx.userId

    const patch: Record<string, unknown> = { user_id: userId, updated_by: ctx.email, updated_at: new Date().toISOString() }
    if (typeof body.l1_default === 'boolean') patch.l1_default = body.l1_default
    if (staff) {
      if (body.wida === null) patch.wida = null
      else if (typeof body.wida === 'number') {
        if (!Number.isInteger(body.wida) || body.wida < 1 || body.wida > 6) return NextResponse.json({ error: 'wida must be 1–6' }, { status: 400 })
        patch.wida = body.wida
      }
      if (body.home_lang === null) patch.home_lang = null
      else if (typeof body.home_lang === 'string') {
        if (!LANGS.includes(body.home_lang as LangCode)) return NextResponse.json({ error: `home_lang must be one of ${LANGS.join(', ')}` }, { status: 400 })
        patch.home_lang = body.home_lang
      }
    } else if (body.wida !== undefined || body.home_lang !== undefined) {
      return NextResponse.json({ error: 'Only a teacher can set the WIDA level or home language' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin.from('language_profile').upsert(patch, { onConflict: 'user_id' }).select('user_id, wida, home_lang, l1_default').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: toProfile(data as Row, userId) })
})

// Roster-wide read for the teacher tools: every profile in one call.
export const POST = withRole(['admin', 'teacher'], async (request) => {
    const body = (await request.json()) as { user_ids?: string[] }
    const ids = (body.user_ids ?? []).filter((x) => typeof x === 'string').slice(0, 500)
    if (ids.length === 0) return NextResponse.json({ profiles: {} })
    const { data } = await supabaseAdmin.from('language_profile').select('user_id, wida, home_lang, l1_default').in('user_id', ids)
    const profiles: Record<string, LanguageProfile> = {}
    for (const r of (data ?? []) as Row[]) profiles[r.user_id] = toProfile(r, r.user_id)
    return NextResponse.json({ profiles })
})
