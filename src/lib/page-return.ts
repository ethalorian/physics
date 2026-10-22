/** One notification per return to the app, even when the browser fires both
 * visibilitychange and focus. No account data is cached here. */
export function subscribePageReturn(refresh: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastRefresh = 0
  const schedule = (event: Event) => {
    if (document.visibilityState !== 'visible') return
    // Normal pageshow follows the initial fetch; only a restored page is stale.
    if (event.type === 'pageshow' && !(event as PageTransitionEvent).persisted) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 1000) return
      lastRefresh = Date.now()
      refresh()
    }, 100)
  }
  window.addEventListener('focus', schedule)
  window.addEventListener('pageshow', schedule)
  document.addEventListener('visibilitychange', schedule)
  return () => {
    clearTimeout(timer)
    window.removeEventListener('focus', schedule)
    window.removeEventListener('pageshow', schedule)
    document.removeEventListener('visibilitychange', schedule)
  }
}
