/**
 * Vocab Duel — pure match logic (no UI, no DB) so rounds and scoring are
 * trivially testable, mirroring the style of src/lib/lobby/*.
 *
 * Design decisions:
 *   - SYNC MODEL: the app has no Supabase Realtime usage; the lobby system
 *     polls (3s). Duel follows the house pattern: a shared server clock per
 *     round + 1.5s client polling, with the SERVER adjudicating "fastest
 *     correct answer". Feels like a buzzer race without websocket infra.
 *   - ECONOMY (per Craig): both players earn (+10 correct, +5 speed — same
 *     constants as Quiz Bowl), winner gets a bonus. Losing a duel never
 *     costs coins, so a weaker player still profits from playing.
 *   - Rounds are pre-generated at match creation from the chosen vocab set,
 *     so both players see identical questions/options. The correct index is
 *     stripped from API responses until a round resolves (no network-tab
 *     cheating mid-round).
 */

export const TOTAL_ROUNDS = 7
export const WINS_NEEDED = 4 // match ends early once someone clinches
export const ROUND_MS = 15_000 // answer window per round
export const REVEAL_MS = 3_000 // pause between rounds to show the result
export const ANSWER_GRACE_MS = 2_000 // network slack accepted past the deadline
export const POINTS_CORRECT = 10
export const POINTS_SPEED = 5
export const SPEED_MS = 5_000 // answer this fast for the speed bonus
export const WINNER_BONUS = 40
export const TIE_BONUS = 20
export const MIN_TERMS = 4
export const RECOMMENDED_TERMS = 8

export type DuelRole = 'host' | 'guest'
export type DuelMode = 'live' | 'ghost'
export type DuelStatus = 'waiting' | 'recording' | 'open' | 'active' | 'finished'

// Presence + lifetime rules for the open-challenges list. Live challenges are
// only joinable while the host is actually sitting in the waiting room (their
// poll heartbeat is fresh); ghosts are the asynchronous mode and stay up for
// a week, so cross-period rivals never need to be online together.
export const LIVE_PRESENCE_MS = 15_000
export const GHOST_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface DuelAnswer {
  answer: number // index into options
  ms: number // elapsed ms from question shown (server-clamped)
}

export interface DuelRound {
  prompt: string // the definition shown to both players
  options: string[] // 4 candidate terms, shuffled
  correct: number // index of the right term (server-only until resolved)
  startedAt?: string // ISO; set when the round goes live
  host?: DuelAnswer
  guest?: DuelAnswer
  winner?: DuelRole | 'draw' // set when the round resolves
}

export interface DuelTermInput {
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

/**
 * Pre-generate every round from the vocab terms. Distractors are other terms
 * from the same set (the same trick the existing multiple-choice games use),
 * so wrong options stay plausibly confusable.
 */
export function generateRounds(terms: DuelTermInput[], total = TOTAL_ROUNDS): DuelRound[] {
  const usable = terms.filter((t) => t.term?.trim() && t.definition?.trim())
  if (usable.length < MIN_TERMS) return []
  // Sample without replacement until we run out, then re-shuffle (small sets
  // may repeat a term across rounds, never within a round's options).
  const pool = shuffle(usable)
  const rounds: DuelRound[] = []
  for (let i = 0; i < total; i++) {
    const target = pool[i % pool.length]
    const distractors = shuffle(usable.filter((t) => t.term !== target.term)).slice(0, 3)
    const options = shuffle([target.term, ...distractors.map((d) => d.term)])
    rounds.push({ prompt: target.definition, options, correct: options.indexOf(target.term) })
  }
  return rounds
}

/** Decide a single round. Correct beats wrong; both correct → faster wins. */
export function resolveRound(round: DuelRound): DuelRole | 'draw' {
  const h = round.host
  const g = round.guest
  const hOk = !!h && h.answer === round.correct
  const gOk = !!g && g.answer === round.correct
  if (hOk && !gOk) return 'host'
  if (gOk && !hOk) return 'guest'
  if (!hOk && !gOk) return 'draw'
  if (h!.ms < g!.ms) return 'host'
  if (g!.ms < h!.ms) return 'guest'
  return 'draw'
}

export function roundWins(rounds: DuelRound[]): { host: number; guest: number } {
  let host = 0
  let guest = 0
  for (const r of rounds) {
    if (r.winner === 'host') host++
    else if (r.winner === 'guest') guest++
  }
  return { host, guest }
}

/** True once the match is decided (clinched or all rounds resolved). */
export function isMatchOver(rounds: DuelRound[]): boolean {
  const { host, guest } = roundWins(rounds)
  if (host >= WINS_NEEDED || guest >= WINS_NEEDED) return true
  return rounds.every((r) => r.winner !== undefined)
}

/**
 * Match winner. Tie on round wins breaks on total response time across
 * CORRECT answers (rewards speed, the duel's core skill); a dead heat is a
 * genuine tie and both players take TIE_BONUS.
 */
export function matchWinner(rounds: DuelRound[]): DuelRole | 'tie' {
  const { host, guest } = roundWins(rounds)
  if (host !== guest) return host > guest ? 'host' : 'guest'
  const time = (role: DuelRole) =>
    rounds.reduce((sum, r) => {
      const a = r[role]
      return a && a.answer === r.correct ? sum + a.ms : sum
    }, 0)
  const correct = (role: DuelRole) =>
    rounds.filter((r) => r[role] && r[role]!.answer === r.correct).length
  if (correct('host') !== correct('guest')) return correct('host') > correct('guest') ? 'host' : 'guest'
  const th = time('host')
  const tg = time('guest')
  if (th !== tg) return th < tg ? 'host' : 'guest'
  return 'tie'
}

/** A player's arcade score: participation pay + winner bonus (both-earn model). */
export function playerScore(rounds: DuelRound[], role: DuelRole, winner: DuelRole | 'tie' | null): number {
  let score = 0
  for (const r of rounds) {
    const a = r[role]
    if (a && a.answer === r.correct) {
      score += POINTS_CORRECT
      if (a.ms <= SPEED_MS) score += POINTS_SPEED
    }
  }
  if (winner === role) score += WINNER_BONUS
  else if (winner === 'tie') score += TIE_BONUS
  return score
}

/** Stats for the end screen ("4 of 7 correct · 2.1s avg"). */
export function playerStats(rounds: DuelRound[], role: DuelRole): { correct: number; played: number; avgMs: number } {
  const played = rounds.filter((r) => r.winner !== undefined).length
  const answered = rounds.filter((r) => r[role] && r[role]!.answer === r.correct)
  const avgMs = answered.length ? Math.round(answered.reduce((s, r) => s + r[role]!.ms, 0) / answered.length) : 0
  return { correct: answered.length, played, avgMs }
}
