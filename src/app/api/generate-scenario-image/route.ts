import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { questionText, questionType } = body

    // Validate input
    if (!questionText) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      )
    }

    // Create an educational prompt for DALL-E
    const imagePrompt = generateImagePrompt(questionText, questionType)

    try {
      // Generate image using DALL-E 3
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",  // Higher quality for photorealistic images
        style: "vivid",  // Better for cinematic, photorealistic style
      })

      const imageUrl = response.data?.[0]?.url

      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI')
      }

      // Fetch the image and convert to base64 to avoid CSP issues
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch generated image')
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      const mimeType = imageResponse.headers.get('content-type') || 'image/png'
      const dataUrl = `data:${mimeType};base64,${base64Image}`

      return NextResponse.json({
        imageUrl: dataUrl, // Return base64 data URL instead of external URL
        prompt: imagePrompt, // Return the prompt for debugging/reference
      })

    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError)
      
      // Handle specific OpenAI errors
      if (openAIError?.error?.code === 'content_policy_violation') {
        return NextResponse.json(
          { error: 'The content could not be generated due to policy restrictions. Please modify the question text.' },
          { status: 400 }
        )
      }

      throw openAIError
    }

  } catch (error) {
    console.error('Error generating scenario image:', error)
    return NextResponse.json(
      { error: 'Failed to generate scenario image' },
      { status: 500 }
    )
  }
}

/**
 * Generate a DALL-E prompt for a physics scenario
 */
function generateImagePrompt(questionText: string, questionType?: string): string {
  // Extract the specific scenario details from the question
  const scenarioDetails = extractScenarioDetails(questionText)
  
  // Build a prompt that accurately reflects the described scenario
  let prompt = "Create a Netflix-style cinematic scene, dark and moody like a Netflix original series, showing exactly this scene: "
  
  // Add the specific scenario description
  if (scenarioDetails.fullScenario) {
    prompt += scenarioDetails.fullScenario + " "
  } else {
    // Fallback to building from components if full scenario extraction fails
    if (scenarioDetails.protagonist) {
      prompt += `${scenarioDetails.protagonist} `
    }
    if (scenarioDetails.action) {
      prompt += `${scenarioDetails.action} `
    }
    if (scenarioDetails.object) {
      prompt += `with ${scenarioDetails.object} `
    }
    if (scenarioDetails.location) {
      prompt += `${scenarioDetails.location} `
    }
  }
  
  // Add specific physics visualization based on the concept
  if (scenarioDetails.physicsVisualization) {
    prompt += scenarioDetails.physicsVisualization + " "
  }
  
  // Add Netflix-style cinematic guidelines
  prompt += "Style: Netflix original series cinematography, dark and atmospheric like Stranger Things or Dark. "
  prompt += "Moody lighting with deep shadows and selective highlights, high contrast ratio. "
  prompt += "Color grading: Teal and orange color scheme, desaturated palette with rich blacks. "
  prompt += "Shot with Arri Alexa or RED camera, cinematic depth of field, film grain texture. "
  prompt += "Composition: Netflix aspect ratio (2:1), dramatic framing, negative space for tension. "
  prompt += "Production value: Premium streaming series quality, prestige television aesthetics. "
  
  // Add environmental context if specified
  if (scenarioDetails.environment) {
    prompt += `Environment: ${scenarioDetails.environment}. `
  }
  
  // Add Netflix-style dramatic lighting
  const netflixLighting = [
    'nighttime with practical lights and deep shadows like Stranger Things',
    'moody blue hour with minimal ambient light and strong key lighting',
    'dark interior with window light creating dramatic silhouettes',
    'neon-lit night scene with vibrant color accents in darkness',
    'foggy atmosphere with backlit subjects and volumetric lighting',
    'harsh single-source lighting creating dramatic shadows like a thriller'
  ]
  const selectedLighting = scenarioDetails.timeOfDay || 
    netflixLighting[Math.floor(Math.random() * netflixLighting.length)]
  prompt += `Lighting: ${selectedLighting}, Netflix series cinematography standards. `
  
  prompt += "Camera work: Handheld or stabilized movement for documentary feel, selective focus. "
  prompt += "Post-processing: Netflix color grade with lifted blacks, teal shadows, warm highlights. "
  prompt += "Atmosphere: Moody and dramatic with visible atmosphere (fog, mist, particles in light). "
  prompt += "Visual style: Dark overall tone with 70% of frame in shadow, key elements dramatically lit. "
  prompt += "Production: Premium streaming series quality, prestige television look. "
  prompt += "No text, labels, or graphics - pure cinematic storytelling."
  
  return prompt
}

