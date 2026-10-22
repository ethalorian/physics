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
    if (ch === '_') { if (str.slice(i + 1, i + 4) === 'net') { push('sub', 'net'); i += 4; continue; } push('sub', str[i + 1]); i += 2; continue; }
    if (ch === '₀') { push('sub', '0'); i++; continue; }
    if (ch === '₁') { push('sub', '1'); i++; continue; }
    if (ch === '₂') { push('sub', '2'); i++; continue; }
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

const ORDER = ['Title', 'Check', 'Types', 'Demos', 'Classify', 'Asteroid', 'Exit', 'Marz', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Check: [1, 'QUICK CHECK', 'State conservation of momentum. When does it apply?'],
  Types: [2, 'PREDICT', 'Superball, clay ball, Velcro carts. Which keeps the most kinetic energy? Which keeps its momentum?'],
  Demos: [3, 'DEMO', 'Run each demo. After each one, ask: where did the energy go?'],
  Classify: [4, 'PAIR-SHARE', 'Classify all 8 collisions: elastic, inelastic or perfectly inelastic. Be ready to defend one.'],
  Exit: [5, 'EXIT TICKET', 'A meteorite buries itself in the desert. What kind of collision is this? Where did its kinetic energy go?'],
  Marz: [6, 'CHECK-IN', 'Where are you on K4? Rate yourself 0–4. Tomorrow: Vernier collision lab.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Check: [0, -1300], Types: [2200, -1300], Demos: [2200, 0], Classify: [0, 0], Asteroid: [-2200, 0], Exit: [-2200, 1300], Marz: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const KINDS = [['ELASTIC', 'bounce · no KE lost', INDIGO, 1], ['INELASTIC', 'bounce · some KE lost', CORAL, 0.45], ['PERFECTLY INELASTIC', 'stick together · most KE lost', SAGE, 0.1]];
// a ball dropped from height h0 onto the floor, bouncing with coefficient e; returns height at time t (period-normalised)
function bounceY(t, e, h0 = 1) {
  const g = 2; let h = h0, tt = t, v = 0;
  let tf = Math.sqrt((2 * h) / g);
  if (tt < tf) return h - 0.5 * g * tt * tt;
  tt -= tf; v = Math.sqrt(2 * g * h) * e;
  for (let k = 0; k < 8 && v > 0.02; k++) { const tb = (2 * v) / g; if (tt < tb) return v * tt - 0.5 * g * tt * tt; tt -= tb; v *= e; }
  return 0;
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 3 · DAY 6 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Three kinds of collision</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 62, lineHeight: 1.15, color: INDIGO, whiteSpace: 'normal', width: 1600 }}>momentum is always conserved · kinetic energy only sometimes</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>K4 · Distinguish elastic, inelastic and perfectly inelastic collisions.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Check({ T, C }) {
  const c = C.Check;
  return (
    <Scene n="Check" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={c + 0.3} top={44} s="QUICK CHECK · FROM DAY 5" />
      <Big T={T} at={c + 0.8} top={170} s="The rule?" size={90} c={INDIGO} />
      <Big T={T} at={c + 2.2} top={330} s="The condition?" size={90} c={CORAL} />
    </Scene>
  );
}
function Types({ T, C }) {
  const t = C.Types;
  return (
    <Scene n="Types" T={T} C={C} ph={0.6}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, t + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>{M('STOP 1 · Σp before = Σp after, when there’s no net external force (negligible external impulse) on the system.')}</div>
      <div style={{ position: 'absolute', left: 60, top: 170, display: 'flex', gap: 30 }}>
        {KINDS.map(([k, d, c, ke], i) => <div key={i} style={{ width: 600, opacity: env(T, t + 1.6 + i * 1.4), padding: '24px 30px', borderRadius: 12, border: `4px solid ${c}`, background: '#ffffff', boxSizing: 'border-box', whiteSpace: 'normal', height: 540, position: 'relative' }}>
          <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 600, letterSpacing: '0.06em', color: c }}>{k}</div>
          <div style={{ fontFamily: SERIF, fontSize: 44, color: INK, marginTop: 12 }}>{d}</div>
          <div style={{ position: 'absolute', left: 30, top: 230, fontFamily: MONO, fontSize: 26, fontWeight: 600, color: GREY }}>MOMENTUM</div>
          <div style={{ position: 'absolute', left: 30, top: 270, width: 540, height: 40, borderRadius: 6, background: TINT }}><div style={{ width: `${100 * eo((T - (t + 2.2 + i * 1.4)) / 1)}%`, height: '100%', borderRadius: 6, background: INK }}></div></div>
          <div style={{ position: 'absolute', left: 30, top: 340, fontFamily: MONO, fontSize: 26, fontWeight: 600, color: GREY }}>KINETIC ENERGY KEPT</div>
          <div style={{ position: 'absolute', left: 30, top: 380, width: 540, height: 40, borderRadius: 6, background: TINT }}><div style={{ width: `${100 * ke * eo((T - (t + 2.6 + i * 1.4)) / 1)}%`, height: '100%', borderRadius: 6, background: c }}></div></div>
          <div style={{ position: 'absolute', left: 30, top: 450, fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: SAGE, opacity: env(T, t + 2.6 + i * 1.4) }}>p conserved ✓</div>
        </div>)}
      </div>
      <Big T={T} at={t + 7} top={760} w={1880} s="All three conserve momentum. Only elastic conserves kinetic energy." size={48} c={INDIGO} />
      <Big T={T} at={t + 9} top={850} w={1880} s="(Bars are sketches, not measurements. Truly elastic collisions are an ideal; superballs come close.)" size={34} italic c={GREY} />
    </Scene>
  );
}
function Demos({ T, C }) {
  const d = C.Demos, G = 760, H = 460, cols = [340, 1000, 1660];
  const t1 = Math.max(0, (T - (d + 1.2)) * 1.1);
  const items = [['superball', 0.9, INDIGO, 'nearly elastic', 'a little heat and sound'], ['clay ball', 0.25, CORAL, 'inelastic', 'deforms: heat, sound, a squashed shape'], ['Velcro carts', 0, SAGE, 'perfectly inelastic', 'they stick: heat, sound, bent Velcro']];
  return (
    <Scene n="Demos" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={d + 0.3} top={44} s="ANSWER · THE SUPERBALL KEEPS THE MOST KE · ALL THREE CONSERVE p" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {items.slice(0, 2).map(([n, e, c], i) => { const y = G - 30 - H * bounceY(t1 % 4, e); return (
          <g key={i} opacity={env(T, d + 0.8 + i * 0.3)}>
            <rect x={cols[i] - 200} y={G} width={400} height={40} fill="#c6c7dc" stroke={INK} strokeWidth={3} />
            {e > 0.5 ? <circle cx={cols[i]} cy={y} r={30} fill={c} stroke={INK} strokeWidth={3} /> : <ellipse cx={cols[i]} cy={Math.min(y, G - 22)} rx={y >= G - 32 ? 40 : 30} ry={y >= G - 32 ? 22 : 30} fill={c} stroke={INK} strokeWidth={3} />}
          </g>
        ); })}
        {(() => { const u = clamp((T - (d + 1.6)) / 1.6, 0, 1), xa = lerp(cols[2] - 260, cols[2] - 70, u), stuck = u >= 1, td = Math.max(0, T - (d + 3.2)), xs = stuck ? Math.min(td * 40, 120) : 0; return (
          <g opacity={env(T, d + 1.4)}>
            <line x1={cols[2] - 300} y1={G} x2={cols[2] + 300} y2={G} stroke={INK} strokeWidth={4} />
            <rect x={xa - 70 + xs} y={G - 90} width={130} height={70} rx={8} fill={SAGE_T} stroke={INK} strokeWidth={3} />
            <rect x={cols[2] - 10 + (stuck ? xs : 0)} y={G - 90} width={130} height={70} rx={8} fill="#d7d8ea" stroke={INK} strokeWidth={3} />
            {stuck && <rect x={cols[2] - 16 + xs} y={G - 80} width={12} height={50} fill={SAGE} />}
          </g>
        ); })()}
      </svg>
      {items.map(([n, e, c, k, w], i) => <div key={i} style={{ position: 'absolute', left: cols[i] - 290, top: 830, width: 580, textAlign: 'center', opacity: env(T, d + 4 + i * 0.8) }}>
        <div style={{ fontFamily: SERIF, fontSize: 42, color: c }}>{`${n}: ${k}`}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: GREY, marginTop: 6, whiteSpace: 'normal' }}>{w}</div>
      </div>)}
      <Big T={T} at={d + 7.4} top={120} w={1880} s="Lost KE isn’t destroyed: it becomes heat, sound, and bent or squashed material." size={44} />
    </Scene>
  );
}
const CL = [['car crash, cars crumple', 'inelastic'], ['billiard balls', 'nearly elastic'], ['football tackle, players hold on', 'perfectly inelastic'], ['baseball off a bat', 'inelastic'], ['asteroid impact', 'perfectly inelastic'], ['two magnets repel, no contact', 'nearly elastic'], ['a dart sticks in a board', 'perfectly inelastic'], ['a tennis ball bounce', 'inelastic']];
function Classify({ T, C }) {
  const c = C.Classify;
  return (
    <Scene n="Classify" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={c + 0.3} top={44} s="CLASSIFY · ELASTIC, INELASTIC OR PERFECTLY INELASTIC?" />
      <div style={{ position: 'absolute', left: 60, top: 120, display: 'grid', gridTemplateColumns: 'repeat(2, 920px)', gap: '22px 40px' }}>
        {CL.map(([a], i) => <div key={i} style={{ opacity: env(T, c + 0.8 + i * 0.4), padding: '18px 26px', borderRadius: 10, border: `3px solid ${LINE}`, background: '#ffffff', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: INK, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 28, fontWeight: 600, flex: 'none' }}>{i + 1}</div>
          <div style={{ fontFamily: SERIF, fontSize: 44, color: INK }}>{a}</div>
        </div>)}
      </div>
    </Scene>
  );
}
function Asteroid({ T, C }) {
  const a = C.Asteroid, colMap = { 'nearly elastic': INDIGO, 'inelastic': CORAL, 'perfectly inelastic': SAGE };
  const E = [1640, 800], rk = clamp((T - (a + 7)) / 1.6, 0, 1), rx = lerp(1180, E[0] - 106, rk * rk), ry = lerp(560, E[1] - 106, rk * rk), hit = rk >= 1, fl = hit && T < a + 9.4 ? 1 - (T - (a + 8.6)) / 0.8 : 0;
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={a + 0.3} top={44} s="STOP 4 ANSWERS" c={SAGE} />
      <div style={{ position: 'absolute', left: 60, top: 110, display: 'flex', flexDirection: 'column', gap: 12, width: 980 }}>
        {CL.map(([q, k], i) => <div key={i} style={{ opacity: env(T, a + 0.6 + i * 0.25, 0.4), display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: SERIF, fontSize: 36, color: INK }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: GREY, width: 30 }}>{i + 1}</span>
          <span style={{ width: 560 }}>{q}</span>
          <span style={{ fontStyle: 'italic', color: colMap[k] }}>{k}</span>
        </div>)}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={150} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, a + 6.4)} />
        <SV x={E[0]} y={E[1] + 14} s="Earth" c={INK} size={44} an="middle" o={env(T, a + 6.4)} />
        {!hit && <Rock x={rx} y={ry} r={24} spin={T * 30} o={env(T, a + 6.6)} />}
        {fl > 0 && <circle cx={E[0] - 106} cy={E[1] - 106} r={20 + 80 * (1 - fl)} fill={CORAL} opacity={0.6 * fl} />}
      </svg>
      <Big T={T} at={a + 9.6} top={150} left={1140} w={800} s="An asteroid striking Earth: perfectly inelastic. It becomes part of Earth." size={40} c={SAGE} />
      <Big T={T} at={a + 11.4} top={680} left={60} w={1000} s="A flyby with no contact: gravity alone, close to elastic. DART: inelastic, in between." size={38} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, G = 520, u = clamp((T - (e + 1)) / 1.2, 0, 1), mx = lerp(300, 700, u), my = lerp(140, G - 10, u * u), hit = u >= 1, fl = hit && T < e + 3 ? 1 - (T - (e + 2.2)) / 0.8 : 0;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <rect x={0} y={G} width={CW} height={520} fill="#ecd9b6" opacity={env(T, e + 0.6)} />
        {!hit && <g opacity={env(T, e + 0.6)}><Rock x={mx} y={my} r={22} spin={T * 40} /><line x1={mx - 30} y1={my - 20} x2={mx - 160} y2={my - 90} stroke={CORAL} strokeWidth={4} opacity={0.6} /></g>}
        {hit && <path d={`M 600 ${G} Q 700 ${G + 90} 800 ${G}`} fill="#d9c49e" stroke={INK} strokeWidth={3} />}
        {fl > 0 && <circle cx={700} cy={G} r={30 + 120 * (1 - fl)} fill={CORAL} opacity={0.5 * fl} />}
      </svg>
      <Big T={T} at={e + 3} top={150} left={1100} w={840} s="A meteorite buries itself in the desert." size={50} />
      <Big T={T} at={e + 4} top={300} left={1100} w={840} s="What kind of collision? Where did its KE go?" size={46} c={INDIGO} italic />
    </Scene>
  );
}
function Marz({ T, C }) {
  const s = C.Marz;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Marz" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>K4</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK, marginTop: 6 }}>Distinguish elastic, inelastic and perfectly inelastic collisions.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
      <Big T={T} at={s + 3.4} top={700} s="Tomorrow: the Vernier collision lab." size={52} c={INDIGO} italic />
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





























function shotsU3D6(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Check', 'Types', 'Demos', 'Classify', 'Asteroid', 'Exit', 'Marz'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU3D6(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Check T={T} C={C} />
        <Types T={T} C={C} />
        <Demos T={T} C={C} />
        <Classify T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
        <Marz T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U3Day6App() {
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
window.U3Day6App = U3Day6App;





























