"use client";

/**
 * TeacherMasteryEntry — the way mastery actually gets into the system.
 *
 * Pick a student, see this unit's targets with the student's current value and
 * trend, and tap Not yet / Almost / Got it (1 / 2 / 3). Each tap POSTs an
 * APPEND-ONLY observation to /api/mastery/records, so the growth lines fill in
 * over time. Mastery is teacher-assessed — this is the only place records are born.
 *
 * Presentational about the roster: pass `students` in. Fetch targets from
 * GET /api/mastery/dashboard and the roster from your existing course endpoint.
 */
import { useState } from "react";
import {
  LearningTarget,
  MasteryRecord,
  MarzanoLevel,
  targetValue,
  DEFAULT_RECENCY_WEIGHT,
} from "@/data/curriculum-types";
import {
  DOMAIN_LABEL,
  PALETTE,
  levelWord,
  levelColor,
  buildRecordsByTarget,
} from "./mastery-display";

export interface RosterStudent {
  id: string;
  name: string;
  email?: string;
}

export interface TeacherMasteryEntryProps {
  unitName?: string;
  targets: LearningTarget[];
  students: RosterStudent[];
  /** Optional existing records (any students) so current values show immediately. */
  initialRecords?: MasteryRecord[];
  recencyWeight?: number;
}

const LEVELS: { value: MarzanoLevel; label: string }[] = [
  { value: 1, label: "Not yet" },
  { value: 2, label: "Almost" },
  { value: 3, label: "Got it" },
];

const EVIDENCE_OPTIONS = ["observation", "exit ticket", "lab", "conversation", "quiz"];

export default function TeacherMasteryEntry({
  unitName,
  targets,
  students,
  initialRecords = [],
  recencyWeight = DEFAULT_RECENCY_WEIGHT,
}: TeacherMasteryEntryProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [records, setRecords] = useState<MasteryRecord[]>(initialRecords);
  const [evidence, setEvidence] = useState("observation");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [flashTarget, setFlashTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const student = students.find((s) => s.id === studentId);
  const shown = targets.filter((t) => !t.excludeFromGrowth);
  const studentRecords = records.filter((r) => r.studentId === studentId);
  const byTarget = buildRecordsByTarget(studentRecords);

  async function record(target: LearningTarget, level: MarzanoLevel) {
    if (!studentId) {
      setError("Pick a student first.");
      return;
    }
    const key = `${target.id}:${level}`;
    setSavingKey(key);
    setError(null);
    try {
      const res = await fetch("/api/mastery/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: studentId,
          user_email: student?.email ?? null,
          target_id: target.id,
          level,
          evidence_source: evidence,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Save failed (${res.status})`);
      }
      const saved = await res.json();
      setRecords((prev) => [
        ...prev,
        {
          studentId,
          targetId: target.id,
          level,
          observedAt: saved.observed_at ?? new Date().toISOString(),
          evidenceSource: evidence,
        },
      ]);
      setFlashTarget(target.id);
      setTimeout(() => setFlashTarget((f) => (f === target.id ? null : f)), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div style={{ background: "#FAF9FC", color: PALETTE.indigo }} className="rounded-xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-xl font-medium" style={{ color: PALETTE.indigo }}>
          Record mastery
        </h2>
        {unitName && (
          <span className="text-sm" style={{ color: PALETTE.indigoMuted }}>
            {unitName}
          </span>
        )}
      </div>
      <p className="text-sm mb-4" style={{ color: PALETTE.indigoMuted }}>
        Each tap adds a new observation — it never overwrites. The number is a recent-weighted average.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          Student
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="ml-2 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: "#fff" }}
          >
            {students.length === 0 && <option value="">No students</option>}
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          Evidence
          <select
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="ml-2 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: "#fff" }}
          >
            {EVIDENCE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: "#FBEFEF", color: "#8A4A4A" }}>
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white px-4" style={{ borderColor: PALETTE.hairline }}>
        {shown.map((t, i) => {
          const recs = byTarget.get(t.id);
          const value = recs ? targetValue(recs, recencyWeight) : null;
          const tag = t.domain.charAt(0).toUpperCase();
          return (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-3 py-3"
              style={{ borderTop: i === 0 ? "none" : "0.5px solid #EEEBF5" }}
            >
              <span
                className="text-[11px] font-medium rounded px-2 py-0.5"
                style={{ background: "#EEEBF6", color: "#4A4470" }}
                title={DOMAIN_LABEL[t.domain]}
              >
                {tag}
              </span>
              <span className="flex-1 min-w-[12rem] text-[13px] leading-snug">{t.statement}</span>

              <span className="text-[13px] font-medium tabular-nums" style={{ color: value === null ? PALETTE.indigoMuted : levelColor(value), minWidth: 70, textAlign: "right" }}>
                {value === null ? "—" : `${value.toFixed(1)} ${levelWord(value)}`}
              </span>

              <span className="inline-flex gap-1.5">
                {LEVELS.map((lv) => {
                  const key = `${t.id}:${lv.value}`;
                  const saving = savingKey === key;
                  return (
                    <button
                      key={lv.value}
                      onClick={() => record(t, lv.value)}
                      disabled={saving || !studentId}
                      className="text-xs rounded-md border px-2.5 py-1 transition-colors disabled:opacity-50"
                      style={{ borderColor: PALETTE.hairline, color: PALETTE.indigo, background: "#fff" }}
                      title={`Record "${lv.label}" (${lv.value})`}
                    >
                      {saving ? "…" : lv.label}
                    </button>
                  );
                })}
              </span>

              <span style={{ width: 18, color: PALETTE.sage }} aria-hidden>
                {flashTarget === t.id ? "✓" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
