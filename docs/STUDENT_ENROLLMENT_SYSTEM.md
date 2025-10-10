# Student Enrollment System

## Overview

The Student Enrollment System provides three key solutions for managing student access:

1. **Auto-Create Student Records** - Automatically creates database records when students first sign in
2. **Course Join Codes** - Allows students to self-enroll using teacher-generated codes
3. **Unassigned Students Dashboard** - Admin interface to manage students who haven't been assigned to courses

## Problem Solved

**Previous Issue**: Students who signed in but weren't part of a Google Classroom import would get a `404 Student record not found` error when trying to access assignments.

**New Solution**: 
- Students are automatically created in the database on first sign-in
- Students can join courses using join codes
- Teachers can manually assign unassigned students to courses

---

## 🎯 Features

### 1. Auto-Create Student Records

**File**: `src/lib/student-management.ts`

When a student signs in:
- System checks if student record exists
- If not, automatically creates a record in the `students` table
- Updates last access time on subsequent logins
- Handles race conditions gracefully

**Integration**: `src/lib/auth.ts` (NextAuth `signIn` callback)

```typescript
// Automatically called during sign-in
await ensureStudentRecord(user.email, user.id, user.name)
```

### 2. Course Join Codes

**Database Migration**: `supabase/migrations/add_course_join_codes.sql`

#### Features:
- 6-character alphanumeric codes (no confusing characters)
- Enable/disable codes
- Optional expiration dates
- Optional enrollment limits
- Track enrollment method (import, join_code, manual)

#### Admin API Endpoints:
- `POST /api/courses/join-code` - Generate join code
- `PUT /api/courses/join-code` - Update settings
- `DELETE /api/courses/join-code` - Disable code

#### Student API Endpoints:
- `POST /api/courses/enroll` - Enroll with join code
- `GET /api/courses/enroll?code=XXX` - Validate code

#### Database Functions:
- `generate_join_code()` - Creates unique code
- `enroll_student_with_code()` - Handles enrollment logic with validation

### 3. Unassigned Students Management

**API Endpoint**: `/api/students/unassigned`

#### Features:
- View all students without course assignments
- See when students created accounts
- Last sign-in tracking
- Manually assign students to courses
- Remove student from course (if misassigned)

#### Database Functions:
- `get_unassigned_students()` - Lists students without enrollments
- `assign_student_to_course()` - Manual enrollment with audit trail

---

## 📱 User Interfaces

### Admin Components

#### 1. Course Join Code Manager
**File**: `src/components/admin/CourseJoinCodeManager.tsx`

**Features**:
- Generate/regenerate join codes
- Enable/disable codes
- Set expiration (in days)
- Set max enrollment limit
- Copy code to clipboard
- Copy shareable enrollment link
- Visual status indicators

**Usage**:
```typescript
<CourseJoinCodeManager
  courseId={course.id}
  courseName={course.name}
  currentJoinCode={course.join_code}
  joinCodeEnabled={course.join_code_enabled}
  joinCodeExpiresAt={course.join_code_expires_at}
  maxEnrollments={course.max_enrollments}
  onUpdate={() => refreshCourses()}
/>
```

#### 2. Unassigned Students Manager
**File**: `src/components/admin/UnassignedStudentsManager.tsx`

**Features**:
- Lists all students without courses
- Shows signup date and last activity
- Course selection dropdown
- Bulk assignment capabilities
- Auto-refresh functionality

**Usage**:
```typescript
<UnassignedStudentsManager />
```

### Student Components

#### 1. Join Course With Code
**File**: `src/components/student/JoinCourseWithCode.tsx`

**Features**:
- Auto-validates join codes on blur
- Shows course name when code is valid
- Clear error messages
- Help text and instructions
- Uppercase formatting (user-friendly)

**Usage**:
```typescript
<JoinCourseWithCode 
  onSuccess={(course) => {
    console.log('Enrolled in:', course.name)
  }} 
/>
```

#### 2. Enrollment Gate
**File**: `src/components/student/EnrollmentGate.tsx`

**Features**:
- Checks student enrollment status
- Shows join code interface if not enrolled
- Displays enrolled courses count
- Welcome messaging for new students
- Help documentation

**Usage**: Automatically wraps dashboard
```typescript
<EnrollmentGate>
  <StudentDashboard />
</EnrollmentGate>
```

---

## 🔄 Student User Journey

### First-Time Student (Not in Roster)

1. **Sign In**
   - Student uses Google OAuth
   - System automatically creates student record
   - ✅ No 404 errors!

