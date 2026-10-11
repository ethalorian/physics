# Batman wardrobe collection

Published four enabled avatar items on September 16, 2026 (Eastern time):

| Item | Slug | Wardrobe category | XP |
| --- | --- | --- | ---: |
| Batman cowl | `batman-cowl` | Headwear | 800 |
| Batman suit & cape | `batman-suit` | Outfits | 1,200 |
| Batman utility belt | `batman-utility-belt` | Pins & necklaces | 250 |
| Batarang | `batarang` | Pins & necklaces | 250 |

The suit includes a scalloped cape, chest emblem, gauntlets, and utility belt. Its integrated belt leaves the pin slot available for the Batarang. The separate belt can be worn over other outfits. The Batarang renders in the foreground using the existing pin slot. As with other pins, only one separate pin accessory can be equipped at a time.

The cowl hides hair, ears, and the bare neck, while preserving the avatar's selected skin and mouth through its jaw opening. Opaque SVG panels provide the pointed silhouette, white lenses, and charcoal highlights. The suit supplies its own covered neck. All artwork uses the existing SVG allowlist and renderer options; no frontend deployment or schema change was required.

## Release and verification

- Local migration: `supabase/migrations/20260917001219_avatar_batman_collection.sql`, created with the Supabase CLI.
- Applied to production project `ymszffulqmkqgvhioege` as `20260917001847_avatar_batman_collection` through the migration tool.
- Inserts use `ON CONFLICT (slug) DO NOTHING`; existing items, ownership, and student balances were not changed.
- Production verification confirmed all four items enabled with the expected slots, prices, options, and matching artwork hashes.
- `npm run avatar:catalog-check`: 42 valid catalog items.
- `npm run test:avatar`: all 8 tests passed.
- `npm run avatar:render -- /private/tmp/avatar-batman-full-review`: 1,008 combinations rendered with no full portrait top clipping.
- `node scripts/render-avatar-batman.cjs`: all 28 face/skin combinations expose skin only inside the intended jaw opening. The generated collection image was visually inspected for cowl fit, suit detailing, and accessory layering.
- `git diff --check`: passed.

Production artwork MD5 checks:

| Slug | Hash |
| --- | --- |
| `batman-cowl` | `6b9556dbcab51f03888d8acef19bcd46` |
| `batman-suit` | `fd920583f312d7f3f408105cf1bbfe83` |
| `batman-utility-belt` | `90fc90b190c0c8acecc9e1d91954f84d` |
| `batarang` | `b02a9f3282b72205a3a5d1fc12020477` |

Preview: [collection image](avatar-batman-verification/collection.png). Fit gallery: [HTML review](avatar-batman-verification/index.html). The live wardrobe obtains the enabled catalog on page load; refresh an already-open avatar page to see the additions.
