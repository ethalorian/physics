#!/usr/bin/env python3
"""
gen_mvp_weeks.py — Project Physics (MVP) week pages: the app IS the packet.

MVP students have no paper packet, so every "on the packet page" cell in the week plan
(claude/MVP-CPA-Physics-Project-Year-Map.md) becomes a capture block here. Each day is
four segments — hands → record → talk → write — and each segment that produces something
on paper produces a block: a data_table or sketch to RECORD, a talk box, a tiered frame to
WRITE, a locked prediction (gated) before any test, a timeline entry (planned / actual /
why) after any build, and at the end of the week the reasoning artifact, the exit ticket
and a self-rating across the week's targets. Every capture carries the SEI layer (prompt
in Spanish, tiered EN/ES frames, word bank, a visual) so the WIDA-1 route exists on every
block. Spanish evidence is full evidence.

Emits idempotent SQL: blocks whose id starts with the week's day prefix (w00d2- …) are
stripped and re-appended, so re-running replaces rather than duplicates.

  python3 gen_mvp_weeks.py > ../supabase/migrations/20260903_mvp_week_inputs.sql
"""
import json

ES = 'es'

def sei(prompt_es, frames=None, bank=None, visual=None, modes=None, talk=True):
    d = {'prompt_l1': {ES: prompt_es}, 'talkFirst': talk}
    if frames: d['frames'] = [{'level': lv, 'text': en, 'text_l1': {ES: es}} for lv, en, es in frames]
    if bank: d['wordBank'] = bank
    if visual: d['visual'] = visual
    if modes: d['modes'] = modes
    return d

def day(id, n, title_en, title_es, hands_en, hands_es, minutes=(25, 25, 25, 25)):
    h, r, t, w = minutes
    return {'id': id, 'type': 'callout', 'variant': 'tip',
            'title': f'Day {n} · {title_en} · Día {n} · {title_es}',
            'markdown': f'**HANDS · MANOS ({h} min) — first, always.** {hands_en} · {hands_es}\n\n'
                        f'Then **RECORD · REGISTRA ({r})** → **TALK · HABLA ({t}, pairs, either language · en parejas, en cualquier idioma)** → **WRITE · ESCRIBE ({w}, the frame below)**. Every segment ends with something saved here. · Cada segmento termina con algo guardado aquí.'}

def talk(id, q_en, q_es):
    return {'id': id, 'type': 'callout', 'variant': 'note', 'title': 'Talk · Habla — 60 seconds each, then swap · 60 segundos cada uno, luego cambien',
            'markdown': f'**Ask your partner · Pregúntale a tu pareja:** {q_en} · {q_es}\n\nSpanish is allowed. The bridge student translates the physics, not the answer. · Se permite español. El «puente» traduce la física, no la respuesta.'}

def frame(id, target, prompt_en, prompt_es, fr, bank, level_frames, gate=False, visual=None, xp=5):
    b = {'id': id, 'type': 'sentence_frame', 'capture': True, 'targetId': target, 'xp': xp,
         'frame': fr, 'wordBank': bank,
         'frames': [{'level': lv, 'text': en, 'text_l1': {ES: es}} for lv, en, es in level_frames],
         'sei': sei(prompt_es, visual=visual, modes=['text']), 'note': prompt_en}
    if gate: b['gate'] = True
    return b

def sketch(id, target, instr_en, instr_es, prompts, bank, grid=True, x='time · tiempo (s)', y='position · posición (m)', xp=5):
    return {'id': id, 'type': 'sketch', 'capture': True, 'targetId': target, 'xp': xp,
            'instruction': f'{instr_en} · {instr_es}', 'prompts': prompts, 'grid': grid, 'xLabel': x, 'yLabel': y,
            'sei': {'prompt_l1': {ES: instr_es}, 'labelBank': bank, 'modes': ['sketch']}}

def table(id, target, cols, rows, pattern_en, pattern_es, plot=False, xp=5, visual=None):
    return {'id': id, 'type': 'data_table', 'capture': True, 'targetId': target, 'xp': xp, 'columns': cols, 'rows': rows,
            'plot': plot, 'patternPrompt': f'{pattern_en} · {pattern_es}', 'sei': sei(pattern_es, visual=visual, modes=['text'], talk=False)}

