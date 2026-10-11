import { auth } from "@/lib/auth";
import { getEffectiveContext } from "@/lib/effective-context";
import { canExploreSimulations } from "@/lib/simulation-access";
import Link from "next/link";
export default async function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email)
    return (
      <main className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Sign in to explore</h1>
        <Link
          className="text-primary underline"
          href="/auth/signin?callbackUrl=/simulations"
        >
          Sign in
        </Link>
      </main>
    );
  const ctx = await getEffectiveContext(session.user.email);
  if (!(await canExploreSimulations(session.user.id, ctx.role)))
    return (
      <main className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="font-serif text-3xl">
          Your investigations live in Lessons.
        </h1>
        <p>
          Your teacher has not enabled the optional simulation library for your
          class. Open assigned experiments from their lesson so your evidence
          and feedback stay together.
        </p>
        <Link
          className="inline-flex min-h-11 items-center text-primary underline"
          href="/lessons"
        >
          Open assigned lessons →
        </Link>
      </main>
    );
  return children;
}
