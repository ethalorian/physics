import type {LessonContent} from './lesson-contract'
export const electrostaticsLessons:Record<string,LessonContent> = {
  "charge": {
    "title": "Electrical forces and charges",
    "heading": "Explain interactions by keeping track of both signs.",
    "subtitle": "Electrical forces and charges",
    "target": "Explain interactions by keeping track of both signs.",
    "visual": "charge-count",
    "paragraphs": [
      "Electric charge is a property that determines how an object participates in electric interactions. Electrons carry negative charge and protons carry positive charge of equal magnitude. The sign convention is a choice of names, not a statement that one kind contains more energy. Two like point charges repel; opposite point charges attract along their line of separation.",
      "Ordinary matter contains enormous amounts of both signs. A neutral atom has equal numbers of protons and electrons, so its net charge is zero. Neutral does not mean that charged constituents have disappeared. Removing one electron leaves a positive ion; adding one leaves a negative ion. In ordinary static charging, electrons can transfer while the nuclei remain in their materials.",
      "The elementary charge magnitude is e = 1.602 × 10⁻¹⁹ C. An electron has charge −e and a proton +e. Their masses are very different, but their charge magnitudes are equal. Neutrons have zero net electric charge. An atomic sketch that groups the particles is a bookkeeping model, not a picture of electrons following classical planetary orbits.",
      "Electric interactions help explain the structure and contact forces of everyday matter. A neutral object can still be attracted when its charge distribution changes near a charged object. Therefore, attraction alone does not prove that two objects carry opposite net charges. Start with net charge, then ask whether charge can move or shift inside the objects."
    ],
    "terms": [
      [
        "electric charge",
        "A signed physical property governing electric interactions."
      ],
      [
        "neutral",
        "Having zero total electric charge."
      ],
      [
        "ion",
        "An atom or molecule with nonzero net electric charge."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "An ion contains 8 protons and 10 electrons. Find its net charge.",
      "reasoning": "Q = (8 − 10)e = −2e = −3.204 × 10⁻¹⁹ C. Its negative sign indicates two excess electrons."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A neutral atom contains…",
      "options": [
        "Equal positive and negative total charge",
        "No charged particles",
        "Electrons with no electric charge"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the signed charges sum to zero.",
        "Neutrality describes the total, not the absence of constituents.",
        "Every electron still carries −e."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the signed charges sum to zero."
    }
  },
  "conservation": {
    "title": "Conservation of charge",
    "heading": "Choose a boundary before balancing the charge account.",
    "subtitle": "Conservation of charge",
    "target": "Choose a boundary before balancing the charge account.",
    "visual": "charge-transfer",
    "paragraphs": [
      "When two initially neutral materials become oppositely charged after contact and separation, charge has been transferred between them. In the simple electron-transfer model, the material gaining electrons becomes negative and the material losing them becomes positive. Rubbing creates repeated contact and separation; it does not manufacture a net supply of electric charge.",
      "For an isolated system, the algebraic sum of all charges stays constant. A subsystem can gain charge when charge crosses its boundary. If a student and a floor exchange charge, the student's charge alone need not be conserved, while the total of student plus floor is conserved when no charge enters or leaves that larger boundary.",
      "For ordinary isolated objects charged by electron transfer, the net charge changes in integer steps of e. A macroscopic charge may correspond to billions of electrons, so the steps are too small to notice directly. Quarks have fractional charges within composite particles; this does not allow a rubbed balloon to lose half an electron. Charge conservation also survives processes in which particles are created or destroyed: an electron–positron pair has total charge zero.",
      "Use the two-object account to move electrons in either direction. The visible symbols stand for small counts, while the same signed arithmetic applies to macroscopic transfers. Always include any ground connection in the account. Ground can supply or accept charge; calling an object grounded does not mean charge has vanished from the universe."
    ],
    "terms": [
      [
        "conservation of charge",
        "The total electric charge of an isolated system remains constant."
      ],
      [
        "elementary charge",
        "The magnitude e of a proton charge or electron charge."
      ],
      [
        "system boundary",
        "The chosen separation between a system and its surroundings."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Object A starts at −3 nC and B at +1 nC. After contact A is −1 nC. Find B.",
      "reasoning": "The initial total is −2 nC. B must be −1 nC so the final total remains −2 nC."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A grounded sphere loses electrons. The sphere–Earth system…",
      "options": [
        "Destroys the departing electrons",
        "Must become neutral regardless of its initial total",
        "Keeps its total charge if no charge crosses the outer boundary"
      ],
      "correct": 2,
      "feedback": [
        "Grounding transfers charge rather than destroying it.",
        "Conservation preserves the initial total, which need not be zero.",
        "Correct: the transferred charge is still inside the combined system."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the transferred charge is still inside the combined system."
    }
  },
  "coulomb": {
    "title": "Coulomb’s law",
    "heading": "Use the charge product and the square of separation.",
    "subtitle": "Coulomb’s law",
    "target": "Use the charge product and the square of separation.",
    "visual": "coulomb-lab",
    "paragraphs": [
      "For two stationary point charges in vacuum, the force magnitude is F = k|q₁q₂|/r², where r is their separation and k ≈ 8.99 × 10⁹ N·m²/C². The force acts along the line joining them. Charge signs determine attraction or repulsion; the absolute value in the magnitude formula prevents a negative force magnitude.",
      "Doubling either charge doubles the force at the same separation. Doubling both charges multiplies it by four. Doubling separation divides it by four. These changes can compensate: doubling each charge and doubling their separation leaves the magnitude unchanged. Convert microcoulombs to coulombs and centimeters to meters before substituting in SI units.",
      "Each charge experiences an equal-magnitude, opposite-direction force from the other, even when their charges or masses differ. These two forces act on different recipients and do not cancel in a free-body diagram for either particle. With more than two sources, add the individual force vectors on the selected recipient. Adding only their magnitudes can give the wrong result.",
      "The point-charge model is appropriate when object size is small compared with separation, or when symmetry justifies an equivalent point source. Nearby conducting objects can redistribute charge and require a different calculation. Comparing electric and gravitational forces on an electron and proton gives a ratio around 2.3 × 10³⁹, independent of separation in these inverse-square models. Comparing the numerical values of k and G alone is insufficient because their units and the source properties differ."
    ],
    "terms": [
      [
        "Coulomb’s law",
        "The inverse-square force law for stationary point charges."
      ],
      [
        "coulomb",
        "The SI unit of electric charge, symbol C."
      ],
      [
        "superposition",
        "Adding the separate contributions to obtain a resultant."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Charges +2 μC and −3 μC are 0.30 m apart in vacuum. Find their force.",
      "reasoning": "F = (8.99 × 10⁹)(2 × 10⁻⁶)(3 × 10⁻⁶)/(0.30)² ≈ 0.599 N. Both forces are attractive and equal in magnitude."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Double both charges and double their separation. The force magnitude…",
      "options": [
        "Quadruples",
        "Stays the same",
        "Doubles"
      ],
      "correct": 1,
      "feedback": [
        "The larger separation cancels the factor of four in the numerator.",
        "Correct: the charge product gains a factor of four and r² also gains four.",
        "Account for both changes, not only one charge."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the charge product gains a factor of four and r² also gains four."
    }
  },
  "materials": {
    "title": "Conductors and insulators",
    "heading": "Distinguish movement through a material from local polarization.",
    "subtitle": "Conductors and insulators",
    "target": "Distinguish movement through a material from local polarization.",
    "visual": "material-charge",
    "paragraphs": [
      "A conductor contains mobile charge carriers that can move through the material in response to an electric field. In a metal, these carriers are electrons; the positive ions of the solid remain near their lattice positions. In a salt solution, both positive and negative ions can transport charge. Conductivity therefore does not always mean a flow of electrons alone.",
      "An insulator has much less mobile charge under ordinary conditions. Added charge can remain localized near the place it was deposited. However, the bound charges inside atoms or molecules can shift slightly. This polarization allows an insulator to respond to an electric field without behaving like a metal wire or acquiring a net charge.",
      "Conducting and insulating behavior depends on material, temperature, impurities, and electric field strength. Semiconductors have carrier populations that can be controlled by doping, light, or applied voltages. This makes them useful for switches, detectors, and electronic devices. An insulator is not an absolute barrier under every condition; a sufficiently large field can produce electrical breakdown.",
      "The model contrasts a mobile-charge redistribution with a small local displacement. It exaggerates the shifts so they are visible and shows charge balance rather than individual electron trajectories. Predict which changes are possible before selecting a material. In a wire surrounded by insulation, the metal provides a continuous conducting path while the surrounding material greatly restricts leakage under the intended operating conditions."
    ],
    "terms": [
      [
        "conductor",
        "A material with charge carriers that can move relatively freely through it."
      ],
      [
        "insulator",
        "A material in which charge does not move freely under the stated conditions."
      ],
      [
        "semiconductor",
        "A material whose carrier population and conductivity can be controlled."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A charged rod approaches an isolated neutral metal object without touching it. Does the object gain net charge?",
      "reasoning": "Its mobile electrons redistribute, but no charge crosses the boundary. It remains neutral while becoming polarized."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Which statement describes a neutral polarized insulator?",
      "options": [
        "Bound charges shift locally without changing total charge",
        "Electrons must flow freely across its entire length",
        "It must acquire a net charge equal to the nearby rod"
      ],
      "correct": 0,
      "feedback": [
        "Correct: redistribution and net charging are different.",
        "Local polarization does not require metallic conduction.",
        "A nearby field alone does not transfer net charge across the boundary."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. redistribution and net charging are different."
    }
  },
  "contact": {
    "title": "Charging by friction and contact",
    "heading": "Conserve total charge while allowing it to redistribute.",
    "subtitle": "Charging by friction and contact",
    "target": "Conserve total charge while allowing it to redistribute.",
    "visual": "contact-charge",
    "paragraphs": [
      "Charging by contact involves charge crossing a boundary where materials meet. Repeated contact and separation during rubbing can transfer electrons between materials. The signs that remain depend on the interacting materials and conditions. A rubbed object can retain charge because an insulating support prevents rapid leakage back to its surroundings.",
      "When two conducting objects touch, charge moves until they reach the same electric potential in electrostatic equilibrium. Equal potential does not generally mean equal charge. Size, shape, and nearby objects affect the charge distribution. The adjustable example uses identical conducting spheres in a symmetric arrangement, so after contact and separation their final charges are equal.",
      "The total charge of the isolated pair is unchanged. If one identical sphere begins at +6 nC and the other at −2 nC, their total is +4 nC and each ends at +2 nC. Both initially had electrons; a positive charge represents an electron deficit relative to neutrality. The process transfers carriers and can dissipate energy while conserving total charge.",
      "If an object is connected to Earth or held by a conducting support, the original two-object boundary is no longer isolated. Include the support and Earth when doing the charge account. For an insulator, deposited charge can stay near the contact point instead of reaching the conducting equilibrium pictured here. Explain which physical assumptions justify equal sharing before using the average formula."
    ],
    "terms": [
      [
        "charging by contact",
        "Transferring charge through direct electrical contact."
      ],
      [
        "triboelectric charging",
        "Charge separation associated with contact and separation of materials."
      ],
      [
        "electrostatic equilibrium",
        "A state with no continuing redistribution of free charge."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Identical isolated spheres begin at +8 nC and −4 nC. They touch and separate symmetrically.",
      "reasoning": "Their total is +4 nC, so each ends at +2 nC. Electrons move to equalize potential; charge is conserved."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Different-sized conducting spheres touch. What must become equal at equilibrium?",
      "options": [
        "Their total charges in every geometry",
        "Their numbers of protons",
        "Their electric potentials"
      ],
      "correct": 2,
      "feedback": [
        "Equal charge requires additional symmetry or equal capacitance.",
        "Protons in the metal lattice do not transfer in this charging model.",
        "Correct: potential equality is the general equilibrium condition."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. potential equality is the general equilibrium condition."
    }
  },
  "induction": {
    "title": "Charging by induction",
    "heading": "Track the order of grounding and removing the source.",
    "subtitle": "Charging by induction",
    "target": "Track the order of grounding and removing the source.",
    "visual": "induction-charge",
    "paragraphs": [
      "A nearby charged object can redistribute mobile charge in a conductor without touching it. A negative rod repels electrons toward the far side of an initially neutral metal sphere. The near side has an electron deficit and the far side an excess, but the sphere as a whole remains neutral while it is isolated.",
      "Grounding the sphere while the negative rod remains nearby provides a path for electrons to leave. If the ground connection is removed first, the sphere retains its positive net charge. Removing the rod afterward lets that charge redistribute over the isolated sphere. The rod supplied an electric influence; it did not donate its own charge through contact.",
      "Order matters. Removing the rod while the ground connection is still present allows the sphere to return toward neutral equilibrium with Earth. Another method uses two touching, insulated spheres: bring up the rod, separate the spheres while the rod remains, then remove the rod. The two spheres retain opposite charges while their combined charge remains the initial total.",
      "Cloud fields can likewise redistribute charge at the ground, but a thunderstorm is a dynamic discharge system beyond this small static model. A lightning protection system intercepts a strike and provides a conducting path to ground; it does not prevent lightning from occurring. Use the sequence controls to explain where each transferred electron goes and why the final sphere charge depends on the order of operations."
    ],
    "terms": [
      [
        "induction",
        "Redistribution of charge caused by a nearby electric influence without direct source contact."
      ],
      [
        "grounding",
        "Connecting an object to a large charge reservoir such as Earth."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A negative rod approaches a neutral sphere. Ground the sphere, disconnect ground, then remove the rod.",
      "reasoning": "Electrons leave through the ground connection. Disconnecting it first traps a positive net charge; removing the rod spreads that charge over the sphere."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Remove the rod before disconnecting ground. What happens in the ideal model?",
      "options": [
        "The rod must lose all its electrons",
        "Charge can return until the sphere is neutral",
        "The sphere must retain the same induced positive charge"
      ],
      "correct": 1,
      "feedback": [
        "There is no direct rod–sphere charge transfer.",
        "Correct: the remaining ground path permits equilibration without the inducing field.",
        "That retained charge requires disconnecting ground while the rod remains."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the remaining ground path permits equilibration without the inducing field."
    },
    "references": [
      {
        "title": "National Weather Service: what lightning protection does",
        "url": "https://www.weather.gov/safety/lightning-rods"
      }
    ]
  },
  "polarization": {
    "title": "Charge polarization",
    "heading": "Explain attraction without inventing net charge.",
    "subtitle": "Charge polarization",
    "target": "Explain attraction without inventing net charge.",
    "visual": "dipole-charge",
    "paragraphs": [
      "A neutral object can contain separated positive and negative charge. In a conductor, mobile carriers can redistribute over the object. In an insulator, electron clouds can shift slightly relative to nuclei, or permanent molecular dipoles can reorient. These changes create polarization without requiring a change in the object's total charge.",
      "Near a positive source, the negative side of a neutral polarized object lies closer to the source than its positive side. Because electric force weakens with distance, the attraction on the near side can exceed the repulsion on the far side. Reversing the source reverses the induced separation but can still produce attraction. This explains why either sign of charged comb can attract neutral paper.",
      "A dipole consists of separated equal and opposite charges. Its dipole moment points from negative to positive and has magnitude p = qℓ, where ℓ is their separation. A uniform field exerts opposite forces that can produce a torque, even though their net force is zero. A nonuniform field can produce a net force as well. The displayed pair is a simple permanent, aligned dipole with exaggerated separation, not a detailed molecular calculation.",
      "Water is polar even though each molecule is neutral. Its uneven charge distribution affects orientation and interactions with ions. Attraction to a charged rod therefore does not prove that the water carries a large net charge. Identify both constituent forces and compare their distances before deciding whether the net force vanishes."
    ],
    "terms": [
      [
        "polarization",
        "Separation or alignment of charge within matter."
      ],
      [
        "electric dipole",
        "A pair or distribution of separated equal and opposite charges."
      ],
      [
        "dipole moment",
        "A vector measuring charge separation, directed from negative toward positive."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A neutral pair has charges ±1 nC. A +1 nC source is 0.10 m from the negative side and 0.12 m from the positive side.",
      "reasoning": "The attraction is 8.99 × 10⁻⁷ N and the repulsion 6.24 × 10⁻⁷ N. Their difference is about 2.75 × 10⁻⁷ N toward the source."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A dipole in an exactly uniform electric field can have…",
      "options": [
        "Zero net force and nonzero torque",
        "A net force from unequal field strengths at its ends",
        "No interaction with the field under any orientation"
      ],
      "correct": 0,
      "feedback": [
        "Correct: equal opposite forces can form a turning couple.",
        "The field strengths are equal in the stipulated uniform field.",
        "The constituent charges still experience forces."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. equal opposite forces can form a turning couple."
    }
  },
  "field": {
    "title": "Electric fields",
    "heading": "Separate the source field from the force on a test charge.",
    "subtitle": "Electric fields",
    "target": "Separate the source field from the force on a test charge.",
    "visual": "point-field",
    "paragraphs": [
      "An electric field assigns a vector to each location. It describes the electric force per unit positive test charge: E = F/q, with units N/C. A test charge is imagined small enough that it does not appreciably rearrange the source charges. The field at a location exists whether or not a test particle is placed there.",
      "For a stationary point source Q in vacuum, the field magnitude is k|Q|/r². Its direction is outward from a positive source and inward toward a negative source. Changing the source charge changes the field. Changing only the small test charge does not change this prescribed source field; instead, its force changes according to F = qE.",
      "A positive test charge feels force along the field and a negative test charge opposite it. Reversing q reverses force, while doubling its magnitude doubles force. Acceleration additionally depends on mass through a = F/m. An electron and proton in the same field therefore do not acquire equal accelerations, despite having equal charge magnitudes.",
      "The model displays a source, a test location, and distinct field and force arrows. Arrow lengths are scaled separately because the quantities have different units. Removing the test charge leaves the source field in place and makes the electric force on that absent charge zero. The point-source expression is undefined at its own location, so the separation control never reaches zero."
    ],
    "terms": [
      [
        "electric field",
        "Electric force per unit positive test charge at a location."
      ],
      [
        "test charge",
        "A probe charge small enough to leave the source distribution effectively unchanged."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A field of 400 N/C points right. Find the force on −2 μC.",
      "reasoning": "F = qE = −8.0 × 10⁻⁴ N along the rightward axis, so the force magnitude is 0.80 mN to the left."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Replace a small +q test charge by −2q at the same position. The source field…",
      "options": [
        "Reverses because the test charge is negative",
        "Doubles because two units of test charge are present",
        "Stays the same while force reverses and doubles"
      ],
      "correct": 2,
      "feedback": [
        "The force reverses, not the field from the unchanged source.",
        "Test charge cancels from the field definition.",
        "Correct: the fixed source determines E; the test charge determines qE."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the fixed source determines E; the test charge determines qE."
    }
  },
  "fieldlines": {
    "title": "Electric field lines and multiple charges",
    "heading": "Add vectors before drawing the field pattern.",
    "subtitle": "Electric field lines and multiple charges",
    "target": "Add vectors before drawing the field pattern.",
    "visual": "field-map",
    "paragraphs": [
      "With several fixed source charges, the field at a point is the vector sum of the individual source fields. Calculate each contribution's magnitude and direction, then add components. Fields pointing in the same direction reinforce. Opposite components can cancel. A zero resultant at one point does not imply that the sources or their separate contributions have disappeared.",
      "For two equal positive charges, the fields cancel at the midpoint. For equal opposite charges, both midpoint contributions point from positive toward negative and therefore reinforce. Far from an equal opposite pair, leading contributions cancel more strongly than for a single charge. The dipole field decreases faster with distance than a point-charge field.",
      "A field line is a drawing whose tangent follows E. Electrostatic lines originate on positive charge and end on negative charge or at infinity. Where a consistent three-dimensional line-density representation is denser, the field is stronger. Lines do not cross at an ordinary nonzero-field point because the field there has a single direction. A field line is not generally a particle trajectory: a particle's velocity can point elsewhere.",
      "The model uses sampled arrows instead of claiming that every visible gap has zero field. Arrows show direction; their lengths are capped for readability, and the probe gives numerical components. Reverse one source and compare the midpoint and off-axis values. Between large, closely spaced opposite plates, these contributions instead produce an approximately uniform field away from edges."
    ],
    "terms": [
      [
        "field line",
        "A curve tangent to the electric field at each ordinary point."
      ],
      [
        "resultant field",
        "The vector sum of all source-field contributions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "At a point, one source contributes 300 N/C east and another 400 N/C north.",
      "reasoning": "The resultant magnitude is √(300² + 400²) = 500 N/C at arctan(400/300) ≈ 53.1° north of east."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At the midpoint between equal opposite charges, the field is…",
      "options": [
        "Undefined because any two field lines must cross",
        "Nonzero, toward the negative charge",
        "Zero because the total source charge is zero"
      ],
      "correct": 1,
      "feedback": [
        "The field is well defined away from the point sources.",
        "Correct: the two field contributions point the same way there.",
        "Zero total charge does not imply zero field at every location."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the two field contributions point the same way there."
    }
  },
  "shielding": {
    "title": "Conductors in electrostatic equilibrium",
    "heading": "Distinguish zero field from zero potential.",
    "subtitle": "Conductors in electrostatic equilibrium",
    "target": "Distinguish zero field from zero potential.",
    "visual": "shield-charge",
    "paragraphs": [
      "Mobile charges in a conductor respond to an electric field. In electrostatic equilibrium they have redistributed so that the total field inside the conducting material is zero. Otherwise free carriers would continue to move. Just outside a smooth conductor surface, the electrostatic field is normal to the surface; a tangential component would drive further redistribution.",
      "The conductor is an equipotential: all its points share one potential. That potential need not be zero. An isolated charged sphere can have a large positive or negative potential while its interior field is zero. For a spherical conductor with no external sources, excess charge is uniformly distributed on its outer surface. Other shapes and nearby sources generally produce nonuniform surface charge.",
      "A closed conducting shell shields an empty, charge-free cavity from external static electric fields. If a charge is placed inside the cavity, induced charge appears on the inner surface and the cavity can have a field. The condition of zero field applies to the metal in equilibrium; it is not permission to declare every hollow region field-free in every situation.",
      "The plotted ideal sphere has V = kQ/R inside and V = kQ/r outside, with zero potential at infinity. Its field is zero inside and kQ/r² radially outside. Real lightning involves changing fields, large currents, and possible damage. A hard-topped metal vehicle with closed windows provides protection through its outer metal structure; rubber tires are not the explanation. The static sphere model is not a full lightning simulation."
    ],
    "terms": [
      [
        "electric shielding",
        "Reduction of an external electric influence by redistribution of charge in a conductor."
      ],
      [
        "equipotential",
        "Having the same electric potential at all points."
      ],
      [
        "surface charge",
        "Charge distributed over a surface."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "An isolated conducting sphere has Q = +2 nC and radius 0.20 m. Find V and E at its center.",
      "reasoning": "V = kQ/R ≈ 89.9 V relative to infinity. E = 0 inside the conductor. A nonzero potential can be spatially constant."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A conductor has E = 0 throughout its material. Its potential must be…",
      "options": [
        "Constant, but not necessarily zero",
        "Zero because field and potential are the same quantity",
        "Larger on the left than the right"
      ],
      "correct": 0,
      "feedback": [
        "Correct: zero field means no spatial potential change in equilibrium.",
        "Field is a gradient; it does not fix the reference value of potential.",
        "A potential difference within the ideal conductor would drive redistribution."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. zero field means no spatial potential change in equilibrium."
    },
    "references": [
      {
        "title": "National Weather Service: lightning and cars",
        "url": "https://www.weather.gov/safety/lightning-cars"
      },
      {
        "title": "National Weather Service: lightning protection systems",
        "url": "https://www.weather.gov/safety/lightning-rods"
      }
    ]
  },
  "energy": {
    "title": "Electrical potential energy",
    "heading": "Use the sign of qΔV to explain energy transfer.",
    "subtitle": "Electrical potential energy",
    "target": "Use the sign of qΔV to explain energy transfer.",
    "visual": "electric-energy",
    "paragraphs": [
      "Electric potential energy belongs to a configuration of interacting charges. Moving a test charge through a prescribed electrostatic field changes that configuration. The field does work Wfield = −ΔU. If no other forces transfer energy and the sources remain fixed, the particle's kinetic energy changes by ΔK = −ΔU.",
      "A convenient relation is ΔU = qΔV, where ΔV = Vfinal − Vinitial and q retains its sign. A positive charge moving to lower potential loses potential energy. A negative charge moving to higher potential also loses potential energy. Both can gain kinetic energy, so saying that every freely accelerated charge moves toward lower voltage is incorrect.",
      "An external agent moving a charge slowly can supply or remove energy while keeping kinetic energy nearly unchanged. In that quasistatic case, its work is Wexternal = ΔU. If it pushes the particle against the electric force, potential energy increases. Distinguish work by the field from work by the external agent; they have opposite signs in this slow-motion limit.",
      "Electrostatic forces are conservative. Their work between two endpoints depends on the endpoint potentials rather than the route. The energy account below accepts either charge sign and shows the potential-energy change and opposite field work. A negative calculated ΔK for a proposed displacement means a particle must supply sufficient initial kinetic energy or receive work from another agent; a particle cannot have negative kinetic energy."
    ],
    "terms": [
      [
        "electric potential energy",
        "Energy associated with a configuration of interacting electric charges."
      ],
      [
        "conservative force",
        "A force whose work between endpoints is independent of path."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A +3 μC charge moves from 12 V to 4 V. Find ΔU and field work.",
      "reasoning": "ΔV = −8 V, so ΔU = −24 μJ and Wfield = +24 μJ. If only the electric force does work, kinetic energy increases by 24 μJ."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A negative charge moves to a higher potential under electric acceleration. Its potential energy…",
      "options": [
        "Must increase because voltage increased",
        "Stays fixed because charge is conserved",
        "Decreases"
      ],
      "correct": 2,
      "feedback": [
        "Potential and potential energy differ by the signed charge.",
        "Charge conservation does not require potential energy to remain constant.",
        "Correct: q is negative and ΔV positive, so qΔV is negative."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. q is negative and ΔV positive, so qΔV is negative."
    }
  },
  "potential": {
    "title": "Electric potential and potential difference",
    "heading": "Read voltage as energy per charge, not stored energy.",
    "subtitle": "Electric potential and potential difference",
    "target": "Read voltage as energy per charge, not stored energy.",
    "visual": "voltage-charge",
    "paragraphs": [
      "Electric potential describes potential energy per unit test charge in a prescribed electrostatic environment. A potential difference is ΔV = ΔU/q. One volt is one joule per coulomb. Potential is a scalar; it has a value and sign relative to a reference, but no vector direction. The electric field is a different quantity, related to how potential changes with position.",
      "Choose the reference explicitly. A battery voltage compares its two terminals. For an isolated point charge, it is often convenient to define zero potential at infinity. Adding the same constant to every potential leaves all potential differences and electric forces unchanged. The phrase higher voltage is incomplete unless the comparison point is known.",
      "Changing the amount of small test charge changes its energy by qΔV without changing the prescribed voltage. This explains why two sources with the same terminal voltage can transfer very different total energies. Charge capacity and the way voltage changes during discharge matter. A high voltage alone is not a measure of the total stored energy or a complete description of an electrical source.",
      "On the particle scale, the electron volt is a useful energy unit: 1 eV = 1.602 × 10⁻¹⁹ J. An electron gaining kinetic energy through a 20 V accelerating potential difference gains 20 eV; an ion with charge magnitude 2e gains 40 eV through the same accelerating voltage magnitude. The electron volt is energy, despite including the word volt."
    ],
    "terms": [
      [
        "electric potential",
        "Electric potential energy per unit test charge relative to a reference."
      ],
      [
        "potential difference",
        "The change in electric potential between two locations."
      ],
      [
        "volt",
        "One joule per coulomb."
      ],
      [
        "electron volt",
        "An energy unit equal to e times one volt."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "An ion with charge +2e accelerates from rest through a 30 V potential drop.",
      "reasoning": "ΔU = (2e)(−30 V) = −60 eV, so it gains 60 eV = 9.61 × 10⁻¹⁸ J of kinetic energy if no other work occurs."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Double the small test charge moved between the same fixed potentials. Then…",
      "options": [
        "The voltage doubles and energy stays fixed",
        "The energy change doubles and the voltage difference stays fixed",
        "Both voltage and energy change double"
      ],
      "correct": 1,
      "feedback": [
        "The energy change is proportional to charge, not inversely proportional.",
        "Correct: ΔU = qΔV separates the test charge from the fixed source potential.",
        "Changing the probe does not change the stipulated source potentials."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. ΔU = qΔV separates the test charge from the fixed source potential."
    }
  },
  "uniform": {
    "title": "Electric potential in a uniform field",
    "heading": "Connect field direction to the downhill direction of potential.",
    "subtitle": "Electric potential in a uniform field",
    "target": "Connect field direction to the downhill direction of potential.",
    "visual": "uniform-voltage",
    "paragraphs": [
      "For a uniform electrostatic field, the potential change is ΔV = −E · Δr. Only the displacement component along the field contributes. A step along E lowers potential, a step opposite E raises it, and a perpendicular step keeps potential unchanged. This relationship describes potential regardless of the sign of any test charge.",
      "Between ideal large parallel plates separated by d, the central field magnitude is |ΔV|/d. Its direction runs from the higher-potential plate toward the lower-potential plate. The units V/m are equivalent to N/C. Keep the sign convention explicit: with the left plate at VA and the right at VB, the x component is Ex = (VA − VB)/d.",
      "The graph joins the plate potentials with a straight line because E is uniform in this approximation. A larger voltage difference over the same gap means a steeper slope and a stronger field. The same voltage difference over twice the distance gives half the field. Shifting both potentials equally moves the graph vertically while preserving its slope and the physical field.",
      "A real finite pair has fringing near the edges. Materials between the plates can polarize, and excessive fields can cause breakdown. The diagram describes the central ideal region and does not calculate a safe operating voltage. Use F = qE for force and ΔU = qΔV for energy; mixing those quantities often causes incorrect units and sign errors."
    ],
    "terms": [
      [
        "uniform electric field",
        "An electric field with constant magnitude and direction in a region."
      ],
      [
        "potential gradient",
        "The spatial rate of change of electric potential."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Parallel plates differ by 120 V and are separated by 0.020 m. Find the central field.",
      "reasoning": "|E| = 120/0.020 = 6000 V/m = 6000 N/C, directed from higher to lower potential."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Both plate potentials increase by 50 V with their difference unchanged. The field…",
      "options": [
        "Stays the same",
        "Increases by 50 N/C",
        "Reverses"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the potential gradient is unchanged.",
        "A common potential offset does not add a field, and the proposed units do not follow.",
        "The ordering of the potentials has not reversed."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the potential gradient is unchanged."
    }
  },
  "pointpotential": {
    "title": "Potential due to a point charge",
    "heading": "Add scalar potentials and vector fields differently.",
    "subtitle": "Potential due to a point charge",
    "target": "Add scalar potentials and vector fields differently.",
    "visual": "point-voltage",
    "paragraphs": [
      "For a point charge Q in vacuum with zero potential at infinity, V = kQ/r. Retain the source charge sign. Positive Q produces positive potential and negative Q negative potential. The magnitude decreases as 1/r, while the field magnitude decreases as 1/r². These different distance dependences make voltage and field distinct measurements.",
      "Potential contributions from multiple fixed point charges add algebraically: V = ΣkQi/ri. Each term is a signed scalar. Field contributions must instead be added as vectors. At the midpoint of an equal positive–negative pair, the potentials cancel to zero while the fields reinforce. Zero potential at a point therefore does not imply zero field there.",
      "At the midpoint of two equal positive charges, the reverse distinction appears: the fields cancel, but the potentials add to a positive value relative to infinity. The value of potential depends on the reference; the field depends on spatial change. Moving a small charge along any path between the same two locations gives the same electrostatic energy change qΔV.",
      "The model shows both scalar potential and the radial field at a selected nonzero distance. Doubling r halves V and quarters E for the same point source. A spherical conductor has the same exterior formula only when the source distribution is spherically symmetric. Inside its conducting material, potential is constant instead of diverging as 1/r. State which physical source is being modeled before applying the point formula."
    ],
    "terms": [
      [
        "point-charge potential",
        "The value kQ/r with zero at infinity for an isolated point charge in vacuum."
      ],
      [
        "scalar superposition",
        "Algebraic addition of signed scalar contributions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A +4 nC point charge is 0.20 m from a location. Find potential and field magnitude.",
      "reasoning": "V ≈ 179.8 V and |E| ≈ 899 N/C. At 0.40 m, these become 89.9 V and 224.8 N/C."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At the midpoint of equal opposite charges, V = 0 relative to infinity. The field is…",
      "options": [
        "Necessarily zero",
        "Impossible to define without placing a real test charge",
        "Nonzero"
      ],
      "correct": 2,
      "feedback": [
        "A zero value is different from a zero spatial gradient.",
        "The fixed sources define the field even without a probe.",
        "Correct: the scalar potentials cancel while the vectors reinforce."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the scalar potentials cancel while the vectors reinforce."
    }
  },
  "equipotential": {
    "title": "Equipotential lines",
    "heading": "Move along a contour without changing electric potential energy.",
    "subtitle": "Equipotential lines",
    "target": "Move along a contour without changing electric potential energy.",
    "visual": "equipotential-charge",
    "paragraphs": [
      "An equipotential surface consists of points with the same electric potential. In a two-dimensional diagram, contours represent intersections with these surfaces. For an isolated point charge, equipotential surfaces are concentric spheres. Moving around one at a fixed radius leaves V = kQ/r unchanged, even though the electric field there can be nonzero.",
      "For a small charge moving along an equipotential, ΔU = qΔV = 0 and the electrostatic field does no work. This statement concerns electric work; another agent might still change the particle's kinetic energy or provide a force needed to follow the chosen path. The field is perpendicular to an equipotential wherever the field is nonzero, because there is no tangential potential gradient.",
      "Contours with the same voltage increment are closer together where the field is stronger. Their spacing is meaningful only when the voltage increments are comparable. Uniform parallel-plate fields have equally spaced equipotential planes for equal voltage steps. A conducting body in electrostatic equilibrium is equipotential throughout its connected material, even if its shape is irregular.",
      "Grounding commonly fixes a conductor's potential near the chosen Earth reference by allowing charge exchange. It does not prescribe that every grounded object's charge is zero: nearby sources can induce surface charge while its potential stays fixed. Use the angle control to move a probe around a contour, then change radius to cross contours. Separate the direction of motion, the field direction, and the energy change."
    ],
    "terms": [
      [
        "equipotential surface",
        "A surface on which electric potential has one constant value."
      ],
      [
        "electric work",
        "Energy transferred by the electric force during a displacement."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A +2 μC charge moves between two points on the same 30 V contour.",
      "reasoning": "ΔV = 0, so ΔU = 0 and electric work is zero. The local field can still be nonzero and perpendicular to the path."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Closely spaced contours show a stronger field only if…",
      "options": [
        "The test charge is negative",
        "The compared contours use the same voltage increment",
        "Every contour is drawn with the same color"
      ],
      "correct": 1,
      "feedback": [
        "The source field does not depend on the probe sign.",
        "Correct: field strength depends on voltage change per distance.",
        "Color is a drawing convention, not a physical condition."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. field strength depends on voltage change per distance."
    }
  },
  "capacitor": {
    "title": "Capacitors and dielectrics",
    "heading": "Identify what stays fixed when the capacitance changes.",
    "subtitle": "Capacitors and dielectrics",
    "target": "Identify what stays fixed when the capacitance changes.",
    "visual": "capacitor-charge",
    "paragraphs": [
      "A capacitor separates equal and opposite charges onto two conductors. If one plate has +Q and the other −Q, the pair remains neutral overall. The stored charge convention Q refers to the magnitude on one plate, not their algebraic total. For an ideal linear capacitor, Q = CV, where V is the potential difference magnitude and capacitance C is measured in farads.",
      "For large parallel plates, C = κε₀A/d when a uniform dielectric fills the gap. Larger area A increases capacitance; greater separation d decreases it. The relative permittivity κ describes the dielectric response, and ε₀ ≈ 8.854 × 10⁻¹² F/m. This formula neglects edge effects and assumes a linear material below breakdown.",
      "A dielectric polarizes, changing the field associated with a given free plate charge. If a charged capacitor is disconnected from its source, Q stays fixed: inserting a dielectric increases C and lowers V. If it remains connected to an ideal voltage source, V stays fixed instead: extra charge flows from the source as C increases. The field E = V/d therefore behaves differently in those two experiments.",
      "Use the source condition control before predicting a change. The isolated comparison fixes Q at the value for vacuum with the selected geometry and initial charging voltage; changing κ then isolates the dielectric effect. A real dielectric has leakage and a finite breakdown strength. Capacitance measures charge per voltage and is different from the maximum voltage that the device can withstand."
    ],
    "terms": [
      [
        "capacitor",
        "A device storing energy by separating charge on conductors."
      ],
      [
        "capacitance",
        "The ratio of separated plate charge magnitude to potential difference for a linear capacitor."
      ],
      [
        "dielectric",
        "An insulating material that polarizes in an electric field."
      ],
      [
        "relative permittivity",
        "The factor κ describing dielectric response relative to vacuum."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 2 μF capacitor is charged to 12 V, disconnected, then filled by a dielectric that doubles C.",
      "reasoning": "Initially Q = 24 μC. It remains 24 μC, while C becomes 4 μF and V = Q/C becomes 6 V."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "A dielectric is inserted while a capacitor stays connected to an ideal battery. Which remains fixed?",
      "options": [
        "Voltage; plate charge increases",
        "Plate charge; voltage decreases",
        "Both voltage and plate charge despite increasing capacitance"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the source maintains V and supplies the additional Q = CV.",
        "That is the isolated-charge case.",
        "Q = CV cannot keep both Q and V fixed when C increases."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the source maintains V and supplies the additional Q = CV."
    }
  },
  "storage": {
    "title": "Electrical energy storage",
    "heading": "Find energy from the area under the charging curve.",
    "subtitle": "Electrical energy storage",
    "target": "Find energy from the area under the charging curve.",
    "visual": "capacitor-energy",
    "paragraphs": [
      "Charging a capacitor requires work to separate charge. As the magnitude Q on either plate grows, its potential difference grows according to V = Q/C for a linear capacitor. Early increments of charge move through a smaller voltage than later increments. Treating all of the final charge as if it moved through the final voltage overestimates the stored energy.",
      "The energy is the area under the voltage-versus-charge curve: U = ½QV = ½CV² = Q²/(2C). The factor one-half follows from the linear rise from zero to the final voltage. Energy is nonnegative for a passive ideal capacitor, even when the labels of the positive and negative terminals are exchanged.",
      "At fixed capacitance, doubling voltage doubles separated charge and quadruples stored energy. At fixed charge, increasing capacitance reduces stored energy. These are different physical constraints. When a dielectric enters an isolated charged capacitor, the loss of field energy can become mechanical work or other energy; when a voltage source remains attached, its energy exchange must also be included.",
      "Capacitors can accumulate energy slowly and transfer it quickly, as in a flash unit. Stored energy divided by discharge time estimates average power only if that energy is actually delivered during the interval. Disconnecting the power source does not automatically remove the stored charge. The graph represents an ideal energy account, not a circuit's detailed time response or instructions for handling charged equipment.",
      "A medical defibrillator is another application of controlled energy storage and rapid delivery. Its shock can interrupt certain life-threatening abnormal heart rhythms so that an effective rhythm can resume. An automated external defibrillator analyzes the rhythm before advising or delivering a shock; a shock is not appropriate for every cardiac arrest. The capacitor calculation here explains an energy source, not a choice of clinical treatment or shock setting."
    ],
    "terms": [
      [
        "capacitor energy",
        "Energy stored in the electric field configuration of a charged capacitor."
      ],
      [
        "charging curve",
        "A graph of voltage against accumulated plate charge."
      ],
      [
        "average power",
        "Energy transferred divided by the time taken."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A 100 μF capacitor is charged to 20 V. Calculate stored energy.",
      "reasoning": "U = ½(100 × 10⁻⁶)(20)² = 0.020 J. At 40 V with the same C it stores 0.080 J."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Why is capacitor energy ½QV rather than QV?",
      "options": [
        "Half the charge must disappear",
        "The two plates cancel half of all electric forces",
        "Its voltage rises from zero during charging"
      ],
      "correct": 2,
      "feedback": [
        "Charge remains conserved.",
        "The factor comes from accumulating work at a changing voltage.",
        "Correct: the charging curve has triangular area for a linear capacitor."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the charging curve has triangular area for a linear capacitor."
    },
    "references": [
      {
        "title": "American Heart Association: what an AED does",
        "url": "https://www.heart.org/en/news/2026/09/08/what-is-an-aed-how-to-use-one-during-a-cardiac-arrest"
      }
    ]
  },
  "generator": {
    "title": "The Van de Graaff generator",
    "heading": "Connect charge delivery, sphere size, field, and potential.",
    "subtitle": "The Van de Graaff generator",
    "target": "Connect charge delivery, sphere size, field, and potential.",
    "visual": "generator-charge",
    "paragraphs": [
      "A Van de Graaff generator uses a moving insulating belt and charge-transfer combs to deliver charge to a conducting dome. In the ideal steady charging picture, deposited charge redistributes over the dome's exterior. A motor supplies energy: raising the dome's potential while continuing to add like charge requires work against electric repulsion.",
      "For an isolated spherical conductor of radius R, potential relative to infinity is V = kQ/R and the exterior surface field is E = kQ/R². Nearby objects and support structures disturb this ideal geometry. The same total charge produces a lower voltage and smaller surface field on a larger isolated sphere.",
      "A different comparison holds when a maximum allowable surface field is specified. Combining the formulas gives |V| = |E|R at the surface. A larger smooth dome can therefore reach a higher voltage before reaching that same surface-field threshold, but it must carry more charge to do so. Do not confuse fixed charge with fixed maximum field.",
      "Gas ionization, surface curvature, contamination, and environmental conditions limit practical operation. A classroom estimate of 3 × 10⁶ V/m for air breakdown is not a universal guarantee; gaps, pressure, and geometry matter. The model compares a chosen charge and radius with this illustrative threshold. A uniformly charged isolated sphere is an ideal source model, not a prediction of a particular generator's rated voltage."
    ],
    "terms": [
      [
        "Van de Graaff generator",
        "A device that transports charge on an insulating belt to a conducting dome."
      ],
      [
        "surface field",
        "The electric field immediately outside a surface."
      ],
      [
        "electrical breakdown",
        "Loss of insulating behavior under sufficiently strong electrical conditions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Compare ideal domes of radius 0.10 m and 0.20 m at the same surface field limit of 3 MV/m.",
      "reasoning": "Vmax = ElimitR gives 0.30 MV and 0.60 MV. The larger dome requires four times the charge at that same field limit."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "At fixed total charge, doubling an isolated dome radius…",
      "options": [
        "Leaves both voltage and field fixed",
        "Halves voltage and quarters surface field",
        "Doubles voltage and leaves field fixed"
      ],
      "correct": 1,
      "feedback": [
        "Both quantities depend on radius.",
        "Correct: V scales as 1/R while E scales as 1/R² for fixed Q.",
        "That mixes the fixed-charge and fixed-field comparisons."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. V scales as 1/R while E scales as 1/R² for fixed Q."
    }
  },
  "biology": {
    "title": "Electric forces in biology",
    "heading": "Account for the medium before predicting molecular forces.",
    "subtitle": "Electric forces in biology",
    "target": "Account for the medium before predicting molecular forces.",
    "visual": "screen-charge",
    "paragraphs": [
      "Biological molecules contain charged groups and uneven charge distributions. Electric interactions contribute to molecular recognition, folding, and binding, but a complete molecular explanation also needs quantum structure, thermal motion, and the surrounding solvent. A pair of bare point charges in vacuum is a useful starting model, not a complete description of a living cell.",
      "Water molecules are neutral polar molecules. Their charge distribution can orient in response to a nearby ion and reduce its electric influence at larger distances. In a simple uniform dielectric model, a pair force is reduced by a relative permittivity κ compared with the same charges and separation in vacuum. That continuum approximation does not resolve individual molecules or guarantee accuracy at atomic distances.",
      "Mobile dissolved ions introduce an additional kind of screening: their concentration redistributes around charged structures. This is distinct from bound-charge polarization of the solvent. The model deliberately isolates only the dielectric factor so that the effect of the medium is visible. It does not assign a numerical screening length or predict biological binding strength.",
      "Cell membranes separate ionic environments and support potential differences across very small distances. Channel and pump activity changes ion transport, connecting electric fields with chemical concentration differences. These processes illustrate why charge distribution and energy matter in biology. A small voltage across a nanometer-scale thickness can correspond to a substantial field, but the response depends on the actual material and conditions."
    ],
    "terms": [
      [
        "screening",
        "Reduction of an electric influence by rearrangement of surrounding charge."
      ],
      [
        "polar molecule",
        "A neutral molecule with a permanent uneven charge distribution."
      ],
      [
        "ion transport",
        "Movement of charged atoms or molecules between regions."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "In an ideal uniform dielectric, κ changes from 1 to 4 while point charges and separation stay fixed.",
      "reasoning": "F = k|q₁q₂|/(κr²), so the force is one-quarter as large. This isolates dielectric polarization and omits mobile-ion screening."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Does a dielectric pair-force model by itself predict DNA binding energy?",
      "options": [
        "No; molecular geometry and other interactions also matter",
        "Yes; all cellular interactions are two charges in vacuum",
        "Yes; the solvent always eliminates every force"
      ],
      "correct": 0,
      "feedback": [
        "Correct: the simplified medium model has limited scope.",
        "Cells contain structured molecules, solvent, and mobile ions.",
        "Screening reduces interactions; it does not universally remove them."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. the simplified medium model has limited scope."
    }
  },
  "applications": {
    "title": "Applications of electrostatics",
    "heading": "Trace charge preparation, electric force, and the resulting motion.",
    "subtitle": "Applications of electrostatics",
    "target": "Trace charge preparation, electric force, and the resulting motion.",
    "visual": "deflect-charge",
    "paragraphs": [
      "Electrostatic technologies control charge and then use electric forces to move or retain material. An electrostatic precipitator charges particles and attracts them toward collection surfaces. Electrostatic coating uses forces on charged droplets to guide deposition. Their performance depends on particle properties, airflow, geometry, and operating conditions; the force law alone does not guarantee a collection percentage.",
      "Xerography forms a charge pattern on a photoconducting surface. Light changes local conductivity, selected regions retain or lose charge, and charged toner responds to the resulting pattern. Transfer and fixing turn that temporary electrostatic pattern into a persistent image. A laser printer can write the light pattern precisely, although the exact polarity and sequence depend on the device.",
      "Some continuous inkjet systems charge droplets and deflect them electrically. This mechanism should not be generalized to every inkjet printer. In an ideal uniform field, a droplet of charge q and mass m accelerates at a = qE/m. With initial horizontal speed vx, zero vertical speed, and field length L, its flight time in the field is L/vx and its vertical displacement is ½(qE/m)(L/vx)².",
      "The exploration shows that ideal deflection while ignoring gravity, air resistance, droplet breakup, and field fringing. Changing charge sign reverses the bend; increasing forward speed reduces the time available to bend. Real designs must include those omitted influences and possible plate collisions. Explain the chain from charge preparation to force to motion instead of saying that voltage simply pulls every object in one direction."
    ],
    "terms": [
      [
        "photoconductor",
        "A material whose electrical conductivity changes with illumination."
      ],
      [
        "electrostatic precipitation",
        "Collection of charged particles using electric forces."
      ],
      [
        "electric deflection",
        "A change in a charged object’s motion caused by an electric field."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "A droplet has q = 1 pC, m = 1 ng, vx = 20 m/s, L = 2 cm, and E = 10 kV/m. Ignore other forces.",
      "reasoning": "a = 10⁴ m/s² and t = 0.001 s, so y = 0.005 m = 5 mm. Reversing q reverses the displacement."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "Double the horizontal speed in the same field region. The ideal deflection magnitude…",
      "options": [
        "Doubles",
        "Stays unchanged because electric force stays the same",
        "Becomes one-quarter as large"
      ],
      "correct": 2,
      "feedback": [
        "Faster forward motion leaves less time for transverse acceleration.",
        "The unchanged force acts for a shorter time.",
        "Correct: time halves, and displacement scales as time squared."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. time halves, and displacement scales as time squared."
    }
  },
  "networks": {
    "title": "Capacitors in series and parallel",
    "heading": "Use node connections to identify equal voltage and equal charge.",
    "subtitle": "Capacitors in series and parallel",
    "target": "Use node connections to identify equal voltage and equal charge.",
    "visual": "capacitor-network",
    "paragraphs": [
      "Capacitors connected between the same two nodes are in parallel. They share the same potential difference V, while their plate charges are Qi = CiV. The charge supplied by the source is the sum of those branch charges, so the equivalent capacitance is Ceq = C₁ + C₂ + …. Adding a parallel capacitor increases the total capacitance.",
      "For a simple series chain of initially uncharged capacitors, the isolated intermediate conductors remain net neutral. Consequently the plate-charge magnitudes are equal along the chain. The individual voltage drops are Vi = Q/Ci and their sum equals the applied voltage. Therefore 1/Ceq = 1/C₁ + 1/C₂ + …. The series equivalent is smaller than the smallest individual capacitance.",
      "In a series pair with different capacitances, the smaller capacitor takes the larger voltage drop. In parallel, different capacitances carry different charges at the same voltage. These are capacitor rules; the familiar resistor series and parallel formulas have a different pattern. Derive each relationship from conserved charge and shared node potentials instead of swapping formulas from memory.",
      "For a mixed network, first identify a subnetwork that really shares both nodes or forms a simple isolated series link. Replace it with its equivalent and continue. Geometric proximity on a drawing does not determine topology. The exploration uses ideal capacitors, zero initial charge, and an ideal voltage source. Precharged intermediate nodes require additional charge constraints and are outside this comparison."
    ],
    "terms": [
      [
        "series capacitors",
        "A simple chain with equal plate-charge magnitudes when intermediate nodes start neutral."
      ],
      [
        "parallel capacitors",
        "Capacitors sharing the same two nodes and voltage."
      ],
      [
        "equivalent capacitance",
        "The capacitance giving the same terminal charge–voltage relation as a network."
      ]
    ],
    "worked": {
      "title": "Reason from the model",
      "prompt": "Connect 2 μF and 6 μF capacitors in series across 12 V.",
      "reasoning": "Ceq = 1.5 μF and Q = 18 μC. The drops are 9 V and 3 V, which sum to 12 V. In parallel, Ceq would be 8 μF."
    },
    "check": {
      "title": "Predict, then explain",
      "prompt": "In an initially uncharged series pair, the smaller capacitance has…",
      "options": [
        "The same voltage drop in every case",
        "The larger voltage drop and equal charge magnitude",
        "The smaller voltage drop and equal charge magnitude"
      ],
      "correct": 1,
      "feedback": [
        "Equal voltage is the parallel rule or the special equal-capacitance case.",
        "Correct: Vi = Q/Ci with a common charge magnitude.",
        "An inverse relationship gives the larger drop to the smaller C."
      ],
      "hint": "Identify the source, the test charge, the system boundary, and what is held fixed.",
      "teacher": "Ask for a prediction when one condition changes. Vi = Q/Ci with a common charge magnitude."
    }
  }
}
