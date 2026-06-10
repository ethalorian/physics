// Sprite library for "The Measure of All Things" — warm historical palette.
// Each sprite: string-map frames + palette. '.' and ' ' are transparent.
// Maps are intentionally small (12–30 px) and scaled up crisply by PixelSprite.

import type { SpriteDef } from './pixel'

// Shared warm-historical colors
const ink = '#3a2a1a'
const brown = '#7a5230'
const dbrown = '#54381f'
const tan = '#c8924f'
const cream = '#f0e2c0'
const white = '#faf6ec'
const red = '#a93226'
const dred = '#7b241c'
const gold = '#e9b44c'
const green = '#5d7c3f'
const dgreen = '#3e5429'
const blue = '#3c5a78'
const grey = '#9aa2ad'
const lgrey = '#d3d8de'
const skin = '#e0b083'
const water = '#7ec3d8'

/* --------------------------------- ambient -------------------------------- */

export const CLOUD: SpriteDef = {
  frames: [[
    '...wwww....',
    '.wwwwwwww..',
    'wwwwwwwwwww',
    '..wwwwww...',
  ]],
  palette: { w: white },
}

export const HILL_TREE: SpriteDef = {
  frames: [[
    '....gg....',
    '...gggg...',
    '..gggggg..',
    '.gGgggGgg.',
    '..gGggGg..',
    '....bb....',
    '....bb....',
  ]],
  palette: { g: green, G: dgreen, b: dbrown },
}

// Row of period townhouses; windows lit via palette swap (day vs evening).
const TOWN_MAP = [
  '...bb......bb.......bb....',
  '..bbbb....bbbb.....bbbb...',
  '.bbbbbb..bbbbbb...bbbbbb..',
  '.cccccc..cccccc...cccccc..',
  '.c.ww.c..c.ww.c...c.ww.c..',
  '.c.ww.c..c.ww.c...c.ww.c..',
  '.cccccc..cccccc...cccccc..',
  '.c.ww.c..c.ww.c...c.ww.c..',
  '.c.ww.c..cddddc...c.ww.c..',
  '.cccccc..cddddc...cccccc..',
]
export const TOWN_DAY: SpriteDef = {
  frames: [TOWN_MAP],
  palette: { b: brown, c: cream, w: '#b9cdd6', d: dbrown },
}
export const TOWN_EVENING: SpriteDef = {
  frames: [TOWN_MAP],
  palette: { b: dbrown, c: '#d9c39a', w: gold, d: ink },
}

/* ------------------------------- chapter 0 -------------------------------- */

// Market stall with fluttering striped awning (2 frames).
export const STALL: SpriteDef = {
  frames: [
    [
      '.rcrcrcrcrcrcrc.',
      'rcrcrcrcrcrcrcrc',
      'r.c.r.c.r.c.r.c.',
      'b..............b',
      'b..yyy....ggg..b',
      'b..yyy....ggg..b',
      'tttttttttttttttt',
      '.dd..........dd.',
      '.dd..........dd.',
    ],
    [
      '.rcrcrcrcrcrcrc.',
      'rcrcrcrcrcrcrcrc',
      '.c.r.c.r.c.r.c.r',
      'b..............b',
      'b..yyy....ggg..b',
      'b..yyy....ggg..b',
      'tttttttttttttttt',
      '.dd..........dd.',
      '.dd..........dd.',
    ],
  ],
  palette: { r: red, c: cream, b: brown, y: gold, g: green, t: tan, d: dbrown },
  fps: 2,
}

// Merchant pulling a handcart of cloth; legs + wheel spokes alternate (2 frames).
export const MERCHANT_CART: SpriteDef = {
  frames: [
    [
      '..bb................',
      '..ss................',
      '..ss....cccccccccc..',
      '.sss....crrrrrrrrc..',
      '..tt....cccccccccc..',
      '..tt...ttttttttttt..',
      '..t.t....oo....oo...',
      '..t..t..o..o..o..o..',
      '........o..o..o..o..',
      '.........oo....oo...',
    ],
    [
      '..bb................',
      '..ss................',
      '..ss....cccccccccc..',
      '.sss....crrrrrrrrc..',
      '..tt....cccccccccc..',
      '..tt...ttttttttttt..',
      '..tt.....oo....oo...',
      '..t.t...oo.o..oo.o..',
      '........o.oo..o.oo..',
      '.........oo....oo...',
    ],
  ],
  palette: { b: dbrown, s: skin, t: tan, c: cream, r: red, o: dbrown },
  fps: 3,
}

// Waving tricolor flag on a pole (3 frames).
export const TRICOLOR: SpriteDef = {
  frames: [
    [
      'p.bbwwrr..',
      'p.bbwwrr..',
      'p.bbwwrrr.',
      'p.bbwwrr..',
      'p.bbwwr...',
      'p.........',
      'p.........',
      'p.........',
    ],
    [
      'p.bbwwr...',
      'p.bbwwrr..',
      'p.bbwwrr..',
      'p.bbwwrrr.',
      'p.bbwwrr..',
      'p.........',
      'p.........',
      'p.........',
    ],
    [
      'p.bbwwrr..',
      'p.bbwwrrr.',
      'p.bbwwrr..',
      'p.bbwwr...',
      'p.bbwwrr..',
      'p.........',
      'p.........',
      'p.........',
    ],
  ],
  palette: { p: dbrown, b: blue, w: white, r: red },
  fps: 4,
}

