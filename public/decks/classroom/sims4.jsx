/* Interactive physics sims, wave 4 — CPA Physics Unit 2 · Gravitation & Fields */
const { useState, useRef, useEffect } = React;

const C4 = {
  bg: '#17142E', panel: '#1E1A38', line: '#2E2950', ink: '#FAF9FC',
  dim: '#8B87A6', lav: '#9B8EC4', sage: '#7FA68B', gold: '#E0A93D',
  mono: "'IBM Plex Mono', monospace", disp: "'Space Grotesk', sans-serif",
};
function B4({ label, onClick, color = C4.gold, active = false, disabled = false, small = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: C4.mono, fontSize: small ? 16 : 20, letterSpacing: '0.12em', cursor: disabled ? 'default' : 'pointer',
      padding: small ? '9px 16px' : '14px 26px', borderRadius: 4, border: `2px solid ${color}`,
      background: active ? color : 'transparent', color: active ? '#17142E' : color,
      opacity: disabled ? 0.35 : 1, fontWeight: 600, transition: 'all .15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}
function R4({ label, value, color = C4.ink }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: C4.mono, fontSize: 15, letterSpacing: '0.2em', color: C4.dim }}>{label}</span>
      <span style={{ fontFamily: C4.disp, fontSize: 30, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
function S4({ label, val, set, min, max, step = 1, unit = '', color = C4.gold, fmt, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 190, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C4.mono, fontSize: 16 }}>
        <span style={{ color: C4.dim, letterSpacing: '0.16em', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ color, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt ? fmt(val) : `${val} ${unit}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} disabled={disabled} onChange={(e) => set(+e.target.value)} style={{ width: '100%', accentColor: color, height: 6 }} />
    </div>
  );
}
const Wrap = ({ children, row = false }) => (
  <div style={{ background: C4.bg, borderRadius: 8, padding: '30px 40px', display: 'flex', flexDirection: row ? 'row' : 'column', gap: 24, border: `1px solid ${C4.line}`, alignItems: row ? 'center' : 'stretch' }}>{children}</div>
);

/* ───────── FREE-FALL v-t (Day 2 + Day 8) — drop a ball, watch the slope build ───────── */
function FreeFallVTSim() {
  const BALLS = [
    { id: 'tennis', label: 'TENNIS BALL', color: C4.sage },
    { id: 'bowling', label: 'BOWLING BALL', color: C4.lav },
  ];
  const [ball, setBall] = useState('tennis');
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [fit, setFit] = useState(false);
  const [done, setDone] = useState({});
  const raf = useRef(null);
  const T_END = 1.4;
  const drop = () => {
    cancelAnimationFrame(raf.current);
    setFit(false); setRunning(true); setT(0);
    const t0 = performance.now();
    const step = (now) => {
      const tt = Math.min(T_END, ((now - t0) / 1000) * 0.55);
      setT(tt);
      if (tt < T_END) raf.current = requestAnimationFrame(step);
      else { setRunning(false); setDone((d) => ({ ...d, [ball]: true })); }
    };
    raf.current = requestAnimationFrame(step);
  };
  const reset = () => { cancelAnimationFrame(raf.current); setRunning(false); setT(0); setFit(false); setDone({}); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const b = BALLS.find((x) => x.id === ball);
  const GX = 90, GY = 26, GW = 480, GH = 300;
  const px = (tt) => GX + (tt / T_END) * GW, py = (v) => GY + GH - (v / 15) * GH;
  const y = 0.5 * 9.81 * t * t;                    // m fallen (visual: 2.4 m shaft)
  const ballY = Math.min(1, y / 2.4);
  const pts = []; for (let i = 0; i <= 100; i++) { const tt = (i / 100) * t; pts.push(`${px(tt)},${py(9.81 * tt)}`); }
  return (
    <Wrap row>
      <div style={{ position: 'relative', width: 130, height: 360, flex: 'none', background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}` }}>
        <div style={{ position: 'absolute', top: `${8 + ballY * 78}%`, left: '50%', transform: 'translateX(-50%)', width: ball === 'bowling' ? 46 : 32, height: ball === 'bowling' ? 46 : 32, borderRadius: '50%', background: '#262148', border: `3px solid ${b.color}` }}></div>
        <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontFamily: C4.mono, fontSize: 13, color: C4.dim }}>SENSOR ▲</div>
        <div style={{ position: 'absolute', bottom: 34, left: 14, right: 14, borderTop: `2px dashed ${C4.line}` }}></div>
      </div>
      <svg viewBox="0 0 620 360" style={{ flex: 1, minWidth: 380 }}>
        <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C4.dim} strokeWidth={2.5} />
        <line x1={GX} y1={GY + GH} x2={GX + GW + 30} y2={GY + GH} stroke={C4.dim} strokeWidth={2.5} />
        <text x={GX + 14} y={GY + 12} fontFamily={C4.mono} fontSize={20} fill={C4.dim}>v (m/s)</text>
        <text x={GX + GW + 24} y={GY + GH + 30} textAnchor="end" fontFamily={C4.mono} fontSize={20} fill={C4.dim}>t (s)</text>
        {[5, 10].map((v) => <g key={v}><line x1={GX - 6} y1={py(v)} x2={GX + GW} y2={py(v)} stroke={C4.line} strokeWidth={1} /><text x={GX - 12} y={py(v) + 6} textAnchor="end" fontFamily={C4.mono} fontSize={16} fill={C4.dim}>{v}</text></g>)}
        {t > 0 && <polyline points={pts.join(' ')} fill="none" stroke={b.color} strokeWidth={5} strokeLinecap="round" />}
        {fit && <g>
          <line x1={px(0.1)} y1={py(9.81 * 0.1)} x2={px(1.3)} y2={py(9.81 * 1.3)} stroke={C4.gold} strokeWidth={3} strokeDasharray="10 7" />
          <text x={px(0.72)} y={py(9.81 * 0.95) - 16} fontFamily={C4.mono} fontSize={22} fill={C4.gold}>slope ≈ 9.8 m/s²</text>
        </g>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 250, flex: 'none' }}>
        {BALLS.map((x) => <B4 key={x.id} small label={x.label} color={x.color} active={ball === x.id} onClick={() => { if (!running) setBall(x.id); }} />)}
        <B4 small label="▶ DROP" onClick={drop} disabled={running} />
        <B4 small label="FIT LINE" color={C4.gold} onClick={() => setFit(true)} disabled={t < T_END} />
        <B4 small label="RESET" color={C4.dim} onClick={reset} />
        <R4 label="v RIGHT NOW" value={`${(9.81 * t).toFixed(1)} m/s`} color={b.color} />
        {done.tennis && done.bowling && <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.gold, lineHeight: 1.6 }}>Two balls, one slope. Mass didn't matter.</span>}
      </div>
    </Wrap>
  );
}

