import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

const { handlers, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      // Allow both HTTP and HTTPS in development
      checks: process.env.NODE_ENV === "development" ? ["state"] : ["state", "pkce"],
    })
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
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id;
        // Store the avatar image in the token
        if (user.image) {
          token.picture = user.image;
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
    signIn: async ({ account, profile }) => {
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

export const { GET, POST } = handlers
export { auth }