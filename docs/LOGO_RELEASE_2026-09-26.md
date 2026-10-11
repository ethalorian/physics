# Logo and favicon release

Published September 26, 2026 to https://www.antocciphysics.com.

- Deployment: `dpl_AG1GpDpYJjkbtEz5pRZe2SDiQ6cN`, READY and promoted.
- Immutable URL: https://physics-gw37odehy-ethalorians-projects.vercel.app.
- Baseline: production `dpl_4d8gzDdE5Cr3ucknAz8wDi8P4Ukv`.
- Isolated release: `/private/tmp/antocci-logo-release`.
- Source manifest and verification: `/private/tmp/antocci-logo-release-work/`.

The supplied Profile.png is preserved byte-for-byte at `public/brand/antocci-physics.png`. A shared BrandLogo component replaces the former navigation, landing, sign-in, staff sidebar, checkpoint preview, and presentation marks. The favicon contains 16, 32, and 48 px sizes; the browser PNG is 512 px and the Apple touch icon is 180 px. `scripts/build-brand-icons.cjs` regenerates these icon encodings.

The Unit 1 deck generator now uses the new artwork. All 23 generated HTML pages were checked against production: only the brand image markup changed; the slide content remains identical (C-3).

All 2,207 uploaded source files were verified: 2,168 unchanged baseline files, 33 intentional modifications, and six additions. The live baseline's Quizzes navigation entry is preserved in the release even though the shared checkout's navbar did not yet contain it. No Git commit was created, and unrelated shared-checkout changes were excluded.

Validation passed: scoped lint, style audit, remote production compilation and type checks, and generation of all 323 pages. After promotion, all five artwork/icon endpoints returned 200 and matched the release hashes. Live desktop/mobile browser checks showed loaded artwork and no page errors; the deployment error/fatal log query returned no entries. Existing unrelated build warnings remain.
