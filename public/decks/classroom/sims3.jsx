/* Interactive physics sims, wave 3 — CPA Physics Unit 1 */
const { useState, useRef, useEffect } = React;

const C3 = {
  bg: '#17142E', panel: '#1E1A38', line: '#2E2950', ink: '#FAF9FC',
  dim: '#8B87A6', lav: '#9B8EC4', sage: '#7FA68B', gold: '#E0A93D',
  mono: "'IBM Plex Mono', monospace", disp: "'Space Grotesk', sans-serif",
};
function B3({ label, onClick, color = C3.gold, active = false, disabled = false, small = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: C3.mono, fontSize: small ? 16 : 20, letterSpacing: '0.12em', cursor: disabled ? 'default' : 'pointer',
      padding: small ? '9px 16px' : '14px 26px', borderRadius: 4, border: `2px solid ${color}`,
      background: active ? color : 'transparent', color: active ? '#17142E' : color,
      opacity: disabled ? 0.35 : 1, fontWeight: 600, transition: 'all .15s',
    }}>{label}</button>
  );
}
function R3({ label, value, color = C3.ink }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: C3.mono, fontSize: 15, letterSpacing: '0.2em', color: C3.dim }}>{label}</span>
      <span style={{ fontFamily: C3.disp, fontSize: 30, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
function S3({ label, val, set, min, max, step = 1, unit = '', color = C3.gold, fmt, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 190, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C3.mono, fontSize: 16 }}>
        <span style={{ color: C3.dim, letterSpacing: '0.16em' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{fmt ? fmt(val) : `${val} ${unit}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} disabled={disabled} onChange={(e) => set(+e.target.value)} style={{ width: '100%', accentColor: color, height: 6 }} />
    </div>
  );
}

/* ───────── INERTIA PUSH (Day 1–2) — same shove, different mass ───────── */
const PUSH_OBJECTS = [
  { id: 'ball', label: 'SOCCER BALL', mass: 0.45, color: '#7FA68B' },
  { id: 'car', label: 'CAR', mass: 1500, color: '#9B8EC4' },
  { id: 'ship', label: 'CARGO SHIP', mass: 2e8, color: '#B8C4DB' },
  { id: 'ast', label: '2026-XJ', mass: 3.5e11, color: '#E0A93D' },
];
function InertiaPushSim() {
  const [obj, setObj] = useState('ball');
  const [pushed, setPushed] = useState(false);
  const [x, setX] = useState(0);
  const raf = useRef(null);
  const o = PUSH_OBJECTS.find((p) => p.id === obj);
  const impulse = 1000;                        // N·s — one hard human shove
  const dv = impulse / o.mass;                 // m/s gained
  const push = () => {
    cancelAnimationFrame(raf.current);
    setPushed(true); setX(0);
    const speed = Math.min(1, Math.log10(Math.max(1.2, dv * 1000)) / 6);  // visual scale
    const t0 = performance.now();
    const step = (now) => {
      const t = (now - t0) / 1000;
      const nx = Math.min(1, dv > 0.001 ? t * Math.max(0.02, speed) * 0.4 : t * 0.00002);
      setX(nx);
      if (nx < 1 && t < 6) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const reset = () => { cancelAnimationFrame(raf.current); setPushed(false); setX(0); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const fmtV = dv >= 1 ? `${dv.toFixed(1)} m/s` : dv >= 0.001 ? `${(dv * 100).toFixed(2)} cm/s` : `${(dv * 1e9).toFixed(1)} nm/s`;
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 24, border: `1px solid ${C3.line}` }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {PUSH_OBJECTS.map((p) => <B3 key={p.id} small label={p.label} color={p.color} active={obj === p.id} onClick={() => { setObj(p.id); reset(); }} />)}
        <B3 small label="⚡ SAME SHOVE (1000 N·s)" color={C3.gold} onClick={push} />
        <B3 small label="RESET" color={C3.dim} onClick={reset} />
      </div>
      <div style={{ position: 'relative', height: 120, background: C3.panel, borderRadius: 6, border: `1px solid ${C3.line}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 26, borderTop: `2px dashed ${C3.line}` }}></div>
        <div style={{ position: 'absolute', bottom: 34, left: `calc(60px + ${x * 100}% * 0.78)`, transition: 'none' }}>
          <div style={{ width: 74, height: 52, borderRadius: obj === 'ball' ? '50%' : 8, background: '#262148', border: `3px solid ${o.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: C3.mono, fontSize: 12, color: o.color }}>{o.mass >= 1e8 ? 'HUGE' : `${o.mass} kg`}</span>
          </div>
        </div>
        {pushed && x < 0.02 && obj === 'ast' && (
          <span style={{ position: 'absolute', right: 30, top: 18, fontFamily: C3.mono, fontSize: 16, color: C3.gold }}>…it barely notices.</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 44, alignItems: 'center', borderTop: `1px solid ${C3.line}`, paddingTop: 18, flexWrap: 'wrap' }}>
        <R3 label="MASS" value={o.mass >= 1e6 ? `${o.mass.toExponential(1)} kg` : `${o.mass} kg`} color={o.color} />
        <R3 label="VELOCITY GAINED" value={fmtV} color={C3.gold} />
        <div style={{ fontFamily: C3.mono, fontSize: 15, color: C3.dim, lineHeight: 1.6, flex: 1, minWidth: 300 }}>
          Same shove, four masses. <span style={{ color: C3.ink }}>Mass is resistance to a change in motion</span> — the asteroid gains nanometers per second.
        </div>
      </div>
    </div>
  );
}

/* ───────── SLOPE EXPLORER (Day 3) — drag t, read v from the tangent ───────── */
function SlopeExplorerSim() {
  const [u, setU] = useState(0.25);
  // piecewise story: walk away fast, pause, walk back slowly
  const pos = (t) => t < 0.35 ? t * 2.2 : t < 0.55 ? 0.77 : 0.77 - (t - 0.55) * 1.2;
  const vel = (t) => t < 0.35 ? 2.2 : t < 0.55 ? 0 : -1.2;
  const GX = 80, GY = 30, GW = 560, GH = 330;
  const px = (t) => GX + t * GW, py = (p) => GY + GH - p * GH;
  const pts = []; for (let i = 0; i <= 100; i++) pts.push(`${px(i / 100)},${py(pos(i / 100))}`);
  const v = vel(u), p0 = pos(u);
  const dx = 0.12;
  const x1 = px(u - dx), y1 = py(p0 - v * dx), x2 = px(u + dx), y2 = py(p0 + v * dx);
  const story = v > 0 ? 'moving AWAY — steady' : v < 0 ? 'coming BACK — slower' : 'STOPPED (flat ≠ constant speed!)';
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', gap: 44, border: `1px solid ${C3.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 700 400" style={{ width: 560, flex: 'none' }}>
        <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C3.dim} strokeWidth={2.5} />
        <line x1={GX} y1={GY + GH} x2={GX + GW + 20} y2={GY + GH} stroke={C3.dim} strokeWidth={2.5} />
        <text x={GX - 16} y={GY + 12} textAnchor="end" fontFamily={C3.mono} fontSize={20} fill={C3.dim}>x</text>
        <text x={GX + GW + 16} y={GY + GH + 30} textAnchor="end" fontFamily={C3.mono} fontSize={20} fill={C3.dim}>t</text>
        <polyline points={pts.join(' ')} fill="none" stroke={C3.lav} strokeWidth={4.5} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C3.gold} strokeWidth={4} />
        <circle cx={px(u)} cy={py(p0)} r={10} fill={C3.gold} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
        <S3 label="SLIDE ALONG TIME" val={u} set={setU} min={0.02} max={0.98} step={0.01} fmt={(x) => `t = ${(x * 10).toFixed(1)} s`} color={C3.gold} />
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C3.line}`, paddingTop: 18 }}>
          <R3 label="SLOPE = VELOCITY" value={`${v.toFixed(1)} m/s`} color={v === 0 ? C3.lav : C3.gold} />
        </div>
        <div style={{ fontFamily: C3.disp, fontSize: 26, fontWeight: 700, color: C3.ink }}>{story}</div>
        <div style={{ fontFamily: C3.mono, fontSize: 15, color: C3.dim, lineHeight: 1.6 }}>
          The gold tangent is the graph's <span style={{ color: C3.ink }}>claim at this instant</span>. Park on the flat part — what motion would falsify "stopped"?
        </div>
      </div>
    </div>
  );
}

/* ───────── TABLECLOTH (Day 9) — pull speed decides ───────── */
function TableclothSim() {
  const [speed, setSpeed] = useState(50);
  const [state, setState] = useState('idle');   // idle | pulling | done
  const [prog, setProg] = useState(0);
  const raf = useRef(null);
  const fast = speed > 60;
  const pull = () => {
    cancelAnimationFrame(raf.current);
    setState('pulling'); setProg(0);
    const dur = 1600 - speed * 14;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setProg(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setState('done');
    };
    raf.current = requestAnimationFrame(step);
  };
  const reset = () => { cancelAnimationFrame(raf.current); setState('idle'); setProg(0); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const clothX = prog * 420;
  const cupDrag = fast ? prog * 8 : prog * 300;
  const cupTip = !fast && prog > 0.6;
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 24, border: `1px solid ${C3.line}` }}>
      <svg viewBox="0 0 860 300" style={{ width: '100%', maxHeight: 300 }}>
        {/* table */}
        <rect x={120} y={200} width={420} height={16} fill="#3A3458" />
        <rect x={150} y={216} width={18} height={70} fill="#3A3458" />
        <rect x={480} y={216} width={18} height={70} fill="#3A3458" />
        {/* cloth */}
        <rect x={130 + clothX * 0.2} y={188} width={Math.max(0, 400 - clothX)} height={12} rx={3} fill={C3.lav} />
        {state !== 'idle' && <rect x={Math.min(560, 530 + clothX * 0.4)} y={190} width={90} height={10} rx={3} fill={C3.lav} transform={`rotate(${8 + prog * 30} 600 195)`} />}
        {/* cups */}
        <g transform={`translate(${cupDrag} 0) rotate(${cupTip ? 34 : 0} ${240} ${186})`}>
          <rect x={220} y={150} width={40} height={38} rx={4} fill="#262148" stroke={C3.sage} strokeWidth={2.5} />
        </g>
        <g transform={`translate(${cupDrag * 1.1} 0) rotate(${cupTip ? -28 : 0} ${330} ${186})`}>
          <rect x={310} y={150} width={40} height={38} rx={4} fill="#262148" stroke={C3.sage} strokeWidth={2.5} />
        </g>
        {/* hand */}
        <circle cx={Math.min(800, 580 + clothX * 0.5)} cy={196} r={16} fill={C3.gold} />
        {state === 'done' && (
          <text x={640} y={110} fontFamily={C3.mono} fontSize={22} fill={fast ? C3.sage : C3.gold}>{fast ? '✓ cups stay — inertia wins' : '✗ too slow — friction had time'}</text>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        <S3 label="PULL SPEED" val={speed} set={setSpeed} min={10} max={100} unit="%" color={C3.gold} />
        <B3 label="PULL!" color={C3.gold} onClick={pull} disabled={state === 'pulling'} />
        <B3 label="RESET" color={C3.dim} onClick={reset} />
        <div style={{ fontFamily: C3.mono, fontSize: 15, color: C3.dim, lineHeight: 1.6, flex: 1, minWidth: 300 }}>
          Fast pull: friction acts too briefly to move the cups — <span style={{ color: C3.ink }}>same physics as the bottom-string jerk.</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── DEFLECTION (Day 11–12) — F = ma at mission scale ───────── */
function DeflectionSim() {
  const [MN, setMN] = useState(1);
  const [months, setMonths] = useState(3);
  const m = 3.5e11;
  const a = (MN * 1e6) / m;                       // m/s²
  const tPush = months * 2.6e6;                   // s
  const dv = a * tPush;                           // m/s
  const tCoast = (6 - months / 2) * 2.6e6;        // remaining drift, rough
  const missKm = dv * tCoast / 1000;
  const hit = missKm < 6400;
  const deflect = Math.min(150, missKm / 100);
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 22, border: `1px solid ${C3.line}` }}>
      <svg viewBox="0 0 900 260" style={{ width: '100%', maxHeight: 260 }}>
        <circle cx={830} cy={120} r={34} fill="#22406B" stroke={C3.sage} strokeWidth={2.5} />
        <line x1={80} y1={200} x2={830} y2={124} stroke={C3.line} strokeWidth={2.5} strokeDasharray="10 8" />
        <line x1={80} y1={200} x2={820 - deflect * 0.4} y2={124 - deflect} stroke={C3.gold} strokeWidth={3} strokeDasharray="10 8" />
        <g transform="translate(80 200)">
          <path d="M -22 -7 L -11 -21 L 8 -22 L 22 -10 L 21 9 L 6 21 L -13 17 L -23 5 Z" fill="#3A3458" stroke={C3.gold} strokeWidth={2.5} />
        </g>
        <line x1={60} y1={240} x2={96} y2={214} stroke={C3.lav} strokeWidth={5} />
        <path d="M 104 208 l -20 -2 l 6 18 z" fill={C3.lav} />
        <text x={40} y={258} fontFamily={C3.mono} fontSize={17} fill={C3.lav}>push F</text>
        <text x={430} y={230} fontFamily={C3.mono} fontSize={17} fill={C3.dim}>original course</text>
        <text x={400} y={110} fontFamily={C3.mono} fontSize={17} fill={C3.gold}>deflected course</text>
        <text x={830} y={182} textAnchor="middle" fontFamily={C3.mono} fontSize={17} fill={C3.sage}>EARTH</text>
      </svg>
      <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
        <S3 label="THRUST" val={MN} set={setMN} min={0.1} max={10} step={0.1} fmt={(v) => `${v.toFixed(1)} MN`} color={C3.lav} />
        <S3 label="BURN DURATION" val={months} set={setMonths} min={0.5} max={6} step={0.5} fmt={(v) => `${v} mo`} color={C3.gold} />
      </div>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center', borderTop: `1px solid ${C3.line}`, paddingTop: 18, flexWrap: 'wrap' }}>
        <R3 label="a = F/m" value={`${a.toExponential(1)} m/s²`} color={C3.lav} />
        <R3 label="Δv GAINED" value={`${dv.toFixed(3)} m/s`} color={C3.gold} />
        <R3 label="MISS DISTANCE" value={`${Math.round(missKm).toLocaleString()} km`} color={hit ? '#D96A6A' : C3.sage} />
        <R3 label="VERDICT" value={hit ? 'IMPACT' : 'SAFE'} color={hit ? '#D96A6A' : C3.sage} />
        <div style={{ fontFamily: C3.mono, fontSize: 14, color: C3.dim, lineHeight: 1.6, flex: 1, minWidth: 280 }}>
          The acceleration is microscopic — but F = ma <span style={{ color: C3.ink }}>compounds over months</span>. Earth's radius ≈ 6,400 km: clear that and we live.
        </div>
      </div>
    </div>
  );
}

/* ───────── NET FORCE (Day 13) — arrows in, net out ───────── */
function NetForceSim() {
  const [app, setApp] = useState(30);
  const [fric, setFric] = useState(10);
  const [mass, setMass] = useState(5);
  const net = app - fric;
  const a = net / mass;
  const cx = 300, cy = 130;
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', gap: 44, border: `1px solid ${C3.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 620 280" style={{ width: 500, flex: 'none' }}>
        <line x1={40} y1={200} x2={580} y2={200} stroke={C3.line} strokeWidth={3} />
        <rect x={cx - 55} y={cy + 10} width={110} height={60} rx={6} fill="#262148" stroke={C3.lav} strokeWidth={2.5} />
        <text x={cx} y={cy + 47} textAnchor="middle" fontFamily={C3.mono} fontSize={18} fill={C3.ink}>{mass} kg</text>
        <line x1={cx + 55} y1={cy + 40} x2={cx + 55 + app * 3.4} y2={cy + 40} stroke={C3.sage} strokeWidth={6} />
        <path d={`M ${cx + 55 + app * 3.4 + 14} ${cy + 40} l -20 -9 l 0 18 z`} fill={C3.sage} />
        <text x={cx + 70} y={cy + 20} fontFamily={C3.mono} fontSize={17} fill={C3.sage}>applied {app} N</text>
        <line x1={cx - 55} y1={cy + 40} x2={cx - 55 - fric * 3.4} y2={cy + 40} stroke={C3.gold} strokeWidth={6} />
        <path d={`M ${cx - 55 - fric * 3.4 - 14} ${cy + 40} l 20 -9 l 0 18 z`} fill={C3.gold} />
        <text x={cx - 70} y={cy + 20} textAnchor="end" fontFamily={C3.mono} fontSize={17} fill={C3.gold}>friction {fric} N</text>
        {/* net */}
        <line x1={cx} y1={244} x2={cx + net * 3.4} y2={244} stroke={net >= 0 ? C3.lav : '#D96A6A'} strokeWidth={7} />
        {net !== 0 && <path d={`M ${cx + net * 3.4 + (net > 0 ? 16 : -16)} 244 l ${net > 0 ? -22 : 22} -10 l 0 20 z`} fill={net >= 0 ? C3.lav : '#D96A6A'} />}
        <text x={cx} y={272} textAnchor="middle" fontFamily={C3.mono} fontSize={17} fill={C3.lav}>NET {net} N</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
        <S3 label="APPLIED →" val={app} set={setApp} min={0} max={60} unit="N" color={C3.sage} />
        <S3 label="← FRICTION" val={fric} set={setFric} min={0} max={60} unit="N" color={C3.gold} />
        <S3 label="MASS" val={mass} set={setMass} min={1} max={10} unit="kg" color={C3.lav} />
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C3.line}`, paddingTop: 18 }}>
          <R3 label="NET FORCE" value={`${net} N`} color={net < 0 ? '#D96A6A' : C3.lav} />
          <R3 label="a = F_net/m" value={`${a.toFixed(2)} m/s²`} color={C3.sage} />
        </div>
        <div style={{ fontFamily: C3.mono, fontSize: 14, color: C3.dim, lineHeight: 1.6 }}>Crank friction past applied — <span style={{ color: C3.ink }}>the net flips sign.</span> Only NET goes in F = ma.</div>
      </div>
    </div>
  );
}

/* ───────── SELF-ASSESS BOARD (Day 19) ───────── */
const TARGETS = ['Vectors & components', 'Position prediction', 'Acceleration & equations', 'Newton\u2019s laws', 'FBDs & net force', 'Friction & equilibrium'];
function SelfAssessSim() {
  const [scores, setScores] = useState(Array(TARGETS.length).fill(null));
  const setScore = (i, v) => setScores((s) => s.map((x, j) => j === i ? v : x));
  const rated = scores.filter((s) => s !== null);
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;
  const ready = rated.length === TARGETS.length;
  const weakest = ready ? TARGETS[scores.indexOf(Math.min(...scores))] : null;
  const cols = [C3.dim, '#D96A6A', C3.gold, C3.lav, C3.sage];
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 20, border: `1px solid ${C3.line}` }}>
      {TARGETS.map((t, i) => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 20, borderBottom: i < TARGETS.length - 1 ? `1px solid ${C3.line}` : 'none', paddingBottom: 14 }}>
          <span style={{ fontFamily: C3.mono, fontSize: 17, color: C3.ink, flex: 1 }}>{t}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2, 3, 4].map((v) => (
              <button key={v} onClick={() => setScore(i, v)} style={{
                fontFamily: C3.disp, fontSize: 20, fontWeight: 700, width: 46, height: 46, borderRadius: 6, cursor: 'pointer',
                border: `2px solid ${scores[i] === v ? cols[v] : C3.line}`,
                background: scores[i] === v ? cols[v] : 'transparent',
                color: scores[i] === v ? '#17142E' : C3.dim,
              }}>{v}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 36, alignItems: 'center', paddingTop: 6, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontFamily: C3.mono, fontSize: 14, letterSpacing: '0.2em', color: C3.dim, marginBottom: 8 }}>MISSION READINESS</div>
          <div style={{ height: 18, background: C3.panel, borderRadius: 9, border: `1px solid ${C3.line}`, overflow: 'hidden' }}>
            <div style={{ width: `${(avg / 4) * 100}%`, height: '100%', background: avg >= 3 ? C3.sage : avg >= 2 ? C3.gold : '#D96A6A', transition: 'width .3s' }}></div>
          </div>
        </div>
        <R3 label="AVG" value={rated.length ? avg.toFixed(1) : '—'} color={avg >= 3 ? C3.sage : C3.gold} />
        <div style={{ fontFamily: C3.mono, fontSize: 15, color: C3.dim, lineHeight: 1.6, minWidth: 300, flex: 1 }}>
          {ready ? <span>Weakest: <span style={{ color: C3.gold }}>{weakest}</span> — that's your workshop pick.</span> : <span>Rate every target — <span style={{ color: C3.ink }}>honestly</span>. An inflated 4 today is a real 2 on the task.</span>}
        </div>
      </div>
    </div>
  );
}

/* ───────── TIP-TO-TAIL (Day 6) — build the resultant in three steps ───────── */
function TipToTailSim() {
  const [magA, setMagA] = useState(8210);
  const [magB, setMagB] = useState(2200);
  const [angB, setAngB] = useState(90);      // degrees from A's direction
  const [step, setStep] = useState(1);       // 1 draw A · 2 slide B to tip · 3 resultant
  const [slide, setSlide] = useState(0);     // 0 = B at origin, 1 = B at A's tip
  const raf = useRef(null);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const goStep = (s) => {
    setStep(s);
    cancelAnimationFrame(raf.current);
    if (s < 2) { setSlide(0); return; }
    const from = slide, to = 1, t0 = performance.now();
    const anim = (now) => {
      const t = Math.min(1, (now - t0) / 500);
      setSlide(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf.current = requestAnimationFrame(anim);
    };
    raf.current = requestAnimationFrame(anim);
  };
  const rad = (angB * Math.PI) / 180;
  const needW = Math.max(magA, magA + magB * Math.cos(rad)) + 800;
  const needH = Math.max(1500, magB * Math.sin(rad) + 600);
  const scale = Math.min(470 / needW, 280 / needH, 0.055);
  const ax = magA * scale, ay = 0;
  const bx = magB * Math.cos(rad) * scale, by = -magB * Math.sin(rad) * scale;
  const Rx = magA + magB * Math.cos(rad), Ry = magB * Math.sin(rad);
  const magR = Math.sqrt(Rx * Rx + Ry * Ry);
  const O = { x: 110, y: 330 };
  const bStart = { x: O.x + ax * slide, y: O.y + ay * slide };
  const tip = { x: O.x + ax + bx, y: O.y + ay + by };
  const Arrow = ({ x1, y1, x2, y2, color, w = 6, dash }) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 16;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />
        <path d={`M ${x2 + Math.cos(a) * h} ${y2 + Math.sin(a) * h} L ${x2 + Math.cos(a + 2.5) * h} ${y2 + Math.sin(a + 2.5) * h} L ${x2 + Math.cos(a - 2.5) * h} ${y2 + Math.sin(a - 2.5) * h} Z`} fill={color} />
      </g>
    );
  };
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '26px 40px', display: 'flex', flexDirection: 'column', gap: 20, border: `1px solid ${C3.line}` }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <B3 small label="01 · DRAW A" color={C3.sage} active={step === 1} onClick={() => goStep(1)} />
        <B3 small label="02 · B TO A's TIP" color={C3.lav} active={step === 2} onClick={() => goStep(2)} />
        <B3 small label="03 · RESULTANT" color={C3.gold} active={step === 3} onClick={() => goStep(3)} />
      </div>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <svg viewBox="0 0 640 400" style={{ width: 580, flex: 'none', background: C3.panel, borderRadius: 6, border: `1px solid ${C3.line}` }}>
          <circle cx={O.x} cy={O.y} r={6} fill={C3.dim} />
          <text x={O.x - 14} y={O.y + 30} fontFamily={C3.mono} fontSize={16} fill={C3.dim}>start</text>
          <Arrow x1={O.x} y1={O.y} x2={O.x + ax} y2={O.y + ay} color={C3.sage} />
          <text x={O.x + ax / 2 - 20} y={O.y + 34} fontFamily={C3.mono} fontSize={18} fill={C3.sage}>A</text>
          <Arrow x1={bStart.x} y1={bStart.y} x2={bStart.x + bx} y2={bStart.y + by} color={C3.lav} />
          <text x={bStart.x + bx + 14} y={bStart.y + by / 2} fontFamily={C3.mono} fontSize={18} fill={C3.lav}>B</text>
          {step >= 3 && (
            <g>
              <Arrow x1={O.x} y1={O.y} x2={tip.x} y2={tip.y} color={C3.gold} w={7} />
              <text x={(O.x + tip.x) / 2 - 60} y={(O.y + tip.y) / 2 - 18} fontFamily={C3.mono} fontSize={18} fill={C3.gold}>A + B</text>
            </g>
          )}
          {step === 2 && slide >= 1 && (
            <text x={bStart.x + 12} y={bStart.y - 12} fontFamily={C3.mono} fontSize={15} fill={C3.lav}>tail of B on tip of A</text>
          )}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <S3 label="|A| (m/s)" val={magA} set={(v) => { setMagA(v); }} min={2000} max={10000} step={10} color={C3.sage} fmt={(v) => `${v.toLocaleString()}`} />
          <S3 label="|B| (m/s)" val={magB} set={(v) => { setMagB(v); }} min={500} max={6000} step={10} color={C3.lav} fmt={(v) => `${v.toLocaleString()}`} />
          <S3 label="B's ANGLE FROM A" val={angB} set={setAngB} min={0} max={180} step={1} unit="°" color={C3.gold} />
          <div style={{ display: 'flex', gap: 36, borderTop: `1px solid ${C3.line}`, paddingTop: 16 }}>
            <R3 label="|A + B|" value={step >= 3 ? `${Math.round(magR).toLocaleString()} m/s` : '— run step 03 —'} color={C3.gold} />
          </div>
          <div style={{ fontFamily: C3.mono, fontSize: 15, color: C3.dim, lineHeight: 1.6 }}>
            {step === 1 && <span>Two vectors, one start point. You <span style={{ color: C3.ink }}>cannot</span> just add the numbers — try it: {magA.toLocaleString()} + {magB.toLocaleString()} ≠ the resultant unless θ = 0°.</span>}
            {step === 2 && <span>Slide B — <span style={{ color: C3.ink }}>without rotating it</span> — until its tail sits on A's tip. Same vector, new address.</span>}
            {step === 3 && <span>The resultant runs <span style={{ color: C3.ink }}>start → finish</span>. Set θ = 90° and check it against Pythagoras: √(A² + B²).</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── AREA UNDER v-t (Day 4) — area IS displacement ───────── */
function AreaSim() {
  const [t, setT] = useState(5);
  const T1 = 4, T2 = 8, VMAX = 20;                    // accelerate 0→20 over 4 s, cruise to 8 s
  const v = (x) => x < T1 ? (VMAX * x) / T1 : VMAX;
  const disp = (x) => x < T1 ? (VMAX * x * x) / (2 * T1) : (VMAX * T1) / 2 + VMAX * (x - T1);
  const GX = 80, GY = 40, GW = 520, GH = 280;
  const px = (x) => GX + (x / T2) * GW, py = (y) => GY + GH - (y / VMAX) * GH;
  const poly = [`${px(0)},${py(0)}`];
  for (let i = 0; i <= 60; i++) { const x = (t * i) / 60; poly.push(`${px(x)},${py(v(x))}`); }
  poly.push(`${px(t)},${py(0)}`);
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '28px 40px', display: 'flex', gap: 44, border: `1px solid ${C3.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 660 380" style={{ width: 560, flex: 'none' }}>
        <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C3.dim} strokeWidth={2.5} />
        <line x1={GX} y1={GY + GH} x2={GX + GW + 30} y2={GY + GH} stroke={C3.dim} strokeWidth={2.5} />
        <text x={GX - 14} y={GY + 10} textAnchor="end" fontFamily={C3.mono} fontSize={20} fill={C3.dim}>v</text>
        <text x={GX + GW + 26} y={GY + GH + 30} textAnchor="end" fontFamily={C3.mono} fontSize={20} fill={C3.dim}>t</text>
        <polygon points={poly.join(' ')} fill="rgba(224,169,61,0.28)" stroke="none" />
        <polyline points={`${px(0)},${py(0)} ${px(T1)},${py(VMAX)} ${px(T2)},${py(VMAX)}`} fill="none" stroke={C3.lav} strokeWidth={5} strokeLinecap="round" />
        <line x1={px(t)} y1={GY + GH} x2={px(t)} y2={py(v(t))} stroke={C3.gold} strokeWidth={3} strokeDasharray="6 6" />
        <circle cx={px(t)} cy={py(v(t))} r={9} fill={C3.gold} />
        <text x={px(t)} y={GY + GH + 30} textAnchor="middle" fontFamily={C3.mono} fontSize={19} fill={C3.gold}>{t.toFixed(1)} s</text>
        <text x={px(1.6)} y={py(4.5)} fontFamily={C3.mono} fontSize={18} fill="#C08F2E">area = Δx</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
        <S3 label="TIME" val={t} set={setT} min={0} max={8} step={0.1} unit="s" color={C3.gold} fmt={(x) => `${x.toFixed(1)} s`} />
        <div style={{ display: 'flex', gap: 40, borderTop: `1px solid ${C3.line}`, paddingTop: 18, flexWrap: 'wrap' }}>
          <R3 label="v NOW" value={`${v(t).toFixed(1)} m/s`} color={C3.lav} />
          <R3 label="AREA SO FAR" value={`${disp(t).toFixed(0)} m`} color={C3.gold} />
        </div>
        <div style={{ fontFamily: C3.mono, fontSize: 15, color: C3.dim, lineHeight: 1.65 }}>
          {t <= T1
            ? <span>Speeding up: the area grows as a <span style={{ color: C3.ink }}>triangle</span> — displacement climbs slowly at first, then faster.</span>
            : <span>Cruising: each second now adds the <span style={{ color: C3.ink }}>same rectangle</span> of area — {VMAX} m per second.</span>}
          {' '}The area under a v-t graph <span style={{ color: C3.gold }}>IS the displacement</span> — even while v changes.
        </div>
      </div>
    </div>
  );
}

/* ───────── REARRANGE FIRST (Day 8) — choose the next algebra move ───────── */
function RearrangeSim() {
  const [stage, setStage] = useState(0);   // 0 start · 1 subtracted · 2 isolated · 3 substituted
  const [msg, setMsg] = useState(null);    // {text, bad}
  const eq = [
    <span>v² = v₀² + 2a<span style={{ color: C3.gold }}>?</span>Δx — wait, a is buried</span>,
    null, null, null,
  ];
  const eqText = [
    ['v² = v₀² + 2aΔx'],
    ['v² − v₀² = 2aΔx'],
    ['a = (v² − v₀²) / 2Δx'],
    ['a = (0² − 30²) / (2 · 90 m)', 'a = −900 / 180 = −5 m/s²'],
  ];
  const move = (m) => {
    if (m === 'sub') {
      if (stage === 0) { setStage(1); setMsg({ text: 'v₀² is out of the way. a is still multiplied by 2Δx.', bad: false }); }
      else setMsg({ text: 'Nothing left to subtract — v₀² is already across.', bad: true });
    } else if (m === 'div') {
      if (stage === 1) { setStage(2); setMsg({ text: 'a is ALONE — and you never touched a number. This line now solves EVERY problem of this shape.', bad: false }); }
      else if (stage === 0) setMsg({ text: 'That divides v₀² too — get it out of the way first.', bad: true });
      else setMsg({ text: 'Already divided.', bad: true });
    } else if (m === 'num') {
      if (stage === 2) { setStage(3); setMsg({ text: 'Numbers went in LAST — with units. Braking car: v₀ = 30 m/s, v = 0, Δx = 90 m.', bad: false }); }
      else setMsg({ text: '🚫 Numbers went in too early — that is the plug-and-chug trap. Isolate a first.', bad: true });
    }
  };
  const reset = () => { setStage(0); setMsg(null); };
  return (
    <div style={{ background: C3.bg, borderRadius: 8, padding: '30px 44px', display: 'flex', flexDirection: 'column', gap: 24, border: `1px solid ${C3.line}` }}>
      <div style={{ fontFamily: C3.mono, fontSize: 16, letterSpacing: '0.22em', color: C3.dim }}>SOLVE FOR a — BRAKING CAR, BUT SYMBOLS FIRST</div>
      <div style={{ background: C3.panel, border: `1px solid ${C3.line}`, borderRadius: 6, padding: '30px 40px', minHeight: 120, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
        {eqText[stage].map((line, i) => (
          <div key={i} style={{ fontFamily: C3.mono, fontSize: 34, fontWeight: 600, color: i === eqText[stage].length - 1 && stage >= 2 ? C3.gold : C3.ink }}>{line}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <B3 label="− v₀² BOTH SIDES" color={C3.sage} active={stage >= 1} onClick={() => move('sub')} />
        <B3 label="÷ 2Δx BOTH SIDES" color={C3.lav} active={stage >= 2} onClick={() => move('div')} />
        <B3 label="SUBSTITUTE NUMBERS" color={C3.gold} active={stage >= 3} onClick={() => move('num')} />
        <B3 label="RESET" color={C3.dim} onClick={reset} />
      </div>
      <div style={{ fontFamily: C3.mono, fontSize: 16, lineHeight: 1.6, minHeight: 28, color: msg ? (msg.bad ? '#D96A6A' : C3.sage) : C3.dim }}>
        {msg ? msg.text : 'Pick the next legal move. Hint: no numbers may enter until a is alone.'}
      </div>
    </div>
  );
}

/* ───────── LINEARIZE (Day 11–12) — toggle the axis, find the law ───────── */
const LIN_DATA = [0.5, 1, 2, 4].map((m) => ({ m, a: 4 / m }));   // F = 4.0 N
function LinearizeSim() {
  const [lin, setLin] = useState(0);        // 0 = a vs m · 1 = a vs 1/m
  const [u, setU] = useState(0);            // animated 0→1
  const raf = useRef(null);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const toggle = (target) => {
    setLin(target);
    cancelAnimationFrame(raf.current);
    const from = u, t0 = performance.now();
    const anim = (now) => {
      const t = Math.min(1, (now - t0) / 600);
      setU(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf.current = requestAnimationFrame(anim);
    };
    raf.current = requestAnimationFrame(anim);
  };
  const GX = 70, GY = 26, GW = 480, GH = 300;
  const xm = (m) => GX + (m / 4.4) * GW;                 // m axis: 0..4.4 kg
  const xi = (m) => GX + ((1 / m) / 2.2) * GW;           // 1/m axis: 0..2.2
  const py = (a) => GY + GH - (a / 8.8) * GH;            // a: 0..8.8
  const X = (m) => xm(m) + (xi(m) - xm(m)) * u;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontFamily: C3.mono, fontSize: 17, letterSpacing: '0.2em', color: C3.dim }}>X-AXIS:</span>
        <B3 small label="MASS m" color={C3.lav} active={lin === 0} onClick={() => toggle(0)} />
        <B3 small label="1/m" color={C3.gold} active={lin === 1} onClick={() => toggle(1)} />
      </div>
      <svg viewBox="0 0 600 360" style={{ width: '100%' }}>
        <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C3.dim} strokeWidth={2.5} />
        <line x1={GX} y1={GY + GH} x2={GX + GW + 30} y2={GY + GH} stroke={C3.dim} strokeWidth={2.5} />
        <text x={GX - 14} y={GY + 10} textAnchor="end" fontFamily={C3.mono} fontSize={22} fill={C3.dim}>a</text>
        <text x={GX + GW + 26} y={GY + GH + 32} textAnchor="end" fontFamily={C3.mono} fontSize={22} fill={C3.dim}>{u > 0.5 ? '1/m' : 'm'}</text>
        {u > 0.65 && <line x1={GX} y1={GY + GH} x2={xi(0.5)} y2={py(8)} stroke={C3.gold} strokeWidth={3.5} opacity={(u - 0.65) / 0.35} />}
        {LIN_DATA.map((d, i) => <circle key={i} cx={X(d.m)} cy={py(d.a)} r={9} fill={u > 0.5 ? '#FAF9FC' : C3.lav} stroke={u > 0.5 ? C3.gold : 'none'} strokeWidth={2.5} />)}
        <text x={GX + GW - 6} y={py(7.2)} textAnchor="end" fontFamily={C3.mono} fontSize={21} fill={lin === 1 ? C3.gold : '#7A75A0'}>
          {lin === 1 ? 'a line! slope = F = 4.0 N' : 'a curve — no readable law'}
        </text>
      </svg>
    </div>
  );
}

module.exports = { InertiaPushSim, SlopeExplorerSim, TableclothSim, DeflectionSim, NetForceSim, SelfAssessSim, TipToTailSim, AreaSim, RearrangeSim, LinearizeSim };
