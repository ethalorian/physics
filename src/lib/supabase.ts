import { createClient } from '@supabase/supabase-js'

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
}

// Client for browser/client-side use (subject to RLS)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Server-side client for API routes (bypasses RLS with the service role key).
// No anon-key fallback: with RLS now enforced across the schema, a missing
// service-role key must fail loudly rather than silently degrade to an
// RLS-restricted anon client (which would break server reads/writes in subtle
// ways). The guard is server-only — SUPABASE_SERVICE_ROLE_KEY is never present
// in the browser, so a top-level throw there would crash the client bundle.
if (typeof window === 'undefined' && !supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase access. ' +
    'Set it in the environment — supabaseAdmin no longer falls back to the anon key.'
  )
}

// Use this in API routes to bypass RLS policies
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Lesson = {
  id: string  // UUID from database
  title: string
  slug: string
  content: string
  description?: string
  unit: string
  lesson_number: number
  published: boolean
  videos?: any[]  // Array of video objects
  objectives?: string[]  // Array of learning objectives
  estimated_time?: number  // Estimated time in minutes
  created_at: string
  updated_at?: string
}
