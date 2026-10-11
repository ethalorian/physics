# Dead Center — material layout practice

Built as the third Arcade → Workshop activity, at `/arcade/centerpoint`. The standalone game is `/games/centerpoint/index.html`. It follows Tape Workshop and Cut & Fit with twelve marking jobs for carpentry, plumbing, and electrical students.

## Practice benches

- **Center a length:** halve the overall length and mark a transverse halfway line. This is explicitly a line along the stock, not the center point of its face.
- **Center a face:** halve both dimensions of a rectangular face; mark X from the left edge and Y down from the top. Both coordinates must be correct. After success, diagonals provide a visual check.
- **Between two marks:** find the gap, halve it, and add the first mark's offset to express the midpoint from the left end. These jobs deliberately distinguish the center of a gap from the center of the whole stock.

Four jobs per bench; the full workshop contains all twelve. Five sets cycle through quarter-inch dimension changes. The illustrated materials include timber, panels, tube, conduit, templates, and mounting plates. All measurements are inches; the advanced jobs require thirty-seconds when halving sixteenths.

## Interaction and teaching

Students enter fractions or exact decimals, or tap the material to position a mark. Inputs and arrow controls allow exact 1/32-inch adjustments; Shift plus an arrow moves 1/4 inch. Clicking is subject to screen-pixel precision, so exact inputs and fine adjustments remain available. The game never accepts a near miss as an exact center or silently rounds a typed value.

Checking compares the distances on both sides and, for faces, above and below. Wrong answers show the direction and amount of correction. Worked hints, a short method guide, and a report with independent/assisted results support practice. A first-check center without hints earns ten local practice points; a corrected or hinted job earns five. Completed marks lock to prevent duplicate awards. Students can retry just the jobs completed with help.

Drawings use labeled reference edges, overall and gap dimensions, arrowheads and extension lines, material outlines, layout marks, and title blocks. Enlarged drawings use a native dialog with keyboard closing and focus restoration. Mobile drawings pan horizontally to retain readable lettering. Written dimensions control; the drawings are not to scale.

Progress lasts for the current visit. A bench change or new dimension set resets the session. The game has no API calls, XP awards, leaderboard, database changes, or student-record writes.

## First-set answer key

| Job | X from left end/edge | Y down from top |
| --- | --- | --- |
| L1 | 9 in | — |
| L2 | 7 1/2 in | — |
| L3 | 4 3/4 in | — |
| L4 | 6 7/8 in | — |
| F1 | 6 in | 4 in |
| F2 | 4 3/4 in | 2 3/4 in |
| F3 | 3 5/8 in | 2 3/8 in |
| F4 | 2 9/16 in | 1 11/16 in |
| M1 | 11 in | — |
| M2 | 9 1/4 in | — |
| M3 | 10 7/8 in | — |
| M4 | 7 1/32 in | — |

## Verification and preview

- `node scripts/test-centerpoint.cjs`: twelve independent answer keys, exact fractions and decimals, invalid inputs, wrong-mark direction, two-axis requirements, and all five dimension sets.
- `node scripts/test-centerpoint-browser.cjs`: complete all twelve jobs; incorrect marks and corrections; pointer and keyboard input; stale and duplicate-check protection; hints and reports; targeted retry; dimensions; dialog focus; SVG text bounds; 320–1440 px layouts. No browser errors or game API calls.
- `node scripts/test-arcade-hub-browser.cjs`: three Workshop cards, search, game iframe navigation, a correct mark, return to the Arcade, and existing Arcade regression checks.
- `npm run type-check`, focused ESLint on the two changed Arcade pages, and `npm run audit:styles`.
- Browser evidence: `/private/tmp/centerpoint-verification` and `/private/tmp/arcade-ui-verification`.

Run `node scripts/preview-centerpoint.cjs`, then open `http://127.0.0.1:3187`. Refresh the card with `PREVIEW_ONLY=centerpoint node scripts/capture-arcade-previews.cjs`.

This game is built locally. It has not been deployed to production.
