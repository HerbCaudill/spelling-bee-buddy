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
 * @deprecated Use GameStateResponse instead
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
 * Response from the NYT games state API (/svc/games/state/spelling_bee/latest)
 */
export interface GameStateResponse {
  game_data: {
    answers: string[] // Words the user has found
    isPlayingArchive: boolean
    isRevealed: boolean
    rank: string // e.g., "Queen Bee", "Genius"
  }
  puzzle_id: string
  game: string // "spelling_bee"
  user_id: number
  version: string
  timestamp: number
  print_date: string // "2026-01-15"
  schema_version: string
}

/**
 * Cached hints stored in Cloudflare KV
 */
export interface CachedHints {
  generatedAt: string // ISO timestamp
  hints: {
    [twoLetterPrefix: string]: Array<{
      word: string
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

/**
 * A single puzzle from the active puzzles list
 */
export interface ActivePuzzle {
  id: number
  center_letter: string
  outer_letters: string // "giknoy" (concatenated)
  pangrams: string[]
  answers: string[]
  print_date: string // "2026-01-05"
  editor: string
}

/**
 * Response from /svc/spelling-bee/v1/active.json
 */
export interface ActivePuzzlesResponse {
  today: number // Index into puzzles array
  yesterday: number
  thisWeek: number[] // Indices
  lastWeek: number[]
  puzzles: ActivePuzzle[]
}

/**
 * Stats for a puzzle showing how many players found each word
 */
export interface PuzzleStats {
  id: number
  answers: Record<string, number> // word -> number of players who found it
  n: number // Sample size (typically 10000)
  numberOfUsers: number // Total players
}
