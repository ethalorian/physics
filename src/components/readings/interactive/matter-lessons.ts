import type { LessonContent } from './lesson-contract'
export const matterLessons = {
  "elements": {
    "title": "Elements",
    "heading": "Count protons to identify the element.",
    "subtitle": "Distinguish an element from a mixture or compound.",
    "target": "Distinguish an element from a mixture or compound.",
    "visual": "atom-builder",
    "paragraphs": [
      "The ordinary materials around us are built from atoms. An element contains atoms with one particular number of protons in the nucleus. Hydrogen atoms have one proton, carbon atoms have six, and oxygen atoms have eight. That proton count, called atomic number, identifies the element regardless of the material’s shape or location.",
      "The periodic table organizes elements by atomic number and recurring chemical behavior. The recognized table includes elements 1 through 118. Many occur naturally; others have been produced in laboratories. The older source’s element count reflects its publication date. Element symbols provide a compact language for describing what materials contain.",
      "An element is not necessarily made from isolated single atoms. Oxygen gas usually contains pairs of oxygen atoms bonded as O₂; it is still an element because every atom has eight protons. Water contains both hydrogen and oxygen in a definite chemical arrangement, making it a compound. Air contains several substances together and is a mixture.",
      "Most hydrogen formed early in cosmic history. Many heavier nuclei formed through processes in stars and stellar events before becoming part of Earth. This history concerns nuclear formation, whereas ordinary chemistry mainly rearranges electrons and bonds. Melting a sample or combining it chemically does not by itself change one element’s nuclei into another element."
    ],
    "terms": [
      [
        "Element",
        "Substance whose atoms share one atomic number."
      ],
      [
        "Atomic number",
        "Number of protons in an atomic nucleus."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A sample contains O₂ molecules and nothing else. Is it an element or a compound?",
      "reasoning": "It is an element. Each molecule contains two atoms, but both are oxygen; a compound requires different elements."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which change necessarily changes the element?",
      "options": [
        "Removing one electron.",
        "Adding one neutron.",
        "Changing the number of protons."
      ],
      "correct": 2,
      "hint": "The atomic number defines identity.",
      "feedback": [
        "That changes charge, making an ion.",
        "That changes isotope, not element.",
        "Correct. A different proton count is a different atomic number."
      ],
      "teacher": "Separate atom count, proton count, and element count. Reference table: https://iupac.org/what-we-do/periodic-table-of-elements/"
    }
  },
  "scale": {
    "title": "Atoms are small",
    "heading": "Use powers of ten to see the scale gap.",
    "subtitle": "Compare atomic, nuclear, and visible-light length scales.",
    "target": "Compare atomic, nuclear, and visible-light length scales.",
    "visual": "atomic-scale",
    "paragraphs": [
      "An atom’s characteristic size is roughly 10⁻¹⁰ m, although the exact size depends on the element and how its boundary is defined. One millimeter is 10⁻³ m. Dividing these scales shows that about ten million atomic widths fit across a millimeter. Ordinary objects therefore contain enormous numbers of atoms even when they look very small.",
      "A nucleus is much smaller, typically around 10⁻¹⁵ to 10⁻¹⁴ m across. The atomic-to-nuclear length ratio can be tens of thousands or more. Most atomic mass is concentrated in that tiny nucleus, while the electron distribution occupies a much larger region. A drawing with a visibly large nucleus is necessarily changing the relative scale.",
      "Visible light has wavelengths of hundreds of nanometers, far larger than a typical atomic spacing. Increasing magnification alone does not give an ordinary optical microscope atomic spatial resolution. Resolution depends on the physical information carried by the probe and collected by the instrument, not only on how much the resulting image is enlarged.",
      "Electron and scanning-probe instruments can produce images with atomic detail using different physical interactions. Those images are measurements interpreted through an instrument model; they are not photographs of colored miniature balls. Keep length, volume, and particle count separate when comparing scales. A length ratio cubed gives a volume ratio for similar shapes."
    ],
    "terms": [
      [
        "Nanometer",
        "10⁻⁹ meter, a useful unit for microscopic lengths."
      ],
      [
        "Resolution",
        "Ability to distinguish nearby features, different from simple magnification."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "How many widths of 0.1 nm fit along a 1 mm line?",
      "reasoning": "1 mm = 10⁶ nm. Dividing by 0.1 nm gives 10⁷, or ten million widths."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why does enlarging a blurry atomic-scale image not reveal missing structure?",
      "options": [
        "Magnification does not add spatial information.",
        "Atoms have no size.",
        "A millimeter is smaller than an atom."
      ],
      "correct": 0,
      "hint": "Distinguish making an image bigger from resolving two features.",
      "feedback": [
        "Correct. The probe and measurement must first carry the detail.",
        "Atoms have characteristic spatial scales.",
        "A millimeter is millions of atomic widths."
      ],
      "teacher": "Ask students to estimate before calculating and explicitly label powers of ten."
    }
  },
  "recycle": {
    "title": "Atoms are recyclable",
    "heading": "New arrangements can use old atoms.",
    "subtitle": "Track atoms through ordinary chemical and biological changes.",
    "target": "Track atoms through ordinary chemical and biological changes.",
    "visual": "atom-cycle",
    "paragraphs": [
      "A tree grows by taking in matter from its surroundings. Carbon atoms can enter from atmospheric carbon dioxide, hydrogen from water, and other elements from absorbed nutrients. Growth assembles atoms into new structures; it does not create all of the material from nothing. Sunlight supplies energy, while matter crosses the organism’s boundary.",
      "When food is digested or a fallen leaf decomposes, atoms are rearranged into different molecules. Some return to air, soil, or water and can later enter another organism. The identity of a particular material or living structure can be new even when its constituent nuclei formed long before that structure existed.",
      "Ordinary chemical reactions conserve the number of atoms of each element when every input and output is counted. If a burning object seems to lose mass, include the oxygen entering and the gases leaving. A boundary that excludes escaping products does not define a closed material system. Nuclear reactions and radioactive decay can change nuclei, so atoms are not absolutely indestructible under every process.",
      "Claims about the exact previous owner of an atom usually cannot be established from a simple classroom observation. The useful scientific model is cycling and mixing of matter, supported by conservation and measurable exchanges. A tagged-particle diagram tracks a possible route; it does not reconstruct the unique history of an atom in your body."
    ],
    "terms": [
      [
        "Matter cycle",
        "Movement and rearrangement of matter among connected reservoirs."
      ],
      [
        "Closed material system",
        "A system boundary across which no matter passes."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A plant gains carbon while growing in a closed chamber. Where must that carbon have come from?",
      "reasoning": "From carbon already within the chamber, such as carbon dioxide in the air or supplied material. Growth does not create carbon nuclei from sunlight."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "In an ordinary chemical reaction, a carbon atom usually…",
      "options": [
        "turns into pure energy.",
        "remains carbon while its bonding changes.",
        "becomes oxygen when heated."
      ],
      "correct": 1,
      "hint": "Separate chemical rearrangement from nuclear change.",
      "feedback": [
        "Chemical reactions rearrange atoms rather than eliminating their nuclei.",
        "Correct. New molecules can contain the same carbon atoms.",
        "Changing carbon to oxygen requires a nuclear change."
      ],
      "teacher": "Have students draw arrows crossing a system boundary and label matter versus energy."
    }
  },
  "evidence": {
    "title": "Evidence for atoms",
    "heading": "An unseen cause can make a testable visible pattern.",
    "subtitle": "Explain Brownian motion and the role of atomic imaging.",
    "target": "Explain Brownian motion and the role of atomic imaging.",
    "visual": "brownian-lab",
    "paragraphs": [
      "Under a microscope, a tiny suspended grain can wander irregularly even when it is not alive. Neighboring fluid molecules constantly collide with it. The impacts do not balance perfectly at each instant, so the visible grain receives changing pushes. This irregular motion is called Brownian motion and provides evidence for microscopic thermal motion.",
      "The grain is much larger than the individual molecules producing the impacts. Observing its path therefore does not mean that the microscope has directly resolved every water molecule. The explanation connects an invisible mechanism with a measurable statistical effect. Temperature, fluid viscosity, and particle size influence the amount of wandering.",
      "A random walk is a simplified model: take many steps in varying directions and examine the resulting displacement. Distance traveled along the zigzag is different from displacement between the starting and final points. For many independent walks, typical displacement grows roughly with the square root of the number of steps, rather than with the number itself.",
      "Additional evidence comes from scattering, chemical proportions, and instruments that resolve atomic-scale structure. Each method has assumptions and limitations. A strong model explains several kinds of evidence and predicts what should happen when a condition changes. One computer-generated path illustrates that reasoning but does not substitute for experimental data."
    ],
    "terms": [
      [
        "Brownian motion",
        "Irregular movement of a suspended particle caused by molecular impacts."
      ],
      [
        "Random walk",
        "A model made from successive steps with varying directions."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "One walker takes 100 random steps and another takes 400 with the same step length. Compare their typical displacements across many trials.",
      "reasoning": "The root-mean-square displacement scales as √N, so four times the steps gives about twice the typical displacement."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A visible pollen grain’s Brownian motion is mainly caused by…",
      "options": [
        "uneven impacts from surrounding molecules.",
        "the grain deciding where to move.",
        "gravity reversing direction at random."
      ],
      "correct": 0,
      "hint": "Look for a microscopic interaction that fluctuates.",
      "feedback": [
        "Correct. The individual pushes vary over time.",
        "Nonliving grains also show the effect.",
        "Gravity does not randomly reverse to create these paths."
      ],
      "teacher": "Separate one possible path from the statistical prediction for many paths."
    }
  },
  "molecules": {
    "title": "Molecules",
    "heading": "A molecule is a bonded group with a definite structure.",
    "subtitle": "Read molecular formulas without confusing atoms and elements.",
    "target": "Read molecular formulas without confusing atoms and elements.",
    "visual": "molecule-lab",
    "paragraphs": [
      "Atoms can form discrete bonded groups called molecules. A water molecule contains two hydrogen atoms and one oxygen atom, written H₂O. The subscript counts atoms of the preceding element within one molecule. An omitted subscript means one. Thus three water molecules contain six hydrogen atoms and three oxygen atoms.",
      "Molecules can contain a single element or several elements. Oxygen gas O₂ and nitrogen gas N₂ are molecular elements. Water H₂O and carbon dioxide CO₂ are molecular compounds. Molecular structure involves both which atoms are present and how they are connected and arranged; a formula alone may not describe every detail of that structure.",
      "Not all substances consist of separate molecules. A metal forms an extended structure, and sodium chloride forms a lattice of ions. Breaking a salt crystal into smaller pieces does not isolate little NaCl molecules in the same sense that water consists of H₂O molecules. Different bonding models apply to different substances.",
      "Molecules move and collide in gases and liquids. Odor molecules can reach your nose through random molecular motion and air currents; they are not attracted to your nose because you can smell them. A ball-and-stick drawing represents composition and connections. Its colors, rigid rods, and exaggerated atom sizes are conventions for understanding a model, not literal microscopic photographs."
    ],
    "terms": [
      [
        "Molecule",
        "A discrete group of atoms bonded together."
      ],
      [
        "Chemical formula",
        "Symbols and subscripts expressing the composition of a substance or molecule."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "How many atoms and elements occur in one CO₂ molecule?",
      "reasoning": "Three atoms: one carbon and two oxygen. They represent two elements."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which statement about O₂ is correct?",
      "options": [
        "It contains two elements.",
        "It is a molecule of one element.",
        "It must be a compound."
      ],
      "correct": 1,
      "hint": "Count distinct element symbols, not subscripts.",
      "feedback": [
        "Both atoms are oxygen.",
        "Correct. Molecular and elemental are compatible descriptions.",
        "A compound contains more than one element."
      ],
      "teacher": "Ask for both the atom count and the distinct-element count for every formula."
    }
  },
  "compounds": {
    "title": "Compounds",
    "heading": "Bonding creates properties that a mixture does not predict.",
    "subtitle": "Distinguish molecular compounds, ionic compounds, and mixtures.",
    "target": "Distinguish molecular compounds, ionic compounds, and mixtures.",
    "visual": "crystal-lab",
    "paragraphs": [
      "A compound contains different elements chemically combined in a definite composition. Water has hydrogen and oxygen in a two-to-one atom ratio. Carbon dioxide has one carbon for every two oxygen atoms. Changing those proportions can mean a different substance or a mixture; a compound is not simply any collection containing several elements.",
      "Some compounds consist of molecules, but others have extended structures. Solid sodium chloride contains positive sodium ions and negative chloride ions in a repeating lattice. Its formula NaCl records the overall one-to-one ratio. Each ion interacts with several neighbors, so the formula does not imply isolated pairs throughout the crystal.",
      "A compound’s properties can differ greatly from those of its constituent elements. Sodium metal, chlorine gas, and sodium chloride have different structures and interactions. A mixture combines substances without requiring one fixed chemical ratio. Salt water can contain different amounts of dissolved salt, making it a mixture rather than a single compound.",
      "To classify a sample, ask two questions: does it contain one pure chemical substance, and does that substance contain one element or several? A pure molecular element, a pure ionic compound, and a mixture can all be visually uniform. Appearance alone cannot establish chemical identity. The lattice model below is a two-dimensional slice of a three-dimensional structure, with symbols indicating charge rather than actual color."
    ],
    "terms": [
      [
        "Compound",
        "A substance containing different elements chemically combined in definite composition."
      ],
      [
        "Mixture",
        "A combination of substances whose proportions need not be fixed."
      ],
      [
        "Ionic lattice",
        "An extended arrangement of interacting positive and negative ions."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Why is salt water a mixture while pure solid NaCl is a compound?",
      "reasoning": "The dissolved salt concentration can vary in salt water. Pure NaCl has a definite overall ratio of sodium to chloride ions."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "The formula NaCl primarily tells us…",
      "options": [
        "every crystal contains just two atoms.",
        "the overall sodium-to-chloride ratio is one to one.",
        "salt is a mixture of loose sodium and chlorine."
      ],
      "correct": 1,
      "hint": "An ionic formula describes composition in an extended structure.",
      "feedback": [
        "A visible crystal contains enormous numbers of ions.",
        "Correct. The lattice repeats that composition.",
        "Chemical bonding creates a different substance."
      ],
      "teacher": "Ask students to compare a molecule picture with an extended lattice and identify where each model ends."
    }
  },
  "nucleus": {
    "title": "The atomic nucleus",
    "heading": "Most mass occupies a tiny central region.",
    "subtitle": "Connect scattering evidence with protons, neutrons, and isotopes.",
    "target": "Connect scattering evidence with protons, neutrons, and isotopes.",
    "visual": "atom-builder",
    "paragraphs": [
      "In the gold-foil experiment, most alpha particles passed through a thin foil with little deflection, but some scattered through large angles. A model with positive charge spread diffusely throughout each atom could not account well for the rare strong deflections. Concentrating positive charge and most mass into a small nucleus explained the pattern.",
      "The nucleus contains protons and, except for ordinary hydrogen, neutrons. Protons carry positive electric charge; neutrons carry no net charge. Both are much more massive than electrons. The atomic number Z counts protons. The mass number A counts protons plus neutrons in a particular isotope and is an integer, unlike a naturally averaged atomic weight.",
      "Isotopes of an element share Z but differ in neutron count. Carbon-12 and carbon-14 both have six protons; they contain six and eight neutrons respectively. Adding a neutron changes isotope. Changing the proton count changes element. Changing electrons changes the atom’s charge state instead of its nuclear identity.",
      "The nucleus occupies only a tiny fraction of the atomic volume. Describing an atom as mostly empty space emphasizes that scale difference, but does not mean objects can freely pass through each other. Electron distributions, electromagnetic interactions, and quantum rules govern how atoms resist overlap. The builder is a counting model, not a prediction that every chosen nucleus is stable."
    ],
    "terms": [
      [
        "Nucleon",
        "A proton or neutron in an atomic nucleus."
      ],
      [
        "Isotope",
        "An atom with a particular proton and neutron count; isotopes of one element differ in neutrons."
      ],
      [
        "Mass number",
        "Total number of protons and neutrons in a nucleus."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "An isotope has Z = 8 and A = 18. Find its proton and neutron counts.",
      "reasoning": "It contains 8 protons and 18 − 8 = 10 neutrons. It is oxygen-18."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Two atoms have six protons but different neutron counts. They are…",
      "options": [
        "different elements.",
        "isotopes of the same element.",
        "necessarily oppositely charged ions."
      ],
      "correct": 1,
      "hint": "Element identity follows proton count.",
      "feedback": [
        "Their identical atomic numbers make both carbon.",
        "Correct. Neutron count distinguishes their isotopes.",
        "Electron count, not neutron count, determines their net atomic charge."
      ],
      "teacher": "Connect the counting model to the rare large-angle scattering evidence, and discuss model scale."
    }
  },
  "electrons": {
    "title": "Electrons in the atom",
    "heading": "Charge and chemistry depend on the electron arrangement.",
    "subtitle": "Distinguish neutral atoms, ions, and electron energy levels.",
    "target": "Distinguish neutral atoms, ions, and electron energy levels.",
    "visual": "atom-builder",
    "paragraphs": [
      "A neutral atom has as many electrons as protons, because their charges are equal in magnitude and opposite in sign. Removing an electron leaves a positive ion; adding an electron produces a negative ion. The nucleus can remain unchanged in either process, so ion formation normally leaves the element’s identity intact.",
      "Electrons have much less mass than protons or neutrons. They occupy quantum states around the nucleus with allowed energies. Shell diagrams group states into energy levels and can help organize periodic behavior, but electrons do not follow the definite little planetary tracks suggested by a simple orbit drawing. Their spatial distributions are described by quantum models.",
      "Outer electrons play a central role in chemical interactions. Atoms with related outer-electron patterns often have related chemical behavior, producing repeating patterns across the periodic table. The atomic number orders that table; the proton count also tells you the electron count of a neutral atom, but not of an ion unless its charge is specified.",
      "When an electron changes allowed energy states, energy must be exchanged, for example through absorption or emission of light. Charge is conserved in ionization: a removed electron still exists elsewhere in the complete system. Always count the atom and any transferred electrons before claiming that charge has been created or destroyed."
    ],
    "terms": [
      [
        "Ion",
        "An atom or group with net electric charge after an imbalance of protons and electrons."
      ],
      [
        "Electron shell",
        "A grouping of quantum electron states by principal energy level."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "An oxygen atom has eight protons and gains two electrons. What is its charge?",
      "reasoning": "It now has ten electrons and eight protons, so its charge is −2e. It remains oxygen."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Removing one electron from a neutral atom produces…",
      "options": [
        "a positive ion.",
        "a different element.",
        "an additional neutron."
      ],
      "correct": 0,
      "hint": "Subtract a negative charge from a neutral total.",
      "feedback": [
        "Correct. One proton charge is no longer balanced by an electron.",
        "Its proton count has not changed.",
        "Removing an electron does not create a neutron."
      ],
      "teacher": "Use the builder to change electron count while keeping proton and neutron counts fixed."
    }
  },
  "phases": {
    "title": "Phases of matter",
    "heading": "Structure and freedom of motion shape bulk behavior.",
    "subtitle": "Compare solids, liquids, gases, and plasmas and identify fluids.",
    "target": "Compare solids, liquids, gases, and plasmas and identify fluids.",
    "visual": "phase-lab",
    "paragraphs": [
      "A solid ordinarily maintains a shape and volume because its particles remain near persistent relative positions. They can vibrate; solid does not mean motionless. A liquid retains approximately fixed volume but changes shape to match its container because neighboring particles can rearrange and slide past one another.",
      "A gas spreads to fill its available container. Its particles are much farther apart on average than particles in an ordinary liquid or solid, making it comparatively easy to compress. A plasma contains a significant population of mobile charged particles and responds strongly to electric and magnetic fields. It is not simply another name for any hot neutral gas.",
      "A fluid cannot sustain a static shear stress in the way an ordinary solid can; it keeps deforming under an applied shear. Liquids and gases are fluids. This definition concerns response to stress, not whether a substance feels wet. Viscosity describes resistance to flow, so two fluids can flow at very different rates under the same conditions.",
      "Changing phase rearranges the collective state of matter rather than automatically changing its elements. Melting ice preserves water molecules while changing their organization. Heating enough to ionize matter involves changes to electron binding as well. Particle sketches are schematic snapshots, not to scale, and real phase behavior depends on temperature, pressure, and the material’s interactions."
    ],
    "terms": [
      [
        "Fluid",
        "Material that continually deforms under an applied shear stress."
      ],
      [
        "Plasma",
        "A state containing mobile charged particles with collective electromagnetic behavior."
      ],
      [
        "Phase",
        "A bulk state with characteristic structure and physical behavior."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "Water is poured from a wide bowl into a tall narrow container. What stays approximately fixed, assuming no loss or compression?",
      "reasoning": "Its volume and mass stay approximately fixed, while its shape changes."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Which observation best distinguishes an ordinary liquid from an ordinary gas?",
      "options": [
        "Only the liquid contains moving particles.",
        "The gas is much easier to compress.",
        "Only the gas is a fluid."
      ],
      "correct": 1,
      "hint": "Compare average particle spacing.",
      "feedback": [
        "Particles move in both.",
        "Correct. Gas particles have much larger average separations.",
        "Both flow under shear."
      ],
      "teacher": "Ask students to identify what each particle sketch can and cannot show."
    }
  },
  "crystal": {
    "title": "Crystal structure",
    "heading": "A repeating pattern can leave a measurable signature.",
    "subtitle": "Relate crystal organization to diffraction and distinguish amorphous solids.",
    "target": "Relate crystal organization to diffraction and distinguish amorphous solids.",
    "visual": "crystal-lab",
    "paragraphs": [
      "In a crystal, atoms, ions, or molecules follow a repeating arrangement over extended distances. The arrangement can produce characteristic faces and angles in a visible sample, but a rough outside shape does not rule out crystalline order. Many everyday pieces contain numerous small crystal grains oriented in different directions.",
      "X-ray diffraction probes that internal order. Waves scattered from regularly spaced particles reinforce one another in particular directions and cancel in others. The pattern provides evidence about spacing and arrangement. It is not simply a magnified shadow of the outside of the specimen. A model must connect the measured pattern to a proposed internal structure.",
      "An amorphous solid, such as ordinary glass, lacks the same long-range repeating order while retaining local structure and resistance to shear. It should not be pictured as particles with no interactions or as an ordinary liquid freely flowing on classroom timescales. Crystalline and amorphous describe organization, not whether atoms exist.",
      "In sodium chloride, positive and negative ions form a three-dimensional repeating structure. A two-dimensional checkerboard is a useful slice but does not show all neighbors. Defects and grain boundaries occur in real crystals and can affect material behavior. The idealized model isolates regular spacing so you can compare order with disorder without confusing either with thermal motion."
    ],
    "terms": [
      [
        "Crystal",
        "A solid with an extended repeating arrangement of constituent particles."
      ],
      [
        "Amorphous solid",
        "A solid lacking long-range periodic particle order."
      ],
      [
        "Diffraction",
        "Wave interference after scattering or passage around structure."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A metal has an irregular outside shape but gives a characteristic crystalline diffraction pattern. Is that a contradiction?",
      "reasoning": "No. Its internal grains can have repeating order even if the macroscopic outside shape is irregular."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A diffraction pattern primarily helps reveal…",
      "options": [
        "internal particle arrangement.",
        "only the sample’s paint color.",
        "whether atoms are completely stationary."
      ],
      "correct": 0,
      "hint": "The scattered waves depend on spacing and order.",
      "feedback": [
        "Correct. Interference connects the pattern to internal structure.",
        "Color is not what the X-ray pattern measures here.",
        "Atoms can vibrate in a crystal."
      ],
      "teacher": "Have students state which dimensions the checkerboard omits."
    }
  },
  "density": {
    "title": "Density",
    "heading": "Compare mass per volume, not mass alone.",
    "subtitle": "Calculate density, weight density, and specific gravity with consistent units.",
    "target": "Calculate density, weight density, and specific gravity with consistent units.",
    "visual": "density-lab",
    "paragraphs": [
      "Density is mass divided by volume: ρ = m/V. A large block can contain more mass than a small block of the same material while having the same density. Cutting a uniform sample in half divides both mass and volume by two, leaving their ratio unchanged if temperature and pressure stay the same.",
      "The SI unit is kilograms per cubic meter. A useful conversion is 1 g/cm³ = 1000 kg/m³, because both the mass unit and the cubed length unit change. Water’s density is approximately 1000 kg/m³ under familiar conditions. Thus a liter, which is 0.001 m³, contains about one kilogram of water.",
      "Density depends on both the masses of the constituent particles and their arrangement and spacing. The material with the heaviest individual atom need not have the largest bulk density. Porous objects also contain voids, so their average density can differ substantially from the density of the solid material forming their walls.",
      "Weight density is weight per volume, ρg, with units N/m³. Specific gravity is a ratio to a reference density, commonly water, and has no units. Compressing a sealed sample without losing mass increases its density by reducing volume. Changing gravity alone changes weight density, while mass density remains the same if the volume does not change."
    ],
    "terms": [
      [
        "Density",
        "Mass per unit volume, ρ = m/V."
      ],
      [
        "Specific gravity",
        "Dimensionless density ratio relative to a specified reference, usually water."
      ],
      [
        "Weight density",
        "Weight per unit volume, equal to ρg."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A 0.60 kg sample occupies 0.00020 m³. Find its density and specific gravity relative to water.",
      "reasoning": "ρ = 3000 kg/m³. Dividing by 1000 kg/m³ gives specific gravity 3.0."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "A uniform sample is cut in half without compression. Its density…",
      "options": [
        "halves.",
        "stays the same.",
        "doubles."
      ],
      "correct": 1,
      "hint": "Both mass and volume change by the same factor.",
      "feedback": [
        "Its mass halves, but so does its volume.",
        "Correct. The ratio m/V is unchanged.",
        "No mass has been packed into less volume per unit mass."
      ],
      "teacher": "Ask for units at every step and distinguish material density from average density including voids."
    }
  },
  "beam": {
    "title": "Compression and tension",
    "heading": "Bending stretches one side and compresses the other.",
    "subtitle": "Locate tension, compression, and the neutral layer for different beam supports.",
    "target": "Locate tension, compression, and the neutral layer for different beam supports.",
    "visual": "beam-bending",
    "paragraphs": [
      "A beam can look almost rigid while deforming enough to support a load. Compression shortens material; tension stretches it. When a beam bends, one side follows a longer arc and the other a shorter arc. Between them lies a neutral layer with approximately zero longitudinal bending strain in the simple elastic model.",
      "A beam supported at both ends and loaded downward in the middle sags: its upper region is compressed and its lower region is stretched. A cantilever fixed at one end and loaded downward at the free end bends the other way relative to its local curvature: the upper region is in tension and the lower region is compressed. Support conditions matter.",
      "An I-beam places much material in flanges far from the neutral axis. Those regions contribute strongly to resisting bending. The connecting web holds the flanges apart and carries shear; it is not useless material just because longitudinal bending stress is small near the neutral axis. Removing material there can still affect shear strength and stability.",
      "Real structural design must also consider buckling, connections, local damage, material limits, and the direction of loading. The diagram compares idealized bending strain, not safe load ratings. It exaggerates curvature so the change in layer length is visible. Explain a beam by identifying supports and loads before applying a memorized rule about which side stretches."
    ],
    "terms": [
      [
        "Tension",
        "Loading that tends to stretch material."
      ],
      [
        "Compression",
        "Loading that tends to shorten material."
      ],
      [
        "Neutral layer",
        "Layer with zero longitudinal bending strain in the simple beam model."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A simply supported beam carries a downward middle load. Which side is in tension?",
      "reasoning": "The lower side follows the longer arc and is stretched; the upper side is compressed."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Why does an I-beam have substantial material far from the neutral axis?",
      "options": [
        "It improves resistance to bending.",
        "The web never carries any stress.",
        "It prevents every possible structural failure."
      ],
      "correct": 0,
      "hint": "Bending strain increases with distance from the neutral layer.",
      "feedback": [
        "Correct. Flanges use material effectively for that bending direction.",
        "The web can carry important shear stress.",
        "Other failure modes and design conditions remain."
      ],
      "teacher": "Switch support conditions and require students to revise the tension/compression labels."
    }
  },
  "scaling": {
    "title": "Scaling",
    "heading": "Length, area, and volume grow at different rates.",
    "subtitle": "Predict how geometric scaling changes support stress and surface-to-volume ratio.",
    "target": "Predict how geometric scaling changes support stress and surface-to-volume ratio.",
    "visual": "scaling-lab",
    "paragraphs": [
      "Enlarge every linear dimension of an object by a factor s while keeping its shape and material. Each area grows by s² and volume grows by s³. At unchanged density, mass and weight also grow by s³. Doubling a model therefore creates four times the cross-sectional area but eight times the mass.",
      "If a support’s load capacity is limited by a fixed allowable material stress, its capacity roughly follows cross-sectional area. The weight-to-area ratio then grows in proportion to s. A geometrically scaled giant cannot keep the same support stresses simply because all parts look proportionally similar. Real structures often need changed proportions or different materials as they grow.",
      "Surface area also grows by s², so surface area per volume decreases as 1/s. This helps explain why small pieces exchange heat or dissolve more rapidly per unit mass under comparable conditions. Breaking one cube into smaller cubes increases exposed surface without increasing total volume, provided the newly exposed faces are accessible.",
      "Geometry is only part of the explanation. Heat transfer depends on temperature difference and surface conditions; biological systems add circulation and regulation. Buckling can limit a slender support before a simple compressive-strength estimate does. Use the scaling law to identify a trend under explicit assumptions, then ask which additional physical mechanism could change the real outcome."
    ],
    "terms": [
      [
        "Scale factor",
        "Ratio of corresponding lengths in geometrically similar objects."
      ],
      [
        "Surface-to-volume ratio",
        "Exposed area divided by volume; it decreases as similar objects get larger."
      ]
    ],
    "worked": {
      "title": "Work it through",
      "prompt": "A same-material model is enlarged threefold in every dimension. Compare mass, support area, and weight per support area.",
      "reasoning": "Mass becomes 27 times larger, area 9 times larger, and weight per area 3 times larger."
    },
    "check": {
      "title": "Predict and explain",
      "prompt": "Doubling every side of a cube changes its surface-to-volume ratio by a factor of…",
      "options": [
        "2.",
        "1/2.",
        "8."
      ],
      "correct": 1,
      "hint": "Divide the area factor by the volume factor.",
      "feedback": [
        "Area grows more slowly than volume.",
        "Correct. 4/8 = 1/2.",
        "Eight is the volume factor alone."
      ],
      "teacher": "Have students distinguish total surface area from surface area per unit mass."
    }
  }
} satisfies Record<string, LessonContent>
