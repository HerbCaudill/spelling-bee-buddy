import { cn } from "@/lib/utils"
import type { PuzzleStats } from "@/types"

/**
 * Format a percentage with one decimal place
 */
function formatPercent(count: number, total: number): string {
  if (total === 0) return "0%"
  const pct = (count / total) * 100
  return pct >= 10 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`
}

/**
 * Get rarity label based on percentage of players who found the word
 */
function getRarityLabel(count: number, total: number): { label: string; className: string } {
  const pct = (count / total) * 100

  if (pct >= 90) return { label: "Very common", className: "text-muted-foreground" }
  if (pct >= 70) return { label: "Common", className: "text-muted-foreground" }
  if (pct >= 50) return { label: "Average", className: "text-foreground" }
  if (pct >= 30) return { label: "Uncommon", className: "text-amber-600 dark:text-amber-500" }
  if (pct >= 10) return { label: "Rare", className: "text-orange-600 dark:text-orange-500" }
  return { label: "Very rare", className: "text-red-600 dark:text-red-500" }
}

export function StatsDisplay({ stats, allWords, foundWords, className }: Props) {
  if (!stats) return null

  const { numberOfUsers } = stats

  // Calculate aggregate stats
  const totalWords = allWords.length
  // Only count found words that are actually in the puzzle's answer list
  // (user's found words might include words not in allWords if there's a mismatch)
  const allWordsSet = new Set(allWords.map(w => w.toLowerCase()))
  const validFoundWords = foundWords.filter(w => allWordsSet.has(w.toLowerCase()))
  const foundCount = validFoundWords.length

  // Find the rarest words the user has found
  const foundWordStats = validFoundWords
    .map(word => ({
      word,
      count: stats.answers[word] ?? 0,
      pct: ((stats.answers[word] ?? 0) / numberOfUsers) * 100,
    }))
    .sort((a, b) => a.pct - b.pct)

  const rareFinds = foundWordStats.filter(w => w.pct < 30)

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

      {/* Summary stats */}
      <div className="bg-muted/50 grid grid-cols-3 gap-4 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-semibold">{foundCount}</div>
          <div className="text-muted-foreground text-xs">Words found</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold">{totalWords - foundCount}</div>
          <div className="text-muted-foreground text-xs">Remaining</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold">{rareFinds.length}</div>
          <div className="text-muted-foreground text-xs">Rare finds</div>
        </div>
      </div>

      {/* Rare words found */}
      {rareFinds.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
            Your rare finds
          </h3>
          <div className="flex flex-wrap gap-2">
            {rareFinds.slice(0, 10).map(({ word, count }) => {
              const { className: rarityClass } = getRarityLabel(count, numberOfUsers)
              return (
                <span
                  key={word}
                  className={cn("bg-muted rounded px-2 py-1 text-xs font-medium", rarityClass)}
                >
                  {word}
                  <span className="text-muted-foreground ml-1 opacity-70">
                    {formatPercent(count, numberOfUsers)}
                  </span>
                </span>
              )
            })}
            {rareFinds.length > 10 && (
              <span className="text-muted-foreground self-center text-xs">
                +{rareFinds.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hardest unfound words */}
      {foundCount < totalWords && (
        <HardestUnfoundWords stats={stats} allWords={allWords} foundWords={foundWords} />
      )}
    </div>
  )
}

function HardestUnfoundWords({ stats, allWords, foundWords }: HardestUnfoundWordsProps) {
  const { numberOfUsers } = stats
  const foundSet = new Set(foundWords.map(w => w.toLowerCase()))

  // Find unfound words sorted by rarity (most common first, since those are "easiest")
  const unfoundStats = allWords
    .filter(word => !foundSet.has(word.toLowerCase()))
    .map(word => ({
      word,
      count: stats.answers[word] ?? 0,
      pct: ((stats.answers[word] ?? 0) / numberOfUsers) * 100,
    }))
    .sort((a, b) => b.pct - a.pct) // Most found first (you're missing these common ones!)

  const commonMissing = unfoundStats.filter(w => w.pct >= 50).slice(0, 5)

  if (commonMissing.length === 0) return null

  return (
    <div>
      <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
        Commonly found (you're missing)
      </h3>
      <div className="flex flex-wrap gap-2">
        {commonMissing.map(({ word, count }) => (
          <span key={word} className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
            {word}
            <span className="ml-1 opacity-70">{formatPercent(count, numberOfUsers)}</span>
          </span>
        ))}
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

type HardestUnfoundWordsProps = {
  stats: PuzzleStats
  allWords: string[]
  foundWords: string[]
}
