import { useState, useEffect, useCallback, useMemo } from "react"
import { fetchActivePuzzles, ApiError } from "@/lib/api"
import type { ActivePuzzlesResponse, ActivePuzzle, GameData } from "@/types"
import { calculateTotalPoints } from "@/lib/utils"

export interface UseSelectedPuzzleState {
  /** The active puzzles response with all available puzzles */
  activePuzzles: ActivePuzzlesResponse | null
  /** The currently selected puzzle */
  selectedPuzzle: ActivePuzzle | null
  /** The selected puzzle converted to GameData format */
  puzzle: GameData | null
  /** Maximum possible points for the selected puzzle */
  maxPoints: number
  /** Whether the data is currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
  /** Whether the selected puzzle is today's puzzle */
  isToday: boolean
}

export interface UseSelectedPuzzleReturn extends UseSelectedPuzzleState {
  /** Select a puzzle by its ID */
  selectPuzzle: (puzzleId: number) => void
  /** Select today's puzzle */
  selectToday: () => void
  /** Refetch the active puzzles */
  refetch: () => Promise<void>
}

/**
 * Convert an ActivePuzzle to the GameData format used by the rest of the app
 */
function activePuzzleToGameData(puzzle: ActivePuzzle): GameData {
  // Parse the print_date to create display values
  const date = new Date(puzzle.print_date + "T12:00:00") // Add time to avoid timezone issues
  const displayWeekday = date.toLocaleDateString("en-US", { weekday: "long" })
  const displayDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return {
    today: {
      displayWeekday,
      displayDate,
      printDate: puzzle.print_date,
      centerLetter: puzzle.center_letter,
      outerLetters: puzzle.outer_letters.split(""),
      validLetters: [puzzle.center_letter, ...puzzle.outer_letters.split("")],
      pangrams: puzzle.pangrams,
      answers: puzzle.answers,
      id: puzzle.id,
    },
  }
}

/**
 * Hook to manage puzzle selection from the active puzzles list
 *
 * Fetches the list of available puzzles and allows selecting one.
 * Defaults to today's puzzle.
 */
export function useSelectedPuzzle(): UseSelectedPuzzleReturn {
  const [activePuzzles, setActivePuzzles] = useState<ActivePuzzlesResponse | null>(null)
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchActivePuzzles()
      setActivePuzzles(data)
      // Select today's puzzle by default if not already selected
      if (selectedPuzzleId === null) {
        const todayIndex = data.today
        const todayPuzzle = data.puzzles[todayIndex]
        if (todayPuzzle) {
          setSelectedPuzzleId(todayPuzzle.id)
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load puzzles")
      }
      setActivePuzzles(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedPuzzleId])

  useEffect(() => {
    fetchData()
  }, []) // Only fetch on mount, not when selectedPuzzleId changes

  // Find the selected puzzle from the list
  const selectedPuzzle = useMemo(() => {
    if (!activePuzzles || selectedPuzzleId === null) return null
    return activePuzzles.puzzles.find(p => p.id === selectedPuzzleId) ?? null
  }, [activePuzzles, selectedPuzzleId])

  // Convert to GameData format
  const puzzle = useMemo(() => {
    if (!selectedPuzzle) return null
    return activePuzzleToGameData(selectedPuzzle)
  }, [selectedPuzzle])

  // Calculate max points
  const maxPoints = useMemo(() => {
    if (!puzzle) return 0
    return calculateTotalPoints(puzzle.today.answers, puzzle.today.pangrams)
  }, [puzzle])

  // Check if selected puzzle is today's puzzle
  const isToday = useMemo(() => {
    if (!activePuzzles || selectedPuzzleId === null) return false
    const todayPuzzle = activePuzzles.puzzles[activePuzzles.today]
    return todayPuzzle?.id === selectedPuzzleId
  }, [activePuzzles, selectedPuzzleId])

  const selectPuzzle = useCallback((puzzleId: number) => {
    setSelectedPuzzleId(puzzleId)
  }, [])

  const selectToday = useCallback(() => {
    if (!activePuzzles) return
    const todayPuzzle = activePuzzles.puzzles[activePuzzles.today]
    if (todayPuzzle) {
      setSelectedPuzzleId(todayPuzzle.id)
    }
  }, [activePuzzles])

  return {
    activePuzzles,
    selectedPuzzle,
    puzzle,
    maxPoints,
    isLoading,
    error,
    isToday,
    selectPuzzle,
    selectToday,
    refetch: fetchData,
  }
}
