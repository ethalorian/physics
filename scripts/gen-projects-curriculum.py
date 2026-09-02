#!/usr/bin/env python3
"""
Project Physics (program = 'projects') — the MVP CPA section re-sequenced around
builds. Generates supabase/migrations/20260902_program_projects.sql from the
year map (claude/MVP-CPA-Physics-Project-Year-Map.md in the Claude project).

  python3 scripts/gen-projects-curriculum.py > supabase/migrations/20260902_program_projects.sql

One lesson = one ACADEMIC WEEK (one build). planned_days is in MEETINGS
(B+C blocks: 5-day week ≈ 9, 4-day ≈ 7, 3-day ≈ 5) because Project Physics
counts meetings like CPA physics. Units are TERMS; allotted_days is the sum of
the term's weekly meetings. Everything is upserted by id/slug — idempotent.
"""
import json

MEET = {5: 9, 4: 7, 3: 5}

UNITS = [
    ("proj-1", 1, "Phase 1: Track it — Motion, Forces & Structures (Asteroid 2026-XJ)", "Aug 31 – Dec 23 · nine academic weeks. The briefing arrives. Before anyone can say where 2026-XJ goes, the shop has to read motion off a record, find what forces do, and build things that hold.", "2026-08-31"),
    ("proj-2", 2, "Phase 2: Move it — Energy (Asteroid 2026-XJ)", "Jan 4 – Feb 12 · three academic weeks. A kinetic impactor is an energy budget: where the energy goes, and how much of it arrives.", "2027-01-04"),
    ("proj-3", 3, "Phase 3: Sense it — Fluids, Waves & Electromagnetism (Asteroid 2026-XJ)", "Mar 1 – Apr 16 · four academic weeks. The mission needs an arm, an ear and an actuator: pressure, sound, and the motor.", "2027-03-01"),
    ("proj-4", 4, "Phase 4: Power it, prove it — Generation & the Capstone (Asteroid 2026-XJ)", "Apr 26 – Jun 10 · four academic weeks. Power for the mission; then redesign one of your own builds and defend it to the mission review board.", "2027-04-26"),
]

