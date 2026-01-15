import { cn } from "@/lib/utils"
import { getRank, getPointsToNextRank, getPangramsFound } from "@/lib/utils"
import type { Rank } from "@/types"

/**
 * All possible ranks in order of progression
 */
const RANKS: Rank[] = [
  "Beginner",
  "Getting Warm",
  "Moving Up",
  "Good",
  "Solid",
  "Nice",
  "Great",
  "Amazing",
  "Genius",
  "Queen Bee",
]

/**
 * Rank thresholds as percentages of max points
 */
const RANK_THRESHOLDS: Record<Rank, number> = {
  Beginner: 0,
  "Getting Warm": 2,
  "Moving Up": 5,
  Good: 8,
  Solid: 15,
  Nice: 25,
  Great: 40,
  Amazing: 50,
  Genius: 70,
  "Queen Bee": 100,
}

export interface ProgressBarProps {
  /** Current points earned by the user */
  currentPoints: number
  /** Maximum possible points for the puzzle */
  maxPoints: number
  /** List of all pangrams in the puzzle */
  pangrams?: string[]
  /** List of words the user has found */
  foundWords?: string[]
  /** Optional className for the container */
  className?: string
}

/**
 * Progress bar showing user's rank and points progress
 *
 * Displays:
 * - Current rank name
 * - Visual progress bar with rank markers
 * - Current points and points needed for next rank
 * - Pangram progress (if pangrams provided)
 */
export function ProgressBar({
  currentPoints,
  maxPoints,
  pangrams = [],
  foundWords = [],
  className,
}: ProgressBarProps) {
  const currentRank = getRank(currentPoints, maxPoints)
  const nextRankInfo = getPointsToNextRank(currentPoints, maxPoints)
  const pangramsFound = getPangramsFound(foundWords, pangrams)
  const totalPangrams = pangrams.length
  const foundPangramCount = pangramsFound.length

  // Calculate percentage for progress bar
  const percentage = maxPoints > 0 ? (currentPoints / maxPoints) * 100 : 0

  return (
    <div className={cn("space-y-2", className)}>
      {/* Rank display */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">{currentRank}</span>
        <div className="flex items-center gap-4 text-sm">
          {totalPangrams > 0 && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${foundPangramCount} of ${totalPangrams} pangram${totalPangrams === 1 ? "" : "s"} found`}
            >
              {Array.from({ length: totalPangrams }, (_, i) => {
                const isFound = i < foundPangramCount
                return (
                  <Hexagon
                    key={i}
                    filled={isFound}
                    className={cn(
                      "h-3.5 w-3.5",
                      isFound ? "text-accent" : "text-muted-foreground/40",
                    )}
                  />
                )
              })}
            </span>
          )}
          <span className="text-muted-foreground">
            {currentPoints} / {maxPoints} points
          </span>
        </div>
      </div>

      {/* Progress bar with rank markers */}
      <div className="relative">
        {/* Background track */}
        <div className="bg-secondary h-3 rounded-full">
          {/* Filled progress */}
          <div
            className="bg-accent h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Rank markers */}
        <div className="absolute inset-0 flex items-center">
          {RANKS.map(rank => {
            const threshold = RANK_THRESHOLDS[rank]
            // Skip 0% and 100% markers for cleaner look
            if (threshold === 0 || threshold === 100) return null

            const isAchieved = maxPoints > 0 && currentPoints >= (threshold / 100) * maxPoints

            return (
              <div key={rank} className="absolute h-full" style={{ left: `${threshold}%` }}>
                <div
                  className={cn(
                    "h-3 w-0.5 rounded-full",
                    isAchieved ? "bg-white/70" : "bg-white/30",
                  )}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Next rank info */}
      {nextRankInfo && (
        <div className="text-muted-foreground text-sm">
          <span className="font-medium">{nextRankInfo.pointsNeeded}</span> points to{" "}
          <span className="font-medium">{nextRankInfo.nextRank}</span>
        </div>
      )}

      {/* Queen Bee celebration */}
      {currentRank === "Queen Bee" && (
        <div className="text-primary text-sm font-medium">
          🐝 Congratulations! You found all the words!
        </div>
      )}
    </div>
  )
}

interface HexagonProps {
  filled: boolean
  className?: string
}

/**
 * A small hexagon icon for pangram progress display
 */
function Hexagon({ filled, className }: HexagonProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" />
    </svg>
  )
}
