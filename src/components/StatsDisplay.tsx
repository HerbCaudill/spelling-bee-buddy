import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PuzzleStats } from "@/types"

/**
 * Format a word display - show the word if found, otherwise first letter + length
 * e.g. "A (6)" for an unfound 6-letter word starting with A
 * Returns a React node with the first letter bolded for unfound words
 */
function formatWordDisplay(word: string, isFound: boolean): React.ReactNode {
  if (isFound) return word
  return (
    <>
      <span className="font-bold">{word[0].toUpperCase()}</span> ({word.length})
    </>
  )
}

/**
 * Display a message when stats are not yet available for a new puzzle
 */
export function StatsNotAvailable({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        You vs other players
      </h2>
      <div className="border-border bg-muted/50 flex items-center gap-3 rounded-lg border p-4 text-sm">
        <Clock className="text-muted-foreground size-5 shrink-0" />
        <div>
          <p className="text-muted-foreground">
            Stats are not available yet for this puzzle. They typically appear within a few minutes
            after the puzzle is released.
          </p>
        </div>
      </div>
    </div>
  )
}

export function StatsDisplay({ stats, allWords, foundWords, className }: Props) {
  if (!stats) return null

  const { n, numberOfUsers } = stats

  // Create a set of found words for quick lookup (case-insensitive)
  const foundWordsSet = new Set(foundWords.map(w => w.toLowerCase()))

  // Calculate word stats and sort by popularity (most found first)
  // Use `n` (sample size) as denominator since answer counts are based on that sample
  const wordStats = allWords
    .map(word => {
      const count = stats.answers[word] ?? 0
      const pct = n > 0 ? (count / n) * 100 : 0
      const isFound = foundWordsSet.has(word.toLowerCase())
      return { word, count, pct, isFound }
    })
    .sort((a, b) => b.pct - a.pct) // Most popular first

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          You vs other players
        </h2>
        <span className="text-muted-foreground text-xs">
          {numberOfUsers.toLocaleString()} players
        </span>
      </div>

      {/* Word popularity chart */}
      <div className="space-y-1">
        {wordStats.map(({ word, pct, isFound }) => (
          <WordBar
            key={word}
            word={word}
            percentage={pct}
            isFound={isFound}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual word bar showing percentage of players who found it
 */
function WordBar({ word, percentage, isFound }: WordBarProps) {
  const display = formatWordDisplay(word, isFound)

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Word display - fixed width for alignment */}
      <span
        className={cn(
          "w-24 shrink-0 truncate font-mono text-xs",
          isFound ? "text-foreground" : "text-muted-foreground"
        )}
        title={isFound ? word : `${word.length}-letter word starting with ${word[0].toUpperCase()}`}
      >
        {display}
      </span>

      {/* Bar container */}
      <div className="bg-muted relative h-4 flex-1 overflow-hidden rounded">
        {/* Fill bar */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded transition-all",
            isFound ? "bg-primary" : "bg-muted-foreground/30"
          )}
          style={{ width: `${Math.max(percentage, 0.5)}%` }}
        />

        {/* Percentage label */}
        <span
          className={cn(
            "absolute inset-y-0 right-1 flex items-center text-xs",
            percentage > 50 ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {percentage >= 10 ? `${Math.round(percentage)}%` : `${percentage.toFixed(1)}%`}
        </span>
      </div>
    </div>
  )
}

type Props = {
  stats: PuzzleStats | null
  allWords: string[]
  foundWords: string[]
  className?: string
}

type WordBarProps = {
  word: string
  percentage: number
  isFound: boolean
}
