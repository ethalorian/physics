// Deliberately small SVG dialect. Reconstruct accepted markup; never pass through
// unknown syntax, entities, CSS, URLs, IDs or browser-active elements. Rejecting
// IDs/references avoids duplicate-ID collisions across a gallery of portraits.
const TAGS = new Set(['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'])
const ATTRS = new Set(['d', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity', 'stroke-opacity', 'transform'])
export function safeSvgLayer(input: string): string {
  if (typeof input !== 'string' || input.length > 50000 || /[&]|<!--|<!|<\?/.test(input)) return ''
  const tokens = input.match(/<[^>]*>|[^<]+/g) ?? []
  const stack: string[] = []; const output: string[] = []
  for (const token of tokens) {
    if (!token.trim()) continue
    const close = token.match(/^<\/(\w+)\s*>$/)
    if (close) { if (stack.pop() !== close[1]) return ''; output.push(`</${close[1]}>`); continue }
    const open = token.match(/^<(\w+)((?:\s+[\s\S]*?)?)\s*(\/?)>$/)
    if (!open || !TAGS.has(open[1])) return ''
    const attrs: string[] = []; const seen = new Set<string>(); let rest = open[2]
    while (rest.trim()) {
      const a = rest.match(/^\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/)
      if (!a || !ATTRS.has(a[1]) || seen.has(a[1])) return ''
      const value = a[2] ?? a[3]
      if (!/^[\w#.,+\-\s()]*$/.test(value) || /url|javascript|data|expression/i.test(value)) return ''
      if (['fill', 'stroke'].includes(a[1]) && !/^(?:none|currentColor|#[0-9a-fA-F]{3,8})$/.test(value)) return ''
      attrs.push(`${a[1]}="${value}"`); seen.add(a[1]); rest = rest.slice(a[0].length)
    }
    output.push(`<${open[1]}${attrs.length ? ' ' + attrs.join(' ') : ''}${open[3] ? '/' : ''}>`)
    if (!open[3]) stack.push(open[1])
  }
  return stack.length ? '' : output.join('')
}
