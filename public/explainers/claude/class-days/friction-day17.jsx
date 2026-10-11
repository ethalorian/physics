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

const ORDER = ['Title', 'Hook', 'Types', 'Lab', 'Data', 'Space', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Hook: [1, 'PREDICT', 'Why is it easier to keep a heavy box sliding than to get it started? Write your best explanation.'],
  Types: [2, 'YOUR TURN', 'A 10 kg box: μ_s = 0.5, μ_k = 0.3. What push starts it moving? What push keeps it at constant speed?'],
  Lab: [3, 'LAB', 'Pull at constant velocity on each surface. Then double the mass, then change the speed. Record f and N.'],
  Data: [4, 'DISCUSS', 'Doubling the mass doubled the friction. Did μ change? Why or why not?'],
  Exit: [5, 'EXIT TICKET', 'Why does space being frictionless make asteroid deflection both easier AND harder?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Hook: [0, -1300], Types: [2200, -1300], Lab: [2200, 0], Data: [0, 0], Space: [-2200, 0], Exit: [-2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const Floor = ({ x0, x1, y, o = 1, rough = false }) => <g opacity={o}><line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={5} />{Array.from({ length: Math.floor((x1 - x0) / 60) }, (_, k) => <line key={k} x1={x0 + k * 60 + 10} y1={y + 4} x2={x0 + k * 60 - 14} y2={y + 26} stroke={GREY} strokeWidth={3} opacity={0.6} />)}{rough && <path d={Array.from({ length: Math.floor((x1 - x0) / 12) }, (_, k) => `${k ? 'L' : 'M'} ${x0 + k * 12} ${y - (k % 2 ? 6 : 0)}`).join(' ')} fill="none" stroke={INK} strokeWidth={2} />}</g>;
const Crate = ({ x, y, w = 200, h = 160, o = 1, label }) => <g opacity={o}><rect x={x - w / 2} y={y - h} width={w} height={h} rx={6} fill={CORAL_T} stroke={INK} strokeWidth={4} /><path d={`M ${x - w / 2} ${y - h} L ${x + w / 2} ${y} M ${x + w / 2} ${y - h} L ${x - w / 2} ${y}`} stroke={INK} strokeWidth={2} opacity={0.3} />{label && <text x={x} y={y - h / 2 + 14} textAnchor="middle" fontFamily={MONO} fontSize={34} fontWeight={600} fill={INK}>{label}</text>}</g>;

function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 17 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Friction</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 100, lineHeight: 1.1, color: INDIGO }}>the force that resists motion</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: INDIGO }}>R10 · Friction from the surfaces and the normal force — static vs kinetic.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Hook({ T, C }) {
  const h = C.Hook, t = T - (h + 2), strain = t > 0 && t < 3 ? 4 * Math.sin(t * 30) : 0;
  const move = t > 3 ? 200 * (t - 3) : 0, bx = 900 + Math.min(move, 700);
  const push = t < 3 ? 100 + 60 * clamp(t / 3, 0, 1) : 120;
  return (
    <Scene n="Hook" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={h + 0.3} top={44} s="WARM-UP" />
      <Big T={T} at={h + 0.6} top={92} s="Pushing a heavy box" size={70} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={200} x1={1800} y={720} o={env(T, h + 1)} />
        <Crate x={bx + strain} y={720} label="heavy" o={env(T, h + 1)} />
        <Arr x1={bx - 120 - push} y1={640} x2={bx - 112} y2={640} c={CORAL} w={10 + (t < 3 ? 4 : 0)} h={26} o={env(T, h + 2)} />
        <SV x={bx - 200} y={600} s={t < 3 ? 'push… harder…' : 'easier now'} c={CORAL} size={42} an="middle" o={env(T, h + 2)} />
      </svg>
      <Big T={T} at={h + 6.6} top={830} s="Hard to get it started. Easier once it’s sliding. Why?" size={54} c={INDIGO} italic />
    </Scene>
  );
}
function Types({ T, C }) {
  const ty = C.Types, G = { x: 1060, y: 330, w: 820, h: 440 }, ap = clamp((T - (ty + 4)) / 6, 0, 1);
  const X = (u) => G.x + u * G.w, Y = (f) => G.y + G.h - (f / 60) * G.h, peak = 0.62;
  const fr = (u) => (u < peak ? 49 * (u / peak) : 29.4 + 1.2 * Math.sin(u * 60));
  const n = Math.floor(ap * 60);
  return (
    <Scene n="Types" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={ty + 0.3} top={44} s="ANSWER · TWO KINDS OF FRICTION" c={SAGE} />
      <Big T={T} at={ty + 0.6} top={100} w={940} s="Static friction holds it still. It grows to match your push, up to a maximum." size={46} />
      <Big T={T} at={ty + 2.4} top={260} w={940} s="Kinetic friction acts once it slides. It’s usually smaller." size={46} c={INDIGO} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, ty + 3.6)}>
          <line x1={G.x} y1={G.y - 10} x2={G.x} y2={G.y + G.h} stroke={INK} strokeWidth={4} />
          <line x1={G.x} y1={G.y + G.h} x2={G.x + G.w + 10} y2={G.y + G.h} stroke={INK} strokeWidth={4} />
          <text x={G.x + 14} y={G.y + 4} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>friction (N)</text>
          <text x={G.x + G.w} y={G.y + G.h + 44} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>your push, increasing →</text>
          {n > 0 && <path d={Array.from({ length: n + 1 }, (_, k) => { const u = k / 60; return (k ? 'L ' : 'M ') + X(u).toFixed(1) + ' ' + Y(fr(u)).toFixed(1); }).join(' ')} fill="none" stroke={CORAL} strokeWidth={6} />}
          {ap > peak && <g><circle cx={X(peak)} cy={Y(49)} r={12} fill={CORAL} /><SV x={X(peak) - 16} y={Y(49) - 20} s="max static: it starts to slide" c={CORAL} size={34} an="end" /><SV x={X(0.82)} y={Y(29.4) + 50} s="kinetic" c={INDIGO} size={36} an="middle" /></g>}
          {ap > 0.2 && <SV x={X(0.32)} y={Y(10) + 10} s="static" c={CORAL} size={36} an="start" />}
        </g>
      </svg>
      <Kicker T={T} at={ty + 10.4} top={440} s="BOTH DEPEND ON" />
      <Big T={T} at={ty + 10.8} top={490} w={940} s="1 · the normal force N pressing the surfaces together" size={42} />
      <Big T={T} at={ty + 12} top={560} w={940} s="2 · the surface pair: the coefficient μ" size={42} />
      <div style={{ position: 'absolute', left: 60, top: 680, display: 'flex', gap: 30, opacity: env(T, ty + 13.4) }}>
        <div style={{ padding: '10px 26px', borderRadius: 10, border: `3px solid ${CORAL}`, background: '#ffffff', fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, color: INK }}>{M('f_s ≤ μ_s N')}</div>
        <div style={{ padding: '10px 26px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, color: INK }}>{M('f_k = μ_k N')}</div>
      </div>
      <Big T={T} at={ty + 15} top={820} w={940} s="Usually μ_s > μ_k: harder to start than to keep going." size={44} c={SAGE} italic />
    </Scene>
  );
}
function Lab({ T, C }) {
  const l = C.Lab, u = ((T - l) * 0.12) % 1, bx = 420 + 900 * u, f = 1.47 + 0.05 * Math.sin(T * 9);
  const surf = Math.floor(((T - l) / 4) % 3), names = ['wax paper', 'paper', 'sandpaper'];
  return (
    <Scene n="Lab" T={T} C={C} ph={0.9}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, l + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>{M('STOP 2 · N = mg = 98 N. Start: more than μ_s N = 49 N. Keep it going: μ_k N = 29.4 N.')}</div>
      <Kicker T={T} at={l + 2.4} top={140} s="INVESTIGATION 1.5 · FRICTION ON A CART" />
      <Big T={T} at={l + 2.8} top={190} w={1880} s="Pull at constant velocity. Then a = 0, so the sensor reading IS the friction force." size={50} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={200} x1={1700} y={680} rough={surf === 2} o={env(T, l + 3.6)} />
        <rect x={200} y={672} width={1500} height={8} fill={[TINT, '#ffffff', '#c9b79c'][surf]} opacity={env(T, l + 3.6)} />
        <g opacity={env(T, l + 3.6)}>
          <rect x={bx - 90} y={580} width={180} height={100} rx={8} fill={SAGE_T} stroke={INK} strokeWidth={4} />
          <rect x={bx - 70} y={556} width={140} height={24} rx={4} fill="#d7d8ea" stroke={INK} strokeWidth={3} />
          <line x1={bx + 90} y1={630} x2={bx + 200} y2={630} stroke={GREY} strokeWidth={4} />
          <rect x={bx + 200} y={600} width={120} height={60} rx={10} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <text x={bx + 260} y={640} textAnchor="middle" fontFamily={MONO} fontSize={26} fontWeight={600} fill={CORAL}>{`${f.toFixed(2)} N`}</text>
        </g>
        <SV x={1700} y={760} s={`surface: ${names[surf]}`} c={GREY} size={38} an="end" o={env(T, l + 4)} />
      </svg>
      <div style={{ position: 'absolute', left: 60, top: 820, display: 'flex', gap: 20, opacity: env(T, l + 6) }}>
        {['vary the surface', 'vary the mass', 'vary the speed'].map((t, k) => <div key={k} style={{ opacity: env(T, l + 6 + k * 0.8), padding: '10px 24px', borderRadius: 8, background: '#eeeefa', border: `2px solid ${LINE}`, fontFamily: SERIF, fontSize: 42, color: INK }}>{t}</div>)}
        <div style={{ opacity: env(T, l + 9), alignSelf: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>{M('μ_k = f / N')}</div>
      </div>
    </Scene>
  );
}
const ROWS = [['wax paper', '0.50', '4.9', '0.74', '0.15'], ['paper', '0.50', '4.9', '1.47', '0.30'], ['sandpaper', '0.50', '4.9', '2.45', '0.50'], ['paper · 2× mass', '1.00', '9.8', '2.94', '0.30'], ['paper · 2× speed', '0.50', '4.9', '1.45', '0.30']];
function Data({ T, C }) {
  const d = C.Data;
  return (
    <Scene n="Data" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={d + 0.3} top={44} s="EXAMPLE CLASS DATA · FRICTION BLOCK ON THE CART" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, d + 0.6), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', fontFamily: SANS, fontSize: 32, fontWeight: 500, color: INK, padding: '12px 24px' }}>
          <div style={{ width: 560 }}>surface</div><div style={{ width: 300 }}>m (kg)</div><div style={{ width: 300 }}>N (N)</div><div style={{ width: 300 }}>f (N)</div><div style={{ color: SAGE }}>{M('μ_k = f/N')}</div>
        </div>
        {ROWS.map((r, k) => <div key={k} style={{ display: 'flex', padding: '12px 24px', borderTop: `2px solid ${TINT}`, fontFamily: MONO, fontSize: 38, fontWeight: 500, opacity: env(T, d + 1.4 + k * 1.2, 0.4), background: k === 3 ? `rgba(247,225,218,${env(T, d + 9, 0.5)})` : 'transparent' }}>
          <div style={{ width: 560, fontFamily: SERIF, fontSize: 40, color: INK }}>{r[0]}</div><div style={{ width: 300 }}>{r[1]}</div><div style={{ width: 300 }}>{r[2]}</div><div style={{ width: 300, color: CORAL }}>{r[3]}</div><div style={{ color: SAGE, fontWeight: 600 }}>{r[4]}</div>
        </div>)}
      </div>
      <Big T={T} at={d + 8} top={700} w={1880} s="Rougher surface → bigger μ. Double the mass → double N and double f." size={48} />
      <Big T={T} at={d + 11} top={790} w={1880} s="Double the speed → about the same f." size={48} c={GREY} />
    </Scene>
  );
}
function Space({ T, C }) {
  const s = C.Space, pk = 260 + ((T - s) * 160) % 1500, ast = 1200 + 20 * Math.sin(T * 0.5);
  return (
    <Scene n="Space" T={T} C={C} ph={0.5}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, s + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>{M('STOP 4 · No. μ_k = f/N stays 0.30: f and N doubled together. μ depends on the surface pair, not on mass or speed.')}</div>
      <Kicker T={T} at={s + 3} top={150} s="FRICTION STOPS EVERYDAY THINGS" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, s + 3.4)}><rect x={200} y={330} width={1600} height={20} fill="#eef3fb" stroke={LINE} strokeWidth={2} /><ellipse cx={pk} cy={318} rx={40} ry={12} fill={INK} /><SV x={200} y={400} s="no friction: a puck would slide forever" c={GREY} size={38} /></g>
        <g opacity={env(T, s + 7)}><Rock x={ast} y={660} r={90} spin={T * 8} /><Arr x1={ast - 220} y1={660} x2={ast - 110} y2={660} c={CORAL} w={6} h={16} o={0.5 + 0.5 * Math.sin(T * 2)} /><SV x={ast - 240} y={672} s="tiny push" c={CORAL} size={36} an="end" /></g>
      </svg>
      <Big T={T} at={s + 7} top={500} w={880} s="In space there’s no friction. 2026-XJ never slows down by itself." size={46} />
      <Big T={T} at={s + 11} top={680} w={880} s="So a small push, kept up for a long time, keeps adding up." size={46} c={INDIGO} />
      <Big T={T} at={s + 15} top={860} w={1880} s="Unit 4 preview: a gravity tractor works on exactly this idea." size={42} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={110} s="Space has no friction." size={80} />
      <div style={{ position: 'absolute', left: 60, top: 300, display: 'flex', gap: 40, opacity: env(T, e + 2) }}>
        {[['EASIER', 'because…', SAGE], ['HARDER', 'because…', CORAL]].map(([k, v, c], i) => <div key={i} style={{ width: 880, height: 360, boxSizing: 'border-box', padding: '28px 36px', borderRadius: 12, border: `4px dashed ${c}`, background: '#ffffff' }}>
          <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 600, letterSpacing: '0.1em', color: c }}>{k}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: GREY, marginTop: 16 }}>{v}</div>
        </div>)}
      </div>
      <Big T={T} at={e + 3.4} top={720} s="for deflecting an asteroid?" size={60} c={INDIGO} italic />
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







function shots17(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Hook', 'Types', 'Lab', 'Data', 'Space', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots17(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Hook T={T} C={C} />
        <Types T={T} C={C} />
        <Lab T={T} C={C} />
        <Data T={T} C={C} />
        <Space T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function FrictionDay17App() {
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
window.FrictionDay17App = FrictionDay17App;







