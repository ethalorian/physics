"""Authored MVP Engineering jobs. Each job is one 110-minute core meeting.

Teacher keys stay in the teacher-plan bundle, never in student content.
Materials in later jobs are preparation gates, with an honest paper alternative.
"""
UNITS = [
    ('Measure and make', 'Make useful objects and readable records from real measurements.', 6),
    ('Lay out and estimate', 'Turn dimensions into layouts, material quantities, and defensible quotes.', 6),
    ('Support and strengthen', 'Build and compare paper structures using controlled tests.', 5),
    ('Route and move', 'Coordinate routes using level references, slope, depth, and flow.', 5),
    ('Heat and electrical systems', 'Investigate thermal performance and low-voltage circuits.', 8),
    ('Plan a school improvement', 'Deliver a surveyed, calculated, tested proposal for a real user.', 6),
]

# Target order: tool/evidence, vocational math, representation/product, reasoning.
TARGETS = [
 [('measure','skill','metrology','I can measure from stated endpoints, record units and resolution, and check a reading.'),('math','reasoning','trade-math','I can calculate lengths, clearances, area, and perimeter with appropriate units.'),('draw','product','plan-reading','I can make a dimensioned drawing or work order another person can use.'),('revise','reasoning','physics-model','I can use a fit or inspection result to make and explain a revision.')],
 [('layout','skill','metrology','I can lay out lengths, centers, and offsets from a common reference.'),('math','reasoning','trade-math','I can calculate scale, spacing, purchase quantities, waste, and cost.'),('plan','product','plan-reading','I can create a usable stock plan, drawing, and material list.'),('check','reasoning','physics-model','I can check geometric and material constraints and explain a changed decision.')],
 [('test','skill','metrology','I can make a fair structural comparison and record repeated tests honestly.'),('math','reasoning','trade-math','I can use ratios, graphs, spacing, and bearing area to compare structures.'),('model','product','plan-reading','I can build and label a model showing supports, connections, and a load path.'),('revise','reasoning','physics-model','I can connect a structural observation to a useful design revision.')],
 [('survey','skill','metrology','I can establish and check a reference for a route or elevation measurement.'),('math','reasoning','trade-math','I can calculate slope, fall, depth, route length, and volume per unit time.'),('route','product','plan-reading','I can draw a coordinated plan and elevation with dimensions and clearances.'),('check','reasoning','physics-model','I can identify a route conflict or flow limitation using evidence and model limits.')],
 [('measure','skill','metrology','I can collect labeled temperature or low-voltage circuit readings using a checked method.'),('math','reasoning','trade-math','I can calculate net area, temperature-change rate, current, resistance, power, and energy.'),('model','product','plan-reading','I can make a labeled thermal or circuit model and its material list.'),('diagnose','reasoning','physics-model','I can use a controlled test to diagnose a thermal or electrical problem.')],
 [('survey','skill','metrology','I can document a real site condition with checked dimensions and clear sources.'),('math','reasoning','trade-math','I can choose, show, and check the mathematics needed for a practical proposal.'),('design','product','plan-reading','I can prepare a coordinated drawing, estimate, and tested model for a user.'),('defend','reasoning','physics-model','I can defend a design decision with evidence and respond to a changed requirement.')],
]

JOBS=[]
def job(unit, title, product, materials, launch, survey, model, plan, make, check, exit, key, *, diagram='layout', support='', extend='', prep='', alternative=''):
    JOBS.append(dict(unit=unit,title=title,product=product,materials=materials,launch=launch,survey=survey,model=model,plan=plan,make=make,check=check,exit=exit,key=key,diagram=diagram,support=support,extend=extend,prep=prep,alternative=alternative))

job(1, 'Make a fitted notebook tray',
 'A paper tray that fits your closed pocket notebook, built by a partner from your work order.',
 'Per student: pocket notebook, tape measure, pencil, about 3 sheets of letter paper. Per pair: scissors and a straightedge or folder edge; shared tape.',
 'Put your notebook on the desk. What must another person know to make a tray that fits it? On scrap paper mark 2 3/8 in, then explain which tick is 1/8 in on your tape. This is a starting check, not a grade.',
 ['Close your notebook. Sketch its cover, label length L and width W, and mark the endpoints you will use. Keep the tape straight and read to the nearest 1/16 in if your tape allows.', 'Measure L and W yourself. Write units and tape resolution. Your partner checks the same endpoints with their tape; remeasure disagreements before choosing the values for your design.', 'Keep your original readings. Circle the dimensions you will use; explain any change. The object is your closed notebook, not the worked-example notebook.'],
 ('A model notebook is 5 1/2 in long and 3 1/2 in wide. Leave 1/8 in clear on EACH side and use 3/4 in walls. What blank is needed?', 'Inside base = notebook dimension + 2 × side clearance. Blank = inside base + 2 × wall height.', 'L: 5 1/2 + 1/4 = 5 3/4 in base; + 1 1/2 = 7 1/4 in blank. W: 3 1/2 + 1/4 = 3 3/4 in base; + 1 1/2 = 5 1/4 in blank.'),
 ['Calculate both base dimensions for YOUR notebook with 1/8 in clearance on each side. Add two 3/4 in walls to each base dimension to find your outer blank.', 'Draw an NTS plan in your notebook. On a separate scrap, write a work order: owner, builder, base L/W, blank L/W, wall height, units, and a labeled sketch. Check that the blank fits your paper before cutting; join sheets if needed.', 'Swap work orders. Ask one clarification before building. Keep your notebook calculation; your partner builds from the scrap.'],
 ['Mark the outer blank on paper and check both dimensions. Cut only the outside rectangle.', 'Mark fold lines 3/4 in from all four edges. Keep the corner squares. From the TOP and BOTTOM edges, cut along the two vertical fold lines only as far as the first horizontal fold line: four short slits total.', 'Fold all four walls upward. Fold each corner tab inward and tape it to the neighboring wall. Keep the base flat. This tray stays supported on the desk; do not carry the notebook in it.'],
 ['Return the tray to its owner. Insert and remove the closed notebook three times without forcing or tearing. Check that the notebook lies flat and that the tray base is not bowed.', 'Compare the built base dimensions with the work order. Record one actual observation, then revise a fold, tab, dimension, or unclear work-order label. Retest and record what changed.', 'If it already fits, keep the dimensions and improve a communication detail. A successful first attempt still needs evidence.'],
 'Work independently. A notebook is 3 7/8 in wide. With 1/8 in clearance on EACH side and 3/4 in walls, calculate base width and blank width. Show both operations and units. If you add only one wall, how far too narrow is the blank? Finish with one observed result from YOUR tray and the revision or check you made.',
 'Base = 4 1/8 in; blank = 5 5/8 in. Missing one wall makes the blank 3/4 in too narrow. Accept a test observation and justified retained dimension; do not require invented failure. Baseline: mark independent / with cue / not observed for reading, calculation, handoff, revision.',
 diagram='tray', support='Use a fraction strip and say: notebook + gap + gap, then base + wall + wall. Demonstrate one paper corner with oversized folds.', extend='Can two 7 1/4 × 5 1/4 in blanks fit on one 8 1/2 × 11 in sheet? Draw the orientation and verify each total.', prep='Make one sample tray. Project the pattern or print the two-page student job. Optional nonzero-start check: a tape reads 1 in at one end and 4 5/8 in at the other; length = 3 5/8 in.')

job(1, 'Survey one school zone',
 'A notebook survey another pair can use to locate three features.', 'Tapes, notebooks, pencils, loose paper; teacher-selected classroom or hallway zones.',
 'Estimate a desk width, then measure it. Convert 3 ft 4 in to inches. Why must every survey name a starting point?',
 ['Choose a reachable rectangular zone and draw an NTS plan. Name one fixed corner A as the datum and mark two directions from it.', 'Measure two boundaries and locate three features from A. Each student takes at least one measurement. Label whether a dimension goes to an edge or center.', 'Independently remeasure one boundary. Record both readings, the difference, and the resolution of the tape. Keep people moving through the hallway.'],
 ('Along a wall, two segments measure 2 ft 8 in and 3 ft 7 in. Find their combined length in feet/inches and inches.', 'Total inches = 12 × feet + inches; add in a common unit.', '32 + 43 = 75 in = 6 ft 3 in.'),
 ['Build one dimension string with at least three segments and compare its sum to the direct overall measurement.', 'Write the discrepancy with units. Decide which endpoint or reading needs checking; do not force the numbers to agree.', 'Prepare a clean drawing with datum, orientation, three features, endpoints, and units. Mark NTS unless you deliberately draw to scale.'],
 ['Exchange drawings with another pair. Use only their drawing to locate the three features.', 'Mark an unclear endpoint or missing dimension on a separate review slip. Return it to the author.', 'Remeasure as needed and issue a revised drawing with date and revision letter.'],
 ['The receiving pair can identify all three features and the datum.', 'Overall length and segment sum are both shown, with any discrepancy explained at the tape resolution.', 'Each student shows one actual tape reading to the teacher.'],
 'A surveyed boundary is 8 ft 3 in. Two segments are 31 in and 42 in. Find the missing segment in inches and feet/inches. Name one change that made your survey easier to use.',
 'Overall 99 in; missing 99 − 31 − 42 = 26 in = 2 ft 2 in. Evidence must name an actual drawing change.', diagram='survey',support='Use inches first and a 12-in-to-1-ft reference. Give a partially drawn datum corner.',extend='Draw the zone at 1 graph square = 6 in and recover two real dimensions from the drawing.',prep='Choose zones without interfering with doors, stairs, or normal circulation. Do not require students to enter restricted spaces.')

