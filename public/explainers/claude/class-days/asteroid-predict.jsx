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

const ORDER = ['Title', 'Recap', 'Setup', 'Units', 'Solve', 'HowSure', 'Window', 'Reality', 'Reflect', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'WARM-UP', 'To predict where something will be later, what three things do you need to know?'],
  Setup: [2, 'PREP CHECK', 'Convert 8,210 m/s to km/s. What does the 7 in 1.6 × 10^7 s tell you?'],
  Units: [3, 'YOUR TURN', 'Find Δx and Δy over 6 months, then the new position. Keep everything in km and s.'],
  Solve: [4, 'DISCUSS', 'Is the asteroid closer to Earth than it is now? Which side of Earth is it on?'],
  HowSure: [5, 'YOUR TURN', 'Use the uncertainties to find the range of possible x and y. Sketch the window.'],
  Window: [6, 'DISCUSS', 'Which uncertainty matters more here: position or velocity? Why?'],
  Reality: [7, 'DISCUSS', 'Why will the real window be even bigger than the one we calculated?'],
  Reflect: [8, 'EXIT TICKET', 'In your own words: why does our prediction have a window of possible positions instead of one exact location?'],
};

// ---------- title + recap ----------
function TitleA({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 5 · MISSION 2026-XJ</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Where will it be</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>in six months?</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: INDIGO }}>Predict with Δx = vΔt, then ask how sure we are.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 600, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap, L = 1000, Y = 520, sp = 120;
  const go = clamp(T - (r + 2), 0, 4.5), ax = L + 60 + sp * go;
  const ticks = Array.from({ length: 5 }, (_, k) => k).filter((k) => k <= go + 0.001);
  return (
    <Card x={0} y={-1400} w={1900} h={900} T={T} at={r - 0.8} ph={0.3}>
      <Kicker T={T} at={r + 0.4} top={44} s="RECAP" />
      <Line T={T} at={r + 0.8} top={120} s="v = Δx / Δt" size={110} />
      <div style={{ position: 'absolute', left: 50, top: 280, width: 640, height: 150, borderRadius: 10, border: `3px solid ${SAGE}`, background: SAGE_T, opacity: env(T, r + 3.5) }}></div>
      <Line T={T} at={r + 3.6} top={292} left={84} s="Δx = v · Δt" size={110} />
      <div style={{ position: 'absolute', left: 60, top: 500, width: 820, whiteSpace: 'normal', opacity: env(T, r + 9.5), fontFamily: SERIF, fontSize: 58, lineHeight: 1.2, color: INK }}>If <i>v</i> stays constant, we can predict where it will be later.</div>
      <svg width="1900" height="900" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={L} y1={Y} x2={1850} y2={Y} stroke={INK} strokeWidth={4} opacity={env(T, r + 1)} />
        {ticks.map((k) => <g key={k}><line x1={L + 60 + sp * k} y1={Y - 16} x2={L + 60 + sp * k} y2={Y + 16} stroke={INDIGO} strokeWidth={4} /><text x={L + 60 + sp * k} y={Y + 60} textAnchor="middle" fontFamily={MONO} fontSize={32} fill={GREY}>{k} s</text></g>)}
        {win(T, r + 7.2, C.Setup, 0.6) > 0 && <g opacity={win(T, r + 7.2, C.Setup, 0.6)}>{[0, 1, 2, 3].map((k) => <path key={k} d={`M ${L + 66 + sp * k} ${Y - 60} L ${L + 54 + sp * (k + 1)} ${Y - 60}`} stroke={SAGE} strokeWidth={5} />)}<text x={L + 300} y={Y - 84} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={44} fill={SAGE}>same Δx each second</text></g>}
        {env(T, r + 2, 0.4) > 0 && <path d={arrowD(ax + 30, Y - 110, ax + 130, Y - 110)} fill="none" stroke={INDIGO} strokeWidth={6} strokeLinecap="round" opacity={env(T, r + 2, 0.4)} />}
        <Rock x={ax} y={Y - 34} r={28} spin={T * 30} o={env(T, r + 1.4)} />
        {win(T, r + 11, C.Setup, 0.6) > 0 && <g opacity={win(T, r + 11, C.Setup, 0.6)}><line x1={ax + 30} y1={Y - 34} x2={L + 60 + sp * 6.5} y2={Y - 34} stroke={INDIGO} strokeWidth={3} strokeDasharray="10 10" /><Rock x={L + 60 + sp * 6.5} y={Y - 34} r={28} o={0.4} /><text x={L + 60 + sp * 6.5} y={Y - 90} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={42} fill={INDIGO}>later?</text></g>}
      </svg>
    </Card>
  );
}

