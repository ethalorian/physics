/**
 * Content-block model — SOURCE OF TRUTH for structured lesson / packet / worksheet content.
 *
 * A document is an ordered array of typed blocks. The SAME array projects to:
 *   - WEB:   a React renderer maps each block.type → a component (some interactive).
 *   - PRINT: the packet builder reads the same blocks → grayscale print components.
 *   - DB:    stored as lessons.content_blocks (jsonb); interactive blocks capture student data.
 *
 * Design contracts carried from the curriculum-builder skill:
 *   - Free-response areas are OPEN BOXES, never ruled lines (sentence frames OK).
 *   - Heavy scaffolding by default (ELL/SWD).
 *   - Interactive blocks feed existing systems: Marzano → mastery_records,
 *     exit ticket → formative, GEWA → graded work.
 */

export type BlockId = string;

export type DayType =
  | 'ANCHOR' | 'STANDARD' | 'LAB' | 'WORKSHOP' | 'SYNTHESIS' | 'TRANSFER';

interface BaseBlock {
  id: BlockId;
  /** Optional teacher/author note; never shown to students. */
  note?: string;
}

// ---------------------------------------------------------------------------
// DISPLAY / SCAFFOLD BLOCKS (no data capture)
// ---------------------------------------------------------------------------

export interface TargetBlock extends BaseBlock {
  type: 'target';
  statement: string;          // the "I can…" text
  targetId?: string;          // links to learning_targets.slug
}

export interface AsteroidThreadBlock extends BaseBlock {
  type: 'asteroid_thread';
  whatWeKnow?: string;
  connection: string;         // how today connects to 2026-XJ
}

export interface ProseBlock extends BaseBlock {
  type: 'prose';
  markdown: string;           // markdown + KaTeX
}

export interface VocabBlock extends BaseBlock {
  type: 'vocab';
  terms: { term: string; definition: string; cognate?: string }[];
  vocabularySetId?: string;   // links to vocabulary_sets
}

export interface WorkedExampleBlock extends BaseBlock {
  type: 'worked_example';
  prompt: string;
  given?: string;
  equation?: string;
  work?: string;
  answer?: string;            // a fully worked GEWA, shown (not captured)
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: 'note' | 'tip' | 'warning' | 'misconception';
  title?: string;
  markdown: string;
}

export interface SentenceFrameBlock extends BaseBlock {
  type: 'sentence_frame';
  frame: string;              // e.g. "The slope tells me ___ because ___"
  wordBank?: string[];
}

export interface DoodleBlock extends BaseBlock {
  type: 'doodle';
  capture?: true;             // sketches register as logged work (see CAPTURE_BLOCK_TYPES)
  instruction: string;        // one-line framing
  prompts?: string[];         // explicit, numbered directions for what to draw (scaffolding)
  scaffoldSvg?: string;       // pre-drawn scaffold the student completes (faint background)
  imageUrl?: string;          // alternative raster scaffold
  palette?: string[];         // colors offered to the student (defaults provided)
  grid?: boolean;             // graph-paper background for a blank sketch
  backgroundDiagram?: DiagramScene; // draw/annotate ON TOP of a physics diagram
}

/** A lab-notebook capture block: an annotatable sketch area + labeled
 *  reasoning/step boxes, so students record their thinking AND their work
 *  together in context. Response shape: { strokes, fields: Record<label,text> }. */
export interface LabNotebookBlock extends BaseBlock {
  type: 'lab_notebook';
  capture: true;
  instruction: string;
  fields?: string[];          // labels for the written-reasoning boxes (defaults provided)
  palette?: string[];
  grid?: boolean;
  backgroundDiagram?: DiagramScene; // optional physics scene to annotate on the sketch
}

export interface SimEmbedBlock extends BaseBlock {
  type: 'sim_embed';
  simulationSlug: string;     // links to simulations.slug
}

export interface EquationVisualizerBlock extends BaseBlock {
  type: 'equation_visualizer'; // native interactive equation explorer (no iframe)
}

