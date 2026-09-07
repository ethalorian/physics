/* Interactive physics sims, wave 2 — CPA Physics Unit 1 · dark instrument-panel style */
const { useState, useRef, useEffect } = React;

const C2 = {
  bg: '#17142E', panel: '#1E1A38', line: '#2E2950', ink: '#FAF9FC',
  dim: '#8B87A6', lav: '#9B8EC4', sage: '#7FA68B', gold: '#E0A93D',
  mono: "'IBM Plex Mono', monospace", disp: "'Space Grotesk', sans-serif",
};

function B2({ label, onClick, color = C2.gold, active = false, disabled = false, small = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: C2.mono, fontSize: small ? 17 : 20, letterSpacing: '0.12em', cursor: disabled ? 'default' : 'pointer',
      padding: small ? '10px 18px' : '14px 26px', borderRadius: 4, border: `2px solid ${color}`,
      background: active ? color : 'transparent', color: active ? '#17142E' : color,
      opacity: disabled ? 0.35 : 1, fontWeight: 600, transition: 'all .15s',
    }}>{label}</button>
  );
}
function R2({ label, value, color = C2.ink }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: C2.mono, fontSize: 16, letterSpacing: '0.2em', color: C2.dim }}>{label}</span>
      <span style={{ fontFamily: C2.disp, fontSize: 32, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
function Sld({ label, val, set, min, max, step = 1, unit = '', color = C2.gold, fmt }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C2.mono, fontSize: 16 }}>
        <span style={{ color: C2.dim, letterSpacing: '0.16em' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{fmt ? fmt(val) : `${val} ${unit}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(+e.target.value)} style={{ width: '100%', accentColor: color, height: 6 }} />
    </div>
  );
}

/* ───────── WALK SIM (Day 2) — distance vs displacement ───────── */
function WalkSim() {
  const [path, setPath] = useState([[0, 0]]);
  const pos = path[path.length - 1];
  const step = (dx, dy) => setPath((p) => {
    const [x, y] = p[p.length - 1];
    const nx = Math.max(-5, Math.min(5, x + dx)), ny = Math.max(-5, Math.min(5, y + dy));
    if (nx === x && ny === y) return p;
    return [...p, [nx, ny]];
  });
  const dist = path.length - 1;
  const disp = Math.sqrt(pos[0] ** 2 + pos[1] ** 2);
  const S = 40, ox = 260, oy = 240;
  const px = (p) => [ox + p[0] * S, oy - p[1] * S];
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', gap: 44, border: `1px solid ${C2.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 520 480" style={{ width: 480, flex: 'none' }}>
        {[...Array(11)].map((_, i) => (
          <g key={i}>
            <line x1={ox - 5 * S} y1={oy - 5 * S + i * S} x2={ox + 5 * S} y2={oy - 5 * S + i * S} stroke={C2.line} strokeWidth={1} />
            <line x1={ox - 5 * S + i * S} y1={oy - 5 * S} x2={ox - 5 * S + i * S} y2={oy + 5 * S} stroke={C2.line} strokeWidth={1} />
          </g>
        ))}
        <text x={ox} y={oy - 5 * S - 12} textAnchor="middle" fontFamily={C2.mono} fontSize={18} fill={C2.dim}>N</text>
        <text x={ox} y={oy + 5 * S + 26} textAnchor="middle" fontFamily={C2.mono} fontSize={18} fill={C2.dim}>S</text>
        <text x={ox + 5 * S + 18} y={oy + 6} fontFamily={C2.mono} fontSize={18} fill={C2.dim}>E</text>
        <text x={ox - 5 * S - 18} y={oy + 6} textAnchor="end" fontFamily={C2.mono} fontSize={18} fill={C2.dim}>W</text>
        {/* path */}
        <polyline points={path.map((p) => px(p).join(',')).join(' ')} fill="none" stroke={C2.sage} strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
        {/* displacement */}
        {disp > 0 && <line x1={px([0, 0])[0]} y1={px([0, 0])[1]} x2={px(pos)[0]} y2={px(pos)[1]} stroke={C2.gold} strokeWidth={4} strokeDasharray="10 8" />}
        <circle cx={px([0, 0])[0]} cy={px([0, 0])[1]} r={9} fill={C2.lav} />
        <circle cx={px(pos)[0]} cy={px(pos)[1]} r={11} fill={C2.gold} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
        <div style={{ fontFamily: C2.mono, fontSize: 17, letterSpacing: '0.22em', color: C2.dim }}>WALK IT — ONE STEP AT A TIME</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 90px)', gap: 10, justifyItems: 'center' }}>
          <span></span><B2 small label="N ↑" color={C2.sage} onClick={() => step(0, 1)} /><span></span>
          <B2 small label="← W" color={C2.sage} onClick={() => step(-1, 0)} />
          <B2 small label="RESET" color={C2.dim} onClick={() => setPath([[0, 0]])} />
          <B2 small label="E →" color={C2.sage} onClick={() => step(1, 0)} />
          <span></span><B2 small label="S ↓" color={C2.sage} onClick={() => step(0, -1)} /><span></span>
        </div>
        <div style={{ display: 'flex', gap: 44, borderTop: `1px solid ${C2.line}`, paddingTop: 22 }}>
          <R2 label="DISTANCE (path)" value={`${dist} steps`} color={C2.sage} />
          <R2 label="DISPLACEMENT" value={`${disp.toFixed(1)} steps`} color={C2.gold} />
        </div>
        <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>
          Try 5 N, 3 E, 5 S. <span style={{ color: C2.ink }}>Distance climbs with every step; displacement only cares where you ended up.</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── WINDOW SIM (Day 5) — uncertainty fan ───────── */
function WindowSim() {
  const [months, setMonths] = useState(3);
  const [sigV, setSigV] = useState(200);
  const widthKm = 2 * sigV * (months / 6) * 1.6e7 / 1e5;   // in units of 10^5 km... compute: σv m/s × t s = m; /1e3 km
  const winKm = 2 * sigV * (months / 6) * 1.6e7 / 1000;    // km
  const x0 = 90, y0 = 330, x6 = 700, y6 = 150;
  const f = months / 6;
  const fx = x0 + f * (x6 - x0), fy = y0 + f * (y6 - y0);
  const spread = 10 + f * (sigV / 400) * 130;
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24, border: `1px solid ${C2.line}` }}>
      <svg viewBox="0 0 860 400" style={{ width: '100%' }}>
        <circle cx={790} cy={110} r={38} fill="#22406B" stroke={C2.sage} strokeWidth={2.5} />
        <text x={790} y={172} textAnchor="middle" fontFamily={C2.mono} fontSize={18} fill={C2.sage}>EARTH</text>
        <line x1={x0} y1={y0} x2={x6} y2={y6} stroke={C2.dim} strokeWidth={2} strokeDasharray="10 10" />
        {/* fan */}
        <polygon points={`${x0},${y0} ${fx + spread * 0.28},${fy - spread} ${fx + spread * 0.28 + 14},${fy + spread * 0.5 - 8} ${x0},${y0}`} fill="rgba(155,142,196,0.18)" stroke={C2.lav} strokeWidth={2} />
        <g transform={`translate(${x0} ${y0})`}>
          <path d="M -20 -6 L -10 -19 L 7 -20 L 20 -9 L 19 8 L 5 19 L -12 16 L -21 5 Z" fill="#3A3458" stroke={C2.gold} strokeWidth={2.5} />
        </g>
        <circle cx={fx} cy={fy} r={9} fill={C2.gold} />
        <text x={x0} y={y0 + 42} fontFamily={C2.mono} fontSize={18} fill={C2.dim}>now</text>
        <text x={fx + 24} y={fy - spread - 10} fontFamily={C2.mono} fontSize={19} fill={C2.lav}>the window</text>
      </svg>
      <div style={{ display: 'flex', gap: 44, alignItems: 'center', flexWrap: 'wrap' }}>
        <Sld label="ADVANCE TIME" val={months} set={setMonths} min={0} max={6} step={0.1} fmt={(v) => `${v.toFixed(1)} mo`} color={C2.gold} />
        <Sld label="VELOCITY UNCERTAINTY" val={sigV} set={setSigV} min={0} max={400} step={10} unit="m/s ±" color={C2.lav} />
        <R2 label="POSITION WINDOW" value={`± ${Math.round(winKm / 2).toLocaleString()} km`} color={C2.lav} />
      </div>
      <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>
        Noise in the velocity <span style={{ color: C2.ink }}>propagates</span> — the longer you predict, the wider the window. Zero the uncertainty: the window collapses to a point.
      </div>
    </div>
  );
}

/* ───────── ACCEL SIM (Day 7) — drive the car, trace v-t ───────── */
function AccelSim() {
  const [mode, setMode] = useState('coast');       // accel | coast | brake
  const [running, setRunning] = useState(false);
  const [hist, setHist] = useState([{ t: 0, v: 0 }]);
  const stateRef = useRef({ v: 0, t: 0, x: 0, mode: 'coast' });
  const raf = useRef(null);
  stateRef.current.mode = mode;

  const acc = { accel: 4, coast: 0, brake: -6 };
  const start = () => {
    if (running) return;
    setRunning(true);
    let last = performance.now();
    const stepFn = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const s = stateRef.current;
      s.v = Math.max(0, Math.min(30, s.v + acc[s.mode] * dt));
      s.t += dt; s.x = (s.x + s.v * dt * 0.9) % 100;
      if (s.t < 20) {
        setHist((h) => [...h.slice(-400), { t: s.t, v: s.v }]);
        raf.current = requestAnimationFrame(stepFn);
      } else setRunning(false);
    };
    raf.current = requestAnimationFrame(stepFn);
  };
  const reset = () => { cancelAnimationFrame(raf.current); setRunning(false); stateRef.current = { v: 0, t: 0, x: 0, mode }; setHist([{ t: 0, v: 0 }]); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const s = stateRef.current;
  const GX = 60, GY = 20, GW = 420, GH = 220;
  const pts = hist.map((p) => `${GX + (p.t / 20) * GW},${GY + GH - (p.v / 30) * GH}`);
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', gap: 44, border: `1px solid ${C2.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 520 290" style={{ width: 500, flex: 'none' }}>
        <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C2.dim} strokeWidth={2.5} />
        <line x1={GX} y1={GY + GH} x2={GX + GW} y2={GY + GH} stroke={C2.dim} strokeWidth={2.5} />
        <text x={GX - 14} y={GY + 14} textAnchor="end" fontFamily={C2.mono} fontSize={18} fill={C2.dim}>v</text>
        <text x={GX + GW} y={GY + GH + 28} textAnchor="end" fontFamily={C2.mono} fontSize={18} fill={C2.dim}>t</text>
        <polyline points={pts.join(' ')} fill="none" stroke={C2.gold} strokeWidth={4} strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
        {/* road */}
        <div style={{ position: 'relative', height: 86, background: C2.panel, borderRadius: 6, border: `1px solid ${C2.line}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, borderTop: `2px dashed ${C2.line}` }}></div>
          <div style={{ position: 'absolute', bottom: 28, left: `${s.x * 0.85}%`, width: 66, height: 30, background: '#262148', border: `2px solid ${C2.lav}`, borderRadius: 5 }}>
            <div style={{ position: 'absolute', bottom: -11, left: 8, width: 14, height: 14, borderRadius: '50%', background: C2.dim }}></div>
            <div style={{ position: 'absolute', bottom: -11, right: 8, width: 14, height: 14, borderRadius: '50%', background: C2.dim }}></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <B2 small label="ACCELERATE +4" color={C2.sage} active={mode === 'accel'} onClick={() => { setMode('accel'); start(); }} />
          <B2 small label="COAST 0" color={C2.lav} active={mode === 'coast'} onClick={() => { setMode('coast'); start(); }} />
          <B2 small label="BRAKE −6" color={C2.gold} active={mode === 'brake'} onClick={() => { setMode('brake'); start(); }} />
          <B2 small label="RESET" color={C2.dim} onClick={reset} />
        </div>
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C2.line}`, paddingTop: 18 }}>
          <R2 label="VELOCITY" value={`${s.v.toFixed(1)} m/s`} color={C2.gold} />
          <R2 label="a (SLOPE)" value={`${acc[mode]} m/s²`} color={C2.sage} />
        </div>
        <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>Switch modes mid-run — <span style={{ color: C2.ink }}>the slope of the trace IS the acceleration.</span></div>
      </div>
    </div>
  );
}

