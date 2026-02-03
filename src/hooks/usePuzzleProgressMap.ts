import { useState, useEffect, useCallback } from "react"
import { fetchProgress } from "@/lib/api"
import { getCredentials } from "@/lib/storage"
import { calculateTotalPoints, getRank } from "@/lib/utils"
import type { ActivePuzzle, Rank } from "@/types"

/**
 * Progress status for a single puzzle
 */
export type PuzzleStatus = "not-started" | "in-progress" | "genius" | "queen-bee"

/**
 * Progress data for a single puzzle
 */
export interface PuzzleProgress {
  puzzleId: number
  status: PuzzleStatus
  rank: Rank
  currentPoints: number
  maxPoints: number
  foundWords: string[]
}

/**
 * Map of puzzle ID to progress data
 */
export type PuzzleProgressMap = Map<number, PuzzleProgress>

/**
 * Hook return type
 */
export interface UsePuzzleProgressMapReturn {
  progressMap: PuzzleProgressMap
  isLoading: boolean
}

/**
 * Determine the status category for a puzzle based on rank
 */
function getStatusFromRank(rank: Rank, foundWords: string[]): PuzzleStatus {
  if (foundWords.length === 0) return "not-started"
  if (rank === "Queen Bee") return "queen-bee"
  if (rank === "Genius") return "genius"
  return "in-progress"
}

/**
 * Hook to lazily fetch progress for multiple puzzles
 *
 * Fetches progress data after initial render to avoid blocking page load.
 * Progress is cached per session.
 *
 * @param puzzles - Array of puzzles to fetch progress for
 * @param enabled - Whether to fetch progress (e.g., only when credentials exist)
 */
export function usePuzzleProgressMap(
  puzzles: ActivePuzzle[],
  enabled: boolean = true,
): UsePuzzleProgressMapReturn {
  const [progressMap, setProgressMap] = useState<PuzzleProgressMap>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  const fetchAllProgress = useCallback(async () => {
    const credentials = getCredentials()
    if (!credentials?.nytToken || puzzles.length === 0) {
      return
    }

    setIsLoading(true)

    const newProgressMap = new Map<number, PuzzleProgress>()

    // Fetch progress for all puzzles in parallel
    const results = await Promise.allSettled(
      puzzles.map(async puzzle => {
        try {
          const response = await fetchProgress(credentials.nytToken, puzzle.id)
          const foundWords = response.content.words
          const maxPoints = calculateTotalPoints(puzzle.answers, puzzle.pangrams)
          const currentPoints = calculateTotalPoints(foundWords, puzzle.pangrams)
          const rank = getRank(currentPoints, maxPoints)
          const status = getStatusFromRank(rank, foundWords)

          return {
            puzzleId: puzzle.id,
            status,
            rank,
            currentPoints,
            maxPoints,
            foundWords,
          } as PuzzleProgress
        } catch {
          // Return a default "not started" state on error
          return {
            puzzleId: puzzle.id,
            status: "not-started" as PuzzleStatus,
            rank: "Beginner" as Rank,
            currentPoints: 0,
            maxPoints: calculateTotalPoints(puzzle.answers, puzzle.pangrams),
            foundWords: [],
          } as PuzzleProgress
        }
      }),
    )

    for (const result of results) {
      if (result.status === "fulfilled") {
        newProgressMap.set(result.value.puzzleId, result.value)
      }
    }

    setProgressMap(newProgressMap)
    setIsLoading(false)
  }, [puzzles])

  // Fetch progress lazily after initial render
  useEffect(() => {
    if (!enabled || puzzles.length === 0) return

    // Use requestIdleCallback or setTimeout to defer the fetch
    const timeoutId = setTimeout(() => {
      fetchAllProgress()
    }, 100) // Small delay to let the page render first

    return () => clearTimeout(timeoutId)
  }, [enabled, fetchAllProgress, puzzles.length])

  return {
    progressMap,
    isLoading,
  }
}
