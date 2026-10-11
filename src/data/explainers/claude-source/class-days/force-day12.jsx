const W = 1920, H = 1080;
const INK = '#22233a', CORAL = '#c9573f', INDIGO = '#4b4ba8', TINT = '#e4e4f2', BG = '#f6f6fb', GREY = '#5a5b73';
const SAGE = '#3d7a55', SAGE_T = '#dcece2', CORAL_T = '#f7e1da', LINE = '#cfd0e6';
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SERIF = "'EB Garamond', Georgia, serif";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const D2R = Math.PI / 180;
const lerp = (a, b, e) => a + (b - a) * e;
const eo = (u) => Easing.easeOutCubic(clamp(u, 0, 1));
const eio = (u) => Easing.easeInOutCubic(clamp(u, 0, 1));
const env = (T, a, d = 0.6) => eo((T - a) / d);
const win = (T, a, b, d = 0.5) => env(T, a, d) * (1 - env(T, b, d));
const fmt = (v, n = 3) => (v < -0.0005 ? '−' : '') + Math.abs(v).toFixed(n);

// ---------- physics: two ramp runs (cart released from rest, caught at 1.0 m) ----------
const RUNS = [{ a: 0.62, tr: 1.2, th: 6, k: 0, c: INDIGO }, { a: 0.95, tr: 1.0, th: 9.5, k: 3, c: CORAL }];
RUNS.forEach((r) => { r.tc = r.tr + Math.sqrt(2 / r.a); r.vc = r.a * (r.tc - r.tr); });
const nz = (t, k) => 0.035 * Math.sin(t * 37.1 + k) + 0.025 * Math.sin(t * 91.7 + 2 * k);
function sample(r, t) {
  if (t <= r.tr) return { x: 0, v: nz(t, r.k) * 0.08, a: nz(t, r.k) * 0.8 };
  if (t <= r.tc) { const d = t - r.tr; return { x: 0.5 * r.a * d * d, v: r.a * d + nz(t, r.k) * 0.25, a: r.a + nz(t, r.k) * 2.2 }; }
  const d = t - r.tc;
  if (d < 0.1) return { x: 1 + r.vc * d * (1 - d / 0.2), v: r.vc * (1 - d / 0.1), a: -r.vc / 0.1 };
  return { x: 1 + r.vc * 0.05, v: nz(t, r.k) * 0.08, a: nz(t, r.k) * 0.8 };
}

// ---------- world layout ----------
const AX = 700, AY = 0, AW = 1500, AH = 940;           // app window (world centre, local size)
const RX = -1850, RY = -60, RPX = 760;                   // ramp start line (s = 0) and px per metre
const OVER = [-360, 20, 0.5];
const rampPt = (s, th) => [RX + s * RPX * Math.cos(th * D2R), RY + s * RPX * Math.sin(th * D2R)];
const PANELS = [
  { k: 'x', y: 150, label: 'Position', unit: 'm', min: -0.1, max: 1.2, ticks: [0, 0.4, 0.8, 1.2] },
  { k: 'v', y: 380, label: 'Velocity', unit: 'm/s', min: -0.2, max: 1.6, ticks: [0, 0.5, 1, 1.5] },
  { k: 'a', y: 610, label: 'Acceleration', unit: 'm/s²', min: -2, max: 2, ticks: [-2, -1, 0, 1, 2] },
];
const PH = 220, PL = 150, PR = 1420;
const PY = (p, v) => p.y + 12 + ((p.max - clamp(v, p.min, p.max)) / (p.max - p.min)) * (PH - 44);