job(1, 'Lay out a work area',
 'A full-size paper-marker footprint with checked sides, centers, and diagonals.', 'Tapes, notebooks, scrap-paper corner markers, approved removable tape if available; clear classroom floor.',
 'A rectangular footprint must fit a proposed piece of equipment. Is checking two sides enough to establish a rectangle? Sketch a skewed counterexample.',
 ['Inspect the available floor area and mark a datum corner. Use a classroom model footprint 36 × 48 in, or a teacher-approved smaller version.', 'Mark the four corners with paper markers. Measure all four sides and both diagonals, keeping the tape straight.', 'Write actual measurements; distinguish the intended 36/48 dimensions from your readings.'],
 ('For a 36 × 48 in rectangle, find the center and ideal diagonal.', 'Center offsets = length/2 and width/2. Diagonal² = length² + width².', 'Center = 18 in by 24 in from the datum. Diagonal = √(36² + 48²) = 60 in.'),
 ['Calculate the center and two proposed fixture points 12 in from the short ends along the middle line.', 'Write coordinates from the same datum. Make a sketch another pair can follow.', 'Use the ideal 60-in diagonal as a check for the 36 × 48 in model, not as a substitute for measuring the sides.'],
 ['Lay out the center and fixture locations with small paper markers.', 'A second pair measures all sides and diagonals independently.', 'Adjust the corners and recheck after each move. Leave a before/after reading in the notebook.'],
 ['For this classroom exercise, sides must be within 1/4 in of the requested lengths and each diagonal within 1/4 in of 60 in; this is an assigned model tolerance.', 'Show the datum, both fixture coordinates, and the final center.', 'Explain why a matching pair of diagonals alone does not prove that the requested side dimensions are correct.'],
 'A new 30 × 40 in rectangle replaces the model. Give its center offsets and ideal diagonal. Which measurements would you repeat after moving a corner?',
 'Center 15 × 20 in; diagonal 50 in. Repeat adjacent sides and both diagonals; check moved fixture positions. Keep the tolerance explicitly a classroom criterion.', diagram='layout',support='Use the scaled 3–4–5 relationship and half-length marks before introducing the square-root calculation.',extend='Reduce one width by 6 in; recalculate the center and diagonal, then demonstrate the shift.',prep='Use loose paper markers if tape is not permitted. Keep the layout inside the approved area.')

job(1, 'Estimate a display surface',
 'A covering-and-border takeoff with a piece layout and simulated quote.', 'Tape, notebook, paper, scissors, pencil, calculator after setting up the math.',
 'Point to the surface and then its boundary. Which purchase uses square units and which uses length?',
 ['Survey a reachable rectangular display area. Record width/height in inches, then convert to feet.', 'For a shared purchasing exercise, use a model surface 4 × 6 ft. Paper rectangles will represent materials at 1 in = 1 ft.', 'Separate covering area from border length in two labeled notebook sections.'],
 ('Cover a 4 × 6 ft surface using 2 × 3 ft panels at $4 each. Border comes in 8-ft strips at $3 each. Assume no cutting loss in this paper model.', 'Area = L × W; perimeter = 2L + 2W. Count whole purchasable pieces after checking layout.', 'Area 24 ft²; four panels tile the surface. Perimeter 20 ft; three 8-ft strips supply 24 ft. Cost = 4×$4 + 3×$3 = $25.'),
 ['Draw and cut the scaled panels and surface. Test that the panel orientation covers the rectangle.', 'Make a cutting plan for two 6-ft and two 4-ft border pieces using three 8-ft strips. Show leftovers.', 'List item, size, quantity, unit price, subtotal, and total. Prices are fictional classroom data, excluding tax and labor.'],
 ['Assemble a paper proof of the panel layout. Keep offcuts visible.', 'Have another pair recalculate quantities from your drawing.', 'Repeat the takeoff for your measured surface using the same model materials; state any simplifying assumption.'],
 ['Panel count is supported by a layout, not area division alone.', 'The stock plan can actually supply each border piece; no piece is longer than stock.', 'Quote totals and all units can be traced to the drawing.'],
 'A 3 × 5 ft board uses 1 × 1 ft covering squares at $0.50 each. Border is sold in 6-ft strips at $2 each; show a feasible plan for two 5-ft and two 3-ft edges. Find covering, border purchase, and total cost.',
 '15 squares = $7.50; perimeter 16 ft; three 6-ft strips can yield 5, 5, and 3+3 ft. Border $6; total $13.50. Area-only reasoning is insufficient for stock feasibility.', diagram='takeoff',support='Color surface and border differently. Manipulate scaled pieces before dividing.',extend='Add a 1 × 2 ft opening: compare net area with panel purchase quantity and explain why they may change differently.')

job(1, 'Handle a change order',
 'A revised tray work order, new prototype, and measured comparison.', 'Original notebook/tray, paper, tape, scissors, pencils.',
 'A customer changes one requirement. What should stay traceable between the original and revised drawing?',
 ['Read your original tray dimensions. Mark the original gap and wall height on a fresh sketch.', 'New requirement: increase clearance from 1/8 to 1/4 in on EACH side; retain 3/4 in walls.', 'Remeasure the notebook if the original endpoint record is unclear. Preserve the original design as revision A.'],
 ('An original inside base is 5 3/4 × 3 3/4 in. Each side gap grows by 1/8 in. Find the new base and blank.', 'Total dimension change = 2 × increase per-side gap.', 'Base grows by 1/4 in to 6 × 4 in. With 3/4-in walls, blank = 7 1/2 × 5 1/2 in.'),
 ['Individually calculate the change to both base and blank for your notebook.', 'Make revision B with changed dimensions highlighted and unchanged wall height shown.', 'Check whether the new blank fits available paper. State whether the paper orientation or joining plan must change.'],
 ['Trade the revised work order and build a second tray.', 'Place original and revised trays side by side with the same notebook.', 'Record whether the larger gaps satisfy the changed requirement and whether the walls still stand.'],
 ['Revision B changes both dimensions by the correct total gap increase.', 'The builder can identify the current revision and all critical dimensions.', 'A physical comparison supports the change claim.'],
 'A different customer keeps the base unchanged but increases EACH wall from 3/4 to 1 in. How much does each blank dimension grow? Explain why the inside base does not have to change.',
 'Each blank dimension grows 2×1/4 = 1/2 in. Base unchanged because wall allowance is outside the base; actual folds still require fit verification.', diagram='tray',support='Cross out nothing on revision A. Draw two added 1/8-in bands on revision B.',extend='Write a change that forces a different paper layout, then have another pair solve it.')

job(1, 'Make a replacement template',
 'A removable paper template for a desk mat, drawer liner, or label panel.', 'Paper, tape, scissors, notebook, tape measure; an approved reachable surface.',
 'How could someone make a replacement piece later without access to the original surface?',
 ['Choose a small reachable rectangular feature. Name the part and datum; measure width, length, and any corner obstruction.', 'Choose and state a 1/8-in edge gap for this paper template where appropriate. It is a design choice, not a building requirement.', 'Have a partner repeat one critical measurement before cutting.'],
 ('A 12 × 18 in recess needs a liner with a 1/8-in gap on every edge. Find liner size.', 'Liner dimension = recess dimension − 2 × edge gap.', '11 3/4 × 17 3/4 in. Clearance is subtracted when the part must fit inside an opening.'),
 ['Calculate your template dimensions and label a sketch NTS.', 'Add any measured cutout; locate it from the datum rather than from a guessed center.', 'Write a short fabrication note naming the source measurement and clearance.'],
 ['Join paper if needed, mark the template, and cut it.', 'Set it in place without adhesive. Mark interference points on the template.', 'Revise the template and transfer final dimensions to a clean work order.'],
 ['Template fits without buckling and accounts for the selected edge gaps.', 'A partner can reproduce one critical dimension from the work order.', 'Show an independent subtraction and a documented test result.'],
 'An opening is 10 1/2 in wide. A template needs 1/4 in clearance on each side. Find its width. Compare this subtraction with the additions used to design the tray.',
 '10 in; two 1/4-in gaps total 1/2 in. Liner fits inside opening; tray base surrounds notebook. Look for a context-based explanation.', diagram='template',support='Place two physical paper gap strips at the opening edges.',extend='Create a second template from a partner’s finished work order without seeing the original.')

