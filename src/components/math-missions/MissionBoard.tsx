'use client'

import { useId, useState } from 'react'
import type { Answer, PublicTask } from '@/lib/math-missions/types'
import { modelNumber, scientificIncoming } from '@/lib/math-missions/model-math'
import InstrumentPanel from './InstrumentPanel'
import styles from './missions.module.css'

const fmt = (value: number, places = 3) => Number.isFinite(value) ? Number(value.toFixed(places)).toString() : '—'
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
interface Props { task: PublicTask; answer: Answer; onChange: (answer: Answer) => void; disabled?: boolean; supported?: boolean }

export default function MissionBoard({ task, answer, onChange, disabled = false, supported = false }: Props) {
  const marker = useId().replaceAll(':', '')
  const [operations, setOperations] = useState<string[]>([])
  const [time, setTime] = useState(0)
  const [run, setRun] = useState(false)
  const d = task.data
  const n = (key: string, fallback = 0) => modelNumber(answer[key], fallback)
  const set = (key: string, value: string) => onChange({ ...answer, ...(key === 'axis' ? { slope: '', intercept: '' } : {}), [key]: value })
  const slider = (key: string, label: string, min: number, max: number, step: number) => <label className={styles.slider}>{label}<input aria-label={label} type="range" disabled={disabled} min={min} max={max} step={step} value={clamp(n(key, min), min, max)} onChange={e => set(key, e.target.value)} /><output>{answer[key] || 'Choose a value'}</output></label>
  const arrows = <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke" /></marker></defs>

  if (task.board === 'numberline') {
    const min = Number(d.min), max = Number(d.max), position = n('position', min), x = 60 + (position - min) / (max - min) * 480
    const denominator = Number(d.denominator || 10), share = clamp(Math.abs(position), 0, 1)
    return <InstrumentPanel kind={task.board}>
      <div className={styles.boardLabel}>ROVER NAVIGATION <span>One whole · many names</span></div>
      <svg viewBox="0 0 600 290" role="img" aria-label={`Number line from ${min} to ${max}; rover at ${fmt(position)}. Each large interval is one tenth.`}>
        <rect x="26" y="28" width="548" height="226" rx="18" fill="#081a27" stroke="#54788a" />
        <text x="50" y="63" className={styles.scaleLabel}>TARGET LANDING</text>
        <text x="550" y="69" textAnchor="end" className={styles.svgHeadline}>{d.numerator ? `${d.numerator}/${d.denominator}` : String(d.target)}</text>
        <path d="M60 174H540" stroke="#7298ab" strokeWidth="3" />
        {Array.from({ length: 101 }, (_, i) => <path key={i} d={`M${60 + i * 4.8} 174v${i % 10 === 0 ? 24 : i % 5 === 0 ? 15 : 7}`} stroke="#bed5df" opacity={i % 10 === 0 ? 1 : .4} />)}
        {Array.from({ length: 11 }, (_, i) => <text key={i} x={60 + i * 48} y="224" textAnchor="middle" className={styles.scaleLabel}>{fmt(min + (max - min) * i / 10)}</text>)}
        <g transform={`translate(${clamp(x, 60, 540)},165)`} className={styles.cursor}>
          <circle cy="-6" r="28" fill="var(--mission-color)" opacity=".08" /><path d="M-22 -11h44l-8 -18H-12z" fill="var(--mission-color)" />
          <rect x="-27" y="-11" width="54" height="19" rx="6" fill="#295269" stroke="var(--mission-color)" strokeWidth="2" />
          <circle cx="-17" cy="10" r="8" fill="#091827" stroke="#cfedf2" strokeWidth="2" /><circle cx="17" cy="10" r="8" fill="#091827" stroke="#cfedf2" strokeWidth="2" />
          <path d="M-6 -24h15l-4 -9h-8z" fill="#0b2333" /><path d="M0 -30v-10" stroke="var(--mission-color)" />
          <rect x="-38" y="-72" width="76" height="28" rx="8" fill="var(--mission-color)" /><text y="-52" textAnchor="middle" style={{ fill: '#092731', fontWeight: 700 }}>{fmt(position)}</text>
        </g>
        <text x="300" y="277" textAnchor="middle">← smaller values · larger values →</text>
      </svg>
      <div className={styles.partitionModel} aria-label={`One whole split into ${denominator} equal parts; shading follows the magnitude of your rover position.`}>
        <span>ONE WHOLE / {denominator} EQUAL PARTS</span>
        <div style={{ gridTemplateColumns: `repeat(${denominator},1fr)` }}>{Array.from({ length: denominator }, (_, i) => <i key={i} style={{ background: `linear-gradient(90deg,var(--mission-color) ${clamp(share * denominator - i, 0, 1) * 100}%,#18394a 0)` }} />)}</div>
      </div>
      {slider('position', 'Pilot the rover', min, max, task.code === 'NS2' ? .005 : .01)}
      <p className={styles.boardNote}>Drag, use arrow keys, or type an exact fraction in Rover position. The shaded strip shows magnitude; the number line shows sign.</p>
    </InstrumentPanel>
  }

  if (task.board === 'reactor') {
    const ratio = task.code === 'PR1', input = n(ratio ? 'input' : 'output'), factor = Number(d.factor || 1)
    const left = ratio ? input : factor, right = ratio ? Number(d.target) : input
    const capacity = Math.max(1, left, right, ratio ? Number(d.target) * 1.25 : Math.max(16, factor ** Number(d.power) * 2))
    const predictedB = input * Number(d.b) / Number(d.a)
    return <InstrumentPanel kind={task.board}>
      <div className={styles.boardLabel}>RATIO REACTOR <span>{ratio ? 'Keep the recipe' : String(d.relation)}</span></div>
      <div className={styles.recipe}>{ratio ? <><span>REFERENCE BATCH</span><strong>{d.a} A <b>:</b> {d.b} B</strong></> : <><span>REFERENCE STATE</span><strong>x × 1 <b>→</b> y × 1</strong></>}</div>
      <div className={styles.reactor}>
        <div><span>{ratio ? 'Your parts A' : 'Input factor'}</span><div className={styles.chamber}><i style={{ transform: `scaleY(${clamp(left / capacity, 0, 1)})` }} /><strong>{fmt(left)}</strong></div></div>
        <div className={styles.reactorLink}><span>{ratio ? 'same multiplier' : String(d.relation)}</span><b>→</b><small>{ratio ? 'both ingredients' : 'predict the change'}</small></div>
        <div><span>{ratio ? 'Required parts B' : 'Your output factor'}</span><div className={styles.chamber}><i style={{ transform: `scaleY(${clamp(right / capacity, 0, 1)})` }} /><strong>{fmt(right)}</strong></div></div>
      </div>
      <p className={styles.scaleCaption}>Both columns use the same scale: 0–{fmt(capacity)} {ratio ? 'parts' : '×'}.</p>
      {slider(ratio ? 'input' : 'output', ratio ? 'Tune parts A' : 'Tune the output factor', 0, ratio ? Number(d.target) / Number(d.b) * Number(d.a) * 2 : Math.max(16, factor ** Number(d.power) * 2), ratio ? 1 : .001)}
      <button className={styles.secondary} disabled={disabled} onClick={() => setRun(!run)}>{run ? 'Close batch test' : 'Test my prediction'}</button>
      {run && <div className={styles.modelResult} role="status">{ratio ? <>Your {fmt(input)} parts A would pair with <strong>{fmt(predictedB)} parts B</strong> using the recipe. Compare that with the required {d.target} B.</> : <>Your prediction changes y from 1 to <strong>{fmt(input)}</strong>. That is {input < 1 ? 'smaller' : input > 1 ? 'larger' : 'unchanged'}. Does that direction and size agree with {d.relation}?</>}</div>}
      <p className={styles.boardNote}>A factor describes multiplication. Use a fraction such as 1/9 when a decimal repeats.</p>
    </InstrumentPanel>
  }

  if (task.board === 'courier') {
    const scientific = !!d.scientific, speed = !!d.speed
    const bridges = task.fields.filter(f => f.kind === 'select')
    const distanceCancels = answer.bridge1 === '1000 m / 1 km', timeCancels = answer.bridge2 === '1 h / 3600 s', areaCancels = answer.bridge1 === '(100 cm / 1 m)²'
    return <InstrumentPanel kind={task.board}>
      <div className={styles.boardLabel}>UNIT COURIER <span>Change the package, keep the quantity</span></div>
      <div className={styles.courierRoute}><div className={styles.parcel}><span>INCOMING QUANTITY</span><strong>{scientific ? scientificIncoming(d) : `${d.value} ${d.from}`}</strong></div><span aria-hidden="true">→</span><div className={styles.parcel}><span>YOUR DELIVERY</span><strong>{scientific ? `${answer.mantissa || '?'} × 10^${answer.exponent || '?'}` : `${answer.result || '?'} ${d.to}`}</strong></div></div>
      {scientific ? <>
        <div className={styles.notationRail}><span>COEFFICIENT</span><strong>{answer.mantissa || '?'}</strong><b>×</b><strong>10<sup>{answer.exponent || '?'}</sup></strong><span>POWER OF TEN</span></div>
        {slider('exponent', 'Move the power of ten', -12, 12, 1)}
        <p className={styles.boardNote}>Multiply every incoming factor. A coefficient shift to the left needs a compensating increase in the power. The final coefficient belongs in [1, 10).</p>
      </> : <>
        <div className={styles.unitRoute} aria-label="Unit cancellation trace"><span>{d.value} <b data-cancel={speed && distanceCancels || !speed && areaCancels}>{speed ? 'km' : 'm²'}</b>{speed && <> / <b data-cancel={timeCancels}>h</b></>}</span>{bridges.map(f => <span key={f.id}>× <strong>{answer[f.id] || 'choose a bridge'}</strong></span>)}<span>→ <strong>{speed ? distanceCancels && timeCancels ? 'm/s' : 'check both units' : areaCancels ? 'cm²' : 'check both dimensions'}</strong></span></div>
        <div className={styles.bridges}>{bridges.map(f => <fieldset key={f.id}><legend>{f.label}</legend>{f.options?.map(o => <button key={o.value} aria-pressed={answer[f.id] === o.value} disabled={disabled} className={answer[f.id] === o.value ? styles.selected : styles.secondary} onClick={() => set(f.id, o.value)}>{o.label}</button>)}</fieldset>)}</div>
        {!speed && <div className={styles.areaTiles} aria-label="Area conversion changes two dimensions"><span>1 m = 100 cm</span><div><b>100 rows</b><strong>×</strong><b>100 columns</b></div><span>One square metre contains 10,000 square centimetres.</span></div>}
        <p className={styles.boardNote}>Crossed units cancel because the same unit is above and below. A backwards bridge does not cancel the unit you started with.</p>
      </>}
    </InstrumentPanel>
  }

  if (task.board === 'precision') {
    if (d.estimation) {
      const length = Number(d.length), width = Number(d.width), area = length * width, fraction = clamp(n('area') / area, 0, 1), scale = Math.min(430 / length, 180 / width), w = length * scale, h = width * scale, x = (600 - w) / 2
      const estimate = n('space') > 0 ? n('area') / n('space') : 0
      return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>PRECISION OBSERVATORY <span>Make assumptions visible</span></div>
        <svg viewBox="0 0 600 300" role="img" aria-label={`Hall ${length} by ${width} metres, drawn to scale. Your usable area is ${fmt(n('area'))} of ${area} square metres.`}><defs><pattern id={marker} width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#466474" strokeWidth=".6" /></pattern></defs><rect x={x} y="50" width={w} height={h} rx="5" fill={`url(#${marker})`} stroke="#b4cad4" strokeWidth="2" /><rect x={x} y={50 + h * (1 - fraction)} width={w} height={h * fraction} fill="var(--mission-color)" opacity=".3" /><text x="300" y={h + 86} textAnchor="middle">{length} m</text><text x={x - 14} y={50 + h / 2} textAnchor="end">{width} m</text><text x="300" y="28" textAnchor="middle">USABLE FLOOR / FULL FLOOR</text><text x="300" y="282" textAnchor="middle">Tint follows your usable-area assumption.</text></svg>
        <div className={styles.machineSlots}><span>Floor area<strong>{area} m²</strong></span><span>Your usable area<strong>{answer.area || '?'} m²</strong></span><span>Space per person<strong>{answer.space || '?'} m²</strong></span></div>
        {supported && <p className={styles.boardReadout}>Your assumptions imply approximately {fmt(estimate, 1)} people.</p>}
        <p className={styles.boardNote}>Furniture, aisles and personal space change your estimate. Explain the range; this model is not an occupancy limit.</p>
      </InstrumentPanel>
    }
    const value = Number(d.measurement), min = Number(d.min), max = Number(d.max), mark = 60 + (value - min) / (max - min) * 480
    return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>MEASUREMENT BENCH <span>Resolution: 0.1 cm</span></div>
      <svg viewBox="0 0 600 280" role="img" aria-label={`Instrument reading ${value.toFixed(1)} centimetres, resolution one tenth centimetre.`}><rect x="40" y="140" width="520" height="80" rx="8" fill="#c6d9cb" />{Array.from({ length: Math.round((max - min) * 10) + 1 }, (_, i) => { const x = 60 + i / (10 * (max - min)) * 480; return <g key={i}><path d={`M${x} 140v${i % 10 === 0 ? 38 : i % 5 === 0 ? 27 : 16}`} stroke="#234338" strokeWidth={i % 10 === 0 ? 2 : 1} />{i % 10 === 0 && <text x={x} y="204" textAnchor="middle" style={{ fill: '#173b31' }}>{min + i / 10}</text>}</g> })}<path d={`M${mark} 69v62l-10 -14m10 14l10 -14`} stroke="var(--mission-color)" strokeWidth="4" fill="none" /><text x="300" y="40" textAnchor="middle">READ → CALCULATE → ROUND ONCE</text><text x="300" y="252" textAnchor="middle">centimetres · ten small intervals per centimetre</text></svg>
      <div className={styles.precisionRule}><strong>{d.adding ? 'Addition → decimal places' : 'Multiplication → significant figures'}</strong><p>{d.adding ? 'The least precise measured decimal place sets the final place.' : 'An exact factor does not add measurement precision.'}</p></div>
      <p className={styles.boardNote}>Keep meaningful zeros. Scientific notation such as 1.20e1 is also accepted when it communicates the required precision.</p>
    </InstrumentPanel>
  }

  if (task.board === 'balance') {
    if (d.substitution) {
      const u = Number(d.u), a = Number(d.a), t = Number(d.t)
      return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>VELOCITY MACHINE <span>Keep the signs and units</span></div><div className={styles.machineFormula}><span>START</span><strong>u</strong><b>+</b><strong>a × t</strong><b>=</b><strong>v</strong><span>FINISH</span></div><div className={styles.machineSlots}><span>Initial velocity<strong>{u} m/s</strong></span><span>Acceleration<strong>{a} m/s²</strong></span><span>Time<strong>{t} s</strong></span></div><div className={styles.equation}>({u}) + ({a}) × ({t})</div><p className={styles.modelResult}>First find the change in velocity: ({a} m/s²) × ({t} s). The seconds cancel once, leaving m/s. Then add the initial velocity.</p><button className={styles.secondary} disabled={disabled} onClick={() => set('expression',`(${u})+(${a})*(${t})`)}>Place the values in the expression</button><p className={styles.boardNote}>A negative final velocity means motion in the negative direction; it does not mean a negative speed.</p></InstrumentPanel>
    }
    const sub = operations.includes('subtract'), div = operations.includes('divide')
    const left = sub ? div ? `(${d.c} − ${d.b}) / ${d.a}` : `${d.c} − ${d.b}` : div ? `${d.c}/${d.a}` : String(d.c)
    const right = sub ? div ? String(d.x) : `${d.a}·${d.x}` : div ? `${d.b}/${d.a} + ${d.x}` : `${d.b} + ${d.a}·${d.x}`
    return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>BALANCE BAY <span>Isolate {d.x}</span></div><div className={styles.balance}><div>{left}</div><b>=</b><div>{right}</div></div><div className={styles.balanceBeam} /><ol className={styles.operationTrail} aria-label="Operations applied">{operations.length ? operations.map((op, i) => <li key={op}><b>{i + 1}</b>{op === 'divide' ? `Divide BOTH sides by ${d.a}.` : `Subtract ${i === 1 && div ? `${d.b}/${d.a}` : d.b} from BOTH sides.`}</li>) : <li>Choose an operation. Both sides will change together.</li>}</ol><div className={styles.operations}><button disabled={disabled || sub} onClick={() => { setOperations([...operations, 'subtract']); if (div) set('formula',`(${d.c}-${d.b})/${d.a}`) }}>Subtract {div ? `${d.b}/${d.a}` : d.b} from both sides</button><button disabled={disabled || div} onClick={() => { setOperations([...operations, 'divide']); if (sub) set('formula',`(${d.c}-${d.b})/${d.a}`) }}>Divide both sides by {d.a}</button><button className={styles.secondary} disabled={disabled || !operations.length} onClick={() => { setOperations(operations.slice(0, -1)); set('formula','') }}>Undo</button></div><p className={styles.boardNote}>Keep each entire side grouped. Dividing assumes {d.a} ≠ 0. Equivalent operation orders are accepted.</p></InstrumentPanel>
  }

  if (task.board === 'motion') {
    if (d.slopeTask) {
      const start = Number(d.start), end = Number(d.end), duration = Number(d.duration), lo = Math.min(0, start, end) - 2, hi = Math.max(0, start, end) + 2, y = (v: number) => 235 - (v - lo) / (hi - lo) * 190
      return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>MOTION MAPPER <span>Position changes over time</span></div><svg viewBox="0 0 600 320" role="img" aria-label={`Position-time graph from (0 seconds, ${start} metres) to (${duration} seconds, ${end} metres).`}><path d="M80 35V245H540" stroke="#afc7d6" fill="none" /><path d={`M80 ${y(0)}H530`} stroke="#93b0c3" strokeDasharray="4 5" /><path d={`M80 ${y(start)}L520 ${y(end)}`} stroke="var(--mission-color)" strokeWidth="4" />{supported && <path d={`M80 ${y(start)}H520V${y(end)}`} stroke="#f7cf84" fill="none" strokeDasharray="6 4" />}{[start, end].map((value, i) => <g key={i}><circle cx={i ? 520 : 80} cy={y(value)} r="7" fill="var(--mission-color)" /><text x={i ? 507 : 94} y={y(value) - 15} textAnchor={i ? 'end' : 'start'}>({i ? duration : 0}, {value})</text></g>)}<text x="65" y={y(0) + 5} textAnchor="end">0</text><text x="80" y="270">0</text><text x="520" y="270">{duration}</text><text x="300" y="302" textAnchor="middle">time (s)</text><text x="15" y="23">position (m)</text></svg>{supported && <p className={styles.boardReadout}>Rise = {end - start} m · run = {duration} s</p>}<p className={styles.boardNote}>Compare the two endpoints. Graph height is position; slope is the rate at which that position changes.</p></InstrumentPanel>
    }
    if (d.fit) {
      const xs = d.xs as number[], ys = d.ys as number[], axis = answer.axis || 'x', values = xs.map(x => axis === 'x²' ? x*x : axis === '1/x' ? 1/x : x), maxX = Math.max(...values), maxY = Math.max(...ys) * 1.15
      const fitted = !!answer.slope && !!answer.intercept, px = (x: number) => 70 + x / maxX * 450, py = (y: number) => 232 - y / maxY * 180
      return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>SENSOR ANALYSIS <span>Transform → fit → interpret</span></div><svg viewBox="0 0 600 310" role="img" aria-label={`Scatter plot of y against ${axis}. Dotted segments show differences from your fitted line; readings are in the table.`}><defs><clipPath id={marker}><rect x="70" y="25" width="465" height="210" /></clipPath></defs><path d="M70 25V235H550" fill="none" stroke="#b5ccd7" /><g clipPath={`url(#${marker})`}>{values.map((x, i) => <g key={i}>{fitted && <path d={`M${px(x)} ${py(ys[i])}V${py(n('slope')*x+n('intercept'))}`} stroke="#f5cb80" strokeDasharray="3 3" />}<circle cx={px(x)} cy={py(ys[i])} r="7" fill="var(--mission-color)" /></g>)}{fitted && <path d={`M70 ${py(n('intercept'))}L520 ${py(n('slope')*maxX+n('intercept'))}`} stroke="#fff" strokeWidth="2" />}</g><text x="300" y="295" textAnchor="middle">{axis} ({axis === 'x²' ? 's²' : axis === '1/x' ? '1/s' : 's'})</text><text x="12" y="21">y (m)</text>{[0,.5,1].map(f => <g key={f}><text x={px(f*maxX)} y="258" textAnchor="middle">{fmt(maxX*f)}</text><text x="58" y={py(maxY*f)+5} textAnchor="end">{fmt(maxY*f)}</text></g>)}</svg><table className={styles.dataTable}><caption>Sensor readings · compare the shape before fitting</caption><thead><tr><th scope="row">x (s)</th>{xs.map((x,i) => <th key={i}>{x}</th>)}</tr></thead><tbody><tr><th scope="row">y (m)</th>{ys.map((y,i) => <td key={i}>{y}</td>)}</tr></tbody></table><div className={styles.operations}>{['x','x²','1/x'].map(x => <button aria-pressed={axis===x} className={axis===x?styles.selected:styles.secondary} disabled={disabled} key={x} onClick={() => set('axis',x)}>Plot {x}</button>)}</div><button className={styles.secondary} disabled={disabled} onClick={() => { const xm=values.reduce((a,b)=>a+b,0)/values.length,ym=ys.reduce((a,b)=>a+b,0)/ys.length,m=values.reduce((sum,x,i)=>sum+(x-xm)*(ys[i]-ym),0)/values.reduce((sum,x)=>sum+(x-xm)**2,0); onChange({...answer,axis,slope:m.toFixed(4),intercept:(ym-m*xm).toFixed(4)}) }}>Fit selected axes</button><p className={styles.boardNote}>Changing axes clears the previous fit. Small residuals suggest a better model; a zero intercept is a separate test for proportionality.</p></InstrumentPanel>
    }
    const v=Number(d.v),duration=Number(d.duration),returnTime=Number(d.returnTime),rv=n('returnVelocity'),total=duration+returnTime,now=clamp(time,0,total),position=v*Math.min(now,duration)+rv*Math.max(0,now-duration),extent=Math.max(1,v*duration,Math.abs(v*duration+rv*returnTime)),robot=300+position/extent*220,velocityExtent=Math.max(15,Math.ceil(Math.max(Math.abs(v),Math.abs(rv))/5)*5),velocityScale=95/velocityExtent,y=(value:number)=>140-value*velocityScale,split=70+duration/total*450
    return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>ROBOT RETURN ROUTE <span>Signed area becomes displacement</span></div><svg viewBox="0 0 600 285" role="img" aria-label={`Velocity-time graph: ${v} metres per second for ${duration} seconds, then your ${fmt(rv)} for ${returnTime} seconds.`}><path d="M70 28V238M70 140H535" stroke="#b2c9d6" fill="none" /><rect x="70" y={Math.min(140,y(v))} width={split-70} height={Math.abs(v)*velocityScale} fill="var(--mission-color)" opacity=".28" /><rect x={split} y={Math.min(140,y(rv))} width={520-split} height={Math.abs(rv)*velocityScale} fill="#f7c788" opacity=".3" /><path d={`M70 ${y(v)}H${split}V${y(rv)}H520`} stroke="var(--mission-color)" strokeWidth="3" fill="none" /><path d={`M${70+now/total*450} 25V238`} stroke="#fff" strokeDasharray="4 5" /><text x="8" y="20">v (m/s)</text><text x="300" y="274" textAnchor="middle">time (s)</text>{[0,duration,total].map((a,i)=><text key={i} x={70+a/total*450} y="257" textAnchor="middle">{a}</text>)}{[-velocityExtent,-velocityExtent/2,0,velocityExtent/2,velocityExtent].map(a=><text key={a} x="60" y={y(a)+5} textAnchor="end">{a}</text>)}</svg>{slider('returnVelocity','Set the return velocity',-15,15,.01)}<div className={styles.tripModel}><svg viewBox="0 0 600 95" role="img" aria-label={`At ${fmt(now)} seconds the robot is ${fmt(position)} metres from home.`}><path d="M60 55H540" stroke="#809daf" strokeWidth="2" /><path d="M300 25V72" stroke="#b5d7cb" strokeDasharray="3 3" /><text x="300" y="88" textAnchor="middle">HOME / 0 m</text><g transform={`translate(${clamp(robot,60,540)},40)`}><rect x="-19" y="-13" width="38" height="24" rx="7" fill="var(--mission-color)" /><circle cx="-11" cy="13" r="6" fill="#bdd6de" /><circle cx="11" cy="13" r="6" fill="#bdd6de" /></g></svg><label className={styles.slider}>Explore the trip<input type="range" aria-label="Explore the trip" min="0" max={total} step="0.1" value={now} onChange={e=>setTime(Number(e.target.value))}/><output>{fmt(now)} s</output></label><p>Position: <strong>{fmt(position)} m</strong> · Distance so far: <strong>{fmt(Math.abs(v*Math.min(now,duration))+Math.abs(rv*Math.max(0,now-duration)))} m</strong></p></div><p className={styles.boardNote}>Scrub time to test your prediction. The two signed areas can cancel even though both legs add to distance travelled.</p></InstrumentPanel>
  }

  const vx=n('x'),vy=n('y'),wind=Number(d.wind),rx=vx+wind,speed=Number(d.speed),rad=(d.reference==='positive y'?90-Number(d.angle):Number(d.angle))*Math.PI/180,tx=speed*Math.cos(rad),ty=speed*Math.sin(rad),extent=Math.ceil(Math.max(25,Math.abs(rx),Math.abs(vx),Math.abs(vy))/10)*10,scale=120/extent
  return <InstrumentPanel kind={task.board}><div className={styles.boardLabel}>VECTOR RESCUE <span>Plan thrust · add wind · fly</span></div><svg viewBox="0 0 600 355" role="img" aria-label={`Equal-scale coordinate plane. Requested thrust ${speed} metres per second at ${d.angle} degrees from ${d.reference}. Your thrust is (${fmt(vx)}, ${fmt(vy)}), wind (${wind}, 0), resultant (${fmt(rx)}, ${fmt(vy)}).`}>{arrows}{[-extent,-extent/2,0,extent/2,extent].map(a=><g key={a}><path d={`M${300+a*scale} 30V310M160 ${170-a*scale}H445`} stroke="#8fb0c4" opacity=".18" /><text x={300+a*scale} y="337" textAnchor="middle">{a}</text><text x="142" y={175-a*scale} textAnchor="end">{a}</text></g>)}<path d="M155 170H465M300 312V24" stroke="#adc7d7" /><path d={`M300 170L${300+tx*scale} ${170-ty*scale}`} stroke="#92aabb" strokeWidth="6" opacity=".5" markerEnd={`url(#${marker})`} /><path d={`M300 170H${300+vx*scale}V${170-vy*scale}`} stroke="var(--mission-color)" strokeDasharray="4 4" fill="none" /><path d={`M300 170L${300+vx*scale} ${170-vy*scale}`} stroke="var(--mission-color)" strokeWidth="3" markerEnd={`url(#${marker})`} /><path d={`M${300+vx*scale} ${170-vy*scale}h${wind*scale}`} stroke="#ffcb80" strokeWidth="3" markerEnd={`url(#${marker})`} /><path d={`M300 170L${300+rx*scale} ${170-vy*scale}`} stroke="#fff" strokeWidth="2" strokeDasharray="6 4" markerEnd={`url(#${marker})`} /><text x="478" y="175">+x</text><text x="313" y="26">+y</text></svg><div className={styles.vectorLegend}><span>━ Your thrust</span><span>━ Wind</span><span>┄ Resultant</span><span>━ Target thrust</span></div><div className={styles.machineSlots}><span>Target thrust<strong>{speed} m/s</strong></span><span>Angle reference<strong>{d.angle}° from {d.reference}</strong></span><span>Wind in x<strong>{wind} m/s</strong></span></div><div className={styles.liveReadout}><span>YOUR RESULTANT</span><strong>({fmt(rx)}, {fmt(vy)}) <small>m/s</small></strong></div>{slider('x','Aim the thrust x component',-25,25,.01)}{slider('y','Aim the thrust y component',-25,25,.01)}<p className={styles.boardNote}>Match the grey target using perpendicular components. Wind starts at the tip of your thrust. Read the prompt’s rotation direction before choosing component signs.</p></InstrumentPanel>
}
