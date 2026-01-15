import { useState, useEffect, useCallback } from "react"
import { fetchPuzzleStats, ApiError } from "@/lib/api"
import type { PuzzleStats } from "@/types"

export interface UsePuzzleStatsState {
  /** The puzzle stats when loaded */
  stats: PuzzleStats | null
  /** Whether the data is currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
}

export interface UsePuzzleStatsReturn extends UsePuzzleStatsState {
  /** Refetch the stats */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage stats for a specific puzzle
 *
 * @param puzzleId - The puzzle ID to fetch stats for
 * @param enabled - Whether to fetch stats (defaults to true when puzzleId is provided)
 */
export function usePuzzleStats(puzzleId: number | null, enabled = true): UsePuzzleStatsReturn {
  const [stats, setStats] = useState<PuzzleStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!puzzleId || !enabled) {
      setStats(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchPuzzleStats(puzzleId)
      setStats(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load puzzle stats")
      }
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [puzzleId, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchData,
  }
}
