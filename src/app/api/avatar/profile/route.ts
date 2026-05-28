import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/avatar/profile { alias?, use_custom_avatar? }
// Updates the student's leaderboard alias (lives on `students.alias`) and/or
// the "show my Mii in chrome instead of my Google photo" preference (lives on
// `student_avatars.use_custom_avatar`). Both fields are optional in the body
// so the same endpoint handles partial updates from the wardrobe.

const ALIAS_MAX = 32
// Letters, digits, space, dot, hyphen, underscore. No emoji, no script tricks,
// no leading/trailing whitespace (we trim before validating).
const ALIAS_REGEX = /^[A-Za-z0-9 ._-]{1,32}$/

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await request.json()
    const aliasIncoming: unknown = body?.alias
    const prefIncoming: unknown = body?.use_custom_avatar

    // --- Alias ---
    // null / empty string = clear it. string = set/update. undefined = no change.
    let aliasUpdate: string | null | undefined
    if (aliasIncoming === null || aliasIncoming === '') {
      aliasUpdate = null
    } else if (typeof aliasIncoming === 'string') {
      const trimmed = aliasIncoming.trim()
      if (trimmed.length === 0) {
        aliasUpdate = null
      } else if (trimmed.length > ALIAS_MAX || !ALIAS_REGEX.test(trimmed)) {
        return NextResponse.json({ error: `Alias must be 1–32 characters, letters/digits/spaces/. _ - only` }, { status: 400 })
      } else {
        aliasUpdate = trimmed
      }
    }

    if (aliasUpdate !== undefined) {
      // Make sure the alias is unique across students (case-insensitive). A
      // leaderboard with two "ShadowFox" entries is confusing — push back.
      if (aliasUpdate !== null) {
        const { data: clash } = await supabaseAdmin
          .from('students')
          .select('google_user_id, alias')
          .ilike('alias', aliasUpdate)
          .neq('google_user_id', userId)
          .maybeSingle()
        if (clash) return NextResponse.json({ error: 'That alias is taken. Try another.' }, { status: 409 })
      }
      const { error: stuErr } = await supabaseAdmin
        .from('students')
        .update({ alias: aliasUpdate })
        .eq('google_user_id', userId)
      if (stuErr) return NextResponse.json({ error: stuErr.message }, { status: 500 })
    }

    // --- Use-custom-avatar preference ---
    if (typeof prefIncoming === 'boolean') {
      const { error: avErr } = await supabaseAdmin
        .from('student_avatars')
        .upsert({ user_id: userId, use_custom_avatar: prefIncoming, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (avErr) return NextResponse.json({ error: avErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST /api/avatar/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
