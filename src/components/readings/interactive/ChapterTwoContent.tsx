'use client'
import { useState } from 'react'
import { netForce, supportForce, ropeTension } from './chapter-two-model'
import styles from './chapter-two.module.css'
import Arrow from './PhysicsArrow'
import { ForceDirectionsFigure, SpringScaleFigure, SignForceFigure, ScaffoldExplorer, SurfaceNormalFigure, TwoScalesFigure, SteadyMotionFigure, VectorConstruction, RopeCasesFigure } from './ChapterTwoFigures'


function BookScene() {
  return <svg viewBox="0 0 560 350" role="img" aria-label="A book at rest on a table. The table pushes upward and gravity pulls downward with equal forces.">
    <defs><pattern id="book-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#bdd0c1" /></pattern><linearGradient id="book-cover" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#336f5a" /><stop offset="1" stopColor="#174735" /></linearGradient></defs>
    <rect width="560" height="350" fill="url(#book-grid)" />
    <ellipse cx="286" cy="252" rx="182" ry="26" fill="#173c2e" opacity=".08" />
    <path d="M82 233 L293 169 L490 225 L286 290 Z" fill="#dbc9aa" /><path d="M82 233 L286 290 L490 225 L490 237 L286 302 L82 245 Z" fill="#b29b76" />
    <path d="M188 264 L188 326 M410 260 L410 322" stroke="#937c5c" strokeWidth="13" />
    <path d="M165 198 L288 159 L397 188 L397 213 L271 251 L165 222 Z" fill="#f7f1de" stroke="#224e3c" strokeWidth="2" />
    <path d="M171 207 L271 233 L390 197 M171 214 L271 241 L390 205" stroke="#c5bea8" fill="none" />
    <path d="M159 192 L287 151 L402 183 L272 225 Z" fill="url(#book-cover)" stroke="#194732" strokeWidth="2" />
    <path d="M159 192 L159 223 L272 253 L272 225 Z" fill="#214d3b" /><path d="M169 191 L283 160" stroke="#d7ad6c" strokeWidth="2" />
    <text x="230" y="187" fill="#f4eddc" fontFamily="Georgia,serif" fontSize="16" transform="rotate(15 230 187)">PHYSICS</text>
    <Arrow x={286} y={148} dx={0} dy={-105} /><Arrow x={286} y={220} dx={0} dy={105} color="#b45a35" />
    <text x="309" y="67" fill="#215940" fontSize="13" fontWeight="700">TABLE ON BOOK</text><text x="309" y="86" fill="#466451" fontSize="13">support force ↑</text>
    <text x="309" y="305" fill="#954421" fontSize="13" fontWeight="700">EARTH ON BOOK</text><text x="309" y="324" fill="#825942" fontSize="13">weight ↓</text>
    <circle cx="86" cy="87" r="29" fill="#f6f6ea" stroke="#ccd8c9" /><text x="86" y="92" textAnchor="middle" fill="#295a42" fontFamily="Georgia,serif" fontSize="18">ΣF=0</text>
  </svg>
}

