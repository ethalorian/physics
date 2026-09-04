#!/usr/bin/env python3
"""
vocab_sei_layer.py — the SEI layer on the Project Physics (MVP) vocabulary terms.

Each term in scripts/gen-projects-curriculum.py's VOCAB already carries a tier, an
English definition, a Spanish equivalent (cognate ≈ / false friend ≠) and an example.
This adds the two things the WIDA-1 route needs in the arcade games:
  icon           — a picture that carries the meaning on its own (emoji; no download)
  definition_es  — the same simple definition in Spanish, so a Level 1 student can
                   match the ENGLISH term to a clue they can actually read.
Keyed by (lesson slug, term). Emits idempotent SQL.

  python3 vocab_sei_layer.py > ../supabase/migrations/20260904_vocab_sei_layer.sql
"""

L = {
 'pp-w00': {
  'push': ('🫸', 'Mover algo lejos de ti.'),
  'pull': ('🫷', 'Mover algo hacia ti.'),
  'predict': ('🔮', 'Decir qué va a pasar antes de que pase.'),
  'measure': ('📏', 'Hallar un número con una herramienta.'),
  'evidence': ('🧾', 'Los números o dibujos que muestran que algo es cierto.'),
  'prediction': ('📝', 'Lo que dices que va a pasar, escrito antes de la prueba.'),
  'timeline': ('🗓️', 'El registro de lo que planeaste y lo que pasó de verdad.'),
 },
 'pp-w01': {
  'faster': ('🐇', 'Con más rapidez.'),
  'slower': ('🐢', 'Con menos rapidez.'),
  'graph': ('📈', 'Un dibujo de números: una cosa a lo ancho, otra hacia arriba.'),
  'slope': ('📐', 'Qué tan empinada es una línea en una gráfica.'),
  'position': ('📍', 'Dónde está algo, medido desde un punto de partida.'),
  'velocity': ('🧭', 'Qué tan rápido, y en qué dirección.'),
  'acceleration': ('🚀', 'Qué tan rápido cambia la velocidad.'),
  'displacement': ('↔️', 'El cambio de posición: dónde terminaste menos dónde empezaste.'),
 },
 'pp-w02': {
  'ramp': ('⛰️', 'Una superficie inclinada.'),
  'steep': ('🧗', 'Un ángulo grande; difícil de subir.'),
  'angle': ('📐', 'Cuánto está girada una línea desde lo plano, en grados.'),
  'data': ('🔢', 'Los números que recogiste.'),
  'gravity': ('🌍', 'El jalón de la Tierra sobre todo.'),
  'g': ('⬇️', 'La aceleración de la gravedad cerca de la Tierra: unos 9.8 m/s² hacia abajo.'),
  'friction': ('🧱', 'La fuerza que se opone al deslizamiento.'),
  'run-out': ('🛣️', 'Cuánto rueda el carrito por el piso después de la rampa.'),
 },
 'pp-w03': {
  'string': ('🧵', 'Una línea delgada por la que viaja el carro.'),
  'balloon': ('🎈', 'Una bolsa de goma llena de aire.'),
  'claim': ('🗣️', 'Lo que dices que es cierto, apoyado con evidencia.'),
  'compare': ('⚖️', 'Mirar dos cosas para ver qué es diferente.'),
  'force': ('💪', 'Un empujón o un jalón.'),
  'thrust': ('🚀', 'El empuje hacia adelante cuando el aire (o el combustible) sale hacia atrás.'),
  'net force': ('➕', 'Todas las fuerzas sumadas, con dirección.'),
  'free-body diagram': ('📦', 'Un dibujo de un objeto con una flecha por cada fuerza.'),
 },
 'pp-w04': {
  'launch': ('🚀', 'Enviar algo hacia arriba.'),
  'height': ('📏', 'Qué tan alto llega algo.'),
  'change': ('🔁', 'Hacer algo diferente a propósito.'),
  'increase': ('📈', 'Hacer más grande.'),
  'momentum': ('🎳', 'Masa por velocidad; qué tan difícil es detener algo.'),
  'impulse': ('👊', 'Una fuerza que actúa durante un tiempo; cambia la cantidad de movimiento.'),
  'apex': ('🔝', 'El punto más alto del vuelo.'),
  'projectile': ('🏹', 'Cualquier cosa que vuela con solo la gravedad jalándola.'),
 },
 'pp-w05': {
  'bridge': ('🌉', 'Una estructura que cruza un hueco.'),
  'break': ('💥', 'Partirse bajo carga.'),
  'template': ('📋', 'Un patrón que recortas y del que construyes.'),
  'label': ('🏷️', 'Escribir el nombre en cada parte.'),
  'tension': ('🪢', 'Una pieza jalada desde los dos extremos.'),
  'compression': ('🗜️', 'Una pieza empujada desde los dos extremos.'),
  'equilibrium': ('⚖️', 'Todas las fuerzas se equilibran; nada se mueve.'),
  'truss': ('🔺', 'Una estructura hecha de triángulos.'),
 },
 'pp-w06': {
  'handle': ('☕', 'La parte que sostienes.'),
  'choose': ('☑️', 'Escoger uno.'),
  'constraint': ('🚧', 'Una regla que el diseño debe seguir.'),
  'justify': ('🧠', 'Decir por qué tu elección sigue de las restricciones.'),
  'sketch': ('✏️', 'Un dibujo rápido de una idea.'),
  'torque': ('🔧', 'Un empujón que hace girar: fuerza por distancia al centro.'),
  'center of mass': ('🎯', 'El punto de equilibrio de un objeto.'),
 },
 'pp-w07': {
  'strand': ('🍝', 'Una sola pieza de pasta.'),
  'load': ('🏋️', 'El peso que sostiene una estructura.'),
  'design': ('📐', 'Planear algo para cumplir restricciones.'),
  'gap': ('↔️', 'La diferencia entre lo predicho y lo real.'),
  'member': ('🪵', 'Una pieza de una estructura.'),
  'failure load': ('💥', 'La carga con la que la estructura se rompe.'),
  'buckling': ('🌀', 'Una pieza en compresión que se dobla de lado y cede.'),
  'joint': ('🔗', 'Donde se unen las piezas.'),
 },
 'pp-w08': {
  'same': ('🟰', 'No diferente.'),
  'new': ('✨', 'Nunca visto antes.'),
  'transfer': ('🔄', 'Usar lo que aprendiste en algo nuevo.'),
  'rate': ('⭐', 'Darte un 1, 2 o 3.'),
  'artifact': ('📄', 'La página que prueba lo que aprendiste.'),
  'status report': ('📊', 'Un informe corto de lo que se sabe hasta ahora.'),
 },
 'pp-w09': {
  'drop': ('⬇️', 'La altura desde la que cae la canica.'),
  'loop': ('🎢', 'Un círculo completo de pista.'),
  'minimum': ('🔽', 'La menor cantidad que todavía funciona.'),
  'fraction': ('🍕', 'Una parte del total, como 1/4 o 25%.'),
  'energy': ('⚡', 'La capacidad de hacer que algo se mueva o cambie.'),
  'potential energy': ('🏔️', 'Energía guardada por la altura.'),
  'kinetic energy': ('🏃', 'Energía del movimiento.'),
  'conservation': ('♻️', 'El total se mantiene; la energía solo cambia de forma.'),
 },
 'pp-w10': {
  'wall': ('🧱', 'Una estructura vertical de un edificio.'),
  'sideways': ('↔️', 'Hacia el lado, no arriba ni abajo.'),
  'plan': ('📐', 'Un dibujo que dice cómo construir.'),
  'follow': ('👣', 'Hacer lo que dice el plano o la instrucción.'),
  'stud': ('🪵', 'Una pieza vertical del armazón.'),
  'load path': ('🛤️', 'La ruta que sigue una carga desde arriba hasta el suelo.'),
  'shear': ('✂️', 'Fuerza de lado que hace que un rectángulo se incline.'),
  'racking': ('📉', 'Un marco que se inclina como paralelogramo por el cortante.'),
 },
 'pp-w11': {
  'stretch': ('🪢', 'Hacer más largo jalando.'),
  'spin': ('🌀', 'Girar rápido.'),
  'store': ('🔋', 'Guardar para después.'),
  'efficiency': ('📊', 'Energía que sale dividida entre energía que entra.'),
  'elastic energy': ('🎯', 'Energía guardada en algo estirado o torcido.'),
  'work': ('🏗️', 'Fuerza por distancia; energía que entra o sale de algo.'),
  'power': ('⚡', 'Qué tan rápido se entrega la energía: energía por segundo.'),
  'drag': ('💨', 'La fricción del aire sobre un objeto en movimiento.'),
 },
 'pp-w12': {
  'syringe': ('💉', 'Un tubo con un émbolo.'),
  'lift': ('🏋️', 'Levantar algo.'),
  'multiply': ('✖️', 'Hacer más grande por un factor.'),
  'ratio': ('➗', 'Un número comparado con otro, como 4 a 1.'),
  'pressure': ('🫧', 'Fuerza repartida sobre un área.'),
  'area': ('⬜', 'Cuánta superficie, en cm².'),
  'hydraulic': ('💧', 'Que funciona empujando un líquido.'),
  "Pascal's principle": ('🔁', 'La presión en un líquido encerrado es la misma en todas partes.'),
 },
 'pp-w13': {
  'loud': ('🔊', 'Un sonido grande.'),
  'quiet': ('🔈', 'Un sonido pequeño.'),
  'chain': ('⛓️', 'Una serie de causas, una después de otra.'),
  'trace': ('📈', 'La línea que dibuja el micrófono.'),
  'vibration': ('〰️', 'Un movimiento rápido de ida y vuelta.'),
  'amplitude': ('📶', 'Qué tan grande es la onda; el volumen.'),
  'frequency': ('🎵', 'Cuántas ondas por segundo; el tono.'),
  'resonance': ('📣', 'Cuando una forma hace una frecuencia mucho más fuerte.'),
 },
 'pp-w14': {
  'battery': ('🔋', 'Una fuente de corriente eléctrica.'),
  'magnet': ('🧲', 'Un objeto con campo magnético.'),
  'direction': ('🧭', 'Hacia dónde: izquierda, derecha, arriba, abajo.'),
  'reverse': ('🔃', 'Dar la vuelta a lo contrario.'),
  'current': ('⚡', 'Carga eléctrica que se mueve por un cable.'),
  'magnetic field': ('🌐', 'El espacio alrededor de un imán o una corriente donde actúa una fuerza.'),
  'motor': ('⚙️', 'Un aparato que convierte corriente en giro.'),
  'rotation': ('🔄', 'Girar alrededor de un centro.'),
 },
 'pp-w15': {
  'coil': ('🌀', 'Alambre enrollado en vueltas.'),
  'cup': ('🥤', 'El cono de papel que mueve el aire.'),
  'signal': ('📡', 'Una corriente que cambia y lleva sonido.'),
  'cause': ('➡️', 'Lo que hace que algo pase.'),
  'electromagnet': ('🧲', 'Una bobina que se vuelve imán cuando pasa corriente.'),
  'pressure wave': ('🔊', 'Sonido: una onda de aire empujado.'),
  'speaker': ('🔈', 'Un aparato que convierte una señal en sonido.'),
  'variable': ('🎚️', 'La única cosa que cambias.'),
 },
 'pp-w16': {
  'blade': ('🪭', 'Un brazo de una turbina.'),
  'fan': ('🌬️', 'La fuente de viento.'),
  'estimate': ('🤔', 'Hallar un número aproximado.'),
  'output': ('📤', 'Lo que sale.'),
  'generator': ('⚙️', 'Un aparato que convierte giro en corriente.'),
  'induction': ('🧲', 'Un campo magnético que cambia y produce corriente.'),
  'voltage': ('🔌', 'El empuje eléctrico, en voltios.'),
  'turbine': ('🌀', 'Aspas que atrapan viento o agua para girar un eje.'),
 },
 'pp-w17': {
  'again': ('🔁', 'Una vez más.'),
  'better': ('👍', 'Mejorado.'),
  'redesign': ('📐', 'Cambiar un diseño por lo que aprendiste.'),
  'improve': ('📈', 'Hacer mejor.'),
  'review': ('🔍', 'Una revisión del trabajo hecha por otros.'),
  'iteration': ('🔄', 'Una ronda de construir, probar, cambiar.'),
  'test plan': ('📋', 'Qué vas a medir y cómo.'),
 },
 'pp-w18': {
  'same conditions': ('🟰', 'Todo igual que la primera vez.'),
  'worked': ('✅', 'Hizo lo que predijiste.'),
  'defend': ('🛡️', 'Explicar y responder preguntas sobre tu trabajo.'),
  'result': ('🏁', 'Lo que pasó.'),
  'panel': ('👥', 'El grupo que escucha y pregunta.'),
  'comparison': ('⚖️', 'Original y rediseño, lado a lado.'),
  'verdict': ('⚖️', 'La respuesta honesta: ¿funcionó?'),
 },
 'pp-w19': {
  'cover': ('📕', 'La primera página.'),
  'order': ('🔢', 'Poner en secuencia.'),
  'portfolio': ('🗂️', 'Todos tus artefactos, reunidos.'),
  'growth': ('🌱', 'Mejorar con el tiempo.'),
  'reflect': ('🪞', 'Mirar atrás y decir qué cambió.'),
  'reasoning': ('🧠', 'El pensamiento que conecta la evidencia con una afirmación.'),
 },
}

