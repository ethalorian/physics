import type { LessonContent } from './lesson-contract'
export const fluidLessons = {
  "pressure": {
    "title": "Pressure",
    "heading": "Pressure describes how a force is spread over area.",
    "subtitle": "Relate fluid pressure to perpendicular surface force.",
    "target": "Relate fluid pressure to perpendicular surface force.",
    "visual": "pressure",
    "paragraphs": [
      "Pressure is perpendicular force per unit area: P = F⊥/A for uniform pressure on a flat surface. The SI unit is the pascal, one newton per square meter. A small force concentrated on a tiny area can produce greater pressure than a much larger force spread over a broad area.",
      "In a fluid at rest, pressure at a point acts equally in all directions. The force on a particular surface acts perpendicular to that surface. Pressure itself is a scalar; the surface orientation determines the force direction. Horizontal, vertical, and tilted walls can therefore all experience pressure forces without the fluid being a solid block pressing only downward.",
      "To calculate the net force on a thin panel with fluid on both sides, compare pressures. For uniform pressures, the net perpendicular force is (P₁ − P₂)A. Large absolute pressures can nearly cancel. A window exposed to nearly the same atmospheric pressure inside and outside does not experience the full atmospheric force as an unbalanced load.",
      "If pressure varies over a large surface, dividing the surface into small patches or using an appropriate average is necessary. The adjustable contact model illustrates uniform force over area. Extend it to a fluid by including all contacted surfaces and remembering that pressure can change from one location to another, especially with depth."
    ],
    "terms": [
      [
        "Pressure",
        "Perpendicular force per unit area, measured in pascals."
      ],
      [
        "Pascal",
        "One newton per square meter."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A panel of area 0.020 m² has a 5000 Pa pressure difference across it. Find the net force magnitude.",
      "reasoning": "F = ΔPA = 5000 × 0.020 = 100 N. The force points from higher pressure toward lower pressure."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Doubling area at the same uniform pressure difference changes net force by a factor of…",
      "options": [
        "1/2.",
        "1.",
        "2."
      ],
      "correct": 2,
      "hint": "Use F = ΔPA.",
      "feedback": [
        "That would apply to pressure if force were held fixed.",
        "The pressure is fixed, not the force.",
        "Correct. Twice the area gives twice the force."
      ],
      "teacher": "Ask students to distinguish a force arrow from a scalar pressure value."
    }
  },
  "depth": {
    "title": "Pressure and depth",
    "heading": "Deeper fluid supports more fluid above it.",
    "subtitle": "Use P = Psurface + ρgh and distinguish gauge from absolute pressure.",
    "target": "Use P = Psurface + ρgh and distinguish gauge from absolute pressure.",
    "visual": "pressure-depth",
    "paragraphs": [
      "A stationary column of fluid must support its own weight. Compare a small horizontal slice with fluid above and below it: the upward pressure force below must exceed the downward pressure force above by the slice’s weight. Pressure therefore increases with depth in a fluid at rest under gravity.",
      "For nearly constant density, P = Psurface + ρgh, where h is vertical depth below the reference surface. The increase ρgh depends on depth, density, and gravitational field strength. It does not depend directly on the container’s width or total fluid volume. Connected points at the same height in the same stationary fluid have the same pressure.",
      "In an open tank, Psurface is atmospheric pressure. The gauge pressure relative to that atmosphere is ρgh, while absolute pressure includes the atmospheric contribution. Doubling depth doubles this gauge contribution, not the full absolute pressure. Mixing the two definitions is a common source of apparently inconsistent answers.",
      "The constant-density equation works especially well for modest depths in liquids. Over large heights in the atmosphere, air density changes substantially, so one must account for its variation. Sloping container walls can support part of the fluid weight, explaining why the bottom force need not equal the entire fluid weight in every container shape."
    ],
    "terms": [
      [
        "Hydrostatic pressure",
        "Pressure distribution in a fluid at rest under gravity."
      ],
      [
        "Gauge pressure",
        "Pressure relative to a chosen surrounding atmospheric pressure."
      ],
      [
        "Absolute pressure",
        "Pressure referenced to vacuum."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Find water’s gauge pressure at 2.0 m depth using ρ = 1000 kg/m³ and g = 9.8 m/s².",
      "reasoning": "ρgh = 19,600 Pa = 19.6 kPa. With surface pressure 101.3 kPa, absolute pressure is 120.9 kPa."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At equal depths in two open tanks of the same liquid, pressure is…",
      "options": [
        "larger in the wider tank.",
        "the same.",
        "larger in the narrower tank."
      ],
      "correct": 1,
      "hint": "The formula uses vertical depth, not tank volume.",
      "feedback": [
        "Width can change total force, but not pressure at equal depth.",
        "Correct, with the same surface pressure and gravity.",
        "Narrowness alone does not raise hydrostatic pressure."
      ],
      "teacher": "Require absolute or gauge labels beside every reported pressure."
    }
  },
  "buoyancy": {
    "title": "Buoyancy",
    "heading": "The lower surface receives the larger pressure force.",
    "subtitle": "Explain the net upward pressure force on an immersed body.",
    "target": "Explain the net upward pressure force on an immersed body.",
    "visual": "buoyancy-lab",
    "paragraphs": [
      "A submerged object is pushed by surrounding fluid on every contacted surface. Pressure on its lower surface exceeds pressure on its upper surface because the lower surface is deeper. For a rectangular block, opposite horizontal forces cancel while the vertical pressure forces leave a net upward result called buoyancy.",
      "For a fully submerged block of height H and horizontal area A in uniform-density fluid, the pressure difference is ρgH. Multiplying by A gives buoyant force FB = ρgAH = ρgV. The same displaced-volume result applies to other shapes when pressure forces are summed over their surfaces under the usual hydrostatic conditions.",
      "Moving a rigid, fully submerged object deeper increases both top and bottom pressures by the same amount. Their difference and therefore buoyancy stay unchanged if fluid density and object volume stay fixed. A compressible object or strongly changing fluid density can behave differently; state those assumptions before extending the conclusion.",
      "Buoyancy is not automatically equal to the object’s weight. Compare the upward buoyant force with downward weight and any support, tether, or drag forces. If a block is held motionless underwater, a hand or scale may supply the remaining force. The diagram shows a held snapshot so you can change immersion without confusing the calculation with a motion simulation."
    ],
    "terms": [
      [
        "Buoyant force",
        "Net upward force from surrounding hydrostatic pressure."
      ],
      [
        "Displaced volume",
        "Volume of fluid excluded by the immersed portion of an object."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A rigid 0.002 m³ block is fully submerged in water. Find buoyancy at 1 m and 3 m depth.",
      "reasoning": "Both values are 1000 × 9.8 × 0.002 = 19.6 N when density is unchanged."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A fully submerged rigid block is lowered deeper in a uniform liquid. Its buoyancy…",
      "options": [
        "increases because all pressures rise.",
        "stays the same.",
        "vanishes."
      ],
      "correct": 1,
      "hint": "Subtract bottom and top forces.",
      "feedback": [
        "Both pressures rise equally; their difference stays fixed.",
        "Correct. Displaced volume and fluid density remain unchanged.",
        "The vertical pressure difference still exists."
      ],
      "teacher": "Ask students to show both pressure forces before drawing their net force."
    }
  },
  "archimedes": {
    "title": "Archimedes’ principle",
    "heading": "Replace the object with the fluid it displaced.",
    "subtitle": "Calculate buoyancy and apparent weight from displaced fluid.",
    "target": "Calculate buoyancy and apparent weight from displaced fluid.",
    "visual": "buoyancy-lab",
    "paragraphs": [
      "Imagine removing an immersed object and filling its occupied space with the surrounding fluid. That replacement fluid would be supported by the same pressure distribution on its boundary. In hydrostatic equilibrium, the net pressure force balances the replacement fluid’s weight. Therefore the object’s buoyant force equals the weight of the displaced fluid.",
      "Archimedes’ principle gives FB = ρfluid gVdisplaced. The density belongs to the fluid, not the object. For a partly immersed body, use only its submerged volume. For a fully submerged rigid body, the displaced volume is its entire exterior volume. A hollow sealed body excludes fluid from the cavity as well as from its wall material.",
      "A hanging scale supporting a stationary submerged object reads tension rather than the object’s full weight. If the object tends to sink and no other forces act, T = mg − FB. Its mass and gravitational weight have not disappeared; the surrounding fluid supplies part of the upward support. A body that tends to rise would instead require a downward restraint.",
      "Weighing an object in air and while immersed can reveal displaced volume and average density. Account for open pores, trapped bubbles, contact with the bottom, and nonuniform fluids before interpreting a real measurement. The principle describes the surrounding pressure force, not a rule that every immersed object must float."
    ],
    "terms": [
      [
        "Archimedes’ principle",
        "Buoyancy equals the weight of displaced fluid under hydrostatic conditions."
      ],
      [
        "Apparent weight",
        "Support force measured by a scale, which can differ from gravitational weight."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 30 N object displaces 0.001 m³ of water while hanging motionless. What does its supporting scale read?",
      "reasoning": "Buoyancy is 9.8 N, so tension is 30 − 9.8 = 20.2 N."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "The density used in FB = ρgV is the density of…",
      "options": [
        "the object’s material.",
        "the surrounding fluid.",
        "the scale."
      ],
      "correct": 1,
      "hint": "Imagine the replacement fluid.",
      "feedback": [
        "Object density helps determine weight, not the displaced fluid’s weight.",
        "Correct. Archimedes’ principle refers to the displaced fluid.",
        "The scale only supplies any remaining support."
      ],
      "teacher": "Require a force diagram before students subtract buoyancy from weight."
    }
  },
  "sink": {
    "title": "Sink, rise, or remain suspended",
    "heading": "Compare average density with the surrounding fluid.",
    "subtitle": "Predict vertical tendency for a fully immersed object.",
    "target": "Predict vertical tendency for a fully immersed object.",
    "visual": "float-lab",
    "paragraphs": [
      "For a fully immersed object of volume V, weight is ρobject gV and buoyancy is ρfluid gV. If average object density exceeds fluid density, weight is larger and the object tends to sink. If average object density is smaller, the object tends to rise. Equal densities produce neutral buoyancy in the ideal uniform fluid.",
      "Use the average density of the whole excluded volume. A steel-walled hollow object can have much lower average density than solid steel because its interior contributes volume with little mass. If water enters an open cavity, that cavity no longer excludes the same water volume, and the appropriate system and displaced volume change.",
      "Fish can adjust the volume of a gas-filled swim bladder, changing their average density. A submarine can change its mass by admitting or expelling water from ballast tanks. These are different mechanisms for changing the relation between weight and buoyancy. A rigid object in a uniform liquid does not become neutrally buoyant merely because it reaches an arbitrary greater depth.",
      "Density comparison predicts the initial vertical tendency when other forces are absent. Drag develops during motion and can lead to terminal speed, while a bottom contact or tether can provide equilibrium even for unequal densities. Neutral buoyancy also does not guarantee stability against every rotation or disturbance."
    ],
    "terms": [
      [
        "Average density",
        "Total mass divided by the relevant exterior volume."
      ],
      [
        "Neutral buoyancy",
        "Condition in which buoyancy balances weight without another vertical support force."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A fully submerged sealed object has average density 800 kg/m³ in water of density 1000 kg/m³. Which force is larger?",
      "reasoning": "Buoyancy is 1000/800 = 1.25 times its weight, so it tends to rise if released."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Adding mass to a sealed rigid object without changing its volume…",
      "options": [
        "increases its average density.",
        "increases its buoyancy in the same liquid.",
        "decreases its weight."
      ],
      "correct": 0,
      "hint": "Track mass and displaced volume separately.",
      "feedback": [
        "Correct. m/V increases.",
        "At fixed volume and fluid density, buoyancy stays fixed.",
        "Added mass increases gravitational weight."
      ],
      "teacher": "Distinguish a submarine changing mass from a fish changing volume."
    }
  },
  "float": {
    "title": "Flotation",
    "heading": "A floating body displaces its own weight of fluid.",
    "subtitle": "Determine submerged fraction and the effect of added load.",
    "target": "Determine submerged fraction and the effect of added load.",
    "visual": "float-lab",
    "paragraphs": [
      "A body floating motionless at a liquid surface has buoyancy equal to its weight if those are its only vertical forces. It sinks into the surface far enough to displace the required weight of liquid. That balance explains why adding cargo makes a boat sit lower without changing the density of the surrounding water.",
      "For a uniform body with total volume V and average density ρobject, the displaced fraction is Vsub/V = ρobject/ρfluid. This fraction is below one for ordinary partial flotation. A density ratio above one cannot be accommodated by submerging more than the body’s available volume; without another support, the object sinks.",
      "A ship made from dense metal can float because its hull encloses a large volume containing mostly air. The total ship mass divided by its excluded volume is the relevant comparison. Water entering the hull adds mass and can remove usable buoyant volume. The solid material’s density alone does not determine the ship’s flotation.",
      "Floating also requires stability, which involves centers of gravity and buoyancy and changes of submerged shape during a tilt. The simple vertical model below predicts draft and force balance, not whether a real boat resists capsizing. Surface tension can support very small objects by an additional mechanism; do not attribute every object resting on a surface solely to bulk buoyancy."
    ],
    "terms": [
      [
        "Submerged fraction",
        "Fraction of a floating body’s volume below the liquid surface."
      ],
      [
        "Draft",
        "Depth to which a floating hull extends below the water surface."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A uniform block has density 600 kg/m³ and floats in water. What fraction lies below the surface?",
      "reasoning": "Vsub/V = 600/1000 = 0.60, so 60% is submerged."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A boat receives extra cargo and remains floating. Its buoyancy…",
      "options": [
        "stays fixed at its old value.",
        "increases to balance the new total weight.",
        "becomes smaller than its new weight."
      ],
      "correct": 1,
      "hint": "The boat settles lower until forces balance again.",
      "feedback": [
        "More submerged volume displaces more water.",
        "Correct. The added displacement supplies the extra upward force.",
        "That would not be vertical equilibrium without another force."
      ],
      "teacher": "Ask students to distinguish draft from the stability of a tilted hull."
    }
  },
  "hydraulic": {
    "title": "Pascal’s principle",
    "heading": "The same added pressure can act over different areas.",
    "subtitle": "Explain hydraulic force multiplication and its displacement tradeoff.",
    "target": "Explain hydraulic force multiplication and its displacement tradeoff.",
    "visual": "hydraulic-lab",
    "paragraphs": [
      "Pascal’s principle states that an imposed pressure change in an enclosed fluid at rest is transmitted throughout the fluid. This concerns an added pressure, not a claim that hydrostatic pressure is identical at different heights. Two ideal pistons at the same elevation can use that transmitted change to connect input and output forces.",
      "If piston areas are A₁ and A₂, an input force F₁ creates added pressure F₁/A₁. The same added pressure produces F₂ = F₁A₂/A₁ at the output. A larger output area therefore gives a larger force. Piston weights, friction, and differing elevations must be included when they are significant.",
      "Force multiplication does not create energy. For an incompressible fluid with no leakage, displaced volumes match: A₁d₁ = A₂d₂. The larger piston moves a smaller distance. In the ideal lossless case, F₁d₁ = F₂d₂. Pressure and volume changes connect the force advantage with the motion tradeoff.",
      "Hydraulic lifts and brakes apply this relationship. Real systems may have elastic hoses, trapped compressible gas, viscous losses, and seals that resist motion. Those features alter actual displacement or required input force. Begin with the ideal model, check conservation of volume and work, then identify which physical features would change its predictions."
    ],
    "terms": [
      [
        "Pascal’s principle",
        "An applied pressure change is transmitted throughout an enclosed fluid at rest."
      ],
      [
        "Hydraulic mechanical advantage",
        "Ideal output-to-input force ratio, equal to the piston area ratio."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 20 N input acts on a 2 cm² piston connected to a 10 cm² piston. Find output force and output travel for 5 cm input travel.",
      "reasoning": "The area ratio is 5, so output force is 100 N and output travel is 1 cm. Both sides do 1 J of work."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Increasing the output area while keeping input force and input travel fixed gives…",
      "options": [
        "more force and less travel.",
        "more force and more travel.",
        "less force and less travel."
      ],
      "correct": 0,
      "hint": "Use both equal pressure and equal displaced volume.",
      "feedback": [
        "Correct. The two gains trade against each other.",
        "That would create output work in the ideal system.",
        "Output force rises with area."
      ],
      "teacher": "Require both the force equation and volume equation."
    }
  },
  "atmosphere": {
    "title": "The atmosphere",
    "heading": "Gravity and molecular motion shape a compressible fluid.",
    "subtitle": "Explain atmospheric pressure and its variation with altitude.",
    "target": "Explain atmospheric pressure and its variation with altitude.",
    "visual": "atmosphere-lab",
    "paragraphs": [
      "Air is matter: it has mass and consists of moving particles. Earth’s gravity helps retain the atmosphere while molecular motion spreads gas through available space. Unlike a lake of nearly incompressible water, the atmosphere becomes substantially less dense with increasing altitude. Most atmospheric mass is concentrated relatively close to the ground.",
      "At a microscopic level, gas particles transfer momentum when they collide with a surface, producing pressure. At a macroscopic level, a stationary layer of atmosphere needs a pressure difference to support its weight. These are compatible accounts of the same fluid, describing particle interactions and large-scale balance.",
      "Pressure usually decreases as height increases because less atmosphere remains above. Over a small height interval with nearly constant density, ΔP ≈ −ρgΔh. Over a much larger interval, density itself changes, so a constant-density liquid formula is insufficient. The illustrative isothermal model gives an exponential decrease; the real atmosphere has changing temperatures and weather.",
      "Air pressure acts on every side of an object. Ordinary windows have air on both faces, so the large absolute forces mostly cancel. A pressure imbalance can create a large net force over a broad surface. Distinguish that imbalance from the weight of a small local parcel of air or the claim that pressure always pushes only downward."
    ],
    "terms": [
      [
        "Atmospheric pressure",
        "Pressure exerted by the surrounding atmosphere."
      ],
      [
        "Scale height",
        "Height scale for exponential pressure decrease in an ideal isothermal atmosphere."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "If pressure changes by 2000 Pa across a 0.5 m² panel, what net force results?",
      "reasoning": "F = ΔPA = 1000 N, directed from the high-pressure side toward the low-pressure side."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why is the constant-density water formula insufficient over many kilometers of atmosphere?",
      "options": [
        "Air has no weight.",
        "Air density changes significantly with altitude.",
        "Pressure exists only at ground level."
      ],
      "correct": 1,
      "hint": "Gas is compressible.",
      "feedback": [
        "Air’s weight is central to hydrostatic balance.",
        "Correct. The density must be allowed to vary.",
        "Pressure exists throughout the atmosphere, at different values."
      ],
      "teacher": "Connect momentum transfer at a wall with hydrostatic support of the atmospheric column."
    }
  },
  "barometer": {
    "title": "The simple barometer",
    "heading": "A pressure difference supports a liquid column.",
    "subtitle": "Relate barometer height to atmospheric pressure and fluid density.",
    "target": "Relate barometer height to atmospheric pressure and fluid density.",
    "visual": "barometer-lab",
    "paragraphs": [
      "A simple liquid barometer balances atmospheric pressure against the pressure of a vertical liquid column. One end of a filled tube is closed, and its open end communicates with a reservoir exposed to the atmosphere. If pressure above the column is negligible, the column height satisfies Patm = ρgh.",
      "The height is measured vertically from the reservoir surface to the top of the column. It depends on liquid density: a denser liquid requires a shorter column for the same pressure. Near one atmosphere, a mercury column is roughly 0.76 m high, while a water column would be about 10.3 m. These are model comparisons, not instructions to handle mercury.",
      "A suction pump or straw works by reducing pressure above a liquid so external pressure can push the liquid upward. Suction is a useful everyday word, but the force account comes from the pressure difference. A surface suction pump cannot raise a continuous water column to unlimited height; the available atmospheric pressure sets an ideal upper bound, with practical limits lower.",
      "If the space above a barometer column has appreciable gas or vapor pressure Ptop, use Patm − Ptop = ρgh. Changes in atmospheric pressure change the equilibrium height. The liquid column is therefore a pressure measurement, not evidence that vacuum actively pulls matter with a separate force."
    ],
    "terms": [
      [
        "Barometer",
        "An instrument measuring atmospheric pressure."
      ],
      [
        "Liquid head",
        "Vertical liquid height representing a pressure difference ρgh."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Estimate the water-column height supported by 98 kPa with negligible pressure above it.",
      "reasoning": "h = 98,000/(1000 × 9.8) = 10 m."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Replacing the barometer liquid with one twice as dense makes its ideal height…",
      "options": [
        "twice as large.",
        "half as large.",
        "unchanged."
      ],
      "correct": 1,
      "hint": "At fixed pressure, ρh is constant.",
      "feedback": [
        "A denser column provides more pressure per meter.",
        "Correct. The required column is half as tall.",
        "Height depends on density."
      ],
      "teacher": "Have students point to both pressures rather than describe a vacuum as pulling."
    }
  },
  "aneroid": {
    "title": "The aneroid barometer",
    "heading": "A pressure difference can deform an elastic chamber.",
    "subtitle": "Explain dry pressure instruments and the role of calibration.",
    "target": "Explain dry pressure instruments and the role of calibration.",
    "visual": "aneroid-lab",
    "paragraphs": [
      "An aneroid barometer measures pressure without a liquid column. A flexible sealed chamber contains a reduced internal pressure. Changes in surrounding pressure deform the chamber against its elastic restoring force, and a mechanical linkage or sensor converts that deformation into a reading.",
      "The instrument responds to a pressure difference across its wall. It requires calibration to associate deformation with pressure and compensation for effects such as temperature. Its scale may display atmospheric pressure directly even though the sensing element mechanically responds to a difference between internal and external conditions.",
      "An altitude scale uses the general decrease of atmospheric pressure with elevation. Pressure also changes with weather, however, so an uncorrected pressure-based altimeter does not measure geometric altitude uniquely under every condition. A model that converts pressure into height must state its assumed atmospheric profile and reference setting.",
      "A thin can can collapse when its internal pressure drops enough below external pressure. The atmosphere has not suddenly become a downward-only force; forces act inward over the whole surface and the wall may buckle. The schematic gauge here connects capsule deformation to a calibrated atmospheric-pressure reading. It illustrates the pressure difference that drives a sensor, not the exact linkage geometry of every barometer."
    ],
    "terms": [
      [
        "Aneroid",
        "A pressure instrument using an elastic sensing element rather than a liquid column."
      ],
      [
        "Calibration",
        "Establishing a relationship between an instrument response and known values."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A flexible chamber has internal pressure 20 kPa and external pressure 100 kPa. What inward pressure difference acts on its wall?",
      "reasoning": "The difference is 80 kPa. The wall’s deformation depends on its geometry and elastic response."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A pressure-based altitude reading changes while a device stays at the same elevation. A possible cause is…",
      "options": [
        "changing weather pressure.",
        "a necessary change in proton count.",
        "pressure becoming a vector."
      ],
      "correct": 0,
      "hint": "The pressure-to-altitude conversion assumes an atmospheric profile.",
      "feedback": [
        "Correct. Atmospheric pressure is not determined by altitude alone.",
        "Nuclear identity is unrelated to this instrument.",
        "Pressure remains a scalar."
      ],
      "teacher": "Ask students which quantity the sensor measures and which quantity it infers."
    }
  },
  "boyle": {
    "title": "Boyle’s law",
    "heading": "Compress the same gas at the same temperature.",
    "subtitle": "Apply inverse pressure-volume proportionality using absolute pressure.",
    "target": "Apply inverse pressure-volume proportionality using absolute pressure.",
    "visual": "boyle-lab",
    "paragraphs": [
      "A gas can be compressed because its particles are widely separated compared with particles in an ordinary liquid. If the amount of gas and its temperature stay fixed, an ideal gas obeys Boyle’s law: PV is constant. Halving the volume then doubles the absolute pressure.",
      "The microscopic explanation combines molecular motion with available space. At unchanged temperature, the average molecular kinetic energy stays the same. A smaller container gives particles less distance between wall encounters and increases number density, producing greater pressure. The particles themselves do not need to shrink when the gas volume shrinks.",
      "Use absolute pressure in the gas law. A gauge reading measures pressure above the surroundings and generally cannot be inserted directly into P₁V₁ = P₂V₂. Add the relevant atmospheric pressure first, perform the calculation, and subtract it afterward if a gauge answer is needed.",
      "A quick compression can warm the gas, so it need not follow the constant-temperature curve during the motion. Waiting for heat exchange can bring it closer to the isothermal condition. Flexible balloons also involve wall tension and changing shape; Boyle’s law applies to the gas state under its assumptions, not automatically to every force or geometry in the surrounding apparatus."
    ],
    "terms": [
      [
        "Boyle’s law",
        "At fixed gas amount and temperature, absolute pressure times volume is constant."
      ],
      [
        "Isothermal",
        "Occurring at constant temperature."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A gas initially occupies 2 L at 100 kPa absolute. It is slowly compressed to 0.5 L at unchanged temperature. Find final pressure.",
      "reasoning": "P₂ = 100 × 2/0.5 = 400 kPa absolute."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "The pressure used in Boyle’s law must be…",
      "options": [
        "absolute pressure.",
        "gauge pressure only.",
        "zero during compression."
      ],
      "correct": 0,
      "hint": "The ideal-gas relation uses a vacuum reference.",
      "feedback": [
        "Correct. Gauge pressure needs its atmospheric reference added first.",
        "Using only a gauge value gives the wrong gas state.",
        "Compression generally raises the pressure in this model."
      ],
      "teacher": "Ask which variable would change during rapid compression before applying the isothermal model."
    }
  },
  "airBuoyancy": {
    "title": "Buoyancy in air",
    "heading": "A balloon must lift its envelope and payload too.",
    "subtitle": "Compare displaced-air weight with the total balloon weight.",
    "target": "Compare displaced-air weight with the total balloon weight.",
    "visual": "balloon-lab",
    "paragraphs": [
      "Air exerts buoyancy just as water does. A balloon displaces a volume of surrounding air, so its buoyant force is FB = ρair gV. This force depends on the density of the outside air and the displaced volume, not directly on whether the balloon contains helium, warm air, or another gas.",
      "The gas inside contributes to the balloon’s weight. So do the envelope, basket, and payload. A freely rising balloon initially needs buoyancy greater than their combined weight. The useful mass-lifting capacity in a simple uniform model is (ρoutside − ρinside)V minus the envelope mass. Any payload must fit within the remaining capacity.",
      "Heating air at roughly the surrounding pressure lowers its density, allowing the same balloon volume to contain less gas mass. Helium can also produce a lower internal density. Neither method removes gravity from the payload. Both change the balance between the weight of displaced outside air and the weight of everything being lifted.",
      "As altitude changes, outside density and pressure change, and a flexible balloon may expand. A full ascent model must account for those changes, envelope limits, temperature, and drag. The adjustable calculation below treats density and volume as specified snapshot values. A balanced force account does not by itself predict climb speed or stability."
    ],
    "terms": [
      [
        "Lifting capacity",
        "Payload mass that can be supported after accounting for the lifting gas and envelope."
      ],
      [
        "Displaced air",
        "Outside air excluded by a balloon’s volume."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 10 m³ balloon displaces air at 1.2 kg/m³ and contains gas at 0.2 kg/m³. Its envelope is 2 kg. What ideal payload can it support?",
      "reasoning": "The density difference supports (1.2 − 0.2) × 10 = 10 kg. Subtracting the envelope leaves 8 kg of payload."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Two equal-volume balloons in the same air have…",
      "options": [
        "the same buoyant force.",
        "the same total weight regardless of contents.",
        "zero buoyancy if one contains air."
      ],
      "correct": 0,
      "hint": "Buoyancy depends on the outside fluid displaced.",
      "feedback": [
        "Correct. Their net lift can still differ because their weights differ.",
        "The contents and envelope contribute different masses.",
        "An air-filled balloon still displaces air."
      ],
      "teacher": "Require a complete system containing gas, envelope, and payload."
    }
  },
  "flow": {
    "title": "Flow rate and velocity",
    "heading": "The same volume must pass each section of a full pipe.",
    "subtitle": "Use Q = Av and distinguish volume flow from speed.",
    "target": "Use Q = Av and distinguish volume flow from speed.",
    "visual": "continuity-lab",
    "paragraphs": [
      "Volume flow rate Q is the volume crossing a section per unit time. For a uniform flow, Q = Av; more generally v is the cross-sectional average speed. The SI unit is m³/s. Liters per second also describe volume flow, while meters per second describe speed, so these quantities must not be exchanged.",
      "In steady incompressible flow through a full pipe without branches or leaks, A₁v₁ = A₂v₂. The same volume cannot continually enter faster than it leaves without accumulating somewhere. A narrower section therefore has greater average speed for a fixed flow rate. Halving radius quarters area and multiplies speed by four.",
      "If a pipe splits into branches, the inlet flow equals the sum of outlet flows under the same steady conditions. For a compressible fluid, mass conservation is more general: ρAv is conserved along a single stream tube. Equal volume flow requires nearly constant density and cannot be assumed for every expanding gas flow.",
      "Continuity does not tell you what pressure is required to produce the flow. A pump, gravitational head, or other pressure difference supplies energy, and viscosity can dissipate it. First use conservation of mass to connect speeds, then use an appropriate energy or resistance model to determine whether those speeds are physically supported. The diagram assumes a prescribed steady water flow."
    ],
    "terms": [
      [
        "Volume flow rate",
        "Volume crossing a surface per unit time."
      ],
      [
        "Continuity equation",
        "A statement of mass conservation in a flowing fluid."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Water flows at 2 L/s through an area of 10 cm². Find average speed.",
      "reasoning": "Q = 0.002 m³/s and A = 0.001 m², so v = 2 m/s."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At fixed incompressible flow rate, halving pipe radius makes average speed…",
      "options": [
        "twice as large.",
        "four times as large.",
        "half as large."
      ],
      "correct": 1,
      "hint": "Area is proportional to radius squared.",
      "feedback": [
        "That treats radius as area.",
        "Correct. One-quarter area requires four times the speed.",
        "A smaller area requires a larger speed at fixed Q."
      ],
      "teacher": "Check unit conversion before using continuity, then ask what maintains the flow."
    }
  },
  "bernoulli": {
    "title": "Bernoulli’s principle",
    "heading": "Pressure, motion, and height share an energy account.",
    "subtitle": "Apply Bernoulli along a streamline under its stated assumptions.",
    "target": "Apply Bernoulli along a streamline under its stated assumptions.",
    "visual": "bernoulli-lab",
    "paragraphs": [
      "For steady incompressible flow with negligible viscosity and no added shaft work, Bernoulli’s equation relates points along a streamline: P + ½ρv² + ρgh = constant. Each term has units of energy per volume, equivalent to pressure. Pressure work, kinetic energy, and gravitational energy exchange within this account.",
      "For a horizontal passage, the height terms cancel. If continuity requires greater speed in a narrow region, the ideal static pressure there is lower. The fluid accelerates because of a pressure gradient; it does not lose pressure merely because someone labels it moving. Compare connected points under the model’s conditions.",
      "A fluid can have high speed and high pressure simultaneously when a pump supplies sufficient energy. Comparing arbitrary points in different flows using only the slogan faster means lower pressure is unreliable. Viscosity, turbulence, substantial compressibility, or energy added between the points can require additional terms or a different model.",
      "Streamlines indicate local flow direction. In a steady stream tube of incompressible fluid, closer spacing of equal-flow boundaries can indicate higher speed. They are drawing conventions rather than physical walls. Use continuity to establish the speed relationship, Bernoulli to relate energy terms, and the surrounding boundary conditions to determine actual pressures and forces."
    ],
    "terms": [
      [
        "Bernoulli’s equation",
        "An ideal steady-flow energy relation along a streamline."
      ],
      [
        "Streamline",
        "A curve tangent to the local fluid velocity."
      ],
      [
        "Static pressure",
        "Local fluid pressure, distinct from the kinetic energy density ½ρv²."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Water speeds up horizontally from 1 to 3 m/s with negligible losses. Find P₁ − P₂.",
      "reasoning": "½ρ(v₂² − v₁²) = ½ × 1000 × (9 − 1) = 4000 Pa."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which condition is needed for this simple Bernoulli comparison?",
      "options": [
        "Negligible energy loss between the selected points.",
        "Any two unrelated moving fluids.",
        "No pressure anywhere."
      ],
      "correct": 0,
      "hint": "Identify what is omitted from the energy account.",
      "feedback": [
        "Correct. Significant dissipation requires a loss term.",
        "The equation does not connect arbitrary unrelated flows.",
        "Pressure work is part of the equation."
      ],
      "teacher": "Have students name the two points and the assumptions before predicting pressure."
    }
  },
  "applications": {
    "title": "Applications of Bernoulli’s principle",
    "heading": "A pressure distribution and momentum change tell one story.",
    "subtitle": "Explain lift and flow-induced forces without equal-transit assumptions.",
    "target": "Explain lift and flow-induced forces without equal-transit assumptions.",
    "visual": "lift-lab",
    "paragraphs": [
      "A wing can exert a downward influence on passing air while the air exerts an upward force on the wing. The same lift can be described by integrating the pressure distribution over the wing’s surface. Newton’s momentum account and a pressure account must agree when they describe the same flow and system.",
      "Bernoulli’s equation can relate local speed and pressure in suitable regions of that flow, but it does not determine the entire airflow from wing shape alone. In particular, air parcels separated at the leading edge do not have to reunite at the trailing edge at the same time. The familiar equal-transit explanation is incorrect.",
      "A spinning ball can curve because its motion and rotation alter the surrounding flow and create a sideways aerodynamic force. Surface texture, viscosity, separation, and wake behavior matter. A simple ideal streamline picture illustrates asymmetry but does not supply a complete quantitative prediction for every ball and speed.",
      "Pressure differences can also exert forces on roofs, adjacent boats, or nearby surfaces. Real flows around those objects may be unsteady and turbulent. Treat the diagram as a pressure-force calculation with an imposed difference, not a universal claim that any fast flow lowers pressure everywhere. For a flat representative area, F ≈ ΔPA makes the consequence of even a modest difference clear."
    ],
    "terms": [
      [
        "Lift",
        "Aerodynamic force perpendicular to the incoming relative flow."
      ],
      [
        "Pressure distribution",
        "Variation of pressure over a surface, whose forces combine to a resultant."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A representative 2 m² wing area has average pressure 300 Pa greater below than above. Estimate upward pressure force.",
      "reasoning": "F ≈ ΔPA = 600 N. This calculates force from a stated pressure difference; it does not predict that difference from shape."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Must air parcels above and below a wing reunite simultaneously at its trailing edge?",
      "options": [
        "Yes, by conservation of mass.",
        "No; equal transit time is not a physical requirement.",
        "Yes, because every wing is symmetric."
      ],
      "correct": 1,
      "hint": "Continuity concerns flow conservation, not reunion of selected parcels.",
      "feedback": [
        "Conservation does not pair parcels that way.",
        "Correct. Pressure and momentum explanations do not need that assumption.",
        "Wing symmetry would not establish the claimed rule."
      ],
      "teacher": "Connect pressure forces and downward air momentum. Correction reference: https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/bernoulli-and-newton/"
    }
  },
  "measurement": {
    "title": "Gauge and absolute pressure",
    "heading": "Specify the reference before interpreting the number.",
    "subtitle": "Read manometers and relate gauge, absolute, and atmospheric pressure.",
    "target": "Read manometers and relate gauge, absolute, and atmospheric pressure.",
    "visual": "pressure-gauge",
    "paragraphs": [
      "Absolute pressure uses vacuum as its reference. Gauge pressure reports the difference from the surrounding atmosphere: Pgauge = Pabsolute − Patm. A tire gauge commonly reads the added pressure above the air outside. A zero gauge reading therefore does not mean the tire contains a vacuum.",
      "Gauge pressure can be negative when a gas pressure is below atmospheric pressure. For ordinary gases, absolute pressure cannot be negative. If local atmospheric pressure is 100 kPa and a gauge reads −20 kPa, the absolute gas pressure is 80 kPa. State the local atmospheric value when converting instead of automatically assuming one fixed reference.",
      "A U-tube manometer compares pressures through a liquid height difference. At equal heights in the same connected stationary liquid, pressures match. Following the columns gives a pressure difference of ρgΔh when the gas density is negligible. The side with greater applied gas pressure pushes its liquid surface lower; use that observation to determine the sign.",
      "An aneroid or electronic gauge senses a deformation or other response and requires calibration. A barometer measures atmospheric pressure, while an open-tube manometer compares a sample with atmosphere. Gas-law calculations require absolute pressure even if the original measurement is a gauge reading. Tracking the reference is as important as converting units."
    ],
    "terms": [
      [
        "Manometer",
        "A device comparing pressures, often through liquid-column height differences."
      ],
      [
        "Pressure reference",
        "The baseline from which a pressure reading is measured."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A gauge reads 40 kPa where atmosphere is 98 kPa. Find absolute pressure.",
      "reasoning": "Pabsolute = 40 + 98 = 138 kPa."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A zero gauge pressure means the gas pressure is…",
      "options": [
        "zero absolute.",
        "equal to the local atmosphere.",
        "necessarily below vacuum."
      ],
      "correct": 1,
      "hint": "Gauge pressure is a difference.",
      "feedback": [
        "Vacuum would usually give a negative gauge reading.",
        "Correct. The inside and outside reference pressures match.",
        "That is not a physical ordinary-gas state."
      ],
      "teacher": "Ask students to sketch the liquid levels before assigning a manometer sign."
    }
  },
  "surface": {
    "title": "Surface tension and capillary action",
    "heading": "An interface can matter as much as the fluid below it.",
    "subtitle": "Connect cohesion, adhesion, surface tension, and capillary height.",
    "target": "Connect cohesion, adhesion, surface tension, and capillary height.",
    "visual": "capillary-lab",
    "paragraphs": [
      "Molecules in a liquid attract neighboring molecules. Cohesion refers to interactions within the liquid, while adhesion refers to interactions with another material such as glass. At an interface, these interactions give an energy cost to creating more surface area. Surface tension γ can be expressed as force per length or energy per area.",
      "A small object may be supported partly by the vertical components of surface tension around its contact line. That is a different contribution from ordinary displaced-volume buoyancy. A soap film has two surfaces, so pulling a sliding wire of length L can require force 2γL rather than γL under the ideal geometry.",
      "For a spherical liquid drop in gas, excess pressure is 2γ/r; a thin soap bubble has two interfaces and approximately 4γ/r. Smaller radii therefore require larger excess pressure if γ stays constant. Real biological interfaces can have changing surface tension, so the simplest constant-γ bubble comparison has limits.",
      "In a narrow tube, the vertical component of tension around the circumference can support a column. Balancing forces gives h = 2γ cos θ/(ρgr). A wetting liquid with contact angle below 90° rises; an angle above 90° produces depression. Narrower tubes produce a larger magnitude of height. The model assumes static equilibrium and a uniform circular tube."
    ],
    "terms": [
      [
        "Surface tension",
        "Interface energy per area, equivalently force per length."
      ],
      [
        "Contact angle",
        "Angle where a liquid interface meets a solid, measured through the liquid."
      ],
      [
        "Capillary action",
        "Rise or depression of liquid caused by surface forces in a narrow passage."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "For water with γ = 0.072 N/m in a fully wetting tube of radius 0.5 mm, estimate capillary rise.",
      "reasoning": "h = 2 × 0.072/(1000 × 9.8 × 0.0005) ≈ 0.0294 m, or 2.94 cm."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At fixed liquid and contact angle, halving tube radius makes capillary height magnitude…",
      "options": [
        "twice as large.",
        "half as large.",
        "unchanged."
      ],
      "correct": 0,
      "hint": "Height is inversely proportional to radius.",
      "feedback": [
        "Correct. The surface-force-to-column-weight ratio increases.",
        "That reverses the inverse relationship.",
        "Tube radius is part of the force balance."
      ],
      "teacher": "Ask why a soap film has a factor of two and why a nonwetting tube can depress the level."
    }
  },
  "body": {
    "title": "Pressures in the body",
    "heading": "Pressure gradients move fluids and load tissues.",
    "subtitle": "Apply pressure references and hydrostatic reasoning to biological examples.",
    "target": "Apply pressure references and hydrostatic reasoning to biological examples.",
    "visual": "body-pressure",
    "paragraphs": [
      "Pressure is central to circulation, breathing, and the support of fluid-filled tissues. These systems have pumps, elastic walls, valves, and changing geometry. A simple physics model can isolate a relationship without treating the body as one rigid pipe or one uniform static tank.",
      "The heart creates pressure differences that drive blood through resistance. Systolic pressure refers to the higher arterial pressure during ventricular contraction, and diastolic pressure to the lower pressure between contractions. Such values are commonly gauge pressures. They vary through the circulation, so one measurement does not represent every vessel or location.",
      "Height also matters. In a stationary approximation, a lower point in a connected column has additional pressure ρgΔh. This helps explain why measurement height must be specified. Actual circulation adds flow and pumping, so a static height correction alone does not describe the full system. Pressure at the feet and head cannot simply be assumed identical in an upright body.",
      "During inhalation, expansion of the chest lowers lung air pressure slightly relative to atmosphere, allowing air to flow inward. Exhalation reverses the pressure difference. Fluid pressure in the eye, cerebrospinal fluid around the nervous system, and bladder pressure illustrate other confined-fluid systems. Joint contact pressure also depends strongly on force and area. The model below is an educational hydrostatic comparison, not an individual physiological measurement."
    ],
    "terms": [
      [
        "Systolic pressure",
        "Higher arterial pressure associated with ventricular contraction."
      ],
      [
        "Diastolic pressure",
        "Lower arterial pressure between ventricular contractions."
      ],
      [
        "Pressure gradient",
        "Spatial variation of pressure that can contribute to fluid acceleration or flow."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Using density 1060 kg/m³, estimate the hydrostatic pressure increase 0.5 m below a reference point.",
      "reasoning": "ΔP = 1060 × 9.8 × 0.5 ≈ 5194 Pa = 5.19 kPa, assuming a stationary column."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Air enters the lungs when lung air pressure is…",
      "options": [
        "slightly below surrounding atmospheric pressure.",
        "always zero absolute.",
        "greater than atmospheric pressure."
      ],
      "correct": 0,
      "hint": "Flow responds to a pressure difference.",
      "feedback": [
        "Correct. Outside pressure pushes air inward.",
        "Ordinary inhalation does not create a vacuum.",
        "That difference tends to move air outward."
      ],
      "teacher": "Require students to state what pumping, elasticity, and motion the static model omits."
    }
  },
  "general": {
    "title": "Bernoulli with height and power",
    "heading": "Account for elevation before comparing pressures.",
    "subtitle": "Use Torricelli’s relation and fluid power under explicit assumptions.",
    "target": "Use Torricelli’s relation and fluid power under explicit assumptions.",
    "visual": "fluid-energy",
    "paragraphs": [
      "When a fluid rises, some available mechanical energy becomes gravitational potential energy. Bernoulli’s full relation keeps P, ½ρv², and ρgh together. A pressure drop can therefore support an increase in speed, an increase in height, or both. Ignoring elevation can give a wrong answer even when the continuity calculation is correct.",
      "For a large open reservoir draining through a small opening a vertical distance h below its surface, atmospheric pressure approximately cancels between surface and emerging jet. If surface speed and losses are negligible, v = √(2gh). This is Torricelli’s relation. It predicts an ideal exit speed; actual discharge also depends on contraction and energy losses.",
      "Multiplying an energy-per-volume term by volume flow rate produces power. A pump that raises pressure by ΔP without changing speed or elevation delivers hydraulic power ΔPQ. If it also raises the fluid or accelerates it, include those energy terms. Electrical input power must exceed delivered hydraulic power when pump efficiency is below one.",
      "Between a pump inlet and outlet, ordinary constant-Bernoulli form cannot be used while ignoring the pump’s work. A broader account includes energy added and losses. Choose a boundary, state elevations, and keep gauge references consistent. Then check whether predicted pressures and flow conditions remain physically compatible with the proposed device."
    ],
    "terms": [
      [
        "Torricelli’s relation",
        "Ideal exit speed √(2gh) from a large open reservoir."
      ],
      [
        "Hydraulic power",
        "Rate of mechanical energy transfer to a fluid, such as ΔPQ for a pressure rise."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A pump raises pressure by 200 kPa at a flow rate of 0.003 m³/s with no height or speed change. Find hydraulic power.",
      "reasoning": "Power = ΔPQ = 200,000 × 0.003 = 600 W. At 75% efficiency, input power would be 800 W."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "In ideal reservoir drainage, quadrupling the fluid head changes exit speed by a factor of…",
      "options": [
        "4.",
        "2.",
        "1/4."
      ],
      "correct": 1,
      "hint": "Speed depends on the square root of height.",
      "feedback": [
        "That is the height factor, not the speed factor.",
        "Correct. √4 = 2.",
        "Greater head produces greater exit speed."
      ],
      "teacher": "Ask which terms cancel and why before students use the simplified drainage formula."
    }
  },
  "viscosity": {
    "title": "Viscosity and laminar flow",
    "heading": "Resistance depends strongly on the passage radius.",
    "subtitle": "Use Poiseuille’s law within the steady laminar regime.",
    "target": "Use Poiseuille’s law within the steady laminar regime.",
    "visual": "poiseuille-lab",
    "paragraphs": [
      "Viscosity describes a fluid’s resistance to relative motion between neighboring layers. For a Newtonian fluid sheared between flat plates, force is proportional to area and velocity gradient: F = ηAΔv/Δy. The dynamic viscosity η has SI units Pa·s. It depends on the material and temperature.",
      "In steady, fully developed laminar flow through a long circular tube, the no-slip condition makes fluid at the wall stationary relative to the wall, while the center moves fastest. The velocity profile is parabolic, and the center speed is twice the cross-sectional average. This differs from an ideal uniform-speed sketch used only to illustrate continuity.",
      "Poiseuille’s law is Q = πr⁴ΔP/(8ηL), giving hydraulic resistance R = ΔP/Q = 8ηL/(πr⁴). Doubling radius multiplies flow by sixteen when pressure difference, viscosity, and length stay fixed. Doubling length or viscosity halves the flow. The fourth-power dependence makes small geometric changes consequential.",
      "The assumptions matter: incompressible Newtonian fluid, steady laminar flow, rigid circular tube, and a developed profile. Pulsating blood in flexible branching vessels may not match all of them. Turbulent flow also needs a different resistance account. In a real horizontal constant-area pipe, pressure can drop to overcome viscous loss even when average speed stays constant."
    ],
    "terms": [
      [
        "Viscosity",
        "Resistance to shearing motion between fluid layers."
      ],
      [
        "Laminar flow",
        "Ordered flow with smooth layers and little cross-layer bulk mixing."
      ],
      [
        "Hydraulic resistance",
        "Pressure difference divided by volume flow rate."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A tube radius decreases to half while other Poiseuille conditions stay fixed. What happens to flow?",
      "reasoning": "Q becomes (1/2)⁴ = 1/16 of its previous value. Maintaining the old flow would require sixteen times the pressure difference."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A pressure drop along a horizontal constant-radius viscous pipe can occur because…",
      "options": [
        "the fluid must always speed up.",
        "mechanical energy is dissipated by viscous resistance.",
        "continuity fails."
      ],
      "correct": 1,
      "hint": "Equal inlet and outlet speed does not guarantee zero loss.",
      "feedback": [
        "Steady incompressible flow has the same average speed at equal areas.",
        "Correct. Pressure work supplies the dissipated energy.",
        "Mass conservation still applies."
      ],
      "teacher": "Ask what variable is held fixed before interpreting the radius slider."
    }
  },
  "turbulence": {
    "title": "The onset of turbulence",
    "heading": "Compare inertia with viscosity before choosing a flow model.",
    "subtitle": "Calculate Reynolds number and interpret geometry-dependent regimes.",
    "target": "Calculate Reynolds number and interpret geometry-dependent regimes.",
    "visual": "reynolds-lab",
    "paragraphs": [
      "Smooth laminar flow can become irregular, with eddies and mixing, when disturbances grow. The competition between inertial effects and viscous smoothing is summarized by the Reynolds number Re = ρvD/η for pipe flow, where v is average speed and D is pipe diameter. It has no units.",
      "Larger density, speed, or diameter increases Re, while larger viscosity decreases it. For ordinary internal flow in a long circular pipe, values below roughly 2000 are usually laminar, values above roughly 4000 are commonly turbulent, and the region between is transitional. Entrance conditions, disturbances, roughness, and geometry influence the actual transition.",
      "These thresholds are guides for this geometry, not universal boundaries for every object in every fluid. A sphere moving through a fluid uses its diameter as a characteristic length, but its flow patterns and transition behavior differ from those of a pipe. State the geometry when interpreting a Reynolds number.",
      "Turbulence often increases the pressure difference needed to maintain a given flow, so a laminar Poiseuille prediction may become inaccurate. A narrowed passage at fixed volume flow has higher speed; because speed scales inversely with area, its Reynolds number can rise even though diameter decreases. Use continuity first rather than changing diameter while silently holding the wrong variable fixed."
    ],
    "terms": [
      [
        "Reynolds number",
        "Dimensionless ratio comparing inertial and viscous effects."
      ],
      [
        "Turbulence",
        "Irregular flow with eddies, fluctuations, and mixing."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Water with ρ = 1000 kg/m³ and η = 0.001 Pa·s flows at 0.10 m/s through a 0.010 m diameter pipe. Find Re.",
      "reasoning": "Re = 1000 × 0.10 × 0.010/0.001 = 1000, consistent with laminar pipe flow under suitable conditions."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "At fixed incompressible Q, narrowing a circular pipe makes Re…",
      "options": [
        "increase.",
        "decrease solely because diameter decreases.",
        "always exactly one."
      ],
      "correct": 0,
      "hint": "Combine v = Q/A with Re proportional to vD.",
      "feedback": [
        "Correct. Re scales as 1/D at fixed Q and fluid properties.",
        "The accompanying speed increase is larger than that diameter effect.",
        "Its value depends on flow and fluid properties."
      ],
      "teacher": "Compare fixed-speed and fixed-flow scenarios explicitly."
    }
  },
  "stokes": {
    "title": "Motion in a viscous fluid",
    "heading": "At terminal speed, include buoyancy as well as drag.",
    "subtitle": "Apply Stokes drag to a small slowly moving sphere and check its regime.",
    "target": "Apply Stokes drag to a small slowly moving sphere and check its regime.",
    "visual": "stokes-lab",
    "paragraphs": [
      "A moving object experiences fluid forces determined by its motion relative to the fluid. For a small sphere moving slowly enough that inertial flow effects are negligible, Stokes’ law gives drag magnitude FD = 6πηrv. Drag opposes the relative velocity, and r is sphere radius rather than diameter.",
      "A dense sphere falling in a fluid has downward weight, upward buoyancy, and upward drag. At terminal speed the net force is zero, so drag balances weight minus buoyancy. With uniform sphere and fluid densities, the result is vt = 2(ρsphere − ρfluid)gr²/(9η). A less dense sphere would tend to rise instead.",
      "Within this creeping-flow model, a larger same-density sphere has a larger terminal speed proportional to radius squared. However, increasing size or speed also increases Reynolds number and can invalidate Stokes’ law. Calculate Re using diameter 2r and the predicted speed, then check that it remains much smaller than one.",
      "For larger Reynolds numbers, drag may depend approximately on speed squared over some ranges, and wakes become important. One must not extend the linear Stokes law to a skydiver merely because both objects reach terminal speed. Walls, nearby particles, nonspherical shapes, and changing fluid properties can also alter the simple result. The diagram isolates a small sphere in an effectively unbounded uniform fluid."
    ],
    "terms": [
      [
        "Stokes drag",
        "Linear viscous drag 6πηrv on a sphere in creeping flow."
      ],
      [
        "Terminal speed",
        "Steady speed at which the net force on a moving object is zero."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A tiny sphere has weight 12 μN and buoyancy 4 μN. What upward drag is needed at terminal descent?",
      "reasoning": "Drag must be 12 − 4 = 8 μN, so all three forces sum to zero."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "In the valid Stokes regime, doubling sphere radius at fixed densities and viscosity changes terminal speed by…",
      "options": [
        "a factor of 4.",
        "a factor of 1/2.",
        "no change."
      ],
      "correct": 0,
      "hint": "Use the r² dependence, then check Re again.",
      "feedback": [
        "Correct within the model, whose validity must be rechecked.",
        "That reverses the size dependence for a sphere of fixed density.",
        "Radius strongly affects the force balance."
      ],
      "teacher": "Ask students to reject a numerical result if its predicted Reynolds number violates the starting assumption."
    }
  },
  "transport": {
    "title": "Diffusion, osmosis, and transport",
    "heading": "Random motion can produce a directed net transfer.",
    "subtitle": "Distinguish diffusion, osmosis, dialysis, and active transport.",
    "target": "Distinguish diffusion, osmosis, dialysis, and active transport.",
    "visual": "transport-lab",
    "paragraphs": [
      "Individual molecules move irregularly because of thermal motion and collisions. If one region contains more of a substance than another, more particles generally cross from the concentrated side than return during the same interval. This statistical imbalance produces net diffusion down a concentration gradient without every molecule moving in that direction.",
      "For a simple one-dimensional steady gradient, Fick’s law gives particle transfer rate approximately DAΔC/L in magnitude. D is the diffusion coefficient, A is area, ΔC is concentration difference, and L is the distance across which it changes. Diffusion over a characteristic distance typically takes time proportional to distance squared; random motion is inefficient for rapid transport across large distances.",
      "A selectively permeable membrane allows some substances to pass more readily than others. Osmosis is solvent transfer, often water, driven by differences in chemical potential. For simple dilute solutions at equal initial pressure, water tends toward the side with more dissolved particles that cannot cross. A growing pressure difference can oppose that transfer; ideal dilute osmotic pressure is approximately Π = nRT/V for solute particle amount n.",
      "Dialysis uses selective permeability to allow diffusible solutes to exchange while retaining larger components. Active transport uses energy to move substances against the direction of spontaneous transfer. The diagram distinguishes solvent, retained solute, and allowed passage; a real membrane’s selectivity and transport proteins determine which simplified description applies."
    ],
    "terms": [
      [
        "Diffusion",
        "Net spreading caused by random molecular motion and concentration differences."
      ],
      [
        "Osmosis",
        "Solvent transfer through a selectively permeable membrane driven by chemical-potential differences."
      ],
      [
        "Active transport",
        "Energy-requiring transport against a spontaneous gradient."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "If diffusion across a distance takes 2 seconds, estimate the time across three times that distance under the same conditions.",
      "reasoning": "The characteristic time grows as distance squared, so the estimate is 9 × 2 = 18 seconds."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Across a membrane that passes water but retains solute, initially equal-pressure dilute solutions tend to transfer water toward…",
      "options": [
        "the side with more retained solute particles per volume.",
        "the side with fewer retained solute particles per volume.",
        "neither side under every condition."
      ],
      "correct": 0,
      "hint": "State the equal-pressure and selective-permeability assumptions.",
      "feedback": [
        "Correct under these initial conditions; a pressure difference can later oppose the transfer.",
        "That reverses the initial osmotic tendency.",
        "A solute imbalance can drive solvent transfer."
      ],
      "teacher": "Ask students to identify the moving species and the energy source before naming the transport process."
    }
  }
} satisfies Record<string, LessonContent>