export interface LessonVocabBlock extends BaseBlock {
  type: 'lesson_vocab';        // renders the lesson's tiered SEI vocab (authored in the builder)
}

/**
 * PROCEDURE — an ordered list of hands-on build / lab steps (the proper home for
 * physical "do this, then this" instructions that used to be jammed into callouts).
 * Display-only (no capture): students FOLLOW the steps; their thinking/work about
 * the build is logged separately in lab_notebook / gewa / observation blocks.
 */
export interface ProcedureBlock extends BaseBlock {
  type: 'procedure';
  title?: string;             // e.g. "Build steps 10–15" (shown above the list)
  intro?: string;             // optional one-line framing (markdown)
  steps: string[];            // ordered actions (each supports markdown + KaTeX)
  startNumber?: number;       // first step's displayed number (default 1) — lets a day continue the unit's running build count
}

// ---------------------------------------------------------------------------
// INTERACTIVE / DATA-CAPTURING BLOCKS  (`capture: true`)
// ---------------------------------------------------------------------------

export interface GewaBlock extends BaseBlock {
  type: 'gewa';
  capture: true;
  prompt: string;
  givenHint?: string;
  equationHint?: string;      // student fills GIVEN / EQUATION / WORK / ANSWER; saved + AI-gradable
  equationOptions?: string[]; // optional equation bank (recognition-by-sight); falls back to a kinematics set
}

export interface EquationSandboxBlock extends BaseBlock {
  type: 'equation_sandbox';
  capture: true;
  prompt: string;
  /** Optional seed variables for the palette (symbol + value + unit chips). */
  variables?: { symbol: string; value?: string; unit?: string }[];
}

export interface ExitTicketBlock extends BaseBlock {
  type: 'exit_ticket';
  capture: true;
  prompt: string;
  frame?: string;             // optional sentence frame; response is an OPEN BOX
}

export interface MarzanoBlock extends BaseBlock {
  type: 'marzano';
  capture: true;
  targetId: string;           // 1-2-3 self-rating → informs the mastery view
}

/**
 * SKETCH — a student DRAWING product (graphs, free-body diagrams, sketches).
 * Uses the lobby PaintPad. When `grid` is set it draws on a labeled coordinate
 * plane so a position–time graph or FBD has axes to build on (matches the
 * packet's "real coordinate grid" convention). Saved as { strokes }.
 */
export interface SketchBlock extends BaseBlock {
  type: 'sketch';
  capture: true;
  instruction: string;        // what to draw + how (at-home guidance lives here)
  prompts?: string[];         // optional bullet checklist shown under the canvas
  grid?: boolean;             // draw a labeled coordinate plane behind the canvas
  xLabel?: string;            // x-axis label when grid is on (e.g. "Time (s)")
  yLabel?: string;            // y-axis label when grid is on (e.g. "Position (m)")
  quadrants?: 1 | 4;          // 1 = first-quadrant axes (default), 4 = full x/y cross
  backgroundDiagram?: DiagramScene; // optional physics figure to annotate on top of
  scaffoldSvg?: string;       // optional raw SVG scaffold to draw on top of
}

export interface QuestionBlock extends BaseBlock {
  type: 'question';
  capture: true;
  questionBankId?: string;    // reuse question_bank, OR inline:
  question?: unknown;         // a Question object (MC / numerical / open-response)
}

export interface DataTableBlock extends BaseBlock {
  type: 'data_table';
  capture: true;
  columns: string[];
  rows: number;               // blank rows for lab data
  plot?: boolean;             // show the live graph (default true when ≥2 columns)
  xCol?: number;              // column index for x-axis (default 0)
  yCol?: number;              // column index for y-axis (default 1)
  patternPrompt?: string;     // optional override for the "what pattern?" prompt
}

export interface ObservationBlock extends BaseBlock {
  type: 'observation';
  capture: true;
  patternPrompt: string;      // "What pattern do you see?"
  interpretPrompt: string;    // "What does it mean?"
  frame?: string;             // responses are OPEN BOXES
}

