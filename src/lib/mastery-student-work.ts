import { evidenceContext } from "@/lib/mastery-evidence";
import { evidenceWithLinks } from "@/lib/lesson-evidence-links";
import { authorizeLesson } from "@/lib/lesson-access";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { targetSlugsInBlocks, lessonsByTarget } from "@/lib/lesson-targets";
import type { AuthContext } from "@/lib/api-auth";
import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { resolveTargetStudent } from "@/lib/teacher-scope";

// GET /api/mastery/student-work?user_id=<students.id>&unit_id=unit-1
// Feeds the rate-from-work drawer: the student's submitted block work across the
// unit's lessons (latest per block) + their mastery rating history per target.

type UnitRow = { id: string; name: string };
type LessonRow = {
  id: string;
  title: string;
  lesson_number: number;
  content_blocks?: { blocks?: unknown[] } | null;
};
type BlockRow = {
  present_session_id?: string | null;
  poll_run_id?: string | null;
  session_id?: string | null;
  lesson_id: string | null;
  block_id: string;
  block_type: string | null;
  response: unknown;
  created_at: string;
  response_mode?: string | null;
  scaffolds_used?: string[] | null;
  evidence_source?: string | null;
  confidence?: string | null;
  role?: string | null;
};
type TargetRow = {
  id: string;
  slug: string;
  statement: string;
  domain: string;
  order_index: number;
};
type RecordRow = {
  target_id: string;
  level: number;
  observed_at: string;
  evidence_source: string | null;
};

