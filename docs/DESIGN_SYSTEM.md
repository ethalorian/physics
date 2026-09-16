# Antocci Physics — Design System

The single source of truth for the app's visual language. The reference implementation is the prototype in `docs/ux-rebuild-prototype.html` (Home + Lesson). Every new screen should be built from the foundations and components here, not hand-rolled.

---

## 1. Principles

1. **Calm over loud.** Stickiness here means *habit + mastery* — the pull to return and learn — not maximum minutes. No idle shine, no casino pulses. The reward is visible enough to bring a student back tomorrow, restrained enough not to feel manipulative.
2. **Apple restraint.** Hierarchy comes from weight, size, and space — not decoration. Two weights do most of the work (400 / 600); 700 only for display. No decorative emoji.
3. **Color carries meaning.** Brand indigo for navigation/identity, gold for *genuine* reward only, semantic colors (success/destructive) only where they mean success/danger. Never color as decoration.
4. **One system, hardware-aware.** Students are on cheap Chromebook LCDs; staff are on Macs. Same tokens and components everywhere, with one scoped refinement (see §7).
5. **Accessible by default.** WCAG AA contrast, `prefers-reduced-motion` honored globally, color never the only signal.

---

## 2. Foundations

### Tokens (oklch, defined in `globals.css`)
All color is a CSS variable. **Never hardcode hex** except for canvas/illustration/game art.

| Token | Meaning |
|---|---|
| `--background` / `--foreground` | page surface / primary text |
| `--card` / `--card-foreground` | raised surface / its text |
| `--primary` / `--primary-foreground` | brand indigo — navigation, primary actions, "in progress" |
| `--secondary`, `--muted`, `--accent` | neutral fills/tints |
| `--muted-foreground` | secondary text, captions |
| `--reward` / `--reward-foreground` | **gold — genuine reward only** (XP, store, achievement) |
| `--success` | positive/complete (sage green) |
| `--destructive` | error/danger/overdue |
| `--border` / `--input` | hairlines, field borders |
| `--viz-up` / `--viz-down` / `--viz-faint` / `--viz-*-surface` | data-viz (growth charts), light+dark |

Use the Tailwind utilities that map to these: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-success/15`, etc. Opacity modifiers (`/10`, `/15`) are how you make soft tints.

### Type scale (`globals.css`, use the classes)
One ramp. Tracking tightens as size grows (the Apple feel). No off-scale sizes.

| Class | Size / weight | Use |
|---|---|---|
| `.text-display` | 32–48 / 700 | page hero |
| `.text-title-1` | 28 / 700 | section title |
| `.text-title-2` | 22 / 600 | card / lane title |
| `.text-title-3` | 18 / 600 | sub-title |
| `.text-body` | 16 / 400 | body |
| `.text-callout` | 15 / 500 | emphasis body |
| `.text-caption` | 13 / 500 | metadata |
| `.text-overline` | 11 / 700, uppercase, tracked | section labels |

### Radius
Use the monotonic radius scale: `xs` = 4px, `sm` = 8px, `md` = 12px, `lg` = 16px (`--radius`), `xl` = 20px, `2xl` = 24px, `3xl` = 32px. Cards = `lg`; buttons and inputs = `md`; small buttons and chips = `sm`; pills = `full`. Inline styles use `var(--radius-*)`, never numeric radii.

### Elevation
Cards use `.card-elevation`: one primary-tinted shadow in both themes, with a shadow-only hover. In-flow cards are solid `bg-card`; reserve translucent glass for overlays. Primary buttons use only a small primary-tinted shadow.

### Motion
- Transitions: `--ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`), ~200–500ms. Use `ease-out-expo` in classes and `var(--ease-out-expo)` in CSS. Calm, single-step.
- Motion explains a transition (where something came from/went) — it never decorates an idle element.
- **No infinite idle animation** except loading skeletons (`animate-pulse`) and a single wayfinding "you-are-here" cue. Everything is disabled under `prefers-reduced-motion`.

---

## 3. Color usage rules

- **Indigo (`primary`)** — identity, navigation, primary buttons, "in progress", current step.
- **Gold (`reward`)** — *only* genuine reward: XP, store, achievement stars. Solid fill is reserved for this. Never decorative.
- **Sage (`success`)** — completion, correct, "all caught up".
- **Destructive** — error, overdue, delete.
- **Semantic exceptions that stay non-brand:** pass/fail status, medals (gold/silver/bronze), difficulty levels (easy/med/hard), game art. These are *meaning*, not brand.

---

## 4. Components

### shadcn primitives (`@/components/ui`)
- `Card` — solid surface, `card-elevation`, solid `--border`. Use `density="compact"` for 16px padding and 12px gaps; its header/content/footer remove their extra horizontal inset.
- `Button` — 12px radius (8px small), brand variants, focus ring, active scale. No gradient fills.
- `Input` / `Textarea` — solid border, 44px touch target, 12px radius. Shared controls use `focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2` with a background offset.
- `Spinner` — `<Spinner size="sm|md|lg" />`, with `role="status"` and an accessible loading label. Use it for every loading state.
- `Badge`, `Dialog`, `Select`, etc. — standard.

### Kit primitives (`@/components/ds`)
```tsx
import { SectionLabel, StatPill, ProgressTrack } from '@/components/ds'

