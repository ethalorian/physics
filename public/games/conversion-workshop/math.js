(function(root) {
  "use strict";
  const factors = [
    { id: "cm", a: 1, au: "m", b: 100, bu: "cm" },
    { id: "km", a: 1, au: "km", b: 1e3, bu: "m" },
    { id: "mass", a: 1, au: "kg", b: 1e3, bu: "g" },
    { id: "minute", a: 1, au: "min", b: 60, bu: "s" },
    { id: "hour", a: 1, au: "h", b: 3600, bu: "s" }
  ];
  const templates = [
    { skill: "Length", from: { cm: 1 }, to: { m: 1 }, values: [120, 250, 340, 475, 80], solution: [["cm", true]], ratio: 0.01 },
    { skill: "Length", from: { m: 1 }, to: { cm: 1 }, values: [1.2, 2.5, 0.45, 3.6, 1.75], solution: [["cm", false]], ratio: 100 },
    { skill: "Mass", from: { g: 1 }, to: { kg: 1 }, values: [1250, 450, 3200, 750, 2400], solution: [["mass", true]], ratio: 1e-3 },
    { skill: "Mass", from: { kg: 1 }, to: { g: 1 }, values: [1.5, 0.25, 3.2, 0.85, 2.4], solution: [["mass", false]], ratio: 1e3 },
    { skill: "Time", from: { min: 1 }, to: { s: 1 }, values: [2, 3.5, 4, 1.5, 2.25], solution: [["minute", false]], ratio: 60 },
    { skill: "Time", from: { s: 1 }, to: { min: 1 }, values: [90, 150, 240, 210, 45], solution: [["minute", true]], ratio: 1 / 60 },
    { skill: "Distance", from: { km: 1 }, to: { m: 1 }, values: [1.2, 0.8, 3.5, 0.25, 2.4], solution: [["km", false]], ratio: 1e3 },
    { skill: "Distance", from: { m: 1 }, to: { km: 1 }, values: [2500, 750, 1200, 4500, 600], solution: [["km", true]], ratio: 1e-3 },
    { skill: "Speed", from: { km: 1, h: -1 }, to: { m: 1, s: -1 }, values: [36, 54, 72, 90, 108], solution: [["km", false], ["hour", true]], ratio: 1 / 3.6 },
    { skill: "Speed", from: { m: 1, s: -1 }, to: { km: 1, h: -1 }, values: [5, 10, 15, 20, 25], solution: [["km", true], ["hour", false]], ratio: 3.6 },
    { skill: "Area", from: { m: 2 }, to: { cm: 2 }, values: [1, 2, 0.5, 1.5, 3], solution: [["cm", false], ["cm", false]], ratio: 1e4 },
    { skill: "Area", from: { cm: 2 }, to: { m: 2 }, values: [5e3, 12e3, 25e3, 7500, 3e4], solution: [["cm", true], ["cm", true]], ratio: 1e-4 }
  ];
  function make(index, random = Math.random) {
    const t = templates[index % templates.length];
    const value = t.values[Math.min(t.values.length - 1, Math.max(0, Math.floor(random() * t.values.length)))];
    return { ...t, value, answer: value * t.ratio };
  }
  function evaluate(value, from, chain) {
    const units = { ...from };
    for (const [id, forward] of chain) {
      const f = factors.find((f2) => f2.id === id);
      if (!f) throw Error("Unknown factor");
      const top = forward ? f.au : f.bu, bottom = forward ? f.bu : f.au;
      value *= forward ? f.a / f.b : f.b / f.a;
      units[top] = (units[top] || 0) + 1;
      units[bottom] = (units[bottom] || 0) - 1;
    }
    for (const u of Object.keys(units)) if (units[u] === 0) delete units[u];
    return { value, units };
  }
  function same(a, b) {
    return [.../* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => (a[k] || 0) === (b[k] || 0));
  }
  function label(u) {
    const p = (sign) => Object.entries(u).filter(([, n]) => n * sign > 0).map(([k, n]) => k + (Math.abs(n) === 1 ? "" : Math.abs(n) === 2 ? "\xB2" : `^${Math.abs(n)}`)).join("\xB7");
    return (p(1) || "1") + (p(-1) ? `/(${p(-1)})` : "");
  }
  function check(job, chain, input) {
    const result = evaluate(job.value, job.from, chain);
    if (!same(result.units, job.to)) return "units";
    if (String(input).trim() === "" || !Number.isFinite(Number(input))) return "empty";
    return Math.abs(Number(input) - job.answer) <= Math.max(1e-9, Math.abs(job.answer) * 1e-6) ? "correct" : "number";
  }
  const api = { factors, templates, make, evaluate, same, label, check };
  if (typeof module !== "undefined") module.exports = api;
  else root.Conversions = api;
})(globalThis);