export interface SelfAssessmentBlock extends BaseBlock {
  type: 'self_assessment';
  capture: true;
  targetIds: string[];        // workshop: rate yourself across this unit's targets
}

export interface TransferPromptBlock extends BaseBlock {
  type: 'transfer_prompt';
  masteryTaskSlug: string;    // links to mastery_tasks; scored on the 4-D rubric
}

// ---------------------------------------------------------------------------
// MEDIA / VISUAL BLOCKS (no data capture) — make lessons visually rich.
// Physics-first: a figure to read, a code-drawn diagram, or an interactive
// graph students interrogate. Decorative use is fine too.
// ---------------------------------------------------------------------------

/** A figure: an image students look at. Source is a URL (pasted, or an uploaded
 *  file's public URL once the storage pipeline lands). Caption carries the
 *  "what am I looking at" so the image does cognitive work, not just decoration. */
export interface FigureBlock extends BaseBlock {
  type: 'figure';
  src: string;                 // image URL
  alt: string;                 // required — accessibility + EL support
  caption?: string;            // shown under the image (supports plain text)
  credit?: string;             // small attribution line
  align?: 'center' | 'full';   // center = capped width; full = fill the column (default center)
}

export type DiagramKind = 'free_body' | 'vectors' | 'motion_map' | 'circuit' | 'energy_chain' | 'friction_asymmetry';
/** A direction is a compass word or an angle in degrees (CCW from +x). */
export type DiagramDir = 'up' | 'down' | 'left' | 'right' | number;
export interface DiagramForce { label: string; dir: DiagramDir; mag: number; color?: string }
export interface DiagramVector { label: string; angle: number; mag: number; color?: string }
/** A single component placed around the rectangular series loop (kind === 'circuit').
 *  side picks which edge of the loop the component sits on; label appears next to it. */
export interface CircuitComponent { kind: 'battery' | 'switch' | 'motor' | 'resistor' | 'bulb'; side: 'top' | 'right' | 'bottom' | 'left'; label?: string }
/** A single link in a left-to-right energy chain (kind === 'energy_chain'). */
export interface EnergyChainLink { label: string; sublabel?: string; color?: string }

/** The data for a code-drawn physics diagram, decoupled from the block wrapper so
 *  it can also be used as an annotatable background behind a sketch (doodle /
 *  lab_notebook). Mirrors the renderable fields of DiagramBlock. */
export interface DiagramScene {
  kind: DiagramKind;
  title?: string;
  caption?: string;
  forces?: DiagramForce[];
  vectors?: DiagramVector[];
  showResultant?: boolean;
  dots?: number[];
  components?: CircuitComponent[];
  links?: EnergyChainLink[];
  leftMag?: number;
  rightMag?: number;
  veerDir?: 'left' | 'right';
}

/** A code-drawn SVG physics figure (no image file). The renderer draws it on-brand.
 *  Authors may provide structured fields (when seeded) OR a JSON `spec` string
 *  (the builder textarea); the renderer accepts either. */
export interface DiagramBlock extends BaseBlock {
  type: 'diagram';
  kind: DiagramKind;
  title?: string;
  caption?: string;
  genPrompt?: string;          // the plain-English description used to generate this (for re-editing)
  spec?: string;               // JSON authoring escape hatch (mirrors the fields below)
  forces?: DiagramForce[];     // kind === 'free_body'
  vectors?: DiagramVector[];   // kind === 'vectors'
  showResultant?: boolean;     // kind === 'vectors'
  dots?: number[];             // kind === 'motion_map' — relative gaps between strobe dots
  components?: CircuitComponent[]; // kind === 'circuit' — components on the rectangular loop
  links?: EnergyChainLink[];   // kind === 'energy_chain' — left-to-right labeled stages
  leftMag?: number;            // kind === 'friction_asymmetry' — friction magnitude at left wheel pair
  rightMag?: number;           // kind === 'friction_asymmetry' — friction magnitude at right wheel pair
  veerDir?: 'left' | 'right';  // kind === 'friction_asymmetry' — direction of resulting veer
}

