import { cn } from "@/lib/utils"
import { buildWordGrid, getWordLengths, getStartingLetters } from "@/lib/utils"

export interface WordGridProps {
  /** All valid words for the puzzle */
  allWords: string[]
  /** Words the user has found */
  foundWords: string[]
  /** Optional className for the container */
  className?: string
}

/**
 * Grid showing word counts by starting letter and word length
 *
 * Displays rows like:
 *   A │ 4 ●●○ 5 ●●●○ 6 ○○
 *   B │ 4 ○○○ 5 ●○
 *
 * Where ● = found word, ○ = unfound word
 * Uses a table with borders for proper alignment
 */
export function WordGrid({ allWords, foundWords, className }: WordGridProps) {
  // Get unique lengths and letters for headers
  const lengths = getWordLengths(allWords)
  const letters = getStartingLetters(allWords)

  // Build the grid data
  const gridCells = buildWordGrid(allWords, foundWords)

  // Create a lookup map for quick access
  const cellMap = new Map(gridCells.map(cell => [`${cell.letter}-${cell.length}`, cell]))

  // Empty state
  if (allWords.length === 0) {
    return (
      <div className={cn("text-muted-foreground py-8 text-center", className)}>
        No puzzle data available
      </div>
    )
  }

  return (
    <table
      className={cn("border-border border-collapse border", className)}
      role="grid"
      aria-label="Word grid"
    >
      <tbody>
        {/* Data rows */}
        {letters.map((letter, index) => {
          // Get all length groups for this letter that have words
          const lengthGroups = lengths
            .map(length => {
              const cell = cellMap.get(`${letter}-${length}`)
              return cell ? { length, found: cell.found, total: cell.total } : null
            })
            .filter(
              (group): group is { length: number; found: number; total: number } => group !== null,
            )

          const isLastRow = index === letters.length - 1
          return (
            <tr key={letter} role="row" className={cn(!isLastRow && "border-border border-b")}>
              {/* Letter header */}
              <th
                className="text-muted-foreground border-border w-6 border-r pr-3 text-left font-bold"
                role="rowheader"
                aria-label={`Letter ${letter}`}
              >
                {letter}
              </th>
              {/* Length groups with dots */}
              <td className="py-1 pl-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {lengthGroups.map(({ length, found, total }) => (
                    <LengthGroup key={length} length={length} found={found} total={total} />
                  ))}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface LengthGroupProps {
  length: number
  found: number
  total: number
}

/**
 * A group showing the length number followed by dots for each word
 * e.g., "4 ●●○" means 2 found and 1 unfound 4-letter words
 */
function LengthGroup({ length, found, total }: LengthGroupProps) {
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
      aria-label={`${length}-letter words: ${found} of ${total} found${isComplete ? ", complete" : ""}`}
    >
      <span
        className={cn("text-muted-foreground text-xs font-medium", isComplete && "text-accent")}
      >
        {length}
      </span>
      <span className="inline-flex gap-px">{dots}</span>
    </span>
  )
}
