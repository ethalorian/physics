"use client";
import { useState } from "react";
import Link from "next/link";
import { SIMULATION_INVESTIGATIONS } from "@/data/simulation-investigations";
import { investigationDocument } from "@/lib/simulation-investigation-authoring";
import { useRouter } from "next/navigation";
import SimulationClassAccess from "@/components/admin/SimulationClassAccess";

export default function InvestigationLibrary() {
  const router = useRouter(),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  async function create(slug: string) {
    const activity = SIMULATION_INVESTIGATIONS.find((a) => a.slug === slug)!;
    setBusy(slug);
    setError("");
    try {
      const response = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activity.title,
          unit_id: activity.unitId,
          lesson_number: 1,
          content_blocks: investigationDocument(slug),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Could not create the lesson.");
      router.push(`/admin/lessons/${data.lesson.id}/build`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the lesson.");
      setBusy("");
    }
  }
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold text-primary">
          TEACH · INVESTIGATE · REVIEW
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl">
          Give the experiment a purpose.
        </h1>
        <p className="text-muted-foreground">
          Start from a mastery target. Every activity includes a prediction,
          controlled trials, a saved evidence notebook, explanation, and
          transfer question. Create a lesson draft or add an activity inside an
          existing video lesson.
        </p>
        <p className="text-sm">
          Create draft → edit & student preview → publish & class access →
          review evidence. Student answers use the same mastery drawer and
          teacher ratings as other lesson work.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          Open your lesson workspace →
        </Link>
      </header>
      <SimulationClassAccess />
      {error && (
        <p
          role="alert"
          className="rounded border border-destructive p-4 text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {SIMULATION_INVESTIGATIONS.map((a, i) => (
          <article
            className="space-y-4 rounded-xl border bg-card p-6"
            key={a.slug}
          >
            <p className="font-mono text-xs text-primary">
              INVESTIGATION {String(i + 1).padStart(2, "0")} · ABOUT {a.minutes}{" "}
              MIN
            </p>
            <h2 className="font-serif text-2xl">{a.title}</h2>
            <p>{a.question}</p>
            <p className="border-l-2 border-primary pl-3 text-sm">{a.target}</p>
            {a.scope && (
              <p className="text-xs text-muted-foreground">{a.scope}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <button
                disabled={!!busy}
                className="min-h-11 rounded-lg bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
                onClick={() => create(a.slug)}
              >
                {busy === a.slug ? "Creating…" : "Create lesson draft"}
              </button>
              <Link
                className="inline-flex min-h-11 items-center text-sm text-primary underline"
                href={`/simulations/${a.slug}`}
                target="_blank"
              >
                Try the experiment ↗
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
