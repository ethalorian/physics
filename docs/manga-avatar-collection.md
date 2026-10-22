# Manga avatar collection

The canonical Avatar renderer composes local transparent manga artwork. The same saved traits and owned items appear in the studio, home, gallery, textbook, assignments and asteroid story. Full figures share these layers; running respects reduced motion and classroom furniture remains separate.

## Delivered artwork

The original manga-v1 directory contains eight immutable WebP atlases with 40 painted parts. The manga-wardrobe-v1 directory adds ten atlases with 64 catalog items: 21 outfits (including all 15 FHS uniforms), ten hats/masks, six eyewear options, four facial accessories, sixteen pins/props and seven backgrounds. There are 72 illustrated catalog items out of 92. The twelve editable starting looks, all free traits and fine-tuning controls remain available.

The manifest is src/lib/avatar/manga-atlases.json. Each entry resolves its own immutable collection path; old asset URLs stay unchanged. MangaAvatar composes the layers and manga-collection.ts records positioning and atlas-edge clipping. Gray facial hair and ears retain saved hair/skin tints. New costume masks preserve a neck below the prop and constrain the underlying face to avoid exposed forehead edges.

The neck uses the original shaded face artwork at its full neck width, with overlapping face/neck boundaries and clothing drawn over it. This corrects the disconnected collar in the blue-haired Momentum preset. The pointed ear pair is registered separately on each side of the head.

## Remaining artwork

The full wardrobe redraw is NOT complete. Three independent sheets were rejected by the image service at output moderation (category other); no specific cause was provided. These rejected requests were not retried or sent through another generation route. Twenty catalog items retain the existing sanitized SVG compatibility artwork:

- lab-coat
- spiderman-suit
- denim-jacket
- cosmic-hoodie
- field-vest
- flight-suit
- midnight-vampire-dress
- dracula-cape
- space-helmet
- viking-helmet
- spiderman-mask
- beanie
- grad-cap
- scholars-laurel
- football-helmet
- flash-mask
- batman-cowl
- spooky-witch-hat
- spooky-ghost-hood
- spooky-skull-mask

The exact prompts, accepted source paths and rejection IDs are saved in outputs/manga-wardrobe-prompts.json in the parent task workspace. All generation used the built-in image_gen tool with the previously approved costume sheet as the style reference.

## Integration and operation

The supplied catalog and slot membership remain authoritative; a saved slug alone grants nothing. Owned retired items still render. Unknown custom artwork uses the existing inert SVG sanitizer. Prices, ownership, XP, authentication, schema and student records are unchanged. There are no runtime generation calls or image generation charges for changing looks. The complete shared art library is below 7.5 MB; a view requests only referenced atlases, which use immutable cache headers. Future artwork changes need new versioned paths.

## Lesson and game integration

Teacher previews now compose the sample student from the same free manga parts as saved student avatars, including seated, standing, head and running poses. Preview labels still identify the sample student.

Customization links in classroom scenes, the reader, lesson headers and asteroid story open Avatar Studio in a separate tab. The existing portrait store refreshes the saved appearance when students return; predictions, controls and lesson answers remain mounted in the original tab. Link labels explain the new tab in English, Spanish, French and Brazilian Portuguese. This does not persist practice after closing or reloading the lesson.

Mic Check now uses the shared manga renderer and portrait store. Saved changes update its performer without resetting the game. Its CSS sizes only the outer avatar SVG so nested atlas layers retain their registration. `npm run build:game-avatars` rebuilds the standalone bundle, and `prebuild` runs it on every production build. No game prices, scoring or rewards changed.

The arcade lobby presents the saved full-body character, and the shared cabinet page displays a compact player portrait. Both reuse the portrait store, including account isolation, cross-tab refresh, setup and unavailable states. Customization opens separately, retaining lobby filters and the mounted game iframe. These portraits identify the player; individual games keep their own existing gameplay artwork unless explicitly integrated (such as Mic Check). Lesson, reader and story portrait CSS now targets outer SVGs so responsive sizing cannot resize individual manga atlas layers.

## Verification

Run node --import tsx --test src/lib/avatar/avatar.test.tsx src/lib/avatar/portrait-store.test.ts. Tests cover every trait, all catalog entries and slots, explicit 72/20 coverage, transparent local assets and the size budget, unique SVG references, sanitization, pose identity and saved-look isolation. The excluded scripts/manga-collection review fixture allows checking the new items separately through the production renderer. The learning-rollout fixture exercises the unchanged save/load contract using a fictional student only.
