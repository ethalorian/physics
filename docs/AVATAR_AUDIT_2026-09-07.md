# Avatar audit — September 7, 2026

The SVG foundation is worth keeping. Prioritize reliable saves and purchases, intentional gallery publishing, and art compatibility before expanding the catalog.

## Scope and evidence

Reviewed the avatar builder, composer, account-menu integration, lobby bundle helper, avatar APIs, economy helpers, and admin catalog endpoint. Read the live PhysicsAPP catalog and database metadata without changing production data. Rendered **59 synthetic combinations** using the actual React composer and all **20 live catalog items**, including 40px head previews. The contact sheet contains synthetic avatars, not student portraits.

Live checks: 138 avatar rows, all marked complete/custom; all four avatar tables have RLS enabled and no policies (consistent with server-only access). Ownership and likes have composite primary keys. No triggers were reported on avatar state, ownership, or reward redemptions. Aggregate checks found **zero duplicate avatar charge groups and zero avatar charges missing ownership**; the purchase findings below are failure risks, not evidence that students have already lost XP.

This is a code/database/render audit, not an authenticated browser walkthrough. Mobile and request-race findings are established from code paths; production race requests were not sent.

## Priority fixes

### P1 — Make purchasing atomic and idempotent

Source: `src/app/api/avatar/purchase/route.ts:48–73`.

Balance check, redemption insert, and ownership insert are separate operations. Two simultaneous requests can both pass the balance/ownership checks. For the same item, both can charge before the ownership primary key rejects one grant. For different items, both can spend the same available balance. A failed ownership insert leaves an already-written charge.

Use one database transaction for eligibility, balance validation, charge, and grant, serialized per student. Use an idempotency key and return an existing purchase on retry. All competing reward-spending paths must participate in the same locking/balance contract. Preserve the current earning rules when moving validation into the transaction.

Verify: simultaneous same-item purchases, competing different-item purchases, insufficient funds, retry after an uncertain response, and forced grant failure. Expect one charge per item, no overspend, and complete rollback on failure.

### P1 — Prevent lost edits and acknowledge save failures

Sources: `src/app/avatar/page.tsx:83–97`, `src/app/api/avatar/traits/route.ts:28–37`, `src/app/api/avatar/equip/route.ts:33–43`.

Every trait click launches an independent request. Each endpoint reads an existing JSON object and replaces it with a merged object. Two requests starting from the same state can overwrite separate edits; rapid changes to one trait can arrive out of order. The optimistic buffer keeps showing the chosen value even if saving fails. Equipping different slots has the same lost-update pattern.

Queue/coalesce client edits and use atomic JSON patches with a revision check on the server. Show Saving / Saved / Could not save, preserve drafts, and offer retry. Flush pending changes before leaving the builder.

Verify with delayed and reordered responses, offline saves, and concurrent edits to two traits or slots.

### P1 — Separate draft, completion, and gallery publication

Sources: `src/app/api/avatar/traits/route.ts:37`, `src/app/api/avatar/gallery/route.ts:21–36`, `src/app/avatar/page.tsx:334,522`.

The first trait edit sets setup_completed and use_custom_avatar. The gallery includes every completed avatar, with no class/enrollment scope or visibility filter, and falls back to the roster name. Authentication alone permits gallery access. Meanwhile the reusable gallery empty-state text mentions a “Show my Mii” control that is absent from this flow.

Finish saves only the alias. A student who accepts all defaults without clicking a trait can finish without creating an avatar. The wizard also highlights options[0] rather than DEFAULT_TRAITS: it can indicate pale skin or black hair while the actual preview uses tan skin and brown hair.

Create an explicit completion operation that saves the complete validated trait set and awaits pending edits. Keep gallery visibility separate and explain the audience/name before publication. Decide whether the intended audience is class or school; enforce that audience in both gallery and like endpoints. Use DEFAULT_TRAITS consistently for selected tiles.

### P2 — Handle errors consistently

Sources: avatar page load/equip/purchase handlers; gallery and like endpoints.

Initial loading accepts any JSON as a Bundle; an error response can lead to accessing missing catalog data. A network failure can leave an indefinite loading screen. Most read errors become empty state. Equip and failed purchases give no explanation. Like insert/delete errors are ignored while the response reports success.

Validate response status and shape; distinguish empty, loading, and error states. Return safe actionable errors. Make likes explicit desired-state operations rather than non-idempotent toggles; use functional client state updates and per-target pending state. Validate that the target is visible to the caller.

### P2 — Harden render inputs and catalog contracts

Sources: `src/lib/avatar/types.ts:99`, `src/components/avatar/Avatar.tsx:133–147`.

