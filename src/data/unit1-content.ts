/**
 * Unit 1 — Motion & Forces (Asteroid 2026-XJ) — AUTHORED CONTENT
 * Source of truth for Unit 1. Verbatim "I can…" statements from the Unit 1 packet.
 * K/R/S/P classification confirmed by Craig 2026-05-21.
 *
 * Distribution (growth-tree targets): Knowledge ×2, Reasoning ×11, Skill ×5, Product ×0.
 * (Product lives in the mastery task, which sits on its own instrument — see spec §3.4.)
 *
 * standardRefs are populated only where the NGSS code is unambiguous; the
 * authoritative mapping lives in the repo's physics-standards.ts. TODO: complete.
 */
import type { LearningTarget, Unit, MasteryTask } from "./curriculum-types";

export const UNIT1_ID = "unit-1";

export const unit1Targets: LearningTarget[] = [
  {
    id: "u1.anchor-know-unknow",
    statement:
      "I can describe what we currently know and don't know about 2026-XJ, and identify what physics tools I would need to learn more.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.vocab-position-distance-displacement",
    statement:
      "I can use precise vocabulary (position, distance, displacement) to describe motion, and I can tell the difference between scalar and vector quantities.",
    domain: "knowledge",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.capture-pt-graph",
    statement:
      "I can capture a position–time graph with a Vernier motion detector and explain what its slope tells me about velocity.",
    domain: "skill",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.read-vt-graph-components",
    statement:
      "I can read a velocity-time graph and break a 2-D velocity into its toward-Earth and perpendicular components.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.predict-position-uncertainty",
    statement:
      "I can use velocity and time to predict an object's future position, and I can express uncertainty in a prediction.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.vectors-tip-to-tail",
    statement:
      "I can add two vectors tip-to-tail and break a vector into components with simple trig.",
    domain: "skill",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.acceleration-rate-of-change",
    statement:
      "I can define acceleration as the rate of change of velocity and calculate it from velocity-time data.",
    domain: "reasoning", // #7 — confirmed Reasoning: the load-bearing demand is rate-of-change, not arithmetic
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.pick-equation-of-motion",
    statement:
      "I can pick and use the right equation of motion for a constant-acceleration problem.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "motion-kinematics",
  },
  {
    id: "u1.newtons-first-law-inertia",
    statement:
      "I can explain Newton's 1st Law in my own words and find everyday examples of inertia.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
  },
  {
    id: "u1.identify-forces",
    statement:
      "I can identify the types of force in a scenario (gravity, normal, friction, applied, tension) and draw them as arrows.",
    domain: "knowledge",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
  },
  {
    id: "u1.lab-accel-vs-mass",
    statement:
      "I can measure how acceleration changes when I change mass at constant force.",
    domain: "skill",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
    standardRefs: ["HS-PS2-1"],
  },
  {
    id: "u1.lab-accel-vs-force",
    statement:
      "I can measure how acceleration changes when I change the force at constant mass — and combine it with Day 11 to get F = ma.",
    domain: "skill",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
    standardRefs: ["HS-PS2-1"],
  },
  {
    id: "u1.fma-solve-net-force",
    statement:
      "I can use F = ma to solve problems — always finding the NET force first.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
    standardRefs: ["HS-PS2-1"],
  },
  {
    id: "u1.third-law-pairs",
    statement:
      "I can identify Newton's 3rd Law force pairs and explain why they don't cancel.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
  },
  {
    id: "u1.draw-fbd",
    statement:
      "I can draw a free body diagram showing all forces on one object, with arrows sized to the forces.",
    domain: "skill",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
  },
  {
    id: "u1.net-force-from-fbd",
    statement:
      "I can find the net force on an object from its FBD and use it to find acceleration.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
    standardRefs: ["HS-PS2-1"],
  },
  {
    id: "u1.friction-static-kinetic",
    statement:
      "I can explain friction as a force that depends on the surfaces and the normal force, and tell static from kinetic friction.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
  },
  {
    id: "u1.equilibrium-find-unknown",
    statement:
      "I can recognize when ΣF = 0 and use that to find an unknown force.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    contentStrand: "forces-dynamics",
  },
  {
    id: "u1.workshop-self-diagnose",
    statement:
      "I can find my own weak spots from Unit 1 and work to fix them before the transfer task.",
    domain: "reasoning",
    unitId: UNIT1_ID,
    excludeFromGrowth: true, // metacognitive workshop target — not a content mastery record
  },
];

export const unit1MasteryTask: MasteryTask = {
  id: "u1.mastery-task",
  unitId: UNIT1_ID,
  prompt:
    "Apply all of Unit 1's tools — vectors, F = ma, FBDs, equilibrium — to asteroid 2026-XJ in one integrated, public-facing analysis.",
  rubric: {
    science: { description: "Correct physics: vectors, kinematics, units." },
    reasoning: { description: "Sound method; uncertainty explained, not just stated." },
    communication: { description: "Work shown, units labeled, organized, readable." },
    transfer: { description: "Honest public-facing connection to 2026-XJ." },
  },
};

export const unit1: Unit = {
  id: UNIT1_ID,
  name: "Unit 1 — Motion & Forces (Asteroid 2026-XJ)",
  orderIndex: 1,
  targetIds: unit1Targets.map((t) => t.id),
  masteryTaskId: unit1MasteryTask.id,
};
