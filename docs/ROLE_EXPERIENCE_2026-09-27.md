# Role experience walkthroughs — September 27, 2026

Admin entry: /experience, available in the top navigation, account menu, and admin sidebar.

## What the owner can inspect

- Student: choose a class and student; navigate the actual app under their canonical account ID. Lessons, release windows, track, saved answers, feedback, avatar, wallet, and XP reads use that student's identity.
- Teacher: choose a teacher account; data and authorization follow that teacher's scope. The owner may choose their own account with teacher permissions.
- Observer: use the owner's account with observer permissions and observer navigation.
- Admin: inspect the owner's existing workspace with writes disabled.

Every walkthrough is read-only, lasts one hour, and is shared across tabs in the same browser. A persistent banner identifies the role/account, switches roles, and returns to admin. The selected role is applied to both NextAuth's exposed session and the server authorization context. The underlying login token is never rewritten. No new accounts or role grants are created. The real owner's Google credential is removed from the projected session.

## Boundaries

This is an inspection mode, not a practice account. Answers, submissions, purchases, new live sessions, settings, and XP grants are blocked. It does not verify successful submission, checkout, multiplayer participation, or earning XP end to end. Teacher Google Classroom authorization cannot be borrowed from the owner. Existing saved work and XP can be inspected. New AI review generation is explicitly unavailable; saved reviews remain readable. Unissued math tasks are rendered without creating an instance.

The existing /admin/student-preview lesson inspector is retained for saved-work comparisons. The old teacher dashboard's menu-only student preview now leads to a real inspection tool.

## Isolation

- Signed HttpOnly preview cookie, bound to the owner's account ID/email; only currently authorized admins can start a walkthrough.
- Same-origin start/exit requests. Every switch revalidates the selected account and student/class membership.
- The projected role cannot inherit the real admin's API authorization or enrollment bypass.
- Middleware blocks mutations, server actions, expired previews, and stale-page requests. API wrappers also reject projected-session writes.
- Request-scoped Supabase fetch protection blocks table writes and unknown RPCs, including side effects in GET handlers. Reviewed read RPCs are allowed.
- Background presence, lesson activity, watch XP reports, local student draft recovery, and section persistence are suppressed while inspecting.
- Read-triggered challenge/goal bonuses are skipped. Warm-up and practice GETs do not create student tasks.
- Cross-tab changes reload the view. Requests from a stale preview are not retried as another identity. Sign-out clears the preview.

## Validation

- 83 assertions exercise the real session callback, management route, API wrappers, and middleware with synthetic accounts: all four roles, actor binding, role revocation, account scoping, forged/expired cookies, same-origin enforcement, blocked writes, stale tabs, and exit.
- 39 TypeScript tests pass across preview security, video XP, lesson navigation/reading, video sequence, and student math views.
- Eight existing video XP API scenarios and eleven lesson submission/mastery scenarios pass. Math practice XP and XP bounty regressions pass; practice inspection does not create an instance or expose its answer key.
- TypeScript check passes. Scoped lint has no errors; pre-existing warnings remain. Style and brand audits pass.
- Browser verification uses the real role picker, banner, navbar, admin shell, and management/auth boundaries with synthetic data. All four role journeys, a blocked save, switch/exit, and 820px iPad layout were verified.
- No real student's answers, XP, attendance, or purchases were modified during testing. No database migration was needed.

Reproduce the boundary tests with: node scripts/test-role-experience.cjs

## Release

Built from live deployment dpl_9tyqKtnjgooVt4eZXpAviZxY4rTy, preserving 2,233 baseline source files. The release changes 32 existing files and adds 13 files. Unrelated workspace edits are excluded.

Deployment verification and live release details are recorded in /private/tmp/role-experience-work.

Live release: dpl_AqY2n67JtrVNWydYKiBVQ2hjwjV2

Production URL: https://www.antocciphysics.com/experience

Staged and live checks: 17 routes each passed. The live source manifest matches all 2,278 expected files; the original notebook, video artwork, and brand artwork match exactly. No error/fatal runtime logs were reported during verification. The live page correctly requires admin access for signed-out visitors.

Rollback: dpl_9tyqKtnjgooVt4eZXpAviZxY4rTy (physics-5q6k8ocdo-ethalorians-projects.vercel.app).
