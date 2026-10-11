import { supabaseAdmin } from "./supabase";
import { getStudentCourseIds } from "./teacher-scope";
/** Optional exploration is independent of assigned lesson embeds. */
export async function canExploreSimulations(
  userId: string,
  role: string,
): Promise<boolean> {
  if (["admin", "teacher", "observer"].includes(role)) return true;
  if (role !== "student") return false;
  const ids = await getStudentCourseIds(userId);
  if (!ids.length) return false;
  const result = await supabaseAdmin
    .from("courses")
    .select("id")
    .in("id", ids)
    .eq("simulation_exploration_enabled", true)
    .is("archived_at", null)
    .eq("course_state", "ACTIVE")
    .limit(1);
  if (result.error) throw result.error;
  return Boolean(result.data?.length);
}
