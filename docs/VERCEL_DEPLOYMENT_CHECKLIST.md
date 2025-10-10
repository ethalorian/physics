# Vercel Deployment Checklist

## Environment Variables Setup

Make sure you've added all required environment variables in your Vercel project settings:

### Required Variables

1. **Supabase Configuration**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

2. **Authentication**
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -hex 32`
   - `NEXTAUTH_URL` - Your production URL (e.g., https://yourdomain.vercel.app)

3. **Google OAuth**
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

4. **Security**
   - `TOKEN_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`

5. **OpenAI (if using AI features)**
   - `OPENAI_API_KEY` - Your OpenAI API key

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable:
   - Name: The exact variable name (e.g., `NEXTAUTH_SECRET`)
   - Value: The secret value
   - Environment: Select which environments (Production, Preview, Development)

## Common Deployment Issues

### 1. Missing Environment Variables
**Error**: "Environment variable X is not defined"
**Solution**: Add the missing variable in Vercel project settings

### 2. Invalid NEXTAUTH_URL
**Error**: "NEXTAUTH_URL mismatch" or redirect issues
**Solution**: Set `NEXTAUTH_URL` to your actual deployment URL:
- For production: `https://your-domain.vercel.app`
- For preview deployments: Vercel automatically sets this

### 3. Google OAuth Redirect URI Mismatch
**Error**: "redirect_uri_mismatch"
**Solution**: Add these URLs to your Google OAuth app:
```
https://your-domain.vercel.app/api/auth/callback/google
https://your-project-*.vercel.app/api/auth/callback/google  # For preview deployments
```

### 4. Build Errors with Optional Dependencies
If you see errors about `@google-cloud/secret-manager`:
- This is an optional dependency
- Vercel will automatically use its own environment variables
- The package is not required for Vercel deployments

### 5. TypeScript Errors
If you encounter TypeScript errors during build:
```json
// In tsconfig.json, you might need:
{
  "compilerOptions": {
    "skipLibCheck": true  // Skip type checking of dependencies
  }
}
```

## Verifying Secret Manager on Vercel

The secret manager will automatically detect Vercel and show:
```
🔐 Using Vercel Environment Variables
```

No additional configuration is needed for the secret manager on Vercel.

## Testing After Deployment

1. **Check Authentication**
   - Try signing in with Google OAuth
   - Verify session persistence

2. **Check API Routes**
   - Test that API routes are accessible
   - Verify database connections work

3. **Check Console Logs**
   - In Vercel dashboard, go to "Functions" tab
   - Check for any runtime errors

## Need Help?

If you're still seeing errors, please share:
1. The complete error message from Vercel logs
2. Which environment variables you've configured
3. Any specific error codes or messages

The secret manager implementation we added will work automatically on Vercel without any additional configuration needed.

