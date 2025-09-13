"use client"
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Atom, Sparkles, BookOpen, Users, Trophy, Zap, Brain, Rocket } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);
    
    // Track mouse position for parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  const features = [
    { icon: Brain, label: "Interactive Lessons", color: "text-blue-500" },
    { icon: Trophy, label: "Track Progress", color: "text-yellow-500" },
    { icon: Users, label: "Collaborative Learning", color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs with parallax */}
        <div 
          className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s", transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s", transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)` }}
        />
        
        {/* Floating physics formulas */}
        <div className="hidden md:block absolute top-32 left-20 text-2xl font-mono text-primary/10 animate-float">
          E = mc²
        </div>
        <div className="hidden md:block absolute top-40 right-32 text-xl font-mono text-primary/10 animate-float-delayed">
          F = ma
        </div>
        <div className="hidden md:block absolute bottom-40 left-32 text-2xl font-mono text-primary/10 animate-float">
          λ = h/p
        </div>
        <div className="hidden lg:block absolute top-1/2 right-20 text-xl font-mono text-primary/10 animate-float-delayed">
          ∇ × E = -∂B/∂t
        </div>
        <div className="hidden lg:block absolute bottom-32 right-40 text-lg font-mono text-primary/10 animate-float">
          pV = nRT
        </div>
        
        {/* Animated icons */}
        <Zap className="hidden sm:block absolute top-20 right-20 w-8 h-8 text-primary/20 animate-pulse" />
        <Rocket className="hidden sm:block absolute bottom-20 left-20 w-6 h-6 text-primary/20 animate-bounce-slow" />
        <Atom className="hidden lg:block absolute top-1/3 left-10 w-10 h-10 text-primary/15 animate-spin-slow" />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 text-center space-y-6 sm:space-y-8 px-4 sm:px-6 max-w-sm sm:max-w-2xl md:max-w-5xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Icon with Glow */}
        <div className="inline-block relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse group-hover:bg-primary/30 transition-colors" />
          <Atom className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin-slow relative group-hover:scale-110 transition-transform" style={{
            filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.5))'
          }} />
        </div>

        {/* Title with animated gradient */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold relative leading-tight">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-gradient bg-300% relative">
              Antocci Physics
            </span>
            {/* Animated underline */}
            <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-pulse" />
          </h1>
          
          {/* Enhanced Subtitle */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed">
            <span className="block">Master the laws of the universe</span>
            <span className="text-sm sm:text-base md:text-lg opacity-80">Interactive lessons • Real-time feedback • Personalized learning</span>
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 pb-2">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`p-4 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-lg transform ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ 
                transitionDelay: `${index * 100 + 300}ms`,
                animationDelay: `${index * 100}ms`
              }}
            >
              <feature.icon className={`w-8 h-8 ${feature.color} mx-auto mb-2`} />
              <p className="text-sm font-medium">{feature.label}</p>
            </Card>
          ))}
        </div>

        {/* CTA Button with enhanced animation */}
        <div className="pt-6 sm:pt-8">
          <Button 
            onClick={handleGetStarted}
            className="group relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-primary/50 hover:border-primary overflow-hidden w-full sm:w-auto font-medium"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
              {session ? (
                <>
                  <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Launch Classroom</span>
                </>
              ) : (
                <>
                  <span>Begin Your Journey</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
            {/* Multiple shimmer layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent translate-x-full group-hover:-translate-x-full transition-transform duration-1000 delay-100" />
          </Button>
        </div>

        {/* Enhanced login hint with animation */}
        {!session && (
          <div className="pt-3 sm:pt-4 px-2 space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground animate-fade-in">
              <Sparkles className="inline w-3 h-3 mr-1 text-primary/60" />
              Use your <span className="text-primary font-medium">school Google account</span> to sign in
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                100+ Lessons
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Join your class
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Track progress
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(5px) translateX(-5px); }
          75% { transform: translateY(-5px) translateX(10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(10px) translateX(-5px); }
          50% { transform: translateY(-5px) translateX(5px); }
          75% { transform: translateY(5px) translateX(-10px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.animate-spin-slow) {
          animation: spin-slow 20s linear infinite;
        }
        :global(.animate-gradient) {
          background-size: 300% 300%;
          animation: gradient 6s ease infinite;
        }
        :global(.bg-300\\%) {
          background-size: 300% 300%;
        }
        :global(.animate-float) {
          animation: float 8s ease-in-out infinite;
        }
        :global(.animate-float-delayed) {
          animation: float-delayed 10s ease-in-out infinite;
        }
        :global(.animate-bounce-slow) {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        :global(.animate-fade-in) {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}