job(2, 'Space five mounting centers',
 'A paper mounting strip with equal centers and checked edge offsets.', 'Tapes, paper strips joined end-to-end, pencils, graph notebook.',
 'Five objects make how many spaces between the first and last? Draw before calculating.',
 ['Make or join a 30-in paper strip and mark a datum at its left end.', 'Reserve a 3-in margin to the first and last center; measure the usable center span.', 'Write the number of centers separately from the number of intervals.'],
 ('Five centers span a 30-in strip with 3-in end margins. Find spacing and all positions.', 'Spacing = (overall − 2×margin)/(centers − 1).', '(30−6)/4 = 6 in. Positions from datum: 3, 9, 15, 21, 27 in.'),
 ['Calculate every center coordinate before making marks.', 'Draw the strip with dimension arrows to centers, not to hypothetical object edges.', 'Choose a classroom check tolerance of 1/8 in and write it on the work order.'],
 ['Lay out all centers from the SAME datum; do not step an unverified interval down the strip.', 'A partner checks end margins and every interval independently.', 'Correct a mark with a new symbol and revision note so the final center is unambiguous.'],
 ['Five center marks are present and the four intervals agree with the calculation within 1/8 in.', 'Both end margins are checked.', 'Each student explains the denominator without using a memorized rule alone.'],
 'Six centers go on a 42-in strip with 6-in end margins. Find spacing and the first three coordinates.',
 '(42−12)/5 = 6 in; first three = 6, 12, 18 in.',diagram='centers',support='Place five erasers and count the four gaps.',extend='Use six centers on a 31-in strip with 2-in margins: 27/5 = 5.4 in; discuss tape resolution and rounding only at marking.')

job(2, 'Draw a plan to scale',
 'A scale plan and cut-paper equipment pieces for a surveyed classroom zone.', 'Notebook, graph paper, rulers/tapes, scissors, pencils.',
 'If 1 drawing inch represents 2 actual feet, is a 6-ft wall drawn as 3 in or 12 in?',
 ['Use the school-zone survey or remeasure a new approved zone.', 'Record boundary sizes and two movable equipment footprints. Identify features that must remain clear.', 'Choose a scale that fits the available sheet. Record actual dimensions even when drawing to scale.'],
 ('Draw a 12 × 8 ft zone at 1 in = 2 ft. A desk footprint is 4 × 2 ft.', 'Drawing inches = actual feet / 2.', 'Zone = 6 × 4 in; desk = 2 × 1 in. A 1 1/2-in drawing gap represents 3 actual feet.'),
 ['Draw boundaries and datum at the selected scale.', 'Calculate dimensions for two paper equipment pieces; label each with its real size.', 'Propose a layout using existing observed circulation and teacher-defined model clearances; do not claim code approval.'],
 ['Cut and move the paper equipment pieces to test two arrangements.', 'Measure the drawing gaps and convert them back to actual dimensions.', 'Have a partner recover two real dimensions from your drawing without your help.'],
 ['Scale, datum, real dimensions, and feature labels are visible.', 'Paper equipment uses the same scale as the room.', 'The proposal respects the constraints supplied by the teacher and clearly marks any unverified condition.'],
 'At 1 in = 3 ft, a drawing shows a 2 1/2-in wall and a 3/4-in gap. Find both actual lengths, including feet/inches for the gap.',
 'Wall 7 1/2 ft; gap 2 1/4 ft = 2 ft 3 in.',diagram='survey',support='Use a two-column actual/drawing table.',extend='Redraw one corner at double the drawing scale; verify that real dimensions stay unchanged.')

job(2, 'Plan cuts from stock',
 'A stock-cutting diagram that includes a stated cutting allowance.', 'Paper strips, scissors, tape measure, notebook; fictional stock lengths and prices.',
 'Can total requested length divided by stock length always tell you how many pieces to buy? Try fitting two 5-ft pieces in 8-ft stock.',
 ['Model 48-in stock as paper strips at 1 drawing inch = 4 real inches.', 'Required parts: four 11 3/4-in pieces. For this planning exercise, each separating cut consumes 1/8 in of stock.', 'Record stock length, part lengths, and the fictional allowance; scissors do not physically remove that exact kerf.'],
 ('Can four 11 3/4-in parts fit in 48-in stock with four 1/8-in separating cuts?', 'Used stock = sum of finished lengths + cut count × cutting allowance.', '4×11 3/4 + 4×1/8 = 47 1/2 in; leftover = 1/2 in. Count the final separating cut because unused stock remains.'),
 ['Draw the full stock strip with each part and each cut allowance.', 'Write a cut sequence from one end and label usable leftover separately from cutting loss.', 'Independently calculate the same plan in decimal inches, then compare.'],
 ['Cut paper parts using the scaled plan; mark each allowance band rather than pretending scissors have a 1/8-in kerf.', 'Trade the diagram with a partner and ask them to locate each finished piece.', 'Test a different grouping of requested lengths on a fresh strip.'],
 ['Finished lengths, number of separating cuts, kerf loss, and leftover sum to stock length.', 'No finished part is shorter than required.', 'Paper model and stock diagram use matching scales.'],
 'Three 15 3/4-in parts come from 48-in stock. Assume three 1/8-in separating cuts. Find used length and leftover.',
 'Parts 47 1/4 in; cuts 3/8 in; used 47 5/8 in; leftover 3/8 in.',diagram='stock',support='Color kerf bands and count them before doing arithmetic.',extend='Request two 29-in parts and two 18-in parts from 48-in stock with 1/8-in kerf; develop a feasible two-stick plan.')

job(2, 'Compare two material quotes',
 'Two feasible estimates and a recommendation supported by quantities and waste.', 'Paper, notebook, calculator, fictional price card supplied in the lesson.',
 'A cheaper unit price can still lead to a more expensive job. What must we compare besides the price label?',
 ['Use a model 6 × 8 ft covering job.', 'Option A panels: 2 × 4 ft at $7 each. Option B panels: 3 × 4 ft at $11 each. Both can be rotated; use no cutting loss for this comparison.', 'Draw scaled rectangles for the surface and each material.'],
 ('Compare purchase cost for the 6 × 8 ft job.', 'Purchased quantity follows a feasible tiling. Total = quantity × unit price.', 'A: six panels × $7 = $42. B: four panels × $11 = $44. Both tile 48 ft² exactly; A saves $2 on this model.'),
 ['Create both piece layouts and itemized quotes.', 'Calculate purchased area minus required area for each option; label waste in square feet.', 'Recommend an option using both cost and fit. State which real-world costs were omitted.'],
 ['Exchange quote packages and audit each other’s multiplication and piece layout.', 'Teacher changes the surface to 5 × 8 ft. Re-plan cuts for both options.', 'Keep the original and revised quotes so a user can see why the recommendation changes or stays.'],
 ['Every quantity is supported by a layout.', 'Fictional prices and omitted tax/labor are labeled.', 'Recommendation names a numerical difference rather than saying one is simply better.'],
 'A job needs 18 ft². Option X gives 6 ft² per sheet at $5; Option Y gives 8 ft² per sheet at $7. Assuming both piece layouts work, find purchase quantities, costs, and unused purchased area.',
 'X:3 sheets,$15,0 ft² extra. Y:3 sheets,$21,6 ft² extra. Explicit assumption: layouts work; area alone does not establish this.',diagram='takeoff',support='Use quantity × price cards; round sheet counts upward.',extend='Find the Option B unit price that ties the original $42 total: $10.50 per panel.')

job(2, 'Inspect a layout discrepancy',
 'An inspection report with signed differences and a corrected paper layout.', 'Paper-marker layout from Lesson 3 or fresh 30 × 40 in model, tapes, notebook.',
 'A target is 40 in and a reading is 40 3/8 in. What does a positive difference tell the person correcting it?',
 ['Lay out a 30 × 40 in rectangle with one deliberately misplaced corner, chosen by the teacher.', 'Without seeing the planted error, measure all four sides, diagonals, and center coordinates.', 'Record specified and measured values in separate columns.'],
 ('Requested length 40 in; measured 40 3/8 in; assigned tolerance ±1/4 in. Decide acceptance.', 'Signed difference = measured − requested.', '+3/8 in is outside ±1/4 in; the dimension is too long. A 39 7/8-in reading differs by −1/8 in and is inside this interval.'),
 ['Calculate signed differences and absolute magnitudes for all measured constraints.', 'Mark pass/check for each criterion using the teacher’s classroom tolerance.', 'Propose the smallest correction that addresses the pattern of readings.'],
 ['Move a corner or center marker according to the inspection plan.', 'Remeasure affected sides and both diagonals.', 'Have the inspecting pair sign a report naming measurements, dates, and remaining limits.'],
 ['Each decision matches the stated tolerance, including the exact boundary.', 'Both before and after readings are retained.', 'The report distinguishes an actual reading from a predicted correction.'],
 'A center must be 18 in from datum with ±1/8 in tolerance. Evaluate 17 7/8 in and 18 3/16 in. Give the signed differences.',
 '−1/8 in passes at boundary; +3/16 in fails. Tolerance is an assigned classroom constraint, not an installation specification.',diagram='layout',support='Draw an acceptance number line from 17 7/8 to 18 1/8 in.',extend='Explain why averaging an oversized and undersized part does not make either individual part acceptable.')

