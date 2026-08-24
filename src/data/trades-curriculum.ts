/**
 * TRADES PHYSICS — content layer.
 * GENERATED from the year map. Do not hand-edit; regenerate instead.
 *
 * Scoping: every row here carries program "trades". The physics course is
 * program "physics". Nothing in this file may be pulled into a physics
 * growth-tree query — see `program` on units / learning_targets.
 */
import type { ContentStrand, Domain, RubricDimension } from "./curriculum-types";

export const TRADES_PROGRAM = "trades" as const;

/**
 * The four trades strands. DERIVED from the ContentStrand registry rather than
 * re-declared, so removing one there breaks the build here instead of silently
 * letting the two lists drift.
 */
export type TradesStrand = Extract<
  ContentStrand,
  "metrology" | "plan-reading" | "trade-math" | "physics-model"
>;

export interface TradesUnit {
  id: string;
  name: string;
  orderIndex: number;
  blurb: string;
  /** "written" = packets exist. "mapped" = targets authored, materials not. */
  status: "written" | "mapped";
}

export interface TradesTarget {
  slug: string;
  statement: string;
  domain: Domain;
  unitId: string;
  contentStrand: TradesStrand;
  standardRefs: string[];
  orderIndex: number;
  /** Pedagogy only — a target still belongs to exactly ONE unit. */
  revisitedIn: string[];
}

export interface TradesMasteryTask {
  slug: string;
  unitId: string;
  prompt: string;
  rubric: Record<RubricDimension, string>;
}

export const TRADES_UNITS: TradesUnit[] = [
  {
    id: "trades-1",
    name: "Unit 1: Length & Tolerance — The Fieldhouse Wall",
    orderIndex: 1,
    blurb: "Measure it. Draw it. What the number on the material actually means.",
    status: "written"
  },
  {
    id: "trades-2",
    name: "Unit 2: Plumb, Level, Square, Slope",
    orderIndex: 2,
    blurb: "Gravity gives you one reference line free. Square you have to build.",
    status: "written"
  },
  {
    id: "trades-3",
    name: "Unit 3: Load",
    orderIndex: 3,
    blurb: "Live load, dead load, and where a hole does least harm.",
    status: "mapped"
  },
  {
    id: "trades-4",
    name: "Unit 4: Pressure",
    orderIndex: 4,
    blurb: "Flow = difference divided by resistance. Open systems and closed ones.",
    status: "mapped"
  },
  {
    id: "trades-5",
    name: "Unit 5: Heat",
    orderIndex: 5,
    blurb: "R-value, thermal bridging, and which side of the insulation a pipe goes on.",
    status: "mapped"
  },
  {
    id: "trades-6",
    name: "Unit 6: Electrical",
    orderIndex: 6,
    blurb: "Voltage drop, bonding, and why the wire gets fatter as the run gets longer.",
    status: "mapped"
  },
];

