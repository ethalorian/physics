import type { BlockDocument, ContentBlock } from "@/data/content-blocks";
import { investigationFor } from "@/data/simulation-investigations";
import { PHYSICS_VIDEOS, videoBlock } from "./video-instruction";

export type InvestigationMode = "required" | "optional" | "demonstration";
export function investigationBlocks(
  slug: string,
  prefix: string,
  mode: InvestigationMode = "required",
): ContentBlock[] {
  const activity = investigationFor(slug);
  if (!activity) return [];
  const base = {
    targetId: activity.targetId,
    requiredForCompletion: mode === "required",
    xp: 5,
  };
  const blocks: ContentBlock[] = [
    {
      id: `${prefix}-target`,
      type: "target",
      targetId: activity.targetId,
      statement: activity.target,
    },
    {
      id: `${prefix}-purpose`,
      type: "prose",
      essential: true,
      markdown: `## ${activity.title}\n\n${activity.question}\n\n${mode === "optional" ? "Optional extension. " : mode === "demonstration" ? "Whole-class demonstration. " : ""}${activity.scope ?? ""}`,
      workshop: { stage: "Predict", pageBreakBefore: true },
    },
    {
      ...base,
      id: `${prefix}-predict`,
      type: "exit_ticket",
      capture: true,
      prompt: activity.predict,
      evidenceRole: "diagnostic",
      note: activity.teacherLookFors,
    },
    {
      id: `${prefix}-procedure`,
      type: "prose",
      essential: true,
      markdown: `## Run your investigation\n\n${activity.trials.map((trial, i) => `${i + 1}. ${trial}`).join("\n")}`,
      workshop: { stage: "Investigate & record", pageBreakBefore: true },
    },
    {
      id: `${prefix}-sim`,
      type: "sim_embed",
      simulationSlug: slug,
      targetId: activity.targetId,
    },
    {
      ...base,
      id: `${prefix}-evidence`,
      type: "lab_notebook",
      capture: true,
      requireAllFields: true,
      instruction:
        "Keep the simulation and your evidence together. Record the actual readings with units; use the drawing area for a labeled graph or diagram.",
      fields: activity.evidence,
      grid: true,
      evidenceRole: "main",
      note: activity.teacherLookFors,
    },
    {
      ...base,
      id: `${prefix}-explain`,
      type: "exit_ticket",
      capture: true,
      prompt: activity.explain,
      evidenceRole: "main",
      note: activity.teacherLookFors,
      workshop: { stage: "Explain the evidence", pageBreakBefore: true },
    },
    {
      ...base,
      id: `${prefix}-transfer`,
      type: "exit_ticket",
      capture: true,
      prompt: activity.transfer,
      evidenceRole: "exit",
      note: activity.teacherLookFors,
      workshop: { stage: "Try a new situation", pageBreakBefore: true },
    },
  ];
  return mode === "demonstration"
    ? blocks.map((block) =>
        ["exit_ticket", "lab_notebook"].includes(block.type)
          ? {
              id: block.id,
              type: "prose",
              essential: true,
              markdown:
                block.type === "exit_ticket"
                  ? `**Discuss:** ${block.prompt}`
                  : `**Record together:** ${activity.evidence.join("; ")}`,
              workshop: block.workshop,
            }
          : block,
      )
    : blocks;
}
export function investigationDocument(
  slug: string,
  mode: InvestigationMode = "required",
): BlockDocument | null {
  const activity = investigationFor(slug);
  if (!activity) return null;
  const video = PHYSICS_VIDEOS.find((v) => v.youtubeId === activity.videoId);
  return {
    schemaVersion: 1,
    dayType: "LAB",
    presentation: "physics-path",
    learningPath: {
      version: 1,
      kind: "investigation",
      focus: activity.question,
      targetSlugs: [activity.targetId],
    },
    blocks: [
      ...(video
        ? [
            {
              ...videoBlock(video),
              workshop: { stage: "Watch & understand", pageBreakBefore: true },
            },
          ]
        : []),
      ...investigationBlocks(slug, `investigate-${slug}`, mode),
    ],
  };
}
