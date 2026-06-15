# Identity Re-Key & Go-Live Hardening Plan

**Goal:** make identity bulletproof for a clean go-live (~12 teachers, ~500 students) by
making **`students.id` the single, app-controlled principal** for every row of student
work, and demoting the Google OAuth `sub` to nothing more than a login credential.

**Status of the interim fix (already deployed):** the email-pinned fix is live —
logins resolve identity from the verified email and link drifted Google subs via the
new `student_identities` table, and the 5 fragmented accounts in the current DB were
consolidated. That fix *prevents recurrence on its own*. This plan supersedes it with
the cleaner architecture that the pre-go-live data wipe makes cheap and safe.

---

## 1. The principle

One person = one `students.id` (a UUID this app mints and owns). Every work row points
at that UUID. The Google `sub` never again appears as the owner of any data — it is
only ever a key in `student_identities` used to look a person up at login. Email is the
resolver that ties a login to a student row.

Why `students.id` is the right principal:
- Your app mints and controls it — immune to anything Google/OAuth does.
- Your **enrollment already uses it** (`course_students.student_id` → `students.id`), so
  this unifies the two id systems you currently run in parallel instead of adding a third.
- It enables **database-enforced** referential integrity (Section 3), which the Google
  sub (a free-floating `text` value) never could.

---

## 2. Target identity model

```
students (id uuid PK, email unique, name, ...)          -- the person
student_identities (student_id -> students.id,           -- their login credentials
                    provider, provider_sub unique)        -- (google sub lives ONLY here)
work tables (user_id uuid -> students.id, ...)           -- everything they do
```

- `session.user.id` (== `token.sub`) becomes the **`students.id`**, resolved at login
  from the verified email. The Google `sub` is recorded in `student_identities` and used
  to find the student on subsequent logins, but is never the session id.
- `students.google_user_id` column is **removed** (its job moves to `student_identities`).
  *(Decision D1 — see Section 9.)*

---

## 3. Structural guarantee — make fragmentation impossible (not just unlikely)

This is the part the data wipe unlocks. With no rows to migrate, we change every work
table's `user_id` from a free `text` value into a typed **foreign key to `students.id`**:

```sql
ALTER TABLE <work_table>
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ADD CONSTRAINT <t>_user_fk FOREIGN KEY (user_id)
      REFERENCES public.students(id) ON DELETE CASCADE;
```

Consequences, all enforced by Postgres rather than by hoping the code is correct:
- A work row **cannot** reference an id that isn't a real student (no orphans, ever).
- A second "ghost" identity for a person is impossible — there is exactly one `students`
  row per email (unique), and all work hangs off its UUID.
- `ON DELETE CASCADE` makes the go-live wipe (and future student offboarding) a
  one-line, leak-free operation: delete the student, all their work vanishes with it.

Add the same FK discipline to `student_identities.student_id` (already present) and keep
`student_avatars`/`student_owned_items` PKs on `user_id` (now a FK).

This is the backbone of "bulletproof": even a buggy future route physically cannot
create the fragmentation we just spent today cleaning up.

---

## 4. Code refactor (blast radius and strategy)

**Surface:** ~185 `google_user_id` references across ~50 files; ~189 reads of
`session.user.id` / `ctx.userId`. Large but highly mechanical.

**Strategy — funnel through one choke point, then codemod:**

1. **Resolver as the only source of truth.** `withAuth` already builds `ctx.userId` from
   the session. After the re-key, `ctx.userId` *is* `students.id`. Nothing in a handler
   should ever read identity any other way, and **the client must never supply identity**
   (closes the historical IDOR class — server derives it from the session, always).
2. **Flip `teacher-scope.ts`** from returning `google_user_id`s to returning `students.id`s.
   This file is the hub for every mastery/gradebook/leaderboard scoping query, so most
   surfaces correct themselves once it changes. (`getTeacherStudentGids` →
   `getTeacherStudentIds`, `.in('google_user_id', …)` → `.in('user_id', …)` / `.in('id', …)`.)
3. **Codemod the rest:** replace `.eq('google_user_id', userId)` →
   `.eq('id', userId)` on `students`, and `google_user_id` → `user_id` on work tables.
   Each of the ~50 files gets a focused diff + a grep-clean check (`rg google_user_id`
   must return only `student_identities` / migration files when done).
4. **Lib helpers to update:** `student-management.ts`, `student-enrollment.ts`,
   `presence.ts`, `teacher-scope.ts`, `user-db.ts`, `arcade.ts`, `car-parts.ts`,
   `pacing-server.ts`, `lesson-windows.ts`.
5. **Type-level lock:** brand `ctx.userId` as a `StudentId` type so a raw Google sub can
   never be assigned to it by accident.

---

## 5. Auth flow after the re-key