// ---------- camera ----------
function camShots(C) {
  const o = (t, d, x, y, z, r = 0, dip = 0) => ({ t, d, x, y, z, r, dip });
  const app = [AX, 20, 1.02], rm = [-760, -200, 0.66], meter = [250, -300, 1.45];
  return [
    o(-1, 0, 0, -2600, 1.3, -3), o(C.Title, 6.8, 0, -2600, 1.05, 0),
    o(C.Kit, 1.6, 0, -1500, 0.4, 0, 0.2), o(C.Kit + 2.4, 1.4, -1800, -1500, 1.35, -2, 0.2), o(C.Kit + 4.0, 1.4, -600, -1500, 1.35, 2, 0.3),
    o(C.Kit + 8.8, 1.4, 600, -1500, 1.35, -1.5, 0.3), o(C.Kit + 13.4, 1.4, 1800, -1500, 1.35, 1.5, 0.3),
    o(C.Connect, 1.8, -1900, -190, 1.6, -2, 0.45), o(C.Connect + 8.2, 1.6, AX, -10, 1.05, 0, 0.3), o(C.Connect + 17.6, 1.0, AX, 0, 1.3),
    o(C.Connect + 23.2, 1.6, ...OVER),
    o(C.Zero, 1.4, ...meter), o(C.Zero + 3.4, 1.3, ...rm), o(C.Zero + 5.0, 1.0, ...meter), o(C.Zero + 12.4, 1.2, ...rm), o(C.Zero + 16.8, 1.0, ...meter),
    o(C.Settings, 1.3, AX, 120, 1.15),
    o(C.Collect, 1.4, ...OVER), o(C.Collect + 22.6, 1.3, ...app),
    o(C.Read, 1.2, AX, -210, 1.35), o(C.Read + 5.4, 1.1, AX, 20, 1.35), o(C.Read + 10.8, 1.1, AX, 250, 1.35), o(C.Read + 16.0, 1.3, ...app),
    o(C.Fit, 1.2, AX, 30, 1.3), o(C.Fit + 16.2, 1.2, AX, -200, 1.3),
    o(C.Tangent, 1.0, AX, -200, 1.3), o(C.Tangent + 10.6, 1.2, ...app),
    o(C.Runs, 1.4, ...OVER), o(C.Runs + 9.6, 1.3, AX, 30, 1.3),
    o(C.Views, 1.2, AX, 20, 1.02),
    o(C.Photogate, 1.9, -1100, 1750, 0.95, 0, 0.4), o(C.Photogate + 5.2, 1.1, -1480, 1750, 1.3, -1), o(C.Photogate + 10.3, 1.3, -700, 1750, 1.3, 1),
    o(C.Export, 1.9, 1100, 1750, 1.05, 0, 0.35),
    o(C.Trouble, 1.9, 0, 3050, 0.52, 0, 0.3), o(C.Trouble + 3.8, 1.2, -1200, 3050, 1.25, -1.5), o(C.Trouble + 10.2, 1.2, 0, 3050, 1.25, 1.5), o(C.Trouble + 17.2, 1.2, 1200, 3050, 1.25, -1),
    o(C.Wrap, 1.9, 0, 4300, 0.88, 0, 0.4), o(C.Wrap + 2, 9, 0, 4300, 0.93),
  ];
}
function camAt(T, shots) {
  let cur = shots[0];
  for (const s of shots) {
    if (T >= s.t + s.d) { cur = s; continue; }
    if (T >= s.t) {
      const u = eio((T - s.t) / s.d);
      const z = Math.exp(lerp(Math.log(cur.z), Math.log(s.z), u)) * (1 - s.dip * Math.sin(Math.PI * u));
      cur = { x: lerp(cur.x, s.x, u), y: lerp(cur.y, s.y, u), z, r: lerp(cur.r, s.r, u) };
    }
    break;
  }
  return { x: cur.x + 6 * Math.sin(T * 0.41), y: cur.y + 4 * Math.sin(T * 0.53 + 1), z: cur.z * (1 + 0.005 * Math.sin(T * 0.37)), r: cur.r + 0.15 * Math.sin(T * 0.29) };
}

