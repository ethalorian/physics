# Tape Workshop

Route: `/arcade/tape-measure`; standalone entry: `/games/tape-workshop/index.html`.

The game is free practice with session-only progress. There is no ranked score, XP payout, student-data write, or persistent proficiency claim.

## Learning sequence

A full set has ten work orders across six skills:

1. Identify the value of one graduation by counting **spaces**, not boundary lines.
2. Locate a requested fractional or decimal reading on a magnified scale.
3. Move zero to the material's starting edge, lock the alignment, and read a length.
4. Express the same length as a reduced fraction and decimal (or centimeters and millimeters).
5. Read a material's length in the requested notation.
6. Place a pencil mark for a specified cut length.
7. Read the near and far edges of an object placed at a nonzero mark; subtract end minus start.
8. Repeat locating a mark.
9. Repeat reading a length.
10. Measure from a fractional nonzero start.

The scale explorer is a separate interactive practice surface. Students can highlight tick-height families, move through graduations, and compare equal-length shaded fraction bars. It preserves the current work order when switching activities.

Instruments include halves, quarters, eighths, sixteenths, thirty-seconds, decimal inches, and a centimeter scale with millimeter graduations. All generated edges land exactly on graduations. The game does **not** teach interpolation, uncertainty, or physical calibration; on-screen graphics are not actual-size rulers.

## Feedback and scoring

A first correct answer without help receives 10 points. A completed order after an incorrect answer, hint, field-guide use, or scale-explorer visit receives 5 points and is reported as completed with help. Incorrect answers are retried; there is no time pressure or lives counter. Missing/invalid input and reminders to extend/lock before reading do not count as mathematical mistakes.

Misconception-specific feedback covers counting lines instead of spaces, being one graduation off, treating the numerator as decimal digits, reporting the far-edge position as an offset length, and forgetting centimeter-to-millimeter conversion. The end report groups independent/coached attempts by skill. The targeted practice button repeats each coached task type twice with newly generated measurements.

## Implementation

- `measure.js`: exact integer-tick generation, scale hierarchy, fraction parsing, unit conversion.
- `game.js`: work-order state machine, SVG rendering, keyboard/pointer controls, coaching and report.
- `index.html` / `style.css`: responsive interface with labeled native controls and reduced-motion support.

The case and tape extension share a coordinate system. The near edge of the material is independent of the tape's zero, which makes setup and offset tasks distinct. The magnifier uses the same integer tick positions as the full instrument.

## Verification

Run from the application root:

```sh
node scripts/test-tape-workshop.cjs
node scripts/test-tape-workshop-browser.cjs
```

The browser fixture uses the installed Chromium/Playwright runtime and serves the real static assets on an ephemeral loopback port. It seeds randomness only in the fixture. It checks every work-order type on all seven instruments, notation preferences, common mistakes, duplicate scoring, coaching, targeted practice, explorer interaction, phone layout, keyboard controls, dragging, and reduced motion. It writes preview images to `/private/tmp/tape-workshop-*.png`.
