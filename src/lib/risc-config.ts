/**
 * RISC Configuration Management
 * Manages the registration and configuration of RISC endpoints with Google
 * https://developers.google.com/identity/protocols/risc
 */

import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

const RISC_API_BASE = 'https://risc.googleapis.com/v1beta'

interface StreamConfiguration {
  delivery: {
    delivery_method: string
    url?: string
  }
  events_requested?: string[]
  status?: 'enabled' | 'disabled'
}

interface StreamStatus {
  status: 'enabled' | 'disabled'
  status_updated_at: string
}

/**
 * Gets the service account credentials for RISC API access
 */
function getServiceAccountCredentials() {
  // Try multiple locations for the service account key
  const possiblePaths = [
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    path.join(process.cwd(), 'service-account-key.json'),
    path.join(process.cwd(), 'credentials', 'service-account-key.json')
  ].filter(Boolean) as string[]

  for (const keyPath of possiblePaths) {
    if (fs.existsSync(keyPath)) {
      return JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    }
  }

  // If no file found, try using environment variable with JSON content
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    } catch (error) {
      console.error('Failed to parse service account key from environment variable:', error)
    }
  }

  throw new Error('Service account key not found. Please set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_KEY environment variable.')
}

/**
 * Creates an authenticated client for the RISC API
 */
async function getAuthenticatedClient() {
  try {
    const credentials = getServiceAccountCredentials()
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/risc.configuration.readwrite',
        'https://www.googleapis.com/auth/risc.status.readwrite',
        'https://www.googleapis.com/auth/risc.verify'
      ]
    })

    return await auth.getClient()
  } catch (error) {
    console.error('Failed to create authenticated client:', error)
    throw error
  }
}

/**
 * Gets the current RISC stream configuration
 */
export async function getStreamConfiguration(): Promise<StreamConfiguration | null> {
  try {
    const client = await getAuthenticatedClient()
    const accessToken = await client.getAccessToken()
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(`${RISC_API_BASE}/stream`, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Accept': 'application/json'
      }
    })

    if (response.status === 404) {
      console.log('No RISC configuration found')
      return null
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get stream configuration: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting stream configuration:', error)
    throw error
  }
}

/**
 * Updates or creates the RISC stream configuration
 */
export async function updateStreamConfiguration(
  webhookUrl: string,
  eventsRequested?: string[]
): Promise<StreamConfiguration> {
  try {
    const client = await getAuthenticatedClient()
    const accessToken = await client.getAccessToken()
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    const configuration: StreamConfiguration = {
      delivery: {
        delivery_method: 'https://schemas.openid.net/secevent/risc/delivery-method/push',
        url: webhookUrl
      },
      events_requested: eventsRequested || [
        'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
        'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked',
        'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
        'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
        'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required',
        'https://schemas.openid.net/secevent/risc/event-type/account-purged'
      ]
    }

    const response = await fetch(`${RISC_API_BASE}/stream:update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(configuration)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update stream configuration: ${response.status} - ${error}`)
    }

    const result = await response.json()
    console.log('Stream configuration updated successfully:', result)
    return result
  } catch (error) {
    console.error('Error updating stream configuration:', error)
    throw error
  }
}

/**
 * Gets the current stream status (enabled/disabled)
 */
export async function getStreamStatus(): Promise<StreamStatus | null> {
  try {
    const client = await getAuthenticatedClient()
    const accessToken = await client.getAccessToken()
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(`${RISC_API_BASE}/stream/status`, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Accept': 'application/json'
      }
    })

    if (response.status === 404) {
      console.log('No stream status found')
      return null
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get stream status: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting stream status:', error)
    throw error
  }
}

/**
 * Updates the stream status (enable/disable)
 */
export async function updateStreamStatus(status: 'enabled' | 'disabled'): Promise<StreamStatus> {
  try {
    const client = await getAuthenticatedClient()
    const accessToken = await client.getAccessToken()
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(`${RISC_API_BASE}/stream/status:update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update stream status: ${response.status} - ${error}`)
    }

    const result = await response.json()
    console.log(`Stream status updated to ${status}:`, result)
    return result
  } catch (error) {
    console.error('Error updating stream status:', error)
    throw error
  }
}

/**
 * Verifies that the RISC endpoint is properly configured
 */
export async function verifyEndpoint(): Promise<boolean> {
  try {
    const client = await getAuthenticatedClient()
    const accessToken = await client.getAccessToken()
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(`${RISC_API_BASE}/stream:verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Endpoint verification failed: ${response.status} - ${error}`)
      return false
    }

    console.log('Endpoint verification initiated successfully')
    return true
  } catch (error) {
    console.error('Error verifying endpoint:', error)
    return false
  }
}

/**
 * Complete RISC setup process
 */
export async function setupRisc(webhookUrl: string) {
  console.log('Starting RISC setup...')
  
  try {
    // 1. Check current configuration
    let config = await getStreamConfiguration()
    
    if (config) {
      console.log('Existing RISC configuration found:', config)
    } else {
      console.log('No existing RISC configuration, creating new one...')
    }
    
    // 2. Update or create configuration
    config = await updateStreamConfiguration(webhookUrl)
    console.log('Configuration updated:', config)
    
    // 3. Enable the stream
    const status = await updateStreamStatus('enabled')
    console.log('Stream enabled:', status)
    
    // 4. Verify the endpoint
    const verified = await verifyEndpoint()
    if (verified) {
      console.log('Endpoint verification initiated. Google will send a verification token to your webhook.')
    } else {
      console.warn('Endpoint verification failed. Please check your webhook URL.')
    }
    
    console.log('RISC setup completed successfully!')
    return true
  } catch (error) {
    console.error('RISC setup failed:', error)
    return false
  }
}
