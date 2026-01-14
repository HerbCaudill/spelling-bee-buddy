import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Settings, ExternalLink } from "lucide-react"

export interface HeaderProps {
  /** Day of the week (e.g., "Wednesday") */
  displayWeekday: string
  /** Full date (e.g., "January 14, 2026") */
  displayDate: string
  /** Print date for URL construction (e.g., "2026-01-14") */
  printDate: string
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void
  /** Optional className for the container */
  className?: string
}

/**
 * Header component with puzzle info and links
 *
 * Displays:
 * - Puzzle date (weekday and full date)
 * - Link to NYT Spelling Bee game
 * - Settings button for credentials
 */
export function Header({
  displayWeekday,
  displayDate,
  printDate,
  onSettingsClick,
  className,
}: HeaderProps) {
  const nytPuzzleUrl = `https://www.nytimes.com/puzzles/spelling-bee`

  return (
    <header
      className={cn(
        "border-border flex items-center justify-between border-b px-4 py-3",
        className,
      )}
    >
      {/* Puzzle date */}
      <div className="flex flex-col">
        <h1 className="text-lg leading-tight font-semibold">{displayWeekday}</h1>
        <time dateTime={printDate} className="text-muted-foreground text-sm">
          {displayDate}
        </time>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Link to NYT Spelling Bee */}
        <Button variant="outline" size="sm" asChild>
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
        <Button variant="ghost" size="icon-sm" onClick={onSettingsClick} aria-label="Open settings">
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  )
}
