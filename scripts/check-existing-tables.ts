#!/usr/bin/env tsx
/**
 * Check what tables already exist in the Supabase database
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const EXPECTED_TABLES = [
  'units',
  'lessons',
  'question_bank',
  'question_usage_log',
  'vocabulary_sets',
  'vocabulary_terms',
  'vocabulary_usage',
  'student_activity',
  'assignment_submissions',
  'lesson_progress',
  'assignment_analytics',
  'courses',
  'students',
  'lesson_assignments',
  'assignment_assignments',
  'student_lesson_assignments',
  'student_assignment_assignments',
  'assignment_reminders',
  'vocabulary_game_scores',
  'video_question_responses',
  'gradebook_entries'
]

async function checkTables() {
  console.log('🔍 Checking Supabase database tables...\n')
  
  const results = {
    existing: [] as string[],
    missing: [] as string[]
  }

  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
      
      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.message.includes('does not exist') || error.code === '42P01') {
          results.missing.push(tableName)
        } else {
          console.log(`⚠️  ${tableName}: ${error.message}`)
        }
      } else {
        results.existing.push(tableName)
      }
    } catch (err) {
      console.error(`❌ Error checking ${tableName}:`, err)
      results.missing.push(tableName)
    }
  }

  console.log('✅ EXISTING TABLES:')
  if (results.existing.length === 0) {
    console.log('   (none)')
  } else {
    results.existing.forEach(table => console.log(`   ✓ ${table}`))
  }

  console.log('\n❌ MISSING TABLES:')
  if (results.missing.length === 0) {
    console.log('   (none - all tables exist!)')
  } else {
    results.missing.forEach(table => console.log(`   ✗ ${table}`))
  }

  console.log('\n📊 SUMMARY:')
  console.log(`   Total tables checked: ${EXPECTED_TABLES.length}`)
  console.log(`   Existing: ${results.existing.length}`)
  console.log(`   Missing: ${results.missing.length}`)

  if (results.missing.length > 0) {
    console.log('\n🔧 RECOMMENDATION:')
    console.log('   Run the appropriate migration(s) to create missing tables.')
    console.log('   See: docs/DATABASE_FIX_GUIDE.md')
  } else {
    console.log('\n✨ All tables exist! Database is fully set up.')
  }

  return results
}

checkTables().catch(console.error)
