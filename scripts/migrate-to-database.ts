/**
 * Migration Script: localStorage to Supabase Database
 * 
 * This script migrates assignments and submissions from browser localStorage
 * to the Supabase PostgreSQL database.
 * 
 * Run this script once per browser/user to migrate existing data.
 */

import { createClient } from '@supabase/supabase-js'

// Types
interface Assignment {
  id: string
  title: string
  description?: string
  instructions?: string
  questions: any[]
  total_points: number
  lesson_id?: string
  due_date?: string
  published: boolean
  created_at: string
  updated_at: string
}

interface Submission {
  id: string
  assignment_id: string
  user_id: string
  answers: Record<string, any>
  score?: number
  max_score?: number
  feedback?: Record<string, string>
  rubric_grades?: any[]
  status: 'partial' | 'submitted' | 'graded'
  submitted_at: string
  graded_at?: string
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Migrate assignments from localStorage to database
 */
export async function migrateAssignments(userEmail: string): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    // Get assignments from localStorage
    const assignmentsJson = localStorage.getItem('physics-assignments')
    if (!assignmentsJson) {
      console.log('No assignments found in localStorage')
      return results
    }

    const assignments: Assignment[] = JSON.parse(assignmentsJson)
    console.log(`Found ${assignments.length} assignments to migrate`)

    // Migrate each assignment
    for (const assignment of assignments) {
      try {
        // Prepare data for database
        const assignmentData = {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || null,
          instructions: assignment.instructions || null,
          questions: assignment.questions,
          total_points: assignment.total_points,
          lesson_id: assignment.lesson_id || null,
          due_date: assignment.due_date || null,
          published: assignment.published,
          created_by: userEmail,
          created_at: assignment.created_at,
          updated_at: assignment.updated_at
        }

        // Insert into database
        const { error } = await supabase
          .from('assignments')
          .upsert(assignmentData, { onConflict: 'id' })

        if (error) {
          console.error(`Failed to migrate assignment ${assignment.id}:`, error)
          results.failed++
          results.errors.push(`Assignment "${assignment.title}": ${error.message}`)
        } else {
          console.log(`✓ Migrated assignment: ${assignment.title}`)
          results.success++
        }

      } catch (err) {
        console.error(`Error processing assignment ${assignment.id}:`, err)
        results.failed++
        results.errors.push(`Assignment "${assignment.title}": ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

  } catch (err) {
    console.error('Error reading assignments from localStorage:', err)
    results.errors.push(`Failed to read localStorage: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  return results
}

/**
 * Migrate submissions from localStorage to database
 */
export async function migrateSubmissions(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    // Get submissions from localStorage
    const submissionsJson = localStorage.getItem('physics-submissions')
    if (!submissionsJson) {
      console.log('No submissions found in localStorage')
      return results
    }

    const submissions: Submission[] = JSON.parse(submissionsJson)
    console.log(`Found ${submissions.length} submissions to migrate`)

    // Migrate each submission
    for (const submission of submissions) {
      try {
        // Prepare data for database
        const submissionData = {
          id: submission.id,
          assignment_id: submission.assignment_id,
          user_id: submission.user_id,
          answers: submission.answers,
          score: submission.score || null,
          max_score: submission.max_score || null,
          feedback: submission.feedback || {},
          rubric_grades: submission.rubric_grades || [],
          status: submission.status,
          submitted_at: submission.submitted_at,
          graded_at: submission.graded_at || null
        }

        // Insert into database
        const { error } = await supabase
          .from('submissions')
          .upsert(submissionData, { onConflict: 'id' })

        if (error) {
          console.error(`Failed to migrate submission ${submission.id}:`, error)
          results.failed++
          results.errors.push(`Submission ${submission.id}: ${error.message}`)
        } else {
          console.log(`✓ Migrated submission: ${submission.id}`)
          results.success++
        }

      } catch (err) {
        console.error(`Error processing submission ${submission.id}:`, err)
        results.failed++
        results.errors.push(`Submission ${submission.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

  } catch (err) {
    console.error('Error reading submissions from localStorage:', err)
    results.errors.push(`Failed to read localStorage: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  return results
}

/**
 * Main migration function
 */
export async function runMigration(userEmail: string) {
  console.log('🚀 Starting migration from localStorage to Supabase...\n')

  // Migrate assignments
  console.log('📝 Migrating assignments...')
  const assignmentResults = await migrateAssignments(userEmail)
  console.log(`\nAssignments: ${assignmentResults.success} succeeded, ${assignmentResults.failed} failed`)
  
  if (assignmentResults.errors.length > 0) {
    console.log('\nAssignment errors:')
    assignmentResults.errors.forEach(err => console.log(`  ❌ ${err}`))
  }

  // Migrate submissions
  console.log('\n📋 Migrating submissions...')
  const submissionResults = await migrateSubmissions()
  console.log(`\nSubmissions: ${submissionResults.success} succeeded, ${submissionResults.failed} failed`)
  
  if (submissionResults.errors.length > 0) {
    console.log('\nSubmission errors:')
    submissionResults.errors.forEach(err => console.log(`  ❌ ${err}`))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Assignments: ${assignmentResults.success + assignmentResults.failed}`)
  console.log(`  ✓ Migrated: ${assignmentResults.success}`)
  console.log(`  ❌ Failed: ${assignmentResults.failed}`)
  console.log(`\nTotal Submissions: ${submissionResults.success + submissionResults.failed}`)
  console.log(`  ✓ Migrated: ${submissionResults.success}`)
  console.log(`  ❌ Failed: ${submissionResults.failed}`)
  console.log('='.repeat(60))

  // Backup recommendation
  if (assignmentResults.failed === 0 && submissionResults.failed === 0) {
    console.log('\n✅ Migration completed successfully!')
    console.log('\n⚠️  IMPORTANT: Before clearing localStorage, make sure to:')
    console.log('   1. Verify all data in Supabase dashboard')
    console.log('   2. Test the application with the new database')
    console.log('   3. Keep a backup of localStorage just in case')
    console.log('\nTo backup localStorage, run:')
    console.log('   localStorage.getItem("physics-assignments")  // Copy this')
    console.log('   localStorage.getItem("physics-submissions")  // Copy this')
  } else {
    console.log('\n⚠️  Migration completed with errors. Review the errors above.')
    console.log('Do NOT clear localStorage until all errors are resolved.')
  }

  return {
    assignments: assignmentResults,
    submissions: submissionResults
  }
}

// Browser-based migration (for dev console)
if (typeof window !== 'undefined') {
  ;(window as any).migrateToDatabase = runMigration
  ;(window as any).migrateAssignments = migrateAssignments
  ;(window as any).migrateSubmissions = migrateSubmissions
}

