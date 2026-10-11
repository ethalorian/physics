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


const ORDER = ['Title', 'Welcome', 'Fiction', 'Wonders', 'Sort', 'Units', 'Anchor', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Welcome: [1, 'READ SILENTLY · 5 MIN', 'Read the NASA Day 1 Briefing on your own. No talking yet: notice what it says, and what it doesn’t.'],
  Fiction: [2, 'NOTICE AND WONDER', 'In groups of 3–4: write 3 things you NOTICE and 5+ things you WONDER on chart paper. Then gallery walk.'],
  Wonders: [3, 'SHARE', 'What kinds of questions are we generating? Let’s capture them on the board.'],
  Anchor: [4, 'EXIT TICKET', 'Write ONE question about the asteroid you really want answered this year. Can physics answer it, or must people decide?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Welcome: [0, -1300], Fiction: [2200, -1300], Wonders: [2200, 0], Units: [0, 0], Anchor: [-2200, 0] };
const UNIT_DEFAULTS = ['How fast, and where will it arrive?', 'What forces will steer it?', 'How much energy does it carry?', 'What happens in a collision?', 'How does it move through space?', 'What is it made of?', 'Can we stop it?'];
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
function walkSegs(segs, t) {
  let x = segs[0][2], v = 0, dist = 0, face = Math.sign(segs[0][3] - segs[0][2]) || 1;
  for (const [a, b, x0, x1] of segs) {
    if (t <= a) break;
    const u = clamp((t - a) / (b - a), 0, 1);
    x = lerp(x0, x1, u); dist += Math.abs(x1 - x0) * u; face = Math.sign(x1 - x0) || face;
    v = t < b ? (x1 - x0) / (b - a) : 0;
  }
  return { x, v, dist, face };
}
function trialWalk(tr, td) { let d = 0, p = tr.at(0).x, f = 1; for (let t = 0.05; t <= td; t += 0.05) { const q = tr.at(t); d += Math.abs(q.x - p); p = q.x; if (Math.abs(q.rv) > 0.05) f = Math.sign(q.rv); } const s = tr.at(td); return { x: s.x, v: s.rv, dist: d, face: f }; }
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



function TitleV({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 1 · SETTING UP THE QUESTION</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>The briefing:</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>something is coming</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, color: INDIGO }}>R1 · What we know, and don’t, about 2026-XJ, and the physics tools we’ll need.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Welcome({ T, C }) {
  const w = C.Welcome, pg = env(T, w + 6, 1.0);
  return (
    <Scene n="Welcome" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={w + 0.3} top={44} s="WELCOME" />
      <Big T={T} at={w + 0.6} top={100} s="This class will be different." size={84} />
      <Big T={T} at={w + 2.6} top={230} s="We’ll solve a year-long puzzle, together." size={60} italic c={INDIGO} />
      <Big T={T} at={w + 4.6} top={340} s="Today is the briefing." size={60} />
      <div style={{ position: 'absolute', left: 1240, top: 420, width: 620, height: 560, opacity: pg, transform: `translateY(${(1 - pg) * 120}px) rotate(${-3 * pg}deg)`, background: '#ffffff', border: `2px solid ${LINE}`, borderRadius: 6, boxShadow: '0 30px 60px rgba(34,35,58,0.14)' }}>
        <div style={{ position: 'absolute', left: 40, top: 36, fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: '0.1em', color: INK }}>NASA · DAY 1 BRIEFING</div>
        <div style={{ position: 'absolute', left: 40, top: 84, width: 540, height: 3, background: INK }}></div>
        <div style={{ position: 'absolute', left: 40, top: 110, fontFamily: SERIF, fontSize: 44, color: INK }}>Object 2026-XJ</div>
        {[0, 1, 2, 3, 4, 5, 6].map((k) => <div key={k} style={{ position: 'absolute', left: 40, top: 190 + k * 44, width: [520, 480, 540, 300, 510, 460, 380][k], height: 14, borderRadius: 7, background: TINT }}></div>)}
        <div style={{ position: 'absolute', right: 40, bottom: 36, padding: '6px 16px', border: `4px solid ${CORAL}`, borderRadius: 6, transform: 'rotate(-8deg)', fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', color: CORAL, opacity: env(T, w + 8) }}>READ FIRST</div>
      </div>
    </Scene>
  );
}
function Fiction({ T, C }) {
  const f = C.Fiction, E = [520, 560];
  const u = clamp((T - (f + 1)) / 14, 0, 1), A = [E[0] + 380 - 80 * u, E[1] - 250 + 40 * u];
  return (
    <Scene n="Fiction" T={T} C={C} ph={0.8}>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: env(T, f + 0.4) }}>
        <rect x={60} y={120} width={920} height={860} rx={10} fill="#fbfbfe" stroke={LINE} strokeWidth={2} />
        {[120, 240, 360].map((r) => <circle key={r} cx={E[0]} cy={E[1]} r={r} fill="none" stroke={TINT} strokeWidth={3} />)}
        <line x1={E[0] - 420} y1={E[1]} x2={E[0] + 420} y2={E[1]} stroke={TINT} strokeWidth={2} /><line x1={E[0]} y1={E[1] - 420} x2={E[0]} y2={E[1] + 420} stroke={TINT} strokeWidth={2} />
        <circle cx={E[0]} cy={E[1]} r={34} fill="#d7d8ea" stroke={INK} strokeWidth={4} />
        <text x={E[0]} y={E[1] + 84} textAnchor="middle" fontFamily={SERIF} fontSize={40} fill={INK}>Earth</text>
        <ellipse cx={A[0]} cy={A[1]} rx={70 + 6 * Math.sin(T * 2)} ry={44 + 4 * Math.sin(T * 2)} fill={CORAL_T} stroke={CORAL} strokeWidth={3} strokeDasharray="10 8" transform={`rotate(-30 ${A[0]} ${A[1]})`} />
        <circle cx={A[0]} cy={A[1]} r={10} fill={CORAL} opacity={0.6 + 0.4 * Math.sin(T * 4)} />
        <text x={A[0] + 40} y={A[1] - 60} fontFamily={MONO} fontSize={32} fontWeight={600} fill={CORAL}>2026-XJ</text>
        <text x={A[0] + 40} y={A[1] - 24} fontFamily={SERIF} fontStyle="italic" fontSize={32} fill={GREY}>position: roughly here</text>
      </svg>
      <Big T={T} at={f + 1} top={180} left={1080} s="This is fiction." size={88} />
      <Big T={T} at={f + 3.5} top={320} left={1080} s="The physics is real." size={88} c={SAGE} />
      <Big T={T} at={f + 6.5} top={500} left={1080} w={860} s="This year, we’ll figure out what we can about this object." size={56} italic c={INDIGO} />
    </Scene>
  );
}
const BUCKETS = ['How fast?', 'Where?', 'When?', 'How big?', 'What’s it made of?', 'Can we stop it?'];
const BUBBLES = [['How fast is it going?', 0, 120, 210], ['Will it hit us?', 1, 760, 190], ['When will it get here?', 2, 1300, 230], ['How big is it?', 3, 260, 340], ['What is it made of?', 4, 900, 330], ['Where would it land?', 1, 1440, 370], ['Can we push it off course?', 5, 140, 470], ['Can we blow it up?', 5, 820, 480]];
function Wonders({ T, C }) {
  const wo = C.Wonders, so = C.Sort;
  const seen = {};
  return (
    <Scene n="Wonders" T={T} C={C} ph={1.3}>
      <Kicker T={T} at={wo + 0.3} top={44} s="NOTICE AND WONDER" />
      <div style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - env(T, so + 9, 0.5) }}><Big T={T} at={wo + 0.6} top={92} s="What do we wonder?" size={72} /></div>
      <Big T={T} at={so + 9.5} top={92} s="These questions will organize the year." size={72} c={INDIGO} />
      {BUCKETS.map((b, i) => { const o = env(T, so + 1 + i * 0.3, 0.5); return <div key={i} style={{ position: 'absolute', left: 60 + i * 313, top: 600, width: 290, height: 96, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#eeeefa', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: SERIF, fontSize: 38, lineHeight: 1.05, color: INK, whiteSpace: 'normal', padding: '0 10px', boxSizing: 'border-box' }}>{b}</div>; })}
      {BUBBLES.map(([q, b, x0, y0], k) => {
        const idx = seen[b] = (seen[b] ?? -1) + 1;
        const o = env(T, wo + 1.5 + k * 0.8, 0.5);
        if (o <= 0) return null;
        const m = eio((T - (so + 2.5 + k * 0.6)) / 1.2);
        const x = lerp(x0, 60 + b * 313, m), y = lerp(y0 + 8 * Math.sin(T * 1.3 + k), 724 + idx * 74, m), sc = lerp(1, 0.6, m);
        return <div key={k} style={{ position: 'absolute', left: x, top: y, opacity: o, transform: `scale(${sc})`, transformOrigin: '0 0', padding: '10px 24px', borderRadius: 36, border: `3px solid ${m > 0.5 ? INDIGO : LINE}`, background: '#ffffff', fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INK, boxShadow: '0 10px 24px rgba(34,35,58,0.08)' }}>{q}</div>;
      })}
    </Scene>
  );
}
function Units({ T, C, tw }) {
  const u = C.Units, titles = UNIT_DEFAULTS.map((d, i) => (tw && tw['u' + (i + 1)]) || d);
  const glow = env(T, u + 9.5, 0.6);
  return (
    <Scene n="Units" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={u + 0.3} top={44} s="THE YEAR AS SEVEN PUZZLE PIECES" />
      {titles.map((t, k) => { const x = k < 4 ? 60 + k * 470 : 295 + (k - 4) * 470, y = k < 4 ? 120 : 460, o = env(T, u + 1 + k * 0.9, 0.6), hi = k === 0 ? glow : 0; return (
        <div key={k} style={{ position: 'absolute', left: x, top: y, width: 440, height: 300, opacity: o, transform: `translateY(${(1 - o) * 30}px) scale(${1 + 0.04 * hi})`, borderRadius: 12, border: `${hi > 0 ? 5 : 3}px solid ${hi > 0 ? SAGE : LINE}`, background: hi > 0 ? SAGE_T : '#ffffff', padding: '24px 30px', boxSizing: 'border-box', whiteSpace: 'normal' }}>
          <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', color: CORAL }}>{`UNIT ${k + 1}`}</div>
          <div style={{ fontFamily: SERIF, fontSize: 46, lineHeight: 1.12, color: INK, marginTop: 14 }}>{t}</div>
        </div>
      ); })}
      <Big T={T} at={u + 11} top={830} s="Each unit answers one piece of the puzzle." size={58} italic c={INDIGO} />
    </Scene>
  );
}
function Anchor({ T, C, tw }) {
  const an = C.Anchor, q = (tw && tw.u1) || UNIT_DEFAULTS[0];
  const chips = ['position', 'velocity', 'acceleration'];
  return (
    <Scene n="Anchor" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={an + 0.3} top={44} s="TODAY’S ANCHOR QUESTION · UNIT 1" />
      <Big T={T} at={an + 0.8} top={110} w={1860} s={q} size={96} />
      <Big T={T} at={an + 3.6} top={400} s="To answer it, we need the language of motion:" size={56} />
      <div style={{ position: 'absolute', left: 60, top: 500, display: 'flex', gap: 30 }}>
        {chips.map((c, i) => { const o = env(T, an + 5.4 + i * 0.8, 0.5); return <div key={i} style={{ padding: '18px 40px', borderRadius: 12, border: `3px solid ${SAGE}`, background: SAGE_T, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: SERIF, fontSize: 64, color: INK }}>{c}</div>; })}
      </div>
      <Big T={T} at={an + 9} top={700} s="We start tomorrow." size={64} italic c={INDIGO} />
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


function shots1(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    o(C.Welcome, 1.8, S('Welcome')), o(C.Fiction, 1.9, S('Fiction')), o(C.Wonders, 1.9, S('Wonders')),
    o(C.Units, 1.9, S('Units')), o(C.Anchor, 1.9, S('Anchor')),
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
  const cam = camAt(T, shots1(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleV T={T} C={C} tw={tw} />
        <Welcome T={T} C={C} tw={tw} />
        <Fiction T={T} C={C} tw={tw} />
        <Wonders T={T} C={C} tw={tw} />
        <Units T={T} C={C} tw={tw} />
        <Anchor T={T} C={C} tw={tw} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}


function BriefingDay1App() {
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
        <TweakSection label="Unit titles" />
        {UNIT_DEFAULTS.map((d, i) => <TweakText key={i} label={`Unit ${i + 1}`} value={tw['u' + (i + 1)] ?? d} onChange={(v) => setTweak('u' + (i + 1), v)} />)}
      </TweaksPanel>
    </React.Fragment>
  );
}
window.BriefingDay1App = BriefingDay1App;
