/** All advertised deck/clicker navigation writes to the same live session. */
export function presentationKey(key: string, current: number, total: number): number | 'blank' | 'timer' | null {
  if (key.toLowerCase() === 'b') return 'blank'
  if (key.toLowerCase() === 't') return 'timer'
  let index: number
  if (['ArrowRight','PageDown',' ','Spacebar'].includes(key)) index = current + 1
  else if (['ArrowLeft','PageUp'].includes(key)) index = current - 1
  else if (['Home','r','R'].includes(key)) index = 0
  else if (key === 'End') index = total - 1
  else if (/^[0-9]$/.test(key)) index = key === '0' ? 9 : Number(key) - 1
  else return null
  return Math.max(0, Math.min(total - 1, index))
}

/** Branching openings rejoin the individual check instead of teaching all three. */
export function presentationStep(slides: {next?: number; prev?: number}[], current: number, direction: 'next'|'prev') {
  return slides[current]?.[direction] ?? Math.max(0,Math.min(slides.length-1,current+(direction==='next'?1:-1)))
}
