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

const ORDER = ['Title', 'Stock', 'Rate', 'Workshop', 'Reconvene', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Rate: [1, 'SELF-ASSESS', 'Rate yourself 0–4 on every target. Be honest: check each rating against your actual work.'],
  Workshop: [2, 'WORKSHOP · 25 MIN', 'Choose ONE or TWO targets. Pick a station. Goal: fix at least one specific weak spot.'],
  Reconvene: [3, 'SHARE', 'Share ONE thing you figured out today that you hadn’t gotten before.'],
  Exit: [4, 'EXIT TICKET', 'Which target do you still feel weakest on? What is your plan to fix it before the transfer task?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Stock: [0, -1300], Rate: [2200, -1300], Workshop: [2200, 0], Reconvene: [0, 0], Exit: [-2200, 0] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const TG = [
  ['K', INDIGO, 'KNOW', [['K1', 'position · distance · displacement'], ['K2', 'name the forces']]],
  ['R', CORAL, 'REASON', [['R1', 'what we know about 2026-XJ'], ['R2', 'v–t graphs + components'], ['R3', 'predict a position'], ['R4', 'acceleration from v–t'], ['R5', 'choose the right equation'], ['R6', 'Newton’s 1st Law'], ['R7', 'F = ma, net force first'], ['R8', '3rd-Law pairs'], ['R9', 'net force from an FBD'], ['R10', 'static vs kinetic friction'], ['R11', 'equilibrium: ΣF = 0']]],
  ['S', SAGE, 'SKILL', [['S1', 'velocity from p–t slope'], ['S2', 'add + split vectors'], ['S3', 'a vs m data'], ['S4', 'a vs F data'], ['S5', 'complete FBD']]],
];
const DEMO = { K1: 4, K2: 3, R1: 3, R2: 2, R3: 2, R4: 3, R5: 1, R6: 4, R7: 3, R8: 2, R9: 1, R10: 3, R11: 2, S1: 4, S2: 2, S3: 3, S4: 3, S5: 2 };
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 1 · BEFORE THE TRANSFER TASK</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Workshop</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 110, lineHeight: 1.1, color: INDIGO }}>and revision</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: INDIGO }}>R12 · Find your own weak spots and fix them before the transfer task.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Stock({ T, C }) {
  const s = C.Stock;
  let k = 0;
  return (
    <Scene n="Stock" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={s + 0.3} top={40} s="STOCKTAKING · EVERY UNIT 1 TARGET SO FAR" />
      <div style={{ position: 'absolute', left: 60, top: 100, width: 1880, display: 'flex', gap: 30 }}>
        {TG.map(([g, c, lab, items], gi) => (
          <div key={gi} style={{ flex: gi === 1 ? 1.25 : 1, minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: '0.12em', color: c, opacity: env(T, s + 0.8 + gi * 0.4), marginBottom: 12 }}>{lab}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(([id, t]) => { const at = s + 1.2 + (k++) * 0.28; return (
                <div key={id} style={{ opacity: env(T, at, 0.4), transform: `translateY(${(1 - env(T, at, 0.4)) * 10}px)`, display: 'flex', alignItems: 'center', gap: 14, padding: '8px 14px', borderRadius: 8, border: `2px solid ${LINE}`, background: '#ffffff' }}>
                  <span style={{ flex: 'none', width: 64, fontFamily: MONO, fontSize: 26, fontWeight: 600, color: c }}>{id}</span>
                  <span style={{ fontFamily: SERIF, fontSize: 32, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{M(t)}</span>
                </div>
              ); })}
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}
function Rate({ T, C }) {
  const r = C.Rate;
  const scale = [['0', 'not yet', CORAL], ['1–2', 'still learning', '#c9963f'], ['3–4', 'got it', SAGE]];
  const all = TG.flatMap(([g, c, l, items]) => items.map(([id]) => [id, c]));
  return (
    <Scene n="Rate" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={r + 0.3} top={40} s="THE 0–4 SCALE · SAME AS THE RUBRIC" />
      <div style={{ position: 'absolute', left: 60, top: 100, display: 'flex', gap: 24 }}>
        {scale.map(([n, t, c], i) => <div key={i} style={{ opacity: env(T, r + 0.6 + i * 0.6), padding: '12px 28px', borderRadius: 10, border: `3px solid ${c}`, background: '#ffffff', display: 'flex', alignItems: 'baseline', gap: 16 }}><span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 600, color: c }}>{n}</span><span style={{ fontFamily: SERIF, fontSize: 44, color: INK }}>{t}</span></div>)}
      </div>
      <Big T={T} at={r + 2.8} top={210} s="An example sheet:" size={44} italic c={GREY} />
      <div style={{ position: 'absolute', left: 60, top: 280, width: 1880, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 40, rowGap: 12 }}>
        {all.map(([id, c], i) => { const v = DEMO[id], at = r + 3.4 + i * 0.22, fill = clamp((T - at) / 0.5, 0, 1), low = v <= 1 && T > r + 9.4; return (
          <div key={id} style={{ opacity: env(T, at - 0.2, 0.3), display: 'flex', alignItems: 'center', gap: 14, padding: '4px 10px', borderRadius: 8, background: low ? CORAL_T : 'transparent', border: `2px solid ${low ? CORAL : 'transparent'}` }}>
            <span style={{ width: 64, fontFamily: MONO, fontSize: 26, fontWeight: 600, color: c }}>{id}</span>
            <div style={{ display: 'flex', gap: 6 }}>{[1, 2, 3, 4].map((q) => <div key={q} style={{ width: 54, height: 22, borderRadius: 4, border: `2px solid ${LINE}`, background: q <= v * fill ? (v <= 1 ? CORAL : v <= 2 ? '#c9963f' : SAGE) : '#ffffff' }}></div>)}</div>
            <span style={{ fontFamily: MONO, fontSize: 26, color: GREY }}>{fill > 0.95 ? v : ''}</span>
          </div>
        ); })}
      </div>
      <Big T={T} at={r + 9.4} top={880} w={1880} s="Weakest here: R5 and R9. Those are the ones to work on today." size={46} c={CORAL} />
    </Scene>
  );
}
const STATIONS = [
  ['REDO', 'Re-do problems', 'worksheets from earlier in the unit', INDIGO],
  ['LAB', 'Re-run an investigation', 'if it’s the one that confused you', SAGE],
  ['WATCH', 'Replay a lesson', 'any Day’s in-class video, or a short mini-lecture', CORAL],
  ['COACH', 'Teacher coaching', 'sign up for a 5-minute slot', INK],
  ['PEER', 'Work with a peer', 'someone strong where you’re weak', '#8a7bb8'],
];
function Workshop({ T, C }) {
  const w = C.Workshop, cyc = Math.floor(((T - w - 3) / 2.4)) % 5, dotO = env(T, w + 3);
  const sx = (i) => 60 + i * 380 + 170;
  const tgt = sx(Math.max(0, cyc)), dx = tgt + 30 * Math.sin(T * 2);
  return (
    <Scene n="Workshop" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={w + 0.3} top={40} s="DIFFERENTIATED WORKSHOP · 10–35 MIN" />
      <Big T={T} at={w + 0.6} top={90} s="Pick the station that fixes YOUR weak spot." size={60} />
      <div style={{ position: 'absolute', left: 60, top: 260, display: 'flex', gap: 30 }}>
        {STATIONS.map(([k, t, d, c], i) => { const on = dotO > 0 && i === cyc; return (
          <div key={i} style={{ width: 350, height: 420, boxSizing: 'border-box', opacity: env(T, w + 1.2 + i * 0.5), transform: `translateY(${on ? -10 : 0}px)`, borderRadius: 12, border: `${on ? 5 : 3}px solid ${c}`, background: on ? '#fbfbfe' : '#ffffff', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: '0.12em', color: c }}>{k}</div>
            <div style={{ fontFamily: SERIF, fontSize: 46, lineHeight: 1.1, color: INK, whiteSpace: 'normal' }}>{t}</div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, lineHeight: 1.2, color: GREY, whiteSpace: 'normal' }}>{d}</div>
            {k === 'COACH' && <svg width="90" height="90" style={{ marginTop: 'auto' }}><circle cx="45" cy="45" r="38" fill="none" stroke={INK} strokeWidth="4" /><line x1="45" y1="45" x2={45 + 28 * Math.sin(T * 1.2)} y2={45 - 28 * Math.cos(T * 1.2)} stroke={CORAL} strokeWidth="5" strokeLinecap="round" /><text x="45" y="104" textAnchor="middle" fontFamily={MONO} fontSize="20" fill={GREY}>5 min</text></svg>}
          </div>
        ); })}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={dx} cy={730} r={22} fill={CORAL} opacity={dotO} />
        <text x={dx} y={790} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={34} fill={CORAL} opacity={dotO}>you</text>
      </svg>
      <Big T={T} at={w + 6} top={850} w={1880} s="One or two targets. Real work, not just re-reading notes." size={46} c={INDIGO} italic />
    </Scene>
  );
}
function Reconvene({ T, C }) {
  const r = C.Reconvene;
  const bubbles = [['“The slope of v–t IS the acceleration.”', 200, 300], ['“Steeper ropes need LESS tension.”', 1080, 360], ['“Net force first, then F = ma.”', 260, 560], ['“μ doesn’t change with mass.”', 1120, 620]];
  return (
    <Scene n="Reconvene" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={r + 0.3} top={40} s="RECONVENE · 35–48 MIN" />
      <Big T={T} at={r + 0.6} top={90} s="What clicked today?" size={70} />
      {bubbles.map(([t, x, y], i) => { const e = env(T, r + 2 + i * 1.2, 0.5); return <div key={i} style={{ position: 'absolute', left: x, top: y + (1 - e) * 20 + 6 * Math.sin(T * 1.2 + i), opacity: e, padding: '16px 30px', borderRadius: 30, border: `3px solid ${[INDIGO, SAGE, CORAL, '#8a7bb8'][i]}`, background: '#ffffff', fontFamily: SERIF, fontSize: 44, color: INK }}>{M(t)}</div>; })}
      <Big T={T} at={r + 7.4} top={820} w={1880} s="This is the moment to fix weak spots: before the transfer task, not after." size={48} c={SAGE} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <div style={{ position: 'absolute', left: 60, top: 140, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {[['MY WEAKEST TARGET', 'e.g. R9 · net force from an FBD', CORAL], ['MY PLAN BEFORE THE TRANSFER TASK', 'what, when, and with whom', INDIGO]].map(([k, v, c], i) => <div key={i} style={{ width: 1880, height: 260, boxSizing: 'border-box', opacity: env(T, e + 0.8 + i * 1.2), borderRadius: 12, border: `4px dashed ${c}`, background: '#ffffff', padding: '24px 36px' }}>
          <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.1em', color: c }}>{k}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: GREY, marginTop: 14 }}>{v}</div>
        </div>)}
      </div>
      <Big T={T} at={e + 3.4} top={760} s="A concrete plan beats “study more.”" size={52} c={INDIGO} italic />
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









function shots19(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Stock', 'Rate', 'Workshop', 'Reconvene', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots19(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Stock T={T} C={C} />
        <Rate T={T} C={C} />
        <Workshop T={T} C={C} />
        <Reconvene T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function WorkshopApp() {
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
window.WorkshopApp = WorkshopApp;









