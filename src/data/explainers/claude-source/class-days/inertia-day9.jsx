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

function makeTrial(x0, segs, dur, soft = 0.35, lag = 0, noise = 1) {
  const dt = 0.02, n = Math.round(dur / dt);
  const vAt = (t) => { t -= lag; let v = 0; for (const [a, b, vv] of segs) { const up = clamp((t - a) / soft + 0.5, 0, 1), dn = clamp((t - b) / soft + 0.5, 0, 1); v += vv * (up - dn); } return v; };
  const X = [x0], V = [0];
  for (let i = 1; i <= n; i++) { const v = vAt(i * dt); V.push(v); X.push(X[i - 1] + v * dt); }
  const nzx = (t) => noise * (0.004 * Math.sin(t * 41.3) + 0.003 * Math.sin(t * 97.1));
  return { dur, at: (t) => { const i = clamp(Math.round(t / dt), 0, n); return { x: X[i] + nzx(t), v: V[i] + noise * (0.008 * Math.sin(t * 13.7) + 0.006 * Math.sin(t * 29.3)), rv: V[i] }; } };
}
function StickWalker({ x, y, dist, v, face, s = 1, o = 1 }) {
  const mov = clamp(Math.abs(v) / 0.25, 0, 1), ph = (dist / 0.72) * Math.PI * 2;
  const L = 200 * s, bob = 6 * s * mov * Math.abs(Math.cos(ph));
  const hip = [0, -2 * L - 8 * s + bob];
  const leg = (p) => { const sw = 26 * mov * Math.sin(p) * D2R, kn = (6 + 34 * mov * Math.max(0, Math.sin(p + 1.4))) * D2R; const k = [hip[0] + L * Math.sin(sw), hip[1] + L * Math.cos(sw)]; const f = [k[0] + L * Math.sin(sw - kn), k[1] + L * Math.cos(sw - kn)]; return `M ${hip[0]} ${hip[1]} L ${k[0]} ${k[1]} L ${f[0]} ${f[1]} l ${34 * s} 0`; };
  const sh = [0, hip[1] - 1.55 * L];
  const arm = (p) => { const sw = -22 * mov * Math.sin(p) * D2R; const e = [sh[0] + 0.62 * L * Math.sin(sw), sh[1] + 0.62 * L * Math.cos(sw)]; const hnd = [e[0] + 0.58 * L * Math.sin(sw + 0.35 * mov + 0.1), e[1] + 0.58 * L * Math.cos(sw + 0.35 * mov + 0.1)]; return `M ${sh[0]} ${sh[1]} L ${e[0]} ${e[1]} L ${hnd[0]} ${hnd[1]}`; };
  const w = 11 * s;
  return (
    <g transform={`translate(${x} ${y}) scale(${face} 1)`} opacity={o} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={leg(ph + Math.PI)} stroke="#6b6c86" /><path d={arm(ph)} stroke="#6b6c86" />
      <path d={`M ${hip[0]} ${hip[1]} L ${sh[0] + 6 * s} ${sh[1]}`} />
      <path d={leg(ph)} /><path d={arm(ph + Math.PI)} />
      <circle cx={10 * s} cy={sh[1] - 0.42 * L} r={0.3 * L} fill="#ffffff" />
    </g>
  );
}


