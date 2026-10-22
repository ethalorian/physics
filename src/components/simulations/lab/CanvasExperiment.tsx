"use client";

import {
  type ReactNode,
  type ComponentProps,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { investigationFor } from "@/data/simulation-investigations";
import s from "../investigations/investigations.module.css";
import styles from "./CanvasExperiment.module.css";
import AvatarCharacter from "@/components/avatar/AvatarCharacter";
import {canvasSchema, type CanvasObservation} from "@/lib/interactive-assignments/canvas-observations";
import { useSimulations } from "@/contexts/SimulationContext";
import {
  useSimEmbedded,
  useSimLesson,
} from "@/components/simulations/embed-context";
import type { SimulationInteraction } from "@/types/interactive-content";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Check,
} from "lucide-react";
import {
  SimDefinition,
  SimEngine,
  ParamValues,
  defaultParamValues,
  SimData,
  SensorSample,
} from "./contract";
import SimulationAvatar from "@/components/avatar/SimulationAvatar";
import {useInvestigationParticipation} from "@/components/avatar/InvestigationParticipation";
import MockSensor from "./MockSensor";

// Physics-engine adapter for the shared interactive assignment workspace.
// Standalone activities are rendered by SimulationActivity, never a legacy shell.

// Fixed-substep integration constants (module scope = stable across renders).
const FIXED_DT = 1 / 120;
const MAX_SUBSTEPS = 10;

// localStorage set of visited sim slugs — the library's "tried" fallback when
// no server-side activity record is reachable.
const VISITED_KEY = "physics:sim-visited";

