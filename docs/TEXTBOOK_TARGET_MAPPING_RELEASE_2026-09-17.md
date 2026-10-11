# Live release: textbook target mappings

Production: https://www.antocciphysics.com/admin/readings

Deployment: dpl_EBPNJpoi1k21RgVhGG6CnbMY6PVr (READY), promoted 2026-09-18 02:52 UTC (September 17 Eastern). Source: /private/tmp/textbook-mapping-release. Baseline: dpl_3BpWgnQW5jWK5j8FnjGEC1upuqKR.

1859 baseline files were hash-verified before assembly. The uploaded 1864-file manifest has only the nine intended source, test, and mapping documentation changes; the student home page, styling, avatar and all unrelated files retain their baseline hashes. The local browser verification script was subsequently extended to check three distinct auto-mapped targets through publish, snapshot, and rating against this exact release.

Validation passed:
- 8 unit tests: reference classification, exact question mappings, full catalog integrity, ambiguity/unknown handling, curriculum isolation, unavailable targets, custom prompt protection and reading validation.
- TypeScript, focused ESLint, style audit, and complete Vercel production build. Existing unrelated lint warnings remain.
- Actual React components in isolated Chrome fixtures: automatic mapping, mixed-skill batches, target overrides, deduplication, missing-target save rejection, corrected question-set validation, preserved manual choices, drafts/publishing, student autosave and reload recovery, revision/resubmission, unique target ratings, immutable submission snapshots, and stale-window protection. Final test used the exact deployed source and persisted three distinct auto-mapped targets through three separate teacher ratings.
- Responsive widths 320/390/768/1366 and light/dark student views. Separate agent-browser desktop/mobile visual review: no horizontal overflow or browser errors. Screenshots are explicitly labeled synthetic data.
- Live database read verified all candidate target slugs are active Physics targets. No production data was changed.
- Production alias resolves to the new READY deployment. Signed-out /admin/readings leads to sign-in; reading APIs return 401. No real authenticated classroom assignment was published during verification.

Coverage: 1325 numbered questions plus 179 section concept checks, using 90 existing Physics targets. Unmapped questions remain visible as needing a teacher-selected target; no substitute targets or grades are invented.
