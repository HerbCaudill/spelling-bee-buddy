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
    `http://${window.location.hostname}:8787`
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
 * Log API request/response for debugging
 * Only logs in development mode
 */
function logApiCall(
  method: string,
  url: string,
  requestHeaders: Record<string, string>,
  response: Response,
  data: ApiResponse<unknown>,
) {
  if (!import.meta.env.DEV) return

  // Redact sensitive headers for logging
  const safeHeaders = { ...requestHeaders }
  if (safeHeaders["X-NYT-Token"]) {
    safeHeaders["X-NYT-Token"] = `${safeHeaders["X-NYT-Token"].slice(0, 8)}...`
  }
  if (safeHeaders["X-Anthropic-Key"]) {
    safeHeaders["X-Anthropic-Key"] = `${safeHeaders["X-Anthropic-Key"].slice(0, 8)}...`
  }

  console.group(`🐝 API ${method} ${url}`)
  console.log("Request headers:", safeHeaders)
  console.log("Response status:", response.status, response.statusText)
  console.log("Response data:", data)
  console.groupEnd()
}

/**
 * Make a request to the Worker API
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WORKER_URL}${endpoint}`

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  const response = await fetch(url, {
    ...options,
    headers: requestHeaders,
  })

  const data: ApiResponse<T> = await response.json()

  // Log the request/response for debugging
  logApiCall(options.method || "GET", url, requestHeaders, response, data as ApiResponse<unknown>)

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
 * Fetch hints for a puzzle from the Worker (requires Anthropic API key)
 * @param anthropicKey - User's Anthropic API key
 * @param puzzleId - Optional puzzle ID to get hints for a specific puzzle
 */
export async function fetchHints(anthropicKey: string, puzzleId?: number): Promise<CachedHints> {
  const endpoint = puzzleId ? `/hints?puzzleId=${puzzleId}` : "/hints"
  return fetchApi<CachedHints>(endpoint, {
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
