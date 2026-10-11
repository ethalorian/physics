"""Job vocabulary authoring source. Repeated words retain one definition.

Each job adds its own practical example. Run build_vocabulary.py to validate
and produce publishable data and the teacher's vocabulary guide.
"""

# term | language tier (2 academic, 3 technical) | focus | student definition
GLOSSARY_TEXT = """
dimension|3|measurement|A measured or specified size, such as length, width, or height.
unit|2|math|A named amount used to express a measurement, such as an inch, foot, or second.
fraction|2|math|A number that expresses parts of a whole; the denominator names the equal parts and the numerator counts them.
resolution|3|measurement|The smallest marked step a measuring tool can show; it does not guarantee the measurement is accurate.
clearance|3|layout|The space intentionally left between a part and another surface so the part can fit or move.
blank|3|fabrication|The starting piece of material before it is folded or shaped into the finished part.
work order|3|communication|Written directions that identify the job, dimensions, materials, and requirements for the person doing the work.
NTS|3|drawing|Not to scale: a drawing whose written dimensions must be used because its drawn lengths are not proportional to the real sizes.
datum|3|measurement|A chosen reference point, line, or surface from which measurements are taken.
survey|3|measurement|A recorded set of observations and measurements describing a site or work area.
endpoint|2|measurement|A point that marks the beginning or end of a measured distance.
dimension string|3|drawing|A chain of labeled distances between successive features on a drawing.
discrepancy|2|inspection|A difference between values or records that are expected to agree.
unit conversion|2|math|Expressing the same quantity in another unit without changing its size.
overall dimension|3|measurement|The full distance between the outside endpoints of an object or layout.
revision|2|communication|An identified change to a drawing, plan, or product that replaces an earlier version.
layout|3|layout|The planned or marked positions of parts, edges, and reference lines before making or placing something.
coordinate|2|math|A number that locates a point relative to a stated origin and direction; a plan often needs two coordinates.
centerline|3|layout|A reference line through the middle of a feature, used to locate or align it.
offset|3|layout|A stated distance and direction from a reference line or point to a feature.
perpendicular|2|math|Meeting at a right angle of 90 degrees.
diagonal|2|math|A line segment joining two corners of a shape that are not next to each other.
Pythagorean theorem|2|math|For a right triangle, the square of the longest side equals the sum of the squares of the other two sides: c² = a² + b².
square (layout)|3|layout|Having the intended right angles; a rectangular layout must be checked against its side lengths and geometry.
area|2|math|The amount of a flat surface, measured in square units; a rectangle has area length × width.
perimeter|2|math|The total distance around the boundary of a flat shape.
square unit|2|math|An area unit equal to a square one unit long and one unit wide, such as in² or ft².
quantity|2|estimating|The count or measured amount of an item needed or purchased.
unit price|3|estimating|The price for one stated unit, such as one sheet or one foot of material.
subtotal|2|math|The total for one item or group before other items, taxes, or fees are added.
cut list|3|fabrication|A list of the finished pieces to make, with each piece's size and quantity.
waste|3|estimating|Material that cannot be used in the planned job, such as cutting loss or unusable scraps.
change order|3|communication|A documented change to the agreed job requirements, including any effects on dimensions, cost, or time.
allowance|3|layout|An amount deliberately included for a stated purpose, such as overlap, cutting loss, or material thickness.
constraint|2|design|A limit the design must satisfy, such as available space, materials, cost, or time.
inside dimension|3|measurement|A distance between the inner faces of a part or opening.
outside dimension|3|measurement|A distance between the outer faces of a part or assembly.
verify|2|inspection|To check a claim, value, or condition against a measurement, calculation, or other evidence.
template|3|fabrication|A pattern used to transfer a shape or feature locations to another piece of material.
recess|3|layout|A space set back within a surface or boundary that another part may fit into.
cutout|3|fabrication|An opening or removed section made to clear a feature or allow access.
fabrication|3|fabrication|Making a part from material by operations such as marking, cutting, folding, and joining.
tolerance|3|inspection|The allowed variation from a specified dimension or value.
fit|3|inspection|How well a part matches its intended space and required clearance.
end margin|3|layout|The distance from an end of a layout to the first or last specified feature.
interval|2|math|The distance or time between consecutive marks, points, or events.
equal spacing|3|layout|Placing successive reference points the same distance apart.
cumulative error|3|measurement|Error that adds up across a sequence of measurements or layout steps.
scale|3|drawing|The stated relationship between a drawing length and the actual length it represents.
scale factor|2|math|The multiplier between corresponding lengths when both lengths use the same unit.
plan view|3|drawing|A drawing showing a space or object as viewed from directly above.
footprint|3|layout|The area or outline an object occupies when viewed from above.
proportion|2|math|An equality between two ratios, used to compare corresponding quantities.
actual dimension|3|measurement|The full-size measurement of the real object or space, rather than its drawing size.
circulation|3|layout|The routes people use to move through a space.
stock|3|fabrication|Material in the starting size available for making parts.
finished length|3|fabrication|The required length of a completed part after cutting and other operations.
kerf|3|fabrication|The width of material removed by a cutting tool, which must be included when planning cuts.
offcut|3|fabrication|A piece left after cutting that may still be usable for another part.
cutting loss|3|fabrication|Material removed by the cuts, separate from usable pieces and remaining offcuts.
decimal|2|math|A way to write numbers using place values based on powers of ten, including positions after a decimal point.
quote|3|estimating|A stated price offer for a described quantity and scope of goods or work.
total cost|2|estimating|The sum of all included costs, with any exclusions stated.
net area|3|math|The area remaining after specified openings or excluded areas are subtracted from the gross area.
assumption|2|design|A condition treated as true for planning or calculation that must be stated and checked when possible.
specification|3|inspection|A written requirement describing what a part, system, or job must be like.
measured value|2|measurement|A number with a unit obtained from a stated measurement method.
signed difference|2|math|A subtraction result that keeps its positive or negative sign; measured minus specified shows the direction of a dimensional error.
absolute difference|2|math|The size of the difference between two values without a positive or negative direction.
acceptable range|2|inspection|The interval of values permitted by the stated limits or tolerance.
rework|3|fabrication|Work done again or corrected because the result did not meet a requirement.
elevation view|3|drawing|A drawing looking straight at a vertical face, showing heights and vertical relationships.
bill of materials|3|estimating|An itemized list of materials and components, including sizes and quantities needed for an assembly.
acceptance criterion|3|inspection|A measurable requirement or stated test used to decide whether the work meets the job's needs.
beam|3|structures|A structural member that carries loads across a span mainly by resisting bending.
cross section|3|drawing|The shape exposed by an imaginary cut across an object, such as the end shape of a folded beam.
load|3|structures|An external force acting on a structure or part, such as the weight of an object placed on it.
support|3|structures|A part or contact that holds a structure and transfers forces from it to another part or surface.
stiffness|3|structures|How strongly a structure resists deformation under load; it is different from the load it can withstand before failure.
capacity|3|structures|The greatest load or demand that meets a stated performance limit under specified conditions.
ratio|2|math|A comparison of two quantities by division, with units and order stated.
controlled variable|2|investigation|A condition deliberately kept the same to make a comparison fair.
span|3|structures|The distance between supports, with the measurement endpoints stated as faces or centerlines.
deflection|3|structures|The change in a part's position caused by loading, measured from its unloaded position.
independent variable|2|investigation|The condition deliberately changed in an investigation.
dependent variable|2|investigation|The response measured to see the effect of a changed condition.
trial|2|investigation|One run of a test using a recorded set of conditions.
graph|2|math|A display that locates data using labeled axes so relationships can be examined.
trend|2|investigation|The general pattern in a set of results, which may include variation.
brace|3|structures|A member added to reduce unwanted movement or deformation of a structure.
triangulation|3|structures|Arranging members into triangles to resist changes of shape when the members and connections hold their lengths.
racking|3|structures|A sideways distortion that changes the angles of a frame, such as a rectangle leaning into a parallelogram.
overlap|3|fabrication|The length or area where one part extends over another to make a connection.
joint|3|fabrication|The place and method by which two or more parts are connected.
displacement|3|measurement|A change in position with its direction stated.
load path|3|structures|The route by which forces pass through connected parts and supports.
reaction force|3|structures|A force a support exerts on the structure it holds.
unsupported length|3|structures|The length of a member between locations that actually provide the relevant support.
bearing area|3|structures|The contact area over which one part transfers a compressive force to another.
pressure|3|math|Normal force per contact area; average pressure = force ÷ area.
force|3|structures|A push or pull that can change motion or deform an object.
newton|3|math|The SI unit of force, written N.
compression|3|structures|A loading action that pushes parts of a material toward one another.
deformation|3|structures|A change in an object's shape or size caused by a load or other action.
inverse relationship|2|math|A relationship in which one quantity decreases as another increases; for constant force, pressure varies as 1 ÷ area.
level|3|measurement|Horizontal: perpendicular to the local direction of gravity.
elevation|3|measurement|The vertical position of a point relative to a chosen reference level.
vertical drop|3|measurement|A downward distance measured vertically from a stated reference.
benchmark|3|measurement|A fixed reference point with an established elevation used to compare other elevations.
horizontal|3|measurement|Along a level direction, perpendicular to local vertical.
plumb|3|measurement|Vertical: aligned with the local direction of gravity.
reference line|3|measurement|A marked or established line used as the basis for locating or measuring other features.
slope|3|math|Vertical rise or fall divided by horizontal run, with the direction and units stated.
run|3|measurement|The horizontal distance used in a slope calculation, rather than the length along the inclined surface.
fall|3|measurement|The decrease in elevation from the start of a route to its end.
percent slope|3|math|Vertical change ÷ horizontal run × 100%, using the same length unit for both distances.
invert elevation|3|measurement|The elevation of the inside bottom of a pipe or channel at a stated point.
sag|3|inspection|A local downward bend or low spot below the intended route or shape.
route|3|layout|The planned path followed by a service, material, or moving object.
service bay|3|layout|A defined space allocated to systems and their supports, clearances, and access.
crossing|3|layout|A location where two routes pass across one another in plan and their vertical separation must be checked.
depth budget|3|math|An accounting of the available vertical depth and all the layers, gaps, and allowances that use it.
thickness|3|measurement|The distance between the two opposite faces of a material layer or part.
coordination|2|design|Checking that related drawings, dimensions, components, and routes work together without conflict.
remaining allowance|3|math|The amount left after all stated requirements have been subtracted from an available dimension or budget.
finish layer|3|layout|The final surface material, whose thickness can change the space available for a route or part.
obstruction|3|layout|A feature that blocks or limits the proposed route, space, or access.
flow rate|3|math|The volume of fluid passing a point or collected per unit time, such as mL/s.
volume|2|math|The amount of three-dimensional space occupied or contained, measured in cubic units or units such as milliliters.
elapsed time|2|math|The amount of time between a stated start and finish.
constant rate|2|math|A rate that stays the same throughout the interval being considered.
mean|2|math|The arithmetic average: add the values and divide by the number of values.
uncertainty|2|measurement|The doubt or range associated with a measurement because tools and methods cannot give an exact value.
thermal envelope|3|thermal|The parts of an enclosure that separate its inside from outside and affect heat transfer, such as walls, roof, and openings.
gross area|3|math|The full area before openings or other excluded areas are subtracted.
opening|3|layout|A gap in a surface, such as a window or door space, that must be accounted for in the design.
takeoff|3|estimating|Counting and measuring the material quantities needed from drawings or a surveyed job.
lower bound|2|math|A value that the required amount cannot be below, even though practical constraints may require more.
round up|2|math|To use the next whole purchasable quantity when a calculation gives a partial item.
temperature|3|thermal|A measure of how hot or cold a body is, expressed on a stated scale such as degrees Celsius.
heat transfer|3|thermal|Energy moving from a warmer region to a cooler region because of a temperature difference.
temperature change|3|math|Final temperature minus initial temperature; a temperature drop can instead be reported as a positive magnitude.
time interval|2|math|The duration between two specified times.
average rate|2|math|The total change in a quantity divided by the time interval over which it occurred.
insulation|3|thermal|Material used to slow heat transfer through an assembly.
conduction|3|thermal|Heat transfer through a material or contact between materials without bulk motion of the material.
convection|3|thermal|Heat transfer between a surface and a moving fluid such as air or water.
thermal path|3|thermal|A route through which energy can transfer between warmer and cooler parts of a system.
percent reduction|2|math|The decrease divided by the original value, multiplied by 100%.
baseline|2|investigation|The original or reference result used for comparison with a changed design or condition.
retest|2|investigation|A new test after a change, using stated conditions so the results can be compared.
circuit|3|electrical|An arrangement of connected electrical components; sustained current requires a complete conducting path through a source and load.
voltage|3|electrical|Electric potential difference: energy transferred per unit charge between two points, measured in volts (V).
current|3|electrical|The rate of flow of electric charge, measured in amperes (A).
resistance|3|electrical|A measure of opposition to current, expressed in ohms (Ω); for a resistor model, R = V ÷ I.
switch|3|electrical|A component that opens or closes a conducting path in a circuit.
open circuit|3|electrical|A circuit with a break that prevents sustained current through that path.
closed circuit|3|electrical|A circuit with a complete conducting path through the source and load.
Ohm's law|3|electrical|The relationship V = I × R for an ohmic component under constant physical conditions such as temperature.
series circuit|3|electrical|A circuit arrangement with components along one path, so the same current passes through each component.
parallel circuit|3|electrical|A circuit arrangement with branches connected across the same two points, so each branch has the same voltage across it.
branch|3|electrical|One path for current between junctions in a circuit.
total current|3|electrical|The current before a set of branches splits, equal to the sum of their currents at that junction.
equivalent resistance|3|electrical|The single resistance that would draw the same total current at the same applied voltage as a resistor network.
junction|3|electrical|A connection where circuit paths meet and current can divide or combine.
fault|3|electrical|A condition that prevents a system from operating as intended.
diagnosis|3|inspection|Identifying a problem's cause by following evidence from inspection and tests.
hypothesis|2|investigation|A testable proposed explanation for an observation or problem.
continuity|3|electrical|An unbroken conducting path between stated points; continuity alone does not prove that a circuit will operate correctly.
test point|3|electrical|A specified location in a circuit where an observation or measurement is made.
evidence|2|investigation|Recorded observations, measurements, or results used to support a claim.
repair|3|fabrication|A correction intended to restore a part or system to its required operation.
power|3|electrical|The rate at which energy is transferred or converted, measured in watts (W).
energy|3|electrical|An amount transferred or converted by a system; electrical use may be counted in joules, watt-hours, or kilowatt-hours.
watt|3|math|The unit of power, written W; one watt equals one joule per second.
watt-hour|3|math|The energy transferred by one watt operating for one hour; written Wh.
kilowatt-hour|3|math|An energy unit equal to 1,000 watt-hours, written kWh.
operating time|3|math|The duration for which a device is in use under the stated conditions.
tariff|3|estimating|A stated price schedule; a classroom electricity calculation may use a fictional price per kWh.
rating|3|electrical|A stated operating value or limit for a component, valid under specified conditions.
enclosure|3|fabrication|A surrounding structure that contains or protects parts of a system.
access|3|design|The space or opening needed to reach a part for operation, inspection, or maintenance.
surface area|2|math|The sum of the areas of the specified faces of a three-dimensional object.
prototype|3|design|A trial version or model used to check a design before committing to a final product.
test plan|3|inspection|A written method that states what to test, the conditions, what to record, and how to judge the result.
design brief|3|communication|A short statement of the user, need, intended product, constraints, and success criteria for a project.
user need|2|design|A practical problem or requirement experienced by the person who will use the result.
scope|3|communication|The work and deliverables included in a project, with its limits stated.
feasibility|2|design|Whether a proposal can meet its requirements with the available space, resources, and methods.
unknown|2|design|Information still needed before a claim or decision can be verified.
proposal|3|communication|A documented suggested solution with its supporting calculations, evidence, costs, and next steps.
partition|3|layout|A dividing part between spaces whose thickness reduces the clear space available.
clear dimension|3|measurement|The unobstructed distance available between the faces that bound a usable space.
reasonableness check|2|math|A quick estimate, comparison, or unit check used to see whether a calculated result makes sense.
itemized estimate|3|estimating|A predicted cost broken into named items with quantities, unit prices, and subtotals.
contingency|3|estimating|A stated allowance for identified uncertainty in a cost or time estimate.
dependency|3|planning|A task, material, or decision that must be ready before another activity can proceed.
sequence|2|planning|The planned order of steps in a job.
inspection|3|inspection|A deliberate check of the work against its stated requirements.
inspection record|3|inspection|A dated record of requirements, observations, results, and any needed corrections.
handover|3|communication|The transfer of a completed work package and its essential information to the next person or user.
traceability|3|communication|The ability to follow a result or decision back to its source measurement, calculation, drawing, or test.
limitation|2|investigation|A boundary on what a method, model, or result can establish.
percent increase|2|math|The increase divided by the original value, multiplied by 100%.
recommendation|2|communication|A proposed next action supported by stated reasons and evidence.
"""

