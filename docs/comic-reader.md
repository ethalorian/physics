# Graphic novel reader

The `/comics` reading room is an intentionally separate visual experience: warm charcoal, paper and amber, with local Newsreader typography. The regular application theme stays outside these routes. `AppPageFrame` removes only the ordinary navigation and simulation launcher; authentication, the access gate, role walkthroughs and other providers remain in the root layout.

The initial release contains the approved 2026-XJ Book One cover and eight story pages, grouped into Day 1 and Day 2. It does not restore the retired `/story/2026-xj` experience. The fictional cast is original artwork, not the editable avatar system.

## Add an installment

Before generating any new artwork, follow `docs/comic-character-continuity.md`. It defines Mr. Antocci's fixed appearance and clothing, the canonical image references, varied panel staging, and the required visual continuity check.

1. Export approved pages to a new immutable directory under `public/comics/`. Existing `book-one-v1` images are lossless WebP conversions of the approved PNGs, at 1024 × 1536. Do not replace their contents with revised artwork under the same paths.
2. Append the pages to the book in `src/lib/comics.ts`, with descriptive alt text and a text scene companion. Page index 0 is always the cover. Preserve existing indices so old links and reading positions remain meaningful.
3. Add a chapter with its day, title, topic, description, inclusive start/end page indices, and optional closing lines. Counts, contents and reading progress derive from this manifest.
4. Run the comic manifest tests, TypeScript, targeted lint, style/brand checks and a production build. Review desktop spreads, a narrow phone viewport, enlargement and the new end-of-installment transition.

To add another unit book, add a new `ComicBook` entry. The library lists additional volumes, and `/comics/2026-xj/[book]` resolves and titles the route from the manifest. Unknown book slugs return 404.

## Reading behavior

Page, spread and continuous-scroll layouts; mobile swipe; keyboard arrows/Home/End; magnification; full screen where supported; focus mode; dark or paper backgrounds; chapter thumbnails and text companions are included. Spreads collapse to single pages below 960 CSS pixels. Navigation uses explicit `?page=` deep links and replaces page-turn history rather than adding an entry for every turn.

The current page is stored locally in a versioned, account-scoped key. It is saved on the current device only, not synchronized between devices. Layout/background preferences are device preferences. Malformed or unavailable local storage does not prevent reading. No API, database, student answer, XP, grade or ownership writes are introduced.

Readers enter through “Graphic novels” in student Learn navigation and the staff navigation. They can return to `/home` from the library. New controls use ordinary browser-readable English; the raster artwork itself is accompanied by the text descriptions.
