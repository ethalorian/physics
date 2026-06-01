/**
 * Escape Room — a standalone, higher-Bloom's collaborative lobby task.
 *
 * Design (see Escape-Room-Proposal.md):
 *   - An escape room is a CHAIN of jigsaw gates. Each "lock" deals one clue card
 *     per group member; in a group of 3 with 3 clues, every student holds a
 *     distinct, *necessary* datum and no one can derive the code alone (Aronson
 *     Jigsaw). The physics model is withheld so the group must also choose and
 *     justify which physics applies — that's the analyze/evaluate reach.
 *   - The win condition is UNLOCKING, never the clock. A wrong code triggers a
 *     short cooldown ("recheck your work") instead of a hard block, so a careful
 *     near-peer group is never punished for being slow (Decision 3).
 *   - The prize is a pluggable slot the teacher sets per room: automatic XP, a
 *     cosmetic unlock, or a teacher-authored reveal that can point at a
 *     real-world surprise (Decision 4).
 *
 * This module is pure + UI-free so the lock logic stays trivially reasoned about.
 * Group run-state is persisted by the API in block_responses (no schema change).
 */

export interface EscapeLock {
  /** Stable id within the room. */
  id: string
  /** Short panel name shown on the stage strip. */
  title: string
  /** Narrative shown to the whole group when this lock is active. */
  narrative: string
  /**
   * One clue card per member slot, distributed round-robin by group position.
   * Keep these mutually necessary: split the givens so the code is unreachable
   * without every card.
   */
  clues: string[]
  /** Accepted answers (compared after normalizeCode). Usually one. */
  answers: string[]
  /** Revealed to the group when the lock opens — a fragment of the final secret. */
  reveal: string
  /** Teacher-facing: the model assessed + the worked answer. Never sent to students. */
  teacherNote?: string
}

export type EscapePrizeTier = 'xp' | 'cosmetic' | 'surprise'

export interface EscapePrize {
  tier: EscapePrizeTier
  /** XP awarded on escape (Tier 1 is always on). */
  xp?: number
  /** Free text the final vault reveals. For 'surprise' this can name a real-world prize. */
  reveal: string
}

export interface EscapeRoom {
  id: string
  title: string
  tagline: string
  /** Mission briefing shown before the first lock. */
  intro: string
  locks: EscapeLock[]
  /** Shown when every lock is open, just above the prize reveal. */
  finale: string
  defaultPrize: EscapePrize
}

// ---------------------------------------------------------------------------
// Room catalog
// ---------------------------------------------------------------------------

/**
 * Reactor Lockdown — a 3-lock room tuned for a group of 3 on an Energy target.
 * Lock 1 (kinematics) and Lock 2 (energy) are apply/analyze; Lock 3 is an
 * evaluate-level synthesis that re-uses both prior results.
 */
export const REACTOR_LOCKDOWN: EscapeRoom = {
  id: 'reactor-lockdown',
  title: 'Reactor Lockdown',
  tagline: 'Crack three control panels before the core overheats.',
  intro:
    'The lab reactor is overheating. Three control panels stand between your team and the override. ' +
    'You each hold part of every panel’s solution — say your clue out loud, listen for the others, ' +
    'and work the physics together. No panel opens unless all of you contribute.',
  locks: [
    {
      id: 'kinematics',
      title: 'Panel 1 · Kinematics',
      narrative:
        'PANEL 1 — a runaway cart on the cooling rail. Pool your three readings and work out the code.',
      clues: [
        '🛰️ You log the cart leaving the rail at v₀ = 12 m/s.',
        '🛰️ Your sensor reads a steady deceleration of 3 m/s² once it leaves the rail.',
        '🛰️ PANEL CODE = the distance in whole meters the cart travels before it stops. (Which equation? That’s on you.)',
      ],
      answers: ['24'],
      reveal: 'OVERRIDE WORD 1 — AMBER',
      teacherNote: 'v² = v₀² + 2ad ⇒ d = 12² / (2·3) = 144/6 = 24 m. Assesses model selection (no equation given).',
    },
    {
      id: 'energy',
      title: 'Panel 2 · Energy',
      narrative:
        'PANEL 2 — the cart slams a buffer spring. Combine your three facts to find the code.',
      clues: [
        '⚡ The cart’s mass is 2 kg.',
        '⚡ It strikes a buffer spring of stiffness k = 300 N/m while moving at 6 m/s.',
        '⚡ PANEL CODE = the spring’s maximum compression in whole centimeters. (Pick the right conservation law.)',
      ],
      answers: ['49'],
      reveal: 'OVERRIDE WORD 2 — COBALT',
      teacherNote: '½mv² = ½kx² ⇒ x = v√(m/k) = 6·√(2/300) ≈ 0.490 m ≈ 49 cm.',
    },
    {
      id: 'synthesis',
      title: 'Panel 3 · Override',
      narrative:
        'FINAL OVERRIDE — no new numbers. Decide which panel involved LESS energy, then enter the two override words in that order.',
      clues: [
        '🔒 The override wants the two reveal words ordered by the energy involved — the lower-energy panel first.',
        '🔒 You hold this fact: the cart had the SAME mass (2 kg) at both panels.',
        '🔒 PANEL CODE = the two override words, lower-energy panel first, separated by a space.',
      ],
      // Panel 1 KE at launch = ½·2·12² = 144 J (AMBER); Panel 2 KE at impact = ½·2·6² = 36 J (COBALT).
      // Lower energy first ⇒ COBALT then AMBER.
      answers: ['cobalt amber'],
      reveal: 'CORE STABILIZED — override accepted.',
      teacherNote: 'KE₁ = ½·2·12² = 144 J vs KE₂ = ½·2·6² = 36 J. Lower first ⇒ "cobalt amber". Evaluate-level: compare + justify.',
    },
  ],
  finale: 'Every panel is green. The override engages and the vault door rolls open…',
  defaultPrize: {
    tier: 'xp',
    xp: 250,
    reveal: 'Reactor stabilized. +250 XP credited to your profile — spend it in the rewards store. 🎉',
  },
}

