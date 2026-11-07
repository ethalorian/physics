# Assignment language and formatting standard

Craig approved this convention on October 28, 2026. Apply it to every new or revised assignment type, including worksheets, quizzes, readings, labs, simulations, discussion, independent make-up work, vocabulary, graphic-novel responses, creative work, trades, engineering, hints, and sentence starters.

## Language access and thinking

- Aim for approximately seventh-grade English for directions in every course, including Honors. Foundation slides and their lesson questions, hints, examples, and group/solo directions instead target **fifth-grade English**, as requested on October 29, 2026. This is a language target, not a limit on the physics or cognitive demand. Readability formulas are screening tools, not proof of comprehension.
- Preserve the target, reasoning task, open choices, quantities, units, signs, equations, required trials/examples, answer alternatives, scoring criteria, and independence of the response. Do not supply a strategy or relationship that the student is expected to choose.
- Use familiar verbs, active voice, explicit nouns, and one response task per numbered step. Keep the situation and givens together, followed by what to do. Retain necessary physics vocabulary; explain incidental language without defining a term whose meaning is being assessed.
- Do not use claim, counterclaim, evidence, model, condition, assumption, justify, or evaluate as unexplained directions. Say what the student must actually do in this particular task: answer the question; give another possible explanation; point to a measurement and explain how it supports an answer; name what a calculation treats as true; explain what would change the answer.
- Name the actual scientific tool: force diagram, velocity–time graph, equation, simulation, or explanation. Do not replace every occurrence of model with diagram. If choosing the form is assessed, retain the choice and describe the acceptable forms.
- Replace condition with the actual situation or change, or ask the student to choose one thing to change when that choice is part of the task. Preserve technical concepts such as boundary conditions by explaining their meaning in context.
- Sentence starters must use the same concrete language as the question. They are optional and must not supply the answer, reasoning, sign, comparison, or expected result. Avoid generic starters such as “My model…”, “My claim…”, or “Under the assumption…”.

## Formatting

Craig clarified on October 29, 2026: wording revisions must preserve the established print layout. Copying efficiency matters. Worksheets use the original compact two-column format, headers, typography and self-checks. Never add ruled text-response lines or redesign the page layout as part of a wording edit. Preserve space required for supplied or student-created graphs and diagrams. Check page counts against the established edition; do not increase printing without a concrete need.

- Bold given numbers together with their units and signs: **4 m/s**, **6 s**, **−2 m/s²**. Keep each complete quantity in one bold span, including scientific notation. Apply the same treatment consistently across answer choices when authored.
- Bold the specific requested quantity or action and object: **How far west**, **How long**, **Calculate the change in velocity**, **Draw a force diagram**. Make it possible to scan the task and identify what to find or produce. Headings and “Word help” labels alone are not sufficient emphasis. Keep the surrounding context in regular text; do not bold entire paragraphs or identify the correct answer by emphasis.
- Use the shared value-and-task rules in `src/lib/assignment-emphasis-rules.json` through the print/deck renderer or the online question-emphasis plugin. This is presentation only; preserve source quantities, equations, IDs, answers and saved student responses. Authors should add precise emphasis to task phrases that need more context than the shared rules can recognize.
- Put each required response on its own numbered line. Use short paragraphs, readable spacing, and a single column for long choices. Do not turn every short question into an unnecessary checklist.
- Italicize and underline spelled-out compass directions within question text and sentence starters, including north, south, east, west and compound directions such as northeast. Keep this direction treatment inside bold task phrases too. Do not confuse N (newtons) with a compass direction; leave mathematical notation and diagram labels intact. This is an explicit exception to reserving on-screen underlines for links or student annotation. Use italics sparingly elsewhere and keep normal mathematical conventions.
- Main prompts must render as main text, not small muted help text. Use the existing math/Markdown renderer where supported; never expose raw Markdown or HTML tags to students.
- Preserve the approved compact print typography and two-column layout. Do not impose a blanket 12pt minimum or convert worksheets to a single column. Use modest emphasis and compact line breaks within the existing design. Never add text-response lines. Keep each diagram with its question and preserve legible axes, labels and units.

## Referenced material must exist

- Before writing “the diagram,” “the graph,” “the table,” “the image above,” or a specific slide/panel, verify the exact resource is included and visible in the student's assigned view, including SEI, mobile, print, and independent make-up versions.
- Distinguish a supplied figure from a figure the student must create. “Draw a force diagram” does not require a supplied force diagram; “Use the force diagram below” does.
- Missing material must be supplied from an accurate source or the task must be rewritten as a self-contained equivalent with the same thinking demand. Do not invent an observation, source, measurement, figure, or experimental result. Do not silently replace interpretation of a graph with recall of a fact.
- Validate asset paths and figure/data bindings during generation. A decorative image does not satisfy a question's need for a quantitative graph or diagram.
- Preserve official assessment originals and label any practice adaptation. Check adaptations against the original item, choices, figures, and answer key.

## Verification and preservation

- Compare revised questions and optional supports against answer guides and rubrics. Keep source/question/block IDs and response bindings stable. Preserve student drafts, submissions, marks, mastery, dates, access, and release state.
- Review every available assignment family, including repeated templates and generated copies. Keep a coverage ledger of unchanged clear items, revised items, verified visual references, and unresolved source issues. Do not label an unresolved reference complete.
- Test the actual rendered screen and printed artifacts. Ask whether a student can restate what to do before attempting the physics. Cognitive demand is determined by the reasoning required, not sentence length.
- Generation prompts, authoring scripts, shared defaults, and future templates must follow this document. A note alone is insufficient if a generator still requests a different reading level or inserts abstract sentence starters.

## Rebuild the student copies

After reviewing changes to `resources/worksheet-decks/source.json` and `language-supports.json`, run `npm run worksheets:pdf` with Python 3, reportlab and pypdf installed, then `npm run worksheets:decks`. The checked-in compact renderer restores the original vector diagrams and DejaVu fonts. PDF generation also refreshes the 32 unit/edition download archives. Check representative pages and their diagrams after rebuilding. Use the in-repository compact renderer, which reads the revised wording and sentence starters. Do not re-import the older content files over the reviewed language. Original official MCAS and textbook source pages stay unchanged; classroom wording is a clearly labeled adaptation alongside them.

Foundation slides, companions, group/independent stops, previews, hints and linked quizzes must follow the same convention. Use the shared slide import adaptation and authored-text renderers described in docs/foundation-lesson-standard.md. Preserve source runtime, artwork and assessment behavior.
