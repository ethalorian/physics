(function (root) {
  'use strict';
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  function fraction(n, d) {
    if (!n) return '0';
    const g = gcd(n, d);
    return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
  }
  function mixed(ticks, d) {
    const w = Math.floor(ticks / d), n = ticks % d;
    return n ? (w ? `${w} ` : '') + fraction(n, d) : String(w);
  }
  function parse(value) {
    const s = value.trim();
    let m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[3] ? +m[1] + +m[2] / +m[3] : NaN;
    m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[2] ? +m[1] / +m[2] : NaN;
    return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) ? Number(s) : NaN;
  }
  const tools = {
    'inch-2': { d: 2, unit: 'in', name: 'Tape · halves', family: 'fraction' },
    'inch-4': { d: 4, unit: 'in', name: 'Tape · quarters', family: 'fraction' },
    'inch-8': { d: 8, unit: 'in', name: 'Tape · eighths', family: 'fraction' },
    'inch-16': { d: 16, unit: 'in', name: 'Tape · sixteenths', family: 'fraction' },
    'inch-32': { d: 32, unit: 'in', name: 'Rule · thirty-seconds', family: 'fraction' },
    'decimal': { d: 10, unit: 'in', name: 'Decimal inch rule', family: 'decimal' },
    'metric': { d: 10, unit: 'cm', name: 'Metric rule', family: 'metric' },
  };
  const skills = {
    scale: 'Graduations', locate: 'Find & mark', setup: 'Zero alignment',
    read: 'Read a length', equivalent: 'Equivalent values', offset: 'Nonzero starts',
  };
  const sequence = ['scale', 'locate', 'setup', 'equivalent', 'read', 'mark', 'offset', 'locate', 'read', 'offset'];
  function tickLevel(i, d) {
    if (i % d === 0) return 1;
    if (d === 10) return i % 5 === 0 ? 2 : 10;
    for (const level of [2, 4, 8, 16, 32]) if (d >= level && i % (d / level) === 0) return level;
    return d;
  }
  const tickHeight = (i, d) => ({ 1: 55, 2: 41, 4: 31, 8: 23, 10: 21, 16: 16, 32: 10 })[tickLevel(i, d)];
  const skillFor = type => type === 'mark' ? 'locate' : type;
  function makeJob(toolKey, type, index = 0, random = Math.random) {
    const tool = tools[toolKey], d = tool.d;
    // Vary whole inches and tick families; equivalent-value jobs deliberately use a reducible half.
    const n = type === 'equivalent' ? d / 2 : 1 + Math.floor(random() * (d - 1));
    const whole = type === 'locate' || type === 'equivalent' || type === 'scale' ? 0 : 1 + Math.floor(random() * 3);
    const lengthTicks = whole * d + n;
    const startTicks = type === 'offset' ? (index % 2 ? d + d / 2 : d) : 0;
    return { ...tool, toolKey, type, skill: skillFor(type), index, n, whole, lengthTicks, startTicks,
      endTicks: startTicks + lengthTicks, value: lengthTicks / d,
      unitOut: tool.unit === 'cm' && index % 2 ? 'mm' : tool.unit };
  }
  function expected(job) {
    if (job.type === 'scale') return job.unitOut === 'mm' ? 10 / job.d : 1 / job.d;
    if (job.type === 'equivalent') return job.unit === 'cm' ? job.value * 10 : job.value;
    return job.unitOut === 'mm' ? job.value * 10 : job.value;
  }
  function nearestTick(value, d) { return Math.round(value * d); }
  const api = { gcd, fraction, mixed, parse, tools, skills, sequence, tickLevel, tickHeight, skillFor, makeJob, expected, nearestTick };
  if (typeof module !== 'undefined') module.exports = api;
  root.TapeMath = api;
})(typeof window === 'undefined' ? globalThis : window);