def q(s): return "'" + s.replace("'", "''") + "'"

def sql():
    out = ["-- Generated by scripts/vocab_sei_layer.py — icon + Spanish definition on every MVP term.",
           "alter table public.vocabulary_terms add column if not exists icon text;",
           "alter table public.vocabulary_terms add column if not exists definition_es text;",
           "comment on column public.vocabulary_terms.icon is 'SEI: a picture that carries the meaning on its own (emoji). Shown on term cards in the arcade.';",
           "comment on column public.vocabulary_terms.definition_es is 'SEI: the same simple definition in Spanish. Shown beside the English one when the student has L1 on.';",
           "with v(slug, term, icon, definition_es) as (values"]
    rows = []
    for slug, terms in L.items():
        for term, (icon, des) in terms.items():
            rows.append(f"  ({q(slug)}, {q(term)}, {q(icon)}, {q(des)})")
    out.append(",\n".join(rows) + ")")
    out.append("""update public.vocabulary_terms t set icon = v.icon, definition_es = v.definition_es
from v join public.lessons l on l.slug = v.slug join public.vocabulary_sets s on s.lesson_id::text = l.id::text
where t.vocabulary_set_id = s.id and lower(t.term) = lower(v.term);""")
    return "\n".join(out) + "\n"

if __name__ == '__main__':
    n = sum(len(t) for t in L.values()); import sys; print(sql()); print(f"-- {n} terms", file=sys.stderr)
