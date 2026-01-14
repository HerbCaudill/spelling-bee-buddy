import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Rank, WordGridCell, TwoLetterGroup } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rank thresholds as percentage of max points (in ascending order)
 */
const RANK_THRESHOLDS: { rank: Rank; threshold: number }[] = [
  { rank: "Beginner", threshold: 0 },
  { rank: "Getting Warm", threshold: 2 },
  { rank: "Moving Up", threshold: 5 },
  { rank: "Good", threshold: 8 },
  { rank: "Solid", threshold: 15 },
  { rank: "Nice", threshold: 25 },
  { rank: "Great", threshold: 40 },
  { rank: "Amazing", threshold: 50 },
  { rank: "Genius", threshold: 70 },
  { rank: "Queen Bee", threshold: 100 },
]

/**
 * Calculate points for a single word
 * - 4-letter words = 1 point
 * - 5+ letter words = 1 point per letter
 * - Pangrams get +7 bonus points
 */
export function calculateWordPoints(word: string, pangrams: string[]): number {
  const isPangram = pangrams.includes(word.toLowerCase())
  const basePoints = word.length === 4 ? 1 : word.length
  return isPangram ? basePoints + 7 : basePoints
}

/**
 * Calculate total points for a list of words
 */
export function calculateTotalPoints(
  words: string[],
  pangrams: string[]
): number {
  return words.reduce(
    (total, word) => total + calculateWordPoints(word, pangrams),
    0
  )
}

/**
 * Get the current rank based on points
 */
export function getRank(currentPoints: number, maxPoints: number): Rank {
  if (maxPoints === 0) return "Beginner"

  const percentage = (currentPoints / maxPoints) * 100

  // Find the highest rank the player has achieved
  let currentRank: Rank = "Beginner"
  for (const { rank, threshold } of RANK_THRESHOLDS) {
    if (percentage >= threshold) {
      currentRank = rank
    } else {
      break
    }
  }

  return currentRank
}

/**
 * Get points needed to reach the next rank
 */
export function getPointsToNextRank(
  currentPoints: number,
  maxPoints: number
): { nextRank: Rank; pointsNeeded: number } | null {
  if (maxPoints === 0) return null

  const percentage = (currentPoints / maxPoints) * 100

  // Find the next rank threshold
  for (const { rank, threshold } of RANK_THRESHOLDS) {
    if (percentage < threshold) {
      const pointsNeeded = Math.ceil((threshold / 100) * maxPoints) - currentPoints
      return { nextRank: rank, pointsNeeded }
    }
  }

  // Already at Queen Bee
  return null
}

/**
 * Get the two-letter prefix of a word
 */
export function getTwoLetterPrefix(word: string): string {
  return word.slice(0, 2).toUpperCase()
}

/**
 * Group words by their starting letter and length for the word grid
 */
export function buildWordGrid(
  allWords: string[],
  foundWords: string[]
): WordGridCell[] {
  const foundSet = new Set(foundWords.map((w) => w.toLowerCase()))
  const grid: Map<string, WordGridCell> = new Map()

  for (const word of allWords) {
    const letter = word[0].toUpperCase()
    const length = word.length
    const key = `${letter}-${length}`

    const existing = grid.get(key)
    const isFound = foundSet.has(word.toLowerCase())

    if (existing) {
      existing.total += 1
      if (isFound) existing.found += 1
    } else {
      grid.set(key, {
        letter,
        length,
        total: 1,
        found: isFound ? 1 : 0,
      })
    }
  }

  // Sort by letter, then by length
  return Array.from(grid.values()).sort((a, b) => {
    if (a.letter !== b.letter) return a.letter.localeCompare(b.letter)
    return a.length - b.length
  })
}

/**
 * Get unique word lengths from the puzzle (for grid column headers)
 */
export function getWordLengths(words: string[]): number[] {
  const lengths = new Set(words.map((w) => w.length))
  return Array.from(lengths).sort((a, b) => a - b)
}

/**
 * Get unique starting letters from the puzzle (for grid row headers)
 */
export function getStartingLetters(words: string[]): string[] {
  const letters = new Set(words.map((w) => w[0].toUpperCase()))
  return Array.from(letters).sort()
}

/**
 * Group words by their two-letter prefix
 */
export function buildTwoLetterGroups(
  allWords: string[],
  foundWords: string[]
): TwoLetterGroup[] {
  const foundSet = new Set(foundWords.map((w) => w.toLowerCase()))
  const groups: Map<string, TwoLetterGroup> = new Map()

  for (const word of allWords) {
    const prefix = getTwoLetterPrefix(word)
    const existing = groups.get(prefix)
    const isFound = foundSet.has(word.toLowerCase())

    if (existing) {
      existing.total += 1
      if (isFound) existing.found += 1
    } else {
      groups.set(prefix, {
        prefix,
        total: 1,
        found: isFound ? 1 : 0,
      })
    }
  }

  // Sort alphabetically by prefix
  return Array.from(groups.values()).sort((a, b) =>
    a.prefix.localeCompare(b.prefix)
  )
}