const ORDER = ['Title', 'Hook', 'History', 'Inertia', 'Cloth', 'Coin', 'Car', 'Asteroid', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Hook: [1, 'PREDICT', 'Why does the puck slide so much farther than the brick?'],
  History: [2, 'DISCUSS', 'Put Newton’s 1st Law in your own words. What does “net force” mean?'],
  Cloth: [3, 'PREDICT', 'The cloth is yanked out fast. What happens to the cups? Why?'],
  Coin: [4, 'PREDICT', 'Flick the card sideways, fast. Where does the coin go? Why?'],
  Car: [5, 'DISCUSS', 'Nothing pushes the passenger forward. So why do they lurch? Use “inertia” and “net force.”'],
  Exit: [6, 'EXIT TICKET', 'Why must a deflection mission apply a FORCE to 2026-XJ? What does Newton’s 1st Law tell us about why it keeps coming?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Hook: [0, -1300], History: [2200, -1300], Inertia: [2200, 0], Cloth: [0, 0], Coin: [-2200, 0], Car: [-2200, 1300], Asteroid: [0, 1300], Exit: [2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} />;
function CarG({ x, y, c, s = 1, o = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M -70 -20 L -70 -46 L -34 -46 L -18 -70 L 30 -70 L 48 -46 L 70 -46 L 70 -20 Z" fill={c} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M -12 -64 L 26 -64 L 38 -48 L -22 -48 Z" fill="#ffffff" stroke={INK} strokeWidth={2} />
      <circle cx={-40} cy={-18} r={15} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
      <circle cx={42} cy={-18} r={15} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
    </g>
  );
}
// small v–t axes in card coordinates
function VT({ x, y, w, h, vmax = 20, tmax = 6, o = 1, tickV = [], tickT = [], children, label = true }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {tickV.map((v) => <g key={'v' + v}><line x1={x} y1={y + h - (v / vmax) * h} x2={x + w} y2={y + h - (v / vmax) * h} stroke={TINT} strokeWidth={2} /><text x={x - 14} y={y + h - (v / vmax) * h + 10} textAnchor="end" fontFamily={MONO} fontSize={28} fill={GREY}>{v}</text></g>)}
      {tickT.map((t) => <g key={'t' + t}><line x1={x + (t / tmax) * w} y1={y} x2={x + (t / tmax) * w} y2={y + h} stroke={TINT} strokeWidth={2} /><text x={x + (t / tmax) * w} y={y + h + 40} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY}>{t}</text></g>)}
      <line x1={x} y1={y - 10} x2={x} y2={y + h} stroke={INK} strokeWidth={4} />
      <line x1={x} y1={y + h} x2={x + w + 10} y2={y + h} stroke={INK} strokeWidth={4} />
      {label && <text x={x + w} y={y + h + (tickT.length ? 84 : 44)} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>t (s)</text>}
      {label && <text x={x + 14} y={y + 14} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>v (m/s)</text>}
      {children}
    </g>
  );
}



