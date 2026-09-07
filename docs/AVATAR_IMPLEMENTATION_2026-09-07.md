# Avatar implementation — September 7, 2026

Implemented the audit fixes and an expanded customization system. Application changes and the migration are prepared locally; **production has not been migrated or deployed**. Unrelated concurrent workspace edits are outside this change.

## Behavior

- Changes are an instant local draft. One explicit Save commits traits, outfit, display name, sharing, and saved looks together. A revision conflict refuses to overwrite another window's changes. Failed saves preserve the draft; navigation/unload warns about unsaved changes. Mobile has a persistent save action for dirty drafts.
- Finish works when every default is accepted. Editing a trait no longer completes setup or publishes a portrait.
- Gallery sharing is explicit, defaults off, and is scoped to active classmates and their teachers (administrators can see shared avatars). This controls the gallery, not the avatar beside classroom work. First-name fallback replaces full roster-name fallback in the gallery. Appreciation is an idempotent desired-state action; only owners receive their own totals. The gallery is paginated and uses one component.
- Avatar purchases are atomic and idempotent by permanent user/item ownership. Store and arcade purchases share the same wallet lock and database balance calculation. A ledger trigger protects every spending writer, including re-approval of refunded requests. Arcade charge and play creation roll back together. Staff identity merges can still transfer an existing debit.
- Retired items are unavailable for new purchase but remain wearable by existing owners on every surface. Mastery items show the target statement and progress. Invalid render traits default safely; malformed API writes fail validation. SQL enforces ownership, nonnegative prices, and exclusive purchase/unlock eligibility.
- Catalog artwork passes a small inert SVG allowlist. Script, event handlers, external URLs, CSS, IDs/references, and unsupported tags are rejected. Renderer-created clipping IDs use React useId. Layer order is fixed by slot; z_order remains legacy metadata.
- Query failures no longer become empty galleries, zero XP, or silently successful writes. Account-menu caching is scoped to the signed-in user and cancels superseded fetches. Ownership counts aggregate in SQL rather than relying on REST row limits.

## Artwork and new features

- Headwear declares preserve/tuck/hide behavior and crown-based hats follow face geometry; helmets tuck hair and the full mask hides hair/ears/neck. Unequipping restores the saved hairstyle.
- Full and medium portraits fit large transformed hair; compact portraits expand for voluminous styles. Glasses follow eye spacing. Facial-hair color can match hair or be chosen separately.
- Raised shoulders, outlined clothing, a redrawn lab coat and suit, improved dark-tone facial contrast, organic afro contours, curved twists, stronger braids, independently colored headscarf fabric/folds, clearer pins, and backgrounds that work in the compact frame.
- **Five free shirt styles:** tee, polo, hoodie, striped, varsity. **Two new expressions:** joy and open. Identity options remain free.
- **Eight added catalog items:** denim jacket, cosmic hoodie, field scientist vest, flight suit, aurora background, sunrise background, comet pin, and hexagon glasses.
- **Six editable starting looks** and **six saved-look slots** per user. Saved looks contain appearance and owned equipment; using one creates a draft and requires Save.
- Own-avatar try-on works before purchase without charging or altering the saved outfit. The editor adapts to phones and exposes selection/save states accessibly.

## Verification

- `npm run type-check` and targeted ESLint on changed avatar/economy files.
- `npm run test:avatar`: six test groups covering trait normalization, all options, safe SVG, catalog sanitization, slot validation, headwear, and unique IDs.
- `scripts/test-avatar-integrity.cjs`: 20 isolated PostgreSQL integration and concurrent-request checks. Covers same-item duplication, avatar/store/arcade overspend, grant rollback, first-play freebie races, revision conflicts, ownership, mastery, privacy, likes, aliases, price constraints, and XP cap/rounding parity.
- `scripts/test-avatar-browser.cjs`: the actual React editor and actual API route handlers against isolated PostgreSQL. Only the authentication wrapper and Supabase transport are replaced by local test adapters. Covers default completion, rapid draft editing, try-on, buying/equipping, saved looks, save failure/retry, conflict recovery, and 375px layout. No production accounts or mutations are used. Uses installed Chrome through the bundled Playwright runtime because agent-browser is unavailable.
- `npm run avatar:render`: renders 840 combinations (252 face/hair/crop variants plus 588 headwear/face/hairstyle stress cases) and checks full-portrait top boundaries. Generates a 72-case contact sheet including all catalog items and headwear/hair stress cases.
- Browser screenshots: `avatar-verification/editor-desktop.png`, `editor-mobile.png`, `wardrobe-mobile.png`, `wardrobe-dark.png`. These are synthetic test fixtures rendered with the actual application stylesheet; global navigation/auth middleware are outside this harness.

Commands for this machine:

```sh
AVATAR_TEST_DATABASE_URL=postgresql://craigantocci@127.0.0.1:55439/postgres node scripts/test-avatar-integrity.cjs
AVATAR_TEST_DATABASE_URL=postgresql://craigantocci@127.0.0.1:55439/postgres AVATAR_PLAYWRIGHT_PATH=/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node scripts/test-avatar-browser.cjs
```

Both database suites enforce an isolated localhost URL, create a dedicated test database, and drop it afterward. They require the test PostgreSQL cluster on port 55439.

## Release and artwork maintenance

Apply `supabase/migrations/20260907142702_avatar_integrity_and_customization.sql` and deploy the application together. The new code requires its RPCs and columns. Coordinate the release: the old gallery route does not honor the new visibility field. No existing traits, ownership, prices, or mastery observations are deleted. Existing gallery membership becomes opt-in on the new application. Do not roll back only the app to the old gallery implementation after students have changed visibility.

The canonical artwork fixture is `src/data/avatar-catalog.json`; historical handwritten avatar preview HTML is no longer the source of truth. Run `npm run avatar:catalog-check` before publication, and `npm run avatar:render` after art changes. Create future migration files with `supabase migration new`; `node scripts/avatar-catalog-sql.cjs <existing-migration-path>` validates the catalog and appends artwork SQL. Existing prices/retirement settings are preserved; new mastery-only items require a reviewed semantic target lookup rather than copied database IDs.

Remaining release verification: after deployment, smoke-test a real authenticated student and staff session, run Supabase security advisors, and check the production account menu/leaderboard/lobby integration. The local harness deliberately does not exercise Google sign-in or production deployment infrastructure.
