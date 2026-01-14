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
 * Endpoint: GET /svc/int/run/cubby/public-api/v1/responses/latest/spelling-bee-buddy/reader
 */
export interface CubbyResponse {
  response_id: string
  project_version: string // Puzzle ID as string (e.g., "20035")
  correct: null
  content: {
    words: string[] // Words the user has found
  }
}

/**
 * Response from NYT user stats API
 * Endpoint: GET /svc/games/state/spelling_bee/latests
 */
export interface UserStats {
  user_id: number
  player: {
    stats: {
      spelling_bee: {
        puzzles_started: number
        total_words: number
        total_pangrams: number
        longest_word: {
          word: string
          center_letter: string
          print_date: string
        }
        ranks: {
          "Queen Bee": number
          Genius: number
          Amazing: number
          Great: number
          Nice: number
          Solid: number
          Good: number
          "Moving Up": number
          "Getting Warm": number
          Beginner: number
        }
      }
    }
  }
}

/**
 * Cached hints stored in Cloudflare KV
 * Key format: hints:{printDate} (e.g., hints:2026-01-14)
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
 * User credentials stored in localStorage
 */
export interface UserCredentials {
  nytToken: string // NYT-S cookie value
  anthropicKey: string // Anthropic API key
}

/**
 * A single hint for a word
 */
export interface Hint {
  hint: string
  length: number
}

/**
 * Hints grouped by two-letter prefix
 */
export type HintsByPrefix = Record<string, Hint[]>

/**
 * Spelling Bee rank thresholds (percentage of max points)
 */
export type Rank =
  | "Beginner"
  | "Getting Warm"
  | "Moving Up"
  | "Good"
  | "Solid"
  | "Nice"
  | "Great"
  | "Amazing"
  | "Genius"
  | "Queen Bee"

/**
 * Word grid cell data (for letter × length grid)
 */
export interface WordGridCell {
  letter: string
  length: number
  total: number // Total words for this combination
  found: number // Words found by user
}

/**
 * Two-letter group data
 */
export interface TwoLetterGroup {
  prefix: string
  total: number
  found: number
}
