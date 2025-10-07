import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

console.log('🔍 Testing Supabase Connection...\n')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment Variables:')
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
console.log('')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables!')
  process.exit(1)
}

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test 1: Simple query
    console.log('\n📝 Test 1: Select from lessons table')
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, slug')
      .limit(5)
    
    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError.message)
      console.error('   Details:', lessonsError)
    } else {
      console.log('✅ Successfully fetched lessons:', lessons?.length || 0, 'records')
      if (lessons && lessons.length > 0) {
        console.log('   Sample:', lessons[0])
      }
    }
    
    // Test 2: Query assignments table
    console.log('\n📝 Test 2: Select from assignments table')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title')
      .limit(5)
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError.message)
      console.error('   Details:', assignmentsError)
    } else {
      console.log('✅ Successfully fetched assignments:', assignments?.length || 0, 'records')
      if (assignments && assignments.length > 0) {
        console.log('   Sample:', assignments[0])
      }
    }
    
    // Test 3: Query students table
    console.log('\n📝 Test 3: Select from students table')
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email')
      .limit(5)
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError.message)
      console.error('   Details:', studentsError)
    } else {
      console.log('✅ Successfully fetched students:', students?.length || 0, 'records')
      if (students && students.length > 0) {
        console.log('   Sample:', students[0])
      }
    }
    
    // Test 4: List all tables
    console.log('\n📝 Test 4: List all tables')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message)
    } else {
      console.log('✅ Database tables:')
      tables?.forEach(t => console.log('   -', t.table_name))
    }
    
    console.log('\n✅ Database connection test complete!')
    
  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error)
    process.exit(1)
  }
}

testConnection()
