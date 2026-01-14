import { useState, useEffect, useCallback } from "react"
import { fetchPuzzle, ApiError } from "@/lib/api"
import type { GameData } from "@/types"
import { calculateTotalPoints } from "@/lib/utils"

/**
 * Hook state for puzzle data
 */
export interface UsePuzzleState {
  /** The puzzle data when loaded */
  puzzle: GameData | null
  /** Whether the puzzle is currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
  /** Maximum possible points for the puzzle */
  maxPoints: number
}

/**
 * Hook return type
 */
export interface UsePuzzleReturn extends UsePuzzleState {
  /** Refetch the puzzle data */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage today's puzzle data
 *
 * @example
 * ```tsx
 * function PuzzleDisplay() {
 *   const { puzzle, isLoading, error, maxPoints, refetch } = usePuzzle()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!puzzle) return null
 *
 *   return (
 *     <div>
 *       <h1>{puzzle.today.displayDate}</h1>
 *       <p>Max points: {maxPoints}</p>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePuzzle(): UsePuzzleReturn {
  const [puzzle, setPuzzle] = useState<GameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchPuzzle()
      setPuzzle(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load puzzle")
      }
      setPuzzle(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate max points when puzzle data is available
  const maxPoints = puzzle ? calculateTotalPoints(puzzle.today.answers, puzzle.today.pangrams) : 0

  return {
    puzzle,
    isLoading,
    error,
    maxPoints,
    refetch: fetchData,
  }
}
