# Spider-Man artwork refresh

Redrew the existing `spiderman-mask` and `spiderman-suit` catalog artwork and published it in place. Existing owners automatically receive the refreshed appearance after reloading their avatar data.

The mask now has larger white lenses with dark borders and pale blue reflections, a radial web pattern, red fabric shading, and a silhouette that fully covers every supported face shape. The suit uses shaded blue side panels, red webbed shoulders and torso, and a larger eight-legged spider emblem.

The migration updates only `svg_layer`. Slugs, equipment slots, prices (800 XP mask / 1200 XP suit), availability, render options, and ownership remain unchanged. The piccolo and other foreground accessories continue to render over the suit.

## Verification

- All 38 catalog SVGs passed the inert-artwork validator.
- Eight avatar regression test groups passed.
- Rendered 924 face/hair/crop/headwear combinations with no full-portrait top clipping.
- Pixel comparison across all 28 face/skin combinations confirmed that the mask and suit completely cover the underlying face, without exposed skin or hair. Checked a 35px head preview for lens readability.
- Applied `avatar_spiderman_art_refresh` to production, recorded version `20260917000943`; source file: `supabase/migrations/20260917000645_avatar_spiderman_art_refresh.sql`.
- Production artwork hashes match the reviewed local artwork exactly. Verified that both existing ownership counts, prices, availability, and render options were preserved.

[Before and after](avatar-spiderman-verification/before-after.png) · [Face-fit review](avatar-spiderman-verification/index.html)

Regenerate with `node scripts/render-avatar-spiderman.cjs`. The previous artwork is retained in `docs/avatar-spiderman-verification/before.json` for comparison.