/* ───────── WEIGHT ACROSS WORLDS (Day 3) — same mass, different g ───────── */
function WeightWorldsSim() {
  const WORLDS = [
    { id: 'earth', label: 'EARTH', g: 9.81, color: C4.sage },
    { id: 'moon', label: 'MOON', g: 1.62, color: C4.dim },
    { id: 'mars', label: 'MARS', g: 3.71, color: '#C0765A' },
    { id: 'xj', label: '2026-XJ', g: 0.0003, color: C4.gold },
  ];
  const [m, setM] = useState(70);
  const [world, setWorld] = useState('earth');
  const w = WORLDS.find((x) => x.id === world);
  const weight = m * w.g;
  const fmtW = weight >= 1 ? `${weight.toFixed(0)} N` : `${weight.toFixed(3)} N`;
  return (
    <Wrap>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {WORLDS.map((x) => <B4 key={x.id} small label={x.label} color={x.color} active={world === x.id} onClick={() => setWorld(x.id)} />)}
        <div style={{ flex: 1, minWidth: 260, marginLeft: 20 }}>
          <S4 label="MASS (never changes)" val={m} set={setM} min={40} max={140} step={5} unit="kg" color={C4.lav} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', height: 190 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: C4.mono, fontSize: 17, color: C4.lav, fontWeight: 600 }}>{m} kg</span>
          <div style={{ width: '68%', height: Math.max(3, (m / 140) * 170), background: 'transparent', border: `3px solid ${C4.lav}`, boxSizing: 'border-box', borderRadius: '4px 4px 0 0', transition: 'height .3s' }}></div>
          <span style={{ fontFamily: C4.mono, fontSize: 14, color: C4.lav }}>MASS · everywhere</span>
        </div>
        {WORLDS.map((x) => {
          const h = Math.max(3, (m * x.g / (140 * 9.81)) * 170);
          return (
            <div key={x.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: world === x.id ? 1 : 0.4 }}>
              <span style={{ fontFamily: C4.mono, fontSize: 17, color: x.color, fontWeight: 600 }}>{(m * x.g) >= 1 ? `${(m * x.g).toFixed(0)} N` : `${(m * x.g).toFixed(3)} N`}</span>
              <div style={{ width: '68%', height: h, background: x.color, borderRadius: '4px 4px 0 0', transition: 'height .3s' }}></div>
              <span style={{ fontFamily: C4.mono, fontSize: 14, color: C4.dim }}>{x.label} · g={x.g}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 44, borderTop: `1px solid ${C4.line}`, paddingTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <R4 label="MASS" value={`${m} kg — EVERYWHERE`} color={C4.lav} />
        <R4 label={`WEIGHT ON ${w.label}`} value={fmtW} color={w.color} />
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, flex: 1, minWidth: 300, lineHeight: 1.6 }}>
          F<sub>w</sub> = m·g. <span style={{ color: C4.ink }}>The mass bar never moves — only g does.</span>
        </span>
      </div>
    </Wrap>
  );
}

/* ───────── INVERSE-SQUARE EXPLORER (Days 4–5) — predict, then move r ───────── */
function InverseSquareSim() {
  const [m1, setM1] = useState(1);
  const [m2, setM2] = useState(1);
  const [r, setR] = useState(2);
  const [guess, setGuess] = useState(null);
  const [quiz, setQuiz] = useState(null); // {from, to, answer}
  const F = (m1 * m2) / (r * r);
  const F0 = 1 / 4; // baseline m1=m2=1, r=2
  const rel = F / F0;
  const startQuiz = (mult) => {
    setQuiz({ from: r, to: Math.min(8, Math.max(1, r * mult)), mult });
    setGuess(null);
  };
  const answers = quiz ? [
    { label: `× ${quiz.mult}`, v: 1 / quiz.mult },
    { label: `× ${(1 / quiz.mult).toFixed(quiz.mult === 2 ? 1 : 2).replace(/\.?0+$/, '') || '½'}`, v: quiz.mult },
    { label: `× ${(1 / (quiz.mult * quiz.mult)).toFixed(2)}`, v: quiz.mult * quiz.mult, right: true },
  ] : [];
  const correct = quiz ? 1 / (quiz.mult * quiz.mult) : null;
  const arrowLen = Math.min(150, 26 + rel * 26);
  return (
    <Wrap>
      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
        <S4 label="MASS m₁" val={m1} set={setM1} min={1} max={4} step={1} fmt={(v) => `× ${v}`} color={C4.lav} />
        <S4 label="MASS m₂" val={m2} set={setM2} min={1} max={4} step={1} fmt={(v) => `× ${v}`} color={C4.sage} />
        <S4 label="DISTANCE r" val={r} set={setR} min={1} max={8} step={0.5} fmt={(v) => `× ${v}`} color={C4.gold} />
      </div>
      <div style={{ position: 'relative', height: 210, background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 60, top: '50%', transform: 'translateY(-50%)', width: 26 + m1 * 14, height: 26 + m1 * 14, borderRadius: '50%', background: '#262148', border: `3px solid ${C4.lav}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C4.mono, fontSize: 16, color: C4.lav }}>m₁</div>
        <div style={{ position: 'absolute', left: `calc(120px + ${(r - 1) / 7} * (100% - 260px))`, top: '50%', transform: 'translateY(-50%)', width: 26 + m2 * 14, height: 26 + m2 * 14, borderRadius: '50%', background: '#262148', border: `3px solid ${C4.sage}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C4.mono, fontSize: 16, color: C4.sage, transition: 'left .2s' }}>m₂</div>
        <div style={{ position: 'absolute', left: 90, right: `calc(100% - (150px + ${(r - 1) / 7} * (100% - 260px)))`, top: 'calc(50% + 44px)', borderTop: `2px dashed ${C4.line}`, transition: 'right .2s' }}></div>
        <div style={{ position: 'absolute', left: `calc(105px + ${(r - 1) / 14} * (100% - 260px))`, top: 'calc(50% + 54px)', fontFamily: C4.mono, fontSize: 16, color: C4.dim, transition: 'left .2s' }}>r = ×{r}</div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs><marker id="isqArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill={C4.gold} /></marker></defs>
          <line x1={100 + arrowLen} y1="50%" x2={100} y2="50%" stroke={C4.gold} strokeWidth={4} markerEnd="url(#isqArrow)" opacity={0.9} />
        </svg>
        <span style={{ position: 'absolute', left: 24, bottom: 12, fontFamily: C4.mono, fontSize: 18, color: C4.gold }}>F ∝ m₁m₂/r²</span>
      </div>
      <div style={{ display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap', borderTop: `1px solid ${C4.line}`, paddingTop: 18 }}>
        <R4 label="FORCE (relative)" value={`${rel.toFixed(2)} ×`} color={C4.gold} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: C4.mono, fontSize: 15, letterSpacing: '0.14em', color: C4.dim }}>PREDICT-THEN-CHECK:</span>
          <B4 small label="DOUBLE r →  F?" color={C4.lav} onClick={() => startQuiz(2)} />
          <B4 small label="TRIPLE r →  F?" color={C4.sage} onClick={() => startQuiz(3)} />
        </div>
        {quiz && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[{ t: `F × 1/${quiz.mult}`, v: quiz.mult }, { t: `F × 1/${quiz.mult * quiz.mult}`, v: quiz.mult * quiz.mult, right: true }, { t: `F × ${quiz.mult}`, v: 0.5 }].map((a, i) => (
              <B4 key={i} small label={a.t} color={guess === null ? C4.ink : a.right ? C4.sage : '#C05A5A'}
                active={guess === i}
                onClick={() => { setGuess(i); if (a.right) setR(quiz.to); }} />
            ))}
            {guess !== null && <span style={{ fontFamily: C4.mono, fontSize: 16, color: C4.gold }}>r² in the denominator: ×{quiz.mult} distance → ÷{quiz.mult * quiz.mult} force.</span>}
          </div>
        )}
      </div>
    </Wrap>
  );
}

