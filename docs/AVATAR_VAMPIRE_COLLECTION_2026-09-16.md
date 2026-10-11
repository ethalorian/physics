# Vampire avatar collection

Six Mavis/Dracula-inspired items extend the existing XP wardrobe:

| Item | Category | XP |
| --- | --- | ---: |
| Vampire fangs | Fangs & mouths | 100 |
| Pointed vampire ears | Ears | 100 |
| Midnight vampire dress | Outfits | 240 |
| Dracula cape & waistcoat | Outfits | 320 |
| Night bat hoodie | Outfits | 200 |
| Ruby bat pendant | Pins & necklaces | 120 |

Ear and mouth items have independent equipment slots, so students can combine them with clothing, glasses, headwear, and necklaces. Pointed ears match all seven skin tones and fit all four face shapes. Masks that cover the ears also cover the new accessories. Fangs replace the displayed mouth inside the existing face and mouth-width transforms; removing them restores the student's saved expression. The dress uses `covers_neck` to keep its high collar visible.

The collection uses the existing purchase, ownership, saved-look, and gallery paths. No balances, owned items, saved traits, or existing catalog prices are changed.

## Verification

- TypeScript and targeted ESLint passed.
- Eight avatar unit test groups passed, including combined equipment, mouth restoration, face fit, skin tint, mask coverage, and SVG sanitization.
- All 34 catalog SVGs passed the inert SVG validator.
- Twenty-four isolated PostgreSQL checks passed, including purchase/save ownership, wrong-slot rejection, saved looks, migration repeatability, and preservation of staff pricing/retirement settings.
- Eleven browser/API/database checks passed using the actual editor and route handlers with synthetic local accounts. New items were purchased, equipped together, saved, reloaded, and removed independently. Mobile layout was verified at 375px; no browser runtime errors occurred.
- The full renderer checked 840 existing face/hair/crop/headwear combinations with no full-portrait top clipping.
- Chrome visual review covered all 28 skin/face combinations and small avatar previews.

Preview: [collection](avatar-vampire-verification/vampire-collection.png), [face fit](avatar-vampire-verification/face-fit-browser.png), [interactive browser document](avatar-vampire-verification/index.html).

Regenerate the focused preview with `node scripts/render-avatar-vampires.cjs`.

## Publication status

Published to the production catalog on September 16, 2026 after confirming that the live avatar editor already included the new Ears and Fangs & mouths categories. The missing database migration caused those categories to appear empty. Applied `avatar_vampire_collection` through Supabase (recorded version `20260916175718`) and verified that all six records are enabled, with the expected prices, artwork, and render options.

The source migration is `supabase/migrations/20260916164359_avatar_vampire_collection.sql`. It only widens the existing slot constraint and inserts the six new items, preserving established entries on conflict. The live catalog reads from the database, so editing the JSON fixture alone does not publish items. Future releases must include both the catalog migration and the application changes. Existing open editor pages need a refresh to load newly published items.
