# Google RISC (Cross-Account Protection) Implementation

This document describes the implementation of Google's [Cross-Account Protection (RISC)](https://developers.google.com/identity/protocols/risc) in the Physics Classroom application.

## Overview

Cross-Account Protection enhances security by allowing Google to notify our application when security events occur on users' Google accounts. This enables us to take protective actions such as:

- Requiring re-authentication when passwords change
- Suspending accounts when Google accounts are compromised
- Cleaning up data when accounts are deleted
- Invalidating sessions when tokens are revoked

## Architecture

### Components

1. **RISC Webhook Endpoint** (`/api/risc/webhook`)
   - Receives security event tokens from Google
   - Validates token signatures
   - Processes security events

2. **RISC Handler** (`src/lib/risc-handler.ts`)
   - Validates security event tokens using Google's public keys
   - Handles different event types
   - Updates user security status

3. **RISC Configuration** (`src/lib/risc-config.ts`)
   - Manages RISC stream configuration
   - Registers webhook endpoint with Google
   - Handles verification process

4. **Database Tables**
   - `security_events` - Stores all received security events
   - `user_security_status` - Tracks user security restrictions
   - `user_tokens` - Manages OAuth tokens for cleanup

## Security Event Types

### Handled Events

1. **Sessions Revoked** (`sessions-revoked`)
   - Action: Invalidate all user sessions
   - Require re-authentication

2. **Tokens Revoked** (`tokens-revoked`)
   - Action: Clear stored OAuth tokens
   - Require new authorization

3. **Account Disabled** (`account-disabled`)
   - Action: Suspend user access
   - Block new logins

4. **Credentials Changed** (`account-credential-change-required`)
   - Action: Require re-authentication
   - Consider requiring MFA

5. **Account Purged** (`account-purged`)
   - Action: Schedule data deletion
   - Follow privacy policy

6. **Account Enabled** (`account-enabled`)
   - Action: Restore access if suspended
   - Still require re-authentication

## Setup Guide

### Prerequisites

1. **Google Cloud Project** with:
   - OAuth 2.0 credentials configured
   - RISC API enabled
   - Service account with RISC Configuration Admin role

2. **Service Account Setup**:
   ```bash
   # 1. Go to Google Cloud Console
   # 2. Create service account
   # 3. Grant "RISC Configuration Admin" role
   # 4. Create JSON key
   # 5. Save as service-account-key.json
   ```

3. **Environment Variables**:
   ```env
   # Service account key path
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json
   
   # Or JSON content directly
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   
   # Webhook URL (optional, uses NEXTAUTH_URL if not set)
   RISC_WEBHOOK_URL=https://your-domain.com/api/risc/webhook
   ```

### Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Database Migration**:
   ```bash
   npm run db:migrate
   ```

3. **Configure RISC**:
   ```bash
   npm run setup:risc
   ```

4. **Verify Setup**:
   - Check console output for success message
   - Google will send verification token to webhook
   - Check database for verification event

### Local Development

For local testing with RISC:

1. **Use ngrok for HTTPS tunnel**:
   ```bash
   # Install ngrok
   brew install ngrok  # or download from ngrok.com
   
   # Start tunnel
   ngrok http 3000
   
   # Use the HTTPS URL for RISC_WEBHOOK_URL
   ```

2. **Update environment**:
   ```env
   RISC_WEBHOOK_URL=https://your-ngrok-id.ngrok.io/api/risc/webhook
   ```

3. **Run setup**:
   ```bash
   npm run setup:risc
   ```

## Usage

### Checking User Security Status

```typescript
import { supabase } from '@/lib/supabase'

// Check if user requires re-authentication
const { data } = await supabase
  .rpc('check_user_security_status', { 
    user_email: 'user@example.com' 
  })

if (data?.requires_reauth) {
  // Force re-authentication
  signOut()
}

if (data?.account_suspended) {
  // Block access
  showSuspendedMessage()
}
```

### In Components

```tsx
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

function ProtectedComponent() {
  const { data: session } = useSession()
  
  useEffect(() => {
    // Check for re-authentication requirement
    if (session?.requiresReauth) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
    }
  }, [session])
  
  // Component logic
}
```

### Monitoring Events

```sql
-- View recent security events
SELECT * FROM security_events 
ORDER BY processed_at DESC 
LIMIT 10;

-- Check user security status
SELECT * FROM user_security_status 
WHERE email = 'user@example.com';

-- Count events by type
SELECT event_type, COUNT(*) 
FROM security_events 
GROUP BY event_type;
```

## Security Considerations

1. **Token Validation**
   - Always validate JWT signatures
   - Check issuer matches Google
   - Verify audience includes your client ID

2. **Event Processing**
   - Process events asynchronously
   - Return 200 OK to prevent retries
   - Log all events for audit trail

3. **User Impact**
   - Balance security with user experience
   - Provide clear messaging for restrictions
   - Allow legitimate users to recover access

4. **Privacy Compliance**
   - Follow RISC Terms of Service
   - Delete event data after reasonable time
   - Handle account deletion per privacy policy

## Troubleshooting

### Common Issues

1. **403 Forbidden**
   - Enable RISC API in Google Cloud Console
   - Grant RISC Configuration Admin role to service account
   - Accept RISC Terms of Service

2. **Webhook URL must be HTTPS**
   - Use ngrok for local development
   - Deploy to HTTPS-enabled hosting
   - Add domain to authorized domains in Google Cloud

3. **No events received**
   - Verify webhook URL is accessible
   - Check stream status is "enabled"
   - Test with password change on test account

### Testing

1. **Manual Testing**:
   ```bash
   # 1. Sign in with test account
   # 2. Change password on Google account
   # 3. Check security_events table
   SELECT * FROM security_events WHERE user_identifier LIKE '%test%';
   ```

2. **Verification**:
   ```bash
   # Trigger verification
   npm run setup:risc
   
   # Check for verification event
   SELECT * FROM security_events 
   WHERE event_type LIKE '%verification%';
   ```

## Compliance

### RISC Terms of Service

- Security events must only be used for security purposes
- Cannot use data for marketing or analytics
- Must delete data in reasonable timeframe
- Must comply with privacy regulations

### Data Retention

- Security events: 90 days
- User security status: Until user re-authenticates
- Token data: Until expired or revoked

## API Reference

### Webhook Endpoint

```
POST /api/risc/webhook
Content-Type: application/secevent+jwt

<JWT token>
```

Response:
- `202 Accepted` - Event processed
- `200 OK` - Verification successful
- `400 Bad Request` - Invalid token

### Configuration API

```typescript
// Get current configuration
const config = await getStreamConfiguration()

// Update configuration
await updateStreamConfiguration(webhookUrl, eventTypes)

// Enable/disable stream
await updateStreamStatus('enabled' | 'disabled')

// Verify endpoint
await verifyEndpoint()
```

## Resources

- [Google RISC Documentation](https://developers.google.com/identity/protocols/risc)
- [OpenID RISC Specification](https://openid.net/specs/openid-risc-profile-specification-1_0.html)
- [Google Cloud Console](https://console.cloud.google.com)
- [RISC API Reference](https://developers.google.com/identity/protocols/risc#api-reference)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Google RISC documentation
3. Check security_events table for details
4. Contact support with event logs
