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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F5F3] to-[#E8E0F3]">
      {/* Simple animated background elements with gold touches */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#6A4C93]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9A8AC0]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        {/* Gold sparkles */}
        <Sparkles className="absolute top-20 right-20 w-8 h-8 text-[#D4AF37]/20 animate-pulse" />
        <Sparkles className="absolute bottom-20 left-20 w-6 h-6 text-[#D4AF37]/20 animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 text-center space-y-8 px-6 max-w-2xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Icon with Gold Glow */}
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-xl rounded-full animate-pulse" />
          <Atom className="w-16 h-16 text-[#6A4C93] animate-spin-slow relative" style={{
            filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.3))'
          }} />
        </div>

        {/* Title with Gold Accent */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold relative">
            <span className="bg-gradient-to-r from-[#4A1A4A] via-[#6A4C93] to-[#D4AF37] bg-clip-text text-transparent animate-gradient">
              Antocci Physics
            </span>
            {/* Gold underline accent */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full" />
          </h1>
          
          {/* Simple Subtitle */}
          <p className="text-xl md:text-2xl text-[#6A4C93]/80 font-light">
            Welcome to your online physics classroom
          </p>
        </div>

        {/* CTA Button with Gold Accents */}
        <div className="pt-8">
          <Button 
            onClick={handleGetStarted}
            className="group relative bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] text-white text-lg px-12 py-6 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 border border-[#D4AF37]/30 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              {session ? "Enter Classroom" : "Sign In to Get Started"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#D4AF37]" />
            </span>
            {/* Gold shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>

        {/* Login hint with gold accent */}
        {!session && (
          <p className="text-sm text-[#9A8AC0] pt-4">
            Use your <span className="text-[#D4AF37] font-medium">school Google account</span> to sign in
          </p>
        )}
      </div>

      {/* Minimal styles with gold animations */}
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