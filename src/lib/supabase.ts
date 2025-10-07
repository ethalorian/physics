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

// Server-side client for API routes (bypasses RLS with service role key)
// Use this in API routes to bypass RLS policies
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || supabaseAnonKey || '', // Fallback to anon key if service role not set
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
