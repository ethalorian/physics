/**
 * Vertex AI Configuration and Utilities
 * 
 * Provides integration with Google's Vertex AI for:
 * - Imagen: Image generation from text prompts
 * - Veo: Video generation from text prompts
 */

// Types for Vertex AI responses
export interface ImageGenerationResponse {
  predictions: {
    bytesBase64Encoded: string
    mimeType: string
  }[]
}

export interface VideoGenerationResponse {
  name: string  // Operation ID for polling
}

export interface VideoOperationStatus {
  done: boolean
  response?: {
    generatedSamples: {
      video: {
        uri: string
      }
    }[]
  }
  error?: {
    message: string
    code: number
  }
}

export interface GenerateImageOptions {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  sampleCount?: number
  negativePrompt?: string
  style?: 'photorealistic' | 'digital-art' | 'sketch' | 'anime'
  safetyFilterLevel?: 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high'
}

export interface GenerateVideoOptions {
  prompt: string
  duration?: 4 | 5 | 6 | 7 | 8
  aspectRatio?: '16:9' | '9:16'
  sampleCount?: number
  negativePrompt?: string
}

// Physics-specific prompt enhancers
export const physicsImagePromptEnhancers = {
  diagram: 'educational physics diagram, clean lines, labeled components, scientific accuracy, clear visualization',
  scenario: 'realistic physics scenario, dynamic action, clear demonstration of forces and motion',
  concept: 'conceptual physics illustration, abstract representation, educational clarity',
  realWorld: 'real-world physics application, everyday situation, relatable context',
  experiment: 'physics experiment setup, laboratory equipment, scientific demonstration',
  animation: 'physics animation frame, motion blur, trajectory visualization',
}

export const physicsVideoPromptEnhancers = {
  motion: 'smooth physics demonstration, clear motion paths, slow motion for clarity',
  experiment: 'physics experiment in action, controlled environment, visible results',
  realWorld: 'real-world physics in action, everyday scenario, natural motion',
  simulation: 'physics simulation, clear visualization of forces and energy',
}

// Helper to build physics-focused image prompts
export function buildPhysicsImagePrompt(
  basePrompt: string,
  type: keyof typeof physicsImagePromptEnhancers = 'scenario',
  additionalContext?: string
): string {
  let prompt = `${basePrompt}. ${physicsImagePromptEnhancers[type]}`
  
  if (additionalContext) {
    prompt += `. Context: ${additionalContext}`
  }
  
  // Add quality enhancers
  prompt += ', high quality, educational content, clear and informative'
  
  return prompt
}

// Helper to build physics-focused video prompts  
export function buildPhysicsVideoPrompt(
  basePrompt: string,
  type: keyof typeof physicsVideoPromptEnhancers = 'motion',
  additionalContext?: string
): string {
  let prompt = `${basePrompt}. ${physicsVideoPromptEnhancers[type]}`
  
  if (additionalContext) {
    prompt += `. Context: ${additionalContext}`
  }
  
  prompt += ', educational video, clear demonstration'
  
  return prompt
}

// Vertex AI configuration
export const vertexAIConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  
  // Model versions - Updated to latest as of 2025
  models: {
    // Imagen 4 - Latest image generation model
    imagen: 'imagen-4.0-generate-001',
    // Imagen 3 - Fallback option
    imagen3: 'imagen-3.0-generate-002',
    // Veo 3.1 - Latest video generation model
    veo: 'veo-3.1-generate-preview',
    // Veo 3 Fast - For quicker generation
    veoFast: 'veo-3.1-fast-generate-preview',
    // Veo 3 Stable - Production ready
    veoStable: 'veo-3.0-generate-001',
    // Gemini models for text generation
    gemini: 'gemini-2.0-flash-001',
    geminiPro: 'gemini-1.5-pro-002',
    geminiFlash: 'gemini-1.5-flash-002',
  },
  
  // Endpoints
  getImagenEndpoint(useFallback = false) {
    const model = useFallback ? this.models.imagen3 : this.models.imagen
    return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`
  },
  
  getVeoEndpoint(variant: 'latest' | 'fast' | 'stable' = 'latest') {
    const model = variant === 'fast' ? this.models.veoFast : 
                  variant === 'stable' ? this.models.veoStable : 
                  this.models.veo
    return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predictLongRunning`
  },
  
  getGeminiEndpoint(variant: 'default' | 'pro' | 'flash' = 'default') {
    const model = variant === 'pro' ? this.models.geminiPro : 
                  variant === 'flash' ? this.models.geminiFlash : 
                  this.models.gemini
    return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:generateContent`
  },
  
  getOperationEndpoint(operationName: string) {
    return `https://${this.location}-aiplatform.googleapis.com/v1/${operationName}`
  }
}

// Gemini text generation types
export interface GeminiGenerateRequest {
  contents: {
    role: 'user' | 'model'
    parts: { text: string }[]
  }[]
  generationConfig?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
    responseMimeType?: string
  }
  systemInstruction?: {
    parts: { text: string }[]
  }
}

export interface GeminiGenerateResponse {
  candidates: {
    content: {
      parts: { text: string }[]
      role: string
    }
    finishReason: string
    safetyRatings: {
      category: string
      probability: string
    }[]
  }[]
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// Physics topic to visual style mapping
export const physicsTopicStyles: Record<string, {
  imageType: keyof typeof physicsImagePromptEnhancers
  videoType: keyof typeof physicsVideoPromptEnhancers
  colorScheme: string
}> = {
  kinematics: {
    imageType: 'scenario',
    videoType: 'motion',
    colorScheme: 'blue and white with motion trails'
  },
  forces: {
    imageType: 'diagram',
    videoType: 'simulation',
    colorScheme: 'red and blue force arrows'
  },
  energy: {
    imageType: 'concept',
    videoType: 'simulation',
    colorScheme: 'yellow and orange energy visualization'
  },
  waves: {
    imageType: 'animation',
    videoType: 'motion',
    colorScheme: 'blue wave patterns with interference'
  },
  electricity: {
    imageType: 'diagram',
    videoType: 'experiment',
    colorScheme: 'yellow lightning and blue circuits'
  },
  optics: {
    imageType: 'diagram',
    videoType: 'experiment',
    colorScheme: 'rainbow light rays and prisms'
  },
  thermodynamics: {
    imageType: 'concept',
    videoType: 'simulation',
    colorScheme: 'red hot to blue cold gradient'
  },
  magnetism: {
    imageType: 'diagram',
    videoType: 'experiment',
    colorScheme: 'red north pole, blue south pole field lines'
  },
  rotational: {
    imageType: 'animation',
    videoType: 'motion',
    colorScheme: 'circular motion paths with angular markers'
  },
  fluids: {
    imageType: 'scenario',
    videoType: 'simulation',
    colorScheme: 'blue water, transparent flow visualization'
  },
  momentum: {
    imageType: 'scenario',
    videoType: 'motion',
    colorScheme: 'collision visualization with momentum arrows'
  },
  'modern-physics': {
    imageType: 'concept',
    videoType: 'simulation',
    colorScheme: 'quantum visualization, particle effects'
  }
}

