import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { 
  encryptToken, 
  decryptToken, 
  getInitialScopes,
  getSecureClientCredentials,
  handleTokenRefreshError,
  isTokenExpired,
  logOAuthClientUsage,
  validateOAuthConfig
} from './oauth-security'

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken?: string
    tokenError?: string
    requiresReauth?: boolean
  }
}

// Test user accounts (only available in development)
const TEST_USERS = [
  {
    id: "test-student-1",
    email: "student@test.com",
    name: "Test Student",
    password: "student123",
    role: "student"
  },
  {
    id: "test-teacher-1",
    email: "teacher@test.com",
    name: "Test Teacher",
    password: "teacher123",
    role: "teacher"
  },
  {
    id: "test-admin-1",
    email: "admin@test.com",
    name: "Test Admin",
    password: "admin123",
    role: "admin"
  }
]

// Validate OAuth configuration on startup in production
if (process.env.NODE_ENV === 'production') {
  try {
    validateOAuthConfig()
  } catch (error) {
    console.error('OAuth configuration validation failed:', error)
    // In production, we should fail fast if OAuth is misconfigured
    throw error
  }
}

// Get secure credentials
const credentials = process.env.NODE_ENV === 'production' 
  ? getSecureClientCredentials() 
  : {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      authorization: {
        params: {
          // Best practice: Use incremental authorization
          // Start with minimal scopes, request more as needed
          scope: getInitialScopes().join(" "),
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      // Use PKCE for enhanced security (recommended by Google)
      checks: ["state", "pkce"],
    }),
    // Test credentials provider (only in development)
    ...(process.env.NODE_ENV === "development" ? [
      CredentialsProvider({
        id: "test-credentials",
        name: "Test Account",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = TEST_USERS.find(
            u => u.email === credentials.email && u.password === credentials.password
          )

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          return null
        }
      })
    ] : [])
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        // Include the avatar image from the token
        if (token.picture) {
          session.user.image = token.picture as string;
        }
        
        // Check for token errors that require re-authentication
        if (token.error === 'RefreshAccessTokenError') {
          session.tokenError = 'Your session has expired. Please sign in again.';
          session.requiresReauth = true;
        } else if (token.accessToken) {
          try {
            // Decrypt the access token for use
            const decryptedToken = process.env.TOKEN_ENCRYPTION_KEY 
              ? decryptToken(token.accessToken as string)
              : token.accessToken as string;
            session.accessToken = decryptedToken;
          } catch (error) {
            console.error('Failed to decrypt access token:', error);
            session.tokenError = 'Session error. Please sign in again.';
            session.requiresReauth = true;
          }
        }
      }
      return session;
    },
    jwt: async ({ user, token, account }) => {
      if (user) {
        token.sub = user.id;
        // Store the avatar image in the token
        if (user.image) {
          token.picture = user.image;
        }
      }
      
      // Store Google access token from the account (first sign-in)
      if (account?.access_token) {
        // Best practice: Encrypt tokens before storage
        const encryptedToken = process.env.TOKEN_ENCRYPTION_KEY
          ? encryptToken(account.access_token)
          : account.access_token;
        
        token.accessToken = encryptedToken;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
        
        // Log OAuth client usage for monitoring
        await logOAuthClientUsage(credentials.clientId, 'auth');
      }
      
      if (account?.refresh_token) {
        // Best practice: Encrypt refresh tokens
        const encryptedRefreshToken = process.env.TOKEN_ENCRYPTION_KEY
          ? encryptToken(account.refresh_token)
          : account.refresh_token;
        token.refreshToken = encryptedRefreshToken;
      }
      
      // Check if token is expired (with 5-minute buffer)
      if (token.accessTokenExpires && !isTokenExpired(token.accessTokenExpires as number)) {
        return token;
      }
      
      // Access token has expired or will expire soon, try to refresh it
      if (token.refreshToken) {
        try {
          // Decrypt refresh token for use
          const refreshToken = process.env.TOKEN_ENCRYPTION_KEY
            ? decryptToken(token.refreshToken as string)
            : token.refreshToken as string;
          
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: credentials.clientId,
              client_secret: credentials.clientSecret,
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          });

          const refreshedTokens = await response.json();

          if (!response.ok) {
            throw refreshedTokens;
          }
          
          // Log successful refresh
          await logOAuthClientUsage(credentials.clientId, 'refresh');
          
          // Encrypt the new tokens
          const encryptedNewToken = process.env.TOKEN_ENCRYPTION_KEY
            ? encryptToken(refreshedTokens.access_token)
            : refreshedTokens.access_token;

          return {
            ...token,
            accessToken: encryptedNewToken,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token 
              ? (process.env.TOKEN_ENCRYPTION_KEY 
                ? encryptToken(refreshedTokens.refresh_token)
                : refreshedTokens.refresh_token)
              : token.refreshToken, // Fall back to old refresh token
          };
        } catch (error) {
          // Best practice: Handle refresh token errors properly
          const errorResult = await handleTokenRefreshError(
            error, 
            token.email as string
          );
          
          return {
            ...token,
            ...errorResult
          };
        }
      }
      
      return token;
    },
    redirect: async ({ url, baseUrl }) => {
      // If signing in and no specific callback URL, redirect to dashboard
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard`
      }
      
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      
      return baseUrl
    },
    signIn: async () => {
      // You can add additional checks here if needed
      // For example, to restrict to specific email domains:
      // if (profile?.email && !profile.email.endsWith('@yourschool.edu')) {
      //   return false;
      // }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  trustHost: true,
  // Enable debug in development to see more detailed errors
  debug: process.env.NODE_ENV === "development",
})
