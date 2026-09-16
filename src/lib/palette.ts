/** Stable pigment colors for drawing and pedagogical diagrams, not UI chrome. */
export const INK = {
  black: '#000000', graphite: '#5F5E5A', red: '#C0584A', orange: '#E0843D',
  gold: '#C99A2E', leaf: '#5BA152', green: '#2E7D5B', steelBlue: '#3A6FA5',
  blue: '#3454B4', violet: '#7B5EC4', magenta: '#B5489B', brown: '#8B5E3C',
  white: '#FFFFFF', gray: '#9AA0A6',
} as const

export const INK_PALETTE: string[] = Object.values(INK)

export const WORKSHOP_INKS = [
  [INK.black, 'Black'], [INK.graphite, 'Graphite'], [INK.blue, 'Blue'],
  [INK.steelBlue, 'Steel blue'], [INK.red, 'Red'], [INK.orange, 'Orange'],
  [INK.green, 'Green'], [INK.violet, 'Violet'],
] as const

export const PEDAGOGY = {
  equation: INK.steelBlue,
  force: '#D85A30', pressure: '#185FA5', temperature: '#BA7517',
  voltage: '#BA7517', current: '#185FA5', magneticField: '#7F77DD',
  light: INK.gold, completion: '#37B24D',
} as const