/**
 * Extract detailed scenario information from question text
 */
interface ScenarioDetails {
  fullScenario?: string
  protagonist?: string
  action?: string
  object?: string
  location?: string
  environment?: string
  timeOfDay?: string
  physicsVisualization?: string
}

function extractScenarioDetails(text: string): ScenarioDetails {
  const details: ScenarioDetails = {}
  
  // Try to extract the main scenario description (could be multiple sentences)
  // Look for the setup before questions like "What is", "Calculate", "Find", "How"
  let scenarioText = text;
  const questionStartMatch = text.match(/\b(What|Calculate|Find|Determine|How|If|When|Which|Solve)\b/i);
  if (questionStartMatch) {
    scenarioText = text.substring(0, questionStartMatch.index).trim();
  }
  
  // If we have a scenario text, use it
  if (scenarioText.length > 10) {
    // Clean up the scenario description for the prompt
    let cleanScenario = scenarioText
      .replace(/\d+\.?\d*\s*(m\/s²?|km\/h|mph|N|kg|m|s|°|degrees|meters?|kilometers?|seconds?|minutes?|hours?)/gi, '') // Remove specific values but keep the context
      .replace(/\s+/g, ' ')
      .replace(/[,]\s*$/, '') // Remove trailing comma
      .trim();
    
    // Enhance the scenario description with visual details based on physics concepts
    const lowerScenario = cleanScenario.toLowerCase();
    
    // Motion-related visualizations for Netflix-style dark cinematography
    if (lowerScenario.includes('thrown') || lowerScenario.includes('throw') || lowerScenario.includes('toss')) {
      cleanScenario = cleanScenario.replace(/(thrown?|throws?|toss(?:ed|es)?)/gi, match => `${match} captured in dramatic lighting`);
      details.physicsVisualization = "Silhouetted figure against moody backdrop, object caught mid-flight with rim lighting highlighting its trajectory. ";
    }
    else if (lowerScenario.includes('dropped') || lowerScenario.includes('falls') || lowerScenario.includes('falling')) {
      details.physicsVisualization = "Dark scene with object falling through shaft of light, particles and dust illuminated in the beam. ";
    }
    else if (lowerScenario.includes('slides') || lowerScenario.includes('sliding')) {
      details.physicsVisualization = "Sparks in darkness from friction, dramatic side lighting showing texture and resistance. ";
    }
    else if (lowerScenario.includes('rolls') || lowerScenario.includes('rolling')) {
      details.physicsVisualization = "Object rolling through pools of light and shadow, creating rhythm and tension in the frame. ";
    }
    else if (lowerScenario.includes('swings') || lowerScenario.includes('pendulum')) {
      details.physicsVisualization = "Pendulum swinging through beam of light, creating dramatic shadows and silhouettes. ";
    }
    else if (lowerScenario.includes('collide') || lowerScenario.includes('collision') || lowerScenario.includes('crash')) {
      details.physicsVisualization = "Impact moment backlit with debris silhouetted, dramatic slow-motion effect in darkness. ";
    }
    else if (lowerScenario.includes('accelerat') || lowerScenario.includes('speed up')) {
      details.physicsVisualization = "Vehicle lights streaking through darkness, headlights cutting through fog or mist. ";
    }
    else if (lowerScenario.includes('orbit') || lowerScenario.includes('revolve') || lowerScenario.includes('circle')) {
      details.physicsVisualization = "Object traced by single light source in darkness, creating luminous orbital path. ";
    }
    else if (lowerScenario.includes('launch') || lowerScenario.includes('fire') || lowerScenario.includes('shoot')) {
      details.physicsVisualization = "Explosive launch illuminating dark surroundings, dramatic contrast between fire and shadows. ";
    }
    else if (lowerScenario.includes('bounce') || lowerScenario.includes('rebound')) {
      details.physicsVisualization = "Impact moment with dramatic lighting from below, shadows emphasizing deformation. ";
    }
    else if (lowerScenario.includes('float') || lowerScenario.includes('buoy')) {
      details.physicsVisualization = "Dark water with underwater lighting, object partially illuminated from below. ";
    }
    else if (lowerScenario.includes('spin') || lowerScenario.includes('rotate')) {
      details.physicsVisualization = "Spinning object with stroboscopic lighting effect, creating multiple exposure look. ";
    }
    
    // Make the scenario more cinematic and realistic
    cleanScenario = cleanScenario
      .replace(/\ba\s+ball\b/gi, 'a professional sports ball')
      .replace(/\ba\s+car\b/gi, 'a modern vehicle')
      .replace(/\ba\s+person\b/gi, 'an athlete')
      .replace(/\ba\s+student\b/gi, 'a young scientist');
    
    details.fullScenario = cleanScenario;
  }
  
  // Extract protagonist (person, student, child, etc.)
  const protagonistMatch = text.match(/\b(student|person|child|boy|girl|athlete|player|driver|pilot|scientist|observer|someone|alice|bob|sarah|john|mary)\b/i);
  if (protagonistMatch) {
    details.protagonist = `A ${protagonistMatch[1].toLowerCase()}`;
  }
  
  // Extract main object involved (expanded list)
  const objectMatch = text.match(/\b(ball|baseball|basketball|tennis ball|soccer ball|stone|rock|pebble|boulder|projectile|bullet|arrow|dart|car|vehicle|truck|bus|train|locomotive|airplane|plane|jet|helicopter|rocket|spacecraft|satellite|probe|block|cube|box|crate|container|mass|weight|object|particle|pendulum|bob|swing|spring|coil|rope|cable|wire|string|thread|circuit|resistor|capacitor|battery|bulb|magnet|compass|lens|prism|mirror|telescope|microscope|wave|photon|electron|proton|neutron|atom|molecule|ion|crystal|fluid|liquid|gas|beam|ray|disk|wheel|sphere|cylinder|rod|bar|lever|pulley|gear|piston|engine|turbine|generator|motor)\b/i);
  if (objectMatch) {
    details.object = objectMatch[1].toLowerCase();
  }
  
  // Extract location/setting (expanded list)
  const locationMatch = text.match(/\b(cliff|edge|precipice|mountain|peak|summit|hill|hillside|slope|ramp|incline|decline|plane|surface|ground|earth|floor|ceiling|wall|table|desk|bench|counter|platform|stage|roof|rooftop|building|skyscraper|tower|lighthouse|bridge|viaduct|tunnel|track|rail|road|street|highway|freeway|path|trail|runway|tarmac|hangar|laboratory|lab|workshop|garage|classroom|gymnasium|stadium|field|meadow|park|garden|forest|jungle|desert|tundra|arctic|beach|shore|coast|ocean|sea|lake|pond|river|stream|waterfall|dam|pool|space|void|vacuum|orbit|atmosphere|stratosphere|planet|moon|asteroid|star|galaxy)\b/i);
  if (locationMatch) {
    const location = locationMatch[1].toLowerCase();
    // Add appropriate preposition based on location type
    const onLocations = ['table', 'desk', 'floor', 'ground', 'roof', 'platform', 'surface', 'road', 'track', 'runway', 'beach', 'shore'];
    const inLocations = ['space', 'orbit', 'laboratory', 'classroom', 'forest', 'ocean', 'lake', 'river', 'tunnel', 'building'];
    const atLocations = ['cliff', 'edge', 'summit', 'bridge', 'waterfall', 'dam'];
    
    if (onLocations.includes(location)) {
      details.location = `on a ${location}`;
    } else if (inLocations.includes(location)) {
      details.location = `in a ${location}`;
    } else if (atLocations.includes(location)) {
      details.location = `at a ${location}`;
    } else {
      details.location = `near a ${location}`;
    }
  }
  
  // Extract environmental conditions
  if (text.toLowerCase().includes('friction')) {
    details.environment = "Surface texture clearly visible to show friction";
  }
  if (text.toLowerCase().includes('air resistance') || text.toLowerCase().includes('wind')) {
    details.environment = "Wind effects and air flow visible in the scene";
  }
  if (text.toLowerCase().includes('vacuum') || text.toLowerCase().includes('no air')) {
    details.environment = "Space or vacuum chamber setting";
  }
  if (text.toLowerCase().includes('water') || text.toLowerCase().includes('underwater')) {
    details.environment = "Underwater or aquatic environment";
  }
  
  // Extract time of day if mentioned
  const timeMatch = text.match(/\b(morning|noon|afternoon|evening|night|dawn|dusk|sunset|sunrise|day|daytime)\b/i);
  if (timeMatch) {
    details.timeOfDay = timeMatch[1].toLowerCase();
  }
  
  // Extract action verbs for better scene description
  const actionMatch = text.match(/\b(throws?|throwing|launches?|launching|drops?|dropping|releases?|releasing|pushes?|pushing|pulls?|pulling|kicks?|kicking|hits?|hitting|strikes?|striking|moves?|moving|travels?|traveling|accelerates?|accelerating|decelerates?|decelerating|stops?|stopping|starts?|starting|spins?|spinning|rotates?|rotating|oscillates?|oscillating|vibrates?|vibrating|flows?|flowing)\b/i);
  if (actionMatch) {
    details.action = actionMatch[0].toLowerCase();
  }
  
  return details;
}

