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
// UNION + DOCUMENT
// ---------------------------------------------------------------------------

export type ContentBlock =
  | TargetBlock | AsteroidThreadBlock | ProseBlock | VocabBlock | WorkedExampleBlock
  | CalloutBlock | SentenceFrameBlock | DoodleBlock | SimEmbedBlock
  | GewaBlock | ExitTicketBlock | MarzanoBlock | QuestionBlock | DataTableBlock
  | ObservationBlock | SelfAssessmentBlock | TransferPromptBlock;

export type BlockType = ContentBlock['type'];

export interface BlockDocument {
  schemaVersion: 1;
  dayType?: DayType;
  blocks: ContentBlock[];
}

/** Blocks that capture student data (drive the runtime/data-capture layer). */
export const CAPTURE_BLOCK_TYPES: BlockType[] = [
  'gewa', 'exit_ticket', 'marzano', 'question', 'data_table', 'observation', 'self_assessment',
];

export function isCaptureBlock(b: ContentBlock): boolean {
  return (CAPTURE_BLOCK_TYPES as string[]).includes(b.type);
}
