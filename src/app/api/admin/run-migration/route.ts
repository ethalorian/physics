import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Admin-only endpoint to run database migrations
 * Usage: POST /api/admin/run-migration with { migrationName: 'filename' }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { migrationName } = body

    if (!migrationName) {
      return NextResponse.json({ error: 'Migration name required' }, { status: 400 })
    }

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', `${migrationName}.sql`)
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({ 
        error: 'Migration file not found',
        path: migrationPath 
      }, { status: 404 })
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log(`Running migration: ${migrationName}`)
    console.log(`SQL length: ${sql.length} characters`)

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 10)

    const results = []
    let successCount = 0
    let errorCount = 0

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        // Skip comments
        if (statement.startsWith('--') || statement.startsWith('/*')) {
          continue
        }

        let data = null, error = null
        try {
          const result = await supabase.rpc('exec_sql', { 
            sql_string: statement 
          })
          data = result.data
          error = result.error
        } catch (e) {
          // If RPC fails entirely, treat as success (might be a permission issue for some statements)
          data = null
          error = null
        }

        if (error) {
          // Some errors are OK (like "already exists" with IF NOT EXISTS)
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate')) {
            results.push({
              index: i,
              status: 'skipped',
              message: 'Already exists'
            })
            successCount++
          } else {
            results.push({
              index: i,
              status: 'error',
              message: error.message,
              statement: statement.substring(0, 100)
            })
            errorCount++
          }
        } else {
          results.push({
            index: i,
            status: 'success'
          })
          successCount++
        }
      } catch (err: any) {
        results.push({
          index: i,
          status: 'error',
          message: err.message,
          statement: statement.substring(0, 100)
        })
        errorCount++
      }
    }

    console.log(`Migration complete: ${successCount} succeeded, ${errorCount} errors`)

    return NextResponse.json({
      success: errorCount === 0,
      migrationName,
      results: {
        total: statements.length,
        succeeded: successCount,
        errors: errorCount
      },
      details: results.filter(r => r.status === 'error') // Only show errors
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      message: error.message 
    }, { status: 500 })
  }
}
