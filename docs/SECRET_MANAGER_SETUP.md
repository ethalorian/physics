# Secret Manager Setup Guide

This guide explains how to set up secure secret management for your Physics Classroom application in production.

## Overview

The application now supports multiple secret management providers to securely store sensitive credentials like OAuth client secrets, API keys, and encryption keys. This eliminates the warning about using development secrets in production.

## Supported Providers

### 1. Vercel Environment Variables (Recommended for Vercel deployments)

If you're deploying to Vercel, the platform automatically provides secure environment variable storage.

**Setup:**
1. Deploy your application to Vercel
2. Go to your project settings in the Vercel dashboard
3. Navigate to "Environment Variables"
4. Add your secrets:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `TOKEN_ENCRYPTION_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The application will automatically detect Vercel deployment and use these securely stored variables.

### 2. Google Cloud Secret Manager

For Google Cloud deployments, use Google Cloud Secret Manager for enhanced security.

**Prerequisites:**
```bash
npm install @google-cloud/secret-manager
```

**Setup:**

1. **Enable Secret Manager API:**
   ```bash
   gcloud services enable secretmanager.googleapis.com
   ```

2. **Create a service account:**
   ```bash
   gcloud iam service-accounts create physics-classroom-secrets \
     --display-name="Physics Classroom Secret Manager"
   ```

3. **Grant necessary permissions:**
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:physics-classroom-secrets@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/secretmanager.admin"
   ```

4. **Create and download service account key:**
   ```bash
   gcloud iam service-accounts keys create secret-manager-key.json \
     --iam-account=physics-classroom-secrets@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

5. **Set environment variables:**
   ```bash
   export GCP_PROJECT_ID="your-project-id"
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/secret-manager-key.json"
   ```

6. **Create secrets in Google Cloud:**
   ```bash
   # Create each secret
   echo -n "your-client-id" | gcloud secrets create google-client-id --data-file=-
   echo -n "your-client-secret" | gcloud secrets create google-client-secret --data-file=-
   echo -n "your-nextauth-secret" | gcloud secrets create nextauth-secret --data-file=-
   echo -n "your-encryption-key" | gcloud secrets create token-encryption-key --data-file=-
   ```

### 3. Environment Variables with Explicit Permission

If you need to use environment variables in production (e.g., for self-hosted deployments), you can explicitly allow this:

**Setup:**
1. Set your environment variables as usual
2. Add `ALLOW_ENV_SECRETS=true` to suppress the warning
3. Ensure your hosting environment properly secures these variables

```bash
export ALLOW_ENV_SECRETS=true
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export NEXTAUTH_SECRET="your-nextauth-secret"
export TOKEN_ENCRYPTION_KEY="your-32-character-key"
```

## Secret Naming Convention

The secret manager uses the following naming convention:

| Environment Variable | Secret Manager Name |
|---------------------|-------------------|
| `GOOGLE_CLIENT_ID` | `google-client-id` |
| `GOOGLE_CLIENT_SECRET` | `google-client-secret` |
| `NEXTAUTH_SECRET` | `nextauth-secret` |
| `TOKEN_ENCRYPTION_KEY` | `token-encryption-key` |
| `OPENAI_API_KEY` | `openai-api-key` |
| `NEXT_PUBLIC_SUPABASE_URL` | `supabase-url` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `supabase-anon-key` |

## Generating Secure Secrets

### NextAuth Secret
Generate a secure random string:
```bash
openssl rand -hex 32
```

### Token Encryption Key
Generate a 32-character key:
```bash
openssl rand -hex 16
```

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
4. **Important:** Create separate credentials for development and production
   - Development credentials can have "GOCSPX-" prefix
   - Production credentials should be regenerated to remove this prefix

## Testing Your Configuration

After setting up your secret manager, test it:

1. **Check detection:**
   ```bash
   npm run dev
   ```
   Look for console output:
   - ✅ "🔐 Using Google Cloud Secret Manager"
   - ✅ "🔐 Using Vercel Environment Variables"
   - ⚠️  "⚠️  Using environment variables for secrets" (if using env with ALLOW_ENV_SECRETS)

2. **Verify credentials:**
   Test OAuth login to ensure credentials are properly loaded.

3. **Monitor logs:**
   Check for any warnings about development secrets in production.

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.gitignore` to exclude secret files
   - Use `.env.example` for documentation

2. **Use different credentials for each environment**
   - Development credentials for local testing
   - Staging credentials for staging environment
   - Production credentials for production only

3. **Rotate secrets regularly**
   - Update OAuth client secrets periodically
   - Rotate encryption keys (requires data migration)

4. **Limit secret access**
   - Use least-privilege IAM roles
   - Restrict service account permissions
   - Audit secret access logs

5. **Monitor for exposed secrets**
   - Use GitHub secret scanning
   - Monitor logs for credential exposure
   - Set up alerts for suspicious activity

## Troubleshooting

### "Warning: Using environment variables for client credentials in production"

This warning appears when:
- Running in production mode without a configured secret manager
- Not on Vercel platform
- Not using Google Cloud Secret Manager
- Haven't set `ALLOW_ENV_SECRETS=true`

**Solution:** Follow one of the setup methods above.

### "Google OAuth credentials not found"

This error appears when:
- Secrets are not properly configured
- Secret names don't match expected format
- Service account lacks permissions

**Solution:** Verify secret names and permissions.

### "Failed to initialize Google Secret Manager"

This error appears when:
- `GOOGLE_APPLICATION_CREDENTIALS` not set
- Service account key file not found
- Invalid service account credentials

**Solution:** Check service account setup and credentials.

## Migration from Environment Variables

If you're currently using environment variables:

1. Choose a secret manager provider
2. Create secrets with the correct names
3. Deploy with new configuration
4. Verify OAuth still works
5. Remove environment variables from deployment

## Support

For issues or questions:
- Check the [OAuth Security Best Practices](./OAUTH_SECURITY_BEST_PRACTICES.md)
- Review the application logs for detailed error messages
- Ensure all required secrets are present
