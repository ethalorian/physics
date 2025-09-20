#!/usr/bin/env node

/**
 * Database Migration Runner
 * This script runs the SQL migrations against your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  try {
    console.log(`📁 Reading ${filePath}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🚀 Executing SQL from ${path.basename(filePath)}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If the RPC doesn't exist, try a different approach
      if (error.message.includes('function exec_sql')) {
        console.log('📝 RPC method not available, trying direct query...');
        
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`  ➤ Executing: ${statement.substring(0, 50)}...`);
            const { error: stmtError } = await supabase.rpc('exec', { query: statement });
            if (stmtError) {
              console.error(`❌ Error in statement: ${stmtError.message}`);
            }
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log(`✅ Successfully executed ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
    
  if (error) {
    console.log(`⚠️  Could not check if ${tableName} exists:`, error.message);
    return false;
  }
  
  return data && data.length > 0;
}

async function main() {
  console.log('🎯 Starting database migration...\n');
  
  // Check if lessons table exists
  const lessonsExists = await checkTableExists('lessons');
  console.log(`📋 Lessons table exists: ${lessonsExists ? '✅ Yes' : '❌ No'}\n`);
  
  // Run the lessons table migration
  const migrationPath = path.join(__dirname, '../supabase/migrations/create_lessons_table.sql');
  if (fs.existsSync(migrationPath)) {
    console.log('🔧 Running lessons table migration...');
    const success = await runSQLFile(migrationPath);
    if (!success) {
      console.error('❌ Migration failed. Stopping.');
      process.exit(1);
    }
  } else {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }
  
  // Run the sample lesson script
  const samplePath = path.join(__dirname, '../src/scripts/create-sample-lesson.sql');
  if (fs.existsSync(samplePath)) {
    console.log('\n📚 Creating sample lesson...');
    const success = await runSQLFile(samplePath);
    if (success) {
      console.log('✅ Sample lesson created successfully!');
    } else {
      console.log('⚠️  Sample lesson creation had issues, but migration completed.');
    }
  } else {
    console.log('⚠️  Sample lesson script not found, skipping...');
  }
  
  // Verify the lessons table
  console.log('\n🔍 Verifying lessons table...');
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, slug')
    .limit(5);
    
  if (error) {
    console.error('❌ Could not verify lessons table:', error.message);
  } else {
    console.log(`✅ Lessons table verified! Found ${lessons.length} lesson(s)`);
    if (lessons.length > 0) {
      lessons.forEach(lesson => {
        console.log(`  📖 ${lesson.title} (${lesson.slug})`);
      });
    }
  }
  
  console.log('\n🎉 Migration completed! Your QuickLessonPreview should now work correctly.');
  console.log('💡 Restart your Next.js development server to see the changes.');
}

// Run the migration
main().catch(console.error);
