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

const ORDER = ['Title', 'Hook', 'Trade', 'Cases', 'Sprinter', 'Asteroid', 'Exit', 'Marz', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Hook: [1, 'PREDICT', 'Same egg, same drop height, same Δp. Why does one break and the other survive?'],
  Trade: [2, 'CASE STUDY', 'Pick one: airbag, helmet, boxing glove, gym mat, crumple zone, parkour roll. Explain it with same Δp → longer Δt → smaller F.'],
  Cases: [3, 'YOUR TURN', 'An 80 kg sprinter at 9 m/s stops in 0.05 s on concrete, or 0.5 s in a foam pit. Find the average force for each.'],
  Asteroid: [4, 'DISCUSS', 'To deflect 2026-XJ we need a big Δp. Short and hard, or long and gentle? What does each one need?'],
  Exit: [5, 'EXIT TICKET', 'A boxer “rolls with the punch.” Why does it hurt LESS for the same Δp?'],
  Marz: [6, 'CHECK-IN', 'Where are you on R1? Rate yourself 0–4.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Hook: [0, -1300], Trade: [2200, -1300], Cases: [2200, 0], Sprinter: [0, 0], Asteroid: [-2200, 0], Exit: [-2200, 1300], Marz: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr2 = ({ x1, y1, x2, y2, c, w = 9, o = 1, h = 22 }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} /> : null;
const pulseD = (x0, y0, w, h, n = 40) => Array.from({ length: n + 1 }, (_, k) => { const u = k / n; return (k ? 'L ' : 'M ') + (x0 + u * w).toFixed(1) + ' ' + (y0 - h * Math.sin(Math.PI * u) ** 2).toFixed(1); }).join(' ');
function Egg({ x, y, broken = 0, squash = 0 }) {
  if (broken > 0) return (
    <g>
      <ellipse cx={x} cy={y - 6} rx={70 * broken + 20} ry={10} fill="#f3d36b" opacity={0.85} />
      <path d={`M ${x - 40} ${y - 4} l 14 -30 l 10 22 l 12 -26 l 6 34 Z`} fill="#ffffff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M ${x + 14} ${y - 4} l 10 -24 l 14 18 l 8 -20 l 4 26 Z`} fill="#ffffff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
  return <ellipse cx={x} cy={y - 40 + squash * 6} rx={30 + squash * 5} ry={40 - squash * 6} fill="#ffffff" stroke={INK} strokeWidth={3.5} />;
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 3 · DAY 4 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 140, lineHeight: 1.0, color: INK }}>Same Δp, different ride</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 66, lineHeight: 1.15, color: INDIGO, whiteSpace: 'normal', width: 1600 }}>big force, short time · or small force, long time</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 450, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>R1 · Reason about how changing Δt (or F) achieves a given Δp.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Hook({ T, C }) {
  const h = C.Hook, fall = (t0) => { const u = clamp((T - t0) / 1.1, 0, 1); return u * u; };
  const G = 760, L = 500, R = 1500, uL = fall(h + 1.4), uR = fall(h + 4.4);
  const yL = lerp(220, G, uL), yR = lerp(220, G - 40, uR);
  const brk = T > h + 2.5 ? eo((T - (h + 2.5)) / 0.4) : 0, sq = T > h + 5.5 ? 0.6 * Math.exp(-(T - (h + 5.5)) * 3) * Math.abs(Math.sin((T - (h + 5.5)) * 8)) : 0;
  const pil = T > h + 5.5 ? 26 * Math.exp(-(T - (h + 5.5)) * 2.5) : 0;
  return (
    <Scene n="Hook" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={h + 0.3} top={44} s="HOOK · SHOW THE VIDEO, DON’T DROP THE EGG" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <rect x={L - 220} y={G} width={440} height={60} fill="#c6c7dc" stroke={INK} strokeWidth={3} opacity={env(T, h + 0.8)} />
        <SV x={L} y={G + 120} s="concrete" c={INK} size={42} an="middle" o={env(T, h + 0.8)} />
        <path d={`M ${R - 220} ${G} Q ${R - 220} ${G - 50} ${R - 160} ${G - 54} L ${R + 160} ${G - 54} Q ${R + 220} ${G - 50} ${R + 220} ${G} Z`} fill={SAGE_T} stroke={INK} strokeWidth={3} opacity={env(T, h + 0.8)} transform={`translate(0 ${pil * 0.3})`} />
        <SV x={R} y={G + 120} s="pillow" c={INK} size={42} an="middle" o={env(T, h + 0.8)} />
        <g opacity={env(T, h + 0.8)}><Egg x={L} y={uL < 1 ? yL : G} broken={uL >= 1 ? brk : 0} /></g>
        <g opacity={env(T, h + 0.8)}><Egg x={R} y={uR < 1 ? yR : G - 54 + pil * 0.3} squash={sq} /></g>
        <SV x={L} y={300} s="breaks" c={CORAL} size={52} an="middle" o={env(T, h + 3)} />
        <SV x={R} y={300} s="survives" c={SAGE} size={52} an="middle" o={env(T, h + 6.2)} />
      </svg>
      <Big T={T} at={h + 7.4} top={880} w={1880} s="Same egg, same height, same speed at impact, so the same Δp to stop it." size={44} c={INDIGO} italic />
    </Scene>
  );
}
function Trade({ T, C }) {
  const t = C.Trade, X0 = 160, Y0 = 860, two = env(T, t + 6, 0.6);
  return (
    <Scene n="Trade" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={t + 0.3} top={44} s="ANSWER · THE PILLOW STRETCHES OUT THE STOPPING TIME" c={SAGE} />
      <Big T={T} at={t + 1} top={110} s="J = FΔt = Δp" size={84} italic c={INDIGO} />
      <Big T={T} at={t + 2.6} top={220} s="For a fixed Δp, FΔt is fixed: longer Δt → smaller F." size={50} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, t + 3.6)}>
          <line x1={X0} y1={Y0} x2={1100} y2={Y0} stroke={INK} strokeWidth={4} />
          <line x1={X0} y1={Y0} x2={X0} y2={330} stroke={INK} strokeWidth={4} />
          <text x={1100} y={Y0 + 46} textAnchor="end" fontFamily={SANS} fontSize={28} fontWeight={500} fill={INK}>time</text>
          <text x={X0 + 14} y={352} fontFamily={SANS} fontSize={28} fontWeight={500} fill={INK}>force on the egg</text>
          <path d={pulseD(X0 + 40, Y0, 100, 460) + ` L ${X0 + 140} ${Y0} Z`} fill={CORAL} opacity={0.3} stroke={CORAL} strokeWidth={4} />
          <SV x={X0 + 160} y={Y0 - 430} s="concrete: tiny Δt, huge F" c={CORAL} size={36} />
        </g>
        <g opacity={two}>
          <path d={pulseD(X0 + 220, Y0, 700, 66) + ` L ${X0 + 920} ${Y0} Z`} fill={SAGE} opacity={0.3} stroke={SAGE} strokeWidth={4} />
          <SV x={X0 + 570} y={Y0 - 100} s="pillow: long Δt, small F" c={SAGE} size={36} an="middle" />
        </g>
      </svg>
      <Big T={T} at={t + 7.4} top={380} left={1200} w={740} s="Same area under each curve: the same impulse." size={44} c={SAGE} />
      <Big T={T} at={t + 9.6} top={520} left={1200} w={740} s="Airbags · crumple zones · follow-through · padded gym floors" size={42} />
      <Big T={T} at={t + 12} top={700} left={1200} w={740} s="Longer Δt doesn’t shrink the impulse. It spreads it out." size={40} italic c={GREY} />
    </Scene>
  );
}
function Cases({ T, C }) {
  const c = C.Cases;
  const cs = [['airbag', 'head stops over ~0.05 s, not ~0.005 s'], ['helmet', 'foam crushes, so the skull stops more slowly'], ['boxing glove', 'padding lengthens each punch’s contact'], ['gym mat', 'sinks under you as you land'], ['crumple zone', 'the car’s front folds over a longer time'], ['parkour roll', 'turns a sudden stop into a gradual one']];
  return (
    <Scene n="Cases" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={c + 0.3} top={44} s="SAME LOGIC, EVERYWHERE" />
      <div style={{ position: 'absolute', left: 60, top: 120, display: 'grid', gridTemplateColumns: 'repeat(3, 600px)', gap: 30 }}>
        {cs.map(([a, b], i) => <div key={i} style={{ opacity: env(T, c + 0.8 + i * 0.6), padding: '22px 28px', borderRadius: 12, border: `3px solid ${[INDIGO, CORAL, SAGE][i % 3]}`, background: '#ffffff', boxSizing: 'border-box', whiteSpace: 'normal', height: 300 }}>
          <div style={{ fontFamily: SERIF, fontSize: 52, color: INK }}>{a}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: GREY, marginTop: 14 }}>{b}</div>
        </div>)}
      </div>
      <Big T={T} at={c + 5.4} top={820} w={1880} s="Each one: the same Δp to stop, a longer Δt, so a smaller average F." size={46} c={SAGE} />
    </Scene>
  );
}
function Sprinter({ T, C }) {
  const s = C.Sprinter, X0 = 160, Y0 = 880, PX = 1500, FS = 0.026;
  const bar = (y, F, c, at, lab) => { const w = (F / 14400) * PX * eo((T - at) / 1.0); return (
    <g opacity={env(T, at)}>
      <rect x={X0} y={y} width={Math.max(w, 6)} height={70} rx={8} fill={c} opacity={0.85} />
      <text x={X0 + Math.max(w, 6) + 20} y={y + 50} fontFamily={MONO} fontSize={38} fontWeight={600} fill={INK}>{lab}</text>
    </g>
  ); };
  return (
    <Scene n="Sprinter" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={s + 0.3} top={44} s="STOP 3 ANSWER · 80 kg SPRINTER AT 9 m/s · FORWARD = +" c={SAGE} />
      <Big T={T} at={s + 1} top={110} s="Δp = 0 − (80)(9) = −720 kg·m/s, either way" size={52} italic c={INDIGO} />
      <Big T={T} at={s + 3} top={250} s="concrete: F = −720 ÷ 0.05 = −14,400 N" size={50} italic c={CORAL} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {bar(340, 14400, CORAL, s + 3.6, '14,400 N')}
        {bar(620, 1440, SAGE, s + 7.6, '1,440 N')}
      </svg>
      <Big T={T} at={s + 7} top={530} s="foam pit: F = −720 ÷ 0.5 = −1,440 N" size={50} italic c={SAGE} />
      <Big T={T} at={s + 10} top={760} w={1880} s="10× the stopping time → 1/10 the average force. (14,400 N is about 18 times body weight.)" size={44} />
    </Scene>
  );
}
function Asteroid({ T, C }) {
  const a = C.Asteroid, R = [1500, 560];
  const imp = (((T - a) % 4) + 4) % 4, u = clamp(imp / 1.2, 0, 1), sx = lerp(900, R[0] - 150, u), fl = imp > 1.2 && imp < 2 ? 1 - (imp - 1.2) / 0.8 : 0;
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={a + 0.3} top={44} s="BACK TO 2026-XJ · WE WANT A BIG Δp" />
      <div style={{ position: 'absolute', left: 60, top: 130, width: 880, opacity: env(T, a + 0.8), padding: '24px 30px', borderRadius: 12, border: `4px solid ${CORAL}`, background: '#ffffff', boxSizing: 'border-box', whiteSpace: 'normal' }}>
        <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: CORAL }}>SHORT AND HARD</div>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: INK, marginTop: 8 }}>A kinetic impactor (DART, 2022)</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: GREY, marginTop: 8 }}>huge force for a fraction of a second</div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 470, width: 880, opacity: env(T, a + 2.6), padding: '24px 30px', borderRadius: 12, border: `4px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box', whiteSpace: 'normal' }}>
        <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: INDIGO }}>LONG AND GENTLE</div>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: INK, marginTop: 8 }}>A gravity tractor or an ion-engine push</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: GREY, marginTop: 8 }}>tiny force for months or years</div>
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Rock x={R[0]} y={R[1]} r={140} spin={T * 4} o={env(T, a + 0.8)} />
        {imp < 1.2 && <g opacity={env(T, a + 1.2)}><rect x={sx - 18} y={R[1] - 210} width={36} height={20} rx={3} fill="#ffffff" stroke={INK} strokeWidth={3} /></g>}
        {fl > 0 && <circle cx={R[0] - 120} cy={R[1] - 110} r={18 + 50 * (1 - fl)} fill={CORAL} opacity={0.6 * fl} />}
        <g opacity={env(T, a + 2.6)}>
          <rect x={R[0] + 230 + 6 * Math.sin(T * 0.8)} y={R[1] - 14} width={40} height={28} rx={4} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <path d={`M ${R[0] + 270} ${R[1]} l 60 -16 m -60 16 l 60 16`} stroke={INDIGO} strokeWidth={3} opacity={0.6 + 0.4 * Math.sin(T * 6)} />
          <line x1={R[0] + 150} y1={R[1]} x2={R[0] + 226} y2={R[1]} stroke={INDIGO} strokeWidth={3} strokeDasharray="5 7" />
        </g>
      </svg>
      <Big T={T} at={a + 5} top={830} w={1880} s="Same impulse, two very different missions." size={46} italic c={INDIGO} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, yH = 380, t = (((T - e - 1) % 3) + 3) % 3, g1 = t < 1.0 ? eo(t / 1.0) : 1, roll = t > 0.7 && t < 2.3 ? Math.sin(((t - 0.7) / 1.6) * Math.PI) : 0;
  const hx = 1000 + 70 * roll, gx = lerp(560, hx - 74, g1) + (g1 >= 1 ? 0 : 0), gx2 = Math.min(gx, hx - 74);
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden' }}>
        <g opacity={env(T, e + 0.8)} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
          <g transform={`rotate(${14 * roll} 1010 ${yH + 260})`}>
            <circle cx={hx} cy={yH} r={44} fill="#ffffff" />
            <path d={`M ${hx} ${yH + 44} L 1010 ${yH + 260} M 1010 ${yH + 260} L 970 ${yH + 440} M 1010 ${yH + 260} L 1060 ${yH + 440} M ${(hx + 1010) / 2} ${yH + 110} L ${(hx + 1010) / 2 + 80} ${yH + 170}`} />
          </g>
          <path d={`M 300 ${yH + 110} L 440 ${yH + 70} L ${gx2 - 26} ${yH + 6}`} />
          <circle cx={gx2} cy={yH + 6} r={32} fill={CORAL} stroke={INK} />
        </g>
        <SV x={1180} y={yH - 70} s="rolls back with the punch" c={SAGE} size={40} o={env(T, e + 1.6)} />
        <Arr2 x1={1120} y1={yH - 120} x2={1260} y2={yH - 120} c={SAGE} w={6} h={16} o={env(T, e + 1.6)} />
      </svg>
      <Big T={T} at={e + 2.4} top={860} w={1880} s="Why does it hurt LESS, for the same Δp?" size={56} c={INDIGO} />
      <Big T={T} at={e + 3.4} top={940} w={1880} s="Use: Δp · Δt · F" size={40} italic c={GREY} />
    </Scene>
  );
}
function Marz({ T, C }) {
  const s = C.Marz;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Marz" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>R1</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK, marginTop: 6 }}>Reason about how changing Δt (or F) achieves a given Δp.</div></div>
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



























function shotsU3D4(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Hook', 'Trade', 'Cases', 'Sprinter', 'Asteroid', 'Exit', 'Marz'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU3D4(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Hook T={T} C={C} />
        <Trade T={T} C={C} />
        <Cases T={T} C={C} />
        <Sprinter T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
        <Marz T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U3Day4App() {
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
window.U3Day4App = U3Day4App;



