export const ESCAPE_ROOMS: EscapeRoom[] = [REACTOR_LOCKDOWN]

export function getRoom(id: string | null | undefined): EscapeRoom | null {
  if (!id) return null
  return ESCAPE_ROOMS.find((r) => r.id === id) ?? null
}

// ---------------------------------------------------------------------------
// Pure logic
// ---------------------------------------------------------------------------

/** Lowercase, strip whitespace and punctuation except digits/letters/dot. */
export function normalizeCode(s: string): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9. ]/g, '')
    .trim()
}

/** True when `input` matches any accepted answer (order-sensitive for word codes). */
export function checkAnswer(lock: EscapeLock, input: string): boolean {
  const got = normalizeCode(input)
  if (!got) return false
  return lock.answers.some((a) => normalizeCode(a) === got)
}

/**
 * The clue card for the member at `ordinal` (0-based position in the group).
 * Round-robin so larger groups still each hold a needed piece; a group of 3 on
 * a 3-clue lock gets a perfect 1:1 split.
 */
export function clueForMember(lock: EscapeLock, ordinal: number): string {
  if (lock.clues.length === 0) return ''
  const i = ((ordinal % lock.clues.length) + lock.clues.length) % lock.clues.length
  return lock.clues[i]
}

// ---------------------------------------------------------------------------
// Session config (stored in lobby_sessions.task_prompt as JSON — no new column)
// ---------------------------------------------------------------------------

export interface EscapeConfig {
  roomId: string
  prize: EscapePrize
}

/** Marker so we can tell an escape config apart from a plain text prompt. */
interface EncodedEscapeConfig extends EscapeConfig {
  __escape: true
}

export function encodeEscapeConfig(cfg: EscapeConfig): string {
  const payload: EncodedEscapeConfig = { __escape: true, ...cfg }
  return JSON.stringify(payload)
}

export function decodeEscapeConfig(prompt: string | null | undefined): EscapeConfig | null {
  if (!prompt) return null
  try {
    const parsed = JSON.parse(prompt) as Partial<EncodedEscapeConfig>
    if (parsed && parsed.__escape && typeof parsed.roomId === 'string' && parsed.prize) {
      return { roomId: parsed.roomId, prize: parsed.prize }
    }
  } catch {
    // Not JSON — a normal prompt, not an escape config.
  }
  return null
}

// ---------------------------------------------------------------------------
// Group run-state (persisted by the API; shape lives here for both sides)
// ---------------------------------------------------------------------------

export interface EscapeUnlockEntry {
  stage: number
  by: string
  at: string
}

export interface EscapeState {
  /** 0-based index of the lock currently being worked. Equals locks.length when done. */
  stage: number
  /** Reveal fragments collected so far, in order. */
  fragments: string[]
  unlocks: EscapeUnlockEntry[]
  finishedAt: string | null
  /** Total wrong codes entered across the whole run (teacher signal). */
  wrongAttempts: number
  /** ISO timestamp of the last action (right or wrong) — drives "last activity". */
  lastAt?: string
  /** Epoch ms; while now < cooldownUntil the keypad is resting after a wrong code. */
  cooldownUntil?: number
}

export function freshState(): EscapeState {
  return { stage: 0, fragments: [], unlocks: [], finishedAt: null, wrongAttempts: 0 }
}

/** Soft cooldown after a wrong code (Decision 3): nudge back to reasoning, never hard-block. */
export const WRONG_CODE_COOLDOWN_MS = 8000