// ---------- shared pieces ----------
function WorldGrid({ z, on }) {
  if (!on) return null;
  const minor = clamp((z - 0.3) / 0.5, 0, 1);
  const base = { position: 'absolute', left: -4200, top: -3800, width: 8400, height: 10000, pointerEvents: 'none' };
  return (
    <React.Fragment>
      <div style={{ ...base, opacity: minor, backgroundImage: `linear-gradient(to right, ${TINT} 1.5px, transparent 1.5px), linear-gradient(to bottom, ${TINT} 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }}></div>
      <div style={{ ...base, backgroundImage: 'linear-gradient(to right, #d3d4ea 2.5px, transparent 2.5px), linear-gradient(to bottom, #d3d4ea 2.5px, transparent 2.5px)', backgroundSize: '200px 200px' }}></div>
    </React.Fragment>
  );
}
const MARKS = Array.from({ length: 80 }, (_, i) => ({ x: -2600 + ((i * 733) % 5200), y: -2000 + ((i * 419) % 6800), k: i % 3, s: 0.6 + ((i * 7) % 5) / 6, ph: i * 1.7 }));
function Parallax({ cam, T }) {
  const f = 0.45;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px) scale(${Math.pow(cam.z, 0.6)}) rotate(${-cam.r * 0.5}deg) translate(${-cam.x * f}px, ${-cam.y * f}px)`, pointerEvents: 'none' }}>
      <svg width="1" height="1" style={{ overflow: 'visible' }}>
        {MARKS.map((m, i) => (
          <g key={i} transform={`translate(${(m.x + 18 * Math.sin(T * 0.3 + m.ph)).toFixed(1)} ${(m.y + 14 * Math.cos(T * 0.26 + m.ph)).toFixed(1)}) rotate(${(T * 12 + m.ph * 30).toFixed(1)}) scale(${m.s})`} opacity={0.3}>
            {m.k === 0 ? <path d="M -12 0 L 12 0 M 0 -12 L 0 12" stroke={INDIGO} strokeWidth={3} strokeLinecap="round" />
              : m.k === 1 ? <circle r={7} fill="none" stroke={CORAL} strokeWidth={3} />
              : <path d="M -9 -9 L 9 -9 L 9 9 L -9 9 Z" fill="none" stroke={INDIGO} strokeWidth={2.5} />}
          </g>
        ))}
      </svg>
    </div>
  );
}
function Reveal({ T, at, dur = 1.2, children, style = {} }) {
  const p = Easing.easeInOutSine(clamp((T - at) / dur, 0, 1));
  if (p <= 0) return null;
  return <div style={{ position: 'absolute', clipPath: `inset(-20% ${(1 - p) * 100 - 6 * p}% -20% -2%)`, whiteSpace: 'nowrap', ...style }}>{children}</div>;
}
function Card({ x, y, w, h, T, at, r = 0, ph = 0, children }) {
  const e = env(T, at, 0.8);
  if (e <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `translateY(${5 * Math.sin(T * 0.8 + ph)}px) rotate(${r}deg) scale(${0.94 + 0.06 * e})`, opacity: e, background: '#ffffff', border: `2px solid ${LINE}`, borderRadius: 8, boxShadow: '0 40px 80px rgba(34,35,58,0.10)' }}>
      {children}
    </div>
  );
}
function CardHead({ T, at, kicker, title, sub }) {
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: 60, top: 44, opacity: env(T, at), fontFamily: MONO, fontSize: 24, fontWeight: 600, letterSpacing: '0.12em', color: CORAL }}>{kicker}</div>
      <Reveal T={T} at={at + 0.2} dur={1.0} style={{ left: 58, top: 80, fontFamily: SERIF, fontSize: 64, lineHeight: 1.05, color: INK }}>{title}</Reveal>
      {sub && <div style={{ position: 'absolute', left: 60, top: 160, opacity: env(T, at + 0.8), fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: INDIGO }}>{sub}</div>}
    </React.Fragment>
  );
}
function Ripple({ T, at, x, y, c = CORAL, R = 60 }) {
  const u = (T - at) / 0.8;
  if (u <= 0 || u >= 1) return null;
  return <circle cx={x} cy={y} r={12 + R * eo(u)} fill="none" stroke={c} strokeWidth={4} opacity={1 - u} />;
}

