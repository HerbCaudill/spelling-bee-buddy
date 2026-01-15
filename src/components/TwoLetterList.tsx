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
 * List showing word counts by two-letter prefix, grouped by first letter
 *
 * Displays rows like:
 *   A │ AB ●●○ AC ●●●○ AD ○○
 *   B │ BA ○○○ BE ●○
 *
 * Where ● = found word, ○ = unfound word
 * Uses a table with borders for proper alignment
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

  // Group by first letter
  const groupsByFirstLetter = new Map<string, typeof groups>()
  for (const group of groups) {
    const firstLetter = group.prefix[0]
    const existing = groupsByFirstLetter.get(firstLetter) || []
    existing.push(group)
    groupsByFirstLetter.set(firstLetter, existing)
  }

  // Get sorted first letters
  const firstLetters = Array.from(groupsByFirstLetter.keys()).sort()

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        Two-letter list
      </h2>
      <table className="border-collapse" role="grid" aria-label="Two-letter list">
        <tbody>
          {firstLetters.map(letter => {
            const prefixGroups = groupsByFirstLetter.get(letter) || []
            return (
              <tr key={letter} role="row">
                {/* Letter header */}
                <th
                  className="text-muted-foreground w-6 border-r border-border pr-3 text-left font-bold"
                  role="rowheader"
                  aria-label={`Letter ${letter}`}
                >
                  {letter}
                </th>
                {/* Prefix groups with dots */}
                <td className="py-1 pl-3" role="presentation">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {prefixGroups.map(group => (
                      <PrefixGroup
                        key={group.prefix}
                        prefix={group.prefix}
                        found={group.found}
                        total={group.total}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface PrefixGroupProps {
  prefix: string
  found: number
  total: number
}

/**
 * A group showing the prefix followed by dots for each word
 * e.g., "AB ●●○" means 2 found and 1 unfound words starting with AB
 */
function PrefixGroup({ prefix, found, total }: PrefixGroupProps) {
  const dots = []
  for (let i = 0; i < total; i++) {
    const isFound = i < found
    dots.push(
      <span
        key={i}
        className={cn("text-xs", isFound ? "text-accent" : "text-muted-foreground/40")}
        aria-hidden="true"
      >
        {isFound ? "●" : "○"}
      </span>,
    )
  }

  const isComplete = found === total

  return (
    <span
      className="inline-flex items-center gap-1"
      role="cell"
      aria-label={`${prefix}: ${found} of ${total} found${isComplete ? ", complete" : ""}`}
    >
      <span
        className={cn("text-muted-foreground text-xs font-medium", isComplete && "text-accent")}
      >
        {prefix}
      </span>
      <span className="inline-flex gap-px">{dots}</span>
    </span>
  )
}
