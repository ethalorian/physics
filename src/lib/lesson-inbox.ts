import type { MasteryReviewItem } from './mastery-review-queue';

export interface InboxLesson { id: string; title: string; historical?: boolean }
interface LessonWork { lesson_id: string | null; lessonTitle: string }
export interface LessonInboxSummary extends InboxLesson {
  submissions: number; targets: number; responses: number;
}
/** The current catalog is authoritative; saved work cannot recreate removed choices. */
export function summarizeLessonInbox(lessons: InboxLesson[], submissions: LessonWork[], evidence: LessonWork[], reviews: MasteryReviewItem[]) {
  const rows = new Map<string, LessonInboxSummary>();
  for (const lesson of lessons) if (!lesson.historical) rows.set(lesson.id, { id: lesson.id, title: lesson.title, submissions: 0, targets: 0, responses: 0 });
  for (const sub of submissions) { const row = sub.lesson_id ? rows.get(sub.lesson_id) : undefined; if (row) row.submissions++; }
  for (const item of evidence) { const row = item.lesson_id ? rows.get(item.lesson_id) : undefined; if (row) row.responses++; }
  for (const review of reviews) { const row = rows.get(review.lessonId); if (row) row.targets++; }
  return [...rows.values()].sort((a, b) => Number(b.submissions > 0 || b.targets > 0) - Number(a.submissions > 0 || a.targets > 0));
}

export function newSubmissionIds(previous: Set<string> | null, incoming: { id: string }[]) {
  return previous ? incoming.filter(item => !previous.has(item.id)).map(item => item.id) : [];
}