/* ───────── EQUATION PICKER (Day 8) ───────── */
function EquationPicker() {
  const [missing, setMissing] = useState('t');
  const eqs = [
    { id: 'x', tex: 'v = v₀ + at', omits: 'position (x)' },
    { id: 'v', tex: 'x = x₀ + v₀t + ½at²', omits: 'final velocity (v)' },
    { id: 't', tex: 'v² = v₀² + 2a(x − x₀)', omits: 'time (t)' },
  ];
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '36px 44px', display: 'flex', flexDirection: 'column', gap: 30, border: `1px solid ${C2.line}` }}>
      <div style={{ fontFamily: C2.mono, fontSize: 18, letterSpacing: '0.22em', color: C2.dim }}>WHAT DOES YOUR PROBLEM <span style={{ color: C2.gold }}>NOT</span> MENTION?</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <B2 label="NO POSITION" color={C2.lav} active={missing === 'x'} onClick={() => setMissing('x')} />
        <B2 label="NO FINAL VELOCITY" color={C2.sage} active={missing === 'v'} onClick={() => setMissing('v')} />
        <B2 label="NO TIME" color={C2.gold} active={missing === 't'} onClick={() => setMissing('t')} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {eqs.map((e) => (
          <div key={e.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 6, padding: '22px 32px',
            border: `2px solid ${missing === e.id ? C2.gold : C2.line}`, background: missing === e.id ? 'rgba(224,169,61,0.10)' : C2.panel,
            transition: 'all .2s',
          }}>
            <span style={{ fontFamily: C2.disp, fontSize: 36, fontWeight: 700, color: missing === e.id ? C2.ink : C2.dim }}>{e.tex}</span>
            <span style={{ fontFamily: C2.mono, fontSize: 16, color: missing === e.id ? C2.gold : C2.dim }}>{missing === e.id ? '→ REACH FOR THIS ONE' : `omits ${e.omits}`}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>Each equation omits exactly one variable. <span style={{ color: C2.ink }}>Find what's missing from GIVEN + ASKED — that names your equation.</span></div>
    </div>
  );
}

