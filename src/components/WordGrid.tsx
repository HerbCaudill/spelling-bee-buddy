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
 * Matrix grid showing word counts by starting letter (rows) and word length (columns)
 *
 * Displays a table like:
 *     4   5   7
 * A │ ●○  ●
 * B │ ●   ○   ○
 * C │ ○       ○
 *
 * Where ● = found word, ○ = unfound word
 */
export function WordGrid({ allWords, foundWords, className }: WordGridProps) {
  const lengths = getWordLengths(allWords)
  const letters = getStartingLetters(allWords)

  const gridCells = buildWordGrid(allWords, foundWords)

  const cellMap = new Map(gridCells.map(cell => [`${cell.letter}-${cell.length}`, cell]))

  if (allWords.length === 0) {
    return (
      <div className={cn("text-muted-foreground py-8 text-center", className)}>
        No puzzle data available
      </div>
    )
  }

  return (
    <table
      className={cn("border-border w-full border-collapse border", className)}
      role="grid"
      aria-label="Word grid"
    >
      <thead>
        <tr role="row" className="border-border border-b">
          {/* Empty corner cell */}
          <th className="border-border w-6 border-r px-3" aria-hidden="true" />
          {/* Column headers for each word length */}
          {lengths.map(length => (
            <th
              key={length}
              className="text-muted-foreground px-2 py-1 text-center text-xs font-medium"
              role="columnheader"
              aria-label={`${length}-letter words`}
            >
              {length}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {letters.map((letter, index) => {
          const isLastRow = index === letters.length - 1
          return (
            <tr key={letter} role="row" className={cn(!isLastRow && "border-border border-b")}>
              {/* Row header: starting letter */}
              <th
                className="text-muted-foreground border-border w-6 border-r px-3 text-center text-sm font-bold"
                role="rowheader"
                aria-label={`Letter ${letter}`}
              >
                {letter}
              </th>
              {/* One cell per length column */}
              {lengths.map(length => {
                const cell = cellMap.get(`${letter}-${length}`)
                if (!cell) {
                  return (
                    <td
                      key={length}
                      className="px-2 py-1 text-center"
                      role="cell"
                      aria-label={`No ${length}-letter ${letter} words`}
                    />
                  )
                }
                return <GridCell key={length} cell={cell} />
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface GridCellProps {
  cell: { letter: string; length: number; found: number; total: number }
}

function GridCell({ cell }: GridCellProps) {
  const { letter, length, found, total } = cell
  const isComplete = found === total

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

  return (
    <td
      className="px-2 py-1 text-center"
      role="cell"
      aria-label={`${length}-letter ${letter} words: ${found} of ${total} found${isComplete ? ", complete" : ""}`}
    >
      <span className="inline-flex gap-px">{dots}</span>
    </td>
  )
}
