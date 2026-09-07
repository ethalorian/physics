/* Interactive physics sims — CPA Physics Unit 1 · dark instrument-panel style */
const { useState, useRef, useEffect, useCallback } = React;

const C = {
  bg: '#17142E', panel: '#1E1A38', line: '#2E2950', ink: '#FAF9FC',
  dim: '#8B87A6', lav: '#9B8EC4', sage: '#7FA68B', gold: '#E0A93D',
  mono: "'IBM Plex Mono', monospace", disp: "'Space Grotesk', sans-serif",
};

function Btn({ label, onClick, color = C.gold, active = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: C.mono, fontSize: 20, letterSpacing: '0.14em', cursor: disabled ? 'default' : 'pointer',
      padding: '14px 26px', borderRadius: 4, border: `2px solid ${color}`,
      background: active ? color : 'transparent', color: active ? '#17142E' : color,
      opacity: disabled ? 0.35 : 1, fontWeight: 600, transition: 'all .15s',
    }}>{label}</button>
  );
}

function Readout({ label, value, color = C.ink }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: C.mono, fontSize: 16, letterSpacing: '0.2em', color: C.dim }}>{label}</span>
      <span style={{ fontFamily: C.disp, fontSize: 34, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

/* ───────────────────────── TWO-STRING SIM ───────────────────────── */
function TwoStringSim() {
  // phase: idle | pulling | snapped
  const [mode, setMode] = useState(null);        // 'slow' | 'jerk'
  const [t, setT] = useState(0);                 // 0..1 progress
  const [snapped, setSnapped] = useState(null);  // 'top' | 'bottom'
  const raf = useRef(null);

  const run = (m) => {
    cancelAnimationFrame(raf.current);
    setMode(m); setSnapped(null); setT(0);
    const dur = m === 'slow' ? 2600 : 380;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setT(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setSnapped(m === 'slow' ? 'top' : 'bottom');
    };
    raf.current = requestAnimationFrame(step);
  };
  const reset = () => { cancelAnimationFrame(raf.current); setMode(null); setT(0); setSnapped(null); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // geometry
  const cx = 300;
  const pull = mode ? t : 0;
  const blockDrop = mode === 'slow' ? pull * 26 : pull * 3;          // inertia: barely moves on jerk
  const handleDrop = mode === 'jerk' ? pull * 90 : pull * 30;
  const blockY = 190 + blockDrop;
  const handleY = 470 + handleDrop;
  // tensions (relative)
  const weight = 0.45;
  const pullF = mode === 'slow' ? pull * 0.55 : (pull < 1 ? pull * 1.05 : 1.05);
  const topT = snapped === 'top' ? 0 : mode === 'jerk' ? weight + pullF * 0.18 : weight + pullF;
  const botT = snapped === 'bottom' ? 0 : pullF;
  const barH = 250;
  const breakLine = 0.92;

  const stringColor = (v) => v > 0.85 ? C.gold : v > 0.6 ? '#C9B06A' : C.lav;

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: '36px 44px', display: 'flex', gap: 48, alignItems: 'stretch', border: `1px solid ${C.line}` }}>
      <svg viewBox="0 0 600 660" style={{ width: 480, flex: 'none' }}>
        {/* ceiling */}
        <line x1={140} y1={60} x2={460} y2={60} stroke={C.ink} strokeWidth={5} />
        {[...Array(9)].map((_, i) => (
          <line key={i} x1={160 + i * 36} y1={60} x2={144 + i * 36} y2={38} stroke={C.dim} strokeWidth={3} />
        ))}
        {/* top string */}
        {snapped === 'top' ? (
          <g>
            <path d={`M ${cx} 60 q -8 30 4 52`} stroke={C.gold} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <path d={`M ${cx} ${blockY - 10} q 10 -26 -2 -44`} stroke={C.gold} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <text x={cx + 46} y={120} fontFamily={C.mono} fontSize={22} fill={C.gold} letterSpacing="2">SNAP!</text>
          </g>
        ) : (
          <line x1={cx} y1={60} x2={cx} y2={blockY} stroke={stringColor(topT)} strokeWidth={3.5} />
        )}
        {/* block */}
        <g transform={`translate(0 ${snapped === 'top' ? 40 : 0})`} style={{ transition: 'transform .5s cubic-bezier(.5,0,1,1)' }}>
          <rect x={cx - 85} y={blockY} width={170} height={120} rx={6} fill="#262148" stroke={C.lav} strokeWidth={2.5} />
          <text x={cx} y={blockY + 58} textAnchor="middle" fontFamily={C.disp} fontSize={34} fontWeight="700" fill={C.ink}>HEAVY</text>
          <text x={cx} y={blockY + 94} textAnchor="middle" fontFamily={C.mono} fontSize={20} fill={C.dim}>m = large</text>
        </g>
        {/* bottom string */}
        {snapped === 'bottom' ? (
          <g>
            <path d={`M ${cx} ${blockY + 122} q 10 26 -4 46`} stroke={C.gold} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <path d={`M ${cx} ${handleY - 8} q -12 -24 2 -40`} stroke={C.gold} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <text x={cx + 46} y={blockY + 175} fontFamily={C.mono} fontSize={22} fill={C.gold} letterSpacing="2">SNAP!</text>
          </g>
        ) : (
          <line x1={cx} y1={blockY + 120} x2={cx} y2={handleY} stroke={stringColor(botT)} strokeWidth={3.5} />
        )}
        {/* handle */}
        <g transform={snapped === 'bottom' ? 'translate(0 70)' : ''} style={{ transition: 'transform .35s cubic-bezier(.5,0,1,1)' }}>
          <rect x={cx - 60} y={handleY} width={120} height={16} rx={8} fill={C.ink} />
        </g>
        {/* pull arrow */}
        {mode && !snapped && (
          <g>
            <line x1={cx + 110} y1={handleY - 30} x2={cx + 110} y2={handleY + 60} stroke={C.gold} strokeWidth={5} />
            <path d={`M ${cx + 110} ${handleY + 78} l -12 -20 l 24 0 z`} fill={C.gold} />
            <text x={cx + 132} y={handleY + 30} fontFamily={C.mono} fontSize={22} fill={C.gold}>{mode === 'slow' ? 'slow pull' : 'JERK'}</text>
          </g>
        )}
        {/* labels */}
        <text x={cx - 105} y={130} textAnchor="end" fontFamily={C.mono} fontSize={20} fill={C.dim}>top string</text>
        <text x={cx - 105} y={blockY + 160} textAnchor="end" fontFamily={C.mono} fontSize={20} fill={C.dim}>bottom string</text>
      </svg>

      {/* tension meters + controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, flex: 1, justifyContent: 'center' }}>
        <div style={{ fontFamily: C.mono, fontSize: 18, letterSpacing: '0.24em', color: C.dim }}>STRING TENSION</div>
        <div style={{ display: 'flex', gap: 44, alignItems: 'flex-end' }}>
          {[{ k: 'TOP', v: topT, note: 'feels pull + weight' }, { k: 'BOTTOM', v: botT, note: 'feels pull only' }].map((b) => (
            <div key={b.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 74, height: barH, background: C.panel, borderRadius: 4, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: barH * (1 - breakLine) - 1, borderTop: `2px dashed ${C.gold}` }}></div>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.min(1, b.v) * barH, background: b.v > 0.85 ? C.gold : C.lav, transition: 'height .1s linear' }}></div>
              </div>
              <span style={{ fontFamily: C.mono, fontSize: 18, color: C.ink, letterSpacing: '0.16em' }}>{b.k}</span>
              <span style={{ fontFamily: C.mono, fontSize: 14, color: C.dim, textAlign: 'center', width: 130 }}>{b.note}</span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 15, color: C.dim, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 18 }}>
          {snapped === 'top' && <span style={{ color: C.ink }}>Slow pull: the top string carries pull <em>plus</em> the block's weight — it reaches breaking first.</span>}
          {snapped === 'bottom' && <span style={{ color: C.ink }}>Jerk: the bottom string hits breaking before the block's inertia lets it move — the force never reaches the top.</span>}
          {!snapped && !mode && <span>Dashed line = breaking tension. Choose a pull.</span>}
          {!snapped && mode && <span>watching tension build…</span>}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Btn label="SLOW PULL" color={C.sage} onClick={() => run('slow')} active={mode === 'slow' && !snapped} />
          <Btn label="SHARP JERK" color={C.gold} onClick={() => run('jerk')} active={mode === 'jerk' && !snapped} />
          <Btn label="RESET" color={C.dim} onClick={reset} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── GRAPH-MATCH SIM ───────────────────────── */
const STORIES = {
  A: { label: 'A', desc: 'starts near, walks away — steady', fn: (u) => u },
  B: { label: 'B', desc: 'starts far, stands still', fn: () => 0.78 },
  C: { label: 'C', desc: 'walks away, stops, comes back', fn: (u) => u < 0.4 ? u * 2 : u < 0.6 ? 0.8 : 0.8 - (u - 0.6) * 2 },
};
function GraphMatchSim() {
  const [pick, setPick] = useState('A');
  const [u, setU] = useState(0);       // 0..1 time
  const [playing, setPlaying] = useState(false);
  const raf = useRef(null);

  const play = () => {
    cancelAnimationFrame(raf.current);
    setPlaying(true);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 5000);
      setU(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { cancelAnimationFrame(raf.current); setU(0); setPlaying(false); }, [pick]);

  const story = STORIES[pick];
  const startPos = pick === 'B' ? 0.78 : 0;
  const pos = u === 0 ? startPos : story.fn(u);

  // graph geometry
  const GX = 70, GY = 30, GW = 380, GH = 300;
  const px = (uu) => GX + uu * GW;
  const py = (p) => GY + GH - p * GH;
  const pathPts = [];
  for (let i = 0; i <= 100; i++) { const uu = i / 100; pathPts.push(`${px(uu)},${py(STORIES[pick].fn(uu) || (pick==='B'?0.78:0))}`); }
  const traceN = Math.round(u * 100);
  const tracePts = pathPts.slice(0, Math.max(1, traceN + 1));

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: '36px 44px', display: 'flex', flexDirection: 'column', gap: 30, border: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', gap: 40 }}>
        {/* graph */}
        <svg viewBox="0 0 480 380" style={{ width: 460, flex: 'none' }}>
          <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C.dim} strokeWidth={2.5} />
          <line x1={GX} y1={GY + GH} x2={GX + GW + 20} y2={GY + GH} stroke={C.dim} strokeWidth={2.5} />
          <text x={GX - 16} y={GY + 10} textAnchor="end" fontFamily={C.mono} fontSize={20} fill={C.dim}>x</text>
          <text x={GX + GW + 18} y={GY + GH + 34} textAnchor="end" fontFamily={C.mono} fontSize={20} fill={C.dim}>t</text>
          <text x={GX - 14} y={GY + GH + 8} textAnchor="end" fontFamily={C.mono} fontSize={20} fill={C.dim}>O</text>
          {/* faint full path */}
          <polyline points={pathPts.join(' ')} fill="none" stroke={C.line} strokeWidth={3} />
          {/* live trace */}
          <polyline points={tracePts.join(' ')} fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
          <circle cx={px(u)} cy={py(pos)} r={9} fill={C.gold} />
        </svg>
        {/* walker track */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 }}>
          <div style={{ fontFamily: C.mono, fontSize: 18, letterSpacing: '0.24em', color: C.dim }}>THE MOTION IT CLAIMS</div>
          <div style={{ position: 'relative', height: 110, background: C.panel, borderRadius: 6, border: `1px solid ${C.line}` }}>
            <div style={{ position: 'absolute', left: 24, right: 24, bottom: 30, borderTop: `2px solid ${C.dim}` }}></div>
            <div style={{ position: 'absolute', left: 24, bottom: 14, fontFamily: C.mono, fontSize: 15, color: C.dim }}>start</div>
            <div style={{ position: 'absolute', right: 24, bottom: 14, fontFamily: C.mono, fontSize: 15, color: C.dim }}>far</div>
            {/* walker */}
            <div style={{ position: 'absolute', bottom: 36, left: `calc(24px + ${pos * 100}% * 0.86)`, width: 26, height: 44, transition: playing ? 'none' : 'left .3s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.gold, margin: '0 auto' }}></div>
              <div style={{ width: 4, height: 24, background: C.gold, margin: '2px auto 0' }}></div>
            </div>
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 17, color: C.ink, lineHeight: 1.6 }}>Graph {pick} claims: <span style={{ color: C.gold }}>{story.desc}</span></div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {Object.keys(STORIES).map((k) => <Btn key={k} label={k} color={C.lav} active={pick === k} onClick={() => setPick(k)} />)}
            <Btn label={playing ? '···' : '▶ WALK IT'} color={C.gold} onClick={play} disabled={playing} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── F = ma LAB SIM ───────────────────────── */
function FmaLabSim() {
  const [F, setF] = useState(4);
  const [m, setM] = useState(2);
  const [u, setU] = useState(0);
  const [running, setRunning] = useState(false);
  const raf = useRef(null);
  const a = F / m;

  const run = () => {
    cancelAnimationFrame(raf.current);
    setRunning(true);
    const t0 = performance.now();
    const step = (now) => {
      const tt = (now - t0) / 1000;                 // seconds
      const x = 0.5 * a * tt * tt * 0.055;          // scaled
      if (x < 1) { setU(x); raf.current = requestAnimationFrame(step); }
      else { setU(1); setRunning(false); }
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const slider = (label, val, set, min, max, unit, color) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 17 }}>
        <span style={{ color: C.dim, letterSpacing: '0.18em' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{val} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={val} disabled={running}
        onChange={(e) => { setU(0); set(+e.target.value); }}
        style={{ width: '100%', accentColor: color, height: 6 }} />
    </div>
  );

  // mini graphs: a vs F (m fixed) and a vs 1/m (F fixed)
  const mini = (title, xs, fx, cur, xlab) => {
    const W = 240, H = 190, gx = 52, gy = 16, gw = W - gx - 14, gh = H - gy - 44;
    const maxA = 10;
    const pts = xs.map((xx) => `${gx + (xx.x) * gw},${gy + gh - Math.min(1, xx.a / maxA) * gh}`);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 250 }}>
        <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={C.dim} strokeWidth={2} />
        <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={C.dim} strokeWidth={2} />
        <polyline points={pts.join(' ')} fill="none" stroke={C.line} strokeWidth={2.5} />
        <circle cx={gx + cur.x * gw} cy={gy + gh - Math.min(1, cur.a / maxA) * gh} r={7} fill={C.gold} />
        <text x={gx - 10} y={gy + 12} textAnchor="end" fontFamily={C.mono} fontSize={15} fill={C.dim}>a</text>
        <text x={gx + gw} y={gy + gh + 24} textAnchor="end" fontFamily={C.mono} fontSize={15} fill={C.dim}>{xlab}</text>
        <text x={gx} y={H - 4} fontFamily={C.mono} fontSize={14} fill={C.lav}>{title}</text>
      </svg>
    );
  };
  const aF = [...Array(11)].map((_, i) => ({ x: i / 10, a: (i / 10) * 10 / m }));
  const aM = [...Array(11)].map((_, i) => { const inv = 0.2 + (i / 10) * 0.8; return { x: (inv - 0.2) / 0.8, a: F * inv }; });
  const curF = { x: F / 10, a };
  const curM = { x: ((1 / m) - 0.2) / 0.8, a };

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: '34px 44px', display: 'flex', flexDirection: 'column', gap: 26, border: `1px solid ${C.line}` }}>
      {/* track */}
      <div style={{ position: 'relative', height: 130, background: C.panel, borderRadius: 6, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 28, borderTop: `2px solid ${C.dim}` }}></div>
        {[...Array(11)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', bottom: 20, left: `calc(24px + ${i * 10}% * 0.9)`, width: 2, height: 10, background: C.line }}></div>
        ))}
        {/* cart */}
        <div style={{ position: 'absolute', bottom: 32, left: `calc(24px + ${u * 100}% * 0.82)` }}>
          <div style={{ width: 84, height: 40, background: '#262148', border: `2px solid ${C.lav}`, borderRadius: 5, position: 'relative' }}>
            <span style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', fontFamily: C.mono, fontSize: 15, color: C.ink }}>{m} kg</span>
            <div style={{ position: 'absolute', bottom: -13, left: 10, width: 18, height: 18, borderRadius: '50%', background: C.dim }}></div>
            <div style={{ position: 'absolute', bottom: -13, right: 10, width: 18, height: 18, borderRadius: '50%', background: C.dim }}></div>
          </div>
          {/* force arrow */}
          <div style={{ position: 'absolute', top: 8, left: -14 - F * 7, width: F * 7, borderTop: `5px solid ${C.gold}` }}></div>
          <div style={{ position: 'absolute', top: 2, left: -16, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `14px solid ${C.gold}` }}></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        {slider('FORCE', F, setF, 1, 10, 'N', C.gold)}
        {slider('MASS', m, setM, 1, 5, 'kg', C.lav)}
        <Readout label="a = F / m" value={`${a.toFixed(2)} m/s²`} color={C.sage} />
        <Btn label={running ? '···' : '▶ RUN'} onClick={run} disabled={running} />
      </div>
      <div style={{ display: 'flex', gap: 30, borderTop: `1px solid ${C.line}`, paddingTop: 20, alignItems: 'center' }}>
        {mini('a ∝ F  (m fixed)', aF, null, curF, 'F')}
        {mini('a ∝ 1/m  (F fixed)', aM, null, curM, '1/m')}
        <div style={{ fontFamily: C.mono, fontSize: 16, color: C.dim, lineHeight: 1.7, flex: 1 }}>
          Two separate one-variable claims.<br />
          <span style={{ color: C.ink }}>Combining them into a = F/m is a <span style={{ color: C.gold }}>choice</span> — the independence assumption.</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── TRAJECTORY SIM ───────────────────────── */
