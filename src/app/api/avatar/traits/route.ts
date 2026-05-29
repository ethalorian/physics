import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TRAIT_OPTIONS, type AvatarTraits } from '@/lib/avatar/types'

// POST /api/avatar/traits  { traits: Partial<AvatarTraits> }
// Sets the student's identity traits (face/skin/hair/etc.) and marks the
// trait-builder onboarding step complete. Validates each value against the
// allowed options registry so a tampered client can't inject arbitrary slugs.

export const POST = withAuth(async (request, ctx) => {
    const userId = ctx.userId

    const body = await request.json()
    const incoming = (body?.traits ?? {}) as Partial<AvatarTraits>

    const clean: Partial<AvatarTraits> = {}
    for (const [k, v] of Object.entries(incoming) as [keyof AvatarTraits, string][]) {
      const allowed = TRAIT_OPTIONS[k]
      if (allowed && allowed.includes(v)) {
        // Cast is safe — we just verified v is one of the literal-typed options.
        ;(clean as Record<string, string>)[k] = v
      }
    }

    // Read existing so we can merge (partial updates from the wardrobe's
    // "edit traits" tab should not blow away other fields).
    const { data: existing } = await supabaseAdmin
      .from('student_avatars')
      .select('traits')
      .eq('user_id', userId)
      .maybeSingle()
    const merged = { ...((existing?.traits as Record<string, string>) ?? {}), ...clean }

    const { error } = await supabaseAdmin
      .from('student_avatars')
      .upsert({ user_id: userId, traits: merged, setup_completed: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, traits: merged })
})
