/**
 * Physics calculator for HIGH SCHOOL conceptual physics problems
 * Uses algebra-based formulas only, suitable for students with Algebra 1 skills
 */

interface PhysicsContext {
  equation?: string
  variables?: Record<string, number>
  targetVariable?: string
}

// Use g=10 m/s² for high school simplicity (instead of GRAVITY)
const GRAVITY = 10 

export function calculatePhysicsSolution(questionText: string): { value: number; unit: string } | null {
  const lowerText = questionText.toLowerCase()
  
  // Extract numerical values from the question
  const numbers = extractNumbers(questionText)
  
  // Kinematics equations
  if (lowerText.includes('velocity') || lowerText.includes('speed')) {
    if (lowerText.includes('acceleration') && lowerText.includes('time')) {
      // v = v0 + at
      const acceleration = numbers.find(n => n.text.includes('m/s²') || n.text.includes('m/s^2'))
      const time = numbers.find(n => n.text.includes('s') && !n.text.includes('m/s'))
      const initialVelocity = numbers.find(n => n.text.includes('m/s') && !n.text.includes('m/s²'))
      
      if (acceleration && time) {
        const v0 = initialVelocity?.value || 0
        const finalVelocity = v0 + (acceleration.value * time.value)
        return { value: roundToSignificantFigures(finalVelocity, 3), unit: 'm/s' }
      }
    }
    
    if (lowerText.includes('distance') && lowerText.includes('time')) {
      // v = d/t
      const distance = numbers.find(n => n.text.includes('m') && !n.text.includes('m/s'))
      const time = numbers.find(n => n.text.includes('s') && !n.text.includes('m/s'))
      
      if (distance && time) {
        const velocity = distance.value / time.value
        return { value: roundToSignificantFigures(velocity, 3), unit: 'm/s' }
      }
    }
  }
  
  // Force equations
  if (lowerText.includes('force')) {
    if (lowerText.includes('mass') && lowerText.includes('acceleration')) {
      // F = ma
      const mass = numbers.find(n => n.text.includes('kg'))
      const acceleration = numbers.find(n => n.text.includes('m/s²') || n.text.includes('m/s^2'))
      
      if (mass && acceleration) {
        const force = mass.value * acceleration.value
        return { value: roundToSignificantFigures(force, 3), unit: 'N' }
      }
    }
  }
  
  // Energy equations
  if (lowerText.includes('kinetic energy')) {
    // KE = 1/2 * m * v²
    const mass = numbers.find(n => n.text.includes('kg'))
    const velocity = numbers.find(n => n.text.includes('m/s') && !n.text.includes('m/s²'))
    
    if (mass && velocity) {
      const kineticEnergy = 0.5 * mass.value * Math.pow(velocity.value, 2)
      return { value: roundToSignificantFigures(kineticEnergy, 3), unit: 'J' }
    }
  }
  
  if (lowerText.includes('potential energy') && lowerText.includes('height')) {
    // PE = mgh
    const mass = numbers.find(n => n.text.includes('kg'))
    const height = numbers.find(n => n.text.includes('m') && !n.text.includes('m/s'))
    const g = GRAVITY // Standard gravity
    
    if (mass && height) {
      const potentialEnergy = mass.value * g * height.value
      return { value: roundToSignificantFigures(potentialEnergy, 3), unit: 'J' }
    }
  }
  
  // Momentum
  if (lowerText.includes('momentum')) {
    // p = mv
    const mass = numbers.find(n => n.text.includes('kg'))
    const velocity = numbers.find(n => n.text.includes('m/s') && !n.text.includes('m/s²'))
    
    if (mass && velocity) {
      const momentum = mass.value * velocity.value
      return { value: roundToSignificantFigures(momentum, 3), unit: 'kg⋅m/s' }
    }
  }
  
  // Power
  if (lowerText.includes('power')) {
    if (lowerText.includes('work') && lowerText.includes('time')) {
      // P = W/t
      const work = numbers.find(n => n.text.includes('J'))
      const time = numbers.find(n => n.text.includes('s') && !n.text.includes('m/s'))
      
      if (work && time) {
        const power = work.value / time.value
        return { value: roundToSignificantFigures(power, 3), unit: 'W' }
      }
    }
  }
  
  // Pressure
  if (lowerText.includes('pressure')) {
    if (lowerText.includes('force') && lowerText.includes('area')) {
      // P = F/A
      const force = numbers.find(n => n.text.includes('N'))
      const area = numbers.find(n => n.text.includes('m²') || n.text.includes('m^2'))
      
      if (force && area) {
        const pressure = force.value / area.value
        return { value: roundToSignificantFigures(pressure, 3), unit: 'Pa' }
      }
    }
  }
  
  // Frequency and period
  if (lowerText.includes('frequency') && lowerText.includes('period')) {
    // f = 1/T
    const period = numbers.find(n => n.text.includes('s') && !n.text.includes('m/s'))
    
    if (period) {
      const frequency = 1 / period.value
      return { value: roundToSignificantFigures(frequency, 3), unit: 'Hz' }
    }
  }
  
  // Ohm's Law
  if (lowerText.includes('current') || lowerText.includes('voltage') || lowerText.includes('resistance')) {
    const voltage = numbers.find(n => n.text.includes('V'))
    const current = numbers.find(n => n.text.includes('A'))
    const resistance = numbers.find(n => n.text.includes('Ω') || n.text.includes('ohm'))
    
    if (voltage && resistance && !current) {
      // I = V/R
      const calculatedCurrent = voltage.value / resistance.value
      return { value: roundToSignificantFigures(calculatedCurrent, 3), unit: 'A' }
    }
    
    if (current && resistance && !voltage) {
      // V = IR
      const calculatedVoltage = current.value * resistance.value
      return { value: roundToSignificantFigures(calculatedVoltage, 3), unit: 'V' }
    }
    
    if (voltage && current && !resistance) {
      // R = V/I
      const calculatedResistance = voltage.value / current.value
      return { value: roundToSignificantFigures(calculatedResistance, 3), unit: 'Ω' }
    }
  }
  
  return null
}

