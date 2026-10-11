"use client";
import { useEffect, useState } from "react";
type Course = {
  id: string;
  name: string;
  section?: string;
  simulation_exploration_enabled: boolean;
};
export default function SimulationClassAccess() {
  const [courses, setCourses] = useState<Course[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/simulations/access", { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Class settings could not be loaded.");
        const d = await r.json();
        setCourses(d.courses ?? []);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);
  async function change(c: Course, enabled: boolean) {
    setBusy(c.id);
    setError("");
    try {
      const r = await fetch("/api/simulations/access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: c.id, enabled }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setCourses((cs) =>
        cs.map((row) =>
          row.id === c.id
            ? { ...row, simulation_exploration_enabled: enabled }
            : row,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Optional exploration by class</h2>
      <p className="text-sm text-muted-foreground">
        Assigned simulations open inside their lessons. Separately, choose
        whether a class can browse the wider simulation library. Students in
        several active classes can explore when any of their classes permits it.
      </p>
      {loading ? (
        <p role="status">Loading class settings…</p>
      ) : courses.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((c) => (
            <label
              key={c.id}
              className="flex items-center justify-between gap-3 rounded border p-3 text-sm"
            >
              <span>
                {c.name}
                {c.section ? " · " + c.section : ""}
              </span>
              <select
                aria-label={"Optional exploration for " + c.name}
                value={String(c.simulation_exploration_enabled)}
                disabled={!!busy}
                onChange={(e) => change(c, e.target.value === "true")}
                className="min-h-11 rounded border bg-background px-2"
              >
                <option value="false">Assigned lessons only</option>
                <option value="true">Allow optional exploration</option>
              </select>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm">No active classes are available to manage.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
