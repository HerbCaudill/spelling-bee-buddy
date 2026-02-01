import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { fetchActivePuzzles, ApiError } from "@/lib/api"
import { getDateFromUrl, updateUrl } from "@/lib/routing"
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

  // The active.json API doesn't include pangrams in the answers array,
  // so we need to merge them in
  const allAnswers = [...puzzle.answers]
  for (const pangram of puzzle.pangrams) {
    if (!allAnswers.includes(pangram)) {
      allAnswers.push(pangram)
    }
  }

  return {
    today: {
      displayWeekday,
      displayDate,
      printDate: puzzle.print_date,
      centerLetter: puzzle.center_letter,
      outerLetters: puzzle.outer_letters.split(""),
      validLetters: [puzzle.center_letter, ...puzzle.outer_letters.split("")],
      pangrams: puzzle.pangrams,
      answers: allAnswers,
      id: puzzle.id,
    },
  }
}

/**
 * Find a puzzle by its print_date in the puzzles list.
 */
function findPuzzleByDate(puzzles: ActivePuzzle[], date: string): ActivePuzzle | undefined {
  return puzzles.find(p => p.print_date === date)
}

/**
 * Hook to manage puzzle selection from the active puzzles list.
 *
 * Syncs the selected puzzle with the URL pathname (`/YYYY-MM-DD`).
 * On mount, reads the date from the URL. Navigating to `/` or an invalid date
 * replaces the URL with today's date. Selecting a puzzle pushes a new history entry.
 * Browser back/forward navigation is supported via the popstate event.
 */
export function useSelectedPuzzle(): UseSelectedPuzzleReturn {
  const [activePuzzles, setActivePuzzles] = useState<ActivePuzzlesResponse | null>(null)
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Whether we're handling a popstate event (to avoid pushing to history) */
  const isPopstateRef = useRef(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchActivePuzzles()
      setActivePuzzles(data)

      // If we already have a selected puzzle (e.g. from popstate), keep it
      if (selectedPuzzleId !== null) return

      // Check the current URL for a date to load
      const urlDate = getDateFromUrl()
      if (urlDate) {
        const puzzle = findPuzzleByDate(data.puzzles, urlDate)
        if (puzzle) {
          setSelectedPuzzleId(puzzle.id)
          // URL already shows the correct date, just replace to normalize
          updateUrl(urlDate, true)
          return
        }
      }

      // Fall back to today's puzzle
      const todayPuzzle = data.puzzles[data.today]
      if (todayPuzzle) {
        setSelectedPuzzleId(todayPuzzle.id)
        updateUrl(todayPuzzle.print_date, true)
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

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopstate = () => {
      if (!activePuzzles) return
      const urlDate = getDateFromUrl()
      if (urlDate) {
        const puzzle = findPuzzleByDate(activePuzzles.puzzles, urlDate)
        if (puzzle) {
          isPopstateRef.current = true
          setSelectedPuzzleId(puzzle.id)
          return
        }
      }
      // Invalid date after popstate — go to today
      const todayPuzzle = activePuzzles.puzzles[activePuzzles.today]
      if (todayPuzzle) {
        isPopstateRef.current = true
        setSelectedPuzzleId(todayPuzzle.id)
        updateUrl(todayPuzzle.print_date, true)
      }
    }

    window.addEventListener("popstate", handlePopstate)
    return () => window.removeEventListener("popstate", handlePopstate)
  }, [activePuzzles])

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

  const selectPuzzle = useCallback(
    (puzzleId: number) => {
      setSelectedPuzzleId(puzzleId)

      // Update URL — push a new history entry unless this is from popstate
      if (isPopstateRef.current) {
        isPopstateRef.current = false
        return
      }

      if (activePuzzles) {
        const puzzle = activePuzzles.puzzles.find(p => p.id === puzzleId)
        if (puzzle) {
          updateUrl(puzzle.print_date)
        }
      }
    },
    [activePuzzles],
  )

  const selectToday = useCallback(() => {
    if (!activePuzzles) return
    const todayPuzzle = activePuzzles.puzzles[activePuzzles.today]
    if (todayPuzzle) {
      setSelectedPuzzleId(todayPuzzle.id)
      updateUrl(todayPuzzle.print_date)
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
