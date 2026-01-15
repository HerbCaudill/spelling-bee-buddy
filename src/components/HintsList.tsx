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
export function HintsList({ hints, foundWords = [], className }: HintsListProps) {
  const [expandedPrefixes, setExpandedPrefixes] = useState<Set<string>>(new Set())

  // Normalize found words for comparison
  const foundSet = new Set(foundWords.map(w => w.toLowerCase()))

  // Sort prefixes alphabetically
  const sortedPrefixes = Object.keys(hints).sort()

  // Get found words for a given prefix, grouped by length
  const getFoundWordsByLength = (prefix: string): Map<number, number> => {
    const countByLength = new Map<number, number>()
    for (const word of foundSet) {
      if (word.slice(0, 2).toUpperCase() === prefix) {
        const len = word.length
        countByLength.set(len, (countByLength.get(len) || 0) + 1)
      }
    }
    return countByLength
  }

  // Filter hints to only show unfound ones
  // Strategy: For each prefix/length combination, show hints only if there are more hints
  // of that length than found words of that length for that prefix
  const getUnfoundHints = (prefix: string, prefixHints: (typeof hints)[string]) => {
    const foundByLength = getFoundWordsByLength(prefix)

    // Group hints by length
    const hintsByLength = new Map<number, typeof prefixHints>()
    for (const hint of prefixHints) {
      const existing = hintsByLength.get(hint.length) || []
      existing.push(hint)
      hintsByLength.set(hint.length, existing)
    }

    // For each length, only keep hints if there are more hints than found words
    const unfoundHints: typeof prefixHints = []
    for (const [length, hintsOfLength] of hintsByLength) {
      const foundCount = foundByLength.get(length) || 0
      // Skip found hints (take hints starting from foundCount index)
      const remaining = hintsOfLength.slice(foundCount)
      unfoundHints.push(...remaining)
    }

    // Sort by length to maintain consistent order
    return unfoundHints.sort((a, b) => a.length - b.length)
  }

  // Toggle a prefix's expanded state
  const togglePrefix = (prefix: string) => {
    setExpandedPrefixes(prev => {
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
      <div className={cn("text-muted-foreground py-8 text-center", className)}>
        No hints available
      </div>
    )
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
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Hints
        </h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            aria-label="Expand all sections"
          >
            Expand all
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            aria-label="Collapse all sections"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-1" role="list" aria-label="Hints by prefix">
        {sortedPrefixes.map(prefix => {
          const isExpanded = expandedPrefixes.has(prefix)
          const prefixHints = hints[prefix] || []
          const foundCount = getPrefixFoundCount(prefix)
          const totalHints = prefixHints.length
          const isComplete = foundCount >= totalHints && totalHints > 0

          // Don't show completed prefixes
          if (isComplete) {
            return null
          }

          return (
            <div key={prefix} className="overflow-hidden rounded-md border">
              {/* Prefix header - clickable to toggle */}
              <button
                onClick={() => togglePrefix(prefix)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left transition-colors",
                  "hover:bg-muted/50",
                  isComplete ? "bg-primary/10 text-primary" : "bg-background text-foreground",
                )}
                aria-expanded={isExpanded}
                aria-controls={`hints-${prefix}`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ?
                    <ChevronDown className="size-4" aria-hidden="true" />
                  : <ChevronRight className="size-4" aria-hidden="true" />}
                  <span className="font-medium">{prefix}</span>
                </div>
                <span
                  className={cn("text-xs", isComplete ? "text-primary" : "text-muted-foreground")}
                >
                  {isComplete ?
                    <span aria-label={`${foundCount} of ${totalHints}, complete`}>
                      ✓ {totalHints}
                    </span>
                  : <span aria-label={`${foundCount} of ${totalHints} found`}>
                      {foundCount}/{totalHints}
                    </span>
                  }
                </span>
              </button>

              {/* Hints list - collapsible, showing only unfound hints */}
              {isExpanded && (
                <ul
                  id={`hints-${prefix}`}
                  className="bg-muted/30 divide-border divide-y border-t"
                  role="list"
                >
                  {getUnfoundHints(prefix, prefixHints).map((hint, index) => (
                    <li
                      key={`${prefix}-${index}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <span
                        className="text-muted-foreground font-mono text-xs"
                        aria-label={`${hint.length} letters`}
                      >
                        {hint.length}
                      </span>
                      <span className="text-foreground">{hint.hint}</span>
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
