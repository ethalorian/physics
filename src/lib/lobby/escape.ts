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
  /** Group size this room is authored for (drives the launch form default). */
  recommendedGroupSize?: number
  /** Decorative accent colour (hex) used to theme the student + teacher UI. */
  accent?: string
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
  recommendedGroupSize: 3,
  accent: '#E0843D',
}

/**
 * Green Light Garage — an INTRODUCTORY room for Unit 8 (The Car Project),
 * authored for PAIRS. Each lock deals exactly two clue cards (one per partner),
 * so neither student can read the panel alone. Low-calculation by design: the
 * goal is to preview the project's core ideas — a complete DC circuit, gear
 * ratio, and the straight-line/parallel-axle challenge — and get the pair
 * excited to build, not to assess mastery.
 */
export const GREEN_LIGHT_GARAGE: EscapeRoom = {
  id: 'green-light-garage',
  title: 'Green Light Garage',
  tagline: 'Crack the garage and earn your spot in the Car Project.',
  intro:
    'Welcome to the Car Project. Behind this garage door is your build kit — but it’s locked. ' +
    'You and your partner each hold half of every clue, so read yours out loud and listen for theirs. ' +
    'Crack three panels to bring the garage to GREEN LIGHT GO and start building your electric car.',
  locks: [
    {
      id: 'circuit',
      title: 'Panel 1 · The Circuit',
      narrative:
        'PANEL 1 — the motor won’t spin until the circuit is whole. Put your two clues together to find the code.',
      clues: [
        '🔋 Your kit holds four parts: a 9V battery, a switch, a DC motor, and connecting wires. Current only flows when they form ONE unbroken loop (a series circuit).',
        '🔌 PANEL CODE = how many of those parts must be connected in the loop before the motor can spin.',
      ],
      answers: ['4'],
      reveal: 'PIT WORD 1 — GREEN',
      teacherNote:
        'Day 1 objective: name the four components of a DC circuit (battery, switch, motor, wires) in a complete series loop. Code = 4.',
    },
    {
      id: 'gears',
      title: 'Panel 2 · The Gears',
      narrative:
        'PANEL 2 — gearing trades speed for turning force. Combine your two clues to find the code.',
      clues: [
        '⚙️ The little gear on the motor has 10 teeth. The big gear on the axle has 30 teeth. Gear ratio = axle teeth ÷ motor teeth.',
        '🛞 PANEL CODE = the gear ratio written as a single whole number (for example, a 2-to-1 ratio is just 2).',
      ],
      answers: ['3', '3:1'],
      reveal: 'PIT WORD 2 — LIGHT',
      teacherNote:
        'Day 3 objective: compute gear ratio. 30 ÷ 10 = 3 (a 3:1 reduction → more torque, slower axle). Code = 3.',
    },
    {
      id: 'straight',
      title: 'Panel 3 · Straight Shot',
      narrative:
        'FINAL PANEL — the race is a narrow corridor, so going straight is the whole challenge. Your two clues unlock the garage.',
      clues: [
        '🏁 A car veers when one side rolls with more friction than the other — usually because the two axles aren’t lined up. The fix is in how the axles sit.',
        '📐 PANEL CODE = the one word for how the two axles must sit so the car tracks perfectly straight. (They must stay ______.)',
      ],
      answers: ['parallel'],
      reveal: 'PIT WORD 3 — GO',
      teacherNote:
        'Day 5 objective: explain veer as friction asymmetry; the fix is parallel axles. Code = "parallel".',
    },
  ],
  finale: 'GREEN LIGHT… GO! The garage door rolls up and your build kit is waiting.',
  defaultPrize: {
    tier: 'xp',
    xp: 150,
    reveal: 'Garage unlocked — you’re cleared to build. +150 XP. 🏁 Welcome to the Car Project!',
  },
  recommendedGroupSize: 2,
  accent: '#37B24D',
}

/**
 * Captain Marrow's Treasure Vault — a fun, non-curricular room for trios.
 * Four locks, four DIFFERENT puzzle types (anagram, A=1…Z=26 cipher, riddle,
 * and a final callback-logic lock that references the earlier answers). Each
 * lock deals three clue cards so every member holds a needed piece. No outside
 * knowledge required — just teamwork, the alphabet, and a little counting.
 */
