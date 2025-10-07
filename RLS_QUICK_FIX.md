# Quick Fix: Database Not Returning Data After RLS

## Problem
After enabling Row Level Security (RLS), your API routes can't access the database because they're using the anon key which is now subject to RLS policies.

## Immediate Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Click on **Settings** (gear icon) → **API**
3. Find the **Project API keys** section
4. Copy the `service_role` key (⚠️ **Keep this secret!** Never expose in client-side code)

### Step 2: Add Service Role Key to Environment

Add this line to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## What Changed

I've updated `src/lib/supabase.ts` to export two clients:

1. **`supabase`** - Uses anon key, subject to RLS (for client-side)
2. **`supabaseAdmin`** - Uses service role key, bypasses RLS (for server-side API routes)

## Next Steps: Update API Routes

Your API routes currently use `supabase` but should use `supabaseAdmin` for server-side operations. Here's the pattern:

### Before (Current - Broken with RLS):
```typescript
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { data } = await supabase
    .from('assignments')
    .select('*')
  // ...
}
```

### After (Works with RLS):
```typescript
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { data } = await supabaseAdmin  // Use supabaseAdmin instead
    .from('assignments')
    .select('*')
  // ...
}
```

## Automated Fix Script

I can help you update all API routes automatically. Would you like me to:

1. **Find all API routes** that use `supabase`
2. **Update them** to use `supabaseAdmin`
3. **Test** that everything works

This will ensure all your API routes bypass RLS as intended for server-side operations.

## Temporary Rollback (If Needed)

If you need to temporarily disable RLS while we fix the API routes, run this in Supabase SQL Editor:

```sql
-- Temporarily disable RLS (NOT RECOMMENDED for production)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;
```

⚠️ **Warning**: Only use this temporarily in development! You'll need to re-enable RLS before deploying.

## Why This Happens

- **Client-side code** (browser) → Uses `supabase` (anon key) → Subject to RLS ✅
- **API routes** (server) → Should use `supabaseAdmin` (service role key) → Bypasses RLS ✅
- **Your current API routes** → Using `supabase` (anon key) → Blocked by RLS ❌

The service role key allows your server-side code to access the database without RLS restrictions, while client-side code still respects RLS for security.

## Security Note

✅ **Service role key** should ONLY be used in:
- API routes (server-side)
- Server-side functions
- Backend scripts

❌ **NEVER expose** service role key in:
- Client-side code
- Environment variables starting with `NEXT_PUBLIC_`
- Git repositories
- Public URLs

---

**Let me know once you've added the service role key and I'll help update all the API routes!**