/* ───────── FIELD MAP (Days 6–7) — g(r) curve with real altitude markers ───────── */
function FieldMapSim() {
  const RE = 6.37e6, GM = 3.98e14;
  const MARKS = [
    { alt: 0, label: 'SURFACE' },
    { alt: 4e5, label: 'ISS · 400 km' },
    { alt: 2.5e6, label: 'HALF-g' },
    { alt: 2.02e7, label: 'GPS' },
    { alt: 3.58e7, label: 'GEO' },
  ];
  const [u, setU] = useState(0);             // 0..1 slider position (log-ish)
  const altOf = (uu) => (Math.pow(10, uu * 4.78) - 1) * 1e3;   // 0 → 0 km, 1 → ~60,000 km... tune: 10^(u*4.78)-1 in km
  const alt = altOf(u);
  const r = RE + alt;
  const g = GM / (r * r);
  const pct = (g / 9.81) * 100;
  const GX = 90, GY = 20, GW = 620, GH = 280;
  const ux = (uu) => GX + uu * GW;
  const gy = (gg) => GY + GH - (gg / 10) * GH;
  const pts = []; for (let i = 0; i <= 140; i++) { const uu = i / 140; const rr = RE + altOf(uu); pts.push(`${ux(uu)},${gy(GM / (rr * rr))}`); }
  const uOfAlt = (a) => Math.log10(a / 1e3 + 1) / 4.78;
  return (
    <Wrap>
      <svg viewBox="0 0 780 350" style={{ width: '100%' }}>
        <line x1={GX} y1={GY} x2={GX} y2={GY + GH} stroke={C4.dim} strokeWidth={2.5} />
        <line x1={GX} y1={GY + GH} x2={GX + GW + 30} y2={GY + GH} stroke={C4.dim} strokeWidth={2.5} />
        <text x={30} y={GY + 150} transform={`rotate(-90 30 ${GY + 150})`} textAnchor="middle" fontFamily={C4.mono} fontSize={20} fill={C4.dim}>g (N/kg)</text>
        <text x={GX + GW + 26} y={GY + GH + 34} textAnchor="end" fontFamily={C4.mono} fontSize={20} fill={C4.dim}>altitude →</text>
        {[9.81, 4.9].map((gg, i) => <g key={i}><line x1={GX} y1={gy(gg)} x2={GX + GW} y2={gy(gg)} stroke={C4.line} strokeWidth={1.5} strokeDasharray="6 6" /><text x={GX - 12} y={gy(gg) + 6} textAnchor="end" fontFamily={C4.mono} fontSize={16} fill={C4.dim}>{gg}</text></g>)}
        <polyline points={pts.join(' ')} fill="none" stroke={C4.lav} strokeWidth={4.5} strokeLinecap="round" />
        {MARKS.map((mk, i) => {
          const uu = uOfAlt(mk.alt); const rr = RE + mk.alt; const gg = GM / (rr * rr);
          return <g key={i}>
            <circle cx={ux(uu)} cy={gy(gg)} r={7} fill={C4.panel} stroke={C4.sage} strokeWidth={2.5} />
            <text x={ux(uu)} y={gy(gg) - 16} textAnchor="middle" fontFamily={C4.mono} fontSize={14} fill={C4.sage}>{mk.label}</text>
          </g>;
        })}
        <line x1={ux(u)} y1={GY} x2={ux(u)} y2={GY + GH} stroke={C4.gold} strokeWidth={2.5} strokeDasharray="8 6" />
        <circle cx={ux(u)} cy={gy(g)} r={11} fill={C4.gold} />
      </svg>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          <S4 label="YOUR ALTITUDE (slide me)" val={u} set={setU} min={0} max={1} step={0.002} fmt={() => alt < 1e6 ? `${(alt / 1e3).toFixed(0)} km` : `${(alt / 1e6).toFixed(2)} × 10³ km`} color={C4.gold} />
        </div>
        <R4 label="g HERE" value={`${g.toFixed(g < 1 ? 3 : 2)} N/kg`} color={C4.gold} />
        <R4 label="% OF SURFACE g" value={`${pct.toFixed(pct < 10 ? 1 : 0)}%`} color={C4.lav} />
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, minWidth: 260, flex: 1, lineHeight: 1.6 }}>
          Find the ISS. <span style={{ color: C4.ink }}>Is g zero there? Not even close.</span>
        </span>
      </div>
    </Wrap>
  );
}

