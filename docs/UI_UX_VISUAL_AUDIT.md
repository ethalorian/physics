# Visual System Audit — Antocci Physics Classroom

**Scope:** the visual layer (color, type, spacing, radius, motion, components) — not flows.
**Lens (agreed with you):** "sticky" = *habit + mastery*, not raw minutes. So this audit rewards **calm hierarchy, restraint, and craft**, and treats casino-style engagement mechanics as costs, not wins. Apple's real stickiness is *trust* and *desire to return*, not time-on-screen.

A note on method, since this is a Socratic project: most of what follows is not opinion. I read your `globals.css`, `tailwind.config.ts`, and `button.tsx`, then grepped the codebase to confirm each claim. Where there's a genuine judgment call, I've left you a question rather than a verdict.

---

## The uncomfortable headline

You asked to make this *more* beautiful. But before adding polish, you have a foundation problem: **a chunk of your existing "Apple" styling does not render at all.** Adding more on top of a broken base is painting over rot. Three confirmed rendering bugs sit underneath everything else, and they cluster on your single most important screen — the lesson.

So the honest sequence is: **fix what's silently broken → remove what fights the calm north star → then polish.** Not the reverse.

---

## Tier 0 — Broken (not aesthetics; these are bugs)

### 0.1 — Your lesson typography references colors that don't exist
Your entire `.markdown-content` block — the reading surface where students actually learn physics — is styled with variables like `var(--deep-plum)`, `var(--royal-purple)`, `var(--lavender)`, `var(--gold)`, `var(--periwinkle)`, `var(--cream)`, `var(--mauve)`.

I grepped the whole `src/` tree. **None of these variables are ever defined.** They are used in ~40 places and declared in zero. In CSS, a property whose value resolves to an undefined custom property becomes invalid at computed-value time and falls back to inherited/initial. Concretely, this means right now:

- Lesson list items, table cells, blockquotes: color falls back, losing intended hierarchy.
- Code blocks (`background: var(--deep-plum)`) → no background.
- KaTeX equation tinting, table-header gradients, every `.gold-*` accent → silently dead.

This is the highest-leverage fix in the entire app. Your core learning screen is running on a stylesheet that half-evaluates.

**Decision:** delete the orphaned palette entirely and re-point `.markdown-content` at your real semantic tokens (`--foreground`, `--primary`, `--muted-foreground`, `--reward` for the gold). One palette, not two.

### 0.2 — `hsl(var(--token))` wraps OKLCH values → invalid color
Your tokens are defined in **OKLCH** (`--primary: oklch(0.55 0.14 295)`). But `tailwind.config.ts` and every hand-written `.apple-*` class wrap them in `hsl()`: `hsl(var(--primary))`. That computes to `hsl(oklch(0.55 0.14 295))`, which is not valid CSS.

Your shadcn `<Button>` (used 309 times) dodges this — it uses Tailwind v4 utilities (`bg-primary`) that read `--color-primary` from your `@theme inline` block, so it renders correctly. But the `.apple-button` / `.apple-card` / `.apple-nav` classes (used 19 times) pull `hsl(var(--primary))` directly. Their backgrounds and colored glows resolve to invalid → transparent/initial. **Your "premium" custom buttons are the broken ones; your default shadcn buttons are fine.**

**Decision:** kill `.apple-button` and friends, standardize on `<Button>`. (More on this in 1.4.)

### 0.3 — Your `tailwind.config.ts` is probably dead
You're on Tailwind **v4** (`@import "tailwindcss"`, `@theme inline`, `@custom-variant`). v4 is CSS-first; a `tailwind.config.ts` is only loaded if a `@config` directive points at it, and your `globals.css` has none. So the config's `container`, `borderRadius`, `fontFamily`, accordion `keyframes`, and the `tailwindcss-animate` plugin are likely **not applied** — and worse, its `hsl(var(--token))` color map (if it ever loads) is the bug in 0.2.

**Decision:** pick one source of truth. Either delete `tailwind.config.ts` and define everything in `@theme`, or add `@config` and reconcile. Right now you have a config file that lies about what's in effect.

---

## Tier 1 — Not Apple (renders fine, fights the north star)

### 1.1 — Emoji are baked into your CSS headings
Every `<h2>` in lesson content gets a 📋 via `content: '📋'`; h3/h4/h5 get ▶ ● ◦. So a section titled "Newton's Second Law" renders as "📋 Newton's Second Law." This is the single most un-Apple thing in the file. Apple's hierarchy comes from **type weight, size, and space** — never decorative glyphs stapled to headings. It also reads as juvenile for a high-school physics audience and can't be themed.

**Decision:** remove all `::before` emoji from headings. Let weight and spacing carry hierarchy.

