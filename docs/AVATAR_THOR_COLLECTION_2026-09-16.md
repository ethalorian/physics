# Thor wardrobe collection

Published September 16, 2026 (Eastern time).

| Item | Slug | Category | XP | Change |
| --- | --- | --- | ---: | --- |
| Thor's winged Viking helmet | `viking-helmet` | Headwear | 750 | Updated artwork in place |
| Thor armor & cape | `thor-suit` | Outfits | 1,200 | New |
| Mjölnir — Thor’s hammer | `mjolnir` | Pins & necklaces | 350 | New |

The helmet now has sculpted silver panels, layered feathered wings, rivets, and a central gold detail. Its original slug, price, unlock conditions, and render options are unchanged. Existing ownership remains valid. The existing `fit_head` and tucked-hair options follow face geometry and retain the saved hairstyle when the helmet is removed.

The outfit combines navy armor, six silver discs, chainmail sleeves, bracers, and a red cape. The separate hammer has a beveled silver head, decorative engraving, a leather-wrapped handle, and a wrist loop. It uses the foreground pin slot, so it can appear over this armor or another outfit. Only one pin accessory can be equipped at a time.

## Release

- Local CLI-created migration: `supabase/migrations/20260917002034_avatar_thor_collection.sql`.
- Applied through the migration tool to production project `ymszffulqmkqgvhioege` as `20260917002324_avatar_thor_collection`.
- The helmet update changes only `svg_layer`; the two new items use `ON CONFLICT (slug) DO NOTHING`.
- No schema, application deployment, student balance, or ownership changes were needed.
- Production queries confirmed the expected slots, prices, enabled state, render options, and matching artwork hashes.

| Slug | Production/local artwork MD5 |
| --- | --- |
| `viking-helmet` | `798cf5b39254f760ca9110b0f703a609` |
| `thor-suit` | `13e27b91ad4d90ca7b87662822439018` |
| `mjolnir` | `c54ec1baf1a4627b7a3f2359be4e2119` |

## Verification

- `npm run avatar:catalog-check`: 44 valid catalog items.
- `npm run test:avatar`: all 8 tests passed.
- `npm run avatar:render -- /private/tmp/avatar-thor-full-review`: 1,008 face/hair/crop and headwear combinations rendered with no full portrait top clipping.
- `node scripts/render-avatar-thor.cjs`: consistent tucked-hair rendering across all 28 face/skin combinations. The final collection image was visually reviewed for helmet fit, armor detail, and foreground hammer placement.
- `git diff --check`: passed.

Artifacts: [collection](avatar-thor-verification/collection.png), [helmet before/after](avatar-thor-verification/helmet-before-after.png), and [fit gallery](avatar-thor-verification/index.html). Refresh an already-open live avatar page to fetch the new catalog artwork and items.