function ForceLab() {
  const [left, setLeft] = useState(30), [right, setRight] = useState(40)
  const net = netForce(left, right)
  return <div className={styles.lab}>
    <div className={styles.labHeader}><span className={styles.eyebrow}>EXPLORE 01</span><span>Change the forces. Watch the sum.</span></div>
    <svg viewBox="0 0 620 230" role="img" aria-label={`${left} newtons left, ${right} newtons right. Net force ${Math.abs(net)} newtons ${net < 0 ? 'left' : net > 0 ? 'right' : ', balanced'}.`}>
      <path d="M55 159H565" stroke="#c6cec2" strokeWidth="2" /><path d="M273 95H347V155H273Z" fill="#d8bb8d" stroke="#a38a65" strokeWidth="2" /><path d="M279 101H341V149H279Z M310 101V149" stroke="#b69a72" fill="none" /><circle cx="310" cy="125" r="5" fill="#385640" />
      <Arrow x={270} y={124} dx={-left * 2.4} dy={0} color="#b25a38" /><Arrow x={350} y={124} dx={right * 2.4} dy={0} />
      <text x="182" y="88" textAnchor="middle" fill="#944325" fontSize="18">{left} N ←</text><text x="443" y="88" textAnchor="middle" fill="#215a40" fontSize="18">→ {right} N</text>
      <text x="310" y="204" textAnchor="middle" fill="#314737" fontSize="15">Horizontal forces only · vertical forces balance</text>
    </svg>
    <div className={styles.sliderGrid}><label>Leftward pull <strong>{left} N</strong><input aria-label="Leftward pull" type="range" min="0" max="80" step="5" value={left} onChange={e => setLeft(+e.target.value)} /></label><label>Rightward pull <strong>{right} N</strong><input aria-label="Rightward pull" type="range" min="0" max="80" step="5" value={right} onChange={e => setRight(+e.target.value)} /></label></div>
    <div className={styles.labResult} aria-live="polite"><strong>{right} − {left} = {net} N</strong><span>{net === 0 ? 'Balanced. The velocity does not change.' : `Unbalanced. The acceleration points ${net > 0 ? 'right' : 'left'}.`}</span></div>
    <p className={styles.labPrompt}>Try making the forces balance at two different strengths. What stays the same?</p>
  </div>
}

function SupportLab() {
  const [push, setPush] = useState(0)
  const support = supportForce(20, push)
  return <div className={styles.lab}>
    <div className={styles.labHeader}><span className={styles.eyebrow}>EXPLORE 02</span><span>A table responds.</span></div>
    <svg viewBox="0 0 620 270" role="img" aria-label={`A 20 newton book with an extra downward push of ${push} newtons. The table supplies ${support} newtons upward.`}>
      <path d="M80 156 Q310 ${156 + push / 5} 540 156" stroke="#bda37a" strokeWidth="13" fill="none" /><path d="M118 162V246 M503 162V246" stroke="#bda37a" strokeWidth="10" />
      <rect x="261" y="117" width="98" height="31" rx="3" fill="#2b6048" /><rect x="267" y="136" width="86" height="9" fill="#f2e9d4" />
      <Arrow x={233} y={143} dx={0} dy={-support * 1.65} /><Arrow x={378} y={143} dx={0} dy={33} color="#b25a38" />
      {push > 0 ? <Arrow x={310} y={18} dx={0} dy={push * 1.65} color="#856091" /> : null}
      <text x="112" y="67" fill="#215940" fontSize="17">Support: {support} N ↑</text><text x="394" y="205" fill="#994827" fontSize="17">Weight: 20 N ↓</text>
      <text x="340" y="45" fill="#775183" fontSize="15">Hand: {push} N ↓</text>
    </svg>
    <div className={styles.singleSlider}><label>Extra downward push <strong>{push} N</strong><input aria-label="Extra downward push" type="range" min="0" max="40" step="5" value={push} onChange={e => setPush(+e.target.value)} /></label></div>
    <div className={styles.labResult} aria-live="polite"><strong>{support} − 20 − {push} = 0 N</strong><span>The book remains in equilibrium.</span></div><p className={styles.labPrompt}>The bend is exaggerated. The book’s weight stays 20 N; the support force changes.</p>
  </div>
}