job(2, 'Deliver a buildable job package',
 'A drawing, stock plan, estimate, and paper model another pair can build.', 'Paper, scissors, tape, tapes, notebooks; prior work orders.',
 'Choose one previous layout or template. What information did the builder still have to ask for?',
 ['Select a 12 × 18 in tabletop organizer footprint or teacher-approved equivalent.', 'Use two dividers running the 12-in direction and spaced equally across the 18-in direction; divider thickness is neglected in the initial paper model.', 'Record the user need, dimensions, assumptions, and a datum.'],
 ('Two divider centerlines split an 18-in length into three equal bays in a zero-thickness model. Locate them.', 'Three bays → three intervals; interval = 18/3.', 'Centers at 6 and 12 in from datum. Real divider thickness would reduce clear bay width.'),
 ['Draw plan and elevation, including divider height of your choice with units.', 'Prepare a paper cut list and a simulated quote using $0.10 per sheet and $0.02 per 6-in tape segment.', 'Calculate material needs from a piece layout, rounding purchases up.'],
 ['Give the package to another pair; they build the paper organizer without seeing your model.', 'Record every clarification the builder requests.', 'Revise the package and have the builder demonstrate how the revision resolves one uncertainty.'],
 ['Model agrees with the specified footprint and divider positions within a stated classroom tolerance.', 'The cut list and quote match the model.', 'Each student independently explains one calculation and one limitation of the paper model.'],
 'A revised zero-thickness organizer has a 24-in length divided into four equal bays. How many internal dividers are needed, and where are their centerlines? Name a package revision supported by your builder’s feedback.',
 'Three dividers at 6,12,18 in. Do not confuse four bays with four internal dividers.',diagram='centers',support='Fold a strip into equal bays before locating divider centerlines.',extend='Include 1/8-in real divider thickness in a clear-width calculation; total clear width = 24 − 3/8 in, divided by four.')

job(3, 'Fold a stronger beam',
 'A controlled comparison of flat, folded, and revised paper beams.', 'Equal sheets of paper, tape, two equal book stacks, ruler/tape; a small shared set of identical erasers or other light loads.',
 'Can the same amount of paper support more load just by changing shape? Predict and sketch a load path.',
 ['Set equal-height supports 6 in apart on a desk. Use the same paper size and orientation for all beams.', 'Agree on one loading position at midspan and one loading increment. Use only small loads that stay over the desk.', 'Record paper, span, load type, support width, and a failure criterion: touches the desk or loses the load.'],
 ('A flat beam holds 2 identical erasers before the chosen limit; a folded beam holds 8. Compare capacity in this specific test.', 'Capacity ratio = folded count / flat count.', '8/2 = 4 times the count under the same test conditions. This is not a force in newtons without measuring load mass or force.'),
 ['Design a folded beam from the same paper allowance. Dimension fold locations.', 'Predict how the shape changes bending and show where the load travels into supports.', 'Make a data table for shape, trial, supported count, and observed failure.'],
 ['Test flat and folded versions using equal span and centered loading; use fresh matching specimens after permanent creases or damage.', 'Repeat each condition three times where materials permit.', 'Revise one fold feature and repeat the same test; keep other variables fixed.'],
 ['Data identifies counts, trials, and the failure criterion.', 'Comparison holds paper amount, span, and load placement constant.', 'Revision is connected to an observed bend, buckle, or connection issue.'],
 'Two designs support 3 and 9 identical loads in the same test. Find their capacity ratio. Name two conditions that must stay the same, and one limitation of using object counts.',
 'Ratio3; control span/material/loading position or support width. Counts require identical loads and do not establish newtons or real structural capacity.',diagram='beam',support='Provide fold marks for one channel section and keep the second design student-selected.',extend='Graph mean supported count by shape; explain variation and avoid treating a damaged repeat as independent.')

job(3, 'Test the effect of span',
 'A graph and recommendation connecting span to paper-beam performance.', 'Identical folded paper beams, book supports, tape/ruler, light identical loads.',
 'Would you predict the same beam to perform equally across 4, 6, and 8 in spans? What must remain unchanged?',
 ['Make matching beams from one fold pattern. Set up 4, 6, and 8 in support spans.', 'Choose a fixed load count that does not immediately collapse the weakest setup, established by a small pilot trial.', 'Measure midspan height before and after loading using the same datum; record the difference as deflection.'],
 ('At fixed load, midspan height changes from 2 in to 1 3/4 in. Find deflection.', 'Deflection = unloaded height − loaded height.', '1/4 in downward. Record it as a magnitude and direction; do not confuse the remaining height with the change.'),
 ['Predict the span–deflection trend and draw labeled axes: span in inches, deflection in inches.', 'Plan three fresh-specimen readings per span or explicitly label repeated readings on one specimen.', 'Keep beam shape, paper amount, load, placement, and supports the same.'],
 ['Take readings at each span and graph your actual results.', 'Repeat a surprising result after checking the datum and beam condition.', 'Choose a span for a model shelf and justify it with evidence, not a universal structural rule.'],
 ['Graph axes carry quantities and units.', 'A comparison separates controlled load from changing span.', 'Recommendation acknowledges that paper-beam results do not rate a full-size shelf.'],
 'An unloaded beam midpoint is 2 1/4 in above the desk and becomes 1 7/8 in under load. Calculate deflection. If load also changed between spans, why would the comparison be ambiguous?',
 '3/8 in downward. Both span and load could cause the difference.',diagram='beam',support='Use a vertical sketch with the desk as zero and two height marks.',extend='Compute mean deflection across three valid trials and describe the range.')

job(3, 'Brace a frame',
 'A paper frame that resists racking better after a documented revision.', 'Folded paper strips, tape, paper fasteners if available, notebooks, ruler/tape.',
 'Push the top of a loose rectangle sideways in a sketch. Which dimension changes first, and why might a diagonal help?',
 ['Make a model frame 6 in wide and 8 in tall from stiff folded strips; use the same corner connections for both trials.', 'Record both diagonals before pushing and mark a reference outline on paper.', 'Choose a repeatable gentle displacement test: move the top corner 1 in sideways, release, and measure the remaining offset.'],
 ('A 6 × 8 in frame needs a corner-to-corner brace in a zero-thickness centerline model.', 'Brace length = √(6² + 8²).', '10 in between corner reference points; add measured attachment overlaps when making the actual strip.'),
 ['Draw the unbraced and proposed braced frames; mark load direction and connections.', 'Calculate brace centerline length and add a stated overlap at both ends.', 'Plan to compare remaining offset after the same initial displacement.'],
 ['Test the unbraced frame gently; record residual offset.', 'Add one diagonal brace with documented attachments. Repeat the same displacement test.', 'Revise a weak connection and retest; do not claim the hand force was measured.'],
 ['The diagonal and attachment allowance are separately labeled.', 'Before/after test conditions are comparable.', 'Explanation mentions triangle geometry and connection behavior, using observed motion.'],
 'A 9 × 12 in centerline rectangle needs a diagonal with 1 in attachment overlap at each end. Find brace blank length and explain why checking only the strip strength misses a possible failure.',
 '15-in diagonal +2 in =17 in blank. Connections may slip, peel, or tear.',diagram='frame',support='Use a 3–4–5 sketch scaled by two.',extend='Compare a single diagonal with an X brace using the same paper allowance.')

job(3, 'Place the supports',
 'A support layout with equal spans and a load-path explanation.', 'Paper beam/deck, book or folded-paper supports, tape, light identical loads.',
 'A 24-in model has supports at both ends and three inside. How many spans are created?',
 ['Build a 24-in paper deck strip or use a scaled 12-in model with the scale labeled.', 'Locate end supports and three internal support centerlines.', 'Measure the actual support positions from a common datum.'],
 ('Place five support centerlines from 0 to 24 in at equal spacing.', 'Span = end-to-end distance/(supports − 1).', 'Four spans of6 in; support centers0,6,12,18,24 in.'),
 ['Draw the centerline layout and calculate all support coordinates.', 'Place a proposed load and draw arrows showing a possible path into supports.', 'Predict which unsupported region will bend most; do not assume equal reactions for every load location.'],
 ['Build the layout and apply a small load at one span midpoint.', 'Remove one internal support in the paper model and repeat using the same load.', 'Restore or relocate a support to reduce the observed bend; record revised coordinates.'],
 ['The model matches the calculated centerline spacing.', 'Observations distinguish span change from material change.', 'Each student explains how a missing support changes the path and unsupported distance.'],
 'A 36-in layout has supports at both ends and two inside at equal spacing. Give all coordinates and the span. How many spans remain if one internal support is removed?',
 '0,12,24,36 in;12-in spans. Removing one leaves two spans, one24 in and one12 in.',diagram='centers',support='Count spaces with physical support cards before dividing.',extend='Require maximum span8 in across36 in: at least5 spans and6 support centerlines if end supports are included; equal span7.2 in.')

