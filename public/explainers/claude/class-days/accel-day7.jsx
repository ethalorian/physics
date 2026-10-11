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


const ORDER = ['Title', 'Warmup', 'Define', 'Direction', 'Graphs', 'Slope', 'Equations', 'Asteroid', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Warmup: [1, 'PREDICT', 'What is the car’s acceleration? Write a number and units.'],
  Define: [2, 'DISCUSS', 'A car is braking. Is it accelerating? If forward is +, what sign is its acceleration?'],
  Graphs: [3, 'YOUR TURN', 'For each graph: speeding up, slowing down, or constant velocity? How can you tell?'],
  Slope: [4, 'PAIRS', 'Find the acceleration from each practice graph. Watch the sign.'],
  Equations: [5, 'YOUR TURN', 'A cart starts at 2 m/s and speeds up at 3 m/s² for 4 s. How fast is it going? Which equation did you use?'],
  Asteroid: [6, 'DISCUSS', 'As 2026-XJ gets closer, what happens to Earth’s pull? When does “constant velocity” stop being a good model?'],
  Exit: [7, 'EXIT TICKET', 'A car traveling 30 m/s slows to 0 m/s in 5 s. What is its acceleration? Show your work.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Warmup: [0, -1300], Define: [2200, -1300], Direction: [2200, 0], Graphs: [0, 0], Slope: [-2200, 0], Equations: [-2200, 1300], Asteroid: [0, 1300], Exit: [2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} />;
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
// small v–t axes in card coordinates
function VT({ x, y, w, h, vmax = 20, tmax = 6, o = 1, tickV = [], tickT = [], children, label = true }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {tickV.map((v) => <g key={'v' + v}><line x1={x} y1={y + h - (v / vmax) * h} x2={x + w} y2={y + h - (v / vmax) * h} stroke={TINT} strokeWidth={2} /><text x={x - 14} y={y + h - (v / vmax) * h + 10} textAnchor="end" fontFamily={MONO} fontSize={28} fill={GREY}>{v}</text></g>)}
      {tickT.map((t) => <g key={'t' + t}><line x1={x + (t / tmax) * w} y1={y} x2={x + (t / tmax) * w} y2={y + h} stroke={TINT} strokeWidth={2} /><text x={x + (t / tmax) * w} y={y + h + 40} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY}>{t}</text></g>)}
      <line x1={x} y1={y - 10} x2={x} y2={y + h} stroke={INK} strokeWidth={4} />
      <line x1={x} y1={y + h} x2={x + w + 10} y2={y + h} stroke={INK} strokeWidth={4} />
      {label && <text x={x + w} y={y + h + (tickT.length ? 84 : 44)} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>t (s)</text>}
      {label && <text x={x + 14} y={y + 14} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>v (m/s)</text>}
      {children}
    </g>
  );
}

