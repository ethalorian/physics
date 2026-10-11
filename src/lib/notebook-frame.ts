/** Student-only adapter for the pinned local explainer. No presentation commands or I/O. */
interface NotebookLogic {
  state: Record<string, unknown>
  props: Record<string, unknown>
  setState: (patch: Record<string, unknown>) => void
  renderVals: () => unknown
}
interface NotebookWindow extends Window {
  __dcRootName?: () => string
  __dcRegistry?: Record<string, { Logic: { prototype: NotebookLogic }; subs: Set<() => void> }>
}
interface NotebookFrameOptions {
  read: () => Record<string, number>
  writable: () => boolean
  changed: (answers: unknown) => void
  ready: () => void
  link: () => void
}

export function connectNotebookFrame(frame: HTMLIFrameElement, options: NotebookFrameOptions): () => void {
  const win = frame.contentWindow as NotebookWindow | null, doc = frame.contentDocument
  if (!win || !doc) return () => {}
  let logic: NotebookLogic | undefined, restoreRender: (() => void) | undefined, restoreState: (() => void) | undefined
  let lastRead = '', applying = false
  const stable = (answers: Record<string, number>) => JSON.stringify(Object.entries(answers).sort())
  const click = (event: Event) => {
    if (event.type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
    const element = event.target as Element
    if (element.closest?.('a')?.getAttribute('href')?.startsWith('#')) return
    if (element.closest?.('a')) { event.preventDefault(); event.stopImmediatePropagation(); options.link(); return }
    if (!options.writable() && element.closest?.('button,input,select,textarea')) { event.preventDefault(); event.stopImmediatePropagation() }
  }
  doc.addEventListener('click', click, true)
  doc.addEventListener('keydown', click, true)
  const timer = window.setInterval(() => {
    if (!restoreRender) {
      const entry = win.__dcRegistry?.[win.__dcRootName?.() ?? '']
      if (!entry?.Logic) return
      const prototype = entry.Logic.prototype, original = prototype.renderVals
      const capture = (value: NotebookLogic) => { logic = value }
      prototype.renderVals = function () { capture(this); return original.call(this) }
      restoreRender = () => { prototype.renderVals = original }
      entry.subs.forEach(notify => notify())
      return
    }
    if (!logic) return
    if (!restoreState) {
      const instance = logic, original = instance.setState
      // The runtime replaces props both before render and after commit. Keep
      // the assignment's retry policy across both, without changing its source.
      const descriptor = Object.getOwnPropertyDescriptor(instance, 'props')
      let sourceProps = instance.props
      Object.defineProperty(instance, 'props', { configurable: true, enumerable: true,
        get: () => ({ ...sourceProps, allowRetry: true }),
        set: (next: Record<string, unknown>) => { sourceProps = next },
      })
      instance.setState = function (patch) {
        if (!applying && !options.writable()) return
        original.call(this, patch)
        // Capture in the same event, before Save/Submit can run in the outer page.
        if (!applying && patch.answers !== undefined) options.changed(this.state.answers)
      }
      restoreState = () => {
        instance.setState = original
        Object.defineProperty(instance, 'props', { ...descriptor, configurable: true, writable: true, value: sourceProps })
      }
    }
    const answers = options.read(), key = stable(answers)
    if (key !== lastRead) {
      applying = true
      logic.setState({ answers: { ...answers } })
      applying = false
      lastRead = key
      options.ready()
    }
    const disabled = !options.writable()
    doc.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('button,input,select,textarea').forEach(control => {
      if (control.disabled !== disabled) control.disabled = disabled
    })
  }, 100)
  return () => { window.clearInterval(timer); restoreRender?.(); restoreState?.(); doc.removeEventListener('click', click, true); doc.removeEventListener('keydown', click, true) }
}
