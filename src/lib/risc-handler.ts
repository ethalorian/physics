/**
 * Google Cross-Account Protection (RISC) Handler
 * Implements security event token processing according to:
 * https://developers.google.com/identity/protocols/risc
 */

import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { supabase } from './supabase'

// RISC Configuration endpoint
const RISC_CONFIG_URL = 'https://accounts.google.com/.well-known/risc-configuration'

// Security event types from Google
export enum SecurityEventType {
  SESSION_REVOKED = 'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
  TOKEN_REVOKED = 'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked',
  ACCOUNT_DISABLED = 'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
  ACCOUNT_ENABLED = 'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
  CREDENTIAL_CHANGED = 'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required',
  ACCOUNT_PURGED = 'https://schemas.openid.net/secevent/risc/event-type/account-purged'
}

interface RiscConfiguration {
  issuer: string
  jwks_uri: string
  delivery_methods_supported: string[]
  configuration_endpoint: string
}

interface SecurityEventToken {
  iss: string
  aud: string | string[]
  iat: number
  jti: string
  events: {
    [key: string]: {
      subject?: {
        subject_type: string
        email?: string
        sub?: string
      }
      reason?: string
      event_timestamp?: number
    }
  }
}

/**
 * Fetches the RISC configuration from Google
 */
async function getRiscConfiguration(): Promise<RiscConfiguration> {
  try {
    const response = await fetch(RISC_CONFIG_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch RISC configuration: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching RISC configuration:', error)
    throw error
  }
}

/**
 * Creates a JWKS client for Google's signing keys
 */
function createJwksClient(jwksUri: string) {
  return jwksClient({
    jwksUri,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10
  })
}

/**
 * Validates a security event token from Google
 */
export async function validateSecurityEventToken(token: string): Promise<SecurityEventToken | null> {
  try {
    // Get RISC configuration
    const config = await getRiscConfiguration()
    
    // Decode token without verification first to get the key ID
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string') {
      console.error('Invalid token format')
      return null
    }
    
    const keyId = decoded.header.kid
    if (!keyId) {
      console.error('No key ID in token header')
      return null
    }
    
    // Get the signing key from Google
    const client = createJwksClient(config.jwks_uri)
    const key = await client.getSigningKey(keyId)
    const signingKey = key.getPublicKey()
    
    // Verify the token
    const verified = jwt.verify(token, signingKey, {
      issuer: config.issuer,
      audience: [
        process.env.GOOGLE_CLIENT_ID!,
        // Add any other client IDs you use
      ],
      ignoreExpiration: true // Security event tokens don't expire
    }) as SecurityEventToken
    
    return verified
  } catch (error) {
    console.error('Token validation failed:', error)
    return null
  }
}

/**
 * Handles a security event based on its type
 */
export async function handleSecurityEvent(token: SecurityEventToken): Promise<void> {
  const events = token.events
  
  for (const [eventType, eventData] of Object.entries(events)) {
    console.log(`Processing security event: ${eventType}`, eventData)
    
    // Get the affected user
    const subject = eventData.subject
    if (!subject) {
      console.warn('No subject in security event')
      continue
    }
    
    const userIdentifier = subject.email || subject.sub
    if (!userIdentifier) {
      console.warn('No user identifier in security event')
      continue
    }
    
    // Log the security event
    await logSecurityEvent(eventType, userIdentifier, eventData)
    
    // Take action based on event type
    switch (eventType) {
      case SecurityEventType.SESSION_REVOKED:
        await handleSessionRevoked(userIdentifier)
        break
        
      case SecurityEventType.TOKEN_REVOKED:
        await handleTokenRevoked(userIdentifier)
        break
        
      case SecurityEventType.ACCOUNT_DISABLED:
        await handleAccountDisabled(userIdentifier)
        break
        
      case SecurityEventType.CREDENTIAL_CHANGED:
        await handleCredentialChanged(userIdentifier)
        break
        
      case SecurityEventType.ACCOUNT_PURGED:
        await handleAccountPurged(userIdentifier)
        break
        
      case SecurityEventType.ACCOUNT_ENABLED:
        await handleAccountEnabled(userIdentifier)
        break
        
      default:
        console.warn(`Unknown event type: ${eventType}`)
    }
  }
}

/**
 * Logs a security event to the database for audit purposes
 */
async function logSecurityEvent(
  eventType: string, 
  userIdentifier: string, 
  eventData: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        user_identifier: userIdentifier,
        event_data: eventData,
        processed_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to log security event:', error)
    }
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

/**
 * Handles when a user's Google sessions are revoked
 * Action: Invalidate user's sessions in our app
 */
