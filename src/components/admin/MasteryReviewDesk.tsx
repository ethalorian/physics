"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  summarizeEvidence,
  type EvidenceDecision,
} from "@/lib/evidence-rating";
import styles from "./MasteryReviewDesk.module.css";

export interface DeskWork {
  evidenceKey?: string;
  lessonId?: string | null;
  submissionId?: string | null;
  blockId: string;
  blockType: string | null;
  lessonTitle: string;
  prompt?: string | null;
  response: unknown;
  createdAt: string;
  targetLinked?: boolean;
  responseMode?: string | null;
  scaffoldsUsed?: string[];
  evidenceSource?: string | null;
}
interface Target {
  id: string;
  statement: string;
  domain: string;
}
interface Student {
  id: string;
  name: string;
  ratable?: boolean;
}
interface Review {
  id: string;
  lesson_id: string;
  evidence: (DeskWork & EvidenceDecision)[];
  message: string;
  overall_level: number;
  mean: number;
}
interface Draft {
  scores: Record<string, number | null>;
  reasons: Record<string, string>;
  note: string;
  requestId: string;
}
const emptyDraft = (): Draft => ({
  scores: {},
  reasons: {},
  note: "",
  requestId: crypto.randomUUID(),
});
const word = (n: number) => ["", "Not yet", "Almost", "Got it"][n];
const keyOf = (w: DeskWork) =>
  w.evidenceKey ?? `${w.lessonId}:${w.blockId}:${w.createdAt}`;
const activity = (w: DeskWork) =>
  w.blockType?.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) ??
  "Response";
