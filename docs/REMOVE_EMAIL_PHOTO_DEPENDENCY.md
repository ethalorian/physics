# Removing Student Email and Photo Dependencies from Google Classroom

## Overview
This document describes the changes made to remove the dependency on student emails and photos from Google Classroom integration. These changes improve privacy, reduce required OAuth scopes, and simplify the system.

## Changes Made

### 1. Google Classroom API (`src/lib/google-classroom.ts`)
- **Removed fields from interfaces**: 
  - `emailAddress` removed from `GoogleClassroomStudent` and `GoogleClassroomEnrollment`
  - `photoUrl` removed from both interfaces
- **Updated API requests**:
  - `getStudents()` now only requests `students(userId,profile(id,name))` - no email or photo
- **Reduced OAuth scopes**: 
  - Removed `classroom.profile.emails`, `userinfo.email`, and `userinfo.profile`
  - Now only requests necessary classroom scopes

### 2. Roster Import (`src/app/api/roster/import/route.ts`)
- **Uses Google User ID as primary identifier**
- **Generates internal email format**: `{googleUserId}@classroom.local`
- **No longer fetches or stores photo URLs**
- Students are uniquely identified by their Google User ID

### 3. Student Management UI (`src/components/admin/StudentManagement.tsx`)
- **Replaced email display with Google User ID**
- **Removed profile photo display** - now only shows initials avatar
- **Updated CSV export** to include Google User ID instead of email
- **Simplified UI** - removed "Google account connected" indicators

### 4. Database Schema (`supabase/migrations/remove_student_email_photo_requirements.sql`)
- **Updated `sync_student` function**:
  - Generates internal email if not provided
  - Always sets photo_url to NULL
- **Added index on `google_user_id`** for faster lookups
- **Updated existing data**:
  - Converts unknown emails to internal format
  - Clears all photo URLs

### 5. Related Components
- **CreateAssignmentForms**: Updated to display Google User ID instead of email
- **Removed proxy-image API route**: No longer needed since we don't fetch photos

## Benefits

### Privacy Improvements
- No longer requests or stores student email addresses
- No longer requests or stores student profile photos
- Reduces personal information exposure

### Simplified OAuth
- Fewer permissions required from Google
- Easier consent screen approval process
- Reduced security surface area

### System Simplification
- No need for image proxying
- Simpler data model
- Consistent internal identifiers

## How It Works Now

1. **Student Identification**: 
   - Primary key: Google User ID
   - Internal identifier: `{googleUserId}@classroom.local`
   - Display name: Student's full name from Google

2. **Data Flow**:
   ```
   Google Classroom API
   ├── Fetch student (userId, name only)
   ├── Generate internal email
   └── Store in database with Google User ID
   ```

3. **UI Display**:
   - Shows student name
   - Shows Google User ID for identification
   - Uses initials for avatar (no photo)

## Migration Notes

### For Existing Data
The migration script automatically:
- Converts existing unknown emails to internal format
- Clears all photo URLs
- Maintains Google User ID associations

### For New Installations
- No special configuration needed
- System automatically uses Google User IDs
- No email/photo permissions required

## Rollback Considerations
If you need to revert these changes:
1. Restore the old Google Classroom API interfaces
2. Update OAuth scopes to include email/photo permissions
3. Modify the roster import to fetch emails/photos again
4. Update UI components to display emails/photos
5. Run a migration to restore email/photo columns if needed

## Testing Checklist
- [x] Google Classroom connection works without email/photo scopes
- [x] Students can be imported using only Google User ID
- [x] Student Management UI displays correctly without emails/photos
- [x] Assignment creation still works with student selection
- [x] Database functions handle internal email format
- [x] CSV export includes Google User ID

## Notes for Developers
- Always use `google_user_id` as the primary identifier for students
- The `email` field now contains internal identifiers, not real emails
- Photo URLs are deprecated and should not be used
- UI should display Google User ID when student identification is needed