function extractNumbers(text: string): { value: number; text: string }[] {
  const regex = /(\d+\.?\d*)\s*([a-zA-Z°Ω/²³]+)/g
  const matches = []
  let match
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      value: parseFloat(match[1]),
      text: match[0]
    })
  }
  
  return matches
}

function roundToSignificantFigures(num: number, sigFigs: number): number {
  if (num === 0) return 0
  const multiplier = Math.pow(10, sigFigs - Math.floor(Math.log10(Math.abs(num))) - 1)
  return Math.round(num * multiplier) / multiplier
}

/**
 * Generate similar but incorrect units for a given correct unit
 */
export function generateSimilarUnits(correctUnit: string): string[] {
  const unitGroups: Record<string, string[]> = {
    // Velocity/Speed
    'm/s': ['km/h', 'm/min', 'cm/s', 'mph', 'ft/s'],
    'km/h': ['m/s', 'mph', 'km/min', 'm/h', 'cm/s'],
    
    // Acceleration
    'm/s²': ['km/h²', 'cm/s²', 'ft/s²', 'm/s', 'km/s²'],
    
    // Force
    'N': ['kg⋅m/s²', 'dyne', 'lbf', 'kN', 'g⋅m/s²'],
    'kN': ['N', 'MN', 'kg⋅m/s²', 'lbf', 'dyne'],
    
    // Energy
    'J': ['kJ', 'cal', 'eV', 'N⋅m', 'kg⋅m²/s²'],
    'kJ': ['J', 'MJ', 'kcal', 'Wh', 'N⋅m'],
    
    // Power
    'W': ['kW', 'hp', 'J/s', 'N⋅m/s', 'cal/s'],
    'kW': ['W', 'MW', 'hp', 'kJ/s', 'cal/min'],
    
    // Pressure
    'Pa': ['kPa', 'bar', 'atm', 'N/m²', 'psi'],
    'kPa': ['Pa', 'MPa', 'bar', 'atm', 'mmHg'],
    
    // Electric
    'V': ['kV', 'mV', 'J/C', 'W/A', 'N⋅m/C'],
    'A': ['mA', 'μA', 'C/s', 'V/Ω', 'W/V'],
    'Ω': ['kΩ', 'mΩ', 'V/A', 'W/A²', 'V²/W'],
    
    // Frequency
    'Hz': ['kHz', 'MHz', 's⁻¹', 'rpm', 'rad/s'],
    
    // Mass
    'kg': ['g', 'mg', 'lb', 'ton', 'oz'],
    'g': ['kg', 'mg', 'μg', 'lb', 'oz'],
    
    // Length
    'm': ['km', 'cm', 'mm', 'ft', 'in'],
    'km': ['m', 'mi', 'cm', 'mm', 'yd'],
    
    // Time
    's': ['ms', 'μs', 'min', 'h', 'ns'],
    'min': ['s', 'h', 'ms', 'day', 'μs'],
    
    // Temperature
    '°C': ['K', '°F', '°R', 'C', 'kelvin'],
    'K': ['°C', '°F', '°R', 'celsius', 'C'],
    
    // Momentum
    'kg⋅m/s': ['N⋅s', 'g⋅m/s', 'kg⋅km/h', 'lb⋅ft/s', 'kg⋅cm/s']
  }
  
  const similarUnits = unitGroups[correctUnit] || []
  
  // If we have predefined similar units, shuffle and return 4
  if (similarUnits.length >= 4) {
    return shuffleArray(similarUnits).slice(0, 4)
  }
  
  // Fallback: generate variations
  const variations: string[] = []
  
  // Add prefix variations
  if (!correctUnit.startsWith('k') && !correctUnit.startsWith('m')) {
    variations.push('k' + correctUnit) // kilo
    variations.push('m' + correctUnit) // milli
  }
  
  // Add related units
  if (correctUnit.includes('/')) {
    const parts = correctUnit.split('/')
    variations.push(parts[1] + '/' + parts[0]) // Inverted
    variations.push(parts[0]) // Just numerator
    variations.push(parts[1]) // Just denominator
  }
  
  // Add common physics units as fallback
  const commonUnits = ['N', 'J', 'W', 'Pa', 'V', 'A', 'Hz', 'kg', 'm', 's']
  commonUnits.forEach(unit => {
    if (unit !== correctUnit && !variations.includes(unit)) {
      variations.push(unit)
    }
  })
  
  return shuffleArray(variations).slice(0, 4)
}