function TitleV({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 7 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Acceleration</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>when velocity changes</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: INDIGO }}>R4 · Acceleration as the rate velocity changes, read from v–t data.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Warmup({ T, C }) {
  const w = C.Warmup, run = clamp((T - (w + 3)) / 6, 0, 1), x0 = 260, x1 = 1700;
  const cx = x0 + (x1 - x0) * run * run, road = 620;
  return (
    <Scene n="Warmup" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={w + 0.3} top={44} s="WARM-UP" />
      <Big T={T} at={w + 0.6} top={92} s="A car goes from 0 to 60 mph in 6 seconds." size={72} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={120} y1={road} x2={1880} y2={road} stroke={INK} strokeWidth={5} opacity={env(T, w + 1.4)} />
        {Array.from({ length: 12 }, (_, k) => <line key={k} x1={160 + k * 150} y1={road + 40} x2={220 + k * 150} y2={road + 40} stroke={GREY} strokeWidth={4} opacity={env(T, w + 1.4) * 0.6} />)}
        <line x1={x0} y1={road - 150} x2={x0} y2={road + 10} stroke={SAGE} strokeWidth={4} strokeDasharray="10 8" opacity={env(T, w + 2)} />
        <line x1={x1} y1={road - 150} x2={x1} y2={road + 10} stroke={CORAL} strokeWidth={4} strokeDasharray="10 8" opacity={env(T, w + 2)} />
        <SV x={x0} y={road - 170} s="t = 0 s · 0 mph" c={SAGE} an="middle" o={env(T, w + 2)} />
        <SV x={x1} y={road - 170} s="t = 6 s · 60 mph" c={CORAL} an="middle" o={env(T, w + 9.2)} />
        {[0.25, 0.5, 0.75].map((k, i) => { const u = run - k * 0.15; return u > 0 ? <line key={i} x1={cx - 90 - i * 30} y1={road - 40 - i * 12} x2={cx - 90 - i * 30 - 60 * run} y2={road - 40 - i * 12} stroke={GREY} strokeWidth={4} strokeLinecap="round" opacity={0.5 * (run < 1 ? 1 : 0)} /> : null; })}
        <CarG x={cx} y={road} c={CORAL_T} s={1.5} o={env(T, w + 1.4)} />
      </svg>
      <div style={{ position: 'absolute', left: 60, top: 780, opacity: env(T, w + 10), padding: '12px 28px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#eeeefa', fontFamily: SERIF, fontSize: 60, color: INK }}>What is its acceleration?</div>
    </Scene>
  );
}
function Define({ T, C }) {
  const d = C.Define;
  const bar = (v, max = 10) => 900 * Math.min(v, max) / max;
  return (
    <Scene n="Define" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={d + 0.3} top={44} s="ANSWER · +10 mph EVERY SECOND" c={SAGE} />
      <div style={{ position: 'absolute', left: 60, top: 100, display: 'flex', gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((t) => { const o = env(T, d + 0.8 + t * 0.35, 0.4); return (
          <div key={t} style={{ width: 118, opacity: o, borderRadius: 8, border: `2px solid ${LINE}`, background: '#ffffff', padding: '8px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: GREY }}>{t} s</div>
            <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>{t * 10}</div>
          </div>
        ); })}
        <div style={{ alignSelf: 'center', marginLeft: 10, fontFamily: MONO, fontSize: 28, color: GREY, opacity: env(T, d + 3) }}>mph</div>
      </div>
      <Big T={T} at={d + 3.6} top={250} s="10 mph per second: your intuition was right." size={54} c={SAGE} italic />
      <Kicker T={T} at={d + 6} top={370} s="FORMALLY" />
      <Big T={T} at={d + 6.4} top={420} s="a = Δv / Δt" size={110} italic />
      <Big T={T} at={d + 8.4} top={570} s="units: m/s²  ·  “meters per second, per second”" size={48} c={GREY} />
      <div style={{ position: 'absolute', left: 1020, top: 400, width: 920, opacity: env(T, d + 10.4), fontFamily: MONO, fontSize: 32, fontWeight: 600, letterSpacing: '0.1em', color: INDIGO }}>IN SI UNITS</div>
      <Big T={T} at={d + 10.8} top={450} left={1020} s="60 mph ≈ 27 m/s" size={56} italic c={INDIGO} />
      <Big T={T} at={d + 12.4} top={530} left={1020} s="a ≈ 27 m/s ÷ 6 s ≈ 4.5 m/s²" size={56} italic c={INDIGO} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 14.6)}>
          <text x={60} y={732} fontFamily={MONO} fontSize={30} fontWeight={600} fill={GREY}>car</text>
          <rect x={260} y={700} width={bar(4.5) * eo((T - (d + 14.8)) / 1.0)} height={44} rx={6} fill={CORAL} />
          <text x={280 + bar(4.5)} y={734} fontFamily={MONO} fontSize={32} fontWeight={600} fill={INK} opacity={env(T, d + 15.6)}>{MS('4.5 m/s²')}</text>
          <text x={60} y={812} fontFamily={MONO} fontSize={30} fontWeight={600} fill={GREY}>free fall</text>
          <rect x={260} y={780} width={bar(9.8) * eo((T - (d + 15.6)) / 1.0)} height={44} rx={6} fill={INDIGO} />
          <text x={280 + bar(9.8)} y={814} fontFamily={MONO} fontSize={32} fontWeight={600} fill={INK} opacity={env(T, d + 16.4)}>{MS('g = 9.8 m/s²')}</text>
        </g>
      </svg>
      <Big T={T} at={d + 17.6} top={860} s="The car manages about half of g." size={52} italic />
    </Scene>
  );
}
function Direction({ T, C }) {
  const dr = C.Direction;
  const row = (y, at, speeding) => {
    const u = clamp((T - at) / 4, 0, 1), loop = ((T - at) % 4 + 4) % 4 / 4, k = T > at ? loop : 0;
    const x = speeding ? 300 + 700 * k * k : 300 + 700 * (1 - (1 - k) * (1 - k));
    const vl = speeding ? 80 + 260 * k : 340 - 260 * k;
    const o = env(T, at - 0.6, 0.5);
    return (
      <g opacity={o}>
        <line x1={160} y1={y} x2={1140} y2={y} stroke={INK} strokeWidth={4} />
        <CarG x={x} y={y} c={speeding ? SAGE_T : CORAL_T} s={1.1} />
        <Arr x1={x - 40} y1={y - 120} x2={x - 40 + vl} y2={y - 120} c={INDIGO} w={9} h={22} />
        <text x={x - 40} y={y - 150} fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={INDIGO}>v</text>
        <Arr x1={speeding ? x + 110 : x - 110} y1={y - 60} x2={speeding ? x + 260 : x - 260} y2={y - 60} c={CORAL} w={9} h={22} o={env(T, at + 1.2, 0.5)} />
        <text x={speeding ? x + 270 : x - 270} y={y - 48} textAnchor={speeding ? 'start' : 'end'} fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={CORAL} opacity={env(T, at + 1.2, 0.5)}>a</text>
      </g>
    );
  };
  return (
    <Scene n="Direction" T={T} C={C} ph={1.1}>
      <Kicker T={T} at={dr + 0.3} top={44} s="ANSWER · YES, BRAKING IS ACCELERATING" c={SAGE} />
      <Big T={T} at={dr + 0.6} top={92} s="Acceleration is a vector: it has a direction." size={66} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {row(420, dr + 2.4, true)}
        {row(760, dr + 6.4, false)}
      </svg>
      <Big T={T} at={dr + 3.6} top={300} left={1240} w={700} s="Speeding up: a points the same way as v." size={50} c={SAGE} />
      <Big T={T} at={dr + 7.6} top={640} left={1240} w={700} s="Slowing down: a points opposite v. Forward is +, so a is negative." size={50} c={CORAL} />
      <Big T={T} at={dr + 12} top={890} w={1880} s="The sign of a tells its direction, not whether you speed up or slow down." size={44} italic c={GREY} />
    </Scene>
  );
}
const GR = [
  { k: 'A', v0: 4, v1: 18, c: INDIGO, ans: 'speeding up', why: 'line tilts up' },
  { k: 'B', v0: 12, v1: 12, c: INK, ans: 'constant velocity', why: 'flat line' },
  { k: 'C', v0: 18, v1: 4, c: CORAL, ans: 'slowing down', why: 'line tilts down' },
];
function Graphs({ T, C }) {
  const g = C.Graphs;
  return (
    <Scene n="Graphs" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={g + 0.3} top={44} s="READ THE v–t GRAPH" />
      <Big T={T} at={g + 0.6} top={92} s="Three objects. What is each one doing?" size={66} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {GR.map((q, i) => { const x = 140 + i * 640, p = eo((T - (g + 2 + i * 1.4)) / 1.2); return (
          <VT key={i} x={x} y={300} w={460} h={420} o={env(T, g + 1.4 + i * 0.4)} tickV={[0, 10, 20]} vmax={20}>
            <line x1={x} y1={300 + 420 - (q.v0 / 20) * 420} x2={x + 440 * p} y2={300 + 420 - (lerp(q.v0, q.v1, p) / 20) * 420} stroke={q.c} strokeWidth={8} strokeLinecap="round" />
            <text x={x + 230} y={830} textAnchor="middle" fontFamily={SERIF} fontSize={64} fill={q.c} opacity={env(T, g + 2 + i * 1.4)}>{q.k}</text>
            <text x={x + 230} y={900} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={52} fill={GREY} opacity={env(T, g + 7)}>?</text>
          </VT>
        ); })}
      </svg>
    </Scene>
  );
}
function Slope({ T, C }) {
  const s = C.Slope, X = 140, Y = 330, Wd = 900, Hh = 560, vmax = 20, tmax = 6;
  const px = (t) => X + (t / tmax) * Wd, py = (v) => Y + Hh - (v / vmax) * Hh;
  const ln = eo((T - (s + 5)) / 1.0), tri = env(T, s + 7, 0.6), ln2 = eo((T - (s + 14)) / 1.0), tri2 = env(T, s + 15.4, 0.6);
  return (
    <Scene n="Slope" T={T} C={C} ph={0.9}>
      <div style={{ position: 'absolute', left: 60, top: 44, display: 'flex', gap: 22 }}>
        {GR.map((q, i) => <div key={i} style={{ opacity: env(T, s + 0.4 + i * 0.6, 0.5), padding: '10px 22px', borderRadius: 8, border: `3px solid ${q.c}`, background: '#ffffff', fontFamily: SERIF, fontSize: 44, color: INK }}><b style={{ color: q.c }}>{q.k}</b>{` · ${q.ans}`}<span style={{ fontStyle: 'italic', color: GREY }}>{` (${q.why})`}</span></div>)}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <VT x={X} y={Y} w={Wd} h={Hh} vmax={vmax} tmax={tmax} o={env(T, s + 4)} tickV={[0, 5, 10, 15, 20]} tickT={[0, 1, 2, 3, 4, 5, 6]}>
          {ln > 0 && <line x1={px(0)} y1={py(2)} x2={px(4 * ln)} y2={py(2 + 12 * ln)} stroke={INDIGO} strokeWidth={8} strokeLinecap="round" />}
          {tri > 0 && <g opacity={tri * (1 - env(T, s + 13.4, 0.5))}><path d={`M ${px(0)} ${py(2)} L ${px(4)} ${py(2)} L ${px(4)} ${py(14)}`} fill="none" stroke={SAGE} strokeWidth={5} strokeDasharray="12 8" /><text x={px(2)} y={py(2) + 50} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={42} fill={SAGE}>Δt = 4 s</text><text x={px(4) + 20} y={py(8) + 14} fontFamily={SERIF} fontStyle="italic" fontSize={42} fill={SAGE}>Δv = 12 m/s</text></g>}
          {ln2 > 0 && <line x1={px(1)} y1={py(20)} x2={px(1 + 5 * ln2)} y2={py(20 - 20 * ln2)} stroke={CORAL} strokeWidth={8} strokeLinecap="round" />}
          {tri2 > 0 && <g opacity={tri2}><path d={`M ${px(1)} ${py(20)} L ${px(1)} ${py(0)} L ${px(6)} ${py(0)}`} fill="none" stroke={SAGE} strokeWidth={5} strokeDasharray="12 8" /><text x={px(1) - 20} y={py(10)} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={SAGE}>−20</text><text x={px(3.5)} y={py(0) - 20} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={SAGE}>5 s</text></g>}
        </VT>
      </svg>
      <Kicker T={T} at={s + 4.4} top={330} left={1180} s="SLOPE OF v–t = ACCELERATION" />
      <Big T={T} at={s + 9} top={390} left={1180} s="a = 12 m/s ÷ 4 s" size={56} italic c={INDIGO} />
      <Big T={T} at={s + 10.4} top={470} left={1180} s="= +3 m/s²" size={72} c={INDIGO} />
      <Big T={T} at={s + 16.8} top={620} left={1180} s="a = −20 m/s ÷ 5 s" size={56} italic c={CORAL} />
      <Big T={T} at={s + 18.2} top={700} left={1180} s="= −4 m/s²" size={72} c={CORAL} />
      <Big T={T} at={s + 20} top={830} left={1180} w={780} s="Steeper means bigger acceleration. Downhill means negative." size={44} italic c={GREY} />
    </Scene>
  );
}
function Equations({ T, C }) {
  const e = C.Equations;
  return (
    <Scene n="Equations" T={T} C={C} ph={0.5}>
      <div style={{ position: 'absolute', left: 60, top: 60, width: 1880, height: 420, opacity: env(T, e + 0.3, 0.6), borderRadius: 12, border: `4px solid ${INK}`, background: '#ffffff', padding: '28px 40px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 600, letterSpacing: '0.12em', color: CORAL }}>REFERENCE · CONSTANT ACCELERATION</div>
          <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 500, color: GREY }}>use them today · derive them later</div>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, color: INDIGO, marginTop: 40, opacity: env(T, e + 1.6) }}>{M('v = v₀ + at')}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, color: INDIGO, marginTop: 10, opacity: env(T, e + 3) }}>{M('x = x₀ + v₀t + ½at²')}</div>
      </div>
      <Kicker T={T} at={e + 5} top={540} s="WORKED · THE CAR, FROM REST" />
      <Big T={T} at={e + 5.6} top={600} s="a = 4.5 m/s², t = 6 s" size={52} c={GREY} italic />
      <Big T={T} at={e + 7.4} top={690} s="v = 0 + (4.5)(6) = 27 m/s  ✓ about 60 mph" size={58} italic />
      <Big T={T} at={e + 10} top={790} s="x = ½(4.5)(6²) ≈ 81 m to reach it" size={58} italic />
    </Scene>
  );
}
function Asteroid({ T, C }) {
  const a = C.Asteroid, E = [200, 560], far = 960, near = lerp(far, 580, eio((T - (a + 18)) / 1.6));
  const pull = 60 * Math.pow((far - E[0]) / (near - E[0]), 2);
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.8}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, a + 0.3), fontFamily: MONO, fontSize: 40, fontWeight: 600, color: SAGE }}>{M('STOP 5 · v = 2 + (3)(4) = 14 m/s  (v = v₀ + at)')}</div>
      <Kicker T={T} at={a + 2.4} top={120} s="BACK TO 2026-XJ" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={56} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, a + 2.8)} />
        <text x={E[0]} y={E[1] + 110} textAnchor="middle" fontFamily={SERIF} fontSize={40} fill={INK} opacity={env(T, a + 2.8)}>Earth</text>
        <line x1={E[0] + 70} y1={E[1] + 100} x2={near} y2={E[1] + 100} stroke={GREY} strokeWidth={3} opacity={env(T, a + 3.4)} />
        <SV x={(E[0] + near) / 2} y={E[1] + 160} s={T < a + 18 ? 'r = 1.2 × 10^8 km = 1.2 × 10^11 m' : 'r halves → pull × 4'} c={T < a + 18 ? GREY : CORAL} an="middle" size={40} o={env(T, a + 3.4)} />
        <Rock x={near} y={E[1]} r={34} spin={T * 18} o={env(T, a + 2.8)} />
        <Arr x1={near - 50} y1={E[1]} x2={near - 50 - Math.min(pull, 260)} y2={E[1]} c={CORAL} w={8} h={20} o={env(T, a + 6)} />
      </svg>
      <Big T={T} at={a + 4.6} top={180} left={1050} s="Earth’s pull out here:" size={50} />
      <Big T={T} at={a + 5.6} top={250} left={1050} s="g = GM / r²" size={72} italic c={INDIGO} />
      <Big T={T} at={a + 7.6} top={350} left={1050} s="= (3.99 × 10^14) / (1.2 × 10^11)²" size={48} italic c={INDIGO} />
      <Big T={T} at={a + 9.4} top={430} left={1050} s="≈ 2.8 × 10^−8 m/s²" size={64} c={INDIGO} />
      <Big T={T} at={a + 11.2} top={520} left={1050} w={880} s="Far less than 0.001 m/s². Over 6 months that changes v by about 0.4 m/s, out of 8,500." size={44} italic />
      <div style={{ position: 'absolute', left: 60, top: 820, opacity: env(T, a + 14.6), padding: '10px 26px', borderRadius: 10, border: `3px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 50, color: INK }}>That’s why constant velocity worked on Day 5.</div>
      <Big T={T} at={a + 20.4} top={920} s="Closer means stronger: inverse-square. Unit 2 (and the Sun’s pull) takes it from here." size={40} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, X = 1050, Y = 300, Wd = 780, Hh = 480;
  return (
    <Scene n="Exit" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={92} s="30 m/s → 0 m/s in 5 s" size={84} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={80} y1={620} x2={900} y2={620} stroke={INK} strokeWidth={4} opacity={env(T, e + 1.4)} />
        <CarG x={300 + 300 * (1 - Math.pow(1 - clamp((T - (e + 1.6)) / 3, 0, 1), 2))} y={620} c={CORAL_T} s={1.4} o={env(T, e + 1.4)} />
        <VT x={X} y={Y} w={Wd} h={Hh} vmax={30} tmax={5} o={env(T, e + 2.6)} tickV={[0, 10, 20, 30]} tickT={[0, 1, 2, 3, 4, 5]} />
        <SV x={X + Wd / 2} y={Y + Hh / 2} s="sketch it · a = ?" c={GREY} an="middle" size={52} o={env(T, e + 3.6)} />
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
function shots7(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Warmup', 'Define', 'Direction', 'Graphs', 'Slope', 'Equations', 'Asteroid', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots7(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleV T={T} C={C} />
        <Warmup T={T} C={C} />
        <Define T={T} C={C} />
        <Direction T={T} C={C} />
        <Graphs T={T} C={C} />
        <Slope T={T} C={C} />
        <Equations T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function AccelDay7App() {
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
window.AccelDay7App = AccelDay7App;
