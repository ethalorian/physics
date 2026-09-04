#!/usr/bin/env python3
"""
Day-grain teacher lesson plans for Project Physics (program = 'projects').

The app IS the packet for this section, so a day plan here does NOT repeat the
student prompts, frames, word bank or Spanish that already live on the blocks
(scripts/gen_mvp_weeks.py). It carries the three things the blocks cannot:

  1. the clock and the materials  — the four 25-minute segments, and what is on
     each table before students walk in;
  2. the Spanish Craig actually says — the phrases from the teacher-script card
     (claude/Project-Physics-SEI-Access-Layer.md), in the order this day needs
     them;
  3. the formative checks and the misconception to press — what to look for on
     the walk-around, the wrong answer worth stopping the room for, and the talk
     move that opens it.

Consumed by scripts/gen-projects-lesson-plans.py. Weeks without an entry here
render as a week overview only.

Segment row: (time, segment, what happens, in the app, bloom, hattie)
Spanish row: (say, means, when)
"""

# --------------------------------------------------------------- WEEK 1 (pp-w01)
# Sep 14-18, 2026 · 5 days · "Read the track — Describing motion"
# Student blocks already live in PhysicsAPP (w01d1-* … w01-rate).

W01 = [
 dict(n=1, date="Monday, Sep 14", title="Walk the graph",
  targets=["pp.w01.sketch-first", "pp.w01.read-graph"],
  prep=[
    ("On each table (groups of 3, one bridge each)",
     "One Vernier motion detector on a stand at table height, laptop awake with Logger Lite / Graphical Analysis open on the graph-matching screen, one device per student for the app."),
    ("On the floor",
     "Painter's tape at 1 m, 2 m and 3 m in front of every detector. Students stand on tape, not on guesses — a Level 1 student can follow a floor mark without English."),
    ("At the front",
     "The four-icon strip (Predict · Build · Measure · Explain) on the wall, today's step circled. The week's eight words already on the bilingual word wall with icons: faster / slower / graph / slope / position / velocity / acceleration / displacement."),
    ("On the board",
     "Nothing but a blank pair of axes. Do not label them yet — the labels are the first thing you ask for."),
  ],
  segments=[
   ("0–25", "HANDS",
    "No preamble. You walk first: toward the detector slowly, away fast, stop. Say nothing but <em>Miren</em> and point at the screen. Then every student walks one graph, one at a time, while the group watches the trace. Three graphs from the graph-matching screen, then the reverse: a student walks, the group calls the shape before the screen finishes.",
    "— (the block's day callout, <code>w01d1</code>)", "Remember / Understand", "Prior achievement · d=0.41"),
   ("25–50", "RECORD",
    "Each student sketches the position–time graph of the scripted walk <strong>before</strong> doing it: stand 1 m away, walk away slowly 3 s, stop 2 s, walk back fast. Then walk it and log the match score for three graphs, with the one thing they fixed each time.",
    "<code>w01d1-predict</code> (sketch, label bank) · <code>w01d1-scores</code> (data table × 3 rows)", "Apply", "Feedback · d=0.70"),
   ("50–75", "TALK",
    "Pairs, 60 seconds each then swap: show your sketch and the screen — where do they disagree, and who was right? Bridge translates the physics, not the answer. Circulate with the frame cards; your one job is that a physics claim lands on the page in <em>either</em> language.",
    "<code>w01d1-talk</code>", "Analyze", "Classroom discussion · d=0.82"),
   ("75–100", "WRITE",
    "The three-part frame: up = walking ___, flat = ___, steep = ___. Level 1 tier is forced choice from the word bank; Level 3+ writes it in their own words. All three tiers are on screen for everyone.",
    "<code>w01d1-write</code> (tiered EN/ES frame, visual: rising/flat/falling trace)", "Understand", "Vocabulary programs · d=0.62"),
   ("100–110", "CLOSE",
    "Everything saved. Read tomorrow's one line out loud: the sims do not draw a graph you have not already drawn. Post the language objective again as they pack up.", "—", "—", "Metacognitive strategies · d=0.60"),
  ],
  spanish=[
   ("Miren.", "Watch.", "Before your own first walk, and before each new graph. Point at the screen, not at yourself."),
   ("Primero esto.", "This first.", "Handing over the detector — one step, one gesture."),
   ("¿Más rápido o más lento?", "Faster or slower?", "The either/or check after every walk. This is the day's Level 1 speaking objective — the answer is one word."),
   ("Dibuja.", "Draw.", "Starting the RECORD segment. Say it, then point at the sketch pad."),
   ("Muéstrame.", "Show me.", "When you cannot tell whether a student understood. Never ask <em>why</em> in the hands segment."),
   ("En español está bien.", "In Spanish is fine.", "The first time a Level 1 student stalls on the write. Say it before they ask."),
   ("Bien. Eso es física.", "Good. That is physics.", "When a labeled sketch is right and the sentence is not. This is the fairness rule said out loud."),
  ],
  checks=[
   "Sketch <strong>before</strong> the screen — walk the room during the hands segment and look for a pencil moving before a laptop does. A student who only ever draws after the trace appears has not met <code>sketch-first</code> no matter how good the copy is.",
   "On the sketch: is <em>toward / away / stopped</em> labeled at all? Labels in Spanish count. An unlabeled correct-looking curve is weaker evidence than a labeled rough one.",
   "In the match-score table: does the third column say what they <em>fixed</em>, or just repeat the score? The fix is the learning — an empty fix column is the block to reopen.",
   "Language objective (Speaking, Level 1): can the student answer <em>faster / slower / stopped?</em> about a trace without the bridge answering for them? Mark met / not yet by name on the walk-around. Never in the physics score.",
  ],
  misconception=(
   "The graph is a picture of the path.",
   "A rising position–time line gets read as walking uphill, or as walking to the right; a V-shaped trace gets read as “they went down and came back up.” It is the single most durable wrong idea in kinematics and it will quietly wreck the ramp week if it survives.",
   "Stop the room the first time you hear it. Walk in a dead straight line <em>toward</em> the detector — the line falls. Same straight line, same floor, walk <em>away</em> — it rises. Ask: “The floor did not change. What changed?” Then the either/or in Spanish: <em>¿Hacia o lejos?</em> Let a bridge carry the sentence. Do not lecture it; walk it twice.",
  )),

 dict(n=2, date="Tuesday, Sep 15", title="Sims that CHECK, never draw first",
  targets=["pp.w01.sketch-first", "pp.w01.a-from-slope"],
  prep=[
    ("On each table", "One shared screen for the sim, one device per student for the app. Detectors stay out and set up — today's argument gets settled on hardware, not on a slide."),
    ("Loaded and tested before the block", "<code>constant-velocity</code> and <code>uniformly-accelerated-motion</code> in the app's sim library. The sims are English-only; seat the bridge at the screen."),
    ("On the board", "Two blank axis pairs side by side, one labeled <strong>x–t</strong>, one <strong>v–t</strong>. They stay up all week."),
    ("Printed", "The tiered frame cards for the day's write, one stack in your hand for the talk segment."),
  ],
  segments=[
   ("0–25", "HANDS",
    "The rule, demonstrated before it is stated: you set a motion in <code>constant-velocity</code>, cover the graph pane with your hand, and make the room draw the shape first. Uncover. Do it three times. Then hand the sim over — same rule at every table, the recorder covers the pane.",
    "<code>w01d2</code> (day callout) · <code>w01d2-sim1</code>", "Understand", "Direct instruction · d=0.59"),
   ("25–50", "RECORD",
    "Predict / check / fix, three rows: the motion I set, the x–t shape I predicted, what the sim drew, my fix. Then <code>uniformly-accelerated-motion</code> for the fourth and fifth rows if the table is moving fast.",
    "<code>w01d2-check</code> (4-column table) · <code>w01d2-sim2</code>", "Apply / Analyze", "Feedback · d=0.70"),
   ("50–75", "TALK",
    "The gated question first, alone, on their own device — flat and above zero on a <em>velocity</em>–time graph. It will not open the rest until it is answered, and the feedback on each wrong option is the teaching. Then pairs: how do you tell an x–t graph from a v–t graph without reading the label?",
    "<code>w01d2-vt</code> (gated choice, three options with feedback) · <code>w01d2-talk</code>", "Analyze", "Classroom discussion · d=0.82"),
   ("75–100", "WRITE",
    "One sentence for each graph: flat on x–t means ___; flat on v–t means ___. Level 1 tier is the two-word forced choice and it earns the same 3.",
    "the tiered frames on <code>w01d2-vt</code>", "Understand", "Vocabulary programs · d=0.62"),
   ("100–110", "CLOSE", "Save, then one either/or out loud to the whole room at the door: flat on v–t — stopped or steady? Hands up for each. You want the split visible before tomorrow.", "—", "—", "Metacognitive strategies · d=0.60"),
  ],
  spanish=[
   ("Predice antes de probar.", "Predict before you test.", "Opening line of the block. It is the year's rule; say it every time."),
   ("Dibuja.", "Draw.", "Each time you cover the graph pane."),
   ("¿Sí o no?", "Yes or no?", "Checking a prediction against the sim. One word back is a full answer."),
   ("Pregúntale a tu compañero.", "Ask your partner.", "When a Level 1 student is stuck at the English-only sim. The bridge reads the screen; the physics stays with the student."),
   ("Escribe el número.", "Write the number.", "The record segment — a number in a cell is evidence."),
   ("Bien. Eso es física.", "Good. That is physics.", "On any correct fix in the fourth column, however it is written."),
  ],
  checks=[
   "The <em>fix</em> column is the whole point. A row where predicted and drawn are identical every time means the student is filling the prediction in after the fact — sit down and cover the pane yourself.",
   "On the gated question: who picked <em>stopped</em>? That is not a careless click, it is the x–t rule applied to the wrong graph, and it is exactly today's target. The block's feedback says it; you still want the names.",
   "Watch the bridge. If the bridge is answering rather than reading, the group's Level 1 student produces nothing all block. Redirect once, out loud, so the role is visible: <em>Lee la pantalla — él contesta.</em>",
   "Language objective (Speaking, Level 1): the student says <em>faster / slower / stopped</em> unprompted at least once. Met / not yet, by name.",
  ],
  misconception=(
   "Flat means stopped — on any graph.",
   "It is right on x–t and wrong on v–t, and the students who are doing best on Monday's work are the ones most likely to get it wrong today, because they generalized a rule that worked. That is worth saying to them: your rule was good, it just has an address.",
   "Do not correct it — make it collide. Set the sim to a steady 0.4 m/s and show both graphs at once: the x–t line climbs, the v–t line is flat. Same cart, same motion, two flat-looking claims that cannot both be “stopped.” Ask the room for a rule that survives both. Press for reasoning rather than the answer: <em>“You said flat is stopped. Show me on this screen where the cart is stopped.”</em> Then let the pairs write the two-address rule.",
  )),

 dict(n=3, date="Wednesday, Sep 16", title="A number out of a graph · slope and area",
  targets=["pp.w01.v-from-slope", "pp.w01.area"],
  prep=[
    ("Loaded before the block", "<code>slope-calculator</code> and <code>area-under-curve</code> in the sim library, one screen per group."),
    ("On each table", "A meter stick and a stopwatch. Not for a lab — for the demonstration that Δx and Δt are two measurements, not two letters."),
    ("On the board", "The two moves, drawn not written: an x–t line with a triangle under it, and a v–t rectangle shaded. No formula yet."),
    ("Printed", "GEWA solve-box slips for anyone who wants to work on paper before typing. The app's GEWA blocks accept the same work."),
  ],
  segments=[
   ("0–25", "HANDS",
    "Two measurements, in the room, with the meter stick and the stopwatch: someone walks from a tape mark to another, two people call the distance and the time. Write both on the board. <em>That</em> pair of numbers is the slope, before any graph is mentioned. Then drag two points in <code>slope-calculator</code> and show it is the same pair.",
    "<code>w01d3</code> (day callout) · <code>w01d3-sim1</code>", "Understand / Apply", "Worked examples · d=0.57"),
   ("25–50", "RECORD",
    "First GEWA: a cart at 2.0 m at t = 1.0 s and 3.0 m at t = 5.0 s — velocity from the slope. The numbers are chosen so the graph <em>ends high and is shallow</em>: v = 0.25 m/s, while the wrong move gives 0.60. Given, equation, work, answer. The equation picker offers four; choosing the wrong one is diagnostic, not fatal.",
    "<code>w01d3-gewa1</code> (target: v-from-slope)", "Apply", "Worked examples · d=0.57"),
   ("50–75", "RECORD / HANDS",
    "<code>area-under-curve</code>, then the second GEWA: 0.40 m/s for 6.0 s, displacement from the area. Say the sentence that makes it obvious — a rectangle of speed and time <em>is</em> a distance — while shading the rectangle with your finger on the screen.",
    "<code>w01d3-sim2</code> · <code>w01d3-gewa2</code> (target: area)", "Apply", "Feedback · d=0.70"),
   ("75–100", "TALK, then WRITE",
    "Pairs: which move gives a velocity and which gives a distance — and why does that make sense? Then the frame: the slope of x–t tells me ___; the area under v–t tells me ___.",
    "<code>w01d3-talk</code> · <code>w01d3-write</code>", "Analyze / Understand", "Classroom discussion · d=0.82"),
   ("100–110", "CLOSE", "Save. Tell them tomorrow is a real cart and they will be asked to draw its graph before it moves.", "—", "—", "Metacognitive strategies · d=0.60"),
  ],
  spanish=[
   ("Primero esto.", "This first.", "Given, then equation, then work — one step at a time, with a finger on each box."),
   ("Escribe el número.", "Write the number.", "Every GEWA box. A number in the right box is evidence even with no sentence around it."),
   ("Muéstrame.", "Show me.", "Point at the two dots on the screen instead of asking for the words “rise over run.”"),
   ("¿Más grande o más pequeño?", "Bigger or smaller?", "Comparing two slopes. The either/or is the Level 1 route into a comparison."),
   ("En español está bien.", "In Spanish is fine.", "The write segment. Say it before anyone stalls."),
  ],
  checks=[
   "In GEWA 1, look at the <em>equation</em> step, not the answer. A student who picks <code>avg-speed</code> and gets 0.5 m/s has arithmetic and not the target; a student who picks <code>v = Δx/Δt</code> and fumbles the subtraction has the target and needs two minutes.",
   "The subtraction is where this day is actually lost: 3.0 − 2.0 over 5.0 − 1.0, so v = <strong>0.25 m/s</strong>. The wrong move — last position over last time — gives 3.0/5.0 = <strong>0.60 m/s</strong>, nearly two and a half times bigger, so it is <em>visible</em> on the walk-around. Any answer near 0.6 is the misconception below arriving as arithmetic.",
   "On the write: does <em>area</em> get attached to a distance, or is it still a word about shapes? “The area tells me how far” in any language is a 3.",
   "Language objective (Speaking, Level 1): answers <em>bigger / smaller</em> about two slopes. Met / not yet.",
  ],
  misconception=(
   "Slope is how high the line is.",
   "Students read the y-value where the line ends instead of its steepness — so a line that ends high “has a big velocity” even when it is nearly flat. It survives because on many textbook graphs the two happen to agree. It will not agree on the ramp.",
   "Draw two lines on the same axes: one starting at 0 and climbing steeply to 2 m in 2 s, one starting at 3 m and creeping to 3.5 m in the same 2 s. Ask which is faster. The high one is slower and looks bigger, and the room will split — that split is the lesson. Then hand it to the pairs with the press: <em>“Which number on the graph did you use, and where is the other one?”</em> Make them point at both the rise and the run before anyone says an answer. The GEWA above is built to the same shape, so the number in the box is the check — 0.25 has the target, 0.60 does not.",
  )),

 dict(n=4, date="Thursday, Sep 17", title="A real cart on the track",
  targets=["pp.w01.sketch-first", "pp.w01.v-from-slope"],
  prep=[
    ("On each table", "Dynamics cart and track, motion detector clamped at one end and aimed down the track, laptop collecting. Check the detector sees the cart at 15 cm minimum — the dead zone eats the first run and the first prediction with it."),
    ("Beside each track", "Meter stick taped along the track with 0 at the detector, so start-x and end-x are read, not estimated."),
    ("At the front", "One spare cart with a strip of felt on the bottom — you will want a visibly high-friction cart during the talk segment."),
    ("Set aside", "Ten minutes at the end for the timeline entry. It is the third of the year and the first one that follows a real measurement; do not let it get squeezed."),
  ],
  segments=[
   ("0–25", "HANDS",
    "Cart on the track. Before any push: every student sketches the x–t graph they expect for run 2 (fast push, cart rolls to the end). Then three runs — slow push, fast push, push then catch — with the detector collecting all three.",
    "<code>w01d4</code> (day callout) · <code>w01d4-predict</code> (sketch, gated by the norm not the app)", "Apply", "Prior achievement · d=0.41"),
   ("25–50", "RECORD",
    "Three rows: start x, end x, time, and velocity computed as Δx/Δt — yesterday's move on today's cart. The number must come from their own two readings, not from the software's fit.",
    "<code>w01d4-data</code> (5-column table)", "Apply", "Worked examples · d=0.57"),
   ("50–75", "RECORD / TALK",
    "Compare: where did the detector's graph match the sketch and where did it not, and what will they draw differently next time. Then the pair question — the cart slowed at the end; what did that look like on the graph, and what word do we not have yet?",
    "<code>w01d4-compare</code> (observation: pattern + interpretation) · <code>w01d4-talk</code>", "Analyze / Evaluate", "Feedback · d=0.70"),
   ("75–100", "WRITE",
    "Timeline entry #3: planned, actual, why the gap — about the <em>block</em>, not the cart. This is the thread the May capstone is built from; treat it as work, not as a plenary.",
    "<code>w01d4-timeline</code>", "Evaluate", "Self-reported grades · d=1.33"),
   ("100–110", "CLOSE", "Save. Tell them Friday has no new hands — they will be handed a motion nobody in the shop has seen.", "—", "—", "Metacognitive strategies · d=0.60"),
  ],
  spanish=[
   ("Miren.", "Watch.", "The first run of each group. Nobody touches the cart until the sketch is down."),
   ("Predice antes de probar.", "Predict before you test.", "Every push. Every group. Say it more times than feels necessary."),
   ("Dibuja.", "Draw.", "The predict sketch, before the cart moves."),
   ("¿Más rápido o más lento?", "Faster or slower?", "Comparing run 1 and run 2 — the Level 1 route into the velocity column."),
   ("¿Por qué?", "Why?", "Only in the talk segment, and then wait. Let the bridge carry it. Never in the hands segment."),
   ("Bien. Eso es física.", "Good. That is physics.", "On the timeline entry — especially one that says the plan failed."),
  ],
  checks=[
   "Sketches down before the first push, at every table. This is the one norm that decides whether Week 2's locked prediction is real; if it slips today it will not come back on its own.",
   "In the velocity column: three different numbers for three different pushes. Identical numbers mean the software's fit is being copied, not Δx/Δt.",
   "In the compare block: does the <em>fix</em> name a feature — the start point, the steepness, the end — or is it “I was wrong”? A named feature is the reasoning target; “I was wrong” is not.",
   "In the timeline: is the <em>why</em> a cause or an excuse? “Ran out of time” with no reason is not yet an entry. Ask once: <em>¿Por qué?</em>",
   "Language objective (Speaking, Level 1): answers <em>faster / slower</em> about two runs, from the graph rather than from memory of the push.",
  ],
  misconception=(
   "The cart slows down because it runs out of force.",
   "It is Aristotle, and every class produces it. Today you cannot resolve it — friction and net force are Week 3 — and trying to will cost you the graph work. But naming that the room does not yet have the word is exactly the move that makes Week 3 land.",
   "Take the claim seriously and make it testable instead of settling it. Run the felt-bottomed cart next to the clean one with the same push and put both traces up: same push, different slowing. Ask: “If the cart ran out of push, why did the felt one run out sooner?” Then say plainly, in both languages, that the shop does not have the word yet and that it arrives in three weeks — and write the question on the board where it stays until it does. Leaving a good question standing is a move, not a failure.",
  )),

 dict(n=5, date="Friday, Sep 18", title="The reasoning artifact",
  targets=["pp.w01.read-graph", "pp.w01.sketch-first"],
  prep=[
    ("Before the block", "Record 07 (<code>/images/sei/mystery-xt.svg</code>) rendered large on the projector and on every device. Check it reads at the back of the room — the diagram is the sentence a Level 1 student can read."),
    ("On each table", "Blank grid paper for artifact 2, even though the sketch block accepts drawing. Two passes — pencil, then the app — is the SEI move, not a redundancy."),
    ("In the app", "Open the Lobby launcher: <code>w01d5-artifact</code> is lobby-ready, and the grouping should spread the WIDA bands. Same-day rule — the self-rating holds until each student's own exit ticket is in."),
    ("On the wall", "The week's five targets as icons with 1–2–3 circles beside them, for the paper rating strip before the screen one."),
  ],
  segments=[
   ("0–25", "HANDS (on paper)",
    "No new equipment. Record 07 goes up with no explanation and one instruction: label the four segments A–D on your own copy, in either language. Silence for the first five minutes. A Level 1 student who labels A–D correctly has already produced physics evidence.",
    "<code>w01d5</code> (day callout) · <code>w01d5-fig</code> (figure, full width)", "Understand", "Prior achievement · d=0.41"),
   ("25–55", "WRITE (artifact 1)",
    "Describe the motion segment by segment, then defend <em>one</em> segment: which feature of the graph proves the description, and the velocity as a number. This is the graded evidence of the week — protect the time.",
    "<code>w01d5-artifact</code> (observation, lobby-ready, tiered frames)", "Analyze / Evaluate", "Feedback · d=0.70"),
   ("55–75", "TALK (lobby)",
    "Launch the lobby on the artifact block with mixed-band groups. Debrief on one thing only: a claim someone could prove wrong from the graph. Close the session — role XP lands, and the discourse role is logged with the response.",
    "Lobby launcher → <code>w01d5-artifact</code> · <code>w01d5-talk</code>", "Evaluate", "Classroom discussion · d=0.82"),
   ("75–100", "WRITE (artifact 2)",
    "The reverse move: draw the graph that <em>would</em> match a motion given in words — still 2 m away for 2 s, away steadily for 4 s, back faster than it left. Then the exit ticket.",
    "<code>w01d5-draw</code> (sketch) · <code>w01-exit</code>", "Create", "Elaboration · d=0.60"),
   ("100–110", "RATE",
    "Paper strip first, screen second. Five targets, 1–2–3. The rating opens only after their own exit ticket — that is the app enforcing MC-6, not a glitch. Issue the off-week question out loud and in writing: watch one thing move for ten seconds and sketch its v–t graph from memory.",
    "<code>w01-rate</code> (self-assessment across 5 targets)", "Evaluate", "Self-reported grades · d=1.33"),
  ],
  spanish=[
   ("Miren.", "Watch.", "Putting Record 07 up. Then say nothing for five minutes."),
   ("Etiqueta.", "Label.", "The only instruction the first segment needs."),
   ("En español está bien.", "In Spanish is fine.", "Before the artifact, not during it. Say it to the room, not to a student."),
   ("Explícale a tu compañero.", "Explain it to your partner.", "Opening the lobby. The oral defense in Spanish is full evidence."),
   ("Señala la evidencia.", "Point to the evidence.", "When a claim arrives with no graph feature behind it. Pointing is a complete answer at Level 1."),
   ("Bien. Eso es física.", "Good. That is physics.", "On any labeled-diagram artifact. Say it where the room hears it."),
  ],
  checks=[
   "Walk the artifact as a Level 1 student before you rate anyone: diagram, labels, a number, a frame, an oral defense in Spanish — can that combination reach a 3 on every target this week? If not, the task is wrong, not the student (SEI non-negotiable 11).",
   "The defended segment is where reasoning lives. Look for a <em>named graph feature</em> — slope, flat, steepness — attached to a claim. “It moved away” with no feature is a description, not a defense.",
   "Artifact 2 catches the students who can read but not produce. A correct description on artifact 1 with a blank or reversed graph on artifact 2 is the profile to name in the cockpit.",
   "Calibration: compare each student's self-rating to their artifact evidence. Over-rating is not dishonesty here, it is usually the graph-as-picture idea still running quietly. That is your Week 2 opener.",
   "Language objective (Speaking, Level 1): gives the defense in Spanish with the bridge transcribing. Met / not yet, by name — to the ELL team, never in the grade.",
  ],
  misconception=(
   "Describing the graph instead of the motion.",
   "“It goes up, then it is flat, then it goes down” is a description of ink. It reads as an answer, it earns nothing on the target, and it is the most common way a whole class quietly fails a reasoning artifact while looking busy.",
   "Ban four words for one round. Tell the room: say what the object did without using <em>up, down, flat</em> or <em>line</em>. It is uncomfortable for about ninety seconds and then the physics vocabulary arrives because nothing else is left — away, toward, steady, faster, stopped. Put the banned words on the board with a line through them and the word bank next to it. For a Level 1 student the ban is <em>easier</em>, not harder: the word bank already holds the words that survive.",
  )),
]

