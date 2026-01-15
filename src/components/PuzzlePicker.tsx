import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ActivePuzzlesResponse, ActivePuzzle } from "@/types"

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

/**
 * Get day of week abbreviation
 */
function getDayAbbrev(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

export function PuzzlePicker({
  activePuzzles,
  selectedPuzzleId,
  onSelectPuzzle,
  className,
}: Props) {
  if (!activePuzzles) return null

  const { puzzles, today: todayIndex, thisWeek, lastWeek } = activePuzzles

  // Find the current puzzle index
  const currentIndex = puzzles.findIndex(p => p.id === selectedPuzzleId)

  // Get previous and next puzzles
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < puzzles.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      onSelectPuzzle(puzzles[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onSelectPuzzle(puzzles[currentIndex + 1].id)
    }
  }

  // Group puzzles by week
  const thisWeekPuzzles = thisWeek.map(i => puzzles[i]).filter(Boolean)
  const lastWeekPuzzles = lastWeek.map(i => puzzles[i]).filter(Boolean)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Navigation arrows */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevious}
          disabled={!hasPrevious}
          aria-label="Previous puzzle"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="text-muted-foreground text-sm">
          {currentIndex >= 0 ? formatDate(puzzles[currentIndex].print_date) : "Select a puzzle"}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Next puzzle"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Week view */}
      <div className="space-y-2">
        {/* This week */}
        <div className="flex gap-1">
          {thisWeekPuzzles.map(puzzle => (
            <DayButton
              key={puzzle.id}
              puzzle={puzzle}
              isSelected={puzzle.id === selectedPuzzleId}
              isToday={puzzles[todayIndex]?.id === puzzle.id}
              onClick={() => onSelectPuzzle(puzzle.id)}
            />
          ))}
        </div>

        {/* Last week */}
        {lastWeekPuzzles.length > 0 && (
          <div className="flex gap-1">
            {lastWeekPuzzles.map(puzzle => (
              <DayButton
                key={puzzle.id}
                puzzle={puzzle}
                isSelected={puzzle.id === selectedPuzzleId}
                isToday={false}
                onClick={() => onSelectPuzzle(puzzle.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DayButton({ puzzle, isSelected, isToday, onClick }: DayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-10 flex-col items-center justify-center rounded-md px-2 py-1 text-xs transition-colors",
        isSelected ?
          "bg-primary text-primary-foreground"
        : "hover:bg-accent text-muted-foreground hover:text-foreground",
        isToday && !isSelected && "ring-primary ring-1",
      )}
      aria-label={`${formatDate(puzzle.print_date)}${isToday ? " (today)" : ""}`}
      aria-pressed={isSelected}
    >
      <span className="font-medium">{getDayAbbrev(puzzle.print_date)}</span>
      <span className="text-[10px] opacity-70">
        {new Date(puzzle.print_date + "T12:00:00").getDate()}
      </span>
    </button>
  )
}

type Props = {
  activePuzzles: ActivePuzzlesResponse | null
  selectedPuzzleId: number | null
  onSelectPuzzle: (puzzleId: number) => void
  className?: string
}

type DayButtonProps = {
  puzzle: ActivePuzzle
  isSelected: boolean
  isToday: boolean
  onClick: () => void
}