`signIn` callback (unchanged ordering): gate by district domain → `ensureStudentRecord`
upserts the `students` row by email → records the presented `sub` in `student_identities`.

`jwt` callback: `token.sub = resolveStudentId(email, presentedSub)`:
1. Find the `student_identities` row for `(google, presentedSub)` → its `student_id`. Done.
2. Else find the `students` row by email → attach this sub as a new identity → return its id.
3. Else (brand-new) the row just created in `signIn` supplies the id.

Edge cases covered:
- **First-login race** (two devices at once): `students.email` is unique, so the second
  insert fails with `23505` and falls back to fetch — already handled; resolver is
  idempotent.
- **Classroom stub reclaim** (the `@classroom.local` name-match path) keeps working — it
  resolves to a `students.id` like any other.
- **A person who is both staff and a test student**, and **admin "view as teacher"**, are
  unaffected — those run off email/role, not the work-key.

---

## 6. Go-live reset (the wipe)

A single transactional migration, run once before launch. *(Exact scope = Decision D3.)*

**Delete (student state):** `student_avatars`, `student_owned_items`, `avatar_likes`,
`block_responses`, `lesson_progress`, `lesson_submissions`, `mastery_records`,
`mastery_task_results`, `math_competency_records`, `math_warmup_submissions`,
`math_spine_point_grants`, `economy_point_grants`, `vocabulary_game_scores`,
`arcade_plays`, `gradebook_entries`, `reward_redemptions`, `submissions`,
`assignment_submissions`, `student_activity`, `video_question_responses`,
`question_usage_log`, `notification_reads`, `lobby_members`, `challenges`,
`student_identities`, then `students` and `course_students` last.

With the Section 3 FKs + `ON DELETE CASCADE` in place, this collapses to essentially
`DELETE FROM students;` (work cascades automatically) — which is itself a proof the model
is sound.

**Preserve (your IP and config):** staff/admin accounts & roles, `courses` shells (or
re-import from Classroom), curriculum (`lessons`, `units`, `simulations`, `vocabulary_*`,
`concept_exercises`, `learning_targets`, `math_*` definitions), the **avatar item catalog**
(`avatar_items`), the **rewards catalog** (`rewards`), schedules/pacing, and the XP economy
config. *(Confirm staff test-data handling — Decision D3.)*

---

## 7. Verification — sized for 500 students / 12 teachers

A throwaway Supabase **branch** (not production) for all of this:

1. **Seed** ~500 synthetic students + 12 teachers + enrollments.
2. **Adversarial login simulation:** for a sample of students, drive logins that present
   *different* Google subs across "devices" and assert: exactly one `students` row, one
   avatar, XP/work all under one `students.id`, and N rows in `student_identities`. This
   directly reproduces the original bug and proves it can't happen.
3. **Referential-integrity sweep:** assert zero work rows with a `user_id` not in
   `students` (the FK makes this impossible to even insert — test that the insert *fails*).
4. **Authorization tests:** a teacher sees only their roster; a student sees only self;
   client-supplied ids are ignored. Re-run the IDOR cases that bit you before.
5. **Load smoke:** concurrent logins + dashboard reads at 500-student scale; watch query
   plans on the new FK indexes.
6. **Independent re-verification** by a separate review pass before promoting the branch.

Promotion gate: every assertion green on the branch, `rg google_user_id` clean in `src/`.

---

## 8. Rollout timeline (summer, low-stakes window)

1. **Branch + schema:** create the re-keyed schema with FKs on a Supabase branch.
2. **Code refactor** behind the existing flag discipline; merge to a `rekey` branch.
3. **Verify** (Section 7) on the DB branch.
4. **Turn on the RLS net** (`SUPABASE_RLS_USER_CLIENT=on`) with `app_uid()` remapped to
   email → `students.id`, so the database is a real backstop at launch. *(Decision D2.)*
5. **Go-live reset** migration on production during the wipe.
6. **Deploy** the re-keyed code.
7. **Post-launch watch:** a daily integrity check (zero orphans, one-id-per-email) for the
   first weeks — I can schedule this.

Rollback: until step 5, production is untouched; the whole effort lives on a branch.

---

## 9. Decisions for you (these change the build)

- **D1 — Drop `students.google_user_id`?** Recommend **yes**: one source of truth, sub
  lives only in `student_identities`. Keeping it invites drift back in.
- **D2 — Turn the per-user RLS net ON at launch?** Recommend **yes**: at 500 students the
  database backstop is worth it, and the re-key makes `app_uid()` map cleanly to
  `students.id`. Cost: re-test the RLS policies against the new key.
- **D3 — Exact wipe scope.** Confirm: wipe all students + their work + enrollments, keep
  staff accounts, curriculum, avatar catalog, rewards catalog. Do your own staff *test*
  avatars/XP get wiped too (recommend yes) or preserved?
