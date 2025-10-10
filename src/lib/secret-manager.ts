/**
 * Secret Manager Interface and Implementations
 * Provides secure access to sensitive configuration values
 */

// Dynamic import for optional dependency
let SecretManagerServiceClient: any

// Interface for all secret manager implementations
export interface SecretManager {
  getSecret(secretName: string): Promise<string | null>
  setSecret(secretName: string, value: string): Promise<void>
  deleteSecret(secretName: string): Promise<void>
  listSecrets(): Promise<string[]>
  isConfigured(): boolean
}

// Types for configuration
export interface SecretManagerConfig {
  provider: 'google' | 'vercel' | 'aws' | 'azure' | 'env' | 'vault'
  projectId?: string
  region?: string
  keyVaultUrl?: string
  vaultUrl?: string
  vaultToken?: string
}

/**
 * Google Cloud Secret Manager Implementation
 */
class GoogleSecretManager implements SecretManager {
  private client: any = null
  private projectId: string
  private initPromise: Promise<void> | null = null

  constructor(projectId: string) {
    this.projectId = projectId
  }

  private async initialize() {
    if (this.client !== null || this.initPromise) {
      return
    }
    
    this.initPromise = (async () => {
      try {
        // Try to dynamically import the Google Cloud Secret Manager
        // @ts-expect-error - Optional dependency, will be null if not installed
        const secretManagerModule = await import('@google-cloud/secret-manager').catch(() => null)
        
        if (!secretManagerModule) {
          console.log('Google Cloud Secret Manager package not installed (optional for development)')
          return
        }
        
        SecretManagerServiceClient = secretManagerModule.SecretManagerServiceClient
        
        // Only initialize if credentials are available
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SERVICE_ACCOUNT_KEY) {
          this.client = new SecretManagerServiceClient({
            projectId: this.projectId,
            // If GCP_SERVICE_ACCOUNT_KEY is provided as JSON string, use it
            credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
              ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
              : undefined
          })
        }
      } catch (error) {
        console.error('Failed to initialize Google Secret Manager:', error)
        this.client = null
      }
    })()
    
