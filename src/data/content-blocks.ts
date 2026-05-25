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
  instruction: string;        // one-line framing
  prompts?: string[];         // explicit, numbered directions for what to draw (scaffolding)
  scaffoldSvg?: string;       // pre-drawn scaffold the student completes (faint background)
  imageUrl?: string;          // alternative raster scaffold
  palette?: string[];         // colors offered to the student (defaults provided)
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

export type DiagramKind = 'free_body' | 'vectors' | 'motion_map';
/** A direction is a compass word or an angle in degrees (CCW from +x). */
export type DiagramDir = 'up' | 'down' | 'left' | 'right' | number;
export interface DiagramForce { label: string; dir: DiagramDir; mag: number; color?: string }
export interface DiagramVector { label: string; angle: number; mag: number; color?: string }

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
}

// ---------------------------------------------------------------------------
// UNION + DOCUMENT
// ---------------------------------------------------------------------------

export type ContentBlock =
  | TargetBlock | AsteroidThreadBlock | ProseBlock | VocabBlock | WorkedExampleBlock
  | CalloutBlock | SentenceFrameBlock | DoodleBlock | SimEmbedBlock | EquationVisualizerBlock | LessonVocabBlock
  | GewaBlock | EquationSandboxBlock | ExitTicketBlock | MarzanoBlock | QuestionBlock | DataTableBlock
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
];

export function isCaptureBlock(b: ContentBlock): boolean {
  return (CAPTURE_BLOCK_TYPES as string[]).includes(b.type);
}
