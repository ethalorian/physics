/**
 * Curriculum-track visibility — the single place that decides what a given
 * VIEWER is allowed to see.
 *
 * Two ideas combine:
 *   1. Content gates. Content is tagged by track at two grains:
 *        - whole lesson -> `lessons.visibility_track`
 *        - single block -> `BaseBlock.visibilityTrack` (inside content_blocks)
 *      An UNSET gate (null/undefined) is visible to everyone; a SET gate
 *      (e.g. 'honors') is restricted to that track.
 *   2. The viewer. Who is looking, and — for teachers/students — the track of
 *      the class they're looking through.
 *        - admin   -> sees EVERYTHING, every track, gate or no gate (global view).
 *        - teacher -> limited to the track of the section they're viewing.
 *        - student -> limited to the track of their class.
 *      An untyped class behaves as `cpa`, so honors content stays hidden until a
 *      class is explicitly typed honors at import.
 */

import type { BlockDocument, ContentBlock, TrackId } from '@/data/content-blocks';

export type { TrackId };

export type ViewerRole = 'admin' | 'teacher' | 'student';

/** Who is viewing, and through which class track (ignored for admin). */
export interface Viewer {
  role: ViewerRole;
  /** The track of the class/section being viewed. Ignored when role === 'admin'. */
  track?: string | null;
}

export const TRACK_LABELS: Record<TrackId, string> = {
  cpa: 'CPA Physics',
  honors: 'Honors Physics',
  ap: 'AP Physics',
  pbl: 'Project-Based Physics',
};

/** Tracks a teacher can actually choose today. */
export const LIVE_TRACKS: TrackId[] = ['cpa', 'honors'];

export function isValidTrack(t: string | null | undefined): t is TrackId {
  return t === 'cpa' || t === 'honors' || t === 'ap' || t === 'pbl';
}

/** An untyped class behaves as CPA — never accidentally exposes honors content. */
export function effectiveTrack(track: string | null | undefined): TrackId {
  return isValidTrack(track) ? track : 'cpa';
}

/**
 * Core rule: can this viewer see content carrying `gate`?
 * Admin bypasses every gate. Otherwise an unset gate is open to all, and a set
 * gate must match the viewer's class track.
 */
export function viewerCanSeeGate(
  viewer: Viewer,
  gate: string | null | undefined,
): boolean {
  if (viewer.role === 'admin') return true;
  if (!gate) return true;
  return effectiveTrack(gate) === effectiveTrack(viewer.track);
}

/** Should this block be shown to this viewer? */
export function isBlockVisible(block: ContentBlock, viewer: Viewer): boolean {
  return viewerCanSeeGate(viewer, block.visibilityTrack);
}

/** Should this whole lesson be shown to this viewer? */
export function isLessonVisible(
  visibilityTrack: string | null | undefined,
  viewer: Viewer,
): boolean {
  return viewerCanSeeGate(viewer, visibilityTrack);
}

/**
 * Project a BlockDocument for one viewer, dropping gated blocks they shouldn't
 * see. Admin gets the full document; a CPA class gets honors blocks removed; an
 * honors class gets everything.
 */
export function filterDocumentForViewer(
  doc: BlockDocument,
  viewer: Viewer,
): BlockDocument {
  if (viewer.role === 'admin') return doc; // global view: nothing hidden
  return { ...doc, blocks: doc.blocks.filter((b) => isBlockVisible(b, viewer)) };
}

// --- Convenience for the common student/teacher-by-track call sites ----------

/** Build a viewer from a role + class track. */
export function viewer(role: ViewerRole, track?: string | null): Viewer {
  return { role, track };
}
