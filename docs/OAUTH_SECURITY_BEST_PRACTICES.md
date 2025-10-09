# OAuth Security Best Practices Implementation

This document outlines the OAuth 2.0 security improvements implemented to comply with [Google's OAuth 2.0 best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices).

## Summary of Changes

### 1. **Secure Client Credentials Handling**
- ✅ Credentials are no longer hardcoded in the application
- ✅ Added support for secret managers in production
- ✅ Validation of OAuth configuration on startup
- ✅ Environment-specific credential handling

### 2. **Token Encryption at Rest**
- ✅ Access tokens and refresh tokens are encrypted before storage
- ✅ Uses AES-256-CBC encryption with unique IVs
- ✅ Encryption keys stored separately from application code
- ✅ Automatic decryption when tokens are needed

### 3. **Refresh Token Management**
- ✅ Proper handling of refresh token expiration
- ✅ Token expiration checking with 5-minute buffer
- ✅ Comprehensive error handling for refresh failures
- ✅ Automatic user notification when re-authentication is needed
- ✅ Token cleanup on revocation or expiration

### 4. **Incremental Authorization**
- ✅ Initial authentication requests minimal scopes (profile, email)
- ✅ Additional scopes requested only when features are used
- ✅ Context-aware scope requests with user consent
- ✅ Clear explanation of why each scope is needed
- ✅ IncrementalAuth component for feature-based authorization

### 5. **OAuth Client Monitoring**
- ✅ Usage logging for OAuth client activity
- ✅ Tracking of authentication, refresh, and revocation events
- ✅ Foundation for identifying unused OAuth clients
- ✅ Support for automated cleanup of inactive clients

### 6. **Enhanced Security Measures**
- ✅ PKCE (Proof Key for Code Exchange) enabled for all environments
- ✅ State parameter validation
- ✅ Secure browser requirements (no webviews)
- ✅ HTTPS enforcement in production

## Configuration Requirements

### Environment Variables

```bash
# Required for token encryption (generate with: openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=your-32-character-minimum-encryption-key

# OAuth credentials (store in secret manager for production)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-32-character-minimum-secret
```

### Production Recommendations

1. **Use a Secret Manager**
   - Google Cloud Secret Manager
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

2. **Enable Monitoring**
   - Track OAuth client usage
   - Monitor token refresh failures
   - Alert on authentication errors
   - Log security events

3. **Regular Audits**
   - Review OAuth client configurations
   - Remove unused OAuth clients
   - Rotate encryption keys periodically
   - Update dependencies regularly

## Usage Examples

### Using Incremental Authorization

```tsx
import IncrementalAuth from '@/components/auth/IncrementalAuth'

// Wrap a feature that needs additional permissions
<IncrementalAuth feature="classroom">
  <Button onClick={syncClassroom}>
    Sync Google Classroom
  </Button>
</IncrementalAuth>

// Standalone authorization request
<IncrementalAuth 
  feature="assignments"
  onSuccess={() => console.log('Authorized!')}
  onError={(error) => console.error('Failed:', error)}
/>
```

### Checking for Re-authentication

```tsx
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()
  
  if (session?.requiresReauth) {
    return (
      <div>
        <p>{session.tokenError}</p>
        <Button onClick={() => signIn('google')}>
          Sign In Again
        </Button>
      </div>
    )
  }
  
  // Normal component rendering
}
```

## Security Checklist

- [ ] Generate strong encryption keys (32+ characters)
- [ ] Store credentials in environment variables (never commit)
- [ ] Use secret manager in production
- [ ] Enable HTTPS in production
- [ ] Monitor OAuth client usage
- [ ] Implement proper error handling
- [ ] Test token refresh scenarios
- [ ] Validate all OAuth configurations
- [ ] Request minimal scopes initially
- [ ] Use incremental authorization for features
- [ ] Handle token expiration gracefully
- [ ] Implement token revocation when needed
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Files Modified

1. **`src/lib/oauth-security.ts`** - New security utilities
2. **`src/lib/auth.ts`** - Updated authentication configuration
3. **`src/components/auth/IncrementalAuth.tsx`** - New component for incremental authorization
4. **`env.example`** - Updated with new security requirements

## Google Cloud Console Configuration

### OAuth Consent Screen Settings

1. **User Type**: Internal (for school domain) or External
2. **App Information**:
   - App name: Physics Classroom
   - User support email: Your support email
   - App logo: Your app logo

3. **App Domain**:
   - Application home page: https://your-domain.com
   - Privacy policy: https://your-domain.com/privacy
   - Terms of service: https://your-domain.com/terms

4. **Authorized Domains**:
   - Add your production domain
   - Add localhost for development (if needed)

5. **Scopes** (Configure for incremental authorization):
   - Start with basic scopes only
   - Add sensitive scopes as optional

### OAuth 2.0 Client Configuration

1. **Application Type**: Web application
2. **Authorized JavaScript origins**:
   - https://your-domain.com
   - http://localhost:3000 (development)

3. **Authorized redirect URIs**:
   - https://your-domain.com/api/auth/callback/google
   - http://localhost:3000/api/auth/callback/google (development)

## Monitoring and Maintenance

### Regular Tasks

1. **Weekly**:
   - Review authentication error logs
   - Check token refresh success rate

2. **Monthly**:
   - Audit OAuth client usage
   - Review security alerts
   - Check for unused scopes

3. **Quarterly**:
   - Rotate encryption keys
   - Update OAuth client configurations
   - Security dependency updates

### Error Monitoring

Monitor these key metrics:
- Token refresh failure rate
- Authentication success rate
- Scope authorization requests
- Session expiration events
- Security validation errors

## Troubleshooting

### Common Issues

1. **"Token encryption key not set"**
   - Add TOKEN_ENCRYPTION_KEY to environment variables
   - Generate with: `openssl rand -base64 32`

2. **"Session expired" errors**
   - Check refresh token handling
   - Verify token expiration logic
   - Review error logs for refresh failures

3. **"Invalid grant" errors**
   - Refresh token may be revoked
   - User needs to re-authenticate
   - Check OAuth client configuration

4. **Scope authorization failures**
   - Verify OAuth consent screen configuration
   - Check requested scopes are approved
   - Review incremental authorization implementation

## Additional Resources

- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Using OAuth 2.0 with Google APIs](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

## Support

For questions or issues related to OAuth security:
1. Check this documentation
2. Review error logs
3. Consult Google Cloud Console logs
4. Contact your security team
