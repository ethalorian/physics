/**
 * Lobby passphrase utilities: lobby-code generation and the gate check.
 *
 * Gate semantics (see Lobby-Sessions-Design.md): a student unlocks submission by
 * collecting every word in their group's passphrase. Matching is UNORDERED and
 * case-insensitive — proving they gathered all the fragments, not that they
 * reconstructed an exact sequence. (Passphrase words are unique, so "all present"
 * is a set test.) Swap to ordered later by comparing arrays positionally.
 */

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no O/0/I/1/L ambiguity

export function generateLobbyCode(length = 5): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return out
}

export function normalizeWord(w: string): string {
  return w.trim().toLowerCase()
}

/** Distinct normalized words the student has entered. */
export function normalizeEntries(entered: string[]): string[] {
  return Array.from(new Set(entered.map(normalizeWord).filter(Boolean)))
}

/**
 * True when every passphrase word is present in `entered` (unordered).
 * Extra/irrelevant entered words are ignored.
 */
export function phraseComplete(entered: string[], passphrase: string[]): boolean {
  const have = new Set(normalizeEntries(entered))
  return passphrase.every((w) => have.has(normalizeWord(w)))
}

/** Which passphrase words are still missing (for student-side hinting). */
export function missingCount(entered: string[], passphrase: string[]): number {
  const have = new Set(normalizeEntries(entered))
  return passphrase.filter((w) => !have.has(normalizeWord(w))).length
}
