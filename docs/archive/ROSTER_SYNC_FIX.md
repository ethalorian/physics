# Roster Sync Function Parameter Fix

## Issue
The roster import was failing with error:
```
Could not find the function public.sync_course(p_course_state, p_creation_time, p_description, p_google_course_id, p_name, p_owner_id, p_room, p_section, p_update_time) in the schema cache
```

## Root Cause
The API route (`src/app/api/roster/import/route.ts`) was calling the database functions with parameters that don't match the actual function signatures defined in the migration (`supabase/migrations/fix_function_search_paths.sql`).

### Function Signature Mismatch

**sync_course**
- Database function expects:
  ```sql
  sync_course(
    p_google_course_id TEXT,
    p_name TEXT,
    p_section TEXT,
    p_description TEXT,
    p_room TEXT,
    p_teacher_email TEXT
  )
  ```
- API was calling with: `p_owner_id`, `p_course_state`, `p_creation_time`, `p_update_time` (incorrect parameters)

**sync_student**  
- Database function expects:
  ```sql
  sync_student(
    p_google_user_id TEXT,
    p_email TEXT,
    p_name TEXT,
    p_photo_url TEXT,
    p_course_id UUID
  )
  ```
- API was calling with: `p_first_name`, `p_last_name`, `p_profile_photo_url`, `p_enrollment_state` (incorrect parameters)

## Fix Applied

### 1. Fixed sync_course call (lines 48-56)
**Before:**
```typescript
await supabaseAdmin.rpc('sync_course', {
  p_google_course_id: course.id,
  p_name: course.name,
  p_section: course.section || null,
  p_description: course.description || null,
  p_room: course.room || null,
  p_owner_id: course.ownerId || session.user.id,      // ❌ Wrong parameter
  p_course_state: course.courseState || 'ACTIVE',     // ❌ Wrong parameter
  p_creation_time: course.creationTime ? ... : null,  // ❌ Wrong parameter
  p_update_time: course.updateTime ? ... : null       // ❌ Wrong parameter
})
```

**After:**
```typescript
await supabaseAdmin.rpc('sync_course', {
  p_google_course_id: course.id,
  p_name: course.name,
  p_section: course.section || null,
  p_description: course.description || null,
  p_room: course.room || null,
  p_teacher_email: session.user.email  // ✅ Correct parameter
})
```

### 2. Fixed sync_student call (lines 88-95)
**Before:**
```typescript
await supabaseAdmin.rpc('sync_student', {
  p_google_user_id: student.userId,
  p_email: email,
  p_name: fullName,
  p_first_name: firstName,              // ❌ Wrong parameter
  p_last_name: lastName,                // ❌ Wrong parameter
  p_profile_photo_url: photoUrl,        // ❌ Wrong parameter name
  p_course_id: courseId,                // ❌ String instead of UUID
  p_enrollment_state: 'ACTIVE'          // ❌ Wrong parameter
})
```

**After:**
```typescript
await supabaseAdmin.rpc('sync_student', {
  p_google_user_id: student.userId,
  p_email: email,
  p_name: fullName,
  p_photo_url: photoUrl,           // ✅ Correct parameter name
  p_course_id: courseData          // ✅ UUID from sync_course
})
```

## Key Changes
1. ✅ Removed extra parameters that don't exist in database functions
2. ✅ Fixed parameter names to match function signatures
3. ✅ Now passing the UUID returned from `sync_course` to `sync_student` instead of the Google Classroom course ID string
4. ✅ Simplified to only pass the required parameters

## Testing
To test the fix:
1. Go to the roster import page in your admin dashboard
2. Select a Google Classroom course
3. Click "Import Roster"
4. Students should now sync successfully to the database

## Related Files
- **API Route**: `src/app/api/roster/import/route.ts`
- **Database Functions**: `supabase/migrations/fix_function_search_paths.sql` (lines 160-297)
- **Function Definitions**:
  - `sync_course`: lines 160-206
  - `sync_student`: lines 209-255

## Additional Issue Found: Missing Tables

After fixing the parameter mismatch, a second error appeared:
```
column "teacher_email" of relation "courses" does not exist
```

### Root Cause
The Google Classroom integration tables (`courses`, `students`, `course_students`) were never created in the database, even though the sync functions were expecting them.

### Solution
Created a new migration file: `supabase/migrations/create_google_classroom_tables.sql`

This migration creates:
- **courses** table - Stores Google Classroom courses with columns:
  - `id` (UUID primary key)
  - `google_course_id` (TEXT, unique)
  - `name`, `section`, `description`, `room`
  - `teacher_email` (TEXT)
  - `student_count` (INTEGER)
  - Timestamps: `created_at`, `updated_at`

- **students** table - Stores student information:
  - `id` (UUID primary key)
  - `google_user_id` (TEXT, unique)
  - `email`, `name`, `photo_url`
  - Timestamps: `created_at`, `updated_at`

- **course_students** table - Junction table for many-to-many relationships:
  - `id` (UUID primary key)
  - `course_id` (UUID, references courses)
  - `student_id` (UUID, references students)
  - `enrollment_state` (TEXT, default 'ACTIVE')
  - Unique constraint on (course_id, student_id)

### Required Action
**You must run this migration in Supabase before roster import will work:**

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Open and run: `supabase/migrations/create_google_classroom_tables.sql`
4. Verify tables were created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('courses', 'students', 'course_students');
   ```

## Status
✅ **API Parameters Fixed** - The API now calls the database functions with the correct parameters.
⚠️ **Database Tables Required** - You must run the new migration before testing roster import.
