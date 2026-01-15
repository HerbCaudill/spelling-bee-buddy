import { useState, useEffect, useCallback, useRef } from "react"
import { fetchPuzzleStats, ApiError } from "@/lib/api"
import type { PuzzleStats } from "@/types"

/** Default polling interval: 2 minutes */
const DEFAULT_POLL_INTERVAL = 2 * 60 * 1000

/** Faster polling interval when stats aren't available yet: 30 seconds */
const NOT_AVAILABLE_POLL_INTERVAL = 30 * 1000

export interface UsePuzzleStatsState {
  /** The puzzle stats when loaded */
  stats: PuzzleStats | null
  /** Whether the data is currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
  /** Whether stats are not yet available (404 from server) - puzzle is too new */
  notAvailableYet: boolean
}

export interface UsePuzzleStatsReturn extends UsePuzzleStatsState {
  /** Refetch the stats */
  refetch: () => Promise<void>
}

export interface UsePuzzleStatsOptions {
  /** Whether to fetch stats (defaults to true) */
  enabled?: boolean
  /** Polling interval in ms (defaults to 2 minutes, set to 0 to disable) */
  pollInterval?: number
}

/**
 * Hook to fetch and manage stats for a specific puzzle
 *
 * @param puzzleId - The puzzle ID to fetch stats for
 * @param options - Configuration options
 */
export function usePuzzleStats(
  puzzleId: number | null,
  options: UsePuzzleStatsOptions = {},
): UsePuzzleStatsReturn {
  const { enabled = true, pollInterval = DEFAULT_POLL_INTERVAL } = options

  const [stats, setStats] = useState<PuzzleStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notAvailableYet, setNotAvailableYet] = useState(false)

  // Track if this is the initial load (to avoid showing loading state during polling)
  const hasLoadedOnce = useRef(false)

  const fetchData = useCallback(
    async (isPolling = false) => {
      if (!puzzleId || !enabled) {
        setStats(null)
        setIsLoading(false)
        setNotAvailableYet(false)
        return
      }

      // Only show loading state on initial load, not during background polling
      if (!isPolling || !hasLoadedOnce.current) {
        setIsLoading(true)
      }

      try {
        const data = await fetchPuzzleStats(puzzleId)
        setStats(data)
        setError(null)
        setNotAvailableYet(false)
        hasLoadedOnce.current = true
      } catch (err) {
        if (err instanceof ApiError) {
          // Check if it's a 404 (stats not available yet)
          if (err.status === 404) {
            setNotAvailableYet(true)
            setError(null)
            setStats(null)
          } else {
            setError(err.message)
            setNotAvailableYet(false)
          }
        } else if (err instanceof Error) {
          setError(err.message)
          setNotAvailableYet(false)
        } else {
          setError("Failed to load puzzle stats")
          setNotAvailableYet(false)
        }
        // Keep existing stats during polling errors
        if (!isPolling) {
          setStats(null)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [puzzleId, enabled],
  )

  // Initial fetch
  useEffect(() => {
    hasLoadedOnce.current = false
    fetchData()
  }, [fetchData])

  // Polling effect
  useEffect(() => {
    if (!puzzleId || !enabled || pollInterval === 0) {
      return
    }

    // Poll faster when stats aren't available yet
    const interval = notAvailableYet ? NOT_AVAILABLE_POLL_INTERVAL : pollInterval

    const timerId = setInterval(() => {
      fetchData(true)
    }, interval)

    return () => clearInterval(timerId)
  }, [puzzleId, enabled, pollInterval, notAvailableYet, fetchData])

  return {
    stats,
    isLoading,
    error,
    notAvailableYet,
    refetch: () => fetchData(false),
  }
}
