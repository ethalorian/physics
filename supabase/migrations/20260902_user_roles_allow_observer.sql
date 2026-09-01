-- The observer role (read-only: global analytics + lesson plans) must be
-- grantable; the old check predates it. (Applied to the live DB 2026-09-02.)
ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text, 'observer'::text, 'student'::text]));