const Ans = ({ T, at, s }) => <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, opacity: env(T, at), fontFamily: MONO, fontSize: 36, fontWeight: 600, color: SAGE, whiteSpace: 'normal', lineHeight: 1.3 }}>{M(s)}</div>;
function Cups({ x, y, dx = 0, o = 1 }) {
  const cup = (cx, cy) => <path key={cx + '_' + cy} d={`M ${cx - 34} ${cy - 70} L ${cx + 34} ${cy - 70} L ${cx + 26} ${cy} L ${cx - 26} ${cy} Z`} fill="#ffffff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
  return <g transform={`translate(${x + dx} ${y})`} opacity={o}>{[cup(-40, 0), cup(40, 0), cup(0, -74)]}</g>;
}
function Glass({ x, y }) {
  return <path d={`M ${x - 70} ${y - 200} L ${x - 54} ${y} L ${x + 54} ${y} L ${x + 70} ${y - 200}`} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
}
function TitleV({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 9 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Newton’s 1st Law</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Inertia</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: INDIGO }}>R6 · The 1st Law in your own words, and why 2026-XJ keeps coasting.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Hook({ T, C }) {
  const h = C.Hook, t = Math.max(0, T - (h + 3));
  const puck = 220 + 1500 * (1 - Math.exp(-t / 2.2)), brick = 220 + 300 * (1 - Math.exp(-t / 0.35));
  return (
    <Scene n="Hook" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={h + 0.3} top={44} s="WARM-UP" />
      <Big T={T} at={h + 0.6} top={92} s="Same shove. Very different slides." size={72} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, h + 1.4)}>
          <rect x={120} y={360} width={1800} height={40} fill="#eef3fb" stroke={LINE} strokeWidth={3} />
          <text x={130} y={450} fontFamily={MONO} fontSize={30} fill={GREY}>ice</text>
          <ellipse cx={puck} cy={350} rx={60} ry={16} fill={INK} />
          <rect x={puck - 60} y={330} width={120} height={20} fill={INK} />
          <ellipse cx={puck} cy={330} rx={60} ry={16} fill="#3a3b58" />
        </g>
        <g opacity={env(T, h + 1.8)}>
          <rect x={120} y={700} width={1800} height={40} fill="#ffffff" stroke={INK} strokeWidth={3} />
          {Array.from({ length: 30 }, (_, k) => <line key={k} x1={140 + k * 60} y1={740} x2={170 + k * 60} y2={700} stroke={GREY} strokeWidth={2} opacity={0.5} />)}
          <text x={130} y={790} fontFamily={MONO} fontSize={30} fill={GREY}>floor</text>
          <rect x={brick - 80} y={620} width={160} height={80} rx={4} fill={CORAL_T} stroke={INK} strokeWidth={4} />
        </g>
      </svg>
    </Scene>
  );
}
function GalPanel({ x, y, T, at, slope, label }) {
  const Hh = 110, L = 140, FL = 380, u = clamp((T - at) / 3.2, 0, 1);
  const right = slope ? Hh / Math.tan(slope * D2R) : FL;
  const p1 = Math.min(1, u * 2.2), p2 = clamp((u * 2.2 - 1) / 1.2, 0, 1);
  let bx, by;
  if (p1 < 1) { bx = x + L * p1; by = y - Hh + Hh * p1; } else { bx = x + L + right * p2; by = y - (slope ? Hh * p2 : 0); }
  return (
    <g opacity={env(T, at - 1)}>
      <line x1={x - 20} y1={y - Hh} x2={x + L + right + 20} y2={y - Hh} stroke={SAGE} strokeWidth={3} strokeDasharray="10 8" />
      <path d={`M ${x} ${y - Hh} L ${x + L} ${y} ${slope ? `L ${x + L + right} ${y - Hh}` : `L ${x + L + FL} ${y}`}`} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={bx} cy={by - 16} r={16} fill={CORAL} />
      {!slope && p2 >= 1 && <path d={`M ${x + L + FL + 10} ${y - 16} l 40 0 m -14 -12 l 14 12 l -14 12`} fill="none" stroke={CORAL} strokeWidth={5} strokeLinecap="round" />}
      <text x={x + 60} y={y + 50} fontFamily={SERIF} fontStyle="italic" fontSize={38} fill={GREY}>{label}</text>
    </g>
  );
}
function History({ T, C }) {
  const h = C.History, t = Math.max(0, T - (h + 4)), ax = 180 + 520 * (1 - Math.exp(-t / 0.6));
  return (
    <Scene n="History" T={T} C={C} ph={0.7}>
      <Ans T={T} at={h + 0.3} s="STOP 1 · Friction. Ice has very little; the floor has a lot. Now imagine none at all…" />
      <Kicker T={T} at={h + 2.4} top={130} s="ARISTOTLE · ABOUT 350 BCE" />
      <Big T={T} at={h + 2.8} top={180} s="Moving things naturally come to rest." size={50} italic />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, h + 3)}><line x1={1060} y1={300} x2={1900} y2={300} stroke={INK} strokeWidth={5} /><circle cx={ax + 880} cy={282} r={18} fill={GREY} /></g>
        <GalPanel x={80} y={590} T={T} at={h + 9} slope={35} label="steep" />
        <GalPanel x={700} y={590} T={T} at={h + 10.4} slope={15} label="gentle" />
        <GalPanel x={1320} y={590} T={T} at={h + 11.8} slope={0} label="flat: keeps going" />
      </svg>
      <Kicker T={T} at={h + 7.4} top={360} s="GALILEO · EARLY 1600s · A THOUGHT EXPERIMENT" />
      <Big T={T} at={h + 7.8} top={700} w={1880} s="It climbs back to the same height. Flatten the far ramp, and nothing makes it stop." size={44} italic c={INDIGO} />
      <div style={{ position: 'absolute', left: 60, top: 790, width: 1880, opacity: env(T, h + 17), borderRadius: 12, border: `4px solid ${INK}`, background: '#ffffff', padding: '20px 32px', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', color: CORAL }}>NEWTON’S 1ST LAW</div>
        <div style={{ fontFamily: SERIF, fontSize: 48, lineHeight: 1.2, color: INK, marginTop: 8, whiteSpace: 'normal' }}>An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted on by a <b>net force</b>.</div>
      </div>
    </Scene>
  );
}
function Inertia({ T, C }) {
  const n = C.Inertia, t = Math.max(0, T - (n + 6)), push = win(T, n + 5.6, n + 6.4, 0.2);
  const xl = 400 + 1.6 * 240 * t, xh = 400 + 0.4 * 240 * t;
  return (
    <Scene n="Inertia" T={T} C={C} ph={1.1}>
      <Kicker T={T} at={n + 0.3} top={44} s="INERTIA" />
      <Big T={T} at={n + 0.6} top={92} s="An object’s resistance to a change in its motion." size={64} />
      <Big T={T} at={n + 2.6} top={190} s="More mass, more inertia." size={56} italic c={INDIGO} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, n + 3.4)}>
          <line x1={120} y1={520} x2={1880} y2={520} stroke={INK} strokeWidth={5} />
          <line x1={120} y1={820} x2={1880} y2={820} stroke={INK} strokeWidth={5} />
          <Cart x={Math.min(xl, 1700)} y={520} T={T} led={SAGE} s={1.3} />
          <Cart x={Math.min(xh, 1700)} y={820} T={T} led={SAGE} s={1.3} />
          {[0, 1, 2].map((k) => <rect key={k} x={Math.min(xh, 1700) - 100} y={820 - 150 - k * 36} width={200} height={32} rx={4} fill="#d7d8ea" stroke={INK} strokeWidth={3} />)}
        </g>
        <Arr x1={140} y1={470} x2={270} y2={470} c={CORAL} o={push} />
        <Arr x1={140} y1={770} x2={270} y2={770} c={CORAL} o={push} />
        <SV x={140} y={440} s="same push" c={CORAL} size={38} o={push} />
      </svg>
      <Big T={T} at={n + 8} top={290} left={1000} s="small mass: big change in velocity" size={44} italic c={SAGE} />
      <Big T={T} at={n + 9.4} top={860} left={1000} s="large mass: small change in velocity" size={44} italic c={CORAL} />
    </Scene>
  );
}
function Cloth({ T, C }) {
  const c = C.Cloth;
  return (
    <Scene n="Cloth" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={c + 0.3} top={44} s="DEMO 1 · THE TABLECLOTH PULL" />
      <Big T={T} at={c + 0.6} top={92} s="Predict, observe, explain." size={66} italic c={INDIGO} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 1.4)}>
          <rect x={400} y={640} width={1000} height={30} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <line x1={440} y1={670} x2={440} y2={940} stroke={INK} strokeWidth={6} /><line x1={1360} y1={670} x2={1360} y2={940} stroke={INK} strokeWidth={6} />
          <path d="M 420 636 L 1400 636 L 1400 760" fill="none" stroke={INDIGO} strokeWidth={8} />
          <Cups x={900} y={632} />
        </g>
        <Arr x1={1440} y1={760} x2={1640} y2={760} c={CORAL} o={env(T, c + 3)} />
        <SV x={1460} y={720} s="yank!" c={CORAL} o={env(T, c + 3)} />
      </svg>
    </Scene>
  );
}
function Coin({ T, C }) {
  const c = C.Coin, u = clamp((T - (c + 1.6)) / 0.35, 0, 1);
  return (
    <Scene n="Coin" T={T} C={C} ph={0.9}>
      <Ans T={T} at={c + 0.3} s="STOP 3 · The cups stay put. The cloth pulls on them only briefly, so their inertia keeps them at rest." />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 0.8)}>
          <rect x={80} y={560} width={760} height={24} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <path d={`M ${100 + 1000 * u} 556 L ${820 + 1000 * u} 556`} stroke={INDIGO} strokeWidth={8} opacity={1 - u} />
          <Cups x={460} y={552} dx={6 * u} />
        </g>
        <g opacity={env(T, c + 5)}>
          <Glass x={1440} y={820} />
          <rect x={1260} y={608} width={360} height={14} fill={CORAL_T} stroke={INK} strokeWidth={3} />
          <ellipse cx={1440} cy={600} rx={34} ry={9} fill="#e8c46a" stroke={INK} strokeWidth={3} />
        </g>
        <Arr x1={1100} y1={615} x2={1230} y2={615} c={CORAL} o={env(T, c + 7)} />
        <SV x={1080} y={580} s="flick" c={CORAL} an="end" o={env(T, c + 7)} />
      </svg>
      <Kicker T={T} at={c + 4.4} top={200} left={1040} s="DEMO 2 · COIN AND CARD" />
      <Big T={T} at={c + 5.4} top={260} left={1040} s="A coin rests on a card over a glass." size={48} italic />
    </Scene>
  );
}
function Car({ T, C }) {
  const c = C.Car, cd = clamp((T - (c + 0.8)) / 0.5, 0, 1);
  const tt = Math.max(0, T - (c + 6)), stopT = 2.4, v0 = 420;
  const cx = tt < stopT ? 200 + v0 * tt : 200 + v0 * stopT + Math.min(40, 260 * (1 - Math.exp(-(tt - stopT) * 6)) * 0.15);
  const lurch = tt > stopT ? 46 * Math.exp(-(tt - stopT) * 2.4) * Math.sin(Math.min(Math.PI / 2, (tt - stopT) * 8)) : 0;
  return (
    <Scene n="Car" T={T} C={C} ph={0.6}>
      <Ans T={T} at={c + 0.3} s="STOP 4 · The card shoots away; the coin’s inertia keeps it in place, so it drops into the glass." />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 0.4) * (1 - env(T, c + 5, 0.6))} transform="translate(-200 -260) scale(0.8)">
          <Glass x={1440} y={820} />
          <rect x={1260 + 900 * cd} y={608} width={360} height={14} fill={CORAL_T} stroke={INK} strokeWidth={3} opacity={1 - cd} />
          <ellipse cx={1440} cy={600 + 190 * eo((T - (c + 1.0)) / 0.6)} rx={34} ry={9} fill="#e8c46a" stroke={INK} strokeWidth={3} />
        </g>
        <g opacity={env(T, c + 5.2)}>
          <line x1={80} y1={760} x2={1920} y2={760} stroke={INK} strokeWidth={5} />
          <rect x={200 + v0 * stopT + 230} y={560} width={40} height={200} fill={CORAL} opacity={0.8} />
          <g transform={`translate(${cx} 760) scale(2.6)`}>
            <circle cx={4 + lurch / 2.6} cy={-58} r={9} fill="#ffffff" stroke={INK} strokeWidth={2} />
          </g>
          <CarG x={cx} y={760} c={SAGE_T} s={2.6} />
          <g transform={`translate(${cx} 760) scale(2.6)`}>
            <circle cx={4 + lurch / 2.6} cy={-58} r={9} fill="#ffffff" stroke={INK} strokeWidth={2.2} />
          </g>
        </g>
      </svg>
      <Kicker T={T} at={c + 5.4} top={300} s="THE SUDDEN STOP" />
      <Big T={T} at={c + 9.2} top={360} s="Watch the passenger." size={60} italic c={INDIGO} />
    </Scene>
  );
}
const SUN = [160, 320];
function Asteroid({ T, C }) {
  const a = C.Asteroid, t = Math.max(0, T - (a + 4)), x = 160 + 90 * t;
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.8}>
      <Ans T={T} at={a + 0.3} s="STOP 5 · No force pushes them forward. Their bodies keep moving while the car stops; the seatbelt supplies the net force that stops them." />
      <Kicker T={T} at={a + 3} top={170} s="BACK TO 2026-XJ · IN SPACE" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, a + 3.2)}>
          {Array.from({ length: 40 }, (_, k) => <circle key={k} cx={80 + ((k * 397) % 1840)} cy={260 + ((k * 211) % 420)} r={2.5} fill={GREY} opacity={0.4} />)}
          {Array.from({ length: Math.floor(t / 1.2) + 1 }, (_, k) => <circle key={'d' + k} cx={160 + 90 * 1.2 * k} cy={460} r={7} fill={INDIGO} opacity={0.6} />)}
          <Rock x={Math.min(x, 1860)} y={460} r={34} spin={T * 18} />
        </g>
        <g opacity={env(T, a + 14)}>
          <circle cx={SUN[0]} cy={SUN[1]} r={70} fill={CORAL_T} stroke={CORAL} strokeWidth={4} />
          <text x={SUN[0]} y={SUN[1] + 14} textAnchor="middle" fontFamily={SERIF} fontSize={40} fill={CORAL}>Sun</text>
          {(() => { const rx = Math.min(x, 1860), dx = SUN[0] - rx, dy = SUN[1] - 460, d = Math.hypot(dx, dy); return <Arr x1={rx + 40 * dx / d} y1={460 + 40 * dy / d} x2={rx + 220 * dx / d} y2={460 + 220 * dy / d} c={CORAL} w={8} h={20} />; })()}
        </g>
      </svg>
      <Big T={T} at={a + 6} top={560} s="No air. No friction." size={56} italic />
      <Big T={T} at={a + 8.4} top={640} s="With no net force: constant velocity, forever." size={60} c={INDIGO} />
      <Big T={T} at={a + 14.4} top={740} w={1880} s="What does pull on it: gravity, mostly the Sun’s, plus weaker pulls from Earth and the Moon." size={46} italic c={CORAL} />
      <div style={{ position: 'absolute', left: 60, top: 870, opacity: env(T, a + 19), padding: '10px 26px', borderRadius: 10, border: `3px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 50, color: INK }}>To change its path, we need a force.</div>
      <Big T={T} at={a + 21} top={885} left={1000} s="Predictable, but hard to stop." size={46} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, sx = 300 + 700 * eo((T - (e + 1.4)) / 3);
  return (
    <Scene n="Exit" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={92} s="A deflection mission" size={84} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, e + 1.2)}>
          <g transform={`translate(${sx} 560)`}>
            <rect x={-40} y={-30} width={80} height={60} rx={6} fill="#ffffff" stroke={INK} strokeWidth={4} />
            <rect x={-170} y={-16} width={120} height={32} fill="#eeeefa" stroke={INK} strokeWidth={3} />
            <rect x={50} y={-16} width={120} height={32} fill="#eeeefa" stroke={INK} strokeWidth={3} />
          </g>
          <Rock x={1400} y={560} r={80} spin={T * 10} />
          <Arr x1={1250} y1={460} x2={1250} y2={330} c={CORAL} o={env(T, e + 4)} />
          <SV x={1280} y={360} s="F = ?" c={CORAL} size={52} o={env(T, e + 4)} />
        </g>
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


function shots9(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Hook', 'History', 'Inertia', 'Cloth', 'Coin', 'Car', 'Asteroid', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots9(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleV T={T} C={C} />
        <Hook T={T} C={C} />
        <History T={T} C={C} />
        <Inertia T={T} C={C} />
        <Cloth T={T} C={C} />
        <Coin T={T} C={C} />
        <Car T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function InertiaDay9App() {
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
window.InertiaDay9App = InertiaDay9App;