export const TREASURE_VAULT: EscapeRoom = {
  id: 'treasure-vault',
  title: "Captain Marrow's Treasure Vault",
  tagline: "Four locks stand between your crew and the pirate's gold.",
  intro:
    'Ahoy! Captain Marrow sealed her treasure behind four locks and scattered the clues among the crew. ' +
    'You each hold a different card on every lock, so read yours out loud and piece them together. ' +
    'Open all four and the chest is yours.',
  locks: [
    {
      id: 'anagram',
      title: 'Lock 1 · The Scramble',
      narrative: 'LOCK 1 — letters are carved into the wood, all jumbled. Unscramble them together.',
      clues: [
        '🪵 The carved letters are: A · C · M · O · P · S · S.',
        '🧭 Unscramble them into a 7-letter tool every sailor uses to find their way.',
        '🔤 It begins with the letter that comes right after B in the alphabet.',
      ],
      answers: ['compass'],
      reveal: 'MAP PIECE 1 of 4 — unlocked 🧭',
      teacherNote: 'Anagram of A,C,M,O,P,S,S → COMPASS (starts with C, the letter after B).',
    },
    {
      id: 'cipher',
      title: 'Lock 2 · The Number Code',
      narrative: 'LOCK 2 — a row of numbers glows on the brass dial. Crack the code to spell the word.',
      clues: [
        '🔢 The dial reads: 7 — 15 — 12 — 4.',
        '🗝️ Use the key A=1, B=2, C=3, … all the way to Z=26.',
        '✍️ Each number is one letter. Spell the 4-letter word — it’s what fills the chest.',
      ],
      answers: ['gold'],
      reveal: 'MAP PIECE 2 of 4 — unlocked 💰',
      teacherNote: 'A1Z26: 7=G, 15=O, 12=L, 4=D → GOLD.',
    },
    {
      id: 'riddle',
      title: 'Lock 3 · The Riddle',
      narrative: 'LOCK 3 — a riddle is split across your three cards. Read them in order, then answer in one word.',
      clues: [
        '📜 Riddle, part 1: “I have a face and two hands,”',
        '📜 Riddle, part 2: “but no arms and no legs.”',
        '📜 Riddle, part 3: “I tell you something all day long. What am I?” (answer in one word)',
      ],
      answers: ['clock', 'a clock'],
      reveal: 'MAP PIECE 3 of 4 — unlocked ⏰',
      teacherNote: 'Riddle answer: CLOCK (a face, two hands, tells time).',
    },
    {
      id: 'finale',
      title: 'Lock 4 · The Captain’s Combination',
      narrative:
        'FINAL LOCK — a 3-digit combination. Each of you holds one digit rule, and the answers from the locks you already opened are the key.',
      clues: [
        '1️⃣ First digit = the number of locks your crew opened before this final one.',
        '2️⃣ Second digit = how many hands the answer to the riddle (Lock 3) has.',
        '3️⃣ Third digit = the number of letters in the word the Number Code spelled (Lock 2).',
      ],
      answers: ['324'],
      reveal: 'X MARKS THE SPOT — the vault swings open!',
      teacherNote: 'First digit 3 (locks 1–3 opened), second digit 2 (a clock has two hands), third digit 4 (G-O-L-D). Code = 324.',
    },
  ],
  finale: 'The four locks fall away and the heavy chest creaks open…',
  defaultPrize: {
    tier: 'xp',
    xp: 200,
    reveal: "Chest open! You found Captain Marrow's treasure. +200 XP. 🏴‍☠️",
  },
  recommendedGroupSize: 3,
  accent: '#C99A2E',
}

/**
 * Agent Academy: The Final Test — a fun, non-curricular spy room for trios.
 * Four security panels, four different challenge types (number pattern, symbol
 * cipher, logic deduction, and a callback combination). Three clue cards per
 * lock so every recruit holds a needed piece. No outside knowledge required.
 */
