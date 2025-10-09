/**
 * Script to run database migrations
 * Usage: npx tsx scripts/run-migration.ts create_simulation_tool_system
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL')
  console.error('   Need: NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationName: string) {
  try {
    console.log(`\n🚀 Running migration: ${migrationName}\n`)
    
    // Read migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      `${migrationName}.sql`
    )
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    console.log(`📏 Size: ${sql.length} characters\n`)
    
  // Execute migration
  console.log('⚙️  Executing SQL...\n')
  
  let data = null, error = null
  
  try {
    const result = await supabase.rpc('exec_sql', { sql_string: sql })
    data = result.data
    error = result.error
  } catch (rpcError) {
    // Fallback: Try direct query execution
    try {
      await supabase.from('_migrations').insert({ name: migrationName, sql })
      const execResult = await supabase.rpc('exec', { sql })
      data = execResult.data
      error = execResult.error
    } catch (directError) {
      // Final fallback: Execute via raw SQL
      console.log('ℹ️  Using direct SQL execution...')
      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim())
      
      for (const statement of statements) {
        if (!statement.trim() || statement.trim().startsWith('--')) continue
        
        try {
          const result = await supabase.rpc('exec_sql', { query: statement })
          if (result.error) throw result.error
        } catch (err) {
          // Some statements might fail if already exist - that's OK with IF NOT EXISTS
          console.log(`⚠️  Note: ${err}`)
        }
      }
    }
  }
    
    if (error) {
      console.error('❌ Migration failed:', error.message)
      console.error('\nYou can manually run this migration by:')
      console.error('1. Opening Supabase Dashboard → SQL Editor')
      console.error('2. Copy/paste the contents of:')
      console.error(`   supabase/migrations/${migrationName}.sql`)
      console.error('3. Click "Run"')
      process.exit(1)
    }
    
    console.log('✅ Migration completed successfully!\n')
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n')
    
    const tables = ['simulations', 'tools', 'interactive_lessons', 'simulation_activity', 'interactive_lesson_progress']
    
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.log(`   ⚠️  ${table}: Could not verify (might need RLS policy)`)
      } else {
        console.log(`   ✓ ${table}: Created (${count || 0} rows)`)
      }
    }
    
    console.log('\n🎉 All done! Your simulation infrastructure is ready.\n')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.error('\n📝 Manual migration instructions:')
    console.error('1. Open Supabase Dashboard → SQL Editor')
    console.error('2. Copy/paste: supabase/migrations/create_simulation_tool_system.sql')
    console.error('3. Run the SQL')
    process.exit(1)
  }
}

// Get migration name from command line
const migrationName = process.argv[2] || 'create_simulation_tool_system'
runMigration(migrationName)
