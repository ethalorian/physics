'use client'
import {FrontierChapterFigure,FRONTIER_VISUALS} from './FrontierChapterFigures'
import {ModernChapterFigure,MODERN_VISUALS} from './ModernChapterFigures'
import {NuclearChapterFigure,NUCLEAR_VISUALS} from './NuclearChapterFigures'
import {QuantumChapterFigure,QUANTUM_VISUALS} from './QuantumChapterFigures'
import {FoundationChapterFigure,FOUNDATION_VISUALS} from './FoundationChapterFigures'
import {MagneticChapterFigure,MAGNETIC_VISUALS} from './MagneticChapterFigures'
import {CircuitChapterFigure,CIRCUIT_VISUALS} from './CircuitChapterFigures'
import {ElectrostaticChapterFigure,ELECTROSTATIC_VISUALS} from './ElectrostaticChapterFigures'
import {WaveOpticsChapterFigure,WAVE_OPTICS_VISUALS} from './WaveOpticsChapterFigures'
import {OpticsChapterFigure,OPTICS_VISUALS} from './OpticsChapterFigures'
import {RelativityChapterFigure} from './RelativityChapterFigures'
import {MatterChapterFigure} from './MatterChapterFigures'
import {FluidChapterFigure} from './FluidChapterFigures'
import { LightChapterFigure, LIGHT_VISUALS } from './LightChapterFigures'
import { WaveChapterFigure, WAVE_VISUALS } from './WaveChapterFigures'
import { ThermalChapterFigure, THERMAL_VISUALS } from './ThermalChapterFigures'
import MotionChapterFigure from './MotionChapterFigures'
import { useState, type ReactNode } from 'react'
import Arrow from './PhysicsArrow'
import type { ChapterVisual } from './connected-chapters'
import styles from './connected-chapters.module.css'

