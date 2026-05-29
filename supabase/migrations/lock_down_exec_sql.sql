-- Lock down the exec_sql arbitrary-SQL primitive
-- ------------------------------------------------------------------
-- exec_sql() can run ANY SQL string. The web-reachable caller
-- (POST /api/admin/run-migration) has been deleted. The only remaining
-- legitimate caller is the local dev CLI scripts/run-migration.ts, which
-- runs with the service-role key.
--
-- This migration revokes EXECUTE from every client-facing role so the
-- function can no longer be invoked with an anon/authenticated JWT — it is
-- reachable only by the service role (server-side / CLI).
--
-- RECOMMENDED NEXT STEP (not done here to avoid breaking `npm run db:migrate`):
-- once you move migrations to the Supabase CLI or dashboard, drop the
-- function entirely:
--     DROP FUNCTION IF EXISTS exec_sql(text);
-- (adjust the argument signature to match your definition).
-- ------------------------------------------------------------------

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname  AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'exec_sql'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated;',
      fn.schema_name, fn.func_name, fn.args
    );
  END LOOP;
END $$;