export interface GraphSeries { label: string; color?: string; points: [number, number][] }
/** An interactive graph students read (recharts). Author supplies one or more
 *  series. Distinct from data_table (which graphs student-entered lab data). */
export interface GraphBlock extends BaseBlock {
  type: 'graph';
  title?: string;
  xLabel?: string;
  yLabel?: string;
  genPrompt?: string;          // the plain-English description used to generate this (for re-editing)
  spec?: string;               // JSON authoring escape hatch (mirrors `series`)
  series?: GraphSeries[];
}

// ---------------------------------------------------------------------------
// CONCEPT EXERCISE (textbook reader + auto-graded digital exercise, side-by-side)
// The heavy content (section text, items, and the answer key) lives server-side
// in the `concept_exercises` table keyed by chapter — NOT inline in the lesson —
// so lessons stay light, answer keys never ship to the client, and the
// (copyrighted) workbook text isn't bundled into git/JS. The block only
// references a chapter; the component fetches the chapter and renders the split
// view (PDF reader left, questions right, scroll-synced by section page anchors).
// ---------------------------------------------------------------------------

export type ExItemType = 'fill_in' | 'multiple_choice' | 'true_false' | 'short_answer';

export interface ExItem {
  n: number;                                  // item number within its section
  type: ExItemType;
  prompt: string;                             // question text
  blanks?: number;                            // fill_in: how many blanks (default 1)
  options?: { letter: string; text: string }[]; // multiple_choice choices (also used for matching rows w/ a shared word bank)
  multi?: boolean;                            // multiple_choice: "circle EACH" — more than one correct letter
}

export interface ExSection {
  id: string;                                 // e.g. "3.1"
  label: string;                              // e.g. "Aristotle on Motion"
  pageStart: number;                          // book page — scroll-sync anchor
  pageEnd: number;
  items: ExItem[];
}

/** A chapter's reader+exercise payload as served to the client (NO answer key). */
export interface ConceptChapter {
  chapter: number;
  title: string;
  textPdfUrl: string;                         // hosted chapter PDF
  pageOffset: number;                         // bookPage - pdfPageIndex (for sync)
  sections: ExSection[];
}

export interface ConceptExerciseBlock extends BaseBlock {
  type: 'concept_exercise';
  capture: true;
  chapter: number;                            // references the concept_exercises table
  title?: string;
  /** Optional: restrict the QUESTIONS shown + graded to just these section ids
   *  (e.g. ["4.4"] or ["6.1","6.3"]) so a day only assigns its reading sections.
   *  The full chapter PDF is still shown for context. Omit = whole chapter. */
  sectionIds?: string[];
}

// ---------------------------------------------------------------------------
// UNION + DOCUMENT
// ---------------------------------------------------------------------------

export type ContentBlock =
  | TargetBlock | AsteroidThreadBlock | ProseBlock | VocabBlock | WorkedExampleBlock
  | CalloutBlock | SentenceFrameBlock | DoodleBlock | LabNotebookBlock | SimEmbedBlock | EquationVisualizerBlock | LessonVocabBlock | ProcedureBlock
  | GewaBlock | EquationSandboxBlock | ExitTicketBlock | MarzanoBlock | QuestionBlock | DataTableBlock | SketchBlock
  | ObservationBlock | SelfAssessmentBlock | TransferPromptBlock
  | FigureBlock | DiagramBlock | GraphBlock | ConceptExerciseBlock;

export type BlockType = ContentBlock['type'];

export interface BlockDocument {
  schemaVersion: 1;
  dayType?: DayType;
  blocks: ContentBlock[];
}

/** Blocks that capture student data (drive the runtime/data-capture layer). */
export const CAPTURE_BLOCK_TYPES: BlockType[] = [
  'gewa', 'equation_sandbox', 'exit_ticket', 'marzano', 'question', 'data_table', 'observation', 'self_assessment', 'concept_exercise',
  'doodle', 'lab_notebook', 'sketch',
];