/**
 * Generate plausible incorrect answers based on common physics misconceptions
 */
export function generateIncorrectAnswers(correctAnswer: number, questionText: string): number[] {
  const lowerText = questionText.toLowerCase()
  const incorrectAnswers: number[] = []
  
  // Identify the physics concept to generate targeted misconceptions
  const conceptualErrors = generateConceptualErrors(correctAnswer, lowerText)
  
  // Add conceptual error-based answers
  conceptualErrors.forEach(error => {
    if (isFinite(error) && error !== 0 && Math.abs(error - correctAnswer) > correctAnswer * 0.05) {
      incorrectAnswers.push(roundToSignificantFigures(error, 3))
    }
  })
  
  // Common calculation mistakes
  const calculationErrors = [
    correctAnswer * 2,        // Forgot to divide by 2 (common in kinetic energy, average)
    correctAnswer / 2,        // Incorrectly divided by 2
    correctAnswer * 10,       // Decimal place error
    correctAnswer / 10,       // Decimal place error
    Math.sqrt(correctAnswer), // Forgot to square (common in energy problems)
    correctAnswer ** 2,       // Incorrectly squared
  ]
  
  // Add calculation errors if needed
  calculationErrors.forEach(error => {
    if (incorrectAnswers.length < 4 && isFinite(error) && error !== 0) {
      const rounded = roundToSignificantFigures(error, 3)
      if (!incorrectAnswers.includes(rounded) && Math.abs(rounded - correctAnswer) > correctAnswer * 0.05) {
        incorrectAnswers.push(rounded)
      }
    }
  })
  
  // Remove duplicates and limit to 4
  const uniqueAnswers = Array.from(new Set(incorrectAnswers))
  return shuffleArray(uniqueAnswers).slice(0, 4)
}