2. **Dashboard**
   - EnrollmentGate detects no course assignment
   - Shows welcoming onboarding interface
   - Displays join code entry form

3. **Enter Join Code**
   - Student enters 6-character code from teacher
   - System validates code in real-time
   - Shows course name if valid

4. **Join Course**
   - Click "Join Course" button
   - Instantly enrolled
   - Dashboard refreshes to show course content

5. **Access Granted**
   - Can now view assignments
   - Can see lessons
   - Can submit work
   - Full system access

### Existing Student (Already Enrolled)

1. **Sign In**
   - Student record updated with last access time
   - No enrollment check needed

2. **Dashboard**
   - EnrollmentGate detects existing enrollment
   - Shows enrollment badge
   - Normal dashboard loads immediately

---

## 👨‍🏫 Teacher Workflow

### Option 1: Generate Join Code (Recommended for Self-Service)

1. **Go to Student Management**
   - Navigate to Admin → Students

2. **Select Course**
   - Choose the course from dropdown

3. **Generate Join Code**
   - Click "Generate Join Code"
   - Optionally set expiration (e.g., 30 days)
   - Optionally set max students
   - Copy code or shareable link

4. **Share with Students**
   - Post code in Google Classroom
   - Email to students
   - Write on board
   - Share enrollment link

5. **Students Self-Enroll**
   - Students enter code on their dashboard
   - Automatic enrollment
   - No manual work needed!

### Option 2: Manual Assignment (For Specific Cases)

1. **View Unassigned Students**
   - Go to Unassigned Students Manager
   - See all students who need assignment

2. **Assign to Course**
   - Select course from dropdown
   - Click "Assign" button
   - Student immediately gains access

### Option 3: Google Classroom Import (Bulk)

1. **Import Roster**
   - Connect to Google Classroom
   - Select course
   - Import all students at once
   - Traditional method still works!

---

## 🔧 Database Schema Changes

### New Columns in `courses` Table

```sql
-- Join code functionality
join_code TEXT UNIQUE
join_code_enabled BOOLEAN DEFAULT false
join_code_expires_at TIMESTAMPTZ
max_enrollments INTEGER
```

### New Columns in `course_students` Table

```sql
-- Enrollment tracking
enrolled_via TEXT DEFAULT 'import'  -- 'import', 'join_code', 'manual'
enrolled_by UUID  -- User who enrolled them (null for self-enrollment)
```

### New Database Functions

- `generate_join_code()` - Creates unique 6-char code
- `enroll_student_with_code(email, code)` - Enrollment with validation
- `get_unassigned_students()` - Lists students without courses
- `assign_student_to_course(student_id, course_id, assigned_by)` - Manual assignment

---

## 🔐 Security Features

### Join Code Security

1. **Unique Codes**: Collision-free generation
2. **No Confusing Characters**: Excludes O/0, I/1, L
3. **Uppercase Only**: Consistent formatting
4. **Enable/Disable**: Teachers control code activation
5. **Expiration**: Optional time limits
6. **Enrollment Caps**: Prevent over-enrollment

### Access Control

1. **Student Records**: Only owner can see their data
2. **Course Join Codes**: Only teachers/admins can generate
3. **Unassigned Students**: Only teachers/admins can view
4. **Manual Assignment**: Only to teacher's own courses

### Audit Trail

- Tracks who enrolled students (`enrolled_by`)
- Records enrollment method (`enrolled_via`)
- Timestamps all operations
- Immutable enrollment history

---

## 📊 Analytics & Reporting

### Track Enrollment Methods

```sql
-- See how students enrolled
SELECT 
  enrolled_via,
  COUNT(*) as student_count
FROM course_students
GROUP BY enrolled_via;
```

### Monitor Join Code Usage

```sql
-- Active join codes
SELECT 
  name,
  join_code,
  join_code_enabled,
  join_code_expires_at,
  student_count
FROM courses
WHERE join_code IS NOT NULL
ORDER BY updated_at DESC;
```

### Identify Enrollment Gaps

```sql
-- Students without courses
SELECT * FROM get_unassigned_students();
```

---

## 🚀 Deployment Checklist

1. **Run Database Migration**
   ```bash
   # Apply the migration
   psql -f supabase/migrations/add_course_join_codes.sql
   ```

2. **Verify Functions Created**
   ```sql
   -- Check functions exist
   SELECT proname FROM pg_proc WHERE proname LIKE '%join%' OR proname LIKE '%unassigned%';
   ```

3. **Test Student Record Creation**
   - Sign in with test account
   - Verify record in `students` table
   - Check no errors in logs

