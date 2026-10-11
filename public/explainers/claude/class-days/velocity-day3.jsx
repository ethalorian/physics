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

function makeTrial(x0, segs, dur, soft = 0.35, lag = 0, noise = 1) {
  const dt = 0.02, n = Math.round(dur / dt);
  const vAt = (t) => { t -= lag; let v = 0; for (const [a, b, vv] of segs) { const up = clamp((t - a) / soft + 0.5, 0, 1), dn = clamp((t - b) / soft + 0.5, 0, 1); v += vv * (up - dn); } return v; };
  const X = [x0], V = [0];
  for (let i = 1; i <= n; i++) { const v = vAt(i * dt); V.push(v); X.push(X[i - 1] + v * dt); }
  const nzx = (t) => noise * (0.004 * Math.sin(t * 41.3) + 0.003 * Math.sin(t * 97.1));
  return { dur, at: (t) => { const i = clamp(Math.round(t / dt), 0, n); return { x: X[i] + nzx(t), v: V[i] + noise * (0.008 * Math.sin(t * 13.7) + 0.006 * Math.sin(t * 29.3)), rv: V[i] }; } };
}
function StickWalker({ x, y, dist, v, face, s = 1, o = 1 }) {
  const mov = clamp(Math.abs(v) / 0.25, 0, 1), ph = (dist / 0.72) * Math.PI * 2;
  const L = 200 * s, bob = 6 * s * mov * Math.abs(Math.cos(ph));
  const hip = [0, -2 * L - 8 * s + bob];
  const leg = (p) => { const sw = 26 * mov * Math.sin(p) * D2R, kn = (6 + 34 * mov * Math.max(0, Math.sin(p + 1.4))) * D2R; const k = [hip[0] + L * Math.sin(sw), hip[1] + L * Math.cos(sw)]; const f = [k[0] + L * Math.sin(sw - kn), k[1] + L * Math.cos(sw - kn)]; return `M ${hip[0]} ${hip[1]} L ${k[0]} ${k[1]} L ${f[0]} ${f[1]} l ${34 * s} 0`; };
  const sh = [0, hip[1] - 1.55 * L];
  const arm = (p) => { const sw = -22 * mov * Math.sin(p) * D2R; const e = [sh[0] + 0.62 * L * Math.sin(sw), sh[1] + 0.62 * L * Math.cos(sw)]; const hnd = [e[0] + 0.58 * L * Math.sin(sw + 0.35 * mov + 0.1), e[1] + 0.58 * L * Math.cos(sw + 0.35 * mov + 0.1)]; return `M ${sh[0]} ${sh[1]} L ${e[0]} ${e[1]} L ${hnd[0]} ${hnd[1]}`; };
  const w = 11 * s;
  return (
    <g transform={`translate(${x} ${y}) scale(${face} 1)`} opacity={o} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={leg(ph + Math.PI)} stroke="#6b6c86" /><path d={arm(ph)} stroke="#6b6c86" />
      <path d={`M ${hip[0]} ${hip[1]} L ${sh[0] + 6 * s} ${sh[1]}`} />
      <path d={leg(ph)} /><path d={arm(ph + Math.PI)} />
      <circle cx={10 * s} cy={sh[1] - 0.42 * L} r={0.3 * L} fill="#ffffff" />
    </g>
  );
}


