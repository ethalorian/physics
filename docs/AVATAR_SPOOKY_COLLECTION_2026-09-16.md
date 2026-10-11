# Spooky season wardrobe collection

Published September 16, 2026 (Eastern time).

Thirty new items: ten matching headwear/outfit pairs, six foreground accessories, one eye patch, and three backgrounds. The ten themes are moon witch, friendly ghost, skeleton, jack-o’-lantern, mummy, werewolf, stitched monster, scarecrow, black cat, and haunted pirate. All artwork follows the existing cartoon avatar style.

Accessories include a broom, pumpkin candy bucket, bubbling cauldron, amethyst spider brooch, velvet bat bow tie, haunted lantern, and pirate eye patch. The six pin accessories render over clothing; one pin accessory can be equipped at a time. The eye patch uses the eyewear slot. Backgrounds depict a moonlit graveyard, haunted castle, and twilight pumpkin patch.

Full-face masks cover the underlying face, hair, ears, and neck without modifying saved traits. The witch and pirate hats use the existing tucked-hair and face-fit options. Every item uses the existing renderer and supported SVG dialect.

## Release

- Local CLI-created migration: `supabase/migrations/20260917002503_avatar_spooky_collection.sql`.
- Applied through the migration tool to production project `ymszffulqmkqgvhioege` as `20260917003024_avatar_spooky_collection`.
- All inserts use `ON CONFLICT (slug) DO NOTHING`; existing catalog records, student balances, and ownership were left unchanged.
- No schema change or frontend deployment was needed.
- Automated production verification confirmed all 30 names, slots, prices, enabled states, render options, and artwork hashes against the local catalog.
- Prices range from 100 to 380 XP.

## Verification

- `npm run avatar:catalog-check`: all 74 catalog items validated.
- `npm run test:avatar`: all 8 regression tests passed.
- `node scripts/render-avatar-spooky.cjs`: all 224 full-mask coverage comparisons passed (8 masks × 4 face shapes × 7 skin tones), including large hair.
- `npm run avatar:render -- /private/tmp/avatar-spooky-full-review`: 1,848 face/hair/crop and headwear combinations rendered with no full portrait top clipping.
- Visually reviewed all ten complete costumes and all ten extra accessories/backgrounds using the production composer.
- `git diff --check`: passed.

Artifacts: [costume collection](avatar-spooky-verification/collection.png), [accessories and backgrounds](avatar-spooky-verification/extras.png), and [complete fit gallery](avatar-spooky-verification/index.html). Refresh an already-open avatar page to fetch the new items.

## Published catalog

| Item | Slug | Slot | XP | Verified artwork MD5 |
| --- | --- | --- | ---: | --- |
| Velvet bat bow tie | `spooky-bat-bow-tie` | pin | 110 | `d51261310633187ffd04cf2ae5250f9c` |
| Moon witch broom | `spooky-broom` | pin | 180 | `c9d141ae2af88b73016412e74140ac43` |
| Pumpkin candy bucket | `spooky-candy-bucket` | pin | 160 | `4432312863562dd9bb42fc932e74a02b` |
| Midnight black cat hood | `spooky-cat-hood` | head | 250 | `a958e95df033dfd5b17a14ba627c86ba` |
| Black cat suit & tail | `spooky-cat-suit` | body | 300 | `d59cba0b9aa29d1e32d90f2bb83770e8` |
| Bubbling cauldron | `spooky-cauldron` | pin | 190 | `0122d13f824b35e99174501cf70b4535` |
| Friendly ghost hood | `spooky-ghost-hood` | head | 220 | `15a8223f6b7f277aa619b183c1b892dd` |
| Flowing ghost sheet | `spooky-ghost-sheet` | body | 280 | `23e5eaa31b8b0d67d2ebf2a58f6d9b0c` |
| Moonlit graveyard | `spooky-graveyard` | background | 180 | `4ffc89e17107e96fb8bcd8273dede813` |
| Haunted castle | `spooky-haunted-castle` | background | 200 | `14166dc6768ebcb7d421a1243d38580e` |
| Haunted lantern | `spooky-lantern` | pin | 180 | `bbc059c94b587fc47d5246f33bcfd451` |
| Patched monster jacket | `spooky-monster-jacket` | body | 320 | `398d1fe80d92ec049fbe8781b1ae83f9` |
| Stitched monster mask | `spooky-monster-mask` | head | 260 | `260e28e313e0d57a5798684731f8a9ae` |
| Moonlit mummy mask | `spooky-mummy-mask` | head | 240 | `6eec7c3a8fbb32d1e89c1175d5c658ad` |
| Mummy wraps | `spooky-mummy-wraps` | body | 300 | `5404adf1f4b965421afd0f98c64bee5b` |
| Haunted pirate coat | `spooky-pirate-coat` | body | 380 | `89c9ea1e7aa249f7ff26b39d095a56cb` |
| Pirate eye patch | `spooky-pirate-eye-patch` | eyewear | 100 | `e8674032325f27ac32ce34935e929b7c` |
| Haunted pirate tricorn | `spooky-pirate-hat` | head | 240 | `22e0e437c37cb0bb6a332a2d9311e273` |
| Jack-o’-lantern mask | `spooky-pumpkin-mask` | head | 260 | `8fcb632bff1dcd54ec887859cfccec6d` |
| Pumpkin patch outfit | `spooky-pumpkin-outfit` | body | 300 | `c28b9980f5e59c0ab1cef93f65b06a71` |
| Twilight pumpkin patch | `spooky-pumpkin-patch` | background | 160 | `0e7cc438480d601076096d9c68f3804f` |
| Harvest scarecrow mask | `spooky-scarecrow-mask` | head | 250 | `6066b5c09a53b6ee1eeefe7575a8145a` |
| Scarecrow overalls | `spooky-scarecrow-overalls` | body | 300 | `94e0df27a802c4a1443f9f68c1b68e32` |
| Skeleton suit | `spooky-skeleton-suit` | body | 320 | `0ef1d9d73218dc719cc12a2c6450b84c` |
| Smiling skeleton mask | `spooky-skull-mask` | head | 250 | `c438fcbc6ddc511b7a45c352d3b87637` |
| Amethyst spider brooch | `spooky-spider-brooch` | pin | 120 | `fe5bb56385c1cf4154ae4886d97674d8` |
| Moonlight werewolf mask | `spooky-werewolf-mask` | head | 280 | `b85e65216d524519f9f3ba9126ae6f10` |
| Werewolf plaid shirt | `spooky-werewolf-shirt` | body | 330 | `65e8970c5b8534fd2c12620eb1c30d5c` |
| Moon witch hat | `spooky-witch-hat` | head | 200 | `77ca295240ae9207e4bc1b9520628904` |
| Moon witch robe | `spooky-witch-robe` | body | 350 | `b11025d6089beb1fd3dc1b07149fef0b` |