/* ───────── FBD BUILDER (Days 10 + 15) — toggle the arrows, check ───────── */
const FBD_SCENARIOS = {
  book:  { label: 'Book on a desk', answer: ['Fg', 'FN'] },
  box:   { label: 'Box pulled by rope, friction resists', answer: ['Fg', 'FN', 'FT', 'Ff'] },
  peak:  { label: 'Ball at the top of its arc', answer: ['Fg'] },
  space: { label: '2026-XJ in deep space', answer: ['Fg'] },
};
const FBD_FORCES = [
  { id: 'Fg', name: 'F_g gravity', dir: [0, 1], color: '#7FA68B' },
  { id: 'FN', name: 'F_N normal', dir: [0, -1], color: '#9B8EC4' },
  { id: 'FT', name: 'F_T tension', dir: [1, -0.15], color: '#B8C4DB' },
  { id: 'Ff', name: 'F_f friction', dir: [-1, 0], color: '#E0A93D' },
  { id: 'Fm', name: '"force of motion"', dir: [1, 0], color: '#D96A6A', trap: true },
  { id: 'Fp', name: '"momentum"', dir: [1, 0.3], color: '#D96A6A', trap: true },
];
function FBDBuilderSim({ scenario = 'book' }) {
  const [sc, setSc] = useState(scenario);
  const [on, setOn] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const toggle = (id) => { setVerdict(null); setOn((o) => o.includes(id) ? o.filter((x) => x !== id) : [...o, id]); };
  const check = () => {
    const ans = FBD_SCENARIOS[sc].answer;
    const missing = ans.filter((a) => !on.includes(a));
    const extra = on.filter((o) => !ans.includes(o));
    setVerdict(missing.length === 0 && extra.length === 0 ? { ok: true } : { ok: false, missing, extra });
  };
  const cx = 230, cy = 210, L = 130;
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', gap: 44, border: `1px solid ${C2.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 460 420" style={{ width: 420, flex: 'none' }}>
        <circle cx={cx} cy={cy} r={22} fill={C2.ink} />
        {FBD_FORCES.filter((f) => on.includes(f.id)).map((f) => {
          const nx = f.dir[0] / Math.hypot(...f.dir), ny = f.dir[1] / Math.hypot(...f.dir);
          const tx = cx + nx * L, ty = cy + ny * L;
          return (
            <g key={f.id}>
              <line x1={cx + nx * 26} y1={cy + ny * 26} x2={tx} y2={ty} stroke={f.color} strokeWidth={6} />
              <path d={`M ${tx + nx * 16} ${ty + ny * 16} l ${-nx * 22 - ny * 9} ${-ny * 22 + nx * 9} l ${18 * ny} ${-18 * nx} z`} fill={f.color} />
              <text x={tx + nx * 34} y={ty + ny * 34 + 6} textAnchor="middle" fontFamily={C2.mono} fontSize={17} fill={f.color}>{f.id}</text>
            </g>
          );
        })}
        <text x={cx} y={396} textAnchor="middle" fontFamily={C2.mono} fontSize={17} fill={C2.dim} letterSpacing="2">{FBD_SCENARIOS[sc].label.toUpperCase()}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
        <div style={{ fontFamily: C2.mono, fontSize: 17, letterSpacing: '0.22em', color: C2.dim }}>SCENARIO</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(FBD_SCENARIOS).map(([k, v]) => (
            <B2 key={k} small label={v.label.split(',')[0].toUpperCase()} color={C2.lav} active={sc === k} onClick={() => { setSc(k); setOn([]); setVerdict(null); }} />
          ))}
        </div>
        <div style={{ fontFamily: C2.mono, fontSize: 17, letterSpacing: '0.22em', color: C2.dim, marginTop: 6 }}>TOGGLE THE FORCES YOU BELIEVE IN</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {FBD_FORCES.map((f) => (
            <B2 key={f.id} small label={f.name.toUpperCase()} color={f.color} active={on.includes(f.id)} onClick={() => toggle(f.id)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', borderTop: `1px solid ${C2.line}`, paddingTop: 18 }}>
          <B2 label="CHECK" color={C2.gold} onClick={check} />
          {verdict && verdict.ok && <span style={{ fontFamily: C2.mono, fontSize: 18, color: C2.sage }}>✓ CLEAN DIAGRAM — every arrow earned its place.</span>}
          {verdict && !verdict.ok && (
            <span style={{ fontFamily: C2.mono, fontSize: 16, color: C2.gold, lineHeight: 1.5 }}>
              {verdict.missing.length > 0 && <span>MISSING: {verdict.missing.join(', ')} · </span>}
              {verdict.extra.length > 0 && <span>DOESN'T BELONG: {verdict.extra.join(', ')}</span>}
            </span>
          )}
        </div>
        <div style={{ fontFamily: C2.mono, fontSize: 14, color: C2.dim }}>Red chips are traps — defend the exclusion.</div>
      </div>
    </div>
  );
}

/* ───────── TUG-OF-WAR (Day 14) ───────── */
function TugOfWarSim() {
  const [pullA, setPullA] = useState(60);
  const [pullB, setPullB] = useState(60);
  const [gripA, setGripA] = useState(70);
  const [gripB, setGripB] = useState(40);
  const tension = Math.min(pullA, pullB) + Math.abs(pullA - pullB) * 0.5;
  const netExt = gripA - gripB;
  const drift = Math.max(-90, Math.min(90, netExt * 1.6));
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 26, border: `1px solid ${C2.line}` }}>
      <svg viewBox="0 0 900 190" style={{ width: '100%' }}>
        <line x1={80} y1={160} x2={820} y2={160} stroke={C2.line} strokeWidth={4} />
        <g transform={`translate(${drift} 0)`}>
          <line x1={230} y1={100} x2={670} y2={100} stroke={C2.gold} strokeWidth={5} />
          <circle cx={450} cy={100} r={10} fill={C2.ink} />
          <circle cx={200} cy={80} r={22} fill={C2.lav} />
          <line x1={200} y1={102} x2={200} y2={150} stroke={C2.lav} strokeWidth={7} />
          <circle cx={700} cy={80} r={22} fill={C2.sage} />
          <line x1={700} y1={102} x2={700} y2={150} stroke={C2.sage} strokeWidth={7} />
        </g>
        <line x1={450} y1={30} x2={450} y2={170} stroke={C2.dim} strokeWidth={2} strokeDasharray="8 8" />
        <text x={450} y={22} textAnchor="middle" fontFamily={C2.mono} fontSize={16} fill={C2.dim}>center line</text>
      </svg>
      <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
        <Sld label="A · PULL EFFORT" val={pullA} set={setPullA} min={10} max={100} unit="N" color={C2.lav} />
        <Sld label="B · PULL EFFORT" val={pullB} set={setPullB} min={10} max={100} unit="N" color={C2.sage} />
        <Sld label="A · FOOT FRICTION" val={gripA} set={setGripA} min={0} max={100} unit="" color={C2.lav} />
        <Sld label="B · FOOT FRICTION" val={gripB} set={setGripB} min={0} max={100} unit="" color={C2.sage} />
      </div>
      <div style={{ display: 'flex', gap: 44, alignItems: 'center', borderTop: `1px solid ${C2.line}`, paddingTop: 20, flexWrap: 'wrap' }}>
        <R2 label="SENSOR A READS" value={`${tension.toFixed(0)} N`} color={C2.lav} />
        <R2 label="SENSOR B READS" value={`${tension.toFixed(0)} N`} color={C2.sage} />
        <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6, flex: 1, minWidth: 320 }}>
          Crank either pull — the two sensors <span style={{ color: C2.ink }}>never disagree</span> (3rd Law). Who drifts across the line is decided by <span style={{ color: C2.gold }}>foot friction</span> — the external force.
        </div>
      </div>
    </div>
  );
}