GLOSSARY = {}
for line in GLOSSARY_TEXT.strip().splitlines():
    term, tier, category, definition = line.split('|')
    assert term not in GLOSSARY, term
    GLOSSARY[term] = dict(term=term, tier=int(tier), category=category, definition=definition)

# Every entry is a term plus a job-specific example, in teaching order.
JOB_WORDS = []

def job(text):
    entries = [line.split('|', 1) for line in text.strip().splitlines()]
    assert len(entries) == 8, (len(JOB_WORDS) + 1, len(entries))
    JOB_WORDS.append(entries)

job("""
dimension|Label the tray's base length, base width, and wall height as separate dimensions.
unit|Write 5 1/2 in, not just 5 1/2, so your partner knows which unit to use.
fraction|A clearance of 1/8 in on each side adds 2/8 in, or 1/4 in, to a notebook dimension.
resolution|A tape with sixteenth-inch marks has a marked resolution of 1/16 in; check alignment before trusting the reading.
clearance|Add two 1/8-in clearances to the notebook width to find the tray's inside base width.
blank|For the model tray, a 5 3/4-in base plus two 3/4-in walls needs a 7 1/4-in blank length.
work order|Your partner builds the tray from a work order showing base size, blank size, wall height, and units.
NTS|Mark your notebook sketch NTS and write the dimensions the builder must follow.
""")
job("""
datum|Name corner A as the datum and locate three school-zone features from it.
survey|Your survey includes a sketch, checked dimensions, and the positions of three features.
endpoint|Record whether the tape ends at a desk edge or its center; those endpoints give different lengths.
dimension string|Add three consecutive wall segments and compare their sum with the overall wall measurement.
discrepancy|If the segment sum is 75 in but the direct measurement is 74 3/4 in, investigate the 1/4-in discrepancy.
unit conversion|Convert 3 ft 4 in to 40 in before adding it to another length in inches.
overall dimension|Measure the zone from its first boundary to its last boundary as one overall dimension.
revision|After checking an unclear endpoint, date the drawing and label the corrected version revision B.
""")
job("""
layout|Lay out the work area's boundaries and fixture locations before placing the paper equipment.
coordinate|In the 36 × 48 in model, the center is 18 in in one direction and 24 in in the other from the datum.
centerline|Mark the work area's middle line so both fixture points share one centerline.
offset|Locate a fixture 12 in inward from the short end and state the reference edge.
perpendicular|The two directions used for the rectangular work-area coordinates meet at 90 degrees.
diagonal|Measure from one corner to the opposite corner, then check the other diagonal.
Pythagorean theorem|For the 36 × 48 in rectangle, the ideal diagonal is √(36² + 48²) = 60 in.
square (layout)|Check side lengths and corner geometry before calling the work-area layout square; one correct diagonal is insufficient.
""")
job("""
area|The model 4 × 6 ft display has 24 ft² of surface to cover.
perimeter|The same display needs 2 × 4 + 2 × 6 = 20 ft of border before cutting allowances.
square unit|Panel coverage is recorded in ft²; border length is recorded in ft.
quantity|A feasible layout uses four 2 × 3 ft panels to cover the model display.
unit price|At the fictional unit price of $4 per panel, each additional panel adds $4.
subtotal|Four panels at $4 each give a panel subtotal of $16 before adding the border.
cut list|List two 6-ft border pieces and two 4-ft border pieces before deciding how much stock to buy.
waste|Keep usable border offcuts separate from material that cannot serve this display job.
""")
job("""
change order|The owner requests an extra 1/8 in of clearance on every side; record that change before rebuilding.
revision|Highlight the changed tray dimensions on revision B while retaining the unchanged wall height.
allowance|Include both 3/4-in wall allowances when recalculating each blank dimension.
clearance|Increasing the gap by 1/8 in on both sides increases the base dimension by 1/4 in.
constraint|The revised blank must fit the available paper or have a planned joined-sheet construction.
inside dimension|The model's inside base grows from 5 3/4 × 3 3/4 in to 6 × 4 in.
outside dimension|The finished tray's outside size includes its wall material; do not confuse it with the flat blank size.
verify|Check the new blank dimensions and test the revised fit before accepting the change.
""")
job("""
template|Make a paper pattern another student can use to reproduce the replacement liner.
recess|Measure the inside edges of the space where the replacement liner must sit.
clearance|For a 12-in recess with a 1/8-in gap at both edges, make the liner 11 3/4 in wide.
datum|Locate the liner's cutout from the same reference corner used in the survey.
cutout|Remove only the section needed to clear a measured feature in the recess.
fabrication|Mark, cut, and check the paper liner using the dimensions on your work order.
tolerance|State the permitted dimensional variation before deciding whether the replacement matches the specification.
fit|Place the template in the recess and check the intended gap along every edge.
""")
job("""
centerline|Mark each of the five mounting positions at its center, not at the edge of a hypothetical fastener.
end margin|Leave 3 in from each end of the 30-in strip to the first and last mounting centers.
interval|Five centers create four intervals between the first center and the last.
equal spacing|The usable 24-in distance divided into four intervals gives 6-in spacing.
coordinate|Record the centers as 3, 9, 15, 21, and 27 in from the datum.
datum|Take every mounting coordinate from the same starting end of the strip.
tolerance|Check the mounting marks against the classroom requirement of ±1/8 in.
cumulative error|Repeatedly measuring from the last mark can carry earlier mistakes forward; check every mark from the datum.
""")
job("""
scale|At 1 in = 2 ft, a 12-ft wall is drawn 6 in long.
scale factor|Because 2 ft = 24 in, the drawing-to-actual scale factor is 1/24.
plan view|Show the zone boundaries and equipment as seen from above.
footprint|A 4 × 2 ft desk has a 2 × 1 in paper footprint at the chosen scale.
proportion|The proportion 1 drawing inch / 2 actual feet = 3 drawing inches / 6 actual feet keeps the scale consistent.
actual dimension|Label the real desk width as 2 ft even though its paper width is only 1 in.
dimension|Write the actual length and width next to each paper equipment piece.
circulation|Use the plan to keep the teacher-defined model walking route clear of equipment footprints.
""")
job("""
stock|Start the cutting plan with one 48-in stock strip.
finished length|Each completed model part must be 11 3/4 in long, excluding the cutting loss.
kerf|Represent each separating cut with a 1/8-in strip of lost material in the paper plan.
cut list|The job's cut list calls for four parts, each 11 3/4 in long.
offcut|After four parts and four cuts, a 1/2-in piece of stock remains; decide whether it is useful.
cutting loss|Four cuts at 1/8 in each remove 1/2 in of stock in the model.
decimal|Write 11 3/4 in as 11.75 in to check the stock calculation using decimals.
fraction|Four 11 3/4-in parts total 47 in before adding the four cutting allowances.
""")
job("""
quote|Write two offers that state panel size, quantity, price, and the costs excluded from the comparison.
unit price|Supplier A's fictional $7 per panel is a unit price; panel sizes must also be compared.
quantity|A feasible layout needs six panels from A or four from B in the supplied model.
subtotal|Six panels at $7 produce a $42 material subtotal for option A.
total cost|The classroom comparison is $42 versus $44, excluding tax, delivery, and labor.
net area|With no excluded openings, the 6 × 8 ft job needs 48 ft² of coverage.
waste|Calculate purchased area minus covered area, then distinguish unusable scraps from reusable offcuts.
assumption|State the model's assumption that the panel sizes tile the surface without cutting loss.
""")
job("""
specification|The inspected length is specified as 40 in with a classroom tolerance of ±1/4 in.
measured value|Record the actual tape reading of 40 3/8 in before judging whether it passes.
signed difference|Measured minus specified is 40 3/8 − 40 = +3/8 in, showing the layout is too long.
absolute difference|The magnitude of a −1/8-in signed difference is 1/8 in.
tolerance|The permitted variation is 1/4 in shorter or longer than the specified 40 in.
acceptable range|The acceptable interval is 39 3/4 to 40 1/4 in, including the endpoints.
discrepancy|Compare all inspection readings to identify which location or dimension disagrees with the plan.
rework|Correct the dimension that failed, then measure again before marking it accepted.
""")
job("""
work order|Give another group the drawings, material requirements, and checks needed to make the divider model.
plan view|Show the two divider centerlines at 6 and 12 in in the 18-in zero-thickness model.
elevation view|Show the selected divider height in a view of its vertical face.
bill of materials|List paper sheets and tape segments with their sizes, quantities, and simulated prices.
cut list|List each divider and base piece separately so a builder knows what to cut.
allowance|State that real divider thickness reduces the clear bay width even when centerlines stay 6 in apart.
revision|Make sure the estimate and both drawings refer to the same version of the divider design.
acceptance criterion|One criterion is that a partner can locate both divider centers from your drawing without guessing.
""")
job("""
beam|The paper member bridges two supports and carries the small test objects.
cross section|Compare the flat paper's end shape with the folded beam's end shape.
load|Identical erasers apply loads through their weight; an eraser count is not a measured force in newtons.
support|Keep the two supporting surfaces in the same positions for both beam shapes.
stiffness|Compare bending under the same load to investigate how the fold changes resistance to deformation.
capacity|Record the count at the agreed test limit for each beam; state the limit used.
ratio|A folded beam reaching 8 erasers versus 2 for the flat beam has a capacity-count ratio of 4 to 1 in that test.
controlled variable|Use the same paper allowance, support spacing, and loading method when comparing shapes.
""")
job("""
span|Change the stated distance between the beam supports while keeping the beam shape the same.
deflection|A midspan height changing from 2 in to 1 3/4 in gives 1/4 in of downward deflection.
independent variable|Support spacing is the condition you deliberately change in this test.
dependent variable|Midspan deflection is the response you measure at each span.
controlled variable|Keep the load, paper, beam shape, and load location the same across span comparisons.
trial|Record each run and identify whether it used a fresh specimen or a previously loaded one.
graph|Put span in inches on the horizontal axis and deflection in inches on the vertical axis.
trend|Describe the span–deflection pattern shown by your results without hiding readings that vary.
""")
job("""
brace|Add a diagonal paper member to reduce the frame's sideways distortion.
diagonal|The brace runs between opposite corner reference points of the frame.
triangulation|The diagonal divides the rectangular frame into triangles when its joints hold.
racking|Observe how the unbraced rectangular frame changes into a slanted shape under sideways movement.
overlap|Add the measured attachment length at both ends beyond the corner-to-corner brace distance.
joint|Inspect the taped brace connections because a loose joint can let the frame move.
Pythagorean theorem|A 6 × 8 in right-angle frame has a 10-in corner-to-corner distance before attachment allowances.
displacement|Apply the same initial sideways displacement when comparing the braced and unbraced frames.
""")
job("""
support|Place five supports under the paper member at the planned positions.
span|The 0-to-24-in model has four 6-in spans between support centerlines.
centerline|Locate each support by its middle rather than switching between edges and centers.
interval|Divide 24 in by four intervals, not by the five support points.
load path|Draw arrows showing how the applied load passes through the member to the supports.
reaction force|A support pushes back on the loaded member; the forces need not be equal at every support.
unsupported length|Removing a support can increase the length that must bridge without support.
coordinate|Label support positions 0, 6, 12, 18, and 24 in from one datum.
""")
job("""
bearing area|Calculate the area of each paper foot where it touches the pad.
pressure|In the supplied model, 12 N on 2 cm² gives an average pressure of 6 N/cm².
force|Keep the same applied load when comparing the effects of different foot areas.
newton|Use N only for a supplied or measured force; do not relabel an unknown object count as newtons.
compression|The support foot pushes into the pad and compresses it.
deformation|Record the pad's indentation or change in shape as an observation, not as a direct pressure reading.
inverse relationship|At a fixed 12 N, increasing contact area from 2 to 6 cm² reduces average pressure from 6 to 2 N/cm².
square unit|A 2 cm by 3 cm foot has a bearing area of 6 cm².
""")
job("""
level|Verify the reference is horizontal before comparing the two vertical drops.
elevation|Compare the points' vertical positions relative to the same checked reference.
vertical drop|A point 3 1/4 in below the line has a greater drop than a point 2 in below it.
benchmark|Use a fixed point on the checked level reference as the project's elevation reference.
horizontal|The reference line must be horizontal; a straight but sloping line is unsuitable.
plumb|Measure each drop vertically rather than along a tilted tape.
reference line|Keep the same line for both readings so the difference has a valid basis.
absolute difference|The two supplied drops differ by 1 1/4 in; also name which point is lower.
""")
job("""
slope|The model route falls 1/4 in for each foot of horizontal run.
run|Use 6 ft of horizontal distance, or 72 in, for the slope denominator.
fall|At 1/4 in per foot over 6 ft, total endpoint fall is 1 1/2 in.
percent slope|The supplied route has 1.5/72 × 100% ≈ 2.08% slope.
elevation|Mark the route's end elevation 1 1/2 in below its start in the supplied model.
elevation view|Use a side view to show the route's heights as well as its horizontal distance.
scale|If the side view enlarges vertical distances, label both the vertical and horizontal scales.
sag|Inspect for a local low spot; correct endpoint fall does not rule out a sag along the route.
""")
job("""
route|Draw the two dry model service paths before constructing their crossing.
service bay|Keep both routes, their thicknesses, and the required gap inside the 6-in-deep model bay.
crossing|Check the point where the two routes overlap in plan using a matching side view.
clearance|Include the specified 1/2-in gap between the two model routes.
depth budget|The 1-in route, 1/2-in gap, and 1 1/2-in route occupy 3 in of depth.
thickness|Include each route's full thickness when locating its top and bottom surfaces.
plan view|Use the overhead view to locate where the routes cross.
coordination|Make sure the route order and positions agree in the plan, side view, and model.
""")
job("""
depth budget|Subtract every occupied layer and gap from the supplied 8-in total depth.
remaining allowance|The original model has 1 1/2 in left; a 3/4-in thicker finish leaves 3/4 in.
finish layer|Show how the changed finish thickness shifts the space available to the routes.
obstruction|Mark a fixed obstruction so the revised route is checked at the conflict location.
allowance|List support, bend, gap, and route allowances separately so none is omitted or counted twice.
revision|Update the depth calculation and drawing together after the finish change.
constraint|A positive overall spare depth does not prove that every local crossing fits.
signed difference|Compute revised spare minus original spare to show that available depth decreased by 3/4 in.
""")
job("""
flow rate|A supplied collection of 240 mL in 12 s has a flow rate of 20 mL/s.
volume|Record how many milliliters are collected, using the actual reading or a clearly labeled supplied value.
elapsed time|Measure from the stated start of collection to its finish.
constant rate|Predicting 600 mL in 30 s assumes the 20 mL/s rate remains unchanged.
controlled variable|Keep the starting reservoir level and timing method comparable when changing the outlet condition.
trial|Repeat the collection and record each volume and time, instead of keeping only the best result.
mean|For equal-duration trials with rates 20, 19, and 21 mL/s, the mean rate is 20 mL/s.
uncertainty|Identify how reaction time or a hard-to-read volume mark affects confidence in the rate.
""")
job("""
thermal envelope|Identify the model wall and opening that separate the room's inside from its surroundings.
gross area|The supplied wall's full area is 96 ft² before subtracting the opening.
opening|The model has a 12-ft² opening that is excluded from the wall covering estimate.
net area|Subtract 12 ft² from 96 ft² to find 84 ft² of wall covering.
takeoff|Use the wall drawing to list covering areas and the resulting sheet quantities.
lower bound|Area alone gives a minimum of 11 sheets at 8 ft² each; a feasible cut layout may require more.
round up|A result of 10.5 sheets requires at least 11 whole sheets for purchase.
unit price|At the fictional $6 per sheet, an 11-sheet material subtotal is $66 before other costs.
""")
job("""
temperature|Record the cup's temperature in °C at each stated time.
heat transfer|The warmer cup transfers energy to its cooler surroundings during the comparison.
temperature change|A change from 40°C to 34°C is −6°C, or a temperature drop of 6°C.
time interval|Compare both arrangements over the same 10-minute interval.
average rate|A 6°C drop over 10 min is an average cooling magnitude of 0.6°C/min.
controlled variable|Keep water amount, starting temperature, and location comparable between cup arrangements.
insulation|Compare a wrap intended to slow heat transfer with the reference arrangement.
graph|Plot temperature against time and label any supplied dataset as supplied rather than measured by you.
""")
job("""
thermal path|Mark possible energy-transfer routes through the sides, lid, and base before changing one.
conduction|A wrap changes the material path through which heat can conduct from the cup toward its surroundings.
convection|Air moving near the cup surface can affect heat transfer, so keep the test location comparable.
insulation|More wrapping uses more material; test whether the revised arrangement reduces cooling under the same conditions.
percent reduction|A drop reduced from 8°C to 6°C is 2/8 × 100% = 25% smaller than the original drop.
baseline|Use the original wrap's result as the comparison point for the revised design.
controlled variable|Hold the water volume, initial temperature, location, and test interval the same.
retest|Test the revised wrap under the original conditions and report an inconclusive result honestly if necessary.
""")
job("""
circuit|Trace a complete path from one source terminal through the switch and lamp to the other terminal.
voltage|The supplied resistor example has 6 V across its load.
current|The model calculation predicts 0.20 A through a 30-Ω resistor at 6 V.
resistance|The supplied 30-Ω resistor model is not a claim that a real warming lamp has constant resistance.
switch|Place the switch so opening it interrupts the intended lamp path.
open circuit|When the switch opens, the break stops sustained current through the lamp path.
closed circuit|With the switch closed and every connection complete, the source and lamp form a closed path.
Ohm's law|Use I = V/R to calculate 6 V / 30 Ω = 0.20 A for the supplied resistor case.
""")
job("""
series circuit|Two supplied 12-Ω resistors in one path have an equivalent resistance of 24 Ω.
parallel circuit|Two resistor branches connected across the same 6-V source each have 6 V across them.
branch|Trace each complete path separately in the parallel drawing.
total current|Two supplied parallel branches carrying 0.5 A each draw 1 A in total from the ideal source.
equivalent resistance|The two 12-Ω resistors together are 24 Ω in series or 6 Ω in parallel in the ideal model.
voltage|Label the voltage across each parallel branch rather than dividing 6 V between those branches.
current|In the supplied series case, 6 V / 24 Ω = 0.25 A through both resistors.
junction|At the parallel split, the incoming current equals the sum of the two outgoing branch currents.
""")
job("""
fault|An open switch or a broken lead can prevent the model lamp from operating.
diagnosis|Follow a recorded sequence of inspection and approved tests to identify which condition caused the failure.
hypothesis|Predict that the lead is disconnected, then name an observation that would support or reject that explanation.
continuity|Trace whether the intended path is unbroken; use a continuity meter only on a de-energized circuit as demonstrated.
open circuit|Mark the break on the faulty paper diagram and explain which path it interrupts.
test point|State which two locations an approved voltage measurement would compare.
evidence|Record what you actually observed before choosing the next diagnostic action.
resistance|At the supplied 6 V, changing the resistor model from 30 Ω to 60 Ω reduces predicted current from 0.20 A to 0.10 A.
""")
job("""
power|A supplied 6-V load drawing 0.25 A converts energy at 6 × 0.25 = 1.5 W.
energy|Using the 1.5-W load for 2 h transfers 3 Wh of energy.
watt|Label 1.5 W as power, not as the total energy used during the session.
watt-hour|Multiply watts by hours: 1.5 W × 2 h = 3 Wh.
kilowatt-hour|Divide 3 Wh by 1,000 to obtain 0.003 kWh.
operating time|Reducing the hours used reduces the energy estimate when the power stays the same.
tariff|At the fictional $0.20/kWh rate, 0.003 kWh costs $0.0006 for energy alone.
rating|Label the supplied voltage and current values as stated operating data rather than student measurements.
""")
job("""
enclosure|Build a paper base and four walls around the proposed low-voltage service route.
access|Demonstrate that the chosen opening lets a person reach the model component without tearing the enclosure.
surface area|A 12 × 8 in base with four 4-in-high walls has 256 in² of area before tabs or cutting waste.
bill of materials|List the enclosure pieces and the proposed circuit parts separately with quantities.
clearance|Show the stated gaps between the enclosure walls and the service route.
coordination|Check that the route, removable opening, drawings, and material estimate describe the same design.
prototype|Use the paper model to check fit and access before requesting hardware.
test plan|Name the access and fit checks, plus a future operating test if electrical hardware is unavailable.
""")
job("""
design brief|Write the school user, observed problem, proposed product, constraints, and three checkable requirements.
user need|Describe the actual difficulty the school user experiences before suggesting a storage solution.
scope|State that this project delivers a proposal and model, with any installation requiring separate school arrangements.
constraint|The supplied storage model has only 48 in of available width.
acceptance criterion|Require the three model bins and their stated gaps to fit within the measured zone.
feasibility|Check that three 14-in bins plus two 2-in gaps use 46 in of the available 48 in.
unknown|List any unmeasured outside margins or user requirements that could change the layout.
proposal|Support the suggested improvement with its brief, early dimension check, and planned next measurements.
""")
job("""
survey|Record the proposal site's actual boundaries, features, sources, and checked dimensions.
datum|Use one fixed corner or reference line to locate all critical features.
endpoint|Make both surveyors measure between the same named faces before comparing their readings.
resolution|Record the tape's smallest marked increment alongside the critical fit measurements.
absolute difference|Readings of 47 3/4 in and 47 7/8 in differ by 1/8 in.
dimension string|Check the sum of successive feature distances against one direct overall measurement.
discrepancy|Investigate a disagreement in endpoints or alignment before specifying a tight fit.
unknown|Mark an inaccessible dimension as unresolved rather than inventing a survey value.
""")
job("""
plan view|Locate the bays, partitions, and outside boundaries in the top view.
elevation view|Show the same parts' heights in the side view and check that the views agree.
partition|Account for two 1/4-in-thick dividers inside the supplied 18-in clear opening.
clear dimension|After subtracting 1/2 in of partitions, 17 1/2 in remains for the three clear bays.
allowance|Show each required gap or material thickness once in the dimension calculation.
fraction|Dividing 17 1/2 in among three bays gives 5 5/6 in per bay before choosing a practical layout method.
constraint|A layout rounded independently in each bay must still fit the overall opening.
reasonableness check|The bay width should be slightly less than 6 in because the partitions occupy some of the 18 in.
""")
job("""
itemized estimate|List every purchased material with size, quantity, unit price, and subtotal.
stock|Use the supplied 48-in lengths as the starting material for five 18-in strips.
kerf|Include 1/8 in of cutting loss for each separating cut in the stock plan.
quantity|A feasible plan requires three stock lengths because each supplies only two 18-in strips.
unit price|At the fictional $4 per stock length, three lengths cost $12 before other charges.
contingency|If you add an uncertainty allowance, state its reason and calculation separately from the material takeoff.
dependency|The cutting task depends on verified dimensions and available stock.
sequence|Plan the order: verify, prepare, make, inspect, and revise.
""")
job("""
prototype|Make a model or full-size layout to check the proposal's most important requirements.
inspection|Compare the completed model with every acceptance criterion in the plan.
acceptance criterion|The supplied fit requirement leaves 1/2 in clear at each end of a 24-in zone.
clearance|Subtract both 1/2-in gaps to find a maximum outside model width of 23 in.
outside dimension|Measure between the model's outer faces when checking its 23-in maximum width.
evidence|Record the measured fit and observed test result, including any test not yet performed.
revision|Update both the model and its drawing when a test leads to a change.
retest|Repeat the affected check after the revision and record the new result.
""")
job("""
handover|Give the next person the brief, drawings, estimate, test record, revisions, and unresolved questions.
traceability|Show which site measurement and calculation support a dimension in the final drawing.
evidence|Support a design claim with a recorded inspection or test result from the project.
limitation|Explain which real-system tests were not performed on the paper prototype.
change order|Respond to a new requirement by identifying the drawings, calculations, and costs that need revision.
percent increase|A 15% increase on a fictional $80 estimate adds $12 and gives a revised total of $92.
revision|Check that every page in the handover package carries the current version.
recommendation|State the next action needed to move the proposal forward and explain what evidence supports it.
""")
