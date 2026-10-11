/** Versioned bridge for cabinets with acknowledged saves. Serial requests prevent a late checkpoint from
 * overwriting a finished run. Final retries repeat the idempotent score/payout
 * operations and retain the play ID until both are confirmed. */
const MATH_CABINETS = new Set(['inverse-blitz', 'magnitude', 'scale-storm', 'powers-of-ten', 'slope-sniper', 'fusion', 'expression-crush', 'mathle'])
class SaveError extends Error { constructor(message: string, readonly status: number) { super(message) } }

interface BridgeOptions {
  slug: string
  fetcher: typeof fetch
  reply: (message: Record<string, unknown>) => void
  onBalance: (balance: number) => void
  onFinished: () => void
}
export function createTetherBridge(options: BridgeOptions) {
  const fetcher = options.fetcher
  let queue: Promise<void> = Promise.resolve()
  let activePlay: string | null = null
  let closed = false
  let staff = false
  const coins = new Map<string, Record<string, unknown>>()
  const finals = new Map<string, Record<string, unknown>>()
  const reply = (message: Record<string, unknown>) => options.reply({ protocol: 2, ...message })
  async function post(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetcher(path, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new SaveError(typeof data.error === 'string' ? data.error : 'Could not save. Please retry.', response.status)
      return data
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Connection timed out. Try again or choose practice.')
      throw error
    } finally { clearTimeout(timeout) }
  }
  async function handle(message: Record<string, unknown>): Promise<void> {
    if (!['tether', 'flywheel', 'descent', 'push', 'cascade', 'inverse-blitz', 'magnitude', 'scale-storm', 'powers-of-ten', 'slope-sniper', 'fusion', 'expression-crush', 'mathle', 'pulse', 'mic-check'].includes(options.slug) || message.protocol !== 2 || message.source !== `${options.slug}-arcade` || typeof message.requestId !== 'string' || message.requestId.length > 120) return
    const requestId = message.requestId
    if (message.type === 'arcade:coinRequest') {
      if (coins.has(requestId)) { reply(coins.get(requestId)!); return }
      if (activePlay && !closed) { reply({ type: 'arcade:coinDenied', requestId, reason: 'Finish the current run first.' }); return }
      try {
        const data = await post('/api/arcade/coin', { slug: options.slug, ...(options.slug === 'pulse' ? { chartId: message.chartId } : {}) })
        if (typeof data.playId !== 'string') throw new Error('Cabinet did not return a play ID.')
        activePlay = data.playId; closed = false; staff = !!data.staff
        if (typeof data.balance === 'number') options.onBalance(data.balance)
        const accepted = { type: 'arcade:coinAccepted', requestId, playId: activePlay, staff, ...(options.slug === 'pulse' ? { chartId: data.chartId } : {}) }
        coins.clear(); coins.set(requestId, accepted); reply(accepted)
      } catch (error) { reply({ type: 'arcade:coinDenied', requestId, reason: error instanceof Error ? error.message : 'Connection failed.' }) }
    }
    const recovering = message.type === 'arcade:recover' && MATH_CABINETS.has(options.slug)
    if (recovering && !activePlay && message.final === true && typeof message.playId === 'string' && message.playId.length <= 120) {
      // The route validates ownership AND cabinet before accepting the retained final.
      activePlay = message.playId
    }
    if (message.type === 'arcade:score' || recovering) {
      if (finals.has(requestId)) { reply(finals.get(requestId)!); return }
      if (!activePlay || message.playId !== activePlay || closed) return
      const playId = activePlay
      try {
        const saved = await post('/api/arcade/score', { playId, slug: options.slug, score: message.score, act: message.act, final: message.final === true, stats: message.stats })
        if (message.final === true) {
          // Preserve the deployed rhythm cabinets: their paid runs do not earn learning XP.
          const payout: Record<string, unknown> = ['pulse', 'mic-check'].includes(options.slug) ? { xp: 0 } : await post('/api/arcade/payout', { playId })
          if (typeof payout.balance === 'number') options.onBalance(payout.balance)
          closed = true
          const receipt = { type: 'arcade:scoreSaved', playId, requestId, final: true, score: saved.score, xp: payout.xp ?? 0, capped: !!payout.capped, staff }
          finals.set(requestId, receipt); if (finals.size > 20) finals.delete(finals.keys().next().value!)
          reply(receipt); options.onFinished()
        } else reply({ type: 'arcade:scoreSaved', playId, requestId, score: saved.score, final: false })
      } catch (error) {
        const permanent = error instanceof SaveError && [403, 404, 410].includes(error.status)
        if (recovering && permanent) { activePlay = null; closed = false }
        reply({ type: 'arcade:saveFailed', playId, requestId, permanent, reason: error instanceof Error ? error.message : 'Connection failed. Retry save.' })
      }
    }
  }
  return { handle(message: Record<string, unknown>): Promise<void> { queue = queue.then(() => handle(message)); return queue } }
}
