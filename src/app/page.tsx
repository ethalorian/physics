"use client"
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Atom, Sparkles } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleGetStarted = () => {
    if (session) {
      // If logged in, go to dashboard
      router.push("/dashboard");
    } else {
      // If not logged in, sign in first with dashboard as callback
      signIn("google", { callbackUrl: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      {/* Simple animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        {/* Sparkles - hidden on mobile for cleaner look */}
        <Sparkles className="hidden sm:block absolute top-20 right-20 w-8 h-8 text-primary/20 animate-pulse" />
        <Sparkles className="hidden sm:block absolute bottom-20 left-20 w-6 h-6 text-primary/20 animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 text-center space-y-6 sm:space-y-8 px-4 sm:px-6 max-w-sm sm:max-w-2xl md:max-w-4xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Icon with Glow */}
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Atom className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin-slow relative" style={{
            filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))'
          }} />
        </div>

        {/* Title */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold relative leading-tight">
            <span className="text-foreground relative">
              Antocci Physics
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-primary/30 opacity-20 blur-sm -z-10"></span>
            </span>
            {/* Underline accent */}
            <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed">
            Welcome to your online physics classroom
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-6 sm:pt-8">
          <Button 
            onClick={handleGetStarted}
            className="group relative bg-primary hover:bg-primary/80 text-primary-foreground text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 border border-primary/50 hover:border-primary overflow-hidden w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
              <span className="text-center">
                {session ? "Enter Classroom" : "Sign In to Get Started"}
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>

        {/* Login hint */}
        {!session && (
          <p className="text-xs sm:text-sm text-muted-foreground pt-3 sm:pt-4 px-2">
            Use your <span className="text-primary font-medium">school Google account</span> to sign in
          </p>
        )}
      </div>

      {/* Minimal animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        :global(.animate-spin-slow) {
          animation: spin-slow 20s linear infinite;
        }
        :global(.animate-gradient) {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
}