/* ───────── PROJECTILE (Days 9–11) — modes: race | cliff | angle ───────── */
function ProjectileSim({ mode = 'cliff' }) {
  const [h, setH] = useState(mode === 'angle' ? 0 : 45);
  const [vx, setVx] = useState(15);
  const [v0, setV0] = useState(20);
  const [ang, setAng] = useState(30);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [ghosts, setGhosts] = useState([]);
  const raf = useRef(null);
  const g = 9.81;
  const isAngle = mode === 'angle', isRace = mode === 'race';
  const VX = isAngle ? v0 * Math.cos(ang * Math.PI / 180) : vx;
  const VY0 = isAngle ? v0 * Math.sin(ang * Math.PI / 180) : 0;
  const H = isAngle ? 0 : h;
  const tEnd = (VY0 + Math.sqrt(VY0 * VY0 + 2 * g * H)) / g;
  const range = VX * tEnd;
  const hMax = H + VY0 * VY0 / (2 * g);
  const launch = () => {
    cancelAnimationFrame(raf.current); setRunning(true); setT(0);
    const t0 = performance.now();
    const step = (now) => {
      const tt = Math.min(tEnd, ((now - t0) / 1000) * (isRace ? 0.5 : tEnd / 2.6));
      setT(tt);
      if (tt < tEnd) raf.current = requestAnimationFrame(step);
      else { setRunning(false); setGhosts((gs) => [...gs.slice(-5), { VX, VY0, H, ang, range, color: C4.dim }]); }
    };
    raf.current = requestAnimationFrame(step);
  };
  const stop = () => { cancelAnimationFrame(raf.current); setRunning(false); setT(0); };
  const reset = () => { stop(); setGhosts([]); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  // world → svg
  const WX = 110, WY = 300, SC_X = Math.min(isRace ? 18 : 9, 560 / Math.max(30, range * 1.15), 252 / Math.max(12, H, hMax)), SC_Y = SC_X;
  const sx = (x) => WX + x * SC_X, sy = (y) => WY - y * SC_Y;
  const X = VX * t, Y = H + VY0 * t - 0.5 * g * t * t;
  const path = []; for (let i = 0; i <= 60; i++) { const tt = (i / 60) * t; path.push(`${sx(VX * tt)},${sy(H + VY0 * tt - 0.5 * g * tt * tt)}`); }
  const dropY = isRace ? H - 0.5 * g * t * t : 0;
  return (
    <Wrap>
      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {!isAngle && !isRace && <S4 label="CLIFF HEIGHT" val={h} set={(v) => { setH(v); stop(); }} min={5} max={100} step={5} unit="m" color={C4.lav} />}
        {!isAngle && <S4 label="LAUNCH SPEED vₓ" val={vx} set={(v) => { setVx(v); if (!isRace) stop(); }} min={isRace ? 2 : 5} max={isRace ? 12 : 25} step={1} unit="m/s" color={C4.sage} />}
        {isAngle && <S4 label="LAUNCH SPEED v" val={v0} set={(v) => { setV0(v); stop(); }} min={10} max={30} step={1} unit="m/s" color={C4.sage} />}
        {isAngle && <S4 label="ANGLE θ" val={ang} set={(v) => { setAng(v); stop(); }} min={10} max={80} step={5} unit="°" color={C4.gold} />}
        <div style={{ display: 'flex', gap: 10 }}>
          <B4 small label="▶ LAUNCH" onClick={launch} disabled={running} />
          <B4 small label="RESET" color={C4.dim} onClick={reset} />
        </div>
      </div>
      <svg viewBox="0 0 760 330" style={{ width: '100%', background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}` }}>
        <line x1={0} y1={WY} x2={760} y2={WY} stroke={C4.dim} strokeWidth={3} />
        {H > 0 && <rect x={WX - 70} y={sy(H)} width={70} height={H * SC_Y} fill="#262148" stroke={C4.line} />}
        {ghosts.map((gh, i) => {
          const te = (gh.VY0 + Math.sqrt(gh.VY0 * gh.VY0 + 2 * g * gh.H)) / g;
          const p = []; for (let k = 0; k <= 50; k++) { const tt = (k / 50) * te; p.push(`${sx(gh.VX * tt)},${sy(gh.H + gh.VY0 * tt - 0.5 * g * tt * tt)}`); }
          return <polyline key={i} points={p.join(' ')} fill="none" stroke={C4.dim} strokeWidth={2} opacity={0.4} strokeDasharray="4 6" />;
        })}
        {t > 0 && <polyline points={path.join(' ')} fill="none" stroke={C4.gold} strokeWidth={3.5} strokeLinecap="round" />}
        <circle cx={sx(X)} cy={sy(Math.max(0, Y))} r={11} fill="#262148" stroke={C4.gold} strokeWidth={3} />
        {isRace && <circle cx={sx(0)} cy={sy(Math.max(0, dropY))} r={11} fill="#262148" stroke={C4.lav} strokeWidth={3} />}
        {isRace && <text x={sx(0) - 16} y={sy(H) - 14} textAnchor="end" fontFamily={C4.mono} fontSize={16} fill={C4.lav}>DROPPED</text>}
        {isRace && <text x={sx(0) + 26} y={sy(H) - 14} fontFamily={C4.mono} fontSize={16} fill={C4.gold}>PUSHED SIDEWAYS</text>}
        {/* pre-launch decomposition preview (angle mode) */}
        {isAngle && t === 0 && !running && <g>
          <line x1={sx(0)} y1={sy(0)} x2={sx(0) + VX * 9} y2={sy(0)} stroke={C4.sage} strokeWidth={3} strokeDasharray="7 6" />
          <line x1={sx(0) + VX * 9} y1={sy(0)} x2={sx(0) + VX * 9} y2={sy(0) - VY0 * 9} stroke={C4.lav} strokeWidth={3} strokeDasharray="7 6" />
          <line x1={sx(0)} y1={sy(0)} x2={sx(0) + VX * 9} y2={sy(0) - VY0 * 9} stroke={C4.gold} strokeWidth={4.5} strokeLinecap="round" />
          <circle cx={sx(0) + VX * 9} cy={sy(0) - VY0 * 9} r={5} fill={C4.gold} />
          <text x={sx(0) + VX * 4.5 - 30} y={sy(0) - VY0 * 4.5 - 28} fontFamily={C4.mono} fontSize={16} fill={C4.gold}>v = {v0} m/s</text>
          <text x={sx(0) + VX * 4.5 - 14} y={sy(0) + 24} fontFamily={C4.mono} fontSize={15} fill={C4.sage}>vₓ = {VX.toFixed(1)}</text>
          <text x={sx(0) + VX * 9 + 10} y={sy(0) - VY0 * 4.5} fontFamily={C4.mono} fontSize={15} fill={C4.lav}>v<tspan dy={4} fontSize={11}>y</tspan><tspan dy={-4}> = {VY0.toFixed(1)}</tspan></text>
          <path d={`M ${sx(0) + 52} ${sy(0)} A 52 52 0 0 0 ${sx(0) + 52 * Math.cos(ang * Math.PI / 180)} ${sy(0) - 52 * Math.sin(ang * Math.PI / 180)}`} fill="none" stroke={C4.gold} strokeWidth={2} />
          <text x={sx(0) + 66} y={sy(0) - 6} fontFamily={C4.mono} fontSize={15} fill={C4.gold}>θ = {ang}°</text>
        </g>}
        {/* live component arrows */}
        {t > 0 && t < tEnd && !isRace && <g>
          <line x1={sx(X)} y1={sy(Y)} x2={sx(X) + VX * 3.2} y2={sy(Y)} stroke={C4.sage} strokeWidth={3.5} />
          <line x1={sx(X)} y1={sy(Y)} x2={sx(X)} y2={sy(Y) + (g * t - VY0) * 3.2} stroke={C4.lav} strokeWidth={3.5} />
          <text x={sx(X) + VX * 3.2 + 8} y={sy(Y) + 5} fontFamily={C4.mono} fontSize={15} fill={C4.sage}>vₓ (constant)</text>
          <text x={sx(X) + 8} y={sy(Y) + (g * t - VY0) * 3.2 + (g * t > VY0 ? 22 : -10)} fontFamily={C4.mono} fontSize={15} fill={C4.lav}>v<tspan dy={4} fontSize={11}>y</tspan><tspan dy={-4}> (changing)</tspan></text>
        </g>}
      </svg>
      <div style={{ display: 'flex', gap: 44, alignItems: 'center', borderTop: `1px solid ${C4.line}`, paddingTop: 16, flexWrap: 'wrap' }}>
        <R4 label="TIME" value={`${t.toFixed(2)} s`} />
        {!isRace && <R4 label="RANGE (so far)" value={`${X.toFixed(1)} m`} color={C4.sage} />}
        {!isRace && <R4 label="PREDICTED RANGE" value={`${range.toFixed(1)} m`} color={C4.gold} />}
        {isAngle && <R4 label="MAX HEIGHT" value={`${hMax.toFixed(1)} m`} color={C4.lav} />}
        {isAngle && ghosts.length > 0 && (() => { const best = ghosts.reduce((a, b) => (b.range > a.range ? b : a)); return <R4 label="BEST SHOT SO FAR" value={`${best.range.toFixed(1)} m @ ${best.ang}°`} color={C4.gold} />; })()}
        {isRace && <R4 label="THE RESULT" value={t >= tEnd && t > 0 ? 'SAME LANDING TIME' : '…'} color={C4.gold} />}
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, flex: 1, minWidth: 260, lineHeight: 1.6 }}>
          {isRace ? 'Time is set by the VERTICAL motion alone.' : isAngle ? 'Try 30°, 45°, 60°. Ghost trails remember your shots.' : 'Find t from the drop, THEN multiply by vₓ.'}
        </span>
      </div>
    </Wrap>
  );
}

/* ───────── CIRCULAR MOTION (Day 12) — cut the string ───────── */
function CircularSim() {
  const [v, setV] = useState(4);
  const [r, setR] = useState(1);
  const [cut, setCut] = useState(false);
  const [phase, setPhase] = useState(0);
  const [freePos, setFreePos] = useState(null);
  const raf = useRef(null);
  const m = 0.2;
  const Fc = m * v * v / r;
  useEffect(() => {
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!cut) setPhase((p) => p + (v / r) * dt * 0.55);
      else setFreePos((fp) => fp ? { x: fp.x + fp.vx * dt * 0.55, y: fp.y + fp.vy * dt * 0.55 } : fp);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [cut, v, r]);
  const CX = 260, CY = 170, PR = 60 + r * 55;
  const bx = cut && freePos ? CX + freePos.x : CX + PR * Math.cos(phase);
  const by = cut && freePos ? CY + freePos.y : CY + PR * Math.sin(phase);
  const doCut = () => {
    const tx = -Math.sin(phase), ty = Math.cos(phase);
    setFreePos({ x: PR * Math.cos(phase), y: PR * Math.sin(phase), vx: tx * v * 60, vy: ty * v * 60 });
    setCut(true);
  };
  const reset = () => { setCut(false); setFreePos(null); };
  return (
    <Wrap row>
      <svg viewBox="0 0 520 340" style={{ width: 620, flex: 'none', background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}` }}>
        <circle cx={CX} cy={CY} r={PR} fill="none" stroke={C4.line} strokeWidth={2} strokeDasharray="6 8" />
        <circle cx={CX} cy={CY} r={7} fill={C4.dim} />
        {!cut && <line x1={CX} y1={CY} x2={bx} y2={by} stroke={C4.ink} strokeWidth={2.5} />}
        {/* arrows */}
        {!cut && <g>
          <line x1={bx} y1={by} x2={bx + (CX - bx) * 0.42} y2={by + (CY - by) * 0.42} stroke={C4.gold} strokeWidth={4} />
          <line x1={bx} y1={by} x2={bx - Math.sin(phase) * 52} y2={by + Math.cos(phase) * 52} stroke={C4.sage} strokeWidth={4} />
        </g>}
        <circle cx={bx} cy={by} r={13} fill="#262148" stroke={cut ? C4.sage : C4.gold} strokeWidth={3.5} />
        <text x={20} y={30} fontFamily={C4.mono} fontSize={16} fill={C4.gold}>— F<tspan dy={4} fontSize={12}>c</tspan><tspan dy={-4}> (inward)</tspan></text>
        <text x={20} y={56} fontFamily={C4.mono} fontSize={16} fill={C4.sage}>— v (tangent)</text>
        {cut && <g>
          <text x={20} y={288} fontFamily={C4.mono} fontSize={17} fill={C4.sage}>TANGENT. Not outward —</text>
          <text x={20} y={312} fontFamily={C4.mono} fontSize={17} fill={C4.sage}>the inward force just vanished.</text>
        </g>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        <S4 label="SPEED v" val={v} set={setV} min={1} max={8} step={0.5} unit="m/s" color={C4.sage} disabled={cut} />
        <S4 label="RADIUS r" val={r} set={setR} min={0.5} max={2} step={0.25} unit="m" color={C4.lav} disabled={cut} />
        <div style={{ display: 'flex', gap: 10 }}>
          <B4 small label="✂ CUT THE STRING" color={C4.gold} onClick={doCut} disabled={cut} />
          <B4 small label="RESET" color={C4.dim} onClick={reset} />
        </div>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
          <R4 label="MASS" value={`${m} kg`} color={C4.lav} />
          <R4 label={<>F<sub>c</sub> = mv²/r</>} value={`${Fc.toFixed(2)} N`} color={C4.gold} />
        </div>
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, lineHeight: 1.6 }}>Double v with the slider. F<sub>c</sub> quadruples — <span style={{ color: C4.ink }}>v is squared.</span></span>
      </div>
    </Wrap>
  );
}

