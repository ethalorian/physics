# The Arcade Pattern — adding XP-coin games

The arcade is a **pure XP sink**: vocabulary games and lessons EARN XP
(see `docs/XP_ECONOMY_REVIEW.md` and `src/lib/points.ts`); arcade games
SPEND it. The only payout for a ranked run is leaderboard position —
weekly boards reset Monday 00:00 UTC, all-time bests live forever in the
Hall of Fame.

## How a coin works

```
student clicks INSERT COIN (inside the game iframe)
  game ──postMessage──▶ /arcade/[slug] page : { type:'arcade:coinRequest' }
  page ──POST /api/arcade/coin { slug }
        · re-derives balance from the ledger (never a stored number)
        · inserts reward_redemptions row (status 'approved', note 'arcade:<slug>')  ← the spend
        · inserts arcade_plays row (status 'active')                                ← the credit
  page ──postMessage──▶ game : { type:'arcade:coinAccepted', playId, balance }
  ... student plays; game posts { type:'arcade:score', score, act?, final? } ...
  page ──POST /api/arcade/score { playId, score, act, final }
        · only the credit's owner, only while 'active', only ≤ max_plausible_score
        · score only moves UP within a run; final:true closes the run
```

**One coin = one credit = play until GAME OVER.** Checkpoint posts
(`final:false`) along the way protect the score if a Chromebook lid closes.

**Practice is free by design.** A game opened at its raw URL
(`/games/whatever.html`) has no bridge, gets no coin reply, and falls back
to practice mode after ~900 ms: fully playable, never ranked. Students pay
for the *right to rank*, not the right to play. Staff coins are free and
their plays never appear on student boards (`meta.staff`).

## Adding a new game (the whole recipe)

1. **Build a single-file HTML game** and drop it in `public/games/`.
   Speak the bridge protocol (copy the `ARCADE` object from
   `kinematics-descent.html` — ~30 lines, includes the practice-mode
   timeout). Emit `arcade:coinRequest` when a run starts and
   `arcade:score` (`final:true` at game over).

2. **Register the cabinet** — one row, no code:

   ```sql
   INSERT INTO public.arcade_games
     (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order)
   VALUES
     ('wave-rider', 'WAVE RIDER', 'Surf the superposition…',
      '/games/wave-rider.html', 25, 'Waves', '#c084fc', 150000, 2);
   ```

   It appears on `/arcade` immediately with its own coin price,
   weekly board, and Hall of Fame. Set `enabled = false` to unplug a
   cabinet without losing its records.

3. **Set `max_plausible_score`** honestly — it is the server-side sanity
   cap on reported scores. Estimate the best conceivable run and add ~50%.

That's it. No new tables, no new routes, no new pages per game.

## Files

| Piece | Path |
|---|---|
| Schema + seed (DESCENT) | `supabase/migrations/20260609_create_arcade_cabinet.sql` |
| Shared helpers (season boundary, alias names, ranking) | `src/lib/arcade.ts` |
| Buy a credit | `src/app/api/arcade/coin/route.ts` |
| Post a score | `src/app/api/arcade/score/route.ts` |
| Arcade floor data | `src/app/api/arcade/cabinet/route.ts` |
| Full board for one game | `src/app/api/arcade/leaderboard/route.ts` |
| Arcade floor UI | `src/app/arcade/page.tsx` |
| Cabinet player (iframe + bridge) | `src/app/arcade/[slug]/page.tsx` |
| First game | `public/games/kinematics-descent.html` |

## Design intent (don't break these)

- **Never store a balance.** Spends are `reward_redemptions` rows; the
  balance is always re-derived (`getBalance`). Same ledger as the store,
  so the teacher redemption admin sees arcade spends labeled
  `Arcade credit — <game>`.
- **No XP ever flows OUT of the arcade.** If a future game should pay a
  jackpot, grant it through `economy_point_grants` with a `dedupe_key`,
  deliberately — don't bolt it onto the score route.
- **Scores require a paid playId.** There is no code path from a free
  practice session to a leaderboard.
- **Leaderboards are alias-first** (student-chosen alias, fallback real
  name) — same peer-facing policy as `/api/arcade/hub` and the main
  leaderboard.