function TrajectorySim() {
  const [months, setMonths] = useState(0);
  // constant-velocity model: distance covered in 6 months at 8500 m/s ≈ 1.34e8 km
  const total = 1.34;   // ×10^8 km covered at 6 mo
  const covered = (months / 6) * total;
  const W = 980, H = 460;
  const x0 = 120, y0 = 350, x6 = 790, y6 = 170;   // path start/end px
  const fx = x0 + (months / 6) * (x6 - x0);
  const fy = y0 + (months / 6) * (y6 - y0);

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: '34px 44px', display: 'flex', flexDirection: 'column', gap: 24, border: `1px solid ${C.line}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 400 }}>
        {/* stars */}
        {[[60, 60], [200, 120], [370, 60], [540, 100], [700, 50], [880, 90], [150, 260], [500, 300], [930, 240], [820, 380]].map((s, i) => (
          <circle key={i} cx={s[0]} cy={s[1]} r={i % 3 === 0 ? 2.5 : 1.5} fill={i % 4 === 0 ? C.gold : '#5A5480'} />
        ))}
        {/* Earth */}
        <circle cx={905} cy={120} r={46} fill="#22406B" stroke={C.sage} strokeWidth={2.5} />
        <path d="M 880 105 q 14 -10 26 -2 q 16 8 24 2 M 878 132 q 18 10 34 2 q 12 -6 18 2" stroke={C.sage} strokeWidth={3} fill="none" strokeLinecap="round" />
        <text x={905} y={196} textAnchor="middle" fontFamily={C.mono} fontSize={19} fill={C.sage}>EARTH</text>
        {/* path */}
        <line x1={x0} y1={y0} x2={x6} y2={y6} stroke={C.dim} strokeWidth={2} strokeDasharray="10 10" />
        {/* velocity vector at current pos */}
        <line x1={fx} y1={fy} x2={fx + 110} y2={fy - 30} stroke={C.gold} strokeWidth={4.5} />
        <path d={`M ${fx + 122} ${fy - 33} l -22 -6 l 8 20 z`} fill={C.gold} />
        <text x={fx + 60} y={fy - 44} fontFamily={C.mono} fontSize={19} fill={C.gold}>v = 8,500 m/s</text>
        {/* angle */}
        <line x1={fx} y1={fy} x2={fx + 96} y2={fy} stroke={C.line} strokeWidth={2} />
        <path d={`M ${fx + 62} ${fy} A 62 62 0 0 0 ${fx + 57} ${fy - 16}`} stroke={C.lav} strokeWidth={2.5} fill="none" />
        <text x={fx + 74} y={fy - 4} fontFamily={C.mono} fontSize={17} fill={C.lav}>15°</text>
        {/* asteroid */}
        <g transform={`translate(${fx} ${fy})`}>
          <path d="M -26 -8 L -14 -24 L 8 -26 L 26 -12 L 24 10 L 6 24 L -16 20 L -28 6 Z" fill="#3A3458" stroke={C.gold} strokeWidth={2.5} />
          <circle cx={-6} cy={-4} r={5} fill="#262148" />
          <circle cx={10} cy={6} r={3.5} fill="#262148" />
        </g>
        <text x={x0} y={y0 + 44} fontFamily={C.mono} fontSize={19} fill={C.dim}>t = 0 · x₀ = 1.2 × 10⁸ km</text>
      </svg>
      <div style={{ display: 'flex', gap: 44, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 17 }}>
            <span style={{ color: C.dim, letterSpacing: '0.18em' }}>ADVANCE TIME</span>
            <span style={{ color: C.gold, fontWeight: 600 }}>{months.toFixed(1)} months</span>
          </div>
          <input type="range" min={0} max={6} step={0.1} value={months} onChange={(e) => setMonths(+e.target.value)} style={{ width: '100%', accentColor: C.gold, height: 6 }} />
        </div>
        <Readout label="DISTANCE COVERED" value={`${covered.toFixed(2)} × 10⁸ km`} color={C.gold} />
        <div style={{ fontFamily: C.mono, fontSize: 15, color: C.dim, lineHeight: 1.6, maxWidth: 330 }}>
          Model assumes: constant velocity · no forces this leg · point particle.<br /><span style={{ color: C.ink }}>Each assumption can fail. Name when.</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── VECTOR DECOMPOSITION SIM ───────────────────────── */
function VectorDecompSim() {
  const [deg, setDeg] = useState(15);
  const [mag, setMag] = useState(8500);
  const th = deg * Math.PI / 180;
  const vx = mag * Math.cos(th), vy = mag * Math.sin(th);
  const ox = 90, oy = 420, scale = 0.075;
  const L = mag * scale;
  const tx = ox + L * Math.cos(th), ty = oy - L * Math.sin(th);

  return (
    <div style={{ background: C.bg, borderRadius: 8, padding: '34px 44px', display: 'flex', gap: 48, border: `1px solid ${C.line}`, alignItems: 'center' }}>
      <svg viewBox="0 0 800 480" style={{ width: 640, flex: 'none' }}>
        <line x1={ox} y1={oy} x2={760} y2={oy} stroke={C.dim} strokeWidth={2.5} />
        <line x1={ox} y1={oy} x2={ox} y2={40} stroke={C.dim} strokeWidth={2.5} />
        <text x={ox - 16} y={oy + 30} fontFamily={C.mono} fontSize={20} fill={C.dim}>O</text>
        <text x={756} y={oy + 32} textAnchor="end" fontFamily={C.mono} fontSize={20} fill={C.dim}>toward Earth</text>
        <text x={ox - 24} y={58} fontFamily={C.mono} fontSize={20} fill={C.dim}>perp</text>
        {/* projections */}
        <line x1={tx} y1={ty} x2={tx} y2={oy} stroke={C.lav} strokeWidth={2} strokeDasharray="8 8" />
        <line x1={tx} y1={ty} x2={ox} y2={ty} stroke={C.lav} strokeWidth={2} strokeDasharray="8 8" />
        {/* components */}
        <line x1={ox} y1={oy} x2={tx} y2={oy} stroke={C.sage} strokeWidth={6} />
        <path d={`M ${tx + 14} ${oy} l -20 -9 l 0 18 z`} fill={C.sage} />
        <text x={(ox + tx) / 2} y={oy + 36} textAnchor="middle" fontFamily={C.mono} fontSize={21} fill={C.sage}>v·cos θ = {Math.round(vx).toLocaleString()} m/s</text>
        <line x1={ox} y1={oy} x2={ox} y2={ty} stroke={C.lav} strokeWidth={6} />
        <path d={`M ${ox} ${ty - 14} l -9 20 l 18 0 z`} fill={C.lav} />
        <text x={ox + 14} y={(oy + ty) / 2} fontFamily={C.mono} fontSize={21} fill={C.lav}>v·sin θ = {Math.round(vy).toLocaleString()} m/s</text>
        {/* main vector */}
        <line x1={ox} y1={oy} x2={tx} y2={ty} stroke={C.gold} strokeWidth={7} />
        <path d={`M ${tx + 16 * Math.cos(th)} ${ty - 16 * Math.sin(th)} l ${-24 * Math.cos(th) - 10 * Math.sin(th)} ${24 * Math.sin(th) - 10 * Math.cos(th)} l ${20 * Math.sin(th)} ${20 * Math.cos(th)} z`} fill={C.gold} />
        <text x={(ox + tx) / 2 + 20} y={(oy + ty) / 2 - 24} fontFamily={C.mono} fontSize={22} fill={C.gold}>v = {mag.toLocaleString()} m/s</text>
        {/* angle arc */}
        <path d={`M ${ox + 70} ${oy} A 70 70 0 0 0 ${ox + 70 * Math.cos(th)} ${oy - 70 * Math.sin(th)}`} stroke={C.ink} strokeWidth={2.5} fill="none" />
        <text x={ox + 92} y={oy - 18} fontFamily={C.mono} fontSize={21} fill={C.ink}>θ = {deg}°</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 17 }}>
            <span style={{ color: C.dim, letterSpacing: '0.18em' }}>ANGLE θ</span>
            <span style={{ color: C.gold, fontWeight: 600 }}>{deg}°</span>
          </div>
          <input type="range" min={0} max={90} step={1} value={deg} onChange={(e) => setDeg(+e.target.value)} style={{ width: '100%', accentColor: C.gold, height: 6 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 17 }}>
            <span style={{ color: C.dim, letterSpacing: '0.18em' }}>MAGNITUDE</span>
            <span style={{ color: C.ink, fontWeight: 600 }}>{mag.toLocaleString()} m/s</span>
          </div>
          <input type="range" min={1000} max={10000} step={100} value={mag} onChange={(e) => setMag(+e.target.value)} style={{ width: '100%', accentColor: C.lav, height: 6 }} />
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Readout label="TOWARD EARTH (adjacent → cos)" value={`${Math.round(vx).toLocaleString()} m/s`} color={C.sage} />
          <Readout label="PERPENDICULAR (opposite → sin)" value={`${Math.round(vy).toLocaleString()} m/s`} color={C.lav} />
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 15, color: C.dim, lineHeight: 1.6 }}>
          Adjacent uses <span style={{ color: C.sage }}>cos</span>. Opposite uses <span style={{ color: C.lav }}>sin</span>.<br /><span style={{ color: C.ink }}>Why? Convince me with the triangle.</span>
        </div>
      </div>
    </div>
  );
}

module.exports = { TwoStringSim, GraphMatchSim, FmaLabSim, TrajectorySim, VectorDecompSim };
