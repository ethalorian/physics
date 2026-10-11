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

const ORDER = ['Title', 'Recap', 'Points', 'Curve', 'Read', 'Cannon', 'Exit', 'Scale', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'QUICK RECAP', 'g = GM/r². What are its units? And r is measured from where?'],
  Points: [2, 'GRAPH IT', 'Compute g at all five altitudes. Plot g against distance from Earth’s CENTRE, then connect the curve.'],
  Curve: [3, 'DISCUSS', 'Does the curve ever reach zero? Why or why not?'],
  Cannon: [4, 'DISCUSS', 'If the ISS is falling, why doesn’t it ever hit the ground? (Plant the idea: we’ll prove it on Day 13.)'],
  Exit: [5, 'EXIT TICKET', 'At what altitude does Earth’s g drop to half its surface value? Show the steps.'],
  Scale: [6, 'CHECK-IN', 'Where are you on K2 and R3? Rate yourself 0–4. Tomorrow: measure g in the lab.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Points: [2200, -1300], Curve: [2200, 0], Read: [0, 0], Cannon: [-2200, 0], Exit: [-2200, 1300], Scale: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const RE = 6.37e6, GS = 9.81;
const PTS = [['surface', 0, '6.37 × 10^6', 9.81], ['100 km', 1e5, '6.47 × 10^6', 9.51], ['1,000 km', 1e6, '7.37 × 10^6', 7.33], ['10,000 km', 1e7, '1.64 × 10^7', 1.49], ['lunar distance', 3.78e8, '3.84 × 10^8', 0.0027]];
// graph frame in card coords: x = r in Earth radii (1..12), y = g (0..10)
const GX0 = 200, GY0 = 880, GW = 1100, GH = 640;
const gx = (k) => GX0 + ((k - 1) / 11) * GW, gy = (g) => GY0 - (g / 10) * GH;
function Axes({ T, at }) {
  return (
    <g opacity={env(T, at)}>
      {[0, 2.5, 5, 7.5, 10].map((g) => <g key={g}><line x1={GX0} y1={gy(g)} x2={GX0 + GW} y2={gy(g)} stroke={TINT} strokeWidth={2} /><text x={GX0 - 14} y={gy(g) + 10} textAnchor="end" fontFamily={MONO} fontSize={28} fill={GREY}>{g}</text></g>)}
      {[1, 2, 4, 6, 8, 10, 12].map((k) => <g key={k}><line x1={gx(k)} y1={GY0 - GH} x2={gx(k)} y2={GY0} stroke={TINT} strokeWidth={2} /><text x={gx(k)} y={GY0 + 40} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY}>{k}</text></g>)}
      <line x1={GX0} y1={GY0 - GH - 10} x2={GX0} y2={GY0} stroke={INK} strokeWidth={4} /><line x1={GX0} y1={GY0} x2={GX0 + GW + 10} y2={GY0} stroke={INK} strokeWidth={4} />
      <text x={GX0 - 20} y={GY0 - GH - 50} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>{MS('g (m/s²)')}</text>
      <text x={GX0 + GW} y={GY0 + 84} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>r: distance from Earth’s centre (Earth radii)</text>
    </g>
  );
}
const curveD = (to) => Array.from({ length: Math.max(1, Math.floor((to - 1) * 10)) + 1 }, (_, i) => { const k = 1 + i * 0.1; return (i ? 'L ' : 'M ') + gx(k).toFixed(1) + ' ' + gy(GS / (k * k)).toFixed(1); }).join(' ');
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 2 · DAY 7 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Graphing g</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 96, lineHeight: 1.1, color: INDIGO }}>and planting the orbit idea</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>K2 · g(r) qualitatively and graphically.   R3 · Comparing g across distances and bodies.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · DAY 6" />
      <div style={{ position: 'absolute', left: 50, top: 140, opacity: env(T, r + 0.6), padding: '6px 40px 14px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, color: INK }}>{M('g = GM / r²')}</div>
      <Big T={T} at={r + 2.4} top={400} w={1880} s="An asteroid a million kilometres away doesn’t feel 9.81 m/s². But g(r) tells us what it does feel." size={48} />
      <Big T={T} at={r + 5} top={560} s="Units? And r from where?" size={64} c={INDIGO} italic />
    </Scene>
  );
}
function Points({ T, C }) {
  const p = C.Points;
  return (
    <Scene n="Points" T={T} C={C} ph={0.6}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, p + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, color: SAGE }}>{M('STOP 1 · N/kg (= m/s²). r is measured from Earth’s CENTRE: r = R_E + altitude.')}</div>
      <Kicker T={T} at={p + 2.4} top={130} s="FIVE POINTS TO PLOT" />
      <div style={{ position: 'absolute', left: 60, top: 190, width: 1880, opacity: env(T, p + 2.6), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', fontFamily: SANS, fontSize: 32, fontWeight: 500, color: INK, padding: '12px 24px' }}>
          <div style={{ width: 520 }}>altitude</div><div style={{ width: 640 }}>{M('r = R_E + altitude (m)')}</div><div>{M('g (m/s²)')}</div>
        </div>
        {PTS.map(([n, h, r], i) => <div key={i} style={{ display: 'flex', padding: '16px 24px', borderTop: `2px solid ${TINT}`, opacity: env(T, p + 3.4 + i * 0.8, 0.4) }}>
          <div style={{ width: 520, fontFamily: SERIF, fontSize: 44, color: INK }}>{n}</div>
          <div style={{ width: 640, fontFamily: MONO, fontSize: 38, color: GREY }}>{M(r)}</div>
          <div style={{ fontFamily: MONO, fontSize: 38, color: INDIGO }}>?</div>
        </div>)}
      </div>
      <Big T={T} at={p + 8} top={860} w={1880} s="Watch out: 100 km is 1.00 × 10^5 m. Add it to Earth’s radius before squaring." size={40} italic c={CORAL} />
    </Scene>
  );
}
function Curve({ T, C }) {
  const c = C.Curve, draw = 1 + 11 * eo((T - (c + 5)) / 2.4);
  const pts = PTS.slice(0, 4).map(([n, h, r, g]) => [(RE + h) / RE, g]);
  return (
    <Scene n="Curve" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={c + 0.3} top={44} s="ANSWER · THE POINTS AND THE CURVE" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Axes T={T} at={c + 0.6} />
        {pts.map(([k, g], i) => { const off = [[30, 6], [30, 46], [22, -14], [22, -14]][i]; return <g key={i} opacity={env(T, c + 1.2 + i * 0.8, 0.4)}><circle cx={gx(k)} cy={gy(g)} r={12} fill={CORAL} /><SV x={gx(k) + off[0]} y={gy(g) + off[1]} s={`${g}`} c={CORAL} size={34} /></g>; })}
        <path d={curveD(draw)} fill="none" stroke={INDIGO} strokeWidth={6} opacity={env(T, c + 5)} />
        <g opacity={env(T, c + 4.4)}><Arr x1={GX0 + GW - 120} y1={gy(0.6)} x2={GX0 + GW + 20} y2={gy(0.6)} c={GREY} w={5} h={16} /><SV x={GX0 + GW + 10} y={gy(0.6) - 26} s="lunar distance: r = 60 R, g = 0.0027" c={GREY} size={30} an="end" /></g>
      </svg>
      <Big T={T} at={c + 1.2} top={160} left={1360} w={580} s="surface 9.81 · 100 km 9.51 · 1,000 km 7.33 · 10,000 km 1.49 · lunar 0.0027 m/s²" size={36} />
      <Big T={T} at={c + 8} top={480} left={1360} w={580} s="Steep near Earth, then a long, flat tail." size={42} c={INDIGO} italic />
    </Scene>
  );
}
function Read({ T, C }) {
  const r = C.Read;
  const marks = [[1.063, 'LEO · ISS · 8.7', SAGE, 1], [1.414, 'half · 2,600 km up', CORAL, 3], [3.16, '10% · 13,800 km up', CORAL, 5.4], [6.62, 'GEO · 0.22', SAGE, 7.8], [10, '1% · 57,000 km up', CORAL, 10]];
  return (
    <Scene n="Read" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={r + 0.3} top={44} s="ANSWER · NEVER ZERO, JUST SMALLER AND SMALLER" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Axes T={T} at={r} />
        <path d={curveD(12)} fill="none" stroke={INDIGO} strokeWidth={6} />
        {marks.map(([k, l, c, at], i) => { const g = GS / (k * k), o = env(T, r + at, 0.5); return <g key={i} opacity={o}><line x1={gx(k)} y1={gy(g)} x2={gx(k)} y2={GY0} stroke={c} strokeWidth={3} strokeDasharray="8 8" /><circle cx={gx(k)} cy={gy(g)} r={11} fill={c} /><SV x={gx(k) + 18} y={gy(g) - 18 - (i % 2) * 40} s={l} c={c} size={32} /></g>; })}
      </svg>
      <Big T={T} at={r + 1} top={160} left={1360} w={580} s="GM/r² gets small, but for any finite r it isn’t zero." size={42} />
      <Big T={T} at={r + 3} top={340} left={1360} w={580} s="Half: r = √2 R. 10%: r = √10 R. 1%: r = 10 R." size={42} c={CORAL} />
      <Big T={T} at={r + 12} top={560} left={1360} w={580} s="Satellites in GEO still feel g ≈ 0.22 m/s². The Moon, 0.0027." size={40} italic c={GREY} />
    </Scene>
  );
}
function Cannon({ T, C }) {
  const c = C.Cannon, E = [700, 620], R = 240, H = R + 120;
  const shots = [[0.35, CORAL, 1.4], [0.6, '#c9963f', 4], [1, SAGE, 6.6]];
  const path = (v, u) => {
    if (v >= 1) { const a = -Math.PI / 2 + u * 2 * Math.PI; return [E[0] + H * Math.cos(a), E[1] + H * Math.sin(a)]; }
    const land = (v < 0.5 ? 35 : 80) * D2R;
    return Array.from({ length: 61 }, (_, k) => { const q = k / 60, a = -Math.PI / 2 + land * q, rr = H - (H - R) * q * q; return [E[0] + rr * Math.cos(a), E[1] + rr * Math.sin(a)]; });
  };
  return (
    <Scene n="Cannon" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={c + 0.3} top={44} s="BRIDGE · WHY ASTRONAUTS FLOAT" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={R} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, c + 0.6)} />
        <path d={`M ${E[0] - 14} ${E[1] - R + 2} L ${E[0] - 14} ${E[1] - H} L ${E[0] + 14} ${E[1] - H} L ${E[0] + 14} ${E[1] - R + 2}`} fill={INK} opacity={env(T, c + 0.6)} />
        {shots.map(([v, col, at], i) => {
          if (v >= 1) { const u = clamp((T - (c + at)) / 4, 0, 1); const n = Math.floor(u * 80); const d = Array.from({ length: n + 1 }, (_, k) => { const p = path(1, k / 80); return (k ? 'L ' : 'M ') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); const p = path(1, u); return <g key={i} opacity={env(T, c + at)}><path d={d} fill="none" stroke={col} strokeWidth={4} strokeDasharray="10 8" /><circle cx={p[0]} cy={p[1]} r={12} fill={col} /></g>; }
          const pts = path(v), u = clamp((T - (c + at)) / 2, 0, 1), n = Math.max(1, Math.floor(u * pts.length)), sub = pts.slice(0, n);
          return <g key={i} opacity={env(T, c + at)}><path d={'M ' + sub.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L ')} fill="none" stroke={col} strokeWidth={4} strokeDasharray="10 8" />{sub.length > 0 && <circle cx={sub[sub.length - 1][0]} cy={sub[sub.length - 1][1]} r={12} fill={col} />}</g>;
        })}
      </svg>
      <Big T={T} at={c + 0.8} top={140} left={1180} w={760} s="ISS astronauts feel g ≈ 8.7 m/s². They float because they’re FALLING, along with the station." size={42} />
      <Big T={T} at={c + 3} top={380} left={1180} w={760} s="Launch sideways faster and faster: the fall curves farther before landing." size={42} c={INDIGO} />
      <Big T={T} at={c + 7.6} top={580} left={1180} w={760} s="Fast enough, and the ground curves away as fast as it falls." size={44} c={SAGE} />
      <Big T={T} at={c + 10} top={760} left={1180} w={760} s="Free fall + sideways motion = orbit." size={52} c={INK} italic />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={110} s="Half of 9.81 is 4.9 m/s²." size={76} />
      <Big T={T} at={e + 2} top={250} s="At what altitude is g = 4.9 m/s²?" size={64} c={INDIGO} italic />
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 24, opacity: env(T, e + 3) }}>
        {['1 · set GM/r² = 4.9', '2 · solve for r', '3 · subtract Earth’s radius'].map((s, i) => <div key={i} style={{ opacity: env(T, e + 3 + i * 0.6), padding: '16px 28px', borderRadius: 10, border: `3px dashed ${[INDIGO, CORAL, SAGE][i]}`, background: '#ffffff', fontFamily: SERIF, fontSize: 44, color: INK }}>{M(s)}</div>)}
      </div>
    </Scene>
  );
}
function Scale({ T, C }) {
  const s = C.Scale;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Scale" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, display: 'flex', gap: 30 }}>
        {[['K2', 'g(r) qualitatively and graphically.'], ['R3', 'Comparing g across distances and bodies.']].map(([k, t], i) => <div key={i} style={{ width: 910, opacity: env(T, s + 0.6 + i * 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${i ? CORAL : INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: i ? CORAL : INDIGO }}>{k}</div><div style={{ fontFamily: SERIF, fontSize: 44, color: INK, whiteSpace: 'normal', marginTop: 6 }}>{t}</div></div>)}
      </div>
      <div style={{ position: 'absolute', left: 60, top: 380, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.6 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
      <Big T={T} at={s + 3.4} top={680} s="Tomorrow: measure g in the lab." size={56} c={INDIGO} italic />
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
















function shotsU2D7(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Points', 'Curve', 'Read', 'Cannon', 'Exit', 'Scale'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU2D7(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Recap T={T} C={C} />
        <Points T={T} C={C} />
        <Curve T={T} C={C} />
        <Read T={T} C={C} />
        <Cannon T={T} C={C} />
        <Exit T={T} C={C} />
        <Scale T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U2Day7App() {
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
window.U2Day7App = U2Day7App;
















