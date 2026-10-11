# Individual lesson access — 2026-09-28

## Audit findings

The class-window API already wrote one exact course/lesson pair. The student video library nevertheless exposed other videos whenever an open lesson shared their learning target. The release catalog also included every published legacy Physics day. Only videos 1–3 had individual modern lessons; videos 4–8 were discovery resources linked to broader practice.

## Change

- Release only current Physics learning-path lessons. Preserve legacy content, IDs, responses, submissions, and historical access in the library.
- Match videos only to explicitly embedded video IDs in current lessons; shared targets cannot release another video.
- Give each video card a direct lesson link and staff a class-access link.
- Show visible per-lesson Preview, Schedule, and Open/Close controls. Keep previously opened lessons independent.
- Add five canonical lessons for verified videos 4–8, each with one instruction video, an immediate-feedback check, and a target-linked explanation. Use existing evidence, teacher rating, and XP pipelines. New lessons have zero class windows.
- Exclude archived classes from the release board.

## Verification

73 automated scenarios passed across teacher access, video matching and content validation, student/evidence access, XP boundaries, and Trades catalog compatibility. TypeScript, style and brand checks passed. Browser fixture used production components with isolated test data: opening video 4 exposed only video 4 alongside already-open video 3; closing video 3 left only video 4; native scheduling kept video 5 hidden. Desktop, 820px and 390px layouts had no horizontal overflow or console errors. Browser automation fill did not commit the native date input; a native keyboard edit verified schedule persistence.

Production data: all five new lessons published and target references resolved; existing 45 class windows retained the identical fingerprint 9911ce11da6ae4ea01f998b468e19fd1. No student records or old lesson documents were changed. Seed is idempotent and never copies access: scripts/physics-learning/individual-video-lessons.sql.

Release built from exact live deployment dpl_FQFPdFs2ykxWEX9NdWVswsa99riQ. Staged deployment dpl_8winYfMYT1MWvAdYa9oC8gBYNbyD preserves 2,298 baseline files and changes/adds only the 12 manifest paths. Verification artifacts: /private/tmp/lesson-access-fix-work. Authenticated browser testing used a local fixture; deployment checks verify live route protection and uploaded source identity, without impersonating or modifying a student's account.

Promoted successfully to https://www.antocciphysics.com. Live source identity verified. Preview HTTP checks were blocked by local certificate trust and Vercel SSO; no TLS protections were disabled. Canonical-domain checks verify the released routes and authentication gates after promotion.
