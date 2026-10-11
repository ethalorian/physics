const transient = new Set([429, 500, 502, 503, 504, 529])

function failureMessage(status: number, retried: boolean): string {
  if (status === 429) return 'Claude is receiving too many requests. Your quiz settings are kept. Wait a moment, then generate the draft again.'
  if (transient.has(status)) return `Claude is temporarily unavailable. ${retried ? 'We retried once, but no draft was returned.' : 'No draft was returned.'} Your quiz settings are kept; try again in a moment.`
  if (status === 401 || status === 403) return 'Claude did not accept the API credentials or permissions. Your quiz settings are kept; the Claude connection needs to be checked.'
  if (status === 404) return 'The configured Claude model is unavailable. Your quiz settings are kept; the model setting needs to be checked.'
  return 'Claude rejected the generation request. Your quiz settings are kept; the generation configuration needs to be checked.'
}

/** Two attempts share one time budget, safely below the route's 180-second limit. */
export async function requestClaudeQuiz(key: string, body: unknown): Promise<Response> {
  const signal = AbortSignal.timeout(110000)
  const serialized = JSON.stringify(body)
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: {'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
      signal, body: serialized,
    })
    if (response.ok) return response
    // Log only support identifiers, never prompts, API credentials, or response bodies.
    console.warn('[quiz-generation] Claude request failed', {
      status: response.status, attempt: attempt + 1,
      requestId: response.headers.get('request-id')?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) ?? null,
    })
    await response.body?.cancel().catch(() => {})
    if (attempt === 0 && transient.has(response.status)) {
      const header = response.headers.get('retry-after')
      const seconds = Number(header)
      const retryAfter = header && !Number.isFinite(seconds) ? Date.parse(header) - Date.now() : seconds * 1000
      // Respect a provider-requested wait; leave long waits to the teacher instead of retrying early.
      if (retryAfter > 5000) throw Error(failureMessage(response.status, false))
      const delay = Math.max(1500, Number.isFinite(retryAfter) ? retryAfter : 1500)
      await new Promise<void>((resolve, reject) => {
        signal.throwIfAborted()
        const stop = () => { clearTimeout(timer); reject(signal.reason) }
        const timer = setTimeout(() => { signal.removeEventListener('abort', stop); resolve() }, delay)
        signal.addEventListener('abort', stop, {once: true})
      })
      continue
    }
    throw Error(failureMessage(response.status, attempt > 0))
  }
  throw Error('Claude did not return a draft. Your quiz settings are kept; try again.')
}
