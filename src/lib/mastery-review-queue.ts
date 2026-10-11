export interface MasteryReviewItem {
  studentId: string;
  targetId: string;
  lessonId: string;
  submissionId?: string | null;
  lessonTitle?: string;
}
export const reviewItemKey = (item: MasteryReviewItem) =>
  JSON.stringify([item.studentId, item.targetId, item.lessonId, item.submissionId ?? null]);

/** Counts and navigation must use the same student–lesson–target evidence scope. */
export function filterReviewQueue(items: MasteryReviewItem[], scope: {
  studentIds: string[]; targetIds: string[]; lessonId?: string; excluded?: Set<string>;
}) {
  const students = new Set(scope.studentIds), targets = new Set(scope.targetIds);
  return items.filter(item => students.has(item.studentId) && targets.has(item.targetId) &&
    (!scope.lessonId || item.lessonId === scope.lessonId) && !scope.excluded?.has(reviewItemKey(item)));
}

/** Finish the active student first, then keep each remaining student’s work together. */
export function orderReviewQueue(items: MasteryReviewItem[], current: MasteryReviewItem) {
  const studentOrder = [...new Set([current.studentId, ...items.map(item => item.studentId)])];
  return items.map((item, index) => ({ item, index })).sort((a, b) => {
    const rank = (item: MasteryReviewItem) => studentOrder.indexOf(item.studentId) * 2 + (item.lessonId === current.lessonId && item.targetId === current.targetId ? 0 : 1);
    return rank(a.item) - rank(b.item) || a.index - b.index;
  }).map(({ item }) => item);
}
