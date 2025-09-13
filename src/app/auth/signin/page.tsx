"use client"

import { Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { useState } from "react"

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  
  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "OAuthSignin":
        return "There was a problem starting the sign-in process. Please try again."
      case "OAuthCallback":
        return "There was a problem completing the sign-in. Please check your Google account permissions."
      case "OAuthCreateAccount":
        return "Could not create your account. Please contact support."
      case "EmailCreateAccount":
        return "Could not create your account. Please try a different sign-in method."
      case "Callback":
        return "There was an issue with the authentication callback."
      case "OAuthAccountNotLinked":
        return "This email is already associated with another sign-in method."
      case "SessionRequired":
        return "Please sign in to continue."
      case "Default":
      default:
        return "An unexpected error occurred during sign-in. Please try again."
    }
  }

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      // Force account selection with prompt
      await signIn("google", { 
        callbackUrl, 
        prompt: "select_account" 
      })
    } catch (error) {
      console.error("Sign-in error:", error)
      setIsSigningIn(false)
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Sign in to Physics Classroom</h1>
          <p className="text-muted-foreground">
            Use your school Google account to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Sign-in Error
              </p>
              <p className="text-sm text-muted-foreground">
                {getErrorMessage(error)}
              </p>
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <div className="space-y-4">
          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 text-base font-medium relative"
            variant="default"
          >
            {isSigningIn ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          {/* Alternative Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
            
            {error && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center space-y-2 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Having trouble signing in?
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Make sure you&apos;re using your school Google account</p>
            <p>• Clear your browser cookies and try again</p>
            <p>• Try a different browser or incognito mode</p>
            <p>• Contact your teacher for assistance</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
