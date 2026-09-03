/**
 * board-text — word-wrap for text typed onto the 640×360 math board.
 *
 * Wrapping is computed from a fixed per-character estimate (not measureText)
 * so the STUDENT's canvas and the TEACHER's SVG review drawer break lines in
 * exactly the same places — both render the same artifact. Explicit newlines
 * (Shift+Enter in the editor) are honoured; long words are hard-split.
 */
export const BOARD_W = 640
export const BOARD_H = 360
/** average glyph width as a fraction of font size (system sans, digits + letters) */
export const CHAR_W = 0.55
export const LINE_H = 1.2

export function textWidth(s: string, size: number): number {
  return s.length * size * CHAR_W
}

export function wrapBoardText(text: string, x: number, size: number, maxRight: number = BOARD_W - 8): string[] {
  const maxW = Math.max(size * 2, maxRight - x)
  const out: string[] = []
  for (const para of text.split(/\r?\n/)) {
    const words = para.split(/(\s+)/).filter((w) => w.length > 0)
    let line = ''
    const push = () => { out.push(line.replace(/\s+$/, '')); line = '' }
    for (const w of words) {
      if (/^\s+$/.test(w)) { if (line) line += w; continue }
      if (textWidth(line + w, size) <= maxW) { line += w; continue }
      if (line) push()
      // a single word wider than the line: hard-split it
      let rest = w
      while (textWidth(rest, size) > maxW) {
        const n = Math.max(1, Math.floor(maxW / (size * CHAR_W)))
        out.push(rest.slice(0, n)); rest = rest.slice(n)
      }
      line = rest
    }
    push()
  }
  return out.length ? out : ['']
}

/** Bounding box of a wrapped text block (top-left origin; y is the baseline of line 1). */
export function textBox(text: string, x: number, y: number, size: number) {
  const lines = wrapBoardText(text, x, size)
  const w = Math.max(20, ...lines.map((l) => textWidth(l, size)))
  const h = size + (lines.length - 1) * size * LINE_H
  return { x: x - 4, y: y - size, w: w + 8, h: h + 6, lines }
}
