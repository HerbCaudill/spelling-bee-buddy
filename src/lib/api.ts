import type {
  GameData,
  CubbyResponse,
  CachedHints,
  ActivePuzzlesResponse,
  PuzzleStats,
} from "@/types"

/**
 * Worker API base URL
 * Uses localhost in development, production URL otherwise
 */
const WORKER_URL =
  import.meta.env.DEV ?
    "http://localhost:8787"
  : import.meta.env.VITE_WORKER_URL || "https://spelling-bee-buddy.herbcaudill.workers.dev"

/**
 * API response wrapper type
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Error thrown by API functions
 */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * Make a request to the Worker API
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WORKER_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const data: ApiResponse<T> = await response.json()

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error || `Request failed with status ${response.status}`,
      response.status,
    )
  }

  if (data.data === undefined) {
    throw new ApiError("Response missing data", 500)
  }

  return data.data
}

/**
 * Fetch today's puzzle data from the Worker
 */
export async function fetchPuzzle(): Promise<GameData> {
  return fetchApi<GameData>("/puzzle")
}

/**
 * Fetch user's found words from the Worker (requires NYT token)
 * @param nytToken - User's NYT-S cookie token
 * @param puzzleId - Optional puzzle ID to get progress for a specific puzzle
 */
export async function fetchProgress(nytToken: string, puzzleId?: number): Promise<CubbyResponse> {
  const endpoint = puzzleId ? `/progress?puzzleId=${puzzleId}` : "/progress"
  return fetchApi<CubbyResponse>(endpoint, {
    headers: {
      "X-NYT-Token": nytToken,
    },
  })
}

/**
 * Fetch hints for today's puzzle from the Worker (requires Anthropic API key)
 */
export async function fetchHints(anthropicKey: string): Promise<CachedHints> {
  return fetchApi<CachedHints>("/hints", {
    headers: {
      "X-Anthropic-Key": anthropicKey,
    },
  })
}

/**
 * Check if the Worker is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await fetchApi<{ status: string }>("/health")
    return true
  } catch {
    return false
  }
}

/**
 * Get the current Worker URL (useful for debugging)
 */
export function getWorkerUrl(): string {
  return WORKER_URL
}

/**
 * Fetch the list of active puzzles (this week and last week)
 */
export async function fetchActivePuzzles(): Promise<ActivePuzzlesResponse> {
  return fetchApi<ActivePuzzlesResponse>("/active")
}

/**
 * Fetch stats for a specific puzzle (how many players found each word)
 */
export async function fetchPuzzleStats(puzzleId: number): Promise<PuzzleStats> {
  return fetchApi<PuzzleStats>(`/stats/${puzzleId}`)
}