// ---------- coordinate plane (Earth at origin) ----------
const PO = [-980, 700], PK = 105;
const px = (x) => PO[0] + x * PK, py = (y) => PO[1] - y * PK;
const A0 = [px(12), py(0)], PP = [px(-1.136), py(3.52)];
function rockAt(T, C) { const u = eio((T - (C.Solve + 9.5)) / 5.5); return [lerp(A0[0], PP[0], u), lerp(A0[1], PP[1], u), u]; }
function Plane({ T, C }) {
  const st = C.Setup, s = C.Solve, o = env(T, st - 1.0, 0.8);
  if (o <= 0) return null;
  const [rx, ry, u] = rockAt(T, C);
  const vOut = 1 - env(T, s + 14.6, 0.6), vx = env(T, st + 5, 0.7) * vOut, vy = env(T, st + 7, 0.7) * vOut;
  const legs = env(T, s + 15.2, 0.7), lab = (x, y, t, c, sz = 40, an = 'start', op = 1) => op > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={sz} fill={c} opacity={op}>{MS(t)}</text> : null;
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: -1700, top: -250, width: 2400, height: 1100, opacity: o, background: '#ffffff', border: `2px solid ${LINE}`, borderRadius: 8, boxShadow: '0 40px 80px rgba(34,35,58,0.10)' }}></div>
      <div style={{ position: 'absolute', left: -1640, top: -210, opacity: env(T, st + 0.6), fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', color: CORAL }}>EARTH AT THE ORIGIN · +x TOWARD THE ASTEROID</div>
      <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o }}>
        {Array.from({ length: 19 }, (_, k) => k - 5).map((x) => <g key={'x' + x}><line x1={px(x)} y1={py(0)} x2={px(x)} y2={py(5)} stroke={TINT} strokeWidth={2} />{x % 2 === 0 && x !== 0 && x !== 12 && <text x={px(x)} y={py(0) + 46} textAnchor="middle" fontFamily={MONO} fontSize={32} fill={GREY}>{x < 0 ? '−' + Math.abs(x) : x}</text>}</g>)}
        {[0, 1, 2, 3, 4, 5].map((y) => <g key={'y' + y}><line x1={px(-5)} y1={py(y)} x2={px(13)} y2={py(y)} stroke={TINT} strokeWidth={2} /><text x={px(-5) - 16} y={py(y) + 11} textAnchor="end" fontFamily={MONO} fontSize={32} fill={GREY}>{y}</text></g>)}
        <line x1={px(-5)} y1={py(0)} x2={px(13)} y2={py(0)} stroke={INK} strokeWidth={4} />
        <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(5)} stroke={INK} strokeWidth={4} />
        <text x={px(13)} y={py(0) + 100} textAnchor="end" fontFamily={SANS} fontSize={34} fontWeight={500} fill={INK}>{MS('x (× 10^7 km)')}</text>
        <text x={px(0) + 18} y={py(5) + 8} fontFamily={SANS} fontSize={34} fontWeight={500} fill={INK}>{MS('y (× 10^7 km)')}</text>
        <circle cx={PO[0]} cy={PO[1]} r={26} fill="#d7d8ea" stroke={INK} strokeWidth={4} />
        <path d={`M ${PO[0] - 20} ${PO[1] - 8} Q ${PO[0]} ${PO[1] - 18} ${PO[0] + 20} ${PO[1] - 6}`} fill="none" stroke={INDIGO} strokeWidth={3} />
        <text x={PO[0] - 40} y={PO[1] - 40} textAnchor="end" fontFamily={SERIF} fontSize={40} fill={INK}>Earth</text>
        {Array.from({ length: 7 }, (_, k) => k).filter((k) => k / 6 <= u + 0.001 && u > 0).map((k) => <circle key={k} cx={lerp(A0[0], PP[0], k / 6)} cy={lerp(A0[1], PP[1], k / 6)} r={8} fill={INDIGO} opacity={0.6} />)}
        {u > 0 && <line x1={A0[0]} y1={A0[1]} x2={rx} y2={ry} stroke={INDIGO} strokeWidth={3} strokeDasharray="12 10" />}
        {legs > 0 && <g opacity={legs}>
          <path d={arrowD(A0[0], A0[1] + 56, PP[0], A0[1] + 56)} fill="none" stroke={CORAL} strokeWidth={5} />
          {lab((A0[0] + PP[0]) / 2 + 300, A0[1] + 120, 'Δx = −1.31 × 10^8 km', CORAL, 40, 'middle')}
          <path d={arrowD(PP[0] - 50, A0[1], PP[0] - 50, PP[1])} fill="none" stroke={CORAL} strokeWidth={5} />
          {lab(PP[0] - 72, (A0[1] + PP[1]) / 2 + 14, 'Δy = +3.52 × 10^7 km', CORAL, 36, 'end')}
        </g>}
        {env(T, s + 16.2, 0.6) > 0 && <g opacity={env(T, s + 16.2, 0.6)}><line x1={px(0) + 14} y1={py(4.3) + 8} x2={PP[0] + 12} y2={PP[1] - 12} stroke={INDIGO} strokeWidth={2.5} /><rect x={px(0) + 16} y={py(4.3) - 36} width={640} height={50} fill="#ffffff" />{lab(px(0) + 22, py(4.3), 'predicted: (−1.14 × 10^7 km, 3.52 × 10^7 km)', INDIGO, 38, 'start')}</g>}
        {env(T, s + 17.6, 0.6) > 0 && <g opacity={env(T, s + 17.6, 0.6)}><line x1={PO[0]} y1={PO[1]} x2={PP[0]} y2={PP[1]} stroke={SAGE} strokeWidth={5} />{lab((PO[0] + PP[0]) / 2 + 30, (PO[1] + PP[1]) / 2 + 10, 'd ≈ 3.70 × 10^7 km', SAGE, 42)}</g>}
        {env(T, st + 2, 0.6) > 0 && <g opacity={env(T, st + 2, 0.6)}>{lab(A0[0] + 40, A0[1] - 130, 'now: (1.2 × 10^8 km, 0)', INK, 40, 'end')}</g>}
        {vx > 0 && <g opacity={vx}><path d={arrowD(rx - 30, ry, rx - 30 - 240 * vx, ry, 22)} fill="none" stroke={INDIGO} strokeWidth={7} strokeLinecap="round" />{lab(rx - 150, ry - 26, 'v_x = −8,210 m/s', INDIGO, 38, 'middle', 1 - env(T, s + 9.4, 0.5))}</g>}
        {vy > 0 && <g opacity={vy}><path d={arrowD(rx, ry - 30, rx, ry - 30 - 64 * vy, 18)} fill="none" stroke={INDIGO} strokeWidth={7} strokeLinecap="round" />{lab(rx + 30, ry - 80, 'v_y = +2,200 m/s', INDIGO, 38, 'start', 1 - env(T, s + 9.4, 0.5))}</g>}
        <Rock x={rx} y={ry} r={26} spin={T * 20} o={env(T, st + 1.2)} />
      </svg>
      {env(T, s + 20, 0.6) > 0 && <div style={{ position: 'absolute', left: 660, top: -180, transform: 'translateX(-100%)', opacity: env(T, s + 20, 0.6), padding: '10px 22px', borderRadius: 8, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, color: INK }}>A constant-velocity model, not an orbit.</div>}
    </React.Fragment>
  );
}
function WorkPanel({ T, C }) {
  const st = C.Setup, u = C.Units, s = C.Solve;
  const unitsO = 1 - env(T, s + 0.2, 0.5);
  return (
    <Card x={2300} y={300} w={1100} h={1100} T={T} at={st + 9.4} ph={0.9}>
      <Kicker T={T} at={st + 10} top={44} s="GIVEN" />
      <Line T={T} at={st + 10.5} top={100} s="x₀ = 1.2 × 10^8 km,   y₀ = 0" />
      <Line T={T} at={st + 11.5} top={172} s="v_x = −8,210 m/s" c={INDIGO} />
      <Line T={T} at={st + 12.5} top={244} s="v_y = +2,200 m/s" c={INDIGO} />
      <Line T={T} at={st + 14} top={316} s="t = 6 months ≈ 1.6 × 10^7 s" />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 418, height: 2, background: TINT, opacity: env(T, u) }}></div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1100, height: 1100, opacity: unitsO }}>
        <Kicker T={T} at={u + 0.5} top={448} s="UNITS · KEEP km AND s" />
        <Line T={T} at={u + 1.2} top={504} s="v_x = −8,210 m/s × (1 km / 1000 m)" />
        <Line T={T} at={u + 3.0} top={576} left={150} s="= −8.210 km/s" c={INDIGO} />
        <Line T={T} at={u + 4.5} top={648} s="v_y = +2.200 km/s" c={INDIGO} />
        <Line T={T} at={u + 6.5} top={740} s="1.6 × 10^7 s ≈ 16,000,000 s ≈ 185 days" />
        <div style={{ position: 'absolute', left: 50, top: 850, opacity: env(T, u + 9.5), padding: '10px 22px', borderRadius: 8, background: CORAL_T, border: `3px solid ${CORAL}`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INK }}>Mix m and km, and you're off by 1000×.</div>
      </div>
      <Kicker T={T} at={s + 0.6} top={448} s="PREDICT · CONSTANT VELOCITY" c={SAGE} />
      <Line T={T} at={s + 1.0} top={504} s="Δx = v_x t = (−8.210)(1.6 × 10^7)" />
      <Line T={T} at={s + 2.2} top={576} left={150} s="= −1.314 × 10^8 km" c={CORAL} />
      <Line T={T} at={s + 3.4} top={648} s="Δy = v_y t = (2.200)(1.6 × 10^7)" />
      <Line T={T} at={s + 4.4} top={720} left={150} s="= +3.52 × 10^7 km" c={CORAL} />
      <Line T={T} at={s + 5.6} top={810} s="x = x₀ + Δx = −1.14 × 10^7 km" c={INDIGO} />
      <Line T={T} at={s + 6.6} top={882} s="y = y₀ + Δy = 3.52 × 10^7 km" c={INDIGO} />
    </Card>
  );
}

