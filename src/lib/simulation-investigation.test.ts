import test from "node:test";
import assert from "node:assert/strict";
import { SIMULATION_INVESTIGATIONS } from "@/data/simulation-investigations";
import {
  investigationDocument,
  investigationBlocks,
} from "./simulation-investigation-authoring";
import { validateBlockDocument } from "@/data/block-registry";
import { isBlockComplete } from "@/data/content-blocks";
import { filterDocumentForViewer } from "./track-visibility";
import { evidenceContext } from "./mastery-evidence";
import { routeMeasurements } from "@/app/simulations/distance-displacement/engine";
import { createConstantVelocityEngine } from "@/app/simulations/constant-velocity/engine";
import { createUAMEngine } from "@/app/simulations/uniformly-accelerated-motion/engine";
import { createCartCollisionsEngine } from "@/app/simulations/cart-collisions/engine";
import type { ParamValues } from "@/components/simulations/lab/contract";

test("all guided activities use valid, target-linked lesson evidence with private teacher guidance", () => {
  for (const a of SIMULATION_INVESTIGATIONS) {
    const doc = investigationDocument(a.slug)!;
    assert.deepEqual(validateBlockDocument(doc, true), [], a.slug);
    const captures = doc.blocks.filter((b) => "capture" in b && b.capture);
    assert.equal(captures.length, 4);
    assert.deepEqual(
      captures.map((b) => b.evidenceRole),
      ["diagnostic", "main", "main", "exit"],
    );
    for (const b of captures) {
      assert.equal(b.targetId, a.targetId);
      assert.ok(evidenceContext(b).targets.includes(a.targetId));
      assert.ok(b.note);
      assert.equal(b.xp, 5);
      assert.equal(b.requiredForCompletion, true);
    }
    const notebook = captures.find((b) => b.type === "lab_notebook")!;
    assert.equal(
      isBlockComplete(notebook, {
        fields: { [notebook.fields![0]]: "First trial" },
      }),
      false,
    );
    assert.equal(
      isBlockComplete(notebook, {
        fields: Object.fromEntries(
          notebook.fields!.map((f) => [f, "Measured evidence with units"]),
        ),
      }),
      true,
    );
    const student = filterDocumentForViewer(doc, {
      role: "student",
      track: "cpa",
    });
    assert.ok(student.blocks.every((b) => !b.note));
    assert.ok(!JSON.stringify(student).includes(a.teacherLookFors));
  }
});
test("optional and demonstration modes preserve teacher choice without fake evidence", () => {
  for (const a of SIMULATION_INVESTIGATIONS) {
    assert.ok(
      investigationBlocks(a.slug, "optional", "optional")
        .filter((b) => "capture" in b && b.capture)
        .every((b) => b.requiredForCompletion === false),
    );
    assert.ok(
      investigationBlocks(a.slug, "demo", "demonstration").every(
        (b) => !("capture" in b && b.capture),
      ),
    );
  }
  assert.equal(investigationDocument("unknown"), null);
});
test("route distances preserve endpoints and vector components", () => {
  assert.deepEqual(
    routeMeasurements([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 0 },
    ]),
    { distance: 8, dx: 0, dy: 0, displacement: 0 },
  );
  assert.deepEqual(
    routeMeasurements([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 4 },
    ]),
    { distance: 7, dx: 3, dy: 4, displacement: 5 },
  );
  assert.equal(
    routeMeasurements([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]).distance,
    5,
  );
});
const canvas = { width: 900, height: 400 } as HTMLCanvasElement,
  ctx = {} as CanvasRenderingContext2D;
Object.defineProperty(globalThis, "window", {
  value: { devicePixelRatio: 1 },
  configurable: true,
});
const advance = (
  engine: ReturnType<typeof createUAMEngine>,
  seconds: number,
) => {
  for (let i = 0; i < seconds * 120; i++) engine.step?.(1 / 120);
};
test("constant velocity data samples at exact seconds across direction changes", () => {
  const e = createConstantVelocityEngine(canvas, ctx, {
    speed: 1,
    direction: "forward",
  });
  e.start?.({});
  advance(e, 4);
  e.setParams({ direction: "stopped" });
  advance(e, 2);
  e.setParams({ direction: "backward" });
  advance(e, 4);
  assert.ok(Math.abs(Number(e.getReadouts().position)) < 1e-8);
  const data = e.getData!().rows;
  assert.equal(data.length, 11);
  assert.ok(Math.abs(Number(data[4][1]) - 4) < 1e-8);
  assert.ok(Math.abs(Number(data[6][1]) - 4) < 1e-8);
  assert.deepEqual(
    data.map((r) => r[0]),
    Array.from({ length: 11 }, (_, i) => i),
  );
});
test("negative acceleration passes through rest and reverses without duplicate samples", () => {
  const values = { v0: 4, a: -2 };
  const e = createUAMEngine(canvas, ctx, values);
  e.start?.(values);
  advance(e, 4);
  assert.ok(Math.abs(Number(e.getReadouts().velocity) + 4) < 1e-8);
  assert.ok(Math.abs(Number(e.getReadouts().position)) < 1e-8);
  assert.deepEqual(
    e.getData!().rows.map((r) => r[0]),
    [0, 1, 2, 3, 4],
  );
  advance(e, 20);
  assert.equal(e.getReadouts().time, 15);
});
test("collision evidence conserves momentum and keeps post-impact values at track edges", () => {
  for (const elasticity of [0, 0.5, 1]) {
    const values: ParamValues = {
      mass1: 2,
      mass2: 1,
      v1: 3,
      v2: -2,
      elasticity,
    };
    const e = createCartCollisionsEngine(canvas, ctx, values);
    e.start?.(values);
    advance(e, 9);
    const r = e.getReadouts();
    assert.ok(Math.abs(Number(r.pAfter) - 4) < 1e-8);
    if (elasticity === 1) assert.ok(Math.abs(Number(r.keAfter) - 11) < 1e-8);
    else assert.ok(Number(r.keAfter) < 11);
    assert.equal(e.isComplete?.(), true);
  }
});