export const AGENT_ACADEMY: EscapeRoom = {
  id: 'agent-academy',
  title: 'Agent Academy: The Final Test',
  tagline: 'Crack four security panels to earn your badge.',
  intro:
    'Welcome, recruits. To graduate from Agent Academy you must breach four security panels — ' +
    'and the clues are split across your team. Each of you holds a different card on every panel, ' +
    'so share what you see and think it through together. Crack all four to get clearance.',
  locks: [
    {
      id: 'pattern',
      title: 'Panel 1 · The Sequence',
      narrative: 'PANEL 1 — a string of numbers blinks on the screen, with the last one missing. Find what comes next.',
      clues: [
        '🔢 The screen shows: 2, 4, 8, 16, ?',
        '🔁 Look closely at how each number compares to the one right before it.',
        '➡️ PANEL CODE = the next number in the pattern.',
      ],
      answers: ['32'],
      reveal: 'CLEARANCE LEVEL 1 — granted ✅',
      teacherNote: 'Each term doubles: 2,4,8,16 → 32. Code = 32.',
    },
    {
      id: 'symbols',
      title: 'Panel 2 · The Symbol Lock',
      narrative: 'PANEL 2 — three symbols are etched on the keypad. Decode them into a word.',
      clues: [
        '🔣 The keypad shows these symbols: ★ ● ◆',
        '🗝️ Decoder key: ★ = S, ● = P, ◆ = Y.',
        '🪪 Decode the symbols in order — it spells your new job title here (3 letters).',
      ],
      answers: ['spy'],
      reveal: 'CLEARANCE LEVEL 2 — granted ✅',
      teacherNote: 'Symbol substitution: ★●◆ → S, P, Y → SPY.',
    },
    {
      id: 'deduction',
      title: 'Panel 3 · The Mole',
      narrative: 'PANEL 3 — a mole is hiding among three agents. Use your three cards to deduce who.',
      clues: [
        '🕵️ Three agents were in the vault: Agent Red, Agent Blue, and Agent Green. The mole was wearing a hat.',
        '🎩 Agent Red was NOT wearing a hat. Agent Green was NOT wearing a hat.',
        '🚨 PANEL CODE = the color of the mole.',
      ],
      answers: ['blue'],
      reveal: 'CLEARANCE LEVEL 3 — granted ✅',
      teacherNote: 'Only the hat-wearer is the mole; Red and Green wore no hat → BLUE is the mole.',
    },
    {
      id: 'finale',
      title: 'Panel 4 · Master Override',
      narrative:
        'FINAL PANEL — a 3-digit master code. Each recruit holds one digit rule, drawn from the panels you already cracked.',
      clues: [
        '1️⃣ First digit = the LAST digit of the number you found at Panel 1.',
        '2️⃣ Second digit = the number of letters in your new job title from Panel 2.',
        '3️⃣ Third digit = how many agents were in the vault at Panel 3.',
      ],
      answers: ['233'],
      reveal: 'MASTER OVERRIDE ACCEPTED — doors unlocking!',
      teacherNote: 'Panel 1 = 32 → last digit 2; Panel 2 SPY = 3 letters; Panel 3 = 3 agents. Code = 233.',
    },
  ],
  finale: 'Every panel flashes green and the academy doors slide open…',
  defaultPrize: {
    tier: 'xp',
    xp: 200,
    reveal: 'You passed the final test. Welcome to the Academy, Agent. +200 XP. 🕵️',
  },
  recommendedGroupSize: 3,
  accent: '#3A6FA5',
}

export const ESCAPE_ROOMS: EscapeRoom[] = [REACTOR_LOCKDOWN, GREEN_LIGHT_GARAGE, TREASURE_VAULT, AGENT_ACADEMY]

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
  /**
   * user_ids who have correctly entered the CURRENT lock's code. A lock only
   * opens (and the next clue is revealed) once EVERY group member is in this set;
   * it is cleared each time the group advances to the next lock.
   */
  solvedBy: string[]
  /** Per-member keypad cooldown after a wrong code (user_id → epoch ms). */
  cooldownUntil?: Record<string, number>
}

export function freshState(): EscapeState {
  return { stage: 0, fragments: [], unlocks: [], finishedAt: null, wrongAttempts: 0, solvedBy: [] }
}

/** Soft cooldown after a wrong code (Decision 3): nudge back to reasoning, never hard-block. */
export const WRONG_CODE_COOLDOWN_MS = 8000