withDefaults only spreads values; it does not validate them. Direct render probes confirmed crashes for invalid face, null skin, and invalid hair color. Normalize every trait against TRAIT_OPTIONS when reading/rendering, and reject malformed write payloads. Check item.slot against the equipped slot in the renderer too.

The catalog endpoint prioritizes mastery gates; purchase prioritizes price. No live item currently has both fields, but the database permits that inconsistent configuration and negative prices. Add a documented eligibility contract and matching constraints; use the shared mastery calculation.

Raw SVG is inserted into the DOM. Current server-only tables reduce the write surface, and no malicious content was established. Add an SVG allowlist at import/publication, reject scripts/event handlers/external references/foreignObject, and namespace SVG IDs when introduced. Either remove unused z_order or define how it interacts with the fixed slot order.

Define whether disabled means “not sold” or “not rendered”: the wardrobe excludes disabled items, while other avatar bundles still resolve equipped disabled items.

## Artwork findings and proposals

See [rendered contact sheet](avatar-audit-contact-sheet-2026-09-07.png).

1. **Fix headwear compatibility first.** Afro and spiky hair visibly protrude through football helmets, space helmets, and Spider-Man masks. Add item metadata for hair treatment: preserve, tuck, or hide, with separate front/back masks and face-shape anchors. Full masks should control ears, hair, and neck coverage. Preserve the saved hairstyle when equipment is removed.

2. **Fix clipping with measured bounds.** Heart-face hair is stretched vertically by 1.19; its afro and spikes exceed the full frame. The heart spiky tip maps to roughly y=-91.7, above the full crop top of -82. Compact previews flatten several hairstyles. Give full portraits safe bounds and compact portraits an intentional scale/offset. Test all four faces and all 21 hairstyles in all three crops; check actual circular account-menu clipping too.

3. **Improve dark-tone facial definition.** Black brows, eyes, and mouth become difficult to distinguish on the darkest tone, especially at 40px. Keep skin colors stable while using adaptive feature colors, subtle highlights, and slightly stronger compact-size feature strokes. Review on light and dark surfaces.

4. **Give clothing a clearer silhouette.** The long narrow neck and small detached-looking shoulder block make portraits feel unfinished. Raise shoulders, shorten the apparent neck, and add a simple collar. The white lab coat almost disappears against white cards: outline the entire coat, including shoulders, and use a soft neutral fill with clear lapels. Its current outlined rectangle does not define the whole garment.

5. **Refine textured hair.** The afro reads as large perimeter circles; twists read as radial sticks; braids are hard to distinguish at small size. Use fewer intentional irregular masses, tapered grouped twists, and stronger plait silhouettes. Preserve stylistic simplicity. Give the hijab fabric color independent of hair color and a cloth-specific fold/edge treatment.

6. **Make accessories coordinate.** Facial hair is hardcoded brown and does not follow hair color. Add hair-color tokens or an independent facial-hair color. Glasses use fixed eye centers while eye spacing changes; fit lens/bridge geometry to eye anchors. Give small pins stronger silhouettes and contrast against shirt colors.

7. **Design for actual display size.** Fine web lines, freckles, and pin details largely vanish at compact size. Use detail tiers for portraits versus thumbnails. Night sky loses its identifying moon in the head crop; backgrounds need a recognizable compact treatment.

## Product improvements

- Replace the fixed two-column builder with a single-column mobile layout and wrapping/scrolling tabs. The present 240px minimum preview column plus gap leaves too little room for the editor on phones.
- Add “Try on” using the student's own traits and existing outfit before purchasing. Current item cards use the default avatar, hiding fit/color conflicts.
- Show the actual mastery target, current progress, and required level instead of “Master a skill to unlock.”
- Reuse one gallery implementation; two currently exist and can diverge.
- Use accessible selected-state semantics for tabs and likes, announce save/purchase results, and avoid repeating “Student avatar” for every decorative preview.
- Consider private appreciation counts or a teacher-controlled hearts setting. Alphabetical ordering avoids a ranked wall, but visible totals still invite comparison.
- Offer a few editable starting looks and outfit presets after reliability fixes. Keep identity options free. Expand the current two body options before adding more tiny detail controls.

## Suggested implementation order

1. Transactional purchasing, queued/revisioned saving, and explicit completion/publication.
2. Error states, mobile layout, own-avatar try-on, and meaningful unlock guidance.
3. Headwear masking, measured crops, contrast, and clothing redraw.
4. Hair/fabric refinement, color-aware accessories, and additional outfits.

Use the current renderer to generate repeatable contact sheets directly from versioned catalog artwork. Add targeted transaction/concurrency tests and an artwork matrix. Existing handwritten preview HTML duplicates older artwork and should not be the regression source of truth.

