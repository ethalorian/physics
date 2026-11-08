# Student Choice Binder pages: standard

Craig approved this standard on November 5, 2026. It covers the **Student Choice Binder**, a separate activity from the daily worksheets. The binder holds printed notes pages and student-choice practice pages that students complete by hand, color, and keep in a 3-ring binder.

The Unit 1 reference set is the Claude Design canvas *Unit 1 Student Choice Binder*. Its generator is `project/_gen/lib.js` + `project/_gen/specs/dNN.json`, run by `project/_gen/build.js`, with the Style T page as the skeleton.

Rule IDs are stable. Cite them when you build or revise binder pages.

The unchanged November 5 source is saved in `Physics Curriculum Planning/Unit 1 Student Choice Binder/project`. The imported edition is `original-1805385887d1`: 22 CPA notebook pages, Honors notebook pages for Days 1–3, 22 six-option practice sets, and one color-code page (158 sheets). That initial import did not substitute or invent missing Honors days. Source and individual-sheet hashes are in `docs/student-choice/original-1805385887d1.json`.

Use `node scripts/student-choice/import-binder.cjs <original-project-folder>` to package an approved source. This extracts existing sheets verbatim, retains local fonts and the original print component, and adds a screen-only Print button. It does not run the page generator. The full generator and its specifications remain in the archived original project; answer metadata is not published with student pages. Retain old versioned files and catalog entries when publishing a later edition.

## Honors completion — November 5, 2026

Craig subsequently requested Honors notes for all 22 days, authored in this Codex conversation. Edition `honors-complete-77f3e9dfede4` adds Days 4–22. Original Honors Days 1–3, all CPA pages, all 132 practice choices and the color reference remain unchanged. New assignments use the complete edition; existing assignments retain their pinned edition.

Run `node scripts/student-choice/generate-honors-notes.cjs <original-project-folder> [export-folder]`. The authoring source is `resources/student-choice/honors-notes/unit-1.json`, with the exact approved Day 3 section and head alongside it. `scripts/student-choice/honors-figures.cjs` provides the new outline SVGs. The generator asserts the template against the archived original, hashes the content and renderer into a new version, and retains older catalog entries. It does not invoke Claude or another model API.

For later Honors notes:

- Write the new explanation into the approved section structure. Keep page geometry, fonts, color meanings and punch margin. Shorten new wording to fit; do not reduce type size or silently change an approved page.
- Show why the worked example uses its equation, with signed values, units and an interpretation. Distinguish speed from signed velocity, distance from displacement, a force pair from a same-object force sum, and uncertainty bounds from probabilities. State assumptions such as constant acceleration and exact elapsed time.
- Make force lengths proportional, coordinate scales consistent, components distinct from actual forces, and negative graph areas striped. Label illustrative data and keep XJ fictional. Explain one analogous solved example without providing the separate transfer task’s answers.
- Verify every new page in the browser with local fonts loaded. Check card fit, section overlap, SVG label overlap and boundaries, all worked calculations, and unchanged source hashes. Inspect full rendered pages; automated geometry checks alone are insufficient.
- Keep printable HTML, local fonts, SVGs and the original print component as delivery sources. The QA PDF is a raster layout proof, not a replacement for the printable HTML. Native PDF export and a physical printer remain separate checks.

All 19 new sheets passed rendered fit and diagram-label checks. The original Day 3 sheet has a pre-existing approximately 17px card overflow and axis labels outside its SVG viewport; it remains unchanged under F-1. Record that exception rather than claiming every original passed fit checks.

## Mathematical typography — November 5, 2026

Craig subsequently requested clearer variable styling in the Honors notebook. Edition `honors-math-ec5600db4f1e` applies that authorized typography revision to all 22 days, preserving the words, quantities, diagrams and previous editions. This narrow revision supersedes F-1 only for mathematical typography; CPA and practice sheets remain exact. New assignments use the revised edition; assigned packets remain pinned.

Run `node scripts/student-choice/style-honors-variables.cjs <complete-honors-version> [export-folder]` after generating a complete Honors edition. The stylesheet is `resources/student-choice/honors-notes/math-typography.css`. The output embeds local KaTeX math fonts and their license; it does not require the KaTeX JavaScript renderer or a network font service.

