/**
 * Identity aliases — one person, several sign-in addresses.
 *
 * Course ownership is stored as a single `courses.teacher_email`, written by
 * whichever Google account performed the Classroom import. A staff member who
 * signs in with a DIFFERENT address of their own (school vs. personal) would
 * otherwise own nothing at all: every ownership check would quietly return an
 * empty set, which reads to the user as "the app is broken" rather than "wrong
 * account". `ownerEmailsFor` expands a signed-in address into every address
 * that is the same human, so "my classes" stays stable across sign-ins.
 *
 * This is deliberately NOT a permission grant. It only widens *which rows are
 * mine*, never *what I am allowed to do* — roles still come from
 * `@/lib/permissions` and `@/lib/roles`. Adding a pair here asserts exactly one
 * thing: these two addresses belong to one person.
 *
 * Invariant: an address may appear in at most ONE group. Two groups sharing an
 * address would make ownership order-dependent, so `assertDisjoint` fails loudly
 * in development rather than letting it ship.
 */

const ALIAS_GROUPS: string[][] = [
  // Craig Antocci — school account owns the imported courses; the personal
  // account is the one used on non-district devices.
  ['antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com'],
]

const norm = (e: string | null | undefined): string => (e ?? '').trim().toLowerCase()

function assertDisjoint(): void {
  if (process.env.NODE_ENV === 'production') return
  const seen = new Set<string>()
  for (const group of ALIAS_GROUPS) {
    for (const raw of group) {
      const e = norm(raw)
      if (seen.has(e)) {
        throw new Error(`[identity-aliases] ${e} appears in more than one alias group — ownership would be ambiguous.`)
      }
      seen.add(e)
    }
  }
}
assertDisjoint()

/**
 * Every email address that counts as "this person" for ownership scoping.
 * Always returns at least the normalized input (an address with no alias group
 * is simply its own group of one). Returns [] only for a missing address.
 */
export function ownerEmailsFor(email: string | null | undefined): string[] {
  const e = norm(email)
  if (!e) return []
  const group = ALIAS_GROUPS.find((g) => g.some((member) => norm(member) === e))
  return group ? Array.from(new Set(group.map(norm))) : [e]
}

/** True when `candidate` is one of the addresses belonging to `email`'s person. */
export function isSameIdentity(email: string | null | undefined, candidate: string | null | undefined): boolean {
  const c = norm(candidate)
  return c !== '' && ownerEmailsFor(email).includes(c)
}
