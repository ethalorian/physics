#!/usr/bin/env node
/**
 * Script to add QuickAssignButton to all simulation pages
 * Run with: npx ts-node scripts/add-quick-assign-to-simulations.ts
 */

import fs from 'fs'
import path from 'path'

const simulations = [
  { slug: 'atwood-machine', title: 'Atwood Machine' },
  { slug: 'riverboat-crossing', title: 'Riverboat Crossing' },
  { slug: 'monkey-hunter', title: 'Monkey Hunter' },
  { slug: 'car-race', title: 'Car Race' },
  { slug: 'vacuum-chamber', title: 'Vacuum Chamber' },
  { slug: 'carts-third-law', title: "Newton's Third Law Carts" },
  { slug: 'astronaut-thrust', title: 'Astronaut Thrust' },
  { slug: 'maze-vectors', title: 'Vector Maze' },
  { slug: 'race-track', title: 'Race Track' },
  { slug: 'measurement-precision', title: 'Measurement & Precision' },
  { slug: 'area-under-curve', title: 'Area Under the Curve' },
  { slug: 'slope-calculator', title: 'Slope Calculator' },
  { slug: 'uniformly-accelerated-motion', title: 'Uniformly Accelerated Motion' },
  { slug: 'distance-displacement', title: 'Distance vs Displacement' },
  { slug: 'freefall-cliff', title: 'Freefall Cliff Lab' },
  { slug: 'sumo-forces', title: 'Sumo Forces' },
  { slug: 'constant-velocity', title: 'Constant Velocity Motion' }
]

function updateSimulationFile(slug: string, title: string) {
  const filePath = path.join(
    __dirname,
    '..',
    'src',
    'app',
    'simulations',
    slug,
    'page.tsx'
  )

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`)
    return false
  }

  let content = fs.readFileSync(filePath, 'utf8')

  // Skip if already has QuickAssignButton
  if (content.includes('QuickAssignButton')) {
    console.log(`✓ Already has QuickAssignButton: ${slug}`)
    return true
  }

  // Add import if not present
  const importPattern = /import SimulationAssignmentEditor from '@\/components\/simulations\/SimulationAssignmentEditor'/
  if (importPattern.test(content) && !content.includes("import { QuickAssignButton }")) {
    content = content.replace(
      importPattern,
      `import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'\nimport { QuickAssignButton } from '@/components/simulations/QuickAssignButton'`
    )
  }

  // Find and update the admin section with Add Assignment button
  const addAssignmentPattern = /{isAdmin && \(\s*<>\s*<Button[\s\S]*?Add Assignment[\s\S]*?<\/>\s*\)}/
  const match = content.match(addAssignmentPattern)

  if (match) {
    // Insert QuickAssignButton right after {isAdmin && ( <>
    const replacement = match[0].replace(
      /{isAdmin && \(\s*<>/,
      `{isAdmin && (
              <>
                <QuickAssignButton
                  simulationTitle="${title}"
                  simulationSlug="${slug}"
                />`
    )
    content = content.replace(match[0], replacement)
    
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Updated: ${slug}`)
    return true
  } else {
    console.log(`⚠️  Could not find admin section in: ${slug}`)
    return false
  }
}

// Process all simulations
console.log('Adding QuickAssignButton to all simulations...\n')
let successCount = 0
const skipCount = 0
let failCount = 0

for (const sim of simulations) {
  const result = updateSimulationFile(sim.slug, sim.title)
  if (result === true) successCount++
  else if (result === false) failCount++
}

console.log(`
Summary:
✅ Updated: ${successCount}
✓ Already had button: ${skipCount}
❌ Failed: ${failCount}
`)