- **M-1 — Distinguish symbols.** Set physical variables in a serif mathematical italic face, consistently in equations, prose, symbol definitions and SVG labels. Keep ordinary words, units, arithmetic operators and descriptive indices upright. A word such as “at” or the article “a” is not a variable. Do not infer vector meaning merely from capital letters or add bold-vector notation without defining it.
- **M-2 — Make indices readable.** Use actual subscript placement for initial/final, component and object indices. Use the same notation in a definition and its worked example. Keep the letter x distinct from the multiplication sign ×, and zero distinct from the letter O. Symbol definitions use larger mathematical glyphs; surrounding headings and body fonts retain the binder design.
- **M-3 — Preserve content and fit.** Typography is not permission to rewrite explanations, change numerical values, shrink body text or redraw figures. Retain original line spacing; inspect every new symbol context because automated recognition can mistake prose or units for variables. Compare all page texts, check all 22 page bounds and SVG labels, and visually inspect equations, subscripts and definitions before release. Preserve and report the existing Day 3 overflow separately from new regressions.

## F · Faithful reproduction and standalone assignments (November 5, 2026)

These rules record Craig's later instruction: the existing notebook and practice pages must be reproduced faithfully, without alteration. They take precedence over any older rule that would change an approved page during import.

- **F-1 — Preserve approved pages.** Import the original page files and their fonts, diagrams, pictograms, wording, equations, labels, option order, spacing, borders, grayscale treatment, color-code strips and footers. Do not rewrite, simplify, restyle, reflow, add directions inside the page, or apply worksheet formatting. The assignment interface surrounds the page; it does not become part of the printed page.
- **F-2 — Keep originals and provenance.** Archive complete source exports before conversion. Record the artifact identity, export date, source filename, page identity, and SHA-256 hashes. Retain source, assets and generator separately from delivery PDFs. A screenshot or a text transcript is evidence, not a substitute for the full printable source.
- **F-3 — Package without redesign.** Splitting an original document into its existing sheets, bundling files, resolving local font/asset references, and producing PDFs are permitted only when the resulting pages reproduce the original appearance and content. Keep one original sheet per Letter page and preserve the punch margin. Do not silently crop, shrink, omit a diagram, or move a footer to make a page fit. Report any pre-existing clipping or ambiguity before changing the approved source.
- **F-4 — One independent assignment.** Each scheduled Student Choice assignment contains its course's notebook page and all six practice options for the selected day. Students open the assignment and view or print the notes and any practice option directly. They browse a carousel and save the teacher-required number of distinct options out of six (1–6; default 3), then complete those pages on paper. Selecting and printing do not mark work received or assign a grade. Choices remain editable until teacher receipt; after receipt, the teacher must return the paper status to awaiting paper before choices can change. The Unit Color Code reference is also available. Do not connect this assignment to a lesson/review sequence, worksheet pair, separate reading assignment, prerequisite, or automatically generated quiz. The approved narrative lesson is part of this same paper packet.
- **F-5 — Manual teacher review.** Paper receipt and grading are separate. Only an authorized teacher records receipt and explicitly selects the letter grade after manual review. Use the existing A+ through F choices, including plus/minus grades. Do not calculate a letter from the number of choices, infer a grade from receipt, create numeric points, add AI grading, or award mastery automatically. Saving the review shares the teacher's selected letter and feedback. Preserve review history when correcting a review, moving a deadline, or archiving an assignment.
- **F-6 — Version the packet.** A scheduled assignment pins the approved page edition. Future generation produces a new version and never silently replaces pages already assigned. Archiving keeps existing paper records, grades and feedback. Existing linked-choice work retains its own history; it is not migrated into new paper assignments or deleted.

## Future page generation procedure