job(3, 'Spread the bearing load',
 'A bearing-area comparison and improved paper support assembly.', 'Paper support columns with narrow and wide paper feet, soft scrap paper pads, small equal loads; balance or force meter optional.',
 'The same load rests on a narrow or wide foot. What quantity connects load and contact area?',
 ['Make two support feet with different measured contact areas: model sizes1 ×1 in and1 ×2 in.', 'Keep load, column height, and pad material the same.', 'Record whether load is known in newtons or only as a count of equal objects.'],
 ('A supplied example load is12 N on contact areas2 cm² and6 cm². Compare average pressure.', 'Average pressure = force/contact area.', '6 N/cm² versus2 N/cm². Tripling area reduces this average pressure to one third for the same force.'),
 ['Calculate both paper foot areas; predict the relative average pressure under the same load.', 'Draw load arrows from top to foot and label contact area.', 'Plan a pad-mark or tilt comparison; acknowledge that visible deformation is a proxy rather than a pressure gauge.'],
 ['Test the two feet with the same small load over the desk.', 'Record sinking, imprint, tilt, or lack of visible difference honestly.', 'Build an improved support by changing foot area or connection; test again.'],
 ['Area calculations use square units.', 'No newton value is invented from unknown object counts.', 'Conclusion distinguishes the pressure model from the observed pad response.'],
 'A supplied20-N force acts over5 cm². Find average pressure. What area gives2 N/cm² under the same force?',
 '4 N/cm²; area10 cm². These are supplied model data, not measurements of students’ paper supports.',diagram='bearing',support='Tile each contact region with equal graph squares.',extend='Compare a wide disconnected foot with a smaller well-connected foot and explain the load-path issue.',prep='If a balance/force meter is unavailable, use relative pressure with the same load; numerical newtons stay clearly labeled supplied cases.')

job(4, 'Establish a level reference',
 'A checked reference line and elevation record for a low classroom model.', 'Checked spirit level, string and low book blocks or a low tray; tape; paper. If unavailable use supplied drawing case.',
 'A tape measures length. How will you know a line is horizontal before calling a vertical difference a rise or fall?',
 ['On a low desk model, check the spirit level on a stable surface, reverse it end for end at the same location, and compare indications.', 'Use a checked horizontal reference above two endpoints A and B. Measure vertical drops to both points.', 'Record reference method, endpoint labels, and actual readings.'],
 ('Drops from one level line are A=2 in and B=3 1/4 in. Which point is lower, and by how much?', 'Larger downward distance from the same level line means lower elevation.', 'B is1 1/4 in below A. A slanted reference line would invalidate this comparison.'),
 ['Draw a side view showing the level reference and both vertical drops.', 'Calculate the elevation difference and predict the direction of gravity-driven travel.', 'Write one method limitation, such as sagging string or an unverified level.'],
 ['Build a low paper route joining the endpoints and check its direction against the reference.', 'Have a partner repeat both drop measurements.', 'Resolve a discrepancy by checking the reference before changing the route.'],
 ['A horizontal reference is established independently of the tape.', 'Both drops share the same reference.', 'The conclusion names which endpoint is lower and by how much.'],
 'Drops from a level line are4 1/8 in at A and5 3/8 in at B. Find the fall A→B. Explain what happens if the reference sags.',
 'Fall1 1/4 in. Sag changes the reference elevation and can create a false difference.',diagram='slope',support='Draw equal horizontal reference height and two downward arrows.',extend='Add a third point and detect a local reverse slope even when total fall is positive.',prep='Arrange checked levels before this meeting. Stay on low models, without climbing.',alternative='Use the supplied level-line example, construct a side-elevation paper model, and label all values supplied. Schedule the real reference check when equipment is available.')

job(4, 'Lay out a sloping route',
 'A dry paper route with calculated fall and a verified elevation drawing.', 'Tape, notebook, paper, low supports, checked level; no water required.',
 'A route drops1/4 in per foot. Does a longer route need the same total drop?',
 ['Use a classroom design brief: a6-ft horizontal run at1/4 in fall per foot. This is a math model, not a prescribed installation rule.', 'Build at1 drawing inch=1 actual foot and record horizontal/vertical scale clearly.', 'Establish the starting elevation and available low-model space.'],
 ('Find fall and percent slope for6 ft at1/4 in per foot.', 'Fall = run × fall per foot. Percent slope = vertical fall/horizontal run ×100 with equal units.', 'Fall1 1/2 in. Run72 in; slope1.5/72×100 ≈2.08%.'),
 ['Calculate end elevation relative to the start.', 'Draw plan and elevation; label which length is horizontal run rather than sloped path.', 'Choose whether the elevation uses an enlarged vertical scale; label it if different.'],
 ['Construct the dry paper route on low supports.', 'Check endpoint difference with a level reference, or compare the supplied elevation drawing if equipment is unavailable.', 'Adjust a support and record the resulting fall.'],
 ['Slope calculation uses matching units.', 'Both drawing scales are stated.', 'Physical or drawing inspection distinguishes a local sag from total endpoint fall.'],
 'An8-ft horizontal run drops2 in. Find in/ft and percent slope. At the same in/ft, what fall does10 ft require?',
 '1/4 in/ft;2/96×100≈2.08%;10 ft needs2 1/2 in fall.',diagram='slope',support='Make a table for1,2,4,6 ft before calculating percent.',extend='Given available fall1 in at1/4 in/ft, calculate maximum horizontal run4 ft.',alternative='Use a dimensioned drawing and build a scale paper elevation; mark reference data supplied and reserve instrument evidence for a later practical.')

job(4, 'Coordinate a dry service bay',
 'A plan and elevation showing two routes and a resolved crossing.', 'Graph paper, colored strips, tape, ruler; a24 ×18 in tabletop paper bay.',
 'Two routes can look separate in plan and still collide in elevation. What views does the installer need?',
 ['Draw a24 ×18 in bay and datum. Place a horizontal service strip and a crossing strip with a stated model width.', 'Set a model crossing envelope: usable depth6 in, upper route thickness1 in, lower route thickness1 1/2 in, required model gap1/2 in.', 'Label these as supplied classroom constraints, not actual trade clearance rules.'],
 ('How much depth do both routes and the model gap occupy?', 'Required depth = upper thickness + gap + lower thickness.', '1+1/2+1 1/2=3 in;6−3=3 in remain for offsets or other stated allowances.'),
 ['Draw both plan and side view at the crossing.', 'Specify the order of routes and locate their edges and centerlines from common references.', 'List any assumed support thickness or bend allowance separately.'],
 ['Build colored paper strips and a folded side-view mockup of the crossing.', 'Have another pair check all route envelopes and gaps.', 'Revise a collision or an ambiguous dimension and rebuild the crossing.'],
 ['Plan and elevation describe the same crossing.', 'The depth budget includes every stated thickness and gap.', 'The model passes its classroom constraints and lists any unknown real-system requirements.'],
 'A5-in depth must hold a1 1/4-in route, a2-in route, and3/4-in gap. Find spare depth. If one route grows by1 1/2 in, quantify the conflict.',
 'Used4 in, spare1 in. Growth makes5 1/2 in required, exceeding depth by1/2 in.',diagram='route',support='Stack labeled paper bands to represent occupied depth.',extend='Find two distinct revisions that resolve the quantified conflict while preserving the stated gap.')

job(4, 'Revise an elevation budget',
 'A revised route package after a finish or run-length change.', 'Prior service-bay drawings, paper strips, notebook, calculator.',
 'A floor finish gets thicker. Which reference changes, and which dimensions must be recalculated?',
 ['Use a supplied model depth of8 in above a fixed lower obstruction.', 'Original finish occupies1 in; route envelope2 in; supports1/2 in; route fall2 in; required classroom gap1 in.', 'Create a stacked section showing all five allowances before changing anything.'],
 ('Find spare depth, then increase finish thickness by3/4 in.', 'Spare = total depth − all occupied allowances.', 'Original spare8−(1+2+1/2+2+1)=1 1/2 in. New spare3/4 in.'),
 ['Compute original and revised budgets independently.', 'Mark the finish reference and any fixed obstruction explicitly.', 'Propose a revised route only if a constraint is violated; a remaining positive budget alone does not verify every local crossing.'],
 ['Build both paper sections with colored allowance bands.', 'Exchange the change order and ask another pair to reproduce the revised section.', 'Check one local crossing and record whether it uses the same maximum envelope assumed in the budget.'],
 ['Every allowance appears once and uses the same direction/reference.', 'Original and revised totals can be checked.', 'Recommendation acknowledges bend, support, and crossing details beyond endpoint arithmetic.'],
 'A route runs12 ft at1/4 in/ft. The run increases to16 ft at the same slope. How much extra fall is needed, and what happens to a depth budget with only3/4 in spare?',
 'Fall grows3→4 in, extra1 in; exceeds spare by1/4 in.',diagram='route',support='Subtract each labeled band from the total in a running table.',extend='Determine the longest extra run the3/4-in spare can accommodate at1/4 in/ft:3 ft.')

