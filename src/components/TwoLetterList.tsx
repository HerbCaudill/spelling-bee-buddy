import { cn } from "@/lib/utils"
import { buildTwoLetterGroups } from "@/lib/utils"

export interface TwoLetterListProps {
  /** All valid words for the puzzle */
  allWords: string[]
  /** Words the user has found */
  foundWords: string[]
  /** Optional className for the container */
  className?: string
}

/**
 * List showing word counts by two-letter prefix
 *
 * Displays:
 * - Two-letter prefixes (AB, AC, etc.) with found/total counts
 * - Completed prefixes shown with checkmark
 * - Organized in a responsive grid layout
 */
export function TwoLetterList({ allWords, foundWords, className }: TwoLetterListProps) {
  const groups = buildTwoLetterGroups(allWords, foundWords)

  // Empty state
  if (allWords.length === 0) {
    return (
      <div className={cn("text-muted-foreground py-8 text-center", className)}>
        No puzzle data available
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        Two-Letter List
      </h2>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
        {groups.map(group => {
          const isComplete = group.found === group.total
          return (
            <div
              key={group.prefix}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                isComplete ? "bg-primary/10 text-primary" : "bg-secondary text-foreground",
              )}
            >
              <span className="font-medium">{group.prefix}</span>
              <span
                className={cn("text-xs", isComplete ? "text-primary" : "text-muted-foreground")}
              >
                {isComplete ?
                  <span aria-label={`${group.found} of ${group.total}, complete`}>✓</span>
                : <span aria-label={`${group.found} of ${group.total} found`}>
                    {group.found}/{group.total}
                  </span>
                }
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
