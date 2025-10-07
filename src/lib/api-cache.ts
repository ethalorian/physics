/**
 * API Response Cache
 * 
 * Simple in-memory cache for API responses to prevent redundant calls
 * Cache entries expire after a configurable TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  forceRefresh?: boolean // Bypass cache
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data or fetch from API
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, forceRefresh = false } = options

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(key)
      if (cached && Date.now() < cached.expiresAt) {
        console.log(`[API Cache] HIT: ${key}`)
        return cached.data
      }
    }

    // Cache miss or expired - fetch fresh data
    console.log(`[API Cache] MISS: ${key}`)
    const data = await fetcher()
    
    // Store in cache
    this.set(key, data, ttl)
    
    return data
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    console.log(`[API Cache] INVALIDATED: ${key}`)
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        console.log(`[API Cache] INVALIDATED: ${key}`)
      }
    })
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    console.log('[API Cache] CLEARED ALL')
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now()
    let count = 0
    
    this.cache.forEach((entry, key) => {
      if (now >= entry.expiresAt) {
        this.cache.delete(key)
        count++
      }
    })
    
    if (count > 0) {
      console.log(`[API Cache] CLEANED UP ${count} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const apiCache = new APICache()

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Cached fetch wrapper
 * 
 * Usage:
 * const data = await cachedFetch('/api/endpoint', { ttl: 10000 })
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & CacheOptions = {}
): Promise<T> {
  const { ttl, forceRefresh, ...fetchOptions } = options
  
  // Create cache key from URL and method
  const method = fetchOptions.method || 'GET'
  const cacheKey = `${method}:${url}`
  
  return apiCache.get<T>(
    cacheKey,
    async () => {
      const response = await fetch(url, fetchOptions)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }
      return response.json()
    },
    { ttl, forceRefresh }
  )
}

/**
 * Cache key generators for common endpoints
 */
export const CacheKeys = {
  // Assignments
  assignments: () => 'GET:/api/assignments',
  assignmentById: (id: string) => `GET:/api/assignments/${id}`,
  submissions: () => 'GET:/api/submissions',
  
  // Assignment System
  lessonAssignments: () => 'GET:/api/assignments/lessons',
  homeworkAssignments: () => 'GET:/api/assignments/homework',
  assignmentAnalytics: () => 'GET:/api/assignments/analytics',
  assignmentSubmissions: () => 'GET:/api/assignment-submissions',
  
  // Question Bank
  questionBank: (filters?: string) => 
    `GET:/api/question-bank${filters ? `?${filters}` : ''}`,
  questionBankUnits: () => 'GET:/api/question-bank/units',
  
  // Student Activity
  studentActivity: () => 'GET:/api/student-activity',
  studentActivitySummary: () => 'GET:/api/student-activity/summary',
  
  // Vocabulary
  vocabulary: () => 'GET:/api/vocabulary',
  
  // Roster
  rosterStudents: () => 'GET:/api/roster/students',
}

/**
 * Invalidate related caches after mutations
 */
export const invalidateCache = {
  // After assignment operations
  assignments: () => {
    apiCache.invalidatePattern('/api/assignments')
  },
  
  // After question bank operations
  questionBank: () => {
    apiCache.invalidatePattern('/api/question-bank')
  },
  
  // After student activity operations
  studentActivity: () => {
    apiCache.invalidatePattern('/api/student-activity')
    apiCache.invalidatePattern('/api/assignment-submissions')
  },
  
  // After vocabulary operations
  vocabulary: () => {
    apiCache.invalidatePattern('/api/vocabulary')
  },
}
