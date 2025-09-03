import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Lesson = {
  id: string
  title: string
  slug: string
  content: string
  description?: string
  order_index?: number
  published: boolean
  created_at: string
}
