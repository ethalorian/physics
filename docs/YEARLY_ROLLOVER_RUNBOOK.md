# Yearly Rollover Runbook

How to retire one school year and stand up the next, safely. Identity is
`students.id`; the math/mastery spine persists across years for any returning
student. Nothing here ever touches curriculum, the avatar catalog, the rewards
catalog, or staff accounts.

All actions are **admin-only** and most are **reversible until you purge**.

---

## End of year — archive the outgoing cohort

1. Open the lifecycle view (admin). It lists each `school_year` with its section
   count, archived status, and enrolled-student count
   (`GET /api/admin/lifecycle`).
2. **Archive the year:** `POST /api/admin/lifecycle/archive { "school_year": "2026-27" }`.
   - Hides that year's sections and deactivates students with no active
     enrollment. Returns `{ sections_archived, students_deactivated }`.
   - Reversible. Mastery, XP, avatars, and all work are **retained, not deleted.**
3. Confirm the active dashboards (teacher views, leaderboards) no longer show the
   old cohort.

## Start of next year — import the new roster

4. Create/sync the new sections from Google Classroom (roster import). New
   students get a fresh `students.id`; **returning students (same email) reactivate
   their existing id and keep their math spine automatically.**
5. If a specific student needs reactivating by hand:
   `POST /api/admin/lifecycle/reactivate { "email": "student@district.org" }`.

## Optional, later — purge students who are truly gone

Only do this for students confirmed departed (graduated / left the district).
Purge is **permanent** and cascades away all of that student's work.

6. **Dry run first (deletes nothing):**
   `POST /api/admin/lifecycle/purge { "school_year": "2025-26" }`
   → returns the exact list and count of students that *would* be purged
   (only inactive students whose sole enrollments are in that archived year).
7. Review the previewed list.
8. **Commit the purge:**
   `POST /api/admin/lifecycle/purge { "school_year": "2025-26", "confirm": true }`
   → returns `{ deleted }`.

> Default posture: archive forever, never auto-purge. There is no scheduled or
> automatic deletion — a person must explicitly run step 8.

---

## One-time pre-launch cutover (first run only)

Before the very first go-live, run the cutover migration
`supabase/migrations/20260615_golive_rekey_to_students_id.sql` once, on a
maintenance window with no active students:

1. Back up the database.
2. Run the migration (wipes existing student data, re-keys work tables to
   `students.id` with FK + cascade, drops `google_user_id`, installs the
   lifecycle functions).
3. Deploy the re-keyed application code (same release).
4. Set `SUPABASE_RLS_USER_CLIENT=on` to engage the database backstop, then
   smoke-test (login on two devices → one identity; roster import; mastery,
   gradebook, leaderboard, avatar/XP; archive + dry-run purge).
5. Import the first real rosters.

After this, you never touch SQL — the yearly steps above are all API/UI actions.
