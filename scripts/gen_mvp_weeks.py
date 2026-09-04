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

The week row is the authoring shell only. Students open one lesson per DAY: after the
blocks land, split_mvp_week(slug) (migration 20260904_mvp_days_split.sql) cuts the week
at each "Day K" callout (id wNNdK) into pp-wNN-dK lessons and unpublishes the week row.
The emitted SQL ends with that call, so one migration does both.

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
            'note': 'RATE YOURSELF · EVALÚATE — 1 Not yet · 2 Almost · 3 Got it, on each target you worked on today. Opens after the exit ticket on lobby days (MC-6).'}

def day_targets(blocks):
    seen = []
    for b in blocks:
        for t in ([b.get('targetId')] if b.get('targetId') else []) + list(b.get('targetIds') or []):
            if t and t not in seen: seen.append(t)
    return seen

def close_days(blocks):
    """Every day closes with a self-rating on the targets IT captured (decision 2026-09-04:
    the rate sits at the close of the day's target, not at the end of the week). A day that
    already ends in a self_assessment / marzano keeps it."""
    out, cur, cur_id = [], [], None
    def flush():
        if cur_id and cur and cur[-1]['type'] not in ('self_assessment', 'marzano'):
            tg = day_targets(cur)
            if tg: cur.append(rate(f'{cur_id}-rate', tg))
        out.extend(cur)
    for b in blocks:
        if b['type'] == 'callout' and b['title'].startswith('Day '):
            flush(); cur, cur_id = [b], b['id']
        else:
            cur.append(b)
    flush()
    return out

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
]

# ---------------------------------------------------------------- WEEK 1 · Describing motion
# NOTE on w01d3-gewa1's numbers (changed 2026-09-04, do not "round" them back):
# they were 0.5 m @ 1.0 s → 2.5 m @ 5.0 s, where Δx/Δt = 2.0/4.0 = 0.50 m/s and
# the classic wrong move (last position ÷ last time) = 2.5/5.0 = 0.50 m/s — the
# SAME answer, so the misconception was undetectable. 2.0 m @ 1.0 s → 3.0 m @
# 5.0 s gives v = 0.25 m/s against a wrong-move 0.60 m/s, and the graph now ends
# high while staying shallow, which is the day's misconception made visible.
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
   'prompt': 'A cart is at 2.0 m at t = 1.0 s and at 3.0 m at t = 5.0 s. Use the slope of its position–time graph to find its velocity. · Un carrito está en 2.0 m en t = 1.0 s y en 3.0 m en t = 5.0 s. Usa la pendiente de su gráfica posición–tiempo para hallar su velocidad.',
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
]

RAMP = {'src': '/images/sei/ramp-dilutes-g.svg', 'alt': 'A cart on a ramp: a red arrow g straight down, a shorter green arrow along the ramp. Steeper means closer to g.'}
FIT = {'src': '/images/sei/angle-vs-a-extended.svg', 'alt': 'Three measured points low on an angle-acceleration graph, a straight line through them extended to 90 degrees where it reaches about 14, above the dashed 9.8 line.'}
CHAIN = {'src': '/images/sei/run-out-chain.svg', 'alt': 'Four boxes: angle, then acceleration, then speed at the bottom, then run-out. Friction acts at the last box.'}
DROP = {'src': '/images/sei/picket-fence-drop.svg', 'alt': 'A picket fence dropped through a vertical photogate onto a cushion, reading g of about 9.8.'}

