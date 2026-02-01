import { useState, useEffect, useCallback, useRef } from "react"
import { fetchProgress, ApiError } from "@/lib/api"
import { getCredentials } from "@/lib/storage"
import { calculateTotalPoints } from "@/lib/utils"
import type { CubbyResponse } from "@/types"

/** Default polling interval: 30 seconds */
const DEFAULT_POLL_INTERVAL = 30_000

/**
 * Hook state for user progress data
 */
export interface UseUserProgressState {
  /** The user's found words */
  foundWords: string[]
  /** Whether progress is currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
  /** Whether NYT credentials are configured */
  hasCredentials: boolean
}

/**
 * Hook return type
 */
export interface UseUserProgressReturn extends UseUserProgressState {
  /** Current points based on found words */
  currentPoints: number
  /** Refetch the user's progress */
  refetch: () => Promise<void>
}

/**
 * Options for useUserProgress
 */
export interface UseUserProgressOptions {
  /** Polling interval in milliseconds (0 to disable, default 5000). Only polls while page is visible. */
  pollInterval?: number
}

/**
 * Hook to fetch and manage user's puzzle progress
 *
 * Requires NYT token to be stored in localStorage.
 * If no credentials are stored, returns empty found words.
 *
 * @param pangrams - Array of pangram words (needed for point calculation)
 * @param enabled - Whether to fetch progress (defaults to true)
 * @param puzzleId - Optional puzzle ID to get progress for a specific puzzle
 *
 * @example
 * ```tsx
 * function ProgressDisplay() {
 *   const { puzzle } = usePuzzle()
 *   const { foundWords, currentPoints, isLoading, error, hasCredentials, refetch } =
 *     useUserProgress(puzzle?.today.pangrams ?? [], true, puzzle?.today.id)
 *
 *   if (!hasCredentials) return <div>Please configure NYT credentials</div>
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *
 *   return (
 *     <div>
 *       <p>Found {foundWords.length} words</p>
 *       <p>Points: {currentPoints}</p>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUserProgress(
  pangrams: string[],
  enabled: boolean = true,
  puzzleId?: number,
  options: UseUserProgressOptions = {},
): UseUserProgressReturn {
  const { pollInterval = DEFAULT_POLL_INTERVAL } = options

  const [foundWords, setFoundWords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCredentials, setHasCredentials] = useState(false)

  /** Track whether this is the initial load (to avoid showing loading state during polling) */
  const isInitialLoad = useRef(true)

  const fetchData = useCallback(
    async (
      /** Whether to show loading state (false for background polls) */
      showLoading = true,
    ) => {
      const credentials = getCredentials()
      setHasCredentials(credentials !== null && credentials.nytToken !== "")

      if (!credentials || !credentials.nytToken) {
        setFoundWords([])
        setIsLoading(false)
        return
      }

      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const data: CubbyResponse = await fetchProgress(credentials.nytToken, puzzleId)
        setFoundWords(data.content.words)
        isInitialLoad.current = false
      } catch (err) {
        // Keep existing data during background polling errors
        if (showLoading) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              setError("Invalid or expired NYT token. Please update your credentials.")
            } else {
              setError(err.message)
            }
          } else if (err instanceof Error) {
            setError(err.message)
          } else {
            setError("Failed to load progress")
          }
          setFoundWords([])
        }
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    },
    [puzzleId],
  )

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      isInitialLoad.current = true
      fetchData()
    }
  }, [fetchData, enabled])

  // Visibility-aware polling
  useEffect(() => {
    if (!enabled || pollInterval === 0) return

    let timerId: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (timerId) return
      timerId = setInterval(() => {
        fetchData(false)
      }, pollInterval)
    }

    const stopPolling = () => {
      if (timerId) {
        clearInterval(timerId)
        timerId = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData(false) // Fetch immediately on becoming visible
        startPolling()
      } else {
        stopPolling()
      }
    }

    // Start polling if page is currently visible
    if (document.visibilityState === "visible") {
      startPolling()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, pollInterval, fetchData])

  // Calculate current points based on found words
  const currentPoints = calculateTotalPoints(foundWords, pangrams)

  return {
    foundWords,
    isLoading,
    error,
    hasCredentials,
    currentPoints,
    refetch: () => fetchData(true),
  }
}