export const TRADES_TARGETS: TradesTarget[] = [
  {
    slug: "tr.u1.read-rule",
    statement: "Read a tape or rule to 1/16 and 1/32 and write it correctly.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 1,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u1.check-inst",
    statement: "Check an instrument before trusting it — zero it, test it, inspect it.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 2,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u1.choose-inst",
    statement: "Choose the instrument the job's precision actually needs.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 3,
    revisitedIn: ["trades-3", "trades-4", "trades-6"]
  },
  {
    slug: "tr.u1.repeat",
    statement: "Measure repeatedly, describe the spread, separate the tool from yourself.",
    domain: "reasoning",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: ["HS-ETS1-6(MA)"],
    orderIndex: 4,
    revisitedIn: ["trades-2", "trades-3", "trades-5"]
  },
  {
    slug: "tr.u1.tolerance",
    statement: "Compare a measurement to a spec, decide in or out, say by how much.",
    domain: "reasoning",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: ["HS-ETS1-6(MA)"],
    orderIndex: 5,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-6"]
  },
  {
    slug: "tr.u1.nominal",
    statement: "State the actual size of a 2×4, a 1/2\" pipe, a 12-gauge wire.",
    domain: "knowledge",
    unitId: "trades-1",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS2-4(MA)"],
    orderIndex: 6,
    revisitedIn: ["trades-3", "trades-4", "trades-6"]
  },
  {
    slug: "tr.u1.vocab",
    statement: "Use nominal, actual, tolerance and deviation correctly.",
    domain: "knowledge",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 7,
    revisitedIn: ["trades-2"]
  },
  {
    slug: "tr.u1.fits",
    statement: "Work out whether a nominal material fits a nominal space.",
    domain: "reasoning",
    unitId: "trades-1",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS1-3"],
    orderIndex: 8,
    revisitedIn: ["trades-3", "trades-4"]
  },
  {
    slug: "tr.u1.gauge",
    statement: "Bigger gauge number = thinner wire. Three steps double the area.",
    domain: "reasoning",
    unitId: "trades-1",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS2-4(MA)"],
    orderIndex: 9,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u1.datum",
    statement: "Lay out a repeated spacing from one datum and land the last mark.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 10,
    revisitedIn: ["trades-2", "trades-3"]
  },
  {
    slug: "tr.u1.cumul",
    statement: "Why measuring from the last mark piles error up and a datum does not.",
    domain: "reasoning",
    unitId: "trades-1",
    contentStrand: "trade-math",
    standardRefs: [],
    orderIndex: 11,
    revisitedIn: ["trades-2"]
  },
  {
    slug: "tr.u1.sixteen",
    statement: "Why framing is 16 on center, and why it is measured to centers.",
    domain: "reasoning",
    unitId: "trades-1",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 12,
    revisitedIn: ["trades-3"]
  },
  {
    slug: "tr.u1.sketch",
    statement: "Make a freehand field sketch with the proportions right.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "plan-reading",
    standardRefs: [],
    orderIndex: 13,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u1.dimension",
    statement: "Dimension a drawing to convention — outside the object, once each.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-5(MA)"],
    orderIndex: 14,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u1.scale",
    statement: "Draw to a stated scale, and check somebody else's with a rule.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-5(MA)"],
    orderIndex: 15,
    revisitedIn: ["trades-2", "trades-3", "trades-5"]
  },
  {
    slug: "tr.u1.views",
    statement: "Produce three orthographic views that line up.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-5(MA)"],
    orderIndex: 16,
    revisitedIn: ["trades-3", "trades-5"]
  },
  {
    slug: "tr.u1.asbuilt",
    statement: "Draw what is actually there, not what the print said.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-6(MA)"],
    orderIndex: 17,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u1.the-walk",
    statement: "Walk a job before you price it — write what it has to do, what you are stuck with, and what code already decided.",
    domain: "skill",
    unitId: "trades-1",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-1", "HS-ETS1-3"],
    orderIndex: 18,
    revisitedIn: ["trades-2", "trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u2.plumb-level",
    statement: "Establish plumb and level with a bob, a spirit level and a water level.",
    domain: "skill",
    unitId: "trades-2",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 1,
    revisitedIn: ["trades-3", "trades-4"]
  },
  {
    slug: "tr.u2.level-check",
    statement: "Check a level for calibration by reversing it end for end.",
    domain: "skill",
    unitId: "trades-2",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 2,
    revisitedIn: []
  },
  {
    slug: "tr.u2.square-check",
    statement: "Check a rectangle for square by measuring both diagonals.",
    domain: "skill",
    unitId: "trades-2",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 3,
    revisitedIn: ["trades-3"]
  },
  {
    slug: "tr.u2.slope-set",
    statement: "Set and check a slope in inches per foot.",
    domain: "skill",
    unitId: "trades-2",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 4,
    revisitedIn: ["trades-4"]
  },
  {
    slug: "tr.u2.gravity-ref",
    statement: "Name the one reference line gravity gives you free, and the instrument for each form of it.",
    domain: "knowledge",
    unitId: "trades-2",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 5,
    revisitedIn: ["trades-3"]
  },
  {
    slug: "tr.u2.bubble",
    statement: "Why a bubble finds level — and why a laser can be wrong when a plumb bob cannot.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 6,
    revisitedIn: []
  },
  {
    slug: "tr.u2.racking",
    statement: "Why a rectangle racks and a triangle does not.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-4(MA)"],
    orderIndex: 7,
    revisitedIn: ["trades-3"]
  },
  {
    slug: "tr.u2.slope-why",
    statement: "Why drain slope has a minimum and a maximum, and what fails at each end.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS1-3"],
    orderIndex: 8,
    revisitedIn: ["trades-4"]
  },
  {
    slug: "tr.u2.stair-why",
    statement: "Why the first and last riser are the ones that end up wrong.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 9,
    revisitedIn: []
  },
  {
    slug: "tr.u2.345",
    statement: "Use 3-4-5 to lay out a right angle, and explain why it works.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "trade-math",
    standardRefs: [],
    orderIndex: 10,
    revisitedIn: []
  },
  {
    slug: "tr.u2.rise-run",
    statement: "Read one ratio four ways — in/ft, roof pitch, percent grade, 1-in-12 — and convert between them.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "trade-math",
    standardRefs: [],
    orderIndex: 11,
    revisitedIn: ["trades-3", "trades-4", "trades-5"]
  },
  {
    slug: "tr.u2.fall-total",
    statement: "Work out total fall over a run, and what it costs you in depth.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS1-2"],
    orderIndex: 12,
    revisitedIn: ["trades-4"]
  },
  {
    slug: "tr.u2.plan-slope",
    statement: "Draw a plan with the fall called out correctly.",
    domain: "skill",
    unitId: "trades-2",
    contentStrand: "plan-reading",
    standardRefs: [],
    orderIndex: 13,
    revisitedIn: ["trades-4"]
  },
  {
    slug: "tr.u2.bay-conflict",
    statement: "Read a bay section, find the conflict, and say which service has to move and why.",
    domain: "reasoning",
    unitId: "trades-2",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS1-2", "HS-ETS1-3"],
    orderIndex: 14,
    revisitedIn: ["trades-3", "trades-4", "trades-5", "trades-6"]
  },
  {
    slug: "tr.u2.stair-sect",
    statement: "Draw a sloped run in section with both end elevations called out.",
    domain: "skill",
    unitId: "trades-2",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-5(MA)"],
    orderIndex: 15,
    revisitedIn: ["trades-3", "trades-4"]
  },
  {
    slug: "tr.u3.force-def",
    statement: "Define force, load and bearing, with units.",
    domain: "knowledge",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-3(MA)"],
    orderIndex: 1,
    revisitedIn: ["trades-4"]
  },
  {
    slug: "tr.u3.measure-force",
    statement: "Measure a force with a scale or a spring gauge.",
    domain: "skill",
    unitId: "trades-3",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 2,
    revisitedIn: []
  },
  {
    slug: "tr.u3.load-path",
    statement: "Trace a load path from the top of a wall to the ground.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-1(MA)", "HS-ETS3-3(MA)"],
    orderIndex: 3,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u3.depth-cubed",
    statement: "Why doubling a joist's depth stiffens it far more than doubling its width.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "trade-math",
    standardRefs: [],
    orderIndex: 4,
    revisitedIn: []
  },
  {
    slug: "tr.u3.notch-bore",
    statement: "Why a hole through the middle is safer than a notch at the bottom.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-4(MA)"],
    orderIndex: 5,
    revisitedIn: []
  },
  {
    slug: "tr.u3.bearing",
    statement: "Use P = F ÷ A to explain why a footing is wider than the wall.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 6,
    revisitedIn: ["trades-4"]
  },
  {
    slug: "tr.u3.torque",
    statement: "Why a terminal gets torqued to a spec instead of tight.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-4(MA)", "HS-ETS4-5"],
    orderIndex: 7,
    revisitedIn: ["trades-5", "trades-6"]
  },
  {
    slug: "tr.u3.section",
    statement: "Draw a section with load arrows on it.",
    domain: "skill",
    unitId: "trades-3",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-5(MA)"],
    orderIndex: 8,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u3.live-dead",
    statement: "Tell a dead load from a live load, and add them to get a total.",
    domain: "knowledge",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-3(MA)"],
    orderIndex: 9,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u3.forces-four",
    statement: "Name tension, compression, shear and torsion in a real assembly, and pick a material for each.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-4(MA)"],
    orderIndex: 10,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u3.machine-eff",
    statement: "Work out what a machine gives you and what it costs — and measure how much you lose.",
    domain: "reasoning",
    unitId: "trades-3",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS4-5"],
    orderIndex: 11,
    revisitedIn: []
  },
  {
    slug: "tr.u4.pressure-def",
    statement: "Define pressure and head, and convert psi to feet of head.",
    domain: "knowledge",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 1,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u4.read-gauge",
    statement: "Read a pressure gauge and a manometer.",
    domain: "skill",
    unitId: "trades-4",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 2,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u4.flow-model",
    statement: "Flow = difference ÷ resistance, and where it holds.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-1(MA)", "HS-ETS4-1(MA)", "HS-ETS4-2(MA)"],
    orderIndex: 3,
    revisitedIn: ["trades-5", "trades-6"]
  },
  {
    slug: "tr.u4.pipe-size",
    statement: "Why pipe size does more for flow than pressure does.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "trade-math",
    standardRefs: [],
    orderIndex: 4,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u4.hammer",
    statement: "Water hammer as moving water being stopped.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 5,
    revisitedIn: []
  },
  {
    slug: "tr.u4.trap-vent",
    statement: "Why a trap needs a vent.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS4-2(MA)"],
    orderIndex: 6,
    revisitedIn: []
  },
  {
    slug: "tr.u4.backdraft",
    statement: "How air sealing a house can backdraft a water heater.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-1(MA)"],
    orderIndex: 7,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u4.iso",
    statement: "Draw a simple piping isometric or riser.",
    domain: "skill",
    unitId: "trades-4",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS1-5(MA)"],
    orderIndex: 8,
    revisitedIn: []
  },
  {
    slug: "tr.u4.open-closed",
    statement: "Tell an open fluid system from a closed one, and say when each is the right choice.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS4-2(MA)"],
    orderIndex: 9,
    revisitedIn: ["trades-5"]
  },
  {
    slug: "tr.u4.hyd-pneu",
    statement: "Say why some tools run on air and some on oil, and what that costs each way.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS4-3(MA)"],
    orderIndex: 10,
    revisitedIn: []
  },
  {
    slug: "tr.u4.pascal",
    statement: "Use the ratio of piston areas to work out what a jack multiplies — and what it gives up.",
    domain: "reasoning",
    unitId: "trades-4",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS4-4(MA)"],
    orderIndex: 11,
    revisitedIn: []
  },
  {
    slug: "tr.u5.heat-def",
    statement: "Define temperature, heat and R-value.",
    domain: "knowledge",
    unitId: "trades-5",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS4-1(MA)"],
    orderIndex: 1,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u5.temp-rate",
    statement: "Measure a temperature difference and a rate of change.",
    domain: "skill",
    unitId: "trades-5",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 2,
    revisitedIn: []
  },
  {
    slug: "tr.u5.r-series",
    statement: "Add R-values in series across a real assembly.",
    domain: "reasoning",
    unitId: "trades-5",
    contentStrand: "trade-math",
    standardRefs: ["HS-ETS3-5(MA)"],
    orderIndex: 3,
    revisitedIn: []
  },
  {
    slug: "tr.u5.bridging",
    statement: "Thermal bridging — why studs show up on a thermal image.",
    domain: "reasoning",
    unitId: "trades-5",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-5(MA)"],
    orderIndex: 4,
    revisitedIn: []
  },
  {
    slug: "tr.u5.pipe-side",
    statement: "Which side of the insulation a cold pipe goes on, and why.",
    domain: "reasoning",
    unitId: "trades-5",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-5(MA)"],
    orderIndex: 5,
    revisitedIn: []
  },
  {
    slug: "tr.u5.hot-joint",
    statement: "Why a loose electrical connection is a heat problem.",
    domain: "reasoning",
    unitId: "trades-5",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 6,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u5.heat-modes",
    statement: "Name conduction, convection and radiation in a real building, and say which one a material is chosen against.",
    domain: "knowledge",
    unitId: "trades-5",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-5(MA)"],
    orderIndex: 7,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u5.wall-sect",
    statement: "Draw a wall section showing insulation and services.",
    domain: "skill",
    unitId: "trades-5",
    contentStrand: "plan-reading",
    standardRefs: ["HS-ETS3-5(MA)"],
    orderIndex: 8,
    revisitedIn: ["trades-6"]
  },
  {
    slug: "tr.u6.meter-set",
    statement: "Name what a multimeter measures and which setting to use.",
    domain: "knowledge",
    unitId: "trades-6",
    contentStrand: "metrology",
    standardRefs: ["HS-ETS4-1(MA)"],
    orderIndex: 1,
    revisitedIn: []
  },
  {
    slug: "tr.u6.meter-use",
    statement: "Measure volts, amps and ohms safely on a low-voltage circuit.",
    domain: "skill",
    unitId: "trades-6",
    contentStrand: "metrology",
    standardRefs: [],
    orderIndex: 2,
    revisitedIn: []
  },
  {
    slug: "tr.u6.vdrop",
    statement: "Voltage drop, and why the wire gets fatter as the run gets longer.",
    domain: "reasoning",
    unitId: "trades-6",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 3,
    revisitedIn: []
  },
  {
    slug: "tr.u6.gauge-r",
    statement: "Use the gauge/area rule to predict resistance.",
    domain: "reasoning",
    unitId: "trades-6",
    contentStrand: "trade-math",
    standardRefs: [],
    orderIndex: 4,
    revisitedIn: []
  },
  {
    slug: "tr.u6.series-par",
    statement: "Series and parallel, explained with the water model.",
    domain: "reasoning",
    unitId: "trades-6",
    contentStrand: "physics-model",
    standardRefs: ["HS-ETS3-1(MA)"],
    orderIndex: 5,
    revisitedIn: []
  },
  {
    slug: "tr.u6.bonding",
    statement: "What bonding does, and what breaks it.",
    domain: "reasoning",
    unitId: "trades-6",
    contentStrand: "physics-model",
    standardRefs: [],
    orderIndex: 6,
    revisitedIn: []
  },
  {
    slug: "tr.u6.oneline",
    statement: "Read and draw a simple one-line diagram.",
    domain: "skill",
    unitId: "trades-6",
    contentStrand: "plan-reading",
    standardRefs: [],
    orderIndex: 7,
    revisitedIn: []
  },
];

