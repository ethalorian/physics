-- Unit 7 concept_exercises chapter upserts (chapters 32-37)

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  32,
  $ch32$Electrostatics$ch32$,
  $ch32$https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte32.pdf$ch32$,
  643,
  $ch32$[
  {
    "id": "32.1",
    "label": "Electrical Forces and Charges",
    "pageStart": 645,
    "pageEnd": 646,
    "items": [
      {
        "n": 1,
        "type": "fill_in",
        "prompt": "The fundamental rule at the base of all electrical phenomena is that like charges ______ and opposite charges ______.",
        "blanks": 2
      },
      {
        "n": 2,
        "type": "fill_in",
        "prompt": "By convention, electrons are ______ charged and protons are ______ charged.",
        "blanks": 2
      },
      {
        "n": 3,
        "type": "true_false",
        "prompt": "Neutrons are attracted to charged particles."
      },
      {
        "n": 4,
        "type": "multiple_choice",
        "prompt": "Compared with an electron, a proton has...",
        "options": [
          {
            "letter": "a",
            "text": "equal mass and equal magnitude of charge"
          },
          {
            "letter": "b",
            "text": "nearly 2000 times the mass and an equal magnitude of charge"
          },
          {
            "letter": "c",
            "text": "nearly 2000 times the mass and 2000 times the charge"
          }
        ]
      },
      {
        "n": 5,
        "type": "short_answer",
        "prompt": "Enormous electrical forces act between the charges in Earth and the charges in your body. Why is your weight due only to gravity?"
      }
    ]
  },
  {
    "id": "32.2",
    "label": "Conservation of Charge",
    "pageStart": 646,
    "pageEnd": 648,
    "items": [
      {
        "n": 6,
        "type": "fill_in",
        "prompt": "A charged atom is called an ______.",
        "blanks": 1
      },
      {
        "n": 7,
        "type": "fill_in",
        "prompt": "The principle that electrons are neither created nor destroyed but simply transferred from one material to another is called ______ of ______.",
        "blanks": 2
      },
      {
        "n": 8,
        "type": "true_false",
        "prompt": "An object that has more electrons than protons is positively charged."
      },
      {
        "n": 9,
        "type": "multiple_choice",
        "prompt": "When a rubber rod is rubbed with fur, the rod becomes...",
        "options": [
          {
            "letter": "a",
            "text": "positively charged, because protons move onto it"
          },
          {
            "letter": "b",
            "text": "negatively charged, because electrons transfer from the fur to the rod"
          },
          {
            "letter": "c",
            "text": "neutral, because the charges cancel"
          }
        ]
      },
      {
        "n": 10,
        "type": "true_false",
        "prompt": "An object can carry a charge equal to 1.5 times the charge of one electron."
      }
    ]
  },
  {
    "id": "32.3",
    "label": "Coulomb's Law",
    "pageStart": 648,
    "pageEnd": 650,
    "items": [
      {
        "n": 11,
        "type": "fill_in",
        "prompt": "Coulomb's law: the force between two charged objects varies directly as the product of the ______ and inversely as the square of the ______ between them.",
        "blanks": 2
      },
      {
        "n": 12,
        "type": "fill_in",
        "prompt": "The SI unit of charge is the ______, the charge of 6.24 billion billion ______.",
        "blanks": 2
      },
      {
        "n": 13,
        "type": "true_false",
        "prompt": "Unlike gravity, which only attracts, electrical forces may either attract or repel."
      },
      {
        "n": 14,
        "type": "multiple_choice",
        "prompt": "The proportionality constant k in Coulomb's law is approximately...",
        "options": [
          {
            "letter": "a",
            "text": "6.7 x 10^-11 N.m2/kg2"
          },
          {
            "letter": "b",
            "text": "9.0 x 10^9 N.m2/C2"
          },
          {
            "letter": "c",
            "text": "6.24 x 10^18 C"
          }
        ]
      },
      {
        "n": 15,
        "type": "short_answer",
        "prompt": "Why is there no measurable electrical force between Earth and the moon?"
      }
    ]
  },
  {
    "id": "32.4",
    "label": "Conductors and Insulators",
    "pageStart": 651,
    "pageEnd": 652,
    "items": [
      {
        "n": 16,
        "type": "fill_in",
        "prompt": "Materials through which electric charge can flow are called ______; materials whose electrons are tightly bound to particular atoms are called ______.",
        "blanks": 2
      },
      {
        "n": 17,
        "type": "true_false",
        "prompt": "Metals are good conductors of electricity because their outer electrons are not anchored to particular atoms and are free to roam in the material."
      },
      {
        "n": 18,
        "type": "multiple_choice",
        "prompt": "Germanium and silicon, which conduct well only when given small energy boosts or doped with impurities, are examples of...",
        "options": [
          {
            "letter": "a",
            "text": "conductors"
          },
          {
            "letter": "b",
            "text": "insulators"
          },
          {
            "letter": "c",
            "text": "semiconductors"
          }
        ]
      },
      {
        "n": 19,
        "type": "short_answer",
        "prompt": "What determines whether a substance is classified as a conductor or an insulator?"
      }
    ]
  },
  {
    "id": "32.5",
    "label": "Charging by Friction and Contact",
    "pageStart": 652,
    "pageEnd": 653,
    "items": [
      {
        "n": 20,
        "type": "fill_in",
        "prompt": "Two ways electric charge can be transferred are by ______ and by ______.",
        "blanks": 2
      },
      {
        "n": 21,
        "type": "fill_in",
        "prompt": "In all cases of charging by rubbing one material against another, ______ are being transferred.",
        "blanks": 1
      },
      {
        "n": 22,
        "type": "true_false",
        "prompt": "When a charged rod is placed in contact with a neutral object, some charge transfers to the neutral object."
      },
      {
        "n": 23,
        "type": "multiple_choice",
        "prompt": "Scuffing your shoes across a rug charges you by...",
        "options": [
          {
            "letter": "a",
            "text": "friction"
          },
          {
            "letter": "b",
            "text": "induction"
          },
          {
            "letter": "c",
            "text": "grounding"
          }
        ]
      }
    ]
  },
  {
    "id": "32.6",
    "label": "Charging by Induction",
    "pageStart": 653,
    "pageEnd": 655,
    "items": [
      {
        "n": 24,
        "type": "fill_in",
        "prompt": "Charging an object without direct contact is called charging by ______.",
        "blanks": 1
      },
      {
        "n": 25,
        "type": "fill_in",
        "prompt": "When we allow charges to move off (or onto) a conductor by touching it, we are ______ it.",
        "blanks": 1
      },
      {
        "n": 26,
        "type": "true_false",
        "prompt": "The negatively charged bottom of a thundercloud induces a positive charge on the surface of the ground below."
      },
      {
        "n": 27,
        "type": "multiple_choice",
        "prompt": "The primary purpose of a lightning rod is to...",
        "options": [
          {
            "letter": "a",
            "text": "attract lightning strikes to the building"
          },
          {
            "letter": "b",
            "text": "prevent a lightning discharge by continually leaking charge from the air"
          },
          {
            "letter": "c",
            "text": "store charge for later use"
          }
        ]
      },
      {
        "n": 28,
        "type": "short_answer",
        "prompt": "After the two metal spheres are charged by induction with a negatively charged rod, what happens to the charge on the rod itself?"
      }
    ]
  },
  {
    "id": "32.7",
    "label": "Charge Polarization",
    "pageStart": 655,
    "pageEnd": 657,
    "items": [
      {
        "n": 29,
        "type": "fill_in",
        "prompt": "When charges in an insulator are rearranged without migrating, so one side of each atom or molecule is slightly more positive (or negative) than the other, the insulator is electrically ______.",
        "blanks": 1
      },
      {
        "n": 30,
        "type": "fill_in",
        "prompt": "In summary, objects are electrically charged in three ways: by ______, by contact, and by ______.",
        "blanks": 2
      },
      {
        "n": 31,
        "type": "true_false",
        "prompt": "A charged comb attracts neutral bits of paper because the attraction of the closer opposite charges is greater than the repulsion of the farther like charges."
      },
      {
        "n": 32,
        "type": "multiple_choice",
        "prompt": "A water molecule (H2O), with a little more negative charge on one side than the other, is an example of...",
        "options": [
          {
            "letter": "a",
            "text": "an electric dipole"
          },
          {
            "letter": "b",
            "text": "an ion"
          },
          {
            "letter": "c",
            "text": "a conductor"
          }
        ]
      },
      {
        "n": 33,
        "type": "short_answer",
        "prompt": "Why does a balloon rubbed on your hair stick to a wall?"
      }
    ]
  }
]$ch32$::jsonb,
  $ch32${
  "1": [
    "repel",
    "attract"
  ],
  "2": [
    "negatively",
    "positively"
  ],
  "3": "false",
  "4": "b",
  "5": {
    "model": "The enormous attractive and repulsive electrical forces balance each other out, leaving only the relatively weaker gravitational attraction."
  },
  "6": [
    "ion"
  ],
  "7": [
    "conservation",
    "charge"
  ],
  "8": "false",
  "9": "b",
  "10": "false",
  "11": [
    "charges",
    "distance"
  ],
  "12": [
    "coulomb",
    "electrons"
  ],
  "13": "true",
  "14": "b",
  "15": {
    "model": "Both bodies have almost exactly equal numbers of electrons and protons, so the electrical forces balance out to zero."
  },
  "16": [
    "conductors",
    "insulators"
  ],
  "17": "true",
  "18": "c",
  "19": {
    "model": "How tightly the atoms of the substance hold their electrons - electrons move easily in good conductors and poorly in good insulators."
  },
  "20": [
    "friction",
    "contact"
  ],
  "21": [
    "electrons"
  ],
  "22": "true",
  "23": "a",
  "24": [
    "induction"
  ],
  "25": [
    "grounding"
  ],
  "26": "true",
  "27": "b",
  "28": {
    "model": "Nothing - the rod never touched the spheres, so it keeps its initial charge."
  },
  "29": [
    "polarized"
  ],
  "30": [
    "friction",
    "induction"
  ],
  "31": "true",
  "32": "a",
  "33": {
    "model": "The charged balloon polarizes molecules in the wall, inducing an opposite surface charge on the wall; the closer opposite charges attract more strongly than the farther like charges repel."
  }
}$ch32$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  33,
  $ch33$Electric Fields and Potential$ch33$,
  $ch33$https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte33.pdf$ch33$,
  663,
  $ch33$[
  {
    "id": "33.1",
    "label": "Electric Fields",
    "pageStart": 665,
    "pageEnd": 666,
    "items": [
      {
        "n": 1,
        "type": "fill_in",
        "prompt": "An electric ______ is a force field that surrounds an electric charge or group of charges.",
        "blanks": 1
      },
      {
        "n": 2,
        "type": "fill_in",
        "prompt": "The direction of an electric field at any point is the direction of the electrical force on a small positive ______ charge placed at that point.",
        "blanks": 1
      },
      {
        "n": 3,
        "type": "true_false",
        "prompt": "If the charge that sets up an electric field is positive, the field points toward that charge."
      },
      {
        "n": 4,
        "type": "multiple_choice",
        "prompt": "The magnitude (strength) of an electric field is measured by...",
        "options": [
          {
            "letter": "a",
            "text": "its effect on charges located in the field"
          },
          {
            "letter": "b",
            "text": "the color of its field lines"
          },
          {
            "letter": "c",
            "text": "the mass of the charge that sets it up"
          }
        ]
      },
      {
        "n": 5,
        "type": "short_answer",
        "prompt": "How does the field concept explain the 'action at a distance' between an electron and a proton?"
      }
    ]
  },
  {
    "id": "33.2",
    "label": "Electric Field Lines",
    "pageStart": 666,
    "pageEnd": 667,
    "items": [
      {
        "n": 6,
        "type": "fill_in",
        "prompt": "In a lines-of-force representation, where the field lines are farther apart the field is ______.",
        "blanks": 1
      },
      {
        "n": 7,
        "type": "fill_in",
        "prompt": "In a vector representation of an electric field, the ______ of the vectors indicates the magnitude of the field.",
        "blanks": 1
      },
      {
        "n": 8,
        "type": "true_false",
        "prompt": "For a pair of equal but opposite charges, the field lines emanate from the positive charge and terminate on the negative charge."
      },
      {
        "n": 9,
        "type": "multiple_choice",
        "prompt": "Between oppositely charged parallel plates (except near the ends), the electric field...",
        "options": [
          {
            "letter": "a",
            "text": "is zero"
          },
          {
            "letter": "b",
            "text": "has nearly parallel field lines and constant strength"
          },
          {
            "letter": "c",
            "text": "forms concentric circles"
          }
        ]
      }
    ]
  },
  {
    "id": "33.3",
    "label": "Electric Shielding",
    "pageStart": 668,
    "pageEnd": 669,
    "items": [
      {
        "n": 10,
        "type": "fill_in",
        "prompt": "If the charge on a conductor is not moving, the electric field inside the conductor is exactly ______.",
        "blanks": 1
      },
      {
        "n": 11,
        "type": "fill_in",
        "prompt": "To shield something from electric fields, surround it with a ______ surface.",
        "blanks": 1
      },
      {
        "n": 12,
        "type": "true_false",
        "prompt": "A gravitational field can be shielded the same way an electric field can."
      },
      {
        "n": 13,
        "type": "multiple_choice",
        "prompt": "An occupant inside a car struck by lightning is safe because...",
        "options": [
          {
            "letter": "a",
            "text": "the rubber tires insulate the car"
          },
          {
            "letter": "b",
            "text": "electrons spread over the outer metal surface so the field inside practically cancels to zero"
          },
          {
            "letter": "c",
            "text": "the windshield glass absorbs the charge"
          }
        ]
      },
      {
        "n": 14,
        "type": "short_answer",
        "prompt": "Why do the free electrons in a conductor finally stop moving?"
      }
    ]
  },
  {
    "id": "33.4",
    "label": "Electrical Potential Energy",
    "pageStart": 669,
    "pageEnd": 670,
    "items": [
      {
        "n": 15,
        "type": "fill_in",
        "prompt": "The energy a charge has due to its location in an electric field is called electrical ______ energy.",
        "blanks": 1
      },
      {
        "n": 16,
        "type": "true_false",
        "prompt": "Work is required to push a charged particle against the electric field of a charged body."
      },
      {
        "n": 17,
        "type": "multiple_choice",
        "prompt": "If a small positive charge that was pushed close to a positively charged sphere is released, it will...",
        "options": [
          {
            "letter": "a",
            "text": "accelerate away, its electrical potential energy transforming into kinetic energy"
          },
          {
            "letter": "b",
            "text": "remain where it is"
          },
          {
            "letter": "c",
            "text": "lose its charge"
          }
        ]
      },
      {
        "n": 18,
        "type": "short_answer",
        "prompt": "What gravitational analogy does the text use to explain electrical potential energy?"
      }
    ]
  },
  {
    "id": "33.5",
    "label": "Electric Potential",
    "pageStart": 670,
    "pageEnd": 671,
    "items": [
      {
        "n": 19,
        "type": "fill_in",
        "prompt": "Electric potential is electrical potential energy per ______.",
        "blanks": 1
      },
      {
        "n": 20,
        "type": "fill_in",
        "prompt": "1 volt equals 1 ______ of energy per ______ of charge.",
        "blanks": 2
      },
      {
        "n": 21,
        "type": "true_false",
        "prompt": "Electric potential and electrical potential energy are the same thing."
      },
      {
        "n": 22,
        "type": "multiple_choice",
        "prompt": "A balloon rubbed on your hair may be charged to several thousand volts yet is harmless because...",
        "options": [
          {
            "letter": "a",
            "text": "voltage cannot affect the human body"
          },
          {
            "letter": "b",
            "text": "the amount of charge is tiny, so the total energy involved is very small"
          },
          {
            "letter": "c",
            "text": "hair is a perfect insulator"
          }
        ]
      },
      {
        "n": 23,
        "type": "fill_in",
        "prompt": "Since electric potential is measured in volts, it is commonly called ______.",
        "blanks": 1
      }
    ]
  },
  {
    "id": "33.6",
    "label": "Electrical Energy Storage",
    "pageStart": 672,
    "pageEnd": 673,
    "items": [
      {
        "n": 24,
        "type": "fill_in",
        "prompt": "Electrical energy can be stored in a common device called a ______.",
        "blanks": 1
      },
      {
        "n": 25,
        "type": "true_false",
        "prompt": "A capacitor might still store charge even after the electricity to a device has been turned off."
      },
      {
        "n": 26,
        "type": "multiple_choice",
        "prompt": "The energy stored in a capacitor is stored in...",
        "options": [
          {
            "letter": "a",
            "text": "the connecting wires"
          },
          {
            "letter": "b",
            "text": "the electric field between its plates"
          },
          {
            "letter": "c",
            "text": "the chemical bonds of the plates"
          }
        ]
      },
      {
        "n": 27,
        "type": "short_answer",
        "prompt": "When is the charging process of a capacitor connected to a battery complete?"
      }
    ]
  },
  {
    "id": "33.7",
    "label": "The Van de Graaff Generator",
    "pageStart": 673,
    "pageEnd": 674,
    "items": [
      {
        "n": 28,
        "type": "fill_in",
        "prompt": "In a Van de Graaff generator, a motor-driven rubber ______ carries electrons up into a large hollow metal ______.",
        "blanks": 2
      },
      {
        "n": 29,
        "type": "fill_in",
        "prompt": "Because of mutual repulsion, static charge on any conductor moves to the ______ surface.",
        "blanks": 1
      },
      {
        "n": 30,
        "type": "true_false",
        "prompt": "A Van de Graaff generator can build up charge to an electric potential on the order of millions of volts."
      },
      {
        "n": 31,
        "type": "multiple_choice",
        "prompt": "A sphere with a radius of 1 m can be raised to about what potential before electric discharge occurs through the air?",
        "options": [
          {
            "letter": "a",
            "text": "3 thousand volts"
          },
          {
            "letter": "b",
            "text": "3 million volts"
          },
          {
            "letter": "c",
            "text": "300 volts"
          }
        ]
      }
    ]
  }
]$ch33$::jsonb,
  $ch33${
  "1": [
    "field"
  ],
  "2": [
    "test"
  ],
  "3": "false",
  "4": "a",
  "5": {
    "model": "Each charge interacts with the electric field set up by the other, so each is everywhere in contact with that field rather than acting across empty space."
  },
  "6": [
    "weaker"
  ],
  "7": [
    "length"
  ],
  "8": "true",
  "9": "b",
  "10": [
    "zero"
  ],
  "11": [
    "conducting"
  ],
  "12": "false",
  "13": "b",
  "14": {
    "model": "They settle into equilibrium positions only when the electric field inside the conductor is zero, so their rearrangement cancels the field."
  },
  "15": [
    "potential"
  ],
  "16": "true",
  "17": "a",
  "18": {
    "model": "Lifting an object against Earth's gravitational field increases its gravitational potential energy, just as pushing a charge against an electric field increases its electrical potential energy."
  },
  "19": [
    "charge"
  ],
  "20": [
    "joule",
    "coulomb"
  ],
  "21": "false",
  "22": "b",
  "23": [
    "voltage"
  ],
  "24": [
    "capacitor"
  ],
  "25": "true",
  "26": "b",
  "27": {
    "model": "When the potential difference between the plates equals the potential difference between the battery terminals - the battery voltage."
  },
  "28": [
    "belt",
    "sphere"
  ],
  "29": [
    "outside"
  ],
  "30": "true",
  "31": "b"
}$ch33$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  34,
  $ch34$Electric Current$ch34$,
  $ch34$https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte34.pdf$ch34$,
  679,
  $ch34$[
  {
    "id": "34.1",
    "label": "Flow of Charge",
    "pageStart": 681,
    "pageEnd": 681,
    "items": [
      {
        "n": 1,
        "type": "fill_in",
        "prompt": "Charge flows when there is a potential ______, or voltage, between the ends of a conductor.",
        "blanks": 1
      },
      {
        "n": 2,
        "type": "fill_in",
        "prompt": "The flow of charge will continue until both ends reach a ______ potential.",
        "blanks": 1
      },
      {
        "n": 3,
        "type": "true_false",
        "prompt": "The surge of charge between a charged Van de Graaff sphere and the ground through a wire is sustained indefinitely."
      },
      {
        "n": 4,
        "type": "multiple_choice",
        "prompt": "To attain a sustained flow of charge in a conductor, you need...",
        "options": [
          {
            "letter": "a",
            "text": "a very long wire"
          },
          {
            "letter": "b",
            "text": "an arrangement that keeps one end at a higher potential than the other"
          },
          {
            "letter": "c",
            "text": "both ends at exactly the same potential"
          }
        ]
      },
      {
        "n": 5,
        "type": "short_answer",
        "prompt": "What water analogy does the text use for a sustained electric current?"
      }
    ]
  },
  {
    "id": "34.2",
    "label": "Electric Current",
    "pageStart": 682,
    "pageEnd": 682,
    "items": [
      {
        "n": 6,
        "type": "fill_in",
        "prompt": "Electric current is the flow of electric ______, and it is measured in ______.",
        "blanks": 2
      },
      {
        "n": 7,
        "type": "fill_in",
        "prompt": "An ampere is the flow of 1 ______ of charge per second.",
        "blanks": 1
      },
      {
        "n": 8,
        "type": "true_false",
        "prompt": "A current-carrying wire has a net electric charge of zero."
      },
      {
        "n": 9,
        "type": "multiple_choice",
        "prompt": "In solid conductors, the flow of charge is composed of...",
        "options": [
          {
            "letter": "a",
            "text": "protons"
          },
          {
            "letter": "b",
            "text": "conduction electrons"
          },
          {
            "letter": "c",
            "text": "positive ions"
          }
        ]
      }
    ]
  },
  {
    "id": "34.3",
    "label": "Voltage Sources",
    "pageStart": 683,
    "pageEnd": 683,
    "items": [
      {
        "n": 10,
        "type": "fill_in",
        "prompt": "Something that provides a potential difference is known as a ______ source.",
        "blanks": 1
      },
      {
        "n": 11,
        "type": "fill_in",
        "prompt": "In a battery, a ______ reaction occurring inside releases electrical energy; generators convert ______ energy to electrical energy.",
        "blanks": 2
      },
      {
        "n": 12,
        "type": "true_false",
        "prompt": "The 120 volts at a home outlet means that 120 joules of energy is supplied to each coulomb of charge made to flow in the circuit."
      },
      {
        "n": 13,
        "type": "multiple_choice",
        "prompt": "In the water-pipe analogy for a circuit, which statement is correct?",
        "options": [
          {
            "letter": "a",
            "text": "Both the water and the pressure flow through the pipe"
          },
          {
            "letter": "b",
            "text": "Only the water flows; the pressure does not flow"
          },
          {
            "letter": "c",
            "text": "Only the pressure flows; the water stays put"
          }
        ]
      }
    ]
  },
  {
    "id": "34.4",
    "label": "Electric Resistance",
    "pageStart": 684,
    "pageEnd": 684,
    "items": [
      {
        "n": 14,
        "type": "fill_in",
        "prompt": "The resistance of a wire depends on the ______ of the material and on the thickness and ______ of the wire.",
        "blanks": 2
      },
      {
        "n": 15,
        "type": "fill_in",
        "prompt": "Certain metals acquire zero resistance at temperatures near absolute zero, a phenomenon known as ______.",
        "blanks": 1
      },
      {
        "n": 16,
        "type": "true_false",
        "prompt": "Thick wires have more resistance than thin wires."
      },
      {
        "n": 17,
        "type": "true_false",
        "prompt": "For most conductors, increased temperature means increased resistance."
      },
      {
        "n": 18,
        "type": "multiple_choice",
        "prompt": "Electric resistance is measured in units called...",
        "options": [
          {
            "letter": "a",
            "text": "amperes"
          },
          {
            "letter": "b",
            "text": "volts"
          },
          {
            "letter": "c",
            "text": "ohms"
          }
        ]
      }
    ]
  },
  {
    "id": "34.5",
    "label": "Ohm's Law",
    "pageStart": 685,
    "pageEnd": 686,
    "items": [
      {
        "n": 19,
        "type": "fill_in",
        "prompt": "Ohm's law: current equals ______ divided by ______.",
        "blanks": 2
      },
      {
        "n": 20,
        "type": "true_false",
        "prompt": "For a circuit of constant resistance, doubling the voltage doubles the current."
      },
      {
        "n": 21,
        "type": "multiple_choice",
        "prompt": "1 ampere equals...",
        "options": [
          {
            "letter": "a",
            "text": "1 volt per ohm"
          },
          {
            "letter": "b",
            "text": "1 ohm per volt"
          },
          {
            "letter": "c",
            "text": "1 joule per second"
          }
        ]
      },
      {
        "n": 22,
        "type": "short_answer",
        "prompt": "How much current is drawn by a lamp with a resistance of 100 ohms when 50 volts is impressed across it?"
      }
    ]
  },
  {
    "id": "34.6",
    "label": "Ohm's Law and Electric Shock",
    "pageStart": 686,
    "pageEnd": 688,
    "items": [
      {
        "n": 23,
        "type": "fill_in",
        "prompt": "The damaging effects of electric shock are the result of ______ passing through the body.",
        "blanks": 1
      },
      {
        "n": 24,
        "type": "fill_in",
        "prompt": "The round third prong of a three-wire electric plug connects the body of the appliance directly to ______.",
        "blanks": 1
      },
      {
        "n": 25,
        "type": "true_false",
        "prompt": "Your body's electrical resistance is lower when your skin is wet than when it is dry."
      },
      {
        "n": 26,
        "type": "multiple_choice",
        "prompt": "A bird can stand harmlessly on one high-voltage wire because...",
        "options": [
          {
            "letter": "a",
            "text": "its feet are perfect insulators"
          },
          {
            "letter": "b",
            "text": "every part of its body is at the same potential, so no current flows through it"
          },
          {
            "letter": "c",
            "text": "the wire carries no current where the bird stands"
          }
        ]
      },
      {
        "n": 27,
        "type": "multiple_choice",
        "prompt": "According to Table 34.1, about how much current through the heart is probably fatal if it lasts more than 1 second?",
        "options": [
          {
            "letter": "a",
            "text": "0.001 ampere"
          },
          {
            "letter": "b",
            "text": "0.070 ampere"
          },
          {
            "letter": "c",
            "text": "7 amperes"
          }
        ]
      }
    ]
  },
  {
    "id": "34.7",
    "label": "Direct Current and Alternating Current",
    "pageStart": 688,
    "pageEnd": 689,
    "items": [
      {
        "n": 28,
        "type": "fill_in",
        "prompt": "______ current always flows in one direction; ______ current repeatedly reverses direction.",
        "blanks": 2
      },
      {
        "n": 29,
        "type": "fill_in",
        "prompt": "Lamps in American homes operate on about 120 volts, while energy-hungry appliances like electric stoves operate on about ______ volts.",
        "blanks": 1
      },
      {
        "n": 30,
        "type": "true_false",
        "prompt": "A battery produces alternating current in a circuit."
      },
      {
        "n": 31,
        "type": "multiple_choice",
        "prompt": "Nearly all commercial AC circuits in North America alternate at a frequency of...",
        "options": [
          {
            "letter": "a",
            "text": "25 hertz"
          },
          {
            "letter": "b",
            "text": "50 hertz"
          },
          {
            "letter": "c",
            "text": "60 hertz"
          }
        ]
      }
    ]
  },
  {
    "id": "34.8",
    "label": "Converting AC to DC",
    "pageStart": 690,
    "pageEnd": 690,
    "items": [
      {
        "n": 32,
        "type": "fill_in",
        "prompt": "A ______ is a tiny electronic device that acts as a one-way valve, allowing electron flow in only one direction.",
        "blanks": 1
      },
      {
        "n": 33,
        "type": "true_false",
        "prompt": "Only half of each AC cycle passes through a single diode."
      },
      {
        "n": 34,
        "type": "multiple_choice",
        "prompt": "To maintain continuous current and smooth the bumpy output of a diode, an AC-DC converter uses a...",
        "options": [
          {
            "letter": "a",
            "text": "capacitor"
          },
          {
            "letter": "b",
            "text": "second battery"
          },
          {
            "letter": "c",
            "text": "switch"
          }
        ]
      },
      {
        "n": 35,
        "type": "short_answer",
        "prompt": "Why does a capacitor smooth out changes in current flow?"
      }
    ]
  },
  {
    "id": "34.9",
    "label": "The Speed of Electrons in a Circuit",
    "pageStart": 691,
    "pageEnd": 692,
    "items": [
      {
        "n": 36,
        "type": "fill_in",
        "prompt": "The electric ______ travels through a circuit at nearly the speed of light, but the electrons themselves drift at only about ______ cm/s in a typical DC circuit.",
        "blanks": 2
      },
      {
        "n": 37,
        "type": "true_false",
        "prompt": "In an AC circuit, the conduction electrons make no net progress; they oscillate to and fro about relatively fixed positions."
      },
      {
        "n": 38,
        "type": "multiple_choice",
        "prompt": "Why do current-carrying wires become hot?",
        "options": [
          {
            "letter": "a",
            "text": "Electrons rub against the insulation"
          },
          {
            "letter": "b",
            "text": "Electrons bump into the anchored metallic ions and transfer kinetic energy to them"
          },
          {
            "letter": "c",
            "text": "Voltage leaks out of the wire"
          }
        ]
      },
      {
        "n": 39,
        "type": "true_false",
        "prompt": "At room temperature, electrons in a wire already move at a few million kilometers per hour, but this random thermal motion produces no current."
      }
    ]
  },
  {
    "id": "34.10",
    "label": "The Source of Electrons in a Circuit",
    "pageStart": 693,
    "pageEnd": 693,
    "items": [
      {
        "n": 40,
        "type": "fill_in",
        "prompt": "The source of electrons in a circuit is the conducting circuit ______ itself.",
        "blanks": 1
      },
      {
        "n": 41,
        "type": "true_false",
        "prompt": "Power utilities sell electrons to their customers."
      },
      {
        "n": 42,
        "type": "multiple_choice",
        "prompt": "When you plug a lamp into an AC outlet, what flows from the outlet into the lamp?",
        "options": [
          {
            "letter": "a",
            "text": "electrons"
          },
          {
            "letter": "b",
            "text": "energy"
          },
          {
            "letter": "c",
            "text": "protons"
          }
        ]
      },
      {
        "n": 43,
        "type": "short_answer",
        "prompt": "When 120 volts AC is impressed on a lamp, what do the electrons already in the filament do?"
      }
    ]
  },
  {
    "id": "34.11",
    "label": "Electric Power",
    "pageStart": 693,
    "pageEnd": 694,
    "items": [
      {
        "n": 44,
        "type": "fill_in",
        "prompt": "Electric power is the ______ at which electrical energy is converted into another form, and it equals current times ______.",
        "blanks": 2
      },
      {
        "n": 45,
        "type": "fill_in",
        "prompt": "1 watt = (1 ______) x (1 ______).",
        "blanks": 2
      },
      {
        "n": 46,
        "type": "true_false",
        "prompt": "A 60-watt lamp draws 0.5 ampere on a 120-volt line."
      },
      {
        "n": 47,
        "type": "multiple_choice",
        "prompt": "A kilowatt-hour represents...",
        "options": [
          {
            "letter": "a",
            "text": "a power of 1000 watts"
          },
          {
            "letter": "b",
            "text": "the amount of energy consumed in 1 hour at the rate of 1 kilowatt"
          },
          {
            "letter": "c",
            "text": "current multiplied by resistance"
          }
        ]
      },
      {
        "n": 48,
        "type": "short_answer",
        "prompt": "Where electrical energy costs 10 cents per kilowatt-hour, what does it cost to run a 100-watt lightbulb for 10 hours?"
      }
    ]
  }
]$ch34$::jsonb,
  $ch34${
  "1": [
    "difference"
  ],
  "2": [
    "common"
  ],
  "3": "false",
  "4": "b",
  "5": {
    "model": "A pump maintaining a difference in water levels keeps water flowing in a pipe, just as a voltage source maintains the potential difference that keeps charge flowing."
  },
  "6": [
    "charge",
    "amperes"
  ],
  "7": [
    "coulomb"
  ],
  "8": "true",
  "9": "b",
  "10": [
    "voltage"
  ],
  "11": [
    "chemical",
    "mechanical"
  ],
  "12": "true",
  "13": "b",
  "14": [
    "conductivity",
    "length"
  ],
  "15": [
    "superconductivity"
  ],
  "16": "false",
  "17": "true",
  "18": "c",
  "19": [
    "voltage",
    "resistance"
  ],
  "20": "true",
  "21": "a",
  "22": {
    "model": "I = V/R = 50 V / 100 ohms = 0.5 ampere."
  },
  "23": [
    "current"
  ],
  "24": [
    "ground"
  ],
  "25": "true",
  "26": "b",
  "27": "b",
  "28": [
    "direct",
    "alternating"
  ],
  "29": [
    "240"
  ],
  "30": "false",
  "31": "c",
  "32": [
    "diode"
  ],
  "33": "true",
  "34": "a",
  "35": {
    "model": "A capacitor acts as a storage reservoir for charge; it takes time to add or remove electrons from its plates, so it retards changes in current and smooths the pulsed output."
  },
  "36": [
    "field",
    "0.01"
  ],
  "37": "true",
  "38": "b",
  "39": "true",
  "40": [
    "material"
  ],
  "41": "false",
  "42": "b",
  "43": {
    "model": "They vibrate to and fro about relatively fixed positions, dissipating about 120 joules of energy per coulomb of charge, mostly as heat and some as light."
  },
  "44": [
    "rate",
    "voltage"
  ],
  "45": [
    "ampere",
    "volt"
  ],
  "46": "true",
  "47": "b",
  "48": {
    "model": "100 W for 10 hours is 1 kilowatt-hour of energy, so it costs 10 cents (a cent per hour)."
  }
}$ch34$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  35,
  $ch35$Electric Circuits$ch35$,
  $ch35$https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte35.pdf$ch35$,
  701,
  $ch35$[
  {
    "id": "35.1",
    "label": "A Battery and a Bulb",
    "pageStart": 703,
    "pageEnd": 704,
    "items": [
      {
        "n": 1,
        "type": "fill_in",
        "prompt": "To light a bulb, electrons flow from the ______ part of the battery, through the bulb's ______, and back to the positive part of the battery.",
        "blanks": 2
      },
      {
        "n": 2,
        "type": "fill_in",
        "prompt": "The current completes the circuit by passing through the ______ of the battery.",
        "blanks": 1
      },
      {
        "n": 3,
        "type": "true_false",
        "prompt": "In the water analogy for a flashlight circuit, the battery is like a pump and the wires are like pipes."
      },
      {
        "n": 4,
        "type": "multiple_choice",
        "prompt": "When you turn on a flashlight, the electrons that light the bulb...",
        "options": [
          {
            "letter": "a",
            "text": "are created inside the battery"
          },
          {
            "letter": "b",
            "text": "are the mobile conduction electrons already in the wires and filament, which begin to drift through the circuit"
          },
          {
            "letter": "c",
            "text": "are pulled in from the surrounding air"
          }
        ]
      }
    ]
  },
  {
    "id": "35.2",
    "label": "Electric Circuits",
    "pageStart": 704,
    "pageEnd": 705,
    "items": [
      {
        "n": 5,
        "type": "fill_in",
        "prompt": "Any path along which electrons can flow is a ______.",
        "blanks": 1
      },
      {
        "n": 6,
        "type": "fill_in",
        "prompt": "Devices in a circuit are commonly connected in one of two ways: in ______ or in ______.",
        "blanks": 2
      },
      {
        "n": 7,
        "type": "true_false",
        "prompt": "An electric circuit must be closed for electricity to flow."
      },
      {
        "n": 8,
        "type": "multiple_choice",
        "prompt": "A gap in a circuit is usually provided by...",
        "options": [
          {
            "letter": "a",
            "text": "a fuse"
          },
          {
            "letter": "b",
            "text": "an electric switch that can be opened or closed"
          },
          {
            "letter": "c",
            "text": "a capacitor"
          }
        ]
      },
      {
        "n": 9,
        "type": "short_answer",
        "prompt": "Name one way the water analogy fails for electric circuits."
      }
    ]
  },
  {
    "id": "35.3",
    "label": "Series Circuits",
    "pageStart": 705,
    "pageEnd": 707,
    "items": [
      {
        "n": 10,
        "type": "fill_in",
        "prompt": "In a series circuit, current has only a ______ pathway, and the total resistance is the ______ of the individual resistances.",
        "blanks": 2
      },
      {
        "n": 11,
        "type": "fill_in",
        "prompt": "The sum of the ______ drops across the individual devices equals the total voltage supplied by the source.",
        "blanks": 1
      },
      {
        "n": 12,
        "type": "true_false",
        "prompt": "In a series circuit, the current passing through each device is the same."
      },
      {
        "n": 13,
        "type": "multiple_choice",
        "prompt": "If one lamp filament burns out in a series circuit...",
        "options": [
          {
            "letter": "a",
            "text": "the other lamps glow brighter"
          },
          {
            "letter": "b",
            "text": "current in the whole circuit ceases and none of the devices work"
          },
          {
            "letter": "c",
            "text": "only that one lamp goes out"
          }
        ]
      },
      {
        "n": 14,
        "type": "short_answer",
        "prompt": "A 9-volt battery is connected to three identical lamps in series. What is the voltage across each lamp?"
      }
    ]
  },
  {
    "id": "35.4",
    "label": "Parallel Circuits",
    "pageStart": 707,
    "pageEnd": 708,
    "items": [
      {
        "n": 15,
        "type": "fill_in",
        "prompt": "In a parallel circuit, each device is connected to the same two ______ of the circuit, so the ______ is the same across each device.",
        "blanks": 2
      },
      {
        "n": 16,
        "type": "fill_in",
        "prompt": "The amount of current in each branch is inversely proportional to the ______ of that branch.",
        "blanks": 1
      },
      {
        "n": 17,
        "type": "true_false",
        "prompt": "A break in one path of a parallel circuit interrupts the flow of charge in the other paths."
      },
      {
        "n": 18,
        "type": "true_false",
        "prompt": "In a parallel circuit, the current in one lamp passes through the other lamps."
      },
      {
        "n": 19,
        "type": "multiple_choice",
        "prompt": "As the number of parallel branches is increased, the overall resistance of the circuit...",
        "options": [
          {
            "letter": "a",
            "text": "increases"
          },
          {
            "letter": "b",
            "text": "decreases"
          },
          {
            "letter": "c",
            "text": "stays the same"
          }
        ]
      }
    ]
  },
  {
    "id": "35.5",
    "label": "Schematic Diagrams",
    "pageStart": 709,
    "pageEnd": 709,
    "items": [
      {
        "n": 20,
        "type": "fill_in",
        "prompt": "Simple diagrams that describe electric circuits are called ______ diagrams.",
        "blanks": 1
      },
      {
        "n": 21,
        "type": "fill_in",
        "prompt": "In a schematic diagram, resistance is shown by a ______ line, and a battery is represented by a set of short and long ______ lines.",
        "blanks": 2
      },
      {
        "n": 22,
        "type": "true_false",
        "prompt": "In the battery symbol, the long line represents the negative terminal."
      },
      {
        "n": 23,
        "type": "multiple_choice",
        "prompt": "Ideal resistance-free wires are shown in a schematic diagram as...",
        "options": [
          {
            "letter": "a",
            "text": "dashed lines"
          },
          {
            "letter": "b",
            "text": "solid straight lines"
          },
          {
            "letter": "c",
            "text": "zigzag lines"
          }
        ]
      }
    ]
  },
  {
    "id": "35.6",
    "label": "Combining Resistors in a Compound Circuit",
    "pageStart": 710,
    "pageEnd": 711,
    "items": [
      {
        "n": 24,
        "type": "fill_in",
        "prompt": "The ______ resistance of a circuit is the value of the single resistor that would comprise the same load to the battery or power source.",
        "blanks": 1
      },
      {
        "n": 25,
        "type": "fill_in",
        "prompt": "The equivalent resistance of resistors in series is the ______ of their values; for a pair of equal resistors in parallel it is ______ the value of either resistor.",
        "blanks": 2
      },
      {
        "n": 26,
        "type": "true_false",
        "prompt": "The equivalent resistance of two 8-ohm resistors connected in parallel is 4 ohms."
      },
      {
        "n": 27,
        "type": "multiple_choice",
        "prompt": "Two 8-ohm resistors in parallel are connected in series with a third 8-ohm resistor. The equivalent resistance of the combination is...",
        "options": [
          {
            "letter": "a",
            "text": "24 ohms"
          },
          {
            "letter": "b",
            "text": "12 ohms"
          },
          {
            "letter": "c",
            "text": "4 ohms"
          }
        ]
      },
      {
        "n": 28,
        "type": "short_answer",
        "prompt": "If a 12-volt battery is connected across a combination with an equivalent resistance of 12 ohms, what current flows through the battery?"
      }
    ]
  },
  {
    "id": "35.7",
    "label": "Parallel Circuits and Overloading",
    "pageStart": 711,
    "pageEnd": 712,
    "items": [
      {
        "n": 29,
        "type": "fill_in",
        "prompt": "Lines that carry more than a safe amount of current are said to be ______.",
        "blanks": 1
      },
      {
        "n": 30,
        "type": "fill_in",
        "prompt": "To prevent overloading in circuits, fuses or circuit breakers are connected in ______ along the supply line.",
        "blanks": 1
      },
      {
        "n": 31,
        "type": "true_false",
        "prompt": "A short circuit draws a dangerously large current because it bypasses the normal circuit resistance."
      },
      {
        "n": 32,
        "type": "multiple_choice",
        "prompt": "A toaster draws 8 A, a heater draws 10 A, and a lamp draws 2 A on the same line. With all three operating, the total line current is...",
        "options": [
          {
            "letter": "a",
            "text": "10 amperes"
          },
          {
            "letter": "b",
            "text": "18 amperes"
          },
          {
            "letter": "c",
            "text": "20 amperes"
          }
        ]
      },
      {
        "n": 33,
        "type": "short_answer",
        "prompt": "Why are circuit breakers used instead of fuses in modern buildings?"
      }
    ]
  }
]$ch35$::jsonb,
  $ch35${
  "1": [
    "negative",
    "filament"
  ],
  "2": [
    "interior"
  ],
  "3": "true",
  "4": "b",
  "5": [
    "circuit"
  ],
  "6": [
    "series",
    "parallel"
  ],
  "7": "true",
  "8": "b",
  "9": {
    "model": "A break in a water pipe spills water, but a break in a circuit stops the flow entirely; also, opening a faucet starts water flow while opening a switch stops electron flow."
  },
  "10": [
    "single",
    "sum"
  ],
  "11": [
    "voltage"
  ],
  "12": "true",
  "13": "b",
  "14": {
    "model": "3 volts - the 9 volts divides equally among the three identical lamps."
  },
  "15": [
    "points",
    "voltage"
  ],
  "16": [
    "resistance"
  ],
  "17": "false",
  "18": "false",
  "19": "b",
  "20": [
    "schematic"
  ],
  "21": [
    "zigzag",
    "parallel"
  ],
  "22": "false",
  "23": "b",
  "24": [
    "equivalent"
  ],
  "25": [
    "sum",
    "half"
  ],
  "26": "true",
  "27": "b",
  "28": {
    "model": "I = V/R = 12 V / 12 ohms = 1 ampere."
  },
  "29": [
    "overloaded"
  ],
  "30": [
    "series"
  ],
  "31": "true",
  "32": "c",
  "33": {
    "model": "Circuit breakers do not have to be replaced each time the circuit opens - the switch can simply be reset after the problem is corrected."
  }
}$ch35$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  36,
  $ch36$Magnetism$ch36$,
  $ch36$https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte36.pdf$ch36$,
  719,
  $ch36$[
  {
    "id": "36.1",
    "label": "Magnetic Poles",
    "pageStart": 721,
    "pageEnd": 722,
    "items": [
      {
        "n": 1,
        "type": "fill_in",
        "prompt": "Like poles ______; opposite poles ______.",
        "blanks": 2
      },
      {
        "n": 2,
        "type": "fill_in",
        "prompt": "The end of a suspended bar magnet that points northward is called the ______-seeking pole.",
        "blanks": 1
      },
      {
        "n": 3,
        "type": "true_false",
        "prompt": "By breaking a magnet in half enough times, you can eventually isolate a single magnetic pole."
      },
      {
        "n": 4,
        "type": "multiple_choice",
        "prompt": "An important difference between magnetic poles and electric charges is that...",
        "options": [
          {
            "letter": "a",
            "text": "magnetic poles always attract"
          },
          {
            "letter": "b",
            "text": "electric charges can be isolated but magnetic poles cannot"
          },
          {
            "letter": "c",
            "text": "magnetic forces do not depend on distance"
          }
        ]
      },
      {
        "n": 5,
        "type": "short_answer",
        "prompt": "Where are the poles of a horseshoe magnet located?"
      }
    ]
  },
  {
    "id": "36.2",
    "label": "Magnetic Fields",
    "pageStart": 722,
    "pageEnd": 723,
    "items": [
      {
        "n": 6,
        "type": "fill_in",
        "prompt": "The space around a magnet, in which a magnetic force is exerted, is filled with a magnetic ______.",
        "blanks": 1
      },
      {
        "n": 7,
        "type": "fill_in",
        "prompt": "The direction of the magnetic field outside a magnet is from the ______ pole to the ______ pole.",
        "blanks": 2
      },
      {
        "n": 8,
        "type": "true_false",
        "prompt": "Where the magnetic field lines are closer together, the field strength is greater."
      },
      {
        "n": 9,
        "type": "multiple_choice",
        "prompt": "Iron filings sprinkled on paper over a bar magnet will...",
        "options": [
          {
            "letter": "a",
            "text": "trace out an orderly pattern of the magnetic field lines"
          },
          {
            "letter": "b",
            "text": "demagnetize the magnet"
          },
          {
            "letter": "c",
            "text": "scatter randomly"
          }
        ]
      }
    ]
  },
  {
    "id": "36.3",
    "label": "The Nature of a Magnetic Field",
    "pageStart": 723,
    "pageEnd": 724,
    "items": [
      {
        "n": 10,
        "type": "fill_in",
        "prompt": "A magnetic field is produced by the ______ of electric charge.",
        "blanks": 1
      },
      {
        "n": 11,
        "type": "fill_in",
        "prompt": "In materials such as ______, nickel, and cobalt, the magnetic fields of spinning electrons do not cancel completely.",
        "blanks": 1
      },
      {
        "n": 12,
        "type": "true_false",
        "prompt": "Every spinning electron is a tiny magnet."
      },
      {
        "n": 13,
        "type": "multiple_choice",
        "prompt": "Why are most substances not magnets?",
        "options": [
          {
            "letter": "a",
            "text": "Their atoms contain no electrons"
          },
          {
            "letter": "b",
            "text": "Electrons spinning in opposite directions cancel each other's magnetic fields"
          },
          {
            "letter": "c",
            "text": "Their atoms are too far apart"
          }
        ]
      }
    ]
  },
  {
    "id": "36.4",
    "label": "Magnetic Domains",
    "pageStart": 724,
    "pageEnd": 725,
    "items": [
      {
        "n": 14,
        "type": "fill_in",
        "prompt": "Clusters of aligned iron atoms are called magnetic ______.",
        "blanks": 1
      },
      {
        "n": 15,
        "type": "fill_in",
        "prompt": "When a magnetized nail is removed from a magnet, ordinary ______ motion causes most of its domains to return to a random arrangement.",
        "blanks": 1
      },
      {
        "n": 16,
        "type": "true_false",
        "prompt": "The difference between a piece of ordinary iron and an iron magnet is the alignment of the domains."
      },
      {
        "n": 17,
        "type": "true_false",
        "prompt": "Dropping or heating a permanent magnet can make it weaker."
      },
      {
        "n": 18,
        "type": "multiple_choice",
        "prompt": "Permanent magnets are made by...",
        "options": [
          {
            "letter": "a",
            "text": "cooling iron to room temperature"
          },
          {
            "letter": "b",
            "text": "placing pieces of iron or certain iron alloys in strong magnetic fields"
          },
          {
            "letter": "c",
            "text": "soaking steel in salt water"
          }
        ]
      }
    ]
  },
  {
    "id": "36.5",
    "label": "Electric Currents and Magnetic Fields",
    "pageStart": 726,
    "pageEnd": 727,
    "items": [
      {
        "n": 19,
        "type": "fill_in",
        "prompt": "An electric ______ produces a magnetic field; around a straight current-carrying wire the field forms a pattern of concentric ______.",
        "blanks": 2
      },
      {
        "n": 20,
        "type": "fill_in",
        "prompt": "A current-carrying coil of wire with many loops is an ______.",
        "blanks": 1
      },
      {
        "n": 21,
        "type": "true_false",
        "prompt": "When the current in a wire reverses direction, the direction of the magnetic field around the wire also reverses."
      },
      {
        "n": 22,
        "type": "multiple_choice",
        "prompt": "Placing a piece of iron inside a current-carrying coil...",
        "options": [
          {
            "letter": "a",
            "text": "increases the magnetic field intensity by aligning the iron's domains"
          },
          {
            "letter": "b",
            "text": "blocks the magnetic field"
          },
          {
            "letter": "c",
            "text": "reverses the field direction"
          }
        ]
      },
      {
        "n": 23,
        "type": "short_answer",
        "prompt": "Why are the strongest electromagnets made with superconducting material instead of iron cores?"
      }
    ]
  },
  {
    "id": "36.6",
    "label": "Magnetic Forces on Moving Charged Particles",
    "pageStart": 728,
    "pageEnd": 728,
    "items": [
      {
        "n": 24,
        "type": "fill_in",
        "prompt": "A moving charge is deflected when it crosses magnetic field lines but not when it travels ______ to the field lines.",
        "blanks": 1
      },
      {
        "n": 25,
        "type": "fill_in",
        "prompt": "The deflecting force is greatest when the particle moves ______ to the magnetic field lines.",
        "blanks": 1
      },
      {
        "n": 26,
        "type": "true_false",
        "prompt": "The deflecting force on a moving charged particle is perpendicular to both the magnetic field lines and the particle's velocity."
      },
      {
        "n": 27,
        "type": "multiple_choice",
        "prompt": "Earth's magnetic field affects cosmic radiation by...",
        "options": [
          {
            "letter": "a",
            "text": "deflecting charged particles, which reduces the intensity of cosmic radiation"
          },
          {
            "letter": "b",
            "text": "speeding the particles up"
          },
          {
            "letter": "c",
            "text": "having no effect on it"
          }
        ]
      }
    ]
  },
  {
    "id": "36.7",
    "label": "Magnetic Forces on Current-Carrying Wires",
    "pageStart": 729,
    "pageEnd": 729,
    "items": [
      {
        "n": 28,
        "type": "fill_in",
        "prompt": "Just as a current-carrying wire deflects a compass, a ______ will deflect a current-carrying wire.",
        "blanks": 1
      },
      {
        "n": 29,
        "type": "true_false",
        "prompt": "If the direction of the current in the wire is reversed, the deflecting force acts in the opposite direction."
      },
      {
        "n": 30,
        "type": "multiple_choice",
        "prompt": "The force on a current-carrying wire in a magnetic field is...",
        "options": [
          {
            "letter": "a",
            "text": "along the magnetic field lines"
          },
          {
            "letter": "b",
            "text": "along the direction of the current"
          },
          {
            "letter": "c",
            "text": "perpendicular to both the field lines and the current - a sideways force"
          }
        ]
      },
      {
        "n": 31,
        "type": "short_answer",
        "prompt": "Name two useful devices people built by harnessing the force a magnet exerts on a current-carrying wire."
      }
    ]
  },
  {
    "id": "36.8",
    "label": "Meters to Motors",
    "pageStart": 730,
    "pageEnd": 731,
    "items": [
      {
        "n": 32,
        "type": "fill_in",
        "prompt": "A sensitive current-indicating instrument is called a ______.",
        "blanks": 1
      },
      {
        "n": 33,
        "type": "fill_in",
        "prompt": "A galvanometer calibrated to measure current is called an ______; calibrated to measure electric potential it is called a ______.",
        "blanks": 2
      },
      {
        "n": 34,
        "type": "true_false",
        "prompt": "In an electric motor, the current in the loop is made to change direction every time the coil makes a half revolution."
      },
      {
        "n": 35,
        "type": "multiple_choice",
        "prompt": "In larger motors, many loops of wire are wound about an iron cylinder called the...",
        "options": [
          {
            "letter": "a",
            "text": "armature"
          },
          {
            "letter": "b",
            "text": "brush"
          },
          {
            "letter": "c",
            "text": "turbine"
          }
        ]
      }
    ]
  },
  {
    "id": "36.9",
    "label": "Earth's Magnetic Field",
    "pageStart": 732,
    "pageEnd": 733,
    "items": [
      {
        "n": 36,
        "type": "fill_in",
        "prompt": "A compass points northward because Earth itself is a huge ______.",
        "blanks": 1
      },
      {
        "n": 37,
        "type": "fill_in",
        "prompt": "The discrepancy between the orientation of a compass and true north is known as the magnetic ______.",
        "blanks": 1
      },
      {
        "n": 38,
        "type": "true_false",
        "prompt": "Earth's magnetic poles coincide with its geographic poles."
      },
      {
        "n": 39,
        "type": "multiple_choice",
        "prompt": "Most geologists think Earth's magnetic field is created by...",
        "options": [
          {
            "letter": "a",
            "text": "a magnetized chunk of iron at Earth's center"
          },
          {
            "letter": "b",
            "text": "moving charges looping around within Earth's molten core"
          },
          {
            "letter": "c",
            "text": "the moon's gravitational pull"
          }
        ]
      },
      {
        "n": 40,
        "type": "short_answer",
        "prompt": "What evidence shows that Earth's magnetic field has reversed itself throughout geologic time?"
      }
    ]
  }
]$ch36$::jsonb,
  $ch36${
  "1": [
    "repel",
    "attract"
  ],
  "2": [
    "north"
  ],
  "3": "false",
  "4": "b",
  "5": {
    "model": "At its two ends - a horseshoe magnet is a bar magnet that has been bent."
  },
  "6": [
    "field"
  ],
  "7": [
    "north",
    "south"
  ],
  "8": "true",
  "9": "a",
  "10": [
    "motion"
  ],
  "11": [
    "iron"
  ],
  "12": "true",
  "13": "b",
  "14": [
    "domains"
  ],
  "15": [
    "thermal"
  ],
  "16": "true",
  "17": "true",
  "18": "b",
  "19": [
    "current",
    "circles"
  ],
  "20": [
    "electromagnet"
  ],
  "21": "true",
  "22": "a",
  "23": {
    "model": "Beyond a certain limit the magnetic field in iron saturates, so the strongest electromagnets use superconducting material instead."
  },
  "24": [
    "parallel"
  ],
  "25": [
    "perpendicular"
  ],
  "26": "true",
  "27": "a",
  "28": [
    "magnet"
  ],
  "29": "true",
  "30": "c",
  "31": {
    "model": "Electric meters (galvanometers) and electric motors."
  },
  "32": [
    "galvanometer"
  ],
  "33": [
    "ammeter",
    "voltmeter"
  ],
  "34": "true",
  "35": "a",
  "36": [
    "magnet"
  ],
  "37": [
    "declination"
  ],
  "38": "false",
  "39": "b",
  "40": {
    "model": "The magnetic record in rock strata and the zebra-striped pattern of alternating magnetization in the seafloor at mid-ocean ridges."
  }
}$ch36$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  37,
  $ch37$Electromagnetic Induction$ch37$,
  $ch37$https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte37.pdf$ch37$,
  739,
  $ch37$[
  {
    "id": "37.1",
    "label": "Electromagnetic Induction",
    "pageStart": 741,
    "pageEnd": 742,
    "items": [
      {
        "n": 1,
        "type": "fill_in",
        "prompt": "Faraday and Henry discovered that voltage is induced by the ______ motion of a wire with respect to a magnetic ______.",
        "blanks": 2
      },
      {
        "n": 2,
        "type": "fill_in",
        "prompt": "The phenomenon of inducing voltage by changing the magnetic field around a conductor is ______ induction.",
        "blanks": 1
      },
      {
        "n": 3,
        "type": "true_false",
        "prompt": "Pushing a magnet into a coil with twice as many loops induces twice as much voltage."
      },
      {
        "n": 4,
        "type": "multiple_choice",
        "prompt": "The amount of voltage induced depends on...",
        "options": [
          {
            "letter": "a",
            "text": "how quickly the magnetic field lines are traversed by the wire"
          },
          {
            "letter": "b",
            "text": "the thickness of the insulation"
          },
          {
            "letter": "c",
            "text": "whether the wire is horizontal or vertical"
          }
        ]
      },
      {
        "n": 5,
        "type": "short_answer",
        "prompt": "Why don't we get something for nothing by simply increasing the number of loops in a coil?"
      }
    ]
  },
  {
    "id": "37.2",
    "label": "Faraday's Law",
    "pageStart": 743,
    "pageEnd": 743,
    "items": [
      {
        "n": 6,
        "type": "fill_in",
        "prompt": "Faraday's law: the induced voltage in a coil is proportional to the product of the number of ______, the cross-sectional area of each loop, and the ______ at which the magnetic field changes within those loops.",
        "blanks": 2
      },
      {
        "n": 7,
        "type": "fill_in",
        "prompt": "The amount of current produced by electromagnetic induction depends not only on the induced voltage but also on the ______ of the coil and circuit.",
        "blanks": 1
      },
      {
        "n": 8,
        "type": "true_false",
        "prompt": "Plunging a magnet into a closed rubber loop induces the same voltage as plunging it into a closed copper loop the same way."
      },
      {
        "n": 9,
        "type": "multiple_choice",
        "prompt": "Compared with the copper loop, the closed rubber loop carries...",
        "options": [
          {
            "letter": "a",
            "text": "almost no current, because its electrons are bonded to fixed atoms"
          },
          {
            "letter": "b",
            "text": "more current, because rubber stretches"
          },
          {
            "letter": "c",
            "text": "exactly the same current"
          }
        ]
      }
    ]
  },
  {
    "id": "37.3",
    "label": "Generators and Alternating Current",
    "pageStart": 743,
    "pageEnd": 745,
    "items": [
      {
        "n": 10,
        "type": "fill_in",
        "prompt": "A machine that produces electric current by rotating a coil within a stationary magnetic field is called a ______.",
        "blanks": 1
      },
      {
        "n": 11,
        "type": "fill_in",
        "prompt": "In a power plant, the armature is connected to an assembly of paddle wheels called a ______, most often driven by moving ______.",
        "blanks": 2
      },
      {
        "n": 12,
        "type": "true_false",
        "prompt": "A generator converts mechanical energy into electrical energy - essentially the opposite of a motor."
      },
      {
        "n": 13,
        "type": "multiple_choice",
        "prompt": "The standard alternating current produced in North America changes magnitude and direction during how many cycles per second?",
        "options": [
          {
            "letter": "a",
            "text": "30"
          },
          {
            "letter": "b",
            "text": "60"
          },
          {
            "letter": "c",
            "text": "120"
          }
        ]
      },
      {
        "n": 14,
        "type": "short_answer",
        "prompt": "Is electricity a source of energy? Explain."
      }
    ]
  },
  {
    "id": "37.4",
    "label": "Motor and Generator Comparison",
    "pageStart": 746,
    "pageEnd": 746,
    "items": [
      {
        "n": 15,
        "type": "fill_in",
        "prompt": "Both the motor effect and the generator effect stem from one fact: moving charges experience a force that is ______ to both their motion and the magnetic ______ they traverse.",
        "blanks": 2
      },
      {
        "n": 16,
        "type": "fill_in",
        "prompt": "The motor effect occurs when a ______ moves through a magnetic field.",
        "blanks": 1
      },
      {
        "n": 17,
        "type": "true_false",
        "prompt": "In the generator effect, moving a current-free wire downward through a magnetic field causes a current to begin to flow."
      },
      {
        "n": 18,
        "type": "multiple_choice",
        "prompt": "In a hybrid automobile, the electrical device acts as a generator when...",
        "options": [
          {
            "letter": "a",
            "text": "the car is accelerating up a hill"
          },
          {
            "letter": "b",
            "text": "braking or rolling downhill causes the wheels to exert a torque on it"
          },
          {
            "letter": "c",
            "text": "the car is parked"
          }
        ]
      }
    ]
  },
  {
    "id": "37.5",
    "label": "Transformers",
    "pageStart": 747,
    "pageEnd": 749,
    "items": [
      {
        "n": 19,
        "type": "fill_in",
        "prompt": "A transformer is a device for increasing or decreasing ______ through electromagnetic ______.",
        "blanks": 2
      },
      {
        "n": 20,
        "type": "fill_in",
        "prompt": "The coil connected to the power source is called the ______ and the output coil is called the ______.",
        "blanks": 2
      },
      {
        "n": 21,
        "type": "true_false",
        "prompt": "If the secondary has twice as many turns as the primary, twice as much voltage is induced in the secondary."
      },
      {
        "n": 22,
        "type": "multiple_choice",
        "prompt": "If a transformer steps the voltage up, the current in the secondary is...",
        "options": [
          {
            "letter": "a",
            "text": "stepped up as well"
          },
          {
            "letter": "b",
            "text": "stepped down"
          },
          {
            "letter": "c",
            "text": "unchanged"
          }
        ]
      },
      {
        "n": 23,
        "type": "short_answer",
        "prompt": "Neglecting the slight losses to heating, how does the power going into the primary compare with the power coming out of the secondary?"
      }
    ]
  },
  {
    "id": "37.6",
    "label": "Power Transmission",
    "pageStart": 750,
    "pageEnd": 750,
    "items": [
      {
        "n": 24,
        "type": "fill_in",
        "prompt": "Power is transmitted great distances at high ______ and correspondingly low ______.",
        "blanks": 2
      },
      {
        "n": 25,
        "type": "fill_in",
        "prompt": "Power may be carried from power plants to cities at about ______ volts.",
        "blanks": 1
      },
      {
        "n": 26,
        "type": "true_false",
        "prompt": "Transmitting power at low voltage and high current would result in large energy losses owing to the heating of the wires."
      },
      {
        "n": 27,
        "type": "multiple_choice",
        "prompt": "Almost all electric energy sold today is AC because...",
        "options": [
          {
            "letter": "a",
            "text": "AC is easily transformed from one voltage to another"
          },
          {
            "letter": "b",
            "text": "DC cannot travel through wires"
          },
          {
            "letter": "c",
            "text": "AC contains more energy than DC"
          }
        ]
      }
    ]
  },
  {
    "id": "37.7",
    "label": "Induction of Electric and Magnetic Fields",
    "pageStart": 751,
    "pageEnd": 752,
    "items": [
      {
        "n": 28,
        "type": "fill_in",
        "prompt": "Faraday's law, viewed more fundamentally: an ______ field is created in any region of space in which a ______ field is changing with time.",
        "blanks": 2
      },
      {
        "n": 29,
        "type": "fill_in",
        "prompt": "The direction of the created electric field is at ______ angles to the changing magnetic field.",
        "blanks": 1
      },
      {
        "n": 30,
        "type": "true_false",
        "prompt": "Electromagnetic induction takes place only when a conducting wire or material medium is present."
      },
      {
        "n": 31,
        "type": "multiple_choice",
        "prompt": "Maxwell's counterpart to Faraday's law states that a magnetic field is created in any region of space in which...",
        "options": [
          {
            "letter": "a",
            "text": "an electric field is changing with time"
          },
          {
            "letter": "b",
            "text": "an electric field is steady"
          },
          {
            "letter": "c",
            "text": "a charge is at rest"
          }
        ]
      }
    ]
  },
  {
    "id": "37.8",
    "label": "Electromagnetic Waves",
    "pageStart": 753,
    "pageEnd": 756,
    "items": [
      {
        "n": 32,
        "type": "fill_in",
        "prompt": "An electromagnetic wave is composed of oscillating electric and magnetic fields that ______ each other.",
        "blanks": 1
      },
      {
        "n": 33,
        "type": "fill_in",
        "prompt": "Light is simply electromagnetic ______ in a particular frequency range; the lower end of that range appears ______ and the higher end appears violet.",
        "blanks": 2
      },
      {
        "n": 34,
        "type": "true_false",
        "prompt": "Electromagnetic radiation travels at only one speed - the speed of light - no matter what its frequency, wavelength, or intensity."
      },
      {
        "n": 35,
        "type": "multiple_choice",
        "prompt": "From his equations, Maxwell calculated the critical speed of electromagnetic waves to be...",
        "options": [
          {
            "letter": "a",
            "text": "300,000 kilometers per second"
          },
          {
            "letter": "b",
            "text": "340 meters per second"
          },
          {
            "letter": "c",
            "text": "300,000 meters per second"
          }
        ]
      },
      {
        "n": 36,
        "type": "short_answer",
        "prompt": "Why can't an electromagnetic wave travel at less than the speed of light?"
      }
    ]
  }
]$ch37$::jsonb,
  $ch37${
  "1": [
    "relative",
    "field"
  ],
  "2": [
    "electromagnetic"
  ],
  "3": "true",
  "4": "a",
  "5": {
    "model": "Work must be done - the induced current creates a magnetic field that opposes the magnet's motion, so pushing into more loops requires more work."
  },
  "6": [
    "loops",
    "rate"
  ],
  "7": [
    "resistance"
  ],
  "8": "true",
  "9": "a",
  "10": [
    "generator"
  ],
  "11": [
    "turbine",
    "steam"
  ],
  "12": "true",
  "13": "b",
  "14": {
    "model": "No - electricity is a form of energy that must have a source, such as fuel or falling water that drives the turbine."
  },
  "15": [
    "perpendicular",
    "field"
  ],
  "16": [
    "current"
  ],
  "17": "true",
  "18": "b",
  "19": [
    "voltage",
    "induction"
  ],
  "20": [
    "primary",
    "secondary"
  ],
  "21": "true",
  "22": "b",
  "23": {
    "model": "They are equal - by energy conservation, (voltage x current) in the primary equals (voltage x current) in the secondary."
  },
  "24": [
    "voltages",
    "currents"
  ],
  "25": [
    "120,000"
  ],
  "26": "true",
  "27": "a",
  "28": [
    "electric",
    "magnetic"
  ],
  "29": [
    "right"
  ],
  "30": "false",
  "31": "a",
  "32": [
    "regenerate"
  ],
  "33": [
    "waves",
    "red"
  ],
  "34": "true",
  "35": "a",
  "36": {
    "model": "Below the speed of light the fields would induce ever-weaker fields and die out; only at the speed of light is the mutual induction in perfect balance, with no loss or gain of energy."
  }
}$ch37$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();
