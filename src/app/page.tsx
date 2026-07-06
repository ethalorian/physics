"use client"
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Atom } from "lucide-react";
import { getUserRole } from "@/lib/permissions";

/**
 * Pre-auth landing. Rebuilt on the calm system (see docs/DESIGN_SYSTEM.md):
 * tokens only, entrance motion once (auto-gated by the global
 * prefers-reduced-motion guard in globals.css), no idle animation, and one
 * honest line about what this actually is instead of three vague cards.
 */
export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      // Students → student hub; teachers → teacher home; admins → command center.
      // Prefer the session-baked role (honors DB teacher grants).
      const role = session.user?.role ?? getUserRole(session.user?.email);
      router.push(role === "student" ? "/home" : role === "teacher" ? "/admin/teacher" : "/admin/home");
    } else {
      // New sign-ins are students by default → land on the home hub.
      signIn("google", { callbackUrl: "/home" });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div className="landing-enter text-center" style={{ maxWidth: 560 }}>
        {/* wordmark */}
        <div
          className="mx-auto grid place-items-center mb-6"
          style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'color-mix(in oklch, var(--primary) 12%, transparent)',
            color: 'var(--primary)',
          }}
        >
          <Atom size={34} strokeWidth={1.75} />
        </div>

        <h1 className="text-display">Antocci Physics</h1>

        {/* the one honest line */}
        <p className="text-body mt-4" style={{ color: 'var(--muted-foreground)' }}>
          The online classroom for Mr.&nbsp;Antocci&rsquo;s physics students &mdash; readings,
          labs, and skill practice, with mastery your teacher rates from your real work.
        </p>

        {/* single CTA — primary token, no gradient, no shimmer */}
        <div className="mt-8">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)',
              transition: 'transform .2s cubic-bezier(0.16,1,0.3,1), box-shadow .2s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
          >
            {session ? 'Open your classroom' : 'Sign in to get started'} <ArrowRight size={18} />
          </button>
        </div>

        {/* the sign-in expectation */}
        {!session && (
          <p className="text-caption mt-4">
            Use your <span style={{ color: 'var(--primary)', fontWeight: 600 }}>school Google account</span> &mdash; it
            connects you to your class roster automatically.
          </p>
        )}
      </div>

      {/* entrance once, then still. The global reduced-motion guard in
          globals.css collapses this to a single frame when requested. */}
      <style jsx>{`
        .landing-enter {
          animation: landing-rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes landing-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