<SectionLabel accent="var(--primary)">Continue your journey</SectionLabel>
<StatPill tone="reward">★ 1,240 XP</StatPill>
<StatPill tone="success">7 of 11 fluent</StatPill>
<ProgressTrack value={62} aria-label="Lesson progress" />
```
- **SectionLabel** — uppercase overline + accent bar; titles every lane/section.
- **StatPill** — status/stat chip; tone (`reward`/`success`/`primary`/`muted`) carries meaning. Reward is the only solid fill.
- **ProgressTrack** — slim primary progress bar.

---

## 5. Patterns (build from snippets until reused, then promote to a component)

### Lane layout (the Home/dashboard rhythm)
A page is a stack of lanes: `SectionLabel` → content card. Generous vertical rhythm (`mt-8` between lanes).

### Hero / "Continue" card
A `Card` with a soft radial primary tint top-right, a `.text-overline` eyebrow, a `.text-title-2` title, a primary `Button`, and a `ProgressTrack`.

### Sequence chips (stepped journey)
Row of nodes: done = solid `primary` with ✓, current = solid `reward` (the one wayfinding accent), todo = dashed `--border`. Connector bars between.

### Solve box (lessons — GIVEN / EQUATION / WORK / ANSWER)
Four-row grid, each row a colored letter chip + label + value:
G = `--viz-up` · E = `--primary` · W = `--muted-foreground` · A = `--reward`. One radius, hairline dividers.

---

## 6. Building a new screen — recipe

1. Wrap content in the page container (the root layout already provides it).
2. Title sections with `SectionLabel`.
3. Put bounded content in `Card`.
4. Use the type-scale classes for all text; never inline an off-scale `fontSize`.
5. Use token utilities for all color; no hex.
6. Actions are `Button`; stats are `StatPill`; ratios are `ProgressTrack`.
7. Motion only to explain a transition. Nothing idle.
8. Check contrast holds on a cheap panel (borders, captions) — students are the constraint.

---

## 7. Hardware surfaces

Same system, one scoped refinement:

- **Students (default, everywhere)** — Chromebook-hardened: borders ≥1.9:1, no transparent edges, light mode default, contrast verified WCAG AA.
- **Staff (`/admin`, via `.surface-refined` in the admin layout)** — Macs: finer 1.38:1 hairlines, softer shadow. Inherits palette/type/components unchanged; dark mode is fully viable here.

---

## 8. Do / Don't

| Do | Don't |
|---|---|
| Use `var(--token)` / token utilities | Hardcode hex (outside canvas/games) |
| Type-scale classes | Inline ad-hoc `fontSize` |
| Gold for real reward only | Gold as decoration |
| Weight + space for hierarchy | Decorative emoji, gradient clip-text |
| Motion to explain transitions | Idle pulses / shine / glow |
| One `Card`, one `Button` | Bespoke cards/gradient buttons |
| Semantic color where it means something | Brand color over a pass/fail signal |

---

*Reference implementation: `docs/ux-rebuild-prototype.html`. Compliance history: `docs/UI_UX_VISUAL_AUDIT.md`.*

## 9. Enforcement and shared assets

`npm run audit:styles` runs before production builds. It rejects default Tailwind palette classes outside avatar/arcade artwork, numeric inline radii, sub-scale text, half-pixel borders, black inline shadows, legacy utilities, and duplicate loading indicators. `node scripts/audit-unused-source.cjs --css` checks global class usage, with documented exceptions for generated markdown/KaTeX classes.

Measurement simulation text and controls use semantic UI tokens. Canvas and pigment colors stay stable in `src/lib/palette.ts` (`INK_PALETTE`, `WORKSHOP_INKS`, `PEDAGOGY`). Shared game feedback keyframes live in `src/styles/arcade.css`, imported once before rule blocks. Projected teaching content retains its own size scale and caps font weight at 700.
