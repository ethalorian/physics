"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Home, LogIn, RefreshCw, ChevronLeft } from "lucide-react"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function AuthError() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  
  const error = searchParams.get("error")
  
  // More detailed error messages with solutions
  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return {
          title: "Configuration Error",
          message: "There's a problem with the authentication setup.",
          solution: "This is likely a redirect URI mismatch. Please contact your administrator.",
          showTryAgain: false
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          message: "You don't have permission to sign in.",
          solution: "Make sure you're using your school Google account and that you've been added to the class.",
          showTryAgain: true
        }
      case "Verification":
        return {
          title: "Verification Required",
          message: "Your account needs to be verified.",
          solution: "Please check your email for a verification link.",
          showTryAgain: false
        }
      default:
        return {
          title: "Authentication Error",
          message: "We couldn't complete the sign-in process.",
          solution: "Try signing in again with a different Google account, or clear your browser data.",
          showTryAgain: true
        }
    }
  }

  const errorDetails = getErrorDetails(error)

  const handleTryAgain = async () => {
    setIsSigningIn(true)
    try {
      // Force account selection to allow choosing a different account
      await signIn("google", { 
        callbackUrl: "/dashboard",
        prompt: "select_account"
      })
    } catch (error) {
      console.error("Sign-in error:", error)
      setIsSigningIn(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleSignOut = () => {
    // Clear any partial session data
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-6">
        {/* Error Icon and Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {errorDetails.title}
            </h1>
            <p className="text-muted-foreground">
              {errorDetails.message}
            </p>
          </div>
        </div>

        {/* Error Details */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">What to do:</p>
          <p className="text-sm text-muted-foreground">
            {errorDetails.solution}
          </p>
          {error && (
            <p className="text-xs text-muted-foreground/70 font-mono mt-2">
              Error code: {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {errorDetails.showTryAgain && (
            <Button
              onClick={handleTryAgain}
              disabled={isSigningIn}
              className="w-full h-12"
              variant="default"
            >
              {isSigningIn ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Try Different Account
                </>
              )}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="h-10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Go Back
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="h-10"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          </div>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full h-10 text-muted-foreground"
          >
            Clear session and start over
          </Button>
        </div>

        {/* Additional Help */}
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm font-medium text-center">
            Common Solutions:
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Sign out of all Google accounts and try again</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Use an incognito/private browser window</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Clear your browser's cookies and cache</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Make sure you're using your school email (@yourschool.edu)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Disable browser extensions that might interfere</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