# --------------------------------------------------------------- WEEK 2 (pp-w02)
# Sep 28 - Oct 2, 2026 · 5 days · "What bends the track — Car and ramp"
# Student blocks are NOT seeded yet. The `in the app` column names the block each
# segment should become when scripts/gen_mvp_weeks.py grows a W02 list; the ids
# follow the same convention (w02d1-…). Write the blocks to this plan, not the
# other way round.

W02 = [
 dict(n=1, date="Monday, Sep 28", title="Three angles, one cart",
  targets=["pp.w02.a-vs-angle", "pp.w02.g-diluted"],
  prep=[
    ("On each table", "Track and cart, a stack of books or a lab jack to set the angle, protractor (or a phone angle app — check it before the block), photogate with picket fence mounted on the cart, laptop collecting. Motion detector at the low end is the fallback and gives a cleaner story for a first week on this gear."),
    ("Pre-set", "Three angle marks on the ramp support, taped and numbered 1 / 2 / 3, so nobody spends the hands segment arguing about degrees. Measure them once yourself and write the degrees on the tape."),
    ("At the front", "Last week's Record 07 still on the wall. You will point at it in the first two minutes."),
    ("On the board", "A blank pair of axes labeled <strong>angle</strong> across and <strong>acceleration</strong> up. Nothing plotted."),
    ("Carry", "The frame cards and the Spanish script card. Week 2's eight words go up on the wall before the block: ramp, steep, angle, data, gravity, g, friction, run-out."),
  ],
  segments=[
   ("0–25", "HANDS",
    "Release a cart on the flattest angle and on the steepest, back to back, nothing measured. Ask for one word: <em>¿Más rápido o más lento?</em> Then the honest question that runs the week — is the steep one <em>faster</em>, or is it <em>getting faster faster</em>? Do not answer it. Hand out the gear.",
    "<code>w02d1</code> (day callout)", "Remember / Understand", "Prior achievement · d=0.41"),
   ("25–55", "RECORD",
    "Three angles, three runs each, acceleration from the picket fence (or from the detector's v–t slope). Numbers go in the table as they come, and each group plots its own three points on the angle–acceleration axes by hand before any software draws anything.",
    "<code>w02d1-data</code> (data table, 3 rows, plot enabled) · <code>w02d1-sketch</code> (hand plot)", "Apply", "Worked examples · d=0.57"),
   ("55–80", "TALK",
    "Pairs: your three points — is the pattern a straight line, a curve, or can you not tell from three points? The last answer is allowed and is the strongest one. Bridge translates the physics.",
    "<code>w02d1-talk</code>", "Analyze", "Classroom discussion · d=0.82"),
   ("80–105", "WRITE",
    "The frame: when the angle went from ___ to ___, the acceleration went from ___ to ___. Level 1 tier is the four numbers with a bigger/smaller circle; Level 3+ adds the <em>because</em>.",
    "<code>w02d1-write</code> (tiered EN/ES frame, word bank: steep, angle, acceleration, bigger, smaller, because)", "Understand", "Vocabulary programs · d=0.62"),
   ("105–110", "CLOSE", "Timeline entry opens tomorrow, not today. Tell them tomorrow's question out loud: what would this ramp read if it stood straight up?", "—", "—", "Metacognitive strategies · d=0.60"),
  ],
  spanish=[
   ("Miren.", "Watch.", "The two releases at the top of the block. Nothing else said."),
   ("¿Más rápido o más lento?", "Faster or slower?", "After the two releases. One word is the whole Level 1 answer."),
   ("Primero esto.", "This first.", "Handing over the photogate — one step at a time, with the gesture."),
   ("Escribe el número.", "Write the number.", "Every run. A number in the right cell is evidence."),
   ("Muéstrame.", "Show me.", "Checking the angle is actually set to the tape mark before a run counts."),
   ("Etiqueta.", "Label.", "The hand plot: angle across, acceleration up, in either language."),
   ("Bien. Eso es física.", "Good. That is physics.", "On a correctly plotted point, whatever the sentence looks like."),
  ],
  checks=[
   "Three <em>different</em> angles actually set. A group that ran the same angle three times has a repeatability study, which is fine work and not today's target — send them back with the tape marks.",
   "Acceleration, not velocity, in the second column. Do not carry a remembered range — check each table against <strong>g·sinθ for their own tape mark</strong> (about 0.85 m/s² at 5°, 1.7 at 10°, 2.5 at 15°), and expect their measurement to sit a little <em>under</em> it because of friction. A number well over g·sinθ, or one that looks like the cart's speed at the gate, means the whole week's fit is being built on the wrong quantity.",
   "The hand plot before the software plot. Same rule as last week and the same reason: the screen never draws a graph the student has not already drawn.",
   "Language objective (Writing, Level 1): the data table is labeled with <em>ángulo</em> and <em>aceleración</em> from the word bank, by the student. Met / not yet, by name.",
  ],
  misconception=(
   "Steeper means faster — so acceleration is just speed.",
   "The two words are used interchangeably by nearly everyone in the room, and the ramp is where the difference stops being a definition and starts being two different numbers. A student who cannot separate them cannot make Thursday's prediction, because run-out depends on the speed at the bottom, which depends on the acceleration <em>and</em> the length of the ramp.",
   "Same angle, two release points — top of the track and halfway down. Same acceleration, different speed at the bottom. Ask: “Same steepness. Why did one arrive faster?” Let it sit with the pairs. Then the reverse: two different angles, released so both leave the ramp at about the same speed. Two demonstrations, no definitions — the words separate themselves because the numbers do.",
  )),

 dict(n=2, date="Tuesday, Sep 29", title="What would it read standing straight up?",
  targets=["pp.w02.g-diluted", "pp.w02.predict-fit"],
  prep=[
    ("Loaded and tested", "<code>picket-fence-g</code> in the sim library — the vertical drop the ramp is diluting. English-only; bridge at the screen."),
    ("On each table", "Yesterday's three points, on the app and on paper. Today adds no new hardware; the argument is about the data they already own."),
    ("On the board", "One set of axes for the class fit, big. Every group adds its three points in a different color as they arrive."),
    ("In your pocket", "The number 9.8. Do not write it up until the room has produced a number of its own to compare it to."),
  ],
  segments=[
   ("0–25", "HANDS",
    "The sim as the vertical case: a picket fence dropped straight down reads about 9.8 m/s². Run it twice, get the number on the board, and then ask the question the whole block turns on — our steepest ramp read about 2 m/s². Where does the other 8 go?",
    "<code>w02d2</code> (day callout) · <code>w02d2-sim</code> (picket-fence-g)", "Understand", "Direct instruction · d=0.59"),
   ("25–55", "RECORD",
    "Every group's points on the class axes. Then each group extends its own line toward 90° and writes down the number it predicts there — before anyone says whether it is allowed.",
    "<code>w02d2-extrapolate</code> (data table: angle, measured a, extended-line a at 90°)", "Apply / Analyze", "Feedback · d=0.70"),
   ("55–80", "TALK",
    "The pair question: your straight line says the cart would accelerate at ___ m/s² standing straight up. The dropped fence says 9.8. Both cannot be right. Which one do you trust, and what does that say about the straight line?",
    "<code>w02d2-talk</code>", "Evaluate", "Classroom discussion · d=0.82"),
   ("80–105", "WRITE",
    "The dilution frame: the ramp gives the cart ___ of gravity. Steeper means ___. Straight up would be ___. Level 1 tier is three forced choices; Level 3+ says why a straight line through three small angles cannot be trusted at 90°.",
    "<code>w02d2-write</code> (tiered frame, visual: ramp with the g arrow and its along-the-ramp share)", "Understand / Evaluate", "Elaboration · d=0.60"),
   ("105–110", "CLOSE", "Timeline entry #4 — planned, actual, why. Then tell them tomorrow the cart leaves the ramp and they chase it across the floor.", "<code>w02d2-timeline</code>", "Evaluate", "Self-reported grades · d=1.33"),
  ],
  spanish=[
   ("Miren.", "Watch.", "The dropped picket fence in the sim. It is the only new thing today."),
   ("¿Más grande o más pequeño?", "Bigger or smaller?", "Comparing their extended-line number to 9.8. The either/or is the whole Level 1 route into the argument."),
   ("¿Sí o no?", "Yes or no?", "“Can a cart on a ramp beat a falling object?” One word, and it is the right question."),
   ("Dibuja.", "Draw.", "Extending the line on the hand plot."),
   ("Explícale a tu compañero.", "Explain it to your partner.", "The talk segment. Spanish is fine and the physics still counts."),
   ("En español está bien.", "In Spanish is fine.", "Before the write. Say it to the room."),
  ],
  checks=[
   "Score the two targets separately, because they are different kinds of thing. <code>g-diluted</code> is <strong>knowledge</strong> and is met by the statement — <em>the ramp gives the cart part of gravity; steeper is closer to g</em> — which a Level 1 student meets from the three forced choices alone. The 90° argument is <strong>reasoning</strong> and is evidence for <code>predict-fit</code>. Never withhold a 3 on g-diluted because a student could not defend the extrapolation.",
   "Every group has a number for 90°, even a wrong one. A blank there is not caution, it is a group that did not extend the line — and the wrong number is what today teaches from.",
   "Look for the number above 9.8. Most straight-line extensions from small angles will over-shoot, some wildly. That over-shoot is the gift; do not fix it before the talk segment.",
   "In the write: does <em>dilute</em> attach to gravity, or is it a word being repeated? “The ramp gives the cart part of gravity” in any language is the target. “The ramp dilutes gravity” with nothing behind it is not.",
   "Language objective (Writing, Level 1): completes the three forced choices from the word bank unaided. Met / not yet.",
  ],
  misconception=(
   "A straight line through three points can be trusted anywhere on the graph.",
   "This is the reasoning target hiding inside a physics lesson, and it is worth more than the value of g. Three points at 5°, 10° and 15° really do look like a line, and extending that line to 90° gives a cart that out-accelerates a falling rock — which the room already knows is impossible, if you let them notice it.",
   "Do not tell them the relationship is a sine. Put the two numbers side by side — their extended-line prediction and the dropped fence's 9.8 — and ask the question that costs nothing to ask: “Can a cart on a ramp beat a rock falling straight down?” Wait. Then the second question, which is the actual target: “So what was wrong — the measurement, or the line?” Press for reasoning; do not resolve it with a formula. A student who ends the block saying “our line only works where we measured” has met the target more completely than one who can write a = g·sinθ.<br><br><strong>If a group gets there — and one might — the resolution is theirs to find:</strong> plot acceleration against <em>sin</em>θ instead of against θ and the points really do fall on a straight line, and that line really does extrapolate to about 9.8 at sinθ = 1. Do not hand this out; it is the answer to the day's question and it is worth more discovered than told. But have it ready, because a group that asks “what if the line is the wrong shape?” has earned it.",
  )),

 dict(n=3, date="Wednesday, Sep 30", title="Off the end · run-out on the floor",
  targets=["pp.w02.a-vs-angle", "pp.w02.friction-gap"],
  prep=[
    ("The run-out lane — equipment, not a space", "<strong>A dynamics cart on tile will not stop in this room.</strong> Leaving a 1 m ramp at 15° it is doing about 2.2 m/s, and stopping distance is v²/2μg — with a cart's rolling friction (μ ≈ 0.01) that is <em>tens of metres</em>. The lane has to be a defined high-friction surface: a carpet runner, a foam mat, or felt taped down, long enough to stop the cart in 1–3 m. One runner per ramp, taped flat, marked every 25 cm from the end of the ramp."),
    ("On each table", "Ramp at two of yesterday's three angles, cart, and the same release mark every time — a block clamped at the top so “released from the same place” is a fact, not an intention."),
    ("Run it yourself before the block", "Release from your steepest tape mark onto the runner and see where it stops. Overshooting the runner is the likely failure — fix it by shortening the release distance up the ramp, or by adding felt to the cart, and then make that the standard. Every group uses the same surface and the same release point, because Thursday's locked prediction is only testable if the lane does not change between the two days."),
    ("At the front", "A cart with felt on the bottom, still. Today it earns its keep."),
  ],
  segments=[
   ("0–25", "HANDS",
    "Release, and let it run until it stops. Three times at one angle, on the runner. Nothing written for the first two — watch how much the three differ. The spread is data about the measurement, and this room needs to meet that idea before it needs to explain it.",
    "<code>w02d3</code> (day callout)", "Remember / Apply", "Prior achievement · d=0.41"),
   ("25–55", "RECORD",
    "Two angles × three runs: the distance from the end of the ramp to where the cart stops, plus the spread between the three. Then the pattern prompt — how did doubling the steepness change the run-out?",
    "<code>w02d3-data</code> (data table: angle, run 1, run 2, run 3, average, spread)", "Apply", "Worked examples · d=0.57"),
   ("55–80", "TALK",
    "Pairs: the cart left the ramp with a speed and the floor took it away. What is the floor doing, and what would change the run-out without changing the ramp at all? Bring the felt cart round mid-segment and say nothing.",
    "<code>w02d3-talk</code>", "Analyze", "Classroom discussion · d=0.82"),
   ("80–105", "WRITE",
    "The claim frame: the run-out got ___ when the angle got ___, because the cart left the ramp ___. Then name what is taking the speed away, in either language.",
    "<code>w02d3-write</code> (tiered frame; word bank: run-out, angle, faster, friction, floor, stop)", "Understand / Analyze", "Vocabulary programs · d=0.62"),
   ("105–110", "CLOSE", "Say tomorrow's job plainly so it can be thought about overnight: a new angle, a locked prediction, one release. And say the second half — the prediction is graded on the reasoning, never on being right.", "—", "—", "Metacognitive strategies · d=0.60"),
  ],
  spanish=[
   ("Miren.", "Watch.", "The first three releases, before anything is recorded."),
   ("¿Más grande o más pequeño?", "Bigger or smaller?", "Run-out at the steeper angle versus the flatter one."),
   ("Muéstrame.", "Show me.", "Where the cart stopped — a finger on the tape is a complete measurement report."),
   ("Escribe el número.", "Write the number.", "Every run, including the one that looks wrong."),
   ("¿Por qué?", "Why?", "Talk segment only. Then wait, and let the bridge carry it."),
   ("Bien. Eso es física.", "Good. That is physics.", "When a student points at the floor as the answer, before they have the word."),
  ],
  checks=[
   "Same release point every run. If a group is holding the cart by hand at the top, their spread is their hand, not the floor, and Thursday's prediction will be built on it.",
   "The spread column filled in. Three numbers averaged with no sense of their scatter is the habit that makes Friday's gap explanation impossible — you cannot explain a 10 cm gap if your own runs differ by 30 cm.",
   "Listen for <em>friction</em> arriving on its own. It usually does, in Spanish first — <em>fricción</em> is a cognate and it is on the wall. When it lands, put it on the board under the student's name.",
   "Language objective (Writing, Level 1): completes the run-out row of the table with the word-bank labels. Met / not yet.",
  ],
  misconception=(
   "Run-out is caused by the angle.",
   "The chain is angle → acceleration → speed leaving the ramp → distance the floor needs to stop it, and students collapse it to angle → distance. It works numerically all week, which is why it survives, and it fails the moment anything else changes — the felt cart, the tile strip, a longer ramp at the same angle.",
   "Break the chain in front of them without saying it. Two carts, same angle, same release: clean and felted. Same ramp, same speed at the bottom, very different run-out. Ask: “The angle was identical. What decided the distance?” Then the reverse, if you have the track for it — same angle, release from halfway, shorter run-out. Two demonstrations that the angle alone cannot explain, and the room builds the chain itself. Write the chain on the board as four boxes with arrows, in both languages, and leave it up through Friday: a Level 1 student can read four boxes.",
  )),

 dict(n=4, date="Thursday, Oct 1", title="The test · a new angle, locked",
  targets=["pp.w02.predict-fit", "pp.w02.friction-gap"],
  prep=[
    ("Set before the block", "A fourth angle on every ramp — one they have not run — taped and labeled. Choose it <em>between</em> two of their measured angles, not beyond them. Interpolation is an honest prediction from three points; extrapolation is Tuesday's trap and today is not the day to spring it again."),
    ("On each table", "Their own a-vs-angle plot and their own run-out numbers, on paper and on the app. Nothing new."),
    ("The gate", "The prediction block is <code>gate: true</code> — the measurement blocks below it do not open until the prediction is saved. Say that out loud: the app is holding the door, not you."),
    ("The shape of today", "Hands still come first — the block opens with a release at a <em>known</em> angle before anything is predicted. That is not a warm-up: it is the check that the lane still behaves the way Wednesday's data says it does, and it keeps the day inside the rule that every block in this course opens with the object doing the thing."),
    ("The lane", "Same runner, same surface, same release point, same tape as Wednesday. If the lane moves, the prediction was never testable — which is why the block now opens by re-running a known angle before anything is locked."),
  ],
  segments=[
   ("0–15", "HANDS",
    "The object moves first, as it does every other day this year. One release at an angle they <em>already ran</em> on Wednesday, onto the same runner, and the run-out measured. Nothing is predicted and nothing is written beyond the number. It also re-anchors the lane: if a known angle does not reproduce Wednesday's distance, something moved — the runner, the release point, the cart — and you want to find that out <strong>now</strong>, not after twenty predictions are locked against it.",
    "<code>w02d4-anchor</code> (data table: known angle, today's run-out, Wednesday's, difference)", "Remember / Apply", "Prior achievement · d=0.41"),
   ("15–40", "PREDICT (locked)",
    "Now the new angle goes up. Each student reads a prediction off their own graph, writes the number, writes the reason, and writes what would prove them wrong. Then it locks.",
    "<code>w02d4-predict</code> (sentence frame, <code>gate: true</code>, tiered EN/ES)", "Evaluate", "Self-reported grades · d=1.33"),
   ("40–60", "HANDS",
    "Three runs at the new angle, same runner, same release point. Do it as a whole room if you can — every group watching every cart makes the spread visible and stops the quiet re-writing of predictions.",
    "<code>w02d4-run</code> (data table: run 1, 2, 3, average)", "Apply", "Prior achievement · d=0.41"),
   ("60–80", "RECORD",
    "Predicted, actual, gap — as numbers, with the sign. Bigger or smaller, and by how much. No explanation yet.",
    "<code>w02d4-gap</code> (data table: predicted, actual, gap, bigger/smaller)", "Analyze", "Feedback · d=0.70"),
   ("80–100", "TALK",
    "Pairs, then the room: whose prediction was closest, and — the question that matters — was it closest because of better reasoning or a luckier angle? Ask it seriously. The answer is sometimes “luck,” and a student who says so is doing the target.",
    "<code>w02d4-talk</code>", "Evaluate", "Classroom discussion · d=0.82"),
   ("100–110", "WRITE",
    "Open the gap explanation but do not finish it — Friday's artifact is where it gets written properly. Timeline entry #5 closes the block.",
    "<code>w02d4-timeline</code>", "Evaluate", "Self-reported grades · d=1.33"),
  ],
  spanish=[
   ("Predice antes de probar.", "Predict before you test.", "The first words of the block and the last words before the release."),
   ("Escribe el número.", "Write the number.", "The prediction. A number alone locks the gate; the reason can come at any tier."),
   ("En español está bien.", "In Spanish is fine.", "Before the prediction, not after. The lock must not be a language barrier."),
   ("¿Más grande o más pequeño?", "Bigger or smaller?", "Predicted versus actual. This is the whole gap conversation at Level 1 and it is a complete one."),
   ("Muéstrame.", "Show me.", "“Show me on your graph where your number came from.” Pointing at their own fit is the evidence."),
   ("Bien. Eso es física.", "Good. That is physics.", "Say it loudest to a student whose prediction missed badly and who can say where it came from."),
  ],
  checks=[
   "Every prediction locked before the first release. One unlocked device is one student who will write down the answer — and the app gate only works if you are not opening it for people.",
   "Does the prediction cite their <em>own</em> data? “Between run 2 and run 3 on my graph” is the target. A number from nowhere, even a close one, is not evidence of the target and should be said so, kindly, on the spot.",
   "The “what would prove me wrong” line. It is the hardest part of the frame and the one that separates a guess from a prediction. If the room leaves it blank, that is the reteach for Friday, not a marking problem.",
   "Watch for prediction editing after the release. If it happens, do not make it a discipline event — make it the talk question: why does a prediction only count if it is locked?",
   "Language objective (Writing, Level 1): writes the predicted number and completes the bigger/smaller choice. Met / not yet.",
  ],
  misconception=(
   "A wrong prediction is a bad grade.",
   "It is the belief that makes students sandbag — predict nothing, predict vaguely, or wait and copy. It is also the belief that quietly kills the whole year's design, because every reasoning artifact from here to June begins with a locked prediction. This is the week it either dies or hardens.",
   "Grade one in front of them. Take two predictions off the wall with permission — one that missed by 40 cm with a clean argument from the student's own graph, one that landed within 2 cm with no reason given — and score them both out loud on the reasoning target: the miss is a 3, the hit is a 1. Say why, in both languages, and leave the two on the board for the rest of the week. Nothing you say about grading is as persuasive as one visible instance of it.",
  )),

 dict(n=5, date="Friday, Oct 2", title="The reasoning artifact · name the friction",
  targets=["pp.w02.friction-gap", "pp.w02.predict-fit", "pp.w02.g-diluted"],
  prep=[
    ("Before the block", "Every group's four-box chain from Wednesday, still on the board. It is the scaffold for today's artifact and it is already in both languages."),
    ("On each table", "Their whole week: the a-vs-angle plot, the run-out table, the locked prediction, the actual. Nothing new. Today is writing."),
    ("In the app", "The artifact block is lobby-ready. Group with the WIDA bands spread; same-day rule holds the self-rating until each student's own exit ticket."),
    ("On the wall", "Week 2's four targets as icons with 1–2–3 circles for the paper strip."),
    ("Ready to hand out", "The off-week question, printed, in both languages — find a ramp in the world, estimate its angle, would a cart reach g on it, why not."),
  ],
  segments=[
   ("0–20", "HANDS (on paper)",
    "One release at the tested angle, filmed on a phone or just watched, so the thing they are about to write about is in the room and not only in a table. Then the boards come down and the artifact opens.",
    "<code>w02d5</code> (day callout)", "Remember", "Prior achievement · d=0.41"),
   ("20–55", "WRITE (the artifact)",
    "Prediction, measurement, and a gap explanation that <strong>names friction and says where it acted</strong> — on the ramp, at the wheels, on the floor lane, or in the release. “Friction” with no location is not yet an explanation and the frame should say so.",
    "<code>w02d5-artifact</code> (observation, lobby-ready, tiered EN/ES frames)", "Analyze / Evaluate", "Feedback · d=0.70"),
   ("55–80", "TALK (lobby)",
    "Launch the lobby on the artifact. One debrief question: someone in your group named a different place for the friction than you did — who is right, and what measurement would settle it? Close the session so the roles and the XP land.",
    "Lobby launcher → <code>w02d5-artifact</code> · <code>w02d5-talk</code>", "Evaluate", "Classroom discussion · d=0.82"),
   ("80–100", "WRITE",
    "The transfer half: at what angle would the run-out be zero, and what does that tell you about the friction? Then the exit ticket.",
    "<code>w02d5-transfer</code> · <code>w02-exit</code>", "Create", "Elaboration · d=0.60"),
   ("100–110", "RATE",
    "Paper strip, then screen: four targets, 1–2–3. Read the off-week question aloud in both languages and give it out on paper. Nothing is due; one question travels home.",
    "<code>w02-rate</code> (self-assessment across 4 targets)", "Evaluate", "Self-reported grades · d=1.33"),
  ],
  spanish=[
   ("Miren.", "Watch.", "The single release that opens the block."),
   ("Dibuja.", "Draw.", "The diagram first, always. The four-box chain is a legitimate artifact opening."),
   ("Señala dónde.", "Point to where.", "The whole day in three words: where did the friction act? A finger on the diagram is a complete answer at Level 1."),
   ("En español está bien.", "In Spanish is fine.", "Before the artifact. To the room, not to a student."),
   ("Explícale a tu compañero.", "Explain it to your partner.", "The lobby. An oral defense in Spanish is full evidence."),
   ("Bien. Eso es física.", "Good. That is physics.", "On a labeled diagram with an arrow where the friction acted, whatever the sentence looks like."),
  ],
  checks=[
   "Walk the artifact as a Level 1 student before rating anyone: diagram of the ramp and lane, an arrow labeled <em>fricción</em> where it acted, predicted and actual as numbers, the gap frame, an oral defense in Spanish. That combination must be able to earn a 3 on all three targets, or the task is wrong (SEI non-negotiable 11).",
   "Friction with a <em>location</em>. This is the whole target. “Friction” alone is the word doing the work of an explanation and should come back with one question: <em>¿Dónde?</em>",
   "Is the gap explanation consistent with the sign? A cart that went <em>further</em> than predicted cannot be explained by more friction. That inconsistency is the most useful thing you will find today — it means the student is reaching for a memorized cause instead of reading their own numbers.",
   "Calibration: whose self-rating outruns their artifact? Take the top one into next week's opener by name-free example. Marzano 1–2–3 on the target, lowest dimension rule on the artifact.",
   "Language objective (Writing, Level 1): the prediction and the gap row completed from the word bank; the oral defense given in Spanish with the bridge transcribing. Met / not yet, by name, to the ELL team.",
  ],
  misconception=(
   "Friction is a word you say when the numbers do not match.",
   "By Friday the room has learned that “friction” makes a teacher nod, and it becomes a universal excuse with no physics in it. Left alone, it hardens into the habit that ruins every gap explanation for the rest of the year — and gap explanation is the graded evidence of this course.",
   "Make it locatable or make it lose. Every claim of friction gets one question — <em>where?</em> — and then a second: what measurement would show it there? Take one group's answer and actually test it in the last ten minutes: if they say the wheels, spin a wheel and time how long it coasts; if they say the floor, run the felt cart on the same lane; if they say the release, release twice and compare. One test, in front of everyone. The point is not the result. The point is that “friction” became a claim with evidence behind it, which is the difference between the word and the physics — and which is the sentence you want in their heads when they write the phase mastery task in December.",
  )),
]

DAYS = {"pp-w01": W01, "pp-w02": W02}
