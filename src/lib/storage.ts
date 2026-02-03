import type { UserCredentials, Rank } from "@/types"

const STORAGE_KEY = "spelling-bee-buddy-credentials"
const PUZZLE_RANKS_KEY = "spelling-bee-buddy-puzzle-ranks"

/** Score status for a puzzle - simplified for the date picker */
export type PuzzleScoreStatus = "queen-bee" | "genius" | "started" | null

/**
 * Get credentials from environment variables (development only)
 */
function getEnvCredentials(): UserCredentials | null {
  const nytToken = import.meta.env.VITE_NYT_TOKEN
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_KEY

  if (nytToken && anthropicKey) {
    return { nytToken, anthropicKey }
  }
  return null
}

/**
 * Get user credentials from localStorage
 * In development, environment variables are used as fallback if localStorage is empty
 * Returns null if no credentials are stored
 */
export function getCredentials(): UserCredentials | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as UserCredentials

      // Validate that all fields exist
      if (typeof parsed.nytToken === "string" && typeof parsed.anthropicKey === "string") {
        return parsed
      }
    }
  } catch {
    // Fall through to env check
  }

  // In development, check env variables as fallback
  if (import.meta.env.DEV) {
    const envCreds = getEnvCredentials()
    if (envCreds) return envCreds
  }

  return null
}

/**
 * Save user credentials to localStorage
 */
export function saveCredentials(credentials: UserCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

/**
 * Remove user credentials from localStorage
 */
export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if credentials are stored
 */
export function hasCredentials(): boolean {
  return getCredentials() !== null
}

/**
 * Update a single credential field
 */
export function updateCredential(key: keyof UserCredentials, value: string): void {
  const existing = getCredentials()
  const updated: UserCredentials = {
    nytToken: existing?.nytToken ?? "",
    anthropicKey: existing?.anthropicKey ?? "",
    [key]: value,
  }
  saveCredentials(updated)
}

/**
 * Convert a Rank to a simplified score status for display
 */
export function rankToScoreStatus(rank: Rank): PuzzleScoreStatus {
  if (rank === "Queen Bee") return "queen-bee"
  if (rank === "Genius") return "genius"
  return "started"
}

/**
 * Get all saved puzzle score statuses
 */
export function getPuzzleScoreStatuses(): Record<number, PuzzleScoreStatus> {
  try {
    const stored = localStorage.getItem(PUZZLE_RANKS_KEY)
    if (stored) {
      return JSON.parse(stored) as Record<number, PuzzleScoreStatus>
    }
  } catch {
    // Fall through
  }
  return {}
}

/**
 * Save a puzzle's score status
 */
export function savePuzzleScoreStatus(puzzleId: number, status: PuzzleScoreStatus): void {
  const existing = getPuzzleScoreStatuses()
  existing[puzzleId] = status
  localStorage.setItem(PUZZLE_RANKS_KEY, JSON.stringify(existing))
}

/**
 * Get the score status for a specific puzzle
 */
export function getPuzzleScoreStatus(puzzleId: number): PuzzleScoreStatus {
  const statuses = getPuzzleScoreStatuses()
  return statuses[puzzleId] ?? null
}
