# Google OAuth Setup Guide

## Fixing the redirect_uri_mismatch Error

The "Error 400: redirect_uri_mismatch" occurs when the redirect URIs configured in Google Cloud Console don't match what your application is sending.

### Required Redirect URIs

Add these redirect URIs to your Google OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

#### For Local Development:
```
http://localhost:3000/api/auth/callback/google
```

#### For Production:
```
https://your-domain.com/api/auth/callback/google
```

### Step-by-Step Configuration

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com
   - Select your project

2. **Open OAuth 2.0 Client Settings**
   - Go to "APIs & Services" → "Credentials"
   - Click on your OAuth 2.0 Client ID

3. **Add Authorized Redirect URIs**
   - In the "Authorized redirect URIs" section, add:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - Your production URL if deploying (e.g., `https://physics-classroom.vercel.app/api/auth/callback/google`)
   - Click "Save"

4. **Update Environment Variables**
   Ensure your `.env.local` file has:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_URL=http://localhost:3000  # Or your production URL
   NEXTAUTH_SECRET=your-generated-secret
   ```

### Common Issues and Solutions

#### Issue: Still getting redirect_uri_mismatch
- **Solution**: Wait 5-10 minutes after adding URIs (Google needs time to propagate changes)
- Clear browser cookies and cache
- Try incognito mode

#### Issue: Using a different port
- **Solution**: Update both Google Console and NEXTAUTH_URL to match your port
  - Example: If using port 3001, add `http://localhost:3001/api/auth/callback/google`

#### Issue: Deploying to production
- **Solution**: Add your production domain to redirect URIs
- Update NEXTAUTH_URL in production environment variables

### Testing the Fix

1. Clear your browser cookies
2. Go to http://localhost:3000 (or your app URL)
3. Click "Begin Your Journey" or sign in
4. You should see the Google account selection screen
5. If you encounter an error, you'll be redirected to `/auth/error` with options to:
   - Try a different account
   - Go back
   - Go home
   - Clear session and start over

### Security Notes

- Never commit your `.env.local` file
- Keep GOOGLE_CLIENT_SECRET secure
- Generate NEXTAUTH_SECRET with: `openssl rand -base64 32`
- In production, use HTTPS for all redirect URIs
