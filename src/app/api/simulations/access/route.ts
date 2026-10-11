import { NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/api-auth";
import { canExploreSimulations } from "@/lib/simulation-access";
import { supabaseAdmin } from "@/lib/supabase";
import { getCourseOwnerEmail } from "@/lib/teacher-scope";
export const GET = withAuth(async (_request, ctx) => {
  if (ctx.role !== "admin" && ctx.role !== "teacher")
    return NextResponse.json({
      allowed: await canExploreSimulations(ctx.userId, ctx.role),
    });
  let query = supabaseAdmin
    .from("courses")
    .select("id,name,section,simulation_exploration_enabled")
    .is("archived_at", null)
    .eq("course_state", "ACTIVE")
    .order("name");
  if (ctx.role === "teacher") query = query.eq("teacher_email", ctx.scopeEmail);
  const result = await query;
  if (result.error) throw result.error;
  return NextResponse.json({ allowed: true, courses: result.data ?? [] });
});
export const PUT = withRole(["teacher", "admin"], async (request, ctx) => {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.courseId !== "string" ||
    typeof body.enabled !== "boolean"
  )
    return NextResponse.json(
      { error: "Choose a class and an exploration setting." },
      { status: 422 },
    );
  if (
    ctx.role === "teacher" &&
    (await getCourseOwnerEmail(body.courseId)) !== ctx.scopeEmail
  )
    return NextResponse.json(
      { error: "This class is not on your teaching roster." },
      { status: 403 },
    );
  const result = await supabaseAdmin
    .from("courses")
    .update({ simulation_exploration_enabled: body.enabled })
    .eq("id", body.courseId)
    .select("id,simulation_exploration_enabled")
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data)
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  return NextResponse.json({ course: result.data });
});
