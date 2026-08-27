import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/avatar/profile { alias? }
// Updates the student's leaderboard alias (lives on `students.alias`).
// null / empty / identical-to-roster-name all clear the alias so the board
// follows the roster name and teacher corrections propagate automatically.

const ALIAS_MAX = 32
// Letters, digits, space, dot, hyphen, underscore. No emoji, no script tricks,
// no leading/trailing whitespace (we trim before validating).
const ALIAS_REGEX = /^[A-Za-z0-9 ._-]{1,32}$/

export const POST = withAuth(async (request, ctx) => {
    const userId = ctx.userId

    const body = await request.json()
    const aliasIncoming: unknown = body?.alias

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
      // Keeping your own roster name is not an alias — store nothing.
      if (aliasUpdate !== null) {
        const { data: me } = await supabaseAdmin.from('students').select('name').eq('id', userId).maybeSingle()
        const rosterName = ((me as { name?: string | null } | null)?.name ?? '').trim()
        if (rosterName && rosterName.toLowerCase() === aliasUpdate.toLowerCase()) aliasUpdate = null
      }
      // Make sure the alias is unique across students (case-insensitive). A
      // leaderboard with two "ShadowFox" entries is confusing — push back.
      if (aliasUpdate !== null) {
        const { data: clash } = await supabaseAdmin
          .from('students')
          .select('id, alias')
          .ilike('alias', aliasUpdate)
          .neq('id', userId)
          .maybeSingle()
        if (clash) return NextResponse.json({ error: 'That alias is taken. Try another.' }, { status: 409 })
      }
      const { error: stuErr } = await supabaseAdmin
        .from('students')
        .update({ alias: aliasUpdate })
        .eq('id', userId)
      if (stuErr) return NextResponse.json({ error: stuErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
})
