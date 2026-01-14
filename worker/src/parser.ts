/**
 * Parser utilities for extracting puzzle data from NYT Spelling Bee page
 */

import type { GameData } from "./types"

/**
 * Parse window.gameData from the NYT Spelling Bee page HTML
 */
export function parseGameData(html: string): GameData | null {
  // The game data is embedded in a script tag as: window.gameData = {...}
  // We use a greedy match for the JSON object because it contains nested braces
  const gameDataMatch = html.match(
    /window\.gameData\s*=\s*(\{[\s\S]*\})\s*;?\s*<\/script>/i
  )

  if (!gameDataMatch) {
    return null
  }

  try {
    const rawData = JSON.parse(gameDataMatch[1])

    // Validate that we have the expected structure
    if (!rawData.today) {
      return null
    }

    const today = rawData.today
    const gameData: GameData = {
      today: {
        displayWeekday: today.displayWeekday,
        displayDate: today.displayDate,
        printDate: today.printDate,
        centerLetter: today.centerLetter,
        outerLetters: today.outerLetters,
        validLetters: today.validLetters,
        pangrams: today.pangrams,
        answers: today.answers,
        id: today.id,
      },
    }

    return gameData
  } catch {
    return null
  }
}
