/** Authored teaching examples; practice checks are formative and never write mastery. */
export interface TeachingExample { title: string; prompt: string; steps: { action: string; why: string }[]; check: string }
export interface TeachingGuide {
 goal: string; idea: string; words: {term: string; meaning: string}[];
 examples: TeachingExample[]; hints: string[];
 misconception: {wrong: string; repair: string};
 practice: {prompt: string; choices: string[]; correctIndex: number; feedback: string[]};
 transfer: string;
}
export const MATH_TEACHING_GUIDES: Record<string, TeachingGuide> = {
  "NS1": {
    "goal": "Explain a digit’s value and compare numbers using their places.",
    "idea": "A digit names how many groups; its place tells the size of each group. In base ten, each place is ten times the place to its right.",
    "words": [
      {
        "term": "digit",
        "meaning": "One symbol from 0 to 9."
      },
      {
        "term": "place value",
        "meaning": "The value a digit has because of its position."
      },
      {
        "term": "tenths",
        "meaning": "Ten equal parts make one whole."
      }
    ],
    "examples": [
      {
        "title": "Find a digit’s value",
        "prompt": "What is the value of the 6 in 36,420?",
        "steps": [
          {
            "action": "Label the places: 3 ten-thousands, 6 thousands, 4 hundreds, 2 tens, 0 ones.",
            "why": "Counting places from the ones column keeps the labels aligned."
          },
          {
            "action": "The 6 represents 6 × 1,000 = 6,000.",
            "why": "The question asks for the value, not just the digit 6."
          },
          {
            "action": "Check: 30,000 + 6,000 + 400 + 20 = 36,420.",
            "why": "Expanded form reconstructs the original number."
          }
        ],
        "check": "Six thousands contributes 6,000, not 600."
      },
      {
        "title": "Compare decimals",
        "prompt": "Which is greater: 0.6 or 0.58?",
        "steps": [
          {
            "action": "Write 0.6 as 0.60 and align decimal points.",
            "why": "A trailing zero does not change the number."
          },
          {
            "action": "Compare tenths first: 6 tenths > 5 tenths, so 0.60 > 0.58.",
            "why": "Start with the largest place that differs. More decimal digits does not mean a larger value."
          }
        ],
        "check": "On a number line, 0.60 lies to the right of 0.58. For negative numbers, the one farther right is still greater: −0.58 > −0.60."
      }
    ],
    "hints": [
      "Find the ones place just left of the decimal point.",
      "Label places outward: tens, hundreds to the left; tenths, hundredths to the right.",
      "Write digit × place value. When comparing, align decimal points and compare the first different place."
    ],
    "misconception": {
      "wrong": "“0.58 is larger than 0.6 because 58 is larger than 6.”",
      "repair": "Use the same-sized pieces: 0.58 is 58 hundredths; 0.6 is 60 hundredths."
    },
    "practice": {
      "prompt": "Which is equal to the value of the 4 in 0.047?",
      "choices": [
        "4 tenths",
        "4 hundredths",
        "4 thousandths"
      ],
      "correctIndex": 1,
      "feedback": [
        "Tenths are immediately after the decimal; that digit is 0.",
        "Yes: the 4 is in the hundredths place, so its value is 0.04.",
        "The 7 is in the thousandths place. Count places from the decimal."
      ]
    },
    "transfer": "In your problem, label the target digit’s place before calculating. Explain how the number line or expanded form confirms your answer."
  },
  "NS2": {
    "goal": "Translate fractions, decimals, and percentages without changing the amount.",
    "idea": "A fraction a/b means a ÷ b, with b nonzero. In a part-of-a-whole model, the pieces must be equal. Percent means per hundred; these are different names for the same number.",
    "words": [
      {
        "term": "numerator",
        "meaning": "The top number: how many pieces or groups are counted."
      },
      {
        "term": "denominator",
        "meaning": "The bottom number: how many equal parts make one whole; it determines the size of each part."
      },
      {
        "term": "percent",
        "meaning": "A number of hundredths; 1% = 0.01."
      }
    ],
    "examples": [
      {
        "title": "Fraction → decimal → percent",
        "prompt": "Write 3/5 as a decimal and a percent.",
        "steps": [
          {
            "action": "Compute 3 ÷ 5 = 0.6.",
            "why": "The fraction bar is division."
          },
          {
            "action": "Compute 0.6 × 100 = 60, then attach %: 60%.",
            "why": "Sixty hundredths equals six tenths."
          },
          {
            "action": "Check: 60/100 simplifies to 3/5.",
            "why": "Converting back should preserve the value."
          }
        ],
        "check": "3/5 is more than half and less than one; 60% fits."
      },
      {
        "title": "Find a percent of an amount",
        "prompt": "What is 15% of 80?",
        "steps": [
          {
            "action": "Write 15% = 15/100 = 0.15.",
            "why": "The percent sign already means divide by 100."
          },
          {
            "action": "Multiply 0.15 × 80 = 12.",
            "why": "“Of” asks for that fraction of the whole."
          },
          {
            "action": "Check: 10% of 80 is 8, and 5% is 4; 8 + 4 = 12.",
            "why": "A second strategy confirms the calculation."
          }
        ],
        "check": "The part, 12, is smaller than 80 because 15% is less than 100%."
      }
    ],
    "hints": [
      "Name the whole or reference amount.",
      "For a fraction, divide numerator by denominator. For a percent, divide its written number by 100.",
      "If asked for a percent of a quantity, multiply the decimal form by the whole."
    ],
    "misconception": {
      "wrong": "“25% = 25” or “a ratio of 2 red to 3 blue means 2/3 of all objects are red.”",
      "repair": "25% = 0.25. A part-to-part ratio 2:3 has 5 total parts, so the red fraction of the whole is 2/5."
    },
    "practice": {
      "prompt": "A fraction equals 0.35. Which percent has the same value?",
      "choices": [
        "0.35%",
        "35%",
        "350%"
      ],
      "correctIndex": 1,
      "feedback": [
        "0.35% means 0.0035. Divide by 100 to read a percent as a decimal.",
        "Yes: 35/100 = 0.35.",
        "350% equals 3.5, ten times the stated decimal."
      ]
    },
    "transfer": "Name the whole, show one conversion, and convert back to check. Fractions and percents can exceed one whole: 5/4 = 125%."
  },
  "PR1": {
    "goal": "Choose the correct relationship before scaling a quantity.",
    "idea": "In a direct proportion y = kx, the ratio y/x stays constant. Scaling x by a factor scales y by that same factor. This assumes the rate and conditions stay the same.",
    "words": [
      {
        "term": "ratio",
        "meaning": "A comparison by division, with quantities in a stated order."
      },
      {
        "term": "scale factor",
        "meaning": "New known amount divided by old known amount."
      },
      {
        "term": "unit rate",
        "meaning": "How much of one quantity corresponds to one unit of another."
      }
    ],
    "examples": [
      {
        "title": "Direct scaling",
        "prompt": "At a constant speed, a cart travels 12 m in 3 s. How far in 5 s?",
        "steps": [
          {
            "action": "Write the rate: 12 m / 3 s = 4 m/s.",
            "why": "Constant speed means distance per second stays the same."
          },
          {
            "action": "Multiply 4 m/s × 5 s = 20 m.",
            "why": "The seconds cancel, leaving distance."
          },
          {
            "action": "Alternatively, scale time by 5/3 and distance by 5/3: 12 × 5/3 = 20.",
            "why": "Matching ratios compare the same quantities in the same order: 12 m / 3 s = d / 5 s."
          }
        ],
        "check": "More time at the same speed gives more distance."
      },
      {
        "title": "Recognize an inverse case",
        "prompt": "The same 24 m trip takes 6 s at 4 m/s. How long at 8 m/s?",
        "steps": [
          {
            "action": "Keep distance fixed: t = d/v.",
            "why": "Time and speed have an inverse relationship for a fixed trip."
          },
          {
            "action": "Compute 24 m ÷ 8 m/s = 3 s.",
            "why": "Doubling speed halves time when distance is unchanged."
          }
        ],
        "check": "Do not multiply time by 2: that would change the distance."
      }
    ],
    "hints": [
      "Write what stays fixed: a rate, a total, or something else.",
      "For direct proportion, find the new/old factor for the known quantity.",
      "Multiply the other quantity by that factor; use units and direction to check."
    ],
    "misconception": {
      "wrong": "“Add the same amount to both quantities.”",
      "repair": "Proportional scaling uses the same multiplicative factor. Also, a rule with a starting fee, y = kx + b with b ≠ 0, is not a direct proportion."
    },
    "practice": {
      "prompt": "At a fixed rate, 4 notebooks cost $12. What do 6 cost?",
      "choices": [
        "$14",
        "$18",
        "$24"
      ],
      "correctIndex": 1,
      "feedback": [
        "Adding 2 notebooks does not mean adding $2. First find $3 per notebook.",
        "Yes: $12/4 = $3 each, and 6 × $3 = $18.",
        "$24 would buy 8 notebooks at the same rate."
      ]
    },
    "transfer": "State the condition that makes scaling valid. Predict whether your answer should grow or shrink before calculating."
  },
  "PR2": {
    "goal": "Use direct, inverse, and inverse-square models to predict change.",
    "idea": "The relationship chooses the operation. If x changes by factor f: y ∝ x gives factor f; y ∝ 1/x gives 1/f; y ∝ 1/x² gives 1/f². Do not assume every physical relationship is inverse-square.",
    "words": [
      {
        "term": "factor",
        "meaning": "A multiplier, not an amount added."
      },
      {
        "term": "inverse-square",
        "meaning": "The product yx² remains constant when other conditions are fixed."
      },
      {
        "term": "distance r",
        "meaning": "For spherical gravity models, separation is measured between centers."
      }
    ],
    "examples": [
      {
        "title": "Farther from a source",
        "prompt": "Under an inverse-square model, intensity is 36 units at 2 m. What is it at 6 m?",
        "steps": [
          {
            "action": "Find f = 6/2 = 3.",
            "why": "The new distance is three times the old distance."
          },
          {
            "action": "Square f: 3² = 9.",
            "why": "The model depends on squared distance."
          },
          {
            "action": "Divide intensity by 9: 36/9 = 4 units.",
            "why": "The inverse makes a larger denominator produce a smaller intensity."
          }
        ],
        "check": "Check: 4 × 6² = 36 × 2² = 144."
      },
      {
        "title": "Closer to a source",
        "prompt": "Under the same model, what happens when distance is halved?",
        "steps": [
          {
            "action": "Use f = 1/2.",
            "why": "Write new distance divided by old distance."
          },
          {
            "action": "Compute 1/f² = 1/(1/2)² = 4.",
            "why": "Dividing by a quarter multiplies by four."
          }
        ],
        "check": "The effect becomes four times as strong. For light this assumes an approximately point-like source with unchanged output and negligible absorption; gravity requires fixed masses in the applicable model."
      }
    ],
    "hints": [
      "Find the stated relationship before using a formula.",
      "Write f = new distance / old distance.",
      "For inverse-square, calculate new effect = old effect × (old distance / new distance)²."
    ],
    "misconception": {
      "wrong": "“Three times farther means one third as strong.”",
      "repair": "That is inverse, not inverse-square. Square the distance factor first: one ninth as strong."
    },
    "practice": {
      "prompt": "For an inverse-square effect, doubling distance changes the effect by which factor?",
      "choices": [
        "2",
        "1/2",
        "1/4"
      ],
      "correctIndex": 2,
      "feedback": [
        "That is direct proportionality; an inverse-square effect gets weaker.",
        "You inverted but did not square the distance factor.",
        "Yes: 1/(2²) = 1/4, with other conditions unchanged."
      ]
    },
    "transfer": "Name your model and what stays fixed. Check your factor using both directions: reversing the distance change should undo the effect change."
  },
  "QE1": {
    "goal": "Write and calculate with scientific notation while preserving value.",
    "idea": "For a nonzero number, scientific notation is a × 10ⁿ with 1 ≤ |a| < 10 and integer n. Positive exponents multiply by tens; negative exponents divide by tens. The exponent records scale.",
    "words": [
      {
        "term": "coefficient",
        "meaning": "The number a in front of × 10ⁿ."
      },
      {
        "term": "exponent",
        "meaning": "The integer n showing the power of ten."
      },
      {
        "term": "normalize",
        "meaning": "Adjust the coefficient and exponent together to keep the same value."
      }
    ],
    "examples": [
      {
        "title": "A small number",
        "prompt": "Write 0.00072 in scientific notation.",
        "steps": [
          {
            "action": "Choose coefficient 7.2.",
            "why": "It lies between 1 and 10."
          },
          {
            "action": "7.2 must be divided by 10,000 to make 0.00072.",
            "why": "Four factors of ten in the denominator give 10⁻⁴."
          },
          {
            "action": "Write 7.2 × 10⁻⁴.",
            "why": "The small positive number requires a negative exponent."
          }
        ],
        "check": "7.2/10,000 = 0.00072. Zero can be written as 0 but has no unique normalized exponent."
      },
      {
        "title": "Multiply and normalize",
        "prompt": "Compute (3 × 10⁴)(4 × 10³).",
        "steps": [
          {
            "action": "Multiply coefficients: 3 × 4 = 12. Add exponents: 4 + 3 = 7.",
            "why": "Products of powers with the same base add exponents."
          },
          {
            "action": "Rewrite 12 × 10⁷ = 1.2 × 10⁸.",
            "why": "Dividing the coefficient by 10 requires multiplying the power of ten by 10."
          }
        ],
        "check": "For division, divide coefficients and subtract exponents. For addition, first match exponents: 3 × 10⁴ + 2 × 10³ = (3 + 0.2) × 10⁴ = 3.2 × 10⁴."
      }
    ],
    "hints": [
      "Estimate whether the original number is above 10, between 1 and 10, or below 1.",
      "Keep the coefficient’s magnitude from 1 up to, but not including, 10.",
      "Expand your answer with multiplication or division by powers of ten to check it."
    ],
    "misconception": {
      "wrong": "“10³ + 10² = 10⁵.”",
      "repair": "Exponent addition applies to multiplication, not addition. Here 1000 + 100 = 1100 = 1.1 × 10³."
    },
    "practice": {
      "prompt": "Which equals 8 × 10⁻³?",
      "choices": [
        "8000",
        "0.008",
        "0.0008"
      ],
      "correctIndex": 1,
      "feedback": [
        "A negative exponent divides by a power of ten.",
        "Yes: 8/1000 = 0.008.",
        "That would be 8 × 10⁻⁴; check the number of places."
      ]
    },
    "transfer": "Show the coefficient operation and the exponent operation separately. Normalize only while keeping the value unchanged."
  },
  "QE2": {
    "goal": "Convert units and check dimensions without changing the physical quantity.",
    "idea": "A conversion factor compares two equal quantities, so its value is one. Multiplying by it changes the unit expression, not the physical amount. Units can reveal an invalid setup, but matching units alone do not prove a formula is correct.",
    "words": [
      {
        "term": "conversion factor",
        "meaning": "A ratio of equal quantities, such as 100 cm / 1 m."
      },
      {
        "term": "cancel",
        "meaning": "Remove a common multiplicative factor from numerator and denominator."
      },
      {
        "term": "dimension",
        "meaning": "The kind of quantity, such as length, time, or mass."
      }
    ],
    "examples": [
      {
        "title": "Choose the factor direction",
        "prompt": "Convert 2.5 km to meters.",
        "steps": [
          {
            "action": "Write 2.5 km × (1000 m / 1 km).",
            "why": "Kilometers must appear in the denominator to cancel the original km."
          },
          {
            "action": "Cancel km and compute 2.5 × 1000 = 2500 m.",
            "why": "A smaller unit requires a larger numerical count for the same length."
          }
        ],
        "check": "2500 m ÷ 1000 = 2.5 km."
      },
      {
        "title": "Convert a rate",
        "prompt": "Convert 72 km/h to m/s.",
        "steps": [
          {
            "action": "Write 72 km/h × (1000 m / 1 km) × (1 h / 3600 s).",
            "why": "Convert both distance and time. Hours go on top to cancel hours on the bottom."
          },
          {
            "action": "Compute 72 × 1000 / 3600 = 20 m/s.",
            "why": "Only meters per second remain."
          }
        ],
        "check": "For squared units, square the whole conversion: 1 m² = (100 cm)² = 10,000 cm²."
      }
    ],
    "hints": [
      "Write the starting quantity with its unit and name the target unit.",
      "Place the unwanted unit opposite its current position in a conversion fraction.",
      "Cancel symbols before calculating. If the target unit is not left, turn the factor around or add another factor."
    ],
    "misconception": {
      "wrong": "“Convert km/h to m/s by multiplying by 1000 only.”",
      "repair": "That gives m/h. Convert the denominator too; use 1 h / 3600 s."
    },
    "practice": {
      "prompt": "Which factor converts 300 cm to meters?",
      "choices": [
        "100 cm / 1 m",
        "1 m / 100 cm",
        "100 m / 1 cm"
      ],
      "correctIndex": 1,
      "feedback": [
        "This places cm on top twice, so the unwanted unit does not cancel.",
        "Yes: 300 cm × (1 m/100 cm) = 3 m.",
        "Those are not equal quantities, so this fraction is not a valid conversion factor."
      ]
    },
    "transfer": "Show at least one conversion fraction and the canceled units. Dimensionless quantities, such as a ratio of lengths, can legitimately have no unit."
  },
  "QE3": {
    "goal": "Build a defensible estimate from assumptions and easy arithmetic.",
    "idea": "An estimate is a reasoned range or approximate value. State what you assume, choose a model, and keep enough scale information to detect a factor-of-ten error. An estimate is not an unsupported guess.",
    "words": [
      {
        "term": "assumption",
        "meaning": "A plausible value or condition used when exact information is unavailable."
      },
      {
        "term": "order of magnitude",
        "meaning": "A scale described with powers of ten; state the convention you use."
      },
      {
        "term": "range",
        "meaning": "Lower and upper plausible values."
      }
    ],
    "examples": [
      {
        "title": "Build a Fermi estimate",
        "prompt": "About how many pages does a student read in 20 school days?",
        "steps": [
          {
            "action": "Assume 15 pages per day.",
            "why": "This is an estimate of daily reading, not measured data."
          },
          {
            "action": "Compute 15 pages/day × 20 days = 300 pages.",
            "why": "The units and model link a daily rate to a total."
          },
          {
            "action": "Try 10 to 20 pages/day: the total ranges from 200 to 400 pages.",
            "why": "A range shows how sensitive the result is to the assumption."
          }
        ],
        "check": "300 pages has a scale of a few hundred, or a few × 10² pages. If asked for the nearest power of ten, specify that convention; do not silently discard the coefficient."
      },
      {
        "title": "Estimate a product",
        "prompt": "Estimate 312 × 49.",
        "steps": [
          {
            "action": "Use nearby friendly numbers: 300 × 50.",
            "why": "One number is rounded down and one up; that helps keep this estimate close."
          },
          {
            "action": "Calculate 15,000 and compare with 312 × 49 = 15,288.",
            "why": "The estimate is within about 2% of the exact product."
          }
        ],
        "check": "For products, multiply the rounded coefficients and add exponents; for quotients, divide coefficients and subtract exponents. These rules do not apply directly to sums."
      }
    ],
    "hints": [
      "List the unknown and two or three quantities that could build it.",
      "Assign plausible values with units; write the model before multiplying.",
      "Change the least-certain assumption to get a range. Explain whether your answer is physically plausible."
    ],
    "misconception": {
      "wrong": "“Keep only the powers of ten and ignore every coefficient.”",
      "repair": "Coefficients can change the scale of the answer. For example, 9 × 9 = 81; replacing each 9 by 1 badly underestimates the product."
    },
    "practice": {
      "prompt": "You estimate 30 people each use 2 L of water. What is a reasonable total?",
      "choices": [
        "15 L",
        "60 L",
        "600 L"
      ],
      "correctIndex": 1,
      "feedback": [
        "Divide only if the model asks for a per-person amount. Here the individual amounts add.",
        "Yes: 30 people × 2 L/person = 60 L.",
        "Check powers of ten: 3 × 2 × 10 = 60, not 600."
      ]
    },
    "transfer": "Write “I assume ___ because ___; this gives about ___.” Identify the assumption that most affects your answer."
  },
  "QE4": {
    "goal": "Report results with precision appropriate to the data and operation.",
    "idea": "Precision describes resolution or repeatability; accuracy describes closeness to a reference value. Calculator digits do not create measurement information. Use a stated uncertainty when given; otherwise use the appropriate classroom rounding convention.",
    "words": [
      {
        "term": "significant figures",
        "meaning": "Digits that convey measurement precision, including zeros between nonzero digits and trailing zeros after a decimal."
      },
      {
        "term": "decimal place",
        "meaning": "A position such as tenths or hundredths."
      },
      {
        "term": "exact quantity",
        "meaning": "A defined conversion or counted amount that does not limit significant figures."
      }
    ],
    "examples": [
      {
        "title": "Multiplication and division",
        "prompt": "A rectangle measures 2.4 m by 3.12 m. Report its area.",
        "steps": [
          {
            "action": "Compute 2.4 × 3.12 = 7.488 m².",
            "why": "Keep calculator digits while working."
          },
          {
            "action": "The measurements have 2 and 3 significant figures; report 2 significant figures.",
            "why": "For multiplication/division, the least number of significant figures limits the result under this convention."
          },
          {
            "action": "Round once: 7.5 m².",
            "why": "The next digit, 8, rounds the tenths upward."
          }
        ],
        "check": "Exact conversion factors do not reduce precision."
      },
      {
        "title": "Addition and subtraction",
        "prompt": "Add 12.3 cm and 0.46 cm.",
        "steps": [
          {
            "action": "Compute 12.3 + 0.46 = 12.76 cm.",
            "why": "The lengths must share a unit before adding."
          },
          {
            "action": "Round to tenths: 12.8 cm.",
            "why": "For addition/subtraction, use the least precise decimal place, not the fewest significant figures."
          }
        ],
        "check": "0.00450 has 3 significant figures. A bare 1500 can be ambiguous; 1.50 × 10³ explicitly shows 3. For an analog scale, a reasonable estimated digit beyond marked divisions may be reported when justified by the instrument and method."
      }
    ],
    "hints": [
      "Decide whether values are measured, counted, or defined exactly.",
      "Choose the rule for the operation: significant figures for ×/÷, decimal places for +/−.",
      "Keep extra digits until the final step. Include the unit; if uncertainty is supplied, follow the stated uncertainty convention."
    ],
    "misconception": {
      "wrong": "“Every operation uses the smallest number of significant figures.”",
      "repair": "Addition and subtraction depend on decimal place. Also, precision is not the same as accuracy."
    },
    "practice": {
      "prompt": "Report 4.56 s + 1.2 s using the addition rule.",
      "choices": [
        "5.76 s",
        "5.8 s",
        "6 s"
      ],
      "correctIndex": 1,
      "feedback": [
        "The sum has too many decimal places for a value given only to tenths.",
        "Yes: 5.76 s rounds to 5.8 s, the tenths place.",
        "This rounds too far. The limiting input reaches tenths, not whole seconds."
      ]
    },
    "transfer": "State which input and which operation limit your reported precision. Do not change the reasoning based only on calculator display length."
  },
  "SM1": {
    "goal": "Isolate a variable by applying valid operations to both sides.",
    "idea": "An equation states that two expressions have equal value. Preserve that equality at every step. Name the target variable, then undo the operations around it; do not merely “move” symbols and change signs.",
    "words": [
      {
        "term": "inverse operation",
        "meaning": "An operation that undoes another, such as division undoing multiplication."
      },
      {
        "term": "isolate",
        "meaning": "Leave the target variable alone on one side."
      },
      {
        "term": "domain restriction",
        "meaning": "A value excluded because an operation would be undefined, such as division by zero."
      }
    ],
    "examples": [
      {
        "title": "Undo addition, then multiplication",
        "prompt": "Solve v = u + at for a.",
        "steps": [
          {
            "action": "Subtract u from BOTH sides: v − u = at.",
            "why": "This removes the added term without changing equality."
          },
          {
            "action": "Divide BOTH sides by t: a = (v − u)/t, with t ≠ 0.",
            "why": "The entire difference is divided by t, not just u."
          },
          {
            "action": "Substitute back: u + [(v − u)/t]t = v.",
            "why": "A back-substitution checks the rearrangement."
          }
        ],
        "check": "With u = 2 m/s, v = 8 m/s, t = 3 s, a = 2 m/s²."
      },
      {
        "title": "A variable in a denominator or square",
        "prompt": "Solve v = d/t for t, and x² = 9 for x.",
        "steps": [
          {
            "action": "Multiply v = d/t by t: vt = d; divide by v: t = d/v.",
            "why": "The original requires t ≠ 0; division by v also requires v ≠ 0."
          },
          {
            "action": "For x² = 9, both x = 3 and x = −3 work.",
            "why": "Taking a square root of a squared unknown generally introduces two sign possibilities."
          },
          {
            "action": "If x represents a magnitude or elapsed time, choose only values allowed by that context.",
            "why": "Physical meaning can restrict a mathematical solution; do not discard signs without a reason."
          }
        ],
        "check": "For 1/x expressions, check the original equation’s forbidden values."
      }
    ],
    "hints": [
      "Circle the variable you want alone.",
      "Name the outermost operation around it, then do the inverse on both sides.",
      "Keep parentheses around sums or differences. Test the final expression in the original equation."
    ],
    "misconception": {
      "wrong": "“a = v − u/t” when rearranging v = u + at.",
      "repair": "The numerator is the entire velocity change: a = (v − u)/t."
    },
    "practice": {
      "prompt": "Solve F = ma for m, assuming a ≠ 0.",
      "choices": [
        "m = F/a",
        "m = a/F",
        "m = F − a"
      ],
      "correctIndex": 0,
      "feedback": [
        "Yes: divide both sides by a, so F/a = m.",
        "Dividing in this order does not undo multiplication by a.",
        "Subtraction does not undo multiplication."
      ]
    },
    "transfer": "Write the operation performed on both sides on each line. Check units and substitute your expression into the starting equation."
  },
  "SM2": {
    "goal": "Substitute values using parentheses, order of operations, signs, and units.",
    "idea": "Replace each symbol with its entire value, including its sign and unit. Parentheses preserve the grouping in the formula. Evaluate powers before multiplication; handle multiplication and division left to right, and likewise addition and subtraction.",
    "words": [
      {
        "term": "substitute",
        "meaning": "Replace a symbol with the quantity it represents."
      },
      {
        "term": "parentheses",
        "meaning": "Grouping that makes the scope of an operation explicit."
      },
      {
        "term": "evaluate",
        "meaning": "Calculate the value of an expression."
      }
    ],
    "examples": [
      {
        "title": "Substitute into a motion formula",
        "prompt": "Find displacement from Δx = ut + ½at² for u = 2 m/s, a = 3 m/s², t = 4 s.",
        "steps": [
          {
            "action": "Write Δx = (2 m/s)(4 s) + ½(3 m/s²)(4 s)².",
            "why": "The exponent applies to the entire time quantity, not to acceleration or to ½."
          },
          {
            "action": "Compute the square first: (4 s)² = 16 s².",
            "why": "Powers come before the products."
          },
          {
            "action": "Compute terms: 8 m + 24 m = 32 m.",
            "why": "Both terms have units of length, so addition is valid."
          }
        ],
        "check": "The result exceeds 8 m because positive acceleration adds displacement in this example."
      },
      {
        "title": "A negative value squared",
        "prompt": "If v = −3 m/s, evaluate v².",
        "steps": [
          {
            "action": "Write v² = (−3 m/s)² = 9 m²/s².",
            "why": "Squaring the whole negative value gives a positive result."
          },
          {
            "action": "Compare −3² = −(3²) = −9 when there are no parentheses.",
            "why": "The exponent acts before the leading minus sign."
          }
        ],
        "check": "Write the formula before entering numbers in a calculator; parentheses prevent a different expression being evaluated."
      }
    ],
    "hints": [
      "List each symbol, its value, and its unit. Convert to compatible units.",
      "Substitute all values in one line with parentheses around negatives and fractions.",
      "Do powers, products/quotients, then sums/differences. Check the units of every term."
    ],
    "misconception": {
      "wrong": "“½at² means (½at)².”",
      "repair": "Only t is squared in this formula. Write ½ × a × (t²)."
    },
    "practice": {
      "prompt": "For a = −2 m/s² and t = 3 s, what is at²?",
      "choices": [
        "−18 m",
        "36 m",
        "−6 m"
      ],
      "correctIndex": 0,
      "feedback": [
        "Yes: (−2 m/s²)(3 s)² = −2 × 9 m = −18 m.",
        "This squares more than just the time. Preserve the original formula.",
        "That is at; the formula asks for at², so square time first."
      ]
    },
    "transfer": "Show one complete substitution line. Before calculating, predict the sign and check whether the final unit matches the requested quantity."
  },
  "GV1": {
    "goal": "Use axis labels to interpret slope and signed area.",
    "idea": "A graph connects two quantities. Slope means vertical change divided by horizontal change; its units identify the rate. Area multiplies vertical and horizontal units. A line’s height, slope, and area describe different quantities.",
    "words": [
      {
        "term": "slope",
        "meaning": "Δy/Δx over an interval; for a curve this is an average rate over that interval."
      },
      {
        "term": "signed area",
        "meaning": "Area above the horizontal axis counts positive and below counts negative."
      },
      {
        "term": "displacement",
        "meaning": "Change in position, which may be negative or zero."
      }
    ],
    "examples": [
      {
        "title": "Slope is a rate",
        "prompt": "A velocity–time line goes through (1 s, 2 m/s) and (4 s, 8 m/s). Find its slope.",
        "steps": [
          {
            "action": "Compute Δv = 8 − 2 = 6 m/s and Δt = 4 − 1 = 3 s.",
            "why": "Use corresponding points in the same subtraction order."
          },
          {
            "action": "Slope = (6 m/s)/(3 s) = 2 m/s².",
            "why": "Velocity change per second is acceleration."
          },
          {
            "action": "Interpret: velocity increases by 2 m/s each second on this straight segment.",
            "why": "The units and axis labels determine the physical meaning."
          }
        ],
        "check": "On a position–time graph, slope is velocity instead. On a curved graph, a tangent slope describes the instantaneous rate."
      },
      {
        "title": "Area and direction",
        "prompt": "Velocity is +3 m/s for 2 s, then −2 m/s for 2 s. Find displacement and distance.",
        "steps": [
          {
            "action": "First area: (+3 m/s)(2 s) = +6 m. Second area: (−2 m/s)(2 s) = −4 m.",
            "why": "Velocity × time gives displacement, with a sign for direction."
          },
          {
            "action": "Displacement = +6 m − 4 m = +2 m.",
            "why": "Signed areas add to the net change in position."
          },
          {
            "action": "Distance traveled = |6 m| + |−4 m| = 10 m.",
            "why": "Distance adds the lengths traveled, regardless of direction."
          }
        ],
        "check": "Signed area under velocity–time gives displacement. Area under speed–time gives distance. Area under acceleration–time gives change in velocity."
      }
    ],
    "hints": [
      "Read both axis labels and their scale marks before calculating.",
      "For a rate, choose two points and divide the change in the vertical quantity by the change in the horizontal quantity.",
      "For an accumulated quantity, split the area into rectangles/triangles and keep signs below the axis."
    ],
    "misconception": {
      "wrong": "“Area under velocity–time is always distance.”",
      "repair": "It is signed displacement. To find distance when direction changes, add the magnitudes of the pieces."
    },
    "practice": {
      "prompt": "Velocity is −4 m/s for 3 s. What is the displacement?",
      "choices": [
        "−12 m",
        "12 m",
        "−4/3 m/s²"
      ],
      "correctIndex": 0,
      "feedback": [
        "Yes: the signed area is (−4 m/s)(3 s) = −12 m.",
        "That is the distance traveled, not the signed displacement.",
        "The velocity is constant, so acceleration is zero; the question asks for area, not slope."
      ]
    },
    "transfer": "Write the units of slope or area before naming its meaning. Explain a negative sign in terms of the chosen direction."
  },
  "GV2": {
    "goal": "Choose axes and interpret a fitted relationship without assuming every graph is proportional.",
    "idea": "A straight line has form y = mx + b. It is directly proportional only if b = 0. A transformed horizontal variable can turn a nonlinear relationship into a line; the transformation changes the slope’s meaning and units.",
    "words": [
      {
        "term": "intercept b",
        "meaning": "The predicted y value when the plotted x value is zero."
      },
      {
        "term": "fit",
        "meaning": "A model that represents the pattern and scatter in measured data."
      },
      {
        "term": "linearize",
        "meaning": "Choose transformed variables that make the model a straight line."
      }
    ],
    "examples": [
      {
        "title": "Read a fit",
        "prompt": "A position–time fit is x = (2 m/s)t + 5 m. Interpret it.",
        "steps": [
          {
            "action": "Read slope 2 m/s: position changes by 2 m each second.",
            "why": "The coefficient of time gives the rate of change."
          },
          {
            "action": "Read intercept 5 m: predicted position at t = 0.",
            "why": "The line does not start at zero position."
          },
          {
            "action": "At t = 3 s, x = 11 m. Doubling t to 6 s gives x = 17 m, not 22 m.",
            "why": "A nonzero intercept prevents direct proportional scaling of the total position."
          }
        ],
        "check": "Calculate slope using two well-separated points on the fitted line, rather than arbitrary neighboring noisy data points."
      },
      {
        "title": "Choose transformed axes",
        "prompt": "For motion from rest with constant acceleration, Δx = ½at². How can a straight-line graph reveal a?",
        "steps": [
          {
            "action": "Plot Δx vertically against t² horizontally.",
            "why": "The formula becomes y = mX with X = t²."
          },
          {
            "action": "The slope has units m/s² and equals a/2.",
            "why": "The plotted variable is squared time, so the coefficient is half the acceleration."
          },
          {
            "action": "If fitted slope is 1.5 m/s², then a = 2 × 1.5 = 3.0 m/s².",
            "why": "Read the actual coefficient; slope is not automatically the quantity you want."
          }
        ],
        "check": "For an inverse-square model, plot effect versus 1/r². Do not force a line through the origin unless the model and measurement setup justify it; predictions far outside the data are less secure."
      }
    ],
    "hints": [
      "Identify what quantity is on each axis, including any square or reciprocal.",
      "Match your model to y = mx + b and label both m and b with units.",
      "Use the fitted line within the observed range; describe scatter and any nonzero intercept."
    ],
    "misconception": {
      "wrong": "“Every straight line means doubling x doubles y.”",
      "repair": "That is true only for a straight line through the origin. Test a nonzero-intercept model with two values."
    },
    "practice": {
      "prompt": "A graph of acceleration a against force F has slope 0.25 kg⁻¹. For F = ma, what mass does it imply?",
      "choices": [
        "0.25 kg",
        "4 kg",
        "Cannot use the slope"
      ],
      "correctIndex": 1,
      "feedback": [
        "Here slope is 1/m, not m: a = (1/m)F.",
        "Yes: m = 1/(0.25 kg⁻¹) = 4 kg.",
        "The stated model gives a straight line whose slope is 1/m, with other conditions fixed."
      ]
    },
    "transfer": "Name the variables actually plotted. Explain what the slope and intercept mean, and what assumptions make your fit reasonable."
  },
  "GV3": {
    "goal": "Resolve and add vectors while keeping angle reference, signs, and direction explicit.",
    "idea": "A vector has magnitude and direction. Components are signed projections on chosen axes. For θ measured from the positive x-axis, Vx = V cos θ and Vy = V sin θ. If the angle is measured from another axis, identify adjacent and opposite sides again.",
    "words": [
      {
        "term": "magnitude",
        "meaning": "The nonnegative length or size of a vector."
      },
      {
        "term": "component",
        "meaning": "A signed amount along one chosen axis."
      },
      {
        "term": "resultant",
        "meaning": "The vector sum, including both magnitude and direction."
      }
    ],
    "examples": [
      {
        "title": "Components from a horizontal angle",
        "prompt": "A 10 N force points 30° above the positive x-axis. Find Fx and Fy.",
        "steps": [
          {
            "action": "Sketch +x right and +y up; mark 30° from +x.",
            "why": "The angle’s reference determines which component is adjacent."
          },
          {
            "action": "Fx = 10 cos 30° ≈ 8.66 N; Fy = 10 sin 30° = 5.00 N.",
            "why": "Adjacent uses cosine, opposite uses sine, with the calculator in degrees."
          },
          {
            "action": "Both components are positive in this quadrant.",
            "why": "Their signs describe directions along the selected axes."
          }
        ],
        "check": "√(8.66² + 5.00²) ≈ 10 N. Each component’s magnitude is no larger than the original vector. If 30° were measured from +y toward +x, the x and y expressions would swap."
      },
      {
        "title": "Add and recover direction",
        "prompt": "Add vectors (3, 4) m and (−5, 2) m.",
        "steps": [
          {
            "action": "Add matching components: Rx = 3 − 5 = −2 m; Ry = 4 + 2 = 6 m.",
            "why": "Add signed x amounts separately from signed y amounts."
          },
          {
            "action": "Magnitude R = √[(−2)² + 6²] = √40 ≈ 6.32 m.",
            "why": "Perpendicular components form a right triangle."
          },
          {
            "action": "Direction is up and left: 18.4° west of north, or 108.4° counterclockwise from +x.",
            "why": "tan⁻¹(|Rx|/|Ry|) gives the small angle from north. A bare arctangent without quadrant reasoning can point the wrong way."
          }
        ],
        "check": "The resultant must lie in quadrant II because Rx < 0 and Ry > 0. Magnitude alone is not a complete vector answer."
      }
    ],
    "hints": [
      "Draw axes and mark where the angle starts.",
      "Label adjacent/opposite relative to that angle; assign component signs from direction.",
      "Add components first. Then find magnitude and state a direction with its reference axis."
    ],
    "misconception": {
      "wrong": "“The x-component always uses cosine, regardless of where the angle starts.”",
      "repair": "Cosine belongs to the adjacent component. If the angle is measured from the y-axis, the y-component may use cosine."
    },
    "practice": {
      "prompt": "A vector points left and up. What signs do its components have when +x is right and +y is up?",
      "choices": [
        "Vx > 0, Vy > 0",
        "Vx < 0, Vy > 0",
        "Vx < 0, Vy < 0"
      ],
      "correctIndex": 1,
      "feedback": [
        "A positive x-component points right; this vector points left.",
        "Yes: left gives negative x; up gives positive y.",
        "Negative y would point down."
      ]
    },
    "transfer": "State the angle reference and calculator mode. After calculating, sketch the resultant to check its quadrant and give both magnitude and direction."
  }
}
