"use client"
import { SessionProvider } from "next-auth/react"

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // In development, use localhost URL to avoid fetch errors
  const basePath = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/auth'
    : undefined
  
  return (
    <SessionProvider 
      basePath={basePath}
      refetchInterval={0}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}