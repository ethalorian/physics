# Manual lesson saves

Ordinary content and settings saves no longer rerun publication-readiness checks merely because a lesson is already published. Teachers can correct generated instructions and save unfinished activities without first adding visuals, sentence frames, vocabulary, or assessment-target links.

The complete readiness checks still run when an administrator changes a draft to published. Normal content updates still validate document structure. Version checks, editor permissions, stable activity IDs, publication status, and browser draft recovery are preserved. Settings-only saves do not validate unrelated existing lesson content.

Changed application files:

- `src/app/api/lessons/[id]/route.ts`: distinguish a draft-to-published transition from a normal save.
- `src/components/admin/LessonBlockBuilder.tsx`: apply structural validation on manual saves.
- `src/components/admin/AdminLessonEditor.tsx`: validate readiness only when publishing a draft.
- `src/data/block-registry.ts`: remove the unused `remainsPublished` helper.

Verification completed against both the working checkout and the isolated release:

- 24 lesson audit regression scenarios and 13 lesson cleanup scenarios passed.
- TypeScript and targeted ESLint checks passed.
- `scripts/test-lesson-manual-save-browser.cjs` used the actual React editors and lesson PATCH handler with a synthetic local database. It reproduced missing visual, frame, and target errors plus an unfinished question, then verified successful saves, edited instructions after reopening, repeated saves, settings persistence, failed-save draft retention, retry, and stale-version conflict protection. No browser runtime errors occurred.

The release was reconstructed from the current production deployment `dpl_FmAUb2vRbbXFjo3yn9taZ462uiBb`, verifying source-file hashes before applying this fix. Unrelated local styling and lesson-deck changes were excluded. No production lesson or student records were modified during verification.

Deployed and promoted to `https://www.antocciphysics.com` on September 16, 2026: `dpl_EHHDAn1mjGPGktnNY2RZm88J8Sfq`. The production build passed, the domain resolved to the new ready deployment, sign-in returned HTTP 200, and an unauthenticated PATCH to a synthetic lesson ID returned HTTP 401. Authenticated save persistence was tested in the local integration fixture, not on real production lessons. The runtime-error summary showed historical errors from the previous deployment; none listed the new deployment at the time of checking.