/* ------------------------------- chapter 1 -------------------------------- */

// Surveyor at a tripod telescope; the scope sweeps between two angles.
export const SURVEYOR: SpriteDef = {
  frames: [
    [
      '..........LL..',
      '........LL....',
      '..hh..LL......',
      '..ss.kk.......',
      '..sskk........',
      '...kk.........',
      '..k..k........',
      '..k...k.......',
      '.k.....k......',
      '.k......k.....',
      'k........k....',
    ],
    [
      '..............',
      '......LLLL....',
      '..hhLL........',
      '..ss.kk.......',
      '..sskk........',
      '...kk.........',
      '..k..k........',
      '..k...k.......',
      '.k.....k......',
      '.k......k.....',
      'k........k....',
    ],
  ],
  palette: { L: grey, h: dbrown, s: skin, k: ink },
  fps: 1,
}

export const MOUNTAIN: SpriteDef = {
  frames: [[
    '.........ww..........',
    '........wwww.........',
    '.......gwwwwg........',
    '......ggggggggg......',
    '.....gggggGGggg......',
    '....gggGGggggggg.....',
    '...ggggggggGGgggg....',
    '..gggGGgggggggggggg..',
    '.gggggggggGGggggggggg',
  ]],
  palette: { w: white, g: '#7d8a6a', G: '#5f6c4e' },
}

// Platinum meter bar on a velvet cushion, sparkle sweeps across (3 frames).
export const PLATINUM_BAR: SpriteDef = {
  frames: [
    [
      '.wllllllllllll.',
      '.lggggggggggggl',
      '.llllllllllll..',
      'rrrrrrrrrrrrrrr',
      '.rrrrrrrrrrrrr.',
    ],
    [
      '.llllllwlllllll',
      '.lggggggggggggl',
      '.llllllllllll..',
      'rrrrrrrrrrrrrrr',
      '.rrrrrrrrrrrrr.',
    ],
    [
      '.lllllllllllllw',
      '.lggggggggggggl',
      '.llllllllllll..',
      'rrrrrrrrrrrrrrr',
      '.rrrrrrrrrrrrr.',
    ],
  ],
  palette: { l: lgrey, g: grey, w: white, r: dred },
  fps: 2,
}

/* ------------------------------- chapter 2 -------------------------------- */

// Montgolfier-style hot-air balloon (period-correct: 1783!). Single frame;
// motion comes from the bob animation.
export const BALLOON: SpriteDef = {
  frames: [[
    '....ryyryyr....',
    '..rryyryyryyr..',
    '.ryyrryyrryyyr.',
    '.ryyrryyrryyyr.',
    'rryyrryyrryyyrr',
    'rryyrryyrryyyrr',
    '.ryyrryyrryyyr.',
    '.ryyrryyrryyyr.',
    '..rryyryyryyr..',
    '...k.......k...',
    '....k.....k....',
    '....bbbbbbb....',
    '....bbbbbbb....',
  ]],
  palette: { r: red, y: gold, k: ink, b: brown },
}

/* ------------------------------- chapter 3 -------------------------------- */

// Bubbling flask (3 frames of rising bubbles).
export const FLASK: SpriteDef = {
  frames: [
    [
      '....gg....',
      '....gg....',
      '...g..g...',
      '..g....g..',
      '.g..o...g.',
      '.gwwwwwwg.',
      '.gwwwwwwg.',
      '..gggggg..',
    ],
    [
      '....gg....',
      '...og.....',
      '...g..g...',
      '..g..o.g..',
      '.g......g.',
      '.gwwwwwwg.',
      '.gwwwwwwg.',
      '..gggggg..',
    ],
    [
      '..o.gg....',
      '....gg....',
      '...g.og...',
      '..g....g..',
      '.g......g.',
      '.gwwwwwwg.',
      '.gwwwwwwg.',
      '..gggggg..',
    ],
  ],
  palette: { g: '#8aa39b', w: water, o: '#cfe8f0' },
  fps: 3,
}

// Balance scale: tilted vs level (2 frames) — it settles as the story does.
export const BALANCE_TILT: SpriteDef = {
  frames: [
    [
      '..............y...',
      '.........yyyyyy...',
      '...yyyyyy....t....',
      '..y......t...t....',
      '.t.t.....t..ttt...',
      'ttttt....t........',
      '.........t........',
      '.......ttttt......',
    ],
  ],
  palette: { y: gold, t: dbrown },
}
export const BALANCE_LEVEL: SpriteDef = {
  frames: [
    [
      '..................',
      '...yyyyyyyyyyyy...',
      '..y......t.....y..',
      '.t.t.....t....t.t.',
      'ttttt....t...ttttt',
      '.........t........',
      '.........t........',
      '.......ttttt......',
    ],
  ],
  palette: { y: gold, t: dbrown },
}