function RopeLab() {
  const [angle, setAngle] = useState(60)
  const tension = ropeTension(300, angle), radians = angle * Math.PI / 180
  const dx = Math.cos(radians) * 205, dy = Math.sin(radians) * 205
  const forceScale = Math.min(.38, 100 / (tension * Math.cos(radians))), horizontal = tension * Math.cos(radians) * forceScale, vertical = 150 * forceScale
  return <div className={styles.lab}>
    <div className={styles.labHeader}><span className={styles.eyebrow}>EXPLORE 03</span><span>Same weight. Different directions.</span></div>
    <svg viewBox="0 0 620 325" role="img" aria-label={`Two symmetric ropes at ${angle} degrees above horizontal support a 300 newton sign. Each rope tension is ${tension.toFixed(1)} newtons. Each upward component is 150 newtons.`}>
      <path d={`M${310 - dx} ${218 - dy} L310 218 L${310 + dx} ${218 - dy}`} stroke="#bcb398" strokeWidth="5" fill="none" />
      <circle cx={310 - dx} cy={218 - dy} r="7" fill="#8e917e" /><circle cx={310 + dx} cy={218 - dy} r="7" fill="#8e917e" />
      <path d="M193 218H429" stroke="#a5b4a4" strokeDasharray="4 5" /><path d={`M359 218 A49 49 0 0 0 ${310 + 49 * Math.cos(radians)} ${218 - 49 * Math.sin(radians)}`} stroke="#847143" strokeWidth="2" fill="none" /><text x="372" y="208" fill="#736139" fontSize="15">{angle}°</text>
      <Arrow x={306} y={216} dx={-dx * .82} dy={-dy * .82} /><Arrow x={314} y={216} dx={dx * .82} dy={-dy * .82} />
      <rect x="261" y="229" width="98" height="40" rx="4" fill="#d4bb8c" /><text x="310" y="254" textAnchor="middle" fill="#514532" fontSize="14" fontWeight="700">300 N SIGN</text><Arrow x={310} y={271} dx={0} dy={38} color="#b25a38" />
      <text x="125" y="35" textAnchor="middle" fill="#215940" fontSize="19">{tension.toFixed(1)} N</text><text x="495" y="35" textAnchor="middle" fill="#215940" fontSize="19">{tension.toFixed(1)} N</text>
    </svg>
    <div className={styles.singleSlider}><label>Angle above horizontal <strong>{angle}°</strong><input aria-label="Rope angle above horizontal" type="range" min="15" max="75" step="5" value={angle} onChange={e => setAngle(+e.target.value)} /></label></div>
    <div className={styles.labResult} aria-live="polite"><strong>{tension.toFixed(1)} N in each rope</strong><span>Upward components: 150 N + 150 N = 300 N</span></div>
    <p className={styles.labPrompt}>Try 30°, then 15°. The sign’s weight never changes. Arrows show direction; their lengths in this geometry sketch are not a force scale.</p>
    <figure id="figure-rope-resultant" className={styles.ropeResultant}><h4>How the rope forces add</h4><svg viewBox="0 0 320 300" role="img" aria-label={`Two tension vectors of ${tension.toFixed(1)} newtons form a parallelogram. Their horizontal parts cancel. Their blue resultant is 300 newtons upward, balancing the 300 newton weight downward. All vector lengths share one scale within this diagram.`}><path d={`M${160-horizontal} ${142-vertical} L160 ${142-2*vertical} L${160+horizontal} ${142-vertical}`} fill="none" stroke="#9fac90" strokeWidth="2" strokeDasharray="4 4" /><Arrow x={160} y={142} dx={-horizontal} dy={-vertical} /><Arrow x={160} y={142} dx={horizontal} dy={-vertical} /><Arrow x={160} y={142} dx={0} dy={-2*vertical} color="#406a95" /><Arrow x={160} y={142} dx={0} dy={2*vertical} color="#b25a38" /><circle cx="160" cy="142" r="5" fill="#3c593e" /><text x="176" y="39" fontSize="14" fill="#355d84">R = 300 N ↑</text><text x="176" y="262" fontSize="14" fill="#994827">W = 300 N ↓</text><text x="12" y="173" fontSize="14" fill="#245b42">Each tension: {tension.toFixed(1)} N</text></svg><figcaption>The two green tension arrows add to the blue upward resultant. It balances the orange weight arrow. The blue arrow represents the sum; it is not an additional force. All arrows use one scale within this diagram.</figcaption></figure>
    <details className={styles.mathDetails}><summary>Show the mathematics</summary><p>For two symmetric, ideal ropes: 2T sin θ = W, so T = W / (2 sin θ). Here W = 300 N and θ is measured above horizontal. As θ approaches zero, the required tension grows without bound.</p></details>
  </div>
}