1. Start from an approved notes or practice page of the same type, using its original renderer/template and assets. Keep the source geometry, font families and weights, section hierarchy, visual language, punch margin and footer conventions. Do not rebuild from memory or from the worksheet template.
2. Write new topic-specific content into the existing structure. Notes explain the topic in sections N-1 through N-3. Practice uses six distinct styles: four regular options, including a drawing or graphing option, and exactly two different SEI styles from J/K/L. Rotate the SEI pair across the unit. Preserve the learning-target code and self-rating.
3. Retain the unit's semantic color system and outline graphics. Every SEI vocabulary item and scene must have a meaningful pictogram; matching uses the same drawing without its word. Retain English, Spanish, Portuguese and home-language space where present in the chosen template. Do not reduce SEI pages to text-only tasks.
4. Keep CPA and Honors notebook editions distinct. Apply the demand guidance in T only when authoring new pages; it is not permission to revise approved imports. A content reference to another curriculum resource never establishes an assignment dependency.
5. Validate all six options, both notebook editions and the reference before adding the day to the catalog. Confirm source/asset hashes, full text and equation preservation, embedded fonts, all diagrams and pictograms, Letter dimensions, page count and punch margin. Render the delivered pages and compare them visually against the originals, including long SEI pages, page bottoms and each newly used style. Text extraction alone is insufficient.
6. Record the source version and verification result in the packet manifest. Keep future generated pages out of active assignments until their full page set passes these checks. Never repair a failed fidelity check by weakening the check or changing the approved reference.

## B · What the binder is (and is not)

- **B-1** Binder pages are not worksheets. Do not apply the worksheet print rules (compact two-column layout, minimum page count, no extra space) to binder pages. Do not apply binder rules to `resources/worksheet-decks` or `public/worksheets`.
- **B-2** Every binder page carries the label `STUDENT CHOICE BINDER` at the start of its footer, then the course (`CPA ·` or `HONORS ·`) when the page belongs to one course, then the format line.
- **B-3** The binder has five page types: **notes pages** (one per day per course), **practice choice pages** (six style options per day; students pick the teacher-required count), **narrative readings** (the full lesson on the back of each notes page), **story pages** (one graphic-novel page per day, section GN), and **reference pages** (such as the Unit Color Code). Do not invent another type without Craig’s approval.
- **B-4** Binder pages follow the wording and emphasis rules in `docs/assignment-language-standard.md`. That means about seventh-grade wording, **bold** given quantities with units and signs, **bold** the task phrase, and *underline + italicize* spelled-out compass directions. These rules cover the text only, not the layout.

## P · Paper and print geometry

- **P-1** US Letter, 8.5 × 11 in, portrait, one designed page per sheet (`<doc-page size="letter">`, one `<section class="page">` per sheet).
- **P-2** The page must leave room for a 3-hole punch on the left. Wrapper padding is `0.35in 0.3in 0 0.9in`. Nothing may sit in the left 0.9 in.
- **P-3** Card sizes: notes pages `7.3in × 9.85in`; practice pages `7in × 9.45in` with `zoom:1.043`. Do not exceed these heights. Overflow fails release. Adjust spacing in a new approved edition; never clip content or silently shrink text.
- **P-4** No cut lines and no "glue into notebook" directions. Footers read `8.5 × 11 in · 3-HOLE PUNCH LEFT` and, for practice, `FILE WITH DAY N NOTES`.
- **P-5** Text runs at least 12px (9pt), except the footer. Strokes are at least 1px.
- **P-6 — Mirror the narrative back.** Craig requested narrative lessons on the reverse of notes pages. Preserve at least 0.9 in clear on the **left of the notes front** and the **right of the narrative back**, including headings, body, equations and footer. When an approved front/back packet is assembled, alternate each day's notes with that same day's narrative; use US Letter portrait, 100% scale and duplex **flip on the long edge**. A readings-only preview is not an interleaved duplex packet. Narrative content remains subject to Craig's preview approval; this margin rule does not authorize changes to approved notes.

## G · Grayscale and ink

- **G-1** Everything prints in grayscale: only neutral grays (`#rrggbb` with r = g = b). Images get `filter:grayscale(1)`.
- **G-2** Use no solid dark fills: no dark bars, tags, headers, or page backgrounds. A label or tag is a white box with a 1.5px dark outline (`outline:1.5px solid #252525;outline-offset:-1.5px`) and dark text, so students can color it in.
- **G-3** Light gray tints (≥ `#e5e5e5`) and grid or ruled backgrounds are allowed. Do not print color meaning in gray. Gray never stands in for a color.