export function isCaptureBlock(b: ContentBlock): boolean {
  return (CAPTURE_BLOCK_TYPES as string[]).includes(b.type);
}

/** Does a saved response hold any real student input? (deep, ignores empty
 *  strings / arrays / objects). A blank autosave shouldn't count as "done". */
function hasContent(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  if (Array.isArray(v)) return v.some(hasContent);
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>).some(hasContent);
  return false;
}

/**
 * A capture block is COMPLETE only when the student has deliberately submitted
 * or saved real work — never from merely viewing or a background draft autosave.
 * This is the single source of truth for the per-block "done" chip, the lesson
 * progress bar, and the server-side lesson_progress rollup.
 *  - concept_exercise: complete only when `submitted === true` (drafts don't count).
 *  - everything else: complete when the saved response holds real content.
 */
export function isResponseComplete(blockType: string, response: unknown): boolean {
  if (response === undefined || response === null) return false;
  if (blockType === 'concept_exercise') {
    return typeof response === 'object' && (response as Record<string, unknown>).submitted === true;
  }
  return hasContent(response);
}

export function isBlockComplete(b: ContentBlock, response: unknown): boolean {
  if (!isCaptureBlock(b)) return false;
  return isResponseComplete(b.type, response);
}

/**
 * Paginate a lesson's blocks for the student viewer.
 *
 * Rule (chosen with the teacher): a save-required (capture) block anchors a
 * page, and any reference blocks that immediately precede it (target, prose,
 * figure, worked example, vocab, sim, diagram…) ride along on the SAME page so
 * the context and the task it sets up stay together. Reference blocks with no
 * following task (e.g. a closing summary) form a final reference-only page.
 *
 * Pure + deterministic so it can be unit-tested and reused by print/preview.
 */
export interface LessonPage {
  blocks: ContentBlock[];
  /** capture blocks on this page (the save-required work) */
  captureBlocks: ContentBlock[];
  /** does this page contain any save-required block? */
  hasCapture: boolean;
}

/**
 * Block types that ARE a visual (carry their own non-text element), so a page
 * containing one is never a text wall. Interactive sketch/data blocks count —
 * they render a canvas, plot, or figure.
 */
export const VISUAL_BLOCK_TYPES: BlockType[] = [
  'figure', 'diagram', 'graph', 'sim_embed', 'equation_visualizer',
  'doodle', 'lab_notebook', 'data_table', 'asteroid_thread', 'sketch',
];
export function isVisualBlock(b: ContentBlock): boolean {
  return (VISUAL_BLOCK_TYPES as string[]).includes(b.type)
    // a vocab term carrying an image, or a figure-bearing block, also counts
    || (b.type === 'figure');
}
/** Does a page already contain an inherent visual element? */
export function pageHasVisual(page: LessonPage): boolean {
  return page.blocks.some(isVisualBlock);
}

export function paginateBlocks(blocks: ContentBlock[]): LessonPage[] {
  const pages: LessonPage[] = [];
  let buffer: ContentBlock[] = [];
  for (const b of blocks) {
    buffer.push(b);
    // A capture block closes the current page — it and the reference blocks that
    // led up to it travel together.
    if (isCaptureBlock(b)) {
      const captureBlocks = buffer.filter(isCaptureBlock);
      pages.push({ blocks: buffer, captureBlocks, hasCapture: true });
      buffer = [];
    }
  }
  // Trailing reference-only blocks (no closing task): keep reference IN CONTEXT
  // by folding them onto the previous task page rather than stranding them on a
  // contextless page. Only when there's no prior page do they stand alone.
  if (buffer.length > 0) {
    if (pages.length > 0) {
      const last = pages[pages.length - 1];
      last.blocks = [...last.blocks, ...buffer];
    } else {
      pages.push({ blocks: buffer, captureBlocks: [], hasCapture: false });
    }
  }
  return pages;
}
