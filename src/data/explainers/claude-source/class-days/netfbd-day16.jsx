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

const ORDER = ['Title', 'Recap', 'OneD', 'Incline', 'Split', 'Space', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'YOUR TURN', 'A 5 kg box: 30 N pull forward, 10 N friction. Find the net force, then the acceleration.'],
  OneD: [2, 'DISCUSS', 'A block sits on a ramp. Gravity points straight down. Which part of gravity pulls the block DOWN the slope?'],
  Split: [3, 'PAIRS', 'Same 2 kg block, but a frictionless ramp at 20°. Find its acceleration down the slope.'],
  Space: [4, 'DISCUSS', 'A spacecraft orbits Earth with its engine firing forward. Draw its FBD. What makes up its net force?'],
  Exit: [5, 'EXIT TICKET', 'A 10 kg box on a level floor: pushed with 50 N forward, friction 15 N. Find the net force.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], OneD: [2200, -1300], Incline: [2200, 0], Split: [0, 0], Space: [-2200, 0], Exit: [-2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const Floor = ({ x0, x1, y, o = 1 }) => <g opacity={o}><line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={5} />{Array.from({ length: Math.floor((x1 - x0) / 60) }, (_, k) => <line key={k} x1={x0 + k * 60 + 10} y1={y + 4} x2={x0 + k * 60 - 14} y2={y + 26} stroke={GREY} strokeWidth={3} opacity={0.6} />)}</g>;
// FBD: dot + arrows [dx, dy, color, label, at]; label sits past the arrow tip
function FBD({ x, y, T, at, arrows, r = 18, off = 50 }) {
  const o = env(T, at, 0.6);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {arrows.map(([dx, dy, c, lab, a], i) => { const e = eo((T - a) / 0.7); if (e <= 0) return null; const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; const lp = arrows[i][5]; const lx = lp ? x + lp[0] : x + ux * r + dx + ux * off, ly = lp ? y + lp[1] : y + uy * r + dy + uy * off + (Math.abs(uy) > 0.5 ? (uy > 0 ? 20 : 8) : 12); return <g key={i}><Arr x1={x + ux * r} y1={y + uy * r} x2={x + ux * r + dx * e} y2={y + uy * r + dy * e} c={c} w={9} h={22} /><SV x={lx} y={ly} s={lab} c={c} size={38} an={lp ? 'middle' : Math.abs(ux) > 0.5 ? (ux > 0 ? 'start' : 'end') : 'middle'} o={e} /></g>; })}
      <circle cx={x} cy={y} r={r} fill={INK} />
    </g>
  );
}