/**
 * Generate incorrect answers with explanations of misconceptions
 */
export function generateIncorrectAnswersWithExplanations(
  correctAnswer: number, 
  questionText: string
): { value: number; misconception: string }[] {
  const lowerText = questionText.toLowerCase()
  const incorrectOptions: { value: number; misconception: string }[] = []
  
  // Identify the physics concept to generate targeted misconceptions
  const conceptualErrors = generateConceptualErrorsWithExplanations(correctAnswer, lowerText)
  
  // Add conceptual error-based answers with explanations
  conceptualErrors.forEach(error => {
    if (isFinite(error.value) && error.value !== 0 && Math.abs(error.value - correctAnswer) > correctAnswer * 0.05) {
      incorrectOptions.push({
        value: roundToSignificantFigures(error.value, 3),
        misconception: error.misconception
      })
    }
  })
  
  // Common calculation mistakes with explanations
  const calculationErrors = [
    { value: correctAnswer * 2, misconception: "Forgot to divide by 2 (e.g., in KE = ½mv²)" },
    { value: correctAnswer / 2, misconception: "Incorrectly divided by 2" },
    { value: correctAnswer * 10, misconception: "Decimal place or unit conversion error" },
    { value: correctAnswer / 10, misconception: "Decimal place or unit conversion error" },
    { value: Math.sqrt(correctAnswer), misconception: "Forgot to square the value" },
    { value: correctAnswer ** 2, misconception: "Incorrectly squared the value" },
  ]
  
  // Add calculation errors if needed
  calculationErrors.forEach(error => {
    if (incorrectOptions.length < 4 && isFinite(error.value) && error.value !== 0) {
      const rounded = roundToSignificantFigures(error.value, 3)
      if (!incorrectOptions.some(opt => opt.value === rounded) && Math.abs(rounded - correctAnswer) > correctAnswer * 0.05) {
        incorrectOptions.push({
          value: rounded,
          misconception: error.misconception
        })
      }
    }
  })
  
  // Remove duplicates and limit to 4
  const uniqueOptions = incorrectOptions.filter((opt, index, self) =>
    index === self.findIndex(o => o.value === opt.value)
  )
  
  return shuffleArray(uniqueOptions).slice(0, 4)
}

/**
 * Generate conceptual errors based on physics topic
 */