- **D4 — Re-import courses/roster from Google Classroom next year** (confirmed: yes, new
  sections + new rosters). So `courses`/`course_students` are replaced each year, and we
  need the *repeatable* lifecycle in Section 10, not just a one-time wipe.
- **D6 — Returning student (same email next year): continue or reset? → DECIDED: CONTINUE.**
  Math mastery must persist year over year. A returning email reactivates the existing
  `students.id`, so the longitudinal math/mastery spine carries forward untouched; a
  brand-new email is a brand-new student.
- **D5 — Retention at rollover → CONSTRAINED BY D6: archive (soft) by default.** Because a
  hard delete of a student would destroy the very mastery D6 says must persist, the yearly
  rollover **archives** (deactivates + hides) rather than deletes. A true **purge** is a
  separate, deliberate action reserved for students confirmed gone for good (graduated /
  left district). Open sub-question: what event triggers a purge, and after what retention
  window? (Until you decide, default = archive forever, never auto-purge.)

---

## 10. Yearly section & student lifecycle (archive & delete)

You'll reimport new sections + rosters every year, so retiring the old cohort has to be a
**repeatable, self-serve operation**, not a yearly hand-written SQL script. The go-live
reset in Section 6 is simply the *first run* of this same machinery.

### Add the missing dimension
Your tables have soft-state flags (`students.is_active`, `course_students.enrollment_state`,
`courses.course_state`) but **no school-year**. Add it so a cohort is addressable:
- `courses.school_year text` (e.g. `'2026-27'`) + `courses.archived_at timestamptz`
- `students.cohort_year text` (year first enrolled) — informational; identity stays `students.id`
- An index on `courses.school_year` for fast per-year operations.

### Two-stage offboarding (recommended)
1. **Archive** (end of year, reversible): set the year's `courses.archived_at`,
   `course_state='ARCHIVED'`; set their `course_students.enrollment_state='archived'`;
   set `students.is_active=false` for anyone not enrolled in an *active* section. Archived
   sections/students drop out of every active surface (teacher dashboards, leaderboards,
   rosters) but all data is retained and fully reversible.
2. **Purge** (after your retention window — e.g. the following summer, or per district
   policy): hard-delete archived sections and any student whose only enrollments are
   archived and who hasn't returned. With the Section 3 FKs + `ON DELETE CASCADE`, deleting
   the `students` row removes every trace of their work in one statement — no orphan leaks.

"Delete" (D5) is just running the purge immediately instead of after a window.

### Returning students
On reimport, a roster email that matches an existing `students` row **reactivates** it
(`is_active=true`, new section enrollment) rather than creating a duplicate — preserving
the longitudinal spine (D6). A new email is a new student. Unique-email + one-`students.id`
makes this automatic; no fork is possible.

**Mastery persistence is the headline guarantee.** `math_competency_records`,
`math_competency_focus` rollups, and `mastery_records` all hang off the stable
`students.id`. Archive only flips activity flags — it never touches those rows — so a
returning student resumes their math growth exactly where they left off, across any number
of years. The *only* thing that ever erases mastery is an explicit purge of a
confirmed-departed student. Archive is therefore the safe default, and the math spine is
durable by construction.

### Self-serve tooling (so you never touch SQL)
Admin endpoints + buttons, each behind a typed confirmation:
- **Archive year** `POST /api/admin/lifecycle/archive { school_year }`
- **Reactivate / unarchive** (undo, before purge)
- **Purge archived** `POST /api/admin/lifecycle/purge { school_year, confirm }` — guarded
  by a count preview ("this will permanently delete N students and their work") and a
  dry-run mode that reports counts without deleting.
- A **yearly runbook** doc: archive → verify dashboards clean → (optionally wait) → import
  new sections → purge prior cohort.

### Safety rails
- Purge is transactional, dry-run-first, and prints the exact preserve/delete counts.
- Curriculum, avatar catalog, rewards catalog, staff accounts, and the economy config are
  **never** touched by archive or purge — only student/enrollment rows.
- A returning student's reactivation is logged, so an accidental archive is always undoable
  until purge.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Missed `google_user_id` reference ships a broken surface | `rg` gate must be clean; type-branded `StudentId`; branch verification covers every surface |
| RLS net mis-scopes and hides legitimate rows | App-layer scoping stays as primary; RLS is defense-in-depth; flag-gated, smoke-tested before flip |
| First-login race creates a dup | `students.email` unique + idempotent resolver (already proven) |
| Wipe deletes something it shouldn't | Transactional, explicit preserve-list, dry-run row counts on a branch first |
| FK type change (`text`→`uuid`) on a non-empty table | Only run on the wiped/clean schema; never against live student data |
```