/* ───────── NEWTON'S CANNON (Day 13) — fall around the planet ───────── */
function NewtonCannonSim() {
  const [vFrac, setVFrac] = useState(0.6);  // fraction of circular-orbit speed
  const [trails, setTrails] = useState([]);
  const [flying, setFlying] = useState(null);
  const [verdict, setVerdict] = useState('');
  const raf = useRef(null);
  const R = 78, CX = 250, CY = 185;   // planet px
  const fire = () => {
    cancelAnimationFrame(raf.current);
    const mountH = 26;
    const r0 = R + mountH;
    const vCirc = Math.sqrt(1 / r0) * 62;   // tuned units, GM=62²·... consistent below
    const GMu = 62 * 62;                    // so that vCirc = sqrt(GMu/r0)
    let x = 0, y = -r0, vx = vFrac * Math.sqrt(GMu / r0), vy = 0;
    const pts = [[x, y]];
    let t = 0, out = '';
    const dt = 0.016;
    const stepSim = () => {
      for (let k = 0; k < 6; k++) {
        const rr = Math.sqrt(x * x + y * y);
        const a = -GMu / (rr * rr * rr);
        vx += a * x * dt; vy += a * y * dt;
        x += vx * dt; y += vy * dt;
        t += dt;
        const r2 = Math.sqrt(x * x + y * y);
        if (r2 <= R) { out = 'CRASH — fell into the ground'; break; }
        if (r2 > 300) { out = 'ESCAPE — never coming back'; break; }
        const E = 0.5 * (vx * vx + vy * vy) - GMu / r2;
        if (t > 60 && !out) { out = E < -GMu / (2 * r0) * 0.98 && Math.abs(r2 - r0) < 6 ? 'ORBIT — falling and missing, forever' : 'ELLIPSE — orbit, but not circular'; break; }
        pts.push([x, y]);
      }
      setFlying({ pts: [...pts], x, y });
      if (!out) raf.current = requestAnimationFrame(stepSim);
      else {
        setVerdict(out);
        setTrails((ts) => [...ts.slice(-4), { pts: [...pts], out }]);
        setFlying(null);
      }
    };
    setVerdict(''); raf.current = requestAnimationFrame(stepSim);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const toSvg = (p) => `${CX + p[0]},${CY + p[1]}`;
  const col = (out) => out.startsWith('CRASH') ? '#C05A5A' : out.startsWith('ESCAPE') ? C4.lav : C4.sage;
  return (
    <Wrap row>
      <svg viewBox="0 0 500 370" style={{ width: 640, flex: 'none', background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}` }}>
        <circle cx={CX} cy={CY} r={R} fill="#262148" stroke={C4.line} strokeWidth={2} />
        <path d={`M ${CX - 14} ${CY - R + 2} L ${CX} ${CY - R - 26} L ${CX + 14} ${CY - R + 2} Z`} fill="#3A3458" stroke={C4.dim} strokeWidth={1.5} />
        {trails.map((tr, i) => <polyline key={i} points={tr.pts.map(toSvg).join(' ')} fill="none" stroke={col(tr.out)} strokeWidth={2} opacity={0.5} />)}
        {flying && <polyline points={flying.pts.map(toSvg).join(' ')} fill="none" stroke={C4.gold} strokeWidth={2.5} />}
        {flying && <circle cx={CX + flying.x} cy={CY + flying.y} r={7} fill={C4.gold} />}
        <text x={16} y={352} fontFamily={C4.mono} fontSize={15} fill={C4.dim}>green = orbit · red = crash · lavender = escape</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        <S4 label="LAUNCH SPEED" val={vFrac} set={setVFrac} min={0.2} max={1.55} step={0.05} fmt={(v) => `${(v * 100).toFixed(0)}% of orbit speed`} color={C4.gold} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <B4 small label="🔥 FIRE" onClick={fire} />
          <B4 small label="CLEAR TRAILS" color={C4.dim} onClick={() => { setTrails([]); setVerdict(''); }} />
        </div>
        <R4 label="VERDICT" value={verdict || '—'} color={verdict ? col(verdict) : C4.dim} />
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, lineHeight: 1.7 }}>
          Slow: the ground catches the fall.<br />Fast enough: <span style={{ color: C4.ink }}>the ground curves away exactly as fast as you fall.</span><br />That's all an orbit is.
        </span>
      </div>
    </Wrap>
  );
}

/* ───────── KEPLER EXPLORER (Day 14) — ellipse, equal areas, T² = a³ ───────── */
function keplerPos(Man, e) {
  let E = Man;
  for (let i = 0; i < 8; i++) E = E - (E - e * Math.sin(E) - Man) / (1 - e * Math.cos(E));
  const th = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const rr = (1 - e * e) / (1 + e * Math.cos(th));
  return { th, rr };
}
function KeplerSim() {
  const [a, setA] = useState(1.42);
  const [e, setE] = useState(0.31);
  const [tYr, setTYr] = useState(0);
  const [play, setPlay] = useState(true);
  const raf = useRef(null);
  const T = Math.pow(a, 1.5);
  useEffect(() => {
    if (!play) return;
    let last = performance.now();
    const step = (now) => {
      const dt = (now - last) / 1000; last = now;
      setTYr((t) => t + dt * 0.28);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [play]);
  const CX = 300, CY = 180, SC = 95;
  const Man = (tYr / T) * 2 * Math.PI;
  const { th, rr } = keplerPos(Man % (2 * Math.PI), e);
  const px = CX + a * rr * Math.cos(th) * SC, py = CY - a * rr * Math.sin(th) * SC;
  // wedge (equal-areas): shade the area swept over the last fixed Δt
  const wedge = [];
  const dM = 0.35;
  for (let i = 0; i <= 20; i++) {
    const kk = keplerPos((Man - dM + (i / 20) * dM + 20 * Math.PI) % (2 * Math.PI), e);
    wedge.push(`${CX + a * kk.rr * Math.cos(kk.th) * SC},${CY - a * kk.rr * Math.sin(kk.th) * SC}`);
  }
  const ell = [];
  for (let i = 0; i <= 120; i++) {
    const kk = keplerPos((i / 120) * 2 * Math.PI, e);
    ell.push(`${CX + a * kk.rr * Math.cos(kk.th) * SC},${CY - a * kk.rr * Math.sin(kk.th) * SC}`);
  }
  const vRel = Math.sqrt(2 / (a * rr) - 1 / a);
  return (
    <Wrap row>
      <svg viewBox="0 0 600 360" style={{ width: 660, flex: 'none', background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}` }}>
        <polygon points={`${CX},${CY} ${wedge.join(' ')}`} fill="rgba(224,169,61,0.25)" stroke="none" />
        <polyline points={ell.join(' ')} fill="none" stroke={C4.line} strokeWidth={2.5} />
        <circle cx={CX} cy={CY} r={13} fill={C4.gold} />
        <text x={CX} y={CY + 34} textAnchor="middle" fontFamily={C4.mono} fontSize={15} fill={C4.gold}>SUN (one focus)</text>
        <circle cx={px} cy={py} r={9} fill="#262148" stroke={C4.sage} strokeWidth={3} />
        <line x1={CX} y1={CY} x2={px} y2={py} stroke={C4.dim} strokeWidth={1.5} strokeDasharray="4 6" />
        {(() => { const kp = keplerPos(0, e), ka = keplerPos(Math.PI, e); return <g>
          <text x={CX + a * kp.rr * SC + 10} y={CY + 5} fontFamily={C4.mono} fontSize={14} fill={C4.lav}>perihelion · fast</text>
          <text x={Math.max(14, CX - a * ka.rr * SC + 14)} y={CY - 14} fontFamily={C4.mono} fontSize={14} fill={C4.lav}>aphelion · slow</text>
        </g>; })()}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        <S4 label="SEMI-MAJOR AXIS a" val={a} set={setA} min={0.6} max={2} step={0.02} unit="AU" color={C4.lav} />
        <S4 label="ECCENTRICITY e" val={e} set={setE} min={0} max={0.7} step={0.01} color={C4.sage} />
        <div style={{ display: 'flex', gap: 10 }}>
          <B4 small label={play ? '❚❚ PAUSE' : '▶ PLAY'} color={C4.gold} onClick={() => setPlay(!play)} />
          <B4 small label="2026-XJ PRESET" color={C4.gold} onClick={() => { setA(1.42); setE(0.31); }} />
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <R4 label="PERIOD  T = √a³" value={`${T.toFixed(2)} yr`} color={C4.gold} />
          <R4 label="SPEED NOW" value={`${vRel.toFixed(2)} ×`} color={C4.sage} />
        </div>
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, lineHeight: 1.7 }}>The gold wedge = area swept in a fixed time. <span style={{ color: C4.ink }}>Same area near AND far — so it must move faster when close.</span></span>
      </div>
    </Wrap>
  );
}