export default function MasteryReviewDesk({
  studentId,
  targetId,
  unitId,
  students,
  targets,
  work,
  loading,
  loadError,
  onSelect,
  onClose,
  onSaved,
  pendingCount,
  renderResponse,
}: {
  studentId: string;
  targetId: string;
  unitId: string;
  students: Student[];
  targets: Target[];
  work: { work: DeskWork[] } | null;
  loading: boolean;
  loadError?: string | null;
  onSelect: (student: string, target: string) => void;
  onClose: () => void;
  onSaved: () => void;
  pendingCount: (id: string) => number;
  renderResponse: (w: DeskWork) => ReactNode;
}) {
  const roster = students.filter((s) => s.ratable !== false),
    student = roster.find((s) => s.id === studentId),
    target = targets.find((t) => t.id === targetId);
  const [lessonId, setLessonId] = useState(""),
    [index, setIndex] = useState(0),
    [draft, setDraft] = useState<Draft>(emptyDraft),
    [ready, setReady] = useState(false);
  const [confirm, setConfirm] = useState(false),
    [help, setHelp] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [history, setHistory] = useState<Review[]>([]);
  const saveLock = useRef(false),
    noteRef = useRef<HTMLTextAreaElement>(null),
    workRef = useRef<HTMLDivElement>(null);
  const lessons = Array.from(
    new Map(
      (work?.work ?? [])
        .filter((w) => w.lessonId)
        .map((w) => [w.lessonId!, w.lessonTitle]),
    ).entries(),
  );
  const selectedLesson = lessons.some(([id]) => id === lessonId)
    ? lessonId
    : (lessons[0]?.[0] ?? "");
  const evidence = (work?.work ?? []).filter(
      (w) => w.lessonId === selectedLesson,
    ),
    active = evidence[Math.min(index, Math.max(0, evidence.length - 1))];
  const storageKey = `mastery-desk:v1:${studentId}:${targetId}:${selectedLesson}`;
  const [draftKey, setDraftKey] = useState("");
  useEffect(() => {
    setIndex(0);
    setConfirm(false);
    setError(null);
    setReady(false);
    let value = emptyDraft();
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) value = { ...value, ...JSON.parse(saved) };
    } catch {}
    setDraft(value);
    setDraftKey(storageKey);
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    if (ready && draftKey === storageKey) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {}
    }
  }, [draft, ready, storageKey, draftKey]);
  useEffect(() => {
    let cancelled = false;
    setHistory([]);
    fetch(
      `/api/mastery/evidence-review?user_id=${encodeURIComponent(studentId)}&target_id=${encodeURIComponent(targetId)}`,
    )
      .then(async (r) => {
        if (!r.ok) throw Error("Could not load saved reviews.");
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setHistory(d.reviews ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, targetId, notice]);
  const saved = history.find(
    (r) =>
      r.lesson_id === selectedLesson &&
      r.evidence.length === evidence.length &&
      r.evidence.every((e) => evidence.some((w) => keyOf(w) === e.key)),
  );
  const decisions = evidence
    .filter((w) => Object.hasOwn(draft.scores, keyOf(w)))
    .map((w) => ({
      key: keyOf(w),
      level: draft.scores[keyOf(w)] as 1 | 2 | 3 | null,
      reason: draft.reasons[keyOf(w)],
    }));
  const summary = summarizeEvidence(saved ? saved.evidence : decisions),
    complete =
      !!evidence.length &&
      decisions.length === evidence.length &&
      decisions.every((d) => d.level !== null || !!d.reason?.trim()) &&
      summary.count > 0;
  const studentIndex = roster.findIndex((s) => s.id === studentId),
    next = roster[studentIndex + 1];
  const update = (patch: Partial<Draft>) => {
    if (saved || saving) return;
    setDraft((d) => {
      const value = { ...d, ...patch };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } catch {}
      return value;
    });
  };
  const navigate = (i: number) => {
    if (saving) return;
    setIndex(Math.max(0, Math.min(evidence.length - 1, i)));
    workRef.current?.scrollTo({ top: 0 });
  };
  const changeStudent = (i: number) => {
    if (!saving && roster[i]) {
      setLessonId("");
      setIndex(0);
      onSelect(roster[i].id, targetId);
    }
  };
  const rate = (level: 1 | 2 | 3, advance = false) => {
    if (!active || saving || saved) return;
    update({ scores: { ...draft.scores, [keyOf(active)]: level } });
    if (advance && index < evidence.length - 1) navigate(index + 1);
  };
  async function send() {
    if (saveLock.current || !complete || saved) return;
    saveLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/mastery/evidence-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentId,
          unitId,
          targetId,
          lessonId: selectedLesson,
          requestId: draft.requestId,
          decisions,
          message: draft.note,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error ?? "Review was not saved.");
      setConfirm(false);
      setNotice(`Review sent · overall ${data.level} / 3`);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }
  async function feedbackOnly() {
    if (saving || !draft.note.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: studentId,
          target_id: targetId,
          message: draft.note,
        }),
      });
      if (!r.ok) throw Error("Feedback could not be sent.");
      update({ note: "" });
      setNotice("Feedback sent without a mastery rating.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || saving || loading || e.altKey) return;
      const typing = !!(e.target as HTMLElement).closest(
        'input,textarea,select,[contenteditable="true"]',
      );
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (confirm) void send();
        else if (complete && !saved) setConfirm(true);
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (help) setHelp(false);
        else if (confirm) setConfirm(false);
        else if (typing) (e.target as HTMLElement).blur();
        else onClose();
        return;
      }
      if (typing) return;
      if (e.key === "?") {
        e.preventDefault();
        setHelp((v) => !v);
        return;
      }
      if (confirm || help) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const delta = e.key === "ArrowRight" ? 1 : -1;
        if (e.shiftKey) changeStudent(studentIndex + delta);
        else navigate(index + delta);
        return;
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        noteRef.current?.focus();
        return;
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (complete && !saved) setConfirm(true);
        return;
      }
      if (
        [
          "Digit1",
          "Digit2",
          "Digit3",
          "Numpad1",
          "Numpad2",
          "Numpad3",
        ].includes(e.code)
      ) {
        e.preventDefault();
        rate(Number(e.code.slice(-1)) as 1 | 2 | 3, e.shiftKey);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const selected = active
    ? (saved?.evidence.find((e) => e.key === keyOf(active))?.level ??
      draft.scores[keyOf(active)])
    : undefined;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.scrim} />
        <Dialog.Content
          className={styles.desk}
          aria-describedby="mastery-desk-description"
          onEscapeKeyDown={(e) => e.preventDefault()}
        >

          <div className={styles.layout}>
            <aside className={styles.queue} aria-label="Student queue">
              <h3>✦ Student queue</h3>
              <p>
                {roster.filter((s) => pendingCount(s.id) > 0).length} students
                with work to review
              </p>
              {roster.map((s, i) => (
                <button
                  key={s.id}
                  disabled={saving}
                  aria-current={s.id === studentId ? "true" : undefined}
                  onClick={() => changeStudent(i)}
                >
                  <span>
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{s.name}</strong>
                    <small>
                      {s.id === studentId
                        ? "Reviewing now"
                        : pendingCount(s.id)
                          ? `${pendingCount(s.id)} pending`
                          : "No pending work · revisit"}
                    </small>
                  </div>
                </button>
              ))}
            </aside>
            <main className={styles.main}>
              <div className={styles.work} ref={workRef}>
                <div className={styles.context}>
                  <label>
                    Learning target
                    <select
                      disabled={saving}
                      value={targetId}
                      onChange={(e) => onSelect(studentId, e.target.value)}
                    >
                      {targets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.statement}
                        </option>
                      ))}
                    </select>
                  </label>
                  {lessons.length > 1 && (
                    <label>
                      Lesson
                      <select
                        disabled={saving}
                        value={selectedLesson}
                        onChange={(e) => {
                          setLessonId(e.target.value);
                          setIndex(0);
                        }}
                      >
                        {lessons.map(([id, title]) => (
                          <option key={id} value={id}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                {(loading || !ready) && (
                  <p role="status">Loading student work…</p>
                )}
                {loadError && <p role="alert">{loadError}</p>}
                {!loading && !active && (
                  <p>
                    No submitted evidence is available for this target. Choose
                    another target or student.
                  </p>
                )}
                {!loading && active && (
                  <article className={styles.paper}>
                    <section className={styles.question}>
                      <p className={styles.overline}>
                        {index + 1} OF {evidence.length} · {activity(active)} ·{" "}
                        {active.lessonTitle}
                      </p>
                      <h3>
                        {active.prompt ??
                          "Original prompt unavailable. Check the lesson before rating."}
                      </h3>
                      {!active.targetLinked && (
                        <p className={styles.caution}>
                          Target connection is unconfirmed. Check relevance or
                          exclude this response.
                        </p>
                      )}
                    </section>
                    <section
                      className={styles.ratingPanel}
                      aria-label="Rate this evidence"
                    >
                      <div className={styles.ratingHeading}>
                        <h3>Rate this evidence</h3>
                        <span>
                          {saved
                            ? "Saved rating"
                            : selected === null
                              ? "Excluded"
                              : selected
                                ? `Selected: ${selected} · ${word(selected)}`
                                : "Choose 1, 2, or 3"}
                        </span>
                      </div>
                      <div className={styles.target}>
                        <span>DOMAIN</span>
                        <strong>
                          {target?.domain?.replace(/_/g, " ") ??
                            "Not specified"}
                        </strong>
                        <span>FULL LEARNING TARGET</span>
                        <p>{target?.statement}</p>
                      </div>
                      <div className={styles.ratings}>
                        {([1, 2, 3] as const).map((n) => (
                          <button
                            key={n}
                            data-level={n}
                            aria-pressed={selected === n}
                            aria-label={`${n} · ${word(n)}`}
                            disabled={saving || !!saved}
                            onClick={() => rate(n)}
                          >
                            <b>{n}</b>
                            <span>
                              {word(n)}
                              <small>
                                {
                                  [
                                    "",
                                    "Conceptual support needed",
                                    "Understanding with a specific gap",
                                    "Demonstrates the target",
                                  ][n]
                                }
                              </small>
                            </span>
                            {selected === n && (
                              <span aria-hidden="true">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className={styles.hint}>
                        1 / 2 / 3 rate · Shift + 1 / 2 / 3 rate &amp; advance
                      </p>
                      {!saved && (
                        <details>
                          <summary>Not enough evidence / not relevant?</summary>
                          <label className={styles.exclude}>
                            <input
                              type="checkbox"
                              checked={selected === null}
                              disabled={saving}
                              onChange={(e) => {
                                const scores = { ...draft.scores };
                                if (e.target.checked)
                                  scores[keyOf(active)] = null;
                                else delete scores[keyOf(active)];
                                update({ scores });
                              }}
                            />{" "}
                            Exclude this response from the average
                          </label>
                          {selected === null && (
                            <input
                              aria-label="Reason for excluding evidence"
                              maxLength={300}
                              value={draft.reasons[keyOf(active)] ?? ""}
                              onChange={(e) =>
                                update({
                                  reasons: {
                                    ...draft.reasons,
                                    [keyOf(active)]: e.target.value,
                                  },
                                })
                              }
                              placeholder="Why can’t this response be rated?"
                            />
                          )}
                        </details>
                      )}
                    </section>
                    <section className={styles.answer}>
                      <p className={styles.overline}>STUDENT RESPONSE</p>
                      {renderResponse(active)}
                    </section>
                  </article>
                )}
                {active && (
                  <details className={styles.support}>
                    <summary>Response context &amp; supports</summary>
                    <p>
                      Submitted {new Date(active.createdAt).toLocaleString()} ·{" "}
                      {active.evidenceSource ?? "Source not recorded"}
                    </p>
                    <p>
                      {active.responseMode ?? "Response mode not recorded"} ·{" "}
                      {(active.scaffoldsUsed ?? []).join(", ") ||
                        "No supports recorded"}
                    </p>
                    <p>
                      Language supports are not a penalty. Group work does not
                      alone establish individual independence.
                    </p>
                  </details>
                )}
              </div>
              <footer className={styles.evidenceNav}>
                <button
                  aria-label="Previous evidence"
                  disabled={saving || index <= 0}
                  onClick={() => navigate(index - 1)}
                >
                  ← Previous evidence
                </button>
                <span>← → evidence · Shift + ← → students</span>
                <button
                  aria-label="Next evidence"
                  disabled={saving || index >= evidence.length - 1}
                  onClick={() => navigate(index + 1)}
                >
                  Next evidence →
                </button>
              </footer>
            </main>
            <aside className={styles.side}>
              <h3>
                Lesson evidence{" "}
                <small>
                  {saved ? evidence.length : decisions.length} of{" "}
                  {evidence.length} reviewed
                </small>
              </h3>
              <div className={styles.evidenceList}>
                {evidence.map((w, i) => (
                  <button
                    key={keyOf(w)}
                    disabled={saving}
                    aria-current={active === w ? "step" : undefined}
                    onClick={() => navigate(i)}
                  >
                    <span>{i + 1}</span>
                    <div>
                      <strong>{activity(w)}</strong>
                      <small>{w.prompt ?? w.lessonTitle}</small>
                    </div>
                    <b>
                      {saved?.evidence.find((e) => e.key === keyOf(w))?.level ??
                        draft.scores[keyOf(w)] ??
                        (Object.hasOwn(draft.scores, keyOf(w)) ? "—" : "")}
                    </b>
                  </button>
                ))}
              </div>
              <section className={styles.summary}>
                <div>
                  <span>{saved ? "Submitted overall" : "Overall draft"}</span>
                  <strong>
                    {summary.mean === null ? "—" : summary.mean.toFixed(2)}
                    <small> / 3</small>
                  </strong>
                </div>
                <p>
                  Equal-weight average
                  {summary.level
                    ? ` → level ${summary.level} · ${word(summary.level)}`
                    : ""}
                  . Excluded responses do not count. You review before sending.
                </p>
              </section>
              <label className={styles.noteLabel} htmlFor="mastery-desk-note">
                Written feedback <kbd>F</kbd>
              </label>
              <textarea
                aria-label="Written feedback"
                id="mastery-desk-note"
                ref={noteRef}
                disabled={saving || !!saved}
                rows={7}
                maxLength={1600}
                value={saved ? saved.message : draft.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="What went well? What should they try next?"
              />
              {saved ? (
                <p role="status">
                  ✓ Review sent. Scores and feedback are saved with this
                  evidence.
                </p>
              ) : (
                <>
                  <p className={styles.hint}>
                    {complete
                      ? "Ready for your final review."
                      : "Rate each response or explain why it is excluded."}
                  </p>
                  <button
                    className={styles.primary}
                    disabled={!complete || saving || loading}
                    onClick={() => setConfirm(true)}
                  >
                    Review &amp; send → <kbd>R</kbd>
                  </button>
                  <button
                    className={styles.textButton}
                    disabled={saving || !draft.note.trim()}
                    onClick={() => void feedbackOnly()}
                  >
                    Send feedback only · leave unrated
                  </button>
                </>
              )}
              {notice && <p role="status">{notice}</p>}
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
            </aside>
          </div>
          <footer className={styles.studentBar} aria-label="Active student">
            <div>
              <p>THE REVIEW DESK · LESSON MASTERY</p>
              <Dialog.Title>{student?.name ?? "Student"}</Dialog.Title>
              <p id="mastery-desk-description">
                Student {studentIndex + 1} of {roster.length} · Drafts stay with
                each student
              </p>
            </div>
            <div className={styles.studentNav}>
              <button
                aria-label="Previous student"
                disabled={saving || studentIndex === 0}
                onClick={() => changeStudent(studentIndex - 1)}
              >
                ← Previous student<small>Shift + ←</small>
              </button>
              <button
                aria-label="Next student"
                disabled={saving || !next}
                onClick={() => changeStudent(studentIndex + 1)}
              >
                Next student →
                <small>{next?.name ?? "End of queue"} · Shift + →</small>
              </button>
              <button
                onClick={() => setHelp(true)}
                aria-label="Keyboard shortcuts"
              >
                ⌨ ?
              </button>
              <button
                aria-label="Close lesson mastery review"
                disabled={saving}
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </footer>
          <Dialog.Root
            open={confirm}
            onOpenChange={(open) => {
              if (!saving) setConfirm(open);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className={styles.modalScrim} />
              <Dialog.Content
                className={styles.modal}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <Dialog.Title>Review before sending</Dialog.Title>
                <Dialog.Description>
                  {student?.name} · {target?.domain}
                </Dialog.Description>
                <p>{target?.statement}</p>
                <h3>
                  Overall: {summary.level} ·{" "}
                  {summary.level ? word(summary.level) : ""}
                </h3>
                <p>
                  {decisions
                    .filter((d) => d.level !== null)
                    .map((d) => d.level)
                    .join(" + ")}{" "}
                  ÷ {summary.count} = {summary.mean?.toFixed(2)}. Rounded to the
                  nearest level.
                </p>
                <p className={styles.finalNote}>
                  {draft.note ||
                    "The calculated overall rating will be sent without an additional note."}
                </p>
                {error && <p role="alert">{error}</p>}
                <button
                  className={styles.primary}
                  disabled={saving || !complete}
                  onClick={() => void send()}
                >
                  {saving ? "Sending…" : "Send overall rating & feedback"}
                </button>
                <p className={styles.hint}>⌘ / Ctrl + Enter to send</p>
                <button disabled={saving} onClick={() => setConfirm(false)}>
                  Back to evidence
                </button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={help} onOpenChange={setHelp}>
            <Dialog.Portal>
              <Dialog.Overlay className={styles.modalScrim} />
              <Dialog.Content
                className={styles.modal}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <Dialog.Title>Review shortcuts</Dialog.Title>
                <Dialog.Description>
                  Letter and number shortcuts pause while you type.
                </Dialog.Description>
                <dl>
                  {[
                    ["1 / 2 / 3", "Rate this evidence"],
                    ["Shift + 1 / 2 / 3", "Rate and advance"],
                    ["← / →", "Previous / next evidence"],
                    ["Shift + ← / →", "Previous / next student"],
                    ["F", "Write feedback"],
                    ["R", "Review overall"],
                    [
                      "⌘ / Ctrl + Enter",
                      "Open final review; press again to send",
                    ],
                    ["Esc", "Leave field / go back"],
                    ["?", "Shortcuts"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <dt>
                        <kbd>{key}</kbd>
                      </dt>
                      <dd>{label}</dd>
                    </div>
                  ))}
                </dl>
                <button onClick={() => setHelp(false)}>Back to review</button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