const ORDER = ['Title', 'Recap', 'Question', 'Define', 'Convert', 'Asteroid', 'Match', 'Slope', 'Sign', 'Connect', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'QUICK CHECK', 'You walk 4 m forward, then 1 m back. What distance did you travel? What is your displacement?'],
  Question: [2, "TODAY'S QUESTION", 'Two cars go from Fitchburg to Worcester. One takes 1 hour, the other 2 hours. Are they moving the same way?'],
  Define: [3, 'YOUR TURN', 'Convert 72 km/h to m/s. Show how the units cancel.'],
  Convert: [4, 'YOUR TURN', '2026-XJ moves at about 8,500 m/s. How fast is that in km/h? In mph?'],
  Match: [5, 'INVESTIGATION 1.1', 'Take turns matching each target graph: predict, attempt, observe, refine.'],
  Slope: [6, 'DISCUSS', 'How would you walk in front of the sensor to make each of these three graphs?'],
  Sign: [7, 'DISCUSS', 'Put the origin at the far wall, with + pointing toward the sensor. What sign is the same walk’s velocity now?'],
  Connect: [8, 'EXIT TICKET', 'Sketch a position–time graph for constant velocity AWAY from the origin. Label the axes and the slope.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Question: [2200, -1300], Define: [2200, 0], Convert: [0, 0], Asteroid: [-2200, 0], Match: [-2200, 1300], Slope: [0, 1300], Sign: [2200, 1300], Connect: [2200, 2600] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
function walkSegs(segs, t) {
  let x = segs[0][2], v = 0, dist = 0, face = Math.sign(segs[0][3] - segs[0][2]) || 1;
  for (const [a, b, x0, x1] of segs) {
    if (t <= a) break;
    const u = clamp((t - a) / (b - a), 0, 1);
    x = lerp(x0, x1, u); dist += Math.abs(x1 - x0) * u; face = Math.sign(x1 - x0) || face;
    v = t < b ? (x1 - x0) / (b - a) : 0;
  }
  return { x, v, dist, face };
}
function trialWalk(tr, td) { let d = 0, p = tr.at(0).x, f = 1; for (let t = 0.05; t <= td; t += 0.05) { const q = tr.at(t); d += Math.abs(q.x - p); p = q.x; if (Math.abs(q.rv) > 0.05) f = Math.sign(q.rv); } const s = tr.at(td); return { x: s.x, v: s.rv, dist: d, face: f }; }
function CarG({ x, y, c, s = 1, o = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M -70 -20 L -70 -46 L -34 -46 L -18 -70 L 30 -70 L 48 -46 L 70 -46 L 70 -20 Z" fill={c} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M -12 -64 L 26 -64 L 38 -48 L -22 -48 Z" fill="#ffffff" stroke={INK} strokeWidth={2} />
      <circle cx={-40} cy={-18} r={15} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
      <circle cx={42} cy={-18} r={15} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
    </g>
  );
}

function TitleV({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 3 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Velocity:</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>motion with direction</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: INDIGO }}>S1 · Velocity from position–time data; what the slope tells us.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap, q = C.Question, X0 = 160, K = 360, FL = 760;
  const w = walkSegs([[r + 2, r + 6, 0, 4], [r + 7, r + 8.5, 4, 3]], T);
  const ans = env(T, q + 0.4, 0.6);
  const X = (m) => X0 + m * K;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · DAY 2" />
      <Big T={T} at={r + 0.6} top={96} s="Distance vs. displacement" size={84} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={X(-0.2)} y1={FL} x2={X(4.6)} y2={FL} stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3, 4].map((m) => <g key={m}><line x1={X(m)} y1={FL} x2={X(m)} y2={FL + 22} stroke={INK} strokeWidth={3} /><text x={X(m)} y={FL + 62} textAnchor="middle" fontFamily={MONO} fontSize={34} fill={GREY}>{m} m</text></g>)}
        <StickWalker x={X(w.x)} y={FL} dist={w.dist} v={w.v} face={w.face} s={0.4} />
        {ans > 0 && <g opacity={ans}>
          <path d={arrowD(X(0), FL + 110, X(4), FL + 110)} fill="none" stroke={CORAL} strokeWidth={6} />
          <path d={arrowD(X(4), FL + 150, X(3), FL + 150)} fill="none" stroke={CORAL} strokeWidth={6} />
          <path d={arrowD(X(0), FL + 210, X(3), FL + 210)} fill="none" stroke={SAGE} strokeWidth={8} />
        </g>}
      </svg>
      <Big T={T} at={q + 0.8} top={190} left={1080} s="distance = 4 m + 1 m = 5 m" c={CORAL} size={56} />
      <Big T={T} at={q + 1.8} top={266} left={1080} s="displacement = +3 m" c={SAGE} size={56} />
      <div style={{ position: 'absolute', left: 1080, top: 350, opacity: env(T, q + 2.8), fontFamily: MONO, fontSize: 30, fontWeight: 600, color: GREY }}>SCALAR: HOW MUCH GROUND · VECTOR: START → FINISH</div>
    </Scene>
  );
}
function Question({ T, C }) {
  const q = C.Question, h = clamp((T - (q + 7)) / 4, 0, 2);
  const L = 260, R = 1700, yA = 560, yB = 720;
  const xa = lerp(L, R, Easing.easeInOutSine(clamp(h / 1, 0, 1))), xb = lerp(L, R, Easing.easeInOutSine(clamp(h / 2, 0, 1)));
  return (
    <Scene n="Question" T={T} C={C} ph={0.8}>
      <Kicker T={T} at={q + 5} top={44} s="TODAY'S QUESTION" />
      <Big T={T} at={q + 5.4} top={96} s="Fitchburg → Worcester" size={84} />
      <div style={{ position: 'absolute', right: 70, top: 60, opacity: env(T, q + 6.6), fontFamily: MONO, fontSize: 44, fontWeight: 600, color: INK }}>{`clock: ${h.toFixed(1)} h`}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: env(T, q + 5.6) }}>
        {[yA, yB].map((y) => <line key={y} x1={L - 40} y1={y} x2={R + 40} y2={y} stroke="#b9bad6" strokeWidth={10} strokeLinecap="round" />)}
        {[L, R].map((x, i) => <g key={x}><line x1={x} y1={yA - 120} x2={x} y2={yB + 40} stroke={INK} strokeWidth={3} strokeDasharray="10 10" /><circle cx={x} cy={yB + 70} r={14} fill={INK} /><text x={x} y={yB + 140} textAnchor="middle" fontFamily={SERIF} fontSize={52} fill={INK}>{i ? 'Worcester' : 'Fitchburg'}</text></g>)}
        <CarG x={xa} y={yA} c="#d7d8ea" />
        <CarG x={xb} y={yB} c={CORAL_T} />
        <text x={L - 60} y={yA - 30} textAnchor="end" fontFamily={MONO} fontSize={36} fontWeight={600} fill={INDIGO}>A</text>
        <text x={L - 60} y={yB - 30} textAnchor="end" fontFamily={MONO} fontSize={36} fontWeight={600} fill={CORAL}>B</text>
        {h >= 1 && <text x={R + 100} y={yA - 30} fontFamily={MONO} fontSize={40} fontWeight={600} fill={INDIGO}>1 h</text>}
        {h >= 2 && <text x={R + 100} y={yB - 30} fontFamily={MONO} fontSize={40} fontWeight={600} fill={CORAL}>2 h</text>}
      </svg>
      <Big T={T} at={q + 15.4} top={300} s="Same start. Same finish." italic c={INDIGO} size={60} />
    </Scene>
  );
}
function Define({ T, C }) {
  const d = C.Define, a = env(T, d + 9, 0.8), O = [1150, 700];
  return (
    <Scene n="Define" T={T} C={C} ph={1.4}>
      <Kicker T={T} at={d + 0.4} top={44} s="BUILD THE DEFINITIONS" />
      <Big T={T} at={d + 1.0} top={110} s="Speed = distance / time" size={76} />
      <div style={{ position: 'absolute', left: 64, top: 210, opacity: env(T, d + 2.4), fontFamily: MONO, fontSize: 32, fontWeight: 600, color: GREY }}>SCALAR · SIZE ONLY</div>
      <Big T={T} at={d + 5} top={300} s="Velocity = displacement / time" size={76} c={INDIGO} />
      <div style={{ position: 'absolute', left: 64, top: 400, opacity: env(T, d + 6.4), fontFamily: MONO, fontSize: 32, fontWeight: 600, color: INDIGO }}>VECTOR · SIZE + DIRECTION</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: a }}>
        <CarG x={O[0] - 110} y={O[1] - 60} c="#d7d8ea" s={0.8} />
        <path d={arrowD(O[0], O[1] - 80, O[0] + 640 * a, O[1] - 80, 26)} fill="none" stroke={INDIGO} strokeWidth={10} strokeLinecap="round" />
        <text x={O[0] + 660} y={O[1] - 66} fontFamily={MONO} fontSize={38} fontWeight={600} fill={INDIGO}>A · 1 h</text>
        <CarG x={O[0] - 110} y={O[1] + 110} c={CORAL_T} s={0.8} />
        <path d={arrowD(O[0], O[1] + 90, O[0] + 320 * a, O[1] + 90, 26)} fill="none" stroke={CORAL} strokeWidth={10} strokeLinecap="round" />
        <text x={O[0] + 340} y={O[1] + 104} fontFamily={MONO} fontSize={38} fontWeight={600} fill={CORAL}>B · 2 h</text>
      </svg>
      <Big T={T} at={d + 12.5} top={520} s="Same displacement, half the time: twice the velocity." w={900} size={56} italic />
      <div style={{ position: 'absolute', left: 60, top: 760, opacity: env(T, d + 15), padding: '12px 26px', borderRadius: 10, border: `3px solid ${SAGE}`, background: SAGE_T, fontFamily: MONO, fontSize: 44, fontWeight: 600, color: INK }}>PHYSICS UNIT: m/s</div>
    </Scene>
  );
}
function Convert({ T, C }) {
  const c = C.Convert;
  return (
    <Scene n="Convert" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={c + 0.4} top={44} s="CONVERT AS A CLASS" />
      <Big T={T} at={c + 1.0} top={130} s="72 km/h × (1000 m / 1 km) × (1 h / 3600 s)" size={72} />
      <div style={{ position: 'absolute', left: 64, top: 236, opacity: env(T, c + 2.8), fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: CORAL }}>km cancels km, h cancels h</div>
      <Big T={T} at={c + 4.2} top={330} left={140} s="= 72,000 m / 3600 s" size={72} />
      <div style={{ position: 'absolute', left: 120, top: 450, opacity: env(T, c + 6), padding: '6px 30px 12px', borderRadius: 10, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 84, color: INK }}>= 20 m/s</div>
      <div style={{ position: 'absolute', left: 64, top: 650, opacity: env(T, c + 8.6), fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', color: INDIGO }}>SHORTCUT</div>
      <Big T={T} at={c + 9} top={700} s="km/h ÷ 3.6 = m/s" size={58} c={INDIGO} />
      <Big T={T} at={c + 9.8} top={780} s="m/s × 3.6 = km/h" size={58} c={INDIGO} />
    </Scene>
  );
}
function AsteroidSpeed({ T, C }) {
  const a = C.Asteroid;
  const bars = [['highway car', 65, GREY], ['jet airliner', 550, INDIGO], ['2026-XJ', 19000, CORAL]];
  const X0 = 520, WMAX = 1380;
  return (
    <Scene n="Asteroid" T={T} C={C} ph={1.1}>
      <Kicker T={T} at={a + 0.4} top={44} s="HOW FAST IS 2026-XJ?" />
      <Big T={T} at={a + 1.0} top={110} s="8,500 m/s × 3.6 ≈ 30,600 km/h" size={72} />
      <Big T={T} at={a + 3.4} top={210} s="8,500 m/s × 2.237 ≈ 19,000 mph" size={72} c={CORAL} />
      {bars.map(([l, v, col], i) => { const g = eo((T - (a + 6 + i * 1.2)) / 1.4); return (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: 60, top: 420 + i * 150, width: 440, opacity: env(T, a + 5.6 + i * 1.2), fontFamily: SERIF, fontSize: 52, color: INK }}>{l}</div>
          <div style={{ position: 'absolute', left: X0, top: 424 + i * 150, height: 64, width: Math.max(6, (v / 19000) * WMAX * g), background: col, borderRadius: 4, opacity: env(T, a + 5.6 + i * 1.2) }}></div>
          <div style={{ position: 'absolute', left: X0 + Math.max(6, (v / 19000) * WMAX * g) + 20, top: 430 + i * 150, opacity: g, fontFamily: MONO, fontSize: 38, fontWeight: 600, color: col, display: i === 2 ? 'none' : 'block' }}>{`${v.toLocaleString()} mph`}</div>
          {i === 2 && <div style={{ position: 'absolute', left: X0 + 30, top: 436 + i * 150, opacity: g, fontFamily: MONO, fontSize: 38, fontWeight: 600, color: '#ffffff' }}>19,000 mph</div>}
        </React.Fragment>
      ); })}
      <Big T={T} at={a + 11} top={880} s="About 35× faster than a jet airliner." size={56} italic c={INDIGO} />
    </Scene>
  );
}
const TG1 = makeTrial(0.8, [[0, 5, 0.4]], 8, 0.001, 0, 0), WK1 = makeTrial(0.8, [[0, 5, 0.4]], 8, 0.6, 0.3, 1);
const TG2 = makeTrial(1.0, [[0, 4, 0.4], [5, 8, -0.533]], 8, 0.001, 0, 0), WK2 = makeTrial(1.0, [[0, 4, 0.4], [5, 8, -0.533]], 8, 0.7, 0.3, 1);
function MatchGraph({ T, C }) {
  const m = C.Match, p1 = m + 2, p2 = m + 11.5;
  const ph2 = T >= p2 - 0.8;
  const td = ph2 ? clamp(T - p2, 0, 8) : clamp(T - p1, 0, 8);
  const wk = trialWalk(ph2 ? WK2 : WK1, td);
  const FL = 900, DX = 140, K = 260, WX = (x) => 230 + x * K;
  const G = { l: 1120, t: 240, w: 800, h: 560 }, gx = (t) => G.l + (t / 8) * G.w, gy = (x) => G.t + G.h - (x / 3.2) * G.h;
  const path = (tr, up) => { const n = Math.floor(up / 0.05 + 1e-6); if (n < 1) return ''; let d = ''; for (let i = 0; i <= n; i++) { const t = i * 0.05; d += (i ? ' L ' : 'M ') + gx(t).toFixed(1) + ' ' + gy(tr.at(t).x).toFixed(1); } return d; };
  const o1 = win(T, m + 1.0, p2 - 0.8, 0.5), o2 = env(T, p2 - 0.6, 0.5);
  const steps = ['Predict', 'Attempt', 'Observe', 'Refine'], hi = T > m + 1.5 ? Math.floor((T - m) / 1.4) % 4 : -1;
  const pulse = (T * 0.9) % 1;
  return (
    <Scene n="Match" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={m + 0.3} top={44} s="INVESTIGATION 1.1 · MATCH THE GRAPH" />
      <div style={{ position: 'absolute', left: 60, top: 100, display: 'flex', gap: 18, opacity: env(T, m + 0.8) }}>
        {steps.map((s, i) => <div key={i} style={{ padding: '10px 24px', borderRadius: 8, border: `3px solid ${i === hi ? SAGE : LINE}`, background: i === hi ? SAGE_T : '#ffffff', fontFamily: SERIF, fontSize: 46, color: INK }}>{`${i + 1} · ${s}`}</div>)}
      </div>
      <div style={{ position: 'absolute', right: CW - G.l - G.w, top: 172, opacity: env(T, m + 1.2), fontFamily: MONO, fontSize: 30, fontWeight: 600, color: ph2 ? CORAL : INDIGO }}>{ph2 ? '2 · CHANGE DIRECTION' : '1 · CONSTANT VELOCITY'}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={60} y1={FL} x2={1040} y2={FL} stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3].map((x) => <text key={x} x={WX(x)} y={FL + 52} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={GREY}>{x} m</text>)}
        <rect x={DX - 60} y={FL - 330} width={90} height={100} rx={10} fill={SAGE_T} stroke={INK} strokeWidth={4} />
        <line x1={DX - 15} y1={FL - 230} x2={DX - 15} y2={FL} stroke={INK} strokeWidth={6} />
        {[0, 1].map((k) => { const u = (pulse + k / 2) % 1; return <path key={k} d={`M ${DX + 40 + (WX(wk.x) - DX - 80) * u} ${FL - 330} q 24 50 0 100`} fill="none" stroke={INDIGO} strokeWidth={4} opacity={0.6} />; })}
        <StickWalker x={WX(wk.x)} y={FL} dist={wk.dist} v={wk.v} face={wk.face} s={0.42} />
        {[0, 2, 4, 6, 8].map((t) => <g key={'t' + t}><line x1={gx(t)} y1={G.t} x2={gx(t)} y2={G.t + G.h} stroke={TINT} strokeWidth={2} /><text x={gx(t)} y={G.t + G.h + 42} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={GREY}>{t}</text></g>)}
        {[0, 1, 2, 3].map((x) => <g key={'x' + x}><line x1={G.l} y1={gy(x)} x2={G.l + G.w} y2={gy(x)} stroke={TINT} strokeWidth={2} /><text x={G.l - 14} y={gy(x) + 10} textAnchor="end" fontFamily={MONO} fontSize={30} fill={GREY}>{x}</text></g>)}
        <line x1={G.l} y1={G.t} x2={G.l} y2={G.t + G.h} stroke={INK} strokeWidth={4} /><line x1={G.l} y1={G.t + G.h} x2={G.l + G.w} y2={G.t + G.h} stroke={INK} strokeWidth={4} />
        <text x={G.l + G.w} y={G.t + G.h + 88} textAnchor="end" fontFamily={SANS} fontSize={32} fontWeight={500} fill={INK}>time (s)</text>
        <text x={G.l - 70} y={G.t - 18} fontFamily={SANS} fontSize={32} fontWeight={500} fill={INK}>position (m)</text>
        <g opacity={o1}><path d={path(TG1, 8)} fill="none" stroke="#9a9bb3" strokeWidth={10} strokeDasharray="18 12" /><path d={path(WK1, ph2 ? 8 : td)} fill="none" stroke={INDIGO} strokeWidth={6} /></g>
        <g opacity={o2}><path d={path(TG2, 8)} fill="none" stroke="#9a9bb3" strokeWidth={10} strokeDasharray="18 12" /><path d={path(WK2, ph2 ? td : 0)} fill="none" stroke={CORAL} strokeWidth={6} /></g>
      </svg>
    </Scene>
  );
}
function SlopeCard({ T, C }) {
  const sl = C.Slope;
  const P = [['steep', 0.4, 0.8, 'fast', INDIGO, sl + 1.5], ['shallow', 0.4, 0.3, 'slow', INDIGO, sl + 3.5], ['flat', 2.5, 0, 'not moving', CORAL, sl + 5.5]];
  const PW = 580, PH = 400, TOP = 290;
  return (
    <Scene n="Slope" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={sl + 0.3} top={44} s="DEBRIEF · WHAT A POSITION–TIME GRAPH TELLS US" />
      <Big T={T} at={sl + 8.5} top={96} s="slope = Δx / Δt = velocity" size={76} c={SAGE} />
      {P.map(([nm, x0, v, lab, col, at], i) => {
        const L = 60 + i * 640, o = env(T, at - 0.6, 0.6), gx = (t) => L + 70 + (t / 5) * (PW - 90), gy = (x) => TOP + PH - 50 - (x / 4) * (PH - 80);
        const dr = eo((T - at) / 1.2), t1 = 4.5 * dr;
        return (
          <React.Fragment key={i}>
            <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o }}>
              <rect x={L} y={TOP} width={PW} height={PH} rx={8} fill="#fbfbfe" stroke={LINE} strokeWidth={2} />
              <line x1={gx(0)} y1={gy(0)} x2={gx(5)} y2={gy(0)} stroke={INK} strokeWidth={3} /><line x1={gx(0)} y1={gy(0)} x2={gx(0)} y2={gy(4)} stroke={INK} strokeWidth={3} />
              <text x={gx(5)} y={gy(0) + 36} textAnchor="end" fontFamily={SANS} fontSize={26} fontWeight={500} fill={GREY}>t</text>
              <text x={gx(0) - 14} y={gy(4) + 10} textAnchor="end" fontFamily={SANS} fontSize={26} fontWeight={500} fill={GREY}>x</text>
              {dr > 0 && <line x1={gx(0)} y1={gy(x0)} x2={gx(t1)} y2={gy(x0 + v * t1)} stroke={col} strokeWidth={7} strokeLinecap="round" />}
              {i === 0 && env(T, sl + 8.5, 0.6) > 0 && <g opacity={env(T, sl + 8.5, 0.6)}><path d={`M ${gx(1)} ${gy(1.2)} L ${gx(3)} ${gy(1.2)} L ${gx(3)} ${gy(2.8)}`} fill="none" stroke={SAGE} strokeWidth={4} /><text x={gx(2)} y={gy(1.2) + 34} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={30} fill={SAGE}>Δt</text><text x={gx(3) + 14} y={gy(2) + 10} fontFamily={SERIF} fontStyle="italic" fontSize={30} fill={SAGE}>Δx</text></g>}
            </svg>
            <div style={{ position: 'absolute', left: L, top: TOP + PH + 24, width: PW, opacity: env(T, at + 0.8), fontFamily: SERIF, fontSize: 50, color: col }}>{`${nm} → ${lab}`}</div>
            <div style={{ position: 'absolute', left: L, top: TOP + PH + 94, width: PW, opacity: env(T, at + 1.2), fontFamily: MONO, fontSize: 32, fontWeight: 600, color: GREY }}>{`v = ${v} m/s`}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', left: 60, top: 900, opacity: env(T, sl + 12.5), padding: '8px 22px', borderRadius: 8, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: INK }}>Watch out: flat does NOT mean constant speed. Flat means position isn't changing.</div>
    </Scene>
  );
}
function SignCard({ T, C }) {
  const sg = C.Sign, cn0 = C.Connect, flip = eio((T - (cn0 + 0.4)) / 1.4);
  const w = walkSegs([[sg + 2, sg + 6, 2.8, 0.8]], T);
  const FL = 520, X = (m) => 180 + m * 270;
  const G = { l: 1260, t: 110, w: 640, h: 380 }, gx = (t) => G.l + (t / 5) * G.w, gy = (x) => G.t + G.h - (x / 3.4) * G.h;
  const td = clamp(T - (sg + 2), 0, 4);
  const pts = (fn) => Array.from({ length: Math.floor(td / 0.1) + 1 }, (_, i) => { const t = i * 0.1; const x = 2.8 - 0.5 * t; return (i ? 'L ' : 'M ') + gx(t + 0.5).toFixed(1) + ' ' + gy(fn(x)).toFixed(1); }).join(' ');
  const axO = 1 - flip;
  return (
    <Scene n="Sign" T={T} C={C} ph={1.7}>
      <Kicker T={T} at={sg + 0.3} top={44} s="WHAT A NEGATIVE SLOPE MEANS" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={60} y1={FL} x2={1180} y2={FL} stroke={INK} strokeWidth={5} />
        <rect x={60} y={FL - 330} width={90} height={100} rx={10} fill={SAGE_T} stroke={INK} strokeWidth={4} /><line x1={105} y1={FL - 230} x2={105} y2={FL} stroke={INK} strokeWidth={6} />
        <text x={105} y={FL - 350} textAnchor="middle" fontFamily={MONO} fontSize={28} fontWeight={600} fill={INK}>sensor</text>
        <g opacity={axO}>
          <text x={X(0)} y={FL + 56} textAnchor="middle" fontFamily={MONO} fontSize={32} fontWeight={600} fill={INK}>0</text>
          <path d={arrowD(X(0.6), FL + 100, X(2.2), FL + 100, 22)} fill="none" stroke={INDIGO} strokeWidth={7} strokeLinecap="round" />
          <text x={X(2.35)} y={FL + 112} fontFamily={MONO} fontSize={40} fontWeight={600} fill={INDIGO}>+</text>
        </g>
        <g opacity={flip}>
          <text x={X(3.4)} y={FL + 56} textAnchor="middle" fontFamily={MONO} fontSize={32} fontWeight={600} fill={INK}>0</text>
          <path d={arrowD(X(2.8), FL + 100, X(1.2), FL + 100, 22)} fill="none" stroke={SAGE} strokeWidth={7} strokeLinecap="round" />
          <text x={X(1.05)} y={FL + 112} textAnchor="end" fontFamily={MONO} fontSize={40} fontWeight={600} fill={SAGE}>+</text>
        </g>
        <StickWalker x={X(w.x)} y={FL} dist={w.dist} v={w.v} face={w.face} s={0.32} />
        {[0, 1, 2, 3, 4, 5].map((t) => <line key={t} x1={gx(t)} y1={G.t} x2={gx(t)} y2={G.t + G.h} stroke={TINT} strokeWidth={2} />)}
        <line x1={G.l} y1={G.t} x2={G.l} y2={G.t + G.h} stroke={INK} strokeWidth={4} /><line x1={G.l} y1={G.t + G.h} x2={G.l + G.w} y2={G.t + G.h} stroke={INK} strokeWidth={4} />
        <text x={G.l + G.w} y={G.t + G.h + 40} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>time</text>
        <text x={G.l - 14} y={G.t - 14} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>position</text>
        {td > 0 && <path d={pts((x) => x)} fill="none" stroke={CORAL} strokeWidth={6} opacity={1 - 0.65 * flip} />}
        {flip > 0 && <path d={pts((x) => 3.4 - x)} fill="none" stroke={SAGE} strokeWidth={6} opacity={flip} />}
      </svg>
      <Big T={T} at={sg + 6.6} top={650} s="Negative slope → negative velocity." size={58} c={CORAL} />
      <Big T={T} at={sg + 8} top={730} s="Here, that means moving toward the sensor." size={50} italic />
      <Big T={T} at={cn0 + 2.0} top={830} s="Flip the axis: same walk, positive velocity." size={58} c={SAGE} />
      <Big T={T} at={cn0 + 3.4} top={910} s="The sign tells direction along the axis you chose." size={50} italic c={INDIGO} />
    </Scene>
  );
}
function ConnectCard({ T, C }) {
  const cn = C.Connect + 5.6, G = { l: 200, t: 160, w: 1080, h: 640 };
  const X = (t) => G.l + (t / 60) * G.w, Y = (x) => G.t + G.h - ((x - 1.1) / 0.6) * G.h;
  const f = (t) => 1.66 - 0.00626 * t - 0.000018 * t * t, slope = -(0.00626 + 0.000036 * 30);
  const tan = env(T, cn + 6, 0.6);
  return (
    <Scene n="Connect" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={cn + 0.3} top={44} s="BACK TO 2026-XJ" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: env(T, cn - 0.3) }}>
        {[0, 10, 20, 30, 40, 50, 60].map((t) => <g key={t}><line x1={X(t)} y1={G.t} x2={X(t)} y2={G.t + G.h} stroke={TINT} strokeWidth={2} /><text x={X(t)} y={G.t + G.h + 42} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={GREY}>{t}</text></g>)}
        {[1.2, 1.3, 1.4, 1.5, 1.6, 1.7].map((x) => <g key={x}><line x1={G.l} y1={Y(x)} x2={G.l + G.w} y2={Y(x)} stroke={TINT} strokeWidth={2} /><text x={G.l - 14} y={Y(x) + 10} textAnchor="end" fontFamily={MONO} fontSize={30} fill={GREY}>{x.toFixed(1)}</text></g>)}
        <line x1={G.l} y1={G.t} x2={G.l} y2={G.t + G.h} stroke={INK} strokeWidth={4} /><line x1={G.l} y1={G.t + G.h} x2={G.l + G.w} y2={G.t + G.h} stroke={INK} strokeWidth={4} />
        <text x={G.l + G.w} y={G.t + G.h + 90} textAnchor="end" fontFamily={SANS} fontSize={32} fontWeight={500} fill={INK}>time (days)</text>
        <text x={G.l - 90} y={G.t - 30} fontFamily={SANS} fontSize={32} fontWeight={500} fill={INK}>{MS('distance from Earth (× 10^8 km)')}</text>
        {Array.from({ length: 13 }, (_, k) => k * 5).map((t, k) => { const e = env(T, cn + 1 + k * 0.22, 0.3); return e > 0 ? <circle key={t} cx={X(t)} cy={Y(f(t) + 0.006 * Math.sin(k * 2.7))} r={11 * e} fill={INDIGO} /> : null; })}
        {tan > 0 && <g opacity={tan}><line x1={X(12)} y1={Y(f(30) + slope * -18)} x2={X(48)} y2={Y(f(30) + slope * 18)} stroke={CORAL} strokeWidth={6} /><circle cx={X(30)} cy={Y(f(30))} r={14} fill={CORAL} /></g>}
        <text x={X(31)} y={Y(f(30)) - 40} fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={CORAL} opacity={env(T, cn + 7.4)}>slope ≈ −8,500 m/s</text>
        <text x={G.l + 20} y={G.t + G.h - 24} fontFamily={MONO} fontSize={24} fill={GREY} opacity={env(T, cn + 1)}>illustrative data</text>
      </svg>
      <Big T={T} at={cn + 1.2} top={180} left={1380} w={560} s="Position data for 2026-XJ can be plotted against time." size={50} />
      <Big T={T} at={cn + 8.6} top={420} left={1380} w={560} s="Slope at a point = velocity at that point." size={54} c={SAGE} />
      <Big T={T} at={cn + 11} top={640} left={1380} w={560} s="Negative slope: getting closer to Earth." size={50} italic c={CORAL} />
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
function shotsV(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    o(C.Recap, 1.8, S('Recap')), o(C.Question + 4.4, 1.9, S('Question')), o(C.Define, 1.9, S('Define')),
    o(C.Convert, 1.9, S('Convert')), o(C.Asteroid, 1.9, S('Asteroid')), o(C.Match, 1.9, S('Match')),
    o(C.Slope, 1.9, S('Slope')), o(C.Sign, 1.9, S('Sign')), o(C.Connect + 5.4, 1.9, S('Connect')),
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
  const cam = camAt(T, shotsV(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleV T={T} C={C} />
        <Recap T={T} C={C} />
        <Question T={T} C={C} />
        <Define T={T} C={C} />
        <Convert T={T} C={C} />
        <AsteroidSpeed T={T} C={C} />
        <MatchGraph T={T} C={C} />
        <SlopeCard T={T} C={C} />
        <SignCard T={T} C={C} />
        <ConnectCard T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function VelocityDay3App() {
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
window.VelocityDay3App = VelocityDay3App;
