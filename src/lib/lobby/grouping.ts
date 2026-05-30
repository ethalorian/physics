/**
 * Lobby Sessions — grouping + passphrase logic.
 *
 * Pure, deterministic (given a seed), and UI-free so it can be unit-tested in
 * isolation. The API layer feeds it a roster with per-student mastery levels and
 * gets back groups, each with a split passphrase already handed out word-by-word.
 *
 * Design decisions (see Lobby-Sessions-Design.md §6):
 *   - Fork B2: group on a numeric "level" (per-target mastery when available,
 *     overall rollup otherwise). Null level = unknown; mapped to the class median
 *     so unknowns distribute neutrally rather than clumping.
 *   - Fork B banding: near-peer never bridges the full spread. We split the class
 *     at the median into a lower pool {Q1∪Q2} and an upper pool {Q3∪Q4} and form
 *     groups *within* a pool, so a group can pair a stronger-with-weaker student
 *     but never the very top with the very bottom.
 *   - Fork C: absorb the remainder. Group count = floor(n / groupSize) (min 1);
 *     leftover students are spread across existing groups, so groups are size
 *     `groupSize` or one larger. Never an undersized straggler group.
 *   - Fork D: passphrase fragments are random tokens.
 */

export type GroupMode = 'random' | 'near_peer' | 'matched'

export interface RosterStudent {
  userId: string
  name?: string
  /** Per-target or overall mastery. Null = unknown. */
  level: number | null
}

export interface GroupMember extends RosterStudent {
  /** The single passphrase fragment handed to this student. */
  word: string
}

export interface LobbyGroup {
  label: string
  /** Ordered fragments; the full phrase is passphrase.join(' '). */
  passphrase: string[]
  members: GroupMember[]
}

export interface BuildGroupsOptions {
  mode: GroupMode
  groupSize: number
  /** Deterministic seed for reproducible shuffles/passphrases. */
  seed?: number
  /** Override the default word pool (mainly for tests). */
  words?: string[]
}

/** Small, unambiguous word pool. No homophones, no near-duplicates. */
export const DEFAULT_WORD_POOL: string[] = [
  'amber', 'anchor', 'beacon', 'bishop', 'bramble', 'cactus', 'canyon', 'cobalt',
  'comet', 'copper', 'crimson', 'dagger', 'delta', 'ember', 'falcon', 'fjord',
  'galaxy', 'granite', 'harbor', 'hazel', 'indigo', 'ivory', 'jasper', 'jungle',
  'kettle', 'lagoon', 'lantern', 'maple', 'marble', 'meadow', 'nectar', 'nimbus',
  'oasis', 'onyx', 'orchid', 'pebble', 'pewter', 'quartz', 'quiver', 'raven',
  'ripple', 'saffron', 'sienna', 'spruce', 'sterling', 'tundra', 'umber', 'velvet',
  'walnut', 'willow', 'yonder', 'zephyr', 'zenith', 'cipher', 'cinder', 'thistle',
]

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) — deterministic so tests and "regenerate" are stable.
// ---------------------------------------------------------------------------
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Group sizes that absorb the remainder (Fork C).
 * floor(n / groupSize) groups (min 1), leftover spread one-per-group so sizes
 * differ by at most 1 and no group is undersized.
 */
export function computeGroupSizes(n: number, groupSize: number): number[] {
  if (n <= 0) return []
  const g = Math.max(1, Math.floor(n / groupSize))
  const base = Math.floor(n / g)
  const extra = n - base * g // 0..g-1
  return Array.from({ length: g }, (_, i) => base + (i < extra ? 1 : 0))
}

/** Replace null levels with the median of known levels (neutral placement). */
function fillLevels(students: RosterStudent[]): { s: RosterStudent; lvl: number }[] {
  const known = students.map((s) => s.level).filter((v): v is number => v != null).sort((a, b) => a - b)
  const median = known.length ? known[Math.floor(known.length / 2)] : 0
  return students.map((s) => ({ s, lvl: s.level == null ? median : s.level }))
}

