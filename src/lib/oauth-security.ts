/**
 * OAuth Security Utilities
 * Implements Google OAuth 2.0 best practices
 * https://developers.google.com/identity/protocols/oauth2/resources/best-practices
 * 
 * Note: This module contains server-only utilities.
 * For client-safe scope functions, import from './oauth-scopes'
 */

import crypto from 'crypto'

// Re-export client-safe scope functions
export { getInitialScopes, getClassroomScopes, getAssignmentScopes } from './oauth-scopes'

// Environment-based encryption key (should be stored securely, not in code)
const getEncryptionKey = () => {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not set in environment variables')
  }
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypts sensitive token data for secure storage
 * Best practice: Handle user tokens securely
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Token encryption failed:', error)
    throw new Error('Failed to encrypt token')
  }
}

/**
 * Decrypts token data for use
 * Best practice: Handle user tokens securely
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedToken.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted token format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Token decryption failed:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Validates OAuth client configuration
 * Best practice: Handle client credentials securely
 */
export function validateOAuthConfig() {
  const errors: string[] = []
  
  // Check for required environment variables
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'TOKEN_ENCRYPTION_KEY'
  ]
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  }
  
  // Validate NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long')
  }
  
  // Validate TOKEN_ENCRYPTION_KEY length
  if (process.env.TOKEN_ENCRYPTION_KEY && process.env.TOKEN_ENCRYPTION_KEY.length < 32) {
    errors.push('TOKEN_ENCRYPTION_KEY must be at least 32 characters long')
  }
  
  // Check for development-only exposure
  if (process.env.NODE_ENV === 'production') {
    if (process.env.GOOGLE_CLIENT_SECRET?.includes('GOCSPX-')) {
      console.warn('Warning: Using a development client secret in production')
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`OAuth configuration errors:\n${errors.join('\n')}`)
  }
}

/**
 * Revokes OAuth tokens
 * Best practice: Handle refresh token revocation and expiration
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    if (!response.ok) {
      console.error('Token revocation failed:', response.status)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error revoking token:', error)
    return false
  }
}


/**
 * Safely handles token refresh errors
 * Best practice: Handle refresh token revocation and expiration
 */
export async function handleTokenRefreshError(error: any, userEmail?: string) {
  console.error('Token refresh error:', error)
  
  // Log the error for monitoring
  const errorData = {
    timestamp: new Date().toISOString(),
    userEmail: userEmail || 'unknown',
    error: error.message || 'Unknown error',
    type: 'token_refresh_failure'
  }
  
  // In production, send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error monitoring service (e.g., Sentry)
    console.error('Production token refresh error:', errorData)
  }
  
  // Clear any stored tokens for this user
  if (userEmail) {
    await clearUserTokens(userEmail)
  }
  
  return {
    error: 'RefreshAccessTokenError',
    message: 'Your session has expired. Please sign in again.',
    requiresReauth: true
  }
}

/**
 * Clears stored tokens for a user
 * Best practice: Revoke tokens as soon as they are no longer needed
 */
export async function clearUserTokens(userEmail: string) {
  // This would integrate with your token storage mechanism
  // For now, it's a placeholder for the implementation
  console.log(`Clearing tokens for user: ${userEmail}`)
  
  // TODO: Clear tokens from your secure storage
  // - Remove from database if stored there
  // - Clear from any cache
  // - Revoke tokens with Google
}

/**
 * Validates token expiration
 * Best practice: Handle refresh token revocation and expiration
 */
export function isTokenExpired(expiresAt: number): boolean {
  // Add a 5-minute buffer before the actual expiration
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
  return Date.now() >= (expiresAt - bufferTime)
}

/**
 * Securely stores client credentials
 * Best practice: Handle client credentials securely
 */
export async function getSecureClientCredentials() {
  // Import dynamically to avoid circular dependencies
  const { SecretManagerFactory, getCachedSecret } = await import('./secret-manager')
  
  // Check if a proper secret manager is configured
  const isProperlyConfigured = SecretManagerFactory.isConfigured()
  
  if (process.env.NODE_ENV === 'production' && !isProperlyConfigured) {
    console.warn('Warning: Using environment variables for client credentials in production')
    console.warn('Consider configuring a secret manager for enhanced security:')
    console.warn('  - Google Cloud Secret Manager: Set GCP_PROJECT_ID')
    console.warn('  - Vercel: Deploy to Vercel platform')
    console.warn('  - Or set ALLOW_ENV_SECRETS=true to suppress this warning')
  }
  
  // Retrieve credentials from secret manager with fallback to env vars
  const [clientId, clientSecret] = await Promise.all([
    getCachedSecret('google-client-id', 'GOOGLE_CLIENT_ID'),
    getCachedSecret('google-client-secret', 'GOOGLE_CLIENT_SECRET')
  ])
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not found in secret manager or environment variables')
  }
  
  // Only warn about development secrets if we detect them
  if (process.env.NODE_ENV === 'production' && clientSecret.includes('GOCSPX-')) {
    console.warn('Warning: Using a development client secret in production')
    console.warn('Please regenerate your OAuth client credentials for production use')
  }
  
  return {
    clientId,
    clientSecret
  }
}

/**
 * Monitors OAuth usage for unused clients
 * Best practice: Remove unused OAuth clients
 */
export async function logOAuthClientUsage(clientId: string, action: 'auth' | 'refresh' | 'revoke') {
  const usageData = {
    clientId,
    action,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
  
  // In production, log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service
    console.log('OAuth client usage:', usageData)
  }
  
  // Track last usage to identify inactive clients
  // This helps identify OAuth clients that can be removed
}