function CanvasExperimentContent({
  def,
  lessonId: providedLessonId,
  renderTools, savedObservations, onObservationsChange, readOnly = false, visible = true, trackActivity = true,
}: {
  def: SimDefinition;
  savedObservations?: CanvasObservation[];
  onObservationsChange?: (observations: CanvasObservation[]) => void;
  readOnly?: boolean;
  visible?: boolean;
  trackActivity?: boolean;
  lessonId?: string;
  renderTools?: (engine: SimEngine | null) => ReactNode;
}) {
  const participation=useInvestigationParticipation();
  const embeddedLessonId = useSimLesson();
  const lessonId = providedLessonId ?? embeddedLessonId;
  const controlId = useId();
  const { data: session } = useSession();
  const embeddedCtx = useSimEmbedded();
  const embedded = embeddedCtx;
  const [panel,setPanel]=useState<"experiment"|"notebook">("experiment");
  const [view,setView]=useState<"model"|"graph"|"data">("model");
  const [scratch,setScratch]=useState<CanvasObservation[]>([]);
  const [notice,setNotice]=useState("");
  const observations=savedObservations??scratch;
  const schema=canvasSchema(def.slug);
  const activity = investigationFor(def.slug);

  const { getSimulationBySlug, startActivity, recordInteraction } =
    useSimulations();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lastUiTsRef = useRef(0);
  const accumRef = useRef(0);
  const runningRef = useRef(false);
  const activityIdRef = useRef<string | null>(null);
  const pullRef = useRef<() => void>(() => {});

  const initialValues = useMemo(
    () => defaultParamValues(def.params),
    [def.params],
  );
  const [values, setValues] = useState<ParamValues>(initialValues);
  const [readouts, setReadouts] = useState<Record<string, number | string>>({});
  const [data, setData] = useState<SimData | null>(null);
  const [sensorTrace, setSensorTrace] = useState<SensorSample[]>([]);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [trialFinished, setTrialFinished] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackRateRef = useRef(1);
  // First-interaction cue: an affordance chip on the canvas until the student
  // touches anything (canvas drag, control change, or Run).


  // Mock-sensor channels: a sim may offer several switchable series (a picker
  // appears in the sensor panel). `sensor` is the single-channel shorthand.
  const channels = useMemo(
    () => def.sensors ?? (def.sensor ? [def.sensor] : []),
    [def.sensors, def.sensor],
  );
  const channelKey = (c: { key?: string; quantity: string }) =>
    c.key ?? c.quantity;
  const [sensorKey, setSensorKey] = useState(() =>
    channels[0] ? channelKey(channels[0]) : "",
  );

  // ---- canvas + engine lifecycle ----------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // WebGL engines (Three.js) take the raw canvas and own their own sizing/DPR;
    // 2D engines get a CanvasRenderingContext2D and the shell-managed DPR transform.
    const webgl = def.renderMode === "webgl" && !!def.createEngineGL;
    const ctx = webgl ? null : canvas.getContext("2d");
    if (!webgl && !ctx) return;

    const dpr = () => window.devicePixelRatio || 1;
    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor((webgl ? rect.width : 760) * dpr()));
      canvas.height = Math.max(1, Math.floor((webgl ? rect.height : def.canvasHeight ?? 420) * dpr()));
      if (ctx) ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
      engineRef.current?.render();
    };

    sizeCanvas();
    const engine = webgl
      ? def.createEngineGL!(canvas, initialValues, {
          invalidate: () => pullRef.current(),
        })
      : def.createEngine!(canvas, ctx!, initialValues, {
          invalidate: () => pullRef.current(),
        });
    engineRef.current = engine;
    sizeCanvas();
    setReadouts(engine.getReadouts());
    if (engine.getData) setData(engine.getData());

    const ro = new ResizeObserver(() => sizeCanvas());
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      runningRef.current = false;
      engine.destroy();
      engineRef.current = null;
    };
    // createEngine identity is stable per definition; re-run only if the sim changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.slug]);

  // ---- remember "tried" locally (library tried-state fallback) ------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITED_KEY);
      const arr: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      if (!arr.includes(def.slug))
        localStorage.setItem(VISITED_KEY, JSON.stringify([...arr, def.slug]));
    } catch {
      /* storage unavailable — server activity record still covers it */
    }
  }, [def.slug]);

  // ---- one-time activity registration ------------------------------------
  useEffect(() => {
    activityIdRef.current = null;
    if (!trackActivity || !session?.user?.id || session.experience || session.user.role === 'admin' || session.user.role === 'teacher') return;
    let cancelled = false;
    getSimulationBySlug(def.slug)
      .then((sim) => {
        if (!sim || cancelled) return;
        return startActivity(sim.id, lessonId);
      })
      .then((id) => {
        if (id && !cancelled) activityIdRef.current = id;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    session?.user?.id,
    session?.experience,
    session?.user?.role,
    trackActivity,
    def.slug,
    lessonId,
    getSimulationBySlug,
    startActivity,
  ]);

  // ---- shared state pull (readouts, data, completion) --------------------
  const pullState = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    setReadouts(eng.getReadouts());
    if (eng.getData) setData(eng.getData());
    if (eng.getSensorTrace) setSensorTrace(eng.getSensorTrace(sensorKey));
  }, [sensorKey]);

  // Keep a stable ref to pullState so an input-driven engine (created once in the
  // lifecycle effect) can request a re-read via the invalidate() callback.
  pullRef.current = pullState;

  // Switching channels re-reads the engine immediately (works even when paused).
  useEffect(() => {
    pullState();
  }, [sensorKey, pullState]);

  // ---- animation loop -----------------------------------------------------
  // Fixed-substep integration: regardless of frame rate, physics advances in
  // small constant steps. A slow frame or a backgrounded tab can't make an
  // object tunnel through a wall or blow up — every engine integrates stably.
  const loop = useCallback((ts: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const last = lastTsRef.current ?? ts;
    const frame = Math.min((ts - last) / 1000, 0.1); // clamp huge gaps (tab switch)
    lastTsRef.current = ts;
    if (eng.step) {
      accumRef.current += frame * playbackRateRef.current;
      let n = 0;
      while (accumRef.current >= FIXED_DT && n < MAX_SUBSTEPS) {
        eng.step(FIXED_DT);
        accumRef.current -= FIXED_DT;
        n++;
      }
      if (accumRef.current > FIXED_DT * MAX_SUBSTEPS) accumRef.current = 0; // shed backlog
    }
    eng.render();
    // Keep the canvas smooth; refresh graphs and tables at 15 Hz.
    if (ts - lastUiTsRef.current >= 1000 / 15 || eng.isComplete?.()) {
      pullRef.current();
      lastUiTsRef.current = ts;
    }
    if (eng.isComplete?.()) {
      runningRef.current = false;
      setRunning(false);
      setTrialFinished(true);
    } else if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
  }, []);

  const startLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    lastTsRef.current = null;
    accumRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(()=>{if(participation?.active===false||!visible||panel==='notebook')stopLoop()},[participation?.active,visible,panel,stopLoop]);
  useEffect(()=>{const pause=()=>{if(document.hidden)stopLoop()};document.addEventListener("visibilitychange",pause);return()=>document.removeEventListener("visibilitychange",pause)},[stopLoop]);

  // ---- control handlers ---------------------------------------------------
  const handleParam = useCallback(
    (key: string, value: number | string | boolean) => {
      const next = { ...values, [key]: value };
      setValues(next);
      engineRef.current?.setParams(next);
      engineRef.current?.render();
      // For non-animated sims, refresh readouts immediately.
      if (!runningRef.current) pullState();
      const interaction: SimulationInteraction = {
        timestamp: Date.now(),
        action: `${key}_changed`,
        data: { value },
      };
      if (activityIdRef.current)
        recordInteraction(activityIdRef.current, interaction).catch(() => {});
    },
    [values, pullState, recordInteraction],
  );

  const handlePlayPause = useCallback(() => {
    if (running) {
      stopLoop();
      return;
    }
    if (!started) {
      engineRef.current?.start?.(values);
      setStarted(true);
    }
    if (activityIdRef.current)
      recordInteraction(activityIdRef.current, {
        timestamp: Date.now(),
        action: "start",
        data: {},
      }).catch(() => {});
    startLoop();
  }, [running, started, values, startLoop, stopLoop, recordInteraction]);

  const handleReset = useCallback(() => {
    setNotice("");
    stopLoop();
    setStarted(false);
    setTrialFinished(false);
    engineRef.current?.reset();
    engineRef.current?.setParams(values);
    engineRef.current?.render();
    pullState();
  }, [stopLoop, pullState, values]);

  const handleExport = useCallback(() => {
    const d = engineRef.current?.getData?.();
    if (!d || d.rows.length === 0) return;
    const csv = [d.columns.join(","), ...d.rows.map((r) => r.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${def.slug}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [def.slug]);

  // ---- embed height handshake --------------------------------------------
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!embedded || !rootRef.current) return;
    const post = () => {
      const h = rootRef.current?.scrollHeight ?? 0;
      if (h > 0)
        window.parent?.postMessage(
          { type: "sim-embed-height", slug: def.slug, height: h },
          window.location.origin,
        );
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [embedded, def.slug]);


  function recordObservation(){
    if(readOnly||running||!started||observations.length>=12||!schema)return;
    const current=engineRef.current?.getReadouts();if(!current)return;
    const conditions=Object.fromEntries(schema.params.map(p=>[p.key,Number(values[p.key])])), readings=Object.fromEntries(schema.readings.map(r=>[r.key,Number(current[r.key])]));
    if(Object.values(readings).some(value=>!Number.isFinite(value))){setNotice("Run the model until all measurements are available.");return}
    const next=[...observations,{id:Math.max(0,...observations.map(t=>t.id))+1,complete:trialFinished,conditions,readings}];
    if(onObservationsChange)onObservationsChange(next);else setScratch(next);
    setNotice("Observation recorded in Notebook. Reset and change one condition to make a comparison.");
  }
  function finishTrial(){
    const engine=engineRef.current;if(!engine)return;
    stopLoop();
    if(!started){engine.start?.(values);setStarted(true)}
    // The same fixed physics steps as playback; no alternate answer calculation.
    // All supported trials finish within 120 physical seconds, including slow crossings.
    for(let i=0;i<120*120&&!engine.isComplete?.();i++)engine.step?.(FIXED_DT);
    engine.render();pullState();setTrialFinished(Boolean(engine.isComplete?.()));
    setNotice(engine.isComplete?.()?"Trial complete. Record an observation before resetting.":"Paused at the inspection limit. You can continue this trial.");
  }
  function removeObservation(){if(readOnly)return;const next=observations.slice(0,-1);if(onObservationsChange)onObservationsChange(next);else setScratch(next);}
  const format=(value:number|string|undefined)=>typeof value==='number'?Number(value.toFixed(3)).toLocaleString('en-US'):value??'—';
  return <div ref={rootRef} className={s.lab} data-simulation-workspace={def.slug}>
    <header className={s.toolbar}><h2>{def.title.split(' — ')[0]}</h2><div className={s.tabs} role="group" aria-label="Simulation panel"><button aria-pressed={panel==='experiment'} onClick={()=>setPanel('experiment')}>Experiment</button><button aria-pressed={panel==='notebook'} onClick={()=>setPanel('notebook')}>Notebook <span>{observations.length}</span></button></div></header>
    <div hidden={panel!=='experiment'}>
      <div className={s.surface}>
        <div className={s.representations} role="group" aria-label="Representations">
          <button aria-pressed={view==='model'} onClick={()=>setView('model')}>Model</button>
          {channels.length>0&&<button aria-pressed={view==='graph'} onClick={()=>setView('graph')}>Graph</button>}
          <button aria-pressed={view==='data'} onClick={()=>setView('data')}>Trial data</button>
          <button className={s.primary} disabled={trialFinished} onClick={handlePlayPause}>{running?<Pause size={16}/>:<Play size={16}/>} {running?'Pause':started?'Continue':'Run trial'}</button>
        </div>
        <div hidden={view!=='model'} className={styles.model}>
          <canvas ref={canvasRef} aria-label={def.title+" interactive model. Measurements are provided below."} className={styles.canvas} style={{aspectRatio:'760 / '+(def.canvasHeight??420)}}/>
          {renderTools?.(engineRef.current)}
        </div>
        {view==='graph'&&channels.length>0&&<MockSensor channels={channels} selectedKey={sensorKey} onSelect={setSensorKey} samples={sensorTrace} live={running}/>}
        {view==='data'&&<div className={s.tableScroll} role="region" aria-label="Current trial data" tabIndex={0}>{data?.rows.length?<table><caption>Current trial · Reset clears this trace. Record an observation to keep its measurements.</caption><thead><tr>{data.columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{data.rows.slice(-500).map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{format(cell)}</td>)}</tr>)}</tbody></table>:<p>Run a trial to collect data.</p>}</div>}
        <dl data-avatar-evidence className={s.metrics} aria-label="Current measurements">{def.readouts.map(r=><div key={r.key}><dt>{r.label}</dt><dd>{format(readouts[r.key])} <small>{r.unit}</small></dd></div>)}</dl>
      </div>
      <div className={s.actions}><button disabled={readOnly||running||!started||observations.length>=12} onClick={recordObservation}><Check size={16}/>Record observation</button><button onClick={finishTrial} disabled={trialFinished}>Finish trial</button><button onClick={handleReset}><RotateCcw size={16}/>Reset trial</button>{data&&<button disabled={!data.rows.length} onClick={handleExport}><Download size={16}/>Export trace</button>}</div>
      <details className={s.conditionDrawer}><summary>Change trial conditions <span>{def.params.length} controls</span></summary><div className={s.controls} aria-label="Trial conditions">{def.params.map(p=><div key={p.key} className={s.numberControl}>{p.type==='slider'?<><label htmlFor={controlId+p.key}><span>{p.label}<small>{p.unit}</small></span><input id={controlId+p.key} aria-label={p.label} type="number" min={p.min} max={p.max} step={p.step??1} value={Number(values[p.key])} disabled={started} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=p.min&&n<=p.max&&Math.abs((n-p.min)/(p.step??1)-Math.round((n-p.min)/(p.step??1)))<1e-7)handleParam(p.key,n)}}/></label><input type="range" aria-label={p.label+' slider'} min={p.min} max={p.max} step={p.step??1} value={Number(values[p.key])} disabled={started} onChange={e=>handleParam(p.key,Number(e.target.value))}/></>:p.type==='select'?<label>{p.label}<select value={String(values[p.key])} disabled={started&&!p.live} onChange={e=>handleParam(p.key,e.target.value)}>{p.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>:<label>{p.label}<input type="checkbox" checked={Boolean(values[p.key])} disabled={started} onChange={e=>handleParam(p.key,e.target.checked)}/></label>}</div>)}</div>{started&&<p className={s.note}>Reset the trial to change its initial conditions. Camera controls remain available.</p>}</details>
      <p className={s.status} role="status">{notice||(readOnly?'Your submitted observations are preserved. You can still explore.':running?'Trial running. Pause to inspect, or let it finish.':trialFinished?'Trial complete. Record an observation before resetting.':started?'Paused. Record this observation or continue to the end.':'Predict in Work, then set conditions and run your trial.')}</p>
      <div className={s.playback}><p>Use the measurements and graph to explain the result. Playback speed changes only the display.</p><label>Playback<select aria-label="Playback speed" value={playbackRate} onChange={e=>{playbackRateRef.current=Number(e.target.value);setPlaybackRate(Number(e.target.value))}}><option value={.25}>¼ speed</option><option value={.5}>½ speed</option><option value={1}>Real time</option></select></label></div>
      {activity&&<details className={s.assumptions}><summary>Investigation focus</summary><p>{activity.question}</p></details>}
    </div>
    <section hidden={panel!=='notebook'} className={s.notebook} aria-label="Observation notebook">
      {participation?.active&&<div className={s.observer}><div aria-hidden="true"><AvatarCharacter portrait={participation.portrait} sampleStudent={participation.sample} pose="seated"/></div><p>Find a controlled comparison. Use your recorded measurements to defend the claim you write in Work.</p></div>}
      <h3>Your observations</h3><p>{savedObservations?'These observations are included with your assignment responses.':'Practice observations stay in this visit.'} Each row preserves its own conditions and measurements. Paused observations may precede the final outcome.</p>
      {observations.length&&schema?<><div className={s.tableScroll} role="region" aria-label="Recorded observation comparison" tabIndex={0}><table><caption>{def.title.split(' — ')[0]} · observations</caption><thead><tr><th scope="col">Observation / conditions</th>{schema.readings.map(r=><th key={r.key} scope="col">{r.label}<small>{r.unit}</small></th>)}</tr></thead><tbody>{observations.map(t=><tr key={t.id}><th scope="row">{t.id} · {t.complete?'Complete':'Paused'}<small>{schema.params.map(p=>p.label+': '+format(t.conditions[p.key])+' '+p.unit).join(' · ')}</small></th>{schema.readings.map(r=><td key={r.key}>{format(t.readings[r.key])}</td>)}</tr>)}</tbody></table></div><button disabled={readOnly} onClick={removeObservation}>Remove last observation</button></>:<p>Record a first observation, change one condition and run a comparison.</p>}
    </section>
  </div>;
}
export default function CanvasExperiment(props:ComponentProps<typeof CanvasExperimentContent>){const activity=investigationFor(props.def.slug);return <SimulationAvatar id={props.def.slug} title={props.def.title} question={activity?.question??props.def.learning?.goal??props.def.title}><CanvasExperimentContent {...props}/></SimulationAvatar>}
