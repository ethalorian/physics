# Styling audit implementation — 2026-09-15

Implemented the supplied audit in the classroom app. Decisions: 16px cards, 12px buttons/inputs, solid in-flow cards, and semantic UI colors for the measurement lessons. Drawing pigments and canvas artwork retain their separate purpose.

## Changes

- **P0:** Replaced default Tailwind palette utilities with semantic colors; rebuilt Toast with theme-aware surfaces, accessible dismissal, and status/alert roles. Applied a monotonic radius scale and removed numeric inline radii. Rewrote markdown colors, math surfaces, shadows, tables, and labeled admonitions without the legacy palette. Removed the development button gradient/pulse, reward chrome glow, and unnecessary theme-token fallbacks.
- **P1:** Removed unused Apple/gold/glass utilities and migrated their remaining consumers, including the design-system preview and daily-math cards. Unified control focus and easing, removed card hover lift, replaced 41 loading indicators with Spinner, consolidated shared game keyframes in `src/styles/arcade.css`, and moved drawing/pedagogical colors into `src/lib/palette.ts`.
- **P2:** Migrated inline UI typography to the type scale, lifted small labels, retained projector sizes with weights capped at 700, replaced half-pixel student borders, tinted dark shadows, and moved all CSS imports ahead of rules.
- **P3:** Added compact Card density and migrated the teaching/command-center consumers; lightened button shadows; removed default Card blur; removed duplicate animation utilities; recalculated browser theme colors from the actual background tokens.

Browser verification found two additional contrast defects: light success text and dark destructive text. Those tokens now meet the tested 4.5:1 small-text threshold. Solid destructive actions use a paired foreground token. Visual review also exposed raw markdown markers in callouts; the renderer now handles titled and untitled callout bodies as markdown.

## Regression prevention

- `npm run audit:styles` runs automatically before builds. It rejects default palette classes outside the documented art directories, numeric inline radii, undersized text, half-pixel borders, black inline shadows, retired utilities, and duplicate loading/game-animation patterns.
- `node scripts/audit-unused-source.cjs --css` checks global class usage with explicit exceptions for generated markdown and KaTeX selectors. All 35 remaining global classes are accounted for.
- `npm run test:styles-browser` checks real components with local fixtures: light/dark contrast, desktop/mobile overflow, radii and compact density, keyboard focus, notification dismissal, Sheet interactions, loaded KaTeX fonts and display math, callout rendering, lesson feedback, vocabulary matching, and reduced motion. Set `STYLING_PRODUCTION_CSS=1` after a build to use its generated CSS and hashed math fonts.

`docs/DESIGN_SYSTEM.md` reflects the new primitives, scales, and shared assets.

## Validation

- TypeScript check and optimized Next.js build.
- Style audit, global CSS usage audit, and `git diff --check`.
- Existing browser suites for student home, admin home, student math input, and projected lesson blocks.
- Dedicated styling browser suite, including visual inspection of light desktop and dark mobile captures; repeated successfully against the exact production CSS and hashed KaTeX fonts.
- `next start` smoke check: production home and sign-in render, Inter fonts load, theme metadata is present, and no browser runtime errors occur.

Browser flow tests use local API fixtures. The broader unused-source report identifies three candidate components; they were retained because this audit does not establish that their external/runtime consumers are absent.
