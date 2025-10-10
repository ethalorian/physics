# Student Enrollment System - Integration Guide

## Quick Start

This guide shows how to integrate the new enrollment system components into your existing admin pages.

---

## 1. Add to Student Management Page

**File to Edit**: `src/app/admin/students/page.tsx` or `src/components/admin/StudentManagement.tsx`

### Import Components

```typescript
import CourseJoinCodeManager from '@/components/admin/CourseJoinCodeManager'
import UnassignedStudentsManager from '@/components/admin/UnassignedStudentsManager'
```

### Add to UI

```typescript
// After course selection and before student list
<div className="space-y-6">
  {/* Unassigned Students - Show first as it's important */}
  <UnassignedStudentsManager />
  
  {selectedCourse && (
    <>
      {/* Join Code Manager - For the selected course */}
      <CourseJoinCodeManager
        courseId={selectedCourse.id}
        courseName={selectedCourse.name}
        currentJoinCode={selectedCourse.join_code}
        joinCodeEnabled={selectedCourse.join_code_enabled}
        joinCodeExpiresAt={selectedCourse.join_code_expires_at}
        maxEnrollments={selectedCourse.max_enrollments}
        onUpdate={() => refreshCourses()}
      />
      
      {/* Existing student list */}
      <StudentList students={students} />
    </>
  )}
</div>
```

---

## 2. Student Dashboard (Already Integrated)

The student dashboard in `src/app/dashboard/page.tsx` is already wrapped with `EnrollmentGate` component.

### What It Does:
- Automatically checks if student has course assignments
- Shows join code interface if not enrolled
- Shows normal dashboard if enrolled
- Refreshes after successful enrollment

### No Additional Changes Needed! ✅

---

## 3. Run Database Migration

Before deploying, run the database migration:

```bash
# Connect to your Supabase database
psql -h your-host -U your-user -d your-database

# Run the migration
\i supabase/migrations/add_course_join_codes.sql

# Verify functions were created
\df *join*
\df *unassigned*
```

---

## 4. Test the System

### Test Auto-Create Student Record

1. Sign out completely
2. Sign in with a new Google account
3. Check database: `SELECT * FROM students WHERE email = 'new@example.com'`
4. Verify record was created ✓

### Test Join Code Generation

1. Go to Admin → Students
2. Select a course
3. Click "Generate Join Code"
4. Verify code appears
5. Copy the code ✓

### Test Student Enrollment

1. Sign out of admin account
2. Sign in with student account
3. Dashboard should show "Join a Course" card
4. Enter the join code from teacher
5. Click "Join Course"
6. Dashboard should refresh and show course content ✓

### Test Unassigned Students