function MotionGallery() {
  const [selected, setSelected] = useState(0)
  const cases = [
    { label: 'Parked cart', title: 'Static equilibrium', body: 'The cart remains at rest. Its weight and support force balance; no horizontal force is needed.', dots: [100, 100, 100, 100, 100], tag: 'Velocity = 0 · Net force = 0' },
    { label: 'Steady glide', title: 'Dynamic equilibrium', body: 'Equal distances in equal times mean constant velocity along this straight track. The cart is moving, but its net force is zero.', dots: [75, 175, 275, 375, 475], tag: 'Constant velocity · Net force = 0' },
    { label: 'Speeding up', title: 'Not in equilibrium', body: 'The spacing grows during equal time intervals. The changing velocity tells us a nonzero net force acts on the cart.', dots: [75, 115, 195, 315, 475], tag: 'Changing velocity · Net force ≠ 0' },
  ]
  const current = cases[selected]
  return <div className={styles.lab}><div className={styles.labHeader}><span className={styles.eyebrow}>NOTICE THE PATTERN</span><span>Five snapshots, one second apart.</span></div><div className={styles.segmented} role="group" aria-label="Motion examples">{cases.map((c, i) => <button key={c.label} aria-pressed={i === selected} onClick={() => setSelected(i)}>{c.label}</button>)}</div><svg viewBox="0 0 560 140" role="img" aria-label={`${current.title}. ${current.body}`}><path d="M35 99H525" stroke="#b7c5b3" strokeWidth="2" />{current.dots.map((x, i) => <g key={i} opacity={.24 + i * .18}><rect x={x - 16} y="66" width="32" height="22" rx="4" fill="#2e6a50" /><circle cx={x - 9} cy="93" r="5" fill="#253b2d" /><circle cx={x + 9} cy="93" r="5" fill="#253b2d" /></g>)}</svg><div className={styles.motionText} aria-live="polite"><h4>{current.title}</h4><p>{current.body}</p><span className={styles.tag}>{current.tag}</span></div></div>
}


export function ChapterTwoOpening({ onStart }: { onStart: () => void }) { return (<>
          <div className={styles.heroCopy}><p className={styles.eyebrow}>CHAPTER 02 / FORCES & MOTION</p><h1>Mechanical<br /><em>equilibrium.</em></h1><p className={styles.dek}>Still doesn’t mean force-free.<br />And balance doesn’t mean standing still.</p><div className={styles.heroMeta}><span>5 connected ideas</span><span>Illustrated, interactive reading</span><span>Read · test · explain</span></div></div>
          <figure className={styles.heroArt}><BookScene /><figcaption>A quiet object. An active balance.</figcaption></figure>
          <div className={styles.openingBottom}><p>A book rests on a table. Nothing seems to be happening. Yet Earth is pulling it downward, and the table is pushing it upward. Once you learn to see that balance, an ordinary classroom starts to look different.</p><button className={styles.primaryButton} onClick={onStart}>Start reading <span>↓</span></button></div>
          <div className={styles.bigIdea}><span>THE BIG IDEA</span><p>Forces change motion when they <em>don’t</em> balance.</p><p className={styles.bigIdeaDetail}>Zero net force means zero change in velocity. An object can remain at rest—or keep moving steadily in a straight line.</p></div>
          <details className={styles.prediction}><summary>Before you read: a cart is already moving. Must its forward force be larger than its backward force?</summary><p>Keep your first explanation in mind. In Section 2.4, you will return to this question with a way to test it.</p></details>
        </>) }