## C · The color code (students add the color)

- **C-1** Students complete pages with colored pencils or markers. Coloring is part of the work on both notes and practice pages. It must make the page easy to decode at a glance.
- **C-2** One code for the whole unit. Each color always means one thing:
  - **green**: speeding up (v and a have the same sign)
  - **red**: slowing down (v and a have opposite signs)
  - **yellow**: steady or balanced (a = 0, net force = 0)
  - **blue**: position and displacement (including area under a v–t line)
  - **purple**: velocity (arrows, v–t lines, the slope of an x–t graph)
  - **orange**: every force, each labeled W, N, f, T, or F; net force is a thick orange arrow
  - **pencil**: everything else (axes, labels, data points, reference points, the distance path, cross-outs)
- **C-3** Acceleration has no color of its own. Show it with green, red, or yellow by what it does to the motion.
- **C-4** To tell apart two things in the same color, change the line, not the color: solid = measured or actual, dashed = predicted, resultant, or a part, stripes = negative area, light shade = a range.
- **C-5** Never use a color only to match items (as in "trace each frame color onto its card"). Match with letters. Use color only for meaning.
- **C-6** Sorts of reasoning (evidence / inference / question, P / D) use letters, not colors.
- **C-7** Every direction that says to color something must name the color by meaning, for example "Color the speeding-up dots green." Never write "in its color" or "to match its card."
- **C-8** Every printable page ends with the **Unit Color Code strip** (all six colors plus pencil, with empty swatches) placed between the card and the footer. The binder opens with the **Unit Color Code** reference page, where students color in the swatches first.

## N · Notes pages

- **N-1** Section order: header (course · unit · day, title, logo) → **Learning target** → **A · Key vocabulary** → **B · Key equations + units** (or key idea/rule) → **C · Color it** (a diagram with numbered callouts and a key of `N · COLOR` plus a label, following the color code) → **D · Worked example** (Given / Equation / Work / Answer) → **E · The 2026-XJ thread** → color code strip.
- **N-2** The notes explain. They do not assign practice: no blanks to fill, no quick checks, no "watch out" quizzes. Practice belongs on practice pages.
- **N-3** **E · The 2026-XJ thread** sits at the bottom (`margin-top:auto`). It holds 2–3 sentences on how the day's idea helps the analyst desk answer the unit question. The heading row reads `DAY N OF 22 · NEW TOOL: …`, and the closing line reads *"Unit question: How fast is it moving, and where will it arrive?"* (Change the question for later units.) Keep the asteroid a fictional classroom case.

## S · Practice choice pages

