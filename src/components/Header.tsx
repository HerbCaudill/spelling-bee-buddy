import { useState } from "react"
import { cn, formatRelativeDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, ExternalLink, ChevronLeft, ChevronRight, Calendar, Crown, Lightbulb, Circle } from "lucide-react"
import { usePuzzleProgressMap, type PuzzleProgressMap, type PuzzleStatus } from "@/hooks/usePuzzleProgressMap"
import { getCredentials } from "@/lib/storage"
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

  // Lazy-load progress for all puzzles
  const hasCredentials = getCredentials()?.nytToken !== undefined
  const { progressMap } = usePuzzleProgressMap(puzzles, hasCredentials)

  // Group puzzles by week
  const thisWeekPuzzles = (activePuzzles?.thisWeek ?? []).map(i => puzzles[i]).filter(Boolean)
  const lastWeekPuzzles = (activePuzzles?.lastWeek ?? []).map(i => puzzles[i]).filter(Boolean)

  const datePickerProps = {
    printDate,
    pickerOpen,
    setPickerOpen,
    puzzles,
    currentIndex,
    todayIndex,
    selectedPuzzleId: selectedPuzzleId!,
    onSelectPuzzle: onSelectPuzzle!,
    hasPrevious,
    hasNext,
    handlePrevious,
    handleNext,
    thisWeekPuzzles,
    lastWeekPuzzles,
    progressMap,
  }

  return (
    <header
      className={cn(
        "bg-accent text-accent-foreground flex flex-wrap items-center gap-x-3 gap-y-0 px-[calc(1rem+env(safe-area-inset-left))] pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3",
        className,
      )}
    >
      {/* Logo */}
      <img
        src="/icon.svg"
        alt=""
        className="size-12 self-start sm:self-center"
        aria-hidden="true"
      />

      {/* Title — takes remaining space on row 1 */}
      <h1 className="text-xl font-semibold">Spelling Bee Buddy</h1>

      {/* Date chooser — wraps to row 2 on mobile, stays inline on sm+ */}
      <div className="order-3 -mt-1 basis-full pl-[calc(3rem+0.75rem)] sm:order-none sm:mt-0 sm:basis-auto sm:pl-0">
        {hasPuzzlePicker ?
          <DatePicker {...datePickerProps} />
        : <StaticDate printDate={printDate} />}
      </div>

      {/* Play + settings — pushed to the right */}
      <div className="order-2 ml-auto flex items-center gap-2 sm:order-none">
        <PlayButton url={nytPuzzleUrl} />
        <SettingsButton onClick={onSettingsClick} />
      </div>
    </header>
  )
}

/** Settings gear button. */
function SettingsButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label="Open settings"
      className="text-accent-foreground hover:bg-accent-foreground/10"
    >
      <Settings className="size-4" />
    </Button>
  )
}

/** Link to NYT Spelling Bee. */
function PlayButton({ url }: { url: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="text-accent-foreground hover:bg-accent-foreground/10"
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open NYT Spelling Bee puzzle"
      >
        <ExternalLink className="size-4" />
        <span className="hidden sm:inline">Play</span>
      </a>
    </Button>
  )
}

/** Static date display when no picker is available. */
function StaticDate({ printDate }: { printDate: string }) {
  return (
    <div className="text-accent-foreground flex items-center gap-1 text-sm">
      <Calendar className="size-4" />
      <time dateTime={printDate}>{formatRelativeDate(printDate)}</time>
    </div>
  )
}

/** Date picker popover with calendar icon and relative date label. */
function DatePicker({
  printDate,
  pickerOpen,
  setPickerOpen,
  puzzles,
  currentIndex,
  todayIndex,
  selectedPuzzleId,
  onSelectPuzzle,
  hasPrevious,
  hasNext,
  handlePrevious,
  handleNext,
  thisWeekPuzzles,
  lastWeekPuzzles,
  progressMap,
}: DatePickerProps) {
  const getStatus = (puzzleId: number): PuzzleStatus | undefined => {
    return progressMap.get(puzzleId)?.status
  }
  return (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Choose a different puzzle date"
          className="text-accent-foreground hover:bg-accent-foreground/10 h-auto gap-1 px-0 py-0 has-[>svg]:px-0"
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
            <div className="flex gap-1">
              {thisWeekPuzzles.map(puzzle => (
                <DayButton
                  key={puzzle.id}
                  puzzle={puzzle}
                  isSelected={puzzle.id === selectedPuzzleId}
                  isToday={puzzles[todayIndex]?.id === puzzle.id}
                  status={getStatus(puzzle.id)}
                  onClick={() => {
                    onSelectPuzzle(puzzle.id)
                    setPickerOpen(false)
                  }}
                />
              ))}
            </div>

            {lastWeekPuzzles.length > 0 && (
              <div className="flex gap-1">
                {lastWeekPuzzles.map(puzzle => (
                  <DayButton
                    key={puzzle.id}
                    puzzle={puzzle}
                    isSelected={puzzle.id === selectedPuzzleId}
                    isToday={false}
                    status={getStatus(puzzle.id)}
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
  )
}

/** Get the status icon for a puzzle */
function StatusIcon({ status, isSelected }: { status?: PuzzleStatus; isSelected: boolean }) {
  if (!status || status === "not-started") return null

  const iconClass = cn(
    "size-3",
    isSelected ? "text-yellow-300" : "text-yellow-500",
  )

  switch (status) {
    case "queen-bee":
      return <Crown className={iconClass} />
    case "genius":
      return <Lightbulb className={iconClass} />
    case "in-progress":
      return <Circle className={cn(iconClass, "size-2")} fill="currentColor" />
    default:
      return null
  }
}

function DayButton({ puzzle, isSelected, isToday, status, onClick }: DayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-w-10 flex-col items-center justify-center rounded-md px-2 py-1 text-xs transition-colors",
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
      {/* Status icon positioned at bottom right */}
      <span className="absolute right-0.5 bottom-0.5">
        <StatusIcon status={status} isSelected={isSelected} />
      </span>
    </button>
  )
}

type DatePickerProps = {
  printDate: string
  pickerOpen: boolean
  setPickerOpen: (open: boolean) => void
  puzzles: ActivePuzzle[]
  currentIndex: number
  todayIndex: number
  selectedPuzzleId: number
  onSelectPuzzle: (puzzleId: number) => void
  hasPrevious: boolean
  hasNext: boolean
  handlePrevious: () => void
  handleNext: () => void
  thisWeekPuzzles: ActivePuzzle[]
  lastWeekPuzzles: ActivePuzzle[]
  progressMap: PuzzleProgressMap
}

type DayButtonProps = {
  puzzle: ActivePuzzle
  isSelected: boolean
  isToday: boolean
  status?: PuzzleStatus
  onClick: () => void
}
