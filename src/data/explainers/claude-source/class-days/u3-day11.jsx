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

const ORDER = ['Title', 'Brief', 'Case', 'Answer', 'Group', 'Solve', 'Exit', 'Discuss', 'Marz', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Brief: [1, 'VIDEO', 'Who has heard of DART? Show the 1-minute mission animation now.'],
  Case: [2, 'YOUR TURN', 'Treat it as perfectly inelastic. Estimate the change in Dimorphos’s velocity, Δv.'],
  Group: [3, 'GROUP PROBLEM', 'What Δv would shift 2026-XJ by one Earth radius in 6 months? How many DART-sized hits is that?'],
  Exit: [4, 'EXIT TICKET', 'Explain one result with a sketch or calculation. Name the model you used and one assumption.'],
  Discuss: [5, 'DISCUSS', 'Is the Δv we need DART-scale, or much bigger? What does that tell us about real planetary defense?'],
  Marz: [6, 'CHECK-IN', 'Where are you on R3? Rate yourself 0–4.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Brief: [0, -1300], Case: [2200, -1300], Answer: [2200, 0], Group: [0, 0], Solve: [-2200, 0], Exit: [-2200, 1300], Discuss: [0, 1300], Marz: [2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr2 = ({ x1, y1, x2, y2, c, w = 9, o = 1, h = 22, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
function Craft({ x, y, o = 1 }) {
  return <g opacity={o}><rect x={x - 18} y={y - 10} width={36} height={20} rx={3} fill="#ffffff" stroke={INK} strokeWidth={3} /><line x1={x - 18} y1={y} x2={x - 80} y2={y - 40} stroke={INDIGO} strokeWidth={4} /><line x1={x - 18} y1={y} x2={x - 80} y2={y + 40} stroke={INDIGO} strokeWidth={4} /></g>;
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 3 · DAY 11 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Could we deflect it?</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, lineHeight: 1.15, color: INDIGO, whiteSpace: 'normal', width: 1600 }}>NASA’s DART, 2022: a 32-minute change to an asteroid’s orbit</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 48, color: INDIGO }}>R3 · Reason about asteroid deflection using momentum and impulse.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Brief({ T, C }) {
  const b = C.Brief, D = [1300, 560], R0 = 240, R1 = 222, hit = b + 6;
  const R = T < hit ? R0 : lerp(R0, R1, eo((T - hit) / 1.5)), om = T < hit ? 0.9 : 0.9 * Math.pow(R0 / R, 1.5);
  const ang = (T - b) * om + 0.6, mx = D[0] + R * Math.cos(ang), my = D[1] + R * Math.sin(ang);
  const hA = (hit - b) * 0.9 + 0.6, hx = D[0] + R0 * Math.cos(hA), hy = D[1] + R0 * Math.sin(hA);
  const u = clamp((T - (b + 2)) / 4, 0, 1), sx = lerp(hx - 600, hx - 30, u), sy = lerp(hy - 260, hy, u), fl = T > hit && T < hit + 0.8 ? 1 - (T - hit) / 0.8 : 0;
  return (
    <Scene n="Brief" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={b + 0.3} top={44} s="DART · DOUBLE ASTEROID REDIRECTION TEST · 26 SEPTEMBER 2022" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={D[0]} cy={D[1]} r={R0} fill="none" stroke={TINT} strokeWidth={3} strokeDasharray="10 8" opacity={env(T, b + 0.6)} />
        {T > hit && <circle cx={D[0]} cy={D[1]} r={R} fill="none" stroke={SAGE} strokeWidth={3} />}
        <Rock x={D[0]} y={D[1]} r={100} spin={T * 4} o={env(T, b + 0.6)} />
        <SV x={D[0]} y={D[1] + 150} s="Didymos" c={GREY} size={34} an="middle" o={env(T, b + 0.6)} />
        <Rock x={mx} y={my} r={28} spin={T * 20} o={env(T, b + 0.6)} />
        {T > b + 2 && T < hit && <Craft x={sx} y={sy} />}
        {fl > 0 && <circle cx={hx} cy={hy} r={20 + 70 * (1 - fl)} fill={CORAL} opacity={0.6 * fl} />}
      </svg>
      <Big T={T} at={b + 1} top={170} w={860} s="A spacecraft crashed into Dimorphos, the small moonlet orbiting the asteroid Didymos, on purpose." size={44} />
      <Big T={T} at={b + 8} top={430} w={860} s="Orbit period: 11 h 55 min → 11 h 23 min" size={46} c={SAGE} />
      <Big T={T} at={b + 9.4} top={520} w={860} s="32 minutes shorter: the first time humans moved a celestial body." size={42} />
      <Big T={T} at={b + 11} top={700} w={860} s="(Orbit shrink exaggerated here so you can see it.)" size={32} italic c={GREY} />
    </Scene>
  );
}
function Case({ T, C }) {
  const c = C.Case, R = [1300, 600], u = clamp((T - (c + 1)) / 2.4, 0, 1), sx = lerp(400, R[0] - 210, u);
  return (
    <Scene n="Case" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={c + 0.3} top={44} s="CASE STUDY · MODEL IT AS PERFECTLY INELASTIC" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Rock x={R[0]} y={R[1]} r={180} spin={T * 3} o={env(T, c + 0.6)} />
        <Craft x={sx} y={R[1]} o={env(T, c + 0.8)} />
        <Arr2 x1={sx - 260} y1={R[1] - 110} x2={sx - 100} y2={R[1] - 110} c={CORAL} o={env(T, c + 1.4)} />
      </svg>
      <Big T={T} at={c + 1.4} top={160} w={900} s="DART: m ≈ 600 kg at v ≈ 6 km/s" size={48} c={CORAL} />
      <Big T={T} at={c + 2.4} top={250} w={900} s="Dimorphos: M ≈ 5 × 10^9 kg, effectively at rest" size={44} c={GREY} />
      <Big T={T} at={c + 3.6} top={360} w={900} s="mv = (m + M) Δv" size={66} italic c={INDIGO} />
      <Big T={T} at={c + 5} top={470} w={900} s="Δv = mv / (m + M)" size={56} italic c={INDIGO} />
    </Scene>
  );
}
function Answer({ T, C }) {
  const a = C.Answer, X0 = 160, Y = 720, L = 1680, t = clamp((T - (a + 6)) / 6, 0, 1);
  return (
    <Scene n="Answer" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={a + 0.3} top={44} s="STOP 2 ANSWER" c={SAGE} />
      <Big T={T} at={a + 0.8} top={110} s="p = (600)(6000) = 3.6 × 10^6 kg·m/s" size={46} italic c={INDIGO} />
      <Big T={T} at={a + 2} top={190} s="Δv = 3.6 × 10^6 / (5 × 10^9) ≈ 7 × 10^−4 m/s ≈ 0.7 mm/s" size={46} italic c={INDIGO} />
      <div style={{ position: 'absolute', left: 60, top: 290, width: 1880, opacity: env(T, a + 3.6), padding: '12px 26px', borderRadius: 10, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontSize: 38, color: INK, boxSizing: 'border-box', whiteSpace: 'normal' }}>Measured: about 2.7 mm/s, several times more. Rock blasted off the surface carried momentum backward, so the asteroid got an extra push.</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, a + 5.4)}>
          <line x1={X0} y1={Y} x2={X0 + L} y2={Y} stroke={GREY} strokeWidth={3} strokeDasharray="10 8" />
          <line x1={X0} y1={Y} x2={X0 + L * t} y2={Y - 200 * t} stroke={CORAL} strokeWidth={5} />
          <Rock x={X0 + L * t} y={Y - 200 * t} r={20} spin={T * 20} />
          <line x1={X0 + L} y1={Y} x2={X0 + L} y2={Y - 200 * t} stroke={SAGE} strokeWidth={4} opacity={t > 0.95 ? 1 : 0} />
          <SV x={X0 + L - 20} y={Y + 50} s="original path" c={GREY} size={32} an="end" />
          <SV x={X0 + L + 20} y={Y - 90} s="drift = Δv × t" c={SAGE} size={36} o={t > 0.95 ? 1 : 0} />
        </g>
      </svg>
      <Big T={T} at={a + 6.4} top={460} w={1880} s="Tiny, but it adds up: the position drifts farther off course every second, for years." size={42} />
      <Big T={T} at={a + 12.6} top={860} w={1880} s="0.7 mm/s for 10 years (3.2 × 10^8 s) ≈ 220 km of drift. (Simple straight-line model.)" size={38} italic c={GREY} />
    </Scene>
  );
}
function Group({ T, C }) {
  const g = C.Group, E = [500, 600];
  return (
    <Scene n="Group" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={g + 0.3} top={44} s="GROUP PROBLEM · CLASS NUMBERS FOR THIS EXERCISE" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={140} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, g + 0.6)} />
        <SV x={E[0]} y={E[1] + 14} s="Earth" c={INK} size={42} an="middle" o={env(T, g + 0.6)} />
        <g opacity={env(T, g + 1.4)}><line x1={E[0]} y1={E[1]} x2={E[0]} y2={E[1] - 140} stroke={SAGE} strokeWidth={4} /><SV x={E[0]} y={E[1] - 160} s="R_E = 6.37 × 10^6 m" c={SAGE} size={30} an="middle" /></g>
        <Rock x={E[0] + 520} y={E[1] - 330} r={24} spin={T * 20} o={env(T, g + 1)} />
        <Arr2 x1={E[0] + 500} y1={E[1] - 330} x2={E[0] + 300} y2={E[1] - 330} c={GREY} w={6} h={16} dash="10 8" o={env(T, g + 1)} />
      </svg>
      <Big T={T} at={g + 2} top={160} left={1100} w={840} s="2026-XJ: m = 1 × 10^9 kg" size={46} />
      <Big T={T} at={g + 2.8} top={250} left={1100} w={840} s="Goal: shift its path by one Earth radius" size={44} c={SAGE} />
      <Big T={T} at={g + 3.6} top={340} left={1100} w={840} s="Lead time: 6 months ≈ 1.6 × 10^7 s" size={44} c={CORAL} />
      <Big T={T} at={g + 4.6} top={470} left={1100} w={840} s="Model: drift = Δv × t (straight line)" size={40} italic c={GREY} />
      <Big T={T} at={g + 5.4} top={560} left={1100} w={840} s="Then: Δp = m Δv. How many DART-sized hits (3.6 × 10^6 kg·m/s each)?" size={40} italic c={INDIGO} />
    </Scene>
  );
}
function Solve({ T, C }) {
  const s = C.Solve, n = 110, cols = 22, cnt = Math.floor(n * clamp((T - (s + 6.4)) / 2.4, 0, 1));
  return (
    <Scene n="Solve" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={s + 0.3} top={44} s="STOP 3 ANSWER" c={SAGE} />
      <Big T={T} at={s + 0.8} top={110} s="Δv = drift / t = 6.37 × 10^6 / 1.6 × 10^7 ≈ 0.40 m/s" size={48} italic c={INDIGO} />
      <Big T={T} at={s + 2.4} top={200} s="Δp = m Δv = (1 × 10^9)(0.40) = 4 × 10^8 kg·m/s" size={48} italic c={INDIGO} />
      <Big T={T} at={s + 4} top={290} s="4 × 10^8 / 3.6 × 10^6 ≈ 110 DART-sized hits" size={56} c={CORAL} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {Array.from({ length: cnt }, (_, k) => <g key={k} transform={`translate(${120 + (k % cols) * 80} ${470 + Math.floor(k / cols) * 80})`}><rect x={-14} y={-8} width={28} height={16} rx={3} fill="#ffffff" stroke={INK} strokeWidth={2.5} /><line x1={-14} y1={0} x2={-34} y2={-14} stroke={INDIGO} strokeWidth={3} /><line x1={-14} y1={0} x2={-34} y2={14} stroke={INDIGO} strokeWidth={3} /></g>)}
      </svg>
      <Big T={T} at={s + 9.4} top={890} w={1880} s="(About 30, if each hit gets DART’s real ejecta boost.)" size={36} italic c={GREY} />
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
      <Big T={T} at={e + 3.4} top={540} w={1880} s="e.g. “DART gave Dimorphos Δv ≈ 0.7 mm/s (mv = (m + M)Δv). I assumed it was perfectly inelastic and ignored the ejecta.”" size={38} italic c={GREY} />
    </Scene>
  );
}
function Discuss({ T, C }) {
  const d = C.Discuss, B = 1400;
  return (
    <Scene n="Discuss" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={d + 0.3} top={44} s="DART-SCALE, OR MUCH BIGGER?" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 0.8)}>
          <text x={60} y={300} fontFamily={MONO} fontSize={28} fontWeight={600} fill={GREY}>{MS('ONE DART on 10^9 kg')}</text>
          <rect x={540} y={268} width={Math.max(4, B * (0.0036 / 0.4)) * eo((T - (d + 1)) / 0.8)} height={44} rx={4} fill={INDIGO} />
          <text x={560 + B * 0.009} y={302} fontFamily={MONO} fontSize={28} fontWeight={600} fill={INK}>3.6 mm/s</text>
          <text x={60} y={420} fontFamily={MONO} fontSize={28} fontWeight={600} fill={GREY}>NEEDED (6 months)</text>
          <rect x={540} y={388} width={B * eo((T - (d + 1.8)) / 1.2)} height={44} rx={4} fill={CORAL} />
          <text x={560 + B} y={422} fontFamily={MONO} fontSize={28} fontWeight={600} fill={INK} textAnchor="end" dx={-30} dy={-60}>0.40 m/s</text>
        </g>
      </svg>
      <Big T={T} at={d + 3.4} top={520} w={1880} s="More warning time → a smaller push. Ten years instead of six months needs about 20× less." size={44} c={SAGE} />
      <Big T={T} at={d + 5.4} top={620} w={1880} s="Real defense: find asteroids early, and nudge them long before any close approach." size={44} />
      <Big T={T} at={d + 7.4} top={760} w={1880} s="(Real orbits make an early along-track nudge even more effective than our straight-line model.)" size={34} italic c={GREY} />
    </Scene>
  );
}
function Marz({ T, C }) {
  const s = C.Marz;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Marz" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>R3</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK, marginTop: 6 }}>Reason about asteroid deflection using momentum and impulse.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
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


































function shotsU3D11(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Brief', 'Case', 'Answer', 'Group', 'Solve', 'Exit', 'Discuss', 'Marz'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU3D11(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Brief T={T} C={C} />
        <Case T={T} C={C} />
        <Answer T={T} C={C} />
        <Group T={T} C={C} />
        <Solve T={T} C={C} />
        <Exit T={T} C={C} />
        <Discuss T={T} C={C} />
        <Marz T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U3Day11App() {
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
window.U3Day11App = U3Day11App;


































