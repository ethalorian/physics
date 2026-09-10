(function(root) {
  "use strict";
  const units = { m: { d: [1, 0, 0], s: 1 }, cm: { d: [1, 0, 0], s: 0.01 }, km: { d: [1, 0, 0], s: 1e3 }, s: { d: [0, 1, 0], s: 1 }, min: { d: [0, 1, 0], s: 60 }, h: { d: [0, 1, 0], s: 3600 }, kg: { d: [0, 0, 1], s: 1 }, g: { d: [0, 0, 1], s: 1e-3 }, N: { d: [1, -2, 1], s: 1 } };
  const q = (value, u) => ({ value, u });
  const factors = [
    { id: "cm", top: q(1, { m: 1 }), bottom: q(100, { cm: 1 }), conversion: true },
    { id: "km", top: q(1e3, { m: 1 }), bottom: q(1, { km: 1 }), conversion: true },
    { id: "hour", top: q(3600, { s: 1 }), bottom: q(1, { h: 1 }), conversion: true },
    { id: "minute", top: q(60, { s: 1 }), bottom: q(1, { min: 1 }), conversion: true },
    { id: "mass", top: q(1, { kg: 1 }), bottom: q(1e3, { g: 1 }), conversion: true },
    { id: "newton", top: q(1, { N: 1 }), bottom: q(1, { kg: 1, m: 1, s: -2 }), conversion: true },
    { id: "time", top: q(3, { s: 1 }), bottom: q(1, {}), conversion: false },
    { id: "acceleration", top: q(3, { m: 1, s: -2 }), bottom: q(1, {}), conversion: false },
    { id: "volume", top: q(2, { m: 3 }), bottom: q(1, {}), conversion: false }
  ];
  function evaluate(start, chain) {
    let value = start.value;
    const u = { ...start.u };
    for (const item of chain) {
      const f = factors.find((f2) => f2.id === item.id);
      if (!f) throw Error("Unknown factor");
      const p = (item.flip ? -1 : 1) * (item.power || 1);
      value *= Math.pow(f.top.value / f.bottom.value, p);
      for (const [k, v] of Object.entries(f.top.u)) u[k] = (u[k] || 0) + v * p;
      for (const [k, v] of Object.entries(f.bottom.u)) u[k] = (u[k] || 0) - v * p;
    }
    for (const k of Object.keys(u)) if (!u[k]) delete u[k];
    return { value, u };
  }
  function same(a, b) {
    return [.../* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => (a[k] || 0) === (b[k] || 0));
  }
  function dimension(u) {
    const d = [0, 0, 0];
    for (const [k, p] of Object.entries(u)) {
      if (!units[k]) throw Error("Unknown unit");
      units[k].d.forEach((x, i) => d[i] += x * p);
    }
    return d;
  }
  function label(u) {
    const part = (sign) => Object.entries(u).filter(([, p]) => p * sign > 0).map(([k, p]) => k + (Math.abs(p) === 1 ? "" : Math.abs(p) === 2 ? "\xB2" : Math.abs(p) === 3 ? "\xB3" : `^${Math.abs(p)}`)).join("\xB7");
    const top = part(1) || "1", bottom = part(-1);
    return bottom ? `${top}/(${bottom})` : top;
  }
  const missions = [
    { title: "What does the unit tell you?", tag: "01 / Read a quantity", prompt: "A rover display reads 12 m/s. What does that measurement describe?", choices: ["Distance traveled", "Speed: 12 meters each second", "Acceleration: 12 meters per second each second"], correct: 1, explain: "Meters divided by seconds describes speed. The unit tells you the kind of quantity; the number tells you how much." },
    { title: "Bridge the gap", tag: "02 / Convert length", prompt: "A sensor reports a gap of 250 cm. The navigation system needs meters.", start: q(250, { cm: 1 }), target: q(2.5, { m: 1 }), allowed: ["cm", "km"], hint: "Place cm below the fraction bar to cancel the cm in 250 cm. 1 m and 100 cm are equal lengths.", explain: "250 cm \xD7 (1 m / 100 cm) = 2.5 m. The physical gap stays the same; the number changes with the unit.", scene: "Distance", max: 5 },
    { title: "Calibrate the rover", tag: "03 / Convert a rate", prompt: "The rover travels at 72 km/h. Convert its speed to m/s.", start: q(72, { km: 1, h: -1 }), target: q(20, { m: 1, s: -1 }), allowed: ["km", "hour", "minute"], hint: "Cancel km with meters per kilometer. Because h starts below the bar, put h on top of the time factor.", explain: "72 \xD7 1000 \xF7 3600 = 20 m/s. In one second, the rover travels 20 m.", scene: "Distance traveled in 1 s", max: 40 },
    { title: "Cover the solar panel", tag: "04 / Square units", prompt: "A panel has an area of 2 m\xB2. Express the area in cm\xB2.", start: q(2, { m: 2 }), target: q(2e4, { cm: 2 }), allowed: ["cm"], hint: "Each meter in m \xD7 m needs conversion. Flip the factor, then square it or add it twice.", explain: "2 m\xB2 \xD7 (100 cm / 1 m)\xB2 = 20,000 cm\xB2. One square meter contains 100 \xD7 100 square centimeters.", scene: "Area", max: 4e4 },
    { title: "Build a change in velocity", tag: "05 / Combine quantities", prompt: "Constant acceleration is 4 m/s\xB2 for 3 s. Build \u0394v = a \xD7 \u0394t. Find the change in velocity.", start: q(4, { m: 1, s: -2 }), target: q(12, { m: 1, s: -1 }), allowed: ["time"], hint: "Multiply acceleration by time. One factor of s cancels; the answer still has one s below the bar.", explain: "(4 m/s\xB2) \xD7 (3 s) = 12 m/s of velocity change. This is the final velocity only if the initial velocity is zero.", scene: "Velocity change", max: 24 },
    { title: "Set the net force", tag: "06 / Name a derived unit", prompt: "A 2 kg probe needs acceleration of 3 m/s\xB2. Build F = ma and express its net force in N.", start: q(2, { kg: 1 }), target: q(6, { N: 1 }), allowed: ["acceleration", "newton"], hint: "Multiply mass by acceleration. Then use 1 N = 1 kg\xB7m/s\xB2 to express the result in newtons.", explain: "2 kg \xD7 3 m/s\xB2 = 6 kg\xB7m/s\xB2 = 6 N. A newton is a name for this combination of base units.", scene: "Net force", max: 12 },
    { title: "Inspect the cargo", tag: "07 / Divide quantities", prompt: "A 6000 kg cargo fills 2 m\xB3. Build density = mass \xF7 volume, in kg/m\xB3.", start: q(6e3, { kg: 1 }), target: q(3e3, { kg: 1, m: -3 }), allowed: ["volume", "mass"], hint: "To divide by volume, flip the volume tile so 2 m\xB3 is below the fraction bar.", explain: "6000 kg \xF7 2 m\xB3 = 3000 kg/m\xB3. Each cubic meter contains 3000 kg for this uniform cargo.", scene: "Density", max: 6e3 },
    { title: "Can units prove an equation?", tag: "08 / Know the limit", prompt: "Both mv\xB2 and \xBDmv\xB2 have units kg\xB7m\xB2/s\xB2 (joules). Can dimensional analysis alone tell which is the kinetic-energy formula?", choices: ["Yes: only \xBDmv\xB2 has energy units", "No: units cannot determine the factor \xBD", "Yes: the larger answer is always correct"], correct: 1, explain: "Dimensional consistency is a necessary check, not proof. Both expressions have energy units. The work\u2013energy relationship supplies the factor \xBD." }
  ];
  const api = { units, factors, evaluate, same, dimension, label, missions };
  if (typeof module !== "undefined") module.exports = api;
  else root.UnitLab = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
