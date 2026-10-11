"use client";
import { useState } from "react";
import Link from "next/link";
import { SIMULATION_INVESTIGATIONS } from "@/data/simulation-investigations";
import {
  investigationBlocks,
  type InvestigationMode,
} from "@/lib/simulation-investigation-authoring";
import type { ContentBlock } from "@/data/content-blocks";

export default function GuidedActivityPicker({
  onAdd,
  unitId,
}: {
  onAdd: (blocks: ContentBlock[]) => void;
  unitId?: string | null;
}) {
  const [slug, setSlug] = useState(SIMULATION_INVESTIGATIONS[0].slug);
  const [mode, setMode] = useState<InvestigationMode>("required");
  const [added, setAdded] = useState(false);
  const choices = SIMULATION_INVESTIGATIONS.filter(
    (item) => item.unitId === unitId,
  );
  const activity = choices.find((item) => item.slug === slug) ?? choices[0];
  if (!activity) return null;
  return (
    <section
      className="my-5 space-y-3 rounded-xl border bg-card p-5"
      aria-label="Add guided investigation"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-semibold">Add a guided investigation</h3>
        <Link
          href="/admin/simulations/activities"
          className="text-sm text-primary underline"
        >
          Browse activities & class access
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Add a prediction, focused trials, an evidence notebook, and reasoning
        questions. Answers feed the existing mastery review and XP system.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Activity
          <select
            aria-label="Guided activity"
            value={activity.slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAdded(false);
            }}
            className="mt-1 min-h-11 w-full rounded border bg-background px-3"
          >
            {choices.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          How students use it
          <select
            aria-label="Activity participation"
            value={mode}
            onChange={(e) => setMode(e.target.value as InvestigationMode)}
            className="mt-1 min-h-11 w-full rounded border bg-background px-3"
          >
            <option value="required">Required lesson work</option>
            <option value="optional">Optional extension</option>
            <option value="demonstration">Whole-class demonstration</option>
          </select>
        </label>
      </div>
      <p className="text-sm">
        <strong>Mastery target:</strong> {activity.target}
      </p>
      {activity.scope && (
        <p className="text-sm text-muted-foreground">{activity.scope}</p>
      )}
      <button
        type="button"
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
        onClick={() => {
          onAdd(investigationBlocks(activity.slug, crypto.randomUUID(), mode));
          setAdded(true);
        }}
      >
        Add activity to lesson
      </button>
      {added && (
        <p role="status" className="text-sm">
          Added at the end of the lesson. Edit or reorder it, then save and
          preview before setting class access.
        </p>
      )}
    </section>
  );
}