// The liter cube: empty wireframe vs filled with shimmering water (2 frames).
export const CUBE_EMPTY: SpriteDef = {
  frames: [[
    'tttttttttt',
    't........t',
    't........t',
    't........t',
    't........t',
    't........t',
    't........t',
    'tttttttttt',
  ]],
  palette: { t: dbrown },
}
export const CUBE_FULL: SpriteDef = {
  frames: [
    [
      'tttttttttt',
      'twwWwwwwwt',
      'twwwwwWwwt',
      'twwwwwwwwt',
      'twWwwwwwwt',
      'twwwwwwWwt',
      'twwwwwwwwt',
      'tttttttttt',
    ],
    [
      'tttttttttt',
      'twwwwwWwwt',
      'twWwwwwwwt',
      'twwwwwwwwt',
      'twwwwwWwwt',
      'twwwwwwwwt',
      'twWwwwwwwt',
      'tttttttttt',
    ],
  ],
  palette: { t: dbrown, w: water, W: '#a9dbe9' },
  fps: 2,
}

/* ------------------------------- chapter 4 -------------------------------- */

// Standing clock case; the pendulum is animated separately with CSS sway.
export const CLOCK_CASE: SpriteDef = {
  frames: [[
    '...bbbbbb...',
    '..bbbbbbbb..',
    '.bbwwwwwwbb.',
    '.bw..ww..wb.',
    '.bw.ww.w.wb.',
    '.bw..ww..wb.',
    '.bbwwwwwwbb.',
    '.bb......bb.',
    '.bb......bb.',
    '.bb......bb.',
    '.bb......bb.',
    '.bb......bb.',
    '.bbbbbbbbbb.',
    'bbbbbbbbbbbb',
  ]],
  palette: { b: dbrown, w: cream },
}

export const PENDULUM: SpriteDef = {
  frames: [[
    '.t.',
    '.t.',
    '.t.',
    '.t.',
    'yyy',
    'yyy',
  ]],
  palette: { t: tan, y: gold },
}

// Courier on horseback, 2-frame gallop.
export const COURIER: SpriteDef = {
  frames: [
    [
      '..........ss..........',
      '.........sbb...hh.....',
      '..bbbbbbbbbb...hhh....',
      '.bhhhhhhhhhhhhhhh.....',
      '.bhhhhhhhhhhhhhh......',
      '..hh..hh...hh..hh.....',
      '.hh....hh.hh....hh....',
      'hh......hhh......hh...',
    ],
    [
      '..........ss..........',
      '.........sbb...hh.....',
      '..bbbbbbbbbb...hhh....',
      '.bhhhhhhhhhhhhhhh.....',
      '.bhhhhhhhhhhhhhh......',
      '...hhh.hh..hhh.hh.....',
      '....hhhh....hhhh......',
      '....hh.......hh.......',
    ],
  ],
  palette: { s: skin, b: blue, h: '#6b4a2b' },
  fps: 6,
}

/* ------------------------------- chapter 5 -------------------------------- */

// National Archives facade: pediment, four columns, golden door.
export const ARCHIVES: SpriteDef = {
  frames: [[
    '..............t..............',
    '.........ttttttttttt.........',
    '.....ttttttttttttttttttt.....',
    '.ttttttttttttttttttttttttttt.',
    '.ccccccccccccccccccccccccccc.',
    '..cc...cc....cc....cc...cc...',
    '..cc...cc....cc....cc...cc...',
    '..cc...cc.gggggg...cc...cc...',
    '..cc...cc.g.yy.g...cc...cc...',
    '..cc...cc.g.yy.g...cc...cc...',
    '..cc...cc.g.yy.g...cc...cc...',
    '.ccccccccccccccccccccccccccc.',
    'ttttttttttttttttttttttttttttt',
  ]],
  palette: { t: tan, c: cream, g: dbrown, y: gold },
}

// Firework burst, 3 expanding frames.
export const FIREWORK: SpriteDef = {
  frames: [
    [
      '.....',
      '..y..',
      '.yYy.',
      '..y..',
      '.....',
    ],
    [
      '..r..',
      '.y.y.',
      'r.Y.r',
      '.y.y.',
      '..r..',
    ],
    [
      'r...r',
      '.y.y.',
      '..*..',
      '.y.y.',
      'r...r',
    ],
  ],
  palette: { y: gold, Y: white, r: red, '*': '#caa84a' },
  fps: 4,
}

// Quill writing at a desk (inspector at work) — nib bobs (2 frames).
export const QUILL_DESK: SpriteDef = {
  frames: [
    [
      '......w.....',
      '.....ww.....',
      '....ww......',
      '...ww.......',
      '..cccccc....',
      '.cccccccc...',
      'tttttttttttt',
      '.dd......dd.',
    ],
    [
      '.....w......',
      '....ww......',
      '....ww......',
      '...ww.......',
      '..cccccc....',
      '.cccccccc...',
      'tttttttttttt',
      '.dd......dd.',
    ],
  ],
  palette: { w: white, c: cream, t: dbrown, d: ink },
  fps: 2,
}