/** Chunk an ordered list into the given sizes. */
function chunk<T>(arr: T[], sizes: number[]): T[][] {
  const out: T[][] = []
  let i = 0
  for (const size of sizes) {
    out.push(arr.slice(i, i + size))
    i += size
  }
  return out
}

/**
 * Interleave a level-sorted pool so consecutive picks alternate low/high.
 * Chunking this order gives each group a stronger-with-weaker spread *within*
 * the pool (used by near-peer).
 */
function interleaveEnds<T>(sortedAsc: T[]): T[] {
  const out: T[] = []
  let lo = 0
  let hi = sortedAsc.length - 1
  let takeLow = true
  while (lo <= hi) {
    if (takeLow) out.push(sortedAsc[lo++])
    else out.push(sortedAsc[hi--])
    takeLow = !takeLow
  }
  return out
}

function orderStudents(
  students: RosterStudent[],
  mode: GroupMode,
  rng: () => number,
): { ordered: RosterStudent[]; poolBoundary: number | null } {
  if (mode === 'random') {
    return { ordered: shuffle(students, rng), poolBoundary: null }
  }

  const withLvl = fillLevels(students).sort((a, b) => a.lvl - b.lvl || (rng() - 0.5))
  const sorted = withLvl.map((x) => x.s)

  if (mode === 'matched') {
    // Similar levels adjacent → consecutive chunks are homogeneous.
    return { ordered: sorted, poolBoundary: null }
  }

  // near_peer: split at median into lower {Q1∪Q2} and upper {Q3∪Q4}, interleave
  // each pool so groups mix within the half but never span top-to-bottom.
  // Guard: only split when both halves can form a non-singleton group. For very
  // small classes we interleave the whole roster instead (still stronger-with-
  // weaker, just without a safe top/bottom split).
  const mid = Math.floor(sorted.length / 2)
  if (mid < 2 || sorted.length - mid < 2) {
    return { ordered: interleaveEnds(sorted), poolBoundary: null }
  }
  const lower = interleaveEnds(sorted.slice(0, mid))
  const upper = interleaveEnds(sorted.slice(mid))
  return { ordered: [...lower, ...upper], poolBoundary: mid }
}

function pickPassphrase(size: number, pool: string[], rng: () => number): string[] {
  return shuffle(pool, rng).slice(0, size)
}

function groupLabel(i: number): string {
  // A, B, ... Z, AA, AB, ...
  let n = i
  let s = ''
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return `Group ${s}`
}

/**
 * Build groups with split passphrases. Deterministic for a given seed.
 *
 * For near-peer, group sizes are computed per pool so a group never contains
 * both a lower-pool and an upper-pool student.
 */
export function buildGroups(
  students: RosterStudent[],
  opts: BuildGroupsOptions,
): LobbyGroup[] {
  const { mode, groupSize } = opts
  const seed = opts.seed ?? 1
  const pool = opts.words ?? DEFAULT_WORD_POOL
  const rng = makeRng(seed)

  if (students.length === 0) return []
  if (groupSize < 2) throw new Error('groupSize must be at least 2')

  const { ordered, poolBoundary } = orderStudents(students, mode, rng)

  // Determine chunk sizes. For near-peer, size each pool independently so groups
  // stay within a half.
  let chunks: RosterStudent[][]
  if (poolBoundary == null) {
    chunks = chunk(ordered, computeGroupSizes(ordered.length, groupSize))
  } else {
    const lower = ordered.slice(0, poolBoundary)
    const upper = ordered.slice(poolBoundary)
    chunks = [
      ...chunk(lower, computeGroupSizes(lower.length, groupSize)),
      ...chunk(upper, computeGroupSizes(upper.length, groupSize)),
    ].filter((c) => c.length > 0)
  }

  return chunks.map((members, gi) => {
    const passphrase = pickPassphrase(members.length, pool, makeRng(seed + gi + 1))
    return {
      label: groupLabel(gi),
      passphrase,
      members: members.map((m, mi) => ({ ...m, word: passphrase[mi] })),
    }
  })
}
