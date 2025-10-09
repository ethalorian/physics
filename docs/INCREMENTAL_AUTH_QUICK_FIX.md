# Incremental Authorization - Quick Fix Guide

## Issue: "Request had insufficient authentication scopes"

This error occurs because we've implemented Google's OAuth 2.0 best practice of **incremental authorization**. Instead of requesting all permissions upfront (which can be overwhelming to users), we now:

1. Start with minimal scopes (email, profile)
2. Request additional scopes only when features need them

## How It Works

### Initial Login
When a user first signs in, they only grant basic permissions:
- `openid` - Basic authentication
- `email` - Email address access
- `profile` - Profile information

### Feature-Based Authorization
When accessing features that need more permissions (like Google Classroom), the app will:
1. Detect insufficient scopes
2. Show a permission request dialog
3. Explain why the permissions are needed
4. Allow the user to grant access

## What Changed

### StudentManagement Component
The component now:
- Detects when Google Classroom scopes are missing
- Shows the `IncrementalAuth` component to request permissions
- Handles the authorization flow gracefully

### Example Flow
1. User signs in → Gets basic access
2. User visits Student Management → Needs Google Classroom access
3. App shows permission request → User grants access
4. Feature becomes available → Data loads normally

## For Developers

### Using IncrementalAuth in Other Components

```tsx
import IncrementalAuth from '@/components/auth/IncrementalAuth'

// In your component
{needsScope ? (
  <IncrementalAuth 
    feature="classroom" // or "assignments" or "roster"
    onSuccess={() => {
      // Handle successful authorization
      window.location.reload() // or refetch data
    }}
    onError={(error) => {
      // Handle authorization failure
      console.error('Auth failed:', error)
    }}
  />
) : (
  // Your normal component content
)}
```

### Available Feature Scopes

1. **`classroom`** - Basic Google Classroom access
   - View courses
   - Read rosters
   - Access student emails

2. **`assignments`** - Assignment management
   - Create coursework
   - View submissions
   - Grade assignments

3. **`roster`** - Advanced roster management
   - Manage enrollments
   - Edit class rosters

### Detecting Scope Errors

```typescript
.catch((error) => {
  // Check if it's a scope error
  if (error.message?.includes('insufficient authentication scopes') || 
      error.message?.includes('PERMISSION_DENIED')) {
    // Show incremental auth component
    setNeedsAdditionalScope(true)
  }
})
```

## Benefits

1. **Better User Experience**
   - Users aren't overwhelmed with permission requests
   - Clear context for why permissions are needed
   - Users can deny permissions for features they don't use

2. **Enhanced Security**
   - Minimal permissions by default
   - Reduced attack surface
   - Users have granular control

3. **Google Compliance**
   - Follows OAuth 2.0 best practices
   - Meets Google's security requirements
   - Better chance of OAuth verification approval

## Testing

1. Clear browser cookies/session
2. Sign in fresh
3. Navigate to Student Management
4. Should see permission request
5. Grant permissions
6. Feature should work normally

## Troubleshooting

### "Session expired" message
- The refresh token may be invalid
- User needs to sign in again

### Permission dialog doesn't appear
- Check browser console for errors
- Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Verify OAuth consent screen is configured

### After granting permissions, still getting errors
- The page should auto-reload after permission grant
- If not, manually refresh the page
- Check if the OAuth consent screen has the scopes configured

## Environment Variables

Ensure these are set:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
TOKEN_ENCRYPTION_KEY=your-32-char-key
```

## Related Documentation
- [OAuth Security Best Practices](./OAUTH_SECURITY_BEST_PRACTICES.md)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Incremental Authorization](https://developers.google.com/identity/protocols/oauth2/web-server#incrementalAuth)