job(4, 'Measure a flow rate',
 'A repeated volume/time investigation with a controlled comparison.', 'If arranged: tray, small pitcher, measuring cup, timer, towel, funnel or short tubing; otherwise supplied dataset and paper apparatus model.',
 'Which pours faster:300 mL in12 s or250 mL in8 s? Decide using a rate, not volume alone.',
 ['Use a small contained water setup on a tray; the teacher approves the setup and keeps it away from electrical equipment.', 'Select one collection interval or target volume. Keep starting water level, outlet arrangement, and collection method the same across repeats.', 'Record at least three trials with volume in mL and time in seconds. Label supplied data if using the paper alternative.'],
 ('A collection is240 mL in12 s. Find flow rate and predicted volume in30 s if the rate stays constant.', 'Flow rate = volume/time; volume = rate×time.', '20 mL/s; prediction600 mL in30 s. A falling reservoir level can change the rate.'),
 ['Set up a volume/time table and predict the effect of changing one outlet condition.', 'Choose only one change and state the controlled starting conditions.', 'Identify a source of timing or reading uncertainty.'],
 ['Measure the baseline trials, then the changed condition.', 'Calculate each trial’s rate and compare averages; keep unexpected values visible and explain any repeat.', 'Draw the setup showing height difference, outlet, and collection point.'],
 ['Volumes and times are actual or explicitly supplied.', 'The changed condition is separated from controlled conditions.', 'Explanation connects the observed rate to the setup without claiming water flow and electric current are identical.'],
 'A supplied trial collects350 mL in14 s. Find rate and predicted time for500 mL at that constant rate. Why might the prediction fail for an emptying container?',
 '25 mL/s;20 s. Falling water level changes driving pressure difference and may reduce flow.',diagram='flow',support='Use a volume÷time table with units written before numbers.',extend='Graph cumulative collected volume against time; compare segment slopes.',prep='Check inventory two meetings ahead. Use small volumes and a spill tray.',alternative='Analyze supplied trials: baseline240/12,230/12,250/12 mL/s pairs; changed180/12,190/12,170/12. Build and label a paper apparatus model. Mark conclusions as dataset analysis, not a performed wet test.')

job(5, 'Estimate a thermal envelope',
 'A net-area takeoff and proposed paper room envelope.', 'Tape, notebook, paper, scissors; model material price card.',
 'A wall has an opening. Should it be counted in covering area, border length, both, or neither? State what is being purchased.',
 ['Survey an approved reachable rectangular classroom wall section and identify openings without climbing.', 'For the shared model, use a12 ×8 ft wall with a3 ×4 ft opening.', 'Record gross dimensions, opening dimensions, and any unmeasured regions.'],
 ('Find net wall area and sheets if each model sheet covers8 ft² and arbitrary offcuts can be reused in this area-only estimate.', 'Net area = gross area − openings; lower-bound sheet count = ceiling(net/sheet area).', '96−12=84 ft²;84/8=10.5, so at least11 sheets. An actual cutting layout may require more.'),
 ['Draw the wall and opening at a stated scale.', 'Create a sheet layout and compare its feasible count with the area lower bound.', 'Use a fictional price of$6 per sheet; list quantity and subtotal, excluding tax/labor.'],
 ['Build a paper wall section with the opening and sheet seams.', 'Have another pair trace each quantity to a dimension.', 'Revise one seam layout to reduce offcuts or improve continuity.'],
 ['Gross, opening, and net areas are distinct.', 'Purchase count follows a feasible layout, with any waste stated.', 'The model is a material proposal, not a claim of measured insulation performance.'],
 'A10 ×9 ft wall has a2 ×3 ft opening. Find net area and area-based minimum number of12-ft² sheets. Explain why a cut layout is still needed.',
 '84 ft²;7 sheets area minimum. Shape, seams, and usable offcuts can increase actual purchase count.',diagram='envelope',support='Shade the opening before subtracting its area.',extend='Add two openings and compare edge/border quantities with net-area change.')

job(5, 'Compare heat loss',
 'A controlled temperature-time comparison and evidence-based conclusion.', 'Arranged in advance: two matching cups/containers, thermometers, timer, safe teacher-supplied warm water, paper wrap, tray; or supplied dataset.',
 'If one cup starts hotter, is its final temperature alone a fair test of insulation?',
 ['Use two matching containers with equal water volume and similar initial temperature, located together.', 'Wrap one with a documented paper layer and leave the other as the comparison. Keep lid condition and measurement method the same.', 'Measure initial temperature and then at2-min intervals through10 min; record room temperature if a suitable thermometer is available.'],
 ('A supplied cup changes from40°C to34°C in10 min. Find temperature drop and average cooling magnitude.', 'Drop = initial−final; average cooling magnitude = drop/time.', '6°C drop;0.6°C/min average over that interval, not necessarily the rate at every instant.'),
 ['Predict which arrangement will show a smaller drop and why.', 'Create a time/temperature table and label the variable changed.', 'Plan a repeat or a limitation statement if only one trial per condition is possible.'],
 ['Run the comparison without changing wrap or lids midway.', 'Graph both temperature histories on the same labeled axes.', 'Compare temperature drops and discuss measurement uncertainty or uneven starts.'],
 ['Temperatures are measured or explicitly supplied.', 'The conclusion uses change over the same time and comparable starting conditions.', 'Students do not calculate a material R-value from this simple cup test.'],
 'Supplied cups start at42°C. After8 min, A is36°C and B is38°C. Find each average cooling magnitude and identify which retained more thermal energy if water masses are equal. Name one controlled condition.',
 'A0.75°C/min;B0.5°C/min. B remains warmer and retained more thermal energy for equal water mass and same material. Control volume/container/start/room/lid.',diagram='thermal',support='Use initial→final arrows and compare drops before dividing.',extend='Compare early and late interval rates and explain why a single straight trend may be incomplete.',prep='Arrange thermometers and safe warm water before release. Teacher manages water temperature.',alternative='Use supplied times0,2,4,6,8,10 min; A40,38,36.5,35.5,34.5,34°C; B40,39,38,37.2,36.6,36°C. Build paper wrap models; label graphs supplied-data analysis.')

job(5, 'Improve a thermal design',
 'A revised wrap or envelope model with a controlled retest and material budget.', 'Previous thermal setup and data; paper and tape; same measuring equipment or supplied comparison.',
 'Your first test suggests a useful revision. What single feature can you change while keeping the comparison interpretable?',
 ['Review the previous temperature graph and identify a specific weakness or uncertainty.', 'Choose one change: wrap layers, coverage, or lid condition, with teacher approval.', 'Record original materials, new materials, and the hypothesis before testing.'],
 ('Original temperature drop is8°C; revised drop is6°C over the same interval. Find reduction and percent reduction relative to original drop.', 'Reduction = original−revised; percent = reduction/original×100.', '2°C reduction;25% smaller drop. This is not a25% increase in R-value.'),
 ['Set a fixed paper budget and calculate used area for both versions.', 'Draw the thermal paths through the sides, lid, and base; mark which one you changed.', 'Plan the same volume, initial temperature, location, and measurement interval.'],
 ['Build the revision and run the comparison or analyze the supplied case.', 'Calculate and graph change, labeling evidence source.', 'Revise your claim if variation or uncontrolled conditions prevent a clear conclusion.'],
 ['A single intended variable is identified.', 'Cost/area and temperature evidence support the recommendation.', 'A weak or inconclusive result is reported honestly.'],
 'A supplied original drop is5°C and revised drop is4°C. Find percent reduction. Why is “20% smaller temperature drop” more defensible than “20% better insulation rating”?',
 '20%; test measures a particular temperature history, not standardized material resistance.',diagram='thermal',support='Use a100-square representation for percent after calculating the difference.',extend='Design a second trial that addresses the largest uncertainty.',alternative='Use supplied original/revised drops8°C and6°C at the same stated conditions; analyze the comparison and propose a real retest. Do not record it as student measurement.')

job(5, 'Build a low-voltage light circuit',
 'A labeled circuit diagram and working switched lamp circuit, or a paper continuity model if parts are unavailable.', 'Teacher-selected low-voltage battery holder, matched lamp, insulated leads and switch; suitable meter if available; no wall-outlet wiring.',
 'Trace a complete path from one battery terminal through the load and back. What does an open switch change?',
 ['Identify source rating, lamp rating, and connection points with the teacher.', 'Before connecting power, draw a simple loop containing source, switch, and load.', 'Use the teacher’s approved low-voltage kit; do not bridge source terminals or use unknown power supplies.'],
 ('A supplied resistor model has6 V across30 Ω. Find current.', 'I=V/R.', 'I=6/30=0.20 A. A real lamp may not have constant resistance as it warms; the resistor model is a calculation case.'),
 ['Draw symbols and label source voltage and expected open/closed states.', 'Calculate the supplied resistor example, then explain what must be measured to compare a real circuit.', 'Prepare a parts list and a connection check before energizing.'],
 ['Build the approved source–switch–lamp loop with the source disconnected, then have the teacher inspect it.', 'Connect the source and demonstrate three on/off cycles.', 'If using a meter, follow the teacher’s selected mode and connection demonstration; record what quantity was actually measured.'],
 ['The diagram matches the physical circuit and switch interrupts the intended path.', 'The lamp operates through three cycles without loose or hot connections.', 'Paper alternative shows continuity decisions but is labeled untested electrically.'],
 'For a supplied ideal24-Ω resistor connected across6 V, calculate current. Explain why an open switch stops current in the single-loop circuit.',
 '0.25 A; open switch breaks the conducting loop. Numerical resistor case is separate from lamp behavior.',diagram='circuit',support='Trace the loop with a finger on a paper diagram before connecting parts.',extend='Predict current for the same resistor at3 V and explain the ratio.',prep='Inventory and approve parts/meters at least two meetings ahead; use matched educational components.',alternative='Build a large paper circuit diagram with a movable switch gap. Trace continuity and solve the supplied resistor cases; schedule the functioning-circuit practical when the kit is ready.')

