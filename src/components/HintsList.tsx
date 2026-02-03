import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
} from "lucide-react"
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
  const [showFoundWords, setShowFoundWords] = useState(false)

  // Normalize found words for comparison (uppercase to match hint.word)
  const foundSet = new Set(foundWords.map(w => w.toUpperCase()))

  // Sort prefixes alphabetically
  const sortedPrefixes = Object.keys(hints).sort()

  /** Filter hints to only show ones for words the user hasn't found yet. */
  const getUnfoundHints = (prefixHints: (typeof hints)[string]) => {
    return prefixHints.filter(h => !foundSet.has(h.word))
  }

  /** Get hints to display based on showFoundWords toggle. */
  const getDisplayHints = (prefixHints: (typeof hints)[string]) => {
    if (showFoundWords) {
      // Show all hints, with found ones marked
      return prefixHints.map(h => ({
        ...h,
        isFound: foundSet.has(h.word),
      }))
    }
    // Only show unfound hints
    return getUnfoundHints(prefixHints).map(h => ({ ...h, isFound: false }))
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

  /** Count how many hints for a prefix the user has already found. */
  const getPrefixFoundCount = (prefixHints: (typeof hints)[string]): number => {
    return prefixHints.filter(h => foundSet.has(h.word)).length
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Hints
        </h2>
        <div className="inline-flex -space-x-px" role="group">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="rounded-r-none focus:z-10"
            aria-label="Expand all sections"
          >
            <ChevronsUpDown className="size-4" />
            <span className="hidden sm:inline">Expand</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="rounded-none focus:z-10"
            aria-label="Collapse all sections"
          >
            <ChevronsDownUp className="size-4" />
            <span className="hidden sm:inline">Collapse</span>
          </Button>
          <Button
            variant={showFoundWords ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFoundWords(!showFoundWords)}
            className="rounded-l-none focus:z-10"
            aria-label={showFoundWords ? "Hide found words" : "Show found words"}
            aria-pressed={showFoundWords}
          >
            {showFoundWords ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            <span className="hidden sm:inline">Found</span>
          </Button>
        </div>
      </div>

      <div className="space-y-1" role="list" aria-label="Hints by prefix">
        {sortedPrefixes.map(prefix => {
          const isExpanded = expandedPrefixes.has(prefix)
          const prefixHints = hints[prefix] || []
          const foundCount = getPrefixFoundCount(prefixHints)
          const totalHints = prefixHints.length
          const isComplete = foundCount >= totalHints && totalHints > 0

          // Don't show completed prefixes unless showing found words
          if (isComplete && !showFoundWords) {
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

              {/* Hints list - collapsible */}
              {isExpanded && (
                <ul
                  id={`hints-${prefix}`}
                  className="bg-muted/30 divide-border divide-y border-t"
                  role="list"
                >
                  {getDisplayHints(prefixHints).map((hint, index) => (
                    <li
                      key={`${prefix}-${index}`}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm",
                        hint.isFound && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-xs",
                          hint.isFound ? "text-muted-foreground/50" : "text-muted-foreground",
                        )}
                        aria-label={`${hint.length} letters`}
                      >
                        {hint.length}
                      </span>
                      <span
                        className={cn(
                          hint.isFound
                            ? "text-muted-foreground line-through"
                            : "text-foreground",
                        )}
                      >
                        {hint.hint}
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
