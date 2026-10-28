"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { summarizeEvidence, type EvidenceDecision } from "@/lib/evidence-rating";
import { orderReviewQueue, reviewItemKey, type MasteryReviewItem } from "@/lib/mastery-review-queue";
import SubmissionSuggestions from '@/components/admin/results/SubmissionSuggestions';
import { ReviewRatings, ReviewFeedback, ReviewQueueRail, ReviewStudentBar } from "@/components/review/ReviewDeskControls";
import styles from "./MasteryReviewDesk.module.css";

export interface DeskWork {
  evidenceKey?: string; lessonId?: string | null; submissionId?: string | null;
  blockId: string; blockType: string | null; lessonTitle: string; prompt?: string | null; teacherGuidance?: string;
  response: unknown; createdAt: string; targetLinked?: boolean; responseMode?: string | null;
  scaffoldsUsed?: string[]; evidenceSource?: string | null;
}
interface Target { id: string; statement: string; domain: string }
interface Student { id: string; name: string; ratable?: boolean }
interface Review {
  id: string; lesson_id: string; evidence: (DeskWork & Partial<EvidenceDecision> & { key: string })[];
  message: string; note?: string; overall_level: number; mean: number | null;
  rating_mode?: "target" | "evidence"; created_at?: string;
}
interface Draft {
  mode: "target" | "evidence"; level: 1 | 2 | 3 | null;
  scores: Record<string, number | null>; reasons: Record<string, string>; note: string; requestId: string; attempted?: boolean; requestRevision?: boolean; ratingCommitted?: boolean;
}
const emptyDraft = (): Draft => ({ mode: "target", level: null, scores: {}, reasons: {}, note: "", requestId: crypto.randomUUID() });
const word = (n: number) => ["", "Not yet", "Almost", "Got it"][n];
const keyOf = (w: DeskWork) => w.evidenceKey ?? `${w.lessonId}:${w.blockId}:${w.createdAt}`;
const activity = (w: DeskWork) => w.blockType === "warmup" ? "Warm-up" : w.blockType === "exit_ticket" ? "Exit ticket" : w.blockType?.replace(/_/g, " ") ?? "Response";
type Context = { lessonId?: string; submissionId?: string | null };
interface Props {
  studentId: string; targetId: string; unitId: string; initialLessonId?: string; submissionId?: string | null;
  students: Student[]; targets: Target[];
  work: { work: DeskWork[]; records?: { target_id: string; level: number; observed_at: string }[];
    submissions?: { id: string; reviewed?: boolean; locked?: boolean }[] } | null;
  loading: boolean; loadError?: string | null; currentMastery?: number | null;
  reviewQueue: MasteryReviewItem[];
  onSelect: (student: string, target: string, context?: Context) => void;
  onClose: () => void; onSaved: (item: MasteryReviewItem) => void; onSkip: (item: MasteryReviewItem) => void; onReturned: () => void;
  renderResponse: (work: DeskWork) => ReactNode;
}

