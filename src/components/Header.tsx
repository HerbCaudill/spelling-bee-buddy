import { useState } from "react"
import { cn, formatRelativeDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, ExternalLink, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { ActivePuzzlesResponse, ActivePuzzle } from "@/types"

export interface HeaderProps {
  /** Print date in ISO format (e.g., "2026-01-14") */
  printDate: string
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void
  /** Optional className for the container */
  className?: string
  /** Active puzzles for the date picker */
  activePuzzles?: ActivePuzzlesResponse | null
  /** Currently selected puzzle ID */
  selectedPuzzleId?: number | null
  /** Callback when a puzzle is selected */
  onSelectPuzzle?: (puzzleId: number) => void
}

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

/**
 * Header component with puzzle info and links
 *
 * Displays:
 * - Puzzle date with optional date picker (behind calendar icon)
 * - Link to NYT Spelling Bee game
 * - Settings button for credentials
 */
export function Header({
  printDate,
  onSettingsClick,
  className,
  activePuzzles,
  selectedPuzzleId,
  onSelectPuzzle,
}: HeaderProps) {
  const nytPuzzleUrl = `https://www.nytimes.com/puzzles/spelling-bee/${printDate}`

  // Date picker props
  const hasPuzzlePicker = activePuzzles && selectedPuzzleId !== undefined && onSelectPuzzle
  const puzzles = activePuzzles?.puzzles ?? []
  const currentIndex = puzzles.findIndex(p => p.id === selectedPuzzleId)
  const todayIndex = activePuzzles?.today ?? -1

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < puzzles.length - 1

  const handlePrevious = () => {
    if (hasPrevious && onSelectPuzzle) {
      onSelectPuzzle(puzzles[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (hasNext && onSelectPuzzle) {
      onSelectPuzzle(puzzles[currentIndex + 1].id)
    }
  }

  const [pickerOpen, setPickerOpen] = useState(false)

  // Group puzzles by week
  const thisWeekPuzzles = (activePuzzles?.thisWeek ?? []).map(i => puzzles[i]).filter(Boolean)
  const lastWeekPuzzles = (activePuzzles?.lastWeek ?? []).map(i => puzzles[i]).filter(Boolean)

  return (
    <header
      className={cn(
        "bg-accent text-accent-foreground flex items-center justify-between px-4 py-3",
        className,
      )}
    >
      {/* Logo and title */}
      <div className="flex items-center gap-3">
        <img src="/icon.svg" alt="" className="size-8" aria-hidden="true" />
        <h1 className="text-lg font-semibold">Spelling Bee Buddy</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Date picker */}
        {hasPuzzlePicker && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Choose a different puzzle date"
                className="text-accent-foreground hover:bg-accent-foreground/10"
              >
                <Calendar className="size-4" />
                <time dateTime={printDate} className="text-sm">
                  {formatRelativeDate(printDate)}
                </time>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto">
              <div className="flex flex-col gap-3">
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
                    {currentIndex >= 0 ?
                      formatDate(puzzles[currentIndex].print_date)
                    : "Select a puzzle"}
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
                        onClick={() => {
                          onSelectPuzzle(puzzle.id)
                          setPickerOpen(false)
                        }}
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
                          onClick={() => {
                            onSelectPuzzle(puzzle.id)
                            setPickerOpen(false)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Static date display when no picker available */}
        {!hasPuzzlePicker && (
          <div className="text-accent-foreground flex items-center gap-1 text-sm">
            <Calendar className="size-4" />
            <time dateTime={printDate}>{formatRelativeDate(printDate)}</time>
          </div>
        )}

        {/* Link to NYT Spelling Bee */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10 bg-transparent"
        >
          <a
            href={nytPuzzleUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open NYT Spelling Bee puzzle"
          >
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">Play</span>
          </a>
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSettingsClick}
          aria-label="Open settings"
          className="text-accent-foreground hover:bg-accent-foreground/10"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
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

type DayButtonProps = {
  puzzle: ActivePuzzle
  isSelected: boolean
  isToday: boolean
  onClick: () => void
}
