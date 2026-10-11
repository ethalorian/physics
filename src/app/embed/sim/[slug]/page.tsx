import { auth } from "@/lib/auth";
import { getEffectiveContext } from "@/lib/effective-context";
import { authorizeLesson } from "@/lib/lesson-access";
import { canExploreSimulations } from "@/lib/simulation-access";
import EmbeddedSimulation from "@/components/simulations/EmbeddedSimulation";
export default async function SimEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string; block?: string }>;
}) {
  const [{ slug }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  if (!session?.user?.id || !session.user.email)
    return <p className="p-5">Sign in to open this experiment.</p>;
  const ctx = await getEffectiveContext(session.user.email);
  let lessonId: string | undefined;
  if (ctx.role === "student") {
    let assigned = false;
    if (
      query.lesson &&
      /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(query.lesson) &&
      query.block
    ) {
      const access = await authorizeLesson(
        {
          userId: session.user.id,
          email: session.user.email,
          realRole: "student",
        },
        query.lesson,
      );
      assigned =
        access.ok &&
        Boolean(
          access.document?.blocks.some(
            (b) =>
              b.id === query.block &&
              b.type === "sim_embed" &&
              b.simulationSlug === slug,
          ),
        );
      if (assigned) lessonId = query.lesson;
    }
    if (!assigned && !(await canExploreSimulations(session.user.id, ctx.role)))
      return (
        <p className="p-5">
          Open this experiment from an available lesson. Optional exploration is
          not enabled for your class.
        </p>
      );
  } else if (!["admin", "teacher", "observer"].includes(ctx.role))
    return <p>Experiment access is unavailable.</p>;
  return <EmbeddedSimulation slug={slug} lessonId={lessonId} />;
}