async function handleSessionRevoked(userIdentifier: string): Promise<void> {
  console.log(`Sessions revoked for user: ${userIdentifier}`)
  
  try {
    // Mark user as requiring re-authentication
    const { error } = await supabase
      .from('user_security_status')
      .upsert({
        email: userIdentifier,
        requires_reauth: true,
        reason: 'Google sessions revoked',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('Failed to update user security status:', error)
    }
    
    // TODO: Invalidate any active sessions in your session store
    // TODO: Send notification to user if appropriate
  } catch (error) {
    console.error('Error handling session revoked:', error)
  }
}

/**
 * Handles when a user's OAuth tokens are revoked
 * Action: Clear stored tokens and require re-authentication
 */
async function handleTokenRevoked(userIdentifier: string): Promise<void> {
  console.log(`Tokens revoked for user: ${userIdentifier}`)
  
  try {
    // Clear any stored tokens for this user
    const { error } = await supabase
      .from('user_tokens')
      .delete()
      .eq('email', userIdentifier)
    
    if (error) {
      console.error('Failed to clear user tokens:', error)
    }
    
    // Mark user as requiring re-authentication
    await supabase
      .from('user_security_status')
      .upsert({
        email: userIdentifier,
        requires_reauth: true,
        reason: 'OAuth tokens revoked',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
  } catch (error) {
    console.error('Error handling token revoked:', error)
  }
}

/**
 * Handles when a user's Google account is disabled
 * Action: Suspend user's access to our app
 */
async function handleAccountDisabled(userIdentifier: string): Promise<void> {
  console.log(`Account disabled for user: ${userIdentifier}`)
  
  try {
    // Suspend user account
    const { error } = await supabase
      .from('user_security_status')
      .upsert({
        email: userIdentifier,
        account_suspended: true,
        requires_reauth: true,
        reason: 'Google account disabled',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('Failed to suspend user account:', error)
    }
    
    // TODO: Revoke all active sessions
    // TODO: Prevent new logins until account is re-enabled
  } catch (error) {
    console.error('Error handling account disabled:', error)
  }
}

/**
 * Handles when a user's credentials are changed
 * Action: Require re-authentication for sensitive operations
 */
async function handleCredentialChanged(userIdentifier: string): Promise<void> {
  console.log(`Credentials changed for user: ${userIdentifier}`)
  
  try {
    // Mark user as requiring enhanced authentication
    const { error } = await supabase
      .from('user_security_status')
      .upsert({
        email: userIdentifier,
        requires_reauth: true,
        requires_mfa: true, // Optionally require MFA
        reason: 'Google credentials changed',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('Failed to update user security status:', error)
    }
    
    // TODO: Send security alert to user
    // TODO: Log out user from all devices
  } catch (error) {
    console.error('Error handling credential change:', error)
  }
}

/**
 * Handles when a user's Google account is purged/deleted
 * Action: Clean up user data according to privacy policy
 */
async function handleAccountPurged(userIdentifier: string): Promise<void> {
  console.log(`Account purged for user: ${userIdentifier}`)
  
  try {
    // Mark account as deleted
    const { error } = await supabase
      .from('user_security_status')
      .upsert({
        email: userIdentifier,
        account_deleted: true,
        account_suspended: true,
        reason: 'Google account purged',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('Failed to mark account as deleted:', error)
    }
    
    // TODO: Implement data retention policy
    // TODO: Schedule user data deletion according to privacy policy
    // TODO: Remove from all mailing lists
  } catch (error) {
    console.error('Error handling account purged:', error)
  }
}

/**
 * Handles when a user's Google account is re-enabled
 * Action: Restore user's access if it was suspended
 */
async function handleAccountEnabled(userIdentifier: string): Promise<void> {
  console.log(`Account enabled for user: ${userIdentifier}`)
  
  try {
    // Re-enable user account
    const { error } = await supabase
      .from('user_security_status')
      .upsert({
        email: userIdentifier,
        account_suspended: false,
        requires_reauth: true, // Still require re-auth for security
        reason: 'Google account re-enabled',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('Failed to re-enable user account:', error)
    }
    
    // TODO: Send notification to user about account restoration
  } catch (error) {
    console.error('Error handling account enabled:', error)
  }
}

/**
 * Verifies that our endpoint is properly configured with Google
 * This is used during RISC setup verification
 */
export async function handleVerificationRequest(
  verificationToken: string
): Promise<boolean> {
  try {
    // Validate the verification token
    const validated = await validateSecurityEventToken(verificationToken)
    if (!validated) {
      console.error('Verification token validation failed')
      return false
    }
    
    // Check if this is a verification event
    const events = validated.events
    const hasVerificationEvent = Object.keys(events).some(
      key => key.includes('verification')
    )
    
    if (hasVerificationEvent) {
      console.log('RISC endpoint verification successful')
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error handling verification request:', error)
    return false
  }
}