/* ───────── INCLINE SIM (Day 16) ───────── */
function InclineSim() {
  const [deg, setDeg] = useState(25);
  const [mu, setMu] = useState(0.4);
  const th = deg * Math.PI / 180;
  const m = 5, g = 9.8;
  const along = m * g * Math.sin(th), into = m * g * Math.cos(th);
  const slides = Math.tan(th) > mu;
  const bx = 600, by = 340;
  const topY = by - Math.tan(th) * 520;
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', gap: 44, border: `1px solid ${C2.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 680 400" style={{ width: 560, flex: 'none' }}>
        <polygon points={`60,${by} 620,${by} 620,${Math.max(60, topY)}`} fill={C2.panel} stroke={C2.dim} strokeWidth={2.5} />
        <path d={`M 180 ${by} A 120 120 0 0 0 ${180 - 30 * Math.sin(th) * 2} ${by - 40 * Math.sin(th) * 2}`} stroke={C2.dim} strokeWidth={2} fill="none" />
        <text x={210} y={by - 14} fontFamily={C2.mono} fontSize={20} fill={C2.dim}>θ = {deg}°</text>
        {(() => {
          const mx = 340, my = by - Math.tan(th) * (620 - 340) * ((620 - 340) / 560) - 0; // approximate midpoint on slope
          const sx = 340, sy = by - Math.tan(th) * (sx - 60) * (560 / 560);
          const ux = Math.cos(th), uy = -Math.sin(th);      // up-slope unit
          const px2 = Math.sin(th), py2 = Math.cos(th);     // into-slope unit
          const cx2 = sx, cy2 = sy - 26;
          return (
            <g>
              <rect x={-46} y={-30} width={92} height={52} rx={6} fill="#262148" stroke={C2.lav} strokeWidth={2.5} transform={`translate(${cx2} ${cy2 - 14}) rotate(${-deg})`} />
              <line x1={cx2} y1={cy2} x2={cx2} y2={cy2 + 110} stroke={C2.sage} strokeWidth={5} />
              <path d={`M ${cx2} ${cy2 + 124} l -10 -20 l 20 0 z`} fill={C2.sage} />
              <text x={cx2 + 14} y={cy2 + 104} fontFamily={C2.mono} fontSize={18} fill={C2.sage}>mg</text>
              <line x1={cx2} y1={cy2} x2={cx2 - ux * along * 2.2} y2={cy2 - uy * along * 2.2} stroke={C2.gold} strokeWidth={5} />
              <text x={cx2 - ux * along * 2.2 - 10} y={cy2 - uy * along * 2.2 + 30} textAnchor="end" fontFamily={C2.mono} fontSize={18} fill={C2.gold}>mg·sinθ</text>
              <line x1={cx2} y1={cy2} x2={cx2 + px2 * into * 1.4} y2={cy2 + py2 * into * 1.4} stroke={C2.lav} strokeWidth={4} strokeDasharray="9 7" />
              <text x={cx2 + px2 * into * 1.4 + 8} y={cy2 + py2 * into * 1.4} fontFamily={C2.mono} fontSize={18} fill={C2.lav}>mg·cosθ</text>
            </g>
          );
        })()}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
        <Sld label="INCLINE ANGLE θ" val={deg} set={setDeg} min={0} max={60} unit="°" color={C2.gold} />
        <Sld label="STATIC μ" val={mu} set={setMu} min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)} color={C2.lav} />
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C2.line}`, paddingTop: 20, flexWrap: 'wrap' }}>
          <R2 label="ALONG · mg·sinθ" value={`${along.toFixed(1)} N`} color={C2.gold} />
          <R2 label="INTO · mg·cosθ" value={`${into.toFixed(1)} N`} color={C2.lav} />
          <R2 label="VERDICT" value={slides ? 'SLIDES' : 'HOLDS'} color={slides ? C2.gold : C2.sage} />
        </div>
        <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>
          Drag θ to 0° — the along-component dies (sin 0 = 0). Drag to 60° — it dominates. <span style={{ color: C2.ink }}>That's why along-incline is SINE.</span> It slides when tan θ &gt; μ.
        </div>
      </div>
    </div>
  );
}

/* ───────── FRICTION SIM (Day 17) — static grip, kinetic release ───────── */
function FrictionSim() {
  const [applied, setApplied] = useState(20);
  const [mass, setMass] = useState(5);
  const muS = 0.5, muK = 0.35, g = 9.8;
  const N = mass * g;
  const fsMax = muS * N, fk = muK * N;
  const moving = applied > fsMax;
  const friction = moving ? fk : applied;
  const a = moving ? (applied - fk) / mass : 0;
  const barMax = 80;
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', gap: 44, border: `1px solid ${C2.line}`, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-end', flex: 'none' }}>
        {[{ k: 'APPLIED', v: applied, c: C2.sage }, { k: 'FRICTION', v: friction, c: moving ? C2.gold : C2.lav }].map((b) => (
          <div key={b.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 76, height: 280, background: C2.panel, borderRadius: 4, border: `1px solid ${C2.line}`, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 280 * (1 - fsMax / barMax) - 1, borderTop: `2px dashed ${C2.gold}` }}></div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.min(1, b.v / barMax) * 280, background: b.c, transition: 'height .15s' }}></div>
            </div>
            <span style={{ fontFamily: C2.mono, fontSize: 15, color: C2.ink, letterSpacing: '0.12em' }}>{b.k}</span>
            <span style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim }}>{b.v.toFixed(1)} N</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
        <Sld label="APPLIED FORCE" val={applied} set={setApplied} min={0} max={60} unit="N" color={C2.sage} />
        <Sld label="MASS" val={mass} set={setMass} min={1} max={10} unit="kg" color={C2.lav} />
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C2.line}`, paddingTop: 20, flexWrap: 'wrap' }}>
          <R2 label="STATIC LIMIT μs·N" value={`${fsMax.toFixed(1)} N`} color={C2.gold} />
          <R2 label="STATUS" value={moving ? 'SLIDING' : 'STUCK'} color={moving ? C2.gold : C2.lav} />
          <R2 label="ACCELERATION" value={`${a.toFixed(2)} m/s²`} color={C2.sage} />
        </div>
        <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>
          Below the dashed line, friction <span style={{ color: C2.ink }}>mirrors your push exactly</span> — that's static. Cross it and friction drops to μk·N — <span style={{ color: C2.ink }}>starting is harder than keeping going.</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── ROPE SIM (Day 18) — two-rope tension vs angle ───────── */
