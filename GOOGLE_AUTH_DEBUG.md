# Google Sign-In Debug Guide

## The Problem

You're seeing lessons in SQL but not in the dashboard because:

1. **Google Sign-In** → Creates NextAuth session
2. **RLS Policies** → Check Supabase `auth.uid()`
3. **Mismatch** → NextAuth session user ≠ Supabase user

Your RLS policies look for a user in the `users` table using `auth.uid()`, but Google Sign-In might not be creating that user properly.

## Quick Diagnostic

Run this in Supabase SQL Editor:

```sql
-- Check if you exist in the users table
SELECT 
  id,
  email,
  name,
  created_at
FROM public.users
WHERE email = 'YOUR-GOOGLE-EMAIL@gmail.com';

-- Check current auth context (run this while logged in to the app)
SELECT auth.uid() as my_user_id;

-- Check if get_user_email() works
SELECT get_user_email() as my_email;

-- Test if you're recognized as admin
SELECT is_admin_or_teacher() as am_i_admin;
```

## Expected Results

### ✅ If Working:
- `users` table shows your email
- `auth.uid()` returns a UUID
- `get_user_email()` returns your email
- `is_admin_or_teacher()` returns `true`

### ❌ If Broken:
- `users` table is empty or missing your email
- `auth.uid()` returns `NULL`
- `get_user_email()` returns `NULL`
- `is_admin_or_teacher()` returns `false`

## The Root Cause

Your app uses **NextAuth** for authentication, but the RLS policies expect **Supabase Auth**. These are different systems:

- **NextAuth**: Handles Google OAuth, creates JWT tokens
- **Supabase Auth**: Separate authentication system with `auth.uid()`

When you use the Supabase client from the browser, it doesn't know about your NextAuth session!

## Solutions

### Option 1: Fix RLS to Work with NextAuth (Recommended)

Since you're fetching data client-side, we need to bypass RLS or fetch data server-side where we have the session.

### Option 2: Use Server-Side Data Fetching

Fetch lessons in an API route where you have access to NextAuth session, then pass to the client.

### Option 3: Switch to Supabase Auth

Replace NextAuth with Supabase Auth (big change, not recommended now).

## Quick Fix: Fetch Lessons Server-Side

I'll create an API route that fetches lessons with proper authentication.