/* ───────── ARRIVAL (Day 15) — Earth vs 2026-XJ, do the orbits cross in TIME? ───────── */
function ArrivalSim() {
  const aX = 1.42, eX = 0.31, TX = Math.pow(aX, 1.5); // 1.69 yr
  const [tYr, setTYr] = useState(0);
  const [play, setPlay] = useState(false);
  const [phase0, setPhase0] = useState(0.62);  // asteroid's starting mean anomaly fraction (unknown-ish)
  const [minD, setMinD] = useState(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!play) return;
    let last = performance.now();
    const step = (now) => {
      const dt = (now - last) / 1000; last = now;
      setTYr((t) => t + dt * 0.22);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [play]);
  const CX = 300, CY = 185, SC = 92;
  const eTh = tYr * 2 * Math.PI;                        // Earth: 1 yr period, circular 1 AU
  const ex = CX + Math.cos(eTh) * SC, ey = CY - Math.sin(eTh) * SC;
  const Man = ((tYr / TX) + phase0) * 2 * Math.PI;
  const { th, rr } = keplerPos(Man % (2 * Math.PI), eX);
  const axp = CX + aX * rr * Math.cos(th) * SC, ayp = CY - aX * rr * Math.sin(th) * SC;
  const dAU = Math.sqrt(Math.pow((ex - axp) / SC, 2) + Math.pow((ey - ayp) / SC, 2));
  useEffect(() => { setMinD((m) => (m === null || dAU < m.d) ? { d: dAU, t: tYr } : m); }, [tYr]); // eslint-disable-line
  const ell = [];
  for (let i = 0; i <= 120; i++) {
    const kk = keplerPos((i / 120) * 2 * Math.PI, eX);
    ell.push(`${CX + aX * kk.rr * Math.cos(kk.th) * SC},${CY - aX * kk.rr * Math.sin(kk.th) * SC}`);
  }
  const dateOf = (t) => {
    const months = Math.round(t * 12);
    const M0 = 9, Y0 = 2026; // Oct 2026
    const mm = (M0 + months) % 12, yy = Y0 + Math.floor((M0 + months) / 12);
    return `${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][mm]} ${yy}`;
  };
  const close = dAU < 0.12;
  return (
    <Wrap row>
      <svg viewBox="0 0 600 370" style={{ flex: '1.3', minWidth: 640, background: C4.panel, borderRadius: 6, border: `1px solid ${C4.line}` }}>
        <circle cx={CX} cy={CY} r={13} fill={C4.gold} />
        <circle cx={CX} cy={CY} r={SC} fill="none" stroke={C4.sage} strokeWidth={2} strokeDasharray="3 6" />
        <text x={CX - SC - 10} y={CY - 8} textAnchor="end" fontFamily={C4.mono} fontSize={13} fill={C4.sage}>EARTH'S ORBIT · 1.00 AU</text>
        <polyline points={ell.join(' ')} fill="none" stroke={C4.lav} strokeWidth={2} strokeDasharray="3 6" />
        <line x1={CX + aX * (1 - eX) * SC} y1={CY - 10} x2={CX + aX * (1 - eX) * SC} y2={CY + 10} stroke={C4.gold} strokeWidth={3} />
        <text x={CX + aX * (1 - eX) * SC + 8} y={CY + 28} fontFamily={C4.mono} fontSize={13} fill={C4.gold}>peri 0.98 AU — inside</text>
        <circle cx={ex} cy={ey} r={9} fill="#262148" stroke={C4.sage} strokeWidth={3} />
        <text x={ex + 14} y={ey + 5} fontFamily={C4.mono} fontSize={14} fill={C4.sage}>EARTH</text>
        <circle cx={axp} cy={ayp} r={7} fill="#262148" stroke={C4.gold} strokeWidth={3} />
        <text x={axp + 12} y={ayp + 5} fontFamily={C4.mono} fontSize={14} fill={C4.gold}>2026-XJ</text>
        {close && <line x1={ex} y1={ey} x2={axp} y2={ayp} stroke="#C05A5A" strokeWidth={2.5} strokeDasharray="5 5" />}
        <text x={16} y={30} fontFamily={C4.mono} fontSize={17} fill={C4.ink}>{dateOf(tYr)}</text>
        {close && <text x={16} y={56} fontFamily={C4.mono} fontSize={16} fill="#C05A5A">CLOSE PASS — {dAU.toFixed(2)} AU</text>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <B4 small label={play ? '❚❚ PAUSE' : '▶ RUN THE CLOCK'} color={C4.gold} onClick={() => setPlay(!play)} />
          <B4 small label="RESTART · OCT 2026" color={C4.dim} onClick={() => { setTYr(0); setMinD(null); setPlay(false); }} />
        </div>
        <S4 label="WHERE IN ITS ORBIT IS IT NOW? (uncertain!)" val={phase0} set={(v) => { setPhase0(v); setMinD(null); }} min={0} max={1} step={0.01} fmt={(v) => `${(v * 100).toFixed(0)}%`} color={C4.lav} />
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <R4 label="SEPARATION NOW" value={`${dAU.toFixed(2)} AU`} color={close ? '#C05A5A' : C4.ink} />
          <R4 label="CLOSEST SO FAR" value={minD ? `${minD.d.toFixed(2)} AU · ${dateOf(minD.t)}` : '—'} color={C4.gold} />
        </div>
        <span style={{ fontFamily: C4.mono, fontSize: 15, color: C4.dim, lineHeight: 1.7 }}>
          Orbits crossing in SPACE isn't the danger — <span style={{ color: C4.ink }}>arriving at the crossing at the same TIME is.</span> Drag the phase slider: our biggest uncertainty.
        </span>
      </div>
    </Wrap>
  );
}

module.exports = { FreeFallVTSim, WeightWorldsSim, InverseSquareSim, FieldMapSim, ProjectileSim, CircularSim, NewtonCannonSim, KeplerSim, ArrivalSim };
