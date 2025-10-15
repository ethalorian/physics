#!/usr/bin/env node
/**
 * Setup script for Google RISC (Cross-Account Protection)
 * Run this script to configure RISC for your application
 * 
 * Usage: npm run setup:risc
 */

import { setupRisc, getStreamConfiguration, getStreamStatus } from '../src/lib/risc-config'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import * as readline from 'readline'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('')
  log(`${'='.repeat(50)}`, colors.cyan)
  log(title, colors.bright)
  log(`${'='.repeat(50)}`, colors.cyan)
}

async function main() {
  logSection('Google RISC (Cross-Account Protection) Setup')
  
  // Check prerequisites
  log('\nChecking prerequisites...', colors.yellow)
  
  // 1. Check for service account key
  const serviceAccountPaths = [
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    path.join(process.cwd(), 'service-account-key.json'),
    path.join(process.cwd(), 'credentials', 'service-account-key.json')
  ].filter(Boolean) as string[]
  
  let hasServiceAccount = false
  for (const keyPath of serviceAccountPaths) {
    if (fs.existsSync(keyPath)) {
      log(`✓ Found service account key at: ${keyPath}`, colors.green)
      hasServiceAccount = true
      break
    }
  }
  
  if (!hasServiceAccount && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    log('✓ Found service account key in environment variable', colors.green)
    hasServiceAccount = true
  }
  
  if (!hasServiceAccount) {
    log('✗ Service account key not found', colors.red)
    log('\nTo set up RISC, you need a service account with the following:', colors.yellow)
    log('1. RISC Configuration Admin role (roles/riscconfigs.admin)')
    log('2. A JSON key file saved as service-account-key.json')
    log('\nSteps to create a service account:')
    log('1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts')
    log('2. Select your project')
    log('3. Click "Create Service Account"')
    log('4. Name it "RISC Configuration Admin"')
    log('5. Grant it the "RISC Configuration Admin" role')
    log('6. Create a JSON key and save it as service-account-key.json')
    process.exit(1)
  }
  
  // 2. Check for webhook URL
  const webhookUrl = process.env.RISC_WEBHOOK_URL || 
    (process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/risc/webhook` : null)
  
  if (!webhookUrl) {
    log('✗ Webhook URL not configured', colors.red)
    log('\nPlease set one of the following environment variables:', colors.yellow)
    log('- RISC_WEBHOOK_URL (full webhook URL)')
    log('- NEXTAUTH_URL (your app URL, webhook will be at /api/risc/webhook)')
    process.exit(1)
  }
  
  log(`✓ Webhook URL: ${webhookUrl}`, colors.green)
  
  // Check if webhook URL is HTTPS (required by Google)
  if (!webhookUrl.startsWith('https://') && !webhookUrl.includes('localhost')) {
    log('\n⚠️  Warning: Google requires HTTPS for RISC webhooks', colors.yellow)
    log('Your webhook URL should use HTTPS in production.')
    
    if (webhookUrl.includes('localhost')) {
      log('\nFor local testing, you can use ngrok:', colors.cyan)
      log('1. Install ngrok: https://ngrok.com/')
      log('2. Run: ngrok http 3000')
      log('3. Use the HTTPS URL from ngrok as your webhook URL')
    }
  }
  
  // 3. Check current RISC configuration
  logSection('Checking Current Configuration')
  
  try {
    const currentConfig = await getStreamConfiguration()
    
    if (currentConfig) {
      log('Current RISC configuration:', colors.cyan)
      console.log(JSON.stringify(currentConfig, null, 2))
      
      const currentStatus = await getStreamStatus()
      if (currentStatus) {
        log(`\nStream status: ${currentStatus.status}`, 
          currentStatus.status === 'enabled' ? colors.green : colors.yellow)
      }
      
      // Ask if user wants to update
      log('\nRISC is already configured. Do you want to update it? (y/n)', colors.yellow)
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      const answer = await new Promise<string>((resolve) => {
        rl.question('> ', (answer: string) => {
          rl.close()
          resolve(answer.toLowerCase())
        })
      })
      
      if (answer !== 'y' && answer !== 'yes') {
        log('Setup cancelled', colors.yellow)
        process.exit(0)
      }
    } else {
      log('No existing RISC configuration found', colors.cyan)
    }
  } catch (error) {
    log(`Error checking configuration: ${error}`, colors.red)
    log('This might be normal if RISC has never been configured.', colors.yellow)
  }
  
  // 4. Set up RISC
  logSection('Configuring RISC')
  
  log(`Setting up RISC with webhook: ${webhookUrl}`, colors.cyan)
  
  try {
    const success = await setupRisc(webhookUrl)
    
    if (success) {
      log('\n✓ RISC setup completed successfully!', colors.green)
      
      logSection('Next Steps')
      
      log('1. Google will send a verification token to your webhook', colors.cyan)
      log('   Make sure your webhook endpoint is accessible')
      
      log('\n2. Run the database migration to create RISC tables:', colors.cyan)
      log('   npm run db:migrate')
      
      log('\n3. Test your setup:', colors.cyan)
      log('   - Sign in with a test account')
      log('   - Change the password on the Google account')
      log('   - Check if your app receives the security event')
      
      log('\n4. Monitor security events in your database:', colors.cyan)
      log('   SELECT * FROM security_events;')
      log('   SELECT * FROM user_security_status;')
      
      log('\n5. For production:', colors.cyan)
      log('   - Ensure webhook URL uses HTTPS')
      log('   - Set up monitoring for security events')
      log('   - Implement appropriate user notifications')
      log('   - Review and comply with RISC Terms of Service')
      
    } else {
      log('\n✗ RISC setup failed', colors.red)
      log('Please check the error messages above and try again.', colors.yellow)
      process.exit(1)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`\n✗ Setup error: ${errorMessage}`, colors.red)
    
    // Provide specific guidance based on error
    if (errorMessage.includes('403')) {
      log('\nPermission denied. Please ensure:', colors.yellow)
      log('1. The RISC API is enabled in your Google Cloud project')
      log('2. Your service account has the RISC Configuration Admin role')
      log('3. You have accepted the RISC Terms of Service')
    } else if (errorMessage.includes('401')) {
      log('\nAuthentication failed. Please check:', colors.yellow)
      log('1. Your service account key is valid')
      log('2. The key belongs to the correct project')
    } else if (errorMessage.includes('must be an HTTPS URL')) {
      log('\nWebhook URL must use HTTPS. For local testing:', colors.yellow)
      log('1. Use ngrok: ngrok http 3000')
      log('2. Use the HTTPS URL from ngrok')
    }
    
    process.exit(1)
  }
}

// Run the setup
main().catch((error) => {
  log(`\nUnexpected error: ${error}`, colors.red)
  process.exit(1)
})
