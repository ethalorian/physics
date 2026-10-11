# Fitchburg High School sports wardrobe collection

Published September 16, 2026 (Eastern time).

Eighteen custom avatar items: thirteen sports uniforms, two team jackets, and three matching headwear items. Sports include football, basketball, baseball, softball, soccer, volleyball, hockey, track and field, cross-country, lacrosse, tennis, golf, and cheer. The team pieces are a varsity jacket and warm-up jacket; headwear includes a baseball cap, football helmet, and hockey helmet.

## Design

- Alabama crimson `#9E1B32`, verified against the [University of Alabama color reference](https://brand.ua.edu/colors/).
- Slate gray `#708090`, chosen to match the user's requested slate gray; white trim supports readable lettering.
- All pieces use FHS or FITCHBURG. Outlined athletic block glyphs are native SVG paths, keeping the lettering inside the existing safe SVG dialect without fonts or text elements.
- Uniforms have sport-specific features: padded football shoulders, buttoned baseball jersey, raglan softball sleeves, hockey laces, track bib, cross-country mark, tennis/golf collars, cheer chevron, and varsity trim.
- Tank-style uniforms use coordinated compression sleeves within the existing avatar body silhouette.
- The cap brim was adjusted after visual review to keep the avatar's eyes visible.
- These are custom school-color avatar designs, not claims of reproducing the school's current physical uniforms.

## Release

- Local CLI-created migration: `supabase/migrations/20260917003313_avatar_fhs_sports_collection.sql`.
- Applied through the migration tool to production project `ymszffulqmkqgvhioege` as `20260917003745_avatar_fhs_sports_collection`.
- All inserts use `ON CONFLICT (slug) DO NOTHING`; existing catalog records, ownership, and student balances were left unchanged.
- Uses existing body/head slots and headwear fit options; no schema or frontend deployment was needed.
- Production verification confirmed all 18 names, slots, prices, enabled states, render options, and artwork hashes against the local catalog.
- Prices range from 180 to 350 XP.

## Verification

- `npm run avatar:catalog-check`: all 92 catalog items validated.
- `npm run test:avatar`: all 8 regression tests passed.
- `node scripts/render-avatar-fhs.cjs`: 84 headwear/face/skin hair-treatment checks passed.
- `npm run avatar:render -- /private/tmp/avatar-fhs-full-review`: 2,100 face/hair/crop and headwear combinations rendered with no full portrait top clipping.
- Visually inspected all 15 outfit details, complete avatars, and all three headwear designs after adjustments.
- `git diff --check`: passed.

Artifacts: [uniform details](avatar-fhs-verification/uniform-details.png), [complete avatar previews](avatar-fhs-verification/collection.png), [headwear](avatar-fhs-verification/headwear.png), and [fit gallery](avatar-fhs-verification/index.html). Refresh an already-open avatar page to load the additions under Outfits and Headwear.

## Published catalog

| Item | Slug | Slot | XP | Verified artwork MD5 |
| --- | --- | --- | ---: | --- |
| FHS baseball cap | `fhs-baseball-cap` | head | 180 | `9a6c0436233706f698836d207b55d3e5` |
| FHS baseball uniform | `fhs-baseball-uniform` | body | 270 | `29a5f7fdab0991ede8b2b18458d563a1` |
| FHS basketball uniform | `fhs-basketball-uniform` | body | 280 | `2aee81274a216f086c8aedbc58be4dd8` |
| FHS cheer uniform | `fhs-cheer-uniform` | body | 280 | `f4c550ed51c6f36fd215108da8cf0585` |
| FHS cross-country uniform | `fhs-cross-country-uniform` | body | 240 | `425c355a769ed0c2ec7ab73470d539f8` |
| FHS football helmet | `fhs-football-helmet` | head | 350 | `f89f8f4ffb05e868ff3240524f1b0bc5` |
| FHS football uniform | `fhs-football-uniform` | body | 300 | `2b9ebedaaa586cb8642dbb7c133bfd07` |
| FHS golf polo | `fhs-golf-uniform` | body | 250 | `f1960f8b383e2a892868ac6b95543988` |
| FHS hockey helmet | `fhs-hockey-helmet` | head | 320 | `9ca4623edfea2d6547070468fc96699a` |
| FHS hockey sweater | `fhs-hockey-uniform` | body | 320 | `d679d821bdc2e929508d7d0279d53444` |
| FHS lacrosse uniform | `fhs-lacrosse-uniform` | body | 280 | `96bc820f123633a5b13428866d8e9ccc` |
| FHS soccer uniform | `fhs-soccer-uniform` | body | 260 | `ca7f12968138edfa3c7a5e9cf67b7b4b` |
| FHS softball uniform | `fhs-softball-uniform` | body | 270 | `ce48f33996931861b00195dd77c5f420` |
| FHS tennis uniform | `fhs-tennis-uniform` | body | 250 | `652357a093207c19821e122ffa8e9b2d` |
| FHS track & field uniform | `fhs-track-uniform` | body | 240 | `182c26c8363f409c295e79fba7633565` |
| FHS varsity jacket | `fhs-varsity-jacket` | body | 320 | `e64abe5c6cd746c5018d18ead899ba00` |
| FHS volleyball uniform | `fhs-volleyball-uniform` | body | 260 | `7d2089bedb9d2f7d9b630e7874483302` |
| FHS team warm-up jacket | `fhs-warmup-jacket` | body | 280 | `b996fe1d3905ad6d33a3f2c288fa1fac` |