function generateConceptualErrors(correctAnswer: number, questionText: string): number[] {
  const errors: number[] = []
  
  // Kinematics misconceptions
  if (questionText.includes('velocity') || questionText.includes('speed')) {
    // Confusing average and instantaneous velocity
    errors.push(correctAnswer * 0.5)  // Using half the velocity
    errors.push(correctAnswer * 2)    // Doubling velocity incorrectly
    
    if (questionText.includes('initial') || questionText.includes('final')) {
      // Forgetting initial velocity
      errors.push(correctAnswer - extractInitialVelocity(questionText))
      // Using only initial velocity
      errors.push(extractInitialVelocity(questionText))
    }
  }
  
  // Acceleration misconceptions
  if (questionText.includes('accelerat')) {
    // Confusing acceleration with velocity  
    errors.push(correctAnswer / GRAVITY)  // Dividing by g when not needed
    errors.push(correctAnswer * GRAVITY)  // Multiplying by g when not needed
    // Sign errors in deceleration
    errors.push(-correctAnswer)
  }
  
  // Force misconceptions
  if (questionText.includes('force')) {
    // Confusing mass and weight
    if (questionText.includes('weight')) {
      errors.push(correctAnswer / GRAVITY)  // Converting weight to mass incorrectly
      errors.push(correctAnswer * GRAVITY)  // Converting mass to weight incorrectly
    }
    // Forgetting Newton's third law
    errors.push(-correctAnswer)  // Opposite direction
    // Net force vs individual forces
    errors.push(correctAnswer * Math.sqrt(2))  // Vector addition error
  }
  
  // Energy misconceptions
  if (questionText.includes('energy')) {
    if (questionText.includes('kinetic')) {
      // Forgetting the 1/2 in KE = 1/2 mv²
      errors.push(correctAnswer * 2)
      // Linear instead of quadratic relationship with velocity
      errors.push(correctAnswer / 2)
      // Using mv instead of 1/2 mv²
      errors.push(correctAnswer / extractVelocity(questionText))
    }
    
    if (questionText.includes('potential')) {
      // Confusing height with distance
      errors.push(correctAnswer * Math.sqrt(2))
      // Forgetting gravity
      errors.push(correctAnswer / GRAVITY)
    }
    
    // Conservation of energy errors
    if (questionText.includes('conserv')) {
      errors.push(correctAnswer * 0.75)  // Assuming energy loss
      errors.push(correctAnswer * 1.25)  // Assuming energy gain
    }
  }
  
  // Momentum misconceptions
  if (questionText.includes('momentum')) {
    // Confusing momentum with kinetic energy
    errors.push(correctAnswer * 0.5)  // Using KE formula
    errors.push(correctAnswer ** 2)   // Squaring velocity
    // Elastic vs inelastic collision
    errors.push(correctAnswer * 0.5)  // Assuming perfectly inelastic
    errors.push(correctAnswer * 2)    // Doubling momentum incorrectly
  }
  
  // Circular motion misconceptions
  if (questionText.includes('circular') || questionText.includes('orbit')) {
    // Confusing angular and linear quantities
    errors.push(correctAnswer * 2 * Math.PI)  // Converting incorrectly
    errors.push(correctAnswer / (2 * Math.PI))
    // Centripetal vs centrifugal
    errors.push(-correctAnswer)
  }
  
  // Wave misconceptions
  if (questionText.includes('wave') || questionText.includes('frequency')) {
    // Inverse relationship confusion
    errors.push(1 / correctAnswer)
    // Period vs frequency
    errors.push(correctAnswer * 2 * Math.PI)
    // Wave speed equation errors
    errors.push(correctAnswer ** 2)
  }
  
  // Electricity misconceptions
  if (questionText.includes('current') || questionText.includes('voltage')) {
    // Ohm's law confusion
    errors.push(correctAnswer ** 2)  // Using power formula incorrectly
    errors.push(Math.sqrt(correctAnswer))
    // Series vs parallel
    errors.push(correctAnswer / 2)  // Halving incorrectly
    errors.push(correctAnswer * 2)  // Doubling incorrectly
  }
  
  // Projectile motion misconceptions
  if (questionText.includes('projectile') || questionText.includes('thrown')) {
    // Ignoring vertical component
    errors.push(correctAnswer * Math.cos(45 * Math.PI / 180))
    // Ignoring horizontal component  
    errors.push(correctAnswer * Math.sin(45 * Math.PI / 180))
    // Maximum height vs range confusion
    errors.push(correctAnswer / 4)
    errors.push(correctAnswer * 4)
  }
  
  // Friction misconceptions
  if (questionText.includes('friction')) {
    // Static vs kinetic friction
    errors.push(correctAnswer * 0.8)  // Lower kinetic coefficient
    errors.push(correctAnswer * 1.2)  // Higher static coefficient
    // Direction confusion
    errors.push(-correctAnswer)
  }
  
  // Pressure misconceptions
  if (questionText.includes('pressure')) {
    // Confusing pressure with force
    errors.push(correctAnswer * 10)  // Area error
    errors.push(correctAnswer / 10)
    // Depth relationship
    errors.push(correctAnswer ** 2)  // Quadratic instead of linear
  }
  
  // Temperature and heat misconceptions
  if (questionText.includes('temperature') || questionText.includes('heat')) {
    // Celsius to Kelvin errors
    errors.push(correctAnswer + 273.15)
    errors.push(correctAnswer - 273.15)
    // Confusing heat with temperature
    errors.push(correctAnswer * 4.18)  // Specific heat confusion
  }
  
  return errors.filter(e => isFinite(e) && e > 0)
}