function Figure({ id, title, children, caption }: { id: string; title: string; children: ReactNode; caption: string }) {
  return <figure id={`figure-${id}`} className={styles.figure}><p className={styles.kicker}>LOOK · PREDICT · EXPLAIN</p><h3>{title}</h3>{children}<figcaption>{caption}</figcaption></figure>
}
function Glide({ evidence = false }: { evidence?: boolean }) {
  const [rough, setRough] = useState(true)
  // Equal-time snapshots: v0 = 4 m/s, a = -1 m/s² until rest, or a = 0.
  const positions = [0, 1, 2, 3, 4].map(t => 45 + 30 * (4 * t - (rough ? .5 * t * t : 0)))
  return <Figure id={evidence ? 'evidence' : 'glide'} title="What changes when resistance changes?" caption="Dots show positions one second apart, all on the same distance scale. The ideal surface has zero horizontal resistance. On both level surfaces, support and weight balance vertically.">
    <div className={styles.switches} role="group" aria-label="Surface resistance"><button aria-pressed={rough} onClick={() => setRough(true)}>With resistance</button><button aria-pressed={!rough} onClick={() => setRough(false)}>Ideal level surface</button></div>
    <svg viewBox="0 0 600 180" role="img" aria-label={rough ? 'Equal-time dots get closer together as the object slows.' : 'Equal-time dots are evenly spaced as velocity stays constant.'}><path d="M30 118H570" stroke="#a7bcae" strokeWidth="3" />{positions.map((x, i) => <g key={i}><circle cx={x} cy="95" r="10" fill="#28634c" opacity={.35 + .15 * i} /><text x={x} y="150" textAnchor="middle">{i} s</text></g>)}<Arrow x={positions[0]} y={50} dx={80} dy={0} /><text x="160" y="55">Same starting velocity →</text></svg>
    <p className={styles.result} aria-live="polite">{rough ? 'Shrinking gaps → decreasing speed → nonzero backward net force.' : 'Equal gaps → constant velocity → zero net horizontal force.'}</p>
  </Figure>
}
function Ramps() {
  const [angle, setAngle] = useState(40), [flat, setFlat] = useState(false)
  const end = 190 + 120 / Math.tan(angle * Math.PI / 180)
  return <Figure id="ramps" title="One height. A changing distance." caption="Ideal low-loss comparison: the ball reaches the same vertical height on the return ramp. Changing the ramp angle changes the distance, not the available energy. Real rolling resistance makes the return height smaller.">
    <svg viewBox="0 0 600 260" role="img" aria-label={flat ? 'A ball rolls down a ramp onto a level track, where ideal motion continues.' : `A ball rolls down one ramp and up a ${angle} degree return ramp to its original height.`}><path d={`M35 65L190 185L${flat ? 565 : end} ${flat ? 185 : 65}`} stroke="#547258" strokeWidth="7" fill="none" /><path d="M25 53H575" stroke="#b58d4b" strokeDasharray="5 6" /><circle cx="43" cy="54" r="11" fill="#b46a43" /><circle cx={flat ? 480 : end - 7} cy={flat ? 173 : 53} r="11" fill="#28634c" /><text x="35" y="25">Release height</text><text x="195" y="228">{flat ? 'Level: no return to the starting height' : `Return slope: ${angle}°`}</text>{flat ? <Arrow x={500} y={150} dx={55} dy={0} /> : null}</svg>
    <label className={styles.control}>Return-ramp angle <strong>{flat ? '0° · level' : `${angle}°`}</strong><input aria-label="Return-ramp angle" type="range" min="20" max="60" step="5" value={angle} disabled={flat} onChange={e => setAngle(+e.target.value)} /></label><label className={styles.toggle}><input type="checkbox" checked={flat} onChange={e => setFlat(e.target.checked)} /> Explore the level limit</label>
    <p className={styles.result} aria-live="polite">{flat ? 'No uphill section, no resistance: horizontal velocity persists.' : `For a 1 m rise, the return path is ${(1 / Math.sin(angle * Math.PI / 180)).toFixed(2)} m long.`}</p>
  </Figure>
}
function Mass() {
  const [moon, setMoon] = useState(false), [mass, setMass] = useState(5)
  const g = moon ? 1.6 : 9.8
  return <Figure id="mass" title="Change the world, keep the object." caption="Mass controls the response to the same net force. Weight also depends on local gravity. This model assumes a 10 N net horizontal force; gravitational weight acts vertically and is balanced by the level support.">
    <div className={styles.switches} role="group" aria-label="Gravitational environment"><button aria-pressed={!moon} onClick={() => setMoon(false)}>Earth · g = 9.8 N/kg</button><button aria-pressed={moon} onClick={() => setMoon(true)}>Moon · g ≈ 1.6 N/kg</button></div>
    <svg viewBox="0 0 600 225" role="img" aria-label={`A ${mass} kilogram cart has weight ${(mass * g).toFixed(1)} newtons and horizontal acceleration ${(10 / mass).toFixed(1)} meters per second squared under a 10 newton net force.`}><rect x="220" y="80" width="145" height="65" rx="8" fill="#d8c5a2" /><circle cx="246" cy="159" r="14" fill="#345944" /><circle cx="340" cy="159" r="14" fill="#345944" /><text x="293" y="119" textAnchor="middle">{mass} kg</text><path d="M70 175H540" stroke="#9fb1a0" strokeWidth="3" /><Arrow x={375} y={110} dx={90} dy={0} /><text x="396" y="85">10 N net →</text><text x="55" y="210">Horizontal comparison · vertical forces balance</text></svg>
    <label className={styles.control}>Cart mass <strong>{mass} kg</strong><input aria-label="Cart mass" type="range" min="2" max="10" value={mass} onChange={e => setMass(+e.target.value)} /></label><div className={styles.metrics} aria-live="polite"><p><b>{mass} kg</b>Mass</p><p><b>{(mass * g).toFixed(1)} N</b>Weight</p><p><b>{(10 / mass).toFixed(2)} m/s²</b>Horizontal acceleration</p></div>
  </Figure>
}
function Frames() {
  const [ground, setGround] = useState(false), [time, setTime] = useState(.5)
  const handX = ground ? 60 + 400 * time : 300
  const height = (4.9 * time - 4.9 * time * time) * 80
  return <Figure id="frames" title="One toss. Two observers." caption="A 1-second toss in a train moving at constant velocity. Air resistance is neglected. The train frame shows vertical motion; the ground frame includes the horizontal velocity shared by the coin and hand. The trajectory is a path, not a force arrow.">
    <div className={styles.switches} role="group" aria-label="Observer frame"><button aria-pressed={!ground} onClick={() => setGround(false)}>Passenger’s view</button><button aria-pressed={ground} onClick={() => setGround(true)}>Ground observer’s view</button></div>
    <svg viewBox="0 0 600 265" role="img" aria-label={`At ${time.toFixed(1)} seconds the coin is directly above the moving hand. ${ground ? 'Both progress rightward in the ground frame.' : 'The hand stays at a fixed horizontal coordinate in the train frame.'}`}><path d={ground ? 'M60 205Q260 9 460 205' : 'M300 205V107'} fill="none" stroke="#9bb99d" strokeWidth="3" strokeDasharray="5 5" /><rect x={handX - 38} y="212" width="76" height="8" rx="4" fill="#bd946b" /><circle cx={handX} cy={205 - height} r="10" fill="#b78d38" /><text x="30" y="36">{ground ? 'Ground frame: horizontal velocity persists' : 'Train frame: horizontal separation stays zero'}</text><text x={handX} y="248" textAnchor="middle">hand</text></svg>
    <label className={styles.control}>Time after release <strong>{time.toFixed(1)} s</strong><input aria-label="Time after coin release" type="range" min="0" max="1" step="0.1" value={time} onChange={e => setTime(+e.target.value)} /></label>
  </Figure>
}
function Vectors() {
  const [north, setNorth] = useState(4)
  return <Figure id="vectors" title="Two pushes, one combined effect." caption="Top view: the green and orange forces act on the same object. Their blue resultant is a calculated sum, not a third force. All force arrows use the same scale. A calibrated spring gives a separate way to measure force magnitude.">
    <svg viewBox="0 0 600 310" role="img" aria-label={`3 newtons east plus ${north} newtons north produce a resultant of ${Math.hypot(3, north).toFixed(1)} newtons.`}><circle cx="120" cy="215" r="9" fill="#345b43" /><Arrow x={120} y={215} dx={108} dy={0} /><Arrow x={120} y={215} dx={0} dy={-north * 36} color="#b36642" /><Arrow x={120} y={215} dx={108} dy={-north * 36} color="#446e99" /><path d={`M228 215V${215 - north * 36}H120`} fill="none" stroke="#a7b9bb" strokeDasharray="4 5" /><text x="144" y="250">3 N east</text><text x="28" y="290">Orange: {north} N north</text><text x="265" y="70" fill="#446e99">Resultant: {Math.hypot(3, north).toFixed(1)} N</text><path d="M385 132V147L369 154L401 166L369 178L401 190L385 202V217" stroke="#667660" strokeWidth="3" fill="none" /><rect x="357" y="218" width="56" height="34" rx="5" fill="#d7bb89" /><path d="M350 132H420" stroke="#345944" strokeWidth="5" /><text x="314" y="285">Calibrated spring scale</text></svg>
    <label className={styles.control}>Northward force <strong>{north} N</strong><input aria-label="Northward force" type="range" min="1" max="5" value={north} onChange={e => setNorth(+e.target.value)} /></label><p className={styles.result} aria-live="polite">Direction: {(Math.atan2(north, 3) * 180 / Math.PI).toFixed(0)}° north of east.</p>
  </Figure>
}
function Acceleration() {
  const [push, setPush] = useState(18), [resistance, setResistance] = useState(6), [mass, setMass] = useState(6)
  const net = push - resistance
  return <Figure id="acceleration" title="Change one variable. Predict the response." caption="Right is positive. The cart initially moves right. This is an instantaneous force model, not a continuing simulation after the cart stops. Support and weight balance vertically; the diagram shows horizontal forces at one common scale.">
    <svg viewBox="0 0 600 180" role="img" aria-label={`${push} newtons right and ${resistance} newtons left give a net force of ${net} newtons and acceleration ${(net / mass).toFixed(2)} meters per second squared.`}><rect x="253" y="65" width="94" height="55" rx="7" fill="#d4bd94" /><text x="300" y="99" textAnchor="middle">{mass} kg</text><Arrow x={353} y={90} dx={push * 5} dy={0} /><Arrow x={247} y={90} dx={-resistance * 5} dy={0} color="#b56642" /><text x="395" y="48">Push: {push} N →</text><text x="45" y="48">← Resistance: {resistance} N</text><path d="M25 146H575" stroke="#a0b49e" strokeWidth="3" /></svg>
    <div className={styles.controls}>{[['Push', push, setPush, 30, 'N'], ['Resistance', resistance, setResistance, 20, 'N'], ['Mass', mass, setMass, 12, 'kg']].map(([label, value, setter, max, unit]) => <label className={styles.control} key={label as string}>{label as string}<strong>{value as number} {unit as string}</strong><input aria-label={`${label} in second-law model`} type="range" min={label === 'Mass' ? 1 : 0} max={max as number} value={value as number} onChange={e => (setter as (n: number) => void)(+e.target.value)} /></label>)}</div><p className={styles.result} aria-live="polite">ΣFₓ = {push} − {resistance} = {net} N. aₓ = {net}/{mass} = {(net / mass).toFixed(2)} m/s².{net < 0 ? ' Leftward acceleration initially slows the rightward-moving cart.' : net === 0 ? ' Velocity is unchanged.' : ' Rightward acceleration initially increases its rightward speed.'}</p>
  </Figure>
}
function Pairs() {
  const [combined, setCombined] = useState(false)
  return <Figure id="pairs" title="Move the boundary, keep the physics." caption="Two carts push apart on a level track. Mutual forces are equal and opposite. Their accelerations differ because their masses differ. Vertical support and weight balance on each cart; only horizontal forces are illustrated.">
    <div className={styles.switches} role="group" aria-label="System boundary"><button aria-pressed={!combined} onClick={() => setCombined(false)}>Each cart separately</button><button aria-pressed={combined} onClick={() => setCombined(true)}>Both carts as one system</button></div>
    <svg viewBox="0 0 600 265" role="img" aria-label={combined ? 'Both carts are enclosed by one boundary. Their two 12 newton interaction forces are internal, with zero net external horizontal force.' : 'The 2 kilogram cart accelerates left at 6 meters per second squared and the 4 kilogram cart right at 3 meters per second squared. Both receive 12 newtons.'}>{combined ? <rect x="35" y="50" width="530" height="165" rx="18" fill="none" stroke="#547e96" strokeWidth="2" strokeDasharray="6 5" /> : <><rect x="50" y="50" width="225" height="165" rx="18" fill="none" stroke="#547e96" strokeDasharray="6 5" /><rect x="325" y="50" width="225" height="165" rx="18" fill="none" stroke="#547e96" strokeDasharray="6 5" /></>}<rect x="170" y="105" width="60" height="55" rx="6" fill="#b7cdb3" /><rect x="370" y="85" width="60" height="75" rx="6" fill="#d4ba8d" /><text x="200" y="135" textAnchor="middle">2 kg</text><text x="400" y="130" textAnchor="middle">4 kg</text><Arrow x={166} y={115} dx={-90} dy={0} /><Arrow x={434} y={115} dx={90} dy={0} color="#b46642" /><text x="78" y="85">12 N ←</text><text x="450" y="85">→ 12 N</text><text x="90" y="190">a = 6 m/s² ←</text><text x="380" y="190">a = 3 m/s² →</text><text x="300" y="247" textAnchor="middle">{combined ? 'Combined center-of-mass acceleration = 0' : 'The partner force acts on the other cart.'}</text></svg>
    <p className={styles.result} aria-live="polite">{combined ? 'Inside one boundary, this pair is internal and cancels in the system’s force sum.' : 'Each cart receives one horizontal interaction force. The pair does not cancel on either cart alone.'}</p>
  </Figure>
}
function Orbit() {
  return <Figure id="orbit" title="An orbit changes direction." caption="Schematic, not to scale. Earth’s velocity is tangent to its path. The inward gravitational force changes the velocity’s direction. The arrows describe different quantities and do not share a magnitude scale."><svg viewBox="0 0 600 330" role="img" aria-label="Earth is at the right side of a circular orbit around the Sun. Its velocity points upward, tangent to the orbit; gravitational force points left toward the Sun."><circle cx="285" cy="170" r="116" stroke="#a5b6a1" strokeWidth="2" fill="none" strokeDasharray="5 6" /><circle cx="285" cy="170" r="30" fill="#d8ae54" /><text x="285" y="175" textAnchor="middle">Sun</text><circle cx="401" cy="170" r="16" fill="#567f99" /><Arrow x={401} y={146} dx={0} dy={-85} color="#567f99" /><Arrow x={379} y={170} dx={-55} dy={0} color="#b46642" /><text x="420" y="85">Velocity</text><text x="327" y="210">Gravity</text><text x="418" y="174">Earth</text></svg></Figure>
}
export function ConnectedChapterFigure({ kind, id }: { kind: ChapterVisual; id?: string }) {
 if(FRONTIER_VISUALS.includes(kind))return <FrontierChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(MODERN_VISUALS.includes(kind))return <ModernChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(NUCLEAR_VISUALS.includes(kind))return <NuclearChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(QUANTUM_VISUALS.includes(kind))return <QuantumChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(FOUNDATION_VISUALS.includes(kind))return <FoundationChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(MAGNETIC_VISUALS.includes(kind))return <MagneticChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(CIRCUIT_VISUALS.includes(kind))return <CircuitChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(ELECTROSTATIC_VISUALS.includes(kind))return <ElectrostaticChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(WAVE_OPTICS_VISUALS.includes(kind))return <WaveOpticsChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(OPTICS_VISUALS.includes(kind))return <OpticsChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(LIGHT_VISUALS.includes(kind))return <LightChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(WAVE_VISUALS.includes(kind))return <WaveChapterFigure kind={kind} id={id??`figure-${kind}`}/>
 if(THERMAL_VISUALS.includes(kind))return <ThermalChapterFigure kind={kind} id={id??`figure-${kind}`}/>
  if (["spacetime-lab","light-speed-lab","light-clock","twin-trip","length-lab","rel-energy","equivalence-lab","curved-geometry","gravity-clock"].includes(kind)) return <RelativityChapterFigure kind={kind} id={id ?? `figure-${kind}`} />
  if (["atom-builder","atomic-scale","atom-cycle","brownian-lab","molecule-lab","crystal-lab","phase-lab","density-lab","beam-bending","scaling-lab"].includes(kind)) return <MatterChapterFigure kind={kind} id={id ?? `figure-${kind}`} />
  if (["pressure-depth","buoyancy-lab","float-lab","hydraulic-lab","atmosphere-lab","barometer-lab","pressure-gauge","aneroid-lab","boyle-lab","balloon-lab","continuity-lab","bernoulli-lab","lift-lab","capillary-lab","body-pressure","fluid-energy","poiseuille-lab","reynolds-lab","stokes-lab","transport-lab"].includes(kind)) return <FluidChapterFigure kind={kind} id={id ?? `figure-${kind}`} />
  switch (kind) {
    case 'evidence': return <Glide evidence />
    case 'orbit': return <Orbit />
    case 'ramps': return <Ramps />
    case 'glide': return <Glide />
    case 'mass': return <Mass />
    case 'frames': return <Frames />
    case 'vectors': return <Vectors />
    case 'acceleration': return <Acceleration />
    case 'pairs': return <Pairs />
    default: return <MotionChapterFigure kind={kind} id={id ?? `figure-${kind}`} />
  }
}
