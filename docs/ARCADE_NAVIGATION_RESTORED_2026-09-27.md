# Arcade navigation restored — September 27, 2026

The student menu and student home page retained their Arcade links. The staff navigation cleanup had removed the direct game-area entry, leaving only cabinet administration behind an expanded Resources group.

Restored Arcade to the admin/teacher top navigation and mobile menu. Added a visible Arcade sidebar group whose primary link opens /arcade; Arcade cabinets remains available under that group. The shared navigation model also restores Arcade in the command palette. Observer navigation and student navigation are unchanged.

Only src/components/navbar.tsx and src/components/admin/adminNav.ts changed. Release assembled from dpl_8pcRipHZxgGQe5bocFEkF6Ywd1Gb with 2,263 other files preserved, including lesson video XP. No schema, permissions, game settings, or student records changed.

Validation: scoped lint and style audit passed. Real navigation components with synthetic roles verified admin, teacher, and student menus, the /arcade link destination, and 820px iPad main/sidebar menus. No horizontal overflow or console errors. One browser tab stalled; a fresh tab completed verification.

Release: /private/tmp/arcade-navigation-release. Evidence: /private/tmp/arcade-navigation-work.

Deployed and promoted: dpl_9tyqKtnjgooVt4eZXpAviZxY4rTy, physics-5q6k8ocdo-ethalorians-projects.vercel.app. Live domain www.antocciphysics.com verified against this release. Production build, 14 staged route checks, and 14 live route checks passed; /arcade returned 200 and its unauthenticated API remained protected. Exact source verification preserved all 2,263 other baseline files. No error/fatal runtime logs returned for this deployment at verification. Preview tabs and the local fixture server were closed.
