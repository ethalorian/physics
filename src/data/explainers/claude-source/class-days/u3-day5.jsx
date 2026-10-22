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

const ORDER = ['Title', 'Recap', 'Flip', 'Spring', 'Skater', 'Practice', 'Exit', 'Marz', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Flip: [1, 'PREDICT', 'Two carts sit at rest with a squeezed spring between them: 1 kg and 3 kg. Release. Which moves faster, and by how much?'],
  Spring: [2, 'YOUR TURN', 'A 70 kg skater at rest throws a 5 kg ball at 8 m/s east. Which way does the skater move, and how fast? Define your system first.'],
  Practice: [3, 'GROUP PRACTICE', 'Four recoil and explosion problems, including the rocket. For each: system · external force? · Σp before = Σp after.'],
  Exit: [4, 'EXIT TICKET', 'A 0.5 kg firework at rest explodes: 0.3 kg goes east at 12 m/s. The 0.2 kg piece goes which way, and how fast?'],
  Marz: [5, 'CHECK-IN', 'Where are you on K3? Rate yourself 0–4.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Flip: [2200, -1300], Spring: [2200, 0], Skater: [0, 0], Practice: [-2200, 0], Exit: [-2200, 1300], Marz: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr2 = ({ x1, y1, x2, y2, c, w = 9, o = 1, h = 22 }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} /> : null;
function Block({ x, y, w, h, c, lab, o = 1 }) {
  return (
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h - 22} width={w} height={h} rx={10} fill={c} stroke={INK} strokeWidth={3.5} />
      <circle cx={x - w / 2 + 26} cy={y - 14} r={13} fill="#ffffff" stroke={INK} strokeWidth={3} />
      <circle cx={x + w / 2 - 26} cy={y - 14} r={13} fill="#ffffff" stroke={INK} strokeWidth={3} />
      <text x={x} y={y - h / 2 - 12} textAnchor="middle" fontFamily={MONO} fontSize={28} fontWeight={600} fill={INK}>{lab}</text>
    </g>
  );
}
function Spring2({ x1, x2, y, o = 1 }) {
  const n = 10, d = Array.from({ length: n * 2 + 1 }, (_, k) => `${k ? 'L' : 'M'} ${(x1 + ((x2 - x1) * k) / (n * 2)).toFixed(1)} ${(y + (k % 2 ? -18 : 18) * (k && k < n * 2 ? 1 : 0)).toFixed(1)}`).join(' ');
  return <path d={d} fill="none" stroke={GREY} strokeWidth={4} strokeLinejoin="round" opacity={o} />;
}
function SystemBox({ x, y, w, h, o, lab = 'system' }) {
  return o > 0 ? <g opacity={o}><rect x={x} y={y} width={w} height={h} rx={18} fill="none" stroke={SAGE} strokeWidth={4} strokeDasharray="16 10" /><text x={x + 20} y={y + 40} fontFamily={MONO} fontSize={26} fontWeight={600} fill={SAGE}>{lab}</text></g> : null;
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 3 · DAY 5 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontStyle: 'italic', fontSize: 140, lineHeight: 1.0, color: INK }}>{M('Σp before = Σp after')}</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 290, fontFamily: SERIF, fontSize: 68, lineHeight: 1.15, color: INDIGO }}>no external force → momentum is conserved</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 450, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>K3 · Conservation of momentum and its condition.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · DAYS 3–4" />
      <Big T={T} at={r + 0.8} top={150} s="J = FΔt = Δp" size={110} italic c={INDIGO} />
      <Big T={T} at={r + 2.6} top={340} s="What gives an object a Δp?" size={60} />
      <Big T={T} at={r + 4.6} top={450} s="An external force, acting over a time." size={60} c={SAGE} />
      <Big T={T} at={r + 6.6} top={640} w={1880} s="So what if there’s NO external force on the system?" size={56} c={CORAL} italic />
    </Scene>
  );
}
function Flip({ T, C }) {
  const f = C.Flip, y = 640;
  return (
    <Scene n="Flip" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={f + 0.3} top={44} s="THE FLIP · A SYSTEM WITH NO NET EXTERNAL FORCE" />
      <Big T={T} at={f + 0.8} top={110} w={1880} s="The total momentum of the system doesn’t change." size={56} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={160} y1={y} x2={1840} y2={y} stroke={INK} strokeWidth={4} opacity={env(T, f + 2)} />
        <SystemBox x={660} y={y - 260} w={680} h={300} o={env(T, f + 4)} />
        <Block x={810} y={y} w={180} h={90} c={CORAL_T} lab="1 kg" o={env(T, f + 2.4)} />
        <Spring2 x1={900} x2={1030} y={y - 66} o={env(T, f + 2.4)} />
        <Block x={1150} y={y} w={240} h={130} c="#d7d8ea" lab="3 kg" o={env(T, f + 2.4)} />
        <path d="M 905 548 L 1025 548" stroke={INK} strokeWidth={3} strokeDasharray="4 6" opacity={env(T, f + 2.4)} />
        <SV x={965} y={530} s="string" c={GREY} size={30} an="middle" o={env(T, f + 2.4)} />
      </svg>
      <Big T={T} at={f + 4.6} top={780} w={1880} s="Before release: both at rest, so Σp = 0." size={50} c={SAGE} />
      <Big T={T} at={f + 6.2} top={860} w={1880} s="Cut the string…" size={46} italic c={GREY} />
    </Scene>
  );
}
function Spring({ T, C }) {
  const s = C.Spring, y = 640, rel = s + 1.2, td = Math.max(0, T - rel), v1 = 3, v2 = 1, PX = 80;
  const x1 = 980 - v1 * PX * Math.min(td, 2.2), x2 = 1320 + v2 * PX * Math.min(td, 2.2);
  return (
    <Scene n="Spring" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={s + 0.3} top={44} s="ANSWER · THE LIGHTER CART MOVES FASTER" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={160} y1={y} x2={1840} y2={y} stroke={INK} strokeWidth={4} />
        <Block x={x1} y={y} w={180} h={90} c={CORAL_T} lab="1 kg" />
        {td < 0.15 && <Spring2 x1={x1 + 90} x2={x2 - 120} y={y - 66} />}
        <Block x={x2} y={y} w={240} h={130} c="#d7d8ea" lab="3 kg" />
        <Arr2 x1={x1 - 20} y1={y - 150} x2={x1 - 20 - 3 * 60} y2={y - 150} c={CORAL} o={env(T, rel + 0.4)} />
        <SV x={x1 - 110} y={y - 180} s="3 m/s west" c={CORAL} size={38} an="middle" o={env(T, rel + 0.4)} />
        <Arr2 x1={x2 + 20} y1={y - 190} x2={x2 + 20 + 1 * 60} y2={y - 190} c={INDIGO} o={env(T, rel + 0.4)} />
        <SV x={x2 + 50} y={y - 220} s="1 m/s east" c={INDIGO} size={38} an="middle" o={env(T, rel + 0.4)} />
      </svg>
      <Big T={T} at={s + 4.4} top={140} w={1880} s="East = +.   Σp after = (1)(−3) + (3)(+1) = −3 + 3 = 0" size={50} italic c={INDIGO} />
      <Big T={T} at={s + 6.6} top={240} w={1880} s="Still zero. Equal and opposite momenta: ⅓ the mass, 3× the speed." size={46} c={SAGE} />
      <Big T={T} at={s + 9} top={800} w={1880} s="The spring’s pushes are internal: they cancel in the total." size={42} italic c={GREY} />
    </Scene>
  );
}
function Person({ x, y, s = 1, o = 1, arm = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={0} cy={-210} r={28} fill="#ffffff" />
      <path d={`M 0 -182 L 0 -90 M 0 -90 L -26 0 M 0 -90 L 26 0 M 0 -160 L -40 -110 M 0 -160 L ${40 + 30 * arm} ${-120 - 20 * arm}`} />
      <path d="M -50 4 L 50 4" stroke={GREY} strokeWidth={5} />
    </g>
  );
}
function Skater({ T, C }) {
  const k = C.Skater, y = 760, th = k + 2.4, td = Math.max(0, T - th);
  const sx = 900 - 0.571 * 90 * Math.min(td, 4), bx = T < th ? 960 : 960 + 8 * 90 * Math.min(td, 1.2), arm = T < th ? eo((T - (th - 1)) / 1) : 1;
  return (
    <Scene n="Skater" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={k + 0.3} top={44} s="STOP 2 ANSWER · EAST = +" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <rect x={0} y={y + 4} width={CW} height={40} fill="#eef3f8" opacity={env(T, k + 0.6)} />
        <SystemBox x={420} y={y - 330} w={1480} h={360} o={env(T, k + 1)} lab="system: skater + ball" />
        <Person x={sx} y={y} o={env(T, k + 0.6)} arm={arm} />
        <circle cx={Math.min(bx, 1820)} cy={y - 230} r={18} fill={CORAL} stroke={INK} strokeWidth={3} opacity={env(T, k + 0.6)} />
        <Arr2 x1={1260} y1={y - 290} x2={1500} y2={y - 290} c={CORAL} o={env(T, th + 0.4)} />
        <SV x={1380} y={y - 350} s="ball: 5 kg, +8 m/s" c={CORAL} size={36} an="middle" o={env(T, th + 0.4)} />
        <Arr2 x1={760} y1={y + 90} x2={620} y2={y + 90} c={INDIGO} o={env(T, th + 1.4)} />
        <SV x={690} y={y + 150} s="skater: 70 kg, v = ?" c={INDIGO} size={36} an="middle" o={env(T, th + 1.4)} />
      </svg>
      <Big T={T} at={k + 4.6} top={110} w={1880} s="0 = (5)(+8) + (70)v" size={56} italic c={INDIGO} />
      <Big T={T} at={k + 6.4} top={200} w={1880} s="v = −40 / 70 ≈ −0.57 m/s: 0.57 m/s west" size={56} italic c={SAGE} />
      <Big T={T} at={k + 8.6} top={290} w={1880} s="Ice: friction is tiny, so the external impulse is negligible." size={40} c={GREY} italic />
    </Scene>
  );
}
function Practice({ T, C }) {
  const p = C.Practice, y = 700, t = Math.max(0, T - (p + 3)), R = [1000, 700];
  const rx = R[0] + Math.min(15 * t * t, 400), gas = Math.min(t, 6);
  return (
    <Scene n="Practice" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={p + 0.3} top={44} s="THE ROCKET · TREATED AS BEFORE AND AFTER" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, p + 1)}>
          <path d={`M ${rx - 120} ${y - 40} L ${rx + 80} ${y - 40} L ${rx + 160} ${y} L ${rx + 80} ${y + 40} L ${rx - 120} ${y + 40} Z`} fill="#ffffff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {Array.from({ length: 14 }, (_, k) => { const age = (t * 4 + k / 14) % 1; return <circle key={k} cx={rx - 130 - age * 340} cy={y + (k % 3 - 1) * 14 * age} r={10 * (1 - age) + 4} fill={CORAL} opacity={0.6 * (1 - age)} />; })}
        </g>
        <Arr2 x1={rx + 180} y1={y} x2={rx + 300} y2={y} c={INDIGO} o={env(T, p + 4)} />
        <Arr2 x1={rx - 300} y1={y + 100} x2={rx - 460} y2={y + 100} c={CORAL} o={env(T, p + 4)} />
        <SV x={rx - 380} y={y + 160} s="gas: momentum backward" c={CORAL} size={36} an="middle" o={env(T, p + 4)} />
      </svg>
      <Big T={T} at={p + 1.4} top={130} w={1880} s="System: rocket + exhaust gas. In space, no external force." size={48} />
      <Big T={T} at={p + 4.6} top={230} w={1880} s="Gas thrown backward → rocket gains forward momentum." size={48} c={INDIGO} />
      <Big T={T} at={p + 7} top={330} w={1880} s="Σp stays the same; it just gets shared out differently." size={44} c={SAGE} italic />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, y = 560, O = [1000, y], boom = e + 2, td = Math.max(0, T - boom), fl = T > boom && T < boom + 0.6 ? 1 - (T - boom) / 0.6 : 0;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET · EAST = +" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {T < boom && <circle cx={O[0]} cy={O[1]} r={36} fill={CORAL_T} stroke={INK} strokeWidth={3.5} opacity={env(T, e + 0.6)} />}
        {fl > 0 && <circle cx={O[0]} cy={O[1]} r={30 + 120 * (1 - fl)} fill={CORAL} opacity={0.5 * fl} />}
        {T >= boom && <g>
          <circle cx={O[0] + 12 * 40 * Math.min(td, 1.4)} cy={O[1]} r={28} fill={INDIGO} stroke={INK} strokeWidth={3} />
          <circle cx={O[0]} cy={O[1]} r={22} fill="#ffffff" stroke={CORAL} strokeWidth={3} strokeDasharray="5 5" />
          <Arr2 x1={O[0] + 120} y1={O[1] - 110} x2={O[0] + 360} y2={O[1] - 110} c={INDIGO} o={env(T, boom + 0.4)} />
          <SV x={O[0] + 240} y={O[1] - 140} s="0.3 kg · 12 m/s east" c={INDIGO} size={38} an="middle" o={env(T, boom + 0.4)} />
          <SV x={O[0] - 240} y={O[1] - 110} s="0.2 kg · ? which way · how fast" c={CORAL} size={38} an="middle" o={env(T, boom + 0.8)} />
        </g>}
      </svg>
      <Big T={T} at={e + 0.8} top={140} w={1880} s="0.5 kg firework, at rest." size={52} />
      <Big T={T} at={boom + 1.4} top={820} w={1880} s="Before: Σp = ?   After: Σp = ?" size={50} italic c={INDIGO} />
    </Scene>
  );
}
function Marz({ T, C }) {
  const s = C.Marz;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Marz" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>K3</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK, marginTop: 6 }}>Conservation of momentum, and its condition: no net external force.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
      <Big T={T} at={s + 3.4} top={700} w={1880} s="DART worked the same way: the spacecraft lost momentum, the asteroid gained it." size={46} c={INDIGO} italic />
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




























function shotsU3D5(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Flip', 'Spring', 'Skater', 'Practice', 'Exit', 'Marz'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU3D5(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Recap T={T} C={C} />
        <Flip T={T} C={C} />
        <Spring T={T} C={C} />
        <Skater T={T} C={C} />
        <Practice T={T} C={C} />
        <Exit T={T} C={C} />
        <Marz T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U3Day5App() {
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
window.U3Day5App = U3Day5App;




























