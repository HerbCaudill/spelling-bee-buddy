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
 * Displays:
 * - Column headers: word lengths (4, 5, 6, etc.) plus total
 * - Row headers: starting letters (A, B, C, etc.)
 * - Cells: found/total count for each letter × length combination
 * - Bottom row: totals for each column
 */
export function WordGrid({ allWords, foundWords, className }: WordGridProps) {
  // Get unique lengths and letters for headers
  const lengths = getWordLengths(allWords)
  const letters = getStartingLetters(allWords)

  // Build the grid data
  const gridCells = buildWordGrid(allWords, foundWords)

  // Create a lookup map for quick access
  const cellMap = new Map(gridCells.map(cell => [`${cell.letter}-${cell.length}`, cell]))

  // Calculate totals by letter (for row totals)
  const letterTotals = new Map<string, { found: number; total: number }>()
  for (const letter of letters) {
    let found = 0
    let total = 0
    for (const length of lengths) {
      const cell = cellMap.get(`${letter}-${length}`)
      if (cell) {
        found += cell.found
        total += cell.total
      }
    }
    letterTotals.set(letter, { found, total })
  }

  // Calculate totals by length (for column totals)
  const lengthTotals = new Map<number, { found: number; total: number }>()
  for (const length of lengths) {
    let found = 0
    let total = 0
    for (const letter of letters) {
      const cell = cellMap.get(`${letter}-${length}`)
      if (cell) {
        found += cell.found
        total += cell.total
      }
    }
    lengthTotals.set(length, { found, total })
  }

  // Grand totals
  const grandTotal = {
    found: foundWords.length,
    total: allWords.length,
  }

  // Empty state
  if (allWords.length === 0) {
    return (
      <div className={cn("text-muted-foreground py-8 text-center", className)}>
        No puzzle data available
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="text-muted-foreground p-2 text-left font-medium" />
            {/* Length headers */}
            {lengths.map(length => (
              <th
                key={length}
                className="text-muted-foreground min-w-[3rem] p-2 text-center font-medium"
              >
                {length}
              </th>
            ))}
            {/* Total column header */}
            <th className="min-w-[3rem] p-2 text-center font-semibold">Σ</th>
          </tr>
        </thead>
        <tbody>
          {/* Data rows */}
          {letters.map(letter => (
            <tr key={letter} className="border-border border-t">
              {/* Letter header */}
              <td className="text-muted-foreground p-2 font-medium">{letter}</td>
              {/* Data cells */}
              {lengths.map(length => {
                const cell = cellMap.get(`${letter}-${length}`)
                return (
                  <td key={length} className="p-2 text-center">
                    {cell ?
                      <CellContent found={cell.found} total={cell.total} />
                    : <span className="text-muted-foreground/40">-</span>}
                  </td>
                )
              })}
              {/* Row total */}
              <td className="p-2 text-center font-medium">
                <CellContent
                  found={letterTotals.get(letter)?.found ?? 0}
                  total={letterTotals.get(letter)?.total ?? 0}
                  isTotal
                />
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr className="border-border border-t-2">
            <td className="p-2 font-semibold">Σ</td>
            {lengths.map(length => (
              <td key={length} className="p-2 text-center font-medium">
                <CellContent
                  found={lengthTotals.get(length)?.found ?? 0}
                  total={lengthTotals.get(length)?.total ?? 0}
                  isTotal
                />
              </td>
            ))}
            {/* Grand total */}
            <td className="p-2 text-center font-semibold">
              <CellContent found={grandTotal.found} total={grandTotal.total} isTotal />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

interface CellContentProps {
  found: number
  total: number
  isTotal?: boolean
}

/**
 * Cell content showing found/total or checkmark if complete
 */
function CellContent({ found, total, isTotal = false }: CellContentProps) {
  const isComplete = found === total && total > 0

  if (isComplete) {
    return (
      <span
        className={cn("text-primary", isTotal ? "font-semibold" : "")}
        aria-label={`${found} of ${total} found, complete`}
      >
        ✓
      </span>
    )
  }

  return (
    <span
      className={cn(
        found > 0 ? "text-foreground" : "text-muted-foreground",
        isTotal ? "font-semibold" : "",
      )}
      aria-label={`${found} of ${total} found`}
    >
      {found}/{total}
    </span>
  )
}
