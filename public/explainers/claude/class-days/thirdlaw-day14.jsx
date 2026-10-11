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

const ORDER = ['Title', 'Riddle', 'Law', 'Resolve', 'Tug', 'Results', 'Asteroid', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Riddle: [1, 'ARGUE IT', 'If the cart pulls back on the horse just as hard, how does the cart ever move? Take 2 minutes.'],
  Law: [2, 'DISCUSS', 'The two forces in a pair are equal and opposite. So why don’t they cancel out?'],
  Tug: [3, 'LAB', 'Investigation 1.4: try hard pulls, soft pulls, jerky pulls, a strong vs a gentle partner. Watch both readings.'],
  Results: [4, 'DISCUSS', 'One student is much stronger. Who pulls harder on the other? What does the data say?'],
  Asteroid: [5, 'DISCUSS', 'Same size force on both. Why is the spacecraft destroyed while the asteroid barely changes?'],
  Exit: [6, 'EXIT TICKET', 'When you push against a wall, what pushes back on you with equal force?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Riddle: [0, -1300], Law: [2200, -1300], Resolve: [2200, 0], Tug: [0, 0], Results: [-2200, 0], Asteroid: [-2200, 1300], Exit: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const Floor = ({ x0, x1, y, o = 1 }) => <g opacity={o}><line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={5} />{Array.from({ length: Math.floor((x1 - x0) / 60) }, (_, k) => <line key={k} x1={x0 + k * 60 + 10} y1={y + 4} x2={x0 + k * 60 - 14} y2={y + 26} stroke={GREY} strokeWidth={3} opacity={0.6} />)}</g>;
function Block({ x, y, w = 220, h = 140, label, fill = CORAL_T, o = 1, wheels = false }) {
  return (
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h - (wheels ? 30 : 0)} width={w} height={h} rx={10} fill={fill} stroke={INK} strokeWidth={4} />
      {wheels && <g><circle cx={x - w / 3} cy={y - 18} r={18} fill="#ffffff" stroke={INK} strokeWidth={4} /><circle cx={x + w / 3} cy={y - 18} r={18} fill="#ffffff" stroke={INK} strokeWidth={4} /></g>}
      <text x={x} y={y - h / 2 - (wheels ? 30 : 0) + 14} textAnchor="middle" fontFamily={SERIF} fontSize={46} fill={INK}>{label}</text>
    </g>
  );
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 14 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Newton’s 3rd Law</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 110, lineHeight: 1.1, color: INDIGO }}>action and reaction</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: INDIGO }}>R8 · 3rd-Law force pairs, and why they never cancel.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Riddle({ T, C }) {
  const r = C.Riddle, g = 640, hx = 1200, cx = 700;
  const strain = 6 * Math.sin(T * 3);
  return (
    <Scene n="Riddle" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="A FAMOUS RIDDLE" />
      <Big T={T} at={r + 0.6} top={92} s="A horse pulls a cart." size={72} />
      <Big T={T} at={r + 2.4} top={190} s="The cart pulls back on the horse with an equal force." size={56} c={INDIGO} italic />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={200} x1={1800} y={g} o={env(T, r + 1.2)} />
        <Block x={cx} y={g} w={300} h={130} label="cart" fill="#d7d8ea" wheels o={env(T, r + 1.2)} />
        <Block x={hx} y={g} w={240} h={190} label="horse" fill={CORAL_T} o={env(T, r + 1.2)} />
        <line x1={cx + 150} y1={g - 110} x2={hx - 120} y2={g - 110} stroke={GREY} strokeWidth={5} opacity={env(T, r + 1.2)} />
        <Arr x1={hx - 130} y1={g - 250} x2={hx - 130 + 170 + strain} y2={g - 250} c={CORAL} w={9} h={22} o={env(T, r + 2.4)} />
        <SV x={hx - 130} y={g - 280} s="horse pulls cart" c={CORAL} size={38} o={env(T, r + 2.4)} />
        <Arr x1={cx + 160} y1={g - 250} x2={cx + 160 - 170 - strain} y2={g - 250} c={INDIGO} w={9} h={22} o={env(T, r + 3.4)} />
        <SV x={cx + 160} y={g - 280} s="cart pulls horse" c={INDIGO} size={38} an="end" o={env(T, r + 3.4)} />
      </svg>
      <Big T={T} at={r + 6} top={760} s="So how does the cart ever move?" size={68} c={CORAL} />
    </Scene>
  );
}
function Law({ T, C }) {
  const l = C.Law, push = 0.5 + 0.5 * Math.sin(T * 2);
  return (
    <Scene n="Law" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={l + 0.3} top={44} s="NEWTON’S 3RD LAW" />
      <Big T={T} at={l + 0.6} top={100} w={1880} s="Forces come in pairs. If A pushes B with a force F, then B pushes A with the same size force, in the opposite direction." size={56} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={300} x1={1700} y={700} o={env(T, l + 3)} />
        <Block x={820} y={700} w={200} h={160} label="A" fill={CORAL_T} o={env(T, l + 3)} />
        <Block x={1180} y={700} w={200} h={160} label="B" fill="#d7d8ea" o={env(T, l + 3)} />
        <Arr x1={1080} y1={500} x2={1080 + 120 + 40 * push} y2={500} c={CORAL} w={10} h={26} o={env(T, l + 4)} />
        <SV x={1100} y={470} s="A on B" c={CORAL} size={42} o={env(T, l + 4)} />
        <Arr x1={920} y1={500} x2={920 - 120 - 40 * push} y2={500} c={INDIGO} w={10} h={26} o={env(T, l + 5)} />
        <SV x={900} y={470} s="B on A" c={INDIGO} size={42} an="end" o={env(T, l + 5)} />
      </svg>
      <Big T={T} at={l + 7} top={800} s="Equal size. Opposite direction. Always, at every instant." size={54} c={INDIGO} italic />
    </Scene>
  );
}
function Resolve({ T, C }) {
  const r = C.Resolve, g = 700, u = clamp((T - (r + 12)) / 4, 0, 1), dx = 260 * u * u;
  return (
    <Scene n="Resolve" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={r + 0.3} top={44} s="ANSWER · THEY ACT ON DIFFERENT OBJECTS" c={SAGE} />
      <Big T={T} at={r + 0.6} top={92} w={1880} s="Forces only cancel when they act on the SAME object. A 3rd-law pair never does." size={52} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={140} x1={1860} y={g} o={env(T, r + 2)} />
        <Block x={560 + dx} y={g} w={280} h={120} label="cart" fill="#d7d8ea" wheels o={env(T, r + 2)} />
        <Block x={1300 + dx} y={g} w={240} h={180} label="horse" fill={CORAL_T} o={env(T, r + 2)} />
        <line x1={700 + dx} y1={g - 100} x2={1180 + dx} y2={g - 100} stroke={GREY} strokeWidth={5} opacity={env(T, r + 2)} />
        <Arr x1={700 + dx} y1={g - 230} x2={880 + dx} y2={g - 230} c={CORAL} w={9} h={22} o={env(T, r + 3)} />
        <SV x={560 + dx} y={g - 260} s="on the cart: horse pulls" c={CORAL} size={36} an="middle" o={env(T, r + 3)} />
        <Arr x1={420 + dx} y1={g - 50} x2={340 + dx} y2={g - 50} c={GREY} w={8} h={20} o={env(T, r + 4.4)} />
        <SV x={330 + dx} y={g - 70} s="friction" c={GREY} size={34} an="end" o={env(T, r + 4.4)} />
        <Arr x1={1180 + dx} y1={g - 260} x2={1000 + dx} y2={g - 260} c={INDIGO} w={9} h={22} o={env(T, r + 6)} />
        <SV x={1300 + dx} y={g - 290} s="on the horse: cart pulls back" c={INDIGO} size={36} an="middle" o={env(T, r + 6)} />
        <Arr x1={1260 + dx} y1={g + 40} x2={1460 + dx} y2={g + 40} c={SAGE} w={12} h={28} o={env(T, r + 8)} />
        <SV x={1360 + dx} y={g + 96} s="ground pushes the horse forward" c={SAGE} size={38} an="middle" o={env(T, r + 8)} />
      </svg>
      <Big T={T} at={r + 10.4} top={850} w={1880} s="Ground’s push on the horse > the cart’s pull back, so the horse speeds up. The horse’s pull on the cart > friction, so the cart speeds up too." size={42} italic c={GREY} />
    </Scene>
  );
}
function Sensor({ x, y, flip = false, v, label, c }) {
  return (
    <g>
      <rect x={x - 110} y={y - 60} width={220} height={120} rx={14} fill={SAGE_T} stroke={INK} strokeWidth={4} />
      <text x={x} y={y - 4} textAnchor="middle" fontFamily={MONO} fontSize={26} fontWeight={600} fill={INK}>{label}</text>
      <text x={x} y={y + 38} textAnchor="middle" fontFamily={MONO} fontSize={34} fontWeight={600} fill={c}>{`${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} N`}</text>
      <path d={flip ? `M ${x - 110} ${y} l -40 0` : `M ${x + 110} ${y} l 40 0`} stroke={INK} strokeWidth={6} />
    </g>
  );
}
const pullAt = (t) => 6 + 4 * Math.sin(t * 1.3) + 3 * Math.max(0, Math.sin(t * 3.7)) ** 6 * 4;
function Tug({ T, C }) {
  const t0 = C.Tug, f = T > t0 + 3 ? pullAt(T - t0) : 0, sh = f * 2;
  return (
    <Scene n="Tug" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={t0 + 0.3} top={44} s="INVESTIGATION 1.4 · TUG-OF-WAR WITH FORCE SENSORS" />
      <Big T={T} at={t0 + 0.6} top={92} s="Two force sensors, hooked together. Both on one screen." size={56} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, t0 + 1.4)}>
          <Sensor x={760 - sh} y={420} label="sensor A" v={f} c={CORAL} />
          <Sensor x={1240 + sh} y={420} flip label="sensor B" v={-f} c={INDIGO} />
          <line x1={910 - sh} y1={420} x2={1090 + sh} y2={420} stroke={INK} strokeWidth={6} />
          <circle cx={1000} cy={420} r={14} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <Arr x1={640 - sh} y1={420} x2={460 - sh - f * 6} y2={420} c={CORAL} w={10} h={24} />
          <Arr x1={1360 + sh} y1={420} x2={1540 + sh + f * 6} y2={420} c={INDIGO} w={10} h={24} />
          <SV x={400} y={360} s="student 1 pulls" c={CORAL} size={38} an="middle" />
          <SV x={1600} y={360} s="student 2 pulls" c={INDIGO} size={38} an="middle" />
        </g>
      </svg>
      <Big T={T} at={t0 + 6} top={600} w={1880} s="Predict: if one student pulls harder, will the two readings match?" size={52} c={INDIGO} italic />
      <Big T={T} at={t0 + 9.4} top={720} w={1880} s="Try: hard vs soft · strong vs gentle partner · steady vs jerky." size={46} c={GREY} />
    </Scene>
  );
}
function Results({ T, C }) {
  const r = C.Results, X = 140, Y = 340, Wd = 1720, Hh = 420, tm = 8, up = clamp(T - (r + 2), 0, tm);
  const px = (t) => X + (t / tm) * Wd, py = (v) => Y + Hh / 2 - (v / 20) * (Hh / 2);
  const n = Math.floor(up / 0.04);
  const pa = Array.from({ length: n + 1 }, (_, k) => { const t = k * 0.04; return (k ? 'L ' : 'M ') + px(t).toFixed(1) + ' ' + py(pullAt(t)).toFixed(1); }).join(' ');
  const pb = Array.from({ length: n + 1 }, (_, k) => { const t = k * 0.04; return (k ? 'L ' : 'M ') + px(t).toFixed(1) + ' ' + py(-pullAt(t)).toFixed(1); }).join(' ');
  return (
    <Scene n="Results" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={r + 0.3} top={44} s="WHAT THE SENSORS SHOW" c={SAGE} />
      <Big T={T} at={r + 0.6} top={92} s="Every pull, every instant: a mirror image." size={64} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, r + 1.2)}>
          <rect x={X} y={Y} width={Wd} height={Hh} fill="#fbfbfe" stroke={TINT} strokeWidth={2} />
          <line x1={X} y1={py(0)} x2={X + Wd} y2={py(0)} stroke={INK} strokeWidth={3} />
          {[-20, -10, 10, 20].map((v) => <g key={v}><line x1={X} y1={py(v)} x2={X + Wd} y2={py(v)} stroke={TINT} strokeWidth={2} /><text x={X - 14} y={py(v) + 10} textAnchor="end" fontFamily={MONO} fontSize={26} fill={GREY}>{v}</text></g>)}
          <text x={X - 14} y={py(0) + 10} textAnchor="end" fontFamily={MONO} fontSize={26} fill={GREY}>0</text>
          <text x={X + 10} y={Y - 16} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>force (N)</text>
          <text x={X + Wd} y={Y + Hh + 44} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>time (s)</text>
          <path d={pa} fill="none" stroke={CORAL} strokeWidth={5} />
          <path d={pb} fill="none" stroke={INDIGO} strokeWidth={5} />
          <text x={X + Wd - 20} y={py(16)} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={38} fill={CORAL}>sensor A</text>
          <text x={X + Wd - 20} y={py(-16) + 24} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize={38} fill={INDIGO}>sensor B</text>
        </g>
      </svg>
      <Big T={T} at={r + 11} top={830} w={1880} s="Equal in size, opposite in sign, even for jerky pulls. Newton’s 3rd Law, confirmed by data." size={46} c={SAGE} />
    </Scene>
  );
}
function Asteroid({ T, C }) {
  const a = C.Asteroid, hit = a + 4, u = clamp((T - (a + 1)) / 3, 0, 1);
  const sx = lerp(300, 1180, u), flash = win(T, hit, hit + 0.8, 0.15);
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.8}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, a + 0.3), fontFamily: MONO, fontSize: 36, fontWeight: 600, color: SAGE }}>STOP 4 · Neither. The sensors read equal forces, even with a much stronger student.</div>
      <Kicker T={T} at={a + 2} top={120} s="BACK TO 2026-XJ · A KINETIC IMPACTOR" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Rock x={1460} y={500} r={200} spin={T * 4} o={env(T, a + 1)} />
        {T < hit && <g opacity={env(T, a + 1)}><rect x={sx - 40} y={500} width={80} height={40} rx={6} fill="#d7d8ea" stroke={INK} strokeWidth={3} /><rect x={sx - 110} y={510} width={60} height={20} fill={SAGE_T} stroke={INK} strokeWidth={2} /><line x1={sx - 150} y1={520} x2={sx - 260} y2={520} stroke={GREY} strokeWidth={3} strokeDasharray="10 10" /></g>}
        {T >= hit && <g opacity={env(T, hit, 0.3)}><path d="M 1150 500 L 1180 512 L 1170 528 L 1192 540 L 1160 546 Z" fill="#d7d8ea" stroke={INK} strokeWidth={3} strokeLinejoin="round" /><line x1={1180} y1={560} x2={1180} y2={720} stroke={GREY} strokeWidth={2} strokeDasharray="6 6" /></g>}
        {flash > 0 && <circle cx={1190} cy={520} r={40 + 80 * (1 - flash)} fill={CORAL} opacity={0.5 * flash} />}
        <Arr x1={1210} y1={740} x2={1370} y2={740} c={CORAL} w={10} h={24} o={env(T, hit + 0.8)} />
        <SV x={1290} y={796} s="craft on asteroid" c={CORAL} size={34} an="middle" o={env(T, hit + 0.8)} />
        <Arr x1={1170} y1={740} x2={1010} y2={740} c={INDIGO} w={10} h={24} o={env(T, hit + 1.6)} />
        <SV x={990} y={752} s="asteroid on craft" c={INDIGO} size={34} an="end" o={env(T, hit + 1.6)} />
      </svg>
      <Big T={T} at={hit + 2.6} top={200} s="Same size force on each, for the same instant." size={48} />
      <div style={{ position: 'absolute', left: 60, top: 850, display: 'flex', gap: 40, opacity: env(T, hit + 5) }}>
        <div style={{ padding: '12px 24px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', fontFamily: SERIF, fontSize: 42, color: INK }}>{M('spacecraft ≈ 600 kg')}</div>
        <div style={{ padding: '12px 24px', borderRadius: 10, border: `3px solid ${CORAL}`, background: '#ffffff', fontFamily: SERIF, fontSize: 42, color: INK }}>{M('2026-XJ ≈ 3.5 × 10^11 kg')}</div>
      </div>
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, lean = 4 * Math.sin(T * 2);
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>{M('STOP 5 · a = F/m. Same F, but the asteroid has about 6 × 10^8 times the mass, so its velocity barely changes. The craft stops dead. It still did its job: it transferred its motion.')}</div>
      <Kicker T={T} at={e + 3} top={200} s="EXIT TICKET" />
      <Big T={T} at={e + 3.4} top={250} s="You push on a wall." size={80} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, e + 4)}>
          <rect x={1300} y={380} width={80} height={520} fill="#d7d8ea" stroke={INK} strokeWidth={4} />
          {Array.from({ length: 6 }, (_, k) => <line key={k} x1={1300} y1={420 + k * 80} x2={1380} y2={460 + k * 80} stroke={INK} strokeWidth={2} opacity={0.4} />)}
          <Floor x0={500} x1={1300} y={900} />
          <circle cx={1000 + lean} cy={520} r={44} fill="#ffffff" stroke={INK} strokeWidth={6} />
          <path d={`M ${1000 + lean} 564 L ${980} 740 M 980 740 L 930 900 M 980 740 L 1040 900 M ${995 + lean} 620 L 1300 600`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <Arr x1={1180} y1={560} x2={1290} y2={560} c={CORAL} w={9} h={22} o={env(T, e + 5)} />
        <SV x={1280} y={470} s="you on the wall" c={CORAL} size={36} an="end" o={env(T, e + 5)} />
        <Arr x1={1180} y1={640} x2={1080} y2={640} c={INDIGO} w={9} h={22} dash="14 10" o={env(T, e + 6)} />
        <SV x={1130} y={700} s="? on you" c={INDIGO} size={46} an="middle" o={env(T, e + 6)} />
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




function shots14(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Riddle', 'Law', 'Resolve', 'Tug', 'Results', 'Asteroid', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots14(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Riddle T={T} C={C} />
        <Law T={T} C={C} />
        <Resolve T={T} C={C} />
        <Tug T={T} C={C} />
        <Results T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function ThirdLawDay14App() {
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
window.ThirdLawDay14App = ThirdLawDay14App;