    await this.initPromise
  }

  async isConfiguredAsync(): Promise<boolean> {
    await this.initialize()
    return this.client !== null
  }
  
  isConfigured(): boolean {
    // For synchronous check, just return current state
    // Use isConfiguredAsync() for accurate check after initialization
    return this.client !== null
  }

  async getSecret(secretName: string): Promise<string | null> {
    await this.initialize()
    
    if (!this.client) {
      throw new Error('Google Secret Manager is not configured')
    }

    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`
      const [version] = await this.client.accessSecretVersion({ name })
      
      const payload = version.payload?.data
      if (!payload) return null
      
      // Decode the secret
      const secret = Buffer.from(payload.toString(), 'base64').toString('utf8')
      return secret
    } catch (error: any) {
      if (error.code === 5) { // NOT_FOUND
        return null
      }
      throw error
    }
  }

  async setSecret(secretName: string, value: string): Promise<void> {
    await this.initialize()
    
    if (!this.client) {
      throw new Error('Google Secret Manager is not configured')
    }

    try {
      // Try to create the secret first
      const parent = `projects/${this.projectId}`
      const secretId = secretName
      
      try {
        await this.client.createSecret({
          parent,
          secretId,
          secret: {
            replication: {
              automatic: {}
            }
          }
        })
      } catch (error: any) {
        // Ignore if secret already exists
        if (error.code !== 6) { // ALREADY_EXISTS
          throw error
        }
      }

      // Add the secret version
      const secretPath = `projects/${this.projectId}/secrets/${secretName}`
      await this.client.addSecretVersion({
        parent: secretPath,
        payload: {
          data: Buffer.from(value, 'utf8')
        }
      })
    } catch (error) {
      throw new Error(`Failed to set secret: ${error}`)
    }
  }

  async deleteSecret(secretName: string): Promise<void> {
    await this.initialize()
    
    if (!this.client) {
      throw new Error('Google Secret Manager is not configured')
    }

    try {
      const name = `projects/${this.projectId}/secrets/${secretName}`
      await this.client.deleteSecret({ name })
    } catch (error) {
      throw new Error(`Failed to delete secret: ${error}`)
    }
  }

  async listSecrets(): Promise<string[]> {
    await this.initialize()
    
    if (!this.client) {
      throw new Error('Google Secret Manager is not configured')
    }

    try {
      const parent = `projects/${this.projectId}`
      const [secrets] = await this.client.listSecrets({ parent })
      return secrets.map((secret: any) => secret.name?.split('/').pop() || '').filter(Boolean)
    } catch (error) {
      throw new Error(`Failed to list secrets: ${error}`)
    }
  }
}

/**
 * Vercel Environment Variables Implementation
 * Uses Vercel's built-in secure environment variable storage
 */
class VercelSecretManager implements SecretManager {
  isConfigured(): boolean {
    // Check if running on Vercel
    return process.env.VERCEL !== undefined
  }

  async getSecret(secretName: string): Promise<string | null> {
    // Vercel automatically injects environment variables
    // Convert secret name to environment variable format
    const envName = this.secretNameToEnvVar(secretName)
    return process.env[envName] || null
  }

  async setSecret(_secretName: string, _value: string): Promise<void> {
    // Setting secrets in Vercel requires using the Vercel API or dashboard
    // This is intentionally not implemented for security reasons
    throw new Error('Setting secrets programmatically is not supported for Vercel. Use the Vercel dashboard or CLI.')
  }

  async deleteSecret(_secretName: string): Promise<void> {
    throw new Error('Deleting secrets programmatically is not supported for Vercel. Use the Vercel dashboard or CLI.')
  }

  async listSecrets(): Promise<string[]> {
    // Return known secret keys
    const knownSecrets = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXTAUTH_SECRET',
      'TOKEN_ENCRYPTION_KEY',
      'OPENAI_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ]
    return knownSecrets.filter(key => process.env[key] !== undefined)
  }

  private secretNameToEnvVar(secretName: string): string {
    // Convert from secret naming convention to environment variable convention
    const mapping: Record<string, string> = {
      'google-client-id': 'GOOGLE_CLIENT_ID',
      'google-client-secret': 'GOOGLE_CLIENT_SECRET',
      'nextauth-secret': 'NEXTAUTH_SECRET',
      'token-encryption-key': 'TOKEN_ENCRYPTION_KEY',
      'openai-api-key': 'OPENAI_API_KEY',
      'supabase-url': 'NEXT_PUBLIC_SUPABASE_URL',
      'supabase-anon-key': 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    }
    return mapping[secretName] || secretName.toUpperCase().replace(/-/g, '_')
  }
}

/**
 * Environment Variables Secret Manager (Fallback)
 * Used for development and when no other secret manager is configured
 */
class EnvSecretManager implements SecretManager {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  isConfigured(): boolean {
    return true // Always available as fallback
  }

  async getSecret(secretName: string): Promise<string | null> {
    if (!this.isDevelopment && !process.env.ALLOW_ENV_SECRETS) {
      console.warn(`⚠️  Using environment variables for secrets in production. Consider using a secret manager.`)
    }
    
    const envName = secretName.toUpperCase().replace(/-/g, '_')
    return process.env[envName] || null
  }

  async setSecret(secretName: string, _value: string): Promise<void> {
    throw new Error(`Cannot set environment variable ${secretName} at runtime`)
  }

  async deleteSecret(secretName: string): Promise<void> {
    throw new Error(`Cannot delete environment variable ${secretName} at runtime`)
  }

  async listSecrets(): Promise<string[]> {
    return Object.keys(process.env).filter(key => 
      key.includes('SECRET') || 
      key.includes('KEY') || 
      key.includes('CLIENT')
    )
  }
}

/**
 * Secret Manager Factory
 */
export class SecretManagerFactory {
  private static instance: SecretManager | null = null
  private static config: SecretManagerConfig | null = null

  /**
   * Configure the secret manager
   */
  static configure(config: SecretManagerConfig) {
    this.config = config
    this.instance = null // Reset instance to force recreation
  }

  /**
   * Auto-detect the best secret manager based on environment
   */
  static autoDetect(): SecretManager {
    // Check for Google Cloud
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT_ID) {
      const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
      if (projectId) {
        console.log('🔐 Attempting to use Google Cloud Secret Manager')
        console.log('   Note: Requires @google-cloud/secret-manager package')
        return new GoogleSecretManager(projectId)
      }
    }

    // Check for Vercel
    if (process.env.VERCEL) {
      console.log('🔐 Using Vercel Environment Variables')
      return new VercelSecretManager()
    }

    // Check if we should explicitly allow environment variables
    if (process.env.ALLOW_ENV_SECRETS === 'true' || process.env.NODE_ENV !== 'production') {
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️  Using environment variables for secrets (ALLOW_ENV_SECRETS=true)')
      } else {
        console.log('🔐 Using environment variables (development mode)')
      }
      return new EnvSecretManager()
    }

    // Default to environment variables with warning
    console.warn('⚠️  No secret manager configured. Using environment variables.')
    return new EnvSecretManager()
  }

  /**
   * Get the configured secret manager instance
   */
  static getInstance(): SecretManager {
    if (!this.instance) {
      if (this.config) {
        switch (this.config.provider) {
          case 'google':
            if (!this.config.projectId) {
              throw new Error('Google Secret Manager requires projectId')
            }
            this.instance = new GoogleSecretManager(this.config.projectId)
            break
          case 'vercel':
            this.instance = new VercelSecretManager()
            break
          case 'env':
            this.instance = new EnvSecretManager()
            break
          default:
            throw new Error(`Unsupported secret manager provider: ${this.config.provider}`)
        }
      } else {
        this.instance = this.autoDetect()
      }
    }
    return this.instance
  }

  /**
   * Helper method to get a secret directly
   */
  static async getSecret(secretName: string): Promise<string | null> {
    const manager = this.getInstance()
    return manager.getSecret(secretName)
  }

  /**
   * Helper method to check if a secret manager is properly configured
   */
  static isConfigured(): boolean {
    const manager = this.getInstance()
    return manager.isConfigured() && !(manager instanceof EnvSecretManager && process.env.NODE_ENV === 'production' && !process.env.ALLOW_ENV_SECRETS)
  }
}

/**
 * Cached secret retrieval with fallback
 */
const secretCache = new Map<string, { value: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCachedSecret(
  secretName: string, 
  fallbackEnvVar?: string
): Promise<string | null> {
  // Check cache first
  const cached = secretCache.get(secretName)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value
  }

  try {
    // Try to get from secret manager
    const manager = SecretManagerFactory.getInstance()
    let value = await manager.getSecret(secretName)
    
    // Fallback to environment variable if specified
    if (!value && fallbackEnvVar) {
      value = process.env[fallbackEnvVar] || null
    }
    
    // Cache the result
    if (value) {
      secretCache.set(secretName, { value, timestamp: Date.now() })
    }
    
    return value
  } catch (error) {
    console.error(`Failed to retrieve secret ${secretName}:`, error)
    
    // Final fallback to environment variable
    if (fallbackEnvVar) {
      return process.env[fallbackEnvVar] || null
    }
    
    return null
  }
}

/**
 * Clear the secret cache (useful for testing or forced refresh)
 */
export function clearSecretCache() {
  secretCache.clear()
}
