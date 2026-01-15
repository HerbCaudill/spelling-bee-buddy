import { useState, useEffect, useCallback } from "react"
import { fetchActivePuzzles, ApiError } from "@/lib/api"
import type { ActivePuzzlesResponse } from "@/types"

export interface UseActivePuzzlesState {
  /** The active puzzles data when loaded */
  activePuzzles: ActivePuzzlesResponse | null
  /** Whether the data is currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
}

export interface UseActivePuzzlesReturn extends UseActivePuzzlesState {
  /** Refetch the active puzzles */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage the list of active puzzles (this week and last week)
 */
export function useActivePuzzles(): UseActivePuzzlesReturn {
  const [activePuzzles, setActivePuzzles] = useState<ActivePuzzlesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchActivePuzzles()
      setActivePuzzles(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load active puzzles")
      }
      setActivePuzzles(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    activePuzzles,
    isLoading,
    error,
    refetch: fetchData,
  }
}