job(5, 'Compare series and parallel paths',
 'Two circuit layouts with a path comparison and resistor-model calculations.', 'Approved low-voltage kit with two matched lamps and source; or colored paper circuit paths.',
 'If one load’s connection opens, when will another load still have a complete path?',
 ['Draw one series loop and two parallel branches using the same component symbols.', 'Identify which components share current in series and which share voltage in parallel.', 'Use an ideal calculation case with two equal12-Ω resistors and a6-V source.'],
 ('Compare the supplied equal-resistor cases.', 'Series Rtotal=R1+R2. Parallel branches each receive source voltage.', 'Series24 Ω gives total0.25 A. Parallel: each branch6/12=0.5 A; total1 A. Use only kit combinations approved for the source.'),
 ['Calculate ideal branch/total currents and annotate both drawings.', 'Predict what happens if one connection opens in each arrangement.', 'Separate ideal resistor predictions from observations of real lamps.'],
 ['With power disconnected, construct each teacher-approved configuration.', 'Observe operation and the effect of opening one branch connection after disconnecting power to rearrange.', 'Record actual behavior or trace paper continuity if using the alternative.'],
 ['Diagram and construction agree.', 'The explanation follows complete paths rather than saying electricity chooses only one route.', 'Total and branch currents are labeled distinctly in the supplied math.'],
 'Two equal20-Ω ideal resistors use a4-V source. Find series total current, parallel branch current, and parallel total current.',
 'Series0.10 A; each parallel branch0.20 A; parallel total0.40 A.',diagram='circuit',support='Color each complete parallel loop separately.',extend='Compare one10-Ω and one20-Ω parallel branch at4 V:0.4 A and0.2 A, total0.6 A.',prep='Check source current capability and lamp ratings before configuring parallel branches.',alternative='Use paper branch paths and the supplied ideal resistor cases. Record no invented voltage/current measurements.')

job(5, 'Diagnose a circuit fault',
 'A fault-finding record showing prediction, test, result, and repair.', 'Approved low-voltage kit with teacher-planted open connection or switch fault; meter only if taught; paper fault cards as fallback.',
 'The lamp is dark. Why is replacing every part at once a weak diagnostic method?',
 ['Compare the circuit to its approved diagram with power disconnected.', 'List two plausible causes: an open connection or an open switch/contact.', 'Choose a test that separates the causes without shorting the source.'],
 ('A supplied resistor test has6 V across a30-Ω load. After replacement with60 Ω at the same voltage, predict current.', 'I=V/R.', '0.20 A becomes0.10 A. A current change is not by itself proof that the original fault was resistance.'),
 ['Write a hypothesis and expected observation for one test.', 'Plan inspection/continuity tracing first; use a meter only in a mode demonstrated by the teacher.', 'Prepare a four-column log: hypothesis, test, observation, next action.'],
 ['Make one change or test at a time with appropriate source disconnection.', 'Repair the identified open path and demonstrate operation.', 'Restore the original drawing with the verified connection labeled; explain evidence against one alternative cause.'],
 ['Log shows an ordered diagnostic path.', 'Conclusion cites a test observation, not only a guess.', 'Circuit completes three functional cycles after repair, or the paper alternative identifies the complete path after correction.'],
 'A6-V ideal circuit with total resistance40 Ω should carry what current? If the switch is open, why should you investigate continuity before using that value as an actual reading?',
 '0.15 A for the closed ideal circuit; an open path interrupts it, so predicted closed-circuit current is not an observed value.',diagram='circuit',support='Use fault cards with one open connection at a time.',extend='Create a two-hypothesis paper fault case with an observation that distinguishes them.',alternative='Use two paper diagrams, one with an open switch and one broken lead. Specify and explain the distinguishing inspection; do not claim a measured repair.')

job(5, 'Budget electrical power and energy',
 'A device-use estimate using stated ratings and a clearly labeled fictional tariff.', 'Notebook, calculator, teacher-provided low-voltage rating cards; no need to open appliances.',
 'Which quantity is power and which is energy: watts or watt-hours? What additional information does an energy estimate need?',
 ['Read two supplied ratings: a6-V model load at0.25 A and a6-V model load at0.50 A.', 'Record planned operation time of2 h for each.', 'Label these as supplied cases, not measurements of school devices.'],
 ('Find power and energy of a6-V load drawing0.25 A for2 h.', 'P=VI; E=P×time.', '1.5 W;3 Wh=0.003 kWh. At fictional$0.20/kWh, energy cost=$0.0006 for this tiny example.'),
 ['Calculate power and energy for both supplied loads.', 'For a larger fictional estimate, calculate energy for ten20-W lights operating5 h.', 'Keep watts, hours, Wh, kWh, and dollars in separate labeled columns.'],
 ['Make a paper usage schedule and calculate daily energy.', 'Change operating time or load count and issue a revised estimate.', 'Exchange estimates and check factors of1000 and multiplication order.'],
 ['Power and energy have correct units.', 'Ratings and tariff are labeled supplied/fictional.', 'Recommendation quantifies the effect of a changed schedule without inventing real utility savings.'],
 'Six10-W lights run4 h. Find total power, energy in Wh and kWh, and cost at fictional$0.25/kWh.',
 '60 W;240 Wh;0.24 kWh;$0.06.',diagram='energy',support='Use one device for one hour before scaling count and time.',extend='Compare reducing power by25% with reducing time by25%; discuss their combined multiplicative effect.')

job(5, 'Coordinate the system proposal',
 'A paper model integrating an enclosure, low-voltage route, material estimate, and test plan.', 'Paper/folders, tape, ruler/tape, notebooks; optional approved light kit.',
 'A layout, thermal layer, and wire route each work separately. Where might they conflict when combined?',
 ['Design a small paper display enclosure with a removable cover and optional approved low-voltage light.', 'Measure the chosen base footprint and required equipment envelope.', 'List accessibility, heat, routing, and material assumptions; keep paper away from any component the teacher identifies as warm.'],
 ('A paper enclosure has a12 ×8 in base and4-in side height. Find total area of base plus four walls, without a lid.', 'Area = LW +2LH +2WH.', '96+96+64=256 in² before tabs or cutting waste.'),
 ['Draw plan and side view with service path and removable access.', 'Calculate paper area, a feasible piece layout, and a parts list.', 'Choose acceptance tests for access, fit, and circuit operation if hardware is used.'],
 ['Build the paper enclosure and route model; install only teacher-approved parts.', 'Exchange models and have another pair follow the access/removal procedure.', 'Revise one interference or unclear drawing dimension.'],
 ['Model, drawing, and estimate agree.', 'Access is demonstrated without tearing the model.', 'Electrical/thermal claims distinguish measured evidence from proposed tests.'],
 'A10 ×6 in base has3-in walls and no lid. Find base-plus-wall area before tabs. Explain one coordination conflict you tested or would need to test.',
 '60+60+36=156 in². Require a specific conflict and evidence or honest future test.',diagram='envelope',support='Unfold a paper net and label each face before calculating.',extend='Add a removable lid and calculate its area and tab allowances from your actual design.',alternative='Build the enclosure and a labeled paper service route; provide a specific circuit test plan instead of claiming operation.')

job(6, 'Write the improvement brief',
 'A one-page proposal brief for a real school need with measurable acceptance criteria.', 'School access, notebook, tape, paper; a staff-user need communicated through the teacher.',
 'Choose a small need: organized equipment, a display, a storage layout, or a classroom arrangement. Who will use it and what would success look like?',
 ['Observe a teacher-approved location. Record facts separately from assumptions.', 'Document at least three dimensions relevant to the need, with endpoints and units.', 'Teacher supplies or gathers the user’s requirements; do not interrupt other classes to interview staff.'],
 ('A model storage zone is48 in wide. Three bins each need14 in, with two2-in gaps. Does the layout fit?', 'Required width = bin widths + internal gaps.', '3×14+2×2=46 in;2 in remain for any stated outside margins.'),
 ['Write the user, problem, product, constraints, and three measurable acceptance checks.', 'Calculate one early feasibility check from actual dimensions.', 'Mark unknowns and assign how each will be verified.'],
 ['Make two quick paper concepts and compare them to the brief.', 'Have another team challenge one assumption using the measured site.', 'Choose a concept and revise the brief with the reason.'],
 ['Need is tied to a real observed context.', 'Criteria can be checked by measurement or a stated practical test.', 'Scope is a proposal/model; installation is not promised without school arrangements.'],
 'A55-in model zone must fit four12-in bins and three2-in gaps. Calculate required width and spare/conflict. Give one measurable criterion from your own brief.',
 '54 in required;1 in spare. Student criterion needs a quantity or observable test.',diagram='survey',support='Use a brief with five boxes: user, need, dimensions, constraints, tests.',extend='Compare two feasible concepts using a simple weighted criteria table, explaining the chosen weights.')

