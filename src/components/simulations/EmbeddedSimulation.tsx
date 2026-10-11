"use client";
import { SIM_COMPONENTS } from "./registry";
import { SimEmbedContext, SimLessonContext } from "./embed-context";
import SimErrorBoundary from "./SimErrorBoundary";
export default function EmbeddedSimulation({
  slug,
  lessonId,
}: {
  slug: string;
  lessonId?: string;
}) {
  const Sim = SIM_COMPONENTS[slug];
  if (!Sim) return <p>That simulation is not available.</p>;
  return (
    <SimEmbedContext.Provider value={true}>
      <SimLessonContext.Provider value={lessonId}>
        <SimErrorBoundary slug={slug}>
          <Sim />
        </SimErrorBoundary>
      </SimLessonContext.Provider>
    </SimEmbedContext.Provider>
  );
}
