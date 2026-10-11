"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { investigationFor } from "@/data/simulation-investigations";
import styles from "./SimulationStudio.module.css";
import { useSimulations } from "@/contexts/SimulationContext";
import {
  useSimEmbedded,
  useSimLesson,
} from "@/components/simulations/embed-context";
import type { SimulationInteraction } from "@/types/interactive-content";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Hand,
} from "lucide-react";
import {
  SimDefinition,
  SimEngine,
  ParamValues,
  defaultParamValues,
  SimData,
  SensorSample,
} from "./contract";
import MockSensor from "./MockSensor";

// ---------------------------------------------------------------------------
// SimLab — the one shell every simulation renders inside. The sim contributes
// only a SimDefinition (params + readouts + a canvas engine). Everything around
// the canvas — chrome, controls, readouts, data, export, completion, theming,
// embedded layout — lives here, so all sims stay consistent and a fix lands once.
// ---------------------------------------------------------------------------

// Fixed-substep integration constants (module scope = stable across renders).
const FIXED_DT = 1 / 120;
const MAX_SUBSTEPS = 10;

// localStorage set of visited sim slugs — the library's "tried" fallback when
// no server-side activity record is reachable.
const VISITED_KEY = "physics:sim-visited";

export default function SimLab({
  def,
  lessonId: providedLessonId,
  renderTools,
}: {
  def: SimDefinition;
  lessonId?: string;
  renderTools?: (engine: SimEngine | null) => ReactNode;
}) {
  const embeddedLessonId = useSimLesson();
  const lessonId = providedLessonId ?? embeddedLessonId;
  const controlId = useId();
  const { data: session } = useSession();
  const embeddedCtx = useSimEmbedded();
  const embedded = embeddedCtx;
  const [showData, setShowData] = useState(false);
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
  const [hasInteracted, setHasInteracted] = useState(false);

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
      canvas.width = Math.max(1, Math.floor(rect.width * dpr()));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr()));
      if (ctx) ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
      engineRef.current?.render();
    };

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
    if (!session?.user?.id || session.experience) return;
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

  // ---- control handlers ---------------------------------------------------
  const handleParam = useCallback(
    (key: string, value: number | string | boolean) => {
      setHasInteracted(true);
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
    setHasInteracted(true);
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

  const showPlay = def.showPlay ?? true;
  const showExport = (def.showExport ?? false) || !!data;
  const canvasH = def.canvasHeight ?? 420;

  // Lead with the task: goal falls back to the first objective, so every lab
  // that already declares learning content gets the banner with no def change.
  const hasLockable = def.params.some((p) => !p.live);
  return (
    <div
      ref={rootRef}
      className={styles.studio}
      data-embedded={embedded || undefined}
    >
      {!embedded && (
        <header className={styles.intro}>
          <Link href="/simulations" className={styles.back}>
            <ArrowLeft size={15} /> Optional exploration
          </Link>
          <div className={styles.titleRow}>
            <div>
              <p className={styles.kicker}>
                ANTOCCI PHYSICS / EXPERIMENT STUDIO
              </p>
              <h1>{activity?.headline ?? def.title}</h1>
            </div>
            <p className={styles.summary}>
              {activity?.question ?? def.summary}
              <span>Change one thing. Watch what follows.</span>
            </p>
          </div>
          <div className={styles.meta}>
            <span>{def.title}</span>
            <span>
              {activity ? "Guided investigation available" : "Open model"}
            </span>
            <span>
              {activity ? activity.minutes + " min investigation" : def.level}
            </span>
          </div>
        </header>
      )}
      <div className={styles.instrument}>
        <div className={styles.sceneHeading}>
          <span>
            <span className={styles.statusDot} data-running={running} />{" "}
            {running
              ? "EXPERIMENT RUNNING"
              : trialFinished
                ? "TRIAL RECORDED"
                : started
                  ? "EXPERIMENT PAUSED"
                  : "READY TO EXPLORE"}
          </span>
          <span>MODEL / {def.title}</span>
        </div>
        <div className={styles.experiment}>
          <div className={styles.sceneColumn}>
            <div
              className={styles.canvasWrap}
              onPointerDown={() => setHasInteracted(true)}
            >
              <canvas
                ref={canvasRef}
                aria-label={
                  def.title +
                  " interactive model. Use the labeled controls and readouts to explore."
                }
                className={styles.canvas}
                style={{
                  height: Math.max(
                    canvasH,
                    def.slug === "distance-displacement" ? 460 : 360,
                  ),
                }}
              />
              {!hasInteracted && (
                <div className={styles.canvasHint}>
                  <Hand size={15} />
                  {def.slug === "distance-displacement"
                    ? "Tap a destination or use the route controls."
                    : renderTools
                      ? "Use the controls below to navigate."
                      : "Set your conditions, then run the experiment."}
                </div>
              )}
            </div>
            <dl className={styles.readouts} aria-label="Live measurements">
              {def.readouts.map((r) => {
                const raw = readouts[r.key];
                return (
                  <div key={r.key}>
                    <dt>{r.label}</dt>
                    <dd><strong
                      data-value-type={typeof raw === "string" && !Number.isFinite(Number(raw)) ? "text" : "number"}
                      style={{ color: r.color }}
                    >
                      {typeof raw === "number"
                        ? raw.toFixed(r.precision ?? 2)
                        : (raw ?? "—")}
                      {r.unit && <small>{r.unit}</small>}
                    </strong></dd>
                  </div>
                );
              })}
            </dl>
            {renderTools?.(engineRef.current)}
          </div>
          <aside className={styles.controls} aria-label="Experiment controls">
            <p className={styles.kicker}>01 / SET THE CONDITIONS</p>
            {def.params.length === 0 && (
              <p className={styles.controlNote}>
                Tap the scene to choose a destination. Each new destination adds
                a leg to the route.
              </p>
            )}
            {def.params.map((p) => (
              <div key={p.key} className={styles.control}>
                {p.type === "slider" ? (
                  <>
                    <label htmlFor={controlId + "-" + p.key}>
                      {p.label}
                      <output>
                        {values[p.key]} {p.unit}
                      </output>
                    </label>
                    <input
                      id={controlId + "-" + p.key}
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step ?? 1}
                      value={values[p.key] as number}
                      disabled={started && !p.live}
                      onChange={(e) =>
                        handleParam(p.key, Number(e.target.value))
                      }
                    />
                  </>
                ) : p.type === "select" ? (
                  <>
                    <label htmlFor={controlId + "-" + p.key}>{p.label}</label>
                    <select
                      id={controlId + "-" + p.key}
                      value={values[p.key] as string}
                      disabled={started && !p.live}
                      onChange={(e) => handleParam(p.key, e.target.value)}
                    >
                      {p.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <label>
                    {p.label}
                    <input
                      type="checkbox"
                      checked={values[p.key] as boolean}
                      disabled={started && !p.live}
                      onChange={(e) => handleParam(p.key, e.target.checked)}
                    />
                  </label>
                )}
              </div>
            ))}
            {started && hasLockable && (
              <p className={styles.controlNote}>
                Initial conditions are fixed during a trial. Reset to change
                them.
              </p>
            )}
            <div className={styles.actions}>
              {showPlay && (
                <button
                  className={styles.run}
                  disabled={trialFinished}
                  onClick={handlePlayPause}
                >
                  {running ? <Pause size={18} /> : <Play size={18} />}{" "}
                  {trialFinished
                    ? "Reset for another trial"
                    : running
                      ? "Pause experiment"
                      : started
                        ? "Continue experiment"
                        : "Run experiment"}
                </button>
              )}
              <button onClick={handleReset}>
                <RotateCcw size={16} />
                Reset trial
              </button>
            </div>
            {showPlay && (
              <label className={styles.playback}>
                Playback
                <select
                  aria-label="Playback speed"
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = Number(e.target.value);
                    playbackRateRef.current = rate;
                    setPlaybackRate(rate);
                  }}
                >
                  <option value={0.25}>¼ speed</option>
                  <option value={0.5}>½ speed</option>
                  <option value={1}>Real time</option>
                </select>
                <small>All readings use simulation time.</small>
              </label>
            )}
          </aside>
        </div>
        <div className={styles.dataHeading}>
          <div>
            <p className={styles.kicker}>02 / LOOK FOR THE PATTERN</p>
            <p>
              {activity?.question ??
                def.learning?.whatToNotice?.[0] ??
                "Compare the readings as you change the conditions."}
            </p>
          </div>
          <div className={styles.dataActions}>
            <button
              aria-expanded={showData}
              onClick={() => setShowData(!showData)}
            >
              {showData ? "Hide trial table" : "View trial table"}
            </button>
            {showExport && (
              <button onClick={handleExport} disabled={!data?.rows.length}>
                <Download size={15} />
                Export CSV
              </button>
            )}
          </div>
        </div>
        {channels.length > 0 && (
          <div className={styles.sensor}>
            <MockSensor
              channels={channels}
              selectedKey={sensorKey}
              onSelect={setSensorKey}
              samples={sensorTrace}
              live={running}
            />
          </div>
        )}
        {showData && (
          <div className={styles.dataTable}>
            {data?.rows.length ? (
              <table>
                <caption>
                  Current trial · copy the readings you use into your lesson
                  notebook.
                </caption>
                <thead>
                  <tr>
                    {data.columns.map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.slice(-500).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>
                          {typeof cell === "number" ? cell.toFixed(2) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                Run a trial to collect data. Reset clears the current trial.
              </p>
            )}
          </div>
        )}
      </div>
      {!embedded && activity && (
        <section className={styles.inquiry} aria-label="Investigation guide">
          <div>
            <p className={styles.kicker}>03 / BUILD YOUR EXPLANATION</p>
            <h2>{activity.title}</h2>
            <p>{activity.predict}</p>
            <ol>
              {activity.trials.map((trial) => (
                <li key={trial}>{trial}</li>
              ))}
            </ol>
          </div>
          <div className={styles.target}>
            <p className={styles.kicker}>YOUR MASTERY TARGET</p>
            <p>{activity.target}</p>
            {activity.scope && <small>{activity.scope}</small>}
            <h3>Make a claim. Support it.</h3>
            <p>{activity.explain}</p>
            <p className={styles.controlNote}>
              For assigned work, open this activity from Lessons to save
              evidence, receive XP, and get teacher feedback. This exploration
              page does not submit work.
            </p>
            {session?.user?.role === "admin" ||
            session?.user?.role === "teacher" ? (
              <Link href="/admin/simulations/activities">
                Prepare & assign this investigation →
              </Link>
            ) : (
              <Link href="/lessons">Open your assigned lessons →</Link>
            )}
          </div>
        </section>
      )}
      {!embedded && !activity && def.learning && (
        <section className={styles.inquiry}>
          <div>
            <p className={styles.kicker}>TRY AN EXPERIMENT</p>
            <h2>Follow a change.</h2>
            <ol>
              {def.learning.tryThis?.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className={styles.kicker}>EXPLAIN WHAT YOU OBSERVE</p>
            {def.learning.objectives?.map((t) => (
              <p key={t}>{t}</p>
            ))}
            <p className={styles.controlNote}>
              Optional exploration. Save assigned evidence in your lesson.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