def observe(id, target, p_en, p_es, i_en, i_es, pframe, bank, level_frames, lobby=False, xp=5, visual=None):
    b = {'id': id, 'type': 'observation', 'capture': True, 'targetId': target, 'xp': xp,
         'patternPrompt': p_en, 'interpretPrompt': i_en, 'patternFrame': pframe, 'comparatives': bank,
         'sei': sei(f'{p_es} · {i_es}', frames=level_frames, visual=visual, modes=['text', 'sketch'])}
    if lobby: b['lobbyReady'] = True
    return b

def timeline(id, target, n, xp=5):
    return observe(id, target,
        f'TIMELINE ENTRY #{n} · PLANNED — what did your team plan to do this block?',
        f'ENTRADA #{n} DE LA LÍNEA DE TIEMPO · PLANEADO — ¿qué planeó hacer tu equipo en este bloque?',
        'ACTUAL — what actually happened, and WHY the difference?',
        'REAL — ¿qué pasó de verdad, y POR QUÉ la diferencia?',
        'We planned ___. What actually happened: ___. The gap is because ___.',
        ['we planned · planeamos', 'we actually · en realidad', 'because · porque', 'ran out of time · faltó tiempo', 'it broke · se rompió', 'it worked · funcionó'],
        [(1, 'We planned ___. Actually ___.', 'Planeamos ___. En realidad ___.'),
         (2, 'We planned ___. Actually ___. The gap is because ___.', 'Planeamos ___. En realidad ___. La diferencia es porque ___.'),
         (3, 'Planned / actual / why: ___', 'Planeado / real / por qué: ___')],
        xp=xp, visual={'src': '/images/sei/timeline-entry.svg', 'alt': 'A timeline card with three boxes: planned, actual, why the gap.'})

def question(id, target, prompt_en, prompt_es, options, correct, explain_en, explain_es, gate=False, visual=None, level_frames=None, xp=5):
    b = {'id': id, 'type': 'question', 'capture': True, 'targetId': target, 'xp': xp,
         'question': {'prompt': prompt_en, 'options': [{'id': o[0], 'icon': o[1], 'text': o[2], 'text_l1': {ES: o[3]}, 'feedback': o[4]} for o in options],
                      'correctOptionId': correct, 'explain': f'{explain_en} · {explain_es}'},
         'sei': sei(prompt_es, frames=level_frames, visual=visual, modes=['choice'])}
    if gate: b['gate'] = True
    return b

def rate(id, targets):
    return {'id': id, 'type': 'self_assessment', 'capture': True, 'targetIds': targets,
            'note': 'RATE YOURSELF · EVALÚATE — 1 Not yet · 2 Almost · 3 Got it, on each target of the week. Opens after the exit ticket on lobby days (MC-6).'}

def exit_ticket(id, target, prompt_en, prompt_es, fr, level_frames, bank, visual):
    return {'id': id, 'type': 'exit_ticket', 'capture': True, 'targetId': target, 'xp': 5, 'talkFirst': True, 'prompt': prompt_en, 'frame': fr,
            'sei': sei(prompt_es, frames=level_frames, bank=bank, visual=visual, modes=['text', 'sketch'])}

XJ = {'src': '/images/sei/2026-xj-approach.svg', 'alt': 'Earth and the approaching object 2026-XJ.'}
TRACE = {'src': '/images/sei/flat-section.svg', 'alt': 'A position-time graph with a rising, a flat and a falling section.'}
MYST = {'src': '/images/sei/mystery-xt.svg', 'alt': 'A position-time graph in four segments A to D: flat, rising, flat, falling to zero.'}