// ---------- uncertainty window ----------
const WS = 55;
const DOTS = Array.from({ length: 49 }, (_, k) => { const a = Math.sin(k * 12.9898) * 43758.5453, b = Math.sin(k * 78.233) * 12345.678; return [(a - Math.floor(a)) * 2 - 1, (b - Math.floor(b)) * 2 - 1]; });
function WindowCard({ T, C }) {
  const h = C.HowSure, w = C.Window;
  const prog = eio((T - (w + 5)) / 6), half = (3.2 * prog + 0.05) * WS;
  const cx = 1500, cy = 500;
  const tx = (v) => cx + v * WS, ty = (v) => cy - v * WS;
  const xl = (k) => (-1.136 + k * 0.2).toFixed(2), yl = (k) => (3.52 + k * 0.2).toFixed(2);
  const L = (at, top, s, c = INK, size = 46) => <Line T={T} at={at} top={top} s={s} c={c} size={size} />;
  const months = (prog * 6).toFixed(1);
  return (
    <Card x={0} y={1880} w={2000} h={1040} T={T} at={h - 0.8} ph={0.6}>
      <Reveal T={T} at={h + 0.5} dur={1.4} style={{ left: 56, top: 40, fontFamily: SERIF, fontSize: 96, color: INK }}>How sure are we?</Reveal>
      {L(h + 2.5, 170, 'Position: ±50,000 km')}
      {L(h + 5, 236, 'Velocity: ±200 m/s (each component)')}
      {L(h + 7.5, 302, '= ±0.200 km/s', CORAL)}
      <div style={{ position: 'absolute', left: 60, right: 1100, top: 390, height: 2, background: TINT, opacity: env(T, w + 2.6) }}></div>
      {L(w + 3, 416, 'From position: ±5.0 × 10^4 km')}
      {L(w + 6, 482, 'From velocity: (±0.200 km/s)(1.6 × 10^7 s)')}
      {L(w + 7, 548, '= ±3.2 × 10^6 km', CORAL)}
      {L(w + 13, 630, 'Total ≈ ±3.25 × 10^6 km in x and in y', SAGE)}
      {L(w + 15.5, 712, 'x: −1.46 to −0.81 × 10^7 km', INDIGO)}
      {L(w + 16.5, 778, 'y: 3.20 to 3.85 × 10^7 km', INDIGO)}
      <div style={{ position: 'absolute', left: 50, top: 880, opacity: env(T, w + 19.5), padding: '8px 20px', borderRadius: 8, background: CORAL_T, border: `3px solid ${CORAL}`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: INK }}>The velocity uncertainty is about 64× bigger.</div>
      <svg width="2000" height="1040" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: env(T, w - 0.4, 0.8) }}>
        {[-2, -1, 0, 1, 2].map((k) => <g key={k}>
          <line x1={tx(k * 2)} y1={ty(5)} x2={tx(k * 2)} y2={ty(-5)} stroke={TINT} strokeWidth={2} />
          <line x1={tx(-5)} y1={ty(k * 2)} x2={tx(5)} y2={ty(k * 2)} stroke={TINT} strokeWidth={2} />
          <text x={tx(k * 2)} y={ty(-5) + 42} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={GREY}>{xl(k)}</text>
          <text x={tx(-5) - 14} y={ty(k * 2) + 9} textAnchor="end" fontFamily={MONO} fontSize={26} fill={GREY}>{yl(k)}</text>
        </g>)}
        <rect x={tx(-5)} y={ty(5)} width={10 * WS} height={10 * WS} fill="none" stroke={INK} strokeWidth={3} />
        <text x={tx(5)} y={ty(-5) + 84} textAnchor="end" fontFamily={SANS} fontSize={28} fontWeight={500} fill={INK}>{MS('x (× 10^7 km), zoomed in')}</text>
        <text x={tx(-5)} y={ty(5) - 20} fontFamily={SANS} fontSize={28} fontWeight={500} fill={INK}>{MS('y (× 10^7 km)')}</text>
        {prog > 0 && <rect x={cx - half} y={cy - half} width={2 * half} height={2 * half} fill={SAGE_T} stroke={SAGE} strokeWidth={5} strokeDasharray="16 10" opacity={0.95} />}
        {DOTS.map(([a, b], k) => { const e = env(T, w + 11.4 + k * 0.04, 0.3); return e > 0 ? <circle key={k} cx={cx + a * half * 0.97} cy={cy + b * half * 0.97} r={6 * e} fill={INDIGO} opacity={0.55} /> : null; })}
        <circle cx={cx} cy={cy} r={9} fill={CORAL} />
        <rect x={cx - 78} y={cy - 54} width={156} height={42} rx={6} fill="#ffffff" opacity={0.92} /><text x={cx} y={cy - 22} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={34} fill={CORAL}>prediction</text>
        {win(T, w + 2, w + 5.5, 0.4) > 0 && <g opacity={win(T, w + 2, w + 5.5, 0.4)}><circle cx={cx} cy={cy} r={22} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="4 4" /><path d={arrowD(cx + 110, cy + 110, cx + 20, cy + 20, 14)} fill="none" stroke={INK} strokeWidth={3} /><text x={cx + 120} y={cy + 140} fontFamily={SERIF} fontStyle="italic" fontSize={34} fill={INK}>{MS('±5 × 10^4 km: smaller than the dot')}</text></g>}
        {win(T, w + 5, w + 13, 0.4) > 0 && <text x={cx} y={ty(5) - 60} textAnchor="middle" fontFamily={MONO} fontSize={34} fontWeight={600} fill={SAGE} opacity={win(T, w + 5, w + 13, 0.4)}>{`t = ${months} months · window grows`}</text>}
      </svg>
    </Card>
  );
}
function Reality({ T, C }) {
  const r = C.Reality;
  const S = [980, 820], P2 = [260, 380];
  const curves = [[-60, -40], [60, 30], [-120, 60], [130, -50], [20, 110], [-30, -120]];
  return (
    <Card x={0} y={3150} w={2000} h={1000} T={T} at={r - 0.8} ph={1.1}>
      <svg width="2000" height="1000" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={160} cy={820} r={26} fill="#d7d8ea" stroke={INK} strokeWidth={4} />
        <text x={160} y={890} textAnchor="middle" fontFamily={SERIF} fontSize={38} fill={INK}>Earth</text>
        <line x1={S[0]} y1={S[1]} x2={P2[0]} y2={P2[1]} stroke={INDIGO} strokeWidth={4} strokeDasharray="12 10" opacity={env(T, r + 1)} />
        <rect x={P2[0] - 40} y={P2[1] - 40} width={80} height={80} fill={SAGE_T} stroke={SAGE} strokeWidth={4} opacity={env(T, r + 1.6)} />
        <text x={P2[0] + 60} y={P2[1] - 50} fontFamily={SERIF} fontStyle="italic" fontSize={36} fill={SAGE} opacity={env(T, r + 1.6)}>our window</text>
        {curves.map(([dx, dy], k) => { const p = eo((T - (r + 3.8 + k * 0.25)) / 1.4); if (p <= 0) return null; const ex = P2[0] + dx * 1.6, ey = P2[1] + dy * 1.4 + 60; const q = (t) => { const m = 1 - t, c = [620, 760 + dy]; return [m * m * S[0] + 2 * m * t * c[0] + t * t * ex, m * m * S[1] + 2 * m * t * c[1] + t * t * ey]; }; const d = Array.from({ length: 31 }, (_, i) => { const [x, y] = q((i / 30) * p); return (i ? 'L ' : 'M ') + x.toFixed(0) + ' ' + y.toFixed(0); }).join(' '); return <path key={k} d={d} fill="none" stroke={CORAL} strokeWidth={3.5} opacity={0.75} />; })}
        <ellipse cx={P2[0] + 10} cy={P2[1] + 70} rx={250} ry={200} fill={CORAL} opacity={0.1 * env(T, r + 6.4)} stroke={CORAL} strokeWidth={3} strokeDasharray="12 10" />
        <text x={P2[0] + 10} y={P2[1] + 330} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={38} fill={CORAL} opacity={env(T, r + 6.4)}>the real window</text>
        <Rock x={S[0]} y={S[1]} r={24} spin={T * 20} />
      </svg>
      <Kicker T={T} at={r + 0.6} top={60} left={1120} s="REALITY CHECK" />
      <Line T={T} at={r + 1.0} top={120} left={1120} s="Our model: constant velocity." size={58} />
      <div style={{ position: 'absolute', left: 1120, top: 220, width: 820, whiteSpace: 'normal', opacity: env(T, r + 3.6), fontFamily: SERIF, fontSize: 58, lineHeight: 1.2, color: INK }}>The Sun's gravity changes the velocity, so the path bends.</div>
      <div style={{ position: 'absolute', left: 1120, top: 400, width: 820, whiteSpace: 'normal', opacity: env(T, r + 6.4), fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, lineHeight: 1.2, color: CORAL }}>So the real window is bigger than ours.</div>
      <div style={{ position: 'absolute', left: 1120, top: 600, opacity: env(T, r + 9), fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>NEXT UNIT · FORCES AND GRAVITY</div>
    </Card>
  );
}
function Reflect({ T, C }) {
  const e = C.Reflect;
  const steps = ['Measure', 'Predict', 'State the uncertainty'];
  return (
    <Card x={0} y={4400} w={2000} h={1000} T={T} at={e - 0.8} ph={1.6}>
      <Kicker T={T} at={e + 0.4} top={50} s="REFLECT" />
      <Reveal T={T} at={e + 0.8} dur={1.4} style={{ left: 56, top: 96, fontFamily: SERIF, fontSize: 104, color: INK }}>2026-XJ is fictional.</Reveal>
      <Reveal T={T} at={e + 2.6} dur={1.4} style={{ left: 60, top: 220, fontFamily: SERIF, fontStyle: 'italic', fontSize: 76, color: INDIGO }}>The methods are real.</Reveal>
      <div style={{ position: 'absolute', left: 60, top: 360, display: 'flex', gap: 30 }}>
        {steps.map((t, k) => { const on = env(T, e + 4.5 + k * 0.8, 0.5); return (
          <div key={k} style={{ width: 600, height: 120, boxSizing: 'border-box', borderRadius: 10, border: `3px solid ${SAGE}`, background: SAGE_T, opacity: on, transform: `translateY(${(1 - on) * 20}px)`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px' }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: SAGE, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 32, fontWeight: 600, flex: 'none' }}>{k + 1}</div>
            <div style={{ fontFamily: SERIF, fontSize: 52, color: INK }}>{t}</div>
          </div>
        ); })}
      </div>
      <Kicker T={T} at={e + 7.5} top={540} s="A REAL MISSION DECISION NEEDS" c={INDIGO} />
      <Line T={T} at={e + 8.5} top={590} s="a better model that includes gravity" size={56} />
      <Line T={T} at={e + 9.8} top={670} s="more observations to shrink the uncertainty" size={56} />
      <div style={{ position: 'absolute', left: 60, top: 800, opacity: env(T, e + 12), fontFamily: MONO, fontSize: 34, fontWeight: 600, color: CORAL }}>DAYS 21–22 · YOU'LL MAKE A PREDICTION LIKE THIS ON YOUR OWN, WITH NEW DATA</div>
    </Card>
  );
}

// ---------- stop band (screen space) ----------
function StopBand({ T, C }) {
  for (const n of Object.keys(STOPS)) {
    const end = endOf(C, n), o = clamp((T - (end - 3)) / 0.5, 0, 1) * (n === 'Reflect' ? 1 : clamp((end + 0.3 - T) / 0.3, 0, 1));
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
function shotsA(C) {
  const o = (t, d, x, y, z, r = 0, dip = 0) => ({ t, d, x, y, z, r, dip });
  const plane = [-500, 441, 0.76], panel = [2300, 429, 0.78];
  return [
    o(-1, 0, 0, -2700, 1.15, -2), o(C.Title, 5, 0, -2680, 1.0),
    o(C.Recap, 1.8, 0, -1231, 0.85, 0, 0.3),
    o(C.Setup, 1.9, ...plane, 0, 0.3), o(C.Setup + 9.4, 1.6, ...panel),
    o(C.Solve + 7.6, 1.6, ...plane),
    o(C.HowSure, 1.9, 0, 2017, 0.8, 0, 0.3), o(C.Window + 0.4, 1.4, 520, 1956, 1.15), o(C.Window + 13.6, 1.4, 0, 2017, 0.8),
    o(C.Reality, 1.9, 0, 3307, 0.8, 0, 0.3),
    o(C.Reflect, 1.9, 0, 4557, 0.8, 0, 0.3),
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
    for (const n of Object.keys(STOPS)) { const st = endOf(C, n) - 0.4; if (p < st && T >= st) { tl.setPlaying(false); break; } }
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
  const cam = camAt(T, shotsA(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleA T={T} C={C} />
        <Recap T={T} C={C} />
        <Plane T={T} C={C} />
        <WorkPanel T={T} C={C} />
        <WindowCard T={T} C={C} />
        <Reality T={T} C={C} />
        <Reflect T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function AsteroidPredictApp() {
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
window.AsteroidPredictApp = AsteroidPredictApp;
