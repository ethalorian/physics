/** Equal versions may contain fresh participation data; older classroom commands may not win. */
export function acceptsLiveState(next: { id: string; updatedAt: string; commandRevision?: number }, previous?: { id: string; updatedAt: string; commandRevision?: number } | null) {
  if (!previous) return true
  if (next.id === previous.id && next.commandRevision !== undefined && previous.commandRevision !== undefined) {
    return next.commandRevision >= previous.commandRevision
  }
  return Date.parse(next.updatedAt) >= Date.parse(previous.updatedAt)
}