### 1.2 — Motion is tuned like an arcade, not a calm tool
I count 22 references to looping glow/shine/pulse effects in components, plus CSS for `gold-shine` (infinite), `interactive-badge` pulse-glow (infinite), `apple-glow-pulse` (infinite), `bubble-float` (infinite), shimmer. Continuous, never-resolving motion is the slot-machine signal. It's the exact mechanic your chosen north star ("habit + mastery, *not* maximum minutes") says to dial down — and for 14–18-year-olds, ambient pulsing raises low-grade anxiety.

And the accessibility gap: with this much animation, `prefers-reduced-motion` appears only **twice** in the entire codebase. Motion-sensitive students currently get the full light show.

**Two decisions, one of them yours:**
- (Mine) Wrap all animation in a global `@media (prefers-reduced-motion: reduce)` kill-switch. Non-negotiable.
- (Yours) How much ambient motion stays? Apple uses motion almost exclusively to *explain a transition* (where did this come from, where did it go) — not to decorate idle elements. **Question for you: which of your infinite animations teaches the student something, versus just shines? The ones that only shine are the ones to cut.**

### 1.3 — Corner radius has no single language
`--radius` is `1rem` (16px). But `.apple-card` hardcodes `1.25rem`, mobile overrides it to `0.75rem`, `.apple-input` is `0.75rem`, buttons are fully round (`9999px`), `<Button>` is `rounded-xl`. That's four different corner stories on screens that sit next to each other. Apple's consistency is largely *one* corner radius applied relentlessly.

**Decision:** derive every radius from `--radius` (you already expose `--radius-sm/md/lg/xl`). Cards = `--radius-lg`, inputs = `--radius-md`, pills only where a pill is semantically a pill (e.g. status chips), not for primary buttons.

### 1.4 — Two parallel button systems
309 `<Button>` vs 19 `.apple-button`. Your shadcn `<Button>` is genuinely well-built — semantic tokens, proper focus-visible ring, `active:scale-[0.98]`, sensible sizes. The `.apple-button` adds nothing it does better and is broken (0.2).

**Decision:** delete `.apple-button`/`-secondary`. If you want the rounded-pill look anywhere, add it as a `<Button>` variant so there's one component, one focus behavior, one source of truth.

### 1.5 — 215 hardcoded hex colors in components
`#xxxxxx` literals appear 215 times across `.tsx`. Every one is a value that can't respond to dark mode, can't be re-themed, and quietly drifts from your token palette. This is how a design system rots into "looks slightly different on every screen" — the opposite of the Apple cohesion you're after.

**Decision:** treat hardcoded hex as a lint error. Migrate to tokens; add semantic tokens (e.g. for the vocabulary-game accents) where a real need exists rather than inlining.

---

## Tier 2 — Craft polish (after Tiers 0–1)

- **Type scale as tokens.** You have `.apple-headline/subhead/body/caption` but screens mostly use raw `text-*` utilities, so sizing is ad hoc. Define a real scale (e.g. 12/14/16/20/28/40, line-heights tightening as size grows) and use it everywhere. Tight, consistent type is 80% of why Apple "feels" expensive.
- **Tint your shadows.** All shadows are pure `rgba(0,0,0,…)`. On a lavender surface, black shadows read muddy. Tint them toward your primary hue at low alpha for the "soft, expensive" depth.
- **The gold/reward dial.** Your `--reward` gold is the most aggressive color in the system and it's wired to the most aggressive motion (shine, glow-pulse). Against habit+mastery, gold should mark *genuine* achievement (mastery reached), not ambient UI. **Question for you: is gold currently rewarding the behavior you want repeated, or just decorating the store?**
- **One elevation system.** You have `apple-shadow-sm/​/lg/xl`, `apple-card`, `glass-card`, `apple-lift`, `lesson-card-hover` all describing depth differently. Collapse to one ramp (3–4 steps) so "raised" means one thing.

---

## Suggested order of operations

1. **Tier 0** — define/replace the orphaned palette, un-break `.apple-*`, resolve the config. *This alone visibly upgrades the lesson screen with zero new design.*
2. **Tier 1.1–1.2** — strip heading emoji, add the reduced-motion kill-switch, cut shine-only animations.
3. **Tier 1.3–1.5** — unify radius, retire `.apple-button`, start the hex→token migration.
4. **Tier 2** — type scale, tinted shadows, the gold dial, elevation ramp.

The through-line: **you don't make this feel like Apple by adding more. You get there by deleting the second palette, the duplicate button, the decorative emoji, and the idle shine — until only the hierarchy is left.** Restraint is the feature.

---

## Three questions I deliberately did not answer for you

1. Which infinite animations *teach* a transition vs. merely shine? (drives 1.2)
2. Is gold rewarding the behavior you want repeated, or decorating the store? (drives the reward economy, and ultimately whether this tool builds mastery or compulsion)
3. For a tool used by minors during school: where is your own line between "motivating" and "manipulative"? Your answer sets how hard the engagement layer should push — and I'd argue it's the most important design decision in the product, more than any color.
