/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  HINTS_CACHE: KVNamespace
}

/**
 * Puzzle data embedded in the NYT Spelling Bee page (window.gameData)
 */
export interface GameData {
  today: {
    displayWeekday: string // "Wednesday"
    displayDate: string // "January 14, 2026"
    printDate: string // "2026-01-14"
    centerLetter: string // "o"
    outerLetters: string[] // ["a", "b", "c", "e", "l", "p"]
    validLetters: string[] // ["o", "a", "b", "c", "e", "l", "p"]
    pangrams: string[] // ["placebo"]
    answers: string[] // All valid words
    id: number // Puzzle ID (e.g., 20035)
  }
}

/**
 * Response from the NYT Cubby API for user's found words
 */
export interface CubbyResponse {
  response_id: string
  project_version: string // Puzzle ID as string
  correct: null
  content: {
    words: string[] // Words the user has found
  }
}

/**
 * Cached hints stored in Cloudflare KV
 */
export interface CachedHints {
  generatedAt: string // ISO timestamp
  hints: {
    [twoLetterPrefix: string]: Array<{
      hint: string
      length: number
    }>
  }
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
