#!/usr/bin/env tsx
/**
 * Test script for secret manager configuration
 * Run with: npx tsx scripts/test-secret-manager.ts
 */

import { SecretManagerFactory, getCachedSecret } from '../src/lib/secret-manager'

async function testSecretManager() {
  console.log('🔍 Testing Secret Manager Configuration...\n')
  
  // Check which secret manager is detected
  const manager = SecretManagerFactory.getInstance()
  const isConfigured = SecretManagerFactory.isConfigured()
  
  console.log('Configuration Status:')
  console.log('--------------------')
  console.log(`✓ Secret Manager Configured: ${isConfigured ? '✅ Yes' : '❌ No'}`)
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Check for specific configurations
  console.log('\nDetection Results:')
  console.log('------------------')
  
  if (process.env.VERCEL) {
    console.log('🔐 Vercel platform detected')
  } else if (process.env.GCP_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('🔐 Google Cloud configuration detected')
    console.log(`   Project ID: ${process.env.GCP_PROJECT_ID || 'Not set'}`)
    console.log(`   Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set' : 'Not set'}`)
  } else if (process.env.ALLOW_ENV_SECRETS === 'true') {
    console.log('⚠️  Environment variables explicitly allowed')
  } else {
    console.log('⚠️  Using fallback to environment variables')
  }
  
  // Test retrieving secrets
  console.log('\nTesting Secret Retrieval:')
  console.log('-------------------------')
  
  const testSecrets = [
    { name: 'google-client-id', env: 'GOOGLE_CLIENT_ID' },
    { name: 'google-client-secret', env: 'GOOGLE_CLIENT_SECRET' },
    { name: 'nextauth-secret', env: 'NEXTAUTH_SECRET' },
    { name: 'token-encryption-key', env: 'TOKEN_ENCRYPTION_KEY' }
  ]
  
  for (const secret of testSecrets) {
    try {
      const value = await getCachedSecret(secret.name, secret.env)
      if (value) {
        // Mask the value for security
        const masked = value.substring(0, 4) + '****' + value.substring(value.length - 4)
        console.log(`✓ ${secret.name}: ${masked}`)
      } else {
        console.log(`✗ ${secret.name}: Not found`)
      }
    } catch (error) {
      console.log(`✗ ${secret.name}: Error - ${error}`)
    }
  }
  
  // Check for development secrets in production
  console.log('\nSecurity Checks:')
  console.log('----------------')
  
  if (process.env.NODE_ENV === 'production') {
    const clientSecret = await getCachedSecret('google-client-secret', 'GOOGLE_CLIENT_SECRET')
    if (clientSecret?.includes('GOCSPX-')) {
      console.log('⚠️  WARNING: Development client secret detected in production!')
      console.log('   Please regenerate your OAuth credentials for production use.')
    } else {
      console.log('✅ Production credentials appear to be properly configured')
    }
  } else {
    console.log('ℹ️  Running in development mode - security checks skipped')
  }
  
  // Provide recommendations
  console.log('\nRecommendations:')
  console.log('----------------')
  
  if (!isConfigured && process.env.NODE_ENV === 'production') {
    console.log('🔒 For enhanced security in production, consider:')
    console.log('   1. Deploy to Vercel for automatic secret management')
    console.log('   2. Configure Google Cloud Secret Manager')
    console.log('   3. Set ALLOW_ENV_SECRETS=true to acknowledge environment variable usage')
    console.log('\n   See docs/SECRET_MANAGER_SETUP.md for detailed instructions')
  } else if (isConfigured) {
    console.log('✅ Your secret manager is properly configured!')
  }
}

// Run the test
testSecretManager().catch(console.error)