4. **Test Join Code Generation**
   - Generate code for test course
   - Verify uniqueness
   - Test enable/disable

5. **Test Student Enrollment**
   - Use join code as student
   - Verify enrollment in database
   - Check dashboard access

6. **Test Unassigned Students**
   - Create account without course
   - Verify appears in unassigned list
   - Test manual assignment

---

## 🔍 Troubleshooting

### Student Can't See Assignments

**Check**:
1. Is student record in `students` table?
2. Is student in `course_students` table?
3. Is enrollment status `ACTIVE`?
4. Are assignments published?

**Solution**:
```sql
-- Check student enrollment
SELECT 
  s.email,
  cs.enrollment_state,
  cs.enrolled_via,
  c.name as course_name
FROM students s
LEFT JOIN course_students cs ON s.id = cs.student_id
LEFT JOIN courses c ON cs.course_id = c.id
WHERE s.email = 'student@example.com';
```

### Join Code Not Working

**Check**:
1. Is code enabled? (`join_code_enabled = true`)
2. Has code expired? (Check `join_code_expires_at`)
3. Enrollment limit reached? (Check `max_enrollments`)
4. Code entered correctly? (6 characters, uppercase)

**Solution**:
```sql
-- Verify join code status
SELECT 
  name,
  join_code,
  join_code_enabled,
  join_code_expires_at > NOW() as not_expired,
  max_enrollments,
  student_count
FROM courses
WHERE join_code = 'ABC123';
```

### Student Record Not Created

**Check**:
1. Auth callback executing? (Check logs)
2. Database permissions correct?
3. Unique constraint violations?

**Solution**:
- Check NextAuth logs for errors
- Manually create student record if needed:

```typescript
await ensureStudentRecord(email, userId, name)
```

---

## 📈 Future Enhancements

### Potential Additions

1. **Bulk Join Codes**
   - Generate multiple codes at once
   - CSV export for distribution

2. **Join Code Analytics**
   - Track which codes are most used
   - See enrollment rates over time

3. **Enrollment Requests**
   - Students request access
   - Teachers approve/deny

4. **Course Discovery**
   - Public course listing
   - Search and browse

5. **Smart Assignment**
   - Auto-assign based on email domain
   - Grade level matching

6. **Notification System**
   - Alert teachers of new enrollments
   - Remind students to join course

---

## 🎓 Best Practices

### For Teachers

1. **Generate Codes Early**: Create join codes before the semester starts
2. **Set Expirations**: Use 30-90 day expiration for security
3. **Monitor Unassigned**: Check weekly for students who need help
4. **Use Limits**: Set max enrollments to match class size
5. **Disable Old Codes**: Turn off codes after enrollment period

### For Administrators

1. **Regular Audits**: Review unassigned students monthly
2. **Bulk Operations**: Use Google Classroom import for large classes
3. **Help Documentation**: Keep join code help info updated
4. **Track Methods**: Monitor which enrollment methods are preferred

### For Students

1. **Save Codes**: Keep join codes in a safe place
2. **Case Insensitive**: System handles uppercase automatically
3. **Ask for Help**: Contact teacher if code doesn't work
4. **Sign In First**: Create account before using join code

---

## 📞 Support

### Common Questions

**Q: What if a student loses their join code?**
A: Teachers can view the code in the Course Join Code Manager or generate a new one.

**Q: Can students join multiple courses?**
A: Yes! Students can use different join codes for different courses.

**Q: What happens to old enrollments when importing from Google Classroom?**
A: Existing enrollments are preserved. Import adds new students without removing manual enrollments.

**Q: Can I change a join code after sharing it?**
A: Yes, generate a new code. The old code will be invalidated.

**Q: Do join codes work for co-teachers?**
A: Yes, any teacher assigned to the course can generate/manage join codes.

---

## 📚 Related Documentation

- [Authentication System](./AUTH_SYSTEM.md)
- [Google Classroom Integration](./GOOGLE_CLASSROOM_INTEGRATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./API_ROUTES.md)

---

## ✅ Success Criteria

System is working correctly when:

- ✅ New students can sign in without errors
- ✅ Students can join courses using join codes
- ✅ Teachers can generate and manage join codes
- ✅ Unassigned students appear in admin dashboard
- ✅ Manual assignment works correctly
- ✅ All enrollment methods tracked properly
- ✅ No 404 errors for new accounts

---

**Last Updated**: 2024-10-09  
**Version**: 1.0.0  
**Status**: Production Ready 🚀

