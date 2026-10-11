"use client";
import SimLab from "@/components/simulations/lab/SimLab";
import { freeBodyDiagramDef } from "./def";
import type { ForceDiagramEngine } from "./engine";
export default function FreeBodyDiagramPage() {
  return (
    <SimLab
      def={freeBodyDiagramDef}
      renderTools={(engine) => {
        const model = engine as ForceDiagramEngine | null;
        return (
          <section className="border-t p-4" aria-label="Individual forces">
            <h2 className="mb-3 text-sm font-semibold">
              Set each force precisely
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              0° points right; 90° points up. Use Add force in the controls to
              include another force.
            </p>
            <div className="space-y-3">
              {model?.getForces().map((f, i) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-end gap-3 rounded border p-3"
                >
                  <span
                    className="min-w-28 text-xs font-semibold"
                    style={{ color: f.color }}
                  >
                    {i + 1}. {f.name}
                  </span>
                  <label className="text-xs">
                    Magnitude (N)
                    <input
                      aria-label={f.name + " " + (i + 1) + " magnitude"}
                      className="mt-1 block min-h-11 w-24 rounded border bg-background p-2"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={Number(f.magnitude.toFixed(1))}
                      onChange={(e) =>
                        model.setForce(f.id, {
                          magnitude: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="text-xs">
                    Angle (°)
                    <input
                      aria-label={f.name + " " + (i + 1) + " angle"}
                      className="mt-1 block min-h-11 w-24 rounded border bg-background p-2"
                      type="number"
                      step={1}
                      value={Number(f.angle.toFixed(1))}
                      onChange={(e) =>
                        model.setForce(f.id, { angle: Number(e.target.value) })
                      }
                    />
                  </label>
                  <button
                    className="min-h-11 px-3 text-xs text-muted-foreground underline"
                    aria-label={"Remove " + f.name + " " + (i + 1)}
                    onClick={() => model.removeForce(f.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      }}
    />
  );
}
