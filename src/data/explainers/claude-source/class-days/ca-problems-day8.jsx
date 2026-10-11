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


const ORDER = ['Title', 'Recap', 'Three', 'Strategy', 'Ball', 'Train', 'Share', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'YOUR TURN', 'A skateboarder speeds up from 2 m/s to 5 m/s in 2 s. What is the acceleration?'],
  Three: [2, 'DISCUSS', 'Invent a problem that needs Equation 3. What would it give you, and what would it ask for?'],
  Ball: [3, 'YOUR TURN', 'A bullet train starts from rest and reaches 80 m/s, accelerating at 0.50 m/s². How long does it take? List the givens first.'],
  Train: [4, 'PAIRS · PROBLEM SET', 'For each problem, write the givens, the unknown, and the missing variable before you choose an equation.'],
  Share: [5, 'SHARE-OUT', 'Present one solution. Explain WHY you chose that equation, not just what you plugged in.'],
  Exit: [6, 'EXIT TICKET', 'Which equation finds the displacement without finding the time first? Explain, calculate Δx with units, and state the assumption it needs.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Three: [2200, -1300], Strategy: [2200, 0], Ball: [0, 0], Train: [-2200, 0], Share: [-2200, 1300], Exit: [0, 1300] };
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


const EQS = [
  { e: 'v = v₀ + at', miss: 'Δx', c: INDIGO },
  { e: 'x = x₀ + v₀t + ½at²', miss: 'v', c: CORAL },
  { e: 'v² = v₀² + 2a(x − x₀)', miss: 't', c: SAGE },
];
const VARS = ['v₀', 'v', 'a', 't', 'Δx'];
function Givens({ T, at, top, left = 60, items }) {
  return (
    <div style={{ position: 'absolute', left, top, display: 'flex', flexWrap: 'wrap', gap: 14, width: 1880 - left }}>
      {items.map(([s, kind], i) => { const o = env(T, at + i * 0.35, 0.4); const col = kind === 'ask' ? CORAL : kind === 'none' ? GREY : INDIGO; return (
        <div key={i} style={{ opacity: o, transform: `translateY(${(1 - o) * 12}px)`, padding: '8px 18px', borderRadius: 8, border: `3px ${kind === 'none' ? 'dashed' : 'solid'} ${col}`, background: kind === 'ask' ? CORAL_T : '#ffffff', fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, color: kind === 'none' ? GREY : INK }}>{M(s)}</div>
      ); })}
    </div>
  );
}
function Skater({ x, y, o = 1 }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={o} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M -70 -14 L 70 -14" strokeWidth={9} />
      <circle cx={-46} cy={-2} r={10} fill="#ffffff" strokeWidth={4} /><circle cx={46} cy={-2} r={10} fill="#ffffff" strokeWidth={4} />
      <path d="M -30 -20 L -10 -90 L 26 -20 M -10 -90 L 4 -170 M 4 -150 L -40 -120 M 4 -150 L 50 -130" />
      <circle cx={8} cy={-196} r={24} fill="#ffffff" strokeWidth={5} />
    </g>
  );
}
function TitleV({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 8 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Constant acceleration</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>problem-solving</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: INDIGO }}>R5 · Pick and use the right equation of motion.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap, u = clamp((T - (r + 3)) / 2.4, 0, 1), x0 = 300, x1 = 1600, road = 640;
  const x = x0 + (x1 - x0) * (0.4 * u + 0.6 * u * u), vl = 120 + 180 * u;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · ACCELERATION" />
      <Big T={T} at={r + 0.6} top={92} s="a = Δv / Δt" size={84} italic />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={120} y1={road} x2={1880} y2={road} stroke={INK} strokeWidth={5} opacity={env(T, r + 1.4)} />
        <line x1={x0} y1={road - 300} x2={x0} y2={road + 10} stroke={SAGE} strokeWidth={4} strokeDasharray="10 8" opacity={env(T, r + 2)} />
        <line x1={x1} y1={road - 300} x2={x1} y2={road + 10} stroke={CORAL} strokeWidth={4} strokeDasharray="10 8" opacity={env(T, r + 5.4)} />
        <SV x={x0} y={road - 320} s="2 m/s" c={SAGE} an="middle" o={env(T, r + 2)} />
        <SV x={x1} y={road - 320} s="5 m/s" c={CORAL} an="middle" o={env(T, r + 5.4)} />
        <path d={`M ${x0} ${road + 70} L ${x1} ${road + 70} M ${x0} ${road + 54} L ${x0} ${road + 86} M ${x1} ${road + 54} L ${x1} ${road + 86}`} stroke={GREY} strokeWidth={4} opacity={env(T, r + 5.8)} />
        <SV x={(x0 + x1) / 2} y={road + 130} s="2 s" c={GREY} an="middle" o={env(T, r + 5.8)} />
        <Arr x1={x - 40} y1={road - 250} x2={x - 40 + vl} y2={road - 250} c={INDIGO} w={9} h={22} o={env(T, r + 2.6)} />
        <Skater x={x} y={road} o={env(T, r + 1.4)} />
      </svg>
    </Scene>
  );
}
function Three({ T, C }) {
  const t = C.Three;
  return (
    <Scene n="Three" T={T} C={C} ph={0.7}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, t + 0.3), fontFamily: MONO, fontSize: 40, fontWeight: 600, color: SAGE }}>{M('STOP 1 · a = (5 − 2) m/s ÷ 2 s = 1.5 m/s²')}</div>
      <Kicker T={T} at={t + 2.4} top={130} s="THREE EQUATIONS · CONSTANT ACCELERATION ONLY" />
      <div style={{ position: 'absolute', left: 60, top: 190, display: 'flex', gap: 40 }}>
        {EQS.map((q, i) => { const o = env(T, t + 3 + i * 1.6, 0.6), m = env(T, t + 9 + i * 1.2, 0.5); return (
          <div key={i} style={{ width: 600, height: 470, boxSizing: 'border-box', borderRadius: 12, border: `4px solid ${q.c}`, background: '#ffffff', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, padding: '30px 30px', display: 'flex', flexDirection: 'column', gap: 30 }}>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: '0.1em', color: q.c }}>{`EQUATION ${i + 1}`}</div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: INK, whiteSpace: 'nowrap' }}>{M(q.e)}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {VARS.map((v) => { const miss = v === q.miss; return <div key={v} style={{ padding: '6px 14px', borderRadius: 8, border: `3px ${miss && m > 0 ? 'dashed' : 'solid'} ${miss && m > 0 ? CORAL : LINE}`, background: miss && m > 0 ? CORAL_T : '#f6f6fb', fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: miss && m > 0 ? CORAL : INK, opacity: miss ? 1 - 0.35 * m : 1, textDecoration: miss && m > 0 ? 'line-through' : 'none' }}>{M(v)}</div>; })}
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: CORAL, opacity: m }}>{M(`no ${q.miss}`)}</div>
          </div>
        ); })}
      </div>
      <Big T={T} at={t + 13.4} top={710} s="Each equation leaves one variable out." size={64} />
      <Big T={T} at={t + 15.4} top={800} s="That missing variable is your clue." size={52} italic c={INDIGO} />
    </Scene>
  );
}
function Strategy({ T, C }) {
  const s = C.Strategy, u = clamp((T - (s + 8)) / 3.4, 0, 1), road = 420, x = 1080 + 700 * (1 - (1 - u) * (1 - u));
  const steps = ['List what’s given.', 'Name what’s asked.', 'Find the variable that’s missing, and pick the equation without it.'];
  return (
    <Scene n="Strategy" T={T} C={C} ph={1.1}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, s + 0.3), fontFamily: MONO, fontSize: 40, fontWeight: 600, color: SAGE }}>{M('STOP 2 · Equation 3 fits when the time isn’t given (or asked).')}</div>
      <Kicker T={T} at={s + 2.2} top={130} s="THE STRATEGY" />
      {steps.map((st, i) => <div key={i} style={{ position: 'absolute', left: 60, top: 190 + i * 130, width: 860, opacity: env(T, s + 2.6 + i * 1.2), display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 'none', width: 64, height: 64, borderRadius: 32, background: INDIGO, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 32, fontWeight: 600 }}>{i + 1}</div>
        <div style={{ fontFamily: SERIF, fontSize: 48, lineHeight: 1.15, color: INK, whiteSpace: 'normal' }}>{st}</div>
      </div>)}
      <Kicker T={T} at={s + 7} top={130} left={1040} s="EXAMPLE 1 · A CAR BRAKES" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={1000} y1={road} x2={1940} y2={road} stroke={INK} strokeWidth={5} opacity={env(T, s + 7)} />
        {u > 0 && <line x1={1080 + 60} y1={road - 6} x2={x - 60} y2={road - 6} stroke={GREY} strokeWidth={6} opacity={0.35} />}
        <CarG x={x} y={road} c={CORAL_T} s={1.2} o={env(T, s + 7)} />
      </svg>
      <Givens T={T} at={s + 11.6} top={460} left={1040} items={[['v₀ = 30 m/s'], ['v = 0'], ['a = −6 m/s²'], ['Δx = ?', 'ask'], ['t: not given', 'none']]} />
      <Big T={T} at={s + 15} top={680} left={1040} s="0² = 30² + 2(−6)Δx" size={58} italic c={SAGE} />
      <Big T={T} at={s + 17} top={770} left={1040} s="Δx = 900 ÷ 12 = 75 m" size={64} c={SAGE} />
      <Big T={T} at={s + 19.4} top={870} left={1040} w={880} s="Highway speed, firm braking: 75 m to stop." size={44} italic c={GREY} />
    </Scene>
  );
}
function Ball({ T, C }) {
  const b = C.Ball, tt = clamp((T - (b + 3)) / 2.4, 0, 1) * 1.531, h = 15 * tt - 4.9 * tt * tt, v = 15 - 9.8 * tt;
  const G = 900, S = 46, bx = 380, by = G - h * S;
  return (
    <Scene n="Ball" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={b + 0.3} top={44} s="EXAMPLE 2 · A BALL THROWN STRAIGHT UP" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={80} y1={G} x2={760} y2={G} stroke={INK} strokeWidth={5} opacity={env(T, b + 1)} />
        <line x1={190} y1={G} x2={190} y2={G - 12 * S} stroke={GREY} strokeWidth={3} opacity={env(T, b + 1)} />
        {[0, 4, 8, 12].map((m) => <g key={m} opacity={env(T, b + 1)}><line x1={180} y1={G - m * S} x2={200} y2={G - m * S} stroke={GREY} strokeWidth={3} /><text x={168} y={G - m * S + (m === 0 ? -14 : 10)} textAnchor="end" fontFamily={MONO} fontSize={26} fill={GREY}>{`${m} m`}</text></g>)}
        {tt >= 1.53 && <line x1={200} y1={by - 30} x2={bx - 40} y2={by - 30} stroke={SAGE} strokeWidth={4} strokeDasharray="10 8" />}
        {v > 0.4 && <Arr x1={bx + 50} y1={by} x2={bx + 50} y2={by - v * 14} c={INDIGO} w={8} h={20} o={env(T, b + 2.6)} />}
        <circle cx={bx} cy={by - 30} r={30} fill={CORAL_T} stroke={INK} strokeWidth={4} opacity={env(T, b + 1.6)} />
        <SV x={bx + 80} y={by - 40} s="v = 0 at the top" c={SAGE} size={42} o={env(T, b + 5.6)} />
      </svg>
      <Givens T={T} at={b + 6.4} top={180} left={900} items={[['v₀ = +15 m/s'], ['a = −9.8 m/s²'], ['v = 0 (top)'], ['Δx = ?', 'ask'], ['t: not given', 'none']]} />
      <div style={{ position: 'absolute', left: 900, top: 400, width: 1000, opacity: env(T, b + 8.8), padding: '10px 24px', borderRadius: 8, border: `3px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: INK, whiteSpace: 'normal', boxSizing: 'border-box' }}>Hidden given: at the very top, the ball stops for an instant.</div>
      <Big T={T} at={b + 12} top={560} left={900} s="0² = 15² + 2(−9.8)Δx" size={58} italic c={SAGE} />
      <Big T={T} at={b + 14} top={650} left={900} s="Δx = 225 ÷ 19.6 ≈ 11.5 m" size={64} c={SAGE} />
    </Scene>
  );
}
function Train({ T, C }) {
  const tr = C.Train, u = clamp((T - (tr + 1.4)) / 4, 0, 1), x = 140 + 1100 * u * u, y = 420;
  return (
    <Scene n="Train" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={tr + 0.3} top={44} s="STOP 3 · THE BULLET TRAIN" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={80} y1={y} x2={1920} y2={y} stroke={INK} strokeWidth={5} />
        <g transform={`translate(${x} ${y})`}>
          <path d="M 0 -20 L 0 -110 L 420 -110 Q 560 -110 600 -20 Z" fill="#eeeefa" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {[40, 140, 240, 340].map((wx) => <rect key={wx} x={wx} y={-92} width={70} height={36} rx={6} fill="#ffffff" stroke={INK} strokeWidth={3} />)}
          <line x1={0} y1={-40} x2={560} y2={-40} stroke={INDIGO} strokeWidth={6} />
          {[80, 200, 360, 480].map((wx) => <circle key={wx} cx={wx} cy={-14} r={12} fill="#ffffff" stroke={INK} strokeWidth={3} />)}
        </g>
      </svg>
      <Givens T={T} at={tr + 2.4} top={480} items={[['v₀ = 0 (from rest)'], ['v = 80 m/s'], ['a = 0.50 m/s²'], ['t = ?', 'ask'], ['Δx: not needed', 'none']]} />
      <Big T={T} at={tr + 5.4} top={600} s="No Δx → v = v₀ + at" size={56} italic c={INDIGO} />
      <Big T={T} at={tr + 7.4} top={690} s="80 = 0 + 0.50 t   →   t = 160 s" size={64} c={SAGE} />
      <Big T={T} at={tr + 9.6} top={790} s="about 2 minutes 40 seconds" size={48} italic c={GREY} />
      <div style={{ position: 'absolute', left: 60, top: 870, opacity: env(T, tr + 11.6), fontFamily: MONO, fontSize: 36, fontWeight: 600, letterSpacing: '0.08em', color: CORAL }}>NOW: THE PROBLEM SET, IN PAIRS</div>
    </Scene>
  );
}
function Share({ T, C }) {
  const s = C.Share;
  const rows = [['missing t', 'v² = v₀² + 2a(x − x₀)', SAGE], ['missing Δx', 'v = v₀ + at', INDIGO], ['missing v', 'x = x₀ + v₀t + ½at²', CORAL]];
  return (
    <Scene n="Share" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={s + 0.3} top={44} s="SYNTHESIZE · HOW DO I CHOOSE?" />
      <div style={{ position: 'absolute', left: 60, top: 110, display: 'flex', gap: 30 }}>
        {['Given', 'Asked', 'Connect'].map((w, i) => <div key={i} style={{ opacity: env(T, s + 0.8 + i * 0.6), padding: '14px 34px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#eeeefa', fontFamily: SERIF, fontSize: 56, color: INK }}>{`${i + 1} · ${w}`}</div>)}
      </div>
      {rows.map(([k, e, c], i) => <div key={i} style={{ position: 'absolute', left: 60, top: 300 + i * 140, opacity: env(T, s + 3.4 + i * 1.2), display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ width: 380, padding: '12px 24px', borderRadius: 8, border: `3px dashed ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, color: CORAL, boxSizing: 'border-box' }}>{M(k)}</div>
        <div style={{ fontFamily: SERIF, fontSize: 56, color: GREY }}>→</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 68, color: c }}>{M(e)}</div>
      </div>)}
      <Big T={T} at={s + 8.4} top={760} s="All three assume the acceleration stays constant." size={52} italic c={INK} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, u = clamp((T - (e + 1.6)) / 3, 0, 1), road = 560, x = 300 + 900 * (1 - (1 - u) * (1 - u));
  return (
    <Scene n="Exit" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={92} s="A cart at +12 m/s stops at constant acceleration." size={66} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={120} y1={road} x2={1880} y2={road} stroke={INK} strokeWidth={5} opacity={env(T, e + 1.2)} />
        <path d={`M 300 ${road + 60} L 1200 ${road + 60} M 300 ${road + 44} L 300 ${road + 76} M 1200 ${road + 44} L 1200 ${road + 76}`} stroke={CORAL} strokeWidth={4} opacity={env(T, e + 4.8)} />
        <SV x={750} y={road + 120} s="Δx = ?" c={CORAL} an="middle" size={50} o={env(T, e + 4.8)} />
        <Cart x={x} y={road} T={T} led={SAGE} s={1.3} o={env(T, e + 1.2)} />
      </svg>
      <Givens T={T} at={e + 5.6} top={740} items={[['v₀ = +12 m/s'], ['v = 0'], ['a = −3.0 m/s²'], ['t: not given', 'none'], ['Δx = ?', 'ask']]} />
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

function shots8(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Three', 'Strategy', 'Ball', 'Train', 'Share', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots8(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleV T={T} C={C} />
        <Recap T={T} C={C} />
        <Three T={T} C={C} />
        <Strategy T={T} C={C} />
        <Ball T={T} C={C} />
        <Train T={T} C={C} />
        <Share T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function CAProblemsDay8App() {
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
window.CAProblemsDay8App = CAProblemsDay8App;