job(6, 'Survey for the proposal',
 'A checked site survey and a list of unresolved measurements.', 'Tapes, notebooks, graph/loose paper; approved school zone.',
 'Which missing measurement could make your proposal fail even if all arithmetic is correct?',
 ['Establish a datum and orientation for the selected project.', 'Measure boundaries, relevant feature offsets, and operating/access space at reachable locations.', 'Repeat two critical dimensions independently; keep both readings and note discrepancies.'],
 ('A width reads47 3/4 in from one pass and47 7/8 in from another. Find disagreement and decide what to do before specifying a tight fit.', 'Disagreement = absolute difference between readings.', '1/8 in. Recheck endpoints, tape alignment, and required clearance; averaging alone does not establish the true fit.'),
 ['Prepare a dimensioned NTS survey or a scale plan with a labeled scale.', 'Use a dimension-string check against a direct overall measurement.', 'Create an unknowns list rather than guessing inaccessible dimensions.'],
 ['Give the survey to another team for a reconstruction on paper.', 'They identify every ambiguous endpoint or missing feature.', 'Revisit the site within teacher-approved access and issue a corrected survey.'],
 ['Critical features can be located from the drawing.', 'Checks and unresolved dimensions are visible.', 'Every student performs and records at least one actual measurement.'],
 'A120-in overall dimension contains38 1/2 in,44 3/4 in, and one missing segment. Find the missing segment. Identify your project’s most important measurement check.',
 '36 3/4 in. Require a specific check tied to a project constraint.',diagram='survey',support='Use separate columns for measured, supplied, and unknown values.',extend='Have a second team recover two real distances from your scaled drawing and verify them on site.')

job(6, 'Design and calculate',
 'A coordinated plan, side view, and individual calculation sheet.', 'Approved survey, graph paper, paper model supplies, calculators.',
 'What two views will let another person understand both footprint and height?',
 ['Review measured constraints and choose dimensions for the proposal.', 'Distinguish specified design dimensions from measured existing conditions.', 'Identify the governing clearance, span, slope, area, or power constraint for your project.'],
 ('An18-in clear opening contains two1/4-in partitions and three equal clear bays. Find each bay width.', 'Clear bay width = (overall clear width − internal partition thicknesses)/bay count.', '(18−1/2)/3=5 5/6 in≈5.833 in. State a practical layout method and resolution rather than silently rounding all bays independently.'),
 ['Each student completes one different project calculation with units and a reasonableness check.', 'Coordinate plan and side view, adding material thickness/allowances where needed.', 'Write dimensions another team needs to reproduce the model.'],
 ['Build a quick paper mockup from the drawing.', 'Use it to detect one conflicting dimension or unclear connection.', 'Revise drawing and calculations together; keep revision labels consistent.'],
 ['Two views agree.', 'Math is traceable to source dimensions and assumptions.', 'Each student explains how their calculation changes a design decision.'],
 'A20-in clear opening contains three1/4-in partitions and four equal clear bays. Find the exact bay width. Name the controlling constraint in your project.',
 '(20−3/4)/4=4 13/16 in. Constraint must connect to actual proposal.',diagram='centers',support='Shade material thickness separately from clear spaces.',extend='Solve one project equation backward from a changed clearance or budget limit.')

job(6, 'Estimate and schedule the work',
 'An itemized estimate, feasible piece plan, and task sequence.', 'Current drawings, paper, calculator; teacher-provided fictional prices or documented real catalog sources.',
 'Which part of your estimate is measured, calculated, assumed, or priced from a source?',
 ['Make a material takeoff from the current drawing, not an older revision.', 'Record unit size, number needed, purchasable quantity, and price source/date.', 'If prices are invented for class, label the entire quote fictional.'],
 ('A job needs five18-in strips. Stock is48 in at$4 each; assume1/8-in kerf per separating cut. Find a feasible purchase count.', 'Check whole parts per stock before multiplying price.', 'Two18-in parts plus cuts fit in one48-in stock. Three stocks supply five parts; cost$12. Total-length division alone would undercount.'),
 ['Draw a cutting/piece plan and calculate waste separately from usable spare.', 'Prepare an itemized total; show any stated tax or contingency separately and explain its basis.', 'Sequence work: verify, prepare, make, inspect, revise. Identify any material or tool dependency.'],
 ['Exchange estimate packages and perform an arithmetic and feasibility audit.', 'Teacher supplies one price, quantity, or dimension change.', 'Issue a revised quote and note its effect on task order or materials.'],
 ['Every quantity traces to a current drawing or stated allowance.', 'Purchase plan can physically supply the parts.', 'Each student recalculates one changed line independently.'],
 'Seven20-in parts are needed from48-in stock at$5 each. Each separating cut uses1/8 in. Find stocks to buy and cost; explain why140/48 rounded upward is not enough.',
 'Two parts per stock, so four stocks,$20. Three stocks can supply only six20-in parts despite aggregate length.',diagram='stock',support='Use paper stock strips to place whole parts before doing cost math.',extend='Add a documented labor-time estimate and distinguish a classroom estimate from a contractor quote.')

job(6, 'Prototype and inspect',
 'A tested model or full-size layout with a signed inspection record.', 'Approved drawings, paper/folder supplies, tape/scissors; additional materials only if arranged.',
 'Which acceptance test would reveal the most serious failure before you spend time on finishing?',
 ['Review the current brief and select at least three tests: fit, position, load path, access, or operation.', 'Write a method and pass criterion for each test before building.', 'Mark which model features represent real scale and which are simplified.'],
 ('A model must fit a24-in zone with1/2-in clearance at both ends. Find maximum outside width.', 'Maximum width = available width − both clearances.', '23 in. This is outside width; interior clear size also depends on material thickness.'),
 ['Prepare a build sequence and divide roles so every student fabricates or lays out part of the model.', 'Predict one weak point and choose how it will be inspected.', 'Calculate any final allowance or material change before cutting.'],
 ['Build from the current package and keep an issue log.', 'Run each planned acceptance test; record readings, observations, and pass/revise decisions.', 'Make one evidence-based revision, or retain a successful dimension with a documented check, then retest.'],
 ['All planned tests have evidence or are explicitly marked not yet performed.', 'Revised model and drawings match.', 'Group success is accompanied by each student’s own calculation and practical contribution.'],
 'A30-in zone needs3/4-in clearance at each end. Find maximum outside width. Explain one test result from your model and what it caused you to change or retain.',
 '28 1/2 in; explanation must cite an observed result and resulting decision.',diagram='template',support='Use a test table: requirement, method, result, decision.',extend='Give another team only the drawings and ask them to repeat one acceptance test.')

job(6, 'Defend and hand over the proposal',
 'A complete project package and individual response to a changed requirement.', 'Brief, survey, drawings, math, estimate, prototype, test/revision record; notebook.',
 'What evidence would make the user trust your proposal enough to consider the next step?',
 ['Lay out the brief, checked survey, current drawings, takeoff/quote, and test record in order.', 'Identify one strong piece of evidence and one remaining uncertainty.', 'Each student selects a measurement, calculation, and revision they can personally explain.'],
 ('A fictional$80 materials estimate increases15% after a change. Find revised total and increase.', 'Increase = original×0.15; revised = original+increase.', '$12 increase; revised$92. A percentage allowance needs a stated reason; it does not replace a revised takeoff.'),
 ['Prepare a three-minute demonstration: need, design, math, evidence, limitation, next step.', 'Check that all pages use the same revision and units.', 'Anticipate a changed dimension, material size, or budget and plan how to re-evaluate it.'],
 ['Present the proposal and demonstrate one acceptance check.', 'Each student independently solves the teacher’s change card before team discussion.', 'Revise the package after feedback and provide a clear recommendation: ready for further planning, revise, or needs more evidence.'],
 ['Package is usable by someone who did not attend the build.', 'Every student defends a calculation and physical decision individually.', 'Unknowns and any unperformed real-system tests remain visible; no installation promise is implied.'],
 'Independently: a proposal costs$120 before a stated10% classroom contingency. Find total. Then name one actual project change that requires new measurements rather than only multiplying the old estimate.',
 '$132. A changed footprint, opening, route, material thickness, or user requirement may require new measurements; answer must connect to the student project. Use the four course evidence dimensions for individual review, not group appearance alone.',diagram='takeoff',support='Allow a labeled diagram and oral rehearsal before the individual explanation.',extend='Create a second feasible alternative and explain the tradeoff in cost, fit, and evidence.')

assert len(JOBS)==36
