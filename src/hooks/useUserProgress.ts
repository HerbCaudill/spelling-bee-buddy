import { useState, useEffect, useCallback } from "react"
import { fetchProgress, ApiError } from "@/lib/api"
import { getCredentials } from "@/lib/storage"
import { calculateTotalPoints } from "@/lib/utils"
import type { CubbyResponse } from "@/types"

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
 * Hook to fetch and manage user's puzzle progress
 *
 * Requires NYT token to be stored in localStorage.
 * If no credentials are stored, returns empty found words.
 *
 * @param pangrams - Array of pangram words (needed for point calculation)
 * @param enabled - Whether to fetch progress (defaults to true)
 *
 * @example
 * ```tsx
 * function ProgressDisplay() {
 *   const { puzzle } = usePuzzle()
 *   const { foundWords, currentPoints, isLoading, error, hasCredentials, refetch } =
 *     useUserProgress(puzzle?.today.pangrams ?? [])
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
): UseUserProgressReturn {
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCredentials, setHasCredentials] = useState(false)

  const fetchData = useCallback(async () => {
    const credentials = getCredentials()
    setHasCredentials(
      credentials !== null && credentials.nytToken !== "" && credentials.nytSubscriberId !== "",
    )

    if (!credentials || !credentials.nytToken || !credentials.nytSubscriberId) {
      setFoundWords([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data: CubbyResponse = await fetchProgress(
        credentials.nytToken,
        credentials.nytSubscriberId,
      )
      setFoundWords(data.content.words)
    } catch (err) {
      if (err instanceof ApiError) {
        // Handle 401 specifically - likely expired token
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
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  // Calculate current points based on found words
  const currentPoints = calculateTotalPoints(foundWords, pangrams)

  return {
    foundWords,
    isLoading,
    error,
    hasCredentials,
    currentPoints,
    refetch: fetchData,
  }
}
