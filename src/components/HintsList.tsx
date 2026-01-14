import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { HintsByPrefix } from "@/types"

export interface HintsListProps {
  /** Hints grouped by two-letter prefix */
  hints: HintsByPrefix
  /** Words the user has found (to show remaining hints) */
  foundWords?: string[]
  /** Optional className for the container */
  className?: string
}

/**
 * Collapsible list of hints organized by two-letter prefix
 *
 * Displays:
 * - Two-letter prefixes as collapsible section headers
 * - Hints with word length indicator
 * - Found/total count for each prefix
 */
export function HintsList({
  hints,
  foundWords = [],
  className,
}: HintsListProps) {
  const [expandedPrefixes, setExpandedPrefixes] = useState<Set<string>>(
    new Set()
  )

  // Normalize found words for comparison
  const foundSet = new Set(foundWords.map((w) => w.toLowerCase()))

  // Sort prefixes alphabetically
  const sortedPrefixes = Object.keys(hints).sort()

  // Toggle a prefix's expanded state
  const togglePrefix = (prefix: string) => {
    setExpandedPrefixes((prev) => {
      const next = new Set(prev)
      if (next.has(prefix)) {
        next.delete(prefix)
      } else {
        next.add(prefix)
      }
      return next
    })
  }

  // Expand all prefixes
  const expandAll = () => {
    setExpandedPrefixes(new Set(sortedPrefixes))
  }

  // Collapse all prefixes
  const collapseAll = () => {
    setExpandedPrefixes(new Set())
  }

  // Empty state
  if (sortedPrefixes.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        No hints available
      </div>
    )
  }

  // Count remaining hints for a prefix (hints for words not yet found)
  const getRemainingCount = (prefix: string): { remaining: number; total: number } => {
    const prefixHints = hints[prefix] || []
    // We can't directly match hints to found words without the actual words,
    // so we show total hints per prefix
    return { remaining: prefixHints.length, total: prefixHints.length }
  }

  // Check if all hints in a prefix might be "found" (we can't know for sure without words)
  // For now, we just check if user found words with this prefix
  const getPrefixFoundCount = (prefix: string): number => {
    let count = 0
    for (const word of foundSet) {
      if (word.slice(0, 2).toUpperCase() === prefix) {
        count++
      }
    }
    return count
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Hints
        </h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Expand all sections"
          >
            Expand all
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Collapse all sections"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-1" role="list" aria-label="Hints by prefix">
        {sortedPrefixes.map((prefix) => {
          const isExpanded = expandedPrefixes.has(prefix)
          const prefixHints = hints[prefix] || []
          const foundCount = getPrefixFoundCount(prefix)
          const totalHints = prefixHints.length
          const isComplete = foundCount >= totalHints && totalHints > 0

          return (
            <div key={prefix} className="border rounded-md overflow-hidden">
              {/* Prefix header - clickable to toggle */}
              <button
                onClick={() => togglePrefix(prefix)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
                  "hover:bg-muted/50",
                  isComplete
                    ? "bg-primary/10 text-primary"
                    : "bg-background text-foreground"
                )}
                aria-expanded={isExpanded}
                aria-controls={`hints-${prefix}`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="size-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="size-4" aria-hidden="true" />
                  )}
                  <span className="font-medium">{prefix}</span>
                </div>
                <span
                  className={cn(
                    "text-xs",
                    isComplete ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <span aria-label={`${foundCount} of ${totalHints}, complete`}>
                      ✓ {totalHints}
                    </span>
                  ) : (
                    <span aria-label={`${foundCount} of ${totalHints} found`}>
                      {foundCount}/{totalHints}
                    </span>
                  )}
                </span>
              </button>

              {/* Hints list - collapsible */}
              {isExpanded && (
                <ul
                  id={`hints-${prefix}`}
                  className="border-t bg-muted/30 divide-y divide-border"
                  role="list"
                >
                  {prefixHints.map((hint, index) => (
                    <li
                      key={`${prefix}-${index}`}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span className="text-foreground">{hint.hint}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {hint.length} letters
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
