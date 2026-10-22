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

const ORDER = ['Title', 'Setup', 'Demo', 'Compute', 'Lab', 'Class', 'Exit', 'Marz', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Setup: [1, 'SAFETY CHECK', 'Track level? Photogates clamped? Gentle pushes only. Check off before anyone touches a cart.'],
  Demo: [2, 'YOUR TURN', 'Use the masses and photogate readings to find Σp before and Σp after. Right = +. Do they match?'],
  Lab: [3, 'LAB', 'Pairs: 2 elastic trials (magnets) and 2 perfectly inelastic trials (Velcro). Record m and signed v for each cart.'],
  Class: [4, 'DISCUSS', 'Add your % difference to the class table. Which source of error matters most: friction, timing, or mass?'],
  Exit: [5, 'EXIT TICKET', 'Explain one result with a sketch or calculation. Name the model you used and one assumption.'],
  Marz: [6, 'CHECK-IN', 'Where are you on S4? Rate yourself 0–4. Write-up: data table + a claim–evidence–reasoning paragraph.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Setup: [0, -1300], Demo: [2200, -1300], Compute: [2200, 0], Lab: [0, 0], Class: [-2200, 0], Exit: [-2200, 1300], Marz: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
// demo numbers: elastic, cart A 0.50 kg at +0.60 m/s hits cart B 0.50 kg at rest → A ≈ 0.02, B ≈ 0.57 (small friction loss)
const DM = { mA: 0.5, mB: 0.5, vA: 0.6, vA2: 0.02, vB2: 0.57 };
function LabCart({ x, y, w = 160, c, lab, bump = 'mag', flip = false }) {
  const bx = flip ? x - w / 2 - 10 : x + w / 2;
  return (
    <g>
      <rect x={x - w / 2} y={y - 74} width={w} height={52} rx={8} fill={c} stroke={INK} strokeWidth={3.5} />
      <rect x={x - 12} y={y - 140} width={24} height={66} fill={INK} />
      {bump === 'mag' ? <rect x={bx} y={y - 66} width={10} height={36} rx={3} fill={INDIGO} /> : <rect x={bx} y={y - 66} width={10} height={36} fill={SAGE} />}
      <circle cx={x - w / 2 + 30} cy={y - 14} r={13} fill="#ffffff" stroke={INK} strokeWidth={3} />
      <circle cx={x + w / 2 - 30} cy={y - 14} r={13} fill="#ffffff" stroke={INK} strokeWidth={3} />
      <text x={x} y={y - 40} textAnchor="middle" fontFamily={MONO} fontSize={24} fontWeight={600} fill={INK}>{lab}</text>
    </g>
  );
}
function Gate({ x, y, blocked, lab, reading }) {
  return (
    <g>
      <path d={`M ${x - 40} ${y + 10} L ${x - 40} ${y - 220} L ${x + 40} ${y - 220} L ${x + 40} ${y + 10}`} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <line x1={x} y1={y - 210} x2={x} y2={y - 150} stroke={blocked ? '#e8b7a9' : CORAL} strokeWidth={4} strokeDasharray="6 6" />
      <circle cx={x} cy={y - 210} r={8} fill={blocked ? INK : CORAL} />
      <text x={x} y={y - 240} textAnchor="middle" fontFamily={MONO} fontSize={24} fontWeight={600} fill={GREY}>{lab}</text>
      {reading && <g><rect x={x - 110} y={y - 320} width={220} height={52} rx={8} fill={INK} /><text x={x} y={y - 284} textAnchor="middle" fontFamily={MONO} fontSize={28} fontWeight={600} fill="#ffffff">{reading}</text></g>}
    </g>
  );
}
function Track({ y, o = 1 }) {
  return <g opacity={o}><rect x={140} y={y} width={1720} height={18} rx={3} fill={TINT} stroke={INK} strokeWidth={3} /><rect x={120} y={y + 18} width={1760} height={22} fill="#ffffff" stroke={INK} strokeWidth={3} /></g>;
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 3 · DAY 7 · LAB</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Does momentum hold up?</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, lineHeight: 1.15, color: INDIGO, whiteSpace: 'normal', width: 1600 }}>two carts · two photogates · Σp before vs Σp after</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 450, fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: INDIGO, whiteSpace: 'normal', width: 1600 }}>S4 · Vernier collision measurement.   K3 · Conservation of momentum, confirmed by experiment.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Setup({ T, C }) {
  const s = C.Setup, y = 700;
  const checks = ['Level the track: a cart set down at rest shouldn’t roll.', 'Clamp both photogates; each one times a flag passing through its beam.', 'Gentle pushes only. Catch carts before the end stops.'];
  return (
    <Scene n="Setup" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={s + 0.3} top={44} s="PROCEDURE AND SAFETY" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track y={y} o={env(T, s + 0.6)} />
        <g opacity={env(T, s + 1.2)}><Gate x={560} y={y} lab="gate 1" /><Gate x={1440} y={y} lab="gate 2" /></g>
        <g opacity={env(T, s + 1.8)}><LabCart x={320} y={y} c={CORAL_T} lab="A" /><LabCart x={1000} y={y} c="#d7d8ea" lab="B" flip /></g>
        <SV x={1000} y={y + 110} s="magnet bumpers → elastic · Velcro → sticks" c={GREY} size={34} an="middle" o={env(T, s + 2.4)} />
      </svg>
      <div style={{ position: 'absolute', left: 60, top: 110, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {checks.map((t, i) => <div key={i} style={{ opacity: env(T, s + 3 + i * 1.2), display: 'flex', alignItems: 'center', gap: 20, fontFamily: SERIF, fontSize: 42, color: INK }}><div style={{ width: 22, height: 22, borderRadius: 11, background: SAGE }}></div>{t}</div>)}
      </div>
    </Scene>
  );
}
function Demo({ T, C }) {
  const d = C.Demo, y = 700, hit = d + 4.4, PX = 260;
  const ax = T < hit ? 320 + DM.vA * PX * Math.max(0, T - (d + 1.2)) : 320 + DM.vA * PX * (hit - (d + 1.2)) + DM.vA2 * PX * (T - hit);
  const bx = T < hit ? 1000 : 1000 + DM.vB2 * PX * Math.min(T - hit, 4.4);
  const g1 = Math.abs(ax - 560) < 80, g2 = Math.abs(bx - 1440) < 80, r1 = T > d + 2.6, r2 = T > hit + 2.0;
  return (
    <Scene n="Demo" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={d + 0.3} top={44} s="TEACHER DEMO · ELASTIC (MAGNET BUMPERS) · RIGHT = +" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track y={y} />
        <Gate x={560} y={y} lab="gate 1" blocked={g1} reading={r1 ? 'A: +0.60 m/s' : null} />
        <Gate x={1440} y={y} lab="gate 2" blocked={g2} reading={r2 ? 'B: +0.57 m/s' : null} />
        <LabCart x={ax} y={y} c={CORAL_T} lab="A" />
        <LabCart x={bx} y={y} c="#d7d8ea" lab="B" flip />
      </svg>
      <div style={{ position: 'absolute', left: 60, top: 110, opacity: env(T, d + 5), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', padding: '8px 22px', fontFamily: SANS, fontSize: 28, fontWeight: 500, color: INK }}>{['cart', 'm (kg)', 'v before', 'v after'].map((h, k) => <div key={k} style={{ width: [120, 170, 190, 190][k] }}>{h}</div>)}</div>
        {[['A', '0.50', '+0.60', '+0.02'], ['B', '0.50', '0', '+0.57']].map((r, i) => <div key={i} style={{ display: 'flex', padding: '8px 22px', borderTop: `2px solid ${TINT}`, fontFamily: MONO, fontSize: 32, fontWeight: 500, color: INK }}>{r.map((v, k) => <div key={k} style={{ width: [120, 170, 190, 190][k] }}>{v}</div>)}</div>)}
      </div>
      <Big T={T} at={d + 6} top={130} left={820} w={1120} s="A barely moves after the hit (+0.02 m/s): read it from a motion detector, or time it later through gate 2." size={34} italic c={GREY} />
    </Scene>
  );
}
function Compute({ T, C }) {
  const c = C.Compute, pb = DM.mA * DM.vA, pa = DM.mA * DM.vA2 + DM.mB * DM.vB2, pct = (Math.abs(pa - pb) / pb) * 100;
  return (
    <Scene n="Compute" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={c + 0.3} top={44} s="ANSWER · THE DEMO’S NUMBERS" c={SAGE} />
      <Big T={T} at={c + 0.8} top={130} s="Σp before = (0.50)(+0.60) + (0.50)(0) = +0.300 kg·m/s" size={50} italic c={INDIGO} />
      <Big T={T} at={c + 2.8} top={230} s="Σp after = (0.50)(+0.02) + (0.50)(+0.57) = +0.295 kg·m/s" size={50} italic c={INDIGO} />
      <div style={{ position: 'absolute', left: 60, top: 360, opacity: env(T, c + 5), padding: '14px 30px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 52, color: INK }}>{`% difference = |0.295 − 0.300| ÷ 0.300 × 100 ≈ ${pct.toFixed(1)}%`}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 6.6)}>
          <text x={60} y={600} fontFamily={MONO} fontSize={28} fontWeight={600} fill={GREY}>BEFORE</text>
          <rect x={260} y={570} width={1200 * eo((T - (c + 6.8)) / 1)} height={44} rx={6} fill={INDIGO} />
          <text x={60} y={680} fontFamily={MONO} fontSize={28} fontWeight={600} fill={GREY}>AFTER</text>
          <rect x={260} y={650} width={1180 * eo((T - (c + 7.4)) / 1)} height={44} rx={6} fill={CORAL} opacity={0.6} />
        </g>
      </svg>
      <Big T={T} at={c + 8.4} top={760} w={1880} s="They match within about 2%: conservation of momentum holds in our lab." size={46} c={SAGE} />
      <Big T={T} at={c + 10.4} top={850} w={1880} s="The small gap: a little friction from the track, an external impulse." size={40} italic c={GREY} />
    </Scene>
  );
}
function Lab({ T, C }) {
  const l = C.Lab, y = 760, u = clamp((T - (l + 2)) / 3, 0, 1), ax = lerp(320, 820, u), stuck = u >= 1, td = Math.max(0, T - (l + 5)), sx = stuck ? Math.min(td * 120, 320) : 0;
  return (
    <Scene n="Lab" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={l + 0.3} top={44} s="YOUR LAB · RECORD EVERY CART, EVERY TRIAL" />
      <div style={{ position: 'absolute', left: 60, top: 110, opacity: env(T, l + 0.6), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', padding: '8px 18px', fontFamily: SANS, fontSize: 26, fontWeight: 500, color: INK }}>{['trial', 'type', 'm_A', 'm_B', 'v_A', 'v_B', 'v_A′', 'v_B′', 'Σp before', 'Σp after', '% diff'].map((h, k) => <div key={k} style={{ width: [90, 220, 110, 110, 110, 110, 110, 110, 220, 210, 160][k] }}>{M(h)}</div>)}</div>
        {[['1', 'elastic'], ['2', 'elastic'], ['3', 'perfectly inelastic'], ['4', 'perfectly inelastic']].map((r, i) => <div key={i} style={{ display: 'flex', padding: '10px 18px', borderTop: `2px solid ${TINT}`, fontFamily: MONO, fontSize: 26, color: INK, height: 34 }}><div style={{ width: 90 }}>{r[0]}</div><div style={{ width: 220, fontFamily: SERIF, fontSize: 30, color: i < 2 ? INDIGO : SAGE }}>{r[1]}</div></div>)}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Track y={y} o={env(T, l + 1.2)} />
        <g opacity={env(T, l + 1.2)}>
          <LabCart x={ax + sx} y={y} c={CORAL_T} lab="A" bump="velcro" />
          <LabCart x={1000 + sx} y={y} c="#d7d8ea" lab="B" bump="velcro" flip />
        </g>
        <SV x={1000} y={y + 110} s="Velcro: they stick and move off together → one shared v′" c={SAGE} size={36} an="middle" o={env(T, l + 5.4)} />
      </svg>
    </Scene>
  );
}
function Class({ T, C }) {
  const k = C.Class, data = [1.7, 3.2, 2.4, 5.1, 0.9, 4.2, 2.8, 6.3, 1.5, 3.6], X0 = 200, Y0 = 820, PX = 90;
  return (
    <Scene n="Class" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={k + 0.3} top={44} s="CLASS DATA · % DIFFERENCE, Σp BEFORE vs AFTER (EXAMPLE)" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, k + 0.6)}>
          <line x1={X0} y1={Y0} x2={1200} y2={Y0} stroke={INK} strokeWidth={4} />
          <line x1={X0} y1={Y0} x2={X0} y2={180} stroke={INK} strokeWidth={4} />
          {[0, 2, 4, 6].map((v) => <g key={v}><line x1={X0} y1={Y0 - v * PX} x2={1200} y2={Y0 - v * PX} stroke={TINT} strokeWidth={2} /><text x={X0 - 14} y={Y0 - v * PX + 10} textAnchor="end" fontFamily={MONO} fontSize={28} fill={GREY}>{v}%</text></g>)}
        </g>
        {data.map((v, i) => <rect key={i} x={X0 + 30 + i * 95} y={Y0 - v * PX * eo((T - (k + 1 + i * 0.25)) / 0.6)} width={60} height={v * PX * eo((T - (k + 1 + i * 0.25)) / 0.6)} rx={4} fill={i % 2 ? SAGE : INDIGO} opacity={0.85} />)}
      </svg>
      <Big T={T} at={k + 4} top={200} left={1280} w={660} s="Most groups: within about 5%." size={44} c={SAGE} />
      <Kicker T={T} at={k + 5.4} top={340} left={1280} s="SOURCES OF ERROR" />
      {['friction on the track (an external impulse)', 'photogate timing and flag length', 'measuring each cart’s mass', 'a push still acting at the first gate'].map((t, i) => <Big key={i} T={T} at={k + 6 + i * 0.8} top={400 + i * 90} left={1280} w={660} s={`· ${t}`} size={36} />)}
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.8} top={130} w={1880} s="Explain one result from today: a labeled sketch, a calculation, or an observation." size={52} />
      <div style={{ position: 'absolute', left: 60, top: 320, display: 'flex', gap: 30, opacity: env(T, e + 2) }}>
        {['the model or relationship you used', 'one assumption you made', 'your own evidence first'].map((t, i) => <div key={i} style={{ width: 590, padding: '20px 26px', borderRadius: 12, border: `3px solid ${[INDIGO, CORAL, SAGE][i]}`, background: '#ffffff', fontFamily: SERIF, fontSize: 42, color: INK, boxSizing: 'border-box', whiteSpace: 'normal' }}>{t}</div>)}
      </div>
      <Big T={T} at={e + 3.4} top={540} w={1880} s="e.g. “Trial 3: Σp before 0.30, after 0.29 kg·m/s, 3% apart. I assumed track friction was negligible.”" size={38} italic c={GREY} />
    </Scene>
  );
}
function Marz({ T, C }) {
  const s = C.Marz;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Marz" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>S4</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK, marginTop: 6 }}>Vernier collision measurement.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
      <Big T={T} at={s + 3.4} top={700} w={1880} s="If it holds for lab carts, we can trust it for asteroids (Days 11–13)." size={46} c={INDIGO} italic />
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






























function shotsU3D7(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Setup', 'Demo', 'Compute', 'Lab', 'Class', 'Exit', 'Marz'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU3D7(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Setup T={T} C={C} />
        <Demo T={T} C={C} />
        <Compute T={T} C={C} />
        <Lab T={T} C={C} />
        <Class T={T} C={C} />
        <Exit T={T} C={C} />
        <Marz T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U3Day7App() {
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
window.U3Day7App = U3Day7App;






