# ---------------------------------------------------------------- WEEK 0 · Days 2–4
W00 = [
  day('w00d2', 2, 'The detector · first touch', 'El detector · primer contacto',
      'Vernier motion detector on the table. One at a time: walk toward it slowly, away fast, stop. Watch the trace before anyone explains it.',
      'Detector de movimiento Vernier en la mesa. Uno a la vez: camina hacia él despacio, aléjate rápido, detente. Mira la traza antes de que alguien la explique.'),
  sketch('w00d2-trace', 'pp.w00.predict-lock',
      'RECORD · Sketch what the screen showed for YOUR walk. Label where you walked toward, away, and stopped — in either language.',
      'REGISTRA · Dibuja lo que mostró la pantalla en TU caminata. Marca dónde caminaste hacia, lejos y parado — en cualquier idioma.',
      ['One line for the whole walk · Una línea para toda la caminata', 'Label toward / away / stopped · Marca hacia / lejos / parado', 'Mark where you were fastest · Marca dónde ibas más rápido'],
      ['toward · hacia', 'away · lejos', 'stopped · parado', 'fast · rápido', 'slow · lento', 'start · inicio']),
  talk('w00d2-talk', 'When the line went UP, which way were you walking? How do you know?', 'Cuando la línea SUBIÓ, ¿hacia dónde caminabas? ¿Cómo lo sabes?'),
  frame('w00d2-write', 'pp.w00.predict-lock', 'WRITE · what the trace told you', 'ESCRIBE · lo que te dijo la traza',
      'When I walked ___, the line went ___. When I stopped, the line was ___.',
      ['toward · hacia', 'away · lejos', 'up · sube', 'down · baja', 'flat · plana', 'steep · empinada'],
      [(1, 'When I walked [toward / away], the line went [up / down]. Stopped = [flat].', 'Cuando caminé [hacia / lejos], la línea [subió / bajó]. Parado = [plana].'),
       (2, 'When I walked ___, the line went ___ because ___.', 'Cuando caminé ___, la línea ___ porque ___.'),
       (3, 'The trace showed ___', 'La traza mostró ___')], visual=TRACE),

  day('w00d3', 3, 'Teams, roles, the timeline', 'Equipos, roles, la línea de tiempo',
      'Groups of three with one bridge. Roles: hands · recorder · reporter — they rotate every block. Build something in 10 minutes from what is on the table, then open your first timeline entry.',
      'Grupos de tres con un «puente». Roles: manos · registrador · reportero — rotan cada bloque. Construyan algo en 10 minutos con lo que hay en la mesa, luego abran su primera entrada de la línea de tiempo.'),
  timeline('w00d3-timeline', 'pp.w00.timeline', 1),
  talk('w00d3-talk', 'What is one thing your team planned that did NOT happen? Why?', '¿Qué cosa planeó tu equipo que NO pasó? ¿Por qué?'),

  day('w00d4', 4, 'Paper tower · predict before you test', 'Torre de papel · predice antes de probar',
      'Twenty minutes, 10 sheets of paper, 30 cm of tape. Before you build: LOCK a prediction of the height. The prediction is graded for the reasoning, never for being right.',
      'Veinte minutos, 10 hojas de papel, 30 cm de cinta. Antes de construir: FIJA una predicción de la altura. La predicción se califica por el razonamiento, nunca por acertar.'),
  frame('w00d4-predict', 'pp.w00.predict-lock', 'PREDICT (locked) · before anyone touches the paper', 'PREDICE (fijada) · antes de que alguien toque el papel',
      'I predict our tower will be ___ cm tall, because ___. Evidence that would prove me wrong: ___.',
      ['taller · más alta', 'shorter · más baja', 'wide base · base ancha', 'folds · dobleces', 'tape · cinta', 'because · porque'],
      [(1, 'I predict ___ cm.', 'Predigo ___ cm.'),
       (2, 'I predict ___ cm because ___.', 'Predigo ___ cm porque ___.'),
       (3, 'I predict ___ cm because ___. I would be wrong if ___.', 'Predigo ___ cm porque ___. Estaría equivocado si ___.')], gate=True, visual=XJ),
  table('w00d4-data', 'pp.w00.predict-lock', ['Predicted height (cm) · Predicción', 'Actual height (cm) · Real', 'Gap (cm) · Diferencia'], 1,
      'Was your prediction high or low? By how much?', '¿Tu predicción fue alta o baja? ¿Por cuánto?'),
  talk('w00d4-talk', 'Whose tower beat its prediction? What did they do that you did not?', '¿Qué torre superó su predicción? ¿Qué hicieron que tú no?'),
  frame('w00d4-gap', 'pp.w00.predict-lock', 'WRITE · the gap', 'ESCRIBE · la diferencia',
      'We predicted ___ cm. Our tower was ___ cm. The gap is because ___.',
      ['fell over · se cayó', 'base · base', 'ran out of tape · se acabó la cinta', 'stronger fold · doblez más fuerte', 'higher than · más alta que', 'lower than · más baja que'],
      [(1, 'Predicted ___ cm. Actual ___ cm. [Higher / lower].', 'Predicción ___ cm. Real ___ cm. [Más alta / más baja].'),
       (2, 'We predicted ___ cm and got ___ cm. The gap is because ___.', 'Predijimos ___ cm y obtuvimos ___ cm. La diferencia es porque ___.'),
       (3, 'Gap: ___ — because ___', 'Diferencia: ___ — porque ___')], visual={'src': '/images/sei/timeline-entry.svg', 'alt': 'Planned, actual, why the gap.'}),
  timeline('w00d4-timeline', 'pp.w00.timeline', 2),
  exit_ticket('w00-exit', 'pp.w00.predict-lock',
      'EXIT · Week 0 · What will you do differently on the next build — and what prediction will you lock first?',
      'SALIDA · Semana 0 · ¿Qué harás diferente en la próxima construcción — y qué predicción fijarás primero?',
      'Next build I will ___. First I will predict ___.',
      [(1, 'Next build I will [test first / plan the base / write the number].', 'La próxima vez voy a [probar primero / planear la base / escribir el número].'),
       (2, 'Next build I will ___ because ___. First I will predict ___.', 'La próxima vez haré ___ porque ___. Primero predeciré ___.'),
       (3, 'Next time: ___', 'La próxima vez: ___')],
      ['plan · planear', 'test · probar', 'measure · medir', 'predict · predecir', 'because · porque'], XJ),
  rate('w00-rate', ['pp.w00.predict-lock', 'pp.w00.timeline']),
]

