import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            // Google Classroom scopes
            "https://www.googleapis.com/auth/classroom.courses.readonly",
            "https://www.googleapis.com/auth/classroom.rosters.readonly",
            "https://www.googleapis.com/auth/classroom.coursework.students",
            "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
          ].join(" "),
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      // Allow both HTTP and HTTPS in development
      checks: process.env.NODE_ENV === "development" ? ["state"] : ["state", "pkce"],
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
        // Include the Google access token for API calls
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
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
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
      }
      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token;
      }
      
      // Return token if it hasn't expired
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          });

          const refreshedTokens = await response.json();

          if (!response.ok) {
            throw refreshedTokens;
          }

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
          };
        } catch (error) {
          console.error('Error refreshing access token:', error);
          // Return token as-is, will need to re-authenticate
          return {
            ...token,
            error: 'RefreshAccessTokenError',
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