/**
 * Extract velocity value from question text
 */
function extractVelocity(text: string): number {
  const match = text.match(/(\d+\.?\d*)\s*m\/s/i)
  return match ? parseFloat(match[1]) : 10 // Default to 10 m/s
}

/**
 * Extract initial velocity from question text
 */
function extractInitialVelocity(text: string): number {
  const match = text.match(/initial.*?(\d+\.?\d*)\s*m\/s/i)
  if (match) return parseFloat(match[1])
  
  // Check for "from rest"
  if (text.includes('from rest') || text.includes('at rest')) return 0
  
  return 5 // Default assumption
}

/**
 * Generate conceptual errors with explanations based on physics topic
 */
function generateConceptualErrorsWithExplanations(
  correctAnswer: number, 
  questionText: string
): { value: number; misconception: string }[] {
  const errors: { value: number; misconception: string }[] = []
  
  // Kinematics misconceptions
  if (questionText.includes('velocity') || questionText.includes('speed')) {
    errors.push({
      value: correctAnswer * 0.5,
      misconception: "Confused average with instantaneous velocity"
    })
    errors.push({
      value: correctAnswer * 2,
      misconception: "Doubled velocity incorrectly"
    })
    
    if (questionText.includes('initial') || questionText.includes('final')) {
      errors.push({
        value: correctAnswer - extractInitialVelocity(questionText),
        misconception: "Forgot to include initial velocity"
      })
      errors.push({
        value: extractInitialVelocity(questionText),
        misconception: "Used only initial velocity, ignored acceleration"
      })
    }
  }
  
  // Acceleration misconceptions
  if (questionText.includes('accelerat')) {
    errors.push({
      value: correctAnswer / GRAVITY,
      misconception: "Incorrectly divided by g (gravity)"
    })
    errors.push({
      value: correctAnswer * GRAVITY,
      misconception: "Incorrectly multiplied by g when not needed"
    })
    errors.push({
      value: -correctAnswer,
      misconception: "Sign error - confused direction of acceleration"
    })
  }
  
  // Force misconceptions
  if (questionText.includes('force')) {
    if (questionText.includes('weight')) {
      errors.push({
        value: correctAnswer / GRAVITY,
        misconception: "Confused weight with mass (W = mg)"
      })
      errors.push({
        value: correctAnswer * GRAVITY,
        misconception: "Confused mass with weight"
      })
    }
    errors.push({
      value: -correctAnswer,
      misconception: "Newton's 3rd law - used reaction force"
    })
    errors.push({
      value: correctAnswer * Math.sqrt(2),
      misconception: "Vector addition error - didn't account for direction"
    })
  }
  
  // Energy misconceptions
  if (questionText.includes('energy')) {
    if (questionText.includes('kinetic')) {
      errors.push({
        value: correctAnswer * 2,
        misconception: "Forgot the ½ in KE = ½mv²"
      })
      errors.push({
        value: correctAnswer / 2,
        misconception: "Applied ½ incorrectly"
      })
      errors.push({
        value: correctAnswer / extractVelocity(questionText),
        misconception: "Used mv instead of ½mv² formula"
      })
    }
    
    if (questionText.includes('potential')) {
      errors.push({
        value: correctAnswer * Math.sqrt(2),
        misconception: "Confused height with distance traveled"
      })
      errors.push({
        value: correctAnswer / GRAVITY,
        misconception: "Forgot to multiply by g in PE = mgh"
      })
    }
    
    if (questionText.includes('conserv')) {
      errors.push({
        value: correctAnswer * 0.75,
        misconception: "Assumed 25% energy loss to friction"
      })
      errors.push({
        value: correctAnswer * 1.25,
        misconception: "Incorrectly added energy to system"
      })
    }
  }
  
  // Momentum misconceptions
  if (questionText.includes('momentum')) {
    errors.push({
      value: correctAnswer * 0.5,
      misconception: "Confused momentum (p=mv) with kinetic energy"
    })
    errors.push({
      value: correctAnswer ** 2,
      misconception: "Squared velocity in momentum calculation"
    })
    errors.push({
      value: correctAnswer * 0.5,
      misconception: "Assumed perfectly inelastic collision"
    })
    errors.push({
      value: correctAnswer * 2,
      misconception: "Doubled momentum incorrectly"
    })
  }
  
  // Circular motion misconceptions
  if (questionText.includes('circular') || questionText.includes('orbit')) {
    errors.push({
      value: correctAnswer * 2 * Math.PI,
      misconception: "Confused angular with linear velocity (v = ωr)"
    })
    errors.push({
      value: correctAnswer / (2 * Math.PI),
      misconception: "Incorrect conversion between angular and linear"
    })
    errors.push({
      value: -correctAnswer,
      misconception: "Confused centripetal with centrifugal force"
    })
  }
  
  // Wave misconceptions
  if (questionText.includes('wave') || questionText.includes('frequency')) {
    errors.push({
      value: 1 / correctAnswer,
      misconception: "Inverted frequency-period relationship"
    })
    errors.push({
      value: correctAnswer * 2 * Math.PI,
      misconception: "Confused frequency with angular frequency"
    })
    errors.push({
      value: correctAnswer ** 2,
      misconception: "Squared value in wave equation"
    })
  }
  
  // Electricity misconceptions
  if (questionText.includes('current') || questionText.includes('voltage')) {
    errors.push({
      value: correctAnswer ** 2,
      misconception: "Used P=I²R instead of V=IR"
    })
    errors.push({
      value: Math.sqrt(correctAnswer),
      misconception: "Applied square root incorrectly"
    })
    errors.push({
      value: correctAnswer / 2,
      misconception: "Series circuit - incorrectly halved value"
    })
    errors.push({
      value: correctAnswer * 2,
      misconception: "Parallel circuit - incorrectly doubled value"
    })
  }
  
  // Projectile motion misconceptions
  if (questionText.includes('projectile') || questionText.includes('thrown')) {
    errors.push({
      value: correctAnswer * Math.cos(45 * Math.PI / 180),
      misconception: "Used only horizontal component"
    })
    errors.push({
      value: correctAnswer * Math.sin(45 * Math.PI / 180),
      misconception: "Used only vertical component"
    })
    errors.push({
      value: correctAnswer / 4,
      misconception: "Confused maximum height with range"
    })
    errors.push({
      value: correctAnswer * 4,
      misconception: "Confused range with maximum height"
    })
  }
  
  // Friction misconceptions
  if (questionText.includes('friction')) {
    errors.push({
      value: correctAnswer * 0.8,
      misconception: "Used kinetic instead of static friction coefficient"
    })
    errors.push({
      value: correctAnswer * 1.2,
      misconception: "Used static instead of kinetic friction coefficient"
    })
    errors.push({
      value: -correctAnswer,
      misconception: "Wrong direction - friction opposes motion"
    })
  }
  
  // Pressure misconceptions
  if (questionText.includes('pressure')) {
    errors.push({
      value: correctAnswer * 10,
      misconception: "Confused pressure with force (P = F/A)"
    })
    errors.push({
      value: correctAnswer / 10,
      misconception: "Incorrect area calculation"
    })
    errors.push({
      value: correctAnswer ** 2,
      misconception: "Used quadratic instead of linear depth relationship"
    })
  }
  
  // Temperature and heat misconceptions
  if (questionText.includes('temperature') || questionText.includes('heat')) {
    errors.push({
      value: correctAnswer + 273.15,
      misconception: "Added 273 when already in Kelvin"
    })
    errors.push({
      value: correctAnswer - 273.15,
      misconception: "Subtracted 273 when already in Celsius"
    })
    errors.push({
      value: correctAnswer * 4.18,
      misconception: "Confused heat capacity with temperature change"
    })
  }
  
  return errors.filter(e => isFinite(e.value) && e.value > 0)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateIncorrectUnits(correctUnit: string): string[] {
  // Common unit confusion patterns for high school physics
  const unitConfusions: Record<string, string[]> = {
    'm/s': ['m/s²', 'km/h', 'm', 's', 'km/s'],
    'm/s²': ['m/s', 'm', 's²', 'N/kg', 'km/s²'],
    'N': ['kg', 'N/m', 'J', 'kg·m/s', 'Pa'],
    'J': ['N', 'W', 'N·m/s', 'kg', 'J/s'],
    'W': ['J', 'J/s²', 'N·m', 'W/s', 'kW'],
    'kg': ['N', 'g', 'kg/m³', 'lb', 'kg·m'],
    'm': ['m²', 'cm', 'km', 'm/s', 'ft'],
    's': ['ms', 'min', 'h', 's²', 'Hz'],
    'Hz': ['s', '1/s²', 'rad/s', 'rpm', 'kHz'],
    'Pa': ['N', 'N/m', 'J/m³', 'atm', 'psi'],
    'V': ['J', 'W', 'A', 'Ω', 'J/C'],
    'A': ['V', 'C', 'W', 'Ω', 'C/s'],
    'Ω': ['V', 'A', 'W', 'S', 'V/A²'],
    'C': ['A', 'V', 'J', 'e', 'A·s'],
    'kg·m/s': ['N·s', 'J', 'kg·m/s²', 'N', 'kg·m'],
    'm/s³': ['m/s²', 'm/s', 'N/kg·s', 'W/kg', 'Hz/s'],
    'rad': ['°', 'rad/s', 'm', 'dimensionless', 'rev'],
    'rad/s': ['Hz', 'rpm', '°/s', 'rad', 'm/s'],
    'N·m': ['J', 'W', 'N/m', 'kg·m²/s²', 'Pa·m³'],
    'kg/m³': ['g/cm³', 'kg/L', 'N/m³', 'Pa/m', 'kg'],
    'm³': ['L', 'cm³', 'm²', 'gal', 'mL'],
    'K': ['°C', '°F', 'J', 'cal', 'eV'],
    '°C': ['K', '°F', 'J/kg', 'cal', '°'],
  }
  
  // Get potential incorrect units
  let incorrectUnits = unitConfusions[correctUnit] || []
  
  // If no specific confusions, generate generic ones
  if (incorrectUnits.length === 0) {
    const baseUnits = ['m', 's', 'kg', 'N', 'J', 'W', 'A', 'V', 'Ω', 'Hz', 'Pa', 'C']
    incorrectUnits = baseUnits
      .filter(u => u !== correctUnit)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
  }
  
  // Ensure we have enough options
  while (incorrectUnits.length < 4) {
    const genericUnits = ['units', 'dimensionless', 'N/A', 'unknown']
    incorrectUnits.push(genericUnits[incorrectUnits.length % genericUnits.length])
  }
  
  return incorrectUnits.filter(u => u !== correctUnit)
}