- **S-1** Each day has **six** options in different styles from the Practice Styles catalog (A–Z). **Exactly two** are SEI options (J Sentence Frames, K Picture Dictionary, L Partner Talk), and they must be two different SEI styles. **Exactly one** of the other four is a **CS Comic Strip** (S-5). Over the unit, rotate the SEI pair so each of J, K, and L appears about equally.
- **S-2** Styles are rendered by `R.<letter>` in `lib.js`. To add a style, add a renderer and a gallery entry. Write the colors as named grays and outlines from the start (G-2), and add no color-matching mechanics (C-5).
- **S-3** The large outlined day number in the top right is required. The circled style letter is a teacher-facing code. Under review: it may become a swatch for the day's main color or the target code.
- **S-4** Every option keeps the day's learning-target code and ends with the 1–2–3 self-rating.
- **S-5 · CS Comic Strip (draw to explain), added November 7, 2026.** Every day includes one comic-strip option so students who like to draw can show understanding by drawing. It replaces a non-SEI option, so the day still has six options and two SEI options. Rendered by `R.CS` in `lib.js`; spec fields `title`, `sub`, `reader`, `must`, `panels`, `words`.
  - **CS-1 Explain a concept, don't retell the story.** The student teaches the day's one big idea to a named, younger or confused *reader* who holds a specific misconception (for example, "a 4th grader who thinks acceleration only means speeding up"). The comic exists to correct that misconception.
  - **CS-2 Three big panels, stacked full-width. Drawing space comes first.** The reader and must-haves share one compact strip at the top; there is no separate directions line. Each panel's label and one-line hint sit in a small tab in the top-left corner, a dashed empty speech bubble sits top-right, and the caption line sits along the bottom edge inside the panel, so the panel body is all drawing space (about 2 in tall each). The panel sequence should move through the idea, for example before → during → after, or claim → fix → proof.
  - **CS-3 Must-haves are the evidence.** List 3–4 checkable items. Each one names a color from the unit color code (C) or PENCIL, plus a specific physics feature (for example, "PURPLE · velocity arrows that grow each panel"). The student checks each item off and colors its circle. At least one must-have is a quantity with a number and a unit, or a labeled arrow.
  - **CS-4 Caption + explanation.** Every panel needs a caption, and the page ends with EXPLAIN IT: 1–2 sentences that use 3–4 named vocabulary words. A drawing without the must-haves and the explanation does not count as complete.
  - **CS-5 Art is not graded.** The page says "Stick figures are fine. The physics is what gets checked." Never add art-quality criteria.
  - **CS-6 Which option to replace.** Prefer a repeated practice format (Sort It, Loop Chain, Unlock the Code, Group Chat, Choice Board, Who's Right?). Never replace an SEI option, a lab or graph-reading option, or the day's only calculation option. Splice the new card into the day page; don't regenerate the whole page, because some day pages carry hand edits (Days 7 and 8).

## T · CPA and Honors

- **T-1** The courses share the same learning targets, situations, and 2026-XJ thread. They differ in demand, following `docs/foundation-lesson-standard.md` (CPA editions, Nov 4, 2026).
- **T-2** **CPA** has shorter explanations, fewer comparisons at once, and visible math scaffolds. It gives the equation, defines the symbols, and shows the substitution and the order of operations, then the student calculates with units and direction. Do not claim that a CPA student chose an equation that was supplied.
- **T-3** **Honors** keeps the full demand. Students choose the equation, use signed quantities and formal notation (Δx, v̄, components), compare quantities (for example average speed vs. average velocity), and repair an error. Wording stays at about seventh grade (B-4).
- **T-4** Take problem situations and values from `resources/worksheet-decks/source.json` (`cpa`/`honors` arrays) when they fit, so the binder and the worksheets agree. Do not copy worksheet items verbatim; the binder is a different activity.
- **T-5** Use the corresponding CPA page as the format reference for Honors learning-target labels, section headings, worked-example column headings and day labels. Print the curriculum code in the label typeface. Use mathematical italics for variables in the lesson.
- **T-6** The Unit 1 Day 8 Honors equation box gives four one-dimensional constant-acceleration relations in bold. Pair each equation with the quantity it omits so students can select a model from their given and requested quantities. Retain the braking example and the independent displacement check from the velocity–time graph.

## L · SEI pages (styles J, K, L)

- **L-1** SEI pages support the **language goal** with pictures. Every vocabulary card (K picture dictionary, J word cards) shows a pictogram of the idea, not only a symbol or glyph. Every J "Solve with the steps" problem and every L partner-talk round shows a sketch of its situation.
- **L-2** Pictograms are outline line art drawn with the binder ink (`#1c1c1c`/`#252525`) on white, so students can color them by the unit code (C-2). Forces get labeled arrows, velocity gets a `v` arrow, and motion dots show gaps. A picture must show the meaning of the word, never decorate it.
- **L-3** The K "Match" row uses the same pictograms with no text under them, so students match picture to word.
- **L-4** The J "Say it" box opens with the two-partner talk icon. Sentence frames stay concrete and follow B-4.
- **L-5** Pictograms live in `project/_gen/lib.js` (`PICS`, `pic(word)`, `scene(key)`). Look-up is by vocabulary word (`picKey` strips the symbol after two spaces). J-only meanings use the key `j:<word>`. Scenes use the keys `J<day>` and `L<day>:<round index>`.
- **L-6** New vocabulary or a new SEI day needs its pictogram or scene added before release. The pre-release check (V-4) fails if any J/K word or J/L scene has no picture.
- **V-4** Run the pictogram coverage check: load `lib.js` and confirm that `pic()` returns art for every K/J word and `scene()` returns art for every J problem and L round in the specs.

## GN · Story pages (the 2026-XJ graphic novel)

- **GN-1** One story page per day keeps the asteroid arc alive. Students **read and color** it; there is nothing to write. The page shares the day’s physics but is not practice.
- **GN-2** Recurring cast, drawn in **manga style** with the `bust()` helper so they look the same every day. **Dr. Ana Reyes** (mission lead) has glasses, long hair with a high bun, and a lab coat with an ID badge. **Dr. Kofi Mensah** (tracking scientist) has short hair, a beard, a headset, and a striped polo. **Jordan** (high-school intern) has spiky hair and a hoodie with an asteroid patch. Expressions: neutral, talk, smile, grin, think (?), shock (sweat drop, wide eyes), worried, determined.
- **GN-3** Layout: header `UNIT n · DAY n · THE 2026-XJ FILES · READ + COLOR`, then “Chapter n: title”, the outlined day number, five panels (2 · 1 wide · 2), a “Color as you read” line, the color-code strip, and the footer `STUDENT CHOICE BINDER · STORY · DAY n`.
- **GN-4** Each panel uses manga devices: a narration box (italic), oval speech bubbles with the speaker’s name and a tail (≤ 15 words each, about seventh-grade wording), and optional focus lines, speed lines, or a hollow-letter sound effect (BLINK, BEEP!, WHOOSH, GLIDE, !?). Text sits at the top of the panel and art is scaled to fit under it. In a half-width panel the second bubble moves to the bottom.
- **GN-5** Coloring comes first. The art is clean line art with large closed white shapes: faces, hair, clothes, control-room consoles and wall screens, satellites with panel grids, ringed planets, a big Earth and asteroid, and hollow title and sound-effect letters. Use **no screentone or gray fills**. Physics drawings on screens and lab benches reuse `PICS`/`scene()` from `lib.js`, so they match the SEI pages, and arrows follow the color code (`v` purple, `F` orange, dashed paths blue).
- **GN-6** The story follows the daily topic in order and keeps the unit question in view. The last day of a unit ends on a cliffhanger that sets up the next unit (Unit 1 ends with the path starting to curve).
- **GN-7** Source: `project/_gen/story.json`, organized as chapters → panels → `cap`, `b` [[speaker, text]], and `art`. `art` is an object `{t, who, ex, pic, bg, sfx, path, v, F, range, big, seed}`. `t` is one of `space · close · duo · trio · screen · lab`. `bg` is one of `focus · speed · stars · window` (control room by default). `pic` is a `PICS` key or `S=<scene>`. Build with `_gen/build-story.js`, which runs `_gen/story.js`. Every `pic` must exist (V-4). Before release, preview at least one page to check that no bubble covers a face.

## V · Before release

- **V-1** Export one notes page and one practice page of each new style to PDF. Check: nothing clipped, nothing inside the punch margin, and readable in grayscale.
- **V-2** Search the new pages for color words. Each one must match the code (C-2), and none may be "in its color" or "to match" (C-5, C-7).
- **V-3** Check that every page has the color code strip and the `STUDENT CHOICE BINDER` footer label.


## R · Approved narrative packets and print access (November 5, 2026)

Craig approved all 22 Honors narratives and requested the matching CPA set. The delivered CPA PDF had a footer collision; his correction authorizes spacing-only repairs to this edition. These later instructions supersede F-1/F-3 where necessary to remove collisions while preserving all wording, mathematical content, font sizes and diagrams. Retain the original sources and prior editions.

- **R-1** Each day's full narrative teaches the intended lesson in Craig's voice. It is a reading, not a short agenda. Match its course, day, vocabulary, worked examples and intended lesson to the note front. Keep every equation bold, with readable variables and indices.
- **R-1a** When a reading asks students to use something on the front, name the existing section and the feature to inspect. For example, “In Section C, compare the two 8 N arrows on the cart.” Follow the observation with its physical meaning. Check labels, directions and values against the same course and day. Refer to vocabulary, equations or the worked example where the reasoning uses them.
- **R-1b** The approved Unit 1 readings are in `resources/student-choice/unit-1-readings/`. Bold the section labels in the prose and identify the front as their location in the reading header. After rendering the revised backs, run `scripts/student-choice/package-referenced-readings.py` with the CPA and Honors reading PDFs, in that order. The script pairs each reading with the note PDF used by the assignment.
- **R-2** Alternate notes front and matching reading back for all 22 days: 44 Letter pages. Mirror the 0.9-inch punch margin. Offer each day's two-page PDF, notes-only PDF and the complete course packet directly inside Student Choice, plus a teacher print library before assigning.
- **R-3** Preview the six faithful practice pages in a manual, keyboard-accessible carousel. Require exactly the assignment’s teacher-selected count (1–6; default 3). The teacher can edit the count later; retain all saved choices and reviews, show mismatches, and let students adjust unreceived work. Validate against the current assignment count inside the same database lock used for scheduling. Save the student's choices to their own assignment and show them to the teacher. Offer one print link containing the saved original pages, in option order. No quiz, automatic grade, completion or mastery is created by selection or printing.
- **R-4** Before release, render and inspect every delivered notes and narrative page. Verify all text, fonts, equations and graphics, one sheet per page, matching day pairs, opposite punch margins and unclipped content. Keep at least 8pt between the final lesson box and color-code footer, and 18pt of bottom text clearance. Fail on overlap or clipping, including inherited defects; never claim fidelity as a reason to deliver a collision.
- **R-5** Repair spacing in a new version without changing words, font sizes, values or diagram geometry. Compare source and output text/font counts and inspect the repaired layout. Validate all 63 nonempty practice combinations per day against verbatim original sections. Keep pinned historical assignments available.

## FL · Footer and diagram layout — November 6, 2026

- **FL-1** Every notes and practice page uses the shared `resources/student-choice/print-layout.css` geometry: Letter, 0.9-inch left punch margin, 0.3-inch other margins, separate lesson / color-code / footer grid rows, and a 12px gap. Reserve 24px for the footer. Center the footer consistently using 9px IBM Plex Mono with 12px line height. Do not absolutely position the footer over lesson content or enlarge a card with `zoom`.
- **FL-2** Keep at least 8pt of visible space between the final lesson box and color-code strip, and at least 18pt between the last footer text and the paper edge. Reject content that extends outside its card, SVG viewport or page. Solve crowding through spacing and layout; preserve lesson wording and body font sizes.
- **FL-3** Measure SVG labels after the actual fonts load. Keep labels, including subscripts and descenders, clear of arrows, axes, drawing outlines and other labels. Expand the viewport and its reserved container together when necessary. Keep aligned tick labels aligned. Move labels without changing the lengths, directions, coordinates or meaning of the physics drawing. Intentional numbered markers and explicitly struck-out wrong answers are the only documented overlap exceptions.
- **FL-4** For Unit 1, `scripts/student-choice/repair-page-layout.cjs` combines the archived originals, shared CSS and the reviewed `unit-1-layout-adjustments.json`. Compare every text node and every non-text SVG geometry attribute against the source. Render all 44 notes and 132 practice pages to PDF, inspect every page, and check bounds and footer clearance. Test all 63 possible nonempty selections per day against the corrected source sections, including their font asset base URL.
- **FL-5** Package the reviewed fronts with `scripts/student-choice/package-layout.py`, then run `scripts/student-choice/package-practice-print.cjs`. Copy the approved narrative backs without changing their content streams; preserve bold equations, matching day pairs, long-edge duplex order and the opposite 0.9-inch punch margin. Corrected presentation URLs may replace faulty renderings in existing catalog editions while keeping assignment keys, versions, lesson metadata and option order intact. Retain the archived source files for comparison. These authorized formatting repairs supersede the instruction to leave inherited layout defects in pinned editions.