export async function getMasteryStudentWork(
  request: NextRequest,
  ctx: AuthContext,
) {
  const role = ctx.role;
  const isStaff = role === "admin" || role === "teacher";
  if (!isStaff && role !== "student")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get("unit_id");
  const requestedUserId = searchParams.get("user_id");
  // When a specific target cell is opened, scope the returned work to just that
  // target's lesson — so the teacher sees only the evidence for what they clicked.
  const targetId = searchParams.get("target_id");
  const requestedLesson = searchParams.get("lesson_id");
  const requestedSubmission = searchParams.get("submission_id");
  const evidenceMode = searchParams.get("mode") === "evidence";
  if (!unitId) {
    return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
  }
  // Students may only inspect their own work; admins may inspect anyone; a
  // teacher may only inspect students on their own roster.
  const resolved = await resolveTargetStudent({
    role,
    selfId: ctx.userId,
    scopeEmail: ctx.scopeEmail,
    requestedUserId,
  });
  if (!resolved.ok) {
    return NextResponse.json(
      { error: "Forbidden - student not in your roster" },
      { status: 403 },
    );
  }
  const userId = resolved.userId;

  // Unit name bridges to lessons.unit (display string == units.name).
  const { data: unitRows } = await supabaseAdmin
    .from("units")
    .select("id, name")
    .eq("id", unitId);
  const unitName = ((unitRows ?? []) as UnitRow[])[0]?.name ?? null;

  // Lessons in the unit
  let lessons: LessonRow[] = [];
  if (unitName) {
    const { data: lessonRows } = await supabaseAdmin
      .from("lessons")
      .select("id, title, lesson_number, content_blocks")
      .eq("unit", unitName)
      .order("lesson_number", { ascending: true });
    lessons = (lessonRows ?? []) as LessonRow[];
  }
  if (!isStaff) {
    const allowed: LessonRow[] = [];
    for (const lesson of lessons) {
      const access = await authorizeLesson(ctx, lesson.id);
      if (access.ok)
        allowed.push({ ...lesson, content_blocks: access.document });
    }
    lessons = allowed;
  }
  const titleByLesson = new Map<string, string>(
    lessons.map((l): [string, string] => [l.id, l.title]),
  );
  const lessonIds = lessons.map((l) => l.id);

  // If a target was clicked, narrow to the lessons that carry that target's work:
  // the owner plus every lesson whose blocks capture against it (MVP days share
  // their week's targets — lib/lesson-targets).
  let scopeLessonIds = lessonIds;
  let selectedTarget: { id: string; slug: string } | null = null;
  if (targetId) {
    const { data: tRow } = await supabaseAdmin
      .from("learning_targets")
      .select("id, slug, lesson_id")
      .eq("id", targetId)
      .maybeSingle();
    const t = tRow as {
      id: string;
      slug: string;
      lesson_id: string | null;
    } | null;
    selectedTarget = t;
    const carriers = t ? (lessonsByTarget(lessons, [t]).get(t.id) ?? []) : [];
    scopeLessonIds = carriers.filter((id) => lessonIds.includes(id));
  }

  if (requestedLesson)
    scopeLessonIds = scopeLessonIds.filter((id) => id === requestedLesson);
  // Submitted work always comes from its immutable snapshot. Legacy submissions are
  // bounded by submitted_at; subsequent saves cannot change what the teacher sees.
  let subQuery = supabaseAdmin
    .from("lesson_submissions")
    .select(
      "id, user_id, lesson_id, submitted_at, response_snapshot, content_snapshot",
    )
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  if (requestedSubmission) subQuery = subQuery.eq("id", requestedSubmission);
  const { data: subRows, error: subError } = await subQuery;
  if (subError) throw subError;
  const submissions = (subRows ?? []).filter((s) =>
    scopeLessonIds.includes(s.lesson_id),
  );
  if (requestedSubmission && !submissions.length)
    return NextResponse.json(
      { error: "Submission not found in this scope" },
      { status: 404 },
    );
  const latestSub = new Map<string, (typeof submissions)[number]>();
  for (const sub of submissions)
    if (!latestSub.has(sub.lesson_id)) latestSub.set(sub.lesson_id, sub);
  const { data: liveRows, error: liveError } = await supabaseAdmin
    .from("block_responses")
    .select(
      "id, lesson_id, target_id, block_id, block_type, response, created_at, response_mode, scaffolds_used, evidence_source, confidence, role, present_session_id, poll_run_id, session_id",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (liveError) throw liveError;
  const linkedRows = await evidenceWithLinks(liveRows ?? []);
  const scopeRows = linkedRows.filter((r) =>
    r.lesson_id
      ? scopeLessonIds.includes(r.lesson_id)
      : isStaff && evidenceMode,
  );
  const rows: (BlockRow & {
    submission_id?: string;
    target_id?: string | null;
  })[] = [];
  for (const lessonId of scopeLessonIds) {
    const sub = latestSub.get(lessonId);
    if (!evidenceMode && sub) {
      const captured = Array.isArray(sub.response_snapshot)
        ? (sub.response_snapshot as BlockRow[])
        : scopeRows.filter(
            (r) => r.lesson_id === lessonId && r.created_at <= sub.submitted_at,
          );
      rows.push(...captured.map((r) => ({ ...r, submission_id: sub.id })));
    } else rows.push(...scopeRows.filter((r) => r.lesson_id === lessonId));
  }
  if (isStaff && evidenceMode)
    rows.push(...scopeRows.filter((r) => !r.lesson_id));
  const work = [];
  const seen = new Set<string>();
  for (const b of rows.sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )) {
    const key = `${b.lesson_id}|${b.block_id}|${evidenceMode ? `${b.evidence_source}:${b.present_session_id ?? b.session_id ?? ""}:${b.poll_run_id ?? ""}` : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isStaff) {
      const lesson = lessons.find((l) => l.id === b.lesson_id);
      if (
        !lesson?.content_blocks?.blocks?.some(
          (block) => (block as { id: string }).id === b.block_id,
        )
      )
        continue;
    }
    const submission = b.lesson_id ? latestSub.get(b.lesson_id) : undefined;
    const currentDocument = lessons.find(
      (l) => l.id === b.lesson_id,
    )?.content_blocks;
    const snapshotDocument = submission?.content_snapshot as {
      blocks?: unknown[];
    } | null;
    const document =
      b.submission_id && snapshotDocument ? snapshotDocument : currentDocument;
    const block = document?.blocks?.find(
      (raw) =>
        raw &&
        typeof raw === "object" &&
        (raw as { id?: string }).id === b.block_id,
    );
    const context = evidenceContext(block);
    const attributed = [
      ...context.targets,
      ...(b.target_id ? [b.target_id] : []),
    ];
    // Explicitly unrelated responses must never feed this target's rating.
    if (
      selectedTarget &&
      attributed.length &&
      !attributed.some(
        (id) => id === selectedTarget.id || id === selectedTarget.slug,
      )
    )
      continue;
    work.push({
      evidenceKey: createHash("sha256")
        .update(
          JSON.stringify([
            b.lesson_id,
            b.submission_id,
            b.block_id,
            b.created_at,
            b.response,
          ]),
        )
        .digest("hex"),
      prompt: context.prompt || null,
      targetLinked: attributed.length > 0,

      lessonTitle:
        (b.lesson_id && titleByLesson.get(b.lesson_id)) ||
        "Unlinked Lobby work",
      lessonId: b.lesson_id,
      blockType: b.block_type,
      blockId: b.block_id,
      response: b.response,
      createdAt: b.created_at,
      responseMode: b.response_mode ?? null,
      scaffoldsUsed: b.scaffolds_used ?? [],
      evidenceSource: b.evidence_source ?? null,
      confidence: b.confidence ?? null,
      role: b.role ?? null,
      submissionId: b.submission_id ?? null,
      untargeted: !b.target_id,
      unlinked: !b.lesson_id,
    });
  }
  const reviewIds = [...latestSub.values()].map((s) => s.id);
  const { data: reviews, error: reviewError } = reviewIds.length
    ? await supabaseAdmin
        .from("lesson_reviews")
        .select("submission_id")
        .in("submission_id", reviewIds)
    : { data: [], error: null };
  if (reviewError) throw reviewError;
  const reviewedIds = new Set((reviews ?? []).map((r) => r.submission_id));
  const submissionStates = [...latestSub.values()].map((s) => ({
    id: s.id,
    lessonId: s.lesson_id,
    lessonTitle: titleByLesson.get(s.lesson_id),
    submittedAt: s.submitted_at,
    reviewed: reviewedIds.has(s.id),
    legacySnapshot: !Array.isArray(s.response_snapshot),
    ...(isStaff ? { contentSnapshot: s.content_snapshot } : {}),
  }));

  // Targets + this student's rating history for the unit
  const { data: targetRowsRaw } = await supabaseAdmin
    .from("learning_targets")
    .select("id, slug, statement, domain, order_index, lesson_id")
    .eq("unit_id", unitId)
    .order("order_index", { ascending: true });
  const lessonSlugs = requestedLesson
    ? targetSlugsInBlocks(
        (latestSub.get(requestedLesson)
          ?.content_snapshot as LessonRow["content_blocks"]) ??
          lessons.find((l) => l.id === requestedLesson)?.content_blocks,
      )
    : [];
  const targets = (
    (targetRowsRaw ?? []) as (TargetRow & { lesson_id?: string })[]
  )
    .filter(
      (t) =>
        !requestedLesson ||
        t.lesson_id === requestedLesson ||
        lessonSlugs.includes(t.slug) ||
        lessonSlugs.includes(t.id),
    )
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      statement: t.statement,
      domain: t.domain,
    }));
  const targetIds = targets.map((t) => t.id);

  let records: RecordRow[] = [];
  if (targetIds.length > 0) {
    const { data: recRaw } = await supabaseAdmin
      .from("mastery_records")
      .select("target_id, level, observed_at, evidence_source")
      .eq("user_id", userId)
      .in("target_id", targetIds)
      .order("observed_at", { ascending: true });
    records = (recRaw ?? []) as RecordRow[];
  }

  return NextResponse.json({
    userId,
    unitId,
    targets,
    records,
    work,
    submissions: submissionStates,
  });
}