const Fg = 'F_g (gravity)', Fn = 'F_N (normal)';
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 16 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Free body diagrams</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 100, lineHeight: 1.1, color: INDIGO }}>part 2 · net force</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: INDIGO }}>R9 · Net force (then acceleration) straight from the FBD — inclines included.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · DAY 15" />
      <Big T={T} at={r + 0.6} top={92} w={1880} s="An FBD shows every force. The net force is their VECTOR sum." size={56} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <FBD x={900} y={560} T={T} at={r + 2} arrows={[[0, 200, INDIGO, Fg, r + 2.4], [0, -200, SAGE, Fn, r + 3], [300, 0, CORAL, 'F_a = 30 N', r + 3.6], [-100, 0, GREY, 'F_f = 10 N', r + 4.2]]} />
      </svg>
      <div style={{ position: 'absolute', left: 1360, top: 300, opacity: env(T, r + 5), padding: '12px 28px', borderRadius: 10, border: `3px solid ${INK}`, background: '#ffffff', fontFamily: MONO, fontSize: 40, fontWeight: 600, color: INK }}>m = 5 kg</div>
      <Big T={T} at={r + 6} top={860} s="Net force? Acceleration?" size={60} c={INDIGO} italic />
    </Scene>
  );
}
function OneD({ T, C }) {
  const o = C.OneD, sum = eio((T - (o + 4)) / 1.4);
  return (
    <Scene n="OneD" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={o + 0.3} top={44} s="ANSWER · FORCES ON ONE AXIS" c={SAGE} />
      <Big T={T} at={o + 0.6} top={92} s="Choose a positive direction. Then: F_net = (sum +) − (sum −)" size={52} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Arr x1={300} y1={330} x2={300 + 300} y2={330} c={CORAL} w={12} h={28} o={env(T, o + 2)} />
        <SV x={450} y={300} s="+30 N" c={CORAL} size={44} an="middle" o={env(T, o + 2)} />
        <Arr x1={600} y1={390 - 60 * sum} x2={500} y2={390 - 60 * sum} c={GREY} w={12} h={28} o={env(T, o + 2.6) * (1 - env(T, o + 5.6, 0.4))} />
        <SV x={560} y={430} s="−10 N" c={GREY} size={44} an="middle" o={env(T, o + 2.6) * (1 - sum)} />
        <Arr x1={300} y1={420} x2={300 + 200 * env(T, o + 5.6, 0.8)} y2={420} c={SAGE} w={14} h={30} o={env(T, o + 5.6)} />
        <SV x={400} y={490} s="net 20 N" c={SAGE} size={48} an="middle" o={env(T, o + 6)} />
      </svg>
      <Big T={T} at={o + 4} top={240} left={900} s="F_net = 30 N − 10 N = 20 N forward" size={56} italic />
      <Big T={T} at={o + 7} top={340} left={900} s="a = F_net / m = 20 N ÷ 5 kg = 4 m/s²" size={56} italic c={INDIGO} />
      <Kicker T={T} at={o + 10.4} top={560} s="NOW TILT THE FLOOR" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, o + 10.8)}>
          <path d="M 300 980 L 1100 980 L 300 640 Z" fill="#eeeefa" stroke={INK} strokeWidth={4} />
          <rect x={560} y={690} width={120} height={80} rx={6} fill={CORAL_T} stroke={INK} strokeWidth={4} transform="rotate(23 620 770)" />
          <Arr x1={640} y1={770} x2={640} y2={930} c={INDIGO} w={9} h={22} o={env(T, o + 12)} />
          <SV x={660} y={900} s="F_g" c={INDIGO} size={40} o={env(T, o + 12)} />
        </g>
      </svg>
      <Big T={T} at={o + 13} top={700} left={1180} w={760} s="Gravity still points straight down. But the block can only move along the slope." size={44} />
    </Scene>
  );
}
const TH = 30, D = [Math.cos(TH * D2R), Math.sin(TH * D2R)], NRM = [Math.sin(TH * D2R), -Math.cos(TH * D2R)];
function Ramp({ T, at, x0 = 120, y0 = 380, L = 1000, s = 0.5, o = 1 }) {
  const P = [x0 + L * s * D[0], y0 + L * s * D[1]], bot = [x0 + L * D[0], y0 + L * D[1]];
  return (
    <g opacity={o * env(T, at)}>
      <path d={`M ${x0} ${y0} L ${bot[0]} ${bot[1]} L ${x0} ${bot[1]} Z`} fill="#eeeefa" stroke={INK} strokeWidth={4} />
      <path d={`M ${bot[0] - 110} ${bot[1]} A 110 110 0 0 1 ${bot[0] - 110 * D[0]} ${bot[1] - 110 * D[1]}`} fill="none" stroke={CORAL} strokeWidth={4} />
      <text x={bot[0] - 150} y={bot[1] - 18} fontFamily={SERIF} fontStyle="italic" fontSize={40} fill={CORAL}>{TH}°</text>
      <rect x={P[0] - 70} y={P[1] - 90} width={140} height={90} rx={6} fill={CORAL_T} stroke={INK} strokeWidth={4} transform={`rotate(${TH} ${P[0]} ${P[1]})`} />
    </g>
  );
}
function Incline({ T, C }) {
  const i = C.Incline, cx = 1500, cy = 480, G = 240;
  return (
    <Scene n="Incline" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={i + 0.3} top={44} s="ANSWER · SPLIT GRAVITY ALONG THE SLOPE" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g transform="translate(60 150) scale(0.7)"><Ramp T={T} at={i + 0.4} /></g>
        <g opacity={env(T, i + 1.6)}>
          <line x1={cx - 280 * D[0]} y1={cy - 280 * D[1]} x2={cx + 280 * D[0]} y2={cy + 280 * D[1]} stroke={GREY} strokeWidth={2} strokeDasharray="10 10" />
          <line x1={cx - 280 * NRM[0]} y1={cy - 280 * NRM[1]} x2={cx + 280 * NRM[0]} y2={cy + 280 * NRM[1]} stroke={GREY} strokeWidth={2} strokeDasharray="10 10" />
          <SV x={cx + 300 * D[0]} y={cy + 300 * D[1] + 10} s="along slope" c={GREY} size={32} />
          <SV x={cx + 300 * NRM[0] + 10} y={cy + 300 * NRM[1]} s="perpendicular" c={GREY} size={32} />
          <circle cx={cx} cy={cy} r={18} fill={INK} />
        </g>
        <Arr x1={cx} y1={cy + 18} x2={cx} y2={cy + G} c={INDIGO} w={9} h={22} o={env(T, i + 2.4)} />
        <SV x={cx - 20} y={cy + G + 46} s="F_g = mg" c={INDIGO} size={38} an="end" o={env(T, i + 2.4)} />
        <Arr x1={cx} y1={cy} x2={cx + G * Math.sin(TH * D2R) * D[0]} y2={cy + G * Math.sin(TH * D2R) * D[1]} c={CORAL} w={8} h={20} dash="14 8" o={env(T, i + 4.4)} />
        <SV x={cx + 150} y={cy + 30} s="mg sin θ" c={CORAL} size={36} o={env(T, i + 4.4)} />
        <Arr x1={cx} y1={cy} x2={cx - G * Math.cos(TH * D2R) * NRM[0]} y2={cy - G * Math.cos(TH * D2R) * NRM[1]} c={SAGE} w={8} h={20} dash="14 8" o={env(T, i + 6.4)} />
        <SV x={cx - 140} y={cy + 160} s="mg cos θ" c={SAGE} size={36} an="end" o={env(T, i + 6.4)} />
        <path d={`M ${cx} ${cy + 90} A 90 90 0 0 1 ${cx - 90 * NRM[0]} ${cy - 90 * NRM[1]}`} fill="none" stroke={CORAL} strokeWidth={3} opacity={env(T, i + 8)} />
        <SV x={cx - 34} y={cy + 140} s="θ" c={CORAL} size={36} o={env(T, i + 8)} />
      </svg>
      <Big T={T} at={i + 4.4} top={790} w={1180} s="Down the slope: mg sin θ  (opposite the angle → sin)" size={42} c={CORAL} />
      <Big T={T} at={i + 6.4} top={860} w={1180} s="Into the slope: mg cos θ  (adjacent to the angle → cos)" size={42} c={SAGE} />
      <Big T={T} at={i + 9} top={120} w={1880} s="The angle between F_g and the perpendicular axis equals the ramp angle θ." size={38} italic c={GREY} />
    </Scene>
  );
}
function Split({ T, C }) {
  const s = C.Split;
  const lines = [
    [s + 0.6, 'm = 2 kg · θ = 30° · friction 4.0 N up the slope', INK],
    [s + 2.6, 'mg = (2)(9.8) = 19.6 N', INK],
    [s + 4.6, 'down the slope: (19.6)(sin 30°) = 9.8 N', CORAL],
    [s + 6.6, 'into the slope: (19.6)(cos 30°) = 17.0 N → F_N = 17.0 N', SAGE],
    [s + 9.4, 'along the slope: F_net = 9.8 N − 4.0 N = 5.8 N down', INK],
    [s + 12, 'a = F_net / m = 5.8 ÷ 2 = 2.9 m/s² down the slope', INDIGO],
  ];
  return (
    <Scene n="Split" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={s + 0.3} top={44} s="ONE COMPLETE EXAMPLE" />
      {lines.map(([at, t, c], k) => <Big key={k} T={T} at={at} top={110 + k * 96} s={t} size={k === 5 ? 56 : 50} italic={k > 0} c={c} />)}
      <div style={{ position: 'absolute', left: 60, top: 720, width: 980, whiteSpace: 'normal', boxSizing: 'border-box', opacity: env(T, s + 7.6), padding: '10px 24px', borderRadius: 10, background: SAGE_T, border: `2px solid ${SAGE}`, fontFamily: SERIF, fontSize: 38, lineHeight: 1.25, color: INK }}>{M('Perpendicular to the slope, F_N and mg cos θ cancel: no motion into the ramp.')}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g transform="translate(1100 560) scale(0.62)"><Ramp T={T} at={s + 0.6} x0={0} y0={0} /></g>
      </svg>
      <Big T={T} at={s + 14} top={870} w={1880} s="Recipe: FBD → split gravity → add along the slope → a = F_net / m." size={44} c={INDIGO} />
    </Scene>
  );
}
function Space({ T, C }) {
  const p = C.Space, ang = (T - p) * 0.5, E = [560, 560], R = 280;
  const sx = E[0] + R * Math.cos(ang), sy = E[1] + R * Math.sin(ang);
  return (
    <Scene n="Space" T={T} C={C} ph={0.5}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, p + 0.3), fontFamily: MONO, fontSize: 36, fontWeight: 600, color: SAGE }}>{M('STOP 3 · a = g sin 20° = (9.8)(0.342) ≈ 3.4 m/s² (mass cancels)')}</div>
      <Kicker T={T} at={p + 2.4} top={120} s="OUT IN SPACE" />
      <Big T={T} at={p + 2.8} top={170} left={1000} w={940} s="2026-XJ: no surfaces, so no normal force and no friction. Its FBD is just gravity arrows." size={46} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={90} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, p + 5)} />
        <SV x={E[0]} y={E[1] + 14} s="Earth" c={INK} size={38} an="middle" o={env(T, p + 5)} />
        <circle cx={E[0]} cy={E[1]} r={R} fill="none" stroke={TINT} strokeWidth={3} strokeDasharray="10 10" opacity={env(T, p + 5)} />
        <g opacity={env(T, p + 5)}><rect x={sx - 24} y={sy - 16} width={48} height={32} rx={6} fill={SAGE_T} stroke={INK} strokeWidth={3} transform={`rotate(${ang / D2R + 90} ${sx} ${sy})`} /></g>
      </svg>
      <Big T={T} at={p + 6} top={500} left={1000} w={940} s="A spacecraft in orbit around Earth: gravity, plus thrust when its engine fires." size={46} c={INDIGO} />
      <Big T={T} at={p + 10} top={760} left={1000} w={940} s="Mission planners draw exactly these FBDs to plan a trajectory." size={42} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, by = 760;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>STOP 4 · Earth’s gravity (toward Earth’s centre) + engine thrust (forward). The net force is their vector sum.</div>
      <Kicker T={T} at={e + 2.4} top={160} s="EXIT TICKET" />
      <Big T={T} at={e + 2.8} top={210} s="10 kg box · 50 N push · 15 N friction" size={66} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={300} x1={1700} y={by} o={env(T, e + 3.4)} />
        <rect x={900} y={by - 160} width={200} height={160} rx={8} fill={CORAL_T} stroke={INK} strokeWidth={4} opacity={env(T, e + 3.4)} />
        <text x={1000} y={by - 66} textAnchor="middle" fontFamily={MONO} fontSize={36} fontWeight={600} fill={INK} opacity={env(T, e + 3.4)}>10 kg</text>
        <Arr x1={640} y1={by - 80} x2={890} y2={by - 80} c={CORAL} w={10} h={26} o={env(T, e + 4)} />
        <SV x={765} y={by - 110} s="50 N" c={CORAL} size={46} an="middle" o={env(T, e + 4)} />
                <Arr x1={890} y1={by - 24} x2={815} y2={by - 24} c={GREY} w={10} h={24} o={env(T, e + 4.6)} />
        <SV x={790} y={by - 10} s="15 N" c={GREY} size={44} an="end" o={env(T, e + 4.6)} />
        <SV x={1000} y={by - 230} s="F_net = ?" c={INDIGO} size={58} an="middle" o={env(T, e + 5.4)} />
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






function shots16(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'OneD', 'Incline', 'Split', 'Space', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots16(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Recap T={T} C={C} />
        <OneD T={T} C={C} />
        <Incline T={T} C={C} />
        <Split T={T} C={C} />
        <Space T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function NetFbdDay16App() {
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
window.NetFbdDay16App = NetFbdDay16App;






