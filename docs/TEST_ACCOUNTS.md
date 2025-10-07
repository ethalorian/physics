# Test Accounts Guide

## Overview

Test accounts allow you to quickly log in and test the platform from different user perspectives during development. These accounts are **only available in development mode** and will not work in production.

## Available Test Accounts

### Student Account
- **Email:** `student@test.com`
- **Password:** `student123`
- **Permissions:**
  - ✅ View lessons
  - ✅ View and take assignments
  - ❌ Create assignments
  - ❌ Manage assignments
  - ❌ Access admin panel
  - ❌ Create lessons

### Teacher Account
- **Email:** `teacher@test.com`
- **Password:** `teacher123`
- **Permissions:**
  - ✅ View lessons
  - ✅ View and take assignments
  - ✅ Create assignments
  - ✅ Manage assignments
  - ❌ Access admin panel
  - ❌ Create lessons

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Permissions:**
  - ✅ Full access to all features
  - ✅ Access admin panel
  - ✅ Create and manage lessons
  - ✅ Create and manage assignments
  - ✅ Manage question bank
  - ✅ View all student progress

## How to Use Test Accounts

### Method 1: Quick Login Buttons (Recommended)

1. Navigate to the sign-in page: `http://localhost:3000/auth/signin`
2. Click on **"Show Test Accounts"** button
3. Click on one of the quick login buttons:
   - **Student Account**
   - **Teacher Account**
   - **Admin Account**
4. You'll be automatically signed in and redirected to the dashboard

### Method 2: Manual Login

1. Navigate to the sign-in page
2. Click on **"Show Test Accounts"**
3. Enter the email and password manually in the form
4. Click **"Sign in with Test Account"**

## Testing Different User Experiences

### As a Student
1. Log in with `student@test.com`
2. Test features:
   - View available lessons
   - Take assignments
   - View vocabulary games
   - Check progress and scores

### As a Teacher
1. Log in with `teacher@test.com`
2. Test features:
   - Create assignments
   - View student submissions
   - Grade assignments
   - Manage question bank
   - Access vocabulary management

### As an Admin
1. Log in with `admin@test.com`
2. Test features:
   - All teacher features
   - Access admin dashboard
   - Create and edit lessons
   - Manage all system settings
   - View comprehensive analytics

## Implementation Details

### How It Works

1. **NextAuth Configuration** (`src/lib/auth.ts`):
   - Adds a Credentials provider that's only enabled in development mode
   - Validates credentials against a hardcoded list of test users

2. **Permission System** (`src/lib/permissions.ts`):
   - Test account emails are added to `ADMIN_EMAILS` and `TEACHER_EMAILS` arrays
   - Role is determined based on email address

3. **Sign-In Page** (`src/app/auth/signin/page.tsx`):
   - Shows test account section only in development mode
   - Provides quick login buttons for convenience

### Security

- **Development Only**: Test accounts are completely disabled in production
- **Environment Check**: Uses `process.env.NODE_ENV === "development"` checks
- **No Production Risk**: The credentials provider won't even be registered in production builds

## Troubleshooting

### Test Accounts Section Not Showing

- **Cause**: You're not in development mode
- **Solution**: Make sure you're running `npm run dev` (not `npm run build && npm run start`)

### "Invalid email or password" Error

- **Cause**: Incorrect credentials or test accounts disabled
- **Solutions**:
  1. Double-check the email and password (case-sensitive)
  2. Ensure you're in development mode
  3. Restart the development server

### Can't Access Admin Features

- **Cause**: Logged in with wrong account type
- **Solution**: Sign out and log in with the admin test account

### Session Not Persisting

- **Cause**: Browser cookie/session issues
- **Solutions**:
  1. Clear browser cookies
  2. Try incognito/private mode
  3. Restart the development server

## Adding More Test Accounts

To add additional test accounts, edit `src/lib/auth.ts`:

```typescript
const TEST_USERS = [
  // Existing accounts...
  {
    id: "test-custom-1",
    email: "custom@test.com",
    name: "Custom Test User",
    password: "custom123",
    role: "student" // or "teacher"
  }
]
```

Then add the email to the appropriate array in `src/lib/permissions.ts`:

```typescript
export const TEACHER_EMAILS = [
  ...ADMIN_EMAILS,
  ...(process.env.NODE_ENV === 'development' ? [
    'teacher@test.com',
    'custom@test.com' // Add here for teacher role
  ] : []),
]
```

## Best Practices

1. **Switch Accounts**: Test the same feature from different user perspectives
2. **Clean State**: Clear localStorage occasionally to test fresh user experiences
3. **Real-World Scenarios**: Create realistic test data (assignments, lessons, vocabulary)
4. **Edge Cases**: Test with empty states, completed states, and error states
5. **Permission Boundaries**: Try to access restricted features with lower-privilege accounts

## Related Documentation

- [Authentication & Permissions](./SETUP_GUIDES.md#authentication-setup)
- [User Roles](../README.md#user-roles)
- [Development Workflow](../.cursorrules#development-workflow)