# ---------------------------------------------------------------- WEEK 1 · Describing motion
W01 = [
  day('w01d1', 1, 'Walk the graph', 'Camina la gráfica',
      'Motion detector + the graph-matching screen. Walk to match three graphs. Then the reverse: sketch the graph of a walk BEFORE the screen draws it.',
      'Detector de movimiento + pantalla de emparejar gráficas. Camina para igualar tres gráficas. Luego al revés: dibuja la gráfica de una caminata ANTES de que la pantalla la dibuje.'),
  sketch('w01d1-predict', 'pp.w01.sketch-first',
      'PREDICT · Sketch the position–time graph of this walk BEFORE you do it: stand 1 m away, walk away slowly for 3 s, stop for 2 s, walk back fast.',
      'PREDICE · Dibuja la gráfica posición–tiempo de esta caminata ANTES de hacerla: párate a 1 m, aléjate despacio 3 s, detente 2 s, regresa rápido.',
      ['Start 1 m from the detector · Empieza a 1 m', 'Away slowly = gentle up · Lejos despacio = sube suave', 'Stop = flat · Parado = plana', 'Back fast = steep down · Regresa rápido = baja empinada'],
      ['away · lejos', 'toward · hacia', 'stopped · parado', 'slow · lento', 'fast · rápido', 'steep · empinada']),
  table('w01d1-scores', 'pp.w01.read-graph', ['Graph · Gráfica', 'Match score (%) · Puntaje', 'What I fixed · Qué corregí'], 3,
      'Which part of a graph was hardest to walk? Why?', '¿Qué parte de la gráfica fue más difícil de caminar? ¿Por qué?'),
  talk('w01d1-talk', 'Show your partner your sketch and the screen. Where do they disagree, and who was right?', 'Muestra a tu pareja tu dibujo y la pantalla. ¿Dónde no coinciden, y quién tenía razón?'),
  frame('w01d1-write', 'pp.w01.read-graph', 'WRITE · read the graph', 'ESCRIBE · lee la gráfica',
      'When the line goes UP, I am walking ___. When it is FLAT, I am ___. When it is STEEP, I am going ___.',
      ['away · lejos', 'toward · hacia', 'stopped · parado', 'faster · más rápido', 'slower · más lento', 'steady · constante'],
      [(1, 'Up = [away / toward]. Flat = [stopped / steady]. Steep = [faster / slower].', 'Sube = [lejos / hacia]. Plana = [parado / constante]. Empinada = [más rápido / más lento].'),
       (2, 'When the line goes up I am walking ___; flat means ___; steep means ___.', 'Cuando la línea sube camino ___; plana significa ___; empinada significa ___.'),
       (3, 'In my words: ___', 'Con mis palabras: ___')], visual=TRACE),

  day('w01d2', 2, 'Sims that CHECK, never draw first', 'Sims que COMPRUEBAN, nunca dibujan primero',
      'Two sims. Rule: write your predicted graph shape in the table, THEN run the sim. Fix your prediction in the third column — the fix is the learning.',
      'Dos sims. Regla: escribe la forma de la gráfica que predices en la tabla, LUEGO corre el sim. Corrige tu predicción en la tercera columna — la corrección es el aprendizaje.'),
  {'id': 'w01d2-sim1', 'type': 'sim_embed', 'simulationSlug': 'constant-velocity'},
  table('w01d2-check', 'pp.w01.sketch-first', ['Motion I set · Movimiento que puse', 'Predicted x–t shape · Forma predicha', 'What the sim drew · Lo que dibujó', 'My fix · Mi corrección'], 3,
      'What did you predict wrong most often — the direction, the steepness, or the flat parts?', '¿Qué predijiste mal más seguido — la dirección, la inclinación o las partes planas?'),
  {'id': 'w01d2-sim2', 'type': 'sim_embed', 'simulationSlug': 'uniformly-accelerated-motion'},
  question('w01d2-vt', 'pp.w01.a-from-slope',
      'On a VELOCITY–time graph the line is flat, above zero. What is the object doing?',
      'En una gráfica VELOCIDAD–tiempo la línea es plana, arriba de cero. ¿Qué hace el objeto?',
      [('steady', '➡', 'Moving at a steady speed — the velocity is not changing', 'Moviéndose a rapidez constante — la velocidad no cambia', 'Yes. Flat on a v–t graph means constant velocity. (Flat on an x–t graph meant stopped — different graph, different meaning.) · Sí: plana en v–t es velocidad constante.'),
       ('stopped', '🛑', 'Stopped', 'Detenido', 'That is what flat means on a POSITION graph. Here the flat line is above zero — the velocity is a steady non-zero number. · Eso es lo que significa plana en una gráfica de POSICIÓN. Aquí la línea está arriba de cero.'),
       ('faster', '📈', 'Speeding up', 'Acelerando', 'Speeding up would be a line going UP on v–t. Flat means the speed stays the same. · Acelerar sería una línea que SUBE en v–t.')],
      'steady', 'Say the rule for x–t and the rule for v–t in one sentence each.', 'Di la regla para x–t y la regla para v–t, una oración cada una.',
      gate=True, visual=TRACE,
      level_frames=[(1, 'Flat on x–t = [stopped]. Flat on v–t = [steady speed].', 'Plana en x–t = [parado]. Plana en v–t = [rapidez constante].'),
                    (2, 'On x–t, flat means ___. On v–t, flat means ___, because ___.', 'En x–t, plana significa ___. En v–t, plana significa ___, porque ___.')]),
  talk('w01d2-talk', 'Which graph is which? Explain to your partner how you tell an x–t graph from a v–t graph without reading the label.', '¿Cuál gráfica es cuál? Explícale a tu pareja cómo distingues una gráfica x–t de una v–t sin leer la etiqueta.'),

  day('w01d3', 3, 'A number out of a graph · slope and area', 'Un número de una gráfica · pendiente y área',
      'Slope calculator first: drag two points on an x–t graph, read the slope, say what it means. Then area under a v–t curve. These are the two moves every build this year will use.',
      'Primero la calculadora de pendiente: arrastra dos puntos en una gráfica x–t, lee la pendiente, di qué significa. Luego el área bajo una curva v–t. Estos son los dos movimientos que usará cada construcción este año.'),
  {'id': 'w01d3-sim1', 'type': 'sim_embed', 'simulationSlug': 'slope-calculator'},
  {'id': 'w01d3-gewa1', 'type': 'gewa', 'capture': True, 'targetId': 'pp.w01.v-from-slope', 'xp': 5,
   'prompt': 'A cart is at 0.5 m at t = 1.0 s and at 2.5 m at t = 5.0 s. Use the slope of its position–time graph to find its velocity. · Un carrito está en 0.5 m en t = 1.0 s y en 2.5 m en t = 5.0 s. Usa la pendiente de su gráfica posición–tiempo para hallar su velocidad.',
   'givenHint': 'two positions and two times · dos posiciones y dos tiempos', 'equationHint': 'v = Δx / Δt  (rise over run · elevación sobre avance)', 'solveFor': 'v',
   'equationIds': ['avg-velocity', 'avg-speed', 'displacement', 'avg-acceleration'],
   'sei': {'prompt_l1': {ES: 'Halla la velocidad desde la pendiente: v = Δx / Δt.'}, 'tier2Terms': ['slope']}},
  {'id': 'w01d3-sim2', 'type': 'sim_embed', 'simulationSlug': 'area-under-curve'},
  {'id': 'w01d3-gewa2', 'type': 'gewa', 'capture': True, 'targetId': 'pp.w01.area', 'xp': 5,
   'prompt': 'A cart moves at a steady 0.40 m/s for 6.0 s. Use the area under its velocity–time graph to find how far it went. · Un carrito se mueve a 0.40 m/s constantes durante 6.0 s. Usa el área bajo su gráfica velocidad–tiempo para hallar cuánto avanzó.',
   'givenHint': 'a velocity and a time · una velocidad y un tiempo', 'equationHint': 'Δx = v · Δt  (area of the rectangle · área del rectángulo)', 'solveFor': 'Δx',
   'equationIds': ['displacement', 'avg-velocity', 'avg-speed', 'avg-acceleration'],
   'sei': {'prompt_l1': {ES: 'Halla el desplazamiento desde el área: Δx = v · Δt.'}, 'tier2Terms': ['area']}},
  talk('w01d3-talk', 'Slope or area — which one gives you a velocity, and which one gives you a distance? Why does that make sense?', 'Pendiente o área — ¿cuál te da una velocidad y cuál una distancia? ¿Por qué tiene sentido?'),
  frame('w01d3-write', 'pp.w01.v-from-slope', 'WRITE · the two moves, in your own words', 'ESCRIBE · los dos movimientos, con tus palabras',
      'The SLOPE of a position–time graph tells me ___. The AREA under a velocity–time graph tells me ___.',
      ['velocity · velocidad', 'how far · cuánto avanzó', 'displacement · desplazamiento', 'steeper = faster · más empinada = más rápido', 'rise over run · elevación sobre avance', 'rectangle · rectángulo'],
      [(1, 'Slope → [velocity / distance]. Area → [velocity / distance].', 'Pendiente → [velocidad / distancia]. Área → [velocidad / distancia].'),
       (2, 'The slope tells me ___ because ___. The area tells me ___ because ___.', 'La pendiente me dice ___ porque ___. El área me dice ___ porque ___.'),
       (3, 'Slope: ___ · Area: ___', 'Pendiente: ___ · Área: ___')], visual=TRACE),

  day('w01d4', 4, 'A real cart on the track', 'Un carrito real en la pista',
      'Cart on the track, motion detector at one end. Before every push: sketch the graph you expect. Three runs — slow push, fast push, push then catch.',
      'Carrito en la pista, detector en un extremo. Antes de cada empujón: dibuja la gráfica que esperas. Tres corridas — empujón lento, rápido, empujar y atrapar.'),
  sketch('w01d4-predict', 'pp.w01.sketch-first',
      'PREDICT · Sketch the position–time graph for run 2 (fast push, cart rolls to the end) BEFORE you push.',
      'PREDICE · Dibuja la gráfica posición–tiempo de la corrida 2 (empujón rápido, el carrito rueda hasta el final) ANTES de empujar.',
      ['Where does it start? · ¿Dónde empieza?', 'Steep or gentle? · ¿Empinada o suave?', 'Does it slow down? · ¿Frena?'],
      ['start · inicio', 'end · final', 'steep · empinada', 'slowing · frenando', 'steady · constante']),
  table('w01d4-data', 'pp.w01.v-from-slope', ['Run · Corrida', 'Start x (m)', 'End x (m)', 'Time (s) · Tiempo', 'Velocity = Δx/Δt (m/s)'], 3,
      'Which run had the biggest slope? Does the number agree with what you saw?', '¿Qué corrida tuvo la pendiente más grande? ¿El número coincide con lo que viste?'),
  observe('w01d4-compare', 'pp.w01.sketch-first',
      'RECORD · Where did the detector\'s graph match your sketch, and where did it not?',
      'REGISTRA · ¿Dónde coincidió la gráfica del detector con tu dibujo, y dónde no?',
      'FIX · What will you draw differently next time, and why?',
      'CORRIGE · ¿Qué dibujarás diferente la próxima vez, y por qué?',
      'My sketch matched at ___. It was wrong at ___.',
      ['start · inicio', 'steepness · inclinación', 'the end · el final', 'slowing down · frenando', 'flat · plana', 'curve · curva'],
      [(1, 'Matched: [start / steepness / end]. Wrong: [start / steepness / end].', 'Coincidió: [inicio / inclinación / final]. Mal: [inicio / inclinación / final].'),
       (2, 'My sketch matched at ___ but was wrong at ___ because ___. Next time I will ___.', 'Mi dibujo coincidió en ___ pero falló en ___ porque ___. La próxima vez ___.')], visual=TRACE),
  talk('w01d4-talk', 'The cart slowed down at the end. What did that look like on the graph? What word do we not have yet for that?', 'El carrito frenó al final. ¿Cómo se vio en la gráfica? ¿Qué palabra nos falta todavía para eso?'),
  timeline('w01d4-timeline', 'pp.w00.timeline', 3),

  day('w01d5', 5, 'The reasoning artifact', 'El artefacto de razonamiento',
      'No new hands today. Record 07 is a motion nobody in the shop has seen. Describe it segment by segment, defend every claim from the graph, then draw the graph that WOULD match a motion described in words.',
      'Hoy no hay manos nuevas. El Registro 07 es un movimiento que nadie en el taller ha visto. Descríbelo segmento por segmento, defiende cada afirmación con la gráfica, luego dibuja la gráfica que correspondería a un movimiento descrito con palabras.'),
  {'id': 'w01d5-fig', 'type': 'figure', 'src': '/images/sei/mystery-xt.svg', 'align': 'full',
   'alt': 'Position-time graph in four segments: A flat at 1 m for 2 s, B rising to 3 m over 2 s, C flat at 3 m for 2 s, D falling to 0 m over 2 s.',
   'caption': 'Record 07 · four segments A–D · cuatro segmentos A–D'},
  observe('w01d5-artifact', 'pp.w01.read-graph',
      'ARTIFACT 1 · Describe the motion in Record 07, segment by segment (A, B, C, D): which way, how fast, stopped?',
      'ARTEFACTO 1 · Describe el movimiento del Registro 07, segmento por segmento (A, B, C, D): hacia dónde, qué tan rápido, parado?',
      'DEFEND · For ONE segment, say which feature of the graph proves your description (slope? flat? steepness?) and give its velocity as a number.',
      'DEFIENDE · Para UN segmento, di qué característica de la gráfica prueba tu descripción (¿pendiente? ¿plana? ¿inclinación?) y da su velocidad como número.',
      'A: ___. B: ___. C: ___. D: ___.',
      ['stopped · parado', 'away · lejos', 'toward · hacia', 'slope · pendiente', 'faster · más rápido', 'm/s'],
      [(1, 'A: [stopped / away / toward]. B: [stopped / away / toward]. C: ___. D: ___.', 'A: [parado / lejos / hacia]. B: [parado / lejos / hacia]. C: ___. D: ___.'),
       (2, 'In segment ___ the object ___ because the slope is ___ (v = ___ m/s).', 'En el segmento ___ el objeto ___ porque la pendiente es ___ (v = ___ m/s).'),
       (3, 'Claim + evidence: ___', 'Afirmación + evidencia: ___')], lobby=True),
  sketch('w01d5-draw', 'pp.w01.sketch-first',
      'ARTIFACT 2 · Draw the position–time graph that WOULD match: "It sat still 2 m away for 2 s, moved away at a steady speed for 4 s, then came back faster than it left."',
      'ARTEFACTO 2 · Dibuja la gráfica posición–tiempo que correspondería a: «Se quedó quieto a 2 m durante 2 s, se alejó a rapidez constante 4 s, luego regresó más rápido de lo que se fue».',
      ['Flat first · Primero plana', 'Then a steady line up · Luego una línea recta que sube', 'Then steeper down · Luego baja más empinada'],
      ['still · quieto', 'steady · constante', 'faster · más rápido', 'away · lejos', 'back · regresa']),
  talk('w01d5-talk', 'Trade artifacts. Find one claim on your partner\'s page you could prove wrong from the graph — or say why you cannot.', 'Intercambien artefactos. Encuentra una afirmación en la página de tu pareja que podrías refutar con la gráfica — o di por qué no puedes.'),
  exit_ticket('w01-exit', 'pp.w01.read-graph',
      'EXIT · Week 1 · One thing about graphs that still confuses me — and one thing I can now do that I could not on Monday.',
      'SALIDA · Semana 1 · Una cosa de las gráficas que todavía me confunde — y una cosa que ahora puedo hacer y el lunes no.',
      'I still get confused by ___. Now I can ___.',
      [(1, 'Confused by: [flat / steep / x–t vs v–t]. Now I can: [read / sketch / find slope].', 'Me confunde: [plana / empinada / x–t vs v–t]. Ahora puedo: [leer / dibujar / hallar la pendiente].'),
       (2, 'I still get confused by ___ because ___. Now I can ___.', 'Todavía me confunde ___ porque ___. Ahora puedo ___.'),
       (3, 'Still: ___ · Now: ___', 'Todavía: ___ · Ahora: ___')],
      ['slope · pendiente', 'area · área', 'flat · plana', 'steep · empinada', 'sketch · dibujar'], MYST),
  rate('w01-rate', ['pp.w01.read-graph', 'pp.w01.v-from-slope', 'pp.w01.a-from-slope', 'pp.w01.area', 'pp.w01.sketch-first']),
]

WEEKS = [('pp-w00', 'w00', W00), ('pp-w01', 'w01', W01)]

def sql():
    out = ['-- Generated by scripts/gen_mvp_weeks.py — Project Physics week inputs (the app is the packet).',
           '-- Idempotent: blocks with ids starting <prefix>d / <prefix>- are stripped, then re-appended.', '']
    for slug, prefix, blocks in WEEKS:
        js = json.dumps(blocks, ensure_ascii=False)
        assert '$$' not in js
        out.append(f"""update public.lessons set content_blocks = jsonb_set(content_blocks, '{{blocks}}',
  (select coalesce(jsonb_agg(b order by o), '[]'::jsonb) from jsonb_array_elements(content_blocks->'blocks') with ordinality as x(b,o)
     where (b->>'id') not like '{prefix}d%' and (b->>'id') not like '{prefix}-%')
  || $${js}$$::jsonb), updated_at = now()
where slug = '{slug}';
""")
    return '\n'.join(out)

if __name__ == '__main__':
    print(sql())
