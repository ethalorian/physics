"use client"
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MathMarkdown from '@/components/MathMarkdown'
import { RotateCcw, Info, Eye, Calculator } from 'lucide-react'
import { PHYSICS_LEVEL } from '@/config/physics-level'

// Physics equations with term mappings to vocabulary
interface EquationTerm {
  id: string
  vocabulary: string
  variable: string
  unit: string
  dimension: string
  defaultValue: number
  minValue: number
  maxValue: number
  step: number
  description: string
}

interface PhysicsEquation {
  id: string
  name: string
  category: string
  formula: string
  description: string
  terms: EquationTerm[]
  resultTerm: EquationTerm
  calculate: (values: Record<string, number>) => number
  // Add solve-for functionality
  solveFor: {
    [termId: string]: {
      calculate: (values: Record<string, number>) => number
      description: string
    }
  }
}

const physicsEquations: PhysicsEquation[] = [
  {
    id: 'force-equation',
    name: 'Newton\'s Second Law',
    category: 'Forces',
    formula: 'Force = Mass × Acceleration',
    description: 'The relationship between force, mass, and acceleration',
    terms: [
      {
        id: 'mass',
        vocabulary: 'Mass',
        variable: 'm',
        unit: 'kg',
        dimension: 'M',
        defaultValue: 10,
        minValue: 1,
        maxValue: 100,
        step: 1,
        description: 'The amount of matter in an object'
      },
      {
        id: 'acceleration',
        vocabulary: 'Acceleration',
        variable: 'a',
        unit: 'm/s²',
        dimension: 'L T⁻²',
        defaultValue: 5,
        minValue: 1,
        maxValue: 20,
        step: 0.5,
        description: 'The rate of change of velocity'
      }
    ],
    resultTerm: {
      id: 'force',
      vocabulary: 'Force',
      variable: 'F',
      unit: 'N',
      dimension: 'M L T⁻²',
      defaultValue: 50,
      minValue: 0,
      maxValue: 2000,
      step: 1,
      description: 'A push or pull that can cause acceleration'
    },
    calculate: (values) => values.mass * values.acceleration,
    solveFor: {
      force: {
        calculate: (values) => values.mass * values.acceleration,
        description: 'Force = Mass × Acceleration'
      },
      mass: {
        calculate: (values) => values.force / values.acceleration,
        description: 'Mass = Force ÷ Acceleration'
      },
      acceleration: {
        calculate: (values) => values.force / values.mass,
        description: 'Acceleration = Force ÷ Mass'
      }
    }
  },
  {
    id: 'velocity-equation',
    name: 'Velocity Formula',
    category: 'Motion',
    formula: 'Velocity = Distance ÷ Time',
    description: 'The relationship between velocity, distance, and time',
    terms: [
      {
        id: 'distance',
        vocabulary: 'Distance',
        variable: 'd',
        unit: 'm',
        dimension: 'L',
        defaultValue: 100,
        minValue: 10,
        maxValue: 500,
        step: 10,
        description: 'The length of the path traveled'
      },
      {
        id: 'time',
        vocabulary: 'Time',
        variable: 't',
        unit: 's',
        dimension: 'T',
        defaultValue: 10,
        minValue: 1,
        maxValue: 60,
        step: 1,
        description: 'The duration of motion'
      }
    ],
    resultTerm: {
      id: 'velocity',
      vocabulary: 'Velocity',
      variable: 'v',
      unit: 'm/s',
      dimension: 'L T⁻¹',
      defaultValue: 10,
      minValue: 0,
      maxValue: 100,
      step: 0.1,
      description: 'The rate of change of displacement'
    },
    calculate: (values) => values.distance / values.time,
    solveFor: {
      velocity: {
        calculate: (values) => values.distance / values.time,
        description: 'Velocity = Distance ÷ Time'
      },
      distance: {
        calculate: (values) => values.velocity * values.time,
        description: 'Distance = Velocity × Time'
      },
      time: {
        calculate: (values) => values.distance / values.velocity,
        description: 'Time = Distance ÷ Velocity'
      }
    }
  },
  {
    id: 'kinetic-energy-equation',
    name: 'Kinetic Energy',
    category: 'Energy',
    formula: 'Kinetic Energy = ½ × Mass × Velocity²',
    description: 'The energy of motion',
    terms: [
      {
        id: 'mass',
        vocabulary: 'Mass',
        variable: 'm',
        unit: 'kg',
        dimension: 'M',
        defaultValue: 5,
        minValue: 1,
        maxValue: 50,
        step: 1,
        description: 'The amount of matter in an object'
      },
      {
        id: 'velocity',
        vocabulary: 'Velocity',
        variable: 'v',
        unit: 'm/s',
        dimension: 'L T⁻¹',
        defaultValue: 10,
        minValue: 1,
        maxValue: 30,
        step: 1,
        description: 'The rate of change of displacement'
      }
    ],
    resultTerm: {
      id: 'kineticEnergy',
      vocabulary: 'Kinetic Energy',
      variable: 'KE',
      unit: 'J',
      dimension: 'M L² T⁻²',
      defaultValue: 250,
      minValue: 0,
      maxValue: 22500,
      step: 1,
      description: 'Energy possessed by an object due to its motion'
    },
    calculate: (values) => 0.5 * values.mass * Math.pow(values.velocity, 2),
    solveFor: {
      kineticEnergy: {
        calculate: (values) => 0.5 * values.mass * Math.pow(values.velocity, 2),
        description: 'Kinetic Energy = ½ × Mass × Velocity²'
      },
      mass: {
        calculate: (values) => (2 * values.kineticEnergy) / Math.pow(values.velocity, 2),
        description: 'Mass = (2 × Kinetic Energy) ÷ Velocity²'
      },
      velocity: {
        calculate: (values) => Math.sqrt((2 * values.kineticEnergy) / values.mass),
        description: 'Velocity = √((2 × Kinetic Energy) ÷ Mass)'
      }
    }
  },
  {
    id: 'work-equation',
    name: 'Work Formula',
    category: 'Energy',
    formula: 'Work = Force × Distance',
    description: 'Energy transferred by applying force over distance',
    terms: [
      {
        id: 'force',
        vocabulary: 'Force',
        variable: 'F',
        unit: 'N',
        dimension: 'M L T⁻²',
        defaultValue: 20,
        minValue: 1,
        maxValue: 100,
        step: 1,
        description: 'A push or pull applied to an object'
      },
      {
        id: 'distance',
        vocabulary: 'Distance',
        variable: 'd',
        unit: 'm',
        dimension: 'L',
        defaultValue: 5,
        minValue: 1,
        maxValue: 50,
        step: 1,
        description: 'The length over which force is applied'
      }
    ],
    resultTerm: {
      id: 'work',
      vocabulary: 'Work',
      variable: 'W',
      unit: 'J',
      dimension: 'M L² T⁻²',
      defaultValue: 100,
      minValue: 0,
      maxValue: 5000,
      step: 1,
      description: 'Energy transferred to or from an object'
    },
    calculate: (values) => values.force * values.distance,
    solveFor: {
      work: {
        calculate: (values) => values.force * values.distance,
        description: 'Work = Force × Distance'
      },
      force: {
        calculate: (values) => values.work / values.distance,
        description: 'Force = Work ÷ Distance'
      },
      distance: {
        calculate: (values) => values.work / values.force,
        description: 'Distance = Work ÷ Force'
      }
    }
  },
  {
    id: 'power-equation',
    name: 'Power Formula',
    category: 'Energy',
    formula: 'Power = Work ÷ Time',
    description: 'The rate at which work is done',
    terms: [
      {
        id: 'work',
        vocabulary: 'Work',
        variable: 'W',
        unit: 'J',
        dimension: 'M L² T⁻²',
        defaultValue: 100,
        minValue: 10,
        maxValue: 1000,
        step: 10,
        description: 'Energy transferred to or from an object'
      },
      {
        id: 'time',
        vocabulary: 'Time',
        variable: 't',
        unit: 's',
        dimension: 'T',
        defaultValue: 10,
        minValue: 1,
        maxValue: 60,
        step: 1,
        description: 'The duration over which work is done'
      }
    ],
    resultTerm: {
      id: 'power',
      vocabulary: 'Power',
      variable: 'P',
      unit: 'W',
      dimension: 'M L² T⁻³',
      defaultValue: 10,
      minValue: 0,
      maxValue: 1000,
      step: 0.1,
      description: 'The rate at which work is done'
    },
    calculate: (values) => values.work / values.time,
    solveFor: {
      power: {
        calculate: (values) => values.work / values.time,
        description: 'Power = Work ÷ Time'
      },
      work: {
        calculate: (values) => values.power * values.time,
        description: 'Work = Power × Time'
      },
      time: {
        calculate: (values) => values.work / values.power,
        description: 'Time = Work ÷ Power'
      }
    }
  }
]