export function ChapterTwoSection({ id }: { id: string }) {
  if (id === 'force') return <><div className={styles.prose}><p>Choose one object: a crate, a book, or a person hanging from a rope. Then ask, <em>what other things are pushing or pulling on it?</em> Earth can pull on the object through gravity. A rope can pull through tension. A hand or a surface can exert a contact force.</p><p>A <strong>force</strong> is a push or a pull. We measure its strength in <strong>newtons (N)</strong>. To describe a force completely, we also need its direction: “40 N to the right” tells us more than “40 N.” A quantity with both magnitude and direction is a <strong>vector</strong>. A quantity such as time or volume, with magnitude but no direction, is a <strong>scalar</strong>.</p><p>Usually, more than one force acts on an object. Their combined effect is the <strong>net force</strong>. Forces in the same direction add. Forces in opposite directions subtract. The direction of the larger force determines the direction of their nonzero sum.</p></div>
          <ForceDirectionsFigure /><ForceLab />
          <div className={styles.prose}><h3>The arrows are doing two jobs.</h3><p>A force arrow points in the force’s direction. On a scaled force diagram, its length represents the force’s strength. An arrow twice as long means a force twice as large. To combine forces, keep both pieces of information.</p><p>Now picture a small bag hanging from a spring scale. Earth pulls downward on the bag; the string pulls upward. That stretching force in the string is called <strong>tension</strong>. When the bag stays at rest, the scale’s upward pull balances the bag’s downward weight.</p></div><SpringScaleFigure />
          <aside className={styles.marginIdea}><b>Always name the object.</b><p>“The table pushes up on the book” identifies both the agent and the object receiving the force. Only forces acting on your chosen object belong in its force sum.</p></aside></>
  if (id === 'balance') return <><div className={styles.prose}><p>When the forces on an object add vectorially to zero, the object is in <strong>equilibrium</strong>. This chapter focuses on translational equilibrium: the object’s velocity does not change. Rotational balance is a later topic.</p><p>The equilibrium rule is compact enough to fit on a sticky note:</p></div>
          <div className={styles.equation}><span className={styles.equationMain}>Σ<strong>F</strong> = 0</span><span>the vector sum of the forces is zero</span></div>
          <div className={styles.prose}><p>The symbol Σ means “sum.” F stands for force. To use the rule on a vertical problem, choose upward as positive. Upward forces contribute positive values; downward forces contribute negative values.</p><p>For a sign hanging at rest, all upward support must equal the downward weight. Two cables can share that support unequally. Balance requires the <em>total</em> upward force to match the weight; it does not require the two cables to carry equal loads.</p></div>
          <div className={styles.worked}><p className={styles.eyebrow}>WORK IT THROUGH</p><h3>Two cables. One missing force.</h3><p>A 200 N sign hangs at rest. The left vertical cable pulls upward with 80 N. Find the right cable’s tension.</p><SignForceFigure /><ol><li><b>Choose the object.</b> The sign. Its forces are left-cable tension, right-cable tension, and weight.</li><li><b>Write the balance.</b> 80 N + T − 200 N = 0.</li><li><b>Find the unknown.</b> T = 120 N upward.</li><li><b>Check the total.</b> 80 N + 120 N = 200 N. Up and down balance.</li></ol></div>
          <div className={styles.prose}><h3>The scaffold question</h3><p>Imagine two painters standing on a platform held by two vertical ropes. A painter carefully changes position, then stands still. One rope’s tension decreases by 50 N. If the total weight is unchanged, the other rope’s tension must increase by 50 N. The load has been redistributed, but the sum of the upward forces is unchanged.</p><p>That is the power of a rule: it lets you predict something you have not measured. It also tells you what you cannot yet determine. The total support is fixed by force balance; the individual shares depend on where the loads and supports are located.</p></div><ScaffoldExplorer /></>
  if (id === 'support') return <><div className={styles.prose}><p>Return to the book on the table. Gravity pulls downward. If that were the only force, the book’s motion would change. The table supplies the missing upward force: a <strong>support force</strong>, often called the <strong>normal force</strong>.</p><p>“Normal” means perpendicular to the surface. On a horizontal tabletop, the normal force points upward. On a tilted surface, it points perpendicular to that tilted surface.</p><p>The book slightly deforms the table. The material resists that deformation, much as a compressed spring pushes back. The deformation is usually too small to see, but the force is real.</p></div><SurfaceNormalFigure /><SupportLab />
          <aside className={styles.marginIdea}><b>A useful rule—with a condition.</b><p>Support equals weight when those are the only vertical forces and vertical acceleration is zero. Add a downward hand force, and the support must increase. The book’s weight itself does not change.</p></aside>
          <div className={styles.prose}><h3>What a bathroom scale measures</h3><p>A scale measures the support force it exerts on you. When you stand at rest with no other vertical support, that force equals your weight. Stand evenly on two scales, and each supports half your weight. Shift your weight while remaining at rest, and the readings change—but their sum stays equal to your weight.</p></div><TwoScalesFigure /></>
  if (id === 'motion') return <><div className={styles.prose}><p>An object that remains at rest is in <strong>static equilibrium</strong>. An object moving at constant speed in a straight line is in <strong>dynamic equilibrium</strong>. Both have zero net force.</p><p>This can feel surprising. Everyday moving objects often slow down, so it is tempting to think motion needs a continuing unbalanced push. But friction and air resistance are forces. They explain why an ordinary moving object often changes velocity.</p><p>If a cart moves steadily while a person pulls forward, the total backward force must match the forward pull. A larger forward force would change the cart’s velocity. Balanced forces allow it to keep the velocity it already has.</p></div><SteadyMotionFigure /><MotionGallery />
          <div className={styles.twoNotes}><div><b>Speed alone is not enough.</b><p>A car turning at constant speed changes direction. Its velocity changes, so its net force is not zero.</p></div><div><b>A single still frame is not enough.</b><p>A tossed ball is momentarily at rest at the top of its flight. Gravity is still pulling it downward, so it is not in equilibrium.</p></div></div>
          <div className={styles.prose}><p>Return to the question from the beginning: does a moving cart need a larger forward force? <strong>Only if its velocity is changing in that direction.</strong> For steady straight-line motion, the horizontal forces balance.</p></div></>
  if (id === 'vectors') return <><div className={styles.prose}><p>The combined vector is called the <strong>resultant</strong>. When forces point along one line, addition and subtraction are enough. For forces pointing in different directions, use a vector construction.</p><p>Place the two arrows tail to tail and complete a parallelogram. The diagonal starting at their shared tail is the resultant. You can also slide one arrow without turning it until its tail meets the other arrow’s tip. The resultant runs from the first tail to the last tip.</p></div>
          <VectorConstruction />
          <div className={styles.prose}><p>For two equal perpendicular forces of 100 N each, the resultant is 100√2 N, about 141 N—not 200 N. The forces combine diagonally, so their directions matter.</p><h3>Why a nearly horizontal rope works harder</h3><p>Now hang a 300 N sign from two identical ropes arranged symmetrically. The horizontal components cancel. The upward components must add to 300 N, so each rope supplies 150 N of upward support.</p><p>Tilt those ropes closer to horizontal. A smaller fraction of each rope’s tension points upward. To keep supplying the same 150 N upward, each rope must pull harder along its own direction.</p></div><RopeLab />
          <div className={styles.prose}><p>With unequal rope angles, do not assume equal tensions. The horizontal components must cancel, and the vertical components must add to the weight. Both conditions matter.</p></div><RopeCasesFigure /><div className={styles.prose}><p>A perfectly horizontal pair of ropes cannot support a hanging weight with finite tension. Real ropes sag or stretch, and they have finite strength. A small-looking change in direction can make a large difference to the forces.</p></div></>
  return null
}