export default function MasteryReviewDesk(props: Props) {
  const { loading, loadError, work, onClose } = props;
  const [savedCount, setSavedCount] = useState(0);
  const [nextGate, setNextGate] = useState<MasteryReviewItem | null>(null);
  const advanceTo = (item: MasteryReviewItem) => {
    if (item.studentId === props.studentId) props.onSelect(item.studentId, item.targetId, item);
    else setNextGate(item);
  };
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className={styles.scrim} />
      <Dialog.Content className={styles.desk}
        onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
        {loading || !work ? <div className={styles.loading}>
          <Dialog.Title>{props.students.find(s => s.id === props.studentId)?.name ?? "Mastery review"}</Dialog.Title>
          <Dialog.Description>Review evidence and record mastery.</Dialog.Description>
          {loadError ? <><p role="alert">{loadError}</p><button onClick={() => props.onSelect(props.studentId, props.targetId, { lessonId: props.initialLessonId, submissionId: props.submissionId })}>Retry student work</button></> : <p role="status">Loading student work…</p>}
          <button onClick={onClose}>Close review</button>
        </div> : <ReviewForm key={JSON.stringify([props.studentId, props.targetId, props.initialLessonId, props.submissionId])} {...props} work={work} savedCount={savedCount} paused={!!nextGate} onComplete={() => setSavedCount(n => n + 1)} onAdvance={advanceTo} />}
        <Dialog.Root open={!!nextGate} onOpenChange={open => { if (!open) setNextGate(null); }}><Dialog.Portal>
          <Dialog.Overlay className={styles.modalScrim} /><Dialog.Content className={styles.modal} onEscapeKeyDown={e => { e.preventDefault(); onClose(); }}>
            <div className={styles.savedSeal} aria-hidden="true">✓</div>
            <p>{savedCount} reviews saved this session</p><Dialog.Title>Next: {props.students.find(s => s.id === nextGate?.studentId)?.name ?? "Next student"}</Dialog.Title>
            <Dialog.Description>Take a moment before reviewing the next student’s work.</Dialog.Description>
            <button className={styles.primary} onClick={() => { const item = nextGate; setNextGate(null); if (item) props.onSelect(item.studentId, item.targetId, item); }}>Continue →</button>
            <button onClick={onClose}>Close review</button>
          </Dialog.Content>
        </Dialog.Portal></Dialog.Root>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function ReviewForm({ studentId, targetId, unitId, initialLessonId, submissionId, students, targets, work,
  currentMastery, reviewQueue, onSelect, onClose, onSaved, onSkip, onReturned, renderResponse, savedCount, paused, onComplete, onAdvance }: Props & { work: NonNullable<Props["work"]>; savedCount: number; paused: boolean; onComplete: () => void; onAdvance: (item: MasteryReviewItem) => void }) {
  const student = students.find(s => s.id === studentId), target = targets.find(t => t.id === targetId);
  const lessons = [...new Map(work.work.filter(w => w.lessonId).map(w => [w.lessonId!, w.lessonTitle])).entries()];
  const lessonId = initialLessonId ?? lessons[0]?.[0] ?? "";
  const evidence = work.work.filter(w => w.lessonId === lessonId);
  const [index, setIndex] = useState(0), [draft, setDraft] = useState<Draft>(emptyDraft);
  const [ready, setReady] = useState(false), [history, setHistory] = useState<Review[]>([]);
  const [historyReady, setHistoryReady] = useState(false), [historyError, setHistoryError] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [saving, setSaving] = useState(false), [error, setError] = useState("");
  const [notice, setNotice] = useState(""), [reassessing, setReassessing] = useState(false);
  const [help, setHelp] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [returned, setReturned] = useState(false);
  const lock = useRef(false), noteRef = useRef<HTMLTextAreaElement>(null), answerRef = useRef<HTMLDivElement>(null);
  const actualSubmission = submissionId ?? evidence[0]?.submissionId ?? null;
  const current: MasteryReviewItem = { studentId, targetId, lessonId, submissionId: actualSubmission };
  const storageKey = `mastery-desk:v2:${unitId}:${reviewItemKey(current)}`;
  const active = evidence[Math.min(index, Math.max(0, evidence.length - 1))];
  const saved = !reassessing && !draft.attempted ? history.find(r => r.lesson_id === lessonId && r.evidence.length === evidence.length &&
    r.evidence.every(e => evidence.some(w => keyOf(w) === e.key))) : undefined;
  const decisions: EvidenceDecision[] = evidence.filter(w => Object.hasOwn(draft.scores, keyOf(w))).map(w => ({
    key: keyOf(w), level: draft.scores[keyOf(w)] as 1 | 2 | 3 | null, reason: draft.reasons[keyOf(w)] }));
  const summary = summarizeEvidence(decisions);
  const complete = !!evidence.length && historyReady && ready && (draft.mode === "target" ? draft.level !== null :
    decisions.length === evidence.length && decisions.every(d => d.level !== null || !!d.reason?.trim()) && summary.count > 0);
  const next = orderReviewQueue(reviewQueue.filter(item => students.find(s => s.id === item.studentId)?.ratable !== false), current).find(item => reviewItemKey(item) !== reviewItemKey(current));
  const displayedMode = saved?.rating_mode ?? draft.mode;
  const selected = saved ? displayedMode === "target" ? saved.overall_level : saved.evidence.find(e => active && e.key === keyOf(active))?.level :
    draft.mode === "target" ? draft.level : active ? draft.scores[keyOf(active)] : undefined;
  const proposed = saved?.overall_level ?? (draft.mode === "target" ? draft.level : summary.level);
  const submissionState = work.submissions?.find(s => s.id === actualSubmission);
  const isReturned = returned || submissionState?.reviewed === true || submissionState?.locked === false;

  const roster = students.filter(s => s.ratable !== false);
  const studentIndex = roster.findIndex(s => s.id === studentId);
  const counts = Object.fromEntries(roster.map(s => [s.id, reviewQueue.filter(item => item.studentId === s.id).length]));
  const pendingStudents = roster.filter(s => counts[s.id]).length;
  const canReturn = !!actualSubmission && !isReturned;
  const revisionOnly = draft.requestRevision && draft.level === null && Object.keys(draft.scores).length === 0;
  const canSave = historyReady && ready && !saved && (complete || revisionOnly) && (!draft.requestRevision || (!!actualSubmission && !!draft.note.trim()));
  const frozen = saving || !!saved || !!draft.attempted || !historyReady || !ready;
  function selectStudent(id: string) {
    if (lock.current || paused || !roster.some(s => s.id === id)) return;
    const item = reviewQueue.find(item => item.studentId === id);
    if (item) onSelect(id, item.targetId, item);
    else onSelect(id, targetId, { lessonId });
  }

  useEffect(() => {
    let value = emptyDraft();
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) value = { ...value, ...JSON.parse(stored) };
      else {
        // Preserve unfinished reviews created before the faster workflow was installed.
        const legacy = sessionStorage.getItem(`mastery-desk:v1:${studentId}:${targetId}:${lessonId}`);
        if (legacy) value = { ...value, ...JSON.parse(legacy), mode: "evidence" };
      }
    } catch {}
    setDraft(value); setReady(true);
  }, [storageKey, studentId, targetId, lessonId]);
  useEffect(() => {
    let cancelled = false;
    setHistoryReady(false); setHistoryError("");
    fetch(`/api/mastery/evidence-review?user_id=${encodeURIComponent(studentId)}&target_id=${encodeURIComponent(targetId)}`)
      .then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.error ?? "Could not load saved reviews."); return data; })
      .then(data => { if (!cancelled) { setHistory(data.reviews ?? []); setHistoryReady(true); } })
      .catch(e => { if (!cancelled) setHistoryError(e.message); });
    return () => { cancelled = true; };
  }, [studentId, targetId, historyVersion]);
  function update(patch: Partial<Draft>) {
    if (saved || lock.current || draft.attempted) return;
    setDraft(previous => {
      const value = { ...previous, ...patch };
      try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
      return value;
    });
    setError(""); setNotice("");
  }
  function navigate(i: number) {
    if (lock.current) return;
    setIndex(Math.max(0, Math.min(evidence.length - 1, i))); answerRef.current?.scrollTo({ top: 0 });
  }
  function rate(level: 1 | 2 | 3, advance = false) {
    if (!ready || !historyReady || !active || saved || lock.current || draft.attempted) return;
    if (draft.mode === "target") update({ level });
    else {
      update({ scores: { ...draft.scores, [keyOf(active)]: level } });
      if (advance || autoAdvance) {
        const ordered = [...evidence.keys()].filter(i => i > index).concat([...evidence.keys()].filter(i => i < index));
        const unrated = ordered.find(i => !Object.hasOwn(draft.scores, keyOf(evidence[i])));
        if (unrated !== undefined) navigate(unrated);
      }
    }
  }
  function advance(skip = false) {
    if (lock.current) return;
    if (skip) onSkip(current);
    if (next) onAdvance(next);
    else onClose();
  }
  async function save(goNext: boolean) {
    if (lock.current || !canSave) return;
    lock.current = true; setSaving(true); setError("");
    let attemptedDraft = { ...draft, attempted: true };
    const persist = () => { setDraft(attemptedDraft); try { sessionStorage.setItem(storageKey, JSON.stringify(attemptedDraft)); } catch {} };
    persist();
    try {
      let review: Review | undefined;
      if (complete) {
        const response = await fetch("/api/mastery/evidence-review", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: studentId, unitId, targetId, lessonId, submissionId: actualSubmission,
            requestId: draft.requestId, mode: draft.mode, level: draft.level, evidenceKeys: evidence.map(keyOf), decisions, message: draft.note }) });
        const data = await response.json();
        if (!response.ok) {
          // Reuse the same request ID after an ambiguous save or a partial rating/return.
          if (response.status >= 400 && response.status < 500 && !attemptedDraft.ratingCommitted) {
            attemptedDraft = { ...attemptedDraft, attempted: false }; persist();
          }
          throw Error(data.error ?? "Review was not saved.");
        }
        if (!data.review) throw Error("The save response was incomplete. Retry to confirm the saved review.");
        review = data.review;
        attemptedDraft = { ...attemptedDraft, ratingCommitted: true }; persist();
      }
      if (draft.requestRevision) {
        const response = await fetch("/api/mastery/lesson-review", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_id: actualSubmission, action: "return", feedback: draft.note }) });
        const data = await response.json();
        if (!response.ok || !data.reviewed) {
          if (response.status >= 400 && response.status < 500 && !attemptedDraft.ratingCommitted) {
            attemptedDraft = { ...attemptedDraft, attempted: false }; persist();
          }
          throw Error(data.error ?? "The lesson return was not confirmed.");
        }
        setReturned(true); onReturned();
      }
      if (review) {
        setHistory(previous => [review!, ...previous.filter(r => r.id !== review!.id)]);
        setNotice("Saved for " + (student?.name ?? "this student") + ": " + review.overall_level + " · " + word(review.overall_level) + ".");
        onSaved(current);
      } else {
        setNotice("Feedback sent. Lesson returned for revision; mastery is unchanged."); onSkip(current);
      }
      setDraft({ ...attemptedDraft, attempted: false, requestRevision: false });
      setReassessing(false); onComplete();
      try { sessionStorage.removeItem(storageKey); sessionStorage.removeItem("mastery-desk:v1:" + studentId + ":" + targetId + ":" + lessonId); } catch {}
      lock.current = false;
      if (goNext) advance();
    } catch (e) { setError("Save not confirmed. Your draft is kept; retry to confirm before editing. " + (e as Error).message); }
    finally { lock.current = false; setSaving(false); }
  }
  function newAssessment() {
    const value = emptyDraft(); setDraft(value); setReassessing(true); setNotice("");
    try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || lock.current || e.altKey || paused) return;
      const typing = !!(e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]');
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); if (!help) void save(true); return; }
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") { e.preventDefault(); if (help) setHelp(false); else if (typing) (e.target as HTMLElement).blur(); else onClose(); return; }
      if (typing || help) return;
      if (e.key === "?") { e.preventDefault(); setHelp(true); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); if (e.shiftKey) { const other = roster[studentIndex + (e.key === "ArrowRight" ? 1 : -1)]; if (other) selectStudent(other.id); } else navigate(index + (e.key === "ArrowRight" ? 1 : -1)); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); noteRef.current?.focus(); }
      else if (/^(Digit|Numpad)[123]$/.test(e.code)) { e.preventDefault(); rate(Number(e.code.slice(-1)) as 1 | 2 | 3, e.shiftKey); }
    }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });

  return <>
    <ReviewQueueRail students={students} counts={counts} activeId={studentId} savedCount={savedCount} disabled={saving || paused} onSelect={selectStudent} />
    <div className={styles.content}>
      <Dialog.Description className={styles.srOnly}>Review lesson evidence, record a mastery rating, and send feedback.</Dialog.Description>
      <div className={styles.layout}>
        <main className={styles.work} ref={answerRef}>
          {(actualSubmission || lessonId.startsWith('presentation:') && evidence[0]?.evidenceKey) && <SubmissionSuggestions source={actualSubmission ? 'lesson' : 'presentation'} id={actualSubmission ?? evidence[0]!.evidenceKey!} disabled={frozen} onRating={rating=>{if(rating.target_id===targetId)update({mode:'target',level:rating.level})}} onFeedback={note=>update({note:draft.note||note})}/>} 
          <h3 className={styles.step}><span>1</span> Review the work</h3>
          <p className={styles.lessonTitle}>{lessons.find(([id]) => id === lessonId)?.[1] ?? "Lesson evidence"}</p>
          {active && <p className={styles.hint}>{lessonId.startsWith("presentation:") ? "Submitted class response" : actualSubmission ? "Submitted lesson" : "Saved work · not yet submitted"} · {new Date(active.createdAt).toLocaleString()}</p>}
          {!active ? <p>No evidence for this lesson and target. Choose another target or student.</p> : <>
            <section className={styles.prompt}><p className={styles.eyebrow}>THE CHALLENGE · RESPONSE {index + 1} OF {evidence.length}</p><h3>{active.prompt ?? "Original prompt unavailable. Check the lesson before rating."}</h3></section>
            <section className={styles.prominentRating} aria-label="Rate this evidence">
              <h3 className={styles.step}><span>2</span> Rate this evidence</h3>
              <p className={styles.target}>{target?.statement}</p>
              <p className={styles.hint}>Current target mastery: <strong>{currentMastery == null ? "Not yet rated" : `${currentMastery.toFixed(2)} / 3`}</strong></p>
              <ReviewRatings value={selected} disabled={frozen || !active} onChange={rate} />
              <p className={styles.hint}>{displayedMode === "target" ? `One rating for this target, based on ${evidence.length === 1 ? "this response" : `all ${evidence.length} responses`}.` : `${saved ? evidence.length : decisions.length} of ${evidence.length} responses scored or excluded.`} Your review saves when you continue.</p>
              {displayedMode === "evidence" && !saved && <>
                <label className={styles.check}><input type="checkbox" checked={autoAdvance} disabled={frozen} onChange={e => setAutoAdvance(e.target.checked)} />Rate & next response</label>
                <details className={styles.support}><summary>Exclude this response</summary><label className={styles.check}><input type="checkbox" disabled={frozen} checked={Object.hasOwn(draft.scores, keyOf(active)) && draft.scores[keyOf(active)] === null} onChange={e => { const scores = { ...draft.scores }; if (e.target.checked) scores[keyOf(active)] = null; else delete scores[keyOf(active)]; update({ scores }); }} />Do not use this response as evidence</label>
                  <input className={styles.reason} aria-label="Reason for excluding response" disabled={frozen} value={draft.reasons[keyOf(active)] ?? ""} onChange={e => update({ reasons: { ...draft.reasons, [keyOf(active)]: e.target.value } })} placeholder="Required reason for exclusion" /></details>
              </>}
              {proposed && <p className={styles.hint}>{saved ? "Saved assessment" : "Proposed assessment"}: {proposed} · {word(proposed)}{displayedMode === "evidence" ? ` · mean ${(saved?.mean ?? summary.mean)?.toFixed(2)} / 3` : ""}</p>}
            </section>
            <section className={styles.paper} aria-label="Student response"><div className={styles.paperHeading}><span>STUDENT WORK</span><span aria-hidden="true">✎</span></div><div className={styles.answer}>{renderResponse(active)}</div></section>
            {active.teacherGuidance && <section className={styles.guidance}><p className={styles.eyebrow}>TEACHER LOOK-FORS</p><p>{active.teacherGuidance}</p></section>}
            {!active.targetLinked && <p className={styles.caution}>Target connection is unconfirmed. Check that this response supports the target.</p>}
            <details className={styles.support}><summary>Response context & supports</summary><p>{active.evidenceSource ?? "Source not recorded"} · {active.responseMode ?? "Response mode not recorded"}</p><p>{active.scaffoldsUsed?.join(", ") || "No supports recorded"}. Language supports are not a penalty.</p></details>
          </>}
        </main>
        <aside className={styles.side} aria-label="Review and feedback">
          <div className={styles.formScroll}>
            <div className={styles.selectors}>
              <label>Learning target<select aria-label="Learning target" disabled={saving} value={targetId} onChange={e => onSelect(studentId, e.target.value, { lessonId, submissionId: actualSubmission })}>{targets.map(t => <option key={t.id} value={t.id}>{t.statement}</option>)}</select></label>
              {lessons.length > 1 && <label>Lesson<select aria-label="Lesson" disabled={saving} value={lessonId} onChange={e => onSelect(studentId, targetId, { lessonId: e.target.value })}>{lessons.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>}
              {reviewQueue.filter(item => item.studentId === studentId).length > 1 && <label>Pending work for this student<select aria-label="Pending work for this student" disabled={saving} value={reviewQueue.some(item => reviewItemKey(item) === reviewItemKey(current)) ? reviewItemKey(current) : ""} onChange={e => { const item = reviewQueue.find(item => reviewItemKey(item) === e.target.value); if (item) onSelect(item.studentId, item.targetId, item); }}><option value="" disabled>Choose pending work</option>{reviewQueue.filter(item => item.studentId === studentId).map(item => <option key={reviewItemKey(item)} value={reviewItemKey(item)}>{item.lessonTitle ?? "Lesson"} · {targets.find(t => t.id === item.targetId)?.statement}</option>)}</select></label>}
            </div>
            <h3 className={styles.sideHeading}>Student responses</h3>
            <div className={styles.responseList}>{evidence.map((item, i) => <button type="button" key={keyOf(item)} aria-current={index === i ? "step" : undefined} disabled={saving} onClick={() => navigate(i)}><strong>{i + 1}. {activity(item)}</strong><small>{item.prompt ?? "Student response"}</small></button>)}</div>
            <div className={styles.responseNav}><button aria-label="Previous response" disabled={saving || index === 0} onClick={() => navigate(index - 1)}>← Previous</button><span>{evidence.length ? index + 1 : 0} / {evidence.length}</span><button aria-label="Next response" disabled={saving || index >= evidence.length - 1} onClick={() => navigate(index + 1)}>Next →</button></div>
            <details className={styles.support}><summary>Rating guidance & method</summary><p>Language access is not a penalty. Use later independent work to confirm transfer.</p><label className={styles.method}>Rating method<select aria-label="Rating method" disabled={frozen} value={displayedMode} onChange={e => update({ mode: e.target.value as Draft["mode"] })}><option value="target">One target rating</option><option value="evidence">Score each response</option></select></label></details>
            <ReviewFeedback id="lesson-review-note" value={saved ? saved.note || saved.message : draft.note} onChange={note => update({ note })} inputRef={noteRef} maxLength={1600} disabled={frozen} required={!!draft.requestRevision} />
            {!saved && (canReturn || draft.requestRevision) && <>
              <label className={styles.revisionRequest}><input type="checkbox" disabled={frozen} checked={!!draft.requestRevision} onChange={e => update({ requestRevision: e.target.checked })} /><span>Ask for a correction, explanation, or help request.<small>Return this lesson with your feedback.</small></span></label>
              <button className={styles.defer} disabled={frozen} onClick={() => { update({ level: null, scores: {}, reasons: {}, requestRevision: true }); noteRef.current?.focus(); }}>Need more evidence before rating</button>
            </>}
            {isReturned && <p className={styles.hint}>Lesson returned for revision.</p>}
            <details className={styles.support}><summary>Assessment history</summary>{history.length ? history.map(r => <p key={r.id}><strong>{r.overall_level} · {word(r.overall_level)}</strong> · {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Saved review"} · {r.rating_mode === "target" ? "Teacher judgment" : "Response scores"}</p>) : <p>No saved lesson reviews for this target.</p>}{(work.records ?? []).filter(r => r.target_id === targetId).slice(-5).reverse().map((r, i) => <p key={i}>{r.level} / 3 · {new Date(r.observed_at).toLocaleDateString()}</p>)}</details>
            {saved && <button disabled={saving} onClick={newAssessment}>Record a new assessment</button>}
            {reassessing && <p className={styles.hint}>This adds a new assessment. The previous rating remains in the history.</p>}
          </div>
          <div className={styles.actions}>
            {saved ? <button className={styles.primary} disabled={saving} onClick={() => advance()}>{next ? "Continue to pending work" : "Finish review"}</button> : <button className={styles.primary} disabled={saving || !canSave} onClick={() => void save(true)}>{saving ? "Saving…" : draft.attempted ? "Retry review and continue" : "Release review and continue"}</button>}
            {!saved && <div className={styles.secondaryActions}><button disabled={saving || !canSave} onClick={() => void save(false)}>Release & stay</button><button disabled={saving || !!draft.attempted} onClick={() => advance(true)}>Skip for now</button></div>}
            <div className={styles.saveStatus} aria-live="polite">{historyError ? <p role="alert">{historyError} <button onClick={() => setHistoryVersion(v => v + 1)}>Retry saved reviews</button></p> : !historyReady || !ready ? <p>Loading saved reviews…</p> : error ? <p role="alert" className={styles.error}>{error}</p> : <p>{notice || (saved ? `Saved for ${student?.name}: ${saved.overall_level} · ${word(saved.overall_level)}.` : "Private draft kept in this tab until you release it.")}</p>}</div>
            <button className={styles.shortcuts} onClick={() => setHelp(true)}>1 · 2 · 3 rate · F feedback · ⌘/Ctrl + Enter save</button>
          </div>
        </aside>
      </div>
      <ReviewStudentBar name={student?.name ?? "Student"} title={<Dialog.Title>{student?.name ?? "Student"}</Dialog.Title>} context={`Lesson · ${pendingStudents} ${pendingStudents === 1 ? "student" : "students"} remaining`} previous={roster[studentIndex - 1]} next={roster[studentIndex + 1]} disabled={saving || paused} onSelect={selectStudent} onClose={onClose} />
    </div>
    <Dialog.Root open={help} onOpenChange={setHelp}><Dialog.Portal><Dialog.Overlay className={styles.modalScrim} /><Dialog.Content className={styles.modal}><Dialog.Title>Review shortcuts</Dialog.Title><Dialog.Description>Shortcuts pause while you type.</Dialog.Description><p>1 / 2 / 3 — choose a rating</p><p>← / → — browse responses</p><p>Shift + ← / → — switch students</p><p>⌘ / Ctrl + Enter — save review and continue</p><p>F — feedback · Esc — close</p><Dialog.Close>Close shortcuts</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