export const TRADES_MASTERY_TASKS: TradesMasteryTask[] = [
  {
    slug: "tr.u1.mastery-as-built",
    unitId: "trades-1",
    prompt: "You are handed a drawing of one bay of the fieldhouse wall and the services on it. Walk it first and write the scope. Then verify the drawing, decide what is in and what is out, write an inspection another tradesman could act on, and produce an as-built of the bay as it really is.",
    rubric: {
      science: "Measurements correct, instrument suited to the precision required, recorded to the right fraction. Nominal and actual sizes handled correctly.",
      reasoning: "In-and-out calls follow from the numbers actually taken. Uncertainty is stated as a number, not a feeling.",
      communication: "Another tradesman could build from the as-built without asking a single question. Scale stated, nominal materials named in a note.",
      transfer: "Holds up on a real job. Planted errors caught; the consequence of being out of tolerance is named."
    }
  },
  {
    slug: "tr.u2.mastery-route-the-fall",
    unitId: "trades-2",
    prompt: "You are given a bay section, a fixture, and the point where the drain has to connect. Walk a real bay first and write the scope. Then route it, prove the fall, and show what it costs the framing — or prove that it cannot be done as drawn and state exactly what has to change and by how much.",
    rubric: {
      science: "The fall arithmetic is right and the depths used are actual sizes, not nominal ones.",
      reasoning: "The resolution follows from the student's own numbers, and the easy wrong answer (reduce the fall) is rejected for a stated reason.",
      communication: "A tradesman could build from the plan and section without asking anything: fall called out, both end elevations dimensioned, bore located, scale stated.",
      transfer: "The student names what their decision costs another trade. 'It cannot be done as drawn' is fully correct when proved."
    }
  },
];

/** Sanity: one unit per target, unique slugs, standards only where real. */
export function assertTradesContentValid(): void {
  const seen = new Set<string>();
  for (const t of TRADES_TARGETS) {
    if (seen.has(t.slug)) throw new Error(`duplicate target slug: ${t.slug}`);
    seen.add(t.slug);
    if (!TRADES_UNITS.some((u) => u.id === t.unitId))
      throw new Error(`${t.slug} points at unknown unit ${t.unitId}`);
    if (t.revisitedIn.includes(t.unitId))
      throw new Error(`${t.slug} lists its own unit as a revisit`);
  }
  for (const m of TRADES_MASTERY_TASKS)
    if (!TRADES_UNITS.some((u) => u.id === m.unitId))
      throw new Error(`${m.slug} points at unknown unit ${m.unitId}`);
}
