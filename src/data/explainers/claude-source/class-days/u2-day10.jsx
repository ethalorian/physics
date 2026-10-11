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

const ORDER = ['Title', 'Check', 'Recap', 'Stations', 'Answers', 'Flyby', 'Exit', 'Scale', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Check: [1, 'QUICK CHECK', 'Yesterday: a ball leaves a 20 m cliff at 15 m/s. Who can put the fall time and landing distance on the board?'],
  Stations: [2, 'STATIONS · 4–5 MIN EACH', 'Solve your station, then rotate. Every time: vertical first for the time, then horizontal for the distance.'],
  Answers: [3, 'PhET', 'Projectile Motion: keep the height, double the launch speed. What happens to the landing distance? To the time?'],
  Exit: [4, 'EXIT TICKET', 'From a 45 m cliff at 15 m/s horizontal, where does it land?'],
  Scale: [5, 'CHECK-IN', 'Where are you on R2? Rate yourself 0–4.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Check: [0, -1300], Recap: [2200, -1300], Stations: [2200, 0], Answers: [0, 0], Flyby: [-2200, 0], Exit: [-2200, 1300], Scale: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const G10 = 9.81, tf10 = (h) => Math.sqrt(2 * h / G10);
const ST10 = [[5, 5, INDIGO], [20, 10, CORAL], [50, 20, SAGE], [100, 10, '#8a7bb8']];
const C10 = { x0: 260, y0: 900, sx: 22, sy: 6.2 };
const cx10 = (x) => C10.x0 + x * C10.sx, cy10 = (y) => C10.y0 - y * C10.sy;
function Traj({ h, v, col, T, at }) {
  const tf = tf10(h), u = clamp((T - at) / 1.6, 0, 1), n = Math.floor(u * 40);
  const d = Array.from({ length: n + 1 }, (_, k) => { const t = (k / 40) * tf; return (k ? 'L ' : 'M ') + cx10(v * t).toFixed(1) + ' ' + cy10(h - 0.5 * G10 * t * t).toFixed(1); }).join(' ');
  const t = u * tf;
  return <g><line x1={C10.x0} y1={cy10(h)} x2={C10.x0 - 30} y2={cy10(h)} stroke={col} strokeWidth={6} />{n > 0 && <path d={d} fill="none" stroke={col} strokeWidth={5} />}<circle cx={cx10(v * t)} cy={cy10(h - 0.5 * G10 * t * t)} r={12} fill={col} opacity={T > at ? 1 : 0} /></g>;
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 2 · DAY 10 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Where will it land?</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, lineHeight: 1.1, color: INDIGO }}>vary the height and the speed</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, color: INDIGO }}>R2 · Predict projectile landing from the launch conditions.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Check({ T, C }) {
  const c = C.Check;
  return (
    <Scene n="Check" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={c + 0.3} top={44} s="QUICK CHECK · FROM DAY 9" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 0.6)}><rect x={60} y={cy10(20)} width={200} height={C10.y0 - cy10(20)} fill="#ececf0" stroke={INK} strokeWidth={4} /><line x1={40} y1={C10.y0} x2={1960} y2={C10.y0} stroke={INK} strokeWidth={5} /></g>
        <Traj h={20} v={15} col={CORAL} T={T} at={c + 1.4} />
        <SV x={150} y={cy10(20) - 20} s="20 m" c={GREY} size={38} an="middle" o={env(T, c + 0.6)} />
        <SV x={330} y={cy10(20) - 20} s="15 m/s →" c={CORAL} size={38} o={env(T, c + 1)} />
      </svg>
      <Big T={T} at={c + 3.6} top={200} left={900} w={1000} s="Fall time? Landing distance?" size={60} c={INDIGO} italic />
    </Scene>
  );
}
function Recap({ T, C }) {
  const r = C.Recap;
  const eq = [['v_y = −g t', 'vertical speed', CORAL], ['y = y₀ − ½ g t²', 'height', CORAL], ['x = v_x t', 'horizontal distance', INDIGO]];
  return (
    <Scene n="Recap" T={T} C={C} ph={0.6}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, r + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, color: SAGE }}>{M('STOP 1 · t = √(2 × 20 ÷ 9.81) ≈ 2.02 s · x = (15)(2.02) ≈ 30 m')}</div>
      <Kicker T={T} at={r + 2.4} top={130} s="THREE EQUATIONS · KEEP THEM ON THE BOARD" />
      <div style={{ position: 'absolute', left: 60, top: 190, display: 'flex', gap: 30 }}>
        {eq.map(([e, l, c], i) => <div key={i} style={{ width: 600, opacity: env(T, r + 2.8 + i * 1.2), padding: '24px 30px', borderRadius: 12, border: `4px solid ${c}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 70, color: INK }}>{M(e)}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY, marginTop: 8 }}>{l}</div></div>)}
      </div>
      <Kicker T={T} at={r + 7} top={500} s="THE ORDER" />
      <div style={{ position: 'absolute', left: 60, top: 550, display: 'flex', alignItems: 'center', gap: 30, opacity: env(T, r + 7.4) }}>
        {[['1 · vertical', 'height → time', CORAL], ['2 · horizontal', 'same time → distance', INDIGO]].map(([k, v, c], i) => <React.Fragment key={i}>{i > 0 && <div style={{ fontFamily: SERIF, fontSize: 70, color: GREY }}>→</div>}<div style={{ padding: '20px 30px', borderRadius: 12, background: i ? '#eeeefa' : CORAL_T, border: `3px solid ${c}` }}><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: c }}>{k}</div><div style={{ fontFamily: SERIF, fontSize: 48, color: INK }}>{v}</div></div></React.Fragment>)}
      </div>
      <Big T={T} at={r + 10} top={800} w={1880} s="One shared time for both directions." size={52} c={SAGE} italic />
    </Scene>
  );
}
function Stations({ T, C }) {
  const s = C.Stations, act = Math.floor(((T - s) / 3) % 4), tick = ((T - s) % 3) / 3;
  return (
    <Scene n="Stations" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={s + 0.3} top={44} s="GROUP ROTATION · 4 STATIONS" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 24 }}>
        {ST10.map(([h, v, c], i) => <div key={i} style={{ opacity: env(T, s + 0.8 + i * 0.5), height: 520, boxSizing: 'border-box', borderRadius: 12, border: `${i === act ? 5 : 3}px solid ${c}`, background: i === act ? '#fbfbfe' : '#ffffff', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, transform: `translateY(${i === act ? -8 : 0}px)` }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: c, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 32, fontWeight: 600 }}>{i + 1}</div>
          <div style={{ fontFamily: SERIF, fontSize: 48, color: INK }}>{`${h} m cliff`}</div>
          <div style={{ fontFamily: SERIF, fontSize: 48, color: INK }}>{`${v} m/s sideways`}</div>
          <div style={{ marginTop: 'auto', fontFamily: MONO, fontSize: 26, lineHeight: 1.3, color: GREY, whiteSpace: 'normal' }}>time? landing distance?</div>
        </div>)}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, s + 3)}><circle cx={1000} cy={790} r={56} fill="#ffffff" stroke={INK} strokeWidth={5} /><line x1={1000} y1={790} x2={1000 + 42 * Math.sin(tick * 2 * Math.PI)} y2={790 - 42 * Math.cos(tick * 2 * Math.PI)} stroke={CORAL} strokeWidth={6} strokeLinecap="round" /><text x={1000} y={884} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY}>4–5 min</text></g>
      </svg>
    </Scene>
  );
}
function Answers({ T, C }) {
  const a = C.Answers;
  return (
    <Scene n="Answers" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={a + 0.3} top={44} s="STATION ANSWERS · DRAWN TOGETHER" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, a + 0.4)}>
          <line x1={C10.x0} y1={C10.y0} x2={1900} y2={C10.y0} stroke={INK} strokeWidth={4} />
          <line x1={C10.x0} y1={C10.y0} x2={C10.x0} y2={cy10(105)} stroke={INK} strokeWidth={4} />
          {[0, 20, 40, 60].map((x) => <text key={x} x={cx10(x)} y={C10.y0 + 40} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={GREY}>{x}</text>)}
          {[25, 50, 75, 100].map((y) => <text key={y} x={C10.x0 - 40} y={cy10(y) + 9} textAnchor="end" fontFamily={MONO} fontSize={26} fill={GREY}>{y}</text>)}
          <text x={cx10(70)} y={C10.y0 + 84} textAnchor="end" fontFamily={SANS} fontSize={28} fontWeight={500} fill={INK}>x (m)</text>
          <text x={C10.x0 - 40} y={cy10(105) - 10} fontFamily={SANS} fontSize={28} fontWeight={500} fill={INK}>height (m)</text>
        </g>
        {ST10.map(([h, v, c], i) => <Traj key={i} h={h} v={v} col={c} T={T} at={a + 1 + i * 0.9} />)}
      </svg>
      <div style={{ position: 'absolute', left: 1240, top: 110, width: 700, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ST10.map(([h, v, c], i) => { const t = tf10(h); return <div key={i} style={{ opacity: env(T, a + 2.6 + i * 0.9), display: 'flex', gap: 16, alignItems: 'baseline', fontFamily: MONO, fontSize: 30, color: INK }}><span style={{ color: c, fontWeight: 600 }}>{i + 1}</span><span>{`${h} m, ${v} m/s:`}</span><span style={{ color: c, fontWeight: 600 }}>{`${t.toFixed(2)} s · ${(v * t).toFixed(1)} m`}</span></div>; })}
      </div>
      <Big T={T} at={a + 7} top={360} left={1240} w={700} s="Time depends only on height." size={44} c={CORAL} />
      <Big T={T} at={a + 8.4} top={440} left={1240} w={700} s="Distance = speed × that time." size={44} c={INDIGO} />
      <Big T={T} at={a + 10} top={540} left={1240} w={700} s="Station 4 is twice as high as 3 but lands closer: it’s slower." size={38} italic c={GREY} />
    </Scene>
  );
}
function Flyby({ T, C }) {
  const f = C.Flyby, E = [700, 620], R = 230;
  const paths = [[0.55, CORAL, 'too slow: it strikes', 1.6], [1.0, SAGE, 'just right: it keeps falling around', 4], [1.5, INDIGO, 'fast: it falls a bit and flies past', 6.4]];
  const H = R + 110, S0 = [E[0], E[1] - H];
  const traj = (k) => {
    const N = 90;
    if (k < 0.8) return Array.from({ length: N + 1 }, (_, i) => { const q = i / N, a = -Math.PI / 2 + 75 * D2R * q, rr = H - (H - R) * q * q; return [E[0] + rr * Math.cos(a), E[1] + rr * Math.sin(a)]; });
    if (k < 1.2) return Array.from({ length: N + 1 }, (_, i) => { const a = -Math.PI / 2 + 2 * Math.PI * (i / N); return [E[0] + H * Math.cos(a), E[1] + H * Math.sin(a)]; });
    const P1 = [1100, 300], P2 = [1320, 560];
    return Array.from({ length: N + 1 }, (_, i) => { const q = i / N, m = 1 - q; return [m * m * S0[0] + 2 * m * q * P1[0] + q * q * P2[0], m * m * S0[1] + 2 * m * q * P1[1] + q * q * P2[1]]; });
  };
  return (
    <Scene n="Flyby" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={f + 0.3} top={44} s="BACK TO 2026-XJ · A PREVIEW OF ORBITS" />
      <Big T={T} at={f + 0.6} top={92} w={1880} s="2026-XJ passes Earth moving sideways, fast. Does it strike?" size={50} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={R} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, f + 1)} />
        <SV x={E[0]} y={E[1] + 14} s="Earth" c={INK} size={40} an="middle" o={env(T, f + 1)} />
        {paths.map(([k, c, l, at], i) => { const pts = traj(k), u = clamp((T - (f + at)) / 2.2, 0, 1), n = Math.max(1, Math.floor(u * pts.length)), sub = pts.slice(0, n); return <g key={i} opacity={env(T, f + at)}><path d={'M ' + sub.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L ')} fill="none" stroke={c} strokeWidth={4} strokeDasharray="12 8" /><circle cx={sub[sub.length - 1][0]} cy={sub[sub.length - 1][1]} r={12} fill={c} /></g>; })}
      </svg>
      <div style={{ position: 'absolute', left: 1360, top: 300, width: 580, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {paths.map(([k, c, l, at], i) => <div key={i} style={{ opacity: env(T, f + at + 1.4), fontFamily: SERIF, fontSize: 40, color: c, whiteSpace: 'normal' }}>{l}</div>)}
      </div>
      <Big T={T} at={f + 10} top={600} left={1360} w={580} s="It depends on the balance between sideways speed and how far it falls. Orbits are coming." size={38} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={110} s="45 m cliff · 15 m/s sideways" size={76} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, e + 1.4)}><rect x={60} y={cy10(45)} width={200} height={C10.y0 - cy10(45)} fill="#ececf0" stroke={INK} strokeWidth={4} /><line x1={40} y1={C10.y0} x2={1960} y2={C10.y0} stroke={INK} strokeWidth={5} /><circle cx={C10.x0} cy={cy10(45)} r={14} fill={CORAL} /><Arr x1={C10.x0 + 20} y1={cy10(45)} x2={C10.x0 + 160} y2={cy10(45)} c={CORAL} w={8} h={20} /></g>
        <SV x={150} y={cy10(45) - 20} s="45 m" c={GREY} size={38} an="middle" o={env(T, e + 1.4)} />
        <SV x={1300} y={C10.y0 - 30} s="lands where?" c={INDIGO} size={52} an="middle" o={env(T, e + 2.4)} />
      </svg>
    </Scene>
  );
}
function Scale({ T, C }) {
  const s = C.Scale;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Scale" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>R2</div><div style={{ fontFamily: SERIF, fontSize: 44, color: INK, marginTop: 6 }}>Predict projectile landing from the launch conditions.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 380, display: 'flex', gap: 24 }}>
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


















function shotsU2D10(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Check', 'Recap', 'Stations', 'Answers', 'Flyby', 'Exit', 'Scale'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU2D10(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Check T={T} C={C} />
        <Recap T={T} C={C} />
        <Stations T={T} C={C} />
        <Answers T={T} C={C} />
        <Flyby T={T} C={C} />
        <Exit T={T} C={C} />
        <Scale T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U2Day10App() {
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
window.U2Day10App = U2Day10App;


