1. Create new student account (don't join any course)
2. Sign in as admin
3. Go to Admin → Students
4. See student in "Unassigned Students" section
5. Assign to a course manually
6. Verify student disappears from unassigned list ✓

---

## 5. Environment Check

Ensure these environment variables are set:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Admin (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 6. Optional: Custom Enrollment Page

You can create a dedicated enrollment page at `/enroll`:

**File**: `src/app/enroll/page.tsx`

```typescript
"use client"

import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import JoinCourseWithCode from '@/components/student/JoinCourseWithCode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function EnrollPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const prefilledCode = searchParams.get('code')

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to join a course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <JoinCourseWithCode 
        onSuccess={(course) => {
          router.push('/dashboard')
        }}
      />
    </div>
  )
}
```

This allows shareable links like: `https://your-site.com/enroll?code=ABC123`

---

## 7. Update Navigation (Optional)

Add enrollment management to admin navigation:

**File**: `src/components/navbar.tsx`

```typescript
{(userRole === 'admin' || userRole === 'teacher') && (
  <div className="flex items-center space-x-4">
    <Link href="/admin/students" className="text-sm font-medium">
      Student Management
    </Link>
    {/* Other admin links */}
  </div>
)}
```

---

## 8. Monitoring & Analytics

### Track Enrollment Methods

```sql
-- Dashboard query for enrollment analytics
SELECT 
  enrolled_via,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM course_students) as percentage
FROM course_students
GROUP BY enrolled_via
ORDER BY count DESC;
```

### Monitor Unassigned Students

```sql
-- Alert query for unassigned students
SELECT 
  email,
  name,
  created_at,
  EXTRACT(DAY FROM NOW() - created_at) as days_unassigned
FROM students
WHERE NOT EXISTS (
  SELECT 1 FROM course_students WHERE student_id = students.id
)
ORDER BY created_at DESC;
```

### Track Join Code Usage

```sql
-- See which join codes are being used
SELECT 
  c.name as course_name,
  c.join_code,
  COUNT(cs.id) as enrollments,
  c.max_enrollments,
  c.join_code_expires_at
FROM courses c
LEFT JOIN course_students cs ON c.id = cs.course_id AND cs.enrolled_via = 'join_code'
WHERE c.join_code IS NOT NULL
GROUP BY c.id
ORDER BY enrollments DESC;
```

---

## 9. Common Customizations

### Change Join Code Length

Edit `supabase/migrations/add_course_join_codes.sql`:

```sql
-- Change FROM 1 FOR 6 to your desired length
v_code := UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8)  -- 8 chars
);
```

### Add Email Notifications

In `src/app/api/courses/enroll/route.ts`:

```typescript
// After successful enrollment
await sendEmail({
  to: session.user.email,
  subject: `Welcome to ${courseData.name}`,
  body: `You've been successfully enrolled...`
})
```

### Custom Join Code Format

Modify the generation function to use specific patterns:

```sql
-- Example: ABC-123 format
v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3)) || 
          '-' || 
          LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
```

---

## 10. Deployment Steps

### Development

```bash
# 1. Run migration locally
npm run db:migrate

# 2. Test all features
npm run dev

# 3. Verify no console errors
```

### Production

```bash
# 1. Commit changes
git add .
git commit -m "feat: add student enrollment system with join codes"

# 2. Push to repository
git push origin main

# 3. Deploy to Vercel/hosting
# Vercel will auto-deploy on push

# 4. Run migration on production database
# Use Supabase dashboard SQL editor or connection string

# 5. Test production deployment
# - Create test student account
# - Generate join code
# - Test enrollment flow
```

---

## Support & Troubleshooting

### Check System Status

```typescript
// Add to admin dashboard
const systemStatus = {
  autoCreateEnabled: true, // From auth.ts
  joinCodesActive: await checkActiveJoinCodes(),
  unassignedCount: await getUnassignedCount()
}
```

### Debug Enrollment Issues

```typescript
// Add logging to enrollment API
console.log('Enrollment attempt:', {
  studentEmail: session.user.email,
  joinCode,
  timestamp: new Date().toISOString()
})
```

### Test Database Functions

```sql
-- Test join code generation
SELECT generate_join_code();

-- Test enrollment
SELECT * FROM enroll_student_with_code('test@example.com', 'ABC123');

-- Test unassigned query
SELECT * FROM get_unassigned_students();
```

---

## ✅ Integration Checklist

- [ ] Database migration applied
- [ ] Functions created and tested
- [ ] Admin components imported
- [ ] Student dashboard wrapped with EnrollmentGate
- [ ] Navigation updated (if needed)
- [ ] Environment variables set
- [ ] Tested auto-create student record
- [ ] Tested join code generation
- [ ] Tested student enrollment
- [ ] Tested unassigned students view
- [ ] Tested manual assignment
- [ ] Documentation updated
- [ ] Team trained on new features

---

## Next Steps

1. **Review the full documentation**: [STUDENT_ENROLLMENT_SYSTEM.md](./STUDENT_ENROLLMENT_SYSTEM.md)
2. **Customize as needed**: Adjust UI, messaging, and workflows
3. **Train users**: Prepare guides for teachers and students
4. **Monitor usage**: Track which enrollment methods are preferred
5. **Gather feedback**: Improve based on real-world usage

---

**Need Help?**
- Check [Troubleshooting Guide](./STUDENT_ENROLLMENT_SYSTEM.md#troubleshooting)
- Review [API Documentation](./API_ROUTES.md)
- Contact: [Your support contact]