function RopeSim() {
  const [deg, setDeg] = useState(45);
  const m = 5, g = 9.8;
  const th = Math.max(3, deg) * Math.PI / 180;
  const T = (m * g) / (2 * Math.sin(th));
  const cx = 300, cy = 250, span = 210;
  const ax = cx - span, ay = cy - Math.tan(th) * span;
  const bx = cx + span, by = ay;
  return (
    <div style={{ background: C2.bg, borderRadius: 8, padding: '32px 40px', display: 'flex', gap: 44, border: `1px solid ${C2.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 600 420" style={{ width: 480, flex: 'none' }}>
        <line x1={60} y1={Math.max(30, ay)} x2={540} y2={Math.max(30, ay)} stroke={C2.dim} strokeWidth={4} />
        <line x1={ax} y1={Math.max(30, ay)} x2={cx} y2={cy} stroke={C2.lav} strokeWidth={4.5} />
        <line x1={bx} y1={Math.max(30, by)} x2={cx} y2={cy} stroke={C2.lav} strokeWidth={4.5} />
        <rect x={cx - 34} y={cy} width={68} height={68} rx={8} fill="#262148" stroke={C2.ink} strokeWidth={2.5} />
        <text x={cx} y={cy + 42} textAnchor="middle" fontFamily={C2.mono} fontSize={19} fill={C2.ink}>5 kg</text>
        <text x={(ax + cx) / 2 - 20} y={(Math.max(30, ay) + cy) / 2 - 12} fontFamily={C2.mono} fontSize={20} fill={C2.lav}>T</text>
        <text x={(bx + cx) / 2 + 8} y={(Math.max(30, by) + cy) / 2 - 12} fontFamily={C2.mono} fontSize={20} fill={C2.lav}>T</text>
        <text x={cx} y={396} textAnchor="middle" fontFamily={C2.mono} fontSize={17} fill={C2.dim} letterSpacing="2">FLATTER ROPES → BIGGER T</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
        <Sld label="ROPE ANGLE FROM HORIZONTAL" val={deg} set={setDeg} min={5} max={85} unit="°" color={C2.gold} />
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C2.line}`, paddingTop: 20 }}>
          <R2 label="WEIGHT mg" value={`${(m * g).toFixed(0)} N`} color={C2.sage} />
          <R2 label="EACH ROPE'S TENSION" value={`${T.toFixed(0)} N`} color={T > 200 ? C2.gold : C2.lav} />
        </div>
        <div style={{ fontFamily: C2.disp, fontSize: 30, fontWeight: 700, color: C2.ink }}>T = mg / (2·sin θ)</div>
        <div style={{ fontFamily: C2.mono, fontSize: 15, color: C2.dim, lineHeight: 1.6 }}>
          Flatten the ropes toward 5° and watch T explode — <span style={{ color: C2.ink }}>the vertical components still have to carry all of mg.</span> ΣF = 0 in both directions, always.
        </div>
      </div>
    </div>
  );
}

module.exports = { WalkSim, WindowSim, AccelSim, EquationPicker, FBDBuilderSim, TugOfWarSim, InclineSim, FrictionSim, RopeSim };