/**
 * Extract physics-related keywords from question text
 */
function extractPhysicsKeywords(text: string): string[] {
  const keywords: string[] = []
  
  // Common physics terms to look for
  const physicsTerms = [
    'velocity', 'acceleration', 'force', 'mass', 'energy', 'momentum',
    'friction', 'gravity', 'tension', 'normal force', 'weight',
    'displacement', 'distance', 'speed', 'time', 'angle',
    'kinetic', 'potential', 'work', 'power', 'impulse',
    'electric', 'magnetic', 'charge', 'current', 'voltage', 'resistance',
    'wave', 'frequency', 'wavelength', 'amplitude', 'period',
    'pressure', 'temperature', 'volume', 'density', 'buoyancy'
  ]
  
  const lowerText = text.toLowerCase()
  physicsTerms.forEach(term => {
    if (lowerText.includes(term)) {
      keywords.push(term)
    }
  })
  
  // Also extract object names (car, ball, block, etc.)
  const objectMatches = text.match(/\b(car|ball|block|box|particle|object|train|plane|projectile|rocket|satellite|planet|electron|proton)\b/gi)
  if (objectMatches) {
    keywords.push(...objectMatches.map(m => m.toLowerCase()))
  }
  
  return [...new Set(keywords)] // Remove duplicates
}

/**
 * Extract numerical values with units from question text
 */
function extractNumbers(text: string): string[] {
  const numbers: string[] = []
  
  // Match numbers with units (e.g., "10 m/s", "5.5 kg", "30°")
  const matches = text.match(/\d+\.?\d*\s*[a-zA-Z°/²³]+/g)
  if (matches) {
    numbers.push(...matches)
  }
  
  return numbers
}