// cart drawn in its own frame: contact point at (0,0), body above
function Cart({ x, y, th = 0, led = null, T = 0, o = 1, flag = false, s = 1 }) {
  const blink = Math.floor(T * 2.5) % 2 ? 1 : 0.25;
  const wheel = (cx) => (
    <g transform={`translate(${cx} -16)`}>
      <circle r={16} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
      <line x1={-10} y1={0} x2={10} y2={0} stroke={INK} strokeWidth={2} transform={`rotate(${(x / 16 / D2R) % 360})`} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${th}) scale(${s})`} opacity={o}>
      {flag && <rect x={-6} y={-150} width={12} height={84} fill={INK} />}
      <rect x={-92} y={-70} width={184} height={46} rx={10} fill={SAGE_T} stroke={INK} strokeWidth={3.5} />
      <rect x={-60} y={-60} width={82} height={24} rx={3} fill="#ffffff" stroke={INK} strokeWidth={2} />
      <text x={-19} y={-42} textAnchor="middle" fontFamily={MONO} fontSize={13} fontWeight={600} fill={INK}>0F1043A7</text>
      <circle cx={48} cy={-47} r={8} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
      {led && <circle cx={72} cy={-47} r={6} fill={led} opacity={blink} />}
      {!led && <circle cx={72} cy={-47} r={6} fill="none" stroke={GREY} strokeWidth={2} />}
      {wheel(-58)}{wheel(58)}
    </g>
  );
}

// ---------- math type: ^7 superscript, _x subscript, ₀ ² ----------
function toks(str) {
  const out = []; let i = 0, buf = '';
  const push = (t, s) => { if (buf) { out.push(['n', buf]); buf = ''; } out.push([t, s]); };
  while (i < str.length) {
    const ch = str[i];
    if (ch === '^') { let j = i + 1, s = ''; if (str[j] === '−' || str[j] === '-') { s += '−'; j++; } while (j < str.length && /\d/.test(str[j])) { s += str[j]; j++; } push('sup', s); i = j; continue; }
    if (ch === '_') { push('sub', str[i + 1]); i += 2; continue; }
    if (ch === '₀') { push('sub', '0'); i++; continue; }
    if (ch === '²') { push('sup', '2'); i++; continue; }
    buf += ch; i++;
  }
  if (buf) out.push(['n', buf]);
  return out;
}
function M(str) {
  return toks(str).map(([t, s], k) => t === 'n' ? <React.Fragment key={k}>{s}</React.Fragment>
    : <span key={k} style={{ fontSize: '0.62em', verticalAlign: t === 'sup' ? '0.55em' : '-0.25em', lineHeight: 0, fontStyle: /\d|−/.test(s) ? 'normal' : 'inherit' }}>{s}</span>);
}
function MS(str) {
  const out = []; let k = 0;
  for (const [t, s] of toks(str)) {
    if (t === 'n') { out.push(<tspan key={k++}>{s}</tspan>); continue; }
    const d = t === 'sup' ? -0.5 : 0.28;
    out.push(<tspan key={k++} fontSize="0.62em" fontStyle={/\d|−/.test(s) ? 'normal' : undefined} dy={d + 'em'}>{s}</tspan>);
    out.push(<tspan key={k++} dy={(-d * 0.62) + 'em'}>{'\u200b'}</tspan>);
  }
  return out;
}
const arrowD = (x1, y1, x2, y2, h = 18) => { const a = Math.atan2(y2 - y1, x2 - x1); return `M ${x1} ${y1} L ${x2} ${y2} M ${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`; };
const AST = [1, 0.82, 0.96, 0.74, 1, 0.86, 0.93, 0.78, 0.98, 0.8];
function Rock({ x, y, r = 22, spin = 0, o = 1 }) {
  const d = AST.map((k, i) => { const t = (i / AST.length) * Math.PI * 2; return (i ? 'L ' : 'M ') + (Math.cos(t) * k * r).toFixed(1) + ' ' + (Math.sin(t) * k * r).toFixed(1); }).join(' ') + ' Z';
  return <g transform={`translate(${x} ${y}) rotate(${spin})`} opacity={o}><path d={d} fill="#d7d8ea" stroke={INK} strokeWidth={3} strokeLinejoin="round" /><circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.18} fill="none" stroke={INK} strokeWidth={2} /></g>;
}
const Line = ({ T, at, top, left = 60, s, c = INK, size = 50, italic = true, mono = false }) => (
  <Reveal T={T} at={at} dur={1.0} style={{ left, top, fontFamily: mono ? MONO : SERIF, fontStyle: italic && !mono ? 'italic' : 'normal', fontWeight: mono ? 600 : 400, fontSize: size, color: c }}>{M(s)}</Reveal>
);
const Kicker = ({ T, at, top, left = 60, s, c = CORAL }) => <div style={{ position: 'absolute', left, top, opacity: env(T, at), fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', color: c }}>{s}</div>;

const ORDER = ['Title', 'Recap', 'Setup', 'Run', 'Data', 'Linear', 'Combine', 'Asteroid', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'DISCUSS', 'Yesterday we changed the mass. What should we change today, and what must stay the same?'],
  Setup: [2, 'PREDICT', 'As the hanging mass increases, what happens to the cart’s acceleration? Sketch your predicted a vs F graph.'],
  Run: [3, 'LAB', 'Run 4–5 hanging masses with the same cart. Record F = m × g and a (the v–t slope) for each.'],
  Data: [4, 'DISCUSS', 'What shape is your a vs F graph? What happens to a when F doubles?'],
  Asteroid: [5, 'DISCUSS', 'To change 2026-XJ’s velocity twice as much in the same time, what would a mission need to do?'],
  Exit: [6, 'EXIT TICKET', 'If you doubled the force but kept the mass the same, what would happen to the acceleration?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Setup: [2200, -1300], Run: [2200, 0], Data: [0, 0], Linear: [-2200, 0], Combine: [-2200, 1300], Asteroid: [0, 1300], Exit: [2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;

const HM = [10, 20, 30, 40, 50], FW = HM.map((g) => g / 1000 * 9.8), AC = [0.190, 0.379, 0.552, 0.728, 0.889];
const PC = [INDIGO, CORAL, SAGE, '#8a7bb8', INK];
function Axes({ x, y, w, h, xmax, ymax, xt, yt, xl, yl, o = 1, children }) {
  if (o <= 0) return null;
  const X = (v) => x + (v / xmax) * w, Y = (v) => y + h - (v / ymax) * h;
  return (
    <g opacity={o}>
      {xt.map((v) => <g key={'x' + v}><line x1={X(v)} y1={y} x2={X(v)} y2={y + h} stroke={TINT} strokeWidth={2} /><text x={X(v)} y={y + h + 40} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY}>{v}</text></g>)}
      {yt.map((v) => <g key={'y' + v}><line x1={x} y1={Y(v)} x2={x + w} y2={Y(v)} stroke={TINT} strokeWidth={2} /><text x={x - 14} y={Y(v) + 10} textAnchor="end" fontFamily={MONO} fontSize={28} fill={GREY}>{v}</text></g>)}
      <line x1={x} y1={y - 10} x2={x} y2={y + h} stroke={INK} strokeWidth={4} />
      <line x1={x} y1={y + h} x2={x + w + 10} y2={y + h} stroke={INK} strokeWidth={4} />
      <text x={x + w} y={y + h + 86} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>{MS(xl)}</text>
      <text x={x + 14} y={y + 8} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>{MS(yl)}</text>
      {children(X, Y)}
    </g>
  );
}
function Track({ x0, x1, y, o = 1 }) {
  return (
    <g opacity={o}>
      <rect x={x0} y={y} width={x1 - x0} height={18} rx={3} fill={TINT} stroke={INK} strokeWidth={3} />
      <rect x={x0 - 20} y={y + 18} width={x1 - x0 + 40} height={22} fill="#ffffff" stroke={INK} strokeWidth={3} />
    </g>
  );
}
function Detector({ x, y }) {
  return (
    <g>
      <rect x={x - 60} y={y - 120} width={90} height={100} rx={10} fill={SAGE_T} stroke={INK} strokeWidth={4} />
      <circle cx={x + 30} cy={y - 70} r={34} fill="#ffffff" stroke={INK} strokeWidth={4} />
      <circle cx={x + 30} cy={y - 70} r={18} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />
      <line x1={x - 15} y1={y - 20} x2={x - 15} y2={y + 40} stroke={INK} strokeWidth={6} />
    </g>
  );
}

function Hanger({ x, y, hy, n = 2, spin = 0 }) {
  return (
    <g>
      <path d={`M ${x - 60} ${y + 18} L ${x} ${y + 18} L ${x} ${y}`} fill="none" stroke={INK} strokeWidth={5} />
      <g transform={`translate(${x} ${y}) rotate(${spin})`}><circle r={30} fill="#ffffff" stroke={INK} strokeWidth={4} /><line x1={-22} y1={0} x2={22} y2={0} stroke={INK} strokeWidth={3} /><circle r={5} fill={INK} /></g>
      <line x1={x + 30} y1={y} x2={x + 30} y2={hy} stroke={GREY} strokeWidth={3} />
      {Array.from({ length: n }, (_, k) => <rect key={k} x={x + 8} y={hy + k * 14} width={44} height={14} rx={3} fill={CORAL_T} stroke={INK} strokeWidth={2.5} />)}
    </g>
  );
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 12 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Newton’s 2nd Law</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>vary the force</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: INDIGO }}>S4 · Measure how acceleration changes with force at constant mass.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const rc = C.Recap;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={rc + 0.3} top={44} s="RECAP · DAY 11" />
      <Big T={T} at={rc + 0.6} top={100} s="Same force, more mass → less acceleration." size={64} />
      <div style={{ position: 'absolute', left: 60, top: 220, opacity: env(T, rc + 2.4), padding: '8px 30px 14px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#eeeefa', fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, color: INDIGO }}>{M('a ∝ 1/m   (constant F)')}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track x0={160} x1={1300} y={560} o={env(T, rc + 4)} />
        <g opacity={env(T, rc + 4)}><Cart x={500} y={560} T={T} /></g>
        <Arr x1={600} y1={510} x2={600 + 120 + 60 * Math.max(0, Math.sin(T * 1.6))} y2={510} c={CORAL} w={9} h={22} o={env(T, rc + 5)} />
        <SV x={1340} y={540} s="F ?" c={CORAL} size={56} o={env(T, rc + 5)} />
      </svg>
      <Big T={T} at={rc + 6} top={680} s="Today: keep the mass the same, and change the force." size={58} c={INDIGO} italic />
    </Scene>
  );
}
function Setup({ T, C }) {
  const s = C.Setup, ty = 560, n = 1 + Math.floor(clamp((T - (s + 6)) / 1.2, 0, 4));
  return (
    <Scene n="Setup" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="ANSWER · CHANGE THE PULL, KEEP THE CART" c={SAGE} />
      <Big T={T} at={s + 0.6} top={92} s="Investigation 1.3: vary force at constant mass" size={60} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track x0={260} x1={1560} y={ty} o={env(T, s + 1.2)} />
        <g opacity={env(T, s + 1.2)}><Detector x={190} y={ty} /></g>
        <g opacity={env(T, s + 1.8)}>
          <Cart x={540} y={ty} T={T} />
          <line x1={636} y1={ty - 47} x2={1590} y2={ty - 47} stroke={GREY} strokeWidth={3} />
        </g>
        <g opacity={env(T, s + 2.4)}><Hanger x={1590} y={ty - 17} hy={740} n={n} /></g>
        <SV x={540} y={ty - 110} s="same cart, no added bars" c={SAGE} size={38} an="middle" o={env(T, s + 3.4)} />
        <SV x={1560} y={940} s={`hanging mass: ${n * 10} g`} c={CORAL} size={44} an="end" o={env(T, s + 6)} />
      </svg>
      <Big T={T} at={s + 9} top={760} w={1100} s="More hanging mass means a bigger pull on the cart." size={46} italic />
    </Scene>
  );
}
function Run({ T, C }) {
  const r = C.Run, td = clamp(T - (r + 8.4), 0, 2.2), a = AC[4];
  const v = (t) => (t < 0.3 ? 0 : a * (t - 0.3)), sx = (t) => (t < 0.3 ? 0 : 0.5 * a * (t - 0.3) ** 2);
  const cx = 200 + 600 * Math.min(1, sx(td) / 1.6), fit = eo((T - (r + 11.4)) / 1.0), n = Math.floor(td / 0.05);
  const G = { x: 1040, y: 360, w: 840, h: 420 };
  return (
    <Scene n="Run" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={r + 0.3} top={44} s="FINDING THE FORCE" />
      <Big T={T} at={r + 0.6} top={100} s="hanging weight:  F ≈ m × g" size={70} italic c={INDIGO} />
      <Big T={T} at={r + 3} top={200} s="50 g = 0.050 kg  →  F ≈ (0.050)(9.8) ≈ 0.49 N" size={54} />
      <Kicker T={T} at={r + 6.6} top={310} s="ONE TRIAL · CART 0.50 kg · F = 0.49 N" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track x0={120} x1={900} y={620} o={env(T, r + 6.6)} />
        <g opacity={env(T, r + 6.6)}><Detector x={70} y={620} /><Cart x={cx} y={620} T={T} s={0.8} /></g>
        <Axes x={G.x} y={G.y} w={G.w} h={G.h} xmax={2.5} ymax={2} xt={[0, 1, 2]} yt={[0, 1, 2]} xl="t (s)" yl="v (m/s)" o={env(T, r + 7)}>
          {(Xa, Ya) => (
            <g>
              {n > 0 && <path d={Array.from({ length: n + 1 }, (_, k) => { const t = k * 0.05; return (k ? 'L ' : 'M ') + Xa(t).toFixed(1) + ' ' + Ya(v(t) + 0.01 * Math.sin(t * 40)).toFixed(1); }).join(' ')} fill="none" stroke={INDIGO} strokeWidth={5} />}
              {fit > 0 && <line x1={Xa(0.3)} y1={Ya(0)} x2={Xa(0.3 + 1.9 * fit)} y2={Ya(a * 1.9 * fit)} stroke={INK} strokeWidth={3} strokeDasharray="12 8" />}
            </g>
          )}
        </Axes>
      </svg>
      <Big T={T} at={r + 12.6} top={890} left={1040} s="slope: a ≈ 0.89 m/s²" size={44} c={INDIGO} />
      <Big T={T} at={r + 14.4} top={760} left={60} w={880} s="Change the hanging mass, run again. Same cart every time." size={44} italic c={GREY} />
    </Scene>
  );
}
function Data({ T, C }) {
  const d = C.Data, G = { x: 1180, y: 260, w: 700, h: 520 };
  return (
    <Scene n="Data" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={d + 0.3} top={44} s="EXAMPLE CLASS DATA · SAME 0.50 kg CART" />
      <div style={{ position: 'absolute', left: 60, top: 120, width: 980, opacity: env(T, d + 0.6), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', fontFamily: SANS, fontSize: 32, fontWeight: 500, color: INK, padding: '12px 24px' }}>
          <div style={{ width: 340 }}>hanging mass (g)</div><div style={{ width: 300 }}>F = mg (N)</div><div>{M('a (m/s²)')}</div>
        </div>
        {HM.map((g, i) => (
          <div key={i} style={{ display: 'flex', padding: '12px 24px', borderTop: `2px solid ${TINT}`, fontFamily: MONO, fontSize: 40, fontWeight: 500, opacity: env(T, d + 1.4 + i * 1.1, 0.4) }}>
            <div style={{ width: 340, color: PC[i], fontWeight: 600 }}>{g}</div><div style={{ width: 300, color: INK }}>{FW[i].toFixed(3)}</div><div style={{ color: INDIGO, fontWeight: 600 }}>{AC[i].toFixed(3)}</div>
          </div>
        ))}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Axes x={G.x} y={G.y} w={G.w} h={G.h} xmax={0.6} ymax={1.1} xt={[0, 0.2, 0.4, 0.6]} yt={[0, 0.5, 1]} xl="F (N)" yl="a (m/s²)" o={env(T, d + 7.4)}>
          {(X, Y) => <g>{FW.map((f, i) => { const e = env(T, d + 8 + i * 0.6, 0.4); return e > 0 ? <circle key={i} cx={X(f)} cy={Y(AC[i])} r={13 * e} fill={PC[i]} /> : null; })}</g>}
        </Axes>
      </svg>
    </Scene>
  );
}
function Linear({ T, C }) {
  const l = C.Linear, G = { x: 1180, y: 300, w: 700, h: 480 }, fit = eo((T - (l + 1.2)) / 1.2);
  return (
    <Scene n="Linear" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={l + 0.3} top={44} s="WHAT THE DATA SAYS" c={SAGE} />
      <Big T={T} at={l + 0.6} top={92} s="A straight line through the origin." size={64} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Axes x={G.x} y={G.y} w={G.w} h={G.h} xmax={0.6} ymax={1.1} xt={[0, 0.2, 0.4, 0.6]} yt={[0, 0.5, 1]} xl="F (N)" yl="a (m/s²)" o={env(T, l)}>
          {(X, Y) => (
            <g>
              {fit > 0 && <line x1={X(0)} y1={Y(0)} x2={X(0.56 * fit)} y2={Y(1.82 * 0.56 * fit)} stroke={INK} strokeWidth={3} strokeDasharray="12 8" />}
              {FW.map((f, i) => <circle key={i} cx={X(f)} cy={Y(AC[i])} r={13} fill={PC[i]} />)}
              {env(T, l + 4.4) > 0 && <g opacity={env(T, l + 4.4)}><circle cx={X(FW[1])} cy={Y(AC[1])} r={26} fill="none" stroke={CORAL} strokeWidth={4} /><circle cx={X(FW[3])} cy={Y(AC[3])} r={26} fill="none" stroke={CORAL} strokeWidth={4} /></g>}
            </g>
          )}
        </Axes>
      </svg>
      <div style={{ position: 'absolute', left: 60, top: 220, opacity: env(T, l + 4.4), padding: '10px 24px', borderRadius: 10, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontSize: 44, color: INK }}>{M('Double F: 0.196 → 0.392 N')}</div>
      <Big T={T} at={l + 5.6} top={310} s="a: 0.379 → 0.728 m/s². About double." size={46} />
      <div style={{ position: 'absolute', left: 50, top: 420, opacity: env(T, l + 8.4), padding: '6px 30px 12px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#eeeefa', fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, color: INDIGO }}>{M('a ∝ F   (constant m)')}</div>
      <Big T={T} at={l + 12} top={600} s="slope ≈ 1.8 per kg" size={52} />
      <Big T={T} at={l + 14.4} top={680} w={1060} s="1 ÷ slope ≈ 0.55 kg: the mass being accelerated, cart plus hanger." size={44} italic c={GREY} />
      <Big T={T} at={l + 18} top={860} w={1880} s="So the slope of a vs F is 1/m." size={50} c={SAGE} />
    </Scene>
  );
}
function Combine({ T, C }) {
  const c = C.Combine;
  const glow = 0.5 + 0.5 * Math.sin(T * 3);
  return (
    <Scene n="Combine" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={c + 0.3} top={44} s="TWO EXPERIMENTS, ONE LAW" />
      <div style={{ position: 'absolute', left: 60, top: 110, display: 'flex', gap: 40, alignItems: 'center' }}>
        <div style={{ opacity: env(T, c + 0.6), padding: '20px 34px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff' }}>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: '0.1em', color: INDIGO }}>DAY 11 · VARY m</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 80, color: INK }}>{M('a ∝ 1/m')}</div>
        </div>
        <div style={{ opacity: env(T, c + 2), fontFamily: SERIF, fontSize: 80, color: GREY }}>+</div>
        <div style={{ opacity: env(T, c + 2.4), padding: '20px 34px', borderRadius: 10, border: `3px solid ${CORAL}`, background: '#ffffff' }}>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: '0.1em', color: CORAL }}>DAY 12 · VARY F</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 80, color: INK }}>{M('a ∝ F')}</div>
        </div>
      </div>
      <Big T={T} at={c + 4.6} top={400} s="a ∝ F / m" size={100} italic c={INDIGO} />
      <div style={{ position: 'absolute', left: 50, top: 560, opacity: env(T, c + 7), padding: '6px 44px 14px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, boxShadow: `0 0 0 ${(8 * glow).toFixed(1)}px rgba(61,122,85,0.18)`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 140, color: INK }}>F = ma</div>
      <Big T={T} at={c + 9.6} top={820} w={1880} s="You found Newton’s 2nd Law from your own data." size={56} c={INDIGO} italic />
    </Scene>
  );
}
function Asteroid({ T, C }) {
  const a = C.Asteroid;
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.8}>
      <Kicker T={T} at={a + 0.3} top={44} s="BACK TO 2026-XJ" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Rock x={1620} y={360} r={130} spin={T * 6} o={env(T, a + 0.6)} />
        <Arr x1={1290} y1={300} x2={1440} y2={300} c={CORAL} w={8} h={20} o={env(T, a + 3)} />
        <SV x={1270} y={310} s="F" c={CORAL} size={48} an="end" o={env(T, a + 3)} />
        <Arr x1={1190} y1={440} x2={1440} y2={440} c={CORAL} w={12} h={26} o={env(T, a + 7)} />
        <SV x={1170} y={452} s="2F" c={CORAL} size={48} an="end" o={env(T, a + 7)} />
      </svg>
      <Big T={T} at={a + 0.6} top={110} s="Same asteroid: m ≈ 3.5 × 10^11 kg" size={60} />
      <Big T={T} at={a + 3} top={220} s="F = 1,000 N → a ≈ 2.9 × 10^−9 m/s²" size={52} italic c={INDIGO} />
      <Big T={T} at={a + 7} top={320} s="2,000 N → a ≈ 5.7 × 10^−9 m/s²" size={52} italic c={INDIGO} />
      <Big T={T} at={a + 10} top={460} w={1080} s="Double the push, double the acceleration, double the change in velocity over the same time." size={48} />
      <Big T={T} at={a + 15} top={720} w={1880} s="F = ma is the equation behind every deflection mission." size={52} italic c={SAGE} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={92} s="Same mass. Double the force." size={76} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track x0={200} x1={1500} y={420} o={env(T, e + 1)} />
        <g opacity={env(T, e + 1)}><Cart x={600} y={420} T={T} /></g>
        <Arr x1={700} y1={370} x2={840} y2={370} c={CORAL} w={9} h={22} o={env(T, e + 1.4)} />
        <SV x={770} y={340} s="F" c={CORAL} size={48} an="middle" o={env(T, e + 1.4)} />
        <SV x={1560} y={410} s="m → a" c={INDIGO} size={52} o={env(T, e + 1.8)} />
        <Track x0={200} x1={1500} y={720} o={env(T, e + 2.4)} />
        <g opacity={env(T, e + 2.4)}><Cart x={600} y={720} T={T} /></g>
        <Arr x1={700} y1={670} x2={980} y2={670} c={CORAL} w={12} h={26} o={env(T, e + 2.8)} />
        <SV x={840} y={640} s="2F" c={CORAL} size={48} an="middle" o={env(T, e + 2.8)} />
        <SV x={1560} y={710} s="m → a = ?" c={INDIGO} size={52} o={env(T, e + 3.2)} />
      </svg>
    </Scene>
  );
}
function StopBand({ T, C }) {
  for (const n of STOP_KEYS) {
    const end = endOf(C, n), o = clamp((T - (end - 3)) / 0.5, 0, 1) * (n === LAST ? 1 : clamp((end + 0.3 - T) / 0.3, 0, 1));
    if (o <= 0) continue;
    const [num, kind, q] = STOPS[n];
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 300, opacity: o, transform: `translateY(${(1 - o) * 40}px)`, background: INK, padding: '26px 70px 32px', display: 'flex', alignItems: 'center', gap: 50, boxSizing: 'border-box' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ padding: '6px 18px', borderRadius: 6, background: CORAL, color: '#ffffff', fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em' }}>{`STOP ${num}`}</div>
            <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', color: '#f0a58a' }}>{kind}</div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 50, lineHeight: 1.2, color: '#f6f6fb', whiteSpace: 'normal', textWrap: 'pretty' }}>{M(q)}</div>
        </div>
        <div style={{ flex: 'none', fontFamily: MONO, fontSize: 26, fontWeight: 500, color: '#b9bad6', textAlign: 'right', lineHeight: 1.5 }}>Space · continue<br></br>B · replay section</div>
      </div>
    );
  }
  return null;
}


function shots12(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Setup', 'Run', 'Data', 'Linear', 'Combine', 'Asteroid', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
  ];
}
function Piece({ tw }) {
  const { T, CUES: C, time } = useComposition();
  const tl = useTimeline();
  const prev = React.useRef(T), live = React.useRef({});
  live.current = { T, C, tl };
  React.useEffect(() => {
    const p = prev.current; prev.current = T;
    if (tw.stops === false || !tl.playing || T - p > 1 || T <= p) return;
    for (const n of STOP_KEYS) { const st = endOf(C, n) - 0.4; if (p < st && T >= st) { tl.setPlaying(false); break; } }
  });
  React.useEffect(() => {
    const h = (e) => {
      const { T, C, tl } = live.current;
      if (e.code === 'KeyN') { const n = ORDER.find((k) => C[k] > T + 0.05); if (n) { tl.setTime(C[n]); tl.setPlaying(true); } }
      if (e.code === 'KeyB') { const cur = [...ORDER].reverse().find((k) => C[k] <= T - 0.6); if (cur) { tl.setTime(C[cur]); tl.setPlaying(true); } }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const cam = camAt(T, shots12(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Recap T={T} C={C} />
        <Setup T={T} C={C} />
        <Run T={T} C={C} />
        <Data T={T} C={C} />
        <Linear T={T} C={C} />
        <Combine T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function ForceDay12App() {
  const [tw, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  return (
    <React.Fragment>
      <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#22233a">
        <Piece tw={tw} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Teaching" />
        <TweakToggle label="Pause at stop points" value={tw.stops !== false} onChange={(v) => setTweak('stops', v)} />
        <TweakToggle label="Coordinate grid" value={tw.grid !== false} onChange={(v) => setTweak('grid', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.ForceDay12App = ForceDay12App;