# ---------------------------------------------------------------- WEEK 2 · Car and ramp
# Built to scripts/projects_day_plans.py W02 (audited with Craig 2026-09-04):
# the motion detector (not the photogate) measures a on Day 1, because the point is
# taking a slope; Day 2 MEASURES g rather than simulating it, so the number students
# are asked to trust over their own line is one they made; Wednesday's run-out lane is
# a high-friction runner; Thursday opens with hands on a KNOWN angle before anything
# is locked (SEI non-negotiable 1).
W02 = [
  day('w02d1', 1, 'Three angles, one cart', 'Tres angulos, un carrito',
      'Two releases first - the flattest tape mark and the steepest - and nothing written. Then your own three angles, motion detector at the low end, acceleration from the SLOPE of the v-t graph. Last week\'s move on this week\'s cart.',
      'Primero dos sueltas - la marca mas plana y la mas empinada - sin escribir nada. Luego sus tres angulos, detector de movimiento abajo, la aceleracion desde la PENDIENTE de la grafica v-t. El movimiento de la semana pasada en el carrito de esta semana.',
      minutes=(25, 30, 25, 25)),
  question('w02d1-faster', 'pp.w02.a-vs-angle',
      'The steep ramp and the flat ramp. Is the steep cart just FASTER the whole way, or is it GAINING speed faster?',
      'La rampa empinada y la rampa plana. El carrito empinado solo va MAS RAPIDO todo el tiempo, o GANA rapidez mas rapido?',
      [('gaining', 'UP', 'It GAINS speed faster - its acceleration is bigger', 'GANA rapidez mas rapido - su aceleracion es mayor',
        'Yes. Faster and gaining-speed-faster are two different numbers, and this week measures the second one. / Si. Rapido y ganar-rapidez-mas-rapido son dos numeros distintos.'),
       ('faster', 'FLAG', 'It is just faster, the whole way down', 'Solo va mas rapido, todo el camino',
        'It IS faster at the bottom - but that is the RESULT. What made it faster? It gained speed at a bigger rate. / SI va mas rapido al final - pero eso es el RESULTADO.'),
       ('same', 'EQ', 'Both the same', 'Los dos igual',
        'Release both and watch again. Same start, different finish - something is different. / Suelta los dos y mira otra vez.')],
      'gaining', 'Speed is where you got to. Acceleration is how fast you got there. This week measures acceleration.',
      'La rapidez es a donde llegaste. La aceleracion es que tan rapido llegaste. Esta semana medimos la aceleracion.',
      visual=RAMP,
      level_frames=[(1, 'The steep cart [is faster / gains speed faster].', 'El carrito empinado [va mas rapido / gana rapidez mas rapido].'),
                    (2, 'The steep cart ___ because ___.', 'El carrito empinado ___ porque ___.')]),
  table('w02d1-data', 'pp.w02.a-vs-angle',
      ['Tape mark / Marca', 'Angle (deg) / Angulo', 'a run 1 (m/s2)', 'a run 2 (m/s2)', 'a run 3 (m/s2)', 'Average a / Promedio'], 3,
      'As the angle got bigger, what happened to the acceleration? Compare your average to g x sin(angle) for that mark.',
      'Cuando el angulo crecio, que paso con la aceleracion? Compara tu promedio con g x sen(angulo) de esa marca.',
      plot=True, visual=RAMP),
  sketch('w02d1-plot', 'pp.w02.a-vs-angle',
      'PLOT BY HAND - put your three points on the axes before any screen draws them. Angle across, acceleration up.',
      'GRAFICA A MANO - pon tus tres puntos en los ejes antes de que una pantalla los dibuje. Angulo horizontal, aceleracion vertical.',
      ['One dot per angle / Un punto por angulo', 'Straight line or curve? / Recta o curva?', 'Three points may not be enough to tell / Tres puntos quiza no alcanzan'],
      ['angle / angulo', 'acceleration / aceleracion', 'steeper / mas empinada', 'bigger / mayor', 'point / punto', 'line / linea'],
      x='angle / angulo (deg)', y='acceleration / aceleracion (m/s2)'),
  talk('w02d1-talk', 'Your three points: a straight line, a curve, or you cannot tell from three? "Cannot tell" is allowed and it is the strongest answer.',
       'Tus tres puntos: una recta, una curva, o no se puede saber con solo tres? "No se puede saber" vale, y es la respuesta mas fuerte.'),
  frame('w02d1-write', 'pp.w02.a-vs-angle', 'WRITE - what the angle did', 'ESCRIBE - que hizo el angulo',
      'When the angle went from ___ to ___ deg, the acceleration went from ___ to ___ m/s2, because ___.',
      ['angle / angulo', 'steeper / mas empinada', 'acceleration / aceleracion', 'bigger / mayor', 'smaller / menor', 'because / porque'],
      [(1, 'Angle ___ to ___. Acceleration ___ to ___. [Bigger / smaller].', 'Angulo ___ a ___. Aceleracion ___ a ___. [Mayor / menor].'),
       (2, 'When the angle got ___, the acceleration got ___ because ___.', 'Cuando el angulo se hizo ___, la aceleracion se hizo ___ porque ___.'),
       (3, 'Angle and acceleration: ___', 'Angulo y aceleracion: ___')], visual=RAMP),

  day('w02d2', 2, 'What would it read standing straight up?', 'Que marcaria de pie, vertical?',
      'You measure g yourselves. Photogate clamped VERTICAL, picket fence dropped through it by hand onto the cushion, three drops. Do not push it - drop it. Then the sim, to repeat it fast and clean.',
      'Ustedes miden g. Fotopuerta VERTICAL, la barra de franjas cae por ella hasta el cojin, tres caidas. No la empujes - sueltala. Luego el sim, para repetirlo rapido y limpio.',
      minutes=(25, 30, 25, 25)),
  table('w02d2-drop', 'pp.w02.g-diluted', ['Drop / Caida', 'g (m/s2)'], 3,
      'Are your three drops close to each other? What is your best value of g?',
      'Tus tres caidas se parecen entre si? Cual es tu mejor valor de g?', visual=DROP),
  {'id': 'w02d2-sim', 'type': 'sim_embed', 'simulationSlug': 'picket-fence-g'},
  table('w02d2-extrapolate', 'pp.w02.predict-fit',
      ['Angle (deg) / Angulo', 'Measured a (m/s2) / a medida', 'Where MY line hits 90 deg / Donde MI linea llega a 90'], 3,
      'Extend your own line to 90 degrees and write the number. Do this BEFORE anyone says whether it is allowed.',
      'Extiende tu propia linea hasta 90 grados y escribe el numero. Hazlo ANTES de que alguien diga si se vale.',
      visual=FIT),
  question('w02d2-beat', 'pp.w02.predict-fit',
      'Your extended line says the cart would accelerate at about 14 m/s2 standing straight up. The fence you dropped says 9.8. Can a cart on a ramp beat a rock falling straight down?',
      'Tu linea extendida dice que el carrito aceleraria a unos 14 m/s2 vertical. La barra que soltaste dice 9.8. Puede un carrito en una rampa ganarle a una roca que cae?',
      [('no', 'NO', 'No - so something is wrong with the LINE, not the measurement', 'No - entonces algo esta mal con la LINEA, no con la medicion',
        'Right. The measurement is real; the straight line was a guess that only fits where you measured. / Correcto. La medicion es real; la recta solo sirve donde mediste.'),
       ('yes', 'YES', 'Yes - the ramp helps it', 'Si - la rampa lo ayuda',
        'The ramp can only give the cart PART of gravity. It can never give more than all of it. / La rampa solo da PARTE de la gravedad. Nunca puede dar mas que toda.'),
       ('meas', 'X', 'No - so the measurement must be wrong', 'No - entonces la medicion debe estar mal',
        'You made that measurement with your own hands, three times. Trust it, and look again at the line. / Hiciste esa medicion con tus manos, tres veces. Confia en ella.')],
      'no', 'Our line only works where we measured. Say that sentence out loud.',
      'Nuestra linea solo sirve donde medimos. Di esa frase en voz alta.',
      gate=True, visual=FIT,
      level_frames=[(1, 'A cart [can / cannot] beat a falling rock. My line is [right / wrong] at 90.', 'Un carrito [puede / no puede] ganarle a una roca que cae. Mi linea esta [bien / mal] en 90.'),
                    (2, 'The line cannot be trusted at 90 deg because ___.', 'No se puede confiar en la linea en 90 grados porque ___.')]),
  talk('w02d2-talk', 'So what was wrong - the measurement, or the line? Say which, and say how you know.',
       'Entonces que estaba mal - la medicion o la linea? Di cual, y di como lo sabes.'),
  frame('w02d2-write', 'pp.w02.g-diluted', 'WRITE - what the ramp does to gravity', 'ESCRIBE - que le hace la rampa a la gravedad',
      'The ramp gives the cart ___ of gravity. Steeper means ___. Straight up would be ___.',
      ['part / parte', 'all / toda', 'closer to g / mas cerca de g', 'bigger / mayor', '9.8', 'steeper / mas empinada'],
      [(1, 'The ramp gives [part / all] of gravity. Steeper = [closer to g / further from g]. Straight up = [9.8].',
        'La rampa da [parte / toda] la gravedad. Mas empinada = [mas cerca de g / mas lejos de g]. Vertical = [9.8].'),
       (2, 'The ramp gives the cart ___ of gravity, so steeper means ___.', 'La rampa le da al carrito ___ de la gravedad, asi que mas empinada significa ___.'),
       (3, 'In my words: ___', 'Con mis palabras: ___')], visual=RAMP),
  timeline('w02d2-timeline', 'pp.w00.timeline', 4),

  day('w02d3', 3, 'Off the end - run-out on the runner', 'Al salir - el recorrido en la alfombra',
      'Release and let it run until it stops, on the runner, three times at one angle. Nothing written for the first two - watch how much the three differ from each other.',
      'Suelta y dejalo correr hasta parar, sobre la alfombra, tres veces en un angulo. No escribas en las dos primeras - mira cuanto se diferencian entre si.',
      minutes=(25, 30, 25, 25)),
  table('w02d3-data', 'pp.w02.a-vs-angle',
      ['Angle (deg) / Angulo', 'Run 1 (cm)', 'Run 2 (cm)', 'Run 3 (cm)', 'Average / Promedio', 'Spread (biggest - smallest) / Diferencia'], 2,
      'How did doubling the steepness change the run-out? And how big is your spread compared to that change?',
      'Como cambio el recorrido al duplicar la inclinacion? Y que tan grande es tu diferencia comparada con ese cambio?',
      visual=CHAIN),
  talk('w02d3-talk', 'The cart left the ramp with a speed and the floor took it away. What would change the run-out WITHOUT changing the ramp at all?',
       'El carrito salio de la rampa con una rapidez y el piso se la quito. Que cambiaria el recorrido SIN cambiar la rampa?'),
  observe('w02d3-claim', 'pp.w02.friction-gap',
      'RECORD - what happened to the run-out when the angle got steeper?',
      'REGISTRA - que paso con el recorrido cuando el angulo se hizo mas empinado?',
      'NAME IT - what is taking the speed away, and WHERE is it acting? Point to it on the chain.',
      'NOMBRALO - que le quita la rapidez, y DONDE actua? Senalalo en la cadena.',
      'The run-out got ___ because the cart left the ramp ___. The speed is taken away by ___ acting at ___.',
      ['run-out / recorrido', 'faster / mas rapido', 'friction / friccion', 'floor / piso', 'wheels / ruedas', 'longer / mas largo'],
      [(1, 'Run-out got [longer / shorter]. Friction acts at the [floor / wheels].', 'El recorrido fue [mas largo / mas corto]. La friccion actua en [el piso / las ruedas].'),
       (2, 'The run-out got ___ because the cart left the ramp ___, and ___ took the speed away.', 'El recorrido fue ___ porque el carrito salio ___, y ___ le quito la rapidez.'),
       (3, 'The chain, in my words: ___', 'La cadena, con mis palabras: ___')], visual=CHAIN),

  day('w02d4', 4, 'The test - a new angle, locked', 'La prueba - un angulo nuevo, fijado',
      'HANDS FIRST, as always: one release at an angle you ALREADY ran on Wednesday, same runner, same release point. If it does not reproduce Wednesday, something moved - and we find out now, not after twenty predictions are locked against it.',
      'PRIMERO LAS MANOS, como siempre: una suelta en un angulo que YA corriste el miercoles, misma alfombra, mismo punto de suelta. Si no reproduce el miercoles, algo se movio - y lo sabemos ahora, no despues de fijar veinte predicciones.',
      minutes=(15, 25, 20, 20)),
  table('w02d4-anchor', 'pp.w02.predict-fit',
      ['Known angle (deg) / Angulo conocido', 'Today run-out (cm) / Hoy', 'Wednesday (cm) / Miercoles', 'Difference / Diferencia'], 1,
      'Does today match Wednesday? If not, what moved - the runner, the release point, or the cart?',
      'Coincide hoy con el miercoles? Si no, que se movio - la alfombra, el punto de suelta, o el carrito?',
      visual=CHAIN),
  frame('w02d4-predict', 'pp.w02.predict-fit', 'PREDICT (locked) - the NEW angle, before any release', 'PREDICE (fijada) - el angulo NUEVO, antes de soltar',
      'I predict the run-out at ___ deg will be ___ cm, because on my graph ___. I would be wrong if ___.',
      ['my graph / mi grafica', 'between / entre', 'run-out / recorrido', 'because / porque', 'faster / mas rapido', 'wrong if / equivocado si'],
      [(1, 'I predict ___ cm. From my graph: between ___ and ___.', 'Predigo ___ cm. De mi grafica: entre ___ y ___.'),
       (2, 'I predict ___ cm because on my graph ___.', 'Predigo ___ cm porque en mi grafica ___.'),
       (3, 'Prediction, reason, and what would prove me wrong: ___', 'Prediccion, razon, y que demostraria que me equivoco: ___')],
      gate=True, visual=FIT),
  table('w02d4-run', 'pp.w02.predict-fit', ['Run / Corrida', 'Run-out (cm) / Recorrido'], 3,
      'Three runs at the new angle. How much do they differ from each other?',
      'Tres corridas en el angulo nuevo. Cuanto se diferencian entre si?'),
  table('w02d4-gap', 'pp.w02.friction-gap',
      ['Predicted (cm) / Predicho', 'Actual (cm) / Real', 'Gap (cm) / Diferencia', 'Bigger or smaller / Mayor o menor'], 1,
      'Numbers only for now. The explanation is Friday.', 'Solo numeros por ahora. La explicacion es el viernes.', visual=CHAIN),
  talk('w02d4-talk', 'Whose prediction was closest - and was it closest because of better reasoning, or a luckier angle? "Luck" is an honest answer.',
       'Quien predijo mas cerca - y fue por mejor razonamiento o por un angulo con mas suerte? "Suerte" es una respuesta honesta.'),
  timeline('w02d4-timeline', 'pp.w00.timeline', 5),

  day('w02d5', 5, 'The reasoning artifact - name the friction', 'El artefacto de razonamiento - nombra la friccion',
      'One release at the tested angle, so the thing you are about to write about is in the room. Then the boards come down and the artifact opens. No new equipment today.',
      'Una suelta en el angulo probado, para que lo que vas a escribir este en la sala. Luego se quitan los tableros y se abre el artefacto. Hoy no hay equipo nuevo.',
      minutes=(20, 35, 25, 20)),
  {'id': 'w02d5-fig', 'type': 'figure', 'src': '/images/sei/run-out-chain.svg', 'align': 'full',
   'alt': 'Four boxes: angle, acceleration, speed at the bottom, run-out. Friction acts at the run-out box - the floor and the wheels.',
   'caption': 'The chain / La cadena - angle to run-out, and where friction acts'},
  observe('w02d5-artifact', 'pp.w02.friction-gap',
      'ARTIFACT - your prediction, the measurement, and the gap. Give all three as numbers.',
      'ARTEFACTO - tu prediccion, la medicion y la diferencia. Da los tres como numeros.',
      'EXPLAIN - name the friction AND say WHERE it acted: the runner, the wheels, the ramp, or the release. "Friction" with no place is not yet an explanation.',
      'EXPLICA - nombra la friccion Y di DONDE actuo: la alfombra, las ruedas, la rampa o la suelta. "Friccion" sin lugar todavia no es una explicacion.',
      'Predicted ___ cm, actual ___ cm. The gap is because friction acted at ___.',
      ['friction / friccion', 'runner / alfombra', 'wheels / ruedas', 'ramp / rampa', 'release / suelta', 'gap / diferencia'],
      [(1, 'Predicted ___ cm. Actual ___ cm. [Bigger / smaller]. Friction acted at the [runner / wheels / ramp].',
        'Predicho ___ cm. Real ___ cm. [Mayor / menor]. La friccion actuo en [la alfombra / las ruedas / la rampa].'),
       (2, 'I predicted ___ cm and got ___ cm. The gap is because friction acted at ___.',
        'Predije ___ cm y obtuve ___ cm. La diferencia es porque la friccion actuo en ___.'),
       (3, 'Prediction, result, and where the friction acted: ___', 'Prediccion, resultado, y donde actuo la friccion: ___')],
      lobby=True, visual=CHAIN),
  frame('w02d5-transfer', 'pp.w02.g-diluted', 'TRANSFER - the angle you never tested', 'TRANSFERENCIA - el angulo que nunca probaste',
      'At ___ degrees the run-out would be zero, because ___. That tells me the friction is ___.',
      ['zero / cero', 'flat / plana', 'does not move / no se mueve', 'friction / friccion', 'bigger / mayor', 'smaller / menor'],
      [(1, 'Run-out is zero when the ramp is [flat / steep].', 'El recorrido es cero cuando la rampa esta [plana / empinada].'),
       (2, 'At ___ deg the run-out would be zero because ___.', 'En ___ grados el recorrido seria cero porque ___.'),
       (3, 'Zero run-out, and what it says about friction: ___', 'Recorrido cero, y que dice sobre la friccion: ___')], visual=RAMP),
  talk('w02d5-talk', 'Someone in your group named a DIFFERENT place for the friction than you did. Who is right, and what one measurement would settle it?',
       'Alguien de tu grupo nombro un lugar DISTINTO para la friccion. Quien tiene razon, y que medicion lo resolveria?'),
  exit_ticket('w02-exit', 'pp.w02.friction-gap',
      'EXIT - Week 2 - one thing your prediction got wrong, and the one measurement that would have told you first.',
      'SALIDA - Semana 2 - una cosa en la que tu prediccion fallo, y la medicion que te lo habria dicho primero.',
      'My prediction was wrong about ___. The measurement that would have told me is ___.',
      [(1, 'Wrong about: [the distance / the friction / the angle]. I would measure ___.', 'Falle en: [la distancia / la friccion / el angulo]. Yo mediria ___.'),
       (2, 'My prediction was wrong about ___ because ___. I would measure ___ first.', 'Mi prediccion fallo en ___ porque ___. Yo mediria ___ primero.'),
       (3, 'Wrong about ___ - would measure ___', 'Falle en ___ - mediria ___')],
      ['predict / predecir', 'measure / medir', 'friction / friccion', 'run-out / recorrido', 'because / porque'], CHAIN),
]  # no week-wide rate: close_days() adds w02d5-rate on day 5's own targets (2026-09-04 rule)

WEEKS = [('pp-w00', 'w00', W00), ('pp-w01', 'w01', W01), ('pp-w02', 'w02', W02)]

def sql():
    out = ['-- Generated by scripts/gen_mvp_weeks.py — Project Physics week inputs (the app is the packet).',
           '-- Idempotent: blocks with ids starting <prefix>d / <prefix>- are stripped, then re-appended.', '']
    for slug, prefix, blocks in WEEKS:
        js = json.dumps(close_days(blocks), ensure_ascii=False)
        assert '$$' not in js
        out.append(f"""update public.lessons set content_blocks = jsonb_set(content_blocks, '{{blocks}}',
  (select coalesce(jsonb_agg(b order by o), '[]'::jsonb) from jsonb_array_elements(content_blocks->'blocks') with ordinality as x(b,o)
     where (b->>'id') not like '{prefix}d%' and (b->>'id') not like '{prefix}-%')
  || $${js}$$::jsonb), updated_at = now()
where slug = '{slug}';
select public.split_mvp_week('{slug}');  -- one lesson per day for students (2026-09-04)
""")
    return '\n'.join(out)

if __name__ == '__main__':
    print(sql())
