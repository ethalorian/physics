import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { rankPlays, type PlayRow } from '@/lib/arcade'
import { drawCards, type SpotlightCard } from '@/lib/avatar-spotlight'
import { ITEM_COLUMNS } from '@/lib/avatar/server'
import { withDefaults } from '@/lib/avatar/types'
import type { GalleryAvatar } from '@/app/api/avatar/gallery/route'

export const GET = withAuth(async (_request, ctx) => {
  // Reuse the gallery's consent + classroom visibility boundary. Never expand
  // to platform-wide identities or return appreciation counts in a ranking.
  const gallery = new Map<string, GalleryAvatar>()
  for (let offset = 0; ; offset += 48) {
    const { data, error } = await supabaseAdmin.rpc('avatar_gallery_page', {
      p_user_id: ctx.userId, p_role: ctx.role, p_email: ctx.scopeEmail, p_offset: offset,
    })
    if (error) throw error
    const rows = data as GalleryAvatar[]
    for (const avatar of rows.slice(0, 48)) gallery.set(avatar.user_id, avatar)
    if (rows.length <= 48) break
  }
  const empty = { game: null, cards: [], items: [], rankedPlayers: 0 }
  const headers = { 'Cache-Control': 'private, no-store' }
  if (!gallery.size) return NextResponse.json(empty, { headers })
  const { data: games, error: gameError } = await supabaseAdmin.from('arcade_games').select('slug, name').eq('enabled', true)
  if (gameError) throw gameError
  const plays: PlayRow[] = []
  const ids = [...gallery.keys()]
  for (let batch = 0; batch < ids.length; batch += 100) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabaseAdmin.from('arcade_plays')
        .select('id, user_id, game_slug, status, score, meta, created_at')
        .in('user_id', ids.slice(batch, batch + 100)).gt('score', 0)
        .order('id').range(offset, offset + 999)
      if (error) throw error
      plays.push(...(data ?? []) as PlayRow[])
      if (!data || data.length < 1000) break
    }
  }
  const boards = ((games ?? []) as { slug: string; name: string }[]).map(game => ({
    game, ranked: rankPlays(plays.filter(play => play.game_slug === game.slug)),
  })).filter(board => board.ranked.length > 0)
  const fullDecks = boards.filter(board => board.ranked.length >= 3)
  const board = drawCards(fullDecks.length ? fullDecks : boards, 1)[0]
  if (!board) return NextResponse.json(empty, { headers })
  const rankedCards: SpotlightCard[] = board.ranked.map((entry, index) => {
    const avatar = gallery.get(entry.user_id)!
    return { id: entry.user_id, name: avatar.name, traits: withDefaults(avatar.traits), equipped: avatar.equipped, score: entry.score, rank: index + 1 }
  })
  const cards = drawCards(rankedCards, 3).sort((a, b) => a.rank - b.rank)
  const slugs = [...new Set(cards.flatMap(card => Object.values(card.equipped)).filter((slug): slug is string => Boolean(slug)))]
  const items = slugs.length ? await supabaseAdmin.from('avatar_items').select(ITEM_COLUMNS).in('slug', slugs) : { data: [], error: null }
  if (items.error) throw items.error
  return NextResponse.json({ game: board.game, cards, items: items.data, rankedPlayers: board.ranked.length }, { headers })
})
