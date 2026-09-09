import { isCaptureBlock, paginateBlocks, type ContentBlock } from '@/data/content-blocks'

export interface LessonLocation { step: number; totalSteps: number; response: number | null }
/** Slide continuations keep the original block ID, so these match the student reader. */
export function lessonLocation(blockId: string | undefined, blocks: ContentBlock[]): LessonLocation | null {
  if (!blockId) return null
  const pages = paginateBlocks(blocks)
  const step = pages.findIndex(page => page.blocks.some(block => block.id === blockId))
  if (step < 0) return null
  const response = blocks.filter(isCaptureBlock).findIndex(block => block.id === blockId)
  return { step: step + 1, totalSteps: pages.length, response: response < 0 ? null : response + 1 }
}
export const lessonNumber = (number: number) => String(number).padStart(2, '0')
export function LessonLocationLabel({ location }: { location: LessonLocation | null }) {
  return location ? <span className="lesson-location-label">Step {lessonNumber(location.step)} of {location.totalSteps}{location.response !== null && <> · Response {lessonNumber(location.response)}</>}</span> : null
}

/** Included inside the projector portal as well as the main app; one visual recipe. */
export const lessonIdentityStyles = `
.lesson-chapter{position:relative;isolation:isolate;overflow:hidden;background:var(--primary);color:var(--primary-foreground);border-radius:24px}
.lesson-chapter::before{content:'';position:absolute;width:320px;height:320px;right:-110px;top:-145px;border:1px solid color-mix(in oklch,var(--primary-foreground) 20%,transparent);border-radius:50%;box-shadow:0 0 0 40px color-mix(in oklch,var(--primary-foreground) 4%,transparent),0 0 0 80px color-mix(in oklch,var(--primary-foreground) 4%,transparent);z-index:-1;pointer-events:none}
.lesson-chapter-number{position:absolute;right:12px;top:26px;font-size:190px;line-height:1;letter-spacing:-.08em;font-weight:800;color:var(--primary-foreground);opacity:.1;pointer-events:none;z-index:-1}
.lesson-location-label{display:inline-flex;align-items:center;gap:6px;font-size:inherit;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.lesson-response-badge{display:inline-block;padding:6px 8px;border-radius:6px;background:var(--primary);color:var(--primary-foreground);font-size:11px;font-weight:700;letter-spacing:.07em}
.lesson-chapter-title{font-family:'Source Serif 4',Georgia,'Times New Roman',serif;font-weight:700;line-height:1.08;letter-spacing:-.035em}
`
