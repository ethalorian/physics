/**
 * Physics Balderdash — pure game logic (no UI, no DB), mirroring src/lib/duel.ts.
 *
 * The higher-Bloom's vocab game: each round shows a term; every player writes
 * a PLAUSIBLE FAKE definition (Create — you must know what physics definitions
 * sound like to forge one); then all fakes + the real definition appear
 * shuffled and anonymous, and players vote for the real one (Evaluate).
 *
 * Scoring:
 *   +SPOT_POINTS  for voting the real definition
 *   +FOOL_POINTS  per classmate who voted for YOUR fake
 *
 * Sync model: same as Vocab Duel — no websockets, the server advances phases
 * on each poll (writing → voting → reveal → next round), transitions firing
 * when everyone has acted or the phase clock runs out.
 */

export const BAL_ROUNDS = 5
export const WRITE_MS = 75_000
export const VOTE_MS = 45_000
export const BAL_REVEAL_MS = 10_000
export const PHASE_GRACE_MS = 2_000
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 12
export const SPOT_POINTS = 10
export const FOOL_POINTS = 5
export const MAX_DEF_LEN = 240

export type BalStatus = 'waiting' | 'playing' | 'finished'
export type BalPhase = 'writing' | 'voting' | 'reveal'

export interface BalPlayer {
  id: string
  name: string
}

/** One presented definition. pid === null marks the real one. */
export interface BalEntry {
  pid: string | null
  text: string
}

export interface BalRound {
  term: string
  real: string
  startedAt?: string // writing phase opens
  votingAt?: string // voting phase opened (entries frozen + shuffled)
  revealAt?: string // votes frozen, attribution shown
  writings: Record<string, string> // pid → fake definition (writing phase)
  entries?: BalEntry[] // shuffled presentation order (set at voting)
  votes: Record<string, number> // pid → index into entries
}

export interface BalTermInput {
  term: string
  definition: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick the round terms. Longer definitions make better Balderdash targets. */
export function pickRounds(terms: BalTermInput[], total = BAL_ROUNDS): BalRound[] {
  const usable = terms.filter((t) => t.term?.trim() && t.definition?.trim())
  if (usable.length < total) return []
  return shuffle(usable).slice(0, total).map((t) => ({
    term: t.term,
    real: t.definition,
    writings: {},
    votes: {},
  }))
}

/** Freeze writings into a shuffled, anonymous ballot (real def included). */
export function buildBallot(round: BalRound): BalEntry[] {
  const fakes: BalEntry[] = Object.entries(round.writings)
    .filter(([, text]) => text.trim().length > 0)
    .map(([pid, text]) => ({ pid, text }))
  return shuffle([...fakes, { pid: null, text: round.real }])
}

/** Which phase a round is in (undefined = round not started). */
export function roundPhase(r: BalRound): BalPhase | undefined {
  if (!r.startedAt) return undefined
  if (r.revealAt) return 'reveal'
  if (r.votingAt) return 'voting'
  return 'writing'
}

/** Per-player scores across all revealed rounds. */
export function balScores(rounds: BalRound[], players: BalPlayer[]): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const p of players) scores[p.id] = 0
  for (const r of rounds) {
    if (!r.revealAt || !r.entries) continue
    for (const [voter, idx] of Object.entries(r.votes)) {
      const picked = r.entries[idx]
      if (!picked) continue
      if (picked.pid === null) {
        scores[voter] = (scores[voter] ?? 0) + SPOT_POINTS // spotted the real one
      } else if (picked.pid !== voter) {
        scores[picked.pid] = (scores[picked.pid] ?? 0) + FOOL_POINTS // fooled a classmate
      }
    }
  }
  return scores
}

/** Stats for one player's end screen. */
export function balStats(rounds: BalRound[], pid: string): { spotted: number; fooled: number; roundsPlayed: number } {
  let spotted = 0
  let fooled = 0
  let roundsPlayed = 0
  for (const r of rounds) {
    if (!r.revealAt || !r.entries) continue
    roundsPlayed++
    const myVote = r.votes[pid]
    if (myVote !== undefined && r.entries[myVote]?.pid === null) spotted++
    for (const [voter, idx] of Object.entries(r.votes)) {
      if (voter !== pid && r.entries[idx]?.pid === pid) fooled++
    }
  }
  return { spotted, fooled, roundsPlayed }
}
