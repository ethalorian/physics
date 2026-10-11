"use client";
import { useRef, type ReactNode, type Ref } from "react";
import styles from "./ReviewDeskControls.module.css";
export const ratingWord = (level: number) => ["", "Not yet", "Almost", "Got it"][level];
export function ReviewRatings({ value, disabled, onChange, math = false }: {
  value?: number | null; disabled?: boolean; onChange: (level: 1 | 2 | 3) => void; math?: boolean;
}) {
  return <div className={styles.ratings} aria-label="Evidence rating">{([1, 2, 3] as const).map(level =>
    <button type="button" key={level} data-level={level} aria-label={level + " · " + ratingWord(level)}
      aria-pressed={value === level} disabled={disabled} onClick={() => onChange(level)}>
      <span className={styles.ratingKey} aria-hidden="true">{level}</span><span className={styles.ratingCopy}>
        <strong>{ratingWord(level)}</strong><small>{level === 1 ? math ? "With mathematical support" : "With support" : level === 2 ? "Independent in a routine context" : "Transfers and explains why"}</small>
      </span>
    </button>)}</div>;
}
const starters = [
  ["Explain your thinking", "Explain how you chose your approach."],
  ["Try another way", "Can you show another way to solve this?"],
  ["Let’s talk it through", "Let’s talk through your approach together."],
];
export function ReviewFeedback({ id, value, onChange, disabled, required = false, maxLength = 2000, inputRef, label = "Feedback and next step" }: {
  id: string; value: string; onChange: (value: string) => void; disabled?: boolean; required?: boolean;
  maxLength?: number; inputRef?: Ref<HTMLTextAreaElement>; label?: string;
}) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  return <section className={styles.feedback}>
    <h4 className={styles.step}><span>3</span> Written feedback <kbd>F</kbd></h4>
    <label htmlFor={id}>{label}</label>
    <div className={styles.starters} aria-label="Feedback starters">{starters.map(([title, prompt]) =>
      <button type="button" key={title} disabled={disabled} onClick={() => {
        onChange((value.trim() ? value + "\n" + prompt : prompt).slice(0, maxLength)); localRef.current?.focus();
      }}>{title}<span aria-hidden="true"> +</span></button>)}</div>
    <textarea id={id} aria-label="Written feedback" ref={element => {
      localRef.current = element;
      if (typeof inputRef === "function") inputRef(element); else if (inputRef) inputRef.current = element;
    }} rows={5} maxLength={maxLength} disabled={disabled} required={required} value={value}
      onChange={e => onChange(e.target.value)} placeholder="What went well? What should they try next?" />
    <p>{required ? "A message is required so the student knows what to do." : "Optional · shared with the student when you save."}</p>
  </section>;
}
export interface ReviewStudent { id: string; name: string; ratable?: boolean }
export function ReviewQueueRail({ students, counts, activeId, savedCount, disabled, onSelect }: {
  students: ReviewStudent[]; counts: Record<string, number>; activeId: string; savedCount: number; disabled?: boolean; onSelect: (id: string) => void;
}) {
  const roster = students.filter(s => s.ratable !== false).slice().sort((a, b) => Number(!!counts[b.id]) - Number(!!counts[a.id]));
  const pending = roster.filter(s => counts[s.id]).length;
  return <nav className={styles.roster} aria-label="Student review queue">
    <div className={styles.queueHeading}><span className={styles.queueMark} aria-hidden="true">✦</span><strong>Your review queue</strong>
      <p>{pending ? pending + (pending === 1 ? " student to go" : " students to go") : "All caught up"}</p><div className={styles.sessionCount} aria-live="polite">✓ {savedCount} reviews saved this session</div></div>
    <div className={styles.rosterList}>{roster.map(student => <button type="button" key={student.id} title={student.name}
      aria-current={student.id === activeId ? "true" : undefined} data-done={!counts[student.id]} disabled={disabled} onClick={() => onSelect(student.id)}>
      <span className={styles.initials} aria-hidden="true">{student.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}</span>
      <span className={styles.studentName}>{student.name}<small>{student.id === activeId ? "Reviewing now" : counts[student.id] ? counts[student.id] + " to review" : "No pending work · open history"}</small></span>
      <span aria-hidden="true">{counts[student.id] || "✓"}</span>
    </button>)}</div>
  </nav>;
}
export function ReviewStudentBar({ title, name, context, previous, next, disabled, onSelect, onClose }: {
  title?: ReactNode; name: string; context: string; previous?: ReviewStudent; next?: ReviewStudent;
  disabled?: boolean; onSelect: (id: string) => void; onClose: () => void;
}) {
  return <footer className={styles.studentBar} aria-label="Active student"><div className={styles.studentIdentity}>
    <p>✦ The review desk <span>{context}</span></p>{title ?? <h3>{name}</h3>}
    </div><div className={styles.studentNav}>
      <button type="button" aria-label="Previous student" disabled={!previous || disabled} onClick={() => previous && onSelect(previous.id)}>← Previous student<small>Shift + ←</small></button>
      <button type="button" aria-label="Next student" disabled={!next || disabled} onClick={() => next && onSelect(next.id)}>Next student →<small>{next?.name ?? "End of queue"} · Shift + →</small></button>
    </div><button type="button" className={styles.close} aria-label="Close review" disabled={disabled} onClick={onClose}>×</button></footer>;
}