type DisplayMode = 'terms' | 'variables' | 'units'

interface EquationVisualizerProps {
  className?: string
}

export default function EquationVisualizer({ className }: EquationVisualizerProps) {
  const [selectedEquation, setSelectedEquation] = useState<string>(physicsEquations[0].id)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('terms')
  const [solveForVariable, setSolveForVariable] = useState<string>('')
  const [termValues, setTermValues] = useState<Record<string, Record<string, number>>>(() => {
    // Initialize default values for all equations
    const initialValues: Record<string, Record<string, number>> = {}
    physicsEquations.forEach(equation => {
      initialValues[equation.id] = {}
      equation.terms.forEach(term => {
        initialValues[equation.id][term.id] = term.defaultValue
      })
    })
    return initialValues
  })
  const [showInfo, setShowInfo] = useState(false)

  const currentEquation = useMemo(() => 
    physicsEquations.find(eq => eq.id === selectedEquation) || physicsEquations[0],
    [selectedEquation]
  )

  const currentValues = termValues[selectedEquation] || {}

  // Initialize solve-for variable when equation changes
  useEffect(() => {
    if (!solveForVariable || !currentEquation.solveFor[solveForVariable]) {
      setSolveForVariable(currentEquation.resultTerm.id)
    }
  }, [selectedEquation, currentEquation, solveForVariable])

  // Initialize values for all terms when solve-for variable changes
  useEffect(() => {
    if (solveForVariable) {
      const allTerms = [...currentEquation.terms, currentEquation.resultTerm]
      const currentEquationValues = currentValues

      // Check if we need to initialize any missing values
      const needsInitialization = allTerms.some(term => 
        currentEquationValues[term.id] === undefined
      )

      if (needsInitialization) {
        const newValues = { ...currentEquationValues }
        allTerms.forEach(term => {
          if (newValues[term.id] === undefined) {
            newValues[term.id] = term.defaultValue
          }
        })

        setTermValues(prev => ({
          ...prev,
          [selectedEquation]: newValues
        }))
      }
    }
  }, [solveForVariable, currentEquation, selectedEquation, currentValues])
  
  // Calculate result based on what we're solving for
  const solveForConfig = currentEquation.solveFor[solveForVariable] || currentEquation.solveFor[currentEquation.resultTerm.id]
  const resultValue = solveForConfig.calculate(currentValues)

  const handleTermChange = useCallback((termId: string, value: number[]) => {
    setTermValues(prev => ({
      ...prev,
      [selectedEquation]: {
        ...prev[selectedEquation],
        [termId]: value[0]
      }
    }))
  }, [selectedEquation])

  const resetValues = useCallback(() => {
    const defaultValues: Record<string, number> = {}
    currentEquation.terms.forEach(term => {
      defaultValues[term.id] = term.defaultValue
    })
    setTermValues(prev => ({
      ...prev,
      [selectedEquation]: defaultValues
    }))
  }, [currentEquation, selectedEquation])

  const getDisplayText = useCallback((term: EquationTerm) => {
    switch (displayMode) {
      case 'variables':
        return term.variable
      case 'units':
        return `${term.variable} (${term.unit})`
      case 'terms':
      default:
        return term.vocabulary
    }
  }, [displayMode])

  const getTermSize = useCallback((termId: string, value: number, term: EquationTerm) => {
    const baseSize = 1.5 // rem - base size
    const minSize = 0.8  // smaller minimum for more dramatic scaling
    const maxSize = 3.5  // larger maximum for more dramatic scaling
    
    // For the term we're solving for, scale based on the actual result value
    if (termId === solveForVariable) {
      const defaultResult = solveForConfig.calculate(
        Object.fromEntries([...currentEquation.terms, currentEquation.resultTerm].map(t => [t.id, t.defaultValue]))
      )
      const ratio = value / defaultResult
      
      // Use dramatic scaling for the result
      let scaledSize: number
      if (ratio <= 1) {
        scaledSize = baseSize * (0.3 + 0.7 * Math.sqrt(ratio))
      } else {
        scaledSize = baseSize * (1 + 0.5 * Math.log(ratio))
      }
      
      return Math.max(minSize, Math.min(maxSize, scaledSize))
    } else {
      // For input terms, scale based on their actual value (show magnitude of input)
      // But also consider their mathematical role in the equation
      const termRatio = value / term.defaultValue
      
      // Determine if this term is in denominator position for the current solve-for variable
      let isInDenominator = false
      
      // Analyze the mathematical relationship
      if (currentEquation.id === 'velocity-equation') {
        if (solveForVariable === 'velocity') {
          // v = d/t -> time is denominator
          isInDenominator = (termId === 'time')
        } else if (solveForVariable === 'time') {
          // t = d/v -> velocity is denominator
          isInDenominator = (termId === 'velocity')
        }
      } else if (currentEquation.id === 'force-equation') {
        if (solveForVariable === 'mass') {
          // m = F/a -> acceleration is denominator
          isInDenominator = (termId === 'acceleration')
        } else if (solveForVariable === 'acceleration') {
          // a = F/m -> mass is denominator
          isInDenominator = (termId === 'mass')
        }
      } else if (currentEquation.id === 'work-equation') {
        if (solveForVariable === 'force') {
          // F = W/d -> distance is denominator
          isInDenominator = (termId === 'distance')
        } else if (solveForVariable === 'distance') {
          // d = W/F -> force is denominator
          isInDenominator = (termId === 'force')
        }
      } else if (currentEquation.id === 'power-equation') {
        if (solveForVariable === 'power') {
          // P = W/t -> time is denominator
          isInDenominator = (termId === 'time')
        } else if (solveForVariable === 'time') {
          // t = W/P -> power is denominator
          isInDenominator = (termId === 'power')
        }
      } else if (currentEquation.id === 'kinetic-energy-equation') {
        if (solveForVariable === 'mass') {
          // m = 2*KE/v² -> velocity is denominator
          isInDenominator = (termId === 'velocity')
        } else if (solveForVariable === 'velocity') {
          // v = √(2*KE/m) -> mass is denominator
          isInDenominator = (termId === 'mass')
        }
      }
      
      // Scale the input term based on its magnitude AND its effect on the result
      let scaledSize: number
      
      // First, scale based on the term's own value (magnitude)
      const magnitudeScale = termRatio >= 1 
        ? 1 + 0.4 * Math.sqrt(termRatio - 1)
        : 0.6 + 0.4 * termRatio
      
      // Then adjust based on whether it makes the result bigger or smaller
      if (isInDenominator) {
        // Denominator terms: big values make result small, but we want to show the term is big
        // So we scale the term based on its magnitude, but we'll show result scaling separately
        scaledSize = baseSize * magnitudeScale
      } else {
        // Numerator terms: big values make result big, show direct relationship
        scaledSize = baseSize * magnitudeScale
      }
      
      return Math.max(minSize, Math.min(maxSize, scaledSize))
    }
  }, [solveForVariable, solveForConfig, currentEquation, currentValues, resultValue])

  const formatValue = useCallback((value: number, unit: string) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ${unit}`
    }
    return `${value.toFixed(1)} ${unit}`
  }, [])

  const renderTerm = useCallback((term: EquationTerm, isResult: boolean = false, actualValue?: number) => {
    // Use actualValue for result terms, otherwise use stored value
    const value = actualValue !== undefined ? actualValue : (currentValues[term.id] || term.defaultValue)
    const size = getTermSize(term.id, value, term)
    const displayText = getDisplayText(term)
    
    return (
      <span
        key={term.id}
        className={`inline-flex items-center justify-center font-bold transition-all duration-500 ease-out ${
          isResult ? 'text-green-600' : 'text-blue-600'
        }`}
        style={{ 
          fontSize: `${size}rem`,
          minWidth: `${size * 2}rem`,
          minHeight: `${size * 1.5}rem`,
          textShadow: size > 2 ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
          transformOrigin: 'center'
        }}
        title={`${term.vocabulary}: ${formatValue(value, term.unit)}`}
      >
        {displayText}
      </span>
    )
  }, [currentValues, getDisplayText, getTermSize, formatValue])

  const renderFraction = useCallback((numerator: JSX.Element, denominator: JSX.Element, key: string) => {
    return (
      <div key={key} className="inline-flex flex-col items-center mx-4">
        <div className="flex items-center justify-center pb-1">
          {numerator}
        </div>
        <div className="w-full h-0.5 bg-gray-600 my-1"></div>
        <div className="flex items-center justify-center pt-1">
          {denominator}
        </div>
      </div>
    )
  }, [])

  const renderDynamicEquation = useCallback(() => {
    // Get all terms including result term
    const allTerms = [...currentEquation.terms, currentEquation.resultTerm]
    const solveForTerm = allTerms.find(t => t.id === solveForVariable) || currentEquation.resultTerm
    
    // Render the term we're solving for (on left side)
    const resultElement = renderTerm(solveForTerm, true, resultValue)
    
    // Render other terms (on right side) - exclude the one we're solving for
    const otherTerms = allTerms.filter(t => t.id !== solveForVariable)
    const otherElements = otherTerms.map(term => {
      const value = currentValues[term.id] || term.defaultValue
      return renderTerm(term, false, value)
    })

    // Create equation based on what we're solving for and the original equation structure
    const equationElements: JSX.Element[] = [
      resultElement,
      <span key="equals" className="mx-4 text-3xl font-bold text-gray-600 flex items-center">=</span>
    ]

    // Add the rearranged formula based on solve-for selection
    if (currentEquation.id === 'force-equation') {
      if (solveForVariable === 'force') {
        equationElements.push(
          otherElements[0], // Mass
          <span key="times" className="mx-4 text-3xl font-bold text-gray-600 flex items-center">×</span>,
          otherElements[1]  // Acceleration
        )
      } else if (solveForVariable === 'mass') {
        equationElements.push(
          renderFraction(otherElements[0], otherElements[1], 'mass-fraction') // Force / Acceleration
        )
      } else if (solveForVariable === 'acceleration') {
        equationElements.push(
          renderFraction(otherElements[0], otherElements[1], 'acceleration-fraction') // Force / Mass
        )
      }
    } else if (currentEquation.id === 'velocity-equation') {
      if (solveForVariable === 'velocity') {
        equationElements.push(
          renderFraction(otherElements[0], otherElements[1], 'velocity-fraction') // Distance / Time
        )
      } else if (solveForVariable === 'distance') {
        equationElements.push(
          otherElements[0], // Velocity
          <span key="times" className="mx-4 text-3xl font-bold text-gray-600 flex items-center">×</span>,
          otherElements[1]  // Time
        )
      } else if (solveForVariable === 'time') {
        equationElements.push(
          renderFraction(otherElements[0], otherElements[1], 'time-fraction') // Distance / Velocity
        )
      }
    } else if (currentEquation.id === 'kinetic-energy-equation') {
      if (solveForVariable === 'kineticEnergy') {
        equationElements.push(
          <span key="half" className="mx-2 text-2xl font-bold text-gray-600 flex items-center">½</span>,
          <span key="times1" className="mx-2 text-3xl font-bold text-gray-600 flex items-center">×</span>,
          otherElements[0], // Mass
          <span key="times2" className="mx-2 text-3xl font-bold text-gray-600 flex items-center">×</span>,
          <div key="velocity-squared" className="inline-flex flex-col items-center">
            {otherElements[1]} {/* Velocity */}
            <span className="text-lg font-bold text-gray-600 -mt-2">²</span>
          </div>
        )
      } else if (solveForVariable === 'mass') {
        equationElements.push(
          renderFraction(
            <span key="2ke" className="flex items-center gap-2">
              <span className="text-xl">2</span>
              <span className="text-xl">×</span>
              {otherElements[0]} {/* KE */}
            </span>,
            <div key="v-squared" className="inline-flex flex-col items-center">
              {otherElements[1]} {/* Velocity */}
              <span className="text-lg font-bold text-gray-600 -mt-2">²</span>
            </div>,
            'mass-ke-fraction'
          )
        )
      } else if (solveForVariable === 'velocity') {
        equationElements.push(
          <span key="sqrt" className="mx-2 text-2xl font-bold text-gray-600 flex items-center">√</span>,
          <span key="open-paren" className="text-3xl font-bold text-gray-600">(</span>,
          renderFraction(
            <span key="2ke" className="flex items-center gap-2">
              <span className="text-xl">2</span>
              <span className="text-xl">×</span>
              {otherElements[0]} {/* KE */}
            </span>,
            otherElements[1], // Mass
            'velocity-ke-fraction'
          ),
          <span key="close-paren" className="text-3xl font-bold text-gray-600">)</span>
        )
      }
    } else if (currentEquation.id === 'work-equation') {
      if (solveForVariable === 'work') {
        equationElements.push(
          otherElements[0], // Force
          <span key="times" className="mx-4 text-3xl font-bold text-gray-600 flex items-center">×</span>,
          otherElements[1]  // Distance
        )
      } else {
        equationElements.push(
          renderFraction(otherElements[0], otherElements[1], `${solveForVariable}-work-fraction`)
        )
      }
    } else if (currentEquation.id === 'power-equation') {
      if (solveForVariable === 'power') {
        equationElements.push(
          renderFraction(otherElements[0], otherElements[1], 'power-fraction') // Work / Time
        )
      } else {
        equationElements.push(
          otherElements[0], // Power or Work
          <span key="times" className="mx-4 text-3xl font-bold text-gray-600 flex items-center">×</span>,
          otherElements[1]  // Time or remaining term
        )
      }
    }

    return equationElements
  }, [currentEquation, solveForVariable, renderTerm, renderFraction, resultValue, currentValues])

  const renderEquationDisplay = useCallback(() => {
    const equationElements = renderDynamicEquation()

    return (
      <div className="flex items-center justify-center min-h-[180px] bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8 border-2 border-dashed border-blue-200">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {equationElements}
        </div>
      </div>
    )
  }, [renderDynamicEquation])

  const renderDimensionalFraction = useCallback((numeratorDimension: string, denominatorDimension: string, key: string) => {
    return (
      <div key={key} className="inline-flex flex-col items-center mx-2">
        <div className="text-purple-600 font-mono text-sm pb-1">
          [{numeratorDimension}]
        </div>
        <div className="w-full h-px bg-purple-600 my-1"></div>
        <div className="text-purple-600 font-mono text-sm pt-1">
          [{denominatorDimension}]
        </div>
      </div>
    )
  }, [])

  const renderDimensionalAnalysis = useCallback(() => {
    if (displayMode !== 'units') return null

    const dimensionElements = currentEquation.terms.map(term => (
      <span key={term.id} className="mx-2 text-purple-600 font-mono text-sm">
        [{term.dimension}]
      </span>
    ))

    let analysisElements: JSX.Element[] = []
    
    if (currentEquation.id === 'force-equation') {
      analysisElements = [
        <span key="result" className="mx-2 text-purple-600 font-mono text-sm">[{currentEquation.resultTerm.dimension}]</span>,
        <span key="equals" className="mx-3 text-gray-600 text-sm">=</span>,
        dimensionElements[0], // Mass [M]
        <span key="times" className="mx-2 text-gray-600 text-sm">×</span>,
        dimensionElements[1]  // Acceleration [L T⁻²]
      ]
    } else if (currentEquation.id === 'velocity-equation') {
      analysisElements = [
        <span key="result" className="mx-2 text-purple-600 font-mono text-sm">[{currentEquation.resultTerm.dimension}]</span>,
        <span key="equals" className="mx-3 text-gray-600 text-sm">=</span>,
        renderDimensionalFraction(currentEquation.terms[0].dimension, currentEquation.terms[1].dimension, 'velocity-dim-fraction') // Distance / Time
      ]
    } else if (currentEquation.id === 'kinetic-energy-equation') {
      analysisElements = [
        <span key="result" className="mx-2 text-purple-600 font-mono text-sm">[{currentEquation.resultTerm.dimension}]</span>,
        <span key="equals" className="mx-3 text-gray-600 text-sm">=</span>,
        dimensionElements[0], // Mass [M]
        <span key="times1" className="mx-2 text-gray-600 text-sm">×</span>,
        <div key="velocity-squared" className="inline-flex flex-col items-center">
          {dimensionElements[1]} {/* Velocity [L T⁻¹] */}
          <span className="text-xs text-gray-600 -mt-1">²</span>
        </div>
      ]
    } else if (currentEquation.id === 'work-equation') {
      analysisElements = [
        <span key="result" className="mx-2 text-purple-600 font-mono text-sm">[{currentEquation.resultTerm.dimension}]</span>,
        <span key="equals" className="mx-3 text-gray-600 text-sm">=</span>,
        dimensionElements[0], // Force [M L T⁻²]
        <span key="times" className="mx-2 text-gray-600 text-sm">×</span>,
        dimensionElements[1]  // Distance [L]
      ]
    } else if (currentEquation.id === 'power-equation') {
      analysisElements = [
        <span key="result" className="mx-2 text-purple-600 font-mono text-sm">[{currentEquation.resultTerm.dimension}]</span>,
        <span key="equals" className="mx-3 text-gray-600 text-sm">=</span>,
        renderDimensionalFraction(currentEquation.terms[0].dimension, currentEquation.terms[1].dimension, 'power-dim-fraction') // Work / Time
      ]
    }

    return (
      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm font-medium text-purple-800 mb-3">Dimensional Analysis:</div>
        <div className="flex items-center justify-center flex-wrap gap-1">
          {analysisElements}
        </div>
      </div>
    )
  }, [currentEquation, displayMode, renderDimensionalFraction])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedEquation} onValueChange={setSelectedEquation}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select equation" />
            </SelectTrigger>
            <SelectContent>
              {physicsEquations.map(equation => (
                <SelectItem key={equation.id} value={equation.id}>
                  {equation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetValues}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-info"
              checked={showInfo}
              onCheckedChange={setShowInfo}
            />
            <Label htmlFor="show-info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Info
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="solve-for" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Solve For:
            </Label>
            <Select value={solveForVariable} onValueChange={setSolveForVariable}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currentEquation.solveFor).map(([termId, config]) => {
                  const term = [...currentEquation.terms, currentEquation.resultTerm].find(t => t.id === termId)
                  return (
                    <SelectItem key={termId} value={termId}>
                      {getDisplayText(term || currentEquation.resultTerm)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="display-mode" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Display:
            </Label>
            <Select value={displayMode} onValueChange={(value: DisplayMode) => setDisplayMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terms">Terms</SelectItem>
                <SelectItem value="variables">Variables</SelectItem>
                <SelectItem value="units">Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Equation Info */}
      {showInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calculator className="h-5 w-5" />
              {currentEquation.name}
            </CardTitle>
          </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-2">{currentEquation.description}</p>
          <p className="text-sm text-blue-600 mb-3 font-medium">
            Currently solving for: {solveForConfig.description}
          </p>
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            {currentEquation.category}
          </Badge>
        </CardContent>
        </Card>
      )}

      {/* Main Equation Display */}
      <Card className="border-2 border-blue-300">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-blue-800">
            Interactive Physics Equation
          </CardTitle>
          <p className="text-sm text-blue-600">
            Adjust the sliders below to see how changing one term affects the others
          </p>
        </CardHeader>
        <CardContent>
          {renderEquationDisplay()}
          {renderDimensionalAnalysis()}
        </CardContent>
      </Card>

      {/* Dynamic Term Controls - Show only input variables, not the one being solved for */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...currentEquation.terms, currentEquation.resultTerm]
          .filter(term => term.id !== solveForVariable) // Exclude the variable we're solving for
          .map(term => {
            const value = currentValues[term.id] || term.defaultValue
            const size = getTermSize(term.id, value, term)
            
            return (
              <Card key={term.id} className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span 
                      className="text-blue-600 transition-all duration-300"
                      style={{ fontSize: `${Math.min(size, 1.5)}rem` }}
                    >
                      {getDisplayText(term)}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {formatValue(value, term.unit)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Slider
                    value={[value]}
                    onValueChange={(newValue) => handleTermChange(term.id, newValue)}
                    min={term.minValue}
                    max={term.maxValue}
                    step={term.step}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatValue(term.minValue, term.unit)}</span>
                    <span>{formatValue(term.maxValue, term.unit)}</span>
                  </div>
                  {showInfo && (
                    <p className="text-sm text-gray-600 mt-2">
                      {term.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* Result Display */}
      <Card className="border-2 border-green-300 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-green-800">
            Calculated Result
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div 
            className="font-bold text-green-600 transition-all duration-500 ease-out flex items-center justify-center gap-4"
            style={{ 
              fontSize: `${Math.min(getTermSize(solveForVariable, resultValue, 
                [...currentEquation.terms, currentEquation.resultTerm].find(t => t.id === solveForVariable) || currentEquation.resultTerm
              ) * 1.2, 4)}rem` 
            }}
          >
            <span>{getDisplayText([...currentEquation.terms, currentEquation.resultTerm].find(t => t.id === solveForVariable) || currentEquation.resultTerm)}</span>
            <span className="text-gray-600">=</span>
            <span className="font-mono">{formatValue(resultValue, ([...currentEquation.terms, currentEquation.resultTerm].find(t => t.id === solveForVariable) || currentEquation.resultTerm).unit)}</span>
          </div>
          {showInfo && (
            <p className="text-green-700 mt-4 text-base">
              {([...currentEquation.terms, currentEquation.resultTerm].find(t => t.id === solveForVariable) || currentEquation.resultTerm).description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
