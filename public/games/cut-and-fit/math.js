(function (root) {
  'use strict';
  // Integer sixteenths keep every mark, allowance, and cut exact.
  const UNIT = 16;
  const trades = {
    carpentry: { name: 'Carpentry', material: 'Pine board', color: '#e9bb75' },
    plumbing: { name: 'Plumbing', material: 'Copper tube', color: '#eeac91' },
    electrical: { name: 'Electrical', material: 'Metal conduit', color: '#9fcee0' },
  };
  const jobs = [
    { id: 'c1', trade: 'carpentry', title: 'The utility shelf', level: 1, kind: 'clearance', span: 328, left: 4, right: 4, stock: 384, kerf: 2, quantity: 1,
      brief: 'Fit a shelf between two cabinet walls. Leave the specified clearance at BOTH ends.', reference: 'Clear opening', allowance: 'Clearance', skill: 'Allow for clearance' },
    { id: 'p1', trade: 'plumbing', title: 'Join the couplings', level: 1, kind: 'insertion', span: 200, left: 8, right: 8, stock: 288, kerf: 0, quantity: 1,
      brief: 'Bridge the gap between two fitting mouths. The tube must slide fully into BOTH sockets.', reference: 'Mouth-to-mouth gap', allowance: 'Socket depth', skill: 'Add insertion depths' },
    { id: 'e1', trade: 'electrical', title: 'Connect the boxes', level: 1, kind: 'insertion', span: 264, left: 8, right: 8, stock: 352, kerf: 1, quantity: 1,
      brief: 'Fit a straight conduit between two connector mouths. Seat each end to its marked stop.', reference: 'Mouth-to-mouth gap', allowance: 'Insertion depth', skill: 'Add insertion depths' },
    { id: 'c2', trade: 'carpentry', title: 'A rail between sides', level: 2, kind: 'deduction', span: 390, left: 12, right: 12, stock: 448, kerf: 2, quantity: 1,
      brief: 'Build a rail between two side panels. The drawing gives the OUTSIDE width, including both panels. The rail fits flush with no clearance.', reference: 'Outside width', allowance: 'Panel thickness', skill: 'Subtract occupied space' },
    { id: 'p2', trade: 'plumbing', title: 'Read the centerlines', level: 2, kind: 'deduction', span: 302, left: 20, right: 20, stock: 384, kerf: 0, quantity: 1,
      brief: 'Connect two elbows. Subtract each centerline-to-seat distance from the center-to-center span. These dimensions already include socket insertion.', reference: 'Center-to-center span', allowance: 'Centerline to seat', skill: 'Subtract occupied space' },
    { id: 'e2', trade: 'electrical', title: 'From box centers', level: 2, kind: 'deduction', span: 390, left: 24, right: 24, stock: 432, kerf: 1, quantity: 1,
      brief: 'The plan locates the box centers. Each conduit seat is inside that span. Subtract the supplied center-to-seat distances.', reference: 'Box center-to-center', allowance: 'Centerline to seat', skill: 'Subtract occupied space' },
    { id: 'c3', trade: 'carpentry', title: 'A little breathing room', level: 3, kind: 'clearance', span: 294, left: 1, right: 1, stock: 352, kerf: 2, quantity: 1,
      brief: 'Fit a shelf in a snug opening. Keep a small clearance at each end so it can slide into place.', reference: 'Clear opening', allowance: 'Clearance', skill: 'Allow for clearance' },
    { id: 'p3', trade: 'plumbing', title: 'Seat both ends', level: 3, kind: 'insertion', span: 231, left: 10, right: 10, stock: 320, kerf: 0, quantity: 1,
      brief: 'Join this pair of sockets. Count the visible gap AND the length hidden inside each fitting.', reference: 'Mouth-to-mouth gap', allowance: 'Socket depth', skill: 'Add insertion depths' },
    { id: 'e3', trade: 'electrical', title: 'Different connectors', level: 3, kind: 'insertion', span: 295, left: 8, right: 12, stock: 384, kerf: 1, quantity: 1,
      brief: 'These connectors have DIFFERENT insertion depths. Use the left and right dimensions separately.', reference: 'Mouth-to-mouth gap', allowance: 'Insertion depth', skill: 'Add insertion depths' },
    { id: 'c4', trade: 'carpentry', title: 'Two rails, one board', level: 4, kind: 'deduction', span: 358, left: 12, right: 12, stock: 768, kerf: 2, quantity: 2,
      brief: 'Make two identical rails between the same side panels. Reuse the remainder after your first cut. Each saw cut uses an extra 1/8 inch on the waste side.', reference: 'Outside width', allowance: 'Panel thickness', skill: 'Plan repeated cuts' },
    { id: 'p4', trade: 'plumbing', title: 'A matching pair', level: 4, kind: 'deduction', span: 324, left: 18, right: 14, stock: 768, kerf: 0, quantity: 2,
      brief: 'Make two identical links for matching assemblies. The two elbows have different centerline-to-seat distances. Reuse your remaining tube.', reference: 'Center-to-center span', allowance: 'Centerline to seat', skill: 'Plan repeated cuts' },
    { id: 'e4', trade: 'electrical', title: 'Twin conduit runs', level: 4, kind: 'deduction', span: 380, left: 22, right: 18, stock: 768, kerf: 1, quantity: 2,
      brief: 'Make two identical runs between matching pairs of boxes. Reuse the stock; each saw cut uses an extra 1/16 inch on the waste side.', reference: 'Box center-to-center', allowance: 'Centerline to seat', skill: 'Plan repeated cuts' },
  ];
  function format(ticks) {
    const sign = ticks < 0 ? '−' : '';
    ticks = Math.abs(ticks);
    const whole = Math.floor(ticks / UNIT);
    let n = ticks % UNIT, d = UNIT;
    if (!n) return sign + whole;
    while (n % 2 === 0) { n /= 2; d /= 2; }
    return sign + (whole ? whole + ' ' : '') + n + '/' + d;
  }
  function parse(value) {
    const s = String(value).trim();
    let inches;
    const fraction = s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
    if (fraction) {
      if (+fraction[3] === 0) return { error: 'A fraction needs a nonzero denominator.' };
      inches = +(fraction[1] || 0) + +fraction[2] / +fraction[3];
    } else if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) inches = Number(s);
    else return { error: 'Enter inches as a number, fraction, or mixed number, such as 18 1/4 or 18.25.' };
    if (!Number.isFinite(inches) || inches <= 0 || inches > 96) return { error: 'Enter a length greater than 0 and no more than 96 inches.' };
    const ticks = inches * UNIT;
    if (Math.abs(ticks - Math.round(ticks)) > 1e-7) return { error: 'This ruler marks sixteenths. Use an exact multiple of 1/16 inch; your entry has not been rounded.' };
    return { ticks: Math.round(ticks) };
  }
  const target = job => job.span + (job.kind === 'insertion' ? 1 : -1) * (job.left + job.right);
  const equation = job => `${format(job.span)} ${job.kind === 'insertion' ? '+' : '−'} ${format(job.left)} ${job.kind === 'insertion' ? '+' : '−'} ${format(job.right)} = ${format(target(job))} in`;
  function cut(available, mark, kerf) {
    if (![available, mark, kerf].every(Number.isInteger) || available <= 0 || mark <= 0 || kerf < 0 || mark > available) return { error: 'The marked length must fit on the available stock.' };
    if (mark === available) return { piece: mark, remainder: 0, loss: 0 }; // Use an existing end: no saw cut.
    if (mark + kerf > available) return { error: 'Leave room for the cut on the waste side, or use the full existing length.' };
    return { piece: mark, remainder: available - mark - kerf, loss: kerf };
  }
  function inspect(job, piece) {
    const difference = piece - target(job);
    return { difference, fit: difference === 0 ? 'fit' : difference > 0 ? 'long' : 'short' };
  }
  function makeSet(trade = 'all', variation = 0) {
    // Shift only the reference span, by quarter inches; preserve each job's skill and precision.
    const shift = (Math.abs(Math.trunc(variation)) % 5) * 4;
    return jobs.filter(job => trade === 'all' || job.trade === trade).map(job => ({ ...job, span: job.span + shift }));
  }
  const api = { UNIT, trades, jobs, format, parse, target, equation, cut, inspect, makeSet };
  if (typeof module !== 'undefined') module.exports = api;
  root.CutFitMath = api;
})(typeof window === 'undefined' ? globalThis : window);
