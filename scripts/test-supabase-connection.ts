#!/usr/bin/env tsx
/**
 * Test if Supabase project exists and is accessible
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Checking Supabase Configuration...\n')

console.log('Environment Variables:')
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || '❌ MISSING')
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '❌ MISSING')
console.log()

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables!\n')
  console.log('📝 TO FIX:')
  console.log('   1. Go to https://supabase.com/dashboard')
  console.log('   2. Create a new project (or open existing)')
  console.log('   3. Go to Project Settings > API')
  console.log('   4. Copy the URL and anon key to .env.local')
  process.exit(1)
}

// Try to fetch from the Supabase REST API
async function testConnection() {
  console.log('🔌 Testing connection...\n')
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })

    console.log('Response Status:', response.status, response.statusText)
    console.log('Response Headers:')
    response.headers.forEach((value, key) => {
      if (key.includes('postgres') || key.includes('supabase')) {
        console.log(`  ${key}: ${value}`)
      }
    })

    const text = await response.text()
    console.log('\nResponse Body (first 500 chars):')
    console.log(text.substring(0, 500))

    if (response.ok) {
      console.log('\n✅ Connection successful!')
      console.log('   Your Supabase project is accessible.')
      console.log('   Next step: Run database migrations.')
    } else if (text.includes('malware') || text.includes('blocked')) {
      console.log('\n🚫 CONNECTION BLOCKED!')
      console.log('   Your network is blocking access to Supabase.')
      console.log('   This could be:')
      console.log('   - School/company firewall')
      console.log('   - DNS filtering')
      console.log('   - VPN required')
    } else if (response.status === 404) {
      console.log('\n❌ PROJECT NOT FOUND!')
      console.log('   The Supabase project does not exist.')
      console.log('   You need to create a new project.')
    } else {
      console.log('\n⚠️  Unexpected response')
      console.log('   Status:', response.status)
    }
  } catch (error: any) {
    console.error('\n❌ CONNECTION FAILED!')
    console.error('   Error:', error.message)
    
    if (error.message.includes('fetch failed')) {
      console.log('\n📝 POSSIBLE CAUSES:')
      console.log('   1. Supabase project doesn\'t exist')
      console.log('   2. Network blocking Supabase')
      console.log('   3. Invalid URL or API key')
      console.log('\n🔧 TO FIX:')
      console.log('   1. Visit https://supabase.com/dashboard')
      console.log('   2. Check if project exists')
      console.log('   3. Create new project if needed')
      console.log('   4. Update .env.local with correct values')
    }
  }
}

testConnection().catch(console.error)