# domain: knowledge | reasoning | skill | product
# Each week: slug, monday, days, unit, title_en, title_es, strand, core, targets[(slug, en, es, domain)],
#            opener, plan rows [(day, hands, write)], artifact_en, artifact_es, offweek_en, offweek_es, tools
WEEKS = [
 dict(slug="pp-w00", mon="2026-08-31", days=4, unit="proj-1", core=False, strand="engineering-design",
  en="The briefing · Predict before you test", es="La sesión informativa · Predice antes de probar",
  targets=[
   ("pp.w00.predict-lock", "I can write a prediction and lock it before I test, and say what evidence would prove me wrong.", "Puedo escribir una predicción y fijarla antes de probar, y decir qué evidencia demostraría que estoy equivocado.", "reasoning"),
   ("pp.w00.timeline", "I can keep an engineering timeline: what I planned, what actually happened, and why they differ.", "Puedo llevar una línea de tiempo de ingeniería: lo que planeé, lo que pasó realmente y por qué son diferentes.", "skill"),
  ],
  opener="Day 1: NASA's briefing. A 300–500 m object, 2026-XJ, is on a trajectory that reaches Earth around graduation. This room is the Planetary Defense Coordination Office's engineering shop — the people who build the things the analysts will need. First rule of the shop: something drops, rolls or flies in the first five minutes, and everyone writes a prediction on paper before anyone touches it. The prediction is graded for the reasoning, never for being right — say that out loud on day one.",
  know="Day 1: the briefing arrives. 2026-XJ, 300–500 m, trajectory still uncertain, arrival around graduation.",
  conn="Every mission decision this year will be a locked prediction checked against a measurement. The shop learns that habit today, on a paper tower.",
  plan=[("1", "A demo with a locked prediction; norms for the four-segment block", "Prediction frame: I think… because… / Creo que… porque…"),
        ("2", "Vernier motion detector first touch — walk toward and away, watch the trace", "Sketch what the screen showed and label it in either language"),
        ("3", "Teams, roles, the packet, the timeline page", "First timeline entry"),
        ("4", "Mini-build: paper tower, 20 minutes, one locked prediction of height", "Predicted vs. actual, one sentence on the gap")],
  art_en="A locked prediction, the measured result, and one sentence explaining the gap.",
  art_es="Una predicción fijada, el resultado medido y una oración que explique la diferencia.",
  off_en="Find one thing at your shop or at home that someone predicted before building. What did they predict, and were they right?",
  off_es="Encuentra algo en tu taller o en tu casa que alguien predijo antes de construir. ¿Qué predijo y tenía razón?",
  tools="Vernier motion detector"),

 dict(slug="pp-w01", mon="2026-09-14", days=5, unit="proj-1", core=True, strand="motion-graphs",
  en="Read the track · Describing motion", es="Leer la trayectoria · Describir el movimiento",
  targets=[
   ("pp.w01.read-graph", "I can read a position–time or velocity–time graph and say in words how the object moved.", "Puedo leer una gráfica de posición–tiempo o velocidad–tiempo y decir con palabras cómo se movió el objeto.", "knowledge"),
   ("pp.w01.v-from-slope", "I can find velocity from the slope of a position–time graph.", "Puedo hallar la velocidad a partir de la pendiente de una gráfica posición–tiempo.", "skill"),
   ("pp.w01.a-from-slope", "I can tell whether an object is speeding up, slowing down or steady from how the slope changes.", "Puedo saber si un objeto acelera, frena o va constante por cómo cambia la pendiente.", "reasoning"),
   ("pp.w01.area", "I can find displacement from the area under a velocity–time graph.", "Puedo hallar el desplazamiento a partir del área bajo una gráfica velocidad–tiempo.", "skill"),
   ("pp.w01.sketch-first", "I can sketch the graph of a motion before the screen shows it, and fix my sketch from the evidence.", "Puedo dibujar la gráfica de un movimiento antes de que la pantalla la muestre, y corregir mi dibujo con la evidencia.", "reasoning"),
  ],
  opener="Tracking data on 2026-XJ arrives as position over time — a graph. Nobody in the shop gets to build a thing for the mission until they can read one. This week the motion detector is our telescope: the screen never draws a graph a student has not already sketched by hand. Walk the graph; then the reverse — sketch the graph of a walk before it appears.",
  know="The analysts have 2026-XJ's position at a handful of dates. That is all a track is: position over time.",
  conn="Reading the asteroid's track is reading a position–time graph. Slope is its velocity; a changing slope means something is pulling on it.",
  plan=[("1", "Motion detector graph matching, both directions", "Three sketches with the match score"),
        ("2", "Sims: constant-velocity, uniformly-accelerated-motion — used only to CHECK a hand prediction", "Predict / check / fix table"),
        ("3", "Sims: area-under-curve, slope-calculator — a number out of a graph", "One slope, one area, in their own words"),
        ("4", "A real cart on the track with the motion detector", "Sketch, then compare"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="A record of motion you have never seen: describe it and defend the description from the graph. Then draw the graph that WOULD match a motion described in words.",
  art_es="Un registro de movimiento que nunca has visto: descríbelo y defiende tu descripción con la gráfica. Luego dibuja la gráfica que correspondería a un movimiento descrito con palabras.",
  off_en="Watch one thing move at work or at home for ten seconds. Sketch its velocity–time graph from memory.",
  off_es="Observa algo moverse en el trabajo o en casa durante diez segundos. Dibuja de memoria su gráfica velocidad–tiempo.",
  tools="Vernier motion detector · sims: constant-velocity, uniformly-accelerated-motion, area-under-curve, slope-calculator"),

 dict(slug="pp-w02", mon="2026-09-28", days=5, unit="proj-1", core=True, strand="motion-graphs",
  en="What bends the track · Car and ramp", es="Qué curva la trayectoria · Carro y rampa",
  targets=[
   ("pp.w02.a-vs-angle", "I can measure a cart's acceleration at several ramp angles and show how it changes.", "Puedo medir la aceleración de un carrito en varios ángulos de rampa y mostrar cómo cambia.", "skill"),
   ("pp.w02.predict-fit", "I can predict the run-out at a new angle from my own data before I release the cart.", "Puedo predecir el recorrido en un ángulo nuevo a partir de mis propios datos antes de soltar el carrito.", "reasoning"),
   ("pp.w02.g-diluted", "I can explain that the ramp dilutes gravity: steeper means closer to g.", "Puedo explicar que la rampa diluye la gravedad: más inclinada significa más cerca de g.", "knowledge"),
   ("pp.w02.friction-gap", "I can use friction to explain the gap between my prediction and the measurement.", "Puedo usar la fricción para explicar la diferencia entre mi predicción y la medición.", "reasoning"),
  ],
  opener="2026-XJ's track bends because gravity pulls on it. The shop's version: one cart, one ramp, three angles — the ramp dilutes gravity, and the steeper it is the closer the cart's acceleration gets to g. Which angle gives the biggest acceleration, and by how much? Prediction locked before the first run.",
  know="From last week: a bending track means acceleration. The analysts say the bend is gravity — the Sun's and, near the end, Earth's.",
  conn="The ramp lets us dial gravity down and measure it. Extrapolate the fit to vertical and you have g — the same g that will bend 2026-XJ's final approach.",
  plan=[("1", "Cart on the ramp at 3 angles with photogate + picket fence (or motion detector)", "a-vs-angle table and sketch"),
        ("2", "Sim twin: picket-fence-g — what would the ramp read if it were vertical?", "Extrapolate the fit toward 90°"),
        ("3", "Run-out on the floor: measure distance after the ramp at two angles", "Run-out vs. angle"),
        ("4", "The test: predict run-out at a NEW angle, locked, then release", "Predicted / actual / gap"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Your prediction of run-out at the new angle, the measurement, and an explanation of the gap that names friction and says where it acted.",
  art_es="Tu predicción del recorrido en el ángulo nuevo, la medición y una explicación de la diferencia que nombre la fricción y diga dónde actuó.",
  off_en="Find a ramp (a loading dock, a driveway, a wheelchair ramp). Estimate its angle. Would a cart reach g on it? Why not?",
  off_es="Encuentra una rampa (un muelle de carga, una entrada, una rampa de silla de ruedas). Estima su ángulo. ¿Alcanzaría un carrito la aceleración g en ella? ¿Por qué no?",
  tools="Vernier photogate + picket fence, or motion detector · sim: picket-fence-g"),

 dict(slug="pp-w03", mon="2026-10-12", days=4, unit="proj-1", core=True, strand="forces-dynamics",
  en="Push on it · Balloon thruster on a line", es="Empújalo · Propulsor de globo en una línea",
  targets=[
   ("pp.w03.fbd", "I can draw a free-body diagram of the car mid-run with every force labeled.", "Puedo dibujar un diagrama de cuerpo libre del carro a mitad del recorrido con cada fuerza etiquetada.", "skill"),
   ("pp.w03.net-force", "I can explain the car's motion from the net force: speeding up while thrust wins, slowing when friction wins.", "Puedo explicar el movimiento del carro a partir de la fuerza neta: acelera mientras gana el empuje, frena cuando gana la fricción.", "reasoning"),
   ("pp.w03.third-law", "I can say what pushes on what when air leaves the balloon, and which is the thrust.", "Puedo decir qué empuja a qué cuando el aire sale del globo, y cuál es el empuje.", "knowledge"),
   ("pp.w03.limit-claim", "I can claim which force limits the run and back it with one controlled comparison.", "Puedo afirmar qué fuerza limita el recorrido y respaldarlo con una comparación controlada.", "reasoning"),
  ],
  opener="To move 2026-XJ, something has to push on it. The shop's first thruster: a balloon car that carries a Duplo crew member across the room on a string. Who gets farthest — and what stopped the rest? Air pushes out, the car pushes forward; friction on the string argues the whole way.",
  know="Deflection means applying a force to the asteroid. The analysts want to know what a thruster can actually do against friction and mass.",
  conn="A balloon car is a thruster with a passenger. Its free-body diagram is the same drawing the analysts make for an impactor — thrust one way, resistance the other, mass in the middle.",
  plan=[("1", "Build v1, first run, measure distance; FBD on the packet page", "FBD with forces labeled in either language"),
        ("2", "Controlled comparison: change ONE thing (passenger mass, balloon size, string type)", "Claim + evidence"),
        ("3", "Sim twin: sumo-forces / carts-third-law for the third-law pair", "Third-law pairs table"),
        ("4", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="A free-body diagram of the car mid-run and a claim about which force limits the run, backed by one comparison where only one thing changed.",
  art_es="Un diagrama de cuerpo libre del carro a mitad del recorrido y una afirmación sobre qué fuerza limita el recorrido, respaldada por una comparación donde solo cambió una cosa.",
  off_en="Name one thing at your shop that moves because something pushes back on it (a nail gun, a hose, a grinder). What is the pair of forces?",
  off_es="Nombra algo en tu taller que se mueve porque algo lo empuja de vuelta (una pistola de clavos, una manguera, una amoladora). ¿Cuál es el par de fuerzas?",
  tools="Balloons, straws, string, Duplo · sims: sumo-forces, carts-third-law, free-body-diagram"),

 dict(slug="pp-w04", mon="2026-10-26", days=5, unit="proj-1", core=True, strand="forces-dynamics",
  en="The kinetic impactor · Water rockets", es="El impactador cinético · Cohetes de agua",
  targets=[
   ("pp.w04.n3-momentum", "I can explain the launch as momentum: water goes down, rocket goes up, and the totals match.", "Puedo explicar el lanzamiento como cantidad de movimiento: el agua baja, el cohete sube y los totales coinciden.", "knowledge"),
   ("pp.w04.impulse", "I can predict how changing water volume or pressure changes the impulse and the apex.", "Puedo predecir cómo cambiar el volumen de agua o la presión cambia el impulso y la altura máxima.", "reasoning"),
   ("pp.w04.two-motions", "I can treat the flight as two motions — up-and-down under gravity, and sideways — and say which one the wind touches.", "Puedo tratar el vuelo como dos movimientos — arriba y abajo por la gravedad, y de lado — y decir cuál toca el viento.", "reasoning"),
   ("pp.w04.redesign-data", "I can change one thing for launch two because of what launch one measured.", "Puedo cambiar una cosa para el segundo lanzamiento por lo que midió el primero.", "product"),
  ],
  opener="In 2022 NASA's DART spacecraft hit the asteroid Dimorphos and changed its orbit — a kinetic impactor. The shop builds and launches its own: a two-liter bottle, water, pressure. Outdoors, last dependable week for it. How high, and what decides it? Water goes down, rocket goes up, and the totals match.",
  know="DART proved a kinetic impactor works: momentum delivered to the asteroid changes its path. 2026-XJ is bigger, and there is one year.",
  conn="A water rocket IS impulse — momentum leaving the nozzle is momentum gained by the rocket. The apex tells us how much impulse the launch delivered.",
  plan=[("1", "Build: fins, nose, a water line marked; prediction of apex from water volume", "Locked prediction with an impulse reason"),
        ("2", "Launch 1, timed flight, apex from hang time; sim twin: impulse-momentum", "Measured apex vs. prediction"),
        ("3", "Sim: projectile-motion — tilt the launcher, predict range", "Two-motion sketch"),
        ("4", "Launch 2 = the redesign, one change, locked prediction", "Predicted / actual / gap"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Your prediction of apex from the water and pressure you chose, the measured apex, the gap explained, and the ONE change you made for launch two and why.",
  art_es="Tu predicción de la altura máxima a partir del agua y la presión que elegiste, la altura medida, la explicación de la diferencia y el ÚNICO cambio que hiciste para el segundo lanzamiento y por qué.",
  off_en="What in your trade uses pressure to move something? How is it like the rocket, and how is it not?",
  off_es="¿Qué en tu oficio usa presión para mover algo? ¿En qué se parece al cohete y en qué no?",
  tools="Water rocket launcher, 2 L bottles, bike pump, stopwatch · sims: impulse-momentum, projectile-motion"),

 dict(slug="pp-w05", mon="2026-11-09", days=4, unit="proj-1", core=True, strand="structures",
  en="The launch gantry · Card-stock bridges", es="La torre de lanzamiento · Puentes de cartulina",
  targets=[
   ("pp.w05.equilibrium", "I can explain that a bridge that stays still has zero net force at every joint.", "Puedo explicar que un puente que se queda quieto tiene fuerza neta cero en cada unión.", "knowledge"),
   ("pp.w05.tension-compression", "I can label each member of a truss as tension or compression before it is loaded.", "Puedo etiquetar cada miembro de una armadura como tensión o compresión antes de cargarla.", "reasoning"),
   ("pp.w05.triangles", "I can explain why triangles hold their shape and rectangles do not.", "Puedo explicar por qué los triángulos mantienen su forma y los rectángulos no.", "knowledge"),
   ("pp.w05.predict-member", "I can predict which member fails first and check it against the load test.", "Puedo predecir qué miembro falla primero y comprobarlo con la prueba de carga.", "reasoning"),
  ],
  opener="The impactor needs a structure to launch from, and the shop needs to know which piece of a structure breaks first. Templated on purpose — a four-day week and a first structure should not also be an open design. Cut, fold, glue; then decide which member goes first, before the load goes on.",
  know="The impactor is designed. Now something has to hold it — and every part of a structure is either being pulled or being squeezed.",
  conn="A truss is the mission's launch gantry in miniature. Tension, compression, and the triangle that keeps its shape are the same physics at every scale.",
  plan=[("1", "Cut and assemble from the template; push and pull on a bare rectangle vs. a triangle", "Which shape held, and why"),
        ("2", "Label every member T or C before loading; sim twin: free-body-diagram at one joint", "Labeled truss diagram"),
        ("3", "Load test to failure; watch which member went", "Predicted / actual failure member"),
        ("4", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Your labeled truss (tension / compression), your predicted first failure, what actually failed, and what that tells you about your labels.",
  art_es="Tu armadura etiquetada (tensión / compresión), tu predicción del primer fallo, lo que falló realmente y lo que eso te dice sobre tus etiquetas.",
  off_en="Find a triangle holding something up at your shop or on the way home. Which side is being pulled and which is being pushed?",
  off_es="Encuentra un triángulo que sostenga algo en tu taller o de camino a casa. ¿Qué lado está siendo jalado y cuál empujado?",
  tools="Card stock, glue, bridge template, load bucket + sand · sim: free-body-diagram"),

 dict(slug="pp-w06", mon="2026-11-23", days=3, unit="proj-1", core=False, strand="engineering-design",
  en="Design under constraints · The mug", es="Diseñar con restricciones · La taza",
  targets=[
   ("pp.w06.constraints", "I can write the constraints a design must meet before I sketch it.", "Puedo escribir las restricciones que un diseño debe cumplir antes de dibujarlo.", "skill"),
   ("pp.w06.torque", "I can explain why a handle far from the mug's center makes it harder to hold steady.", "Puedo explicar por qué un asa lejos del centro de la taza hace más difícil sostenerla firme.", "knowledge"),
   ("pp.w06.justify", "I can choose one design from three and show that the choice follows from the constraints.", "Puedo elegir un diseño entre tres y mostrar que la elección se deriva de las restricciones.", "reasoning"),
  ],
  opener="Mission hardware is designed under constraints — mass, size, who has to use it. The shop learns that process on something with no build risk: three days before Thanksgiving is the wrong time for a load test and the right time for a design sprint. Interview a user, write constraints, sketch three mugs, choose one, justify it.",
  know="The analysts have handed the shop a constraint list for the gantry. Nobody in the shop has designed to a constraint list yet.",
  conn="The design process — constraints first, options second, a justified choice last — is what the open gantry design in two weeks will demand under pressure. Learn it on a mug.",
  plan=[("1", "Interview a partner about their mug; write constraints", "Constraint list"),
        ("2", "Three sketches; center-of-mass and handle torque with a real mug on a scale", "Sketches with one physics note each"),
        ("3", "Choose one, justify; reasoning artifact + rate yourself", "The artifact")],
  art_en="Your constraints, your three sketches, and a justification page showing that the design you chose actually follows from the constraints you wrote.",
  art_es="Tus restricciones, tus tres bocetos y una página de justificación que muestre que el diseño que elegiste realmente se deriva de las restricciones que escribiste.",
  off_en="Pick one tool you use every week. What is one constraint its designer clearly had, and one they clearly ignored?",
  off_es="Elige una herramienta que uses cada semana. ¿Cuál es una restricción que su diseñador claramente tuvo y una que claramente ignoró?",
  tools="Mugs, a scale, sketch paper"),

 dict(slug="pp-w07", mon="2026-12-07", days=5, unit="proj-1", core=True, strand="structures",
  en="The gantry, open design · Pasta bridges", es="La torre, diseño abierto · Puentes de pasta",
  targets=[
   ("pp.w07.material-test", "I can test single strands to find what one member can hold in tension and in compression.", "Puedo probar hebras individuales para hallar lo que un miembro aguanta en tensión y en compresión.", "skill"),
   ("pp.w07.predict-load", "I can predict my bridge's failure load from the member I think goes first.", "Puedo predecir la carga de fallo de mi puente a partir del miembro que creo que falla primero.", "reasoning"),
   ("pp.w07.design-constraint", "I can design a bridge to a span, a mass limit and a load target, and say which constraint cost me the most.", "Puedo diseñar un puente para una luz, un límite de masa y una carga objetivo, y decir qué restricción me costó más.", "product"),
   ("pp.w07.gap", "I can explain the gap between predicted and actual failure load in terms of joints, buckling or a member I mislabeled.", "Puedo explicar la diferencia entre la carga de fallo predicha y la real en términos de uniones, pandeo o un miembro mal etiquetado.", "reasoning"),
  ],
  opener="The template is gone. Span, mass limit, load target — the gantry's constraint list. Before you build, test one strand: how much does one piece of pasta actually hold? Then design, label every member, predict the failure load from the weakest one, build, and load it until it breaks.",
  know="Constraints from week 6, member analysis from week 5. The shop now designs the gantry itself.",
  conn="A predicted failure load from your own material tests is exactly what a mission structural engineer signs their name to. The gap between predicted and actual is where the learning is.",
  plan=[("1", "Strand tests: tension and compression to failure; constraints on the packet page", "Material test table"),
        ("2", "Design on paper, labeled T/C, predicted failure load from the weakest member", "Locked prediction"),
        ("3", "Build", "Timeline entry: planned vs. actual build time"),
        ("4", "Load test to failure", "Predicted / actual / what went first"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Member-by-member: which goes first and why; your predicted failure load from your own strand tests; the actual; and an explanation of the gap.",
  art_es="Miembro por miembro: cuál falla primero y por qué; tu carga de fallo predicha a partir de tus propias pruebas de hebras; la real; y una explicación de la diferencia.",
  off_en="Look at a real bridge or a roof truss. Find the member you would worry about most. Why that one?",
  off_es="Mira un puente real o una armadura de techo. Encuentra el miembro que más te preocuparía. ¿Por qué ese?",
  tools="Spaghetti, hot glue, load bucket + sand, Vernier force sensor for strand tests"),

 dict(slug="pp-w08", mon="2026-12-21", days=3, unit="proj-1", core=False, strand="transfer",
  en="Mission status · Term 1 checkpoint", es="Estado de la misión · Punto de control del trimestre 1",
  targets=[
   ("pp.w08.transfer", "I can use what I learned from one build to explain a structure or motion I have never seen.", "Puedo usar lo que aprendí de una construcción para explicar una estructura o un movimiento que nunca he visto.", "reasoning"),
   ("pp.w08.self-rate", "I can rate myself honestly on every Term 1 target and point to the evidence.", "Puedo evaluarme con honestidad en cada meta del trimestre 1 y señalar la evidencia.", "skill"),
  ],
  opener="Not a new build. What does the shop know by December — about motion, about forces, about what holds? A transfer task on a structure or motion nobody has seen, a self-rating against every Phase 1 target, and the first real read of the engineering timeline.",
  know="Four months in: the track can be read, the forces can be drawn, the gantry held (or didn't). The analysts want a status report.",
  conn="A status report is a transfer task: use what the builds taught on something the mission has not shown you yet.",
  plan=[("1", "Transfer task: a new structure or motion, argued from the graph or the FBD", "The transfer task"),
        ("2", "Self-rating on every Term 1 target with the artifact that proves it", "Rating sheet"),
        ("3", "Timeline read: where did planned and actual diverge most this term, and why?", "Timeline reflection")],
  art_en="The transfer task, and your self-rating with the artifact you point to for each target.",
  art_es="La tarea de transferencia y tu autoevaluación con el artefacto que señalas para cada meta.",
  off_en="Vacation. Nothing is due. Bring back one photo of a structure that interests you.",
  off_es="Vacaciones. No hay nada que entregar. Trae una foto de una estructura que te interese.",
  tools="Packet, Term 1 artifacts"),

 dict(slug="pp-w09", mon="2027-01-04", days=5, unit="proj-2", core=True, strand="energy-transfer",
  en="The gravity well · Marble roller coasters", es="El pozo de gravedad · Montañas rusas de canica",
  targets=[
   ("pp.w09.pe-ke", "I can trace energy from height to speed along a track and say where it is at any point.", "Puedo seguir la energía desde la altura hasta la rapidez a lo largo de una pista y decir dónde está en cualquier punto.", "knowledge"),
   ("pp.w09.loop-min", "I can predict the minimum drop height for a loop of a given size before I build it.", "Puedo predecir la altura mínima de caída para un rizo de un tamaño dado antes de construirlo.", "reasoning"),
   ("pp.w09.loss-fraction", "I can report the energy lost to friction as a fraction of the starting energy.", "Puedo informar la energía perdida por fricción como una fracción de la energía inicial.", "skill"),
   ("pp.w09.track-graph", "I can read a track as an energy graph: height is potential, the rest is kinetic or lost.", "Puedo leer una pista como una gráfica de energía: la altura es potencial, el resto es cinética o perdida.", "reasoning"),
  ],
  opener="An orbit is an energy graph: height is potential, the rest is kinetic or lost. The shop builds the graph out of card stock and runs a marble through it. Before the loop goes in: how high does the start have to be for the marble to make it round? Locked, then built.",
  know="Phase 2 opens. The analysts describe 2026-XJ's path as falling into and climbing out of the Sun's gravity well — an energy account, not just a track.",
  conn="A track is a gravity well you can hold. The minimum drop for a loop is the same accounting as the minimum speed to escape or to stay in orbit.",
  plan=[("1", "Build the straight run; measure marble speed at the bottom with a photogate; compare to the height", "Height vs. speed table"),
        ("2", "Predict the minimum drop for the loop; lock it", "Locked prediction with an energy reason"),
        ("3", "Build the loop; find the real minimum by lowering the start", "Predicted / actual"),
        ("4", "Loss as a fraction of starting energy; where does it go?", "Loss fraction and where"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Your predicted minimum drop for the loop, the measured one, and the difference expressed as the fraction of starting energy that friction took.",
  art_es="Tu altura mínima de caída predicha para el rizo, la medida, y la diferencia expresada como la fracción de la energía inicial que se llevó la fricción.",
  off_en="Where in your trade does something go up so that it can come down with energy? (A pile driver, a hammer, a load on a hoist.)",
  off_es="¿Dónde en tu oficio algo sube para que pueda bajar con energía? (Un martinete, un martillo, una carga en un montacargas.)",
  tools="Roller-coaster card-stock templates, marbles, Vernier photogate"),

 dict(slug="pp-w10", mon="2027-01-18", days=3, unit="proj-2", core=False, strand="structures",
  en="The shelter wall · Balsa stick framing", es="La pared del refugio · Bastidor de balsa",
  targets=[
   ("pp.w10.load-path", "I can trace the load path from the top plate through the studs to the floor.", "Puedo seguir la ruta de la carga desde la solera superior por los montantes hasta el piso.", "knowledge"),
   ("pp.w10.racking", "I can predict what a bare frame does when pushed sideways, and explain why sheathing stops it.", "Puedo predecir lo que hace un bastidor sin forro cuando se empuja de lado, y explicar por qué el forro lo detiene.", "reasoning"),
   ("pp.w10.sixteen", "I can explain why studs are sixteen on center and measured to centers.", "Puedo explicar por qué los montantes van a dieciséis pulgadas entre centros y se miden a los centros.", "knowledge"),
   ("pp.w10.read-plan", "I can build a wall section from a framing plan without asking what a symbol means.", "Puedo construir una sección de pared a partir de un plano de bastidor sin preguntar qué significa un símbolo.", "skill"),
  ],
  opener="If a fragment of 2026-XJ comes down, what does a wall have to do? Three days, a templated build, and the direct link to the trades section: frame it — plates, studs sixteen on center, a header — then push it sideways before and after sheathing.",
  know="Phase 1 gave the shop trusses. A wall is a truss with the triangle hidden inside a rectangle.",
  conn="A shelter wall's job is a load path and shear resistance. Racking the bare frame, then the sheathed one, shows where the triangle was hiding.",
  plan=[("1", "Frame from the plan: plates, studs at 16 o.c., a header", "Load-path sketch"),
        ("2", "Rack the bare frame (predict first); sheathe one side; rack again", "Predicted / actual racking"),
        ("3", "Why triangulation was hiding in a rectangle; reasoning artifact + rate yourself", "The artifact")],
  art_en="Your prediction of what the bare frame does when racked, what it did, and why the sheathing changed it — with the hidden triangle drawn.",
  art_es="Tu predicción de lo que hace el bastidor sin forro al empujarlo de lado, lo que hizo, y por qué el forro lo cambió — con el triángulo escondido dibujado.",
  off_en="Look at a wall being framed or a stud wall opened up. Where is the shear resistance actually coming from?",
  off_es="Mira una pared que se esté armando o una pared de montantes abierta. ¿De dónde viene realmente la resistencia al corte?",
  tools="Balsa, glue, framing plan, card stock for sheathing"),

 dict(slug="pp-w11", mon="2027-02-01", days=5, unit="proj-2", core=True, strand="energy-transfer",
  en="Propulsion efficiency · Lou-Vee air cars", es="Eficiencia de propulsión · Carros de aire Lou-Vee",
  targets=[
   ("pp.w11.elastic-pe", "I can find the energy stored in a rubber band from its force–stretch curve.", "Puedo hallar la energía almacenada en una banda elástica a partir de su curva fuerza–estiramiento.", "skill"),
   ("pp.w11.work-power", "I can find the car's kinetic energy at best speed and the power the band delivered.", "Puedo hallar la energía cinética del carro a su mejor rapidez y la potencia que entregó la banda.", "skill"),
   ("pp.w11.efficiency", "I can report efficiency as energy out over energy in, and say where the rest went.", "Puedo informar la eficiencia como energía de salida sobre energía de entrada, y decir a dónde fue el resto.", "reasoning"),
   ("pp.w11.attack-loss", "I can choose which loss to attack in the redesign and defend the choice with my numbers.", "Puedo elegir qué pérdida atacar en el rediseño y defender la elección con mis números.", "reasoning"),
  ],
  opener="The impactor's engine stores energy and delivers some of it. How much, and where did the rest go? The shop's engine is a rubber band and a propeller. Measure what the band stores, measure what the car gets, report the efficiency, then attack the biggest loss.",
  know="The kinetic impactor's budget: energy stored on the pad versus energy that arrives at the asteroid. The analysts want the ratio.",
  conn="Efficiency — energy out over energy in — is the number every propulsion engineer reports. The air car lets the shop measure both sides.",
  plan=[("1", "Build v1; force–stretch curve of the band with the force sensor", "Curve and area = stored energy"),
        ("2", "Run: speed with the motion detector or photogate; kinetic energy", "Energy in / energy out"),
        ("3", "Efficiency; list the losses (prop, axle, air); pick ONE to attack", "Loss list with a choice"),
        ("4", "Redesign run, locked prediction of the new efficiency", "Predicted / actual"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Energy stored in the band (from your curve), kinetic energy at best speed, the efficiency, where the rest went, and the one loss you attacked and what it did.",
  art_es="Energía almacenada en la banda (de tu curva), energía cinética a la mejor rapidez, la eficiencia, a dónde fue el resto, y la pérdida que atacaste y qué efecto tuvo.",
  off_en="Winter vacation follows. Nothing is due. Find one machine at work with an efficiency rating on its plate. What is it?",
  off_es="Siguen las vacaciones de invierno. No hay nada que entregar. Encuentra una máquina en el trabajo con una eficiencia en su placa. ¿Cuál es?",
  tools="Lou-Vee air car kits, Vernier force sensor, motion detector or photogate"),

 dict(slug="pp-w12", mon="2027-03-01", days=5, unit="proj-3", core=True, strand="fluids-pressure",
  en="The sample arm · Hydraulic claws", es="El brazo de muestras · Garras hidráulicas",
  targets=[
   ("pp.w12.pressure", "I can define pressure as force over area and use it with real syringe sizes.", "Puedo definir la presión como fuerza sobre área y usarla con tamaños reales de jeringa.", "knowledge"),
   ("pp.w12.pascal", "I can explain that pressure is the same everywhere in the tube, so a small syringe can push a big one.", "Puedo explicar que la presión es la misma en todo el tubo, así que una jeringa pequeña puede empujar una grande.", "knowledge"),
   ("pp.w12.force-mult", "I can predict the force multiplication from the two syringe diameters and measure it.", "Puedo predecir la multiplicación de fuerza a partir de los dos diámetros de jeringa y medirla.", "reasoning"),
   ("pp.w12.distance-cost", "I can show that what you gain in force you pay in distance — work in equals work out.", "Puedo mostrar que lo que ganas en fuerza lo pagas en distancia — el trabajo de entrada es igual al de salida.", "reasoning"),
  ],
  opener="A spacecraft that visits 2026-XJ needs an arm — and an arm needs force multiplication. The shop's version is syringes and tubing. Push the small one; the big one moves with more force and less distance. Predict the ratio from the diameters before you measure it.",
  know="Phase 3 opens: the mission needs an arm, an ear and an actuator. First the arm.",
  conn="Pascal's principle is force multiplication that costs distance — work in equals work out. The claw that lifts a known mass is the sample arm at desk scale.",
  plan=[("1", "Measure syringe diameters; predict force ratio; lock it", "Locked prediction"),
        ("2", "Measure force in vs. out with two force sensors; distances too", "Force and distance table"),
        ("3", "Build the claw (3–4 syringes)", "Timeline entry"),
        ("4", "Claw challenge: lift a known mass; work in vs. work out", "Work in / work out"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Your predicted force multiplication from the diameters, the measured one, and the reconciliation with distance — work in vs. work out.",
  art_es="Tu multiplicación de fuerza predicha a partir de los diámetros, la medida, y la reconciliación con la distancia — trabajo de entrada vs. trabajo de salida.",
  off_en="Find a hydraulic system at work (a jack, a lift, a brake). Which cylinder is small and which is big, and why that way round?",
  off_es="Encuentra un sistema hidráulico en el trabajo (un gato, un elevador, un freno). ¿Qué cilindro es pequeño y cuál es grande, y por qué en ese orden?",
  tools="Syringes (two sizes), tubing, craft sticks, two Vernier force sensors"),

 dict(slug="pp-w13", mon="2027-03-15", days=5, unit="proj-3", core=True, strand="waves-sound",
  en="The ear · Record player and megaphone", es="El oído · Tocadiscos y megáfono",
  targets=[
   ("pp.w13.wave-props", "I can name amplitude, frequency and wavelength on a sound trace and say what each sounds like.", "Puedo nombrar amplitud, frecuencia y longitud de onda en un registro de sonido y decir cómo suena cada una.", "knowledge"),
   ("pp.w13.vibration", "I can explain the chain from a groove wiggling a needle to air pressure at my ear.", "Puedo explicar la cadena desde el surco que mueve la aguja hasta la presión del aire en mi oído.", "reasoning"),
   ("pp.w13.amplitude-loud", "I can predict how cone size changes loudness or pitch, then test it.", "Puedo predecir cómo el tamaño del cono cambia el volumen o el tono, y luego probarlo.", "reasoning"),
   ("pp.w13.resonance", "I can explain why a cone or tube makes some frequencies louder than others.", "Puedo explicar por qué un cono o tubo hace algunas frecuencias más fuertes que otras.", "knowledge"),
  ],
  opener="An impact anywhere on Earth is a pressure wave first — and every instrument that senses one is reading a wave. A paper cone, a pin, a record spun by hand: music comes out. Then a megaphone. What is the cone doing to the groove's motion, and to the air?",
  know="Sensing means reading waves. The analysts read 2026-XJ by radar; the shop starts with sound because you can hold it.",
  conn="Groove → needle → cone → air → ear is a chain of cause, one link per sentence. Amplitude, frequency and resonance are the words every sensor engineer uses.",
  plan=[("1", "Paper-cone record player; Vernier microphone shows the trace", "Sketch the trace; label amplitude and frequency"),
        ("2", "Cone size vs. loudness — predict, lock, measure with the microphone", "Predicted / actual"),
        ("3", "Build the megaphone; resonance with a tuning fork or tone generator", "Which frequency got louder"),
        ("4", "Chain of cause: groove → needle → cone → air → ear, one link per sentence", "Chain page"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="The chain from groove to ear, one link per sentence, and your tested prediction about cone size — with the microphone traces that decided it.",
  art_es="La cadena desde el surco hasta el oído, un eslabón por oración, y tu predicción probada sobre el tamaño del cono — con los registros del micrófono que la decidieron.",
  off_en="Where at your shop is it loud, and what shape is the space? Would a different shape change it?",
  off_es="¿Dónde en tu taller hay mucho ruido, y qué forma tiene el espacio? ¿Cambiaría con otra forma?",
  tools="Records, paper cones, pins, Vernier microphone, tone generator"),

 dict(slug="pp-w14", mon="2027-03-29", days=5, unit="proj-3", core=True, strand="electromagnetism",
  en="The actuator · World's simplest motor", es="El actuador · El motor más simple del mundo",
  targets=[
   ("pp.w14.current-field", "I can show that a current makes a magnetic field, with a compass.", "Puedo mostrar que una corriente crea un campo magnético, con una brújula.", "skill"),
   ("pp.w14.force-current", "I can explain that a current in a magnetic field feels a force, and which way.", "Puedo explicar que una corriente en un campo magnético siente una fuerza, y en qué dirección.", "knowledge"),
   ("pp.w14.direction", "I can predict the direction of rotation from the field and current, then reverse one and predict again.", "Puedo predecir la dirección de giro a partir del campo y la corriente, luego invertir uno y predecir de nuevo.", "reasoning"),
   ("pp.w14.keeps-turning", "I can explain why the motor keeps turning instead of stopping at one position.", "Puedo explicar por qué el motor sigue girando en lugar de detenerse en una posición.", "reasoning"),
  ],
  opener="Spacecraft point themselves with motors — reaction wheels, gimbals. The shop's motor is a battery, a magnet and a bent wire. It spins. Before the first spin: which way? Then flip the magnet — which way now?",
  know="An arm and an ear so far. Now the thing that moves the spacecraft's parts: current in a magnetic field feels a force.",
  conn="Predicting the direction of rotation from field and current — then reversing one — is the reasoning behind every actuator on the mission.",
  plan=[("1", "Compass next to a current-carrying wire; field direction", "Compass sketches"),
        ("2", "Build the motor; predict rotation direction, locked; spin", "Predicted / actual direction"),
        ("3", "Reverse the magnet, then the battery; predict each first", "Two more predictions"),
        ("4", "Why it keeps turning; a homopolar motor variant", "Explanation page"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Three predictions of rotation direction (original, magnet flipped, battery flipped), each made before the spin, and an explanation of why it keeps turning.",
  art_es="Tres predicciones de la dirección de giro (original, imán invertido, batería invertida), cada una hecha antes de girar, y una explicación de por qué sigue girando.",
  off_en="Find a motor at work. Where is the magnet, and where does the current go in?",
  off_es="Encuentra un motor en el trabajo. ¿Dónde está el imán y por dónde entra la corriente?",
  tools="AA batteries, neodymium magnets, copper wire, compasses"),

 dict(slug="pp-w15", mon="2027-04-12", days=5, unit="proj-3", core=True, strand="electromagnetism",
  en="Communications · Build a speaker", es="Comunicaciones · Construye un altavoz",
  targets=[
   ("pp.w15.coil-force", "I can explain how a changing current in the coil makes a changing force on the magnet.", "Puedo explicar cómo una corriente cambiante en la bobina produce una fuerza cambiante sobre el imán.", "knowledge"),
   ("pp.w15.cone-wave", "I can explain how the cone's motion becomes a pressure wave in the air.", "Puedo explicar cómo el movimiento del cono se convierte en una onda de presión en el aire.", "knowledge"),
   ("pp.w15.chain", "I can write the causal chain from signal to sound, one link per sentence, with no link missing.", "Puedo escribir la cadena causal desde la señal hasta el sonido, un eslabón por oración, sin que falte ninguno.", "reasoning"),
   ("pp.w15.design-var", "I can predict which change (more turns, stronger magnet, lighter cone) helps, then test it.", "Puedo predecir qué cambio (más vueltas, imán más fuerte, cono más ligero) ayuda, y luego probarlo.", "reasoning"),
  ],
  opener="A signal from the spacecraft becomes motion becomes a wave: that is a speaker, and it is the motor and the record player in one object. Coil, magnet, cup, a phone. Sound. Say how — one link per sentence — then change one thing and predict what it does.",
  know="The motor (force from a current) and the ear (a pressure wave) meet in a speaker.",
  conn="The causal chain from signal to sound is the same chain as a radio receiver's — the mission's comms in a paper cup.",
  plan=[("1", "Wind the coil, mount on the cup, magnet behind; first sound", "Sketch with parts labeled"),
        ("2", "Chain of cause from signal to sound", "Chain page"),
        ("3", "Predict which ONE change helps loudness; lock; measure with the microphone", "Predicted / actual"),
        ("4", "Second variable if time; compare to the motor and the record player", "Comparison table"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="The causal chain from signal to sound with no link missing, and your tested prediction about the one design change you made.",
  art_es="La cadena causal desde la señal hasta el sonido sin que falte ningún eslabón, y tu predicción probada sobre el único cambio de diseño que hiciste.",
  off_en="Look at a speaker grille at work or in a car. Estimate the cone size. What would a bigger one do better and worse?",
  off_es="Mira la rejilla de un altavoz en el trabajo o en un carro. Estima el tamaño del cono. ¿Qué haría mejor y peor uno más grande?",
  tools="Magnet wire, neodymium magnets, paper cups, 3.5 mm cable, Vernier microphone"),

 dict(slug="pp-w16", mon="2027-04-26", days=5, unit="proj-4", core=True, strand="electromagnetism",
  en="Mission power · Wind and water turbines", es="Energía para la misión · Turbinas de viento y agua",
  targets=[
   ("pp.w16.induction", "I can explain that spinning a magnet past a coil makes a current — the motor run backwards.", "Puedo explicar que girar un imán frente a una bobina produce una corriente — el motor al revés.", "knowledge"),
   ("pp.w16.power-out", "I can measure electrical power out with voltage and current.", "Puedo medir la potencia eléctrica de salida con voltaje y corriente.", "skill"),
   ("pp.w16.efficiency", "I can estimate mechanical power in and report the turbine's efficiency.", "Puedo estimar la potencia mecánica de entrada e informar la eficiencia de la turbina.", "reasoning"),
   ("pp.w16.blade-predict", "I can predict which blade change raises efficiency and test it.", "Puedo predecir qué cambio en las aspas aumenta la eficiencia y probarlo.", "reasoning"),
  ],
  opener="Every mission needs power, and a generator is the motor run backwards. A DC motor with blades on it, a fan or a tap. How much comes out, compared with what went in?",
  know="Phase 4 opens: the shop has an arm, an ear, an actuator and comms. None of it runs without power.",
  conn="Spinning a magnet past a coil makes a current. Power out over power in is the efficiency the mission's power engineer signs for.",
  plan=[("1", "Motor as generator: spin by hand, read voltage; blades v1 on the fan", "Voltage vs. spin"),
        ("2", "Power out with Vernier voltage + current probes and a load resistor", "P = V·I table"),
        ("3", "Mechanical power in (fan speed / water flow estimate); efficiency", "Efficiency"),
        ("4", "Predict ONE blade change; lock; test", "Predicted / actual"),
        ("5", "Reasoning artifact + rate yourself", "The artifact")],
  art_en="Power out vs. your estimate of power in, the efficiency, and your tested prediction about the one blade change.",
  art_es="Potencia de salida frente a tu estimación de potencia de entrada, la eficiencia y tu predicción probada sobre el único cambio de aspas.",
  off_en="Where does the electricity at your shop come from? Follow it back one step. What is spinning?",
  off_es="¿De dónde viene la electricidad de tu taller? Síguela un paso hacia atrás. ¿Qué está girando?",
  tools="Small DC motors, blade kits, fan, Vernier voltage + current probes"),

 dict(slug="pp-w17", mon="2027-05-10", days=5, unit="proj-4", core=True, strand="engineering-design",
  en="Mission review I · Redesign one of your builds", es="Revisión de la misión I · Rediseña una de tus construcciones",
  targets=[
   ("pp.w17.choose", "I can choose an earlier build to redesign because of what its data and my gap explanation said.", "Puedo elegir una construcción anterior para rediseñar por lo que dijeron sus datos y mi explicación de la diferencia.", "reasoning"),
   ("pp.w17.plan", "I can write a redesign plan with a locked prediction of how much better it will do.", "Puedo escribir un plan de rediseño con una predicción fijada de cuánto mejorará.", "product"),
   ("pp.w17.build", "I can build the redesign and keep the timeline as I go.", "Puedo construir el rediseño y llevar la línea de tiempo mientras avanzo.", "skill"),
  ],
  opener="Two-week arc, with a shop week in the middle. The mission review board wants one thing redesigned from the year's evidence. This week: read your own timeline and gap explanations, choose the build, plan, predict, build. The shop week carries only a question. Next academic week: test and defend.",
  know="Nine builds, nine gap explanations, one timeline. The board wants to see the shop improve something on purpose.",
  conn="A redesign chosen from data — not from what was fun — is what the year has been practicing. This is the mission's method applied to your own work.",
  plan=[("1", "Read your own timeline and gap explanations; choose the build", "Choice with the reason"),
        ("2", "Redesign plan; locked prediction of improvement", "Locked prediction"),
        ("3", "Build", "Timeline"),
        ("4", "Build; dry run", "Timeline"),
        ("5", "Build complete; what will you measure and how? Rate yourself", "Test plan")],
  art_en="Your redesign plan: the build you chose and why (from its data), the one change, and a locked prediction of how much better it will do.",
  art_es="Tu plan de rediseño: la construcción que elegiste y por qué (a partir de sus datos), el único cambio y una predicción fijada de cuánto mejorará.",
  off_en="Shop week. Nothing is due. One question: if the redesign does NOT beat the original, what will you say caused it?",
  off_es="Semana de taller. No hay nada que entregar. Una pregunta: si el rediseño NO supera al original, ¿qué dirás que lo causó?",
  tools="Whatever the chosen build needs"),

 dict(slug="pp-w18", mon="2027-05-24", days=5, unit="proj-4", core=True, strand="engineering-design",
  en="Mission review II · Test and defend", es="Revisión de la misión II · Prueba y defiende",
  targets=[
   ("pp.w18.test", "I can test the redesign against the original's data under the same conditions.", "Puedo probar el rediseño contra los datos del original en las mismas condiciones.", "skill"),
   ("pp.w18.defend", "I can defend the redesign to a panel using my reasoning artifacts from both rounds.", "Puedo defender el rediseño ante un panel usando mis artefactos de razonamiento de ambas rondas.", "reasoning"),
   ("pp.w18.honest", "I can say plainly whether the redesign worked, and what the numbers say caused the result.", "Puedo decir claramente si el rediseño funcionó, y qué dicen los números que causó el resultado.", "reasoning"),
  ],
  opener="Same conditions as the original. Test. Then stand up and defend it — in either language — to a review board that has your first-round artifact in front of them.",
  know="The redesign is built. The board has the first-round artifact and the locked prediction.",
  conn="State the prediction, the result, and whether it worked — plainly. The board's questions come from your numbers, the way a mission review's do.",
  plan=[("1", "Test under the original conditions; compare to the original data", "Original / redesign / gap"),
        ("2", "Prepare the defense: three slides or one page, both artifacts", "Defense page"),
        ("3", "Defenses, half the room", "Panel notes"),
        ("4", "Defenses, other half", "Panel notes"),
        ("5", "Rate yourself on the capstone targets", "Rating")],
  art_en="The comparison of original and redesign under the same conditions, and your defense — with the honest sentence about whether it worked.",
  art_es="La comparación del original y el rediseño en las mismas condiciones, y tu defensa — con la oración honesta sobre si funcionó.",
  off_en="Shop week. Bring back every artifact from the year for the portfolio.",
  off_es="Semana de taller. Trae todos los artefactos del año para el portafolio.",
  tools="The redesigned build, the original data"),

 dict(slug="pp-w19", mon="2027-06-07", days=4, unit="proj-4", core=False, strand="metacognition",
  en="Arrival · Portfolio and final self-assessment", es="Llegada · Portafolio y autoevaluación final",
  targets=[
   ("pp.w19.portfolio", "I can assemble every reasoning artifact of the year and re-rate myself against the targets.", "Puedo reunir todos los artefactos de razonamiento del año y reevaluarme frente a las metas.", "skill"),
   ("pp.w19.growth", "I can point to the artifact where my reasoning got better, and say what changed.", "Puedo señalar el artefacto donde mi razonamiento mejoró, y decir qué cambió.", "reasoning"),
  ],
  opener="2026-XJ arrives around graduation. Every artifact of the year, the timeline as the cover page. Re-rate. Find the one where your reasoning changed.",
  know="Graduation. The year of evidence is on the table.",
  conn="The portfolio is the shop's mission record: what was predicted, what was measured, what was explained.",
  plan=[("1", "Assemble and order the artifacts; timeline cover page", "Cover page"),
        ("2", "Re-rate every target with the evidence", "Rating sheet"),
        ("3", "The growth page: where did it change?", "Growth page"),
        ("4", "Hand it over", "—")],
  art_en="The portfolio, with the timeline as cover and the growth page inside.",
  art_es="El portafolio, con la línea de tiempo como portada y la página de crecimiento adentro.",
  off_en="Summer.",
  off_es="Verano.",
  tools="Packet, every artifact"),
]

# Which asteroid-course unit each strand maps to, for MVP-vs-CPA mastery comparison.
# Per-target overrides in XREF_OVERRIDE. None = no physics-unit counterpart.
XREF = {
 "motion-graphs": "unit-1", "forces-dynamics": "unit-1", "structures": "unit-1", "energy-transfer": "unit-4",
 "fluids-pressure": "unit-4", "waves-sound": "unit-6", "electromagnetism": "unit-7", "engineering-design": "unit-8",
 "transfer": None, "metacognition": None,
}
XREF_OVERRIDE = {
 "pp.w02.g-diluted": "unit-2", "pp.w04.n3-momentum": "unit-3", "pp.w04.impulse": "unit-3", "pp.w04.two-motions": "unit-2",
 "pp.w04.redesign-data": "unit-3", "pp.w00.predict-lock": "unit-1", "pp.w00.timeline": "unit-8",
}

STANDARDS = {
 "motion-graphs": ["HS-PS2-1"], "forces-dynamics": ["HS-PS2-1", "HS-PS2-2"], "structures": ["HS-PS2-1", "HS-ETS1-3"],
 "energy-transfer": ["HS-PS3-1", "HS-PS3-3"], "fluids-pressure": ["HS-PS2-1", "HS-ETS1-3"], "waves-sound": ["HS-PS4-1"],
 "electromagnetism": ["HS-PS2-5", "HS-PS3-3"], "engineering-design": ["HS-ETS1-2", "HS-ETS1-3"], "transfer": ["HS-ETS1-3"], "metacognition": [],
}

MASTERY = [
 ("pp.t1.mastery-structure-you-have-not-seen", "proj-1",
  "You are handed a photo of a structure you have never seen — a real one, with a load on it — and a card-stock model of it. Label every member tension or compression, predict which fails first and at roughly what load from your own strand data, load the model, and explain the gap. Write it so a builder who was not here could follow it. / Te entregan la foto de una estructura que nunca has visto — una real, con carga — y un modelo de cartulina. Etiqueta cada miembro como tensión o compresión, predice cuál falla primero y aproximadamente a qué carga a partir de tus propios datos de hebras, carga el modelo y explica la diferencia. Escríbelo para que un constructor que no estuvo aquí pueda seguirlo.",
  {"science": "Members labeled correctly; the load prediction uses the student's own material data and the right member.",
   "reasoning": "The prediction is locked before the test and the gap explanation follows from what actually failed, not from the answer.",
   "communication": "A builder could follow it. Diagram first, then words — in either language.",
   "transfer": "A structure never seen in class, argued from the same physics as the bridges."}),
 ("pp.t2.mastery-where-the-energy-went", "proj-2",
  "You are given a machine you have not built — a spring launcher, a pendulum, a dropped mass on a lever — and the probes. Measure energy in, energy out, report the efficiency, and say where the rest went, with one change you would make and a prediction of what it would do. / Te dan una máquina que no has construido — un lanzador de resorte, un péndulo, una masa que cae sobre una palanca — y las sondas. Mide la energía de entrada y de salida, informa la eficiencia y di a dónde fue el resto, con un cambio que harías y una predicción de su efecto.",
  {"science": "Energy in and out measured correctly with the probes; efficiency computed as a ratio.",
   "reasoning": "The losses named are the ones the data supports; the proposed change attacks the biggest one.",
   "communication": "Numbers in a table, the story in sentences, in either language.",
   "transfer": "A machine not built in class, treated with the same energy accounting as the coaster and the air car."}),
 ("pp.t3.mastery-chain-of-cause", "proj-3",
  "You are given a device that uses pressure, sound or electromagnetism — one you have not seen opened — and asked to open it, draw it, and write the chain of cause from input to output with no link missing. Then predict what one change would do and, if the device allows, test it. / Te dan un dispositivo que usa presión, sonido o electromagnetismo — uno que no has visto abierto — y te piden abrirlo, dibujarlo y escribir la cadena causal desde la entrada hasta la salida sin que falte ningún eslabón. Luego predice qué haría un cambio y, si el dispositivo lo permite, pruébalo.",
  {"science": "Every link in the chain is physically correct — pressure, wave or field — and named with the right word.",
   "reasoning": "No link is missing or magic; the predicted effect of the change follows from the chain.",
   "communication": "The drawing carries the chain; the sentences carry the causes. Either language.",
   "transfer": "A device not built in class, explained with the physics of the claw, the cone and the motor."}),
 ("pp.t4.mastery-defend-a-redesign", "proj-4",
  "Defend your capstone redesign to a panel that has your first-round artifact in front of them. State the prediction you locked, the result, and whether it worked — plainly. Answer the panel's questions from your numbers. / Defiende tu rediseño final ante un panel que tiene tu artefacto de la primera ronda enfrente. Indica la predicción que fijaste, el resultado y si funcionó — claramente. Responde las preguntas del panel con tus números.",
  {"science": "The comparison was made under the same conditions and the measurements are sound.",
   "reasoning": "The verdict follows from the numbers, including when the redesign lost.",
   "communication": "The panel could follow it without reading the packet. Either language.",
   "transfer": "Uses the year's method — predict, build, measure, explain — on the student's own earlier work."}),
]


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def arr(xs):
    return "array[" + ", ".join(q(x) for x in xs) + "]::text[]" if xs else "null"


def lesson_blocks(w, idx):
    rows = "| Day | Hands (first) | On the packet page |\n|---|---|---|\n" + "\n".join(
        f"| {d} | {h} | {p} |" for d, h, p in w["plan"])
    md = (
        f"### This week / Esta semana\n\n{w['opener']}\n\n{rows}\n\n"
        f"**Every block, four segments:** hands → record → talk (pairs, either language) → write (the packet frame). Hands always first.\n\n"
        f"### Reasoning artifact / Artefacto de razonamiento\n\n{w['art_en']}\n\n*{w['art_es']}*\n\n"
        f"### Off-week question / Pregunta de la semana de taller\n\n{w['off_en']}\n\n*{w['off_es']}*\n\n"
        f"*Tools: {w['tools']}*"
    )
    blocks = [{"id": f"t{i+1}", "type": "target", "statement": f"{t[1]} / {t[2]}"} for i, t in enumerate(w["targets"])]
    blocks.append({"id": "a1", "type": "asteroid_thread", "whatWeKnow": w["know"], "connection": w["conn"]})
    blocks.append({"id": "c1", "type": "callout", "variant": "note",
                   "title": f"Academic week of {w['mon']} · {w['days']} days · B and C",
                   "markdown": "**Predict. Build. Measure. Explain.** Your packet page is on paper, Spanish and English side by side — do the work there. This page is the plan and the targets. / Tu página del paquete está en papel, español e inglés lado a lado — haz el trabajo ahí."})
    blocks.append({"id": "p1", "type": "prose", "markdown": md})
    return {"schemaVersion": 1, "dayType": "ANCHOR", "blocks": blocks}


out = []
out.append("""-- ============================================================================
-- 20260902_program_projects.sql   (GENERATED by scripts/gen-projects-curriculum.py — do not hand-edit)
--
-- Project Physics: a third program for the MVP CPA section, re-sequenced around
-- one build per academic week. Source of truth for the sequence is the year map
-- (claude/MVP-CPA-Physics-Project-Year-Map.md in the Claude project).
--
--   1. program vocabulary gains 'projects' (courses, units, learning_targets, mastery_tasks)
--   2. section_schedules.on_week_dates — explicit academic weeks, so the MVP
--      alternation can shift at a vacation instead of being strict parity
--   3. learning_targets.statement_es (bilingual) and xref_unit_id (cross-reference to the asteroid course unit)
--   4. 4 term units, 20 week-lessons, 72 targets, 4 mastery tasks (program = 'projects')
-- Idempotent: every row is upserted by id / slug.
-- ============================================================================

-- 1. Program vocabulary
alter table public.courses drop constraint if exists courses_program_check;
alter table public.courses add constraint courses_program_check check (program in ('physics', 'trades', 'projects'));
alter table public.units drop constraint if exists units_program_check;
alter table public.units add constraint units_program_check check (program in ('physics', 'trades', 'projects'));
alter table public.learning_targets drop constraint if exists learning_targets_program_check;
alter table public.learning_targets add constraint learning_targets_program_check check (program in ('physics', 'trades', 'projects'));
alter table public.mastery_tasks drop constraint if exists mastery_tasks_program_check;
alter table public.mastery_tasks add constraint mastery_tasks_program_check check (program in ('physics', 'trades', 'projects'));

-- 2. Explicit academic weeks for alternating sections
alter table public.section_schedules add column if not exists on_week_dates date[] not null default '{}';
comment on column public.section_schedules.on_week_dates is 'Alternating-week sections: explicit on-week dates (any day in each week). When non-empty this replaces parity-from-on_week_anchor, so the alternation can shift at a vacation.';

-- 3. Bilingual target statements
alter table public.learning_targets add column if not exists statement_es text;
comment on column public.learning_targets.statement_es is 'Spanish statement of the target, shown beside the English one where the program is bilingual.';
alter table public.learning_targets add column if not exists xref_unit_id text references public.units(id) on delete set null;
comment on column public.learning_targets.xref_unit_id is 'Cross-reference: the unit in ANOTHER program this target corresponds to (Project Physics → asteroid course unit), so mastery can be compared by unit without merging programs.';

-- 4. Units (terms). allotted_days is in MEETINGS (Project Physics counts meetings).
""")

unit_meet = {}
for w in WEEKS:
    unit_meet[w["unit"]] = unit_meet.get(w["unit"], 0) + MEET[w["days"]]

out.append("insert into public.units (id, name, description, order_index, program, allotted_days, default_start_date) values")
vals = []
for uid, oi, name, desc, start in UNITS:
    vals.append(f"  ({q(uid)}, {q(name)}, {q(desc)}, {oi}, 'projects', {unit_meet[uid]}, {q(start)})")
out.append(",\n".join(vals))
out.append("on conflict (id) do update set name = excluded.name, description = excluded.description, order_index = excluded.order_index, program = excluded.program, allotted_days = excluded.allotted_days, default_start_date = excluded.default_start_date;\n")

out.append("-- Learning targets (bilingual)")
out.append("insert into public.learning_targets (slug, statement, statement_es, domain, unit_id, content_strand, standard_refs, exclude_from_growth, order_index, program, xref_unit_id) values")
vals = []
n = 0
for w in WEEKS:
    for slug, en, es, dom in w["targets"]:
        n += 1
        x = XREF_OVERRIDE.get(slug, XREF[w['strand']])
        vals.append(f"  ({q(slug)}, {q(en)}, {q(es)}, {q(dom)}, {q(w['unit'])}, {q(w['strand'])}, {arr(STANDARDS[w['strand']])}, false, {n}, 'projects', {q(x) if x else 'null'})")
out.append(",\n".join(vals))
out.append("on conflict (slug) do update set statement = excluded.statement, statement_es = excluded.statement_es, domain = excluded.domain, unit_id = excluded.unit_id, content_strand = excluded.content_strand, standard_refs = excluded.standard_refs, order_index = excluded.order_index, program = excluded.program, xref_unit_id = excluded.xref_unit_id;\n")

out.append("-- Mastery tasks (one per term; scored on the four dimensions, lowest-dimension rule)")
out.append("insert into public.mastery_tasks (slug, unit_id, prompt, rubric, program) values")
vals = []
for slug, uid, prompt, rub in MASTERY:
    rj = json.dumps({k: {"description": v} for k, v in rub.items()}, ensure_ascii=False)
    vals.append(f"  ({q(slug)}, {q(uid)}, {q(prompt)}, {q(rj)}::jsonb, 'projects')")
out.append(",\n".join(vals))
out.append("on conflict (slug) do update set unit_id = excluded.unit_id, prompt = excluded.prompt, rubric = excluded.rubric, program = excluded.program;\n")

out.append("-- Week-lessons. One lesson = one academic week. planned_days = meetings that week. Unpublished until the packet exists.")
unit_name = {u[0]: u[2] for u in UNITS}
for i, w in enumerate(WEEKS):
    title = f"Week {i} · {w['en']} / {w['es']}"
    objectives = [f"{t[1]} / {t[2]}" for t in w["targets"]]
    cb = json.dumps(lesson_blocks(w, i), ensure_ascii=False)
    desc = f"Academic week of {w['mon']} · {w['days']} days · {w['tools']}"
    out.append(
        "insert into public.lessons (slug, title, unit, unit_id, lesson_number, lesson_type, published, estimated_time, planned_days, transfer_core, objectives, description, content_blocks, content) values "
        f"({q(w['slug'])}, {q(title)}, {q(unit_name[w['unit']])}, {q(w['unit'])}, {i + 1}, 'markdown', false, 110, {MEET[w['days']]}, {'true' if w['core'] else 'false'}, {arr(objectives)}, {q(desc)}, {q(cb)}::jsonb, '') "
        "on conflict (slug) do update set title = excluded.title, unit = excluded.unit, unit_id = excluded.unit_id, lesson_number = excluded.lesson_number, estimated_time = excluded.estimated_time, planned_days = excluded.planned_days, transfer_core = excluded.transfer_core, objectives = excluded.objectives, description = excluded.description, content_blocks = excluded.content_blocks, updated_at = now();"
    )

print("\n".join(out))
import sys
print(f"-- targets: {n} · weeks: {len(WEEKS)} · meetings per unit: {unit_meet}", file=sys.stderr)
