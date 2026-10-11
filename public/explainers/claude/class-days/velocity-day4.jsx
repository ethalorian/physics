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


const ORDER = ['Title', 'Recap', 'VT', 'Insights', 'Vectors', 'Practice', 'Decompose', 'SixMonths', 'Connect', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, "TODAY'S QUESTION", 'What does a velocity–time graph look like for this same motion?'],
  VT: [2, 'YOUR TURN', "Sketch the v–t graph for each of yesterday's p–t graphs: steep, shallow, flat, and walking toward the sensor."],
  Insights: [3, 'DISCUSS', 'Which v–t graph shows the fastest constant motion? Why does the toward-sensor line sit below zero?'],
  Vectors: [4, 'YOUR TURN', 'Draw velocity vectors: a car at 60 mph east, a plane at 200 mph north, a runner at 5 m/s southwest.'],
  Decompose: [5, 'YOUR TURN', 'On graph paper, draw the 8,500 m/s vector at 15° to scale. Split it into toward-Earth and perpendicular parts.'],
  SixMonths: [6, 'YOUR TURN', 'Roughly how far does each component move the asteroid in 6 months? Use rate × time.'],
  Connect: [7, 'EXIT TICKET', 'Why does it matter that we calculate the components of the asteroid’s velocity separately?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], VT: [2200, -1300], Insights: [2200, 0], Vectors: [0, 0], Practice: [-2200, 0], Decompose: [-2200, 1300], SixMonths: [0, 1300], Connect: [2200, 1300] };
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


function Mini({ T, at, L, Tp, Wd, Ht, f, ymin, ymax, col, tag, tmax = 5 }) {
  const o = env(T, at - 0.4, 0.5);
  if (o <= 0) return null;
  const X = (t) => L + 40 + (t / tmax) * (Wd - 70), Y = (v) => Tp + Ht - 30 - ((v - ymin) / (ymax - ymin)) * (Ht - 80);
  const dr = eo((T - at) / 1.2);
  const d = Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * tmax * dr; return (i ? 'L ' : 'M ') + X(t).toFixed(1) + ' ' + Y(f(t)).toFixed(1); }).join(' ');
  return (
    <g opacity={o}>
      <rect x={L} y={Tp} width={Wd} height={Ht} rx={8} fill="#fbfbfe" stroke={LINE} strokeWidth={2} />
      <line x1={X(0)} y1={Y(ymin)} x2={X(0)} y2={Y(ymax)} stroke={INK} strokeWidth={3} />
      <line x1={X(0)} y1={Y(Math.max(0, ymin))} x2={X(tmax)} y2={Y(Math.max(0, ymin))} stroke={INK} strokeWidth={3} />
      <text x={L + Wd - 14} y={Tp + 36} textAnchor="end" fontFamily={MONO} fontSize={26} fontWeight={600} fill={GREY}>{tag}</text>
      {dr > 0 && <path d={d} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
}
function TitleV({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 4 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Velocity–time graphs</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 260, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>and vector thinking</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 440, fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: INDIGO }}>R2 · Read a v–t graph; split a 2-D velocity into components.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 570, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap, L = 120, Tp = 200, Wd = 1050, Ht = 640;
  const X = (t) => L + 40 + (t / 6) * (Wd - 70), Y = (v) => Tp + Ht - 30 - (v / 4) * (Ht - 80);
  const tri = env(T, r + 4, 0.6);
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · YESTERDAY" />
      <Big T={T} at={r + 0.6} top={92} s="Slope of a position–time graph = velocity" size={68} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Mini T={T} at={r + 1.5} L={L} Tp={Tp} Wd={Wd} Ht={Ht} f={(t) => 0.5 + 0.5 * t} ymin={0} ymax={4} tmax={6} col={INDIGO} tag="position–time" />
        {tri > 0 && <g opacity={tri}><path d={`M ${X(1)} ${Y(1)} L ${X(3)} ${Y(1)} L ${X(3)} ${Y(2)}`} fill="none" stroke={SAGE} strokeWidth={5} /><text x={X(2)} y={Y(1) + 44} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={SAGE}>Δt = 2.0 s</text><text x={X(3) + 18} y={Y(1.5) + 14} fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={SAGE}>Δx = 1.0 m</text></g>}
      </svg>
      <Big T={T} at={r + 6.5} top={420} left={1280} s="v = Δx / Δt" size={64} />
      <Big T={T} at={r + 8} top={510} left={1280} s="= 1.0 m / 2.0 s" size={64} />
      <div style={{ position: 'absolute', left: 1270, top: 610, opacity: env(T, r + 9.4), padding: '4px 24px 10px', borderRadius: 10, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 68, color: INK }}>= 0.5 m/s</div>
    </Scene>
  );
}
function VTCard({ T, C }) {
  const v = C.VT;
  return (
    <Scene n="VT" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={v + 0.3} top={44} s="SAME MOTION, NEW GRAPH" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Mini T={T} at={v + 0.8} L={100} Tp={150} Wd={780} Ht={500} f={(t) => 0.5 + 0.5 * t} ymin={0} ymax={4} tmax={6} col={INDIGO} tag="position–time" />
        <Mini T={T} at={v + 3.2} L={1120} Tp={150} Wd={780} Ht={500} f={() => 0.5} ymin={-0.2} ymax={1} tmax={6} col={CORAL} tag="velocity–time" />
        <path d={arrowD(910, 400, 1090, 400, 22)} fill="none" stroke={INK} strokeWidth={6} opacity={env(T, v + 2.4)} />
        <text x={1000} y={370} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={36} fill={INK} opacity={env(T, v + 2.4)}>same motion</text>
      </svg>
      <Big T={T} at={v + 6} top={720} s="Constant velocity → a horizontal line on the v–t graph." size={58} />
      <Big T={T} at={v + 9} top={810} s="Its height is the velocity: 0.5 m/s." size={54} italic c={CORAL} />
    </Scene>
  );
}
function Insights({ T, C }) {
  const i0 = C.Insights;
  const cols = [['steep', (t) => 0.4 + 0.7 * t, () => 0.7, INDIGO], ['shallow', (t) => 0.4 + 0.25 * t, () => 0.25, INDIGO], ['flat', () => 2, () => 0, INDIGO], ['toward sensor', (t) => 3.6 - 0.6 * t, () => -0.6, CORAL], ['speeding up', (t) => 0.4 + 0.12 * t * t, (t) => 0.24 * t, SAGE]];
  const Wd = 360, Ht = 300;
  return (
    <Scene n="Insights" T={T} C={C} ph={1.3}>
      <Kicker T={T} at={i0 + 0.3} top={44} s="POSITION–TIME → VELOCITY–TIME" />
      {cols.map(([nm], k) => <div key={k} style={{ position: 'absolute', left: 60 + k * 385, top: 96, width: Wd, textAlign: 'center', opacity: env(T, i0 + 0.8 + k * 1.6), fontFamily: SERIF, fontSize: 44, color: INK }}>{nm}</div>)}
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {cols.map(([nm, p, v, col], k) => (
          <g key={k}>
            <Mini T={T} at={i0 + 1.0 + k * 1.6} L={60 + k * 385} Tp={160} Wd={Wd} Ht={Ht} f={p} ymin={0} ymax={4} col={INDIGO} tag="x–t" />
            <Mini T={T} at={i0 + 1.8 + k * 1.6} L={60 + k * 385} Tp={500} Wd={Wd} Ht={Ht} f={v} ymin={-1} ymax={1.3} col={col} tag="v–t" />
          </g>
        ))}
      </svg>
      <Big T={T} at={i0 + 10} top={830} s="Constant velocity → horizontal.   Changing velocity → tilted." size={54} />
      <div style={{ position: 'absolute', left: 60, top: 920, opacity: env(T, i0 + 13), fontFamily: MONO, fontSize: 32, fontWeight: 600, color: SAGE }}>PREVIEW · SLOPE OF A v–t GRAPH = ACCELERATION (DAY 8)</div>
    </Scene>
  );
}
function Vectors({ T, C }) {
  const vc = C.Vectors, O = [300, 600];
  const len = 700 * eo((T - (vc + 2)) / 1.0), ang = -30 * eio((T - (vc + 6.5)) / 1.2) * D2R;
  const tip = [O[0] + len * Math.cos(ang), O[1] + len * Math.sin(ang)];
  const len2 = 350 * eo((T - (vc + 10)) / 0.8);
  const lx = (O[0] + tip[0]) / 2 + 40 * Math.sin(ang) + 0.15 * len * Math.cos(ang), ly = (O[1] + tip[1]) / 2 - 40 * Math.cos(ang) + 0.15 * len * Math.sin(ang);
  const R = [1650, 480];
  return (
    <Scene n="Vectors" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={vc + 0.3} top={44} s="VECTORS AS ARROWS" />
      <Big T={T} at={vc + 0.8} top={92} s="A velocity vector is an arrow." size={72} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {len > 2 && <path d={arrowD(O[0], O[1], tip[0], tip[1], 30)} fill="none" stroke={INDIGO} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={O[0]} cy={O[1]} r={10} fill={INK} opacity={env(T, vc + 1.8)} />
        {env(T, vc + 4, 0.5) > 0 && <text x={lx} y={ly} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={44} fill={INDIGO} opacity={env(T, vc + 4, 0.5)} transform={`rotate(${ang / D2R} ${lx} ${ly})`}>length = magnitude (how fast)</text>}
        {env(T, vc + 7.6, 0.5) > 0 && <g opacity={env(T, vc + 7.6, 0.5)}><line x1={O[0]} y1={O[1]} x2={O[0] + 260} y2={O[1]} stroke={GREY} strokeWidth={3} strokeDasharray="10 8" /><path d={`M ${O[0] + 220} ${O[1]} A 220 220 0 0 0 ${O[0] + 220 * Math.cos(ang)} ${O[1] + 220 * Math.sin(ang)}`} fill="none" stroke={CORAL} strokeWidth={5} /><text x={O[0] + 230} y={O[1] + 56} fontFamily={SERIF} fontStyle="italic" fontSize={44} fill={CORAL}>direction</text></g>}
        {len2 > 2 && <g><path d={arrowD(O[0], 900, O[0] + len2, 900, 26)} fill="none" stroke={INDIGO} strokeWidth={12} strokeLinecap="round" /><circle cx={O[0]} cy={900} r={10} fill={INK} /></g>}
        {[['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]].map(([l, dx, dy]) => <g key={l} opacity={env(T, vc + 1.2)}><line x1={R[0]} y1={R[1]} x2={R[0] + dx * 150} y2={R[1] + dy * 150} stroke={INK} strokeWidth={3} /><text x={R[0] + dx * 190} y={R[1] + dy * 190 + 16} textAnchor="middle" fontFamily={MONO} fontSize={44} fontWeight={600} fill={INK}>{l}</text></g>)}
      </svg>
      <Big T={T} at={vc + 10.6} top={870} left={720} s="Half as fast → half as long." size={54} italic />
    </Scene>
  );
}
function Practice({ T, C }) {
  const p = C.Practice, O = [600, 700], S = 50 / 25;
  const car = eo((T - (p + 1.5)) / 0.8), pl = eo((T - (p + 4)) / 0.8), rn = eo((T - (p + 6.5)) / 0.8);
  const rl = 11.2 * S * rn / Math.SQRT2;
  return (
    <Scene n="Practice" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={p + 0.3} top={44} s="SAME SCALE · 1 SQUARE = 25 mph" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {Array.from({ length: 15 }, (_, k) => <line key={'v' + k} x1={250 + k * 50} y1={200} x2={250 + k * 50} y2={900} stroke={TINT} strokeWidth={2} />)}
        {Array.from({ length: 15 }, (_, k) => <line key={'h' + k} x1={250} y1={200 + k * 50} x2={950} y2={200 + k * 50} stroke={TINT} strokeWidth={2} />)}
        {[['N', 600, 180], ['E', 980, 714], ['S', 600, 944], ['W', 220, 714]].map(([l, x, y]) => <text key={l} x={x} y={y} textAnchor="middle" fontFamily={MONO} fontSize={36} fontWeight={600} fill={GREY}>{l}</text>)}
        {car > 0 && <path d={arrowD(O[0], O[1], O[0] + 60 * S * car, O[1], 20)} fill="none" stroke={INDIGO} strokeWidth={9} strokeLinecap="round" />}
        {pl > 0 && <path d={arrowD(O[0], O[1], O[0], O[1] - 200 * S * pl, 22)} fill="none" stroke={SAGE} strokeWidth={9} strokeLinecap="round" />}
        {rn > 0 && <path d={arrowD(O[0], O[1], O[0] - rl, O[1] + rl, 12)} fill="none" stroke={CORAL} strokeWidth={7} strokeLinecap="round" />}
        <circle cx={O[0]} cy={O[1]} r={8} fill={INK} />
        <text x={O[0] + 140} y={O[1] - 22} fontFamily={SERIF} fontStyle="italic" fontSize={36} fill={INDIGO} opacity={car}>car</text>
        <text x={O[0] + 22} y={O[1] - 340} fontFamily={SERIF} fontStyle="italic" fontSize={36} fill={SAGE} opacity={pl}>plane</text>
        <text x={O[0] - 40} y={O[1] + 80} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={36} fill={CORAL} opacity={rn}>runner</text>
      </svg>
      <Big T={T} at={p + 1.6} top={200} left={1100} s="Car: 60 mph east → 2.4 squares →" size={50} c={INDIGO} />
      <Big T={T} at={p + 4.1} top={290} left={1100} s="Plane: 200 mph north → 8 squares ↑" size={50} c={SAGE} />
      <Big T={T} at={p + 6.6} top={380} left={1100} s="Runner: 5 m/s ≈ 11 mph southwest" size={50} c={CORAL} />
      <Big T={T} at={p + 7.4} top={450} left={1100} s="→ under half a square ↙" size={50} c={CORAL} />
      <Big T={T} at={p + 10} top={600} left={1100} w={840} s="Length matches speed, on one scale for all three." size={50} />
      <div style={{ position: 'absolute', left: 1100, top: 790, opacity: env(T, p + 12.5), padding: '8px 22px', borderRadius: 8, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: INK }}>Mix units, and the lengths lie.</div>
    </Scene>
  );
}
function Decompose({ T, C }) {
  const d = C.Decompose, A = [1500, 640], E = [200, 640];
  const c15 = Math.cos(15 * D2R), s15 = Math.sin(15 * D2R), L = 1000;
  const tip = [A[0] - L * c15, A[1] - L * s15];
  const v = eo((T - (d + 2)) / 1.2), tw = eo((T - (d + 7)) / 1.2), pp = eo((T - (d + 10)) / 1.0);
  return (
    <Scene n="Decompose" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={d + 0.3} top={44} s="SPLIT THE ASTEROID'S VELOCITY" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 1)}>
          <circle cx={E[0]} cy={E[1]} r={44} fill="#d7d8ea" stroke={INK} strokeWidth={4} />
          <text x={E[0]} y={E[1] + 100} textAnchor="middle" fontFamily={SERIF} fontSize={44} fill={INK}>Earth</text>
          <line x1={E[0] + 60} y1={E[1]} x2={A[0] - 40} y2={A[1]} stroke="#b9bad6" strokeWidth={4} strokeDasharray="14 12" />
          <Rock x={A[0] + 10} y={A[1]} r={34} spin={T * 20} />
        </g>
        {v > 0 && <path d={arrowD(A[0], A[1], A[0] - L * c15 * v, A[1] - L * s15 * v, 30)} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
        <text x={1080} y={455} fontFamily={SERIF} fontStyle="italic" fontSize={46} fill={INK} opacity={env(T, d + 3)}>8,500 m/s at 15°</text>
        {env(T, d + 4.4, 0.5) > 0 && <g opacity={env(T, d + 4.4, 0.5)}><path d={`M ${A[0] - 150} ${A[1]} A 150 150 0 0 1 ${A[0] - 150 * c15} ${A[1] - 150 * s15}`} fill="none" stroke={CORAL} strokeWidth={4} /><text x={A[0] - 175} y={A[1] - 14} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={38} fill={CORAL}>15°</text></g>}
        <line x1={tip[0]} y1={tip[1]} x2={tip[0]} y2={A[1]} stroke={GREY} strokeWidth={3} strokeDasharray="10 8" opacity={env(T, d + 5.4)} />
        {tw > 0 && <path d={arrowD(A[0], A[1] + 4, A[0] - L * c15 * tw, A[1] + 4, 26)} fill="none" stroke={INDIGO} strokeWidth={10} strokeLinecap="round" />}
        {tw > 0 && <text x={(A[0] + tip[0]) / 2} y={A[1] + 66} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={44} fill={INDIGO} opacity={tw}>toward Earth: ≈ 8,210 m/s</text>}
        {pp > 0 && <path d={arrowD(tip[0], A[1], tip[0], A[1] - L * s15 * pp, 22)} fill="none" stroke={CORAL} strokeWidth={10} strokeLinecap="round" />}
        {pp > 0 && <text x={tip[0] - 30} y={(A[1] + tip[1]) / 2 + 14} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={44} fill={CORAL} opacity={pp}>perpendicular: ≈ 2,200 m/s</text>}
      </svg>
      <Big T={T} at={d + 13} top={800} w={1080} s="Tip to tail, the two parts add back up to the full velocity." size={52} />
      <div style={{ position: 'absolute', left: 1240, top: 790, opacity: env(T, d + 16), padding: '16px 26px', borderRadius: 10, border: `2px solid ${LINE}`, background: '#ffffff' }}>
        <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>{M('v cos 15° ≈ 8,210 m/s')}</div>
        <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: CORAL, marginTop: 6 }}>{M('v sin 15° ≈ 2,200 m/s')}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: GREY, marginTop: 8 }}>Today by drawing; protractors tomorrow.</div>
      </div>
    </Scene>
  );
}
function SixMonths({ T, C }) {
  const sx = C.SixMonths, ans = C.Connect;
  const b1 = eo((T - (ans + 0.6)) / 1.2), b2 = eo((T - (ans + 1.6)) / 1.0);
  return (
    <Scene n="SixMonths" T={T} C={C} ph={1.5}>
      <Kicker T={T} at={sx + 0.3} top={44} s="IN 6 MONTHS" />
      <Big T={T} at={sx + 0.8} top={100} s="distance = rate × time" size={72} />
      <Big T={T} at={sx + 2.6} top={200} s="6 months ≈ 1.6 × 10^7 s" size={64} c={INDIGO} />
      <Big T={T} at={sx + 4.4} top={360} s="Toward Earth: 8,210 m/s = 8.21 km/s" size={52} c={INDIGO} />
      <div style={{ position: 'absolute', left: 60, top: 440, height: 54, width: 1500 * b1, background: INDIGO, borderRadius: 4, opacity: b1 > 0 ? 1 : 0 }}></div>
      <Big T={T} at={ans + 1.4} top={510} s="8.21 km/s × 1.6 × 10^7 s ≈ 1.3 × 10^8 km" size={50} />
      <Big T={T} at={sx + 6} top={640} s="Perpendicular: 2,200 m/s = 2.20 km/s" size={52} c={CORAL} />
      <div style={{ position: 'absolute', left: 60, top: 720, height: 54, width: 1500 * 0.268 * b2, background: CORAL, borderRadius: 4, opacity: b2 > 0 ? 1 : 0 }}></div>
      <Big T={T} at={ans + 2.4} top={790} s="2.20 km/s × 1.6 × 10^7 s ≈ 3.5 × 10^7 km" size={50} />
    </Scene>
  );
}
function ConnectCard({ T, C }) {
  const cn = C.Connect + 5.6, A = [1650, 560], E = [260, 560];
  const c15 = Math.cos(15 * D2R), s15 = Math.sin(15 * D2R);
  const u = eio((T - (cn + 1.2)) / 6), P = [A[0] - 1150 * c15 * u, A[1] - 1150 * s15 * u];
  const ax = env(T, cn + 0.8);
  return (
    <Scene n="Connect" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={cn + 0.3} top={44} s="BACK TO 2026-XJ" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={44} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={ax} />
        <text x={E[0]} y={E[1] + 100} textAnchor="middle" fontFamily={SERIF} fontSize={44} fill={INK} opacity={ax}>Earth</text>
        <line x1={E[0]} y1={800} x2={A[0]} y2={800} stroke={INDIGO} strokeWidth={4} opacity={ax} />
        <line x1={1860} y1={A[1] + 40} x2={1860} y2={180} stroke={CORAL} strokeWidth={4} opacity={ax} />
        {u > 0 && <line x1={A[0]} y1={A[1]} x2={P[0]} y2={P[1]} stroke={INK} strokeWidth={3} strokeDasharray="12 10" />}
        {u > 0 && <g><line x1={P[0]} y1={P[1]} x2={P[0]} y2={800} stroke={INDIGO} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} /><line x1={P[0]} y1={P[1]} x2={1860} y2={P[1]} stroke={CORAL} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} /></g>}
        <circle cx={P[0]} cy={800} r={14} fill={INDIGO} opacity={ax} />
        <circle cx={1860} cy={P[1]} r={14} fill={CORAL} opacity={ax} />
        <text x={E[0] + 100} y={860} fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={INDIGO} opacity={ax}>toward-Earth part</text>
        <text x={1830} y={160} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={CORAL} opacity={ax}>perpendicular part</text>
        <Rock x={P[0]} y={P[1]} r={30} spin={T * 20} />
      </svg>
      <Big T={T} at={cn + 0.6} top={96} w={1500} s="NASA tracks both parts to predict where 2026-XJ will be." size={58} />
      <Big T={T} at={cn + 8} top={920} s="Next: use both parts to predict its position in 6 months." size={48} italic c={INDIGO} />
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

function shots4(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    o(C.Recap, 1.8, S('Recap')), o(C.VT, 1.9, S('VT')), o(C.Insights, 1.9, S('Insights')), o(C.Vectors, 1.9, S('Vectors')),
    o(C.Practice, 1.9, S('Practice')), o(C.Decompose, 1.9, S('Decompose')), o(C.SixMonths, 1.9, S('SixMonths')), o(C.Connect + 5.4, 1.9, S('Connect')),
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
  const cam = camAt(T, shots4(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleV T={T} C={C} />
        <Recap T={T} C={C} />
        <VTCard T={T} C={C} />
        <Insights T={T} C={C} />
        <Vectors T={T} C={C} />
        <Practice T={T} C={C} />
        <Decompose T={T} C={C} />
        <SixMonths T={T} C={C} />
        <ConnectCard T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}

function VelocityDay4App() {
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
window.VelocityDay4App = VelocityDay4App;
