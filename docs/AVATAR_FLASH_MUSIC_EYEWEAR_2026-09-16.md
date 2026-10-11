# Flash, piccolo, and half-rim glasses

Published to the live avatar catalog on September 16, 2026.

| Item | Wardrobe category | XP |
| --- | --- | ---: |
| Flash suit | Outfits | 1200 |
| Flash mask | Headwear | 800 |
| Piccolo | Pins & necklaces | 250 |
| Black half-rim glasses | Eyewear | 150 |

The Flash costume uses red fabric, gold lightning accents, a white chest badge, and a cowl with lightning ear pieces. The mask hides hair and ears but leaves the avatar's own skin and mouth visible through its lower-face opening.

The piccolo is a transverse instrument with a silver headjoint, dark body, and silver keywork. It sits diagonally across the torso in the existing foreground `pin` slot, which renders after clothing and headwear. It shares that slot with pins and necklaces. It is visible in full and medium portraits; the head-only menu crop focuses on the face.

The glasses follow the supplied photo's wide rectangular, semi-rimless shape, with a strong black brow line and delicate lower lens edges. Existing face and eye-spacing transforms fit them to the avatar. Covering superhero masks render in front of eyewear.

Only the versioned catalog and a data migration are required. The live renderer already supports the slots and options; no application deployment or schema changes were necessary. Existing prices, ownership, balances, and saved avatars remain unchanged.

## Verification and publication

- All 38 catalog SVGs passed validation; eight avatar regression test groups passed.
- The renderer checked 924 face/hair/crop/headwear combinations without full-portrait top clipping.
- The focused preview includes 50 mask skin/face, glasses spacing/face, and piccolo/outfit combinations. Regenerate with `node scripts/render-avatar-flash-music.cjs`.
- Applied source migration `20260916185658_avatar_flash_music_eyewear.sql` through Supabase as `avatar_flash_music_eyewear`, recorded version `20260916190028`.
- Production query confirmed all four items are enabled with their expected slots, prices, and render options.
- Verified all four item names in their live wardrobe categories. Live try-on confirmed the piccolo renders over the existing Spider-Man suit. Ended try-on without purchasing, equipping, or changing the saved avatar.

[Collection preview](avatar-flash-music-verification/collection.png) · [Fit preview](avatar-flash-music-verification/index.html)
