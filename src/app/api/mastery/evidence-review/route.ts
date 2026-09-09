import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { teacherCanAccessStudent } from "@/lib/teacher-scope";
import { getMasteryStudentWork } from "@/lib/mastery-student-work";
import {
  summarizeEvidence,
  validateEvidenceDecisions,
} from "@/lib/evidence-rating";
import { targetIdsForLesson } from "@/lib/lesson-targets";

export const POST = withAuth(async (request, ctx) => {
  if (!["teacher", "admin"].includes(ctx.role))
    return NextResponse.json(
      { error: "Only teachers can review evidence." },
      { status: 403 },
    );
  const body = await request.json();
  const { userId, unitId, targetId, lessonId, requestId } = body;
  if (
    ![userId, unitId, targetId, lessonId, requestId].every(
      (v) => typeof v === "string" && v.length > 0 && v.length < 200,
    ) ||
    !/^[0-9a-f-]{36}$/i.test(requestId)
  )
    return NextResponse.json(
      { error: "Invalid review identifiers." },
      { status: 400 },
    );
  if (!(await teacherCanAccessStudent(ctx.scopeEmail, userId)))
    return NextResponse.json(
      { error: "Student is not on your roster." },
      { status: 403 },
    );
  // A retry returns the original committed review, even if newer work has arrived.
  const { data: prior, error: priorError } = await supabaseAdmin
    .from("mastery_evidence_reviews")
    .select("id,user_id,target_id,lesson_id,reviewer_email,overall_level,mean")
    .eq("id", requestId)
    .maybeSingle();
  if (priorError) throw priorError;
  if (prior) {
    if (
      prior.user_id !== userId ||
      prior.target_id !== targetId ||
      prior.lesson_id !== lessonId ||
      prior.reviewer_email !== ctx.scopeEmail
    )
      return NextResponse.json(
        { error: "Review identifier conflict." },
        { status: 409 },
      );
    return NextResponse.json({
      id: prior.id,
      level: prior.overall_level,
      mean: prior.mean,
    });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 1600)
    return NextResponse.json(
      { error: "Keep written feedback under 1600 characters." },
      { status: 400 },
    );
  const url = new URL(request.url);
  url.search = new URLSearchParams({
    user_id: userId,
    unit_id: unitId,
    target_id: targetId,
    lesson_id: lessonId,
  }).toString();
  const workResponse = await getMasteryStudentWork(new NextRequest(url), ctx);
  if (!workResponse.ok) return workResponse;
  const data = await workResponse.json();
  type Work = {
    evidenceKey: string;
    blockId: string;
    submissionId: string | null;
    lessonId: string;
    blockType: string;
    prompt: string | null;
    response: unknown;
    createdAt: string;
    targetLinked: boolean;
  };
  const work: Work[] = data.work ?? [];
  let decisions;
  try {
    decisions = validateEvidenceDecisions(
      body.decisions,
      work.map((w) => w.evidenceKey),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
  const target = data.targets.find((t: { id: string }) => t.id === targetId);
  if (!target)
    return NextResponse.json(
      { error: "Learning target not found." },
      { status: 422 },
    );
  const summary = summarizeEvidence(decisions);
  const snapshot = work.map((w) => ({
    ...w,
    ...decisions.find((d) => d.key === w.evidenceKey),
  }));
  const submissionIds = [
    ...new Set(work.map((w) => w.submissionId).filter(Boolean)),
  ];
  const requirements = await targetIdsForLesson(lessonId);
  const feedback = `Overall rating: ${summary.level} / 3 (${summary.level === 1 ? "Not yet" : summary.level === 2 ? "Almost" : "Got it"}).\nEvidence average: ${summary.mean!.toFixed(2)} / 3 from ${summary.count} rated responses, equally weighted and rounded to the nearest level.${message ? `\n\n${message}` : ""}`;
  const { data: saved, error } = await supabaseAdmin.rpc(
    "submit_mastery_evidence_review",
    {
      p_id: requestId,
      p_user: userId,
      p_reviewer: ctx.scopeEmail,
      p_target: targetId,
      p_lesson: lessonId,
      p_evidence: snapshot,
      p_message: feedback,
      p_submissions: submissionIds,
      p_required_targets: requirements,
    },
  );
  if (error) throw error;
  return NextResponse.json(saved, { status: 201 });
});

export const GET = withAuth(async (request, ctx) => {
  const url = new URL(request.url),
    userId = url.searchParams.get("user_id") ?? ctx.userId;
  if (
    userId !== ctx.userId &&
    (!["teacher", "admin"].includes(ctx.role) ||
      !(await teacherCanAccessStudent(ctx.scopeEmail, userId)))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let query = supabaseAdmin
    .from("mastery_evidence_reviews")
    .select(
      "id,target_id,lesson_id,evidence,overall_level,mean,message,created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (url.searchParams.get("target_id"))
    query = query.eq("target_id", url.searchParams.get("target_id"));
  const { data, error } = await query;
  if (error) throw error;
  return NextResponse.json({ reviews: data ?? [] });
});
